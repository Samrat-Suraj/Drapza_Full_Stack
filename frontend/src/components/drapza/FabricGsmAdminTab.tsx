"use client";

import React, { useState, useRef } from "react";
import {
  Save,
  RotateCcw,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Activity,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import {
  fabricGsmApi,
  FabricGsmConfigData,
  GsmTierData,
  DEFAULT_FABRIC_GSM_CONFIG,
  productApi,
  siteConfigApi,
} from "@/lib/api";
import { ConfirmModal } from "./ConfirmModal";
import {
  normalizeImageUrl,
  handleImageFallbackError,
  isGoogleDriveUrl,
} from "@/lib/imageUtils";

interface FabricGsmAdminTabProps {
  config: FabricGsmConfigData;
  setConfig: React.Dispatch<React.SetStateAction<FabricGsmConfigData>>;
  onSaveSuccess?: () => void;
}

export const FabricGsmAdminTab: React.FC<FabricGsmAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTierIdx, setActiveTierIdx] = useState<number>(2); // Default to 480 GSM (idx 2)

  const tiers: GsmTierData[] = config.tiers && config.tiers.length > 0
    ? config.tiers
    : (DEFAULT_FABRIC_GSM_CONFIG.tiers || []);

  const currentTier = tiers[activeTierIdx] || tiers[0];

  // Texture Presets
  const TEXTURE_PRESETS = [
    {
      label: "Dense Double-Weave (Atelier 480 GSM)",
      url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Textured Cotton Twill (Mid-Weight 280 GSM)",
      url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Lightweight Jersey Weave (Retail 180 GSM)",
      url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Raw Linen & Modal Handcraft",
      url: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Heavyweight French Terry Knit",
      url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    },
  ];

  // Save Config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(800);

    try {
      const res = await fabricGsmApi.updateConfig(config);
      if (res && res.success) {
        setSaveStatus("SAVED");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus("ERROR");
        audioSystem.playError();
      }
    } catch (err) {
      console.error("[FABRIC GSM CMS] Save error:", err);
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
      const res = await fabricGsmApi.resetConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
        audioSystem.playSuccess();
        setShowResetConfirm(false);
      }
    } catch (err) {
      console.error("[FABRIC GSM CMS] Reset error:", err);
      audioSystem.playError();
    } finally {
      setIsResetting(false);
    }
  };

  // Update Current Tier Field
  const updateCurrentTier = (field: keyof GsmTierData, value: any) => {
    const updatedTiers = [...tiers];
    updatedTiers[activeTierIdx] = {
      ...updatedTiers[activeTierIdx],
      [field]: value,
    };
    setConfig((prev) => ({
      ...prev,
      tiers: updatedTiers,
    }));
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);
    audioSystem.playClick(750);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      let uploadedUrl = "";
      try {
        const res = await productApi.uploadImage(base64);
        if (res && res.url) {
          uploadedUrl = res.url;
        }
      } catch (pErr) {
        const fallbackRes = await siteConfigApi.uploadAsset(base64, "drapza_fabric_gsm");
        if (fallbackRes && fallbackRes.url) {
          uploadedUrl = fallbackRes.url;
        }
      }

      if (uploadedUrl) {
        updateCurrentTier("image", uploadedUrl);
        audioSystem.playSuccess();
      } else {
        throw new Error("No URL returned from Cloudinary upload");
      }
    } catch (err: any) {
      console.error("[CLOUDINARY UPLOAD ERROR]", err);
      setUploadError(err.message || "Failed to upload image");
      audioSystem.playError();
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-mono">
      {/* ========================================================================= */}
      {/* STICKY TOP ACTION HUD */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-none bg-white border border-neutral-200 shadow-sm sticky top-4 z-40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-bold uppercase tracking-wider">
            <span
              className={`w-2.5 h-2.5 rounded-none ${
                config.isEnabled !== false ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>
              {config.isEnabled !== false
                ? "MATERIAL TACTILE SCIENCE • LIVE ON HOMEPAGE"
                : "MATERIAL TACTILE SCIENCE • DISABLED"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-black tracking-wider flex items-center gap-2">
            <Layers className="w-6 h-6 text-black" />
            MATERIAL SCIENCE & GSM LOUPE CMS
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Storefront Status Pill */}
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(650);
              setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
            }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              config.isEnabled !== false
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
            }`}
          >
            {config.isEnabled !== false ? "● SECTION VISIBLE" : "○ SECTION HIDDEN"}
          </button>

          {/* Reset Factory Default Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving || isResetting}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>

          {/* Save & Publish Live Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 ${
              saveStatus === "SAVED"
                ? "bg-emerald-600 border border-emerald-600"
                : saveStatus === "ERROR"
                ? "bg-rose-600 border border-rose-600"
                : "bg-black hover:bg-neutral-800 border border-black"
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                PUBLISHING...
              </>
            ) : saveStatus === "SAVED" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                PUBLISHED LIVE!
              </>
            ) : saveStatus === "ERROR" ? (
              <>
                <AlertCircle className="w-4 h-4" />
                SAVE FAILED
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                PUBLISH LIVE
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN EDITOR LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SECTION METADATA & TIERS CONFIG (7 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Section Headings & Branding */}
          <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Type className="w-4 h-4 text-black" />
              <h3 className="font-bold text-sm uppercase text-black tracking-wider">
                1. SECTION HEADERS & LABELS
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                  TAGLINE / CATEGORY BADGE
                </label>
                <input
                  type="text"
                  value={config.sectionTag || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, sectionTag: e.target.value }))}
                  placeholder="MATERIAL TACTILE SCIENCE"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                  MAIN HEADLINE (SERIF)
                </label>
                <input
                  type="text"
                  value={config.headline || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, headline: e.target.value }))}
                  placeholder="480 GSM ARCHITECTURAL DRAPE"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                  EXPLANATORY SUBTEXT
                </label>
                <textarea
                  rows={3}
                  value={config.subtext || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, subtext: e.target.value }))}
                  placeholder="We reject fragile fast-fashion fabrics. Compare our 480 GSM double-weave density against commercial standards..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Card 2: GSM Tiers Calibrator & Physics Editor */}
          <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm uppercase text-black tracking-wider">
                  2. FABRIC WEIGHT TIERS & PHYSICS CALIBRATION
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400">
                ACTIVE TIER: {currentTier?.gsm} GSM
              </span>
            </div>

            {/* Tier Selector Tabs */}
            <div className="flex gap-2 p-1 bg-neutral-100 border border-neutral-200">
              {tiers.map((tier, idx) => (
                <button
                  key={tier.gsm || idx}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(650);
                    setActiveTierIdx(idx);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold uppercase transition-all cursor-pointer ${
                    activeTierIdx === idx
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                  }`}
                >
                  {tier.gsm} GSM
                </button>
              ))}
            </div>

            {/* Active Tier Form Fields */}
            {currentTier && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                      GSM WEIGHT (G/M²)
                    </label>
                    <input
                      type="number"
                      value={currentTier.gsm || 0}
                      onChange={(e) => updateCurrentTier("gsm", Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                      CATEGORY PILL BADGE
                    </label>
                    <input
                      type="text"
                      value={currentTier.category || ""}
                      onChange={(e) => updateCurrentTier("category", e.target.value)}
                      placeholder="Bespoke Architectural Double-Weave"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                    TIER FULL LABEL
                  </label>
                  <input
                    type="text"
                    value={currentTier.label || ""}
                    onChange={(e) => updateCurrentTier("label", e.target.value)}
                    placeholder="480 GSM • DRAPZA ATELIER STANDARD"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-1">
                    TIER DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    value={currentTier.description || ""}
                    onChange={(e) => updateCurrentTier("description", e.target.value)}
                    placeholder="Our signature heavyweight French Terry and Modal Silk weave..."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50 resize-y"
                  />
                </div>

                {/* Macro Texture Image URL & Upload & Quick Presets */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">
                      MACRO WEAVE TEXTURE IMAGE (CLOUDINARY / GOOGLE DRIVE / CDN)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {currentTier.image && isGoogleDriveUrl(currentTier.image) && (
                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                          ✓ Google Drive CDN Active
                        </span>
                      )}
                      {currentTier.image && currentTier.image.includes("cloudinary") && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                          ✓ Cloudinary Fast CDN Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={currentTier.image || ""}
                      onChange={(e) => updateCurrentTier("image", e.target.value)}
                      placeholder="Paste Google Drive share link, Cloudinary URL, or image CDN link..."
                      className="flex-1 px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50 font-mono"
                    />

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {/* Cloudinary Upload Trigger Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                    >
                      {isUploadingImage ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          <span>UPLOADING...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>UPLOAD IMAGE</span>
                        </>
                      )}
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {uploadError}
                    </p>
                  )}

                  {/* Thumbnail Row if Image Exists */}
                  {currentTier.image && (
                    <div className="flex items-center gap-3 p-2 bg-neutral-50 border border-neutral-200">
                      <div className="w-12 h-12 bg-white border border-neutral-300 overflow-hidden shrink-0">
                        <img
                          src={normalizeImageUrl(currentTier.image)}
                          alt="Thumbnail preview"
                          onError={handleImageFallbackError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-neutral-800 uppercase truncate">
                          {isGoogleDriveUrl(currentTier.image)
                            ? "Google Drive Link (Converted to Direct CDN)"
                            : currentTier.image.includes("cloudinary")
                            ? "Cloudinary CDN Hosted Image"
                            : "External Image URL"}
                        </p>
                        <p className="text-[9px] text-neutral-500 font-mono truncate">
                          {currentTier.image}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCurrentTier("image", "")}
                        className="text-[9px] text-rose-600 hover:text-rose-800 font-bold uppercase px-2 py-1 border border-rose-200 bg-white cursor-pointer"
                      >
                        CLEAR
                      </button>
                    </div>
                  )}

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold">
                      STOCK PRESETS:
                    </span>
                    {TEXTURE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(700);
                          updateCurrentTier("image", preset.url);
                        }}
                        className="text-[9px] px-2 py-0.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 text-neutral-700 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telemetry Metrics & Physics */}
                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-black" />
                    <span className="text-[10px] text-neutral-700 uppercase tracking-wider font-bold">
                      SILHOUETTE RIGIDITY TELEMETRY METRICS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-1">
                        FABRIC THICKNESS
                      </label>
                      <input
                        type="text"
                        value={currentTier.thickness || ""}
                        onChange={(e) => updateCurrentTier("thickness", e.target.value)}
                        placeholder="1.28 MM"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-1">
                        RIGIDITY SCORE
                      </label>
                      <input
                        type="text"
                        value={currentTier.rigidityScore || ""}
                        onChange={(e) => updateCurrentTier("rigidityScore", e.target.value)}
                        placeholder="96 / 100"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-1">
                        ZERO-CLING INDEX
                      </label>
                      <input
                        type="text"
                        value={currentTier.zeroClingIndex || ""}
                        onChange={(e) => updateCurrentTier("zeroClingIndex", e.target.value)}
                        placeholder="MAXIMUM ZERO-CLING"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase font-bold block mb-1">
                        THREAD COUNT DENSITY
                      </label>
                      <input
                        type="text"
                        value={currentTier.threadCount || ""}
                        onChange={(e) => updateCurrentTier("threadCount", e.target.value)}
                        placeholder="340 THREADS / SQ INCH"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50"
                      />
                    </div>
                  </div>

                  {/* Drape Fall Angle Slider */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-neutral-600 font-bold mb-1">
                      <span>GRAVITATIONAL DRAPE DEFLECTION:</span>
                      <span className="text-black font-mono">
                        {currentTier.drapeFallAngle}° ANGULAR SAG (RIGIDITY: {100 - currentTier.drapeFallAngle}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={85}
                      value={currentTier.drapeFallAngle || 22}
                      onChange={(e) => updateCurrentTier("drapeFallAngle", Number(e.target.value))}
                      className="w-full cursor-pointer accent-black"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                      <span>10° (Stiff Monolith)</span>
                      <span>50° (Moderate Drape)</span>
                      <span>85° (Weak Sag)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REAL-TIME LIVE PREVIEW (5 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-neutral-200 p-5 shadow-sm space-y-4 sticky top-28">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-black" />
                <h3 className="font-bold text-xs uppercase text-black tracking-wider">
                  1:1 LIVE STOREFRONT SIMULATION
                </h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-black text-white font-bold uppercase">
                PREVIEW
              </span>
            </div>

            {/* Mini Storefront Simulation Card */}
            <div className="p-4 bg-[#fafafb] border border-neutral-200 space-y-4">
              {/* Header Preview */}
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest block font-bold">
                  {config.sectionTag || "MATERIAL TACTILE SCIENCE"}
                </span>
                <h4 className="font-serif text-lg uppercase tracking-wider text-neutral-950 font-normal">
                  {config.headline || "480 GSM ARCHITECTURAL DRAPE"}
                </h4>
                <p className="text-[10px] text-neutral-600 line-clamp-2">
                  {config.subtext || "We reject fragile fast-fashion fabrics..."}
                </p>
              </div>

              {/* Macro Image Preview Stage */}
              <div className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-300 overflow-hidden shadow-sm">
                <img
                  src={normalizeImageUrl(currentTier?.image || "")}
                  alt={currentTier?.label}
                  onError={handleImageFallbackError}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 text-[8px] uppercase font-bold text-neutral-900 border border-neutral-200">
                  MACRO LOUPE • 4X WEAVE INSPECTOR
                </div>
                <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 border border-neutral-200 text-[8px] font-bold text-neutral-900 font-mono">
                  {currentTier?.threadCount}
                </div>
              </div>

              {/* 3 Tier Selector Buttons Preview */}
              <div className="grid grid-cols-3 gap-1.5">
                {tiers.map((t, idx) => (
                  <div
                    key={t.gsm || idx}
                    className={`py-2 px-1 text-center border ${
                      activeTierIdx === idx
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-800 border-neutral-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold block">{t.gsm} GSM</span>
                    <span className="text-[7px] block uppercase opacity-75">
                      {t.gsm === 480 ? "ATELIER" : "RETAIL"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Metrics Preview */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="p-2 bg-white border border-neutral-200 text-center">
                  <span className="text-[7px] text-neutral-500 uppercase block">THICKNESS</span>
                  <span className="text-[10px] font-bold text-neutral-950 block">
                    {currentTier?.thickness}
                  </span>
                </div>
                <div className="p-2 bg-white border border-neutral-200 text-center">
                  <span className="text-[7px] text-neutral-500 uppercase block">RIGIDITY</span>
                  <span className="text-[10px] font-bold text-neutral-950 block">
                    {currentTier?.rigidityScore}
                  </span>
                </div>
                <div className="p-2 bg-white border border-neutral-200 text-center">
                  <span className="text-[7px] text-neutral-500 uppercase block">ZERO-CLING</span>
                  <span className="text-[9px] font-bold text-neutral-950 block truncate">
                    {currentTier?.zeroClingIndex}
                  </span>
                </div>
              </div>

              {/* Deflection Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] text-neutral-600 uppercase font-bold">
                  <span>DRAPE DEFLECTION</span>
                  <span>{currentTier?.drapeFallAngle}° ANGULAR SAG</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5">
                  <div
                    style={{ width: `${100 - (currentTier?.drapeFallAngle || 22)}%` }}
                    className="h-full bg-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reset Factory Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="RESET FABRIC SCIENCE CMS TO FACTORY DEFAULT?"
        message="This will restore original 180, 280, and 480 GSM metrics, default Unsplash textures, and original atelier copy. All custom changes will be overwritten."
        confirmLabel={isResetting ? "RESETTING..." : "YES, RESTORE FACTORY DEFAULT"}
        cancelLabel="CANCEL"
        variant="reset"
      />
    </div>
  );
};

