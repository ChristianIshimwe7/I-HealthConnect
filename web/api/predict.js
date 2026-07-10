// web/api/predict.js - Vercel Serverless Function
// This function calls your local backend API for predictions

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await req.json();
    console.log('📝 Creating patient:', data.name);

    // 1. ── CREATE PATIENT ──
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        name: data.name,
        age: data.age,
        gender: data.gender,
        district: data.district || null,
        sector: data.sector || null,
        village: data.village || null,
        phone: data.phone || null,
      })
      .select()
      .single();

    if (patientError) {
      console.error('❌ Patient creation error:', patientError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create patient' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Patient created:', patient.id);

    // 2. ── CREATE VISIT ──
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        patient_id: patient.id,
        chw_id: 1,
        visit_date: new Date().toISOString(),
        gestational_age_weeks: data.gestational_age || 24,
        systolic_bp: data.systolic_bp || 120,
        diastolic_bp: data.diastolic_bp || 80,
        symptoms: {
          gravida: data.gravida || 1,
          parity: data.parity || 0,
          fundal_height: data.fundal_height || 20,
          glucose: data.glucose || 95,
          hemoglobin: data.hemoglobin || 12.5,
          weight: data.weight || 64,
          family_history: data.family_history || 'no',
          prior_loss: data.prior_loss || 'no',
          infection: data.infection || 'no',
          folic_acid: data.folic_acid || 'none',
        },
      })
      .select()
      .single();

    if (visitError) {
      console.error('❌ Visit creation error:', visitError);
    } else {
      console.log('✅ Visit created:', visit.id);
    }

    // 3. ── CALL LOCAL BACKEND ML PREDICTION ──
    let predictionResult = {
      chd_prob: 0.1,
      ntd_prob: 0.1,
      renal_prob: 0.1,
      abdominal_prob: 0.1,
      cleft_prob: 0.1,
      overall_score: 0.1,
      risk_tier: 'low'
    };

    try {
      const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:3000';
      
      const mlResponse = await fetch(`${BACKEND_URL}/api/ml/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patient.id,
          maternal_age: data.age || 28,
          gestational_age_weeks: data.gestational_age || 24,
          systolic_bp: data.systolic_bp || 120,
          diastolic_bp: data.diastolic_bp || 80,
          heart_rate: 80,
          blood_glucose: data.glucose || 95,
          hemoglobin: data.hemoglobin || 12.5,
          parity: data.parity || 0,
          previous_anomaly: false,
          family_history: data.family_history === 'yes',
          infection_status: data.infection === 'yes' ? 'infection' : 'none',
          medication_exposure: data.folic_acid === 'none' ? 'none' : 'folic_acid'
        })
      });

      if (mlResponse.ok) {
        const mlResult = await mlResponse.json();
        console.log('✅ ML Prediction from backend:', mlResult);
        
        if (mlResult.data?.prediction) {
          predictionResult = mlResult.data.prediction;
        }
      } else {
        const errorText = await mlResponse.text();
        console.warn('⚠️ Backend ML prediction failed:', mlResponse.status, errorText);
      }
    } catch (mlError) {
      console.warn('⚠️ Could not reach backend ML service:', mlError.message);
    }

    console.log('🧠 Final prediction:', predictionResult);

    // 4. ── UPDATE PATIENT WITH PREDICTION ──
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        chd_prob: predictionResult.chd_prob || 0,
        ntd_prob: predictionResult.ntd_prob || 0,
        renal_prob: predictionResult.renal_prob || 0,
        abdominal_prob: predictionResult.abdominal_prob || 0,
        cleft_prob: predictionResult.cleft_prob || 0,
        overall_score: predictionResult.overall_score || 0,
        risk_tier: predictionResult.risk_tier || 'low',
      })
      .eq('id', patient.id);

    if (updateError) {
      console.error('❌ Patient update error:', updateError);
    } else {
      console.log('✅ Patient updated with prediction');
    }

    // 5. ── SAVE TO RISK_SCORES ──
    const { error: riskError } = await supabase
      .from('risk_scores')
      .insert({
        patient_id: patient.id,
        visit_id: visit?.id || null,
        chd_prob: predictionResult.chd_prob || 0,
        ntd_prob: predictionResult.ntd_prob || 0,
        renal_prob: predictionResult.renal_prob || 0,
        abdominal_prob: predictionResult.abdominal_prob || 0,
        cleft_prob: predictionResult.cleft_prob || 0,
        overall_score: predictionResult.overall_score || 0,
        risk_tier: predictionResult.risk_tier || 'low',
        prediction_date: new Date().toISOString(),
      });

    if (riskError) {
      console.error('❌ Risk score error:', riskError);
    } else {
      console.log('✅ Risk score saved');
    }

    // 6. ── CREATE REFERRAL IF HIGH RISK ──
    if (predictionResult.risk_tier === 'high' || predictionResult.risk_tier === 'critical' || predictionResult.risk_tier === 'elevated') {
      console.log('🔍 HIGH RISK DETECTED! Creating referral...');

      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          patient_id: patient.id,
          chw_id: 1,
          sent_at: new Date().toISOString(),
          status: 'pending',
          referral_reason: `${predictionResult.risk_tier} risk detected (${Math.round(predictionResult.overall_score * 100)}% confidence)`,
          referral_to: 'District Hospital',
        });

      if (referralError) {
        console.error('❌ Referral creation error:', referralError);
      } else {
        console.log('✅ Referral created for high risk patient');
      }
    }

    // 7. ── RETURN RESPONSE ──
    return new Response(JSON.stringify({
      success: true,
      patient: patient,
      visit: visit,
      prediction: predictionResult,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
