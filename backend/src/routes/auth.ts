import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  role:     z.enum(['doctor','nurse','supervisor','coordinator','admin','chw']).optional(),
});

// ── POST /api/auth/login ───────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND active = TRUE',
      [body.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, district: user.district },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    );

    await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);

    return res.json({
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        district: user.district,
        initials: user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: err.errors });
    }
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/register ────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      name:     z.string().min(2),
      email:    z.string().email(),
      password: z.string().min(8),
      role:     z.enum(['doctor','nurse','supervisor','coordinator','admin','chw']),
      district: z.string().optional().default('Kigali'),
      sector:   z.string().optional(),
    }).parse(req.body);

    const existing = await query(
      'SELECT id FROM users WHERE email = $1', [body.email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(body.password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, district, sector)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, district`,
      [body.name, body.email.toLowerCase(), hash, body.role, body.district, body.sector ?? null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    );

    return res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: err.errors });
    }
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, district, sector, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;