"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Package,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Copy,
  ArrowRightLeft,
  DollarSign,
  MapPin,
  User,
  Mail,
  Phone,
  Box,
  FileText,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { returnApi, ReturnRequestItem } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";
import { AdminTableSkeleton } from "./skeletons";

const COURIER_PARTNERS = [
  "Delhivery Reverse Logistics",
  "Shiprocket Reverse 3PL",
  "BlueDart Apex Express",
  "DTDC Reverse Express",
  "Shadowfax Reverse Network",
  "Atelier White-Glove Courier",
];

const REFUND_MODES = [
  "Original Payment Source (Cashfree/Razorpay/Card)",
  "Atelier Vault Store Credit (Instant Balance)",
  "Direct Bank IMPS / NEFT Transfer",
  "UPI Direct Settlement",
  "Cash on Doorstep Pickup",
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Bespoke Custom Size"];

export function ReturnsAdminTab() {
  const [requests, setRequests] = useState<ReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected Dossier for Inspect / Edit Modal
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestItem | null>(null);
  useLockBodyScroll(Boolean(selectedRequest));

  // Editable Form States in Dossier Modal
  const [modalStatus, setModalStatus] = useState<
    "pending_review" | "approved" | "pickup_scheduled" | "received" | "refunded" | "rejected"
  >("pending_review");
  const [modalCustomerName, setModalCustomerName] = useState("");
  const [modalCustomerEmail, setModalCustomerEmail] = useState("");
  const [modalCustomerPhone, setModalCustomerPhone] = useState("");
  const [modalStreet, setModalStreet] = useState("");
  const [modalCity, setModalCity] = useState("");
  const [modalState, setModalState] = useState("");
  const [modalPincode, setModalPincode] = useState("");
  const [modalRequestType, setModalRequestType] = useState<"return" | "exchange">("return");
  const [modalExchangeSize, setModalExchangeSize] = useState("");
  const [modalRefundAmount, setModalRefundAmount] = useState<string>("");
  const [modalRefundMode, setModalRefundMode] = useState("");
  const [modalCourierPartner, setModalCourierPartner] = useState("");
  const [modalAwb, setModalAwb] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalRejectionReason, setModalRejectionReason] = useState("");

  // Loading Flags
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);

  // Manual Intake (Create Return) Modal State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  useLockBodyScroll(isCreatingNew);
  const [newOrderRef, setNewOrderRef] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newRequestType, setNewRequestType] = useState<"return" | "exchange">("exchange");
  const [newExchangeSize, setNewExchangeSize] = useState("L");
  const [newItemName, setNewItemName] = useState("Signature Structured Blazer");
  const [newItemSize, setNewItemSize] = useState("M");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(6999);
  const [newItemReason, setNewItemReason] = useState("Chest and shoulder sizing too fitted");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newAdminNotes, setNewAdminNotes] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending_review: { count: 0, totalAmount: 0 },
    approved: { count: 0, totalAmount: 0 },
    pickup_scheduled: { count: 0, totalAmount: 0 },
    received: { count: 0, totalAmount: 0 },
    refunded: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 },
  });

  const showToast = (message: string) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 3800);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioSystem.playClick(800);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied ${text} to clipboard`);
  };

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await returnApi.getReturnRequests({
        status: statusFilter,
        type: typeFilter,
        search: search.trim() || undefined,
        limit: 150,
      });

      if (res && res.success) {
        const list = res.requests || res.data?.requests || [];
        setRequests(list);
        if (res.stats || res.data?.stats) {
          setStats((res.stats || res.data?.stats) as any);
        }
      }
    } catch (err: any) {
      console.error("[FETCH RETURNS ERROR]:", err);
      showToast(`✕ Error fetching returns: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick(500);
    fetchRequests(true);
  };

  // Open Dossier Modal and load editable fields
  const openInspectModal = (req: ReturnRequestItem) => {
    audioSystem.playClick(600);
    setSelectedRequest(req);
    setModalStatus(req.status || "pending_review");
    setModalCustomerName(req.customerName || "");
    setModalCustomerEmail(req.customerEmail || "");
    setModalCustomerPhone(req.customerPhone || "");
    setModalStreet(req.pickupAddress?.street || "");
    setModalCity(req.pickupAddress?.city || "");
    setModalState(req.pickupAddress?.state || "");
    setModalPincode(req.pickupAddress?.pincode || "");
    setModalRequestType(req.requestType || "return");
    setModalExchangeSize(req.exchangeSize || "");
    setModalRefundAmount(String(req.refundAmount ?? 0));
    setModalRefundMode(req.refundMode || REFUND_MODES[0]);
    setModalCourierPartner(req.courierPartner || COURIER_PARTNERS[0]);
    setModalAwb(req.courierAwb || "");
    setModalNotes(req.adminNotes || "");
    setModalRejectionReason(req.rejectionReason || "");
  };

  // 1-Click Quick Status Change directly from Table Row
  const handleQuickStatusChange = async (
    id: string,
    newStatus: "pending_review" | "approved" | "pickup_scheduled" | "received" | "refunded" | "rejected"
  ) => {
    setQuickUpdatingId(id);
    audioSystem.playClick(600);
    try {
      const res = await returnApi.updateReturnStatus(id, { status: newStatus });
      if (res && (res.request || res.success)) {
        const updated = res.request || (res as any).data;
        setRequests((prev) => prev.map((r) => (r._id === id || r.returnId === id ? { ...r, status: newStatus } : r)));
        audioSystem.playSuccess();
        showToast(`✓ Status updated to ${newStatus.toUpperCase().replace("_", " ")}`);
        fetchRequests(false);
      }
    } catch (err: any) {
      console.error("[QUICK STATUS ERROR]:", err);
      audioSystem.playError();
      showToast(`✕ Failed to update status: ${err.message}`);
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // Save Full Dossier from Inspect Modal
  const handleSaveDossier = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    audioSystem.playClick(700);
    try {
      const res = await returnApi.updateReturnStatus(selectedRequest._id, {
        status: modalStatus,
        customerName: modalCustomerName.trim(),
        customerEmail: modalCustomerEmail.trim().toLowerCase(),
        customerPhone: modalCustomerPhone.trim(),
        requestType: modalRequestType,
        exchangeSize: modalExchangeSize.trim(),
        refundAmount: Number(modalRefundAmount) || 0,
        courierAwb: modalAwb.trim(),
        courierPartner: modalCourierPartner.trim(),
        adminNotes: modalNotes.trim(),
        rejectionReason: modalRejectionReason.trim(),
        pickupAddress: {
          street: modalStreet.trim(),
          city: modalCity.trim(),
          state: modalState.trim(),
          pincode: modalPincode.trim(),
        },
      });

      if (res && (res.success || res.request)) {
        const updated = res.request || (res as any).data || { ...selectedRequest, status: modalStatus };
        setRequests((prev) =>
          prev.map((r) => (r._id === selectedRequest._id ? { ...r, ...updated, status: modalStatus } : r))
        );
        setSelectedRequest(updated);
        audioSystem.playSuccess();
        showToast(`✓ Return dossier ${selectedRequest.returnId} saved successfully.`);
        fetchRequests(false);
      }
    } catch (err: any) {
      console.error("[SAVE DOSSIER ERROR]:", err);
      audioSystem.playError();
      showToast(`✕ Save error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Dispatch Direct Email Update to Customer
  const handleSendNotification = async () => {
    if (!selectedRequest) return;
    setIsSendingEmail(true);
    audioSystem.playClick(600);
    try {
      const res = await returnApi.sendReturnNotification(selectedRequest._id);
      if (res && res.success) {
        audioSystem.playSuccess();
        showToast(`✓ Email status notice dispatched to ${selectedRequest.customerEmail}`);
      } else {
        throw new Error(res?.message || "Failed to deliver email");
      }
    } catch (err: any) {
      audioSystem.playError();
      showToast(`✕ Email notice error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Delete / Purge Return Record
  const handleDeleteRequest = async (id: string, returnId: string) => {
    if (!window.confirm(`Permanently purge reverse logistics record ${returnId}? This cannot be undone.`)) {
      return;
    }
    audioSystem.playClick(400);
    try {
      const res = await returnApi.deleteReturnRequest(id);
      if (res && res.success) {
        setRequests((prev) => prev.filter((r) => r._id !== id && r.returnId !== id));
        if (selectedRequest && (selectedRequest._id === id || selectedRequest.returnId === id)) {
          setSelectedRequest(null);
        }
        audioSystem.playSuccess();
        showToast(`✓ Record ${returnId} purged from registry.`);
        fetchRequests(false);
      }
    } catch (err: any) {
      audioSystem.playError();
      showToast(`✕ Delete error: ${err.message}`);
    }
  };

  // Create Manual Return/Exchange Intake
  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderRef.trim() || !newCustomerName.trim() || !newCustomerEmail.trim()) {
      showToast("✕ Order Ref, Customer Name, and Email are mandatory.");
      audioSystem.playError();
      return;
    }

    setIsSubmittingNew(true);
    audioSystem.playClick(700);

    try {
      const res = await returnApi.createReturnRequest({
        orderRef: newOrderRef.trim().toUpperCase(),
        customerName: newCustomerName.trim(),
        customerEmail: newCustomerEmail.trim().toLowerCase(),
        customerPhone: newCustomerPhone.trim(),
        requestType: newRequestType,
        exchangeSize: newRequestType === "exchange" ? newExchangeSize : undefined,
        refundAmount: Number(newItemPrice) * Number(newItemQty),
        pickupAddress: {
          street: newStreet.trim(),
          city: newCity.trim(),
          state: newState.trim(),
          pincode: newPincode.trim(),
        },
        items: [
          {
            name: newItemName.trim(),
            size: newItemSize,
            qty: Number(newItemQty) || 1,
            price: Number(newItemPrice) || 0,
            reason: newItemReason.trim(),
            condition: "Verified by atelier concierge",
          },
        ],
        adminNotes: newAdminNotes.trim(),
      });

      if (res && (res.success || res.request)) {
        audioSystem.playSuccess();
        showToast(`✓ New reverse protocol ${res.request?.returnId || "DRP-RET"} initiated!`);
        setIsCreatingNew(false);
        // Reset form
        setNewOrderRef("");
        setNewCustomerName("");
        setNewCustomerEmail("");
        setNewCustomerPhone("");
        setNewStreet("");
        setNewCity("");
        setNewPincode("");
        setNewAdminNotes("");
        fetchRequests(false);
      }
    } catch (err: any) {
      console.error("[CREATE RETURN ERROR]:", err);
      audioSystem.playError();
      showToast(`✕ Failed to initiate protocol: ${err.message}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Pre-fill WhatsApp Concierge message and launch chat
  const handleOpenWhatsApp = (req: ReturnRequestItem) => {
    audioSystem.playClick(650);
    const cleanPhone = (req.customerPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message =
      `Hello ${req.customerName},\n\n` +
      `This is the DRAPZA Atelier Reverse Logistics Concierge regarding your ` +
      `${req.requestType.toUpperCase()} request (Ref: ${req.returnId}) for Order #${req.orderRef}.\n\n` +
      `Current Status: ${req.status.toUpperCase().replace("_", " ")}\n` +
      `${req.courierAwb ? `Courier Reverse AWB: ${req.courierAwb} (${req.courierPartner || "Delhivery"})\n` : ""}` +
      `${req.requestType === "exchange" && req.exchangeSize ? `Requested Size: ${req.exchangeSize}\n` : ""}` +
      `Value: ₹${(req.refundAmount || 0).toLocaleString("en-IN")}\n\n` +
      `Please let us know if you require any assistance with packaging or courier handoff.`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Helper for status styling badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          dot: "bg-amber-500",
          label: "PENDING REVIEW",
        };
      case "approved":
        return {
          bg: "bg-sky-100 text-sky-900 border-sky-300",
          dot: "bg-sky-500",
          label: "APPROVED",
        };
      case "pickup_scheduled":
        return {
          bg: "bg-blue-100 text-blue-900 border-blue-300",
          dot: "bg-blue-500 animate-pulse",
          label: "PICKUP SCHEDULED",
        };
      case "received":
        return {
          bg: "bg-purple-100 text-purple-900 border-purple-300",
          dot: "bg-purple-500",
          label: "ATELIER RECEIVED",
        };
      case "refunded":
        return {
          bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
          dot: "bg-emerald-500",
          label: "REFUNDED / CLOSED",
        };
      case "rejected":
        return {
          bg: "bg-rose-100 text-rose-900 border-rose-300",
          dot: "bg-rose-500",
          label: "REJECTED / VOID",
        };
      default:
        return {
          bg: "bg-neutral-100 text-neutral-800 border-neutral-300",
          dot: "bg-neutral-400",
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-8 z-50 bg-neutral-900 text-white px-5 py-3.5 rounded-none border border-neutral-700 shadow-2xl flex items-center gap-3 animate-fade-in font-mono-technical text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-neutral-300" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-none bg-neutral-900 animate-pulse" />
            <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-900 font-bold">
              ATELIER REVERSE LOGISTICS // DESK 07
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            RETURN & EXCHANGE APPROVAL VAULT
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            Authoritative command desk for 14-day door-to-door exchanges, reverse courier pickups, QA inspection dossiers, and escrow refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Initiate New Return Modal Trigger */}
          <button
            onClick={() => {
              audioSystem.playClick(600);
              setIsCreatingNew(true);
            }}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-900"
          >
            <Plus className="w-4 h-4 text-neutral-300" />
            <span>+ INITIATE PROTOCOL</span>
          </button>

          {/* Sync */}
          <button
            onClick={() => {
              audioSystem.playClick(500);
              fetchRequests(false);
            }}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-neutral-900" : ""}`} />
            <span>SYNC</span>
          </button>

          {/* Export CSV */}
          <a
            href={returnApi.getExportCsvUrl(statusFilter, typeFilter)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => audioSystem.playClick(600)}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT 3PL CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards (1-Click Interactive Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* TOTAL */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("ALL");
          }}
          className={`text-left p-3.5 rounded-none border transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "ALL"
              ? "border-neutral-900 ring-2 ring-neutral-900/20 bg-neutral-50"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-500 block flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-neutral-700" /> TOTAL
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {stats.total || requests.length}
          </span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-0.5 block">
            All dossiers
          </span>
        </button>

        {/* PENDING REVIEW */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("pending_review");
          }}
          className={`text-left p-3.5 rounded-none border border-l-4 border-l-amber-500 transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "pending_review"
              ? "border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/40"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-amber-700 block flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3" /> PENDING
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {stats.pending_review?.count || 0}
          </span>
          <span className="font-mono-technical text-[10px] text-amber-800 mt-0.5 block">
            ₹{(stats.pending_review?.totalAmount || 0).toLocaleString("en-IN")} In Review
          </span>
        </button>

        {/* APPROVED & PICKUP */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("pickup_scheduled");
          }}
          className={`text-left p-3.5 rounded-none border border-l-4 border-l-blue-500 transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "pickup_scheduled" || statusFilter === "approved"
              ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-blue-700 block flex items-center gap-1 font-semibold">
            <Truck className="w-3 h-3" /> PICKUP
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {(stats.approved?.count || 0) + (stats.pickup_scheduled?.count || 0)}
          </span>
          <span className="font-mono-technical text-[10px] text-blue-800 mt-0.5 block">
            Reverse active
          </span>
        </button>

        {/* RECEIVED AT ATELIER */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("received");
          }}
          className={`text-left p-3.5 rounded-none border border-l-4 border-l-purple-500 transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "received"
              ? "border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/40"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-purple-700 block flex items-center gap-1 font-semibold">
            <Package className="w-3 h-3" /> ATELIER QA
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {stats.received?.count || 0}
          </span>
          <span className="font-mono-technical text-[10px] text-purple-800 mt-0.5 block">
            Inspecting tags
          </span>
        </button>

        {/* REFUNDED / CLOSED */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("refunded");
          }}
          className={`text-left p-3.5 rounded-none border border-l-4 border-l-emerald-500 transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "refunded"
              ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-emerald-700 block flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> SETTLED
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {stats.refunded?.count || 0}
          </span>
          <span className="font-mono-technical text-[10px] text-emerald-800 mt-0.5 block">
            ₹{(stats.refunded?.totalAmount || 0).toLocaleString("en-IN")} Settled
          </span>
        </button>

        {/* REJECTED / VOID */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            setStatusFilter("rejected");
          }}
          className={`text-left p-3.5 rounded-none border border-l-4 border-l-rose-500 transition-all cursor-pointer bg-white shadow-sm ${
            statusFilter === "rejected"
              ? "border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/40"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-rose-700 block flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
          <span className="font-display text-2xl font-bold text-neutral-900 mt-1 block">
            {stats.rejected?.count || 0}
          </span>
          <span className="font-mono-technical text-[10px] text-rose-800 mt-0.5 block">
            Void / Worn
          </span>
        </button>
      </div>

      {/* Filter & Live Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Status & Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {["ALL", "pending_review", "approved", "pickup_scheduled", "received", "refunded", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => {
                audioSystem.playClick(400);
                setStatusFilter(st);
              }}
              className={`px-3 py-1.5 rounded-none font-mono-technical text-[11px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-neutral-900 text-white font-bold shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st === "ALL" ? "ALL STATUSES" : st.replace("_", " ")}
            </button>
          ))}

          <div className="h-4 w-px bg-neutral-300 mx-2 hidden sm:block" />

          {/* Type Filter */}
          {["ALL", "return", "exchange"].map((tp) => (
            <button
              key={tp}
              onClick={() => {
                audioSystem.playClick(400);
                setTypeFilter(tp);
              }}
              className={`px-2.5 py-1 rounded-none font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                typeFilter === tp
                  ? "bg-neutral-900 text-neutral-300 font-bold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tp === "ALL" ? "ALL TYPES" : tp}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Return ID, Order #, Name, AWB..."
              className="w-full pl-9 pr-3 py-2 rounded-none border border-neutral-300 focus:border-neutral-900 focus:outline-none font-sans text-xs bg-neutral-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            GO
          </button>
        </form>
      </div>

      {/* Main Reverse Logistics Table */}
      <div className="bg-white border border-neutral-200 rounded-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-neutral-900" />
            <h3 className="font-mono-technical text-xs uppercase tracking-wider font-bold text-neutral-900">
              REVERSE LOGISTICS REGISTRY ({requests.length} DOSSIERS)
            </h3>
          </div>
          <span className="font-mono-technical text-[11px] text-neutral-500">
            Click any row to open full inspection dossier &bull; Quick status dropdown enabled
          </span>
        </div>

        {loading ? (
          <div className="p-4">
            <AdminTableSkeleton columns={6} rows={6} ariaLabel="Loading return protocols..." />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="font-mono-technical text-xs text-neutral-500 uppercase tracking-widest">
              NO RETURN OR EXCHANGE REQUESTS FOUND
            </p>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 bg-neutral-900 text-white font-mono-technical text-xs uppercase tracking-wider"
            >
              + INITIATE FIRST PROTOCOL
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100/70 font-mono-technical text-[10px] uppercase tracking-wider text-neutral-600">
                  <th className="py-3 px-4">TRACKING ID / REF</th>
                  <th className="py-3 px-4">ORDER REF</th>
                  <th className="py-3 px-4">TYPE &amp; REASON</th>
                  <th className="py-3 px-4">CLIENT</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">QUICK STATUS</th>
                  <th className="py-3 px-4">REVERSE AWB</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {requests.map((r) => {
                  const badge = getStatusBadge(r.status);
                  const isQuickUpdating = quickUpdatingId === r._id;
                  const unifiedTrackingId = r.orderRef || r.returnId;

                  return (
                    <tr
                      key={r._id || r.returnId}
                      className="hover:bg-neutral-50/90 transition-colors group cursor-pointer"
                      onClick={() => openInspectModal(r)}
                    >
                      {/* Tracking ID / Return Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900 tracking-wide">
                            #{unifiedTrackingId}
                          </span>
                          <button
                            type="button"
                            title="Copy Unified Tracking ID"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(unifiedTrackingId, r._id);
                            }}
                            className="text-neutral-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          >
                            {copiedId === r._id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`/track?ref=${unifiedTrackingId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Live Track Consignment"
                            className="text-neutral-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {r.returnId !== r.orderRef && (
                          <div className="text-[9px] font-mono text-neutral-400 font-normal">
                            Reg: {r.returnId}
                          </div>
                        )}
                      </td>

                      {/* Order Ref */}
                      <td className="py-3.5 px-4 font-mono font-medium text-neutral-700 whitespace-nowrap">
                        <a
                          href={`/track?ref=${r.orderRef}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline hover:text-black"
                        >
                          #{r.orderRef}
                        </a>
                      </td>

                      {/* Type & Reason */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-none font-mono text-[10px] uppercase font-bold tracking-wider ${
                              r.requestType === "exchange"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-neutral-100 text-neutral-900 border border-neutral-300"
                            }`}
                          >
                            {r.requestType}
                          </span>
                          {r.requestType === "exchange" && r.exchangeSize && (
                            <span className="text-[10px] font-mono text-purple-700 font-semibold">
                              Target: {r.exchangeSize}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-[180px] mt-0.5">
                          {r.items?.[0]?.reason || "Size or fit adjustment"}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">{r.customerName}</div>
                        <div className="text-neutral-500 text-[11px] font-mono">{r.customerEmail}</div>
                        {r.customerPhone && (
                          <div className="text-neutral-400 text-[10px] font-mono">{r.customerPhone}</div>
                        )}
                      </td>

                      {/* Refund Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        ₹{(r.refundAmount || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Quick Status Dropdown (1-Click) */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          disabled={isQuickUpdating}
                          value={r.status}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              r._id,
                              e.target.value as "pending_review" | "approved" | "pickup_scheduled" | "received" | "refunded" | "rejected"
                            )
                          }
                          className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-none border cursor-pointer focus:outline-none transition-colors ${badge.bg}`}
                        >
                          <option value="pending_review">PENDING REVIEW</option>
                          <option value="approved">APPROVED</option>
                          <option value="pickup_scheduled">PICKUP SCHEDULED</option>
                          <option value="received">ATELIER RECEIVED</option>
                          <option value="refunded">REFUNDED / CLOSED</option>
                          <option value="rejected">REJECTED / VOID</option>
                        </select>
                      </td>

                      {/* Reverse AWB */}
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        {r.courierAwb ? (
                          <span className="text-neutral-900 font-bold bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                            {r.courierAwb}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>

                      {/* Action Commands */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Concierge */}
                          {r.customerPhone && (
                            <button
                              type="button"
                              title="Message Client on WhatsApp"
                              onClick={() => handleOpenWhatsApp(r)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-none transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Inspect / Edit */}
                          <button
                            type="button"
                            onClick={() => openInspectModal(r)}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-900 text-white rounded-none font-mono-technical text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>INSPECT</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          {/* Delete Purge */}
                          <button
                            type="button"
                            title="Purge Record"
                            onClick={() => handleDeleteRequest(r._id, r.returnId)}
                            className="p-1.5 hover:bg-rose-100 text-neutral-400 hover:text-rose-700 rounded-none transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FULL-CONTROL DOSSIER INSPECTION & Reverse Logistics Editor */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-neutral-300 shadow-2xl my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-neutral-900 rounded-none animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                      REVERSE LOGISTICS DOSSIER // DESK 07
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase px-2 py-0.5 font-bold ${
                        selectedRequest.requestType === "exchange"
                          ? "bg-purple-100 text-purple-900"
                          : "bg-neutral-200 text-neutral-900"
                      }`}
                    >
                      {selectedRequest.requestType}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>TRACKING ID: #{selectedRequest.orderRef || selectedRequest.returnId}</span>
                    <a
                      href={`/track?ref=${selectedRequest.orderRef || selectedRequest.returnId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Live Reverse Tracking Desk"
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-neutral-900 text-white px-2.5 py-1 hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <Truck className="w-3 h-3" />
                      <span>LIVE TRACKING</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </h3>
                  <div className="font-mono text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                    <span>Order: <strong>#{selectedRequest.orderRef}</strong></span>
                    <span>&bull;</span>
                    <span>Registry ID: <strong>{selectedRequest.returnId}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedRequest.customerPhone && (
                  <button
                    onClick={() => handleOpenWhatsApp(selectedRequest)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-mono-technical text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WHATSAPP</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-none hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-5 sm:p-6 space-y-6 font-sans text-xs overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain"
            >
              {/* Quick Workflow Stepper */}
              <div className="bg-neutral-900 text-white p-4 rounded-none space-y-3">
                <span className="font-mono-technical text-[10px] uppercase tracking-[0.2em] text-neutral-300 font-bold block">
                  1-CLICK WORKFLOW STATUS TRANSITION
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { id: "pending_review", label: "1. PENDING", color: "hover:bg-amber-600" },
                    { id: "approved", label: "2. APPROVE", color: "hover:bg-sky-600" },
                    { id: "pickup_scheduled", label: "3. SCHEDULE 3PL", color: "hover:bg-blue-600" },
                    { id: "received", label: "4. ATELIER QA", color: "hover:bg-purple-600" },
                    { id: "refunded", label: "5. SETTLE REFUND", color: "hover:bg-emerald-600" },
                    { id: "rejected", label: "6. REJECT VOID", color: "hover:bg-rose-600" },
                  ].map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        setModalStatus(step.id as any);
                        audioSystem.playClick(600);
                      }}
                      className={`px-2.5 py-2 rounded-none font-mono-technical text-[10px] uppercase font-bold tracking-wider transition-all border cursor-pointer ${
                        modalStatus === step.id
                          ? "bg-white text-black border-white shadow-md"
                          : `bg-neutral-800 text-neutral-300 border-neutral-700 ${step.color}`
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 1: Client Information & Pickup Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Client Info */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-none space-y-3">
                  <div className="font-mono-technical text-[10px] uppercase text-neutral-500 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-700" />
                    <span>CLIENT PERSONAL DATA</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={modalCustomerName}
                      onChange={(e) => setModalCustomerName(e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={modalCustomerEmail}
                        onChange={(e) => setModalCustomerEmail(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={modalCustomerPhone}
                        onChange={(e) => setModalCustomerPhone(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup Address */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-none space-y-3">
                  <div className="font-mono-technical text-[10px] uppercase text-neutral-500 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                    <span>DOOR-TO-DOOR REVERSE PICKUP ADDRESS</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                      Street / Flat / Landmark
                    </label>
                    <input
                      type="text"
                      value={modalStreet}
                      onChange={(e) => setModalStreet(e.target.value)}
                      placeholder="Flat 4B, Signature Towers, MG Road"
                      className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={modalCity}
                        onChange={(e) => setModalCity(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={modalState}
                        onChange={(e) => setModalState(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={modalPincode}
                        onChange={(e) => setModalPincode(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Reverse Logistics Courier & Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 3PL Courier Details */}
                <div className="p-4 bg-white border border-neutral-200 rounded-none space-y-3">
                  <div className="font-mono-technical text-[10px] uppercase text-neutral-600 font-bold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-neutral-900" />
                    <span>3PL REVERSE COURIER INTEGRATION</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                      Reverse Carrier Partner
                    </label>
                    <select
                      value={modalCourierPartner}
                      onChange={(e) => setModalCourierPartner(e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none bg-white"
                    >
                      {COURIER_PARTNERS.map((cp) => (
                        <option key={cp} value={cp}>
                          {cp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">
                        Reverse AWB Tracking Number
                      </label>
                      {modalAwb && (
                        <a
                          href={`https://www.delhivery.com/track/package/${modalAwb}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-neutral-900 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>TRACK 3PL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="text"
                      value={modalAwb}
                      onChange={(e) => setModalAwb(e.target.value)}
                      placeholder="e.g. DEL-REV-982138942"
                      className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Financials & Exchange Size */}
                <div className="p-4 bg-white border border-neutral-200 rounded-none space-y-3">
                  <div className="font-mono-technical text-[10px] uppercase text-neutral-600 font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-neutral-900" />
                    <span>FINANCIAL &amp; EXCHANGE CONFIGURATION</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Request Type
                      </label>
                      <select
                        value={modalRequestType}
                        onChange={(e) => setModalRequestType(e.target.value as any)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs uppercase font-bold focus:border-neutral-900 focus:outline-none bg-white"
                      >
                        <option value="return">RETURN (REFUND)</option>
                        <option value="exchange">EXCHANGE (SIZING)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Target Sizing Swap
                      </label>
                      <input
                        type="text"
                        value={modalExchangeSize}
                        onChange={(e) => setModalExchangeSize(e.target.value)}
                        placeholder="e.g. L or Bespoke"
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Settlement Value (INR)
                      </label>
                      <input
                        type="number"
                        value={modalRefundAmount}
                        onChange={(e) => setModalRefundAmount(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Settlement Mode
                      </label>
                      <select
                        value={modalRefundMode}
                        onChange={(e) => setModalRefundMode(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none bg-white truncate"
                      >
                        {REFUND_MODES.map((rm) => (
                          <option key={rm} value={rm}>
                            {rm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Marked for Reversal */}
              <div>
                <div className="font-mono-technical text-[11px] uppercase text-neutral-600 font-bold mb-2 flex items-center justify-between">
                  <span>ITEMS MARKED FOR REVERSAL ({selectedRequest.items?.length || 0})</span>
                  <span className="text-[10px] font-mono text-neutral-400">Security Tags &amp; Packaging Check</span>
                </div>
                <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-none overflow-hidden bg-white">
                  {(selectedRequest.items || []).map((it, idx) => (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm">{it.name}</div>
                        <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                          Size: <strong className="text-black">{it.size}</strong> &bull; Qty: {it.qty} &bull; Reason:{" "}
                          <span className="text-neutral-800 font-medium">"{it.reason}"</span>
                        </div>
                        {it.condition && (
                          <div className="text-[10px] font-mono text-emerald-800 mt-1 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            <span>Condition: {it.condition}</span>
                          </div>
                        )}
                      </div>
                      <div className="font-mono font-bold text-neutral-900 text-base self-end sm:self-auto">
                        ₹{(it.price * it.qty).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes & Rejection Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-neutral-600 font-bold block mb-1">
                    INTERNAL QA / ATELIER INSPECTION DIRECTIVES
                  </label>
                  <textarea
                    rows={3}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="e.g. Garment inspected at desk 07. Tags verified, passed to steaming department..."
                    className="w-full p-2.5 border border-neutral-300 rounded-none focus:border-neutral-900 focus:outline-none font-sans text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-rose-700 font-bold block mb-1">
                    REJECTION REASON (IF DECLINING REQUEST)
                  </label>
                  <textarea
                    rows={3}
                    value={modalRejectionReason}
                    onChange={(e) => setModalRejectionReason(e.target.value)}
                    placeholder="e.g. Return void: Security ribbon cut, missing authentic archive packaging."
                    className="w-full p-2.5 border border-rose-200 focus:border-rose-500 focus:outline-none font-sans text-xs resize-none bg-rose-50/20"
                  />
                </div>
              </div>

              {/* Audit Timeline History */}
              {selectedRequest.timeline && selectedRequest.timeline.length > 0 && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-none space-y-2.5">
                  <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                    DOSSIER AUDIT LOG HISTORY ({selectedRequest.timeline.length} EVENTS)
                  </span>
                  <div className="space-y-2 border-l-2 border-neutral-300 ml-2 pl-3">
                    {selectedRequest.timeline.map((evt, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold text-neutral-800">
                            {evt.status.replace("_", " ")}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-400">
                            {new Date(evt.timestamp).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="font-mono text-[9px] bg-neutral-200 px-1.5 py-0.2 text-neutral-600">
                            {evt.updatedBy || "Admin"}
                          </span>
                        </div>
                        {evt.note && (
                          <div className="text-[11px] text-neutral-600 font-sans mt-0.5">{evt.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {/* Email Client Notice */}
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendNotification}
                  className="px-4 py-2 border border-neutral-300 hover:border-black bg-white text-neutral-800 rounded-none font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-900" />
                  <span>{isSendingEmail ? "DISPATCHING..." : "EMAIL CLIENT UPDATE"}</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteRequest(selectedRequest._id, selectedRequest.returnId)}
                  className="p-2 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-none transition-colors cursor-pointer"
                  title="Purge Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-none border border-neutral-300 font-mono-technical text-xs uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveDossier}
                  className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 text-neutral-300" />
                  <span>{isUpdating ? "COMMITTING CHANGES..." : "SAVE ALL CHANGES"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL INTAKE (+ INITIATE REVERSE PROTOCOL) */}
      {/* ========================================================================= */}
      {isCreatingNew && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-neutral-300 shadow-2xl my-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-900 font-bold block">
                  MANUAL DESK 07 INTAKE
                </span>
                <h3 className="font-display text-xl font-bold text-neutral-900 mt-0.5">
                  INITIATE REVERSE / EXCHANGE PROTOCOL
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="p-2 rounded-none hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewRequest} className="flex-1 min-h-0 flex flex-col">
              <div
                data-lenis-prevent="true"
                style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
                className="p-5 sm:p-6 space-y-4 font-sans text-xs overflow-y-auto flex-1 custom-modal-scrollbar"
              >
                {/* Order Ref & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                      Order Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOrderRef}
                      onChange={(e) => setNewOrderRef(e.target.value)}
                      placeholder="e.g. DRP-98124 or ORD-4921"
                      className="w-full p-2.5 border border-neutral-300 rounded-none font-mono text-xs font-bold focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                      Protocol Type *
                    </label>
                    <select
                      value={newRequestType}
                      onChange={(e) => setNewRequestType(e.target.value as any)}
                      className="w-full p-2.5 border border-neutral-300 rounded-none font-mono text-xs uppercase font-bold focus:border-neutral-900 focus:outline-none bg-white"
                    >
                      <option value="exchange">COMPLIMENTARY EXCHANGE (SIZING SWAP)</option>
                      <option value="return">RETURN &amp; ESCROW REFUND</option>
                    </select>
                  </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Aarav Singhania"
                      className="w-full p-2.5 border border-neutral-300 rounded-none font-sans text-xs focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                      Client Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="client@drapza.com"
                      className="w-full p-2.5 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full p-2.5 border border-neutral-300 rounded-none font-mono text-xs focus:border-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Exchange Specifics */}
                {newRequestType === "exchange" && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-none">
                    <label className="font-mono text-[10px] uppercase text-purple-900 block mb-1 font-bold">
                      Desired Replacement Sizing
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setNewExchangeSize(sz)}
                          className={`px-3 py-1 font-mono text-xs uppercase font-bold border transition-colors ${
                            newExchangeSize === sz
                              ? "bg-purple-900 text-white border-purple-900"
                              : "bg-white text-purple-900 border-purple-300 hover:bg-purple-100"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Garment Details */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-none space-y-3">
                  <span className="font-mono text-[10px] uppercase text-neutral-600 font-bold block">
                    GARMENT REVERSAL SPECIFICATION
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Garment Title
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Current Size
                      </label>
                      <input
                        type="text"
                        value={newItemSize}
                        onChange={(e) => setNewItemSize(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Value (₹)
                      </label>
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                      Reason for Reversal / Adjustment
                    </label>
                    <input
                      type="text"
                      value={newItemReason}
                      onChange={(e) => setNewItemReason(e.target.value)}
                      placeholder="e.g. Needs 1 size larger, waist fitting adjustment, color preference"
                      className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs"
                    />
                  </div>
                </div>

                {/* Pickup Address */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase text-neutral-600 font-bold block">
                    REVERSE DOORSTEP PICKUP ADDRESS
                  </span>
                  <input
                    type="text"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Street Address / Flat / Building"
                    className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="City (e.g. Mumbai)"
                      className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs"
                    />
                    <input
                      type="text"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      placeholder="State (e.g. Maharashtra)"
                      className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs"
                    />
                    <input
                      type="text"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      placeholder="Pincode (e.g. 400001)"
                      className="w-full p-2 border border-neutral-300 rounded-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Concierge Directives / Admin Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newAdminNotes}
                    onChange={(e) => setNewAdminNotes(e.target.value)}
                    placeholder="Customer phoned atelier concierge requesting priority turnaround..."
                    className="w-full p-2 border border-neutral-300 rounded-none font-sans text-xs resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 border border-neutral-300 font-mono-technical text-xs uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-none font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 text-neutral-300" />
                  <span>{isSubmittingNew ? "REGISTERING..." : "REGISTER REVERSE PROTOCOL"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
