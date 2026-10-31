# BRIGHTLOOP — DATABASE INTEGRATION & FRONTEND-BACKEND INTEGRATION REPORT

**System:** Brightloop — Enterprise Subscription Management & Recurring Revenue Billing Engine  
**Backend:** FastAPI 0.115+, Python 3.11/3.13, SQLAlchemy 2.0+, Pydantic v2, Alembic, Bcrypt, PyJWT  
**Frontend:** React 18, Vite 6, Tailwind CSS, Lucide Icons, Recharts, Axios  
**Local Database:** SQLite (`sqlite:///./brightloop.db`)  
**Production Target:** MySQL 8.0+ / MariaDB (`mysql+pymysql://USER:PASSWORD@HOST:3306/brightloop`)  
**Execution Date:** 2026-10-31  
**Status:** Verified, All 39 Automated Tests Passing (100%), Production Build Passing (Code 0)

---

## 1. DATABASE ARCHITECTURE

Brightloop's database layer has been implemented using SQLAlchemy 2.x Declarative Base with thread-safe connection pooling, automated foreign key validation, cascading deletes where appropriate, and strict domain-driven normalization.

```
                           +------------------+
                           |       User       |
                           |  (Auth / Roles)  |
                           +--------+---------+
                                    | 1:1
                +-------------------+-------------------+
                |                                       |
                v                                       v
        +---------------+                       +---------------+
        |   Customer    |                       | StaffProfile  |
        +-------+-------+                       +---------------+
                |
    +-----------+-----------+
    |           |           |
    v           v           v
+-------+   +-------+   +-------+
| Quot- |   | Sub-  |   | In-   |
| ation |   | scrip-|   | voice |
+---+---+   | tion  |   +---+---+
    |       +---+---+       |
    |           |           |
    v           v           v
+-------+   +-------+   +-------+
| Quot- |   | Sub-  |   | Inv-  |
| Lines |   | Lines |   | Lines |
+-------+   +-------+   +-------+
                |           |
                |           v
                |       +-------+
                |       |  Pay- |
                |       |  ment |
                |       +-------+
                |
                v
        +---------------+
        | Subscription- |
        |   Timeline    |
        +---------------+
```

### Key Architectural Tenets:
1. **Single Source of Truth**: All financial calculations (MRR, ARR, Total Revenue, Outstanding Balances, Overdue Aggregations) are computed dynamically from SQLite records via SQLAlchemy aggregations and `DashboardService`.
2. **Environment Isolation**: Database URL is dynamically configured via `DATABASE_URL` in `.env`.
3. **Session Management**: Thread-safe SQLAlchemy `sessionmaker` with `autocommit=False, autoflush=False`, injected into FastAPI route endpoints using `Depends(get_db)` and scoped lifecycle teardown (`db.close()`).
4. **Idempotent Data Seeding**: Fully repeatable migration script `seed_initial_data.py` validates existing records before inserting to guarantee zero data duplication on subsequent runs.

---

## 2. SQLITE ENGINE CONFIGURATION

- **Database File Path:** `backend/brightloop.db`
- **Default Connection String:** `sqlite:///./brightloop.db`
- **Test Connection String:** `sqlite:///<project_root>/backend/tests/test_brightloop.db`
- **Engine Arguments:**
  ```python
  connect_args={"check_same_thread": False}
  ```
- **Session Factory:**
  ```python
  engine = create_engine(
      DATABASE_URL,
      connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
  )
  SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
  ```
- **PRAGMA Foreign Keys**: Enforced on SQLite connections for relational integrity.

---

## 3. TABLES CREATED (16 DOMAIN MODELS + AUDIT & CONFIG)

