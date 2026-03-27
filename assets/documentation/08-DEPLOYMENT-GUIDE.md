# 🚀 CreditXplain - Deployment Guide

## Production-Ready Deployment Architecture

Deploy CreditXplain across three services on popular platforms: Vercel (frontend), Render (backend & ML), and MongoDB Atlas (database).

---

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Security review completed
- [ ] HTTPS certificates ready
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Disaster recovery plan documented

---

## 1. Frontend Deployment (Vercel)

### Why Vercel?
- ✅ Dead simple React deployments
- ✅ Built-in CI/CD (deploy on git push)
- ✅ Free tier available
- ✅ Global CDN for fast loads
- ✅ Environment variables UI

### Step 1: Prepare Code

```bash
# Ensure vite build works
cd client
npm run build
# Should create dist/ folder without errors
```

### Step 2: Push to GitHub

```bash
# Initialize git repo (if not already)
git init
git add .
git commit -m "Initial commit: CreditXplain"
git remote add origin https://github.com/yourusername/creditxplain.git
git push -u origin main
```

### Step 3: Connect Vercel

1. Go to https://vercel.com
2. Sign up (use GitHub)
3. Click "Add New..." → "Project"
4. Select your GitHub repo
5. Framework: Vite
6. Root Directory: `./client`
7. Build Command: `npm run build`
8. Output Directory: `dist`

### Step 4: Configure Environment Variables

In Vercel project settings:

```
VITE_API_URL = https://creditxplain-api.onrender.com/api
```

### Step 5: Deploy

```bash
# Automatic: Every push to main triggers deploy
git push origin main

# Watch deployment
# Open Vercel dashboard → Deployments
```

### Production URL
```
https://your-project.vercel.app
```

### Verification
```bash
# Test API connection
curl https://your-project.vercel.app

# Should load app successfully
# Check browser console for no errors
```

---

## 2. Backend API Deployment (Render)

### Why Render?
- ✅ Easy Node.js deployments
- ✅ Free tier + paid tiers
- ✅ Environment variables support
- ✅ Auto-restart on crashes
- ✅ PostgreSQL/MongoDB integrations

### Step 1: Create render.com Account

1. Go to https://render.com
2. Sign up
3. Connect GitHub

### Step 2: Prepare Environment Variables

Create list of required vars:
```
MONGO_URI          # From MongoDB Atlas
JWT_SECRET         # Generate: openssl rand -base64 32
ML_SERVICE_URL     # https://creditxplain-ml.onrender.com
CLIENT_URL         # https://your-project.vercel.app
NODE_ENV           # production
PORT               # 5000 (Render assigns automatically)
```

### Step 3: Deploy Backend

1. In Render dashboard: "New +" → "Web Service"
2. Connect GitHub repository
3. Configuration:
   ```
   Name: creditxplain-api
   Environment: Node
   Build Command: npm install
   Root Directory: server
   Start Command: npm start
   Runtime: node-18
   ```
4. Add Environment Variables:
   - MONGO_URI
   - JWT_SECRET
   - ML_SERVICE_URL
   - CLIENT_URL
   - NODE_ENV=production

5. Deploy

### Step 4: Verify Backend

```bash
# Get service URL from Render (e.g., https://creditxplain-api.onrender.com)

# Test health endpoint
curl https://creditxplain-api.onrender.com/health
# Should return: {"status":"OK","timestamp":"..."}

# Test registration
curl -X POST https://creditxplain-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
# Should return: {"token":"...","user":{...}}
```

### Common Issues

**Problem: "Cannot find module 'express'"**
```bash
# Solution: Ensure Root Directory is set to server
# Render then runs install/start in server/
```

**Problem: "MONGO_URI is undefined"**
```bash
# Solution: Check environment variables in Render UI
# Must be set before deployment
```

**Problem: "504 Gateway Timeout"**
```bash
# Solution: Service taking too long to respond
# Check logs: Render dashboard → Logs
# May need to upgrade from free tier
```

---

## 3. ML Service Deployment (Render)

### Step 1: Prepare ML Service

