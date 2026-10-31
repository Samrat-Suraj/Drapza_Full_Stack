"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Trash2,
  User,
  Filter,
} from "lucide-react";
import { ticketApi, TicketItem } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ConfirmModal } from "./ConfirmModal";

export function SupportAdminTab() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  useLockBodyScroll(Boolean(selectedTicket));
  const [replyText, setReplyText] = useState("");
  const [markResolved, setMarkResolved] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ticketApi.getTickets({
        status: statusFilter,
        priority: priorityFilter,
        search: search.trim() || undefined,
        limit: 100,
      });

      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await ticketApi.updateTicket(ticketId, { status: newStatus });
      if (res.success) {
        setActionNotice(`Ticket status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionNotice(null), 3000);
        fetchTickets(false);
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus as any });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await ticketApi.replyToTicket(selectedTicket._id, {
        message: replyText.trim(),
        sender: "Drapza Concierge Atelier",
        markResolved,
      });
      if (res.success) {
        setActionNotice(`Transmission dispatched to ${selectedTicket.email}`);
        setTimeout(() => setActionNotice(null), 4000);
        setReplyText("");
        setSelectedTicket(null);
        fetchTickets(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTicketToDelete(ticketId);
  };

  const handleExecuteDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const ticketId = ticketToDelete;
    setTicketToDelete(null);
    try {
      const res = await ticketApi.deleteTicket(ticketId);
      if (res.success) {
        setActionNotice("Ticket archived and purged");
        setTimeout(() => setActionNotice(null), 3000);
        if (selectedTicket?._id === ticketId) setSelectedTicket(null);
        fetchTickets(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-8 z-50 bg-black text-white px-5 py-3 rounded-none border border-neutral-800 shadow-2xl flex items-center gap-3 animate-fade-in font-mono-technical text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-none bg-black animate-pulse" />
            <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-500 font-semibold">
              ATELIER PROTOCOL // DESK 04
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            CLIENT CONCIERGE & INQUIRIES DESK
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1">
            Live ticket intake from /support. Resolve sizing questions, order queries, and custom requests.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchTickets(false)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>SYNC</span>
          </button>

          <a
            href={ticketApi.getExportCsvUrl(statusFilter)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-400 block">TOTAL TICKETS</span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">{stats.total}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">All Time Logged</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-amber-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-amber-600 block flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> OPEN QUEUE
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">{stats.open}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Requires Response</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-blue-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-blue-600 block flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> IN PROGRESS
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">{stats.in_progress}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Under Concierge Review</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-emerald-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-emerald-600 block flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> RESOLVED
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">{stats.resolved}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Client Satisfied</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm col-span-2 lg:col-span-1 border-l-4 border-l-neutral-400">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-500 block flex items-center gap-1.5">
            <XCircle className="w-3 h-3" /> ARCHIVED
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">{stats.closed}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Closed Cases</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "open", "in_progress", "resolved", "closed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-black text-white font-bold shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ticket ID, client, email..."
              className="w-full pl-9 pr-3 py-2 rounded-none border border-neutral-300 focus:border-black focus:outline-none font-sans text-xs bg-neutral-50"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-neutral-900 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider hover:bg-black transition-colors"
          >
            GO
          </button>
        </form>
      </div>

      {/* Tickets Ledger Table */}
      <div className="bg-white border border-neutral-200 rounded-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-neutral-800" />
            <h3 className="font-mono-technical text-xs uppercase tracking-wider font-bold text-neutral-900">
              INQUIRY LEDGER ({tickets.length} RECORDS)
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
            <p className="font-mono-technical text-xs text-neutral-400 mt-2 uppercase tracking-wider">
              CONNECTING TO SECURE TELEMETRY...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-mono-technical text-xs text-neutral-400 uppercase tracking-widest">
              NO CLIENT INQUIRIES MATCHING ACTIVE FILTER
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">TICKET ID</th>
                  <th className="py-3 px-4">CLIENT</th>
                  <th className="py-3 px-4">TOPIC</th>
                  <th className="py-3 px-4">ORDER REF</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono-technical font-semibold text-neutral-900 whitespace-nowrap">
                      {t.ticketId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{t.name}</div>
                      <div className="text-neutral-500 text-[11px] font-mono">{t.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-none bg-neutral-100 font-mono text-[10px] text-neutral-700 uppercase">
                        {t.topic}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                      {t.orderRef ? `#${t.orderRef}` : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none font-mono text-[10px] uppercase font-medium ${
                          t.status === "open"
                            ? "bg-amber-100 text-amber-800"
                            : t.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : t.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-none ${
                            t.status === "open"
                              ? "bg-amber-500"
                              : t.status === "in_progress"
                              ? "bg-blue-500"
                              : t.status === "resolved"
                              ? "bg-emerald-500"
                              : "bg-neutral-500"
                          }`}
                        />
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-none font-mono-technical text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>VIEW & REPLY</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Inspection & Reply Modal */}
      {selectedTicket && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 shadow-2xl my-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
                  INQUIRY DOSSIER
                </span>
                <h3 className="font-display text-xl font-bold text-neutral-900 mt-0.5">
                  TICKET {selectedTicket.ticketId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain scroll-smooth"
            >
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-none border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-400 font-mono text-[10px] uppercase block">Client Name</span>
                  <span className="font-medium text-neutral-900 mt-0.5 block">{selectedTicket.name}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[10px] uppercase block">Client Email</span>
                  <span className="font-medium text-neutral-900 mt-0.5 block truncate">{selectedTicket.email}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[10px] uppercase block">Inquiry Topic</span>
                  <span className="font-medium text-neutral-900 mt-0.5 block">{selectedTicket.topic}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-mono text-[10px] uppercase block">Order Reference</span>
                  <span className="font-mono text-neutral-900 mt-0.5 block">
                    {selectedTicket.orderRef ? `#${selectedTicket.orderRef}` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <h4 className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">
                  CLIENT INQUIRY TRANSMISSION
                </h4>
                <div className="p-4 bg-neutral-900 text-neutral-100 rounded-none font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <h4 className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">
                  STATUS WORKFLOW
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {["open", "in_progress", "resolved", "closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket._id, st)}
                      className={`px-3 py-1.5 rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all ${
                        selectedTicket.status === st
                          ? "bg-black text-white font-bold"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Previous Replies */}
              {selectedTicket.adminReplies && selectedTicket.adminReplies.length > 0 && (
                <div>
                  <h4 className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">
                    DISPATCH HISTORY ({selectedTicket.adminReplies.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedTicket.adminReplies.map((rep, idx) => (
                      <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-xs space-y-1">
                        <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px]">
                          <span>{rep.sender || "Concierge Atelier"}</span>
                          <span>{new Date(rep.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-neutral-800 whitespace-pre-wrap">{rep.reply}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compose Reply */}
              <div>
                <h4 className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">
                  COMPOSE EMAIL TRANSMISSION TO CLIENT
                </h4>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Write response to ${selectedTicket.name}...`}
                  className="w-full p-3 border border-neutral-300 rounded-none focus:border-black focus:outline-none font-sans text-xs bg-white resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 font-mono-technical text-xs text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={(e) => setMarkResolved(e.target.checked)}
                      className="rounded-none border-neutral-300 text-black focus:ring-black"
                    />
                    <span>MARK STATUS AS RESOLVED AFTER DISPATCH</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(selectedTicket._id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-none transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isReplying || !replyText.trim()}
                      onClick={handleSendReply}
                      className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send className={`w-3.5 h-3.5 ${isReplying ? "animate-pulse" : ""}`} />
                      <span>{isReplying ? "DISPATCHING..." : "SEND REPLY EMAIL"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Confirm Modal for ticket deletion */}
      <ConfirmModal
        isOpen={Boolean(ticketToDelete)}
        variant="danger"
        title="PURGE SUPPORT TICKET"
        subtitle="[ CONCIERGE PROTOCOL ]"
        message="Are you sure you want to permanently delete and purge this support ticket thread? This action cannot be reverted."
        confirmLabel="PURGE TICKET"
        cancelLabel="CANCEL"
        isDestructive={true}
        onConfirm={handleExecuteDeleteTicket}
        onCancel={() => setTicketToDelete(null)}
      />
    </div>
  );
}

