# SmartCV Quick Start Guide

Get the SmartCV API up and running in 5 minutes!

## Prerequisites

- Docker Desktop installed and running
- `curl` and `jq` for testing (optional)
- Modern terminal (bash/zsh)

---

## 🚀 Quick Start

### 1. Clone and Start Services

```bash
cd pdfGenerator

# Start all services (PostgreSQL, Redis, Rails API, Sidekiq, FastAPI)
docker-compose up -d

# Wait ~30 seconds for services to initialize
```

### 2. Setup Database

```bash
# Create and migrate database
docker-compose exec api rails db:create db:migrate

# Verify migrations
docker-compose exec api rails db:migrate:status
```

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# Should show 5 services: db, redis, api, worker, ai_engine
```

---

## 🧪 Test the API

### Run Comprehensive Test Suite

```bash
./test_phase3_api.sh
```

This will test all 48+ endpoints automatically!

### Manual Testing

#### 1. Create an Account

```bash
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "demo@example.com",
      "password": "Password123!",
      "password_confirmation": "Password123!"
    }
  }' | jq
```

Save the `token` from the response!

#### 2. Create a CV

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/v1/cvs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cv": {
      "original_text": "John Doe\nSenior Software Engineer\n\nExperience:\n- 5 years at Tech Corp\n- Built scalable systems\n\nSkills:\n- Python, Ruby, Docker\n- AWS, Kubernetes",
      "language": "en"
    }
  }' | jq
```

#### 3. Create a Job Description

```bash
curl -X POST http://localhost:3000/api/v1/job_descriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": {
      "title": "Senior Software Engineer",
      "company_name": "Tech Corp",
      "content": "Looking for a senior engineer with 5+ years experience in Python, Docker, and cloud platforms..."
    }
  }' | jq
```

#### 4. Create an Optimization

```bash
curl -X POST http://localhost:3000/api/v1/optimizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "optimization": {
      "cv_id": 1,
      "job_description_id": 1
    }
  }' | jq
```

#### 5. Check Status

```bash
curl -X GET http://localhost:3000/api/v1/optimizations/1/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 6. Get Dashboard

```bash
curl -X GET http://localhost:3000/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📚 API Endpoints Overview

### Authentication
- `POST /api/v1/signup` - Create account
- `POST /api/v1/login` - Login
- `GET /api/v1/current_user` - Get current user

### CVs (7 endpoints)
- `GET /api/v1/cvs` - List all CVs
- `POST /api/v1/cvs` - Create CV
- `GET /api/v1/cvs/:id` - Get CV
- `PATCH /api/v1/cvs/:id` - Update CV
- `DELETE /api/v1/cvs/:id` - Delete CV
- `POST /api/v1/cvs/:id/duplicate` - Duplicate CV
- `GET /api/v1/cvs/:id/public_view` - Get shareable link

### Job Descriptions (9 endpoints)
- `GET /api/v1/job_descriptions` - List jobs
- `POST /api/v1/job_descriptions` - Create job
- `GET /api/v1/job_descriptions/:id` - Get job
- `PATCH /api/v1/job_descriptions/:id` - Update job
- `DELETE /api/v1/job_descriptions/:id` - Delete job
- `POST /api/v1/job_descriptions/:id/duplicate` - Duplicate
- `GET /api/v1/job_descriptions/:id/extract_keywords` - Extract keywords
- `GET /api/v1/job_descriptions/:id/required_skills` - Get skills
- `GET /api/v1/job_descriptions/:id/analysis` - Full analysis

### Optimizations (7 endpoints)
- `GET /api/v1/optimizations` - List optimizations
- `POST /api/v1/optimizations` - Create optimization
- `GET /api/v1/optimizations/:id` - Get optimization
- `GET /api/v1/optimizations/:id/status` - Check status
- `POST /api/v1/optimizations/:id/regenerate` - Retry
- `POST /api/v1/optimizations/:id/cancel` - Cancel
- `GET /api/v1/optimizations/stats` - Get stats

### Interactions (10 endpoints)
- `GET /api/v1/interactions` - List interactions
- `POST /api/v1/interactions` - Create interaction
- `GET /api/v1/interactions/categories` - List categories
- `GET /api/v1/interactions/search?q=query` - Search
- And more...

### Dashboard (2 endpoints)
- `GET /api/v1/dashboard` - Full dashboard
- `GET /api/v1/dashboard/stats` - Detailed stats

### Public (1 endpoint)
- `GET /public/cv/:slug` - View CV (no auth required)

**Total: 48+ endpoints**

---

## 🔍 Useful Commands

### Docker

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f ai_engine

# Restart a service
docker-compose restart api

# Rebuild after code changes
docker-compose build api
docker-compose up -d api

# Stop all services
docker-compose down

# Stop and remove volumes (careful!)
docker-compose down -v
```

### Rails

```bash
# Rails console
docker-compose exec api rails console

# Check routes
docker-compose exec api rails routes

# Run migrations
docker-compose exec api rails db:migrate

# Rollback migration
docker-compose exec api rails db:rollback

# Reset database (WARNING: deletes all data)
docker-compose exec api rails db:drop db:create db:migrate
```

### Sidekiq (Background Jobs)

```bash
# View Sidekiq logs
docker-compose logs -f worker

