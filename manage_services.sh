#!/bin/bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR"
readonly LOG_DIR="$PROJECT_ROOT/logs"

ServiceController::check_pm2_installed() {
        if ! command -v pm2 &> /dev/null; then
            echo "PM2 not found. Installing PM2..."
            npm install -g pm2
        fi
}

ServiceController::start_with_pm2() {
        local environment="${1:-development}"
        
        ServiceController::check_pm2_installed

        echo "Starting services with PM2 in $environment mode..."

        mkdir -p "$LOG_DIR"

        pm2 start ecosystem.config.js --env "$environment"
        pm2 save

        echo "Services started successfully!"
        ServiceController::show_status
}

ServiceController::stop_services() {
        echo "Stopping all services..."
        
        if command -v pm2 &> /dev/null; then
            pm2 stop all
            pm2 delete all
        fi
        
        pkill -f "uvicorn.*backend.main:app" || true
        pkill -f "next.*dev\|next.*start" || true
        
        echo "All services stopped"
}

ServiceController::restart_services() {
    local environment="${1:-development}"

    echo "Restarting services..."

    if command -v pm2 &> /dev/null && pm2 list | grep -q "gmail-automation"; then
        pm2 restart all
    else
        ServiceController::start_with_pm2 "$environment"
    fi

    echo "Services restarted successfully!"
}

ServiceController::show_status() {
        echo
        echo "=== Service Status ==="
        
        if command -v pm2 &> /dev/null; then
            pm2 list
        else
            echo "PM2 not installed. Checking processes manually..."
            
            if pgrep -f "uvicorn.*backend.main:app" > /dev/null; then
                echo "Backend: Running"
            else
                echo "Backend: Stopped"
            fi
            
            if pgrep -f "next.*dev\|next.*start" > /dev/null; then
                echo "Frontend: Running"
            else
                echo "Frontend: Stopped"
            fi
        fi
        
        echo
        echo "URLs:"
        echo "  Backend API: http://localhost:8000"
        echo "  Frontend:    http://localhost:3000"
        echo "  Logs:        $LOG_DIR/"
        echo
}

ServiceController::show_logs() {
        local service="${1:-all}"
        
        case "$service" in
            "backend")
                if command -v pm2 &> /dev/null; then
                    pm2 logs gmail-automation-backend
                else
                    tail -f "$LOG_DIR/backend.log" 2>/dev/null || echo "Backend log not found"
                fi
                ;;
            "frontend")
                if command -v pm2 &> /dev/null; then
                    pm2 logs gmail-automation-frontend
                else
                    tail -f "$LOG_DIR/frontend.log" 2>/dev/null || echo "Frontend log not found"
                fi
                ;;
            "all"|*)
                if command -v pm2 &> /dev/null; then
                    pm2 logs
                else
                    echo "=== Backend Logs ==="
                    tail -n 20 "$LOG_DIR/backend.log" 2>/dev/null || echo "Backend log not found"
                    echo
                    echo "=== Frontend Logs ==="
                    tail -n 20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "Frontend log not found"
                fi
                ;;
        esac
}

ServiceController::monitor_services() {
        if command -v pm2 &> /dev/null; then
            pm2 monit
        else
            echo "PM2 not available. Use './run_server.sh -m' for basic monitoring"
        fi
}

ServiceController::setup_startup() {
    ServiceController::check_pm2_installed

    echo "Setting up PM2 startup script..."
    pm2 startup
    echo "Run the command above as root, then run: pm2 save"
}

ServiceController::show_usage() {
        cat << EOF
Usage: $0 <command> [options]

Commands:
    start [env]         Start services with PM2 (env: development|production)
    stop                Stop all services
    restart [env]       Restart services
    status              Show service status
    logs [service]      Show logs (service: backend|frontend|all)
    monitor             Open PM2 monitoring dashboard
    setup               Setup PM2 startup script
    
Examples:
    $0 start                    Start in development mode
    $0 start production         Start in production mode
    $0 restart                  Restart services
    $0 logs backend             Show backend logs
    $0 monitor                  Open monitoring dashboard
EOF
}

ServiceController::main() {
        local command="${1:-}"
        
        case "$command" in
            "start")
                ServiceController::start_with_pm2 "${2:-development}"
                ;;
            "stop")
                ServiceController::stop_services
                ;;
            "restart")
                ServiceController::restart_services "${2:-development}"
                ;;
            "status")
                ServiceController::show_status
                ;;
            "logs")
                ServiceController::show_logs "${2:-all}"
                ;;
            "monitor")
                ServiceController::monitor_services
                ;;
            "setup")
                ServiceController::setup_startup
                ;;
            "help"|"-h"|"--help"|"")
                ServiceController::show_usage
                ;;
            *)
                echo "Unknown command: $command"
                ServiceController::show_usage
                exit 1
                ;;
        esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    ServiceController::main "$@"
fi
