# src/interview_system/api/routers/admin.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ...auth.dependencies import get_current_user
from ...models.user import User
from ...repositories.review_queue_repository import ReviewQueueRepository
from ...repositories.question_repository import QuestionRepository
from ...services.vector_store import get_vector_store
from ...schemas.admin import ReviewQueueItemResponse, ApproveQuestionResponse

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/review-queue", response_model=List[ReviewQueueItemResponse])
def get_pending_review_items(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Fetches all questions from the review queue with 'pending' status.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    repo = ReviewQueueRepository(db)
    pending_items = repo.get_pending_questions()
    return pending_items


@router.post("/review-queue/{item_id}/approve", response_model=ApproveQuestionResponse)
def approve_pending_question(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_user_id = current_user.get("user_id")
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    review_repo = ReviewQueueRepository(db)
    question_repo = QuestionRepository(db)

    item_to_approve = review_repo.get_by_id(item_id)
    if not item_to_approve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found"
        )
    if item_to_approve.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is not in 'pending' status",
        )

    try:
        # new_question.id will now be the SHA-256 hash string
        new_question = question_repo.create_from_review_item(
            item_to_approve, admin_id=uuid.UUID(admin_user_id)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save question to database: {e}",
        )

    pinecone_status = "success"
    try:
        vector_store = get_vector_store()

        # --- UPDATED PINE CONE UPSERT LOGIC ---
        # new_question.id is now a string, so explicit str() cast is no longer strictly necessary.
        question_to_upsert = {
            "id": new_question.id,  # Use the string hash directly
            "text": new_question.text,
            "domain": new_question.domain,
            "difficulty": new_question.difficulty,
            "ideal_answer_snippet": new_question.ideal_answer_snippet or "",  # Coalesce None to ""
            "rubric_id": new_question.rubric_id or "",  # Coalesce None to ""
        }
        # --- END OF UPDATE ---

        # --- THIS IS THE CHANGE ---
        # Specify the target namespace for the upsert
        vector_store.upsert_questions(
            [question_to_upsert], namespace="updated-namespace"
        )
        # --- END OF CHANGE ---

    except Exception as e:
        pinecone_status = f"failed: {e}"
        # Log the *actual* error to your backend console
        print(f"Failed to upsert to Pinecone: {e}")

    review_repo.update_status(item_to_approve, status="approved")

    return ApproveQuestionResponse(
        message="Question approved and indexed successfully.",
        question_id=new_question.id,  # Pass the string hash
        pinecone_upsert_status=pinecone_status,
    )


@router.post("/review-queue/{item_id}/reject", status_code=status.HTTP_200_OK)
def reject_pending_question(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Rejects a question by updating its status in the review queue.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    review_repo = ReviewQueueRepository(db)

    # 1. Get the item
    item_to_reject = review_repo.get_by_id(item_id)
    if not item_to_reject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found"
        )
    if item_to_reject.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Item is already processed"
        )

    # 2. Update its status to 'rejected'
    review_repo.update_status(item_to_reject, status="rejected")

    return {"message": f"Item {item_id} has been rejected."}
