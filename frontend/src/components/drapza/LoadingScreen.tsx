"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { audioSystem } from "./AudioSystem";

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [percent, setPercent] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const handleSkip = () => {
    sessionStorage.setItem("drapza_intro_revealed", "true");
    if (tlRef.current) {
      tlRef.current.kill();
    }
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        yPercent: -100,
        duration: 0.5,
        ease: "power3.inOut",
        onComplete: () => {
          setMounted(false);
        },
      });
    } else {
      setMounted(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenIntro = sessionStorage.getItem("drapza_intro_revealed");
    if (hasSeenIntro) {
      return;
    }

    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!mounted || !overlayRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("drapza_intro_revealed", "true");
          // Final curtain slide-up reveal
          gsap.to(overlayRef.current, {
            yPercent: -100,
            duration: 0.8,
            ease: "power4.inOut",
            onComplete: () => {
              setMounted(false);
            },
          });
        },
      });
      tlRef.current = tl;

      // 1. Initial State
      gsap.set(".reveal-char", { yPercent: 120, opacity: 0 });
      gsap.set(".reveal-meta", { y: 15, opacity: 0 });
      gsap.set(".reveal-sub", { y: 15, opacity: 0 });

      // 2. Play soft audio tick
      audioSystem.playClick(600, 0.03);

      // 3. Counter Animation (0 -> 100)
      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => {
          setPercent(Math.round(counterObj.val));
        },
      }, 0);

      // 4. Progress bar fill
      if (progressLineRef.current) {
        tl.fromTo(
          progressLineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: "power2.inOut" },
          0
        );
      }

      // 5. Meta Label Reveal
      tl.to(
        ".reveal-meta",
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.15
      );

      // 6. Main Brand Letters Staggered Upward Reveal
      tl.to(
        ".reveal-char",
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.06,
          ease: "power4.out",
        },
        0.25
      );

      // 7. Subline & Specifications Reveal
      tl.to(
        ".reveal-sub",
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.6
      );

      // 8. Subtle Exit Fadeout of Text before Curtain Wipe
      tl.to(
        textContainerRef.current,
        {
          opacity: 0,
          y: -25,
          duration: 0.4,
          ease: "power3.in",
        },
        1.4
      );
    }, overlayRef);

    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return null;

  const brandLetters = ["D", "R", "Λ", "P", "Z", "Λ"];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Loading Atelier"
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#08080a] text-white select-none px-6 py-8 sm:px-12 sm:py-12 overflow-hidden will-change-transform"
      aria-hidden="false"
    >
      {/* Background Architectural Grid & Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-halftone opacity-25 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Corner Technical Rulers */}
      <div className="absolute top-6 left-6 text-[9px] font-mono-technical text-neutral-300 uppercase tracking-widest pointer-events-none">
        [SYS • INITIALIZE]
      </div>
      <div className="absolute top-6 right-6 text-[9px] font-mono-technical text-neutral-300 uppercase tracking-widest pointer-events-none">
        [ATELIER 2026]
      </div>

      {/* TOP BAR: Tag & Edition */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="reveal-meta flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neutral-200 font-medium">
            ATELIER ARCHIVE
          </span>
        </div>

        <div className="reveal-meta flex items-center gap-3">
          <span className="hidden sm:inline font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-200">
            EDITION 01 • 480 GSM
          </span>
          <button
            onClick={handleSkip}
            className="cursor-pointer font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.2em] text-neutral-200 hover:text-white px-3 py-1 rounded-full border border-white/15 hover:border-white/40 bg-white/5 backdrop-blur-sm transition-all duration-200"
          >
            SKIP INTRO [ESC] &rarr;
          </button>
        </div>
      </div>

      {/* CENTER: MASSIVE TEXT REVEAL */}
      <div ref={textContainerRef} className="relative z-10 my-auto text-center space-y-6">
        
        {/* Emblem */}
        <div className="reveal-meta flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 bg-white/5 border border-white/15 shadow-2xl backdrop-blur-md flex items-center justify-center">
            <img
              src="/images/drapza/logo-icon-light.png"
              alt="DRAPZA Logo"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Main DRΛPZΛ Letters with Masked Slide Reveal */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 overflow-hidden py-2">
          {brandLetters.map((letter, idx) => (
            <div key={idx} className="overflow-hidden">
              <span className="reveal-char inline-block font-display text-5xl sm:text-7xl md:text-8xl lg:text-[110px] text-white tracking-wider font-bold leading-none transform-gpu">
                {letter}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="overflow-hidden max-w-xl mx-auto">
          <p className="reveal-sub font-mono-technical text-xs sm:text-sm uppercase tracking-[0.45em] text-neutral-300 font-bold leading-relaxed">
            WEAR YOUR STORY
          </p>
        </div>
      </div>

      {/* BOTTOM: REALTIME PROGRESS & LIVE LOG */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between font-mono-technical text-xs uppercase tracking-widest text-neutral-300">
          <span className="reveal-meta">CALIBRATING GARMENT VAULT</span>
          <span className="reveal-meta font-mono text-emerald-400 font-medium tracking-widest">
            {percent < 10 ? `0${percent}` : percent}%
          </span>
        </div>

        {/* Sleek Line Progress Track */}
        <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
          <div
            ref={progressLineRef}
            className="h-full bg-white origin-left transform-gpu"
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono-technical text-neutral-300 uppercase tracking-wider pt-1">
          <span>COORDINATES • 12.9716° N, 77.5946° E</span>
          <span>DRAPZA.COM • ARCHIVE PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
