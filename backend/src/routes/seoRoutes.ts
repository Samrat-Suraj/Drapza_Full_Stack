import { Router } from 'express';
import {
  getSeoSettings,
  updateSeoSettings,
  getPageOverrides,
  upsertPageOverride,
  deletePageOverride,
  getRedirects,
  createRedirect,
  deleteRedirect,
  toggleRedirect,
  getSitemapData,
  getRobotsData,
  runSeoAudit,
  runGeoAudit,
  generateSeoCopy,
  getAuditReports,
  deleteAuditReport,
  autoFixSeo,
  autoFixAllSiteSeo,
  crawlSiteAudit,
  crawlAndFixSite,
} from '../controllers/seoController';

const router = Router();

// Publicly readable SEO data (for dynamic Next.js sitemap, robots, and page metadata)
router.get('/settings', getSeoSettings);
router.get('/pages', getPageOverrides);
router.get('/sitemap', getSitemapData);
router.get('/robots', getRobotsData);
router.get('/redirects', getRedirects);

// Admin-controlled mutation & toolkit operations
router.put('/settings', updateSeoSettings);
router.post('/pages', upsertPageOverride);
router.delete('/pages/:id', deletePageOverride);

router.post('/redirects', createRedirect);
router.delete('/redirects/:id', deleteRedirect);
router.patch('/redirects/:id/toggle', toggleRedirect);

router.post('/audit', runSeoAudit);
router.post('/auto-fix', autoFixSeo);
router.post('/auto-fix-all', autoFixAllSiteSeo);
router.post('/crawl-audit', crawlSiteAudit);
router.post('/crawl-and-fix', crawlAndFixSite);
router.post('/geo-audit', runGeoAudit);
router.post('/copywrite', generateSeoCopy);

router.get('/reports', getAuditReports);
router.delete('/reports/:id', deleteAuditReport);

export default router;