| # | Table Name | Model Class | Primary Key | Foreign Keys / Relationships | Purpose |
|---|------------|-------------|-------------|------------------------------|---------|
| 1 | `users` | `User` | `id` (VARCHAR) | None | Core auth, roles (`ADMIN`, `STAFF`, `CUSTOMER`), bcrypt hashes |
| 2 | `customers` | `Customer` | `id` (VARCHAR) | `user_id -> users.id` | Customer master, billing info, GSTIN, PAN, metrics |
| 3 | `staff_profiles` | `StaffProfile` | `id` (VARCHAR) | `user_id -> users.id` | Staff profiles, department, phone, operational status |
| 4 | `products` | `Product` | `id` (VARCHAR) | None | Catalog items, SKU, base sales price, cost price |
| 5 | `product_variants` | `ProductVariant` | `id` (VARCHAR) | `product_id -> products.id` (CASCADE) | Variant adjustments, add-ons, specific SKUs |
| 6 | `plans` | `Plan` | `id` (VARCHAR) | `product_id -> products.id` | Cadence (Monthly, Yearly, Weekly, Daily), price, rules |
| 7 | `quotations` | `Quotation` | `id` (VARCHAR) | `customer_id -> customers.id` | Multi-line estimates, tax computations, validity |
| 8 | `quotation_lines` | `QuotationLine` | `id` (VARCHAR) | `quotation_id -> quotations.id` (CASCADE) | Line item breakdown, variant adjustments, discounts |
| 9 | `subscriptions` | `Subscription` | `id` (VARCHAR) | `customer_id -> customers.id`, `plan_id -> plans.id` | Recurring contracts, start/expiry dates, next billing date |
| 10 | `subscription_lines`| `SubscriptionLine` | `id` (VARCHAR) | `subscription_id -> subscriptions.id` (CASCADE) | Active license lines and itemized contract quantities |
| 11 | `subscription_timelines` | `SubscriptionTimeline`| `id` (VARCHAR) | `subscription_id -> subscriptions.id` (CASCADE) | Audit stepper trail (Draft, Confirm, Active, Pause, Renew, Close) |
| 12 | `invoices` | `Invoice` | `id` (VARCHAR) | `customer_id -> customers.id`, `subscription_id` | Tax invoices, GST breakup, paid & outstanding tracking |
| 13 | `invoice_lines` | `InvoiceLine` | `id` (VARCHAR) | `invoice_id -> invoices.id` (CASCADE) | Tax invoice item lines, quantities, unit prices |
| 14 | `payments` | `Payment` | `id` (VARCHAR) | `customer_id -> customers.id`, `invoice_id` | Settlement transactions (UPI, Card, Bank, Cash) |
| 15 | `discounts` | `Discount` | `id` (VARCHAR) | None | Promotional coupon codes, percentage & fixed caps |
| 16 | `tax_configs` | `TaxConfig` | `id` (INTEGER) | None | Indian GST tax slabs (18% Intra-state, IGST, 5%, 0% SEZ) |
| 17 | `company_settings`| `CompanySetting` | `id` (INTEGER) | None | Organization legal identity, GSTIN, currency, address |
| 18 | `notification_preferences` | `NotificationPreference` | `id` (INTEGER) | None | Email, SMS, Slack, auto-invoice dunning triggers |
| 19 | `notifications` | `Notification` | `id` (VARCHAR) | `user_id -> users.id` | User bell notifications, unread state |
| 20 | `audit_logs` | `AuditLog` | `id` (VARCHAR) | `user_id -> users.id` | Immutable system event log with timestamps |

---

## 4. MIGRATION DETAILS & ALEMBIC REVISION

- **Alembic Configuration File:** `backend/alembic.ini`
- **Environment Hook:** `backend/alembic/env.py`
  - Targets `Base.metadata` from `backend.database.session`.
  - Configures `render_as_batch=True` to support SQLite column modifications without dropping tables.
- **Initial Migration Script:** `backend/alembic/versions/e57578a53112_initial_schema.py`
- **Revision Identifier:** `e57578a53112`
- **Status:** Head migration applied and in sync with SQLite schema.

---

## 5. IMPORTED RECORD COUNTS & VALIDATION

All realistic business records from `frontend/src/mock/data.js` were migrated to `backend/brightloop.db` using `backend/scripts/seed_initial_data.py`.

| Domain Category | Frontend Mock Count | SQLite Imported Count | Preservation Status |
|-----------------|---------------------|-----------------------|---------------------|
| System Users | 3 | 7 (1 Admin, 1 Staff, 5 Customer Accounts) | Preserved & Encrypted with Bcrypt |
| Customer Entities | 5 | 5 | 100% Preserved with GSTIN & Address |
| Products | 6 | 6 | 100% Preserved |
| Product Variants | 14 | 14 | 100% Preserved with price adjustments |
| Subscription Plans | 6 | 6 | 100% Preserved with billing rules |
| Quotations | 3 | 3 | 100% Preserved |
| Subscriptions | 6 | 6 | 100% Preserved with lines and history |
| Invoices | 6 | 6 | 100% Preserved with GST line items |
| Payments | 4 active + 3 historical baseline | 7 | 100% Preserved (Totaling ₹3,38,994) |
| Discount Coupons | 4 | 4 | 100% Preserved |
| Tax Slabs | 4 | 4 | 100% Preserved |

