"use client";

import React, { useState, useRef } from "react";
import {
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  Sliders,
  Move,
  Layers,
  Eye,
  Type,
  Maximize2,
  Palette,
  Activity,
  Crop,
  AlertCircle,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { frameShiftApi, FrameShiftConfigData, defaultFrameShiftData } from "@/lib/api";
import { ConfirmModal } from "./ConfirmModal";
import { ImageCropperModal } from "./ImageCropperModal";
import {
  normalizeImageUrl,
  handleImageFallbackError,
  isGoogleDriveUrl,
} from "@/lib/imageUtils";

interface FrameShiftAdminTabProps {
  config: FrameShiftConfigData;
  setConfig: React.Dispatch<React.SetStateAction<FrameShiftConfigData>>;
  onSaveSuccess?: () => void;
}

export const FrameShiftAdminTab: React.FC<FrameShiftAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperRawImage, setCropperRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const [simTiltActive, setSimTiltActive] = useState(true);

  // Model Preset Cutouts
  const modelPresets = [
    {
      label: "Neutral Jacket (Default)",
      url: "/images/drapza/marquee-banner/marquee_banner_01.png",
    },
    {
      label: "Technical Overshirt Cutout",
      url: "/images/drapza/peel-reveal/peel-reveal-cutout.png",
    },
    {
      label: "Hero Model Cutout",
      url: "/images/drapza/home/hero.png",
    },
    {
      label: "Garment Silhouette 01",
      url: "/images/drapza/products/product_1.png",
    },
    {
      label: "Garment Silhouette 18",
      url: "/images/drapza/products/product_18.png",
    },
  ];

  // Save Config
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(800);

    try {
      const res = await frameShiftApi.updateFrameShiftConfig(config);
      if (res && res.success) {
        audioSystem.playSuccess();
        setSaveStatus("Frame Shift Module published live successfully.");
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        throw new Error(res?.message || "Failed to update Frame Shift configuration.");
      }
    } catch (err: any) {
      audioSystem.playClick(300, 0.08);
      setSaveStatus(err.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleExecuteReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    audioSystem.playClick(500);

    try {
      const res = await frameShiftApi.resetFrameShiftConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
        audioSystem.playSuccess();
        setSaveStatus("Frame Shift reset to factory defaults.");
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setConfig(defaultFrameShiftData);
      }
    } catch (err: any) {
      setConfig(defaultFrameShiftData);
    } finally {
      setIsResetting(false);
    }
  };

  // Select Local File -> Open in Cropper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioSystem.playClick(700);
    const reader = new FileReader();
    reader.onload = () => {
      setCropperRawImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Open Cropper with existing cutout
  const handleOpenCropperForExisting = () => {
    if (!config.modelImage) return;
    setCropperRawImage(config.modelImage);
    setCropperOpen(true);
  };

  // When Cropping is Completed -> Upload to CDN
  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropperOpen(false);
    setIsUploadingImage(true);
    setUploadFeedback(null);

    try {
      const res = await frameShiftApi.uploadFrameShiftImage(croppedDataUrl);
      if (res && res.success && res.url) {
        setConfig((prev: FrameShiftConfigData) => ({ ...prev, modelImage: res.url }));
        audioSystem.playSuccess();
        setUploadFeedback("Cutout cropped and uploaded to Cloudinary CDN successfully!");
        setTimeout(() => setUploadFeedback(null), 4000);
      } else {
        // Fallback to data url if upload failed
        setConfig((prev: FrameShiftConfigData) => ({ ...prev, modelImage: croppedDataUrl }));
        setUploadFeedback("Cutout cropped locally.");
      }
    } catch (uploadErr: any) {
      setConfig((prev: FrameShiftConfigData) => ({ ...prev, modelImage: croppedDataUrl }));
      setUploadFeedback("Cutout cropped locally.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Interactive Live Preview Tilt Simulation
  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!simTiltActive || !config.enable3dTilt || !previewCardRef.current) return;
    const rect = previewCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const intensity = config.tiltIntensity || 16;
    previewCardRef.current.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handlePreviewMouseLeave = () => {
    if (!previewCardRef.current) return;
    previewCardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
  };

  const headlineLines = (config.headline || "DESIGNED ABSENCE,\nENGINEERED SILENCE.").split("\n");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-none bg-[#141416] border border-[#26262b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-none bg-emerald-500/10 text-emerald-400 font-mono-technical text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
              MODULE ID: NRMLSS_001
            </span>
            <span className="font-mono-technical text-xs text-neutral-400 uppercase tracking-widest">
              [ FRAME SHIFT CMS ]
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white">
            FRAME SHIFT & MARQUEE MOTION STUDIO
          </h2>
          <p className="font-mono-technical text-xs text-neutral-400 mt-1">
            Full control over the central 3D floating card, typography, model cutout, telemetry tags, and animation engine.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(600, 0.04);
              setShowResetConfirm(true);
            }}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-none bg-[#1c1d22] hover:bg-[#25272f] border border-[#333] text-neutral-300 font-mono-technical text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-none bg-white hover:bg-neutral-100 text-black font-mono-technical text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-white/10 disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "SAVING..." : "PUBLISH LIVE"}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-none bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono-technical text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Main Grid: Left Controls, Right 1:1 Live Interactive Canvas Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: CONTROLS & SETTINGS ================= */}
        <div className="xl:col-span-7 space-y-6">
          {/* SECTION 1: MASTER STATUS & ANIMATION MODES */}
          <div className="p-6 rounded-none bg-[#141416] border border-[#26262b] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#26262b]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-lg uppercase tracking-tight text-white">
                  ANIMATION & MOTION ENGINE CONTROLS
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled !== false}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                <span className="ml-2.5 font-mono-technical text-xs text-neutral-300 uppercase">
                  {config.isEnabled !== false ? "SECTION LIVE" : "SECTION DISABLED"}
                </span>
              </label>
            </div>

            {/* Animation Style Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "scroll_parallax",
                  label: "SCROLL PARALLAX SCRUB",
                  desc: "Tracks slide horizontally with page scroll speed",
                },
                {
                  id: "infinite_marquee",
                  label: "INFINITE AUTO MARQUEE",
                  desc: "Smooth continuous ticker movement in both directions",
                },
                {
                  id: "float_pulse",
                  label: "FLOAT & PULSE BREATH",
                  desc: "Card breathes and pulses gently in atelier viewport",
                },
                {
                  id: "cinematic_zoom",
                  label: "CINEMATIC ZOOM SCALE",
                  desc: "Card expands dynamically with smooth scroll velocity",
                },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setConfig({ ...config, animationStyle: style.id as any })}
                  className={`p-3.5 rounded-none border text-left transition-all cursor-pointer ${
                    config.animationStyle === style.id
                      ? "bg-white text-black border-white shadow-md font-bold"
                      : "bg-[#1c1d22] text-neutral-300 border-[#2b2c33] hover:border-neutral-500"
                  }`}
                >
                  <div className="font-mono-technical text-xs uppercase tracking-wider">
                    {style.label}
                  </div>
                  <div
                    className={`font-mono-technical text-[10px] mt-1 ${
                      config.animationStyle === style.id ? "text-neutral-700" : "text-neutral-400"
                    }`}
                  >
                    {style.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* 3D Cursor Tilt Controls */}
            <div className="p-4 rounded-none bg-[#1c1d22] border border-[#2b2c33] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono-technical text-xs text-white uppercase font-bold tracking-wider">
                    3D INTERACTIVE CURSOR TILT
                  </div>
                  <div className="font-mono-technical text-[10px] text-neutral-400">
                    Tilt central card based on mouse pointer coordinates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable3dTilt !== false}
                  onChange={(e) => setConfig({ ...config, enable3dTilt: e.target.checked })}
                  className="w-4 h-4 rounded-none text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {config.enable3dTilt !== false && (
                <div className="space-y-1.5 pt-2 border-t border-[#2e2f38]">
                  <div className="flex justify-between text-xs font-mono-technical">
                    <span className="text-neutral-400">TILT INTENSITY:</span>
                    <span className="text-white font-bold">{config.tiltIntensity || 16}°</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="35"
                    step="1"
                    value={config.tiltIntensity || 16}
                    onChange={(e) => setConfig({ ...config, tiltIntensity: Number(e.target.value) })}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Scroll Sensitivity / Marquee Speed */}
            <div className="p-4 rounded-none bg-[#1c1d22] border border-[#2b2c33] space-y-2">
              <div className="flex justify-between text-xs font-mono-technical">
                <span className="text-neutral-300 uppercase font-bold">MARQUEE SCROLL MULTIPLIER:</span>
                <span className="text-white font-bold">{config.marqueeSpeed || 550}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={config.marqueeSpeed || 550}
                onChange={(e) => setConfig({ ...config, marqueeSpeed: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Card Shadow Style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["dramatic", "soft", "glow", "none"] as const).map((shadow) => (
                <button
                  key={shadow}
                  type="button"
                  onClick={() => setConfig({ ...config, cardShadow: shadow })}
                  className={`py-2 px-3 rounded-none border text-center font-mono-technical text-[11px] uppercase tracking-wider cursor-pointer ${
                    (config.cardShadow || "dramatic") === shadow
                      ? "bg-white text-black border-white font-bold"
                      : "bg-[#1c1d22] text-neutral-400 border-[#2b2c33] hover:text-white"
                  }`}
                >
                  {shadow} SHADOW
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: CONTENT & TELEMETRY TAGS */}
          <div className="p-6 rounded-none bg-[#141416] border border-[#26262b] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#26262b]">
              <Type className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-lg uppercase tracking-tight text-white">
                CONTENT, BADGES & TELEMETRY TAGS
              </h3>
            </div>

            {/* Top Tag & Module ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                  TOP LEFT SIGNAL TAG
                </label>
                <input
                  type="text"
                  value={config.signalType || ""}
                  onChange={(e) => setConfig({ ...config, signalType: e.target.value })}
                  placeholder="SIGNAL TYPE: NEUTRAL"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                  TOP RIGHT MODULE ID
                </label>
                <input
                  type="text"
                  value={config.moduleId || ""}
                  onChange={(e) => setConfig({ ...config, moduleId: e.target.value })}
                  placeholder="MODULE ID: NRMLSS_001"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Bottom Status & Badge Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                  BOTTOM LEFT STATUS TAG
                </label>
                <input
                  type="text"
                  value={config.status || ""}
                  onChange={(e) => setConfig({ ...config, status: e.target.value })}
                  placeholder="STATUS: DETACHED"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                  CARD PILL BADGE
                </label>
                <input
                  type="text"
                  value={config.badgeText || ""}
                  onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
                  placeholder="[ FRAME SHIFT ]"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Main Headline (Multi-line) */}
            <div>
              <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                CENTRAL HEADLINE (USE NEWLINE FOR LINE BREAKS)
              </label>
              <textarea
                rows={2}
                value={config.headline || ""}
                onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                placeholder="DESIGNED ABSENCE,&#10;ENGINEERED SILENCE."
                className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-display text-sm uppercase focus:outline-none focus:border-white"
              />
            </div>

            {/* Bottom Branding & Pulse Dot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-medium">
                  BOTTOM CARD BRANDING
                </label>
                <input
                  type="text"
                  value={config.brandText || ""}
                  onChange={(e) => setConfig({ ...config, brandText: e.target.value })}
                  placeholder="DRAPZA"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-none bg-[#1c1d22] border border-[#2b2c33] mt-5">
                <span className="font-mono-technical text-xs text-neutral-300 uppercase">
                  BLINKING SIGNAL DOT
                </span>
                <input
                  type="checkbox"
                  checked={config.pulseDot !== false}
                  onChange={(e) => setConfig({ ...config, pulseDot: e.target.checked })}
                  className="w-4 h-4 rounded-none text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Marquee Background Tracks */}
            <div className="space-y-3 pt-3 border-t border-[#26262b]">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1 font-medium">
                  BACKGROUND MARQUEE TRACK 1 (TOP LINE)
                </label>
                <input
                  type="text"
                  value={config.marqueeTrack1 || ""}
                  onChange={(e) => setConfig({ ...config, marqueeTrack1: e.target.value })}
                  placeholder="DESIGNED ABSENCE, ENGINEERED SILENCE"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1 font-medium">
                  BACKGROUND MARQUEE TRACK 2 (BOTTOM LINE)
                </label>
                <input
                  type="text"
                  value={config.marqueeTrack2 || ""}
                  onChange={(e) => setConfig({ ...config, marqueeTrack2: e.target.value })}
                  placeholder="SYNTHETIC FORMS ARCHIVE THE SIGNAL"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: MODEL CUTOUT & IMAGE STUDIO */}
          <div className="p-6 rounded-none bg-[#141416] border border-[#26262b] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#26262b]">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-lg uppercase tracking-tight text-white">
                MODEL CUTOUT IMAGE & GEOMETRY
              </h3>
            </div>

            {/* Presets */}
            <div>
              <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-2 font-medium">
                QUICK SELECT ATELIER PRESETS
              </label>
              <div className="flex flex-wrap gap-2">
                {modelPresets.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setConfig({ ...config, modelImage: preset.url })}
                    className={`px-3 py-1.5 rounded-none border text-xs font-mono-technical uppercase tracking-wider cursor-pointer transition-all ${
                      config.modelImage === preset.url
                        ? "bg-white text-black border-white font-bold"
                        : "bg-[#1c1d22] text-neutral-300 border-[#2b2c33] hover:border-neutral-500"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or Custom URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1 font-medium">
                  CUSTOM IMAGE URL
                </label>
                <input
                  type="text"
                  value={config.modelImage || ""}
                  onChange={(e) => setConfig({ ...config, modelImage: e.target.value })}
                  placeholder="/images/drapza/marquee-banner/marquee_banner_01.png"
                  className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1 font-medium">
                  UPLOAD & EDIT CUTOUT
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex-1 py-2.5 px-4 rounded-none bg-[#1c1d22] hover:bg-[#25272f] border border-[#2b2c33] text-neutral-200 font-mono-technical text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isUploadingImage ? "animate-spin" : ""}`} />
                    <span>{isUploadingImage ? "UPLOADING..." : "CHOOSE FILE"}</span>
                  </button>

                  {config.modelImage && (
                    <button
                      type="button"
                      onClick={handleOpenCropperForExisting}
                      className="py-2.5 px-3 rounded-none bg-[#1c1d22] hover:bg-[#25272f] border border-[#2b2c33] text-neutral-200 font-mono-technical text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Open Image Cropper & AI Background Remover"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CROP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Model Alt Text */}
            <div>
              <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1 font-medium">
                MODEL ALT TEXT (ACCESSIBILITY & SEO)
              </label>
              <input
                type="text"
                value={config.modelAlt || ""}
                onChange={(e) => setConfig({ ...config, modelAlt: e.target.value })}
                placeholder="Drapza model wearing a neutral technical overshirt"
                className="w-full px-4 py-2.5 rounded-none bg-[#1c1d22] border border-[#2b2c33] text-white font-mono-technical text-xs focus:outline-none focus:border-white"
              />
            </div>

            {uploadFeedback && (
              <p className="font-mono-technical text-xs text-emerald-400">{uploadFeedback}</p>
            )}

            {/* Geometry Fine-Tuning: Scale, Offset Y, Offset X */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 p-3 rounded-none bg-[#1c1d22] border border-[#2b2c33]">
                <div className="flex justify-between text-xs font-mono-technical">
                  <span className="text-neutral-400">SCALE:</span>
                  <span className="text-white font-bold">{config.modelScale || 100}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  step="2"
                  value={config.modelScale || 100}
                  onChange={(e) => setConfig({ ...config, modelScale: Number(e.target.value) })}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-none bg-[#1c1d22] border border-[#2b2c33]">
                <div className="flex justify-between text-xs font-mono-technical">
                  <span className="text-neutral-400">OFFSET Y:</span>
                  <span className="text-white font-bold">{config.modelOffsetY || 0}px</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="2"
                  value={config.modelOffsetY || 0}
                  onChange={(e) => setConfig({ ...config, modelOffsetY: Number(e.target.value) })}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-none bg-[#1c1d22] border border-[#2b2c33]">
                <div className="flex justify-between text-xs font-mono-technical">
                  <span className="text-neutral-400">OFFSET X:</span>
                  <span className="text-white font-bold">{config.modelOffsetX || 0}px</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="2"
                  value={config.modelOffsetX || 0}
                  onChange={(e) => setConfig({ ...config, modelOffsetX: Number(e.target.value) })}
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: COLOR PALETTE & OPACITY */}
          <div className="p-6 rounded-none bg-[#141416] border border-[#26262b] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#26262b]">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-lg uppercase tracking-tight text-white">
                PALETTE & CONTRAST
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
                  SECTION BG
                </label>
                <div className="flex items-center gap-2 bg-[#1c1d22] p-2 rounded-none border border-[#2b2c33]">
                  <input
                    type="color"
                    value={config.sectionBgColor || "#fafafa"}
                    onChange={(e) => setConfig({ ...config, sectionBgColor: e.target.value })}
                    className="w-6 h-6 rounded-none border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono-technical text-xs text-white">
                    {config.sectionBgColor || "#fafafa"}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
                  CARD BG
                </label>
                <div className="flex items-center gap-2 bg-[#1c1d22] p-2 rounded-none border border-[#2b2c33]">
                  <input
                    type="color"
                    value={config.cardBgColor || "#0a0a0a"}
                    onChange={(e) => setConfig({ ...config, cardBgColor: e.target.value })}
                    className="w-6 h-6 rounded-none border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono-technical text-xs text-white">
                    {config.cardBgColor || "#0a0a0a"}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
                  CARD TEXT
                </label>
                <div className="flex items-center gap-2 bg-[#1c1d22] p-2 rounded-none border border-[#2b2c33]">
                  <input
                    type="color"
                    value={config.cardTextColor || "#ffffff"}
                    onChange={(e) => setConfig({ ...config, cardTextColor: e.target.value })}
                    className="w-6 h-6 rounded-none border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono-technical text-xs text-white">
                    {config.cardTextColor || "#ffffff"}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
                  MARQUEE TEXT
                </label>
                <div className="flex items-center gap-2 bg-[#1c1d22] p-2 rounded-none border border-[#2b2c33]">
                  <input
                    type="color"
                    value={config.marqueeTextColor || "#999999"}
                    onChange={(e) => setConfig({ ...config, marqueeTextColor: e.target.value })}
                    className="w-6 h-6 rounded-none border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono-technical text-xs text-white">
                    {config.marqueeTextColor || "#999999"}
                  </span>
                </div>
              </div>
            </div>

            {/* Marquee Opacity */}
            <div className="p-3 rounded-none bg-[#1c1d22] border border-[#2b2c33] space-y-1.5">
              <div className="flex justify-between text-xs font-mono-technical">
                <span className="text-neutral-400">MARQUEE OPACITY:</span>
                <span className="text-white font-bold">
                  {Math.round((config.marqueeOpacity ?? 0.7) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.marqueeOpacity ?? 0.7}
                onChange={(e) => setConfig({ ...config, marqueeOpacity: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 1:1 REAL-TIME VISUAL CANVAS PREVIEW ================= */}
        <div className="xl:col-span-5 sticky top-6 space-y-4">
          <div className="p-6 rounded-none bg-[#141416] border border-[#26262b] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26262b]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-base uppercase tracking-tight text-white">
                  1:1 LIVE CANVAS PREVIEW
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimTiltActive(!simTiltActive)}
                className={`px-3 py-1 rounded-none font-mono-technical text-[10px] uppercase tracking-wider border cursor-pointer ${
                  simTiltActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                }`}
              >
                {simTiltActive ? "TILT SIM ACTIVE" : "TILT PAUSED"}
              </button>
            </div>

            {/* Live Visual Canvas Area */}
            <div
              style={{ backgroundColor: config.sectionBgColor || "#fafafa" }}
              className="relative w-full aspect-[4/5] rounded-none overflow-hidden flex items-center justify-center p-4 border border-neutral-200 select-none shadow-inner"
            >
              {/* Telemetry Tag Top Left */}
              {config.signalType && (
                <div className="absolute top-3 left-3 z-30 pointer-events-none">
                  <span className="font-mono-technical text-[8px] uppercase tracking-widest text-black font-bold flex items-center gap-1">
                    {config.pulseDot !== false && (
                      <span className="h-1 w-1 rounded-none bg-black animate-pulse" />
                    )}
                    {config.signalType}
                  </span>
                </div>
              )}

              {/* Telemetry Tag Top Right */}
              {config.moduleId && (
                <div className="absolute top-3 right-3 z-30 pointer-events-none">
                  <span className="font-mono-technical text-[8px] uppercase tracking-widest text-black font-bold">
                    {config.moduleId}
                  </span>
                </div>
              )}

              {/* Telemetry Tag Bottom Left */}
              {config.status && (
                <div className="absolute bottom-3 left-3 z-30 pointer-events-none">
                  <span className="font-mono-technical text-[8px] uppercase tracking-widest text-black font-bold">
                    {config.status}
                  </span>
                </div>
              )}

              {/* Background Marquee Simulation */}
              <div
                className="absolute inset-0 flex flex-col justify-center gap-3 overflow-hidden pointer-events-none z-0"
                style={{ opacity: config.marqueeOpacity ?? 0.7 }}
              >
                <div className="flex whitespace-nowrap animate-marquee">
                  {[...Array(4)].map((_, i) => (
                    <span
                      key={i}
                      style={{ color: config.marqueeTextColor || "#999999" }}
                      className="mx-2 font-display text-2xl uppercase tracking-wider opacity-40 select-none font-thin"
                    >
                      {config.marqueeTrack1 || "DESIGNED ABSENCE, ENGINEERED SILENCE"}
                    </span>
                  ))}
                </div>
                <div className="flex whitespace-nowrap animate-marquee-reverse">
                  {[...Array(4)].map((_, i) => (
                    <span
                      key={i}
                      style={{ color: config.marqueeTextColor || "#999999" }}
                      className="mx-2 font-display text-2xl uppercase tracking-wider opacity-40 select-none font-thin"
                    >
                      {config.marqueeTrack2 || "SYNTHETIC FORMS ARCHIVE THE SIGNAL"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Central 3D Card Live Hover Simulation */}
              <div
                ref={previewCardRef}
                onMouseMove={handlePreviewMouseMove}
                onMouseLeave={handlePreviewMouseLeave}
                style={{
                  backgroundColor: config.cardBgColor || "#0a0a0a",
                  transition: "transform 0.15s ease-out",
                }}
                className={`relative w-4/5 aspect-[1/1.08] rounded-none overflow-hidden z-20 shadow-2xl cursor-grab active:cursor-grabbing ${
                  config.animationStyle === "float_pulse" ? "animate-pulse" : ""
                }`}
              >
                {/* Behind Model: Headline */}
                <div className="absolute inset-x-0 top-1/4 z-10 text-center px-2 pointer-events-none">
                  <h2
                    style={{ color: config.cardTextColor || "#ffffff" }}
                    className="font-display text-xl leading-[0.88] uppercase tracking-tight font-light drop-shadow"
                  >
                    {headlineLines.map((line: string, idx: number) => (
                      <span key={idx}>
                        {line}
                        {idx < headlineLines.length - 1 && <br />}
                      </span>
                    ))}
                  </h2>
                </div>

                {/* Model Image Layer */}
                <div className="relative h-full w-full overflow-hidden z-20 flex items-end justify-center pointer-events-none">
                  <img
                    src={normalizeImageUrl(config.modelImage || "/images/drapza/marquee-banner/marquee_banner_01.png")}
                    alt={config.modelAlt || "Model Cutout"}
                    onError={handleImageFallbackError}
                    style={{
                      transform: `scale(${(config.modelScale || 100) / 100}) translate(${
                        config.modelOffsetX || 0
                      }px, ${config.modelOffsetY || 0}px)`,
                      transition: "transform 0.15s ease-out",
                    }}
                    className="h-full w-auto max-w-full object-contain object-bottom"
                  />
                </div>

                {/* Badges & Branding */}
                <div className="absolute inset-0 z-30 flex flex-col justify-between p-3 pointer-events-none">
                  <div className="flex justify-end">
                    {config.badgeText && (
                      <span className="font-mono-technical text-[8px] uppercase tracking-widest text-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-none border border-white/10">
                        {config.badgeText}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {config.brandText && (
                      <span className="font-display text-xs tracking-[0.25em] text-white/90">
                        {config.brandText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="font-mono-technical text-[10px] text-neutral-400 text-center">
              Hover pointer over the preview card to test 3D parallax tilt dynamics.
            </p>
          </div>
        </div>
      </div>

      {/* Luxury Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        variant="reset"
        title="RESET FRAME SHIFT"
        subtitle="[ FACTORY RESET PROTOCOL ]"
        message="Are you sure you want to reset all Frame Shift copy, typography, model cutout, telemetry tags, and animation parameters back to factory default settings?"
        confirmLabel="RESTORE DEFAULTS"
        cancelLabel="KEEP CURRENT"
        onConfirm={handleExecuteReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperRawImage}
        title="CUTOUT CROPPING & BACKGROUND REMOVAL"
        defaultAspect="3:4"
        initialBgRemovalActive={false}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
