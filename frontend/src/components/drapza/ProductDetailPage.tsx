"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Layers, Ruler, ShieldCheck, Truck, MapPin, Maximize2, X, Heart, Star, Users, Tag, Scissors, Share2 } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { CartItem } from "./CartDrawer";
import { ProductDetailSkeleton } from "./ProductDetailSkeleton";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { useToast } from "./ToastNotification";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { useCollab } from "@/context/CollabContext";
import { MagneticButton } from "./MagneticButton";
import { ImageWithSkeleton } from "./skeletons";
import { bogoConfigApi, BogoConfigData, DEFAULT_BOGO_CONFIG } from "@/lib/api";
import { BookCustomSizeModal } from "./BookCustomSizeModal";
import { ShareProductModal } from "./ShareProductModal";
import { MonogramCustomizerModal } from "./MonogramCustomizerModal";
import { normalizeImageUrl, normalizeImageUrls } from "@/lib/imageUtils";
import { pincodeSchema, getZodErrorMessage } from "@/lib/validation";

export { ProductDetailSkeleton, ImageWithSkeleton };

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface RelatedProductItem {
  id: string | number;
  slug: string;
  name: string;
  price: number | string;
  numericPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  discountTagActive?: boolean;
  offerTag?: string;
  image: string;
  hoverImage?: string;
  category?: string;
}

export interface ProductDetailData {
  id: string | number;
  slug: string;
  name: string;
  price: string;
  numericPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  discountTagActive?: boolean;
  offerTag?: string;
  image: string;
  category?: string;
  description?: string;
  colors?: string[];
  sizes?: string[];
  images?: string[];
  detailsImage?: string;
  detailTitle?: string;
  details?: string | string[];
  fabric?: string;
  fit?: string;
  accentBadge?: string;
  stock?: number;
  inStock?: boolean;
  ratings?: number;
  numReviews?: number;
  gallery?: string[];
  colorImages?: Array<{ color: string; images: string[] }>;
  relatedProducts?: RelatedProductItem[];
}

export interface ProductDetailPageProps {
  product: ProductDetailData | null;
  onClose?: () => void;
  onAddToCart?: (item: CartItem) => void;
  onSelectProduct?: (product: ProductDetailData) => void;
  allProducts?: ProductDetailData[];
  isModal?: boolean;
}

const COLOR_NAMES: Record<string, string> = {
  "#0f0f0f": "Obsidian Black",
  "#1b1b1b": "Onyx Black",
  "#1a1a1a": "Deep Charcoal",
  "#7a726c": "Taupe Gray",
  "#969992": "Mineral Sage",
  "#686868": "Slate Gray",
  "#bfc4cb": "Misty Silver",
  "#f5f5f5": "Bone White",
  "#ffffff": "Pure White",
  "#000000": "True Black",
  "#d4af37": "Metallic Gold",
  "#800020": "Royal Burgundy",
};

export const getColorName = (hex: string): string => {
  if (!hex) return "Classic Shade";
  const lower = hex.toLowerCase().trim();
  return COLOR_NAMES[lower] || "Artisanal Shade";
};

export const toRomanSize = (size: string): string => {
  if (!size) return "M";
  return size.trim();
};

// ── TECH SPECS ACCORDION ─────────────────────────────────────────────────────
function ProductAccordion({ product }: { product: ProductDetailData }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const accordionItems = [
    {
      title: "COMPOSITION & FABRIC",
      icon: <Layers className="w-3.5 h-3.5" />,
      content:
        product.fabric ||
        "Crafted from premium hand-finished modal silk and organic textiles, offering a luxurious fluid drape, enduring luster, and breathable comfort.",
    },
    {
      title: "FIT & SILHOUETTE GUIDE",
      icon: <Ruler className="w-3.5 h-3.5" />,
      content:
        product.fit ||
        "Engineered for an elegant, graceful silhouette with reinforced artisanal seams and tailored drape that flatters natural movement.",
    },
    {
      title: "SUSTAINABILITY & ORIGIN",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      content:
        "Handcrafted in zero-waste atelier batches with eco-conscious, non-toxic dyes and 100% plastic-free recyclable packaging.",
    },
    {
      title: "DISPATCH & EXCHANGES",
      icon: <Truck className="w-3.5 h-3.5" />,
      content:
        "Complimentary express dispatch within 24 hours. Easy 10-day doorstep exchanges and complimentary returns across India.",
    },
  ];

  return (
    <div className="mt-3 flex flex-col divide-y divide-[#d7dbd2] border-y border-[#d7dbd2]">
      {accordionItems.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="py-2.5 transition-colors">
            <button
              type="button"
              data-cursor
              data-cursor-label="INFO"
              aria-expanded={isOpen}
              aria-label={`Toggle ${item.title} section`}
              onClick={() => {
                audioSystem.playClick(isOpen ? 450 : 650);
                setOpenIndex(isOpen ? null : idx);
              }}
              className="flex w-full items-center justify-between font-mono-technical text-[11px] uppercase tracking-[0.18em] text-[#0f0f0f] font-semibold text-left cursor-pointer transition-colors hover:text-neutral-900"
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.title}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#0f0f0f]" : "text-neutral-600"
                  }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100 mt-2.5" : "max-h-0 opacity-0"
                }`}
            >
              <p className="font-sans text-xs leading-relaxed text-neutral-700">
                {item.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PINCODE DELIVERY ESTIMATOR ──────────────────────────────────────────────
function PincodeEstimator() {
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ date: string; city: string } | null>(null);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError("");
    const validation = pincodeSchema.safeParse({ pincode: pincode.trim() });
    if (!validation.success) {
      setPincodeError(getZodErrorMessage(validation.error));
      audioSystem.playError();
      return;
    }
    setLoading(true);
    audioSystem.playClick(700);

    setTimeout(() => {
      setLoading(false);
      setChecked(true);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      const formattedDate = deliveryDate.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const pinPrefix = pincode.substring(0, 2);
      let city = "Your Location";
      if (pinPrefix === "11") city = "Delhi NCR";
      else if (pinPrefix === "40" || pinPrefix === "41") city = "Maharashtra";
      else if (pinPrefix === "56") city = "Bengaluru";
      else if (pinPrefix === "60") city = "Chennai";
      else if (pinPrefix === "70") city = "Kolkata";
      else if (pinPrefix === "50") city = "Hyderabad";

      setDeliveryInfo({ date: formattedDate, city });
    }, 450);
  };

  return (
    <div className="mt-2.5 rounded-none bg-neutral-50/70 p-3.5 border border-neutral-300">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono-technical text-[11px] uppercase tracking-wider font-bold text-black flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-neutral-700" />
          DELIVERY ESTIMATE
        </span>
        <span className="font-mono-technical text-[9px] uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-none border border-emerald-200">
          FREE DISPATCH
        </span>
      </div>

      <form onSubmit={handleCheckPincode} className="flex gap-2">
        <input
          id="delivery-pincode-input"
          type="text"
          maxLength={6}
          value={pincode}
          aria-label="Enter 6-digit delivery pincode"
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setPincode(val);
            if (checked) setChecked(false);
          }}
          placeholder="ENTER 6-DIGIT PINCODE"
          className="flex-1 rounded-none border border-neutral-300 bg-white px-3.5 py-2.5 font-mono-technical text-xs uppercase tracking-wider outline-none focus:border-black transition-colors placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Check delivery estimate"
          className="rounded-none bg-neutral-800 hover:bg-black px-5 py-2.5 font-mono-technical text-xs uppercase font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
        >
          {loading ? "CHECKING..." : "CHECK"}
        </button>
      </form>
      {pincodeError && (
        <p className="mt-1.5 font-mono-technical text-[10px] text-red-600 uppercase tracking-wider">
          ✕ {pincodeError}
        </p>
      )}

      {checked && deliveryInfo && (
        <div className="mt-2.5 pt-2.5 border-t border-neutral-200 flex flex-col gap-1 text-[11px] animate-in fade-in duration-200">
          <p className="font-mono-technical text-black flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Estimated delivery by <strong className="font-semibold">{deliveryInfo.date}</strong> to {deliveryInfo.city} ({pincode})
            </span>
          </p>
          <p className="font-mono-technical text-[10px] text-neutral-600 pl-5">
            ✓ Cash on Delivery Available &bull; 10-Day Easy Complimentary Exchange
          </p>
        </div>
      )}
    </div>
  );
}

// ── FABRIC LIGHTBOX ZOOM MODAL ───────────────────────────────────────────────
function FabricLightboxModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  productTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  productTitle: string;
}) {
  useLockBodyScroll(isOpen);
  const [activeIdx, setActiveIdx] = useState(currentIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (isOpen) {
      setActiveIdx(currentIndex);
      setIsZoomed(false);
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      if (e.key === "ArrowRight") setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fabric Detail Inspection Lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="w-full max-w-6xl flex items-center justify-between text-white border-b border-white/10 pb-3 px-2">
        <div>
          <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
            FABRIC DETAIL INSPECTION &bull; {activeIdx + 1}/{images.length}
          </span>
          <p role="heading" aria-level={2} className="font-sans font-bold text-base sm:text-lg uppercase tracking-wider text-white">
            {productTitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-white/20 bg-white/10 text-white font-mono-technical text-[10px] uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isZoomed ? "RESET ZOOM" : "2X ZOOM"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fabric lightbox"
            className="p-2 text-neutral-400 hover:text-white rounded-none border border-white/10 hover:border-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Frame with Zoom & Navigation */}
      <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-none bg-black/70 hover:bg-black text-white border border-white/20 hover:border-white transition-all cursor-pointer shadow-xl backdrop-blur-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div
          onMouseMove={handleMouseMove}
          onClick={() => setIsZoomed((prev) => !prev)}
          className={`relative max-h-[72vh] max-w-full overflow-hidden flex items-center justify-center rounded-none cursor-${isZoomed ? "zoom-out" : "zoom-in"}`}
        >
          <img
            src={images[activeIdx] || images[0]}
            alt={productTitle}
            draggable={false}
            style={
              isZoomed
                ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: "scale(2.2)",
                }
                : undefined
            }
            className="max-h-[70vh] max-w-full object-contain rounded-none transition-transform duration-200 select-none pointer-events-none"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-none bg-black/70 hover:bg-black text-white border border-white/20 hover:border-white transition-all cursor-pointer shadow-xl backdrop-blur-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Thumbnail navigation */}
      <div className="flex gap-2 pb-2 overflow-x-auto max-w-full px-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveIdx(idx);
              setIsZoomed(false);
            }}
            aria-label={`View fabric detail image ${idx + 1}`}
            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-none overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${activeIdx === idx
              ? "border-white scale-105 opacity-100 ring-2 ring-white/40"
              : "border-white/20 opacity-50 hover:opacity-90 hover:border-white/60"
              }`}
          >
            <img src={img} alt="" draggable={false} className="w-full h-full object-cover select-none pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PRODUCT HERO ─────────────────────────────────────────────────────────────
