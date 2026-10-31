import { Router } from 'express';
import {
  getTestimonials,
  updateTestimonialsConfig,
  resetTestimonialsConfig,
  getTouchpointConfig,
  updateTouchpointConfig,
  uploadTouchpointImage,
  resetTouchpointConfig,
  getTerms,
  getHeroConfig,
  updateHeroConfig,
  uploadHeroImage,
  resetHeroConfig,
  getLookbookConfig,
  getStatementConfig,
  updateStatementConfig,
  uploadStatementSymbol,
  resetStatementConfig,
  getMarqueeConfig,
  updateMarqueeConfig,
  uploadMarqueeImage,
  resetMarqueeConfig,
  getPeelRevealConfig,
  updatePeelRevealConfig,
  uploadPeelRevealImage,
  resetPeelRevealConfig,
  getContactConfig,
  updateContactConfig,
  uploadContactImage,
  resetContactConfig,
  getGstConfig,
  updateGstConfig,
  resetGstConfig,
  getPaymentConfig,
  updatePaymentConfig,
  uploadPaymentQr,
  resetPaymentConfig,
  getFooterConfig,
  updateFooterConfig,
  uploadFooterImage,
  resetFooterConfig,
  getSiteConfig,
  updateSiteConfig,
  uploadSiteConfigAsset,
  resetSiteConfig,
  getCtaConfig,
  updateCtaConfig,
  uploadCtaImage,
  resetCtaConfig,
  getTextBlockConfig,
  updateTextBlockConfig,
  uploadTextBlockSymbol,
  resetTextBlockConfig,
  getVaultDropsConfig,
  updateVaultDropsConfig,
  resetVaultDropsConfig,
  requestVipPasscode,
  getFabricGsmConfig,
  updateFabricGsmConfig,
  resetFabricGsmConfig,
  getRunwayReelsConfig,
  updateRunwayReelsConfig,
  resetRunwayReelsConfig,
  getAuthPortalConfig,
  updateAuthPortalConfig,
  resetAuthPortalConfig,
  getBundleConfig,
  updateBundleConfig,
  uploadBundleImage,
  resetBundleConfig,
  getCountdownConfig,
  updateCountdownConfig,
  uploadCountdownImage,
  resetCountdownConfig,
  getGenesisConfig,
  updateGenesisConfig,
  uploadGenesisImage,
  resetGenesisConfig,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  resetWhatsAppConfig,
} from '../controllers/contentController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/testimonials-config', getTestimonials);
router.put('/testimonials-config', protect, adminOnly, updateTestimonialsConfig);
router.post('/testimonials-config/reset', protect, adminOnly, resetTestimonialsConfig);

// Touchpoint & Concierge CMS Routes
router.get('/touchpoint-config', getTouchpointConfig);
router.put('/touchpoint-config', protect, adminOnly, updateTouchpointConfig);
router.post('/touchpoint-config/upload', protect, adminOnly, uploadTouchpointImage);
router.post('/touchpoint-config/reset', protect, adminOnly, resetTouchpointConfig);

router.get('/terms-config', getTerms);

// Hero Section CMS Routes
router.get('/hero-config', getHeroConfig);
router.put('/hero-config', protect, adminOnly, updateHeroConfig);
router.post('/hero-config/upload', protect, adminOnly, uploadHeroImage);
router.post('/hero-config/reset', protect, adminOnly, resetHeroConfig);

// Statement / Philosophy / About Section CMS Routes
router.get('/statement-config', getStatementConfig);
router.put('/statement-config', protect, adminOnly, updateStatementConfig);
router.post('/statement-config/upload', protect, adminOnly, uploadStatementSymbol);
router.post('/statement-config/reset', protect, adminOnly, resetStatementConfig);

// Marquee Banner / Card Section CMS Routes
router.get('/marquee-config', getMarqueeConfig);
router.put('/marquee-config', protect, adminOnly, updateMarqueeConfig);
router.post('/marquee-config/upload', protect, adminOnly, uploadMarqueeImage);
router.post('/marquee-config/reset', protect, adminOnly, resetMarqueeConfig);

// Peel Reveal & Motion Mask CMS Routes
router.get('/peel-reveal-config', getPeelRevealConfig);
router.put('/peel-reveal-config', protect, adminOnly, updatePeelRevealConfig);
router.post('/peel-reveal-config/upload', protect, adminOnly, uploadPeelRevealImage);
router.post('/peel-reveal-config/reset', protect, adminOnly, resetPeelRevealConfig);

// Contact / Transmit Signal Newsletter CMS Routes
router.get('/contact-config', getContactConfig);
router.put('/contact-config', protect, adminOnly, updateContactConfig);
router.post('/contact-config/upload', protect, adminOnly, uploadContactImage);
router.post('/contact-config/reset', protect, adminOnly, resetContactConfig);

