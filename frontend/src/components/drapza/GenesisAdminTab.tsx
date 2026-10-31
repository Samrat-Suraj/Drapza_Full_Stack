"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  ExternalLink,
  Layers,
  Eye,
  RefreshCw,
  Check,
  Sparkles,
  FileText,
  Sliders,
  Type,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Terminal,
} from "lucide-react";
import { genesisApi, GenesisConfigData, DEFAULT_GENESIS_CONFIG } from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

interface GenesisAdminTabProps {
  initialConfig?: GenesisConfigData;
  onSaveSuccess?: () => void;
}

export const GenesisAdminTab: React.FC<GenesisAdminTabProps> = ({
  initialConfig,
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<GenesisConfigData>(
    initialConfig || DEFAULT_GENESIS_CONFIG
  );
  const [activeSubTab, setActiveSubTab] = useState<
    "hero" | "about" | "matrix" | "textblock" | "settings"
  >("hero");

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
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
      genesisApi
        .getConfig()
        .then((res: any) => {
          if (isMounted && res) {
            const data = res.data || res;
            if (data && data.hero) {
              setConfig(data as GenesisConfigData);
            }
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [initialConfig]);

  // Temporary status notification auto-clear
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    audioSystem.playClick(850);

    try {
      const res = await genesisApi.updateConfig(config);
      if (res && (res.success || res.hero)) {
        audioSystem.playSuccess();
        setStatusMessage({
          type: "success",
          text: "Genesis Architecture configuration published live to storefront.",
        });
        if (onSaveSuccess) onSaveSuccess();
      } else {
        throw new Error(res?.message || "Failed to update Genesis configuration.");
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
        "Are you sure you want to reset the Genesis page to factory defaults? All manual edits will be reverted."
      )
    ) {
      return;
    }
    setIsResetting(true);
    setStatusMessage(null);
    audioSystem.playClick(600);

    try {
      const res: any = await genesisApi.resetConfig();
      if (res) {
        const data = res.data || res;
        setConfig(data?.hero ? (data as GenesisConfigData) : DEFAULT_GENESIS_CONFIG);
        audioSystem.playSuccess();
        setStatusMessage({
          type: "success",
          text: "Genesis page reset to factory defaults successfully.",
        });
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err: any) {
      audioSystem.playError();
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to reset Genesis configuration.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (
    file: File,
    targetKey: string,
    colIndex?: number,
    rowIndex?: number
  ) => {
    setIsUploading(targetKey);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await genesisApi.uploadImage(base64);
        if (res && res.success && res.url) {
          audioSystem.playSuccess();
          if (colIndex !== undefined && rowIndex !== undefined) {
            const colKey = `col${colIndex}` as keyof typeof config.spotlightMatrix;
            const updatedCol = [...(config.spotlightMatrix[colKey] || [])];
            updatedCol[rowIndex] = res.url;
            setConfig((prev) => ({
              ...prev,
              spotlightMatrix: {
                ...prev.spotlightMatrix,
                [colKey]: updatedCol,
              },
            }));
          } else if (targetKey === "hero.image") {
            setConfig((prev) => ({
              ...prev,
              hero: { ...prev.hero, image: res.url },
            }));
          }
          setStatusMessage({
            type: "success",
            text: "Image uploaded and applied successfully.",
          });
        }
      } catch (err: any) {
        audioSystem.playError();
        setStatusMessage({
          type: "error",
          text: err?.message || "Image upload failed.",
        });
      } finally {
        setIsUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Update matrix cell
  const handleMatrixChange = (
    colNum: number,
    rowNum: number,
    val: string
  ) => {
    const colKey = `col${colNum}` as keyof typeof config.spotlightMatrix;
    const current = [...(config.spotlightMatrix[colKey] || [])];
    current[rowNum] = val;
    setConfig((prev) => ({
      ...prev,
      spotlightMatrix: {
        ...prev.spotlightMatrix,
        [colKey]: current,
      },
    }));
  };

  // Copy line handlers for arrays
  const handleArrayLineChange = (
    section: "copyBlock1" | "copyBlock2" | "metaLines",
    idx: number,
    val: string
  ) => {
    setConfig((prev) => {
      const updated = [...(prev.hero[section] || [])];
      updated[idx] = val;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          [section]: updated,
        },
      };
    });
  };

  const handleAddArrayLine = (
    section: "copyBlock1" | "copyBlock2" | "metaLines"
  ) => {
    setConfig((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [section]: [...(prev.hero[section] || []), "New telemetry signal line."],
      },
    }));
  };

  const handleRemoveArrayLine = (
    section: "copyBlock1" | "copyBlock2" | "metaLines",
    idx: number
  ) => {
    setConfig((prev) => {
      const updated = [...(prev.hero[section] || [])];
      updated.splice(idx, 1);
      return {
        ...prev,
        hero: {
          ...prev.hero,
          [section]: updated,
        },
      };
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* ================= ATELIER COMMAND STRIP ================= */}
      <div className="p-5 bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <span>GENESIS ARCHITECTURE & NARRATIVE CMS</span>
            </h2>
            <span
              className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                config.isEnabled
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {config.isEnabled ? "LIVE STOREFRONT" : "OFFLINE / DRAFT"}
            </span>
          </div>
          <p className="text-neutral-500 text-[11px] mt-1 font-sans">
            Full administrative control over the Genesis origin page: spotlight zoom matrix (15 shots), hero visual, manifestos, editorial narrative, and telemetry.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/genesis"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Inspect current live Genesis page in a new window"
          >
            <span>LIVE VIEW</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Revert Genesis page to default factory assets and typography"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`}
            />
            <span>RESET</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || isResetting}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Commit changes and sync to storefront immediately"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Save className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isSaving ? "PUBLISHING..." : "PUBLISH LIVE"}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
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

      {/* ================= SUB-NAVIGATION TABS ================= */}
      <div className="flex items-center gap-1 border-b border-neutral-300 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "hero", label: "HERO & VISUAL SIGNAL", icon: Compass },
          { id: "about", label: "ABOUT MANIFESTO", icon: Type },
          { id: "matrix", label: "SPOTLIGHT ZOOM MATRIX (15 SHOTS)", icon: Maximize2 },
          { id: "textblock", label: "EDITORIAL TEXTBLOCK", icon: FileText },
          { id: "settings", label: "PAGE TELEMETRY & CONTROLS", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioSystem.playClick(900);
                setActiveSubTab(tab.id as any);
              }}
              className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-1 ${
                isActive
                  ? "border-black text-black bg-white shadow-xs"
                  : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= SUB-TAB 1: HERO & SIGNAL ================= */}
      {activeSubTab === "hero" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Form Inputs */}
            <div className="lg:col-span-7 bg-white p-6 border border-neutral-200 shadow-sm space-y-5">
              <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>HERO VISUAL & TELEMETRY HEADLINES</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  [ SECTION 01 // HERO ]
                </span>
              </div>

              {/* Hero Image Asset */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                  <span>Hero Background Image</span>
                  <span className="text-[10px] text-neutral-400">
                    Recommended: 1920x1080 Aspect
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.hero.image}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, image: e.target.value },
                      }))
                    }
                    placeholder="/genesis/hero.jpg or https://..."
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none transition-colors"
                  />
                  <label className="px-3 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading === "hero.image" ? "UPLOADING..." : "UPLOAD"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "hero.image");
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Main Headline Title
                </label>
                <input
                  type="text"
                  value={config.hero.headline}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, headline: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none transition-colors font-bold text-black"
                />
              </div>

              {/* System Code Tag */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-neutral-500" />
                  <span>System Spec Code (Meta Tag)</span>
                </label>
                <input
                  type="text"
                  value={config.hero.systemCode}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, systemCode: e.target.value },
                    }))
                  }
                  placeholder="[ SYS/DRAPZA/0001 ]"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none transition-colors text-black"
                />
              </div>

              {/* Copy Block 1 (Flicker Text Lines) */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Signal Copy Block 1 (Flicker Lines)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddArrayLine("copyBlock1")}
                    className="text-[10px] font-bold text-black hover:underline cursor-pointer"
                  >
                    + ADD LINE
                  </button>
                </div>
                <div className="space-y-2">
                  {config.hero.copyBlock1.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-neutral-400 font-mono w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={line}
                        onChange={(e) =>
                          handleArrayLineChange("copyBlock1", idx, e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayLine("copyBlock1", idx)}
                        className="px-2 py-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Block 2 (Sub-Signal Lines) */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Future Form Block 2 (Lines)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddArrayLine("copyBlock2")}
                    className="text-[10px] font-bold text-black hover:underline cursor-pointer"
                  >
                    + ADD LINE
                  </button>
                </div>
                <div className="space-y-2">
                  {config.hero.copyBlock2.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-neutral-400 font-mono w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={line}
                        onChange={(e) =>
                          handleArrayLineChange("copyBlock2", idx, e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayLine("copyBlock2", idx)}
                        className="px-2 py-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta Lines Block */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Silhouette Study Meta Lines</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddArrayLine("metaLines")}
                    className="text-[10px] font-bold text-black hover:underline cursor-pointer"
                  >
                    + ADD LINE
                  </button>
                </div>
                <div className="space-y-2">
                  {config.hero.metaLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-neutral-400 font-mono w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={line}
                        onChange={(e) =>
                          handleArrayLineChange("metaLines", idx, e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayLine("metaLines", idx)}
                        className="px-2 py-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Visual Preview */}
            <div className="lg:col-span-5 bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
              <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>1:1 HERO TELEMETRY PREVIEW</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                  ACTIVE SYNC
                </span>
              </div>

              {/* Visual Card */}
              <div className="relative w-full aspect-[4/3] bg-black overflow-hidden border border-neutral-800 flex flex-col justify-between p-4 text-[#edf1e8]">
                {config.hero.image && (
                  <img
                    src={normalizeImageUrl(config.hero.image)}
                    alt="Hero Preview"
                    onError={handleImageFallbackError}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 pointer-events-none" />

                <div className="relative z-10 space-y-2">
                  <div className="text-[10px] font-mono tracking-widest text-[#edf1e8]/75 space-y-0.5">
                    {config.hero.copyBlock1.map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono tracking-widest text-[#edf1e8]/75 space-y-0.5 pt-1">
                    {config.hero.copyBlock2.map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 space-y-2 mt-auto">
                  <h3 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-[#edf1e8] line-clamp-2">
                    {config.hero.headline}
                  </h3>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#edf1e8]/60 pt-2 border-t border-white/20">
                    <span>{config.hero.metaLines[0] || "Framework"}</span>
                    <span className="font-bold text-[#edf1e8]">{config.hero.systemCode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: ABOUT MANIFESTO ================= */}
      {activeSubTab === "about" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-6">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>GENESIS ABOUT MANIFESTO & LOGO ARCHITECTURE</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                [ SECTION 02 // ABOUT TRANSMISSION ]
              </span>
            </div>

            {/* Logo Tint Input */}
            <div className="space-y-2 max-w-sm">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span>Genesis Digifox Symbol Fill Color</span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Hex format (#0f0f0f)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.about.logoFill || "#0f0f0f"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, logoFill: e.target.value },
                    }))
                  }
                  className="w-10 h-10 p-0 border border-neutral-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.about.logoFill}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, logoFill: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
                />
              </div>
            </div>

            {/* Paragraph 1 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Manifesto Statement 01 (Intention & Silence)
              </label>
              <textarea
                rows={4}
                value={config.about.paragraph1}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, paragraph1: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Paragraph 2 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Manifesto Statement 02 (Transmission & Physical Layers)
              </label>
              <textarea
                rows={4}
                value={config.about.paragraph2}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, paragraph2: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none transition-colors leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: SPOTLIGHT ZOOM MATRIX (15 SHOTS) ================= */}
      {activeSubTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-4">
            <div className="border-b border-neutral-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  <span>5-COLUMN INTERACTIVE ZOOM MATRIX (15 ASSETS)</span>
                </span>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  Controls the full-screen dynamic scrub zoom matrix. Column 3, Row 2 (Shot 5) is the primary center zoom focus target.
                </p>
              </div>
              <span className="text-[10px] text-black bg-neutral-100 border border-neutral-300 px-2 py-1 font-mono font-bold self-start sm:self-auto">
                GSAP SCRUB 600VH TRIGGER
              </span>
            </div>

            {/* Matrix Visual Grid (5 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {[1, 2, 3, 4, 5].map((colNum) => {
                const colKey = `col${colNum}` as keyof typeof config.spotlightMatrix;
                const images = config.spotlightMatrix[colKey] || [];
                const isCenterCol = colNum === 3;

                return (
                  <div
                    key={colNum}
                    className={`p-3 border space-y-4 ${
                      isCenterCol
                        ? "bg-neutral-50 border-black shadow-sm ring-1 ring-black"
                        : "bg-white border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-black flex items-center gap-1.5">
                        <span>COL 0{colNum}</span>
                        {isCenterCol && (
                          <span className="px-1.5 py-0.2 bg-black text-white text-[8px] font-bold">
                            CENTER FOCUS
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        3 SHOTS
                      </span>
                    </div>

                    {/* 3 Images per column */}
                    {[0, 1, 2].map((rowNum) => {
                      const imgUrl = images[rowNum] || "";
                      const isMainZoomTarget = isCenterCol && rowNum === 1;
                      const slotId = `matrix-c${colNum}-r${rowNum}`;

                      return (
                        <div
                          key={rowNum}
                          className={`p-2.5 border space-y-2 ${
                            isMainZoomTarget
                              ? "bg-neutral-100 border-black ring-1 ring-black"
                              : "bg-neutral-50/50 border-neutral-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-600">
                              Shot 0{colNum}.0{rowNum + 1}
                              {isMainZoomTarget && (
                                <span className="ml-1 text-black font-extrabold uppercase text-[8.5px]">
                                  ★ MAIN FOCUS
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-mono">
                              {imgUrl.slice(-14)}
                            </span>
                          </div>

                          {/* Thumbnail Preview */}
                          <div className="relative w-full aspect-video bg-neutral-200 overflow-hidden border border-neutral-300">
                            {imgUrl ? (
                              <img
                                src={normalizeImageUrl(imgUrl)}
                                alt=""
                                onError={handleImageFallbackError}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                                Empty Slot
                              </div>
                            )}
                          </div>

                          {/* Image Path input */}
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) =>
                              handleMatrixChange(colNum, rowNum, e.target.value)
                            }
                            placeholder="/spotlight/img.jpg"
                            className="w-full px-2 py-1 bg-white border border-neutral-300 font-mono text-[10px] focus:border-black outline-none"
                          />

                          {/* Upload button for this cell */}
                          <label className="w-full py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[9.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>
                              {isUploading === slotId ? "UPLOADING..." : "UPLOAD"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleFileUpload(file, slotId, colNum, rowNum);
                              }}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: EDITORIAL TEXTBLOCK ================= */}
      {activeSubTab === "textblock" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-6">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>NARRATIVE EDITORIAL TEXTBLOCK</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                [ SECTION 03 // TEXTBLOCK ]
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Editorial Heading (Left Column)
              </label>
              <input
                type="text"
                value={config.textBlock.heading}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    textBlock: { ...prev.textBlock, heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold text-black"
              />
            </div>

            {/* Logo fill */}
            <div className="space-y-2 max-w-sm">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
                <span>TextBlock Digifox Symbol Fill</span>
                <span className="text-[10px] text-neutral-400 font-mono">Default: #edf1e8</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.textBlock.logoFill || "#edf1e8"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      textBlock: { ...prev.textBlock, logoFill: e.target.value },
                    }))
                  }
                  className="w-10 h-10 p-0 border border-neutral-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.textBlock.logoFill}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      textBlock: { ...prev.textBlock, logoFill: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none"
                />
              </div>
            </div>

            {/* Paragraph 1 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Right Column Copy Block 1 (Quiet Tension)
              </label>
              <textarea
                rows={3}
                value={config.textBlock.paragraph1}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    textBlock: { ...prev.textBlock, paragraph1: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none leading-relaxed"
              />
            </div>

            {/* Paragraph 2 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Right Column Copy Block 2 (No Ornament)
              </label>
              <textarea
                rows={3}
                value={config.textBlock.paragraph2}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    textBlock: { ...prev.textBlock, paragraph2: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: SETTINGS & VISIBILITY ================= */}
      {activeSubTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 shadow-sm space-y-6">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>PAGE SEO METADATA & TELEMETRY TOGGLES</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                [ GOVERNANCE & SWITCHES ]
              </span>
            </div>

            {/* Global Page Enabled Switch */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="font-bold text-xs uppercase text-black">
                  Genesis Page Master Switch
                </h4>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  When enabled, the Genesis page is live at /genesis.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
                }
                className={`px-4 py-2 text-xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                  config.isEnabled
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-500 border-neutral-300"
                }`}
              >
                {config.isEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            {/* SEO Title */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Page Document Title (SEO Tag)
              </label>
              <input
                type="text"
                value={config.pageTitle}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, pageTitle: e.target.value }))
                }
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:bg-white focus:border-black outline-none font-bold text-black"
              />
            </div>

            {/* SEO Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Page Meta Description
              </label>
              <textarea
                rows={2}
                value={config.pageDescription}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    pageDescription: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-sans text-xs focus:bg-white focus:border-black outline-none"
              />
            </div>

            {/* Component Visibility Switches */}
            <div className="space-y-3 pt-3 border-t border-neutral-200">
              <span className="font-bold uppercase tracking-wider text-black block">
                Component Visibility Controls
              </span>

              {/* Show Contact Form */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div>
                  <span className="font-bold text-xs text-neutral-800">
                    Signal Newsletter / Contact Form
                  </span>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Render the global Digifox ContactForm at the base of the page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        showContactForm: !prev.settings.showContactForm,
                      },
                    }))
                  }
                  className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    config.settings.showContactForm
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-500 border-neutral-300"
                  }`}
                >
                  {config.settings.showContactForm ? "VISIBLE" : "HIDDEN"}
                </button>
              </div>

              {/* Show Footer */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div>
                  <span className="font-bold text-xs text-neutral-800">
                    Storefront Architecture Footer
                  </span>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Render the global Atelier Footer component.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        showFooter: !prev.settings.showFooter,
                      },
                    }))
                  }
                  className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    config.settings.showFooter
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-500 border-neutral-300"
                  }`}
                >
                  {config.settings.showFooter ? "VISIBLE" : "HIDDEN"}
                </button>
              </div>

              {/* Show Spotlight Zoom */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-xs text-neutral-800">
                    GSAP Spotlight Zoom Matrix Section
                  </span>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Render the full-screen 5-column zoom preview and scrub whitespace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        showSpotlightZoom: !prev.settings.showSpotlightZoom,
                      },
                    }))
                  }
                  className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    config.settings.showSpotlightZoom
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-500 border-neutral-300"
                  }`}
                >
                  {config.settings.showSpotlightZoom ? "VISIBLE" : "HIDDEN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenesisAdminTab;
