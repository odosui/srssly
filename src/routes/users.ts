import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';

const router = Router();

// POST /users - Create new user
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Basic email format validation
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already taken' });
      return;
    }

    await UserModel.create(email, password);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/login - Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await UserModel.authenticate(email, password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate both regular and refresh tokens
    const regularToken = await UserModel.generateToken(user.id, 'regular');
    const refreshToken = await UserModel.generateToken(user.id, 'refresh');

    res.json({
      regular_token: regularToken.token,
      refresh_token: refreshToken.token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/refresh - Refresh tokens
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string };

    if (!refresh_token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const result = await UserModel.findByToken(refresh_token);

    if (!result || result.authToken.kind !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Check if token has expired (explicit check as in Rails controller)
    if (new Date(result.authToken.expire_at) < new Date()) {
      res.status(401).json({ error: 'Refresh token has expired' });
      return;
    }

    // Generate new token pair
    const newRegularToken = await UserModel.generateToken(result.user.id, 'regular');
    const newRefreshToken = await UserModel.generateToken(result.user.id, 'refresh');

    // Delete the old refresh token
    await UserModel.deleteToken(refresh_token);

    res.json({
      regular_token: newRegularToken.token,
      refresh_token: newRefreshToken.token,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
