# 🎯 CreditXplain - Feature Guide

## Complete Feature Walkthrough

CreditXplain has 8 core features providing end-to-end credit scoring with explainability and fairness analysis.

---

## Feature 1: User Registration & Authentication

### Purpose
Secure user account creation with email verification and password protection.

### How It Works
1. User visits `/login` page
2. Clicks "Register" link
3. Enters email, password, full name
4. Backend validates:
   - Email format valid
   - Email not already registered
   - Password at least 6 characters
5. Password hashed with bcrypt (10 rounds)
6. User stored in MongoDB
7. JWT token generated and returned
8. User logged in automatically

### Key Features
- ✅ **Strong password hashing**: Bcrypt with 10 salt rounds (100ms per check)
- ✅ **Unique email constraint**: MongoDB unique index prevents duplicates
- ✅ **Automatic login**: No need to login again after registration
- ✅ **Error messages**: Clear feedback on validation failures

### Technical Details
```javascript
// Registration endpoint
POST /auth/register
Request: { email, password, name }
Response: { token, user }

// Password hashing
const salt = bcrypt.genSaltSync(10);      // ~100ms
const hash = bcrypt.hashSync(password, salt);
```

### User Experience
```
Registration Flow:
┌─────────────────────────────────┐
│ Email: john@example.com         │
│ Password: [hidden]              │
│ Name: John Doe                  │
│ [Register Button]               │
└─────────────────────────────────┘
         │
         ▼
   (Validation)
         │
         ▼
┌─────────────────────────────────┐
│ ✓ Account Created!              │
│ ✓ Login Successful!             │
│ [Go to Dashboard]               │
└─────────────────────────────────┘
```

---

## Feature 2: Manual Credit Application (4-Step Form)

### Purpose
Collect comprehensive applicant data and generate immediate credit scores.

### How It Works
1. User accesses `/dashboard`
2. Completes 4-step form:
   - **Step 1**: Personal Info (age, education, marital status, dependents, gender)
   - **Step 2**: Financial Details (income, expenses, debts, savings, home ownership)
   - **Step 3**: Employment & Credit (years employed, credit history score)
   - **Step 4**: Loan Details (amount, purpose)
3. Each step validates before moving to next
4. On final step, user clicks "Submit"
5. Backend receives all data
6. Normalizes data types (strings → numbers, etc.)
7. Calls ML service for prediction
8. Falls back to JavaScript scorer if ML unavailable
9. Stores application in MongoDB
10. Returns result with score, decision, explanation

### Key Features
- ✅ **Multi-step form**: Reduces cognitive load
- ✅ **Progressive validation**: Catch errors early
- ✅ **Real-time feedback**: See errors immediately
- ✅ **Comprehensive data**: 13 fields covering financial profile
- ✅ **Optional gender field**: For bias analysis without forcing disclosure

### Form Fields

#### Step 1: Personal Info (5 fields)
```
- Age (18-80)
- Education Level (High School, Bachelor, Master, PhD, Other)
- Marital Status (Single, Married, Divorced, Widowed)
- Number of Dependents (0+)
- Gender (Optional, for bias analysis)
```

#### Step 2: Financial Details (5 fields)
```
- Annual Income (0+)
- Monthly Expenses (0+)
- Existing Monthly Debt Payments (0+)
- Total Savings Balance (0+)
- Home Ownership (Renting, Own, Mortgage, Other)
```

#### Step 3: Employment & Credit (2 fields)
```
- Years of Employment (0+)
- Credit History Score (0-10)
```

#### Step 4: Loan Details (2 fields)
```
- Loan Amount Requested (1000+)
- Loan Purpose (Home, Car, Education, Business, Medical, Personal, Other)
```

### Technical Details
```javascript
// Apply endpoint
POST /credit/apply
Request body: {
  age, income, employmentYears, loanAmount,
  existingDebts, creditHistory, numberOfDependents,
  monthlyExpenses, savingsBalance, educationLevel,
  maritalStatus, homeOwnership, loanPurpose, gender
}

Response: {
  score, decision, riskLevel, explanation,
  breakdown, recommendedLoanAmount, interestRateRange
}
```

