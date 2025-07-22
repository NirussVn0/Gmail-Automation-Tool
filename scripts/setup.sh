#!/bin/bash

# Gmail Automation Tool Setup Script

set -e

echo "🚀 Setting up Gmail Automation Tool..."

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration before running the application"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs data migrations/versions

# Initialize database
echo "🗄️ Setting up database..."
python -c "
from src.database.connection import initialize_database
from src.utils.config import get_config

config = get_config()
db_manager = initialize_database(config.database)
db_manager.create_tables()
print('Database tables created successfully')
"

# Run tests
echo "🧪 Running tests..."
python -m pytest tests/ -v

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Configure your SMS verification service API keys"
echo "3. Add proxy configurations if needed"
echo "4. Run the application: python -m uvicorn src.main:app --reload"
echo ""
echo "📖 Documentation: http://localhost:8000/docs"
echo "🌐 Web Interface: http://localhost:8000"
