# 🔐 CreditXplain - Security Implementation

## Overview

CreditXplain implements **enterprise-grade security** across authentication, data protection, API security, and fair lending compliance.

---

## Authentication & Authorization

### JWT (JSON Web Token) Flow

#### Token Generation (Login)
```
1. User submits email + password
2. Backend verifies password against bcrypt hash
3. If valid: Generate JWT with userId + expiration
4. Return JWT + user info to frontend
5. Frontend stores JWT in localStorage
```

#### Token Verification (Protected Routes)
```
1. Frontend sends request with: Authorization: Bearer <token>
2. Backend middleware extracts token
3. Verify JWT signature (secret key)
4. Extract userId from payload
5. Continue to route handler or reject with 401
```

#### Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MTEwNDcwMDAsImV4cCI6MTcxMTA1MDYwMH0
.X7zJxGk2Y1mN7pQrS8vL9kDfG3hE4cBn5mA6oP7wQ8Y

Header:     {"alg":"HS256","typ":"JWT"}
Payload:    {"userId":"507f1f77bcf86cd799439011","iat":1711047000,"exp":1711050600}
Signature:  HMACSHA256(header+payload, JWT_SECRET)
```

**Token Expiration:** 1 hour (short-lived, reduces token theft impact)

### Password Hashing

```javascript
// Registration
const password = "UserPassword123";
const hashedPassword = bcrypt.hashSync(password, 10);
// Stored: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ZXohem

