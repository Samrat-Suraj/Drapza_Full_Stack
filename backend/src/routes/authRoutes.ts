import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleRedirect,
  googleCallback,
  getAllUsers,
  toggleBlockUser,
  toggleDisableUser,
  toggleVerifyUser,
  terminateUserSession,
  updateUserRole,
  deleteUser,
  testSmtp,
} from '../controllers/authController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// Public Authentication Flow
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth
router.post('/google', googleAuth);
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

// Customer Personal Profile Management
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin User Governance & Access Control Routes
router.get('/all', protect, adminOnly, getAllUsers);
router.post('/admin/toggle-block/:id', protect, adminOnly, toggleBlockUser);
router.post('/admin/toggle-disable/:id', protect, adminOnly, toggleDisableUser);
router.post('/admin/toggle-verify/:id', protect, adminOnly, toggleVerifyUser);
router.post('/admin/terminate-session/:id', protect, adminOnly, terminateUserSession);
router.post('/admin/update-role/:id', protect, adminOnly, updateUserRole);
router.delete('/admin/delete/:id', protect, adminOnly, deleteUser);

// Admin Diagnostics
router.post('/test-smtp', protect, adminOnly, testSmtp);

export default router;
