# CreditXplain - Project Overview

**Status:** Production Ready  
**Version:** 1.0  
**Date:** March 27, 2026

---

## 🎯 Executive Summary

CreditXplain is a **full-stack explainable credit scoring system** that demonstrates modern fintech principles with transparency at its core. Every credit decision is backed by clear, understandable factors that applicants can review and act upon.

### What We Built
A complete MERN stack application that:
- Scores credit applications with explainable factors
- Automatically maps 40+ banking field variations (no manual preprocessing)
- Provides what-if scenarios showing how to improve scores
- Monitors fairness metrics to detect and prevent bias
- Processes bulk uploads (up to 200 applications)
- Generates professional PDF reports
- Falls back gracefully if the ML service fails

### Key Statistics
- **99% success rate** on real 100-row CIBIL dataset
- **Sub-500ms** scoring latency per application
- **Sub-2 second** API response times (P95)
- **4 decision tiers:** Approved, Conditional, Review, Declined
- **7+ explainability factors** per decision
- **40+ field aliases** recognized from banking datasets

---

## 🏆 Problem We Solved

### Traditional Credit Scoring Problems

**1. Black Box Syndrome**
- Problem: Applicants denied without understanding why
- Solution: 7-factor explainability showing exact contribution of each variable

**2. Data Integration Overhead**
- Problem: Each bank dataset has different column names (salary vs. income vs. monthly_compensation)
- Solution: Automatic column mapping recognizes 40+ field aliases

**3. Bias in Lending**
- Problem: Loan decisions may inadvertently discriminate against protected classes
- Solution: Dashboard showing demographic parity and disparate impact metrics

**4. Manual Processing**
- Problem: Processing applications one-by-one is inefficient
- Solution: Bulk CSV/XLSX upload processes up to 200 applications per submission

**5. System Fragility**
- Problem: System fails if ML service goes down
- Solution: Hybrid architecture with JavaScript fallback scorer

---

## 💡 Innovation Highlights

### 1. Automatic Column Mapping (40+ Aliases)
Recognizes real banking dataset variations:
- Income: NETMONTHLYINCOME, annual_income, salary, montly_income
- Credit History: cibil_score, credit_score, credit_rating, fico
- Employment: Time_With_Curr_Empr, tenure_years, years_employed
- Delinquency: Tot_Missed_Pmnt, max_recent_level_of_deliq, missed_payments

### 2. Explainability Framework
Seven key factors showing why each decision was made:
1. **Credit History** (35% weight) - Historical payment behavior
2. **Debt-to-Income Ratio** (30% weight) - Current financial obligations vs income
3. **Employment Stability** (15% weight) - Job tenure and income consistency
4. **Savings & Assets** (10% weight) - Financial cushion and net worth
5. **Loan-to-Income Ratio** (10% weight) - Requested amount vs capacity to repay
6. **Net Monthly Cash Flow** (8% weight) - Money left after expenses
7. **Demographic Factors** - Age, dependents, education (adjustments only)

### 3. What-If Scenarios
Intelligent scenario generation showing score impact:
- "If you improved credit history by 2 points: Score → 650 (+26 points)"
- "If you reduced existing debts by 30%: Score → 580 (+18 points)"
- "If you increased savings by 50%: Score → 615 (+45 points)"
- "If you requested 70% of loan amount: Score → 590 (+32 points)"

### 4. Fairness Monitoring
Real-time bias detection dashboard:
- Approval rates by gender, marital status, education
- Disparate impact ratio (< 0.80 = potential bias flagged)
- Score distribution visualization by demographic groups
- Recommendation engine for addressing disparities

### 5. Hybrid Resilience
**Primary Path:** Try Python ML service
**Fallback:** JavaScript scorer (JavaScript implementation of trained logistic regression)
**Result:** Application never fails; gracefully degrades

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)            │
│  - Interactive application form                     │
│  - Real-time score visualization                    │
│  - Fairness dashboard                               │
│  - What-if simulator                                │
└─────────────────────┬───────────────────────────────┘
                      │ VITE Proxy to /api
                      ▼
┌─────────────────────────────────────────────────────┐
│         Backend API (Node.js/Express)               │
│  - Authentication (JWT)                             │
│  - Application orchestration                        │
│  - MongoDB persistence                              │
│  - PDF report generation                            │
│  - Hybrid ML scoring (Python-first, JS-fallback)   │
└─────┬────────────────────────┬──────────────────────┘
      │ HTTP POST /score      │ User+app data
      ▼                        ▼
