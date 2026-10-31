'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextMotion } from '../components/TextMotion';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';

import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { genesisApi, DEFAULT_GENESIS_CONFIG } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

// Authentic Digifox Genesis Logo
export const GenesisLogo = ({ fill = '#edf1e8', width = 706, height = 673 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 706 673"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M705.23 329.88H502.48C613.57 213.37 675.09 107.26 645.17 73.92C614 39.18 493.58 94.58 359.13 200.68V0H346.1V211.08C326.26 227.11 306.18 244.2 286.08 262.24C260.94 284.8 237.26 307.49 215.34 329.89H0V342.92H202.75C91.66 459.43 30.1399 565.54 60.0599 598.88C91.2299 633.62 211.65 578.22 346.1 472.12V672.8H359.13V461.72C378.97 445.69 399.05 428.6 419.15 410.56C444.29 388 467.97 365.31 489.89 342.91H705.23V329.88ZM593.21 120.54C620.44 150.89 576.84 236.61 492.23 329.88H410.66C382.91 322.18 366.83 306.1 359.13 278.35V209.47C467.08 127.76 564.64 88.71 593.2 120.55L593.21 120.54ZM289.99 266.59C308.74 249.77 327.54 234.03 346.11 219.49V283.66C337.87 308.17 322.14 322.69 296.21 329.88H225.05C244.83 308.87 266.58 287.59 289.99 266.59ZM112.03 552.25C84.7999 521.9 128.4 436.18 213.01 342.91H301.51C324.3 350.57 338.45 364.71 346.11 387.51V463.33C238.16 545.04 140.6 584.09 112.04 552.25H112.03ZM415.25 406.2C396.5 423.02 377.7 438.76 359.13 453.3V392.81C366.33 366.88 380.84 351.14 405.35 342.91H480.19C460.41 363.92 438.66 385.2 415.25 406.2Z"
      fill={fill}
    />
  </svg>
);

// Authentic TextBlock Component with Dynamic Admin Sync
export const TextBlock = ({ config }) => {
  const heading = config?.heading || 'Designed absence, engineered silence.';
  const logoFill = config?.logoFill || '#edf1e8';
  const p1 =
    config?.paragraph1 ||
    'Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.';
  const p2 =
    config?.paragraph2 ||
    'No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who exit the frame.';

  return (
    <section className="text-block">
      <div className="container">
        <div className="text-block-col">
          <TextMotion type="slide">
            <h3>{heading}</h3>
          </TextMotion>
          <div className="text-block-logo">
            <GenesisLogo fill={logoFill} />
          </div>
        </div>
        <div className="text-block-col">
          <div className="text-block-copy">
            <TextMotion type="slide">
              <p className="bodyCopy sm">{p1}</p>
            </TextMotion>
          </div>
          <div className="text-block-copy">
            <TextMotion type="slide" delay={0.2}>
              <p className="bodyCopy sm">{p2}</p>
            </TextMotion>
          </div>
        </div>
      </div>
    </section>
  );
};

// Complete Genesis Page with Full Admin Telemetry
export const GenesisPage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const pageRef = useRef(null);

  const [config, setConfig] = useState(DEFAULT_GENESIS_CONFIG);

  // Fetch Live Admin Configuration
  useEffect(() => {
    let isMounted = true;
    genesisApi
      .getConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Update document title dynamically if specified in admin
  useEffect(() => {
    if (config?.pageTitle && typeof document !== 'undefined') {
      document.title = config.pageTitle;
    }
  }, [config?.pageTitle]);

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }, 250);
    } else {
      window.scrollTo(0, 0);
    }

    const el = pageRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '.project-page-whitespace',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          const wrapper = document.querySelector('.project-preview-wrapper');
          const sideCols = document.querySelectorAll(
            '.preview-col:not(.main-preview-col)'
          );
          const mainImg = document.querySelector(
            '.preview-img.main-preview-img img'
          );
          const previewSection = document.querySelector('.project-preview');

          if (previewSection) {
            previewSection.style.opacity = self.progress >= 0.99 ? '0' : '1';
            previewSection.style.visibility = self.progress >= 0.99 ? 'hidden' : 'visible';
            previewSection.style.pointerEvents = 'none';
          }

          if (!wrapper || !sideCols.length || !mainImg) return;

          const w = window.innerWidth;
          const scaleWrapper = 1 + self.progress * (w < 900 ? 4 : 2.65);
          const transY = 300 * self.progress;
          const scaleImg = 2 - 0.85 * self.progress;

          wrapper.style.transform = `translate(-50%, -50%) scale(${scaleWrapper})`;
          sideCols.forEach((col) => {
            col.style.transform = `translateY(${transY}px)`;
          });
          mainImg.style.transform = `scale(${scaleImg})`;
        },
        onLeave: () => {
          const previewSection = document.querySelector('.project-preview');
          if (previewSection) {
            previewSection.style.opacity = '0';
            previewSection.style.visibility = 'hidden';
            previewSection.style.display = 'none';
          }
        },
        onEnterBack: () => {
          const previewSection = document.querySelector('.project-preview');
          if (previewSection) {
            previewSection.style.display = 'block';
            previewSection.style.opacity = '1';
            previewSection.style.visibility = 'visible';
          }
        }
      });
    }, el);

    return () => ctx.revert();
  }, [config?.settings?.showSpotlightZoom]);

  const spotlight = config?.spotlightMatrix || DEFAULT_GENESIS_CONFIG.spotlightMatrix;
  const col1 = spotlight.col1 || [];
  const col2 = spotlight.col2 || [];
  const col3 = spotlight.col3 || [];
  const col4 = spotlight.col4 || [];
  const col5 = spotlight.col5 || [];

  const copyBlock1 = config?.hero?.copyBlock1 || [
    'Signal over surplus,',
    'Fragments of identity,',
    'Minimal by necessity.'
  ];
  const copyBlock2 = config?.hero?.copyBlock2 || [
    'We design future forms,',
    'Built for the now.'
  ];
  const metaLines = config?.hero?.metaLines || [
    'We create frameworks,',
    'For the unnamed future,',
    'A study in silhouette.'
  ];

  return (
    <div className="page genesis-page-wrapper" ref={pageRef}>
      {/* Fixed Fullscreen Project Zoom Preview (5-column matrix) */}
      {config?.settings?.showSpotlightZoom !== false && (
        <section className="project-preview">
          <div className="project-preview-wrapper">
            <div className="preview-col">
              <div className="preview-img">
                <img src={col1[0] || '/spotlight/spotlight_img_03.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col1[1] || '/spotlight/spotlight_img_06.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col1[2] || '/spotlight/spotlight_img_09.jpg'} alt="" />
              </div>
            </div>
            <div className="preview-col">
              <div className="preview-img">
                <img src={col2[0] || '/spotlight/spotlight_img_01.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col2[1] || '/spotlight/spotlight_img_04.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col2[2] || '/spotlight/spotlight_img_07.jpg'} alt="" />
              </div>
            </div>
            <div className="preview-col main-preview-col">
              <div className="preview-img">
                <img src={col3[0] || '/spotlight/spotlight_img_02.jpg'} alt="" />
              </div>
              <div className="preview-img main-preview-img">
                <img src={col3[1] || '/spotlight/spotlight_img_05.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col3[2] || '/spotlight/spotlight_img_08.jpg'} alt="" />
              </div>
            </div>
            <div className="preview-col">
              <div className="preview-img">
                <img src={col4[0] || '/spotlight/spotlight_img_03.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col4[1] || '/spotlight/spotlight_img_06.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col4[2] || '/spotlight/spotlight_img_09.jpg'} alt="" />
              </div>
            </div>
            <div className="preview-col">
              <div className="preview-img">
                <img src={col5[0] || '/spotlight/spotlight_img_01.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col5[1] || '/spotlight/spotlight_img_04.jpg'} alt="" />
              </div>
              <div className="preview-img">
                <img src={col5[2] || '/spotlight/spotlight_img_07.jpg'} alt="" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Genesis Hero Section */}
      <section className="genesis-hero">
        <div className="gen-hero-img">
          <img src={config?.hero?.image || '/genesis/hero.jpg'} alt="" />
        </div>
        <div className="container">
          <div className="gen-hero-copy">
            <TextMotion animateOnScroll={false} delay={0.7} type="flicker">
              {copyBlock1.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </TextMotion>
          </div>
          <div className="gen-hero-copy">
            <TextMotion animateOnScroll={false} delay={0.8} type="flicker">
              {copyBlock2.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </TextMotion>
          </div>
          <div className="gen-hero-copy">
            <TextMotion animateOnScroll={false} delay={0.7}>
              <h1>{config?.hero?.headline || 'The Genesis behind what you wear'}</h1>
            </TextMotion>
            <div className="gen-hero-meta">
              <div className="gen-hero-meta-block">
                <TextMotion animateOnScroll={false} delay={0.9} type="flicker">
                  {metaLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </TextMotion>
              </div>
              <div className="gen-hero-meta-block">
                <TextMotion animateOnScroll={false} delay={1} type="flicker">
                  <p>{config?.hero?.systemCode || '[ SYS/DRAPZA/0001 ]'}</p>
                </TextMotion>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genesis About Section */}
      <section className="genesis-about">
        <div className="container">
          <div className="genesis-about-logo">
            <GenesisLogo fill={config?.about?.logoFill || '#0f0f0f'} />
          </div>
          <div className="genesis-about-copy">
            <TextMotion>
              <h4>
                {config?.about?.paragraph1 ||
                  'Drapza is built on the belief that clothing should operate like a system. Every piece is engineered with intention, shaped by visual logic and designed for a new kind of uniform. We define motion, structure in silence, presence without noise.'}
              </h4>
            </TextMotion>
            <TextMotion delay={0.5}>
              <h4>
                {config?.about?.paragraph2 ||
                  'Our aesthetic roots lie in the future, not the past. We create garments that behave like interfaces: minimal, intelligent, quietly expressive. Function and form are synchronized, tailored for those who move through digital and physical layers with equal precision. Drapza is not fashion. It is a transmission.'}
              </h4>
            </TextMotion>
          </div>
        </div>
      </section>

      {/* 600vh Whitespace Scrub Trigger */}
      {config?.settings?.showSpotlightZoom !== false && (
        <section className="project-page-whitespace" />
      )}

      {/* Text Block Section */}
      <TextBlock config={config?.textBlock} />

      {/* Global Digifox Contact Form & Footer */}
      {config?.settings?.showContactForm !== false && <ContactForm />}
      {config?.settings?.showFooter !== false && <Footer navigate={navigate} />}
    </div>
  );
};

export default GenesisPage;
