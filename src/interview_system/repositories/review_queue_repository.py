# src/interview_system/repositories/review_queue_repository.py
import uuid
from sqlalchemy.orm import Session
from ..models.review_queue import ReviewQueue
from typing import List, Optional


class ReviewQueueRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_pending_question(self, question_json: dict) -> ReviewQueue:
        """
        Saves a new fallback question to the review queue.
        """
        new_item = ReviewQueue(candidate_question_json=question_json, status="pending")
        self.db.add(new_item)
        # Note: We commit in the agent using a context manager
        return new_item

    def get_pending_questions(self) -> List[ReviewQueue]:
        """
        Fetches all questions with 'pending' status.
        """
        return self.db.query(ReviewQueue).filter(ReviewQueue.status == "pending").all()

    def get_by_id(self, item_id: uuid.UUID) -> Optional[ReviewQueue]:
        """
        Gets a single review item by its ID.
        """
        return self.db.query(ReviewQueue).filter(ReviewQueue.id == item_id).first()

    def update_status(self, item: ReviewQueue, status: str) -> ReviewQueue:
        """
        Updates the status of a review item (e.g., to 'approved').
        """
        item.status = status
        self.db.commit()
        self.db.refresh(item)
        return item