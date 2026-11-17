import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // Diizinkan untuk testing & PWA client
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check Endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'online',
      service: 'Bank Sampah Sekeloa REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // REST API v1 Routes
  app.use('/api/v1', routes);

  // 404 Not Found Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Rute '${req.originalUrl}' tidak ditemukan pada server ini.`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;

