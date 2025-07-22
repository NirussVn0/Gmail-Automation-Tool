#!/usr/bin/env python3
"""
Deployment verification script for Gmail Automation Tool.

This script verifies that all components are properly configured and working.
"""

import asyncio
import os
import sys
import time
from pathlib import Path

import requests
import psutil
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


class DeploymentVerifier:
    """Verifies deployment status and configuration."""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.checks_passed = 0
        self.total_checks = 0
    
    def run_verification(self):
        """Run all verification checks."""
        console.print(Panel.fit("🚀 Gmail Automation Tool - Deployment Verification", style="bold blue"))
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            
            # Environment checks
            task1 = progress.add_task("Checking environment configuration...", total=None)
            self.check_environment()
            progress.update(task1, completed=True)
            
            # File structure checks
            task2 = progress.add_task("Verifying project structure...", total=None)
            self.check_project_structure()
            progress.update(task2, completed=True)
            
            # Dependencies checks
            task3 = progress.add_task("Checking Python dependencies...", total=None)
            self.check_dependencies()
            progress.update(task3, completed=True)
            
            # Service checks
            task4 = progress.add_task("Testing API endpoints...", total=None)
            self.check_api_endpoints()
            progress.update(task4, completed=True)
            
            # Database checks
            task5 = progress.add_task("Verifying database connection...", total=None)
            self.check_database()
            progress.update(task5, completed=True)
            
            # Security checks
            task6 = progress.add_task("Validating security configuration...", total=None)
            self.check_security()
            progress.update(task6, completed=True)
        
        self.display_results()
    
    def check_environment(self):
        """Check environment configuration."""
        console.print("\n📋 Environment Configuration", style="bold yellow")
        
        required_vars = [
            "SECURITY_SECRET_KEY",
            "SECURITY_ENCRYPTION_KEY", 
            "SECURITY_PASSWORD_SALT"
        ]
        
        for var in required_vars:
            self.total_checks += 1
            value = os.getenv(var)
            if value and not value.startswith("your-"):
                console.print(f"  ✅ {var}: Configured")
                self.checks_passed += 1
            else:
                console.print(f"  ❌ {var}: Not configured or using default value", style="red")
        
        # Check .env file
        self.total_checks += 1
        if Path(".env").exists():
            console.print("  ✅ .env file: Found")
            self.checks_passed += 1
        else:
            console.print("  ⚠️  .env file: Not found (using defaults)", style="yellow")
    
    def check_project_structure(self):
        """Check project file structure."""
        console.print("\n📁 Project Structure", style="bold yellow")
        
        required_files = [
            "src/main.py",
            "src/core/account_creator.py",
            "src/core/proxy_manager.py",
            "src/core/verification_handler.py",
            "src/database/models.py",
            "src/api/routes/accounts.py",
            "requirements.txt",
            "docker-compose.yml",
            "README.md"
        ]
        
        for file_path in required_files:
            self.total_checks += 1
            if Path(file_path).exists():
                console.print(f"  ✅ {file_path}")
                self.checks_passed += 1
            else:
                console.print(f"  ❌ {file_path}: Missing", style="red")
    
    def check_dependencies(self):
        """Check Python dependencies."""
        console.print("\n📦 Python Dependencies", style="bold yellow")
        
        required_packages = [
            "fastapi",
            "uvicorn",
            "sqlalchemy",
            "selenium",
            "cryptography",
            "pydantic",
            "aiohttp"
        ]
        
        for package in required_packages:
            self.total_checks += 1
            try:
                __import__(package)
                console.print(f"  ✅ {package}: Installed")
                self.checks_passed += 1
            except ImportError:
                console.print(f"  ❌ {package}: Not installed", style="red")
    
    def check_api_endpoints(self):
        """Check API endpoints."""
        console.print("\n🌐 API Endpoints", style="bold yellow")
        
        endpoints = [
            "/",
            "/health",
            "/docs",
            "/api/v1/accounts/",
            "/api/v1/proxies/"
        ]
        
        for endpoint in endpoints:
            self.total_checks += 1
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                if response.status_code in [200, 422]:  # 422 for endpoints requiring data
                    console.print(f"  ✅ {endpoint}: Accessible")
                    self.checks_passed += 1
                else:
                    console.print(f"  ❌ {endpoint}: HTTP {response.status_code}", style="red")
            except requests.exceptions.RequestException:
                console.print(f"  ❌ {endpoint}: Connection failed", style="red")
    
    def check_database(self):
        """Check database connection."""
        console.print("\n🗄️  Database", style="bold yellow")
        
        self.total_checks += 1
        try:
            from src.database.connection import get_database_manager
            from src.utils.config import get_config
            
            config = get_config()
            db_manager = get_database_manager()
            
            with db_manager.get_session() as session:
                # Simple query to test connection
                session.execute("SELECT 1")
                console.print("  ✅ Database connection: Working")
                self.checks_passed += 1
                
        except Exception as e:
            console.print(f"  ❌ Database connection: Failed ({str(e)})", style="red")
    
    def check_security(self):
        """Check security configuration."""
        console.print("\n🔐 Security Configuration", style="bold yellow")
        
        # Check if default keys are being used
        self.total_checks += 1
        secret_key = os.getenv("SECURITY_SECRET_KEY", "")
        if secret_key and len(secret_key) >= 32 and not secret_key.startswith("your-"):
            console.print("  ✅ Secret key: Properly configured")
            self.checks_passed += 1
        else:
            console.print("  ❌ Secret key: Using default or too short", style="red")
        
        # Check encryption key
        self.total_checks += 1
        encryption_key = os.getenv("SECURITY_ENCRYPTION_KEY", "")
        if encryption_key and len(encryption_key) >= 32 and not encryption_key.startswith("your-"):
            console.print("  ✅ Encryption key: Properly configured")
            self.checks_passed += 1
        else:
            console.print("  ❌ Encryption key: Using default or too short", style="red")
        
        # Check if running as root (security risk)
        self.total_checks += 1
        if os.getuid() != 0:
            console.print("  ✅ User privileges: Not running as root")
            self.checks_passed += 1
        else:
            console.print("  ⚠️  User privileges: Running as root (security risk)", style="yellow")
    
    def display_results(self):
        """Display verification results."""
        console.print("\n" + "="*60)
        
        # Create results table
        table = Table(title="Deployment Verification Results")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="magenta")
        table.add_column("Status", style="green")
        
        success_rate = (self.checks_passed / self.total_checks) * 100
        
        table.add_row("Total Checks", str(self.total_checks), "")
        table.add_row("Passed", str(self.checks_passed), "✅")
        table.add_row("Failed", str(self.total_checks - self.checks_passed), "❌")
        table.add_row("Success Rate", f"{success_rate:.1f}%", "")
        
        console.print(table)
        
        # Overall status
        if success_rate >= 90:
            status_panel = Panel(
                "🎉 Deployment verification PASSED!\nThe system is ready for production use.",
                style="bold green",
                title="✅ SUCCESS"
            )
        elif success_rate >= 70:
            status_panel = Panel(
                "⚠️  Deployment verification PARTIAL.\nSome issues need attention before production use.",
                style="bold yellow",
                title="⚠️  WARNING"
            )
        else:
            status_panel = Panel(
                "❌ Deployment verification FAILED.\nCritical issues must be resolved before use.",
                style="bold red",
                title="❌ FAILED"
            )
        
        console.print(status_panel)
        
        # Recommendations
        if success_rate < 100:
            console.print("\n📋 Recommendations:", style="bold blue")
            console.print("1. Review failed checks above")
            console.print("2. Update configuration in .env file")
            console.print("3. Install missing dependencies")
            console.print("4. Ensure all services are running")
            console.print("5. Check network connectivity")
        
        return success_rate >= 90


def main():
    """Main verification function."""
    verifier = DeploymentVerifier()
    success = verifier.run_verification()
    
    if success:
        console.print("\n🚀 Ready to start the Gmail Automation Tool!", style="bold green")
        console.print("Run: python -m uvicorn src.main:app --reload")
    else:
        console.print("\n🔧 Please fix the issues above before proceeding.", style="bold red")
        sys.exit(1)


if __name__ == "__main__":
    main()
