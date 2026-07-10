/**
 * ML Inference Module — I-HealthConnect
 * Place trained model at: assets/model.tflite
 * Install: npx expo install react-native-fast-tflite
 *
 * Feature vector order (must match training pipeline):
 * [age, systolic_bp, diastolic_bp, fundal_height, glucose,
 *  hemoglobin, weight, gravida, parity, gestational_age,
 *  family_history, prior_loss, infection,
 *  folic_none, folic_first, folic_ongoing]
 */
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

export interface ClinicalInput {
  age: number;
  systolic_bp: number;
  diastolic_bp: number;
  fundal_height: number;
  glucose: number;
  hemoglobin: number;
  weight: number;
  gravida: number;
  parity: number;
  gestational_age: number;
  family_history: boolean;
  prior_loss: boolean;
  infection: boolean;
  folic_acid: 'none' | 'first' | 'ongoing';
}

export interface PredictionResult {
  overall_score: number;
  risk_tier: 'high' | 'elevated' | 'low';
  chd_prob: number;
  ntd_prob: number;
  renal_prob: number;
  abdominal_prob: number;
  cleft_prob: number;
}

// Replace these with values exported from your Python training pipeline
const MEANS = [26.5,122.0,80.0,26.0,95.0,11.5,62.0,2.0,1.0,22.0,0.15,0.12,0.08,0.45,0.30,0.25];
const STDS  = [5.2, 18.0, 10.0,5.0, 22.0,1.8, 10.0,1.2,0.9,6.0, 0.36,0.33,0.27,0.50,0.46,0.43];

let model: TensorflowModel | null = null;

export const loadModel = async () => {
  if (model) return;
  const asset = Asset.fromModule(require('../../assets/model.tflite'));
  await asset.downloadAsync();
  model = await loadTensorflowModel({ url: asset.localUri! });
};

const buildFeatures = (i: ClinicalInput): number[] => [
  i.age, i.systolic_bp, i.diastolic_bp, i.fundal_height,
  i.glucose, i.hemoglobin, i.weight, i.gravida, i.parity, i.gestational_age,
  i.family_history?1:0, i.prior_loss?1:0, i.infection?1:0,
  i.folic_acid==='none'?1:0, i.folic_acid==='first'?1:0, i.folic_acid==='ongoing'?1:0,
];

const normalize = (f: number[]): Float32Array =>
  new Float32Array(f.map((v,i) => (v - MEANS[i]) / STDS[i]));

const tier = (s: number): 'high'|'elevated'|'low' =>
  s >= 0.65 ? 'high' : s >= 0.40 ? 'elevated' : 'low';

export const runInference = async (input: ClinicalInput): Promise<PredictionResult> => {
  if (!model) await loadModel();
  const out = await model!.run([normalize(buildFeatures(input))]);
  const [chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob] =
    Array.from(out[0] as Float32Array);
  const overall_score = parseFloat(
    (chd_prob*0.35 + ntd_prob*0.25 + renal_prob*0.20 +
     abdominal_prob*0.12 + cleft_prob*0.08).toFixed(2)
  );
  return {
    overall_score, risk_tier: tier(overall_score),
    chd_prob: +chd_prob.toFixed(2), ntd_prob: +ntd_prob.toFixed(2),
    renal_prob: +renal_prob.toFixed(2), abdominal_prob: +abdominal_prob.toFixed(2),
    cleft_prob: +cleft_prob.toFixed(2),
  };
};

// Use this for testing before your real model is ready
export const runSimulatedInference = (i: ClinicalInput): PredictionResult => {
  const risk =
    (i.systolic_bp > 130 ? 0.15 : 0) + (i.diastolic_bp > 85 ? 0.10 : 0) +
    (i.glucose > 110 ? 0.12 : 0) + (i.hemoglobin < 11 ? 0.08 : 0) +
    (i.family_history ? 0.20 : 0) + (i.infection ? 0.10 : 0) +
    (i.folic_acid === 'none' ? 0.15 : 0) + (i.age > 35 ? 0.10 : 0);
  const c = (v: number) => +Math.min(Math.max(v, 0), 1).toFixed(2);
  const chd_prob=c(risk*0.9), ntd_prob=c(risk*0.7), renal_prob=c(risk*0.5),
        abdominal_prob=c(risk*0.3), cleft_prob=c(risk*0.2);
  const overall_score = +(chd_prob*0.35+ntd_prob*0.25+renal_prob*0.20+
                          abdominal_prob*0.12+cleft_prob*0.08).toFixed(2);
  return { overall_score, risk_tier: tier(overall_score),
           chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob };
};
