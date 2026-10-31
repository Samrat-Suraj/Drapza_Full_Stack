import { Request, Response } from 'express';
import { SiteConfig } from '../models/Config';
import cloudinary from '../config/cloudinary';

export const DEFAULT_TESTIMONIALS_CONFIG = {
  heading: 'BOUTIQUE STORIES',
  subtext: 'Verified client reviews and architectural tailoring feedback',
  badgeText: '[ VERIFIED ATELIER CLIENTS ]',
  isEnabled: true,
  autoplay: true,
  autoplayInterval: 6000,
  items: [
    {
      id: 'diana-tigelle',
      name: 'Diana Tigelle',
      role: 'Editorial Director & Atelier Patron',
      city: 'Milan / New York',
      rating: 5,
      avatar: '/testimonials/diana-tigelle.png',
      quote:
        'Neither man nor woman is perfect or complete without the other. Thus, no marriage or family, no ward or stake is likely to reach its full potential until husbands and wives, mothers and fathers, men and women work together in unity of purpose, respecting and relying upon each other’s strengths.',
      badge: 'Order #DPZ-8910',
      isActive: true,
    },
    {
      id: 'marcus-vance',
      name: 'Marcus Vance',
      role: 'Creative Director, NeoTokyo Dept.',
      city: 'Berlin / Tokyo',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      quote:
        'The architectural drape of the Series-04 technical shell is peerless. Waterproof taped seams withstand torrential storms while maintaining a sculpted runway silhouette. Drapza sets the definitive standard for modular luxury.',
      badge: '0.003mm Seam Precision',
      isActive: true,
    },
    {
      id: 'elena-rostova',
      name: 'Elena Rostova',
      role: 'Senior Apparel Buyer, VANGUARD',
      city: 'Stockholm',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      quote:
        'Drapza represents the frontier of modular luxury. Our boutique sold out our initial delivery within 48 hours. The tactile weight of the fabric and precision of the hardware exceed mainline Parisian benchmarks.',
      badge: '100% Client Retention',
      isActive: true,
    },
    {
      id: 'kaelen-thorne',
      name: 'Kaelen Thorne',
      role: 'Urban Expeditionist & Collector',
      city: 'Vancouver',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      quote:
        'Tested the modular utility pockets through sub-zero alpine conditions and downtown transit. Ergonomics, fabric resilience, and silhouette balance are superior to anything currently existing in modern techwear.',
      badge: 'Tested at -18°C',
      isActive: true,
    },
  ],
};

export const getTestimonials = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'testimonials' });
    const testimonialsData = config?.data
      ? { ...DEFAULT_TESTIMONIALS_CONFIG, ...config.data }
      : DEFAULT_TESTIMONIALS_CONFIG;
    res.status(200).json({
      success: true,
      data: testimonialsData,
      ...testimonialsData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateTestimonialsConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'testimonials' },
      { key: 'testimonials', data: incomingData },
      { upsert: true, new: true }
    );
    const testimonialsData = { ...DEFAULT_TESTIMONIALS_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Testimonials configuration updated successfully.',
      data: testimonialsData,
      ...testimonialsData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetTestimonialsConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'testimonials' });
    res.status(200).json({
      success: true,
      message: 'Testimonials configuration reset to defaults.',
      data: DEFAULT_TESTIMONIALS_CONFIG,
      ...DEFAULT_TESTIMONIALS_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const DEFAULT_TOUCHPOINT_CONFIG = {
  isEnabled: true,
  heroHeading: 'Outbound access is limited, proceed with intent.',
  heroImage: '/contact/hero.png',
  commsLabel: 'External Comms Protocol',
  commsEmail: 'echo@drapza.com',
  dispatchLabel: 'Dispatch Inquiry System',
  dispatchEmail: 'dispatch@drapza.com',
  phoneLabel: 'Direct Phone Line',
  phoneNumber: '+91 8888333038',
  calloutDescription: "Get early signals, private releases, and occasional noise worth hearing. You'll know when it matters.",
  calloutHeading: 'Connect to the silent grid',
  calloutImage: '/contact/contact-callout.jpg',
};

export const getTouchpointConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'touchpoint' });
    const touchpointData = config?.data
      ? { ...DEFAULT_TOUCHPOINT_CONFIG, ...config.data }
      : DEFAULT_TOUCHPOINT_CONFIG;
    res.status(200).json({
      success: true,
      data: touchpointData,
      ...touchpointData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateTouchpointConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'touchpoint' },
      { key: 'touchpoint', data: incomingData },
      { upsert: true, new: true }
    );
    const touchpointData = { ...DEFAULT_TOUCHPOINT_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Touchpoint configuration updated successfully.',
      data: touchpointData,
      ...touchpointData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadTouchpointImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image base64 data required.' });
      return;
    }
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'drapza/touchpoint',
      resource_type: 'auto',
    });
    res.status(200).json({
      success: true,
      url: uploadRes.secure_url,
      message: 'Touchpoint image uploaded successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload image.' });
  }
};

