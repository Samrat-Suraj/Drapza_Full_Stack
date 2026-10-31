"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);
  const isMouseDown = useRef(false);
  const currentLabel = useRef("");

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Disable custom cursor on mobile touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Update inner dot immediately for 1:1 precision
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${
          isMouseDown.current ? 0.6 : isHovered.current ? 0 : 1
        })`;
        dotRef.current.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;

      // If inside a modal/dialog (like image cropper or background remover), yield to native OS cursor
      const isInDialog = target?.closest('[role="dialog"]');
      if (isInDialog) {
        if (dotRef.current) dotRef.current.style.opacity = "0";
        if (ringRef.current) ringRef.current.style.opacity = "0";
        return;
      }

      if (dotRef.current) {
        dotRef.current.style.opacity = "1";
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = "1";
      }

      // Detect interactive element under cursor
      const interactiveEl = target?.closest("button, a, input, select, textarea, [data-cursor]");

      if (interactiveEl) {
        isHovered.current = true;
        const label = interactiveEl.getAttribute("data-cursor-label") || "";
        currentLabel.current = label;
      } else {
        isHovered.current = false;
        currentLabel.current = "";
      }

      if (labelRef.current) {
        labelRef.current.innerText = currentLabel.current;
        labelRef.current.style.opacity = currentLabel.current && isHovered.current ? "1" : "0";
      }
    };

    const onMouseDown = () => {
      isMouseDown.current = true;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%) scale(0.6)`;
      }
    };

    const onMouseUp = () => {
      isMouseDown.current = false;
    };

    const onMouseLeave = () => {
      document.documentElement.classList.remove("has-custom-cursor");
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      document.documentElement.classList.add("has-custom-cursor");
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    let lastHoveredState: boolean | null = null;

    // 120fps smooth lerp physics for trailing ring
    const render = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

      if (ringRef.current) {
        const scale = isMouseDown.current
          ? 0.85
          : isHovered.current
          ? 1.5
          : 1;

        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        
        if (lastHoveredState !== isHovered.current) {
          lastHoveredState = isHovered.current;
          if (isHovered.current) {
            ringRef.current.className =
              "pointer-events-none fixed top-0 left-0 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-white text-black mix-blend-difference transition-all duration-200 ease-out will-change-transform";
          } else {
            ringRef.current.className =
              "pointer-events-none fixed top-0 left-0 z-[9999] flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-white bg-white/10 mix-blend-difference transition-all duration-200 ease-out will-change-transform";
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.documentElement.classList.remove("has-custom-cursor");
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Precision Inner Micro Dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] h-2 w-2 rounded-full bg-white mix-blend-difference transition-opacity duration-300 will-change-transform"
        aria-hidden="true"
      />

      {/* Trailing Outer Physics Ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-white bg-white/10 mix-blend-difference transition-opacity duration-300 will-change-transform"
        aria-hidden="true"
      >
        <span
          ref={labelRef}
          className="font-mono-technical text-[9px] font-bold uppercase tracking-wider text-black transition-opacity duration-150 select-none"
        />
      </div>
    </>
  );
}
