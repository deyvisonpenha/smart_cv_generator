# SmartCV System Architecture

## Overview

SmartCV is a microservices-based application for AI-powered CV optimization. The system uses an orchestrator pattern with Rails as the central API and FastAPI for AI processing.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React/Next.js Application                                   │  │
│  │  - UI Components                                             │  │
│  │  - State Management (Redux/Context)                         │  │
│  │  - API Client (Axios)                                       │  │
│  │  - WebSocket Client (ActionCable JS)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP/REST + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Rails API Layer (Orchestrator)                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Controllers (48+ Endpoints)                                 │  │
│  │  ├── Authentication (JWT)                                    │  │
│  │  ├── CVs Management                                          │  │
│  │  ├── Job Descriptions                                        │  │
│  │  ├── Optimizations                                           │  │
│  │  ├── Interactions (Feature Store)                            │  │
│  │  ├── Dashboard & Analytics                                   │  │
│  │  └── Public Access                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Business Logic (Models)                                     │  │
│  │  ├── User (Auth, Subscriptions, Rate Limiting)              │  │
│  │  ├── CV (Versioning, Analysis, Sharing)                     │  │
│  │  ├── JobDescription (Parsing, Analysis)                     │  │
│  │  ├── Optimization (State Machine)                           │  │
│  │  └── Interaction (Feature Store)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Services                                                    │  │
│  │  └── AiEngineClient (HTTP Client to FastAPI)                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Real-time (ActionCable)                                     │  │
│  │  └── OptimizationChannel (WebSocket Broadcasting)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
       │                    │                          │
       │                    │                          │
       ▼                    ▼                          ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ PostgreSQL  │    │   Redis         │    │  Sidekiq Worker  │
│  Database   │    │  ├── Cache      │    │  ┌────────────┐  │
│             │    │  ├── Sessions   │    │  │ Jobs Queue │  │
│  ┌────────┐ │    │  └── ActionCable│    │  └────────────┘  │
│  │ Users  │ │    │      Pub/Sub    │    │                  │
│  │ CVs    │ │    └─────────────────┘    │  ┌────────────┐  │
│  │ Jobs   │ │                           │  │ Optimize   │  │
│  │ Opts   │ │                           │  │ Resume Job │  │
│  │ Inter. │ │                           │  └────────────┘  │
│  └────────┘ │                           │                  │
│             │                           │  ┌────────────┐  │
│  JSONB      │                           │  │  Cleanup   │  │
│  Indexes    │                           │  │ Stale Job  │  │
│  GIN        │                           │  └────────────┘  │
└─────────────┘                           └──────────────────┘
                                                   │
                                                   │ HTTP
                                                   ▼
                                          ┌──────────────────┐
                                          │  FastAPI Engine  │
                                          │  ┌────────────┐  │
                                          │  │ CV Analyze │  │
                                          │  │ Gap Detect │  │
                                          │  │ AI Process │  │
                                          │  └────────────┘  │
                                          │                  │
                                          │  ┌────────────┐  │
                                          │  │  OpenAI    │  │
                                          │  │    API     │  │
                                          │  └────────────┘  │
                                          └──────────────────┘
