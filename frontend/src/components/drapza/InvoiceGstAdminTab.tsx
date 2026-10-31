"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  Percent,
  CheckCircle2,
  RotateCcw,
  Building,
  Hash,
  Calculator,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Layers,
  Truck,
  Type,
  AlignLeft,
  Settings2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import QRCode from "qrcode";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";
import {
  gstConfigApi,
  GstConfigData,
  DEFAULT_GST_CONFIG,
  DEFAULT_INVOICE_SECTIONS,
  InvoiceSectionId,
} from "@/lib/api";
import {
  InvoiceData,
  InvoiceTemplateView,
  downloadInvoicePdf,
} from "@/lib/invoiceDownload";

interface InvoiceGstAdminTabProps {
  gstConfig: GstConfigData;
  setGstConfig: React.Dispatch<React.SetStateAction<GstConfigData>>;
  onSaveSuccess?: () => void;
}

const PRESET_GST_RATES = [
  { rate: 0, label: "0% (Exempt)", desc: "Tax-free basic essentials" },
  { rate: 5, label: "5% (Apparel < ₹1k)", desc: "Economy garments tier" },
  { rate: 12, label: "12% (Standard)", desc: "Ready-made garments > ₹1k" },
  { rate: 18, label: "18% (Luxury / Finished)", desc: "Standard atelier apparel & couture" },
  { rate: 28, label: "28% (High Luxury / Special)", desc: "High cess luxury items" },
];

