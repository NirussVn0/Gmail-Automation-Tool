import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.connection import initialize_database
from .utils.config import get_config
from .utils.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = get_config()
    setup_logging(config.logging)
    db_manager = initialize_database(config.database)
    db_manager.create_tables()
    yield

def create_app() -> FastAPI:
    config = get_config()
    app = FastAPI(
        title=config.app_name,
        version=config.version,
        description="Automated Gmail account creation tool with proxy support and anti-detection measures",
        lifespan=lifespan
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    from .api.routes import accounts, proxies
    from .api import websocket
    app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
    app.include_router(proxies.router, prefix="/api/v1/proxies", tags=["proxies"])
    app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])
    @app.get("/")
    async def root():
        return {
            "message": "Gmail Automation Tool API",
            "version": config.version,
            "status": "running"
        }
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    config = get_config()
    uvicorn.run(
        "backend.main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.logging.level.lower()
    )
