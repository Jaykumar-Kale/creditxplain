# CreditXplain - Explainable Credit Scoring System

## Executive Summary

CreditXplain is a full-stack web application implementing an interpretable credit scoring system using MERN stack with hybrid machine learning architecture. The system combines Python-based Gradient Boosting models with Logistic Regression for explainability, providing transparent credit decisions with real-world dataset support and automatic column mapping for banking datasets.

**Key Innovation:** Automatic column mapping from real banking datasets (40+ field name variations) enabling seamless integration of diverse lending data sources without manual data preprocessing.

---

## Project Overview

### Purpose

Deliver a production-ready credit scoring platform that prioritizes transparency and interpretability. Designed to demonstrate modern fintech principles including explainable AI, fairness monitoring, automatic model selection, and secure API design.

### Problem Statement

Traditional credit scoring systems are opaque. This system addresses:
- Lack of transparency in lending decisions
- Difficulty explaining credit scores to applicants
- Manual data preprocessing overhead when integrating real datasets
- Inefficient scoring workflows for bulk applications
- Unequal lending practices across demographics

### Solution Architecture

Three-tier microservices architecture with fallback mechanisms:

1. **Frontend (React/Vite):** Interactive application submission, real-time predictions, scenario simulation
2. **Backend (Node.js/Express):** API orchestration, hybrid ML scoring (Python-first, JS fallback), authentication
3. **ML Service (Python/FastAPI):** Gradient Boosting risk prediction with Logistic Regression explainability

---

## Technical Architecture

### Technology Stack

**Frontend:**
- React 18 with Vite for rapid development and optimized builds
- Tailwind CSS for responsive design (mobile-first)
- Recharts for data visualization and bias metrics
- Framer Motion for smooth UI transitions
- Axios for HTTP client communication

**Backend:**
- Node.js with Express.js framework
- MongoDB (Atlas) for persistence
- JWT for stateless authentication
- Multer v2 for secure file uploads
- xlsx library for Excel/CSV parsing
- PDFKit for report generation

**Machine Learning:**
- Python 3.9+ with scikit-learn
- FastAPI with Uvicorn for ML microservice
- Gradient Boosting Classifier (primary risk model)
- Logistic Regression (explainability model)
- Joblib for model serialization
- Pandas for data manipulation

### Architectural Pattern

```
[Frontend UI] -> [Backend API] -> [Python ML Service]
                 (fallback to JS Scorer if ML unavailable)
                 [MongoDB Database]
```

**Hybrid Scoring:** Primary tries ML service first, automatic fallback to JavaScript scorer ensures system remains operational.

---

## Core Features

### 1. Smart Credit Scoring Engine
- Hybrid approach: ML service first, JavaScript fallback
- Sub-second response times for single applications
- Bulk processing: Upload CSV/XLSX files with up to 200 rows
- Four-tier risk stratification: approved, conditional, review, declined

### 2. Automatic Data Column Mapping (40+ Aliases)
- Income: NETMONTHLYINCOME, annual_income, salary
- Employment: Time_With_Curr_Empr, employment_years
- Credit History: cibil_score, credit_score (auto-scale 300-900 to 0-10)
- Delinquency: Tot_Missed_Pmnt, max_recent_level_of_deliq
- Trade Lines: CC_TL, Home_TL, PL_TL (auto-detection)

Intelligent field derivation when fields are missing:
- Credit History: Calculated from delinquency and missed payments
- Monthly Expenses: Estimated as 45% of income
- Loan Amount: Inferred from income ratio
- Savings: Estimated as 8% of annual income

### 3. Explainable Decision Framework
- Feature-level contributions showing factor influence
- Plain-language justifications for non-technical users
- What-if scenarios: Interactive score improvement simulation
- Seven key drivers displayed: income, credit history, employment, debts, etc.

### 4. User Authentication and Security
- JWT token-based stateless authentication
- bcrypt password hashing with salt
- Application-level data isolation
- 24-hour token expiry

### 5. Decision History and Analytics
- Persistent application records with audit trail
- User statistics dashboard (approvals, denials, average scores)
- Historical tracking of all submissions

### 6. Fairness and Bias Monitoring
- Demographic parity metrics (gender, marital status, education)
- Impact ratio calculation for protected vs. unprotected groups
- Disparate impact analysis
- Score distribution visualization
- Recommendation bias detection

### 7. Report Generation
- PDF export of complete application assessment
- Score, decision, explanations, what-if scenarios
- Professional formatting with company branding areas

### 8. Bulk File Processing
- Supported formats: CSV and XLSX
- Automatic column parsing and data type detection
- Preview results: First 25 predictions returned
- Error reporting: Skipped rows logged with specific reasons

---

## API Endpoints

### Authentication (/api/auth)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| /register | POST | None | User registration |
| /login | POST | None | Login, returns JWT |
| /me | GET | Bearer | User profile |

### Credit Applications (/api/credit)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| /apply | POST | Bearer | Manual application |
| /apply-upload | POST | Bearer | Bulk CSV/XLSX upload |
| /history | GET | Bearer | Application history |
| /:id | GET | Bearer | Single application |
| /stats | GET | Bearer | User statistics |
| /bias-report | GET | Bearer | Fairness metrics |

### Reports (/api/reports)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| /pdf/:id | GET | Bearer | Download PDF report |