export const InvoiceGstAdminTab: React.FC<InvoiceGstAdminTabProps> = ({
  gstConfig,
  setGstConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "full-invoice">("split");
  const [activeEditorTab, setActiveEditorTab] = useState<
    "reorder" | "company" | "tax" | "logistics" | "text"
  >("reorder");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sampleQrCodeUrl, setSampleQrCodeUrl] = useState<string>("");

  // Pre-generate sample QR code data URL for preview
  React.useEffect(() => {
    const origin = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://drapza.com";
    const sampleVerifyUrl = `${origin}/track?ref=TRK-DPZ-89A4E2&verified=true`;
    QRCode.toDataURL(sampleVerifyUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setSampleQrCodeUrl)
      .catch((e) => console.error(e));
  }, []);

  const fullInvoiceRef = useRef<HTMLDivElement>(null);

  // Active section sequence and hidden sections
  const activeOrder: InvoiceSectionId[] =
    gstConfig.sectionOrder && gstConfig.sectionOrder.length > 0
      ? (gstConfig.sectionOrder as InvoiceSectionId[])
      : (DEFAULT_GST_CONFIG.sectionOrder as InvoiceSectionId[]);

  const activeHidden: string[] = gstConfig.hiddenSections || [];

  // Reordering helpers
  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    audioSystem.playClick(650);
    const updated = [...activeOrder];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setGstConfig((prev) => ({ ...prev, sectionOrder: updated }));
  };

  const moveSectionDown = (index: number) => {
    if (index >= activeOrder.length - 1) return;
    audioSystem.playClick(650);
    const updated = [...activeOrder];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setGstConfig((prev) => ({ ...prev, sectionOrder: updated }));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    audioSystem.playClick(600);
    setGstConfig((prev) => {
      const currentHidden = prev.hiddenSections || [];
      const isAlreadyHidden = currentHidden.includes(sectionId);
      const newHidden = isAlreadyHidden
        ? currentHidden.filter((id) => id !== sectionId)
        : [...currentHidden, sectionId];
      return { ...prev, hiddenSections: newHidden };
    });
  };

  const resetSectionOrder = () => {
    audioSystem.playClick(500);
    setGstConfig((prev) => ({
      ...prev,
      sectionOrder: [...(DEFAULT_GST_CONFIG.sectionOrder as string[])],
      hiddenSections: [],
    }));
  };

  // Field change helpers
  const handleToggleEnabled = () => {
    audioSystem.playClick(600);
    setGstConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleToggleShowGst = () => {
    audioSystem.playClick(600);
    setGstConfig((prev) => ({ ...prev, showGstNumber: !prev.showGstNumber }));
  };

  const handleSelectRate = (rate: number) => {
    audioSystem.playClick(700);
    setGstConfig((prev) => ({ ...prev, gstPercentage: rate }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormError(null);
    setSaveStatus(null);
    audioSystem.playClick(800);

    // Validate GSTIN if enabled
    if (gstConfig.isEnabled && gstConfig.gstNumber.trim().length < 10) {
      setFormError("Please enter a valid GST Identification Number (GSTIN).");
      setIsSaving(false);
      audioSystem.playClick(300, 0.08);
      return;
    }

    try {
      const res = await gstConfigApi.updateGstConfig(gstConfig);
      if (res.success && res.data) {
        setGstConfig(res.data);
        try {
          localStorage.setItem("drapza_gst_config", JSON.stringify(res.data));
        } catch (e) { }
        setSaveStatus("Invoice & GST configuration updated successfully.");
        audioSystem.playSuccess();
        onSaveSuccess?.();
      } else {
        localStorage.setItem("drapza_gst_config", JSON.stringify(gstConfig));
        setSaveStatus("Invoice configuration saved to local store.");
        audioSystem.playSuccess();
      }
    } catch (err: any) {
      console.warn("Backend update failed, saving locally:", err);
      try {
        localStorage.setItem("drapza_gst_config", JSON.stringify(gstConfig));
        setSaveStatus("Invoice configuration saved to local store.");
        audioSystem.playSuccess();
      } catch (e) {
        setFormError("Failed to persist invoice configuration.");
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleExecuteReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    audioSystem.playClick(500);

    try {
      const res = await gstConfigApi.resetGstConfig();
      if (res.success && res.data) {
        setGstConfig(res.data);
        localStorage.setItem("drapza_gst_config", JSON.stringify(res.data));
        setSaveStatus("Invoice configuration restored to defaults.");
        audioSystem.playSuccess();
      } else {
        setGstConfig(DEFAULT_GST_CONFIG);
        localStorage.setItem("drapza_gst_config", JSON.stringify(DEFAULT_GST_CONFIG));
        setSaveStatus("Invoice configuration restored to defaults.");
        audioSystem.playSuccess();
      }
    } catch (err) {
      setGstConfig(DEFAULT_GST_CONFIG);
      localStorage.setItem("drapza_gst_config", JSON.stringify(DEFAULT_GST_CONFIG));
      setSaveStatus("Invoice configuration restored to local defaults.");
    } finally {
      setIsResetting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Sample items for preview calculation
  const sampleItems = [
    {
      name: "ARCHIVAL NOIR RUNWAY SILK TUNIC",
      size: "SIZE 40 / MEDIUM",
      color: "OBSIDIAN BLACK",
      quantity: 1,
      unitPrice: 8400,
      originalPrice: 10500,
      totalPrice: 8400,
      originalTotalPrice: 10500,
      bogoBadge: "BUY 1 GET 1 PROMO",
    },
    {
      name: "PLEATED ATELIER UTILITY TROUSER",
      size: "SIZE 32 / REGULAR",
      color: "MATTE CHARCOAL",
      quantity: 1,
      unitPrice: 5200,
      originalPrice: 6500,
      totalPrice: 5200,
      originalTotalPrice: 6500,
    },
  ];

  const sampleSubtotal = 13600;
  const sampleDiscount = 600;
  const taxableBase = sampleSubtotal - sampleDiscount;

  const isGstActive = gstConfig.isEnabled;
  const effectiveGstPercent = isGstActive ? gstConfig.gstPercentage : 0;

  let sampleGstAmount = 0;
  let sampleTotal = taxableBase;

  if (isGstActive) {
    if (gstConfig.calculationMode === "inclusive") {
      sampleGstAmount = (taxableBase * effectiveGstPercent) / (100 + effectiveGstPercent);
      sampleTotal = taxableBase;
    } else {
      sampleGstAmount = (taxableBase * effectiveGstPercent) / 100;
      sampleTotal = taxableBase + sampleGstAmount;
    }
  }

  const sampleInvoiceData: InvoiceData = {
    invoiceNumber: "INV-DPZ-9842",
    orderId: "DPZ-9842",
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    clientName: "VIKRAM SINGHANIA",
    clientEmail: "v.singhania@atelier-vault.com",
    clientPhone: "+91 98201 44521",
    billingAddress: {
      street: "Skyline Tower 4B, Golf Course Extension",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
    },
    shippingAddress: {
      name: "VIKRAM SINGHANIA (PRIMARY RESIDENCE)",
      street: "Skyline Tower 4B, Golf Course Extension",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      phone: "+91 98201 44521",
    },
    salesperson: gstConfig.defaultSalesperson || "Drapza Concierge",
    poNumber: "PO-DPZ-9842",
    requisitioner: "V. Singhania",
    shippedVia: gstConfig.defaultShippedVia || "Blue Dart Air",
    fobPoint: gstConfig.defaultFobPoint || "Vault Hub",
    terms: gstConfig.defaultTerms || "Prepaid / Settled",
    items: sampleItems,
    subtotal: sampleSubtotal,
    discount: sampleDiscount,
    tax: sampleGstAmount,
    shippingCost: 0,
    total: sampleTotal,
    paymentMethod: "Encrypted UPI Checkout (Instant)",
    paymentStatus: "PAID IN FULL",
    comments:
      gstConfig.commentsText ||
      "Authentic Drapza Atelier Noir production. High-altitude climate-controlled shipment with anti-static packaging.",
  };

  // Direct High-Resolution PDF Download via universal downloadInvoicePdf
  const handleDownloadSamplePdf = async () => {
    setIsDownloadingPdf(true);
    audioSystem.playClick(800);

    try {
      await downloadInvoicePdf(sampleInvoiceData, gstConfig);
      audioSystem.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Direct PDF generation error:", err);
      audioSystem.playClick(300, 0.08);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-neutral-100 border border-neutral-200 text-xs font-mono uppercase tracking-wider text-black mb-2">
            <FileText className="w-3.5 h-3.5 text-neutral-600" />
            <span>INVOICE STUDIO &amp; LAYOUT CUSTOMIZER</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            INVOICE EDITOR &amp; GST TAX CMS
          </h2>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Reorder sections up/down, toggle visibility, customize company branding &amp; govern GST rates.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-none border border-neutral-200 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setViewMode("split");
              }}
              className={`px-3 py-1.5 rounded-none transition-all cursor-pointer ${viewMode === "split"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              SPLIT VIEW
            </button>
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setViewMode("full-invoice");
              }}
              className={`px-3 py-1.5 rounded-none transition-all cursor-pointer ${viewMode === "full-invoice"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              FULL INVOICE VIEW
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3.5 py-2 rounded-none border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 font-mono text-xs uppercase font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET ALL</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "SAVING..." : "SAVE INVOICE CONFIG"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveStatus && (
        <div className="p-3.5 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-none bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className={`grid grid-cols-1 ${viewMode === "split" ? "xl:grid-cols-12" : ""} gap-6`}>
        {/* ================= LEFT CONTROLS & EDITORS ================= */}
        <div className={`${viewMode === "split" ? "xl:col-span-5" : "w-full"} space-y-5`}>

          {/* Sub-Editor Navigation Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-none bg-neutral-100 border border-neutral-200 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveEditorTab("reorder");
              }}
              className={`flex-1 py-2 px-3 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEditorTab === "reorder"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SECTIONS (UP/DOWN)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveEditorTab("company");
              }}
              className={`py-2 px-3 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEditorTab === "company"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>COMPANY</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveEditorTab("tax");
              }}
              className={`py-2 px-3 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEditorTab === "tax"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>TAX / GST</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveEditorTab("logistics");
              }}
              className={`py-2 px-3 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEditorTab === "logistics"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>LOGISTICS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setActiveEditorTab("text");
              }}
              className={`py-2 px-3 rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeEditorTab === "text"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
                }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>TERMS &amp; NOTES</span>
            </button>
          </div>

          {/* TAB 1: SECTION REORDERING ("UPPER / NEECHE CONTROLL") */}
          {activeEditorTab === "reorder" && (
            <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h4 className="text-sm font-bold font-mono uppercase text-black flex items-center gap-2">
                    <Layers className="w-4 h-4 text-neutral-700" />
                    REORDER INVOICE SECTIONS
                  </h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Move sections Up or Down to customize document flow.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSectionOrder}
                  className="text-[11px] font-mono font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                >
                  Reset Sequence
                </button>
              </div>

              <div className="space-y-2.5">
                {activeOrder.map((secId, idx) => {
                  const meta = DEFAULT_INVOICE_SECTIONS.find((s) => s.id === secId) || {
                    id: secId,
                    label: secId.toUpperCase(),
                    desc: "Custom section",
                  };
                  const isHidden = activeHidden.includes(secId);

                  return (
                    <div
                      key={secId}
                      className={`p-3.5 rounded-none border transition-all flex items-center justify-between gap-3 ${isHidden
                          ? "bg-neutral-50/70 border-neutral-200 opacity-60"
                          : "bg-white border-neutral-300 hover:border-black shadow-xs"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-none bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold uppercase text-black truncate">
                            {meta.label}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-500 truncate">
                            {meta.desc}
                          </p>
                        </div>
                      </div>

                      {/* Controls: Up, Down, Visibility */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(idx)}
                          disabled={idx === 0}
                          title="Move section UP"
                          className="p-1.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white text-neutral-700 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveSectionDown(idx)}
                          disabled={idx === activeOrder.length - 1}
                          title="Move section DOWN"
                          className="p-1.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white text-neutral-700 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(secId)}
                          title={isHidden ? "Show section on invoice" : "Hide section from invoice"}
                          className={`p-1.5 rounded-none border transition-all cursor-pointer ${isHidden
                              ? "bg-neutral-200 border-neutral-300 text-neutral-600"
                              : "bg-black border-black text-white"
                            }`}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY & BRANDING */}
          {activeEditorTab === "company" && (
            <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="pb-3 border-b border-neutral-100">
                <h4 className="text-sm font-bold font-mono uppercase text-black flex items-center gap-2">
                  <Building className="w-4 h-4 text-neutral-700" />
                  COMPANY BRANDING &amp; HEADER
                </h4>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Update corporate identity, address, and contact lines.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Company Registered Name
                  </label>
                  <input
                    type="text"
                    value={gstConfig.legalBusinessName || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, legalBusinessName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={gstConfig.companyTagline || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, companyTagline: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={gstConfig.companyAddressLine1 || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, companyAddressLine1: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Address Line 2 (City / State / PIN)
                    </label>
                    <input
                      type="text"
                      value={gstConfig.companyAddressLine2 || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, companyAddressLine2: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Support Phone Number
                    </label>
                    <input
                      type="text"
                      value={gstConfig.companyPhone || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, companyPhone: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={gstConfig.companyEmail || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, companyEmail: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Invoice Title Wordmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INVOICE or TAX INVOICE"
                    value={gstConfig.invoiceTitle || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, invoiceTitle: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs font-bold uppercase text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAX & GST CONTROLS */}
          {activeEditorTab === "tax" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Master GST Switch */}
              <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-mono uppercase text-black flex items-center gap-2">
                    <Percent className="w-4 h-4 text-neutral-700" />
                    GST TAXATION ENGINE
                  </h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    {gstConfig.isEnabled
                      ? "GST calculations active (Item cut amount & MRP strikethrough enabled)."
                      : "Tax exempt mode (0% GST • Cut amounts hidden)."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleEnabled}
                  className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-all cursor-pointer ${gstConfig.isEnabled
                      ? "bg-black text-white shadow-sm"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                    }`}
                >
                  {gstConfig.isEnabled ? "GST: ENABLED" : "GST: DISABLED"}
                </button>
              </div>

              {/* Rate & Calculation Method */}
              <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase text-black block mb-2">
                    SELECT GST RATE SLAB
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_GST_RATES.map((preset) => {
                      const isSelected = gstConfig.gstPercentage === preset.rate;
                      return (
                        <button
                          key={preset.rate}
                          type="button"
                          onClick={() => handleSelectRate(preset.rate)}
                          className={`p-2.5 rounded-none border text-left cursor-pointer transition-all ${isSelected
                              ? "bg-neutral-900 text-white border-black shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                            }`}
                        >
                          <p className="font-mono text-xs font-bold">{preset.rate}%</p>
                          <p className="font-mono text-[9px] truncate opacity-80">{preset.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom GST % Input */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-black block">
                    CUSTOM GST PERCENTAGE (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={gstConfig.gstPercentage}
                      onChange={(e) =>
                        setGstConfig((prev) => ({
                          ...prev,
                          gstPercentage: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 pr-7 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-sm font-bold text-black focus:outline-none focus:border-black focus:bg-white transition-all text-right"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Calculation Mode */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-black block">
                    TAX CALCULATION METHOD
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setGstConfig((prev) => ({ ...prev, calculationMode: "exclusive" }));
                      }}
                      className={`p-2.5 rounded-none border text-left cursor-pointer transition-all ${gstConfig.calculationMode === "exclusive"
                          ? "bg-neutral-900 text-white border-black shadow-sm"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                    >
                      <p className="font-mono text-xs font-bold uppercase">EXCLUSIVE</p>
                      <p className="font-mono text-[9.5px] opacity-80">Subtotal + GST = Total</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setGstConfig((prev) => ({ ...prev, calculationMode: "inclusive" }));
                      }}
                      className={`p-2.5 rounded-none border text-left cursor-pointer transition-all ${gstConfig.calculationMode === "inclusive"
                          ? "bg-neutral-900 text-white border-black shadow-sm"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                    >
                      <p className="font-mono text-xs font-bold uppercase">INCLUSIVE</p>
                      <p className="font-mono text-[9.5px] opacity-80">Tax included in price</p>
                    </button>
                  </div>
                </div>

                {/* GSTIN & Tax Identifiers */}
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase text-black">
                      GSTIN (15-DIGIT TAX NUMBER)
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleShowGst}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-mono font-bold cursor-pointer ${gstConfig.showGstNumber ? "bg-black text-white" : "bg-neutral-200 text-neutral-700"
                        }`}
                    >
                      {gstConfig.showGstNumber ? "ON INVOICE: YES" : "ON INVOICE: NO"}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 09AAACD1234F1Z5"
                    value={gstConfig.gstNumber}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs uppercase font-bold text-black focus:outline-none focus:border-black focus:bg-white transition-all tracking-wider"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                        APPAREL HSN CODE
                      </label>
                      <input
                        type="text"
                        value={gstConfig.hsnCode || ""}
                        onChange={(e) =>
                          setGstConfig((prev) => ({ ...prev, hsnCode: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                        COMPANY PAN
                      </label>
                      <input
                        type="text"
                        value={gstConfig.panNumber || ""}
                        onChange={(e) =>
                          setGstConfig((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))
                        }
                        className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs uppercase text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOGISTICS BAR DEFAULTS */}
          {activeEditorTab === "logistics" && (
            <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="pb-3 border-b border-neutral-100">
                <h4 className="text-sm font-bold font-mono uppercase text-black flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-700" />
                  LOGISTICS BAR DEFAULTS
                </h4>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Configure default values for the 3-column logistics bar (Salesperson, P.O. Number, Terms).
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Default Salesperson
                    </label>
                    <input
                      type="text"
                      value={gstConfig.defaultSalesperson || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, defaultSalesperson: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      value={gstConfig.defaultTerms || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, defaultTerms: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      Shipped Via (Default Carrier)
                    </label>
                    <input
                      type="text"
                      value={gstConfig.defaultShippedVia || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, defaultShippedVia: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                      F.O.B. Point
                    </label>
                    <input
                      type="text"
                      value={gstConfig.defaultFobPoint || ""}
                      onChange={(e) =>
                        setGstConfig((prev) => ({ ...prev, defaultFobPoint: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TERMS, NOTES & SIGNOFF */}
          {activeEditorTab === "text" && (
            <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="pb-3 border-b border-neutral-100">
                <h4 className="text-sm font-bold font-mono uppercase text-black flex items-center gap-2">
                  <Type className="w-4 h-4 text-neutral-700" />
                  INSTRUCTIONS, REMITTANCE &amp; SIGNOFF
                </h4>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Customize comments, legal policy notes, and footer greetings.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Comments &amp; Special Instructions Text
                  </label>
                  <textarea
                    rows={2}
                    value={gstConfig.commentsText || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, commentsText: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Remittance Questions &amp; Support Notice
                  </label>
                  <textarea
                    rows={2}
                    value={gstConfig.remittanceNotice || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, remittanceNotice: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Bottom Sign-off Greeting
                  </label>
                  <input
                    type="text"
                    value={gstConfig.signoffText || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, signoffText: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-black block mb-1">
                    Bottom Dispatch Seal Subtext
                  </label>
                  <input
                    type="text"
                    value={gstConfig.signoffSubtext || ""}
                    onChange={(e) =>
                      setGstConfig((prev) => ({ ...prev, signoffSubtext: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-none bg-neutral-50 border border-neutral-300 font-mono text-xs uppercase text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT COMPLETE INVOICE PREVIEW CANVAS ================= */}
        <div className={`${viewMode === "split" ? "xl:col-span-7" : "w-full"} space-y-4`}>

          {/* Top Preview Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase text-black">
                OFFICIAL INVOICEBERRY TEMPLATE 1 // DYNAMIC LAYOUT
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSamplePdf}
                disabled={isDownloadingPdf}
                className="px-3.5 py-1.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DOWNLOADED ✓</span>
                  </>
                ) : (
                  <>
                    <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? "animate-bounce" : ""}`} />
                    <span>{isDownloadingPdf ? "GENERATING PDF..." : "DOWNLOAD PDF"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Complete 100% Text Invoice Canvas Container */}
          <div className="overflow-x-auto p-3 sm:p-6 bg-neutral-100/40 flex justify-center">

            <div
              ref={fullInvoiceRef}
              id="admin-full-invoice-canvas"
              className="w-full max-w-[760px] bg-white text-black shadow-xs border border-neutral-200 shrink-0"
            >
              <InvoiceTemplateView
                data={sampleInvoiceData}
                activeGstConfig={gstConfig}
                qrCodeDataUrl={sampleQrCodeUrl}
              />
            </div>

          </div>
        </div>

      </div>

      {/* Luxury Confirm Modal for Invoice Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        variant="reset"
        title="RESTORE INVOICE TEMPLATE"
        subtitle="[ FISCAL ARCHITECTURE ]"
        message="Are you sure you want to reset all Invoice layout, section sequences, typography, and GST fiscal parameters back to factory defaults?"
        confirmLabel="RESTORE DEFAULTS"
        cancelLabel="CANCEL"
        onConfirm={handleExecuteReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
