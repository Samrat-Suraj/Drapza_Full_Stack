"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Save,
  RotateCcw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Smartphone,
  Laptop,
  Type,
  Palette,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  whatsAppApi,
  WhatsAppButtonConfigData,
  DEFAULT_WHATSAPP_CONFIG,
} from "@/lib/api";
import { audioSystem } from "./AudioSystem";

interface WhatsAppAdminTabProps {
  initialConfig?: WhatsAppButtonConfigData;
  onSaveSuccess?: () => void;
}

export const WhatsAppAdminTab: React.FC<WhatsAppAdminTabProps> = ({
  initialConfig,
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<WhatsAppButtonConfigData>(
    initialConfig || DEFAULT_WHATSAPP_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync initialConfig if passed or load from API
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      let isMounted = true;
      whatsAppApi
        .getConfig()
        .then((res: any) => {
          if (isMounted && res) {
            const data = res.data || res;
            if (data && typeof data.isEnabled !== "undefined") {
              setConfig(data as WhatsAppButtonConfigData);
            }
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [initialConfig]);

  // Clear notification after 5s
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const cleanPhone = (config.phoneNumber || "918888333038").replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(config.prefilledMessage || "");
  const waTestUrl = `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ""}`;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    audioSystem.playClick(850);

    try {
      const res: any = await whatsAppApi.updateConfig(config);
      if (res && (res.success || typeof res.isEnabled !== "undefined")) {
        audioSystem.playSuccess();
        setStatusMessage({
          type: "success",
          text: "WhatsApp Floating Button settings published live to storefront.",
        });
        if (onSaveSuccess) onSaveSuccess();
      } else {
        throw new Error(res?.message || "Failed to update WhatsApp configuration.");
      }
    } catch (err: any) {
      audioSystem.playError();
      setStatusMessage({
        type: "error",
        text: err?.message || "Save operation failed.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset the WhatsApp Floating Button to factory defaults?"
      )
    ) {
      return;
    }
    setIsResetting(true);
    setStatusMessage(null);
    audioSystem.playClick(600);

    try {
      const res: any = await whatsAppApi.resetConfig();
      if (res) {
        const data = res.data || res;
        setConfig(
          data?.phoneNumber ? (data as WhatsAppButtonConfigData) : DEFAULT_WHATSAPP_CONFIG
        );
        audioSystem.playSuccess();
        setStatusMessage({
          type: "success",
          text: "WhatsApp Floating Button reset to factory defaults successfully.",
        });
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err: any) {
      audioSystem.playError();
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to reset WhatsApp configuration.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* ================= COMMAND BAR ================= */}
      <div className="p-5 bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 ${
                config.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WHATSAPP FLOATING BUTTON & CONCIERGE CMS</span>
            </h2>
            <span
              className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                config.isEnabled
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {config.isEnabled ? "BUTTON LIVE" : "BUTTON HIDDEN"}
            </span>
          </div>
          <p className="text-neutral-500 text-[11px] mt-1 font-sans">
            Configure the floating WhatsApp button ("MESSAGE US") across the storefront: visibility, label, phone number, pre-filled message, color theme, and screen position.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={waTestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-emerald-800 border border-[#25d366]/30 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Launch live WhatsApp web chat with current configured phone and message"
          >
            <span>TEST WA LINK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Revert to factory default settings"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || isResetting}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Sync changes to storefront"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Save className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isSaving ? "SAVING..." : "PUBLISH LIVE"}</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-3.5 border flex items-center justify-between font-mono text-xs ${
            statusMessage.type === "success"
              ? "bg-black text-white border-black font-bold"
              : "bg-red-50 text-red-800 border-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 2-COLUMN WORKSPACE: CONTROLS & LIVE PREVIEW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Form Configurations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Master Visibility & Label */}
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-5">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Sliders className="w-4 h-4 text-black" />
                <span>MASTER SWITCH & BUTTON TEXT</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">[ CORE CONTROLS ]</span>
            </div>

            {/* Master Switch */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200">
              <div>
                <span className="font-bold text-xs uppercase text-black block">
                  Storefront Floating Button Switch
                </span>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  When enabled, the green floating WhatsApp button is visible to visitors across all pages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(750);
                  setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
                }}
                className={`px-4 py-2 text-xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                  config.isEnabled
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-500 border-neutral-300"
                }`}
              >
                {config.isEnabled ? "ENABLED (VISIBLE)" : "DISABLED (HIDDEN)"}
              </button>
            </div>

            {/* Button Label Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Button Label Text</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Default: MESSAGE US
                </span>
              </label>
              <input
                type="text"
                value={config.buttonText}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, buttonText: e.target.value }))
                }
                placeholder="MESSAGE US"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold text-black uppercase"
              />

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-neutral-400">Presets:</span>
                {["MESSAGE US", "CHAT WITH US", "WHATSAPP SUPPORT", "VIP CONCIERGE"].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, buttonText: preset }))
                      }
                      className={`px-2 py-0.5 text-[9.5px] font-mono border transition-colors cursor-pointer ${
                        config.buttonText === preset
                          ? "bg-black text-white border-black font-bold"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300"
                      }`}
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tooltip / Accessible Label */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Hover Tooltip / Accessibility Label
              </label>
              <input
                type="text"
                value={config.tooltip}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, tooltip: e.target.value }))
                }
                placeholder="Chat on WhatsApp"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
              />
            </div>
          </div>

          {/* Section B: Phone Number & Pre-filled Message */}
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-5">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Phone className="w-4 h-4 text-black" />
                <span>WHATSAPP RECIPIENT & PRE-FILLED MESSAGE</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">[ ROUTING ]</span>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span>WhatsApp Phone Number (with Country Code)</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Digits only: {cleanPhone}
                </span>
              </label>
              <input
                type="text"
                value={config.phoneNumber}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                placeholder="+91 8888333038 or 918888333038"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold text-black"
              />
              <p className="text-[10px] text-neutral-500 font-sans">
                Enter country code without '+' or with '+'. For India, use <code className="font-mono text-black font-bold">918888333038</code>.
              </p>
            </div>

            {/* Pre-filled Message */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                <span>Pre-filled Customer Message</span>
              </label>
              <textarea
                rows={3}
                value={config.prefilledMessage}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    prefilledMessage: e.target.value,
                  }))
                }
                placeholder="Hello Drapza Atelier, I would like to inquire about..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none leading-relaxed"
              />
              <p className="text-[10px] text-neutral-500 font-sans">
                This text will automatically appear in the customer's WhatsApp chat input box when they click the button.
              </p>
            </div>
          </div>

          {/* Section C: Styling, Colors & Placement */}
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-5">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Palette className="w-4 h-4 text-black" />
                <span>THEME COLORS & POSITIONING</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">[ AESTHETICS ]</span>
            </div>

            {/* Background Color Picker & Swatches */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span>Button Background Color</span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {config.backgroundColor}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.backgroundColor || "#25d366"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="w-10 h-10 p-0 border border-neutral-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold"
                />
              </div>

              {/* Color Presets */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {[
                  { name: "Official WA Green", val: "#25d366" },
                  { name: "Atelier Black", val: "#0f0f0f" },
                  { name: "Luxury Emerald", val: "#059669" },
                  { name: "Gunmetal", val: "#1f2937" },
                ].map((color) => (
                  <button
                    key={color.val}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        backgroundColor: color.val,
                      }))
                    }
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 cursor-pointer font-mono"
                  >
                    <span
                      className="w-2.5 h-2.5 border border-black/20"
                      style={{ backgroundColor: color.val }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text & Icon Color */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span>Text & Icon Color</span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {config.textColor}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.textColor || "#ffffff"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      textColor: e.target.value,
                    }))
                  }
                  className="w-10 h-10 p-0 border border-neutral-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.textColor}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      textColor: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold"
                />
              </div>
            </div>

            {/* Position & Offsets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-600">
                  Screen Position
                </label>
                <select
                  value={config.position || "bottom-right"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      position: e.target.value as any,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white outline-none cursor-pointer"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-600">
                  Bottom Offset
                </label>
                <input
                  type="text"
                  value={config.bottomOffset || "6.25rem"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, bottomOffset: e.target.value }))
                  }
                  placeholder="6.25rem"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-600">
                  Side Offset
                </label>
                <input
                  type="text"
                  value={config.sideOffset || "2rem"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, sideOffset: e.target.value }))
                  }
                  placeholder="2rem"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Responsive device visibility */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-neutral-700">
                Device Visibility
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={config.showOnMobile}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showOnMobile: e.target.checked,
                      }))
                    }
                    className="accent-black"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Mobile</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={config.showOnDesktop}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showOnDesktop: e.target.checked,
                      }))
                    }
                    className="accent-black"
                  />
                  <Laptop className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Desktop</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: 1:1 Live Storefront Preview */}
        <div className="lg:col-span-5 bg-white p-6 border border-neutral-200 shadow-sm space-y-5 sticky top-28">
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>1:1 LIVE STOREFRONT SIMULATION</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">
              REAL-TIME SYNC
            </span>
          </div>

          {/* Simulated Canvas Background */}
          <div className="relative w-full aspect-[4/3] bg-[#edf1e8] border border-neutral-300 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
            <div className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-widest">
              [ STOREFRONT CANVAS VIEWPORT ]
            </div>

            {/* Simulated Center Dummy Content */}
            <div className="space-y-1.5 opacity-30 select-none pointer-events-none">
              <div className="h-3 bg-neutral-400 w-3/4 rounded-xs" />
              <div className="h-2 bg-neutral-300 w-1/2 rounded-xs" />
              <div className="h-2 bg-neutral-300 w-2/3 rounded-xs" />
            </div>

            {/* The Live WhatsApp Button Preview */}
            <div
              className={`flex items-end ${
                config.position === "bottom-left" ? "justify-start" : "justify-end"
              }`}
            >
              <div className="space-y-2">
                {/* Floating Bag Dummy */}
                <div className="flex justify-end">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold font-mono text-[9px] shadow-lg opacity-40">
                    BAG
                  </div>
                </div>

                {/* THE ACTUAL WHATSAPP PILL BUTTON */}
                {config.isEnabled ? (
                  <a
                    href={waTestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: config.backgroundColor || "#25d366",
                      color: config.textColor || "#ffffff",
                    }}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer no-underline"
                    title={config.tooltip || "Chat on WhatsApp"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 shrink-0"
                      style={{ color: config.textColor || "#ffffff" }}
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                    </svg>
                    <span>{config.buttonText || "MESSAGE US"}</span>
                  </a>
                ) : (
                  <div className="px-3 py-2 bg-neutral-200 border border-neutral-300 text-neutral-500 font-mono text-[10px] uppercase">
                    [ BUTTON CURRENTLY DISABLED ]
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Specifications Breakdown */}
          <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200 text-[10.5px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Destination:</span>
              <span className="font-bold text-black font-mono">+{cleanPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Button Label:</span>
              <span className="font-bold text-black font-mono">
                {config.buttonText || "MESSAGE US"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Pre-filled Msg:</span>
              <span className="text-neutral-800 truncate max-w-[200px]" title={config.prefilledMessage}>
                {config.prefilledMessage || "(Empty)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Alignment:</span>
              <span className="font-bold text-black font-mono uppercase">
                {config.position || "bottom-right"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAdminTab;
