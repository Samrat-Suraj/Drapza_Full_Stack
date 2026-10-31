"use client";

import React, { useState, useRef } from "react";
import { ChevronRight, Star, X } from "lucide-react";
import { audioSystem } from "./AudioSystem";

export interface WardrobeFilterValues {
  categories: string[];
  sizes: string[];
  colors: string[];
  fabrics: string[];
  occasions: string[];
  availability: string[];
  rating: number | null;
  priceRange: string;
  customMinPrice?: number | null;
  customMaxPrice?: number | null;
}

export const DEFAULT_FILTER_VALUES: WardrobeFilterValues = {
  categories: [],
  sizes: [],
  colors: [],
  fabrics: [],
  occasions: [],
  availability: [],
  rating: null,
  priceRange: "all",
  customMinPrice: null,
  customMaxPrice: null,
};

export interface DynamicFilterOptions {
  categories?: string[];
  sizes?: string[];
  colors?: { label: string; hex: string }[];
  fabrics?: string[];
  occasions?: string[];
  availability?: string[];
  hideOutOfStockOnStorefront?: boolean;
}

interface WardrobeFilterSidebarProps {
  filters: WardrobeFilterValues;
  onChange: (newFilters: WardrobeFilterValues) => void;
  onClearAll: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
  totalMatches?: number;
  dynamicOptions?: DynamicFilterOptions;
}

export const DEFAULT_CATEGORY_OPTIONS = [
  "Kurti",
  "Saree",
  "Jeans",
  "Palazzo/Bottom",
  "Leggings",
  "Tops",
  "Dupatta",
  "Co-ord Set",
  "Panties",
  "Bra",
  "Sharara/Lehenga",
];

export const DEFAULT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export const toRomanSize = (size: string): string => {
  if (!size) return "M";
  return size.trim();
};

export const DEFAULT_COLOR_OPTIONS = [
  { label: "Black", hex: "#000000" },
  { label: "White", hex: "#ffffff" },
  { label: "Charcoal Grey", hex: "#404040" },
  { label: "Neutral Ash", hex: "#737373" },
  { label: "Silver Mist", hex: "#d4d4d4" },
  { label: "Deep Olive", hex: "#262626" },
  { label: "Dark Navy", hex: "#171717" },
  { label: "Monochrome Tint", hex: "#a3a3a3" },
];

export const DEFAULT_FABRIC_OPTIONS = [
  "Pure Silk",
  "French Terry (480 GSM)",
  "Organic Cotton",
  "Chanderi Silk",
  "Sheer Organza",
  "Liquid Georgette",
  "European Linen",
];

export const DEFAULT_OCCASION_OPTIONS = [
  "Everyday Casual",
  "Festive & Wedding",
  "Atelier Streetwear",
  "Lounge & Sleepwear",
  "Office & Formal",
];

export const DEFAULT_AVAILABILITY_OPTIONS = [
  "In Stock Only",
  "Express Dispatch",
  "Limited Archive Edition",
];

export const DEFAULT_RATING_OPTIONS = [
  { value: 4.5, label: "4.5 & above" },
  { value: 4.0, label: "4.0 & above" },
  { value: 3.5, label: "3.5 & above" },
];

export const DEFAULT_PRICE_OPTIONS = [
  { id: "all", label: "All Prices" },
  { id: "under-1000", label: "Under ₹1,000" },
  { id: "1000-2000", label: "₹1,000 – ₹2,000" },
  { id: "2000-3000", label: "₹2,000 – ₹3,000" },
  { id: "above-3000", label: "Above ₹3,000" },
];

