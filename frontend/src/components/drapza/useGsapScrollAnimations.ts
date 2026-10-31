"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Global GSAP ScrollTrigger + Lenis Smooth Scroll System.
 * Executes once at root level to orchestrate buttery-smooth scrolling,
 * multi-layer section parallax, scroll-reveal entrances, and progress tracking.
 */
export function useGsapScrollAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ── 2. GLOBAL GSAP SCROLLTRIGGER ANIMATION SUITE ──────────────────────
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) return;

      // ── A. MINIMAL SCROLL PROGRESS INDICATOR ────────────────────────────
      // Managed globally by useSmoothScroll; avoid duplicate conflicting tween if already bound
      const progressBar = document.querySelector("#scroll-progress-bar");
      const hasGlobalTrigger = typeof ScrollTrigger.getById === "function" && Boolean(ScrollTrigger.getById("global-scroll-progress-bar"));
      if (progressBar && !hasGlobalTrigger) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            id: "page-scroll-progress-bar",
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        });
      }

      // ── B. STATEMENT SECTION (#about) ───────────────────────────────────
      const aboutSec = document.querySelector("#about");
      if (aboutSec) {
        gsap.fromTo(
          "#about p:first-of-type, #about h2",
          { y: 30, opacity: 0.3 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: "#about",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );

        // Drapza Central Symbol entrance & subtle rotation depth
        const symbol = document.querySelector("#about .animate-float");
        if (symbol) {
          gsap.fromTo(
            symbol,
            { scale: 0.9, opacity: 0.3, rotate: -5 },
            {
              scale: 1,
              opacity: 1,
              rotate: 0,
              duration: 1.1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: symbol,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // ── C. PRODUCTS SECTION (#products) ─────────────────────────────────
      const productsSec = document.querySelector("#products");
      if (productsSec) {
        // Product Cards Section Header
        gsap.from("#products h2, #products p:first-of-type", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#products",
            start: "top 90%",
          },
        });
      }

      // ── D. FRAMESHIFT SECTION ───────────────────────────────────────────
      const frameShiftSec = document.querySelector("section:has(#textblock-heading), section:nth-of-type(4)");
      if (frameShiftSec) {
        // Central Card Entrance
        const frameCard = frameShiftSec.querySelector(".shadow-\\[0_30px_70px_-15px_rgba\\(0\\,0\\,0\\,0\\.6\\)\\]");
        if (frameCard) {
          gsap.from(frameCard, {
            scale: 0.92,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: frameCard,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // ── E. TEXT BLOCK SECTION ───────────────────────────────────────────
      const textBlockSec = document.querySelector("section.bg-\\[\\#0a0a0a\\]");
      if (textBlockSec) {
        // Headline reveal
        gsap.from(textBlockSec.querySelectorAll("h2"), {
          y: 50,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: textBlockSec,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        });

        // 3-Column Paragraph & Symbol Staggered Entrance
        const bottomCols = textBlockSec.querySelectorAll(".grid > div");
        if (bottomCols.length) {
          gsap.from(bottomCols, {
            y: 40,
            opacity: 0,
            duration: 1.0,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: textBlockSec.querySelector(".grid"),
              start: "top 82%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // ── F. CTA SECTION (#cta) ───────────────────────────────────────────
      const ctaSec = document.querySelector("#cta");
      if (ctaSec) {
        // Overlapping main heading
        gsap.from("#cta h2", {
          y: 50,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#cta",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        // Side card parallax composition
        const ctaLeft = document.querySelector("#cta .left-0 img");
        const ctaRight = document.querySelector("#cta .right-0 img");
        if (ctaLeft) {
          gsap.from(ctaLeft, {
            x: -30,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaSec,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });
        }
        if (ctaRight) {
          gsap.from(ctaRight, {
            x: 30,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaSec,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });
        }

        // Action Button Entrance
        const ctaBtn = document.querySelector("#cta a[href='#products'], #cta a");
        if (ctaBtn) {
          gsap.from(ctaBtn, {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ctaBtn,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // ── G. OUTFIT BUILDER SECTION (#outfit-builder) ────────────────────
      const outfitSec = document.querySelector("#outfit-builder");
      if (outfitSec) {
        gsap.from("#outfit-builder h2, #outfit-builder p:first-of-type, #outfit-builder span:first-of-type", {
          y: 45,
          opacity: 0,
          duration: 1.0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#outfit-builder",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // ── H. LOOKBOOK SECTION (#lookbook) ─────────────────────────────────
      const lookbookSec = document.querySelector("#lookbook");
      if (lookbookSec) {
        gsap.from("#lookbook h2, #lookbook span:first-of-type", {
          y: 45,
          opacity: 0,
          duration: 1.0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#lookbook",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // ── G. FOOTER SECTION (#footer) ─────────────────────────────────────
      // Safe animations without opacity: 0 to guarantee footer links and branding are always 100% visible
      const footerSec = document.querySelector("#footer");
      if (footerSec) {
        const footerNavLis = document.querySelectorAll("#footer-nav li");
        if (footerNavLis.length) {
          gsap.fromTo(
            footerNavLis,
            { y: 12 },
            {
              y: 0,
              duration: 0.5,
              stagger: 0.02,
              ease: "power2.out",
              scrollTrigger: {
                trigger: "#footer-nav",
                start: "top 98%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }
    });

    return () => {
      ctx.revert();
    };
  }, []);
}
