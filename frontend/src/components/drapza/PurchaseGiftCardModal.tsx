"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Gift,
  X,
  CreditCard,
  Copy,
  Check,
  Share2,
  Heart,
  Send,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Phone,
  Tag,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
  Palette,
  User,
  Mail,
  MessageSquare,
} from "lucide-react";
import { walletApi } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { purchaseGiftCardSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";

interface PurchaseGiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
  defaultPhone?: string;
  initialOrderId?: string;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export const THEME_OPTIONS = [
  {
    id: "noir",
    name: "Archival Noir",
    tagline: "Matte Obsidian & Stark White",
    bgClass: "bg-neutral-950 text-white border-neutral-800",
    accentColor: "text-white",
    badgeClass: "bg-white/10 text-white border-white/20",
    previewGradient: "from-neutral-950 via-neutral-900 to-neutral-950",
    codeColor: "text-white",
  },
  {
    id: "brutalist",
    name: "Brutalist Monochrome",
    tagline: "Stark White Canvas & Ink Black Frame",
    bgClass: "bg-white text-neutral-950 border-neutral-300",
    accentColor: "text-neutral-950",
    badgeClass: "bg-neutral-100 text-neutral-900 border-neutral-300",
    previewGradient: "from-white via-neutral-50 to-neutral-100",
    codeColor: "text-neutral-950",
  },
  {
    id: "platinum",
    name: "Liquid Platinum",
    tagline: "Gunmetal Titanium Gradient",
    bgClass: "bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-white border-neutral-600",
    accentColor: "text-slate-100",
    badgeClass: "bg-white/10 text-slate-100 border-white/20",
    previewGradient: "from-neutral-800 via-neutral-700 to-neutral-900",
    codeColor: "text-white",
  },
  {
    id: "gold",
    name: "Obsidian Carbon",
    tagline: "Deep Carbon Weave & Bone White",
    bgClass: "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white border-neutral-700",
    accentColor: "text-white",
    badgeClass: "bg-white/10 text-white border-white/20",
    previewGradient: "from-neutral-950 via-neutral-900 to-neutral-950",
    codeColor: "text-white",
  },
  {
    id: "emerald",
    name: "Silver Alloy",
    tagline: "Precision Laser Monochromatic Metal",
    bgClass: "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white border-neutral-500",
    accentColor: "text-white",
    badgeClass: "bg-white/10 text-white border-white/20",
    previewGradient: "from-neutral-900 via-neutral-800 to-neutral-900",
    codeColor: "text-white",
  },
];

// Dynamic Cashfree JS SDK v3 Loader
const loadCashfreeSdk = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve(null);
    if ((window as any).Cashfree) {
      return resolve((window as any).Cashfree);
    }
    const existing = document.getElementById("cashfree-js-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Cashfree));
      return;
    }
    const script = document.createElement("script");
    script.id = "cashfree-js-sdk";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      resolve((window as any).Cashfree);
    };
    script.onerror = () => {
      reject(new Error("Failed to load Cashfree checkout SDK."));
    };
    document.body.appendChild(script);
  });
};

