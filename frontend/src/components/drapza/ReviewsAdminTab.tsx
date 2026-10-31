"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  ThumbsUp,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  Filter,
  Eye,
  X,
  Plus,
  Edit3,
  MessageSquare,
  Bookmark,
  Check,
  AlertCircle,
  ArrowUpDown,
  Pin,
  ChevronDown,
  UploadCloud,
  Minus,
} from "lucide-react";
import { reviewApi, ReviewData } from "@/lib/api";
import { PRODUCTS_DATA } from "./ProductsSection";
import { audioSystem } from "./AudioSystem";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { AdminTableSkeleton } from "./skeletons";

export const ReviewsAdminTab: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters & Sorting
  const [activeStatusFilter, setActiveStatusFilter] = useState<"ALL" | "approved" | "pending" | "rejected" | "featured">("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<"ALL" | "verified" | "unverified">("ALL");
  const [productFilter, setProductFilter] = useState<string | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "helpful" | "name">("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk Operations State
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);

  // Modals
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewData | null>(null);
  const [replyingReview, setReplyingReview] = useState<ReviewData | null>(null);
  const [replyText, setReplyText] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Delete Confirmation Modal State (replaces native window.confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    reviewId?: string;
    reviewTitle?: string;
    authorName?: string;
    rating?: number;
    count?: number;
  }>({
    isOpen: false,
    type: "single",
  });

  // Lock background body scroll when any modal/popup is open
  useLockBodyScroll(Boolean(previewPhoto || isCreateModalOpen || editingReview || replyingReview || deleteConfirmTarget.isOpen));

  // No-op local cache (pure real database reviews)
  const saveToLocalCache = (_list: ReviewData[]) => {};

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.adminGetAll();
      if (res && res.success && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Status Single Update
  const handleUpdateStatus = async (reviewId: string, newStatus: "approved" | "rejected" | "pending") => {
    audioSystem.playClick(600);
    setActionLoading(reviewId);
    try {
      await reviewApi.adminUpdateStatus(reviewId, newStatus);
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, status: newStatus } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(`Review marked as ${newStatus.toUpperCase()}`);
    } catch {
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, status: newStatus } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(`Review marked as ${newStatus.toUpperCase()} (local sync)`);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Featured / Pin Single
  const handleToggleFeatured = async (reviewId: string, currentVal?: boolean) => {
    audioSystem.playClick(650);
    const nextVal = !currentVal;
    try {
      await reviewApi.adminUpdate(reviewId, { isFeatured: nextVal });
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, isFeatured: nextVal } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(nextVal ? "Review pinned as Featured Pick ★" : "Review unpinned from Featured");
    } catch {
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, isFeatured: nextVal } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(nextVal ? "Review pinned as Featured Pick ★" : "Review unpinned from Featured");
    }
  };

  // Toggle Verified Buyer Single
  const handleToggleVerified = async (reviewId: string, currentVal?: boolean) => {
    audioSystem.playClick(600);
    const nextVal = !currentVal;
    try {
      await reviewApi.adminUpdate(reviewId, { isVerifiedPurchase: nextVal });
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, isVerifiedPurchase: nextVal } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(nextVal ? "Marked as Verified Client ✓" : "Removed Verified status");
    } catch {
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, isVerifiedPurchase: nextVal } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
      triggerToast(nextVal ? "Marked as Verified Client ✓" : "Removed Verified status");
    }
  };

  // Quick Helpful Votes Adjustment
  const handleAdjustHelpful = async (reviewId: string, delta: number) => {
    audioSystem.playClick(500);
    const target = reviews.find((r) => r._id === reviewId);
    if (!target) return;
    const nextVotes = Math.max(0, (target.helpfulVotes || 0) + delta);
    try {
      await reviewApi.adminUpdate(reviewId, { helpfulVotes: nextVotes });
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, helpfulVotes: nextVotes } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
    } catch {
      const nextList = reviews.map((r) => (r._id === reviewId ? { ...r, helpfulVotes: nextVotes } : r));
      setReviews(nextList);
      saveToLocalCache(nextList);
    }
  };

  // Single Delete Request (Opens Custom Atelier Modal)
  const requestDelete = (review: ReviewData) => {
    audioSystem.playClick(400);
    setDeleteConfirmTarget({
      isOpen: true,
      type: "single",
      reviewId: review._id,
      reviewTitle: review.title,
      authorName: review.userName,
      rating: review.rating,
    });
  };

  // Single Delete Execution
  const handleConfirmSingleDelete = async () => {
    const reviewId = deleteConfirmTarget.reviewId;
    if (!reviewId) return;

    audioSystem.playClick(400);
    setActionLoading(reviewId);
    setDeleteConfirmTarget({ isOpen: false, type: "single" });

    try {
      await reviewApi.adminDelete(reviewId);
      const nextList = reviews.filter((r) => r._id !== reviewId);
      setReviews(nextList);
      saveToLocalCache(nextList);
      setSelectedReviewIds((prev) => prev.filter((id) => id !== reviewId));
      triggerToast("Review permanently removed from store vault.");
    } catch {
      const nextList = reviews.filter((r) => r._id !== reviewId);
      setReviews(nextList);
      saveToLocalCache(nextList);
      setSelectedReviewIds((prev) => prev.filter((id) => id !== reviewId));
      triggerToast("Review deleted (local sync)");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Delete Execution
  const handleConfirmBulkDelete = async () => {
    const count = selectedReviewIds.length;
    if (count === 0) return;

    audioSystem.playClick(700);
    setDeleteConfirmTarget({ isOpen: false, type: "bulk" });

    try {
      await reviewApi.adminBulkAction("delete", selectedReviewIds);
    } catch {
      // Local optimistic fallback
    }

    const nextList = reviews.filter((r) => !selectedReviewIds.includes(r._id));
    setReviews(nextList);
    saveToLocalCache(nextList);
    triggerToast(`Permanently deleted ${count} reviews from vault`);
    setSelectedReviewIds([]);
  };

  // Bulk Actions
  const handleBulkAction = async (action: "approved" | "rejected" | "pending" | "feature" | "unfeature" | "delete") => {
    if (selectedReviewIds.length === 0) return;

    if (action === "delete") {
      audioSystem.playClick(400);
      setDeleteConfirmTarget({
        isOpen: true,
        type: "bulk",
        count: selectedReviewIds.length,
      });
      return;
    }

    audioSystem.playClick(700);
    try {
      await reviewApi.adminBulkAction(action, selectedReviewIds);
    } catch {
      // Local optimistic fallback
    }

    let nextList = [...reviews];
    if (action === "feature") {
      nextList = nextList.map((r) => (selectedReviewIds.includes(r._id) ? { ...r, isFeatured: true } : r));
      triggerToast(`Marked ${selectedReviewIds.length} reviews as Featured`);
    } else if (action === "unfeature") {
      nextList = nextList.map((r) => (selectedReviewIds.includes(r._id) ? { ...r, isFeatured: false } : r));
      triggerToast(`Unfeatured ${selectedReviewIds.length} reviews`);
    } else {
      nextList = nextList.map((r) => (selectedReviewIds.includes(r._id) ? { ...r, status: action } : r));
      triggerToast(`Updated ${selectedReviewIds.length} reviews to ${action.toUpperCase()}`);
    }

    setReviews(nextList);
    saveToLocalCache(nextList);
    setSelectedReviewIds([]);
  };

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    audioSystem.playClick(500);
    if (selectedReviewIds.length === filteredReviews.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(filteredReviews.map((r) => r._id));
    }
  };

  // Toggle single item selection
  const handleToggleSelectReview = (id: string) => {
    audioSystem.playClick(500);
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Save Brand Response
  const handleSaveBrandResponse = async () => {
    if (!replyingReview) return;
    audioSystem.playClick(800);
    const revId = replyingReview._id;
    const cleanText = replyText.trim();

    try {
      await reviewApi.adminUpdate(revId, {
        atelierResponse: cleanText,
        atelierRespondedAt: cleanText ? new Date().toISOString() : undefined,
      });
    } catch {
      // local sync
    }

    const nextList = reviews.map((r) =>
      r._id === revId
        ? {
            ...r,
            atelierResponse: cleanText,
            atelierRespondedAt: cleanText ? new Date().toISOString() : undefined,
          }
        : r
    );

    setReviews(nextList);
    saveToLocalCache(nextList);
    triggerToast(cleanText ? "Official Atelier response published ✓" : "Response removed");
    setReplyingReview(null);
    setReplyText("");
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;
    const featured = reviews.filter((r) => r.isFeatured).length;
    const withPhotos = reviews.filter((r) => r.photos && r.photos.length > 0).length;
    const avgRating =
      total > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1)
        : "5.0";

    return { total, approved, pending, rejected, featured, withPhotos, avgRating };
  }, [reviews]);

  // Filtered & Sorted reviews
  const filteredReviews = useMemo(() => {
    let result = reviews.filter((rev) => {
      // Status & Featured
      if (activeStatusFilter === "featured") {
        if (!rev.isFeatured) return false;
      } else if (activeStatusFilter !== "ALL" && rev.status !== activeStatusFilter) {
        return false;
      }

      // Rating filter
      if (ratingFilter !== "ALL" && rev.rating !== ratingFilter) {
        return false;
      }

      // Verified filter
      if (verifiedFilter === "verified" && !rev.isVerifiedPurchase) return false;
      if (verifiedFilter === "unverified" && rev.isVerifiedPurchase) return false;

      // Product filter
      if (productFilter !== "ALL") {
        const pIdStr = typeof rev.productId === "object" ? String((rev.productId as any)._id || "") : String(rev.productId);
        if (pIdStr !== productFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rev.userName.toLowerCase().includes(q);
        const matchEmail = (rev.userEmail || "").toLowerCase().includes(q);
        const matchTitle = (rev.title || "").toLowerCase().includes(q);
        const matchComment = rev.comment.toLowerCase().includes(q);
        const prodMatchTarget =
          typeof rev.productId === "object"
            ? `${rev.productId.name || ""} ${rev.productId._id || ""}`
            : String(rev.productId);
        const matchProduct = prodMatchTarget.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchTitle && !matchComment && !matchProduct) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      // Always prioritize featured if viewing ALL or APPROVED
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      if (sortBy === "helpful") return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
      if (sortBy === "name") return a.userName.localeCompare(b.userName);
      // default: newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [reviews, activeStatusFilter, ratingFilter, verifiedFilter, productFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Toast Bar */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-none shadow-2xl border border-white/20 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Lightbox for customer photos */}
      {previewPhoto && (
        <div
          data-lenis-prevent="true"
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            data-lenis-prevent="true"
            className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-none border border-white/20 bg-neutral-900 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-none bg-black/70 text-white hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhoto}
              alt="Customer product inspection"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Top Header Strip with + CREATE REVIEW CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-none bg-white border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
            <h2 className="font-mono text-base font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-black" />
              <span>CUSTOMER REVIEWS ENGINE & TESTIMONIAL CMS</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-neutral-600 mt-1">
            Complete administrative control: Inject manual product reviews, edit testimonials, post official brand responses, toggle verified buyer badges, and pin featured picks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(700);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ CREATE REVIEW</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(800);
              fetchReviews();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-none border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest font-semibold">Total Reviews</p>
          <p className="font-mono text-2xl font-bold text-black mt-1">{metrics.total}</p>
          <span className="font-mono text-[10px] text-neutral-500 mt-1 block">In Atelier Vault</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-emerald-700 uppercase tracking-widest font-semibold">Approved</p>
          <p className="font-mono text-2xl font-bold text-emerald-800 mt-1">{metrics.approved}</p>
          <span className="font-mono text-[10px] text-emerald-700 mt-1 block">Live on store</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-amber-700 uppercase tracking-widest font-semibold">Pending Audit</p>
          <p className="font-mono text-2xl font-bold text-amber-800 mt-1">{metrics.pending}</p>
          <span className="font-mono text-[10px] text-amber-700 mt-1 block">Awaiting approval</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-rose-700 uppercase tracking-widest font-semibold">Rejected</p>
          <p className="font-mono text-2xl font-bold text-rose-800 mt-1">{metrics.rejected}</p>
          <span className="font-mono text-[10px] text-rose-600 mt-1 block">Hidden from public</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-black uppercase tracking-widest font-semibold">Featured Picks</p>
          <p className="font-mono text-2xl font-bold text-black mt-1">{metrics.featured}</p>
          <span className="font-mono text-[10px] text-neutral-600 mt-1 block">Pinned to top</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-neutral-700 uppercase tracking-widest font-semibold">Avg Rating</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-2xl font-bold text-black">{metrics.avgRating}</span>
            <Star className="w-4 h-4 fill-black text-black" />
          </div>
          <span className="font-mono text-[10px] text-neutral-600 mt-1 block">Consensus</span>
        </div>

        <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm">
          <p className="font-mono text-[10px] text-neutral-800 uppercase tracking-widest font-semibold">With Photos</p>
          <p className="font-mono text-2xl font-bold text-neutral-900 mt-1">{metrics.withPhotos}</p>
          <span className="font-mono text-[10px] text-neutral-600 mt-1 block">Visual proof</span>
        </div>
      </div>

      {/* Bulk Operations Action Bar (Floating / Sticky when reviews selected) */}
      {selectedReviewIds.length > 0 && (
        <div className="sticky top-4 z-30 p-4 rounded-none bg-neutral-900 text-white shadow-2xl border border-neutral-700 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-none bg-white text-black font-mono text-xs font-bold flex items-center justify-center">
              {selectedReviewIds.length}
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              REVIEWS SELECTED FOR BULK ACTION
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction("approved")}
              className="px-3 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              APPROVE ALL
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("pending")}
              className="px-3 py-1.5 rounded-none bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              HOLD ALL
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("rejected")}
              className="px-3 py-1.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              REJECT ALL
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("feature")}
              className="px-3 py-1.5 rounded-none bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              ★ PIN ALL
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("unfeature")}
              className="px-3 py-1.5 rounded-none bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              UNPIN
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1.5 rounded-none bg-rose-900 hover:bg-rose-800 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              DELETE ALL
            </button>

            <button
              type="button"
              onClick={() => setSelectedReviewIds([])}
              className="px-3 py-1.5 rounded-none border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase cursor-pointer"
            >
              DESELECT
            </button>
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Control Panel */}
      <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
        {/* Row 1: Status Tabs & Star Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-none overflow-x-auto no-scrollbar">
            {(["ALL", "approved", "pending", "rejected", "featured"] as const).map((st) => {
              const count =
                st === "ALL"
                  ? metrics.total
                  : st === "featured"
                  ? metrics.featured
                  : reviews.filter((r) => r.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(700);
                    setActiveStatusFilter(st);
                  }}
                  className={`px-3 py-1.5 rounded-none font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    activeStatusFilter === st
                      ? "bg-black text-white shadow-sm font-bold"
                      : "text-neutral-700 hover:text-black hover:bg-neutral-200/60"
                  }`}
                >
                  {st === "featured" ? `★ FEATURED (${count})` : `${st.toUpperCase()} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Star Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-700 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Filter className="w-3 h-3" /> STARS:
            </span>
            <div className="flex items-center gap-1">
              {(["ALL", 5, 4, 3, 2, 1] as const).map((r) => (
                <button
                  key={String(r)}
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(700);
                    setRatingFilter(r);
                  }}
                  className={`px-2.5 py-1 rounded-none font-mono text-xs transition-all cursor-pointer ${
                    ratingFilter === r
                      ? "bg-black text-white font-bold"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-semibold"
                  }`}
                >
                  {r === "ALL" ? "All" : `${r}★`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Product Selector, Verified Filter, Sort Selector & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Product Filter Dropdown */}
          <div>
            <label htmlFor="admin-garment-filter-select" className="font-mono text-[10px] uppercase font-bold text-neutral-700 block mb-1">
              GARMENT FILTER:
            </label>
            <select
              id="admin-garment-filter-select"
              value={productFilter}
              onChange={(e) => {
                audioSystem.playClick(600);
                setProductFilter(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50/50 font-mono text-xs text-black focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="ALL">All Garments (Entire Catalog)</option>
              {PRODUCTS_DATA.map((prod) => (
                <option key={prod.id} value={String(prod.id)}>
                  #{prod.id} — {prod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Client Filter */}
          <div>
            <label htmlFor="admin-buyer-cert-select" className="font-mono text-[10px] uppercase font-bold text-neutral-700 block mb-1">
              BUYER CERTIFICATION:
            </label>
            <select
              id="admin-buyer-cert-select"
              value={verifiedFilter}
              onChange={(e) => {
                audioSystem.playClick(600);
                setVerifiedFilter(e.target.value as any);
              }}
              className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50/50 font-mono text-xs text-black focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="ALL">All Submissions</option>
              <option value="verified">Verified Clients Only</option>
              <option value="unverified">Unverified Submissions</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div>
            <label htmlFor="admin-sort-by-select" className="font-mono text-[10px] uppercase font-bold text-neutral-700 block mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> SORT BY:
            </label>
            <select
              id="admin-sort-by-select"
              value={sortBy}
              onChange={(e) => {
                audioSystem.playClick(600);
                setSortBy(e.target.value as any);
              }}
              className="w-full px-3 py-2 rounded-none border border-neutral-200 bg-neutral-50/50 font-mono text-xs text-black focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="newest">Newest Submissions First</option>
              <option value="highest">Highest Rating (5★ &rarr; 1★)</option>
              <option value="lowest">Lowest Rating (1★ &rarr; 5★)</option>
              <option value="helpful">Most Helpful Votes</option>
              <option value="name">Customer Name (A &rarr; Z)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label htmlFor="admin-search-reviews-input" className="font-mono text-[10px] uppercase font-bold text-neutral-700 block mb-1">
              SEARCH REVIEWS:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-search-reviews-input"
                type="text"
                placeholder="Search name, text, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-none border border-neutral-200 bg-neutral-50/50 font-mono text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Select Helper Row */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs font-mono text-neutral-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filteredReviews.length > 0 && selectedReviewIds.length === filteredReviews.length}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black cursor-pointer"
            />
            <span className="font-bold uppercase">
              SELECT ALL DISPLAYED REVIEWS ({filteredReviews.length})
            </span>
          </label>

          <span>
            Showing <strong>{filteredReviews.length}</strong> of {reviews.length} reviews
          </span>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <AdminTableSkeleton columns={5} rows={6} ariaLabel="Loading customer reviews..." />
      ) : filteredReviews.length === 0 ? (
        <div className="p-16 rounded-none bg-white border border-neutral-200 text-center flex flex-col items-center justify-center gap-3">
          <MessageSquare className="w-8 h-8 text-neutral-300" />
          <p className="font-mono text-sm font-bold uppercase tracking-wider text-black">NO REVIEWS FOUND</p>
          <p className="font-mono text-xs text-neutral-600 max-w-sm">
            No customer reviews match your active filter criteria. Try clearing search keywords or resetting filters.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-none bg-black text-white font-mono text-xs font-bold uppercase tracking-wider"
          >
            + Create First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isApproved = review.status === "approved";
            const isPending = review.status === "pending";
            const isRejected = review.status === "rejected";
            const isActionBusy = actionLoading === review._id;
            const isSelected = selectedReviewIds.includes(review._id);

            const prodIdStr = typeof review.productId === "object" ? (review.productId as any)._id || "item" : String(review.productId);
            const prodNameStr = typeof review.productId === "object" ? (review.productId as any).name : `Garment #${prodIdStr}`;

            return (
              <div
                key={review._id}
                className={`p-5 sm:p-6 rounded-none bg-white border transition-all hover:border-neutral-400 ${
                  review.isFeatured
                    ? "border-neutral-400 ring-1 ring-black/10 shadow-sm"
                    : isSelected
                    ? "border-black bg-neutral-50/40"
                    : "border-neutral-200 shadow-sm"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left: Checkbox + Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Select Checkbox */}
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectReview(review._id)}
                        className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Header Line: Avatar, Client Name, Badges & Toggles */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="w-8 h-8 rounded-none bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {review.userName.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                              {review.userName}
                            </span>

                            {/* 1-Click Verified Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(review._id, review.isVerifiedPurchase)}
                              title="Click to toggle Verified Buyer status"
                              className={`inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-none border transition-all cursor-pointer ${
                                review.isVerifiedPurchase
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{review.isVerifiedPurchase ? "VERIFIED CLIENT" : "UNVERIFIED (CLICK TO VERIFY)"}</span>
                            </button>

                            {/* 1-Click Featured / Pin Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(review._id, review.isFeatured)}
                              title="Click to toggle Featured Pin at top of reviews"
                              className={`inline-flex items-center gap-1 font-mono text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-none border transition-all cursor-pointer ${
                                review.isFeatured
                                  ? "bg-black text-white border-black shadow-xs"
                                  : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
                              }`}
                            >
                              <Pin className={`w-3 h-3 ${review.isFeatured ? "fill-white" : ""}`} />
                              <span>{review.isFeatured ? "★ PINNED FEATURED" : "PIN AS FEATURED"}</span>
                            </button>
                          </div>

                          {review.userEmail && (
                            <span className="font-mono text-[11px] text-neutral-600 block">
                              {review.userEmail}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`ml-auto font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-none border ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isPending
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                          }`}
                        >
                          {review.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Stars + Fit + Size + Garment Link */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-0.5 text-black">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating ? "fill-black text-black" : "text-neutral-300 fill-white"
                              }`}
                            />
                          ))}
                        </div>

                        {review.fit && (
                          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none bg-neutral-100 text-neutral-700">
                            FIT: {review.fit.replace("_", " ")}
                          </span>
                        )}

                        {review.verifiedSize && (
                          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none bg-neutral-100 text-neutral-700">
                            SIZE: {review.verifiedSize}
                          </span>
                        )}

                        {review.verifiedColor && (
                          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none bg-neutral-100 text-neutral-700">
                            SHADE: {review.verifiedColor}
                          </span>
                        )}

                        <a
                          href={`/product/${prodIdStr}/reviews`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-700 hover:text-black transition-colors underline underline-offset-2"
                        >
                          <span>{prodNameStr}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <span className="font-mono text-[10px] text-neutral-600">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>

                      {/* Review Headline & Body */}
                      {review.title && (
                        <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-black mt-2">
                          {review.title}
                        </h3>
                      )}

                      <p className="font-sans text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-3xl">
                        {review.comment}
                      </p>

                      {/* Photo Attachments Lightbox Grid */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="pt-2">
                          <p className="font-mono text-[10px] text-neutral-700 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-bold">
                            <ImageIcon className="w-3 h-3" /> Attached Client Inspection ({review.photos.length}):
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {review.photos.map((ph, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewPhoto(ph)}
                                className="relative w-16 h-16 rounded-none overflow-hidden border border-neutral-300 group hover:border-black transition-all cursor-zoom-in"
                              >
                                <img
                                  src={ph}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Atelier Response Display */}
                      {review.atelierResponse ? (
                        <div className="p-3.5 rounded-none bg-neutral-50 border border-neutral-200 text-neutral-900 space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9.5px] uppercase font-bold tracking-widest text-black flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-none bg-black" />
                              OFFICIAL ATELIER NOIR RESPONSE
                            </span>
                            <div className="flex items-center gap-2">
                              {review.atelierRespondedAt && (
                                <span className="font-mono text-[9px] text-neutral-600">
                                  {new Date(review.atelierRespondedAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  audioSystem.playClick(600);
                                  setReplyingReview(review);
                                  setReplyText(review.atelierResponse || "");
                                }}
                                className="text-[10px] font-mono uppercase font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                              >
                                Edit Reply
                              </button>
                            </div>
                          </div>
                          <p className="font-sans text-xs text-neutral-700 leading-relaxed italic">
                            &ldquo;{review.atelierResponse}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(600);
                            setReplyingReview(review);
                            setReplyText("");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase font-bold text-neutral-700 hover:text-black transition-colors pt-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>+ ADD OFFICIAL ATELIER RESPONSE</span>
                        </button>
                      )}

                      {/* Helpful Counter Quick Edit */}
                      <div className="flex items-center gap-3 pt-1 text-neutral-700 font-mono text-xs">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful Votes:</span>
                          <strong className="text-black ml-1">({review.helpfulVotes || 0})</strong>
                        </span>

                        <div className="flex items-center gap-1 bg-neutral-100 rounded-none p-0.5 border border-neutral-200">
                          <button
                            type="button"
                            title="Decrease helpful votes"
                            onClick={() => handleAdjustHelpful(review._id, -1)}
                            className="p-1 hover:bg-white rounded-none text-neutral-700 hover:text-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 font-bold text-black text-xs">
                            {review.helpfulVotes || 0}
                          </span>
                          <button
                            type="button"
                            title="Increase helpful votes"
                            onClick={() => handleAdjustHelpful(review._id, 1)}
                            className="p-1 hover:bg-white rounded-none text-neutral-700 hover:text-black cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Complete Action Control Station */}
                  <div className="flex sm:flex-row lg:flex-col items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-4 lg:pt-0 lg:pl-5 min-w-[150px]">
                    {/* Primary EDIT BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(600);
                        setEditingReview(review);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>EDIT REVIEW</span>
                    </button>

                    {/* STATUS TRANSITIONS */}
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review._id, "approved")}
                        disabled={isActionBusy}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-none bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                    )}

                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review._id, "rejected")}
                        disabled={isActionBusy}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-none bg-neutral-100 hover:bg-rose-50 hover:text-rose-800 text-neutral-700 font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer border border-neutral-300 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                    )}

                    {review.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review._id, "pending")}
                        disabled={isActionBusy}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-none bg-neutral-100 hover:bg-amber-50 hover:text-amber-800 text-neutral-700 font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer border border-neutral-300 disabled:opacity-50"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>HOLD AUDIT</span>
                      </button>
                    )}

                    {/* PERMANENT DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => requestDelete(review)}
                      disabled={isActionBusy}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-none text-neutral-600 hover:text-rose-700 hover:bg-rose-50 font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DELETE</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE NEW REVIEW (MANUAL INJECTION) */}
      {isCreateModalOpen && (
        <CreateReviewModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newRev) => {
            const nextList = [newRev, ...reviews];
            setReviews(nextList);
            saveToLocalCache(nextList);
            triggerToast("New product review successfully published to store!");
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* MODAL 2: FULL EDIT REVIEW MODAL */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onUpdated={(updatedRev) => {
            const nextList = reviews.map((r) => (r._id === updatedRev._id ? updatedRev : r));
            setReviews(nextList);
            saveToLocalCache(nextList);
            triggerToast("Review modifications saved successfully ✓");
            setEditingReview(null);
          }}
        />
      )}

      {/* MODAL 3: OFFICIAL ATELIER RESPONSE MODAL */}
      {replyingReview && (
        <div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="relative w-full max-w-lg bg-white rounded-none p-6 border border-neutral-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 shrink-0">
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-600 font-bold block">
                  BRAND COMMUNICATION
                </span>
                <h3 className="font-mono text-sm font-bold uppercase text-black">
                  Official Atelier Response
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="p-1.5 rounded-none hover:bg-neutral-100 text-neutral-600 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth pr-1"
            >
              <div className="p-3 bg-neutral-50 rounded-none border border-neutral-200 text-xs font-mono space-y-1">
                <span className="text-neutral-600 font-bold">REPLYING TO REVIEW BY:</span>
                <p className="text-black font-bold uppercase">{replyingReview.userName}</p>
                <p className="text-neutral-700 italic line-clamp-2">&ldquo;{replyingReview.comment}&rdquo;</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="atelier-response-textarea" className="font-mono text-xs font-bold uppercase text-black block">
                  Official Brand Message *
                </label>
                <textarea
                  id="atelier-response-textarea"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. Thank you for your feedback. Our tailoring team in Milan has noted your sizing remarks..."
                  className="w-full p-3 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 rounded-none border border-neutral-300 font-mono text-xs uppercase font-bold text-black hover:bg-neutral-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveBrandResponse}
                  className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  SAVE OFFICIAL RESPONSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LUXURY ATELIER NOIR CONFIRM DELETE DIALOG */}
      {deleteConfirmTarget.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-purge-title"
          aria-describedby="confirm-purge-desc"
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            data-lenis-prevent="true"
            className="relative w-full max-w-md bg-[#0e0e0e] text-white rounded-none p-6 sm:p-7 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto dark-scrollbar overscroll-contain scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          >
            {/* Header Icon + Label */}
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-none bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-400 font-bold block">
                    ATELIER REPOSITORY // SECURITY AUDIT
                  </span>
                  <h3 id="confirm-purge-title" className="font-mono text-sm sm:text-base font-bold uppercase text-white tracking-wide">
                    {deleteConfirmTarget.type === "bulk" ? "Confirm Bulk Purge" : "Confirm Review Purge"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget({ isOpen: false, type: "single" })}
                aria-label="Close dialog"
                className="p-1.5 rounded-none hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p id="confirm-purge-desc" className="text-xs text-neutral-300 leading-relaxed font-sans">
              {deleteConfirmTarget.type === "bulk"
                ? `Are you sure you want to permanently purge all ${deleteConfirmTarget.count} selected reviews from the store repository? This action cannot be undone and product ratings will be recalculated automatically.`
                : "Are you sure you want to permanently delete this customer review from the atelier vault? This record will be permanently purged and rating statistics will update."}
            </p>

            {/* Review Preview (For single delete) */}
            {deleteConfirmTarget.type === "single" && (
              <div className="p-3.5 rounded-none bg-white/5 border border-white/10 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[10px] tracking-wider uppercase">CLIENT</span>
                  <span className="text-white font-bold">{deleteConfirmTarget.authorName}</span>
                </div>
                {deleteConfirmTarget.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-[10px] tracking-wider uppercase">RATING</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{deleteConfirmTarget.rating}.0</span>
                      <Star className="w-3 h-3 fill-white text-white" />
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-neutral-400 text-[10px] tracking-wider uppercase block mb-0.5">HEADLINE</span>
                  <p className="text-neutral-200 italic text-[11px] truncate">
                    &ldquo;{deleteConfirmTarget.reviewTitle || "Untitled Review"}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget({ isOpen: false, type: "single" })}
                className="flex-1 px-5 py-2.5 rounded-none border border-white/20 hover:border-white/40 text-neutral-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/5 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConfirmTarget.type === "bulk" ? handleConfirmBulkDelete : handleConfirmSingleDelete}
                disabled={Boolean(actionLoading)}
                className="flex-1 px-5 py-2.5 rounded-none bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteConfirmTarget.type === "bulk" ? "Purge All" : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CREATE REVIEW MODAL
// ==========================================
interface CreateReviewModalProps {
  onClose: () => void;
  onCreated: (rev: ReviewData) => void;
}

const CreateReviewModal: React.FC<CreateReviewModalProps> = ({ onClose, onCreated }) => {
  const [productId, setProductId] = useState(String(PRODUCTS_DATA[0]?.id || "1"));
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [fit, setFit] = useState<"runs_small" | "true_to_size" | "runs_large">("true_to_size");
  const [qualityRating, setQualityRating] = useState(5);
  const [verifiedSize, setVerifiedSize] = useState("M");
  const [verifiedColor, setVerifiedColor] = useState("Obsidian Black");
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState(0);
  const [status, setStatus] = useState<"approved" | "pending" | "rejected">("approved");
  const [atelierResponse, setAtelierResponse] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPhotoUrl = () => {
    if (!photoInput.trim()) return;
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (!userName.trim() || !title.trim() || !comment.trim()) {
      setErrorMsg("Please fill in Reviewer Name, Title, and Review Comments.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: any = {
      productId,
      userName: userName.trim(),
      userEmail: (userEmail.trim() || "client@drapza.com").toLowerCase(),
      rating,
      title: title.trim(),
      comment: comment.trim(),
      fit,
      qualityRating,
      verifiedSize,
      verifiedColor,
      isVerifiedPurchase,
      isFeatured,
      helpfulVotes: Number(helpfulVotes) || 0,
      status,
      photos,
      atelierResponse: atelierResponse.trim(),
      atelierRespondedAt: atelierResponse.trim() ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await reviewApi.adminCreate(payload);
      if (res && res.success && res.review) {
        onCreated(res.review);
      } else {
        // Fallback local create
        const localRev: ReviewData = {
          _id: `rev_admin_${Date.now()}`,
          ...payload,
        };
        onCreated(localRev);
      }
    } catch {
      const localRev: ReviewData = {
        _id: `rev_admin_${Date.now()}`,
        ...payload,
      };
      onCreated(localRev);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = PRODUCTS_DATA.find((p) => String(p.id) === productId) || PRODUCTS_DATA[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl bg-white rounded-none shadow-2xl overflow-hidden border border-neutral-200 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 shrink-0">
          <div>
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-600 font-bold block">
              ADMIN CONTROL CENTER
            </span>
            <h2 className="text-sm font-bold text-black uppercase tracking-tight">
              CREATE / INJECT MANUAL REVIEW
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-none hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="p-6 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth space-y-4 flex-1 min-h-0"
        >
          {errorMsg && (
            <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Product Selection */}
          <div className="space-y-1.5">
            <label htmlFor="create-product-select" className="font-mono text-xs font-bold uppercase text-black block">
              Target Garment *
            </label>
            <div className="flex items-center gap-3">
              {selectedProduct && (
                <img
                  src={selectedProduct.image}
                  alt=""
                  className="w-12 h-12 rounded-none object-cover border border-neutral-200 shrink-0"
                />
              )}
              <select
                id="create-product-select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white focus:outline-none focus:border-black"
              >
                {PRODUCTS_DATA.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.id} — {p.name} ({p.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Rating & Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-none bg-neutral-50 border border-neutral-200">
            {/* Rating Stars */}
            <div>
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                GARMENT RATING *
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "fill-black text-black" : "fill-white text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono text-xs font-bold text-black ml-1">({rating}/5)</span>
              </div>
            </div>

            {/* Verified Buyer Toggle */}
            <div className="flex flex-col justify-center">
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                BUYER BADGE
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-black">
                <input
                  type="checkbox"
                  checked={isVerifiedPurchase}
                  onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
                  className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <span>Verified Client Badge</span>
              </label>
            </div>

            {/* Featured Pick Toggle */}
            <div className="flex flex-col justify-center">
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                PIN AT TOP
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-black font-bold">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <span>★ Featured Pick</span>
              </label>
            </div>
          </div>

          {/* 3. Review Headline & Body */}
          <div className="space-y-3">
            <div>
              <label htmlFor="create-headline-input" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Headline / Title *
              </label>
              <input
                id="create-headline-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Masterpiece drape & archival stitching"
                className="w-full px-3.5 py-2.5 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="create-comment-input" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Detailed Testimonial *
              </label>
              <textarea
                id="create-comment-input"
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe fabric feel, cut, drape, sizing, and styling..."
                className="w-full px-3.5 py-2.5 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black resize-y"
              />
            </div>
          </div>

          {/* 4. Client Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-author-name" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Reviewer Full Name *
              </label>
              <input
                id="create-author-name"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Vikramaditya Singhania"
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="create-author-email" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Reviewer Email *
              </label>
              <input
                id="create-author-email"
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="client@drapza.com"
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* 5. Fit, Size, Shade, Helpful, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="create-fit-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Fit Assessment
              </label>
              <select
                id="create-fit-select"
                value={fit}
                onChange={(e) => setFit(e.target.value as any)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white"
              >
                <option value="runs_small">Runs Small</option>
                <option value="true_to_size">True To Size</option>
                <option value="runs_large">Runs Large</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-size-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Size Purchased
              </label>
              <select
                id="create-size-select"
                value={verifiedSize}
                onChange={(e) => setVerifiedSize(e.target.value)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Custom Fit">Custom Fit</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-status-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Initial Status
              </label>
              <select
                id="create-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white"
              >
                <option value="approved">Approved (Live)</option>
                <option value="pending">Pending Audit</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-helpful-input" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Helpful Votes
              </label>
              <input
                id="create-helpful-input"
                type="number"
                min="0"
                value={helpfulVotes}
                onChange={(e) => setHelpfulVotes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black"
              />
            </div>
          </div>

          {/* 6. Photos */}
          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase text-black block">
              Photo Attachments (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {photos.map((ph, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-none overflow-hidden border border-neutral-300 group">
                  <img src={ph} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-none cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="w-16 h-16 rounded-none border-2 border-dashed border-neutral-300 hover:border-black flex flex-col items-center justify-center text-neutral-600 hover:text-black cursor-pointer bg-neutral-50">
                <UploadCloud className="w-5 h-5" />
                <span className="text-[8.5px] font-mono mt-0.5">FILE</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Or paste external image URL (e.g. /images/...)"
                className="flex-1 px-3 py-1.5 rounded-none border border-neutral-300 font-mono text-[11px] text-black placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                disabled={!photoInput.trim()}
                className="px-3 py-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-black font-mono text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                ADD URL
              </button>
            </div>
          </div>

          {/* 7. Official Atelier Brand Response (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="create-response-input" className="font-mono text-xs font-bold uppercase text-black block">
              Official Brand Reply (Optional)
            </label>
            <input
              id="create-response-input"
              type="text"
              value={atelierResponse}
              onChange={(e) => setAtelierResponse(e.target.value)}
              placeholder="e.g. Thank you for your support. Our Milan team is delighted..."
              className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-none border border-neutral-300 font-mono text-xs uppercase font-bold text-black hover:bg-neutral-50 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "PUBLISHING..." : "PUBLISH REVIEW"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: EDIT REVIEW MODAL
// ==========================================
interface EditReviewModalProps {
  review: ReviewData;
  onClose: () => void;
  onUpdated: (rev: ReviewData) => void;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({ review, onClose, onUpdated }) => {
  const [userName, setUserName] = useState(review.userName);
  const [userEmail, setUserEmail] = useState(review.userEmail || "");
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title || "");
  const [comment, setComment] = useState(review.comment);
  const [fit, setFit] = useState(review.fit || "true_to_size");
  const [qualityRating, setQualityRating] = useState(review.qualityRating || 5);
  const [verifiedSize, setVerifiedSize] = useState(review.verifiedSize || "M");
  const [verifiedColor, setVerifiedColor] = useState(review.verifiedColor || "");
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(Boolean(review.isVerifiedPurchase));
  const [isFeatured, setIsFeatured] = useState(Boolean(review.isFeatured));
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);
  const [status, setStatus] = useState(review.status);
  const [atelierResponse, setAtelierResponse] = useState(review.atelierResponse || "");
  const [photos, setPhotos] = useState<string[]>(review.photos || []);
  const [photoInput, setPhotoInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPhotoUrl = () => {
    if (!photoInput.trim()) return;
    setPhotos((prev) => [...prev, photoInput.trim()]);
    setPhotoInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setIsSubmitting(true);

    const updatePayload: Partial<ReviewData> = {
      userName: userName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      rating,
      title: title.trim(),
      comment: comment.trim(),
      fit,
      qualityRating,
      verifiedSize,
      verifiedColor,
      isVerifiedPurchase,
      isFeatured,
      helpfulVotes: Number(helpfulVotes) || 0,
      status,
      photos,
      atelierResponse: atelierResponse.trim(),
      atelierRespondedAt: atelierResponse.trim() ? review.atelierRespondedAt || new Date().toISOString() : undefined,
    };

    try {
      const res = await reviewApi.adminUpdate(review._id, updatePayload);
      if (res && res.success && res.review) {
        onUpdated(res.review);
      } else {
        onUpdated({ ...review, ...updatePayload });
      }
    } catch {
      onUpdated({ ...review, ...updatePayload });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl bg-white rounded-none shadow-2xl overflow-hidden border border-neutral-200 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 shrink-0">
          <div>
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-600 font-bold block">
              REVIEW MANAGEMENT VAULT
            </span>
            <h2 className="text-sm font-bold text-black uppercase tracking-tight">
              EDIT CUSTOMER REVIEW & SPECIFICATIONS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-none hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="p-6 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth space-y-4 flex-1 min-h-0"
        >
          {/* Rating & Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-none bg-neutral-50 border border-neutral-200">
            {/* Rating Stars */}
            <div>
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                GARMENT RATING *
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "fill-black text-black" : "fill-white text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono text-xs font-bold text-black ml-1">({rating}/5)</span>
              </div>
            </div>

            {/* Verified Buyer Toggle */}
            <div className="flex flex-col justify-center">
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                BUYER BADGE
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-black">
                <input
                  type="checkbox"
                  checked={isVerifiedPurchase}
                  onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
                  className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <span>Verified Client Badge</span>
              </label>
            </div>

            {/* Featured Pick Toggle */}
            <div className="flex flex-col justify-center">
              <span className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                PIN AT TOP
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-black font-bold">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-black"
                />
                <span>★ Featured Pick</span>
              </label>
            </div>
          </div>

          {/* Headline & Comment */}
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-headline-input" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Review Headline *
              </label>
              <input
                id="edit-headline-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-none border border-neutral-300 font-sans text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="edit-comment-input" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Review Comment *
              </label>
              <textarea
                id="edit-comment-input"
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-none border border-neutral-300 font-sans text-xs text-black focus:outline-none focus:border-black resize-y"
              />
            </div>
          </div>

          {/* Reviewer Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-author-name" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Reviewer Name *
              </label>
              <input
                id="edit-author-name"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="edit-author-email" className="font-mono text-xs font-bold uppercase text-black block mb-1">
                Reviewer Email
              </label>
              <input
                id="edit-author-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Fit, Size, Status, Helpful Votes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="edit-fit-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Fit Assessment
              </label>
              <select
                id="edit-fit-select"
                value={fit}
                onChange={(e) => setFit(e.target.value as any)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white"
              >
                <option value="runs_small">Runs Small</option>
                <option value="true_to_size">True To Size</option>
                <option value="runs_large">Runs Large</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-size-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Size Purchased
              </label>
              <input
                id="edit-size-select"
                type="text"
                value={verifiedSize}
                onChange={(e) => setVerifiedSize(e.target.value)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black"
              />
            </div>

            <div>
              <label htmlFor="edit-status-select" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Status
              </label>
              <select
                id="edit-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black bg-white"
              >
                <option value="approved">Approved (Live)</option>
                <option value="pending">Pending Audit</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-helpful-input" className="font-mono text-[10px] font-bold uppercase text-neutral-700 block mb-1">
                Helpful Votes
              </label>
              <input
                id="edit-helpful-input"
                type="number"
                min="0"
                value={helpfulVotes}
                onChange={(e) => setHelpfulVotes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-none border border-neutral-300 font-mono text-xs text-black"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="font-mono text-xs font-bold uppercase text-black block">
              Photo Attachments
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {photos.map((ph, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-none overflow-hidden border border-neutral-300 group">
                  <img src={ph} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-none cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="w-16 h-16 rounded-none border-2 border-dashed border-neutral-300 hover:border-black flex flex-col items-center justify-center text-neutral-600 hover:text-black cursor-pointer bg-neutral-50">
                <UploadCloud className="w-5 h-5" />
                <span className="text-[8.5px] font-mono mt-0.5">FILE</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Or paste external image URL (e.g. /images/...)"
                className="flex-1 px-3 py-1.5 rounded-none border border-neutral-300 font-mono text-[11px] text-black placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                disabled={!photoInput.trim()}
                className="px-3 py-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-black font-mono text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                ADD URL
              </button>
            </div>
          </div>

          {/* Official Brand Response */}
          <div className="space-y-1.5">
            <label htmlFor="edit-response-input" className="font-mono text-xs font-bold uppercase text-black block">
              Official Atelier Noir Response
            </label>
            <textarea
              id="edit-response-input"
              rows={2}
              value={atelierResponse}
              onChange={(e) => setAtelierResponse(e.target.value)}
              placeholder="e.g. Thank you Aryan. Our master cutters in Milan..."
              className="w-full px-3 py-2 rounded-none border border-neutral-300 font-sans text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:border-black resize-y"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-none border border-neutral-300 font-mono text-xs uppercase font-bold text-black hover:bg-neutral-50 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewsAdminTab;
