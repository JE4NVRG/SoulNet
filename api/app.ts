/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { assertEnv } from './utils/assertEnv';
import { sendSuccess, sendError } from './utils/apiResponse';
import authRoutes from './routes/auth';
import memoriesRoutes from './routes/memories';
import achievementsRoutes from './routes/achievements';
import analyticsRoutes from './routes/analytics';
import chatRoutes from './routes/chat';
import pushRoutes from './routes/push';

// load env
dotenv.config();

// Validate required environment variables on startup
try {
  assertEnv();
  console.log('[ENV] All required environment variables are present');
} catch (error) {
  console.error('[ENV FATAL] Server cannot start without required environment variables');
  process.exit(1);
}


const app: express.Application = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/push', pushRoutes);

/**
 * health
 */
app.use('/api/health', (_req: Request, res: Response): void => {
  sendSuccess(res, {
    ts: new Date().toISOString()
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[API ERROR]', {
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack
  });
  
  sendError(res, 'Internal Server Error', 'INTERNAL', 500);
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  sendError(res, 'API not found', 'NOT_FOUND', 404);
});

/**
 * Global error handler for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', { reason, promise });
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

export default app;