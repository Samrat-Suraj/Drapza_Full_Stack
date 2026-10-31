"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { countdownApi } from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SaleCountdownConfigData {
  badgeText?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  seasonTag?: string;
  modelImage?: string;
  imageFit?: string;
  socialHandle?: string;
  brandTag?: string;
  description?: string;
  circularBadgeText?: string;
  ctaText?: string;
  ctaLink?: string;
  discountPercent?: number;
  targetEndDate?: string | Date;
  isEnabled?: boolean;
}

export const defaultCountdownConfig: SaleCountdownConfigData = {
  badgeText: "SUMMER PREMIUM SALE",
  headlineLine1: "Flat 40% Off +",
  headlineLine2: "Free Shipping",
  seasonTag: "AUTUMN SEASON • MONOCHROME",
  modelImage: "/images/drapza/products/product_1.png",
  imageFit: "contain",
  socialHandle: "FOLLOW US: @DRAPZACLOTH",
  brandTag: "DRAPZA ATELIER NOIR",
  description:
    "Get additional discount benefits by stacking multiple luxury custom fits. Perfect opportunity to replenish your boutique wardrobe with trending 2026 drapza designs.",
  circularBadgeText: "FIND YOUR FIT • MONOCHROME DROP • ",
  ctaText: "EXPLORE SALE ITEMS",
  ctaLink: "#products",
  discountPercent: 40,
  targetEndDate: "2026-10-31T00:00:00.000Z",
  isEnabled: true,
};

