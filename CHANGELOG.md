# Changelog

All notable changes to the Gmail Automation Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-24

### Added
- run file with startup

### Security
- change LICENSE to CC-BY-NC-ND 4.0
- AES-256 encryption for sensitive data
- Secure key derivation and environment-based configuration
- XSS/CSRF protection

### Technical Features
- **Backend**: FastAPI, SQLAlchemy, Alembic migrations
- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Radix UI
- **Database**: SQLite/PostgreSQL support
- **Deployment**: Docker, PM2, Nginx configuration

### Documentation
 - add documentation for the project

### Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## [0.2.0] - 2025-07-XX (UI Development)
- **Real-time Dashboard**: Next.js dashboard with live progress tracking
- **WebSocket Integration**: Real-time updates and monitoring

## [0.1.0] - 2025-07-XX (test Development)

### Added
- Core infrastructure setup
- Basic account creation engine
- Proxy management system
- Phone verification integration
- Initial web API and dashboard
- Anti-detection measures
- Testing framework and documentation

### Security
- Basic encryption and configuration
- Environment-based security settings

### Technical Improvements
- Type hints and async/await support
- Modular architecture
- Database models and migrations

