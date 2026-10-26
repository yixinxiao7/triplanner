import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  default: { raw: vi.fn() },
}));

import express from 'express';
import healthRoutes from '../routes/health.js';
import db from '../config/database.js';

function buildApp() {
  const app = express();
  app.use('/api/v1/health', healthRoutes);
  return app;
}

async function get(app, path) {
  const { default: http } = await import('http');
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      http
        .get(`http://localhost:${port}${path}`, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        })
        .on('error', (e) => {
          server.close();
          reject(e);
        });
    });
  });
}

describe('GET /api/v1/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs SELECT 1 and returns 200 { status: ok } when the database responds', async () => {
    db.raw.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const res = await get(buildApp(), '/api/v1/health');

    expect(db.raw).toHaveBeenCalledWith('SELECT 1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 503 DATABASE_UNAVAILABLE when the database query fails', async () => {
    db.raw.mockRejectedValue(new Error('connection refused'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await get(buildApp(), '/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(JSON.stringify(res.body)).not.toContain('connection refused');
    errSpy.mockRestore();
  });
});
