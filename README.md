# CreditXplain - Explainable Credit Scoring System

Built for research and hackathon use cases using MERN with explainable AI concepts.

## Features

- Transparent credit scoring with SHAP-like explanations
- Plain-English decision justifications
- Bias and fairness monitoring dashboard
- What-if simulator to improve score scenarios
- PDF report generation
- Multi-step application flow
- JWT authentication and history tracking

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express, MongoDB, PDFKit
- ML Logic: Custom JavaScript scoring engine (no external AI API)

## Project Structure

```
creditxplain/
    client/
    server/
```

## Quick Start

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`.

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/credit/apply` - Submit credit application
- `GET /api/credit/history` - Application history
- `GET /api/credit/stats` - User statistics
- `GET /api/credit/bias-report` - Fairness metrics
- `GET /api/credit/:id` - Get one application
- `GET /api/reports/pdf/:id` - Download PDF report

## Environment Variables

See `server/.env.example` and `client/.env.example`.

## Production Notes

- Use a strong `JWT_SECRET`
- Keep `.env` files out of git
- Set proper CORS origin for deployment
