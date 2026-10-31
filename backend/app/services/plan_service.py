"""
Subscription Plan Service
Configures and validates recurring billing cadences, term dates, and contract parameters.
"""

import uuid
from typing import List, Optional

from app.core.exceptions import EntityNotFoundException
from app.models.plan import Plan
from app.repositories import PlanRepository, ProductRepository
from app.schemas.plan import PlanCreate, PlanUpdate


class PlanService:
    def __init__(self, plan_repo: PlanRepository, product_repo: ProductRepository):
        self.plan_repo = plan_repo
        self.product_repo = product_repo

    def list_plans(self, active_only: bool = False) -> List[Plan]:
        if active_only:
            return self.plan_repo.get_active_plans()
        return self.plan_repo.get_all()

    def get_plan(self, plan_id: str) -> Plan:
        plan = self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise EntityNotFoundException("Plan", plan_id)
        return plan

    def create_plan(self, request: PlanCreate) -> Plan:
        # Validate associated product exists
        product = self.product_repo.get_by_id(request.product_id)
        if not product:
            raise EntityNotFoundException("Product", request.product_id)

        plan_id = f"plan-{uuid.uuid4().hex[:6]}"
        new_plan = Plan(
            id=plan_id,
            plan_name=request.plan_name.strip(),
            product_id=request.product_id,
            billing_frequency=request.billing_frequency,
            price=request.price,
            min_quantity=request.min_quantity,
            start_date=request.start_date,
            end_date=request.end_date,
            auto_close=request.auto_close,
            allow_early_closure=request.allow_early_closure,
            allow_pause=request.allow_pause,
            allow_renewal=request.allow_renewal,
            status=request.status,
            description=request.description
        )
        return self.plan_repo.create(new_plan)

    def update_plan(self, plan_id: str, request: PlanUpdate) -> Plan:
        plan = self.get_plan(plan_id)
        update_data = request.model_dump(exclude_unset=True)
        return self.plan_repo.update(plan_id, update_data) or plan

    def toggle_plan_status(self, plan_id: str) -> Plan:
        plan = self.get_plan(plan_id)
        new_status = "Disabled" if plan.status == "Active" else "Active"
        return self.plan_repo.update(plan_id, {"status": new_status}) or plan
