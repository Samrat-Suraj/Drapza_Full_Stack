"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Lock,
  Unlock,
  Clock,
  Shield,
  Key,
  Check,
  ArrowRight,
  ShoppingBag,
  } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useCart } from "@/context/CartContext";
import { triggerCartFly } from "./CartFlySystem";
import {
  vaultDropsApi,
  VaultDropsConfigData,
  DEFAULT_VAULT_DROPS_CONFIG,
} from "@/lib/api";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

interface VaultDropsSectionProps {
  onReserveSuccess?: () => void;
}

export function VaultDropsSection({ onReserveSuccess }: VaultDropsSectionProps) {
  const [config, setConfig] = useState<VaultDropsConfigData>(DEFAULT_VAULT_DROPS_CONFIG);

  // Countdown Timer state: Drops in 14 hours, 38 mins, 20 secs
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 38,
    seconds: 42,
  });

  const [vipContact, setVipContact] = useState("");
  const [generatedPasscode, setGeneratedPasscode] = useState<string | null>(null);
  const [isReserved, setIsReserved] = useState(false);
  const [allocatedUnits, setAllocatedUnits] = useState(19);

  const { addToCart } = useCart();

  // Load existing passcode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("drapza_vault_passcode");
      if (saved) {
        setGeneratedPasscode(saved);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Fetch live CMS configuration on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await vaultDropsApi.getConfig();
        if (res && res.success && res.data && isMounted) {
          const data = res.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
          }));
          if (data.countdown) {
            setTimeLeft({
              hours: data.countdown.timerHours ?? 14,
              minutes: data.countdown.timerMinutes ?? 38,
              seconds: data.countdown.timerSeconds ?? 42,
            });
          }
          if (data.allocatedUnits !== undefined) {
            setAllocatedUnits(data.allocatedUnits);
          }
        }
      } catch (err) {
        console.error("[VAULT_DROPS_SECTION] Failed to fetch live config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Countdown Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const garment = config.garment || DEFAULT_VAULT_DROPS_CONFIG.garment!;
  const countdown = config.countdown || DEFAULT_VAULT_DROPS_CONFIG.countdown!;
  const vipProtocol = config.vipProtocol || DEFAULT_VAULT_DROPS_CONFIG.vipProtocol!;
  const features = garment.features || [];

  const handleGenerateVipPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipContact.trim()) return;

    audioSystem.playClick(900);
    try {
      const res = await vaultDropsApi.requestVipPasscode(vipContact.trim());
      if (res && res.success && res.data?.passcode) {
        setGeneratedPasscode(res.data.passcode);
        try {
          localStorage.setItem("drapza_vault_passcode", res.data.passcode);
        } catch (e) {}
        return;
      }
    } catch (err) {
      // Local fallback
    }

    const fallbackCode = `VAULT-${Math.floor(1000 + Math.random() * 9000)}-${vipContact.slice(-3).toUpperCase()}`;
    setGeneratedPasscode(fallbackCode);
    try {
      localStorage.setItem("drapza_vault_passcode", fallbackCode);
    } catch (err) {}
  };

  const handleReservePiece = (e: React.MouseEvent) => {
    audioSystem.playClick(950);
    triggerCartFly({ image: garment.image, startX: e.clientX, startY: e.clientY });

    addToCart({
      id: `vault-batch-${config.batchNumber || "004"}-${Date.now()}`,
      name: `${garment.title} [${config.batchNumber || "VAULT BATCH 004"} • SERIAL ALLOCATION]`,
      price: garment.price,
      size: "M",
      color: "STEALTH NOIR",
      image: garment.image,
      quantity: 1,
    });

    setAllocatedUnits((prev) => Math.min(config.totalUnits || 50, prev + 1));
    setIsReserved(true);
    setTimeout(() => {
      setIsReserved(false);
    }, 3000);

    if (onReserveSuccess) onReserveSuccess();
  };

  if (config.isEnabled === false) {
    return null;
  }

  return (
    <section
      id="vault-drops"
      aria-label="The Vault Limited Batch Drops"
      className="relative w-full bg-[#08080a] text-white py-20 sm:py-28 md:py-32 border-t border-neutral-900 overflow-hidden select-none font-mono"
    >
      {/* Background Architectural Watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-[18vw] text-white/[0.015] font-black uppercase pointer-events-none select-none">
        VAULT
      </div>

      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-400 text-xs tracking-[0.25em] uppercase font-semibold">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>{config.sectionTag || "THE VAULT • STRICT MONOCHROME ARCHIVE"}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.16em] text-white font-normal">
              {config.headline || "LIMITED BATCH 004 DROP"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-xl">
              {config.subtext || "Strictly 50 individually serialized garments crafted per drop. Once allocated, patterns are permanently retired into the Drapza archive vault."}
            </p>
          </div>

          {/* Allocation Counter Telemetry */}
          <div className="p-4 bg-[#121316] border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">
              BATCH ALLOCATION STATUS:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {allocatedUnits} / {config.totalUnits || 50} CRAFTED
              </span>
              <span className="px-2 py-0.5 bg-black border border-neutral-700 text-neutral-300 text-[10px] uppercase font-bold">
                {Math.max(0, (config.totalUnits || 50) - allocatedUnits)} REMAINING
              </span>
            </div>
          </div>
        </div>

        {/* Main Vault Stage */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Featured Serialized Garment Card */}
          <div className="lg:col-span-7 bg-[#121316] border border-neutral-700 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-6 relative aspect-[3/4] bg-black border border-neutral-800 overflow-hidden">
                <img
                  src={normalizeImageUrl(garment.image || "")}
                  alt={garment.title}
                  onError={handleImageFallbackError}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-1 bg-black/90 text-[9px] font-bold text-neutral-200 uppercase tracking-widest border border-neutral-800">
                  {garment.serialPrefix || "SERIAL NO. #004-"}{String(allocatedUnits + 1).padStart(3, "0")}
                </span>
              </div>

              <div className="sm:col-span-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">
                    {garment.badge || "EXCLUSIVE BATCH DROP"}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold uppercase text-white tracking-wider">
                    {garment.title || "ARCHITECTURAL KIMONO TRENCH"}
                  </h3>
                  <span className="text-base font-bold text-white block">
                    {garment.priceFormatted || "₹4,850 • 480 GSM"}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-neutral-400 pt-3 border-t border-neutral-800 font-light">
                  {features.map((feat, fIdx) => (
                    <p key={fIdx}>• {feat}</p>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReservePiece}
                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isReserved ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>SERIALIZED ALLOCATION RESERVED</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{garment.buttonText || "RESERVE NEXT ALLOCATION"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Countdown Clock & VIP Passcode Vault Key */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Ticking Countdown Box */}
            <div className="bg-[#121316] border border-neutral-700 p-6 sm:p-8 space-y-4 text-center">
              <span className="text-[10px] text-neutral-400 uppercase tracking-[0.25em] font-bold block">
                {countdown.heading || "GLOBAL PUBLIC ALLOCATION CLOSES IN:"}
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-black border border-neutral-800">
                  <span className="text-3xl sm:text-4xl font-bold text-white block font-mono">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    HOURS
                  </span>
                </div>

                <div className="p-4 bg-black border border-neutral-800">
                  <span className="text-3xl sm:text-4xl font-bold text-white block font-mono">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    MINUTES
                  </span>
                </div>

                <div className="p-4 bg-black border border-neutral-800">
                  <span className="text-3xl sm:text-4xl font-bold text-white block font-mono">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    SECONDS
                  </span>
                </div>
              </div>
            </div>

            {/* VIP Passcode Generator & Verification Form */}
            <div className="bg-[#121316] border border-neutral-700 p-6 sm:p-8 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">
                  {vipProtocol.badge || "VIP EARLY ACCESS PROTOCOL"}
                </span>
                <h3 className="text-sm font-bold uppercase text-white">
                  {vipProtocol.title || "REQUEST BATCH 005 VAULT PASSCODE"}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {vipProtocol.subtext || "Receive a priority cryptographic key for future confidential 480 GSM drops 2 hours ahead of public release."}
                </p>
              </div>

              {generatedPasscode ? (
                <div className="p-4 bg-black border border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase">
                    <span>VIP PASSCODE VERIFIED</span>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white tracking-widest block font-mono">
                    {generatedPasscode}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    ACTIVE FOR UPCOMING VAULT DROPS
                  </span>
                </div>
              ) : (
                <form onSubmit={handleGenerateVipPasscode} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={vipContact}
                    onChange={(e) => setVipContact(e.target.value)}
                    placeholder={vipProtocol.inputPlaceholder || "ENTER EMAIL OR WHATSAPP NUMBER"}
                    className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-3 text-white font-mono text-xs uppercase rounded-none focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors"
                  >
                    {vipProtocol.buttonText || "GENERATE PRIVATE VAULT KEY"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
