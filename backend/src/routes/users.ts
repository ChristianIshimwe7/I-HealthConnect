// backend/src/routes/users.ts

import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/users ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching users...');
    
    // Simple query first to test
    const result = await query('SELECT * FROM users LIMIT 10');
    
    console.log('✅ Users fetched:', result.rows.length);
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('[Users] Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;