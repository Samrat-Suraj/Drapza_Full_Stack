import { Router } from 'express';
import { optionalProtect } from '../middleware/auth';
import {
  getCart,
  syncCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cartController';

const router = Router();

// All cart routes support both authenticated users and guests
router.use(optionalProtect);

router.get('/', getCart);
router.post('/', syncCart);
router.post('/sync', syncCart);
router.post('/add', addToCart);
router.patch('/quantity', updateQuantity);
router.put('/update', updateQuantity);
router.post('/update', updateQuantity);
router.delete('/item/:cartItemId', removeFromCart);
router.delete('/remove/:cartItemId', removeFromCart);
router.delete('/clear', clearCart);
router.delete('/', clearCart);
router.post('/merge', mergeCart);

export default router;