export const resetTouchpointConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'touchpoint' });
    res.status(200).json({
      success: true,
      message: 'Touchpoint configuration reset to defaults.',
      data: DEFAULT_TOUCHPOINT_CONFIG,
      ...DEFAULT_TOUCHPOINT_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getTerms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'terms' });
    if (config) {
      res.status(200).json({ success: true, ...config.data });
      return;
    }

    const defaultTerms = [
      {
        title: '1. Atelier Protocol & Ordering',
        content: 'All garments from Drapza are modular outerwear engineered for extreme urban climates. Orders placed through our digital archive are tailored upon demand to reduce deadstock and guarantee craft excellence.',
      },
      {
        title: '2. Textile Specifications & Technical Fabrics',
        content: 'Our garments incorporate technical ripstop, 3-layer bonded membranes, waterproof taped seams, and custom YKK Aquaguard hardware. Variations in sheen and weave texture reflect individual dye lot characteristics.',
      },
      {
        title: '3. Returns & Exchange Governance',
        content: 'Unworn garments in pristine condition with authentic archive security tags and original modular storage packaging are eligible for return or size exchange within 7 days of verified dispatch receipt.',
      },
      {
        title: '4. Intellectual Property & Brand Rights',
        content: 'All silhouettes, modular component designs, digital telemetry assets, and visual lookbooks are the exclusive intellectual property of Drapza Atelier. Unauthorized reproduction is strictly forbidden.',
      },
    ];

    res.status(200).json({
      success: true,
      terms: defaultTerms,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const DEFAULT_HERO_CONFIG = {
  ribbonCategory: 'DRAPZA ATELIER 2026',
  ribbonSubtext: 'HEAVYWEIGHT TECHNICAL STREETWEAR • EDITION 01',
  ribbonTag: '[ WORLDWIDE AIRWAY DISPATCH ]',
  headlineLine1: 'SILHOUETTES FOR',
  headlineLine2: 'THE NEXT ERA',
  leftBadgeTag: 'ARCHIVE 001',
  leftBadgeTitle: '480 GSM Heavyweight French Terry',
  leftBadgeDesc: 'Custom engineered architectural drape.',
  rightBadgeTag: 'LIVE INVENTORY',
  rightBadgeTitle: 'Instant Express Dispatch',
  rightBadgeDesc: 'VIP tracking with live waypoint sync.',
  modelImage: '/home/hero.png',
  modelAlt: 'Silhouettes for the Next Era',
  modelScale: 100,
  modelOffsetY: 0,
  modelOffsetX: 0,
  modelMaxHeight: 75,
  modelOpacity: 100,
  modelShadow: false,
  modelParallax: true,
  telemetryTag1: 'Void Index',
  telemetryTag2: 'Model v.23',
  telemetryTag3: 'LIMITED CAPSULE',
  ctaButtonText: 'SCROLL',
  coordinates: '28.6139° N, 77.2090° E',
};

export const getHeroConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'hero' });
    const heroData = config?.data ? { ...DEFAULT_HERO_CONFIG, ...config.data } : DEFAULT_HERO_CONFIG;
    res.status(200).json({
      success: true,
      data: heroData,
      ...heroData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateHeroConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'hero' },
      { key: 'hero', data: incomingData },
      { upsert: true, new: true }
    );
    const heroData = { ...DEFAULT_HERO_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Hero configuration updated successfully.',
      data: heroData,
      ...heroData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadHeroImage = async (req: Request, res: Response): Promise<void> => {
  try {
    let { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data or URL is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/hero',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully to Cloudinary.',
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in hero:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'Image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetHeroConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'hero' });
    res.status(200).json({
      success: true,
      message: 'Hero configuration reset to factory defaults.',
      data: DEFAULT_HERO_CONFIG,
      ...DEFAULT_HERO_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getLookbookConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'lookbook' });
    if (config) {
      res.status(200).json({ success: true, ...config.data });
      return;
    }

    res.status(200).json({
      success: true,
      campaign: 'SEASON 01 // ARCHIVE',
      shots: [
        { id: 1, title: 'MODULAR HOODED SHELL', code: 'SL-01' },
        { id: 2, title: 'TACTICAL LAYER SYSTEM', code: 'SL-02' },
        { id: 3, title: 'BONDED STORM PARKA', code: 'SL-03' },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// =========================================================================
// BRAND PHILOSOPHY / ABOUT STATEMENT SECTION CMS
// =========================================================================
export const DEFAULT_STATEMENT_CONFIG = {
  tag: 'PHILOSOPHY • ZERO FRICTION',
  subtitle: 'Clothing reduced to pure signal',
  statement: 'OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT.',
  footerTag: '/ Core State /',
  badgeEdition: '[ EDITION 2026 ]',
  badgeCenter: 'DRAPZA ATELIER CORE',
  badgeTerritories: '[ ALL TERRITORIES ]',
  symbolType: 'drapza_symbol',
  customSymbolImage: '',
  showFloatingSymbol: true,
  showIcon: true,
  iconScale: 100,
  isEnabled: true,
};

export const getStatementConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'statement' });
    const data = config?.data ? { ...DEFAULT_STATEMENT_CONFIG, ...config.data } : DEFAULT_STATEMENT_CONFIG;
    res.status(200).json({
      success: true,
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateStatementConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'statement' },
      { key: 'statement', data: incomingData },
      { upsert: true, new: true }
    );
    const data = { ...DEFAULT_STATEMENT_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Brand Philosophy statement updated successfully.',
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadStatementSymbol = async (req: Request, res: Response): Promise<void> => {
  try {
    let { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data or URL is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/statement',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Symbol image uploaded successfully to Cloudinary.',
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in statement:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'Symbol image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetStatementConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'statement' });
    res.status(200).json({
      success: true,
      message: 'Philosophy statement reset to factory defaults.',
      data: DEFAULT_STATEMENT_CONFIG,
      ...DEFAULT_STATEMENT_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// MARQUEE BANNER SECTION CMS CONTROLLERS
// ==========================================
export const DEFAULT_MARQUEE_CONFIG = {
  isEnabled: true,
  marqueeHeader1: 'Transmission lost in neutral space',
  marqueeHeader2: 'Synthetic forms archive the signal',
  tag: '[ Frame Shift ]',
  headline: 'Modular silence across systems',
  cardImage: '/marquee-banner/marquee_banner_01.png',
  cardImageAlt: 'Marquee banner',
  cardImageOffsetY: -120,
  cardImageScale: 100,
  brandLogoText: 'DRAPZA',
};

export const getMarqueeConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'marquee' });
    const marqueeData = config?.data ? { ...DEFAULT_MARQUEE_CONFIG, ...config.data } : DEFAULT_MARQUEE_CONFIG;
    res.status(200).json({
      success: true,
      data: marqueeData,
      ...marqueeData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateMarqueeConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'marquee' },
      { key: 'marquee', data: incomingData },
      { upsert: true, new: true }
    );
    const marqueeData = { ...DEFAULT_MARQUEE_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Marquee banner configuration updated successfully.',
      data: marqueeData,
      ...marqueeData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadMarqueeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    let { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data or URL is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/marquee',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Marquee image uploaded successfully to Cloudinary.',
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in marquee:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'Marquee image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetMarqueeConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'marquee' });
    res.status(200).json({
      success: true,
      message: 'Marquee banner configuration reset to factory defaults.',
      data: DEFAULT_MARQUEE_CONFIG,
      ...DEFAULT_MARQUEE_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// =========================================================================
// PEEL REVEAL & MOTION MASK SECTION CMS CONTROLLER
// =========================================================================

export const DEFAULT_PEEL_REVEAL_CONFIG = {
  isEnabled: true,
  signalType: 'SIGNAL TYPE: NEUTRAL',
  moduleId: 'MODULE ID: NRMLSS_001',
  status: 'STATUS: DETACHED',
  splitWordLeft: 'SIGNAL',
  splitWordRight: 'MOTION',
  headline: 'THE UNIFORM HOLDS NO ALLEGIANCE',
  modelImage: '/peel-reveal/peel-reveal-img.jpg',
  maskImage: '/peel-reveal/peel-reveal-img-mask.png',
  maskLayersCount: 6,
  backgroundColor: '#edf1e8',
  textColor: '#0f0f0f',
};

export const getPeelRevealConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'peel_reveal' });
    const peelData = config?.data ? { ...DEFAULT_PEEL_REVEAL_CONFIG, ...config.data } : DEFAULT_PEEL_REVEAL_CONFIG;
    res.status(200).json({
      success: true,
      data: peelData,
      ...peelData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updatePeelRevealConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'peel_reveal' },
      { key: 'peel_reveal', data: incomingData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const peelData = { ...DEFAULT_PEEL_REVEAL_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Peel Reveal configuration successfully updated and synced.',
      data: peelData,
      ...peelData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadPeelRevealImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'No image data provided.' });
      return;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: 'drapza/peel-reveal',
        resource_type: 'image',
      });

      res.status(200).json({
        success: true,
        message: 'Peel Reveal model image uploaded successfully to Cloudinary.',
        url: uploadResult.secure_url,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in peel reveal:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'Peel Reveal image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetPeelRevealConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'peel_reveal' });
    res.status(200).json({
      success: true,
      message: 'Peel Reveal configuration reset to factory defaults.',
      data: DEFAULT_PEEL_REVEAL_CONFIG,
      ...DEFAULT_PEEL_REVEAL_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Contact / Transmit Signal Form CMS Controller
// ==========================================
export const DEFAULT_CONTACT_CONFIG = {
  isEnabled: true,
  watermarkText: 'DRAPZA',
  imageSrc: '/contact-form/contact-parallax.png',
  headingLine1: 'Transmit',
  headingLine2: 'updates, not',
  headingLine3: 'noisé.',
  bodyCopy: 'You’ll only hear from us when something built is worth showing.',
  inputPlaceholder: 'ENTER SIGNAL ADDRESS',
  successMessage: 'Signal frequency received and logged into system buffer.',
  disclaimerText: 'No marketing cycles. Just rare, coded dispatches.',
};

export const getContactConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'contact_form' });
    const data = config?.data ? { ...DEFAULT_CONTACT_CONFIG, ...config.data } : DEFAULT_CONTACT_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateContactConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'contact_form' });
    const merged = { ...DEFAULT_CONTACT_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'contact_form' },
      { key: 'contact_form', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Transmit Signal configuration updated.', data: config.data, ...config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadContactImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image base64 data required.' });
      return;
    }
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'drapza/contact-form',
      resource_type: 'auto',
    });
    res.status(200).json({ success: true, url: uploadRes.secure_url, message: 'Contact image uploaded successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload image.' });
  }
};

export const resetContactConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    await SiteConfig.findOneAndDelete({ key: 'contact_form' });
    res.status(200).json({
      success: true,
      message: 'Transmit Signal configuration reset to factory defaults.',
      data: DEFAULT_CONTACT_CONFIG,
      ...DEFAULT_CONTACT_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};


// =========================================================================
// GST & INVOICE STUDIO CMS CONTROLLER
// =========================================================================

export const DEFAULT_GST_CONFIG = {
  isEnabled: true,
  gstPercentage: 18,
  gstNumber: '09AAACD1234F1Z5',
  showGstNumber: true,
  legalBusinessName: 'DRAPZA ATELIER NOIR PVT LTD',
  panNumber: 'AAACD1234F',
  hsnCode: '6204',
  calculationMode: 'exclusive',
  stateCode: '09 - Uttar Pradesh',

  // Layout Sequence
  sectionOrder: [
    'header',
    'recipients',
    'logistics',
    'comments',
    'items',
    'totals',
    'remittance',
    'footer',
  ],
  hiddenSections: [],

  // Default Texts & Branding
  companyTagline: 'Bespoke Modular Silhouettes & Haute Couture',
  companyAddressLine1: 'Cyber Hub Node A-12, Sector 62',
  companyAddressLine2: 'Noida, Uttar Pradesh 201309, India',
  companyPhone: '+91 9794603102',
  companyEmail: 'drapza.cloth@gmail.com',
  invoiceTitle: 'INVOICE',

  defaultSalesperson: 'Drapza Concierge',
  defaultShippedVia: 'Blue Dart Air',
  defaultFobPoint: 'Vault Hub',
  defaultTerms: 'Prepaid / Settled',

  commentsText:
    'Authentic Drapza Atelier Noir production. High-altitude climate-controlled shipment with anti-static packaging.',

  remittanceNotice:
    'Make all remittances payable to registered company. Payment status: PAID IN FULL via Encrypted UPI Checkout (Instant). Questions concerning this invoice? Contact Concierge Desk.',

  signoffText: 'Thank you for your business!',
  signoffSubtext:
    'DRAPZA ATELIER NOIR • OFFICIAL ELECTRONIC INVOICE • AUTHENTICATED DISPATCH',
};

export const getGstConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'gst-config' });
    if (config && config.data) {
      res.status(200).json({
        success: true,
        data: { ...DEFAULT_GST_CONFIG, ...config.data },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: DEFAULT_GST_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error loading GST configuration.',
    });
  }
};

export const updateGstConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const mergedData = { ...DEFAULT_GST_CONFIG, ...incomingData };

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'gst-config' },
      { key: 'gst-config', data: mergedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Invoice & GST configuration updated successfully.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating GST configuration.',
    });
  }
};

