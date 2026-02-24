import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    res.json({ data: { status: 'ok', database: 'connected' } });
  } catch (error) {
    res.status(503).json({
      error: { message: 'Service unhealthy', code: 'SERVICE_UNAVAILABLE' },
    });
  }
});

export default router;
