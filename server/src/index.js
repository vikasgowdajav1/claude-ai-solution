import app from './app.js';
import { connectDB, resolveMongoUri } from './config/database.js';

const PORT = process.env.PORT || 3001;

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
