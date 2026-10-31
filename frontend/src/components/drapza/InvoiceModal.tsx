"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";
import {
  GstConfigData,
  DEFAULT_GST_CONFIG,
  gstConfigApi,
} from "@/lib/api";
import {
  InvoiceData,
  InvoiceItem,
  InvoiceTemplateView,
  downloadInvoicePdf,
} from "@/lib/invoiceDownload";

export type { InvoiceData, InvoiceItem };

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
  gstConfig?: GstConfigData;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  data,
  gstConfig,
}) => {
  useLockBodyScroll(isOpen);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Generate QR Code for Order Verification on mount/data change
  useEffect(() => {
    if (!data) return;
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://drapza.com";
    const verifyRef = data.poNumber || data.orderId || data.invoiceNumber || "DPZ-ORD";
    const verifyUrl = `${origin}/track?ref=${encodeURIComponent(verifyRef)}&verified=true`;

    QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("InvoiceModal QR error:", err));
  }, [data]);

  // Active GST Configuration (passed prop -> cached local storage -> default 18%)
  const [activeGstConfig, setActiveGstConfig] = useState<GstConfigData>(() => {
    if (gstConfig) return gstConfig;
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem("drapza_gst_config") : null;
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_GST_CONFIG;
  });

  // Sync GST Configuration
  useEffect(() => {
    if (gstConfig) {
      setActiveGstConfig(gstConfig);
    } else if (isOpen) {
      gstConfigApi
        .getGstConfig()
        .then((res) => {
          if (res.success && res.data) {
            setActiveGstConfig(res.data);
            try {
              localStorage.setItem("drapza_gst_config", JSON.stringify(res.data));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, [gstConfig, isOpen]);

  const handleDownloadPdf = useCallback(async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    audioSystem.playClick(800);

    try {
      await downloadInvoicePdf(data, activeGstConfig);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [data, activeGstConfig]);

  if (!isOpen || !data) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tax Invoice ${data.invoiceNumber}`}
      data-lenis-prevent="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md print:p-0 print:bg-white print:static animate-in fade-in duration-200"
    >
      <div
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-neutral-200 rounded-none overflow-hidden shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none"
      >
        {/* Modal Top Action Bar */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase text-neutral-700 tracking-wider">
              OFFICIAL TAX INVOICE PREVIEW // {data.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              aria-label="Download invoice as PDF document"
              title={isGeneratingPdf ? "Downloading PDF..." : "Download PDF"}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? "animate-bounce" : ""}`} />
              )}
              <span>{isGeneratingPdf ? "GENERATING PDF..." : "DOWNLOAD INVOICE"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice preview"
              title="Close"
              className="p-1.5 rounded-none bg-neutral-200 hover:bg-neutral-300 text-neutral-700 hover:text-black transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Scrollable Container */}
        <div
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain custom-modal-scrollbar scroll-smooth bg-neutral-100/60 p-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible flex justify-center"
        >
          <div className="bg-white shadow-xs border border-neutral-200">
            <InvoiceTemplateView
              data={data}
              activeGstConfig={activeGstConfig}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
