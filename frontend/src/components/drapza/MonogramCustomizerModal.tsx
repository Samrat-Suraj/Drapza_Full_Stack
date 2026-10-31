"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Scissors,
  ShoppingBag,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { useCart } from "@/context/CartContext";
import { triggerCartFly } from "./CartFlySystem";
import { PRODUCTS_DATA } from "./ProductsSection";

interface MonogramCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productImage?: string;
  productPrice?: number;
}

type ThreadColor = "blanc" | "noir" | "platinum";
type Placement = "cuff" | "nape" | "internal_label";
type FontStyle = "serif" | "mono" | "stencil";

export function MonogramCustomizerModal({
  isOpen,
  onClose,
  productName = "ARCHITECTURAL OVERCOAT",
  productImage = "/images/drapza/products/product_1.png",
  productPrice = 1890,
}: MonogramCustomizerModalProps) {
  useLockBodyScroll(isOpen);

  const [monogramText, setMonogramText] = useState("DRAPZA");
  const [threadColor, setThreadColor] = useState<ThreadColor>("blanc");
  const [placement, setPlacement] = useState<Placement>("cuff");
  const [fontStyle, setFontStyle] = useState<FontStyle>("serif");
  const [isSaved, setIsSaved] = useState(false);

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
  }, [isOpen]);

  const handleApplyMonogram = (e: React.MouseEvent) => {
    audioSystem.playClick(900);
    triggerCartFly({ image: productImage, startX: e.clientX, startY: e.clientY });

    addToCart({
      id: `monogram-${Date.now()}`,
      name: `${productName} [MONOGRAM: ${monogramText.toUpperCase()}]`,
      price: productPrice + 250, // Nominal bespoke fee
      size: "M",
      color: "BESPOKE MONOGRAMMED",
      image: productImage,
      quantity: 1,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
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
        {/* Header */}
        <div
          data-lenis-prevent="true"
          className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 sm:px-7 sm:py-5 shrink-0 bg-[#141518]"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 bg-neutral-900 border border-neutral-700 text-white">
              <Scissors className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                BESPOKE ATELIER EMBROIDERY
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase text-white">
                CUSTOM INITIAL MONOGRAMMING
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

        {/* Scrollable Form Body */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6 dark-scrollbar min-h-0"
        >
          {/* Live Stitch Simulation Canvas Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
              <span>LIVE EMBROIDERY SIMULATION</span>
              <span>100% SILK THREAD • TENSION 4.2N</span>
            </div>

            <div className="relative h-44 sm:h-52 w-full bg-[#0d0e11] border border-neutral-700 overflow-hidden flex items-center justify-center p-6 shadow-inner">
              {/* Microscopic Fabric Weave Texture Backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

              {/* Simulated Garment Seam Line */}
              <div className="absolute top-0 bottom-0 left-12 border-l border-dashed border-neutral-800" />
              <div className="absolute top-0 bottom-0 right-12 border-r border-dashed border-neutral-800" />

              {/* Monogram Stitch Badge */}
              <div className="relative z-10 px-6 py-3 border border-neutral-800/80 bg-black/60 shadow-2xl flex flex-col items-center justify-center">
                <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 mb-1 font-mono">
                  {placement.toUpperCase().replace("_", " ")}
                </span>

                <div
                  className={`text-2xl sm:text-3xl font-bold tracking-[0.25em] uppercase select-none transition-all ${
                    fontStyle === "serif"
                      ? "font-serif"
                      : fontStyle === "mono"
                      ? "font-mono"
                      : "font-sans tracking-[0.35em]"
                  } ${
                    threadColor === "blanc"
                      ? "text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
                      : threadColor === "noir"
                      ? "text-neutral-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      : "text-neutral-300 drop-shadow-[0_1px_6px_rgba(200,200,200,0.5)]"
                  }`}
                  style={{
                    textShadow:
                      threadColor === "blanc"
                        ? "0 0 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.9)"
                        : threadColor === "noir"
                        ? "0 0 2px rgba(0,0,0,0.9), 0 2px 4px rgba(255,255,255,0.05)"
                        : "0 0 2px rgba(220,220,220,0.7), 0 2px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {monogramText || "DRAPZA"}
                </div>

                <span className="text-[7px] text-neutral-600 tracking-widest mt-1 block">
                  BESPOKE ATELIER ARCHIVE • MUMBAI
                </span>
              </div>
            </div>
          </div>

          {/* 1. Custom Text Input */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 uppercase font-bold block text-xs">
              MONOGRAM INITIALS OR TEXT (MAX 8 CHARACTERS)
            </label>
            <input
              type="text"
              maxLength={8}
              value={monogramText}
              onChange={(e) => setMonogramText(e.target.value.toUpperCase())}
              placeholder="e.g. V.S. OR DRAPZA"
              className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-3 text-white font-mono tracking-widest text-sm rounded-none focus:outline-none uppercase"
            />
          </div>

          {/* 2. Thread Tone Selection */}
          <div className="space-y-2">
            <span className="text-neutral-300 uppercase font-bold block text-xs">
              THREAD MATERIAL & TONALITY
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "blanc", label: "PURE BLANC", desc: "Surgical White Silk" },
                { id: "noir", label: "MATTE NOIR", desc: "Tonal Stealth Black" },
                { id: "platinum", label: "STERLING PLATINUM", desc: "Metallic Silver Weave" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    setThreadColor(t.id as ThreadColor);
                  }}
                  className={`p-3 border text-left cursor-pointer transition-all ${
                    threadColor === t.id
                      ? "bg-white text-black border-white"
                      : "bg-[#18191d] text-neutral-300 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <span className="font-bold uppercase text-[11px] block">
                    {t.label}
                  </span>
                  <span
                    className={`text-[9px] block mt-1 ${
                      threadColor === t.id ? "text-neutral-700" : "text-neutral-500"
                    }`}
                  >
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Placement Options */}
          <div className="space-y-2">
            <span className="text-neutral-300 uppercase font-bold block text-xs">
              GARMENT ATELIER PLACEMENT
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "cuff", label: "SLEEVE CUFF", desc: "Outer Left Wrist" },
                { id: "nape", label: "COLLAR NAPE", desc: "Back Neckline Center" },
                { id: "internal_label", label: "ATELIER TAG", desc: "Internal Breast Pocket" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    setPlacement(p.id as Placement);
                  }}
                  className={`p-3 border text-left cursor-pointer transition-all ${
                    placement === p.id
                      ? "bg-white text-black border-white"
                      : "bg-[#18191d] text-neutral-300 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <span className="font-bold uppercase text-[11px] block">
                    {p.label}
                  </span>
                  <span
                    className={`text-[9px] block mt-1 ${
                      placement === p.id ? "text-neutral-700" : "text-neutral-500"
                    }`}
                  >
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Typography Style */}
          <div className="space-y-2">
            <span className="text-neutral-300 uppercase font-bold block text-xs">
              TYPOGRAPHIC STITCH STYLE
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "serif", label: "CLASSIC SERIF", desc: "Heritage British Atelier" },
                { id: "mono", label: "BRUTALIST MONO", desc: "Technical Swiss Stature" },
                { id: "stencil", label: "AVANT STENCIL", desc: "Contemporary Industrial" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    setFontStyle(f.id as FontStyle);
                  }}
                  className={`p-3 border text-left cursor-pointer transition-all ${
                    fontStyle === f.id
                      ? "bg-white text-black border-white"
                      : "bg-[#18191d] text-neutral-300 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <span className="font-bold uppercase text-[11px] block">
                    {f.label}
                  </span>
                  <span
                    className={`text-[9px] block mt-1 ${
                      fontStyle === f.id ? "text-neutral-700" : "text-neutral-500"
                    }`}
                  >
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned Action Buttons */}
        <div
          data-lenis-prevent="true"
          className="p-4 sm:px-7 sm:py-4 border-t border-neutral-800 bg-[#101114] flex items-center justify-between gap-3 shrink-0"
        >
          <div>
            <span className="text-[10px] text-neutral-500 uppercase block">
              BESPOKE MONOGRAM CHARGE
            </span>
            <span className="text-sm font-bold text-white">
              +₹250 FLAT EMBROIDERY FEE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold uppercase cursor-pointer transition-colors"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleApplyMonogram}
              className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>EMBROIDERY APPLIED</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD EMBROIDERED PIECE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
