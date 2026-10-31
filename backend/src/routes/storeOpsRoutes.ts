import { Router } from 'express';
import {
  // Shipping & COD
  getShippingConfig,
  updateShippingConfig,
  checkPincode,
  // Wardrobe Filters
  getFilterConfig,
  updateFilterConfig,
  resetFilterConfig,
  // Tickets
  getTickets,
  createTicket,
  updateTicket,
  replyToTicket,
  deleteTicket,
  exportTicketsCsv,
  // Reviews
  getReviewsByProduct,
  getReviewStats,
  checkReviewEligibility,
  createReview,
  voteHelpfulReview,
  adminGetAllReviews,
  adminCreateReview,
  adminUpdateReview,
  adminUpdateReviewStatus,
  adminBulkReviews,
  adminReplyReview,
  adminPinReview,
  adminDeleteReview,
} from '../controllers/storeOpsController';

const router = Router();

// ─────────────────────────────────────────────────────────────
// SHIPPING & COD CMS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/shipping-config', getShippingConfig);
router.put('/shipping-config', updateShippingConfig);
router.post('/shipping-config/check-pincode', checkPincode);

// ─────────────────────────────────────────────────────────────
// WARDROBE FILTERS CMS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/filter-config', getFilterConfig);
router.put('/filter-config', updateFilterConfig);
router.post('/filter-config/reset', resetFilterConfig);

// ─────────────────────────────────────────────────────────────
// CONCIERGE & SUPPORT TICKETS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/tickets/export-csv', exportTicketsCsv);
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.patch('/tickets/:id', updateTicket);
router.post('/tickets/:id/reply', replyToTicket);
router.delete('/tickets/:id', deleteTicket);

// ─────────────────────────────────────────────────────────────
// REVIEWS & RATINGS ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/reviews/stats', getReviewStats);
router.get('/reviews/check-eligibility', checkReviewEligibility);
router.get('/reviews/admin/all', adminGetAllReviews);
router.post('/reviews/admin/create', adminCreateReview);
router.put('/reviews/admin/:id', adminUpdateReview);
router.patch('/reviews/admin/:id', adminUpdateReview);
router.patch('/reviews/admin/:id/status', adminUpdateReviewStatus);
router.post('/reviews/admin/bulk', adminBulkReviews);
router.post('/reviews/admin/:id/reply', adminReplyReview);
router.post('/reviews/admin/:id/pin', adminPinReview);
router.delete('/reviews/admin/:id', adminDeleteReview);

router.get('/reviews', getReviewsByProduct);
router.post('/reviews', createReview);
router.post('/reviews/:id/helpful', voteHelpfulReview);

export default router;