### User Experience
```
Dashboard → Start Application
         ▼
    Step 1 of 4
    Personal Info
    [age field]
    [education]
    [marital status]
    [dependents]
    [gender - optional]
         ▼
    [Next Button ▶]
```

---

## Feature 3: Bulk CSV/XLSX Upload

### Purpose
Process multiple credit applications at once without manual data entry.

### How It Works
1. User clicks "Upload & Predict" button
2. Selects CSV or XLSX file from computer
3. Backend parses file:
   - Check all required columns present
   - Read all rows
4. For each row:
   - Validate data matches same rules as manual form
   - Skip rows with errors (log reason)
   - Score valid rows via ML or JavaScript
   - Prepare for database insert
5. Bulk insert all successful rows
6. Return summary: (processed, successful, skipped rows)

### File Format

**CSV Example:**
```csv
age,income,employmentYears,loanAmount,existingDebts,creditHistory,numberOfDependents,monthlyExpenses,savingsBalance,educationLevel,maritalStatus,homeOwnership,loanPurpose,gender
35,750000,5,500000,8000,8,2,30000,200000,bachelor,married,own,home,male
42,900000,10,750000,12000,9,3,35000,350000,master,married,own,business,male
28,450000,2,250000,5000,6,1,20000,75000,bachelor,single,rent,personal,female
```

**Column Order:** Doesn't matter (uses headers)

**Column Names (case-sensitive):**
```
age, income, employmentYears, loanAmount, existingDebts,
creditHistory, numberOfDependents, monthlyExpenses, savingsBalance,
educationLevel, maritalStatus, homeOwnership, loanPurpose, gender
```

### Key Features
- ✅ **Bulk processing**: Score 100s of applications in seconds
- ✅ **Error handling**: Skip invalid rows, return summary
- ✅ **Validation**: Same rules as manual form applied
- ✅ **Preview**: Shows first result + summary
- ✅ **Template download**: Users know exactly which columns needed

### Response Example
```json
{
  "firstResult": {
    "score": 675,
    "decision": "approved",
    "riskLevel": "low"
  },
  "processedRows": 100,
  "successfulPredictions": 98,
  "skipped": [
    { "rowNumber": 5, "reason": "Age must be between 18 and 80" },
    { "rowNumber": 45, "reason": "Loan amount must be >= 1000" }
  ]
}
```

---

## Feature 4: Credit Score Result & Explanation

### Purpose
Display decision, score, risk level, and personalized explanation for each application.

### Score Scale
```
0-300:     Very High Risk      (Rejected with strong reasons)
300-450:   High Risk           (Rejected - consider improvement)
450-600:   Medium Risk         (Manual review recommended)
600-750:   Low Risk            (Approved)
750+:      Very Low Risk       (Fast-track approved)
```

### Result Components

1. **Score** (0-800)
   - Composite metric combining all financial factors
   - Higher = lower risk

2. **Decision** (Approved/Rejected)
   - Binary decision based on score thresholds
   - Approved: score ≥ 600
   - Rejected: score < 600

3. **Risk Level** (Very Low → Very High)
   - Categorizes risk for communication
   - Guides interest rates & terms

4. **Explanation** (Human-readable)
   - Why decision was made
   - Which factors were positive/negative
   - Example: "Your strong income and credit history support approval, though your large loan amount is a consideration."

5. **Score Breakdown**
   - Contribution of each category:
     - Income Score (0-100)
     - Debt Score (0-100)
     - Credit History Score (0-100)
     - Employment Score (0-100)
     - Savings Score (0-100)

6. **Recommended Loan Amount**
   - What amount would likely be approved
   - Based on income, debt ratios
   - Helps users understand approval likelihood

7. **Interest Rate Range**
   - Estimated APR for their risk profile
   - Very Low Risk: 7.5-9.0%
   - Low Risk: 9.0-11.5%
   - Medium Risk: 11.5-14.5%
   - High Risk: 14.5-18.0%

