from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class AccountStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    CREATED = "created"
    VERIFIED = "verified"
    FAILED = "failed"
    SUSPENDED = "suspended"


class ProxyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    FAILED = "failed"
    TESTING = "testing"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"


class GmailAccount(Base):
    __tablename__ = "gmail_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_encrypted = Column(Text, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    birth_date = Column(DateTime, nullable=True)
    recovery_email = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    
    status = Column(SQLEnum(AccountStatus), default=AccountStatus.PENDING, nullable=False)
    creation_attempts = Column(Integer, default=0, nullable=False)
    last_attempt_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    user_agent = Column(Text, nullable=True)
    proxy_id = Column(Integer, ForeignKey("proxies.id"), nullable=True)
    session_cookies = Column(Text, nullable=True)
    
    verification_sessions = relationship("VerificationSession", back_populates="account")
    proxy = relationship("Proxy", back_populates="accounts")
    
    def __repr__(self) -> str:
        return f"<GmailAccount(email='{self.email}', status='{self.status}')>"


class Proxy(Base):
    __tablename__ = "proxies"
    
    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=True)
    password_encrypted = Column(Text, nullable=True)
    proxy_type = Column(String(20), default="http", nullable=False)
    
    status = Column(SQLEnum(ProxyStatus), default=ProxyStatus.INACTIVE, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    success_rate = Column(Float, default=0.0, nullable=False)
    total_requests = Column(Integer, default=0, nullable=False)
    successful_requests = Column(Integer, default=0, nullable=False)
    
    current_usage = Column(Integer, default=0, nullable=False)
    max_concurrent_usage = Column(Integer, default=5, nullable=False)
    weight = Column(Float, default=1.0, nullable=False)
    
    country = Column(String(2), nullable=True)
    region = Column(String(100), nullable=True)
    provider = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    accounts = relationship("GmailAccount", back_populates="proxy")
    
    __table_args__ = (
        UniqueConstraint("host", "port", "username", name="unique_proxy"),
    )
    
    def __repr__(self) -> str:
        return f"<Proxy(host='{self.host}', port={self.port}, status='{self.status}')>"


class VerificationSession(Base):
    __tablename__ = "verification_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("gmail_accounts.id"), nullable=False)
    phone_number = Column(String(20), nullable=False)
    verification_code = Column(String(10), nullable=True)
    
    service_name = Column(String(100), nullable=False)
    service_session_id = Column(String(255), nullable=True)
    
    status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    requested_at = Column(DateTime, default=func.now(), nullable=False)
    code_received_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    cost = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    account = relationship("GmailAccount", back_populates="verification_sessions")
    
    def __repr__(self) -> str:
        return f"<VerificationSession(phone='{self.phone_number}', status='{self.status}')>"


class CreationJob(Base):
    __tablename__ = "creation_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    base_name = Column(String(100), nullable=False)
    starting_id = Column(Integer, nullable=False)
    total_accounts = Column(Integer, nullable=False)
    accounts_created = Column(Integer, default=0, nullable=False)
    accounts_failed = Column(Integer, default=0, nullable=False)
    
    status = Column(String(20), default="pending", nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    config_json = Column(Text, nullable=True)
    
    current_batch = Column(Integer, default=0, nullable=False)
    total_batches = Column(Integer, nullable=False)
    estimated_completion = Column(DateTime, nullable=True)
    
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<CreationJob(name='{self.name}', status='{self.status}')>"


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(255), nullable=True)
    
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    success = Column(Boolean, nullable=False)
    
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    proxy_used = Column(String(255), nullable=True)
    
    metadata_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    duration_ms = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    
    def __repr__(self) -> str:
        return f"<AuditLog(event_type='{self.event_type}', action='{self.action}')>"
