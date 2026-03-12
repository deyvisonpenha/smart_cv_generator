# SmartCV API Documentation

**Version:** 2.0  
**Base URL:** `http://localhost:3000/api/v1`  
**WebSocket URL:** `ws://localhost:3000/cable`

---

## 🔐 Authentication

All API endpoints (except signup/login) require JWT authentication.

### Headers

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Get JWT Token

**Login:**
```bash
POST /api/v1/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Logged in successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscription_tier": "free",
    "remaining_optimizations": 5,
    "has_pro_access": false
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [CVs](#cvs-endpoints)
3. [Job Descriptions](#job-descriptions-endpoints)
4. [Optimizations](#optimizations-endpoints)
5. [Interactions](#interactions-endpoints)
6. [Dashboard](#dashboard-endpoints)
7. [WebSockets](#websockets)
8. [Error Handling](#error-handling)

---

## 🔑 Authentication Endpoints

### Signup

Create a new user account.

```http
POST /api/v1/signup
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "password_confirmation": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "email": "newuser@example.com",
    "subscription_tier": "free",
    "subscription_status": "active",
    "remaining_optimizations": 5
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Login

Authenticate and get JWT token.

```http
POST /api/v1/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

### Get Current User

Get authenticated user information.

```http
GET /api/v1/current_user
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscription_tier": "free",
    "remaining_optimizations": 5,
    "has_pro_access": false,
    "trial_active": false
  }
}
```

### Logout

Logout user (invalidate token on client side).

```http
DELETE /api/v1/logout
```

**Response:** `200 OK`

---

## 📄 CVs Endpoints

### List CVs

Get all CVs for authenticated user.

```http
GET /api/v1/cvs
```

**Query Parameters:**
- `page` (integer) - Page number (default: 1)
- `per_page` (integer) - Items per page (default: 20, max: 100)
- `language` (string) - Filter by language (en, es, pt, fr, de, it)
- `optimized` (boolean) - Filter optimized CVs
- `unoptimized` (boolean) - Filter unoptimized CVs

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "slug": "abc123xyz",
      "language": "en",
      "optimized": true,
      "public_url": "/public/cv/abc123xyz",
      "completeness": 85,
      "created_at": "2026-03-11T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 1,
    "per_page": 20
  }
}
```

### Get CV

Get a specific CV by ID.

```http
GET /api/v1/cvs/:id
```

**Response:** `200 OK`
```json
{
  "cv": {
    "id": 1,
    "slug": "abc123xyz",
    "language": "en",
    "original_text": "John Doe\nSoftware Engineer...",
    "optimized_data": {
      "name": "John Doe",
      "skills": ["Ruby", "Python", "Docker"]
    },
    "public_url": "/public/cv/abc123xyz",
    "completeness": 85,
    "optimized": true,
    "created_at": "2026-03-11T10:00:00Z"
  }
}
```

### Create CV

Create a new CV.

```http
POST /api/v1/cvs
```

**Request:**
```json
{
  "cv": {
    "original_text": "John Doe\nSoftware Engineer\n5 years experience...",
    "language": "en"
  }
}
```

**Response:** `201 Created`

### Update CV

Update an existing CV.

```http
PATCH /api/v1/cvs/:id
PUT /api/v1/cvs/:id
```

**Request:**
```json
{
  "cv": {
    "original_text": "Updated content...",
    "language": "es"
  }
}
```

**Response:** `200 OK`

### Delete CV

Delete a CV.

```http
DELETE /api/v1/cvs/:id
```

**Response:** `200 OK`

### Duplicate CV

Create a copy of an existing CV.

```http
POST /api/v1/cvs/:id/duplicate
```

**Response:** `201 Created`

---

## 💼 Job Descriptions Endpoints

### List Job Descriptions

Get all job descriptions for authenticated user.

```http
GET /api/v1/job_descriptions
```

**Query Parameters:**
- `page`, `per_page` - Pagination
- `company` (string) - Filter by company name (partial match)
- `title` (string) - Filter by job title (partial match)
- `with_company` (boolean) - Only jobs with company name
- `q` (string) - Search in title, content, and company

