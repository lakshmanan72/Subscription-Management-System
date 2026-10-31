from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.discount import Discount
from backend.schemas.schemas import (
    DiscountCreate,
    DiscountUpdate,
    DiscountResponse,
    DiscountValidateRequest,
    DiscountValidateResponse,
)
from backend.services.auth_service import require_staff
from backend.services.discount_service import DiscountService

router = APIRouter(prefix="/discounts", tags=["Discounts"])


@router.get("", response_model=List[DiscountResponse])
def list_discounts(db: Session = Depends(get_db)):
    """Lists all discount coupon rules."""
    return db.query(Discount).order_by(Discount.created_at.desc()).all()


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(disc_in: DiscountCreate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Creates a new discount coupon."""
    clean_code = disc_in.code.strip().upper()
    if db.query(Discount).filter(Discount.code == clean_code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Coupon with code "{clean_code}" already exists.',
        )

    disc_id = f"disc-{int(datetime.utcnow().timestamp() * 1000)}"
    new_disc = Discount(
        id=disc_id,
        name=disc_in.name,
        code=clean_code,
        type=disc_in.type,
        value=disc_in.value,
        min_purchase=disc_in.min_purchase,
        min_quantity=disc_in.min_quantity,
        applicable_products=disc_in.applicable_products,
        applicable_subscriptions=disc_in.applicable_subscriptions,
        start_date=disc_in.start_date,
        end_date=disc_in.end_date,
        usage_limit=disc_in.usage_limit,
        usage_count=disc_in.usage_count or 0,
        status=disc_in.status,
        description=disc_in.description,
    )
    db.add(new_disc)
    db.commit()
    db.refresh(new_disc)
    return new_disc


@router.get("/{id}", response_model=DiscountResponse)
def get_discount(id: str, db: Session = Depends(get_db)):
    """Retrieves discount by ID or code."""
    disc = db.query(Discount).filter((Discount.id == id) | (Discount.code == id.upper())).first()
    if not disc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")
    return disc


@router.put("/{id}", response_model=DiscountResponse)
def update_discount(id: str, update_in: DiscountUpdate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Updates discount rules."""
    disc = db.query(Discount).filter(Discount.id == id).first()
    if not disc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        if field == "code" and val:
            val = val.strip().upper()
        setattr(disc, field, val)

    db.commit()
    db.refresh(disc)
    return disc


@router.patch("/{id}/status", response_model=DiscountResponse)
def toggle_discount_status(id: str, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Toggles discount status between Active and Inactive."""
    disc = db.query(Discount).filter(Discount.id == id).first()
    if not disc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")

    disc.status = "Inactive" if disc.status == "Active" else "Active"
    db.commit()
    db.refresh(disc)
    return disc


@router.post("/validate", response_model=DiscountValidateResponse)
def validate_discount(req: DiscountValidateRequest, db: Session = Depends(get_db)):
    """Validates coupon code against order subtotal and limits."""
    return DiscountService.validate_code(
        code=req.code,
        subtotal=req.subtotal,
        quantity=req.quantity,
        product_id=req.product_id,
        subscription_id=req.subscription_id,
        db=db,
    )
