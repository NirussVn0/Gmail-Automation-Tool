"""Database connection and session management."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..utils.config import DatabaseConfig
from ..utils.logging import get_logger
from .models import Base

logger = get_logger(__name__)


class DatabaseManager:
    """Database connection and session manager."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._engine = None
        self._session_factory = None
        self._initialize_database()
    
    def _initialize_database(self) -> None:
        """Initialize database engine and session factory."""
        logger.info("Initializing database connection", url=self.config.url)
        
        # Create engine with configuration
        engine_kwargs = {
            "echo": self.config.echo,
        }
        
        # Add connection pool settings for non-SQLite databases
        if not self.config.url.startswith("sqlite"):
            engine_kwargs.update({
                "pool_size": self.config.pool_size,
                "max_overflow": self.config.max_overflow,
                "pool_pre_ping": True,  # Verify connections before use
                "pool_recycle": 3600,   # Recycle connections every hour
            })
        
        self._engine = create_engine(self.config.url, **engine_kwargs)
        self._session_factory = sessionmaker(
            bind=self._engine,
            autocommit=False,
            autoflush=False
        )
        
        logger.info("Database connection initialized successfully")
    
    def create_tables(self) -> None:
        """Create all database tables."""
        logger.info("Creating database tables")
        Base.metadata.create_all(bind=self._engine)
        logger.info("Database tables created successfully")
    
    def drop_tables(self) -> None:
        """Drop all database tables."""
        logger.warning("Dropping all database tables")
        Base.metadata.drop_all(bind=self._engine)
        logger.info("Database tables dropped successfully")
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """Get a database session with automatic cleanup."""
        session = self._session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error("Database session error", error=str(e))
            raise
        finally:
            session.close()
    
    def get_session_factory(self) -> sessionmaker:
        """Get the session factory for dependency injection."""
        return self._session_factory
    
    @property
    def engine(self):
        """Get the database engine."""
        return self._engine


# Global database manager instance
_db_manager: DatabaseManager = None


def initialize_database(config: DatabaseConfig) -> DatabaseManager:
    """Initialize the global database manager."""
    global _db_manager
    _db_manager = DatabaseManager(config)
    return _db_manager


def get_database_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    if _db_manager is None:
        raise RuntimeError("Database manager not initialized. Call initialize_database() first.")
    return _db_manager


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Get a database session (convenience function)."""
    db_manager = get_database_manager()
    with db_manager.get_session() as session:
        yield session
