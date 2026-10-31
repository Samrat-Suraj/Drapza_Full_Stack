"use client";

import React from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import QRCode from "qrcode";
import { ShieldCheck } from "lucide-react";
import {
  GstConfigData,
  DEFAULT_GST_CONFIG,
  gstConfigApi,
  InvoiceSectionId,
} from "@/lib/api";
import { audioSystem } from "@/components/drapza/AudioSystem";

export interface InvoiceItem {
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  originalPrice?: number;
  originalTotalPrice?: number;
  bogoBadge?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  date: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  shippingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };
  salesperson?: string;
  poNumber?: string;
  requisitioner?: string;
  shippedVia?: string;
  fobPoint?: string;
  terms?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  comments?: string;
}

export function orderToInvoiceData(
  order: any,
  extraCustomerInfo?: { name?: string; email?: string; phone?: string }
): InvoiceData {
  if (!order) {
    order = {};
  }

  const rawId =
    order.orderNumber ||
    order.orderId ||
    order.trackingRef ||
    (order._id ? String(order._id).slice(-8).toUpperCase() : "DPZ");
  const cleanId = String(rawId).replace(/^#+/, "");
  const invoiceNumber = cleanId.toUpperCase().startsWith("INV-")
    ? cleanId.toUpperCase()
    : `INV-${cleanId.toUpperCase()}`;

  const orderId =
    order.orderId ||
    order.orderNumber ||
    order.trackingRef ||
    (order._id ? String(order._id) : "DPZ-ORD");

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  const customerFullName = order.customer
    ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() ||
      order.customer.name
    : null;

  const clientName =
    order.shippingAddress?.fullName ||
    order.shippingAddress?.name ||
    customerFullName ||
    order.user?.name ||
    extraCustomerInfo?.name ||
    "Valued Client";

  const clientEmail =
    order.customer?.email ||
    order.user?.email ||
    extraCustomerInfo?.email ||
    "client@drapza.com";

  const clientPhone =
    order.shippingAddress?.phone ||
    order.customer?.phone ||
    order.user?.phone ||
    extraCustomerInfo?.phone ||
    "+91 9794603102";

  const addr = order.shippingAddress || order.address || {};
  const addrLine1 =
    addr.addressLine1 || addr.line1 || addr.street || addr.address || "Drapza Luxury Street";
  const addrLine2 = addr.addressLine2 || addr.line2 || addr.landmark || "";
  const city = addr.city || "New Delhi";
  const state = addr.state || "Delhi";
  const postalCode = addr.postalCode || addr.pincode || addr.zipCode || "110001";

  const billingAddress = {
    street: [addrLine1, addrLine2].filter(Boolean).join(", "),
    city,
    state,
    postalCode,
  };

  const shippingAddress = {
    name: clientName,
    street: [addrLine1, addrLine2].filter(Boolean).join(", ") || "Drapza Atelier Destination",
    city,
    state,
    postalCode,
    phone: clientPhone,
  };

  const rawItems = order.orderItems || order.items || [];
  const items: InvoiceItem[] = Array.isArray(rawItems)
    ? rawItems.map((it: any) => {
        const unitPrice = Number(it.price || it.unitPrice || 0);
        const quantity = Number(it.qty || it.quantity || 1);
        const lineTotal = Number(it.totalPrice || unitPrice * quantity);
        const origPrice = Number(
          it.originalPrice ||
          it.mrp ||
          it.bogoTier?.originalPrice ||
          it.product?.originalPrice ||
          it.product?.mrp ||
          0
        );
        const origTotal = Number(
          it.originalTotalPrice ||
          (it.bogoTier?.originalPrice ? Number(it.bogoTier.originalPrice) * quantity : 0) ||
          (origPrice > unitPrice ? origPrice * quantity : 0)
        );
        const bogoBadge =
          it.bogoTier?.name ||
          it.bundleTag ||
          (it.bundleUnits > 1 ? `BUY 1 GET ${it.bundleUnits - 1} FREE` : undefined);

        return {
          name: it.name || it.title || it.product?.name || "Bespoke Garment",
          size: it.size || it.selectedSize || "M",
          color: it.color || it.selectedColor || "",
          quantity,
          unitPrice,
          totalPrice: lineTotal,
          originalPrice: origPrice > unitPrice ? origPrice : undefined,
          originalTotalPrice: origTotal > lineTotal ? origTotal : undefined,
          bogoBadge: bogoBadge || undefined,
        };
      })
    : [];

  const subtotal = Number(
    order.subtotal ??
      order.itemsPrice ??
      order.totalAmount ??
      order.totalPrice ??
      items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0)
  );
  const discount = Number(
    order.discount || order.discountAmount || order.couponDiscount || 0
  );
  const tax = Number(order.tax || order.taxAmount || 0);
  const shippingCost = Number(
    order.shippingCost || order.shippingPrice || order.shippingFee || order.codFee || 0
  );
  const total = Number(
    order.totalAmount ?? order.totalPrice ?? Math.max(0, subtotal - discount + tax + shippingCost)
  );

  const poNumber =
    order.trackingNumber ||
    order.trackingRef ||
    order.poNumber ||
    (order._id ? String(order._id).slice(-10).toUpperCase() : `PO-${cleanId}`);

  const terms =
    order.paymentMethod === "COD"
      ? "Cash on Delivery (Pending)"
      : "Prepaid / Settled";

  const paymentStatus =
    order.isPaid ||
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "Settled" ||
    order.paymentStatus === "CONFIRMED"
      ? "SETTLED / PAID IN FULL"
      : order.paymentStatus ||
        (order.paymentMethod === "COD" ? "CASH ON DELIVERY (PENDING)" : "AUTHORIZED");

  return {
    invoiceNumber,
    orderId,
    date,
    clientName,
    clientEmail,
    clientPhone,
    billingAddress,
    shippingAddress,
    salesperson: order.salesperson || "Drapza Direct Concierge",
    poNumber,
    requisitioner: clientName,
    shippedVia: order.carrier || order.shippedVia || "Blue Dart Express / Air Freight",
    terms,
    items:
      items.length > 0
        ? items
        : [{ name: "Bespoke Atelier Garment", quantity: 1, unitPrice: total || 1000, totalPrice: total || 1000 }],
    subtotal,
    discount,
    tax,
    shippingCost,
    total,
    paymentMethod:
      order.paymentMethod === "COD"
        ? "Cash on Delivery (COD)"
        : order.paymentMethod || "Online Authorized",
    paymentStatus,
  };
}

