"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShoppingBag,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowUpRight,
  X,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useCart } from "@/context/CartContext";
import { triggerCartFly } from "./CartFlySystem";
import { PRODUCTS_DATA } from "./ProductsSection";
import { ProductData } from "./ProductQuickViewModal";
import {
  runwayReelsApi,
  RunwayReelsConfigData,
  DEFAULT_RUNWAY_REELS_CONFIG,
  RunwayLookData,
} from "@/lib/api";

type RunwayLook = RunwayLookData;

const RUNWAY_LOOKS: RunwayLook[] = [
  {
    id: "runway-look-1",
    title: "NOCTURNE OVERSIZED TRENCH",
    season: "AUTUMN / WINTER 2026",
    posterImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    modelDetails: "ATELIER RUNWAY • 186 CM • WEARING SIZE L",
    products: [
      {
        id: 1,
        name: "ANARKALI FLUID TRENCH",
        price: 1440,
        priceFormatted: "₹1,440",
        category: "Outerwear",
        image: "/images/drapza/products/product_1.png",
        hotspotTop: 42,
        hotspotLeft: 48,
      },
    ],
  },
  {
    id: "runway-look-2",
    title: "MONOCHROME BRUTALIST SILHOUETTE",
    season: "COUTURE EDITION 004",
    posterImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80",
    modelDetails: "ATELIER RUNWAY • 182 CM • WEARING SIZE M",
    products: [
      {
        id: 2,
        name: "LUCKNOWI GEOMETRIC TUNIC",
        price: 1650,
        priceFormatted: "₹1,650",
        category: "Atelier Tops",
        image: "/images/drapza/products/product_6.png",
        hotspotTop: 36,
        hotspotLeft: 52,
      },
    ],
  },
  {
    id: "runway-look-3",
    title: "HEAVYWEIGHT 480 GSM DRAPE",
    season: "ARCHITECTURAL CAPSULE",
    posterImage: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
    modelDetails: "PARIS SHOWROOM • 188 CM • WEARING SIZE XL",
    products: [
      {
        id: 3,
        name: "ANGRAKHA HEAVYWEIGHT FIT",
        price: 1890,
        priceFormatted: "₹1,890",
        category: "Bespoke Outerwear",
        image: "/images/drapza/products/product_11.png",
        hotspotTop: 48,
        hotspotLeft: 50,
      },
    ],
  },
  {
    id: "runway-look-4",
    title: "SCULPTURAL BESPOKE KIMONO",
    season: "LIMITED ATELIER VAULT",
    posterImage: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80",
    modelDetails: "MILAN ARCHIVE • 184 CM • WEARING SIZE L",
    products: [
      {
        id: 4,
        name: "A-LINE MINIMALIST BLEND",
        price: 1250,
        priceFormatted: "₹1,250",
        category: "Atelier Essentials",
        image: "/images/drapza/products/product_18.png",
        hotspotTop: 50,
        hotspotLeft: 46,
      },
    ],
  },
];

interface RunwayReelsSectionProps {
  onQuickView?: (product: ProductData) => void;
}