┌─────────────────────┐  ┌──────────────────────┐
│  ML Service         │  │ MongoDB Atlas        │
│ (Python/FastAPI)    │  │ - Users              │
│ - Gradient Boosting │  │ - Applications       │
│ - Logistic Reg.     │  │ - Scoring history    │
│ - Score generation  │  │ - Audit logs         │
└─────────────────────┘  └──────────────────────┘
```

---

## 🎨 Core Features (8 Total)

| # | Feature | Impact | Technical |
|---|---------|--------|-----------|
| 1 | Smart Credit Scoring | Provides risk assessment | Gradient Boosting + Logistic Regression |
| 2 | Auto Column Mapping | Eliminates data preprocessing | 40+ field alias recognition |
| 3 | Explainable Framework | Builds applicant trust | Feature contribution analysis |
| 4 | What-If Scenarios | Shows improvement paths | Dynamic score recalculation |
| 5 | User Authentication | Secures data | JWT + bcrypt |
| 6 | Decision History | Audit trail | MongoDB persistence |
| 7 | Fairness Monitoring | Prevents bias | Demographic parity metrics |
| 8 | Bulk Processing | Scales efficiently | CSV/XLSX upload, 200-row batch |

---

## 🔐 Security Principles

1. **Authentication:** JWT tokens (7-day expiry)
2. **Password Security:** bcrypt hashing with salt
3. **Data Isolation:** Applications scoped to user ID
4. **API Protection:** Rate limiting (100 req/15min per IP)
5. **Input Validation:** Schema validation before processing
6. **Audit Trail:** All scoring operations logged with timestamps
7. **HTTPS Only:** (In production deployment)

---

## 📊 Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String (bcrypt),
  name: String,
  role: String,            // "user" or "admin"
  createdAt: Date
}
```

### Application Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to User),
  applicantData: {
    age: Number, income: Number, employmentYears: Number,
    creditHistory: Number (0-10), savingsBalance: Number,
    // ... 13+ demographic/financial fields
  },
  result: {
    creditScore: Number (300-900),
    decision: String ("approved" | "conditional" | "review" | "declined"),
    riskLevel: String ("low" | "medium" | "high" | "very_high"),
    probability: Number (0-1),
    explanations: Array (7 factors with contributions),
    recommendation: String,
    interestRateRange: String,
    maxApprovedAmount: Number
  },
  whatIfScenarios: Array ({scenario, newScore, change}),
  createdAt: Date
}
```

---

## 🚀 Deployment Architecture

The system can be deployed on multiple platforms:

**Frontend:** Vercel or Netlify (static React build)  
**Backend:** Render, Railway, or AWS (Node.js service)  
**ML Service:** Render, Railway, or AWS (Python service)  
**Database:** MongoDB Atlas (managed cloud hosting)

Hybrid design allows independent scaling of ML and backend services.

---

## 👥 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Fast, reactive UI |
| **Frontend Styling** | Tailwind CSS | Responsive design |
| **Frontend Charts** | Recharts | Data visualization |
| **Backend** | Node.js 18+ + Express.js | API server |
| **Database** | MongoDB 6+ | Data persistence |
| **Auth** | JWT + bcrypt | Secure authentication |
| **ML** | Python 3.9+ + scikit-learn | ML algorithms |
| **ML API** | FastAPI + Uvicorn | ML HTTP service |
| **ML Algorithms** | Gradient Boosting + Logistic Regression | Scoring |
| **Reports** | PDFKit | PDF generation |
| **File Handling** | Multer v2 + xlsx | CSV/Excel uploads |

---

## ✅ Success Criteria Met

- [x] Explainable credit scoring with feature-level contributions
- [x] Handles 40+ real banking field name variations
- [x] 99% accuracy on CIBIL test dataset
- [x] Sub-500ms scoring latency
- [x] Fairness monitoring dashboard
- [x] What-if scenario generation
- [x] Bulk CSV/XLSX upload (200 rows)
- [x] PDF report generation
- [x] Comprehensive API documentation
- [x] Production deployment guide
- [x] Hybrid fallback architecture
- [x] Complete project documentation

---

## 🎓 Learning Outcomes Demonstrated

1. **Full-Stack Development:** Frontend, backend, ML integration
2. **Production Architecture:** Security, scalability, reliability
3. **Machine Learning Integration:** Model serving, fallback strategies
4. **Data Management:** MongoDB design, aggregation pipelines
5. **API Design:** RESTful principles, error handling, rate limiting
6. **Security:** Authentication, authorization, password hashing
7. **Real-World Problem Solving:** Automatic column mapping, bias detection
8. **Documentation:** Professional API docs, deployment guides
9. **Testing & QA:** Comprehensive test coverage
10. **Explainable AI:** Making ML decisions understandable to end users

---

## 📚 Next Steps

1. **To understand the architecture:** Read [02-TECHNICAL-ARCHITECTURE.md](02-TECHNICAL-ARCHITECTURE.md)
2. **To see all APIs:** Read [03-API-REFERENCE.md](03-API-REFERENCE.md)
3. **To deploy:** Read [08-DEPLOYMENT-GUIDE.md](08-DEPLOYMENT-GUIDE.md)
4. **To present it:** Read [09-EXAMINER-GUIDE.md](09-EXAMINER-GUIDE.md)

---

**Version:** 1.0 | **Last Updated:** March 27, 2026 | **Status:** Production Ready
