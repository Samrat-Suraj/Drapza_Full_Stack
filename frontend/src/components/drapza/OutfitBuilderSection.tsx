"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import {
  Layers,
  Check,
  ShoppingBag,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { bundleApi } from "@/lib/api";
import { useToast } from "./ToastNotification";
import { MagneticButton } from "./MagneticButton";
import { triggerCartFly } from "./CartFlySystem";

export interface BundleItemData {
  id: string;
  name: string;
  price: number;
  formattedPrice?: string;
  image: string;
  layerNumber?: string;
  layerType?: string;
  subtitle?: string;
  tags?: string[];
  slug?: string;
}

export interface BundleConfigData {
  sectionTag?: string;
  headingLine1?: string;
  headingLine2?: string;
  discountPercent?: number;
  discountBadgeText?: string;
  ctaButtonText?: string;
  isEnabled?: boolean;
  items?: BundleItemData[];
}

const DEFAULT_BUNDLE_ITEMS: BundleItemData[] = [
  {
    id: "t1",
    name: "ANARKALI SILK EMBROIDERED KURTI",
    price: 1440,
    formattedPrice: "₹1,440",
    image: "/images/drapza/products/product_1.png",
    layerNumber: "LAYER 01",
    layerType: "PRIMARY TOP",
    subtitle: "AUTHENTICATED SILK KURTI",
    tags: ["PURE SILK", "ZARI WORK", "FLARED"],
    slug: "anarkali-embroidered-kurti",
  },
  {
    id: "o1",
    name: "ORGANZA HAND-EMBROIDERED DUPATTA",
    price: 750,
    formattedPrice: "₹750",
    image: "/images/drapza/products/product_11.png",
    layerNumber: "LAYER 02",
    layerType: "DUPATTA DRAPE",
    subtitle: "SCALLOPED BORDERS",
    tags: ["HANDCRAFTED", "AIRY ORGANZA", "2.5M LENGTH"],
    slug: "organza-embroidered-dupatta",
  },
  {
    id: "b1",
    name: "FLARED PLEATED CHANDERI PALAZZO",
    price: 890,
    formattedPrice: "₹890",
    image: "/images/drapza/products/product_6.png",
    layerNumber: "LAYER 03",
    layerType: "BOTTOM WEAR",
    subtitle: "HIGH-WAISTED PALAZZO",
    tags: ["WIDE FLARE", "POCKETS", "ELASTICATED"],
    slug: "flared-pleated-palazzo",
  },
];

const defaultBundleConfig: BundleConfigData = {
  sectionTag: "[ BUNDLE STACKER ]",
  headingLine1: "BUILD YOUR",
  headingLine2: "MODULAR OUTFIT.",
  discountPercent: 15,
  discountBadgeText: "BUNDLE DISPATCH (15% OFF)",
  ctaButtonText: "ADD BUNDLE",
  isEnabled: true,
  items: DEFAULT_BUNDLE_ITEMS,
};

interface OutfitBuilderSectionProps {
  onAddBundleToCart?: (items: { name: string; price: number; image: string }[]) => void;
  onAddToCart?: (items: { name: string; price: number; image: string }[]) => void;
}

