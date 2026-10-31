"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShoppingBag,
  Heart,
  Info,
  X,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { audioSystem } from "./AudioSystem";

export type ToastType = "cart" | "wishlist" | "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  image?: string;
  duration?: number; // ms, default 4000
  action?: ToastAction;
}

export interface ToastOptions {
  description?: string;
  image?: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  warning: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
  cart: (title: string, options?: ToastOptions) => void;
  wishlist: (title: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { setCartOpen } = useCart();
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastToastRef = useRef<{ key: string; timestamp: number }>({ key: "", timestamp: 0 });

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      // Deduplicate identical/rapid toasts within 800ms
      const toastKey = `${toast.title}-${toast.type || ""}`;
      const now = Date.now();
      if (lastToastRef.current.key === toastKey && now - lastToastRef.current.timestamp < 800) {
        return;
      }
      lastToastRef.current = { key: toastKey, timestamp: now };

      const id = `toast-${now}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = toast.duration ?? 4500;
      const newToast: ToastMessage = { ...toast, id, duration };

      // Play appropriate sound feedback
      if (toast.type === "error") {
        audioSystem.playClick(300);
      } else if (toast.type === "cart" || toast.type === "wishlist") {
        audioSystem.playClick(900);
      } else {
        audioSystem.playClick(750);
      }

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts simultaneously

      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);

      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "success", ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "error", ...options });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "warning", ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "info", ...options });
    },
    [showToast]
  );

  const cart = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "cart", ...options });
    },
    [showToast]
  );

  const wishlist = useCallback(
    (title: string, options?: ToastOptions) => {
      showToast({ title, type: "wishlist", ...options });
    },
    [showToast]
  );

  // Global window listener for custom event 'drapza:toast'
  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        showToast(customEvent.detail);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("drapza:toast", handleCustomToast);
      return () => window.removeEventListener("drapza:toast", handleCustomToast);
    }
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
        cart,
        wishlist,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Notifications Container: Top on Mobile, Bottom-Left on Desktop */}
      <div
        role="region"
        aria-label="System Notifications"
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 sm:top-auto sm:left-6 sm:bottom-6 sm:translate-x-0 z-[9999] flex flex-col gap-2.5 w-[92%] sm:w-[380px] max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => {
          const type = toast.type || "info";

          const badgeStyles = {
            cart: {
              border: "border-cyan-500/30",
              badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
              tag: "BAG UPDATED",
              icon: <ShoppingBag className="w-4 h-4 text-cyan-400" />,
            },
            wishlist: {
              border: "border-pink-500/30",
              badgeBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
              tag: "WISHLIST",
              icon: <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />,
            },
            success: {
              border: "border-emerald-500/30",
              badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              tag: "ATELIER SIGNAL",
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
            },
            error: {
              border: "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
              badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
              tag: "SIGNAL ERROR",
              icon: <AlertCircle className="w-4 h-4 text-red-400" />,
            },
            warning: {
              border: "border-amber-500/30",
              badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
              tag: "NOTICE",
              icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
            },
            info: {
              border: "border-white/15",
              badgeBg: "bg-white/10 text-neutral-300 border-white/15",
              tag: "DRAPZA ATELIER",
              icon: <Info className="w-4 h-4 text-neutral-300" />,
            },
          }[type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-xl text-white border ${badgeStyles.border} rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 transition-all duration-300 transform animate-in fade-in slide-in-from-top-4 sm:slide-in-from-left-4 group`}
            >
              {/* Left Side: Thumbnail or Icon */}
              <div className="flex items-center gap-3 min-w-0">
                {toast.image ? (
                  <div className="h-11 w-11 rounded-xl overflow-hidden bg-neutral-900 border border-white/15 shrink-0">
                    <img
                      src={toast.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {badgeStyles.icon}
                  </div>
                )}

                {/* Text Content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`font-mono-technical text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${badgeStyles.badgeBg}`}
                    >
                      {badgeStyles.tag}
                    </span>
                  </div>
                  <p className="font-display text-sm uppercase tracking-wider text-white truncate font-bold">
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="font-mono-technical text-[11px] text-neutral-300 truncate font-medium">
                      {toast.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Action CTA or Dismiss */}
              <div className="flex items-center gap-2 shrink-0">
                {toast.type === "cart" && (
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(800);
                      setCartOpen(true);
                      dismissToast(toast.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white text-black font-mono-technical text-[10px] uppercase font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    BAG <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(750);
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white text-black font-mono-technical text-[10px] uppercase font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    {toast.action.label}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(500);
                    dismissToast(toast.id);
                  }}
                  className="text-neutral-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtle Auto-Dismiss Progress Line at Bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 origin-left animate-shrink"
                style={{ animationDuration: `${toast.duration ?? 4500}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
