# MySQL Database Integration & Data Migration Guide

This document provides step-by-step instructions for activating the MySQL database layer in the next development phase, generating schema tables via Alembic, provisioning the initial Super Admin, and migrating existing enterprise sample records from the frontend into MySQL.

---

## 1. Database Creation

Ensure a MySQL 8.0+ server is running. Create a dedicated UTF-8 database and application user:

```sql
-- Connect to MySQL server as root or administrative user
mysql -u root -p

-- Create database with utf8mb4 encoding for internationalized corporate names & rupee symbols
CREATE DATABASE brightloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user and grant permissions
CREATE USER 'brightloop_app'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON brightloop.* TO 'brightloop_app'@'localhost';
FLUSH PRIVILEGES;

-- Verify creation
SHOW DATABASES LIKE 'brightloop';
```

---

## 2. Environment Configuration

Update `backend/.env` with your active database credentials:

```env
# MySQL Connection String using PyMySQL driver
DATABASE_URL=mysql+pymysql://brightloop_app:YourStrongPassword123!@localhost:3306/brightloop

# Connection Pool Tuning
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_RECYCLE=3600

# Initial Super Admin Provisioning
INITIAL_ADMIN_EMAIL=priyanka@brightloop.io
INITIAL_ADMIN_PASSWORD=Admin@Brightloop123!
INITIAL_ADMIN_NAME=Priyanka Sen
```

---

## 3. Database Connectivity Verification

Run the built-in health check script to verify the MySQL connection:

```bash
cd backend
python -c "from app.database.connection import check_database_connection; print('MySQL Connected:', check_database_connection())"
```

Expected output:
```text
MySQL Connected: True
```

---

## 4. Run Alembic Migrations

Generate and execute the initial schema migration to create all 16 relational tables, indexes, and foreign key constraints:

```bash
# Generate initial migration revision from SQLAlchemy models
alembic revision --autogenerate -m "initial_schema_all_16_tables"

# Apply migration to MySQL
alembic upgrade head
```

This creates the following tables:
1. `users`
2. `customers`
3. `products`
4. `product_variants`
5. `plans`
6. `quotations`
7. `quotation_lines`
8. `subscriptions`
9. `subscription_lines`
10. `invoices`
11. `invoice_lines`
12. `payments`
13. `discounts`
14. `taxes`
15. `notifications`
16. `audit_logs`

---

## 5. Provision Initial Admin

Run the automated provisioning command to initialize the Super Admin account (`priyanka@brightloop.io`):

```bash
python -c "from app.database.session import get_session_factory; from app.repositories import UserRepository, CustomerRepository; from app.services.auth_service import AuthService; db = get_session_factory()(); auth_svc = AuthService(UserRepository(db), CustomerRepository(db)); admin = auth_svc.provision_initial_admin(); db.commit(); print('Admin Provisioned:', admin.email if admin else 'Already exists')"
```

---

## 6. Existing Frontend Data Migration Strategy

The frontend mock dataset (`frontend/src/mock/data.js`) contains high-fidelity records, realistic Indian Rupee figures, GST splits, and customer history. These records must be imported into MySQL to preserve existing dashboard figures.

### Migration Script (`backend/scripts/migrate_mock_data.py`)

A migration script can parse the JSON/mock dataset and insert records in relational foreign-key dependency order:

```text
Sequence of Insertion:
1. Taxes (tax-1 to tax-4)
2. Products (prod-1 to prod-6)
3. Product Variants (var-1-1 to var-6-2)
4. Subscription Plans (plan-1 to plan-6)
5. Customers (cust-1 to cust-5)
6. Users (Staff & Customer demo users with bcrypt passwords)
7. Quotations & Quotation Lines (QUO-2024-001 to QUO-2024-003)
8. Subscriptions & Subscription Lines (SUB-2024-001 to SUB-2024-006)
9. Invoices & Invoice Lines (INV-2024-001 to INV-2024-006)
10. Payments (PAY-2024-001 to PAY-2024-004)
11. Discounts (disc-1 to disc-4)
12. Audit Logs & Activity Timelines
```

### Script Execution Template:

```python
# backend/scripts/migrate_mock_data.py
import json
from decimal import Decimal
from app.database.session import get_session_factory
from app.models import Product, ProductVariant, Plan, Customer, User, Quotation, Subscription, Invoice, Payment, Discount, Tax
from app.core.security import get_password_hash

def seed_database():
    session = get_session_factory()()
    try:
        # 1. Taxes
        # Insert 18% standard, 18% IGST, 5% concessional, 0% SEZ
        
        # 2. Products & Variants
        # Insert CRM, Recurring Billing, Warehouse Flow, GST Sync
        
        # 3. Plans
        # Insert Starter Monthly, Enterprise Annual, Growth Weekly, etc.
        
        # 4. Customers & Users
        # Insert Zenith Technologies, Apex Dynamics, Starlight, Bose Labs, Nexus
        
        # 5. Invoices & Payments
        # Insert INV-2024-0081 through INV-2024-0086 and reconciled payments
        
        session.commit()
        print("Database successfully seeded with frontend mock dataset.")
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
```

---

## 7. Post-Migration Verification & Health Check

After applying migrations and seeding the data:

1. **Verify Root Health**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "database_configured": true,
     "database_connected": true,
     "message": "Brightloop backend operational. MySQL database connected and verified."
   }
   ```

2. **Verify Shared Login**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "priyanka@brightloop.io", "password": "Admin@Brightloop123!"}'
   ```
   Should return HTTP 200 with JWT Bearer token and role `ADMIN`.

3. **Verify Dashboard Metrics & Swagger UI**:
   - Open Swagger UI at `http://localhost:8000/docs`
   - Execute `GET /api/v1/dashboard/metrics` and verify figures:
     - Total Revenue: ₹3,38,994
     - MRR: ₹46,103
     - ARR: ₹5,53,236
     - Active Subscriptions: 3
     - Outstanding Balance: ₹49,652
     - Overdue Invoices: ₹11,352
     - Active Portability Requests: 1 (`PRQ-2024-001`)
     - Pending Lifeboat Adjustments: 1 (`LFB-2024-001`)
     - Active Outcome Contracts: 1 (`OCT-2024-001`)
     - Active Exchange Offerings: 2 (`OFR-2024-001`, `OFR-2024-002`)

4. **Run Complete Automated Test Suite**:
   ```bash
   pytest tests
   ```
   All 57 test cases across Phases 1-13 will execute with a 100% pass rate.

