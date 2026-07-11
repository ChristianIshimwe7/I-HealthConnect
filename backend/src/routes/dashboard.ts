import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats from your ML model data...');

    // 1. Get total patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, district, name');

    if (patientsError) {
      console.error('❌ Patients error:', patientsError);
      return res.status(500).json({ error: 'Failed to fetch patients', details: patientsError });
    }

    const totalPatients = patients?.length || 0;
    console.log('✅ Total patients:', totalPatients);

    // 2. Get risk scores from your ML model (using your actual column names)
    const { data: riskScores, error: riskError } = await supabase
      .from('risk_scores')
      .select('*')
      .order('prediction_date', { ascending: false });

    if (riskError) {
      console.error('❌ Risk scores error:', riskError);
    }

    console.log('✅ Risk scores found:', riskScores?.length || 0);

    // 3. Calculate risk counts from your model data
    let highRisk = 0;
    let elevatedRisk = 0;
    let lowRisk = 0;

    // Get the latest risk score for each patient
    const latestRiskPerPatient = new Map();
    (riskScores || []).forEach((r: any) => {
      const patientId = r.patient_id;
      if (!latestRiskPerPatient.has(patientId) || 
          new Date(r.prediction_date) > new Date(latestRiskPerPatient.get(patientId).prediction_date)) {
        latestRiskPerPatient.set(patientId, r);
      }
    });

    // Count risks from the latest predictions
    latestRiskPerPatient.forEach((r: any) => {
      if (r.risk_tier === 'high') highRisk++;
      else if (r.risk_tier === 'elevated') elevatedRisk++;
      else if (r.risk_tier === 'low') lowRisk++;
    });

    console.log('✅ Risk counts - High:', highRisk, 'Elevated:', elevatedRisk, 'Low:', lowRisk);

    // 4. Get referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, patient_id, referral_to, status, sent_at');

    if (referralsError) {
      console.error('❌ Referrals error:', referralsError);
    }

    const referralsCount = referrals?.length || 0;
    console.log('✅ Referrals:', referralsCount);

    // 5. Get CHWs (users with role 'chw')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('role');

    if (usersError) {
      console.error('❌ Users error:', usersError);
    }

    const chwCount = (users || []).filter((u: any) => u.role === 'chw').length;
    console.log('✅ CHWs:', chwCount);

    // 6. Get anomaly breakdown from your model predictions
    const anomalyBreakdown = [
      { label: 'High Risk', prob: totalPatients > 0 ? highRisk / totalPatients : 0 },
      { label: 'Elevated', prob: totalPatients > 0 ? elevatedRisk / totalPatients : 0 },
      { label: 'Low Risk', prob: totalPatients > 0 ? lowRisk / totalPatients : 0 }
    ];

    // 7. Get district chart
    const districtCounts = (patients || []).reduce((acc: any, p: any) => {
      const district = p.district || 'Unknown';
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {});

    const districtChart = Object.entries(districtCounts).map(([district, count]) => ({
      district,
      screenings: count as number
    }));

    // 8. Get recent referrals
    const recentReferrals = (referrals || []).slice(0, 5).map((r: any) => {
      const patient = patients?.find((p: any) => p.id === r.patient_id);
      return {
        id: r.id,
        name: patient?.name || 'Patient ' + r.patient_id,
        district: patient?.district || 'Kigali',
        tier: r.status === 'pending' ? 'elevated' : 'low',
        score: 0,
        time: new Date(r.sent_at || r.created_at).toLocaleDateString()
      };
    });

    // Prepare response with your ML model data
    const stats = {
      totalScreened: totalPatients,
      highRiskFlagged: highRisk,
      referralsSent: referralsCount,
      referralRate: totalPatients > 0 ? (referralsCount / totalPatients) * 100 : 0,
      activeCHWs: chwCount,
      totalCHWs: chwCount,
      lowRisk: lowRisk,
      elevatedRisk: elevatedRisk,
      anomalyBreakdown: anomalyBreakdown,
      recentReferrals: recentReferrals,
      districtChart: districtChart
    };

    console.log('✅ Dashboard stats sent with model data:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