### Technical Details
```javascript
// Score breakdown calculation
const scoreBreakdown = {
  incomeScore: Math.min((income / 1000000) * 100, 100),
  debtScore: Math.max(100 - (monthlyDebt / monthlyIncome * 12) * 50, 0),
  creditHistoryScore: creditHistory * 10,
  employmentScore: Math.min(employmentYears * 10, 100),
  savingsScore: Math.min((savings / income) * 100, 100)
};

// Final score (weighted average)
const finalScore = 
  incomeScore * 0.30 +
  debtScore * 0.25 +
  creditHistoryScore * 0.25 +
  employmentScore * 0.10 +
  savingsScore * 0.10;
```

---

## Feature 5: Application History & Dashboard

### Purpose
View past applications, track decisions, and monitor credit scoring trends.

### How It Works
1. User visits "/history" page
2. Backend queries MongoDB for user's applications
3. Shows paginated list (10 per page)
4. Each row shows:
   - Application date
   - Loan amount requested
   - Score achieved
   - Decision (Approved/Rejected)
   - Risk level
   - View details / Download report options

### Key Features
- ✅ **Pagination**: Load 10 at a time (fast, scalable)
- ✅ **Sorting**: By date (newest first)
- ✅ **Actions**: View full details, download PDF report
- ✅ **Quick stats**: Total approved, rejection rate, average score

### View Details Modal
Shows complete application:
- All input fields
- Full scoring breakdown
- Complete explanation
- Timestamp

### UI Pattern
```
Application History
┌──────────────────────────────────────────────┐
│ Date      │ Amount   │ Score │ Decision │ Actions
├──────────────────────────────────────────────┤
│ 2024-03-27│ 500,000  │ 675   │ Approved │ View, PDF
│ 2024-03-26│ 250,000  │ 450   │ Rejected │ View, PDF
│ 2024-03-25│ 750,000  │ 720   │ Approved │ View, PDF
└──────────────────────────────────────────────┘
          [Previous Page]  [Next Page]
```

---

## Feature 6: PDF Report Generation

### Purpose
Generate professional, downloadable PDF reports for each application.

### Report Contents
```
Page 1:
- CreditXplain Header/Logo
- Date Generated
- Applicant Info (Name, Date of Application)
- Decision (APPROVED/REJECTED in large text)
- Score (675/800)
- Risk Level (Low)

Page 2:
- "About Your Score"
- Score breakdown (Income: 75%, Employment: 90%, etc.)
- Risk level explanation
- Recommendations (if rejected)

Page 3:
- Key Factors in Decision
- Income Analysis
- Debt-to-Income Ratio
- Credit History Assessment
- Savings & Emergency Fund Analysis

Page 4:
- Next Steps
- If Approved: Application guidelines, next process
- If Rejected: How to improve score, reapply timing
- Contact information
```

### Technical Details
```javascript
// PDF generation (pdfkit library)
POST /credit/report/:applicationId
Response: Binary PDF file

// Generation process
1. Query database for application
2. Verify user owns application (authorization)
3. Create PDF document
4. Add formatted content
5. Generate & return binary stream
```

### Key Features
- ✅ **Professional design**: Branded, readable PDF
- ✅ **Complete information**: All key data included
- ✅ **Explanations**: Human-readable decision reasoning
- ✅ **Actionable recommendations**: What to do next

---

## Feature 7: Analytics Dashboard

### Purpose
View aggregate statistics about all applications (for admin/reporting).

### Dashboard Metrics
```
Overall Statistics:
- Total Applications: 1,500
- Approval Rate: 70%
- Average Score: 652
- Average Loan Amount: 525,000

Risk Distribution:
- Very Low (750+): 35 applications
- Low (600-750): 45 applications
- Medium (450-600): 40 applications
- High (300-450): 25 applications
- Very High (0-300): 5 applications

Loan Purpose Breakdown:
- Home: 450 applications (60%)
- Education: 300 applications (20%)
- Business: 150 applications (10%)
- Other: 100 applications (10%)

Approval by Loan Purpose:
- Home: 75% approval
- Education: 65% approval
- Business: 55% approval
- Personal: 60% approval
```

