'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import gsap from 'gsap';

const TransitionContext = createContext(null);

export const usePageTransition = () => useContext(TransitionContext);

function UrlTracker({ onUrlChange }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullUrl = `${pathname || ''}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  useEffect(() => {
    onUrlChange(fullUrl);
  }, [fullUrl, onUrlChange]);

  return null;
}

export const PageTransition = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const gridRef = useRef(null);
  const blocksRef = useRef([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);
  const pendingPathRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  // Initialize block scale state without imperative DOM mutation
  useEffect(() => {
    if (blocksRef.current.length > 0) {
      gsap.set(blocksRef.current, { scaleX: 0 });
    }
  }, []);

  // Phase 2: Enter Animation - Reveal the new page when route has mounted
  const animateOut = useCallback(() => {
    const blocks = blocksRef.current;
    if (!blocks || blocks.length === 0) {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      pendingPathRef.current = null;
      return;
    }

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // Scroll to top while still covered by the curtain
    window.scrollTo(0, 0);
    if (typeof window !== 'undefined' && window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }

    // Small frame buffer to allow new page DOM to mount & settle
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined' && window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }

      gsap.killTweensOf(blocks);
      gsap.set(blocks, { scaleX: 1, transformOrigin: 'right' });
      gsap.to(blocks, {
        scaleX: 0,
        duration: 0.45,
        ease: 'power3.out',
        stagger: {
          amount: 0.22,
          from: 'start'
        },
        onComplete: () => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          pendingPathRef.current = null;
          if (typeof window !== 'undefined' && window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
          }
        }
      });
    });
  }, []);

  // When pathname or search params change (Next.js has mounted new route/view)
  const handleUrlChange = useCallback(() => {
    if (isTransitioningRef.current) {
      // Buffer of 60ms ensures complete DOM tree swap before revealing
      const timer = setTimeout(() => {
        animateOut();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [animateOut]);

  // Phase 1: Leave Animation - Curtain wipes in from left to right
  const navigateWithTransition = useCallback((toPath) => {
    if (!toPath) return;
    const currentFull = typeof window !== 'undefined'
      ? (window.location.pathname + window.location.search)
      : (pathname || '');
    if (toPath === currentFull) return;
    if (isTransitioningRef.current) return;

    const cleanTo = toPath.split('?')[0].split('#')[0];
    if (cleanTo.startsWith('/admin') || pathname?.startsWith('/admin')) {
      router.push(toPath);
      return;
    }

    try {
      router.prefetch(toPath);
    } catch (e) {}

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    pendingPathRef.current = cleanTo;

    const blocks = blocksRef.current;
    if (!blocks || blocks.length === 0) {
      router.push(toPath);
      return;
    }

    gsap.killTweensOf(blocks);
    gsap.set(blocks, { scaleX: 0, transformOrigin: 'left' });
    gsap.to(blocks, {
      scaleX: 1,
      duration: 0.4,
      ease: 'power3.inOut',
      stagger: {
        amount: 0.22,
        from: 'start'
      },
      onComplete: () => {
        // Screen is now 100% covered! Push new route in Next.js
        router.push(toPath);

        // Fallback: If route change is delayed or fails, auto-reveal after 2s
        fallbackTimerRef.current = setTimeout(() => {
          if (isTransitioningRef.current) {
            animateOut();
          }
        }, 2000);
      }
    });
  }, [pathname, router, animateOut]);

  // Intercept internal link clicks globally
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.getAttribute('download') !== null ||
        anchor.hasAttribute('data-transition-ignore') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return;
      }

      e.preventDefault();
      navigateWithTransition(href);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [navigateWithTransition]);

  return (
    <TransitionContext.Provider value={{ navigate: navigateWithTransition, isTransitioning }}>
      <Suspense fallback={null}>
        <UrlTracker onUrlChange={handleUrlChange} />
      </Suspense>
      <div
        ref={gridRef}
        className={`transition-grid ${isTransitioning ? 'active' : ''}`}
        style={{
          pointerEvents: isTransitioning ? 'all' : 'none',
          zIndex: 9999
        }}
        suppressHydrationWarning
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <div
            key={r}
            ref={(el) => {
              if (el) blocksRef.current[r] = el;
            }}
            className="transition-block"
            style={{
              width: 'calc(10% + 2px)',
              height: '100%',
              left: `${r * 10}%`,
              top: 0,
              position: 'absolute',
              willChange: 'transform',
            }}
          />
        ))}
      </div>
      {children}
    </TransitionContext.Provider>
  );
};

export default PageTransition;
