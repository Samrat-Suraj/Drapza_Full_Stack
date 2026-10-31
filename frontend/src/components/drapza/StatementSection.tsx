"use client";

import { useEffect, useState } from "react";
import { DrapzaSymbol } from "./DrapzaSymbol";
import { Reveal, useParallax } from "./Reveal";
import { statementApi } from "@/lib/api";

export interface StatementConfigData {
  tag?: string;
  statement?: string;
  badgeEdition?: string;
  badgeCenter?: string;
  badgeTerritories?: string;
  symbolType?: string;
  customSymbolImage?: string;
  showFloatingSymbol?: boolean;
  isEnabled?: boolean;
}

const defaultStatementData: StatementConfigData = {
  tag: "PHILOSOPHY • ZERO FRICTION",
  statement: "OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT.",
  badgeEdition: "[ EDITION 2026 ]",
  badgeCenter: "DRAPZA ATELIER CORE",
  badgeTerritories: "[ ALL TERRITORIES ]",
  symbolType: "drapza_symbol",
  customSymbolImage: "",
  showFloatingSymbol: true,
  isEnabled: true,
};

export function StatementSection() {
  const symbolRef = useParallax<HTMLDivElement>(0.4);
  const [config, setConfig] = useState<StatementConfigData>(defaultStatementData);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await statementApi.getStatementConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("[STATEMENT_SECTION] Failed to fetch live philosophy config:", err);
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
    <section id="about" className="relative overflow-hidden bg-black py-16 sm:py-24 md:py-36 lg:py-44 border-y border-white/10 select-none">
      <div className="pointer-events-none absolute inset-0 bg-halftone-lg opacity-10 scale-110 z-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 sm:px-6 md:px-12">
        <div className="flex flex-col items-center text-center">
          <Reveal variant="fade">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 font-mono-technical text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white">
              <span>{config.tag || "PHILOSOPHY • ZERO FRICTION"}</span>
            </div>
          </Reveal>

          <Reveal variant="up" delay={80} className="w-full">
            <h2 className="mx-auto mt-6 sm:mt-8 max-w-5xl font-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.92] uppercase tracking-normal text-white font-normal text-balance">
              {config.statement || "OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT."}
            </h2>
          </Reveal>

          {config.showFloatingSymbol !== false && (
            <div className="mt-12 sm:mt-16 flex w-full flex-col items-center gap-6 sm:gap-8 md:mt-24">
              <Reveal variant="scale" delay={100}>
                <div ref={symbolRef} className="animate-float p-4 sm:p-6 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                  {config.symbolType === "custom_image" && config.customSymbolImage ? (
                    <img
                      src={config.customSymbolImage}
                      alt="Brand Emblem"
                      className="h-20 w-20 sm:h-28 sm:w-28 object-contain md:h-40 md:w-40 lg:h-48 lg:w-48 filter drop-shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
                    />
                  ) : (
                    <DrapzaSymbol className="h-20 w-20 sm:h-28 sm:w-28 text-white md:h-40 md:w-40 lg:h-48 lg:w-48 filter drop-shadow-[0_10px_30px_rgba(255,255,255,0.15)]" />
                  )}
                </div>
              </Reveal>

              <Reveal variant="up" delay={200}>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono-technical text-[9px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-neutral-300 font-medium">
                  <span>{config.badgeEdition || "[ EDITION 2026 ]"}</span>
                  <span className="hidden xs:inline">•</span>
                  <span className="text-white font-bold">{config.badgeCenter || "DRAPZA ATELIER CORE"}</span>
                  <span className="hidden xs:inline">•</span>
                  <span>{config.badgeTerritories || "[ ALL TERRITORIES ]"}</span>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
