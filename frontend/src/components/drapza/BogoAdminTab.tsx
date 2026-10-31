"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Loader2,
  ArrowUp,
  ArrowDown,
  Tag,
  Percent,
  Layers,
  Eye,
  CheckCircle2,
  Gift,
  HelpCircle,
  Copy,
  X,
  Sliders,
  Minus,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { bogoConfigApi, BogoConfigData, DEFAULT_BOGO_CONFIG, BogoTierData } from "@/lib/api";

interface BogoAdminTabProps {
  config: BogoConfigData;
  setConfig: React.Dispatch<React.SetStateAction<BogoConfigData>>;
  onSaveSuccess?: () => void;
}

export const BogoAdminTab: React.FC<BogoAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customOfferForm, setCustomOfferForm] = useState({
    name: "BUY 2 GET 3 FREE",
    tag: "5 PIECES MEGA PACK",
    buyQty: 2,
    getQty: 3,
    discountPercentage: 60,
    badgeText: "LIMITED EDITION",
    popular: true,
    isActive: true,
  });
  const [selectedPreviewTier, setSelectedPreviewTier] = useState<string>("bogo-1-2");

  // Middle-mouse / Center button & wheel scroll management for modal
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const middleDragStartY = useRef(0);
  const middleDragStartScroll = useRef(0);

  // Lock background / body scroll when any modal is open
  useEffect(() => {
    if (showCustomModal || showResetConfirm) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      const originalOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.body.style.overscrollBehavior = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.overscrollBehavior = originalOverscroll;
      };
    }
  }, [showCustomModal, showResetConfirm]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCustomModal) setShowCustomModal(false);
        if (showResetConfirm) setShowResetConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCustomModal, showResetConfirm]);

  // Wheel event forwarder for modal so center mouse wheel scrolls anywhere on modal
  const handleModalWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (modalBodyRef.current && e.target !== modalBodyRef.current && !modalBodyRef.current.contains(e.target as Node)) {
      modalBodyRef.current.scrollTop += e.deltaY;
    }
  };

  // Center button / middle click drag support
  const handleMiddleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsMiddleDragging(true);
      middleDragStartY.current = e.clientY;
      if (modalBodyRef.current) {
        middleDragStartScroll.current = modalBodyRef.current.scrollTop;
      }
    }
  };

  const handleMiddleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMiddleDragging && modalBodyRef.current) {
      const delta = e.clientY - middleDragStartY.current;
      modalBodyRef.current.scrollTop = middleDragStartScroll.current + delta * 1.5;
    }
  };

  const handleMiddleMouseUp = () => {
    if (isMiddleDragging) {
      setIsMiddleDragging(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(750);

    try {
      const res = await bogoConfigApi.updateBogoConfig(config);
      if (res && res.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("drapza_bogo_config", JSON.stringify(res.data || config));
          window.dispatchEvent(new Event("storage"));
        }
        audioSystem.playSuccess();
        setSaveStatus("BOGO & Bundle Tiers updated and live across all products!");
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus(res?.message || "Failed to update BOGO configuration.");
        audioSystem.playClick(300);
      }
    } catch (err: any) {
      // Save locally if offline or backend fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_bogo_config", JSON.stringify(config));
        window.dispatchEvent(new Event("storage"));
      }
      setSaveStatus("Saved locally (offline mode).");
      audioSystem.playClick(300);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setSaveStatus(null);
    audioSystem.playClick(600);

    try {
      const res = await bogoConfigApi.resetBogoConfig();
      const newConfig = res && res.success && res.data ? res.data : DEFAULT_BOGO_CONFIG;
      setConfig(newConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_bogo_config", JSON.stringify(newConfig));
        window.dispatchEvent(new Event("storage"));
      }
      audioSystem.playSuccess();
      setSaveStatus("Reset to default factory BOGO tiers successfully!");
      setShowResetConfirm(false);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setConfig(DEFAULT_BOGO_CONFIG);
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_bogo_config", JSON.stringify(DEFAULT_BOGO_CONFIG));
        window.dispatchEvent(new Event("storage"));
      }
      setSaveStatus("Reset applied locally.");
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddTier = () => {
    audioSystem.playClick(600);
    const newCount = (config.tiers || []).length + 1;
    const newTier: BogoTierData = {
      id: `bogo-custom-${Date.now()}`,
      name: `BUY 1 GET ${newCount} FREE`,
      tag: `${newCount + 1} PIECES PACK`,
      buyQty: 1,
      getQty: newCount,
      totalQty: newCount + 1,
      discountPercentage: Math.round((newCount / (newCount + 1)) * 100),
      badgeText: `SAVE ${Math.round((newCount / (newCount + 1)) * 100)}%`,
      popular: false,
      isActive: true,
    };

    setConfig((prev) => ({
      ...prev,
      tiers: [...(prev.tiers || []), newTier],
    }));
  };

  const handleDeleteTier = (index: number) => {
    audioSystem.playClick(400);
    setConfig((prev) => ({
      ...prev,
      tiers: (prev.tiers || []).filter((_, i) => i !== index),
    }));
  };

  const handleMoveTier = (index: number, direction: "up" | "down") => {
    audioSystem.playClick(500);
    const tiers = [...(config.tiers || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tiers.length) return;

    const temp = tiers[index];
    tiers[index] = tiers[targetIdx];
    tiers[targetIdx] = temp;

    setConfig((prev) => ({ ...prev, tiers }));
  };

  const handleUpdateTier = (index: number, field: keyof BogoTierData, val: any) => {
    setConfig((prev) => {
      const updated = [...(prev.tiers || [])];
      const tier = { ...updated[index], [field]: val };

      // Auto update totalQty & discountPercentage if buyQty or getQty changed
      if (field === "buyQty" || field === "getQty") {
        const b = field === "buyQty" ? Number(val) : tier.buyQty;
        const g = field === "getQty" ? Number(val) : tier.getQty;
        tier.totalQty = b + g;
        if (tier.totalQty > 0) {
          tier.discountPercentage = Math.round((g / tier.totalQty) * 100);
        }
      }

      updated[index] = tier;
      return { ...prev, tiers: updated };
    });
  };


  const handleDuplicateTier = (index: number) => {
    audioSystem.playClick(600);
    const source = config.tiers[index];
    if (!source) return;
    const duplicate: BogoTierData = {
      ...source,
      id: `bogo-custom-${Date.now()}`,
      name: `${source.name} (COPY)`,
    };
    const updated = [...config.tiers];
    updated.splice(index + 1, 0, duplicate);
    setConfig((prev) => ({ ...prev, tiers: updated }));
    setSaveStatus(`Duplicated tier "${source.name}".`);
  };

  const handleOpenCustomBuilder = (initialBuy = 2, initialGet = 3) => {
    audioSystem.playClick(600);
    const total = initialBuy + initialGet;
    const autoDiscount = Math.round((initialGet / total) * 100);
    setCustomOfferForm({
      name: `BUY ${initialBuy} GET ${initialGet} FREE`,
      tag: `${total} PIECES VALUE PACK`,
      buyQty: initialBuy,
      getQty: initialGet,
      discountPercentage: autoDiscount,
      badgeText: "LIMITED EDITION",
      popular: true,
      isActive: true,
    });
    setShowCustomModal(true);
  };

  const handleCreateCustomOffer = () => {
    audioSystem.playSuccess();
    const total = customOfferForm.buyQty + customOfferForm.getQty;
    const newTier: BogoTierData = {
      id: `bogo-custom-${Date.now()}`,
      name: customOfferForm.name.trim() || `BUY ${customOfferForm.buyQty} GET ${customOfferForm.getQty} FREE`,
      tag: customOfferForm.tag.trim() || `${total} PIECES PACK`,
      buyQty: Math.max(1, customOfferForm.buyQty),
      getQty: Math.max(0, customOfferForm.getQty),
      totalQty: total,
      discountPercentage: customOfferForm.discountPercentage,
      badgeText: customOfferForm.badgeText.trim() || undefined,
      popular: customOfferForm.popular,
      isActive: customOfferForm.isActive,
    };

    setConfig((prev) => ({
      ...prev,
      isEnabled: true,
      tiers: [...(prev.tiers || []), newTier],
    }));

    setShowCustomModal(false);
    setSaveStatus(`Added Custom Offer: "${newTier.name}"! Click 'PUBLISH / SAVE' to make live.`);
  };

  // Sample calculations for live preview with customizable test price
  const [sampleProductPrice, setSampleProductPrice] = useState<number>(1290);

  const applyCampaignPreset = (presetKey: string) => {
    audioSystem.playClick(800);
    if (presetKey === "bogo-1-2") {
      setConfig({
        isEnabled: true,
        sectionTitle: "SPECIAL BUNDLE DEALS • BUY 1 GET 2 FREE",
        sectionSubtitle: "Buy 1 garment and get 2 complimentary pieces with automatic cart discount",
        bannerNotice: "SPECIAL PROMOTION: Buy 1 Get 2 Free across all luxury ensembles!",
        allowColorMix: true,
        allowSizeMix: true,
        tiers: [
          {
            id: "bogo-single",
            name: "1 PIECE (STANDARD)",
            tag: "1 ITEM",
            buyQty: 1,
            getQty: 0,
            totalQty: 1,
            discountPercentage: 0,
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-1-1",
            name: "BUY 1 GET 1 FREE",
            tag: "2 PIECES PACK",
            buyQty: 1,
            getQty: 1,
            totalQty: 2,
            discountPercentage: 50,
            badgeText: "POPULAR",
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-1-2",
            name: "BUY 1 GET 2 FREE",
            tag: "3 PIECES PACK",
            buyQty: 1,
            getQty: 2,
            totalQty: 3,
            discountPercentage: 66,
            badgeText: "BEST DEAL (SAVE 66%)",
            popular: true,
            isActive: true,
          },
        ],
      });
      setSaveStatus("Applied preset: BUY 1 GET 2 FREE! Click 'PUBLISH / SAVE' to make live.");
    } else if (presetKey === "bogo-1-3") {
      setConfig({
        isEnabled: true,
        sectionTitle: "MEGA PROMOTION • BUY 1 GET 3 FREE",
        sectionSubtitle: "Purchase any 1 article and receive 3 complimentary garments immediately",
        bannerNotice: "MEGA PROMOTION: Buy 1 Get 3 Free atelier campaign is currently active!",
        allowColorMix: true,
        allowSizeMix: true,
        tiers: [
          {
            id: "bogo-single",
            name: "1 PIECE (STANDARD)",
            tag: "1 ITEM",
            buyQty: 1,
            getQty: 0,
            totalQty: 1,
            discountPercentage: 0,
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-1-2",
            name: "BUY 1 GET 2 FREE",
            tag: "3 PIECES PACK",
            buyQty: 1,
            getQty: 2,
            totalQty: 3,
            discountPercentage: 66,
            badgeText: "HOT DEAL",
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-1-3",
            name: "BUY 1 GET 3 FREE",
            tag: "4 PIECES PACK",
            buyQty: 1,
            getQty: 3,
            totalQty: 4,
            discountPercentage: 75,
            badgeText: "MAX SAVINGS (75% OFF)",
            popular: true,
            isActive: true,
          },
        ],
      });
      setSaveStatus("Applied preset: BUY 1 GET 3 FREE! Click 'PUBLISH / SAVE' to make live.");
    } else if (presetKey === "bogo-1-1") {
      setConfig({
        isEnabled: true,
        sectionTitle: "EXCLUSIVE BOGO • BUY 1 GET 1 FREE",
        sectionSubtitle: "Double your wardrobe with complimentary 2nd garment on all items",
        bannerNotice: "ATELIER BOGO: Buy 1 Get 1 Free on all luxury products!",
        allowColorMix: true,
        allowSizeMix: true,
        tiers: [
          {
            id: "bogo-single",
            name: "1 PIECE (STANDARD)",
            tag: "1 ITEM",
            buyQty: 1,
            getQty: 0,
            totalQty: 1,
            discountPercentage: 0,
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-1-1",
            name: "BUY 1 GET 1 FREE",
            tag: "2 PIECES PACK",
            buyQty: 1,
            getQty: 1,
            totalQty: 2,
            discountPercentage: 50,
            badgeText: "BUY 1 GET 1 FREE",
            popular: true,
            isActive: true,
          },
        ],
      });
      setSaveStatus("Applied preset: BUY 1 GET 1 FREE! Click 'PUBLISH / SAVE' to make live.");
    } else if (presetKey === "bogo-2-1") {
      setConfig({
        isEnabled: true,
        sectionTitle: "TRIO PACK DEALS • BUY 2 GET 1 FREE",
        sectionSubtitle: "Select 3 pieces and only pay for 2 at checkout",
        bannerNotice: "TRIO OFFER: Buy 2 Get 1 Free on all selections!",
        allowColorMix: true,
        allowSizeMix: true,
        tiers: [
          {
            id: "bogo-single",
            name: "1 PIECE (STANDARD)",
            tag: "1 ITEM",
            buyQty: 1,
            getQty: 0,
            totalQty: 1,
            discountPercentage: 0,
            popular: false,
            isActive: true,
          },
          {
            id: "bogo-2-1",
            name: "BUY 2 GET 1 FREE",
            tag: "3 PIECES TRIO PACK",
            buyQty: 2,
            getQty: 1,
            totalQty: 3,
            discountPercentage: 33,
            badgeText: "MOST POPULAR",
            popular: true,
            isActive: true,
          },
        ],
      });
      setSaveStatus("Applied preset: BUY 2 GET 1 FREE! Click 'PUBLISH / SAVE' to make live.");
    } else if (presetKey === "volume-discount") {
      setConfig({
        isEnabled: true,
        sectionTitle: "MULTI-PIECE BUNDLE SAVINGS",
        sectionSubtitle: "Higher quantity unlocks larger automatic tier discounts",
        bannerNotice: "BUNDLE DISCOUNTS: Save up to 40% with multi-piece bundles!",
        allowColorMix: true,
        allowSizeMix: true,
        tiers: [
          {
            id: "vol-1",
            name: "1 PIECE (STANDARD)",
            tag: "SINGLE ITEM",
            buyQty: 1,
            getQty: 0,
            totalQty: 1,
            discountPercentage: 0,
            popular: false,
            isActive: true,
          },
          {
            id: "vol-2",
            name: "2 PIECES BUNDLE (20% OFF)",
            tag: "DUO PACK",
            buyQty: 2,
            getQty: 0,
            totalQty: 2,
            discountPercentage: 20,
            badgeText: "SAVE 20%",
            popular: false,
            isActive: true,
          },
          {
            id: "vol-3",
            name: "3 PIECES BUNDLE (30% OFF)",
            tag: "TRIO PACK",
            buyQty: 3,
            getQty: 0,
            totalQty: 3,
            discountPercentage: 30,
            badgeText: "POPULAR (SAVE 30%)",
            popular: true,
            isActive: true,
          },
          {
            id: "vol-4",
            name: "4 PIECES BUNDLE (40% OFF)",
            tag: "QUAD PACK",
            buyQty: 4,
            getQty: 0,
            totalQty: 4,
            discountPercentage: 40,
            badgeText: "BEST VALUE (40% OFF)",
            popular: false,
            isActive: true,
          },
        ],
      });
      setSaveStatus("Applied preset: VOLUME TIERED SAVINGS! Click 'PUBLISH / SAVE' to make live.");
    } else if (presetKey === "pause-all") {
      setConfig((prev) => ({ ...prev, isEnabled: false }));
      setSaveStatus("All BOGO promotional offers paused. Click 'PUBLISH / SAVE' to deactivate on live store.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto font-mono text-neutral-900">
      {/* 1. TOP HEADER & STUDIO ACTIONS */}
      <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-none ${config.isEnabled ? "bg-black animate-pulse ring-2 ring-neutral-300" : "bg-neutral-300"}`} />
            <span className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
              {config.isEnabled ? "PROMOTIONAL ENGINE LIVE" : "OFFERS PAUSED"}
            </span>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-black flex items-center gap-2">
            <Tag className="w-5 h-5 text-black" />
            <span>PROMOTIONAL CAMPAIGNS & BOGO ENGINE CMS</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Easily launch, switch, and control any promotional offer across your store (Buy 1 Get 2 Free, Buy 1 Get 3 Free, BOGO, Trio Pack, or Volume Discounts) with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white text-black font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "SAVING..." : "PUBLISH / SAVE"}</span>
          </button>
        </div>
      </div>

      {/* QUICK CAMPAIGN LAUNCHER PRESETS */}
      <div className="p-6 rounded-none bg-black text-white shadow-xl space-y-4 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 flex items-center gap-1.5">
              <span>1-CLICK QUICK CAMPAIGN LAUNCHER</span>
            </span>
            <h3 className="text-sm font-bold uppercase tracking-tight text-white">
              Instant Offer Switcher • Select & Run Any Campaign
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Click any button below to instantly load and configure the offer
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => applyCampaignPreset("bogo-1-2")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 group-hover:bg-black group-hover:text-white font-bold uppercase">
                FLASH
              </span>
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">BUY 1 GET 2 FREE</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">66% Off Tier</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyCampaignPreset("bogo-1-3")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 group-hover:bg-black group-hover:text-white font-bold uppercase">
                MEGA
              </span>
              <Gift className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black" />
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">BUY 1 GET 3 FREE</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">75% Off Tier</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyCampaignPreset("bogo-1-1")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 group-hover:bg-black group-hover:text-white font-bold uppercase">
                CLASSIC
              </span>
              <Tag className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black" />
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">BUY 1 GET 1 FREE</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">50% Off Flat</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyCampaignPreset("bogo-2-1")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 group-hover:bg-black group-hover:text-white font-bold uppercase">
                TRIO
              </span>
              <Layers className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black" />
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">BUY 2 GET 1 FREE</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">33% Off Trio</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyCampaignPreset("volume-discount")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 group-hover:bg-black group-hover:text-white font-bold uppercase">
                TIERED
              </span>
              <Percent className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black" />
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">VOLUME DISCOUNT</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">20% - 40% Off</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCustomBuilder(2, 3)}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-white hover:text-black border border-neutral-700 hover:border-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-white text-black font-bold uppercase">
                CUSTOM
              </span>
            </div>
            <div>
              <span className="font-bold text-[11px] block uppercase leading-tight">CUSTOM BUILDER</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 block mt-0.5">Build Any Offer</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyCampaignPreset("pause-all")}
            className="p-3.5 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer group shadow-sm col-span-2 sm:col-span-3 lg:col-span-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] px-2 py-0.5 rounded-none bg-neutral-800 text-neutral-300 font-bold uppercase">
                PAUSE
              </span>
              <span className="w-2 h-2 rounded-none bg-neutral-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[11px] block uppercase leading-tight">PAUSE / STOP PROMOTIONS</span>
                <span className="text-[9px] text-neutral-400 block mt-0.5">Temporarily turn off all BOGO badges and discounts on customer product pages</span>
              </div>
              <span className="text-[10px] font-bold uppercase border border-neutral-700 px-3 py-1 rounded-none">DEACTIVATE</span>
            </div>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {saveStatus && (
        <div
          className="p-4 rounded-none text-xs font-bold flex items-center gap-2 border bg-black text-white border-black animate-fadeIn shadow-sm"
        >
          <Check className="w-4 h-4 shrink-0 text-white" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* ── CUSTOM OFFER BUILDER MODAL WITH SLEEK SCROLL CONTAINER & CENTER MOUSE SCROLL ── */}
      {showCustomModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomModal(false);
            }
          }}
          onWheel={handleModalWheel}
          onMouseDown={handleMiddleMouseDown}
          onMouseMove={handleMiddleMouseMove}
          onMouseUp={handleMiddleMouseUp}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain"
        >
          <div 
            tabIndex={0}
            className="bg-white rounded-none max-w-2xl w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[90vh] my-auto animate-scaleUp font-mono overflow-hidden focus:outline-none"
          >
            {/* Sticky/Fixed Modal Header */}
            <div 
              onWheel={handleModalWheel}
              className="p-5 sm:p-6 pb-4 border-b border-neutral-100 flex items-start justify-between gap-4 shrink-0 bg-white"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-none bg-black text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    CUSTOM STUDIO
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                    PROMOTION BUILDER
                  </span>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2">
                  <span>Create Custom Offer / Tier</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Configure any Buy X Get Y Free, Multi-Piece combo, or custom percentage discount package.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-2 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-700 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body with Middle-Button Click & Wheel Support */}
            <div 
              ref={modalBodyRef}
              tabIndex={0}
              onMouseDown={handleMiddleMouseDown}
              onMouseMove={handleMiddleMouseMove}
              onMouseUp={handleMiddleMouseUp}
              className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-modal-scrollbar flex-1 min-h-0 overscroll-contain scroll-smooth touch-pan-y focus:outline-none"
            >
              {/* Quick Preset Templates */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-neutral-500 block">
                  Quick Template Formulas (Click to fill)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { buy: 1, get: 4, name: "BUY 1 GET 4 FREE", tag: "5 PIECES MEGA PACK", badge: "MAX SAVINGS" },
                    { buy: 2, get: 2, name: "BUY 2 GET 2 FREE", tag: "4 PIECES DOUBLE DEAL", badge: "DOUBLE BOGO" },
                    { buy: 2, get: 3, name: "BUY 2 GET 3 FREE", tag: "5 PIECES FAMILY PACK", badge: "LIMITED EDITION" },
                    { buy: 3, get: 3, name: "BUY 3 GET 3 FREE", tag: "6 PIECES COMBO", badge: "BEST VALUE" },
                    { buy: 4, get: 2, name: "BUY 4 GET 2 FREE", tag: "6 PIECES PACK", badge: "VOLUME DEAL" },
                    { buy: 5, get: 5, name: "BUY 5 GET 5 FREE", tag: "10 PIECES ATELIER SET", badge: "MEGA DROP" },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        const total = tmpl.buy + tmpl.get;
                        const disc = Math.round((tmpl.get / total) * 100);
                        setCustomOfferForm({
                          name: tmpl.name,
                          tag: tmpl.tag,
                          buyQty: tmpl.buy,
                          getQty: tmpl.get,
                          discountPercentage: disc,
                          badgeText: tmpl.badge,
                          popular: true,
                          isActive: true,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-[10px] font-bold text-neutral-900 border border-neutral-200 transition-all cursor-pointer"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formula Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buy Qty Stepper */}
                <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block">
                    Buy Quantity (Paid Units)
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(500);
                        setCustomOfferForm((prev) => {
                          const newBuy = Math.max(1, prev.buyQty - 1);
                          const total = newBuy + prev.getQty;
                          return {
                            ...prev,
                            buyQty: newBuy,
                            name: `BUY ${newBuy} GET ${prev.getQty} FREE`,
                            tag: `${total} PIECES PACK`,
                            discountPercentage: total > 0 ? Math.round((prev.getQty / total) * 100) : 0,
                          };
                        });
                      }}
                      className="w-9 h-9 rounded-none bg-white border border-neutral-300 hover:bg-neutral-200 font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs text-black"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="text-xl font-bold text-black font-mono">
                      {customOfferForm.buyQty} <span className="text-xs text-neutral-500 font-normal">Piece{customOfferForm.buyQty > 1 ? "s" : ""}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(500);
                        setCustomOfferForm((prev) => {
                          const newBuy = prev.buyQty + 1;
                          const total = newBuy + prev.getQty;
                          return {
                            ...prev,
                            buyQty: newBuy,
                            name: `BUY ${newBuy} GET ${prev.getQty} FREE`,
                            tag: `${total} PIECES PACK`,
                            discountPercentage: total > 0 ? Math.round((prev.getQty / total) * 100) : 0,
                          };
                        });
                      }}
                      className="w-9 h-9 rounded-none bg-black hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Get Qty Stepper */}
                <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block">
                    Free / Complimentary Quantity (Get)
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(500);
                        setCustomOfferForm((prev) => {
                          const newGet = Math.max(0, prev.getQty - 1);
                          const total = prev.buyQty + newGet;
                          return {
                            ...prev,
                            getQty: newGet,
                            name: newGet > 0 ? `BUY ${prev.buyQty} GET ${newGet} FREE` : `${prev.buyQty} PIECES (STANDARD)`,
                            tag: `${total} PIECES PACK`,
                            discountPercentage: total > 0 ? Math.round((newGet / total) * 100) : 0,
                          };
                        });
                      }}
                      className="w-9 h-9 rounded-none bg-white border border-neutral-300 hover:bg-neutral-200 font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs text-black"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="text-xl font-bold text-black font-mono">
                      +{customOfferForm.getQty} <span className="text-xs text-neutral-500 font-normal">Free</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(500);
                        setCustomOfferForm((prev) => {
                          const newGet = prev.getQty + 1;
                          const total = prev.buyQty + newGet;
                          return {
                            ...prev,
                            getQty: newGet,
                            name: `BUY ${prev.buyQty} GET ${newGet} FREE`,
                            tag: `${total} PIECES PACK`,
                            discountPercentage: total > 0 ? Math.round((newGet / total) * 100) : 0,
                          };
                        });
                      }}
                      className="w-9 h-9 rounded-none bg-black hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculated Metrics Summary Pill */}
              <div className="p-4 rounded-none bg-black text-white text-xs flex flex-wrap items-center justify-between gap-3 border border-neutral-800 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 uppercase">Total Units:</span>
                  <span className="font-bold text-white font-mono">{customOfferForm.buyQty + customOfferForm.getQty} Pieces</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 uppercase">Customer Pays For:</span>
                  <span className="font-bold text-white font-mono">{customOfferForm.buyQty} Unit{customOfferForm.buyQty > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 uppercase">Calculated Discount:</span>
                  <span className="font-bold text-white font-mono text-sm bg-neutral-800 px-2 py-0.5 rounded-none">{customOfferForm.discountPercentage}% OFF</span>
                </div>
              </div>

              {/* Text Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Offer Title</label>
                  <input
                    type="text"
                    value={customOfferForm.name}
                    onChange={(e) => setCustomOfferForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-xs font-bold text-black focus:outline-none focus:border-black"
                    placeholder="BUY 2 GET 3 FREE"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Package Tag</label>
                  <input
                    type="text"
                    value={customOfferForm.tag}
                    onChange={(e) => setCustomOfferForm((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-xs text-black focus:outline-none focus:border-black"
                    placeholder="5 PIECES MEGA PACK"
                  />
                </div>
              </div>

              {/* Badge Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">
                    Custom Badge Ribbon (Optional)
                  </label>
                  <span className="text-[10px] text-neutral-400">Click a chip or type custom</span>
                </div>
                <input
                  type="text"
                  value={customOfferForm.badgeText}
                  onChange={(e) => setCustomOfferForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black"
                  placeholder="e.g. LIMITED EDITION, FESTIVE SPECIAL, BEST VALUE"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {["MOST POPULAR", "BEST VALUE", "HOT OFFER", "FESTIVE DEAL", "LIMITED DROP", "CLEARANCE", "BUY 2 GET 3 FREE", "SAVE 60%"].map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(400);
                        setCustomOfferForm((prev) => ({ ...prev, badgeText: badge }));
                      }}
                      className={`px-2.5 py-1 rounded-none text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                        customOfferForm.badgeText === badge
                          ? "bg-black text-white border-black"
                          : "bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200"
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Interactive Modal Card Preview */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-[10px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-black" />
                  <span>Live Storefront Card Preview (Simulated at ₹{sampleProductPrice})</span>
                </label>

                {(() => {
                  const totalUnits = customOfferForm.buyQty + customOfferForm.getQty;
                  const rawTotal = sampleProductPrice * totalUnits;
                  const discAmt = Math.round((rawTotal * customOfferForm.discountPercentage) / 100);
                  const finalBundle = Math.max(0, rawTotal - discAmt);
                  const perPiece = totalUnits > 0 ? Math.round(finalBundle / totalUnits) : sampleProductPrice;
                  const savings = rawTotal - finalBundle;

                  return (
                    <div className="p-4 rounded-none bg-black text-white border border-neutral-800 relative shadow-md">
                      {customOfferForm.badgeText && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-none bg-white text-black font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm">
                          {customOfferForm.badgeText}
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-sm font-bold uppercase tracking-wider block">
                            {customOfferForm.name || "UNTITLED OFFER"}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-tight block mt-0.5">
                            {totalUnits > 1 ? `₹${perPiece.toLocaleString("en-IN")} / piece` : "Standard piece"} • {customOfferForm.tag}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm font-bold block text-white">
                            ₹{finalBundle.toLocaleString("en-IN")}
                          </span>
                          {savings > 0 && (
                            <span className="font-mono text-[10px] line-through block text-neutral-400">
                              ₹{rawTotal.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white uppercase tracking-wider">
                            Save ₹{savings.toLocaleString("en-IN")} ({customOfferForm.discountPercentage}% OFF)
                          </span>
                          <span className="text-neutral-300 uppercase">
                            {customOfferForm.buyQty} Paid + {customOfferForm.getQty} Free
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div 
              onWheel={handleModalWheel}
              className="p-4 sm:p-5 border-t border-neutral-100 flex items-center justify-end gap-3 shrink-0 bg-neutral-50 rounded-none text-xs"
            >
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-5 py-2.5 rounded-none bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCustomOffer}
                className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest cursor-pointer shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <span>+ ADD & ACTIVATE CUSTOM OFFER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetConfirm(false);
            }
          }}
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden overscroll-contain"
        >
          <div className="bg-white p-6 rounded-none max-w-md w-full border border-neutral-200 shadow-2xl space-y-4 animate-scaleUp font-mono">
            <div className="space-y-1">
              <h3 className="text-base font-bold uppercase text-black">Reset to Factory Default?</h3>
              <p className="text-xs text-neutral-600">
                This will reset all BOGO tiers to standard Buy 1 Get 1, Buy 1 Get 2, and Buy 1 Get 3 presets.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MASTER ENGINE CONFIGURATION */}
      <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold uppercase text-black flex items-center gap-2">
              <Gift className="w-4 h-4 text-black" />
              <span>Offer Engine Master Controls</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Control visibility and headline typography of BOGO packages on customer product pages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
            className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              config.isEnabled
                ? "bg-black text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 border border-neutral-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-none ${config.isEnabled ? "bg-white animate-pulse" : "bg-neutral-400"}`} />
            <span>{config.isEnabled ? "BOGO ACTIVE: ENABLED" : "BOGO DISABLED"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-neutral-500">Offer Section Header</label>
            <input
              type="text"
              value={config.sectionTitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, sectionTitle: e.target.value }))}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-xs font-bold text-black focus:outline-none focus:border-black"
              placeholder="SPECIAL BUNDLE DEALS • BUY & GET FREE"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-neutral-500">Section Subtitle</label>
            <input
              type="text"
              value={config.sectionSubtitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, sectionSubtitle: e.target.value }))}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-xs text-black focus:outline-none focus:border-black"
              placeholder="Select a package to unlock complimentary garments & maximum savings"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-neutral-500">Banner Notice Ribbon</label>
            <input
              type="text"
              value={config.bannerNotice}
              onChange={(e) => setConfig((prev) => ({ ...prev, bannerNotice: e.target.value }))}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-xs text-black focus:outline-none focus:border-black"
              placeholder="SPECIAL ATELIER OFFER: Buy 1 piece and unlock up to 3 complimentary garments!"
            />
          </div>
        </div>
      </div>

      {/* 3. TIERS MANAGER & LIVE PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Tiers List (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold uppercase text-black">Configured BOGO Tiers ({(config.tiers || []).length})</h3>
              <p className="text-xs text-neutral-500">
                Define quantities, free units, savings percentage, and badges.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCustomBuilder(2, 3)}
                className="px-4 py-2 rounded-none bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <span>+ CUSTOM STUDIO</span>
              </button>

              <button
                type="button"
                onClick={handleAddTier}
                className="px-3.5 py-2 rounded-none bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-black" />
                <span>+ QUICK TIER</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(config.tiers || []).map((tier, idx) => (
              <div
                key={tier.id || idx}
                className={`p-5 rounded-none bg-white border transition-all shadow-sm space-y-4 ${
                  tier.popular ? "border-black ring-1 ring-black/20" : "border-neutral-200"
                }`}
              >
                {/* Tier Header Strip */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-none bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold uppercase text-black flex items-center gap-2">
                        <span>{tier.name || "UNTITLED TIER"}</span>
                        {tier.popular && (
                          <span className="px-2 py-0.5 rounded-none bg-black text-white text-[9px] font-bold uppercase tracking-wider">
                            POPULAR
                          </span>
                        )}
                        {!tier.isActive && (
                          <span className="px-2 py-0.5 rounded-none bg-neutral-200 text-neutral-700 text-[9px] font-bold uppercase">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Buy {tier.buyQty} + Get {tier.getQty} Free = Total {tier.totalQty} Units ({tier.discountPercentage}% OFF)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTier(idx)}
                      className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                      title="Duplicate / Clone Tier"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveTier(idx, "up")}
                      className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === (config.tiers.length - 1)}
                      onClick={() => handleMoveTier(idx, "down")}
                      className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTier(idx)}
                      className="p-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-600 border border-neutral-200 cursor-pointer transition-colors"
                      title="Delete Tier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tier Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleUpdateTier(idx, "name", e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black"
                      placeholder="BUY 1 GET 2 FREE"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Badge Text</label>
                    <input
                      type="text"
                      value={tier.badgeText || ""}
                      onChange={(e) => handleUpdateTier(idx, "badgeText", e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                      placeholder="MOST POPULAR"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Buy Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.buyQty}
                      onChange={(e) => handleUpdateTier(idx, "buyQty", parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Free Qty (Get)</label>
                    <input
                      type="number"
                      min="0"
                      value={tier.getQty}
                      onChange={(e) => handleUpdateTier(idx, "getQty", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Total Units</label>
                    <div className="w-full bg-neutral-100 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black text-center">
                      {tier.totalQty} Units
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tier.discountPercentage}
                      onChange={(e) => handleUpdateTier(idx, "discountPercentage", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black text-center"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateTier(idx, "popular", !tier.popular)}
                    className={`px-3 py-1.5 rounded-none border text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      tier.popular
                        ? "bg-black border-black text-white font-bold"
                        : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    ★ Highlight as Most Popular
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateTier(idx, "isActive", !tier.isActive)}
                    className={`px-3 py-1.5 rounded-none border text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      tier.isActive
                        ? "bg-black text-white border-black"
                        : "bg-neutral-100 text-neutral-500 border-neutral-200"
                    }`}
                  >
                    {tier.isActive ? "✓ Active Tier" : "Disabled"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Interactive Customer Preview (Right 5 Cols Sticky) */}
        <div className="lg:col-span-5 sticky top-28 space-y-4">
          <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-black" />
                <span>CUSTOMER STOREFRONT PREVIEW</span>
              </span>
              <span className="text-[9px] px-2.5 py-0.5 rounded-none bg-black text-white font-bold uppercase">
                LIVE SIMULATOR
              </span>
            </div>

            {/* Sample Product Info Header with Dynamic Test Price */}
            <div className="p-3.5 rounded-none bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Simulate Test Product</span>
                <span className="text-[10px] text-neutral-400">Type any price to test calculations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">₹</span>
                  <input
                    type="number"
                    value={sampleProductPrice}
                    onChange={(e) => setSampleProductPrice(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full bg-white border border-neutral-200 rounded-none pl-7 pr-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:border-black"
                    placeholder="1290"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {[990, 1490, 2490].map((quickP) => (
                    <button
                      key={quickP}
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setSampleProductPrice(quickP);
                      }}
                      className="px-2 py-1 rounded-none bg-neutral-200 hover:bg-black hover:text-white text-[10px] font-bold text-neutral-800 transition-all cursor-pointer"
                    >
                      ₹{quickP}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOGO Selector Preview Widget */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-black" />
                  <span>{config.sectionTitle || "SPECIAL BUNDLE DEALS"}</span>
                </span>
              </div>

              {config.bannerNotice && (
                <div className="p-2.5 rounded-none bg-neutral-100 border border-neutral-200 text-[10px] text-black font-bold leading-tight">
                  {config.bannerNotice}
                </div>
              )}

              {/* Tiers List */}
              <div 
                tabIndex={0}
                className="space-y-2 max-h-[380px] overflow-y-auto custom-modal-scrollbar pr-1 overscroll-contain scroll-smooth touch-pan-y focus:outline-none"
              >
                {(config.tiers || []).filter((t) => t.isActive).map((tier) => {
                  const isSelected = selectedPreviewTier === tier.id;
                  const totalItems = tier.totalQty;
                  const originalTotal = sampleProductPrice * totalItems;
                  const bundlePrice = sampleProductPrice * tier.buyQty;
                  const savings = originalTotal - bundlePrice;

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setSelectedPreviewTier(tier.id);
                      }}
                      className={`w-full text-left p-3.5 rounded-none border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-black text-white border-black shadow-md scale-[1.01]"
                          : "bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100"
                      }`}
                    >
                      {tier.badgeText && (
                        <span
                          className={`absolute -top-2 right-3 px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider shadow-xs ${
                            isSelected ? "bg-white text-black ring-1 ring-black/20" : "bg-black text-white"
                          }`}
                        >
                          {tier.badgeText}
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-none border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-white bg-white text-black" : "border-neutral-400"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-none bg-black" />}
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase tracking-wide">{tier.name}</div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? "text-neutral-300" : "text-neutral-500"
                              }`}
                            >
                              Includes {totalItems} Garments • Pay for {tier.buyQty}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold">₹{bundlePrice.toLocaleString("en-IN")}</div>
                          {savings > 0 && (
                            <div
                              className="text-[9.5px] line-through text-neutral-400"
                            >
                              ₹{originalTotal.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <div
                          className={`mt-2 pt-1.5 border-t text-[10px] font-bold flex items-center justify-between ${
                            isSelected ? "border-white/20 text-neutral-200" : "border-neutral-200 text-neutral-800"
                          }`}
                        >
                          <span>You Save ₹{savings.toLocaleString("en-IN")} ({tier.discountPercentage}% OFF)</span>
                          <span>{tier.getQty} FREE UNITS</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Checkout Summary Box */}
            <div className="p-3.5 rounded-none bg-black text-white text-xs space-y-2 border border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Selected Package:</span>
                <span className="font-bold text-white uppercase">
                  {config.tiers.find((t) => t.id === selectedPreviewTier)?.name || "1 PIECE"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Free Garments Dispatched:</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded-none">+{config.tiers.find((t) => t.id === selectedPreviewTier)?.getQty || 0} Free Pieces</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
