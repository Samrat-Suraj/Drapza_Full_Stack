"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../styles/membership.css";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Gift,
  Headphones,
  LockKeyhole,
  Percent,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";
import {
  membershipApi,
  UserMembershipData,
} from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank";
      }) => Promise<{
        error?: { message?: string };
        paymentDetails?: unknown;
        redirect?: boolean;
      }>;
    };
  }
}

type MembershipPlan = {
  _id: string;
  name: string;
  slug: string;
  durationMonths: number;
  durationDays?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  badge?: string;
  isPopular?: boolean;
  benefits?: string[];
};

type StoredUser = {
  name?: string;
  email?: string;
  phone?: string;
};

const DEFAULT_CARD_PLANS: MembershipPlan[] = [
  {
    _id: "plan-6m",
    name: "6 Months",
    slug: "6-months",
    durationMonths: 6,
    durationDays: 180,
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    badge: "SILVER",
    benefits: ["Special member pricing", "Exclusive offers", "Priority support"],
  },
  {
    _id: "plan-1y",
    name: "1 Year",
    slug: "1-year",
    durationMonths: 12,
    durationDays: 365,
    price: 1699,
    originalPrice: 2499,
    discountPercent: 32,
    badge: "GOLD",
    isPopular: true,
    benefits: ["Special member pricing", "Exclusive offers", "Priority support"],
  },
  {
    _id: "plan-5y",
    name: "5 Years",
    slug: "5-years",
    durationMonths: 60,
    durationDays: 1825,
    price: 6999,
    originalPrice: 11999,
    discountPercent: 42,
    badge: "PLATINUM",
    benefits: ["Special member pricing", "Exclusive offers", "Priority support"],
  },
];

const BENEFITS = [
  {
    icon: Tag,
    title: "Exclusive member prices",
    description: "Get special pricing on your favorite styles, always.",
  },
  {
    icon: Gift,
    title: "Members-only offers",
    description: "Be the first to know about new drops and exclusive deals.",
  },
  {
    icon: Headphones,
    title: "Priority assistance",
    description: "Enjoy faster support and a premium shopping experience.",
  },
];

const formatPrice = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getDiscount = (plan: MembershipPlan) => {
  const original = Number(plan.originalPrice || 0);
  const price = Number(plan.price || 0);
  if (plan.discountPercent != null) return Number(plan.discountPercent);
  return original > price && original > 0
    ? Math.round(((original - price) / original) * 100)
    : 0;
};

