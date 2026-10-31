'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextMotion } from '../components/TextMotion';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import {
  touchpointConfigApi,
  TouchpointConfigData,
  DEFAULT_TOUCHPOINT_CONFIG,
} from '../lib/api';

import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';

gsap.registerPlugin(ScrollTrigger);

export const TouchpointPage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const calloutSectionRef = useRef(null);

  const [config, setConfig] = useState(DEFAULT_TOUCHPOINT_CONFIG);

  useEffect(() => {
    let isMounted = true;

    // Check localStorage cache first for fast paint
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('drapza_touchpoint_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setConfig((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (_) {}
    }

    // Fetch live config from backend
    touchpointConfigApi
      .getTouchpointConfig()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        if (data && typeof data === 'object') {
          setConfig((prev) => ({ ...prev, ...data }));
          try {
            localStorage.setItem('drapza_touchpoint_config', JSON.stringify(data));
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Listen to live update event dispatched when Admin saves
    const handleLiveUpdate = (e) => {
      const data = e?.detail;
      if (data && typeof data === 'object') {
        setConfig((prev) => ({ ...prev, ...data }));
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'drapza_touchpoint_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setConfig((prev) => ({ ...prev, ...parsed }));
          }
        } catch (_) {}
      }
    };

    window.addEventListener('drapza_touchpoint_updated', handleLiveUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('drapza_touchpoint_updated', handleLiveUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const section = calloutSectionRef.current;
    if (!section) return;

    const img = section.querySelector('.contact-callout-img img');
    if (!img) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(img, { y: `${-20 * self.progress}rem` });
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const heroHeading = config?.heroHeading || DEFAULT_TOUCHPOINT_CONFIG.heroHeading;
  const heroImage = config?.heroImage || DEFAULT_TOUCHPOINT_CONFIG.heroImage;
  const commsLabel = config?.commsLabel || DEFAULT_TOUCHPOINT_CONFIG.commsLabel;
  const commsEmail = config?.commsEmail || DEFAULT_TOUCHPOINT_CONFIG.commsEmail;
  const dispatchLabel = config?.dispatchLabel || DEFAULT_TOUCHPOINT_CONFIG.dispatchLabel;
  const dispatchEmail = config?.dispatchEmail || DEFAULT_TOUCHPOINT_CONFIG.dispatchEmail;
  const phoneLabel = config?.phoneLabel || DEFAULT_TOUCHPOINT_CONFIG.phoneLabel;
  const phoneNumber = config?.phoneNumber || DEFAULT_TOUCHPOINT_CONFIG.phoneNumber;
  const calloutDescription = config?.calloutDescription || DEFAULT_TOUCHPOINT_CONFIG.calloutDescription;
  const calloutHeading = config?.calloutHeading || DEFAULT_TOUCHPOINT_CONFIG.calloutHeading;
  const calloutImage = config?.calloutImage || DEFAULT_TOUCHPOINT_CONFIG.calloutImage;

  return (
    <div className="page">
      {/* Contact Hero */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-col contact-hero-copy">
            <div className="contact-header">
              <TextMotion type="slide">
                <h3
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    fontSize: "clamp(2.2rem, 4.4vw, 3.8rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.03em",
                    textTransform: "uppercase",
                    color: "var(--base-700, #121316)",
                    margin: "0 0 1.75rem 0",
                    display: "block",
                  }}
                >
                  {heroHeading}
                </h3>
              </TextMotion>
            </div>
            <div className="contact-meta">
              <div className="contact-meta-block">
                <p
                  className="bodyCopy"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "clamp(0.8rem, 1.05vw, 0.95rem)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--base-500, #71717a)",
                    margin: "0 0 0.2rem 0",
                    fontWeight: 500,
                  }}
                >
                  {commsLabel}
                </p>
                <a
                  href={`mailto:${commsEmail}`}
                  style={{ color: "inherit", textDecoration: "none", display: "inline-block" }}
                >
                  <TextMotion type="flicker" delay={0.2}>
                    <h4
                      style={{
                        fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                        fontSize: "clamp(1.75rem, 3.4vw, 2.85rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.015em",
                        textTransform: "uppercase",
                        color: "var(--base-700, #121316)",
                        margin: 0,
                      }}
                    >
                      {commsEmail}
                    </h4>
                  </TextMotion>
                </a>
              </div>
              <div className="contact-meta-block">
                <p
                  className="bodyCopy"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "clamp(0.8rem, 1.05vw, 0.95rem)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--base-500, #71717a)",
                    margin: "0 0 0.2rem 0",
                    fontWeight: 500,
                  }}
                >
                  {dispatchLabel}
                </p>
                <a
                  href={`mailto:${dispatchEmail}`}
                  style={{ color: "inherit", textDecoration: "none", display: "inline-block" }}
                >
                  <TextMotion type="flicker" delay={0.3}>
                    <h4
                      style={{
                        fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                        fontSize: "clamp(1.75rem, 3.4vw, 2.85rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.015em",
                        textTransform: "uppercase",
                        color: "var(--base-700, #121316)",
                        margin: 0,
                      }}
                    >
                      {dispatchEmail}
                    </h4>
                  </TextMotion>
                </a>
              </div>
              <div className="contact-meta-block">
                <p
                  className="bodyCopy"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "clamp(0.8rem, 1.05vw, 0.95rem)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--base-500, #71717a)",
                    margin: "0 0 0.2rem 0",
                    fontWeight: 500,
                  }}
                >
                  {phoneLabel}
                </p>
                <a
                  href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                  style={{ color: "inherit", textDecoration: "none", display: "inline-block" }}
                >
                  <TextMotion type="flicker" delay={0.4}>
                    <h4
                      style={{
                        fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                        fontSize: "clamp(1.75rem, 3.4vw, 2.85rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.015em",
                        textTransform: "uppercase",
                        color: "var(--base-700, #121316)",
                        margin: 0,
                      }}
                    >
                      {phoneNumber}
                    </h4>
                  </TextMotion>
                </a>
              </div>
            </div>
          </div>
          <div className="contact-hero-col contact-hero-img-wrapper">
            <div className="contact-hero-img">
              <img
                src={heroImage}
                alt="Contact Hero"
                onError={(e) => {
                  e.currentTarget.src = "/contact/hero.png";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Callout */}
      <section className="contact-callout" ref={calloutSectionRef}>
        <div className="container">
          <div className="contact-callout-header">
            <div className="contact-callout-logo">
              <svg width="706" height="673" viewBox="0 0 706 673" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M705.23 329.88H502.48C613.57 213.37 675.09 107.26 645.17 73.92C614 39.18 493.58 94.58 359.13 200.68V0H346.1V211.08C326.26 227.11 306.18 244.2 286.08 262.24C260.94 284.8 237.26 307.49 215.34 329.89H0V342.92H202.75C91.66 459.43 30.1399 565.54 60.0599 598.88C91.2299 633.62 211.65 578.22 346.1 472.12V672.8H359.13V461.72C378.97 445.69 399.05 428.6 419.15 410.56C444.29 388 467.97 365.31 489.89 342.91H705.23V329.88ZM593.21 120.54C620.44 150.89 576.84 236.61 492.23 329.88H410.66C382.91 322.18 366.83 306.1 359.13 278.35V209.47C467.08 127.76 564.64 88.71 593.2 120.55L593.21 120.54ZM289.99 266.59C308.74 249.77 327.54 234.03 346.11 219.49V283.66C337.87 308.17 322.14 322.69 296.21 329.88H225.05C244.83 308.87 266.58 287.59 289.99 266.59ZM112.03 552.25C84.7999 521.9 128.4 436.18 213.01 342.91H301.51C324.3 350.57 338.45 364.71 346.11 387.51V463.33C238.16 545.04 140.6 584.09 112.04 552.25H112.03ZM415.25 406.2C396.5 423.02 377.7 438.76 359.13 453.3V392.81C366.33 366.88 380.84 351.14 405.35 342.91H480.19C460.41 363.92 438.66 385.2 415.25 406.2Z" fill="#edf1e8" />
              </svg>
            </div>
            <TextMotion type="flicker" delay={0.2}>
              <p>{calloutDescription}</p>
            </TextMotion>
            <TextMotion type="slide" delay={0.4}>
              <h1>{calloutHeading}</h1>
            </TextMotion>
            <div className="contact-callout-img" style={{ overflow: 'hidden' }}>
              <img
                src={calloutImage}
                alt="Contact Callout"
                onError={(e) => {
                  e.currentTarget.src = "/contact/contact-callout.jpg";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Contact Form & Footer */}
      <ContactForm />
      <Footer navigate={navigate} />

      <style jsx>{`
        .contact-hero {
          width: 100%;
          min-height: 100svh;
          height: auto;
          position: relative;
          overflow: visible;
          background-color: var(--base-100, #edf1e8);
          display: flex;
          align-items: center;
        }

        .contact-hero :global(.container) {
          display: grid;
          grid-template-columns: minmax(320px, 1.15fr) minmax(280px, 0.85fr);
          align-items: center;
          min-height: 100svh;
          height: auto;
          width: 100%;
          max-width: 1700px;
          margin: 0 auto;
          padding: 0 2rem;
          box-sizing: border-box;
        }

        .contact-hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(4.5rem, 6.5vh, 6rem) clamp(1rem, 2vw, 3rem) clamp(2rem, 4vh, 3.5rem) 0;
          box-sizing: border-box;
          z-index: 2;
        }

        .contact-header :global(h3) {
          font-family: var(--font-koulen), sans-serif !important;
          font-size: clamp(2.2rem, 4.4vw, 3.8rem) !important;
          line-height: 0.9 !important;
          letter-spacing: -0.03em !important;
          text-transform: uppercase !important;
          color: var(--base-700, #121316) !important;
          margin: 0 0 clamp(1.25rem, 2.5vh, 2rem) 0 !important;
        }

        .contact-meta {
          display: flex;
          flex-direction: column;
          gap: clamp(1rem, 1.8vh, 1.6rem);
        }

        .contact-meta-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .contact-meta-block :global(p.bodyCopy) {
          font-family: var(--font-dm-mono), monospace !important;
          font-size: clamp(0.8rem, 1.05vw, 0.95rem) !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          color: var(--base-500, #71717a) !important;
          margin: 0 0 0.2rem 0 !important;
          font-weight: 500 !important;
        }

        .contact-meta-block :global(h4) {
          font-family: var(--font-koulen), sans-serif !important;
          font-size: clamp(1.75rem, 3.4vw, 2.85rem) !important;
          line-height: 0.95 !important;
          letter-spacing: -0.015em !important;
          text-transform: uppercase !important;
          color: var(--base-700, #121316) !important;
          margin: 0 !important;
        }

        .contact-meta-block :global(a) {
          color: inherit !important;
          text-decoration: none !important;
          transition: opacity 0.2s ease;
          display: inline-block;
        }

        .contact-meta-block :global(a:hover) {
          opacity: 0.75;
        }

        .contact-hero-img-wrapper {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 100%;
          min-height: 100svh;
          position: relative;
        }

        .contact-hero-img {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
          transform: none !important;
        }

        .contact-hero-img img {
          width: auto;
          max-width: 100%;
          height: auto;
          max-height: calc(100svh - 3.5rem);
          object-fit: contain;
          object-position: bottom center;
          display: block;
        }

        @media (max-width: 1000px) {
          .contact-hero :global(.container) {
            grid-template-columns: 1fr;
            padding: 0 1.5rem;
          }
          .contact-hero-img-wrapper {
            display: none;
          }
          .contact-hero-copy {
            padding: 6rem 0 3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TouchpointPage;
