// backend/src/services/mlService.ts

import * as ort from 'onnxruntime-node';
import * as path from 'path';
import * as fs from 'fs';

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
  private session: ort.InferenceSession | null = null;
  private modelPath: string;
  private initialized: boolean = false;

  constructor() {
    // Go up 3 levels from src/services to project root, then into models/
    this.modelPath = path.join(__dirname, '../../../models/clinical_model.onnx');
  }

  async initialize(): Promise<void> {
    try {
      console.log(`📦 Loading ML model from: ${this.modelPath}`);

      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`Model not found at ${this.modelPath}`);
      }

      this.session = await ort.InferenceSession.create(this.modelPath);
      this.initialized = true;
      console.log('✅ ML Model loaded successfully');
      console.log(`   Input: 16 clinical features`);
      console.log(`   Output: 5 anomaly probabilities`);
    } catch (error) {
      console.error('❌ Failed to load ML model:', error);
      throw error;
    }
  }

  async predict(clinicalFeatures: number[]): Promise<PredictionResult> {
    if (!this.session || !this.initialized) {
      throw new Error('ML Model not initialized');
    }

    if (clinicalFeatures.length !== 16) {
      throw new Error(`Expected 16 features, got ${clinicalFeatures.length}`);
    }

    try {
      const inputTensor = new ort.Tensor(
        'float32',
        new Float32Array(clinicalFeatures),
        [1, 16]
      );

      const results = await this.session.run({
        'clinical_features': inputTensor
      });

      const output = results['clinical_output'].data as Float32Array;

      const predictions = {
        chd_prob: Math.max(0, Math.min(1, output[0] || 0)),
        ntd_prob: Math.max(0, Math.min(1, output[1] || 0)),
        renal_prob: Math.max(0, Math.min(1, output[2] || 0)),
        abdominal_prob: Math.max(0, Math.min(1, output[3] || 0)),
        cleft_prob: Math.max(0, Math.min(1, output[4] || 0)),
      };

      const overall_score = Object.values(predictions).reduce((a, b) => a + b, 0) / 5;

      let risk_tier: 'low' | 'elevated' | 'high';
      if (overall_score > 0.7) {
        risk_tier = 'high';
      } else if (overall_score > 0.4) {
        risk_tier = 'elevated';
      } else {
        risk_tier = 'low';
      }

      return {
        ...predictions,
        overall_score,
        risk_tier,
      };
    } catch (error) {
      console.error('❌ Prediction error:', error);
      throw error;
    }
  }

  getModelInfo() {
    return {
      modelPath: this.modelPath,
      inputSize: 16,
      outputSize: 5,
      classNames: ['CHD', 'NTD', 'Renal', 'Abdominal', 'Cleft'],
      initialized: this.initialized,
    };
  }

  isInitialized(): boolean {
    return this.initialized && this.session !== null;
  }
}

export const mlService = new MLService();