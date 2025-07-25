import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..dependencies import (
    get_account_repository,
    get_audit_log_repository,
    get_db,
    get_password_manager,
)
from ..schemas import (
    AccountStats,
    BatchAccountCreate,
    BatchOperationResult,
    GmailAccountCreate,
    GmailAccountList,
    GmailAccountResponse,
    GmailAccountUpdate,
)
from ...core.password_manager import PasswordManager
from ...database.models import AccountStatus, GmailAccount
from ...database.repositories import AuditLogRepository, GmailAccountRepository
from ...utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/", response_model=GmailAccountList)
async def list_accounts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[AccountStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by email"),
    account_repo: GmailAccountRepository = Depends(get_account_repository),
) -> GmailAccountList:
    try:
        offset = (page - 1) * per_page

        if status:
            accounts = account_repo.get_by_status(status)
        else:
            accounts = account_repo.get_all(limit=per_page, offset=offset)

        if search:
            accounts = [acc for acc in accounts if search.lower() in acc.email.lower()]

        total = account_repo.count()
        pages = math.ceil(total / per_page)
        
        return GmailAccountList(
            accounts=[GmailAccountResponse.from_orm(acc) for acc in accounts],
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )
    
    except Exception as e:
        logger.error(f"Error listing accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve accounts"
        )


@router.get("/{account_id}", response_model=GmailAccountResponse)
async def get_account(
    account_id: int,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
) -> GmailAccountResponse:
    account = account_repo.get_by_id(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    return GmailAccountResponse.from_orm(account)


@router.post("/", response_model=GmailAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: GmailAccountCreate,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
    password_manager: PasswordManager = Depends(get_password_manager),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> GmailAccountResponse:
    try:
        existing_account = account_repo.get_by_email(account_data.email)
        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account with this email already exists"
            )

        encrypted_password = password_manager.encrypt_password(account_data.password)

        account = account_repo.create(
            email=account_data.email,
            password_encrypted=encrypted_password,
            first_name=account_data.first_name,
            last_name=account_data.last_name,
            birth_date=account_data.birth_date,
            recovery_email=account_data.recovery_email,
            phone_number=account_data.phone_number,
            status=AccountStatus.PENDING
        )

        db.commit()

        audit_repo.log_event(
            event_type="account_creation",
            entity_type="account",
            entity_id=str(account.id),
            action="create",
            description=f"Account created: {account.email}",
            success=True
        )
        
        db.commit()
        
        logger.info(f"Account created successfully: {account.email}")
        return GmailAccountResponse.from_orm(account)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )


@router.put("/{account_id}", response_model=GmailAccountResponse)
async def update_account(
    account_id: int,
    account_data: GmailAccountUpdate,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> GmailAccountResponse:
    try:
        account = account_repo.get_by_id(account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        update_data = account_data.dict(exclude_unset=True)
        updated_account = account_repo.update(account_id, **update_data)
        
        if not updated_account:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update account"
            )
        
        db.commit()
        
        audit_repo.log_event(
            event_type="account_update",
            entity_type="account",
            entity_id=str(account_id),
            action="update",
            description=f"Account updated: {updated_account.email}",
            success=True,
            metadata=update_data
        )
        
        db.commit()
        
        logger.info(f"Account updated successfully: {updated_account.email}")
        return GmailAccountResponse.from_orm(updated_account)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating account: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update account"
        )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> None:
    try:
        account = account_repo.get_by_id(account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        success = account_repo.delete(account_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete account"
            )
        
        db.commit()
        
        audit_repo.log_event(
            event_type="account_deletion",
            entity_type="account",
            entity_id=str(account_id),
            action="delete",
            description=f"Account deleted: {account.email}",
            success=True
        )
        
        db.commit()
        
        logger.info(f"Account deleted successfully: {account.email}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


@router.post("/batch", response_model=BatchOperationResult)
async def create_batch_accounts(
    batch_data: BatchAccountCreate,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
    password_manager: PasswordManager = Depends(get_password_manager),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> BatchOperationResult:
    try:
        created_accounts = []
        failed_accounts = []
        
        for i in range(batch_data.count):
            try:
                sequence_id = batch_data.starting_id + i
                email = f"{batch_data.base_name}{sequence_id}@gmail.com"
                password = password_manager.generate_password(batch_data.base_password, sequence_id)

                existing_account = account_repo.get_by_email(email)
                if existing_account:
                    failed_accounts.append(sequence_id)
                    continue

                encrypted_password = password_manager.encrypt_password(password)

                account = account_repo.create(
                    email=email,
                    password_encrypted=encrypted_password,
                    first_name=f"User{sequence_id}",
                    last_name="Test",
                    status=AccountStatus.PENDING
                )

                created_accounts.append(account.id)

                audit_repo.log_event(
                    event_type="batch_account_creation",
                    entity_type="account",
                    entity_id=str(account.id),
                    action="create",
                    description=f"Batch account created: {email}",
                    success=True
                )
            
            except Exception as e:
                logger.error(f"Error creating account {sequence_id}: {e}")
                failed_accounts.append(sequence_id)
        
        db.commit()
        
        result = BatchOperationResult(
            success=len(failed_accounts) == 0,
            message=f"Created {len(created_accounts)} accounts, {len(failed_accounts)} failed",
            created_accounts=created_accounts,
            failed_accounts=failed_accounts
        )
        
        logger.info(f"Batch account creation completed: {result.message}")
        return result
    
    except Exception as e:
        logger.error(f"Error in batch account creation: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create batch accounts"
        )


@router.get("/stats/summary", response_model=AccountStats)
async def get_account_stats(
    account_repo: GmailAccountRepository = Depends(get_account_repository),
) -> AccountStats:
    try:
        stats = account_repo.get_creation_stats()
        
        return AccountStats(
            total_accounts=sum(stats.values()),
            pending=stats.get("pending", 0),
            in_progress=stats.get("in_progress", 0),
            created=stats.get("created", 0),
            verified=stats.get("verified", 0),
            failed=stats.get("failed", 0),
            suspended=stats.get("suspended", 0)
        )
    
    except Exception as e:
        logger.error(f"Error getting account stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account statistics"
        )


@router.post("/{account_id}/retry")
async def retry_account_creation(
    account_id: int,
    account_repo: GmailAccountRepository = Depends(get_account_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: Session = Depends(get_db),
) -> GmailAccountResponse:
    try:
        account = account_repo.get_by_id(account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        if account.status not in [AccountStatus.FAILED, AccountStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is not in a retryable state"
            )
        
        updated_account = account_repo.update_status(account_id, AccountStatus.PENDING)
        db.commit()
        
        audit_repo.log_event(
            event_type="account_retry",
            entity_type="account",
            entity_id=str(account_id),
            action="retry",
            description=f"Account creation retry initiated: {account.email}",
            success=True
        )
        
        db.commit()
        
        logger.info(f"Account retry initiated: {account.email}")
        return GmailAccountResponse.from_orm(updated_account)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying account creation: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry account creation"
        )
