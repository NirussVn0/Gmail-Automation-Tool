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

### Validate Setup (Optional)

```bash
# Test your setup before running
./test_setup.sh
```

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

## 🔧 Troubleshooting

### Common Issues

#### 1. ModuleNotFoundError: No module named 'PIL'

**Solution:**

```bash
# Activate virtual environment and install Pillow
source venv/bin/activate
pip install Pillow>=10.0.0
```

#### 2. Port already in use (EADDRINUSE)

**Error:** `listen EADDRINUSE: address already in use :::3001` or `:::8001`

**Quick fix:**

```bash
# Fastest way - auto-fix port conflicts
./quick_port_fix.sh

# Or kill specific ports
./kill_ports.sh 3001 8001

# Or kill all common development ports
./kill_ports.sh -c

# Or let run_all.sh handle it interactively
./run_all.sh
```

**Manual fix:**

```bash
# Find what's using the port
lsof -i :3001
lsof -i :8001

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

#### 3. Backend fails to start

**Check logs:**

```bash
# View backend logs
tail -f logs/backend.log

# Or use the test script
./test_setup.sh
```

**Common causes:**

- Missing dependencies: Run `./run_all.sh` again
- Port already in use: Use `./kill_ports.sh` to free ports
- Python version incompatibility: Use Python 3.8+

#### 4. Frontend build errors

**Solution:**

```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### 5. Permission denied errors

**Solution:**

```bash
# Make scripts executable
chmod +x run_all.sh
chmod +x manage_services.sh
chmod +x test_setup.sh

# Fix ownership if needed
sudo chown -R $USER:$USER .
```

#### 6. System dependencies missing

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3-dev libjpeg-dev zlib1g-dev curl
```

**CentOS/RHEL:**

```bash
sudo yum install -y gcc python3-devel libjpeg-turbo-devel zlib-devel curl
```

### Validation Script

Run the validation script to check your setup:

```bash
./test_setup.sh
```

This will check:

- ✅ Python installation and dependencies
- ✅ Node.js installation and dependencies
- ✅ Port availability
- ✅ Required files
- ✅ Backend module imports
- ✅ Basic functionality

### Getting Help

If you're still having issues:

1. **Run the test script:** `./test_setup.sh`
2. **Check logs:** `tail -f logs/setup.log`
3. **Create an issue** with:
   - Your OS and versions (Python, Node.js)
   - Full error message
   - Output of `./test_setup.sh`

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
