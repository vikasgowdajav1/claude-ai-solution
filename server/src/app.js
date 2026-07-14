import './config/loadEnv.js';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import wikiRoutes from './routes/wiki.js';
import userRoutes from './routes/user.js';
import searchRoutes from './routes/search.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = resolve(__dirname, '../../client/dist');

const app = express();

const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const vercelOrigins = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
]
  .filter(Boolean)
  .map((origin) => `https://${origin}`);

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    ...vercelOrigins,
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

// Serve built frontend in production / Render
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(resolve(clientDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });
}

app.use(errorHandler);

export default app;