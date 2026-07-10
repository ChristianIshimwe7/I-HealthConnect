// @ts-nocheck
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Use any to bypass WebSocket type conflicts
const WebSocket = require('ws');

// Type for authenticated request
export interface AuthRequest extends Request {
  user?: any;
}

// Alias for authenticateJWT - for backward compatibility
export const authenticate = authenticateJWT;

export const authenticateWebSocket = (ws: any, req: any) => {
  const token = req.headers.authorization?.split(' ')[1] || 
                req.query.token || 
                req.headers['sec-websocket-protocol'];
  
  if (!token) {
    ws.close(1008, 'Authentication required');
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (ws as any).user = decoded;
    return true;
  } catch (error) {
    ws.close(1008, 'Invalid token');
    return false;
  }
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
