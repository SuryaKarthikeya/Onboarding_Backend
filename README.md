# **Product Requirements Document (PRD): Realify AI Backend (FastAPI \+ MongoDB)**

## **1\. Executive Summary**

**Project Name:** Realify AI Backend Implementation  
**Tech Stack:** Python (FastAPI), MongoDB, Docker  
**Objective:** Develop a robust, asynchronous backend to support the Realify AI application. The focus is on a seamless user onboarding experience, secure passwordless/OTP authentication (Email and WhatsApp), integration with major e-commerce platforms (Shopify, WooCommerce), and a scalable, containerized NoSQL database architecture designed to support future AI/ML data processing.

## **2\. Functional Requirements**

### **2.1. Authentication (Passwordless / OTP / Password-based)**

*Note: Google and Apple SSO are explicitly out of scope for this phase.*

* **Email Authentication:**  
  * Sign up / Log in via Email.  
  * Implement verification (OTP or secure link sent via an SMTP provider like Amazon SES or SendGrid).  
  * Secure password recovery/reset flow.  
* **WhatsApp Authentication:**  
  * Sign up / Log in via WhatsApp number.  
  * Integrate a WhatsApp Business API provider (e.g., Twilio or Meta Graph API) to deliver OTPs.  
  * Map the validated phone number to the corresponding user document in MongoDB.

### **2.2. Full Onboarding Process**

The backend must support a multi-step onboarding state machine. FastAPI will expose RESTful endpoints to advance the user through these stages before unlocking core application features.

* **Step 1: Account Creation:** User creates an account via Email or WhatsApp.  
* **Step 2: Profile Details:** Capture basic details (First Name, Last Name, Company Name, Role).  
* **Step 3: Workspace Initialization:** Generate a unique workspace/tenant document for the company to support multi-tenancy.  
* **Step 4: Platform Connection:** Prompt the user to connect their initial marketplace (Shopify or WooCommerce).  
* **State Tracking:** Track the onboarding\_status (e.g., PENDING\_EMAIL\_VERIFICATION, PROFILE\_INCOMPLETE, PENDING\_INTEGRATION, COMPLETED) to control endpoint access via FastAPI dependencies.

### **2.3. Marketplace Integrations**

* **Shopify Integration:**  
  * Implement the Shopify OAuth 2.0 flow using HTTPX for asynchronous requests to acquire offline access tokens.  
  * Store access tokens and shop URLs securely.  
  * Register webhooks to listen for real-time shop updates (orders, inventory).  
* **WooCommerce Integration:**  
  * Provide an endpoint to ingest the WooCommerce Store URL, Consumer Key, and Consumer Secret.  
  * Validate the credentials dynamically via a test request to the WooCommerce REST API before persisting the data.

## **3\. Data & Infrastructure Requirements**

### **3.1. Database Architecture & ORM/ODM**

* **Database Engine:** MongoDB (NoSQL).  
* **Driver/ODM:** Use **Motor** (the official async Python driver for MongoDB) to ensure non-blocking I/O, paired with **Beanie** or native **Pydantic** models for strict document validation.  
* **Hosting Strategy:** Docker containerization.  
* **Persistent Storage:** Docker Volumes must be configured (e.g., \-v realify\_mongo\_data:/data/db) to ensure the MongoDB instance retains data across container rebuilds.

### **3.2. High-Level MongoDB Collections Schema**

Because this is a NoSQL structure, we will optimize for read-heavy operations by appropriately embedding data or using manual references.

* **users Collection:**  
  * \_id (ObjectId)  
  * email (String, unique, sparse)  
  * whatsapp\_number (String, unique, sparse)  
  * password\_hash (String)  
  * profile (Sub-document: first\_name, last\_name, role)  
  * onboarding\_status (String)  
  * workspace\_ids (Array of ObjectIds referencing workspaces)  
* **workspaces Collection:**  
  * \_id (ObjectId)  
  * company\_name (String)  
  * owner\_id (ObjectId referencing users)  
  * team\_members (Array of ObjectIds referencing users—useful for collaborative access later)  
* **integrations Collection:**  
  * \_id (ObjectId)  
  * workspace\_id (ObjectId referencing workspaces)  
  * platform (String: 'shopify' | 'woocommerce')  
  * credentials (Encrypted String/Binary \- *Never store as plain JSON*)  
  * status (String: 'active' | 'disconnected')

*(Note: If future phases involve RAG agents or AI analytics, MongoDB’s flexible schema and Atlas Vector Search capabilities will easily accommodate embeddings directly alongside integration data.)*

## **4\. Security & Integrity Requirements**

### **4.1. Data Security**

* **Pydantic Validation:** Leverage FastAPI's native Pydantic V2 integration to strictly validate all incoming payloads, preventing NoSQL injection and malformed data from entering the database.  
* **Password Hashing:** Use passlib with **Bcrypt** or **Argon2** to hash passwords.  
* **Encryption at Rest (Application Level):** Use Python's cryptography library (Fernet symmetric encryption) to encrypt Shopify tokens and WooCommerce API keys before saving them to the integrations collection.

### **4.2. API & Network Security**

* **Authentication Tokens:** Implement JWT (JSON Web Tokens) using PyJWT. Use short-lived access tokens and secure, HTTP-only refresh tokens.  
* **CORS:** Configure FastAPI's CORSMiddleware strictly, allowing origins only from the production/staging frontend URLs.  
* **Rate Limiting:** Implement slowapi or a Redis-backed rate limiter on authentication/OTP routes to prevent brute-force attacks.

## **5\. Collaboration & Phased Deliverables**

To ensure smooth development across the team, FastAPI’s auto-generated OpenAPI (Swagger) documentation (/docs) should serve as the single source of truth for frontend and backend API contracts.

* **Phase 1: Environment & Architecture:**  
  * Set up the docker-compose.yml containing the FastAPI app and mongo:latest with volume persistence.  
  * Define base Pydantic models and connect the async Motor client.  
* **Phase 2: Core Auth & Security:**  
  * Implement JWT utilities, password hashing, and the OTP generation logic (Email/WhatsApp).  
  * Apply CORS and Rate Limiting middleware.  
* **Phase 3: Onboarding & User Management:**  
  * Build endpoints for profile completion and workspace creation.  
  * Implement FastAPI dependency injections to restrict route access based on onboarding\_status.  
* **Phase 4: Marketplace Integrations:**  
  * Implement Shopify OAuth routes.  
  * Build WooCommerce credential validation and AES encryption logic before saving to MongoDB.