// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './db/database';

import authRouter      from './routes/auth';
import syncRouter      from './routes/sync';
import dashboardRouter from './routes/dashboard';
import patientsRouter  from './routes/patients';

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'I-HealthConnect API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/sync',      syncRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/patients',  patientsRouter);

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 I-HealthConnect API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
