import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { User } from './models/User';
import { checkAndLogMailSystems } from './utils/mailer';
import { initSocketServer } from './socket';

const startServer = async () => {
  console.log('Initializing DRAPZA TypeScript Server...');

  // Connect to Database
  const isDbConnected = await connectDB();

  if (isDbConnected) {
    // Seed default admin account if not existing
    try {
      await User.findOneAndUpdate(
        { email: env.ADMIN_EMAIL.toLowerCase() },
        {
          $setOnInsert: {
            password: env.ADMIN_PASSWORD,
            isVerified: true,
          },
          $set: {
            name: 'DRAPZA ADMIN',
            phone: '9794603102',
            role: 'admin',
            tier: 'TIER 03',
            memberSince: 2026,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`Admin account ready: ${env.ADMIN_EMAIL} (DRAPZA ADMIN)`);
    } catch (err: any) {
      console.warn('Admin provision check skipped:', err.message);
    }
  }

  const PORT = env.PORT || 5000;
  const httpServer = http.createServer(app);

  // Initialize Socket.io real-time engine
  const io = initSocketServer(httpServer);

  const server = httpServer.listen(PORT, async () => {
    console.log(`DRAPZA ATELIER API ONLINE
PORT: http://localhost:${PORT}
HEALTH: http://localhost:${PORT}/api/health
SOCKET: Online (Real-Time Shared Bag & Collab enabled)
MODE: TypeScript (${process.env.NODE_ENV || 'development'})
-----------------------------------------------------`);
    await checkAndLogMailSystems();
  });

  const shutdown = () => {
    console.log('Gracefully shutting down server...');
    io.close();
    server.close(() => {
      console.log('Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  console.error('Fatal initialization failure:', err);
  process.exit(1);
});
