"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  QrCode,
  ExternalLink,
  Send,
} from "lucide-react";
import { ProductDetailData } from "./ProductDetailPage";
import { audioSystem } from "./AudioSystem";
import { useToast } from "./ToastNotification";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetailData | null;
}

export function ShareProductModal({
  isOpen,
  onClose,
  product,
}: ShareProductModalProps) {
  useLockBodyScroll(isOpen);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setShowQr(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://drapza.com";
  const shareSlug = product.slug || product.id;
  const shareUrl = `${origin}/product/${shareSlug}`;

  const rawPrice = product.numericPrice || (typeof product.price === "number" ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 0);
  const finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : rawPrice;
  const formattedPrice = `₹${finalPrice.toLocaleString("en-IN")}`;

  const shareTitle = `${product.name} | DRAPZA ATELIER`;
  const shareText = `Check out this handcrafted atelier piece: "${product.name}" (${formattedPrice}) on DRAPZA.`;

  // Native Web Share Trigger
  const handleNativeShare = async () => {
    audioSystem.playClick(800);
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showToast({
          title: "Product Shared",
          description: "Garment transmission opened successfully.",
          type: "success",
        });
        onClose();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Copy Link with Tactile Feedback
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      audioSystem.playClick(900);
      showToast({
        title: "Link Copied",
        description: "Product link copied to clipboard.",
        type: "success",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // WhatsApp Direct Share
  const handleWhatsAppShare = () => {
    audioSystem.playClick(650);
    const message = `*DRAPZA ATELIER COUTURE*\n\nTake a look at *${product.name}*\nPrice: *${formattedPrice}*\n\nExplore piece & details here:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Twitter / X Share
  const handleTwitterShare = () => {
    audioSystem.playClick(650);
    const text = encodeURIComponent(`Admiration for this silhouette: "${product.name}" by @drapza_atelier\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  // Telegram Share
  const handleTelegramShare = () => {
    audioSystem.playClick(650);
    const text = encodeURIComponent(`DRAPZA ATELIER: ${product.name} (${formattedPrice})`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  };

  // Email Share
  const handleEmailShare = () => {
    audioSystem.playClick(650);
    const subject = encodeURIComponent(`DRAPZA Couture: ${product.name}`);
    const body = encodeURIComponent(`Hi,\n\nI thought you might appreciate this atelier piece from DRAPZA:\n\n${product.name}\nPrice: ${formattedPrice}\n\nView details:\n${shareUrl}\n\nBest,\n`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // QR Code URL (High Res)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=000000&margin=1`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-product-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white text-black border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black font-light">
              <Share2 className="w-4 h-4 text-black stroke-[1.5]" />
            </div>
            <div>
              <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-500 font-normal block">
                [ ATELIER ARCHIVE TRANSMISSION ]
              </span>
              <h3 id="share-product-title" className="font-display text-lg sm:text-xl uppercase text-black font-normal tracking-wide leading-tight">
                SHARE THIS PIECE
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(400);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
            aria-label="Close Share Modal"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto light-scrollbar">
          
          {/* Mini Product Snapshot Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 shadow-xs">
            <div className="relative w-16 h-18 sm:w-20 sm:h-22 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={product.image || (product.images && product.images[0]) || "/images/drapza/products/product_1.png"}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-500 font-normal block truncate">
                {product.category || "ATELIER COLLECTION"}
              </span>
              <h4 className="font-display text-sm sm:text-base uppercase text-black font-normal tracking-wide truncate">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono-technical text-sm font-medium text-black">
                  {formattedPrice}
                </span>
                {product.discountPrice && product.discountPrice < rawPrice && (
                  <span className="font-mono-technical text-xs text-neutral-400 font-light line-through">
                    ₹{rawPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="space-y-1.5">
            <label className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-600 font-normal block">
              SHAREABLE PRODUCT LINK:
            </label>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl p-1.5 focus-within:border-black transition-all">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2.5 py-1 text-xs text-black font-mono-technical font-light focus:outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg font-mono-technical text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Primary Social Channels Grid */}
          <div className="space-y-2 pt-1">
            <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-600 font-normal block">
              INSTANT SHARE DESTINATIONS:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="p-3 rounded-xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <MessageCircle className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  WHATSAPP
                </span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegramShare}
                className="p-3 rounded-xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Send className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  TELEGRAM
                </span>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleTwitterShare}
                className="p-3 rounded-xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <span className="font-mono text-sm font-normal">𝕏</span>
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  X / TWITTER
                </span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleEmailShare}
                className="p-3 rounded-xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Mail className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  EMAIL
                </span>
              </button>

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(600);
                  setShowQr(!showQr);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs ${
                  showQr ? "border-black bg-neutral-100" : "border-neutral-200 hover:border-black bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-neutral-200 text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <QrCode className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  {showQr ? "HIDE QR" : "SHOW QR"}
                </span>
              </button>

              {/* Native System Sheet */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-3 rounded-xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <ExternalLink className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="font-mono-technical text-[10px] uppercase font-normal text-neutral-800">
                  MORE OPTIONS
                </span>
              </button>
            </div>
          </div>

          {/* QR Code Expandable Box */}
          {showQr && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-300 text-center flex flex-col items-center justify-center space-y-2.5 animate-fadeIn">
              <span className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-600 font-bold">
                SCAN TO VIEW ON MOBILE DEVICE
              </span>
              <div className="p-2.5 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${product.name}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
              <p className="font-mono-technical text-[9px] text-neutral-500 uppercase tracking-wider">
                Direct camera scanning opens atelier garment page instantly.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-mono-technical text-neutral-600 shrink-0">
          <span className="flex items-center gap-1">
            DRAPZA ATELIER ENCRYPTED LINK
          </span>
          <button
            type="button"
            onClick={handleNativeShare}
            className="font-bold text-black underline uppercase cursor-pointer hover:text-neutral-700"
          >
            NATIVE SHARE ↗
          </button>
        </div>
      </div>
    </div>
  );
}