export function OutfitBuilderSection({ onAddBundleToCart, onAddToCart }: OutfitBuilderSectionProps) {
  const [config, setConfig] = useState<BundleConfigData>(defaultBundleConfig);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await bundleApi.getBundleConfig();
        if (res && res.success && res.data && isMounted) {
          setConfig((prev) => ({
            ...prev,
            ...res.data,
            items: res.data.items && res.data.items.length > 0 ? res.data.items : DEFAULT_BUNDLE_ITEMS,
          }));
        }
      } catch (err) {
        console.error("[OUTFIT_BUILDER] Failed to fetch live bundle config:", err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  if (config.isEnabled === false) {
    return null;
  }

  const items = config.items && config.items.length > 0 ? config.items : DEFAULT_BUNDLE_ITEMS;
  const rawTotal = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const discountMultiplier = (100 - (config.discountPercent ?? 15)) / 100;
  const discountTotal = Math.round(rawTotal * discountMultiplier);

  const { showToast } = useToast();

  const handleAdd = (e?: React.MouseEvent) => {
    audioSystem.playClick(900);
    setAdded(true);
    if (e?.currentTarget) {
      triggerCartFly({
        startEl: e.currentTarget as HTMLElement,
        image: items[0]?.image,
      });
    }
    const bundlePayload = items.map((item) => ({
      name: item.name,
      price: Math.round((Number(item.price) || 0) * discountMultiplier),
      image: item.image,
    }));
    if (onAddToCart) {
      onAddToCart(bundlePayload);
    } else if (onAddBundleToCart) {
      onAddBundleToCart(bundlePayload);
    }
    showToast({
      title: "Modular Outfit Stack",
      description: `3 Garments added with ${config.discountPercent || 15}% Bundle Privilege`,
      type: "cart",
      image: items[0]?.image,
    });
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <section id="outfit-builder" className="bg-white text-black py-16 sm:py-24 md:py-32 overflow-hidden border-t border-neutral-200">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-16">
          <div>
            <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-700 flex items-center gap-2 mb-3 font-semibold">
              <Layers className="h-4 w-4 text-black" />
              {config.sectionTag || "[ BUNDLE STACKER ]"}
            </span>
            <h2 className="font-display text-[clamp(2.2rem,6vw,5.5rem)] uppercase leading-[0.88] tracking-tight font-normal text-black">
              {config.headingLine1 || "BUILD YOUR"}
              <br />
              {config.headingLine2 || "MODULAR OUTFIT."}
            </h2>
          </div>

          <div className="hud-glass-panel p-4 sm:p-6 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-lg border border-black/10">
            <div>
              <span className="font-mono-technical text-[9px] sm:text-[10px] uppercase tracking-widest text-black block font-bold">
                {config.discountBadgeText || `BUNDLE DISPATCH (${config.discountPercent || 15}% OFF)`}
              </span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="font-display text-2xl sm:text-3xl font-bold text-black">
                  ₹{discountTotal}
                </span>
                <span className="font-mono-technical text-xs sm:text-sm text-neutral-800 line-through font-semibold">
                  ₹{rawTotal}
                </span>
              </div>
            </div>

            <MagneticButton
              strength={0.25}
              onClick={(e) => handleAdd(e)}
              className={`w-full sm:w-auto py-3 sm:py-3.5 px-5 sm:px-6 rounded-none font-mono-technical text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                added
                  ? "bg-neutral-800 text-white shadow-xl scale-105"
                  : "bg-black text-white hover:bg-neutral-900 active:scale-95"
              }`}
              data-cursor-label="ADD"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>BUNDLE ADDED ✓</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>{config.ctaButtonText || "ADD BUNDLE"}</span>
                </>
              )}
            </MagneticButton>
          </div>
        </div>

        {/* Modular Outfit Slot Cards (Claude Design Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {items.map((item, idx) => (
            <Reveal
              key={item.id || idx}
              variant="scale"
              delay={idx * 100}
              className="group flex flex-col justify-between rounded-none hud-glass-card p-3 sm:p-4 shadow-sm border border-black/10 transition-all duration-300 hardware-accel"
            >
              {/* Upper Image Frame with Technical Background Pattern & Top Layer Info */}
              <div className="relative h-[280px] xs:h-[320px] sm:h-[380px] md:h-[440px] w-full overflow-hidden rounded-none bg-neutral-100 flex flex-col justify-between p-4 sm:p-5 shadow-inner border border-black/5">
                {/* Subtle Geometric Background Halo */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="h-64 w-64 rounded-none bg-white/70 blur-2xl" />
                </div>

                {/* Subtle Technical Dot Grid Decor */}
                <div className="pointer-events-none absolute right-4 top-1/3 opacity-15 grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-none bg-black" />
                  ))}
                </div>

                {/* Top Row: Layer Label & Matrix Icon */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-none bg-black" />
                    <span className="font-mono-technical text-[10px] font-medium uppercase tracking-[0.2em] text-black">
                      {item.layerNumber || `LAYER 0${idx + 1}`}
                    </span>
                  </div>

                  <div className="h-6 w-6 rounded-none bg-black/5 flex items-center justify-center backdrop-blur-sm">
                    <LayoutGrid className="h-3 w-3 text-black" />
                  </div>
                </div>

                {/* Main Product Image Silhouette */}
                <div className="relative z-10 flex-1 flex items-center justify-center my-1 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full max-h-[240px] xs:max-h-[280px] sm:max-h-[340px] md:max-h-[370px] object-contain object-center filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Bottom Details Section */}
              <div className="px-3 pt-4 pb-2">
                {/* Layer Pill Badge & Plus Button */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-none bg-neutral-200 px-2.5 py-0.5 font-mono-technical text-[10px] font-medium uppercase tracking-wider text-black">
                    {item.layerType || `LAYER 0${idx + 1}`}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      audioSystem.playClick(600);
                      triggerCartFly({
                        startEl: e.currentTarget as HTMLElement,
                        image: item.image,
                      });
                      const singleItem = [{
                        name: item.name,
                        price: Number(item.price) || 0,
                        image: item.image,
                      }];
                      if (onAddToCart) {
                        onAddToCart(singleItem);
                      } else if (onAddBundleToCart) {
                        onAddBundleToCart(singleItem);
                      }
                    }}
                    data-cursor
                    data-cursor-label="ADD"
                    aria-label={`Add ${item.name} to cart`}
                    className="h-7 w-7 rounded-none bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer text-black active:scale-95"
                    title="Add individual piece to cart"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Product Title & Subtitle */}
                <div className="mt-3">
                  <h3 className="font-mono-technical text-sm sm:text-base font-semibold uppercase tracking-wider text-black truncate">
                    {item.name}
                  </h3>
                  <p className="font-mono-technical text-[10px] uppercase tracking-wider text-black font-semibold mt-0.5 truncate">
                    {item.subtitle || "ARCHITECTURAL PIECE"}
                  </p>
                </div>

                {/* Bottom Row: Tags & Price Pill */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-black/5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(item.tags && item.tags.length > 0 ? item.tags : ["PREMIUM TEXTILE"]).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center text-black font-mono-technical text-[9.5px] font-bold uppercase tracking-wider bg-black/10 border border-black/10 px-2 py-0.5 rounded-none"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="bg-black text-white px-3 py-1 rounded-none font-mono-technical text-xs font-semibold shadow-sm shrink-0">
                    {item.formattedPrice || `₹${item.price}`}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
