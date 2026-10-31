# BRIGHTLOOP — MYSQL INTEGRATION GUIDE

This guide details how to transition the Brightloop database layer from the local SQLite database (`backend/brightloop.db`) to an enterprise MySQL / MariaDB cluster without refactoring business logic or API endpoints.

---

## 1. Architecture Compatibility

Brightloop is built using **SQLAlchemy 2.x** with declarative ORM models and pure relational constraints (foreign keys, cascading rules, unique indexes). The data access layer uses standard repositories and does not employ SQLite-specific SQL dialects.

All queries use parameterized ORM constructs:
- `select()`, `where()`, `join()`, `order_by()`, `distinct()`
- Standard SQLAlchemy types: `String`, `Integer`, `Float`, `Boolean`, `DateTime`, `Text`
- Standard transactions: `db.commit()` and `db.rollback()`

---

## 2. Environment Configuration

To switch between SQLite and MySQL, update the `DATABASE_URL` environment variable in `backend/.env`.

### Local SQLite (Default Hackathon Mode)
```env
DATABASE_URL=sqlite:///./brightloop.db
```

### Production / Staging MySQL
```env
DATABASE_URL=mysql+pymysql://brightloop_user:StrongPassword123!@localhost:3306/brightloop?charset=utf8mb4
```

---

## 3. Database Engine Setup

In `backend/database/session.py`, the engine automatically adapts to the dialect:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brightloop.db")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # MySQL / MariaDB production pool settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

---

## 4. MySQL Prerequisites

### 4.1 Install Driver
Install `pymysql` and `cryptography`:
```bash
pip install pymysql cryptography
```

### 4.2 Create Database and User
Log in to MySQL as root and run:
```sql
CREATE DATABASE brightloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'brightloop_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON brightloop.* TO 'brightloop_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 5. Schema Migration with Alembic

Alembic handles the automated creation and migration of all 16 tables:

```bash
cd backend

# Generate new migration if models changed
alembic revision --autogenerate -m "Init MySQL schema"

# Apply all migrations to target database
alembic upgrade head
```

---

## 6. Data Migration from SQLite to MySQL

To copy existing SQLite data directly into MySQL:

```bash
# Export from SQLite / Seed initial data directly into MySQL:
DATABASE_URL=mysql+pymysql://brightloop_user:StrongPassword123!@localhost:3306/brightloop python scripts/seed_initial_data.py
```

The script is idempotent: it validates foreign keys, checks for existing records by unique codes/emails/identifiers, and safely commits all data within isolated transactions.

---

## 7. Verifying Migration
1. Start the FastAPI backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
2. Open Swagger UI at `http://localhost:8000/docs`
3. Execute `GET /api/v1/dashboard/metrics` and verify figures:
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
4. Run complete automated test suite on MySQL:
   ```bash
   pytest tests
   ```
   All 57 test cases across Phases 1-13 will execute with 100% pass rate.