```bash
cd ml
# Ensure requirements.txt updated
pip freeze > requirements.txt

# Test locally
python -m uvicorn app:app --reload --port 8000
```

### Step 2: Create render.yaml (Render Blueprint)

In `ml/render.yaml`:
```yaml
services:
  - type: web
    name: creditxplain-ml
    env: python
    region: oregon
    plan: free
      rootDir: ml
    buildCommand: pip install -r requirements.txt
      startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Step 3: Deploy to Render

1. In Render: "New +" → "Web Service"
2. Connect GitHub
3. Configuration:
   ```
   Name: creditxplain-ml
   Environment: Python
   Root Directory: ml
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```
4. Deploy

### Step 4: Verify ML Service

```bash
# Get ML service URL (e.g., https://creditxplain-ml.onrender.com)

# Test health
curl https://creditxplain-ml.onrender.com/health
# Should return: {"status":"ok","modelLoaded":true}

# Test prediction
curl -X POST https://creditxplain-ml.onrender.com/score \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35,
    "income": 750000,
    ...
  }'
```

---

## 4. Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create organization + project

### Step 2: Create Cluster

1. "Build a Database" → Shared (free tier)
2. Cloud provider: AWS / Google Cloud / Azure (any)
3. Region: Closest to your servers
4. Cluster name: creditxplain
5. Create cluster (wait ~5 minutes)

### Step 3: Create Database User

1. "Database Access" → "Add Database User"
   ```
   Username: creditxplain
   Password: [Generate secure password]
   Roles: Read and write to any database
   ```
2. Copy connection string (for .env)

### Step 4: Configure IP Whitelist

1. "Network Access" → "Add IP Address"
   ```
   Add current IP: Your home/office IP
   For production: Add Render service IPs
   Or: Allow anywhere 0.0.0.0/0 (less secure, easier for testing)
   ```

### Step 5: Get Connection String

```
Connection String Format:
mongodb+srv://creditxplain:PASSWORD@cluster.mongodb.net/creditxplain

Set as MONGO_URI in Render environment variables
```

### Step 6: Create Database & Collections

```javascript
// In MongoDB Atlas UI or mongosh terminal:

// Create database
use creditxplain

// Create collections
db.createCollection("users")
db.createCollection("applications")
db.createCollection("analytics_cache")

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.applications.createIndex({ userId: 1, createdAt: -1 })
```

---

## 5. Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=https://creditxplain-api.onrender.com/api
```

### Backend (Render UI)
```
MONGO_URI=mongodb+srv://creditxplain:PASSWORD@cluster.mongodb.net/creditxplain
JWT_SECRET=[32+ character random string]
ML_SERVICE_URL=https://creditxplain-ml.onrender.com
CLIENT_URL=https://your-project.vercel.app
NODE_ENV=production
```

### ML Service (Render UI)
```
No special vars needed (model path configured in app.py)
```

---

## 6. Testing Production Deployment

### Frontend
```bash
# Open in browser
https://your-project.vercel.app

# Should load without errors
# Check Network tab in DevTools:
# - All API calls to VITE_API_URL
# - No CORS errors
```

### Backend
```bash
# Full smoke test
node assets/testing/smoke-tests/QUICK_TEST.js \
  --url https://creditxplain-api.onrender.com

# Should show all tests PASS
```

### Workflow
```
1. Register new user (production)
2. Login
3. Submit credit application
4. Check MongoDB for stored data
5. Download PDF report
6. View analytics
```

---

## 7. Monitoring & Alerts

### Set Up Monitoring

**Uptime Monitoring:**
```
1. Use Uptimerobot (free tier)
2. Monitor: https://creditxplain-api.onrender.com/health
3. Check every 5 minutes
4. Alert if down > 5 minutes
```

**Error Tracking:**
```
1. Use Sentry (free tier)
2. In frontend: npm install @sentry/react
3. Initialize Sentry on app load
4. Captures all errors automatically
```

**Database Monitoring:**
```
1. MongoDB Atlas Dashboard
2. Watch metrics:
   - Ops/sec (queries per second)
   - Data size growth
   - Connection count
3. Alerts for:
   - High CPU
   - Storage near limit
   - Connection pool full
```

---

