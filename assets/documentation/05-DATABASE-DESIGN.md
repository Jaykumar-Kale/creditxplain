# 🗄️ CreditXplain - Database Design

## MongoDB Collections & Schemas

---

## 1. Users Collection

Stores user account information and authentication data.

### Schema
```json
{
  "_id": ObjectId,
  "email": String,
  "password": String,
  "name": String,
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "lastLogin": ISODate,
  "isActive": Boolean,
  "role": String
}
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZXohem",
  "name": "John Doe",
  "createdAt": ISODate("2024-03-27T10:00:00Z"),
  "updatedAt": ISODate("2024-03-27T15:30:00Z"),
  "lastLogin": ISODate("2024-03-27T15:30:00Z"),
  "isActive": true,
  "role": "user"
}
```

### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique identifier (auto-generated) |
| email | String | User's email (unique, indexed) |
| password | String | Bcrypt hashed password (10 salt rounds) |
| name | String | User's full name |
| createdAt | ISODate | Account creation timestamp |
| updatedAt | ISODate | Last profile update timestamp |
| lastLogin | ISODate | Last successful login time |
| isActive | Boolean | Account active/suspended status |
| role | String | User role: 'user', 'admin' |

### Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ isActive: 1 });
```

### Security Notes
- Passwords are hashed with bcrypt (10 rounds), never stored plaintext
- Email indexed uniquely (prevent duplicate registrations)
- Last login tracked for analytics
- No sensitive data besides email

---

## 2. Applications Collection

Stores credit applications and scoring results.

### Schema
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "applicantData": {
    "age": Number,
    "income": Number,
    "employmentYears": Number,
    "loanAmount": Number,
    "existingDebts": Number,
    "creditHistory": Number,
    "numberOfDependents": Number,
    "monthlyExpenses": Number,
    "savingsBalance": Number,
    "educationLevel": String,
    "maritalStatus": String,
    "homeOwnership": String,
    "loanPurpose": String,
    "gender": String
  },
  "scoringResult": {
    "score": Number,
    "decision": String,
    "riskLevel": String,
    "probability": Number,
    "explanation": String,
    "modelVersion": String,
    "scoredAt": ISODate
  },
  "createdAt": ISODate,
  "sourceType": String,
  "status": String
}
```

### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "applicantData": {
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
  },
  "scoringResult": {
    "score": 675,
    "decision": "approved",
    "riskLevel": "low",
    "probability": 0.13,
    "explanation": "Your strong income and credit history offset the large loan amount.",
    "modelVersion": "1.0",
    "scoredAt": ISODate("2024-03-27T10:05:00Z")
  },
  "createdAt": ISODate("2024-03-27T10:05:00Z"),
  "sourceType": "manual_form",
  "status": "final"
}
```

### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Application ID |
| userId | ObjectId | Reference to User document |
| applicantData | Object | All input fields from user |
| scoringResult | Object | Model output & decision |
| createdAt | ISODate | Application submission timestamp |
| sourceType | String | 'manual_form' or 'csv_upload' |
| status | String | 'draft', 'submitted', 'final' |

### Indexes
```javascript
// Fast history retrieval
db.applications.createIndex({ userId: 1, createdAt: -1 });

// Fast bias analysis queries
db.applications.createIndex({ "applicantData.gender": 1, "scoringResult.decision": 1 });
db.applications.createIndex({ "applicantData.maritalStatus": 1, "scoringResult.decision": 1 });

// Pagination
db.applications.createIndex({ createdAt: -1 });
```

### Notes
- All applicant input preserved in applicantData for audit trail
- Scoring result cached (immutable after creation)
- Source tracked for analytics (manual vs bulk upload)
- Support for query-based analytics

---

## 3. Analytics Cache Collection

Pre-computed statistics to avoid expensive aggregations.

### Schema
```json
{
  "_id": ObjectId,
  "type": String,
  "attribute": String,
  "data": Object,
  "calculatedAt": ISODate,
  "expiresAt": ISODate,
  "version": Number
}
```

### Example Document (Stats)
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "type": "stats",
  "attribute": null,
  "data": {
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
  },
  "calculatedAt": ISODate("2024-03-27T15:00:00Z"),
  "expiresAt": ISODate("2024-03-27T16:00:00Z"),
  "version": 1
}
```

