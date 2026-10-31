'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DotMatrixHero } from './DotMatrixHero';
import { TextMotion } from './TextMotion';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_HERO_CONFIG = {
  headlineLine1: 'Silhouettes for',
  headlineLine2: 'the Next Era',
  modelImage: '/home/hero.png',
  modelAlt: 'Silhouettes for the Next Era',
  modelScale: 100,
  modelOffsetX: 0,
  modelOffsetY: 0,
  modelOpacity: 100,
  modelShadow: false,
  telemetryTag1: 'Void Index',
  telemetryTag2: 'Model v.23',
  ctaButtonText: 'SCROLL',
};

/**
 * 1:1 Exact Modular Hero Component
 * Used across Storefront (HomePage) and Admin Live Visual Editor.
 */
export function Hero({
  config = {},
  isEditable = false,
  onUpdate = null,
  firstVisit = false,
  onLoaded = null,
  className = '',
  style = {},
  animateOnScroll = true,
}) {
  const finalConfig = { ...DEFAULT_HERO_CONFIG, ...config };

  const heroRef = useRef(null);
  const heroImgRef = useRef(null);
  const heroHeaderRef = useRef(null);

  // Exact hero entrance animation and header parallax for storefront
  useEffect(() => {
    if (isEditable) return;

    const hero = heroRef.current;
    const heroImg = heroImgRef.current;
    const header = heroHeaderRef.current;
    if (!hero || !heroImg || !header) return;

    const ctx = gsap.context(() => {
      // 1. Initial position & entrance
      gsap.set(heroImg, { y: 1000 });
      gsap.to(heroImg, {
        y: 0,
        duration: 0.75,
        ease: 'power3.out',
        delay: firstVisit ? 5.75 : 1,
        onComplete: () => {
          if (onLoaded) onLoaded();
        },
      });

      // 2. Hero header parallax on scroll down
      if (animateOnScroll) {
        gsap.to(header, {
          y: 150,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, hero);

    return () => ctx.revert();
  }, [firstVisit, isEditable, animateOnScroll, onLoaded]);

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
  };

  const modelTransform =
    (finalConfig.modelScale && finalConfig.modelScale !== 100) ||
    finalConfig.modelOffsetX ||
    finalConfig.modelOffsetY
      ? `scale(${(finalConfig.modelScale || 100) / 100}) translate(${finalConfig.modelOffsetX || 0}px, ${finalConfig.modelOffsetY || 0}px)`
      : undefined;

  const modelOpacity =
    finalConfig.modelOpacity !== undefined && finalConfig.modelOpacity !== 100
      ? finalConfig.modelOpacity / 100
      : undefined;

  const modelFilter = finalConfig.modelShadow
    ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.18))'
    : undefined;

  return (
    <section
      ref={heroRef}
      className={`hero relative w-full h-[100svh] overflow-hidden select-none isolate z-0 ${className}`.trim()}
      style={style}
    >
      {/* WebGL Dot Matrix Canvas */}
      <DotMatrixHero
        color="#969992"
        dotSize={2}
        spacing={5}
        opacity={0.9}
        delay={isEditable ? 0 : firstVisit ? 6 : 1.125}
      />

      {/* Giant Koulen Headline (Layered behind model image) */}
      <div className="container w-full max-w-[2000px] h-full mx-auto px-4 sm:px-6 md:px-8">
        <div
          className={`hero-header absolute top-[24svh] md:top-[20svh] inset-x-0 mx-auto w-full max-w-[1600px] px-4 text-center will-change-transform z-[1] ${
            isEditable ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{ left: 0, right: 0, transform: 'none', margin: '0 auto' }}
          ref={heroHeaderRef}
        >
          {isEditable ? (
            <h1 className="font-koulen font-normal uppercase leading-[0.88] tracking-tight text-[clamp(2.8rem,8vw,9.5rem)] text-base-700 m-0 text-center select-none">
              <span
                key={`hl1-${finalConfig.headlineLine1}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('headlineLine1', e)}
                className="outline-none focus:ring-1 focus:ring-black/30 hover:bg-black/5 px-2 py-0.5 rounded cursor-text transition-all inline-block"
                title="Click directly to edit Headline Line 1"
              >
                {finalConfig.headlineLine1 || 'Silhouettes for'}
              </span>{' '}
              <span
                key={`hl2-${finalConfig.headlineLine2}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('headlineLine2', e)}
                className="outline-none focus:ring-1 focus:ring-black/30 hover:bg-black/5 px-2 py-0.5 rounded cursor-text transition-all inline-block"
                title="Click directly to edit Headline Line 2"
              >
                {finalConfig.headlineLine2 || 'the Next Era'}
              </span>
            </h1>
          ) : (
            <TextMotion
              key={`${finalConfig.headlineLine1 || 'SILHOUETTES FOR'}-${finalConfig.headlineLine2 || 'THE NEXT ERA'}`}
              animateOnScroll={false}
              delay={firstVisit ? 5.5 : 0.65}
            >
              <h1 className="font-koulen font-normal uppercase leading-[0.88] tracking-tight text-[clamp(2.8rem,8vw,9.5rem)] text-base-700 m-0 text-center select-none">
                {finalConfig.headlineLine1 || 'Silhouettes for'}{' '}
                {finalConfig.headlineLine2 || 'the Next Era'}
              </h1>
            </TextMotion>
          )}
        </div>
      </div>

      {/* Center Model Image (Layered in front of headline, behind navbar) */}
      <div
        className="hero-img absolute bottom-0 top-auto md:top-[35svh] md:bottom-auto inset-x-0 w-full h-[52svh] md:h-full flex items-end md:items-start justify-center will-change-[transform,opacity] z-[2] pointer-events-none overflow-hidden md:overflow-visible"
        style={{ left: 0, right: 0 }}
        ref={heroImgRef}
      >
        <img
          src={normalizeImageUrl(finalConfig.modelImage || '/home/hero.png')}
          alt={
            finalConfig.modelAlt ||
            `${finalConfig.headlineLine1 || 'Silhouettes'} ${finalConfig.headlineLine2 || 'for the Next Era'}`
          }
          onError={handleImageFallbackError}
          className="w-auto h-full max-h-full md:max-h-none object-contain object-bottom md:object-center pointer-events-auto transition-transform duration-300"
          style={{
            transform: modelTransform,
            opacity: modelOpacity,
            filter: modelFilter,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        />
      </div>

      {/* Section Footer: Telemetry Tags & Scroll Down Button */}
      <div
        className="section-footer absolute bottom-0 inset-x-0 mx-auto w-full max-w-[2000px] p-6 sm:p-8 md:p-[2.125rem] flex items-center justify-between z-[3] pointer-events-none"
        style={{ left: 0, right: 0, transform: 'none', margin: '0 auto' }}
      >
        {isEditable ? (
          <p
            key={`t1-${finalConfig.telemetryTag1}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('telemetryTag1', e)}
            className="font-mono text-xs sm:text-[0.8rem] tracking-widest uppercase text-base-700 m-0 outline-none focus:ring-1 focus:ring-black/30 hover:bg-black/5 px-2 py-0.5 rounded cursor-text transition-all pointer-events-auto select-none"
            title="Click directly to edit Left Telemetry Tag"
          >
            {finalConfig.telemetryTag1 || 'Void Index'}
          </p>
        ) : (
          <TextMotion
            key={`telemetry1-${finalConfig.telemetryTag1 || 'Void Index'}`}
            type="flicker"
            delay={firstVisit ? 7.5 : 0.65}
            animateOnScroll={false}
          >
            <p className="font-mono text-xs sm:text-[0.8rem] tracking-widest uppercase text-base-700 m-0 pointer-events-auto select-none">
              {finalConfig.telemetryTag1 || 'Void Index'}
            </p>
          </TextMotion>
        )}

        <button
          type="button"
          className="hero-center-scroll-btn pointer-events-auto inline-flex items-center gap-[0.45rem] px-[0.95rem] py-[0.35rem] rounded-full bg-[rgba(15,15,15,0.06)] hover:bg-base-700 border border-[rgba(15,15,15,0.16)] hover:border-base-700 text-base-700 hover:text-base-100 font-mono text-[0.72rem] font-medium tracking-[0.14em] uppercase transition-all duration-200 ease-out backdrop-blur-[4px] z-20 whitespace-nowrap cursor-pointer hover:translate-y-[2px]"
          aria-label="Scroll down to collection"
          onClick={(e) => {
            e.preventDefault();
            if (isEditable) return;
            const target =
              document.querySelector('.about') || document.querySelector('.featured-products');
            if (target) {
              if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                window.lenis.scrollTo(target, { duration: 1.2 });
              } else {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            } else {
              window.scrollTo({ top: window.innerHeight || 800, behavior: 'smooth' });
            }
          }}
        >
          {isEditable ? (
            <span
              key={`cta-${finalConfig.ctaButtonText}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('ctaButtonText', e)}
              className="outline-none focus:ring-1 focus:ring-black/30 hover:bg-black/5 px-1 py-0.5 rounded cursor-text transition-all"
              title="Click directly to edit Scroll Button Text"
            >
              {finalConfig.ctaButtonText || 'SCROLL'}
            </span>
          ) : (
            <span>{finalConfig.ctaButtonText || 'SCROLL'}</span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>

        {isEditable ? (
          <p
            key={`t2-${finalConfig.telemetryTag2}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('telemetryTag2', e)}
            className="font-mono text-xs sm:text-[0.8rem] tracking-widest uppercase text-base-700 m-0 outline-none focus:ring-1 focus:ring-black/30 hover:bg-black/5 px-2 py-0.5 rounded cursor-text transition-all pointer-events-auto select-none"
            title="Click directly to edit Right Telemetry Tag"
          >
            {finalConfig.telemetryTag2 || 'Model v.23'}
          </p>
        ) : (
          <TextMotion
            key={`telemetry2-${finalConfig.telemetryTag2 || 'Model v.23'}`}
            type="flicker"
            delay={firstVisit ? 7.5 : 0.65}
            animateOnScroll={false}
          >
            <p className="font-mono text-xs sm:text-[0.8rem] tracking-widest uppercase text-base-700 m-0 pointer-events-auto select-none">
              {finalConfig.telemetryTag2 || 'Model v.23'}
            </p>
          </TextMotion>
        )}
      </div>
    </section>
  );
}

export default Hero;
