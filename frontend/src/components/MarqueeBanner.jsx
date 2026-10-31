'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextMotion } from './TextMotion';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_MARQUEE_CONFIG = {
  isEnabled: true,
  marqueeHeader1: 'Transmission lost in neutral space',
  marqueeHeader2: 'Synthetic forms archive the signal',
  tag: '[ Frame Shift ]',
  headline: 'Modular silence across systems',
  cardImage: '/marquee-banner/marquee_banner_01.png',
  cardImageAlt: 'Marquee banner',
  cardImageOffsetY: -120,
  cardImageOffsetX: 0,
  cardImageScale: 100,
  brandLogoText: 'DRAPZA',
  animationSpeed: 20,
  animationDirection: 'normal',
  backgroundColor: '#edf1e8',
  cardBackgroundColor: '#0f0f0f',
  textColor: '#c4c8bf',
};

/**
 * 1:1 Exact Reusable Marquee Banner Component
 * Used across Storefront (HomePage) and Admin Live Visual Editor.
 * Features:
 * - Real kinetic continuous ticker animation with live play/pause, speed, and direction controls
 * - 1:1 Streetwear architectural depth layering (Tag/Headline behind -> 3D Cutout Model in front -> Brand Logo on top)
 * - Click-to-edit inline content support when isEditable is enabled
 */
