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
            log_info "Found compatible Python: $python_cmd (version $version)"
            echo "$python_cmd"
            return 0
        fi
    done
    
    log_error "No compatible Python version found (>= $PYTHON_MIN_VERSION)"
    return 1
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
    
    if [[ ! -d "$BACKEND_DIR/venv" ]]; then
        log_info "Creating Python virtual environment with $python_cmd..."
        "$python_cmd" -m venv "$BACKEND_DIR/venv"
    else
        log_info "Python virtual environment already exists"
    fi
    
    source "$BACKEND_DIR/venv/bin/activate"
    
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
                "aiofiles>=23.0.0"
        else
            log_info "Python $python_version detected - installing from requirements.txt"
            python -m pip install -r "$BACKEND_DIR/requirements.txt"
        fi
    else
        log_info "No requirements.txt found - installing basic FastAPI stack"
        python -m pip install --only-binary=all \
            "fastapi>=0.104.0" \
            "uvicorn[standard]>=0.24.0" \
            "pydantic>=2.5.0,<3.0.0"
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

check_ports() {
    log_step "Checking port availability..."
    
    local ports=($BACKEND_PORT $FRONTEND_PORT)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_error "Port $port is already in use"
            local process_info
            process_info=$(lsof -Pi :$port -sTCP:LISTEN -F p | grep -o '[0-9]*' | head -1)
            log_info "Process using port $port: PID $process_info"
            log_info "To kill: kill $process_info"
            exit 1
        fi
    done
    
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
    if [[ -f "src/main.py" ]]; then
        main_module="src.main:app"
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
        if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
            log_success "Backend server is healthy on port $BACKEND_PORT"
            return 0
        fi
        
        if ! kill -0 $backend_pid 2>/dev/null; then
            log_error "Backend process died unexpectedly"
            cat "$LOG_DIR/backend.log" | tail -20
            return 1
        fi
        
        log_info "Waiting for backend to start... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Backend failed to start within timeout"
    cat "$LOG_DIR/backend.log" | tail -20
    return 1
}

start_frontend() {
    log_step "Starting Next.js frontend server..."
    
    cd "$FRONTEND_DIR"
    
    export NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT"
    export NEXT_PUBLIC_WS_URL="ws://localhost:$BACKEND_PORT"
    export PORT="$FRONTEND_PORT"
    
    log_info "Starting Next.js development server on port $FRONTEND_PORT"
    
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    
    local frontend_pid=$!
    echo $frontend_pid > "$LOG_DIR/frontend.pid"
    
    log_info "Frontend started with PID $frontend_pid"
    
    local max_attempts=20
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            log_success "Frontend server is healthy on port $FRONTEND_PORT"
            return 0
        fi
        
        if ! kill -0 $frontend_pid 2>/dev/null; then
            log_error "Frontend process died unexpectedly"
            cat "$LOG_DIR/frontend.log" | tail -20
            return 1
        fi
        
        log_info "Waiting for frontend to start... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Frontend failed to start within timeout"
    cat "$LOG_DIR/frontend.log" | tail -20
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

main() {
    trap cleanup SIGINT SIGTERM
    
    log_step "Starting Gmail Automation Tool setup..."
    
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
