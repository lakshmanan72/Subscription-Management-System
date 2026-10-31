# Brightloop – Backend API

Enterprise SaaS Subscription Management and Recurring Revenue Billing Management System built with **FastAPI**, **Pydantic v2**, and **SQLAlchemy 2.x**.

---

## 🏛️ System Architecture

```text
backend/
├── app/
│   ├── main.py                     # FastAPI entrypoint, CORS, exception handlers
│   ├── core/
│   │   ├── config.py               # Settings & Pydantic environment configuration
│   │   ├── security.py             # Bcrypt hashing & PyJWT token utilities
│   │   ├── dependencies.py         # Bearer token extraction & user authentication
│   │   ├── permissions.py          # RBAC (ADMIN, STAFF, CUSTOMER) & tenant isolation
│   │   └── exceptions.py           # Domain exceptions & error definitions
│   ├── database/
│   │   ├── base.py                 # DeclarativeBase & TimestampMixin
│   │   ├── connection.py           # Lazy MySQL engine configuration & health pings
│   │   ├── session.py              # Scoped session dependency with 503 fallback
│   │   └── types.py                # MySQL precision decimal & currency types
│   ├── models/                     # 16 SQLAlchemy ORM models with relations & indexes
│   ├── schemas/                    # Pydantic v2 request/response validation models
│   ├── api/v1/                     # 16 RESTful controllers with 61 endpoints
│   ├── services/                   # Business logic, state machines, billing engines
│   ├── repositories/               # SQLAlchemy 2.x data access repositories
│   ├── utils/                      # Decimal calculations, GST splits, date math
│   └── middleware/                 # Structured access request logging
├── tests/                          # 35 automated pytest tests
├── alembic/                        # Migration scripts ready for MySQL
├── requirements.txt                # Exact Python dependencies
├── .env.example                    # Environment variable template
├── API_DOCUMENTATION.md            # Comprehensive API reference
└── MYSQL_INTEGRATION_GUIDE.md      # Detailed next-phase MySQL activation manual
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- **Python 3.11+** installed
- Windows PowerShell or Bash terminal

### 2. Environment Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Configuration variables in `.env`:
```env
APP_NAME=Brightloop Subscription Management System
APP_ENV=development
DEBUG=true

API_V1_PREFIX=/api/v1

DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/brightloop

JWT_SECRET_KEY=brightloop-enterprise-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

INITIAL_ADMIN_EMAIL=priyanka@brightloop.io
INITIAL_ADMIN_PASSWORD=Admin@Brightloop123!
```

---

## 💻 Running the Backend

### Development Mode with Auto-Reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Or using Python module execution:

```bash
python -m app.main
```

Once running:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **System Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🧪 Running Automated Tests

Run the complete test suite with verbose reporting:

```bash
pytest tests -v
```

All 35 automated tests execute without requiring a running MySQL server, verifying:
- Cryptographic password hashing & strength validation
- JWT access token signing, expiration, and payload parsing
- Customer tenant data isolation and role boundaries
- Product base prices and variant add-on pricing (+₹560 for connectors, etc.)
- Multi-line quotation and invoice calculations
- Indian GST tax splits (CGST 9% + SGST 9% vs IGST 18%)
- Promotional voucher validations (dates, thresholds, usage limits)
- Overpayment prevention rules
- Subscription lifecycle state machine transitions
- Recurring interval calendar math (Daily, Weekly, Monthly, Yearly)
- HTTP 503 response verification when database access is requested before MySQL configuration

---

## 🔒 Security & Role-Based Access Control (RBAC)

The system strictly enforces three distinct roles on the backend:

1. **ADMIN**
   - Unrestricted access across all 16 operational and administrative modules.
   - Staff creation and privilege assignment.
   - System settings and tax configuration.

2. **STAFF**
   - Scoped operational access to CRM, quotations, subscriptions, invoices, and payments.
   - Strictly forbidden from staff creation, organization settings, and executive security.

3. **CUSTOMER**
   - Public registration strictly assigns the `CUSTOMER` role. Role escalation attempts are rejected.
   - Access restricted to their own self-service portal (`/portal/dashboard`).
   - Server-side tenant isolation prevents viewing other clients' contracts or invoices.

---

## 🔌 MySQL Integration in the Next Phase

In this phase, the backend is built to run cleanly without requiring an active MySQL instance:
- Models, relationships, constraints, and indexes are defined.
- Alembic migration environment is fully prepared.
- Database access attempts return a transparent **HTTP 503 Service Unavailable** response with clear guidance rather than fabricating false success.

To connect and activate MySQL in the next phase, follow:
👉 [`MYSQL_INTEGRATION_GUIDE.md`](MYSQL_INTEGRATION_GUIDE.md)
