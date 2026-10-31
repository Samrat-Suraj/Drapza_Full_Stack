"use client";

import React, { useState, useRef } from "react";
import {
  Compass,
  Save,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Link as LinkIcon,
  HelpCircle,
  Layout,
  Layers,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { footerConfigApi, FooterConfigData, DEFAULT_FOOTER_CONFIG, FooterLinkItem } from "@/lib/api";

interface FooterAdminTabProps {
  config: FooterConfigData;
  setConfig: React.Dispatch<React.SetStateAction<FooterConfigData>>;
  onSaveSuccess?: () => void;
}

export const FooterAdminTab: React.FC<FooterAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<"banner" | "newsletter" | "navigation" | "brand">("banner");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image upload to Cloudinary
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageUploadError("Image size exceeds 8MB limit.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);
    audioSystem.playClick(600);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await footerConfigApi.uploadFooterImage(base64Data);
          const uploadedUrl = (res as any).url || res.data?.url;
          if (res.success && uploadedUrl) {
            setConfig((prev) => ({
              ...prev,
              heroBannerImage: uploadedUrl,
            }));
            audioSystem.playSuccess();
            setSaveStatus("Hero cutout image uploaded successfully!");
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            setImageUploadError(res.message || "Failed to upload image.");
            audioSystem.playClick(300);
          }
        } catch (err: any) {
          setImageUploadError(err.message || "Error uploading image to server.");
          audioSystem.playClick(300);
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImageUploadError(err.message || "File read error.");
      setIsUploadingImage(false);
    }
  };

  // Save Configuration
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(700);

    try {
      const res = await footerConfigApi.updateFooterConfig(config);
      const resData = (res.data || res) as unknown as FooterConfigData;
      if (res.success && resData) {
        setConfig(resData);
        audioSystem.playSuccess();
        setSaveStatus("✓ Footer architecture published & live across all pages.");

        // Dispatch live event to update any mounted FooterSection and Navigation instantly
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("drapza_footer_config", JSON.stringify(resData));
          } catch (_) {}
          window.dispatchEvent(
            new CustomEvent("drapza_footer_config_updated", { detail: resData })
          );
        }

        if (onSaveSuccess) onSaveSuccess();
      } else {
        setSaveStatus(`✕ Failed to save: ${res.message || "Unknown error"}`);
        audioSystem.playClick(300);
      }
    } catch (err: any) {
      setSaveStatus(`✕ Server error: ${err.message || "Network timeout"}`);
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
      const res = await footerConfigApi.resetFooterConfig();
      const resData = (res.data || res) as unknown as FooterConfigData;
      if (res.success && resData) {
        setConfig(resData);
        audioSystem.playSuccess();
        setSaveStatus("✓ Footer reset to factory defaults.");

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("drapza_footer_config", JSON.stringify(resData));
          } catch (_) {}
          window.dispatchEvent(
            new CustomEvent("drapza_footer_config_updated", { detail: resData })
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

  // Helper to add links to columns
  const addLink = (column: 1 | 2) => {
    audioSystem.playClick(600);
    const newLink: FooterLinkItem = { label: "NEW LINK", href: "/", isBespoke: false };
    if (column === 1) {
      setConfig((prev) => {
        const nextCol1 = [...(prev.col1Links || prev.rootLinks || []), newLink];
        return {
          ...prev,
          col1Links: nextCol1,
          rootLinks: nextCol1,
        };
      });
    } else {
      setConfig((prev) => ({
        ...prev,
        col2Links: [...(prev.col2Links || []), newLink],
      }));
    }
  };

  // Helper to update a link
  const updateLink = (
    column: 1 | 2,
    index: number,
    field: "label" | "href" | "isBespoke",
    value: any
  ) => {
    if (column === 1) {
      const base = [...(config.col1Links || config.rootLinks || [])];
      base[index] = { ...base[index], [field]: value };
      setConfig((prev) => ({ ...prev, col1Links: base, rootLinks: base }));
    } else {
      const updated = [...(config.col2Links || [])];
      updated[index] = { ...updated[index], [field]: value };
      setConfig((prev) => ({ ...prev, col2Links: updated }));
    }
  };

  // Helper to delete a link
  const deleteLink = (column: 1 | 2, index: number) => {
    audioSystem.playClick(400);
    if (column === 1) {
      const base = (config.col1Links || config.rootLinks || []).filter((_, i) => i !== index);
      setConfig((prev) => ({
        ...prev,
        col1Links: base,
        rootLinks: base,
      }));
    } else {
      const base = (config.col2Links || []).filter((_, i) => i !== index);
      setConfig((prev) => ({
        ...prev,
        col2Links: base,
      }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── TOP ACTION BAR ─── */}
      <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-none bg-black text-white flex items-center justify-center shadow-md">
            <Compass className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono tracking-tight text-black uppercase">
                FOOTER ARCHITECTURE CMS
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-none font-bold uppercase ${
                  config.isEnabled
                    ? "bg-black text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {config.isEnabled ? "LIVE STOREFRONT" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-500 mt-0.5">
              Configure hero parallax cutout, VIP dispatch newsletter, multi-column navigation, hotlines & bottom bar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Master Enable/Disable Toggle */}
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-none font-mono text-xs font-bold transition-all border cursor-pointer ${
              config.isEnabled
                ? "bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200"
                : "bg-black text-white border-black hover:bg-neutral-900"
            }`}
          >
            {config.isEnabled ? (
              <>
                <EyeOff className="w-4 h-4" />
                DISABLE FOOTER
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                ENABLE FOOTER
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-none border border-neutral-200 text-neutral-700 hover:text-black hover:border-black font-mono text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET DEFAULTS
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-none bg-black text-white hover:bg-neutral-800 font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                PUBLISHING...
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

      {/* Save / Error Status Alert */}
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

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="p-4 rounded-none bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs space-y-3">
          <p className="font-bold">
            Are you sure you want to reset the footer configuration back to factory default? All custom navigation links, copy, and colors will be replaced.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-none font-bold transition-colors cursor-pointer"
            >
              {isResetting ? "RESETTING..." : "YES, RESTORE FACTORY DEFAULT"}
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

      {/* ─── TAB NAVIGATION SELECTOR ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(600);
            setActiveSubSection("banner");
          }}
          className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === "banner"
              ? "bg-black text-white shadow-sm"
              : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          HERO BANNER & PARALLAX
        </button>

        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(600);
            setActiveSubSection("newsletter");
          }}
          className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === "newsletter"
              ? "bg-black text-white shadow-sm"
              : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          VIP DISPATCH CARD
        </button>

        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(600);
            setActiveSubSection("navigation");
          }}
          className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === "navigation"
              ? "bg-black text-white shadow-sm"
              : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          COLUMNS & HOTLINE
        </button>

        <button
          type="button"
          onClick={() => {
            audioSystem.playClick(600);
            setActiveSubSection("brand");
          }}
          className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === "brand"
              ? "bg-black text-white shadow-sm"
              : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          BRAND LOGO & COPYRIGHT
        </button>
      </div>

      {/* ─── SUB-SECTION 1: HERO BANNER & PARALLAX ─── */}
      {activeSubSection === "banner" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-mono text-sm font-bold uppercase text-black">
                    HERO PARALLAX BANNER SETTINGS
                  </h3>
                  <p className="font-mono text-xs text-neutral-500">
                    The top oversized banner featuring models cutout and giant typography
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showHeroBanner}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showHeroBanner: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* Banner Text */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  GIANT BACKGROUND TYPOGRAPHY
                </label>
                <input
                  type="text"
                  value={config.heroBannerText}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, heroBannerText: e.target.value }))
                  }
                  placeholder="e.g. DRAPZA"
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-sm uppercase font-bold focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
                <span className="text-[11px] font-mono text-neutral-400">
                  Rendered in huge display typography behind the foreground models cutout.
                </span>
              </div>

              {/* Foreground Image Upload & URL */}
              <div className="space-y-3">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  MODELS CUTOUT IMAGE (PNG WITH TRANSPARENCY)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.heroBannerImage}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, heroBannerImage: e.target.value }))
                    }
                    placeholder="/images/drapza/contact-form/contact-parallax.png"
                    className="flex-1 px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs text-neutral-700 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBannerImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-4 py-2.5 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 font-mono text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    UPLOAD FILE
                  </button>
                </div>
                {imageUploadError && (
                  <p className="text-xs font-mono text-rose-600">✕ {imageUploadError}</p>
                )}
                <span className="text-[11px] font-mono text-neutral-400">
                  Recommended: Transparent PNG or cutout image of campaign models for the depth effect.
                </span>
              </div>

              {/* Background Color & Text Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    BANNER BACKGROUND COLOR
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.heroBgColor || "#f4f4f4"}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, heroBgColor: e.target.value }))
                      }
                      className="w-10 h-10 rounded-none border border-neutral-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={config.heroBgColor}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, heroBgColor: e.target.value }))
                      }
                      className="w-28 px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    WATERMARK TEXT TINT
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.heroTextColor || "#000000"}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, heroTextColor: e.target.value }))
                      }
                      className="w-10 h-10 rounded-none border border-neutral-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={config.heroTextColor}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, heroTextColor: e.target.value }))
                      }
                      className="w-28 px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Live Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3 sticky top-28">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  HERO BANNER PREVIEW
                </span>
                <span className="font-mono text-[10px] text-neutral-400 uppercase">
                  {config.showHeroBanner ? "ENABLED" : "HIDDEN"}
                </span>
              </div>

              {config.showHeroBanner ? (
                <div
                  style={{ backgroundColor: config.heroBgColor || "#f4f4f4" }}
                  className="relative h-64 rounded-none border border-neutral-200 overflow-hidden flex flex-col justify-end items-center"
                >
                  <span
                    style={{ color: config.heroTextColor ? `${config.heroTextColor}26` : undefined }}
                    className="font-display text-5xl uppercase tracking-tighter text-black/15 select-none translate-y-3 font-bold"
                  >
                    {config.heroBannerText || "DRAPZA"}
                  </span>
                  {config.heroBannerImage && (
                    <img
                      src={config.heroBannerImage}
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                    />
                  )}
                </div>
              ) : (
                <div className="h-44 rounded-none border border-dashed border-neutral-200 flex items-center justify-center font-mono text-xs text-neutral-400">
                  Banner is currently hidden
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-SECTION 2: VIP DISPATCH NEWSLETTER CARD ─── */}
      {activeSubSection === "newsletter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-mono text-sm font-bold uppercase text-black">
                    VIP DISPATCH SIGNAL CARD
                  </h3>
                  <p className="font-mono text-xs text-neutral-500">
                    The floating card for subscribers and newsletter drops
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showNewsletterCard}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showNewsletterCard: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* Top Tag */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  TOP TAGLINE
                </label>
                <input
                  type="text"
                  value={config.newsletterTag}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, newsletterTag: e.target.value }))
                  }
                  placeholder="[ DISPATCH SIGNAL ]"
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>

              {/* Heading 3 Lines */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                    HEADING LINE 1
                  </label>
                  <input
                    type="text"
                    value={config.newsletterHeadingLine1}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterHeadingLine1: e.target.value }))
                    }
                    placeholder="TRANSMIT"
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                    HEADING LINE 2
                  </label>
                  <input
                    type="text"
                    value={config.newsletterHeadingLine2}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterHeadingLine2: e.target.value }))
                    }
                    placeholder="UPDATES, NOT"
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                    HEADING LINE 3
                  </label>
                  <input
                    type="text"
                    value={config.newsletterHeadingLine3}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterHeadingLine3: e.target.value }))
                    }
                    placeholder="NOISE."
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  DESCRIPTION COPY
                </label>
                <textarea
                  rows={2}
                  value={config.newsletterDescription}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, newsletterDescription: e.target.value }))
                  }
                  placeholder="You'll only hear from us when something built is worth showing."
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>

              {/* Input Placeholder & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    INPUT PLACEHOLDER
                  </label>
                  <input
                    type="text"
                    value={config.newsletterPlaceholder}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterPlaceholder: e.target.value }))
                    }
                    placeholder="ENTER SIGNAL ADDRESS"
                    className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                    BUTTON HELPER TEXT
                  </label>
                  <input
                    type="text"
                    value={config.newsletterButtonText}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterButtonText: e.target.value }))
                    }
                    placeholder="READY TO TRANSMIT"
                    className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
              </div>

              {/* Bottom Disclaimer & Card Background */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  BOTTOM DISCLAIMER NOTE
                </label>
                <input
                  type="text"
                  value={config.newsletterBottomText}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, newsletterBottomText: e.target.value }))
                  }
                  placeholder="NO MARKETING CYCLES. JUST RARE, CODED DISPATCHES."
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  CARD BACKGROUND COLOR
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.newsletterBgColor || "#0b0b0b"}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterBgColor: e.target.value }))
                    }
                    className="w-10 h-10 rounded-none border border-neutral-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={config.newsletterBgColor}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, newsletterBgColor: e.target.value }))
                    }
                    className="w-32 px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Live Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3 sticky top-28">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  CARD PREVIEW
                </span>
                <span className="font-mono text-[10px] text-neutral-400 uppercase">
                  {config.showNewsletterCard ? "ENABLED" : "HIDDEN"}
                </span>
              </div>

              {config.showNewsletterCard ? (
                <div
                  style={{ backgroundColor: config.newsletterBgColor || "#0b0b0b" }}
                  className="rounded-none p-6 text-white text-center space-y-3 border border-white/10 shadow-lg"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block font-semibold">
                    {config.newsletterTag}
                  </span>
                  <h4 className="font-display text-2xl uppercase font-light leading-none tracking-tight">
                    {config.newsletterHeadingLine1}
                    <br />
                    {config.newsletterHeadingLine2}
                    <br />
                    {config.newsletterHeadingLine3}
                  </h4>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    {config.newsletterDescription}
                  </p>
                  <div className="h-10 rounded-none bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono text-[11px] text-neutral-400 uppercase">
                    {config.newsletterPlaceholder}
                  </div>
                  <div className="w-10 h-10 rounded-none bg-white text-black font-bold mx-auto flex items-center justify-center text-xs">
                    ↗
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 border-t border-neutral-800 pt-3">
                    {config.newsletterBottomText}
                  </p>
                </div>
              ) : (
                <div className="h-44 rounded-none border border-dashed border-neutral-200 flex items-center justify-center font-mono text-xs text-neutral-400">
                  Newsletter Card is currently hidden
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-SECTION 3: COLUMNS & HOTLINE ─── */}
      {activeSubSection === "navigation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1: ROOT */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="font-mono text-xs font-bold uppercase text-black">
                COLUMN 1 (PRIMARY)
              </span>
              <button
                type="button"
                onClick={() => addLink(1)}
                className="px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white font-mono text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                ADD LINK
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                HEADER TITLE
              </label>
              <input
                type="text"
                value={config.col1Title || config.rootTitle || "Root"}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    col1Title: e.target.value,
                    rootTitle: e.target.value,
                  }))
                }
                placeholder="Root"
                className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase font-bold"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                LINKS ({(config.col1Links || config.rootLinks || []).length})
              </label>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {(config.col1Links || config.rootLinks || []).map((link, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-50 rounded-none border border-neutral-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(1, idx, "label", e.target.value)}
                        placeholder="Label"
                        className="w-1/2 px-2.5 py-1.5 rounded-none border border-neutral-300 bg-white font-mono text-xs uppercase font-semibold"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => updateLink(1, idx, "href", e.target.value)}
                        placeholder="/#target"
                        className="w-1/2 px-2.5 py-1.5 rounded-none border border-neutral-300 bg-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => deleteLink(1, idx)}
                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-mono uppercase text-neutral-600">
                        <input
                          type="checkbox"
                          checked={Boolean(link.isBespoke)}
                          onChange={(e) => updateLink(1, idx, "isBespoke", e.target.checked)}
                          className="rounded-none border-neutral-300 accent-black cursor-pointer"
                        />
                        <span>Bespoke Fitting Badge (Modal Trigger)</span>
                      </label>
                      {link.isBespoke && (
                        <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider font-mono">
                          Bespoke
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CONNECT FEED & SOCIAL CHANNELS */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-black block">
                  COLUMN 2 (CONNECT FEED & SOCIALS)
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  Controls social links & custom feeds in storefront footer
                </span>
              </div>
              <button
                type="button"
                onClick={() => addLink(2)}
                className="px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white font-mono text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                ADD LINK
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                HEADER TITLE
              </label>
              <input
                type="text"
                value={config.col2Title || config.connectTitle || "Connect Feed"}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    col2Title: e.target.value,
                    connectTitle: e.target.value,
                  }))
                }
                placeholder="Connect Feed"
                className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase font-bold"
              />
            </div>

            {/* Direct Social Media URLs */}
            <div className="space-y-2.5 pt-1 border-t border-neutral-100">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700">
                DIRECT SOCIAL CHANNELS
              </label>
              <div className="space-y-2">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-neutral-500 mb-0.5">FACEBOOK URL</span>
                  <input
                    type="text"
                    value={config.facebookUrl || "https://www.facebook.com/"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                    placeholder="https://www.facebook.com/"
                    className="w-full px-2.5 py-1.5 rounded-none border border-neutral-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-neutral-500 mb-0.5">INSTAGRAM URL</span>
                  <input
                    type="text"
                    value={config.instagramUrl || "https://www.instagram.com/"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                    placeholder="https://www.instagram.com/"
                    className="w-full px-2.5 py-1.5 rounded-none border border-neutral-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-neutral-500 mb-0.5">YOUTUBE URL</span>
                  <input
                    type="text"
                    value={config.youtubeUrl || "https://www.youtube.com/"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/"
                    className="w-full px-2.5 py-1.5 rounded-none border border-neutral-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                CUSTOM FEED LINKS ({(config.col2Links || []).length})
              </label>
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {(config.col2Links || []).map((link, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-50 rounded-none border border-neutral-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(2, idx, "label", e.target.value)}
                        placeholder="Label"
                        className="w-1/2 px-2.5 py-1.5 rounded-none border border-neutral-300 bg-white font-mono text-xs uppercase font-semibold"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => updateLink(2, idx, "href", e.target.value)}
                        placeholder="https://..."
                        className="w-1/2 px-2.5 py-1.5 rounded-none border border-neutral-300 bg-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => deleteLink(2, idx)}
                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: HOTLINE, WHATSAPP & PHYSICAL STUDIO ADDRESS */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <span className="font-mono text-xs font-bold uppercase text-black">
                COLUMN 3 (OPEN LINE & ATELIER DESK)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                HEADER TITLE
              </label>
              <input
                type="text"
                value={config.col3Title || config.openLineTitle || "Open Line"}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    col3Title: e.target.value,
                    openLineTitle: e.target.value,
                  }))
                }
                placeholder="Open Line"
                className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase font-bold"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  TELEPHONE HOTLINE
                </label>
                <input
                  type="text"
                  value={config.phone || "+91 8888333038"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 8888333038"
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs font-semibold"
                />
              </div>

              {/* 3 Physical Address Lines */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  STUDIO ADDRESS (3 LINES)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={config.addressLine1 || "Unit 07, Sector N"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        addressLine1: e.target.value,
                        addressText: `${e.target.value}\n${prev.addressLine2 || "Layer 2, South Terminal"}\n${prev.addressLine3 || "System 021, Earth"}`,
                      }))
                    }
                    placeholder="Address Line 1 (e.g. Unit 07, Sector N)"
                    className="w-full px-3 py-1.5 rounded-none border border-neutral-200 font-mono text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={config.addressLine2 || "Layer 2, South Terminal"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        addressLine2: e.target.value,
                        addressText: `${prev.addressLine1 || "Unit 07, Sector N"}\n${e.target.value}\n${prev.addressLine3 || "System 021, Earth"}`,
                      }))
                    }
                    placeholder="Address Line 2 (e.g. Layer 2, South Terminal)"
                    className="w-full px-3 py-1.5 rounded-none border border-neutral-200 font-mono text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={config.addressLine3 || "System 021, Earth"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        addressLine3: e.target.value,
                        addressText: `${prev.addressLine1 || "Unit 07, Sector N"}\n${prev.addressLine2 || "Layer 2, South Terminal"}\n${e.target.value}`,
                      }))
                    }
                    placeholder="Address Line 3 (e.g. System 021, Earth)"
                    className="w-full px-3 py-1.5 rounded-none border border-neutral-200 font-mono text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  WHATSAPP NUMBER
                </label>
                <input
                  type="text"
                  value={config.whatsapp || "+91 8888333038"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, whatsapp: e.target.value }))
                  }
                  placeholder="+91 8888333038"
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs font-semibold"
                />
              </div>

              {/* TERMS & CONDITIONS LINK CONFIGURATION */}
              <div className="pt-3 border-t border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="block font-mono text-[11px] font-bold uppercase text-neutral-800">
                      TERMS & CONDITIONS OPTION
                    </span>
                    <p className="font-mono text-[10px] text-neutral-500">
                      Show link under Open Line & Hotline
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showTermsLink ?? true}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showTermsLink: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] font-bold uppercase text-neutral-600">
                      LINK LABEL
                    </label>
                    <input
                      type="text"
                      value={config.termsLinkText ?? "TERMS & CONDITIONS"}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, termsLinkText: e.target.value }))
                      }
                      placeholder="TERMS & CONDITIONS"
                      className="w-full px-3 py-1.5 rounded-none border border-neutral-200 font-mono text-xs uppercase font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] font-bold uppercase text-neutral-600">
                      DESTINATION ROUTE
                    </label>
                    <input
                      type="text"
                      value={config.termsLinkHref ?? "/terms"}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, termsLinkHref: e.target.value }))
                      }
                      placeholder="/terms"
                      className="w-full px-3 py-1.5 rounded-none border border-neutral-200 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-SECTION 4: BRAND LOGO & COPYRIGHT ─── */}
      {activeSubSection === "brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="font-mono text-sm font-bold uppercase text-black">
                  BRAND LOGO & LEGAL BOTTOM BAR
                </h3>
                <p className="font-mono text-xs text-neutral-500">
                  Main brand display typography, copyright notice, studio label, and admin entry point
                </p>
              </div>

              {/* Brand Logo Text */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  GIANT BRAND LOGO TYPOGRAPHY
                </label>
                <input
                  type="text"
                  value={config.brandLogoText || "DRAPZA"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, brandLogoText: e.target.value }))
                  }
                  placeholder="DRAPZA"
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-sm uppercase font-bold focus:outline-none focus:border-black focus:bg-white"
                />
                <span className="text-[11px] font-mono text-neutral-400">
                  Displayed as the giant brand typography above the copyright row.
                </span>
              </div>

              {/* Copyright Text */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  COPYRIGHT NOTICE STRING
                </label>
                <input
                  type="text"
                  value={config.copyrightText || "©2025 All modules reserved."}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, copyrightText: e.target.value }))
                  }
                  placeholder="©2025 All modules reserved."
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              {/* Studio Label */}
              <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                  STUDIO LABEL / COPYRIGHT SUB-TEXT
                </label>
                <input
                  type="text"
                  value={config.studioLabel || "Drapza Studio"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, studioLabel: e.target.value }))
                  }
                  placeholder="Drapza Studio"
                  className="w-full px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              {/* Admin Link Controls */}
              <div className="pt-3 border-t border-neutral-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
                      SHOW ADMIN CONTROL LINK
                    </label>
                    <p className="font-mono text-xs text-neutral-400">
                      Bottom right link for direct access to the Atelier Control Center
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showAdminLink}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showAdminLink: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                {config.showAdminLink && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                        LINK LABEL
                      </label>
                      <input
                        type="text"
                        value={config.adminLinkText}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, adminLinkText: e.target.value }))
                        }
                        placeholder="[ ATELIER ADMIN CONTROL ]"
                        className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600">
                        DESTINATION URL
                      </label>
                      <input
                        type="text"
                        value={config.adminLinkHref}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, adminLinkHref: e.target.value }))
                        }
                        placeholder="/admin"
                        className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Brand Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-4 sticky top-28">
              <span className="font-mono text-xs font-bold uppercase text-neutral-700 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                BOTTOM BAR PREVIEW
              </span>

              <div className="bg-neutral-100 rounded-none p-5 space-y-4">
                <span className="block font-body text-4xl leading-none text-black font-thin uppercase tracking-tight">
                  {config.brandLogoText || "DRAPZA"}
                </span>

                <div className="border-t border-neutral-300 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-neutral-600 uppercase">
                    {config.copyrightText}
                  </span>
                  {config.showAdminLink && (
                    <span className="font-mono text-[10px] text-neutral-800 font-bold uppercase underline">
                      {config.adminLinkText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
