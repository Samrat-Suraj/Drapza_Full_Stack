import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URL: process.env.MONGO_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'drapza_jwt_secret_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'drapza_jwt_refresh_secret_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || process.env.NODEMAILER_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.NODEMAILER_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'DRAPZA',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'drapza.cloth@gmail.com',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'drapza.cloth@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_NAME: process.env.CLOUDINARY_API_NAME || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID || '',
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY || '',
  CASHFREE_ENV: process.env.CASHFREE_ENV || 'TEST',
  CASHFREE_API_VERSION: process.env.CASHFREE_API_VERSION || '2023-08-01',
};

