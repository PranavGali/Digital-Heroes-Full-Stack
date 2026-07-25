import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Return all users (name, email, role) for assigning and management
    const users = await User.find({}, 'name email role').sort({ name: 1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
