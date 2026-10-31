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
| `POST`| `/api/v1/settings/staff` | Create staff member account | `StaffCreate` / `StaffResponse` | ADMIN |
| `DELETE`| `/api/v1/settings/staff/{id}` | Delete staff member account | *None* | ADMIN |
| `GET` | `/api/v1/settings/notifications` | Webhooks and alert preferences | `Dict[str, Any]` | Authenticated |
| `PUT` | `/api/v1/settings/notifications` | Save webhook URLs | `Dict[str, Any]` | ADMIN |
| `POST`| `/api/v1/settings/reset-demo` | Reset database to fresh seed data | *None* | ADMIN |

---

## 17. Subscription Continuity Network (`/api/v1/portability`)

| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/portability/requests` | `create_portability_request` | `PortalPortability.jsx` | Creates migration request with deterministic proration calculation. |
| `GET` | `/api/v1/portability/requests` | `list_portability_requests` | `ContinuityList.jsx`, `PortalPortability.jsx` | Lists portability requests (customer-isolated or administrative). |
| `GET` | `/api/v1/portability/requests/{id}` | `get_portability_request` | `ContinuityList.jsx`, `PortalPortability.jsx` | Retrieves request snapshot, fingerprint, and audit timeline. |
| `POST` | `/api/v1/portability/requests/{id}/review` | `review_portability_request` | `ContinuityList.jsx` | Admin approval or rejection with audit logging. |
| `POST` | `/api/v1/portability/requests/{id}/complete` | `complete_portability_migration` | `ContinuityList.jsx` | Finalizes controlled migration without deleting original subscription. |
| `GET` | `/api/v1/portability/requests/{id}/history` | `get_portability_history` | `ContinuityList.jsx`, `PortalPortability.jsx` | Audit trail timeline of migration events. |

---

## 18. Subscription Lifeboat (`/api/v1/lifeboat`)

| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/lifeboat/adjustments` | `create_adjustment_request` | `PortalLifeboat.jsx` | Customer submits temporary downgrade, pause, or payment deferral. |
| `GET` | `/api/v1/lifeboat/adjustments` | `list_adjustments` | `LifeboatList.jsx`, `PortalLifeboat.jsx` | Lists adjustments with restoration dates and relief impact. |
| `GET` | `/api/v1/lifeboat/adjustments/{id}` | `get_adjustment` | `LifeboatList.jsx` | Retrieves adjustment record and approval history. |
| `POST` | `/api/v1/lifeboat/adjustments/{id}/review` | `review_adjustment` | `LifeboatList.jsx` | Admin approves or rejects adjustment request. |
| `POST` | `/api/v1/lifeboat/adjustments/{id}/restore` | `restore_subscription` | `LifeboatList.jsx` | Idempotently restores original subscription tier and pricing. |
| `POST` | `/api/v1/lifeboat/process-expired` | `process_expired_adjustments` | `LifeboatList.jsx` | Automated batch processor restoring subscriptions past due date. |

---

## 19. Subscription Outcome Contracts (`/api/v1/outcome-contracts`)

| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/outcome-contracts` | `create_outcome_contract` | `ContractsList.jsx` | Creates outcome contract with SLA availability & latency metrics. |
| `GET` | `/api/v1/outcome-contracts` | `list_outcome_contracts` | `ContractsList.jsx`, `PortalOutcomeContracts.jsx` | Lists outcome contracts with active metric commitments. |
| `GET` | `/api/v1/outcome-contracts/{id}` | `get_outcome_contract` | `ContractsList.jsx` | Retrieves contract details, telemetry log, and credit records. |
| `POST` | `/api/v1/outcome-contracts/{id}/measurements` | `record_measurement` | `ContractsList.jsx` | Records telemetry, deterministically calculates credits for breaches. |
| `GET` | `/api/v1/outcome-contracts/credits/all` | `list_service_credits` | `ContractsList.jsx`, `PortalOutcomeContracts.jsx` | Lists all evaluated service credits. |
| `POST` | `/api/v1/outcome-contracts/credits/{id}/review` | `review_service_credit` | `ContractsList.jsx` | Admin authorizes or rejects calculated service credit. |
| `POST` | `/api/v1/outcome-contracts/credits/{id}/apply-to-invoice` | `apply_credit_to_invoice` | `ContractsList.jsx` | Deducts approved credit from customer's open invoice. |

---

## 20. Subscription Outcome Exchange (`/api/v1/exchange`)

| HTTP Method | Backend Endpoint | Controller Function | Frontend Component | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/exchange/providers` | `create_provider_profile` | `ExchangeList.jsx` | Registers verified subscription provider profile. |
| `GET` | `/api/v1/exchange/providers` | `list_providers` | `ExchangeList.jsx`, `PortalOutcomeExchange.jsx` | Lists registered providers and verified track records. |
| `POST` | `/api/v1/exchange/offerings` | `create_subscription_offering` | `ExchangeList.jsx` | Publishes outcome offering with contractual SLA guarantees. |
| `GET` | `/api/v1/exchange/offerings` | `list_offerings` | `ExchangeList.jsx`, `PortalOutcomeExchange.jsx` | Browses marketplace offerings with filtering and SLA comparisons. |
| `GET` | `/api/v1/exchange/offerings/{id}` | `get_offering` | `PortalOutcomeExchange.jsx` | Detailed view of offering commitments and credit policies. |
| `POST` | `/api/v1/exchange/interest-requests` | `submit_interest_request` | `PortalOutcomeExchange.jsx` | Customer submits interest or quotation request for an offering. |
| `GET` | `/api/v1/exchange/interest-requests` | `list_interest_requests` | `ExchangeList.jsx`, `PortalOutcomeExchange.jsx` | Pipeline of customer quotation requests. |
| `POST` | `/api/v1/exchange/interest-requests/{id}/convert-to-quotation` | `convert_interest_to_quotation` | `ExchangeList.jsx` | Converts accepted marketplace interest into Brightloop Quotation. |

