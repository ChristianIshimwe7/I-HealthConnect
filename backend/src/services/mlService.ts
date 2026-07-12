// backend/src/services/mlService.ts - Fast Mock Mode with Realistic Predictions

interface PredictionResult {
  chd_prob: number;
  ntd_prob: number;
  renal_prob: number;
  abdominal_prob: number;
  cleft_prob: number;
  overall_score: number;
  risk_tier: 'low' | 'elevated' | 'high';
}

class MLService {
  private initialized: boolean = true;

  async initialize(): Promise<void> {
    console.log('✅ ML Service running in MOCK mode with realistic predictions');
    this.initialized = true;
  }

  async predict(clinicalFeatures: number[]): Promise<PredictionResult> {
    // Extract clinical features
    const maternalAge = clinicalFeatures[0] || 28;
    const gestationalAge = clinicalFeatures[1] || 24;
    const weight = clinicalFeatures[2] || 70;
    const fundalHeight = clinicalFeatures[3] || 24;
    const systolicBP = clinicalFeatures[4] || 120;
    const diastolicBP = clinicalFeatures[5] || 80;
    const heartRate = clinicalFeatures[6] || 80;
    const glucose = clinicalFeatures[7] || 95;
    const hemoglobin = clinicalFeatures[8] || 12.5;
    const parity = clinicalFeatures[9] || 0;
    const gravida = clinicalFeatures[10] || 1;
    const familyHistory = clinicalFeatures[11] || 0;
    const priorLoss = clinicalFeatures[12] || 0;
    const infection = clinicalFeatures[13] || 0;
    const folicAcid = clinicalFeatures[14] || 1;

    // Calculate risk score based on multiple factors
    let riskScore = 0.05;
    
    // Age factors
    if (maternalAge > 35) riskScore += 0.25;
    if (maternalAge < 18) riskScore += 0.15;
    
    // Blood pressure factors
    if (systolicBP > 140 || diastolicBP > 90) riskScore += 0.2;
    if (systolicBP > 160 || diastolicBP > 100) riskScore += 0.3;
    
    // Glucose factors
    if (glucose > 140) riskScore += 0.2;
    if (glucose > 200) riskScore += 0.3;
    
    // Hemoglobin factors
    if (hemoglobin < 10) riskScore += 0.15;
    if (hemoglobin < 8) riskScore += 0.3;
    
    // Weight factors
    if (weight > 90) riskScore += 0.1;
    if (weight < 50) riskScore += 0.1;
    
    // Gestational age factors
    if (gestationalAge < 20 || gestationalAge > 38) riskScore += 0.1;
    
    // Other factors
    if (familyHistory > 0) riskScore += 0.2;
    if (priorLoss > 0) riskScore += 0.15;
    if (infection > 0) riskScore += 0.2;
    if (folicAcid === 0) riskScore += 0.1; // No folic acid
    
    // Parity factors
    if (parity > 4) riskScore += 0.1;
    if (gravida > 4) riskScore += 0.05;

    // Normalize to 0-1 range with some randomness
    riskScore = Math.min(Math.max(riskScore, 0.01), 0.95);
    
    // Add slight randomness for realistic variation
    riskScore = Math.min(0.95, riskScore + (Math.random() * 0.08 - 0.04));

    // Determine risk tier
    let risk_tier: 'low' | 'elevated' | 'high';
    if (riskScore > 0.6) risk_tier = 'high';
    else if (riskScore > 0.35) risk_tier = 'elevated';
    else risk_tier = 'low';

    // Generate individual anomaly probabilities
    const baseProb = riskScore;
    return {
      chd_prob: Math.min(baseProb * (1.1 + Math.random() * 0.2), 0.95),
      ntd_prob: Math.min(baseProb * (1.0 + Math.random() * 0.2), 0.9),
      renal_prob: Math.min(baseProb * (0.9 + Math.random() * 0.2), 0.85),
      abdominal_prob: Math.min(baseProb * (0.8 + Math.random() * 0.2), 0.8),
      cleft_prob: Math.min(baseProb * (0.7 + Math.random() * 0.2), 0.75),
      overall_score: riskScore,
      risk_tier,
    };
  }

  getModelInfo() {
    return {
      modelPath: 'mock-mode-with-realistic-predictions',
      modelExists: false,
      inputSize: 15,
      outputSize: 5,
      classNames: ['CHD', 'NTD', 'Renal', 'Abdominal', 'Cleft'],
      initialized: true,
      useMockMode: true,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const mlService = new MLService();
