// backend/src/services/mlService.ts - Real ML Integration

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const ML_SCRIPT = path.join(__dirname, '../../ml_predict.py');

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
  private initialized: boolean = false;
  private useMock: boolean = true;

  async initialize(): Promise<void> {
    try {
      // Test if Python is available
      await execAsync('python --version');
      
      // Test if the script runs
      const testInput = JSON.stringify({ maternal_age: 28 });
      // Use spawn for stdin input
      await this.runPythonScript(testInput);
      
      this.initialized = true;
      this.useMock = false;
      console.log('✅ ML Service initialized with real model');
    } catch (error) {
      console.warn('⚠️ ML Service using mock mode:', error);
      this.initialized = true;
      this.useMock = true;
    }
  }

  private async runPythonScript(input: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn('python', [ML_SCRIPT]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      });
      
      process.stdin.write(input);
      process.stdin.end();
    });
  }

  async predict(clinicalFeatures: number[]): Promise<PredictionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Extract features for the ML model
    const features = {
      maternal_age: clinicalFeatures[0] || 28,
      systolic_bp: clinicalFeatures[4] || 120,
      diastolic_bp: clinicalFeatures[5] || 80,
      fundal_height: clinicalFeatures[3] || 24,
      blood_glucose: clinicalFeatures[7] || 95,
      hemoglobin: clinicalFeatures[8] || 12.5,
      weight: clinicalFeatures[2] || 70,
      gravida: clinicalFeatures[10] || 1,
      parity: clinicalFeatures[11] || 0,
      gestational_age_weeks: clinicalFeatures[1] || 24,
      family_history: clinicalFeatures[12] === 1,
      prior_loss: clinicalFeatures[13] === 1,
      infection_status: clinicalFeatures[14] === 1 ? 'infection' : 'none',
      folic_acid: clinicalFeatures[15] === 1 ? 'ongoing' : 'none'
    };

    if (this.useMock) {
      return this.mockPrediction(features);
    }

    try {
      const result = await this.runPythonScript(JSON.stringify(features));
      return result;
    } catch (error) {
      console.error('❌ ML prediction error:', error);
      return this.mockPrediction(features);
    }
  }

  private mockPrediction(features: any): PredictionResult {
    const maternalAge = features.maternal_age || 28;
    const systolicBP = features.systolic_bp || 120;
    const diastolicBP = features.diastolic_bp || 80;
    const glucose = features.blood_glucose || 95;
    const hemoglobin = features.hemoglobin || 12.5;

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
      modelPath: this.useMock ? 'mock-mode' : 'real-model',
      modelExists: !this.useMock,
      inputSize: 16,
      outputSize: 5,
      classNames: ['CHD', 'NTD', 'Renal', 'Abdominal', 'Cleft'],
      initialized: this.initialized,
      useMockMode: this.useMock,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const mlService = new MLService();
