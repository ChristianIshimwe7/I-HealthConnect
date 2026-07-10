// backend/src/routes/patients.ts
import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/patients ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const countResult = await query('SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL');
    const total = parseInt(countResult.rows[0].count);
    
    const result = await query(`
      SELECT 
        id, name, age, gender, district, sector, village, phone,
        chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob,
        overall_score, risk_tier,
        chw_id, created_at, updated_at
      FROM patients 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    console.log(`✅ Found ${result.rows.length} patients (total: ${total})`);
    
    return res.json({
      patients: result.rows,
      total: total,
      limit: limit,
      offset: offset
    });
  } catch (err) {
    console.error('[Patients] Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// ── POST /api/patients ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, gender, district, sector, village, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await query(
      `INSERT INTO patients (name, age, gender, district, sector, village, phone, chw_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, age || null, gender || null, district || null, sector || null, village || null, phone || null, req.user?.id || null]
    );

    return res.status(201).json({
      success: true,
      patient: result.rows[0]
    });
  } catch (err) {
    console.error('[Patients] Create error:', err);
    return res.status(500).json({
      error: 'Failed to create patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// ── PATCH /api/patients/:id ── (Update prediction results)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { overall_score, risk_tier, chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob } = req.body;

    const result = await query(
      `UPDATE patients 
       SET overall_score = $1, risk_tier = $2, chd_prob = $3, ntd_prob = $4, renal_prob = $5, abdominal_prob = $6, cleft_prob = $7, updated_at = NOW()
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [overall_score, risk_tier, chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[Patients] Update error:', err);
    return res.status(500).json({
      error: 'Failed to update patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// ── GET /api/patients/:id ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        id, name, age, gender, district, sector, village, phone,
        chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob,
        overall_score, risk_tier,
        chw_id, created_at, updated_at
       FROM patients 
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[Patients] Get error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
