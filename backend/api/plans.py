from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.plan import Plan
from backend.models.product import Product
from backend.schemas.schemas import PlanCreate, PlanUpdate, PlanResponse
from backend.services.auth_service import require_staff

router = APIRouter(prefix="/plans", tags=["Plans"])


@router.get("", response_model=List[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    """Lists all subscription plans."""
    return db.query(Plan).order_by(Plan.plan_name).all()


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(plan_in: PlanCreate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Creates a new subscription plan."""
    plan_id = f"plan-{int(datetime.utcnow().timestamp() * 1000)}"

    # Auto-resolve product_name if product_id is provided
    product_name = plan_in.product_name
    if plan_in.product_id and not product_name:
        prod = db.query(Product).filter(Product.id == plan_in.product_id).first()
        if prod:
            product_name = prod.name

    new_plan = Plan(
        id=plan_id,
        plan_name=plan_in.plan_name,
        product_id=plan_in.product_id,
        product_name=product_name,
        billing_frequency=plan_in.billing_frequency,
        price=plan_in.price,
        min_quantity=plan_in.min_quantity,
        start_date=plan_in.start_date,
        end_date=plan_in.end_date,
        auto_close=plan_in.auto_close,
        allow_early_closure=plan_in.allow_early_closure,
        allow_pause=plan_in.allow_pause,
        allow_renewal=plan_in.allow_renewal,
        status=plan_in.status,
        description=plan_in.description,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan


@router.get("/{id}", response_model=PlanResponse)
def get_plan(id: str, db: Session = Depends(get_db)):
    """Retrieves a single subscription plan by ID."""
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    return plan


@router.put("/{id}", response_model=PlanResponse)
def update_plan(id: str, update_in: PlanUpdate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Updates plan attributes."""
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(plan, field, val)

    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/{id}/status", response_model=PlanResponse)
def toggle_plan_status(id: str, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Toggles plan status between Active and Disabled."""
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    plan.status = "Disabled" if plan.status == "Active" else "Active"
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{id}")
def delete_plan(id: str, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Deletes a plan."""
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    db.delete(plan)
    db.commit()
    return {"success": True, "message": f'Plan "{plan.plan_name}" deleted.'}
