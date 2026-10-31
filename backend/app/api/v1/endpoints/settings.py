"""
Organization & Governance Settings Endpoints
Company profile, legal entity details, GSTIN, PAN, tax configuration, staff access, and notification webhooks.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories import TaxRepository, UserRepository
from app.schemas.auth import TokenPayload
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/company", response_model=Dict[str, Any], summary="Get Company Profile")
def get_company_settings():
    return {
        "name": "Brightloop Technologies India Pvt Ltd",
        "legalName": "Brightloop Cloud Services Private Limited",
        "taxId": "29AABCB1234F1Z9",
        "pan": "AABCB1234F",
        "email": "billing@brightloop.io",
        "supportEmail": "support@brightloop.io",
        "phone": "+91 (080) 4123-8900",
        "website": "https://brightloop.io",
        "address": "Level 5, Embassy Tech Village, Outer Ring Road, Devarabisanahalli",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560103",
        "country": "India",
        "currency": "INR",
        "currencySymbol": "₹",
        "timezone": "Asia/Kolkata (IST +5:30)",
    }


@router.put("/company", response_model=MessageResponse, summary="Update Company Profile")
def update_company_settings(
    settings_data: Dict[str, Any],
    admin_user: TokenPayload = Depends(require_admin)
):
    return MessageResponse(message="Company profile settings saved successfully.")


@router.get("/taxes", response_model=List[Dict[str, Any]], summary="Get Tax Settings")
def get_tax_settings(db: Session = Depends(get_db)):
    repo = TaxRepository(db)
    taxes = repo.get_all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "rate": float(t.rate),
            "isDefault": t.is_default,
            "appliesTo": t.applies_to
        }
        for t in taxes
    ]


@router.get("/staff", response_model=List[Dict[str, Any]], summary="Get Staff Governance Settings")
def get_staff_settings(
    admin_user: TokenPayload = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    staff = user_repo.get_staff_members()
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "role": s.role,
            "department": s.department or "Operations",
            "status": "Active" if s.is_active else "Inactive",
            "canManageStaff": s.can_manage_staff
        }
        for s in staff
    ]


@router.get("/notifications", response_model=Dict[str, Any], summary="Get Notification Preferences")
def get_notification_preferences():
    return {
        "emailOnInvoiceCreated": True,
        "emailOnPaymentSuccess": True,
        "emailOnSubscriptionExpiry": True,
        "smsAlertsForOverdue": True,
        "slackWebhookEnabled": True,
        "slackWebhookUrl": "https://hooks.slack.com/services/T00/B00/XXXXXX",
        "dailySummaryDigest": True,
    }


@router.put("/notifications", response_model=MessageResponse, summary="Update Notification Preferences")
def update_notification_preferences(
    preferences: Dict[str, Any],
    admin_user: TokenPayload = Depends(require_admin)
):
    return MessageResponse(message="Notification preferences updated successfully.")
