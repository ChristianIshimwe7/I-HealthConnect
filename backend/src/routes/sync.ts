import { Router, Response } from 'express';
import { z } from 'zod';
import { query, getClient } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Zod validation schemas ────────────────────────────────────────────────────
const PatientSchema = z.object({
  name:             z.string().min(1),
  age:              z.number().int().min(10).max(60),
  gravida:          z.number().int().min(1),
  parity:           z.number().int().min(0),
  gestational_age:  z.number().int().min(4).max(42),
  district:         z.string().optional(),
  sector:           z.string().optional(),
});

const VisitSchema = z.object({
  systolic_bp:    z.number().min(60).max(220),
  diastolic_bp:   z.number().min(40).max(140),
  fundal_height:  z.number().min(5).max(45),
  glucose:        z.number().min(40).max(400),
  hemoglobin:     z.number().min(4).max(20),
  weight:         z.number().min(30).max(200),
  family_history: z.boolean(),
  prior_loss:     z.boolean(),
  infection:      z.boolean(),
  folic_acid:     z.enum(['none', 'first', 'ongoing']),
  visit_date:     z.string().optional(),
});

const RiskScoreSchema = z.object({
  overall_score:  z.number().min(0).max(1),
  chd_prob:       z.number().min(0).max(1),
  ntd_prob:       z.number().min(0).max(1),
  renal_prob:     z.number().min(0).max(1),
  abdominal_prob: z.number().min(0).max(1),
  cleft_prob:     z.number().min(0).max(1),
  risk_tier:      z.enum(['high', 'elevated', 'low']),
});

const ReferralSchema = z.object({
  chw_note: z.string().optional(),
  status:   z.enum(['pending', 'accepted', 'declined', 'completed']).optional(),
}).optional();

const RecordSchema = z.object({
  patient:    PatientSchema,
  visit:      VisitSchema,
  risk_score: RiskScoreSchema,
  referral:   ReferralSchema,
});

const SyncBodySchema = z.object({
  records: z.array(RecordSchema).min(1).max(500),
});

// ── POST /api/sync/records ────────────────────────────────────────────────────
router.post('/records', authenticate, async (req: AuthRequest, res: Response) => {
  let inserted = 0;
  let skipped  = 0;

  // 1. Validate body
  let body: z.infer<typeof SyncBodySchema>;
  try {
    body = SyncBodySchema.parse(req.body);
  } catch (err: any) {
    return res.status(400).json({ error: 'Invalid request body', details: err.errors });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    for (const record of body.records) {
      const { patient, visit, risk_score, referral } = record;

      // 2. Skip duplicates (same patient name + visit date)
      const visitDate = visit.visit_date ?? new Date().toISOString().split('T')[0];
      const dupCheck = await client.query(
        `SELECT p.id FROM patients p
         JOIN visits v ON v.patient_id = p.id
         WHERE p.name = $1 AND DATE(v.visit_date) = $2
         LIMIT 1`,
        [patient.name, visitDate]
      );
      if (dupCheck.rows.length > 0) {
        skipped++;
        continue;
      }

      // 3. Insert patient
      const patientRes = await client.query(
        `INSERT INTO patients
         (chw_id, name, age, gravida, parity, gestational_age, district, sector)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [req.user!.id, patient.name, patient.age, patient.gravida,
         patient.parity, patient.gestational_age,
         patient.district ?? req.user!.district,
         patient.sector ?? null]
      );
      const patientId = patientRes.rows[0].id;

      // 4. Insert visit
      const visitRes = await client.query(
        `INSERT INTO visits
         (patient_id, chw_id, systolic_bp, diastolic_bp, fundal_height,
          glucose, hemoglobin, weight, family_history, prior_loss,
          infection, folic_acid, visit_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [patientId, req.user!.id,
         visit.systolic_bp, visit.diastolic_bp, visit.fundal_height,
         visit.glucose, visit.hemoglobin, visit.weight,
         visit.family_history, visit.prior_loss,
         visit.infection, visit.folic_acid,
         visitDate]
      );
      const visitId = visitRes.rows[0].id;

      // 5. Insert risk score
      const scoreRes = await client.query(
        `INSERT INTO risk_scores
         (visit_id, overall_score, chd_prob, ntd_prob, renal_prob,
          abdominal_prob, cleft_prob, risk_tier)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [visitId, risk_score.overall_score, risk_score.chd_prob,
         risk_score.ntd_prob, risk_score.renal_prob,
         risk_score.abdominal_prob, risk_score.cleft_prob,
         risk_score.risk_tier]
      );
      const scoreId = scoreRes.rows[0].id;

      // 6. Insert referral if present
      if (referral !== undefined && risk_score.risk_tier !== 'low') {
        await client.query(
          `INSERT INTO referrals (patient_id, risk_score_id, chw_note, status)
           VALUES ($1,$2,$3,$4)`,
          [patientId, scoreId,
           referral?.chw_note ?? '',
           referral?.status ?? 'pending']
        );
      }

      inserted++;
    }

    await client.query('COMMIT');
    return res.json({ success: true, inserted, skipped });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Sync] Transaction failed:', err);
    return res.status(500).json({ error: 'Sync failed. Transaction rolled back.' });
  } finally {
    client.release();
  }
});

// ── GET /api/sync/status ──────────────────────────────────────────────────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total_synced,
              MAX(created_at) as last_sync
       FROM risk_scores rs
       JOIN visits v ON rs.visit_id = v.id
       WHERE v.chw_id = $1`,
      [req.user!.id]
    );
    return res.json({
      totalSynced: parseInt(result.rows[0].total_synced),
      lastSync:    result.rows[0].last_sync,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
