import { supabase } from './src/config/supabase';

async function debugSupabase() {
  console.log('🔍 Debugging Supabase connection...\n');

  // Test 1: Check if we can connect
  console.log('📡 Testing connection...');
  const { data: testData, error: testError } = await supabase
    .from('patients')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('❌ Connection error:', testError);
    console.error('❌ Error details:', JSON.stringify(testError, null, 2));
  } else {
    console.log('✅ Connection successful!');
    console.log('📊 Data received:', testData);
    console.log('📊 Data length:', testData?.length || 0);
  }

  // Test 2: Check if patients table exists and has data
  console.log('\n📊 Checking patients table...');
  const { data: patients, error: patientsError, count } = await supabase
    .from('patients')
    .select('*', { count: 'exact' });

  if (patientsError) {
    console.error('❌ Patients error:', patientsError);
  } else {
    console.log('✅ Patients found:', patients?.length || 0);
    console.log('📋 First 3 patients:', patients?.slice(0, 3));
  }

  // Test 3: Check risk_scores table
  console.log('\n📊 Checking risk_scores table...');
  const { data: riskScores, error: riskError } = await supabase
    .from('risk_scores')
    .select('*');

  if (riskError) {
    console.error('❌ Risk scores error:', riskError);
  } else {
    console.log('✅ Risk scores found:', riskScores?.length || 0);
  }

  console.log('\n✅ Debug complete!');
}

debugSupabase();
