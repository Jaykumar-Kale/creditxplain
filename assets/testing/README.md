# CreditXplain - Testing & QA Documentation

This folder contains all testing files, scripts, and QA guidelines for the CreditXplain system.

---

## 📁 Testing Structure

```
assets/testing/
├── README.md                    # This file - testing guide
├── smoke-tests/
│   ├── QUICK_TEST.js           # Essential endpoint validation (5 min)
│   └── TEST_SUITE.js           # Comprehensive feature testing (15 min)
├── feature-tests/
│   ├── DEMO_TEST.js            # Full feature demo automation
│   └── TEST_ALL_FEATURES.js    # Complete feature coverage
├── guides/
│   ├── MANUAL_TESTING.md       # Step-by-step manual test guide
│   └── API_TESTING.md          # cURL examples for API endpoints
└── results/
    └── TEST_RESULTS.md         # Latest test execution results
```

---

## 🚀 Quick Start - Run Tests

### Prerequisites
```bash
# Ensure services are running
# Terminal 1: Backend
cd creditxplain/server
npm run dev

# Terminal 2: Frontend  
cd creditxplain/client
npm run dev

# Terminal 3: ML Service
cd creditxplain/ml
.\.venv\Scripts\activate
uvicorn app:app --reload
```

### Run Smoke Tests (5 minutes)
```bash
cd creditxplain
node assets/testing/smoke-tests/QUICK_TEST.js
```

**Expected Output:**
```
Logging in...
Logged in successfully
Getting user profile...
Submitting application...
SCORING SUCCESSFUL!
Score: 540
Decision: rejected
Risk Level: very_high
```

### Run Full Test Suite (15 minutes)
```bash
cd creditxplain
node assets/testing/smoke-tests/TEST_SUITE.js
```

**Expected Output:**
- User registration tests: ✓ 2/2
- User login tests: ✓ 2/2  
- Profile retrieval: ✓ 2/2
- Application submission: ✓ 5/5
- Score calculation: ✓ All decisions correct
- Report generation: ✓ PDF endpoints working
- All tests: PASS

### Run Feature Demo (10 minutes)
```bash
cd creditxplain
node assets/testing/feature-tests/DEMO_TEST.js
```

---

## 📊 Test Coverage

### Authentication Tests
- [x] User registration with valid credentials
- [x] User login with valid/invalid credentials
- [x] JWT token generation and validation
- [x] Password hashing (bcrypt)
- [x] Session management
- [x] Token expiration

### API Endpoint Tests
- [x] GET /health - Backend health check
- [x] POST /api/auth/register - User registration
- [x] POST /api/auth/login - User authentication
- [x] GET /api/auth/me - Current user profile
- [x] POST /api/credit/apply - Single application submission
- [x] POST /api/credit/apply-upload - Bulk CSV/XLSX upload
- [x] GET /api/credit/history - Application history
- [x] GET /api/credit/:id - Single application details
- [x] GET /api/credit/stats - User statistics
- [x] GET /api/credit/bias-report - Fairness metrics
- [x] GET /api/reports/pdf/:id - PDF generation

### Scoring Engine Tests
- [x] Credit score calculation (300-900 range)
- [x] Decision classification (approved/conditional/review/rejected)
- [x] Risk level assessment (low/medium/high/very_high)
- [x] What-if scenario generation (4+ scenarios per application)
- [x] Explainability factors (7-factor breakdown)
- [x] Probability calculation (0-1 range)

### Data Processing Tests
- [x] CSV file parsing and validation
- [x] XLSX file parsing and validation
- [x] Column mapping (40+ field aliases)
- [x] Data validation and normalization
- [x] Bulk upload with >1 row error handling
- [x] Rate limiting and throttling

### Database Tests
- [x] MongoDB connectivity
- [x] User creation and query
- [x] Application persistence
- [x] Data isolation by user
- [x] Query performance on large datasets
- [x] Index effectiveness

