import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/wiki-manager';
const connectionCache = globalThis.__mongooseConnectionCache || {
  promise: null
};

globalThis.__mongooseConnectionCache = connectionCache;

export const resolveMongoUri = () => {
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
  return DEFAULT_MONGODB_URI;
};

export const connectDB = async (mongoUri) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionCache.promise) {
    connectionCache.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    }).then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      return mongooseInstance.connection;
    }).catch((error) => {
      connectionCache.promise = null;
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    });
  }

  try {
    return await connectionCache.promise;
  } catch (error) {
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    connectionCache.promise = null;
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error.message);
    throw error;
  }
};
