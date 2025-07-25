from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Type, TypeVar

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from ..utils.logging import LoggerMixin
from .models import (
    AccountStatus,
    AuditLog,
    CreationJob,
    GmailAccount,
    Proxy,
    ProxyStatus,
    VerificationSession,
    VerificationStatus,
)

T = TypeVar("T")


class BaseRepository(ABC, LoggerMixin):
    def __init__(self, session: Session, model_class: Type[T]):
        self.session = session
        self.model_class = model_class
    
    def create(self, **kwargs: Any) -> T:
        entity = self.model_class(**kwargs)
        self.session.add(entity)
        self.session.flush()
        self.logger.info(f"Created {self.model_class.__name__}", entity_id=entity.id)
        return entity
    
    def get_by_id(self, entity_id: int) -> Optional[T]:
        return self.session.query(self.model_class).filter(
            self.model_class.id == entity_id
        ).first()
    
    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[T]:
        query = self.session.query(self.model_class)
        if limit:
            query = query.limit(limit).offset(offset)
        return query.all()
    
    def update(self, entity_id: int, **kwargs: Any) -> Optional[T]:
        entity = self.get_by_id(entity_id)
        if entity:
            for key, value in kwargs.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)
            self.session.flush()
            self.logger.info(f"Updated {self.model_class.__name__}", entity_id=entity_id)
        return entity
    
    def delete(self, entity_id: int) -> bool:
        entity = self.get_by_id(entity_id)
        if entity:
            self.session.delete(entity)
            self.session.flush()
            self.logger.info(f"Deleted {self.model_class.__name__}", entity_id=entity_id)
            return True
        return False
    
    def count(self) -> int:
        return self.session.query(self.model_class).count()


class GmailAccountRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, GmailAccount)
    
    def get_by_email(self, email: str) -> Optional[GmailAccount]:
        return self.session.query(GmailAccount).filter(
            GmailAccount.email == email
        ).first()
    
    def get_by_status(self, status: AccountStatus) -> List[GmailAccount]:
        return self.session.query(GmailAccount).filter(
            GmailAccount.status == status
        ).all()
    
    def get_pending_accounts(self, limit: Optional[int] = None) -> List[GmailAccount]:
        query = self.session.query(GmailAccount).filter(
            GmailAccount.status == AccountStatus.PENDING
        ).order_by(GmailAccount.created_at)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def get_failed_accounts(self, max_attempts: int = 3) -> List[GmailAccount]:
        return self.session.query(GmailAccount).filter(
            and_(
                GmailAccount.status == AccountStatus.FAILED,
                GmailAccount.creation_attempts < max_attempts
            )
        ).all()
    
    def update_status(self, account_id: int, status: AccountStatus, error_message: Optional[str] = None) -> Optional[GmailAccount]:
        account = self.get_by_id(account_id)
        if account:
            account.status = status
            account.last_attempt_at = datetime.utcnow()
            
            if status == AccountStatus.FAILED:
                account.creation_attempts += 1
            
            self.session.flush()
            self.logger.info("Account status updated", account_id=account_id, status=status.value)
        
        return account
    
    def get_accounts_by_proxy(self, proxy_id: int) -> List[GmailAccount]:
        return self.session.query(GmailAccount).filter(
            GmailAccount.proxy_id == proxy_id
        ).all()
    
    def get_creation_stats(self) -> Dict[str, int]:
        stats = {}
        for status in AccountStatus:
            count = self.session.query(GmailAccount).filter(
                GmailAccount.status == status
            ).count()
            stats[status.value] = count
        
        return stats


class ProxyRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, Proxy)
    
    def get_active_proxies(self) -> List[Proxy]:
        return self.session.query(Proxy).filter(
            Proxy.status == ProxyStatus.ACTIVE
        ).all()
    
    def get_by_host_port(self, host: str, port: int) -> Optional[Proxy]:
        return self.session.query(Proxy).filter(
            and_(Proxy.host == host, Proxy.port == port)
        ).first()
    
    def get_least_used_proxy(self) -> Optional[Proxy]:
        return self.session.query(Proxy).filter(
            Proxy.status == ProxyStatus.ACTIVE
        ).order_by(Proxy.current_usage).first()
    
    def get_best_performing_proxies(self, limit: int = 10) -> List[Proxy]:
        return self.session.query(Proxy).filter(
            and_(
                Proxy.status == ProxyStatus.ACTIVE,
                Proxy.total_requests > 0
            )
        ).order_by(
            desc(Proxy.success_rate),
            Proxy.response_time_ms
        ).limit(limit).all()
    
    def update_proxy_stats(
        self,
        proxy_id: int,
        response_time_ms: float,
        success: bool
    ) -> Optional[Proxy]:
        proxy = self.get_by_id(proxy_id)
        if proxy:
            proxy.total_requests += 1
            if success:
                proxy.successful_requests += 1
            
            proxy.success_rate = proxy.successful_requests / proxy.total_requests

            if proxy.response_time_ms is None:
                proxy.response_time_ms = response_time_ms
            else:
                proxy.response_time_ms = (proxy.response_time_ms * 0.8) + (response_time_ms * 0.2)
            
            proxy.last_checked_at = datetime.utcnow()
            self.session.flush()
            
            self.logger.info(
                "Proxy stats updated",
                proxy_id=proxy_id,
                success_rate=proxy.success_rate,
                response_time=proxy.response_time_ms
            )
        
        return proxy
    
    def increment_usage(self, proxy_id: int) -> Optional[Proxy]:
        proxy = self.get_by_id(proxy_id)
        if proxy:
            proxy.current_usage += 1
            self.session.flush()
        return proxy
    
    def decrement_usage(self, proxy_id: int) -> Optional[Proxy]:
        proxy = self.get_by_id(proxy_id)
        if proxy and proxy.current_usage > 0:
            proxy.current_usage -= 1
            self.session.flush()
        return proxy


class VerificationSessionRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, VerificationSession)
    
    def get_by_account_id(self, account_id: int) -> List[VerificationSession]:
        return self.session.query(VerificationSession).filter(
            VerificationSession.account_id == account_id
        ).order_by(desc(VerificationSession.created_at)).all()
    
    def get_pending_verifications(self) -> List[VerificationSession]:
        return self.session.query(VerificationSession).filter(
            VerificationSession.status.in_([
                VerificationStatus.PENDING,
                VerificationStatus.SENT
            ])
        ).all()
    
    def get_expired_sessions(self) -> List[VerificationSession]:
        now = datetime.utcnow()
        return self.session.query(VerificationSession).filter(
            and_(
                VerificationSession.expires_at < now,
                VerificationSession.status.in_([
                    VerificationStatus.PENDING,
                    VerificationStatus.SENT
                ])
            )
        ).all()
    
    def update_verification_code(
        self,
        session_id: int,
        verification_code: str
    ) -> Optional[VerificationSession]:
        session = self.get_by_id(session_id)
        if session:
            session.verification_code = verification_code
            session.code_received_at = datetime.utcnow()
            session.status = VerificationStatus.SENT
            self.session.flush()
            
            self.logger.info(
                "Verification code received",
                session_id=session_id,
                phone_number=session.phone_number
            )
        
        return session


class CreationJobRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, CreationJob)
    
    def get_active_jobs(self) -> List[CreationJob]:
        return self.session.query(CreationJob).filter(
            CreationJob.status.in_(["pending", "running"])
        ).all()
    
    def get_job_by_name(self, name: str) -> Optional[CreationJob]:
        return self.session.query(CreationJob).filter(
            CreationJob.name == name
        ).first()
    
    def update_progress(
        self,
        job_id: int,
        accounts_created: int,
        accounts_failed: int,
        current_batch: int
    ) -> Optional[CreationJob]:
        job = self.get_by_id(job_id)
        if job:
            job.accounts_created = accounts_created
            job.accounts_failed = accounts_failed
            job.current_batch = current_batch
            self.session.flush()
            
            self.logger.info(
                "Job progress updated",
                job_id=job_id,
                created=accounts_created,
                failed=accounts_failed,
                batch=current_batch
            )
        
        return job


class AuditLogRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, AuditLog)
    
    def log_event(
        self,
        event_type: str,
        entity_type: str,
        action: str,
        description: str,
        success: bool,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[float] = None,
        error_message: Optional[str] = None
    ) -> AuditLog:
        import json
        
        audit_log = AuditLog(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            success=success,
            metadata_json=json.dumps(metadata) if metadata else None,
            duration_ms=duration_ms,
            error_message=error_message
        )
        
        self.session.add(audit_log)
        self.session.flush()
        
        return audit_log
    
    def get_events_by_type(self, event_type: str, limit: int = 100) -> List[AuditLog]:
        return self.session.query(AuditLog).filter(
            AuditLog.event_type == event_type
        ).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    
    def get_events_by_entity(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 100
    ) -> List[AuditLog]:
        return self.session.query(AuditLog).filter(
            and_(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id
            )
        ).order_by(desc(AuditLog.timestamp)).limit(limit).all()
