from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.quotation import Quotation, QuotationLine
from backend.schemas.schemas import QuotationCreate, QuotationUpdate, QuotationResponse, SubscriptionResponse
from backend.services.auth_service import get_current_user_optional, require_staff
from backend.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=List[QuotationResponse])
def list_quotations(db: Session = Depends(get_db)):
    """Lists all quotations."""
    return db.query(Quotation).order_by(Quotation.date.desc()).all()


@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(quo_in: QuotationCreate, db: Session = Depends(get_db)):
    """Creates a multi-line quotation with dynamic tax and line item calculation."""
    quo_count = db.query(Quotation).count() + 1
    new_id = f"QUO-2024-{str(quo_count + 100).zfill(3)}"

    new_quo = Quotation(
        id=new_id,
        customer=quo_in.customer,
        customer_id=quo_in.customer_id,
        template_name=quo_in.template_name,
        date=quo_in.date or datetime.utcnow().strftime("%Y-%m-%d"),
        validity_date=quo_in.validity_date,
        status=quo_in.status or "Draft",
        subtotal=quo_in.subtotal,
        tax=quo_in.tax,
        discount=quo_in.discount,
        total=quo_in.total,
        notes=quo_in.notes,
    )

    if quo_in.lines:
        for idx, line in enumerate(quo_in.lines):
            new_quo.lines.append(
                QuotationLine(
                    id=f"ql-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    product_name=line.product_name,
                    product_id=line.product_id,
                    plan_name=line.plan_name,
                    plan_id=line.plan_id,
                    variant_name=line.variant_name,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    discount=line.discount,
                    total=line.total,
                )
            )

    db.add(new_quo)
    db.commit()
    db.refresh(new_quo)
    return new_quo


@router.get("/{id}", response_model=QuotationResponse)
def get_quotation(id: str, db: Session = Depends(get_db)):
    """Retrieves a single quotation by ID."""
    quo = db.query(Quotation).filter(Quotation.id == id).first()
    if not quo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")
    return quo


@router.put("/{id}", response_model=QuotationResponse)
def update_quotation(id: str, update_in: QuotationUpdate, db: Session = Depends(get_db)):
    """Updates quotation details and lines."""
    quo = db.query(Quotation).filter(Quotation.id == id).first()
    if not quo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        if field == "lines":
            continue
        setattr(quo, field, val)

    if update_in.lines is not None:
        quo.lines.clear()
        for idx, line in enumerate(update_in.lines):
            quo.lines.append(
                QuotationLine(
                    id=f"ql-{id}-{idx + 1}",
                    product_name=line.product_name,
                    product_id=line.product_id,
                    plan_name=line.plan_name,
                    plan_id=line.plan_id,
                    variant_name=line.variant_name,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    discount=line.discount,
                    total=line.total,
                )
            )

    db.commit()
    db.refresh(quo)
    return quo


@router.post("/{id}/convert", response_model=SubscriptionResponse)
def convert_to_subscription(id: str, db: Session = Depends(get_db)):
    """1-Click conversion of confirmed quotation to active subscription contract."""
    return SubscriptionService.convert_quotation(quotation_id=id, db=db)


@router.delete("/{id}")
def delete_quotation(id: str, db: Session = Depends(get_db)):
    """Deletes quotation."""
    quo = db.query(Quotation).filter(Quotation.id == id).first()
    if not quo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    db.delete(quo)
    db.commit()
    return {"success": True, "message": f"Quotation {id} deleted."}
