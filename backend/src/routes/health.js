import { Router } from 'express';

const router = Router();

/**
 * GET /api/v1/health
 * Liveness check. Returns { "status": "ok" }.
 * Does NOT check DB connectivity (liveness only per contract).
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
