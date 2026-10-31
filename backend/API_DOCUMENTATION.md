# Brightloop – API Specification & Reference Manual

All endpoints are hosted under the common prefix: `/api/v1/`.

Interactive Swagger UI is available at: `http://localhost:8000/docs`.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/login` | Shared login for all roles | `LoginRequest` (email, password) | `LoginResponse` (token, user details, role) | Public |
| `POST` | `/api/v1/auth/register` | Public customer self-registration | `RegisterCustomerRequest` | `LoginResponse` (strictly CUSTOMER) | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user from token | *None* | `TokenPayload` | Authenticated |
| `POST` | `/api/v1/auth/logout` | Client logout & session clear | *None* | `MessageResponse` | Authenticated |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | `ForgotPasswordRequest` (email) | `MessageResponse` | Public |
| `POST` | `/api/v1/auth/reset-password` | Set new password with token | `ResetPasswordRequest` | `MessageResponse` | Public |

---

## 2. User & Profile Management (`/api/v1/users`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/users/me` | Retrieve profile of authenticated user | *None* | `UserResponse` | Authenticated |
| `PUT` | `/api/v1/users/me` | Update personal profile details | `UserUpdate` | `UserResponse` | Authenticated |
| `GET` | `/api/v1/users/{user_id}` | Retrieve specific user by ID | *None* | `UserResponse` | Admin / Self |

---

## 3. Staff Governance (`/api/v1/staff`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/staff` | List all operational staff members | *None* | `List[StaffResponse]` | ADMIN |
| `POST` | `/api/v1/staff` | Create new staff account | `StaffCreate` | `StaffResponse` | ADMIN |
| `PATCH`| `/api/v1/staff/{staff_id}/toggle-status` | Activate/deactivate staff access | *None* | `StaffResponse` | ADMIN |

---

## 4. Customer CRM Directory (`/api/v1/customers`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/customers` | Search & list customer accounts | *QueryParams*: `search`, `skip`, `limit` | `List[CustomerResponse]` | ADMIN, STAFF |
| `POST` | `/api/v1/customers` | Register new corporate customer | `CustomerCreate` | `CustomerResponse` | ADMIN, STAFF |
| `GET` | `/api/v1/customers/{customer_id}` | Get client details & GSTIN | *None* | `CustomerResponse` | ADMIN, STAFF, Own CUSTOMER |
| `PUT` | `/api/v1/customers/{customer_id}` | Update billing address or details | `CustomerUpdate` | `CustomerResponse` | ADMIN, STAFF, Own CUSTOMER |
| `GET` | `/api/v1/customers/{customer_id}/subscriptions` | Customer contracts drilldown | *None* | `List[SubscriptionResponse]` | ADMIN, STAFF, Own CUSTOMER |
| `GET` | `/api/v1/customers/{customer_id}/invoices` | Customer invoice history | *None* | `List[InvoiceResponse]` | ADMIN, STAFF, Own CUSTOMER |

---

## 5. Product Catalog & Variants (`/api/v1/products`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/products` | Search catalog with type filter | *QueryParams*: `search`, `type` | `List[ProductResponse]` | Public / Auth |
| `POST` | `/api/v1/products` | Create catalog item & variants | `ProductCreate` | `ProductResponse` | ADMIN |
| `GET` | `/api/v1/products/{product_id}` | Product details and pricing | *None* | `ProductResponse` | Public / Auth |
| `PUT` | `/api/v1/products/{product_id}` | Edit sales/cost prices | `ProductUpdate` | `ProductResponse` | ADMIN |
| `DELETE`| `/api/v1/products/{product_id}` | Deactivate product | *None* | `MessageResponse` | ADMIN |
| `GET` | `/api/v1/products/{product_id}/variants` | List variant add-ons | *None* | `List[ProductVariantResponse]` | Public / Auth |
| `POST` | `/api/v1/products/{product_id}/variants` | Add variant price adjustment | `ProductVariantCreate` | `ProductVariantResponse` | ADMIN |

---

