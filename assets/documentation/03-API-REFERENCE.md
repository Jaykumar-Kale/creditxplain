# 📚 CreditXplain - Complete API Reference

## Base URL

**Development:**
```
http://localhost:5000
```

**Production:**
```
https://creditxplain-api.onrender.com
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints Overview

| Method | Endpoint | Public | Description |
|--------|----------|--------|-------------|
| **POST** | `/auth/register` | ✅ | Register new user |
| **POST** | `/auth/login` | ✅ | Login & get JWT |
| **POST** | `/credit/apply` | ❌ | Single application |
| **POST** | `/credit/apply-upload` | ❌ | Bulk CSV/XLSX upload |
| **GET** | `/credit/history` | ❌ | Get user's applications |
| **GET** | `/credit/report/:id` | ❌ | Generate PDF report |
| **GET** | `/analytics/stats` | ❌ | Overall statistics |
| **GET** | `/analytics/bias/:attribute` | ❌ | Bias analysis |
| **GET** | `/health` | ✅ | Service health check |

---

## 1. Authentication Endpoints

### POST `/auth/register`

Register a new user account.

**Request:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| email | String | ✅ | Valid email format, unique |
| password | String | ✅ | Min 6 characters |
| name | String | ✅ | Non-empty string |

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
```json
// 400 - Email already exists
{ "error": "Email already registered" }

// 400 - Invalid email format
{ "error": "Invalid email format" }

// 400 - Password too short
{ "error": "Password must be at least 6 characters" }
```

---

### POST `/auth/login`

Login with email and password.

**Request:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| email | String | ✅ | Valid email format |
| password | String | ✅ | Non-empty |

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
```json
// 400 - Invalid credentials
{ "error": "Invalid email or password" }

// 404 - User not found
{ "error": "User not found" }
```

---

## 2. Credit Application Endpoints

### POST `/credit/apply`

Submit a single credit application.

**Request:**
```bash
curl -X POST http://localhost:5000/credit/apply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "income": 750000,
    "employmentYears": 5,
    "loanAmount": 500000,
    "existingDebts": 8000,
    "creditHistory": 8,
    "numberOfDependents": 2,
    "monthlyExpenses": 30000,
    "savingsBalance": 200000,
    "educationLevel": "bachelor",
    "maritalStatus": "married",
    "homeOwnership": "own",
    "loanPurpose": "home",
    "gender": "male"
  }'
```

**Parameters:**
| Field | Type | Range | Required | 
|-------|------|-------|----------|
| age | Number | 18-80 | ✅ |
| income | Number | 0+ | ✅ |
| employmentYears | Number | 0+ | ✅ |
| loanAmount | Number | 1000+ | ✅ |
| existingDebts | Number | 0+ | ✅ |
| creditHistory | Number | 0-10 | ✅ |
| numberOfDependents | Number | 0+ | ✅ |
| monthlyExpenses | Number | 0+ | ✅ |
| savingsBalance | Number | 0+ | ✅ |
| educationLevel | String | See options | ✅ |
| maritalStatus | String | See options | ✅ |
| homeOwnership | String | See options | ✅ |
| loanPurpose | String | See options | ✅ |
| gender | String | optional | ❌ |

**Valid Options:**
- educationLevel: `high_school`, `bachelor`, `master`, `phd`, `other`
- maritalStatus: `single`, `married`, `divorced`, `widowed`
- homeOwnership: `rent`, `own`, `mortgage`, `other`
- loanPurpose: `home`, `car`, `education`, `business`, `medical`, `personal`, `other`
- gender: `male`, `female`, `other`, `prefer_not_to_say`

**Response (200 OK):**
```json
{
  "result": {
    "id": "507f1f77bcf86cd799439012",
    "score": 675,
    "decision": "approved",
    "riskLevel": "low",
    "explanation": "Your credit profile shows strong financial health with stable income and good debt management.",
    "breakdown": {
      "incomeScore": 90,
      "debtScore": 85,
      "creditHistoryScore": 88,
      "employmentScore": 75
    },
    "recommendedLoanAmount": 500000,
    "interestRateRange": "7.5% - 9.0%",
    "createdAt": "2024-03-27T10:30:00Z"
  }
}
```

**Score Ranges:**
- **0-300**: Very High Risk (Rejected)
- **300-450**: High Risk (Usually Rejected)
- **450-600**: Medium Risk (Manual Review)
- **600-750**: Low Risk (Approved)
- **750+**: Very Low Risk (Fast Track Approved)

**Risk Levels:**
- very_low: Score 750+
- low: Score 600-750
- medium: Score 450-600
- high: Score 300-450
- very_high: Score 0-300

**Error Responses:**
```json
// 400 - Validation error
{
  "error": "Validation failed",
  "details": {
    "age": "Age must be between 18 and 80"
  }
}

