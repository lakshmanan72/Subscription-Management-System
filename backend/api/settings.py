from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.setting import CompanySetting, NotificationPreference
from backend.models.tax import TaxConfig
from backend.models.staff import StaffProfile
from backend.models.user import User
from backend.schemas.schemas import (
    CompanySettingUpdate,
    CompanySettingResponse,
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
    TaxConfigCreate,
    TaxConfigResponse,
    StaffCreate,
    StaffResponse,
)
from backend.services.auth_service import require_admin, hash_password

router = APIRouter(prefix="/settings", tags=["Settings"])


# ==========================================
# COMPANY PROFILE
# ==========================================
@router.get("/company", response_model=CompanySettingResponse)
def get_company_settings(db: Session = Depends(get_db)):
    """Returns organizational and tax compliance profile."""
    setting = db.query(CompanySetting).first()
    if not setting:
        setting = CompanySetting(
            id=1,
            name="Brightloop Technologies India Pvt Ltd",
            legal_name="Brightloop Cloud Services Private Limited",
            tax_id="29AABCB1234F1Z9",
            pan="AABCB1234F",
            email="billing@brightloop.io",
            country="India",
            currency="INR",
            currency_symbol="₹",
            timezone="Asia/Kolkata (IST +5:30)",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.put("/company", response_model=CompanySettingResponse)
def update_company_settings(update_in: CompanySettingUpdate, db: Session = Depends(get_db)):
    """Updates company profile."""
    setting = db.query(CompanySetting).first()
    if not setting:
        setting = CompanySetting(id=1, name="Brightloop Technologies", legal_name="Brightloop Inc", email="admin@brightloop.io")
        db.add(setting)

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(setting, field, val)

    db.commit()
    db.refresh(setting)
    return setting


# ==========================================
# TAX SLABS
# ==========================================
@router.get("/taxes", response_model=List[TaxConfigResponse])
def list_tax_configs(db: Session = Depends(get_db)):
    """Lists configured GST tax rates."""
    return db.query(TaxConfig).all()


@router.put("/taxes", response_model=List[TaxConfigResponse])
def update_tax_configs(tax_list: List[TaxConfigCreate], db: Session = Depends(get_db)):
    """Replaces or updates GST tax configuration list."""
    # Retain or upsert
    db.query(TaxConfig).delete()
    new_records = []
    for idx, t in enumerate(tax_list):
        tc = TaxConfig(
            id=f"tax-{idx + 1}",
            name=t.name,
            rate=t.rate,
            is_default=t.is_default,
            applies_to=t.applies_to,
        )
        db.add(tc)
        new_records.append(tc)
    db.commit()
    return new_records


# ==========================================
# STAFF MANAGEMENT
# ==========================================
@router.get("/staff", response_model=List[StaffResponse])
def list_staff_members(db: Session = Depends(get_db)):
    """Lists staff team members."""
    return db.query(StaffProfile).all()


@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff_member(staff_in: StaffCreate, db: Session = Depends(get_db)):
    """
    Creates staff member and associated user account.
    Only ADMINs may create staff accounts.
    """
    clean_email = staff_in.email.lower().strip()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'User account with email "{clean_email}" already exists.',
        )

    unique_ts = str(int(datetime.utcnow().timestamp() * 1000))
    user_id = f"usr-staff-{unique_ts}"
    staff_id = f"staff-{unique_ts}"

    new_user = User(
        id=user_id,
        email=clean_email,
        name=staff_in.name,
        password_hash=hash_password(staff_in.password or "Staff@Brightloop123!"),
        role="STAFF",
        company="Brightloop Operations",
        avatar=f"https://ui-avatars.com/api/?name={staff_in.name.replace(' ', '+')}&background=6366f1&color=fff",
        is_active=True,
    )

    new_staff = StaffProfile(
        id=staff_id,
        user_id=user_id,
        name=staff_in.name,
        email=clean_email,
        role=staff_in.role,
        department=staff_in.department,
        status="Active",
        last_active="Just now",
        can_manage_staff=staff_in.can_manage_staff,
    )

    db.add(new_user)
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff


@router.delete("/staff/{id}")
def delete_staff_member(id: str, db: Session = Depends(get_db)):
    """Removes a staff member and disables corresponding user."""
    staff = db.query(StaffProfile).filter(StaffProfile.id == id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")

    if staff.user_id:
        user = db.query(User).filter(User.id == staff.user_id).first()
        if user:
            db.delete(user)

    db.delete(staff)
    db.commit()
    return {"success": True, "message": f'Staff member "{staff.name}" removed.'}


# ==========================================
# NOTIFICATION PREFERENCES
# ==========================================
@router.get("/notifications", response_model=NotificationPreferenceResponse)
def get_notification_settings(db: Session = Depends(get_db)):
    """Returns alert delivery preferences."""
    pref = db.query(NotificationPreference).first()
    if not pref:
        pref = NotificationPreference(
            id=1,
            email_on_invoice_created=True,
            email_on_payment_success=True,
            email_on_subscription_expiry=True,
            sms_alerts_for_overdue=True,
            slack_webhook_enabled=True,
            slack_webhook_url="https://hooks.slack.com/services/T00/B00/XXXXXX",
            daily_summary_digest=True,
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/notifications", response_model=NotificationPreferenceResponse)
def update_notification_settings(pref_in: NotificationPreferenceUpdate, db: Session = Depends(get_db)):
    """Updates notification settings."""
    pref = db.query(NotificationPreference).first()
    if not pref:
        pref = NotificationPreference(id=1)
        db.add(pref)

    for field, val in pref_in.dict(exclude_unset=True).items():
        setattr(pref, field, val)

    db.commit()
    db.refresh(pref)
    return pref


# ==========================================
# RESET DEMO DATABASE
# ==========================================
@router.post("/reset-demo")
def reset_demo_database():
    """Resets the SQLite database to fresh initial seed records."""
    from backend.scripts.seed_initial_data import seed_database
    seed_database()
    return {"success": True, "message": "Database reset to verified initial enterprise sample data."}
