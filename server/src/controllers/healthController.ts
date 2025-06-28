import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ErrorResponse } from '../middleware/errorHandler';

/**
 * @desc    Health check endpoint
 * @route   GET /health
 * @access  Public
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const formatMemoryUsage = (bytes: number) => 
      `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;

    // Prepare health check data
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        connectionState: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState]
      },
      memory: {
        rss: formatMemoryUsage(memoryUsage.rss),
        heapTotal: formatMemoryUsage(memoryUsage.heapTotal),
        heapUsed: formatMemoryUsage(memoryUsage.heapUsed),
        external: formatMemoryUsage(memoryUsage.external || 0),
      },
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
    };

    res.status(200).json(healthData);
  } catch (error) {
    throw new ErrorResponse('Health check failed', 503);
  }
};

export default { healthCheck };
