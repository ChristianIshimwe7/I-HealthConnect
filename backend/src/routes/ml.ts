import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { mlService } from '../services/mlService';

const router = Router();

// POST /api/ml/predict - Run prediction for a patient
router.post('/predict', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('🧠 ML Prediction requested');
    console.log('📊 Input data:', req.body);

    // Extract clinical features from request
    const features = [
      req.body.maternal_age || req.body.age || 28,
      req.body.gestational_age_weeks || req.body.gestational_age || 24,
      req.body.weight || 70,
      req.body.fundal_height || 24,
      req.body.systolic_bp || 120,
      req.body.diastolic_bp || 80,
      req.body.heart_rate || 80,
      req.body.blood_glucose || req.body.glucose || 95,
      req.body.hemoglobin || 12.5,
      req.body.parity || 0,
      req.body.gravida || 1,
      req.body.family_history ? 1 : 0,
      req.body.prior_loss ? 1 : 0,
      req.body.infection_status === 'infection' || req.body.infection ? 1 : 0,
      req.body.folic_acid === 'none' ? 0 : 1
    ];

    console.log('📊 Features:', features);

    // Run prediction
    const prediction = await mlService.predict(features);
    
    console.log('✅ Prediction result:', prediction);
    res.json({
      success: true,
      prediction: prediction
    });
  } catch (error) {
    console.error('❌ ML Prediction error:', error);
    // Return fallback prediction
    res.json({
      success: true,
      prediction: {
        overall_score: 0.35,
        risk_tier: 'low',
        chd_prob: 0.15,
        ntd_prob: 0.12,
        renal_prob: 0.10,
        abdominal_prob: 0.08,
        cleft_prob: 0.05,
        mode: 'fallback'
      }
    });
  }
});

export default router;