**Response:** `200 OK`

### Get Job Description

```http
GET /api/v1/job_descriptions/:id
```

**Response:** `200 OK`
```json
{
  "job_description": {
    "id": 1,
    "title": "Senior Backend Engineer",
    "company_name": "TechCorp",
    "content": "We are looking for...",
    "preview": "We are looking for...",
    "created_at": "2026-03-11T10:00:00Z",
    "stats": {
      "optimized_cvs_count": 3,
      "average_match_score": 82.5
    }
  }
}
```

### Create Job Description

```http
POST /api/v1/job_descriptions
```

**Request:**
```json
{
  "job_description": {
    "title": "Senior Backend Engineer",
    "company_name": "TechCorp",
    "content": "We are looking for an experienced backend engineer..."
  }
}
```

**Response:** `201 Created`

### Update Job Description

```http
PATCH /api/v1/job_descriptions/:id
```

### Delete Job Description

```http
DELETE /api/v1/job_descriptions/:id
```

### Duplicate Job Description

```http
POST /api/v1/job_descriptions/:id/duplicate
```

### Extract Keywords

Extract keywords from job description.

```http
GET /api/v1/job_descriptions/:id/extract_keywords
```

**Response:** `200 OK`
```json
{
  "keywords": {
    "python": 5,
    "docker": 3,
    "kubernetes": 2
  },
  "count": 20
}
```

### Get Required Skills

Extract required skills from job description.

```http
GET /api/v1/job_descriptions/:id/required_skills
```

**Response:** `200 OK`
```json
{
  "skills": [
    "5+ years Python experience",
    "Docker and Kubernetes",
    "Microservices architecture"
  ],
  "count": 15
}
```

### Full Analysis

Get complete analysis of job description.

```http
GET /api/v1/job_descriptions/:id/analysis
```

**Response:** `200 OK`
```json
{
  "keywords": {...},
  "required_skills": [...],
  "experience_level": "senior",
  "remote_work": true,
  "estimated_read_time": 3
}
```

---

## ⚙️ Optimizations Endpoints

### List Optimizations

Get all optimizations for authenticated user.

```http
GET /api/v1/optimizations
```

