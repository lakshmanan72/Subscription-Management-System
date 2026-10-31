# BRIGHTLOOP FRONTEND-BACKEND INTEGRATION MAPPING

## System Architecture

Brightloop connects a React 18 single-page application (Vite, Tailwind CSS, Axios) to a FastAPI 0.128+ backend backed by SQLite (with future MySQL compatibility).

- Frontend Base URL: `http://localhost:5173`
- Backend API Base URL: `http://localhost:8000/api/v1`
- Database: `backend/brightloop.db` (`sqlite:///./brightloop.db`)

---

## Complete API Endpoint & Frontend Feature Mapping

### 1. Authentication & Identity (`/api/v1/auth`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component / Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `auth_login` | `Login.jsx` (`useAuth.login`) | Authenticates email + password, returns JWT token & user profile. |
| `POST` | `/auth/register` | `auth_register` | `Register.jsx` (`useAuth.register`) | Public registration; strictly creates `CUSTOMER` accounts and linked Customer profile. |
| `GET` | `/auth/me` | `get_current_user_profile` | `AuthContext.jsx` | Restores session and validates token on refresh. |
| `POST` | `/auth/forgot-password` | `auth_forgot_password` | `ForgotPassword.jsx` | Sends/logs password reset instructions for verified user email. |
| `POST` | `/auth/reset-password` | `auth_reset_password` | `ResetPassword.jsx` | Updates password given valid token and enforces complexity. |
| `POST` | `/auth/logout` | `auth_logout` | `TopNav.jsx`, `AuthContext.jsx` | Invalidates client session and clears local storage. |

---

### 2. Products & Variants Catalog (`/api/v1/products`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | `list_products` | `ProductsList.jsx`, `DataContext.jsx` | Returns list of products with variants, type, pricing. |
| `POST` | `/products` | `create_product` | `ProductModal.jsx` (`addProduct`) | Admin creates new product with optional variants. |
| `GET` | `/products/{id}` | `get_product` | `ProductDetail.jsx` | Product details, linked plans, variant options. |
| `PUT` | `/products/{id}` | `update_product` | `ProductModal.jsx` (`updateProduct`) | Updates product details, prices, or status. |
| `DELETE` | `/products/{id}` | `delete_product` | `ProductsList.jsx` (`deleteProduct`) | Deletes product and associated variants. |
| `GET` | `/products/{id}/variants` | `list_product_variants`| `QuotationCreate.jsx`, `ProductDetail.jsx` | Lists variants with dynamic price adjustments. |
| `POST` | `/products/{id}/variants` | `create_product_variant`| `ProductModal.jsx` | Adds variant to product. |

---

### 3. Subscription Plans (`/api/v1/plans`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/plans` | `list_plans` | `PlansList.jsx`, `DataContext.jsx` | Lists plans with billing cadence, pricing, policies. |
| `POST` | `/plans` | `create_plan` | `PlanModal.jsx` (`addPlan`) | Admin creates new subscription plan. |
| `GET` | `/plans/{id}` | `get_plan` | `PlansList.jsx` | Retrieves single plan by ID. |
| `PUT` | `/plans/{id}` | `update_plan` | `PlanModal.jsx` (`updatePlan`) | Updates plan terms, limits, cadence. |
| `PATCH` | `/plans/{id}/status` | `toggle_plan_status` | `PlansList.jsx` (`togglePlanStatus`) | Toggles plan status between Active and Disabled. |
| `DELETE` | `/plans/{id}` | `delete_plan` | `PlansList.jsx` | Removes plan if not tied to active contracts. |

---

### 4. Quotations (`/api/v1/quotations`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/quotations` | `list_quotations` | `QuotationsList.jsx`, `StaffDashboard.jsx` | Lists quotes with customer, lines, subtotal, tax. |
| `POST` | `/quotations` | `create_quotation` | `QuotationCreate.jsx` (`addQuotation`) | Creates multi-line quotation with dynamic variant pricing. |
| `GET` | `/quotations/{id}` | `get_quotation` | `QuotationDetail.jsx` | Quotation details, breakdown, commercial terms. |
| `PUT` | `/quotations/{id}` | `update_quotation` | `QuotationDetail.jsx` (`updateQuotation`) | Updates quotation lines, status, or discount. |
| `POST` | `/quotations/{id}/convert` | `convert_quotation` | `QuotationDetail.jsx` (`convertQuotationToSubscription`) | 1-Click approval converting quote to active subscription. |
| `DELETE` | `/quotations/{id}` | `delete_quotation` | `QuotationsList.jsx` | Cancels/removes draft quote. |

