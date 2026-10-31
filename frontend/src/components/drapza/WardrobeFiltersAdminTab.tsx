"use client";

import React, { useState } from "react";
import {
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  RotateCcw,
  Palette,
  Search,
  Layers,
  Tag,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";
import { filterConfigApi, FilterConfigData, ColorOptionData } from "@/lib/api";
import {
  WardrobeFilterSidebar,
  DEFAULT_FILTER_VALUES,
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_SIZE_OPTIONS,
  DEFAULT_COLOR_OPTIONS,
  DEFAULT_FABRIC_OPTIONS,
  DEFAULT_OCCASION_OPTIONS,
  DEFAULT_AVAILABILITY_OPTIONS,
} from "./WardrobeFilterSidebar";

interface WardrobeFiltersAdminTabProps {
  filterConfig: FilterConfigData;
  setFilterConfig: React.Dispatch<React.SetStateAction<FilterConfigData>>;
  onSaveSuccess?: () => void;
}

type FilterGroupKey =
  | "categories"
  | "sizes"
  | "colors"
  | "fabrics"
  | "occasions"
  | "availability";

const FILTER_GROUPS: {
  id: FilterGroupKey;
  label: string;
  description: string;
  placeholder: string;
  suggestions: string[];
}[] = [
  {
    id: "categories",
    label: "Categories",
    description: "Garment silhouettes and product types available for circulation.",
    placeholder: "e.g. Kurti, Saree, Jeans, Palazzo/Bottom, Co-ord Set...",
    suggestions: ["Kurti", "Saree", "Jeans", "Palazzo/Bottom", "Leggings", "Tops", "Dupatta", "Co-ord Set", "Panties", "Bra", "Sharara/Lehenga"],
  },
  {
    id: "sizes",
    label: "Sizes",
    description: "Sizing dimensions available on product detail cards.",
    placeholder: "e.g. 3XL, 28, 30, 32, Oversized...",
    suggestions: ["28", "30", "32", "34", "36", "3XL", "4XL", "Oversized Fit"],
  },
  {
    id: "colors",
    label: "Colors",
    description: "Luxury palette swatches with hex color codes.",
    placeholder: "e.g. Emerald Green, Midnight Indigo...",
    suggestions: ["Crimson Red", "Forest Green", "Sandstone Khaki", "Electric Cyan", "Rose Gold", "Onyx Black"],
  },
  {
    id: "fabrics",
    label: "Fabrics",
    description: "Artisanal textile blends and material specifications.",
    placeholder: "e.g. Japanese Denim, Merino Wool, Velvet...",
    suggestions: ["Japanese Raw Denim", "Merino Wool", "Cashmere Blend", "Supima Cotton", "Crushed Velvet"],
  },
  {
    id: "occasions",
    label: "Occasions",
    description: "Curated styling themes and wearing contexts.",
    placeholder: "e.g. Runway & Gala, Summer Resort...",
    suggestions: ["Runway & Gala", "Weekend Getaway", "Night Out", "Summer Resort", "Fitness & Active"],
  },
  {
    id: "availability",
    label: "Availability",
    description: "Inventory dispatch status criteria.",
    placeholder: "e.g. Pre-Order Only, Vault Exclusive...",
    suggestions: ["Pre-Order Only", "Vault Exclusive", "Ready to Ship in 24H", "Made to Order"],
  },
];

const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: "Crimson Red", hex: "#dc2626" },
  { label: "Emerald Green", hex: "#059669" },
  { label: "Midnight Blue", hex: "#1e3a8a" },
  { label: "Sand Beige", hex: "#d6c7b2" },
  { label: "Champagne Gold", hex: "#eab308" },
  { label: "Pure Violet", hex: "#7c3aed" },
  { label: "Obsidian Slate", hex: "#1e293b" },
  { label: "Raw Umber", hex: "#594a42" },
];

