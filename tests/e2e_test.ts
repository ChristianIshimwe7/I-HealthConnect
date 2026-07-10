/**
 * I-HealthConnect — End-to-End Integration Test
 * Tests the full flow: insert patient → visit → inference → risk score → sync queue
 *
 * Run: npx ts-node tests/e2e_test.ts
 * Requires: expo-sqlite compatible environment (run inside Expo or mock SQLite)
 */

import {
  initDB, insertPatient, insertVisit,
  insertRiskScore, getDashboardStats, getUnsyncedRecords,
} from '../mobile/src/db/database';
import { runSimulatedInference, ClinicalInput, PredictionResult } from '../mobile/src/ml/inference';

// ── Test utilities ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    failures.push(message);
  }
}

function assertApprox(a: number, b: number, tolerance: number, message: string): void {
  assert(Math.abs(a - b) <= tolerance, `${message} (got ${a}, expected ~${b})`);
}

// ── Test data ────────────────────────────────────────────────────────────────
const TEST_PATIENT = {
  name:             'Test Patient Mukamana',
  age:              28,
  gravida:          2,
  parity:           1,
  gestational_age:  24,
};

const TEST_VITALS = {
  systolic_bp:    138,
  diastolic_bp:   90,
  fundal_height:  22,
  glucose:        115,
  hemoglobin:     10.2,
  weight:         64,
  family_history: true,
  prior_loss:     false,
  infection:      false,
  folic_acid:     'none' as const,
};

