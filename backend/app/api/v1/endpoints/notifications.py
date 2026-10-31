"""
Notifications Endpoints
Operational alerts and status notification drawer feeds.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_authenticated
from app.database.session import get_db
from app.repositories import NotificationRepository
from app.schemas.auth import TokenPayload
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[Dict[str, Any]], summary="List Notifications")
def get_notifications(
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    repo = NotificationRepository(db)
    items = repo.get_unread(user_id=current_user.sub)
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": str(n.created_at)
        }
        for n in items
    ]


@router.patch("/{notification_id}/read", response_model=MessageResponse, summary="Mark Notification Read")
def mark_as_read(
    notification_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    repo = NotificationRepository(db)
    repo.update(notification_id, {"is_read": True})
    return MessageResponse(message="Notification marked as read.")
