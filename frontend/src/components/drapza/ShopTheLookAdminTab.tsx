"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Camera,
  Plus,
  Trash2,
  RefreshCw,
  Heart,
  Tag,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { shopTheLookApi, ShopTheLookPost, productApi } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ConfirmModal } from "./ConfirmModal";

export function ShopTheLookAdminTab() {
  const [posts, setPosts] = useState<ShopTheLookPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [lookToDelete, setLookToDelete] = useState<string | null>(null);

  // Lock background body scroll when create look modal is open
  useLockBodyScroll(isCreateOpen);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("@drapza_community");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await shopTheLookApi.adminGetAll();
      if (res.success) {
        setPosts(res.posts || []);
      }
    } catch (err) {
      console.error("Failed to load Shop The Look posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductsList = useCallback(async () => {
    try {
      const res: any = await productApi.getAll({ limit: 100 });
      if (res.success && res.products) {
        setAllProducts(res.products);
      }
    } catch (err) {
      console.error("Failed to load products list:", err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchProductsList();
  }, [fetchPosts, fetchProductsList]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setActionMessage({ type: "error", text: "Please provide a valid image URL for the look." });
      return;
    }

    setSubmitting(true);
    setActionMessage(null);
    try {
      const taggedProducts = selectedProductId
        ? [
            {
              product: selectedProductId as any,
              positionX: 50,
              positionY: 50,
            },
          ]
        : [];

      const res = await shopTheLookApi.createPost({
        imageUrl: imageUrl.trim(),
        caption: caption.trim() || "Drapza Streetwear Silhouette",
        instagramHandle: instagramHandle.trim() || "@drapza",
        taggedProducts,
        isActive: true,
      });

      if (res.success) {
        setActionMessage({ type: "success", text: "Lookbook post published successfully to storefront." });
        setIsCreateOpen(false);
        setImageUrl("");
        setCaption("");
        setSelectedProductId("");
        fetchPosts();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to publish post." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to publish look." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = (id: string) => {
    setLookToDelete(id);
  };

  const handleExecuteDeletePost = async () => {
    if (!lookToDelete) return;
    const id = lookToDelete;
    setLookToDelete(null);
    try {
      const res = await shopTheLookApi.deletePost(id);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-neutral-900">
      {/* Alert Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-none flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 font-sans text-xs">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
            UGC CURATION & SOCIAL COMMERCE
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900">
            SHOP THE LOOK / INSTAGRAM FEED
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            className="p-2.5 rounded-none border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD COMMUNITY LOOK</span>
          </button>
        </div>
      </div>

      {/* Grid of Posts */}
      {isLoading ? (
        <div className="py-20 text-center text-neutral-400 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-500" />
          Loading Community Feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-neutral-200 rounded-none p-12 text-center bg-white">
          <Camera className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-mono-technical text-sm font-bold uppercase tracking-wider text-neutral-800">
            NO SOCIAL LOOKS PUBLISHED YET
          </h3>
          <p className="font-sans text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
            Curate customer photos from Instagram, tag garments, and drive direct frictionless checkouts from your social gallery.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-none cursor-pointer"
          >
            ADD FIRST COMMUNITY LOOK
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-none font-mono text-[10px] flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-white" />
                  <span>{post.instagramHandle}</span>
                </div>

                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="absolute top-3 right-3 p-2 rounded-none bg-white/90 hover:bg-rose-500 text-neutral-600 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                  title="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {post.taggedProducts?.length > 0 && (
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-none border border-neutral-200 font-mono text-[10px] flex items-center gap-1 text-neutral-800 shadow-sm">
                    <Tag className="w-3 h-3 text-black" />
                    <span>{post.taggedProducts.length} TAGGED GARMENT</span>
                  </div>
                )}
              </div>

              {/* Caption & Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="font-sans text-xs text-neutral-700 line-clamp-2">
                  {post.caption}
                </p>

                {post.taggedProducts?.[0]?.product && (
                  <div className="p-2.5 rounded-none bg-neutral-50 border border-neutral-200 flex items-center gap-2">
                    {post.taggedProducts[0].product.images?.[0] && (
                      <img
                        src={post.taggedProducts[0].product.images[0]}
                        alt=""
                        className="w-9 h-9 rounded-none object-cover border border-neutral-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-neutral-900 text-xs truncate block">
                        {post.taggedProducts[0].product.name}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-600 font-bold block">
                        ₹{post.taggedProducts[0].product.numericPrice || post.taggedProducts[0].product.price}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-neutral-400 font-mono text-[10px]">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{post.likesCount} saves</span>
                  </div>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE LOOK MODAL */}
      {isCreateOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            data-lenis-prevent="true"
            className="bg-white rounded-none max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-6 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-black" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-900">
                  ADD STREETWEAR LOOKBOOK SHOT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePost}
              data-lenis-prevent="true"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              className="p-6 pt-2 space-y-4 font-sans text-xs flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth"
            >
              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  IMAGE URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black font-mono text-xs"
                  placeholder="https://images.unsplash.com/... or Cloudinary URL"
                />
                {imageUrl && (
                  <div className="mt-2 w-20 h-24 rounded-none overflow-hidden border border-neutral-200">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  INSTAGRAM CREATOR HANDLE
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black font-mono text-xs"
                  placeholder="@fashion_enthusiast"
                />
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  TAGGED PRODUCT FROM WARDROBE (ONE-CLICK BUY)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-none border border-neutral-200 focus:outline-none focus:border-black text-xs bg-white"
                >
                  <option value="">Select a product to link...</option>
                  {allProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.numericPrice || p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono-technical text-[10px] uppercase text-neutral-600 block mb-1">
                  CAPTION / EDITORIAL COPY
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-neutral-200 focus:outline-none focus:border-black text-xs"
                  placeholder="e.g. Minimalist silhouette captured on Berlin concrete."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-none border border-neutral-200 font-mono-technical text-xs uppercase text-neutral-600 hover:bg-neutral-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "PUBLISHING..." : "PUBLISH LOOK"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Confirm Modal for Shop the Look deletion */}
      <ConfirmModal
        isOpen={Boolean(lookToDelete)}
        variant="danger"
        title="REMOVE LOOKBOOK POST"
        subtitle="[ EDITORIAL ARCHIVE ]"
        message="Are you sure you want to remove this look from the storefront archive? This action cannot be undone."
        confirmLabel="REMOVE LOOK"
        cancelLabel="KEEP LOOK"
        isDestructive={true}
        onConfirm={handleExecuteDeletePost}
        onCancel={() => setLookToDelete(null)}
      />
    </div>
  );
}
