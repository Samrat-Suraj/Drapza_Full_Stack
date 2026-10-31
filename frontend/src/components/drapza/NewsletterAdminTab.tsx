"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Radio,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { newsletterAdminApi, NewsletterSubscriber } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ConfirmModal } from "./ConfirmModal";

export function NewsletterAdminTab() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<string | null>(null);

  // Lock background scrolling when broadcast modal is open
  useLockBodyScroll(broadcastOpen);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    title: "",
    message: "",
    ctaText: "EXPLORE ARCHIVE",
    ctaUrl: "http://localhost:3000/wardrobe",
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchSubscribers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await newsletterAdminApi.getSubscribers({
        status: statusFilter,
        search: search.trim() || undefined,
      });

      if (res.success && res.subscribers) {
        setSubscribers(res.subscribers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers();
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await newsletterAdminApi.toggleStatus(id);
      if (res.success) {
        setActionNotice("Subscriber status toggled");
        setTimeout(() => setActionNotice(null), 3000);
        fetchSubscribers(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    setSubscriberToDelete(id);
  };

  const handleExecuteDelete = async () => {
    if (!subscriberToDelete) return;
    const id = subscriberToDelete;
    setSubscriberToDelete(null);
    try {
      const res = await newsletterAdminApi.deleteSubscriber(id);
      if (res.success) {
        setActionNotice("Subscriber purged from transmission registry");
        setTimeout(() => setActionNotice(null), 3000);
        fetchSubscribers(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.subject || !broadcastForm.message) return;
    setIsBroadcasting(true);
    try {
      const res = await newsletterAdminApi.sendBroadcast(broadcastForm);
      if (res.success) {
        setActionNotice(`Signal transmitted to active VIP subscribers!`);
        setTimeout(() => setActionNotice(null), 5000);
        setBroadcastOpen(false);
        setBroadcastForm({
          subject: "",
          title: "",
          message: "",
          ctaText: "EXPLORE ARCHIVE",
          ctaUrl: "http://localhost:3000/wardrobe",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "unsubscribed").length;

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
              VIP DISPATCH • CHANNEL 01
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            VIP NEWSLETTER & TRANSMISSIONS CRM
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your high-intent audience from footer & pop-up subscribers. Export leads or dispatch broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchSubscribers(false)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>SYNC</span>
          </button>

          <button
            onClick={() => setBroadcastOpen(true)}
            className="px-4 py-2.5 rounded-none border border-neutral-800 bg-neutral-900 hover:bg-black text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>DISPATCH BROADCAST</span>
          </button>

          <a
            href={newsletterAdminApi.getExportCsvUrl()}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-400 block">TOTAL VIP AUDIENCE</span>
          <span className="font-display text-3xl font-bold text-neutral-900 mt-1 block">{subscribers.length}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Registered in MongoDB</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm border-l-4 border-l-emerald-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-emerald-600 block flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> ACTIVE TRANSMISSIONS
          </span>
          <span className="font-display text-3xl font-bold text-neutral-900 mt-1 block">{activeCount}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Receiving atelier drops</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm border-l-4 border-l-neutral-400">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-400 block">UNSUBSCRIBED / MUTED</span>
          <span className="font-display text-3xl font-bold text-neutral-900 mt-1 block">{unsubscribedCount}</span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">Opted out</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {["ALL", "active", "unsubscribed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-black text-white font-bold shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriber email..."
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

      {/* Subscribers Table */}
      <div className="bg-white border border-neutral-200 rounded-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-800" />
            <h3 className="font-mono-technical text-xs uppercase tracking-wider font-bold text-neutral-900">
              VIP SUBSCRIBER REGISTRY ({subscribers.length} LEADS)
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
            <p className="font-mono-technical text-xs text-neutral-400 mt-2 uppercase tracking-wider">
              FETCHING VIP REGISTRY...
            </p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-mono-technical text-xs text-neutral-400 uppercase tracking-widest">
              NO SUBSCRIBERS FOUND
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">SUBSCRIBER EMAIL</th>
                  <th className="py-3 px-4">CAPTURE SOURCE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">ENROLLED DATE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {subscribers.map((s) => (
                  <tr key={s._id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {s.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-none bg-neutral-100 font-mono text-[10px] text-neutral-700 uppercase">
                        {s.source || "footer_dispatch"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(s._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none font-mono text-[10px] uppercase font-medium cursor-pointer transition-colors ${
                          s.status === "active"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-none ${s.status === "active" ? "bg-emerald-500" : "bg-neutral-500"}`} />
                        {s.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {new Date(s.subscribedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                        title="Purge Subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Dispatch Modal */}
      {broadcastOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
          >
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
                  VIP TRANSMISSION ENGINE
                </span>
                <h3 className="font-display text-xl font-bold text-neutral-900 mt-0.5">
                  COMPOSE BROADCAST DISPATCH
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="p-2 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSendBroadcast}
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-6 space-y-4 font-sans text-xs flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-none flex items-center gap-2 text-amber-800">
                <Radio className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                <span>This signal will be transmitted to all <strong>{activeCount}</strong> active subscribers via your SMTP mail engine.</span>
              </div>

              <div>
                <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                  EMAIL SUBJECT LINE *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                  placeholder="e.g., ARCHIVAL DROP #04 IS NOW LIVE • ATELIER ACCESS"
                  className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                  HEADLINE TITLE
                </label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g., Modular Silhouettes Released in Limited Volume"
                  className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                  MESSAGE BODY *
                </label>
                <textarea
                  rows={5}
                  required
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  placeholder="Write your atelier announcement or discount offer here..."
                  className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-black focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                    BUTTON TEXT
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.ctaText}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, ctaText: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                    BUTTON URL
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.ctaUrl}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, ctaUrl: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBroadcastOpen(false)}
                  className="px-4 py-2.5 rounded-none border border-neutral-300 font-mono-technical text-xs uppercase tracking-wider text-neutral-700 hover:bg-neutral-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isBroadcasting ? "animate-pulse" : ""}`} />
                  <span>{isBroadcasting ? "DISPATCHING TRANSMISSION..." : "DISPATCH SIGNAL"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Confirm Modal for subscriber deletion */}
      <ConfirmModal
        isOpen={Boolean(subscriberToDelete)}
        variant="danger"
        title="PURGE SUBSCRIBER"
        subtitle="[ TRANSMISSION REGISTRY ]"
        message="Are you sure you want to permanently remove this subscriber from the transmission registry? They will no longer receive drops and editorial dispatches."
        confirmLabel="PURGE SUBSCRIBER"
        cancelLabel="CANCEL"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => setSubscriberToDelete(null)}
      />
    </div>
  );
}