// Pure Universal Invoice Layout Component (Shared by Admin Live Preview & PDF Engine)
export const InvoiceTemplateView: React.FC<{
  data: InvoiceData;
  activeGstConfig: GstConfigData;
  qrCodeDataUrl?: string;
}> = ({ data, activeGstConfig, qrCodeDataUrl }) => {
  const isGstActive = activeGstConfig.isEnabled;
  const gstRate = isGstActive ? activeGstConfig.gstPercentage : 0;
  const subtotal = data.subtotal || 0;
  const discount = data.discount || 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const shippingCost = data.shippingCost || 0;

  const calculatedTax = isGstActive
    ? activeGstConfig.calculationMode === "inclusive"
      ? taxableBase - taxableBase / (1 + gstRate / 100)
      : (taxableBase * gstRate) / 100
    : 0;

  const calculatedTotal = isGstActive
    ? activeGstConfig.calculationMode === "inclusive"
      ? taxableBase + shippingCost
      : taxableBase + calculatedTax + shippingCost
    : taxableBase + shippingCost;

  const sectionOrder: InvoiceSectionId[] =
    activeGstConfig.sectionOrder && activeGstConfig.sectionOrder.length > 0
      ? (activeGstConfig.sectionOrder as InvoiceSectionId[])
      : (DEFAULT_GST_CONFIG.sectionOrder as InvoiceSectionId[]);

  const hiddenSections: string[] = activeGstConfig.hiddenSections || [];

  const renderSectionContent = (sectionId: InvoiceSectionId) => {
    switch (sectionId) {
      case "header":
        return (
          <div
            key="sec-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "2px solid #111827",
              gap: "16px",
            }}
          >
            {/* Left: Company Details */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
              <div
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: "22px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "#000000",
                  letterSpacing: "-0.01em",
                  lineHeight: "1.2",
                  marginBottom: "4px",
                }}
              >
                {activeGstConfig.legalBusinessName || "DRAPZA ATELIER NOIR PVT LTD"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#4b5563",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "6px",
                }}
              >
                {activeGstConfig.companyTagline || "Bespoke Modular Silhouettes & Haute Couture"}
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "#4b5563",
                  lineHeight: "1.5",
                }}
              >
                <div>{activeGstConfig.companyAddressLine1 || "Cyber Hub Node A-12, Sector 62"}</div>
                <div>{activeGstConfig.companyAddressLine2 || "Noida, Uttar Pradesh 201309, India"}</div>
                <div>
                  <strong style={{ color: "#111827", fontWeight: 600 }}>Phone:</strong>{" "}
                  {activeGstConfig.companyPhone || "+91 9794603102"} &nbsp;|&nbsp;{" "}
                  <strong style={{ color: "#111827", fontWeight: 600 }}>Email:</strong>{" "}
                  {activeGstConfig.companyEmail || "drapza.cloth@gmail.com"}
                </div>
                {isGstActive && activeGstConfig.showGstNumber && (
                  <div style={{ marginTop: "6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#000000",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                      }}
                    >
                      GSTIN: {activeGstConfig.gstNumber || "09AAACD1234F1Z5"}
                    </span>
                  </div>
                )}
                {!isGstActive && (
                  <div style={{ marginTop: "4px", fontSize: "9.5px", color: "#9ca3af", fontStyle: "italic" }}>
                    [Tax Status: GST Exempt (0%)]
                  </div>
                )}
              </div>
            </div>

            {/* Right: INVOICE Title & Meta */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: "26px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "#000000",
                  letterSpacing: "0.02em",
                  lineHeight: "1",
                  marginBottom: "10px",
                }}
              >
                {activeGstConfig.invoiceTitle || "INVOICE"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  lineHeight: "1.6",
                  color: "#374151",
                }}
              >
                <div>
                  <strong style={{ color: "#000000", fontWeight: 700 }}>Invoice #:</strong>{" "}
                  <span style={{ fontWeight: 600, color: "#111827" }}>{data.invoiceNumber}</span>
                </div>
                <div>
                  <strong style={{ color: "#000000", fontWeight: 700 }}>Date:</strong>{" "}
                  <span>{data.date}</span>
                </div>
                <div>
                  <strong style={{ color: "#000000", fontWeight: 700 }}>Order Ref:</strong>{" "}
                  <span>{data.orderId}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "recipients":
        return (
          <div
            key="sec-recipients"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              paddingTop: "14px",
              paddingBottom: "14px",
              marginBottom: "14px",
              borderTop: "1px solid #d1d5db",
              borderBottom: "1px solid #d1d5db",
              fontSize: "11px",
              lineHeight: "1.45",
            }}
          >
            {/* TO: */}
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#000000",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                TO:
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                {data.clientName}
              </div>
              {data.clientEmail && (
                <div style={{ color: "#4b5563" }}>{data.clientEmail}</div>
              )}
              {data.clientPhone && (
                <div style={{ color: "#4b5563" }}>{data.clientPhone}</div>
              )}
              {data.billingAddress?.street && (
                <div style={{ color: "#4b5563" }}>{data.billingAddress.street}</div>
              )}
              <div style={{ color: "#4b5563" }}>
                {[data.billingAddress?.city, data.billingAddress?.state, data.billingAddress?.postalCode]
                  .filter(Boolean)
                  .join(", ") || "India"}
              </div>
            </div>

            {/* SHIP TO: */}
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#000000",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                SHIP TO:
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                {data.shippingAddress?.name || data.clientName}
              </div>
              {data.shippingAddress?.street && (
                <div style={{ color: "#4b5563" }}>{data.shippingAddress.street}</div>
              )}
              <div style={{ color: "#4b5563" }}>
                {[
                  data.shippingAddress?.city,
                  data.shippingAddress?.state && `${data.shippingAddress.state} - ${data.shippingAddress.postalCode || ""}`,
                  "India",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              <div style={{ color: "#4b5563" }}>
                Phone: {data.shippingAddress?.phone || data.clientPhone || "+91 9794603102"}
              </div>
            </div>
          </div>
        );

      case "logistics":
        return (
          <div
            key="sec-logistics"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textAlign: "center",
                borderBottom: "1px solid #d1d5db",
                padding: "6px 8px",
              }}
            >
              <div style={{ borderRight: "1px solid #d1d5db" }}>SALESPERSON</div>
              <div style={{ borderRight: "1px solid #d1d5db" }}>P.O. NUMBER</div>
              <div>TERMS</div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontSize: "11px",
                textAlign: "center",
                padding: "8px",
                alignItems: "center",
              }}
            >
              <div style={{ borderRight: "1px solid #e5e7eb", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.salesperson || activeGstConfig.defaultSalesperson || "Drapza Concierge"}
              </div>
              <div style={{ borderRight: "1px solid #e5e7eb", padding: "0 4px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.poNumber || data.orderId}
              </div>
              <div style={{ padding: "0 4px", fontWeight: 700, color: "#047857", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.terms || activeGstConfig.defaultTerms || "Prepaid / Settled"}
              </div>
            </div>
          </div>
        );

      case "comments":
        return (
          <div
            key="sec-comments"
            style={{
              marginBottom: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "10px 12px",
              backgroundColor: "#f9fafb",
              fontSize: "11px",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "10px",
                color: "#111827",
                letterSpacing: "0.04em",
                marginBottom: "4px",
              }}
            >
              COMMENTS OR SPECIAL INSTRUCTIONS:
            </div>
            <div
              style={{
                color: "#374151",
                fontSize: "10.5px",
                lineHeight: "1.5",
              }}
            >
              {data.comments ||
                activeGstConfig.commentsText ||
                "Authentic Drapza Atelier Noir production. High-altitude climate-controlled shipment with anti-static packaging."}
            </div>
          </div>
        );

      case "items":
        return (
          <div
            key="sec-items"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#000000", color: "#ffffff" }}>
                  <th
                    style={{
                      width: "80px",
                      padding: "10px 12px",
                      textAlign: "center",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      color: "#ffffff",
                      textTransform: "uppercase",
                    }}
                  >
                    QUANTITY
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      color: "#ffffff",
                      textTransform: "uppercase",
                    }}
                  >
                    DESCRIPTION
                  </th>
                  <th
                    style={{
                      width: "130px",
                      padding: "10px 14px",
                      textAlign: "right",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      color: "#ffffff",
                      textTransform: "uppercase",
                    }}
                  >
                    UNIT PRICE
                  </th>
                  <th
                    style={{
                      width: "130px",
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      color: "#ffffff",
                      textTransform: "uppercase",
                    }}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => {
                  const lineTotal = item.totalPrice ?? item.unitPrice * item.quantity;
                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 1 ? "#f9fafb" : "#ffffff",
                        borderTop: idx > 0 ? "1px solid #e5e7eb" : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "13px 12px",
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#000000",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td style={{ padding: "13px 14px", textAlign: "left" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "12.5px",
                            textTransform: "uppercase",
                            color: "#000000",
                            lineHeight: "1.3",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#6b7280", marginTop: "3px" }}>
                          {[
                            item.size && (item.size.startsWith("SIZE") ? item.size : `SIZE: ${item.size}`),
                            item.color,
                            `HSN: ${activeGstConfig.hsnCode || "6204"}`,
                          ]
                            .filter(Boolean)
                            .join("  •  ")}
                        </div>
                        {item.bogoBadge && (
                          <div style={{ marginTop: "4px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#000000",
                                color: "#ffffff",
                                fontSize: "8.5px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}
                            >
                              {item.bogoBadge}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "13px 14px",
                          textAlign: "right",
                          fontSize: "12px",
                          color: "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {isGstActive && item.originalPrice && item.originalPrice > item.unitPrice && (
                          <div
                            style={{
                              fontSize: "10.5px",
                              textDecoration: "line-through",
                              color: "#9ca3af",
                              marginTop: "2px",
                              fontWeight: 500,
                            }}
                          >
                            ₹{item.originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "right",
                          fontWeight: 800,
                          fontSize: "12.5px",
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {isGstActive &&
                          (item.originalTotalPrice || (item.originalPrice && item.originalPrice > item.unitPrice)) && (
                            <div
                              style={{
                                fontSize: "10.5px",
                                textDecoration: "line-through",
                                color: "#9ca3af",
                                fontWeight: 500,
                                marginTop: "2px",
                              }}
                            >
                              ₹{(
                                item.originalTotalPrice ??
                                item.originalPrice! * item.quantity
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case "totals":
        return (
          <div
            key="sec-totals"
            style={{
              display: "grid",
              gridTemplateColumns: "1.08fr 340px",
              gap: "20px",
              alignItems: "stretch",
              marginBottom: "20px",
            }}
          >
            {/* Atelier Verified Order QR Seal */}
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "14px",
                backgroundColor: "#f9fafb",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "86px",
                  height: "86px",
                  backgroundColor: "#ffffff",
                  padding: "4px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Authenticity Verification QR"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ fontSize: "8px", color: "#9ca3af", textAlign: "center", fontWeight: 700 }}>
                    [ OFFICIAL QR SEAL ]
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#000000", marginBottom: "4px" }}>
                  <ShieldCheck style={{ width: "16px", height: "16px", color: "#059669", flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#000000" }}>
                    ATELIER VERIFIED ORDER
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827", textTransform: "uppercase", marginBottom: "4px" }}>
                  SCAN TO VERIFY ACQUISITION
                </div>
                <div style={{ fontSize: "9px", color: "#4b5563", lineHeight: "1.4", marginBottom: "8px" }}>
                  Verifies real-time authenticity, item names, quantities &amp; live airway dispatch telemetry on official Drapza vault.
                </div>
                <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#000000" }}>
                    ITEMS: {data.items.reduce((s, i) => s + i.quantity, 0)} PCS
                  </span>
                  <span style={{ color: "#9ca3af" }}>•</span>
                  <span style={{ color: "#374151" }}>{data.clientName}</span>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Totals Box */}
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                overflow: "hidden",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
              }}
            >
              <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", flex: 1 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "5px 0",
                          fontSize: "11px",
                          color: "#4b5563",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        SUBTOTAL
                      </td>
                      <td
                        style={{
                          padding: "5px 0",
                          textAlign: "right",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {discount > 0 && (
                      <tr>
                        <td
                          style={{
                            padding: "5px 0",
                            fontSize: "11px",
                            color: "#047857",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          DISCOUNT APPLIED
                        </td>
                        <td
                          style={{
                            padding: "5px 0",
                            textAlign: "right",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#047857",
                            whiteSpace: "nowrap",
                          }}
                        >
                          -₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td
                        style={{
                          padding: "5px 0",
                          fontSize: "11px",
                          color: "#4b5563",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {isGstActive ? `SALES TAX / GST (${gstRate}%)` : "SALES TAX / GST (0% EXEMPT)"}
                      </td>
                      <td
                        style={{
                          padding: "5px 0",
                          textAlign: "right",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹{calculatedTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {isGstActive && gstRate > 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          style={{
                            padding: "0 0 6px 0",
                            textAlign: "right",
                            fontSize: "9px",
                            color: "#6b7280",
                            lineHeight: "1.2",
                          }}
                        >
                          (CGST {(gstRate / 2).toFixed(1)}%: ₹{(calculatedTax / 2).toFixed(2)} + SGST{" "}
                          {(gstRate / 2).toFixed(1)}%: ₹{(calculatedTax / 2).toFixed(2)})
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td
                        style={{
                          padding: "5px 0",
                          fontSize: "11px",
                          color: "#4b5563",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        SHIPPING &amp; HANDLING
                      </td>
                      <td
                        style={{
                          padding: "5px 0",
                          textAlign: "right",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {shippingCost > 0
                          ? `₹${shippingCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "FREE AIRWAY"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TOTAL DUE: Explicit white text on black background */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 16px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "11.5px",
                    color: "#ffffff",
                  }}
                >
                  TOTAL DUE
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    letterSpacing: "-0.01em",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                >
                  ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );

      case "remittance":
        return (
          <div
            key="sec-remittance"
            style={{
              borderTop: "1px solid #d1d5db",
              paddingTop: "14px",
              marginBottom: "14px",
              fontSize: "10.5px",
              color: "#4b5563",
              lineHeight: "1.6",
            }}
          >
            <div>
              Make all remittances payable to{" "}
              <strong style={{ color: "#000000", fontWeight: 700 }}>
                {activeGstConfig.legalBusinessName || "DRAPZA ATELIER NOIR PVT LTD"}
              </strong>
              .
            </div>
            <div>
              HSN/SAC Code:{" "}
              <strong style={{ color: "#000000", fontWeight: 700 }}>{activeGstConfig.hsnCode || "6204"}</strong>
              {isGstActive && activeGstConfig.showGstNumber && (
                <>
                  {" "}
                  &nbsp;•&nbsp; Registered GSTIN:{" "}
                  <strong style={{ color: "#000000", fontWeight: 700 }}>
                    {activeGstConfig.gstNumber || "09AAACD1234F1Z5"}
                  </strong>
                </>
              )}
              &nbsp;•&nbsp; Status:{" "}
              <strong style={{ color: "#047857", fontWeight: 700, textTransform: "uppercase" }}>
                {data.paymentStatus || "SETTLED / PAID IN FULL"}
              </strong>
            </div>
            <div style={{ color: "#6b7280", marginTop: "2px" }}>
              Questions concerning this invoice? Contact Atelier Concierge Desk: {activeGstConfig.companyEmail || "drapza.cloth@gmail.com"} | {activeGstConfig.companyPhone || "+91 9794603102"}
            </div>
          </div>
        );

      case "footer":
        return (
          <div
            key="sec-footer"
            style={{
              paddingTop: "14px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: "italic",
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                marginBottom: "4px",
              }}
            >
              {activeGstConfig.signoffText || "Thank you for your business!"}
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              {activeGstConfig.signoffSubtext ||
                "DRAPZA ATELIER NOIR • OFFICIAL ELECTRONIC INVOICE • AUTHENTICATED DISPATCH"}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: "760px",
        minHeight: "1020px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: "36px 38px",
        boxSizing: "border-box",
        lineHeight: "1.4",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {sectionOrder.map((sectionId) => {
          if (hiddenSections.includes(sectionId)) return null;
          if (sectionId === "remittance" || sectionId === "footer") return null;
          return renderSectionContent(sectionId);
        })}
      </div>
      <div>
        {sectionOrder.map((sectionId) => {
          if (hiddenSections.includes(sectionId)) return null;
          if (sectionId !== "remittance" && sectionId !== "footer") return null;
          return renderSectionContent(sectionId);
        })}
      </div>
    </div>
  );
};

// Fetch or resolve GST config
async function resolveGstConfig(customGstConfig?: GstConfigData): Promise<GstConfigData> {
  if (customGstConfig) return customGstConfig;

  try {
    const res = await gstConfigApi.getGstConfig();
    if (res.success && res.data) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("drapza_gst_config", JSON.stringify(res.data));
        } catch (e) {}
      }
      return res.data;
    }
  } catch (e) {}

  try {
    const cached = typeof window !== "undefined" ? localStorage.getItem("drapza_gst_config") : null;
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return DEFAULT_GST_CONFIG;
}

/**
 * Universal Direct Invoice PDF Downloader
 * 1-Click direct generation and download without opening any preview modal.
 */
export async function downloadInvoicePdf(
  data: InvoiceData,
  customGstConfig?: GstConfigData
): Promise<void> {
  if (typeof window === "undefined" || !data) return;

  try {
    audioSystem.playClick(800);
  } catch (e) {}

  const activeGstConfig = await resolveGstConfig(customGstConfig);

  // Generate dynamic QR Code Data URL for live verification
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://drapza.com";
  const verifyRef = data.poNumber || data.orderId || data.invoiceNumber || "DPZ-ORD";
  const verifyUrl = `${origin}/track?ref=${encodeURIComponent(verifyRef)}&verified=true`;
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (err) {
    console.error("QR DataURL generation error:", err);
  }

  // Create offscreen container with complete font, color, and CSS inheritance isolation
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "760px";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.letterSpacing = "normal";
  container.style.textTransform = "none";
  container.style.lineHeight = "1.4";
  container.style.zIndex = "-99999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <InvoiceTemplateView
          data={data}
          activeGstConfig={activeGstConfig}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
      // Allow DOM paint & layout computation
      setTimeout(() => {
        if (typeof document !== "undefined" && (document as any).fonts?.ready) {
          (document as any).fonts.ready.then(resolve).catch(resolve);
        } else {
          resolve();
        }
      }, 120);
    });

    const targetElem = container.firstElementChild as HTMLElement || container;

    const canvas = await html2canvas(targetElem, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Mathematically scale to guarantee 100% fit inside exactly 1 single A4 page with crisp framing
    const maxPrintableWidth = 194; // 8mm left/right margins
    const maxPrintableHeight = 281; // 8mm top/bottom margins
    const scale = Math.min(maxPrintableWidth / canvasWidth, maxPrintableHeight / canvasHeight);

    const renderWidth = canvasWidth * scale;
    const renderHeight = canvasHeight * scale;

    const xOffset = (pageWidth - renderWidth) / 2;
    const yOffset = Math.max(8, (pageHeight - renderHeight) / 2); // Balanced vertical margins

    pdf.addImage(imgData, "JPEG", xOffset, yOffset, renderWidth, renderHeight, undefined, "FAST");

    const fileName = `DRAPZA-INVOICE-${data.invoiceNumber || data.orderId || "ORDER"}.pdf`;
    pdf.save(fileName);

    try {
      audioSystem.playSuccess();
    } catch (e) {}
  } catch (err) {
    console.error("Direct PDF generation error:", err);
    throw err;
  } finally {
    // Cleanup DOM
    try {
      root.unmount();
    } catch (e) {}
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Direct Order to Invoice PDF Downloader
 */
export async function downloadOrderInvoice(
  order: any,
  customGstConfig?: GstConfigData,
  extraCustomerInfo?: { name?: string; email?: string; phone?: string }
): Promise<void> {
  const invoiceData = orderToInvoiceData(order, extraCustomerInfo);
  await downloadInvoicePdf(invoiceData, customGstConfig);
}
