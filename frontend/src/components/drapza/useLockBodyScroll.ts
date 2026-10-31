"use client";

import { useEffect } from "react";

/**
 * Global reference counter for modal scroll locks.
 * Prevents race conditions when multiple modals/drawers open or close simultaneously,
 * or when unmounting across Next.js route transitions.
 */
let activeLockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";

function is404RouteActive(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).__drapzaIs404 ||
    (typeof document !== "undefined" && document.querySelector("[data-drapza-404]"))
  );
}

/**
 * Emergency reset to immediately unlock body/HTML scrolling and resume Lenis.
 * Safe to call on route changes (pathname changes), popstate, or page error/404 boundaries.
 */
export function forceUnlockBodyScroll() {
  if (typeof window === "undefined") return;
  activeLockCount = 0;
  originalBodyOverflow = "";
  originalHtmlOverflow = "";

  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.documentElement.classList.remove("lenis-stopped", "lenis-locked");
    document.body.classList.remove("lenis-stopped", "lenis-locked");
  }

  if (window.__lenis) {
    try {
      if (window.__lenis.isStopped) {
        window.__lenis.start();
      }
    } catch (e) {
      // Lenis might be destroyed during teardown
    }
  }
}

/**
 * Universal Scroll Lock Hook for Modals, Drawers & Popups.
 * Completely disables background page scrolling (including Lenis smooth-scroll & touch moves)
 * while allowing scrollable content inside the popup itself to scroll smoothly.
 */
export function useLockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // Never lock body scroll when on a 404 route
    if (is404RouteActive()) {
      forceUnlockBodyScroll();
      return;
    }

    if (activeLockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const lenis = (window as any).__lenis || (window as any).lenis;
      if (lenis) {
        try {
          lenis.stop();
        } catch (e) {}
      }
    }
    activeLockCount++;

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("lenis-stopped", "lenis-locked");
          document.body.classList.remove("lenis-stopped", "lenis-locked");
        }

        const lenis = (window as any).__lenis || (window as any).lenis;
        if (lenis) {
          try {
            lenis.start();
            lenis.resize();
          } catch (e) {}
        }
      }
    };
  }, [isOpen]);
}
