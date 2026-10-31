'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { TextMotion } from './TextMotion';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const DEFAULT_PEEL_REVEAL_CONFIG = {
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

/**
 * 1:1 Exact Reusable Peel Reveal Section Component
 * Used across Storefront (HomePage) and Admin Live Visual Editor.
 * Features:
 * - Expanding center mask card with 6 repeating mask layers creating echoing depth
 * - Horizontal split intro words ("Signal" & "Motion")
 * - Sequential headline word reveal behind model ("The uniform holds no allegiance")
 * - Interactive Scrub simulation & playback in Admin
 * - Click-to-edit inline content support when isEditable is enabled
 */
export const PeelReveal = ({
  config = {},
  isEditable = false,
  onUpdate = null,
  onImageUpload = null,
  adminProgress = null,
  className = '',
  style = {},
}) => {
  const finalConfig = { ...DEFAULT_PEEL_REVEAL_CONFIG, ...config };
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const splitInstanceRef = useRef(null);

  const modelSrc = normalizeImageUrl(finalConfig.modelImage || '/peel-reveal/peel-reveal-img.jpg');
  const maskSrc = normalizeImageUrl(finalConfig.maskImage || '/peel-reveal/peel-reveal-img-mask.png');
  const maskCount = Math.max(1, Math.min(8, Number(finalConfig.maskLayersCount) || 6));

  const signalText = finalConfig.signalType || 'Signal type: Neutral';
  const moduleText = finalConfig.moduleId || 'Module ID: Nrmlss_001';
  const statusText = finalConfig.status || 'Status: Detached';
  const leftWord = finalConfig.splitWordLeft || 'Signal';
  const rightWord = finalConfig.splitWordRight || 'Motion';
  const headlineText = finalConfig.headline || 'The uniform holds no allegiance';

  // Helper to apply progress transform to DOM elements
  const applyProgressTransforms = (r, root) => {
    if (!root) return;
    const peelReveal = root.querySelector('.peel-reveal');
    if (!peelReveal) return;

    const imgContainer = peelReveal.querySelector('.peel-reveal-img-container');
    const introTexts = Array.from(peelReveal.querySelectorAll('.peel-reveal-intro-text'));
    const masks = Array.from(peelReveal.querySelectorAll('.mask'));
    const wordEls = Array.from(peelReveal.querySelectorAll('.pr-word-span'));
    const headerH1 = peelReveal.querySelector('.peel-reveal-header h1');

    if (!imgContainer) return;

    const progressVal = Math.max(0, Math.min(1, r));

    // 1. Center image container scale (0 -> 1)
    gsap.set(imgContainer, { scale: progressVal });

    // 2. Border radius morph (3rem down to 0rem)
    if (progressVal >= 0.25 && progressVal <= 0.9) {
      const factor = (progressVal - 0.25) / 0.65;
      gsap.set(imgContainer, { borderRadius: `${3 * (1 - factor)}rem` });
    } else if (progressVal < 0.25) {
      gsap.set(imgContainer, { borderRadius: '3rem' });
    } else {
      gsap.set(imgContainer, { borderRadius: '0rem' });
    }

    // 3. Mask layers scale for repetition echo effect
    masks.forEach((maskEl, idx) => {
      const initialScale = 0.9 - 0.2 * idx;
      const factor = Math.min(progressVal / 0.9, 1);
      gsap.set(maskEl, { scale: initialScale + factor * (1 - initialScale) });
    });

    // 4. Intro text ("Signal" and "Motion") splits and moves apart horizontally
    const containerWidth = peelReveal.offsetWidth || 1000;
    const distRatio = (Number(finalConfig.splitDistancePercent) || 55) / 100;
    const distance = isEditable
      ? Math.min(distRatio * containerWidth, containerWidth * 0.42)
      : distRatio * containerWidth;

    if (progressVal <= 0.9) {
      const factor = progressVal / 0.9;
      if (introTexts[0]) gsap.set(introTexts[0], { x: -factor * distance });
      if (introTexts[1]) gsap.set(introTexts[1], { x: factor * distance });
    } else {
      if (introTexts[0]) gsap.set(introTexts[0], { x: -distance });
      if (introTexts[1]) gsap.set(introTexts[1], { x: distance });
    }

    // 5. Header words reveal sequentially
    if (wordEls.length > 0) {
      if (progressVal >= 0.5 && progressVal <= 0.9) {
        const factor = (progressVal - 0.5) / 0.4;
        const total = wordEls.length;
        wordEls.forEach((wordEl, idx) => {
          const start = idx / total;
          const end = (idx + 1) / total;
          let op = 0;
          if (factor >= end) op = 1;
          else if (factor >= start) op = (factor - start) / (end - start);
          gsap.set(wordEl, { opacity: op });
        });
      } else if (progressVal < 0.5) {
        gsap.set(wordEls, { opacity: 0 });
      } else {
        gsap.set(wordEls, { opacity: 1 });
      }
    } else if (headerH1) {
      if (progressVal >= 0.5) {
        gsap.set(headerH1, { opacity: Math.min(1, (progressVal - 0.5) / 0.3) });
      } else {
        gsap.set(headerH1, { opacity: 0 });
      }
    }
  };

  // STOREFRONT MODE: ScrollTrigger attaches to window scroll
  useEffect(() => {
    if (adminProgress !== null || isEditable) return;

    const root = containerRef.current;
    if (!root) return;

    let timer = null;

    const ctx = gsap.context(() => {
      timer = setTimeout(() => {
        const peelReveal = root.querySelector('.peel-reveal');
        if (!peelReveal) return;

        const imgContainer = peelReveal.querySelector('.peel-reveal-img-container');
        const introTexts = Array.from(peelReveal.querySelectorAll('.peel-reveal-intro-text'));
        const masks = Array.from(peelReveal.querySelectorAll('.mask'));
        const headerH1 = peelReveal.querySelector('.peel-reveal-header h1');

        if (!imgContainer || !headerH1) return;

        // Split words
        const splitInstance = new SplitText(headerH1, { type: 'words' });
        splitInstanceRef.current = splitInstance;
        const words = splitInstance.words;
        gsap.set(words, { opacity: 0 });

        masks.forEach((maskEl, idx) => {
          gsap.set(maskEl, { scale: 0.9 - 0.2 * idx });
        });

        gsap.set(imgContainer, { scale: 0 });

        ScrollTrigger.create({
          trigger: peelReveal,
          start: 'top top',
          end: () => `+=${4 * window.innerHeight}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self) => {
            const r = self.progress;

            // 1. Center image container scale (0 -> 1)
            gsap.set(imgContainer, { scale: r });

            // 2. Border radius morph (3rem down to 0rem)
            if (r >= 0.25 && r <= 0.9) {
              const factor = (r - 0.25) / 0.65;
              gsap.set(imgContainer, { borderRadius: `${3 * (1 - factor)}rem` });
            } else if (r < 0.25) {
              gsap.set(imgContainer, { borderRadius: '3rem' });
            } else {
              gsap.set(imgContainer, { borderRadius: '0rem' });
            }

            // 3. Mask layers scale for repetition effect
            masks.forEach((maskEl, idx) => {
              const initialScale = 0.9 - 0.2 * idx;
              const factor = Math.min(r / 0.9, 1);
              gsap.set(maskEl, { scale: initialScale + factor * (1 - initialScale) });
            });

            // 4. Intro text ("Signal" and "Motion") splits and moves apart horizontally
            if (r <= 0.9) {
              const factor = r / 0.9;
              const distance = 0.55 * window.innerWidth;
              if (introTexts[0]) gsap.set(introTexts[0], { x: -factor * distance });
              if (introTexts[1]) gsap.set(introTexts[1], { x: factor * distance });
            }

            // 5. Header words ("The uniform holds no allegiance") reveal sequentially
            if (r >= 0.6 && r <= 0.9) {
              const factor = (r - 0.6) / 0.3;
              const total = words.length;
              words.forEach((wordEl, idx) => {
                const start = idx / total;
                const end = (idx + 1) / total;
                let op = 0;
                if (factor >= end) op = 1;
                else if (factor >= start) op = (factor - start) / (end - start);
                gsap.set(wordEl, { opacity: op });
              });
            } else if (r < 0.6) {
              gsap.set(words, { opacity: 0 });
            } else {
              gsap.set(words, { opacity: 1 });
            }
          },
        });

        ScrollTrigger.refresh();
      }, 500);
    }, root);

    return () => {
      if (timer) clearTimeout(timer);
      if (splitInstanceRef.current && splitInstanceRef.current.revert) {
        splitInstanceRef.current.revert();
      }
      ctx.revert();
    };
  }, [adminProgress, isEditable]);

  // ADMIN MODE: Scrub dynamically using adminProgress
  useEffect(() => {
    if (adminProgress === null && !isEditable) return;
    const root = containerRef.current;
    if (!root) return;

    const currentProgress = typeof adminProgress === 'number' ? adminProgress : 0.85;
    applyProgressTransforms(currentProgress, root);
  }, [
    adminProgress,
    isEditable,
    finalConfig.splitDistancePercent,
    maskCount,
    headlineText,
  ]);

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
          onUpdate({ modelImage: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const wordsList = headlineText.split(' ').filter(Boolean);

  return (
    <div
      className={`peel-reveal-container ${className}`.trim()}
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      <section
        className="peel-reveal"
        style={{
          backgroundColor: finalConfig.backgroundColor || undefined,
          color: finalConfig.textColor || undefined,
          height: isEditable ? '100%' : undefined,
          minHeight: isEditable ? '480px' : undefined,
          isolation: 'isolate',
          position: 'relative',
        }}
      >
        {/* Top Header Telemetry */}
        <div className="section-header" style={{ zIndex: 20 }}>
          {isEditable ? (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('signalType', e)}
              onKeyDown={(e) => handleKeyDown(e, 'signalType')}
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                letterSpacing: '0.12em',
                lineHeight: 1.4,
                color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
              }}
              className="outline-none focus:ring-1 focus:ring-emerald-500 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-2 py-0.5 rounded cursor-text transition-all select-text font-mono text-xs uppercase"
              title="Click directly to edit Signal Type (Press Enter to confirm)"
            >
              {signalText}
            </p>
          ) : (
            <TextMotion type="flicker">
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  letterSpacing: '0.12em',
                  lineHeight: 1.4,
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                }}
              >
                {signalText}
              </p>
            </TextMotion>
          )}

          {isEditable ? (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('moduleId', e)}
              onKeyDown={(e) => handleKeyDown(e, 'moduleId')}
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                letterSpacing: '0.12em',
                lineHeight: 1.4,
                color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
              }}
              className="outline-none focus:ring-1 focus:ring-emerald-500 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-2 py-0.5 rounded cursor-text transition-all select-text font-mono text-xs uppercase text-right"
              title="Click directly to edit Module ID (Press Enter to confirm)"
            >
              {moduleText}
            </p>
          ) : (
            <TextMotion type="flicker">
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  letterSpacing: '0.12em',
                  lineHeight: 1.4,
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                }}
              >
                {moduleText}
              </p>
            </TextMotion>
          )}
        </div>

        {/* Bottom Status Footer */}
        <div className="section-footer" style={{ zIndex: 20 }}>
          {isEditable ? (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('status', e)}
              onKeyDown={(e) => handleKeyDown(e, 'status')}
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                letterSpacing: '0.12em',
                lineHeight: 1.4,
                color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
              }}
              className="outline-none focus:ring-1 focus:ring-emerald-500 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-2 py-0.5 rounded cursor-text transition-all select-text font-mono text-xs uppercase"
              title="Click directly to edit Status (Press Enter to confirm)"
            >
              {statusText}
            </p>
          ) : (
            <TextMotion type="flicker">
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  letterSpacing: '0.12em',
                  lineHeight: 1.4,
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                }}
              >
                {statusText}
              </p>
            </TextMotion>
          )}
        </div>

        {/* Central Expanding Card & Cutout Model */}
        <div
          className="peel-reveal-img-container"
          style={{
            zIndex: 1,
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Admin Quick Photo Replacement Bar */}
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-none border border-neutral-700 shadow-xl text-[10px] font-mono text-white pointer-events-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Replace Peel Reveal Model Image"
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
              <span className="text-emerald-400 font-bold">{maskCount} Mask Layers</span>
            </div>
          )}

          {/* Base Image */}
          <div className="pr-img" style={{ zIndex: 1 }}>
            <img
              src={modelSrc}
              alt="Peel reveal"
              onError={handleImageFallbackError}
            />
          </div>

          {/* Repeating Mask Layers for Depth & Echo-Frame Aesthetic */}
          {[...Array(maskCount)].map((_, idx) => (
            <div
              key={`mask-${idx}`}
              className="pr-img mask"
              style={{
                zIndex: 3,
                WebkitMaskImage: `url(${maskSrc})`,
                maskImage: `url(${maskSrc})`,
              }}
            >
              <img
                src={modelSrc}
                alt=""
                onError={handleImageFallbackError}
              />
            </div>
          ))}

          {/* Headline behind model */}
          <div className="peel-reveal-header" style={{ zIndex: 2 }}>
            {adminProgress !== null ? (
              <h1
                className="select-text"
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: isEditable ? 'clamp(1.8rem, 4.5vw, 3.8rem)' : 'clamp(2.5rem, 6vw, 6rem)',
                  fontWeight: 400,
                  lineHeight: 0.85,
                  letterSpacing: 'clamp(-0.08rem, -0.6vw, -0.18rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: '0 auto',
                }}
              >
                {wordsList.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    className="pr-word-span inline-block mr-[0.25em]"
                    style={{ transition: 'opacity 0.15s ease' }}
                  >
                    {word}
                  </span>
                ))}
              </h1>
            ) : isEditable ? (
              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('headline', e)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') e.currentTarget.blur();
                }}
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(1.8rem, 4.5vw, 3.8rem)',
                  fontWeight: 400,
                  lineHeight: 0.85,
                  letterSpacing: 'clamp(-0.08rem, -0.6vw, -0.18rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: '0 auto',
                }}
                className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-3 py-1 rounded cursor-text transition-all select-text"
                title="Click directly to edit Headline (Press Enter or blur to save)"
              >
                {headlineText}
              </h1>
            ) : (
              <h1
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(2.5rem, 6vw, 6rem)',
                  fontWeight: 400,
                  lineHeight: 0.85,
                  letterSpacing: 'clamp(-0.08rem, -0.6vw, -0.18rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: '0 auto',
                }}
              >
                {headlineText}
              </h1>
            )}
          </div>
        </div>

        {/* Horizontal Split Intro Words */}
        <div className="peel-reveal-intro-text-container">
          <div className="peel-reveal-intro-text">
            {isEditable ? (
              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('splitWordLeft', e)}
                onKeyDown={(e) => handleKeyDown(e, 'splitWordLeft')}
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(3.2rem, 7.5vw, 6.8rem)',
                  fontWeight: 400,
                  lineHeight: 0.8,
                  letterSpacing: 'clamp(-0.15rem, -1vw, -0.25rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
                className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-3 py-1 rounded cursor-text transition-all select-text inline-block"
                title="Click directly to edit Left Split Word"
              >
                {leftWord}
              </h1>
            ) : (
              <h1
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(4rem, 10vw, 10rem)',
                  fontWeight: 400,
                  lineHeight: 0.8,
                  letterSpacing: 'clamp(-0.15rem, -1vw, -0.25rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {leftWord}
              </h1>
            )}
          </div>

          <div className="peel-reveal-intro-text">
            {isEditable ? (
              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('splitWordRight', e)}
                onKeyDown={(e) => handleKeyDown(e, 'splitWordRight')}
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(3.2rem, 7.5vw, 6.8rem)',
                  fontWeight: 400,
                  lineHeight: 0.8,
                  letterSpacing: 'clamp(-0.15rem, -1vw, -0.25rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
                className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-3 py-1 rounded cursor-text transition-all select-text inline-block"
                title="Click directly to edit Right Split Word"
              >
                {rightWord}
              </h1>
            ) : (
              <h1
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(4rem, 10vw, 10rem)',
                  fontWeight: 400,
                  lineHeight: 0.8,
                  letterSpacing: 'clamp(-0.15rem, -1vw, -0.25rem)',
                  textTransform: 'uppercase',
                  color: finalConfig.textColor || 'var(--base-700, #0f0f0f)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {rightWord}
              </h1>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PeelReveal;
