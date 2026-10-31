'use client';

import { useState, useEffect } from 'react';
import {
  heroApi,
  statementApi,
  marqueeApi,
  ctaApi,
  textBlockApi,
  peelRevealApi,
  contactConfigApi,
  footerConfigApi,
} from '../lib/api';

export const DEFAULT_PEEL_REVEAL_STATE = {
  isEnabled: true,
  signalType: 'Signal type: Neutral',
  moduleId: 'Module ID: Nrmlss_001',
  status: 'Status: Detached',
  splitWordLeft: 'Signal',
  splitWordRight: 'Motion',
  headline: 'The uniform holds no allegiance',
  modelImage: '/peel-reveal/peel-reveal-img.jpg',
  maskImage: '/peel-reveal/peel-reveal-img-mask.png',
  maskLayersCount: 6,
  backgroundColor: '',
  textColor: '',
  splitDistancePercent: 55,
};

export const DEFAULT_CTA_STATE = {
  headerText: 'A field test in silhouettes',
  headingLine1: 'A FIELD TEST IN',
  headingLine2: 'SILHOUETTES',
  headingLine3: '',
  copyText: 'Built to exist outside context, these forms prioritize neutrality, and distortion.',
  editorialText: 'Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion.',
  buttonText: 'Enter Wardrobe',
  buttonUrl: '/wardrobe',
  image1: '/cta/cta_img_01.jpg',
  image2: '/cta/cta_img_02.jpg',
  image3: '/cta/cta_img_03.jpg',
  leftImage: '/cta/cta_img_01.jpg',
  centerImage: '/cta/cta_img_02.jpg',
  rightImage: '/cta/cta_img_03.jpg',
  isEnabled: true,
};

export const DEFAULT_TEXTBLOCK_STATE = {
  headline: 'Designed absence, engineered silence.',
  headlineLine1: 'DESIGNED ABSENCE,',
  headlineLine2: 'ENGINEERED SILENCE.',
  paragraph1:
    'Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.',
  paragraph2:
    'No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who exit the frame.',
  showSymbol: true,
  customSymbolImage: '',
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  isEnabled: true,
};

export const DEFAULT_MARQUEE_STATE = {
  isEnabled: true,
  marqueeHeader1: 'Transmission lost in neutral space',
  marqueeHeader2: 'Synthetic forms archive the signal',
  tag: '[ Frame Shift ]',
  headline: 'Modular silence across systems',
  cardImage: '/marquee-banner/marquee_banner_01.png',
  direction1: 'left',
  direction2: 'right',
  speed1: 30,
  speed2: 30,
  pauseOnHover: true,
  showHeroCard: true,
  cardPosition: 'center',
  cardTag: '[ Archival Unit ]',
  cardTitle: 'CYBER TACTICAL OVERSHIRT',
  cardSubtitle: 'EDITION 01 / HEAVY COTTON TWILL',
  cardBadge: 'IN STOCK',
  cardPrice: '₹14,800',
  cardButtonText: 'INSPECT UNIT',
  cardButtonUrl: '/wardrobe',
};