const TEST_INPUT: ClinicalInput = {
  age:              28,
  gravida:          2,
  parity:           1,
  gestational_age:  24,
  ...TEST_VITALS,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
async function runTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('  I-HealthConnect — E2E Integration Tests');
  console.log('='.repeat(60) + '\n');

  // ── Test 1: DB initialization ─────────────────────────────────────────────
  console.log('Test 1: Database initialization');
  try {
    await initDB();
    assert(true, 'initDB() completed without error');
  } catch (e) {
    assert(false, `initDB() threw: ${e}`);
    console.error('Cannot continue — DB init failed');
    process.exit(1);
  }

  // ── Test 2: Insert patient ────────────────────────────────────────────────
  console.log('\nTest 2: Insert patient');
  let patientId: number;
  try {
    patientId = await insertPatient(TEST_PATIENT) as number;
    assert(typeof patientId === 'number' && patientId > 0,
      `insertPatient() returns valid id=${patientId}`);
  } catch (e) {
    assert(false, `insertPatient() threw: ${e}`);
    return;
  }

  // ── Test 3: Insert visit ──────────────────────────────────────────────────
  console.log('\nTest 3: Insert visit with clinical vitals');
  let visitId: number;
  try {
    visitId = await insertVisit(patientId, TEST_VITALS) as number;
    assert(typeof visitId === 'number' && visitId > 0,
      `insertVisit() returns valid id=${visitId}`);
  } catch (e) {
    assert(false, `insertVisit() threw: ${e}`);
    return;
  }

  // ── Test 4: ML inference ──────────────────────────────────────────────────
  console.log('\nTest 4: ML inference (simulated)');
  let result: PredictionResult;
  try {
    result = runSimulatedInference(TEST_INPUT);
    assert(typeof result.overall_score === 'number', 'overall_score is a number');
    assert(result.overall_score >= 0 && result.overall_score <= 1,
      `overall_score in [0,1]: ${result.overall_score}`);
    assert(result.overall_score > 0.5,
      `High-risk profile correctly scores above 0.5: ${result.overall_score}`);
    assert(result.risk_tier === 'high' || result.risk_tier === 'elevated',
      `Risk tier is high or elevated: ${result.risk_tier}`);
  } catch (e) {
    assert(false, `runSimulatedInference() threw: ${e}`);
    return;
  }

  // ── Test 5: Probability ordering ─────────────────────────────────────────
  console.log('\nTest 5: Anomaly probability ordering');
  assert(result!.chd_prob >= result!.ntd_prob,
    `CHD prob (${result!.chd_prob}) ≥ NTD prob (${result!.ntd_prob})`);
  assert(result!.ntd_prob >= result!.renal_prob,
    `NTD prob (${result!.ntd_prob}) ≥ Renal prob (${result!.renal_prob})`);
  assert(result!.renal_prob >= result!.abdominal_prob,
    `Renal prob (${result!.renal_prob}) ≥ Abdominal prob (${result!.abdominal_prob})`);
  assert(result!.abdominal_prob >= result!.cleft_prob,
    `Abdominal prob (${result!.abdominal_prob}) ≥ Cleft prob (${result!.cleft_prob})`);

  // All probs in valid range
  for (const [key, val] of Object.entries({
    chd: result!.chd_prob, ntd: result!.ntd_prob,
    renal: result!.renal_prob, abdominal: result!.abdominal_prob,
    cleft: result!.cleft_prob,
  })) {
    assert(val >= 0 && val <= 1, `${key}_prob in [0,1]: ${val}`);
  }

  // ── Test 6: Insert risk score ─────────────────────────────────────────────
  console.log('\nTest 6: Insert risk score');
  let scoreId: number;
  try {
    scoreId = await insertRiskScore(visitId!, result!) as number;
    assert(typeof scoreId === 'number' && scoreId > 0,
      `insertRiskScore() returns valid id=${scoreId}`);
  } catch (e) {
    assert(false, `insertRiskScore() threw: ${e}`);
    return;
  }

  // ── Test 7: Dashboard stats ───────────────────────────────────────────────
  console.log('\nTest 7: Dashboard stats updated');
  try {
    const stats = await getDashboardStats();
    assert(typeof stats.screened === 'number', 'getDashboardStats() returns screened count');
    assert(stats.screened >= 1, `Screened count ≥ 1: ${stats.screened}`);
    assert(typeof stats.offline === 'number', 'getDashboardStats() returns offline count');
  } catch (e) {
    assert(false, `getDashboardStats() threw: ${e}`);
  }

  // ── Test 8: Unsynced records ──────────────────────────────────────────────
  console.log('\nTest 8: Unsynced records queue');
  try {
    const unsynced = await getUnsyncedRecords();
    assert(Array.isArray(unsynced), 'getUnsyncedRecords() returns array');
    assert(unsynced.length >= 1, `At least 1 unsynced record: ${unsynced.length}`);
    const record = (unsynced as any[]).find((r: any) => r.id === scoreId);
    assert(!!record, `New risk score (id=${scoreId}) is in unsynced queue`);
  } catch (e) {
    assert(false, `getUnsyncedRecords() threw: ${e}`);
  }

  // ── Test 9: Low-risk profile ──────────────────────────────────────────────
  console.log('\nTest 9: Low-risk profile correctly classified');
  const LOW_RISK_INPUT: ClinicalInput = {
    age: 24, gravida: 1, parity: 0, gestational_age: 20,
    systolic_bp: 110, diastolic_bp: 70, fundal_height: 19,
    glucose: 85, hemoglobin: 12.5, weight: 58,
    family_history: false, prior_loss: false, infection: false,
    folic_acid: 'ongoing',
  };
  const lowResult = runSimulatedInference(LOW_RISK_INPUT);
  assert(lowResult.overall_score < 0.5,
    `Low-risk profile scores below 0.5: ${lowResult.overall_score}`);
  assert(lowResult.risk_tier === 'low' || lowResult.overall_score < 0.4,
    `Low-risk profile tier: ${lowResult.risk_tier}`);

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  if (failed === 0) {
    console.log(`\n✅ ALL TESTS PASSED (${passed}/${passed + failed})\n`);
  } else {
    console.log(`\n❌ ${failed} TEST(S) FAILED (${passed} passed)\n`);
    console.log('Failed assertions:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }
  console.log('='.repeat(60) + '\n');
}

runTests().catch(err => {
  console.error('\n💥 Test runner crashed:', err);
  process.exit(1);
});
