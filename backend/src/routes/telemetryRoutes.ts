import { Router } from 'express';
import {
  logSearchQuery,
  getSearchAnalytics,
  seedSampleTelemetry,
  clearSearchTelemetry,
  exportSearchRadarCsv,
  recordVisitorLocation,
  getAllVisitorLocations,
  clearVisitorLocations,
} from '../controllers/telemetryController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// Public Telemetry Collectors
router.post('/search-log', logSearchQuery);
router.post('/location', recordVisitorLocation);

// Admin Analytics & Controls
router.get('/search-analytics', protect, adminOnly, getSearchAnalytics);
router.post('/seed-sample', protect, adminOnly, seedSampleTelemetry);
router.delete('/search-logs', protect, adminOnly, clearSearchTelemetry);
router.get('/export-radar-csv', protect, adminOnly, exportSearchRadarCsv);
router.get('/location/all', protect, adminOnly, getAllVisitorLocations);
router.delete('/location/clear', protect, adminOnly, clearVisitorLocations);

export default router;
