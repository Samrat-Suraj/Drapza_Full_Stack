'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextMotion } from './TextMotion';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_CTA_CONFIG = {
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

/**
 * 1:1 Modular CTA Silhouettes Section
 * Shared across Storefront and Admin Editor with full live controls.
 */
export function CtaSection({
  config = {},
  navigate = null,
  isEditable = false,
  onUpdate = null,
  onImageUpload = null,
  adminProgress = null,
  className = '',
  style = {},
}) {
  const finalConfig = { ...DEFAULT_CTA_CONFIG, ...config };
  const sectionRef = useRef(null);
  const leftFileInputRef = useRef(null);
  const centerFileInputRef = useRef(null);
  const rightFileInputRef = useRef(null);

  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const img1 = finalConfig.image1 || finalConfig.leftImage || '/cta/cta_img_01.jpg';
  const img2 = finalConfig.image2 || finalConfig.centerImage || '/cta/cta_img_02.jpg';
  const img3 = finalConfig.image3 || finalConfig.rightImage || '/cta/cta_img_03.jpg';

  const copy = finalConfig.copyText || finalConfig.editorialText || 'Built to exist outside context, these forms prioritize neutrality, and distortion.';

  // Parallax animation: Storefront uses ScrollTrigger; Admin uses adminProgress scrubber
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const leftImg = section.querySelector('.cta-col:first-child .cta-side-img');
    const rightImg = section.querySelector('.cta-col:nth-child(3) .cta-side-img');

    if (adminProgress !== null) {
      // Admin Scrub Simulation Mode
      const p = Math.max(0, Math.min(1, adminProgress));
      if (leftImg) gsap.set(leftImg, { y: `${(1 - p) * 15}rem` });
      if (rightImg) gsap.set(rightImg, { y: `${-p * 15}rem` });
      return;
    }

    if (isEditable) return;

    // Storefront ScrollTrigger mode
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          const r = self.progress;
          if (leftImg) gsap.set(leftImg, { y: `${(1 - r) * 15}rem` });
          if (rightImg) gsap.set(rightImg, { y: `${-r * 15}rem` });
        },
      });
    }, section);

    return () => ctx.revert();
  }, [adminProgress, isEditable]);

  const handleNav = (path, e) => {
    if (e) e.preventDefault();
    if (isEditable) return;
    if (navigate) navigate(path);
  };

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onImageUpload) {
      onImageUpload(field, e);
    } else if (onUpdate) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdate({ [field]: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const line1 = finalConfig.headingLine1 || 'A FIELD TEST IN';
  const line2 = finalConfig.headingLine2 || 'SILHOUETTES';
  const line3 = finalConfig.headingLine3 || '';

  return (
    <section
      className={`cta ${className}`.trim()}
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        isolation: 'isolate',
        ...style,
      }}
    >
      <div className="container">
        {/* Left Column: Image 1 & Editorial Note */}
        <div className="cta-col">
          <div className="cta-side-img relative group">
            <img
              src={normalizeImageUrl(img1)}
              alt="Silhouettes 1"
              onError={handleImageFallbackError}
              className="w-full h-full object-cover rounded-xl"
            />
            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto">
                <button
                  type="button"
                  onClick={() => leftFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-black/90 text-white font-mono text-[10px] tracking-widest uppercase border border-neutral-700 hover:text-cyan-400 cursor-pointer shadow-lg"
                >
                  📷 Left Photo
                </button>
                <input
                  ref={leftFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('leftImage', e)}
                />
              </div>
            )}
          </div>
          <div className="cta-col-copy">
            {isEditable ? (
              <p
                key={`cta-copy-${copy}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('copyText', e)}
                style={{
                  fontFamily: "var(--font-host-grotesk), sans-serif",
                  color: 'var(--base-500, #7d807a)',
                  lineHeight: 1.5,
                }}
                className="bodyCopy sm outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 p-2 rounded cursor-text transition-all pointer-events-auto"
                title="Click directly to edit Left Editorial Note"
              >
                {copy}
              </p>
            ) : (
              <TextMotion type="slide">
                <p className="bodyCopy sm" style={{ color: 'var(--base-500, #7d807a)' }}>
                  {copy}
                </p>
              </TextMotion>
            )}
          </div>
        </div>

        {/* Center Column: Big Header & Main Image */}
        <div className="cta-col">
          <div className="cta-header">
            {isEditable ? (
              <h3
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const val = e.currentTarget.textContent?.trim() || '';
                  if (onUpdate) onUpdate({ headerText: val });
                }}
                style={{
                  fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                  fontSize: 'clamp(2.5rem, 6.5vw, 6rem)',
                  lineHeight: 0.85,
                  letterSpacing: 'clamp(-0.1rem, -0.8vw, -0.22rem)',
                  textTransform: 'uppercase',
                  fontWeight: 400,
                  color: 'var(--base-700, #0f0f0f)',
                  margin: 0,
                  textAlign: 'center',
                }}
                className="outline-none focus:ring-2 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-black/40 px-3 py-1 rounded cursor-text transition-all select-text pointer-events-auto"
                title="Click directly to edit CTA Header"
              >
                {finalConfig.headerText || `${line1} ${line2} ${line3}`.trim()}
              </h3>
            ) : (
              <TextMotion type="slide">
                <h3
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    fontSize: 'clamp(2.5rem, 6.5vw, 6rem)',
                    lineHeight: 0.85,
                    letterSpacing: 'clamp(-0.1rem, -0.8vw, -0.22rem)',
                    textTransform: 'uppercase',
                    fontWeight: 400,
                    color: 'var(--base-700, #0f0f0f)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  {finalConfig.headerText ? (
                    finalConfig.headerText
                  ) : (
                    <>
                      {line1}
                      <br />
                      {line2}
                      {line3 && (
                        <>
                          <br />
                          {line3}
                        </>
                      )}
                    </>
                  )}
                </h3>
              </TextMotion>
            )}
          </div>

          <div className="cta-main-img relative group">
            <img
              src={normalizeImageUrl(img2)}
              alt="Silhouettes Main"
              onError={handleImageFallbackError}
              className="w-full h-full object-cover rounded-xl"
            />
            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto">
                <button
                  type="button"
                  onClick={() => centerFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-black/90 text-white font-mono text-xs tracking-widest uppercase border border-neutral-700 hover:text-cyan-400 cursor-pointer shadow-lg font-bold"
                >
                  📷 Center Main Photo
                </button>
                <input
                  ref={centerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('centerImage', e)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Image 3 */}
        <div className="cta-col">
          <div className="cta-side-img relative group">
            <img
              src={normalizeImageUrl(img3)}
              alt="Silhouettes 3"
              onError={handleImageFallbackError}
              className="w-full h-full object-cover rounded-xl"
            />
            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto">
                <button
                  type="button"
                  onClick={() => rightFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-black/90 text-white font-mono text-[10px] tracking-widest uppercase border border-neutral-700 hover:text-cyan-400 cursor-pointer shadow-lg"
                >
                  📷 Right Photo
                </button>
                <input
                  ref={rightFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('rightImage', e)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Button Banner */}
      <div className="container">
        <div className="cta-main-copy">
          <div className="btn">
            {isEditable ? (
              <span
                key={`cta-btn-${finalConfig.buttonText}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('buttonText', e)}
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
                className="outline-none focus:ring-1 focus:ring-black/40 hover:bg-black/5 px-4 py-2 rounded cursor-text transition-all pointer-events-auto inline-block font-mono uppercase"
                title="Click directly to edit Button Text"
              >
                {finalConfig.buttonText || 'Enter Wardrobe'}
              </span>
            ) : (
              <a
                href={finalConfig.buttonUrl || '/wardrobe'}
                onClick={(e) => handleNav(finalConfig.buttonUrl || '/wardrobe', e)}
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {finalConfig.buttonText || 'Enter Wardrobe'}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
