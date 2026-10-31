"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { forceUnlockBodyScroll } from "./useLockBodyScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

/**
 * Module-scoped singleton state for Lenis.
 * Survives React Strict Mode's double-mount/unmount cycle by deferring teardown.
 * Keeps a single stable Lenis instance connected to GSAP's ticker across route changes.
 */
let singletonLenis: Lenis | null = null;
let singletonMountCount = 0;
let singletonUpdateFn: ((time: number) => void) | null = null;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;

function destroySingleton() {
  if (singletonUpdateFn) {
    gsap.ticker.remove(singletonUpdateFn);
    singletonUpdateFn = null;
  }
  if (typeof ScrollTrigger.getById === "function") {
    ScrollTrigger.getById("global-scroll-progress-bar")?.kill();
  }
  if (singletonLenis) {
    try {
      singletonLenis.destroy();
    } catch (e) {}
    singletonLenis = null;
  }
  if (typeof window !== "undefined" && window.__lenis) {
    window.__lenis = null;
  }
}

export function getOrCreateLenis(): Lenis | null {
  if (typeof window === "undefined") return null;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return null;

  if (teardownTimer) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }

  if (!singletonLenis) {
    if (window.__lenis && window.__lenis !== singletonLenis) {
      try {
        window.__lenis.destroy();
      } catch (e) {}
      window.__lenis = null;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      autoRaf: false,
      autoResize: true,
      prevent: (node) =>
        Boolean(
          node &&
          typeof node.hasAttribute === "function" &&
          (node.hasAttribute("data-lenis-prevent") ||
            Boolean(node.closest && node.closest("[data-lenis-prevent]")))
        ),
    });

    singletonLenis = lenis;
    window.__lenis = lenis;

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    singletonUpdateFn = updateLenis;
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Global scroll progress indicator bar
    const progressBar = document.querySelector("#scroll-progress-bar");
    if (progressBar) {
      gsap.to(progressBar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          id: "global-scroll-progress-bar",
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    }

    const onVisibilityChange = () => {
      if (!singletonLenis) return;
      if (document.hidden) {
        singletonLenis.stop();
      } else {
        singletonLenis.start();
        singletonLenis.resize();
        ScrollTrigger.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onPopState = () => {
      forceUnlockBodyScroll();
      if (!singletonLenis) return;
      try {
        if (singletonLenis.isStopped) singletonLenis.start();
        singletonLenis.resize();
        ScrollTrigger.refresh();
      } catch (e) {}
    };
    window.addEventListener("popstate", onPopState);

    const onUnlockScroll = () => {
      forceUnlockBodyScroll();
      if (!singletonLenis) return;
      try {
        if (singletonLenis.isStopped) singletonLenis.start();
      } catch (e) {}
    };
    window.addEventListener("drapza:unlock-scroll", onUnlockScroll);
  } else {
    if (singletonLenis.isStopped) {
      singletonLenis.start();
    }
  }

  return singletonLenis;
}

export function useSmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    singletonMountCount++;
    const lenis = getOrCreateLenis();
    lenisRef.current = lenis;

    return () => {
      singletonMountCount--;
      // In automated test suites, clean up when the test unmounts the hook
      if (process.env.NODE_ENV === "test") {
        if (singletonMountCount <= 0) {
          singletonMountCount = 0;
          destroySingleton();
          lenisRef.current = null;
        }
      }
      // In the real browser, do NOT tear down the singleton on navigation.
      // It remains permanently stable across all page transitions.
    };
  }, []);

  // Route change: clean scroll reset and synchronized layout refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    forceUnlockBodyScroll();

    // Ensure Lenis instance is alive and active on every route transition
    const activeLenis = getOrCreateLenis();
    if (activeLenis) {
      if (activeLenis.isStopped) {
        activeLenis.start();
      }
      activeLenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    // Refresh dimensions once the new route DOM has painted
    const rAFId = requestAnimationFrame(() => {
      const cur = singletonLenis || window.__lenis || lenisRef.current;
      if (cur) {
        cur.resize();
      }
      try {
        ScrollTrigger.refresh();
      } catch (e) {}
    });

    return () => {
      cancelAnimationFrame(rAFId);
    };
  }, [pathname]);
}
