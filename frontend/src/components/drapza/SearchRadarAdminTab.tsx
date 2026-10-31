"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radar,
  Search,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  EyeOff,
  Download,
  Trash2,
  Send,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  ChevronRight,
  Filter,
} from "lucide-react";
import { searchTelemetryApi, SearchAnalyticsData } from "@/lib/api";
import { audioSystem } from "./AudioSystem";

interface SearchRadarAdminTabProps {
  onQuickAddProduct?: (prefilledName: string) => void;
}

type TabMode = "zero_results" | "top_queries" | "live_feed";

export function SearchRadarAdminTab({ onQuickAddProduct }: SearchRadarAdminTabProps) {
  const [analytics, setAnalytics] = useState<SearchAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabMode>("zero_results");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simQuery, setSimQuery] = useState("");
  const [simResultsCount, setSimResultsCount] = useState<number>(0);
  const [simCategory, setSimCategory] = useState("Outerwear");

  // Fetch Telemetry Data
  const fetchSearchTelemetry = useCallback(async (showAudio = false) => {
    setIsLoading(true);
    try {
      const res = await searchTelemetryApi.getAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
        if (showAudio) {
          audioSystem.playClick(850);
        }
      }
    } catch (err) {
      console.error("Failed to load search telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearchTelemetry();
  }, [fetchSearchTelemetry]);

  // Temporary feedback toast
  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Seed sample data
  const handleSeedSample = async () => {
    audioSystem.playClick(600);
    setIsLoading(true);
    try {
      const res = await searchTelemetryApi.seedSample();
      if (res.success) {
        audioSystem.playSuccess();
        triggerToast("Seeded 180+ market telemetry search events successfully.");
        await fetchSearchTelemetry();
      } else {
        triggerToast("Failed to seed sample telemetry.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Error seeding telemetry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear / Purge Logs
  const handleClearLogs = async (zeroOnly: boolean = false) => {
    const confirmMsg = zeroOnly
      ? "Purge only zero-result unmet demand telemetry entries?"
      : "Are you sure you want to PURGE ALL catalog search telemetry logs?";
    if (!window.confirm(confirmMsg)) return;

    audioSystem.playClick(300);
    setIsLoading(true);
    try {
      const res = await searchTelemetryApi.clearLogs(zeroOnly);
      if (res.success) {
        audioSystem.playSuccess();
        triggerToast(res.message);
        await fetchSearchTelemetry();
      } else {
        triggerToast("Failed to purge telemetry.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Error purging telemetry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Transmit Simulated Search Ping
  const handleSimulatePing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    setIsSimulating(true);
    audioSystem.playClick(780);

    try {
      const res = await searchTelemetryApi.logQuery(
        simQuery.trim(),
        simResultsCount,
        simCategory
      );
      if (res.success) {
        audioSystem.playSuccess();
        triggerToast(
          `Logged query: "${simQuery.trim()}" (${simResultsCount} matches found)`
        );
        setSimQuery("");
        await fetchSearchTelemetry();
      }
    } catch (err: any) {
      triggerToast(err.message || "Simulation failed.", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  // Direct CSV Export for Unmet Demand
  const handleExportCsv = () => {
    audioSystem.playClick(820);
    const url = searchTelemetryApi.getExportCsvUrl();
    window.open(url, "_blank");
  };

  // Filtered queries for search inside table
  const filteredZeroResults = useMemo(() => {
    const list = analytics?.zeroResultQueries || [];
    if (!searchTerm.trim()) return list;
    return list.filter((q) => q.query.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [analytics?.zeroResultQueries, searchTerm]);

  const filteredTopQueries = useMemo(() => {
    const list = analytics?.topQueries || [];
    if (!searchTerm.trim()) return list;
    return list.filter((q) => q.query.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [analytics?.topQueries, searchTerm]);

  const recentLogsList = useMemo(() => {
    const list = analytics?.recentLogs || [];
    if (!searchTerm.trim()) return list;
    return list.filter((q) => q.query.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [analytics?.recentLogs, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in text-neutral-900 font-sans pb-16">
      {/* ─── 1. TOP HEADER & TELEMETRY CONTROLS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-black text-white font-mono text-[9px] uppercase tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE RADAR SENSOR ONLINE
            </span>
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
              MARKET DEMAND TELEMETRY
            </span>
          </div>
          <h2 className="font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            SEARCH DEMAND &amp; ZERO-RESULT RADAR
          </h2>
          <p className="font-mono text-xs text-neutral-500 mt-1 max-w-2xl">
            Real-time scanner of shopper inquiries, unmet product demand, and garment keywords searched with zero catalog matches.
          </p>
        </div>

        {/* Global Action Suite */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchSearchTelemetry(true)}
            disabled={isLoading}
            className="px-3 py-2 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 font-mono text-xs uppercase font-bold tracking-wider text-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-black" : ""}`} />
            <span>REFRESH</span>
          </button>

          {/* Export Unmet Demand CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || !analytics?.zeroResultQueries?.length}
            className="px-3.5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Export zero-result queries to CSV for production planning"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          {/* Seed Sample Demo Data */}
          <button
            type="button"
            onClick={handleSeedSample}
            disabled={isLoading}
            className="px-3 py-2 rounded-none border border-neutral-300 hover:border-black bg-neutral-100 hover:bg-neutral-200 font-mono text-xs uppercase font-bold tracking-wider text-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Seed high-fidelity sample shopper searches"
          >
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>SEED DEMO DATA</span>
          </button>

          {/* Purge Telemetry */}
          <button
            type="button"
            onClick={() => handleClearLogs(false)}
            disabled={isLoading || !analytics?.summary?.totalSearches}
            className="px-3 py-2 rounded-none border border-neutral-200 hover:border-rose-500 bg-white hover:bg-rose-50 font-mono text-xs uppercase font-bold tracking-wider text-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Clear all telemetry search logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>PURGE</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-none font-mono text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-bold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ─── 2. CORE KPI RADAR CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Searches */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              TOTAL SEARCH TRAFFIC
            </span>
            <div className="w-7 h-7 rounded-none bg-neutral-100 flex items-center justify-center text-black">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-3xl font-black text-neutral-900 tracking-tight">
            {analytics?.summary?.totalSearches?.toLocaleString("en-IN") || 0}
          </div>
          <span className="font-mono text-[11px] text-neutral-500 mt-1 block">
            Real-time queries captured across all shopper storefronts
          </span>
        </div>

        {/* Zero-Result Searches (Unmet Demand) */}
        <div className="p-5 rounded-none bg-rose-50/70 border border-rose-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              ZERO-RESULT QUERIES
            </span>
            <div className="w-7 h-7 rounded-none bg-rose-600 text-white flex items-center justify-center">
              <EyeOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-3xl font-black text-rose-950 tracking-tight">
            {analytics?.summary?.zeroResultsCount?.toLocaleString("en-IN") || 0}
          </div>
          <span className="font-mono text-[11px] text-rose-800 mt-1 block">
            Lost sales opportunities with 0 inventory matches found
          </span>
        </div>

        {/* Unmet Demand Ratio */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              UNMET DEMAND RATIO
            </span>
            <div className="w-7 h-7 rounded-none bg-neutral-900 text-white flex items-center justify-center">
              <Radar className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>
          <div className="font-mono text-3xl font-black text-neutral-900 tracking-tight">
            {analytics?.summary?.zeroResultRate || "0.0%"}
          </div>
          <span className="font-mono text-[11px] text-neutral-500 mt-1 block">
            Percentage of customer queries yielding zero catalog matches
          </span>
        </div>

        {/* Top Missing Demand Target */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              TOP MISSING SILHOUETTE
            </span>
            <div className="w-7 h-7 rounded-none bg-neutral-100 flex items-center justify-center text-black">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="font-mono text-lg font-bold text-neutral-900 uppercase truncate">
            {analytics?.zeroResultQueries?.[0]?.query
              ? `"${analytics.zeroResultQueries[0].query}"`
              : "None Detected"}
          </div>
          <span className="font-mono text-[11px] text-neutral-500 mt-1 block">
            {analytics?.zeroResultQueries?.[0]?.count
              ? `${analytics.zeroResultQueries[0].count} shoppers looking for this item`
              : "All search requests currently satisfied"}
          </span>
        </div>
      </div>

      {/* ─── 3. INTERACTIVE SEARCH RADAR SIMULATOR ─── */}
      <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-black" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
              TRANSMIT LIVE TEST PING // SIMULATE SHOPPER SEARCH
            </h3>
          </div>
          <span className="font-mono text-[10px] text-neutral-500 uppercase">
            Test how queries trigger unmet radar alerts
          </span>
        </div>

        <form onSubmit={handleSimulatePing} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-5">
            <label className="block font-mono text-[10px] uppercase font-bold text-neutral-600 mb-1">
              SEARCH PHRASE / KEYWORD
            </label>
            <input
              type="text"
              required
              placeholder="e.g., reflective kimono vest, parachute pants..."
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-mono text-[10px] uppercase font-bold text-neutral-600 mb-1">
              RESULTS RETURNED
            </label>
            <select
              value={simResultsCount}
              onChange={(e) => setSimResultsCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black cursor-pointer font-bold"
            >
              <option value={0}>0 (Zero Results - Unmet Demand)</option>
              <option value={1}>1 Product Match</option>
              <option value={3}>3 Product Matches</option>
              <option value={8}>8 Product Matches</option>
              <option value={15}>15+ Product Matches</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-mono text-[10px] uppercase font-bold text-neutral-600 mb-1">
              CATEGORY
            </label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="Outerwear">Outerwear</option>
              <option value="Tops">Tops</option>
              <option value="Bottoms">Bottoms</option>
              <option value="Accessories">Accessories</option>
              <option value="Kurti">Kurti</option>
              <option value="Saree">Saree</option>
              <option value="Jumpsuits">Jumpsuits</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSimulating || !simQuery.trim()}
              className="w-full py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSimulating ? "animate-pulse" : ""}`} />
              <span>{isSimulating ? "PINGING..." : "SEND PING"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── 4. SUB-TABS & SEARCH FILTER ─── */}
      <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "zero_results" as TabMode,
                label: "UNMET DEMAND RADAR (ZERO RESULTS)",
                count: analytics?.zeroResultQueries?.length || 0,
                badgeColor: "bg-rose-600 text-white",
              },
              {
                id: "top_queries" as TabMode,
                label: "ALL POPULAR QUERIES",
                count: analytics?.topQueries?.length || 0,
                badgeColor: "bg-neutral-800 text-white",
              },
              {
                id: "live_feed" as TabMode,
                label: "LIVE TELEMETRY STREAM",
                count: analytics?.recentLogs?.length || 0,
                badgeColor: "bg-neutral-200 text-black",
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(720);
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-none font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-black text-white shadow-sm ring-1 ring-black"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border border-neutral-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-none text-[10px] font-mono font-bold ${
                      active ? "bg-white text-black" : tab.badgeColor
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter listed queries..."
              className="pl-9 pr-3 py-1.5 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-black w-48 sm:w-64 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. TAB VIEW 1: ZERO-RESULT UNMET DEMAND TABLE ─── */}
      {activeTab === "zero_results" && (
        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-200 bg-rose-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-tight text-neutral-900">
                  UNMET PRODUCT DEMAND (ZERO RESULTS FOUND)
                </h3>
                <p className="font-mono text-xs text-neutral-500">
                  Shoppers entered these exact keywords into your search bar, but found 0 products in stock.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-none border border-neutral-300 hover:border-black bg-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm text-neutral-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT LIST (.CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase text-neutral-600">
                  <th className="py-3 px-4 font-bold"># RANK</th>
                  <th className="py-3 px-4 font-bold">MISSING PHRASE / SILHOUETTE</th>
                  <th className="py-3 px-4 font-bold">DEMAND VOLUME</th>
                  <th className="py-3 px-4 font-bold">PRIORITY STATUS</th>
                  <th className="py-3 px-4 font-bold">LAST SEARCHED</th>
                  <th className="py-3 px-4 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400 font-mono text-xs">
                      Scanning Search Radar frequencies...
                    </td>
                  </tr>
                ) : filteredZeroResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono text-xs">
                      {searchTerm.trim()
                        ? `No zero-result searches match "${searchTerm}".`
                        : "No zero-result queries recorded. All shopper searches currently find matching products!"}
                    </td>
                  </tr>
                ) : (
                  filteredZeroResults.map((q, idx) => {
                    const isHighPriority = q.count >= 10;
                    return (
                      <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-400">#{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-900 text-xs px-2.5 py-1 rounded-none bg-neutral-100 border border-neutral-200 inline-block">
                            &ldquo;{q.query}&rdquo;
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                            <span>{q.count} requests</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                              isHighPriority
                                ? "bg-rose-600 text-white"
                                : "bg-neutral-200 text-neutral-800"
                            }`}
                          >
                            {isHighPriority ? "CRITICAL GAP" : "MONITORING"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                          {new Date(q.lastSearched).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {onQuickAddProduct ? (
                            <button
                              type="button"
                              onClick={() => {
                                audioSystem.playClick(750);
                                onQuickAddProduct(q.query);
                              }}
                              className="px-3 py-1.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ml-auto transition-colors cursor-pointer shadow-sm"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>CREATE GARMENT</span>
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-neutral-400 uppercase">
                              Production Cue
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 6. TAB VIEW 2: TOP SEARCH QUERIES & POPULAR INTENT ─── */}
      {activeTab === "top_queries" && (
        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-tight text-neutral-900">
                  TOP SEARCHED PHRASES &amp; POPULAR INTENT
                </h3>
                <p className="font-mono text-xs text-neutral-500">
                  Most frequent search terms with average product matches returned.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase text-neutral-600">
                  <th className="py-3 px-4 font-bold"># RANK</th>
                  <th className="py-3 px-4 font-bold">KEYWORD / PHRASE</th>
                  <th className="py-3 px-4 font-bold">SEARCH VOLUME</th>
                  <th className="py-3 px-4 font-bold">CATALOG MATCHES</th>
                  <th className="py-3 px-4 font-bold">LAST SEARCHED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400 font-mono text-xs">
                      Loading top search volume...
                    </td>
                  </tr>
                ) : filteredTopQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-xs">
                      No search queries logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredTopQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-neutral-400">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900 uppercase">
                        {q.query}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-800">
                        {q.count} hits
                      </td>
                      <td className="py-3.5 px-4">
                        {q.avgResults > 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200">
                            {q.avgResults} garments
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-none border border-rose-200">
                            0 garments (unmet)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                        {new Date(q.lastSearched).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 7. TAB VIEW 3: LIVE TELEMETRY STREAM ─── */}
      {activeTab === "live_feed" && (
        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-tight text-neutral-900">
                  REAL-TIME SEARCH PING STREAM
                </h3>
                <p className="font-mono text-xs text-neutral-500">
                  Chronological raw ping feed showing queries arriving at the radar.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase text-neutral-600">
                  <th className="py-3 px-4 font-bold">TIMESTAMP</th>
                  <th className="py-3 px-4 font-bold">SEARCH PHRASE</th>
                  <th className="py-3 px-4 font-bold">CATEGORY</th>
                  <th className="py-3 px-4 font-bold">MATCHES FOUND</th>
                  <th className="py-3 px-4 font-bold">SOURCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400 font-mono text-xs">
                      Connecting to telemetry feed...
                    </td>
                  </tr>
                ) : recentLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-xs">
                      No raw pings in buffer. Use the simulator above to transmit test pings!
                    </td>
                  </tr>
                ) : (
                  recentLogsList.map((log) => (
                    <tr key={log._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        &ldquo;{log.query}&rdquo;
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 uppercase text-[11px]">
                        {log.category || "General"}
                      </td>
                      <td className="py-3.5 px-4">
                        {log.resultsCount === 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-none text-[10px]">
                            0 (UNMET DEMAND)
                          </span>
                        ) : (
                          <span className="font-bold text-neutral-800">
                            {log.resultsCount} products
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 uppercase text-[10px]">
                        {log.source || "web_search"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
