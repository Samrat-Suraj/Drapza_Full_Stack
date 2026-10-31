"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { peelRevealApi } from "@/lib/api";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Ultra-smooth luxury quintic easing for buttery transitions
const easeQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const easeExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const smoothStep = (t: number) => t * t * (3 - 2 * t);

export interface PeelRevealConfigData {
  signalType?: string;
  moduleId?: string;
  status?: string;
  splitWordLeft?: string;
  splitWordRight?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  modelImage?: string;
  modelAlt?: string;
  cardBgColor?: string;
  textColor?: string;
  modelScale?: number;
  modelOffsetY?: number;
  modelOffsetX?: number;
  isEnabled?: boolean;
  // Dynamic Animation Modes
  revealAnimation?: "split_expand" | "cinematic_zoom" | "curtain_slice" | "glitch_matrix" | "smooth_glide";
  modelMotion?: "parallax_tilt" | "breathing_float" | "glitch_pulse" | "depth_scale" | "static";
  textMotion?: "horizontal_split" | "marquee_infinite" | "vertical_cascade" | "blur_emerge" | "rotate_3d";
  ambientVfx?: "halftone_grid" | "ambient_glow" | "scanlines" | "cyber_particles" | "none";
  headlineEffect?: "fade_up" | "letter_stagger" | "tracking_expand" | "mask_wipe";
}

const defaultPeelRevealData: PeelRevealConfigData = {
  signalType: "SIGNAL TYPE: NEUTRAL",
  moduleId: "MODULE ID: NRMLSS_001",
  status: "STATUS: DETACHED",
  splitWordLeft: "SIGNAL",
  splitWordRight: "MOTION",
  headlineLine1: "THE UNIFORM HOLDS",
  headlineLine2: "NO ALLEGIANCE",
  modelImage: "/images/drapza/peel-reveal/peel-reveal-cutout.png",
  modelAlt: "Drapza model wearing a neutral technical overshirt",
  cardBgColor: "#ededed",
  textColor: "#262626",
  modelScale: 100,
  modelOffsetY: 0,
  modelOffsetX: 0,
  isEnabled: true,
  revealAnimation: "split_expand",
  modelMotion: "parallax_tilt",
  textMotion: "horizontal_split",
  ambientVfx: "halftone_grid",
  headlineEffect: "fade_up",
};

