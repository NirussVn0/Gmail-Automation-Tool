# Gmail Automation Tool

A comprehensive tool for automated Gmail account creation with proxy support, phone verification, and advanced anti-detection measures.

## Features

- **Automated Gmail Account Creation**: Generate Gmail accounts with structured naming conventions
- **Password Management**: Secure password generation and AES-256 encryption
- **Proxy Integration**: HTTP/HTTPS and SOCKS5 proxy rotation with health checking
- **Phone Verification**: Integration with SMS verification services
- **Anti-Detection**: Sophisticated measures to avoid detection
- **Web Dashboard**: React-based frontend with real-time updates
- **API**: RESTful API with comprehensive endpoints
- **Security**: Industry-standard encryption and secure configuration management

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
gmail_automation/
├── src/
│   ├── core/              # Core business logic
│   ├── database/          # Database models and repositories
│   ├── api/               # FastAPI routes and schemas
│   ├── utils/             # Utilities and configuration
│   └── main.py            # Application entry point
├── tests/                 # Unit and integration tests
├── frontend/              # React frontend
├── config/                # Configuration files
├── docs/                  # Documentation
└── scripts/               # Deployment and utility scripts
```

## Quick Start

### Prerequisites

- Python 3.8+
- Docker and Docker Compose (recommended)
- PostgreSQL (for production)
- Redis (for task queue)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/NirussVn0/Gmail-Automation-Tool.git
   cd Gmail-Automation-Tool
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Using Docker (Recommended):**

   ```bash
   docker-compose up -d
   ```

4. **Manual Installation:**

   **Important**: Always use a virtual environment to avoid dependency conflicts with system Python packages.

   **For Unix/Linux/macOS:**

   ```bash
   # Create a Python virtual environment
   python3 -m venv venv

   # Activate the virtual environment
   source venv/bin/activate

   # Upgrade pip to the latest version
   pip install --upgrade pip

   # Install dependencies
   pip install -r requirements.txt

   # Set up database with Alembic migrations
   python -m alembic upgrade head

   # Run the application
   python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
   ```

   **For Windows:**

   ```cmd
   # Create a Python virtual environment
   python -m venv venv

   # Activate the virtual environment
   venv\Scripts\activate

   # Upgrade pip to the latest version
   python -m pip install --upgrade pip

   # Install dependencies
   pip install -r requirements.txt

   # Set up database with Alembic migrations
   python -m alembic upgrade head

   # Run the application
   python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
   ```

   **Note**: To deactivate the virtual environment when you're done, simply run `deactivate` in your terminal.

### Configuration

Key configuration options in `.env`:

```env
# Security (CHANGE THESE IN PRODUCTION!)
SECURITY_SECRET_KEY="your-super-secret-key-32chars-minimum"
SECURITY_ENCRYPTION_KEY="your-encryption-key-32chars-minimum"
SECURITY_PASSWORD_SALT="your-password-salt-32chars-minimum"

# Database
DB_URL="postgresql://username:password@localhost:5432/gmail_automation"

# Account Creation
ACCOUNT_BASE_NAME="testuser"
ACCOUNT_STARTING_ID=1
ACCOUNT_BASE_PASSWORD="SecurePass"

# Proxy Settings
PROXY_ENABLED=true
PROXY_ROTATION_STRATEGY="round_robin"

# SMS Verification
SMS_SERVICE_PRIMARY="textverified"
SMS_SERVICE_API_KEY="your-api-key"
```

## Usage

### Web Interface

Access the web dashboard at `http://localhost:8000` to:

- Monitor account creation progress
- Manage proxy configurations
- View system statistics
- Configure settings

### API Endpoints

The API provides comprehensive endpoints for all operations:

- **Accounts**: `/api/v1/accounts/`
- **Proxies**: `/api/v1/proxies/`
- **Verification**: `/api/v1/verification/`
- **Jobs**: `/api/v1/jobs/`

API documentation is available at `http://localhost:8000/docs`

### Creating Accounts

1. **Single Account:**

   ```bash
   curl -X POST "http://localhost:8000/api/v1/accounts/" \
        -H "Content-Type: application/json" \
        -d '{
          "email": "test@gmail.com",
          "password": "SecurePassword123",
          "first_name": "Test",
          "last_name": "User"
        }'
   ```

2. **Batch Creation:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/accounts/batch" \
        -H "Content-Type: application/json" \
        -d '{
          "base_name": "testuser",
          "starting_id": 1,
          "count": 10,
          "base_password": "SecurePass"
        }'
   ```

### Managing Proxies

1. **Add Proxy:**

   ```bash
   curl -X POST "http://localhost:8000/api/v1/proxies/" \
        -H "Content-Type: application/json" \
        -d '{
          "host": "proxy.example.com",
          "port": 8080,
          "proxy_type": "http",
          "username": "user",
          "password": "pass"
        }'
   ```

2. **Test Proxy:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/proxies/1/test"
   ```

## Security Considerations

### Important Security Notes

1. **Change Default Keys**: Always change the default security keys in production
2. **Use HTTPS**: Configure SSL/TLS for production deployments
3. **Secure Database**: Use strong database credentials and restrict access
4. **Rate Limiting**: Implement appropriate rate limiting to avoid overwhelming services
5. **Compliance**: Ensure compliance with Gmail's Terms of Service

### Encryption

- Passwords are encrypted using AES-256 with PBKDF2 key derivation
- All sensitive data is encrypted at rest
- Secure key management with environment variables

## Testing

Run the test suite:

```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# All tests with coverage
pytest --cov=src --cov-report=html
```

## Deployment

### Production Deployment

1. **Environment Setup:**

   ```bash
   # Set production environment variables
   export SECURITY_SECRET_KEY="your-production-secret-key"
   export SECURITY_ENCRYPTION_KEY="your-production-encryption-key"
   export DB_URL="postgresql://user:pass@db-host:5432/gmail_automation"
   ```

2. **Docker Deployment:**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Database Migration:**
   ```bash
   docker-compose exec gmail-automation python -m alembic upgrade head
   ```

### Monitoring

- Application logs are available in the `logs/` directory
- Health check endpoint: `/health`
- Metrics endpoint: `/metrics` (if enabled)

## API Documentation

Comprehensive API documentation is available at `/docs` when the application is running. The API follows OpenAPI 3.0 specifications and includes:

- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and descriptions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational and testing purposes only. Users are responsible for ensuring compliance with Gmail's Terms of Service and applicable laws. The developers are not responsible for any misuse of this software.

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation in the `docs/` directory
- Review the API documentation at `/docs`

## Changelog

See CHANGELOG.md for version history and updates.