export function MarqueeBanner({
  config = {},
  isEditable = false,
  onUpdate = null,
  onImageUpload = null,
  className = '',
  style = {},
  animateOnScroll = true,
  adminPreviewAnimation = false,
  motionMode = 'scroll', // 'scroll' (scroll-triggered scrub) | 'continuous' (auto-loop ticker)
  scrollProgress = null, // manual scrub override from slider in admin (0 to 1)
  onScrollProgressChange = null,
  triggerKey = 0, // increment to replay scroll trigger animation preview
  animationPlaying = true,
  animationSpeed = 20,
  animationDirection = 'normal',
}) {
  const finalConfig = { ...DEFAULT_MARQUEE_CONFIG, ...config };

  const sectionRef = useRef(null);
  const marquee1Ref = useRef(null);
  const marquee2Ref = useRef(null);
  const tagRef = useRef(null);
  const headlineRef = useRef(null);
  const logoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Speed and direction calculations
  const effectiveSpeed = Number(finalConfig.animationSpeed || animationSpeed || 20);
  const effectiveDirection = finalConfig.animationDirection || animationDirection || 'normal';
  const isKineticMode = motionMode === 'continuous';
  const isScrollTriggered = motionMode === 'scroll' || (animateOnScroll && !adminPreviewAnimation);

  // GSAP ScrollTrigger for background tickers & text entrance trigger
  useEffect(() => {
    if (!isScrollTriggered) return;

    const section = sectionRef.current;
    const m1 = marquee1Ref.current;
    const m2 = marquee2Ref.current;
    const tagEl = tagRef.current;
    const headlineEl = headlineRef.current;
    const logoEl = logoRef.current;

    if (!section || !m1 || !m2) return;

    // Refresh ScrollTrigger so layout coordinates are perfectly calibrated
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const dir = effectiveDirection === 'reverse' ? -1 : 1;

    const ctx = gsap.context(() => {
      // 1. Scrub background marquee tickers as you scroll
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          const r = self.progress;
          if (onScrollProgressChange) {
            onScrollProgressChange(r);
          }
          gsap.set(m1, { x: `${(25 - 50 * r) * dir}%` });
          gsap.set(m2, { x: `${(-25 + 50 * r) * dir}%` });
        },
      });

      // 2. Trigger headline text entrance animation when scrolling into view
      if (headlineEl) {
        gsap.fromTo(
          headlineEl,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 3. Trigger tag text entrance animation
      if (tagEl) {
        gsap.fromTo(
          tagEl,
          { opacity: 0, letterSpacing: '0.25em' },
          {
            opacity: 1,
            letterSpacing: '0.05em',
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 4. Trigger brand logo entrance animation
      if (logoEl) {
        gsap.fromTo(
          logoEl,
          { scale: 0.85, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, section);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [
    isScrollTriggered,
    effectiveDirection,
    triggerKey,
    finalConfig.marqueeHeader1,
    finalConfig.marqueeHeader2,
    finalConfig.headline,
    finalConfig.tag,
  ]);

  // Handle manual scrub override from slider in admin
  useEffect(() => {
    if (typeof scrollProgress === 'number' && isScrollTriggered) {
      const m1 = marquee1Ref.current;
      const m2 = marquee2Ref.current;
      if (!m1 || !m2) return;
      const dir = effectiveDirection === 'reverse' ? -1 : 1;
      gsap.set(m1, { x: `${(25 - 50 * scrollProgress) * dir}%` });
      gsap.set(m2, { x: `${(-25 + 50 * scrollProgress) * dir}%` });
    }
  }, [scrollProgress, isScrollTriggered, effectiveDirection]);

  // Don't render on storefront if disabled
  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onImageUpload) {
      onImageUpload(e);
    } else if (onUpdate) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdate({ cardImage: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentScale = finalConfig.cardImageScale ?? 100;
  const currentOffsetY = finalConfig.cardImageOffsetY ?? -120;
  const currentOffsetX = finalConfig.cardImageOffsetX ?? 0;

  const imageOffsetY = `${currentOffsetY}px`;
  const imageOffsetX = `${currentOffsetX}px`;
  const imageScaleTransform = `scale(${currentScale / 100}) translate(${imageOffsetX}, 0)`;

  // Direction animation classes
  const m1AnimClass = isKineticMode
    ? effectiveDirection === 'reverse'
      ? 'marquee-kinetic-right'
      : 'marquee-kinetic-left'
    : '';

  const m2AnimClass = isKineticMode
    ? effectiveDirection === 'reverse'
      ? 'marquee-kinetic-left'
      : 'marquee-kinetic-right'
    : '';

  const ticker1Text = finalConfig.marqueeHeader1 || 'Transmission lost in neutral space';
  const ticker2Text = finalConfig.marqueeHeader2 || 'Synthetic forms archive the signal';

  return (
    <section
      ref={sectionRef}
      className={`marquee-banner ${className}`.trim()}
      style={{
        '--model-offset-y': imageOffsetY,
        '--model-scale': imageScaleTransform,
        '--marquee-speed': `${effectiveSpeed}s`,
        '--marquee-play-state': animationPlaying ? 'running' : 'paused',
        backgroundColor: finalConfig.backgroundColor || undefined,
        ...style,
      }}
    >
      {/* Background Kinetic Tickers */}
      <div className="marquees">
        <div
          className={`marquee-header marquee-header-1 ${m1AnimClass}`.trim()}
          ref={marquee1Ref}
          style={{
            animationDuration: `${effectiveSpeed}s`,
            animationPlayState: animationPlaying ? 'running' : 'paused',
            color: finalConfig.textColor || undefined,
          }}
        >
          {isEditable ? (
            <div className="flex items-center whitespace-nowrap">
              <h1
                key={`m1-${ticker1Text}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('marqueeHeader1', e)}
                onKeyDown={(e) => handleKeyDown(e, 'marqueeHeader1')}
                className="outline-none focus:ring-2 focus:ring-emerald-500 hover:outline-dashed hover:outline-1 hover:outline-neutral-500 px-3 py-1 rounded cursor-text transition-all pointer-events-auto select-text inline-block"
                title="Click directly to edit Top Ticker (Press Enter to confirm)"
              >
                {ticker1Text}
              </h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
            </div>
          ) : (
            <div className="flex items-center whitespace-nowrap">
              <h1 className="inline-block">{ticker1Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker1Text}</h1>
            </div>
          )}
        </div>

        <div
          className={`marquee-header marquee-header-2 ${m2AnimClass}`.trim()}
          ref={marquee2Ref}
          style={{
            animationDuration: `${effectiveSpeed}s`,
            animationPlayState: animationPlaying ? 'running' : 'paused',
            color: finalConfig.textColor || undefined,
          }}
        >
          {isEditable ? (
            <div className="flex items-center whitespace-nowrap">
              <h1
                key={`m2-${ticker2Text}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('marqueeHeader2', e)}
                onKeyDown={(e) => handleKeyDown(e, 'marqueeHeader2')}
                className="outline-none focus:ring-2 focus:ring-emerald-500 hover:outline-dashed hover:outline-1 hover:outline-neutral-500 px-3 py-1 rounded cursor-text transition-all pointer-events-auto select-text inline-block"
                title="Click directly to edit Bottom Ticker (Press Enter to confirm)"
              >
                {ticker2Text}
              </h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
            </div>
          ) : (
            <div className="flex items-center whitespace-nowrap">
              <h1 className="inline-block">{ticker2Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
              <span className="inline-block px-8 opacity-30 select-none">•</span>
              <h1 className="inline-block">{ticker2Text}</h1>
            </div>
          )}
        </div>
      </div>

      {/* Center Black Card */}
      <div
        className={`banner ${isEditable ? 'pointer-events-auto relative group' : ''}`.trim()}
        style={{
          backgroundColor: finalConfig.cardBackgroundColor || undefined,
        }}
      >
        {/* On-canvas Quick Control Overlay in Admin Mode */}
        {isEditable && (
          <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded border border-neutral-700 shadow-lg text-[10px] font-mono text-white">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to replace Model Image"
            >
              <span>Replace Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-neutral-600">|</span>
            <button
              type="button"
              onClick={() => onUpdate && onUpdate({ cardImageScale: Math.max(50, currentScale - 5) })}
              className="px-1 hover:text-emerald-400 font-bold cursor-pointer"
              title="Zoom Out Model"
            >
              -
            </button>
            <span className="text-emerald-400 font-bold">{currentScale}%</span>
            <button
              type="button"
              onClick={() => onUpdate && onUpdate({ cardImageScale: Math.min(160, currentScale + 5) })}
              className="px-1 hover:text-emerald-400 font-bold cursor-pointer"
              title="Zoom In Model"
            >
              +
            </button>
          </div>
        )}

        {/* Layer 1 (Background): Tag & Giant Headline */}
        <div className="banner-content">
          {finalConfig.tag &&
            (isEditable ? (
              <p
                ref={tagRef}
                key={`tag-${finalConfig.tag}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('tag', e)}
                onKeyDown={(e) => handleKeyDown(e, 'tag')}
                className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 px-2 py-0.5 rounded cursor-text transition-all select-text"
                title="Click directly to edit Frame Shift Tag (Press Enter to confirm)"
              >
                {finalConfig.tag}
              </p>
            ) : (
              <TextMotion type="flicker">
                <p>{finalConfig.tag}</p>
              </TextMotion>
            ))}

          {isEditable ? (
            <h4
              ref={headlineRef}
              key={`hl-${finalConfig.headline}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('headline', e)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') e.currentTarget.blur();
              }}
              className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 px-3 py-1 rounded cursor-text transition-all select-text"
              title="Click directly to edit Headline"
            >
              {finalConfig.headline || 'Modular silence across systems'}
            </h4>
          ) : (
            <TextMotion type="slide" delay={0.2}>
              <h4>{finalConfig.headline || 'Modular silence across systems'}</h4>
            </TextMotion>
          )}
        </div>

        {/* Layer 2 (Middle): Cutout Model sitting IN FRONT of headline and tag */}
        <div
          className="banner-img"
          style={{
            bottom: imageOffsetY,
            left: imageOffsetX,
            '--model-offset-y': imageOffsetY,
          }}
        >
          <img
            src={normalizeImageUrl(finalConfig.cardImage || '/marquee-banner/marquee_banner_01.png')}
            alt={finalConfig.cardImageAlt || 'Marquee banner'}
            onError={handleImageFallbackError}
            style={{
              transform: imageScaleTransform,
              '--model-scale': imageScaleTransform,
              transition: 'transform 0.2s ease, bottom 0.2s ease',
            }}
          />
        </div>

        {/* Layer 3 (Foreground): DRAPZA Logo sitting ON TOP of model jacket */}
        <div className="banner-logo">
          {isEditable ? (
            <h5
              ref={logoRef}
              key={`logo-${finalConfig.brandLogoText}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('brandLogoText', e)}
              onKeyDown={(e) => handleKeyDown(e, 'brandLogoText')}
              className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 px-2 py-0.5 rounded cursor-text transition-all select-text"
              title="Click directly to edit Brand Logo text (Press Enter to confirm)"
            >
              {finalConfig.brandLogoText || 'DRAPZA'}
            </h5>
          ) : (
            <h5>{finalConfig.brandLogoText || 'DRAPZA'}</h5>
          )}
        </div>
      </div>
    </section>
  );
}

export default MarqueeBanner;
