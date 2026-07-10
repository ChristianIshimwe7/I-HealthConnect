// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// ✅ PATCH WebSocket for Node.js 20 BEFORE creating Supabase client
if (!global.WebSocket) {
  global.WebSocket = WebSocket;
}
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

// ✅ Hardcoded Supabase credentials (temporary for Render)
const SUPABASE_URL = 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tem1ra3dodGdrc3BmdmJkeGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM1NTIwNCwiZXhwIjoyMDk4OTMxMjA0fQ.CLdUuVbUmTm_iuD7o8xrqCLAxNjlOh4FRA2n25hNEVg';
const JWT_SECRET = 'afibora_super_secret_jwt_key_2026_secure';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    district: string;
    name?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Token expired or invalid' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, district, name')
      .eq('id', decoded.id)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      district: userData.district || 'Kigali',
      name: userData.name
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
};

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };

export const requireDistrict = (district: string) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.district !== district) {
      return res.status(403).json({ error: 'Access denied for this district' });
    }
    next();
  };
