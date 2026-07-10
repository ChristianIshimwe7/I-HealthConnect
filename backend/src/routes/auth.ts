// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import WebSocket from 'ws';

// ✅ PATCH WebSocket for Node.js 20 BEFORE creating Supabase client
if (!global.WebSocket) {
  global.WebSocket = WebSocket;
}
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const router = Router();

// ✅ Hardcoded Supabase credentials (temporary for Render)
const SUPABASE_URL = 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tem1ra3dodGdrc3BmdmJkeGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM1NTIwNCwiZXhwIjoyMDk4OTMxMjA0fQ.CLdUuVbUmTm_iuD7o8xrqCLAxNjlOh4FRA2n25hNEVg';
const JWT_SECRET = 'afibora_super_secret_jwt_key_2026_secure';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ── REGISTER ──
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, district } = req.body;

    if (!name || !email || !password || !role || !district) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let initials = '';
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else {
        initials = parts[0][0].toUpperCase();
      }
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        role,
        district,
        initials: initials || name.substring(0, 2).toUpperCase()
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    const token = jwt.sign(
      { 
        id: userData.id, 
        email: userData.email, 
        role: userData.role, 
        district: userData.district 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = userData;
    return res.status(201).json({ success: true, user: userWithoutPassword, token });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── LOGIN ──
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, district, initials, password_hash')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (userData.role !== role) {
      return res.status(401).json({ error: 'Invalid role for this user' });
    }

    const token = jwt.sign(
      { 
        id: userData.id, 
        email: userData.email, 
        role: userData.role, 
        district: userData.district 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = userData;
    return res.json({ success: true, token, user: userWithoutPassword });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /me ──
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, district, initials')
      .eq('id', decoded.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({ success: true, user: userData });
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
});

// ── LOGOUT ──
router.post('/logout', async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ── GET /users ──
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, district, initials, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