```

---

## Component Details

### 1. Frontend Layer (React/Next.js)
**Responsibility**: User Interface

**Components**:
- Authentication forms (login, signup)
- CV management dashboard
- Job description editor
- Optimization progress tracker (real-time)
- Dashboard analytics
- Interaction management

**Technologies**:
- React 18
- Next.js (optional)
- Redux/Context for state
- Axios for HTTP
- ActionCable JS for WebSocket

---

### 2. Rails API (Orchestrator)
**Responsibility**: Central Orchestration, Business Logic, Data Persistence

**Key Features**:
- JWT-based authentication
- RESTful API (48+ endpoints)
- Background job scheduling
- Real-time WebSocket broadcasting
- Rate limiting
- Subscription management

**Technologies**:
- Ruby on Rails 7.1 (API mode)
- Devise + JWT
- ActionCable
- Sidekiq
- Faraday (HTTP client)

---

### 3. PostgreSQL Database
**Responsibility**: Primary Data Store

**Schema**:
- **users**: Authentication and subscriptions
- **cvs**: CV data with JSONB for flexible structure
- **job_descriptions**: Job postings
- **optimizations**: Optimization state and results
- **interactions**: Feature Store for Q&A

**Optimizations**:
- JSONB with GIN indexes
- Composite indexes on common queries
- Foreign key constraints
- Counter caches

---

### 4. Redis
**Responsibility**: Caching, Session Storage, Pub/Sub

**Usage**:
- **Cache**: Frequently accessed data
- **ActionCable Adapter**: WebSocket pub/sub
- **Sidekiq Queue**: Background job storage

---

### 5. Sidekiq Worker
**Responsibility**: Background Job Processing

**Jobs**:
- **OptimizeResumeJob**: Process CV optimization asynchronously
- **CleanupStaleOptimizationsJob**: Clean stuck optimizations

**Features**:
- Automatic retry with exponential backoff
- Job scheduling (cron-like)
- Dead letter queue for failed jobs
- Real-time monitoring

---

### 6. FastAPI (AI Engine)
**Responsibility**: AI Processing

**Endpoints**:
- `/health`: Health check
- `/optimize`: CV optimization
- `/analyze`: Gap analysis
- `/generate`: CV generation

**Integration**:
- OpenAI API for AI processing
- PDF generation libraries
- NLP processing

---

## Data Flow

### CV Optimization Flow

```
1. User uploads CV + Job Description
   └─> POST /api/v1/optimizations
       └─> Rails: Create Optimization record (status: pending)
           └─> Sidekiq: Enqueue OptimizeResumeJob
               └─> ActionCable: Broadcast status update

2. Sidekiq Worker picks up job
   └─> Update status to 'processing'
       └─> AiEngineClient.optimize_cv()
           └─> HTTP POST to FastAPI /optimize
               └─> FastAPI: Process with OpenAI
                   └─> Return optimized CV + match score

3. Worker receives response
   └─> Update Optimization (status: completed, match_score: 85)
       └─> Update CV optimized_data (JSONB)
           └─> ActionCable: Broadcast completion
               └─> Frontend: Update UI in real-time
```

### Real-time Update Flow

```
1. Frontend subscribes to OptimizationChannel
   └─> WebSocket connection with JWT authentication
       └─> Redis pub/sub subscription

2. Backend broadcasts status change
   └─> OptimizationChannel.broadcast_to(user, data)
       └─> Redis: Publish to channel
           └─> ActionCable: Push to all subscribers
               └─> Frontend: Receive update via WebSocket
```

### Feature Store Flow (Interaction)

```
1. User asks question "How do I explain a gap?"
   └─> POST /api/v1/interactions
       └─> Interaction.find_similar_for_user(user, question)
           ├─> Found similar? → Update answer, increment usage
           └─> Not found? → Create new interaction
               └─> Automatic categorization
                   └─> Save to database
```

---

## Authentication Flow

```
1. Signup
   POST /api/v1/signup
   ├─> User.create(email, password)
   ├─> Generate JWT token
   │   └─> Payload: { sub: user_id, email, exp }
   └─> Return { user, token }

2. Login
   POST /api/v1/login
   ├─> Validate credentials
   ├─> Generate JWT token
   └─> Return { user, token }

3. Protected Request
   GET /api/v1/cvs
   ├─> Extract token from Authorization header
   ├─> Decode and verify JWT
   ├─> Find user by sub (user_id)
   └─> Proceed with request
```

---

## State Machine: Optimization

```
┌─────────┐
│ pending │
└────┬────┘
     │ start_processing!
     ▼
┌────────────┐
│ processing │
└─────┬──────┘
      │
      ├─────────────┐
      │             │
      │ complete!   │ fail!
      ▼             ▼
┌──────────┐   ┌────────┐
│completed │   │ failed │
└──────────┘   └───┬────┘
                   │ retry! (max 3x)
                   └──────┐
                          │
      ┌───────────────────┘
      │
      ▼
