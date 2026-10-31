"""
Product Catalog Endpoints
Catalog management, search, filtering, and variant add-on pricing.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.product_variant import ProductVariant
from app.repositories import ProductRepository, ProductVariantRepository
from app.schemas.auth import TokenPayload
from app.schemas.common import MessageResponse
from app.schemas.product import (
    ProductCreate, ProductResponse, ProductUpdate,
    ProductVariantCreate, ProductVariantResponse
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db), ProductVariantRepository(db))


@router.get("", response_model=List[ProductResponse], summary="List Products")
def list_products(
    search: Optional[str] = Query(None, description="Search by product name or code"),
    type: Optional[str] = Query(None, description="Filter by type: Service, Storable, Consumable"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_service: ProductService = Depends(get_product_service)
):
    return product_service.list_products(query=search, type_filter=type, skip=skip, limit=limit)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create Product")
def create_product(
    request: ProductCreate,
    admin_user: TokenPayload = Depends(require_admin),
    product_service: ProductService = Depends(get_product_service)
):
    return product_service.create_product(request)


@router.get("/{product_id}", response_model=ProductResponse, summary="Get Product Details")
def get_product(
    product_id: str,
    product_service: ProductService = Depends(get_product_service)
):
    return product_service.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponse, summary="Update Product")
def update_product(
    product_id: str,
    request: ProductUpdate,
    admin_user: TokenPayload = Depends(require_admin),
    product_service: ProductService = Depends(get_product_service)
):
    return product_service.update_product(product_id, request)


@router.delete("/{product_id}", response_model=MessageResponse, summary="Deactivate Product")
def delete_product(
    product_id: str,
    admin_user: TokenPayload = Depends(require_admin),
    product_service: ProductService = Depends(get_product_service)
):
    product_service.update_product(product_id, ProductUpdate(status="Inactive"))
    return MessageResponse(message=f"Product {product_id} has been deactivated.")


@router.get("/{product_id}/variants", response_model=List[ProductVariantResponse], summary="List Product Variants")
def list_product_variants(
    product_id: str,
    db: Session = Depends(get_db)
):
    repo = ProductVariantRepository(db)
    return repo.get_by_product_id(product_id)


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED, summary="Add Product Variant")
def add_product_variant(
    product_id: str,
    request: ProductVariantCreate,
    admin_user: TokenPayload = Depends(require_admin),
    db: Session = Depends(get_db)
):
    import uuid
    repo = ProductVariantRepository(db)
    var_id = f"var-{uuid.uuid4().hex[:6]}"
    new_var = ProductVariant(
        id=var_id,
        product_id=product_id,
        name=request.name.strip(),
        sku=request.sku,
        price_adjustment=request.price_adjustment
    )
    return repo.create(new_var)
