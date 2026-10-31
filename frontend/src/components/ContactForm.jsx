'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';
import { newsletterSchema, getZodErrorMessage } from '../lib/validation';

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_CONTACT_CONFIG = {
  isEnabled: true,
  watermarkText: 'DRAPZA',
  imageSrc: '/contact-form/contact-parallax.png',
  headingLine1: 'Transmit',
  headingLine2: 'updates, not',
  headingLine3: 'noise.',
  bodyCopy: 'You’ll only hear from us when something built is worth showing.',
  inputPlaceholder: 'ENTER SIGNAL ADDRESS',
  successMessage: 'Signal frequency received and logged into system buffer.',
  disclaimerText: 'No marketing cycles. Just rare, coded dispatches.',
};

/**
 * 1:1 Modular Transmit Signal / Newsletter Section
 * Shared across Storefront and Admin Visual Editor.
 */
export const ContactForm = ({
  config = {},
  isEditable = false,
  onUpdate = null,
  onImageUpload = null,
  adminProgress = null,
  className = '',
  style = {},
}) => {
  const finalConfig = { ...DEFAULT_CONTACT_CONFIG, ...config };
  const [signal, setSignal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [inputError, setInputError] = useState('');
  const sectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const imgSrc = normalizeImageUrl(finalConfig.imageSrc || '/contact-form/contact-parallax.png');
  const watermark = finalConfig.watermarkText || 'DRAPZA';
  const line1 = finalConfig.headingLine1 || 'Transmit';
  const line2 = finalConfig.headingLine2 || 'updates, not';
  const rawLine3 = finalConfig.headingLine3 || 'noise.';
  const line3 = rawLine3.replace(/noisé/gi, 'noise');
  const copy = finalConfig.bodyCopy || 'You’ll only hear from us when something built is worth showing.';
  const placeholder = finalConfig.inputPlaceholder || 'ENTER SIGNAL ADDRESS';
  const disclaimer = finalConfig.disclaimerText || 'No marketing cycles. Just rare, coded dispatches.';
  const successText = finalConfig.successMessage || 'Signal frequency received and logged into system buffer.';

  // Parallax animation: Storefront uses ScrollTrigger; Admin uses adminProgress scrubber
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const title = section.querySelector('.contact-parallax-image-wrapper h1');
    if (!title) return;

    // Set initial watermark title transform
    gsap.set(title, {
      scale: 5,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: '50% 50%',
    });

    if (adminProgress !== null) {
      // Admin simulation mode
      const p = Math.max(0, Math.min(1, adminProgress));
      gsap.set(title, {
        scale: 5,
        xPercent: -50,
        yPercent: -50,
        y: `${-6 * p}rem`,
      });
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
          gsap.set(title, {
            scale: 5,
            xPercent: -50,
            yPercent: -50,
            y: `${-6 * r}rem`,
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, [adminProgress, isEditable, watermark]);

  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
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
          onUpdate({ imageSrc: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setInputError('');

    const validation = newsletterSchema.safeParse({ email: signal.trim() });
    if (!validation.success) {
      setInputError(getZodErrorMessage(validation.error));
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSignal('');
      setSubmitted(false);
      setInputError('');
    }, 4000);
  };

  return (
    <section
      className={`contact-form ${className}`.trim()}
      id="signal"
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="contact-parallax-image-wrapper relative">
        <h1
          style={{
            fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
            textTransform: 'uppercase',
            fontWeight: 400,
            letterSpacing: 'clamp(-0.15rem, -1vw, -0.25rem)',
            fontSize: 'clamp(4rem, 10vw, 10rem)',
            lineHeight: 0.8,
            whiteSpace: 'nowrap',
            color: 'var(--base-400)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(5)',
            transformOrigin: '50% 50%',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {watermark}
        </h1>
        <img
          src={imgSrc}
          alt="DRAPZA Outerwear Models"
          loading="eager"
          onError={handleImageFallbackError}
        />

        {/* Admin Quick Photo Replacement Bar */}
        {isEditable && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-none border border-neutral-700 shadow-xl text-[10px] font-mono text-white pointer-events-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Replace Transmit Models Banner Photo"
            >
              <span>📷 Replace Models Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      <form className="contact-form-container" onSubmit={handleSubmit} noValidate>
        <div className="cf-header">
          {isEditable ? (
            <h4
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const val = e.currentTarget.textContent?.trim() || '';
                if (onUpdate) onUpdate({ headingLine1: val, headingLine2: '', headingLine3: '' });
              }}
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 0.92,
              }}
              className="outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 p-1 rounded cursor-text transition-all select-text pointer-events-auto"
              title="Click directly to edit Newsletter Headline"
            >
              {line1} {line2} {line3}
            </h4>
          ) : (
            <h4
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 0.92,
              }}
            >
              {line1}
              <br />
              {line2}
              <br />
              {line3}
            </h4>
          )}
        </div>

        <div className="cf-copy">
          {isEditable ? (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('bodyCopy', e)}
              className="bodyCopy sm outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 p-1 rounded cursor-text transition-all select-text pointer-events-auto"
              title="Click directly to edit Subtext"
            >
              {copy}
            </p>
          ) : (
            <p className="bodyCopy sm">
              {submitted ? successText : copy}
            </p>
          )}
        </div>

        <div className="cf-input-group">
          <div className="cf-input-wrapper">
            <input
              type="email"
              placeholder={submitted ? 'SIGNAL TRANSMITTED.' : placeholder}
              value={signal}
              onChange={(e) => {
                setSignal(e.target.value);
                if (inputError) setInputError('');
              }}
              disabled={submitted || isEditable}
              aria-label="Enter signal address"
            />
            <button
              type="submit"
              className={`cf-submit ${submitted ? 'submitted' : ''}`}
              aria-label="Submit Signal Address"
              disabled={submitted}
            >
              {submitted ? (
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>
                </svg>
              ) : (
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6z"></path>
                </svg>
              )}
            </button>
          </div>
          {inputError && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.72rem',
              fontFamily: "var(--font-dm-mono), monospace",
              marginTop: '0.35rem',
              letterSpacing: '0.02em',
              textAlign: 'left',
              width: '100%',
            }}>
              {inputError}
            </p>
          )}
        </div>

        <div className="cf-footer">
          <div className="cf-divider"></div>
          <div className="cf-footer-copy">
            {isEditable ? (
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('disclaimerText', e)}
                className="bodyCopy sm outline-none focus:ring-1 focus:ring-emerald-400 hover:outline-dashed hover:outline-1 hover:outline-white/40 p-1 rounded cursor-text transition-all select-text pointer-events-auto"
                title="Click directly to edit Disclaimer"
              >
                {disclaimer}
              </p>
            ) : (
              <p className="bodyCopy sm">{disclaimer}</p>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

export default ContactForm;
