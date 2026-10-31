"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Eye,
  X,
  Radio,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  AlertOctagon,
  Lock,
} from "lucide-react";
import {
  auditLogApi,
  AuditSessionItem,
  RouteHitItem,
  ThreatFlagItem,
  SecurityOverviewData,
  BannedIpItem,
} from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ConfirmModal } from "./ConfirmModal";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getDeviceIcon(device: string) {
  const d = (device || "").toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) {
    return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return <Tablet className="w-3.5 h-3.5 text-indigo-500" />;
  }
  return <Laptop className="w-3.5 h-3.5 text-neutral-600" />;
}

function getStatusBadge(status: string, isOnline?: boolean) {
  if (status === "TERMINATED_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
        <Ban className="w-2.5 h-2.5" />
        KILLED BY ADMIN
      </span>
    );
  }
  if (isOnline || status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
        ONLINE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
      <Clock className="w-2.5 h-2.5" />
      OFFLINE
    </span>
  );
}

function getRiskBadge(level: string, score: number) {
  switch (level) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-red-600 text-white shadow-sm animate-pulse">
          <AlertOctagon className="w-3 h-3" />
          CRITICAL ({score})
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-amber-500 text-black">
          <AlertTriangle className="w-3 h-3" />
          HIGH ({score})
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <AlertTriangle className="w-3 h-3" />
          MEDIUM ({score})
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          SAFE
        </span>
      );
  }
}

