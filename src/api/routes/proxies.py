"""API routes for proxy management."""

import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..dependencies import (
    get_audit_log_repository,
    get_db,
    get_password_manager,
    get_proxy_manager,
    get_proxy_repository,
)
from ..schemas import (
    ProxyCreate,
    ProxyList,
    ProxyResponse,
    ProxyStats,
    ProxyUpdate,
)
from ...core.password_manager import PasswordManager
from ...core.proxy_manager import ProxyManager
from ...database.models import ProxyStatus
from ...database.repositories import AuditLogRepository, ProxyRepository
from ...utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/", response_model=ProxyList)
async def list_proxies(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[ProxyStatus] = Query(None, description="Filter by status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    proxy_repo: ProxyRepository = Depends(get_proxy_repository),
) -> ProxyList:
    """Get paginated list of proxies."""
    try:
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get proxies
        proxies = proxy_repo.get_all(limit=per_page, offset=offset)
        
        # Apply filters
        if status:
            proxies = [p for p in proxies if p.status == status]
        
        if country:
            proxies = [p for p in proxies if p.country == country.upper()]
        
        # Get total count
        total = proxy_repo.count()
        pages = math.ceil(total / per_page)
        
        return ProxyList(
            proxies=[ProxyResponse.from_orm(proxy) for proxy in proxies],
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )
    
    except Exception as e:
        logger.error(f"Error listing proxies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve proxies"
        )


@router.get("/{proxy_id}", response_model=ProxyResponse)
async def get_proxy(
    proxy_id: int,
    proxy_repo: ProxyRepository = Depends(get_proxy_repository),
) -> ProxyResponse:
    """Get a specific proxy by ID."""
    proxy = proxy_repo.get_by_id(proxy_id)
    if not proxy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proxy not found"
        )
    
    return ProxyResponse.from_orm(proxy)


@router.post("/", response_model=ProxyResponse, status_code=status.HTTP_201_CREATED)
async def create_proxy(
    proxy_data: ProxyCreate,
    proxy_manager: ProxyManager = Depends(get_proxy_manager),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> ProxyResponse:
    """Create a new proxy."""
    try:
        # Create proxy using proxy manager (includes health check)
        proxy = await proxy_manager.add_proxy(
            host=proxy_data.host,
            port=proxy_data.port,
            proxy_type=proxy_data.proxy_type,
            username=proxy_data.username,
            password=proxy_data.password,
            max_concurrent_usage=proxy_data.max_concurrent_usage,
            weight=proxy_data.weight
        )
        
        # Update additional fields
        if proxy_data.country:
            proxy.country = proxy_data.country.upper()
        if proxy_data.region:
            proxy.region = proxy_data.region
        if proxy_data.provider:
            proxy.provider = proxy_data.provider
        if proxy_data.notes:
            proxy.notes = proxy_data.notes
        
        db.commit()
        
        # Log audit event
        audit_repo.log_event(
            event_type="proxy_creation",
            entity_type="proxy",
            entity_id=str(proxy.id),
            action="create",
            description=f"Proxy created: {proxy.host}:{proxy.port}",
            success=True
        )
        
        db.commit()
        
        logger.info(f"Proxy created successfully: {proxy.host}:{proxy.port}")
        return ProxyResponse.from_orm(proxy)
    
    except Exception as e:
        logger.error(f"Error creating proxy: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create proxy"
        )


@router.delete("/{proxy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_proxy(
    proxy_id: int,
    proxy_manager: ProxyManager = Depends(get_proxy_manager),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> None:
    """Delete a proxy."""
    try:
        # Get proxy for logging
        proxy_repo = ProxyRepository(db)
        proxy = proxy_repo.get_by_id(proxy_id)
        if not proxy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proxy not found"
            )
        
        # Delete proxy using proxy manager
        success = await proxy_manager.remove_proxy(proxy_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete proxy - it may be in use"
            )
        
        # Log audit event
        audit_repo.log_event(
            event_type="proxy_deletion",
            entity_type="proxy",
            entity_id=str(proxy_id),
            action="delete",
            description=f"Proxy deleted: {proxy.host}:{proxy.port}",
            success=True
        )
        
        db.commit()
        
        logger.info(f"Proxy deleted successfully: {proxy.host}:{proxy.port}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting proxy: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete proxy"
        )


@router.get("/stats/summary", response_model=ProxyStats)
async def get_proxy_stats(
    proxy_manager: ProxyManager = Depends(get_proxy_manager),
) -> ProxyStats:
    """Get proxy statistics summary."""
    try:
        stats = await proxy_manager.get_proxy_statistics()
        return ProxyStats(**stats)
    
    except Exception as e:
        logger.error(f"Error getting proxy stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve proxy statistics"
        )


@router.post("/{proxy_id}/test")
async def test_proxy(
    proxy_id: int,
    proxy_repo: ProxyRepository = Depends(get_proxy_repository),
    proxy_manager: ProxyManager = Depends(get_proxy_manager),
) -> dict:
    """Test a specific proxy's health."""
    try:
        proxy = proxy_repo.get_by_id(proxy_id)
        if not proxy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proxy not found"
            )
        
        # Perform health check
        is_healthy, response_time, error = await proxy_manager.health_checker.check_proxy_health(proxy)
        
        return {
            "proxy_id": proxy_id,
            "healthy": is_healthy,
            "response_time_ms": response_time,
            "error": error,
            "timestamp": "now"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing proxy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to test proxy"
        )
