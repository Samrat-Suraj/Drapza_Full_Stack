"use client";

import { useEffect, useState } from "react";
import { Reveal, useParallax } from "./Reveal";
import { ctaApi } from "@/lib/api";

export interface CtaConfigData {
  headingLine1?: string;
  headingLine2?: string;
  headingLine3?: string;
  editorialText?: string;
  leftImage?: string;
  leftImageAlt?: string;
  centerImage?: string;
  centerImageAlt?: string;
  rightImage?: string;
  rightImageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
  isEnabled?: boolean;
}

export const defaultCtaConfig: CtaConfigData = {
  headingLine1: "A FIELD TEST",
  headingLine2: "IN",
  headingLine3: "SILHOUETTES",
  editorialText: "Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion.",
  leftImage: "/images/drapza/cta/cta_img_01.jpg",
  leftImageAlt: "Drapza oversized overshirt from the back",
  centerImage: "/images/drapza/cta/cta_img_02.jpg",
  centerImageAlt: "Two Drapza models in neutral field-test silhouettes",
  rightImage: "/images/drapza/cta/cta_img_03.jpg",
  rightImageAlt: "Drapza modular garment detail",
  ctaText: "Explore Products",
  ctaLink: "#products",
  isEnabled: true,
};

export function CtaSection() {
  const [config, setConfig] = useState<CtaConfigData>(defaultCtaConfig);
  const leftRef = useParallax<HTMLDivElement>(0.25);
  const centerRef = useParallax<HTMLDivElement>(0.1);
  const rightRef = useParallax<HTMLDivElement>(0.35);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await ctaApi.getCtaConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("[CTA] Error loading live silhouettes config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  if (config.isEnabled === false) {
    return null;
  }

  return (
    <section id="cta" className="relative overflow-hidden bg-white py-20 sm:py-24 md:py-32 min-h-[95vh] flex flex-col justify-center border-t border-neutral-200">

      {/* Editorial Copy — Positioned at Bottom-Left */}
      {config.editorialText && (
        <div className="absolute left-[3%] bottom-[6%] z-10 hidden sm:block max-w-[170px]">
          <Reveal variant="up">
            <p className="font-body text-xs text-neutral-800 font-medium leading-snug whitespace-pre-line">
              {config.editorialText}
            </p>
          </Reveal>
        </div>
      )}

      {/* Main Container */}
      <div className="relative mx-auto max-w-[1800px] w-full px-4 sm:px-8 md:px-12 flex flex-col items-center">

        {/* 1. Heading — Fully visible, centered, overlapping main card */}
        <Reveal variant="up" className="relative z-30 text-center pointer-events-none mb-4 sm:mb-[-3.5rem] md:mb-[-4.5rem]">
          <h2 className="font-display text-[clamp(2.2rem,5.5vw,5.2rem)] leading-[0.88] tracking-tight text-black font-light uppercase text-balance">
            {config.headingLine1 || "A FIELD TEST"}
            {config.headingLine2 && (
              <>
                <br />
                {config.headingLine2}
              </>
            )}
            {config.headingLine3 && (
              <>
                <br />
                {config.headingLine3}
              </>
            )}
          </h2>
        </Reveal>

        {/* 2. Three Card Composition Grid / Layering */}
        <div className="relative w-full max-w-[1200px] flex flex-col items-center justify-center">

          {/* Left Side Small Card (Floating on desktop) */}
          <div className="hidden md:block md:absolute md:left-0 md:top-[2%] z-10 w-full max-w-[280px] md:w-[155px] lg:w-[185px]">
            <Reveal variant="fade">
              <div
                ref={leftRef}
                className="w-full h-[220px] sm:h-[260px] lg:h-[320px] overflow-hidden rounded-xl bg-neutral-100 shadow-md border border-neutral-200"
              >
                <img
                  src={config.leftImage || "/images/drapza/cta/cta_img_01.jpg"}
                  alt={config.leftImageAlt || "Drapza oversized overshirt from the back"}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>

          {/* Main Center Card (Full Body Model Silhouette, Large Format) */}
          <Reveal variant="scale" delay={100} className="relative z-20 w-full max-w-[780px]">
            <div
              ref={centerRef}
              className="w-full aspect-[3/4] sm:aspect-[4/5] max-h-[840px] overflow-hidden rounded-2xl bg-neutral-100 shadow-2xl border border-neutral-200"
            >
              <img
                src={config.centerImage || "/images/drapza/cta/cta_img_02.jpg"}
                alt={config.centerImageAlt || "Two Drapza models in neutral field-test silhouettes"}
                className="h-full w-full object-cover object-center transform-none"
                loading="lazy"
              />
            </div>
          </Reveal>

          {/* Right Side Small Card (Floating on desktop) */}
          <div className="hidden md:block md:absolute md:right-0 md:top-[28%] z-10 w-full max-w-[280px] md:w-[155px] lg:w-[185px]">
            <Reveal variant="fade" delay={200}>
              <div
                ref={rightRef}
                className="w-full h-[220px] sm:h-[260px] lg:h-[320px] overflow-hidden rounded-xl bg-neutral-100 shadow-md border border-neutral-200"
              >
                <img
                  src={config.rightImage || "/images/drapza/cta/cta_img_03.jpg"}
                  alt={config.rightImageAlt || "Drapza modular garment detail"}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>

          {/* Mobile Detail Cards Row (Side-by-Side below main image) */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-[780px] mt-3 md:hidden">
            <div className="h-[140px] xs:h-[180px] overflow-hidden rounded-xl bg-neutral-100 shadow-md border border-neutral-200">
              <img
                src={config.leftImage || "/images/drapza/cta/cta_img_01.jpg"}
                alt={config.leftImageAlt || "Detail 1"}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            </div>
            <div className="h-[140px] xs:h-[180px] overflow-hidden rounded-xl bg-neutral-100 shadow-md border border-neutral-200">
              <img
                src={config.rightImage || "/images/drapza/cta/cta_img_03.jpg"}
                alt={config.rightImageAlt || "Detail 2"}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>

        </div>

        {/* Explore Products Action Link */}
        <Reveal variant="up" delay={150} className="mt-8 sm:mt-12 relative z-30">
          <a
            href={config.ctaLink || "#products"}
            className="inline-block rounded-full border border-black px-8 py-3.5 font-mono-technical text-xs uppercase tracking-[0.2em] text-black font-medium transition-colors hover:bg-black hover:text-white shadow-sm"
          >
            {config.ctaText || "Explore Products"}
          </a>
        </Reveal>

      </div>
    </section>
  );
}