**Query Parameters:**
- `page`, `per_page` - Pagination
- `status` (string) - Filter by status (pending, processing, completed, failed, cancelled)
- `cv_id` (integer) - Filter by CV
- `job_description_id` (integer) - Filter by job
- `from` (datetime) - Created after date
- `to` (datetime) - Created before date

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "status": "completed",
      "match_score": 87,
      "match_score_category": "excellent",
      "processing_duration_humanized": "45s",
      "cv": {
        "id": 1,
        "display_name": "John Doe CV"
      },
      "job_description": {
        "id": 1,
        "title": "Senior Engineer"
      },
      "summary": {
        "recommendations_count": 5,
        "improvements_count": 3
      }
    }
  ],
  "meta": {...}
}
```

### Get Optimization

```http
GET /api/v1/optimizations/:id
```

**Response:** `200 OK`
```json
{
  "optimization": {
    "id": 1,
    "status": "completed",
    "match_score": 87,
    "report": {
      "recommendations": ["Add Docker experience", "..."],
      "improvements": ["..."],
      "strengths": ["..."],
      "weaknesses": ["..."]
    },
    "created_at": "2026-03-11T10:00:00Z",
    "completion_percentage": 100
  }
}
```

### Create Optimization

Start a new CV optimization process.

```http
POST /api/v1/optimizations
```

**Request:**
```json
{
  "optimization": {
    "cv_id": 1,
    "job_description_id": 1
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Optimization started",
  "optimization": {
    "id": 1,
    "status": "pending",
    "completion_percentage": 0
  }
}
```

**Note:** This will:
1. Create optimization record
2. Enqueue background job (Sidekiq)
3. Return immediately
4. Send real-time updates via WebSocket

### Get Optimization Status

Get current status of an optimization.

```http
GET /api/v1/optimizations/:id/status
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "status": "processing",
  "status_display": "Processing",
  "completion_percentage": 50,
  "match_score": null,
  "processing_duration": "30s",
  "can_retry": false,
  "updated_at": "2026-03-11T10:00:30Z"
}
```

### Regenerate Optimization

Retry a failed optimization.

```http
POST /api/v1/optimizations/:id/regenerate
```

**Response:** `200 OK`

**Note:** Only works for failed optimizations with retry count < 3.

### Cancel Optimization

Cancel a pending or processing optimization.

```http
POST /api/v1/optimizations/:id/cancel
```

**Response:** `200 OK`

### Get Statistics

Get optimization statistics for current user.

```http
GET /api/v1/optimizations/stats
```

**Response:** `200 OK`
```json
{
  "stats": {
    "total": 10,
    "by_status": {
      "pending": 0,
      "processing": 1,
      "completed": 8,
      "failed": 1,
      "cancelled": 0
    },
    "average_match_score": 82.5,
    "high_match_count": 5,
    "medium_match_count": 3,
    "low_match_count": 0,
    "this_month": 10,
    "remaining_this_month": 0
  }
}
```

---

## 💬 Interactions Endpoints

Interactions act as a **Feature Store** - caching Q&A to avoid redundant AI calls.

### List Interactions

```http
GET /api/v1/interactions
```

**Query Parameters:**
- `category` (string) - Filter by category
- `frequently_used` (boolean) - Only frequently reused answers
- `q` (string) - Search in questions

**Response:** `200 OK`

### Get Interaction

```http
GET /api/v1/interactions/:id
```

### Create/Update Interaction

Creates new or updates existing similar interaction (Feature Store pattern).

```http
POST /api/v1/interactions
```

**Request:**
```json
{
  "interaction": {
    "question": "Explain gap in employment 2020-2021",
    "answer": "I took time off to care for family",
    "category": "gap_explanation"
  }
}
```

**Response:** `201 Created` or `200 OK` (if similar found)
```json
{
  "message": "Interaction saved",
  "interaction": {
    "id": 1,
    "question": "...",
    "answer": "...",
    "category": "gap_explanation",
    "used_count": 1,
    "reused": false
  },
  "reused": false
}
```

### Get by Category

```http
GET /api/v1/interactions/by_category?category=gap_explanation
```

### List Categories

```http
GET /api/v1/interactions/categories
```

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "name": "gap_explanation",
      "display_name": "Employment Gap Explanation",
      "count": 5
    },
    {...}
  ],
  "total": 25
}
```

**Available Categories:**
- `gap_explanation`
- `career_change`
- `skill_highlight`
- `achievement_description`
- `weakness_improvement`
- `salary_expectation`
- `relocation_preference`
- `availability`
- `work_style`
- `motivation`
- `other`

### Search Interactions

Search for similar questions and get cached answer.

```http
GET /api/v1/interactions/search?q=employment gap
```

**Response:** `200 OK`
```json
{
  "query": "employment gap",
  "interactions": [...],
  "cached_answer": "I took time off to care for family",
  "found_cache": true
}
```

### Get Statistics

```http
GET /api/v1/interactions/stats
```

### Get Popular by Category

```http
GET /api/v1/interactions/popular/gap_explanation
```

---

## 📊 Dashboard Endpoints

### Get Dashboard

Get complete dashboard overview.

```http
GET /api/v1/dashboard
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscription_tier": "free",
    "remaining_optimizations": 5
  },
  "cvs": {
    "total": 5,
    "optimized": 3,
    "recent": [...]
  },
  "job_descriptions": {
    "total": 4,
    "recent": [...]
  },
  "optimizations": {
    "total": 10,
    "by_status": {...},
    "recent": [...]
  },
  "interactions": {
    "total": 15,
    "by_category": [...],
    "frequently_used": [...]
  },
  "recent_activity": [...]
}
```

### Get Statistics

Get detailed statistics.

```http
GET /api/v1/dashboard/stats
```

