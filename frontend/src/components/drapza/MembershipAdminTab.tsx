"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  Crown,
  QrCode,
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Store,
  Calendar,
  Percent,
} from "lucide-react";
import QRCode from "qrcode";
import {
  membershipApi,
  MembershipPlanData,
  QrCampaignData,
} from "@/lib/api";

export const MembershipAdminTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"plans" | "roster" | "qr">("plans");
  const [plans, setPlans] = useState<MembershipPlanData[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [qrCampaigns, setQrCampaigns] = useState<QrCampaignData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search states for Roster
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Partial<MembershipPlanData> | null>(null);

  // Manual Add / Grant Member states (supports GPay, UPI, Cash, etc.)
  const [isGrantModalOpen, setIsGrantModalOpen] = useState<boolean>(false);
  const [grantName, setGrantName] = useState<string>("");
  const [grantEmail, setGrantEmail] = useState<string>("");
  const [grantPhone, setGrantPhone] = useState<string>("");
  const [grantPlanId, setGrantPlanId] = useState<string>("");
  const [grantAmount, setGrantAmount] = useState<number | string>("");
  const [grantPaymentMethod, setGrantPaymentMethod] = useState<string>("GPAY");
  const [grantPaymentId, setGrantPaymentId] = useState<string>("");
  const [grantStartDate, setGrantStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [grantDurationDays, setGrantDurationDays] = useState<number | string>("");
  const [grantNotes, setGrantNotes] = useState<string>("");

  // Edit Subscription states
  const [isEditSubModalOpen, setIsEditSubModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<any>(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [newCampaignCode, setNewCampaignCode] = useState<string>("");
  const [newCampaignName, setNewCampaignName] = useState<string>("");
  const [newCampaignLocation, setNewCampaignLocation] = useState<string>("");

  // QR Code preview
  const [selectedQrCampaign, setSelectedQrCampaign] = useState<QrCampaignData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, statsRes, qrRes] = await Promise.all([
        membershipApi.getAdminPlans(),
        membershipApi.getAdminStats(),
        membershipApi.getAdminQrCampaigns(),
      ]);

      if (plansRes.success && plansRes.plans) {
        setPlans(plansRes.plans);
        if (!grantPlanId && plansRes.plans.length > 0) {
          const defaultPlan = plansRes.plans[0];
          setGrantPlanId(defaultPlan._id);
          setGrantAmount(defaultPlan.price);
          setGrantDurationDays(defaultPlan.durationDays);
        }
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }

      if (qrRes.success && qrRes.campaigns) {
        setQrCampaigns(qrRes.campaigns);
        if (qrRes.campaigns.length > 0 && !selectedQrCampaign) {
          setSelectedQrCampaign(qrRes.campaigns[0]);
        }
      }
    } catch (err: any) {
      console.error("Error loading membership admin data:", err);
      showToast("Error loading membership details.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await membershipApi.getAdminSubscriptions({
        search: rosterSearch,
        status: statusFilter,
        source: sourceFilter,
        page: currentPage,
        limit: 15,
      });

      if (res.success) {
        setSubscriptions(res.subscriptions || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Error loading subscriptions:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSubTab === "roster") {
      loadSubscriptions();
    }
  }, [activeSubTab, rosterSearch, statusFilter, sourceFilter, currentPage]);

  // Generate QR code data URL whenever selected QR campaign changes
  useEffect(() => {
    if (!selectedQrCampaign) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullTargetUrl = `${origin}${selectedQrCampaign.targetUrl.startsWith("/") ? selectedQrCampaign.targetUrl : `/${selectedQrCampaign.targetUrl}`}`;

    QRCode.toDataURL(fullTargetUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation failed:", err));
  }, [selectedQrCampaign]);

  // Plan Management handlers
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      if (editingPlan._id) {
        const res = await membershipApi.updateAdminPlan(editingPlan._id, editingPlan);
        if (res.success) {
          showToast(`Plan "${editingPlan.name}" updated successfully.`);
        }
      } else {
        const res = await membershipApi.createAdminPlan(editingPlan);
        if (res.success) {
          showToast(`New plan "${editingPlan.name}" created.`);
        }
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to save plan.");
    }
  };

  const handleTogglePlanActive = async (plan: MembershipPlanData) => {
    try {
      const res = await membershipApi.updateAdminPlan(plan._id, { isActive: !plan.isActive });
      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p._id === plan._id ? { ...p, isActive: !p.isActive } : p))
        );
        showToast(`Plan "${plan.name}" is now ${!plan.isActive ? "ACTIVE" : "INACTIVE"}.`);
      }
    } catch {
      showToast("Failed to toggle plan status.");
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`Are you sure you want to remove or archive "${planName}"?`)) return;
    try {
      const res = await membershipApi.deleteAdminPlan(planId);
      if (res.success) {
        showToast(res.message);
        loadData();
      }
    } catch {
      showToast("Failed to delete plan.");
    }
  };

  // Switch selected plan in manual grant modal & update pricing/days automatically
  const handleGrantPlanChange = (planId: string) => {
    setGrantPlanId(planId);
    const chosen = plans.find((p) => p._id === planId);
    if (chosen) {
      setGrantAmount(chosen.price);
      setGrantDurationDays(chosen.durationDays);
    }
  };

  // Open grant modal with fresh defaults
  const handleOpenGrantModal = () => {
    setGrantName("");
    setGrantEmail("");
    setGrantPhone("");
    if (plans.length > 0) {
      setGrantPlanId(plans[0]._id);
      setGrantAmount(plans[0].price);
      setGrantDurationDays(plans[0].durationDays);
    }
    setGrantPaymentMethod("GPAY");
    setGrantPaymentId("");
    setGrantStartDate(new Date().toISOString().split("T")[0]);
    setGrantNotes("");
    setIsGrantModalOpen(true);
  };

  // Grant membership (Supports GPay, UPI, Cash, PhonePe, Paytm, etc.)
  const handleGrantMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantEmail || !grantPlanId) return;

    try {
      const res = await membershipApi.grantAdminMembership({
        name: grantName.trim() || undefined,
        phone: grantPhone.trim() || undefined,
        email: grantEmail.trim(),
        planId: grantPlanId,
        amountPaid: grantAmount !== "" ? Number(grantAmount) : undefined,
        paymentMethod: grantPaymentMethod,
        paymentId: grantPaymentId.trim() || undefined,
        startDate: grantStartDate || undefined,
        durationDaysOverride: grantDurationDays !== "" ? Number(grantDurationDays) : undefined,
        notes: grantNotes.trim() || `Manual ${grantPaymentMethod} entry from Admin Command Suite`,
      });

      if (res.success) {
        showToast(res.message || "Membership successfully activated!");
        setIsGrantModalOpen(false);
        setGrantName("");
        setGrantEmail("");
        setGrantPhone("");
        setGrantPaymentId("");
        setGrantNotes("");
        loadData();
        if (activeSubTab === "roster") loadSubscriptions();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to grant membership.");
    }
  };

  // Edit Subscription handlers
  const handleOpenEditSubModal = (sub: any) => {
    setEditingSub({
      _id: sub._id,
      subscriptionId: sub.subscriptionId,
      customerName: sub.customer?.name || "",
      customerEmail: sub.customer?.email || "",
      customerPhone: sub.customer?.phone || "",
      planName: sub.planName || "",
      discountPercent: sub.discountPercent || 10,
      amountPaid: sub.amountPaid ?? 0,
      paymentMethod: sub.paymentMethod || "MANUAL_ADMIN",
      paymentId: sub.paymentId || "",
      status: sub.status || "ACTIVE",
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : "",
      notes: sub.notes || "",
    });
    setIsEditSubModalOpen(true);
  };

  const handleSaveEditSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub?._id) return;

    try {
      const res = await membershipApi.updateAdminSubscription(editingSub._id, {
        customerName: editingSub.customerName,
        customerPhone: editingSub.customerPhone,
        planName: editingSub.planName,
        discountPercent: Number(editingSub.discountPercent),
        amountPaid: Number(editingSub.amountPaid),
        paymentMethod: editingSub.paymentMethod,
        paymentId: editingSub.paymentId,
        status: editingSub.status,
        endDate: editingSub.endDate ? new Date(editingSub.endDate).toISOString() : undefined,
        notes: editingSub.notes,
      });

      if (res.success) {
        showToast("Member subscription updated successfully.");
        setIsEditSubModalOpen(false);
        setEditingSub(null);
        loadSubscriptions();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update member subscription.");
    }
  };

  const handleDeleteSubscription = async (subId: string, clientIdentifier: string) => {
    if (
      !window.confirm(
        `Are you sure you want to PERMANENTLY DELETE subscription for "${clientIdentifier}"?\n\nThis will remove the record completely and downgrade the customer if no other active memberships exist.`
      )
    ) {
      return;
    }

    try {
      const res = await membershipApi.deleteAdminSubscription(subId);
      if (res.success) {
        showToast("Subscription record permanently deleted.");
        loadSubscriptions();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete subscription.");
    }
  };

  // Revoke membership
  const handleRevokeMembership = async (subId: string, customerEmail: string) => {
    const reason = window.prompt(
      `Enter authorization reason to revoke membership for ${customerEmail}:`,
      "Administrative discretion"
    );
    if (!reason) return;

    try {
      const res = await membershipApi.revokeAdminMembership(subId, reason);
      if (res.success) {
        showToast(`Membership revoked for ${customerEmail}.`);
        loadSubscriptions();
        loadData();
      }
    } catch {
      showToast("Failed to revoke membership.");
    }
  };

  // QR Campaign Handlers
  const handleCreateQrCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignCode || !newCampaignName) return;

    try {
      const res = await membershipApi.createOrUpdateQrCampaign({
        code: newCampaignCode.toUpperCase().trim(),
        name: newCampaignName.trim(),
        storeLocation: newCampaignLocation.trim() || "Flagship Atelier",
        targetUrl: `/membership?store=${newCampaignCode.toUpperCase().trim()}&ref=qr`,
        campaignTag: "IN_STORE_RETAIL",
      });

      if (res.success) {
        showToast("In-Store QR Campaign created successfully.");
        setIsCampaignModalOpen(false);
        setNewCampaignCode("");
        setNewCampaignName("");
        setNewCampaignLocation("");
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create QR campaign.");
    }
  };

  const handleCopyLink = (url: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const full = `${origin}${url.startsWith("/") ? url : `/${url}`}`;
    navigator.clipboard.writeText(full);
    showToast("Membership URL copied to clipboard.");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !selectedQrCampaign) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `DRAPZA_QR_${selectedQrCampaign.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 text-[#121212]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-neutral-700 animate-fade-in text-sm font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black text-white p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded tracking-wider uppercase">
                PRODUCTION MODULE
              </span>
              <span className="text-neutral-400 text-xs font-mono">DRAPZA PRIVILEGE CLUB CMS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
              VIP MEMBERSHIP & IN-STORE QR SYSTEM
            </h2>
            <p className="text-neutral-300 text-sm mt-1 max-w-2xl font-sans">
              Manage dynamic 6-month, 1-year, and 5-year membership plans, special member pricing rules, in-store QR code counter placards, and customer subscription rosters.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setEditingPlan({
                  name: "",
                  durationMonths: 6,
                  durationDays: 180,
                  price: 999,
                  discountPercent: 10,
                  badge: "SILVER VIP",
                  badgeColor: "#4A4A4A",
                  benefits: ["10% Special member pricing", "Complimentary delivery"],
                  eligibleCategories: ["ALL"],
                  isActive: true,
                  sortOrder: plans.length + 1,
                });
                setIsPlanModalOpen(true);
              }}
              className="bg-white text-black hover:bg-neutral-200 transition px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded flex items-center gap-2 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE PLAN
            </button>

            <button
              onClick={handleOpenGrantModal}
              className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 transition px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded flex items-center gap-2"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              + ADD / GRANT MEMBER
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-700/70">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE MEMBERS</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-white">
              {stats?.activeCount ?? 0}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>MEMBERSHIP REVENUE</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-white">
              ₹{(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>IN-STORE QR SALES</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-white">
              {stats?.inStoreQrCount ?? 0}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
              <Store className="w-3.5 h-3.5 text-purple-400" />
              <span>TOTAL ENROLLED</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-white">
              {stats?.totalSubscribers ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-300 pb-2">
        <button
          onClick={() => setActiveSubTab("plans")}
          className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-md uppercase transition flex items-center gap-2 ${
            activeSubTab === "plans"
              ? "bg-black text-white shadow"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          MEMBERSHIP PLANS ({plans.length})
        </button>

        <button
          onClick={() => setActiveSubTab("roster")}
          className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-md uppercase transition flex items-center gap-2 ${
            activeSubTab === "roster"
              ? "bg-black text-white shadow"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          SUBSCRIBER ROSTER
        </button>

        <button
          onClick={() => setActiveSubTab("qr")}
          className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-md uppercase transition flex items-center gap-2 ${
            activeSubTab === "qr"
              ? "bg-black text-white shadow"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          IN-STORE QR CODE STUDIO
        </button>
      </div>

      {/* SUB-TAB 1: PLANS CMS */}
      {activeSubTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-base font-bold uppercase tracking-wider">
                Configured Membership Plans
              </h3>
              <p className="text-xs text-neutral-600">
                These plans are served dynamically to the website and physical store QR scanner.
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 border border-neutral-300 rounded hover:bg-neutral-100 text-neutral-600"
              title="Refresh Plans"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`relative rounded-xl border p-6 flex flex-col justify-between transition shadow-sm ${
                  plan.isActive
                    ? "bg-white border-neutral-300 hover:border-black"
                    : "bg-neutral-50 border-neutral-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: plan.badgeColor || "#000",
                        color: "#fff",
                      }}
                    >
                      {plan.badge || "VIP"}
                    </span>
                    <button
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        plan.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {plan.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  <h4 className="text-xl font-bold font-mono text-neutral-900">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-neutral-900">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      / {plan.durationMonths >= 12 ? `${plan.durationMonths / 12} YR` : `${plan.durationMonths} MOS`}
                    </span>
                  </div>

                  <div className="mt-3 bg-neutral-100 p-2.5 rounded-lg border border-neutral-200 text-xs font-mono flex items-center justify-between">
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      Special Member Discount:
                    </span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {plan.discountPercent}% OFF
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">
                      Included Benefits:
                    </span>
                    <ul className="space-y-1.5 text-xs text-neutral-700">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-neutral-500">
                    Validity: {plan.durationDays} Days
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsPlanModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 border border-neutral-200"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id, plan.name)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded border border-neutral-200"
                      title="Delete / Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUBSCRIBER ROSTER */}
      {activeSubTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Client Name, Email, Subscription ID, or Payment ID..."
                value={rosterSearch}
                onChange={(e) => {
                  setRosterSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="ACTIVE">ACTIVE ONLY</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
              >
                <option value="ALL">ALL CHANNELS</option>
                <option value="ONLINE">ONLINE WEB</option>
                <option value="QR_IN_STORE">IN-STORE QR</option>
                <option value="ADMIN_MANUAL">ADMIN MANUAL</option>
              </select>

              <button
                onClick={handleOpenGrantModal}
                className="bg-black hover:bg-neutral-800 text-white px-3.5 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD MEMBER (GPAY / OFFLINE)
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700">
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Member / Contact</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Plan & Price</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Discount %</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Payment Method</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Valid Until</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap">Payment Ref / UTR</th>
                  <th className="py-3 px-4 font-bold uppercase whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      No membership subscriptions found matching your query.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isStillActive =
                      sub.status === "ACTIVE" && new Date(sub.endDate) > new Date();
                    return (
                      <tr key={sub._id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-neutral-900">{sub.customer?.name || "VIP Member"}</div>
                          <div className="text-neutral-600 text-[11px]">{sub.customer?.email}</div>
                          {sub.customer?.phone && (
                            <div className="text-neutral-500 text-[10px] flex items-center gap-1 mt-0.5">
                              <span>📞 {sub.customer.phone}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-neutral-400 mt-0.5">{sub.subscriptionId}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-neutral-900">{sub.planName}</div>
                          <div className="text-xs font-bold text-neutral-900 mt-0.5">₹{sub.amountPaid ?? 0}</div>
                          <div className="text-[10px] text-neutral-400">{sub.durationDays} Days</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700">
                          {sub.discountPercent}% OFF
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                sub.paymentMethod === "GPAY"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : sub.paymentMethod === "PHONEPE"
                                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                                  : sub.paymentMethod === "PAYTM"
                                  ? "bg-sky-100 text-sky-800 border border-sky-300"
                                  : sub.paymentMethod === "UPI"
                                  ? "bg-teal-100 text-teal-800 border border-teal-300"
                                  : sub.paymentMethod === "CASH"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-neutral-100 text-neutral-800 border border-neutral-300"
                              }`}
                            >
                              {sub.paymentMethod || "MANUAL_ADMIN"}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {sub.source === "QR_IN_STORE"
                                ? `QR: ${sub.storeCode || "COUNTER"}`
                                : sub.source === "ADMIN_MANUAL"
                                ? "ADMIN MANUAL"
                                : "ONLINE WEB"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isStillActive
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "EXPIRED"
                                ? "bg-neutral-200 text-neutral-600"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isStillActive ? "ACTIVE" : sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-neutral-700">
                          {new Date(sub.endDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-neutral-700 font-mono">
                          <span className="font-semibold block">{sub.paymentId ? sub.paymentId : "N/A"}</span>
                          {sub.notes && (
                            <span className="text-[10px] text-neutral-400 block truncate max-w-[140px]" title={sub.notes}>
                              {sub.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditSubModal(sub)}
                              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 border border-neutral-300 transition"
                              title="Edit Member Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub._id, sub.customer?.name || sub.customer?.email)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded border border-neutral-300 transition"
                              title="Delete Subscription Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isStillActive && (
                              <button
                                onClick={() => handleRevokeMembership(sub._id, sub.customer?.email)}
                                className="px-2 py-1 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition font-bold"
                                title="Revoke Membership"
                              >
                                REVOKE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 border rounded disabled:opacity-40"
                  >
                    PREV
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 border rounded disabled:opacity-40"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: IN-STORE QR CODE STUDIO */}
      {activeSubTab === "qr" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Campaign list */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                  Store Placards & QR Campaigns
                </h3>
                <p className="text-xs text-neutral-500">
                  Select a counter QR code to view, copy, or download for printing.
                </p>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="bg-black text-white hover:bg-neutral-800 text-[11px] font-mono px-3 py-1.5 rounded uppercase font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> NEW QR
              </button>
            </div>

            <div className="space-y-3">
              {qrCampaigns.map((camp) => (
                <div
                  key={camp._id}
                  onClick={() => setSelectedQrCampaign(camp)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedQrCampaign?._id === camp._id
                      ? "bg-neutral-900 text-white border-black shadow-md"
                      : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs uppercase tracking-wider">
                      {camp.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        selectedQrCampaign?._id === camp._id
                          ? "bg-white/20 text-emerald-400"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {camp.isActive ? "ACTIVE" : "DISABLED"}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mt-1">{camp.name}</h4>
                  <div className="flex items-center justify-between text-xs mt-3 opacity-80 font-mono">
                    <span>{camp.storeLocation}</span>
                    <span>
                      {camp.scansCount} scans • {camp.conversionsCount} sales
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Crisp Placard Live Preview & Download */}
          <div className="lg:col-span-7">
            {selectedQrCampaign && (
              <div className="bg-white rounded-2xl border border-neutral-300 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
                <span className="bg-neutral-100 text-neutral-800 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-widest font-bold mb-4">
                  IN-STORE PHYSICAL COUNTER PLACARD
                </span>

                {/* Printable Brand Card Frame */}
                <div className="border-4 border-black p-6 sm:p-8 rounded-2xl bg-[#fafafa] max-w-sm w-full shadow-lg">
                  <div className="font-mono tracking-widest text-lg font-black text-black mb-1">
                    DRAPZA
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-4">
                    VIP PRIVILEGE CLUB
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-neutral-200 shadow-inner flex items-center justify-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Membership QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">
                        Generating Crisp QR...
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                      SCAN WITH PHONE CAMERA
                    </p>
                    <p className="text-[11px] text-neutral-600 mt-1 font-sans">
                      Instant In-Store & Online Special Member Pricing on All Garments.
                    </p>
                    <div className="mt-3 inline-block bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded tracking-widest">
                      STORE REF: {selectedQrCampaign.code}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <button
                    onClick={handleDownloadQr}
                    className="bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg uppercase flex items-center gap-2 shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> DOWNLOAD PRINTABLE QR
                  </button>

                  <button
                    onClick={() => handleCopyLink(selectedQrCampaign.targetUrl)}
                    className="border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-mono font-bold px-4 py-2.5 rounded-lg uppercase flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" /> COPY DIRECT LINK
                  </button>

                  <a
                    href={selectedQrCampaign.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-mono font-bold px-4 py-2.5 rounded-lg uppercase flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> OPEN PAGE
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT PLAN */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-300 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-mono text-base font-bold uppercase tracking-wider">
                {editingPlan._id ? "Edit Membership Plan" : "Create New Membership Plan"}
              </h3>
              <button
                onClick={() => {
                  setIsPlanModalOpen(false);
                  setEditingPlan(null);
                }}
                className="text-neutral-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">PLAN NAME</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. 1 Year Membership"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PRICE (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPlan.price ?? 999}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    MEMBER DISCOUNT (%)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={90}
                    value={editingPlan.discountPercent ?? 15}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        discountPercent: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">DURATION (MONTHS)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPlan.durationMonths ?? 12}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10) || 1;
                      setEditingPlan({
                        ...editingPlan,
                        durationMonths: m,
                        durationDays: Math.round(m * 30.5),
                      });
                    }}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">VALIDITY (DAYS)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPlan.durationDays ?? 365}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        durationDays: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">BADGE LABEL</label>
                  <input
                    type="text"
                    value={editingPlan.badge || "VIP"}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">BADGE COLOR</label>
                  <input
                    type="text"
                    value={editingPlan.badgeColor || "#000000"}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badgeColor: e.target.value })}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  BENEFITS (ONE PER LINE)
                </label>
                <textarea
                  rows={4}
                  value={(editingPlan.benefits || []).join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      benefits: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="15% OFF storewide&#10;Complimentary express delivery&#10;VIP bespoke fitting room access"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planIsActive"
                  checked={editingPlan.isActive !== false}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, isActive: e.target.checked })
                  }
                  className="rounded text-black"
                />
                <label htmlFor="planIsActive" className="text-xs font-bold text-neutral-700">
                  PLAN IS ACTIVE AND SHOWN ON STOREFRONT
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlanModalOpen(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 border rounded text-xs font-bold uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded text-xs font-bold uppercase"
                >
                  SAVE PLAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL GRANT (GPAY / UPI / CASH / OFFLINE) */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-wider text-neutral-900">
                  Add Member Manually (GPay / Offline)
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  Direct enrollment for GPay, PhonePe, Paytm, QR, or counter cash payments.
                </p>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-neutral-400 hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantMembership} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">MEMBER FULL NAME</label>
                  <input
                    type="text"
                    value={grantName}
                    onChange={(e) => setGrantName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={grantPhone}
                    onChange={(e) => setGrantPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  CUSTOMER EMAIL <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="customer@domain.com"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  If the customer does not have an account yet, one will be created automatically.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">SELECT PLAN</label>
                  <select
                    value={grantPlanId}
                    onChange={(e) => handleGrantPlanChange(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (₹{p.price} • {p.discountPercent}% OFF)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">AMOUNT RECEIVED (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    placeholder="₹"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PAYMENT METHOD</label>
                  <select
                    value={grantPaymentMethod}
                    onChange={(e) => setGrantPaymentMethod(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    <option value="GPAY">Google Pay (GPay)</option>
                    <option value="PHONEPE">PhonePe</option>
                    <option value="PAYTM">Paytm</option>
                    <option value="UPI">Direct UPI / QR Scan</option>
                    <option value="CASH">Cash in Hand (Counter)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="MANUAL_ADMIN">Admin Discretion / Courtesy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">TRANSACTION REF / UTR</label>
                  <input
                    type="text"
                    value={grantPaymentId}
                    onChange={(e) => setGrantPaymentId(e.target.value)}
                    placeholder="e.g. UTR / UPI Ref ID"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">START DATE</label>
                  <input
                    type="date"
                    value={grantStartDate}
                    onChange={(e) => setGrantStartDate(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">VALIDITY (DAYS)</label>
                  <input
                    type="number"
                    min={1}
                    value={grantDurationDays}
                    onChange={(e) => setGrantDurationDays(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">ADMIN AUDIT NOTES</label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="e.g. Customer paid via GPay screenshot verified"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 border rounded text-xs font-bold uppercase hover:bg-neutral-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded text-xs font-bold uppercase shadow flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  + ADD & ACTIVATE MEMBER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW QR CAMPAIGN */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-mono text-base font-bold uppercase tracking-wider">
                Create Store QR Placard
              </h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-neutral-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQrCampaign} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">STORE CODE (UNIQUE)</label>
                <input
                  type="text"
                  required
                  value={newCampaignCode}
                  onChange={(e) => setNewCampaignCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MUMBAI-FLAGSHIP"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">PLACARD NAME</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. Main Showroom VIP Desk"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">LOCATION / BRANCH</label>
                <input
                  type="text"
                  value={newCampaignLocation}
                  onChange={(e) => setNewCampaignLocation(e.target.value)}
                  placeholder="e.g. Mumbai Atelier"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 border rounded text-xs font-bold uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded text-xs font-bold uppercase"
                >
                  CREATE PLACARD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT MEMBER SUBSCRIPTION */}
      {isEditSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-mono text-base font-bold uppercase tracking-wider text-neutral-900">
                  Edit Member Subscription
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  ID: {editingSub.subscriptionId || editingSub._id}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditSubModalOpen(false);
                  setEditingSub(null);
                }}
                className="text-neutral-400 hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSubscription} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">MEMBER NAME</label>
                  <input
                    type="text"
                    value={editingSub.customerName}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, customerName: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={editingSub.customerPhone}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, customerPhone: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">EMAIL (ACCOUNT LINKED)</label>
                <input
                  type="email"
                  disabled
                  value={editingSub.customerEmail}
                  className="w-full border border-neutral-200 bg-neutral-100 rounded px-3 py-2 text-xs text-neutral-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PLAN TITLE</label>
                  <input
                    type="text"
                    value={editingSub.planName}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, planName: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">MEMBER DISCOUNT (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={editingSub.discountPercent}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, discountPercent: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">SUBSCRIPTION STATUS</label>
                  <select
                    value={editingSub.status}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, status: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">VALIDITY UNTIL (EXPIRY)</label>
                  <input
                    type="date"
                    value={editingSub.endDate}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, endDate: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">AMOUNT PAID (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSub.amountPaid}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, amountPaid: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PAYMENT METHOD</label>
                  <select
                    value={editingSub.paymentMethod}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, paymentMethod: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    <option value="GPAY">Google Pay (GPay)</option>
                    <option value="PHONEPE">PhonePe</option>
                    <option value="PAYTM">Paytm</option>
                    <option value="UPI">Direct UPI / QR Scan</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="CASHFREE">Cashfree</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="MANUAL_ADMIN">Admin Courtesy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">PAYMENT ID / UTR REF</label>
                <input
                  type="text"
                  value={editingSub.paymentId}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, paymentId: e.target.value })
                  }
                  placeholder="e.g. UPI Ref / Cashfree Order / UTR"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">INTERNAL AUDIT NOTES</label>
                <input
                  type="text"
                  value={editingSub.notes}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, notes: e.target.value })
                  }
                  placeholder="e.g. VIP client requested extension"
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSubModalOpen(false);
                    setEditingSub(null);
                  }}
                  className="px-4 py-2 border rounded text-xs font-bold uppercase hover:bg-neutral-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded text-xs font-bold uppercase shadow"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

