import mongoose from 'mongoose';
import { env } from './env';

// Track connection status
mongoose.connection.on('disconnected', () => {
  console.warn('[MONGO] Disconnected from MongoDB cluster. Attempting auto-reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MONGO] Successfully reconnected to MongoDB cluster.');
});

mongoose.connection.on('error', (err: any) => {
  console.error('[MONGO] Cluster connection error:', err?.message || err);
});

export const connectDB = async (): Promise<boolean> => {
  try {
    if (!env.MONGO_URL) {
      console.warn('MONGO_URL is missing in environment variables.');
      return false;
    }

    const conn = await mongoose.connect(env.MONGO_URL, {
      serverSelectionTimeoutMS: 6000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.error(`MongoDB Connection Error: ${error?.message || error}`);
    return false;
  }
};

