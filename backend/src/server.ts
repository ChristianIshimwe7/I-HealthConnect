import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://i-health-connect-f7.vercel.app', 'https://i-health-connect-f7-nlbq0sl3h-christian-ishimwe7.vercel.app', 'https://*.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ name: 'I-HealthConnect API', version: '1.0.0', status: 'healthy', endpoints: { health: '/health', api: '/api', auth: '/api/auth' } });
});
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
