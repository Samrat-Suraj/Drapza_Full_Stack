"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { audioSystem } from "@/components/drapza/AudioSystem";

export interface WishlistItem {
  id: string | number;
  slug?: string;
  name: string;
  price: string;
  numericPrice?: number;
  image: string;
  category?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  toggleWishlistDrawer: () => void;
  isWishlisted: (id: string | number) => boolean;
  toggleWishlist: (product: WishlistItem) => void;
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (id: string | number) => void;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WISHLIST_STORAGE_KEY = "drapza_atelier_wishlist_v1";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load wishlist from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load wishlist from localStorage:", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when wishlistItems changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (e) {
      console.warn("Failed to save wishlist to localStorage:", e);
    }
  }, [wishlistItems, isHydrated]);

  const toggleWishlistDrawer = useCallback(() => {
    setWishlistOpen((prev) => !prev);
  }, []);

  const isWishlisted = useCallback(
    (id: string | number) => {
      return wishlistItems.some((item) => String(item.id) === String(id));
    },
    [wishlistItems]
  );

  const addToWishlist = useCallback((product: WishlistItem) => {
    audioSystem.playClick(950);
    setWishlistItems((prev) => {
      if (prev.some((item) => String(item.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("drapza:toast", {
          detail: {
            title: product.name,
            description: "Saved to your Atelier Wishlist",
            type: "wishlist",
            image: product.image,
          },
        })
      );
    }
  }, []);

  const removeFromWishlist = useCallback((id: string | number) => {
    audioSystem.playClick(600);
    setWishlistItems((prev) => {
      const removed = prev.find((item) => String(item.id) === String(id));
      if (removed && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("drapza:toast", {
            detail: {
              title: removed.name,
              description: "Removed from Wishlist",
              type: "info",
            },
          })
        );
      }
      return prev.filter((item) => String(item.id) !== String(id));
    });
  }, []);

  const toggleWishlist = useCallback(
    (product: WishlistItem) => {
      const exists = wishlistItems.some((item) => String(item.id) === String(product.id));
      if (exists) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [wishlistItems, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch (e) {}
  }, []);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistOpen,
        setWishlistOpen,
        toggleWishlistDrawer,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

export function useOptionalWishlist() {
  return useContext(WishlistContext) || null;
}