### Charts & Visualizations
- **Pie chart**: Risk distribution
- **Bar chart**: Approval rate by category
- **Line chart**: Applications over time
- **Gauge chart**: Current approval rate

### Technical Details
```javascript
// Stats endpoint
GET /analytics/stats
Response: {
  total, approved, rejected, avgScore,
  approvalRate, riskDistribution
}

// Cached for performance
// Cache expires after 1 hour
// Recalculates on expiration
```

---

## Feature 8: Bias Analysis & Fair Lending Compliance

### Purpose
Analyze whether lending decisions are fair across demographic groups.

### How It Works
1. User selects protected attribute (gender, maritalStatus, educationLevel)
2. Backend queries all applications with that attribute
3. Calculates statistics for each group:
   - Number of applications
   - Approval rate
   - Average score
   - Rejection rate
4. Compares groups using disparityIndex
5. Provides recommendation (Unbiased/Potential Bias)

### Metrics Displayed

#### For Gender (example):
```
Male:
- Total Applications: 80
- Approved: 60
- Approval Rate: 75%
- Average Score: 665
- Rejection Rate: 25%

Female:
- Total Applications: 70
- Approved: 45
- Approval Rate: 64%
- Average Score: 635
- Rejection Rate: 36%

Disparity Analysis:
- Disparity Index: 0.85 (64% ÷ 75%)
- 80% Rule: Borderline (0.85 > 0.80)
- Interpretation: Slight disparity detected - monitor future decisions
```

### Legal Framework (80% Rule)
```
If: Approval Rate for Group B / Approval Rate for Group A < 0.80
Then: Potential bias may exist (under EEOC guidelines)

Disparity Ratio < 0.80 = Potential bias
Disparity Ratio ≥ 0.80 = Likely pass legal scrutiny
```

### Key Features
- ✅ **Multiple attributes**: Support gender, marital status, education
- ✅ **Detailed metrics**: Approval rates, average scores per group
- ✅ **Legal interpretation**: 80% rule explained
- ✅ **Recommendations**: Clear next steps if bias detected

### Response Example
```json
{
  "attribute": "gender",
  "metrics": {
    "male": {
      "total": 80,
      "approved": 60,
      "approvalRate": 0.75
    },
    "female": {
      "total": 70,
      "approved": 45,
      "approvalRate": 0.64
    }
  },
  "disparityIndex": 0.85,
  "recommendation": "Borderline - Monitor closely for bias"
}
```

---

## Feature Relationships

```
User Registration
    ↓
Authentication (JWT)
    ↓
┌─────────────────────────────────┐
│ Credit Application              │
├─────────────────────────────────┤
│ Option A: Manual Form (Step 1-2)│
│ Option B: CSV Upload (Step 3)   │
└─────────────────────────────────┘
    ↓
Score & Decision (Step 4)
    ↓
View Result (Step 5)
    ↓
┌─────────────────────────────────┐
│ Follow-up Options               │
├─────────────────────────────────┤
│ • View History (Step 6)         │
│ • Download PDF (Step 7)         │
│ • Check Analytics (Step 8)      │
│ • Analyze Bias (Step 9)         │
└─────────────────────────────────┘
```

---

## User Journeys

### Journey 1: Quick Single Application
```
1. Register
2. Login
3. Fill 4-step form (5 minutes)
4. View result
5. Download PDF report
Time: 10 minutes
```

### Journey 2: Bulk Scoring
```
1. Register
2. Login
3. Prepare CSV (external tool)
4. Upload CSV
5. View summary
6. Download all PDFs
Time: 5 minutes
```

### Journey 3: Recurring User
```
1. Login
2. View history
3. Submit new application
4. Track trends over time
Time: 3 minutes
```

### Journey 4: Compliance Officer
```
1. Login (admin account)
2. View analytics dashboard
3. Check bias metrics
4. Export reports (future feature)
5. Share with leadership
Time: 15 minutes
```

---

**Last Updated:** March 27, 2026 | **Status:** Feature-Complete