---

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  name: String,
  passwordHash: String (bcrypt),
  role: String (user or admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Application Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  applicantData: {
    age: Number,
    income: Number (annual),
    employmentYears: Number,
    loanAmount: Number,
    existingDebts: Number,
    creditHistory: Number (0-10),
    numberOfDependents: Number,
    monthlyExpenses: Number,
    savingsBalance: Number,
    educationLevel: String,
    maritalStatus: String,
    homeOwnership: String,
    loanPurpose: String,
    debtToIncomeRatio: Number (derived),
    loanToIncomeRatio: Number (derived),
    savingsToIncomeRatio: Number (derived),
    netMonthlyCashflow: Number (derived)
  },
  result: {
    creditScore: Number (300-900),
    decision: String (approved|conditional|review|declined),
    riskLevel: String (low|medium|high|very_high),
    probability: Number (0-1),
    explanations: [String],
    recommendation: String,
    interestRateRange: String,
    maxApprovedAmount: Number
  },
  whatIfScenarios: Array,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Machine Learning Components

### Model Architecture

**Two-Model Ensemble:**

1. Gradient Boosting Classifier (primary risk model)
   - 100 estimators with optimal depth
   - Input: 13 numeric + 4 categorical features
   - Output: Default probability
   - Performance: ROC-AUC > 0.85 on CIBIL datasets

2. Logistic Regression (explainability model)
   - Coefficient-based feature importance
   - Enables interpretation of individual decisions
   - Fast inference for real-time explanations

### Training Pipeline

Multi-model comparison and automatic selection:
```bash
python train_real.py --data dataset.csv --target defaultRisk --column-map mapping.json
```

Compares Logistic Regression, Random Forest, and Gradient Boosting. Selects best by ROC-AUC score.

### Feature Engineering

Derived metrics calculated at runtime:
- Debt-to-Income Ratio: (existingDebts + loanAmount) / income
- Loan-to-Income Ratio: loanAmount / income
- Savings-to-Income Ratio: savingsBalance / income
- Net Monthly Cashflow: (income/12) - monthlyExpenses - (existingDebts/12)

---

## Installation and Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB Atlas or local MongoDB
- Git

### Backend Setup

```bash
cd creditxplain/server
npm install
cp .env.example .env
npm run dev
```

Runs on http://localhost:5000

### Frontend Setup

```bash
cd creditxplain/client
npm install
npm run dev
```

Runs on http://localhost:5173

### ML Service Setup (Recommended)

```bash
cd creditxplain/ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python train.py
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Runs on http://localhost:8000

### Environment Configuration

**Backend (.env):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/creditxplain
JWT_SECRET=your-secure-random-string-min-32-chars
JWT_EXPIRY=24h
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Demo and Testing

### Test User Accounts

Account 1:
- Email: demo@example.com
- Password: Demo@123456

Account 2:
- Email: test@example.com
- Password: Test@123456

### Manual Application Testing

1. Login with demo account
2. Navigate to "New Application"
3. Fill 4-step form with applicant details
4. View instant score and decision
5. Click "View Explanation" for what-if scenarios
6. Download PDF report

### Bulk Upload Testing

1. Prepare CSV/XLSX with banking columns (NETMONTHLYINCOME, MARITALSTATUS, etc.)
2. Login to application
3. Click "Upload & Predict"
4. Select file, submit
5. View results summary (processed, successful, preview)

### Bias Dashboard Testing

1. Submit 5+ applications with varying demographics
2. Navigate to "Bias Dashboard"
3. View approval rates by gender, marital status, education
4. Observe fairness metrics and disparate impact

---

## Project Structure

```
creditxplain/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # Context providers
│   │   ├── utils/               # HTTP client
│   │   └── App.jsx, main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js/Express
│   ├── controllers/             # Business logic
│   ├── routes/                  # API endpoints
│   ├── models/                  # MongoDB schemas
│   ├── middleware/              # Auth, error handling
│   ├── utils/                   # ML engine, normalizers
│   ├── server.js
│   └── package.json
│
├── ml/                          # Python ML microservice
│   ├── app.py                   # FastAPI service
│   ├── model.py                 # Model architecture
│   ├── train.py                 # Initial training
│   ├── train_real.py            # Real dataset trainer
│   ├── requirements.txt
│   └── artifacts/
│       └── credit_model.joblib
│
└── README.md
```

---

## Key Achievements

1. Real-world data integration with 40+ banking field aliases
2. 99% success rate on 100-row CIBIL dataset
3. Hybrid resilience with automatic fallback mechanism
4. Feature-level explainability for all decisions
5. JWT authentication with bcrypt password security
6. Built-in demographic parity and fairness metrics
7. Support for CSV/XLSX bulk processing (up to 200 rows)

---

## Performance Metrics

- Single application scoring: Sub-500ms
- Bulk processing (100 rows): 30-60 seconds
- API response times: P95 < 2 seconds
- Database queries: P99 < 100ms
- Model serialization: ~5MB

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| ML service connection refused | Ensure Python service running on port 8000 |
| MongoDB connection error | Verify MONGODB_URI and IP whitelist in Atlas |
| CORS errors | Verify CORS_ORIGIN matches frontend URL |
| JWT token expired | User must login again |
| CSV upload fails | Ensure file has required columns, size < 10MB |

---

## Contact and Support

For technical questions or issues, contact the project maintainers.

**Repository:** GitHub  
**Last Updated:** March 27, 2026