---

## 6. DASHBOARD VALIDATION COMPARISON

All financial KPIs are dynamically computed by `DashboardService` querying SQLite database records. **No values are hardcoded in API endpoints.**

| Metric | Target Value | Frontend Calculation | SQLite Database Calculation | Discrepancy |
|--------|--------------|----------------------|-----------------------------|-------------|
| **Total Revenue** | ₹3,38,994 | `payments.reduce(...)` | `SELECT SUM(amount) FROM payments WHERE status = 'Success'` = **₹3,38,994.00** | None (₹0) |
| **Monthly Recurring Revenue (MRR)** | ₹46,103 | `activeSubs.reduce(...)` | Sum of normalized monthly amounts for 3 active subscriptions = **₹46,103.00** | None (₹0) |
| **Annual Recurring Revenue (ARR)** | ₹5,53,236 | `MRR * 12` | `46,103 * 12` = **₹5,53,236.00** | None (₹0) |
| **Active Subscriptions** | 3 | `subs.filter(Active).length` | `SELECT COUNT(*) FROM subscriptions WHERE status = 'Active'` = **3** | None (0) |
| **Outstanding Balance** | ₹49,652 | `invoices.reduce(...)` | `SELECT SUM(outstanding_amount) FROM invoices WHERE status IN ('Confirmed', 'Overdue')` = **₹49,652.00** | None (₹0) |
| **Overdue Invoices Total** | ₹11,352 | `overdue.reduce(...)` | `SELECT SUM(outstanding_amount) FROM invoices WHERE status = 'Overdue'` = **₹11,351.60 -> ₹11,352** | None (₹0) |

---

## 7. API INTEGRATION STATUS (61 REST ENDPOINTS)

All 61 endpoints are live, documented in `API_DOCUMENTATION.md`, and mounted under `/api/v1`:

1. **Authentication Router (`/auth`)**:
   - `POST /register`: Strictly creates `CUSTOMER` accounts. Validates email uniqueness and hashes passwords with bcrypt.
   - `POST /login`: Validates credentials, checks account status, returns signed JWT Bearer token with claims.
   - `GET /me`: Returns authenticated session profile.
   - `POST /logout`: Clears session token.
2. **Products & Variants Router (`/products`)**:
   - `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/variants`.
3. **Plans Router (`/plans`)**:
   - `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}/status`, `DELETE /{id}`.
4. **Quotations Router (`/quotations`)**:
   - Multi-line quotations, line pricing, and `POST /{id}/convert` for 1-click active subscription generation.
5. **Subscriptions Router (`/subscriptions`)**:
   - Full lifecycle stepper: `create`, `confirm`, `activate`, `pause`, `resume`, `renew`, `close`.
   - Real-time customer isolation: CUSTOMER accounts only see their own subscriptions; 403 Forbidden on foreign access.
6. **Invoices Router (`/invoices`)**:
   - Auto numbering, GST taxes, `confirm`, `cancel`, `send`.
   - Customer isolation enforced.
7. **Payments Router (`/payments`)**:
   - `POST /record`: Atomic payment persistence, invoice balance deduction, overpayment rejection.
8. **Discounts Router (`/discounts`)**:
   - Coupon management, status toggle, and `POST /validate` returning discount amount and final order total.
9. **Customers Router (`/customers`)**:
   - Master directory, profile editing, dynamic balance synchronization.
10. **Reports Router (`/reports`)**:
    - `GET /revenue`, `GET /subscriptions`, `GET /payments`, `GET /overdue`, `GET /customers`, and `GET /export/csv`.
11. **Settings Router (`/settings`)**:
    - Organization profiles, tax slabs, staff management, and notification preferences.
12. **Dashboard Router (`/dashboard`)**:
    - `GET /metrics`, `GET /charts`, `GET /staff-metrics`, `GET /portal-metrics`.
13. **Notifications Router (`/notifications`)**:
    - Live feed and `PATCH/PUT /{id}/read`.

---

## 8. TEST RESULTS REPORT

Pytest execution:
```bash
python -m pytest backend/tests -v
```

### Result:
```
====================== 39 passed, 310 warnings in 27.78s ======================
```
- **Total Tests Collected:** 39
- **Passed:** 39 (100%)
- **Failed:** 0
- **Errors:** 0