export function SaleCountdownSection() {
  const [config, setConfig] = useState<SaleCountdownConfigData>(defaultCountdownConfig);
  const sectionRef = useRef<HTMLElement>(null);
  const badgeSvgRef = useRef<SVGSVGElement>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 1,
    minutes: 16,
    seconds: 50,
    isExpired: false,
  });

  // Scroll-driven rotation for the circular badge
  useEffect(() => {
    if (typeof window === "undefined" || !badgeSvgRef.current || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(badgeSvgRef.current, {
        rotation: 720,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Fetch live CMS configuration
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await countdownApi.getCountdownConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("[COUNTDOWN] Error loading live countdown config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time ticking countdown calculation
  useEffect(() => {
    const calculateTime = () => {
      const targetTime = config.targetEndDate ? new Date(config.targetEndDate).getTime() : Date.now() + 86400000;
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.targetEndDate]);

  const handleScrollTo = (target: string) => {
    audioSystem.playClick(700);
    if (!target) return;
    const el = document.querySelector(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (config.isEnabled === false) {
    return null;
  }

  const formatUnit = (num: number) => String(num).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      id="sale-countdown"
      className="relative overflow-hidden bg-[#070809] py-12 sm:py-20 px-3 sm:px-6 md:px-10"
    >
      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Main 2-Column High-Contrast Black & White Ticket Voucher Banner */}
        <div className="rounded-none overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-white/15 bg-black relative">

          {/* ========================================================================= */}
          {/* LEFT SIDE: MONOCHROME EDITORIAL PHOTO & SERIF HEADLINE (~58% width) */}
          {/* ========================================================================= */}
          <div className="relative lg:w-[58%] min-h-[460px] sm:min-h-[520px] md:min-h-[560px] flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-hidden select-none bg-black">
            {/* Full High-Fidelity Model Image with 100% Uncropped Full Fit */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-end md:justify-center overflow-hidden bg-black">
              <img
                src={normalizeImageUrl(config.modelImage || "/images/drapza/products/product_1.png")}
                alt="Sale Banner"
                onError={handleImageFallbackError}
                className={`w-full h-full filter contrast-[1.08] brightness-[0.95] transition-transform duration-700 hover:scale-105 ${config.imageFit === "cover"
                    ? "object-cover object-center"
                    : config.imageFit === "top"
                      ? "object-cover object-top"
                      : "object-contain object-right md:object-center"
                  }`}
              />
            </div>

            {/* Subtle Vignette on Bottom for Crisp Headline Text Legibility while keeping the model's full face and outfit 100% visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Top Row: Empty Left + Rotating Circular Monochrome Badge on Top-Right */}
            <div className="relative z-10 flex items-start justify-between">
              <div />
              {/* Rotating Circular Text Badge */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <svg
                  ref={badgeSvgRef}
                  className="w-full h-full text-white opacity-90 will-change-transform"
                  viewBox="0 0 100 100"
                >
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text className="text-[9.5px] font-mono tracking-[0.22em] uppercase fill-white font-semibold">
                    <textPath href="#circlePath" startOffset="0%">
                      {config.circularBadgeText || "FIND YOUR FIT • MONOCHROME DROP • "}
                    </textPath>
                  </text>
                </svg>
                {/* Center white dot */}
                <div className="absolute w-2 h-2 rounded-full bg-white shadow-lg" />
              </div>
            </div>

            {/* Decorative Floating Monochrome Botanical Leaf Accents */}
            <div className="pointer-events-none absolute bottom-6 left-6 opacity-20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
            </div>
            <div className="pointer-events-none absolute bottom-10 right-10 opacity-15">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
            </div>

            {/* Bottom-Left Typography Content */}
            <div className="relative z-10 space-y-3 pt-12">
              {/* Pill Badge */}
              <div className="inline-block">
                <span className="px-4 py-1.5 rounded-full border border-white/40 bg-black/60 backdrop-blur-md text-[10px] sm:text-xs font-mono-technical font-bold tracking-[0.2em] text-white uppercase shadow-lg">
                  {config.badgeText || "SUMMER PREMIUM SALE"}
                </span>
              </div>

              {/* Giant Pure White Luxury Hero Display Headline */}
              <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] leading-[0.92] text-white uppercase tracking-tight drop-shadow-xl">
                <span className="block">{config.headlineLine1 || "Flat 40% Off +"}</span>
                <span className="block text-neutral-200">{config.headlineLine2 || "Free Shipping"}</span>
              </h2>

              {/* Sub-tag */}
              <div className="pt-1">
                <span className="font-mono-technical text-xs sm:text-sm uppercase tracking-[0.3em] text-neutral-300 font-bold">
                  {config.seasonTag || "AUTUMN SEASON • MONOCHROME"}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDE: HIGH-CONTRAST STARK WHITE / NOIR TICKET CARD (~42% width) */}
          {/* ========================================================================= */}
          <div className="lg:w-[42%] bg-white text-black p-8 sm:p-10 md:p-12 flex flex-col justify-between items-center text-center relative select-none">

            {/* CONTINUOUS SCALLOPED WAVY TICKET EDGE (MATCHING SCREENSHOT) */}
            <svg
              className="hidden lg:block absolute top-0 bottom-0 -left-[16px] w-[16px] h-full pointer-events-none z-20"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <pattern id="scallop-edge-pattern" width="16" height="26" patternUnits="userSpaceOnUse">
                  <path
                    d="M 16,0 C 5,0 0,6 0,13 C 0,20 5,26 16,26 Z"
                    fill="#ffffff"
                  />
                </pattern>
              </defs>
              <rect x="0" y="0" width="16" height="100%" fill="url(#scallop-edge-pattern)" />
            </svg>

            {/* Top Social Handle */}
            <div className="w-full">
              <span className="font-mono-technical text-[11px] sm:text-xs uppercase tracking-[0.25em] text-black font-bold block">
                {config.socialHandle || "FOLLOW US: @DRAPZACLOTH"}
              </span>
            </div>

            {/* Center Content Section */}
            <div className="my-auto py-6 sm:py-8 space-y-5 max-w-md mx-auto w-full">
              {/* Pill Badge with Flanking Lines */}
              <div className="flex items-center justify-center gap-3 w-full">
                <div className="h-[1px] flex-1 bg-black/20" />
                <div className="px-4 py-1.5 rounded-full border border-black/30 bg-neutral-100 text-xs font-display tracking-[0.2em] text-black font-bold uppercase shadow-sm">
                  <span>{config.brandTag || "DRAPZA ATELIER NOIR"}</span>
                </div>
                <div className="h-[1px] flex-1 bg-black/20" />
              </div>

              {/* Narrative Description */}
              <p className="text-xs sm:text-[13px] text-neutral-900 leading-relaxed font-body max-w-sm mx-auto font-medium">
                {config.description ||
                  "Get additional discount benefits by stacking multiple luxury custom fits. Perfect opportunity to replenish your boutique wardrobe with trending 2026 drapza designs."}
              </p>

              {/* Solid Stark Black CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleScrollTo(config.ctaLink || "#products")}
                  aria-label={config.ctaText || "Explore sale items"}
                  className="rounded-full bg-black hover:bg-neutral-800 text-white px-8 sm:px-10 py-3.5 sm:py-4 font-mono-technical text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <span>{config.ctaText || "EXPLORE SALE ITEMS"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Offer Expiration Clock */}
            <div className="w-full pt-4 border-t border-black/10">
              <span className="text-[10px] font-mono-technical uppercase tracking-[0.25em] text-black font-bold block mb-3">
                OFFER ENDS SOON
              </span>

              {/* 4 Solid Black Box Tiles: DAYS, HRS, MINS, SECS */}
              <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3">
                {[
                  { label: "DAYS", value: formatUnit(timeLeft.days) },
                  { label: "HRS", value: formatUnit(timeLeft.hours) },
                  { label: "MINS", value: formatUnit(timeLeft.minutes) },
                  { label: "SECS", value: formatUnit(timeLeft.seconds) },
                ].map((tile, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-black text-white flex items-center justify-center shadow-xl transition-transform border border-black">
                        <span className="font-display text-base xs:text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
                          {tile.value}
                        </span>
                      </div>
                      <span className="font-mono-technical text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider text-black font-bold mt-1">
                        {tile.label}
                      </span>
                    </div>

                    {tIdx < 3 && (
                      <span className="text-xs xs:text-sm font-extrabold text-black -mt-4 font-mono-technical">
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