# Check job queue in Rails console
docker-compose exec api rails console
> Sidekiq::Queue.new.size
> Sidekiq::RetrySet.new.size
```

### Redis

```bash
# Redis CLI
docker-compose exec redis redis-cli

# Check keys
> KEYS *
> GET key_name
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check if ports are already in use
lsof -i :3000  # Rails API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8000  # FastAPI

# Stop conflicting services or change ports in docker-compose.yml
```

### Database errors

```bash
# Reset database
docker-compose exec api rails db:drop db:create db:migrate

# Check database connection
docker-compose exec api rails db:version
```

### JWT Token issues

```bash
# Generate new secret key
docker-compose exec api rails secret

# Update config/credentials.yml.enc or use SECRET_KEY_BASE env var
```

### Optimization stuck in "processing"

```bash
# Check worker logs
docker-compose logs -f worker

# Run cleanup job in console
docker-compose exec api rails console
> CleanupStaleOptimizationsJob.perform_now
```

### Can't access API from frontend

```bash
# Check CORS configuration in config/initializers/cors.rb
# Ensure your frontend URL is in the allowed origins list

# For development, it should include:
# - http://localhost:3001
# - http://localhost:5173
```

---

## 📖 Documentation

- **Full API Reference**: `PHASE3_GUIDE.md`
- **WebSocket Integration**: `ACTIONCABLE_INTEGRATION.md`
- **Frontend Guide**: `FRONTEND_INTEGRATION.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Project Progress**: `PROGRESS.md`
- **Planning**: `planning.md`

---

## 🎯 Common Use Cases

### Use Case 1: Complete CV Optimization Flow

```bash
# 1. Create user
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"user@test.com","password":"Pass123!","password_confirmation":"Pass123!"}}' | jq -r '.token'

# Save token as TOKEN variable
TOKEN="..."

# 2. Create CV
CV_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/cvs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cv":{"original_text":"Your CV text here...","language":"en"}}')

CV_ID=$(echo $CV_RESPONSE | jq -r '.cv.id')

# 3. Create Job Description
JOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/job_descriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_description":{"title":"Engineer","company_name":"Tech","content":"Job details..."}}')

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.job_description.id')

# 4. Start Optimization
OPT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/optimizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"optimization\":{\"cv_id\":$CV_ID,\"job_description_id\":$JOB_ID}}")

OPT_ID=$(echo $OPT_RESPONSE | jq -r '.optimization.id')

# 5. Check status every few seconds
watch -n 2 "curl -s -X GET http://localhost:3000/api/v1/optimizations/$OPT_ID/status -H 'Authorization: Bearer $TOKEN' | jq"
```

### Use Case 2: Feature Store Pattern

```bash
# Save an interaction
curl -X POST http://localhost:3000/api/v1/interactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interaction": {
      "question": "How do I explain a gap in my employment?",
      "answer": "I took time off to care for family and improve my skills.",
      "category": "gap_explanation"
    }
  }' | jq

# Search for similar questions (Feature Store will reuse the answer)
curl -X GET "http://localhost:3000/api/v1/interactions/search?q=employment+gap" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Use Case 3: Job Analysis

```bash
# Get full job analysis
curl -X GET http://localhost:3000/api/v1/job_descriptions/1/analysis \
  -H "Authorization: Bearer $TOKEN" | jq

# Extract keywords
curl -X GET http://localhost:3000/api/v1/job_descriptions/1/extract_keywords \
  -H "Authorization: Bearer $TOKEN" | jq

# Get required skills
curl -X GET http://localhost:3000/api/v1/job_descriptions/1/required_skills \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔐 Security Notes

### Development
- Default JWT secret is in `config/credentials.yml.enc`
- CORS is open to localhost ports
- Rate limiting: 5 optimizations/month for free tier

### Production Checklist
- [ ] Change `SECRET_KEY_BASE` environment variable
- [ ] Update CORS origins to production URL only
- [ ] Enable SSL/TLS for API and WebSocket
- [ ] Set up JWT refresh tokens
- [ ] Configure rate limiting per IP
- [ ] Enable audit logging
- [ ] Set up monitoring (Datadog, New Relic)
- [ ] Configure error tracking (Sentry)

---

## 📊 System Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP/WS
       ▼
┌─────────────┐     ┌──────────────┐
│  Rails API  │────▶│  PostgreSQL  │
│ (Orchestr.) │     └──────────────┘
└──────┬──────┘
       │
       ├──────────▶ Redis (Cache + ActionCable)
       │
       ├──────────▶ Sidekiq (Background Jobs)
       │
       └──────────▶ FastAPI (AI Engine)
```

---

## 🎉 You're Ready!

Your SmartCV API is now running with:
- ✅ 48+ API endpoints
- ✅ Real-time WebSocket updates
- ✅ Background job processing
- ✅ JWT authentication
- ✅ Feature Store for Q&A
- ✅ Job analysis tools
- ✅ Public CV sharing

**Next Steps:**
1. Explore the API with the test script: `./test_phase3_api.sh`
2. Read the full guide: `PHASE3_GUIDE.md`
3. Integrate with your frontend
4. Start building!

**Need Help?**
- Check `PHASE3_GUIDE.md` for detailed documentation
- Review controller code for implementation examples
- Run test script to see working examples

Happy coding! 🚀