import { Router } from 'express';
import {
  getAnalyticsReport,
  exportExcelReport,
  seedDemoOrders,
  getAbandonedCarts,
} from '../controllers/reportController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// All analytics, sales reports and demo seeding require admin authentication
router.use(protect, adminOnly);

router.get('/analytics', getAnalyticsReport);
router.get('/export-excel', exportExcelReport);
router.get('/abandoned-carts', getAbandonedCarts);
router.post('/seed-orders', seedDemoOrders);

export default router;
