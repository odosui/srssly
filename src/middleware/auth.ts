import { Request, Response, NextFunction } from 'express';
import { UserModel, User } from '../models/User';

export interface AuthRequest extends Request {
  currentUser?: User;
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const result = await UserModel.findByToken(token);

    if (!result || result.authToken.kind !== 'regular') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.currentUser = result.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
