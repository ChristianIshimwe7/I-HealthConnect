// backend/src/routes/referrals.ts

import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/referrals ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userDistrict = req.user?.district;
    const { status } = req.query;

    let queryText = `
      SELECT
        r.id,
        p.name AS "patientName",
        p.age,
        p.district,
        p.sector AS "chwSector",
        rs.overall_score AS "riskScore",
        rs.risk_tier AS "riskTier",
        rs.chd_prob AS "chdProb",
        rs.ntd_prob AS "ntdProb",
        rs.renal_prob AS "renalProb",
        rs.abdominal_prob AS "abdominalProb",
        rs.cleft_prob AS "cleftProb",
        r.status,
        r.referral_reason AS "referralReason",
        r.referral_to AS "referralTo",
        r.sent_at AS "sentAt",
        v.gestational_age_weeks AS "gestationalWeeks"
      FROM referrals r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.chw_id = u.id
      LEFT JOIN risk_scores rs ON r.risk_score_id = rs.id
      LEFT JOIN visits v ON rs.visit_id = v.id
      WHERE r.deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
      if (!validStatuses.includes(status as string)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      queryText += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    if (userRole === 'chw') {
      queryText += ` AND u.district = $${paramIndex++}`;
      params.push(userDistrict);
    }

    queryText += ` ORDER BY r.sent_at DESC`;

    const result = await query(queryText, params);
    return res.json({ referrals: result.rows });

  } catch (err) {
    console.error('[Referrals] GET Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/referrals ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📋 Creating referral with body:', req.body);
    
    const { patient_id, chw_id, referral_reason, referral_to, status } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Check if patient exists
    const patientCheck = await query(
      'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL',
      [patient_id]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get risk score - using id DESC instead of created_at
    const riskScoreResult = await query(
      `SELECT id, overall_score, risk_tier
       FROM risk_scores
       WHERE patient_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [patient_id]
    );

    let riskScoreId = null;
    if (riskScoreResult.rows.length > 0) {
      riskScoreId = riskScoreResult.rows[0].id;
    }

    // Insert referral
    const result = await query(
      `INSERT INTO referrals
       (patient_id, chw_id, risk_score_id, referral_reason, referral_to, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        patient_id,
        chw_id || req.user?.id || null,
        riskScoreId,
        referral_reason || null,
        referral_to || null,
        status || 'pending'
      ]
    );

    console.log('✅ Referral created:', result.rows[0].id);

    return res.status(201).json({
      success: true,
      referral: result.rows[0]
    });

  } catch (err) {
    console.error('[Referrals] Create error:', err);
    return res.status(500).json({
      error: 'Failed to create referral',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// ── GET /api/referrals/:id ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
         r.id,
         p.name AS "patientName",
         p.age,
         p.district,
         p.sector AS "chwSector",
         rs.overall_score AS "riskScore",
         rs.risk_tier AS "riskTier",
         r.status,
         r.referral_reason AS "referralReason",
         r.referral_to AS "referralTo",
         r.sent_at AS "sentAt"
       FROM referrals r
       LEFT JOIN patients p ON r.patient_id = p.id
       LEFT JOIN risk_scores rs ON r.risk_score_id = rs.id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    return res.json({ referral: result.rows[0] });

  } catch (err) {
    console.error('[Referrals] Get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/referrals/:id/status ──
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, approved, completed, cancelled'
      });
    }

    const checkResult = await query(
      'SELECT id FROM referrals WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    const result = await query(
      `UPDATE referrals
       SET status = $1,
           reviewed_at = NOW(),
           reviewed_by = $2,
           updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [status, req.user!.id, id]
    );

    return res.json({
      success: true,
      message: `Referral ${status} successfully`,
      status: status,
      referral: result.rows[0]
    });

  } catch (err) {
    console.error('[Referrals] Status error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
