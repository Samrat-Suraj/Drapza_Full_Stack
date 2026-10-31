"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number; // 0 to 1, default 0.35
  textParallax?: boolean;
  className?: string;
  dataCursorLabel?: string;
}

/**
 * MagneticButton: Ultra-luxury tactile magnetic attraction on cursor hover.
 * Hardware-accelerated via GSAP quickTo with elastic spring return.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.35,
  textParallax = true,
  className = "",
  dataCursorLabel,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    // Skip on touch devices or reduced motion
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || prefersReducedMotion) return;

    const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });

    let textXTo: ((value: number) => void) | null = null;
    let textYTo: ((value: number) => void) | null = null;

    if (textParallax && textRef.current) {
      textXTo = gsap.quickTo(textRef.current, "x", { duration: 0.45, ease: "power3.out" });
      textYTo = gsap.quickTo(textRef.current, "y", { duration: 0.45, ease: "power3.out" });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      xTo(deltaX);
      yTo(deltaY);

      if (textXTo && textYTo) {
        textXTo(deltaX * 0.45);
        textYTo(deltaY * 0.45);
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
      if (textXTo && textYTo) {
        textXTo(0);
        textYTo(0);
      }
    };

    btn.addEventListener("mousemove", handleMouseMove);
    btn.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      btn.removeEventListener("mousemove", handleMouseMove);
      btn.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(btn);
      if (textRef.current) {
        gsap.killTweensOf(textRef.current);
      }
    };
  }, [strength, textParallax]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-cursor={dataCursorLabel ? "" : undefined}
      data-cursor-label={dataCursorLabel}
      className={`inline-block will-change-transform ${className}`}
      {...props}
    >
      <span ref={textRef} className="inline-flex items-center justify-center gap-2 will-change-transform w-full h-full">
        {children}
      </span>
    </button>
  );
};

