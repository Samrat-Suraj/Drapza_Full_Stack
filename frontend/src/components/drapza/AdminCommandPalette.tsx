"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sliders,
  TrendingUp,
  LayoutDashboard,
  Navigation,
  Radar,
  ShoppingBag,
  Scissors,
  RotateCcw,
  Package,
  Truck,
  LifeBuoy,
  Star,
  Globe,
  Compass,
  Eye,
  Quote,
  Radio,
  FileText,
  Film,
  Lock,
  Key,
  MessageSquareQuote,
  Mail,
  Tag,
  Gift,
  Camera,
  CreditCard,
  Users,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";

export interface CommandPaletteItem {
  id: string;
  label: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  isLive?: boolean;
  type?: "module" | "action";
  action?: () => void;
}

export interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  navCategories: Array<{
    id: string;
    label: string;
    items: Array<{
      id: string;
      label: string;
      subtitle: string;
      icon: any;
      badge?: any;
      isLive?: boolean;
    }>;
  }>;
  onSyncVault?: () => void;
  isSyncing?: boolean;
  orderCount?: number;
  productCount?: number;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  navCategories,
  onSyncVault,
  isSyncing,
  orderCount,
  productCount,
}) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setSelectedCategory("ALL");
      audioSystem.playClick(800);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Build unified searchable pool including Quick Actions
  const allItems: CommandPaletteItem[] = useMemo(() => {
    const moduleItems: CommandPaletteItem[] = navCategories.flatMap((cat) =>
      cat.items.map((it) => ({
        id: it.id,
        label: it.label,
        subtitle: it.subtitle,
        category: cat.id,
        categoryLabel: cat.label,
        icon: it.icon,
        badge: it.badge,
        isLive: it.isLive,
        type: "module",
        action: () => {
          setActiveTab(it.id);
          onClose();
        },
      }))
    );

    const actionItems: CommandPaletteItem[] = [
      {
        id: "action-sync-vault",
        label: "SYNC DATABASE VAULT",
        subtitle: "Pull latest orders, inventory and client telemetry",
        category: "actions",
        categoryLabel: "SYSTEM ACTIONS",
        icon: RefreshCw,
        badge: isSyncing ? "SYNCING..." : "LIVE",
        type: "action",
        action: () => {
          if (onSyncVault) onSyncVault();
          onClose();
        },
      },
      {
        id: "action-visit-storefront",
        label: "VIEW LIVE STOREFRONT",
        subtitle: "Open Drapza public boutique in new browser tab",
        category: "actions",
        categoryLabel: "SYSTEM ACTIONS",
        icon: ExternalLink,
        badge: "STORE",
        type: "action",
        action: () => {
          window.open("/", "_blank");
          onClose();
        },
      },
      {
        id: "action-download-reports",
        label: "JUMP TO SALES REPORTS & EXCEL",
        subtitle: "Audit ledger, returns breakdown and Excel CSV export",
        category: "actions",
        categoryLabel: "FINANCIAL INTELLIGENCE",
        icon: TrendingUp,
        badge: "EXCEL",
        type: "action",
        action: () => {
          setActiveTab("reports");
          onClose();
        },
      },
    ];

    return [...actionItems, ...moduleItems];
  }, [navCategories, onSyncVault, isSyncing, setActiveTab, onClose]);

  // Filter items based on query & category
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedCategory !== "ALL") {
      items = items.filter((it) => it.category === selectedCategory);
    }
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q) ||
        it.categoryLabel.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q)
    );
  }, [allItems, selectedCategory, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
        audioSystem.playClick(650);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
        );
        audioSystem.playClick(600);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          audioSystem.playSuccess();
          selected.action?.();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        audioSystem.playClick(500);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll selected item into view smoothly
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atelier Admin Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-neutral-200/90 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.18)] rounded-2xl flex flex-col max-h-[80vh] overflow-hidden text-neutral-900 font-sans ring-1 ring-black/[0.04] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Box */}
        <div className="px-5 py-4 border-b border-neutral-100 bg-white flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 stroke-[2.2]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to any module..."
            style={{
              backgroundColor: "transparent",
              background: "transparent",
              border: "none",
              boxShadow: "none",
              borderRadius: "0px",
              outline: "none",
              color: "#0f172a",
              padding: 0,
            }}
            className="palette-search-input w-full !bg-transparent !text-neutral-900 !border-0 !shadow-none !outline-none !ring-0 font-mono text-sm sm:text-base font-semibold placeholder:!text-neutral-400 uppercase tracking-wider"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {query ? (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-100 border border-neutral-200/80 text-neutral-600">
                {filteredItems.length} {filteredItems.length === 1 ? "match" : "matches"}
              </span>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200/80 font-mono text-[9.5px] font-bold text-neutral-400 shadow-2xs">
                Ctrl+K
              </kbd>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 font-mono text-[10px] font-bold text-neutral-500 shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-50/80 border-b border-neutral-100 overflow-x-auto scrollbar-none font-mono text-[10px] uppercase font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(700);
              setSelectedCategory("ALL");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${selectedCategory === "ALL"
                ? "bg-neutral-900 text-white font-extrabold shadow-sm"
                : "bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200/80"
              }`}
          >
            <span>ALL COMMANDS</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${selectedCategory === "ALL"
                  ? "bg-white/20 text-white font-bold"
                  : "bg-neutral-100 text-neutral-500 font-semibold"
                }`}
            >
              {allItems.length}
            </span>
          </button>
          {navCategories.map((cat) => {
            const isCatSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  audioSystem.playClick(720);
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isCatSelected
                    ? "bg-neutral-900 text-white font-extrabold shadow-sm"
                    : "bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200/80"
                  }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${isCatSelected
                      ? "bg-white/20 text-white font-bold"
                      : "bg-neutral-100 text-neutral-500 font-semibold"
                    }`}
                >
                  {cat.items.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar overscroll-contain"
        >
          {filteredItems.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-2">
              <Terminal className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
              <p className="font-mono text-xs uppercase font-bold text-neutral-800">
                No matching admin modules or actions found
              </p>
              <p className="font-mono text-[11px] text-neutral-500">
                Try searching for &quot;reports&quot;, &quot;orders&quot;, &quot;inventory&quot;, or &quot;sync&quot;
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              const isActive = activeTab === item.id;

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => {
                    audioSystem.playSuccess();
                    item.action?.();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 select-none ${isSelected
                      ? "bg-neutral-100/90 text-neutral-900 border border-neutral-200/90 shadow-2xs"
                      : "bg-transparent text-neutral-700 hover:bg-neutral-50/80 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "bg-neutral-100 text-neutral-600 border border-neutral-200/60"
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider truncate text-neutral-900">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            CURRENT TAB
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] block truncate text-neutral-500">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider hidden sm:inline-block px-2 py-0.5 rounded-md ${isSelected
                          ? "text-neutral-600 bg-white border border-neutral-200"
                          : "text-neutral-400 bg-neutral-100/70 border border-neutral-200/60"
                        }`}
                    >
                      {item.categoryLabel}
                    </span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase ${item.isLive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                            : isSelected
                              ? "bg-neutral-900 text-white font-extrabold"
                              : "bg-neutral-100 text-neutral-700 border border-neutral-200/80 font-bold"
                          }`}
                      >
                        {item.isLive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                        )}
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${isSelected
                          ? "translate-x-1 text-neutral-900 opacity-100"
                          : "text-neutral-400 opacity-40 sm:opacity-50"
                        }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/90 backdrop-blur-md font-mono text-[11px] text-neutral-500 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 font-bold text-[10px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 font-bold text-[10px] shadow-2xs">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 font-bold text-[10px] shadow-2xs">
                ↵
              </kbd>
              <span>Execute</span>
            </span>
            <span className="flex items-center gap-1.5 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 font-bold text-[10px] shadow-2xs">
                ESC
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block font-mono text-[9.5px] uppercase tracking-wider text-neutral-400">
              {filteredItems.length} OF {allItems.length} MODULES
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="uppercase font-bold tracking-wider text-neutral-800 text-[10px]">
                DRAPZA ATELIER CONSOLE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
