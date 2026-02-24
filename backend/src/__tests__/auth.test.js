import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database models
vi.mock('../models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-token-abc'),
  hashToken: vi.fn((t) => `hash-of-${t}`),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => '$2a$12$hashedpassword'),
    compare: vi.fn(async () => true),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-access-token'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as userModel from '../models/userModel.js';
import * as refreshModel from '../models/refreshTokenModel.js';
import bcrypt from 'bcryptjs';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

// Mini HTTP test helper (no supertest needed)
async function request(app, method, path, body, headers = {}) {
  const { createServer } = await import('http');
  const server = createServer(app);
  
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${path}`;
      
      const options = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };
      
      import('http').then(({ default: http }) => {
        const req = http.request(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
            });
          });
        });
        req.on('error', (err) => { server.close(); reject(err); });
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userModel.findUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2026-02-24T12:00:00.000Z',
    });
    refreshModel.createRefreshToken.mockResolvedValue({});
  });

  it('happy path: creates user and returns 201 with access_token', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.access_token).toBe('mock-access-token');
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.name).toBe('Jane Doe');
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('error path: returns 409 when email already taken', async () => {
    userModel.findUserByEmail.mockResolvedValue({ id: 'existing-user' });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('error path: returns 400 with field errors when missing required fields', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      email: 'jane@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.name).toBeDefined();
    expect(res.body.error.fields.password).toBeDefined();
  });

  it('error path: returns 400 when password is too short', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toMatch(/8 characters/);
  });

  it('error path: returns 400 when email is invalid format', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      name: 'Jane',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userModel.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password_hash: '$2a$12$hashedpassword',
      created_at: '2026-02-24T12:00:00.000Z',
    });
    bcrypt.compare.mockResolvedValue(true);
    refreshModel.createRefreshToken.mockResolvedValue({});
  });

  it('happy path: returns 200 with access_token on valid credentials', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('mock-access-token');
    expect(res.body.data.user.email).toBe('jane@example.com');
  });

  it('error path: returns 401 when user does not exist', async () => {
    userModel.findUserByEmail.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('error path: returns 401 when password is wrong', async () => {
    bcrypt.compare.mockResolvedValue(false);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      email: 'jane@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('error path: returns 400 when fields are missing', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.email).toBeDefined();
    expect(res.body.error.fields.password).toBeDefined();
  });
});

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path: returns 200 with new access_token when valid refresh cookie', async () => {
    refreshModel.findValidRefreshToken.mockResolvedValue({
      id: 'token-1',
      user_id: 'user-1',
      expires_at: new Date(Date.now() + 86400000),
    });
    refreshModel.revokeRefreshToken.mockResolvedValue(1);
    refreshModel.createRefreshToken.mockResolvedValue({});
    userModel.findUserById.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
    });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/refresh', null, {
      Cookie: 'refresh_token=valid-raw-token',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('mock-access-token');
  });

  it('error path: returns 401 when no refresh cookie present', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/refresh', null);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('error path: returns 401 when refresh token not found in DB', async () => {
    refreshModel.findValidRefreshToken.mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/refresh', null, {
      Cookie: 'refresh_token=expired-token',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('happy path: returns 204 when authenticated', async () => {
    refreshModel.revokeRefreshToken.mockResolvedValue(1);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/logout', null, {
      Authorization: 'Bearer valid-token',
      Cookie: 'refresh_token=some-token',
    });

    expect(res.status).toBe(204);
  });

  it('error path: returns 401 when no auth token provided', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/auth/logout', null);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
