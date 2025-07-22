"""FastAPI dependencies for dependency injection."""

from typing import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from ..database.connection import get_database_manager
from ..database.repositories import (
    AuditLogRepository,
    CreationJobRepository,
    GmailAccountRepository,
    ProxyRepository,
    VerificationSessionRepository,
)
from ..core.password_manager import PasswordManager
from ..core.proxy_manager import ProxyManager
from ..core.verification_handler import VerificationHandler
from ..utils.config import get_config


def get_db() -> Generator[Session, None, None]:
    """Get database session dependency."""
    db_manager = get_database_manager()
    with db_manager.get_session() as session:
        yield session


def get_account_repository(db: Session = Depends(get_db)) -> GmailAccountRepository:
    """Get Gmail account repository dependency."""
    return GmailAccountRepository(db)


def get_proxy_repository(db: Session = Depends(get_db)) -> ProxyRepository:
    """Get proxy repository dependency."""
    return ProxyRepository(db)


def get_verification_repository(db: Session = Depends(get_db)) -> VerificationSessionRepository:
    """Get verification session repository dependency."""
    return VerificationSessionRepository(db)


def get_creation_job_repository(db: Session = Depends(get_db)) -> CreationJobRepository:
    """Get creation job repository dependency."""
    return CreationJobRepository(db)


def get_audit_log_repository(db: Session = Depends(get_db)) -> AuditLogRepository:
    """Get audit log repository dependency."""
    return AuditLogRepository(db)


def get_password_manager() -> PasswordManager:
    """Get password manager dependency."""
    config = get_config()
    return PasswordManager(config.security)


def get_proxy_manager(
    proxy_repo: ProxyRepository = Depends(get_proxy_repository),
    db: Session = Depends(get_db)
) -> ProxyManager:
    """Get proxy manager dependency."""
    config = get_config()
    return ProxyManager(config.proxy, proxy_repo, db)


def get_verification_handler(
    verification_repo: VerificationSessionRepository = Depends(get_verification_repository),
    db: Session = Depends(get_db)
) -> VerificationHandler:
    """Get verification handler dependency."""
    return VerificationHandler(verification_repo, db)
