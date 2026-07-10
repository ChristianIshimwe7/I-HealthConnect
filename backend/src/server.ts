import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://i-healthconnect.vercel.app'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ name: 'I-HealthConnect API', version: '1.0.0', status: 'healthy' });
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
