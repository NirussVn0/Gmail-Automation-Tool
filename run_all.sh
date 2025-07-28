#!/bin/bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR"
readonly BACKEND_DIR="$PROJECT_ROOT"
readonly FRONTEND_DIR="$PROJECT_ROOT/dashboard"
readonly LOG_DIR="$PROJECT_ROOT/logs"
readonly CACHE_DIR="$PROJECT_ROOT/.cache"

readonly BACKEND_PORT=8001
readonly FRONTEND_PORT=3001
readonly PYTHON_MIN_VERSION="3.8"
readonly NODE_MIN_VERSION="18"

mkdir -p "$LOG_DIR" "$CACHE_DIR"

log_step() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [STEP] $*" | tee -a "$LOG_DIR/setup.log"
}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*" | tee -a "$LOG_DIR/setup.log"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" | tee -a "$LOG_DIR/setup.log" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $*" | tee -a "$LOG_DIR/setup.log"
}

check_python_version() {
    local python_cmd="$1"
    local version
    
    if ! command -v "$python_cmd" &> /dev/null; then
        return 1
    fi
    
    version=$($python_cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    
    if [[ "$(printf '%s\n' "$PYTHON_MIN_VERSION" "$version" | sort -V | head -n1)" == "$PYTHON_MIN_VERSION" ]]; then
        echo "$version"
        return 0
    else
        return 1
    fi
}

find_compatible_python() {
    local python_candidates=("python3.12" "python3.11" "python3.10" "python3.9" "python3.8" "python3" "python")

    for python_cmd in "${python_candidates[@]}"; do
        if version=$(check_python_version "$python_cmd"); then
            log_info "Found compatible Python: $python_cmd (version $version)" >&2
            echo "$python_cmd"
            return 0
        fi
    done

    log_error "No compatible Python version found (>= $PYTHON_MIN_VERSION)"
    return 1
}

check_system_dependencies() {
    log_step "Checking system dependencies..."

    # Check for essential system packages
    local missing_packages=()

    # Check for curl
    if ! command -v curl &> /dev/null; then
        missing_packages+=("curl")
    fi

    # Check for build essentials (needed for some Python packages)
    if command -v apt-get &> /dev/null; then
        if ! dpkg -l | grep -q build-essential; then
            missing_packages+=("build-essential")
        fi
        if ! dpkg -l | grep -q python3-dev; then
            missing_packages+=("python3-dev")
        fi
        if ! dpkg -l | grep -q libjpeg-dev; then
            missing_packages+=("libjpeg-dev")
        fi
        if ! dpkg -l | grep -q zlib1g-dev; then
            missing_packages+=("zlib1g-dev")
        fi
    fi

    if [[ ${#missing_packages[@]} -gt 0 ]]; then
        log_info "Installing missing system packages: ${missing_packages[*]}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y "${missing_packages[@]}"
        elif command -v yum &> /dev/null; then
            sudo yum install -y "${missing_packages[@]}"
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y "${missing_packages[@]}"
        else
            log_error "Cannot install system packages automatically. Please install: ${missing_packages[*]}"
        fi
    fi

    log_success "System dependencies checked"
}

install_rust() {
    log_step "Checking Rust installation..."

    if command -v rustc &> /dev/null && command -v cargo &> /dev/null; then
        local rust_version=$(rustc --version)
        log_info "Rust already installed: $rust_version"
        return 0
    fi

    log_info "Installing Rust to local cache..."

    export RUSTUP_HOME="$CACHE_DIR/rustup"
    export CARGO_HOME="$CACHE_DIR/cargo"

    if [[ ! -f "$CACHE_DIR/rustup-init.sh" ]]; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > "$CACHE_DIR/rustup-init.sh"
        chmod +x "$CACHE_DIR/rustup-init.sh"
    fi

    "$CACHE_DIR/rustup-init.sh" -y --no-modify-path --default-toolchain stable

    export PATH="$CARGO_HOME/bin:$PATH"

    log_success "Rust installed successfully"
}

setup_python_environment() {
    log_step "Setting up Python environment..."

    local python_cmd
    if ! python_cmd=$(find_compatible_python); then
        log_error "Failed to find compatible Python version"
        exit 1
    fi

    # Check if venv module is available, install if needed
    if ! "$python_cmd" -m venv --help &>/dev/null; then
        log_info "venv module not available, installing python3-venv..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get update && sudo apt-get install -y python3-venv
        elif command -v yum &>/dev/null; then
            sudo yum install -y python3-venv
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y python3-venv
        else
            log_error "Cannot install python3-venv automatically. Please install it manually."
            exit 1
        fi
    fi

    if [[ ! -d "$BACKEND_DIR/venv" ]]; then
        log_info "Creating Python virtual environment with $python_cmd..."
        if ! "$python_cmd" -m venv "$BACKEND_DIR/venv"; then
            log_error "Failed to create virtual environment"
            exit 1
        fi
    else
        log_info "Python virtual environment already exists"
    fi

    # Activate virtual environment
    if [[ -f "$BACKEND_DIR/venv/bin/activate" ]]; then
        source "$BACKEND_DIR/venv/bin/activate"
        log_info "Virtual environment activated"
    else
        log_error "Virtual environment activation script not found"
        exit 1
    fi

    log_info "Upgrading pip and setuptools..."
    python -m pip install --upgrade pip setuptools wheel
    
    log_info "Installing Python dependencies with compatibility fixes..."

    if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
        local python_version
        python_version=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")

        if [[ "$python_version" == "3.13" ]]; then
            log_info "Python 3.13 detected - using pre-built wheels only"
            python -m pip install --only-binary=all \
                "pydantic>=2.5.0,<3.0.0" \
                "pydantic-settings>=2.1.0" \
                "fastapi>=0.104.0" \
                "uvicorn[standard]>=0.24.0" \
                "python-multipart>=0.0.6" \
                "python-jose[cryptography]>=3.3.0" \
                "passlib[bcrypt]>=1.7.4" \
                "sqlalchemy>=2.0.0" \
                "alembic>=1.12.0" \
                "python-dotenv>=1.0.0" \
                "httpx>=0.25.0" \
                "websockets>=12.0" \
                "cryptography>=41.0.0" \
                "bcrypt>=4.0.0" \
                "email-validator>=2.0.0" \
                "jinja2>=3.1.0" \
                "aiofiles>=23.0.0" \
                "structlog>=23.0.0" \
                "rich>=13.0.0" \
                "selenium>=4.15.0" \
                "undetected-chromedriver>=3.5.0" \
                "requests>=2.31.0" \
                "aiohttp>=3.9.0" \
                "fake-useragent>=1.4.0" \
                "Pillow>=10.0.0"
        else
            log_info "Python $python_version detected - installing from requirements.txt"
            if ! python -m pip install -r "$BACKEND_DIR/requirements.txt"; then
                log_error "Failed to install requirements from requirements.txt"
                log_info "Attempting to install with fallback method..."
                python -m pip install --only-binary=all \
                    "pydantic>=2.5.0,<3.0.0" \
                    "pydantic-settings>=2.1.0" \
                    "fastapi>=0.104.0" \
                    "uvicorn[standard]>=0.24.0" \
                    "python-multipart>=0.0.6" \
                    "python-jose[cryptography]>=3.3.0" \
                    "passlib[bcrypt]>=1.7.4" \
                    "sqlalchemy>=2.0.0" \
                    "alembic>=1.12.0" \
                    "python-dotenv>=1.0.0" \
                    "httpx>=0.25.0" \
                    "websockets>=12.0" \
                    "cryptography>=41.0.0" \
                    "bcrypt>=4.0.0" \
                    "email-validator>=2.0.0" \
                    "jinja2>=3.1.0" \
                    "aiofiles>=23.0.0" \
                    "structlog>=23.0.0" \
                    "rich>=13.0.0" \
                    "selenium>=4.15.0" \
                    "undetected-chromedriver>=3.5.0" \
                    "requests>=2.31.0" \
                    "aiohttp>=3.9.0" \
                    "fake-useragent>=1.4.0" \
                    "Pillow>=10.0.0"
            fi
        fi
    else
        log_info "No requirements.txt found - installing basic FastAPI stack"
        python -m pip install --only-binary=all \
            "fastapi>=0.104.0" \
            "uvicorn[standard]>=0.24.0" \
            "pydantic>=2.5.0,<3.0.0" \
            "Pillow>=10.0.0"
    fi
    
    log_success "Python environment setup complete"
}

setup_node_environment() {
    log_step "Setting up Node.js environment..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js >= $NODE_MIN_VERSION"
        exit 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/v//')
    log_info "Found Node.js version: $node_version"
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install npm"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    if [[ ! -d "node_modules" ]] || [[ ! -f "package-lock.json" ]]; then
        log_info "Installing Node.js dependencies..."
        npm ci --silent || npm install --silent
    else
        log_info "Node.js dependencies already installed"
    fi
    
    log_success "Node.js environment setup complete"
}

kill_port_processes() {
    local port="$1"
    log_info "Killing processes on port $port..."

    # Kill specific processes that might be using the port
    if [[ "$port" == "3001" ]]; then
        pkill -f "next.*dev.*3001" 2>/dev/null || true
        pkill -f "node.*3001" 2>/dev/null || true
        pkill -f "npm.*dev" 2>/dev/null || true
    elif [[ "$port" == "8001" ]]; then
        pkill -f "uvicorn.*8001" 2>/dev/null || true
        pkill -f "uvicorn.*backend.main:app" 2>/dev/null || true
        pkill -f "python.*uvicorn" 2>/dev/null || true
    fi

    sleep 1

    # Get all PIDs using the port
    local pids
    pids=$(lsof -ti :$port 2>/dev/null || true)

    if [[ -n "$pids" ]]; then
        log_info "Found processes: $pids"

        # Try graceful kill first
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 2

        # Check if still running, force kill if needed
        local remaining_pids
        remaining_pids=$(lsof -ti :$port 2>/dev/null || true)

        if [[ -n "$remaining_pids" ]]; then
            log_info "Force killing remaining processes: $remaining_pids"
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
            sleep 2
        fi

        # Final verification with retry
        local attempts=0
        while [[ $attempts -lt 3 ]]; do
            if ! lsof -ti :$port >/dev/null 2>&1; then
                log_success "Port $port is now free"
                return 0
            fi
            log_info "Port $port still in use, retrying... (attempt $((attempts + 1))/3)"
            sleep 1
            ((attempts++))
        done

        log_error "Failed to free port $port after multiple attempts"
        return 1
    else
        log_success "Port $port is already free"
        return 0
    fi
}

check_ports() {
    log_step "Checking port availability..."

    local ports=($BACKEND_PORT $FRONTEND_PORT)
    local ports_in_use=()

    for port in "${ports[@]}"; do
        if lsof -ti :$port >/dev/null 2>&1; then
            ports_in_use+=($port)
            local process_info
            process_info=$(lsof -ti :$port 2>/dev/null | head -1)
            log_warning "Port $port is in use by PID $process_info"
        fi
    done

    if [[ ${#ports_in_use[@]} -gt 0 ]]; then
        log_warning "Found ${#ports_in_use[@]} port(s) in use: ${ports_in_use[*]}"

        # Auto-kill in non-interactive mode or ask user
        if [[ "${AUTO_KILL_PORTS:-}" == "true" ]] || [[ ! -t 0 ]]; then
            log_info "Auto-killing processes on ports: ${ports_in_use[*]}"
            for port in "${ports_in_use[@]}"; do
                kill_port_processes "$port"
            done
        else
            read -p "Do you want to kill the processes using these ports? (y/N): " -n 1 -r
            echo

            if [[ $REPLY =~ ^[Yy]$ ]]; then
                for port in "${ports_in_use[@]}"; do
                    kill_port_processes "$port"
                done
            else
                log_error "Cannot proceed with ports in use. Please free the ports manually."
                log_info "Options to free ports:"
                log_info "  1. Run: ./simple_kill_ports.sh"
                log_info "  2. Run: ./kill_ports.sh ${ports_in_use[*]}"
                log_info "  3. Kill manually:"
                for port in "${ports_in_use[@]}"; do
                    local pids
                    pids=$(lsof -ti :$port 2>/dev/null || true)
                    if [[ -n "$pids" ]]; then
                        log_info "     Port $port: kill $pids"
                    fi
                done
                exit 1
            fi
        fi
    fi

    log_success "All required ports are available"
}

start_backend() {
    log_step "Starting FastAPI backend server..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    export NODE_ENV="${NODE_ENV:-development}"
    export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"
    export SECURITY_SECRET_KEY="dev-secret-key-32-characters-long-secure-random-string-12345"
    export SECURITY_ENCRYPTION_KEY="dev-encryption-key-32-characters-long-secure-random-string"
    export SECURITY_PASSWORD_SALT="dev-password-salt-32-characters-long-secure-random-string"
    export SECURITY_JWT_ALGORITHM="HS256"
    export SECURITY_JWT_EXPIRATION_HOURS="24"
    export DB_URL="sqlite:///./gmail_automation.db"
    export LOG_LEVEL="INFO"
    
    local main_module="main:app"
    if [[ -f "backend/main.py" ]]; then
        main_module="backend.main:app"
    elif [[ -f "app/main.py" ]]; then
        main_module="app.main:app"
    fi
    
    log_info "Starting uvicorn with module: $main_module"
    
    python -m uvicorn "$main_module" \
        --host 0.0.0.0 \
        --port $BACKEND_PORT \
        --reload \
        --log-level info \
        > "$LOG_DIR/backend.log" 2>&1 &
    
    local backend_pid=$!
    echo $backend_pid > "$LOG_DIR/backend.pid"
    
    log_info "Backend started with PID $backend_pid"
    
    local max_attempts=15
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        # Try multiple health check endpoints
        if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1 || \
           curl -sf "http://localhost:$BACKEND_PORT/" >/dev/null 2>&1 || \
           curl -sf "http://localhost:$BACKEND_PORT/docs" >/dev/null 2>&1; then
            log_success "Backend server is healthy on port $BACKEND_PORT"
            return 0
        fi

        if ! kill -0 $backend_pid 2>/dev/null; then
            log_error "Backend process died unexpectedly"
            log_error "Last 20 lines of backend log:"
            tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "No log file found"
            return 1
        fi

        log_info "Waiting for backend to start... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "Backend failed to start within timeout"
    log_error "Last 20 lines of backend log:"
    tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "No log file found"

    # Try to get more detailed error information
    if [[ -f "$LOG_DIR/backend.log" ]]; then
        log_error "Searching for error patterns in log:"
        grep -i "error\|exception\|traceback\|modulenotfounderror" "$LOG_DIR/backend.log" | tail -10 || echo "No specific errors found"
    fi

    return 1
}

start_frontend() {
    log_step "Starting Next.js frontend server..."

    cd "$FRONTEND_DIR"

    export NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT"
    export NEXT_PUBLIC_WS_URL="ws://localhost:$BACKEND_PORT"

    # Try the preferred port first, then fallback ports
    local ports_to_try=($FRONTEND_PORT 3002 3003 3004)
    local frontend_port_used=""

    for port in "${ports_to_try[@]}"; do
        if ! lsof -ti :$port >/dev/null 2>&1; then
            frontend_port_used="$port"
            break
        fi
    done

    if [[ -z "$frontend_port_used" ]]; then
        log_error "No available ports found for frontend (tried: ${ports_to_try[*]})"
        cd "$PROJECT_ROOT"
        return 1
    fi

    if [[ "$frontend_port_used" != "$FRONTEND_PORT" ]]; then
        log_warning "Port $FRONTEND_PORT is busy, using port $frontend_port_used instead"
    fi

    export PORT="$frontend_port_used"

    log_info "Starting Next.js development server on port $frontend_port_used"

    # Use npx next dev directly to avoid package.json script conflicts
    npx next dev -p "$frontend_port_used" > "$LOG_DIR/frontend.log" 2>&1 &

    local frontend_pid=$!
    echo $frontend_pid > "$LOG_DIR/frontend.pid"

    log_info "Frontend started with PID $frontend_pid"

    local max_attempts=20
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "http://localhost:$frontend_port_used" >/dev/null 2>&1; then
            log_success "Frontend server is healthy on port $frontend_port_used"

            # Update the global variable for status display
            FRONTEND_PORT="$frontend_port_used"

            cd "$PROJECT_ROOT"
            return 0
        fi

        if ! kill -0 $frontend_pid 2>/dev/null; then
            log_error "Frontend process died unexpectedly"
            log_error "Last 20 lines of frontend log:"
            tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "No log file found"
            cd "$PROJECT_ROOT"
            return 1
        fi

        log_info "Waiting for frontend to start... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done

    log_error "Frontend failed to start within timeout"
    log_error "Last 20 lines of frontend log:"
    tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "No log file found"
    cd "$PROJECT_ROOT"
    return 1
}

cleanup() {
    log_info "Shutting down servers..."
    
    if [[ -f "$LOG_DIR/backend.pid" ]]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid")
        kill $backend_pid 2>/dev/null || true
        rm -f "$LOG_DIR/backend.pid"
        log_info "Backend server stopped"
    fi
    
    if [[ -f "$LOG_DIR/frontend.pid" ]]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
        kill $frontend_pid 2>/dev/null || true
        rm -f "$LOG_DIR/frontend.pid"
        log_info "Frontend server stopped"
    fi
    
    log_success "Shutdown complete"
    exit 0
}

show_status() {
    echo
    echo "=== Gmail Automation Tool Started Successfully ==="
    echo "Backend API:      http://localhost:$BACKEND_PORT"
    echo "API Documentation: http://localhost:$BACKEND_PORT/docs"
    echo "Frontend Dashboard: http://localhost:$FRONTEND_PORT"
    echo "Logs Directory:   $LOG_DIR/"
    echo "Environment:      ${NODE_ENV:-development}"
    echo "=================================================="
    echo
    echo "Press Ctrl+C to stop all services"
    echo
}

cleanup_existing_processes() {
    log_step "Cleaning up any existing processes..."

    # Kill any existing processes that might interfere
    pkill -f "uvicorn.*backend.main:app" 2>/dev/null || true
    pkill -f "uvicorn.*8001" 2>/dev/null || true
    pkill -f "next.*dev.*3001" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "node.*3001" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "npm.*run.*dev" 2>/dev/null || true

    sleep 2

    # More aggressive cleanup for stubborn processes
    local attempts=0
    while [[ $attempts -lt 3 ]]; do
        local pids_8001=$(lsof -ti :8001 2>/dev/null || true)
        local pids_3001=$(lsof -ti :3001 2>/dev/null || true)

        if [[ -z "$pids_8001" && -z "$pids_3001" ]]; then
            break
        fi

        if [[ -n "$pids_8001" ]]; then
            log_info "Force killing processes on port 8001: $pids_8001"
            echo "$pids_8001" | xargs kill -9 2>/dev/null || true
        fi

        if [[ -n "$pids_3001" ]]; then
            log_info "Force killing processes on port 3001: $pids_3001"
            echo "$pids_3001" | xargs kill -9 2>/dev/null || true
        fi

        sleep 2
        ((attempts++))

        if [[ $attempts -lt 3 ]]; then
            log_info "Cleanup attempt $((attempts + 1))/3..."
        fi
    done

    # Final check
    local final_pids_8001=$(lsof -ti :8001 2>/dev/null || true)
    local final_pids_3001=$(lsof -ti :3001 2>/dev/null || true)

    if [[ -n "$final_pids_8001" || -n "$final_pids_3001" ]]; then
        log_warning "Some processes may still be running on ports 8001 or 3001"
        if [[ -n "$final_pids_8001" ]]; then
            log_warning "Port 8001 still has processes: $final_pids_8001"
        fi
        if [[ -n "$final_pids_3001" ]]; then
            log_warning "Port 3001 still has processes: $final_pids_3001"
        fi
    else
        log_success "Process cleanup complete"
    fi
}

main() {
    trap cleanup SIGINT SIGTERM

    log_step "Starting Gmail Automation Tool setup..."

    cleanup_existing_processes
    check_system_dependencies
    install_rust
    setup_python_environment
    setup_node_environment
    check_ports
    start_backend
    start_frontend

    show_status

    wait
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
