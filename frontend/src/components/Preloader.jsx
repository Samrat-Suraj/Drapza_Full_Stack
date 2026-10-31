'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { markAsLoaded, getIsFirstLoad } from '../utils/loadState';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

export const Preloader = ({ onAnimationComplete, lenis }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      if (isIframe || isPreview || window.location.pathname.startsWith('/admin')) {
        return false;
      }
    }
    return getIsFirstLoad();
  });
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      if (isIframe || isPreview || window.location.pathname.startsWith('/admin')) {
        return false;
      }
    }
    return getIsFirstLoad();
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      const p = window.location.pathname;
      if (isIframe || isPreview || p.startsWith('/admin') || p === '/login' || p === '/join' || p === '/signup') {
        setIsAuth(true);
        setIsVisible(false);
        setIsLocked(false);
        if (lenis) lenis.start();
        document.body.style.overflow = '';
      }
    }
  }, [lenis]);

  // Lock body scroll and stop Lenis during preloader
  useEffect(() => {
    if (isLocked) {
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    } else {
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    }
  }, [lenis, isLocked]);

  useEffect(() => {
    if (!isVisible) return;

    let tl = null;
    let split = null;
    let isCancelled = false;

    const startPreloaderAnimation = () => {
      if (isCancelled) return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const titleEl = wrapper.querySelector('.preloader-logo h1');
      if (!titleEl) return;

      // 1. Split text into characters with mask
      split = SplitText.create(titleEl, {
        type: 'chars',
        charsClass: 'char',
        mask: 'chars'
      });

      gsap.set(split.chars, { x: '110%' });
      gsap.set(titleEl, { opacity: 1 });

      const isMobile = window.innerWidth < 1000;

      tl = gsap.timeline({
        delay: 0.5,
        onComplete: () => {
          setIsLocked(false);
          markAsLoaded();
          if (onAnimationComplete) onAnimationComplete();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('drapza:loaded'));
          }
          setTimeout(() => {
            setIsVisible(false);
          }, 100);
        }
      });

      // 2. Chars slide in (duration: 1s, power4.out, stagger: 0.05s)
      tl.to(split.chars, {
        x: '0%',
        stagger: 0.05,
        ease: 'power4.out',
        duration: 1
      })
      // 3. Progress bar fills with authentic Digifox incremental timeline (e = 4.75s)
      .add(function (e = 4.75) {
        const pTl = gsap.timeline();
        let t = 0;
        for (let s = 0; s < 5; s++) {
          const a = s === 4 ? 1 : Math.min(t + 0.3 * Math.random() + 0.1, 0.9);
          t = a;
          pTl.to('.preloader-progress-bar', {
            scaleX: a,
            duration: e / 5,
            ease: 'power2.out'
          });
        }
        return pTl;
      }(), '<')
      // 4. Progress turns white (difference blend mode inverts text)
      .set('.preloader-progress', { backgroundColor: '#fff' })
      // 5. Chars slide out to left
      .to(
        split.chars,
        {
          x: '-110%',
          stagger: 0.05,
          duration: 1,
          ease: 'power4.out'
        },
        '-=0.5'
      )
      // 6. Fade out progress overlay
      .to(
        '.preloader-progress',
        {
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out'
        },
        '-=0.5'
      )
      // 7. Pill aperture mask scales up to reveal page underneath
      .to(
        '.preloader-mask',
        {
          scale: isMobile ? 25 : 15,
          duration: 1.25,
          ease: 'power3.out'
        },
        '<'
      );
    };

    let hasStarted = false;
    const triggerStart = () => {
      if (hasStarted || isCancelled) return;
      hasStarted = true;
      startPreloaderAnimation();
    };

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(triggerStart);
      setTimeout(triggerStart, 250);
    } else {
      triggerStart();
    }

    return () => {
      isCancelled = true;
      if (tl) tl.kill();
      if (split && split.revert) split.revert();
    };
  }, [isVisible, onAnimationComplete]);

  if (!isVisible || isAuth) return null;

  return (
    <div className="preloader-wrapper" ref={wrapperRef}>
      <div className="preloader-progress">
        <div className="preloader-progress-bar"></div>
        <div className="preloader-logo">
          <h1>DRAPZA</h1>
        </div>
      </div>
      <div className="preloader-mask"></div>
    </div>
  );
};

export default Preloader;
