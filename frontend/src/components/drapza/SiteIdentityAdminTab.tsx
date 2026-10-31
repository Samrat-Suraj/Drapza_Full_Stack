"use client";

import React, { useState, useRef } from "react";
import {
  Globe,
  Save,
  RotateCcw,
  Upload,
  Eye,
  Check,
  Loader2,
  Search,
  ExternalLink,
  Laptop,
  Smartphone,
  Copy,
  AlertCircle,
  X,
  Plus,
  Lock,
  Trash2,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Layers,
  Type,
  Sun,
  Moon,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { siteConfigApi, SiteConfigData, DEFAULT_SITE_CONFIG } from "@/lib/api";
import { DrapzaLogo } from "./DrapzaLogo";

interface SiteIdentityAdminTabProps {
  config: SiteConfigData;
  setConfig: React.Dispatch<React.SetStateAction<SiteConfigData>>;
  onSaveSuccess?: () => void;
}

export const SiteIdentityAdminTab: React.FC<SiteIdentityAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconUploadError, setFaviconUploadError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isUploadingDarkLogo, setIsUploadingDarkLogo] = useState(false);
  const [darkLogoUploadError, setDarkLogoUploadError] = useState<string | null>(null);
  const [logoPreviewDevice, setLogoPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewTabState, setPreviewTabState] = useState<"active" | "inactive">("active");

  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const darkLogoInputRef = useRef<HTMLInputElement | null>(null);

  // Logo File Upload to Cloudinary CDN
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      setLogoUploadError("Please upload an image file (PNG, SVG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError("Logo file size exceeds 5MB limit.");
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadError(null);
    audioSystem.playClick(600);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await siteConfigApi.uploadAsset(base64Data, "drapza_brand_logo");
          const uploadedUrl = (res as any).url || res.data?.url;
          if (res.success && uploadedUrl) {
            setConfig((prev) => ({
              ...prev,
              logoUrl: uploadedUrl,
              logoType: prev.logoType || "image",
            }));
            audioSystem.playSuccess();
            setSaveStatus("✓ Website Brand Logo uploaded to CDN successfully! Click SAVE & PUBLISH to make live.");
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            setLogoUploadError(res.message || "Failed to upload logo.");
            audioSystem.playClick(300);
          }
        } catch (err: any) {
          setLogoUploadError(err.message || "Upload process failed.");
          audioSystem.playClick(300);
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setLogoUploadError(err.message || "File read error.");
      setIsUploadingLogo(false);
    }
  };

  // Dark Header Variant Upload
  const handleDarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      setDarkLogoUploadError("Please upload an image file (PNG, SVG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDarkLogoUploadError("Logo file size exceeds 5MB limit.");
      return;
    }

    setIsUploadingDarkLogo(true);
    setDarkLogoUploadError(null);
    audioSystem.playClick(600);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await siteConfigApi.uploadAsset(base64Data, "drapza_dark_logo");
          const uploadedUrl = (res as any).url || res.data?.url;
          if (res.success && uploadedUrl) {
            setConfig((prev) => ({
              ...prev,
              logoDarkUrl: uploadedUrl,
            }));
            audioSystem.playSuccess();
            setSaveStatus("✓ Dark header logo variant uploaded! Click SAVE & PUBLISH to make live.");
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            setDarkLogoUploadError(res.message || "Failed to upload dark logo.");
            audioSystem.playClick(300);
          }
        } catch (err: any) {
          setDarkLogoUploadError(err.message || "Upload process failed.");
          audioSystem.playClick(300);
        } finally {
          setIsUploadingDarkLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setDarkLogoUploadError(err.message || "File read error.");
      setIsUploadingDarkLogo(false);
    }
  };

  const handleResetLogo = () => {
    audioSystem.playClick(500);
    setConfig((prev) => ({
      ...prev,
      logoUrl: "",
      logoDarkUrl: "",
      logoType: "hybrid",
      logoText: "DRAPZA",
      logoTagline: "WEAR YOUR STORY",
      logoWidth: 34,
      logoScale: 100,
      logoMobileScale: 100,
      logoAlignment: "left",
      logoOffsetX: 0,
      logoOffsetY: 0,
      logoGap: 10,
      logoLayout: "horizontal",
      logoBorderRadius: 0,
      logoOpacity: 1,
      logoShadow: "subtle",
      logoAutoInvertDark: false,
      logoWordmarkSize: 24,
      logoLetterSpacing: 0.14,
      logoFontWeight: "bold",
      logoShowTagline: false,
    }));
    setSaveStatus("✓ Logo reset to default Drapza Atelier brand mark. Click SAVE & PUBLISH to apply.");
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const applyLogoPreset = (preset: "atelier" | "couture" | "monolith" | "minimal") => {
    audioSystem.playClick(600);
    if (preset === "atelier") {
      setConfig((prev) => ({
        ...prev,
        logoAlignment: "left",
        logoWidth: 34,
        logoScale: 100,
        logoMobileScale: 100,
        logoOffsetX: 0,
        logoOffsetY: 0,
        logoGap: 10,
        logoLayout: "horizontal",
        logoBorderRadius: 0,
        logoShadow: "subtle",
        logoWordmarkSize: 24,
        logoLetterSpacing: 0.14,
        logoFontWeight: "bold",
      }));
    } else if (preset === "couture") {
      setConfig((prev) => ({
        ...prev,
        logoAlignment: "center",
        logoWidth: 38,
        logoScale: 110,
        logoMobileScale: 95,
        logoOffsetX: 0,
        logoOffsetY: 0,
        logoGap: 12,
        logoLayout: "horizontal",
        logoBorderRadius: 0,
        logoShadow: "medium",
        logoWordmarkSize: 26,
        logoLetterSpacing: 0.18,
        logoFontWeight: "bold",
      }));
    } else if (preset === "monolith") {
      setConfig((prev) => ({
        ...prev,
        logoAlignment: "center",
        logoWidth: 46,
        logoScale: 105,
        logoMobileScale: 90,
        logoOffsetX: 0,
        logoOffsetY: 0,
        logoGap: 8,
        logoLayout: "vertical",
        logoBorderRadius: 0,
        logoShadow: "glow",
        logoWordmarkSize: 22,
        logoLetterSpacing: 0.22,
        logoFontWeight: "black",
      }));
    } else if (preset === "minimal") {
      setConfig((prev) => ({
        ...prev,
        logoAlignment: "left",
        logoWidth: 26,
        logoScale: 90,
        logoMobileScale: 85,
        logoOffsetX: 0,
        logoOffsetY: 0,
        logoGap: 8,
        logoLayout: "horizontal",
        logoBorderRadius: 0,
        logoShadow: "none",
        logoWordmarkSize: 18,
        logoLetterSpacing: 0.12,
        logoFontWeight: "semibold",
      }));
    }
    setSaveStatus("✓ Curated logo aesthetic applied! Click SAVE & PUBLISH to make live.");
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Favicon File Upload
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".ico")) {
      setFaviconUploadError("Please upload an image or icon file (.ico, .png, .svg, .webp).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFaviconUploadError("Icon file size exceeds 2MB limit.");
      return;
    }

    setIsUploadingFavicon(true);
    setFaviconUploadError(null);
    audioSystem.playClick(600);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await siteConfigApi.uploadAsset(base64Data, "drapza_favicon");
          const uploadedUrl = (res as any).url || res.data?.url;
          if (res.success && uploadedUrl) {
            setConfig((prev) => ({
              ...prev,
              faviconUrl: uploadedUrl,
            }));
            audioSystem.playSuccess();
            setSaveStatus("✓ Favicon icon uploaded to CDN successfully!");
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            setFaviconUploadError(res.message || "Failed to upload favicon.");
            audioSystem.playClick(300);
          }
        } catch (err: any) {
          setFaviconUploadError(err.message || "Upload process failed.");
          audioSystem.playClick(300);
        } finally {
          setIsUploadingFavicon(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFaviconUploadError(err.message || "File read error.");
      setIsUploadingFavicon(false);
    }
  };

  // Save Configuration
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(700);

    try {
      const res = await siteConfigApi.updateSiteConfig(config);
      if (res.success && res.data) {
        setConfig(res.data);
        audioSystem.playSuccess();
        setSaveStatus("✓ Browser Tab Title & Site Identity synchronized live across all tabs!");

        // Update current tab immediately
        document.title = res.data.siteTitle;
        if (res.data.faviconUrl) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (link) link.href = res.data.faviconUrl;
        }

        // Dispatch live event to update all mounted clients
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("drapza_site_config_updated", { detail: res.data })
          );
        }

        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus(`✕ Save failed: ${res.message || "Unknown error"}`);
        audioSystem.playClick(300);
      }
    } catch (err: any) {
      setSaveStatus(`✕ Network error: ${err.message}`);
      audioSystem.playClick(300);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Reset to Factory Default
  const handleReset = async () => {
    setIsResetting(true);
    audioSystem.playClick(500);

    try {
      const res = await siteConfigApi.resetSiteConfig();
      if (res.success && res.data) {
        setConfig(res.data);
        audioSystem.playSuccess();
        setSaveStatus("✓ Reset to factory default browser tab identity.");

        document.title = res.data.siteTitle;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("drapza_site_config_updated", { detail: res.data })
          );
        }
      }
    } catch (err: any) {
      setSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Preset Title Templates
  const applyTitlePreset = (preset: string) => {
    audioSystem.playClick(500);
    setConfig((prev) => ({ ...prev, siteTitle: preset }));
  };

  const activeDisplayTitle =
    previewTabState === "inactive" && config.enableInactiveTabNotice
      ? config.inactiveTabTitle || config.siteTitle
      : config.siteTitle || "Drapza — Silhouettes for the Next Era";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── TOP HEADER BAR ─── */}
      <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-none bg-black text-white flex items-center justify-center shadow-md">
            <Globe className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono tracking-tight text-black uppercase">
                BROWSER TAB TITLE & SEO CMS
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-none font-bold uppercase bg-black text-white">
                LIVE IDENTITY
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-500 mt-0.5">
              Control browser window tab title, tab favicon icon, inactive tab hook, and Google SEO snippet
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Reset Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-none border border-neutral-200 text-neutral-700 hover:text-black hover:border-black font-mono text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET DEFAULTS
          </button>

          {/* Save & Publish Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-none bg-black text-white hover:bg-neutral-800 font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SYNCING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                SAVE & PUBLISH
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div
          className={`p-4 rounded-none font-mono text-xs font-bold border transition-all animate-in fade-in flex items-center justify-between ${
            saveStatus.startsWith("✓")
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{saveStatus}</span>
          <button
            onClick={() => setSaveStatus(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="p-4 rounded-none bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs space-y-3">
          <p className="font-bold">
            Are you sure you want to reset the browser tab title and SEO settings back to factory default?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-none font-bold transition-colors cursor-pointer"
            >
              {isResetting ? "RESETTING..." : "YES, RESET TO FACTORY DEFAULT"}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-none font-semibold transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* ─── LIVE BROWSER TAB SIMULATION PREVIEW (1:1 WHAT USERS SEE) ─── */}
      <div className="bg-[#1e1e24] rounded-none p-4 sm:p-6 shadow-xl border border-neutral-800 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-none bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-none bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-none bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
              REAL-TIME BROWSER WINDOW SIMULATION
            </span>
          </div>

          {/* Toggle between Active Tab and Inactive Tab preview */}
          {config.enableInactiveTabNotice && (
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-none border border-white/10 text-xs font-mono">
              <span className="text-[10px] text-neutral-400 px-2 uppercase font-medium">TAB STATE:</span>
              <button
                type="button"
                onClick={() => setPreviewTabState("active")}
                className={`px-2.5 py-1 rounded-none font-bold transition-colors cursor-pointer ${
                  previewTabState === "active" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                ACTIVE
              </button>
              <button
                type="button"
                onClick={() => setPreviewTabState("inactive")}
                className={`px-2.5 py-1 rounded-none font-bold transition-colors cursor-pointer ${
                  previewTabState === "inactive" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                INACTIVE (SWITCHED)
              </button>
            </div>
          )}
        </div>

        {/* Browser Chrome Tabs Bar */}
        <div className="flex items-end gap-2 pt-2">
          {/* Active Tab — 1:1 replica of user's screenshot */}
          <div className="bg-[#2d2d34] hover:bg-[#34343d] rounded-none px-4 py-2.5 flex items-center gap-2.5 max-w-[320px] sm:max-w-[400px] border-t border-x border-white/15 shadow-md relative group transition-colors">
            {/* Favicon Icon */}
            {config.faviconUrl ? (
              <img
                src={config.faviconUrl}
                alt="Favicon"
                className="w-4 h-4 rounded-none object-cover shrink-0"
              />
            ) : (
              <div className="w-4 h-4 rounded-none bg-white text-black flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                D
              </div>
            )}

            {/* Tab Title Text */}
            <span className="text-xs sm:text-sm font-sans font-medium text-white truncate select-none">
              {activeDisplayTitle}
            </span>

            {/* Close 'X' */}
            <button
              type="button"
              className="ml-auto w-4 h-4 rounded-none hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Sibling Dummy Tab */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-neutral-500 hover:text-neutral-300 text-xs font-sans rounded-none transition-colors">
            <span>New Tab</span>
            <X className="w-2.5 h-2.5 opacity-50" />
          </div>

          {/* Plus Tab Icon */}
          <button type="button" className="p-1 text-neutral-400 hover:text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar Simulation */}
        <div className="bg-[#2d2d34] p-2.5 rounded-none flex items-center gap-3 border border-white/10">
          <div className="flex-1 bg-[#1e1e24] px-3.5 py-1.5 rounded-none text-xs font-mono text-neutral-300 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-2 truncate">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-neutral-400">https://</span>
              <span className="text-white font-semibold">drapza.com</span>
              <span className="text-neutral-500">/wardrobe</span>
            </div>
            <span className="text-[10px] text-neutral-500 shrink-0 font-bold uppercase">[ SSL 256-BIT ]</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN SETTINGS GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Title & Favicon Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* ─── CARD 0: FULL WEBSITE LOGO STUDIO & GEOMETRY CONTROL ─── */}
          <div
            id="site-identity-logo-studio"
            data-card="logo-studio"
            className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-6"
          >
            {/* Header with Title and Curated Presets Bar */}
            <div className="border-b border-neutral-100 pb-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-mono text-sm font-bold uppercase text-black flex items-center gap-2">
                    WEBSITE LOGO STUDIO & GEOMETRY CONTROL
                  </h3>
                  <p className="font-mono text-xs text-neutral-500 mt-0.5">
                    Total control over navbar brand alignment, scale, position offsets, geometry, and luxury typography.
                  </p>
                </div>
                <span className="self-start sm:self-auto font-mono text-[10px] px-2.5 py-1 bg-black text-white font-bold uppercase tracking-wider">
                  FULL LOGO SUITE
                </span>
              </div>

              {/* Curated Brand Presets Bar */}
              <div className="bg-neutral-50 border border-neutral-200 p-2.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase text-neutral-500 shrink-0">
                  ONE-CLICK PRESETS:
                </span>
                <button
                  type="button"
                  onClick={() => applyLogoPreset("atelier")}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-white hover:bg-neutral-900 hover:text-white border border-neutral-300 transition-all cursor-pointer shadow-2xs"
                >
                  Classic Atelier
                </button>
                <button
                  type="button"
                  onClick={() => applyLogoPreset("couture")}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-white hover:bg-neutral-900 hover:text-white border border-neutral-300 transition-all cursor-pointer shadow-2xs"
                >
                  Haute Couture (Center)
                </button>
                <button
                  type="button"
                  onClick={() => applyLogoPreset("monolith")}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-white hover:bg-neutral-900 hover:text-white border border-neutral-300 transition-all cursor-pointer shadow-2xs"
                >
                  Monolithic Stacked
                </button>
                <button
                  type="button"
                  onClick={() => applyLogoPreset("minimal")}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-white hover:bg-neutral-900 hover:text-white border border-neutral-300 transition-all cursor-pointer shadow-2xs"
                >
                  Minimalist Sleek
                </button>
              </div>
            </div>

            {/* 1. DISPLAY MODE TABS */}
            <div className="space-y-2">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                LOGO DISPLAY ARCHITECTURE:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "hybrid",
                    title: "HYBRID EMBLEM + WORDMARK",
                    desc: "3D folded emblem or custom icon + typography",
                  },
                  {
                    id: "image",
                    title: "CUSTOM IMAGE LOGO",
                    desc: "Dedicated full PNG / SVG / WebP logo file",
                  },
                  {
                    id: "text",
                    title: "TYPOGRAPHY WORDMARK",
                    desc: "Pure architectural brand typography only",
                  },
                ].map((mode) => {
                  const isActive = (config.logoType || "hybrid") === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setConfig((prev) => ({
                          ...prev,
                          logoType: mode.id as any,
                        }));
                      }}
                      className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                        isActive
                          ? "bg-black text-white border-black shadow-md font-bold"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black hover:bg-neutral-100"
                      }`}
                    >
                      <div className="font-mono text-xs uppercase leading-tight font-bold">
                        {mode.title}
                      </div>
                      <div
                        className={`font-mono text-[10px] mt-1 ${
                          isActive ? "text-neutral-300" : "text-neutral-500"
                        }`}
                      >
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. LIVE REAL-TIME PREVIEWS WITH VIEWPORT TOGGLE */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  LIVE STOREFRONT SIMULATOR:
                </label>
                <div className="flex items-center gap-1 bg-neutral-100 p-0.5 border border-neutral-200">
                  <span className="font-mono text-[9px] uppercase px-2 text-neutral-500 font-bold">
                    VIEWPORT:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(500);
                      setLogoPreviewDevice("desktop");
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase font-bold cursor-pointer transition-colors ${
                      logoPreviewDevice === "desktop"
                        ? "bg-black text-white shadow-xs"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    <Laptop className="w-3 h-3" />
                    <span>DESKTOP ({config.logoScale || 100}%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(500);
                      setLogoPreviewDevice("mobile");
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase font-bold cursor-pointer transition-colors ${
                      logoPreviewDevice === "mobile"
                        ? "bg-black text-white shadow-xs"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>MOBILE ({config.logoMobileScale || 100}%)</span>
                  </button>
                </div>
              </div>

              {/* Preview Container with Simulated Viewport */}
              <div
                className={`transition-all duration-300 space-y-4 ${
                  logoPreviewDevice === "mobile"
                    ? "max-w-[420px] mx-auto border-2 border-dashed border-neutral-400 p-3 bg-neutral-100/50"
                    : "w-full"
                }`}
              >
                {/* 1. Header Navbar Simulation (Dark) */}
                <div className="bg-[#0b0b0d] p-4 border border-neutral-800 rounded-none space-y-2 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[9px] font-mono text-neutral-400 uppercase">
                    <span className="flex items-center gap-1 font-semibold text-neutral-300">
                      <Moon className="w-3 h-3" />
                      HEADER NAVBAR PREVIEW (DARK MODE)
                    </span>
                    <span>
                      ALIGN: {config.logoAlignment?.toUpperCase() || "LEFT"} • SCALE: {logoPreviewDevice === "mobile" ? (config.logoMobileScale || 100) : (config.logoScale || 100)}%
                    </span>
                  </div>

                  {/* Simulated Navbar Top Bar */}
                  <div className="min-h-[72px] relative flex items-center justify-between p-3.5 bg-black/60 border border-neutral-800 overflow-hidden">
                    {/* Left Navbar Flank */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-4 h-3 flex flex-col justify-between opacity-60">
                        <span className="h-0.5 w-full bg-white block"></span>
                        <span className="h-0.5 w-full bg-white block"></span>
                      </div>
                      <span className="font-mono text-[9px] text-neutral-500 uppercase hidden sm:inline">
                        MENU
                      </span>

                      {/* Logo when aligned LEFT */}
                      {(!config.logoAlignment || config.logoAlignment === "left") && (
                        <div className="ml-2">
                          <DrapzaLogo
                            theme="light"
                            customLogoUrl={config.logoUrl}
                            customLogoDarkUrl={config.logoDarkUrl}
                            customLogoType={config.logoType || "hybrid"}
                            customLogoText={config.logoText || "DRAPZA"}
                            customLogoTagline={config.logoTagline || "WEAR YOUR STORY"}
                            customLogoWidth={config.logoWidth || 34}
                            customLogoScale={logoPreviewDevice === "mobile" ? (config.logoMobileScale || 100) : (config.logoScale || 100)}
                            customLogoAlignment="left"
                            customLogoOffsetX={config.logoOffsetX || 0}
                            customLogoOffsetY={config.logoOffsetY || 0}
                            customLogoGap={config.logoGap ?? 10}
                            customLogoLayout={config.logoLayout || "horizontal"}
                            customLogoBorderRadius={config.logoBorderRadius || 0}
                            customLogoOpacity={config.logoOpacity ?? 1}
                            customLogoShadow={config.logoShadow || "subtle"}
                            customLogoAutoInvertDark={config.logoAutoInvertDark || false}
                            customLogoWordmarkSize={config.logoWordmarkSize || 24}
                            customLogoLetterSpacing={config.logoLetterSpacing ?? 0.14}
                            customLogoFontWeight={config.logoFontWeight || "bold"}
                            customLogoShowTagline={config.logoShowTagline || false}
                            showTagline={config.logoShowTagline}
                          />
                        </div>
                      )}
                    </div>

                    {/* Logo when aligned CENTER */}
                    {config.logoAlignment === "center" && (
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <DrapzaLogo
                          theme="light"
                          customLogoUrl={config.logoUrl}
                          customLogoDarkUrl={config.logoDarkUrl}
                          customLogoType={config.logoType || "hybrid"}
                          customLogoText={config.logoText || "DRAPZA"}
                          customLogoTagline={config.logoTagline || "WEAR YOUR STORY"}
                          customLogoWidth={config.logoWidth || 34}
                          customLogoScale={logoPreviewDevice === "mobile" ? (config.logoMobileScale || 100) : (config.logoScale || 100)}
                          customLogoAlignment="center"
                          customLogoOffsetX={config.logoOffsetX || 0}
                          customLogoOffsetY={config.logoOffsetY || 0}
                          customLogoGap={config.logoGap ?? 10}
                          customLogoLayout={config.logoLayout || "horizontal"}
                          customLogoBorderRadius={config.logoBorderRadius || 0}
                          customLogoOpacity={config.logoOpacity ?? 1}
                          customLogoShadow={config.logoShadow || "subtle"}
                          customLogoAutoInvertDark={config.logoAutoInvertDark || false}
                          customLogoWordmarkSize={config.logoWordmarkSize || 24}
                          customLogoLetterSpacing={config.logoLetterSpacing ?? 0.14}
                          customLogoFontWeight={config.logoFontWeight || "bold"}
                          customLogoShowTagline={config.logoShowTagline || false}
                          showTagline={config.logoShowTagline}
                        />
                      </div>
                    )}

                    {/* Right Navbar Flank */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Logo when aligned RIGHT */}
                      {config.logoAlignment === "right" && (
                        <div className="mr-2">
                          <DrapzaLogo
                            theme="light"
                            customLogoUrl={config.logoUrl}
                            customLogoDarkUrl={config.logoDarkUrl}
                            customLogoType={config.logoType || "hybrid"}
                            customLogoText={config.logoText || "DRAPZA"}
                            customLogoTagline={config.logoTagline || "WEAR YOUR STORY"}
                            customLogoWidth={config.logoWidth || 34}
                            customLogoScale={logoPreviewDevice === "mobile" ? (config.logoMobileScale || 100) : (config.logoScale || 100)}
                            customLogoAlignment="right"
                            customLogoOffsetX={config.logoOffsetX || 0}
                            customLogoOffsetY={config.logoOffsetY || 0}
                            customLogoGap={config.logoGap ?? 10}
                            customLogoLayout={config.logoLayout || "horizontal"}
                            customLogoBorderRadius={config.logoBorderRadius || 0}
                            customLogoOpacity={config.logoOpacity ?? 1}
                            customLogoShadow={config.logoShadow || "subtle"}
                            customLogoAutoInvertDark={config.logoAutoInvertDark || false}
                            customLogoWordmarkSize={config.logoWordmarkSize || 24}
                            customLogoLetterSpacing={config.logoLetterSpacing ?? 0.14}
                            customLogoFontWeight={config.logoFontWeight || "bold"}
                            customLogoShowTagline={config.logoShowTagline || false}
                            showTagline={config.logoShowTagline}
                          />
                        </div>
                      )}
                      <div className="hidden sm:flex items-center gap-2 text-neutral-400 font-mono text-[9px]">
                        <span>SEARCH</span>
                        <span>•</span>
                        <span>BAG (0)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Footer / Paper Simulation (Light) */}
                <div className="bg-white p-4 border border-neutral-200 rounded-none space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 text-[9px] font-mono text-neutral-500 uppercase">
                    <span className="flex items-center gap-1 font-semibold text-neutral-800">
                      <Sun className="w-3 h-3" />
                      LIGHT SURFACE / FOOTER PREVIEW
                    </span>
                    <span>TAGLINE: {config.logoShowTagline ? "ENABLED" : "OFF"}</span>
                  </div>
                  <div className={`min-h-[72px] flex items-center p-4 bg-neutral-50 border border-neutral-200 overflow-hidden ${
                    config.logoAlignment === "center" ? "justify-center" : config.logoAlignment === "right" ? "justify-end" : "justify-start"
                  }`}>
                    <DrapzaLogo
                      theme="dark"
                      customLogoUrl={config.logoUrl}
                      customLogoDarkUrl={config.logoDarkUrl}
                      customLogoType={config.logoType || "hybrid"}
                      customLogoText={config.logoText || "DRAPZA"}
                      customLogoTagline={config.logoTagline || "WEAR YOUR STORY"}
                      customLogoWidth={config.logoWidth || 34}
                      customLogoScale={logoPreviewDevice === "mobile" ? (config.logoMobileScale || 100) : (config.logoScale || 100)}
                      customLogoAlignment={config.logoAlignment || "left"}
                      customLogoOffsetX={config.logoOffsetX || 0}
                      customLogoOffsetY={config.logoOffsetY || 0}
                      customLogoGap={config.logoGap ?? 10}
                      customLogoLayout={config.logoLayout || "horizontal"}
                      customLogoBorderRadius={config.logoBorderRadius || 0}
                      customLogoOpacity={config.logoOpacity ?? 1}
                      customLogoShadow={config.logoShadow || "subtle"}
                      customLogoAutoInvertDark={config.logoAutoInvertDark || false}
                      customLogoWordmarkSize={config.logoWordmarkSize || 24}
                      customLogoLetterSpacing={config.logoLetterSpacing ?? 0.14}
                      customLogoFontWeight={config.logoFontWeight || "bold"}
                      customLogoShowTagline={config.logoShowTagline || false}
                      showTagline={config.logoShowTagline}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ALIGNMENT & LAYOUT ENGINE */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* A. Header Alignment */}
                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    HEADER LOGO ALIGNMENT:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "left", label: "LEFT", icon: AlignLeft },
                      { id: "center", label: "CENTER", icon: AlignCenter },
                      { id: "right", label: "RIGHT", icon: AlignRight },
                    ].map((align) => {
                      const isAlignActive = (config.logoAlignment || "left") === align.id;
                      const IconComp = align.icon;
                      return (
                        <button
                          key={align.id}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(600);
                            setConfig((prev) => ({
                              ...prev,
                              logoAlignment: align.id as any,
                            }));
                          }}
                          className={`py-2 px-3 flex items-center justify-center gap-1.5 border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                            isAlignActive
                              ? "bg-black text-white border-black shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{align.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* B. Layout Orientation */}
                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    EMBLEM & TEXT LAYOUT:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "horizontal", label: "ROW (SIDE BY SIDE)" },
                      { id: "vertical", label: "STACKED (CENTERED)" },
                    ].map((orient) => {
                      const isOrientActive = (config.logoLayout || "horizontal") === orient.id;
                      return (
                        <button
                          key={orient.id}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(600);
                            setConfig((prev) => ({
                              ...prev,
                              logoLayout: orient.id as any,
                            }));
                          }}
                          className={`py-2 px-3 text-center border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                            isOrientActive
                              ? "bg-black text-white border-black shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                          }`}
                        >
                          {orient.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* C. Gap Spacing Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    EMBLEM & WORDMARK SPACING (GAP): {config.logoGap ?? 10}PX
                  </label>
                  <span className="font-mono text-[10px] text-neutral-400">
                    Standard: 8px - 16px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={config.logoGap ?? 10}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      logoGap: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* 4. SCALE & SIZING CONSOLE */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
                SCALE & SIZING CONTROL CONSOLE:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Base Emblem Height */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      EMBLEM HEIGHT
                    </span>
                    <span className="font-mono text-xs font-black text-black">
                      {config.logoWidth || 34}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={72}
                    step={2}
                    value={config.logoWidth || 34}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoWidth: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    {[24, 34, 44, 56].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(400);
                          setConfig((prev) => ({ ...prev, logoWidth: sz }));
                        }}
                        className={`text-[9px] font-mono px-1.5 py-0.5 border cursor-pointer ${
                          (config.logoWidth || 34) === sz
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Global Desktop Scale Factor */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      DESKTOP SCALE
                    </span>
                    <span className="font-mono text-xs font-black text-black">
                      {config.logoScale || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={180}
                    step={5}
                    value={config.logoScale || 100}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoScale: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    {[80, 100, 120, 150].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(400);
                          setConfig((prev) => ({ ...prev, logoScale: sc }));
                        }}
                        className={`text-[9px] font-mono px-1.5 py-0.5 border cursor-pointer ${
                          (config.logoScale || 100) === sc
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {sc}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Mobile Scale Factor */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      MOBILE SCALE
                    </span>
                    <span className="font-mono text-xs font-black text-black">
                      {config.logoMobileScale || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={130}
                    step={5}
                    value={config.logoMobileScale || 100}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoMobileScale: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    {[70, 85, 100, 115].map((ms) => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(400);
                          setConfig((prev) => ({ ...prev, logoMobileScale: ms }));
                        }}
                        className={`text-[9px] font-mono px-1.5 py-0.5 border cursor-pointer ${
                          (config.logoMobileScale || 100) === ms
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {ms}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. PRECISION POSITION OFFSETS (X & Y NUDGE) */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-black" />
                  PRECISION POSITION OFFSETS (NUDGE X & Y):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(400);
                    setConfig((prev) => ({ ...prev, logoOffsetX: 0, logoOffsetY: 0 }));
                  }}
                  className="font-mono text-[10px] text-neutral-500 hover:text-black underline cursor-pointer"
                >
                  RESET OFFSETS (0, 0)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Horizontal X Nudge */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      HORIZONTAL OFFSET (X)
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {config.logoOffsetX || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-60}
                    max={60}
                    step={1}
                    value={config.logoOffsetX || 0}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoOffsetX: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <span className="font-mono text-[9px] text-neutral-400 block">
                    Left (-) to Right (+) pixel shift
                  </span>
                </div>

                {/* Vertical Y Nudge */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      VERTICAL OFFSET (Y)
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {config.logoOffsetY || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={config.logoOffsetY || 0}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoOffsetY: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <span className="font-mono text-[9px] text-neutral-400 block">
                    Up (-) to Down (+) pixel shift
                  </span>
                </div>
              </div>
            </div>

            {/* 6. LOGO UPLOADS (PRIMARY & DARK HEADER VARIANT) */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-black" />
                LOGO ASSET UPLOAD & THEME VARIANTS:
              </label>

              {/* Primary Logo */}
              <div className="space-y-2 bg-neutral-50 p-3 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase text-neutral-800">
                    PRIMARY LOGO (LIGHT BACKGROUND / UNIVERSAL)
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">
                    PNG / SVG / WEBP / JPG
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*,.svg"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>UPLOADING...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>UPLOAD FILE</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={config.logoUrl || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, logoUrl: e.target.value }))
                    }
                    placeholder="https://... or upload file (Transparent PNG/SVG recommended)"
                    className="flex-1 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-800 focus:outline-none focus:border-black"
                  />

                  {config.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(400);
                        setConfig((prev) => ({ ...prev, logoUrl: "" }));
                      }}
                      className="p-2 border border-neutral-300 hover:border-red-500 hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      title="Clear custom logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {logoUploadError && (
                  <p className="text-xs font-mono text-rose-600">✕ {logoUploadError}</p>
                )}
              </div>

              {/* Dark Header Variant (Optional) */}
              <div className="space-y-2 bg-neutral-50 p-3 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase text-neutral-800 flex items-center gap-1">
                    <Moon className="w-3 h-3 text-neutral-600" />
                    DARK NAVBAR VARIANT (OPTIONAL)
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">
                    White / Inverted icon for dark navbar
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={darkLogoInputRef}
                    onChange={handleDarkLogoUpload}
                    accept="image/*,.svg"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => darkLogoInputRef.current?.click()}
                    disabled={isUploadingDarkLogo}
                    className="px-4 py-2 bg-neutral-800 text-white hover:bg-neutral-900 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isUploadingDarkLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>UPLOADING...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>UPLOAD DARK VARIANT</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={config.logoDarkUrl || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, logoDarkUrl: e.target.value }))
                    }
                    placeholder="Optional white/light logo URL for dark header"
                    className="flex-1 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-800 focus:outline-none focus:border-black"
                  />

                  {config.logoDarkUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(400);
                        setConfig((prev) => ({ ...prev, logoDarkUrl: "" }));
                      }}
                      className="p-2 border border-neutral-300 hover:border-red-500 hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      title="Clear dark variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {darkLogoUploadError && (
                  <p className="text-xs font-mono text-rose-600">✕ {darkLogoUploadError}</p>
                )}

                {/* Auto-invert toggle */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-invert-logo"
                    checked={config.logoAutoInvertDark || false}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoAutoInvertDark: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <label
                    htmlFor="auto-invert-logo"
                    className="font-mono text-[11px] text-neutral-700 font-medium cursor-pointer"
                  >
                    Auto-invert monochrome logo on dark header (smart CSS invert filter)
                  </label>
                </div>
              </div>
            </div>

            {/* 7. EMBLEM STYLING & DEPTH / SHADOW */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-black" />
                EMBLEM STYLING, BORDER RADIUS & DROP SHADOW:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* A. Border Radius */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      CORNER RADIUS
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {config.logoBorderRadius || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={2}
                    value={config.logoBorderRadius || 0}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoBorderRadius: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, logoBorderRadius: 0 }))}
                      className="text-[9px] font-mono px-2 py-0.5 border border-neutral-200 bg-white"
                    >
                      Sharp (0px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, logoBorderRadius: 50 }))}
                      className="text-[9px] font-mono px-2 py-0.5 border border-neutral-200 bg-white"
                    >
                      Circle (50px)
                    </button>
                  </div>
                </div>

                {/* B. Emblem Opacity */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      OPACITY
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {Math.round((config.logoOpacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={config.logoOpacity ?? 1}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoOpacity: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <span className="font-mono text-[9px] text-neutral-400 block pt-1">
                    Full visibility is 100%
                  </span>
                </div>

                {/* C. Drop Shadow Preset */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <span className="font-mono text-[11px] font-bold uppercase text-neutral-700 block">
                    DEPTH & DROP SHADOW
                  </span>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {[
                      { id: "none", label: "None" },
                      { id: "subtle", label: "Subtle" },
                      { id: "medium", label: "Medium" },
                      { id: "strong", label: "Deep" },
                      { id: "glow", label: "Glow" },
                    ].map((sh) => {
                      const isShActive = (config.logoShadow || "subtle") === sh.id;
                      return (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(400);
                            setConfig((prev) => ({ ...prev, logoShadow: sh.id as any }));
                          }}
                          className={`text-[9px] font-mono py-1 border font-bold uppercase cursor-pointer ${
                            isShActive
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
                          }`}
                        >
                          {sh.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. BRAND WORDMARK & TYPOGRAPHY STUDIO */}
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-black" />
                BRAND WORDMARK & TYPOGRAPHY STUDIO:
              </label>

              {/* Text Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                    BRAND WORDMARK TEXT
                  </label>
                  <input
                    type="text"
                    value={config.logoText !== undefined ? config.logoText : "DRAPZA"}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, logoText: e.target.value }))
                    }
                    placeholder="DRAPZA"
                    className="w-full px-3 py-2 border border-neutral-300 bg-neutral-50 font-mono text-xs uppercase font-bold text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 block">
                    Displays stylized &apos;DRΛPZΛ&apos; when set to DRAPZA.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                      BRAND TAGLINE TEXT
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="show-tagline-toggle"
                        checked={config.logoShowTagline || false}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            logoShowTagline: e.target.checked,
                          }))
                        }
                        className="w-3.5 h-3.5 accent-black cursor-pointer"
                      />
                      <label
                        htmlFor="show-tagline-toggle"
                        className="font-mono text-[10px] font-bold uppercase text-neutral-600 cursor-pointer"
                      >
                        SHOW TAGLINE
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.logoTagline !== undefined ? config.logoTagline : "WEAR YOUR STORY"}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, logoTagline: e.target.value }))
                    }
                    placeholder="WEAR YOUR STORY"
                    className="w-full px-3 py-2 border border-neutral-300 bg-neutral-50 font-mono text-xs uppercase font-semibold text-neutral-800 focus:outline-none focus:border-black focus:bg-white"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 block">
                    Displayed beneath wordmark when toggle is checked.
                  </span>
                </div>
              </div>

              {/* Typography Sliders & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Font Size */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      WORDMARK FONT SIZE
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {config.logoWordmarkSize || 24}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={40}
                    step={1}
                    value={config.logoWordmarkSize || 24}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoWordmarkSize: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-700">
                      LETTER TRACKING
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {config.logoLetterSpacing ?? 0.14}em
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.4}
                    step={0.01}
                    value={config.logoLetterSpacing ?? 0.14}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        logoLetterSpacing: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Font Weight */}
                <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200">
                  <span className="font-mono text-[11px] font-bold uppercase text-neutral-700 block">
                    TYPOGRAPHY WEIGHT
                  </span>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { id: "medium", label: "500" },
                      { id: "semibold", label: "600" },
                      { id: "bold", label: "700" },
                      { id: "black", label: "900" },
                    ].map((wt) => {
                      const isWtActive = (config.logoFontWeight || "bold") === wt.id;
                      return (
                        <button
                          key={wt.id}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(400);
                            setConfig((prev) => ({ ...prev, logoFontWeight: wt.id as any }));
                          }}
                          className={`text-[9px] font-mono py-1 border font-bold uppercase cursor-pointer ${
                            isWtActive
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
                          }`}
                        >
                          {wt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 9. RESET TO DEFAULT ACTION BAR */}
            <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 hover:border-black text-[11px] font-mono font-semibold text-neutral-700 hover:text-black transition-colors cursor-pointer bg-neutral-50 hover:bg-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET LOGO TO ATELIER FACTORY DEFAULT</span>
              </button>

              <span className="font-mono text-[10px] text-neutral-400 uppercase">
                Changes update previews immediately • Click SAVE & PUBLISH to make live
              </span>
            </div>
          </div>

          {/* CARD 1: PRIMARY BROWSER TAB TITLE */}
          <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-mono text-sm font-bold uppercase text-black flex items-center gap-2">
                <Globe className="w-4 h-4" />
                PRIMARY BROWSER TAB TITLE
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                The exact text displayed at the top of the user&apos;s browser tab and bookmark bar
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  PAGE TAB TITLE STRING
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    config.siteTitle.length > 60 ? "text-amber-600" : "text-neutral-400"
                  }`}
                >
                  {config.siteTitle.length} characters (Recommended: 40–60)
                </span>
              </div>

              <input
                type="text"
                value={config.siteTitle}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, siteTitle: e.target.value }))
                }
                placeholder="Drapza — Silhouettes for the Next Era"
                className="w-full px-4 py-3 rounded-none border border-neutral-200 bg-neutral-50 font-sans text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-colors shadow-inner"
              />
            </div>

            {/* Quick 1-Click Preset Titles */}
            <div className="space-y-2 pt-1">
              <span className="block font-mono text-[11px] font-bold uppercase text-neutral-500">
                QUICK 1-CLICK TITLE PRESETS:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Drapza — Silhouettes for the Next Era",
                  "DRAPZA • Technical Streetwear & Haute Couture",
                  "DRAPZA ATELIER — ARCHIVE 2026",
                  "DRAPZA — Modular Streetwear For The Quietly Defiant",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyTitlePreset(preset)}
                    className="px-3 py-1.5 rounded-none border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black text-[11px] font-mono text-neutral-700 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Short Name */}
            <div className="space-y-2 pt-3 border-t border-neutral-100">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                BRAND NAME
              </label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, brandName: e.target.value }))
                }
                placeholder="Drapza"
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs font-bold uppercase focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* CARD 2: BROWSER TAB FAVICON (ICON) */}
          <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-mono text-sm font-bold uppercase text-black flex items-center gap-2">
                FAVICON / TAB ICON (.PNG / .ICO / .SVG)
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                Upload your brand icon or logo to display beside the title in browser tabs
              </p>
            </div>

            <div className="space-y-3">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                FAVICON ICON IMAGE
              </label>

              <div className="flex items-center gap-3">
                {/* Live Icon Thumbnail */}
                <div className="w-12 h-12 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {config.faviconUrl ? (
                    <img
                      src={config.faviconUrl}
                      alt="Favicon"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="font-mono text-xs font-bold text-neutral-400">NONE</span>
                  )}
                </div>

                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={config.faviconUrl}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, faviconUrl: e.target.value }))
                    }
                    placeholder="https://... or upload below"
                    className="flex-1 px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs text-neutral-700 focus:outline-none focus:border-black focus:bg-white"
                  />

                  <input
                    type="file"
                    ref={faviconInputRef}
                    onChange={handleFaviconUpload}
                    accept="image/*,.ico"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploadingFavicon}
                    className="px-4 py-2.5 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 font-mono text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    UPLOAD ICON
                  </button>
                </div>
              </div>

              {faviconUploadError && (
                <p className="text-xs font-mono text-rose-600">✕ {faviconUploadError}</p>
              )}
            </div>
          </div>

          {/* CARD 3: INACTIVE TAB SWITCHER HOOK */}
          <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-mono text-sm font-bold uppercase text-black">
                  INACTIVE TAB ATTENTION HOOK
                </h3>
                <p className="font-mono text-xs text-neutral-500">
                  Automatically change tab title when the customer switches to another browser tab
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableInactiveTabNotice}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      enableInactiveTabNotice: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            {config.enableInactiveTabNotice && (
              <div className="space-y-2 animate-in fade-in">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  INACTIVE TAB TITLE TEXT
                </label>
                <input
                  type="text"
                  value={config.inactiveTabTitle}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, inactiveTabTitle: e.target.value }))
                  }
                  placeholder="DRAPZA • — WAITING IN VAULT"
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-sans text-xs font-semibold focus:outline-none focus:border-black focus:bg-white"
                />
                <span className="text-[11px] font-mono text-neutral-400 block">
                  When users click away to another browser window or tab, this message catches their attention to return.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SEO Metadata & Google SERP Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 4: GOOGLE SEARCH SNIPPET PREVIEW */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-4 sticky top-28">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                GOOGLE SEARCH SERP PREVIEW
              </span>
              <span className="font-mono text-[10px] text-neutral-400 uppercase">
                SEO METADATA
              </span>
            </div>

            {/* Google Search Card Replica */}
            <div className="bg-neutral-50 rounded-none p-4 border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-none bg-black text-white flex items-center justify-center font-mono text-[10px] font-bold">
                  D
                </div>
                <div className="flex flex-col text-[11px]">
                  <span className="font-sans text-neutral-800 font-semibold leading-tight">
                    {config.brandName || "Drapza"}
                  </span>
                  <span className="font-sans text-neutral-500 leading-tight text-[10px]">
                    https://drapza.com
                  </span>
                </div>
              </div>

              <h4 className="font-sans text-base text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
                {config.siteTitle || "Drapza — Silhouettes for the Next Era"}
              </h4>

              <p className="font-sans text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {config.siteDescription ||
                  "Clothing reduced to pure signal. Drapza builds modular, neutral garments for the frictionless, the fast, and the quietly defiant."}
              </p>
            </div>

            {/* Meta Description Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  META DESCRIPTION
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    config.siteDescription.length > 160 ? "text-amber-600" : "text-neutral-400"
                  }`}
                >
                  {config.siteDescription.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                value={config.siteDescription}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, siteDescription: e.target.value }))
                }
                placeholder="Clothing reduced to pure signal. Drapza builds modular, neutral garments..."
                className="w-full px-3.5 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-sans text-xs focus:outline-none focus:border-black focus:bg-white leading-relaxed"
              />
            </div>

            {/* SEO Keywords */}
            <div className="space-y-2 pt-1">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                SEO KEYWORDS (COMMA SEPARATED)
              </label>
              <input
                type="text"
                value={config.keywords}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, keywords: e.target.value }))
                }
                placeholder="luxury streetwear, modular fashion, high-density drape"
                className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── CARD 5: GLOBAL TOP HEADER ANNOUNCEMENT MARQUEE BAR (FULL WIDTH) ─── */}
      <div className="bg-white rounded-none border border-neutral-200 p-6 sm:p-7 shadow-sm space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-none ${config.announcementEnabled !== false ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-900">
                TOP HEADER ANNOUNCEMENT MARQUEE BAR
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-none font-bold uppercase ${
                config.announcementEnabled !== false
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-neutral-100 text-neutral-500"
              }`}>
                {config.announcementEnabled !== false ? "LIVE ON STORE" : "DISABLED"}
              </span>
            </div>
            <p className="font-sans text-xs text-neutral-500 mt-1">
              Dynamic multi-message rotating ticker displayed at the very top of every storefront page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-neutral-600">
              {config.announcementEnabled !== false ? "ENABLED" : "DISABLED"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.announcementEnabled ?? true}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, announcementEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
            </label>
          </div>
        </div>

        {/* Live Marquee Preview Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              LIVE STOREFRONT HEADER PREVIEW
            </span>
            <span className="font-mono text-[10px] text-neutral-400">
              ROTATES EVERY {config.announcementIntervalSeconds || 4}S
            </span>
          </div>

          <div className="w-full bg-black text-white text-xs font-mono py-2.5 px-4 rounded-none flex items-center justify-between shadow-inner overflow-hidden border border-neutral-800">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 shrink-0 animate-pulse" />
              <span className="tracking-widest uppercase font-semibold truncate">
                {(config.announcementMessages && config.announcementMessages.length > 0)
                  ? config.announcementMessages[0]
                  : "NEW ATELIER SIGNAL • COMPLIMENTARY EXPRESS GLOBAL SHIPPING"}
              </span>
            </div>
            {config.announcementLinkUrl && (
              <span className="text-[10px] text-neutral-400 underline shrink-0 hidden sm:inline ml-3">
                {config.announcementLinkUrl}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 pt-2">
          {/* Settings Grid: Destination URL & Rotation Speed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                CLICK DESTINATION URL / ROUTE
              </label>
              <input
                type="text"
                value={config.announcementLinkUrl || "/wardrobe"}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, announcementLinkUrl: e.target.value }))
                }
                placeholder="/wardrobe or https://..."
                className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
              <p className="font-mono text-[10px] text-neutral-400">
                When customers tap the marquee bar, they navigate to this URL.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                ROTATION CYCLE SPEED (SECONDS)
              </label>
              <input
                type="number"
                min={2}
                max={30}
                value={config.announcementIntervalSeconds || 4}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    announcementIntervalSeconds: Math.max(1, Number(e.target.value)),
                  }))
                }
                className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
              <p className="font-mono text-[10px] text-neutral-400">
                Time before automatically switching to the next announcement phrase (2 - 30 seconds).
              </p>
            </div>
          </div>

          {/* Marquee Messages List */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                ACTIVE MARQUEE TICKER MESSAGES ({(config.announcementMessages || []).length})
              </label>
              <span className="font-mono text-[10px] text-neutral-400">
                Reorder or edit each ticker message line
              </span>
            </div>

            <div className="space-y-2.5">
              {(config.announcementMessages || []).map((msg, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-neutral-50 hover:bg-neutral-100/70 p-2 rounded-none border border-neutral-200 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-neutral-600 w-8 h-8 rounded-none bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => {
                      const nextMsgs = [...(config.announcementMessages || [])];
                      nextMsgs[idx] = e.target.value;
                      setConfig((prev) => ({ ...prev, announcementMessages: nextMsgs }));
                    }}
                    placeholder="ENTER ANNOUNCEMENT TEXT..."
                    className="flex-1 px-3.5 py-2 rounded-none border border-neutral-200 bg-white font-mono text-xs uppercase focus:outline-none focus:border-black shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextMsgs = (config.announcementMessages || []).filter((_, i) => i !== idx);
                      setConfig((prev) => ({ ...prev, announcementMessages: nextMsgs }));
                    }}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer shrink-0"
                    title="Remove message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {(!config.announcementMessages || config.announcementMessages.length === 0) && (
                <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-none">
                  <p className="font-mono text-xs text-neutral-400">No ticker messages configured. Click button below to add one.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const nextMsgs = [
                  ...(config.announcementMessages || []),
                  "NEW ATELIER SIGNAL • LIMITED DROPS RESTOCKED",
                ];
                setConfig((prev) => ({ ...prev, announcementMessages: nextMsgs }));
              }}
              className="mt-3 px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black font-mono text-xs uppercase tracking-wider text-neutral-800 hover:bg-neutral-100 flex items-center gap-2 cursor-pointer transition-all shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>ADD NEW ANNOUNCEMENT MESSAGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

