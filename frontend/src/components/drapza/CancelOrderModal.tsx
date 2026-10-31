"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Package,
  CreditCard,
  Ban,
  Clock,
  HelpCircle,
} from "lucide-react";
import { orderApi } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";
import { orderCancellationSchema, getZodErrorMessage } from "@/lib/validation";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cancelledOrder: any) => void;
  order?: {
    _id?: string;
    orderId?: string;
    orderNumber?: string;
    trackingRef?: string;
    trackingNumber?: string;
    status?: string;
    orderStatus?: string;
    total?: number;
    totalPrice?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt?: string | Date;
    customer?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };
    customerEmail?: string;
    items?: Array<{
      name?: string;
      selectedSize?: string;
      quantity?: number;
      price?: number;
      image?: string;
    }>;
  } | null;
}

const CANCELLATION_REASONS = [
  {
    id: "mind_change",
    title: "Changed Mind / Ordering Different Silhouette",
    desc: "Decided to select another atelier drop, colorway, or custom garment piece.",
  },
  {
    id: "delivery_time",
    title: "Delivery Timeline Exceeds Requirement",
    desc: "Needed the garment expedited for an imminent event or travel departure.",
  },
  {
    id: "incorrect_size",
    title: "Incorrect Size Or Bespoke Fit Selected",
    desc: "Need to cancel and re-order with accurate bespoke tailored dimensions.",
  },
  {
    id: "address_change",
    title: "Incorrect Delivery Address / Contact Details",
    desc: "Need to update dispatch address destination or phone number on record.",
  },
  {
    id: "accidental_order",
    title: "Accidental Or Duplicate Reservation",
    desc: "Duplicate payment attempt or accidental checkout submission.",
  },
  {
    id: "other",
    title: "Other / Atelier Revocation Request",
    desc: "Provide custom instructions for our atelier dispatch concierge.",
  },
];

