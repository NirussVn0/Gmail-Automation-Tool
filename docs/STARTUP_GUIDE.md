# STARTUP TUTORIAL

This tutorial will guide you through the process of starting up a new service instance of the [KubeVirt](https://kubevirt.io/) operator.

## Table of Contents

1. [Available Scripts](#available-scripts)
2. [Architecture](#architecture)
3. [Environment Configuration](#environment-configuration)
4. [Service Endpoints](#service-endpoints)
5. [Log Files](#log-files)
6. [Process Management](#process-management)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Integration](#integration)

## Available Scripts

### 1. `run_server.sh` - Main Startup Script

The primary script for starting the complete system with comprehensive error handling and monitoring.

#### Features

- **Dependency Validation**: Checks for Python3, Node.js, and npm
- **Port Availability**: Ensures ports 8000 and 3000 are available
- **Environment Setup**: Configures development/production environments
- **Health Checks**: Verifies services are running correctly
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals properly
- **Process Management**: Tracks PIDs and manages service lifecycle

#### Usage

```bash
# Start both services (default)
./run_server.sh

# Start with specific environment
./run_server.sh -e production

# Start with monitoring enabled
./run_server.sh -m

# Start only backend
./run_server.sh backend

# Start only frontend
./run_server.sh frontend

# Show help
./run_server.sh --help
```

#### Options

- `-h, --help`: Show usage information
- `-e, --env ENV`: Set environment (development|production)
- `-m, --monitor`: Enable continuous service monitoring

### 2. `manage_services.sh` - PM2 Process Manager

Advanced process management using PM2 for production environments.

#### Features

- **PM2 Integration**: Professional process management
- **Auto-restart**: Automatic service recovery
- **Log Management**: Centralized logging with rotation
- **Monitoring Dashboard**: Real-time process monitoring
- **Startup Scripts**: System boot integration

#### Usage

```bash
# Start services with PM2
./manage_services.sh start

# Start in production mode
./manage_services.sh start production

# Stop all services
./manage_services.sh stop

# Restart services
./manage_services.sh restart

# Show service status
./manage_services.sh status

# View logs
./manage_services.sh logs
./manage_services.sh logs backend
./manage_services.sh logs frontend

# Open monitoring dashboard
./manage_services.sh monitor

# Setup system startup
./manage_services.sh setup
```

### 3. `health_check.sh` - System Health Monitoring

Comprehensive health checking for all system components.

#### Features

- **Service Health**: Checks API endpoints and frontend
- **Dependency Validation**: Verifies system requirements
- **Port Status**: Monitors port availability
- **Database Status**: Checks database connectivity
- **Log Analysis**: Reviews log file status

#### Usage

```bash
# Full health check
./health_check.sh

# Check specific components
./health_check.sh backend
./health_check.sh frontend
./health_check.sh deps
./health_check.sh ports
./health_check.sh logs
```

## Architecture

### Class-Based Design

All scripts follow OOP principles with clear separation of concerns:

#### SystemValidator

- Validates system dependencies
- Checks port availability
- Verifies directory structure

#### EnvironmentManager

- Sets up environment variables
- Configures development/production modes
- Creates necessary directories

#### ServiceManager

- Manages backend and frontend services
- Handles service lifecycle (start/stop/restart)
- Monitors service health

#### HealthChecker

- Performs health checks on services
- Waits for services to become ready
- Validates service endpoints

#### ProcessManager

- Handles signal management
- Provides graceful shutdown
- Monitors running processes

#### ApplicationLauncher

- Orchestrates the entire startup process
- Parses command-line arguments
- Coordinates all components

### Error Handling

- **Comprehensive Logging**: All actions logged with timestamps
- **Graceful Degradation**: Services continue if non-critical components fail
- **Retry Logic**: Automatic retries for transient failures
- **Signal Handling**: Proper cleanup on termination

### Security

- **Environment Isolation**: Separate dev/prod configurations
- **Secure Defaults**: Safe default values for all settings
- **Process Isolation**: Services run in separate processes
- **Log Security**: Sensitive data excluded from logs

## Environment Configuration

### Development Mode (Default)

```bash
NODE_ENV=development
SECURITY_SECRET_KEY=dev-secret-key-32-characters-long-secure-random-string-12345
SECURITY_ENCRYPTION_KEY=dev-encryption-key-32-characters-long-secure-random-string
SECURITY_PASSWORD_SALT=dev-password-salt-32-characters-long-secure-random-string
```

### Production Mode

```bash
NODE_ENV=production
SECURITY_SECRET_KEY=<generated-secure-key>
SECURITY_ENCRYPTION_KEY=<generated-secure-key>
SECURITY_PASSWORD_SALT=<generated-secure-key>
```

## Service Endpoints

- **Backend API**: http://localhost:8000
- **Frontend Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Log Files

All logs are stored in the `logs/` directory:

- `startup.log`: Script execution logs
- `backend.log`: FastAPI server logs
- `frontend.log`: Next.js server logs
- `backend-error.log`: Backend error logs (PM2)
- `frontend-error.log`: Frontend error logs (PM2)

## Process Management

### PID Files

Process IDs are stored in `pids/` directory:

- `backend.pid`: Backend process ID
- `frontend.pid`: Frontend process ID

### PM2 Configuration

The `ecosystem.config.js` file defines:

- Process configurations
- Environment variables
- Log file locations
- Restart policies
- Memory limits

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :8000
lsof -i :3000

# Kill processes if needed
./manage_services.sh stop
```

#### Dependencies Missing

```bash
# Check system dependencies
./health_check.sh deps

# Install missing dependencies
# For Python: Install Python 3.8+
# For Node.js: Install Node.js 18+
```

#### Services Not Starting

```bash
# Check logs for errors
./manage_services.sh logs

# Run health check
./health_check.sh

# Try manual start with verbose output
./run_server.sh -m
```

#### Permission Issues

```bash
# Make scripts executable
chmod +x *.sh

# Check file permissions
ls -la *.sh
```

### Debug Mode

For detailed debugging, check individual log files:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Startup logs
tail -f logs/startup.log
```

## Best Practices

### Development

- Use `./run_server.sh` for development
- Enable monitoring with `-m` flag for debugging
- Check health regularly with `./health_check.sh`

### Production

- Use `./manage_services.sh start production`
- Set up system startup with `./manage_services.sh setup`
- Monitor with `./manage_services.sh monitor`
- Regular health checks with cron jobs

### Monitoring

- Set up log rotation for production
- Monitor memory usage and restart policies
- Use PM2 monitoring dashboard
- Implement alerting for service failures

## Integration

### Systemd Integration

```bash
# Create systemd service
sudo cp scripts/gmail-automation.service /etc/systemd/system/
sudo systemctl enable gmail-automation
sudo systemctl start gmail-automation
```

### Docker Integration

```bash
# Use with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t gmail-automation .
docker run -p 8000:8000 -p 3000:3000 gmail-automation
```

### CI/CD Integration

```bash
# In deployment pipeline
./health_check.sh deps
./run_server.sh -e production
./health_check.sh
```

This startup system provides enterprise-grade process management with comprehensive error handling, monitoring, and logging capabilities for the Gmail Automation Tool.