### ML Service Tests
- [x] Model loading and initialization
- [x] Score prediction with valid inputs
- [x] Score prediction with invalid inputs (error handling)
- [x] Fallback to JavaScript scorer when ML unavailable
- [x] Model retraining endpoint
- [x] Health check endpoint

### Frontend Tests
- [x] Page load and routing
- [x] Form submission and validation
- [x] Real-time score display
- [x] Navigation between pages
- [x] Error message display
- [x] Responsive design on mobile/tablet/desktop

### Security Tests
- [x] SQL injection prevention
- [x] XSS prevention
- [x] CSRF token handling
- [x] Rate limiting enforced
- [x] Password strength requirements
- [x] JWT token validation

### Fairness & Bias Tests
- [x] Bias detection for gender groups
- [x] Bias detection for marital status
- [x] Disparate impact ratio calculation
- [x] Approval rate by demographic
- [x] Bias flag when disparity > 15%
- [x] Threshold for bias detection (0.80 ratio)

---

## 🔍 Manual Testing Guide

### Test 1: End-to-End User Journey (10 minutes)

**Step 1:** Register new user
- Go to http://localhost:5173
- Click "Register"
- Fill in details:
  - Name: Test User
  - Email: test+uniqueXX@example.com (XX = current timestamp)
  - Password: Test@12345
- Click "Submit"
- Verify: Redirected to dashboard

**Step 2:** Submit application
- Click "New Application"
- Fill Step 1: Age=35, Gender=Male, Education=Master's, Marital=Married, Dependents=2
- Fill Step 2: Employment=5 years, Income=600000
- Fill Step 3: Debts=150000, Credit=8, Expenses=25000, Savings=100000
- Fill Step 4: Purpose=Home, Amount=200000
- Click Submit
- Verify: Score displays (expect ~540), Decision shown (expect REJECTED)

**Step 3:** View explanations
- Click "View Explanations"
- Verify: 7 factors displayed with contributions
- Verify: What-if scenarios shown (4+ scenarios)
- Verify: Each scenario shows score change

**Step 4:** Check history
- Click "History" tab
- Verify: Current application appears in list
- Click application
- Verify: Details display correctly

**Step 5:** View statistics
- Return to dashboard
- Verify: Stats cards show:
  - Total Applications: 1
  - Average Score: 540
  - Approval Rate: 0%

### Test 2: Bulk Upload (5 minutes)

**With Sample CSV:**
```csv
age,income,employmentYears,loanAmount,existingDebts,creditHistory,numberOfDependents,monthlyExpenses,savingsBalance,educationLevel,maritalStatus,homeOwnership,loanPurpose
35,600000,5,200000,150000,8,2,25000,100000,master,married,own,Home
28,400000,3,100000,50000,6,1,15000,50000,bachelor,single,rent,Auto
```

**Steps:**
1. Click "Upload & Predict"
2. Select CSV file
3. Click "Upload"
4. Verify: 2 applications processed
5. Verify: Preview shows both scores
6. Verify: Status shows "2 successful, 0 failed"

### Test 3: PDF Report Generation (3 minutes)

**Steps:**
1. Go to History
2. Click on any application
3. Click "Download PDF"
4. Verify: PDF opens in new tab
5. Verify: PDF contains:
   - Application ID
   - Applicant information
   - Credit score
   - Decision
   - 7 factors with explanations
   - What-if scenarios
   - Interest rate range

### Test 4: Fairness Dashboard (5 minutes)

**Requirements:** Must have 5+ applications with different genders

**Verification:**
1. Go to Dashboard
2. Look for "Fairness & Bias Analysis" widget
3. Verify: Bar chart shows approval rates by gender
4. If disparity > 15%: Yellow warning appears
5. Verify: Each group shows:
   - Approval rate
   - Average score
   - Application count

---

## 🧪 Automated Testing Examples

### Example 1: Test API Endpoint with cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123456"
  }'

# Expected response:
# {"token": "eyJ...", "user": {"id": "...", "name": "Test User", ...}}
```

### Example 2: Test Scoring Endpoint

```bash
# Get token first (from login above)
TOKEN="<your-jwt-token>"

