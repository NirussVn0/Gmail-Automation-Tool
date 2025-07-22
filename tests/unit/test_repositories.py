"""Unit tests for database repositories."""

import pytest
from datetime import datetime, timedelta

from src.database.models import AccountStatus, ProxyStatus, VerificationStatus
from src.database.repositories import (
    GmailAccountRepository,
    ProxyRepository,
    VerificationSessionRepository,
    AuditLogRepository
)


class TestGmailAccountRepository:
    """Test cases for GmailAccountRepository."""
    
    def test_create_account(self, test_session, sample_account_data):
        """Test creating a Gmail account."""
        repo = GmailAccountRepository(test_session)
        
        account = repo.create(
            email=sample_account_data["email"],
            password_encrypted="encrypted_password",
            first_name=sample_account_data["first_name"],
            last_name=sample_account_data["last_name"]
        )
        
        assert account.id is not None
        assert account.email == sample_account_data["email"]
        assert account.first_name == sample_account_data["first_name"]
        assert account.last_name == sample_account_data["last_name"]
        assert account.status == AccountStatus.PENDING
    
    def test_get_by_email(self, test_session, sample_account_data):
        """Test getting account by email."""
        repo = GmailAccountRepository(test_session)
        
        # Create account
        created_account = repo.create(
            email=sample_account_data["email"],
            password_encrypted="encrypted_password",
            first_name=sample_account_data["first_name"],
            last_name=sample_account_data["last_name"]
        )
        
        # Get by email
        found_account = repo.get_by_email(sample_account_data["email"])
        
        assert found_account is not None
        assert found_account.id == created_account.id
        assert found_account.email == sample_account_data["email"]
    
    def test_get_by_email_not_found(self, test_session):
        """Test getting account by email when not found."""
        repo = GmailAccountRepository(test_session)
        
        account = repo.get_by_email("nonexistent@gmail.com")
        assert account is None
    
    def test_get_by_status(self, test_session, sample_account_data):
        """Test getting accounts by status."""
        repo = GmailAccountRepository(test_session)
        
        # Create accounts with different statuses
        account1 = repo.create(
            email="test1@gmail.com",
            password_encrypted="encrypted_password",
            first_name="Test1",
            last_name="User",
            status=AccountStatus.PENDING
        )
        
        account2 = repo.create(
            email="test2@gmail.com",
            password_encrypted="encrypted_password",
            first_name="Test2",
            last_name="User",
            status=AccountStatus.CREATED
        )
        
        # Get pending accounts
        pending_accounts = repo.get_by_status(AccountStatus.PENDING)
        assert len(pending_accounts) == 1
        assert pending_accounts[0].id == account1.id
        
        # Get created accounts
        created_accounts = repo.get_by_status(AccountStatus.CREATED)
        assert len(created_accounts) == 1
        assert created_accounts[0].id == account2.id
    
    def test_update_status(self, test_session, sample_account_data):
        """Test updating account status."""
        repo = GmailAccountRepository(test_session)
        
        # Create account
        account = repo.create(
            email=sample_account_data["email"],
            password_encrypted="encrypted_password",
            first_name=sample_account_data["first_name"],
            last_name=sample_account_data["last_name"]
        )
        
        # Update status
        updated_account = repo.update_status(account.id, AccountStatus.CREATED)
        
        assert updated_account is not None
        assert updated_account.status == AccountStatus.CREATED
        assert updated_account.last_attempt_at is not None
    
    def test_get_creation_stats(self, test_session):
        """Test getting account creation statistics."""
        repo = GmailAccountRepository(test_session)
        
        # Create accounts with different statuses
        repo.create(
            email="pending@gmail.com",
            password_encrypted="encrypted_password",
            first_name="Pending",
            last_name="User",
            status=AccountStatus.PENDING
        )
        
        repo.create(
            email="created@gmail.com",
            password_encrypted="encrypted_password",
            first_name="Created",
            last_name="User",
            status=AccountStatus.CREATED
        )
        
        repo.create(
            email="failed@gmail.com",
            password_encrypted="encrypted_password",
            first_name="Failed",
            last_name="User",
            status=AccountStatus.FAILED
        )
        
        stats = repo.get_creation_stats()
        
        assert stats["pending"] == 1
        assert stats["created"] == 1
        assert stats["failed"] == 1


