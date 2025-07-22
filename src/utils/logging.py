"""Structured logging configuration with audit trail support."""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from rich.console import Console
from rich.logging import RichHandler

from .config import LoggingConfig


class AuditLogger:
    """Audit logger for tracking sensitive operations."""
    
    def __init__(self, logger_name: str = "audit"):
        self.logger = structlog.get_logger(logger_name)
    
    def log_account_creation(
        self,
        email: str,
        success: bool,
        proxy_used: Optional[str] = None,
        error_message: Optional[str] = None,
        **kwargs: Any
    ) -> None:
        """Log account creation attempt."""
        self.logger.info(
            "account_creation_attempt",
            email=email,
            success=success,
            proxy_used=proxy_used,
            error_message=error_message,
            **kwargs
        )
    
    def log_proxy_usage(
        self,
        proxy_url: str,
        action: str,
        success: bool,
        response_time: Optional[float] = None,
        **kwargs: Any
    ) -> None:
        """Log proxy usage."""
        self.logger.info(
            "proxy_usage",
            proxy_url=proxy_url,
            action=action,
            success=success,
            response_time=response_time,
            **kwargs
        )
    
    def log_verification_attempt(
        self,
        email: str,
        phone_number: str,
        verification_service: str,
        success: bool,
        **kwargs: Any
    ) -> None:
        """Log phone verification attempt."""
        self.logger.info(
            "verification_attempt",
            email=email,
            phone_number=phone_number,
            verification_service=verification_service,
            success=success,
            **kwargs
        )
    
    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        **kwargs: Any
    ) -> None:
        """Log security-related events."""
        self.logger.warning(
            "security_event",
            event_type=event_type,
            severity=severity,
            description=description,
            **kwargs
        )


def setup_logging(config: LoggingConfig) -> None:
    """Setup structured logging with rich console output and file logging."""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, config.level))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler with rich formatting
    console = Console()
    console_handler = RichHandler(
        console=console,
        show_time=True,
        show_path=True,
        markup=True,
        rich_tracebacks=True
    )
    console_handler.setLevel(getattr(logging, config.level))
    
    # Console formatter
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (if configured)
    if config.file_path:
        log_file = Path(config.file_path)
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=config.max_file_size,
            backupCount=config.backup_count,
            encoding="utf-8"
        )
        file_handler.setLevel(getattr(logging, config.level))
        
        # File formatter (JSON for structured logging)
        file_formatter = logging.Formatter(config.format)
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
    
    # Setup audit logger with separate file
    if config.file_path:
        audit_log_file = Path(config.file_path).parent / "audit.log"
        audit_handler = logging.handlers.RotatingFileHandler(
            filename=audit_log_file,
            maxBytes=config.max_file_size,
            backupCount=config.backup_count,
            encoding="utf-8"
        )
        audit_handler.setLevel(logging.INFO)
        
        audit_formatter = logging.Formatter(
            "%(asctime)s - AUDIT - %(levelname)s - %(message)s"
        )
        audit_handler.setFormatter(audit_formatter)
        
        # Create audit logger
        audit_logger = logging.getLogger("audit")
        audit_logger.addHandler(audit_handler)
        audit_logger.setLevel(logging.INFO)
        audit_logger.propagate = False


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def get_audit_logger() -> AuditLogger:
    """Get the audit logger instance."""
    return AuditLogger()


class LoggerMixin:
    """Mixin class to add logging capabilities to other classes."""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        """Get logger for this class."""
        if not hasattr(self, "_logger"):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger
    
    @property
    def audit_logger(self) -> AuditLogger:
        """Get audit logger for this class."""
        if not hasattr(self, "_audit_logger"):
            self._audit_logger = get_audit_logger()
        return self._audit_logger
