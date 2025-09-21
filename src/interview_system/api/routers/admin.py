# src/interview_system/api/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from interview_system.api.database import get_db
from interview_system.auth.dependencies import get_admin_user
from interview_system.repositories.review_queue_repository import ReviewQueueRepository
from interview_system.repositories.rubric_repository import RubricRepository
from interview_system.schemas.admin import (
    ReviewQueueItemResponse,
    ReviewQueueItemCreate,
    ReviewQueueItemUpdate,
    ReviewAction,
    RubricResponse,
    RubricCreate,
    RubricUpdate,
    AdminStatsResponse
)
from interview_system.models.user import User

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_admin_user)]  # All routes require admin access
)


# ===== REVIEW QUEUE ENDPOINTS =====

@router.get("/review-queue", response_model=List[ReviewQueueItemResponse])
def get_review_queue(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db)
):
    """
    Get review queue items with optional filtering and pagination.
    """
    repo = ReviewQueueRepository(db)
    
    if status:
        items = repo.get_by_status(status, limit=limit, offset=offset)
    elif domain:
        items = repo.get_by_domain(domain, limit=limit, offset=offset)
    else:
        items = repo.get_pending_items(limit=limit, offset=offset)
    
    return items


@router.get("/review-queue/{item_id}", response_model=ReviewQueueItemResponse)
def get_review_queue_item(
    item_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific review queue item by ID.
    """
    repo = ReviewQueueRepository(db)
    item = repo.get_by_id(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review queue item not found"
        )
    
    return item


@router.post("/review-queue", response_model=ReviewQueueItemResponse)
def create_review_queue_item(
    item_data: ReviewQueueItemCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new review queue item.
    """
    repo = ReviewQueueRepository(db)
    
    # Set the suggested_by field to current admin user
    item_dict = item_data.model_dump()
    if not item_dict.get("suggested_by"):
        item_dict["suggested_by"] = f"admin:{current_user.name}"
    
    item = repo.create(**item_dict)
    return item


@router.put("/review-queue/{item_id}", response_model=ReviewQueueItemResponse)
def update_review_queue_item(
    item_id: UUID,
    item_data: ReviewQueueItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a review queue item.
    """
    repo = ReviewQueueRepository(db)
    
    # Check if item exists
    existing_item = repo.get_by_id(item_id)
    if not existing_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review queue item not found"
        )
    
    # Update only provided fields
    update_data = item_data.model_dump(exclude_unset=True)
    item = repo.update(item_id, **update_data)
    return item


@router.post("/review-queue/{item_id}/approve", response_model=ReviewQueueItemResponse)
def approve_review_queue_item(
    item_id: UUID,
    action_data: ReviewAction,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Approve a review queue item.
    """
    repo = ReviewQueueRepository(db)
    
    try:
        item = repo.approve(
            item_id=item_id,
            reviewer_id=current_user.id,
            review_notes=action_data.review_notes
        )
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/review-queue/{item_id}/reject", response_model=ReviewQueueItemResponse)
def reject_review_queue_item(
    item_id: UUID,
    action_data: ReviewAction,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Reject a review queue item.
    """
    repo = ReviewQueueRepository(db)
    
    try:
        item = repo.reject(
            item_id=item_id,
            reviewer_id=current_user.id,
            review_notes=action_data.review_notes
        )
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/review-queue/{item_id}")
def delete_review_queue_item(
    item_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a review queue item.
    """
    repo = ReviewQueueRepository(db)
    
    success = repo.delete(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review queue item not found"
        )
    
    return {"message": "Review queue item deleted successfully"}


# ===== RUBRIC ENDPOINTS =====

@router.get("/rubrics", response_model=List[RubricResponse])
def get_rubrics(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    limit: int = Query(50, ge=1, le=100, description="Number of rubrics to return"),
    offset: int = Query(0, ge=0, description="Number of rubrics to skip"),
    db: Session = Depends(get_db)
):
    """
    Get rubrics with optional filtering and pagination.
    """
    repo = RubricRepository(db)
    
    if domain:
        rubrics = repo.get_by_domain(domain, limit=limit, offset=offset)
    else:
        rubrics = repo.get_all(limit=limit, offset=offset)
    
    return rubrics


@router.get("/rubrics/{rubric_id}", response_model=RubricResponse)
def get_rubric(
    rubric_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific rubric by ID.
    """
    repo = RubricRepository(db)
    rubric = repo.get_by_id(rubric_id)
    
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    return rubric


@router.post("/rubrics", response_model=RubricResponse)
def create_rubric(
    rubric_data: RubricCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new rubric.
    """
    repo = RubricRepository(db)
    rubric = repo.create(**rubric_data.model_dump())
    return rubric


@router.put("/rubrics/{rubric_id}", response_model=RubricResponse)
def update_rubric(
    rubric_id: UUID,
    rubric_data: RubricUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a rubric.
    """
    repo = RubricRepository(db)
    
    # Check if rubric exists
    existing_rubric = repo.get_by_id(rubric_id)
    if not existing_rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    # Update only provided fields
    update_data = rubric_data.model_dump(exclude_unset=True)
    rubric = repo.update(rubric_id, **update_data)
    return rubric


@router.delete("/rubrics/{rubric_id}")
def delete_rubric(
    rubric_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a rubric.
    """
    repo = RubricRepository(db)
    
    success = repo.delete(rubric_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rubric not found"
        )
    
    return {"message": "Rubric deleted successfully"}


# ===== STATISTICS ENDPOINTS =====

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    """
    Get admin dashboard statistics.
    """
    review_repo = ReviewQueueRepository(db)
    rubric_repo = RubricRepository(db)
    
    # Get review queue statistics
    review_stats = review_repo.get_statistics()
    
    # Get rubric statistics
    total_rubrics = rubric_repo.count()
    rubrics_by_domain = rubric_repo.count_by_domain()
    
    return AdminStatsResponse(
        total_pending=review_stats["pending"],
        total_approved=review_stats["approved"],
        total_rejected=review_stats["rejected"],
        approval_rate=review_stats["approval_rate"],
        total_rubrics=total_rubrics,
        rubrics_by_domain=rubrics_by_domain
    )