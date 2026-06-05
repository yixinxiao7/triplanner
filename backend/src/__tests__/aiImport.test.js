import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the GeminiService so no real Gemini call happens ─────────────────────
// The route does `new GeminiService(key).parseItineraryFromPdf(...)`. We make the
// constructor return an object whose method is a shared programmable mock.
const parseItineraryFromPdf = vi.fn();

vi.mock('../services/geminiService.js', () => ({
  default: vi.fn(function () {
    this.parseItineraryFromPdf = parseItineraryFromPdf;
  }),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import aiRoutes from '../routes/ai.js';
import { errorHandler } from '../middleware/errorHandler.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/ai', aiRoutes);
  app.use(errorHandler);
  return app;
}

const AUTH = { Authorization: 'Bearer valid-token' };

/**
 * Send a multipart/form-data POST with a single file part.
 * @param fileBuffer  raw bytes of the "file" part
 * @param mimeType    the part's Content-Type
 */
async function uploadFile(app, path, fileBuffer, mimeType, headers = {}) {
  const boundary = '----vitestBoundary' + Math.random().toString(16).slice(2);
  const pre =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="itinerary.pdf"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const post = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(pre), fileBuffer, Buffer.from(post)]);

  const { createServer } = await import('http');
  const server = createServer(app);
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          ...headers,
        },
      };
      import('http').then(({ default: http }) => {
        const req = http.request(`http://localhost:${port}${path}`, options, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        });
        req.on('error', (e) => { server.close(); reject(e); });
        req.write(body);
        req.end();
      });
    });
  });
}

const CONTRACT = {
  trip: { name: 'Japan 2026', destinations: ['Tokyo'], start_date: null, end_date: null, notes: null },
  flights: [],
  stays: [],
  activities: [],
  land_travels: [],
};

describe('POST /api/v1/ai/import/parse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path: returns the parsed contract', async () => {
    parseItineraryFromPdf.mockResolvedValue(CONTRACT);

    const res = await uploadFile(
      buildApp(),
      '/api/v1/ai/import/parse',
      Buffer.from('%PDF-1.4 fake content'),
      'application/pdf',
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.trip.name).toBe('Japan 2026');
    expect(parseItineraryFromPdf).toHaveBeenCalledOnce();
  });

  it('error path: non-PDF file rejected with 400 INVALID_FILE_TYPE', async () => {
    const res = await uploadFile(
      buildApp(),
      '/api/v1/ai/import/parse',
      Buffer.from('plain text, not a pdf'),
      'text/plain',
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    expect(parseItineraryFromPdf).not.toHaveBeenCalled();
  });

  it('error path: file over 10MB rejected with 400 FILE_TOO_LARGE', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1024, 0x41); // > 10MB
    const res = await uploadFile(
      buildApp(),
      '/api/v1/ai/import/parse',
      big,
      'application/pdf',
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    expect(parseItineraryFromPdf).not.toHaveBeenCalled();
  });

  it('error path: Gemini failure surfaces as 502 EXTERNAL_SERVICE_ERROR', async () => {
    const err = new Error('Could not read the itinerary. Please try again.');
    err.status = 502;
    err.code = 'EXTERNAL_SERVICE_ERROR';
    parseItineraryFromPdf.mockRejectedValue(err);

    const res = await uploadFile(
      buildApp(),
      '/api/v1/ai/import/parse',
      Buffer.from('%PDF-1.4 fake'),
      'application/pdf',
      AUTH,
    );

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(res.body.error.message).toMatch(/Could not read the itinerary/);
  });

  it('error path: 401 without auth', async () => {
    const res = await uploadFile(
      buildApp(),
      '/api/v1/ai/import/parse',
      Buffer.from('%PDF-1.4 fake'),
      'application/pdf',
    );

    expect(res.status).toBe(401);
  });
});
