"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Save,
  ExternalLink,
  Layers,
  Eye,
  RefreshCw,
  X,
  FileText,
  Tag,
  Check,
} from "lucide-react";
import { lookbookApi } from "@/lib/api";
import { LookbookConfigData, LookbookItemData } from "./LookbookSection";
import { audioSystem } from "./AudioSystem";
import { normalizeImageUrl, handleImageFallbackError } from "@/lib/imageUtils";

interface LookbookAdminTabProps {
  initialConfig?: LookbookConfigData;
  products?: any[];
  onSaveSuccess?: () => void;
}

const DEFAULT_LOOKBOOK_CONFIG: LookbookConfigData = {
  sectionTag: "[ ARCHIVAL LOOKBOOK • SS26 ]",
  headingLine1: "CAMPAIGN",
  headingLine2: "SILHOUETTES.",
  subtext: "Custom engineered architectural drape and technical silhouettes.",
  isEnabled: true,
  items: [
    {
      id: "01",
      title: "KANJIVARAM SILK SAREE",
      subtitle: "SILHOUETTE 01 • SAREE",
      image: "/images/drapza/products/product_18.png",
      tag: "CAMPAIGN LOOK #1",
      fabric: "100% Pure Mulberry Silk with Gold Zari",
      slug: "kanjivaram-pure-silk-saree",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
    {
      id: "02",
      title: "ANARKALI EMBROIDERED KURTI",
      subtitle: "SILHOUETTE 02 • KURTI",
      image: "/images/drapza/products/product_1.png",
      tag: "CAMPAIGN LOOK #2",
      fabric: "Pure Modal Silk with Potli Buttons",
      slug: "anarkali-embroidered-kurti",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
    {
      id: "03",
      title: "HIGH-WAIST RELAXED JEANS",
      subtitle: "SILHOUETTE 03 • JEANS",
      image: "/images/drapza/products/product_11.png",
      tag: "CAMPAIGN LOOK #3",
      fabric: "13.5 oz Organic Cotton Washed Denim",
      slug: "high-waist-relaxed-jeans",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
    {
      id: "04",
      title: "FLARED CHANDERI PALAZZO",
      subtitle: "SILHOUETTE 04 • PALAZZO/BOTTOM",
      image: "/images/drapza/products/product_4.png",
      tag: "CAMPAIGN LOOK #4",
      fabric: "Chanderi Silk-Cotton Blend",
      slug: "flared-pleated-palazzo",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
    {
      id: "05",
      title: "ORGANZA EMBROIDERED DUPATTA",
      subtitle: "SILHOUETTE 05 • DUPATTA",
      image: "/images/drapza/products/product_21.png",
      tag: "CAMPAIGN LOOK #5",
      fabric: "Sheer Organza with Resham Gota Lace",
      slug: "organza-embroidered-dupatta",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
    {
      id: "06",
      title: "FESTIVE SHARARA / LEHENGA SET",
      subtitle: "SILHOUETTE 06 • SHARARA/LEHENGA",
      image: "/images/drapza/products/product_6.png",
      tag: "CAMPAIGN LOOK #6",
      fabric: "Layered Georgette with Mirror-Work Embellishment",
      slug: "layered-georgette-sharara-lehenga",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    },
  ],
};

const PRESET_LOOKBOOK_IMAGES = [
  { label: "Kanjivaram Saree 01", url: "/images/drapza/products/product_18.png" },
  { label: "Embroidered Kurti 02", url: "/images/drapza/products/product_1.png" },
  { label: "Relaxed Denim 03", url: "/images/drapza/products/product_11.png" },
  { label: "Chanderi Palazzo 04", url: "/images/drapza/products/product_4.png" },
  { label: "Organza Dupatta 05", url: "/images/drapza/products/product_21.png" },
  { label: "Sharara Lehenga 06", url: "/images/drapza/products/product_6.png" },
];

export const LookbookAdminTab: React.FC<LookbookAdminTabProps> = ({
  initialConfig,
  products = [],
  onSaveSuccess,
}) => {
  const [config, setConfig] = useState<LookbookConfigData>(
    initialConfig && initialConfig.items && initialConfig.items.length > 0
      ? initialConfig
      : DEFAULT_LOOKBOOK_CONFIG
  );
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig && initialConfig.items && initialConfig.items.length > 0) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const items = config.items || [];
  const activeItem: LookbookItemData | undefined = items[selectedIdx] || items[0];

  // Save Lookbook Config
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(850);

    try {
      const res = await lookbookApi.updateLookbookConfig(config);
      if (res && res.success) {
        setSaveStatus("✓ Campaign Silhouettes & Lookbook CMS synchronized and published live!");
        audioSystem.playSuccess();
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus(`✕ ${res?.message || "Failed to publish Lookbook configuration"}`);
      }
    } catch (err: any) {
      setSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all Campaign Silhouettes back to factory defaults?")) {
      return;
    }
    setIsResetting(true);
    setSaveStatus(null);
    audioSystem.playClick(400);

    try {
      const res = await lookbookApi.resetLookbookConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
        setSelectedIdx(0);
        setSaveStatus("✓ Lookbook section reset to factory default parameters.");
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Upload image to Cloudinary CDN
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;

    setIsUploadingImage(true);
    setSaveStatus(`Uploading Silhouette #${selectedIdx + 1} artwork to Cloudinary CDN...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await lookbookApi.uploadLookbookImage(base64);
        if (res && res.success && res.url) {
          setConfig((prev) => {
            const nextItems = [...(prev.items || [])];
            nextItems[selectedIdx] = { ...nextItems[selectedIdx], image: res.url };
            return { ...prev, items: nextItems };
          });
          setSaveStatus(`✓ Silhouette #${selectedIdx + 1} artwork uploaded to Cloudinary! Click 'Publish' to sync live.`);
          audioSystem.playSuccess();
          setTimeout(() => setSaveStatus(null), 6000);
        } else {
          setSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingImage(false);
    }
  };

  // Add new card
  const handleAddCard = () => {
    const nextNum = items.length + 1;
    const idStr = String(nextNum).padStart(2, "0");
    const newCard: LookbookItemData = {
      id: idStr,
      title: `NEW ARCHETYPE SILHOUETTE ${idStr}`,
      subtitle: `SILHOUETTE ${idStr} • EDITORIAL`,
      image: "/images/drapza/products/product_1.png",
      tag: `CAMPAIGN LOOK #${nextNum}`,
      fabric: "High-density tailored architectural textile",
      slug: "new-garment-silhouette",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    };

    setConfig((prev) => ({
      ...prev,
      items: [...(prev.items || []), newCard],
    }));
    setSelectedIdx(items.length);
    audioSystem.playClick(900);
  };

  // Delete card
  const handleDeleteCard = (idx: number) => {
    if (items.length <= 1) {
      alert("At least one campaign silhouette card is required.");
      return;
    }
    const target = items[idx];
    if (!window.confirm(`Delete Lookbook Silhouette #${idx + 1} (${target?.title || "Untitled"})?`)) return;

    setConfig((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== idx),
    }));
    if (selectedIdx >= idx && selectedIdx > 0) {
      setSelectedIdx((prev) => prev - 1);
    }
    audioSystem.playClick(300);
  };

  // Move card
  const handleMoveCard = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    setConfig((prev) => {
      const nextItems = [...(prev.items || [])];
      const temp = nextItems[idx];
      nextItems[idx] = nextItems[targetIdx];
      nextItems[targetIdx] = temp;
      return { ...prev, items: nextItems };
    });
    setSelectedIdx(targetIdx);
    audioSystem.playClick(750);
  };

  // Update card field
  const handleUpdateActiveCard = (field: keyof LookbookItemData, value: any) => {
    setConfig((prev) => {
      const nextItems = [...(prev.items || [])];
      if (nextItems[selectedIdx]) {
        nextItems[selectedIdx] = {
          ...nextItems[selectedIdx],
          [field]: value,
        };
      }
      return { ...prev, items: nextItems };
    });
  };

  // Auto-fill from Catalog Product
  const handleAutoFill = (productId: string) => {
    const p = products.find((prod) => prod._id === productId || prod.id === productId);
    if (!p || !activeItem) return;

    const categoryUpper = (p.category || "GARMENT").toUpperCase();
    const lookNum = selectedIdx + 1;

    setConfig((prev) => {
      const nextItems = [...(prev.items || [])];
      nextItems[selectedIdx] = {
        ...nextItems[selectedIdx],
        title: p.name.toUpperCase(),
        subtitle: `SILHOUETTE 0${lookNum} • ${categoryUpper}`,
        image: p.images?.[0] || nextItems[selectedIdx].image,
        fabric: p.fabric || p.weight || p.blend || "100% High-Density Architectural Textile",
        slug: p.slug || p._id || p.id,
        tag: `CAMPAIGN LOOK #${lookNum}`,
      };
      return { ...prev, items: nextItems };
    });
    audioSystem.playSuccess();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-neutral-200 shadow-sm">
        <div>
          <h3 className="text-base font-bold font-mono uppercase text-black tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-black" />
            <span>CAMPAIGN ARCHIVAL CMS • SILHOUETTES & DROPS</span>
          </h3>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Configure the storefront horizontal sliding editorial lookbook showcase. Manage campaign archetypes, materials, and Cloudinary assets.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 border border-neutral-300 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            type="button"
            onClick={handleAddCard}
            className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>ADD SILHOUETTE CARD</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            )}
            <span>PUBLISH LIVE LOOKBOOK</span>
          </button>
        </div>
      </div>

      {/* Save / Error Notification */}
      {saveStatus && (
        <div
          className={`p-4 font-mono text-xs border flex items-center justify-between shadow-sm ${
            saveStatus.startsWith("✓")
              ? "bg-black text-white font-bold border-black"
              : "bg-neutral-100 border-neutral-300 text-black"
          }`}
        >
          <span>{saveStatus}</span>
          <button onClick={() => setSaveStatus(null)} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Global Section Configuration Strip */}
      <div className="bg-white border border-neutral-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <span className="font-mono text-xs font-bold uppercase text-black tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>STOREFRONT SECTION ARCHITECTURE</span>
          </span>
          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold uppercase">
            <span>SHOW ON STOREFRONT:</span>
            <input
              type="checkbox"
              checked={config.isEnabled !== false}
              onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
              className="accent-black w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
              Section Tag / Super-title
            </label>
            <input
              type="text"
              value={config.sectionTag || ""}
              onChange={(e) => setConfig({ ...config, sectionTag: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
              placeholder="[ ARCHIVAL LOOKBOOK • SS26 ]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
              Headline Line 1
            </label>
            <input
              type="text"
              value={config.headingLine1 || ""}
              onChange={(e) => setConfig({ ...config, headingLine1: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
              placeholder="CAMPAIGN"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
              Headline Line 2
            </label>
            <input
              type="text"
              value={config.headingLine2 || ""}
              onChange={(e) => setConfig({ ...config, headingLine2: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
              placeholder="SILHOUETTES."
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
              Editorial Subtext
            </label>
            <input
              type="text"
              value={config.subtext || ""}
              onChange={(e) => setConfig({ ...config, subtext: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
              placeholder="Custom engineered architectural drape..."
            />
          </div>
        </div>
      </div>

      {/* 3. Horizontal Reordering & Card Selection Carousel Strip */}
      <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase text-neutral-700">
            SILHOUETTE CARDS ({items.length} ACTIVE IN ROTATION)
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            Click any card to edit details below
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex-shrink-0 w-60 border p-3 transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-black text-white border-black shadow-md scale-[1.02]"
                    : "bg-white text-black border-neutral-300 hover:border-black"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? "text-neutral-300" : "text-neutral-500"
                    }`}
                  >
                    #{idx + 1} • {item.tag || "LOOK"}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleMoveCard(idx, "up")}
                      disabled={idx === 0}
                      title="Move Left/Earlier"
                      className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCard(idx, "down")}
                      disabled={idx === items.length - 1}
                      title="Move Right/Later"
                      className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      title="Delete Silhouette"
                      className="p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 bg-neutral-100 flex-shrink-0 border border-neutral-300 overflow-hidden">
                    <img
                      src={normalizeImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={handleImageFallbackError}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-mono text-xs font-bold truncate uppercase">{item.title || "Untitled"}</p>
                    <p
                      className={`text-[10px] font-mono truncate ${
                        isSelected ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      {item.subtitle || "No subtitle"}
                    </p>
                    <p className="text-[9px] font-mono text-emerald-400 mt-0.5">{item.edition}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Card Detail Editor & Live Preview Split Pane */}
      {activeItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Form Editor (7 Columns) */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-mono text-xs font-bold uppercase text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                <span>SILHOUETTE CARD #{selectedIdx + 1} PARAMETERS</span>
              </span>
              {products.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Auto-fill:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAutoFill(e.target.value);
                      e.target.value = "";
                    }}
                    className="bg-neutral-100 border border-neutral-300 text-[10px] font-mono uppercase p-1"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select Catalog Garment...
                    </option>
                    {products.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Card Identifier ID
                </label>
                <input
                  type="text"
                  value={activeItem.id}
                  onChange={(e) => handleUpdateActiveCard("id", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="01"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Campaign Ribbon Tag
                </label>
                <input
                  type="text"
                  value={activeItem.tag}
                  onChange={(e) => handleUpdateActiveCard("tag", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="CAMPAIGN LOOK #1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Silhouette Primary Title
                </label>
                <input
                  type="text"
                  value={activeItem.title}
                  onChange={(e) => handleUpdateActiveCard("title", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono font-bold text-black focus:border-black focus:outline-none"
                  placeholder="KANJIVARAM SILK SAREE"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Subtitle & Silhouette Category
                </label>
                <input
                  type="text"
                  value={activeItem.subtitle}
                  onChange={(e) => handleUpdateActiveCard("subtitle", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="SILHOUETTE 01 • SAREE"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Fabric & Material Engineering
                </label>
                <input
                  type="text"
                  value={activeItem.fabric}
                  onChange={(e) => handleUpdateActiveCard("fabric", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="100% Pure Mulberry Silk with Gold Zari"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Catalog Link Slug / Route
                </label>
                <input
                  type="text"
                  value={activeItem.slug}
                  onChange={(e) => handleUpdateActiveCard("slug", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="kanjivaram-pure-silk-saree"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Edition Label
                </label>
                <input
                  type="text"
                  value={activeItem.edition}
                  onChange={(e) => handleUpdateActiveCard("edition", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="EDITION 01 / 2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Status Tag
                </label>
                <input
                  type="text"
                  value={activeItem.statusTag || "IN ARCHIVE"}
                  onChange={(e) => handleUpdateActiveCard("statusTag", e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="IN ARCHIVE"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Active in Carousel
                </label>
                <div className="flex items-center gap-2 h-9">
                  <input
                    type="checkbox"
                    checked={activeItem.isActive !== false}
                    onChange={(e) => handleUpdateActiveCard("isActive", e.target.checked)}
                    className="accent-black w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-700">Display this card live</span>
                </div>
              </div>
            </div>

            {/* Image Upload & Presets */}
            <div className="border-t border-neutral-200 pt-4 space-y-3">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Silhouette Artwork (Cloudinary CDN or Local URL)
              </label>

              <div className="flex items-center gap-3">
                <label className="px-4 py-2 border border-black bg-black text-white hover:bg-neutral-800 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 shadow-sm">
                  {isUploadingImage ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingImage ? "UPLOADING TO CDN..." : "UPLOAD NEW ARTWORK"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={activeItem.image}
                  onChange={(e) => handleUpdateActiveCard("image", e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-300 p-2 text-xs font-mono text-black focus:border-black focus:outline-none"
                  placeholder="/images/drapza/products/product_18.png"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-neutral-500">Presets:</span>
                {PRESET_LOOKBOOK_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => handleUpdateActiveCard("image", preset.url)}
                    className={`px-2.5 py-1 text-[10px] font-mono border transition-all cursor-pointer ${
                      activeItem.image === preset.url
                        ? "bg-black text-white border-black font-bold"
                        : "bg-white text-neutral-600 border-neutral-300 hover:border-black"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Card 1:1 Preview (5 Columns) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-mono text-xs font-bold uppercase text-black flex items-center gap-2">
                <Eye className="w-4 h-4 text-black" />
                <span>LIVE STOREFRONT 1:1 CARD PREVIEW</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">[ NOIR ATELIER ]</span>
            </div>

            {/* The Actual Rendered Card */}
            <div className="relative w-full aspect-[3/4] bg-neutral-900 border border-neutral-800 text-white overflow-hidden shadow-xl flex flex-col justify-between p-6">
              {/* Background Artwork */}
              <img
                src={normalizeImageUrl(activeItem.image)}
                alt={activeItem.title}
                className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
                onError={handleImageFallbackError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none" />

              {/* Top Card Meta */}
              <div className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 border border-white/20">
                  {activeItem.tag || "CAMPAIGN LOOK"}
                </span>
                <span className="text-neutral-300">{activeItem.statusTag || "IN ARCHIVE"}</span>
              </div>

              {/* Bottom Card Meta & Typography */}
              <div className="relative z-10 space-y-2">
                <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                  {activeItem.subtitle || "SILHOUETTE"}
                </p>
                <h4 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white leading-tight">
                  {activeItem.title || "UNTITLED SILHOUETTE"}
                </h4>
                <p className="font-mono text-[11px] text-neutral-300 line-clamp-2">
                  {activeItem.fabric || "Custom engineered technical textile"}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/20 font-mono text-[10px]">
                  <span className="text-neutral-400">{activeItem.edition}</span>
                  <span className="underline underline-offset-4 text-white uppercase tracking-wider flex items-center gap-1">
                    EXPLORE GARMENT
                    <ExternalLink className="w-3 h-3 inline" />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 p-3 border border-neutral-200 text-center font-mono text-[11px] text-neutral-500">
              Direct live preview reflects active card #{selectedIdx + 1} as rendered in the storefront horizontal campaign loop.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

