from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.product import Product, ProductVariant
from backend.schemas.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductVariantCreate,
    ProductVariantResponse,
)
from backend.services.auth_service import require_staff, get_current_user_optional

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    """Lists all products with their variants."""
    return db.query(Product).order_by(Product.name).all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Creates a new product with optional variants."""
    # Check duplicate code
    if db.query(Product).filter(Product.code == product_in.code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Product with internal SKU/code "{product_in.code}" already exists.',
        )

    prod_id = f"prod-{int(datetime.utcnow().timestamp() * 1000)}"
    product = Product(
        id=prod_id,
        name=product_in.name,
        code=product_in.code,
        type=product_in.type,
        sales_price=product_in.sales_price,
        cost_price=product_in.cost_price,
        status=product_in.status,
        description=product_in.description,
    )

    if product_in.variants:
        for idx, v in enumerate(product_in.variants):
            var_id = f"var-{prod_id}-{idx + 1}"
            product.variants.append(
                ProductVariant(
                    id=var_id,
                    product_id=prod_id,
                    name=v.name,
                    price_adjustment=v.price_adjustment,
                    sku=v.sku,
                )
            )
    else:
        # Default standard variant
        product.variants.append(
            ProductVariant(
                id=f"var-{prod_id}-1",
                product_id=prod_id,
                name="Standard Edition",
                price_adjustment=0.0,
                sku=f"{product_in.code}-STD",
            )
        )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{id}", response_model=ProductResponse)
def get_product(id: str, db: Session = Depends(get_db)):
    """Retrieves a single product by ID."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return prod


@router.put("/{id}", response_model=ProductResponse)
def update_product(id: str, update_in: ProductUpdate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Updates an existing product and optional variants."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        if field == "variants":
            continue
        setattr(prod, field, val)

    if update_in.variants is not None:
        # Clear and replace variants
        prod.variants.clear()
        for idx, v in enumerate(update_in.variants):
            var_id = f"var-{id}-{idx + 1}"
            prod.variants.append(
                ProductVariant(
                    id=var_id,
                    product_id=id,
                    name=v.name,
                    price_adjustment=v.price_adjustment,
                    sku=v.sku,
                )
            )

    db.commit()
    db.refresh(prod)
    return prod


@router.delete("/{id}")
def delete_product(id: str, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Deletes a product and cascades to variants."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    db.delete(prod)
    db.commit()
    return {"success": True, "message": f'Product "{prod.name}" deleted successfully.'}


@router.get("/{id}/variants", response_model=List[ProductVariantResponse])
def list_product_variants(id: str, db: Session = Depends(get_db)):
    """Lists all variants for a given product."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return prod.variants


@router.post("/{id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_product_variant(id: str, variant_in: ProductVariantCreate, db: Session = Depends(get_db), _user=Depends(require_staff)):
    """Creates a new variant for an existing product."""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    var_id = f"var-{id}-{int(datetime.utcnow().timestamp() * 1000)}"
    new_var = ProductVariant(
        id=var_id,
        product_id=id,
        name=variant_in.name,
        price_adjustment=variant_in.price_adjustment,
        sku=variant_in.sku,
    )
    db.add(new_var)
    db.commit()
    db.refresh(new_var)
    return new_var
