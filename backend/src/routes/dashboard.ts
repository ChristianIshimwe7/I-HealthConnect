import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const district = (req.query.district as string) ?? req.user!.district;
  const period   = (req.query.period   as string) ?? 'month';

  const dateFilter = period === 'month'
    ? "DATE_TRUNC('month', v.visit_date) = DATE_TRUNC('month', NOW())"
    : period === '30d'
    ? "v.visit_date >= NOW() - INTERVAL '30 days'"
    : "DATE_TRUNC('quarter', v.visit_date) = DATE_TRUNC('quarter', NOW())";

  try {
    // Total screened this period
    const screened = await query(
      `SELECT COUNT(DISTINCT v.id) as count
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       WHERE p.district = $1 AND ${dateFilter}`,
      [district]
    );

    // High risk flagged
    const highRisk = await query(
      `SELECT COUNT(*) as count
       FROM risk_scores rs
       JOIN visits v ON rs.visit_id = v.id
       JOIN patients p ON v.patient_id = p.id
       WHERE p.district = $1 AND rs.risk_tier = 'high' AND ${dateFilter}`,
      [district]
    );

    // Referrals sent
    const referrals = await query(
      `SELECT COUNT(*) as count
       FROM referrals r
       JOIN patients p ON r.patient_id = p.id
       WHERE p.district = $1 AND ${dateFilter.replace('v.visit_date', 'r.sent_at')}`,
      [district]
    );

    // Active CHWs (users who have logged a visit in the period)
    const activeChws = await query(
      `SELECT COUNT(DISTINCT v.chw_id) as count
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       WHERE p.district = $1 AND ${dateFilter}`,
      [district]
    );

    // Anomaly breakdown — average probabilities across all scores
    const breakdown = await query(
      `SELECT
         ROUND(AVG(rs.chd_prob)       * 100)::int as chd,
         ROUND(AVG(rs.ntd_prob)       * 100)::int as ntd,
         ROUND(AVG(rs.renal_prob)     * 100)::int as renal,
         ROUND(AVG(rs.abdominal_prob) * 100)::int as abdominal,
         ROUND(AVG(rs.cleft_prob)     * 100)::int as cleft
       FROM risk_scores rs
       JOIN visits v ON rs.visit_id = v.id
       JOIN patients p ON v.patient_id = p.id
       WHERE p.district = $1 AND ${dateFilter}`,
      [district]
    );

    // Recent high-risk referrals
    const recentReferrals = await query(
      `SELECT
         p.name          AS "patientName",
         p.sector        AS "chwSector",
         rs.risk_tier    AS "riskTier",
         rs.overall_score AS "overallScore",
         r.sent_at       AS "sentAt"
       FROM referrals r
       JOIN patients p   ON r.patient_id = p.id
       JOIN risk_scores rs ON r.risk_score_id = rs.id
       WHERE p.district = $1
       ORDER BY r.sent_at DESC
       LIMIT 10`,
      [district]
    );

    return res.json({
      totalScreened:  parseInt(screened.rows[0].count),
      highRiskFlagged: parseInt(highRisk.rows[0].count),
      referralsSent:  parseInt(referrals.rows[0].count),
      activeChws:     parseInt(activeChws.rows[0].count),
      anomalyBreakdown: breakdown.rows[0] ?? { chd:0, ntd:0, renal:0, abdominal:0, cleft:0 },
      recentReferrals: recentReferrals.rows,
    });

  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/dashboard/chw-performance ───────────────────────────────────────
router.get('/chw-performance', authenticate, async (req: AuthRequest, res: Response) => {
  const district = (req.query.district as string) ?? req.user!.district;

  try {
    const result = await query(
      `SELECT
         u.id, u.name, u.sector,
         COUNT(DISTINCT v.id)    AS screenings,
         COUNT(DISTINCT r.id)    AS referrals,
         ROUND(AVG(
           EXTRACT(EPOCH FROM (v.updated_at - v.created_at)) / 60
         ), 1)                   AS avg_intake_minutes,
         MAX(v.visit_date)       AS last_active
       FROM users u
       LEFT JOIN visits v    ON v.chw_id = u.id
         AND v.visit_date >= NOW() - INTERVAL '30 days'
       LEFT JOIN referrals r ON r.patient_id IN (
         SELECT patient_id FROM visits WHERE chw_id = u.id
       )
       WHERE u.role = 'chw' AND u.district = $1 AND u.active = TRUE
       GROUP BY u.id, u.name, u.sector
       ORDER BY screenings DESC`,
      [district]
    );

    return res.json({ chws: result.rows });
  } catch (err) {
    console.error('[Dashboard] CHW performance error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
