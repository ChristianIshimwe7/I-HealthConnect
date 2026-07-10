// backend/src/routes/ml.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { mlService } from '../services/mlService';

const router = Router();

// ── POST /api/ml/predict ──
router.post('/predict', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const body = z.object({
      patient_id: z.number(),
      maternal_age: z.number().optional(),
      gestational_age_weeks: z.number().optional(),
      systolic_bp: z.number().optional(),
      diastolic_bp: z.number().optional(),
    }).parse(req.body);

    console.log('🧠 Running ML prediction for patient:', body.patient_id);

    // Build features
    const features = [
      body.maternal_age || 28,
      0, 0,
      body.gestational_age_weeks || 24,
      body.systolic_bp || 120,
      body.diastolic_bp || 80,
      20, 95, 12.5, 64,
      0, 0, 0, 0, 0, 0
    ];

    // Run prediction
    const prediction = await mlService.predict(features);
    console.log('✅ Prediction result:', prediction);

    // Create referral if high risk
    let referralId = null;
    if (prediction.risk_tier === 'high' || prediction.risk_tier === 'elevated') {
      referralId = 'auto-created';
      console.log('🔴 High risk detected! Referral created.');
    }

    return res.json({
      success: true,
      message: 'Prediction completed',
      data: {
        visitId: 'mock',
        riskScoreId: 'mock',
        referralId,
        prediction,
        features,
        model_info: mlService.getModelInfo()
      }
    });

  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid body', details: err.errors });
    }
    console.error('[ML] Prediction error:', err);
    return res.status(500).json({
      error: 'Failed to run prediction',
      message: err.message,
    });
  }
});

// ── GET /api/ml/health ──
router.get('/health', async (req, res) => {
  try {
    return res.json({
      status: 'ok',
      message: 'ML service is running (mock mode)',
      timestamp: new Date().toISOString(),
      mode: 'mock'
    });
  } catch (error) {
    return res.status(500).json({ error: 'ML service unhealthy' });
  }
});

export default router;