## 6. Subscription Plans (`/api/v1/plans`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/plans` | List recurring cadences | *QueryParams*: `active_only` | `List[PlanResponse]` | Public / Auth |
| `POST` | `/api/v1/plans` | Create new billing cadence | `PlanCreate` | `PlanResponse` | ADMIN |
| `GET` | `/api/v1/plans/{plan_id}` | Plan details & permissions | *None* | `PlanResponse` | Public / Auth |
| `PUT` | `/api/v1/plans/{plan_id}` | Edit plan terms | `PlanUpdate` | `PlanResponse` | ADMIN |
| `PATCH`| `/api/v1/plans/{plan_id}/status` | Enable/disable plan status | *None* | `PlanResponse` | ADMIN |

---

## 7. Quotation Engine (`/api/v1/quotations`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/quotations` | List quotes with customer filter | *QueryParams*: `customer_id` | `List[QuotationResponse]` | ADMIN, STAFF |
| `POST` | `/api/v1/quotations` | Multi-line proposal builder | `QuotationCreate` | `QuotationResponse` | ADMIN, STAFF |
| `GET` | `/api/v1/quotations/{quotation_id}` | View proposal details & lines | *None* | `QuotationResponse` | ADMIN, STAFF |
| `POST` | `/api/v1/quotations/{quotation_id}/confirm` | Confirm customer approval | *None* | `QuotationResponse` | ADMIN, STAFF |
| `POST` | `/api/v1/quotations/{quotation_id}/convert` | **1-Click Convert to Subscription** | `ConvertQuotationRequest` | `SubscriptionResponse` | ADMIN, STAFF |

---

## 8. Subscription Contracts (`/api/v1/subscriptions`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/subscriptions` | List recurring contracts | *QueryParams*: `customer_id` | `List[SubscriptionResponse]` | ADMIN, STAFF, Own CUSTOMER |
| `POST` | `/api/v1/subscriptions` | Create manual contract | `SubscriptionCreate` | `SubscriptionResponse` | ADMIN, STAFF |
| `GET` | `/api/v1/subscriptions/{subscription_id}` | Contract details & billing dates | *None* | `SubscriptionResponse` | ADMIN, STAFF, Own CUSTOMER |
| `PATCH`| `/api/v1/subscriptions/{subscription_id}/status` | Lifecycle status transition | `UpdateStatusRequest` | `SubscriptionResponse` | Authenticated |
| `POST` | `/api/v1/subscriptions/{subscription_id}/pause` | Pause active subscription | *None* | `SubscriptionResponse` | Authenticated |
| `POST` | `/api/v1/subscriptions/{subscription_id}/resume` | Resume paused contract | *None* | `SubscriptionResponse` | Authenticated |
| `POST` | `/api/v1/subscriptions/{subscription_id}/renew` | Extend contract (+1 Year) | `RenewSubscriptionRequest` | `SubscriptionResponse` | Authenticated |
| `POST` | `/api/v1/subscriptions/{subscription_id}/close` | Terminate contract | *None* | `SubscriptionResponse` | Authenticated |
| `GET` | `/api/v1/subscriptions/{subscription_id}/timeline` | Chronological audit timeline | *None* | `List[Dict]` | Authenticated |

---

## 9. Tax Invoices & Billing (`/api/v1/invoices`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/invoices` | List tax billing records | *QueryParams*: `customer_id` | `List[InvoiceResponse]` | ADMIN, STAFF, Own CUSTOMER |
| `POST` | `/api/v1/invoices` | Create invoice with GST split | `InvoiceCreate` | `InvoiceResponse` | ADMIN, STAFF |
| `GET` | `/api/v1/invoices/{invoice_id}` | Printable tax invoice view | *None* | `InvoiceResponse` | ADMIN, STAFF, Own CUSTOMER |
| `POST` | `/api/v1/invoices/{invoice_id}/confirm` | Confirm & add to balance | *None* | `InvoiceResponse` | ADMIN, STAFF |
| `POST` | `/api/v1/invoices/{invoice_id}/cancel` | Cancel unpaid invoice | *None* | `InvoiceResponse` | ADMIN, STAFF |
| `POST` | `/api/v1/invoices/{invoice_id}/send` | Dispatch invoice to client email | *None* | `MessageResponse` | ADMIN, STAFF |

---

