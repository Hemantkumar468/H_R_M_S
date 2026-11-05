import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.config';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { apiRoutes } from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Trust reverse proxy (Render, Vercel rewrite) for rate limiting & secure cookies
  app.set('trust proxy', 1);

  // Security HTTP Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // In API mode
    }),
  );

  // CORS Configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    env.CLIENT_URL.replace(/\/+$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
  });
  app.use('/api', limiter);

  // Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request Logging
  app.use(requestLogger);

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadsPath));

  // Welcome Route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'HRMS Core Enterprise API',
      version: '1.0.0',
      docs: '/api/docs',
      health: `${env.API_PREFIX}/health`,
    });
  });

  // API Routes
  app.use(env.API_PREFIX, apiRoutes);

  // 404 & Central Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