export const resetGstConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'gst-config' },
      { key: 'gst-config', data: DEFAULT_GST_CONFIG },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Invoice & GST configuration restored to factory defaults.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting GST configuration.',
    });
  }
};

// ==========================================
// PAYMENT AUTHENTICATION & GATEWAYS CMS
// ==========================================

export const DEFAULT_PAYMENT_CONFIG = {
  cashfree: {
    isEnabled: true,
    title: 'CASHFREE SECURE CHECKOUT (UPI, CARDS, NETBANKING)',
    subtitle: 'INSTANT ZERO-FEE CHECKOUT VIA CASHFREE PAYMENTS ENGINE',
    badgeText: 'RECOMMENDED',
    showBadge: true,
  },
  razorpay: {
    isEnabled: true,
    title: 'ONLINE GATEWAY (CARDS, UPI, NETBANKING)',
    subtitle: 'ZERO CONVENIENCE FEE. INSTANT DISPATCH QUEUE VALIDATION.',
    badgeText: 'RAZORPAY',
    showBadge: true,
  },
  directUpi: {
    isEnabled: false,
    title: 'DIRECT UPI SCAN & PAY',
    subtitle: 'GPAY, PHONEPE, PAYTM, BHIM INSTANT TRANSFER',
    upiId: 'samratsuraj10@okaxis',
    payeeName: 'DRAPZA ATELIER',
    qrCodeImageUrl: '',
    instructions: 'Order will be automatically tagged upon receipt.',
  },
  cod: {
    isEnabled: true,
    title: 'CASH ON DELIVERY (COD)',
    subtitle: 'PAY IN CASH UPON DOORSTEP GARMENT INSPECTION',
    extraFee: 0,
    minOrderAmount: 0,
    maxOrderAmount: 50000,
    note: 'Cash on delivery available across all serviceable pin codes in India.',
  },
  defaultMethod: 'CASHFREE',
  announcementNotice: 'Complimentary express insured dispatch available on all prepaid orders.',
  showNotice: false,
};

