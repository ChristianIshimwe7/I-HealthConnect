import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  console.log('📡 Fetching:', url);

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

  return response;
};

// GET all patients
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 ====== PATIENTS API CALLED ======');
    console.log('📊 User:', req.user?.email || req.user?.id);

    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;

    const endpoint = `/patients?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

    console.log('📊 Fetching from Supabase:', endpoint);
    const response = await supabaseFetch(endpoint);
    const data: any = await response.json();

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

// GET single patient
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const endpoint = `/patients?id=eq.${id}`;
    const response = await supabaseFetch(endpoint);
    const data: any = await response.json();

    if (!response.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json(data[0]);
  } catch (err) {
    console.error('[Patients] Get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create patient - ACCEPTS PREDICTION FIELDS
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Creating patient with body:', req.body);
    
    const { 
      name, age, gender, district, sector, village, phone,
      overall_score, risk_tier, chd_prob, ntd_prob, renal_prob, 
      abdominal_prob, cleft_prob 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Build patient data with ALL fields including predictions
    const patientData: any = {
      name,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      district: district || null,
      sector: sector || null,
      village: village || null,
      phone: phone || null,
      chw_id: req.user?.id || null,
      // ✅ INCLUDE PREDICTION FIELDS
      overall_score: overall_score !== undefined && overall_score !== null ? parseFloat(overall_score) : null,
      risk_tier: risk_tier || null,
      chd_prob: chd_prob !== undefined && chd_prob !== null ? parseFloat(chd_prob) : null,
      ntd_prob: ntd_prob !== undefined && ntd_prob !== null ? parseFloat(ntd_prob) : null,
      renal_prob: renal_prob !== undefined && renal_prob !== null ? parseFloat(renal_prob) : null,
      abdominal_prob: abdominal_prob !== undefined && abdominal_prob !== null ? parseFloat(abdominal_prob) : null,
      cleft_prob: cleft_prob !== undefined && cleft_prob !== null ? parseFloat(cleft_prob) : null,
    };

    console.log('📝 Patient data with predictions:', patientData);

    const response = await supabaseFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      return res.status(response.status).json({
        error: data?.message || 'Failed to create patient'
      });
    }

    const patient = data[0] || data;
    console.log('✅ Patient created with predictions:', patient?.id);

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

// PATCH update patient - for adding predictions to existing patients
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating patient ${id} with:`, updateData);

    const response = await supabaseFetch(`/patients?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      return res.status(response.status).json({
        error: data?.message || 'Failed to update patient'
      });
    }

    console.log('✅ Patient updated:', id);
    return res.json(data[0] || data);
  } catch (err) {
    console.error('[Patients] Patch error:', err);
    return res.status(500).json({
      error: 'Failed to update patient',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
