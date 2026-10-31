"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { reviewApi, ReviewData } from "@/lib/api";
import { reviewSubmissionSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  verifiedOrderData?: {
    orderNumber?: string;
    userName?: string;
    userEmail?: string;
    purchasedSize?: string;
    purchasedColor?: string;
  } | null;
  onReviewSubmitted?: (review: ReviewData) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  verifiedOrderData,
  onReviewSubmitted,
}) => {
  useLockBodyScroll(isOpen);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [fit, setFit] = useState<"runs_small" | "true_to_size" | "runs_large">("true_to_size");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState(verifiedOrderData?.userName || "");
  const [userEmail, setUserEmail] = useState(verifiedOrderData?.userEmail || "");
  const [verifiedSize, setVerifiedSize] = useState(verifiedOrderData?.purchasedSize || "M");
  const [verifiedColor, setVerifiedColor] = useState(verifiedOrderData?.purchasedColor || "Obsidian Black");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (verifiedOrderData) {
      if (verifiedOrderData.userName) setUserName(verifiedOrderData.userName);
      if (verifiedOrderData.userEmail) setUserEmail(verifiedOrderData.userEmail);
      if (verifiedOrderData.purchasedSize) setVerifiedSize(verifiedOrderData.purchasedSize);
      if (verifiedOrderData.purchasedColor) setVerifiedColor(verifiedOrderData.purchasedColor);
    }
  }, [verifiedOrderData]);

  if (!isOpen) return null;

  const handleAddPhotoUrl = () => {
    if (!photoInput.trim()) return;
    audioSystem.playClick(600);
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
  };

  const handleRemovePhoto = (idx: number) => {
    audioSystem.playClick(450);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    audioSystem.playClick(700);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotos((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const validation = reviewSubmissionSchema.safeParse({
      userName,
      userEmail,
      title,
      comment,
      rating,
    });

    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMsg(getZodErrorMessage(validation.error));
      audioSystem.playClick(300, 0.06);
      return;
    }

    try {
      setIsSubmitting(true);
      audioSystem.playClick(800);

      const res = await reviewApi.create({
        productId,
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        rating,
        title: title.trim(),
        comment: comment.trim(),
        fit,
        qualityRating,
        photos,
        verifiedSize,
        verifiedColor,
        isVerifiedPurchase: true,
      });

      if (res && res.success) {
        setSuccess(true);
        audioSystem.playClick(1000);
        if (onReviewSubmitted && res.review) {
          onReviewSubmitted(res.review);
        }
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setTitle("");
          setComment("");
          setPhotos([]);
        }, 1800);
      } else {
        setErrorMsg(res?.message || "Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] h-[90vh] sm:h-auto sm:max-h-[90vh]"
        style={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#ffffff",
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                  flexShrink: 0,
                }}
              />
            )}
            <div className="min-w-0">
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                ATELIER CLIENT CRITIQUE
              </span>
              <h2
                id="write-review-title"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.35rem",
                  lineHeight: "1.2",
                  color: "#0f172a",
                  fontWeight: 600,
                  margin: 0,
                }}
                className="truncate"
              >
                {productName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: "0.5rem",
              borderRadius: "999px",
              color: "#64748b",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:text-black hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-7 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-6">
          {verifiedOrderData?.orderNumber && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
              }}
              className="flex items-center justify-between text-xs text-[#15803d]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span className="font-semibold">Verified Client Purchase Confirmed</span>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#bbf7d0] font-semibold text-[#15803d]">
                ORDER #{verifiedOrderData.orderNumber}
              </span>
            </div>
          )}

          {success ? (
            <div className="py-12 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center border border-[#bbf7d0]">
                <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.5rem",
                  lineHeight: "1.2",
                  color: "#0f172a",
                  fontWeight: 600,
                  margin: "0 0 0.5rem 0",
                }}
              >
                Thank You for Your Feedback
              </h3>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "13px",
                  color: "#64748b",
                  maxWidth: "420px",
                  margin: "0 auto",
                  lineHeight: "1.5",
                }}
              >
                Your verified review has been published. It helps our atelier community evaluate
                silhouette, movement, and fit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Overall Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#334155] block">
                  Overall Garment Rating *
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} out of 5 stars`}
                          aria-pressed={isFilled}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => {
                            audioSystem.playClick(500 + star * 60);
                            setRating(star);
                          }}
                          className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            className="w-7 h-7 transition-colors"
                            style={{
                              fill: isFilled ? "#f59e0b" : "#f1f5f9",
                              stroke: isFilled ? "#f59e0b" : "#cbd5e1",
                              strokeWidth: 1.5,
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-[#475569] ml-2">
                    {rating === 5 && "5.0 ★ Flawless Atelier Grade"}
                    {rating === 4 && "4.0 ★ Superior Silhouette"}
                    {rating === 3 && "3.0 ★ Meets Expectations"}
                    {rating === 2 && "2.0 ★ Minor Sizing Issue"}
                    {rating === 1 && "1.0 ★ Substandard Experience"}
                  </span>
                </div>
              </div>

              {/* 2. Fit Assessment */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#334155] block">
                  Garment Fit Assessment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "runs_small", label: "Runs Small", desc: "Tighter fit" },
                    { id: "true_to_size", label: "True to Size", desc: "Standard atelier cut" },
                    { id: "runs_large", label: "Runs Large", desc: "Relaxed / Oversized" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={fit === option.id}
                      aria-label={`${option.label}: ${option.desc}`}
                      onClick={() => {
                        audioSystem.playClick(600);
                        setFit(option.id as any);
                      }}
                      style={{
                        borderRadius: "10px",
                        border: "1px solid " + (fit === option.id ? "#0f172a" : "#e2e8f0"),
                        backgroundColor: fit === option.id ? "#0f172a" : "#ffffff",
                        color: fit === option.id ? "#ffffff" : "#0f172a",
                      }}
                      className="p-3 text-center transition-all cursor-pointer"
                    >
                      <span className="text-xs font-semibold block">{option.label}</span>
                      <span
                        className={`text-[11px] block mt-0.5 ${
                          fit === option.id ? "text-neutral-300" : "text-[#64748b]"
                        }`}
                      >
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Review Headline & Body */}
              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="review-headline-input"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Review Headline *
                  </label>
                  <input
                    id="review-headline-input"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: "" }));
                    }}
                    placeholder="e.g. Exceptional drape weight & clean architectural silhouette"
                    style={{
                      borderRadius: "10px",
                      border: fieldErrors.title ? "1px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-4 py-2.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all"
                  />
                  {fieldErrors.title && (
                    <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                      {fieldErrors.title}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-comment-textarea"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Detailed Review *
                  </label>
                  <textarea
                    id="review-comment-textarea"
                    rows={4}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (fieldErrors.comment) setFieldErrors((prev) => ({ ...prev, comment: "" }));
                    }}
                    placeholder="Describe the fabric feel, silhouette, stitching quality, movement, and real-world styling advice..."
                    style={{
                      borderRadius: "10px",
                      border: fieldErrors.comment ? "1px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-4 py-2.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all resize-y min-h-[90px]"
                  />
                  {fieldErrors.comment && (
                    <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                      {fieldErrors.comment}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Client Info & Garment Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="review-author-name"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Your Name *
                  </label>
                  <input
                    id="review-author-name"
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      if (fieldErrors.userName) setFieldErrors((prev) => ({ ...prev, userName: "" }));
                    }}
                    placeholder="e.g. Aryan Malhotra"
                    style={{
                      borderRadius: "10px",
                      border: fieldErrors.userName ? "1px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-3.5 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all"
                  />
                  {fieldErrors.userName && (
                    <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                      {fieldErrors.userName}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-author-email"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="review-author-email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      if (fieldErrors.userEmail) setFieldErrors((prev) => ({ ...prev, userEmail: "" }));
                    }}
                    placeholder="client@drapza.com"
                    style={{
                      borderRadius: "10px",
                      border: fieldErrors.userEmail ? "1px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-3.5 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all"
                  />
                  {fieldErrors.userEmail && (
                    <span style={{ color: "#ef4444", fontSize: "0.68rem", fontFamily: "var(--font-dm-mono), monospace", marginTop: "0.2rem", fontWeight: 500, display: "block" }}>
                      {fieldErrors.userEmail}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-verified-size"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Garment Size Purchased
                  </label>
                  <select
                    id="review-verified-size"
                    value={verifiedSize}
                    onChange={(e) => setVerifiedSize(e.target.value)}
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all"
                  >
                    <option value="XS">Size XS</option>
                    <option value="S">Size S</option>
                    <option value="M">Size M</option>
                    <option value="L">Size L</option>
                    <option value="XL">Size XL</option>
                    <option value="XXL">Size XXL</option>
                    <option value="Free Size">Free Size</option>
                    <option value="Custom Fit">Custom Atelier Measurement</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="review-verified-color"
                    className="text-xs font-semibold text-[#334155] block mb-1.5"
                  >
                    Garment Color Shade
                  </label>
                  <input
                    id="review-verified-color"
                    type="text"
                    value={verifiedColor}
                    onChange={(e) => setVerifiedColor(e.target.value)}
                    placeholder="e.g. Obsidian Black / Charcoal"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="w-full px-3.5 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 5. Photo Uploads */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-[#334155] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#64748b]" />
                    Attach Real Garment Photos (Optional)
                  </span>
                  <span className="text-[11px] text-[#64748b] font-normal">Up to 4 images</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {photos.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                      className="relative w-16 h-16 overflow-hidden group shadow-sm"
                    >
                      <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 4 && (
                    <label
                      htmlFor="review-photo-file-upload"
                      aria-label="Upload photo from device"
                      style={{
                        borderRadius: "10px",
                        border: "1px dashed #cbd5e1",
                      }}
                      className="w-16 h-16 hover:border-[#0f172a] flex flex-col items-center justify-center text-[#64748b] hover:text-[#0f172a] cursor-pointer transition-colors bg-[#f8fafc] hover:bg-white"
                    >
                      <UploadCloud className="w-5 h-5" />
                      <span className="text-[9px] font-semibold mt-0.5">UPLOAD</span>
                      <input
                        id="review-photo-file-upload"
                        type="file"
                        accept="image/*"
                        aria-label="Upload photo from device"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="review-photo-url-input"
                    type="url"
                    aria-label="Or paste an image URL"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    placeholder="Or paste an image URL (e.g. https://...)"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    className="flex-1 px-3.5 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    disabled={!photoInput.trim()}
                    aria-label="Add photo URL to review"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f1f5f9",
                    }}
                    className="px-4 py-2 hover:bg-[#0f172a] hover:text-white text-[#0f172a] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Verified Buyer Assurance Note */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
                className="p-3 text-[#475569] text-xs flex items-center gap-2.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#082D20] shrink-0" />
                <span>
                  All submitted feedback is cross-referenced with atelier delivery nodes to award
                  official <strong>Verified Atelier Client</strong> certification.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                  }}
                  className="px-5 py-2.5 text-xs font-semibold hover:border-[#0f172a] hover:text-[#0f172a] transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    borderRadius: "999px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
                  }}
                  className="px-6 py-2.5 hover:bg-[#1e293b] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  <span>{isSubmitting ? "Publishing..." : "Submit Review"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
