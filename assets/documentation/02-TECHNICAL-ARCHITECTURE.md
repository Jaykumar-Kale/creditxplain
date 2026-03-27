# 🏗️ CreditXplain - Technical Architecture

## Overview

CreditXplain is a **full-stack microservices application** with three independent services communicating via REST APIs. The architecture enables scalability, independent deployment, and flexible technology choices per service.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React 18 + Vite + Tailwind CSS (Port 5173)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Authentication (JWT storage)                          │    │
│  │ • Form UI (Manual 4-step form)                          │    │
│  │ • Excel Upload (CSV/XLSX)                               │    │
│  │ • Dashboard (History, Analytics)                        │    │
│  │ • Bias Analysis Charts                                  │    │
│  │ • PDF Report Generation                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
                            │ JWT Authorization Header
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                           │
│  Node.js + Express (Port 5000)                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Routes:                                                  │    │
│  │ • POST /auth/register  → Validation, Hash, DB Store     │    │
│  │ • POST /auth/login     → Verify Hash, Generate JWT      │    │
│  │ • POST /credit/apply   → Scoring Engine Call            │    │
│  │ • POST /credit/apply-upload → Bulk CSV/XLSX Processing │    │
│  │ • GET /credit/history  → Fetch User Applications        │    │
│  │ • GET /credit/report/:id → PDF Generation               │    │
│  │ • GET /analytics/* → Bias Analysis & Stats              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Middleware:                                                      │
│  • JWT Authentication (verify token, extract userId)             │
│  • Error Handling (validation, DB errors)                        │
│  • Logging (requests, responses)                                 │
└───────────────────────┬─────────────────────────────┬───────────┘
                        │                             │
                        │ (Try Primary)               │ (Write/Read)
                        ▼                             ▼
            ┌─────────────────────────┐   ┌──────────────────────┐
            │   ML SERVICE            │   │   MONGODB DATABASE   │
            │ Python + FastAPI        │   │                      │
            │ (Port 8000)             │   │ Collections:         │
            │                         │   │ • users              │
            │ /predict - ML Scoring   │   │ • applications       │
            │ /health - Service Check │   │ • analytics_cache    │
            │                         │   │                      │
            └─────────────────────────┘   └──────────────────────┘
                        │
                        │ (Fallback to JS scorer if ML unavailable)
                        │
                        ▼
            ┌─────────────────────────┐
            │   JS FALLBACK SCORER    │
            │ (mlEngine.js)           │
            │                         │
            │ Deterministic scoring   │
            │ Same logic as Python    │
            └─────────────────────────┘
```

---

## Service Components

### 1. Frontend Service (Client)

**Technology Stack:**
- React 18 (UI framework)
- Vite (build tool, dev server)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Hook Form (form state management)
- Axios (HTTP client)

**Key Features:**
- **Authentication**: JWT token stored in localStorage
- **Forms**: Multi-step credit application form
- **File Upload**: CSV/XLSX support with validation
- **Analytics**: Charts and statistics dashboard
- **Bias Analysis**: Visual bias metrics for protected attributes
- **Reports**: PDF generation from predictions

**Directory Structure:**
```
client/
├── src/
│   ├── components/
│   │   ├── CreditForm.jsx        ← Multi-step form + upload
│   │   ├── ScoreResult.jsx       ← Result display
│   │   ├── BiasDashboard.jsx     ← Analytics charts
│   │   ├── ReportDownload.jsx    ← PDF generation
│   │   └── [other components]
│   ├── pages/
│   │   ├── Home.jsx              ← Landing page
│   │   ├── Dashboard.jsx         ← Main app
│   │   ├── History.jsx           ← Application history
│   │   ├── Login.jsx             ← Auth page
│   │   └── About.jsx             ← Info page
│   ├── context/
│   │   └── ThemeContext.jsx      ← Dark mode toggle
│   ├── utils/
│   │   └── api.js                ← Axios instance with interceptors
│   └── App.jsx                   ← Router setup
├── tailwind.config.js            ← Styling config
├── vite.config.js                ← Build config
└── package.json
```

**HTTP Client Pattern (api.js):**
```javascript
// Automatically injects JWT token
// Handles 401 responses (token expired)
// Supports both hardcoded and env var API URLs
const baseURL = import.meta.env.VITE_API_URL || '/api';
```

---

### 2. Backend API Service

**Technology Stack:**
- Node.js (runtime)
- Express.js (web framework)
- MongoDB driver (database)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- multer (file uploads)
- pdfkit (PDF generation)

**Core Routes:**

#### Authentication (`/auth`)
```
POST /auth/register
  Input: { email, password, name }
  Output: { token, user }
  Process: Hash password, create user, return JWT

POST /auth/login
  Input: { email, password }
  Output: { token, user }
  Process: Verify password, generate JWT
```

#### Credit Scoring (`/credit`)
```
POST /credit/apply
  Input: { age, income, loanAmount, ... }
  Output: { 
    score: 324,
    decision: 'rejected',
    riskLevel: 'very_high',
    explanation: "..."
  }
  Process: 
    1. Validate input
    2. Call ML service
    3. Fallback to JS scorer if ML fails
    4. Store in DB
    5. Return result with explanation

POST /credit/apply-upload
  Input: FormData with CSV/XLSX file
  Output: { firstResult, processedRows, successfulPredictions, skipped }
  Process:
    1. Parse CSV/XLSX
    2. Validate each row
    3. Score each row via ML or fallback
    4. Bulk insert to DB
    5. Return summary

GET /credit/history?page=1&limit=10
  Output: { applications: [...], total, pages }
  Process: Fetch user's applications with pagination

GET /credit/report/:id
  Output: PDF file
  Process: Generate styled PDF from DB record
```

#### Analytics (`/analytics`)
```
GET /analytics/stats
  Output: { total, approved, rejected, avgScore, approvalRate }

GET /analytics/bias/:attribute
  Output: { metrics: {...}, distribution: {...} }
  Process: Analyze fairness across protected attributes (gender, etc.)
```

**Database Models:**

```javascript
// User
{
  _id: ObjectId,
  email: String,
  password: String (bcrypt hash),
  name: String,
  createdAt: Date,
  updatedAt: Date
}

// Application
{
  _id: ObjectId,
  userId: ObjectId (ref User),
  age: Number,
  income: Number,
  employmentYears: Number,
  loanAmount: Number,
  existingDebts: Number,
  creditHistory: Number,
  numberOfDependents: Number,
  monthlyExpenses: Number,
  savingsBalance: Number,
  educationLevel: String,
  maritalStatus: String,
  homeOwnership: String,
  loanPurpose: String,
  gender: String,  // optional, for bias analysis
  score: Number,
  decision: String ('approved' | 'rejected'),
  riskLevel: String ('very_low' | 'low' | 'medium' | 'high' | 'very_high'),
  explanation: String,
  createdAt: Date
}
```

---

### 3. ML Service

**Technology Stack:**
- Python 3.8+
- FastAPI (REST framework)
- scikit-learn (ML models)
- pandas (data processing)
- joblib (model serialization)

**Endpoints:**

```
GET /health
  Output: { status: "ok", modelLoaded: true, artifact: "path/to/model" }

POST /predict
  Input: {
    age, income, employmentYears, loanAmount, 
    existingDebts, creditHistory, numberOfDependents,
    monthlyExpenses, savingsBalance, 
    educationLevel, maritalStatus, homeOwnership, loanPurpose
  }
  Output: { 
    score: 324,
    prediction: 0 or 1,  // 0=non-default, 1=default
    probability: 0.87,
    modelVersion: "1.0"
  }
```

**Model Pipeline:**

```python
# Training Process
1. Load CSV data
2. Encode categorical variables (OneHotEncoder)
3. Scale numerical features (StandardScaler)
4. Train RandomForest classifier (on defaultRisk target)
5. Save pipeline to joblib artifact

# Prediction Process
1. Receive JSON input
2. Convert to DataFrame
3. Apply same encoding/scaling pipeline
4. Use model to predict probability
5. Apply business logic:
   if probability > 0.5: decision = 'rejected', riskLevel = 'very_high'
   if probability > 0.3: decision = 'rejected', riskLevel = 'high'
   else: decision = 'approved', riskLevel = 'low' to 'very_low'
```

**Fallback Mechanism:**

```javascript
// Backend fallback logic (mlEngine.js)
if (mlServiceDown) {
  // Use deterministic JavaScript scorer
  // Applies same business rules for consistency
  score = calculateScoreJS(applicationData);
} else {
  // Try ML service first
  score = await callMLService(applicationData);
}
```

---

## Data Flow - Complete Request Cycle

### Manual Application Flow

```
1. User fills 4-step form (browser)
   ↓
2. POST /credit/apply with form data (frontend)
   ↓
3. Backend validates input (Express middleware)
   ↓
4. Backend normalizes data (applicantNormalizer.js)
   ↓
5. Try: Call ML service /predict
   Catch: Use JS fallback scorer
   ↓
6. Backend stores result in MongoDB
   ↓
7. Backend calls /analytics/calculateBias (async)
   ↓
8. Return result to frontend
   ↓
9. Frontend displays result with explanation (ScoreResult.jsx)
```

### Bulk Upload Flow

```
1. User selects CSV/XLSX file (browser)
   ↓
2. POST /credit/apply-upload with FormData (frontend)
   ↓
3. Backend parses file (multer)
   ↓
4. For each row:
   - Validate data
   - Normalize (applicantNormalizer.js)
   - Score via ML or fallback
   - Prepare for DB insert
   ↓
5. Bulk insert to MongoDB
   ↓
6. Return summary (processedRows, successful, skipped)
   ↓
7. Frontend shows summary message
```

---

## Integration Points

### Frontend ↔ Backend
- **Protocol**: HTTP/REST
- **Authentication**: JWT in Authorization header
- **Base URL**: Configurable via `VITE_API_URL` env var
- **Error Handling**: Axios interceptors handle 401/500 errors

### Backend ↔ ML Service
- **Protocol**: HTTP/REST
- **Timeout**: 5 seconds (then fallback)
- **Health Check**: Before each request
- **Fallback**: JS scorer if unavailable

### Backend ↔ Database
- **Driver**: MongoDB native driver
- **Connection**: MongoDB Atlas (cloud)
- **Retry**: 3 automatic retries on connection error
- **Indexes**: On userId, createdAt for performance

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│            PRODUCTION DEPLOYMENT                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Vercel             Render             MongoDB Atlas      │
│  ┌──────────┐   ┌──────────┐        ┌──────────┐        │
│  │ Frontend │   │ Backend  │        │ Database │        │
│  │ React    │   │ Node.js  │        │ Cluster  │        │
│  │ 5173→443 │◄─►│ 5000    │◄──────►│          │        │
│  └──────────┘   └──────────┘        └──────────┘        │
│       ▲              ▲                                    │
│       │              │                                    │
│  Environment:   Environment:      Environment:           │
│  VITE_API_URL  MONGO_URI          AUTO-created           │
│               JWT_SECRET           (connection string)   │
│               ML_SERVICE_URL                             │
│               CLIENT_URL                                 │
│                │                                         │
│                │                                         │
│                ▼                                         │
│           ┌──────────┐                                   │
│           │ ML Service│                                  │
│           │ Render    │                                  │
│           │ Port 8000 │                                  │
│           └──────────┘                                   │
│           Environment:                                   │
│           (Python path configured)                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Database
- **Index on userId + createdAt**: Fast history queries
- **Pagination**: Limit 10 records per request
- **Connection pooling**: Reuse connections

### ML Service
- **Health check cache**: 30-second TTL (reduce checks)
- **Request timeout**: 5 seconds (fast fallback)
- **Model loaded on startup**: No lazy loading overhead

### Backend
- **Request validation**: Early rejection of invalid data
- **Normalizer**: Standardizes data types (no type coercion issues)
- **Async operations**: Analytics calculations don't block response

### Frontend
- **Code splitting**: Routes load on-demand (Vite)
- **Component memoization**: Prevent unnecessary re-renders
- **API request caching**: Similar requests cached (Axios)

---

## Security Architecture

### Authentication Layer
```javascript
// JWT Pattern
1. User logs in → Backend generates JWT with userId
2. Frontend stores JWT in localStorage
3. Each request: Authorization: Bearer <jwt>
4. Backend middleware verifies JWT signature
5. Extract userId from token → Use for DB queries
```

### Authorization
```
- Public endpoints: /auth/register, /auth/login
- Protected endpoints: /credit/*, /analytics/*, /auth/logout
- Middleware: Verify JWT before route handler
```

### Data Protection
```
- Passwords: bcrypt hash (10 salt rounds)
- Sensitive fields: Not exposed in API responses
- File uploads: Validated (CSV/XLSX only)
- Database: SSL connection to MongoDB Atlas
```

---

## Scaling Considerations

### Horizontal Scaling
- **Stateless backend**: Each instance can handle any request
- **Database scaling**: MongoDB handles read replicas
- **Load balancer**: Can distribute across backend instances

### Features Supporting Scale
- **Bulk upload**: Processes multiple records in single request
- **Pagination**: Prevents loading entire dataset
- **Async analytics**: Doesn't block user requests
- **ML service isolation**: Can scale independently

---

## Technology Decisions

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend Framework | React 18 | Reactive UI, large ecosystem, developer experience |
| Build Tool | Vite | Fast development server, optimized bundles |
| Backend Framework | Express.js | Lightweight, flexible, large middleware ecosystem |
| Database | MongoDB | Flexible schema, Atlas managed hosting, scalable |
| ML Framework | scikit-learn | Easy to understand, sufficient for classification, joblib serialization |
| Auth | JWT | Stateless, scalable, frontend-friendly |
| Password Hashing | bcrypt | Industry standard, slow hash prevents brute force |

---

## Error Handling Strategy

### Frontend
```javascript
// Axios interceptor catches errors
- 400: Bad request → Show validation error message
- 401: Unauthorized → Redirect to login
- 500: Server error → Show generic error + retry button
- Network error → Offline message
```

### Backend
```javascript
// Express error handler
- Validation: Return 400 with field errors
- Auth: Return 401 with message
- Database: Return 500 with generic message (log actual error)
- ML timeout: Log error, use fallback scorer
```

### ML Service
```python
# FastAPI exception handlers
- Invalid input: Return 422 (Unprocessable Entity)
- Model not loaded: Return 503 (Service Unavailable)
- Any exception: Return 500 with generic message
```

---

## Monitoring & Observability

### Health Checks
```
- Backend: GET /health → Should return 200 within 1s
- ML Service: GET /health → Should return 200 within 500ms
- Database: Implicit (error on first query attempt)
```

### Logging Points
- Authentication events (login success/failure)
- Score calculations (input data, result, ML vs fallback)
- File uploads (rows processed, errors)
- Analytics calculations (what attributes analyzed)

### Error Capture
- Frontend: Log to browser console + send to monitoring service
- Backend: Log to stdout (captured by deployment platform)
- ML: Log to stdout + model training metrics

---

## Next Steps for Production

1. **Add API request logging** (all requests → ELK stack or similar)
2. **Add error tracking** (Sentry or similar)
3. **Add rate limiting** (prevent abuse)
4. **Add CORS configuration** (whitelist production domains)
5. **Add request validation schema** (stronger validation)
6. **Add database backups** (automated MongoDB backups)
7. **Add CDN** (cache static frontend assets)
8. **Add API versioning** (/v1/credit/apply, /v2/credit/apply)

---

**Last Updated:** March 27, 2026 | **Status:** Production-Ready Architecture
