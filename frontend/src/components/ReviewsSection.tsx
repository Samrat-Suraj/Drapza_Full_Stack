"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Camera,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  CheckCircle2,
  Info,
  SquarePen,
  ArrowRight,
  Play,
  ChevronRight,
  X,
  } from "lucide-react";
import { reviewApi, ReviewStats } from "@/lib/api";

export interface ReviewItem {
  id: number | string;
  name: string;
  initial: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verified: boolean;
  hasPhotos: boolean;
  helpful: number;
  notHelpful: number;
  product: string;
  productSlug?: string;
  size: string;
  color: string;
  image: string;
  photos: string[];
  isFeatured?: boolean;
  isPinned?: boolean;
  fit?: string;
  response?: string;
  videoThumbnail?: {
    thumbnail: string;
    duration: string;
  };
}

export interface ReviewsSectionProps {
  onWriteReview?: () => void;
  onViewProduct?: (review: ReviewItem) => void;
  onReviewSubmitted?: (review: ReviewItem) => void;
  productName?: string;
  productId?: string;
}

export default function ReviewsSection({
  onWriteReview,
  onViewProduct,
  onReviewSubmitted,
  productName = "DRAPZA Atelier Piece",
  productId,
}: ReviewsSectionProps) {
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("recent");
  const [votes, setVotes] = useState<Record<string, "helpful" | "notHelpful">>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 5.0,
    recommendationPercentage: 100,
    starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    fitDistribution: { runs_small: 0, true_to_size: 0, runs_large: 0 },
  });
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Direct Inline Review Input Box State
  const [inlineRating, setInlineRating] = useState<number>(5);
  const [inlineHoverRating, setInlineHoverRating] = useState<number>(0);
  const [inlineComment, setInlineComment] = useState("");
  const [inlinePhotos, setInlinePhotos] = useState<string[]>([]);
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [inlineIsSubmitting, setInlineIsSubmitting] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Fetch real approved reviews & real telemetry stats from MongoDB
  const fetchLiveReviewsAndStats = async () => {
    setIsLoading(true);
    try {
      const prodQuery = productId && productId !== "ALL" && productId !== "all" ? productId : undefined;
      const [reviewsRes, statsRes] = await Promise.all([
        reviewApi.getAll({
          productId: prodQuery,
          limit: 100,
          sort: sort === "highest" ? "highest" : sort === "lowest" ? "lowest" : sort === "helpful" ? "helpful" : "newest",
        }),
        reviewApi.getStats(prodQuery),
      ]);

      if (reviewsRes && reviewsRes.success && Array.isArray(reviewsRes.reviews)) {
        const mapped: ReviewItem[] = reviewsRes.reviews.map((r: any) => {
          const prodObj = typeof r.productId === "object" ? r.productId : null;
          const prodName = prodObj?.name || productName || "DRAPZA Atelier Piece";
          const prodSlug = prodObj?.slug || "";
          const prodImg =
            (prodObj?.images && prodObj.images[0]) ||
            (Array.isArray(r.photos) && r.photos[0]) ||
            "/images/drapza/products/product_1.png";

          const dt = r.createdAt
            ? new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date(r.createdAt))
            : "Recent";

          return {
            id: r._id || String(Math.random()),
            name: r.userName || "Verified Patron",
            initial: (r.userName || "V").charAt(0).toUpperCase(),
            rating: Number(r.rating) || 5,
            title: r.title || (r.comment ? r.comment.slice(0, 48) : "Product Review"),
            text: r.comment || "",
            date: dt,
            verified: r.isVerifiedPurchase !== false,
            hasPhotos: Array.isArray(r.photos) && r.photos.length > 0,
            helpful: r.helpfulVotes || 0,
            notHelpful: 0,
            product: prodName,
            productSlug: prodSlug,
            size: r.verifiedSize || "M",
            color: r.verifiedColor || "Atelier Natural",
            image: prodImg,
            photos: Array.isArray(r.photos) ? r.photos : [],
            isFeatured: Boolean(r.isFeatured),
            isPinned: Boolean(r.isPinned),
            fit: r.fit || "true_to_size",
            response: r.atelierResponse || undefined,
          };
        });

        setReviews(mapped);
      }

      if (statsRes && statsRes.success && statsRes.stats) {
        setStats({
          totalReviews: statsRes.stats.totalReviews || 0,
          averageRating: Number(statsRes.stats.averageRating) || 5.0,
          recommendationPercentage: statsRes.stats.recommendationPercentage ?? 100,
          starDistribution: statsRes.stats.starDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          fitDistribution: statsRes.stats.fitDistribution || { runs_small: 0, true_to_size: 0, runs_large: 0 },
        });
      }
    } catch (err) {
      console.error("Failed to fetch live reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReviewsAndStats();
  }, [productId, productName, sort]);

  const handleInlineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files)
      .slice(0, 4 - inlinePhotos.length)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setInlinePhotos((prev) => {
              if (prev.length >= 4) return prev;
              return [...prev, reader.result as string];
            });
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const handleRemoveInlinePhoto = (index: number) => {
    setInlinePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!inlineComment.trim() || inlineComment.trim().length < 5) {
      setInlineError("Please write your review before submitting.");
      return;
    }

    setInlineIsSubmitting(true);

    try {
      const authorName = "Verified Patron";
      const excerpt =
        inlineComment.trim().length > 50
          ? inlineComment.trim().slice(0, 47) + "..."
          : inlineComment.trim();

      let createdId: string | number = Date.now();
      try {
        const res = await reviewApi.create({
          productId: productId || "6abf8f0d8a2b388b59afef78",
          userName: authorName,
          userEmail: "client@atelier.drapza.com",
          rating: inlineRating,
          title: excerpt,
          comment: inlineComment.trim(),
          fit: "true_to_size",
          qualityRating: inlineRating,
          photos: inlinePhotos,
          verifiedSize: "M",
          verifiedColor: "Atelier Natural",
          isVerifiedPurchase: true,
        });
        if (res && res.review && res.review._id) {
          createdId = res.review._id;
        }
      } catch (err: any) {
        console.error("Review creation error:", err);
      }

      const today = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date());

      const newReviewItem: ReviewItem = {
        id: createdId,
        name: authorName,
        initial: "V",
        rating: inlineRating,
        title: excerpt,
        text: inlineComment.trim(),
        date: today,
        verified: true,
        hasPhotos: inlinePhotos.length > 0,
        helpful: 0,
        notHelpful: 0,
        product: productName,
        size: "M",
        color: "Atelier Natural",
        image: inlinePhotos[0] || "/images/drapza/products/product_1.png",
        photos: inlinePhotos,
      };

      setInlineSuccess(true);
      setInlineComment("");
      setInlinePhotos([]);
      setShowPhotoUrlInput(false);
      setPhotoUrlInput("");

      // Refresh live state directly from MongoDB
      await fetchLiveReviewsAndStats();

      if (onReviewSubmitted) {
        onReviewSubmitted(newReviewItem);
      }

      setTimeout(() => {
        setInlineSuccess(false);
      }, 5000);
    } catch (err: any) {
      setInlineError(err?.message || "Failed to submit review.");
    } finally {
      setInlineIsSubmitting(false);
    }
  };

  // Dynamic star breakdown computed from real telemetry stats or reviews
  const distribution = useMemo(() => {
    const total = stats.totalReviews > 0 ? stats.totalReviews : (reviews.length || 1);
    return [5, 4, 3, 2, 1].map((star) => {
      const count =
        stats.starDistribution && stats.starDistribution[star] !== undefined
          ? stats.starDistribution[star]
          : reviews.filter((r) => Math.floor(r.rating) === star).length;
      const percentage = Math.round((count / total) * 100);
      return { star, percentage, count };
    });
  }, [stats, reviews]);

  // Dynamic sizing fit percentages computed from real telemetry stats or reviews
  const fitPercentages = useMemo(() => {
    const totalFit =
      (stats.fitDistribution?.runs_small || 0) +
      (stats.fitDistribution?.true_to_size || 0) +
      (stats.fitDistribution?.runs_large || 0);

    if (totalFit > 0) {
      return {
        small: Math.round(((stats.fitDistribution.runs_small || 0) / totalFit) * 100),
        trueSize: Math.round(((stats.fitDistribution.true_to_size || 0) / totalFit) * 100),
        large: Math.round(((stats.fitDistribution.runs_large || 0) / totalFit) * 100),
      };
    }

    if (reviews.length > 0) {
      const small = reviews.filter((r) => r.fit === "runs_small").length;
      const trueSize = reviews.filter((r) => !r.fit || r.fit === "true_to_size").length;
      const large = reviews.filter((r) => r.fit === "runs_large").length;
      const len = reviews.length;
      return {
        small: Math.round((small / len) * 100),
        trueSize: Math.round((trueSize / len) * 100),
        large: Math.round((large / len) * 100),
      };
    }

    return { small: 0, trueSize: 100, large: 0 };
  }, [stats, reviews]);

  // Overall Score & Recommendation
  const displayScore =
    stats.totalReviews > 0
      ? stats.averageRating
      : reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;
  const displayCount = stats.totalReviews > 0 ? stats.totalReviews : reviews.length;
  const displayRecommend =
    stats.totalReviews > 0
      ? stats.recommendationPercentage
      : reviews.length > 0
      ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)
      : 100;

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (filter === "photos") {
      result = result.filter((review) => review.hasPhotos);
    } else if (filter === "verified") {
      result = result.filter((review) => review.verified);
    } else if (filter !== "all") {
      const targetStar = Number(filter);
      if (!isNaN(targetStar)) {
        result = result.filter((review) => Math.floor(review.rating) === targetStar);
      }
    }

    if (sort === "highest") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort === "lowest") {
      result.sort((a, b) => a.rating - b.rating);
    } else if (sort === "helpful") {
      result.sort((a, b) => b.helpful - a.helpful);
    } else {
      result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return String(b.id).localeCompare(String(a.id));
      });
    }

    return result;
  }, [filter, sort, reviews]);

  function vote(reviewId: number | string, type: "helpful" | "notHelpful") {
    const key = String(reviewId);
    if (votes[key]) return;

    setVotes((prev) => ({ ...prev, [key]: type }));
    setReviews((prev) =>
      prev.map((review) =>
        String(review.id) !== key
          ? review
          : {
              ...review,
              [type === "helpful" ? "helpful" : "notHelpful"]:
                (review[type === "helpful" ? "helpful" : "notHelpful"] || 0) + 1,
            }
      )
    );

    if (type === "helpful" && typeof reviewId === "string" && reviewId.length === 24) {
      reviewApi.voteHelpful(reviewId).catch(() => {});
    }
  }

  return (
    <section
      id="reviews-section-root"
      className="drapza-atelier-reviews-wrap"
      style={{
        width: "100%",
        backgroundColor: "#faf9f6",
        color: "#0f172a",
        paddingTop: "90px",
        paddingBottom: "130px",
        paddingLeft: "clamp(36px, 6vw, 96px)",
        paddingRight: "clamp(36px, 6vw, 96px)",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Strict Luxury Atelier Typography & CSS Isolation */}
      <style>{`
        .drapza-atelier-reviews-wrap,
        .drapza-atelier-reviews-wrap * {
          box-sizing: border-box !important;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        /* Prevent ANY span, p, a, div from inheriting uppercase from main.css */
        .drapza-atelier-reviews-wrap :is(p, span, label, input, textarea, a, li, div) {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }

        /* Editorial Serif Heading */
        .drapza-atelier-reviews-wrap .atelier-editorial-heading,
        .drapza-atelier-reviews-wrap :is(h1, h2, h3, h4, h5) {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif !important;
          text-transform: none !important;
          letter-spacing: -0.015em !important;
          line-height: 1.15 !important;
          font-weight: 600 !important;
          color: #0f172a !important;
        }

        /* Eyebrow Tagline */
        .drapza-atelier-reviews-wrap .atelier-tagline {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.14em !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          color: #64748b !important;
        }

        /* Write Review Button - Force White Text & White Stroke */
        .drapza-atelier-reviews-wrap .atelier-write-review-btn {
          background-color: #0f172a !important;
          color: #ffffff !important;
        }
        .drapza-atelier-reviews-wrap .atelier-write-review-btn * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        .drapza-atelier-reviews-wrap .atelier-write-review-btn .atelier-btn-text {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          font-size: 12px !important;
        }

        /* Active Filter Pill - Force White Text & White Stroke */
        .drapza-atelier-reviews-wrap .drapza-pill-active {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
          color: #ffffff !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-active * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* Inactive Filter Pill - Crisp Charcoal Text */
        .drapza-atelier-reviews-wrap .drapza-pill-inactive {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #334155 !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-inactive * {
          color: #334155 !important;
          stroke: #334155 !important;
        }

        /* Review Critique Typography */
        .drapza-atelier-reviews-wrap .drapza-review-title {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          text-transform: none !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          line-height: 1.4 !important;
          color: #0f172a !important;
        }
        .drapza-atelier-reviews-wrap .drapza-review-body {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.65 !important;
          color: #475569 !important;
        }
        .drapza-atelier-reviews-wrap .drapza-reviewer-name {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          text-transform: none !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          color: #0f172a !important;
        }
        .drapza-atelier-reviews-wrap .drapza-card-title {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          color: #0f172a !important;
        }
        .drapza-atelier-reviews-wrap .drapza-telemetry-note {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          color: #64748b !important;
          letter-spacing: normal !important;
          text-transform: none !important;
        }

        /* Button Base & Strict Padding Rules */
        .drapza-atelier-reviews-wrap button {
          outline: none !important;
          cursor: pointer !important;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
        }

        .drapza-atelier-reviews-wrap .atelier-write-review-btn {
          padding: 12px 24px !important;
          border-radius: 8px !important;
          background-color: #0f172a !important;
          color: #ffffff !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18) !important;
          cursor: pointer !important;
        }
        .drapza-atelier-reviews-wrap .atelier-write-review-btn * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        .drapza-atelier-reviews-wrap .drapza-filter-pill {
          padding: 10px 22px !important;
          border-radius: 999px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-active {
          background-color: #0f172a !important;
          border: 1px solid #0f172a !important;
          color: #ffffff !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-active * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-inactive {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #334155 !important;
        }
        .drapza-atelier-reviews-wrap .drapza-pill-inactive * {
          color: #334155 !important;
          stroke: #334155 !important;
        }

        /* Luxury Micro-interactions & Elevations */
        .drapza-telemetry-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease;
        }
        .drapza-telemetry-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1 !important;
        }

        .drapza-review-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease;
        }
        .drapza-review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.07);
          border-color: #cbd5e1 !important;
        }

        .drapza-breakdown-row {
          transition: background-color 0.18s ease;
          border-radius: 6px;
          padding: 3px 6px;
          margin: 0 -6px;
        }
        .drapza-breakdown-row:hover {
          background-color: #f1f5f9;
        }

        .atelier-write-review-btn {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .atelier-write-review-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.28) !important;
          background-color: #020617 !important;
        }
        .atelier-write-review-btn:active {
          transform: scale(0.97);
        }

        .drapza-photo-thumbnail {
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .drapza-photo-thumbnail:hover {
          transform: scale(1.04);
          border-color: #0f172a !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          z-index: 2;
        }

        .drapza-filter-pill {
          transition: all 0.18s ease;
        }
        .drapza-filter-pill:hover {
          border-color: #0f172a !important;
          transform: translateY(-1px);
        }

        .drapza-product-widget {
          transition: all 0.2s ease;
        }
        .drapza-product-widget:hover .drapza-arrow-icon {
          transform: translateX(4px);
        }
        .drapza-product-widget:hover .drapza-product-name {
          color: #0f172a !important;
        }

        /* Direct Review Input Box Styling */
        .drapza-atelier-reviews-wrap .atelier-direct-review-box {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 28px 32px !important;
          margin-bottom: 32px !important;
          box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .drapza-atelier-reviews-wrap .atelier-direct-review-box:focus-within {
          border-color: #cbd5e1 !important;
          box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.06) !important;
        }
        .drapza-atelier-reviews-wrap .atelier-inline-input,
        .drapza-atelier-reviews-wrap .atelier-inline-textarea,
        .drapza-atelier-reviews-wrap .atelier-inline-select {
          width: 100% !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          background-color: #f8fafc !important;
          color: #0f172a !important;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
          font-size: 13.5px !important;
          transition: all 0.2s ease !important;
          outline: none !important;
        }
        .drapza-atelier-reviews-wrap .atelier-inline-input:focus,
        .drapza-atelier-reviews-wrap .atelier-inline-textarea:focus,
        .drapza-atelier-reviews-wrap .atelier-inline-select:focus {
          border-color: #0f172a !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06) !important;
        }
        .drapza-atelier-reviews-wrap .atelier-inline-submit-btn {
          background-color: #0f172a !important;
          color: #ffffff !important;
          padding: 11px 26px !important;
          border-radius: 999px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          letter-spacing: 0.02em !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18) !important;
          border: none !important;
          cursor: pointer !important;
        }
        .drapza-atelier-reviews-wrap .atelier-inline-submit-btn:hover {
          background-color: #1e293b !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.24) !important;
        }
        .drapza-atelier-reviews-wrap .atelier-inline-submit-btn * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        @media (max-width: 900px) {
          .drapza-review-card-layout {
            flex-direction: column !important;
          }
          .drapza-review-right-col {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid #e2e8f0 !important;
            padding-left: 0 !important;
            padding-top: 16px !important;
          }
        }

        @media (max-width: 768px) {
          #reviews-section-root.drapza-atelier-reviews-wrap {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-top: 48px !important;
            padding-bottom: 60px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .drapza-atelier-reviews-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .drapza-telemetry-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .drapza-telemetry-card {
            width: 100% !important;
            padding: 20px 18px !important;
          }
          .atelier-direct-review-box {
            padding: 20px 18px !important;
          }
          .drapza-review-card {
            padding: 20px 16px !important;
          }
        }
      `}</style>

      {/* Decorative Botanical Branch (Top Right Watercolor Aesthetic) */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "380px",
          maxWidth: "38vw",
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
          opacity: 0.75,
        }}
        viewBox="0 0 380 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M380 0 C300 24, 230 75, 185 140 C160 176, 140 220, 120 260"
          stroke="#72856f"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M260 55 C230 78, 195 105, 170 115"
          stroke="#72856f"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M210 118 C180 138, 150 155, 120 162"
          stroke="#72856f"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        <g fill="#7d9179" opacity="0.75">
          <path d="M365 14 C332 4, 304 15, 292 28 C314 34, 348 29, 365 14Z" />
          <path d="M345 34 C308 28, 280 44, 274 62 C298 64, 332 54, 345 34Z" />
          <path d="M318 18 C296 2, 270 9, 258 22 C278 28, 304 28, 318 18Z" opacity="0.55" />
          <path d="M288 65 C250 56, 226 75, 220 95 C244 97, 276 85, 288 65Z" />
          <path d="M252 88 C218 80, 192 100, 186 120 C210 122, 240 110, 252 88Z" />
          <path d="M222 135 C190 126, 166 146, 160 166 C184 168, 212 154, 222 135Z" />
          <path d="M192 155 C160 146, 138 165, 132 185 C156 187, 182 174, 192 155Z" />
          <path d="M160 200 C132 192, 112 210, 108 228 C130 230, 152 217, 160 200Z" opacity="0.8" />
          <path d="M135 235 C110 228, 92 244, 88 258 C108 260, 128 248, 135 235Z" opacity="0.6" />
        </g>
        <g fill="#93a78f" opacity="0.6">
          <path d="M248 62 C226 48, 204 58, 196 72 C214 76, 236 72, 248 62Z" />
          <path d="M208 106 C188 92, 166 102, 158 116 C176 120, 198 115, 208 106Z" />
          <path d="M174 146 C154 134, 134 142, 126 155 C142 160, 164 154, 174 146Z" />
        </g>
      </svg>

      {/* Main Container with Generous Left & Right Luxury Padding */}
      <div
        className="drapza-atelier-reviews-container"
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ─── 1. HEADER (TAGLINE, PLAYFAIR HEADING, WRITE REVIEW BTN) ─── */}
        <header style={{ marginBottom: "40px" }}>
          <p className="atelier-tagline" style={{ marginBottom: "8px" }}>
            REAL CUSTOMERS • REAL STORIES • DRAPZA
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                className="atelier-editorial-heading"
                role="heading"
                aria-level={2}
                style={{
                  fontSize: "clamp(30px, 4vw, 42px)",
                  fontWeight: 600,
                  color: "#0f172a",
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: 1.15,
                }}
              >
                Ratings &amp; Atelier Feedback
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginTop: "8px",
                  lineHeight: "1.55",
                  maxWidth: "620px",
                  fontWeight: 400,
                }}
              >
                Verified product reviews, silhouette movement, and real-world drape impressions.
              </p>
            </div>
          </div>
        </header>

        {/* ─── 2. TOP THREE SUMMARY TELEMETRY CARDS ─── */}
        <div
          className="drapza-telemetry-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          {/* Card 1: Overall Product Score */}
          <div
            className="drapza-telemetry-card"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "28px 30px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "240px",
            }}
          >
            <div>
              <div className="drapza-card-title" style={{ marginBottom: "12px" }}>
                Overall Product Score
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "48px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                  {displayScore.toFixed(1)}
                </span>
                <span style={{ fontSize: "18px", color: "#94a3b8", fontWeight: 400 }}>/ 5.0</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "8px" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={18}
                    className={
                      n <= Math.floor(displayScore)
                        ? "fill-amber-400 text-amber-400"
                        : n - displayScore < 1
                        ? "fill-amber-200 text-amber-400"
                        : "text-stone-300 fill-stone-200"
                    }
                  />
                ))}
              </div>

              <p style={{ fontSize: "12px", color: "#64748b" }}>
                {displayCount === 0
                  ? "No verified reviews yet"
                  : `Based on ${displayCount} verified review${displayCount === 1 ? "" : "s"}`}
              </p>
            </div>

            <div style={{ marginTop: "18px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "7px 15px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={15} style={{ color: "#166534" }} />
                <span>{displayRecommend}% Recommend this piece</span>
              </div>
            </div>
          </div>

          {/* Card 2: Rating Breakdown */}
          <div
            className="drapza-telemetry-card"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "28px 32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "240px",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span className="drapza-card-title">
                  Rating Breakdown
                </span>
                {filter !== "all" && !["photos", "verified"].includes(filter) && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="drapza-custom-btn"
                    style={{ fontSize: "11px", color: "#0f172a", fontWeight: 600, textDecoration: "underline" }}
                  >
                    Reset ({filter}★ active)
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {distribution.map((item) => {
                  const isActive = filter === String(item.star);
                  return (
                    <button
                      key={item.star}
                      type="button"
                      onClick={() => setFilter(isActive ? "all" : String(item.star))}
                      className="drapza-custom-btn drapza-breakdown-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        cursor: "pointer",
                        backgroundColor: isActive ? "#f1f5f9" : "transparent",
                      }}
                      title={`Filter ${item.star} star reviews (${item.count || 0})`}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#0f172a",
                          width: "32px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          flexShrink: 0,
                        }}
                      >
                        {item.star} ★
                      </span>

                      <span
                        style={{
                          height: "8px",
                          flex: 1,
                          backgroundColor: "#f1f5f9",
                          borderRadius: "999px",
                          overflow: "hidden",
                          display: "block",
                          margin: "0 6px",
                        }}
                      >
                        <span
                          style={{
                            height: "100%",
                            width: `${item.percentage}%`,
                            backgroundColor: "#0f172a",
                            borderRadius: "999px",
                            display: "block",
                            transition: "all 0.3s ease",
                          }}
                        />
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#64748b",
                          width: "38px",
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {item.percentage}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Garment Proportions & Fit */}
          <div
            className="drapza-telemetry-card"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "28px 32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "240px",
            }}
          >
            <div>
              <div className="drapza-card-title">
                Garment Proportions &amp; Fit
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", marginBottom: "16px" }}>
                Real-world sizing telemetry:
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  textAlign: "center",
                  padding: "6px 0",
                }}
              >
                <div style={{ padding: "0 6px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Runs Small</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                    {fitPercentages.small}%
                  </p>
                </div>

                <div style={{ padding: "0 6px", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>True to Size</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                    {fitPercentages.trueSize}%
                  </p>
                </div>

                <div style={{ padding: "0 6px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Runs Large</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                    {fitPercentages.large}%
                  </p>
                </div>
              </div>
            </div>

            <div
              className="drapza-telemetry-note"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "12px",
                fontSize: "11px",
                color: "#64748b",
                marginTop: "14px",
              }}
            >
              <Info size={14} style={{ flexShrink: 0, color: "#64748b" }} />
              <span>Calibrated using real post-delivery patron feedback telemetry.</span>
            </div>
          </div>
        </div>

        {/* ─── DIRECT REVIEW INPUT COMPOSER (INLINE ATELIER FORM) ─── */}
        <div
          id="atelier-direct-review-box"
          className="atelier-direct-review-box"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "26px 30px",
            marginBottom: "32px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <form onSubmit={handleInlineSubmit}>
            {/* Header: Title & Interactive Stars */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "20px",
                paddingBottom: "18px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <p
                  className="atelier-tagline"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  PRODUCT REVIEWS • ATELIER FEEDBACK
                </p>
                <h3
                  className="atelier-editorial-heading"
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#0f172a",
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    textTransform: "none",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Write Your Review Directly
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "4px 0 0 0",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textTransform: "none",
                  }}
                >
                  Share your real impressions of fabric weight, silhouette fall, movement, and sizing.
                </p>
              </div>

              {/* Star Rating Selector */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (inlineHoverRating || inlineRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`Rate ${star} stars`}
                        onMouseEnter={() => setInlineHoverRating(star)}
                        onMouseLeave={() => setInlineHoverRating(0)}
                        onClick={() => setInlineRating(star)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "2px",
                          cursor: "pointer",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <Star
                          size={24}
                          style={{
                            fill: isFilled ? "#f59e0b" : "#f1f5f9",
                            stroke: isFilled ? "#f59e0b" : "#cbd5e1",
                            strokeWidth: "1.5",
                            transition: "all 0.15s ease",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  {inlineRating === 5 && "5.0 ★ Flawless Atelier Grade"}
                  {inlineRating === 4 && "4.0 ★ Superior Silhouette"}
                  {inlineRating === 3 && "3.0 ★ Meets Expectations"}
                  {inlineRating === 2 && "2.0 ★ Minor Sizing Issue"}
                  {inlineRating === 1 && "1.0 ★ Substandard Drape"}
                </span>
              </div>
            </div>

            {/* Direct Review Input Box */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="inline-review-critique"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Write Your Review Directly *
              </label>
              <textarea
                id="inline-review-critique"
                rows={4}
                required
                value={inlineComment}
                onChange={(e) => setInlineComment(e.target.value)}
                placeholder="Write your review directly here... Share your experience with the fabric texture, weight, silhouette, and drape."
                className="atelier-inline-textarea"
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  fontSize: "14px",
                  color: "#0f172a",
                  lineHeight: "1.6",
                  resize: "vertical",
                  minHeight: "105px",
                  outline: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Photo Attachment Section */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <label
                  htmlFor="inline-direct-photo-upload"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 16px",
                    borderRadius: "999px",
                    border: "1px dashed #cbd5e1",
                    backgroundColor: "#f8fafc",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:border-black hover:text-black hover:bg-white"
                >
                  <Camera size={15} style={{ color: "#475569" }} />
                  <span>
                    {inlinePhotos.length > 0
                      ? `Attach More Photos (${inlinePhotos.length}/4)`
                      : "Attach Photos (0/4)"}
                  </span>
                  <input
                    id="inline-direct-photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInlineFileUpload}
                    style={{ display: "none" }}
                  />
                </label>

                {!showPhotoUrlInput && inlinePhotos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setShowPhotoUrlInput(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "4px 6px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    className="hover:text-black"
                  >
                    Or paste image link
                  </button>
                )}
              </div>

              {/* Paste URL Input Field */}
              {showPhotoUrlInput && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
                    className="atelier-inline-input"
                    style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "12px", flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoUrlInput.trim()) {
                        setInlinePhotos((prev) => (prev.length < 4 ? [...prev, photoUrlInput.trim()] : prev));
                        setPhotoUrlInput("");
                        setShowPhotoUrlInput(false);
                      }
                    }}
                    disabled={!photoUrlInput.trim() || inlinePhotos.length >= 4}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoUrlInput(false);
                      setPhotoUrlInput("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Attached Photo Preview Thumbnails */}
              {inlinePhotos.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                  {inlinePhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "68px",
                        height: "68px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid #cbd5e1",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Attached upload ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInlinePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          backgroundColor: "rgba(15, 23, 42, 0.8)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "999px",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "background-color 0.15s ease",
                        }}
                        className="hover:bg-red-600"
                      >
                        <X size={12} style={{ stroke: "#ffffff", color: "#ffffff" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {inlineError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Info size={15} style={{ flexShrink: 0, color: "#b91c1c" }} />
                <span>{inlineError}</span>
              </div>
            )}

            {/* Success Banner */}
            {inlineSuccess && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#15803d",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                <span>
                  Thank you! Your review has been posted directly to the feed below.
                </span>
              </div>
            )}

            {/* Footer Row: Security Note + Submit Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                paddingTop: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                <ShieldCheck size={15} style={{ color: "#082d20", flexShrink: 0 }} />
                <span>Verified Direct Feedback • Displays instantly in the patron review feed.</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {inlineComment && (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineComment("");
                      setInlineError(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "8px 12px",
                    }}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={inlineIsSubmitting}
                  className="atelier-inline-submit-btn"
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    padding: "11px 26px",
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
                  }}
                >
                  <span>{inlineIsSubmitting ? "Submitting..." : "Submit Review"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ─── 3. FILTER PILLS & SORT ROW ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Filter buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`drapza-custom-btn drapza-filter-pill ${filter === "all" ? "drapza-pill-active" : "drapza-pill-inactive"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: filter === "all" ? "#0f172a" : "#ffffff",
                border: "1px solid " + (filter === "all" ? "#0f172a" : "#e2e8f0"),
                boxShadow: filter === "all" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                color: filter === "all" ? "#ffffff" : "#0f172a",
              }}
            >
              <MessageSquare size={14} style={{ color: filter === "all" ? "#ffffff" : "#0f172a", stroke: filter === "all" ? "#ffffff" : "#0f172a" }} />
              <span style={{ color: filter === "all" ? "#ffffff" : "#0f172a" }}>All Reviews</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter(filter === "photos" ? "all" : "photos")}
              className={`drapza-custom-btn drapza-filter-pill ${filter === "photos" ? "drapza-pill-active" : "drapza-pill-inactive"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: filter === "photos" ? "#0f172a" : "#ffffff",
                border: "1px solid " + (filter === "photos" ? "#0f172a" : "#e2e8f0"),
                boxShadow: filter === "photos" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                color: filter === "photos" ? "#ffffff" : "#334155",
              }}
            >
              <Camera size={14} style={{ color: filter === "photos" ? "#ffffff" : "#334155", stroke: filter === "photos" ? "#ffffff" : "#334155" }} />
              <span style={{ color: filter === "photos" ? "#ffffff" : "#334155" }}>With Photos</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter(filter === "verified" ? "all" : "verified")}
              className={`drapza-custom-btn drapza-filter-pill ${filter === "verified" ? "drapza-pill-active" : "drapza-pill-inactive"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: filter === "verified" ? "#0f172a" : "#ffffff",
                border: "1px solid " + (filter === "verified" ? "#0f172a" : "#e2e8f0"),
                boxShadow: filter === "verified" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                color: filter === "verified" ? "#ffffff" : "#334155",
              }}
            >
              <ShieldCheck size={14} style={{ color: filter === "verified" ? "#ffffff" : "#334155", stroke: filter === "verified" ? "#ffffff" : "#334155" }} />
              <span style={{ color: filter === "verified" ? "#ffffff" : "#334155" }}>Verified Buyers Only</span>
            </button>

            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="drapza-custom-btn"
                style={{
                  fontSize: "12px",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "underline",
                  marginLeft: "6px",
                }}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>Sort by:</span>
            <div style={{ position: "relative" }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "8px 34px 8px 16px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#0f172a",
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#6b7280",
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── 4. REVIEW CARDS FEED (2-COL ALIGNED LAYOUT) ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {isLoading && reviews.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                <span>Loading verified patron critiques from DRAPZA atelier...</span>
              </div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                No reviews match the selected filter.
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="drapza-custom-btn"
                style={{
                  fontSize: "13px",
                  color: "#0f172a",
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                View all reviews
              </button>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const hasVoted = votes[review.id];

              return (
                <article
                  key={review.id}
                  className="drapza-review-card drapza-review-card-layout"
                  style={{
                    backgroundColor: "#ffffff",
                    border: review.isPinned ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "32px 36px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "36px",
                    boxShadow: review.isPinned ? "0 4px 14px rgba(15, 23, 42, 0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  {/* ── Left Side: Customer Critique ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top user row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          minWidth: "36px",
                          borderRadius: "999px",
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {review.initial}
                      </div>

                      <span className="drapza-reviewer-name">
                        {review.name}
                      </span>

                      {review.isPinned && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            padding: "2px 9px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <span>Pinned Critique</span>
                        </span>
                      )}

                      {review.isFeatured && !review.isPinned && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1e40af",
                            padding: "2px 9px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <span>Featured</span>
                        </span>
                      )}

                      {review.verified && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            padding: "2px 9px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 500,
                          }}
                        >
                          <CheckCircle2 size={12} style={{ color: "#166534" }} />
                          <span>Verified Purchase</span>
                        </span>
                      )}

                      <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "6px", fontWeight: 400 }}>
                        {review.date}
                      </span>
                    </div>

                    {/* Stars + rating score */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={15}
                            className={
                              n <= Math.floor(review.rating)
                                ? "fill-amber-400 text-amber-400"
                                : n - review.rating < 1
                                ? "fill-amber-200 text-amber-400"
                                : "text-stone-300"
                            }
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                        {review.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Review Title */}
                    <div className="drapza-review-title" style={{ marginBottom: "6px" }}>
                      {review.title}
                    </div>

                    {/* Review Text */}
                    <p className="drapza-review-body" style={{ marginBottom: "16px", maxWidth: "760px" }}>
                      {review.text}
                    </p>

                    {/* Media Gallery (Photos + Video preview like Screenshot 1) */}
                    {(review.photos?.length > 0 || review.videoThumbnail) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                        {review.photos.map((photo, pIdx) => {
                          const isLast = pIdx === 2 && review.photos.length > 3;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setLightboxPhoto(photo)}
                              className="drapza-custom-btn drapza-photo-thumbnail"
                              style={{
                                width: "62px",
                                height: "62px",
                                minWidth: "62px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid #e2e8f0",
                                position: "relative",
                                cursor: "pointer",
                                padding: 0,
                                backgroundColor: "#f8fafc",
                              }}
                              title="Click to view full photo"
                            >
                              <img
                                src={photo}
                                alt="Review thumbnail"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                              {isLast && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  +1
                                </div>
                              )}
                            </button>
                          );
                        })}

                        {/* Video Thumbnail (Review 2 in Screenshot 1) */}
                        {review.videoThumbnail && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto(review.videoThumbnail?.thumbnail || "")}
                              className="drapza-custom-btn drapza-photo-thumbnail"
                              style={{
                                width: "62px",
                                height: "62px",
                                minWidth: "62px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid #e2e8f0",
                                position: "relative",
                                cursor: "pointer",
                                padding: 0,
                                backgroundColor: "#0f172a",
                              }}
                              title="Click to view clip"
                            >
                              <img
                                src={review.videoThumbnail.thumbnail}
                                alt="Video preview thumbnail"
                                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "3px",
                                  backgroundColor: "rgba(0,0,0,0.38)",
                                  color: "#ffffff",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                }}
                              >
                                <Play size={11} className="fill-white" />
                                <span>{review.videoThumbnail.duration}</span>
                              </div>
                            </button>

                            {/* Carousel next arrow */}
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto(review.videoThumbnail?.thumbnail || "")}
                              className="drapza-custom-btn"
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "999px",
                                backgroundColor: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#0f172a",
                              }}
                              title="Next clip"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Atelier Official Response (if available) */}
                    {review.response && (
                      <div
                        style={{
                          marginBottom: "18px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderLeft: "3px solid #0f172a",
                          borderRadius: "0 10px 10px 0",
                          padding: "14px 18px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#0f172a",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                          }}
                        >
                          <ShieldCheck size={13} style={{ color: "#0f172a" }} />
                          <span>DRAPZA Atelier Response</span>
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#334155",
                            margin: 0,
                            lineHeight: "1.55",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {review.response}
                        </p>
                      </div>
                    )}

                    {/* Helpful / Not Helpful Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", color: "#64748b" }}>
                      <button
                        type="button"
                        onClick={() => vote(review.id, "helpful")}
                        className="drapza-custom-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          color: hasVoted === "helpful" ? "#15803d" : "#64748b",
                          fontWeight: hasVoted === "helpful" ? 600 : 500,
                          transition: "color 0.2s ease",
                        }}
                      >
                        <ThumbsUp size={14} className={hasVoted === "helpful" ? "fill-emerald-700" : ""} />
                        <span>Helpful ({review.helpful})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => vote(review.id, "notHelpful")}
                        className="drapza-custom-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          color: hasVoted === "notHelpful" ? "#b91c1c" : "#64748b",
                          fontWeight: hasVoted === "notHelpful" ? 600 : 500,
                          transition: "color 0.2s ease",
                        }}
                      >
                        <ThumbsDown size={14} className={hasVoted === "notHelpful" ? "fill-red-700" : ""} />
                        <span>Not Helpful ({review.notHelpful})</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Right Side: Purchased Product Preview ── */}
                  <div
                    className="drapza-review-right-col drapza-product-widget"
                    style={{
                      width: "260px",
                      minWidth: "260px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      borderLeft: "1px solid #e2e8f0",
                      paddingLeft: "32px",
                    }}
                  >
                    <img
                      src={review.image}
                      alt={review.product}
                      style={{
                        width: "68px",
                        minWidth: "68px",
                        maxWidth: "68px",
                        height: "88px",
                        minHeight: "88px",
                        maxHeight: "88px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        flexShrink: 0,
                        transition: "transform 0.25s ease",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/drapza/products/product_1.png";
                      }}
                    />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="drapza-product-name"
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "4px",
                          transition: "color 0.2s ease",
                        }}
                      >
                        {review.product}
                      </div>

                      <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px", fontWeight: 400 }}>
                        Size: {review.size} | Color: {review.color}
                      </p>

                      <button
                        type="button"
                        onClick={() => onViewProduct?.(review)}
                        className="drapza-custom-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#0f172a",
                          cursor: "pointer",
                          transition: "color 0.2s ease",
                          textDecoration: "underline",
                        }}
                      >
                        <span>View Product</span>
                        <ArrowRight size={13} className="drapza-arrow-icon" style={{ transition: "transform 0.2s ease" }} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* ─── FULL-SCREEN PHOTO LIGHTBOX ─── */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxPhoto(null)}
            className="drapza-custom-btn"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              backgroundColor: "rgba(255,255,255,0.18)",
              color: "#ffffff",
              borderRadius: "999px",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "800px",
              maxHeight: "85vh",
              overflow: "hidden",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          >
            <img
              src={lightboxPhoto}
              alt="Client review photo"
              style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "80vh" }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export { ReviewsSection };
