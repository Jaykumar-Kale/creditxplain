import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import creditRoutes from './routes/credit.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();

// Render and similar platforms sit behind a proxy.
app.set('trust proxy', 1);

const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

// Security Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: (origin, callback) => {
    // Allow tools/health checks with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });