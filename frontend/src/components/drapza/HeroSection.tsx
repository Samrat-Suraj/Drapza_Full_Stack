"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { audioSystem } from "./AudioSystem";
import { ArrowDown, Compass } from "lucide-react";
import { heroApi } from "@/lib/api";
import { MagneticButton } from "./MagneticButton";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

gsap.registerPlugin(ScrollTrigger);

export interface HeroConfigData {
  ribbonCategory?: string;
  ribbonSubtext?: string;
  ribbonTag?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  leftBadgeTag?: string;
  leftBadgeTitle?: string;
  leftBadgeDesc?: string;
  rightBadgeTag?: string;
  rightBadgeTitle?: string;
  rightBadgeDesc?: string;
  modelImage?: string;
  modelAlt?: string;
  modelScale?: number;
  modelOffsetY?: number;
  modelOffsetX?: number;
  modelMaxHeight?: number;
  modelOpacity?: number;
  modelShadow?: boolean;
  modelParallax?: boolean;
  telemetryTag1?: string;
  telemetryTag2?: string;
  telemetryTag3?: string;
  ctaButtonText?: string;
  coordinates?: string;
}

const defaultHeroData: HeroConfigData = {
  ribbonCategory: "DRAPZA ATELIER 2026",
  ribbonSubtext: "HEAVYWEIGHT TECHNICAL STREETWEAR • EDITION 01",
  ribbonTag: "[ WORLDWIDE AIRWAY DISPATCH ]",
  headlineLine1: "SILHOUETTES FOR",
  headlineLine2: "THE NEXT ERA",
  leftBadgeTag: "ARCHIVE 001",
  leftBadgeTitle: "480 GSM Heavyweight French Terry",
  leftBadgeDesc: "Custom engineered architectural drape.",
  rightBadgeTag: "LIVE INVENTORY",
  rightBadgeTitle: "Instant Express Dispatch",
  rightBadgeDesc: "VIP tracking with live waypoint sync.",
  modelImage: "/images/drapza/home/hero.png",
  modelAlt: "Drapza model wearing luxury tactical modular overshirt and sunglasses",
  modelScale: 125,
  modelOffsetY: 0,
  modelOffsetX: 0,
  modelMaxHeight: 75,
  modelOpacity: 100,
  modelShadow: true,
  modelParallax: true,
  telemetryTag1: "VOID INDEX • 01",
  telemetryTag2: "MODEL V.26",
  telemetryTag3: "LIMITED CAPSULE",
  ctaButtonText: "EXPLORE GARMENTS",
  coordinates: "28.6139° N, 77.2090° E",
};

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const modelImgRef = useRef<HTMLImageElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const leftBadgeRef = useRef<HTMLDivElement>(null);
  const rightBadgeRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const [heroData, setHeroData] = useState<HeroConfigData>(defaultHeroData);

  useEffect(() => {
    // Fetch live Hero configuration from CMS API
    const loadHeroConfig = async () => {
      try {
        const res = await heroApi.getHeroConfig();
        if (res && res.success && res.data) {
          const config = { ...res.data };
          if (config.modelImage && config.modelImage.includes("digifox")) {
            config.modelImage = config.modelImage.replace(/\/images\/digifox\//g, "/images/drapza/");
          }
          setHeroData((prev) => ({ ...prev, ...config }));
        }
      } catch (err) {
        // Fallback gracefully to default preset
        console.warn("[HERO CMS] Using default hero preset");
      }
    };
    loadHeroConfig();
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    let handleMouseMove: ((e: MouseEvent) => void) | null = null;

    const ctx = gsap.context(() => {
      // ── 1. CINEMATIC INITIAL ENTRANCE TIMELINE ─────────────────────────
      const introTl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Ambient Glow fade in
      if (glowRef.current) {
        introTl.fromTo(
          glowRef.current,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 0.6, duration: 1.8, ease: "power2.out" },
          0
        );
      }

      // Kinetic 3D Headline Lines Reveal (Agency SplitText emulation)
      if (headlineRef.current) {
        const lines = headlineRef.current.querySelectorAll(".hero-line-inner");
        introTl.fromTo(
          lines,
          {
            yPercent: 125,
            opacity: 0,
            rotateX: -45,
            transformOrigin: "bottom center",
            force3D: true,
          },
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.4,
            stagger: 0.16,
            ease: "power4.out",
          },
          0.1
        );
      }

      // Model Image Cinematic Zoom In
      if (imageContainerRef.current) {
        introTl.fromTo(
          imageContainerRef.current,
          { scale: 0.88, opacity: 0, y: 50, force3D: true },
          { scale: 1, opacity: 1, y: 0, duration: 1.5, ease: "power3.out" },
          0.2
        );
      }

      // Floating Badges Entrance
      if (leftBadgeRef.current && rightBadgeRef.current) {
        introTl.fromTo(
          [leftBadgeRef.current, rightBadgeRef.current],
          { x: (i) => (i === 0 ? -40 : 40), opacity: 0, force3D: true },
          { x: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out" },
          0.6
        );
      }

      // Bottom Bar Entrance
      if (bottomBarRef.current) {
        introTl.fromTo(
          bottomBarRef.current,
          { y: 30, opacity: 0, force3D: true },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
          0.8
        );
      }

      // ── 2. SUBTLE FLOATING LEVITATION FOR BADGES ───────────────────────
      if (leftBadgeRef.current) {
        gsap.to(leftBadgeRef.current, {
          y: -8,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.5,
          force3D: true,
        });
      }
      if (rightBadgeRef.current) {
        gsap.to(rightBadgeRef.current, {
          y: 8,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.8,
          force3D: true,
        });
      }

      // ── 3. INTERACTIVE 3D MOUSE PARALLAX TRACKING (60FPS HARDWARE ACCEL) ─
      handleMouseMove = (e: MouseEvent) => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

        if (modelImgRef.current) {
          gsap.to(modelImgRef.current, {
            x: x * 22,
            y: y * 14,
            rotateY: x * 6,
            duration: 0.8,
            ease: "power2.out",
            force3D: true,
            overwrite: "auto",
          });
        }
        if (headlineRef.current) {
          gsap.to(headlineRef.current, {
            x: -x * 16,
            y: -y * 10,
            duration: 1,
            ease: "power2.out",
            force3D: true,
            overwrite: "auto",
          });
        }
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            x: x * 35,
            y: y * 25,
            duration: 1.2,
            ease: "power2.out",
            force3D: true,
            overwrite: "auto",
          });
        }
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // ── 4. RESPONSIVE SCROLL-LINKED PARALLAX ENGINE ────────────────────
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // Background Halftone drift
      if (bgRef.current) {
        scrollTl.to(
          bgRef.current,
          { yPercent: -15, scale: 1.1, ease: "none" },
          0
        );
      }

      // Giant Headline text 3D lift and fade out
      if (headlineRef.current) {
        scrollTl.to(
          headlineRef.current,
          {
            yPercent: -45,
            scale: 0.94,
            opacity: 0,
            rotateX: 6,
            ease: "none",
          },
          0
        );
      }

      // Model Image cinematic scale & parallax rise (disabled yPercent lift on mobile to eliminate bottom gap on scroll)
      if (imageContainerRef.current) {
        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        scrollTl.to(
          imageContainerRef.current,
          {
            yPercent: isMobile ? 0 : -18,
            scale: isMobile ? 1.0 : 1.05,
            ease: "none",
          },
          0
        );
      }

      // Floating Badges fade & slide away
      if (leftBadgeRef.current && rightBadgeRef.current) {
        scrollTl.to(
          [leftBadgeRef.current, rightBadgeRef.current],
          {
            yPercent: -35,
            opacity: 0,
            ease: "none",
          },
          0
        );
      }

      // Bottom Bar fade out
      if (bottomBarRef.current) {
        scrollTl.to(
          bottomBarRef.current,
          { yPercent: -20, opacity: 0, ease: "none" },
          0
        );
      }
    }, sectionRef);

    return () => {
      if (handleMouseMove) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      ctx.revert();
    };
  }, [heroData]);

  const handleScrollToCollection = () => {
    audioSystem.playClick(600);
    const target =
      document.getElementById("products") ||
      document.querySelector(".featured-products") ||
      document.querySelector("section.about") ||
      document.querySelector(".about");

    const lenis = (typeof window !== "undefined" && ((window as any).lenis || (window as any).__lenis)) as any;

    if (target) {
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(target, { duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      const scrollY = typeof window !== "undefined" ? window.innerHeight || 800 : 800;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(scrollY, { duration: 1.2 });
      } else if (typeof window !== "undefined") {
        window.scrollTo({ top: scrollY, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[100svh] w-full overflow-hidden bg-base-100 flex flex-col justify-between select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Background Subtle Halftone Grid Texture */}
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0 bg-halftone-lg scale-110 opacity-35 z-0 origin-center will-change-transform"
        aria-hidden="true"
      />

      {/* Subtle Ambient Monochrome Accent Glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full bg-neutral-200/50 blur-[140px] z-0 will-change-transform"
        aria-hidden="true"
      />

      {/* Hero Content Container */}
      <div className="relative z-10 flex min-h-[100svh] w-full flex-col justify-between px-4 pt-20 sm:px-8 sm:pt-24 md:px-12 md:pt-28 pb-8">
        
        {/* Top Atelier Category Ribbon */}
        <div className="flex items-center justify-between font-mono-technical text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-700 border-b border-black/10 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-pulse" />
            <span className="text-black font-bold">
              {heroData.ribbonCategory || defaultHeroData.ribbonCategory}
            </span>
          </div>
          <span className="hidden sm:inline text-neutral-700 truncate max-w-[500px] font-medium">
            {heroData.ribbonSubtext || defaultHeroData.ribbonSubtext}
          </span>
          <span className="text-black font-bold">
            {heroData.ribbonTag || defaultHeroData.ribbonTag}
          </span>
        </div>

        {/* Main Giant Headline (Behind model with layered depth) */}
        <div
          ref={headlineRef}
          className="relative z-10 mx-auto w-full max-w-[1800px] text-center pt-2 sm:pt-4 md:pt-6 will-change-transform origin-center perspective-1200 preserve-3d"
        >
          <h1 className="font-display text-[clamp(2.2rem,9.5vw,10.5rem)] uppercase leading-[0.88] tracking-tight text-black font-normal text-balance">
            <span className="block overflow-hidden py-0.5 sm:py-1">
              <span className="hero-line-inner block will-change-transform hardware-accel">
                {heroData.headlineLine1 || defaultHeroData.headlineLine1}
              </span>
            </span>
            <span className="block overflow-hidden py-0.5 sm:py-1">
              <span className="hero-line-inner block will-change-transform hardware-accel text-black">
                {heroData.headlineLine2 || defaultHeroData.headlineLine2}
              </span>
            </span>
          </h1>
        </div>

        {/* Floating Technical Badge (Left Side on Desktop) */}
        <div
          ref={leftBadgeRef}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 p-4 rounded-2xl hud-glass-panel max-w-[220px] hardware-accel shadow-xl"
        >
          <div className="flex items-center gap-2 text-black text-xs font-mono-technical font-bold">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>{heroData.leftBadgeTag || defaultHeroData.leftBadgeTag}</span>
          </div>
          <p className="font-display text-sm uppercase text-black tracking-wide font-medium">
            {heroData.leftBadgeTitle || defaultHeroData.leftBadgeTitle}
          </p>
          <span className="font-mono-technical text-[10px] text-neutral-700 font-medium">
            {heroData.leftBadgeDesc || defaultHeroData.leftBadgeDesc}
          </span>
        </div>

        {/* Floating Technical Badge (Right Side on Desktop) */}
        <div
          ref={rightBadgeRef}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 p-4 rounded-2xl hud-glass-panel max-w-[220px] text-right items-end hardware-accel shadow-xl"
        >
          <div className="flex items-center gap-2 text-black text-xs font-mono-technical font-bold">
            <span>{heroData.rightBadgeTag || defaultHeroData.rightBadgeTag}</span>
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          </div>
          <p className="font-display text-sm uppercase text-black tracking-wide font-medium">
            {heroData.rightBadgeTitle || defaultHeroData.rightBadgeTitle}
          </p>
          <span className="font-mono-technical text-[10px] text-neutral-700 font-medium">
            {heroData.rightBadgeDesc || defaultHeroData.rightBadgeDesc}
          </span>
        </div>

        {/* Central Model Image with 3D Parallax Tilt */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center items-end overflow-visible translate-y-0 sm:translate-y-8 md:translate-y-14 lg:translate-y-20">
          <div
            ref={imageContainerRef}
            className="w-full flex justify-center will-change-transform origin-bottom hardware-accel scale-[1.85] xs:scale-[2.0] sm:scale-100"
            style={{
              transform: `translate3d(${heroData.modelOffsetX ?? 0}px, ${heroData.modelOffsetY ?? 0}px, 0)`,
              opacity: (heroData.modelOpacity ?? 100) / 100,
            }}
          >
            <img
              ref={modelImgRef}
              src={
                normalizeImageUrl(
                  heroData.modelImage || defaultHeroData.modelImage || "/images/drapza/home/hero.png"
                )
              }
              alt={heroData.modelAlt || defaultHeroData.modelAlt || "Drapza model"}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = "true";
                  target.src = "/images/drapza/home/hero.png";
                } else {
                  handleImageFallbackError(e);
                }
              }}
              style={{
                maxHeight: heroData.modelMaxHeight ? `${heroData.modelMaxHeight}vh` : undefined,
                transform: `scale(${((heroData.modelScale ?? 125) / 100)})`,
              }}
              className="h-auto w-auto max-h-[86vh] xs:max-h-[92vh] sm:max-h-[58vh] md:max-h-[64vh] lg:max-h-[72vh] object-contain object-bottom origin-bottom will-change-transform drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)] hardware-accel block align-bottom"
            />
          </div>
        </div>

        {/* Bottom Interactive Telemetry & Scroll Indicator Bar */}
        <div
          ref={bottomBarRef}
          className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-black/10 font-mono-technical text-xs"
        >
          {/* Left Metadata */}
          <div className="flex items-center gap-4 sm:gap-6 text-neutral-700 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium">
            <span>{heroData.telemetryTag1 || defaultHeroData.telemetryTag1}</span>
            <span className="hidden xs:inline">{heroData.telemetryTag2 || defaultHeroData.telemetryTag2}</span>
            <span className="text-black font-bold">{heroData.telemetryTag3 || defaultHeroData.telemetryTag3}</span>
          </div>

          {/* Center Smooth Scroll Down CTA */}
          <MagneticButton
            type="button"
            onClick={handleScrollToCollection}
            aria-label={heroData.ctaButtonText || defaultHeroData.ctaButtonText || "Scroll down to collection"}
            className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-mono-technical text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 group"
          >
            <span>{heroData.ctaButtonText || defaultHeroData.ctaButtonText}</span>
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform" />
          </MagneticButton>

          {/* Right Live Coordinates */}
          <div className="hidden sm:flex items-center gap-2 text-neutral-700 text-[11px] font-medium">
            <Compass className="w-3.5 h-3.5 text-neutral-700 animate-spin" style={{ animationDuration: "12s" }} />
            <span>{heroData.coordinates || defaultHeroData.coordinates}</span>
          </div>
        </div>

      </div>
    </section>
  );
}
