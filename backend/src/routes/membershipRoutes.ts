import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getPublicPlans,
  getMyMembership,
  createMembershipOrder,
  verifyMembershipPayment,
  recordQrScan,
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  getAdminSubscriptions,
  grantAdminMembership,
  updateAdminSubscription,
  deleteAdminSubscription,
  revokeAdminMembership,
  getAdminStats,
  getAdminQrCampaigns,
  createOrUpdateQrCampaign,
  deleteQrCampaign,
} from '../controllers/membershipController';

const router = Router();

// Public routes
router.get('/plans', getPublicPlans);
router.post('/record-qr-scan', recordQrScan);

// Customer authenticated routes
router.get('/my-membership', protect, getMyMembership);
router.post('/create-order', protect, createMembershipOrder);
router.post('/verify-payment', protect, verifyMembershipPayment);

// Admin RBAC routes
router.get('/admin/plans', protect, adminOnly, getAdminPlans);
router.post('/admin/plans', protect, adminOnly, createAdminPlan);
router.put('/admin/plans/:id', protect, adminOnly, updateAdminPlan);
router.delete('/admin/plans/:id', protect, adminOnly, deleteAdminPlan);

router.get('/admin/subscriptions', protect, adminOnly, getAdminSubscriptions);
router.post('/admin/grant', protect, adminOnly, grantAdminMembership);
router.put('/admin/subscriptions/:id', protect, adminOnly, updateAdminSubscription);
router.delete('/admin/subscriptions/:id', protect, adminOnly, deleteAdminSubscription);
router.post('/admin/revoke/:id', protect, adminOnly, revokeAdminMembership);
router.get('/admin/stats', protect, adminOnly, getAdminStats);

router.get('/admin/qr-campaigns', protect, adminOnly, getAdminQrCampaigns);
router.post('/admin/qr-campaigns', protect, adminOnly, createOrUpdateQrCampaign);
router.delete('/admin/qr-campaigns/:id', protect, adminOnly, deleteQrCampaign);

export default router;

