"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ChevronRight,
  Package,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { returnApi } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";
import { customerReturnSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";

interface CustomerReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: {
    _id?: string;
    orderId?: string;
    trackingRef?: string;
    status?: string;
    customer?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    items?: Array<{
      name?: string;
      selectedSize?: string;
      quantity?: number;
      price?: number;
      image?: string;
    }>;
    total?: number;
  };
}

const EXCHANGE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Bespoke Fit"];

const RETURN_REASONS = [
  "Fitting: Chest or shoulders too tight",
  "Fitting: Waist or torso too loose / oversized",
  "Length: Sleeves or hem too long / short",
  "Fabric: Feel or finish differs from expectation",
  "Craftsmanship: Stitching or finishing defect",
  "Style: Exchanging for a different silhouette",
  "Other / Discretionary return",
];

export function CustomerReturnModal({ isOpen, onClose, order }: CustomerReturnModalProps) {
  useLockBodyScroll(isOpen);

  // Form states
  const [requestType, setRequestType] = useState<"exchange" | "return">("exchange");
  const [orderRef, setOrderRef] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedExchangeSize, setSelectedExchangeSize] = useState("L");
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [customNotes, setCustomNotes] = useState("");

  // Pickup Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Selected Item
  const [itemName, setItemName] = useState("DRAPZA Atelier Garment");
  const [itemSize, setItemSize] = useState("M");
  const [itemPrice, setItemPrice] = useState(6999);
  const [itemQty, setItemQty] = useState(1);

  // Status & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedDossier, setSubmittedDossier] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Lifecycle & Eligibility
  const orderStatus = String((order as any)?.status || "").toUpperCase();
  const isCancelled = orderStatus === "CANCELLED";
  const isInTransit = ["DISPATCHED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(orderStatus);
  const isAtelier = ["PENDING", "CONFIRMED", "PROCESSING", "TAILORING", "QUALITY_CHECK"].includes(orderStatus);
  const isDelivered = orderStatus === "DELIVERED";
  const isBlocked = isCancelled || isAtelier || isInTransit;

  // Auto-populate when order prop is provided
  useEffect(() => {
    if (order) {
      const ref = order.orderId || order.trackingRef || (order._id ? `DPZ-${order._id.slice(-6).toUpperCase()}` : "");
      setOrderRef(ref);

      const custName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ");
      if (custName) setFullName(custName);
      if (order.customer?.email) setEmail(order.customer.email);
      if (order.customer?.phone) setPhone(order.customer.phone);

      if (order.address) {
        if (order.address.line1) setStreet(order.address.line1);
        if (order.address.city) setCity(order.address.city);
        if (order.address.state) setState(order.address.state);
        if (order.address.pincode) setPincode(order.address.pincode);
      }

      if (order.items && order.items.length > 0) {
        const first = order.items[0];
        if (first.name) setItemName(first.name);
        if (first.selectedSize) setItemSize(first.selectedSize);
        if (first.price) setItemPrice(Number(first.price) || 6999);
        if (first.quantity) setItemQty(Number(first.quantity) || 1);
      }
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    const trackingId = submittedDossier?.orderRef || submittedDossier?.returnId;
    if (!trackingId) return;
    navigator.clipboard.writeText(trackingId);
    setCopiedId(true);
    audioSystem.playClick(800);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const validation = customerReturnSchema.safeParse({
      orderRef: orderRef.trim().toUpperCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      requestType,
    });

    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMsg(getZodErrorMessage(validation.error));
      audioSystem.playError();
      return;
    }

    setIsSubmitting(true);
    audioSystem.playClick(600);

    try {
      const res = await returnApi.createReturnRequest({
        orderRef: orderRef.trim().toUpperCase(),
        customerName: fullName.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
        requestType,
        exchangeSize: requestType === "exchange" ? selectedExchangeSize : undefined,
        refundAmount: itemPrice * itemQty,
        pickupAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
        items: [
          {
            name: itemName.trim(),
            size: itemSize,
            qty: itemQty,
            price: itemPrice,
            reason: `${selectedReason}${customNotes ? ` — ${customNotes.trim()}` : ""}`,
            condition: "Verified by client: unworn, tags attached",
          },
        ],
        adminNotes: `Client initiated ${requestType.toUpperCase()} request online.`,
      });

      if (res && (res.success || res.request)) {
        const created = res.request || (res as any).data;
        setSubmittedDossier(created);
        audioSystem.playSuccess();
      } else {
        throw new Error((res as any)?.message || "Failed to submit request.");
      }
    } catch (err: any) {
      console.error("[SUBMIT RETURN ERROR]:", err);
      setErrorMsg(err.message || "Failed to submit return request. Please try again.");
      audioSystem.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedDossier(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      data-lenis-prevent="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 15, 15, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        data-lenis-prevent="true"
        style={{
          backgroundColor: "var(--base-100, #edf1e8)",
          color: "var(--base-700, #0f0f0f)",
          borderRadius: "12px",
          border: "1px solid var(--base-300, #afb3ab)",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
          fontFamily: "var(--font-dm-mono), monospace",
          fontSynthesis: "none",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            backgroundColor: "#0f0f0f",
            color: "#edf1e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #1f1f1f",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <RotateCcw style={{ width: "18px", height: "18px", color: "#edf1e8", flexShrink: 0 }} />
            <div>
              <span
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  display: "block",
                }}
              >
                ATELIER REVERSE CONCIERGE
              </span>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  margin: "0.15rem 0 0 0",
                  color: "#ffffff",
                }}
              >
                RETURN &amp; EXCHANGE PROTOCOL
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Content Body */}
        <div
          data-lenis-prevent="true"
          style={{
            padding: "1.5rem 1.75rem",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.15rem",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {submittedDossier ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div style={{ textAlign: "center", padding: "1rem 0", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  border: "2px solid #0f0f0f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              >
                <Check style={{ width: "26px", height: "26px", color: "#0f0f0f", strokeWidth: 2.5 }} />
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#7d807a", textTransform: "uppercase", fontWeight: 500 }}>
                  PROTOCOL REGISTERED IN REVERSE VAULT
                </span>
                <h4 style={{ fontSize: "1.3rem", fontWeight: 500, color: "#0f0f0f", marginTop: "0.25rem", textTransform: "uppercase" }}>
                  Your {requestType} Request Is Active
                </h4>
                <p style={{ fontSize: "0.8rem", color: "#555852", maxWidth: "420px", margin: "0.4rem auto 0 auto", lineHeight: "1.5", fontFamily: "var(--font-host-grotesk), sans-serif" }}>
                  A confirmation email has been dispatched to <strong>{submittedDossier.customerEmail}</strong>.
                  Our courier will arrange doorstep collection within 24 to 48 hours.
                </p>
              </div>

              {/* Reference Box */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "8px",
                  padding: "1.15rem 1.25rem",
                  maxWidth: "460px",
                  margin: "0 auto",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "#7d807a", fontWeight: 500, letterSpacing: "0.08em" }}>
                    UNIFIED TRACKING ID (ORDER REF)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.68rem",
                      fontWeight: 500,
                      color: "#0f0f0f",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontFamily: "var(--font-dm-mono), monospace",
                    }}
                  >
                    {copiedId ? (
                      <>
                        <Check style={{ width: "12px", height: "12px" }} />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy style={{ width: "12px", height: "12px" }} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: "1.35rem", fontWeight: 500, color: "#0f0f0f", marginTop: "0.35rem", letterSpacing: "0.05em" }}>
                  #{submittedDossier.orderRef || submittedDossier.returnId}
                </div>

                <div style={{ fontSize: "0.74rem", color: "#555852", paddingTop: "0.65rem", marginTop: "0.65rem", borderTop: "1px dashed var(--base-200, #d7dbd2)" }}>
                  Order &amp; Tracking ID: <strong>#{submittedDossier.orderRef || submittedDossier.returnId}</strong> &bull; Protocol:{" "}
                  <strong style={{ textTransform: "uppercase" }}>{submittedDossier.requestType}</strong>
                  {submittedDossier.exchangeSize ? ` (Requested Size: ${submittedDossier.exchangeSize})` : ""}
                  {submittedDossier.returnId && submittedDossier.returnId !== submittedDossier.orderRef && (
                    <span style={{ display: "block", fontSize: "0.68rem", color: "#8a8d86", marginTop: "0.2rem" }}>
                      Registry Ref: {submittedDossier.returnId}
                    </span>
                  )}
                </div>
              </div>

              {/* Pre-pickup guidelines */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px dashed var(--base-300, #afb3ab)",
                  borderRadius: "8px",
                  padding: "0.95rem 1.15rem",
                  maxWidth: "460px",
                  margin: "0 auto",
                  textAlign: "left",
                  fontSize: "0.74rem",
                  color: "#555852",
                  width: "100%",
                }}
              >
                <div style={{ fontWeight: 500, color: "#0f0f0f", textTransform: "uppercase", marginBottom: "0.35rem", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                  DOORSTEP PICKUP CHECKLIST:
                </div>
                <div style={{ lineHeight: "1.5", fontFamily: "var(--font-host-grotesk), sans-serif" }}>
                  &bull; Keep security ribbons and authentic tags attached.<br />
                  &bull; Place garment inside the original modular storage packaging.<br />
                  &bull; Hand package directly to courier when reverse pickup is initiated.
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <a
                  href={`/track?ref=${submittedDossier.orderRef || submittedDossier.returnId}`}
                  style={{
                    backgroundColor: "#0f0f0f",
                    color: "#edf1e8",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.65rem 1.4rem",
                    fontSize: "0.76rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-dm-mono), monospace",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Truck style={{ width: "14px", height: "14px" }} />
                  <span>TRACK REVERSE STATUS</span>
                </a>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#0f0f0f",
                    border: "1px solid #0f0f0f",
                    borderRadius: "6px",
                    padding: "0.65rem 1.4rem",
                    fontSize: "0.76rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  Return to Store
                </button>
                <a
                  href={`https://wa.me/918888333038?text=Hello%20DRAPZA,%20I%20have%20registered%20a%20reverse%20request%20${submittedDossier.orderRef || submittedDossier.returnId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#0f0f0f",
                    border: "1px solid #0f0f0f",
                    borderRadius: "6px",
                    padding: "0.65rem 1.15rem",
                    fontSize: "0.76rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <MessageSquare style={{ width: "14px", height: "14px" }} />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "0.7rem 1rem",
                    borderRadius: "6px",
                    fontSize: "0.76rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Status Lifecycle Notice */}
              {isCancelled && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "0.85rem 1.15rem",
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <AlertCircle style={{ width: "20px", height: "20px", flexShrink: 0, color: "#b91c1c" }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      ORDER REVOKED &amp; CANCELLED
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#b91c1c", marginTop: "0.15rem", fontFamily: "var(--font-host-grotesk), sans-serif", lineHeight: 1.4 }}>
                      This order was cancelled and inventory released. Return and size exchange protocols cannot be registered for voided orders.
                    </div>
                  </div>
                </div>
              )}

              {isAtelier && (
                <div
                  style={{
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    padding: "0.85rem 1.15rem",
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <AlertCircle style={{ width: "20px", height: "20px", flexShrink: 0, color: "#d97706" }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      PRE-DISPATCH ATELIER PHASE ({orderStatus})
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#b45309", marginTop: "0.15rem", fontFamily: "var(--font-host-grotesk), sans-serif", lineHeight: 1.4 }}>
                      This order is still in the atelier and has not been dispatched yet. If you need to change your size or cancel, please use the <strong>Cancel Order</strong> option on your profile before courier handover.
                    </div>
                  </div>
                </div>
              )}

              {isInTransit && (
                <div
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "0.85rem 1.15rem",
                    color: "#1e40af",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <Truck style={{ width: "20px", height: "20px", flexShrink: 0, color: "#2563eb" }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      CONSIGNMENT IN COURIER TRANSIT
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#1d4ed8", marginTop: "0.15rem", fontFamily: "var(--font-host-grotesk), sans-serif", lineHeight: 1.4 }}>
                      Your package is currently en route with our 3PL courier. Complimentary doorstep return &amp; size exchange will unlock immediately once delivery is completed.
                    </div>
                  </div>
                </div>
              )}

              {isDelivered && (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "0.75rem 1.15rem",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                  }}
                >
                  <CheckCircle2 style={{ width: "18px", height: "18px", flexShrink: 0, color: "#16a34a" }} />
                  <div style={{ fontSize: "0.74rem", fontWeight: 500, letterSpacing: "0.02em" }}>
                    DOORSTEP RETURN &amp; EXCHANGE PROTOCOL ACTIVE • 14-DAY WINDOW
                  </div>
                </div>
              )}

              {/* Protocol Type Selection */}
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555852", display: "block", marginBottom: "0.45rem" }}>
                  1. SELECT PROTOCOL TYPE
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {/* Exchange Tile */}
                  <div
                    onClick={() => {
                      setRequestType("exchange");
                      audioSystem.playClick(500);
                    }}
                    style={{
                      padding: "1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: requestType === "exchange" ? "1.5px solid #0f0f0f" : "1px solid var(--base-200, #d7dbd2)",
                      backgroundColor: requestType === "exchange" ? "#0f0f0f" : "#ffffff",
                      color: requestType === "exchange" ? "#edf1e8" : "#0f0f0f",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        SIZE EXCHANGE
                      </span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 500,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor: requestType === "exchange" ? "rgba(255,255,255,0.18)" : "#edf1e8",
                          color: requestType === "exchange" ? "#ffffff" : "#0f0f0f",
                          letterSpacing: "0.04em",
                        }}
                      >
                        FREE PICKUP
                      </span>
                    </div>
                    <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.72rem", opacity: 0.8, lineHeight: "1.4", fontFamily: "var(--font-host-grotesk), sans-serif" }}>
                      Swap sizing or fit seamlessly with zero reverse shipping fee.
                    </p>
                  </div>

                  {/* Return Tile */}
                  <div
                    onClick={() => {
                      setRequestType("return");
                      audioSystem.playClick(500);
                    }}
                    style={{
                      padding: "1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: requestType === "return" ? "1.5px solid #0f0f0f" : "1px solid var(--base-200, #d7dbd2)",
                      backgroundColor: requestType === "return" ? "#0f0f0f" : "#ffffff",
                      color: requestType === "return" ? "#edf1e8" : "#0f0f0f",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        RETURN &amp; REFUND
                      </span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 500,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor: requestType === "return" ? "rgba(255,255,255,0.18)" : "#edf1e8",
                          color: requestType === "return" ? "#ffffff" : "#0f0f0f",
                          letterSpacing: "0.04em",
                        }}
                      >
                        ESCROW
                      </span>
                    </div>
                    <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.72rem", opacity: 0.8, lineHeight: "1.4", fontFamily: "var(--font-host-grotesk), sans-serif" }}>
                      Doorstep pickup and full settlement to original payment source.
                    </p>
                  </div>
                </div>
              </div>

              {/* Order & Client Verification Box */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "8px",
                  padding: "1rem 1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7d807a" }}>
                  2. ORDER &amp; CLIENT VERIFICATION
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 400, textTransform: "uppercase", color: "#404040", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>
                      Order Reference # *
                    </label>
                    <input
                      type="text"
                      value={orderRef}
                      onChange={(e) => {
                        setOrderRef(e.target.value);
                        if (fieldErrors.orderRef) setFieldErrors((prev) => ({ ...prev, orderRef: "" }));
                      }}
                      placeholder="e.g. DRP-98214"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.orderRef ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0f0f0f",
                        fontWeight: 400,
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.orderRef && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.orderRef}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 400, textTransform: "uppercase", color: "#404040", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                      }}
                      placeholder="e.g. Aarav Singhania"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.fullName ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0f0f0f",
                        fontWeight: 400,
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.fullName && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 400, textTransform: "uppercase", color: "#404040", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="client@drapza.com"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.email ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0f0f0f",
                        fontWeight: 400,
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.email && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 400, textTransform: "uppercase", color: "#404040", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>
                      Phone (for Courier Pickup)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="+91 98XXXXXXXX"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.phone ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0f0f0f",
                        fontWeight: 400,
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.phone && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* If Exchange: Target Size */}
              {requestType === "exchange" && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "8px",
                    padding: "1rem 1.15rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7d807a" }}>
                      DESIRED REPLACEMENT SIZING
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "#555852" }}>
                      SELECTED: <span style={{ fontWeight: 500, color: "#0f0f0f" }}>{selectedExchangeSize}</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.25rem" }}>
                    {EXCHANGE_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedExchangeSize(sz);
                          audioSystem.playClick(600);
                        }}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "6px",
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.75rem",
                          fontWeight: selectedExchangeSize === sz ? 500 : 400,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          border: selectedExchangeSize === sz ? "1.5px solid #0f0f0f" : "1px solid var(--base-200, #d7dbd2)",
                          backgroundColor: selectedExchangeSize === sz ? "#0f0f0f" : "#ffffff",
                          color: selectedExchangeSize === sz ? "#ffffff" : "#0f0f0f",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason for Reversal */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "8px",
                  padding: "1rem 1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7d807a" }}>
                  3. REASON FOR RETURN / EXCHANGE
                </span>

                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontWeight: 400,
                    backgroundColor: "#ffffff",
                    color: "#0f0f0f",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r} style={{ backgroundColor: "#ffffff", color: "#0f0f0f" }}>
                      {r}
                    </option>
                  ))}
                </select>

                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Additional notes for our master tailors or logistics team..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontWeight: 400,
                    color: "#0f0f0f",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Doorstep Reverse Pickup Address */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--base-200, #d7dbd2)",
                  borderRadius: "8px",
                  padding: "1rem 1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7d807a" }}>
                  4. DOORSTEP REVERSE PICKUP ADDRESS
                </span>

                <div>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      if (fieldErrors.street) setFieldErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    placeholder="Street / Flat / Building Address"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      border: fieldErrors.street ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontWeight: 400,
                      color: "#0f0f0f",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  />
                  {fieldErrors.street && (
                    <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                      {fieldErrors.street}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.55rem" }}>
                  <div>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                      }}
                      placeholder="City"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.city ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontWeight: 400,
                        color: "#0f0f0f",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.city && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: "" }));
                      }}
                      placeholder="State"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.state ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontWeight: 400,
                        color: "#0f0f0f",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.state && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.state}
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value);
                        if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: "" }));
                      }}
                      placeholder="Pincode *"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        border: fieldErrors.pincode ? "1px solid #ef4444" : "1px solid var(--base-200, #d7dbd2)",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-dm-mono), monospace",
                        color: "#0f0f0f",
                        fontWeight: 400,
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                    {fieldErrors.pincode && (
                      <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                        {fieldErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "6px",
                    padding: "0.65rem 1.25rem",
                    fontSize: "0.76rem",
                    fontWeight: 500,
                    color: "#52525b",
                    fontFamily: "var(--font-dm-mono), monospace",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    fontSynthesis: "none",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isBlocked}
                  style={{
                    backgroundColor: isBlocked ? "#d7dbd2" : "#0f0f0f",
                    color: isBlocked ? "#7d807a" : "#edf1e8",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.65rem 1.5rem",
                    fontSize: "0.76rem",
                    fontWeight: 500,
                    fontFamily: "var(--font-dm-mono), monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    cursor: (isSubmitting || isBlocked) ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: isBlocked ? "none" : "0 4px 14px rgba(15,15,15,0.25)",
                    opacity: isSubmitting ? 0.6 : 1,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => !isSubmitting && !isBlocked && (e.currentTarget.style.backgroundColor = "#262626")}
                  onMouseLeave={(e) => !isSubmitting && !isBlocked && (e.currentTarget.style.backgroundColor = "#0f0f0f")}
                >
                  <Truck style={{ width: "15px", height: "15px", color: isBlocked ? "#7d807a" : "#ffffff", flexShrink: 0 }} />
                  <span
                    style={{
                      color: isBlocked ? "#7d807a" : "#ffffff",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      display: "inline-block",
                    }}
                  >
                    {isSubmitting
                      ? "TRANSMITTING..."
                      : isCancelled
                      ? "ORDER CANCELLED"
                      : isAtelier
                      ? "NOT YET DELIVERED"
                      : isInTransit
                      ? "AWAITING DELIVERY"
                      : `REQUEST DOORSTEP ${requestType.toUpperCase()}`}
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