export function CancelOrderModal({
  isOpen,
  onClose,
  onSuccess,
  order,
}: CancelOrderModalProps) {
  useLockBodyScroll(isOpen);

  const [selectedReasonId, setSelectedReasonId] = useState(CANCELLATION_REASONS[0].id);
  const [customNotes, setCustomNotes] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Auto-populate guest email if available on order
  useEffect(() => {
    if (order) {
      const email = order.customer?.email || order.customerEmail || "";
      if (email) setGuestEmail(email);
    }
  }, [order, isOpen]);

  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  const orderId =
    order?.orderId ||
    order?.orderNumber ||
    (order?._id ? `DPZ-${order._id.slice(-6).toUpperCase()}` : "DPZ-ATELIER");

  const trackingRef =
    order?.trackingRef || order?.trackingNumber || orderId;

  const orderTotal = Number(order?.total ?? order?.totalPrice ?? 0);
  const paymentMethod = (order?.paymentMethod || "COD").toUpperCase();
  const isPrepaid = paymentMethod !== "COD";

  const handleClose = () => {
    setSuccessReceipt(null);
    setErrorMessage(null);
    setCustomNotes("");
    audioSystem.playClick(600);
    onClose();
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(true);
      audioSystem.playClick(900);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleSubmitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const chosenReasonObj = CANCELLATION_REASONS.find((r) => r.id === selectedReasonId);
    let fullReason = chosenReasonObj ? chosenReasonObj.title : "Cancelled by customer";
    if (customNotes.trim()) {
      fullReason += ` — ${customNotes.trim()}`;
    }

    const validation = orderCancellationSchema.safeParse({
      reason: fullReason,
      customNotes: customNotes.trim() || undefined,
      email: guestEmail.trim() || undefined,
    });

    if (!validation.success) {
      setErrorMessage(getZodErrorMessage(validation.error));
      audioSystem.playError();
      return;
    }

    setIsSubmitting(true);
    audioSystem.playClick(700);

    try {
      const targetId = order?.orderId || order?._id || orderId;
      const res = await orderApi.cancelOrder(targetId, {
        reason: fullReason,
        email: guestEmail.trim() || undefined,
      });

      if (res && res.success) {
        audioSystem.playSuccess();
        setSuccessReceipt(res.order || { orderId, cancellationReason: fullReason });
        if (onSuccess) {
          onSuccess(res.order || { ...order, status: "CANCELLED", orderStatus: "cancelled", cancellationReason: fullReason });
        }
      } else {
        throw new Error(res?.message || "Failed to cancel order. Please contact atelier support.");
      }
    } catch (err: any) {
      console.error("[CANCEL_ORDER_ERROR]:", err);
      audioSystem.playError();
      setErrorMessage(
        err.message || "Failed to cancel order. The shipment may already be dispatched."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      data-lenis-prevent="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(15, 15, 15, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--base-100, #edf1e8)",
          color: "var(--base-700, #0f0f0f)",
          borderRadius: "14px",
          border: "1px solid var(--base-300, #afb3ab)",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.45)",
          position: "relative",
          animation: "drapzaModalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          fontSynthesis: "none",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* 1. Header (Brutalist Dark Atelier Contrast) */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            backgroundColor: "var(--base-700, #0f0f0f)",
            color: "var(--base-100, #edf1e8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--base-600, #1f1f1f)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f87171",
                flexShrink: 0,
              }}
            >
              <Ban style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.18em",
                  color: "var(--base-300, #afb3ab)",
                  textTransform: "uppercase",
                  fontWeight: 400,
                  fontFamily: "var(--font-dm-mono), monospace",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                DRAPZA LOGISTICS // REVOCATION
              </span>
              <h2
                id="cancel-dialog-title"
                style={{
                  margin: "0.15rem 0 0 0",
                  fontFamily: "var(--font-koulen), sans-serif",
                  fontSize: "1.35rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                CANCEL ORDER &amp; REVOKE SHIPMENT
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#edf1e8",
              cursor: "pointer",
              padding: "0.45rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            }}
          >
            <X style={{ width: "17px", height: "17px" }} />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div
          data-lenis-prevent="true"
          style={{
            padding: "1.5rem 1.75rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            backgroundColor: "var(--base-100, #edf1e8)",
          }}
        >
          {/* SUCCESS RECEIPT STATE */}
          {successReceipt ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "2rem 1rem",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  backgroundColor: "#0f0f0f",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #26272e",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                }}
              >
                <CheckCircle2 style={{ width: "36px", height: "36px" }} />
              </div>

              <div>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.70rem",
                    letterSpacing: "0.15em",
                    color: "#15803d",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  REVOCATION PROTOCOL CONFIRMED
                </span>
                <h3
                  style={{
                    margin: "0.35rem 0 0 0",
                    fontFamily: "var(--font-koulen), sans-serif",
                    fontSize: "1.9rem",
                    textTransform: "uppercase",
                    color: "var(--base-700, #0f0f0f)",
                    letterSpacing: "0.03em",
                    lineHeight: 1,
                  }}
                >
                  ORDER SUCCESSFULLY CANCELLED
                </h3>
                <p
                  style={{
                    margin: "0.6rem auto 0 auto",
                    fontSize: "0.82rem",
                    color: "var(--base-500, #7d807a)",
                    maxWidth: "460px",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-host-grotesk), sans-serif",
                  }}
                >
                  Production tickets for order <strong style={{ color: "#0f0f0f", fontWeight: 500 }}>{orderId}</strong> have been halted.
                  {isPrepaid
                    ? " 100% Escrow refund has been initiated to your original payment source and will reflect in 2-4 business days."
                    : " Since this was a Cash on Delivery order, zero charges apply and your allocation is released."}
                </p>
              </div>

              {/* Receipt Code Box */}
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSynthesis: "none",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--base-500, #7d807a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 400,
                    }}
                  >
                    CANCELLATION AUDIT REF
                  </div>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 400,
                      color: "var(--base-700, #0f0f0f)",
                      letterSpacing: "0.03em",
                      marginTop: "0.2rem",
                    }}
                  >
                    CNL-{orderId.replace(/[^a-zA-Z0-9]/g, "")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(`CNL-${orderId.replace(/[^a-zA-Z0-9]/g, "")}`)}
                  style={{
                    backgroundColor: copiedRef ? "#15803d" : "var(--base-700, #0f0f0f)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.74rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedRef ? (
                    <>
                      <Check style={{ width: "12px", height: "12px" }} />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: "12px", height: "12px" }} />
                      <span>COPY REF</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  backgroundColor: "var(--base-700, #0f0f0f)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.85rem 2rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-dm-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  width: "100%",
                  marginTop: "0.5rem",
                  boxShadow: "0 4px 14px rgba(15, 15, 15, 0.2)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--base-700, #0f0f0f)")}
              >
                Close &amp; Return To Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitCancellation} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Order Dossier Summary Pill */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.85rem",
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSynthesis: "none",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 400,
                      color: "var(--base-500, #7d807a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                    }}
                  >
                    ORDER REF
                  </span>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 400,
                      letterSpacing: "0.02em",
                      color: "var(--base-700, #0f0f0f)",
                      marginTop: "0.15rem",
                      display: "block",
                    }}
                  >
                    {orderId}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 400,
                      color: "var(--base-500, #7d807a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                    }}
                  >
                    TOTAL PAYABLE
                  </span>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 400,
                      letterSpacing: "0.02em",
                      color: "var(--base-700, #0f0f0f)",
                      marginTop: "0.15rem",
                      display: "block",
                    }}
                  >
                    {orderTotal > 0 ? `₹${orderTotal.toLocaleString("en-IN")}` : "Calculated"}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 400,
                      color: "var(--base-500, #7d807a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                    }}
                  >
                    PAYMENT CHANNEL
                  </span>
                  <span
                    style={{
                      fontSize: "0.80rem",
                      fontWeight: 400,
                      letterSpacing: "0.02em",
                      color: isPrepaid ? "#15803d" : "var(--base-700, #0f0f0f)",
                      marginTop: "0.15rem",
                      display: "block",
                    }}
                  >
                    {isPrepaid ? "PREPAID (ONLINE)" : "CASH ON DELIVERY"}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 400,
                      color: "var(--base-500, #7d807a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                    }}
                  >
                    STATUS
                  </span>
                  <span
                    style={{
                      fontSize: "0.70rem",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      color: "#b45309",
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "999px",
                      display: "inline-block",
                      marginTop: "0.15rem",
                    }}
                  >
                    ACTIVE • CANCELLABLE
                  </span>
                </div>
              </div>

              {/* Refund Notice Banner */}
              <div
                style={{
                  backgroundColor: isPrepaid ? "#fafbf8" : "#fdfdfc",
                  border: isPrepaid
                    ? "1px solid rgba(22, 101, 52, 0.25)"
                    : "1px dashed var(--base-300, #afb3ab)",
                  borderRadius: "10px",
                  padding: "0.85rem 1.15rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    color: isPrepaid ? "#15803d" : "var(--base-500, #7d807a)",
                    marginTop: "0.1rem",
                    flexShrink: 0,
                  }}
                >
                  {isPrepaid ? (
                    <CreditCard style={{ width: "17px", height: "17px" }} />
                  ) : (
                    <Clock style={{ width: "17px", height: "17px" }} />
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  <div
                    style={{
                      fontWeight: 400,
                      fontSize: "0.76rem",
                      color: isPrepaid ? "#15803d" : "var(--base-700, #0f0f0f)",
                      fontFamily: "var(--font-dm-mono), monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isPrepaid
                      ? "100% ESCROW REFUND GUARANTEED"
                      : "ZERO CANCELLATION PENALTY"}
                  </div>
                  <div
                    style={{
                      color: "var(--base-500, #7d807a)",
                      marginTop: "0.15rem",
                      fontSize: "0.74rem",
                      fontWeight: 400,
                      fontFamily: "var(--font-host-grotesk), sans-serif",
                    }}
                  >
                    {isPrepaid
                      ? `A complete refund of ₹${orderTotal.toLocaleString("en-IN")} will be automatically reversed to your source account within 2-4 business days.`
                      : "As this order has not been dispatched from the atelier yet, cancellation is processed immediately with no fees."}
                  </div>
                </div>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertTriangle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section: Select Reason (Cards Selection Architecture) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-koulen), sans-serif",
                    fontSize: "1.15rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    color: "var(--base-700, #0f0f0f)",
                    marginBottom: "0.6rem",
                  }}
                >
                  SELECT CANCELLATION REASON *
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {CANCELLATION_REASONS.map((item) => {
                    const isSelected = selectedReasonId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedReasonId(item.id);
                          audioSystem.playClick(850);
                        }}
                        style={{
                          backgroundColor: isSelected ? "#121316" : "#ffffff",
                          color: isSelected ? "#ffffff" : "var(--base-700, #0f0f0f)",
                          border: isSelected
                            ? "1px solid #26272e"
                            : "1px solid var(--base-200, #d7dbd2)",
                          boxShadow: isSelected
                            ? "0 4px 14px rgba(0, 0, 0, 0.15)"
                            : "none",
                          borderRadius: "10px",
                          padding: "0.85rem 1.15rem",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.85rem",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "var(--base-400, #969992)";
                            e.currentTarget.style.backgroundColor = "#fafbf9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "var(--base-200, #d7dbd2)";
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          {/* Radio Dot Indicator */}
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: isSelected
                                ? "2px solid #ffffff"
                                : "2px solid var(--base-300, #afb3ab)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: "0.15rem",
                              backgroundColor: "transparent",
                            }}
                          >
                            {isSelected && (
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#ffffff",
                                }}
                              />
                            )}
                          </div>

                          <div>
                            <div
                              style={{
                                fontFamily: "var(--font-dm-mono), monospace",
                                fontSize: "0.78rem",
                                fontWeight: 400,
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                                color: isSelected ? "#ffffff" : "var(--base-700, #0f0f0f)",
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 400,
                                color: isSelected ? "#afb3ab" : "var(--base-500, #7d807a)",
                                marginTop: "0.15rem",
                                lineHeight: 1.35,
                                fontFamily: "var(--font-host-grotesk), sans-serif",
                              }}
                            >
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Atelier Notes */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.72rem",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--base-700, #0f0f0f)",
                    marginBottom: "0.45rem",
                  }}
                >
                  ADDITIONAL COMMENTS OR FEEDBACK (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Share details to help our atelier craftsmen improve future drops..."
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-host-grotesk), sans-serif",
                    color: "var(--base-700, #0f0f0f)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
                    resize: "vertical",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--base-700, #0f0f0f)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--base-200, #d7dbd2)")}
                />
              </div>

              {/* Footer CTA Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.85rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed var(--base-300, #afb3ab)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-300, #afb3ab)",
                    color: "var(--base-700, #0f0f0f)",
                    borderRadius: "8px",
                    padding: "0.7rem 1.25rem",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSynthesis: "none",
                    WebkitFontSmoothing: "antialiased",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "var(--base-200, #d7dbd2)")}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  KEEP ORDER
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#0f0f0f",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.7rem 1.6rem",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSynthesis: "none",
                    WebkitFontSmoothing: "antialiased",
                    cursor: isSubmitting ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    boxShadow: "0 4px 14px rgba(15, 15, 15, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#262626")}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#0f0f0f")}
                >
                  <Ban style={{ width: "14px", height: "14px", color: "#f87171", flexShrink: 0 }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      display: "inline-block",
                    }}
                  >
                    {isSubmitting ? "REVOKING SHIPMENT..." : "CONFIRM CANCELLATION"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
