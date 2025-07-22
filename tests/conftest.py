"""Pytest configuration and fixtures."""

import asyncio
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from src.database.models import Base
from src.database.connection import DatabaseManager
from src.utils.config import AppConfig, DatabaseConfig, SecurityConfig
from src.main import create_app
from src.core.password_manager import PasswordManager


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_config():
    """Create test configuration."""
    return AppConfig(
        database=DatabaseConfig(
            url="sqlite:///:memory:",
            echo=False
        ),
        security=SecurityConfig(
            secret_key="test-secret-key-32-characters-long",
            encryption_key="test-encryption-key-32-characters",
            password_salt="test-password-salt-32-characters"
        )
    )


@pytest.fixture(scope="session")
def test_engine(test_config):
    """Create test database engine."""
    engine = create_engine(
        test_config.database.url,
        echo=test_config.database.echo
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_session(test_engine):
    """Create test database session."""
    Session = sessionmaker(bind=test_engine)
    session = Session()
    
    # Start a transaction
    transaction = session.begin()
    
    yield session
    
    # Rollback transaction to clean up
    transaction.rollback()
    session.close()


@pytest.fixture(scope="function")
def test_db_manager(test_config):
    """Create test database manager."""
    return DatabaseManager(test_config.database)


@pytest.fixture(scope="function")
def test_password_manager(test_config):
    """Create test password manager."""
    return PasswordManager(test_config.security)


@pytest.fixture(scope="function")
def test_client(test_config):
    """Create test FastAPI client."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def sample_account_data():
    """Sample account data for testing."""
    return {
        "email": "test@gmail.com",
        "password": "TestPassword123",
        "first_name": "Test",
        "last_name": "User",
        "birth_date": "1990-01-01",
        "recovery_email": "recovery@gmail.com",
        "phone_number": "+1234567890"
    }


@pytest.fixture
def sample_proxy_data():
    """Sample proxy data for testing."""
    return {
        "host": "127.0.0.1",
        "port": 8080,
        "proxy_type": "http",
        "username": "testuser",
        "password": "testpass",
        "max_concurrent_usage": 5,
        "weight": 1.0,
        "country": "US",
        "region": "California",
        "provider": "TestProvider"
    }


@pytest.fixture
def sample_verification_data():
    """Sample verification data for testing."""
    return {
        "account_id": 1,
        "phone_number": "+1234567890",
        "service_name": "TestService",
        "service_session_id": "test_session_123"
    }
