import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/patients ─────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { district, risk_tier, limit = '20', offset = '0' } = req.query as Record<string, string>;

  try {
    const filters: string[] = ['1=1'];
    const params: any[] = [];
    let i = 1;

    if (district) { filters.push(`p.district = $${i++}`); params.push(district); }
    if (risk_tier) { filters.push(`rs.risk_tier = $${i++}`); params.push(risk_tier); }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT
         p.id, p.name, p.age, p.gestational_age, p.gravida, p.parity,
         p.district, p.sector, p.created_at,
         rs.overall_score, rs.risk_tier,
         rs.chd_prob, rs.ntd_prob, rs.renal_prob, rs.abdominal_prob, rs.cleft_prob,
         v.visit_date, v.systolic_bp, v.diastolic_bp
       FROM patients p
       LEFT JOIN visits v     ON v.patient_id = p.id
       LEFT JOIN risk_scores rs ON rs.visit_id = v.id
       WHERE ${filters.join(' AND ')}
       ORDER BY v.visit_date DESC NULLS LAST
       LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const total = await query(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM patients p
       LEFT JOIN visits v ON v.patient_id = p.id
       LEFT JOIN risk_scores rs ON rs.visit_id = v.id
       WHERE ${filters.join(' AND ')}`,
      params.slice(0, -2)
    );

    return res.json({
      patients: result.rows,
      total: parseInt(total.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('[Patients] List error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/patients/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const patientResult = await query(
      'SELECT * FROM patients WHERE id = $1', [req.params.id]
    );
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitsResult = await query(
      `SELECT v.*, rs.overall_score, rs.risk_tier,
              rs.chd_prob, rs.ntd_prob, rs.renal_prob, rs.abdominal_prob, rs.cleft_prob
       FROM visits v
       LEFT JOIN risk_scores rs ON rs.visit_id = v.id
       WHERE v.patient_id = $1
       ORDER BY v.visit_date DESC`,
      [req.params.id]
    );

    const referralsResult = await query(
      `SELECT r.*, u.name AS reviewed_by_name
       FROM referrals r
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE r.patient_id = $1
       ORDER BY r.sent_at DESC`,
      [req.params.id]
    );

    return res.json({
      patient:   patientResult.rows[0],
      visits:    visitsResult.rows,
      referrals: referralsResult.rows,
    });
  } catch (err) {
    console.error('[Patients] Get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/patients/referrals/:id ────────────────────────────────────────
router.patch('/referrals/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const body = z.object({
      status: z.enum(['accepted', 'declined', 'completed']),
      note:   z.string().optional(),
    }).parse(req.body);

    await query(
      `UPDATE referrals
       SET status = $1, reviewed_at = NOW(), reviewed_by = $2
       WHERE id = $3`,
      [body.status, req.user!.id, req.params.id]
    );

    return res.json({ success: true });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid body', details: err.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
