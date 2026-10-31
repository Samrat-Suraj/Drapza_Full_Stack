"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import {
  testimonialsConfigApi,
  TestimonialsConfigData,
  TestimonialStoryItem,
  DEFAULT_TESTIMONIALS_CONFIG,
} from "@/lib/api";

export type TestimonialStory = TestimonialStoryItem;

export const BOUTIQUE_STORIES: TestimonialStory[] = DEFAULT_TESTIMONIALS_CONFIG.items;

interface TestimonialsSectionProps {
  config?: TestimonialsConfigData;
}

export function TestimonialsSection({ config: propConfig }: TestimonialsSectionProps) {
  const [config, setConfig] = useState<TestimonialsConfigData>(
    propConfig || DEFAULT_TESTIMONIALS_CONFIG
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Sync when propConfig changes
  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
    }
  }, [propConfig]);

  // Fetch from backend API if not provided via props
  useEffect(() => {
    if (propConfig) return;

    let isMounted = true;
    testimonialsConfigApi
      .getTestimonialsConfig()
      .then((res: any) => {
        if (isMounted && res && res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch((err) => {
        console.warn("[TESTIMONIALS] Using default stories:", err);
      });

    const handleConfigUpdate = (e: CustomEvent<TestimonialsConfigData>) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };

    window.addEventListener(
      "drapza_testimonials_updated",
      handleConfigUpdate as EventListener
    );

    return () => {
      isMounted = false;
      window.removeEventListener(
        "drapza_testimonials_updated",
        handleConfigUpdate as EventListener
      );
    };
  }, [propConfig]);

  // Active stories that are enabled
  const activeStories = (config.items || []).filter((s) => s.isActive !== false);
  const total = activeStories.length;

  // Clamp active index if items changed
  useEffect(() => {
    if (total > 0 && activeIndex >= total) {
      setActiveIndex(0);
    }
  }, [total, activeIndex]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    audioSystem.playClick(750, 0.04);
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    audioSystem.playClick(600, 0.04);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleSelect = (idx: number) => {
    audioSystem.playClick(700, 0.03);
    setActiveIndex(idx);
  };

  // Autoplay with auto-pause on hover (controlled by admin config)
  useEffect(() => {
    if (isPaused || total <= 1 || config.autoplay === false) return;
    const intervalTime = config.autoplayInterval || 6000;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isPaused, total, config.autoplay, config.autoplayInterval]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  // If section is disabled by Admin, hide completely
  if (config.isEnabled === false || total === 0) {
    return null;
  }

  return (
    <section
      id="testimonials"
      aria-label="Boutique Stories"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full bg-[#0a0a0c] text-white py-20 sm:py-28 md:py-32 overflow-hidden select-none border-t border-neutral-900"
    >
      {/* Background Ambient Luxury Monochrome Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-white/[0.04] via-neutral-400/[0.02] to-white/[0.04] blur-[120px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          {config.badgeText && (
            <span className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-[0.25em] font-semibold block">
              {config.badgeText}
            </span>
          )}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.18em] text-white font-normal drop-shadow-sm">
            {config.heading || "BOUTIQUE STORIES"}
          </h2>
          <p className="font-mono text-xs sm:text-sm text-neutral-400 font-light tracking-wide">
            {config.subtext || "What boutique owners say about drapza's luxury sewing standards"}
          </p>
          <div className="w-20 sm:w-28 h-[1px] bg-neutral-800 mx-auto mt-4" />
        </div>

        {/* 3D Carousel Stage */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative mt-12 sm:mt-16 md:mt-20 h-[380px] sm:h-[400px] md:h-[420px] flex items-center justify-center perspective-[1200px]"
        >
          {activeStories.map((story, idx) => {
            // Compute relative position offset (-1: left, 0: center, +1: right)
            let offset = idx - activeIndex;
            if (offset < -1 && activeIndex === total - 1 && idx === 0) {
              offset = 1;
            } else if (offset > 1 && activeIndex === 0 && idx === total - 1) {
              offset = -1;
            }

            const isCenter = offset === 0;
            const isLeft = offset === -1 || (offset < 0 && Math.abs(offset) < Math.abs(offset - total));
            const isRight = offset === 1 || (offset > 0 && Math.abs(offset) < Math.abs(offset + total));
            const isVisible = isCenter || isLeft || isRight;

            if (!isVisible) return null;

            // Positioning transforms based on relative offset
            let transformClass = "translate-x-0 scale-100 opacity-100 z-20 pointer-events-auto";
            if (isLeft) {
              transformClass =
                "-translate-x-[55%] sm:-translate-x-[65%] md:-translate-x-[70%] scale-[0.88] opacity-35 hover:opacity-60 z-10 cursor-pointer pointer-events-auto";
            } else if (isRight) {
              transformClass =
                "translate-x-[55%] sm:translate-x-[65%] md:translate-x-[70%] scale-[0.88] opacity-35 hover:opacity-60 z-10 cursor-pointer pointer-events-auto";
            }

            return (
              <div
                key={story.id}
                onClick={() => {
                  if (!isCenter) handleSelect(idx);
                }}
                className={`absolute w-[88vw] max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[500px] transition-all duration-500 ease-out ${transformClass}`}
              >
                {/* Individual Boutique Story Card */}
                <div
                  className={`bg-[#141518] border rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 min-h-[290px] sm:min-h-[310px] md:min-h-[320px] flex flex-col justify-between transition-all duration-300 shadow-2xl ${
                    isCenter
                      ? "border-neutral-700 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/15"
                      : "border-neutral-900 shadow-lg"
                  }`}
                >
                  {/* Card Header: 5 Stars & Optional Badge */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: story.rating || 5 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className="w-4 h-4 fill-white text-white stroke-white drop-shadow-sm"
                          />
                        ))}
                      </div>
                      {story.badge && (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-none bg-black border border-neutral-700 text-neutral-200 font-bold">
                          {story.badge}
                        </span>
                      )}
                    </div>

                    {/* Testimonial Quote Body */}
                    <p className="font-light italic text-sm sm:text-[15px] md:text-base text-neutral-200 leading-relaxed font-sans">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  {/* Card Footer: Author Credentials & Quote Mark */}
                  <div className="pt-6 border-t border-neutral-800 flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-serif text-xs sm:text-sm uppercase tracking-[0.16em] text-white font-bold">
                        {story.name}
                      </h3>
                      <p className="font-mono text-[11px] sm:text-xs text-neutral-400">
                        {story.role}
                        {story.role && story.city ? ", " : ""}
                        {story.city}
                      </p>
                    </div>

                    {/* Closing Quotation Mark */}
                    <span className="font-serif text-3xl sm:text-4xl text-neutral-500/60 select-none leading-none">
                      &#8221;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              aria-label="Previous boutique story"
              onClick={handlePrev}
              className="absolute left-2 xs:left-4 sm:left-8 md:left-14 lg:left-24 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#121316]/90 hover:bg-white text-neutral-300 hover:text-black border border-neutral-800 hover:border-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2]" />
            </button>
          )}

          {/* Right Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              aria-label="Next boutique story"
              onClick={handleNext}
              className="absolute right-2 xs:right-4 sm:right-8 md:right-14 lg:right-24 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#121316]/90 hover:bg-white text-neutral-300 hover:text-black border border-neutral-800 hover:border-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl active:scale-95"
            >
              <ChevronRight className="w-5 h-5 stroke-[2]" />
            </button>
          )}
        </div>

        {/* Bottom Pagination Pill Indicator */}
        {total > 1 && (
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-2">
            {activeStories.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => handleSelect(idx)}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-10 sm:w-12 h-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] rounded-full"
                      : "w-2 sm:w-2.5 h-1 bg-neutral-800 hover:bg-neutral-600 rounded-full"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