router.get('/lookbook-config', getLookbookConfig);

// CTA Silhouettes Tri-Card CMS Routes
router.get('/cta-config', getCtaConfig);
router.put('/cta-config', protect, adminOnly, updateCtaConfig);
router.post('/cta-config/upload', protect, adminOnly, uploadCtaImage);
router.post('/cta-config/reset', protect, adminOnly, resetCtaConfig);

// Editorial Text Block & Narrative CMS Routes
router.get('/textblock-config', getTextBlockConfig);
router.put('/textblock-config', protect, adminOnly, updateTextBlockConfig);
router.post('/textblock-config/upload', protect, adminOnly, uploadTextBlockSymbol);
router.post('/textblock-config/reset', protect, adminOnly, resetTextBlockConfig);

// Vault Drops Scarcity Allocation CMS Routes
router.get('/vault-drops-config', getVaultDropsConfig);
router.put('/vault-drops-config', protect, adminOnly, updateVaultDropsConfig);
router.post('/vault-drops-config/reset', protect, adminOnly, resetVaultDropsConfig);
router.post('/vault-drops-config/vip-request', requestVipPasscode);

// Fabric GSM Science CMS Routes
router.get('/fabric-gsm-config', getFabricGsmConfig);
router.put('/fabric-gsm-config', protect, adminOnly, updateFabricGsmConfig);
router.post('/fabric-gsm-config/reset', protect, adminOnly, resetFabricGsmConfig);

// Runway Reels CMS Routes
router.get('/runway-reels-config', getRunwayReelsConfig);
router.put('/runway-reels-config', protect, adminOnly, updateRunwayReelsConfig);
router.post('/runway-reels-config/reset', protect, adminOnly, resetRunwayReelsConfig);

// Auth & Login Portal CMS Routes
router.get('/auth-portal-config', getAuthPortalConfig);
router.put('/auth-portal-config', protect, adminOnly, updateAuthPortalConfig);
router.post('/auth-portal-config/reset', protect, adminOnly, resetAuthPortalConfig);

// GST & Invoice Studio CMS Routes
router.get('/gst-config', getGstConfig);
router.put('/gst-config', protect, adminOnly, updateGstConfig);
router.post('/gst-config/reset', protect, adminOnly, resetGstConfig);

// Payment Authentication & Gateways CMS Routes
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', protect, adminOnly, updatePaymentConfig);
router.post('/payment-config/upload-qr', protect, adminOnly, uploadPaymentQr);
router.post('/payment-config/reset', protect, adminOnly, resetPaymentConfig);

// Footer Architecture CMS Routes
router.get('/footer-config', getFooterConfig);
router.put('/footer-config', protect, adminOnly, updateFooterConfig);
router.post('/footer-config/upload', protect, adminOnly, uploadFooterImage);
router.post('/footer-config/reset', protect, adminOnly, resetFooterConfig);

// Browser Tab Title & SEO CMS Routes
router.get('/site-config', getSiteConfig);
router.put('/site-config', protect, adminOnly, updateSiteConfig);
router.post('/site-config/upload', protect, adminOnly, uploadSiteConfigAsset);
router.post('/site-config/reset', protect, adminOnly, resetSiteConfig);

// Bundle Stacker / Modular Outfit Builder CMS Routes
router.get('/bundle-config', getBundleConfig);
router.put('/bundle-config', protect, adminOnly, updateBundleConfig);
router.post('/bundle-config/upload', protect, adminOnly, uploadBundleImage);
router.post('/bundle-config/reset', protect, adminOnly, resetBundleConfig);

// Flash Sale Countdown Timer & Drop Banner CMS Routes
router.get('/countdown-config', getCountdownConfig);
router.put('/countdown-config', protect, adminOnly, updateCountdownConfig);
router.post('/countdown-config/upload', protect, adminOnly, uploadCountdownImage);
router.post('/countdown-config/reset', protect, adminOnly, resetCountdownConfig);

// Genesis Architecture Page CMS Routes
router.get('/genesis-config', getGenesisConfig);
router.put('/genesis-config', protect, adminOnly, updateGenesisConfig);
router.post('/genesis-config/upload', protect, adminOnly, uploadGenesisImage);
router.post('/genesis-config/reset', protect, adminOnly, resetGenesisConfig);

// WhatsApp Floating Button & Concierge Widget CMS Routes
router.get('/whatsapp-config', getWhatsAppConfig);
router.put('/whatsapp-config', protect, adminOnly, updateWhatsAppConfig);
router.post('/whatsapp-config/reset', protect, adminOnly, resetWhatsAppConfig);

export default router;


