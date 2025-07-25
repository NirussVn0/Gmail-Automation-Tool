# Gmail Automation Tool

A comprehensive tool for automated Gmail account creation with proxy support, phone verification, and advanced anti-detection measures.

## Table of Contents

1. [🚀 Quick Start](#-quick-start)
2. [🔧 Alternative Methods](#-alternative-methods)
3. [📋 Features](#-features)
4. [🛠️ Configuration](#-configuration)
5. [🔒 Security Notes](#-security-notes)
6. [🤝 Support](#-support)

## 🚀 Quick Start

### Prerequisites

- **Python**: 3.8+ (recommended 3.11+)
- **Node.js**: 18.0+
- **Git**: Latest version

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/NirussVn0/Gmail-Automation-Tool.git
cd Gmail-Automation-Tool

# 2. Run everything (recommended)
chmod +x run_all.sh
./run_all.sh
```

**That's it!** The script will:

- ✅ Install all dependencies automatically
- ✅ Set up Python virtual environment
- ✅ Start backend API (port 8001)
- ✅ Start frontend dashboard (port 3001)

### Access Application

- **Dashboard**: http://localhost:3001
- **API Docs**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

### Stop Services

Press `Ctrl+C` in the terminal

## 🔧 Alternative Methods

### Production Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start production services
./manage_services.sh start production

# Monitor services
./manage_services.sh monitor
```

### Manual Setup (if scripts fail)

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

# Frontend (new terminal)
cd dashboard
npm install
npm run dev
```

## 📋 Features

### Core Functionality

- **Bulk Account Creation**: Create multiple Gmail accounts automatically
- **Proxy Management**: Advanced proxy rotation with health monitoring
- **SMS Verification**: Integrated phone verification services
- **Real-time Dashboard**: Monitor progress with live updates
- **Anti-detection**: Browser fingerprinting and behavior randomization

### Advanced Features

- **Multiple Proxy Strategies**: Round-robin, random, weighted selection
- **Health Monitoring**: Automatic proxy health checks and failover
- **Concurrent Processing**: Parallel account creation with rate limiting
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## 🛠️ Configuration

### Environment Variables

Key settings in `.env` file:

```env
# Security (CHANGE IN PRODUCTION!)
SECURITY_SECRET_KEY="your-secret-key-32chars-minimum"
SECURITY_ENCRYPTION_KEY="your-encryption-key-32chars-minimum"

# Database
DB_URL="sqlite:///./gmail_automation.db"

# Proxy Settings
PROXY_ENABLED=true
PROXY_ROTATION_STRATEGY="round_robin"

# SMS Verification
SMS_SERVICE_PRIMARY="textverified"
SMS_SERVICE_API_KEY="your-api-key"
```

## 🔒 Security Notes

⚠️ **Important**: This tool is for educational and testing purposes only. Users must ensure compliance with Gmail's Terms of Service and applicable laws.

- Change default security keys in production
- Use HTTPS for production deployments
- Implement proper rate limiting
- Secure database credentials

## 🤝 Support

- Create an issue on GitHub
- Check API documentation at `/docs`
- Review logs in `logs/` directory
- DM for me or join discord suport [DISCORD](https://discord.gg/3vXZ2V2)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License**.

- ✅ **Free for educational and personal use**
- ❌ **Commercial use requires permission**
- ❌ **Modifications and derivatives not allowed**

For commercial licensing, contact: [work.niruss.dev@gmail.com](mailto:work.niruss.dev@gmail.com)

See [LICENSE](LICENSE) for full terms.