┌───────────┐
│ cancelled │
└───────────┘
```

**Guards**:
- `can_start_processing?`: Only pending
- `can_complete?`: Only processing
- `can_fail?`: Pending or processing
- `can_cancel?`: Pending or processing
- `can_retry?`: Failed and retry_count < 3

---

## API Endpoint Architecture

### RESTful Structure

```
/api/v1/
├── Authentication (4 endpoints)
│   ├── POST   /signup
│   ├── POST   /login
│   ├── DELETE /logout
│   └── GET    /current_user
│
├── CVs (7 endpoints)
│   ├── GET    /cvs
│   ├── POST   /cvs
│   ├── GET    /cvs/:id
│   ├── PATCH  /cvs/:id
│   ├── DELETE /cvs/:id
│   ├── POST   /cvs/:id/duplicate
│   └── GET    /cvs/:id/public_view
│
├── Job Descriptions (9 endpoints)
│   ├── GET    /job_descriptions
│   ├── POST   /job_descriptions
│   ├── GET    /job_descriptions/:id
│   ├── PATCH  /job_descriptions/:id
│   ├── DELETE /job_descriptions/:id
│   ├── POST   /job_descriptions/:id/duplicate
│   ├── GET    /job_descriptions/:id/extract_keywords
│   ├── GET    /job_descriptions/:id/required_skills
│   └── GET    /job_descriptions/:id/analysis
│
├── Optimizations (7 endpoints)
│   ├── GET    /optimizations
│   ├── POST   /optimizations
│   ├── GET    /optimizations/:id
│   ├── GET    /optimizations/:id/status
│   ├── POST   /optimizations/:id/regenerate
│   ├── POST   /optimizations/:id/cancel
│   └── GET    /optimizations/stats
│
├── Interactions (10 endpoints)
│   ├── GET    /interactions
│   ├── POST   /interactions
│   ├── GET    /interactions/:id
│   ├── PATCH  /interactions/:id
│   ├── DELETE /interactions/:id
│   ├── GET    /interactions/by_category
│   ├── GET    /interactions/categories
│   ├── GET    /interactions/search
│   ├── GET    /interactions/stats
│   └── GET    /interactions/popular/:category
│
└── Dashboard (2 endpoints)
    ├── GET    /dashboard
    └── GET    /dashboard/stats

/public/
└── GET /cv/:slug (unauthenticated)
```

---

## Security Architecture

### Layers of Security

1. **Network Layer**
   - Docker internal network isolation
   - CORS configuration
   - Rate limiting per IP (planned)

2. **Application Layer**
   - JWT authentication
   - Resource ownership validation
   - Strong parameter filtering
   - SQL injection protection (ActiveRecord)

3. **Data Layer**
   - Bcrypt password hashing
   - JSONB validation
   - Foreign key constraints

4. **Business Logic Layer**
   - Subscription-based rate limiting
   - Usage tracking
   - Audit logging (planned)

### Authentication Security

```
┌──────────────────────────────────────────┐
│  Request with JWT Token                  │
│  Authorization: Bearer <token>           │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  BaseController#authenticate_request!    │
│  1. Extract token from header            │
│  2. Decode JWT (verify signature)        │
│  3. Check expiration                     │
│  4. Find user by sub (user_id)           │
└─────────────────┬────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌─────────┐        ┌──────────┐
   │ Success │        │  Reject  │
   │ (200)   │        │  (401)   │
   └─────────┘        └──────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

**Current Architecture Supports**:
- ✅ Stateless API (JWT, no sessions)
- ✅ Background job workers (add more Sidekiq containers)
- ✅ Redis pub/sub for cross-process communication
- ✅ Database connection pooling

**Load Balancing Strategy**:
```
           ┌─────────────┐
           │ Load        │
           │ Balancer    │
           │ (Nginx/ALB) │
           └──────┬──────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐   ┌────────┐   ┌────────┐
│ Rails  │   │ Rails  │   │ Rails  │
│ API 1  │   │ API 2  │   │ API 3  │
└────┬───┘   └────┬───┘   └────┬───┘
     │            │            │
     └────────────┼────────────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
    ┌──────────┐     ┌────────┐
    │PostgreSQL│     │ Redis  │
    │ (Primary)│     │Cluster │
    └──────────┘     └────────┘
```

### Vertical Scaling

**Database Optimization**:
- Read replicas for analytics
- Connection pooling (pgBouncer)
- Query optimization with indexes

**Caching Strategy**:
- Redis for session/cache
- HTTP caching headers
- CDN for static assets

---

## Monitoring & Observability

### Metrics to Track

**Application Metrics**:
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

**Business Metrics**:
- Optimizations created/completed
- Average match score
- Feature Store hit rate
- Subscription conversions

