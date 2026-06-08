# **Product Requirements Document: Realify AI Backend (Optimized)**

## **1\. Executive Summary**

**Project Name:** Realify AI Backend (Marketplace Intelligence)  
**Primary Tech Stack:** Python (FastAPI), MongoDB (Motor Async), Redis  
**Objective:** Deliver a secure, highly scalable, and modular asynchronous backend. The system prioritizes a seamless, passwordless/OTP-based user onboarding pipeline, multi-tenant workspace architecture, and robust e-commerce API integrations (Shopify, WooCommerce) to power marketplace intelligence.

## **2\. System Architecture & Tech Stack**

The application strictly follows a decoupled, service-oriented architecture within a modular monolith, ensuring business logic is entirely separated from routing and database interactions.

* **API Framework:** FastAPI (leveraging Pydantic V2 for aggressive I/O validation).  
* **Database (Primary):** MongoDB (using the motor asynchronous driver).  
* **Database (Caching/Rate Limiting):** Redis.  
* **Authentication:** JWT (JSON Web Tokens) with strict OTP delivery via Twilio (WhatsApp) and SendGrid (Email).

## **3\. Core Functional Modules & Routing Contracts**

The backend functionality is divided into four distinct modules, mapping directly to your app/api/v1/routes/ and app/services/ directories.

### **3.1. Authentication Module (auth.py)**

*Google and Apple SSO are explicitly excluded. Authentication is OTP-centric.*

* **Email Flow:** Integrates with SendGrid to dispatch OTPs and verification links.  
* **WhatsApp Flow:** Integrates with Twilio API to dispatch OTPs to validated phone numbers.  
* **Session State:** Issues short-lived access JWTs and secure, HTTP-only refresh tokens.

| Method | Endpoint | Description | Handled By |
| :---- | :---- | :---- | :---- |
| POST | /v1/auth/request-otp | Triggers Email or WhatsApp OTP. | otp\_service.py |
| POST | /v1/auth/verify-otp | Validates OTP, creates user, issues JWT. | auth\_service.py |
| POST | /v1/auth/refresh | Cycles JWT using HTTP-only refresh token. | auth\_service.py |

### **3.2. Onboarding State Machine (onboarding.py)**

A mandatory sequence users must complete before accessing the core dashboard.

* **States:** AWAITING\_PROFILE $\\rightarrow$ AWAITING\_WORKSPACE $\\rightarrow$ AWAITING\_INTEGRATION $\\rightarrow$ ACTIVE.  
* **Access Control:** FastAPI dependencies (auth\_middleware.py) will check the user's current onboarding state to restrict or grant access to specific routes.

| Method | Endpoint | Description | Handled By |
| :---- | :---- | :---- | :---- |
| POST | /v1/onboarding/profile | Captures basic user metadata (Name, Role). | onboarding\_service.py |
| POST | /v1/onboarding/workspace | Creates the multi-tenant company entity. | onboarding\_service.py |
| GET | /v1/onboarding/status | Returns the current completion state. | onboarding\_service.py |

### **3.3. Marketplace Integrations (marketplace.py)**

Handles the secure handshake and credential storage for third-party platforms.

* **Shopify:** Executes the full OAuth 2.0 flow to acquire offline access tokens. Registers webhooks for live synchronization.  
* **WooCommerce:** Accepts Consumer Key/Secret, validates them dynamically against the store's REST API, and stores them.

| Method | Endpoint | Description | Handled By |
| :---- | :---- | :---- | :---- |
| GET | /v1/marketplace/shopify/install | Initiates Shopify OAuth flow. | marketplace\_service.py |
| GET | /v1/marketplace/shopify/callback | Exchanges code for access token. | marketplace\_service.py |
| POST | /v1/marketplace/woocommerce | Validates and connects Woo stores. | marketplace\_service.py |

### **3.4. Cost Data Management (cost\_data.py)**

Ingests and standardizes merchant cost data for intelligence calculations.

* **Ingestion Methods:** Supports direct CSV uploads (parsed via file\_handler.py), manual JSON entry, and QuickBooks synchronization.

## **4\. Database Schema (MongoDB Collections)**

The document structure is optimized for read-heavy operations while maintaining strict relational boundaries where necessary (using ObjectId references).

* **users Collection**  
  * \_id: ObjectId  
  * email / whatsapp\_number: String (Unique, Sparse)  
  * profile: Sub-document (first\_name, last\_name, role)  
  * onboarding\_state: String Enum  
  * workspace\_ids: Array of ObjectIds (Enables future multi-org access)  
* **workspaces Collection**  
  * \_id: ObjectId  
  * company\_name: String  
  * owner\_id: ObjectId (Ref: users)  
* **integrations Collection**  
  * \_id: ObjectId  
  * workspace\_id: ObjectId (Ref: workspaces)  
  * platform: String (shopify, woocommerce)  
  * credentials: Binary (Encrypted ciphertext—never plain string)  
  * status: String (active, syncing, failed)  
* **cost\_entries Collection**  
  * \_id: ObjectId  
  * workspace\_id: ObjectId  
  * source: String (csv, manual, quickbooks)  
  * amount: Decimal128  
  * category: String

## **5\. Security & Infrastructure Protocols**

To protect merchant intelligence and marketplace credentials, the backend enforces the following security standards:

### **5.1. Application Security**

* **Payload Validation:** Strict Pydantic V2 schemas (app/schemas/) reject malformed data automatically, preventing NoSQL injection.  
* **Credential Encryption:** Shopify OAuth tokens and WooCommerce API keys are encrypted at rest using AES-256-GCM via the Python cryptography module before entering MongoDB.  
* **Rate Limiting:** Global rate limiting is enforced via Redis on all /v1/auth/\* routes to neutralize brute-force and credential-stuffing attacks.

## **6\. Phased Implementation Roadmap**

1. **Phase 1 (Foundation):** Local setup of FastAPI, MongoDB, and Redis. Configure database.py and environment settings.  
2. **Phase 2 (Auth & Security):** Implement otp\_service.py and JWT issuance. Lock down the API with auth\_middleware.py.  
3. **Phase 3 (Onboarding):** Build the /onboarding endpoints and the state machine logic linking Users to Workspaces.  
4. **Phase 4 (Marketplaces):** Implement Shopify OAuth and WooCommerce credential validation securely into the database.  
5. **Phase 5 (Data & Testing):** Finalize cost\_data logic (CSV parsing) and execute the pytest suite ensuring \>85% coverage across all modules.