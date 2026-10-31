"use client";

import React, { useState, useRef } from "react";
import {
  PhoneCall,
  Save,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Check,
  HelpCircle,
  Mail,
  Phone,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import {
  touchpointConfigApi,
  TouchpointConfigData,
  DEFAULT_TOUCHPOINT_CONFIG,
} from "@/lib/api";
import { ConfirmModal } from "./ConfirmModal";

interface TouchpointAdminTabProps {
  config: TouchpointConfigData;
  setConfig: React.Dispatch<React.SetStateAction<TouchpointConfigData>>;
  onSaveSuccess?: () => void;
}

export const TouchpointAdminTab: React.FC<TouchpointAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingCallout, setUploadingCallout] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const calloutFileInputRef = useRef<HTMLInputElement>(null);

  const safeConfig: TouchpointConfigData = {
    ...DEFAULT_TOUCHPOINT_CONFIG,
    ...config,
  };

  const handleFieldChange = (field: keyof TouchpointConfigData, value: any) => {
    setConfig((prev) => {
      const next = { ...prev, [field]: value };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("drapza_touchpoint_config", JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent("drapza_touchpoint_updated", { detail: next })
          );
        } catch (_) {}
      }
      return next;
    });
  };

  const handleImageUpload = (
    field: "heroImage" | "calloutImage",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = field === "heroImage" ? setUploadingHero : setUploadingCallout;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await touchpointConfigApi.uploadTouchpointImage(base64);
        if (res && res.url) {
          handleFieldChange(field, res.url);
          audioSystem.playSuccess();
        } else {
          handleFieldChange(field, base64);
        }
      } catch (_) {
        // Fallback to base64 data url directly
        handleFieldChange(field, base64);
      } finally {
        setUploading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await touchpointConfigApi.updateTouchpointConfig(safeConfig);
      if (res && typeof res === "object") {
        setConfig((prev) => ({ ...prev, ...(res.data || res) }));
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_touchpoint_config", JSON.stringify(safeConfig));
        window.dispatchEvent(
          new CustomEvent("drapza_touchpoint_updated", { detail: safeConfig })
        );
      }
      setSaveStatus("Changes saved successfully to live storefront!");
      audioSystem.playSuccess();
      onSaveSuccess?.();
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      setSaveStatus(err.message || "Failed to save touchpoint configuration.");
      audioSystem.playError();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await touchpointConfigApi.resetTouchpointConfig();
      setConfig(DEFAULT_TOUCHPOINT_CONFIG);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "drapza_touchpoint_config",
          JSON.stringify(DEFAULT_TOUCHPOINT_CONFIG)
        );
        window.dispatchEvent(
          new CustomEvent("drapza_touchpoint_updated", {
            detail: DEFAULT_TOUCHPOINT_CONFIG,
          })
        );
      }
      setSaveStatus("Reset to factory defaults successfully.");
      audioSystem.playSuccess();
      setShowResetConfirm(false);
      onSaveSuccess?.();
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      setSaveStatus(err.message || "Failed to reset touchpoint configuration.");
      audioSystem.playError();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#0f0f12] border border-white/10 rounded-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#18181d] border border-white/10 flex items-center justify-center text-white shadow-inner">
            <PhoneCall className="w-6 h-6 text-[#afb3ab]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                Touchpoint & Concierge CMS
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest bg-[#afb3ab]/20 text-[#afb3ab] border border-[#afb3ab]/30 rounded">
                PAGE /TOUCHPOINT
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              Live visual control over Outbound Protocols, Inquiries, Concierge Phone & Callout Grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/touchpoint"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>VIEW LIVE PAGE</span>
          </a>

          <button
            type="button"
            onClick={() => setShowLivePreview((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider rounded-lg border transition-colors ${
              showLivePreview
                ? "bg-[#afb3ab]/20 text-[#afb3ab] border-[#afb3ab]/40"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {showLivePreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>PREVIEW</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold bg-[#afb3ab] hover:bg-[#c2c6be] text-black rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>SAVE CHANGES</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {saveStatus && (
        <div
          className={`px-4 py-3 rounded-lg text-xs font-mono tracking-wider border flex items-center justify-between ${
            saveStatus.includes("success") || saveStatus.includes("successfully")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form Controls + Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Outbound Access Hero Section */}
          <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#afb3ab]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Outbound Access Hero Section
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                Section 01
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
                  Main Headline (Koulen Brutalist)
                </label>
                <textarea
                  rows={2}
                  value={safeConfig.heroHeading}
                  onChange={(e) => handleFieldChange("heroHeading", e.target.value)}
                  className="w-full bg-[#18181d] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-[#afb3ab] focus:outline-none transition-colors"
                  placeholder="Outbound access is limited, proceed with intent."
                />
              </div>

              {/* Model Cutout Image Upload / Path */}
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
                  Right Column Model Cutout Image
                </label>
                <div className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 rounded-lg bg-[#18181d] border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {safeConfig.heroImage ? (
                      <img
                        src={safeConfig.heroImage}
                        alt="Hero Model"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/contact/hero.png";
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={safeConfig.heroImage}
                      onChange={(e) => handleFieldChange("heroImage", e.target.value)}
                      className="w-full bg-[#18181d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="/contact/hero.png or https://..."
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={heroFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload("heroImage", e)}
                      />
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        disabled={uploadingHero}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-wider bg-white/5 hover:bg-white/10 text-gray-200 rounded border border-white/10 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{uploadingHero ? "UPLOADING..." : "UPLOAD NEW CUTOUT"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Dispatch Channels */}
          <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#afb3ab]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Contact Dispatch Protocols & Channels
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                Section 02
              </span>
            </div>

            <div className="space-y-5">
              {/* Channel 1: External Comms */}
              <div className="p-3.5 bg-[#18181d] border border-white/5 rounded-lg space-y-3">
                <span className="text-[10px] font-mono text-[#afb3ab] uppercase tracking-widest font-semibold block">
                  Channel 01 // External Comms
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={safeConfig.commsLabel}
                      onChange={(e) => handleFieldChange("commsLabel", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="External Comms Protocol"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={safeConfig.commsEmail}
                      onChange={(e) => handleFieldChange("commsEmail", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="echo@drapza.com"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 2: Dispatch System */}
              <div className="p-3.5 bg-[#18181d] border border-white/5 rounded-lg space-y-3">
                <span className="text-[10px] font-mono text-[#afb3ab] uppercase tracking-widest font-semibold block">
                  Channel 02 // Dispatch Inquiries
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={safeConfig.dispatchLabel}
                      onChange={(e) => handleFieldChange("dispatchLabel", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="Dispatch Inquiry System"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={safeConfig.dispatchEmail}
                      onChange={(e) => handleFieldChange("dispatchEmail", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="dispatch@drapza.com"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 3: Direct Phone Line */}
              <div className="p-3.5 bg-[#18181d] border border-white/5 rounded-lg space-y-3">
                <span className="text-[10px] font-mono text-[#afb3ab] uppercase tracking-widest font-semibold block">
                  Channel 03 // Direct Phone Line
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={safeConfig.phoneLabel}
                      onChange={(e) => handleFieldChange("phoneLabel", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="Direct Phone Line"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={safeConfig.phoneNumber}
                      onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                      className="w-full bg-[#0f0f12] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="+91 8888333038"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Silent Grid Callout Section */}
          <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#afb3ab]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Silent Grid Callout Section
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                Section 03
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
                  Callout Title
                </label>
                <input
                  type="text"
                  value={safeConfig.calloutHeading}
                  onChange={(e) => handleFieldChange("calloutHeading", e.target.value)}
                  className="w-full bg-[#18181d] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                  placeholder="Connect to the silent grid"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
                  Callout Subtext Description
                </label>
                <textarea
                  rows={2}
                  value={safeConfig.calloutDescription}
                  onChange={(e) => handleFieldChange("calloutDescription", e.target.value)}
                  className="w-full bg-[#18181d] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                  placeholder="Get early signals, private releases, and occasional noise worth hearing..."
                />
              </div>

              {/* Callout Image */}
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
                  Callout Architectural Image
                </label>
                <div className="flex gap-3 items-center">
                  <div className="relative w-16 h-20 rounded-lg bg-[#18181d] border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {safeConfig.calloutImage ? (
                      <img
                        src={safeConfig.calloutImage}
                        alt="Callout"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/contact/contact-callout.jpg";
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={safeConfig.calloutImage}
                      onChange={(e) => handleFieldChange("calloutImage", e.target.value)}
                      className="w-full bg-[#18181d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-[#afb3ab] focus:outline-none"
                      placeholder="/contact/contact-callout.jpg"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={calloutFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload("calloutImage", e)}
                      />
                      <button
                        type="button"
                        onClick={() => calloutFileInputRef.current?.click()}
                        disabled={uploadingCallout}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-wider bg-white/5 hover:bg-white/10 text-gray-200 rounded border border-white/10 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{uploadingCallout ? "UPLOADING..." : "UPLOAD NEW IMAGE"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Visual Storefront Simulation (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-5 shadow-xl sticky top-24">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-mono uppercase tracking-widest text-white font-semibold">
                  Live Visual Simulation
                </h4>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                1:1 ATELIER CANVAS
              </span>
            </div>

            {/* Render Mini Touchpoint Page Canvas */}
            <div className="bg-[#edf1e8] text-[#121316] rounded-lg overflow-hidden border border-black/10 shadow-inner p-5 flex flex-col justify-between min-h-[460px] relative">
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Copy side */}
                <div className="col-span-7 space-y-4">
                  <h3 className="font-koulen text-xl md:text-2xl leading-[0.92] uppercase text-[#121316] font-normal tracking-tight">
                    {safeConfig.heroHeading}
                  </h3>

                  <div className="space-y-3 pt-1">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#71717a] font-medium leading-tight">
                        {safeConfig.commsLabel}
                      </p>
                      <h4 className="font-koulen text-sm md:text-base leading-none text-[#121316] uppercase mt-0.5">
                        {safeConfig.commsEmail}
                      </h4>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#71717a] font-medium leading-tight">
                        {safeConfig.dispatchLabel}
                      </p>
                      <h4 className="font-koulen text-sm md:text-base leading-none text-[#121316] uppercase mt-0.5">
                        {safeConfig.dispatchEmail}
                      </h4>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#71717a] font-medium leading-tight">
                        {safeConfig.phoneLabel}
                      </p>
                      <h4 className="font-koulen text-sm md:text-base leading-none text-[#121316] uppercase mt-0.5">
                        {safeConfig.phoneNumber}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Image side */}
                <div className="col-span-5 h-[280px] flex items-end justify-center relative">
                  <img
                    src={safeConfig.heroImage || "/contact/hero.png"}
                    alt="Hero Cutout"
                    className="max-h-[280px] w-auto object-contain object-bottom drop-shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = "/contact/hero.png";
                    }}
                  />
                </div>
              </div>

              {/* Callout Mini Banner */}
              <div className="mt-4 pt-3 border-t border-black/10 bg-[#121316] text-[#edf1e8] -mx-5 -mb-5 p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-mono text-[#afb3ab] uppercase tracking-widest">
                    SILENT GRID CALLOUT
                  </p>
                  <h5 className="font-koulen text-xs uppercase text-white">
                    {safeConfig.calloutHeading}
                  </h5>
                  <p className="text-[8px] text-gray-400 line-clamp-1">
                    {safeConfig.calloutDescription}
                  </p>
                </div>
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
                  <img
                    src={safeConfig.calloutImage || "/contact/contact-callout.jpg"}
                    alt="Callout Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>All changes stream instantly to /touchpoint</span>
              <a
                href="/touchpoint"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#afb3ab] hover:underline"
              >
                Open URL →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Touchpoint Configuration?"
        message="This will restore all Touchpoint & Concierge fields (headings, comms protocols, phone number, and imagery) back to DRAPZA atelier defaults. Unsaved modifications will be discarded."
        confirmLabel="RESTORE DEFAULTS"
        cancelLabel="CANCEL"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default TouchpointAdminTab;

