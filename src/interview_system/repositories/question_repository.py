# src/interview_system/repositories/question_repository.py
import uuid
import hashlib  # <-- 1. Import hashlib
from sqlalchemy.orm import Session
from ..models.question import Question
from ..models.review_queue import ReviewQueue


class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_from_review_item(
        self, review_item: ReviewQueue, admin_id: uuid.UUID
    ) -> Question:
        """
        Creates a new Question from an approved ReviewQueue item.
        """
        # Extract the structured data from the JSON
        # This structure matches your agent's fallback output
        raw_q_data = review_item.candidate_question_json.get("raw_question", {})

        # --- Modifications Start ---

        question_text = raw_q_data.get("text")
        if not question_text:
            raise ValueError("Review item contains no question text to hash.")

        # 2. Generate the SHA-256 hash ID
        sha256_hash = hashlib.sha256(question_text.encode("utf-8")).hexdigest()

        new_question = Question(
            id=sha256_hash,  # <-- 3. Explicitly set the hash as the ID
            text=question_text,
            domain=raw_q_data.get("domain"),
            difficulty=raw_q_data.get("difficulty"),
            ideal_answer_snippet=raw_q_data.get("ideal_answer_snippet"),
            promoted_by_admin_id=admin_id,
            # rubric_id=raw_q_data.get("rubric_id") # <-- Add this if it exists in your JSON
        )

        # 4. Add try/except block for safer commits
        try:
            self.db.add(new_question)
            self.db.commit()
            self.db.refresh(new_question)
        except Exception as e:
            self.db.rollback()  # Rollback on error
            print(f"Database error in create_from_review_item: {e}")
            raise  # Re-raise the exception

        # --- Modifications End ---

        return new_question