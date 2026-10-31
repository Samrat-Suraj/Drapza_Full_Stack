"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Film,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Target,
  ShoppingBag,
  Sliders,
  MoveHorizontal,
  MoveVertical,
  X,
  Play,
  Pause,
} from "lucide-react";
import {
  RunwayReelsConfigData,
  RunwayLookData,
  RunwayHotspotProductData,
  DEFAULT_RUNWAY_REELS_CONFIG,
  runwayReelsApi,
} from "@/lib/api";
import { PRODUCTS_DATA } from "./ProductsSection";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";

interface RunwayReelsAdminTabProps {
  initialConfig?: RunwayReelsConfigData;
  onSaveSuccess?: () => void;
}

const PRESET_LOOK_IMAGES = [
  {
    name: "Yellow Streetwear Crop",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Brutalist Monochrome Studio",
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Editorial Red & Sunglasses",
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Milan Cathedral Trench",
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "High-Fashion Minimalist Beige",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Avant-Garde Architectural Coat",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80",
  },
];

export const RunwayReelsAdminTab: React.FC<RunwayReelsAdminTabProps> = ({
  initialConfig,
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<RunwayReelsConfigData>(
    initialConfig || DEFAULT_RUNWAY_REELS_CONFIG
  );
  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "ERROR" | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewHotspotActive, setPreviewHotspotActive] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync initialConfig if passed later
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const looks = config.looks && config.looks.length > 0
    ? config.looks
    : DEFAULT_RUNWAY_REELS_CONFIG.looks || [];

  const currentLook: RunwayLookData = looks[activeLookIdx] || looks[0] || {
    id: "runway-look-1",
    title: "UNTITLED LOOK",
    season: "SEASON 2026",
    posterImage: PRESET_LOOK_IMAGES[0].url,
    modelDetails: "ATELIER RUNWAY • 185 CM",
    products: [],
  };

  const currentProduct: RunwayHotspotProductData =
    currentLook.products && currentLook.products.length > 0
      ? currentLook.products[0]
      : {
          id: 1,
          name: "NEW ATELIER GARMENT",
          price: 1500,
          priceFormatted: "₹1,500",
          category: "Outerwear",
          image: "/images/drapza/products/product_1.png",
          hotspotTop: 50,
          hotspotLeft: 50,
        };

  // Save Config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(800);

    try {
      const res = await runwayReelsApi.updateConfig(config);
      if (res && res.success) {
        setSaveStatus("SAVED");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus("ERROR");
        audioSystem.playError();
      }
    } catch (err) {
      console.error("[RUNWAY REELS CMS] Save error:", err);
      setSaveStatus("ERROR");
      audioSystem.playError();
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // Reset Config
  const handleReset = async () => {
    setIsResetting(true);
    audioSystem.playClick(600);

    try {
      const res = await runwayReelsApi.resetConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
        setActiveLookIdx(0);
        audioSystem.playSuccess();
        setShowResetConfirm(false);
      }
    } catch (err) {
      console.error("[RUNWAY REELS CMS] Reset error:", err);
      audioSystem.playError();
    } finally {
      setIsResetting(false);
    }
  };

  // Update current look field
  const updateCurrentLook = (field: keyof RunwayLookData, value: any) => {
    const updated = [...looks];
    updated[activeLookIdx] = {
      ...updated[activeLookIdx],
      [field]: value,
    };
    setConfig((prev) => ({ ...prev, looks: updated }));
  };

  // Update product within current look
  const updateCurrentProduct = (field: keyof RunwayHotspotProductData, value: any) => {
    const updated = [...looks];
    const look = { ...updated[activeLookIdx] };
    const prods = [...(look.products || [])];

    if (prods.length === 0) {
      prods.push({
        id: 1,
        name: "ATELIER SILHOUETTE",
        price: 1500,
        priceFormatted: "₹1,500",
        category: "Outerwear",
        image: "/images/drapza/products/product_1.png",
        hotspotTop: 50,
        hotspotLeft: 50,
        [field]: value,
      });
    } else {
      prods[0] = {
        ...prods[0],
        [field]: value,
      };
      if (field === "price") {
        prods[0].priceFormatted = `₹${Number(value).toLocaleString("en-IN")}`;
      }
    }

    look.products = prods;
    updated[activeLookIdx] = look;
    setConfig((prev) => ({ ...prev, looks: updated }));
  };

  // Quick pick product from catalog
  const handleCatalogPick = (prodIdStr: string) => {
    const numId = parseInt(prodIdStr, 10);
    const catalogItem = PRODUCTS_DATA.find((p) => p.id === numId);
    if (!catalogItem) return;

    audioSystem.playClick(700);
    const updated = [...looks];
    const look = { ...updated[activeLookIdx] };
    const prods = [...(look.products || [])];

    const currentCoords = prods[0]
      ? { hotspotTop: prods[0].hotspotTop, hotspotLeft: prods[0].hotspotLeft }
      : { hotspotTop: 50, hotspotLeft: 50 };

    prods[0] = {
      id: typeof catalogItem.id === "number" ? catalogItem.id : parseInt(String(catalogItem.id), 10) || 1,
      name: catalogItem.name,
      price: Number(catalogItem.numericPrice) || 1500,
      priceFormatted: catalogItem.price,
      category: catalogItem.category || "Atelier Outerwear",
      image: catalogItem.image,
      ...currentCoords,
    };

    look.products = prods;
    updated[activeLookIdx] = look;
    setConfig((prev) => ({ ...prev, looks: updated }));
  };

  // Interactive canvas click for placing hotspot
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const leftPercent = Math.max(5, Math.min(95, Math.round((x / rect.width) * 100)));
    const topPercent = Math.max(5, Math.min(95, Math.round((y / rect.height) * 100)));

    audioSystem.playClick(850);
    updateCurrentProduct("hotspotLeft", leftPercent);
    updateCurrentProduct("hotspotTop", topPercent);
  };

  // Add Look
  const handleAddLook = () => {
    audioSystem.playClick(600);
    const newIdx = looks.length + 1;
    const newLook: RunwayLookData = {
      id: `runway-look-${Date.now()}`,
      title: `COUTURE SILHOUETTE 0${newIdx}`,
      season: "AUTUMN / WINTER 2026",
      posterImage: PRESET_LOOK_IMAGES[newIdx % PRESET_LOOK_IMAGES.length].url,
      videoUrl: "",
      modelDetails: "ATELIER RUNWAY • 185 CM • WEARING SIZE M",
      description: "Architectural drape engineered with precision tailoring and high-density weave.",
      products: [
        {
          id: newIdx,
          name: "NEW ATELIER PIECE",
          price: 1590,
          priceFormatted: "₹1,590",
          category: "Outerwear",
          image: "/images/drapza/products/product_1.png",
          hotspotTop: 45,
          hotspotLeft: 50,
        },
      ],
    };

    const updated = [...looks, newLook];
    setConfig((prev) => ({ ...prev, looks: updated }));
    setActiveLookIdx(updated.length - 1);
  };

  // Delete current Look
  const handleDeleteLook = () => {
    if (looks.length <= 1) {
      alert("At least one runway look is required.");
      return;
    }
    audioSystem.playClick(400);
    const updated = looks.filter((_, idx) => idx !== activeLookIdx);
    setConfig((prev) => ({ ...prev, looks: updated }));
    setActiveLookIdx(Math.max(0, activeLookIdx - 1));
  };

  // Move look Left / Right
  const handleMoveLook = (direction: "left" | "right") => {
    const targetIdx = direction === "left" ? activeLookIdx - 1 : activeLookIdx + 1;
    if (targetIdx < 0 || targetIdx >= looks.length) return;

    audioSystem.playClick(600);
    const updated = [...looks];
    const temp = updated[activeLookIdx];
    updated[activeLookIdx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setConfig((prev) => ({ ...prev, looks: updated }));
    setActiveLookIdx(targetIdx);
  };

  return (
    <div className="space-y-8 pb-12 font-mono text-neutral-900">
      {/* Top Sticky HUD Controller */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-neutral-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-black">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-950">
                RUNWAY REELS CMS
              </h2>
              <span
                className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest border ${
                  config.isEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-neutral-100 text-neutral-500 border-neutral-300"
                }`}
              >
                {config.isEnabled ? "● LIVE STOREFRONT" : "○ HIDDEN"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Manage shoppable video reels, models, garment hotspots, and bag checkout pins.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Section Enable Toggle */}
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(600);
              setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
            }}
            className={`px-3 py-2 text-xs uppercase tracking-wider font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
              config.isEnabled
                ? "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800"
                : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config.isEnabled ? "bg-emerald-400" : "bg-neutral-400"
              }`}
            />
            {config.isEnabled ? "SECTION ENABLED" : "SECTION DISABLED"}
          </button>

          {/* Autoplay Toggle */}
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(600);
              setConfig((prev) => ({ ...prev, autoplay: !prev.autoplay }));
            }}
            className={`px-3 py-2 text-xs uppercase tracking-wider font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              config.autoplay
                ? "bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200"
                : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
            }`}
            title="Toggle zoom/motion simulation"
          >
            {config.autoplay ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            AUTOPLAY: {config.autoplay ? "ON" : "OFF"}
          </button>

          {/* Factory Reset Button */}
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(400);
              setShowResetConfirm(true);
            }}
            className="px-3 py-2 bg-white hover:bg-rose-50 text-neutral-700 hover:text-rose-700 border border-neutral-300 hover:border-rose-300 text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET FACTORY
          </button>

          {/* Save & Publish Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white border border-black text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? "PUBLISHING..." : "SAVE & PUBLISH"}
          </button>
        </div>
      </div>

      {/* Save Status Notification Banner */}
      {saveStatus && (
        <div
          className={`p-3.5 border text-xs flex items-center justify-between ${
            saveStatus === "SAVED"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus === "SAVED" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-bold">
              {saveStatus === "SAVED"
                ? "RUNWAY REELS CONFIGURATION SAVED & PUBLISHED LIVE TO STOREFRONT"
                : "FAILED TO SAVE CONFIGURATION. CHECK SERVER LOGS."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Global Headers Card */}
      <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
            [ 01 ] SECTION HEADERS & EDITORIAL COPY
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
            STOREFRONT TOP ANCHOR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
              Section Tagline
            </label>
            <input
              type="text"
              value={config.sectionTag || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, sectionTag: e.target.value }))}
              placeholder="SHOPPABLE RUNWAY IN MOTION"
              className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
              Editorial Headline
            </label>
            <input
              type="text"
              value={config.headline || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, headline: e.target.value }))}
              placeholder="ATELIER RUNWAY REELS"
              className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
              Editorial Subtext
            </label>
            <textarea
              rows={2}
              value={config.subtext || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, subtext: e.target.value }))}
              placeholder="Observe architectural fabric motion and silhouettes live. Tap garment hotspots directly..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Runway Looks Management Tabs */}
      <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
              [ 02 ] RUNWAY LOOKS & HOTSPOT CALIBRATION
            </span>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold">
              {looks.length} LOOKS TOTAL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMoveLook("left")}
              disabled={activeLookIdx === 0}
              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 border border-neutral-300 cursor-pointer text-xs flex items-center gap-1"
              title="Move Look Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> MOVE LEFT
            </button>
            <button
              type="button"
              onClick={() => handleMoveLook("right")}
              disabled={activeLookIdx === looks.length - 1}
              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 border border-neutral-300 cursor-pointer text-xs flex items-center gap-1"
              title="Move Look Right"
            >
              MOVE RIGHT <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleAddLook}
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> ADD LOOK
            </button>
            <button
              type="button"
              onClick={handleDeleteLook}
              disabled={looks.length <= 1}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-30 text-xs cursor-pointer"
              title="Delete Active Look"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Look Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {looks.map((look, idx) => (
            <button
              key={look.id || idx}
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveLookIdx(idx);
              }}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                activeLookIdx === idx
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 ${
                  activeLookIdx === idx ? "bg-white" : "bg-neutral-400"
                }`}
              />
              LOOK 0{idx + 1}: {look.title ? look.title.slice(0, 18) : "LOOK"}
            </button>
          ))}
        </div>

        {/* Active Look Editor Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Left Column (Inputs for Active Look & Hotspot) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Look Metadata */}
            <div className="border border-neutral-200 p-4 sm:p-5 space-y-4 bg-neutral-50/50">
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold block border-b border-neutral-200 pb-2">
                A. LOOK METADATA & MEDIA
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Look Title
                  </label>
                  <input
                    type="text"
                    value={currentLook.title || ""}
                    onChange={(e) => updateCurrentLook("title", e.target.value)}
                    placeholder="NOCTURNE OVERSIZED TRENCH"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Season / Capsule Tag
                  </label>
                  <input
                    type="text"
                    value={currentLook.season || ""}
                    onChange={(e) => updateCurrentLook("season", e.target.value)}
                    placeholder="AUTUMN / WINTER 2026"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Model Details / Fit Specs
                  </label>
                  <input
                    type="text"
                    value={currentLook.modelDetails || ""}
                    onChange={(e) => updateCurrentLook("modelDetails", e.target.value)}
                    placeholder="ATELIER RUNWAY • 186 CM • WEARING SIZE L"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Editorial Narrative / Description
                  </label>
                  <textarea
                    rows={2}
                    value={currentLook.description || ""}
                    onChange={(e) => updateCurrentLook("description", e.target.value)}
                    placeholder="Tailored for zero restriction and high structural integrity..."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Model / Poster Image URL
                  </label>
                  <input
                    type="text"
                    value={currentLook.posterImage || ""}
                    onChange={(e) => updateCurrentLook("posterImage", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />

                  {/* Preset Image Recommendations */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">
                      Presets:
                    </span>
                    {PRESET_LOOK_IMAGES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(600);
                          updateCurrentLook("posterImage", preset.url);
                        }}
                        className="px-2 py-0.5 text-[9px] uppercase font-bold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Optional Video URL (.mp4 / stream)
                  </label>
                  <input
                    type="text"
                    value={currentLook.videoUrl || ""}
                    onChange={(e) => updateCurrentLook("videoUrl", e.target.value)}
                    placeholder="Optional direct video URL (e.g. /videos/runway1.mp4)"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tagged Hotspot Garment Details */}
            <div className="border border-neutral-200 p-4 sm:p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-neutral-900 font-bold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  B. TAGGED SHOPPING HOTSPOT PRODUCT
                </span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase">
                  TAP IMAGE ON RIGHT TO POSITION
                </span>
              </div>

              {/* Quick Catalog Autofill Dropdown */}
              <div className="bg-neutral-50 p-3 border border-neutral-300">
                <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  Quick Autofill from Catalog Products:
                </label>
                <select
                  onChange={(e) => handleCatalogPick(e.target.value)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 bg-white focus:border-black outline-none font-mono cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select product to autofill fields --
                  </option>
                  {PRODUCTS_DATA.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} • {p.name} ({p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={currentProduct.name || ""}
                    onChange={(e) => updateCurrentProduct("name", e.target.value)}
                    placeholder="ANARKALI FLUID TRENCH"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Category Badge
                  </label>
                  <input
                    type="text"
                    value={currentProduct.category || ""}
                    onChange={(e) => updateCurrentProduct("category", e.target.value)}
                    placeholder="Outerwear"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Price (INR Numeric)
                  </label>
                  <input
                    type="number"
                    value={currentProduct.price || 0}
                    onChange={(e) =>
                      updateCurrentProduct("price", parseFloat(e.target.value) || 0)
                    }
                    placeholder="1440"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Price Formatted Display
                  </label>
                  <input
                    type="text"
                    value={currentProduct.priceFormatted || ""}
                    onChange={(e) => updateCurrentProduct("priceFormatted", e.target.value)}
                    placeholder="₹1,440"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="text"
                    value={currentProduct.image || ""}
                    onChange={(e) => updateCurrentProduct("image", e.target.value)}
                    placeholder="/images/drapza/products/product_1.png"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none"
                  />
                </div>

                {/* Hotspot Coordinate Precision Sliders */}
                <div className="sm:col-span-2 p-3 bg-neutral-50 border border-neutral-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-700 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> HOTSPOT COORDINATES (X / Y)
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      X: {currentProduct.hotspotLeft}% | Y: {currentProduct.hotspotTop}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-600 mb-1">
                        <span>Horizontal (X / Left)</span>
                        <span className="font-bold">{currentProduct.hotspotLeft}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={currentProduct.hotspotLeft}
                        onChange={(e) =>
                          updateCurrentProduct("hotspotLeft", parseInt(e.target.value, 10))
                        }
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-600 mb-1">
                        <span>Vertical (Y / Top)</span>
                        <span className="font-bold">{currentProduct.hotspotTop}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={currentProduct.hotspotTop}
                        onChange={(e) =>
                          updateCurrentProduct("hotspotTop", parseInt(e.target.value, 10))
                        }
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Canvas & 1:1 Live Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> INTERACTIVE HOTSPOT CANVAS
              </span>
              <button
                type="button"
                onClick={() => setPreviewHotspotActive((p) => !p)}
                className="text-[10px] uppercase font-bold text-neutral-600 hover:text-black border border-neutral-300 px-2 py-1 bg-white cursor-pointer"
              >
                {previewHotspotActive ? "HIDE CARD PREVIEW" : "SHOW CARD PREVIEW"}
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 leading-tight">
              <strong>Click anywhere on the photo below</strong> to directly place or reposition the garment shopping pin!
            </p>

            {/* Interactive 9:15 Canvas Container */}
            <div className="relative mx-auto w-full max-w-[360px] aspect-[9/15] bg-neutral-950 border-2 border-neutral-800 shadow-xl overflow-hidden select-none group">
              {/* Click Surface Canvas */}
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 cursor-crosshair z-10"
                title="Click to place hotspot pin"
              >
                {/* Poster Photo */}
                <img
                  src={currentLook.posterImage}
                  alt={currentLook.title}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Overlay Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35 pointer-events-none" />

                {/* Top Badge Overlay */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 bg-white/95 text-[9px] uppercase font-bold tracking-widest text-neutral-900 border border-neutral-200">
                    {currentLook.season}
                  </span>
                  <span className="px-2 py-0.5 bg-black/80 text-[9px] uppercase font-bold tracking-wider text-white">
                    LOOK 0{activeLookIdx + 1}
                  </span>
                </div>

                {/* Hotspot Pin Placement Marker */}
                <div
                  style={{
                    top: `${currentProduct.hotspotTop}%`,
                    left: `${currentProduct.hotspotLeft}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                >
                  {/* Outer Pulsing Ring */}
                  <span className="absolute inset-0 -m-2 rounded-full bg-white/40 animate-ping" />

                  {/* Pin Circle Button */}
                  <div className="relative w-7 h-7 rounded-full bg-white text-black border-2 border-black flex items-center justify-center shadow-2xl">
                    <ShoppingBag className="w-3.5 h-3.5 fill-black" />
                  </div>

                  {/* Mini Popover Card Simulation */}
                  {previewHotspotActive && (
                    <div
                      className={`absolute z-40 w-[220px] bg-white border border-neutral-300 p-2.5 shadow-2xl ${
                        currentProduct.hotspotTop > 55 ? "bottom-full mb-3" : "top-full mt-3"
                      } ${
                        currentProduct.hotspotLeft > 60
                          ? "right-0 -translate-x-0"
                          : currentProduct.hotspotLeft < 40
                          ? "left-0 -translate-x-0"
                          : "left-1/2 -translate-x-1/2"
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        <img
                          src={currentProduct.image}
                          alt={currentProduct.name}
                          className="w-10 h-12 object-cover border border-neutral-200 shrink-0 bg-neutral-100"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold block">
                            {currentProduct.category}
                          </span>
                          <p className="text-[10px] font-bold uppercase text-neutral-950 truncate">
                            {currentProduct.name}
                          </p>
                          <span className="text-[10px] font-bold text-neutral-900 block">
                            {currentProduct.priceFormatted}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-neutral-200">
                        <div className="py-1 bg-neutral-100 text-[8px] uppercase font-bold text-center border border-neutral-200">
                          DETAILS
                        </div>
                        <div className="py-1 bg-black text-white text-[8px] uppercase font-bold text-center">
                          + ADD BAG
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Model Details Overlay */}
                <div className="absolute bottom-3 inset-x-3 pointer-events-none space-y-0.5">
                  <span className="text-[9px] text-neutral-300 uppercase tracking-wider block">
                    {currentLook.modelDetails}
                  </span>
                  <h4 className="font-serif text-sm font-bold uppercase text-white truncate">
                    {currentLook.title}
                  </h4>
                </div>
              </div>
            </div>

            {/* Coordinate Readout Badge */}
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-center text-xs text-neutral-600 font-mono">
              PIN PLACEMENT: <span className="font-bold text-black">{currentProduct.hotspotLeft}% from Left</span>,{" "}
              <span className="font-bold text-black">{currentProduct.hotspotTop}% from Top</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reset Factory Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="RESTORE FACTORY RUNWAY REELS CMS?"
        message="This will reset all 4 looks, default photography, product prices, and hotspot coordinates back to factory defaults. Custom looks will be discarded."
        confirmLabel={isResetting ? "RESETTING..." : "YES, RESTORE FACTORY DEFAULT"}
        cancelLabel="CANCEL"
        variant="reset"
      />
    </div>
  );
};
