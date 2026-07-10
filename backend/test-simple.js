// backend/test-simple.js

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing ML model...');

const modelPath = path.join(__dirname, '../models/clinical_model.onnx');

if (fs.existsSync(modelPath)) {
  console.log('✅ Model found at:', modelPath);
  console.log('📦 Model size:', (fs.statSync(modelPath).size / 1024).toFixed(2), 'KB');
  
  try {
    const ort = require('onnxruntime-node');
    console.log('✅ onnxruntime-node loaded');
    
    (async () => {
      try {
        const session = await ort.InferenceSession.create(modelPath);
        console.log('✅ Model loaded successfully!');
        
        const features = [
          28,   // age
          2,    // gravida
          1,    // parity
          24,   // gestational_age
          120,  // systolic_bp
          80,   // diastolic_bp
          22,   // fundal_height
          95,   // glucose
          12.5, // hemoglobin
          64,   // weight
          0,    // family_history
          0,    // prior_loss
          0,    // infection
          1,    // folic_acid
          0,    // placeholder
          0     // placeholder
        ];
        
        console.log('📊 Input features:', features);
        
        const inputTensor = new ort.Tensor(
          'float32',
          new Float32Array(features),
          [1, 16]
        );
        
        const results = await session.run({
          'clinical_features': inputTensor
        });
        
        const output = results['clinical_output'].data;
        console.log('✅ Inference successful!');
        console.log('📊 Output (5 anomaly probabilities):', Array.from(output));
        
        // Calculate overall score
        const overall_score = Array.from(output).reduce((a, b) => a + b, 0) / 5;
        console.log('📊 Overall score:', overall_score.toFixed(3));
        
        // Determine risk tier
        let risk_tier;
        if (overall_score > 0.7) {
          risk_tier = '🔴 HIGH RISK';
        } else if (overall_score > 0.4) {
          risk_tier = '🟡 ELEVATED RISK';
        } else {
          risk_tier = '🟢 LOW RISK';
        }
        console.log('📊 Risk tier:', risk_tier);
        
      } catch (error) {
        console.error('❌ Inference error:', error.message);
      }
    })();
    
  } catch (error) {
    console.error('❌ Failed to load onnxruntime:', error.message);
  }
  
} else {
  console.error('❌ Model not found at:', modelPath);
  console.log('📁 Please make sure the model exists at:', modelPath);
}