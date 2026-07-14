import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import wikiRoutes from './routes/wiki.js';
import userRoutes from './routes/user.js';
import searchRoutes from './routes/search.js';

dotenv.config();

const app = express();

const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ])
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow tools/clients without Origin header (e.g. curl, server-to-server)
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const resolveMongoUri = () => {
  const configuredMongoUri = process.env.MONGODB_URI?.trim();

  console.log('MONGODB_URI exists:', !!configuredMongoUri);

  if (configuredMongoUri) {
    console.log(`MONGODB_URI prefix: ${configuredMongoUri.slice(0, 25)}`);
    return configuredMongoUri;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production');
  }

  console.warn('MONGODB_URI is missing. Falling back to local MongoDB for development.');
  return 'mongodb://localhost:27017/wiki-manager';
};

const startServer = async () => {
  try {
    const mongoUri = resolveMongoUri();
    await connectDB(mongoUri);

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📚 Wiki Manager Backend v1.0.0`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();

export default app;
