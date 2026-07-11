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

// GET all referrals
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching referrals...');

    const response = await supabaseFetch('/referrals?select=*&order=sent_at.desc&limit=1000');
    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      if (response.status === 404) {
        return res.json([]);
      }
      const errorMessage = data?.message || 'Failed to fetch referrals';
      throw new Error(errorMessage);
    }

    console.log(`✅ Found ${data?.length || 0} referrals`);
    return res.json(data || []);
  } catch (err) {
    console.error('[Referrals] Error:', err);
    return res.json([]);
  }
});

export default router;
