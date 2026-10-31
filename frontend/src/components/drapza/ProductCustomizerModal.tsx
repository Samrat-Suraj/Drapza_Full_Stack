"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Tag,
  Percent,
  Layers,
  DollarSign,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  Sliders,
  Flame,
  Zap,
  UploadCloud,
  Loader2,
  SlidersHorizontal,
  FileText,
  Truck,
  RotateCcw,
  CheckCircle2,
  Crop,
} from "lucide-react";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";
import { normalizeImageUrl, normalizeImageUrls, isGoogleDriveUrl, isGoogleImageUrl, extractGoogleImageUrl, handleImageFallbackError } from "@/lib/imageUtils";
import { productApi, siteConfigApi, filterConfigApi } from "@/lib/api";
import { ImageCropperModal, AspectRatioPreset } from "./ImageCropperModal";
import { adminProductSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";


export interface ProductFormData {
  name: string;
  slug: string;
  price: string;
  numericPrice: number;
  discountPrice: number;
  discountPercentage: number;
  discountTagActive: boolean;
  offerTag: string;
  category: string;
  description: string;
  detailTitle: string;
  details: string;
  detailsImage: string;
  stock: number;
  weight: string;
  blend: string;
  cut: string;
  accentBadge: string;
  isFeatured: boolean;
  colors: string[];
  sizes: string[];
  images: string[];
  colorImages: Array<{ color: string; images: string[] }>;
  specifications?: string;
  specificationsImage?: string;
  shippingTerms?: string;
  shippingTermsImage?: string;
  showSpecifications?: boolean;
  showShippingTerms?: boolean;
  showParallelForms?: boolean;
  showReviews?: boolean;
  allowAddToCart?: boolean;
  inStock?: boolean;
}

interface ProductCustomizerModalProps {
  isOpen: boolean;
  editingProductId: string | null;
  initialData: ProductFormData;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  isSaving: boolean;
  errorMessage: string | null;
}

const CATEGORY_OPTIONS = [
  "Kurti",
  "Saree",
  "Jeans",
  "Palazzo/Bottom",
  "Leggings",
  "Tops",
  "Dupatta",
  "Co-ord Set",
  "Panties",
  "Bra",
  "Sharara/Lehenga",
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
const STANDARD_COLORS = [
  { name: "Obsidian Black", hex: "#0f0f0f" },
  { name: "Onyx Black", hex: "#1b1b1b" },
  { name: "Taupe Gray", hex: "#7a726c" },
  { name: "Mineral Sage", hex: "#969992" },
  { name: "Deep Charcoal", hex: "#1a1a1a" },
  { name: "Slate Gray", hex: "#686868" },
  { name: "Off White / Cream", hex: "#f5f5f5" },
  { name: "Crimson Maroon", hex: "#800020" },
  { name: "Gold Khaki", hex: "#c5a059" },
];

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 40, 50, 60, 70];
const TAG_SUGGESTIONS = [
  "50% OFF",
  "20% OFF",
  "30% OFF",
  "40% OFF",
  "LIMITED OFFER",
  "FESTIVE DROP",
  "EXCLUSIVE DEAL",
  "HOT DROP",
];

export function ProductCustomizerModal({
  isOpen,
  editingProductId,
  initialData,
  onClose,
  onSave,
  isSaving,
  errorMessage,
}: ProductCustomizerModalProps) {
  useLockBodyScroll(isOpen);

  const [activeTab, setActiveTab] = useState<"general" | "discount" | "specs" | "narrative" | "media" | "page-controls">("general");
  const [formData, setFormData] = useState<ProductFormData>(initialData);
  const [newColorInput, setNewColorInput] = useState("#1b1b1b");
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingSpecImage, setIsUploadingSpecImage] = useState(false);
  const [isUploadingShippingImage, setIsUploadingShippingImage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const specFileInputRef = useRef<HTMLInputElement>(null);
  const shippingFileInputRef = useRef<HTMLInputElement>(null);

  // Image Cropper Studio States
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperTitle, setCropperTitle] = useState("CROP & FIT PRODUCT PHOTO");
  const [cropperAspect, setCropperAspect] = useState<AspectRatioPreset>("3:4");
  const [cropperTarget, setCropperTarget] = useState<{
    type: "gallery_add" | "gallery_replace" | "specifications" | "shippingTerms";
    index?: number;
  }>({ type: "gallery_add" });
  const [isUploadingCropped, setIsUploadingCropped] = useState(false);
  const cropFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Categories from Admin Filter CMS
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("drapza_wardrobe_filter_options");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            return parsed.categories;
          }
        }
      } catch (e) {}
    }
    return CATEGORY_OPTIONS;
  });

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    filterConfigApi
      .getFilterConfig()
      .then((res) => {
        if (isMounted && res?.success && res?.data?.categories && res.data.categories.length > 0) {
          setAvailableCategories(res.data.categories);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const displayedCategories = React.useMemo(() => {
    if (formData.category && !availableCategories.includes(formData.category)) {
      return [formData.category, ...availableCategories];
    }
    return availableCategories;
  }, [formData.category, availableCategories]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        discountPercentage: Number(initialData.discountPercentage) || 0,
        discountPrice: Number(initialData.discountPrice) || 0,
        discountTagActive: Boolean(initialData.discountTagActive),
        offerTag: initialData.offerTag || (initialData.discountPercentage ? `${initialData.discountPercentage}% OFF` : ""),
        specifications: initialData.specifications ?? "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
        specificationsImage: initialData.specificationsImage || "",
        shippingTerms: initialData.shippingTerms ?? "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
        shippingTermsImage: initialData.shippingTermsImage || "",
        showSpecifications: initialData.showSpecifications !== false,
        showShippingTerms: initialData.showShippingTerms !== false,
        showParallelForms: initialData.showParallelForms !== false,
        showReviews: initialData.showReviews !== false,
        allowAddToCart: initialData.allowAddToCart !== false,
        inStock: initialData.inStock !== false,
      });
      setActiveTab("general");
    }
  }, [isOpen, initialData]);

  const handleFileUploadToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingCloudinary(true);
    audioSystem.playClick(900, 0.04);

    const fileList = Array.from(files);
    const total = fileList.length;
    let successCount = 0;
    const newUploadedUrls: string[] = [];

    for (let i = 0; i < total; i++) {
      const file = fileList[i];
      setUploadProgressText(`Uploading ${i + 1}/${total} to Cloudinary CDN...`);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        let res: any;
        try {
          res = await productApi.uploadImage(base64);
        } catch (pErr) {
          res = await siteConfigApi.uploadAsset(base64, "drapza_products");
        }

        if (res && res.url) {
          newUploadedUrls.push(res.url);
          successCount++;
        }
      } catch (uploadErr: any) {
        console.error("[CLOUDINARY UPLOAD ERROR]", uploadErr);
      }
    }

    if (newUploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newUploadedUrls],
      }));
      setUploadProgressText(`✓ Successfully uploaded ${successCount} garment ${successCount === 1 ? "image" : "images"} to Cloudinary!`);
      setTimeout(() => setUploadProgressText(null), 4000);
    } else {
      setUploadProgressText("✕ Cloudinary upload failed. Check connection or try direct URL.");
      setTimeout(() => setUploadProgressText(null), 5000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploadingCloudinary(false);
  };

  const handleSingleImageUpload = async (
    file: File,
    field: "specificationsImage" | "shippingTermsImage"
  ) => {
    if (!file) return;
    if (field === "specificationsImage") setIsUploadingSpecImage(true);
    if (field === "shippingTermsImage") setIsUploadingShippingImage(true);
    audioSystem.playClick(900, 0.04);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      let res: any;
      try {
        res = await productApi.uploadImage(base64);
      } catch (pErr) {
        res = await siteConfigApi.uploadAsset(base64, "drapza_products");
      }

      if (res && res.url) {
        setFormData((prev) => ({
          ...prev,
          [field]: res.url,
        }));
        audioSystem.playClick(1000, 0.05);
      }
    } catch (err: any) {
      console.error("[IMAGE UPLOAD ERROR]", err);
    } finally {
      if (field === "specificationsImage") {
        setIsUploadingSpecImage(false);
        if (specFileInputRef.current) specFileInputRef.current.value = "";
      }
      if (field === "shippingTermsImage") {
        setIsUploadingShippingImage(false);
        if (shippingFileInputRef.current) shippingFileInputRef.current.value = "";
      }
    }
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropperOpen(false);
    setIsUploadingCropped(true);
    setUploadProgressText("Uploading fitted photo to Cloudinary CDN...");
    audioSystem.playClick(900, 0.04);

    try {
      let res: any;
      try {
        res = await productApi.uploadImage(croppedDataUrl);
      } catch {
        res = await siteConfigApi.uploadAsset(croppedDataUrl, "drapza_products");
      }

      const finalUrl = res?.url || croppedDataUrl;

      if (cropperTarget.type === "gallery_add") {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, finalUrl],
        }));
        setUploadProgressText("✓ Cropped photo fitted and added to garment gallery!");
      } else if (cropperTarget.type === "gallery_replace" && typeof cropperTarget.index === "number") {
        setFormData((prev) => {
          const next = [...prev.images];
          next[cropperTarget.index!] = finalUrl;
          return { ...prev, images: next };
        });
        setUploadProgressText("✓ Photo updated with fitted crop!");
      } else if (cropperTarget.type === "specifications") {
        setFormData((prev) => ({
          ...prev,
          specificationsImage: finalUrl,
        }));
        setUploadProgressText("✓ Specifications photo updated with fitted crop!");
      } else if (cropperTarget.type === "shippingTerms") {
        setFormData((prev) => ({
          ...prev,
          shippingTermsImage: finalUrl,
        }));
        setUploadProgressText("✓ Shipping terms photo updated with fitted crop!");
      }

      audioSystem.playClick(1000, 0.05);
      setTimeout(() => setUploadProgressText(null), 4000);
    } catch (err: any) {
      console.error("[CROP UPLOAD ERROR]", err);
      setUploadProgressText("✕ Failed to upload cropped photo.");
      setTimeout(() => setUploadProgressText(null), 4000);
    } finally {
      setIsUploadingCropped(false);
    }
  };

  if (!isOpen) return null;

  const basePrice = Number(formData.numericPrice) || 990;
  const discountPercent = Number(formData.discountPercentage) || 0;

  // Handler for discount % changes (syncs discountPrice and offerTag if desired)
  const handleDiscountPercentChange = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const calculatedDiscountPrice = clamped > 0 ? Math.round(basePrice * (1 - clamped / 100)) : basePrice;
    
    setFormData((prev) => ({
      ...prev,
      discountPercentage: clamped,
      discountPrice: calculatedDiscountPrice,
      discountTagActive: clamped > 0 ? true : prev.discountTagActive,
      offerTag: (!prev.offerTag || prev.offerTag.includes("% OFF")) && clamped > 0 ? `${clamped}% OFF` : prev.offerTag,
    }));
  };

  // Handler for manual discount selling price change
  const handleDiscountPriceChange = (priceVal: number) => {
    const clampedPrice = Math.max(0, priceVal);
    const calculatedPercent = basePrice > 0 ? Math.max(0, Math.min(100, Math.round(((basePrice - clampedPrice) / basePrice) * 100))) : 0;
    
    setFormData((prev) => ({
      ...prev,
      discountPrice: clampedPrice,
      discountPercentage: calculatedPercent,
      offerTag: (!prev.offerTag || prev.offerTag.includes("% OFF")) && calculatedPercent > 0 ? `${calculatedPercent}% OFF` : prev.offerTag,
    }));
  };

  // Handler for base numeric price changes
  const handleNumericPriceChange = (newBase: number) => {
    const validBase = Math.max(1, newBase);
    const newDiscountPrice = discountPercent > 0 ? Math.round(validBase * (1 - discountPercent / 100)) : validBase;
    setFormData((prev) => ({
      ...prev,
      numericPrice: validBase,
      price: `₹${validBase.toLocaleString("en-IN")}`,
      discountPrice: newDiscountPrice,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick(800, 0.05);

    const validation = adminProductSchema.safeParse({
      name: (formData.name || "").trim(),
      numericPrice: Number(formData.numericPrice),
      discountPrice: Number(formData.discountPrice) || 0,
      discountPercentage: Number(discountPercent) || 0,
      category: (formData.category || "").trim(),
      description: (formData.description || "").trim(),
      stock: Number(formData.stock) || 0,
    });

    if (!validation.success) {
      const errMap = getZodFieldErrors(validation.error);
      setFieldErrors(errMap);
      if (errMap.name || errMap.numericPrice || errMap.category || errMap.stock) {
        setActiveTab("general");
      }
      return;
    }
    setFieldErrors({});

    const sanitizedData: ProductFormData = {
      ...formData,
      images: normalizeImageUrls(formData.images),
      detailsImage: normalizeImageUrl(formData.detailsImage || ""),
      specificationsImage: formData.specificationsImage ? normalizeImageUrl(formData.specificationsImage) : "",
      shippingTermsImage: formData.shippingTermsImage ? normalizeImageUrl(formData.shippingTermsImage) : "",
    };
    onSave(sanitizedData);
  };

  const calculatedFinalPrice = formData.discountTagActive && (formData.discountPrice > 0 || discountPercent > 0)
    ? (formData.discountPrice > 0 ? formData.discountPrice : Math.round(basePrice * (1 - discountPercent / 100)))
    : basePrice;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      aria-labelledby="product-customizer-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn font-mono overflow-y-auto"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-5xl h-[88vh] max-h-[88vh] bg-white border border-neutral-300 text-black flex flex-col shadow-2xl rounded-none overflow-hidden min-h-0 my-auto"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 bg-neutral-900 text-white shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-none bg-white text-black flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                  ATELIER SPECIFICATION STUDIO
                </span>
                {formData.discountTagActive && (
                  <span className="px-1.5 py-0.5 rounded-none bg-red-600 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider animate-pulse">
                    {formData.offerTag || `${discountPercent}% OFF`} ACTIVE
                  </span>
                )}
              </div>
              <h2 id="product-customizer-title" className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-tight text-white truncate">
                {editingProductId ? `EDIT SPEC: ${formData.name || "GARMENT"}` : "REGISTER NEW GARMENT ARCHETYPE"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-none transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center px-2 sm:px-4 border-b border-neutral-200 bg-neutral-100 overflow-x-auto shrink-0 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "general"
                ? "border-black text-black bg-white"
                : "border-transparent text-neutral-600 hover:text-black"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. General & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discount")}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "discount"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-neutral-600 hover:text-black"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>2. Discount & Offer Tag</span>
            {formData.discountTagActive && (
              <span className="w-2 h-2 rounded-none bg-red-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "specs"
                ? "border-black text-black bg-white"
                : "border-transparent text-neutral-600 hover:text-black"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Sizes & Fabrics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "media"
                ? "border-black text-black bg-white"
                : "border-transparent text-neutral-600 hover:text-black"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>4. Media & Imagery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("page-controls")}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "page-controls"
                ? "border-black text-black bg-white font-black"
                : "border-transparent text-neutral-600 hover:text-black"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>5. Page Controls (Specs & Terms)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-2.5 sm:p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2 px-4 sm:px-6 font-bold shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body Form - Independent Scroll Container */}
        <form
          id="product-customizer-form"
          onSubmit={handleSubmit}
          noValidate
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs custom-modal-scroll overscroll-contain pb-10"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            scrollbarColor: "#737373 #f5f5f5",
          }}
        >
          {/* TAB 1: GENERAL & PRICING */}
          {activeTab === "general" && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Product Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Garment Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g. ANARKALI EMBROIDERED KURTI"
                    style={{ border: fieldErrors.name ? "1px solid #ef4444" : undefined }}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black font-bold focus:bg-white focus:border-black outline-none uppercase"
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="anarkali-embroidered-kurti"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black focus:bg-white focus:border-black outline-none lowercase"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: "" }));
                    }}
                    style={{ border: fieldErrors.category ? "1px solid #ef4444" : undefined }}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black font-bold focus:bg-white focus:border-black outline-none uppercase cursor-pointer"
                  >
                    {displayedCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                      {fieldErrors.category}
                    </span>
                  )}
                </div>

                {/* Base Numeric Price (MRP) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">
                    Original MRP Price (INR ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-500">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={formData.numericPrice}
                      onChange={(e) => {
                        handleNumericPriceChange(Number(e.target.value));
                        if (fieldErrors.numericPrice) setFieldErrors((prev) => ({ ...prev, numericPrice: "" }));
                      }}
                      style={{ border: fieldErrors.numericPrice ? "1px solid #ef4444" : undefined }}
                      className="w-full pl-8 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black font-bold focus:bg-white focus:border-black outline-none text-sm"
                    />
                  </div>
                  {fieldErrors.numericPrice ? (
                    <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                      {fieldErrors.numericPrice}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">Standard retail catalog price before discount</span>
                  )}
                </div>

                {/* Vault Stock Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Inventory Stock Units *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: Number(e.target.value) });
                      if (fieldErrors.stock) setFieldErrors((prev) => ({ ...prev, stock: "" }));
                    }}
                    style={{ border: fieldErrors.stock ? "1px solid #ef4444" : undefined }}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black font-bold focus:bg-white focus:border-black outline-none text-sm"
                  />
                  {fieldErrors.stock ? (
                    <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                      {fieldErrors.stock}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">0 units will automatically display SOLD OUT</span>
                  )}
                </div>

                {/* Accent Badge Tag */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Accent Craft Badge</label>
                  <input
                    type="text"
                    value={formData.accentBadge}
                    onChange={(e) => setFormData({ ...formData, accentBadge: e.target.value })}
                    placeholder="e.g. ZARI EMBROIDERED"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black focus:bg-white focus:border-black outline-none uppercase"
                  />
                </div>

                {/* Featured in Hero / Archive Switch */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-3 p-2.5 bg-neutral-100 border border-neutral-200 rounded-none cursor-pointer hover:bg-neutral-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <span className="font-bold uppercase text-[11px] text-black">Feature in Atelier Spotlight</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-neutral-700">Garment Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  placeholder="High-density textile description and tactile qualities..."
                  style={{ border: fieldErrors.description ? "1px solid #ef4444" : undefined }}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black focus:bg-white focus:border-black outline-none"
                />
                {fieldErrors.description && (
                  <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                    {fieldErrors.description}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DISCOUNT & OFFER TAGS */}
          {activeTab === "discount" && (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn">
              {/* Master Discount Toggle Card */}
              <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
                formData.discountTagActive
                  ? "bg-red-50/60 border-red-200 shadow-xs"
                  : "bg-white border-neutral-200 shadow-xs"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Flame className={`w-4 h-4 shrink-0 ${formData.discountTagActive ? "text-red-600" : "text-neutral-400"}`} />
                      <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-wider text-neutral-900">
                        Offer & Discount Tag Control
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md ${
                        formData.discountTagActive
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      }`}>
                        {formData.discountTagActive ? "TAG ACTIVE (ON)" : "TAG DISABLED (OFF)"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed font-sans max-w-xl">
                      Enable or disable the promotional offer badge and discounted pricing for this garment across /wardrobe and homepage.
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(600, 0.04);
                      const nextState = !formData.discountTagActive;
                      setFormData((prev) => ({
                        ...prev,
                        discountTagActive: nextState,
                        discountPercentage: nextState && prev.discountPercentage === 0 ? 50 : prev.discountPercentage,
                        offerTag: nextState && !prev.offerTag ? "50% OFF" : prev.offerTag,
                      }));
                    }}
                    className={`shrink-0 px-6 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-sm self-start sm:self-center ${
                      formData.discountTagActive
                        ? "bg-red-600 text-white hover:bg-red-700 shadow-md sm:scale-105"
                        : "bg-neutral-900 text-white hover:bg-black"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.discountTagActive ? "bg-white animate-pulse" : "bg-neutral-400"}`} />
                    <span>{formData.discountTagActive ? "DISCOUNT TAG IS ON" : "TURN TAG ON"}</span>
                  </button>
                </div>
              </div>

              {/* Discount Percentage & Value Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 p-4 sm:p-5 bg-white border border-neutral-200 rounded-none shadow-sm">
                {/* Left: Percentage & Sliders */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-neutral-800 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-red-600" />
                        <span>Discount Percentage (%)</span>
                      </label>
                      <span className="font-bold text-red-600 text-sm">{discountPercent}% OFF</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={discountPercent}
                      onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer h-2 bg-neutral-200 rounded-none"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Quick Discount Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DISCOUNT_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(700, 0.03);
                            handleDiscountPercentChange(p);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-none transition-all cursor-pointer border ${
                            discountPercent === p
                              ? "bg-red-600 text-white border-red-600 font-black shadow-xs sm:scale-105"
                              : "bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Offer Tag Label */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                    <label className="text-[11px] font-bold uppercase text-neutral-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Custom Offer Tag Text</span>
                    </label>
                    <input
                      type="text"
                      value={formData.offerTag}
                      onChange={(e) => setFormData({ ...formData, offerTag: e.target.value })}
                      placeholder="e.g. 50% OFF, 20% OFF, SPECIAL DROP"
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black font-bold focus:bg-white focus:border-black outline-none uppercase"
                    />

                    {/* Tag Suggestions */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {TAG_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormData({ ...formData, offerTag: tag })}
                          className="px-2 py-0.5 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-[9px] font-bold text-neutral-700 uppercase cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Price Breakdown & Live Storefront Preview */}
                <div className="space-y-4 bg-neutral-50 p-3.5 sm:p-4 border border-neutral-200 rounded-none flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      PRICING TELEMETRY BREAKDOWN
                    </span>
                    <div className="space-y-2 text-xs border-b border-neutral-200 pb-3">
                      <div className="flex justify-between items-center text-neutral-600 gap-2">
                        <span>Original Catalog Price (MRP):</span>
                        <span className="font-bold line-through text-neutral-500 shrink-0">₹{basePrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-600 font-bold gap-2">
                        <span>Discount Savings ({discountPercent}%):</span>
                        <span className="shrink-0">-₹{(basePrice - calculatedFinalPrice).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center text-black font-bold text-sm pt-1 border-t border-neutral-200 gap-2">
                        <span>Shopper Checkout Price:</span>
                        <span className="text-sm sm:text-base text-black shrink-0">₹{calculatedFinalPrice.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Card Preview Box */}
                  <div className="mt-3 p-2.5 sm:p-3 bg-white border border-neutral-300 rounded-none shadow-xs space-y-2">
                    <span className="text-[9px] font-bold uppercase text-neutral-400 block">
                      STOREFRONT PREVIEW BADGE:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-[#f5f5f5] p-2.5 sm:p-3 border border-black/10 rounded-none">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {formData.discountTagActive && (formData.offerTag || discountPercent > 0) && (
                            <span className="font-mono-technical text-[8.5px] sm:text-[9px] uppercase tracking-wider bg-red-600 text-white font-black px-1.5 sm:px-2 py-0.5 rounded-none border border-white/20 shadow-xs animate-pulse">
                              {formData.offerTag || `${discountPercent}% OFF`}
                            </span>
                          )}
                          <span className="font-mono-technical text-[8px] sm:text-[8.5px] uppercase tracking-wider bg-black/85 text-neutral-200 px-1.5 sm:px-2 py-0.5 rounded-none">
                            {formData.category.toUpperCase()}
                          </span>
                        </div>
                        <div className="font-bold text-xs uppercase text-black truncate">
                          {formData.name || "GARMENT ARCHETYPE"}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-xs sm:text-sm text-black">₹{calculatedFinalPrice.toLocaleString("en-IN")}</div>
                        {formData.discountTagActive && calculatedFinalPrice < basePrice && (
                          <div className="text-[9px] sm:text-[10px] text-neutral-600 line-through font-medium">₹{basePrice.toLocaleString("en-IN")}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIZES & FABRICS */}
          {activeTab === "specs" && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              {/* Sizes Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-neutral-700">Available Garment Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_SIZES.map((sz) => {
                    const isSelected = formData.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, sizes: formData.sizes.filter((s) => s !== sz) });
                          } else {
                            setFormData({ ...formData, sizes: [...formData.sizes, sz] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-none font-bold uppercase text-xs border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-black text-white border-black font-black"
                            : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                        }`}
                      >
                        {sz} {isSelected ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Size Input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    placeholder="Custom size (e.g. 2.5m, Free Size, 34)"
                    className="flex-1 p-2 bg-neutral-50 border border-neutral-300 rounded-none text-xs text-black uppercase outline-none focus:border-black w-full sm:w-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSizeInput.trim() && !formData.sizes.includes(newSizeInput.trim())) {
                        setFormData({ ...formData, sizes: [...formData.sizes, newSizeInput.trim()] });
                        setNewSizeInput("");
                      }
                    }}
                    className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold uppercase rounded-none hover:bg-black cursor-pointer text-center w-full sm:w-auto"
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              {/* Color Palette */}
              <div className="space-y-2 pt-3 border-t border-neutral-200">
                <label className="text-[11px] font-bold uppercase text-neutral-700">Garment Color Palette</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {STANDARD_COLORS.map((c) => {
                    const isSelected = formData.colors.includes(c.hex);
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, colors: formData.colors.filter((hex) => hex !== c.hex) });
                          } else {
                            setFormData({ ...formData, colors: [...formData.colors, c.hex] });
                          }
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-none border text-xs cursor-pointer transition-all ${
                          isSelected ? "border-black bg-neutral-100 font-bold" : "border-neutral-200 bg-white"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-none border border-black/20 shrink-0" style={{ backgroundColor: c.hex }} />
                        <span className="text-[11px] sm:text-xs">{c.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-black shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textile Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-neutral-200">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Fabric GSM / Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="480 GSM HEAVYWEIGHT"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black uppercase outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Fabric Composition</label>
                  <input
                    type="text"
                    value={formData.blend}
                    onChange={(e) => setFormData({ ...formData, blend: e.target.value })}
                    placeholder="100% PURE MODAL SILK"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black uppercase outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">Silhouette Fit Cut</label>
                  <input
                    type="text"
                    value={formData.cut}
                    onChange={(e) => setFormData({ ...formData, cut: e.target.value })}
                    placeholder="OVERSIZED BOXY ARCHETYPE"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none text-black uppercase outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & IMAGERY */}
          {activeTab === "media" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Direct Multi-Upload Box: Cloudinary CDN */}
              <div
                onClick={() => !isUploadingCloudinary && fileInputRef.current?.click()}
                className="p-5 sm:p-7 border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-black hover:bg-neutral-100/70 transition-all rounded-none text-center cursor-pointer group"
              >
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUploadToCloudinary}
                  className="hidden"
                  disabled={isUploadingCloudinary}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-none bg-neutral-900 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {isUploadingCloudinary ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 flex-wrap">
                      <span>Upload Garment Photos (Cloudinary CDN)</span>
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8.5px] font-mono uppercase font-bold">
                        FAST CDN
                      </span>
                    </h3>
                    <p className="text-[10.5px] sm:text-xs text-neutral-500 max-w-md mx-auto">
                      Click to choose photos or drag &amp; drop multiple images directly from your device.
                    </p>
                  </div>

                  {/* Upload Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                    <button
                      type="button"
                      disabled={isUploadingCloudinary || isUploadingCropped}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCropperTarget({ type: "gallery_add" });
                        setCropperTitle("CROP & FIT PRODUCT PHOTO (3:4 RATIO)");
                        cropFileInputRef.current?.click();
                      }}
                      className="px-5 py-2.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white font-bold uppercase text-xs tracking-wider rounded-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm border border-neutral-700 active:scale-95"
                    >
                      <Crop className="w-4 h-4 text-emerald-400" />
                      <span>Crop &amp; Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingCloudinary || isUploadingCropped}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-5 py-2.5 bg-white hover:bg-neutral-100 disabled:bg-neutral-200 text-black font-bold uppercase text-xs tracking-wider rounded-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm border border-neutral-300 active:scale-95"
                    >
                      {isUploadingCloudinary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Direct Batch Upload</span>
                        </>
                      )}
                    </button>
                  </div>

                  {uploadProgressText && (
                    <div className={`mt-2 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 ${
                      uploadProgressText.startsWith("✓")
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : uploadProgressText.startsWith("✕")
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300 animate-pulse"
                    }`}>
                      <span>{uploadProgressText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 shrink-0">
                  OR IMPORT VIA DIRECT IMAGE URL
                </span>
                <div className="border-t border-neutral-200 w-full" />
              </div>

              {/* Direct Image URL Section */}
              <div className="space-y-2.5 bg-neutral-50 p-3.5 border border-neutral-200">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-black" />
                    <span>Import Photo via URL</span>
                  </label>
                  <div className="flex items-center gap-1 text-[9.5px] font-mono text-neutral-500">
                    <span className="px-1.5 py-0.5 bg-white border border-neutral-200 text-neutral-700 font-bold uppercase">Google Images</span>
                    <span className="px-1.5 py-0.5 bg-white border border-neutral-200 text-neutral-700 font-bold uppercase">Google Drive</span>
                    <span className="px-1.5 py-0.5 bg-white border border-neutral-200 text-neutral-700 font-bold uppercase">Cloudinary</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newImageUrl.trim()) {
                            audioSystem.playClick(800, 0.04);
                            const normalized = normalizeImageUrl(newImageUrl.trim());
                            setFormData({ ...formData, images: [...formData.images, normalized] });
                            setNewImageUrl("");
                          }
                        }
                      }}
                      placeholder="Paste Google Images link, Google Drive link, Cloudinary URL, or any image..."
                      className="w-full h-10 px-3 bg-white border border-neutral-300 rounded-none text-black text-xs outline-none focus:border-black font-mono shadow-xs transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        audioSystem.playClick(800, 0.04);
                        const normalized = normalizeImageUrl(newImageUrl.trim());
                        setFormData({ ...formData, images: [...formData.images, normalized] });
                        setNewImageUrl("");
                      }
                    }}
                    className="h-10 px-4 bg-black hover:bg-neutral-800 active:scale-95 text-white font-bold uppercase text-xs rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    disabled={!newImageUrl.trim()}
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        audioSystem.playClick(800, 0.04);
                        const normalized = normalizeImageUrl(newImageUrl.trim());
                        setCropperTarget({ type: "gallery_add" });
                        setCropperTitle("CROP & FIT IMPORTED PHOTO");
                        setCropperImageSrc(normalized);
                        setCropperOpen(true);
                        setNewImageUrl("");
                      }
                    }}
                    className="h-10 px-3.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 disabled:text-neutral-500 active:scale-95 text-white font-bold uppercase text-xs rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs transition-all border border-neutral-700"
                    title="Crop and fit this URL photo before adding"
                  >
                    <Crop className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Crop &amp; Add</span>
                  </button>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 text-[10.5px] text-neutral-500">
                  <p>
                    <span className="font-bold text-neutral-700">Supported links:</span> Right-clicked Google Images results (<code className="font-mono bg-white px-1 border text-black">google.com/imgres?imgurl=...</code>), Google Drive share links, and raw CDNs auto-convert immediately.
                  </p>
                  {newImageUrl.trim() && (
                    <div className="shrink-0">
                      {isGoogleImageUrl(newImageUrl) ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-mono font-bold uppercase">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Google Link Detected
                        </span>
                      ) : newImageUrl.includes("cloudinary.com") ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-mono font-bold uppercase">
                          <UploadCloud className="w-2.5 h-2.5" /> Cloudinary CDN
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-[11px] font-bold uppercase text-neutral-700">
                    Active Images ({formData.images.length}) • Top image is the Catalog Cover
                  </label>
                  {formData.images.length > 0 && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {formData.images.filter(img => img.includes("cloudinary.com") || img.includes("res.cloudinary")).length} Cloudinary Hosted
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.images.map((img, idx) => {
                    const isCloudinary = img.includes("cloudinary.com") || img.includes("res.cloudinary");
                    return (
                      <div key={idx} className="relative group p-2 border border-neutral-200 bg-neutral-50 rounded-none flex flex-col justify-between">
                        <div className="w-full h-44 sm:h-36 relative flex items-center justify-center bg-white overflow-hidden border border-neutral-100">
                          <img
                            src={img}
                            alt={`Angle ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            onError={handleImageFallbackError}
                            className="w-full h-full object-contain"
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black text-white text-[8px] font-bold uppercase rounded-none shadow-xs">
                              COVER
                            </span>
                          )}
                          {isCloudinary && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-600/90 text-white text-[7.5px] font-mono uppercase font-bold rounded-none">
                              CLOUDINARY
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 gap-1.5 flex-wrap">
                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...formData.images];
                                const [moved] = next.splice(idx, 1);
                                next.unshift(moved);
                                setFormData({ ...formData, images: next });
                              }}
                              className="text-[10px] sm:text-[9px] text-neutral-700 hover:text-black uppercase font-bold cursor-pointer underline hover:no-underline"
                            >
                              Set Cover
                            </button>
                          ) : (
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">Cover Photo</span>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                audioSystem.playClick(700, 0.03);
                                setCropperTarget({ type: "gallery_replace", index: idx });
                                setCropperTitle(`CROP & FIT PHOTO #${idx + 1}`);
                                setCropperImageSrc(img);
                                setCropperOpen(true);
                              }}
                              className="text-[10px] sm:text-[9px] text-neutral-800 hover:text-black uppercase font-bold cursor-pointer flex items-center gap-1 hover:bg-neutral-200 px-1.5 py-0.5 rounded-none border border-neutral-300 transition-colors"
                              title="Crop & Fit Photo"
                            >
                              <Crop className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Crop</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) });
                              }}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 transition-colors"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE PAGE CONTROLS (SPECIFICATIONS & SHIPPING TERMS) */}
          {activeTab === "page-controls" && (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn pb-4">
              {/* Unit Page Live Status Banner */}
              <div className="p-4 sm:p-5 bg-neutral-900 text-white rounded-none border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                      Live Unit Page Architecture Console
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono font-bold uppercase">
                      /wardrobe/{formData.slug || "unit"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xl">
                    Configure specifications copy, multi-paragraph shipping and returns policies, and toggle live sections on the garment page.
                  </p>
                </div>

                <a
                  href={`/wardrobe/${formData.slug || "monochrome-raw-hem-hoodie"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black font-bold uppercase text-[11px] tracking-wider rounded-none shrink-0 self-start sm:self-center transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Preview Page</span>
                  <span>↗</span>
                </a>
              </div>

              {/* 1. SPECIFICATIONS SECTION CONTROL */}
              <div className="p-4 sm:p-5 bg-white border border-neutral-200 rounded-none shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-black text-white flex items-center justify-center rounded-none font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-2">
                        <span>Specifications Section</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          formData.showSpecifications !== false
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-300"
                        }`}>
                          {formData.showSpecifications !== false ? "VISIBLE ON PAGE" : "HIDDEN (OFF)"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Controls the editorial 'Specifications' section with textile structure notes.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650, 0.03);
                      setFormData((prev) => ({ ...prev, showSpecifications: prev.showSpecifications === false ? true : false }));
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      formData.showSpecifications !== false
                        ? "bg-black text-white border-black hover:bg-neutral-800"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.showSpecifications !== false ? "bg-emerald-400 animate-pulse" : "bg-neutral-400"}`} />
                    <span>{formData.showSpecifications !== false ? "SECTION IS ON" : "TURN ON SECTION"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Specifications Editorial Content</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(700, 0.03);
                        setFormData((prev) => ({
                          ...prev,
                          specifications: "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
                        }));
                      }}
                      className="text-[10px] font-mono text-neutral-600 hover:text-black uppercase underline cursor-pointer"
                    >
                      Reset Default Template
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.specifications ?? ""}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Crafted from a midweight brushed cotton blend..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-none text-black text-xs leading-relaxed outline-none focus:bg-white focus:border-black font-sans"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Displayed beside Gallery Shot #3 on the live garment page.
                  </span>
                </div>

                {/* Specifications Photography Image */}
                <div className="pt-3 border-t border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[11px] font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Specifications Photography Image</span>
                    </label>
                    {formData.specificationsImage && (
                      <button
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(600, 0.03);
                          setFormData({ ...formData, specificationsImage: "" });
                        }}
                        className="text-[10px] text-red-600 hover:text-red-800 uppercase font-bold cursor-pointer underline"
                      >
                        Reset to Gallery Shot #3
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={specFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSingleImageUpload(file, "specificationsImage");
                    }}
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-neutral-50 p-3 border border-neutral-200">
                    <div className="w-20 h-20 bg-neutral-200 border border-neutral-300 rounded-none overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={normalizeImageUrl(formData.specificationsImage) || (formData.images && formData.images[2]) || (formData.images && formData.images[0]) || "/product/product_shot_03.jpg"}
                        alt="Specifications Section Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageFallbackError}
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            value={formData.specificationsImage || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const normalized = normalizeImageUrl(val);
                              setFormData({ ...formData, specificationsImage: normalized });
                            }}
                            placeholder="Paste Google Images link, Google Drive link, or Cloudinary URL..."
                            className="w-full h-10 px-3 bg-white border border-neutral-300 rounded-none text-xs font-mono text-black outline-none focus:border-black shadow-xs"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isUploadingSpecImage || isUploadingCropped}
                          onClick={() => {
                            setCropperTarget({ type: "specifications" });
                            setCropperTitle("CROP & FIT SPECIFICATIONS PHOTO");
                            if (formData.specificationsImage) {
                              setCropperImageSrc(formData.specificationsImage);
                              setCropperOpen(true);
                            } else {
                              cropFileInputRef.current?.click();
                            }
                          }}
                          className="h-10 px-3.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white font-bold uppercase text-[10.5px] tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-all shadow-xs border border-neutral-700 active:scale-95"
                          title="Crop and fit photo to perfection"
                        >
                          <Crop className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Crop &amp; Fit</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUploadingSpecImage || isUploadingCropped}
                          onClick={() => specFileInputRef.current?.click()}
                          className="h-10 px-3.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold uppercase text-[10.5px] tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-all shadow-xs"
                        >
                          {isUploadingSpecImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <p className="text-[10px] text-neutral-500">
                          Cloudinary upload and Google Drive share links (<code className="font-mono bg-white px-1 border text-black">drive.google.com/file/d/...</code>) are automatically converted to direct CDN.
                        </p>
                        {formData.specificationsImage && (
                          <div className="flex items-center gap-1 shrink-0">
                            {formData.specificationsImage.includes("cloudinary.com") || formData.specificationsImage.includes("res.cloudinary") ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-mono font-bold uppercase">
                                <UploadCloud className="w-2.5 h-2.5" /> Cloudinary Hosted
                              </span>
                            ) : formData.specificationsImage.includes("googleusercontent.com") || isGoogleDriveUrl(formData.specificationsImage) ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-mono font-bold uppercase">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Google Drive CDN Direct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 text-[9px] font-mono font-bold uppercase">
                                Custom URL
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SHIPPING TERMS & RETURN POLICY CONTROL */}
              <div className="p-4 sm:p-5 bg-white border border-neutral-200 rounded-none shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-black text-white flex items-center justify-center rounded-none font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-2">
                        <span>Shipping Terms & Returns Policy</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          formData.showShippingTerms !== false
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-300"
                        }`}>
                          {formData.showShippingTerms !== false ? "VISIBLE ON PAGE" : "HIDDEN (OFF)"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Dispatches dispatch turnaround, domestic delivery SLA, and 14-day return guarantees.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(650, 0.03);
                      setFormData((prev) => ({ ...prev, showShippingTerms: prev.showShippingTerms === false ? true : false }));
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      formData.showShippingTerms !== false
                        ? "bg-black text-white border-black hover:bg-neutral-800"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.showShippingTerms !== false ? "bg-emerald-400 animate-pulse" : "bg-neutral-400"}`} />
                    <span>{formData.showShippingTerms !== false ? "SECTION IS ON" : "TURN ON SECTION"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[11px] font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Shipping &amp; Return Policy Copy (2 Paragraphs Supported)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        audioSystem.playClick(700, 0.03);
                        setFormData((prev) => ({
                          ...prev,
                          shippingTerms: "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
                        }));
                      }}
                      className="text-[10px] font-mono text-neutral-600 hover:text-black uppercase underline cursor-pointer"
                    >
                      Load Standard 2-Paragraph Policy
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={formData.shippingTerms ?? ""}
                    onChange={(e) => setFormData({ ...formData, shippingTerms: e.target.value })}
                    placeholder="Paragraph 1 (Shipping terms)...\n\nParagraph 2 (Return policy)..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-none text-black text-xs leading-relaxed outline-none focus:bg-white focus:border-black font-sans"
                  />
                  <div className="flex items-center gap-2 text-[10.5px] text-neutral-500 bg-neutral-100 p-2 border border-neutral-200">
                    <span className="font-bold font-mono text-black uppercase">NOTE:</span>
                    <span>Separate text with a blank line (<code className="font-mono bg-white px-1 py-0.5 border text-black">Enter x 2</code>) to display as two separate formatted paragraphs on the live page.</span>
                  </div>
                </div>

                {/* Shipping Terms Photography Image */}
                <div className="pt-3 border-t border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[11px] font-bold uppercase text-neutral-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Shipping Terms Photography Image</span>
                    </label>
                    {formData.shippingTermsImage && (
                      <button
                        type="button"
                        onClick={() => {
                          audioSystem.playClick(600, 0.03);
                          setFormData({ ...formData, shippingTermsImage: "" });
                        }}
                        className="text-[10px] text-red-600 hover:text-red-800 uppercase font-bold cursor-pointer underline"
                      >
                        Reset to Gallery Shot #4
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={shippingFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSingleImageUpload(file, "shippingTermsImage");
                    }}
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-neutral-50 p-3 border border-neutral-200">
                    <div className="w-20 h-20 bg-neutral-200 border border-neutral-300 rounded-none overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={normalizeImageUrl(formData.shippingTermsImage) || (formData.images && formData.images[3]) || (formData.images && formData.images[0]) || "/product/product_shot_04.jpg"}
                        alt="Shipping Section Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageFallbackError}
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            value={formData.shippingTermsImage || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const normalized = normalizeImageUrl(val);
                              setFormData({ ...formData, shippingTermsImage: normalized });
                            }}
                            placeholder="Paste Google Images link, Google Drive link, or Cloudinary URL..."
                            className="w-full h-10 px-3 bg-white border border-neutral-300 rounded-none text-xs font-mono text-black outline-none focus:border-black shadow-xs"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isUploadingShippingImage || isUploadingCropped}
                          onClick={() => {
                            setCropperTarget({ type: "shippingTerms" });
                            setCropperTitle("CROP & FIT SHIPPING POLICY PHOTO");
                            if (formData.shippingTermsImage) {
                              setCropperImageSrc(formData.shippingTermsImage);
                              setCropperOpen(true);
                            } else {
                              cropFileInputRef.current?.click();
                            }
                          }}
                          className="h-10 px-3.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white font-bold uppercase text-[10.5px] tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-all shadow-xs border border-neutral-700 active:scale-95"
                          title="Crop and fit photo to perfection"
                        >
                          <Crop className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Crop &amp; Fit</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUploadingShippingImage || isUploadingCropped}
                          onClick={() => shippingFileInputRef.current?.click()}
                          className="h-10 px-3.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold uppercase text-[10.5px] tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-all shadow-xs"
                        >
                          {isUploadingShippingImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <p className="text-[10px] text-neutral-500">
                          Cloudinary upload and Google Drive share links (<code className="font-mono bg-white px-1 border text-black">drive.google.com/file/d/...</code>) are automatically converted to direct CDN.
                        </p>
                        {formData.shippingTermsImage && (
                          <div className="flex items-center gap-1 shrink-0">
                            {formData.shippingTermsImage.includes("cloudinary.com") || formData.shippingTermsImage.includes("res.cloudinary") ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-mono font-bold uppercase">
                                <UploadCloud className="w-2.5 h-2.5" /> Cloudinary Hosted
                              </span>
                            ) : formData.shippingTermsImage.includes("googleusercontent.com") || isGoogleDriveUrl(formData.shippingTermsImage) ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-mono font-bold uppercase">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Google Drive CDN Direct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 text-[9px] font-mono font-bold uppercase">
                                Custom URL
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SHELF & LIVE PRIVILEGE TOGGLES */}
              <div className="p-4 sm:p-5 bg-white border border-neutral-200 rounded-none shadow-xs space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-black flex items-center gap-2">
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center rounded-none font-bold text-xs">
                    3
                  </div>
                  <span>Additional Sections &amp; Checkout Privileges</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Parallel Forms Toggle */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600, 0.03);
                      setFormData((prev) => ({ ...prev, showParallelForms: prev.showParallelForms === false ? true : false }));
                    }}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex items-start gap-3 ${
                      formData.showParallelForms !== false
                        ? "bg-neutral-50 border-neutral-900"
                        : "bg-white border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.showParallelForms !== false}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[11px] text-black block">
                        Parallel Forms (Related Products)
                      </span>
                      <span className="text-[10px] text-neutral-500 block leading-tight">
                        Displays the bottom product archive shelf with matching forms.
                      </span>
                    </div>
                  </div>

                  {/* Reviews Section Toggle */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600, 0.03);
                      setFormData((prev) => ({ ...prev, showReviews: prev.showReviews === false ? true : false }));
                    }}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex items-start gap-3 ${
                      formData.showReviews !== false
                        ? "bg-neutral-50 border-neutral-900"
                        : "bg-white border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.showReviews !== false}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[11px] text-black block">
                        Client Critiques &amp; Reviews
                      </span>
                      <span className="text-[10px] text-neutral-500 block leading-tight">
                        Displays the customer critique ratings and feedback submission portal.
                      </span>
                    </div>
                  </div>

                  {/* Allow Add to Bag Toggle */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600, 0.03);
                      setFormData((prev) => ({ ...prev, allowAddToCart: prev.allowAddToCart === false ? true : false }));
                    }}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex items-start gap-3 ${
                      formData.allowAddToCart !== false
                        ? "bg-neutral-50 border-neutral-900"
                        : "bg-white border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowAddToCart !== false}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[11px] text-black block">
                        Active Add-To-Bag Privileges
                      </span>
                      <span className="text-[10px] text-neutral-500 block leading-tight">
                        When disabled, button locks into &apos;Archived Form&apos; (view only).
                      </span>
                    </div>
                  </div>

                  {/* In Stock Toggle */}
                  <div
                    onClick={() => {
                      audioSystem.playClick(600, 0.03);
                      setFormData((prev) => ({ ...prev, inStock: prev.inStock === false ? true : false }));
                    }}
                    className={`p-3.5 border rounded-none cursor-pointer transition-all flex items-start gap-3 ${
                      formData.inStock !== false
                        ? "bg-neutral-50 border-neutral-900"
                        : "bg-white border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.inStock !== false}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[11px] text-black block">
                        Live Inventory Status (In Stock)
                      </span>
                      <span className="text-[10px] text-neutral-500 block leading-tight">
                        When disabled, garment displays &apos;Out of Stock&apos; banner.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Fixed Action Footer Bar - Always Pinned & Never Overlaps Content */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-neutral-200 bg-white shrink-0 gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="submit"
              form="product-customizer-form"
              disabled={isSaving}
              className="px-5 sm:px-8 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              {isSaving ? (
                <span>SYNCHRONIZING...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingProductId ? "SAVE SPECIFICATION" : "REGISTER GARMENT"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Cropping Pipeline */}
      <input
        type="file"
        ref={cropFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setCropperImageSrc(reader.result as string);
              setCropperOpen(true);
            };
            reader.readAsDataURL(file);
          }
          e.target.value = "";
        }}
      />

      {/* Integrated Image Cropper Studio Modal */}
      {cropperOpen && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={cropperImageSrc}
          title={cropperTitle}
          defaultAspect={cropperAspect}
          initialBgRemovalActive={false}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

