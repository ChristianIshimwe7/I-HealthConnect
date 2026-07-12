import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    district?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('❌ Invalid Authorization header format');
      return res.status(401).json({ error: 'Invalid token format. Use Bearer <token>' });
    }

    const token = parts[1];
    if (!token) {
      console.log('❌ No token in Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    console.log('✅ Token verified for user:', decoded.email || decoded.id);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'nurse',
      district: decoded.district
    };

    next();
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authenticateJWT = authenticate;
export default authenticate;
