import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import taskRoutes from './routes/task.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/', (_request, response) => {
    response.json({
      name: 'MERN Launchpad API',
      version: '1.0.0',
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/tasks', taskRoutes);

  app.use((error, _request, response, _next) => {
    response.status(error.statusCode || 500).json({
      message: error.message || 'Unexpected server error.',
    });
  });

  return app;
}