export const getPaymentConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'payment-config' });
    if (config && config.data) {
      res.status(200).json({
        success: true,
        data: { ...DEFAULT_PAYMENT_CONFIG, ...config.data },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: DEFAULT_PAYMENT_CONFIG,
    });
  } catch (error: any) {
    console.warn('MongoDB lookup warning in getPaymentConfig, serving default config:', error.message);
    res.status(200).json({
      success: true,
      data: DEFAULT_PAYMENT_CONFIG,
    });
  }
};

export const updatePaymentConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const existing = await SiteConfig.findOne({ key: 'payment-config' });
    const mergedData = { ...DEFAULT_PAYMENT_CONFIG, ...(existing?.data || {}), ...incomingData };

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'payment-config' },
      { key: 'payment-config', data: mergedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment authentication settings saved and published live!',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error saving payment configuration.',
    });
  }
};

export const uploadPaymentQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'QR image data is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/payments',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'QR Code image uploaded successfully to Cloudinary.',
        url: uploadRes.secure_url,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in payment QR:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'QR Code image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload QR image.' });
  }
};

export const resetPaymentConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'payment-config' },
      { key: 'payment-config', data: DEFAULT_PAYMENT_CONFIG },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment authentication settings reset to factory defaults.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting payment configuration.',
    });
  }
};

// ==========================================
// FOOTER ARCHITECTURE CMS
// ==========================================

export const DEFAULT_FOOTER_CONFIG = {
  isEnabled: true,
  rootTitle: 'Root',
  rootLinks: [
    { label: 'Drapza Home', href: '/' },
    { label: 'Shop All Products', href: '/wardrobe' },
    { label: 'Custom Size Fittings', href: '#custom-size-fittings', isBespoke: true },
    { label: 'About Drapza', href: '/genesis' },
    { label: 'Contact Us', href: '/touchpoint' },
    { label: 'Product Reviews', href: '/reviews' },
    { label: 'Product Page', href: '/unit' },
  ],
  connectTitle: 'Connect Feed',
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  youtubeUrl: 'https://www.youtube.com/',
  col2Links: [
    { label: 'Facebook', href: 'https://www.facebook.com/' },
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'YouTube', href: 'https://www.youtube.com/' },
  ],
  openLineTitle: 'Open Line',
  phone: '+91 8888333038',
  whatsapp: '+91 8888333038',
  whatsappMessage: 'Hello Drapza Atelier',
  addressLine1: 'Unit 07, Sector N',
  addressLine2: 'Layer 2, South Terminal',
  addressLine3: 'System 021, Earth',
  addressText: 'Unit 07, Sector N\nLayer 2, South Terminal\nSystem 021, Earth',
  brandLogoText: 'DRAPZA',
  copyrightText: '©2025 All modules reserved.',
  studioLabel: 'Drapza Studio',

  // Parallax & newsletter support
  showHeroBanner: true,
  heroBannerText: 'DRAPZA',
  heroBannerImage: '/images/drapza/contact-form/contact-parallax.png',
  heroBgColor: '#f4f4f4',
  heroTextColor: '#000000',
  showNewsletterCard: true,
  newsletterTag: '[ DISPATCH SIGNAL ]',
  newsletterHeadingLine1: 'TRANSMIT',
  newsletterHeadingLine2: 'UPDATES, NOT',
  newsletterHeadingLine3: 'NOISE.',
  newsletterDescription: "You'll only hear from us when something built is worth showing.",
  newsletterPlaceholder: 'ENTER SIGNAL ADDRESS',
  newsletterButtonText: 'READY TO TRANSMIT',
  newsletterBottomText: 'NO MARKETING CYCLES. JUST RARE, CODED DISPATCHES.',
  newsletterBgColor: '#0b0b0b',
  col1Title: 'Root',
  col1Links: [
    { label: 'Drapza Home', href: '/' },
    { label: 'Shop All Products', href: '/wardrobe' },
    { label: 'Custom Size Fittings', href: '#custom-size-fittings', isBespoke: true },
    { label: 'About Drapza', href: '/genesis' },
    { label: 'Contact Us', href: '/touchpoint' },
    { label: 'Product Reviews', href: '/reviews' },
    { label: 'Product Page', href: '/unit' },
  ],
  col2Title: 'Connect Feed',
  col3Title: 'Open Line',
  showTermsLink: true,
  termsLinkText: 'TERMS & CONDITIONS',
  termsLinkHref: '/terms',
  showAdminLink: true,
  adminLinkText: '[ ATELIER ADMIN CONTROL ]',
  adminLinkHref: '/admin',
};

export const normalizeFooterConfig = (raw: any) => {
  const data = { ...DEFAULT_FOOTER_CONFIG, ...(raw || {}) };
  // Synchronize col1Title <-> rootTitle
  if (data.rootTitle && !data.col1Title) data.col1Title = data.rootTitle;
  if (data.col1Title && !data.rootTitle) data.rootTitle = data.col1Title;

  // Synchronize col1Links <-> rootLinks
  if (data.rootLinks && Array.isArray(data.rootLinks) && data.rootLinks.length > 0 && (!data.col1Links || data.col1Links.length === 0)) {
    data.col1Links = data.rootLinks;
  }
  if (data.col1Links && Array.isArray(data.col1Links) && data.col1Links.length > 0 && (!data.rootLinks || data.rootLinks.length === 0)) {
    data.rootLinks = data.col1Links;
  }

  // Synchronize col2Title <-> connectTitle
  if (data.connectTitle && !data.col2Title) data.col2Title = data.connectTitle;
  if (data.col2Title && !data.connectTitle) data.connectTitle = data.col2Title;

  // Synchronize col3Title <-> openLineTitle
  if (data.openLineTitle && !data.col3Title) data.col3Title = data.openLineTitle;
  if (data.col3Title && !data.openLineTitle) data.openLineTitle = data.col3Title;

  // Address lines
  if ((!data.addressLine1 || !data.addressLine2) && data.addressText) {
    const lines = String(data.addressText).split(/[\r\n]+/).filter(Boolean);
    if (!data.addressLine1 && lines[0]) data.addressLine1 = lines[0];
    if (!data.addressLine2 && lines[1]) data.addressLine2 = lines[1];
    if (!data.addressLine3 && lines[2]) data.addressLine3 = lines[2];
  }

  return data;
};