### Example Document (Bias)
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "type": "bias",
  "attribute": "gender",
  "data": {
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
  "calculatedAt": ISODate("2024-03-27T15:00:00Z"),
  "expiresAt": ISODate("2024-03-27T16:00:00Z"),
  "version": 1
}
```

### Indexes
```javascript
// Fast lookup and expiration
db.analytics_cache.createIndex({ "type": 1, "attribute": 1 });
db.analytics_cache.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
```

### TTL Configuration
- Statistics cache: 1 hour (expires and recalculates)
- Bias cache: 1 hour
- When cache expires: background job recalculates fresh

---

## Query Examples

### Get User's Recent Applications
```javascript
db.applications.find({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  status: "final"
})
.sort({ createdAt: -1 })
.limit(10)
```

### Get Approval Rate by Gender
```javascript
db.applications.aggregate([
  {
    $match: {
      status: "final",
      "applicantData.gender": { $exists: true }
    }
  },
  {
    $group: {
      _id: "$applicantData.gender",
      total: { $sum: 1 },
      approved: {
        $sum: {
          $cond: [{ $eq: ["$scoringResult.decision", "approved"] }, 1, 0]
        }
      }
    }
  },
  {
    $project: {
      _id: 1,
      total: 1,
      approved: 1,
      approvalRate: { $divide: ["$approved", "$total"] }
    }
  }
])
```

### Get Overall Statistics
```javascript
db.applications.aggregate([
  { $match: { status: "final" } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      approved: {
        $sum: { $cond: [{ $eq: ["$scoringResult.decision", "approved"] }, 1, 0] }
      },
      avgScore: { $avg: "$scoringResult.score" }
    }
  }
])
```

### Get Applications by Decision Risk Level
```javascript
db.applications.aggregate([
  { $match: { status: "final" } },
  {
    $group: {
      _id: "$scoringResult.riskLevel",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

---

## Data Relationships

```
Users (1) ────────→ (Many) Applications
   |
   └─→ Email is unique identifier
       UUID (_id) used for auth token
```

**Important:**
- Every Application must reference valid userId
- Deleting user should cascade-delete applications
- Or archive user instead of deleting

---

## Backup & Disaster Recovery

### MongoDB Atlas Backup
- **Automatic daily backups**: Retained 35 days
- **Point-in-time restore**: Last 7 days
- **Manual backup**: Anytime
- **RPO (Recovery Point Objective)**: 1 day
- **RTO (Recovery Time Objective)**: 30 minutes

### Backup Strategy
```bash
# Manual backup (for sensitive operations)
mongodump --uri="mongodb+srv://..." --archive=backup.archive

# Restore from backup
mongorestore --archive=backup.archive
```

---

## Performance Optimization

### Index Strategy
```javascript
// Frequently used queries
db.applications.createIndex({ userId: 1, createdAt: -1 });
db.applications.createIndex({ "applicantData.gender": 1, "scoringResult.decision": 1 });

// Sorting operations
db.applications.createIndex({ createdAt: -1 });

// Aggregation pipelines
db.applications.createIndex({ status: 1, "scoringResult.decision": 1 });
```

### Query Optimization
**Before:**
```javascript
// Scans all documents
db.applications.find({ userId: id }).sort({ createdAt: -1 })
```

**After:**
```javascript
// Uses index { userId: 1, createdAt: -1 }
db.applications.find({ userId: id }).sort({ createdAt: -1 }).limit(10)
```

### Pagination Best Practice
```javascript
// First page
db.applications.find({ userId: id }).sort({ createdAt: -1 }).limit(10)

// Next page (use ID-based pagination for consistency)
db.applications.find({
  userId: id,
  _id: { $lt: lastDocumentId }
}).sort({ createdAt: -1 }).limit(10)
```

---

## Security Considerations

### Data Access Control
```javascript
// Users only see their own applications
db.applications.find({
  userId: authenticatedUserId
})

// Admin can see all
db.applications.find({})
```

### Audit Trail
- All applications stored permanently (never deleted)
- Timestamps recorded for all operations
- User ID associated with every application
- Decision and score immutable after creation

### Data Privacy
- Passwords hashed (bcrypt), never loggable
- Personal data (name, email) minimized
- Gender optional (for privacy)
- GDPR: Support user data export/deletion

### Encryption
- MongoDB Atlas: Data encrypted at rest (AES-256)
- Network: TLS/SSL encryption in transit
- Consider: Field-level encryption for sensitive fields

---

## Monitoring & Alerts

### Key Metrics
```
Database:
- Connection pool usage (should stay <80%)
- Query latency p99 (should be <100ms)
- Document size (applications average 2KB)
- Storage usage growth (alert if >50GB)

Collections:
- Applications: Monitor document count
- Users: Monitor growth rate
- Analytics cache: Monitor hit rate
```

### Alerts
```
- Connection pool nearly full: Scale up
- Query latency spike: Add indexes or optimize
- Storage nearly full: Archive old data
- Cache hit rate low: Increase TTL or recalculate more
```

---

## Migration & Upgrades

### Add New Field
```javascript
// Add field to all documents
db.applications.updateMany(
  {},
  { $set: { newField: defaultValue } }
)

// Schema is flexible in MongoDB, old documents still work
```

### Add Index
```javascript
// Non-blocking index creation
db.applications.createIndex(
  { newField: 1 },
  { background: true }
)
```

### Backup Before Major Changes
```bash
# Always backup first
mongodump --uri="mongodb+srv://..." --archive=backup-before-migration.archive

# Then run migrations
# If fails: mongorestore --archive=backup-before-migration.archive
```

---

**Last Updated:** March 27, 2026 | **Schema Version:** 1.0
