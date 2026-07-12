import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  console.log('📡 Fetching:', url);
  console.log('🔑 Using key:', SUPABASE_ANON_KEY.substring(0, 15) + '...');
  
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
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Supabase error:', response.status, errorText);
  }
  
  return response;
};

// GET all patients
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching patients...');
    
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string || '';

    let endpoint = `/patients?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (search) {
      endpoint += `&or=(name.ilike.%${search}%,district.ilike.%${search}%,sector.ilike.%${search}%)`;
    }

    const response = await supabaseFetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
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

// POST create patient
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Creating patient...');
    const { name, age, gender, district, sector, village, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const patientData = {
      name,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      district: district || null,
      sector: sector || null,
      village: village || null,
      phone: phone || null,
      chw_id: req.user?.id || null
    };

    const response = await supabaseFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data?.message || 'Failed to create patient' 
      });
    }

    const patient = data[0] || data;
    console.log('✅ Patient created:', patient.id);
    
    return res.status(201).json({ 
      success: true, 
      data: patient
    });
  } catch (err) {
    console.error('[Patients] Create error:', err);
    return res.status(500).json({ 
      error: 'Failed to create patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