export const getFooterConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'footer-config' });
    const normalized = normalizeFooterConfig(config?.data);
    res.status(200).json({
      success: true,
      data: normalized,
      ...normalized,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error loading footer configuration.',
    });
  }
};

export const updateFooterConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'footer-config' });
    const mergedData = normalizeFooterConfig({
      ...(existing?.data || {}),
      ...incomingData,
    });

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'footer-config' },
      { key: 'footer-config', data: mergedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Footer architecture updated successfully.',
      data: config.data,
      ...config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error saving footer configuration.',
    });
  }
};

export const uploadFooterImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/footer',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Footer image uploaded successfully.',
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      res.status(200).json({
        success: true,
        message: 'Footer image stored successfully.',
        url: image,
        publicId: 'local_footer_' + Date.now(),
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload error.' });
  }
};

export const resetFooterConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'footer-config' },
      { key: 'footer-config', data: DEFAULT_FOOTER_CONFIG },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Footer configuration restored to factory defaults.',
      data: config.data,
      ...config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting footer configuration.',
    });
  }
};

// ==========================================
// SITE IDENTITY, BROWSER TAB & SEO CMS
// ==========================================

const DEFAULT_SITE_CONFIG = {
  siteTitle: 'Drapza — Silhouettes for the Next Era',
  siteDescription:
    'Clothing reduced to pure signal. Drapza builds modular, neutral garments for the frictionless, the fast, and the quietly defiant.',
  faviconUrl: '/images/drapza/logo.jpg',
  logoUrl: '',
  logoDarkUrl: '',
  logoType: 'hybrid',
  logoText: 'DRAPZA',
  logoTagline: 'WEAR YOUR STORY',
  logoWidth: 34,
  logoScale: 100,
  logoMobileScale: 100,
  logoAlignment: 'left',
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoGap: 10,
  logoLayout: 'horizontal',
  logoBorderRadius: 0,
  logoOpacity: 1,
  logoShadow: 'subtle',
  logoAutoInvertDark: false,
  logoWordmarkSize: 24,
  logoLetterSpacing: 0.14,
  logoFontWeight: 'bold',
  logoShowTagline: false,
  brandName: 'DRAPZA',
  inactiveTabTitle: 'DRAPZA • — WAITING IN VAULT',
  enableInactiveTabNotice: false,
  keywords: 'luxury streetwear, modular fashion, high-density drape, bespoke tailoring, drapza atelier',
  ogImageUrl: '/images/drapza/logo.jpg',
  announcementEnabled: true,
  announcementMessages: [
    'BATCH #04 DISPATCH LIVE — LIMITED QUANTITIES AVAILABLE',
    'WORLDWIDE EXPRESS SHIPPING ACTIVE FOR ALL MODULES',
    'ARCHIVAL NEUTRAL OVERSHIRTS RESTOCKED IN SECTOR N',
    'SYSTEM 021 READY FOR FRICTIONLESS TRANSMISSION',
  ],
  announcementIntervalSeconds: 4,
  announcementLinkUrl: '/wardrobe',
  giftCardRedemptionDiscountEnabled: true,
  giftCardRedemptionDiscountType: 'percentage',
  giftCardRedemptionDiscountValue: 10,
  giftCardRedemptionMinOrderAmount: 0,
  giftCardRedemptionMaxDiscount: 1000,
  giftCardRedemptionPromoLabel: 'SPECIAL GIFT CARD BONUS PERK',
  giftCardRedemptionDescription: 'Get an extra 10% instant discount when paying with a Drapza Gift Card!',
};

export const getSiteConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'site-config' });
    if (config && config.data) {
      res.status(200).json({
        success: true,
        data: { ...DEFAULT_SITE_CONFIG, ...config.data },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: DEFAULT_SITE_CONFIG,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error loading site identity configuration.',
    });
  }
};

export const updateSiteConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const existing = await SiteConfig.findOne({ key: 'site-config' });
    const mergedData = { ...DEFAULT_SITE_CONFIG, ...(existing?.data || {}), ...incomingData };

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'site-config' },
      { key: 'site-config', data: mergedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Browser tab title & SEO identity updated successfully.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error saving site identity configuration.',
    });
  }
};

export const uploadSiteConfigAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image, folder = 'drapza_brand' } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: `drapza/${folder}`,
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Site identity asset uploaded to CDN successfully.',
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      // Fallback: return base64 as-is if cloudinary fails
      res.status(200).json({
        success: true,
        message: 'Asset stored locally (CDN unavailable).',
        url: image,
        publicId: `local_${folder}_` + Date.now(),
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload error.' });
  }
};

export const resetSiteConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'site-config' },
      { key: 'site-config', data: DEFAULT_SITE_CONFIG },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Site identity restored to factory defaults.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting site identity configuration.',
    });
  }
};

// ==========================================
// CTA Silhouettes Tri-Card CMS Controller
// ==========================================
export const DEFAULT_CTA_CONFIG = {
  headingLine1: 'A FIELD TEST',
  headingLine2: 'IN',
  headingLine3: 'SILHOUETTES',
  editorialText: 'Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion.',
  leftImage: '/images/drapza/cta/cta_img_01.jpg',
  centerImage: '/images/drapza/cta/cta_img_02.jpg',
  rightImage: '/images/drapza/cta/cta_img_03.jpg',
  leftAlt: 'Field Test Silhouette 01',
  centerAlt: 'Field Test Silhouette 02',
  rightAlt: 'Field Test Silhouette 03',
  buttonText: 'EXPLORE ATELIER ARCHIVE',
  buttonLink: '/wardrobe',
  isEnabled: true,
};