export function WardrobeFiltersAdminTab({
  filterConfig,
  setFilterConfig,
  onSaveSuccess,
}: WardrobeFiltersAdminTabProps) {
  const [activeGroup, setActiveGroup] = useState<FilterGroupKey>("categories");
  const [newOptionInput, setNewOptionInput] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeGroupMeta = FILTER_GROUPS.find((g) => g.id === activeGroup)!;

  // Add a new option
  const handleAddOption = (valueToAdd?: string) => {
    const rawVal = valueToAdd ?? newOptionInput;
    if (!rawVal || !rawVal.trim()) return;

    audioSystem.playClick(650);

    if (activeGroup === "colors") {
      const colorLabel = rawVal.trim();
      const exists = filterConfig.colors.some(
        (c) => c.label.toLowerCase() === colorLabel.toLowerCase()
      );
      if (exists) {
        setStatusMessage(`Color "${colorLabel}" already exists.`);
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }

      setFilterConfig((prev) => ({
        ...prev,
        colors: [...prev.colors, { label: colorLabel, hex: newColorHex }],
      }));
      setNewOptionInput("");
    } else {
      const trimmed = rawVal.trim();
      const currentList = (filterConfig[activeGroup] as string[]) || [];
      const exists = currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setStatusMessage(`"${trimmed}" already exists in ${activeGroupMeta.label}.`);
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }

      setFilterConfig((prev) => ({
        ...prev,
        [activeGroup]: [...currentList, trimmed],
      }));
      setNewOptionInput("");
    }
  };

  // Quick preset color addition
  const handleAddPresetColor = (preset: { label: string; hex: string }) => {
    audioSystem.playClick(700);
    const exists = filterConfig.colors.some(
      (c) => c.label.toLowerCase() === preset.label.toLowerCase()
    );
    if (exists) {
      setStatusMessage(`Color "${preset.label}" is already active.`);
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }
    setFilterConfig((prev) => ({
      ...prev,
      colors: [...prev.colors, preset],
    }));
  };

  // Remove an option
  const handleRemoveOption = (indexToRemove: number) => {
    audioSystem.playClick(450);
    if (activeGroup === "colors") {
      setFilterConfig((prev) => ({
        ...prev,
        colors: prev.colors.filter((_, idx) => idx !== indexToRemove),
      }));
    } else {
      setFilterConfig((prev) => {
        const currentList = (prev[activeGroup] as string[]) || [];
        return {
          ...prev,
          [activeGroup]: currentList.filter((_, idx) => idx !== indexToRemove),
        };
      });
    }
  };

  // Save changes to backend API and localStorage
  const handleSave = async () => {
    audioSystem.playClick(800);
    setIsSaving(true);
    setStatusMessage(null);

    // Save locally immediately
    try {
      localStorage.setItem("drapza_wardrobe_filter_options", JSON.stringify(filterConfig));
    } catch (e) {}

    try {
      const res = await filterConfigApi.updateFilterConfig(filterConfig);
      if (res && res.success) {
        setStatusMessage("FILTERS SAVED & LIVE ON STORE ✓");
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setStatusMessage("FILTERS SAVED LOCALLY (API SYNC PENDING)");
      }
    } catch (e: any) {
      setStatusMessage("SAVED LOCALLY (OFFLINE MODE)");
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Reset to factory defaults
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleExecuteReset = async () => {
    setShowResetConfirm(false);
    audioSystem.playClick(500);
    setIsResetting(true);

    const factoryDefaults: FilterConfigData = {
      categories: DEFAULT_CATEGORY_OPTIONS,
      sizes: DEFAULT_SIZE_OPTIONS,
      colors: DEFAULT_COLOR_OPTIONS,
      fabrics: DEFAULT_FABRIC_OPTIONS,
      occasions: DEFAULT_OCCASION_OPTIONS,
      availability: DEFAULT_AVAILABILITY_OPTIONS,
    };

    setFilterConfig(factoryDefaults);
    try {
      localStorage.setItem("drapza_wardrobe_filter_options", JSON.stringify(factoryDefaults));
      await filterConfigApi.resetFilterConfig();
      setStatusMessage("ALL FILTERS RESTORED TO FACTORY DEFAULTS");
    } catch (e) {
      setStatusMessage("FILTERS RESTORED TO FACTORY DEFAULTS (LOCAL)");
    } finally {
      setIsResetting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Filter items in active group by search
  const currentItems =
    activeGroup === "colors"
      ? filterConfig.colors.filter((c) =>
          c.label.toLowerCase().includes(searchFilter.toLowerCase())
        )
      : ((filterConfig[activeGroup] as string[]) || []).filter((item) =>
          item.toLowerCase().includes(searchFilter.toLowerCase())
        );

  const totalOptionsCount =
    filterConfig.categories.length +
    filterConfig.sizes.length +
    filterConfig.colors.length +
    filterConfig.fabrics.length +
    filterConfig.occasions.length +
    filterConfig.availability.length;

  return (
    <div className="space-y-6">

      {/* ── 1. TOP HEADER & TELEMETRY BAR ───────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-none p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-bold">
                WARDROBE FILTERS CMS // ARCHIVE 2026
              </span>
              <span className="px-2 py-0.5 rounded-none bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono font-bold">
                {totalOptionsCount} TOTAL OPTIONS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-black uppercase">
              FILTER OPTIONS MANAGER
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-mono mt-1 max-w-2xl">
              Add, remove, or customize any filter options shown to shoppers on the /wardrobe collection page.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="px-3.5 py-2.5 rounded-none border border-neutral-300 hover:border-black text-neutral-700 hover:text-black font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>RESET DEFAULTS</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
              <span>{isSaving ? "SAVING..." : "SAVE & PUBLISH"}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-none bg-neutral-900 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-white shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* ── 2. GROUP SELECTOR TABS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTER_GROUPS.map((group) => {
          const isActive = activeGroup === group.id;
          const count =
            group.id === "colors"
              ? filterConfig.colors.length
              : ((filterConfig[group.id] as string[]) || []).length;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveGroup(group.id);
                setSearchFilter("");
                setNewOptionInput("");
              }}
              className={`px-4 py-3 rounded-none font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-black text-white font-bold shadow-md scale-[1.02]"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:text-black hover:bg-neutral-50"
              }`}
            >
              <Tag className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
              <span>{group.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-none font-bold ${
                  isActive ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. MAIN WORKSPACE (EDITOR + LIVE PREVIEW) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: ADD / REMOVE OPTIONS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Add Option Card */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase text-black">
                  ADD TO {activeGroupMeta.label}
                </h3>
                <p className="text-[11px] font-mono text-neutral-500">
                  {activeGroupMeta.description}
                </p>
              </div>
            </div>

            {/* Input Form */}
            {activeGroup === "colors" ? (
              /* Color Input Form */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Native Color Picker Swatch */}
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-none p-1.5 shrink-0">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      title="Select hex color"
                      className="w-10 h-10 rounded-none cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#000000"
                      className="w-20 font-mono text-xs uppercase text-black bg-transparent outline-none font-bold"
                    />
                  </div>

                  {/* Color Name Input */}
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Color Name (e.g. Midnight Onyx)..."
                    className="flex-1 rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 font-mono text-xs uppercase text-black outline-none focus:border-black transition-colors"
                  />

                  <button
                    type="button"
                    onClick={() => handleAddOption()}
                    className="px-5 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>ADD COLOR</span>
                  </button>
                </div>

                {/* Trending Color Swatches */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider block mb-2">
                    POPULAR PALETTES:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAddPresetColor(preset)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 font-mono text-[10px] uppercase text-black transition-all cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-none border border-black/20"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.label}</span>
                        <Plus className="w-2.5 h-2.5 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Text Input Form */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder={activeGroupMeta.placeholder}
                    className="flex-1 rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 font-mono text-xs uppercase text-black outline-none focus:border-black transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOption()}
                    className="px-5 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>ADD</span>
                  </button>
                </div>

                {/* Suggestions Chips */}
                {activeGroupMeta.suggestions.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider block mb-2">
                      QUICK SUGGESTIONS (CLICK TO ADD):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeGroupMeta.suggestions.map((sug) => {
                        const alreadyAdded = (
                          (filterConfig[activeGroup] as string[]) || []
                        ).includes(sug);
                        if (alreadyAdded) return null;

                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddOption(sug)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 font-mono text-[10px] uppercase text-black transition-all cursor-pointer"
                          >
                            <span>{sug}</span>
                            <Plus className="w-2.5 h-2.5 text-neutral-500" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Options List */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase text-black">
                  ACTIVE {activeGroupMeta.label}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-black text-white font-bold">
                  {currentItems.length}
                </span>
              </div>

              {/* Search in group */}
              <div className="relative flex items-center w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={`Search ${activeGroupMeta.label.toLowerCase()}...`}
                  className="w-full pl-8 pr-3 py-1.5 rounded-none border border-neutral-300 bg-neutral-50 font-mono text-xs uppercase text-black outline-none focus:border-black"
                />
              </div>
            </div>

            {/* List / Badges */}
            {currentItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 font-mono text-xs uppercase">
                {searchFilter
                  ? `No matching options for "${searchFilter}"`
                  : `No options in ${activeGroupMeta.label} yet. Use the form above to add one.`}
              </div>
            ) : activeGroup === "colors" ? (
              /* Color Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(currentItems as ColorOptionData[]).map((c, idx) => {
                  const originalIdx = filterConfig.colors.findIndex(
                    (item) => item.label === c.label
                  );
                  return (
                    <div
                      key={c.label}
                      className="flex items-center justify-between p-3 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-6 h-6 rounded-none border border-black/20 shrink-0 shadow-xs"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-black uppercase truncate">
                            {c.label}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-500 uppercase">
                            {c.hex}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOption(originalIdx)}
                        aria-label={`Remove color option ${c.label}`}
                        className="p-1.5 rounded-none text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Remove option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Text Badges Grid */
              <div className="flex flex-wrap gap-2">
                {(currentItems as string[]).map((item) => {
                  const currentList = (filterConfig[activeGroup] as string[]) || [];
                  const originalIdx = currentList.indexOf(item);

                  return (
                    <div
                      key={item}
                      className="inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-black font-mono text-xs font-medium uppercase tracking-wider transition-all group"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(originalIdx)}
                        aria-label={`Remove option ${item}`}
                        className="p-1 rounded-none text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete filter option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE STORE PREVIEW (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          {/* Storefront Out-of-Stock Visibility Switch */}
          <div className="bg-neutral-950 text-white border border-neutral-800 rounded-none p-5 shadow-sm space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {filterConfig.hideOutOfStockOnStorefront ? (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  STOREFRONT INVENTORY VISIBILITY
                </span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider ${
                filterConfig.hideOutOfStockOnStorefront
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
              }`}>
                {filterConfig.hideOutOfStockOnStorefront ? "HIDDEN" : "VISIBLE"}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {filterConfig.hideOutOfStockOnStorefront
                ? "Out-of-stock garments (stock = 0) are automatically excluded from customer collection browsing on /wardrobe."
                : "All garments remain visible on the customer collection page. Exhausted items show an OUT OF STOCK badge."}
            </p>

            <button
              type="button"
              onClick={async () => {
                const nextVal = !filterConfig.hideOutOfStockOnStorefront;
                const nextConfig = { ...filterConfig, hideOutOfStockOnStorefront: nextVal };
                setFilterConfig(nextConfig);
                try {
                  localStorage.setItem("drapza_wardrobe_filter_options", JSON.stringify(nextConfig));
                  await filterConfigApi.updateFilterConfig({ hideOutOfStockOnStorefront: nextVal });
                } catch (e) {}
              }}
              className={`w-full py-2.5 px-4 rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 ${
                filterConfig.hideOutOfStockOnStorefront
                  ? "bg-amber-400 hover:bg-amber-300 text-black shadow-md"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              }`}
            >
              <div className={`w-2 h-2 rounded-none ${filterConfig.hideOutOfStockOnStorefront ? "bg-black" : "bg-emerald-400"}`} />
              <span>
                {filterConfig.hideOutOfStockOnStorefront
                  ? "OUT-OF-STOCK HIDDEN (CLICK TO SHOW)"
                  : "HIDE OUT-OF-STOCK FROM CUSTOMERS"}
              </span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                  LIVE STORE PREVIEW
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                /wardrobe sidebar
              </span>
            </div>

            <p className="text-[11px] font-mono text-neutral-500">
              This is how your wardrobe filter sidebar appears to customers with your latest options:
            </p>

            {/* Interactive Sidebar Preview */}
            <div className="pt-2">
              <WardrobeFilterSidebar
                filters={DEFAULT_FILTER_VALUES}
                onChange={() => {}}
                onClearAll={() => {}}
                dynamicOptions={filterConfig}
                totalMatches={12}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Luxury Reset Confirm Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        variant="reset"
        title="RESTORE FACTORY FILTERS"
        subtitle="[ TAXONOMY REGISTRY ]"
        message="Are you sure you want to reset all wardrobe categories, sizes, color swatches, fabrics, and taxonomy filters back to factory default presets?"
        confirmLabel="RESTORE DEFAULTS"
        cancelLabel="CANCEL"
        onConfirm={handleExecuteReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

