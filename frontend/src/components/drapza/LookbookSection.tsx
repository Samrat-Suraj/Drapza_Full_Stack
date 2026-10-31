"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "./Reveal";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, ShoppingBag, Check } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useRouter } from "next/navigation";
import { lookbookApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useToast } from "./ToastNotification";
import { MagneticButton } from "./MagneticButton";
import { triggerCartFly } from "./CartFlySystem";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface LookbookItemData {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag: string;
  fabric: string;
  slug: string;
  edition: string;
  statusTag?: string;
  isActive?: boolean;
}

export interface LookbookConfigData {
  sectionTag?: string;
  headingLine1?: string;
  headingLine2?: string;
  subtext?: string;
  isEnabled?: boolean;
  items?: LookbookItemData[];
}

const DEFAULT_LOOKBOOK_ITEMS: LookbookItemData[] = [
  {
    id: "01",
    title: "KANJIVARAM SILK SAREE",
    subtitle: "SILHOUETTE 01 • SAREE",
    image: "/images/drapza/products/product_18.png",
    tag: "CAMPAIGN LOOK #1",
    fabric: "100% Pure Mulberry Silk with Gold Zari",
    slug: "kanjivaram-pure-silk-saree",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
  {
    id: "02",
    title: "ANARKALI EMBROIDERED KURTI",
    subtitle: "SILHOUETTE 02 • KURTI",
    image: "/images/drapza/products/product_1.png",
    tag: "CAMPAIGN LOOK #2",
    fabric: "Pure Modal Silk with Potli Buttons",
    slug: "anarkali-embroidered-kurti",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
  {
    id: "03",
    title: "HIGH-WAIST RELAXED JEANS",
    subtitle: "SILHOUETTE 03 • JEANS",
    image: "/images/drapza/products/product_11.png",
    tag: "CAMPAIGN LOOK #3",
    fabric: "13.5 oz Organic Cotton Washed Denim",
    slug: "high-waist-relaxed-jeans",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
  {
    id: "04",
    title: "FLARED CHANDERI PALAZZO",
    subtitle: "SILHOUETTE 04 • PALAZZO/BOTTOM",
    image: "/images/drapza/products/product_4.png",
    tag: "CAMPAIGN LOOK #4",
    fabric: "Chanderi Silk-Cotton Blend",
    slug: "flared-pleated-palazzo",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
  {
    id: "05",
    title: "ORGANZA EMBROIDERED DUPATTA",
    subtitle: "SILHOUETTE 05 • DUPATTA",
    image: "/images/drapza/products/product_21.png",
    tag: "CAMPAIGN LOOK #5",
    fabric: "Sheer Organza with Resham Gota Lace",
    slug: "organza-embroidered-dupatta",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
  {
    id: "06",
    title: "FESTIVE SHARARA / LEHENGA SET",
    subtitle: "SILHOUETTE 06 • SHARARA/LEHENGA",
    image: "/images/drapza/products/product_6.png",
    tag: "CAMPAIGN LOOK #6",
    fabric: "Layered Georgette with Mirror-Work Embellishment",
    slug: "layered-georgette-sharara-lehenga",
    edition: "EDITION 01 / 2026",
    statusTag: "IN ARCHIVE",
    isActive: true,
  },
];

export function LookbookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [runwayProgress, setRunwayProgress] = useState(0);
  const router = useRouter();

  const [config, setConfig] = useState<LookbookConfigData>({
    sectionTag: "[ ARCHIVAL LOOKBOOK • SS26 ]",
    headingLine1: "CAMPAIGN",
    headingLine2: "SILHOUETTES.",
    subtext: "Custom engineered architectural drape and technical silhouettes.",
    isEnabled: true,
    items: DEFAULT_LOOKBOOK_ITEMS,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await lookbookApi.getLookbookConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({
            ...prev,
            ...res.data,
            items: res.data.items && res.data.items.length > 0 ? res.data.items : DEFAULT_LOOKBOOK_ITEMS,
          }));
        }
      } catch (err) {
        console.error("[LOOKBOOK_SECTION] Failed to fetch live config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = (config.items || DEFAULT_LOOKBOOK_ITEMS).filter((item) => item.isActive !== false);
  const displayItems = items.length > 0 ? items : DEFAULT_LOOKBOOK_ITEMS;

  // ── GSAP HORIZONTAL RUNWAY SCROLL PINNING (DESKTOP & TABLET >= 768px) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !sectionRef.current || !trackRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const getScrollAmount = () => {
        return -(track.scrollWidth - window.innerWidth + 120);
      };

      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
      });

      const pinTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 1.5, track.scrollWidth - window.innerWidth + 300)}`,
        pin: true,
        animation: tween,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          setRunwayProgress(self.progress);
          const current = Math.min(
            Math.floor(self.progress * displayItems.length),
            displayItems.length - 1
          );
          setActiveIdx(current);
        },
      });

      return () => {
        pinTrigger.kill();
        tween.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, [displayItems.length]);

  if (config.isEnabled === false) {
    return null;
  }

  const handleScroll = (direction: "left" | "right") => {
    audioSystem.playClick(600);
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

    if (isDesktop && sectionRef.current) {
      // On desktop pinning, advance vertical scroll to scrub runway smoothly
      const scrollStep = window.innerHeight * 0.5;
      window.scrollBy({
        top: direction === "left" ? -scrollStep : scrollStep,
        behavior: "smooth",
      });
    } else if (scrollRef.current) {
      // On mobile, smooth native touch scroll
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setActiveIdx((prev) =>
        direction === "left"
          ? Math.max(0, prev - 1)
          : Math.min(displayItems.length - 1, prev + 1)
      );
    }
  };

  const handleCardClick = (slug: string) => {
    audioSystem.playClick(750);
    if (!slug) return;
    if (slug.startsWith("/") || slug.startsWith("http")) {
      router.push(slug);
    } else {
      router.push(`/wardrobe/${slug}`);
    }
  };

  const currentLookNumber = String(Math.min(activeIdx + 1, displayItems.length)).padStart(2, "0");
  const totalLooksNumber = String(displayItems.length).padStart(2, "0");

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const handleQuickAdd = (e: React.MouseEvent, item: LookbookItemData) => {
    e.stopPropagation();
    audioSystem.playClick(900);

    // Trigger Parabolic Flying Particle Arc to Header Bag
    triggerCartFly({
      startEl: e.currentTarget as HTMLElement,
      image: item.image,
    });

    addToCart({
      id: `look-${item.id}`,
      name: item.title,
      price: 1440,
      size: "M",
      color: "MONOCHROME",
      image: item.image,
      quantity: 1,
    });
  };

  return (
    <div className="lookbook-outer-container w-full">
      <section
        id="lookbook"
        ref={sectionRef}
        className="relative bg-[#0a0c09] text-white py-12 sm:py-16 md:py-20 min-h-screen flex flex-col justify-between overflow-hidden border-t border-white/10 select-none"
      >
      {/* Subtle Background Radial Ambient Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-emerald-950/20 blur-[140px]" />

      {/* Top Header Row with Dynamic Tag and Controls */}
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 md:px-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 relative z-10 shrink-0">
        <div>
          <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-200 flex items-center gap-2 mb-2 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {config.sectionTag || "[ ARCHIVAL LOOKBOOK • SS26 ]"}
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,4.8rem)] uppercase leading-[0.88] tracking-tight font-normal text-white">
            {config.headingLine1 || "CAMPAIGN"}
            <br />
            {config.headingLine2 || "SILHOUETTES."}
          </h2>
        </div>

        {/* Controls & Active Counter */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono-technical text-xs text-neutral-200 uppercase tracking-widest hidden sm:inline-block">
              RUNWAY LOOK
            </span>
            <span className="font-mono-technical text-sm font-bold text-white px-2.5 py-1 rounded bg-white/10 border border-white/10">
              {currentLookNumber} / {totalLooksNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <MagneticButton
              strength={0.3}
              onClick={() => handleScroll("left")}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              aria-label="Scroll runway left"
              data-cursor-label="PREV"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-200" />
            </MagneticButton>
            <MagneticButton
              strength={0.3}
              onClick={() => handleScroll("right")}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              aria-label="Scroll runway right"
              data-cursor-label="NEXT"
            >
              <ArrowRight className="h-4 w-4 text-neutral-200" />
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Horizontal Runway Track Viewport (Pinned on Desktop, Native Touch on Mobile) */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto md:overflow-visible no-scrollbar snap-x md:snap-none my-auto py-4 relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div
          ref={trackRef}
          className="flex items-center gap-5 sm:gap-7 md:gap-8 px-4 sm:px-6 md:px-12 will-change-transform flex-nowrap"
        >
          {displayItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handleCardClick(item.slug)}
              className={`group relative h-[460px] xs:h-[500px] sm:h-[560px] lg:h-[590px] w-[270px] xs:w-[300px] sm:w-[360px] lg:w-[400px] rounded-none overflow-hidden bg-[#111111] border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer flex flex-col justify-between p-3.5 sm:p-5 shadow-2xl flex-shrink-0 snap-center ${
                activeIdx === idx ? "ring-1 ring-white/50 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.15)]" : ""
              }`}
              data-cursor-label="VIEW"
            >
              {/* Top Header Row inside Card */}
              <div className="relative z-20 flex items-center justify-between">
                <span className="font-mono-technical text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-neutral-200 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-none border border-white/10 font-medium">
                  {item.tag || `LOOK #${idx + 1}`}
                </span>

                <span className="font-mono-technical text-[8px] sm:text-[9px] uppercase tracking-widest text-neutral-300">
                  {item.edition || "EDITION 01 / 2026"}
                </span>
              </div>

              {/* Centered Silhouette Image with Clean Head-to-Toe Framing */}
              <div className="relative z-10 flex-1 flex items-center justify-center my-2 sm:my-3 overflow-hidden rounded-none bg-gradient-to-b from-[#1c1c1c] to-[#0d0d0d] p-3 sm:p-4 border border-white/5">
                {/* Ambient Center Glow */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                </div>

                <img
                  src={item.image}
                  alt={item.title}
                  className="relative z-10 h-full w-full max-h-[300px] xs:max-h-[340px] sm:max-h-[410px] object-contain object-center filter brightness-[1.03] contrast-[1.02] transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Interactive Pulsing Hotspot Marker */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot((prev) => (prev === item.id ? null : item.id));
                  }}
                >
                  <button
                    type="button"
                    className="relative w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.8)] hover:scale-110 transition-transform cursor-pointer group-hover:animate-bounce"
                    aria-label="Shop look"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-30 pointer-events-none" />
                  </button>

                  {/* Hotspot Floating Popover Card */}
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <span className="font-mono-technical text-[8px] uppercase tracking-widest text-emerald-300 font-bold block">
                      FEATURED SILHOUETTE
                    </span>
                    <p className="font-display text-xs uppercase text-white truncate mt-0.5">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, item)}
                      aria-label={`Quick add ${item.title} to bag`}
                      className="mt-2 w-full py-1 rounded bg-white text-black font-mono-technical text-[9px] uppercase font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShoppingBag className="w-2.5 h-2.5" /> + QUICK BAG
                    </button>
                  </div>
                </div>

                {/* Corner Hover Arrow Indicator */}
                <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Bottom Details Section */}
              <div className="relative z-20 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono-technical text-[10px] uppercase tracking-[0.2em] text-neutral-300 font-medium block">
                      {item.subtitle || `SILHOUETTE 0${idx + 1}`}
                    </span>
                    <h3 className="font-body text-base sm:text-lg uppercase tracking-wider text-white font-semibold mt-0.5 group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <span className="font-mono-technical text-[10px] text-neutral-300 uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1">
                    EXPLORE <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-neutral-300">
                  <span className="font-mono-technical text-[9px] uppercase tracking-wider">
                    {item.fabric || "TECHNICAL LUXURY FABRIC"}
                  </span>
                  <span className="font-mono-technical text-[9px] uppercase text-emerald-300 font-bold">
                    {item.statusTag || "IN ARCHIVE"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Technical Runway Progress Rail (Desktop / Tablet) */}
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 md:px-10 mt-2 sm:mt-4 hidden md:flex items-center justify-between gap-6 border-t border-white/10 pt-4 font-mono-technical text-[10px] text-neutral-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-[0.25em] text-white font-bold">RUNWAY SCRUB</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-200 tracking-wider">
            {Math.round(runwayProgress * 100)}% SCROLLED
          </span>
        </div>

        {/* Dynamic Progress Rail Track */}
        <div className="flex-1 max-w-xl h-1.5 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-400 via-neutral-200 to-white rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            style={{ width: `${Math.max(5, runwayProgress * 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-white font-bold tracking-widest">
          <span>LOOK {currentLookNumber} / {totalLooksNumber}</span>
          <span className="text-emerald-400 font-mono text-[9px] uppercase px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
            {displayItems[activeIdx]?.tag || "CAMPAIGN"}
          </span>
        </div>
      </div>
    </section>
  </div>
  );
}
