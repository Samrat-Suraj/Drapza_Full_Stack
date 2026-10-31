"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Camera, Sliders, Layers, Scissors, MessageSquare } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useAccessibility } from "@/context/AccessibilityContext";

interface FloatingActionsProps {
  onOpenCart: () => void;
  cartCount: number;
  onOpenVisualSearch?: () => void;
  onOpenAiStylist?: () => void;
  onOpenMonogram?: () => void;
  onOpenConcierge?: () => void;
}

export function FloatingActions({
  onOpenCart,
  cartCount,
  onOpenVisualSearch,
  onOpenAiStylist,
  onOpenMonogram,
  onOpenConcierge,
}: FloatingActionsProps) {
  const { openModal } = useAccessibility();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth, { passive: true });
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <aside
      aria-label="Quick Actions"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto select-none"
    >
      {/* AI Silhouette Stylist Trigger */}
      {onOpenAiStylist && (
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(750);
            onOpenAiStylist();
          }}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Launch AI Silhouette and Capsule Stylist"
          data-cursor-label="STYLIST"
          title="AI Silhouette Stylist"
        >
          <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Bespoke Monogram Customizer Trigger */}
      {onOpenMonogram && (
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(700);
            onOpenMonogram();
          }}
          className="hidden md:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Customize Bespoke Monogramming"
          data-cursor-label="STITCH"
          title="Bespoke Monogramming"
        >
          <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Desktop-Only Actions: Accessibility Settings */}
      {isDesktop && (
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(650);
            openModal();
          }}
          className="hidden md:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Open Accessibility and Display Enhancer (Axe-Core Verified)"
          data-cursor-label="A11Y"
          title="Accessibility & Display Settings"
        >
          <Sliders className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Desktop-Only Actions: Visual AI Search Scan */}
      {isDesktop && onOpenVisualSearch && (
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(750);
            onOpenVisualSearch();
          }}
          className="hidden md:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Search garments by image (Visual AI Scan)"
          data-cursor-label="SCAN"
          title="Search Clothes by Image • AI Scan"
        >
          <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* VIP Master Tailor WhatsApp Concierge Button */}
      {onOpenConcierge ? (
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(600);
            onOpenConcierge();
          }}
          className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black hover:bg-neutral-900 text-white border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Chat with Atelier VIP Concierge"
          data-cursor-label="VIP"
          title="VIP Master Tailor Concierge"
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      ) : (
        <a
          href="https://wa.me/918888333038?text=Hello%20Drapza%20Atelier%20Support"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => audioSystem.playClick(600)}
          className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#000000] hover:bg-neutral-900 text-white border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="Chat on WhatsApp support"
          data-cursor-label="CHAT"
          title="Chat on WhatsApp (+91 8888333038)"
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
        </a>
      )}

      {/* Desktop-Only Actions: Floating Bag Button */}
      {isDesktop && (
        <button
          id="floating-bag-button"
          onClick={() => {
            audioSystem.playClick(800);
            onOpenCart();
          }}
          className="hidden md:flex relative items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black text-white shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20 group"
          aria-label={`Open shopping bag, ${cartCount} items in cart`}
          data-cursor-label="BAG"
          title="Open Shopping Bag"
        >
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-white text-black text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-md">
              {cartCount}
            </span>
          )}
        </button>
      )}
    </aside>
  );
}
