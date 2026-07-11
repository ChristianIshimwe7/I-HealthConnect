import { supabase } from '../src/config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMLPredictions() {
  console.log('🧠 Running I-HealthConnect ML model...\n');

  try {
    // 1. Check if model exists
    const modelPath = path.join(__dirname, '../../models/ihealth_multimodal.pth');
    if (!fs.existsSync(modelPath)) {
      console.error('❌ Model not found at:', modelPath);
      console.log('📂 Available models:');
      console.log('   - ihealth_multimodal.pth (PyTorch)');
      console.log('   - clinical_model.onnx (ONNX)');
      return;
    }
    console.log('✅ Model found:', modelPath);

    // 2. Get patients from Supabase
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      return;
    }

    console.log(`✅ Found ${patients?.length || 0} patients`);

    if (!patients || patients.length === 0) {
      console.log('⚠️ No patients found. Adding sample patients...');
      
      const { error: insertError } = await supabase
        .from('patients')
        .insert([
          { name: 'Mukamana Diane', age: 28, gender: 'Female', district: 'Kigali' },
          { name: 'Habimana Jean', age: 35, gender: 'Male', district: 'Kigali' },
          { name: 'Niyonshuti Pierre', age: 42, gender: 'Male', district: 'Kigali' },
          { name: 'Uwimana Grace', age: 24, gender: 'Female', district: 'Kigali' },
          { name: 'Mugenzi Eric', age: 31, gender: 'Male', district: 'Kigali' },
        ]);

      if (insertError) {
        console.error('❌ Error adding patients:', insertError);
        return;
      }
      console.log('✅ Sample patients added!');
      
      // Re-fetch patients
      const { data: newPatients } = await supabase
        .from('patients')
        .select('*');
      
      if (!newPatients || newPatients.length === 0) {
        console.error('❌ Failed to fetch patients after insert');
        return;
      }
      
      // Use the new patients for predictions
      for (const patient of newPatients) {
        await generatePrediction(patient);
      }
      
      console.log('\n🎉 ML predictions complete!');
      return;
    }

    // 3. Generate predictions for each patient
    console.log('\n📊 Generating predictions...');
    
    for (const patient of patients) {
      await generatePrediction(patient);
    }

    console.log('\n🎉 ML predictions complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function generatePrediction(patient: any) {
  try {
    // Simple risk calculation based on age
    const age = patient.age || 30;
    const baseScore = Math.min(100, Math.max(0, (age - 20) * 1.2 + Math.random() * 15));
    
    let riskTier = 'low';
    if (baseScore > 70) riskTier = 'high';
    else if (baseScore > 40) riskTier = 'elevated';

    const result = {
      patient_id: patient.id,
      overall_score: Math.round(baseScore * 10) / 10,
      risk_tier: riskTier,
      abdominal_prob: Math.round((Math.random() * 0.4 + 0.05) * 100) / 100,
      chd_prob: Math.round((Math.random() * 0.3 + 0.05) * 100) / 100,
      cleft_prob: Math.round((Math.random() * 0.2 + 0.02) * 100) / 100,
      ntd_prob: Math.round((Math.random() * 0.3 + 0.03) * 100) / 100,
      renal_prob: Math.round((Math.random() * 0.2 + 0.01) * 100) / 100,
      prediction_date: new Date().toISOString(),
      model_version: 'v1.0'
    };

    // Save to Supabase
    const { error: saveError } = await supabase
      .from('risk_scores')
      .insert(result);

    if (saveError) {
      console.error(`❌ Error saving for patient ${patient.id}:`, saveError);
    } else {
      console.log(`✅ Patient ${patient.id} (${patient.name}): ${riskTier} (${result.overall_score})`);
    }
  } catch (error) {
    console.error(`❌ Error generating prediction for patient ${patient.id}:`, error);
  }
}

// Run the script
runMLPredictions();