// 401 - Unauthorized
{ "error": "Unauthorized. Please login." }

// 500 - Server error
{ "error": "Failed to calculate score" }
```

---

### POST `/credit/apply-upload`

Submit multiple applications via CSV/XLSX file.

**Request:**
```bash
curl -X POST http://localhost:5000/credit/apply-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@applications.csv"
```

**File Format:**
CSV must have these columns (order doesn't matter):
```csv
age,income,employmentYears,loanAmount,existingDebts,creditHistory,numberOfDependents,monthlyExpenses,savingsBalance,educationLevel,maritalStatus,homeOwnership,loanPurpose,gender
35,750000,5,500000,8000,8,2,30000,200000,bachelor,married,own,home,male
42,900000,10,750000,12000,9,3,35000,350000,master,married,own,business,male
```

**XLSX Format:**
Same columns, one row per applicant. Download template from assets/demo folder.

**Response (200 OK):**
```json
{
  "firstResult": {
    "score": 675,
    "decision": "approved",
    "riskLevel": "low",
    "explanation": "..."
  },
  "processedRows": 100,
  "successfulPredictions": 98,
  "skipped": [
    { "rowNumber": 5, "reason": "Invalid age value" },
    { "rowNumber": 45, "reason": "Loan amount too low" }
  ]
}
```

**Error Responses:**
```json
// 400 - No file provided
{ "error": "Please choose a CSV/XLSX file first" }

// 400 - Wrong file format
{ "error": "Only CSV and XLSX files are supported" }

// 400 - File too large
{ "error": "File size must be less than 10MB" }

// 400 - Missing required columns
{ "error": "File missing required columns: age, income, ..." }

// 401 - Unauthorized
{ "error": "Unauthorized. Please login." }
```

---

### GET `/credit/history`

Get user's application history.

**Request:**
```bash
curl -X GET "http://localhost:5000/credit/history?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number (starts at 1) |
| limit | Number | 10 | Records per page (max 100) |

**Response (200 OK):**
```json
{
  "applications": [
    {
      "id": "507f1f77bcf86cd799439012",
      "age": 35,
      "income": 750000,
      "loanAmount": 500000,
      "score": 675,
      "decision": "approved",
      "riskLevel": "low",
      "createdAt": "2024-03-27T10:30:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "age": 42,
      "income": 900000,
      "loanAmount": 750000,
      "score": 720,
      "decision": "approved",
      "riskLevel": "very_low",
      "createdAt": "2024-03-26T14:15:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

**Error Responses:**
```json
// 401 - Unauthorized
{ "error": "Unauthorized. Please login." }

// 500 - Server error
{ "error": "Failed to fetch history" }
```

---

### GET `/credit/report/:id`

Generate and download PDF report for an application.

**Request:**
```bash
curl -X GET http://localhost:5000/credit/report/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>" \
  --output report.pdf
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Application ID (from POST /credit/apply response) |

**Response (200 OK):**
Binary PDF file with:
- Application details
- Credit score breakdown
- Risk assessment
- Recommendations
- Generated timestamp

**Error Responses:**
```json
// 404 - Application not found
{ "error": "Application not found" }

// 401 - Unauthorized (not your application)
{ "error": "You don't have access to this application" }

// 500 - PDF generation failed
{ "error": "Failed to generate report" }
```

