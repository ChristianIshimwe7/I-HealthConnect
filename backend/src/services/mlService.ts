// backend/src/services/mlService.ts - Fast Mock Mode

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
    console.log('✅ ML Service running in FAST MOCK mode');
    this.initialized = true;
  }

  async predict(clinicalFeatures: number[]): Promise<PredictionResult> {
    // Fast mock prediction
    const maternalAge = clinicalFeatures[0] || 28;
    const systolicBP = clinicalFeatures[4] || 120;
    const diastolicBP = clinicalFeatures[5] || 80;
    const glucose = clinicalFeatures[7] || 95;
    const hemoglobin = clinicalFeatures[8] || 12.5;
    
    let riskScore = 0.05;
    if (maternalAge > 35) riskScore += 0.25;
    if (maternalAge < 18) riskScore += 0.15;
    if (systolicBP > 140 || diastolicBP > 90) riskScore += 0.3;
    if (glucose > 140) riskScore += 0.2;
    if (hemoglobin < 10) riskScore += 0.15;
    
    riskScore = Math.min(Math.max(riskScore, 0.01), 0.95);
    
    let risk_tier: 'low' | 'elevated' | 'high';
    if (riskScore > 0.6) risk_tier = 'high';
    else if (riskScore > 0.35) risk_tier = 'elevated';
    else risk_tier = 'low';
    
    return {
      chd_prob: Math.min(riskScore * 1.1, 0.95),
      ntd_prob: Math.min(riskScore * 1.0, 0.9),
      renal_prob: Math.min(riskScore * 0.9, 0.85),
      abdominal_prob: Math.min(riskScore * 0.8, 0.8),
      cleft_prob: Math.min(riskScore * 0.7, 0.75),
      overall_score: riskScore,
      risk_tier,
    };
  }

  getModelInfo() {
    return {
      modelPath: 'mock-mode',
      modelExists: false,
      inputSize: 16,
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
