import { Router } from 'express';
import {
  getReturnRequests,
  getReturnById,
  validateOrderEligibility,
  createReturnRequest,
  updateReturnStatus,
  sendReturnNotification,
  exportReturnsCsv,
  deleteReturnRequest,
} from '../controllers/returnController';

const router = Router();

// 3PL Reverse Logistics CSV Export
router.get('/export-csv', exportReturnsCsv);

// Order Return / Exchange eligibility validation
router.get('/validate-eligibility/:ref', validateOrderEligibility);

// Collection endpoints
router.get('/', getReturnRequests);
router.post('/', createReturnRequest);

// Specific return dossier endpoints
router.get('/:id', getReturnById);
router.patch('/:id/status', updateReturnStatus);
router.put('/:id', updateReturnStatus);
router.post('/:id/notify', sendReturnNotification);
router.delete('/:id', deleteReturnRequest);

export default router;
