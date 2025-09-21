# src/interview_system/repositories/review_queue_repository.py

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_
from interview_system.models.review_queue import ReviewQueueItem


class ReviewQueueRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: UUID) -> Optional[ReviewQueueItem]:
        """
        Retrieves a review queue item by its ID, including rubric relationship.
        """
        return (
            self.db.query(ReviewQueueItem)
            .options(joinedload(ReviewQueueItem.rubric))
            .filter(ReviewQueueItem.id == item_id)
            .first()
        )

    def get_pending_items(self, skip: int = 0, limit: int = 50) -> List[ReviewQueueItem]:
        """
        Retrieves pending review queue items with pagination.
        """
        return (
            self.db.query(ReviewQueueItem)
            .options(joinedload(ReviewQueueItem.rubric))
            .filter(ReviewQueueItem.status == "pending")
            .order_by(desc(ReviewQueueItem.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(self, status: str, skip: int = 0, limit: int = 50) -> List[ReviewQueueItem]:
        """
        Retrieves review queue items by status with pagination.
        """
        return (
            self.db.query(ReviewQueueItem)
            .options(joinedload(ReviewQueueItem.rubric))
            .filter(ReviewQueueItem.status == status)
            .order_by(desc(ReviewQueueItem.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_domain(self, domain: str, status: str = None, 
                      skip: int = 0, limit: int = 50) -> List[ReviewQueueItem]:
        """
        Retrieves review queue items by domain, optionally filtered by status.
        """
        query = self.db.query(ReviewQueueItem).options(joinedload(ReviewQueueItem.rubric))
        
        filters = [ReviewQueueItem.domain == domain]
        if status:
            filters.append(ReviewQueueItem.status == status)
        
        return (
            query.filter(and_(*filters))
            .order_by(desc(ReviewQueueItem.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, candidate_question_json: dict, question_text: str,
               domain: str = None, difficulty: int = None, 
               ideal_answer_snippet: str = None, rubric_id: UUID = None,
               suggested_by: str = None) -> ReviewQueueItem:
        """
        Creates a new review queue item.
        """
        new_item = ReviewQueueItem(
            candidate_question_json=candidate_question_json,
            question_text=question_text,
            domain=domain,
            difficulty=difficulty,
            ideal_answer_snippet=ideal_answer_snippet,
            rubric_id=rubric_id,
            suggested_by=suggested_by,
            status="pending"
        )
        self.db.add(new_item)
        self.db.commit()
        self.db.refresh(new_item)
        return new_item

    def update(self, item_id: UUID, question_text: str = None,
               domain: str = None, difficulty: int = None,
               ideal_answer_snippet: str = None, rubric_id: UUID = None,
               candidate_question_json: dict = None) -> Optional[ReviewQueueItem]:
        """
        Updates an existing review queue item.
        """
        item = self.get_by_id(item_id)
        if not item:
            return None

        if question_text is not None:
            item.question_text = question_text
        if domain is not None:
            item.domain = domain
        if difficulty is not None:
            item.difficulty = difficulty
        if ideal_answer_snippet is not None:
            item.ideal_answer_snippet = ideal_answer_snippet
        if rubric_id is not None:
            item.rubric_id = rubric_id
        if candidate_question_json is not None:
            item.candidate_question_json = candidate_question_json

        self.db.commit()
        self.db.refresh(item)
        return item

    def approve(self, item_id: UUID, reviewed_by: UUID, 
                review_notes: str = None) -> Optional[ReviewQueueItem]:
        """
        Marks a review queue item as approved.
        """
        item = self.get_by_id(item_id)
        if not item:
            return None

        item.status = "approved"
        item.reviewed_by = reviewed_by
        item.reviewed_at = datetime.utcnow()
        if review_notes:
            item.review_notes = review_notes

        self.db.commit()
        self.db.refresh(item)
        return item

    def reject(self, item_id: UUID, reviewed_by: UUID, 
               review_notes: str = None) -> Optional[ReviewQueueItem]:
        """
        Marks a review queue item as rejected.
        """
        item = self.get_by_id(item_id)
        if not item:
            return None

        item.status = "rejected"
        item.reviewed_by = reviewed_by
        item.reviewed_at = datetime.utcnow()
        if review_notes:
            item.review_notes = review_notes

        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item_id: UUID) -> bool:
        """
        Deletes a review queue item by ID.
        """
        item = self.get_by_id(item_id)
        if not item:
            return False

        self.db.delete(item)
        self.db.commit()
        return True

    def count_by_status(self, status: str) -> int:
        """
        Returns the count of items by status.
        """
        return self.db.query(ReviewQueueItem).filter(ReviewQueueItem.status == status).count()

    def count_pending(self) -> int:
        """
        Returns the count of pending items.
        """
        return self.count_by_status("pending")

    def get_statistics(self) -> dict:
        """
        Returns statistics about the review queue.
        """
        total = self.db.query(ReviewQueueItem).count()
        pending = self.count_by_status("pending")
        approved = self.count_by_status("approved")
        rejected = self.count_by_status("rejected")

        return {
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": approved / (approved + rejected) if (approved + rejected) > 0 else 0
        }