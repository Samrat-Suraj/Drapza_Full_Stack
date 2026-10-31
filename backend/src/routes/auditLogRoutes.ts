import { Router } from 'express';
import {
  getSecurityOverview,
  getAuditSessions,
  getAuditSessionDetail,
  terminateAuditSession,
  getBlacklistedIps,
  banIp,
  unbanIp,
  exportAuditCsv,
} from '../controllers/auditLogController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// Security telemetry and audit governance require admin access
router.use(protect, adminOnly);

router.get('/overview', getSecurityOverview);
router.get('/sessions', getAuditSessions);
router.get('/sessions/:id', getAuditSessionDetail);
router.post('/sessions/:id/terminate', terminateAuditSession);

router.get('/blacklist', getBlacklistedIps);
router.post('/blacklist', banIp);
router.delete('/blacklist', unbanIp);

router.get('/export', exportAuditCsv);

export default router;