export function RunwayReelsSection({ onQuickView }: RunwayReelsSectionProps) {
  const [config, setConfig] = useState<RunwayReelsConfigData>(DEFAULT_RUNWAY_REELS_CONFIG);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeHotspotId, setActiveHotspotId] = useState<number | null>(1);
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await runwayReelsApi.getConfig();
        if (res && res.success && res.data && isMounted) {
          const data = res.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            looks: data.looks && data.looks.length > 0 ? data.looks : prev.looks,
          }));
          if (data.autoplay !== undefined) {
            setIsPlaying(data.autoplay);
          }
        }
      } catch (err) {
        console.error("[RUNWAY_REELS_SECTION] Failed to fetch live config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const looksList = config.looks && config.looks.length > 0 ? config.looks : RUNWAY_LOOKS;
  const safeIndex = Math.min(activeIndex, Math.max(0, looksList.length - 1));
  const currentLook: RunwayLook = looksList[safeIndex] || looksList[0] || RUNWAY_LOOKS[0];

  const handlePrev = useCallback(() => {
    audioSystem.playClick(600);
    setActiveIndex((prev) => (prev - 1 + looksList.length) % looksList.length);
    setActiveHotspotId(null);
  }, [looksList.length]);

  const handleNext = useCallback(() => {
    audioSystem.playClick(750);
    setActiveIndex((prev) => (prev + 1) % looksList.length);
    setActiveHotspotId(null);
  }, [looksList.length]);

  const handleAddToCart = (product: RunwayLook["products"][0], e: React.MouseEvent) => {
    e.stopPropagation();
    audioSystem.playClick(900);
    triggerCartFly({ image: product.image, startX: e.clientX, startY: e.clientY });

    addToCart({
      id: `runway-${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price,
      size: "M",
      color: "NOIR",
      image: product.image,
      quantity: 1,
    });
  };

  const handleOpenQuickView = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    audioSystem.playClick(700);
    const found = PRODUCTS_DATA.find((p) => p.id === productId);
    if (found && onQuickView) {
      onQuickView({
        id: String(found.id),
        name: found.name,
        price: found.price,
        numericPrice: found.numericPrice,
        image: found.image,
        category: found.category || "Atelier Outerwear",
        description: found.description || "Architectural drape crafted with 480 GSM fabric.",
        details: typeof found.details === "string" ? [found.details] : Array.isArray(found.details) ? found.details : ["480 GSM bespoke tailoring"],
      });
    }
  };

  if (config.isEnabled === false) {
    return null;
  }

  return (
    <section
      id="runway-reels"
      aria-label="Runway in Motion"
      className="relative w-full bg-[#fafafb] text-neutral-900 py-20 sm:py-28 md:py-32 border-t border-neutral-200 overflow-hidden select-none font-mono"
    >
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-500 text-xs tracking-[0.25em] uppercase font-semibold">
              <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
              <span>{config.sectionTag || "SHOPPABLE RUNWAY IN MOTION"}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.16em] text-neutral-950 font-normal">
              {config.headline || "ATELIER RUNWAY REELS"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-xl">
              {config.subtext || "Observe architectural fabric motion and silhouettes live. Tap garment hotspots directly to inspect tailoring details and add directly to bag."}
            </p>
          </div>

          {/* Navigation Arrows & Reel Counter */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              LOOK {String(safeIndex + 1).padStart(2, "0")} / {String(looksList.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Runway Look"
                className="w-10 h-10 rounded-none bg-white hover:bg-black text-neutral-800 hover:text-white border border-neutral-300 hover:border-black flex items-center justify-center transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Runway Look"
                className="w-10 h-10 rounded-none bg-white hover:bg-black text-neutral-800 hover:text-white border border-neutral-300 hover:border-black flex items-center justify-center transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Reel Stage & Lookbook Showcase */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Reel Video Stage (Vertical 9:16 Aspect Canvas) */}
          <div className="lg:col-span-7 xl:col-span-6 flex justify-center">
            <div
              onClick={() => {
                if (activeHotspotId !== null) {
                  setActiveHotspotId(null);
                }
              }}
              className="relative w-full max-w-[440px] aspect-[9/15] bg-neutral-950 border border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden group"
            >
              {/* Media Container with Subtle Zoom Effect */}
              {currentLook.videoUrl ? (
                <video
                  src={currentLook.videoUrl}
                  poster={currentLook.posterImage}
                  autoPlay={isPlaying}
                  loop
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isPlaying ? "scale-105" : "scale-100"
                  }`}
                />
              ) : (
                <img
                  src={currentLook.posterImage}
                  alt={currentLook.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isPlaying ? "scale-105" : "scale-100"
                  }`}
                />
              )}

              {/* Overlay Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/35 pointer-events-none" />

              {/* Top Bar: Telemetry & Controls */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
                <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md border border-neutral-200 text-[10px] uppercase font-bold tracking-widest text-neutral-900 shadow-sm">
                  {currentLook.season}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying((p) => !p);
                  }}
                  aria-label={isPlaying ? "Pause motion" : "Play motion"}
                  className="w-8 h-8 rounded-none bg-white/95 hover:bg-black text-neutral-900 hover:text-white border border-neutral-200 backdrop-blur-md flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Interactive Garment Hotspots */}
              {currentLook.products.map((product) => {
                const isActive = activeHotspotId === product.id;
                const isLowerHalf = product.hotspotTop > 55;
                const isFarLeft = product.hotspotLeft < 35;
                const isFarRight = product.hotspotLeft > 65;

                const hAlignClass = isFarLeft
                  ? "left-0 translate-x-0"
                  : isFarRight
                  ? "right-0 translate-x-0 left-auto"
                  : "left-1/2 -translate-x-1/2";

                const caretHClass = isFarLeft
                  ? "left-3"
                  : isFarRight
                  ? "right-3 left-auto"
                  : "left-1/2 -translate-x-1/2";

                return (
                  <div
                    key={product.id}
                    style={{
                      top: `${product.hotspotTop}%`,
                      left: `${product.hotspotLeft}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    {/* Hotspot Pulse Pin */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioSystem.playClick(650);
                        setActiveHotspotId(isActive ? null : product.id);
                      }}
                      className={`relative w-7 h-7 rounded-full text-black flex items-center justify-center shadow-2xl cursor-pointer hover:scale-125 transition-transform ${
                        isActive ? "bg-white ring-2 ring-black/40 scale-110" : "bg-white"
                      }`}
                      title={`View ${product.name}`}
                    >
                      <span className="absolute inset-0 rounded-full bg-white/50 animate-ping pointer-events-none" />
                      <ShoppingBag className="w-3.5 h-3.5 fill-black" />
                    </button>

                    {/* Popover Product Card - Clean White Editorial Look */}
                    {isActive && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-40 w-[260px] xs:w-[270px] max-w-[calc(100vw-3rem)] bg-white/98 backdrop-blur-md border border-neutral-200 p-3 shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all duration-200 ${hAlignClass} ${
                          isLowerHalf ? "bottom-full mb-3" : "top-full mt-3"
                        }`}
                      >
                        {/* Caret pointing to pin */}
                        <div
                          className={`absolute w-2.5 h-2.5 bg-white pointer-events-none ${caretHClass} ${
                            isLowerHalf
                              ? "-bottom-1.5 border-b border-r border-neutral-200 rotate-45"
                              : "-top-1.5 border-t border-l border-neutral-200 rotate-45"
                          }`}
                        />

                        <div className="flex gap-3 items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-16 object-cover border border-neutral-200 shrink-0 bg-neutral-100"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] text-neutral-500 uppercase tracking-widest block font-bold">
                                {product.category}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  audioSystem.playClick(500);
                                  setActiveHotspotId(null);
                                }}
                                className="text-neutral-400 hover:text-neutral-900 p-0.5 -mr-1 transition-colors cursor-pointer"
                                aria-label="Close"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p
                              className="text-xs font-bold uppercase text-neutral-950 truncate"
                              title={product.name}
                            >
                              {product.name}
                            </p>
                            <span className="text-xs font-bold text-neutral-900 block">
                              {product.priceFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200">
                          <button
                            type="button"
                            onClick={(e) => handleOpenQuickView(product.id, e)}
                            className="py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] uppercase font-bold text-center border border-neutral-300 hover:border-neutral-400 cursor-pointer transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> DETAILS
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(product, e)}
                            className="py-1.5 px-2 bg-black hover:bg-neutral-800 text-white text-[10px] uppercase font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <ShoppingBag className="w-3 h-3 fill-white" /> + ADD BAG
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Caption Block (On-video overlay) */}
              <div className="absolute bottom-4 inset-x-4 z-20 space-y-1">
                <span className="text-[10px] text-neutral-300 uppercase tracking-wider block">
                  {currentLook.modelDetails}
                </span>
                <h3 className="font-serif text-lg font-bold uppercase text-white">
                  {currentLook.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Right Column: Garment Architecture Breakdown */}
          <div className="lg:col-span-5 xl:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                LOOK DETAIL SHEET
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl uppercase tracking-wider text-neutral-950">
                {currentLook.title}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-light">
                {currentLook.description || "Tailored for zero restriction and high structural integrity. Engineered with double-needle flatlock seams and heavyweight cotton-modal silk blend."}
              </p>
            </div>

            {/* Garments in this look */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <span className="text-[11px] text-neutral-500 uppercase tracking-widest block font-bold">
                PIECES IN THIS RUNWAY SILHOUETTE:
              </span>

              {currentLook.products.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 flex items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-16 object-cover border border-neutral-200 shrink-0 bg-neutral-100"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                        {item.category}
                      </span>
                      <p className="text-xs sm:text-sm font-bold uppercase text-neutral-950 truncate">
                        {item.name}
                      </p>
                      <span className="text-xs font-bold text-neutral-900 block">
                        {item.priceFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleOpenQuickView(item.id, e)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 hover:border-neutral-400 cursor-pointer transition-colors shadow-sm"
                      title="Inspect Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(item, e)}
                      className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase cursor-pointer transition-colors shadow-sm"
                    >
                      + ADD BAG
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Reel Selector Bar */}
            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <span className="text-[11px] text-neutral-500 uppercase tracking-widest block font-bold">
                SWITCH RUNWAY REEL:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {looksList.map((look, idx) => (
                  <button
                    key={look.id || idx}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650);
                      setActiveIndex(idx);
                      setActiveHotspotId(null);
                    }}
                    className={`relative aspect-[3/4] border overflow-hidden cursor-pointer transition-all ${
                      idx === safeIndex
                        ? "border-black ring-2 ring-black shadow-md"
                        : "border-neutral-300 opacity-60 hover:opacity-100 hover:border-neutral-500"
                    }`}
                  >
                    <img
                      src={look.posterImage}
                      alt={look.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/80 px-1.5 py-0.5 text-white">
                      0{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
