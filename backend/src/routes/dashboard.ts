import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get patients with risk scores
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name, age, gender, district, risk_tier, overall_score');

    if (patientsError) {
      console.error('❌ Patients error:', patientsError);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    const totalPatients = patients?.length || 0;
    console.log('✅ Total patients:', totalPatients);

    // Count risk tiers
    let highRisk = 0, elevatedRisk = 0, lowRisk = 0;
    patients?.forEach((p: any) => {
      if (p.risk_tier === 'high') highRisk++;
      else if (p.risk_tier === 'elevated') elevatedRisk++;
      else if (p.risk_tier === 'low') lowRisk++;
    });

    // District chart
    const districtCounts = (patients || []).reduce((acc: any, p: any) => {
      const district = p.district || 'Unknown';
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {});

    const districtChart = Object.entries(districtCounts).map(([district, count]) => ({
      district,
      screenings: count as number
    }));

    // Anomaly breakdown
    const totalWithRisk = patients?.filter((p: any) => p.risk_tier)?.length || 0;
    const anomalyBreakdown = [
      { label: 'High Risk', prob: totalWithRisk > 0 ? highRisk / totalWithRisk : 0 },
      { label: 'Elevated', prob: totalWithRisk > 0 ? elevatedRisk / totalWithRisk : 0 },
      { label: 'Low Risk', prob: totalWithRisk > 0 ? lowRisk / totalWithRisk : 0 }
    ];

    const stats = {
      totalScreened: totalPatients,
      highRiskFlagged: highRisk,
      elevatedRiskFlagged: elevatedRisk,
      lowRiskFlagged: lowRisk,
      referralsSent: 0,
      referralRate: 0,
      activeCHWs: 0,
      totalCHWs: 0,
      lowRisk: lowRisk,
      elevatedRisk: elevatedRisk,
      anomalyBreakdown: anomalyBreakdown,
      recentReferrals: [],
      districtChart: districtChart
    };

    console.log('✅ Dashboard stats sent:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