export const MembershipPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeParam = searchParams.get("store") || "";
  const isQrRef = searchParams.get("ref") === "qr" || Boolean(storeParam);
  const cfOrderIdParam = searchParams.get("cf_order_id") || "";
  const planIdParam = searchParams.get("plan_id") || "";

  const [plans, setPlans] = useState<MembershipPlan[]>(DEFAULT_CARD_PLANS);
  const [activeMembership, setActiveMembership] =
    useState<UserMembershipData | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<"RAZORPAY" | "CASHFREE">(
    "RAZORPAY",
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [successCelebration, setSuccessCelebration] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 4500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const plansRes = await membershipApi.getPlans();
      if (plansRes?.success && Array.isArray(plansRes.plans) && plansRes.plans.length) {
        const dynamicPlans: MembershipPlan[] = plansRes.plans.map(
          (plan: MembershipPlan, index: number) => ({
            ...plan,
            originalPrice:
              plan.originalPrice || Math.round(Number(plan.price || 0) * 1.45),
            isPopular:
              Boolean(plan.isPopular) || plan.slug === "1-year" || index === 1,
            benefits:
              plan.benefits?.length
                ? plan.benefits
                : ["Special member pricing", "Exclusive offers", "Priority support"],
          }),
        );
        setPlans(dynamicPlans);
      }

      if (storeParam) {
        void membershipApi.recordQrScan(storeParam).catch(() => undefined);
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("drapza_token");
        const storedUser = localStorage.getItem("drapza_user");

        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser) as StoredUser);
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        if (token) {
          try {
            const membershipRes = await membershipApi.getMyMembership();
            if (membershipRes?.success && membershipRes.hasActiveMembership) {
              setActiveMembership(membershipRes.membership);
            } else {
              setActiveMembership(null);
            }
          } catch {
            setActiveMembership(null);
          }
        } else {
          setActiveMembership(null);
        }
      }
    } catch (error) {
      console.error("Error loading membership page data:", error);
      showToast("Some membership details could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showToast, storeParam]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const loadCashfreeScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Cashfree) return resolve(true);

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]',
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => resolve(Boolean(window.Cashfree));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (!cfOrderIdParam) return;

    let isMounted = true;
    const verifyReturnCashfree = async () => {
      setIsProcessing(true);
      try {
        const verifyRes = await membershipApi.verifyPayment({
          planId: planIdParam,
          gateway: "CASHFREE",
          cf_order_id: cfOrderIdParam,
          storeCode: storeParam || "ONLINE_DIRECT",
          source: isQrRef ? "QR_IN_STORE" : "ONLINE",
        });

        if (verifyRes?.success && isMounted) {
          setSuccessCelebration(true);
          router.replace("/membership");
          await fetchData();
        } else if (isMounted) {
          showToast(verifyRes?.message || "Cashfree payment verification failed.");
        }
      } catch (err) {
        if (isMounted) {
          showToast(err instanceof Error ? err.message : "Error verifying Cashfree payment.");
        }
      } finally {
        if (isMounted) {
          setIsProcessing(false);
        }
      }
    };

    void verifyReturnCashfree();
    return () => {
      isMounted = false;
    };
  }, [cfOrderIdParam, planIdParam, storeParam, isQrRef, router, fetchData, showToast]);

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!currentUser) {
      router.push(`/login?redirect=/membership&plan=${encodeURIComponent(plan.slug)}`);
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const scrollToPlans = () => {
    document.getElementById("membership-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan || !currentUser || isProcessing) return;

    setIsProcessing(true);
    try {
      const orderRes = await membershipApi.createOrder({
        planId: selectedPlan._id,
        gateway: paymentGateway,
        storeCode: storeParam || "ONLINE_DIRECT",
        source: isQrRef ? "QR_IN_STORE" : "ONLINE",
      });

      if (!orderRes?.success) {
        showToast(orderRes?.message || "Unable to start payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (orderRes.gateway === "RAZORPAY" && orderRes.orderId) {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          showToast("Payment gateway failed to load. Please try again.");
          setIsProcessing(false);
          return;
        }

        const razorpay = new window.Razorpay({
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency || "INR",
          name: "DRAPZA MEMBERSHIP",
          description: `${selectedPlan.name} Membership Activation`,
          image: "/images/drapza/logo.jpg",
          order_id: orderRes.orderId,
          prefill: {
            name: currentUser.name || "Customer",
            email: currentUser.email || "",
            contact: currentUser.phone || "",
          },
          theme: { color: "#171717" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await membershipApi.verifyPayment({
                planId: selectedPlan._id,
                gateway: "RAZORPAY",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                storeCode: storeParam || "ONLINE_DIRECT",
                source: isQrRef ? "QR_IN_STORE" : "ONLINE",
              });

              if (verifyRes?.success) {
                setIsPaymentModalOpen(false);
                setSuccessCelebration(true);
                await fetchData();
              } else {
                showToast(verifyRes?.message || "Payment verification failed.");
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Could not verify payment.";
              showToast(message);
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => setIsProcessing(false),
          },
        });

        razorpay.open();
        return;
      }

      if (paymentGateway === "CASHFREE" || orderRes.gateway === "CASHFREE") {
        if (!orderRes.paymentSessionId || !orderRes.orderId) {
          showToast(
            orderRes?.message || "Failed to initialize Cashfree transaction.",
          );
          setIsProcessing(false);
          return;
        }

        const loaded = await loadCashfreeScript();
        if (!loaded || !window.Cashfree) {
          showToast("Cashfree checkout SDK failed to load. Please check your connection.");
          setIsProcessing(false);
          return;
        }

        const isTestEnv = (orderRes.cfEnv || "TEST").toUpperCase() === "TEST";
        const cashfree = window.Cashfree({
          mode: isTestEnv ? "sandbox" : "production",
        });

        try {
          const result = await cashfree.checkout({
            paymentSessionId: orderRes.paymentSessionId,
            redirectTarget: "_modal",
          });

          if (result.error) {
            showToast(result.error?.message || "Cashfree payment was cancelled.");
            setIsProcessing(false);
            return;
          }

          if (result.paymentDetails) {
            const verifyRes = await membershipApi.verifyPayment({
              planId: selectedPlan._id,
              gateway: "CASHFREE",
              cf_order_id: orderRes.orderId,
              storeCode: storeParam || "ONLINE_DIRECT",
              source: isQrRef ? "QR_IN_STORE" : "ONLINE",
            });

            if (verifyRes?.success) {
              setIsPaymentModalOpen(false);
              setSuccessCelebration(true);
              await fetchData();
            } else {
              showToast(verifyRes?.message || "Cashfree payment verification failed.");
            }
          }
        } catch (cfErr) {
          console.error("Cashfree execution error:", cfErr);
          showToast(cfErr instanceof Error ? cfErr.message : "Cashfree checkout error.");
        } finally {
          setIsProcessing(false);
        }

        return;
      }

      if (orderRes.gateway === "SIMULATED") {
        const verifyRes = await membershipApi.verifyPayment({
          planId: selectedPlan._id,
          gateway: "SIMULATED",
          orderId: orderRes.orderId || `ORD_${Date.now()}`,
          storeCode: storeParam || "ONLINE_DIRECT",
          source: isQrRef ? "QR_IN_STORE" : "ONLINE",
        });

        if (verifyRes?.success) {
          setIsPaymentModalOpen(false);
          setSuccessCelebration(true);
          await fetchData();
        } else {
          showToast(verifyRes?.message || "Payment verification failed.");
        }
        return;
      }

      showToast("Unsupported payment response. Please try again or contact support.");
    } catch (error) {
      console.error("Membership payment error:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "An unexpected payment error occurred.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const closePaymentModal = () => {
    if (isProcessing) return;
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <main
      data-membership-root="true"
      id="drapza-membership-root"
      className="min-h-screen bg-[#faf5f0] px-4 pb-24 pt-28 text-[#111111] sm:px-6 md:pt-32"
    >
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-4 right-4 z-[80] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3.5 text-sm text-white shadow-2xl sm:left-auto sm:right-6"
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToastMessage(null)}
            className="rounded-lg p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-[1180px] space-y-12">
        {isQrRef && (
          <section className="flex flex-col gap-4 rounded-2xl bg-neutral-950 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Store className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <p className="membership-tag-uppercase text-[10px] font-semibold text-amber-300">
                  In-store membership
                </p>
                <h2 className="mt-1 text-sm font-semibold sm:text-base">
                  Welcome to the DRAPZA showroom
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Branch: {storeParam || "Flagship showroom"}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Online + in-store access
            </span>
          </section>
        )}

        {activeMembership && (
          <section className="overflow-hidden rounded-3xl bg-neutral-950 p-5 text-white shadow-lg sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <span className="membership-tag-uppercase inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Active membership
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {activeMembership.planName}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Membership reference: {activeMembership.subscriptionId}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                    <Percent className="h-4 w-4 text-amber-300" />
                    <strong>{activeMembership.discountPercent}% member discount</strong>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300">
                    <Clock3 className="h-4 w-4 text-amber-300" />
                    Valid until{" "}
                    <strong className="text-white">
                      {new Date(activeMembership.endDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                    · {activeMembership.daysRemaining} days left
                  </span>
                </div>
              </div>
              <Link
                href="/wardrobe"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                Shop member deals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* HERO BANNER - Exact match to Image 1 Reference */}
        <section className="membership-hero-card relative overflow-hidden rounded-[28px] border border-[#ead9ce] p-6 sm:p-9 lg:p-11">
          <div className="relative grid items-center gap-8 lg:grid-cols-12 lg:gap-6">
            {/* Left text column */}
            <div className="z-10 lg:col-span-5">
              <p className="membership-tag-uppercase text-[11px] font-bold text-[#9c7561] mb-2.5">
                The DRAPZA privilege
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold tracking-[-0.03em] text-[#111111] leading-[1.08] mb-3.5">
                More style.
                <br />
                More savings.
              </h1>
              <p className="text-xs sm:text-[13.5px] leading-relaxed text-[#5e534c] max-w-[390px] mb-7">
                Join the DRAPZA membership and unlock exclusive prices, special offers and a better shopping experience — made for true fashion lovers.
              </p>
              <div className="mb-7">
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-white px-6 py-3.5 text-sm font-semibold shadow-sm transition"
                >
                  Explore membership plans
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3.5 text-xs font-medium text-[#433b35]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#111111]" />
                  Safe &amp; Secure Payments
                </span>
                <span className="text-[#cfb9ad]">|</span>
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#111111]" />
                  Trusted by 50K+ Members
                </span>
              </div>
            </div>

            {/* Center arch & model */}
            <div className="relative flex items-end justify-center self-end lg:col-span-3 -mb-6 sm:-mb-9 lg:-mb-11 min-h-[250px] sm:min-h-[290px] lg:min-h-[330px]">
              <img
                src="/images/membership/membership-model-arch.png"
                alt="DRAPZA membership fashion"
                className="relative z-10 max-h-[290px] sm:max-h-[320px] lg:max-h-[345px] w-auto max-w-full object-contain object-bottom select-none"
              />
            </div>

            {/* Right benefits stacked cards */}
            <div className="z-10 flex flex-col gap-3.5 lg:col-span-4 justify-center">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="membership-benefit-card flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-white/90"
                >
                  <span className="membership-benefit-icon-wrap">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#111111] leading-snug">{title}</h3>
                    <p className="mt-0.5 text-xs text-[#666666] leading-snug">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MEMBERSHIP PLANS SECTION */}
        <section id="membership-plans" className="scroll-mt-28 mt-12 sm:mt-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.025em] text-[#111111]">
              Membership plans
            </h2>
            <p className="mt-2 text-sm text-[#666666]">
              Choose a plan that fits your style. More value, more fashion, longer.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[24px] border border-neutral-200 bg-white p-7"
                >
                  <div className="h-3 w-20 rounded bg-neutral-200" />
                  <div className="mt-5 h-7 w-32 rounded bg-neutral-200" />
                  <div className="mt-4 h-10 w-36 rounded bg-neutral-200" />
                  <div className="mt-7 space-y-3">
                    <div className="h-3 rounded bg-neutral-100" />
                    <div className="h-3 rounded bg-neutral-100" />
                    <div className="h-3 w-3/4 rounded bg-neutral-100" />
                  </div>
                  <div className="mt-8 h-12 rounded-xl bg-neutral-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid items-stretch gap-6 md:grid-cols-3">
              {plans.map((plan, index) => {
                const popular =
                  Boolean(plan.isPopular) || plan.slug === "1-year" || index === 1;
                const discount = getDiscount(plan);
                const originalPrice = Number(plan.originalPrice || 0);
                const benefits = plan.benefits?.length
                  ? plan.benefits
                  : ["Special member pricing", "Exclusive offers", "Priority support"];

                return (
                  <article
                    key={plan._id || plan.slug || index}
                    className={`relative flex flex-col justify-between rounded-[24px] p-6 sm:p-7 ${
                      popular
                        ? "membership-plan-card-popular"
                        : "membership-plan-card-standard"
                    }`}
                  >
                    <div>
                      {/* Top row with badge and optional popular tag */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span
                          className={`membership-tag-uppercase rounded-full px-3.5 py-1 text-[10.5px] font-bold ${
                            popular
                              ? "bg-[#dfb48c] text-[#111111]"
                              : "bg-[#f1eae2] text-[#4d4036]"
                          }`}
                        >
                          {plan.badge || (index === 0 ? "SILVER" : index === 1 ? "GOLD" : "PLATINUM")}
                        </span>
                        {popular && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#dfb48c]">
                            <Star className="h-3 w-3 fill-current text-[#dfb48c]" />
                            Most Popular
                          </span>
                        )}
                      </div>

                      {/* Plan Name */}
                      <h3
                        className={`text-2xl sm:text-[26px] font-bold tracking-tight mb-2.5 ${
                          popular ? "text-white" : "text-[#111111]"
                        }`}
                      >
                        {plan.name.replace(/ Membership/i, "").trim()}
                      </h3>

                      {/* Price row */}
                      <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                        <span
                          className={`text-3xl sm:text-[34px] font-extrabold tracking-tight ${
                            popular ? "text-white" : "text-[#111111]"
                          }`}
                        >
                          {formatPrice(plan.price)}
                        </span>
                        {originalPrice > Number(plan.price) && (
                          <span
                            className={`text-sm line-through ${
                              popular ? "text-[#71717a]" : "text-[#9ca3af]"
                            }`}
                          >
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                        {discount > 0 && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              popular
                                ? "bg-[#eed5bc] text-[#18181b]"
                                : "bg-[#f5e7da] text-[#4a3828]"
                            }`}
                          >
                            Save {discount}%
                          </span>
                        )}
                      </div>

                      <div
                        className={`my-6 border-t ${
                          popular ? "border-white/10" : "border-[#f1ede8]"
                        }`}
                      />

                      {/* Features list */}
                      <ul className="space-y-3.5 mb-8">
                        {benefits.map((benefit) => (
                          <li key={benefit} className="flex items-center gap-3 text-[13.5px]">
                            <span
                              className={
                                popular
                                  ? "membership-check-circle-light"
                                  : "membership-check-circle-dark"
                              }
                            >
                              <Check className="h-3 w-3 stroke-[3.5]" />
                            </span>
                            <span
                              className={
                                popular ? "text-[#e4e4e7]" : "text-[#374151]"
                              }
                            >
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className={
                        popular
                          ? "membership-plan-btn-popular rounded-xl"
                          : "membership-plan-btn-outline rounded-xl"
                      }
                    >
                      Choose this plan
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {/* Secure checkout text under cards */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#6b7280]">
            <LockKeyhole className="h-3.5 w-3.5 text-[#6b7280]" />
            <span>Secure checkout</span>
            <span>•</span>
            <span>Your information is always safe with us.</span>
          </div>
        </section>
      </div>

      {successCelebration && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="membership-success-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-7 text-center shadow-2xl sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4e7d8] text-neutral-950">
              <Crown className="h-8 w-8" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
              Welcome to the club
            </p>
            <h2 id="membership-success-title" className="mt-2 text-2xl font-semibold tracking-tight">
              Membership activated
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Your DRAPZA membership is active. Eligible member pricing will be applied according to your membership benefits.
            </p>
            <div className="mt-6 space-y-3 rounded-2xl bg-neutral-50 p-4 text-left text-sm text-neutral-700">
              {[
                "Special member pricing",
                "Exclusive offers",
                "Online and showroom access",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {benefit}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessCelebration(false);
                router.push("/wardrobe");
              }}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Start shopping <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedPlan && currentUser && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-neutral-950/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePaymentModal();
          }}
        >
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 sm:p-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                  Secure checkout
                </p>
                <h2 id="checkout-title" className="mt-1 text-xl font-semibold tracking-tight">
                  {selectedPlan.name} Membership
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Review your membership before payment.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close checkout"
                disabled={isProcessing}
                onClick={closePaymentModal}
                className="rounded-xl border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-neutral-500">Plan duration</span>
                  <strong>{selectedPlan.durationMonths} months</strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="text-neutral-500">Member discount</span>
                  <strong>{getDiscount(selectedPlan)}% off</strong>
                </div>
                <div className="mt-3 flex items-start justify-between gap-4 text-sm">
                  <span className="text-neutral-500">Account</span>
                  <span className="max-w-[65%] break-all text-right font-medium">
                    {currentUser.email || currentUser.phone || currentUser.name || "Signed-in account"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
                  <span className="text-sm font-semibold">Total payable</span>
                  <strong className="text-2xl font-semibold tracking-tight">
                    {formatPrice(selectedPlan.price)}
                  </strong>
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold">Choose payment method</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    aria-pressed={paymentGateway === "RAZORPAY"}
                    onClick={() => setPaymentGateway("RAZORPAY")}
                    className={`rounded-2xl border p-4 text-left transition ${paymentGateway === "RAZORPAY"
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                      }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      Razorpay
                      {paymentGateway === "RAZORPAY" && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className={`mt-1 block text-xs ${paymentGateway === "RAZORPAY" ? "text-neutral-300" : "text-neutral-500"}`}>
                      UPI, cards and net banking
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    aria-pressed={paymentGateway === "CASHFREE"}
                    onClick={() => setPaymentGateway("CASHFREE")}
                    className={`rounded-2xl border p-4 text-left transition ${paymentGateway === "CASHFREE"
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
                      }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      Cashfree
                      {paymentGateway === "CASHFREE" && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className={`mt-1 block text-xs ${paymentGateway === "CASHFREE" ? "text-neutral-300" : "text-neutral-500"}`}>
                      Secure online payment
                    </span>
                  </button>
                </div>
                {paymentGateway === "CASHFREE" && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs leading-5 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Cashfree sandbox test mode active (instant zero-fee checkout via UPI, Cards, Netbanking)</span>
                  </p>
                )}
              </fieldset>

              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleInitiatePayment()}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing payment…
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Pay {formatPrice(selectedPlan.price)}
                    </>
                  )}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Your payment is handled by the selected payment provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MembershipPage;
