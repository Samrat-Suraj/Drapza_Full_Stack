import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import addressRoutes from './routes/addressRoutes';
import contentRoutes from './routes/contentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import telemetryRoutes from './routes/telemetryRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import returnRoutes from './routes/returnRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import promoRoutes from './routes/promoRoutes';
import storeOpsRoutes from './routes/storeOpsRoutes';
import cartRoutes from './routes/cartRoutes';
import sharedBagRoutes from './routes/sharedBagRoutes';
import seoRoutes from './routes/seoRoutes';
import membershipRoutes from './routes/membershipRoutes';

const app = express();

// Allowed origins
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'DRAPZA Atelier API Engine (TypeScript)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/user', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/products', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/bag', cartRoutes);
app.use('/api/shared-bag', sharedBagRoutes);
app.use('/api', promoRoutes);
app.use('/api', storeOpsRoutes);
app.use('/api', contentRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/membership', membershipRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Resource endpoint not found.' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal atelier system error.',
  });
});

export default app;
