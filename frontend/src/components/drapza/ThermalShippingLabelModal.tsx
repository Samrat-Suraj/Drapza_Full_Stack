"use client";

import React, { useState } from "react";
import { Printer, XCircle, Tag, CheckSquare, Layers, FileText } from "lucide-react";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface ThermalShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function ThermalShippingLabelModal({ isOpen, onClose, order }: ThermalShippingLabelModalProps) {
  const [printFormat, setPrintFormat] = useState<"thermal" | "packingSlip">("thermal");

  // Lock background body scroll when print label modal is open
  useLockBodyScroll(isOpen);

  if (!isOpen || !order) return null;

  const addr = order.shippingAddress || {};
  const items = order.orderItems || [];
  const trackingNumber = order.trackingNumber || `AWB-DPZ-${order.orderNumber?.replace(/[^0-9]/g, "") || "9982341"}`;

  const handleTriggerPrint = () => {
    window.print();
  };

  // Generate SVG Code 128 style pseudo barcode bars based on order tracking string
  const renderBarcodeSvg = (codeStr: string) => {
    const bars: boolean[] = [];
    for (let i = 0; i < codeStr.length; i++) {
      const charCode = codeStr.charCodeAt(i);
      bars.push(charCode % 2 === 0);
      bars.push(charCode % 3 === 0);
      bars.push(charCode % 5 !== 0);
      bars.push(true);
      bars.push(false);
    }
    return (
      <svg className="w-full h-12" preserveAspectRatio="none" viewBox={`0 0 ${bars.length} 40`}>
        {bars.map((isDark, idx) =>
          isDark ? <rect key={idx} x={idx} y="0" width="1" height="40" fill="black" /> : null
        )}
      </svg>
    );
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:p-0 print:bg-white print:static"
    >
      <div
        data-lenis-prevent="true"
        className="bg-white rounded-none max-w-2xl w-full max-h-[92vh] border border-neutral-200 shadow-2xl flex flex-col overflow-hidden my-auto print:shadow-none print:border-0 print:rounded-none print:max-w-none print:w-full print:max-h-none print:overflow-visible"
      >
        {/* Modal Controls (Hidden when printing) */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-none shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintFormat("thermal")}
              className={`px-3.5 py-1.5 rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all ${
                printFormat === "thermal"
                  ? "bg-black text-white font-bold"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              4x6 THERMAL STICKER
            </button>
            <button
              onClick={() => setPrintFormat("packingSlip")}
              className={`px-3.5 py-1.5 rounded-none font-mono-technical text-xs uppercase tracking-wider transition-all ${
                printFormat === "packingSlip"
                  ? "bg-black text-white font-bold"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              A4 WAREHOUSE PACKING SLIP
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-none flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT NOW</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-none hover:bg-neutral-200 text-neutral-400 hover:text-black transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SURFACE */}
        <div
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="p-6 sm:p-8 flex items-center justify-center bg-neutral-100 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth print:bg-white print:p-0 print:overflow-visible print:block"
        >
          {printFormat === "thermal" ? (
            /* 4x6 INCH HIGH-CONTRAST THERMAL LABEL */
            <div className="w-[380px] bg-white border-2 border-black p-5 text-black font-mono text-xs space-y-3 shadow-md print:shadow-none print:border-2 print:border-black print:w-full print:max-w-[4in]">
              {/* Top Header */}
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base tracking-widest uppercase">DRAPZA ATELIER</h2>
                  <span className="text-[9px] text-neutral-700 block">NEW DELHI HUB • EXPRESS DISPATCH</span>
                </div>
                <div className="border-2 border-black px-2 py-0.5 font-bold text-[10px] uppercase">
                  {order.paymentMethod === "COD" ? "C.O.D. CASH" : "PREPAID"}
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="text-center py-1 border-b-2 border-black">
                {renderBarcodeSvg(trackingNumber)}
                <span className="font-bold text-[11px] tracking-widest mt-1 block">
                  {trackingNumber}
                </span>
              </div>

              {/* Routing & Order Meta */}
              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2 text-[10px]">
                <div>
                  <span className="text-neutral-500 uppercase block text-[8px]">ORDER REFERENCE</span>
                  <span className="font-bold text-[11px]">{order.orderNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 uppercase block text-[8px]">ROUTING PINCODE</span>
                  <span className="font-bold text-sm">{addr.postalCode || "110001"}</span>
                </div>
              </div>

              {/* Deliver To (Consignee) */}
              <div className="border-b-2 border-black pb-2">
                <span className="text-neutral-500 uppercase text-[9px] font-bold block mb-1">
                  SHIP TO (CONSIGNEE):
                </span>
                <div className="font-bold text-sm uppercase">{addr.fullName || order.customerName || "CLIENT"}</div>
                <div className="text-[11px] leading-tight mt-0.5">
                  {addr.street || addr.addressLine1}
                  {addr.landmark && <span>, Near {addr.landmark}</span>}
                </div>
                <div className="font-bold text-[11px] mt-0.5">
                  {addr.city}, {addr.state} — {addr.postalCode}
                </div>
                <div className="text-[11px] font-bold mt-1">TEL: {addr.phone || order.customerPhone || "N/A"}</div>
              </div>

              {/* Items Manifest */}
              <div className="border-b-2 border-black pb-2 text-[10px]">
                <span className="text-neutral-500 uppercase text-[9px] font-bold block mb-1">
                  PACKAGE CONTENTS ({items.length} ITEMS):
                </span>
                <div className="space-y-1">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="truncate max-w-[220px]">
                        {it.name} ({it.size || "M"})
                      </span>
                      <span className="font-bold">x{it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer / Return Address */}
              <div className="text-[8px] text-neutral-600 leading-tight pt-1">
                <strong>RETURN IF UNDELIVERED TO:</strong> Drapza Logistics Atelier, Plot 14, Okhla Industrial Area Phase III, New Delhi, 110020.
              </div>
            </div>
          ) : (
            /* A4 WAREHOUSE PACKING SLIP */
            <div className="w-full max-w-xl bg-white border border-neutral-300 p-8 text-neutral-900 font-sans text-xs space-y-6 shadow-md print:shadow-none print:border-0 print:p-0">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h1 className="font-mono-technical font-bold text-2xl uppercase tracking-wider">DRAPZA ATELIER</h1>
                  <p className="text-neutral-500 font-mono text-[11px]">DISPATCH PICKLIST & PACKING MANIFEST</p>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm">ORDER #{order.orderNumber}</div>
                  <div className="text-neutral-500 text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-3 bg-neutral-50 border rounded-none">
                  <span className="text-[10px] text-neutral-500 uppercase block font-bold">DISPATCHED TO:</span>
                  <div className="font-bold mt-1">{addr.fullName}</div>
                  <div className="text-neutral-600 text-[11px]">{addr.street}, {addr.city}</div>
                  <div className="text-neutral-600 text-[11px]">{addr.state} - {addr.postalCode}</div>
                  <div className="mt-1">TEL: {addr.phone}</div>
                </div>
                <div className="p-3 bg-neutral-50 border rounded-none">
                  <span className="text-[10px] text-neutral-500 uppercase block font-bold">LOGISTICS DETAILS:</span>
                  <div className="mt-1">Carrier: <strong>Ground Express</strong></div>
                  <div>Tracking: <strong>{trackingNumber}</strong></div>
                  <div>Payment: <strong>{order.paymentMethod} ({order.paymentStatus})</strong></div>
                  <div>Total Value: <strong>₹{order.totalPrice?.toLocaleString("en-IN")}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-neutral-100 border-b">
                      <th className="py-2 px-3">CHECK</th>
                      <th className="py-2 px-3">GARMENT</th>
                      <th className="py-2 px-3">SIZE</th>
                      <th className="py-2 px-3">QTY</th>
                      <th className="py-2 px-3 text-right">UNIT PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <input type="checkbox" className="rounded-none" />
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{it.name}</td>
                        <td className="py-2.5 px-3">{it.size || "M"}</td>
                        <td className="py-2.5 px-3 font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{it.price?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* QA Verification Box */}
              <div className="p-4 border-2 border-dashed border-neutral-300 rounded-none flex items-center justify-between font-mono text-[11px]">
                <div>
                  <span>PACKER SIGNATURE: ____________________</span>
                </div>
                <div>
                  <span>QA SEAL STAMP: [ ATELIER VERIFIED ]</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

