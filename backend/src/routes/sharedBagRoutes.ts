import { Router } from 'express';
import { optionalProtect } from '../middleware/auth';
import {
  createSharedBag,
  getSharedBagByShareId,
} from '../controllers/sharedBagController';

const router = Router();

// POST /api/shared-bag - uses optionalProtect to resolve authenticated user's DB name
router.post('/', optionalProtect, createSharedBag);

// GET /api/shared-bag/:shareId - public access for any recipient
router.get('/:shareId', getSharedBagByShareId);

export default router;
