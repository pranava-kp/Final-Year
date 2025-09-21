# src/interview_system/repositories/rubric_repository.py

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc
from interview_system.models.rubric import Rubric


class RubricRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, rubric_id: UUID) -> Optional[Rubric]:
        """
        Retrieves a rubric by its ID.
        """
        return self.db.query(Rubric).filter(Rubric.id == rubric_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Rubric]:
        """
        Retrieves all rubrics with pagination.
        """
        return (
            self.db.query(Rubric)
            .order_by(desc(Rubric.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_domain(self, domain: str, skip: int = 0, limit: int = 100) -> List[Rubric]:
        """
        Retrieves rubrics filtered by domain.
        """
        return (
            self.db.query(Rubric)
            .filter(Rubric.domain == domain)
            .order_by(desc(Rubric.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, name: str, criteria: dict, description: str = None, 
               domain: str = None, created_by: UUID = None) -> Rubric:
        """
        Creates a new rubric.
        """
        new_rubric = Rubric(
            name=name,
            description=description,
            criteria=criteria,
            domain=domain,
            created_by=created_by
        )
        self.db.add(new_rubric)
        self.db.commit()
        self.db.refresh(new_rubric)
        return new_rubric

    def update(self, rubric_id: UUID, name: str = None, criteria: dict = None,
               description: str = None, domain: str = None) -> Optional[Rubric]:
        """
        Updates an existing rubric.
        """
        rubric = self.get_by_id(rubric_id)
        if not rubric:
            return None

        if name is not None:
            rubric.name = name
        if criteria is not None:
            rubric.criteria = criteria
        if description is not None:
            rubric.description = description
        if domain is not None:
            rubric.domain = domain

        self.db.commit()
        self.db.refresh(rubric)
        return rubric

    def delete(self, rubric_id: UUID) -> bool:
        """
        Deletes a rubric by ID.
        """
        rubric = self.get_by_id(rubric_id)
        if not rubric:
            return False

        self.db.delete(rubric)
        self.db.commit()
        return True

    def count(self) -> int:
        """
        Returns the total count of rubrics.
        """
        return self.db.query(Rubric).count()

    def count_by_domain(self, domain: str) -> int:
        """
        Returns the count of rubrics for a specific domain.
        """
        return self.db.query(Rubric).filter(Rubric.domain == domain).count()