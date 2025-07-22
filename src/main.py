"""Main application entry point."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.connection import initialize_database
from .utils.config import get_config
from .utils.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    config = get_config()
    
    # Setup logging
    setup_logging(config.logging)
    
    # Initialize database
    db_manager = initialize_database(config.database)
    db_manager.create_tables()
    
    yield
    
    # Shutdown
    # Add cleanup code here if needed


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    config = get_config()
    
    app = FastAPI(
        title=config.app_name,
        version=config.version,
        description="Automated Gmail account creation tool with proxy support and anti-detection measures",
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    from .api.routes import accounts, proxies
    from .api import websocket

    app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
    app.include_router(proxies.router, prefix="/api/v1/proxies", tags=["proxies"])
    app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Gmail Automation Tool API",
            "version": config.version,
            "status": "running"
        }
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy"}
    
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    config = get_config()
    uvicorn.run(
        "src.main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.logging.level.lower()
    )
