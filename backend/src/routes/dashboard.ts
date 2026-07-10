// backend/src/routes/dashboard.ts

import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/dashboard/stats ──
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(' Fetching dashboard stats...');

    // Total screened
    const screened = await query('SELECT COUNT(*) as count FROM visits');
    console.log(' Total screened:', screened.rows[0].count);

    // High risk flagged
    const highRisk = await query(
      "SELECT COUNT(*) as count FROM risk_scores WHERE risk_tier = 'high'"
    );
    console.log(' High risk:', highRisk.rows[0].count);

    // Referrals sent
    const referrals = await query('SELECT COUNT(*) as count FROM referrals');
    console.log(' Referrals:', referrals.rows[0].count);

    // Active CHWs
    const activeChws = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'chw' AND active = TRUE"
    );
    console.log(' Active CHWs:', activeChws.rows[0].count);

    // Total CHWs
    const totalChws = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'chw'"
    );
    console.log(' Total CHWs:', totalChws.rows[0].count);

    // Anomaly breakdown
    const breakdown = await query(
      `SELECT
         ROUND(AVG(chd_prob) * 100)::int as chd,
         ROUND(AVG(ntd_prob) * 100)::int as ntd,
         ROUND(AVG(renal_prob) * 100)::int as renal,
         ROUND(AVG(abdominal_prob) * 100)::int as abdominal,
         ROUND(AVG(cleft_prob) * 100)::int as cleft
       FROM risk_scores`
    );
    console.log(' Breakdown:', breakdown.rows[0]);

    // Recent referrals
    const recentReferrals = await query(
      `SELECT
         p.name AS "patientName",
         p.district,
         p.sector AS "chwSector",
         rs.risk_tier AS "riskTier",
         rs.overall_score AS "overallScore",
         r.sent_at AS "sentAt"
       FROM referrals r
       JOIN patients p ON r.patient_id = p.id
       JOIN risk_scores rs ON r.risk_score_id = rs.id
       ORDER BY r.sent_at DESC
       LIMIT 10`
    );
    console.log(' Recent referrals:', recentReferrals.rows.length);

    // District chart
    const districtChart = await query(
      `SELECT 
         p.district,
         COUNT(DISTINCT v.id) as screenings
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       WHERE p.district IS NOT NULL
       GROUP BY p.district
       ORDER BY screenings DESC
       LIMIT 10`
    );
    console.log(' District chart:', districtChart.rows.length);

    const totalScreened = parseInt(screened.rows[0]?.count || '0');
    const totalReferrals = parseInt(referrals.rows[0]?.count || '0');
    const referralRate = totalScreened > 0 ? Math.round((totalReferrals / totalScreened) * 100) : 0;

    const response = {
      totalScreened: totalScreened,
      highRiskFlagged: parseInt(highRisk.rows[0]?.count || '0'),
      referralsSent: totalReferrals,
      activeChws: parseInt(activeChws.rows[0]?.count || '0'),
      totalChws: parseInt(totalChws.rows[0]?.count || '0'),
      referralRate: referralRate,
      anomalyBreakdown: breakdown.rows[0] || { chd: 0, ntd: 0, renal: 0, abdominal: 0, cleft: 0 },
      recentReferrals: recentReferrals.rows,
      districtChart: districtChart.rows.map((row: any) => ({
        district: row.district || 'Unknown',
        screenings: parseInt(row.screenings)
      })),
    };

    console.log(' Dashboard response:', response);
    return res.json(response);

  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/dashboard/chw-performance ──
router.get('/chw-performance', authenticate, async (req: AuthRequest, res: Response) => {
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
       LEFT JOIN referrals r ON r.chw_id = u.id
         AND r.sent_at >= NOW() - INTERVAL '30 days'
       WHERE u.role = 'chw' AND u.active = TRUE
       GROUP BY u.id, u.name, u.sector
       ORDER BY screenings DESC`
    );

    return res.json({ chws: result.rows });
  } catch (err) {
    console.error('[Dashboard] CHW performance error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;