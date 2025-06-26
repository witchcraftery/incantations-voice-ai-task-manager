import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../index';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const userResult = await db.query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.patch('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name } = req.body;

    await db.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, userId]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const result = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences if none exist
      await db.query(
        'INSERT INTO user_preferences (user_id, preferences) VALUES ($1, $2)',
        [userId, JSON.stringify({})]
      );
      return res.json({});
    }

    res.json(result.rows[0].preferences || {});

  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const preferences = req.body;

    // Upsert preferences
    await db.query(
      `INSERT INTO user_preferences (user_id, preferences, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id) 
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(preferences)]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Sync preferences from localStorage
router.post('/preferences/sync', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { localPreferences } = req.body;

    // Get current cloud preferences
    const result = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    const cloudPreferences = result.rows[0]?.preferences || {};
    
    // Merge local with cloud (cloud takes precedence for conflicts)
    const mergedPreferences = { ...localPreferences, ...cloudPreferences };

    // Upsert merged preferences
    await db.query(
      `INSERT INTO user_preferences (user_id, preferences, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id) 
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(mergedPreferences)]
    );

    res.json({ preferences: mergedPreferences });

  } catch (error) {
    res.status(500).json({ error: 'Failed to sync preferences' });
  }
});

export { router as userRouter };
