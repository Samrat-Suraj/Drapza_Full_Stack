"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  Check,
  Compass,
  Sliders,
  Layers,
  Shield,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useCart } from "@/context/CartContext";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { PRODUCTS_DATA } from "./ProductsSection";
import { triggerCartFly } from "./CartFlySystem";

interface AiStylistQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StylistOption {
  id: string;
  label: string;
  subtext: string;
}

const STEP_1_VIBE: StylistOption[] = [
  {
    id: "brutalist",
    label: "BRUTALIST MINIMALIST",
    subtext: "Raw unadorned geometry, monolithic monochrome presence, zero excess.",
  },
  {
    id: "avant-garde",
    label: "AVANT-GARDE OVERSIZED",
    subtext: "Exaggerated architectural drop shoulders, voluminous flow, 480 GSM drape.",
  },
  {
    id: "sharp-tailored",
    label: "PRECISION ATELIER TAILORING",
    subtext: "Razor-sharp contours, structured collars, heritage zardozi accents.",
  },
];

const STEP_2_OCCASION: StylistOption[] = [
  {
    id: "nocturnal-gala",
    label: "NOCTURNAL GALA & ART SALON",
    subtext: "High-contrast evening presence, structured lighting reflections.",
  },
  {
    id: "high-street-runway",
    label: "METROPOLITAN RUNWAY STREETWEAR",
    subtext: "Daily effortless luxury, fluid movement across urban architectural terrain.",
  },
  {
    id: "executive-atelier",
    label: "EXECUTIVE ATELIER CONSULTATION",
    subtext: "Sophisticated formal authority, quiet luxury silhouette discipline.",
  },
];

const STEP_3_DRAPE: StylistOption[] = [
  {
    id: "heavyweight-box",
    label: "HEAVYWEIGHT BOXY FALL",
    subtext: "Zero body cling, rigid silhouette preservation, heavyweight modal blend.",
  },
  {
    id: "elongated-fluid",
    label: "ELONGATED FLUID SILHOUETTE",
    subtext: "Floor-sweeping asymmetrical lines, kinetic drape response in motion.",
  },
  {
    id: "sculpted-cinched",
    label: "SCULPTED GEOMETRIC FIT",
    subtext: "Bespoke proportion alignment, tapered architectural waistline.",
  },
];

