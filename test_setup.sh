#!/bin/bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR"
readonly BACKEND_DIR="$PROJECT_ROOT"
readonly FRONTEND_DIR="$PROJECT_ROOT/dashboard"
readonly LOG_DIR="$PROJECT_ROOT/logs"

readonly BACKEND_PORT=8001
readonly FRONTEND_PORT=3001

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

check_python() {
    log_info "Checking Python installation..."
    
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 not found"
        return 1
    fi
    
    local python_version
    python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    log_success "Python $python_version found"
    
    # Check if virtual environment exists
    if [[ -d "$BACKEND_DIR/venv" ]]; then
        log_success "Virtual environment exists"
        
        # Test activation
        if source "$BACKEND_DIR/venv/bin/activate" 2>/dev/null; then
            log_success "Virtual environment can be activated"
            
            # Check key dependencies
            local missing_deps=()
            
            if ! python -c "import fastapi" 2>/dev/null; then
                missing_deps+=("fastapi")
            fi
            
            if ! python -c "import uvicorn" 2>/dev/null; then
                missing_deps+=("uvicorn")
            fi
            
            if ! python -c "from PIL import Image" 2>/dev/null; then
                missing_deps+=("Pillow")
            fi
            
            if ! python -c "import selenium" 2>/dev/null; then
                missing_deps+=("selenium")
            fi
            
            if [[ ${#missing_deps[@]} -gt 0 ]]; then
                log_error "Missing Python dependencies: ${missing_deps[*]}"
                return 1
            else
                log_success "All key Python dependencies are installed"
            fi
            
            deactivate 2>/dev/null || true
        else
            log_error "Cannot activate virtual environment"
            return 1
        fi
    else
        log_error "Virtual environment not found at $BACKEND_DIR/venv"
        return 1
    fi
    
    return 0
}

check_node() {
    log_info "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found"
        return 1
    fi
    
    local node_version
    node_version=$(node --version)
    log_success "Node.js $node_version found"
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found"
        return 1
    fi
    
    local npm_version
    npm_version=$(npm --version)
    log_success "npm $npm_version found"
    
    # Check if node_modules exists
    if [[ -d "$FRONTEND_DIR/node_modules" ]]; then
        log_success "Node.js dependencies are installed"
    else
        log_error "Node.js dependencies not found at $FRONTEND_DIR/node_modules"
        return 1
    fi
    
    return 0
}

check_ports() {
    log_info "Checking port availability..."
    
    local ports=($BACKEND_PORT $FRONTEND_PORT)
    local ports_in_use=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            ports_in_use+=($port)
        fi
    done
    
    if [[ ${#ports_in_use[@]} -gt 0 ]]; then
        log_warning "Ports in use: ${ports_in_use[*]}"
        for port in "${ports_in_use[@]}"; do
            local process_info
            process_info=$(lsof -Pi :$port -sTCP:LISTEN -F p | grep -o '[0-9]*' | head -1)
            log_info "Port $port is used by PID $process_info"
        done
        return 1
    else
        log_success "All required ports are available"
    fi
    
    return 0
}

check_backend_files() {
    log_info "Checking backend files..."
    
    local required_files=(
        "backend/main.py"
        "backend/__init__.py"
        "backend/core/__init__.py"
        "backend/api/__init__.py"
        "requirements.txt"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing backend files: ${missing_files[*]}"
        return 1
    else
        log_success "All required backend files exist"
    fi
    
    return 0
}

check_frontend_files() {
    log_info "Checking frontend files..."
    
    local required_files=(
        "dashboard/package.json"
        "dashboard/next.config.js"
        "dashboard/src"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -e "$PROJECT_ROOT/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing frontend files: ${missing_files[*]}"
        return 1
    else
        log_success "All required frontend files exist"
    fi
    
    return 0
}

test_backend_import() {
    log_info "Testing backend module imports..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"
    
    if python -c "from backend.main import app; print('Backend imports successful')" 2>/dev/null; then
        log_success "Backend modules can be imported successfully"
        deactivate
        return 0
    else
        log_error "Backend module import failed"
        log_info "Trying to get more details..."
        python -c "from backend.main import app" 2>&1 | head -10 || true
        deactivate
        return 1
    fi
}

run_quick_test() {
    log_info "Running quick functionality test..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    export PYTHONPATH="$BACKEND_DIR:${PYTHONPATH:-}"
    export SECURITY_SECRET_KEY="test-secret-key-32-characters-long-secure-random-string-12345"
    export SECURITY_ENCRYPTION_KEY="test-encryption-key-32-characters-long-secure-random-string"
    export SECURITY_PASSWORD_SALT="test-password-salt-32-characters-long-secure-random-string"
    export DB_URL="sqlite:///./test_gmail_automation.db"
    
    # Test basic FastAPI functionality
    if python -c "
from backend.main import create_app
app = create_app()
print('FastAPI app created successfully')
" 2>/dev/null; then
        log_success "Backend app can be created successfully"
        deactivate
        return 0
    else
        log_error "Backend app creation failed"
        deactivate
        return 1
    fi
}

show_summary() {
    echo
    echo "=== Setup Validation Summary ==="
    echo "Project Root: $PROJECT_ROOT"
    echo "Backend Dir:  $BACKEND_DIR"
    echo "Frontend Dir: $FRONTEND_DIR"
    echo "Logs Dir:     $LOG_DIR"
    echo "================================"
    echo
}

main() {
    echo "=== Gmail Automation Tool Setup Validation ==="
    echo
    
    local tests_passed=0
    local tests_total=7
    
    if check_python; then
        ((tests_passed++))
    fi
    
    if check_node; then
        ((tests_passed++))
    fi
    
    if check_ports; then
        ((tests_passed++))
    fi
    
    if check_backend_files; then
        ((tests_passed++))
    fi
    
    if check_frontend_files; then
        ((tests_passed++))
    fi
    
    if test_backend_import; then
        ((tests_passed++))
    fi
    
    if run_quick_test; then
        ((tests_passed++))
    fi
    
    echo
    echo "=== Test Results ==="
    echo "Tests passed: $tests_passed/$tests_total"
    
    if [[ $tests_passed -eq $tests_total ]]; then
        log_success "All tests passed! Your setup is ready."
        echo
        echo "You can now run:"
        echo "  ./run_all.sh          # Start both backend and frontend"
        echo "  ./manage_services.sh  # Manage services with PM2"
        show_summary
        return 0
    else
        log_error "Some tests failed. Please fix the issues above."
        echo
        echo "Common solutions:"
        echo "  1. Run: ./run_all.sh (it will install missing dependencies)"
        echo "  2. Check the logs in: $LOG_DIR/"
        echo "  3. Ensure you have Python 3.8+ and Node.js 18+"
        show_summary
        return 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