export function WardrobeFilterSidebar({
  filters,
  onChange,
  onClearAll,
  onCloseMobile,
  isMobileDrawer = false,
  totalMatches,
  dynamicOptions,
}: WardrobeFilterSidebarProps) {
  const categoryOptions = (dynamicOptions?.categories && dynamicOptions.categories.length > 0) ? dynamicOptions.categories : DEFAULT_CATEGORY_OPTIONS;
  const sizeOptions = (dynamicOptions?.sizes && dynamicOptions.sizes.length > 0) ? dynamicOptions.sizes : DEFAULT_SIZE_OPTIONS;
  const colorOptions = (dynamicOptions?.colors && dynamicOptions.colors.length > 0) ? dynamicOptions.colors : DEFAULT_COLOR_OPTIONS;
  const fabricOptions = (dynamicOptions?.fabrics && dynamicOptions.fabrics.length > 0) ? dynamicOptions.fabrics : DEFAULT_FABRIC_OPTIONS;
  const occasionOptions = (dynamicOptions?.occasions && dynamicOptions.occasions.length > 0) ? dynamicOptions.occasions : DEFAULT_OCCASION_OPTIONS;
  const availabilityOptions = (dynamicOptions?.availability && dynamicOptions.availability.length > 0) ? dynamicOptions.availability : DEFAULT_AVAILABILITY_OPTIONS;

  // Track open accordion section keys
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    size: false,
    color: false,
    fabric: false,
    occasion: false,
    availability: false,
    rating: false,
    price: false,
  });

  const toggleSection = (section: string) => {
    audioSystem.playClick(550);
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleArrayItem = (key: keyof WardrobeFilterValues, item: string) => {
    audioSystem.playClick(650);
    const currentList = (filters[key] as string[]) || [];
    const exists = currentList.includes(item);
    const updated = exists
      ? currentList.filter((x) => x !== item)
      : [...currentList, item];

    onChange({
      ...filters,
      [key]: updated,
    });
  };

  const [minInput, setMinInput] = useState<string>(
    filters.customMinPrice != null ? String(filters.customMinPrice) : ""
  );
  const [maxInput, setMaxInput] = useState<string>(
    filters.customMaxPrice != null ? String(filters.customMaxPrice) : ""
  );

  React.useEffect(() => {
    setMinInput(filters.customMinPrice != null ? String(filters.customMinPrice) : "");
    setMaxInput(filters.customMaxPrice != null ? String(filters.customMaxPrice) : "");
  }, [filters.customMinPrice, filters.customMaxPrice]);

  const handlePriceChange = (val: string) => {
    audioSystem.playClick(600);
    onChange({
      ...filters,
      priceRange: val,
      ...(val !== "custom" ? { customMinPrice: null, customMaxPrice: null } : {}),
    });
  };

  const handleApplyCustomPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    audioSystem.playClick(700);
    const min = minInput.trim() !== "" ? Math.max(0, parseInt(minInput, 10)) : null;
    const max = maxInput.trim() !== "" ? Math.max(0, parseInt(maxInput, 10)) : null;

    onChange({
      ...filters,
      priceRange: "custom",
      customMinPrice: min,
      customMaxPrice: max,
    });
  };

  const handleClearCustomPrice = () => {
    audioSystem.playClick(500);
    setMinInput("");
    setMaxInput("");
    onChange({
      ...filters,
      priceRange: "all",
      customMinPrice: null,
      customMaxPrice: null,
    });
  };

  const handleRatingChange = (val: number | null) => {
    audioSystem.playClick(600);
    onChange({
      ...filters,
      rating: filters.rating === val ? null : val,
    });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <aside
      data-lenis-prevent="true"
      aria-label="Product filters"
      style={{
        backgroundColor: "#ffffff",
        border: isMobileDrawer ? "none" : "1px solid var(--base-200, #d7dbd2)",
        borderRadius: isMobileDrawer ? "0px" : "12px",
        boxShadow: isMobileDrawer ? "none" : "0 4px 20px rgba(0, 0, 0, 0.03)",
        width: "100%",
        maxHeight: isMobileDrawer ? "100%" : "calc(100vh - 8.5rem)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        color: "var(--base-700, #0f0f0f)",
      }}
    >
      {/* ── HEADER (Pinned at top of card) ─────────────────────────────── */}
      <div
        onWheel={(e) => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop += e.deltaY;
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobileDrawer ? "1.25rem 1.25rem 0.95rem" : "1.15rem 1.35rem 0.95rem",
          borderBottom: "1px solid var(--base-200, #d7dbd2)",
          backgroundColor: "#ffffff",
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* DRAPZA Design System: Section Title (Koulen display font, uppercase) */}
          <h5
            style={{
              fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
              fontSize: "1.45rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--base-700, #0f0f0f)",
              margin: 0,
              padding: 0,
              lineHeight: 1,
            }}
          >
            FILTERS
          </h5>
          {totalMatches !== undefined && (
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "0.8rem",
                color: "var(--base-500, #7d807a)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              ({totalMatches})
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              onClearAll();
            }}
            aria-label="Clear all active filters"
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--base-500, #7d807a)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--base-700, #0f0f0f)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--base-500, #7d807a)";
            }}
          >
            CLEAR ALL
          </button>

          {isMobileDrawer && onCloseMobile && (
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(500);
                onCloseMobile();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Close filters drawer"
            >
              <X style={{ width: "1.1rem", height: "1.1rem" }} />
            </button>
          )}
        </div>
      </div>

      {/* ── ACCORDION LIST (Scrollable inside card) ───────────────────────── */}
      <div
        ref={scrollContainerRef}
        data-lenis-prevent="true"
        className="wardrobe-filter-scroll custom-scrollbar"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          padding: isMobileDrawer ? "0.25rem 1.25rem 1.5rem" : "0.25rem 1.35rem 1.5rem",
        }}
      >

        {/* 1. CATEGORY */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("category")}
            aria-expanded={openSections.category}
            aria-label="Toggle category filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              CATEGORY
              {filters.categories.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.categories.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.category ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.category && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {categoryOptions.map((cat, idx) => {
                const checked = filters.categories.includes(cat);
                const inputId = `filter-cat-${idx}-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem("categories", cat)}
                      aria-label={`Filter by category ${cat}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      {cat}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. SIZE */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("size")}
            aria-expanded={openSections.size}
            aria-label="Toggle size filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              SIZE
              {filters.sizes.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.sizes.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.size ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.size && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.4rem",
                animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {sizeOptions.map((sz) => {
                const selected = filters.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleArrayItem("sizes", sz)}
                    aria-label={`Filter by size ${sz}`}
                    style={{
                      padding: "0.45rem 0.25rem",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: selected
                        ? "1px solid var(--base-700, #0f0f0f)"
                        : "1px solid var(--base-200, #d7dbd2)",
                      backgroundColor: selected
                        ? "var(--base-700, #0f0f0f)"
                        : "#ffffff",
                      color: selected
                        ? "var(--base-100, #edf1e8)"
                        : "var(--base-700, #0f0f0f)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. COLOR */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("color")}
            aria-expanded={openSections.color}
            aria-label="Toggle color filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              COLOR
              {filters.colors.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.colors.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.color ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.color && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {colorOptions.map((c) => {
                const selected = filters.colors.includes(c.label);
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => toggleArrayItem("colors", c.label)}
                    aria-label={`Filter by color ${c.label}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "6px",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border: selected
                        ? "1px solid var(--base-700, #0f0f0f)"
                        : "1px solid var(--base-200, #d7dbd2)",
                      backgroundColor: selected
                        ? "var(--base-700, #0f0f0f)"
                        : "#ffffff",
                      color: selected
                        ? "var(--base-100, #edf1e8)"
                        : "var(--base-700, #0f0f0f)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "0.65rem",
                        height: "0.65rem",
                        borderRadius: "50%",
                        backgroundColor: c.hex,
                        border: "1px solid rgba(0,0,0,0.15)",
                        display: "inline-block",
                      }}
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. FABRIC */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("fabric")}
            aria-expanded={openSections.fabric}
            aria-label="Toggle fabric filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              FABRIC
              {filters.fabrics.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.fabrics.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.fabric ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.fabric && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {fabricOptions.map((fab, idx) => {
                const checked = filters.fabrics.includes(fab);
                const inputId = `filter-fab-${idx}-${fab.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                return (
                  <div key={fab} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem("fabrics", fab)}
                      aria-label={`Filter by fabric ${fab}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      {fab}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. OCCASION */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("occasion")}
            aria-expanded={openSections.occasion}
            aria-label="Toggle occasion filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              OCCASION
              {filters.occasions.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.occasions.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.occasion ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.occasion && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {occasionOptions.map((occ, idx) => {
                const checked = filters.occasions.includes(occ);
                const inputId = `filter-occ-${idx}-${occ.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                return (
                  <div key={occ} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem("occasions", occ)}
                      aria-label={`Filter by occasion ${occ}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      {occ}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. AVAILABILITY */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("availability")}
            aria-expanded={openSections.availability}
            aria-label="Toggle availability filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              AVAILABILITY
              {filters.availability.length > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  {filters.availability.length}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.availability ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.availability && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {availabilityOptions.map((av, idx) => {
                const checked = filters.availability.includes(av);
                const inputId = `filter-av-${idx}-${av.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                return (
                  <div key={av} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem("availability", av)}
                      aria-label={`Filter by availability ${av}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      {av}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. CUSTOMER RATING */}
        <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--base-200, #d7dbd2)" }}>
          <button
            type="button"
            onClick={() => toggleSection("rating")}
            aria-expanded={openSections.rating}
            aria-label="Toggle customer rating filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              RATING
              {filters.rating !== null && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  ★ {filters.rating}
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.rating ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.rating && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {DEFAULT_RATING_OPTIONS.map((r, idx) => {
                const checked = filters.rating === r.value;
                const inputId = `filter-rating-${idx}`;
                return (
                  <div key={r.value} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="radio"
                      name="rating_filter"
                      checked={checked}
                      onChange={() => handleRatingChange(r.value)}
                      aria-label={`Filter by customer rating ${r.label}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      <Star style={{ width: "0.85rem", height: "0.85rem", fill: "var(--base-700, #0f0f0f)", color: "var(--base-700, #0f0f0f)" }} />
                      <span>{r.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. PRICE RANGE */}
        <div style={{ padding: "0.85rem 0" }}>
          <button
            type="button"
            onClick={() => toggleSection("price")}
            aria-expanded={openSections.price}
            aria-label="Toggle price range filter section"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--base-700, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              PRICE
              {filters.priceRange !== "all" && (
                <span
                  style={{
                    backgroundColor: "var(--base-700, #0f0f0f)",
                    color: "var(--base-100, #edf1e8)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    padding: "0.1rem 0.35rem",
                  }}
                >
                  ACTIVE
                </span>
              )}
            </span>
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                color: "var(--base-400, #969992)",
                transition: "transform 0.2s ease",
                transform: openSections.price ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {openSections.price && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "accordionReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              {DEFAULT_PRICE_OPTIONS.map((p, idx) => {
                const checked = filters.priceRange === p.id;
                const inputId = `filter-price-${idx}`;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <input
                      id={inputId}
                      type="radio"
                      name="price_range_filter"
                      checked={checked}
                      onChange={() => handlePriceChange(p.id)}
                      aria-label={`Filter by price ${p.label}`}
                      style={{
                        accentColor: "var(--base-700, #0f0f0f)",
                        width: "0.95rem",
                        height: "0.95rem",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        color: checked ? "var(--base-700, #0f0f0f)" : "var(--base-500, #7d807a)",
                        fontWeight: checked ? 700 : 500,
                      }}
                    >
                      {p.label}
                    </label>
                  </div>
                );
              })}

              {/* Custom Price Range Input */}
              <div
                style={{
                  marginTop: "0.65rem",
                  paddingTop: "0.65rem",
                  borderTop: "1px dashed var(--base-300, #afb3ab)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.4rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  >
                    CUSTOM RANGE (₹)
                  </span>
                  {filters.priceRange === "custom" && (
                    <button
                      type="button"
                      onClick={handleClearCustomPrice}
                      style={{
                        background: "none",
                        border: "none",
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.68rem",
                        color: "#d32f2f",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <form
                  onSubmit={handleApplyCustomPrice}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <input
                    type="number"
                    placeholder="Min"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.5rem",
                      border: "1px solid var(--base-200, #d7dbd2)",
                      borderRadius: "6px",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.75rem",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  />
                  <span style={{ color: "var(--base-400, #969992)" }}>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.5rem",
                      border: "1px solid var(--base-200, #d7dbd2)",
                      borderRadius: "6px",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.75rem",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "var(--base-700, #0f0f0f)",
                      color: "var(--base-100, #edf1e8)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.35rem 0.65rem",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    GO
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
