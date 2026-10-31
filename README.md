# Brightloop – Enterprise Subscription Management System

Brightloop is a modern enterprise SaaS Subscription Management and Recurring Revenue Billing System built for high-growth digital businesses and Odoo ecosystem integrations.

Inspired by industry-leading enterprise platforms such as **Stripe**, **Linear**, and **modern Odoo 17/18 enterprise interfaces**, Brightloop provides a fast, intuitive, and responsive single-page application built on React, Vite, and Tailwind CSS.

---

## 🚀 Key Architecture & Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom enterprise palette (Deep Navy `#0f172a`, Indigo/Violet accents `#4f46e5`, and slate surface tiers)
- **Routing**: React Router DOM (v6) with nested Layouts and dynamic route parameters
- **Data Visualizations**: Recharts (Area charts, Bar charts, Donut distribution)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **State Management & Persistence**: Centralized `DataContext` with automatic `localStorage` synchronization
- **API Architecture**: Centralized Axios instance with RESTful endpoint mapping (`src/services/endpoints.js` and `src/services/api.js`) ready for instant FastAPI backend hookup without component refactoring.
- **Currency**: Formatted in **Indian Rupee (INR ₹)** across all transactions, MRR, ARR, taxes, and customer statements.

---

## 📦 Implemented Modules & Capabilities

### 1. Persistent Dashboard & Layout
- **Collapsible Sidebar**: One-click expand/collapse state with active link highlighting, Brightloop branding, and quick shortcut to the Customer Self-Service Portal.
- **Top Navigation Bar**:
  - Dynamic breadcrumb navigation synchronized with React Router.
  - Global Search UI (`Ctrl+K`) with instant filtering across Subscriptions, Invoices, Customers, and Products.
  - Interactive Notifications drawer with unread alerts for overdue invoices, cleared payments, and paused contracts.
  - Persona Switcher dropdown allowing instant toggling between **Admin Console (Priyanka Sen)** and **Customer Portal (Aditi Rao)**, plus database reset controls.

### 2. Authentication Pages (`/auth/*`)
- **Login (`/auth/login`)**: Supports email/password input, password visibility toggle, quick demo credential presets (Super Admin vs Client Demo), and error states.
- **Registration (`/auth/register`)**: Strict frontend validation:
  - Real-time password criteria checklist (>8 characters, uppercase, lowercase, special character).
  - Password and confirm password match verification.
  - Strict business email format validation.
- **Forgot Password (`/auth/forgot-password`)**: Clear simulation message clarifying backend integration readiness.
- **Reset Password (`/auth/reset-password`)**: Secure token password resetting interface with live requirement validation.

### 3. Executive Analytics Dashboard (`/dashboard`)
- **6 KPI Metric Cards**:
  1. Total Revenue (`₹`)
  2. Monthly Recurring Revenue (MRR)
  3. Annual Recurring Revenue (ARR)
  4. Active Subscriptions count
  5. Outstanding Receivables balance
  6. Overdue Invoices balance requiring dunning
- **Interactive Recharts Visualizations**:
  - **MRR Trend**: 6-month area chart showing revenue vs MRR trajectory.
  - **Subscription Growth**: Bar chart comparing active subscribers against churn.
  - **Revenue by Plan**: Donut chart illustrating ARR contribution across plans.
  - **Invoice Status Breakdown**: Horizontal distribution bar chart.
- **Operational Feeds**:
  - Delinquent invoice warning banner with one-click resolution.
  - Recent Subscriptions table.
  - Recent Invoices table.
  - Upcoming Renewals schedule widget.
  - Quick Action buttons for new quotations, invoices, and subscriptions.

### 4. Product Catalog Management (`/products`)
- Complete product listing with Name, Internal SKU code, Product Type (`Service`, `Consumable`, `Storable`), Base Sales Price, Cost Price, Margin calculation, and Variant counts.
- **Variant-Specific Pricing**: Supports dynamic add-ons, e.g., selecting the **Odoo Enterprise Connector adds +₹560** to the base price.
- Search, type filter, status filter, and pagination.
- Add/Edit product modal with variant management.
- Delete confirmation dialog.
- Product details page (`/products/:id`) displaying linked plans and active subscriptions.

### 5. Plan Management (`/plans`)
- Billing cadences supported: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Plan configurations:
  - Minimum order quantity (seat threshold).
  - Contract availability start and end dates.
  - Permissions: Allow customer pause, allow early closure, allow auto/manual renewal, and auto-close on term expiry.
- Enable / Disable quick toggle switches.
- Plan creation and editing modal.

### 6. Quotation Management (`/quotations`)
- Create quotations with customer selector, quotation templates, validity duration (15, 30, 60, 90 days), and commercial notes.
- Multi-line pricing builder: Select product, plan, and variant with automatic unit price, tax rate, and subtotal calculation.
- Commercial discount inputs.
- Statuses: `Draft` &rarr; `Quotation` &rarr; `Confirmed`.
- **1-Click Conversion**: Approved quotations convert into active recurring Subscriptions with a single click (`Convert to Subscription`).

