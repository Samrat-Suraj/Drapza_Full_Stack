import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointment,
  deleteAppointment,
  exportAppointmentsCsv,
  sendAppointmentNotification,
} from '../controllers/appointmentController';
import { optionalProtect } from '../middleware/auth';

const router = Router();

// Public / Client booking and querying
router.post('/', optionalProtect, bookAppointment);
router.get('/my', optionalProtect, getMyAppointments);

// Admin operations
router.get('/export-csv', exportAppointmentsCsv);
router.get('/', getAllAppointments);
router.patch('/:id', updateAppointment);
router.post('/:id/notify', sendAppointmentNotification);
router.delete('/:id', deleteAppointment);

export default router;