export function AiStylistQuizModal({ isOpen, onClose }: AiStylistQuizModalProps) {
  useLockBodyScroll(isOpen);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedVibe, setSelectedVibe] = useState<string>("brutalist");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("nocturnal-gala");
  const [selectedDrape, setSelectedDrape] = useState<string>("heavyweight-box");
  const [analyzingText, setAnalyzingText] = useState("CALIBRATING SILHOUETTE PARAMETERS");
  const [isAddedToBag, setIsAddedToBag] = useState(false);

  const { addToCart } = useCart();
  const modalCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Analysis Phase
  useEffect(() => {
    if (currentStep === 4) {
      const messages = [
        "PARSING 480 GSM FABRIC TENSIONS...",
        "ALIGNING GEOMETRIC SHOULDER DROP...",
        "OPTIMIZING 3-PIECE CAPSULE HARMONY...",
        "FINALIZING ATELIER CAPSULE LOOK...",
      ];

      let msgIndex = 0;
      const interval = setInterval(() => {
        msgIndex++;
        if (msgIndex < messages.length) {
          setAnalyzingText(messages[msgIndex]);
        }
      }, 600);

      const timer = setTimeout(() => {
        clearInterval(interval);
        audioSystem.playClick(900);
        setCurrentStep(5);
      }, 2400);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [currentStep]);

  // Mouse wheel listener with requestAnimationFrame
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollContainerRef.current;
    const cardEl = modalCardRef.current;
    if (!el || !cardEl) return;

    let target = el.scrollTop;
    let current = el.scrollTop;
    let running = false;
    let animId: number | null = null;

    const loop = () => {
      const diff = target - current;
      if (Math.abs(diff) > 0.5) {
        current += diff * 0.25;
        el.scrollTop = current;
        animId = requestAnimationFrame(loop);
      } else {
        current = target;
        el.scrollTop = target;
        running = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      if (!running) {
        target = el.scrollTop;
        current = el.scrollTop;
        running = true;
        animId = requestAnimationFrame(loop);
      }
      target = Math.max(0, Math.min(max, target + e.deltaY));
    };

    cardEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cardEl.removeEventListener("wheel", onWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, currentStep]);

  // Filter 3 dynamic products based on selections
  const capsuleProducts = PRODUCTS_DATA.slice(0, 3);
  const totalOriginalPrice = capsuleProducts.reduce((sum, p) => sum + (p.numericPrice || 1400), 0);
  const bundleDiscountPrice = Math.round(totalOriginalPrice * 0.85); // 15% Capsule discount

  const handleNextStep = () => {
    audioSystem.playClick(700);
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else if (currentStep === 3) {
      setCurrentStep(4); // Start analysis
    }
  };

  const handleReset = () => {
    audioSystem.playClick(600);
    setCurrentStep(1);
    setIsAddedToBag(false);
  };

  const handleAddCapsuleToBag = (e: React.MouseEvent) => {
    audioSystem.playClick(950);
    triggerCartFly({ image: capsuleProducts[0].image, startX: e.clientX, startY: e.clientY });

    capsuleProducts.forEach((p, idx) => {
      addToCart({
        id: `capsule-${p.id}-${Date.now()}-${idx}`,
        name: `${p.name} (CAPSULE)`,
        price: Math.round((p.numericPrice || 1400) * 0.85),
        size: "M",
        color: "NOIR MONOCHROME",
        image: p.image,
        quantity: 1,
      });
    });

    setIsAddedToBag(true);
    setTimeout(() => {
      setIsAddedToBag(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain font-mono text-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalCardRef}
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl bg-[#141518] border border-neutral-700 shadow-2xl animate-scaleUp my-auto flex flex-col max-h-[90vh] overflow-hidden rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          data-lenis-prevent="true"
          className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 sm:px-7 sm:py-5 shrink-0 bg-[#141518]"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 bg-neutral-900 border border-neutral-700 text-white">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                ATELIER ALGORITHM
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase text-white">
                AI SILHOUETTE & CAPSULE STYLIST
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6 dark-scrollbar min-h-0"
        >
          {/* STEP 1: ARCHITECTURAL VIBE */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  STEP 01 OF 03 • IDENTITY
                </span>
                <h3 className="text-base sm:text-lg font-serif uppercase tracking-wider text-white">
                  SELECT YOUR SILHOUETTE VIBE
                </h3>
                <p className="text-neutral-400 text-xs">
                  How should your garments command the room? Choose the core geometric attitude.
                </p>
              </div>

              <div className="space-y-3">
                {STEP_1_VIBE.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650);
                      setSelectedVibe(opt.id);
                    }}
                    className={`w-full text-left p-4 border transition-all cursor-pointer ${
                      selectedVibe === opt.id
                        ? "bg-white text-black border-white ring-1 ring-white"
                        : "bg-[#18191e] text-white border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-xs">
                        {opt.label}
                      </span>
                      {selectedVibe === opt.id && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                    </div>
                    <p
                      className={`text-[11px] mt-1.5 leading-relaxed ${
                        selectedVibe === opt.id ? "text-neutral-800" : "text-neutral-400"
                      }`}
                    >
                      {opt.subtext}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: OCCASION & PROTOCOL */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  STEP 02 OF 03 • PROTOCOL
                </span>
                <h3 className="text-base sm:text-lg font-serif uppercase tracking-wider text-white">
                  SPECIFY THE ENVIRONMENT
                </h3>
                <p className="text-neutral-400 text-xs">
                  Where will this capsule look be deployed?
                </p>
              </div>

              <div className="space-y-3">
                {STEP_2_OCCASION.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650);
                      setSelectedOccasion(opt.id);
                    }}
                    className={`w-full text-left p-4 border transition-all cursor-pointer ${
                      selectedOccasion === opt.id
                        ? "bg-white text-black border-white ring-1 ring-white"
                        : "bg-[#18191e] text-white border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-xs">
                        {opt.label}
                      </span>
                      {selectedOccasion === opt.id && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                    </div>
                    <p
                      className={`text-[11px] mt-1.5 leading-relaxed ${
                        selectedOccasion === opt.id ? "text-neutral-800" : "text-neutral-400"
                      }`}
                    >
                      {opt.subtext}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DRAPE PHYSICS & PROPORTION */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  STEP 03 OF 03 • DRAPE
                </span>
                <h3 className="text-base sm:text-lg font-serif uppercase tracking-wider text-white">
                  DESIRED FABRIC FALL & WEIGHT
                </h3>
                <p className="text-neutral-400 text-xs">
                  Choose the structural gravity and drape physics of your garment pieces.
                </p>
              </div>

              <div className="space-y-3">
                {STEP_3_DRAPE.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650);
                      setSelectedDrape(opt.id);
                    }}
                    className={`w-full text-left p-4 border transition-all cursor-pointer ${
                      selectedDrape === opt.id
                        ? "bg-white text-black border-white ring-1 ring-white"
                        : "bg-[#18191e] text-white border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-xs">
                        {opt.label}
                      </span>
                      {selectedDrape === opt.id && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                    </div>
                    <p
                      className={`text-[11px] mt-1.5 leading-relaxed ${
                        selectedDrape === opt.id ? "text-neutral-800" : "text-neutral-400"
                      }`}
                    >
                      {opt.subtext}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PROCEDURAL SYNTHESIS (ANALYSIS LOADER) */}
          {currentStep === 4 && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
              <div className="relative w-20 h-20 border-2 border-neutral-800 border-t-white rounded-none animate-spin flex items-center justify-center">
                <Compass className="w-8 h-8 text-neutral-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-[0.25em] font-bold block">
                  SYNTHESIS IN PROGRESS
                </span>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                  {analyzingText}
                </h3>
              </div>

              <div className="w-48 h-1 bg-neutral-900 overflow-hidden">
                <div className="w-full h-full bg-white animate-pulse" />
              </div>
            </div>
          )}

          {/* STEP 5: CURATED 3-PIECE CAPSULE RESULT */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-scaleUp">
              <div className="border border-neutral-800 p-4 bg-[#18191d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block">
                    SYNTHESIS RESULT • CURATED CAPSULE
                  </span>
                  <h3 className="font-serif text-base uppercase text-white font-bold tracking-wider">
                    THE MONOCHROME ARCHITECTURAL SUITE
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Engineered for {selectedVibe.toUpperCase()} • 480 GSM
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-neutral-500 uppercase line-through block">
                    ₹{totalOriginalPrice.toLocaleString("en-IN")}
                  </span>
                  <div className="flex items-center sm:justify-end gap-2">
                    <span className="text-base font-bold text-white">
                      ₹{bundleDiscountPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white text-black uppercase">
                      SAVE 15%
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Pieces Showcase */}
              <div className="space-y-3">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">
                  3 SYNERGISTIC PIECES INCLUDED:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {capsuleProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="bg-[#18191d] border border-neutral-800 p-3 space-y-2 hover:border-neutral-600 transition-colors"
                    >
                      <div className="relative aspect-[3/4] bg-black overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold text-neutral-300">
                          PIECE 0{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase text-white truncate">
                          {p.name}
                        </p>
                        <span className="text-[11px] text-neutral-400 block font-mono">
                          {p.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RE-CALIBRATE</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCapsuleToBag}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isAddedToBag ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ADDED ALL 3 PIECES</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD COMPLETE LOOK TO BAG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (For Steps 1-3) */}
        {currentStep < 4 && (
          <div
            data-lenis-prevent="true"
            className="p-4 sm:px-7 sm:py-4 border-t border-neutral-800 bg-[#101114] flex items-center justify-between gap-3 shrink-0"
          >
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
              CONFIDENTIAL ATELIER PROPRIETARY
            </span>

            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold uppercase cursor-pointer"
                >
                  BACK
                </button>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>{currentStep === 3 ? "SYNTHESIZE CAPSULE" : "CONTINUE"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
