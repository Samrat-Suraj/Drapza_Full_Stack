"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Gift,
  Check,
  Share2,
  Users,
  ThumbsUp,
  Heart,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Bell,
  Loader2,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useToast } from "./ToastNotification";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { ShareBagModal } from "./ShareBagModal";
import { CartDrawerSkeleton } from "./skeletons";
import { productsApi } from "@/lib/api";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  offerTag?: string;
  size: string;
  color: string;
  image: string;
  quantity: number;
  slug?: string;
  bogoTier?: {
    id: string;
    name: string;
    tag: string;
    buyQty: number;
    getQty: number;
    totalQty: number;
    discountPercentage: number;
    badgeText?: string;
    originalPrice: number;
    bundlePrice: number;
    bundleItemsSummary?: string;
  };
  addedBy?: {
    name: string;
    socketId?: string;
  };
  votes?: Array<{
    memberName: string;
    vote: "buy" | "love" | "remove";
    votedAt?: string;
  }>;
  comments?: Array<{
    id: string;
    memberName: string;
    text: string;
    timestamp: string;
  }>;
}

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartItem[];
  onUpdateQuantity?: (id: string, size: string, delta: number) => void;
  onRemoveItem?: (id: string, size: string) => void;
}


export function CartDrawer(props: CartDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const cartContext = useCart();
  const { showToast } = useToast();
  const [giftWrap, setGiftWrap] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // If props are passed, use them; otherwise use CartContext
  const isOpen = props.isOpen !== undefined ? props.isOpen : cartContext.cartOpen;
  useLockBodyScroll(isOpen);

  // Automatically dismiss cart drawer on route transitions
  useEffect(() => {
    if (cartContext.cartOpen) {
      cartContext.setCartOpen(false);
    }
  }, [pathname]);

  const onClose = props.onClose || (() => cartContext.setCartOpen(false));
  const items = props.items || cartContext.cartItems;
  const onUpdateQuantity = props.onUpdateQuantity || cartContext.updateQuantity;
  const onRemoveItem = props.onRemoveItem || cartContext.removeItem;

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 2000;
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const isShippingUnlocked = subtotal >= freeShippingThreshold;

  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, isOpen]);

  useEffect(() => {
    if (isOpen && router?.prefetch) {
      try {
        router.prefetch("/checkout");
      } catch (e) {}
    }
  }, [isOpen, router]);

  const handleProceedCheckout = async () => {
    if (isNavigating) return;
    audioSystem.playClick(1000);
    setIsNavigating(true);

    try {
      const stockCheckItems = items.map((i: any) => ({
        productId: i.product || i._id || (i.id && i.id?.length === 24 ? i.id : undefined),
        name: i.name,
        slug: i.slug,
        quantity: i.quantity || 1,
      }));
      const stockRes = await productsApi.validateStock(stockCheckItems);
      if (stockRes && stockRes.success && !stockRes.isValid) {
        const outOfStockItem = stockRes.items?.find((item) => !item.isValid);
        showToast({
          title: "OUT OF STOCK",
          description: outOfStockItem?.error || "Some items in your bag are out of stock.",
          type: "error",
        });
        setIsNavigating(false);
        return;
      }
    } catch (stockErr) {
      console.warn("Stock validation check warning:", stockErr);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("drapza_token") : null;
    const targetPath = token ? "/checkout" : "/login?redirect=/checkout";

    if (router?.prefetch) {
      try {
        router.prefetch(targetPath);
      } catch (e) {}
    }

    // Let button loading complete on screen before triggering navigation
    await new Promise((r) => setTimeout(r, 650));
    onClose();
    router.push(targetPath);
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-[1000] flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* Slide-over Container */}
      <div
        data-lenis-prevent="true"
        className="relative z-10 w-full max-w-md bg-[#0d0d0d] text-white shadow-2xl flex flex-col h-full max-h-[100dvh] border-l border-white/10 animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wider">
              YOUR ATELIER BAG
            </h2>
            <span className="font-mono-technical text-[11px] sm:text-xs bg-white/10 px-2 sm:px-2.5 py-0.5 rounded-full text-neutral-200 font-medium">
              [{items.reduce((acc, item) => acc + item.quantity, 0)}]
            </span>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(650);
                  setIsShareModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 font-mono-technical text-[10px] uppercase font-bold text-neutral-200 hover:text-white transition-all cursor-pointer mr-1 shadow-sm"
                title="Share this curated bag with friends"
                aria-label="Share this bag"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden xs:inline">SHARE BAG</span>
              </button>
            )}
            <button
              onClick={() => {
                audioSystem.playClick(400);
                onClose();
              }}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close bag"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Shared Bag Session Banner or Collaborative Prompt */}
        {cartContext.sharedBag ? (
          <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 bg-neutral-900/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <div className="min-w-0">
                <span className="font-mono-technical text-[10px] font-bold text-white uppercase tracking-wider block truncate">
                  COLLABORATIVE BAG &bull; {cartContext.sharedBag.roomCode}
                </span>
                <span className="font-mono-technical text-[9px] text-neutral-400 block truncate">
                  Host: {cartContext.sharedBag.hostName} &bull; {cartContext.sharedBag.members.length} {cartContext.sharedBag.members.length === 1 ? "member" : "members"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(800);
                  onClose();
                  router.push("/cart/shared");
                }}
                className="text-[9px] font-mono-technical uppercase text-white hover:bg-white hover:text-black bg-white/10 border border-white/20 px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                title="Open Collaborative Shopping Room"
              >
                <span>OPEN ROOM</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={cartContext.leaveSharedBag}
                className="text-[9px] font-mono-technical uppercase text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Leave room"
              >
                LEAVE
              </button>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="flex-shrink-0 px-4 sm:px-6 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="font-mono-technical text-[10px] uppercase text-neutral-300 truncate">
                Shopping with friends & family?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(600);
                setIsShareModalOpen(true);
              }}
              className="font-mono-technical text-[10px] uppercase text-white hover:underline underline-offset-2 font-bold shrink-0 ml-2 cursor-pointer"
            >
              SHARE CART &rarr;
            </button>
          </div>
        ) : null}

        {/* Free Shipping Progress Bar */}
        <div className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-white/10 transition-colors ${isShippingUnlocked ? "bg-white/10 border-white/20" : "bg-[#141414]"
          }`}>
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono-technical uppercase tracking-wider mb-1.5">
            <span className={isShippingUnlocked ? "text-white font-bold flex items-center gap-1" : "text-neutral-300"}>
              {isShippingUnlocked ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  FREE AIRWAY SHIPPING UNLOCKED
                </>
              ) : (
                `₹${Math.max(0, freeShippingThreshold - subtotal).toLocaleString("en-IN")} AWAY FROM FREE DISPATCH`
              )}
            </span>
            <span className={`font-semibold ${isShippingUnlocked ? "text-white" : "text-neutral-400"}`}>
              {Math.round(shippingProgress)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isShippingUnlocked ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" : "bg-neutral-600"
                }`}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List - Fully Smooth Scrollable */}
        <div
          data-lenis-prevent="true"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 sm:space-y-4 dark-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {cartContext?.isLoaded === false ? (
            <CartDrawerSkeleton />
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-16">
              <span className="font-display text-4xl uppercase tracking-widest block mb-3 text-neutral-600">
                BAG EMPTY
              </span>
              <p className="font-mono-technical text-xs uppercase tracking-wider max-w-[240px] leading-relaxed">
                NO GARMENTS SELECTED IN YOUR ATELIER BAG YET.
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push("/wardrobe");
                }}
                className="mt-6 px-5 py-2.5 rounded-lg border border-white/20 text-white font-mono-technical text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                BROWSE WARDROBE
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-4 p-3.5 rounded-xl bg-[#151515] border border-white/5 items-center hover:border-white/15 transition-all"
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-[#1f1f1f] flex-shrink-0 border border-white/5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm sm:text-base uppercase tracking-tight text-white truncate">
                      {item.name}
                    </h3>
                    <p className="font-mono-technical text-[10px] uppercase tracking-wider text-neutral-300 mt-0.5">
                      SIZE: {item.size} | {item.color}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono-technical text-xs font-semibold text-white">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="font-mono-technical text-[10px] text-neutral-500 line-through">
                            ₹{(item.originalPrice * item.quantity).toLocaleString("en-IN")}
                          </span>
                          <span className="font-mono-technical text-[9px] text-red-400 font-bold uppercase tracking-wider">
                            Save ₹{((item.originalPrice - item.price) * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </>
                      )}
                      {item.bogoTier && item.bogoTier.originalPrice > item.price && (
                        <>
                          <span className="font-mono-technical text-[10px] text-neutral-500 line-through">
                            ₹{(item.bogoTier.originalPrice * item.quantity).toLocaleString("en-IN")}
                          </span>
                          <span className="font-mono-technical text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                            Save ₹{((item.bogoTier.originalPrice - item.price) * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </>
                      )}
                    </div>
                    {item.offerTag && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono-technical text-[8px] uppercase px-1.5 py-0.5 rounded-none bg-red-600 text-white font-black tracking-wider">
                          {item.offerTag}
                        </span>
                      </div>
                    )}
                    {item.bogoTier && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-mono-technical text-[9px] uppercase px-2 py-0.5 rounded bg-white text-black font-bold tracking-wider shadow-sm">
                          {item.bogoTier.name} ({item.bogoTier.discountPercentage}% OFF)
                        </span>
                        {item.bogoTier.badgeText && (
                          <span className="font-mono-technical text-[8px] uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-white font-bold tracking-wider">
                            {item.bogoTier.badgeText}
                          </span>
                        )}
                      </div>
                    )}
                    {item.bogoTier?.bundleItemsSummary && (
                      <p className="font-mono-technical text-[9px] uppercase text-neutral-400 mt-0.5">
                        {item.bogoTier.bundleItemsSummary}
                      </p>
                    )}
                    {item.addedBy?.name && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 font-mono-technical text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 font-bold tracking-wider">
                          ADDED BY {item.addedBy.name}
                        </span>
                      </div>
                    )}

                    {/* Shared Bag 3-Way Voting Chips */}
                    {cartContext.sharedBag && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {(() => {
                          const buyVotes = item.votes?.filter((v) => v.vote === "buy") || [];
                          const loveVotes = item.votes?.filter((v) => v.vote === "love") || [];
                          const removeVotes = item.votes?.filter((v) => v.vote === "remove") || [];
                          const myVote = item.votes?.find(
                            (v) => v.memberName === cartContext.sharedBag?.memberName
                          )?.vote;

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  audioSystem.playClick(800);
                                  cartContext.voteOnProduct(item.id, "buy");
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono-technical flex items-center gap-1 transition-all cursor-pointer ${myVote === "buy"
                                    ? "bg-white text-black font-bold border border-white shadow-sm"
                                    : "bg-white/5 text-neutral-300 hover:text-white border border-white/10"
                                  }`}
                                title="Vote: Buy this item"
                              >
                                <ThumbsUp className="w-2.5 h-2.5" />
                                <span>{buyVotes.length > 0 ? buyVotes.length : "Buy"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  audioSystem.playClick(800);
                                  cartContext.voteOnProduct(item.id, "love");
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono-technical flex items-center gap-1 transition-all cursor-pointer ${myVote === "love"
                                    ? "bg-white text-black font-bold border border-white shadow-sm"
                                    : "bg-white/5 text-neutral-300 hover:text-white border border-white/10"
                                  }`}
                                title="Vote: Love it"
                              >
                                <Heart className="w-2.5 h-2.5" />
                                <span>{loveVotes.length > 0 ? loveVotes.length : "Love"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  audioSystem.playClick(800);
                                  cartContext.voteOnProduct(item.id, "remove");
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono-technical flex items-center gap-1 transition-all cursor-pointer ${myVote === "remove"
                                    ? "bg-white/20 text-white font-bold border border-white/40"
                                    : "bg-white/5 text-neutral-300 hover:text-white border border-white/10"
                                  }`}
                                title="Vote: Suggest remove"
                              >
                                <ThumbsDown className="w-2.5 h-2.5" />
                                {removeVotes.length > 0 && <span>{removeVotes.length}</span>}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => {
                        audioSystem.playClick(300);
                        onRemoveItem(item.id, item.size);
                      }}
                      className="text-neutral-300 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center border border-white/10 rounded-lg bg-[#0a0a0a]">
                      <button
                        onClick={() => {
                          audioSystem.playClick(500);
                          onUpdateQuantity(item.id, item.size, -1);
                        }}
                        className="p-1 text-neutral-300 hover:text-white cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 font-mono-technical text-xs text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          audioSystem.playClick(700);
                          onUpdateQuantity(item.id, item.size, 1);
                        }}
                        className="p-1 text-neutral-300 hover:text-white cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}


              {/* Luxury Gift Packaging Option */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#141414] border border-white/5 hover:border-white/15 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => {
                      audioSystem.playClick(600);
                      setGiftWrap(e.target.checked);
                    }}
                    className="rounded accent-white cursor-pointer"
                  />
                  <Gift className="w-4 h-4 text-white" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono-technical text-[11px] uppercase text-white font-semibold">
                      ATELIER LUXURY GIFT PACKAGING (+₹150)
                    </p>
                    <p className="text-[10px] text-neutral-300">
                      Handcrafted box, signature ribbon & custom wax seal note.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="flex-shrink-0 p-6 border-t border-white/10 bg-[#121212] space-y-4">
            <div className="flex justify-between items-center font-mono-technical text-sm uppercase">
              <span className="text-neutral-300">SUBTOTAL</span>
              <span className="font-bold text-white text-base">
                ₹{(subtotal + (giftWrap ? 150 : 0)).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="font-mono-technical text-[10px] uppercase text-neutral-300 tracking-wider">
              {isShippingUnlocked
                ? "✓ COMPLIMENTARY AIRWAY SHIPPING APPLIED."
                : "PRIORITY AIRWAY DISPATCH & TAXES AT CHECKOUT."}
            </p>
            {/* Share Bag With Friends / Co-Shop Trigger */}
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(650);
                setIsShareModalOpen(true);
              }}
              className="w-full py-3 rounded-xl border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white font-mono-technical text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            >
              <Share2 className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
              <span>SHARE BAG WITH FRIENDS / FAMILY</span>
            </button>

            {cartContext.sharedBag && !cartContext.sharedBag.isHost ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/15 text-center">
                  <span className="font-mono-technical text-[10px] uppercase text-neutral-200 font-bold block">
                    WAITING FOR {cartContext.sharedBag.hostName.toUpperCase()} TO PLACE ORDER
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    As a participant, only the cart owner can finalize checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(850);
                    showToast({
                      title: "Nudged Bag Owner!",
                      description: `Notified ${cartContext.sharedBag?.hostName} that the bag is ready for checkout.`,
                      type: "info",
                    });
                  }}
                  className="w-full py-3.5 rounded-xl bg-white text-black font-mono-technical text-xs uppercase tracking-[0.15em] font-bold hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>NUDGE {cartContext.sharedBag.hostName.toUpperCase()} TO ORDER</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleProceedCheckout}
                disabled={isNavigating || items.length === 0}
                className="w-full py-4 rounded-xl bg-white text-black font-mono-technical text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>PREPARING CHECKOUT...</span>
                  </>
                ) : (
                  <>
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Bag Modal */}
      <ShareBagModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        items={items}
        subtotal={subtotal}
      />
    </div>
  );
}

