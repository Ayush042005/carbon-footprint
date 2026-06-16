import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.js';
import { auth, AuthenticatedRequest } from '../middleware/auth.js';
import { generatePersonalizedTips, generateChatResponse } from '../services/geminiService.js';
import { insightsLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(auth);
router.use(insightsLimiter);

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string().min(1).max(10000),
  })).default([]),
});

router.post('/generate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const force = req.query.force === 'true';

    // Check country of user
    const userStmt = db.prepare('SELECT country FROM users WHERE id = ?');
    const user = userStmt.get(userId) as any;
    const country = user?.country || 'IN';

    // 1. Check if we have cached insights from the last 24 hours (unless forced)
    const cacheStmt = db.prepare(`
      SELECT content, generated_at 
      FROM insights_cache 
      WHERE user_id = ? 
      ORDER BY generated_at DESC 
      LIMIT 1
    `);
    const cache = cacheStmt.get(userId) as any;

    if (!force && cache) {
      const generatedAt = new Date(cache.generated_at).getTime();
      const now = new Date().getTime();
      const diffHrs = (now - generatedAt) / (1000 * 60 * 60);

      if (diffHrs < 24) {
        return res.json(JSON.parse(cache.content));
      }
    }

    // 2. Fetch user activity logs for the last 30 days
    const activitiesStmt = db.prepare(`
      SELECT category, emission_kg 
      FROM activities 
      WHERE user_id = ? AND date >= datetime('now', '-30 days')
    `);
    const activities = activitiesStmt.all(userId) as any[];

    // Compute category breakdowns
    const breakdown = {
      transport: { kg: 0, pct: 0 },
      food: { kg: 0, pct: 0 },
      energy: { kg: 0, pct: 0 },
      shopping: { kg: 0, pct: 0 },
      waste: { kg: 0, pct: 0 },
    };

    let totalKg = 0;
    activities.forEach((act) => {
      const cat = act.category as keyof typeof breakdown;
      if (breakdown[cat]) {
        breakdown[cat].kg += act.emission_kg;
        totalKg += act.emission_kg;
      }
    });

    // Compute percentages safely
    if (totalKg > 0) {
      Object.keys(breakdown).forEach((key) => {
        const cat = key as keyof typeof breakdown;
        breakdown[cat].pct = Math.round((breakdown[cat].kg / totalKg) * 100);
      });
    }

    // 3. Generate tips
    const result = await generatePersonalizedTips(totalKg, breakdown, country);

    // 4. Update/Insert Cache
    const deleteCacheStmt = db.prepare('DELETE FROM insights_cache WHERE user_id = ?');
    deleteCacheStmt.run(userId);

    const insertCacheStmt = db.prepare(`
      INSERT INTO insights_cache (user_id, content) 
      VALUES (?, ?)
    `);
    insertCacheStmt.run(userId, JSON.stringify(result));

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/chat', validateBody(ChatSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { message, history } = req.body;
    const userId = req.user!.id;

    // Fetch user details
    const userStmt = db.prepare('SELECT name, country FROM users WHERE id = ?');
    const user = userStmt.get(userId) as any;
    
    // Fetch user goal
    const goalStmt = db.prepare('SELECT monthly_target FROM goals WHERE user_id = ?');
    const goal = goalStmt.get(userId) as any;

    // Fetch user activity logs for the last 30 days
    const activitiesStmt = db.prepare(`
      SELECT category, emission_kg 
      FROM activities 
      WHERE user_id = ? AND date >= datetime('now', '-30 days')
    `);
    const activities = activitiesStmt.all(userId) as any[];

    // Compute category breakdowns
    const breakdown = {
      transport: { kg: 0, pct: 0 },
      food: { kg: 0, pct: 0 },
      energy: { kg: 0, pct: 0 },
      shopping: { kg: 0, pct: 0 },
      waste: { kg: 0, pct: 0 },
    };

    let totalKg = 0;
    activities.forEach((act) => {
      const cat = act.category as keyof typeof breakdown;
      if (breakdown[cat]) {
        breakdown[cat].kg += act.emission_kg;
        totalKg += act.emission_kg;
      }
    });

    if (totalKg > 0) {
      Object.keys(breakdown).forEach((key) => {
        const cat = key as keyof typeof breakdown;
        breakdown[cat].pct = Math.round((breakdown[cat].kg / totalKg) * 100);
      });
    }

    const userContext = {
      name: user?.name || 'User',
      country: user?.country || 'IN',
      monthlyTarget: goal ? goal.monthly_target : null,
      totalKg,
      breakdown,
    };

    const reply = await generateChatResponse(message, history, userContext);
    return res.json({ reply });
  } catch (error) {
    next(error);
  }
});

export default router;
