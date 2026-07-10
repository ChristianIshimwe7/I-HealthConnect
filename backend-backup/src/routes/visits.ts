// backend/src/routes/visits.ts

import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── POST /api/visits ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      patient_id, 
      chw_id,
      gestational_age_weeks,
      symptoms,
      notes
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    const result = await query(
      `INSERT INTO visits (patient_id, chw_id, visit_date, gestational_age_weeks, symptoms, notes)
       VALUES ($1, $2, NOW(), $3, $4, $5)
       RETURNING id, patient_id, chw_id, gestational_age_weeks, symptoms, notes, created_at`,
      [
        patient_id,
        chw_id || req.user!.id,
        gestational_age_weeks || 20,
        symptoms || {},
        notes || null
      ]
    );

    return res.status(201).json({
      success: true,
      visit: result.rows[0]
    });

  } catch (error: any) {
    console.error('[Visits] Create error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;