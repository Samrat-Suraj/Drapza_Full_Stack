'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import {
  testimonialsConfigApi,
  DEFAULT_TESTIMONIALS_CONFIG,
} from '../lib/api';

export const TestimonialsPage = () => {
  const router = useRouter();
  const [config, setConfig] = useState(DEFAULT_TESTIMONIALS_CONFIG);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const autoPlayTimerRef = useRef(null);

  // Load live config from backend CMS + fallback + localStorage cache
  useEffect(() => {
    let isMounted = true;

    // Check localStorage cache first for fast paint
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('drapza_testimonials_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
            setConfig(parsed);
          }
        }
      } catch (_) {}
    }

    // Fetch live config from backend
    testimonialsConfigApi
      .getTestimonialsConfig()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        if (data && Array.isArray(data?.items) && data.items.length > 0) {
          setConfig(data);
          try {
            localStorage.setItem('drapza_testimonials_config', JSON.stringify(data));
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Listen to live update event dispatched when Admin saves
    const handleLiveUpdate = (e) => {
      const data = e?.detail;
      if (data && Array.isArray(data?.items)) {
        setConfig(data);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'drapza_testimonials_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed?.items)) {
            setConfig(parsed);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('drapza_testimonials_updated', handleLiveUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('drapza_testimonials_updated', handleLiveUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter only active items (or fallback to defaults)
  const items = (config?.items || []).filter((item) => item.isActive !== false);
  const activeItems = items.length > 0 ? items : DEFAULT_TESTIMONIALS_CONFIG.items;

  // Safe bounds check
  const safeIndex = currentIndex >= activeItems.length ? 0 : currentIndex;
  const current = activeItems[safeIndex] || activeItems[0];

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    setTimeout(() => setIsAnimating(false), 350);
  }, [isAnimating, activeItems.length]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    setTimeout(() => setIsAnimating(false), 350);
  }, [isAnimating, activeItems.length]);

  const handleSelect = useCallback(
    (idx) => {
      if (idx !== safeIndex && !isAnimating) {
        setIsAnimating(true);
        setCurrentIndex(idx);
        setTimeout(() => setIsAnimating(false), 350);
      }
    },
    [safeIndex, isAnimating]
  );

  // Autoplay loop controlled via Admin config & user toggle
  useEffect(() => {
    if (!config?.autoplay || !isPlaying || activeItems.length <= 1) return;
    const interval = Math.max(2500, config?.autoplayInterval || 6000);
    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, interval);
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [config?.autoplay, config?.autoplayInterval, isPlaying, activeItems.length, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Convert any ALL-CAPS or raw name into elegant Title Case for Didone serif
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const rawName = toTitleCase((current?.name || 'Diana Tigelle').trim());
  const nameParts = rawName.split(' ');
  const firstName = nameParts[0] || 'Diana';
  const lastName = nameParts.slice(1).join(' ') || (firstName.toLowerCase() === 'diana' ? 'Tigelle' : '');

  const avatarSrc = current?.avatar || '/testimonials/diana-tigelle.png';
  const roleText = current?.role || 'Editorial Director & Atelier Patron';
  const cityText = current?.city || 'Milan / New York';
  const badgeLabel = current?.badge || current?.acquisition || 'Verified Atelier Client';

  return (
    <div className="testimonials-root">
      {/* Main Hero Testimonial Canvas Matching Reference Image */}
      <main className="testimonials-canvas">
        <div className={`testimonial-inner-grid ${isAnimating ? 'fade-transition' : ''}`}>
          {/* Left Column: Opening Quote, Quote Text, Closing Quote, and Bottom Horizontal Line */}
          <div className="quote-column">
            {/* Top Double Quote Mark */}
            <div className="quote-mark top-mark" aria-hidden="true">
              “
            </div>

            {/* Quote Body Paragraph */}
            <p className="quote-body-text">{current?.quote}</p>

            {/* Bottom Double Quote Mark */}
            <div className="quote-mark bottom-mark" aria-hidden="true">
              ”
            </div>

            {/* Subtle Client Metadata */}
            <div className="client-meta-tag">
              <span className="meta-dot" />
              <span>
                {roleText} • {cityText}
              </span>
              {badgeLabel && (
                <span className="meta-badge">
                  // {badgeLabel}
                </span>
              )}
            </div>

            {/* Left Horizontal Architectural Line */}
            <div className="left-horizontal-line" />
          </div>

          {/* Right Column: Circular Avatar + Stacked Serif Author Name + Vertical Rule */}
          <div className="author-column">
            <div className="author-composition-box">
              {/* Circular Portrait with exact crop */}
              <div className="avatar-wrapper">
                <img
                  src={avatarSrc}
                  alt={`${firstName} ${lastName}`}
                  className="avatar-img"
                  onError={(e) => {
                    e.currentTarget.src = '/testimonials/diana-tigelle.png';
                  }}
                />
              </div>

              {/* Stacked Serif Author Name (Diana Tigelle) */}
              <h1
                className="author-name"
                style={{
                  fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif",
                  fontSize: 'clamp(3.6rem, 5.8vw, 5.4rem)',
                  fontWeight: 700,
                  lineHeight: 0.9,
                  color: '#373957',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  textTransform: 'capitalize',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  className="first-name"
                  style={{
                    fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif",
                    fontSize: 'clamp(3.6rem, 5.8vw, 5.4rem)',
                    fontWeight: 700,
                    lineHeight: 0.9,
                    color: '#373957',
                    letterSpacing: '-0.025em',
                    display: 'block',
                  }}
                >
                  {firstName}
                </span>
                {lastName && (
                  <span
                    className="last-name"
                    style={{
                      fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif",
                      fontSize: 'clamp(3.6rem, 5.8vw, 5.4rem)',
                      fontWeight: 700,
                      lineHeight: 0.9,
                      color: '#373957',
                      letterSpacing: '-0.025em',
                      display: 'block',
                    }}
                  >
                    {lastName}
                  </span>
                )}
              </h1>

              {/* Right Vertical Architectural Line - pinned right beside the avatar/name composition */}
              <div className="right-vertical-line" />

              {/* Right Horizontal Architectural Line */}
              <div className="right-horizontal-line" />
            </div>
          </div>
        </div>

        {/* Minimalist Carousel Controls Bar */}
        <div className="controls-bar">
          <div className="counter-pill">
            <span className="counter-current">
              {String(safeIndex + 1).padStart(2, '0')}
            </span>
            <span className="counter-divider">/</span>
            <span className="counter-total">
              {String(activeItems.length).padStart(2, '0')}
            </span>
          </div>

          {/* Nav Buttons + Play/Pause */}
          <div className="slider-nav-btns">
            <button
              type="button"
              className="nav-btn prev-btn"
              onClick={handlePrev}
              aria-label="Previous testimonial"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>PREV</span>
            </button>

            <button
              type="button"
              className="nav-btn play-pause-btn"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause auto-slide' : 'Resume auto-slide'}
            >
              {isPlaying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>PLAY</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="nav-btn next-btn"
              onClick={handleNext}
              aria-label="Next testimonial"
            >
              <span>NEXT</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {/* Interactive Client Tabs */}
          <div className="client-tabs">
            {activeItems.map((t, idx) => {
              const tabName = (t?.name || '').trim().split(' ')[0] || `Client ${idx + 1}`;
              return (
                <button
                  key={t.id || idx}
                  type="button"
                  className={`client-tab-dot ${idx === safeIndex ? 'active' : ''}`}
                  onClick={() => handleSelect(idx)}
                >
                  {tabName}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 1:1 Modular Transmit Signal / Newsletter Section */}
      <ContactForm />

      {/* Global DRAPZA Atelier Storefront Footer */}
      <Footer />

      {/* Scoped CSS with exact palette, fonts, and grid lines */}
      <style jsx>{`
        .testimonials-root {
          min-height: 100vh;
          min-height: 100dvh;
          background-color: #f8f5e7;
          color: #373957;
          font-family: 'Plus Jakarta Sans', var(--font-host-grotesk), -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: relative;
          overflow-x: hidden;
          padding-top: 6.75rem;
        }

        /* Center Canvas */
        .testimonials-canvas {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 1.25rem 4rem clamp(2rem, 4vw, 3.5rem);
          margin-top: 0;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .testimonial-inner-grid {
          display: grid;
          grid-template-columns: minmax(320px, 1fr) minmax(360px, 1fr);
          align-items: stretch;
          column-gap: clamp(2rem, 5vw, 4.5rem);
          position: relative;
          transition: opacity 0.35s ease, transform 0.35s ease;
          padding: 0 0 1.5rem;
          margin-top: 0;
        }

        .testimonial-inner-grid.fade-transition {
          opacity: 0;
          transform: translateY(10px);
        }

        /* Left Quote Column */
        .quote-column {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-bottom: 2rem;
        }

        .quote-mark {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 4.2rem;
          line-height: 0.85;
          color: #373957;
          font-weight: 800;
          user-select: none;
        }

        .top-mark {
          margin-top: 0;
          margin-bottom: 1.25rem;
        }

        .bottom-mark {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .quote-body-text {
          font-size: clamp(1.02rem, 1.45vw, 1.22rem);
          font-weight: 600;
          line-height: 1.68;
          color: #373957;
          margin: 0;
          letter-spacing: -0.01em;
          max-width: 440px;
        }

        .client-meta-tag {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          color: #6c7094;
          margin-top: 0.5rem;
          text-transform: uppercase;
        }

        .meta-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #373957;
          display: inline-block;
        }

        .meta-badge {
          opacity: 0.75;
          font-size: 0.7rem;
        }

        /* Left Horizontal Line - exact match to image */
        .left-horizontal-line {
          position: absolute;
          bottom: 0;
          left: -40vw;
          right: 0;
          height: 2px;
          background-color: #373957;
        }

        /* Right Author Column */
        .author-column {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }

        .author-composition-box {
          position: relative;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: auto;
          margin-right: 2.5rem;
        }

        /* Circular Avatar - shifted right and slightly down matching reference and red circle */
        .avatar-wrapper {
          width: 230px;
          height: 230px;
          border-radius: 50%;
          overflow: hidden;
          margin-left: clamp(4.5rem, 8vw, 7.5rem);
          margin-top: 1.25rem;
          margin-bottom: 2rem;
          box-shadow: 0 12px 36px rgba(55, 57, 87, 0.16);
          position: relative;
          background-color: #ece7d5;
          border: 1px solid rgba(55, 57, 87, 0.1);
          flex-shrink: 0;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .avatar-wrapper:hover .avatar-img {
          transform: scale(1.04);
        }

        /* Stacked Serif Author Name */
        .author-name {
          font-family: 'Playfair Display', Didot, 'Bodoni MT', Georgia, serif !important;
          font-size: clamp(3.5rem, 5.8vw, 5.4rem) !important;
          font-weight: 700 !important;
          line-height: 0.9 !important;
          color: #373957 !important;
          letter-spacing: -0.025em !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          text-transform: capitalize !important;
        }

        .author-name .first-name,
        .author-name .last-name {
          display: block !important;
          font-family: 'Playfair Display', Didot, 'Bodoni MT', Georgia, serif !important;
          color: #373957 !important;
        }

        /* Right Vertical & Horizontal Graphic Lines - pinned right beside the avatar */
        .right-vertical-line {
          position: absolute;
          top: -2.5rem;
          right: -2rem;
          bottom: 3.5rem;
          width: 2px;
          background-color: #373957;
        }

        .right-horizontal-line {
          position: absolute;
          bottom: 0;
          left: calc(100% - 2rem);
          right: -40vw;
          height: 2px;
          background-color: #373957;
        }

        /* Controls Bar */
        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(55, 57, 87, 0.12);
          gap: 1rem;
          flex-wrap: wrap;
        }

        .counter-pill {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.95rem;
          letter-spacing: 0.15em;
          color: #373957;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .counter-divider {
          opacity: 0.4;
        }

        .counter-total {
          opacity: 0.55;
        }

        .slider-nav-btns {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .nav-btn {
          background-color: transparent;
          border: 1.5px solid #373957;
          border-radius: 999px;
          color: #373957;
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          padding: 0.5rem 1.15rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-btn:hover {
          background-color: #373957;
          color: #f8f5e7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(55, 57, 87, 0.15);
        }

        .play-pause-btn {
          padding: 0.5rem 0.95rem;
          font-size: 0.72rem;
          border-color: rgba(55, 57, 87, 0.45);
        }

        .client-tabs {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .client-tab-dot {
          background: transparent;
          border: 1px solid transparent;
          color: #7b80a4;
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          transition: all 0.2s ease;
        }

        .client-tab-dot.active {
          color: #373957;
          font-weight: 700;
          background: rgba(55, 57, 87, 0.1);
          border-color: rgba(55, 57, 87, 0.35);
        }

        .client-tab-dot:hover:not(.active) {
          color: #373957;
          background: rgba(55, 57, 87, 0.04);
        }

        /* Responsive Breakpoints */
        @media (max-width: 980px) {
          .testimonials-root {
            padding-top: 4.75rem;
          }

          .testimonials-canvas {
            padding: 0.5rem 1.5rem 2.5rem;
          }

          .testimonial-inner-grid {
            grid-template-columns: 1fr;
            row-gap: 3.5rem;
          }

          .quote-column {
            padding-bottom: 2rem;
          }

          .left-horizontal-line {
            display: none;
          }

          .author-column {
            padding-left: 0;
            align-items: flex-start;
          }

          .author-composition-box {
            max-width: 100%;
            margin-left: 0;
            margin-right: 0;
            padding-left: 0;
          }

          .avatar-wrapper {
            width: 180px;
            height: 180px;
          }

          .right-vertical-line {
            display: none;
          }

          .right-horizontal-line {
            display: none;
          }

          .controls-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TestimonialsPage;

