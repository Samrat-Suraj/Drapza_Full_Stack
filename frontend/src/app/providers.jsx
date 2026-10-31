'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ReduxProvider } from '../redux/ReduxProvider';
import { PageTransition } from '../components/PageTransition';
import Preloader from '../components/Preloader';
import { getIsFirstLoad, markAsLoaded } from '../utils/loadState';

const Navigation = dynamic(
  () =>
    import('../components/Navigation')
      .then((m) => m.Navigation || m.default)
      .catch((err) => {
        console.warn('Recovering from Navigation chunk load error:', err);
        if (typeof window !== 'undefined' && !sessionStorage.getItem('chunk_reload_attempted')) {
          sessionStorage.setItem('chunk_reload_attempted', '1');
          window.location.reload();
        }
        return () => null;
      }),
  { ssr: false }
);
const CartSidebar = dynamic(
  () =>
    import('../components/CartSidebar')
      .then((m) => m.CartSidebar || m.default)
      .catch((err) => {
        console.warn('Recovering from CartSidebar chunk load error:', err);
        return () => null;
      }),
  { ssr: false }
);
const MobileBottomNav = dynamic(
  () =>
    import('../components/drapza/MobileBottomNav')
      .then((m) => m.MobileBottomNav || m.default)
      .catch((err) => {
        console.warn('Recovering from MobileBottomNav chunk load error:', err);
        return () => null;
      }),
  { ssr: false }
);

if (typeof window !== 'undefined') {
  // Suppress third-party browser extension runtime errors (e.g. Urban VPN chrome-extension://... reading 'M_ID')
  // from crashing the Next.js development error overlay
  window.addEventListener(
    'error',
    (event) => {
      const filename = event.filename || '';
      const message = (event.message || '').toString();
      const stack = (event.error?.stack || '').toString();

      if (
        filename.startsWith('chrome-extension://') ||
        filename.startsWith('moz-extension://') ||
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        message.includes('M_ID') ||
        filename.includes('eppiocemhmnlbhjplcgkofciiegomcon')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason?.stack || event.reason?.message || '';
      if (
        reason.includes('chrome-extension://') ||
        reason.includes('moz-extension://') ||
        reason.includes('M_ID') ||
        reason.includes('eppiocemhmnlbhjplcgkofciiegomcon')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  // Safeguard against third-party DOM mutators (GSAP pin-spacer, extensions, Google Translate)
  // causing "NotFoundError: Failed to execute 'removeChild' on 'Node'" during React reconciliation
  if (typeof Node !== 'undefined' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
      try {
        if (child && child.parentNode && child.parentNode !== this) {
          return child.parentNode.removeChild(child);
        }
        return originalRemoveChild.call(this, child);
      } catch (e) {
        return child;
      }
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (newNode, referenceNode) {
      try {
        if (referenceNode && referenceNode.parentNode && referenceNode.parentNode !== this) {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode);
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (e) {
        return newNode;
      }
    };
  }

  gsap.registerPlugin(ScrollTrigger);
  window.gsap = gsap;
}

export function Providers({ children }) {
  const [lenisInstance, setLenisInstance] = useState(null);
  const pathname = usePathname();
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1000;

    // Clean up any stale lenis instance before re-creating
    if (typeof window !== 'undefined' && window.lenis) {
      try {
        window.lenis.destroy();
      } catch (e) { }
    }

    const lenis = new Lenis({
      duration: isMobile ? 0.8 : 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      wheelMultiplier: 0.95,
      prevent: (node) => {
        if (!node || typeof node.closest !== 'function') return false;
        // Allow inner scrollable containers (modals, drawers, tables, custom-scrollbars, sidebars) to scroll naturally without Lenis hijack
        return Boolean(
          node.hasAttribute?.('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent]') ||
          node.closest?.('[role="dialog"]') ||
          node.closest?.('.custom-scrollbar') ||
          node.closest?.('.custom-modal-scrollbar') ||
          node.closest?.('.dark-scrollbar') ||
          node.closest?.('textarea') ||
          node.closest?.('select')
        );
      }
    });
    setLenisInstance(lenis);
    window.lenis = lenis;
    window.__lenis = lenis;
    window.ScrollTrigger = ScrollTrigger;

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      setLenisInstance(null);
      window.lenis = null;
      window.__lenis = null;
    };
  }, [isAdminRoute]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSiteLoaded, setIsSiteLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const hasPreviewQuery = new URLSearchParams(window.location.search).get('preview') === 'true';
      if (isIframe || hasPreviewQuery || window.location.pathname.startsWith('/admin')) return true;
    }
    return !getIsFirstLoad();
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inIframe = window.self !== window.top;
      const hasPreviewQuery = new URLSearchParams(window.location.search).get('preview') === 'true';
      if (inIframe || hasPreviewQuery || pathname?.startsWith('/admin')) {
        setIsPreviewMode(inIframe || hasPreviewQuery);
        setIsSiteLoaded(true);
        markAsLoaded();
      }
    }
  }, [pathname]);

  const isContentVisible = isSiteLoaded || isAdminRoute || isPreviewMode;

  return (
    <ReduxProvider>
      <AuthProvider>
        <CartProvider>
          {!isAdminRoute && !isPreviewMode && (
            <Preloader
              lenis={lenisInstance}
              onAnimationComplete={() => setIsSiteLoaded(true)}
            />
          )}
          <div className={`site-viewport-container ${isContentVisible ? 'site-loaded' : ''}`}>
            {isAdminRoute ? (
              <>
                <Navigation />
                {children}
              </>
            ) : isPreviewMode ? (
              children
            ) : (
              <PageTransition>
                <Navigation />
                {children}
                <CartSidebar />
                <MobileBottomNav />
              </PageTransition>
            )}
          </div>
        </CartProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
