import 'dotenv/config';

function parsePort(value, fallback) {
  const parsedValue = Number.parseInt(value || '', 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_launchpad',
};
