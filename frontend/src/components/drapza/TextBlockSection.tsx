"use client";

import { useEffect, useState } from "react";
import { DrapzaSymbol } from "./DrapzaSymbol";
import { Reveal } from "./Reveal";
import { textBlockApi } from "@/lib/api";

export interface TextBlockConfigData {
  headlineLine1?: string;
  headlineLine2?: string;
  paragraph1?: string;
  paragraph2?: string;
  symbolType?: string;
  customSymbolImage?: string;
  showSymbol?: boolean;
  isEnabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

const defaultTextBlockConfig: TextBlockConfigData = {
  headlineLine1: "DESIGNED ABSENCE,",
  headlineLine2: "ENGINEERED SILENCE.",
  paragraph1:
    "Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.",
  paragraph2:
    "No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who frame.",
  symbolType: "drapza_symbol",
  customSymbolImage: "",
  showSymbol: true,
  isEnabled: true,
  backgroundColor: "#0a0a0a",
  textColor: "#ffffff",
};

export function TextBlockSection() {
  const [config, setConfig] = useState<TextBlockConfigData>(defaultTextBlockConfig);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await textBlockApi.getTextBlockConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("[TEXT_BLOCK] Error fetching live config:", err);
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

  const headline1 = config.headlineLine1 || defaultTextBlockConfig.headlineLine1;
  const headline2 = config.headlineLine2 || defaultTextBlockConfig.headlineLine2;
  const p1 = config.paragraph1 || defaultTextBlockConfig.paragraph1;
  const p2 = config.paragraph2 || defaultTextBlockConfig.paragraph2;
  const showSymbol = config.showSymbol !== false;

  return (
    <section
      className="relative flex min-h-[80vh] flex-col justify-between py-16 sm:py-20 md:py-28 transition-colors"
      style={{ backgroundColor: config.backgroundColor || "#0a0a0a" }}
    >
      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col justify-between px-4 sm:px-10 md:px-16 lg:px-20">
        {/* Top Headline */}
        <Reveal variant="up" className="w-full pt-4">
          <h2
            className="font-display text-[clamp(2.2rem,6vw,5.8rem)] leading-[0.88] uppercase tracking-tight font-normal max-w-4xl"
            style={{ color: config.textColor || "#ffffff" }}
          >
            {headline1}
            <br />
            {headline2}
          </h2>
        </Reveal>

        {/* Bottom Content: Symbol on left (col 1-5), Paragraph 1 (col 6-8), Paragraph 2 (col 9-12) */}
        <div className="mt-16 sm:mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-end w-full">
          {/* Symbol at Bottom-Left */}
          <div className="md:col-span-5 lg:col-span-5 flex items-end">
            {showSymbol && (
              <Reveal variant="scale" delay={100}>
                {config.symbolType === "custom_image" && config.customSymbolImage ? (
                  <img
                    src={config.customSymbolImage}
                    alt="Brand Emblem"
                    className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain filter drop-shadow-md"
                  />
                ) : (
                  <DrapzaSymbol className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-[#ECEAE5] stroke-[1.5]" />
                )}
              </Reveal>
            )}
          </div>

          {/* Paragraph 1 - Middle-Right */}
          <div className="md:col-span-3 lg:col-span-3.5">
            <Reveal variant="up" delay={150}>
              <p className="text-xs md:text-sm leading-[1.6] text-neutral-300 font-body">
                {p1}
              </p>
            </Reveal>
          </div>

          {/* Paragraph 2 - Far-Right */}
          <div className="md:col-span-4 lg:col-span-3.5">
            <Reveal variant="up" delay={200}>
              <p className="text-xs md:text-sm leading-[1.6] text-neutral-300 font-body">
                {p2}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
