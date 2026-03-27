# CreditXplain - Explainable Credit Scoring System

An AI-powered credit scoring system with transparency and explainability at its core. This project provides transparent credit decisions with detailed explanations, bias detection, and what-if simulations.

## Project Structure

```
creditxplain/
├── client/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context for state management
│   │   └── utils/         # Utility functions
│   └── package.json
└── server/          # Node.js/Express backend API
    ├── controllers/  # Route handlers
    ├── models/       # Database models
    ├── routes/       # API routes
    ├── middleware/   # Express middleware
    ├── utils/        # Utility functions
    └── package.json
```

## Features

- **Explainable Scores**: Detailed explanations for credit scoring decisions
- **Bias Detection**: Monitor and identify potential biases in credit assessments
- **What-If Simulation**: Test different scenarios and see how they impact credit scores
- **Secure Authentication**: JWT-based user authentication
- **Comprehensive Reporting**: Generate detailed credit reports in PDF format

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for database)
- Python 3.8+ (for ML engine)

## Installation

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` with your configuration:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/creditscore
JWT_SECRET=your_secure_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev      # Development with auto-reload
npm start        # Production
```

### Frontend Setup

```bash
cd client
npm install
```

Start the development server:

```bash
npm run dev
```

The client will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Credit Scoring
- `POST /api/credit/score` - Calculate credit score with explanation
- `GET /api/credit/history` - Get scoring history
- `POST /api/credit/what-if` - Run what-if simulation

### Reports
- `GET /api/reports/:id` - Get credit report
- `POST /api/reports/generate` - Generate PDF report

## Environment Variables

### Server (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (change in production)
- `ML_SERVICE_URL` - URL of the ML engine service
- `NODE_ENV` - Environment (development/production)

### ML Engine (.env in ml/)
Configure as needed for your ML service

## Development

### Running Tests

```bash
cd server
npm test

cd ../client
npm test
```

### Building for Production

```bash
# Frontend
cd client
npm run build

# Backend is run directly with Node.js
cd ../server
npm start
```

## Security Notes

- **Always** use a strong JWT_SECRET in production
- Never commit `.env` files to version control
- Use environment-specific configuration for different deployment stages
- Keep dependencies updated with `npm audit`

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with:**
- React 18 + Vite
- Node.js + Express
- MongoDB
- TailwindCSS
- Recharts for data visualization
