"use client";

import { useRef, useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import { frameShiftApi } from "@/lib/api";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

export interface FrameShiftConfigData {
  signalType?: string;
  moduleId?: string;
  status?: string;
  headline?: string;
  brandText?: string;
  badgeText?: string;
  pulseDot?: boolean;
  marqueeTrack1?: string;
  marqueeTrack2?: string;
  modelImage?: string;
  modelAlt?: string;
  modelScale?: number;
  modelOffsetY?: number;
  modelOffsetX?: number;
  sectionBgColor?: string;
  cardBgColor?: string;
  cardTextColor?: string;
  marqueeTextColor?: string;
  marqueeOpacity?: number;
  animationStyle?: "scroll_parallax" | "infinite_marquee" | "float_pulse" | "cinematic_zoom";
  enable3dTilt?: boolean;
  tiltIntensity?: number;
  marqueeSpeed?: number;
  cardShadow?: "dramatic" | "soft" | "glow" | "none";
  isEnabled?: boolean;
}

export const defaultFrameShiftData: FrameShiftConfigData = {
  signalType: "SIGNAL TYPE: NEUTRAL",
  moduleId: "MODULE ID: NRMLSS_001",
  status: "STATUS: DETACHED",
  headline: "DESIGNED ABSENCE,\nENGINEERED SILENCE.",
  brandText: "DRAPZA",
  badgeText: "[ FRAME SHIFT ]",
  pulseDot: true,
  marqueeTrack1: "DESIGNED ABSENCE, ENGINEERED SILENCE",
  marqueeTrack2: "SYNTHETIC FORMS ARCHIVE THE SIGNAL",
  modelImage: "/images/drapza/marquee-banner/marquee_banner_01.png",
  modelAlt: "Drapza model wearing a neutral technical overshirt",
  modelScale: 100,
  modelOffsetY: 0,
  modelOffsetX: 0,
  sectionBgColor: "#fafafa",
  cardBgColor: "#0a0a0a",
  cardTextColor: "#ffffff",
  marqueeTextColor: "#525252",
  marqueeOpacity: 0.7,
  animationStyle: "scroll_parallax",
  enable3dTilt: true,
  tiltIntensity: 16,
  marqueeSpeed: 550,
  cardShadow: "dramatic",
  isEnabled: true,
};

export function FrameShiftSection({
  initialConfig,
}: {
  initialConfig?: FrameShiftConfigData;
}) {
  const [config, setConfig] = useState<FrameShiftConfigData>(initialConfig || defaultFrameShiftData);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Fetch dynamic CMS configuration
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await frameShiftApi.getFrameShiftConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        // Silently use defaults
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll Parallax or Zoom handler
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Progress of section passing through viewport (0 to 1)
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      setScrollProgress(clampedProgress);

      const speed = config.marqueeSpeed || 550;

      if (config.animationStyle === "scroll_parallax" || !config.animationStyle) {
        if (track1Ref.current) {
          const offset1 = -clampedProgress * speed;
          track1Ref.current.style.transform = `translate3d(${offset1}px, 0, 0)`;
        }
        if (track2Ref.current) {
          const offset2 = (clampedProgress - 0.5) * speed;
          track2Ref.current.style.transform = `translate3d(${offset2}px, 0, 0)`;
        }
      } else if (config.animationStyle === "cinematic_zoom") {
        if (cardRef.current) {
          const zoomScale = 0.94 + clampedProgress * 0.12;
          cardRef.current.style.transform = `scale3d(${zoomScale}, ${zoomScale}, 1)`;
        }
      }
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [config.animationStyle, config.marqueeSpeed]);

  // 3D Cursor Tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!config.enable3dTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const intensity = config.tiltIntensity || 16;
    cardRef.current.style.transform = `perspective(1000px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
  };

  if (config.isEnabled === false) {
    return null;
  }

  const headlineLines = (config.headline || "DESIGNED ABSENCE,\nENGINEERED SILENCE.").split("\n");

  const shadowClasses = {
    dramatic: "shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)]",
    soft: "shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3)]",
    glow: "shadow-[0_0_50px_rgba(255,255,255,0.15)]",
    none: "shadow-none",
  }[config.cardShadow || "dramatic"] || "shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)]";

  return (
    <section
      ref={sectionRef}
      style={{ backgroundColor: config.sectionBgColor || "#fafafa" }}
      className="relative flex min-h-[85vh] md:min-h-[92vh] items-center justify-center overflow-hidden py-16 sm:py-20 md:py-24 transition-colors duration-500 select-none"
    >
      {/* Outer Telemetry Tag - Top Left */}
      {config.signalType && (
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 pointer-events-none">
          <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.25em] text-black font-bold flex items-center gap-2">
            {config.pulseDot !== false && (
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            )}
            {config.signalType}
          </span>
        </div>
      )}

      {/* Outer Telemetry Tag - Top Right */}
      {config.moduleId && (
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20 pointer-events-none">
          <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.25em] text-black font-bold">
            {config.moduleId}
          </span>
        </div>
      )}

      {/* Outer Telemetry Tag - Bottom Left */}
      {config.status && (
        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10 z-20 pointer-events-none">
          <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.25em] text-black font-bold flex items-center gap-2">
            {config.status}
          </span>
        </div>
      )}

      {/* Background Marquee Text Tracks */}
      <div
        style={{ opacity: config.marqueeOpacity ?? 0.7 }}
        className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-6 sm:gap-12 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          ref={track1Ref}
          className={`flex whitespace-nowrap transition-transform duration-75 ease-out will-change-transform ${
            config.animationStyle === "infinite_marquee" ? "animate-marquee" : ""
          }`}
        >
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              style={{ color: config.marqueeTextColor || "#525252" }}
              className="mx-6 font-display text-[clamp(2.2rem,5.5vw,4.8rem)] leading-none uppercase tracking-wider select-none font-thin transition-all duration-300"
            >
              {config.marqueeTrack1 || "DESIGNED ABSENCE, ENGINEERED SILENCE"}
            </span>
          ))}
        </div>
        <div
          ref={track2Ref}
          className={`flex whitespace-nowrap transition-transform duration-75 ease-out will-change-transform ${
            config.animationStyle === "infinite_marquee" ? "animate-marquee-reverse" : ""
          }`}
        >
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              style={{ color: config.marqueeTextColor || "#525252" }}
              className="mx-6 font-display text-[clamp(2.2rem,5.5vw,4.8rem)] leading-none uppercase tracking-wider select-none font-thin transition-all duration-300"
            >
              {config.marqueeTrack2 || "SYNTHETIC FORMS ARCHIVE THE SIGNAL"}
            </span>
          ))}
        </div>
      </div>

      {/* Centered Floating Card */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1800px] items-center justify-center px-4 sm:px-6 md:px-10 my-auto">
        <Reveal variant="scale" className="w-full max-w-[380px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[620px]">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              backgroundColor: config.cardBgColor || "#0a0a0a",
              transition: "transform 0.15s ease-out",
            }}
            className={`relative aspect-[1/1.05] w-full max-h-[62vh] sm:max-h-[68vh] overflow-hidden rounded-2xl sm:rounded-3xl cursor-grab active:cursor-grabbing ${shadowClasses} ${
              config.animationStyle === "float_pulse" ? "animate-pulse" : ""
            }`}
          >
            {/* Layer 1 (BEHIND MODEL): Multi-line Central Headline */}
            <div className="absolute inset-x-0 top-1/4 z-10 text-center px-3 sm:px-5 select-none pointer-events-none">
              <h2
                style={{ color: config.cardTextColor || "#ffffff" }}
                className="font-display text-[clamp(2.2rem,5.2vw,4.2rem)] leading-[0.88] uppercase tracking-tight font-light text-balance drop-shadow-md"
              >
                {headlineLines.map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx < headlineLines.length - 1 && <br />}
                  </span>
                ))}
              </h2>
            </div>

            {/* Layer 2 (IN FRONT OF TEXT): Model Image Cutout */}
            <div className="relative h-full w-full overflow-hidden z-20 flex items-end justify-center pointer-events-none">
              <img
                src={normalizeImageUrl(config.modelImage || "/images/drapza/marquee-banner/marquee_banner_01.png")}
                alt={config.modelAlt || "Drapza Model Cutout"}
                onError={handleImageFallbackError}
                style={{
                  transform: `scale(${(config.modelScale || 100) / 100}) translate(${
                    config.modelOffsetX || 0
                  }px, ${config.modelOffsetY || 0}px)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="h-full w-auto max-w-full object-contain object-bottom"
              />
            </div>

            {/* Layer 3: UI Controls & Telemetry Badges */}
            <div className="absolute inset-0 z-30 flex flex-col justify-between p-5 sm:p-7 select-none pointer-events-none">
              {/* Top Row: Pill Badge */}
              <div className="flex justify-end pt-0.5">
                {config.badgeText && (
                  <span className="font-mono-technical text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                    {config.badgeText}
                  </span>
                )}
              </div>

              {/* Bottom Branding */}
              <div className="flex justify-center pb-0.5">
                {config.brandText && (
                  <span className="font-display text-lg sm:text-2xl tracking-[0.3em] text-white/90 drop-shadow">
                    {config.brandText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
