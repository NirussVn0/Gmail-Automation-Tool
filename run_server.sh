#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$SCRIPT_DIR/dashboard"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_PORT=8001
FRONTEND_PORT=3001

mkdir -p "$LOG_DIR"

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*" | tee -a "$LOG_DIR/startup.log"
}
log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" | tee -a "$LOG_DIR/startup.log" >&2
}
log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $*" | tee -a "$LOG_DIR/startup.log"
}

check_dependencies() {
    local deps=("node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' not found"
            return 1
        fi
    done
    log_info "System dependencies validated"
    return 0
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "Port $port is already in use"
        return 1
    fi
    return 0
}

select_python() {
    log_info "Selecting Python interpreter..."
    if command -v python3.11 &>/dev/null; then
        PYTHON_BIN=python3.11
    elif command -v python3.10 &>/dev/null; then
        PYTHON_BIN=python3.10
    else
        PYTHON_BIN=python3
    fi
    log_info "Using $($PYTHON_BIN --version)"
}

setup_environment() {
    export NODE_ENV="${NODE_ENV:-development}"
    export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"
    export NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT"
    export NEXT_PUBLIC_WS_URL="ws://localhost:$BACKEND_PORT"
    export SECURITY_SECRET_KEY="dev-secret-key-32-characters-long-secure-random-string-12345"
    export SECURITY_ENCRYPTION_KEY="dev-encryption-key-32-characters-long-secure-random-string"
    export SECURITY_PASSWORD_SALT="dev-password-salt-32-characters-long-secure-random-string"
    export SECURITY_JWT_ALGORITHM="HS256"
    export SECURITY_JWT_EXPIRATION_HOURS="24"
    export DB_URL="sqlite:///./gmail_automation.db"
    export LOG_LEVEL="INFO"
    log_info "Environment configured for $NODE_ENV mode"
}

start_backend() {
    log_info "Starting FastAPI backend..."
    cd "$BACKEND_DIR"

    if [[ ! -f "requirements.txt" ]]; then
        log_error "requirements.txt not found"
        return 1
    fi

    if [[ ! -d "venv" ]]; then
        log_info "Creating Python virtualenv..."
        "$PYTHON_BIN" -m venv venv
    fi
    # shellcheck disable=SC1091
    source venv/bin/activate

    log_info "Upgrading build tools..."
    pip install -q --upgrade pip setuptools wheel

    local python_version
    python_version=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")

    if [[ "$python_version" == "3.13" ]]; then
        log_info "Python 3.13 detected - using pre-built wheels only to avoid pydantic-core compilation"
        pip install -q --only-binary=all \
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
        log_info "Installing Python dependencies (prefer binary)..."
        pip install -q --prefer-binary -r requirements.txt
    fi

    local main_module="main:app"
    [[ -f "src/main.py" ]] && main_module="src.main:app"

    log_info "Launching uvicorn..."
    python -m uvicorn "$main_module" \
        --host 0.0.0.0 \
        --port $BACKEND_PORT \
        --reload \
        > "$LOG_DIR/backend.log" 2>&1 &

    BACKEND_PID=$!
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    sleep 5

    if curl -sf "http://localhost:$BACKEND_PORT/health" &>/dev/null; then
        log_success "Backend healthy on $BACKEND_PORT"
    else
        log_error "Backend failed to start"
        return 1
    fi
    return 0
}

start_frontend() {
    log_info "Starting Next.js frontend..."
    cd "$FRONTEND_DIR"

    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found"
        return 1
    fi
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing frontend deps..."
        npm install
    fi

    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
    sleep 10

    if curl -sf "http://localhost:$FRONTEND_PORT" &>/dev/null; then
        log_success "Frontend healthy on $FRONTEND_PORT"
    else
        log_error "Frontend failed to start"
        return 1
    fi
    return 0
}

cleanup() {
    log_info "Shutting down..."
    [[ -f "$LOG_DIR/backend.pid" ]] && kill "$(cat "$LOG_DIR/backend.pid")" &>/dev/null && rm -f "$LOG_DIR/backend.pid"
    [[ -f "$LOG_DIR/frontend.pid" ]] && kill "$(cat "$LOG_DIR/frontend.pid")" &>/dev/null && rm -f "$LOG_DIR/frontend.pid"
    log_success "All services stopped"
    exit 0
}

show_usage() {
    cat <<EOF
Usage: $0 [OPTIONS]
  -h, --help          Show help
  -b, --backend-only  Only backend
  -f, --frontend-only Only frontend
EOF
}

main() {
    local backend_only=false frontend_only=false
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help) show_usage; exit 0 ;;
            -b|--backend-only) backend_only=true; shift ;;
            -f|--frontend-only) frontend_only=true; shift ;;
            *) log_error "Unknown option $1"; show_usage; exit 1 ;;
        esac
    done

    trap cleanup SIGINT SIGTERM
    log_info "Starting Gmail Automation Tool..."
    check_dependencies || exit 1
    [[ "$frontend_only" == "false" ]] && check_port $BACKEND_PORT || true
    [[ "$backend_only" == "false" ]]  && check_port $FRONTEND_PORT || true
    select_python
    setup_environment
    [[ "$frontend_only" == "false" ]] && start_backend  || true
    [[ "$backend_only" == "false" ]]  && start_frontend || true

    log_success "=== All services up! ==="
    log_info "Backend: http://localhost:$BACKEND_PORT"
    log_info "Frontend: http://localhost:$FRONTEND_PORT"
    log_info "Logs in $LOG_DIR/, Ctrl+C to stop"
    wait
}

main "$@"
