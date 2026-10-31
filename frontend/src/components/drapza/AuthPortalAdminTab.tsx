"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Lock,
  Unlock,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
  Layers,
  Shirt,
  Scissors,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  Palette,
  Volume2,
  Sliders,
  Eye,
  Check,
  MousePointer,
  Upload,
} from "lucide-react";
import {
  AuthPortalConfigData,
  DEFAULT_AUTH_PORTAL_CONFIG,
  FabricSwatchData,
  authPortalApi,
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

interface AuthPortalAdminTabProps {
  initialConfig?: AuthPortalConfigData;
  onSaveSuccess?: () => void;
}

const PRESET_SWATCH_IMAGES = [
  { name: "Raw Charcoal Archetype", url: "/images/drapza/products/product_1.png" },
  { name: "Vintage Sage Silhouette", url: "/images/drapza/products/product_18.png" },
  { name: "Natural Ecru Loopback", url: "/images/drapza/products/product_11.png" },
  { name: "Cyber Onyx Trench", url: "/images/drapza/products/product_5.png" },
  { name: "Subtle Monolith Vest", url: "/images/drapza/products/product_8.png" },
];

export const AuthPortalAdminTab: React.FC<AuthPortalAdminTabProps> = ({
  initialConfig,
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<AuthPortalConfigData>(
    initialConfig || DEFAULT_AUTH_PORTAL_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "ERROR" | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewMode, setPreviewMode] = useState<"login" | "signup">("login");
  const [activeSwatchIndex, setActiveSwatchIndex] = useState(0);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const swatches: FabricSwatchData[] =
    config.fabricSwatches && config.fabricSwatches.length > 0
      ? config.fabricSwatches
      : DEFAULT_AUTH_PORTAL_CONFIG.fabricSwatches!;

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(800);

    try {
      const res = await authPortalApi.updateConfig(config);
      if (res && res.success) {
        setSaveStatus("SAVED");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus("ERROR");
        audioSystem.playError();
      }
    } catch (err) {
      console.error("[AUTH CMS] Save error:", err);
      setSaveStatus("ERROR");
      audioSystem.playError();
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Handle Factory Reset
  const handleReset = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    audioSystem.playClick(600);

    try {
      const res = await authPortalApi.resetConfig();
      if (res && res.success) {
        setConfig(res.data || DEFAULT_AUTH_PORTAL_CONFIG);
        setSaveStatus("SAVED");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus("ERROR");
      }
    } catch (err) {
      console.error("[AUTH CMS] Reset error:", err);
      setSaveStatus("ERROR");
    } finally {
      setIsResetting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Add New Swatch
  const handleAddSwatch = () => {
    const newId = `fabric_${Date.now()}`;
    const newSwatch: FabricSwatchData = {
      id: newId,
      name: "CUSTOM FABRIC SPEC",
      weight: "500 GSM HEAVYWEIGHT INTERLOCK",
      blend: "100% COMBED GIZA COTTON",
      cut: "MODULAR DRAPE ARCHETYPE",
      colorHex: "#222222",
      tagBg: "bg-[#181818]",
      tagText: "text-[#f0f0f0]",
      accentBadge: "HAND FINISHED",
      image: "/images/drapza/products/product_1.png",
    };
    setConfig((prev) => ({
      ...prev,
      fabricSwatches: [...(prev.fabricSwatches || []), newSwatch],
    }));
    setActiveSwatchIndex(swatches.length);
  };

  // Update Swatch
  const handleUpdateSwatch = (index: number, field: keyof FabricSwatchData, value: string) => {
    const updated = [...swatches];
    updated[index] = { ...updated[index], [field]: value };
    setConfig((prev) => ({ ...prev, fabricSwatches: updated }));
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
        const fallbackRes = await siteConfigApi.uploadAsset(base64, "drapza_auth_portal");
        if (fallbackRes && fallbackRes.url) {
          uploadedUrl = fallbackRes.url;
        }
      }

      if (uploadedUrl) {
        handleUpdateSwatch(activeSwatchIndex, "image", uploadedUrl);
        audioSystem.playSuccess();
      } else {
        throw new Error("No URL returned from Cloudinary upload");
      }
    } catch (err: any) {
      console.error("[AUTH PORTAL CLOUDINARY UPLOAD ERROR]", err);
      setUploadError(err.message || "Failed to upload image");
      audioSystem.playError();
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Swatch
  const handleDeleteSwatch = (index: number) => {
    if (swatches.length <= 1) {
      alert("At least one fabric swatch must remain for the apparel showcase.");
      return;
    }
    const updated = swatches.filter((_, i) => i !== index);
    setConfig((prev) => ({ ...prev, fabricSwatches: updated }));
    if (activeSwatchIndex >= updated.length) {
      setActiveSwatchIndex(Math.max(0, updated.length - 1));
    }
  };

  const currentPreviewSwatch = swatches[activeSwatchIndex] || swatches[0];

  return (
    <div className="space-y-8 font-mono-technical text-neutral-800 pb-16">
      {/* Top Header & Publishing Controls */}
      <div className="bg-white border border-neutral-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-black" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-black font-display">
              AUTH &amp; LOGIN PORTAL CMS
            </h2>
            <span className="text-[10px] uppercase tracking-wider bg-black text-white px-2 py-0.5 font-bold">
              ZERO-RADIUS ATELIER READY
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-1 uppercase tracking-wider">
            Live management of Drapza login and registration portal, fabric swatches, copy, aesthetics, and feature toggles.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {saveStatus === "SAVED" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-2 font-bold uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>PUBLISHED LIVE</span>
            </div>
          )}

          {saveStatus === "ERROR" && (
            <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-300 px-3 py-2 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>SAVE FAILED</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs uppercase tracking-wider transition-all font-bold cursor-pointer disabled:opacity-50"
            title="Reset to factory atelier defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>FACTORY RESET</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs uppercase tracking-widest transition-all font-bold cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin inline-block" />
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE &amp; PUBLISH LIVE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Settings on Left (7 cols), Live 1:1 Preview on Right (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Settings Panels */}
        <div className="xl:col-span-7 space-y-8">

          {/* Section 1: Aesthetic & Corner Radius Vibe */}
          <div className="bg-white border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Palette className="w-4 h-4 text-black" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-black">
                01. AESTHETIC VIBE &amp; CORNER GEOMETRY
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-700 font-bold mb-2">
                  CORNER RADIUS ARCHETYPE:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "zero-radius", label: "ZERO-RADIUS (BRUTALIST SHARP)", desc: "100% Sharp 90° Corners" },
                    { id: "subtle-rounded", label: "SUBTLE ROUNDED", desc: "6px Clean Architecture" },
                    { id: "curved", label: "CURVED PILL", desc: "24px Soft Modern Luxury" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          cardStyle: style.id as any,
                        }))
                      }
                      className={`p-3 text-left border transition-all cursor-pointer ${config.cardStyle === style.id
                          ? "border-black bg-neutral-900 text-white shadow-sm"
                          : "border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-black"
                        }`}
                    >
                      <div className="text-xs font-bold uppercase">{style.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <div>
                  <span className="text-xs font-bold uppercase text-black block">
                    PATTERN GRID &amp; SEAM MEASUREMENT RULERS
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase">
                    Display architectural pattern grid, measurement ticks, and seam markers in background
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.backgroundPatternEnabled ?? true}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      backgroundPatternEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-700 font-bold mb-1">
                  SEAM RULER LABELS:
                </label>
                <input
                  type="text"
                  value={config.rulerMeasurementText || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, rulerMeasurementText: e.target.value }))
                  }
                  placeholder="[00CM] | [25CM • CHEST] | [50CM • SEAM] | [75CM • HEM] | [100CM]"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Apparel Showcase & Fabric Swatches */}
          <div className="bg-white border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-black" />
                <h3 className="text-sm font-bold tracking-widest uppercase text-black">
                  02. FABRIC SWATCHES &amp; 3D APPAREL SHOWCASE
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddSwatch}
                className="flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[11px] uppercase tracking-wider font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD TEXTILE</span>
              </button>
            </div>

            {/* Swatch Selector Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {swatches.map((sw, idx) => (
                <button
                  key={sw.id || idx}
                  type="button"
                  onClick={() => setActiveSwatchIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider border cursor-pointer font-bold transition-all ${activeSwatchIndex === idx
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-black"
                    }`}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 border border-neutral-400"
                    style={{ backgroundColor: sw.colorHex }}
                  />
                  <span>{sw.name}</span>
                </button>
              ))}
            </div>

            {/* Active Swatch Editor */}
            {currentPreviewSwatch && (
              <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-4 mt-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    EDITING: {currentPreviewSwatch.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSwatch(activeSwatchIndex)}
                    className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>REMOVE</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      TEXTILE COLORWAY NAME:
                    </label>
                    <input
                      type="text"
                      value={currentPreviewSwatch.name || ""}
                      onChange={(e) => handleUpdateSwatch(activeSwatchIndex, "name", e.target.value)}
                      placeholder="RAW CHARCOAL"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      ACCENT BADGE (FLOATING SPEC):
                    </label>
                    <input
                      type="text"
                      value={currentPreviewSwatch.accentBadge || ""}
                      onChange={(e) =>
                        handleUpdateSwatch(activeSwatchIndex, "accentBadge", e.target.value)
                      }
                      placeholder="ENZYME STONEWASH"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      WEIGHT / DENSITY:
                    </label>
                    <input
                      type="text"
                      value={currentPreviewSwatch.weight || ""}
                      onChange={(e) => handleUpdateSwatch(activeSwatchIndex, "weight", e.target.value)}
                      placeholder="480 GSM HEAVYWEIGHT FRENCH TERRY"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      COMPOSITION BLEND:
                    </label>
                    <input
                      type="text"
                      value={currentPreviewSwatch.blend || ""}
                      onChange={(e) => handleUpdateSwatch(activeSwatchIndex, "blend", e.target.value)}
                      placeholder="100% COMBED ORGANIC COTTON"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      CUT / SILHOUETTE ARCHETYPE:
                    </label>
                    <input
                      type="text"
                      value={currentPreviewSwatch.cut || ""}
                      onChange={(e) => handleUpdateSwatch(activeSwatchIndex, "cut", e.target.value)}
                      placeholder="OVERSIZED DROP-SHOULDER ARCHETYPE"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                      COLOR HEX VALUE:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentPreviewSwatch.colorHex || "#1b1b1b"}
                        onChange={(e) =>
                          handleUpdateSwatch(activeSwatchIndex, "colorHex", e.target.value)
                        }
                        className="w-8 h-8 border border-neutral-300 p-0.5 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={currentPreviewSwatch.colorHex || ""}
                        onChange={(e) =>
                          handleUpdateSwatch(activeSwatchIndex, "colorHex", e.target.value)
                        }
                        placeholder="#1b1b1b"
                        className="flex-1 px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-[10px] uppercase font-bold text-neutral-600">
                      GARMENT CUTOUT IMAGE (CLOUDINARY / GOOGLE DRIVE / CDN):
                    </label>
                    <div className="flex items-center gap-1.5">
                      {currentPreviewSwatch.image && isGoogleDriveUrl(currentPreviewSwatch.image) && (
                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                          ✓ Google Drive CDN Active
                        </span>
                      )}
                      {currentPreviewSwatch.image && currentPreviewSwatch.image.includes("cloudinary") && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-bold uppercase tracking-wider">
                          ✓ Cloudinary Fast CDN Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={currentPreviewSwatch.image || ""}
                      onChange={(e) => handleUpdateSwatch(activeSwatchIndex, "image", e.target.value)}
                      placeholder="Paste Google Drive link, Cloudinary URL, or /images/..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-neutral-300 bg-white font-mono-technical tracking-wider"
                    />

                    {/* Hidden Native File Input */}
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
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
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
                  {currentPreviewSwatch.image && (
                    <div className="flex items-center gap-3 p-2 bg-neutral-50 border border-neutral-200">
                      <div className="w-12 h-12 bg-white border border-neutral-300 overflow-hidden shrink-0">
                        <img
                          src={normalizeImageUrl(currentPreviewSwatch.image)}
                          alt="Swatch preview"
                          onError={handleImageFallbackError}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-neutral-800 uppercase truncate">
                          {isGoogleDriveUrl(currentPreviewSwatch.image)
                            ? "Google Drive Link (Converted to Direct CDN)"
                            : currentPreviewSwatch.image.includes("cloudinary")
                              ? "Cloudinary CDN Hosted Image"
                              : "Local / External Image"}
                        </p>
                        <p className="text-[9px] text-neutral-500 font-mono truncate">
                          {currentPreviewSwatch.image}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateSwatch(activeSwatchIndex, "image", "")}
                        className="text-[9px] text-rose-600 hover:text-rose-800 font-bold uppercase px-2 py-1 border border-rose-200 bg-white cursor-pointer"
                      >
                        CLEAR
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Presets:</span>
                    {PRESET_SWATCH_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handleUpdateSwatch(activeSwatchIndex, "image", preset.url)}
                        className="text-[10px] underline text-neutral-700 hover:text-black font-semibold cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Atelier Identity & Hanging Wash Tag */}
          <div className="bg-white border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Shirt className="w-4 h-4 text-black" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-black">
                03. ATELIER IDENTITY &amp; HANGTAG SPECIFICATIONS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  ATELIER BAR HEADER:
                </label>
                <input
                  type="text"
                  value={config.atelierTag || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, atelierTag: e.target.value }))}
                  placeholder="DRAPZA ATELIER • FW26"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  STITCH SPEC BADGE (TOP RIGHT):
                </label>
                <input
                  type="text"
                  value={config.stitchSpecText || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, stitchSpecText: e.target.value }))
                  }
                  placeholder="STITCH SPEC: 12 SPI HEAVY SEAM"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  MEMBER PROTOCOL LABEL:
                </label>
                <input
                  type="text"
                  value={config.memberProtocolBadge || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, memberProtocolBadge: e.target.value }))
                  }
                  placeholder="MEMBER PROTOCOL"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  HANGING TAG LOT NUMBER:
                </label>
                <input
                  type="text"
                  value={config.atelierLotNumber || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, atelierLotNumber: e.target.value }))
                  }
                  placeholder="LOT #042"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono-technical uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Hangtag Sub-settings */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-black">
                  SHOW HANGING WASH-CARE FABRIC TAG
                </span>
                <input
                  type="checkbox"
                  checked={config.hangtagEnabled ?? true}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, hangtagEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              {config.hangtagEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-neutral-200">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                      FABRIC SUBTEXT:
                    </label>
                    <input
                      type="text"
                      value={config.hangtagSubtext || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, hangtagSubtext: e.target.value }))
                      }
                      placeholder="100% HEAVYWEIGHT COTTON"
                      className="w-full px-2 py-1 text-[11px] border border-neutral-300 bg-white uppercase font-mono-technical"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                      GSM DENSITY:
                    </label>
                    <input
                      type="text"
                      value={config.hangtagGsm || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, hangtagGsm: e.target.value }))
                      }
                      placeholder="480 GSM"
                      className="w-full px-2 py-1 text-[11px] border border-neutral-300 bg-white uppercase font-mono-technical"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                      CARE SPEC:
                    </label>
                    <input
                      type="text"
                      value={config.hangtagCare || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, hangtagCare: e.target.value }))
                      }
                      placeholder="WASH 30°C"
                      className="w-full px-2 py-1 text-[11px] border border-neutral-300 bg-white uppercase font-mono-technical"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Login & Register Copy Texts */}
          <div className="bg-white border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Key className="w-4 h-4 text-black" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-black">
                04. LOGIN &amp; REGISTER COPY EDITOR
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Login Column */}
              <div className="space-y-3 p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-xs font-bold uppercase tracking-wider text-black block border-b border-neutral-200 pb-1">
                  LOGIN EXPERIENCE
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    LEFT CARD HEADLINE:
                  </label>
                  <input
                    type="text"
                    value={config.loginTitle || ""}
                    onChange={(e) => setConfig((prev) => ({ ...prev, loginTitle: e.target.value }))}
                    placeholder="WARDROBE ACCESS"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    LEFT CARD SUBTITLE:
                  </label>
                  <textarea
                    rows={2}
                    value={config.loginSubtitle || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, loginSubtitle: e.target.value }))
                    }
                    placeholder="Sign in to access your curated fits, order tracking..."
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    FORM HEADING:
                  </label>
                  <input
                    type="text"
                    value={config.loginFormHeading || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, loginFormHeading: e.target.value }))
                    }
                    placeholder="WARDROBE SIGN IN"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    SUBMIT BUTTON TEXT:
                  </label>
                  <input
                    type="text"
                    value={config.loginButtonText || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, loginButtonText: e.target.value }))
                    }
                    placeholder="ENTER WARDROBE VAULT"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    SUCCESS TITLE:
                  </label>
                  <input
                    type="text"
                    value={config.loginSuccessHeading || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, loginSuccessHeading: e.target.value }))
                    }
                    placeholder="WARDROBE VAULT UNLOCKED"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
              </div>

              {/* Register Column */}
              <div className="space-y-3 p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-xs font-bold uppercase tracking-wider text-black block border-b border-neutral-200 pb-1">
                  REGISTER EXPERIENCE
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    LEFT CARD HEADLINE:
                  </label>
                  <input
                    type="text"
                    value={config.registerTitle || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, registerTitle: e.target.value }))
                    }
                    placeholder="JOIN THE COLLECTIVE"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    LEFT CARD SUBTITLE:
                  </label>
                  <textarea
                    rows={2}
                    value={config.registerSubtitle || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, registerSubtitle: e.target.value }))
                    }
                    placeholder="Create an identity to unlock member-only 500-piece numbered garment drops..."
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    FORM HEADING:
                  </label>
                  <input
                    type="text"
                    value={config.registerFormHeading || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, registerFormHeading: e.target.value }))
                    }
                    placeholder="REGISTER"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    SUBMIT BUTTON TEXT:
                  </label>
                  <input
                    type="text"
                    value={config.registerButtonText || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, registerButtonText: e.target.value }))
                    }
                    placeholder="REGISTER"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                    SUCCESS TITLE:
                  </label>
                  <input
                    type="text"
                    value={config.registerSuccessHeading || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, registerSuccessHeading: e.target.value }))
                    }
                    placeholder="ACCOUNT REGISTERED"
                    className="w-full px-2 py-1 border border-neutral-300 bg-white font-mono-technical uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Feature Toggles & VIP Callouts */}
          <div className="bg-white border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Sliders className="w-4 h-4 text-black" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-black">
                05. FEATURE TOGGLES &amp; ATELIER PERKS
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Google SSO */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="font-bold uppercase text-black block">GOOGLE ONE-TAP SSO LOGIN</span>
                  <span className="text-[10px] text-neutral-500 uppercase">
                    Allow clients to authenticate using Google identity popup
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableGoogleLogin ?? true}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enableGoogleLogin: e.target.checked }))
                  }
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="font-bold uppercase text-black block">TACTILE SOUND EFFECTS (SFX)</span>
                  <span className="text-[10px] text-neutral-500 uppercase">
                    Interactive audio feedback clicks on swatch changes and button presses
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSoundEffects ?? true}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enableSoundEffects: e.target.checked }))
                  }
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              {/* 3D Cursor Tilt */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="font-bold uppercase text-black block">3D CURSOR PARALLAX TILT</span>
                  <span className="text-[10px] text-neutral-500 uppercase">
                    Garment and hanging tag tilt in 3D perspective with mouse movement
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable3dParallax ?? true}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enable3dParallax: e.target.checked }))
                  }
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              {/* Bottom Member Perks Strip */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-black">BOTTOM ATELIER PERKS BANNER</span>
                  <input
                    type="checkbox"
                    checked={config.memberPerksEnabled ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, memberPerksEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>
                {config.memberPerksEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-200">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                        PERKS TEXT:
                      </label>
                      <input
                        type="text"
                        value={config.memberPerksText || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, memberPerksText: e.target.value }))
                        }
                        placeholder="MEMBER PRIVILEGE: BESPOKE SIZING..."
                        className="w-full px-2 py-1 text-[11px] border border-neutral-300 bg-white font-mono-technical uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-0.5">
                        BADGE:
                      </label>
                      <input
                        type="text"
                        value={config.memberPerksBadge || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, memberPerksBadge: e.target.value }))
                        }
                        placeholder="[ATELIER VIP]"
                        className="w-full px-2 py-1 text-[11px] border border-neutral-300 bg-white font-mono-technical uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Column (5 cols) */}
        <div className="xl:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white border border-neutral-300 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-black" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-black">
                  1:1 LIVE STOREFRONT PREVIEW
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 border border-neutral-300">
                <button
                  type="button"
                  onClick={() => setPreviewMode("login")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer ${previewMode === "login" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
                    }`}
                >
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("signup")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer ${previewMode === "signup" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
                    }`}
                >
                  REGISTER
                </button>
              </div>
            </div>

            {/* Render Simulated Preview Card */}
            <div className="p-4 bg-neutral-100 border border-neutral-300 space-y-4">
              {/* Left Apparel Mini Card */}
              <div
                className={`p-4 bg-neutral-900 text-white relative overflow-hidden transition-all ${config.cardStyle === "zero-radius"
                    ? "rounded-none"
                    : config.cardStyle === "subtle-rounded"
                      ? "rounded-md"
                      : "rounded-2xl"
                  } border border-neutral-700`}
              >
                <div className="flex justify-between items-center text-[9px] border-b border-neutral-700 pb-2 text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400" />
                    {config.atelierTag}
                  </span>
                  <span>{config.atelierLotNumber}</span>
                </div>

                <div className="py-4 text-center">
                  <div className="relative w-28 h-32 mx-auto flex items-center justify-center border border-dashed border-neutral-700 my-2">
                    <Image
                      src={normalizeImageUrl(currentPreviewSwatch.image || "/images/drapza/products/product_1.png")}
                      alt="Garment Preview"
                      width={100}
                      height={110}
                      unoptimized
                      onError={handleImageFallbackError}
                      className="object-contain max-h-28"
                    />
                    <span className="absolute -left-1 top-2 text-[7px] bg-neutral-800 border border-neutral-600 px-1 py-0.5 text-neutral-300">
                      {currentPreviewSwatch.accentBadge}
                    </span>
                  </div>

                  <h4 className="font-display text-sm uppercase tracking-tight text-white mt-2">
                    {previewMode === "login" ? config.loginTitle : config.registerTitle}
                  </h4>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-wider line-clamp-2 mt-1">
                    {previewMode === "login" ? config.loginSubtitle : config.registerSubtitle}
                  </p>
                </div>

                {/* Swatches Chips */}
                <div className="pt-2 border-t border-neutral-800 flex justify-center gap-1.5">
                  {swatches.map((sw, idx) => (
                    <button
                      key={sw.id || idx}
                      type="button"
                      onClick={() => setActiveSwatchIndex(idx)}
                      className={`w-3 h-3 border ${activeSwatchIndex === idx ? "border-white scale-125" : "border-neutral-600"
                        }`}
                      style={{ backgroundColor: sw.colorHex }}
                      title={sw.name}
                    />
                  ))}
                </div>
              </div>

              {/* Right Form Mini Card */}
              <div
                className={`p-4 bg-white text-black transition-all ${config.cardStyle === "zero-radius"
                    ? "rounded-none"
                    : config.cardStyle === "subtle-rounded"
                      ? "rounded-md"
                      : "rounded-2xl"
                  } border border-neutral-300 space-y-3`}
              >
                <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                  <div>
                    <span className="text-[8px] text-neutral-500 uppercase tracking-widest block">
                      {config.memberProtocolBadge}
                    </span>
                    <span className="font-display text-xs uppercase font-bold">
                      {previewMode === "login" ? config.loginFormHeading : config.registerFormHeading}
                    </span>
                  </div>
                  <span className="text-[7px] bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 uppercase">
                    {config.stitchSpecText}
                  </span>
                </div>

                {/* Simulated Inputs */}
                <div className="space-y-2 text-[10px]">
                  {previewMode === "signup" && (
                    <div className="p-1.5 border border-neutral-300 bg-neutral-50 text-neutral-400 font-mono-technical">
                      CLIENT / OPERATOR NAME...
                    </div>
                  )}
                  <div className="p-1.5 border border-neutral-300 bg-neutral-50 text-neutral-400 font-mono-technical">
                    CLIENT@DRAPZA.COM
                  </div>
                  <div className="p-1.5 border border-neutral-300 bg-neutral-50 text-neutral-400 font-mono-technical">
                    ••••••••••••
                  </div>
                </div>

                {/* Simulated Submit Button */}
                <div
                  className={`w-full py-2 bg-neutral-900 text-white text-center font-display text-xs uppercase tracking-wider ${config.cardStyle === "zero-radius" ? "rounded-none" : "rounded-sm"
                    }`}
                >
                  {previewMode === "login" ? config.loginButtonText : config.registerButtonText}
                </div>

                {/* Google SSO Button */}
                {config.enableGoogleLogin && (
                  <div className="w-full py-1.5 border border-neutral-300 text-center font-mono-technical text-[9px] uppercase font-bold text-neutral-700 bg-neutral-50">
                    {config.googleButtonText}
                  </div>
                )}

                {/* Perks Strip */}
                {config.memberPerksEnabled && (
                  <div className="p-1.5 bg-neutral-100 border border-neutral-300 text-[8px] flex justify-between items-center font-bold">
                    <span className="truncate pr-1">{config.memberPerksText}</span>
                    <span className="text-black shrink-0">{config.memberPerksBadge}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-center">
              <a
                href={previewMode === "login" ? "/login" : "/signup"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline uppercase tracking-wider"
              >
                <span>OPEN LIVE {previewMode.toUpperCase()} PAGE IN NEW TAB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="RESET AUTH CMS CONFIGURATION?"
        message="This will reset all login and register page texts, swatches, and styling back to factory default atelier settings. This action cannot be undone."
        confirmLabel="FACTORY RESET"
        cancelLabel="CANCEL"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

