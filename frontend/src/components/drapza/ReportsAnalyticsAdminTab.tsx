"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CreditCard,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Truck,
  IndianRupee,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";
import {
  reportApi,
  AnalyticsReportData,
  OrderLedgerItem,
  TopProductReportItem,
} from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { AdminKpiSkeleton, AdminTableSkeleton } from "./skeletons";

type TimeframePreset =
  | "today"
  | "yesterday"
  | "week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "3_years"
  | "all_time"
  | "custom";

export const ReportsAnalyticsAdminTab: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframePreset>("this_month");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [reportData, setReportData] = useState<AnalyticsReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const printReportRef = useRef<HTMLDivElement>(null);

  // Seed sample demo orders
  const handleSeedDemoOrders = async () => {
    setIsSeeding(true);
    audioSystem.playClick(600);
    try {
      const res = await reportApi.seedDemoOrders();
      if (res && res.success) {
        audioSystem.playSuccess();
        await fetchReport();
      }
    } catch (err: any) {
      console.error("[SEED ERROR]", err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Fetch Report Analytics
  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: any = await reportApi.getAnalytics({
        timeframe,
        startDate: timeframe === "custom" ? customStart : undefined,
        endDate: timeframe === "custom" ? customEnd : undefined,
      });
      if (data && data.success) {
        setReportData(data);
      } else {
        setError(data?.message || "Failed to load report analytics.");
      }
    } catch (err: any) {
      console.error("[REPORTS TAB] Error fetching report data:", err);
      setError(err.message || "Failed to load report analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (timeframe !== "custom") {
      fetchReport();
    }
  }, [timeframe]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick(750);
    fetchReport();
  };

  // Count by status from reportData
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      ALL: reportData?.ordersLedger?.length || 0,
      placed: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      failed: 0,
    };
    (reportData?.ordersLedger || []).forEach((o) => {
      const st = (o.orderStatus || "placed").toLowerCase();
      if (counts[st] !== undefined) counts[st] += 1;
      if (st === "refunded") counts.returned += 1;
      if (o.paymentStatus === "failed") counts.failed += 1;
    });
    return counts;
  }, [reportData]);

  // Direct Excel (.CSV) Export with Filter support
  const handleExportExcel = (overrideStatus?: string) => {
    audioSystem.playClick(800);
    const targetStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;
    const url = reportApi.getExportExcelUrl({
      timeframe,
      startDate: timeframe === "custom" ? customStart : undefined,
      endDate: timeframe === "custom" ? customEnd : undefined,
      status: targetStatus !== "ALL" ? targetStatus : undefined,
      paymentMethod: paymentFilter !== "ALL" ? paymentFilter : undefined,
      search: searchQuery.trim() ? searchQuery.trim() : undefined,
    });
    window.open(url, "_blank");
  };

  // Luxury PDF Download via html2canvas-pro & jsPDF
  const handleExportPdf = async () => {
    if (!printReportRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    audioSystem.playClick(850);

    try {
      const canvas = await html2canvas(printReportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Scale proportionally to page width with margins
      const renderWidth = pageWidth - 16;
      const scale = renderWidth / canvasWidth;
      const renderHeight = canvasHeight * scale;

      let heightLeft = renderHeight;
      let position = 10;

      pdf.addImage(imgData, "JPEG", 8, position, renderWidth, renderHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Multi-page slicing if report ledger is long
      while (heightLeft > 0) {
        position = heightLeft - renderHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 8, position, renderWidth, renderHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const statusTag = statusFilter !== "ALL" ? `${statusFilter.toUpperCase()}_` : "";
      const fileName = `DRAPZA_REPORT_${statusTag}${timeframe.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      audioSystem.playSuccess();
    } catch (err: any) {
      console.error("[PDF EXPORT ERROR]", err);
      audioSystem.playClick(300, 0.08);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered Orders for the ledger table
  const filteredOrders = (reportData?.ordersLedger || []).filter((o) => {
    if (statusFilter !== "ALL") {
      const sf = statusFilter.toLowerCase();
      if (sf === "failed") {
        if (o.paymentStatus !== "failed") return false;
      } else if (sf === "returned") {
        if (o.orderStatus !== "returned" && o.orderStatus !== "refunded") return false;
      } else if (o.orderStatus.toLowerCase() !== sf) {
        return false;
      }
    }
    if (paymentFilter !== "ALL" && o.paymentMethod.toUpperCase() !== paymentFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = o.orderNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchEmail = o.customerEmail?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.toLowerCase().includes(q);
      const matchCity = o.city?.toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchEmail && !matchPhone && !matchCity) {
        return false;
      }
    }
    return true;
  });

  // Summary calculations for filtered view
  const isFiltered = statusFilter !== "ALL" || paymentFilter !== "ALL" || Boolean(searchQuery.trim());
  const filteredMetrics = React.useMemo(() => {
    const totalAmount = filteredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const totalUnits = filteredOrders.reduce((acc, o) => acc + (o.itemsCount || 0), 0);
    const completedOrders = filteredOrders.filter(
      (o) => o.orderStatus !== "cancelled" && o.paymentStatus !== "failed"
    );
    const completedAmount = completedOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    return {
      totalOrders: filteredOrders.length,
      totalAmount,
      totalUnits,
      completedOrders: completedOrders.length,
      completedAmount,
    };
  }, [filteredOrders]);

  const summary = reportData?.summary;

  // Responsive, size-aware currency amount renderer to prevent any text clipping or overflow
  const renderKpiAmount = (val: number | undefined) => {
    const num = Number(val || 0);
    const formatted = num.toLocaleString("en-IN");
    const isLarge = formatted.length >= 8; // e.g. 1,59,695 or larger
    return (
      <div
        className={`font-mono font-black text-black tracking-tight tabular-nums truncate leading-none my-1.5 ${
          isLarge
            ? "text-lg sm:text-xl xl:text-[1.22rem] 2xl:text-2xl"
            : "text-xl sm:text-2xl xl:text-[1.38rem] 2xl:text-2xl"
        }`}
        title={`₹${formatted}`}
      >
        <span className="text-[0.8em] font-bold text-neutral-500 mr-0.5">₹</span>
        <span>{formatted}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20 text-black font-sans">
      {/* ─── 1. TOP HEADER & EXPORT ACTIONS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-none bg-black text-white flex items-center justify-center font-bold shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold block">
                ATELIER FINANCIAL &amp; AUDIT INTELLIGENCE
              </span>
              <h1 className="font-mono text-xl sm:text-2xl font-black uppercase text-black tracking-tight">
                SALES, RETURNS &amp; REVENUE REPORTS
              </h1>
            </div>
          </div>
          <p className="font-mono text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Real-time multi-period audit ledger for gross sales, customer returns, order cancellations, payment failures, gateway settlements, and inventory performance.
          </p>
        </div>

        {/* Action Suite: Excel, PDF, Print & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-none bg-white hover:bg-neutral-100 border border-neutral-300 text-black font-mono text-xs uppercase font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-black" : ""}`} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          {/* SEED DEMO ORDERS */}
          <button
            type="button"
            onClick={handleSeedDemoOrders}
            disabled={isLoading || isSeeding}
            className="px-3.5 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-mono text-xs uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Seed diverse demo orders across multiple statuses for report preview"
          >
            <Layers className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin text-black" : "text-black"}`} />
            <span>SEED DEMO</span>
          </button>

          {/* EXCEL EXPORT BUTTON (Aware of selected filter) */}
          <button
            type="button"
            onClick={() => handleExportExcel()}
            disabled={isLoading || !reportData}
            className="px-4 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title={`Download Excel spreadsheet ${statusFilter !== "ALL" ? `for ${statusFilter.toUpperCase()}` : "for all orders"}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>
              {statusFilter === "ALL"
                ? "EXCEL (.CSV)"
                : `EXCEL (${statusFilter.toUpperCase()} - ${filteredOrders.length})`}
            </span>
          </button>

          {/* PDF EXPORT BUTTON (Aware of selected filter) */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isLoading || isExportingPdf || !reportData}
            className="px-4 py-2 rounded-none bg-white hover:bg-neutral-100 text-black border-2 border-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title={`Export PDF report ${statusFilter !== "ALL" ? `for ${statusFilter.toUpperCase()}` : "for all orders"}`}
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <FileText className="w-4 h-4 text-black" />
            )}
            <span>
              {isExportingPdf
                ? "COMPILING PDF..."
                : statusFilter === "ALL"
                ? "DOWNLOAD PDF"
                : `PDF (${statusFilter.toUpperCase()})`}
            </span>
          </button>

          {/* Fallback to export ALL if a filter is currently active */}
          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => handleExportExcel("ALL")}
              disabled={isLoading || !reportData}
              className="px-3 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-mono text-[11px] font-bold uppercase transition-all cursor-pointer shadow-sm"
              title="Download all orders without filter in Excel"
            >
              <span>EXPORT ALL (.CSV)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            disabled={isLoading || !reportData}
            className="px-3.5 py-2 rounded-none bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 font-mono text-xs uppercase transition-all flex items-center gap-2 cursor-pointer hidden sm:inline-flex shadow-sm"
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5 text-black" />
            <span>PRINT</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TIMEFRAME SELECTOR TOOLBAR ─── */}
      <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-black font-mono text-xs uppercase font-black tracking-wider">
            <Calendar className="w-4 h-4 text-black" />
            <span>SELECT AUDIT TIMEFRAME:</span>
          </div>

          {/* Quick Preset Timeframe Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "today", label: "TODAY" },
              { id: "yesterday", label: "YESTERDAY" },
              { id: "week", label: "7 DAYS" },
              { id: "this_month", label: "THIS MONTH" },
              { id: "last_month", label: "LAST MONTH" },
              { id: "this_year", label: "THIS YEAR (1Y)" },
              { id: "3_years", label: "LAST 3 YEARS (3Y)" },
              { id: "all_time", label: "ALL TIME" },
              { id: "custom", label: "CUSTOM RANGE" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  audioSystem.playClick(700);
                  setTimeframe(preset.id as TimeframePreset);
                }}
                className={`px-3 py-1.5 rounded-none font-mono text-[11px] uppercase font-bold transition-all cursor-pointer ${
                  timeframe === preset.id
                    ? "bg-black text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker Form (visible when CUSTOM is active) */}
        {timeframe === "custom" && (
          <form
            onSubmit={handleApplyCustom}
            className="pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-4 bg-neutral-50 p-4 rounded-none animate-in fade-in duration-200 border border-neutral-200"
          >
            <div className="flex items-center gap-2">
              <label className="font-mono text-[10px] uppercase text-neutral-600 font-bold">
                START DATE:
              </label>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-none bg-white border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black transition-colors cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-mono text-[10px] uppercase text-neutral-600 font-bold">
                END DATE:
              </label>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-none bg-white border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black transition-colors cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-none bg-black text-white font-mono text-xs font-bold uppercase hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              APPLY CUSTOM RANGE
            </button>
          </form>
        )}

        {/* Active Period Status Pill */}
        {reportData?.timeframe && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-neutral-500 font-mono text-[11px] pt-1 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
              <span>
                ACTIVE PERIOD: <strong className="text-black uppercase">{reportData.timeframe.label}</strong>
              </span>
              <span>•</span>
              <span>{reportData.timeframe.daySpan} Days Tracked</span>
            </div>
            <div className="text-neutral-500 text-[11px] font-medium">
              {new Date(reportData.timeframe.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              —{" "}
              {new Date(reportData.timeframe.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── 2.5 STATUS FILTER & DIRECT EXPORT TOOLBAR (Placed, Delivered, Shipped, Cancelled, Returned, Failed) ─── */}
      <div className="p-4 sm:p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-black" />
            <span className="font-mono text-xs uppercase font-black tracking-wider text-black">
              FILTER &amp; DOWNLOAD BY ORDER STATUS:
            </span>
            {statusFilter !== "ALL" && (
              <span className="px-2 py-0.5 rounded-none bg-black text-white text-[10px] font-mono font-bold uppercase">
                {statusFilter} ({filteredOrders.length} ORDERS)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {statusFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(600);
                  setStatusFilter("ALL");
                }}
                className="text-[11px] font-bold text-neutral-500 hover:text-black underline cursor-pointer mr-2"
              >
                CLEAR FILTER (SHOW ALL)
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExportExcel()}
              disabled={isLoading || !reportData}
              className="px-3 py-1.5 rounded-none bg-black text-white font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm text-[11px]"
              title={`Download ${statusFilter !== "ALL" ? statusFilter.toUpperCase() : "ALL"} orders in Excel`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>DOWNLOAD {statusFilter !== "ALL" ? statusFilter.toUpperCase() : "ALL"} EXCEL</span>
            </button>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: "ALL", label: "ALL ORDERS", count: statusCounts.ALL },
            { id: "placed", label: "PLACED", count: statusCounts.placed },
            { id: "confirmed", label: "CONFIRMED", count: statusCounts.confirmed },
            { id: "processing", label: "PROCESSING", count: statusCounts.processing },
            { id: "shipped", label: "SHIPPED", count: statusCounts.shipped },
            { id: "delivered", label: "DELIVERED", count: statusCounts.delivered },
            { id: "cancelled", label: "CANCELLED", count: statusCounts.cancelled },
            { id: "returned", label: "RETURNED", count: statusCounts.returned },
            { id: "failed", label: "FAILED PAYMENT", count: statusCounts.failed },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audioSystem.playClick(720);
                  setStatusFilter(tab.id);
                }}
                className={`px-3 py-1.5 rounded-none font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-black text-white shadow-sm ring-1 ring-black"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border border-neutral-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-none text-[10px] font-mono ${
                    active ? "bg-white text-black font-extrabold" : "bg-neutral-200 text-neutral-800"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-none bg-neutral-100 border-2 border-black text-black font-mono text-xs flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-black" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* ─── 3. CORE FINANCIAL KPIS GRID (Sells, Returns, Cancellations, Fails, Net) ─── */}
      {isLoading ? (
        <AdminKpiSkeleton count={6} />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {/* KPI 1: Gross Sales (Sells) */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                GROSS SALES (SELLS)
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-black text-white flex items-center justify-center font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.grossSales)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-neutral-600">
              <span className="font-medium truncate" title={`${summary?.completedOrders || 0} Orders`}>
                {summary?.completedOrders || 0} Orders
              </span>
              {summary?.deltas && (
                <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-none bg-black text-white text-[10px] font-bold">
                  {summary.deltas.salesDelta >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                  )}
                  {Math.abs(summary.deltas.salesDelta)}%
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title={`${summary?.unitsSold || 0} garment units sold`}>
              {summary?.unitsSold || 0} garment units sold
            </span>
          </div>
        </div>

        {/* KPI 2: Returns & Refunds */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                TOTAL RETURNS
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black group-hover:border-black transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.returnAmount)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
              <span className="text-neutral-600 font-medium truncate" title={`${summary?.returnCount || 0} Returned`}>
                {summary?.returnCount || 0} Returned
              </span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-none bg-neutral-100 text-black border border-neutral-300 font-bold text-[10px]">
                {summary?.returnRate || 0}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title="Reverse logistics & refunds">
              Reverse logistics &amp; refunds
            </span>
          </div>
        </div>

        {/* KPI 3: Cancellations */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                CANCELLED ORDERS
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black group-hover:border-black transition-colors">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.cancellationAmount)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
              <span className="text-neutral-600 font-medium truncate" title={`${summary?.cancellationCount || 0} Cancelled`}>
                {summary?.cancellationCount || 0} Cancelled
              </span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-none bg-neutral-100 text-black border border-neutral-300 font-bold text-[10px]">
                {summary?.cancellationRate || 0}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title="Pre-dispatch cancellations">
              Pre-dispatch cancellations
            </span>
          </div>
        </div>

        {/* KPI 4: Failed Transactions */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                FAILED ORDERS
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black group-hover:border-black transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.failedAmount)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
              <span className="text-neutral-600 font-medium truncate" title={`${summary?.failedCount || 0} Failed Attempts`}>
                {summary?.failedCount || 0} Failed
              </span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-none bg-neutral-100 text-black border border-neutral-300 font-bold text-[10px]">
                {summary?.failureRate || 0}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title="Bank dropoffs & timeouts">
              Bank dropoffs &amp; timeouts
            </span>
          </div>
        </div>

        {/* KPI 5: Net Realized Revenue */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                NET REVENUE
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-black text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.netRevenue)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-neutral-600">
              <span className="font-medium truncate" title={`Delivered: ₹${Number(summary?.deliveredSales || 0).toLocaleString("en-IN")}`}>
                Deliv: ₹{Number(summary?.deliveredSales || 0).toLocaleString("en-IN")}
              </span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-none bg-black text-white font-bold text-[9px] uppercase tracking-wider">
                REALIZED
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title="Gross Sales minus Returns">
              Gross Sales minus Returns
            </span>
          </div>
        </div>

        {/* KPI 6: Average Order Value (AOV) */}
        <div className="p-3.5 sm:p-4 rounded-none bg-white border border-neutral-200 relative overflow-hidden shadow-xs hover:shadow-md hover:border-black transition-all flex flex-col justify-between min-h-[168px] group">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold leading-snug">
                AVERAGE ORDER VALUE
              </span>
              <div className="w-7 h-7 shrink-0 rounded-none bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black group-hover:border-black transition-colors">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            {renderKpiAmount(summary?.aov)}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-neutral-600">
              <span className="font-medium truncate" title={`${summary?.totalOrders || 0} Total Orders`}>
                {summary?.totalOrders || 0} Orders
              </span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-none bg-neutral-100 text-black border border-neutral-300 font-bold text-[9px] uppercase tracking-tight">
                PER BASKET
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-1 truncate" title="Average transaction volume">
              Average transaction volume
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ─── 4. INTERACTIVE TIMELINE TREND GRAPH (Sales & Returns Over Time) ─── */}
      <div className="p-6 rounded-none bg-white border border-neutral-200 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
              CHRONOLOGICAL AUDIT TRAIL
            </span>
            <h2 className="font-mono text-base font-bold uppercase text-black tracking-wider flex items-center gap-2">
              <span>SALES, RETURNS &amp; CANCELLATION TIMELINE</span>
              <span className="text-xs text-neutral-500 font-normal">
                ({reportData?.timelineSeries?.length || 0} Time Buckets)
              </span>
            </h2>
          </div>

          {/* Graph Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-black font-bold">
              <span className="w-2.5 h-2.5 rounded-none bg-black" />
              <span>Gross Sales (₹)</span>
            </span>
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="w-2.5 h-2.5 rounded-none bg-neutral-400" />
              <span>Returns</span>
            </span>
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="w-2.5 h-2.5 rounded-none border border-black bg-white" />
              <span>Cancelled</span>
            </span>
          </div>
        </div>

        {/* Timeline Chart Bars */}
        {reportData?.timelineSeries && reportData.timelineSeries.length > 0 ? (
          <div className="space-y-3">
            {/* Max scale calculation */}
            {(() => {
              const maxSale = Math.max(...reportData.timelineSeries.map((t) => t.sales), 1);
              return (
                <div className="space-y-2.5 pt-2">
                  {reportData.timelineSeries.map((item) => {
                    const widthPercent = Math.max(3, Math.min(100, (item.sales / maxSale) * 100));
                    return (
                      <div
                        key={item.date}
                        className="p-3 rounded-none bg-neutral-50 hover:bg-neutral-100/90 transition-colors border border-neutral-200 space-y-2 group"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-black font-bold">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2.5">
                            {item.returnsCount > 0 && (
                              <span className="text-[10px] text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-none font-bold">
                                {item.returnsCount} Returned
                              </span>
                            )}
                            {item.cancellationsCount > 0 && (
                              <span className="text-[10px] text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-none font-bold">
                                {item.cancellationsCount} Cancelled
                              </span>
                            )}
                            <span className="text-black font-black">
                              ₹{item.sales.toLocaleString("en-IN")}{" "}
                              <span className="text-neutral-500 font-normal">
                                ({item.ordersCount} orders)
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full h-2 rounded-none bg-neutral-200 overflow-hidden flex">
                          <div
                            style={{ width: `${widthPercent}%` }}
                            className="h-full bg-black transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500 font-mono text-xs">
            No order activity recorded during this timeframe. Try selecting a wider date range.
          </div>
        )}
      </div>

      {/* ─── 5. BREAKDOWN MODULES: PAYMENT METHODS & FULFILLMENT FUNNEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Gateways Breakdown */}
        <div className="p-6 rounded-none bg-white border border-neutral-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                GATEWAYS &amp; SETTLEMENTS
              </span>
              <h3 className="font-mono text-sm font-bold uppercase text-black tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black" />
                <span>PAYMENT METHOD SHARE</span>
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-black">
              ₹{Number(summary?.grossSales || 0).toLocaleString("en-IN")} Total
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {(reportData?.paymentMethodsBreakdown || []).map((pm) => (
              <div
                key={pm.method}
                className="p-3.5 rounded-none bg-neutral-50 border border-neutral-200 space-y-2"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-black uppercase tracking-wider">
                    {pm.method === "CASHFREE"
                      ? "CASHFREE SECURE (CARDS, UPI)"
                      : pm.method === "RAZORPAY"
                      ? "RAZORPAY GATEWAY"
                      : pm.method === "UPI_DIRECT"
                      ? "DIRECT UPI SCAN & PAY"
                      : "CASH ON DELIVERY (COD)"}
                  </span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-neutral-500">{pm.ordersCount} orders</span>
                    <span>•</span>
                    <span className="text-black">₹{pm.totalAmount.toLocaleString("en-IN")}</span>
                    <span className="px-2 py-0.5 rounded-none bg-black text-white text-[10px] font-mono">
                      {pm.percentageShare}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-none bg-neutral-200 overflow-hidden">
                  <div
                    style={{ width: `${pm.percentageShare}%` }}
                    className="h-full bg-black transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Fulfillment Status Funnel */}
        <div className="p-6 rounded-none bg-white border border-neutral-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                ORDER LIFECYCLE
              </span>
              <h3 className="font-mono text-sm font-bold uppercase text-black tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-black" />
                <span>FULFILLMENT PIPELINE</span>
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-black">
              {summary?.totalOrders || 0} Total Orders
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {(reportData?.statusBreakdown || []).map((sb) => {
              const isSelected = statusFilter.toLowerCase() === sb.status.toLowerCase();
              return (
                <div
                  key={sb.status}
                  onClick={() => {
                    audioSystem.playClick(740);
                    setStatusFilter(isSelected ? "ALL" : sb.status);
                  }}
                  className={`p-3 rounded-none border transition-all cursor-pointer text-center group relative ${
                    isSelected
                      ? "border-2 border-black bg-neutral-100 shadow-sm ring-1 ring-black"
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-black"
                  }`}
                  title={`Click to filter orders by ${sb.status.toUpperCase()}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-600 group-hover:text-black">
                      {sb.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportExcel(sb.status);
                      }}
                      title={`Download ${sb.status.toUpperCase()} orders in Excel`}
                      className="p-1 rounded-none hover:bg-black hover:text-white text-neutral-400 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-mono text-xl font-black text-black block">
                    {sb.count}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500 block font-medium">
                    ₹{sb.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Financial summary metrics strip */}
          <div className="pt-3 border-t border-neutral-200 grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="p-2.5 rounded-none bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Garment Subtotal</span>
              <span className="font-bold text-black">₹{Number(summary?.totalItemsPrice || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="p-2.5 rounded-none bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">GST Tax Collected</span>
              <span className="font-bold text-black">₹{Number(summary?.totalTaxCollected || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="p-2.5 rounded-none bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Shipping Charges</span>
              <span className="font-bold text-black">₹{Number(summary?.totalShippingCollected || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. TOP PERFORMING GARMENTS / PRODUCTS TABLE ─── */}
      <div className="p-6 rounded-none bg-white border border-neutral-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
              INVENTORY PERFORMANCE
            </span>
            <h3 className="font-mono text-base font-bold uppercase text-black tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-black" />
              <span>TOP SELLING GARMENTS IN TIMEFRAME</span>
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Top 10 Ranked by Revenue
          </span>
        </div>

        {reportData?.topProducts && reportData.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold"># RANK</th>
                  <th className="pb-3 font-bold">GARMENT / SILHOUETTE</th>
                  <th className="pb-3 font-bold text-right">UNITS SOLD</th>
                  <th className="pb-3 font-bold text-right">ORDERS COUNT</th>
                  <th className="pb-3 font-bold text-right">TOTAL REVENUE (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reportData.topProducts.map((prod, idx) => (
                  <tr key={prod.id || idx} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-bold text-neutral-500">#{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-none bg-neutral-100 border border-neutral-200 shrink-0"
                        />
                        <span className="font-bold text-black uppercase tracking-tight truncate max-w-xs">
                          {prod.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold text-neutral-800">{prod.unitsSold} units</td>
                    <td className="py-3 text-right text-neutral-500">{prod.orderCount} orders</td>
                    <td className="py-3 text-right font-black text-black">
                      ₹{prod.revenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-500 font-mono text-xs">
            No garment sales logged for this timeframe.
          </div>
        )}
      </div>

      {/* ─── 7. DETAILED TRANSACTIONS AUDIT LEDGER TABLE ─── */}
      <div className="p-6 rounded-none bg-white border border-neutral-200 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
              TRANSACTION AUDIT LEDGER
            </span>
            <h3 className="font-mono text-base font-bold uppercase text-black tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-black" />
              <span>DETAILED ORDERS IN REPORT</span>
              <span className="text-xs text-neutral-500 font-normal">
                ({filteredOrders.length} of {reportData?.ordersLedger?.length || 0} shown)
              </span>
            </h3>
          </div>

          {/* Search and Filters Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, client, phone..."
                className="pl-9 pr-3 py-1.5 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-black w-48 sm:w-64 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black cursor-pointer font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="placed">Placed ({statusCounts.placed})</option>
              <option value="confirmed">Confirmed ({statusCounts.confirmed})</option>
              <option value="processing">Processing ({statusCounts.processing})</option>
              <option value="shipped">Shipped ({statusCounts.shipped})</option>
              <option value="delivered">Delivered ({statusCounts.delivered})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
              <option value="returned">Returned ({statusCounts.returned})</option>
              <option value="failed">Failed Payment ({statusCounts.failed})</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-none bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:outline-none focus:border-black cursor-pointer font-bold"
            >
              <option value="ALL">All Gateways</option>
              <option value="CASHFREE">Cashfree</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="UPI_DIRECT">Direct UPI</option>
              <option value="COD">COD</option>
            </select>

            {/* Quick Export Actions for Current Filtered Table */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                type="button"
                onClick={() => handleExportExcel()}
                disabled={isLoading || filteredOrders.length === 0}
                className="px-3 py-1.5 rounded-none bg-black text-white hover:bg-neutral-800 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title={`Export ${filteredOrders.length} filtered orders to Excel`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV ({filteredOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isLoading || isExportingPdf || filteredOrders.length === 0}
                className="px-3 py-1.5 rounded-none bg-white border border-black text-black hover:bg-neutral-100 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title={`Export ${filteredOrders.length} filtered orders to PDF`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {isLoading ? (
          <div className="p-4">
            <AdminTableSkeleton columns={7} rows={6} ariaLabel="Loading order transactions ledger..." />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">ORDER REF</th>
                  <th className="pb-3 font-bold">DATE &amp; TIME</th>
                  <th className="pb-3 font-bold">CLIENT &amp; DESTINATION</th>
                  <th className="pb-3 font-bold">GATEWAY</th>
                  <th className="pb-3 font-bold">FULFILLMENT</th>
                  <th className="pb-3 font-bold text-right">ITEMS</th>
                  <th className="pb-3 font-bold text-right">FINAL TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((ord) => {
                  const isReturned = ord.orderStatus === "returned" || ord.orderStatus === "refunded";
                  const isCancelled = ord.orderStatus === "cancelled";
                  const isFailed = ord.paymentStatus === "failed";
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-black uppercase">{ord.orderNumber}</div>
                        <span className="text-[10px] text-neutral-500 block">
                          TRK: {ord.trackingNumber || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-600 text-[11px]">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="text-neutral-400 block text-[10px]">
                          {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-black block uppercase truncate max-w-xs">
                          {ord.customerName}
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          {ord.city}, {ord.state}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-neutral-800 block uppercase text-[11px]">
                          {ord.paymentMethod}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold ${
                            isFailed ? "text-neutral-500 underline decoration-black" : "text-neutral-500"
                          }`}
                        >
                          PAY: {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-none text-[10px] uppercase font-bold tracking-wider inline-block ${
                            ord.orderStatus === "delivered"
                              ? "bg-black text-white"
                              : isReturned
                              ? "bg-neutral-200 text-black border border-neutral-300"
                              : isCancelled
                              ? "bg-neutral-100 text-neutral-500 border border-neutral-200 line-through"
                              : isFailed
                              ? "bg-neutral-200 text-black border border-neutral-400"
                              : "bg-neutral-100 text-black border border-neutral-200"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right text-neutral-600">
                        {ord.itemsCount} {ord.itemsCount === 1 ? "pc" : "pcs"}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-black text-sm block ${
                            isCancelled || isReturned ? "line-through text-neutral-400" : "text-black"
                          }`}
                        >
                          ₹{ord.totalPrice.toLocaleString("en-IN")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500 font-mono text-xs">
            No transactions matched your search/filter criteria.
          </div>
        )}
      </div>

      {/* ─── 8. HIDDEN HIGH-RES A4 PDF EXPORT TEMPLATE (Rendered offscreen for crisp capture) ─── */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
        <div
          ref={printReportRef}
          style={{ width: "800px", minHeight: "1130px", backgroundColor: "#ffffff", color: "#000000" }}
          className="p-10 font-sans space-y-6"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-end">
            <div>
              <span className="font-mono text-xs uppercase font-bold tracking-[0.25em] text-neutral-500 block mb-1">
                DRAPZA ATELIER LUXURY ARCHITECTURE // OFFICIAL AUDIT
              </span>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                SALES &amp; FINANCIAL REPORT
              </h1>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-black block">
                PERIOD: {(reportData?.timeframe?.label || timeframe).toUpperCase()}
              </span>
              <span className="text-neutral-500 text-[10px]">
                GENERATED: {new Date().toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Header Banner */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-end">
            <div>
              <span className="font-mono text-xs uppercase font-bold tracking-[0.25em] text-neutral-500 block mb-1">
                DRAPZA ATELIER LUXURY ARCHITECTURE // OFFICIAL AUDIT
              </span>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                SALES &amp; FINANCIAL REPORT
              </h1>
              {isFiltered && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-none bg-black text-white font-mono text-[11px] font-bold uppercase">
                    FILTER APPLIED: {statusFilter !== "ALL" ? `STATUS = ${statusFilter.toUpperCase()}` : ""}{" "}
                    {paymentFilter !== "ALL" ? `| GATEWAY = ${paymentFilter.toUpperCase()}` : ""}{" "}
                    ({filteredOrders.length} MATCHING ORDERS)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-black block">
                PERIOD: {(reportData?.timeframe?.label || timeframe).toUpperCase()}
              </span>
              <span className="text-neutral-500 text-[10px]">
                GENERATED: {new Date().toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Executive KPI Summary 4-Box Grid (Filter-Aware) */}
          <div className="grid grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-neutral-100 rounded-none border border-neutral-300">
              <span className="text-[10px] text-neutral-600 uppercase block font-bold">
                {isFiltered ? "FILTERED ORDERS" : "GROSS SALES (SELLS)"}
              </span>
              <span className="text-lg font-black text-black block mt-0.5">
                {isFiltered
                  ? `${filteredMetrics.totalOrders} orders`
                  : `₹${Number(summary?.grossSales || 0).toLocaleString("en-IN")}`}
              </span>
              <span className="text-[9px] text-neutral-500 block mt-1">
                {isFiltered
                  ? `${filteredMetrics.totalUnits} garment units`
                  : `${summary?.completedOrders || 0} orders (${summary?.unitsSold || 0} pcs)`}
              </span>
            </div>

            <div className="p-3 bg-neutral-100 rounded-none border border-neutral-300">
              <span className="text-[10px] text-neutral-600 uppercase block font-bold">
                {isFiltered ? "TOTAL IN FILTER" : "TOTAL RETURNS"}
              </span>
              <span className="text-lg font-black text-black block mt-0.5">
                {isFiltered
                  ? `₹${filteredMetrics.totalAmount.toLocaleString("en-IN")}`
                  : `₹${Number(summary?.returnAmount || 0).toLocaleString("en-IN")}`}
              </span>
              <span className="text-[9px] text-neutral-500 block mt-1">
                {isFiltered
                  ? `Average: ₹${filteredMetrics.totalOrders > 0 ? Math.round(filteredMetrics.totalAmount / filteredMetrics.totalOrders).toLocaleString("en-IN") : 0}`
                  : `${summary?.returnCount || 0} orders (${summary?.returnRate || 0}%)`}
              </span>
            </div>

            <div className="p-3 bg-neutral-100 rounded-none border border-neutral-300">
              <span className="text-[10px] text-neutral-600 uppercase block font-bold">
                {isFiltered ? "COMPLETED IN FILTER" : "CANCELLATIONS"}
              </span>
              <span className="text-lg font-black text-black block mt-0.5">
                {isFiltered
                  ? `${filteredMetrics.completedOrders} orders`
                  : `₹${Number(summary?.cancellationAmount || 0).toLocaleString("en-IN")}`}
              </span>
              <span className="text-[9px] text-neutral-500 block mt-1">
                {isFiltered
                  ? `₹${filteredMetrics.completedAmount.toLocaleString("en-IN")} volume`
                  : `${summary?.cancellationCount || 0} orders (${summary?.cancellationRate || 0}%)`}
              </span>
            </div>

            <div className="p-3 bg-neutral-100 rounded-none border border-neutral-300">
              <span className="text-[10px] text-neutral-600 uppercase block font-bold">
                {isFiltered ? "STATUS APPLIED" : "FAILED ORDERS"}
              </span>
              <span className="text-lg font-black text-black block mt-0.5 uppercase">
                {isFiltered ? statusFilter : `₹${Number(summary?.failedAmount || 0).toLocaleString("en-IN")}`}
              </span>
              <span className="text-[9px] text-neutral-500 block mt-1">
                {isFiltered
                  ? `Gateway: ${paymentFilter}`
                  : `${summary?.failedCount || 0} orders (${summary?.failureRate || 0}%)`}
              </span>
            </div>
          </div>

          {/* Secondary Financial Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center border border-neutral-200 p-2.5 rounded-none bg-neutral-50">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">NET REALIZED REVENUE</span>
              <span className="font-black text-sm text-black">
                ₹{Number(summary?.netRevenue || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">AVERAGE ORDER VALUE (AOV)</span>
              <span className="font-black text-sm text-black">
                ₹{Number(summary?.aov || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">TOTAL GST TAX COLLECTED</span>
              <span className="font-black text-sm text-black">
                ₹{Number(summary?.totalTaxCollected || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Payment Gateways Performance Table */}
          <div className="space-y-2 font-mono text-xs">
            <span className="font-bold text-black uppercase tracking-wider block border-b border-black pb-1">
              PAYMENT GATEWAY DISTRIBUTION
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(reportData?.paymentMethodsBreakdown || []).map((pm) => (
                <div key={pm.method} className="p-2 border border-neutral-300 rounded-none text-left">
                  <span className="font-bold block text-[10px] text-neutral-600">{pm.method}</span>
                  <span className="font-bold text-xs block text-black">
                    ₹{pm.totalAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] text-neutral-500 block">
                    {pm.ordersCount} orders ({pm.percentageShare}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Orders Ledger Table for PDF */}
          <div className="space-y-2 font-mono text-[10px]">
            <span className="font-bold text-black uppercase tracking-wider block border-b border-black pb-1">
              TRANSACTION AUDIT LEDGER {isFiltered ? `[FILTER: ${statusFilter.toUpperCase()}]` : ""} (TOP {Math.min(filteredOrders.length, 50)} ENTRIES)
            </span>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-600 font-bold uppercase">
                  <th className="pb-1.5">ORDER #</th>
                  <th className="pb-1.5">DATE</th>
                  <th className="pb-1.5">CLIENT</th>
                  <th className="pb-1.5">GATEWAY</th>
                  <th className="pb-1.5">STATUS</th>
                  <th className="pb-1.5 text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredOrders.slice(0, 50).map((o) => (
                  <tr key={o.id}>
                    <td className="py-1 font-bold">{o.orderNumber}</td>
                    <td className="py-1 text-neutral-600">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-1 truncate max-w-[150px]">{o.customerName}</td>
                    <td className="py-1">{o.paymentMethod}</td>
                    <td className="py-1 uppercase font-bold">{o.orderStatus}</td>
                    <td className="py-1 text-right font-bold">₹{o.totalPrice.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-neutral-300 text-center font-mono text-[9px] text-neutral-500">
            Drapza Luxury Streetwear Architecture • Automated Cryptographic Audit Slip • Official Confidential Records
          </div>
        </div>
      </div>
    </div>
  );
};

