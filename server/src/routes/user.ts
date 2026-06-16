import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.js';
import { auth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().length(2).optional(),
  monthlyTarget: z.number().positive().max(100000).optional(),
});

router.use(auth);

// GET /api/user/profile
router.get('/profile', (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user details
    const userStmt = db.prepare('SELECT id, email, name, country FROM users WHERE id = ?');
    const user = userStmt.get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user goal
    const goalStmt = db.prepare('SELECT monthly_target FROM goals WHERE user_id = ?');
    const goal = goalStmt.get(userId) as any;

    return res.json({
      ...user,
      monthlyTarget: goal ? goal.monthly_target : null,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/user/profile
router.put('/profile', validateBody(UpdateProfileSchema), (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { name, country, monthlyTarget } = req.body;

    // Update user table if necessary
    if (name !== undefined || country !== undefined) {
      const userStmt = db.prepare('SELECT name, country FROM users WHERE id = ?');
      const currentUser = userStmt.get(userId) as any;

      const newName = name !== undefined ? name : currentUser.name;
      const newCountry = country !== undefined ? country : currentUser.country;

      const updateStmt = db.prepare(`
        UPDATE users 
        SET name = ?, country = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      updateStmt.run(newName, newCountry, userId);
    }

    // Update or insert goal if monthlyTarget is provided
    if (monthlyTarget !== undefined) {
      const checkStmt = db.prepare('SELECT id FROM goals WHERE user_id = ?');
      const goalExists = checkStmt.get(userId);

      if (goalExists) {
        const updateGoalStmt = db.prepare(`
          UPDATE goals
          SET monthly_target = ?, updated_at = datetime('now')
          WHERE user_id = ?
        `);
        updateGoalStmt.run(monthlyTarget, userId);
      } else {
        const insertGoalStmt = db.prepare(`
          INSERT INTO goals (user_id, monthly_target, start_date)
          VALUES (?, ?, date('now'))
        `);
        insertGoalStmt.run(userId, monthlyTarget);
      }
    }

    // Fetch updated profile
    const finalUserStmt = db.prepare('SELECT id, email, name, country FROM users WHERE id = ?');
    const user = finalUserStmt.get(userId) as any;
    const finalGoalStmt = db.prepare('SELECT monthly_target FROM goals WHERE user_id = ?');
    const goal = finalGoalStmt.get(userId) as any;

    return res.json({
      ...user,
      monthlyTarget: goal ? goal.monthly_target : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