## 8. Scaling & Performance

### Database Scaling
```
MongoDB Atlas Tiers:
- Free: 512 MB data limit, 100 connections
- Shared M2: 2 GB data, 1000 connections
- Shared M5: 10 GB data, 3000 connections
- Dedicated clusters: Unlimited (paid)

Upgrade if: Data >400MB or connections >80%
```

### Backend Scaling
```
Render Plans:
- Free: 0.5 CPU, 512 MB RAM (sleeps after 15 min inactivity)
- Starter: 0.5 CPU, 512 MB RAM (always on)
- Standard: 1 CPU, 2 GB RAM (recommended)
- Pro: Autoscaling

Upgrade if: Response time >1.5s consistently
```

### Frontend Scaling
```
Vercel:
- Free tier: Sufficient for most traffic
- Pro: Same as free, but more build minutes
- Enterprise: Additional features

Usually never need upgrade (CDN handles scale)
```

---

## 9. Disaster Recovery

### Backup Strategy
```
MongoDB Atlas auto-backup:
- Daily snapshots: 35 days retention
- Point-in-time restore: Last 7 days
- Manual backup: Create anytime in UI
```

### Recovery Procedure
```
If database corrupted:
1. MongoDB Atlas UI → Backup & Restore
2. Select restore point
3. Restore to new cluster
4. Update MONGO_URI to new cluster
5. Restart backend service
```

### Rollback Procedure
```
If backend code broken:
1. Render UI → Deployments
2. Select previous good deployment
3. Click "Redeploy"
4. Service restarts with old code
```

---

## 10. Costs Estimation

### Monthly Costs (Production)

**Vercel (Frontend):**
- Free tier: $0
- Pro tier: $20/month
- Typical: $0-20/month

**Render (Backend & ML):**
- Free tier: $0 (sleeps)
- Starter tier (always-on): $7/month each = $14/month
- Standard tier: $12/month each = $24/month
- Typical: $14-40/month

**MongoDB Atlas:**
- Free tier: $0 (512 MB)
- Shared M2: $9/month
- Shared M5: $57/month
- Typical: $9-57/month

**Total Typical:** $23-117/month
- Minimal (free tiers): $0
- Moderate (free frontend, starter backend/ML, free DB): $14/month
- Production (pro frontend, standard backend/ML, M5 DB): $100+/month

---

## 11. Production Checklist (Before Launch)

### Code
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables not in code
- [ ] API URL using VITE_API_URL env var

### Security
- [ ] HTTPS enabled (Vercel/Render default)
- [ ] JWT_SECRET is random & long (32+ chars)
- [ ] CORS configured (only production domain)
- [ ] Rate limiting enabled

### Database
- [ ] IP whitelist configured
- [ ] Backup enabled
- [ ] Indexes created (performance)
- [ ] Test data cleaned up

### Monitoring
- [ ] Health checks working
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Alert notifications set up

### Documentation
- [ ] README.md points to production URL
- [ ] API docs updated with prod endpoints
- [ ] Deployment steps documented
- [ ] Emergency contacts listed

---

## 12. Troubleshooting Production

### Issue: Very slow API responses
```
Check:
1. MongoDB: Is database connection slow?
2. ML Service: Is it timing out?
3. Backend: Check logs for bottlenecks

Solution:
1. Upgrade database tier (M2 → M5)
2. Upgrade backend plan (Starter → Standard)
3. Add caching layer (Redis)
```

### Issue: Frontend shows 404
```
Check:
1. Vercel deployment successful?
2. VITE_API_URL correct and reachable?

Solution:
1. Redeploy to Vercel
2. Clear browser cache (Cmd+Shift+R)
```

### Issue: "Cannot GET /api/health" or CORS errors
```
Check:
1. Backend is running (health check)
2. VITE_API_URL matches API URL in Render
3. Frontend is calling correct URL

Solution:
1. Verify Render service status
2. Redeploy backend if showing error
3. Check environment variables
```

---

## Resources

- [Vercel Deploy Docs](https://vercel.com/docs)
- [Render Deployment Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Last Updated:** March 27, 2026 | **Status:** Production-Ready
