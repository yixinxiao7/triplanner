import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { uuidParamHandler } from './middleware/validateUUID.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';
import flightsRoutes from './routes/flights.js';
import staysRoutes from './routes/stays.js';
import activitiesRoutes from './routes/activities.js';

const app = express();

// ---- Security middleware ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Required for httpOnly cookie to be sent cross-origin
  }),
);

// ---- Body parsing ----
app.use(express.json());

// ---- Global UUID validation for :tripId param (T-027 / B-009) ----
// :tripId appears in the app-level route paths for sub-resource mounts.
// router.param() in child routers does NOT fire for params inherited from the parent,
// so we register it at the app level here to cover all sub-resource routes.
app.param('tripId', uuidParamHandler);

// ---- Routes ----
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/trips', tripsRoutes);

// Sub-resources — nested under trips (mergeParams handles :tripId)
app.use('/api/v1/trips/:tripId/flights', flightsRoutes);
app.use('/api/v1/trips/:tripId/stays', staysRoutes);
app.use('/api/v1/trips/:tripId/activities', activitiesRoutes);

// ---- Error handling (must be last) ----
app.use(errorHandler);

export default app;