export const getCtaConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'cta-config' });
    const data = config?.data ? { ...DEFAULT_CTA_CONFIG, ...config.data } : DEFAULT_CTA_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateCtaConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'cta-config' });
    const merged = { ...DEFAULT_CTA_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'cta-config' },
      { key: 'cta-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'CTA Silhouettes configuration saved.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadCtaImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }
    try {
      const uploadRes = await cloudinary.uploader.upload(image, { folder: 'drapza/cta', resource_type: 'auto' });
      res.status(200).json({ success: true, url: uploadRes.secure_url });
    } catch {
      res.status(200).json({ success: true, url: image });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload error.' });
  }
};

export const resetCtaConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'cta-config' },
      { key: 'cta-config', data: DEFAULT_CTA_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'CTA Silhouettes configuration reset.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Editorial Text Block & Narrative CMS Controller
// ==========================================
export const DEFAULT_TEXTBLOCK_CONFIG = {
  headlineLine1: 'DESIGNED ABSENCE,',
  headlineLine2: 'ENGINEERED SILENCE.',
  paragraph1: 'Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.',
  paragraph2: 'We build garments that refuse urgency. Through precision pattern drafting, custom heavyweight textiles, and rigorous hardware selection, each creation endures outside temporal trends.',
  badgeText: 'ATELIER CODE',
  signatureText: 'DRAPZA RESEARCH DEPT.',
  symbolImage: '/images/drapza/text-block/text-block-logo.png',
  isEnabled: true,
};

export const getTextBlockConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'textblock-config' });
    const data = config?.data ? { ...DEFAULT_TEXTBLOCK_CONFIG, ...config.data } : DEFAULT_TEXTBLOCK_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateTextBlockConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'textblock-config' });
    const merged = { ...DEFAULT_TEXTBLOCK_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'textblock-config' },
      { key: 'textblock-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Editorial narrative configuration saved.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadTextBlockSymbol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }
    try {
      const uploadRes = await cloudinary.uploader.upload(image, { folder: 'drapza/narrative', resource_type: 'auto' });
      res.status(200).json({ success: true, url: uploadRes.secure_url });
    } catch {
      res.status(200).json({ success: true, url: image });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload error.' });
  }
};

