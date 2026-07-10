// web/src/services/supabase.ts

import { createClient } from '@supabase/supabase-js';

// ── Environment Variables ──
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Debug: Check if keys are loaded ──
console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
}

// ── Initialize Supabase Client ──
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth Functions ──
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ── Patient Functions ──
export const getPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createPatient = async (patient: any) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select();
  if (error) throw error;
  return data[0];
};

// ── Visit Functions ──
export const createVisit = async (visit: any) => {
  const { data, error } = await supabase
    .from('visits')
    .insert([visit])
    .select();
  if (error) throw error;
  return data[0];
};

// ── Risk Score Functions ──
export const saveRiskScore = async (riskScore: any) => {
  const { data, error } = await supabase
    .from('risk_scores')
    .insert([riskScore])
    .select();
  if (error) throw error;
  return data[0];
};

// ── Referral Functions ──
export const getReferrals = async () => {
  const { data, error } = await supabase
    .from('referrals')
    .select('*, patients(*)')
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createReferral = async (referral: any) => {
  const { data, error } = await supabase
    .from('referrals')
    .insert([referral])
    .select();
  if (error) throw error;
  return data[0];
};

// ── Dashboard Stats ──
export const getDashboardStats = async () => {
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  const { count: highRisk } = await supabase
    .from('risk_scores')
    .select('*', { count: 'exact', head: true })
    .eq('risk_tier', 'high');

  const { count: totalReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true });

  return {
    totalScreened: totalPatients || 0,
    highRiskFlagged: highRisk || 0,
    referralsSent: totalReferrals || 0,
  };
};