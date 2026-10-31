"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { audioSystem } from "./AudioSystem";

export interface CartFlyOptions {
  startEl?: HTMLElement | null;
  startX?: number;
  startY?: number;
  image?: string;
}

/**
 * Trigger flying garment particle arc into the header bag button.
 * Can be called from any component onClick.
 */
export function triggerCartFly(options: CartFlyOptions) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<CartFlyOptions>("drapza:cart-fly", {
    detail: options,
  });
  window.dispatchEvent(event);
}

export const CartFlySystem: React.FC = () => {
  useEffect(() => {
    const handleFly = (e: CustomEvent<CartFlyOptions>) => {
      const { startEl, startX, startY, image } = e.detail;

      // 1. Calculate origin position
      let originX = window.innerWidth / 2;
      let originY = window.innerHeight / 2;

      if (startEl) {
        const rect = startEl.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
      } else if (startX !== undefined && startY !== undefined) {
        originX = startX;
        originY = startY;
      }

      // 2. Locate target bag button:
      // On mobile screens (< 768px), fly directly into the bottom navigation cart button (#mobile-bottom-cart-btn)
      // On desktop, fly into the bottom-right floating cart button (#floating-bag-button) or header bag (#header-bag-button)
      const isMobile = window.innerWidth < 768;
      const mobileBtn = document.querySelector("#mobile-bottom-cart-btn") as HTMLElement | null;
      const floatingBtn = document.querySelector("#floating-bag-button") as HTMLElement | null;
      const headerBtn = document.querySelector("#header-bag-button") as HTMLElement | null;

      let targetBtn: HTMLElement | null = null;
      if (isMobile && mobileBtn && mobileBtn.offsetParent !== null) {
        targetBtn = mobileBtn;
      } else if (floatingBtn && floatingBtn.offsetParent !== null) {
        targetBtn = floatingBtn;
      } else if (headerBtn && headerBtn.offsetParent !== null) {
        targetBtn = headerBtn;
      } else {
        targetBtn = mobileBtn || floatingBtn || headerBtn;
      }

      let targetX = isMobile ? window.innerWidth * 0.35 : window.innerWidth - 36;
      let targetY = isMobile ? window.innerHeight - 38 : window.innerHeight - 36;

      if (targetBtn) {
        const targetRect = targetBtn.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2;
        targetY = targetRect.top + targetRect.height / 2;
      }

      // 3. Create flying particle element (Prominent luxury preview)
      const particle = document.createElement("div");
      const halfSize = isMobile ? 36 : 52;
      particle.className =
        "pointer-events-none fixed z-[9999] w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-2 border-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(255,255,255,0.7)] overflow-hidden bg-[#0c0c0c] flex items-center justify-center backdrop-blur-md will-change-transform";
      particle.style.left = `${originX - halfSize}px`;
      particle.style.top = `${originY - halfSize}px`;

      if (image) {
        const img = document.createElement("img");
        img.src = image;
        img.alt = "Fly to bag";
        img.className = "w-full h-full object-contain p-1.5 sm:p-2 filter brightness-105";
        particle.appendChild(img);
      } else {
        const dot = document.createElement("div");
        dot.className = "w-5 h-5 rounded-full bg-white animate-ping";
        particle.appendChild(dot);
      }

      document.body.appendChild(particle);

      // 4. Trajectory calculations towards target cart button
      const deltaX = targetX - originX;
      const deltaY = targetY - originY;
      const initialLift = isMobile ? -50 : -80;
      const floatDistanceX = deltaX * 0.22;

      // 5. GSAP Kinetic Flight Animation (Stage 1: Slow Prominent Float -> Stage 2: Fast Dive)
      const tl = gsap.timeline({
        onComplete: () => {
          particle.remove();

          // Target Impact Pulse on cart button
          if (targetBtn) {
            gsap.fromTo(
              targetBtn,
              {
                scale: 1.4,
                rotate: isMobile ? 0 : -10,
                filter: "drop-shadow(0 0 20px rgba(0,0,0,0.6))",
              },
              {
                scale: 1,
                rotate: 0,
                filter: "drop-shadow(0 0 0px rgba(0,0,0,0))",
                duration: 0.45,
                ease: "back.out(3)",
              }
            );

            // Audio feedback on arrival
            audioSystem.playClick(950);
          }
        },
      });

      // ── STAGE 1: POP OUT & SLOW LUXURY FLOAT (0.0s -> 0.55s) ──────────
      // Product expands large so the user clearly sees the garment floating slowly in mid-air
      tl.fromTo(
        particle,
        { scale: 0.35, opacity: 0, rotate: -6 },
        {
          scale: 1.25,
          opacity: 1,
          rotate: 6,
          duration: 0.55,
          ease: "back.out(1.8)",
        },
        0
      );

      tl.to(
        particle,
        {
          x: floatDistanceX,
          y: initialLift,
          duration: 0.55,
          ease: "power1.out",
        },
        0
      );

      // ── STAGE 2: FAST ACCELERATION DIVE INTO FLOATING BAG (0.55s -> 1.15s) ──
      // Speed accelerates rapidly directly into the bottom-right floating bag button
      tl.to(
        particle,
        {
          x: deltaX,
          duration: 0.55,
          ease: "power3.in",
        },
        0.55
      );

      tl.to(
        particle,
        {
          y: deltaY,
          duration: 0.55,
          ease: "power2.in",
        },
        0.55
      );

      // Shrink & get sucked into the floating button
      tl.to(
        particle,
        {
          scale: 0.1,
          rotate: -25,
          duration: 0.55,
          ease: "power2.in",
        },
        0.55
      );

      tl.to(
        particle,
        {
          opacity: 0,
          duration: 0.15,
          ease: "power1.in",
        },
        0.95
      );
    };

    window.addEventListener("drapza:cart-fly", handleFly as EventListener);
    return () => {
      window.removeEventListener("drapza:cart-fly", handleFly as EventListener);
    };
  }, []);

  return null;
};

