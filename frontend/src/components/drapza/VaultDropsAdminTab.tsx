"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Unlock,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Key,
  ShoppingBag,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Users,
  Timer,
  Upload,
} from "lucide-react";
import {
  VaultDropsConfigData,
  DEFAULT_VAULT_DROPS_CONFIG,
  vaultDropsApi,
  productApi,
  siteConfigApi,
} from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";
import {
  normalizeImageUrl,
  handleImageFallbackError,
  isGoogleDriveUrl,
} from "@/lib/imageUtils";

interface VaultDropsAdminTabProps {
  initialConfig?: VaultDropsConfigData;
  onSaveSuccess?: () => void;
}

const PRESET_VAULT_IMAGES = [
  {
    name: "Architectural Kimono (Black)",
    url: "/images/drapza/products/product_1.png",
  },
  {
    name: "Translucent Trench Studio (Dark)",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Sculpted Monolith Silhouette",
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Heavyweight 480 GSM Bespoke",
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
  },
];

export const VaultDropsAdminTab: React.FC<VaultDropsAdminTabProps> = ({
  initialConfig,
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<VaultDropsConfigData>(
    initialConfig || DEFAULT_VAULT_DROPS_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "ERROR" | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const garment = config.garment || DEFAULT_VAULT_DROPS_CONFIG.garment!;
  const countdown = config.countdown || DEFAULT_VAULT_DROPS_CONFIG.countdown!;
  const vipProtocol = config.vipProtocol || DEFAULT_VAULT_DROPS_CONFIG.vipProtocol!;
  const features = garment.features || [];

  // Save Config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(800);

    try {
      const res = await vaultDropsApi.updateConfig(config);
      if (res && res.success) {
        setSaveStatus("SAVED");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus("ERROR");
        audioSystem.playError();
      }
    } catch (err) {
      console.error("[VAULT DROPS CMS] Save error:", err);
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
      const res = await vaultDropsApi.resetConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
        audioSystem.playSuccess();
        setShowResetConfirm(false);
      }
    } catch (err) {
      console.error("[VAULT DROPS CMS] Reset error:", err);
      audioSystem.playError();
    } finally {
      setIsResetting(false);
    }
  };

  // Helpers for nested states
  const updateGarment = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      garment: {
        ...(prev.garment || DEFAULT_VAULT_DROPS_CONFIG.garment!),
        [field]: value,
      },
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
        const fallbackRes = await siteConfigApi.uploadAsset(base64, "drapza_vault_drops");
        if (fallbackRes && fallbackRes.url) {
          uploadedUrl = fallbackRes.url;
        }
      }

      if (uploadedUrl) {
        updateGarment("image", uploadedUrl);
        audioSystem.playSuccess();
      } else {
        throw new Error("No URL returned from Cloudinary upload");
      }
    } catch (err: any) {
      console.error("[VAULT DROPS CLOUDINARY UPLOAD ERROR]", err);
      setUploadError(err.message || "Failed to upload image");
      audioSystem.playError();
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateCountdown = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      countdown: {
        ...(prev.countdown || DEFAULT_VAULT_DROPS_CONFIG.countdown!),
        [field]: value,
      },
    }));
  };

  const updateVipProtocol = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      vipProtocol: {
        ...(prev.vipProtocol || DEFAULT_VAULT_DROPS_CONFIG.vipProtocol!),
        [field]: value,
      },
    }));
  };

  // Add bullet point
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    audioSystem.playClick(700);
    const updated = [...features, newFeatureText.trim()];
    updateGarment("features", updated);
    setNewFeatureText("");
  };

  // Remove bullet point
  const handleRemoveFeature = (idx: number) => {
    audioSystem.playClick(400);
    const updated = features.filter((_, i) => i !== idx);
    updateGarment("features", updated);
  };

  return (
    <div className="space-y-8 pb-12 font-mono text-neutral-900">
      {/* Top Sticky HUD Controller */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-neutral-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 text-white">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-950">
                THE VAULT DROPS CMS
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
              Manage scarcity drops, serialized garment allocations, countdown clocks & VIP passcodes.
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

      {/* Save Notification */}
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
                ? "VAULT DROPS CONFIGURATION SAVED & PUBLISHED LIVE"
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

      {/* Section Global Headers & Scarcity Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Section Header Copy */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
              [ 01 ] SECTION HEADERS & EDITORIAL MANIFESTO
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
              VAULT BRANDING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Section Tagline
              </label>
              <input
                type="text"
                value={config.sectionTag || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, sectionTag: e.target.value }))}
                placeholder="THE VAULT • STRICT MONOCHROME ARCHIVE"
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
                placeholder="LIMITED BATCH 004 DROP"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Subtext / Scarcity Rules
              </label>
              <textarea
                rows={2}
                value={config.subtext || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, subtext: e.target.value }))}
                placeholder="Strictly 50 individually serialized garments crafted per drop..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right: Batch Allocation Counter */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
              [ 02 ] SCARCITY BATCH TELEMETRY
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              LIVE INVENTORY
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Batch Code
              </label>
              <input
                type="text"
                value={config.batchNumber || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="BATCH 004"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                  Allocated / Sold
                </label>
                <input
                  type="number"
                  value={config.allocatedUnits || 0}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      allocatedUnits: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                  Total Crafted
                </label>
                <input
                  type="number"
                  value={config.totalUnits || 50}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      totalUnits: parseInt(e.target.value, 10) || 50,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
                />
              </div>
            </div>

            {/* Live Progress Bar Simulation */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>BATCH STATUS:</span>
                <span className="text-neutral-900">
                  {config.allocatedUnits || 0} / {config.totalUnits || 50} ALLOCATED (
                  {Math.max(0, (config.totalUnits || 50) - (config.allocatedUnits || 0))} REMAINING)
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-200 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((config.allocatedUnits || 0) / (config.totalUnits || 50)) * 100)
                    )}%`,
                  }}
                  className="h-full bg-black transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Garment Drop Editor & Countdown / VIP Key */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Serialized Garment Configuration */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
              [ 03 ] SERIALIZED GARMENT DROP DETAILS
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
              EXCLUSIVE ITEM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Garment Title
              </label>
              <input
                type="text"
                value={garment.title || ""}
                onChange={(e) => updateGarment("title", e.target.value)}
                placeholder="ARCHITECTURAL KIMONO TRENCH"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Category / Batch Badge
              </label>
              <input
                type="text"
                value={garment.badge || ""}
                onChange={(e) => updateGarment("badge", e.target.value)}
                placeholder="EXCLUSIVE BATCH DROP"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Serial Plate Prefix
              </label>
              <input
                type="text"
                value={garment.serialPrefix || ""}
                onChange={(e) => updateGarment("serialPrefix", e.target.value)}
                placeholder="SERIAL NO. #884-"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Price & Specs Display Tag
              </label>
              <input
                type="text"
                value={garment.priceFormatted || ""}
                onChange={(e) => updateGarment("priceFormatted", e.target.value)}
                placeholder="₹4,850 • 480 GSM"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Numeric Checkout Price (INR)
              </label>
              <input
                type="number"
                value={garment.price || 0}
                onChange={(e) => updateGarment("price", parseFloat(e.target.value) || 0)}
                placeholder="4850"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                CTA Reserve Button Label
              </label>
              <input
                type="text"
                value={garment.buttonText || ""}
                onChange={(e) => updateGarment("buttonText", e.target.value)}
                placeholder="RESERVE NEXT ALLOCATION"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold">
                  Garment Photography Image (Cloudinary / Google Drive / CDN)
                </label>
                <div className="flex items-center gap-1.5">
                  {garment.image && isGoogleDriveUrl(garment.image) && (
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                      ✓ Google Drive CDN Active
                    </span>
                  )}
                  {garment.image && garment.image.includes("cloudinary") && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                      ✓ Cloudinary Fast CDN Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={garment.image || ""}
                  onChange={(e) => updateGarment("image", e.target.value)}
                  placeholder="Paste Google Drive share link, Cloudinary URL, or image CDN link..."
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
                />

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Upload Button */}
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
              {garment.image && (
                <div className="flex items-center gap-3 p-2 bg-neutral-50 border border-neutral-200">
                  <div className="w-12 h-12 bg-white border border-neutral-300 overflow-hidden shrink-0">
                    <img
                      src={normalizeImageUrl(garment.image)}
                      alt="Garment preview"
                      onError={handleImageFallbackError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-neutral-800 uppercase truncate">
                      {isGoogleDriveUrl(garment.image)
                        ? "Google Drive Link (Converted to Direct CDN)"
                        : garment.image.includes("cloudinary")
                        ? "Cloudinary CDN Hosted Image"
                        : "External Image URL"}
                    </p>
                    <p className="text-[9px] text-neutral-500 font-mono truncate">
                      {garment.image}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateGarment("image", "")}
                    className="text-[9px] text-rose-600 hover:text-rose-800 font-bold uppercase px-2 py-1 border border-rose-200 bg-white cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
              )}

              {/* Preset recommendations */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">
                  Presets:
                </span>
                {PRESET_VAULT_IMAGES.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(600);
                      updateGarment("image", preset.url);
                    }}
                    className="px-2 py-0.5 text-[9px] uppercase font-bold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bullet Point Features List */}
            <div className="sm:col-span-2 pt-2 border-t border-neutral-200 space-y-3">
              <label className="block text-[11px] uppercase tracking-wider text-neutral-700 font-bold">
                Tailoring & Material Bullet Points ({features.length})
              </label>

              <div className="space-y-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 font-mono">•</span>
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[idx] = e.target.value;
                        updateGarment("features", updated);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 border border-neutral-300 hover:border-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Feature */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="e.g. 100% Modal Silk Interlining..."
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Countdown Clock & VIP Access Protocol */}
        <div className="lg:col-span-5 space-y-6">
          {/* Countdown Clock Settings */}
          <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> [ 04 ] COUNTDOWN CLOCK
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                TIMED SCARCITY
              </span>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Countdown Title
              </label>
              <input
                type="text"
                value={countdown.heading || ""}
                onChange={(e) => updateCountdown("heading", e.target.value)}
                placeholder="GLOBAL PUBLIC ALLOCATION CLOSES IN:"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={countdown.timerHours || 0}
                  onChange={(e) =>
                    updateCountdown("timerHours", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={countdown.timerMinutes || 0}
                  onChange={(e) =>
                    updateCountdown("timerMinutes", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={countdown.timerSeconds || 0}
                  onChange={(e) =>
                    updateCountdown("timerSeconds", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* VIP Protocol Card Settings */}
          <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-500 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> [ 05 ] VIP EARLY ACCESS PROTOCOL
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                PASSCODE GENERATOR
              </span>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Protocol Badge
              </label>
              <input
                type="text"
                value={vipProtocol.badge || ""}
                onChange={(e) => updateVipProtocol("badge", e.target.value)}
                placeholder="VIP EARLY ACCESS PROTOCOL"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Card Headline
              </label>
              <input
                type="text"
                value={vipProtocol.title || ""}
                onChange={(e) => updateVipProtocol("title", e.target.value)}
                placeholder="REQUEST BATCH 005 VAULT PASSCODE"
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                Description Subtext
              </label>
              <textarea
                rows={2}
                value={vipProtocol.subtext || ""}
                onChange={(e) => updateVipProtocol("subtext", e.target.value)}
                placeholder="Receive a priority cryptographic key..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                  Input Placeholder
                </label>
                <input
                  type="text"
                  value={vipProtocol.inputPlaceholder || ""}
                  onChange={(e) => updateVipProtocol("inputPlaceholder", e.target.value)}
                  placeholder="ENTER EMAIL OR WHATSAPP NUMBER"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                  Button Label
                </label>
                <input
                  type="text"
                  value={vipProtocol.buttonText || ""}
                  onChange={(e) => updateVipProtocol("buttonText", e.target.value)}
                  placeholder="GENERATE PRIVATE VAULT KEY"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1:1 Live Simulation Preview (Matching User Screenshot) */}
      <div className="bg-[#08080a] text-white border border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-300">
              1:1 LIVE STOREFRONT SIMULATION PREVIEW
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
            {config.batchNumber || "BATCH 004"}
          </span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs tracking-[0.25em] uppercase font-semibold">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>{config.sectionTag}</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl uppercase tracking-[0.16em] text-white">
              {config.headline}
            </h3>
            <p className="text-xs text-neutral-400 font-light max-w-xl">
              {config.subtext}
            </p>
          </div>

          <div className="p-3 bg-[#121316] border border-neutral-800 space-y-1">
            <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">
              BATCH ALLOCATION STATUS:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">
                {config.allocatedUnits} / {config.totalUnits} CRAFTED
              </span>
              <span className="px-2 py-0.5 bg-black border border-neutral-700 text-neutral-300 text-[9px] uppercase font-bold">
                {Math.max(0, (config.totalUnits || 50) - (config.allocatedUnits || 0))} REMAINING
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Vault Stage Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Garment Card */}
          <div className="lg:col-span-7 bg-[#121316] border border-neutral-800 p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-6 relative aspect-[3/4] bg-black border border-neutral-800 overflow-hidden">
                <img
                  src={normalizeImageUrl(garment.image || "")}
                  alt={garment.title}
                  onError={handleImageFallbackError}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-1 bg-black/90 text-[9px] font-bold text-neutral-200 uppercase tracking-widest border border-neutral-800">
                  {garment.serialPrefix}020
                </span>
              </div>

              <div className="sm:col-span-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block">
                    {garment.badge}
                  </span>
                  <h4 className="font-serif text-lg font-bold uppercase text-white tracking-wider">
                    {garment.title}
                  </h4>
                  <span className="text-sm font-bold text-white block">
                    {garment.priceFormatted}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-400 pt-3 border-t border-neutral-800 font-light">
                  {features.map((f, i) => (
                    <p key={i}>• {f}</p>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="w-full py-2.5 bg-white text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{garment.buttonText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Countdown Box */}
            <div className="bg-[#121316] border border-neutral-800 p-6 space-y-3 text-center">
              <span className="text-[9px] text-neutral-400 uppercase tracking-[0.25em] font-bold block">
                {countdown.heading}
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-black border border-neutral-800">
                  <span className="text-2xl font-bold text-white block font-mono">
                    {String(countdown.timerHours || 14).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    HOURS
                  </span>
                </div>
                <div className="p-3 bg-black border border-neutral-800">
                  <span className="text-2xl font-bold text-white block font-mono">
                    {String(countdown.timerMinutes || 20).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    MINUTES
                  </span>
                </div>
                <div className="p-3 bg-black border border-neutral-800">
                  <span className="text-2xl font-bold text-white block font-mono">
                    {String(countdown.timerSeconds || 48).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] text-neutral-500 uppercase tracking-widest mt-1 block">
                    SECONDS
                  </span>
                </div>
              </div>
            </div>

            {/* VIP Passcode Form */}
            <div className="bg-[#121316] border border-neutral-800 p-6 space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block">
                  {vipProtocol.badge}
                </span>
                <h4 className="text-xs font-bold uppercase text-white">
                  {vipProtocol.title}
                </h4>
                <p className="text-[11px] text-neutral-400 font-light">
                  {vipProtocol.subtext}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="w-full bg-[#1c1d22] border border-neutral-700 p-2.5 text-neutral-500 font-mono text-xs uppercase">
                  {vipProtocol.inputPlaceholder}
                </div>
                <div className="w-full py-2 bg-neutral-900 text-neutral-300 border border-neutral-700 text-[11px] uppercase font-bold tracking-wider text-center">
                  {vipProtocol.buttonText}
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
        title="RESTORE FACTORY VAULT DROPS CMS?"
        message="This will reset the serialized kimono trench, batch numbers, countdown timer, and default features back to factory defaults. All custom alterations will be overwritten."
        confirmLabel={isResetting ? "RESETTING..." : "YES, RESTORE FACTORY DEFAULT"}
        cancelLabel="CANCEL"
        variant="reset"
      />
    </div>
  );
};

