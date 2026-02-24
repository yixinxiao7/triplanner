import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// Body parsing
app.use(express.json());

// Routes
app.use('/api/v1/health', healthRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;
