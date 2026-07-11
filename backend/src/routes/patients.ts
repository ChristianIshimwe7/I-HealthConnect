import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/patients ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('🔍 GET /api/patients called');
  console.log('👤 User:', req.user?.id, req.user?.role);
  
  try {
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string || '';

    console.log(`📊 Fetching patients with limit: ${limit}, offset: ${offset}`);

    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR district ILIKE $${paramIndex} OR sector ILIKE $${paramIndex} OR village ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM patients ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    console.log(`📊 Total patients: ${total}`);

    const result = await query(
      `SELECT
        id, name, age, gender, district, sector, village, phone,
        chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob,
        overall_score, risk_tier,
        chw_id, created_at, updated_at
      FROM patients
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    console.log(`✅ Found ${result.rows.length} patients`);

    return res.json({
      data: result.rows,
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

// ── GET /api/patients/:id ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/patients/${id}`);

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

// ── POST /api/patients ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Creating patient with body:', req.body);
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

    console.log(`✅ Patient created: ${result.rows[0].id}`);

    return res.status(201).json({
      success: true,
      data: result.rows[0]
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

    console.log(`📝 Updating patient ${id} with risk scores`);

    const result = await query(
      `UPDATE patients
       SET overall_score = $1,
           risk_tier = $2,
           chd_prob = $3,
           ntd_prob = $4,
           renal_prob = $5,
           abdominal_prob = $6,
           cleft_prob = $7,
           updated_at = NOW()
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [overall_score, risk_tier, chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[Patients] Patch error:', err);
    return res.status(500).json({
      error: 'Failed to update patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

// ── DELETE /api/patients/:id ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting patient ${id}`);

    const result = await query(
      `UPDATE patients
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('[Patients] Delete error:', err);
    return res.status(500).json({
      error: 'Failed to delete patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
