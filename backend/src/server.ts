// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import mlRoutes from './routes/ml';
import patientsRoutes from './routes/patients';
import referralsRoutes from './routes/referrals';
import riskScoresRoutes from './routes/riskScores';

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 Starting I-HealthConnect Backend...');

// Allow CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://i-health-connect-f7.vercel.app',
    'https://*.vercel.app',
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/risk-scores', riskScoresRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'I-HealthConnect API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'I-HealthConnect API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      patients: '/api/patients',
      referrals: '/api/referrals',
      ml: '/api/ml/predict'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 I-HealthConnect API running on port ${port}`);
  console.log(`   Health: http://localhost:${port}/health`);
});
