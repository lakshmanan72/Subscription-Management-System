"""
Base Repository Architecture
Generic CRUD interface and implementation using SQLAlchemy 2.x patterns.
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from sqlalchemy import func, select, update, delete
from sqlalchemy.orm import Session

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic base repository for SQLAlchemy 2.x models."""
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: Any) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Any = None
    ) -> List[ModelType]:
        stmt = select(self.model)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def count(self) -> int:
        stmt = select(func.count(self.model.id))
        return self.db.execute(stmt).scalar() or 0

    def create(self, entity: ModelType) -> ModelType:
        self.db.add(entity)
        self.db.flush()
        return entity

    def update(self, id: Any, values: Dict[str, Any]) -> Optional[ModelType]:
        stmt = (
            update(self.model)
            .where(self.model.id == id)
            .values(**values)
            .execution_options(synchronize_session="fetch")
        )
        self.db.execute(stmt)
        self.db.flush()
        return self.get_by_id(id)

    def delete(self, id: Any) -> bool:
        stmt = delete(self.model).where(self.model.id == id)
        res = self.db.execute(stmt)
        self.db.flush()
        return res.rowcount > 0