export function SecurityAuditAdminTab() {
  const [sessions, setSessions] = useState<AuditSessionItem[]>([]);
  const [overview, setOverview] = useState<SecurityOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);

  // Polling
  const [pollingInterval, setPollingInterval] = useState<number>(0); // 0 = off, 10 = 10s, 30 = 30s
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Route Audit Trail Modal
  const [selectedSessionForTrail, setSelectedSessionForTrail] = useState<AuditSessionItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Firewall Blacklist Modal
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [blacklistedIps, setBlacklistedIps] = useState<BannedIpItem[]>([]);
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(false);
  const [banIpInput, setBanIpInput] = useState("");
  const [banReasonInput, setBanReasonInput] = useState("Proactive Administrative Block");
  const [isBanning, setIsBanning] = useState(false);

  // Lock background body scrolling when audit trail or firewall blacklist modal is open
  useLockBodyScroll(Boolean(selectedSessionForTrail || blacklistModalOpen));

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Atelier Luxury Confirmation / Prompt Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "warning" | "danger" | "reset" | "info" | "prompt";
    type?: "confirm" | "alert" | "prompt";
    promptPlaceholder?: string;
    initialPromptValue?: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  const showFeedback = (text: string, isError = false) => {
    setActionFeedback({ text, isError });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Fetch Overview Stats
  const loadOverview = async () => {
    try {
      const res = await auditLogApi.getOverview();
      if (res && res.success && (res as any).metrics) {
        setOverview({
          metrics: (res as any).metrics,
          recentThreats: (res as any).recentThreats || [],
        });
      }
    } catch (err: any) {
      console.error("[SECURITY] Failed to load overview:", err);
    }
  };

  // Fetch Sessions
  const loadSessions = useCallback(
    async (showLoadingIndicator = false) => {
      if (showLoadingIndicator) setLoading(true);
      try {
        const res = await auditLogApi.getSessions({
          search,
          riskLevel: riskFilter,
          status: statusFilter,
          page,
          limit: 25,
        });

        if (res && res.success) {
          setSessions(res.sessions || []);
          setTotalPages(res.totalPages || 1);
          setTotalSessions(res.total || 0);
        }
      } catch (err: any) {
        console.error("[SECURITY] Failed to load sessions:", err);
      } finally {
        if (showLoadingIndicator) setLoading(false);
      }
    },
    [search, riskFilter, statusFilter, page]
  );

  // Fetch Blacklist
  const loadBlacklist = async () => {
    setIsLoadingBlacklist(true);
    try {
      const res = await auditLogApi.getBlacklist();
      if (res && res.success) {
        setBlacklistedIps(res.blacklistedIps || []);
      }
    } catch (err: any) {
      console.error("[SECURITY] Failed to load blacklist:", err);
    } finally {
      setIsLoadingBlacklist(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadOverview();
    loadSessions(true);
  }, [loadSessions]);

  // Polling setup
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (pollingInterval > 0) {
      pollTimerRef.current = setInterval(() => {
        loadSessions(false);
        loadOverview();
      }, pollingInterval * 1000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [pollingInterval, loadSessions]);

  // Manual Sync
  const handleSyncNow = async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), loadSessions(false)]);
    setRefreshing(false);
    showFeedback("Security Telemetry synced with live server.");
  };

  // Open Trail Modal & Fetch Full Details
  const handleOpenTrail = async (session: AuditSessionItem) => {
    setSelectedSessionForTrail(session);
    setIsLoadingDetail(true);
    try {
      const res = await auditLogApi.getSessionDetail(session.sessionId);
      if (res && res.success && res.session) {
        setSelectedSessionForTrail(res.session);
      }
    } catch (err: any) {
      console.error("[SECURITY] Failed to fetch session details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 1-Click Terminate Active Session
  const handleTerminateSession = (session: AuditSessionItem) => {
    const targetLabel = session.userEmail || session.userName || session.ip;
    setConfirmModalState({
      isOpen: true,
      title: "TERMINATE ACTIVE SESSION",
      subtitle: "[ ACCESS REVOCATION PROTOCOL ]",
      message: `Are you sure you want to FORCE-TERMINATE the active session for [${targetLabel}]? This will immediately revoke their access and invalidate their authentication tokens.`,
      confirmLabel: "FORCE TERMINATE",
      cancelLabel: "CANCEL",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await auditLogApi.terminateSession(session.sessionId);
          if (res && res.success) {
            showFeedback(`Session terminated for ${targetLabel}`);
            loadSessions(false);
            loadOverview();
            if (selectedSessionForTrail?.sessionId === session.sessionId) {
              setSelectedSessionForTrail((prev) =>
                prev ? { ...prev, status: "TERMINATED_ADMIN", isOnline: false } : null
              );
            }
          } else {
            showFeedback(res?.message || "Failed to terminate session", true);
          }
        } catch (err: any) {
          showFeedback(`Error terminating session: ${err.message}`, true);
        }
      },
    });
  };

  // 1-Click IP Ban
  const handleBanIp = (ip: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "FIREWALL IP BLACKLIST",
      subtitle: "[ THREAT MITIGATION PROTOCOL ]",
      message: `Enter reason to ban and blacklist IP [${ip}] from the atelier network:`,
      confirmLabel: "BLACKLIST IP",
      cancelLabel: "CANCEL",
      type: "prompt",
      variant: "prompt",
      promptPlaceholder: "e.g. Suspicious automated scraper or brute force attempts",
      initialPromptValue: "Suspicious/Malicious Activity Detected",
      onConfirm: async (reason) => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await auditLogApi.banIp({ ip, reason: reason || "Manual Ban from Command Center" });
          if (res && res.success) {
            showFeedback(`IP [${ip}] successfully blacklisted on firewall!`);
            loadSessions(false);
            loadOverview();
            if (blacklistModalOpen) loadBlacklist();
          } else {
            showFeedback(res?.message || "Failed to ban IP", true);
          }
        } catch (err: any) {
          showFeedback(`Error banning IP: ${err.message}`, true);
        }
      },
    });
  };

  // Unban IP
  const handleUnbanIp = (ip: string) => {
    setConfirmModalState({
      isOpen: true,
      title: "LIFT FIREWALL BAN",
      subtitle: "[ RESTORE ACCESS PROTOCOL ]",
      message: `Are you sure you want to lift the firewall ban and restore access for IP [${ip}]?`,
      confirmLabel: "RESTORE ACCESS",
      cancelLabel: "KEEP BANNED",
      variant: "warning",
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await auditLogApi.unbanIp(ip);
          if (res && res.success) {
            showFeedback(`Firewall ban removed for IP [${ip}].`);
            loadBlacklist();
            loadOverview();
          } else {
            showFeedback(res?.message || "Failed to unban IP", true);
          }
        } catch (err: any) {
          showFeedback(`Error unbanning IP: ${err.message}`, true);
        }
      },
    });
  };

  // Manual IP Ban from Modal
  const handleAddManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIpInput.trim()) return;

    setIsBanning(true);
    try {
      const res = await auditLogApi.banIp({
        ip: banIpInput.trim(),
        reason: banReasonInput.trim(),
        threatType: "MANUAL_BAN",
      });
      if (res && res.success) {
        showFeedback(`✓ IP [${banIpInput.trim()}] blacklisted.`);
        setBanIpInput("");
        loadBlacklist();
        loadOverview();
        loadSessions(false);
      } else {
        showFeedback(res?.message || "Failed to blacklist IP", true);
      }
    } catch (err: any) {
      showFeedback(`Error: ${err.message}`, true);
    } finally {
      setIsBanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-none flex items-center justify-between text-xs font-bold transition-all ${
            actionFeedback.isError
              ? "bg-red-500 text-white shadow-md shadow-red-500/20"
              : "bg-black text-white shadow-md"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-white/20 rounded-none transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP ATELIER CYBERPUNK SECURITY TELEMETRY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Online Users */}
        <div className="p-4 sm:p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              ACTIVE ONLINE
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-none h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-black">
            {overview?.metrics.activeOnlineCount ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Real-time live user sessions in last 15 min
          </div>
        </div>

        {/* Total Tracked Sessions */}
        <div className="p-4 sm:p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              TOTAL SESSIONS
            </span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-black">
            {overview?.metrics.totalSessions ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Complete telemetry history preserved
          </div>
        </div>

        {/* Threat Flags Detected */}
        <div className="p-4 sm:p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              THREATS DETECTED
            </span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-red-600 flex items-center gap-2">
            <span>{overview?.metrics.totalThreatsFlagged ?? 0}</span>
            {overview?.metrics.criticalThreatCount ? (
              <span className="text-xs px-2 py-0.5 rounded-none bg-red-100 text-red-700 font-bold border border-red-200">
                {overview.metrics.criticalThreatCount} CRITICAL
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Probing, SQLi, XSS, Path Traversal
          </div>
        </div>

        {/* Firewall Blacklist */}
        <div className="p-4 sm:p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              BANNED IPS (FIREWALL)
            </span>
            <Ban className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-black flex items-center justify-between">
            <span>{overview?.metrics.bannedIpCount ?? 0}</span>
            <button
              onClick={() => {
                setBlacklistModalOpen(true);
                loadBlacklist();
              }}
              className="text-[10px] uppercase px-2 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white transition-all font-bold cursor-pointer"
            >
              MANAGE
            </button>
          </div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Instant 403 Forbidden hard block
          </div>
        </div>
      </div>

      {/* RECENT CRITICAL THREAT ALERTS STRIP (if any exist) */}
      {overview?.recentThreats && overview.recentThreats.length > 0 && (
        <div className="p-4 rounded-none bg-red-50/80 border border-red-200/90 shadow-sm">
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse" />
            <span>High-Priority Security Interceptions (Last 24h)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {overview.recentThreats.slice(0, 3).map((threat, idx) => (
              <div
                key={idx}
                className="bg-white/90 p-2.5 rounded-none border border-red-100 flex items-center justify-between text-[11px]"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-neutral-900 truncate">
                    {threat.userEmail || threat.ip}
                  </div>
                  <div className="text-red-600 text-[10px] truncate font-medium">
                    {threat.threatFlags?.[0]?.reason || "Malicious probing detected"}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-red-600 text-white font-bold">
                    {threat.riskLevel}
                  </span>
                  <button
                    onClick={() => handleBanIp(threat.ip)}
                    className="p-1 rounded-none bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                    title="Ban IP immediately"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & ACTIONS BAR */}
      <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by IP, Email, Name, Device, Route Hit..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-none bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Risk Level Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-none text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase font-bold px-2">Risk:</span>
              {["ALL", "CRITICAL", "HIGH", "SAFE"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setRiskFilter(lvl);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-none font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    riskFilter === lvl
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-none text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase font-bold px-2">Status:</span>
              {[
                { id: "ALL", label: "ALL" },
                { id: "ACTIVE", label: "ONLINE" },
                { id: "INACTIVE", label: "OFFLINE" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setStatusFilter(st.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-none font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    statusFilter === st.id
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-none text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase font-bold px-2 flex items-center gap-1">
                <Radio className={`w-3 h-3 ${pollingInterval > 0 ? "text-emerald-500 animate-pulse" : ""}`} />
                AUTO:
              </span>
              {[
                { val: 0, label: "OFF" },
                { val: 10, label: "10S" },
                { val: 30, label: "30S" },
              ].map((poll) => (
                <button
                  key={poll.val}
                  onClick={() => setPollingInterval(poll.val)}
                  className={`px-2 py-1 rounded-none font-bold text-[10px] transition-all cursor-pointer ${
                    pollingInterval === poll.val
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                  }`}
                >
                  {poll.label}
                </button>
              ))}
            </div>

            {/* Sync Now */}
            <button
              onClick={handleSyncNow}
              disabled={refreshing}
              className="p-2 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border border-neutral-200 transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="Sync Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-black" : ""}`} />
              <span className="hidden sm:inline text-[10px] font-bold">SYNC</span>
            </button>

            {/* Firewall Blacklist */}
            <button
              onClick={() => {
                setBlacklistModalOpen(true);
                loadBlacklist();
              }}
              className="px-3 py-2 rounded-none bg-neutral-900 hover:bg-black text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span>FIREWALL IP BLACKLIST</span>
            </button>

            {/* Export Dropdown */}
            <a
              href={auditLogApi.getExportUrl("csv")}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Download full audit log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>CSV</span>
            </a>

            <a
              href={auditLogApi.getExportUrl("json")}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>JSON</span>
            </a>
          </div>
        </div>
      </div>

      {/* SESSIONS AUDIT TABLE */}
      <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              LIVE SESSION TELEMETRY & ROUTE AUDIT TRAIL
            </span>
            <span className="text-[10px] text-neutral-500">
              ({totalSessions} sessions recorded)
            </span>
          </div>

          <div className="text-[10px] text-neutral-500">
            Showing Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-black" />
            <p className="text-xs text-neutral-500 tracking-wider">Decoding Security Telemetry Vault...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs text-neutral-500 font-bold uppercase">No Audit Sessions Match Active Filter Criteria</p>
            <p className="text-[11px] text-neutral-400">Try adjusting your search query, risk rating or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-50/50">
                  <th className="py-3 px-4">User & Authentication</th>
                  <th className="py-3 px-4">IP & Geolocation</th>
                  <th className="py-3 px-4">Device & Client</th>
                  <th className="py-3 px-4">Session Duration</th>
                  <th className="py-3 px-4">Threat Risk</th>
                  <th className="py-3 px-4 text-center">Route Hits</th>
                  <th className="py-3 px-4 text-right">Countermeasures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {sessions.map((session) => {
                  const hasThreats = session.threatFlags && session.threatFlags.length > 0;
                  const isTerminated = session.status === "TERMINATED_ADMIN";

                  return (
                    <tr
                      key={session.sessionId}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        session.riskLevel === "CRITICAL"
                          ? "bg-red-50/40"
                          : session.riskLevel === "HIGH"
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      {/* User & Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-[11px] text-neutral-700 uppercase shrink-0">
                            {session.userName ? session.userName.charAt(0) : "G"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-neutral-900 truncate">
                              {session.userName || "Guest Anonymous"}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">
                              {session.userEmail || "No authenticated account"}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-none uppercase font-bold ${
                                  session.userRole === "admin"
                                    ? "bg-black text-white"
                                    : "bg-neutral-100 text-neutral-600"
                                }`}
                              >
                                {session.userRole || "guest"}
                              </span>
                              {getStatusBadge(session.status, session.isOnline)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-neutral-400" />
                            <span>{session.ip}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {[session.city, session.region, session.country].filter(Boolean).join(", ") ||
                              "Location undetected (Local / Proxy)"}
                          </div>
                        </div>
                      </td>

                      {/* Device & Client */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-neutral-800 font-medium">
                            {getDeviceIcon(session.device)}
                            <span>{session.device || "Desktop"}</span>
                            <span className="text-neutral-400 text-[10px]">({session.os || "OS"})</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 truncate max-w-[160px]" title={session.userAgent}>
                            {session.browser || "Unknown Browser"}
                          </div>
                        </div>
                      </td>

                      {/* Duration & Login Time */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-neutral-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{formatDuration(session.durationSeconds)}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Logged in: {formatRelativeTime(session.loginAt)}
                          </div>
                          <div className="text-[9.5px] text-neutral-400">
                            Active: {formatRelativeTime(session.lastActiveAt)}
                          </div>
                        </div>
                      </td>

                      {/* Threat Risk & Flags */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div>{getRiskBadge(session.riskLevel, session.riskScore)}</div>
                          {hasThreats && (
                            <div className="text-[9.5px] text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{session.threatFlags[0].type}</span>
                              {session.threatFlags.length > 1 && (
                                <span className="text-neutral-500">
                                  (+{session.threatFlags.length - 1} more)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Route Hits Count */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenTrail(session)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white transition-all text-[11px] font-bold cursor-pointer group"
                        >
                          <span>{session.routeHitsCount || 0} hits</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>

                      {/* Countermeasures & Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Route Audit Trail Modal Button */}
                          <button
                            onClick={() => handleOpenTrail(session)}
                            className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                            title="Inspect chronological route audit trail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Terminate Active Session */}
                          {!isTerminated && (
                            <button
                              onClick={() => handleTerminateSession(session)}
                              className="px-2 py-1 rounded-none bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-all font-bold text-[10px] cursor-pointer flex items-center gap-1"
                              title="Immediately invalidate tokens and force-logout user"
                            >
                              <UserX className="w-3 h-3" />
                              <span className="hidden sm:inline">KILL</span>
                            </button>
                          )}

                          {/* 1-Click Firewall Ban IP */}
                          <button
                            onClick={() => handleBanIp(session.ip)}
                            className="p-1.5 rounded-none bg-neutral-100 hover:bg-black text-neutral-600 hover:text-white transition-colors cursor-pointer"
                            title={`Add IP ${session.ip} to Firewall Blacklist`}
                          >
                            <Ban className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-none bg-white border border-neutral-200 font-bold hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREVIOUS</span>
            </button>

            <span className="text-neutral-500 text-[11px] font-bold">
              PAGE {page} OF {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-none bg-white border border-neutral-200 font-bold hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: CHRONOLOGICAL ROUTE AUDIT TRAIL MODAL */}
      {selectedSessionForTrail && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white border border-neutral-200 rounded-none w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp font-mono my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    CHRONOLOGICAL ROUTE AUDIT TRAIL
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <span>{selectedSessionForTrail.userEmail || selectedSessionForTrail.userName || "Guest Session"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-none bg-neutral-200 text-neutral-700 font-mono font-normal">
                    {selectedSessionForTrail.ip}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedSessionForTrail.status === "ACTIVE" && (
                  <button
                    onClick={() => handleTerminateSession(selectedSessionForTrail)}
                    className="px-3 py-1.5 rounded-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>TERMINATE SESSION</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSessionForTrail(null)}
                  className="p-2 rounded-none bg-neutral-200 hover:bg-neutral-300 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Summary Strip */}
            <div className="px-5 py-3 bg-neutral-100/70 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Active Duration</span>
                <span className="font-bold text-neutral-900">
                  {formatDuration(selectedSessionForTrail.durationSeconds)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Device / OS</span>
                <span className="font-bold text-neutral-900">
                  {selectedSessionForTrail.device} / {selectedSessionForTrail.os}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Risk Evaluation</span>
                <span>{getRiskBadge(selectedSessionForTrail.riskLevel, selectedSessionForTrail.riskScore)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Total Route Hits</span>
                <span className="font-bold text-neutral-900">
                  {selectedSessionForTrail.routeHits?.length || selectedSessionForTrail.routeHitsCount || 0} hits
                </span>
              </div>
            </div>

            {/* Threat Flags Alert Box (if present in session) */}
            {selectedSessionForTrail.threatFlags && selectedSessionForTrail.threatFlags.length > 0 && (
              <div className="p-4 bg-red-50 border-b border-red-200 shrink-0 space-y-1.5">
                <div className="text-xs font-bold text-red-700 uppercase flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <span>Threat Intelligence Flags ({selectedSessionForTrail.threatFlags.length})</span>
                </div>
                <div className="space-y-1">
                  {selectedSessionForTrail.threatFlags.map((flag, idx) => (
                    <div key={idx} className="text-[11px] text-red-800 flex items-start gap-2">
                      <span className="font-bold shrink-0">[{flag.type}]:</span>
                      <span>{flag.reason}</span>
                      {flag.path && <span className="text-neutral-500 font-mono">({flag.path})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chronological Route Breadcrumbs List */}
            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth p-5 space-y-2"
            >
              {isLoadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-black" />
                  <span className="text-xs text-neutral-500">Unpacking route hits from telemetry archive...</span>
                </div>
              ) : !selectedSessionForTrail.routeHits || selectedSessionForTrail.routeHits.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No individual route hits recorded for this session yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSessionForTrail.routeHits.map((hit, idx) => {
                    const isThreat = hit.threatDetected;
                    const isError = hit.statusCode >= 400;
                    const method = (hit.method || "GET").toUpperCase();

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-none border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                          isThreat
                            ? "bg-red-50/80 border-red-200"
                            : isError
                            ? "bg-amber-50/50 border-amber-200"
                            : "bg-white border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Method Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-none text-[10px] font-bold font-mono uppercase shrink-0 ${
                              method === "GET"
                                ? "bg-neutral-100 text-neutral-800"
                                : method === "POST"
                                ? "bg-emerald-100 text-emerald-800"
                                : method === "PUT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {method}
                          </span>

                          {/* Route Path */}
                          <span className="font-bold text-neutral-900 break-all">{hit.path}</span>

                          {/* Threat detected chip */}
                          {isThreat && (
                            <span className="px-1.5 py-0.2 rounded-none bg-red-600 text-white text-[9px] font-bold uppercase shrink-0">
                              PROBED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-[11px]">
                          {/* HTTP Status Code */}
                          <span
                            className={`font-mono font-bold ${
                              hit.statusCode < 300
                                ? "text-emerald-600"
                                : hit.statusCode < 400
                                ? "text-blue-600"
                                : hit.statusCode < 500
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {hit.statusCode}
                          </span>

                          {/* Latency */}
                          <span className="text-neutral-500 font-mono text-[10px]">
                            {hit.latencyMs}ms
                          </span>

                          {/* Exact Hit Time */}
                          <span className="text-neutral-400 text-[10px]">
                            {new Date(hit.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-500">
                Session ID: <code className="text-neutral-800 font-bold">{selectedSessionForTrail.sessionId}</code>
              </span>
              <button
                onClick={() => setSelectedSessionForTrail(null)}
                className="px-4 py-2 rounded-none bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FIREWALL IP BLACKLIST & BLOCK MANAGER */}
      {blacklistModalOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white border border-neutral-200 rounded-none w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp font-mono my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-600" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    ATELIER SECURITY FIREWALL
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Firewall IP Blacklist & Hard Access Restrictions
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setBlacklistModalOpen(false)}
                className="p-2 rounded-none bg-neutral-200 hover:bg-neutral-300 text-neutral-700 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Manual Ban Form */}
            <form
              onSubmit={handleAddManualBan}
              className="p-5 bg-neutral-50 border-b border-neutral-200 shrink-0 space-y-3"
            >
              <div className="text-xs font-bold text-neutral-800 uppercase">
                Add IP Address to Firewall Blocklist
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="IP Address (e.g. 192.168.1.1)"
                  value={banIpInput}
                  onChange={(e) => setBanIpInput(e.target.value)}
                  className="sm:col-span-1 px-3 py-2 text-xs rounded-none bg-white border border-neutral-300 focus:outline-none focus:border-black font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Ban Reason / Threat Note"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="sm:col-span-1 px-3 py-2 text-xs rounded-none bg-white border border-neutral-300 focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={isBanning}
                  className="sm:col-span-1 py-2 px-4 rounded-none bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isBanning ? "BANNING..." : "ADD TO FIREWALL"}</span>
                </button>
              </div>
              <div className="text-[10px] text-neutral-500">
                Blocked IPs receive immediate HTTP 403 Forbidden with zero database lookups per request.
              </div>
            </form>

            {/* Banned IPs List */}
            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth p-5 space-y-2"
            >
              {isLoadingBlacklist ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-black" />
                  <span className="text-xs text-neutral-500">Querying Firewall IP records...</span>
                </div>
              ) : blacklistedIps.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="font-bold text-neutral-800">Firewall Clean: No IPs currently blacklisted</div>
                  <div className="text-[11px] text-neutral-400">Add an IP address above to enforce a firewall block.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {blacklistedIps.map((banned) => (
                    <div
                      key={banned._id || banned.ip}
                      className="p-3 rounded-none border border-neutral-200 bg-white hover:border-neutral-300 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="font-bold text-neutral-900 font-mono flex items-center gap-2">
                          <Ban className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{banned.ip}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-none bg-red-100 text-red-700 font-bold">
                            {banned.threatType || "MANUAL_BAN"}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-600">
                          {banned.reason || "Suspicious probing detected"}
                        </div>
                        <div className="text-[9.5px] text-neutral-400">
                          Banned by {banned.bannedBy || "Admin"} • {formatRelativeTime(banned.bannedAt)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnbanIp(banned.ip)}
                        className="px-3 py-1.5 rounded-none bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-700 text-[11px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>UNBAN</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-500 font-bold">
                {blacklistedIps.length} Total Restricted IPs on Firewall
              </span>
              <button
                onClick={() => setBlacklistModalOpen(false)}
                className="px-4 py-2 rounded-none bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atelier Luxury Confirmation / Action / Prompt Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        subtitle={confirmModalState.subtitle}
        message={confirmModalState.message}
        confirmLabel={confirmModalState.confirmLabel}
        cancelLabel={confirmModalState.cancelLabel}
        variant={confirmModalState.variant}
        type={confirmModalState.type}
        promptPlaceholder={confirmModalState.promptPlaceholder}
        initialPromptValue={confirmModalState.initialPromptValue}
        onConfirm={(val) => confirmModalState.onConfirm(val)}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