export function PurchaseGiftCardModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = "",
  defaultPhone = "",
  initialOrderId = "",
}: PurchaseGiftCardModalProps) {
  // Completely stop background scrolling (including Lenis and touch) when open
  useLockBodyScroll(isOpen);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Buttery-smooth mouse wheel & trackpad scroll physics
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isOpen) return;

    let targetScroll = el.scrollTop;
    let currentScroll = el.scrollTop;
    let isRunning = false;
    let animId: number | null = null;

    const smoothScrollLoop = () => {
      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) > 0.5) {
        currentScroll += diff * 0.16;
        el.scrollTop = currentScroll;
        animId = requestAnimationFrame(smoothScrollLoop);
      } else {
        currentScroll = targetScroll;
        el.scrollTop = targetScroll;
        isRunning = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const maxScroll = el.scrollHeight - el.clientHeight;
      if (!isRunning) {
        targetScroll = el.scrollTop;
        currentScroll = el.scrollTop;
        isRunning = true;
        animId = requestAnimationFrame(smoothScrollLoop);
      }
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY * 0.85));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  // Wizard state: 1: Amount & Theme, 2: Personalization & Delivery, 3: Success
  const [step, setStep] = useState<1 | 2>(1);

  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("noir");

  const [deliveryType, setDeliveryType] = useState<"gift" | "self">("gift");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState(defaultEmail || "");
  const [customerPhone, setCustomerPhone] = useState(defaultPhone || "");
  const [message, setMessage] = useState("Thought you would appreciate Drapza's architectural silhouettes.");

  // Delivery options: 'now' vs 'scheduled'
  const [deliveryOption, setDeliveryOption] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(initialOrderId || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [purchasedCard, setPurchasedCard] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // If passed initialOrderId, automatically verify
  useEffect(() => {
    if (isOpen && initialOrderId && !purchasedCard) {
      handleVerifyOrder(initialOrderId);
    }
  }, [isOpen, initialOrderId]);

  // Set default scheduled date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  if (!isOpen) return null;

  const currentEffectiveAmount = customAmount ? Number(customAmount) : amount;
  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === selectedTheme) || THEME_OPTIONS[0];

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val && !isNaN(Number(val))) {
      setAmount(Number(val));
    }
  };

  // Verify payment with Cashfree backend
  const handleVerifyOrder = async (orderId: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const verifyRes = await walletApi.verifyCashfreeOrder({ orderId });
      if (verifyRes.success && verifyRes.couponCode) {
        setPurchasedCard({
          code: verifyRes.couponCode,
          amount: verifyRes.amount || currentEffectiveAmount,
          recipientEmail: verifyRes.recipientEmail,
          recipientName: verifyRes.recipientName,
          senderName: verifyRes.senderName,
          theme: verifyRes.theme || selectedTheme,
          deliveryOption: verifyRes.deliveryOption || deliveryOption,
          scheduledDeliveryDate: verifyRes.scheduledDeliveryDate,
          expiryDate: verifyRes.expiryDate,
          isAutoCredited: verifyRes.isAutoCredited,
        });
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(
          verifyRes.message ||
            "Payment verification pending or incomplete. If already paid, please click verify again in a moment."
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while checking Cashfree payment.");
    } finally {
      setIsVerifying(false);
      setIsSubmitting(false);
    }
  };

  // Initiate Cashfree Checkout
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const targetEmail = deliveryType === "self" ? defaultEmail || senderEmail || "client@drapza.com" : recipientEmail;

    const validation = purchaseGiftCardSchema.safeParse({
      amount: currentEffectiveAmount,
      recipientEmail: targetEmail.trim(),
      customerPhone: customerPhone.trim(),
      senderName: senderName.trim() || undefined,
      senderEmail: senderEmail.trim() || undefined,
      deliveryOption,
      scheduledDate: deliveryOption === "scheduled" ? scheduledDate : undefined,
      message: message.trim() || undefined,
    });

    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }

    const cleanPhone = validation.data.customerPhone;

    // Format scheduled delivery date if scheduled
    let scheduledDeliveryDateIso: string | undefined = undefined;
    if (deliveryOption === "scheduled") {
      scheduledDeliveryDateIso = new Date(`${scheduledDate}T${scheduledTime || "12:00"}:00`).toISOString();
    }

    setIsSubmitting(true);
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/gift-cards?order_id={order_id}`
          : undefined;

      const res = await walletApi.createCashfreeOrder({
        amount: currentEffectiveAmount,
        recipientEmail: targetEmail.trim(),
        recipientName: deliveryType === "self" ? "Self" : recipientName.trim() || undefined,
        senderName: deliveryType === "self" ? "Self" : senderName.trim() || undefined,
        senderEmail: senderEmail.trim() || defaultEmail || targetEmail.trim(),
        customerPhone: cleanPhone,
        message: message.trim() || undefined,
        theme: selectedTheme,
        deliveryOption,
        scheduledDeliveryDate: scheduledDeliveryDateIso,
        autoCreditSelf: false, // User requested: NEVER auto-redeem, code must stay active
        returnUrl,
      });

      if (!res.success || !res.paymentSessionId || !res.orderId) {
        setErrorMessage(res.message || "Failed to initialize Cashfree payment gateway.");
        setIsSubmitting(false);
        return;
      }

      setActiveOrderId(res.orderId);

      // Load and trigger Cashfree Modal Checkout
      const CashfreeSDK = await loadCashfreeSdk();
      if (!CashfreeSDK) {
        setErrorMessage("Unable to open Cashfree secure checkout modal. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const cashfree = CashfreeSDK({
        mode: res.mode || "sandbox",
      });

      cashfree
        .checkout({
          paymentSessionId: res.paymentSessionId,
          redirectTarget: "_modal",
        })
        .then(async (result: any) => {
          if (result?.error) {
            console.warn("[CASHFREE CHECKOUT DISMISSED / ERROR]", result.error);
            setErrorMessage(
              result.error.message ||
                "Payment modal closed. Click 'Verify Payment' below if deduction completed."
            );
            setIsSubmitting(false);
            return;
          }
          // After modal closes or payment finishes, trigger immediate verification
          await handleVerifyOrder(res.orderId!);
        })
        .catch((err: any) => {
          console.error("[CASHFREE CHECKOUT EXCEPTION]", err);
          setErrorMessage("Cashfree modal closed. Click 'Verify Payment' below to refresh status.");
          setIsSubmitting(false);
        });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate payment transaction.");
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!purchasedCard?.code) return;
    navigator.clipboard.writeText(purchasedCard.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    if (!purchasedCard?.code) return;
    const text = `Hey ${recipientName || "there"}! I got you a Drapza Luxury Streetwear Gift Card worth ₹${purchasedCard.amount.toLocaleString(
      "en-IN"
    )}.\n\nYour 16-Character Privilege Code: ${purchasedCard.code}\n\n*Note:* This voucher is unredeemed and active for 365 days. You can redeem it whenever you want at checkout on https://www.drapza.com or in your Vault Wallet!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Acquire Digital Gift Card"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        data-lenis-prevent="true"
        className="relative z-10 bg-white rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] sm:max-h-[88vh]"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
                ATELIER TREASURY // CASHFREE PAYMENT GATEWAY
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-neutral-900">
                {purchasedCard ? "GIFT PRIVILEGE CARD ISSUED" : "ACQUIRE DIGITAL GIFT CARD"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with Buttery Smooth Scroll */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 min-h-0 custom-modal-scrollbar overscroll-contain scroll-smooth"
        >
          {purchasedCard ? (
            /* ================= STEP 5 / CONFIRMATION VIEW ================= */
            <div className="space-y-6 animate-scale-in text-center py-2">
              <div className="w-16 h-16 rounded-full bg-black text-white border border-neutral-800 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="font-mono-technical text-xs font-bold uppercase text-neutral-900 block tracking-wider">
                  CASHFREE PAYMENT SETTLED & RECEIVED
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-1">
                  16-CHARACTER PRIVILEGE CODE GENERATED
                </div>
                <p className="font-sans text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Your 16-character voucher is minted and ready. It is{" "}
                  <strong className="text-neutral-900 font-bold underline decoration-neutral-900 decoration-2">
                    ACTIVE & UNREDEEMED
                  </strong>
                  . You can redeem it whenever you want within 365 days!
                </p>
              </div>

              {/* 16-Digit Voucher Code Display Card */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border space-y-4 max-w-lg mx-auto shadow-2xl relative overflow-hidden text-left ${
                  currentThemeObj.id === "brutalist"
                    ? "bg-neutral-950 text-white border-neutral-800"
                    : currentThemeObj.bgClass
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono-technical text-[10px] uppercase tracking-widest opacity-80">
                    DRAPZA PRIVILEGE VOUCHER KEY
                  </span>
                  <span className="font-mono-technical text-[9px] uppercase tracking-wider text-black bg-white px-2.5 py-0.5 rounded border border-neutral-300 font-bold">
                    ACTIVE // UNREDEEMED
                  </span>
                </div>

                <div className="py-2">
                  <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-400 block mb-1">
                    UNIQUE 16-CHARACTER CODE:
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white select-all break-all drop-shadow-sm">
                    {purchasedCard.code}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono border-t border-white/10 pt-3 opacity-90">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">DENOMINATION:</span>
                    <span className="font-bold text-white text-base">
                      ₹{Number(purchasedCard.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block">STATUS:</span>
                    <span className="text-white font-bold">VALID 365 DAYS</span>
                  </div>
                </div>

                {purchasedCard.recipientName && (
                  <div className="border-t border-white/10 pt-2.5 text-[11px] font-sans opacity-80 flex items-center justify-between">
                    <span>
                      For: <strong>{purchasedCard.recipientName}</strong>
                    </span>
                    {purchasedCard.senderName && (
                      <span>
                        From: <strong>{purchasedCard.senderName}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Never auto-redeemed reassurance block */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 max-w-lg mx-auto text-left space-y-2.5">
                <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-700 font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-black" />
                  REDEEM WHENEVER YOU WANT (MANUAL AT WILL):
                </span>
                <ul className="font-sans text-xs text-neutral-600 space-y-2 pl-4 list-disc">
                  <li>
                    <strong>At Checkout:</strong> Enter this 16-character code in the <em>Gift Card / Voucher</em> field on your next order.
                  </li>
                  <li>
                    <strong>Partial Deductions Saved:</strong> If your cart total is less than the card balance, remaining funds stay securely preserved on this code.
                  </li>
                  <li>
                    <strong>In Your Vault Wallet:</strong> Go to Profile &gt; Wallet to credit this balance to your store credit anytime.
                  </li>
                  <li>
                    <strong>Unused & Safe:</strong> This voucher will never expire immediately or auto-consume without your explicit action.
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCopyCode}
                  className="px-5 py-3 rounded-xl border border-neutral-300 hover:border-black font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm bg-white hover:bg-neutral-50"
                >
                  {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                  <span className="font-bold">{copied ? "COPIED TO CLIPBOARD" : "COPY 16-DIGIT CODE"}</span>
                </button>

                <button
                  onClick={shareOnWhatsApp}
                  className="px-5 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-700 font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="font-bold">SHARE ON WHATSAPP</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-5 py-3 rounded-xl border border-neutral-300 hover:border-black font-mono-technical text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm bg-white hover:bg-neutral-50"
                >
                  <Printer className="w-4 h-4" />
                  <span className="font-bold">PRINT VOUCHER</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md font-bold"
                >
                  CLOSE
                </button>
              </div>
            </div>
          ) : (
            /* ================= PURCHASE WIZARD ================= */
            <form onSubmit={handlePurchase} noValidate className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-sans text-xs flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  {activeOrderId && (
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerifyOrder(activeOrderId)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono-technical text-[10px] uppercase flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${isVerifying ? "animate-spin" : ""}`} />
                      <span>{isVerifying ? "CHECKING..." : "VERIFY PAYMENT"}</span>
                    </button>
                  )}
                </div>
              )}

              {/* 1. LIVE CARD PREVIEW (SYNCS WITH SELECTED THEME, AMOUNT, RECIPIENT, MESSAGE) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-700 font-bold">
                    LIVE PRIVILEGE CARD PREVIEW
                  </span>
                  <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-500">
                    THEME: {currentThemeObj.name}
                  </span>
                </div>

                <div
                  className={`relative rounded-3xl p-6 sm:p-7 shadow-xl border transition-all duration-300 overflow-hidden ${currentThemeObj.bgClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono-technical text-[9px] uppercase tracking-widest opacity-75 block">
                        DRAPZA DIGITAL ATELIER
                      </span>
                      <div className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight">
                        LUXURY STREETWEAR PRIVILEGE CARD
                      </div>
                    </div>
                    <span
                      className={`font-mono-technical text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentThemeObj.badgeClass} font-bold`}
                    >
                      {currentThemeObj.name}
                    </span>
                  </div>

                  <div className="my-6">
                    <div className="font-mono text-3xl sm:text-4xl font-black tracking-tight">
                      ₹{currentEffectiveAmount ? currentEffectiveAmount.toLocaleString("en-IN") : "0"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] opacity-75 tracking-wider">
                        {deliveryType === "self"
                          ? "FOR: VALUED CLIENT (SELF)"
                          : `FOR: ${recipientName.trim() || "VALUED RECIPIENT"}`}
                      </span>
                      {senderName.trim() && deliveryType === "gift" && (
                        <span className="font-mono text-[10px] opacity-75">
                          • FROM: {senderName.trim()}
                        </span>
                      )}
                    </div>
                    {message.trim() && deliveryType === "gift" && (
                      <p className="mt-2 text-xs font-sans italic opacity-85 line-clamp-2">
                        “{message.trim()}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-end justify-between border-t border-current/15 pt-3 font-mono text-[10px] opacity-75">
                    <span className="tracking-widest">DPZX-••••-••••-••••</span>
                    <span>VALID 365 DAYS</span>
                  </div>
                </div>
              </div>

              {/* STEP TOGGLE TABS */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={`font-mono-technical text-xs uppercase px-3 py-1.5 rounded-lg font-bold transition-all ${
                      step === 1
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                    }`}
                  >
                    1. AMOUNT & THEME
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className={`font-mono-technical text-xs uppercase px-3 py-1.5 rounded-lg font-bold transition-all ${
                      step === 2
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                    }`}
                  >
                    2. PERSONALIZATION & DELIVERY
                  </button>
                </div>
                <span className="font-mono text-[11px] font-bold text-neutral-900 hidden sm:inline">
                  ₹{currentEffectiveAmount ? currentEffectiveAmount.toLocaleString("en-IN") : "0"}
                </span>
              </div>

              {/* ================= STEP 1: AMOUNT & THEME ================= */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Amount Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold tracking-wider">
                        SELECT PRESET DENOMINATION (₹) *
                      </label>
                      <span className="font-mono text-[10px] text-neutral-400">MIN ₹100 • MAX ₹50,000</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                      {PRESET_AMOUNTS.map((val) => {
                        const isSelected = amount === val && !customAmount;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handlePresetSelect(val)}
                            className={`py-3 px-4 rounded-2xl font-mono text-sm font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-black text-white border-black shadow-md scale-[1.02]"
                                : "border-neutral-200 text-neutral-800 bg-white hover:bg-neutral-50 hover:border-neutral-300"
                            }`}
                          >
                            ₹{val.toLocaleString("en-IN")}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amount Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-mono font-bold text-xs">
                        ₹
                      </div>
                      <input
                        type="number"
                        min={100}
                        max={50000}
                        step={50}
                        value={customAmount}
                        onChange={(e) => {
                          handleCustomAmountChange(e);
                          if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: "" }));
                        }}
                        placeholder="Or enter custom amount between ₹100 and ₹50,000"
                        className={`w-full pl-8 pr-4 py-3 rounded-2xl border text-xs font-mono transition-all focus:outline-none ${
                          fieldErrors.amount
                            ? "border-red-500 ring-1 ring-red-500 bg-red-50/30"
                            : customAmount
                            ? "border-black ring-1 ring-black bg-neutral-50 font-bold"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      />
                      {fieldErrors.amount && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.amount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Theme / Design Selector */}
                  <div>
                    <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold tracking-wider block mb-2">
                      SELECT BESPOKE ATELIER THEME *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {THEME_OPTIONS.map((t) => {
                        const isChosen = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTheme(t.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isChosen
                                ? "border-black ring-2 ring-black bg-neutral-50 shadow-sm"
                                : "border-neutral-200 hover:border-neutral-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono-technical text-[11px] font-bold text-neutral-900 uppercase">
                                {t.name}
                              </span>
                              {isChosen && <Check className="w-3.5 h-3.5 text-black" />}
                            </div>
                            <span className="font-sans text-[10px] text-neutral-500 leading-tight">
                              {t.tagline}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destination Mode: Someone else vs Self */}
                  <div>
                    <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold tracking-wider block mb-2">
                      PURCHASE PURPOSE *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("gift")}
                        className={`p-3.5 rounded-2xl border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryType === "gift"
                            ? "bg-black text-white font-bold shadow-md border-black"
                            : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        <span>GIFT TO SOMEONE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType("self")}
                        className={`p-3.5 rounded-2xl border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryType === "self"
                            ? "bg-black text-white font-bold shadow-md border-black"
                            : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        <span>BUY FOR MYSELF</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-xl font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span>NEXT: PERSONALIZATION & DELIVERY</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: PERSONALIZATION & DELIVERY ================= */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Delivery Schedule Choice: Send Now vs Schedule Delivery */}
                  <div>
                    <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold tracking-wider block mb-2">
                      DELIVERY TIMING *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryOption("now")}
                        className={`p-3.5 rounded-2xl border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryOption === "now"
                            ? "bg-black text-white font-bold shadow-md border-black"
                            : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>SEND NOW (INSTANT)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryOption("scheduled")}
                        className={`p-3.5 rounded-2xl border font-mono-technical text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          deliveryOption === "scheduled"
                            ? "bg-black text-white font-bold shadow-md border-black"
                            : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>SCHEDULE DELIVERY</span>
                      </button>
                    </div>

                    {/* Schedule Date & Time Slot Picker */}
                    {deliveryOption === "scheduled" && (
                      <div className="mt-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                        <div>
                          <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                            DELIVERY DATE *
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={scheduledDate}
                            onChange={(e) => {
                              setScheduledDate(e.target.value);
                              if (fieldErrors.scheduledDate) setFieldErrors((prev) => ({ ...prev, scheduledDate: "" }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl border ${fieldErrors.scheduledDate ? "border-red-500 bg-red-50/30" : "border-neutral-200"} bg-white font-mono text-xs focus:outline-none focus:border-black`}
                          />
                          {fieldErrors.scheduledDate && (
                            <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                              {fieldErrors.scheduledDate}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                            DELIVERY TIME SLOT
                          </label>
                          <select
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-mono text-xs focus:outline-none focus:border-black"
                          >
                            <option value="09:00">09:00 AM (Morning Dispatch)</option>
                            <option value="12:00">12:00 PM (Midday At-Noon)</option>
                            <option value="18:00">06:00 PM (Evening Special)</option>
                            <option value="21:00">09:00 PM (Night Gala)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recipient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                        RECIPIENT EMAIL *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                        <input
                          type="email"
                          value={deliveryType === "self" ? defaultEmail || senderEmail : recipientEmail}
                          onChange={(e) => {
                            setRecipientEmail(e.target.value);
                            if (fieldErrors.recipientEmail) setFieldErrors((prev) => ({ ...prev, recipientEmail: "" }));
                          }}
                          placeholder="recipient@example.com"
                          disabled={deliveryType === "self"}
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${fieldErrors.recipientEmail ? "border-red-500 bg-red-50/30" : "border-neutral-200"} focus:outline-none focus:border-black font-mono text-xs bg-white disabled:bg-neutral-100`}
                        />
                      </div>
                      {fieldErrors.recipientEmail && (
                        <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                          {fieldErrors.recipientEmail}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                        RECIPIENT NAME
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                        <input
                          type="text"
                          value={deliveryType === "self" ? "Self" : recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Alex Mercer"
                          disabled={deliveryType === "self"}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black text-xs bg-white disabled:bg-neutral-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sender Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                        YOUR NAME (SENDER)
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                        YOUR RECEIPT EMAIL
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black font-mono text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Personal Message */}
                  {deliveryType === "gift" && (
                    <div>
                      <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                        PERSONAL GIFT MESSAGE
                      </label>
                      <div className="relative">
                        <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                        <textarea
                          rows={2}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Thought you would appreciate Drapza's architectural silhouettes."
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-black text-xs resize-none bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cashfree Mobile Authentication */}
                  <div>
                    <label className="font-mono-technical text-[10px] uppercase text-neutral-700 font-bold block mb-1">
                      MOBILE NUMBER (REQUIRED BY CASHFREE FOR UPI / OTP AUTH) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Phone className="w-4 h-4" />
                        <span className="ml-1 text-xs font-mono text-neutral-500 font-bold">+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""));
                          if (fieldErrors.customerPhone) setFieldErrors((prev) => ({ ...prev, customerPhone: "" }));
                        }}
                        placeholder="9876543210"
                        className={`w-full pl-16 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.customerPhone ? "border-red-500 bg-red-50/30" : "border-neutral-200"} font-mono text-xs focus:outline-none focus:border-black bg-white`}
                      />
                    </div>
                    {fieldErrors.customerPhone && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.customerPhone}
                      </span>
                    )}
                  </div>

                  {/* Cashfree Badge & Trust Indicator */}
                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 flex items-center justify-between text-neutral-600 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono text-[11px] font-bold">CASHFREE PAYMENT GATEWAY</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                      <span>UPI</span> • <span>CARDS</span> • <span>NETBANKING</span>
                    </div>
                  </div>

                  {/* Submit & Navigation Bar */}
                  <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-black font-mono-technical text-xs uppercase tracking-wider text-neutral-700 hover:text-black transition-all cursor-pointer"
                    >
                      BACK
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="font-mono-technical text-[9px] uppercase text-neutral-400 block">
                          TOTAL TO PAY
                        </span>
                        <span className="font-mono text-lg font-black text-neutral-900">
                          ₹{currentEffectiveAmount ? currentEffectiveAmount.toLocaleString("en-IN") : "0"}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || isVerifying || currentEffectiveAmount < 100}
                        className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2 font-bold"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isSubmitting || isVerifying
                            ? "OPENING CASHFREE..."
                            : `PAY ₹${currentEffectiveAmount.toLocaleString("en-IN")} VIA CASHFREE`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
