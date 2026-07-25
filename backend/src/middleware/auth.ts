import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'member';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'admin' | 'member' };

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('_id role');
    if (!user) {
      res.status(401).json({ success: false, message: 'Token invalid or user no longer exists.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireRole = (roles: Array<'admin' | 'member'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permissions for this resource.',
      });
      return;
    }

    next();
  };
};
