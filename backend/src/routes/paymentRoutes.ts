import { Router } from 'express';
import {
  createCodOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCashfreeOrder,
  verifyCashfreePayment,
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

// All payment transactions and order confirmations strictly require authentication
router.use(protect);

// COD Order
router.post('/cod', createCodOrder);

// Razorpay Routes
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

// Cashfree Routes
router.post('/cashfree/create-order', createCashfreeOrder);
router.post('/cashfree/verify', verifyCashfreePayment);

export default router;
