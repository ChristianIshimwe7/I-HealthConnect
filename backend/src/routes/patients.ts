import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  console.log('📡 Fetching:', url);
  console.log('🔑 Key:', SUPABASE_ANON_KEY);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  
  console.log('📡 Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Supabase error:', response.status, errorText);
  }
  
  return response;
};

// GET all patients
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 ====== PATIENTS API CALLED ======');
    console.log('📊 User:', req.user?.email || req.user?.id);
    console.log('📊 Query:', req.query);
    
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;

    const endpoint = `/patients?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

    console.log('📊 Fetching from Supabase:', endpoint);
    const response = await supabaseFetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      return res.status(response.status).json({ 
        error: data?.message || 'Failed to fetch patients',
        details: data
      });
    }

    console.log(`✅ Found ${data?.length || 0} patients`);
    return res.json({
      data: data || [],
      total: data?.length || 0,
      limit: limit,
      offset: offset
    });
  } catch (err) {
    console.error('[Patients] Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