### 7. Subscription Management (`/subscriptions`)
- Full lifecycle implementation:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
- Context-sensitive actions strictly based on current status:
  - `Draft`: Send quote, confirm contract.
  - `Quotation`: Confirm quotation.
  - `Confirmed`: Activate subscription contract.
  - `Active`: Generate cycle invoice, pause subscription, renew contract (+1 year), close contract.
  - `Paused`: Resume subscription, close contract.
  - `Closed`: Re-activate / renew.
- Visual stepper progression bar.
- Chronological **Activity Timeline** auditing every status change, renewal, invoice run, and operator comment.

### 8. Tax Invoices & Billing (`/invoices`)
- Listing with Invoice #, Customer, Subscription reference, Dates, Subtotal, GST Tax, Total, Paid Amount, and Outstanding Balance.
- Overdue invoice row highlighting.
- **Printable Tax Invoice View**: Computer-generated invoice template formatted with Indian GST regulations (CGST 9% + SGST 9% breakdown, SAC codes, Bank settlement instructions, and `@media print` clean formatting).
- Actions: Confirm invoice, record payment, send invoice, print/save PDF, cancel invoice.

### 9. Payment Management (`/payments`)
- Record payment modal reconciling payments against outstanding invoices.
- Payment methods: **UPI**, **Bank Transfer (NEFT/RTGS)**, **Corporate Card**, **Cash**, and **Other**.
- Real-time deduction from invoice balance and customer outstanding balance.
- Transaction UTR reference logging.

### 10. Discount & Promotional Rules (`/discounts`)
- Fixed rupee (`₹`) and percentage (`%`) discounts with minimum order values, minimum quantity thresholds, and campaign validity dates.
- Usage pace tracking against campaign limits.
- **Interactive Live Discount Calculator**: Test any coupon code against arbitrary contract amounts in real-time.

### 11. Customer Account Management (`/customers`)
- Complete client profiles with Corporate name, Contact person, Email, Phone, GSTIN, Address, and balance summary.
- Customer details page (`/customers/:id`) consolidating subscription contract history and all issued invoices.
- **One-click "View as Customer in Portal"** button.

### 12. Customer Self-Service Portal (`/portal/*`)
A dedicated customer-facing interface isolated from the admin console:
- **Overview (`/portal`)**: Customer KPI summary, active subscriptions, recent invoices.
- **My Subscriptions (`/portal/subscriptions`)**: View contract lines, renewal dates, and execute self-service **Pause** or **Cancellation** requests.
- **My Invoices (`/portal/invoices`)**: Review billing history, download/print tax invoices, and click **Pay Now** to settle balances.
- **Payment History (`/portal/payments`)**: Access all past payment receipts.
- **Profile (`/portal/profile`)**: Update corporate billing address, contact phone, and GSTIN.
- **Demo Customer Switcher**: Dropdown in the top banner allowing reviewers to test the portal experience as any customer in the system.

### 13. Reports & Analytics (`/reports`)
- 5 comprehensive reports:
  1. **Revenue Report**: Gross collections, tax liabilities, and ARPU.
  2. **Subscription Report**: Active contracts, retention rate, and cadence breakdown chart.
  3. **Payment Ledger**: Consolidated journal of all cleared transactions.
  4. **Overdue Dunning Report**: Delinquent balance breakdown for collections follow-up.
  5. **Customer Cohorts**: Master directory with outstanding balances.
- Working **Export CSV** button dynamically generating and downloading CSV spreadsheets.

### 14. Settings & Governance (`/settings`)
- **Company Profile**: Legal entity name, GSTIN, PAN, registered address, currency settings.
- **Tax Configuration**: GST tax slabs (18% standard, 5% concessional, SEZ zero-rated).
- **Staff Management**: Team access control (Admin-only creation controls).
- **RBAC Matrix**: Visual permission grid for Super Admin, Billing Admin, Sales Rep, and Support Specialist.
- **Notification Preferences**: Toggles for invoice dispatch, renewal reminders, and outgoing webhook URLs.

---

## 🛠️ How to Run the Application

Inside the `frontend/` directory:

```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

Open your browser at `http://localhost:5173`.

---

## 🔌 FastAPI Integration Guide

To connect the frontend to a live FastAPI backend:

1. Update `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_USE_MOCK_API=false
   ```
2. The centralized API client in [`src/services/api.js`](src/services/api.js) automatically attaches `Authorization: Bearer <token>` to all requests and handles errors.
3. All RESTful routes are declared in [`src/services/endpoints.js`](src/services/endpoints.js). Page components already consume standardized data structures matching FastAPI Pydantic schemas.