export const resetTextBlockConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'textblock-config' },
      { key: 'textblock-config', data: DEFAULT_TEXTBLOCK_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Editorial narrative reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Vault Drops Scarcity Allocation CMS Controller
// ==========================================
export const DEFAULT_VAULT_DROPS_CONFIG = {
  isEnabled: true,
  sectionTag: 'THE VAULT • STRICT MONOCHROME ARCHIVE',
  headline: 'EXCLUSIVE DROP-ZERO',
  subheadline: 'Each unit numbered, authenticated with tamper-evident seal and bespoke hardware.',
  allocatedUnits: 19,
  totalUnits: 50,
  targetDropDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  accessStatus: 'OPEN',
  productName: 'DECONSTRUCTED TECHNICAL BOMBER',
  productPrice: 7990,
  productImage: '/images/drapza/products/product_1.png',
  perks: [
    'Serialized 1-of-50 laser-etched metal seal',
    'Priority allocation for FW26 Mainline',
    'Complimentary Bespoke Tailor Alteration Consultation',
  ],
};

export const getVaultDropsConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'vault-drops-config' });
    const data = config?.data ? { ...DEFAULT_VAULT_DROPS_CONFIG, ...config.data } : DEFAULT_VAULT_DROPS_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateVaultDropsConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'vault-drops-config' });
    const merged = { ...DEFAULT_VAULT_DROPS_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'vault-drops-config' },
      { key: 'vault-drops-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Vault drops scarcity configuration saved.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetVaultDropsConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'vault-drops-config' },
      { key: 'vault-drops-config', data: DEFAULT_VAULT_DROPS_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Vault drops reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const requestVipPasscode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact } = req.body || {};
    const passcode = `VP-${Math.floor(100000 + Math.random() * 900000)}`;
    res.status(200).json({
      success: true,
      passcode,
      message: `VIP Access Token generated for ${contact || 'atelier client'}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Fabric GSM Loupe Science CMS Controller
// ==========================================
export const DEFAULT_FABRIC_GSM_CONFIG = {
  isEnabled: true,
  sectionTag: 'MATERIAL TACTILE SCIENCE',
  headline: 'HIGH-DENSITY WEAVES & ARTISANAL SURFACE GRAIN',
  subheadline: 'Hover across microscopic high-definition fabric loupe view to inspect weave density, GSM threadcount, and fiber tensile strength.',
  fabrics: [
    {
      id: 'french-terry-480',
      name: '480 GSM Heavyweight French Terry',
      composition: '100% Combed Compact Organic Cotton',
      gsm: 480,
      surfaceTexture: 'Loopback diagonal interior, smooth high-density combed face.',
      drapeIndex: 'Architectural / Structured Rigid Flow',
      tensileRating: '9.8 / 10 ISO Tear Certified',
      previewImage: '/images/drapza/products/product_1.png',
      loupeZoomImage: '/images/drapza/products/product_1.png',
    },
    {
      id: 'modal-silk-320',
      name: '320 GSM Pure Modal Silk',
      composition: '100% Organic Beechwood Cellulose',
      gsm: 320,
      surfaceTexture: 'Liquid fluid sheen, breathable micro-porous filament.',
      drapeIndex: 'Ultra-Fluid Kinetic Cascade',
      tensileRating: '9.2 / 10 Handloom Graded',
      previewImage: '/images/drapza/products/product_11.png',
      loupeZoomImage: '/images/drapza/products/product_11.png',
    },
    {
      id: 'chanderi-tissue-220',
      name: '220 GSM Heritage Chanderi Zari',
      composition: '60% Mulberry Silk / 40% Fine Cotton with Zari Tissue',
      gsm: 220,
      surfaceTexture: 'Crisp gossamer structure with embedded metallic zari threads.',
      drapeIndex: 'Crisp Sculptural Shimmer',
      tensileRating: '8.9 / 10 Master Weaver Certified',
      previewImage: '/images/drapza/products/product_4.png',
      loupeZoomImage: '/images/drapza/products/product_4.png',
    },
  ],
};

export const getFabricGsmConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'fabric-gsm-config' });
    const data = config?.data ? { ...DEFAULT_FABRIC_GSM_CONFIG, ...config.data } : DEFAULT_FABRIC_GSM_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateFabricGsmConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'fabric-gsm-config' });
    const merged = { ...DEFAULT_FABRIC_GSM_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'fabric-gsm-config' },
      { key: 'fabric-gsm-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Fabric GSM configuration updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetFabricGsmConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'fabric-gsm-config' },
      { key: 'fabric-gsm-config', data: DEFAULT_FABRIC_GSM_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Fabric GSM reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Runway Reels CMS Controller
// ==========================================
export const DEFAULT_RUNWAY_REELS_CONFIG = {
  isEnabled: true,
  sectionTag: 'SHOPPABLE RUNWAY IN MOTION',
  headline: 'ATELIER RUNWAY FEED',
  subheadline: 'Interactive 9:16 vertical movement tapes. Tap any video to inspect garments directly.',
  reels: [
    {
      id: 'reel-01',
      title: 'Runway Look 01 • Cyberpunk Trench Silhouette',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-on-a-catwalk-41484-large.mp4',
      thumbnailUrl: '/images/drapza/products/product_1.png',
      productId: 'anarkali-embroidered-kurti',
      productName: 'ANARKALI KURTI',
      productPrice: 1440,
      likesCount: 1420,
    },
  ],
};

export const getRunwayReelsConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'runway-reels-config' });
    const data = config?.data ? { ...DEFAULT_RUNWAY_REELS_CONFIG, ...config.data } : DEFAULT_RUNWAY_REELS_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateRunwayReelsConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'runway-reels-config' });
    const merged = { ...DEFAULT_RUNWAY_REELS_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'runway-reels-config' },
      { key: 'runway-reels-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Runway reels configuration updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetRunwayReelsConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'runway-reels-config' },
      { key: 'runway-reels-config', data: DEFAULT_RUNWAY_REELS_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Runway reels reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Auth & Login Portal CMS Controller
// ==========================================
export const DEFAULT_AUTH_PORTAL_CONFIG = {
  isEnabled: true,
  atelierTag: 'DRAPZA ATELIER • FW26',
  brandQuote: 'ARCHITECTURE FOR UNRESTRICTED URBAN MOVEMENT.',
  loginHeading: 'ACCESS YOUR ATELIER VAULT',
  loginSubtext: 'Enter your credentials to manage bespoke fittings, track active dispatches, and access priority drops.',
  signupHeading: 'BECOME A DRAPZA MEMBER',
  signupSubtext: 'Gain immediate access to drop archives, private fitting appointments, and tailored orders.',
  showHeroBanner: true,
  heroBannerImage: '/home/hero.png',
};

export const getAuthPortalConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'auth-portal-config' });
    const data = config?.data ? { ...DEFAULT_AUTH_PORTAL_CONFIG, ...config.data } : DEFAULT_AUTH_PORTAL_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateAuthPortalConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'auth-portal-config' });
    const merged = { ...DEFAULT_AUTH_PORTAL_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'auth-portal-config' },
      { key: 'auth-portal-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Auth portal configuration updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetAuthPortalConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'auth-portal-config' },
      { key: 'auth-portal-config', data: DEFAULT_AUTH_PORTAL_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Auth portal reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Bundle Stacker / Modular Outfit Builder CMS Controller
// ==========================================
export const DEFAULT_BUNDLE_CONFIG = {
  isEnabled: true,
  sectionTag: 'MODULAR ENSEMBLE BUILDER',
  headingLine1: 'STACK PIECES,',
  headingLine2: 'UNLOCK ARCHIVE VALUES.',
  discountPercent: 15,
  discountBadgeText: 'BUNDLE SAVINGS • 15% OFF',
  ctaButtonText: 'ACQUIRE COMPLETE ENSEMBLE',
  items: [
    {
      id: 't1',
      name: 'ANARKALI SILK EMBROIDERED KURTI',
      price: 1890,
      image: '/products/product_1.png',
      layerNumber: '01',
      layerType: 'CORE SILHOUETTE',
      subtitle: 'Hand-loomed mulmul silk with tonal zari embroidery',
      slug: 'anarkali-silk-embroidered-kurti',
    },
    {
      id: 'b1',
      name: 'RAW HEM TAPERED PALAZZO',
      price: 1290,
      image: '/products/product_2.png',
      layerNumber: '02',
      layerType: 'LOWER FOUNDATION',
      subtitle: 'Fluid modal blend with architectural drop hem',
      slug: 'raw-hem-tapered-palazzo',
    },
    {
      id: 'd1',
      name: 'ORGANZA SHEER DRAPE DUPATTA',
      price: 990,
      image: '/products/product_3.png',
      layerNumber: '03',
      layerType: 'OVERLAY MASK',
      subtitle: 'Ultralight translucent organza with scalloped border',
      slug: 'organza-sheer-drape-dupatta',
    },
  ],
};

export const getBundleConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'bundle-config' });
    const data = config?.data ? { ...DEFAULT_BUNDLE_CONFIG, ...config.data } : DEFAULT_BUNDLE_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(200).json({ success: true, data: DEFAULT_BUNDLE_CONFIG, ...DEFAULT_BUNDLE_CONFIG });
  }
};

export const updateBundleConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'bundle-config' });
    const merged = { ...DEFAULT_BUNDLE_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'bundle-config' },
      { key: 'bundle-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Bundle configuration updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadBundleImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }
    const uploaded = await cloudinary.uploader.upload(image, { folder: 'drapza_bundles' });
    res.status(200).json({ success: true, url: uploaded.secure_url });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
};

export const resetBundleConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'bundle-config' },
      { key: 'bundle-config', data: DEFAULT_BUNDLE_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Bundle configuration reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// Flash Sale Countdown Timer & Drop Banner CMS Controller
// ==========================================
export const DEFAULT_COUNTDOWN_CONFIG = {
  isEnabled: true,
  badgeText: 'SUMMER PREMIUM SALE',
  headlineLine1: 'Flat 40% Off +',
  headlineLine2: 'Free Shipping',
  seasonTag: 'AUTUMN SEASON • MONOCHROME',
  modelImage: '/products/product_1.png',
  imageFit: 'contain',
  socialHandle: 'FOLLOW US: @DRAPZACLOTH',
  brandTag: 'DRAPZA ATELIER NOIR',
  description: 'Get additional discount benefits by stacking multiple luxury custom fits. Perfect opportunity to replenish your boutique wardrobe with trending 2026 drapza designs.',
  circularBadgeText: 'FIND YOUR FIT • MONOCHROME DROP • ',
  ctaText: 'EXPLORE SALE ITEMS',
  ctaLink: '/wardrobe',
  discountPercent: 40,
  targetEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export const getCountdownConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'countdown-config' });
    const data = config?.data ? { ...DEFAULT_COUNTDOWN_CONFIG, ...config.data } : DEFAULT_COUNTDOWN_CONFIG;
    res.status(200).json({ success: true, data, ...data });
  } catch (error: any) {
    res.status(200).json({ success: true, data: DEFAULT_COUNTDOWN_CONFIG, ...DEFAULT_COUNTDOWN_CONFIG });
  }
};

export const updateCountdownConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body || {};
    const existing = await SiteConfig.findOne({ key: 'countdown-config' });
    const merged = { ...DEFAULT_COUNTDOWN_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'countdown-config' },
      { key: 'countdown-config', data: merged },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Countdown configuration updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadCountdownImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }
    const uploaded = await cloudinary.uploader.upload(image, { folder: 'drapza_countdown' });
    res.status(200).json({ success: true, url: uploaded.secure_url });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
};

export const resetCountdownConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'countdown-config' },
      { key: 'countdown-config', data: DEFAULT_COUNTDOWN_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Countdown configuration reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// =========================================================================
// GENESIS ARCHITECTURE PAGE CMS
// =========================================================================
export const DEFAULT_GENESIS_CONFIG = {
  isEnabled: true,
  pageTitle: "GENESIS • The Origin Architecture — Drapza Atelier",
  pageDescription: "The design philosophy, signal over surplus, and genesis behind what you wear.",
  
  hero: {
    image: "/genesis/hero.jpg",
    headline: "The Genesis behind what you wear",
    copyBlock1: [
      "Signal over surplus,",
      "Fragments of identity,",
      "Minimal by necessity."
    ],
    copyBlock2: [
      "We design future forms,",
      "Built for the now."
    ],
    metaLines: [
      "We create frameworks,",
      "For the unnamed future,",
      "A study in silhouette."
    ],
    systemCode: "[ SYS/DRAPZA/0001 ]"
  },

  about: {
    logoFill: "#0f0f0f",
    paragraph1: "Drapza is built on the belief that clothing should operate like a system. Every piece is engineered with intention, shaped by visual logic and designed for a new kind of uniform. We define motion, structure in silence, presence without noise.",
    paragraph2: "Our aesthetic roots lie in the future, not the past. We create garments that behave like interfaces: minimal, intelligent, quietly expressive. Function and form are synchronized, tailored for those who move through digital and physical layers with equal precision. Drapza is not fashion. It is a transmission."
  },

  spotlightMatrix: {
    col1: [
      "/spotlight/spotlight_img_03.jpg",
      "/spotlight/spotlight_img_06.jpg",
      "/spotlight/spotlight_img_09.jpg"
    ],
    col2: [
      "/spotlight/spotlight_img_01.jpg",
      "/spotlight/spotlight_img_04.jpg",
      "/spotlight/spotlight_img_07.jpg"
    ],
    col3: [
      "/spotlight/spotlight_img_02.jpg",
      "/spotlight/spotlight_img_05.jpg",
      "/spotlight/spotlight_img_08.jpg"
    ],
    col4: [
      "/spotlight/spotlight_img_03.jpg",
      "/spotlight/spotlight_img_06.jpg",
      "/spotlight/spotlight_img_09.jpg"
    ],
    col5: [
      "/spotlight/spotlight_img_01.jpg",
      "/spotlight/spotlight_img_04.jpg",
      "/spotlight/spotlight_img_07.jpg"
    ]
  },

  textBlock: {
    heading: "Designed absence, engineered silence.",
    logoFill: "#edf1e8",
    paragraph1: "Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.",
    paragraph2: "No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who exit the frame."
  },

  settings: {
    showContactForm: true,
    showFooter: true,
    showSpotlightZoom: true
  }
};

export const getGenesisConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'genesis-config' });
    const data = config?.data ? { ...DEFAULT_GENESIS_CONFIG, ...config.data } : DEFAULT_GENESIS_CONFIG;
    res.status(200).json({
      success: true,
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateGenesisConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'genesis-config' },
      { key: 'genesis-config', data: incomingData },
      { upsert: true, new: true }
    );
    const data = { ...DEFAULT_GENESIS_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'Genesis Page configuration updated successfully.',
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const uploadGenesisImage = async (req: Request, res: Response): Promise<void> => {
  try {
    let { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data or URL is required.' });
      return;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'drapza/genesis',
        resource_type: 'auto',
      });
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully to Cloudinary.',
        url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    } catch (cloudErr: any) {
      console.warn('Cloudinary upload fallback in genesis:', cloudErr?.message);
      res.status(200).json({
        success: true,
        message: 'Image stored successfully.',
        url: image,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetGenesisConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'genesis-config' },
      { key: 'genesis-config', data: DEFAULT_GENESIS_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Genesis Page configuration reset to defaults.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// =========================================================================
// WHATSAPP FLOATING BUTTON & CONCIERGE WIDGET CMS
// =========================================================================
export const DEFAULT_WHATSAPP_CONFIG = {
  isEnabled: true,
  phoneNumber: '918888333038',
  buttonText: 'MESSAGE US',
  prefilledMessage: 'Hello Drapza Atelier Support, I would like to inquire about...',
  backgroundColor: '#25d366',
  textColor: '#ffffff',
  hoverBackgroundColor: '#1ebe5d',
  position: 'bottom-right',
  bottomOffset: '6.25rem',
  sideOffset: '2rem',
  showOnMobile: true,
  showOnDesktop: true,
  tooltip: 'Chat with Drapza Atelier Support on WhatsApp',
};

export const getWhatsAppConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'whatsapp-config' });
    const data = config?.data ? { ...DEFAULT_WHATSAPP_CONFIG, ...config.data } : DEFAULT_WHATSAPP_CONFIG;
    res.status(200).json({
      success: true,
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateWhatsAppConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body?.data || req.body;
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'whatsapp-config' },
      { key: 'whatsapp-config', data: incomingData },
      { upsert: true, new: true }
    );
    const data = { ...DEFAULT_WHATSAPP_CONFIG, ...(updated?.data || incomingData) };
    res.status(200).json({
      success: true,
      message: 'WhatsApp Floating Button configuration updated successfully.',
      data,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetWhatsAppConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'whatsapp-config' },
      { key: 'whatsapp-config', data: DEFAULT_WHATSAPP_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({
      success: true,
      message: 'WhatsApp button reset to factory defaults.',
      data: config.data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};
