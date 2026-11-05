import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env.config';

const router = Router();

const getMongoStatus = () => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

router.get('/', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: env.NODE_ENV,
    database: {
      status: getMongoStatus(),
      name: mongoose.connection.name || 'hrms_db',
    },
    system: {
      nodeVersion: process.version,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
    },
    version: '1.0.0',
  };

  return sendSuccess(res, 'HRMS API is running smoothly', healthData);
});

export const healthRoutes = router;
