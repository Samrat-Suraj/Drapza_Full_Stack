"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Banknote,
  Check,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  ShieldCheck,
  Eye,
  Loader2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";
import { paymentConfigApi, PaymentConfigData, DEFAULT_PAYMENT_CONFIG } from "@/lib/api";

const PREVIEW_DELIVERY_OPTIONS = [
  {
    id: "FAST",
    title: "Fast Delivery",
    desc: "Get your order in 1–3 days.",
    deliveryTime: "1 – 3 days",
    price: 99.0,
    priceDisplay: "₹99",
    type: "fast",
  },
  {
    id: "COMPLIMENTARY",
    title: "Complimentary",
    desc: "Free standard delivery.",
    deliveryTime: "4 – 7 days",
    price: 0.0,
    priceDisplay: "FREE",
    type: "gift",
  },
];

interface PaymentConfigAdminTabProps {
  config: PaymentConfigData;
  setConfig: React.Dispatch<React.SetStateAction<PaymentConfigData>>;
  onSaveSuccess?: () => void;
}

export const PaymentConfigAdminTab: React.FC<PaymentConfigAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewSelectedMode, setPreviewSelectedMode] = useState<"CASHFREE" | "RAZORPAY" | "COD">(
    config.defaultMethod === "UPI_DIRECT" ? "CASHFREE" : (config.defaultMethod as "CASHFREE" | "RAZORPAY" | "COD") || "CASHFREE"
  );
  const [previewDeliveryOption, setPreviewDeliveryOption] = useState<"FAST" | "COMPLIMENTARY">("FAST");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    audioSystem.playClick(900);

    try {
      const configToSave: PaymentConfigData = {
        ...config,
        directUpi: {
          ...config.directUpi,
          isEnabled: false,
        },
      };
      const res = await paymentConfigApi.updatePaymentConfig(configToSave);
      if (res.success && res.data) {
        setConfig(res.data);
        setSaveMessage("Payment authentication settings saved and published live!");
        audioSystem.playClick(1000);
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        throw new Error(res.message || "Failed to update configuration");
      }
    } catch (err: any) {
      console.error("Save payment config error:", err);
      setSaveMessage("Error saving payment configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleExecuteReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    audioSystem.playClick(600);

    try {
      const res = await paymentConfigApi.resetPaymentConfig();
      if (res.success && res.data) {
        setConfig(res.data);
        const def = res.data.defaultMethod;
        setPreviewSelectedMode(def === "UPI_DIRECT" ? "CASHFREE" : (def || "CASHFREE"));
        setSaveMessage("Reset to factory defaults successfully.");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-none bg-[#141414] border border-white/10 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-white animate-pulse" />
              CHECKOUT CONTROLS // STEP 04
            </span>
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold uppercase text-white tracking-wide">
            Payment Authentication Control
          </h1>
          <p className="text-xs text-neutral-400 font-sans max-w-2xl leading-relaxed">
            Manage, enable or disable payment methods displayed at checkout Step 04: Cashfree Checkout, Online Gateway (Cards/Netbanking), and Cash on Delivery (COD).
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-4 py-2.5 rounded-none border border-white/20 text-neutral-300 hover:text-white hover:border-white/40 font-mono text-xs uppercase font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-none bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            {isSaving ? (
              <span className="animate-pulse">SAVING...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>SAVE CONFIGURATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-none bg-white/10 border border-white/20 text-white font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-white shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Controls (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Controls (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* METHOD 1: Cashfree Payments Gateway */}
          <div className="p-6 rounded-none bg-[#121212] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-white text-black flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold uppercase text-white">
                    1. Cashfree Secure Checkout (UPI, Cards, Netbanking)
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Production Cashfree PG Engine with Instant UPI, Cards & Netbanking
                  </span>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                  {config.cashfree?.isEnabled ? "ACTIVE" : "DISABLED"}
                </span>
                <input
                  type="checkbox"
                  checked={config.cashfree?.isEnabled ?? true}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cashfree: {
                        ...(config.cashfree || DEFAULT_PAYMENT_CONFIG.cashfree),
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-white relative after:peer-checked:bg-black"></div>
              </label>
            </div>

            {/* Production Whitelisting Notice */}
            <div className="p-3.5 rounded-none bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono text-neutral-300 space-y-1">
                <span className="font-bold text-amber-300 block uppercase">Cashfree Production Domain Whitelisting:</span>
                <p className="leading-relaxed">
                  In Production mode, Cashfree blocks payments from unapproved origins (e.g. <code>localhost:3000</code>). Ensure your domain is whitelisted on Cashfree, or use <strong>Cashfree Sandbox (Test Mode)</strong> keys in <code>backend/.env</code> for instant local testing.
                </p>
                <a
                  href="https://merchant.cashfree.com/merchants/whitelisting"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-bold uppercase mt-1 cursor-pointer"
                >
                  <span>Open Cashfree Whitelisting Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                  Display Title
                </label>
                <input
                  type="text"
                  value={config.cashfree?.title || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cashfree: {
                        ...(config.cashfree || DEFAULT_PAYMENT_CONFIG.cashfree),
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. CASHFREE SECURE CHECKOUT (UPI, CARDS, NETBANKING)"
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={config.cashfree?.subtitle || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cashfree: {
                        ...(config.cashfree || DEFAULT_PAYMENT_CONFIG.cashfree),
                        subtitle: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. INSTANT ZERO-FEE CHECKOUT VIA CASHFREE PAYMENTS ENGINE"
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-none bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs uppercase font-bold text-white block">
                    Show &ldquo;Recommended&rdquo; Badge
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-sans">
                    Highlights Cashfree to incentivize fast online settlements
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={config.cashfree?.badgeText || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cashfree: {
                          ...(config.cashfree || DEFAULT_PAYMENT_CONFIG.cashfree),
                          badgeText: e.target.value,
                        },
                      })
                    }
                    placeholder="RECOMMENDED"
                    className="w-28 px-2.5 py-1.5 rounded-none bg-black/50 border border-white/20 text-white font-mono text-[11px] uppercase text-center"
                  />
                  <input
                    type="checkbox"
                    checked={config.cashfree?.showBadge ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cashfree: {
                          ...(config.cashfree || DEFAULT_PAYMENT_CONFIG.cashfree),
                          showBadge: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 2: Online Gateway (Razorpay) */}
          <div className="p-6 rounded-none bg-[#121212] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-white text-black flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold uppercase text-white">
                    2. Razorpay Gateway (Cards, UPI, Netbanking)
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Automated gateway settlement via Razorpay
                  </span>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                  {config.razorpay.isEnabled ? "ACTIVE" : "DISABLED"}
                </span>
                <input
                  type="checkbox"
                  checked={config.razorpay.isEnabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      razorpay: { ...config.razorpay, isEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-white relative after:peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                  Display Title
                </label>
                <input
                  type="text"
                  value={config.razorpay.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      razorpay: { ...config.razorpay, title: e.target.value },
                    })
                  }
                  placeholder="e.g. ONLINE GATEWAY (CARDS, UPI, NETBANKING)"
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={config.razorpay.subtitle}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      razorpay: { ...config.razorpay, subtitle: e.target.value },
                    })
                  }
                  placeholder="e.g. ZERO CONVENIENCE FEE. INSTANT DISPATCH QUEUE VALIDATION."
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-none bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs uppercase font-bold text-white block">
                    Show &ldquo;Recommended&rdquo; Badge
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-sans">
                    Highlights this option to incentivize fast online settlements
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={config.razorpay.badgeText}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        razorpay: { ...config.razorpay, badgeText: e.target.value },
                      })
                    }
                    placeholder="RECOMMENDED"
                    className="w-28 px-2.5 py-1.5 rounded-none bg-black/50 border border-white/20 text-white font-mono text-[11px] uppercase text-center"
                  />
                  <input
                    type="checkbox"
                    checked={config.razorpay.showBadge}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        razorpay: { ...config.razorpay, showBadge: e.target.checked },
                      })
                    }
                    className="rounded-none accent-white cursor-pointer w-4 h-4"
                  />
                </div>
              </div>
            </div>
          </div>



          {/* METHOD 3: Cash On Delivery (COD) */}
          <div className="p-6 rounded-none bg-[#121212] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-white text-black flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold uppercase text-white">
                    3. Cash on Delivery (COD)
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Doorstep cash payment upon garment handover
                  </span>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                  {config.cod.isEnabled ? "ACTIVE" : "DISABLED"}
                </span>
                <input
                  type="checkbox"
                  checked={config.cod.isEnabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cod: { ...config.cod, isEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-white relative after:peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                    Display Title
                  </label>
                  <input
                    type="text"
                    value={config.cod.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cod: { ...config.cod, title: e.target.value },
                      })
                    }
                    placeholder="e.g. CASH ON DELIVERY (COD)"
                    className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={config.cod.subtitle}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cod: { ...config.cod, subtitle: e.target.value },
                      })
                    }
                    placeholder="e.g. PAY IN CASH UPON DOORSTEP GARMENT INSPECTION"
                    className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                    Extra Handling Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.cod.extraFee}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cod: { ...config.cod, extraFee: Math.max(0, Number(e.target.value)) },
                      })
                    }
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white"
                  />
                  <span className="text-[9px] text-neutral-500 font-mono mt-1 block">
                    0 = Free COD
                  </span>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.cod.minOrderAmount}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cod: { ...config.cod, minOrderAmount: Math.max(0, Number(e.target.value)) },
                      })
                    }
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                    Max Order Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.cod.maxOrderAmount}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cod: { ...config.cod, maxOrderAmount: Math.max(0, Number(e.target.value)) },
                      })
                    }
                    placeholder="50000"
                    className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 4: Global Checkout Defaults & Notices */}
          <div className="p-6 rounded-none bg-[#121212] border border-white/10 space-y-5 shadow-xl">
            <h3 className="font-mono text-sm font-bold uppercase text-white pb-3 border-b border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Global Payment Defaults & Notice Banner</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                  Default Selected Method
                </label>
                <select
                  value={config.defaultMethod}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      defaultMethod: e.target.value as "CASHFREE" | "RAZORPAY" | "UPI_DIRECT" | "COD",
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/20 text-white font-mono text-xs uppercase focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="CASHFREE" className="bg-neutral-900 text-white">
                    CASHFREE SECURE CHECKOUT (RECOMMENDED)
                  </option>
                  <option value="RAZORPAY" className="bg-neutral-900 text-white">
                    ONLINE GATEWAY (RAZORPAY)
                  </option>
                  <option value="COD" className="bg-neutral-900 text-white">
                    CASH ON DELIVERY (COD)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                    Announcement Banner
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showNotice}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          showNotice: e.target.checked,
                        })
                      }
                      className="rounded-none accent-white cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="font-mono text-[9px] uppercase text-neutral-300">Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.announcementNotice}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      announcementNotice: e.target.value,
                    })
                  }
                  placeholder="e.g. Complimentary express insured dispatch on all prepaid orders."
                  className="w-full px-3.5 py-2.5 rounded-none bg-white/5 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Live Preview (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-white" />
                LIVE CHECKOUT STEP 04 PREVIEW
              </span>
              <span className="font-mono text-[9px] text-neutral-400 bg-white/10 px-2 py-0.5 rounded-none">
                Interactive Test Mode
              </span>
            </div>

            {/* Live Customer Checkout Panel: Styled exactly as /checkout/payment */}
            <div className="drapza-payment-panel p-5 sm:p-6 rounded-none bg-[#edf1e8] text-[#0f0f0f] border border-[#afb3ab]/50 shadow-2xl space-y-5">
              {/* Step & Title Bar */}
              <div className="drapza-payment-header pb-3 mb-3 border-b border-dashed border-[#afb3ab]">
                <div className="drapza-payment-logo text-xl sm:text-2xl font-normal text-[#0f0f0f]">DRAPZA</div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#7d807a]">
                    STEP 04 OF 04 : SECURE PAYMENT
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#0f0f0f] bg-black/5 px-2 py-0.5 border border-black/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE PREVIEW
                  </div>
                </div>
              </div>

              {/* Dynamic Announcement Banner */}
              {config.showNotice && config.announcementNotice && (
                <div
                  style={{
                    backgroundColor: "#f7f9f5",
                    border: "1px solid #afb3ab",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.72rem",
                    color: "#0f0f0f",
                    letterSpacing: "0.02em",
                  }}
                >
                  <Info size={15} style={{ color: "#0f0f0f", flexShrink: 0 }} />
                  <span>{config.announcementNotice}</span>
                </div>
              )}

              {/* Delivery Options Section */}
              <div className="drapza-delivery-section">
                <div className="drapza-delivery-header">
                  <div className="drapza-delivery-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px", flexShrink: 0 }}>
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className="drapza-delivery-header-text">
                    <h4 className="drapza-delivery-title" style={{ fontSize: "1.25rem" }}>Delivery Option</h4>
                    <p className="drapza-delivery-subtitle" style={{ fontSize: "0.68rem" }}>Select your preferred dispatch method</p>
                  </div>
                </div>

                <div className="drapza-delivery-cards-list">
                  {PREVIEW_DELIVERY_OPTIONS.map((opt) => {
                    const isSelected = previewDeliveryOption === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`drapza-deliv-card ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          audioSystem.playClick(500);
                          setPreviewDeliveryOption(opt.id as "FAST" | "COMPLIMENTARY");
                        }}
                      >
                        <div className="drapza-deliv-left">
                          <div className="drapza-deliv-radio">
                            {isSelected && <div className="drapza-deliv-radio-inner" />}
                          </div>
                          <div className="drapza-deliv-icon">
                            {opt.type === "fast" ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px", flexShrink: 0 }}>
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px", flexShrink: 0 }}>
                                <polyline points="20 12 20 22 4 22 4 12" />
                                <rect x="2" y="7" width="20" height="5" />
                                <line x1="12" y1="22" x2="12" y2="7" />
                                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                              </svg>
                            )}
                          </div>
                          <div className="drapza-deliv-info">
                            <div className="drapza-deliv-name">{opt.title}</div>
                            <p className="drapza-deliv-desc">{opt.desc}</p>
                          </div>
                        </div>

                        <div className="drapza-deliv-right">
                          <div className="drapza-deliv-pricing">
                            <div className="drapza-deliv-price-val">{opt.priceDisplay}</div>
                            <div className="drapza-deliv-time-val">
                              <Clock size={11} strokeWidth={2} style={{ width: "11px", height: "11px", flexShrink: 0 }} />
                              <span>{opt.deliveryTime}</span>
                            </div>
                          </div>

                          <div className="drapza-deliv-arrow">
                            <ChevronRight size={16} strokeWidth={2.2} style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Header */}
              <div className="drapza-pm-section-header">
                <h5 className="drapza-pm-section-title" style={{ fontSize: "1.25rem" }}>Payment Method</h5>
                <p className="drapza-pm-section-sub" style={{ fontSize: "0.68rem" }}>Select how you want to complete your payment.</p>
              </div>

              {/* Payment Method Option Cards */}
              <div className="space-y-3">
                {/* 1. Cash on Delivery (COD) */}
                {config.cod.isEnabled && (
                  <div
                    className={`drapza-method-card ${previewSelectedMode === "COD" ? "selected" : ""}`}
                    onClick={() => {
                      audioSystem.playClick(600);
                      setPreviewSelectedMode("COD");
                    }}
                  >
                    <div className="drapza-method-top">
                      <div className="drapza-method-left">
                        <div className="drapza-method-radio">
                          {previewSelectedMode === "COD" && <div className="drapza-method-radio-dot" />}
                        </div>

                        <div className="drapza-method-icon">
                          <svg
                            width="24"
                            height="16"
                            viewBox="0 0 24 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: "24px", height: "16px", minWidth: "24px", maxWidth: "24px", flexShrink: 0 }}
                          >
                            <rect x="1.5" y="1.5" width="21" height="13" rx="2" />
                            <circle cx="12" cy="8" r="3" />
                            <path d="M4.5 4.5h.01M19.5 11.5h.01" />
                          </svg>
                        </div>

                        <div className="drapza-method-details">
                          <div className="drapza-method-name">
                            {config.cod.title || "Cash on Delivery"}
                          </div>
                          <div className="drapza-method-sub">
                            {config.cod.subtitle || "Pay when your order arrives."}
                          </div>
                        </div>
                      </div>

                      <div className="drapza-available-badge">AVAILABLE</div>
                    </div>

                    <div
                      className="drapza-method-notice"
                      style={{
                        color: previewSelectedMode === "COD" ? "#e4e4e7" : "#7d807a",
                        borderTopColor: previewSelectedMode === "COD" ? "rgba(255, 255, 255, 0.25)" : "var(--base-200, #d7dbd2)"
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          width: "13px",
                          height: "13px",
                          minWidth: "13px",
                          minHeight: "13px",
                          maxWidth: "13px",
                          maxHeight: "13px",
                          flexShrink: 0,
                          display: "inline-block",
                          color: previewSelectedMode === "COD" ? "#e4e4e7" : "#7d807a",
                          stroke: previewSelectedMode === "COD" ? "#e4e4e7" : "#7d807a"
                        }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span style={{ color: previewSelectedMode === "COD" ? "#e4e4e7" : "#7d807a" }}>
                        {Number(config.cod.extraFee || 0) > 0
                          ? `COD handling fee applies (₹${Number(config.cod.extraFee).toFixed(2)})`
                          : (config.cod.note || "Zero convenience fee upon delivery")}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Razorpay Gateway */}
                {config.razorpay.isEnabled && (
                  <div
                    className={`drapza-method-card ${previewSelectedMode === "RAZORPAY" ? "selected" : ""}`}
                    onClick={() => {
                      audioSystem.playClick(600);
                      setPreviewSelectedMode("RAZORPAY");
                    }}
                  >
                    <div className="drapza-method-top">
                      <div className="drapza-method-left">
                        <div className="drapza-method-radio">
                          {previewSelectedMode === "RAZORPAY" && <div className="drapza-method-radio-dot" />}
                        </div>

                        <div className="drapza-method-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ width: "22px", height: "22px", minWidth: "22px", maxWidth: "22px", flexShrink: 0 }}>
                            <path d="M4.5 21L12.5 3H17.5L9.5 21H4.5Z" />
                            <path d="M12 21L17.5 8.5H22.5L17 21H12Z" opacity="0.85" />
                          </svg>
                        </div>

                        <div className="drapza-method-details">
                          <div className="drapza-method-name">
                            {config.razorpay.title || "Pay Online with Razorpay"}
                            {config.razorpay.showBadge && config.razorpay.badgeText && (
                              <span style={{ marginLeft: "8px", fontSize: "0.62rem", background: "#0f0f0f", color: "#edf1e8", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {config.razorpay.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="drapza-method-sub">
                            {config.razorpay.subtitle || "Secure online payment using UPI, cards, and net banking."}
                          </div>
                        </div>
                      </div>

                      <div className="drapza-brand-right">
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ width: "15px", height: "15px", flexShrink: 0 }}>
                            <path d="M4.5 21L12.5 3H17.5L9.5 21H4.5Z" />
                            <path d="M12 21L17.5 8.5H22.5L17 21H12Z" opacity="0.85" />
                          </svg>
                          <span className="drapza-brand-title" style={{ fontWeight: 700, fontStyle: "italic", fontSize: "0.96rem", letterSpacing: "-0.02em" }}>
                            Razorpay
                          </span>
                        </div>

                        <div className="drapza-brand-badges">
                          <span className="drapza-badge-text" style={{ fontWeight: 700, fontSize: "0.72rem", fontStyle: "italic" }}>UPI</span>
                          <span className="drapza-badge-text" style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.04em" }}>VISA</span>
                          <svg width="18" height="12" viewBox="0 0 24 15" fill="none" style={{ width: "18px", height: "12px", flexShrink: 0 }}>
                            <circle cx="8" cy="7.5" r="6" fill="#eb001b" />
                            <circle cx="16" cy="7.5" r="6" fill="#f79e1b" fillOpacity="0.85" />
                          </svg>
                          <span className="drapza-badge-more" style={{ fontSize: "0.65rem" }}>+ more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Cashfree Gateway */}
                {(config.cashfree?.isEnabled ?? true) && (
                  <div
                    className={`drapza-method-card ${previewSelectedMode === "CASHFREE" ? "selected" : ""}`}
                    onClick={() => {
                      audioSystem.playClick(600);
                      setPreviewSelectedMode("CASHFREE");
                    }}
                  >
                    <div className="drapza-method-top">
                      <div className="drapza-method-left">
                        <div className="drapza-method-radio">
                          {previewSelectedMode === "CASHFREE" && <div className="drapza-method-radio-dot" />}
                        </div>

                        <div className="drapza-method-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ width: "22px", height: "22px", minWidth: "22px", maxWidth: "22px", flexShrink: 0 }}>
                            <path d="M4 4H10V8.5H6.5V11H9.5V14H6.5V20H4V4Z" />
                            <path d="M12 4H19.5V7H14.5V11H18.5V14H14.5V20H12V4Z" />
                          </svg>
                        </div>

                        <div className="drapza-method-details">
                          <div className="drapza-method-name">
                            {config.cashfree?.title || "Pay Online with Cashfree"}
                            {config.cashfree?.showBadge && config.cashfree?.badgeText && (
                              <span style={{ marginLeft: "8px", fontSize: "0.62rem", background: "#0f0f0f", color: "#edf1e8", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {config.cashfree.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="drapza-method-sub">
                            {config.cashfree?.subtitle || "Fast and secure online payment."}
                          </div>
                        </div>
                      </div>

                      <div className="drapza-brand-right">
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ width: "14px", height: "14px", flexShrink: 0 }}>
                            <path d="M4 4H10V8.5H6.5V11H9.5V14H6.5V20H4V4Z" />
                            <path d="M12 4H19.5V7H14.5V11H18.5V14H14.5V20H12V4Z" />
                          </svg>
                          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, textAlign: "left" }}>
                            <span className="drapza-brand-title" style={{ fontWeight: 700, fontSize: "0.84rem" }}>Cashfree</span>
                            <span className="drapza-brand-sub" style={{ fontSize: "0.60rem", letterSpacing: "0.02em" }}>Payments</span>
                          </div>
                        </div>

                        <div className="drapza-brand-badges">
                          <span className="drapza-badge-text" style={{ fontWeight: 700, fontSize: "0.72rem", fontStyle: "italic" }}>UPI</span>
                          <span className="drapza-badge-text" style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.04em" }}>VISA</span>
                          <svg width="18" height="12" viewBox="0 0 24 15" fill="none" style={{ width: "18px", height: "12px", flexShrink: 0 }}>
                            <circle cx="8" cy="7.5" r="6" fill="#eb001b" />
                            <circle cx="16" cy="7.5" r="6" fill="#f79e1b" fillOpacity="0.85" />
                          </svg>
                          <span className="drapza-badge-more" style={{ fontSize: "0.65rem" }}>+ more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Gateways Disabled Fallback */}
                {!config.cod.isEnabled && !config.razorpay.isEnabled && !config.cashfree?.isEnabled && (
                  <div style={{ padding: "20px", border: "1px dashed #e11d48", borderRadius: "8px", color: "#e11d48", textAlign: "center", background: "#fff1f2" }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "0.82rem" }}>No Payment Gateways Available</div>
                    <div style={{ fontSize: "0.72rem", color: "#4b5563" }}>Payment gateways are currently under maintenance. Please contact support or try again later.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Confirm Modal for Payment Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        variant="reset"
        title="RESTORE PAYMENT GATEWAYS"
        subtitle="[ PAYMENT ARCHITECTURE ]"
        message="Are you sure you want to reset all payment gateway configurations and COD settings back to default parameters?"
        confirmLabel="RESTORE DEFAULTS"
        cancelLabel="CANCEL"
        onConfirm={handleExecuteReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