export function ProductHero({
  product,
  onAddToCart,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  onClose,
}: {
  product: ProductDetailData;
  onAddToCart?: ((item: CartItem) => void) | undefined;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedSize: string;
  setSelectedSize: (s: string) => void;
  onClose?: () => void;
}) {
  const router = useRouter();
  const galleryRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  const colors = product.colors || ["#7a726c", "#0f0f0f", "#969992"];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"];

  const defaultGallery = useMemo(() => {
    const rawList =
      product.images && product.images.length > 0
        ? product.images
        : product.gallery && product.gallery.length > 0
          ? product.gallery
          : [
            product.image,
            "/images/drapza/products/product_11.png",
            "/images/drapza/products/product_6.png",
            "/images/drapza/products/product_4.png",
            "/images/drapza/products/product_18.png",
          ];
    return normalizeImageUrls(rawList);
  }, [product.images, product.gallery, product.image]);

  // Dynamically resolve color-specific images if available or rotate gallery by color index
  const selectedColorIndex = Math.max(0, colors.indexOf(selectedColor));
  const colorMatch = product.colorImages?.find(
    (ci) => ci.color && selectedColor && ci.color.toLowerCase().trim() === selectedColor.toLowerCase().trim()
  );

  const productImages = useMemo(() => {
    if (colorMatch && colorMatch.images && colorMatch.images.length > 0) {
      return colorMatch.images;
    }
    if (defaultGallery && defaultGallery.length > 1 && selectedColorIndex > 0) {
      const idx = selectedColorIndex % defaultGallery.length;
      return [...defaultGallery.slice(idx), ...defaultGallery.slice(0, idx)];
    }
    return defaultGallery;
  }, [colorMatch, defaultGallery, selectedColorIndex]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [customSizeModalOpen, setCustomSizeModalOpen] = useState(false);
  const [monogramModalOpen, setMonogramModalOpen] = useState(false);

  // Dynamic BOGO & Tiered Bundle Deals State
  const [bogoConfig, setBogoConfig] = useState<BogoConfigData>(DEFAULT_BOGO_CONFIG);
  const [selectedTierId, setSelectedTierId] = useState<string>("standard");

  const sanitizeBogoData = (data: BogoConfigData): BogoConfigData => ({
    ...data,
    bannerNotice: (data.bannerNotice || "").replace(/[🔥✨🎉⚡🎁]/g, "").trim(),
    sectionTitle: (data.sectionTitle || "").replace(/[🔥✨🎉⚡🎁]/g, "").trim(),
  });

  useEffect(() => {
    let isMounted = true;
    try {
      const cached = localStorage.getItem("drapza_bogo_config");
      if (cached) {
        setBogoConfig(sanitizeBogoData(JSON.parse(cached)));
      }
    } catch (e) { }

    bogoConfigApi.getBogoConfig().then((res) => {
      if (isMounted && res && res.success && res.data) {
        setBogoConfig(sanitizeBogoData(res.data));
      }
    }).catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  // Base & Discount Pricing calculations
  const baseNumericPrice = Number(product.numericPrice) || (typeof product.price === "number" ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 1290);
  const hasActiveDiscount = Boolean(
    product.discountTagActive !== false &&
    (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < baseNumericPrice) || Boolean(product.offerTag))
  );

  const discountPercent = Number(product.discountPercentage) > 0
    ? Number(product.discountPercentage)
    : (product.discountPrice && product.discountPrice < baseNumericPrice)
      ? Math.round(((baseNumericPrice - product.discountPrice) / baseNumericPrice) * 100)
      : 0;

  const finalSellingPrice = hasActiveDiscount
    ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < baseNumericPrice
      ? product.discountPrice
      : discountPercent > 0
        ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
        : baseNumericPrice)
    : baseNumericPrice;

  const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");
  const isMemberActive = Boolean((product as any).isMember);
  const memberPrice = typeof (product as any).memberPrice === "number" && (product as any).memberPrice > 0 ? (product as any).memberPrice : 0;
  const effectiveMemberSellingPrice = isMemberActive && memberPrice > 0 && memberPrice < finalSellingPrice ? memberPrice : finalSellingPrice;
  const basePrice = effectiveMemberSellingPrice;

  const activeTiers = bogoConfig.isEnabled ? bogoConfig.tiers.filter((t) => t.isActive) : [];
  const selectedTier = activeTiers.find((t) => t.id === selectedTierId) || activeTiers[0] || {
    id: "standard",
    name: "1 PIECE (STANDARD)",
    tag: "1 PC",
    buyQty: 1,
    getQty: 0,
    totalQty: 1,
    discountPercentage: 0,
    badgeText: "",
    isPopular: false,
  };

  const totalUnits = selectedTier ? selectedTier.totalQty : 1;
  const rawTotalPrice = baseNumericPrice * totalUnits;
  const discountAmount = selectedTier ? Math.round((rawTotalPrice * selectedTier.discountPercentage) / 100) : (rawTotalPrice - finalSellingPrice * totalUnits);
  const bundleFinalPrice = Math.max(0, rawTotalPrice - discountAmount);
  const perUnitPrice = totalUnits > 0 ? Math.round(bundleFinalPrice / totalUnits) : finalSellingPrice;
  const totalSavings = rawTotalPrice - bundleFinalPrice;

  const isOutOfStock =
    (product as any).inStock === false ||
    (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0);
  const availableStock = typeof product.stock === "number" ? Math.max(0, product.stock) : (isOutOfStock ? 0 : 99);

  // Reset active image index to front image whenever selected color changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor]);

  const [added, setAdded] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const { roomCode, addToCoCart, openStartModal } = useCollab();

  const mainActionRef = useRef<HTMLDivElement>(null);
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setShowMobileStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1 }
    );

    if (mainActionRef.current) {
      observer.observe(mainActionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload gallery images
  useEffect(() => {
    productImages.forEach((src: string) => {
      const img = new Image();
      img.src = src;
    });
  }, [productImages]);

  // Kinetic Entry Typography & Spec Reveal Animation on Mount
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !metaRef.current) return;
    const ctx = gsap.context(() => {
      // 1. Top Badges & Edition Tag
      gsap.from(".hero-tag-badge", {
        y: 25,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.85,
        ease: "power3.out",
      });

      // 2. Main Product Title with 3D Perspective Lift
      gsap.from(".hero-product-title", {
        y: 45,
        opacity: 0,
        rotateX: 15,
        transformOrigin: "bottom center",
        filter: "blur(6px)",
        duration: 1.15,
        delay: 0.08,
        ease: "power4.out",
      });

      // 3. Price Tag & Dispatch Indicator
      gsap.from(".hero-price-tag", {
        x: 25,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.9,
        delay: 0.15,
        ease: "power3.out",
      });

      // 4. Description, Swatches, Sizes, Pincode & Accordion (Staggered)
      gsap.from(".hero-desc, .hero-controls, .hero-accordion, .hero-cta-group", {
        y: 35,
        opacity: 0,
        duration: 0.95,
        stagger: 0.08,
        delay: 0.22,
        ease: "power3.out",
      });
    }, metaRef);

    return () => ctx.revert();
  }, [product.id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor, product.id]);

  // Cinematic Layered Card-Stack Swipe-Up & Parallax Back Zoom Setup (Desktop only)
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !product || !galleryRef.current) return;

    const ctx = gsap.context(() => {
      const snapshotsContainer = viewportRef.current || galleryRef.current;
      if (!snapshotsContainer) return;

      const snapshots = snapshotsContainer.querySelectorAll<HTMLElement>(
        ".product-snapshot, .product-slide"
      );
      if (snapshots.length === 0) return;

      const totalImages = productImages.length;
      const scrollDistance = (totalImages - 1) * 100; // 100vh per image step

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        snapshots.forEach((snap, idx) => {
          const img = snap.querySelector<HTMLElement>("img");
          gsap.set(snap, {
            zIndex: (idx + 1) * 10,
            yPercent: idx === 0 ? 0 : 100,
            opacity: 1,
            scale: 1.0,
          });
          if (img) {
            gsap.set(img, {
              scale: idx === 0 ? 1.0 : 1.18,
              transformOrigin: "center center",
            });
          }
        });

        if (snapshots.length < 2) return;

        const masterTl = gsap.timeline({
          scrollTrigger: {
            id: `product-hero-pin-${product.id}`,
            trigger: galleryRef.current,
            start: "top top",
            end: `+=${scrollDistance}%`,
            pin: true,
            pinSpacing: true,
            scrub: 1.2,
            anticipatePin: 1,
            onUpdate: (self) => {
              const step = Math.min(
                Math.floor(self.progress * totalImages),
                totalImages - 1
              );
              setActiveImageIndex(step);
            },
          },
        });

        scrollTriggerRef.current = masterTl.scrollTrigger || null;

        const stepDuration = 1 / (totalImages - 1);
        for (let i = 0; i < totalImages - 1; i++) {
          const currSnap = snapshots[i];
          const nextSnap = snapshots[i + 1];
          const currImg = currSnap?.querySelector<HTMLElement>("img");
          const nextImg = nextSnap?.querySelector<HTMLElement>("img");
          const startTime = i * stepDuration;

          // Back Panel: Scales down & dims softly behind incoming front panel
          if (currSnap) {
            masterTl.to(
              currSnap,
              {
                scale: 0.94,
                opacity: 0.65,
                ease: "power1.inOut",
                duration: stepDuration,
              },
              startTime
            );
          }

          // Back Image: Parallax zooms into background
          if (currImg) {
            masterTl.to(
              currImg,
              {
                scale: 1.15,
                ease: "power1.inOut",
                duration: stepDuration,
              },
              startTime
            );
          }

          // Front Panel: SWIPES UP FROM BOTTOM DIRECTLY OVER THE BACK PANEL
          if (nextSnap) {
            masterTl.to(
              nextSnap,
              {
                yPercent: 0,
                opacity: 1,
                ease: "power2.out",
                duration: stepDuration,
              },
              startTime
            );
          }

          // Front Image: Settles zoom from 1.18 to 1.0
          if (nextImg) {
            masterTl.to(
              nextImg,
              {
                scale: 1.0,
                ease: "power2.out",
                duration: stepDuration,
              },
              startTime
            );
          }
        }
      });
    }, galleryRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [product, selectedColor, productImages]);

  const handleSelectImage = (index: number) => {
    if (index === activeImageIndex) return;
    audioSystem.playClick(600);
    setActiveImageIndex(index);

    const st = scrollTriggerRef.current;
    if (st && typeof window !== "undefined" && window.innerWidth >= 1024) {
      const snapshots = (viewportRef.current || galleryRef.current)?.querySelectorAll<HTMLElement>(
        ".product-snapshot, .product-slide"
      );

      if (snapshots) {
        gsap.killTweensOf(snapshots);

        snapshots.forEach((snap, i) => {
          const img = snap.querySelector<HTMLElement>("img");
          if (i < index) {
            gsap.to(snap, {
              yPercent: 0,
              scale: 0.94,
              opacity: 0.65,
              duration: 0.35,
              ease: "power2.inOut",
            });
            if (img) gsap.to(img, { scale: 1.15, duration: 0.35, ease: "power2.inOut" });
          } else if (i === index) {
            gsap.to(snap, {
              yPercent: 0,
              scale: 1.0,
              opacity: 1,
              zIndex: 25,
              duration: 0.35,
              ease: "power2.out",
            });
            if (img) gsap.to(img, { scale: 1.0, duration: 0.35, ease: "power2.out" });
          } else {
            gsap.to(snap, {
              yPercent: 100,
              scale: 1.0,
              opacity: 1,
              duration: 0.35,
              ease: "power2.inOut",
            });
            if (img) gsap.to(img, { scale: 1.18, duration: 0.35, ease: "power2.inOut" });
          }
        });
      }

      const totalSteps = productImages.length - 1;
      const targetProgress = totalSteps > 0 ? index / totalSteps : 0;
      const targetScroll = st.start + targetProgress * (st.end - st.start);
      if (window.__lenis) {
        window.__lenis.scrollTo(targetScroll, { duration: 1.0 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping.current = true;
      if (deltaX < 0) {
        if (activeImageIndex < productImages.length - 1) {
          handleSelectImage(activeImageIndex + 1);
        }
      } else {
        if (activeImageIndex > 0) {
          handleSelectImage(activeImageIndex - 1);
        }
      }
    }
  };

  const handleImageInspectClick = () => {
    if (isSwiping.current) return;
    audioSystem.playClick(800);
    setLightboxOpen(true);
  };

  const handleMouseMoveTilt = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setTilt({ rotateX, rotateY, scale: 1.02 });
  };

  const handleMouseLeaveTilt = () => {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleAddToCart = () => {
    if (isOutOfStock) {
      audioSystem.playClick(400);
      return;
    }
    audioSystem.playClick(900);
    setAdded(true);
    if (onAddToCart) {
      if (selectedTier && selectedTier.id !== "standard" && selectedTier.totalQty > 1) {
        onAddToCart({
          id: String(product.id),
          name: product.name,
          price: bundleFinalPrice,
          originalPrice: rawTotalPrice,
          discountPercentage: selectedTier.discountPercentage,
          offerTag: selectedTier.tag || offerTagLabel,
          size: selectedSize,
          color: selectedColor,
          image: productImages && productImages.length > 0 ? productImages[0] : product.image,
          quantity: 1,
          bogoTier: {
            id: selectedTier.id,
            name: selectedTier.name,
            tag: selectedTier.tag,
            buyQty: selectedTier.buyQty,
            getQty: selectedTier.getQty,
            totalQty: selectedTier.totalQty,
            discountPercentage: selectedTier.discountPercentage,
            badgeText: selectedTier.badgeText,
            originalPrice: rawTotalPrice,
            bundlePrice: bundleFinalPrice,
            bundleItemsSummary: `Includes ${selectedTier.totalQty} Units (${selectedTier.buyQty} Paid + ${selectedTier.getQty} Free • Size ${selectedSize})`,
          },
        });
      } else {
        onAddToCart({
          id: String(product.id),
          name: product.name,
          price: finalSellingPrice,
          originalPrice: baseNumericPrice,
          discountPercentage: discountPercent,
          offerTag: offerTagLabel,
          size: selectedSize,
          color: selectedColor,
          image: productImages && productImages.length > 0 ? productImages[0] : product.image,
          quantity: 1,
        });
      }
    }

    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    audioSystem.playClick(900);
    const token = typeof window !== "undefined" ? localStorage.getItem("drapza_token") : null;
    if (token) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  const titleWords = (product.name || "").trim().split(/\s+/);
  const firstWord = titleWords[0] || "";
  const secondWord = titleWords.slice(1).join(" ");

  return (
    <>
      <div className="product-hero-container w-full">
        <section
          ref={galleryRef}
          className="product-gallery-section relative flex min-h-[100svh] w-full flex-col lg:flex-row overflow-hidden bg-white"
        >
          {/* 1. IMAGE GALLERY STICKY VIEWPORT (FIRST ON MOBILE) */}
          <div
            data-cursor
            data-cursor-label="INSPECT"
            onMouseMove={handleMouseMoveTilt}
            onMouseLeave={handleMouseLeaveTilt}
            className="product-gallery-sticky relative w-full lg:w-1/2 shrink-0 order-1 lg:order-2 h-[88vh] min-h-[560px] max-h-[960px] sm:h-[90vh] sm:min-h-[680px] sm:max-h-[1050px] lg:h-auto lg:min-h-svh lg:max-h-none overflow-hidden bg-neutral-100 lg:perspective-[1200px] pt-14 sm:pt-16 lg:pt-0"
          >
            {/* Zoom Lightbox Trigger Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                audioSystem.playClick(800);
                setLightboxOpen(true);
              }}
              aria-label="Inspect fabric details in high resolution"
              className="absolute top-20 sm:top-24 lg:top-4 right-4 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-black/90 text-white font-mono-technical text-[10px] uppercase tracking-wider backdrop-blur-md hover:bg-black transition-all cursor-pointer shadow-lg select-none"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>INSPECT FABRIC</span>
            </button>

            <div
              ref={viewportRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={handleImageInspectClick}
              style={{
                transform: tilt.scale !== 1 ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})` : undefined,
                transition: tilt.scale === 1 ? "transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1)" : "transform 0.1s ease-out",
              }}
              className="image-viewport relative h-full w-full overflow-hidden select-none cursor-zoom-in"
            >
              {/* Mobile Direct Active View (Strictly fixed in absolute frame - zero layout jumping) */}
              <div className="lg:hidden absolute inset-0 h-full w-full flex items-center justify-center bg-neutral-100 overflow-hidden">
                <img
                  key={`mobile-${selectedColor}-${activeImageIndex}-${productImages[activeImageIndex] || productImages[0]}`}
                  src={productImages[activeImageIndex] || productImages[0]}
                  alt={`${product.name} view ${activeImageIndex + 1}`}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-cover object-[center_top] select-none pointer-events-none"
                />
              </div>

              {/* Desktop GSAP Scroll-Pinned Card Stack */}
              <div className="hidden lg:block absolute inset-0 h-full w-full">
                {productImages.map((image: string, index: number) => (
                  <div
                    key={`desktop-${selectedColor}-${index}-${image}`}
                    className="product-slide product-snapshot absolute inset-0 h-full w-full will-change-transform flex items-center justify-center overflow-hidden bg-neutral-100 p-0"
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="product-image h-full w-full object-cover object-[center_top] will-change-transform filter brightness-[1.02] select-none pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* THUMBNAIL NAVIGATION (ANIMATED ATELIER DOCK) */}
            <div className="thumbnail-navigation absolute bottom-3.5 left-3.5 sm:bottom-6 sm:left-6 z-30 flex flex-row lg:flex-col items-center gap-2 p-2 sm:p-2.5 rounded-none bg-white/90 backdrop-blur-xl border border-black/10 shadow-[0_10px_35px_rgba(0,0,0,0.12)] max-w-[calc(100vw-28px)] overflow-x-auto no-scrollbar transition-all duration-300">
              {/* Miniature Live Counter Indicator (Desktop) */}
              <div className="hidden lg:flex items-center justify-between w-full px-1.5 pb-1.5 border-b border-black/5">
                <span className="font-mono-technical text-[10px] font-bold tracking-widest text-neutral-900">
                  0{activeImageIndex + 1}
                </span>
                <span className="w-1.5 h-1.5 rounded-none bg-black animate-pulse" />
                <span className="font-mono-technical text-[9px] tracking-wider text-neutral-400">
                  0{productImages.length}
                </span>
              </div>

              {/* Thumbnail Stack with Dynamic Zoom & Highlight Animation */}
              <div className="flex flex-row lg:flex-col gap-2 sm:gap-2.5 relative">
                {productImages.map((image: string, index: number) => {
                  const isActive = activeImageIndex === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      data-cursor
                      data-cursor-label="VIEW"
                      aria-label={`Select product image ${index + 1} of ${productImages.length}`}
                      aria-pressed={isActive}
                      onClick={() => handleSelectImage(index)}
                      className={`group relative h-18 w-13 sm:h-22 sm:w-16 lg:h-26 lg:w-19 shrink-0 overflow-hidden rounded-none border transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) cursor-pointer ${isActive
                        ? "border-black ring-2 ring-black/25 scale-105 shadow-lg bg-white opacity-100 z-10"
                        : "border-neutral-300 opacity-65 hover:opacity-100 hover:scale-102 hover:border-neutral-500 bg-neutral-100"
                        }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className={`h-full w-full object-cover transition-all duration-500 ease-out ${isActive ? "scale-110 brightness-[1.03]" : "scale-100 grayscale-[25%] group-hover:grayscale-0"
                          }`}
                      />

                      {/* Active Accent Indicator on Scroll */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 ring-1 ring-inset ring-white/50 pointer-events-none rounded-none" />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black animate-pulse" />
                          <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-black opacity-75"></span>
                            <span className="relative inline-flex rounded-none h-1.5 w-1.5 bg-black"></span>
                          </span>
                        </>
                      )}

                      {!isActive && (
                        <span className="absolute bottom-0.5 right-0.5 font-mono-technical text-[7px] font-bold text-neutral-600 bg-white/85 px-1 py-0.2 rounded-none backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          0{index + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scroll Progress Rail Indicator */}
              <div className="hidden lg:block w-full h-1 bg-neutral-200/70 rounded-none overflow-hidden mt-0.5">
                <div
                  className="h-full bg-black transition-all duration-300 ease-out rounded-none"
                  style={{
                    width: `${((activeImageIndex + 1) / productImages.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2. PRODUCT META / TEXT & CONTROLS (SECOND ON MOBILE) */}
          <div
            ref={metaRef}
            className="w-full lg:w-1/2 flex-1 bg-white z-20 order-2 lg:order-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-6 sm:pt-8 lg:pt-12 pb-8 sm:pb-12 lg:pb-16"
          >
            <div className="flex flex-col gap-3.5 sm:gap-4.5 w-full max-w-xl xl:max-w-2xl mx-auto">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {/* Breadcrumb Navigation & Share Trigger (Hidden on Mobile) */}
                <div className="hidden sm:flex items-center justify-between gap-2 mb-2 sm:mb-3">
                  <nav aria-label="Breadcrumb" className="hero-breadcrumb flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
                    <a
                      href="/"
                      data-cursor
                      data-cursor-label="HOME"
                      onClick={(e) => {
                        if (onClose) {
                          e.preventDefault();
                          onClose();
                        }
                      }}
                      className="font-mono-technical text-[10px] sm:text-xs uppercase font-medium text-neutral-600 hover:text-black transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span className="text-[9px] text-neutral-400">&#9654;</span> HOME
                    </a>
                    <span className="font-mono-technical text-[10px] sm:text-xs text-neutral-300 shrink-0">/</span>
                    <span className="font-mono-technical text-[10px] sm:text-xs uppercase font-medium text-neutral-600 shrink-0">
                      {product.category || "PALAZZO/BOTTOM"}
                    </span>
                    <span className="font-mono-technical text-[10px] sm:text-xs text-neutral-300 shrink-0">/</span>
                    <span className="font-mono-technical text-[10px] sm:text-xs uppercase font-bold text-black truncate max-w-[130px] sm:max-w-[260px]">
                      {product.name}
                    </span>
                  </nav>

                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(750);
                      setShareModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-neutral-300 bg-neutral-50 hover:bg-black hover:text-white hover:border-black font-mono-technical text-[10px] sm:text-[11px] uppercase font-bold text-neutral-800 transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Share this product"
                    aria-label="Share this product"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>SHARE</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {/* 1. PRODUCT TITLE (Solid luxury typography) */}
                  <h1 className="hero-product-title font-sans text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black uppercase leading-[1.08] break-words">
                    {product.name}
                  </h1>

                  {/* 2. PRICE & IN-STOCK ROW */}
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    {(() => {
                      const baseNumericPrice = product.numericPrice || (typeof product.price === "number" ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 1290);
                      const hasActiveDiscount = Boolean(
                        product.discountTagActive !== false &&
                        (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < baseNumericPrice) || Boolean(product.offerTag))
                      );

                      const discountPercent = Number(product.discountPercentage) > 0
                        ? Number(product.discountPercentage)
                        : (product.discountPrice && product.discountPrice < baseNumericPrice)
                          ? Math.round(((baseNumericPrice - product.discountPrice) / baseNumericPrice) * 100)
                          : 0;

                      const finalSellingPrice = hasActiveDiscount
                        ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < baseNumericPrice
                          ? product.discountPrice
                          : discountPercent > 0
                            ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
                            : baseNumericPrice)
                        : baseNumericPrice;

                      const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

                      return (
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <p className="font-sans text-2xl sm:text-3xl md:text-4xl text-black font-bold tracking-tight">
                            ₹{(Boolean((product as any).isMember) && Number((product as any).memberPrice) > 0 ? Number((product as any).memberPrice) : finalSellingPrice).toLocaleString("en-IN")}
                          </p>
                          {hasActiveDiscount && finalSellingPrice < baseNumericPrice && (
                            <span className="font-sans text-base sm:text-xl text-neutral-400 line-through font-normal">
                              ₹{baseNumericPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          {hasActiveDiscount && offerTagLabel && (
                            <span className="font-mono-technical text-[9.5px] uppercase tracking-wider bg-black text-white font-medium px-2 py-0.5 rounded-none">
                              {offerTagLabel}
                            </span>
                          )}
                          {Boolean((product as any).isMember) && (
                            <span className="font-mono-technical text-[9.5px] uppercase tracking-wider bg-black text-white font-bold px-2 py-0.5 rounded-none">
                              ★ VIP MEMBER PRICE
                            </span>
                          )}
                          {!Boolean((product as any).isMember) && Boolean((product as any).memberPricePreview) && (
                            <Link href="/membership" className="font-mono-technical text-[9.5px] uppercase tracking-wider text-neutral-800 bg-neutral-200 hover:bg-neutral-300 font-medium px-2 py-0.5 rounded-none transition">
                              MEMBER PRICE: ₹{Number((product as any).memberPricePreview).toLocaleString("en-IN")} WITH CLUB →
                            </Link>
                          )}
                          {hasActiveDiscount && discountPercent > 0 && (
                            <span className="font-mono-technical text-[9.5px] uppercase tracking-wider text-neutral-600 font-medium">
                              SAVE ₹{(baseNumericPrice - finalSellingPrice).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Clean In-Stock / Out-of-Stock Indicator */}
                    {isOutOfStock ? (
                      <span className="font-mono-technical text-[10px] uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        OUT OF STOCK &bull; CURRENTLY UNAVAILABLE
                      </span>
                    ) : availableStock <= 5 ? (
                      <span className="font-mono-technical text-[10px] uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        ONLY {availableStock} {availableStock === 1 ? "PIECE" : "PIECES"} LEFT &bull; SHIPS IN 24H
                      </span>
                    ) : (
                      <span className="font-mono-technical text-[10px] uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        IN STOCK &bull; SHIPS IN 24H
                      </span>
                    )}
                  </div>

                  {/* 3. CLEAN UNIFIED STATUS STRIP (Reviews, Urgency, Live Viewers) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 text-neutral-600 text-[11px] font-mono-technical uppercase tracking-wider flex-wrap pt-0.5">
                    <a
                      href="#product-reviews-section"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("product-reviews-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1 hover:text-black transition-colors cursor-pointer group shrink-0"
                    >
                      <Star
                        className={`w-3 h-3 ${(product.numReviews || 0) > 0
                          ? "fill-black text-black"
                          : "fill-neutral-200 text-neutral-300"
                          }`}
                      />
                      <span className="text-neutral-800 font-medium">
                        {(product.numReviews || 0) > 0
                          ? `${product.ratings} (${product.numReviews} ${product.numReviews === 1 ? "review" : "reviews"})`
                          : "No reviews yet"}
                      </span>
                    </a>

                    <span className="text-neutral-300 select-none">&bull;</span>

                    <span className="inline-flex items-center gap-1.5 text-neutral-800 font-medium shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Only 3 left in {selectedSize}
                    </span>

                    <span className="text-neutral-300 select-none hidden xs:inline">&bull;</span>

                    <span className="hidden xs:inline-flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      14 viewing
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-neutral-200/60 my-1" />
              </div>

              <div className="flex flex-col gap-3 sm:gap-3.5">
                {/* Description */}
                <p className="hero-desc w-full max-w-xl font-sans text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal">
                  {product.description ||
                    "Wide-flare chanderi palazzo pants engineered with high-waist elasticated waistband, deep side pockets, and rich flowing bottom sweep."}
                </p>

                {/* Color Swatch Selector with preview circle on right */}
                <div className="hero-controls flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="font-mono-technical text-xs uppercase tracking-widest text-black font-bold">
                      COLOR SHADE
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-technical text-[10px] uppercase text-neutral-800 font-bold tracking-wider">
                        SELECTED: {getColorName(selectedColor)}
                      </span>
                      <span
                        className="w-4.5 h-4.5 rounded-full border border-neutral-300 shadow-inner inline-block shrink-0 transition-colors duration-300"
                        style={{ backgroundColor: selectedColor }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {colors.map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          data-cursor
                          data-cursor-label="COLOR"
                          aria-label={`Select color ${color}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            audioSystem.playClick(500);
                            setSelectedColor(color);
                          }}
                          className={`relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${isSelected
                            ? "h-11 w-11 border-2 border-black ring-2 ring-black/30 ring-offset-2 scale-105"
                            : "h-9.5 w-9.5 border border-neutral-300 hover:scale-105"
                            }`}
                        >
                          <span
                            className="block h-7.5 w-7.5 rounded-full shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector with brutalist sharp edges */}
                <div className="hero-controls flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="font-mono-technical text-xs uppercase tracking-widest text-black font-bold">
                      SELECT SIZE
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 rounded-none bg-neutral-100 p-1.5 border border-neutral-300">
                      {sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            data-cursor
                            data-cursor-label="SIZE"
                            aria-label={`Select garment size ${size}`}
                            aria-pressed={isSelected}
                            onClick={() => {
                              audioSystem.playClick(600);
                              setSelectedSize(size);
                            }}
                            className={`min-w-[54px] sm:min-w-[62px] h-11 sm:h-12 px-4.5 sm:px-5.5 py-2.5 sm:py-3 font-mono-technical text-xs sm:text-sm uppercase font-bold tracking-wider transition-all duration-150 rounded-none cursor-pointer flex items-center justify-center ${isSelected
                              ? "bg-black text-white shadow-md scale-102 font-bold"
                              : "text-neutral-800 hover:text-black hover:bg-neutral-200/80"
                              }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* BOGO & MULTI-PIECE BUNDLE OFFER SELECTOR */}
                {bogoConfig.isEnabled && activeTiers.length > 0 && (
                  <div className="hero-controls flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-none bg-neutral-50 border border-neutral-300 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-technical text-[11px] uppercase tracking-wider text-black font-bold flex items-center gap-1.5">
                          {bogoConfig.bannerNotice || bogoConfig.sectionTitle || "BUNDLE & SAVE MORE"}
                        </span>
                      </div>
                      <span className="font-mono-technical text-[9px] sm:text-[10px] uppercase text-neutral-500 font-semibold tracking-wider">
                        SELECT OFFER TIER
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeTiers.map((tier) => {
                        const isSelected = selectedTierId === tier.id;
                        const tierRawTotal = basePrice * tier.totalQty;
                        const tierDiscount = Math.round((tierRawTotal * tier.discountPercentage) / 100);
                        const tierFinal = tierRawTotal - tierDiscount;
                        const tierPerUnit = Math.round(tierFinal / tier.totalQty);
                        const tierSavings = tierRawTotal - tierFinal;

                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => {
                              audioSystem.playClick(600);
                              setSelectedTierId(tier.id);
                            }}
                            className={`relative text-left p-3 rounded-none border transition-all cursor-pointer flex flex-col justify-between group ${isSelected
                              ? "bg-black text-white border-black shadow-xs"
                              : "bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-100/70"
                              }`}
                          >
                            {tier.badgeText && (
                              <span
                                className={`absolute -top-2.5 right-2.5 px-2 py-0.5 rounded-none font-mono-technical text-[8px] uppercase tracking-wider font-bold shadow-xs ${isSelected
                                  ? "bg-white text-black ring-1 ring-black/20"
                                  : "bg-black text-white"
                                  }`}
                              >
                                {tier.badgeText}
                              </span>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? "border-white bg-white text-black" : "border-neutral-400 bg-white"
                                    }`}>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-none bg-black" />}
                                  </span>
                                  <span className="font-mono-technical text-[11px] font-bold uppercase tracking-wider block">
                                    {tier.name}
                                  </span>
                                </div>
                                <span className={`font-mono-technical text-[9px] uppercase tracking-tight block mt-1 ml-4.5 ${isSelected ? "text-neutral-300" : "text-neutral-600"
                                  }`}>
                                  {tier.totalQty > 1 ? `₹${tierPerUnit.toLocaleString("en-IN")} / piece` : "Standard piece"}
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono-technical text-xs font-bold block">
                                  ₹{tierFinal.toLocaleString("en-IN")}
                                </span>
                                {tierSavings > 0 && (
                                  <span className={`font-mono-technical text-[9px] line-through block ${isSelected ? "text-neutral-400" : "text-neutral-400"
                                    }`}>
                                    ₹{tierRawTotal.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {tierSavings > 0 && (
                              <div className={`mt-2 pt-1.5 border-t flex items-center justify-between ${isSelected ? "border-white/15" : "border-neutral-200"
                                }`}>
                                <span className={`font-mono-technical text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-neutral-200" : "text-neutral-900"
                                  }`}>
                                  Save ₹{tierSavings.toLocaleString("en-IN")} ({tier.discountPercentage}% OFF)
                                </span>
                                <span className={`font-mono-technical text-[8px] uppercase font-semibold ${isSelected ? "text-neutral-300" : "text-neutral-500"
                                  }`}>
                                  {tier.buyQty} Buy + {tier.getQty} Free
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interactive Pincode Delivery Estimator */}
                <PincodeEstimator />

                {/* Technical Accordion Details */}
                <div className="hero-accordion">
                  <ProductAccordion product={product} />
                </div>
              </div>

              {/* Magnetic Fluid Action Buttons */}
              <div ref={mainActionRef} className="flex flex-col sm:flex-row w-full max-w-[800px] gap-2 sm:gap-2.5 pt-1 sm:pt-1.5">
                <MagneticButton
                  dataCursorLabel={isOutOfStock ? "SOLD" : "ADD"}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    opacity: isOutOfStock ? 0.6 : 1,
                  }}
                  className="w-full sm:flex-1 rounded-none bg-black px-5 py-3.5 sm:py-4 font-mono-technical text-xs uppercase font-medium tracking-widest text-white transition-all hover:bg-neutral-900 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  {isOutOfStock ? (
                    <span>OUT OF STOCK</span>
                  ) : added ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>Added to bag ✓</span>
                    </>
                  ) : (
                    <span>Add to bag • ₹{bundleFinalPrice.toLocaleString("en-IN")}</span>
                  )}
                </MagneticButton>

                <MagneticButton
                  dataCursorLabel={isOutOfStock ? "SOLD" : "BUY"}
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  style={{
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    opacity: isOutOfStock ? 0.6 : 1,
                  }}
                  className="w-full sm:flex-1 rounded-none bg-neutral-800 px-5 py-3.5 sm:py-4 font-mono-technical text-xs uppercase font-medium tracking-widest text-white transition-all hover:bg-neutral-900 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  {isOutOfStock ? "UNAVAILABLE" : `Buy now • ₹${bundleFinalPrice.toLocaleString("en-IN")}`}
                </MagneticButton>
              </div>

              {/* Secondary Action Buttons: Collaborative Bag & Product Sharing */}
              <div className="w-full max-w-[800px] pt-0.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(750);
                    if (roomCode) {
                      addToCoCart(product, selectedSize, colors[0]);
                    } else {
                      openStartModal();
                    }
                  }}
                  className="w-full rounded-none border border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100 px-4 py-3 font-mono-technical text-xs uppercase font-medium tracking-wider text-neutral-800 hover:text-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <Users className="w-4 h-4 text-black group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{roomCode ? "Add to Shared Bag" : "Shop Together with Friends"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(750);
                    setShareModalOpen(true);
                  }}
                  className="w-full rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 px-4 py-3 font-mono-technical text-xs uppercase font-medium tracking-wider text-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <Share2 className="w-4 h-4 text-black group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Share This Piece</span>
                </button>
              </div>

              {/* Bespoke Monogramming Customizer Trigger */}
              <div className="w-full max-w-[800px] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(700);
                    setMonogramModalOpen(true);
                  }}
                  className="w-full rounded-none border border-neutral-300 hover:border-black bg-neutral-100 hover:bg-neutral-200/80 px-4 py-3 font-mono-technical text-xs uppercase font-medium tracking-wider text-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <Scissors className="w-4 h-4 text-black group-hover:scale-110 transition-transform shrink-0" />
                  <span>Add Bespoke Monogram Embroidery (+₹250)</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MOBILE STICKY BOTTOM QUICK ACTION BAR */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200 px-4 py-2.5 transition-transform duration-300 ease-out shadow-[0_-10px_30px_rgba(0,0,0,0.12)] ${showMobileStickyBar ? "translate-y-0" : "translate-y-full pointer-events-none"
          }`}
      >
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-12 rounded-none bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-mono-technical text-[10px] text-neutral-500 uppercase tracking-wider truncate">
                SIZE: {selectedSize} {selectedTier && selectedTier.totalQty > 1 ? `(${selectedTier.tag})` : ""}
              </p>
              <p className="font-mono-technical text-sm font-bold text-black truncate">
                ₹{bundleFinalPrice.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Share Mobile Button */}
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(650);
                setShareModalOpen(true);
              }}
              className="p-2.5 rounded-none border border-neutral-300 bg-white text-black hover:bg-neutral-100 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer"
              aria-label="Share this product"
              title="Share this product"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                opacity: isOutOfStock ? 0.6 : 1,
              }}
              className="px-3.5 py-2.5 rounded-none bg-black text-white font-mono-technical text-xs uppercase font-bold tracking-wider hover:bg-neutral-900 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              {isOutOfStock ? (
                <span>OUT OF STOCK</span>
              ) : added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added ✓</span>
                </>
              ) : (
                <span>Add to Bag</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                opacity: isOutOfStock ? 0.6 : 1,
              }}
              className="px-3 py-2.5 rounded-none bg-neutral-800 text-white font-mono-technical text-xs uppercase font-bold tracking-wider hover:bg-neutral-900 active:scale-95 transition-all shadow-sm"
            >
              {isOutOfStock ? "Sold" : "Buy"}
            </button>
          </div>
        </div>
      </div>

      {/* FABRIC LIGHTBOX MODAL */}
      <FabricLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={productImages}
        currentIndex={activeImageIndex}
        productTitle={product.name}
      />

      {/* BESPOKE CUSTOM SIZE APPOINTMENT MODAL */}
      <BookCustomSizeModal
        isOpen={customSizeModalOpen}
        onClose={() => setCustomSizeModalOpen(false)}
        product={{
          id: String(product.id),
          name: product.name,
          image: product.image,
          price: product.price,
          color: selectedColor,
        }}
      />

{/* SHARE PRODUCT TRANSMISSION MODAL */ }
<ShareProductModal
  isOpen={shareModalOpen}
  onClose={() => setShareModalOpen(false)}
  product={product}
/>

{/* BESPOKE MONOGRAMMING CUSTOMIZER MODAL */ }
<MonogramCustomizerModal
  isOpen={monogramModalOpen}
  onClose={() => setMonogramModalOpen(false)}
  productName={product.name}
  productImage={product.image}
  productPrice={product.numericPrice || 1400}
/>
    </>
  );
}

// ── PRODUCT DETAILS SECTION ──────────────────────────────────────────────────
export function ProductDetails({ product }: { product: ProductDetailData }) {
  const detailsRef = useRef<HTMLElement>(null);
  const detailsImage =
    product.detailsImage ||
    (product.images && product.images[1]) ||
    product.image;

  const detailsText = Array.isArray(product.details)
    ? product.details.join(" ")
    : product.details ||
    "Artfully designed with heritage craftsmanship, featuring fluid drapes and hand-finished detailing for an effortless luxury silhouette.";

  useEffect(() => {
    if (typeof window === "undefined" || !detailsRef.current) return;
    const ctx = gsap.context(() => {
      // Safely animate the outer frame without overriding inner <img> opacity
      const imageFrame = detailsRef.current?.querySelector(".details-image-frame");
      if (imageFrame) {
        gsap.fromTo(
          imageFrame,
          { opacity: 0.85, scale: 0.98 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.0,
            ease: "power2.out",
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: detailsRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      const headings = detailsRef.current?.querySelectorAll("h2, p, .details-badge");
      if (headings && headings.length) {
        gsap.fromTo(
          headings,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: detailsRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }
    }, detailsRef);

    return () => ctx.revert();
  }, [product]);

  return (
    <section
      ref={detailsRef}
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden lg:flex-row bg-white border-t border-neutral-200"
    >
      {/* IMAGE */}
      <div className="details-image-frame relative h-[45svh] sm:h-[50svh] lg:h-full lg:min-h-full min-h-[360px] sm:min-h-[480px] lg:min-h-[700px] w-full flex-1 self-stretch overflow-hidden bg-neutral-100">
        <ImageWithSkeleton
          src={detailsImage}
          alt={product.name}
          wrapperClassName="h-full w-full min-h-full"
          className="h-full w-full object-cover object-[center_top]"
        />
      </div>

      {/* COPY */}
      <div className="flex min-h-[50svh] lg:min-h-full w-full flex-1 items-center justify-center bg-white self-stretch">
        <div className="flex h-full w-full max-w-[90%] flex-col justify-center bg-white p-6 sm:p-10 lg:p-16">
          <span className="mb-4 sm:mb-6 font-mono-technical text-xs uppercase tracking-widest text-neutral-700">
            ATELIER CRAFT &amp; HERITAGE
          </span>

          <h2 className="mb-4 sm:mb-6 font-sans text-3xl sm:text-5xl lg:text-7xl font-medium uppercase tracking-tight text-black">
            {product.detailTitle || "Crafted for effortless elegance."}
          </h2>

          <p className="max-w-[42ch] font-sans text-sm sm:text-base leading-relaxed text-neutral-600">
            {detailsText}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap gap-2">
            {[
              product.fabric || "Pure Modal Silk",
              product.fit || "Tailored Silhouette",
              "Handcrafted Detailing",
              "Ethically Made in India",
            ].map((badge, idx) => (
              <span
                key={idx}
                className="details-badge rounded-full bg-neutral-100 px-2.5 sm:px-3 py-1 font-mono-technical text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-black border border-neutral-200"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── COMPATIBLE UNITS / RELATED PRODUCTS ─────────────────────────────────────
export function RelatedProducts({
  products,
  onSelectProduct,
  onAddToCart,
}: {
  products: RelatedProductItem[];
  onSelectProduct: (slug: string) => void;
  onAddToCart?: (item: RelatedProductItem & { selectedSize?: string }) => void;
}) {
  const [addedIds, setAddedIds] = useState<(string | number)[]>([]);
  const [cardSizes, setCardSizes] = useState<Record<string | number, string>>({});
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".related-product-card");
      if (cards && cards.length) {
        gsap.from(cards, {
          y: 25,
          duration: 0.6,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [products]);

  const handleCardClick = (product: RelatedProductItem) => {
    audioSystem.playClick(700);
    onSelectProduct(product.slug);
  };

  const handleAddToCartClick = (e: React.MouseEvent, product: RelatedProductItem) => {
    e.stopPropagation();
    audioSystem.playClick(900);
    const chosenSize = cardSizes[product.id] || "M";
    setAddedIds((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
    if (onAddToCart) {
      onAddToCart({ ...product, selectedSize: chosenSize });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="bg-white py-12 sm:py-16 md:py-24 border-t border-neutral-200"
    >
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-neutral-200">
          <div>
            <p className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neutral-700">
              CURATED SELECTION
            </p>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,4.5rem)] leading-none uppercase tracking-tight text-black font-normal">
              Related Garments
            </h2>
          </div>

          <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.15em] text-neutral-700 font-semibold">
            {products.length} Selected Pieces
          </span>
        </div>

        {/* 4 Cards Grid - 2 Cols on Mobile, 4 Cols on Desktop */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 items-stretch">
          {products.slice(0, 4).map((product) => {
            const isAdded = addedIds.includes(product.id);
            const currentSize = cardSizes[product.id] || "M";
            const hasDiscount = Boolean(
              product.discountTagActive !== false &&
              (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.numericPrice)) || Boolean(product.offerTag))
            );
            const discountTagText = product.offerTag || (product.discountPercentage ? `${product.discountPercentage}% OFF` : "");

            return (
              <div
                key={product.id}
                data-cursor
                data-cursor-label="VIEW"
                onClick={() => handleCardClick(product)}
                className="related-product-card flex flex-col justify-between bg-[#f5f5f5] hover:bg-[#ebebeb] p-2.5 sm:p-4 lg:p-5 transition-all duration-300 w-full cursor-pointer group border border-black/10 rounded-none shadow-sm hover:shadow-xl hover:-translate-y-1 opacity-100"
              >
                {/* Model Image Frame */}
                <div className="relative block h-[260px] sm:h-[380px] md:h-[480px] lg:h-[540px] w-full overflow-hidden rounded-none bg-transparent flex items-center justify-center p-1 sm:p-2">
                  <ImageWithSkeleton
                    src={product.image}
                    alt={product.name}
                    wrapperClassName="h-full w-full flex items-center justify-center"
                    className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105 filter brightness-[1.0] contrast-[1.02]"
                  />

                  {/* Top Left View Tag */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 opacity-0 group-hover:opacity-100 transition-opacity font-mono-technical text-[8px] sm:text-[10px] uppercase tracking-widest bg-black text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-none">
                    VIEW →
                  </span>

                  {/* Top Right Offer Tag if on promo */}
                  {hasDiscount && discountTagText && (
                    <span className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 font-mono-technical text-[8px] sm:text-[9.5px] uppercase tracking-wider bg-red-600 text-white font-black px-1.5 py-0.5 rounded-none shadow-md">
                      {discountTagText}
                    </span>
                  )}

                  {/* Size Selector Bar on Hover / Mobile */}
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-[calc(100%-4rem)] max-w-[175px] sm:bottom-3 sm:max-w-[185px] z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 rounded-none bg-black/90 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md shadow-xl border border-white/15">
                    <span className="font-mono-technical text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-400 font-bold shrink-0">
                      SIZE
                    </span>
                    <div className="h-3 w-[1px] bg-white/20 shrink-0 mx-0.5" />
                    <div className="grid grid-cols-4 gap-1 flex-1">
                      {["S", "M", "L", "XL"].map((sz) => {
                        const isSelected = currentSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            data-cursor
                            data-cursor-label={`SIZE ${sz}`}
                            aria-label={`Select size ${sz} for ${product.name}`}
                            aria-pressed={isSelected}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              audioSystem.playClick(600);
                              setCardSizes((prev) => ({ ...prev, [product.id]: sz }));
                            }}
                            className={`w-full py-0.5 sm:py-1 rounded-none font-mono-technical text-[9px] sm:text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${isSelected
                              ? "bg-white text-black shadow-sm font-black"
                              : "text-neutral-300 hover:text-white hover:bg-white/10"
                              }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 sm:mt-4">
                  {/* Name Left & Price Right */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-0.5 mb-2 sm:mb-3.5 gap-0.5">
                    <div>
                      <h3 className="font-mono-technical text-[11px] sm:text-xs md:text-sm uppercase tracking-wider font-semibold text-black truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono-technical text-[9px] sm:text-[10px] text-neutral-700 font-medium uppercase">
                          SIZE: {currentSize}
                        </span>
                        {product.category && (
                          <span className="font-mono-technical text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-500 bg-neutral-200/80 px-1.5 py-0.2">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="font-mono-technical text-[11px] sm:text-xs md:text-sm font-semibold text-black">
                        {product.discountPrice && Number(product.discountPrice) > 0
                          ? `₹${Number(product.discountPrice).toLocaleString("en-IN")}`
                          : typeof product.price === "number"
                            ? `₹${product.price.toLocaleString("en-IN")}`
                            : product.price}
                      </span>
                      {hasDiscount && product.numericPrice && product.discountPrice && product.discountPrice < product.numericPrice && (
                        <span className="font-mono-technical text-[9px] text-neutral-500 line-through">
                          ₹{Number(product.numericPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Black Full Width ADD TO CART button */}
                  <button
                    type="button"
                    data-cursor
                    data-cursor-label="ADD"
                    onClick={(e) => handleAddToCartClick(e, product)}
                    className={`w-full rounded-none py-2 sm:py-3 font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium transition-all cursor-pointer ${isAdded
                      ? "bg-neutral-800 text-white"
                      : "bg-black text-white hover:bg-neutral-900 active:scale-[0.98]"
                      }`}
                  >
                    {isAdded ? "ADDED ✓" : "ADD TO BAG"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── STICKY SMART FLOATING BUY BAR (BRUTALIST ATELIER) ───────────────────────
function StickyBuyBar({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  onAddToCart,
}: {
  product: ProductDetailData;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  selectedColor?: string;
  onAddToCart?: (item: CartItem) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [barAdded, setBarAdded] = useState(false);
  const { showToast } = useToast();
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"];

  const baseNumericPrice = Number(product.numericPrice) || (typeof product.price === "number" ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 990);
  const hasActiveDiscount = Boolean(
    product.discountTagActive !== false &&
    (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < baseNumericPrice) || Boolean(product.offerTag))
  );

  const discountPercent = Number(product.discountPercentage) > 0
    ? Number(product.discountPercentage)
    : (product.discountPrice && product.discountPrice < baseNumericPrice)
      ? Math.round(((baseNumericPrice - product.discountPrice) / baseNumericPrice) * 100)
      : 0;

  const finalSellingPrice = hasActiveDiscount
    ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < baseNumericPrice
      ? product.discountPrice
      : discountPercent > 0
        ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
        : baseNumericPrice)
    : baseNumericPrice;

  const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

  const colorMatch = product.colorImages?.find(
    (ci) => ci.color && selectedColor && ci.color.toLowerCase().trim() === selectedColor.toLowerCase().trim()
  );
  const activeThumb = (colorMatch && colorMatch.images && colorMatch.images[0]) || product.image;

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      // Show sticky bar when scrolled past 650px
      if (window.scrollY > 650) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBarAdd = () => {
    audioSystem.playClick(900);
    setBarAdded(true);
    if (onAddToCart) {
      onAddToCart({
        id: String(product.id),
        name: product.name,
        price: finalSellingPrice,
        originalPrice: baseNumericPrice,
        discountPercentage: discountPercent,
        offerTag: offerTagLabel,
        size: selectedSize,
        color: selectedColor || product.colors?.[0] || "#7a726c",
        image: activeThumb,
        quantity: 1,
      });
    }

    showToast({
      title: product.name,
      description: `Size ${selectedSize} added to Atelier Bag`,
      type: "cart",
      image: activeThumb,
    });

    setTimeout(() => setBarAdded(false), 1800);
  };

  return (
    <div
      className={`fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-[620px] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) ${visible ? "translate-y-0 opacity-100 pointer-events-auto scale-100" : "translate-y-20 opacity-0 pointer-events-none scale-95"
        }`}
    >
      <div className="relative overflow-hidden flex items-center justify-between gap-2 sm:gap-3 rounded-none bg-[#0a0a0a]/95 p-2 sm:p-2.5 pl-2.5 sm:pl-4 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-white group">
        {/* Subtle Ambient Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-none overflow-hidden bg-white/10 shrink-0 border border-white/15 p-0.5">
            <img
              src={activeThumb}
              alt={product.name}
              className="h-full w-full object-cover rounded-none"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="font-mono-technical text-[10px] xs:text-[11px] sm:text-xs font-bold uppercase truncate text-white tracking-wide max-w-[120px] xs:max-w-[170px] sm:max-w-none">
                {product.name}
              </p>
              {hasActiveDiscount && offerTagLabel && (
                <span className="font-mono-technical text-[8px] uppercase bg-red-600 text-white font-black px-1.5 py-0.2 rounded-none shrink-0">
                  {offerTagLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="font-mono-technical text-[10px] xs:text-[11px] text-white font-bold">
                ₹{finalSellingPrice.toLocaleString("en-IN")}
              </span>
              {hasActiveDiscount && finalSellingPrice < baseNumericPrice && (
                <span className="font-mono-technical text-[9px] text-neutral-400 line-through">
                  ₹{baseNumericPrice.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-white/20 text-xs">|</span>
              {/* Quick Size Switcher inside Sticky Bar */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {sizes.slice(0, 4).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    aria-label={`Select size ${sz}`}
                    aria-pressed={selectedSize === sz}
                    onClick={() => {
                      audioSystem.playClick(500);
                      setSelectedSize(sz);
                    }}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-none text-[8px] xs:text-[9px] font-mono-technical font-bold uppercase transition-all cursor-pointer ${selectedSize === sz
                      ? "bg-white text-black shadow-sm font-black"
                      : "text-neutral-300 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-cursor
          data-cursor-label="ADD"
          aria-label="Add product to bag"
          onClick={handleBarAdd}
          className="relative overflow-hidden rounded-none bg-white px-3.5 sm:px-5 py-2.5 font-mono-technical text-[10px] xs:text-[11px] sm:text-xs uppercase font-bold text-black transition-all hover:bg-neutral-200 active:scale-95 cursor-pointer shrink-0 shadow-lg group/btn"
        >
          {barAdded ? (
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-black" />
              <span>ADDED ✓</span>
            </span>
          ) : (
            <span>ADD TO BAG</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── RECENTLY VIEWED SHELF COMPONENT ──────────────────────────────────────────
function RecentlyViewedShelf({
  currentProductId,
  onAddToCart,
  onSelectProduct,
}: {
  currentProductId: string;
  onAddToCart?: (item: CartItem) => void;
  onSelectProduct?: (product: ProductDetailData) => void;
}) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("drapza_recently_viewed_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((p: any) => String(p.id) !== currentProductId).slice(0, 6));
        }
      }
    } catch (e) { }
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section className="w-full bg-[#f8f9f6] border-t border-black/10 py-12 md:py-16">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-black/10 gap-3">
          <div>
            <span className="font-mono-technical text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold block mb-1">
              [ SESSION TELEMETRY ]
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-black font-normal">
              RECENTLY VIEWED GARMENTS
            </h2>
          </div>
          <span className="font-mono-technical text-xs uppercase text-neutral-600 font-medium">
            {items.length} ARCHIVED {items.length === 1 ? "PIECE" : "PIECES"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                audioSystem.playClick(700);
                if (onSelectProduct && item.slug) {
                  onSelectProduct(item);
                } else if (typeof window !== "undefined" && item.slug) {
                  window.location.href = `/wardrobe/${item.slug}`;
                }
              }}
              className="flex flex-col justify-between bg-white p-2.5 sm:p-3 rounded-none border border-black/10 hover:border-black/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.offerTag && (
                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-mono-technical text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-none shadow-xs">
                    {item.offerTag}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                <h3 className="font-mono-technical text-[11px] sm:text-xs uppercase font-bold text-black truncate">
                  {item.name}
                </h3>
                <span className="font-mono-technical text-[11px] text-neutral-800 font-semibold">
                  ₹{Number(item.numericPrice || item.price || 990).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── MAIN PRODUCT DETAIL COMPONENT ────────────────────────────────────────────
export function ProductDetail({
  product,
  onClose,
  onAddToCart,
  onSelectProduct,
  allProducts = [],
  isModal = false,
}: ProductDetailPageProps) {
  useLockBodyScroll(Boolean(isModal));

  if (!product) return <ProductDetailSkeleton />;

  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "#7a726c");
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 1
      ? product.sizes[1]
      : (product.sizes?.[0] || "M")
  );

  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[1] || product.sizes[0] || "M");
    }

    // Persist to Recently Viewed Storage
    try {
      const stored = localStorage.getItem("drapza_recently_viewed_v1");
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p: any) => String(p.id) !== String(product.id));
      const updated = [
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          numericPrice: product.numericPrice,
          image: product.image,
          category: product.category,
          offerTag: product.offerTag,
        },
        ...filtered,
      ].slice(0, 10);
      localStorage.setItem("drapza_recently_viewed_v1", JSON.stringify(updated));
    } catch (e) { }
  }, [product.id]);

  // Dynamically assemble related products:
  const relatedList: RelatedProductItem[] = useMemo(() => {
    // 1. If explicit relatedProducts are provided on the active product, use them
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      return product.relatedProducts
        .filter((p) => String(p.id) !== String(product.id) && p.slug !== product.slug)
        .slice(0, 4)
        .map((p) => {
          const baseNumericPrice = Number(p.numericPrice) || (typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 990);
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: typeof p.price === "number" ? `₹${p.price.toLocaleString("en-IN")}` : p.price,
            numericPrice: baseNumericPrice,
            discountPrice: p.discountPrice,
            discountPercentage: p.discountPercentage,
            discountTagActive: p.discountTagActive,
            offerTag: p.offerTag,
            image: p.image,
            category: p.category,
          };
        });
    }

    // 2. Otherwise dynamically derive from catalog (allProducts), prioritizing same category
    const currentIdStr = String(product.id);
    const otherProducts = (allProducts || []).filter(
      (p) => String(p.id) !== currentIdStr && p.slug !== product.slug
    );

    const targetCategory = product.category?.trim().toLowerCase();
    const sameCat = otherProducts.filter(
      (p) => p.category && p.category.trim().toLowerCase() === targetCategory
    );
    const otherCat = otherProducts.filter(
      (p) => !sameCat.some((sc) => String(sc.id) === String(p.id) || sc.slug === p.slug)
    );

    const merged = [...sameCat, ...otherCat];

    // Fallback static items if catalog has few items
    const fallbackList: ProductDetailData[] = [
      {
        id: "1",
        slug: "phase-field",
        name: "PHASE FIELD",
        price: "₹1440",
        numericPrice: 1440,
        image: "/images/drapza/products/product_1.png",
        category: "Outerwear Unit",
        colors: ["#1b1b1b"],
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "2",
        slug: "zone-artifact",
        name: "ZONE ARTIFACT",
        price: "₹1665",
        numericPrice: 1665,
        image: "/images/drapza/products/product_18.png",
        category: "Outerwear Unit",
        colors: ["#1b1b1b"],
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "3",
        slug: "cold-proxy",
        name: "COLD PROXY",
        price: "₹1395",
        numericPrice: 1395,
        image: "/images/drapza/products/product_11.png",
        category: "Outerwear Unit",
        colors: ["#1b1b1b"],
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "4",
        slug: "phantom-skin",
        name: "PHANTOM SKIN",
        price: "₹1520",
        numericPrice: 1520,
        image: "/images/drapza/products/product_4.png",
        category: "Outerwear Unit",
        colors: ["#1b1b1b"],
        sizes: ["S", "M", "L", "XL"],
      },
    ].filter((p) => String(p.id) !== currentIdStr && p.slug !== product.slug);

    const source = merged.length >= 4 ? merged : [...merged, ...fallbackList];

    // Deduplicate
    const seen = new Set<string>();
    const unique = source.filter((p) => {
      const key = String(p.id || p.slug);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.slice(0, 4).map((p: any) => {
      const baseNumericPrice = Number(p.numericPrice) || (typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 990);
      const displayPrice = typeof p.price === "number" ? `₹${Number(p.price).toLocaleString("en-IN")}` : String(p.price || `₹${baseNumericPrice}`);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: displayPrice,
        numericPrice: baseNumericPrice,
        discountPrice: p.discountPrice,
        discountPercentage: p.discountPercentage,
        discountTagActive: p.discountTagActive,
        offerTag: p.offerTag,
        image: p.image,
        category: p.category,
      };
    });
  }, [product, allProducts]);

  const handleRelatedAddToCart = (item: RelatedProductItem & { selectedSize?: string }) => {
    if (onAddToCart) {
      const found = allProducts.find((p) => String(p.id) === String(item.id) || p.slug === item.slug);
      const baseNumericPrice = Number(found?.numericPrice) || (typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 990);
      const hasActiveDiscount = Boolean(
        found?.discountTagActive !== false &&
        (Number(found?.discountPercentage) > 0 || (Number(found?.discountPrice) > 0 && Number(found?.discountPrice) < baseNumericPrice) || Boolean(found?.offerTag))
      );
      const discountPercent = Number(found?.discountPercentage) > 0
        ? Number(found?.discountPercentage)
        : (found?.discountPrice && found.discountPrice < baseNumericPrice)
          ? Math.round(((baseNumericPrice - found.discountPrice) / baseNumericPrice) * 100)
          : 0;
      const finalSellingPrice = hasActiveDiscount
        ? (found?.discountPrice && found.discountPrice > 0 && found.discountPrice < baseNumericPrice
          ? found.discountPrice
          : discountPercent > 0
            ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
            : baseNumericPrice)
        : baseNumericPrice;
      const offerTagLabel = found?.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

      onAddToCart({
        id: String(item.id),
        name: item.name,
        price: finalSellingPrice,
        originalPrice: baseNumericPrice,
        discountPercentage: discountPercent,
        offerTag: offerTagLabel,
        size: item.selectedSize || "M",
        color: found?.colors?.[0] || "#7a726c",
        image: item.image,
        quantity: 1,
      });
    }
  };

  const handleRelatedSelect = (slug: string) => {
    const found = allProducts.find((p) => p.slug === slug || String(p.id) === slug);
    if (found && onSelectProduct) {
      onSelectProduct(found);
    } else if (typeof window !== "undefined") {
      const isProductPath = window.location.pathname.startsWith("/product/");
      window.location.href = isProductPath ? `/product/${slug}` : `/wardrobe/${slug}`;
    }
  };

  const content = (
    <div className="w-full bg-white text-black relative">
      <ProductHero
        product={product}
        {...(onAddToCart ? { onAddToCart } : {})}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        onClose={onClose}
      />

      <ProductDetails product={product} />

      {/* Product Reviews & Fit Assessment Section */}
      <section id="product-reviews-section" className="w-full bg-neutral-50/50 border-t border-neutral-200">
        <ProductReviewsSection
          productId={String(product.id)}
          productSlug={product.slug}
          productName={product.name}
          productImage={product.image}
        />
      </section>

      <RelatedProducts
        products={relatedList}
        onSelectProduct={handleRelatedSelect}
        onAddToCart={handleRelatedAddToCart}
      />

      {/* Recently Viewed Garments Shelf */}
      <RecentlyViewedShelf
        currentProductId={String(product.id)}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
      />

      {/* Floating Sticky Buy Bar */}
      <StickyBuyBar
        product={product}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColor={selectedColor}
        onAddToCart={onAddToCart}
      />
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[999] overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-md flex flex-col items-center animate-fadeIn">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product view modal"
            className="fixed top-5 right-5 z-[1010] p-3 rounded-none bg-black/80 hover:bg-black text-white backdrop-blur-lg border border-white/20 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95"
            title="Close Product View"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="relative w-full min-h-screen bg-white text-black my-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export const ProductDetailPage = ProductDetail;
export default ProductDetail;