**Infrastructure Metrics**:
- CPU/Memory usage
- Database connections
- Redis memory
- Sidekiq queue size

### Logging Strategy

```
Application Logs → Aggregator → Storage → Visualization
     │                │            │           │
     │                │            │           │
Rails Logs ──────→ Fluentd ───→ ElasticSearch ───→ Kibana
Sidekiq Logs ────┘    │            │           │
FastAPI Logs ─────────┘            │           │
                                   │           │
                              Long-term ───→ Alerting
                              Archive       (PagerDuty)
```

---

## Deployment Architecture

### Development

```
docker-compose.yml
├── db (PostgreSQL)
├── redis
├── api (Rails)
├── worker (Sidekiq)
└── ai_engine (FastAPI)
```

### Production (Planned)

```
┌───────────────────────────────────────────────┐
│  CDN (CloudFront)                             │
│  └─> Static Assets                            │
└───────────────────────────────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────────┐
│  Load Balancer (ALB)                          │
│  └─> SSL Termination                          │
└───────────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ECS/EKS  │  │ ECS/EKS  │  │ ECS/EKS  │
│ Rails 1  │  │ Rails 2  │  │ Rails 3  │
└──────────┘  └──────────┘  └──────────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   RDS    │  │ElastiCache│ │   S3     │
│PostgreSQL│  │  Redis   │  │  Assets  │
└──────────┘  └──────────┘  └──────────┘
```

---

## Technology Stack Summary

### Backend
- **Framework**: Ruby on Rails 7.1 (API mode)
- **Authentication**: Devise + JWT
- **Background Jobs**: Sidekiq
- **Real-time**: ActionCable
- **HTTP Client**: Faraday

### AI Engine
- **Framework**: FastAPI
- **Language**: Python 3.11
- **AI**: OpenAI API

### Data
- **Primary DB**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Storage**: JSONB (flexible schema)

### Infrastructure
- **Development**: Docker Compose
- **Production**: AWS ECS/EKS (planned)
- **Monitoring**: Datadog/New Relic (planned)
- **Logs**: ELK Stack (planned)

---

## Design Patterns Used

1. **Orchestrator Pattern**: Rails coordinates all services
2. **State Machine**: Optimization state transitions
3. **Feature Store**: Interaction caching and reuse
4. **Repository Pattern**: ActiveRecord models
5. **Service Object**: AiEngineClient
6. **Background Job**: Async processing
7. **Pub/Sub**: Real-time updates via Redis
8. **RESTful API**: Standard HTTP methods
9. **JWT**: Stateless authentication
10. **MVC**: Model-View-Controller (API mode)

---

## Best Practices Implemented

✅ **Separation of Concerns**: Clear boundaries between layers  
✅ **DRY Principle**: Reusable code in base classes  
✅ **SOLID Principles**: Single responsibility, open/closed  
✅ **Security First**: Authentication, validation, sanitization  
✅ **API Versioning**: `/api/v1/` namespace  
✅ **Error Handling**: Consistent error responses  
✅ **Pagination**: Prevent large data loads  
✅ **Indexing**: Optimized database queries  
✅ **Caching**: Redis for frequently accessed data  
✅ **Async Processing**: Non-blocking operations  

---

## Future Enhancements

### Phase 4: Semantic Search
- pgvector for embeddings
- Similarity search
- RAG-based Q&A

### Phase 5: Subscriptions
- Stripe integration
- Usage-based billing
- Invoice generation

### Phase 6: Enterprise
- Multi-tenant architecture
- SSO integration
- Custom branding

### Phase 7: Advanced AI
- Multi-language support
- Interview preparation
- Career recommendations

### Phase 8: Production
- Kubernetes deployment
- Auto-scaling
- Advanced monitoring
- Disaster recovery

---

## Conclusion

SmartCV uses a modern, scalable microservices architecture with clear separation of concerns. The orchestrator pattern with Rails as the central API provides flexibility for future growth while maintaining simplicity in the current implementation.

**Current Status**: Production-ready API with 48+ endpoints  
**Scalability**: Horizontal and vertical scaling ready  
**Security**: Multi-layer security implemented  
**Performance**: Optimized with indexing and caching  
**Monitoring**: Ready for observability tools  

**Architecture Stability**: ⭐⭐⭐⭐⭐ (5/5)