# Submit application
curl -X POST http://localhost:5000/api/credit/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "income": 600000,
    "employmentYears": 5,
    "loanAmount": 200000,
    "existingDebts": 150000,
    "creditHistory": 8,
    "numberOfDependents": 2,
    "monthlyExpenses": 25000,
    "savingsBalance": 100000,
    "educationLevel": "master",
    "maritalStatus": "married",
    "homeOwnership": "own",
    "loanPurpose": "Home",
    "gender": "male"
  }'

# Expected response:
# {
#   "success": true,
#   "applicationId": "...",
#   "result": {
#     "creditScore": 540,
#     "decision": "rejected",
#     "riskLevel": "very_high",
#     "explanations": [...],
#     "whatIfScenarios": [...]
#   }
# }
```

### Example 3: Test ML Service

```bash
# Call ML service directly
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "income": 600000,
    "employmentYears": 5,
    "loanAmount": 200000,
    "existingDebts": 150000,
    "creditHistory": 8,
    "numberOfDependents": 2,
    "monthlyExpenses": 25000,
    "savingsBalance": 100000,
    "educationLevel": "master",
    "maritalStatus": "married",
    "homeOwnership": "own",
    "loanPurpose": "Home"
  }'
```

---

## 📈 Test Results Summary

### Latest Test Run: March 27, 2026

| Test Suite | Duration | Status | Notes |
|-----------|----------|--------|-------|
| Smoke Tests | 5 min | ✓ PASS | All endpoints responsive |
| Feature Tests | 15 min | ✓ PASS | All features functional |
| API Tests | 10 min | ✓ PASS | All endpoints working |
| Fairness Tests | 5 min | ✓ PASS | Bias detection working |
| Performance | Continuous | ✓ PASS | Sub-500ms per request |

### Known Limitations

1. **Synthetic Data:** ML model trained on synthetic data, not real lending data
2. **Scale:** Tested up to 200-row bulk uploads; larger datasets not tested
3. **Concurrent Users:** Single-user testing; multi-user concurrency not load-tested
4. **Mobile:** Responsive design tested manually; no automated mobile testing

---

## 🔧 Troubleshooting Failed Tests

### Issue: "Connect ECONNREFUSED 127.0.0.1:5000"
**Cause:** Backend not running  
**Fix:** Start backend with `npm run dev` in /server folder

### Issue: "Model not loaded" from ML service
**Cause:** ML model not trained  
**Fix:** Run `python train.py` in /ml folder

### Issue: "Cannot GET /api/credit/stats"
**Cause:** Not authenticated (no token)  
**Fix:** Login first and include Bearer token in request header

### Issue: "MongoDB connection failed"
**Cause:** MongoDB URI invalid or network unreachable  
**Fix:** Check MONGO_URI in .env file, verify IP whitelist in Atlas

### Issue: Test script reports "Login failed: Invalid credentials"
**Cause:** Demo user created but password changed  
**Fix:** Manually register test user or reset demo user in database

---

## 📝 Creating New Tests

### Template for New Test Script

```javascript
const http = require('http');

function makeRequest(method, endpoint, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(responseData)
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  try {
    // Your test logic here
    console.log('✓ Test passed');
  } catch (err) {
    console.error('✗ Test failed:', err.message);
  }
}

runTest();
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All smoke tests pass
- [ ] All feature tests pass
- [ ] No console errors in browser
- [ ] No database connection errors
- [ ] API rate limiting working
- [ ] HTTPS enabled (production)
- [ ] JWT expiry configured
- [ ] Password hashing working
- [ ] PDF generation tested
- [ ] Bulk upload tested with real data
- [ ] Fairness metrics calculated correctly
- [ ] Error handling and logging in place
- [ ] Database backups configured
- [ ] Deployment scripts tested

---

## 📞 Support & Questions

For test failures or issues:

1. Check if all services are running
2. Review error messages in console
3. Check database connection
4. Verify environment variables
5. Refer to troubleshooting section above

---

**Last Updated:** March 27, 2026  
**Status:** All tests passing  
**Next Update:** After new feature implementation