**Response:** `200 OK`
```json
{
  "overview": {
    "total_cvs": 5,
    "total_jobs": 4,
    "total_optimizations": 10,
    "completed_optimizations": 8
  },
  "subscription": {
    "tier": "free",
    "remaining_optimizations": 0
  },
  "performance": {
    "average_match_score": 82.5,
    "highest_match_score": 95,
    "optimizations_this_month": 10
  },
  "match_distribution": {
    "high": 5,
    "medium": 3,
    "low": 0
  }
}
```

---

## 🔌 WebSockets

Real-time updates for optimization progress using ActionCable.

### Connection

```javascript
// Connect to WebSocket with JWT token
const cable = ActionCable.createConsumer(
  `ws://localhost:3000/cable?token=${jwtToken}`
);
```

### Subscribe to Optimization

```javascript
const subscription = cable.subscriptions.create(
  { 
    channel: 'OptimizationChannel', 
    id: optimizationId 
  },
  {
    received(data) {
      // Handle real-time updates
      console.log('Status:', data.status);
      console.log('Progress:', data.completion_percentage);
      console.log('Match Score:', data.match_score);
    },
    
    connected() {
      console.log('Connected to optimization channel');
    },
    
    disconnected() {
      console.log('Disconnected');
    },
    
    rejected() {
      console.error('Subscription rejected (unauthorized)');
    }
  }
);
```

### Message Format

```json
{
  "id": 1,
  "status": "processing",
  "completion_percentage": 50,
  "match_score": null,
  "progress": 50,
  "updated_at": "2026-03-11T10:00:30Z"
}
```

**Status Values:**
- `pending` - Waiting in queue
- `processing` - AI is analyzing
- `completed` - Finished successfully
- `failed` - Error occurred
- `cancelled` - User cancelled

---

## ❌ Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human readable message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not allowed (e.g., rate limit exceeded)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Errors

**Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource"
}
```

**Validation Failed:**
```json
{
  "error": "Validation Failed",
  "message": "Unable to create account",
  "errors": [
    "Email has already been taken",
    "Password is too short (minimum is 6 characters)"
  ]
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached your monthly limit of 5 optimizations",
  "remaining": 0,
  "upgrade_url": "/pricing"
}
```

---

## 🚀 Rate Limits

### Free Tier

- **5 optimizations per month**
- After limit: Returns `429 Too Many Requests`
- Check `user.remaining_optimizations` in responses

### Pro Tier

- **Unlimited optimizations**
- `user.has_pro_access` returns `true`

---

## 📝 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 20, max: 100)

**Response Meta:**
```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "per_page": 20
  }
}
```

---

## 🔗 Complete Example Workflow

```bash
# 1. Signup
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass123","password_confirmation":"pass123"}'

# 2. Login and save token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"pass123"}' | jq -r '.token')

# 3. Create CV
CV_ID=$(curl -X POST http://localhost:3000/api/v1/cvs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cv":{"original_text":"John Doe\nSoftware Engineer...","language":"en"}}' | jq -r '.cv.id')

# 4. Create Job Description
JOB_ID=$(curl -X POST http://localhost:3000/api/v1/job_descriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_description":{"title":"Senior Engineer","content":"Looking for...","company_name":"TechCorp"}}' | jq -r '.job_description.id')

# 5. Start Optimization
OPT_ID=$(curl -X POST http://localhost:3000/api/v1/optimizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"optimization\":{\"cv_id\":$CV_ID,\"job_description_id\":$JOB_ID}}" | jq -r '.optimization.id')

# 6. Check Status
curl -X GET "http://localhost:3000/api/v1/optimizations/$OPT_ID/status" \
  -H "Authorization: Bearer $TOKEN"

# 7. Get Dashboard
curl -X GET http://localhost:3000/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Additional Resources

- **ActionCable Integration:** See `ACTIONCABLE_INTEGRATION.md`
- **Phase 2 Guide:** See `PHASE2_GUIDE.md`
- **Progress Tracking:** See `PROGRESS.md`

---

**API Version:** 2.0  
**Last Updated:** March 12, 2026  
**Support:** For issues, check server logs: `docker-compose logs api`
