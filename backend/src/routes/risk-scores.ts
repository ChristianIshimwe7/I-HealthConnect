import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Helper function to make Supabase REST API calls
const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${supabaseUrl}/rest/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};

// GET all risk scores
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching risk scores...');

    const response = await supabaseFetch('/risk_scores?select=*&order=created_at.desc&limit=1000');
    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      // If table doesn't exist, return empty array
      if (response.status === 404) {
        return res.json([]);
      }
      const errorMessage = data?.message || 'Failed to fetch risk scores';
      throw new Error(errorMessage);
    }

    console.log(`✅ Found ${data?.length || 0} risk scores`);
    return res.json(data || []);
  } catch (err) {
    console.error('[Risk Scores] Error:', err);
    return res.json([]);
  }
});

// POST create risk score
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 Creating risk score:', req.body);
    const {
      patient_id,
      visit_id,
      overall_score,
      risk_tier,
      chd_prob,
      ntd_prob,
      renal_prob,
      abdominal_prob,
      cleft_prob
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    const response = await supabaseFetch('/risk_scores', {
      method: 'POST',
      body: JSON.stringify({
        patient_id,
        visit_id: visit_id || null,
        overall_score: overall_score || null,
        risk_tier: risk_tier || null,
        chd_prob: chd_prob || null,
        ntd_prob: ntd_prob || null,
        renal_prob: renal_prob || null,
        abdominal_prob: abdominal_prob || null,
        cleft_prob: cleft_prob || null
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      const errorMessage = data?.message || 'Failed to create risk score';
      throw new Error(errorMessage);
    }

    console.log('✅ Risk score created:', data[0]?.id);
    return res.status(201).json(data[0]);
  } catch (err) {
    console.error('[Risk Scores] Create error:', err);
    return res.status(500).json({ 
      error: 'Failed to create risk score',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
