"use client";
import { useEffect } from "react";
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { useRouter, usePathname } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useLockBodyScroll } from "./useLockBodyScroll";

export function WishlistDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistItems, wishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  useLockBodyScroll(wishlistOpen);

  // Automatically dismiss wishlist drawer on route transitions
  useEffect(() => {
    if (wishlistOpen) {
      setWishlistOpen(false);
    }
  }, [pathname]);

  if (!wishlistOpen) return null;

  const handleMoveToBag = (item: any) => {
    audioSystem.playClick(900);
    const numPrice = typeof item.numericPrice === "number" ? item.numericPrice : parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 990;
    
    addToCart({
      id: String(item.id),
      name: item.name,
      price: numPrice,
      size: "M",
      color: "#7a726c",
      image: item.image,
      quantity: 1,
    });
    removeFromWishlist(item.id);
  };

  const handleClose = () => {
    audioSystem.playClick(400);
    setWishlistOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist"
      className="fixed inset-0 z-[1000] flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Container */}
      <div
        data-lenis-prevent="true"
        className="relative z-10 w-full max-w-md bg-[#0d0d0d] text-white shadow-2xl flex flex-col h-full max-h-[100dvh] border-l border-white/10 animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <h2 className="font-display text-2xl uppercase tracking-wider">
              SAVED WISHLIST
            </h2>
            <span className="font-mono-technical text-xs bg-white/10 px-2.5 py-0.5 rounded-full text-white font-medium">
              [{wishlistItems.length}]
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wishlist Items List - Fully Scrollable */}
        <div
          data-lenis-prevent="true"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 dark-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {wishlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-300">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <Heart className="w-8 h-8" />
              </div>
              <p className="font-mono-technical text-sm uppercase tracking-wider text-neutral-200 font-semibold">
                YOUR WISHLIST IS CURRENTLY EMPTY
              </p>
              <p className="font-mono-technical text-xs text-neutral-300 max-w-xs">
                Save your favorite kurtis, sarees, jeans, and ensembles by clicking the heart icon on any garment.
              </p>
              <button
                onClick={() => {
                  handleClose();
                  router.push("/wardrobe");
                }}
                className="mt-4 px-6 py-2.5 rounded-full bg-white text-black font-mono-technical text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-all cursor-pointer shadow-lg"
              >
                EXPLORE ALL GARMENTS →
              </button>
            </div>
          ) : (
            wishlistItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
              >
                {/* Product Image */}
                <div className="w-20 h-24 bg-black/40 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-white/5 p-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain object-center"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="font-mono-technical text-[9px] uppercase tracking-wider text-neutral-300 block truncate">
                    {item.category || "CURATED GARMENT"}
                  </span>
                  <h3 className="font-mono-technical text-xs font-bold text-white uppercase tracking-wider truncate">
                    {item.name}
                  </h3>
                  <div className="font-mono-technical text-xs font-semibold text-white">
                    {item.price}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    aria-label={`Remove ${item.name} from wishlist`}
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMoveToBag(item)}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-mono-technical text-[10px] uppercase font-bold hover:bg-neutral-200 transition-all flex items-center gap-1 cursor-pointer shadow"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>BAG</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {wishlistItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#121212] space-y-3">
            <button
              onClick={() => {
                wishlistItems.forEach((item) => {
                  const numPrice = typeof item.numericPrice === "number" ? item.numericPrice : parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 990;
                  addToCart({
                    id: String(item.id),
                    name: item.name,
                    price: numPrice,
                    size: "M",
                    color: "#7a726c",
                    image: item.image,
                    quantity: 1,
                  });
                });
                clearWishlist();
                audioSystem.playClick(1000);
              }}
              className="w-full py-3.5 rounded-xl bg-white text-black font-mono-technical text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              <span>MOVE ALL TO BAG</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={clearWishlist}
              className="w-full py-2 text-neutral-400 hover:text-white font-mono-technical text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              CLEAR WISHLIST
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
