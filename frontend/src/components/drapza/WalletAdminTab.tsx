"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Clock,
  ShieldCheck,
  Gift,
  Eye,
  Ban,
  Calendar,
  Layers,
  History,
  Mail,
  User,
  ArrowRight,
  Settings2,
} from "lucide-react";
import { walletApi, GiftCardItem, GiftCardTransactionItem, siteConfigApi, SiteConfigData, DEFAULT_SITE_CONFIG } from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";

const STATUS_FILTERS = [
  { id: "ALL", label: "ALL CARDS" },
  { id: "ACTIVE", label: "ACTIVE" },
  { id: "PARTIALLY_USED", label: "PARTIALLY USED" },
  { id: "USED", label: "EXHAUSTED" },
  { id: "EXPIRED", label: "EXPIRED" },
  { id: "CANCELLED", label: "CANCELLED" },
];

export function WalletAdminTab() {
  const [giftCards, setGiftCards] = useState<GiftCardItem[]>([]);
  const [metrics, setMetrics] = useState<{
    totalSales: number;
    totalRedeemed: number;
    outstandingLiabilities: number;
    totalCount: number;
  }>({
    totalSales: 0,
    totalRedeemed: 0,
    outstandingLiabilities: 0,
    totalCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Special Gift Card Redemption Discount Configuration State
  const [siteConfig, setSiteConfig] = useState<SiteConfigData>(DEFAULT_SITE_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<string | null>(null);

  // Modals
  const [isCreateGiftCardOpen, setIsCreateGiftCardOpen] = useState(false);
  const [isAdjustWalletOpen, setIsAdjustWalletOpen] = useState(false);
  const [selectedCardForLedger, setSelectedCardForLedger] = useState<GiftCardItem | null>(null);
  const [cardToCancel, setCardToCancel] = useState<GiftCardItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cardToExtend, setCardToExtend] = useState<GiftCardItem | null>(null);
  const [extendDays, setExtendDays] = useState<number>(365);

  // Lock background scroll when any wallet admin modal is active
  useLockBodyScroll(
    Boolean(
      isCreateGiftCardOpen ||
        isAdjustWalletOpen ||
        selectedCardForLedger ||
        cardToCancel ||
        cardToExtend
    )
  );

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create Gift Card Form
  const [gcAmount, setGcAmount] = useState<number>(2500);
  const [gcCode, setGcCode] = useState("");
  const [gcRecipientName, setGcRecipientName] = useState("");
  const [gcRecipientEmail, setGcRecipientEmail] = useState("");
  const [gcSenderName, setGcSenderName] = useState("Drapza Atelier Concierge");
  const [gcTheme, setGcTheme] = useState("noir");
  const [gcValidityDays, setGcValidityDays] = useState(365);
  const [gcNotes, setGcNotes] = useState("");
  const [gcSendEmail, setGcSendEmail] = useState(true);

  // Adjust Wallet Form
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState("");

  const fetchGiftCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await walletApi.adminGetGiftCards({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res.success) {
        setGiftCards(res.giftCards || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error("Failed to load gift cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchGiftCards();
    siteConfigApi.getSiteConfig().then((res) => {
      if (res.success && res.data) {
        setSiteConfig(res.data);
      }
    });
  }, [fetchGiftCards]);

  const handleSaveDiscountConfig = async () => {
    setIsSavingConfig(true);
    setConfigSaveSuccess(null);
    audioSystem.playClick(700);
    try {
      const res = await siteConfigApi.updateSiteConfig({
        giftCardRedemptionDiscountEnabled: siteConfig.giftCardRedemptionDiscountEnabled,
        giftCardRedemptionDiscountType: siteConfig.giftCardRedemptionDiscountType,
        giftCardRedemptionDiscountValue: Number(siteConfig.giftCardRedemptionDiscountValue),
        giftCardRedemptionMinOrderAmount: Number(siteConfig.giftCardRedemptionMinOrderAmount),
        giftCardRedemptionMaxDiscount: Number(siteConfig.giftCardRedemptionMaxDiscount),
        giftCardRedemptionPromoLabel: siteConfig.giftCardRedemptionPromoLabel,
        giftCardRedemptionDescription: siteConfig.giftCardRedemptionDescription,
      });
      if (res.success && res.data) {
        setSiteConfig(res.data);
        audioSystem.playSuccess();
        setConfigSaveSuccess("✓ Gift Card Buy & Use Special Discount settings updated and live across all client checkouts!");
        setTimeout(() => setConfigSaveSuccess(null), 5000);
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to update discount settings" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await walletApi.adminCreateGiftCard({
        amount: Number(gcAmount),
        customCode: gcCode.trim() || undefined,
        recipientName: gcRecipientName.trim() || undefined,
        recipientEmail: gcRecipientEmail.trim() || undefined,
        senderName: gcSenderName.trim() || undefined,
        theme: gcTheme,
        validityDays: Number(gcValidityDays),
        notes: gcNotes.trim() || undefined,
        sendEmailToRecipient: gcSendEmail,
      });
      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Gift Card successfully minted with denomination ₹${Number(gcAmount).toLocaleString("en-IN")}.`,
        });
        setIsCreateGiftCardOpen(false);
        setGcCode("");
        setGcRecipientEmail("");
        setGcRecipientName("");
        setGcNotes("");
        fetchGiftCards();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to create gift card." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardToCancel) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await walletApi.adminCancelGiftCard(cardToCancel._id, cancelReason.trim());
      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Gift Card ${cardToCancel.code} has been deactivated.`,
        });
        setCardToCancel(null);
        setCancelReason("");
        fetchGiftCards();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to cancel gift card." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardToExtend) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await walletApi.adminExtendGiftCardExpiry(cardToExtend._id, Number(extendDays));
      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Expiry extended by +${extendDays} days for ${cardToExtend.code}.`,
        });
        setCardToExtend(null);
        fetchGiftCards();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to extend expiry." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustEmail.trim()) {
      setActionMessage({ type: "error", text: "Please enter a valid customer email." });
      return;
    }
    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await walletApi.adminAdjust({
        userEmail: adjustEmail.trim(),
        type: adjustType,
        amount: Number(adjustAmount),
        reason: adjustReason.trim() || "Concierge adjustment by Atelier Administrator",
      });
      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Wallet successfully ${adjustType === "credit" ? "credited" : "debited"} for ${adjustEmail}.`,
        });
        setIsAdjustWalletOpen(false);
        setAdjustEmail("");
        setAdjustAmount(500);
        setAdjustReason("");
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to adjust wallet balance." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-neutral-900">
      {/* Top Banner Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-none flex items-center justify-between border shadow-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-sans text-xs">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
            ATELIER TREASURY & STORE CREDIT LEDGER
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900">
            DIGITAL GIFT CARDS & WALLET
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAdjustWalletOpen(true)}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 font-mono-technical text-xs uppercase tracking-wider text-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>ADJUST WALLET</span>
          </button>
          <button
            onClick={() => setIsCreateGiftCardOpen(true)}
            className="px-4 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>MINT GIFT CARD</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="font-mono-technical text-[10px] uppercase tracking-wider font-bold">TOTAL SALES</span>
            <Wallet className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-neutral-900">
            ₹{metrics.totalSales.toLocaleString("en-IN")}
          </div>
          <span className="font-sans text-[11px] text-neutral-500 mt-1 block">
            All-time issued card value
          </span>
        </div>

        {/* Total Redeemed */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="font-mono-technical text-[10px] uppercase tracking-wider font-bold">TOTAL REDEEMED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-700">
            ₹{metrics.totalRedeemed.toLocaleString("en-IN")}
          </div>
          <span className="font-sans text-[11px] text-neutral-500 mt-1 block">
            Applied at checkout & wallet
          </span>
        </div>

        {/* Outstanding Liabilities */}
        <div className="p-5 rounded-none bg-neutral-950 text-white border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="font-mono-technical text-[10px] uppercase tracking-wider font-bold">OUTSTANDING LIABILITY</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-amber-300">
            ₹{metrics.outstandingLiabilities.toLocaleString("en-IN")}
          </div>
          <span className="font-sans text-[11px] text-neutral-400 mt-1 block">
            Active unredeemed balances
          </span>
        </div>

        {/* Total Issued Cards */}
        <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="font-mono-technical text-[10px] uppercase tracking-wider font-bold">TOTAL CARDS</span>
            <CreditCard className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-neutral-900">
            {metrics.totalCount || giftCards.length}
          </div>
          <span className="font-sans text-[11px] text-neutral-500 mt-1 block">
            {giftCards.filter((g) => g.status === "Active" || g.status === "Partially Used").length} active vouchers
          </span>
        </div>
      </div>

      {/* ================= SPECIAL GIFT CARD BUY & REDEMPTION DISCOUNT CMS ================= */}
      <div className="bg-white border border-neutral-200 rounded-none p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-none ${
                  siteConfig.giftCardRedemptionDiscountEnabled !== false ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
                }`}
              />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-black" />
                <span>GIFT CARD BUY &amp; USE SPECIAL DISCOUNT CONTROL</span>
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-none font-bold uppercase ${
                  siteConfig.giftCardRedemptionDiscountEnabled !== false
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {siteConfig.giftCardRedemptionDiscountEnabled !== false ? "ACTIVE PERK" : "DISABLED"}
              </span>
            </div>
            <p className="font-sans text-xs text-neutral-500 mt-1">
              Give users an extra instant promotional discount when they buy and redeem a Gift Card to purchase products.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={siteConfig.giftCardRedemptionDiscountEnabled ?? true}
                onChange={(e) =>
                  setSiteConfig((prev) => ({
                    ...prev,
                    giftCardRedemptionDiscountEnabled: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
            </label>

            <button
              type="button"
              onClick={handleSaveDiscountConfig}
              disabled={isSavingConfig}
              className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingConfig ? (
                <span>SAVING...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVE PERK</span>
                </>
              )}
            </button>
          </div>
        </div>

        {configSaveSuccess && (
          <div className="p-3.5 rounded-none bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono text-xs font-bold flex items-center justify-between">
            <span>{configSaveSuccess}</span>
            <button onClick={() => setConfigSaveSuccess(null)} className="text-neutral-400 hover:text-black">
              ✕
            </button>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Discount Type */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              DISCOUNT TYPE
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setSiteConfig((prev) => ({ ...prev, giftCardRedemptionDiscountType: "percentage" }))
                }
                className={`py-2 px-3 rounded-none border font-mono text-xs font-bold transition-all cursor-pointer text-center ${
                  siteConfig.giftCardRedemptionDiscountType === "percentage"
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                PERCENTAGE (%)
              </button>
              <button
                type="button"
                onClick={() =>
                  setSiteConfig((prev) => ({ ...prev, giftCardRedemptionDiscountType: "fixed" }))
                }
                className={`py-2 px-3 rounded-none border font-mono text-xs font-bold transition-all cursor-pointer text-center ${
                  siteConfig.giftCardRedemptionDiscountType === "fixed"
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                FLAT (₹)
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              DISCOUNT RATE ({siteConfig.giftCardRedemptionDiscountType === "percentage" ? "%" : "₹"})
            </label>
            <input
              type="number"
              min={1}
              max={siteConfig.giftCardRedemptionDiscountType === "percentage" ? 90 : 50000}
              value={siteConfig.giftCardRedemptionDiscountValue ?? 10}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  giftCardRedemptionDiscountValue: Number(e.target.value),
                }))
              }
              className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs font-bold focus:outline-none focus:border-black focus:bg-white"
            />
            <span className="font-mono text-[10px] text-neutral-400 block">
              {siteConfig.giftCardRedemptionDiscountType === "percentage"
                ? "Customer gets extra % off order subtotal"
                : "Customer gets flat ₹ off order"}
            </span>
          </div>

          {/* Minimum Order Amount */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              MIN ORDER AMOUNT (₹)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={siteConfig.giftCardRedemptionMinOrderAmount ?? 0}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  giftCardRedemptionMinOrderAmount: Number(e.target.value),
                }))
              }
              placeholder="0 for all orders"
              className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white"
            />
            <span className="font-mono text-[10px] text-neutral-400 block">
              Minimum garment subtotal required (0 = any)
            </span>
          </div>

          {/* Max Cap */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              MAX DISCOUNT CAP (₹)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={siteConfig.giftCardRedemptionMaxDiscount ?? 1000}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  giftCardRedemptionMaxDiscount: Number(e.target.value),
                }))
              }
              placeholder="1000"
              className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs focus:outline-none focus:border-black focus:bg-white"
            />
            <span className="font-mono text-[10px] text-neutral-400 block">
              Maximum bonus discount allowed per order
            </span>
          </div>
        </div>

        {/* Promo Messaging */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              PROMOTIONAL LABEL / BADGE TEXT
            </label>
            <input
              type="text"
              value={siteConfig.giftCardRedemptionPromoLabel || "SPECIAL GIFT CARD BONUS PERK"}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  giftCardRedemptionPromoLabel: e.target.value,
                }))
              }
              placeholder="SPECIAL GIFT CARD BONUS PERK"
              className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-mono text-xs uppercase focus:outline-none focus:border-black focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700">
              CHECKOUT EXPLANATION MESSAGE
            </label>
            <input
              type="text"
              value={
                siteConfig.giftCardRedemptionDescription ||
                "Get an extra 10% instant discount when paying with a Drapza Gift Card!"
              }
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  giftCardRedemptionDescription: e.target.value,
                }))
              }
              placeholder="Get an extra 10% instant discount when paying with a Drapza Gift Card!"
              className="w-full px-3.5 py-2 rounded-none border border-neutral-200 bg-neutral-50 font-sans text-xs focus:outline-none focus:border-black focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200 space-y-4 bg-neutral-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 16-character code, recipient email, or sender..."
                className="pl-9 pr-4 py-2.5 rounded-none border border-neutral-200 text-xs font-sans focus:outline-none focus:border-black w-full bg-white shadow-xs"
              />
            </div>

            <button
              onClick={fetchGiftCards}
              className="p-2.5 rounded-none border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors self-end sm:self-auto flex items-center gap-1.5 font-mono text-xs cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>SYNC</span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-none font-mono-technical text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer border ${
                    isActive
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gift Cards Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 font-mono-technical text-[10px] uppercase text-neutral-600">
                <th className="py-3 px-4">CARD CODE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">CURRENT BALANCE</th>
                <th className="py-3 px-4">INITIAL VALUE</th>
                <th className="py-3 px-4">RECIPIENT</th>
                <th className="py-3 px-4">THEME</th>
                <th className="py-3 px-4">EXPIRY</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-500" />
                    Synchronizing Treasury Ledger...
                  </td>
                </tr>
              ) : giftCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 font-mono text-xs">
                    No gift cards found matching your query.
                  </td>
                </tr>
              ) : (
                giftCards.map((card) => {
                  const isExpired = new Date(card.expiryDate) < new Date();
                  const effectiveStatus = card.status || (card.currentBalance <= 0 ? "Used" : isExpired ? "Expired" : "Active");

                  return (
                    <tr key={card._id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 tracking-wider bg-neutral-100 px-2 py-0.5 rounded-none border border-neutral-200 select-all">
                            {card.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(card.code)}
                            className="p-1 hover:bg-neutral-200 rounded-none text-neutral-400 hover:text-black transition-colors cursor-pointer"
                            title="Copy 16-character code"
                          >
                            {copiedCode === card.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {effectiveStatus === "Active" ? (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : effectiveStatus === "Partially Used" ? (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            PARTIAL
                          </span>
                        ) : effectiveStatus === "Used" ? (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
                            EXHAUSTED
                          </span>
                        ) : effectiveStatus === "Expired" ? (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-neutral-100 text-neutral-400 border border-neutral-200">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Current Balance */}
                      <td className="py-3 px-4 font-mono font-black text-neutral-900">
                        ₹{card.currentBalance.toLocaleString("en-IN")}
                      </td>

                      {/* Initial Value */}
                      <td className="py-3 px-4 font-mono text-neutral-500">
                        ₹{card.initialBalance.toLocaleString("en-IN")}
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4 text-neutral-700">
                        {card.recipientEmail || card.assignedToEmail ? (
                          <div>
                            <span className="font-medium text-neutral-900 block">
                              {card.recipientName || "Valued Patron"}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-400">
                              {card.recipientEmail || card.assignedToEmail}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[10px]">Unrestricted</span>
                        )}
                      </td>

                      {/* Theme */}
                      <td className="py-3 px-4 font-mono text-[10px] uppercase text-neutral-600">
                        {card.theme || "noir"}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                        {new Date(card.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ledger Button */}
                          <button
                            onClick={() => setSelectedCardForLedger(card)}
                            className="px-2.5 py-1 rounded-none border border-neutral-200 hover:border-black font-mono-technical text-[10px] uppercase flex items-center gap-1 transition-colors bg-white hover:bg-neutral-50 cursor-pointer shadow-2xs"
                            title="View Transaction Ledger"
                          >
                            <History className="w-3 h-3 text-neutral-500" />
                            <span>LEDGER</span>
                          </button>

                          {/* Extend Expiry */}
                          <button
                            onClick={() => setCardToExtend(card)}
                            className="px-2.5 py-1 rounded-none border border-neutral-200 hover:border-black font-mono-technical text-[10px] uppercase flex items-center gap-1 transition-colors bg-white hover:bg-neutral-50 cursor-pointer shadow-2xs"
                            title="Extend Expiry"
                          >
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>EXTEND</span>
                          </button>

                          {/* Cancel Button */}
                          {effectiveStatus !== "Cancelled" && effectiveStatus !== "Used" && (
                            <button
                              onClick={() => setCardToCancel(card)}
                              className="px-2 py-1 rounded-none border border-rose-200 hover:bg-rose-50 text-rose-700 font-mono-technical text-[10px] uppercase transition-colors cursor-pointer"
                              title="Deactivate Gift Card"
                            >
                              <Ban className="w-3 h-3" />
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
        </div>
      </div>

      {/* ================= MODAL: TRANSACTION LEDGER ================= */}
      {selectedCardForLedger && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-2xl w-full p-6 sm:p-7 border border-neutral-200 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] flex flex-col overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-none bg-black text-white flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-400 block">
                    CARD AUDIT TRAIL & LEDGER
                  </span>
                  <h3 className="font-mono text-base font-bold text-neutral-900">
                    {selectedCardForLedger.code}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCardForLedger(null)}
                className="p-1.5 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Card Summary */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-none bg-neutral-50 border border-neutral-200 font-mono text-xs shrink-0">
              <div>
                <span className="text-[10px] text-neutral-400 block">INITIAL VALUE:</span>
                <span className="font-bold">₹{selectedCardForLedger.initialBalance.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">CURRENT BALANCE:</span>
                <span className="font-black text-emerald-700">
                  ₹{selectedCardForLedger.currentBalance.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">STATUS:</span>
                <span className="font-bold text-neutral-900">{selectedCardForLedger.status || "Active"}</span>
              </div>
            </div>

            {/* Transactions List */}
            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="space-y-3 overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain scroll-smooth pr-1"
            >
              <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                AUDIT ENTRIES ({selectedCardForLedger.transactions?.length || 0})
              </span>

              {!selectedCardForLedger.transactions || selectedCardForLedger.transactions.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 font-mono text-xs">
                  No deduction transactions recorded yet. Card remains unredeemed.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCardForLedger.transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-none border border-neutral-200 bg-white space-y-1.5 font-sans text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono-technical text-[9px] uppercase px-2 py-0.5 rounded-none font-bold ${
                              tx.type === "PURCHASE"
                                ? "bg-emerald-100 text-emerald-800"
                                : tx.type === "REDEMPTION"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-mono text-xs font-bold">
                            {tx.type === "REDEMPTION" ? `-₹${tx.amount.toLocaleString("en-IN")}` : `₹${tx.amount.toLocaleString("en-IN")}`}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {new Date(tx.date).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                        <span>{tx.description || "Ledger Entry"}</span>
                        <span>Balance Left: ₹{tx.remainingBalance?.toLocaleString("en-IN") ?? "0"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCardForLedger(null)}
                className="px-5 py-2 rounded-none bg-black text-white font-mono-technical text-xs uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXTEND EXPIRY ================= */}
      {cardToExtend && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-black" />
                <h3 className="font-display text-base font-bold uppercase text-neutral-900">
                  EXTEND GIFT CARD EXPIRY
                </h3>
              </div>
              <button
                onClick={() => setCardToExtend(null)}
                className="p-1 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtendExpiry} className="space-y-4 font-sans text-xs">
              <div>
                <span className="font-mono text-xs font-bold text-neutral-800 block">
                  Code: {cardToExtend.code}
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  Current Expiry: {new Date(cardToExtend.expiryDate).toLocaleDateString("en-IN")}
                </span>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  CHOOSE EXTENSION DURATION *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 90, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExtendDays(days)}
                      className={`py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer border ${
                        extendDays === days
                          ? "bg-black text-white border-black"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      +{days} DAYS
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCardToExtend(null)}
                  className="px-4 py-2 rounded-none border border-neutral-200 font-mono-technical text-xs uppercase text-neutral-600 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase font-bold cursor-pointer"
                >
                  {submitting ? "EXTENDING..." : `CONFIRM +${extendDays} DAYS`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CANCEL GIFT CARD ================= */}
      {cardToCancel && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-display text-base font-bold uppercase text-neutral-900">
                  DEACTIVATE GIFT CARD
                </h3>
              </div>
              <button
                onClick={() => setCardToCancel(null)}
                className="p-1 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelCard} className="space-y-4 font-sans text-xs">
              <p className="text-neutral-600 leading-relaxed">
                Are you sure you want to deactivate gift card <strong className="font-mono text-neutral-900">{cardToCancel.code}</strong> with balance <strong className="font-mono">₹{cardToCancel.currentBalance.toLocaleString("en-IN")}</strong>? The card will no longer be redeemable at checkout.
              </p>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  AUDIT DEACTIVATION REASON *
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Card replaced / Customer refund processed / Fraudulent order"
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCardToCancel(null)}
                  className="px-4 py-2 rounded-none border border-neutral-200 font-mono-technical text-xs uppercase text-neutral-600 cursor-pointer"
                >
                  KEEP ACTIVE
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-mono-technical text-xs uppercase font-bold cursor-pointer"
                >
                  {submitting ? "DEACTIVATING..." : "CONFIRM DEACTIVATION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MINT GIFT CARD ================= */}
      {isCreateGiftCardOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-lg w-full border border-neutral-200 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden my-auto"
          >
            <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-black" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-900">
                  MINT NEW DRAPZA GIFT CARD
                </h3>
              </div>
              <button
                onClick={() => setIsCreateGiftCardOpen(false)}
                className="p-1.5 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-6 overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain scroll-smooth"
            >
              <form onSubmit={handleCreateGiftCard} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  CARD DENOMINATION (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={gcAmount}
                  onChange={(e) => setGcAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-none border border-neutral-200 font-mono text-sm focus:outline-none focus:border-black"
                  placeholder="e.g. 2500"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  CUSTOM 16-CHAR CODE (LEAVE EMPTY TO AUTO-GENERATE)
                </label>
                <input
                  type="text"
                  value={gcCode}
                  onChange={(e) => setGcCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase focus:outline-none focus:border-black"
                  placeholder="e.g. DPZX-9921-4821-0021"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                    RECIPIENT NAME
                  </label>
                  <input
                    type="text"
                    value={gcRecipientName}
                    onChange={(e) => setGcRecipientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black text-xs"
                    placeholder="e.g. Alex Mercer"
                  />
                </div>
                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                    RECIPIENT EMAIL
                  </label>
                  <input
                    type="email"
                    value={gcRecipientEmail}
                    onChange={(e) => setGcRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black font-mono text-xs"
                    placeholder="e.g. patron@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                    THEME
                  </label>
                  <select
                    value={gcTheme}
                    onChange={(e) => setGcTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono text-xs uppercase bg-white focus:outline-none focus:border-black"
                  >
                    <option value="noir">Archival Noir</option>
                    <option value="brutalist">Brutalist White</option>
                    <option value="platinum">Liquid Platinum</option>
                    <option value="gold">Obsidian Gold</option>
                    <option value="emerald">Emerald Signature</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                    VALIDITY (DAYS)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={gcValidityDays}
                    onChange={(e) => setGcValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-none border border-neutral-200 font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  INTERNAL CONCIERGE NOTES
                </label>
                <input
                  type="text"
                  value={gcNotes}
                  onChange={(e) => setGcNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black"
                  placeholder="e.g. VIP drop package compensation"
                />
              </div>

              <div className="p-3 rounded-none bg-neutral-50 border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={gcSendEmail}
                    onChange={(e) => setGcSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded-none text-black accent-black cursor-pointer"
                  />
                  <span className="font-mono text-xs text-neutral-700">
                    Dispatch luxury HTML gift card email to recipient immediately
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateGiftCardOpen(false)}
                  className="px-4 py-2 rounded-none border border-neutral-200 font-mono-technical text-xs uppercase text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider disabled:opacity-50 font-bold cursor-pointer"
                >
                  {submitting ? "MINTING..." : "MINT GIFT CARD"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST USER WALLET ================= */}
      {isAdjustWalletOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-lg w-full border border-neutral-200 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden my-auto"
          >
            <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-black" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-900">
                  MANUAL WALLET ADJUSTMENT
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustWalletOpen(false)}
                className="p-1.5 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-6 overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain scroll-smooth"
            >
              <form onSubmit={handleAdjustWallet} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  CUSTOMER ACCOUNT EMAIL *
                </label>
                <input
                  type="email"
                  required
                  value={adjustEmail}
                  onChange={(e) => setAdjustEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-none border border-neutral-200 focus:outline-none focus:border-black font-mono text-xs"
                  placeholder="customer@domain.com"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  OPERATION TYPE *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType("credit")}
                    className={`p-3 rounded-none border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      adjustType === "credit"
                        ? "bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    CREDIT (+ ADD CASH)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType("debit")}
                    className={`p-3 rounded-none border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      adjustType === "debit"
                        ? "bg-rose-600 text-white border-rose-700 font-bold shadow-xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    DEBIT (- DEDUCT)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  AMOUNT (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-none border border-neutral-200 font-mono text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                  AUDIT REASON (VISIBLE TO PATRON IN PASSBOOK) *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-none border border-neutral-200 focus:outline-none focus:border-black"
                  placeholder="e.g. Return store credit compensation / Order courtesy credit"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustWalletOpen(false)}
                  className="px-4 py-2 rounded-none border border-neutral-200 font-mono-technical text-xs uppercase text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider disabled:opacity-50 font-bold cursor-pointer"
                >
                  {submitting ? "POSTING..." : `EXECUTE ${adjustType.toUpperCase()}`}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
