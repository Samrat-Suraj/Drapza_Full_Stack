import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  getAdminStats,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  cancelOrder,
} from '../controllers/orderController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// Order Creation — Authentication strictly required
router.post('/create', protect, createOrder);
router.post('/', protect, createOrder);

// Customer Personal Orders
router.get('/my-orders', protect, getMyOrders);

// Public Order Tracking by unified tracking reference
router.get('/track/:trackingRef', trackOrder);

// Admin-Only Order Management & Stats
router.get('/admin/stats', protect, adminOnly, getAdminStats);
router.get('/admin/all', protect, adminOnly, getAllOrdersAdmin);
router.get('/', protect, adminOnly, getAllOrdersAdmin);
router.put('/:id/status', protect, adminOnly, updateOrderStatusAdmin);

// Order Cancellation — Protected
router.post('/:id/cancel', protect, cancelOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Single Order Inspection — Protected (Customer can only inspect their own; Admin can inspect any)
router.get('/:id', protect, getOrderById);

export default router;