---

## 3. Analytics Endpoints

### GET `/analytics/stats`

Get overall statistics.

**Request:**
```bash
curl -X GET http://localhost:5000/analytics/stats \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "total": 150,
  "approved": 105,
  "rejected": 45,
  "avgScore": 652.3,
  "approvalRate": 0.70,
  "avgLoanAmount": 525000,
  "riskDistribution": {
    "very_low": 35,
    "low": 45,
    "medium": 40,
    "high": 25,
    "very_high": 5
  }
}
```

---

### GET `/analytics/bias/:attribute`

Analyze bias for a specific protected attribute.

**Request:**
```bash
curl -X GET http://localhost:5000/analytics/bias/gender \
  -H "Authorization: Bearer <token>"
```

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| attribute | String | `gender`, `maritalStatus`, `educationLevel` |

**Response (200 OK):**
```json
{
  "attribute": "gender",
  "metrics": {
    "male": {
      "total": 80,
      "approved": 60,
      "approvalRate": 0.75,
      "avgScore": 665,
      "rejectionRate": 0.25
    },
    "female": {
      "total": 70,
      "approved": 45,
      "approvalRate": 0.64,
      "avgScore": 635,
      "rejectionRate": 0.36
    }
  },
  "disparityIndex": 1.17,
  "recommendation": "Potential bias detected. Review scoring criteria for gender sensitivity.",
  "trend": "Disparities are increasing over time"
}
```

**Interpretation:**
- **Disparity Index**: Ratio of approval rates (higher = more disparity)
- Disparity Index > 1.25 may indicate bias (80% rule)
- Recommendations based on statistical significance

---

## 4. Health Check Endpoint

### GET `/health`

Check backend service health.

**Request:**
```bash
curl http://localhost:5000/health
```

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2024-03-27T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "mlService": "connected"
}
```

---

## Error Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing/invalid JWT token |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Cannot process entity (ML validation failed) |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily down |

---

## Request/Response Pattern

### Request Headers
```
Authorization: Bearer <token>        # Required for protected endpoints
Content-Type: application/json       # For JSON requests
Accept: application/json             # Expected response format
```

### Response Headers
```
Content-Type: application/json       # Always JSON (except PDF)
X-RateLimit-Limit: 100              # Requests allowed
X-RateLimit-Remaining: 95           # Requests left
X-RateLimit-Reset: 1711510200       # When limit resets (Unix timestamp)
```

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error for this field"
  },
  "timestamp": "2024-03-27T10:30:00Z"
}
```

---

## Rate Limiting

- **Free tier**: 100 requests per hour
- **Pro tier**: 1000 requests per hour
- **Enterprise**: Unlimited

Rate limit headers included in all responses.

---

## SDK Examples

### JavaScript/Node.js
```javascript
import api from './utils/api';

// Register
const registerRes = await api.post('/auth/register', {
  email, password, name
});

// Login
const loginRes = await api.post('/auth/login', { email, password });

// Apply for credit
const applyRes = await api.post('/credit/apply', applicationData);

// Get history
const historyRes = await api.get('/credit/history?page=1&limit=10');

// Get stats
const statsRes = await api.get('/analytics/stats');
```

### cURL
```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass","name":"User"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' | jq -r '.token')

# Apply
curl -X POST http://localhost:5000/credit/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"age":35,"income":750000,...}'
```

### Python
```python
import requests

BASE_URL = "http://localhost:5000"

# Register
res = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "user@example.com",
    "password": "pass",
    "name": "User"
})
token = res.json()['token']

# Apply
headers = {"Authorization": f"Bearer {token}"}
res = requests.post(f"{BASE_URL}/credit/apply", json={
    "age": 35,
    "income": 750000,
    ...
}, headers=headers)
```

---

## Testing API Endpoints

**Quick test script:**
```bash
# Run all tests
node assets/testing/smoke-tests/QUICK_TEST.js

# Detailed tests
node assets/testing/feature-tests/DEMO_TEST.js
```

---

**Last Updated:** March 27, 2026 | **Version:** 1.0
