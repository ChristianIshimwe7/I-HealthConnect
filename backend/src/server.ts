import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import patientsRoutes from './routes/patients';
import referralsRoutes from './routes/referrals';
import riskScoresRoutes from './routes/risk-scores';
import mlRoutes from './routes/ml';
import { mlService } from './services/mlService';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ✅ FIXED CORS Configuration
app.use(cors({
  origin: [
    'https://i-healthconnect-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'https://i-healthconnect.vercel.app',
    'https://i-healthconnect-git-main.vercel.app',
    // Add your frontend domain here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'I-HealthConnect API', version: '1.0.0', status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/risk-scores', riskScoresRoutes);
app.use('/api/ml', mlRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize ML service
mlService.initialize().catch(console.error);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
