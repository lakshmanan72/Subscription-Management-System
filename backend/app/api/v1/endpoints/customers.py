"""
Customer CRM Endpoints
Directory search, client entity management, and customer profile details with data isolation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEntityException, EntityNotFoundException
from app.core.permissions import check_customer_data_isolation, require_admin_or_staff, require_authenticated
from app.database.session import get_db
from app.models.customer import Customer
from app.repositories import CustomerRepository, InvoiceRepository, SubscriptionRepository
from app.schemas.auth import TokenPayload
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.schemas.invoice import InvoiceResponse
from app.schemas.subscription import SubscriptionResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse], summary="List / Search Customers")
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, company, or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    repo = CustomerRepository(db)
    return repo.search(query=search, skip=skip, limit=limit)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED, summary="Create Customer")
def create_customer(
    request: CustomerCreate,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    repo = CustomerRepository(db)
    existing = repo.get_by_email(request.email)
    if existing:
        raise DuplicateEntityException("Customer", "email", request.email)

    import uuid
    cust_id = f"cust-{uuid.uuid4().hex[:6]}"
    new_customer = Customer(
        id=cust_id,
        name=request.name.strip(),
        company=request.company.strip(),
        email=request.email.lower().strip(),
        phone=request.phone,
        gstin=request.gstin.strip().upper() if request.gstin else None,
        pan=request.pan.strip().upper() if request.pan else None,
        address=request.address,
        city=request.city,
        state=request.state,
        postal_code=request.postal_code,
        country=request.country,
        status="Active"
    )
    return repo.create(new_customer)


@router.get("/{customer_id}", response_model=CustomerResponse, summary="Get Customer Detail")
def get_customer(
    customer_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    check_customer_data_isolation(current_user, customer_id)
    repo = CustomerRepository(db)
    cust = repo.get_by_id(customer_id)
    if not cust:
        raise EntityNotFoundException("Customer", customer_id)
    return cust


@router.put("/{customer_id}", response_model=CustomerResponse, summary="Update Customer Profile")
def update_customer(
    customer_id: str,
    request: CustomerUpdate,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    check_customer_data_isolation(current_user, customer_id)
    repo = CustomerRepository(db)
    cust = repo.get_by_id(customer_id)
    if not cust:
        raise EntityNotFoundException("Customer", customer_id)

    update_data = request.model_dump(exclude_unset=True)
    return repo.update(customer_id, update_data) or cust


@router.get("/{customer_id}/subscriptions", response_model=List[SubscriptionResponse], summary="Get Customer Subscriptions")
def get_customer_subscriptions(
    customer_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    check_customer_data_isolation(current_user, customer_id)
    sub_repo = SubscriptionRepository(db)
    return sub_repo.get_by_customer(customer_id)


@router.get("/{customer_id}/invoices", response_model=List[InvoiceResponse], summary="Get Customer Invoices")
def get_customer_invoices(
    customer_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    check_customer_data_isolation(current_user, customer_id)
    inv_repo = InvoiceRepository(db)
    return inv_repo.get_by_customer(customer_id)
