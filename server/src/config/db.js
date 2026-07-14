import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`);
    return false;
  }
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;

  return {
    connected: state === 1,
    state: states[state] || 'unknown',
  };
}