---

### 5. Subscriptions Lifecycle (`/api/v1/subscriptions`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/subscriptions` | `list_subscriptions` | `SubscriptionsList.jsx`, `DataContext.jsx` | Lists all subscriptions with lifecycle status. |
| `POST` | `/subscriptions` | `create_subscription` | `SubscriptionCreate.jsx` (`addSubscription`) | Direct creation of subscription contract. |
| `GET` | `/subscriptions/{id}` | `get_subscription` | `SubscriptionDetail.jsx` | Full contract, product lines, renewal dates. |
| `PUT` | `/subscriptions/{id}` | `update_subscription` | `SubscriptionDetail.jsx` (`updateSubscription`) | Updates contract properties. |
| `PATCH` | `/subscriptions/{id}/status` | `update_subscription_status` | `SubscriptionDetail.jsx` (`updateSubscriptionStatus`) | Stepper action: Draft $\rightarrow$ Quotation $\rightarrow$ Confirmed $\rightarrow$ Active $\rightarrow$ Paused $\rightarrow$ Closed. |
| `POST` | `/subscriptions/{id}/renew` | `renew_subscription` | `SubscriptionDetail.jsx` (`renewSubscription`) | Extends contract expiry by 1 year. |
| `GET` | `/subscriptions/{id}/timeline` | `get_subscription_timeline`| `SubscriptionDetail.jsx` | Activity audit trail of state changes and actions. |

---

### 6. Tax Invoices & Billing (`/api/v1/invoices`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/invoices` | `list_invoices` | `InvoicesList.jsx`, `DataContext.jsx` | Lists invoices with GST breakdown, status, balance. |
| `POST` | `/invoices` | `create_invoice` | `InvoiceCreate.jsx`, `SubscriptionDetail.jsx` | Creates cycle or manual invoice with line items. |
| `GET` | `/invoices/{id}` | `get_invoice` | `InvoiceDetail.jsx`, `PrintableInvoice.jsx`| Returns tax invoice for viewing and printing. |
| `POST` | `/invoices/{id}/confirm`| `confirm_invoice` | `InvoiceDetail.jsx` (`confirmInvoice`) | Transitions invoice from Draft to Confirmed. |
| `POST` | `/invoices/{id}/cancel` | `cancel_invoice` | `InvoiceDetail.jsx` (`cancelInvoice`) | Cancels invoice and voids balance. |
| `POST` | `/invoices/{id}/send` | `send_invoice` | `InvoiceDetail.jsx` (`sendInvoice`) | Logs/dispatches invoice to customer email. |
| `POST` | `/invoices/recurring-run`| `trigger_recurring_billing`| Dashboard / Cron | Runs recurring billing for due active subscriptions. |

---

### 7. Payments & Ledger (`/api/v1/payments`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/payments` | `list_payments` | `PaymentsList.jsx`, `DataContext.jsx` | Lists recorded payments, UTR, methods. |
| `POST` | `/payments/record` | `record_payment` | `PaymentRecordModal.jsx` (`recordPayment`) | Records payment, updates invoice and customer balances. |
| `GET` | `/payments/{id}` | `get_payment` | `PaymentsList.jsx` | Payment receipt details. |

---

### 8. Discounts & Vouchers (`/api/v1/discounts`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/discounts` | `list_discounts` | `DiscountsList.jsx`, `DataContext.jsx` | Lists discount codes, validity, usage limits. |
| `POST` | `/discounts` | `create_discount` | `DiscountModal.jsx` (`addDiscount`) | Creates percentage or fixed coupon rule. |
| `GET` | `/discounts/{id}` | `get_discount` | `DiscountModal.jsx` | Retrieves discount rule. |
| `PUT` | `/discounts/{id}` | `update_discount` | `DiscountModal.jsx` (`updateDiscount`) | Edits discount rules or validity. |
| `PATCH` | `/discounts/{id}/status` | `toggle_discount_status` | `DiscountsList.jsx` (`toggleDiscountStatus`) | Toggles Active / Inactive status. |
| `POST` | `/discounts/validate` | `validate_discount_code` | `DiscountModal.jsx`, `QuotationCreate.jsx`| Real-time validation and calculation of discount. |

