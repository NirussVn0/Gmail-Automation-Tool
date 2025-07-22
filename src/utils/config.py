"""Configuration management with environment variables and validation."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class DatabaseConfig(BaseSettings):
    """Database configuration settings."""
    
    url: str = Field(
        default="sqlite:///./gmail_automation.db",
        description="Database connection URL"
    )
    echo: bool = Field(
        default=False,
        description="Enable SQLAlchemy query logging"
    )
    pool_size: int = Field(
        default=10,
        description="Database connection pool size"
    )
    max_overflow: int = Field(
        default=20,
        description="Maximum database connection overflow"
    )
    
    model_config = {"env_prefix": "DB_"}


class SecurityConfig(BaseSettings):
    """Security and encryption configuration."""
    
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="Secret key for encryption and JWT tokens"
    )
    encryption_key: str = Field(
        default="your-encryption-key-change-this-in-production",
        description="AES encryption key for password storage"
    )
    password_salt: str = Field(
        default="your-password-salt-change-this-in-production",
        description="Salt for password hashing"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    jwt_expiration_hours: int = Field(
        default=24,
        description="JWT token expiration time in hours"
    )
    
    @field_validator("secret_key", "encryption_key", "password_salt")
    @classmethod
    def validate_keys(cls, v: str) -> str:
        """Validate that security keys are properly set."""
        if v.startswith("your-") and "change-this" in v:
            raise ValueError("Security keys must be changed from default values")
        if len(v) < 32:
            raise ValueError("Security keys must be at least 32 characters long")
        return v
    
    model_config = {"env_prefix": "SECURITY_"}


class ProxyConfig(BaseSettings):
    """Proxy configuration settings."""
    
    enabled: bool = Field(
        default=True,
        description="Enable proxy usage"
    )
    rotation_strategy: str = Field(
        default="round_robin",
        description="Proxy rotation strategy: round_robin, random, weighted"
    )
    health_check_interval: int = Field(
        default=300,
        description="Proxy health check interval in seconds"
    )
    timeout: int = Field(
        default=30,
        description="Proxy connection timeout in seconds"
    )
    max_retries: int = Field(
        default=3,
        description="Maximum retry attempts for failed proxy connections"
    )
    
    @field_validator("rotation_strategy")
    @classmethod
    def validate_rotation_strategy(cls, v: str) -> str:
        """Validate proxy rotation strategy."""
        allowed_strategies = ["round_robin", "random", "weighted"]
        if v not in allowed_strategies:
            raise ValueError(f"Invalid rotation strategy. Must be one of: {allowed_strategies}")
        return v
    
    model_config = {"env_prefix": "PROXY_"}


class AccountCreationConfig(BaseSettings):
    """Account creation configuration."""
    
    base_name: str = Field(
        default="testuser",
        description="Base name for generated accounts"
    )
    starting_id: int = Field(
        default=1,
        description="Starting ID for sequential account generation"
    )
    base_password: str = Field(
        default="SecurePass",
        description="Base password for generated accounts"
    )
    max_retry_attempts: int = Field(
        default=3,
        description="Maximum retry attempts for account creation"
    )
    delay_min: float = Field(
        default=2.0,
        description="Minimum delay between actions in seconds"
    )
    delay_max: float = Field(
        default=8.0,
        description="Maximum delay between actions in seconds"
    )
    batch_size: int = Field(
        default=5,
        description="Number of accounts to create in a batch"
    )
    
    @field_validator("delay_min", "delay_max")
    @classmethod
    def validate_delays(cls, v: float) -> float:
        """Validate delay values."""
        if v < 0:
            raise ValueError("Delay values must be non-negative")
        return v
    
    model_config = {"env_prefix": "ACCOUNT_"}


class WebDriverConfig(BaseSettings):
    """WebDriver configuration for browser automation."""
    
    headless: bool = Field(
        default=True,
        description="Run browser in headless mode"
    )
    window_width: int = Field(
        default=1920,
        description="Browser window width"
    )
    window_height: int = Field(
        default=1080,
        description="Browser window height"
    )
    page_load_timeout: int = Field(
        default=30,
        description="Page load timeout in seconds"
    )
    implicit_wait: int = Field(
        default=10,
        description="Implicit wait timeout in seconds"
    )
    user_agent_rotation: bool = Field(
        default=True,
        description="Enable user agent rotation"
    )
    disable_images: bool = Field(
        default=True,
        description="Disable image loading for faster browsing"
    )
    disable_javascript: bool = Field(
        default=False,
        description="Disable JavaScript execution"
    )
    
    model_config = {"env_prefix": "WEBDRIVER_"}


class LoggingConfig(BaseSettings):
    """Logging configuration."""
    
    level: str = Field(
        default="INFO",
        description="Logging level"
    )
    format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log message format"
    )
    file_path: Optional[str] = Field(
        default=None,
        description="Log file path (if None, logs to console only)"
    )
    max_file_size: int = Field(
        default=10485760,  # 10MB
        description="Maximum log file size in bytes"
    )
    backup_count: int = Field(
        default=5,
        description="Number of backup log files to keep"
    )
    
    @field_validator("level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        """Validate logging level."""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Invalid logging level. Must be one of: {allowed_levels}")
        return v.upper()
    
    model_config = {"env_prefix": "LOG_"}


class AppConfig(BaseSettings):
    """Main application configuration."""
    
    # Application settings
    app_name: str = Field(
        default="Gmail Automation Tool",
        description="Application name"
    )
    version: str = Field(
        default="0.1.0",
        description="Application version"
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    host: str = Field(
        default="0.0.0.0",
        description="API server host"
    )
    port: int = Field(
        default=8000,
        description="API server port"
    )
    
    # Component configurations
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    proxy: ProxyConfig = Field(default_factory=ProxyConfig)
    account_creation: AccountCreationConfig = Field(default_factory=AccountCreationConfig)
    webdriver: WebDriverConfig = Field(default_factory=WebDriverConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


def load_config() -> AppConfig:
    """Load and validate application configuration."""
    return AppConfig()


def get_config() -> AppConfig:
    """Get the current application configuration."""
    if not hasattr(get_config, "_config"):
        get_config._config = load_config()
    return get_config._config
