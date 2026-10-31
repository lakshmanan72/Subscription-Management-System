"""
Product Service
Manages catalog items, dynamic variant pricing, SKU codes, and profit margin calculations.
"""

from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import DuplicateEntityException, EntityNotFoundException
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.repositories import ProductRepository, ProductVariantRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductVariantCreate
from app.utils.calculations import calculate_variant_price, round_currency


class ProductService:
    def __init__(self, product_repo: ProductRepository, variant_repo: ProductVariantRepository):
        self.product_repo = product_repo
        self.variant_repo = variant_repo

    def list_products(
        self,
        query: Optional[str] = None,
        type_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Product]:
        return self.product_repo.search(query=query, type_filter=type_filter, skip=skip, limit=limit)

    def get_product(self, product_id: str) -> Product:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return product

    def create_product(self, request: ProductCreate) -> Product:
        existing = self.product_repo.get_by_code(request.code)
        if existing:
            raise DuplicateEntityException("Product", "code", request.code)

        product_id = f"prod-{uuid.uuid4().hex[:6]}"
        new_prod = Product(
            id=product_id,
            name=request.name.strip(),
            code=request.code.strip().upper(),
            type=request.type,
            sales_price=request.sales_price,
            cost_price=request.cost_price,
            status=request.status,
            description=request.description
        )
        created = self.product_repo.create(new_prod)

        # Create variants if provided, or default standard variant
        variants_to_add = request.variants or [
            ProductVariantCreate(name="Standard Edition", sku=f"{new_prod.code}-STD", price_adjustment=Decimal("0.00"))
        ]
        for var in variants_to_add:
            var_id = f"var-{uuid.uuid4().hex[:6]}"
            new_var = ProductVariant(
                id=var_id,
                product_id=product_id,
                name=var.name.strip(),
                sku=var.sku,
                price_adjustment=var.price_adjustment
            )
            self.variant_repo.create(new_var)

        return self.get_product(product_id)

    def update_product(self, product_id: str, request: ProductUpdate) -> Product:
        prod = self.get_product(product_id)
        update_data = request.model_dump(exclude_unset=True, exclude={"variants"})
        if "code" in update_data and update_data["code"] != prod.code:
            existing = self.product_repo.get_by_code(update_data["code"])
            if existing and existing.id != product_id:
                raise DuplicateEntityException("Product", "code", update_data["code"])

        self.product_repo.update(product_id, update_data)
        return self.get_product(product_id)

    def calculate_price_with_variant(self, product_id: str, variant_id: Optional[str] = None) -> Decimal:
        prod = self.get_product(product_id)
        if not variant_id:
            return prod.sales_price
        var = self.variant_repo.get_by_id(variant_id)
        adjustment = var.price_adjustment if var else Decimal("0.00")
        return calculate_variant_price(prod.sales_price, adjustment)