export const DEFAULT_CONTACT_STATE = {
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

export const DEFAULT_FOOTER_STATE = {
  isEnabled: true,
  rootTitle: 'Root',
  rootLinks: [
    { label: 'Drapza Home', href: '/' },
    { label: 'Shop All Products', href: '/wardrobe' },
    { label: 'Custom Size Fittings', href: '#custom-size-fittings', isBespoke: true },
    { label: 'About Drapza', href: '/genesis' },
    { label: 'Contact Us', href: '/touchpoint' },
    { label: 'Lookbook', href: '/lookbook' },
    { label: 'Product Reviews', href: '/reviews' },
    { label: 'Product Page', href: '/unit' },
  ],
  connectTitle: 'Connect Feed',
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  youtubeUrl: 'https://www.youtube.com/',
  openLineTitle: 'Open Line',
  phone: '+91 8888333038',
  addressLine1: 'Unit 07, Sector N',
  addressLine2: 'Layer 2, South Terminal',
  addressLine3: 'System 021, Earth',
  brandLogoText: 'DRAPZA',
  copyrightText: '©2025 All modules reserved.',
  studioLabel: 'Drapza Studio',
};

/**
 * Custom Hook: useHomePageCms
 * Connects frontend view components to persistent CMS state in MongoDB & localStorage.
 * Listens to CustomEvents, storage events, and cross-tab BroadcastChannel.
 */
export function useHomePageCms() {
  const [heroConfig, setHeroConfig] = useState({
    sectionTag: '[ SYSTEM ARCHIVE 2026 ]',
    headerText: 'A FIELD TEST IN SILHOUETTES',
    headingLine1: 'A FIELD TEST IN',
    headingLine2: 'SILHOUETTES',
    tagline: 'High-density technical outerwear tailored for atmospheric variance.',
    heroImage: '/images/drapza/hero/hero_main.png',
    ctaButtonText: 'ENTER WARDROBE',
    ctaButtonUrl: '/wardrobe',
    isEnabled: true,
  });

  const [statementConfig, setStatementConfig] = useState({
    titleText: 'STATEMENT',
    bodyText: 'We build outerwear for an unforgiving climate. Technical fabrics, architectural cuts, uncompromising utility.',
    customSymbolImage: '',
    isEnabled: true,
  });

  const [marqueeConfig, setMarqueeConfig] = useState(DEFAULT_MARQUEE_STATE);
  const [ctaConfig, setCtaConfig] = useState(DEFAULT_CTA_STATE);
  const [textBlockConfig, setTextBlockConfig] = useState(DEFAULT_TEXTBLOCK_STATE);
  const [peelRevealConfig, setPeelRevealConfig] = useState(DEFAULT_PEEL_REVEAL_STATE);
  const [contactConfig, setContactConfig] = useState(DEFAULT_CONTACT_STATE);
  const [footerConfig, setFooterConfig] = useState(DEFAULT_FOOTER_STATE);

  useEffect(() => {
    let mounted = true;

    // 1. Hydrate from localStorage for instant 0ms render
    try {
      const savedHero = localStorage.getItem('drapza_hero_config');
      if (savedHero) {
        const parsed = JSON.parse(savedHero);
        if (mounted && parsed) setHeroConfig((prev) => ({ ...prev, ...parsed }));
      }
      const savedStatement = localStorage.getItem('drapza_statement_config');
      if (savedStatement) {
        const parsedStatement = JSON.parse(savedStatement);
        if (mounted && parsedStatement) setStatementConfig((prev) => ({ ...prev, ...parsedStatement }));
      }
      const savedMarquee = localStorage.getItem('drapza_marquee_config');
      if (savedMarquee) {
        const parsedMarquee = JSON.parse(savedMarquee);
        if (mounted && parsedMarquee) setMarqueeConfig((prev) => ({ ...prev, ...parsedMarquee }));
      }
      const savedCta = localStorage.getItem('drapza_cta_config');
      if (savedCta) {
        const parsedCta = JSON.parse(savedCta);
        if (mounted && parsedCta) setCtaConfig((prev) => ({ ...prev, ...parsedCta }));
      }
      const savedTextBlock = localStorage.getItem('drapza_textblock_config');
      if (savedTextBlock) {
        const parsedTb = JSON.parse(savedTextBlock);
        if (mounted && parsedTb) setTextBlockConfig((prev) => ({ ...prev, ...parsedTb }));
      }
      const savedPeel = localStorage.getItem('drapza_peel_reveal_config');
      if (savedPeel) {
        const parsedPeel = JSON.parse(savedPeel);
        if (mounted && parsedPeel) setPeelRevealConfig((prev) => ({ ...prev, ...parsedPeel }));
      }
      const savedContact = localStorage.getItem('drapza_contact_config');
      if (savedContact) {
        const parsedContact = JSON.parse(savedContact);
        if (mounted && parsedContact) setContactConfig((prev) => ({ ...prev, ...parsedContact }));
      }
      const savedFooter = localStorage.getItem('drapza_footer_config');
      if (savedFooter) {
        const parsedFooter = JSON.parse(savedFooter);
        if (mounted && parsedFooter) setFooterConfig((prev) => ({ ...prev, ...parsedFooter }));
      }
    } catch (_) {}

    // 2. Fetch latest live CMS config from API
    const loadCmsConfigs = async () => {
      try {
        const [heroRes, statementRes, marqueeRes, ctaRes, textBlockRes, peelRes, contactRes, footerRes] = await Promise.allSettled([
          heroApi.getHeroConfig(),
          statementApi.getStatementConfig(),
          marqueeApi.getMarqueeConfig(),
          ctaApi.getCtaConfig(),
          textBlockApi.getTextBlockConfig(),
          peelRevealApi.getPeelRevealConfig(),
          contactConfigApi.getContactConfig(),
          footerConfigApi.getFooterConfig(),
        ]);

        if (heroRes.status === 'fulfilled') {
          const data = heroRes.value?.data || (heroRes.value?.success ? heroRes.value : null);
          if (data && mounted) {
            setHeroConfig((prev) => {
              const next = { ...prev, ...data };
              try { localStorage.setItem('drapza_hero_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (statementRes.status === 'fulfilled') {
          const sData = statementRes.value?.data || (statementRes.value?.success ? statementRes.value : null);
          if (sData && mounted) {
            setStatementConfig((prev) => {
              const next = { ...prev, ...sData };
              try { localStorage.setItem('drapza_statement_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (marqueeRes.status === 'fulfilled') {
          const mData = marqueeRes.value?.data || (marqueeRes.value?.success ? marqueeRes.value : null);
          if (mData && mounted) {
            setMarqueeConfig((prev) => {
              const next = { ...prev, ...mData };
              try { localStorage.setItem('drapza_marquee_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (ctaRes.status === 'fulfilled') {
          const cData = ctaRes.value?.data || (ctaRes.value?.success ? ctaRes.value : null);
          if (cData && mounted) {
            setCtaConfig((prev) => {
              const next = { ...prev, ...cData };
              try { localStorage.setItem('drapza_cta_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (textBlockRes.status === 'fulfilled') {
          const tbData = textBlockRes.value?.data || (textBlockRes.value?.success ? textBlockRes.value : null);
          if (tbData && mounted) {
            setTextBlockConfig((prev) => {
              const next = { ...prev, ...tbData };
              try { localStorage.setItem('drapza_textblock_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (peelRes.status === 'fulfilled') {
          const pData = peelRes.value?.data || (peelRes.value?.success ? peelRes.value : null);
          if (pData && mounted) {
            setPeelRevealConfig((prev) => {
              const next = { ...prev, ...pData };
              try { localStorage.setItem('drapza_peel_reveal_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (contactRes.status === 'fulfilled') {
          const cntData = contactRes.value?.data || (contactRes.value?.success ? contactRes.value : null);
          if (cntData && mounted) {
            setContactConfig((prev) => {
              const next = { ...prev, ...cntData };
              try { localStorage.setItem('drapza_contact_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }

        if (footerRes.status === 'fulfilled') {
          const fData = footerRes.value?.data || (footerRes.value?.success ? footerRes.value : null);
          if (fData && mounted) {
            setFooterConfig((prev) => {
              const next = { ...prev, ...fData };
              try { localStorage.setItem('drapza_footer_config', JSON.stringify(next)); } catch (_) {}
              return next;
            });
          }
        }
      } catch (err) {
        console.warn('CMS config load error:', err);
      }
    };

    loadCmsConfigs();

    // 3. Window Custom Event Handlers
    const handleCustomHeroUpdate = (e) => {
      if (e?.detail) setHeroConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomStatementUpdate = (e) => {
      if (e?.detail) setStatementConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomMarqueeUpdate = (e) => {
      if (e?.detail) setMarqueeConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomCtaUpdate = (e) => {
      if (e?.detail) setCtaConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomTextBlockUpdate = (e) => {
      if (e?.detail) setTextBlockConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomPeelRevealUpdate = (e) => {
      if (e?.detail) setPeelRevealConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomContactUpdate = (e) => {
      if (e?.detail) setContactConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleCustomFooterUpdate = (e) => {
      if (e?.detail) setFooterConfig((prev) => ({ ...prev, ...e.detail }));
    };

    const handleStorageUpdate = (e) => {
      if (e.key === 'drapza_hero_config' && e.newValue) {
        try { setHeroConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_statement_config' && e.newValue) {
        try { setStatementConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_marquee_config' && e.newValue) {
        try { setMarqueeConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_cta_config' && e.newValue) {
        try { setCtaConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_textblock_config' && e.newValue) {
        try { setTextBlockConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_peel_reveal_config' && e.newValue) {
        try { setPeelRevealConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_contact_config' && e.newValue) {
        try { setContactConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
      if (e.key === 'drapza_footer_config' && e.newValue) {
        try { setFooterConfig((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
    };

    window.addEventListener('drapza_hero_config_updated', handleCustomHeroUpdate);
    window.addEventListener('drapza_statement_config_updated', handleCustomStatementUpdate);
    window.addEventListener('drapza_marquee_config_updated', handleCustomMarqueeUpdate);
    window.addEventListener('drapza_cta_config_updated', handleCustomCtaUpdate);
    window.addEventListener('drapza_textblock_config_updated', handleCustomTextBlockUpdate);
    window.addEventListener('drapza_peel_reveal_config_updated', handleCustomPeelRevealUpdate);
    window.addEventListener('drapza_contact_config_updated', handleCustomContactUpdate);
    window.addEventListener('drapza_footer_config_updated', handleCustomFooterUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // 4. Cross-Tab Live BroadcastChannel
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('drapza_hero_channel');
        channel.onmessage = (msg) => {
          if (msg.data?.type === 'HERO_CONFIG_UPDATED' && msg.data?.payload) {
            setHeroConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'STATEMENT_CONFIG_UPDATED' && msg.data?.payload) {
            setStatementConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'MARQUEE_CONFIG_UPDATED' && msg.data?.payload) {
            setMarqueeConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'CTA_CONFIG_UPDATED' && msg.data?.payload) {
            setCtaConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'TEXTBLOCK_CONFIG_UPDATED' && msg.data?.payload) {
            setTextBlockConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'PEEL_REVEAL_CONFIG_UPDATED' && msg.data?.payload) {
            setPeelRevealConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'CONTACT_CONFIG_UPDATED' && msg.data?.payload) {
            setContactConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
          if (msg.data?.type === 'FOOTER_CONFIG_UPDATED' && msg.data?.payload) {
            setFooterConfig((prev) => ({ ...prev, ...msg.data.payload }));
          }
        };
      } catch (_) {}
    }

    return () => {
      mounted = false;
      window.removeEventListener('drapza_hero_config_updated', handleCustomHeroUpdate);
      window.removeEventListener('drapza_statement_config_updated', handleCustomStatementUpdate);
      window.removeEventListener('drapza_marquee_config_updated', handleCustomMarqueeUpdate);
      window.removeEventListener('drapza_cta_config_updated', handleCustomCtaUpdate);
      window.removeEventListener('drapza_textblock_config_updated', handleCustomTextBlockUpdate);
      window.removeEventListener('drapza_peel_reveal_config_updated', handleCustomPeelRevealUpdate);
      window.removeEventListener('drapza_contact_config_updated', handleCustomContactUpdate);
      window.removeEventListener('drapza_footer_config_updated', handleCustomFooterUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      if (channel) channel.close();
    };
  }, []);

  return {
    heroConfig,
    setHeroConfig,
    statementConfig,
    setStatementConfig,
    marqueeConfig,
    setMarqueeConfig,
    ctaConfig,
    setCtaConfig,
    textBlockConfig,
    setTextBlockConfig,
    peelRevealConfig,
    setPeelRevealConfig,
    contactConfig,
    setContactConfig,
    footerConfig,
    setFooterConfig,
  };
}

export default useHomePageCms;