class TestProxyRepository:
    """Test cases for ProxyRepository."""
    
    def test_create_proxy(self, test_session, sample_proxy_data):
        """Test creating a proxy."""
        repo = ProxyRepository(test_session)
        
        proxy = repo.create(**sample_proxy_data)
        
        assert proxy.id is not None
        assert proxy.host == sample_proxy_data["host"]
        assert proxy.port == sample_proxy_data["port"]
        assert proxy.proxy_type == sample_proxy_data["proxy_type"]
        assert proxy.status == ProxyStatus.INACTIVE
    
    def test_get_by_host_port(self, test_session, sample_proxy_data):
        """Test getting proxy by host and port."""
        repo = ProxyRepository(test_session)
        
        # Create proxy
        created_proxy = repo.create(**sample_proxy_data)
        
        # Get by host and port
        found_proxy = repo.get_by_host_port(
            sample_proxy_data["host"],
            sample_proxy_data["port"]
        )
        
        assert found_proxy is not None
        assert found_proxy.id == created_proxy.id
    
    def test_get_active_proxies(self, test_session, sample_proxy_data):
        """Test getting active proxies."""
        repo = ProxyRepository(test_session)
        
        # Create active proxy
        active_proxy = repo.create(**sample_proxy_data)
        active_proxy.status = ProxyStatus.ACTIVE
        
        # Create inactive proxy
        inactive_data = sample_proxy_data.copy()
        inactive_data["port"] = 8081
        inactive_proxy = repo.create(**inactive_data)
        inactive_proxy.status = ProxyStatus.INACTIVE
        
        # Get active proxies
        active_proxies = repo.get_active_proxies()
        
        assert len(active_proxies) == 1
        assert active_proxies[0].id == active_proxy.id
    
    def test_update_proxy_stats(self, test_session, sample_proxy_data):
        """Test updating proxy statistics."""
        repo = ProxyRepository(test_session)
        
        # Create proxy
        proxy = repo.create(**sample_proxy_data)
        
        # Update stats
        updated_proxy = repo.update_proxy_stats(proxy.id, 150.5, True)
        
        assert updated_proxy is not None
        assert updated_proxy.total_requests == 1
        assert updated_proxy.successful_requests == 1
        assert updated_proxy.success_rate == 1.0
        assert updated_proxy.response_time_ms == 150.5
        assert updated_proxy.last_checked_at is not None
    
    def test_increment_decrement_usage(self, test_session, sample_proxy_data):
        """Test incrementing and decrementing proxy usage."""
        repo = ProxyRepository(test_session)
        
        # Create proxy
        proxy = repo.create(**sample_proxy_data)
        assert proxy.current_usage == 0
        
        # Increment usage
        updated_proxy = repo.increment_usage(proxy.id)
        assert updated_proxy.current_usage == 1
        
        # Increment again
        updated_proxy = repo.increment_usage(proxy.id)
        assert updated_proxy.current_usage == 2
        
        # Decrement usage
        updated_proxy = repo.decrement_usage(proxy.id)
        assert updated_proxy.current_usage == 1
        
        # Decrement again
        updated_proxy = repo.decrement_usage(proxy.id)
        assert updated_proxy.current_usage == 0
        
        # Decrement when already at 0 (should not go negative)
        updated_proxy = repo.decrement_usage(proxy.id)
        assert updated_proxy.current_usage == 0


class TestVerificationSessionRepository:
    """Test cases for VerificationSessionRepository."""
    
    def test_create_verification_session(self, test_session, sample_verification_data):
        """Test creating a verification session."""
        repo = VerificationSessionRepository(test_session)
        
        session = repo.create(**sample_verification_data)
        
        assert session.id is not None
        assert session.account_id == sample_verification_data["account_id"]
        assert session.phone_number == sample_verification_data["phone_number"]
        assert session.status == VerificationStatus.PENDING
    
    def test_update_verification_code(self, test_session, sample_verification_data):
        """Test updating verification code."""
        repo = VerificationSessionRepository(test_session)
        
        # Create session
        session = repo.create(**sample_verification_data)
        
        # Update verification code
        verification_code = "123456"
        updated_session = repo.update_verification_code(session.id, verification_code)
        
        assert updated_session is not None
        assert updated_session.verification_code == verification_code
        assert updated_session.code_received_at is not None
        assert updated_session.status == VerificationStatus.SENT
    
    def test_get_expired_sessions(self, test_session, sample_verification_data):
        """Test getting expired verification sessions."""
        repo = VerificationSessionRepository(test_session)
        
        # Create expired session
        expired_session = repo.create(**sample_verification_data)
        expired_session.expires_at = datetime.utcnow() - timedelta(hours=1)
        expired_session.status = VerificationStatus.PENDING
        
        # Create non-expired session
        active_data = sample_verification_data.copy()
        active_data["phone_number"] = "+9876543210"
        active_session = repo.create(**active_data)
        active_session.expires_at = datetime.utcnow() + timedelta(hours=1)
        active_session.status = VerificationStatus.PENDING
        
        # Get expired sessions
        expired_sessions = repo.get_expired_sessions()
        
        assert len(expired_sessions) == 1
        assert expired_sessions[0].id == expired_session.id


class TestAuditLogRepository:
    """Test cases for AuditLogRepository."""
    
    def test_log_event(self, test_session):
        """Test logging an audit event."""
        repo = AuditLogRepository(test_session)
        
        audit_log = repo.log_event(
            event_type="test_event",
            entity_type="test_entity",
            action="test_action",
            description="Test description",
            success=True,
            entity_id="123",
            metadata={"key": "value"},
            duration_ms=150.5
        )
        
        assert audit_log.id is not None
        assert audit_log.event_type == "test_event"
        assert audit_log.entity_type == "test_entity"
        assert audit_log.action == "test_action"
        assert audit_log.description == "Test description"
        assert audit_log.success is True
        assert audit_log.entity_id == "123"
        assert audit_log.duration_ms == 150.5
        assert audit_log.timestamp is not None
    
    def test_get_events_by_type(self, test_session):
        """Test getting events by type."""
        repo = AuditLogRepository(test_session)
        
        # Create events of different types
        repo.log_event(
            event_type="type1",
            entity_type="entity",
            action="action",
            description="Description 1",
            success=True
        )
        
        repo.log_event(
            event_type="type2",
            entity_type="entity",
            action="action",
            description="Description 2",
            success=True
        )
        
        repo.log_event(
            event_type="type1",
            entity_type="entity",
            action="action",
            description="Description 3",
            success=True
        )
        
        # Get events by type
        type1_events = repo.get_events_by_type("type1")
        type2_events = repo.get_events_by_type("type2")
        
        assert len(type1_events) == 2
        assert len(type2_events) == 1
        assert all(event.event_type == "type1" for event in type1_events)
        assert all(event.event_type == "type2" for event in type2_events)
