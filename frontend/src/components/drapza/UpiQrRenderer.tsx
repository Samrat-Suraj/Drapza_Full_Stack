"use client";

import React, { useEffect, useState } from "react";
import { generateUpiQrDataUrl, generateUpiUri } from "@/lib/upiQr";
import { Loader2, Download, ExternalLink, QrCode } from "lucide-react";

interface UpiQrRendererProps {
  upiId: string;
  payeeName?: string;
  amount?: number;
  customImageUrl?: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  showPayIntent?: boolean;
  label?: string;
}

export const UpiQrRenderer: React.FC<UpiQrRendererProps> = ({
  upiId,
  payeeName = "DRAPZA ATELIER",
  amount,
  customImageUrl,
  size = 240,
  className = "",
  showDownload = false,
  showPayIntent = false,
  label,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const cleanUpi = (upiId || "").trim();

  useEffect(() => {
    // If custom image provided, use directly
    if (customImageUrl && customImageUrl.trim().length > 0) {
      setQrDataUrl(customImageUrl.trim());
      setIsGenerating(false);
      return;
    }

    // If no UPI ID provided, reset
    if (!cleanUpi) {
      setQrDataUrl("");
      setIsGenerating(false);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    generateUpiQrDataUrl(
      {
        upiId: cleanUpi,
        payeeName: payeeName || "DRAPZA ATELIER",
        amount,
        transactionNote: amount ? `Drapza Order ₹${amount}` : "Drapza Atelier Payment",
      },
      { size: size * 2 } // 2x resolution for crisp high-density screens
    )
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate UPI QR:", err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanUpi, payeeName, amount, customImageUrl, size]);

  const upiIntentUri = generateUpiUri({
    upiId: cleanUpi,
    payeeName,
    amount,
    transactionNote: amount ? `Drapza Order ₹${amount}` : "Drapza Atelier Payment",
  });

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `drapza-upi-qr-${cleanUpi.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="relative bg-white p-2.5 rounded-2xl border border-[#d7dbd2] shadow-sm flex items-center justify-center overflow-hidden"
        style={{ width: size + 20, height: size + 20 }}
      >
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-2 text-neutral-600">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
              Generating QR...
            </span>
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI QR for ${cleanUpi}`}
            width={size}
            height={size}
            className="w-full h-full object-contain rounded-xl select-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-neutral-400">
            <QrCode className="w-8 h-8 mb-1 stroke-1 text-neutral-300" />
            <span className="font-mono text-[9px] uppercase tracking-wider">
              Enter UPI ID to auto-generate QR
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 block mt-1.5 text-center">
          {label}
        </span>
      )}

      {(showDownload || showPayIntent) && qrDataUrl && (
        <div className="flex items-center gap-2 mt-2.5">
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Download QR Code as PNG"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          )}

          {showPayIntent && upiIntentUri && (
            <a
              href={upiIntentUri}
              className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-neutral-200 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors shadow"
              title="Open directly in UPI App on mobile"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Pay Via App</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
