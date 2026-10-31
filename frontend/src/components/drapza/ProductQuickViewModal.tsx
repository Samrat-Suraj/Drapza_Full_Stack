import { useState } from "react";
import { X, Check, ShieldCheck, RefreshCw } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { CartItem } from "./CartDrawer";
import { useLockBodyScroll } from "./useLockBodyScroll";

export interface ProductData {
  id: string;
  name: string;
  category: string;
  price: number | string;
  numericPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  discountTagActive?: boolean;
  offerTag?: string;
  image: string;
  hoverImage?: string;
  description: string;
  details: string[];
}

interface ProductQuickViewModalProps {
  product: ProductData | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
}: ProductQuickViewModalProps) {
  useLockBodyScroll(Boolean(product));
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("MONOCHROME");
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const basePrice = Number(product.numericPrice) || (typeof product.price === "number" ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 990);
  const hasActiveDiscount = Boolean(
    product.discountTagActive !== false &&
    (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < basePrice) || Boolean(product.offerTag))
  );

  const discountPercent = Number(product.discountPercentage) > 0
    ? Number(product.discountPercentage)
    : (product.discountPrice && product.discountPrice < basePrice)
    ? Math.round(((basePrice - product.discountPrice) / basePrice) * 100)
    : 0;

  const finalSellingPrice = hasActiveDiscount
    ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < basePrice
        ? product.discountPrice
        : discountPercent > 0
        ? Math.round(basePrice * (1 - discountPercent / 100))
        : basePrice)
    : basePrice;

  const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

  const handleAdd = () => {
    audioSystem.playClick(900);
    setAdded(true);
    onAddToCart({
      id: product.id,
      name: product.name,
      price: finalSellingPrice,
      originalPrice: basePrice,
      discountPercentage: discountPercent,
      offerTag: offerTagLabel,
      size: selectedSize,
      color: selectedColor,
      image: product.image,
      quantity: 1,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product Quick View"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-none bg-[#0f0f0f] border border-white/10 text-white shadow-2xl animate-in zoom-in-95 duration-200 grid grid-cols-1 md:grid-cols-2 font-mono">
        {/* Close Button */}
        <button
          onClick={() => {
            audioSystem.playClick(400);
            onClose();
          }}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-none bg-black/70 text-neutral-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Product Image Column */}
        <div className="relative aspect-square md:aspect-auto bg-[#161616] p-6 flex items-center justify-center overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain filter brightness-105"
          />
          <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1 z-10">
            {hasActiveDiscount && offerTagLabel && (
              <span className="font-mono-technical text-[9px] uppercase tracking-wider bg-red-600 text-white font-black px-2.5 py-0.5 rounded-none border border-white/20 shadow-md animate-pulse">
                {offerTagLabel}
              </span>
            )}
            <span className="font-mono-technical text-[9.5px] uppercase tracking-[0.2em] text-neutral-300 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-none border border-white/10">
              [ {product.category} ]
            </span>
          </div>
        </div>

        {/* Details Column */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <span className="font-mono-technical text-xs uppercase tracking-[0.2em] text-neutral-400 block mb-1">
              DRAPZA MODULE #{product.id}
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl uppercase tracking-tight text-white font-bold">
              {product.name}
            </h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-sans text-2xl font-bold text-white">
                ₹{finalSellingPrice.toLocaleString("en-IN")}
              </span>
              {hasActiveDiscount && finalSellingPrice < basePrice && (
                <span className="font-sans text-base text-neutral-400 line-through">
                  ₹{basePrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <p className="font-body text-xs sm:text-sm text-neutral-400 mt-4 leading-relaxed">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mt-6">
              <span className="font-mono-technical text-xs uppercase tracking-wider text-neutral-300 block mb-2 font-medium">
                SELECT SILHOUETTE SIZE
              </span>
              <div className="flex gap-2">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      audioSystem.playClick(600);
                      setSelectedSize(size);
                    }}
                    aria-label={`Select size ${size}`}
                    className={`h-10 w-11 rounded-none font-mono-technical text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                      selectedSize === size
                        ? "bg-white text-black border-white shadow-md scale-105 font-bold"
                        : "bg-[#181818] text-neutral-400 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Variant Selector */}
            <div className="mt-5">
              <span className="font-mono-technical text-xs uppercase tracking-wider text-neutral-300 block mb-2 font-medium">
                COLOR SIGNAL
              </span>
              <div className="flex gap-2">
                {["MONOCHROME", "NEUTRAL GREY"].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      audioSystem.playClick(600);
                      setSelectedColor(color);
                    }}
                    aria-label={`Select color ${color}`}
                    className={`px-3 py-1.5 rounded-none font-mono-technical text-[10.5px] uppercase tracking-wider transition-all border cursor-pointer ${
                      selectedColor === color
                        ? "bg-neutral-200 text-black border-white font-bold"
                        : "bg-[#181818] text-neutral-400 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button & Guarantees */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <button
              onClick={handleAdd}
              aria-label={`Add ${product.name} to bag`}
              className={`w-full py-3.5 rounded-none font-mono-technical text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                added
                  ? "bg-neutral-800 text-white"
                  : "bg-white text-black hover:bg-neutral-200 active:scale-[0.99]"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>ADDED TO BAG ✓</span>
                </>
              ) : (
                <span>ADD TO BAG</span>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-technical uppercase text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-neutral-300" />
                <span>ARCHIVAL QUALITY</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-neutral-300" />
                <span>30-DAY DISPATCH RETURN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