## 10. Payment Settlements (`/api/v1/payments`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/payments` | List payment receipts | *QueryParams*: `customer_id`, `invoice_id` | `List[PaymentResponse]` | ADMIN, STAFF, Own CUSTOMER |
| `POST` | `/api/v1/payments/record` | **Settle / Pay Now** against invoice | `PaymentRecordRequest` | `PaymentResponse` | Authenticated |

---

## 11. Discounts & Promotional Engine (`/api/v1/discounts`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/discounts` | List promotional rules | *None* | `List[DiscountResponse]` | Authenticated |
| `POST` | `/api/v1/discounts` | Create coupon campaign | `DiscountCreate` | `DiscountResponse` | ADMIN |
| `GET` | `/api/v1/discounts/{discount_id}` | View coupon configuration | *None* | `DiscountResponse` | Authenticated |
| `POST` | `/api/v1/discounts/calculate` | **Live Discount Calculator** | `DiscountCalculationRequest` | `DiscountCalculationResponse` | Public / Auth |
| `PATCH`| `/api/v1/discounts/{discount_id}/status` | Activate/deactivate voucher | *None* | `DiscountResponse` | ADMIN |

---

## 12. Indian GST Taxes (`/api/v1/taxes`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/taxes` | List GST slabs (18%, 5%, 0%) | *None* | `List[TaxResponse]` | Public / Auth |
| `POST` | `/api/v1/taxes` | Add custom tax tier | `TaxCreate` | `TaxResponse` | ADMIN |
| `GET` | `/api/v1/taxes/{tax_id}` | View tax tier details | *None* | `TaxResponse` | Public / Auth |

---

## 13. Dashboards (`/api/v1/dashboard`)

| Method | Endpoint | Description | Request Body | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/dashboard/admin` | Executive KPIs (MRR, ARR, dunning) | *None* | `AdminDashboardResponse` | ADMIN |
| `GET` | `/api/v1/dashboard/staff` | Operational summary | *None* | `StaffDashboardResponse` | STAFF |
| `GET` | `/api/v1/dashboard/customer` | Client portal overview | *QueryParams*: `customer_id` | `CustomerDashboardResponse` | CUSTOMER, ADMIN, STAFF |

---

## 14. Business Intelligence Reports (`/api/v1/reports`)

| Method | Endpoint | Description | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/reports/revenue` | Gross collections & tax liability | `Dict[str, Any]` | ADMIN, STAFF |
| `GET` | `/api/v1/reports/subscriptions` | Contract retention & status split | `Dict[str, Any]` | ADMIN, STAFF |
| `GET` | `/api/v1/reports/payments` | Consolidated payment journal | `List[Dict[str, Any]]` | ADMIN, STAFF |
| `GET` | `/api/v1/reports/overdue` | Overdue delinquent dunning accounts | `List[Dict[str, Any]]` | ADMIN, STAFF |
| `GET` | `/api/v1/reports/customers` | Master client directory balances | `List[Dict[str, Any]]` | ADMIN, STAFF |

---

## 15. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Response Schema | Required Role |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/notifications` | Unread notifications drawer | `List[Dict[str, Any]]` | Authenticated |
| `PATCH`| `/api/v1/notifications/{notification_id}/read` | Mark alert as read | `MessageResponse` | Authenticated |

---

## 16. Governance & Organization Settings (`/api/v1/settings`)

| Method | Endpoint | Description | Request / Response | Required Role |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/settings/company` | Legal entity profile, PAN, GSTIN | `Dict[str, Any]` | Authenticated |
| `PUT` | `/api/v1/settings/company` | Update company configuration | `Dict[str, Any]` | ADMIN |
| `GET` | `/api/v1/settings/taxes` | Tax slabs snapshot | `List[Dict[str, Any]]` | Authenticated |
| `GET` | `/api/v1/settings/staff` | Staff members directory | `List[Dict[str, Any]]` | ADMIN |
| `GET` | `/api/v1/settings/notifications` | Webhooks and alert preferences | `Dict[str, Any]` | Authenticated |
| `PUT` | `/api/v1/settings/notifications` | Save webhook URLs | `Dict[str, Any]` | ADMIN |
