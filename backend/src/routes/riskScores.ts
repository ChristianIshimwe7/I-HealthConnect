// backend/src/routes/riskScores.ts

import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/risk-scores ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching risk scores...');

    const result = await query(`
      SELECT 
        id,
        patient_id,
        overall_score,
        risk_tier,
        chd_prob,
        ntd_prob,
        renal_prob,
        abdominal_prob,
        cleft_prob,
        prediction_date
      FROM risk_scores
      ORDER BY prediction_date ASC
    `);

    console.log(`✅ Found ${result.rows.length} risk scores`);

    return res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('[Risk Scores] Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
