'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from './PageTransition';
import { BookCustomSizeModal } from './drapza/BookCustomSizeModal';
import { footerConfigApi } from '../lib/api';

export const DEFAULT_STOREFRONT_FOOTER_CONFIG = {
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
  openLineTitle: 'Open Line',
  phone: '+91 8888333038',
  addressLine1: 'Unit 07, Sector N',
  addressLine2: 'Layer 2, South Terminal',
  addressLine3: 'System 021, Earth',
  brandLogoText: 'DRAPZA',
  copyrightText: '©2025 All modules reserved.',
  studioLabel: 'Drapza Studio',
};

export const Footer = ({
  config = null,
  isEditable = false,
  onUpdate = null,
  navigate: propNavigate = null,
  className = '',
  style = {},
}) => {
  const [liveConfig, setLiveConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('drapza_footer_config');
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return DEFAULT_STOREFRONT_FOOTER_CONFIG;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLiveConfig = async () => {
      try {
        const res = await footerConfigApi.getFooterConfig();
        const data = res?.data || (res?.rootTitle || res?.col1Title ? res : null);
        if (isMounted && data) {
          setLiveConfig(data);
          try {
            localStorage.setItem('drapza_footer_config', JSON.stringify(data));
          } catch (_) {}
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchLiveConfig();

    const handleUpdate = (e) => {
      if (e?.detail) {
        setLiveConfig(e.detail);
      } else {
        fetchLiveConfig();
      }
    };

    window.addEventListener('drapza_footer_config_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('drapza_footer_config_updated', handleUpdate);
    };
  }, []);

  const activeConfig = (config && Object.keys(config).length > 0) ? { ...liveConfig, ...config } : liveConfig;
  const finalConfig = { ...DEFAULT_STOREFRONT_FOOTER_CONFIG, ...activeConfig };
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);

  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const handleLink = (e, path) => {
    e.preventDefault();
    if (isEditable) return;
    if (navigate) navigate(path);
    else router.push(path);
  };

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    if (field === 'rootTitle') {
      onUpdate({ rootTitle: text, col1Title: text });
    } else if (field === 'connectTitle') {
      onUpdate({ connectTitle: text, col2Title: text });
    } else if (field === 'openLineTitle') {
      onUpdate({ openLineTitle: text, col3Title: text });
    } else {
      onUpdate({ [field]: text });
    }
  };

  const rootLinks = (Array.isArray(finalConfig.rootLinks) && finalConfig.rootLinks.length > 0)
    ? finalConfig.rootLinks
    : ((Array.isArray(finalConfig.col1Links) && finalConfig.col1Links.length > 0)
        ? finalConfig.col1Links
        : DEFAULT_STOREFRONT_FOOTER_CONFIG.rootLinks);

  const splitAddress = (finalConfig.addressText || '').split(/[\r\n]+/).filter(Boolean);
  const displayAddress1 = finalConfig.addressLine1 || splitAddress[0] || 'Unit 07, Sector N';
  const displayAddress2 = finalConfig.addressLine2 || splitAddress[1] || 'Layer 2, South Terminal';
  const displayAddress3 = finalConfig.addressLine3 || splitAddress[2] || 'System 021, Earth';

  return (
    <>
      <footer
        className={`footer ${className}`.trim()}
        style={{
          position: 'relative',
          width: '100%',
          ...style,
        }}
      >
        <div className="container">
          <div className="footer-row">
            {/* Column 1: Root Navigation */}
            <div className="footer-col">
              <div className="footer-col-header">
                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('rootTitle', e)}
                    className="bodyCopy outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 py-0.5 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Root Title"
                  >
                    {finalConfig.rootTitle || 'Root'}
                  </p>
                ) : (
                  <p className="bodyCopy">{finalConfig.rootTitle || 'Root'}</p>
                )}
              </div>
              <div className="footer-col-links">
                {rootLinks.map((link, idx) => {
                  if (link.isBespoke) {
                    return (
                      <a
                        key={`footer-link-${idx}`}
                        href="#custom-size-fittings"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isEditable) setIsCustomSizeOpen(true);
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{link.label}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            background: '#000',
                            color: '#fff',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Bespoke
                        </span>
                      </a>
                    );
                  }
                  return (
                    <a
                      key={`footer-link-${idx}`}
                      href={link.href || '/'}
                      onClick={(e) => handleLink(e, link.href || '/')}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Connect Feed Socials */}
            <div className="footer-col">
              <div className="footer-col-header">
                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('connectTitle', e)}
                    className="bodyCopy outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 py-0.5 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Connect Feed Title"
                  >
                    {finalConfig.connectTitle || 'Connect Feed'}
                  </p>
                ) : (
                  <p className="bodyCopy">{finalConfig.connectTitle || 'Connect Feed'}</p>
                )}
              </div>
              <div className="footer-col-links">
                {Array.isArray(finalConfig.col2Links) && finalConfig.col2Links.length > 0 ? (
                  finalConfig.col2Links.map((link, idx) => (
                    <a
                      key={`col2-link-${idx}`}
                      href={link.href || '#'}
                      target={link.href && link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href && link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={(e) => { if (isEditable) e.preventDefault(); }}
                    >
                      {link.label}
                    </a>
                  ))
                ) : (
                  <>
                    <a
                      href={finalConfig.facebookUrl || 'https://www.facebook.com/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (isEditable) e.preventDefault(); }}
                    >
                      Facebook
                    </a>
                    <a
                      href={finalConfig.instagramUrl || 'https://www.instagram.com/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (isEditable) e.preventDefault(); }}
                    >
                      Instagram
                    </a>
                    <a
                      href={finalConfig.youtubeUrl || 'https://www.youtube.com/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (isEditable) e.preventDefault(); }}
                    >
                      YouTube
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Column 3: Open Line Hotline & Addresses */}
            <div className="footer-col">
              <div className="footer-col-header">
                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('openLineTitle', e)}
                    className="bodyCopy outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 py-0.5 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Open Line Title"
                  >
                    {finalConfig.openLineTitle || 'Open Line'}
                  </p>
                ) : (
                  <p className="bodyCopy">{finalConfig.openLineTitle || 'Open Line'}</p>
                )}
              </div>
              <div className="footer-col-links">
                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('phone', e)}
                    className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto font-mono"
                    title="Click directly to edit Phone"
                  >
                    {finalConfig.phone || '+91 8888333038'}
                  </p>
                ) : (
                  <a href={`tel:${(finalConfig.phone || '8888333038').replace(/\s+/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {finalConfig.phone || '+91 8888333038'}
                  </a>
                )}

                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('addressLine1', e)}
                    className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Address Line 1"
                  >
                    {displayAddress1}
                  </p>
                ) : (
                  <p>{displayAddress1}</p>
                )}

                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('addressLine2', e)}
                    className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Address Line 2"
                  >
                    {displayAddress2}
                  </p>
                ) : (
                  <p>{displayAddress2}</p>
                )}

                {isEditable ? (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('addressLine3', e)}
                    className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                    title="Click directly to edit Address Line 3"
                  >
                    {displayAddress3}
                  </p>
                ) : (
                  <p>{displayAddress3}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="footer-row">
            <div className="footer-copyright">
              {isEditable ? (
                <h5
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleBlur('brandLogoText', e)}
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                  className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                  title="Click directly to edit Brand Logo Text"
                >
                  {finalConfig.brandLogoText || 'DRAPZA'}
                </h5>
              ) : (
                <h5
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {finalConfig.brandLogoText || 'DRAPZA'}
                </h5>
              )}

              {isEditable ? (
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleBlur('copyrightText', e)}
                  className="bodyCopy outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                  title="Click directly to edit Copyright Notice"
                >
                  {finalConfig.copyrightText || '©2025 All modules reserved.'}
                </p>
              ) : (
                <p className="bodyCopy">{finalConfig.copyrightText || '©2025 All modules reserved.'}</p>
              )}

              {isEditable ? (
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleBlur('studioLabel', e)}
                  id="copyright-text"
                  className="bodyCopy outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-1 rounded cursor-text transition-all select-text pointer-events-auto"
                  title="Click directly to edit Studio Label"
                >
                  {finalConfig.studioLabel || 'Drapza Studio'}
                </p>
              ) : (
                <p className="bodyCopy" id="copyright-text">
                  {finalConfig.studioLabel || 'Drapza Studio'}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* BESPOKE CUSTOM SIZE FITTINGS MODAL */}
      <BookCustomSizeModal
        isOpen={isCustomSizeOpen}
        onClose={() => setIsCustomSizeOpen(false)}
      />
    </>
  );
};

export default Footer;
