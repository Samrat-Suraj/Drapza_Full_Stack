"use client";

import { useState, useRef, useEffect } from "react";
import {
  Layers,
  Search,
  Maximize2,
  Sliders,
  Shield,
  Activity,
  ArrowRight,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import {
  fabricGsmApi,
  FabricGsmConfigData,
  GsmTierData,
  DEFAULT_FABRIC_GSM_CONFIG,
} from "@/lib/api";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

const FALLBACK_TIERS: GsmTierData[] = DEFAULT_FABRIC_GSM_CONFIG.tiers || [
  {
    gsm: 180,
    label: "180 GSM • COMMERCIAL STANDARD",
    category: "Mass Market Fast Fashion",
    thickness: "0.42 MM",
    rigidityScore: "32 / 100",
    zeroClingIndex: "POOR ZERO-CLING",
    zeroClingSub: "Prone to static body cling",
    drapeFallAngle: 68,
    description:
      "Standard thin jersey. Prone to wrinkling, structural collapse, and transparent sheen under studio lighting.",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
    threadCount: "180 THREADS / SQ INCH",
    isActive: true,
  },
  {
    gsm: 280,
    label: "280 GSM • PREMIUM STREETWEAR",
    category: "Mid-Tier Luxury Cotton",
    thickness: "0.72 MM",
    rigidityScore: "64 / 100",
    zeroClingIndex: "MODERATE RETENTION",
    zeroClingSub: "Standard structured drape",
    drapeFallAngle: 45,
    description:
      "Acceptable heavyweight cotton. Retains casual structure but degrades in boxy shoulder crispness after initial washes.",
    image:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1200&auto=format&fit=crop&q=80",
    threadCount: "260 THREADS / SQ INCH",
    isActive: true,
  },
  {
    gsm: 480,
    label: "480 GSM • DRAPZA ATELIER STANDARD",
    category: "Bespoke Architectural Double-Weave",
    thickness: "1.28 MM",
    rigidityScore: "96 / 100",
    zeroClingIndex: "MAXIMUM ZERO-CLING",
    zeroClingSub: "Monolithic body separation",
    drapeFallAngle: 22,
    description:
      "Our signature heavyweight French Terry and Modal Silk weave. Delivers sculpted monolithic presence, zero body cling, and lifetime silhouette memory.",
    image:
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200&auto=format&fit=crop&q=80",
    threadCount: "340 THREADS / SQ INCH",
    isActive: true,
  },
];

export function FabricGsmLoupeSection() {
  const [config, setConfig] = useState<FabricGsmConfigData>(DEFAULT_FABRIC_GSM_CONFIG);
  const [selectedGsm, setSelectedGsm] = useState<number>(480);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHoveringLoupe, setIsHoveringLoupe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live CMS configuration on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fabricGsmApi.getConfig();
        if (res && res.success && res.data && isMounted) {
          const data = res.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            tiers: data.tiers && data.tiers.length > 0 ? data.tiers : prev.tiers,
          }));
          if (data.defaultGsm) {
            setSelectedGsm(data.defaultGsm);
          }
        }
      } catch (err) {
        console.error("[FABRIC_GSM_SECTION] Failed to fetch live config:", err);
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

  const activeTiers = (config.tiers && config.tiers.length > 0 ? config.tiers : FALLBACK_TIERS).filter(
    (t) => t.isActive !== false
  );

  const activeTier =
    activeTiers.find((t) => t.gsm === selectedGsm) ||
    activeTiers[activeTiers.length - 1] ||
    FALLBACK_TIERS[2];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  return (
    <section
      id="fabric-gsm-loupe"
      aria-label="Fabric Weight and Loupe Analysis"
      className="relative w-full bg-[#fafafb] text-neutral-900 py-20 sm:py-28 md:py-32 border-t border-neutral-200 overflow-hidden select-none font-mono"
    >
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        {/* Header Block */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-neutral-500 text-xs tracking-[0.25em] uppercase font-semibold">
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>{config.sectionTag || "MATERIAL TACTILE SCIENCE"}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.16em] text-neutral-950 font-normal">
            {config.headline || "480 GSM ARCHITECTURAL DRAPE"}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
            {config.subtext ||
              "We reject fragile fast-fashion fabrics. Compare our 480 GSM double-weave density against commercial standards and inspect thread-level lockstitch alignment."}
          </p>
        </div>

        {/* 2-Column Comparison & Interactive Loupe */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Macro Texture Loupe Stage */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHoveringLoupe(true)}
              onMouseLeave={() => setIsHoveringLoupe(false)}
              className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-300 overflow-hidden cursor-crosshair shadow-lg group select-none"
            >
              {/* Macro Fabric Weave Surface Texture Image */}
              <img
                src={normalizeImageUrl(activeTier.image)}
                alt={activeTier.label}
                onError={handleImageFallbackError}
                className="w-full h-full object-cover transition-all duration-500 ease-out"
              />

              {/* Subtle Textile Texture Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

              {/* Center Crosshair Overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md border border-neutral-200 text-[10px] uppercase font-bold text-neutral-900 shadow-sm flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-neutral-700" />
                  MACRO LOUPE • 4X WEAVE INSPECTOR
                </span>
              </div>

              <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md border border-neutral-200 px-3 py-1.5 shadow-sm space-y-0.5">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest block font-bold">
                  THREAD COUNT DENSITY:
                </span>
                <span className="text-xs font-bold uppercase text-neutral-950 font-mono">
                  {activeTier.threadCount}
                </span>
              </div>

              {/* Floating Magnifying Loupe Following Cursor */}
              {isHoveringLoupe && (
                <div
                  style={{
                    top: `${mousePos.y}%`,
                    left: `${mousePos.x}%`,
                  }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border-2 border-black bg-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden z-30 ring-4 ring-white/80"
                >
                  {/* Magnified Image */}
                  <img
                    src={normalizeImageUrl(activeTier.image)}
                    alt=""
                    onError={handleImageFallbackError}
                    style={{
                      transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    }}
                    className="w-full h-full object-cover scale-[3.5]"
                  />
                  {/* Loupe Crosshair Lines */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-black/40" />
                    <div className="h-full w-[1px] bg-black/40 absolute" />
                    <div className="w-6 h-6 rounded-full border border-black/40 absolute" />
                  </div>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white uppercase bg-black/90 px-2 py-0.5 tracking-wider shadow-sm">
                    4X OPTICAL ZOOM
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              MOVE CURSOR OVER FABRIC SURFACE TO ACTIVATE MICROSCOPIC OPTICAL LOUPE
            </p>
          </div>

          {/* Right Column: Weight Selector & Drape Physics Metrics */}
          <div className="lg:col-span-6 bg-white border border-neutral-200 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">
                  FABRIC WEIGHT CALIBRATOR
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  TAP TO COMPARE
                </span>
              </div>

              {/* GSM Selector Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                {activeTiers.map((tier) => (
                  <button
                    key={tier.gsm}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(600 + tier.gsm / 2);
                      setSelectedGsm(tier.gsm);
                    }}
                    className={`p-3.5 border text-center transition-all cursor-pointer ${
                      selectedGsm === tier.gsm
                        ? "bg-black text-white border-black shadow-md ring-1 ring-black"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <span className="font-bold text-sm sm:text-base block font-mono">
                      {tier.gsm} GSM
                    </span>
                    <span
                      className={`text-[9px] block mt-1 uppercase font-semibold ${
                        selectedGsm === tier.gsm ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      {tier.gsm === 480 ? "ATELIER GRADE" : "RETAIL GRADE"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Tier Explanation */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-bold uppercase text-neutral-950 text-xs">
                    {activeTier.label}
                  </h3>
                  <span className="text-[9px] px-2 py-0.5 bg-black text-white uppercase font-bold shadow-sm">
                    {activeTier.category}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  {activeTier.description}
                </p>
              </div>
            </div>

            {/* Drape Arc Simulation & Metrics Grid */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">
                SILHOUETTE RIGIDITY TELEMETRY
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[9px] text-neutral-500 uppercase block font-semibold">
                    FABRIC THICKNESS
                  </span>
                  <span className="text-sm font-bold text-neutral-950 block font-mono">
                    {activeTier.thickness}
                  </span>
                  <span className="text-[9px] text-neutral-400 block">
                    Heavy gauge microns
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[9px] text-neutral-500 uppercase block font-semibold">
                    RIGIDITY SCORE
                  </span>
                  <span className="text-sm font-bold text-neutral-950 block font-mono">
                    {activeTier.rigidityScore}
                  </span>
                  <span className="text-[9px] text-neutral-400 block">
                    Structural memory
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[9px] text-neutral-500 uppercase block font-semibold">
                    ZERO-CLING INDEX
                  </span>
                  <span className="text-xs font-bold text-neutral-950 block font-mono">
                    {activeTier.zeroClingIndex}
                  </span>
                  <span className="text-[9px] text-neutral-400 block truncate">
                    {activeTier.zeroClingSub}
                  </span>
                </div>
              </div>

              {/* Drape Stiffness Visual Curve */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-neutral-600 uppercase font-semibold">
                  <span>GRAVITATIONAL DRAPE DEFLECTION</span>
                  <span className="font-mono text-neutral-950">{activeTier.drapeFallAngle}° ANGULAR SAG</span>
                </div>
                <div className="w-full bg-neutral-200 h-2 overflow-hidden rounded-none">
                  <div
                    style={{
                      width: `${100 - activeTier.drapeFallAngle}%`,
                    }}
                    className="h-full bg-black transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