---

### 9. Customers CRM (`/api/v1/customers`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/customers` | `list_customers` | `CustomersList.jsx`, `DataContext.jsx` | Lists customer profiles, GSTIN, balances. |
| `POST` | `/customers` | `create_customer` | `CustomersList.jsx` (`addCustomer`) | Creates customer profile. |
| `GET` | `/customers/{id}` | `get_customer` | `CustomerDetail.jsx` | Detailed customer profile with balance summary. |
| `PUT` | `/customers/{id}` | `update_customer` | `CustomerDetail.jsx` (`updateCustomer`) | Updates customer profile / address / GSTIN. |
| `GET` | `/customers/{id}/subscriptions` | `get_customer_subscriptions` | `CustomerDetail.jsx`, `PortalSubscriptions.jsx` | Contracts associated with customer. |
| `GET` | `/customers/{id}/invoices` | `get_customer_invoices` | `CustomerDetail.jsx`, `PortalInvoices.jsx` | Invoices associated with customer. |
| `GET` | `/customers/{id}/payments` | `get_customer_payments` | `PortalPayments.jsx` | Payments recorded by customer. |

---

### 10. Dashboard & Analytics (`/api/v1/dashboard`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/metrics` | `get_dashboard_metrics` | `Dashboard.jsx` | Dynamically calculated Total Revenue, MRR, ARR, Active Subs, Outstanding, Overdue. |
| `GET` | `/dashboard/charts` | `get_dashboard_charts` | `Dashboard.jsx` | Trend data, growth data, plan revenue distribution. |
| `GET` | `/dashboard/staff-metrics`| `get_staff_dashboard_metrics`| `StaffDashboard.jsx` | Operational metrics for staff desk. |
| `GET` | `/dashboard/portal-metrics`| `get_portal_metrics` | `PortalOverview.jsx` | Customer-specific metrics (active contracts, due amount). |

---

### 11. Reports (`/api/v1/reports`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/reports/revenue` | `get_revenue_report` | `Reports.jsx` | Gross collections, tax liabilities, monthly trends. |
| `GET` | `/reports/subscriptions`| `get_subscriptions_report` | `Reports.jsx` | Active contracts, retention rate, cadence breakdown. |
| `GET` | `/reports/payments` | `get_payments_report` | `Reports.jsx` | Cleared transactions journal. |
| `GET` | `/reports/overdue` | `get_overdue_report` | `Reports.jsx` | Delinquent accounts for dunning follow-up. |
| `GET` | `/reports/customers` | `get_customers_report` | `Reports.jsx` | Customer directory with outstanding balances. |

---

### 12. Settings, Staff, Taxes & Notifications (`/api/v1/settings`)
| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/settings/company` | `get_company_settings` | `Settings.jsx` | Company legal profile, GSTIN, PAN, address. |
| `PUT` | `/settings/company` | `update_company_settings` | `Settings.jsx` (`updateCompanyProfile`) | Saves company legal configuration. |
| `GET` | `/settings/taxes` | `list_tax_configs` | `Settings.jsx` | Configured GST tax slabs. |
| `PUT` | `/settings/taxes` | `update_tax_configs` | `Settings.jsx` (`updateTaxConfig`) | Updates GST rates and default slabs. |
| `GET` | `/settings/staff` | `list_staff_members` | `Settings.jsx` | Team members and roles. |
| `POST` | `/settings/staff` | `create_staff_member` | `Settings.jsx` (`addStaffMember`) | Admin creates staff user + profile. |
| `DELETE` | `/settings/staff/{id}` | `delete_staff_member` | `Settings.jsx` (`deleteStaffMember`) | Removes staff member. |
| `GET` | `/settings/notifications`| `get_notification_settings` | `Settings.jsx` | Notification alert preferences. |
| `PUT` | `/settings/notifications`| `update_notification_settings`| `Settings.jsx` (`updateNotificationPreferences`)| Saves notification preferences. |
| `GET` | `/notifications` | `list_user_notifications` | `NotificationsDropdown.jsx` | Unread notifications and alerts. |
| `PATCH` | `/notifications/{id}/read`| `mark_notification_read` | `NotificationsDropdown.jsx` | Marks notification as read. |
| `POST` | `/settings/reset-demo` | `reset_demo_database` | `TopNav.jsx`, `Settings.jsx` | Resets SQLite database to fresh initial seed data. |
