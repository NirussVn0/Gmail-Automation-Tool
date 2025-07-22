"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from ..database.models import AccountStatus, ProxyStatus, VerificationStatus


# Base schemas
class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    class Config:
        from_attributes = True


# Gmail Account schemas
class GmailAccountBase(BaseSchema):
    """Base Gmail account schema."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birth_date: Optional[datetime] = None
    recovery_email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$')


class GmailAccountCreate(GmailAccountBase):
    """Schema for creating Gmail accounts."""
    password: str = Field(..., min_length=8)


class GmailAccountUpdate(BaseSchema):
    """Schema for updating Gmail accounts."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birth_date: Optional[datetime] = None
    recovery_email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$')
    status: Optional[AccountStatus] = None


class GmailAccountResponse(GmailAccountBase):
    """Schema for Gmail account responses."""
    id: int
    status: AccountStatus
    creation_attempts: int
    last_attempt_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    proxy_id: Optional[int]


class GmailAccountList(BaseSchema):
    """Schema for paginated Gmail account list."""
    accounts: List[GmailAccountResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Proxy schemas
class ProxyBase(BaseSchema):
    """Base proxy schema."""
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    proxy_type: str = Field(default="http", pattern=r'^(http|https|socks5)$')
    username: Optional[str] = None
    max_concurrent_usage: int = Field(default=5, ge=1, le=100)
    weight: float = Field(default=1.0, ge=0.1, le=10.0)
    country: Optional[str] = Field(None, min_length=2, max_length=2)
    region: Optional[str] = None
    provider: Optional[str] = None
    notes: Optional[str] = None


class ProxyCreate(ProxyBase):
    """Schema for creating proxies."""
    password: Optional[str] = None


class ProxyUpdate(BaseSchema):
    """Schema for updating proxies."""
    username: Optional[str] = None
    password: Optional[str] = None
    max_concurrent_usage: Optional[int] = Field(None, ge=1, le=100)
    weight: Optional[float] = Field(None, ge=0.1, le=10.0)
    status: Optional[ProxyStatus] = None
    country: Optional[str] = Field(None, min_length=2, max_length=2)
    region: Optional[str] = None
    provider: Optional[str] = None
    notes: Optional[str] = None


class ProxyResponse(ProxyBase):
    """Schema for proxy responses."""
    id: int
    status: ProxyStatus
    last_checked_at: Optional[datetime]
    response_time_ms: Optional[float]
    success_rate: float
    total_requests: int
    successful_requests: int
    current_usage: int
    created_at: datetime
    updated_at: datetime


class ProxyList(BaseSchema):
    """Schema for paginated proxy list."""
    proxies: List[ProxyResponse]
    total: int
    page: int
    per_page: int
    pages: int


class ProxyStats(BaseSchema):
    """Schema for proxy statistics."""
    total_proxies: int
    active_proxies: int
    failed_proxies: int
    total_usage: int
    average_response_time: float
    average_success_rate: float


# Verification schemas
class VerificationSessionBase(BaseSchema):
    """Base verification session schema."""
    phone_number: str = Field(..., pattern=r'^\+?[\d\s\-\(\)]+$')
    service_name: str


class VerificationSessionCreate(BaseSchema):
    """Schema for creating verification sessions."""
    account_id: int
    service: str = Field(default="google")
    country: str = Field(default="US", min_length=2, max_length=2)
    preferred_provider: Optional[str] = None


class VerificationSessionResponse(VerificationSessionBase):
    """Schema for verification session responses."""
    id: int
    account_id: int
    status: VerificationStatus
    requested_at: datetime
    code_received_at: Optional[datetime]
    verified_at: Optional[datetime]
    expires_at: Optional[datetime]
    retry_count: int
    max_retries: int
    cost: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime


# Creation Job schemas
class CreationJobBase(BaseSchema):
    """Base creation job schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    base_name: str = Field(..., min_length=1, max_length=100)
    starting_id: int = Field(..., ge=1)
    total_accounts: int = Field(..., ge=1, le=1000)


class CreationJobCreate(CreationJobBase):
    """Schema for creating creation jobs."""
    pass


class CreationJobUpdate(BaseSchema):
    """Schema for updating creation jobs."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r'^(pending|running|completed|failed|cancelled)$')


class CreationJobResponse(CreationJobBase):
    """Schema for creation job responses."""
    id: int
    accounts_created: int
    accounts_failed: int
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    current_batch: int
    total_batches: int
    estimated_completion: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    max_retries: int
    created_at: datetime
    updated_at: datetime


class CreationJobList(BaseSchema):
    """Schema for paginated creation job list."""
    jobs: List[CreationJobResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Batch operation schemas
class BatchAccountCreate(BaseSchema):
    """Schema for batch account creation."""
    base_name: str = Field(..., min_length=1, max_length=100)
    starting_id: int = Field(..., ge=1)
    count: int = Field(..., ge=1, le=100)
    base_password: str = Field(..., min_length=8)
    use_proxy: bool = Field(default=True)
    verify_phone: bool = Field(default=False)


class BatchOperationResult(BaseSchema):
    """Schema for batch operation results."""
    success: bool
    message: str
    created_accounts: List[int] = []
    failed_accounts: List[int] = []
    job_id: Optional[int] = None


# Statistics schemas
class AccountStats(BaseSchema):
    """Schema for account statistics."""
    total_accounts: int
    pending: int
    in_progress: int
    created: int
    verified: int
    failed: int
    suspended: int


class SystemStats(BaseSchema):
    """Schema for system statistics."""
    accounts: AccountStats
    proxies: ProxyStats
    active_jobs: int
    pending_verifications: int
    system_uptime: str
    last_updated: datetime


# WebSocket schemas
class WebSocketMessage(BaseSchema):
    """Schema for WebSocket messages."""
    type: str
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AccountCreationUpdate(BaseSchema):
    """Schema for account creation updates via WebSocket."""
    account_id: int
    email: str
    status: AccountStatus
    message: str
    progress: Optional[float] = None


class JobProgressUpdate(BaseSchema):
    """Schema for job progress updates via WebSocket."""
    job_id: int
    job_name: str
    accounts_created: int
    accounts_failed: int
    total_accounts: int
    current_batch: int
    total_batches: int
    estimated_completion: Optional[datetime]
    status: str
