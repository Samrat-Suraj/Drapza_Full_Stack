"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Tag, Heart, ArrowUpRight } from "lucide-react";
import { shopTheLookApi, ShopTheLookPost } from "@/lib/api";

export function ShopTheLookSection() {
  const [posts, setPosts] = useState<ShopTheLookPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await shopTheLookApi.getPosts();
        if (res.success && res.posts) {
          setPosts(res.posts);
        }
      } catch (err) {
        console.error("Failed to load Shop The Look feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  if (!loading && posts.length === 0) {
    return null; // Don't render section if no curated posts yet
  }

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-white relative overflow-hidden border-t border-neutral-800">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-200">
                COMMUNITY DRAPED ARCHIVE
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              SHOP THE LOOK // UGC
            </h2>
            <p className="font-sans text-sm text-neutral-200 max-w-xl mt-2">
              Captured in concrete environments worldwide. Tap any silhouette to acquire the exact modules worn by the community.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-200 uppercase tracking-wider">
              TAG @DRAPZA TO BE CURATED
            </span>
          </div>
        </div>

        {/* Looks Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[4/5] bg-neutral-900 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => {
              const primaryProduct = post.taggedProducts?.[0]?.product;
              return (
                <div
                  key={post._id}
                  className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col hover:border-neutral-700 transition-all duration-300"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Creator Tag */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-mono text-[10px] text-neutral-200 border border-white/10 flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-neutral-200" />
                      <span>{post.instagramHandle}</span>
                    </div>

                    {/* Likes / Saves */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full font-mono text-[10px] text-neutral-200 border border-white/10 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                      <span>{post.likesCount}</span>
                    </div>

                    {/* Hover Product Drawer */}
                    {primaryProduct && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <Link
                          href={`/wardrobe/${primaryProduct.slug || primaryProduct._id}`}
                          className="p-3 rounded-xl bg-white/95 text-black backdrop-blur-md flex items-center justify-between gap-3 shadow-xl hover:bg-white transition-all transform group-hover:translate-y-0 translate-y-1"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {primaryProduct.images?.[0] && (
                              <img
                                src={primaryProduct.images[0]}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="font-display text-xs font-bold uppercase truncate block text-black">
                                {primaryProduct.name}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-neutral-700">
                                ₹{primaryProduct.numericPrice || primaryProduct.price}
                              </span>
                            </div>
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div className="p-3.5 text-xs text-neutral-200 font-sans line-clamp-2">
                      {post.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