// Login verification
const match = bcrypt.compareSync(loginPassword, storedHash);
// Comparison is constant-time (prevents timing attacks)
```

**Parameters:**
- Salt rounds: 10 (each +1 round = 2x slower, ~100ms per hash)
- Alternative: argon2 (newer, more secure, recommended for new projects)

### Authorization Middleware

```javascript
// middleware/auth.js
export const verifyAuth = (req, res, next) => {
  try {
    // Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach userId to request
    req.userId = decoded.userId;
    
    // Continue to route handler
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### Protected Routes Example
```javascript
// Public route
router.post('/auth/register', registerController);

// Protected route
router.post('/credit/apply', verifyAuth, applyForCredit);
// If no valid token: Returns 401 immediately
// If valid: req.userId populated, route executes
```

---

## Data Protection

### Password Security
```
✅ Passwords hashed with bcrypt (10 rounds)
✅ Never stored plaintext in database
✅ Never logged or exposed in responses
✅ Comparison is constant-time (prevents timing attacks)
❌ NO: Passwords sent over HTTP (must use HTTPS)
❌ NO: Passwords cached in memory without limits
```

### Sensitive Data Handling
```javascript
// User response object (never include password)
{
  id: "507f1f77bcf86cd799439011",
  email: "john@example.com",
  name: "John Doe"
  // password: NEVER included
}

// Application response (personally identifiable info permitted, aggregated)
{
  score: 675,
  decision: "approved",
  // Full applicant data returned (user needs it)
  age: 35,
  income: 750000
}
```

### HTTPS/TLS

**In Development:**
- HTTP allowed (localhost only)
- Self-signed certificates okay for testing

**In Production:**
```
✅ HTTPS enforced on all routes
✅ Let's Encrypt SSL certificate (auto-renewing)
✅ TLS 1.2+ minimum
✅ HSTS header: Force HTTPS for future requests
```

### Data Retention

```
User Data:
- Active user: Keep indefinitely
- Deleted user: Anonymize applications after 90 days

Application Records:
- Keep all applications permanently (audit trail)
- Support user download/deletion requests (GDPR)
- Hard delete only with legal/compliance approval

Logs:
- API request logs: 30 days retention
- Error logs: 60 days retention
- Security logs: 1 year retention
```

---

## API Security

### Input Validation

```javascript
// Validation rules (Express middleware)
const validateApplication = [
  body('age').isInt({ min: 18, max: 80 }).toInt(),
  body('income').isInt({ min: 0 }).toInt(),
  body('loanAmount').isInt({ min: 1000 }).toInt(),
  body('educationLevel').isIn(['high_school', 'bachelor', 'master', 'phd', 'other']),
  // ... more validations
];

// Route uses validation middleware
router.post('/credit/apply', verifyAuth, validateApplication, applyForCredit);

// Invalid request Example:
{
  age: "invalid",           // Not a number → 400 Bad Request
  income: -100,            // Negative → 400 Bad Request
  loanAmount: 500,         // Too low → 400 Bad Request
}
```

### Rate Limiting

```javascript
// Prevent brute force & abuse
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 60,                   // 60 requests per minute per IP
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
app.use('/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 5,                     // 5 login attempts
  skipSuccessfulRequests: true
}));
```

### CORS (Cross-Origin Resource Sharing)

```javascript
// Only allow specific origins
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://creditxplain.web.app'
  ],
  credentials: true,        // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### SQL Injection / NoSQL Injection Prevention

```javascript
// ✅ Correct: Parameterized query
db.collection('users').findOne({ email: userInput });

// ❌ Wrong: String concatenation
db.collection('users').findOne({ $where: `this.email == '${userInput}'` });

// ✅ MongoDB native driver is inherently safe
// User input treated as data, not code
```

### XSS (Cross-Site Scripting) Prevention

```javascript
// ✅ React automatic escaping
const score = 675;
<div>Your score: {score}</div>      // Safe (numbers can't be XSS)

// ✅ Sanitize user input
const name = sanitizeHtml(userInput);

// ❌ Never use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGER!
```

### CSRF (Cross-Site Request Forgery) Protection

```javascript
// If cookies used for auth (JWT avoids this):
// Add CSRF token to forms, validate on POST

// JWT approach (current):
// Tokens in Authorization header (not vulnerable to CSRF)
// No additional CSRF protection needed
```

---

## File Upload Security

### CSV/XLSX Upload

```javascript
// Validate file type
const allowedMimes = ['text/csv', 'application/vnd.ms-excel'];
const allowedExtensions = ['.csv', '.xlsx'];

if (!allowedMimes.includes(file.mimetype)) {
  return res.status(400).json({ error: 'Invalid file type' });
}

// Limit file size
const MAX_SIZE = 10 * 1024 * 1024;  // 10MB
if (file.size > MAX_SIZE) {
  return res.status(400).json({ error: 'File too large' });
}

// Validate content
const rows = parseCSV(file);
if (rows.length > 10000) {
  return res.status(400).json({ error: 'Too many rows' });
}

// Validate each row (applies same validation as text forms)
rows.forEach(row => {
  validateApplication(row);  // Same rules as manual form
});
```

---

## Fair Lending & Compliance

### Protected Attributes

```javascript
// Legally protected attributes (cannot discriminate)
const protectedAttributes = [
  'gender',
  'race',                    // Not collected (privacy)
  'color',                   // Not collected
  'religion',                // Not collected
  'national_origin',         // Not collected
  'age',                     // Collected but tested for bias
  'maritalStatus',           // Collected but tested
  'familialStatus'           // Collected (numberOfDependents)
];

// Model should NOT have high feature importance for these
// => Model doesn't use gender, maritalStatus, etc. heavily
```

### Disparate Impact Analysis

```javascript
// 80% Rule (EEOC legal threshold)
// If approval rate A / approval rate B < 0.80, potential bias

const approvalRate_group1 = 0.75;  // 75%
const approvalRate_group2 = 0.62;  // 62%
const disparityRatio = approvalRate_group2 / approvalRate_group1;

if (disparityRatio < 0.80) {
  // ⚠️ Potential bias - investigate
  // Possible causes:
  // - Model trained on biased historical data
  // - Protected attribute correlated with other features
  // - Business rules discriminatory
  console.warn(`⚠️ Disparity found: ${disparityRatio}`);
}
```

### Audit Trail

```javascript
// Track all decisions for regulatory review
const auditLog = {
  userId: applicantId,
  decision: 'approved',
  score: 675,
  timestamp: new Date(),
  modelVersion: '1.0',
  inputData: {...},           // All factors in decision
  outputData: {...},
  appealed: false,
  appealDecision: null
};

db.collection('audit_logs').insertOne(auditLog);
```

### Appeal Process (Future)

```javascript
// Support for applicants to appeal decisions
// Required under many lending regulations

POST /credit/appeal/:applicationId
{
  reason: "I have improved my credit score",
  newData: { creditHistory: 9 }  // Updated info
}

// Manual review by human
// Re-scoring with new data
// Document decision for compliance
```

---

## Secrets Management

### Environment Variables

```bash
# .env (git ignored)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/creditxplain
JWT_SECRET=<128-character-random-string>
ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
NODE_ENV=production
```

**Never commit .env to Git!**

```bash
# Verify .gitignore
cat .gitignore | grep "\.env"
# Should output: .env
```

### Secret Rotation

```
JWT_SECRET:
- Change every 6 months (or if compromised)
- Keep old secret for 1 day (allow existing tokens)
- Support multiple secrets during transition

Database Password:
- Change every 3 months
- Use MongoDB Atlas "Manage Connections" for updates
```

### Third-Party Services Access

```
If integrating payment processor, email service:
- Never store credentials in code
- Use environment variables or secure vault
- Rotate credentials regularly
- Limit scope (read-only APIs where possible)
```

---

## Deployment Security

### Production Checklist

- [ ] HTTPS enforced (no HTTP in production)
- [ ] JWT_SECRET is random & long (>32 chars)
- [ ] CORS configured to production domain only
- [ ] Rate limiting enabled
- [ ] Database connection is SSL (MongoDB Atlas default)
- [ ] Environment variables do not contain secrets in code
- [ ] Passwords never logged anywhere
- [ ] Error messages don't expose system details (generic: "Invalid input")
- [ ] Health check endpoint doesn't expose sensitive info
- [ ] API documentation doesn't expose internal details

### Server Security

```bash
# Keep dependencies updated
npm audit             # Check for known vulnerabilities
npm update            # Update packages
npm ci                # Clean install (for production)

# Enable Node.js security headers
npm install helmet    # Add security headers middleware
```

### Database Security

```javascript
// MongoDB Atlas security
- IP whitelist: Only allow backend server IP
- VPC Peering: Private network connection
- Encryption: At-rest (AES-256) + in-transit (TLS)
- Regular backups: 35-day retention
- Let MongoDB manage patches & updates
```

---

## Monitoring & Incident Response

### Security Logging

```javascript
// Log security events
logger.info('User login successful', { userId, ip, timestamp });
logger.warn('Failed login attempt', { email, ip, reason });
logger.error('Suspicious activity detected', { userId, action, details });

// Never log
logger.debug(password);    // ❌ NEVER
logger.debug(jwtToken);    // ❌ NEVER
```

### Alerts

```
- Multiple failed logins: Possible brute force attack
- Unusual API activity: Rate limiting or DoS attack
- Database connection errors: Possible intrusion
- Certificate expiration: SSL will fail in X days
```

### Incident Response Plan

```
1. Detection: Alert fires (e.g., many failed logins)
2. Investigation: Check logs, user activity, database
3. Containment: Block IP, revoke tokens, reset credentials
4. Eradication: Fix root cause (update code, rotate secrets)
5. Recovery: Restore normal operations, monitoring
6. Lessons Learned: Identify improvements, prevent future
```

---

## Compliance Frameworks

### GDPR (EU)
- User consent for data collection
- Right to access personal data
- Right to erasure ("right to be forgotten")
- Data portability
- Privacy by design

### CCPA (California)
- Businesses must disclose data collection
- Users can opt-out of sale
- Right to know, delete, access

### Fair Lending (US)
- Cannot discriminate by protected attributes
- Must maintain detailed records
- Annual compliance audit
- Support appeal process

### PCI DSS (Payment Card Industry)
- N/A: CreditXplain doesn't process cards directly
- If adding payment: Must comply with PCI DSS standards
- Use Stripe/PayPal API (they handle compliance)

---

## Security Best Practices for Developers

1. **Keep dependencies updated**: `npm audit`, `npm update`
2. **Use environment variables**: Never hardcode secrets
3. **Validate all inputs**: Frontend + backend validation
4. **Log security events**: For audit trail
5. **Use HTTPS**: Always in production
6. **Rotate credentials**: Every 3-6 months
7. **Monitor logs**: Alert on suspicious activity
8. **Test attacks**: Penetration testing before production
9. **Have incident plan**: Know how to respond to breach
10. **Train team**: Everyone responsible for security

---

## Resources

- [OWASP Top 10 Web Vulnerabilities](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/security/)

---

**Last Updated:** March 27, 2026 | **Security Level:** Enterprise-Grade
