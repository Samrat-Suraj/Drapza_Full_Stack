import { Router } from 'express';
import {
  // Newsletter CRM
  subscribeNewsletter,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  toggleNewsletterSubscriber,
  sendNewsletterBroadcast,
  exportNewsletterCsv,
  // Coupon / Promo CMS
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  seedCoupons,
  // BOGO Bundle Tiers CMS
  getBogoConfig,
  updateBogoConfig,
  resetBogoConfig,
  // Wallet & Gift Cards
  getWalletProfile,
  redeemGiftCard,
  verifyGiftCardBalance,
  adminAdjustWallet,
  adminCreateGiftCard,
  adminGetGiftCards,
  adminCancelGiftCard,
  adminExtendGiftCardExpiry,
  // Shop The Look / UGC
  getShopTheLookPosts,
  adminGetAllShopTheLookPosts,
  createShopTheLookPost,
  deleteShopTheLookPost,
} from '../controllers/promoController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────
// NEWSLETTER CRM ROUTES
// ─────────────────────────────────────────────────────────────
router.post('/newsletter/subscribe', subscribeNewsletter);
router.get('/newsletter/subscribers', protect, adminOnly, getNewsletterSubscribers);
router.delete('/newsletter/subscribers/:id', protect, adminOnly, deleteNewsletterSubscriber);
router.patch('/newsletter/subscribers/:id/toggle', protect, adminOnly, toggleNewsletterSubscriber);
router.post('/newsletter/broadcast', protect, adminOnly, sendNewsletterBroadcast);
router.get('/newsletter/export-csv', protect, adminOnly, exportNewsletterCsv);

// ─────────────────────────────────────────────────────────────
// COUPON / PROMO CMS ROUTES
// ─────────────────────────────────────────────────────────────
router.post('/coupon/validate', validateCoupon); // Public checkout coupon validation
router.get('/coupon', protect, adminOnly, getAllCoupons);
router.post('/coupon', protect, adminOnly, createCoupon);
router.post('/coupon/seed', protect, adminOnly, seedCoupons);
router.put('/coupon/:id', protect, adminOnly, updateCoupon);
router.delete('/coupon/:id', protect, adminOnly, deleteCoupon);
router.patch('/coupon/:id/toggle', protect, adminOnly, toggleCouponStatus);

// ─────────────────────────────────────────────────────────────
// BOGO & BUNDLE TIERS CMS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/bogo-config', getBogoConfig);
router.put('/bogo-config', protect, adminOnly, updateBogoConfig);
router.post('/bogo-config/reset', protect, adminOnly, resetBogoConfig);

// ─────────────────────────────────────────────────────────────
// WALLET & GIFT CARDS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/wallet/profile', protect, getWalletProfile);
router.post('/wallet/redeem-giftcard', protect, redeemGiftCard);
router.post('/wallet/gift-cards/verify-balance', verifyGiftCardBalance);
router.post('/wallet/admin/adjust-balance', protect, adminOnly, adminAdjustWallet);
router.post('/wallet/admin/gift-cards', protect, adminOnly, adminCreateGiftCard);
router.get('/wallet/admin/gift-cards', protect, adminOnly, adminGetGiftCards);
router.post('/wallet/admin/gift-cards/:id/cancel', protect, adminOnly, adminCancelGiftCard);
router.post('/wallet/admin/gift-cards/:id/extend-expiry', protect, adminOnly, adminExtendGiftCardExpiry);

// ─────────────────────────────────────────────────────────────
// SHOP THE LOOK / UGC INSTAGRAM FEED ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/shop-the-look', getShopTheLookPosts);
router.get('/shop-the-look/admin/all', protect, adminOnly, adminGetAllShopTheLookPosts);
router.post('/shop-the-look', protect, adminOnly, createShopTheLookPost);
router.delete('/shop-the-look/:id', protect, adminOnly, deleteShopTheLookPost);

export default router;
