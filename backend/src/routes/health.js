import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

/**
 * GET /api/v1/health
 * Readiness check. Runs `SELECT 1` so every ping counts as database activity
 * (keeps the free Supabase project from pausing — see keepalive.yml).
 * Returns 200 { "status": "ok" }, or 503 DATABASE_UNAVAILABLE if the query fails.
 */
router.get('/', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Health] Database check failed:', err.message);
    res.status(503).json({
      error: {
        message: 'Database unavailable',
        code: 'DATABASE_UNAVAILABLE',
      },
    });
  }
});

export default router;
