# Brightloop — FastAPI & SQLite Backend

Enterprise Subscription Management and Recurring Revenue Billing System backend service.

---

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.x
- **Validation**: Pydantic v2
- **Database**: SQLite (default local) / MySQL compatible
- **Migrations**: Alembic
- **Authentication**: JWT with Bearer tokens & bcrypt hashing
- **Testing**: pytest

---

## 📁 Directory Structure
```text
backend/
├── alembic/                # Alembic migration scripts and env.py
├── alembic.ini             # Alembic configuration
├── api/                    # 16 Domain API Controllers
├── app/                    # FastAPI application initialization & middleware
├── database/               # Engine, SessionLocal, Base model
├── models/                 # 16 SQLAlchemy ORM models
├── repositories/           # Data access layer repositories
├── schemas/                # Pydantic v2 validation & response schemas
├── scripts/                # Database seeding & utility scripts
├── services/               # Business logic services (Billing, Auth, Subscriptions, etc.)
├── tests/                  # Integration & unit test suite (35+ tests)
├── brightloop.db           # SQLite database file
├── API_DOCUMENTATION.md    # Complete endpoint catalog and mapping
├── MYSQL_INTEGRATION_GUIDE.md # Future MySQL migration manual
├── DATABASE_INTEGRATION_REPORT.md # Verification and validation report
├── .env.example            # Environment template
└── requirements.txt        # Backend dependencies
```

---

## 🚀 Quickstart

### 1. Environment Configuration
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Seed Database
```bash
python scripts/seed_initial_data.py
```

### 4. Run Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 5. Run Automated Tests
```bash
pytest tests -v
```