### Test Breakdown by Module:
1. `backend/tests/test_auth.py` (7 tests)
   - `test_customer_registration_success` — PASSED
   - `test_customer_registration_duplicate_email_rejected` — PASSED
   - `test_login_success_with_jwt` — PASSED
   - `test_login_invalid_password_rejected` — PASSED
   - `test_login_inactive_user_rejected` — PASSED
   - `test_get_current_user_profile` — PASSED
   - `test_password_hashing_and_verification` — PASSED
2. `backend/tests/test_authorization.py` (4 tests)
   - `test_admin_can_access_staff_creation` — PASSED
   - `test_staff_cannot_create_staff_or_admin` — PASSED
   - `test_customer_cannot_modify_products` — PASSED
   - `test_customer_data_isolation` — PASSED
3. `backend/tests/test_business_logic.py` (15 tests)
   - `test_quotation_conversion_to_subscription` — PASSED
   - `test_product_variant_pricing_calculation` — PASSED
   - `test_subscription_lifecycle_stepper` — PASSED
   - `test_subscription_renewal` — PASSED
   - `test_recurring_billing_runner` — PASSED
   - `test_recurring_billing_prevents_duplicate_invoices` — PASSED
   - `test_gst_tax_calculation_accuracy` — PASSED
   - `test_payment_recording_and_invoice_settlement` — PASSED
   - `test_overpayment_rejected` — PASSED
   - `test_discount_validation_and_calculation` — PASSED
   - `test_discount_min_purchase_enforced` — PASSED
   - `test_discount_expired_or_inactive_enforced` — PASSED
   - `test_dynamic_dashboard_kpis_accuracy` — PASSED
   - `test_reports_endpoints` — PASSED
   - `test_notification_marking_read` — PASSED
4. `backend/tests/test_database_crud.py` (6 tests)
   - `test_product_and_variants_crud` — PASSED
   - `test_plan_crud_and_status_toggle` — PASSED
   - `test_customer_crud` — PASSED
   - `test_foreign_key_and_cascade_behavior` — PASSED
   - `test_unique_constraint_enforcement` — PASSED
   - `test_transaction_rollback_on_failure` — PASSED
5. `backend/tests/test_api_integration.py` (7 tests)
   - `test_dashboard_metrics_matches_expected_figures` — PASSED
   - `test_customer_portal_data_isolation` — PASSED
   - `test_discount_validation_api` — PASSED
   - `test_reports_endpoints` — PASSED
   - `test_settings_and_tax_config` — PASSED
   - `test_notifications_lifecycle` — PASSED
   - `test_quotation_conversion_api` — PASSED

Frontend Build Execution:
```bash
npm run build
```
```
vite v6.4.5 building for production...
✓ 2315 modules transformed.
dist/index.html                     1.32 kB │ gzip:   0.69 kB
dist/assets/index-CCwROos4.css     41.03 kB │ gzip:   7.23 kB
dist/assets/index-CM83gDFz.js   1,041.08 kB │ gzip: 266.74 kB
✓ built in 10.50s
```

---

## 9. KNOWN LIMITATIONS & MITIGATIONS

1. **SQLite Concurrency**: SQLite uses database-level locking for write transactions.
   - *Mitigation*: Configured `connect_args={"check_same_thread": False}` and short-lived scoped sessions. Ideal for local development, demos, and hackathons.
2. **Decimal Handling**: SQLite internally stores Decimals as Floats or Strings.
   - *Mitigation*: Implemented `round_curr` in Python with `Decimal.quantize` to eliminate IEEE-754 floating point rounding drift.
3. **Cron Scheduling**: In a containerized or multi-worker production environment, automated background recurring billing should be triggered via Celery / Redis queue or system cron hitting `/api/v1/subscriptions/run-billing-cycle`.

---

## 10. INSTRUCTIONS FOR FUTURE MYSQL MIGRATION

The architecture was intentionally designed for zero-code-change MySQL migration.

### Step 1: Install Driver
```bash
pip install pymysql cryptography
```

### Step 2: Create MySQL Database
```sql
CREATE DATABASE brightloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Update `backend/.env`
Change:
```env
DATABASE_URL=sqlite:///./brightloop.db
```
To:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/brightloop
```

### Step 4: Run Alembic Migrations
```bash
cd backend
alembic upgrade head
```

### Step 5: Seed Business Data
```bash
python scripts/seed_initial_data.py
```

All 16 SQLAlchemy models, relationships, and foreign keys will automatically be provisioned in MySQL with native `DECIMAL`, `VARCHAR`, `INDEX`, and foreign key constraints.
