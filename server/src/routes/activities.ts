import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.js';
import { auth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { calculateEmission, EMISSION_FACTORS } from '../services/emissionService.js';

const router = Router();

// Category types
const categories = ['transport', 'food', 'energy', 'shopping', 'waste'] as const;

const ActivitySchema = z.object({
  category: z.enum(categories),
  subType: z.string().min(1).max(50),
  quantity: z.number().positive().max(100000),
  unit: z.string().min(1).max(20),
  date: z.string().datetime(),
  notes: z.string().max(500).optional(),
  origin: z.string().max(250).optional(),
  destination: z.string().max(250).optional(),
});

// Apply auth middleware to all activity routes
router.use(auth);

// GET /api/activities - Get all activities for logged in user
router.get('/', (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const stmt = db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC');
    const activities = stmt.all(userId);
    return res.json(activities);
  } catch (error) {
    next(error);
  }
});

// POST /api/activities - Log new activity
router.post('/', validateBody(ActivitySchema), (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { category, subType, quantity, unit, date, notes, origin, destination } = req.body;

    // Fetch user's country to apply appropriate emission factors
    const userStmt = db.prepare('SELECT country FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { country: string } | undefined;
    const country = user?.country || 'IN';

    // Calculate emission_kg
    let emissionKg = 0;
    try {
      emissionKg = calculateEmission(category, subType, quantity, country);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const stmt = db.prepare(`
      INSERT INTO activities (user_id, category, sub_type, quantity, unit, emission_kg, date, notes, origin, destination)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      category,
      subType,
      quantity,
      unit,
      emissionKg,
      date,
      notes || null,
      origin || null,
      destination || null
    );

    return res.status(201).json({
      id: result.lastInsertRowid,
      user_id: userId,
      category,
      sub_type: subType,
      quantity,
      unit,
      emission_kg: emissionKg,
      date,
      notes,
      origin,
      destination,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/activities/:id - Delete logged activity
router.delete('/:id', (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const activityId = req.params.id;

    // Check ownership first
    const checkStmt = db.prepare('SELECT id FROM activities WHERE id = ? AND user_id = ?');
    const activity = checkStmt.get(activityId, userId);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM activities WHERE id = ?');
    deleteStmt.run(activityId);

    return res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
