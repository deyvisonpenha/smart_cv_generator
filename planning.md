# SmartCV Project Planning

## 🏛️ Architecture: Orchestrator Pattern
The project follows a decoupled microservices architecture where **Ruby on Rails** acts as the central Orchestrator and API Gateway, managing persistence, authentication, and background jobs, while **FastAPI (Python)** serves as a specialized AI Engine.

---

### 🚀 Phase 1: Foundation & Infrastructure (Orchestrator)
*Target: Establish a solid base for all services.*
1.  **Multi-stage Containerization**: Update `Dockerfile` (Dev/Prod) for Rails and Python.
2.  **Unified Orchestration**: Root `docker-compose.yml` for 5 services (db, redis, api, worker, ai_engine).
3.  **Database Migration (PostgreSQL + JSONB)**:
    *   `User`: Authentication & Subscriptions.
    *   `CV`: Versioned CV data in `jsonb`.
    *   `JobDescription`: Target role data.
    *   `Optimization`: Orchestration status, match scores, and reports.
    *   `Interaction`: Q&A history for the Feature Store.
4.  **Security**: Implement `Devise` + `JWT` for stateless authentication.
5.  **CORS**: Allow React frontend to communicate with the Rails API.

### 🧠 Phase 2: Orchestration Logic (Service Layer)
*Target: Async communication between Rails and the AI Engine.*
1.  **AI Engine Client**: Implement a Faraday-based service in Rails to talk to FastAPI.
2.  **Background Processing (Sidekiq)**: Offload AI tasks to workers to prevent blocking HTTP requests.
3.  **Real-time Tracking**: Use `ActionCable` (WebSockets) to notify the frontend of processing progress.
4.  **Network Isolation**: Restrict FastAPI access to internal requests from the Rails container.

### 👤 Phase 3: User Experience & Persistence (SaaS Layer)
*Target: Build sticky features and data reuse.*
1.  **CV Dashboard**: Manage and view all previous optimizations.
2.  **Question Memory (Feature Store)**: Reuse past answers to common interview/gap questions.
3.  **Public Links**: Generate UUID-based shareable links for optimized CVs.

### 💎 Phase 4: Open Core & Enterprise Strategy
*Target: Differentiate between Self-hosted (Free) and Managed Cloud (Paid).*
1.  **Feature Toggles**: Env-based switches for "Local Mode" vs "Enterprise Mode".
2.  **Stripe Integration**: Manage Pro subscriptions and usage limits.
3.  **Cloud Storage (AWS S3)**: Persistent storage for generated documents in the Cloud version.
4.  **Semantic Search (RAG)**: Use `pgvector` for advanced resume search capabilities.

---

### 🛠️ Initial Setup Commands (Quick Start)
```bash
# 1. Start foundations
docker-compose up -d db redis

# 2. Setup Rails DB
docker-compose run api rails db:create db:migrate

# 3. Generate Core Models
docker-compose run api rails generate devise User
docker-compose run api rails generate model CV user:references original_text:text optimized_data:jsonb language:string slug:string:index
docker-compose run api rails generate model JobDescription user:references title:string content:text company_name:string
docker-compose run api rails generate model Optimization user:references cv:references status:string match_score:integer report:text
docker-compose run api rails generate model Interaction user:references question:text answer:text category:string

# 4. Finalize
docker-compose run api rails db:migrate
docker-compose up
```
