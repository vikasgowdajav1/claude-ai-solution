import app from '../src/app.js';
import { connectDB, resolveMongoUri } from '../src/config/database.js';

const ensureDatabaseConnection = async () => {
  const mongoUri = resolveMongoUri();
  await connectDB(mongoUri);
};

export default async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('❌ Vercel request bootstrap failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed during request bootstrap'
    });
  }
}