export function PeelRevealSection() {
  const wrapperRef = useRef<HTMLElement>(null);
  const pinTargetRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<PeelRevealConfigData>(defaultPeelRevealData);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Pinned GSAP ScrollTrigger: Page remains 100% pinned until the entire zoom and peel animation finishes
  useEffect(() => {
    if (typeof window === "undefined" || !wrapperRef.current || !pinTargetRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: "peel-reveal-scroll-pin",
        trigger: wrapperRef.current,
        pin: pinTargetRef.current,
        start: "top top",
        end: "+=260%", // Dedicated scroll distance to complete full zoom sequence
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1.0, // Silky smooth scrub lag
        onUpdate: (self) => {
          setProgress(self.progress);
        },
      });
    }, wrapperRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    // Fetch live Peel Reveal configuration from CMS API
    const loadPeelRevealConfig = async () => {
      try {
        const res = await peelRevealApi.getPeelRevealConfig();
        if (res && res.success && res.data) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.warn("[PEEL REVEAL CMS] Using default preset");
      }
    };
    loadPeelRevealConfig();
  }, []);

  // Mouse Parallax listener when modelMotion is "parallax_tilt"
  useEffect(() => {
    if (config.modelMotion !== "parallax_tilt") return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 36;
      const y = (e.clientY / innerHeight - 0.5) * 24;
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config.modelMotion]);

  if (config.isEnabled === false) {
    return null;
  }

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Multi-tier progress stages for silky transitions
  const p1 = easeQuint(clamp(progress / 0.62));
  const p2 = easeExpo(clamp((progress - 0.38) / 0.62));
  const pText = smoothStep(clamp(progress / 0.55));

  const revealAnim = config.revealAnimation || "split_expand";
  const modelMot = config.modelMotion || "parallax_tilt";
  const textMot = config.textMotion || "horizontal_split";
  const vfx = config.ambientVfx || "halftone_grid";
  const headlineFx = config.headlineEffect || "fade_up";

  // Card dimensions & geometry based on revealAnimation style (responsive for mobile)
  const initialWidth = isMobile ? 80 : 36;
  const initialHeight = isMobile ? 56 : 44;
  let cardWidth = lerp(initialWidth, 100, p1);
  let cardHeight = lerp(initialHeight, 100, p1);
  let cardRadius = lerp(isMobile ? 24 : 34, 0, p1);
  let cardScale = 1;
  let cardTransform = "translate3d(0,0,0)";
  let cardShadow = `0 ${lerp(35, 0, p1)}px ${lerp(80, 0, p1)}px -15px rgba(0,0,0,${lerp(0.28, 0, p1)})`;

  if (revealAnim === "cinematic_zoom") {
    cardWidth = lerp(isMobile ? 80 : 38, 100, p1);
    cardHeight = lerp(isMobile ? 56 : 46, 100, p1);
    cardRadius = lerp(isMobile ? 28 : 40, 0, p1);
    cardScale = lerp(0.75, 1, p1);
    cardTransform = `perspective(1200px) scale(${cardScale}) translateZ(${lerp(-180, 0, p1)}px) rotateX(${lerp(5, 0, p1)}deg)`;
  } else if (revealAnim === "curtain_slice") {
    cardWidth = 100;
    cardHeight = lerp(isMobile ? 30 : 20, 100, p1);
    cardRadius = lerp(12, 0, p1);
    cardTransform = "translate3d(0,0,0)";
  } else if (revealAnim === "glitch_matrix") {
    cardWidth = p1 > 0.45 ? 100 : lerp(isMobile ? 80 : 36, 85, p1);
    cardHeight = p1 > 0.45 ? 100 : lerp(isMobile ? 56 : 44, 85, p1);
    cardRadius = p1 > 0.45 ? 0 : 20;
    cardTransform = p1 > 0.2 && p1 < 0.65 ? `translate3d(${(p1 * 12) % 6 - 3}px, 0, 0)` : "translate3d(0,0,0)";
  } else if (revealAnim === "smooth_glide") {
    cardWidth = lerp(isMobile ? 80 : 36, 100, p1);
    cardHeight = lerp(isMobile ? 56 : 44, 100, p1);
    cardRadius = lerp(isMobile ? 26 : 36, 0, p1);
    cardTransform = `translate3d(0, ${lerp(isMobile ? 40 : 60, 0, p1)}px, 0) scale(${lerp(0.92, 1, p1)})`;
  }

  // Model scale & offset: full model fits cleanly inside viewport and zooms forward dynamically
  const baseScale = (config.modelScale !== undefined ? config.modelScale : 100) / 100;
  
  // Cinematic scroll-driven forward zoom effect: Model zooms forward into foreground from 0.95x up to 1.35x
  const zoomCurve = easeQuint(clamp(progress / 0.85));
  let modelCurrentScale = lerp(0.95 * baseScale, 1.34 * baseScale, zoomCurve);
  let modelParallaxX = (config.modelOffsetX || 0);
  let modelParallaxY = (config.modelOffsetY || 0) + lerp(0, -25, zoomCurve);

  if (modelMot === "parallax_tilt") {
    modelParallaxX += mouseOffset.x * 0.45;
    modelParallaxY += mouseOffset.y * 0.45;
  } else if (modelMot === "depth_scale") {
    modelCurrentScale = lerp(0.85 * baseScale, 1.45 * baseScale, progress);
  }

  // Dynamic Word Shifts & Gaussian Blur Falloff
  const wordShift = lerp(0, isMobile ? 32 : 48, pText);
  const wordScale = lerp(1, 0.88, pText);
  const wordBlur = lerp(0, 8, pText);
  const wordFade = 1 - clamp((progress - 0.42) / 0.35);

  // Calculate background luminance to guarantee WCAG 2.1 contrast (min 3:1 for large display text)
  const isDarkCard = !config.cardBgColor ||
    config.cardBgColor === "#0a0a0a" ||
    config.cardBgColor === "#000000" ||
    config.cardBgColor.toLowerCase() === "#0e0e0e" ||
    (config.cardBgColor.startsWith("#") && config.cardBgColor.length >= 7 &&
      (parseInt(config.cardBgColor.slice(1, 3), 16) * 0.299 +
       parseInt(config.cardBgColor.slice(3, 5), 16) * 0.587 +
       parseInt(config.cardBgColor.slice(5, 7), 16) * 0.114) < 128);

  const resolvedHeadlineColor = isDarkCard
    ? (config.textColor === "#262626" || !config.textColor ? "#ffffff" : config.textColor)
    : (config.textColor === "#ffffff" ? "#171717" : (config.textColor || "#171717"));

  // Headline reveal style styles with editorial tracking
  let headlineStyle: React.CSSProperties = {
    color: resolvedHeadlineColor,
    opacity: p2,
    transform: `translate3d(${config.modelOffsetX || 0}px, ${lerp(isMobile ? 30 : 60, 0, p2) + (config.modelOffsetY || 0)}px, 0) scale(${lerp(0.94, 1, p2)})`,
  };

  if (headlineFx === "tracking_expand") {
    headlineStyle = {
      ...headlineStyle,
      letterSpacing: `${lerp(0.4, 0.03, p2)}em`,
    };
  } else if (headlineFx === "letter_stagger") {
    headlineStyle = {
      ...headlineStyle,
      transform: `perspective(900px) rotateX(${lerp(45, 0, p2)}deg) translate3d(0, ${lerp(60, 0, p2)}px, 0)`,
    };
  } else if (headlineFx === "mask_wipe") {
    headlineStyle = {
      ...headlineStyle,
      clipPath: `inset(0 ${lerp(50, 0, p2)}% 0 ${lerp(50, 0, p2)}%)`,
    };
  }

  return (
    <div className="peel-reveal-outer-container w-full">
      <section ref={wrapperRef} className="peel-reveal-section relative bg-white w-full select-none overflow-hidden">
      <div ref={pinTargetRef} className="relative flex h-screen w-full items-center justify-center overflow-hidden">

          {/* Ambient VFX Overlays */}
          {vfx === "halftone_grid" && (
            <div className="pointer-events-none absolute inset-0 bg-halftone-lg opacity-25 z-0" aria-hidden="true" />
          )}

          {vfx === "ambient_glow" && (
            <div
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-neutral-300/40 blur-[130px] z-0 animate-pulse"
              style={{ animationDuration: "6s" }}
              aria-hidden="true"
            />
          )}

          {vfx === "scanlines" && (
            <div
              className="pointer-events-none absolute inset-0 z-30 opacity-15"
              style={{
                backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%)",
                backgroundSize: "100% 4px",
              }}
              aria-hidden="true"
            />
          )}

          {vfx === "cyber_particles" && (
            <div
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-between p-12 opacity-30 font-mono text-[9px] text-neutral-700 select-none"
              aria-hidden="true"
            >
              <span>+ [LAT: 28.6139° N]</span>
              <span>[RADAR: ACTIVE] +</span>
              <span>+ [LNG: 77.2090° E]</span>
            </div>
          )}

          {/* Technical labels */}
          <div className="pointer-events-none absolute inset-x-0 top-6 z-40 flex justify-between px-6 md:px-10">
            <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] text-black font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              {config.signalType || defaultPeelRevealData.signalType}
            </span>
            <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] text-black font-bold">
              {config.moduleId || defaultPeelRevealData.moduleId}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-between px-6 md:px-10">
            <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] text-black font-bold">
              {config.status || defaultPeelRevealData.status}
            </span>
            <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] text-neutral-800 font-bold hidden sm:inline">
              MODE • {revealAnim.toUpperCase()}
            </span>
          </div>

          {/* Background Text Motion Engine */}
          <div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
            aria-hidden="true"
            style={{ opacity: wordFade }}
          >
            {textMot === "horizontal_split" && (
              <>
                <span
                  className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none tracking-tight text-black font-bold uppercase transition-transform ease-out will-change-transform"
                  style={{
                    transform: `translate3d(${-wordShift}vw, 0, 0) scale(${wordScale}) rotate(${-lerp(0, 1.5, pText)}deg)`,
                    filter: `blur(${wordBlur}px)`,
                  }}
                >
                  {config.splitWordLeft || defaultPeelRevealData.splitWordLeft}
                </span>
                <span
                  className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none tracking-tight text-black font-bold uppercase ml-4 sm:ml-12 transition-transform ease-out will-change-transform"
                  style={{
                    transform: `translate3d(${wordShift}vw, 0, 0) scale(${wordScale}) rotate(${lerp(0, 1.5, pText)}deg)`,
                    filter: `blur(${wordBlur}px)`,
                  }}
                >
                  {config.splitWordRight || defaultPeelRevealData.splitWordRight}
                </span>
              </>
            )}

            {textMot === "marquee_infinite" && (
              <div className="w-full flex flex-col gap-4">
                <div className="flex whitespace-nowrap animate-marquee">
                  {[...Array(6)].map((_, i) => (
                    <span key={i} className="mx-4 sm:mx-6 font-display text-[clamp(2.2rem,7vw,7rem)] uppercase font-bold text-black/80">
                      {config.splitWordLeft || "SIGNAL"} • {config.splitWordRight || "MOTION"} •
                    </span>
                  ))}
                </div>
              </div>
            )}

            {textMot === "vertical_cascade" && (
              <>
                <span
                  className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none tracking-tight text-black font-bold uppercase"
                  style={{ transform: `translate3d(${-wordShift * 0.5}vw, ${lerp(0, -120, p1)}px, 0)` }}
                >
                  {config.splitWordLeft || defaultPeelRevealData.splitWordLeft}
                </span>
                <span
                  className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none tracking-tight text-black font-bold uppercase ml-4 sm:ml-12"
                  style={{ transform: `translate3d(${wordShift * 0.5}vw, ${lerp(0, 120, p1)}px, 0)` }}
                >
                  {config.splitWordRight || defaultPeelRevealData.splitWordRight}
                </span>
              </>
            )}

            {textMot === "blur_emerge" && (
              <div
                className="flex items-center justify-center transition-all"
                style={{
                  filter: `blur(${lerp(0, 16, p1)}px)`,
                  letterSpacing: `${lerp(0.05, 0.4, p1)}em`,
                }}
              >
                <span className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none text-black font-bold uppercase">
                  {config.splitWordLeft} {config.splitWordRight}
                </span>
              </div>
            )}

            {textMot === "rotate_3d" && (
              <div className="flex items-center justify-center" style={{ perspective: "1000px" }}>
                <span
                  className="font-display text-[clamp(2.2rem,9vw,10rem)] leading-none text-black font-bold uppercase"
                  style={{ transform: `rotateY(${lerp(0, 75, p1)}deg)` }}
                >
                  {config.splitWordLeft || "SIGNAL"} {config.splitWordRight || "MOTION"}
                </span>
              </div>
            )}
          </div>

          {/* Expanding Card Container with Dynamic Reveal Motion (3D Diorama) */}
          <div
            className="relative z-10 overflow-hidden flex items-center justify-center will-change-transform hardware-accel preserve-3d"
            style={{
              width: `${cardWidth}vw`,
              height: `${cardHeight}vh`,
              borderRadius: `${cardRadius}px`,
              backgroundColor: config.cardBgColor || "#ededed",
              transform: cardTransform,
              boxShadow: cardShadow,
            }}
          >
            {/* Layer 1 (BEHIND MODEL - z-10): Giant Headline */}
            <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-8 text-center pointer-events-none select-none">
              <h2
                className="max-w-6xl font-display text-[clamp(2rem,7.5vw,7.5rem)] leading-[0.88] uppercase font-bold will-change-transform hardware-accel"
                style={headlineStyle}
              >
                {config.headlineLine1 || defaultPeelRevealData.headlineLine1}
                <br />
                {config.headlineLine2 || defaultPeelRevealData.headlineLine2}
              </h2>
            </div>

            {/* Layer 2 (IN FRONT OF TEXT - z-20): Transparent Cutout PNG pinned seamlessly to bottom with forward 3D zoom */}
            <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none overflow-hidden perspective-1200 preserve-3d">
              <img
                src={normalizeImageUrl(config.modelImage || defaultPeelRevealData.modelImage)}
                alt={config.modelAlt || defaultPeelRevealData.modelAlt || "Drapza model"}
                onError={handleImageFallbackError}
                className={`h-[120%] sm:h-[115%] md:h-[110%] w-auto max-w-none object-contain object-bottom pointer-events-none will-change-transform hardware-accel ${modelMot === "breathing_float" ? "animate-breathe" : ""
                  } ${modelMot === "glitch_pulse" ? "animate-glitch" : ""}`}
                style={{
                  transformOrigin: "bottom center",
                  transform: `scale3d(${modelCurrentScale}, ${modelCurrentScale}, 1) translate3d(${modelParallaxX}px, ${modelParallaxY}px, 0)`,
                  filter: `drop-shadow(0 ${lerp(15, 40, zoomCurve)}px ${lerp(30, 70, zoomCurve)}px rgba(0,0,0,${lerp(0.18, 0.38, zoomCurve)}))`,
                }}
              />
            </div>
          </div>
      </div>
    </section>
  </div>
  );
}
