"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";
import { ConfirmModal } from "./ConfirmModal";
import {
  LayoutDashboard,
  Save,
  Package,
  ShoppingBag,
  Users,
  Mail,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Truck,
  DollarSign,
  Layers,
  ChevronRight,
  ChevronDown,
  Send,
  Lock,
  ArrowUp,
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  UserCheck,
  UserX,
  Ban,
  ShieldAlert,
  MapPin,
  Navigation,
  Globe,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Menu,
  X,
  LogOut,
  Quote,
  Sliders,
  FileText,
  LayoutGrid,
  Timer,
  Ticket,
  Tag,
  Percent,
  Eye,
  EyeOff,
  Upload,
  Star,
  CreditCard,
  RotateCcw,
  LifeBuoy,
  Printer,
  FileSpreadsheet,
  Radar,
  Gift,
  Camera,
  Crop,
  Wand2,
  Scissors,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Radio,
  Play,
  Pause,
  FastForward,
  ArrowLeftRight,
  Palette,
  Maximize2,
  SlidersHorizontal,
  Sparkles,
  MessageCircle,
  MessageSquareQuote,
  PhoneCall,
  Award,
} from "lucide-react";
import { adminApi, productApi, userApi, heroApi, peelRevealApi, lookbookApi, statementApi, marqueeApi, bundleApi, textBlockApi, countdownApi, telemetryApi, couponApi, ctaApi, contactConfigApi, ContactConfigData, DEFAULT_CONTACT_CONFIG, filterConfigApi, FilterConfigData, gstConfigApi, GstConfigData, DEFAULT_GST_CONFIG, paymentConfigApi, PaymentConfigData, DEFAULT_PAYMENT_CONFIG, footerConfigApi, FooterConfigData, DEFAULT_FOOTER_CONFIG, siteConfigApi, SiteConfigData, DEFAULT_SITE_CONFIG, bogoConfigApi, BogoConfigData, DEFAULT_BOGO_CONFIG, testimonialsConfigApi, TestimonialsConfigData, DEFAULT_TESTIMONIALS_CONFIG, touchpointConfigApi, TouchpointConfigData, DEFAULT_TOUCHPOINT_CONFIG, fabricGsmApi, FabricGsmConfigData, DEFAULT_FABRIC_GSM_CONFIG, runwayReelsApi, RunwayReelsConfigData, DEFAULT_RUNWAY_REELS_CONFIG, authPortalApi, AuthPortalConfigData, DEFAULT_AUTH_PORTAL_CONFIG, genesisApi, GenesisConfigData, DEFAULT_GENESIS_CONFIG, whatsAppApi, WhatsAppButtonConfigData, DEFAULT_WHATSAPP_CONFIG } from "@/lib/api";
import { newProductSchema, adminProductSchema, adminCouponSchema, getZodErrorMessage, getZodFieldErrors } from "@/lib/validation";
import { DrapzaSymbol } from "./DrapzaSymbol";
import { DotMatrixHero } from "../DotMatrixHero";
import { Hero } from "../Hero";
import { AboutSection } from "../AboutSection";
import { MarqueeBanner } from "../MarqueeBanner";
import { TextBlock } from "../TextBlock";
import { PeelReveal } from "../PeelReveal";
import { CtaSection } from "../CtaSection";
import { ContactForm } from "../ContactForm";
import { Footer } from "../Footer";
import { WardrobeFiltersAdminTab } from "./WardrobeFiltersAdminTab";
import { InvoiceGstAdminTab } from "./InvoiceGstAdminTab";
import { ReviewsAdminTab } from "./ReviewsAdminTab";
import { PaymentConfigAdminTab } from "./PaymentConfigAdminTab";
import { FooterAdminTab } from "./FooterAdminTab";
import { SiteIdentityAdminTab } from "./SiteIdentityAdminTab";
import { BogoAdminTab } from "./BogoAdminTab";
import { MembershipAdminTab } from "./MembershipAdminTab";
import { FabricGsmAdminTab } from "./FabricGsmAdminTab";
import { LookbookAdminTab } from "./LookbookAdminTab";
import { GenesisAdminTab } from "./GenesisAdminTab";
import { TestimonialsAdminTab } from "./TestimonialsAdminTab";
import { TouchpointAdminTab } from "./TouchpointAdminTab";
import { WhatsAppAdminTab } from "./WhatsAppAdminTab";
import { SecurityAuditAdminTab } from "./SecurityAuditAdminTab";
import { ReportsAnalyticsAdminTab } from "./ReportsAnalyticsAdminTab";
import { SupportAdminTab } from "./SupportAdminTab";
import { NewsletterAdminTab } from "./NewsletterAdminTab";
import { ReturnsAdminTab } from "./ReturnsAdminTab";
import { AppointmentsAdminTab } from "./AppointmentsAdminTab";
import { ShippingConfigAdminTab } from "./ShippingConfigAdminTab";
import { AbandonedCartAdminTab } from "./AbandonedCartAdminTab";
import { downloadOrderInvoice } from "@/lib/invoiceDownload";
import { BulkProductModal } from "./BulkProductModal";
import { ProductCustomizerModal } from "./ProductCustomizerModal";
import { ThermalShippingLabelModal } from "./ThermalShippingLabelModal";
import { performPageScroll } from "./ai-admin/AIActionEngine";
import { WalletAdminTab } from "./WalletAdminTab";
import { SearchRadarAdminTab } from "./SearchRadarAdminTab";
import { ShopTheLookAdminTab } from "./ShopTheLookAdminTab";
import { ImageCropperModal } from "./ImageCropperModal";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { SeoGeoAdminTab } from "./SeoGeoAdminTab";
import { AdminDashboardSkeleton } from "./skeletons";
import { normalizeImageUrl, normalizeImageUrls, handleImageFallbackError } from "@/lib/imageUtils";
import {
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_SIZE_OPTIONS,
  DEFAULT_COLOR_OPTIONS,
  DEFAULT_FABRIC_OPTIONS,
  DEFAULT_OCCASION_OPTIONS,
  DEFAULT_AVAILABILITY_OPTIONS,
  toRomanSize,
} from "./WardrobeFilterSidebar";

function AdminScrollHud({ onScrollPage }: { onScrollPage: (dir: "top" | "bottom") => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const pct = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100))) : 0;
          setProgress(pct);
          setVisible(scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Admin Page Quick Scroll Controls"
      className="fixed bottom-6 right-24 sm:right-28 z-40 flex items-center gap-1.5 bg-[#0f0f0f]/95 text-[#edf1e8] border border-neutral-700/80 px-2 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] font-mono select-none transition-all duration-200"
    >
      <button
        type="button"
        onClick={() => onScrollPage("top")}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all cursor-pointer group"
        title="Smooth Scroll to Top (Alt + Up)"
        aria-label="Smooth Scroll to Top"
      >
        <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
      </button>

      <span className="text-[10px] font-bold text-neutral-300 px-1 border-x border-white/15">
        {progress}%
      </span>

      <button
        type="button"
        onClick={() => onScrollPage("bottom")}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all cursor-pointer group"
        title="Smooth Scroll to Bottom (Alt + Down)"
        aria-label="Smooth Scroll to Bottom"
      >
        <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
      </button>
    </aside>
  );
}

export interface AdminDashboardProps {
  initialTab?: string;
}

export function AdminDashboard({ initialTab }: AdminDashboardProps = {}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "reports"
    | "orders"
    | "products"
    | "reviews"
    | "users"
    | "coupons"
    | "radar"
    | "hero"
    | "statement"
    | "marquee"
    | "countdown"
    | "cta"
    | "contact-form"
    | "bundle"
    | "textblock"
    | "peel-reveal"
    | "lookbook"
    | "diagnostics"
    | "filters"
    | "gst"
    | "payments"
    | "footer"
    | "security-logs"
    | "support-tickets"
    | "newsletter-crm"
    | "returns-vault"
    | "appointments"
    | "shipping-rules"
    | "abandoned-bags"
    | "search-radar"
    | "vault-cards"
    | "shop-the-look"
    | "membership"
    | "bogo-cms"
    | "fabric-gsm"
    | "genesis"
    | "testimonials-cms"
    | "touchpoint-cms"
    | "whatsapp-widget"
    | "seo-geo"
  >(() => {
    if (initialTab && initialTab !== "site-identity") return initialTab as any;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam && tabParam !== "site-identity") return tabParam as any;
      if (window.location.hash) {
        const hash = window.location.hash.replace("#", "");
        if (hash && hash !== "site-identity") return hash as any;
      }
    }
    return "overview";
  });

  // Direct URL synchronization (?tab=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("tab", activeTab);
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const tab = sp.get("tab");
        if (tab) setActiveTab(tab as any);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [bulkProductModalOpen, setBulkProductModalOpen] = useState(false);
  const [selectedThermalOrder, setSelectedThermalOrder] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState<string>("ALL");

  // Centralized Atelier Luxury Confirmation & Prompt Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "warning" | "danger" | "reset" | "info" | "prompt";
    type?: "confirm" | "alert" | "prompt";
    promptPlaceholder?: string;
    initialPromptValue?: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => { },
  });

  const openConfirm = (opts: Omit<typeof confirmDialog, "isOpen">) => {
    setConfirmDialog({ ...opts, isOpen: true });
  };

  // Desktop Sidebar Adjustment State: full (300px), compact mini rail (78px), or hidden (100% full-width workspace)
  type SidebarMode = "full" | "compact" | "hidden";
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("drapza_admin_sidebar_mode");
        if (saved === "full" || saved === "compact" || saved === "hidden") return saved as SidebarMode;
      } catch (e) { }
    }
    return "full";
  });

  const handleSetSidebarMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    audioSystem.playClick(750);
    try {
      localStorage.setItem("drapza_admin_sidebar_mode", mode);
    } catch (e) { }
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar mode between full and compact
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleSetSidebarMode(sidebarMode === "full" ? "compact" : "full");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarMode]);

  // Prevent background body scroll when mobile drawer is open
  useLockBodyScroll(sidebarOpen);

  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [visitorLocations, setVisitorLocations] = useState<any[]>([]);
  const [visitorStats, setVisitorStats] = useState<{ total: number; guests: number; registered: number; gpsVerified: number }>({
    total: 0,
    guests: 0,
    registered: 0,
    gpsVerified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Authentication & Gateways CMS State
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigData>(DEFAULT_PAYMENT_CONFIG);

  // Wardrobe Filters CMS State
  const [filterConfig, setFilterConfig] = useState<FilterConfigData>({
    categories: DEFAULT_CATEGORY_OPTIONS,
    sizes: DEFAULT_SIZE_OPTIONS,
    colors: DEFAULT_COLOR_OPTIONS,
    fabrics: DEFAULT_FABRIC_OPTIONS,
    occasions: DEFAULT_OCCASION_OPTIONS,
    availability: DEFAULT_AVAILABILITY_OPTIONS,
  });

  // Invoice & GST CMS State
  const [gstConfig, setGstConfig] = useState<GstConfigData>(DEFAULT_GST_CONFIG);
  const [downloadingInvoiceOrderId, setDownloadingInvoiceOrderId] = useState<string | null>(null);

  // Footer Architecture CMS State
  const [footerConfig, setFooterConfig] = useState<FooterConfigData>(DEFAULT_FOOTER_CONFIG);

  // Browser Tab Title & SEO CMS State
  const [siteConfig, setSiteConfig] = useState<SiteConfigData>(DEFAULT_SITE_CONFIG);

  // Dynamic BOGO & Promotional Offers Engine State
  const [bogoConfig, setBogoConfig] = useState<BogoConfigData>(DEFAULT_BOGO_CONFIG);

  // Boutique Stories / Testimonials Carousel CMS State
  const [testimonialsConfig, setTestimonialsConfig] = useState<TestimonialsConfigData>(DEFAULT_TESTIMONIALS_CONFIG);
  const [touchpointConfig, setTouchpointConfig] = useState<TouchpointConfigData>(DEFAULT_TOUCHPOINT_CONFIG);

  // Coupon Editor CMS State
  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState("ALL");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [isDeletingCouponId, setIsDeletingCouponId] = useState<string | null>(null);
  const [isTogglingCouponId, setIsTogglingCouponId] = useState<string | null>(null);
  const [isSeedingCoupons, setIsSeedingCoupons] = useState(false);
  const [couponSaveStatus, setCouponSaveStatus] = useState<string | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [couponFormError, setCouponFormError] = useState<string | null>(null);
  const [couponFieldErrors, setCouponFieldErrors] = useState<Record<string, string>>({});
  const [previewCoupon, setPreviewCoupon] = useState<any>({
    code: "DRAPZA40",
    description: "Summer Vault Flash Sale - Flat 40% Off",
    discountType: "percentage",
    discountAmount: 40,
    minOrderValue: 1499,
    maxDiscountAmount: 2500,
    usageLimit: 500,
    usedCount: 84,
    isActive: true,
  });
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountAmount: 20,
    minOrderValue: 0,
    maxDiscountAmount: "",
    usageLimit: "",
    perUserLimit: 1,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    isActive: true,
    applicableCategories: "",
  });

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userActionStatus, setUserActionStatus] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [userConfirmModal, setUserConfirmModal] = useState<{
    isOpen: boolean;
    type: "terminate" | "role" | "delete";
    userId: string;
    userName: string;
    userEmail?: string;
    currentRole?: string;
    targetRole?: "user" | "admin";
  }>({
    isOpen: false,
    type: "terminate",
    userId: "",
    userName: "",
  });
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorFilter, setVisitorFilter] = useState("ALL");
  const [isClearingTelemetry, setIsClearingTelemetry] = useState(false);

  // Modals & Product Customizer CMS State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalTab, setProductModalTab] = useState<"general" | "specs" | "narrative" | "media">("general");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [productStockFilter, setProductStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK">("ALL");
  const [updatingStockIds, setUpdatingStockIds] = useState<Record<string, boolean>>({});
  const [stockInputValues, setStockInputValues] = useState<Record<string, string>>({});
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProductId, setIsDeletingProductId] = useState<string | null>(null);
  const [isSeedingProducts, setIsSeedingProducts] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [isUploadingDetailsImage, setIsUploadingDetailsImage] = useState(false);
  const [productSaveStatus, setProductSaveStatus] = useState<string | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [newColorHex, setNewColorHex] = useState("#1b1b1b");
  const [newCustomSize, setNewCustomSize] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Bulk / Store-Wide Discount Console States
  const [bulkDiscountOpen, setBulkDiscountOpen] = useState(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(20);
  const [bulkDiscountTagActive, setBulkDiscountTagActive] = useState<boolean>(true);
  const [bulkOfferTag, setBulkOfferTag] = useState<string>("20% OFF");
  const [bulkTargetScope, setBulkTargetScope] = useState<"all" | "category" | "in_stock">("all");
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>("ALL");
  const [isApplyingBulkDiscount, setIsApplyingBulkDiscount] = useState<boolean>(false);

  // Image Cropper Studio States
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperTitle, setCropperTitle] = useState<string>("CROP & FIT PRODUCT PHOTO");
  const [cropperInitialBgRemoval, setCropperInitialBgRemoval] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{
    type: "product_add" | "product_replace" | "product_details";
    index?: number;
    rawBase64?: string;
  } | null>(null);

  const defaultProductTemplate = {
    name: "",
    slug: "",
    price: "₹1,440",
    numericPrice: 1440,
    discountPrice: 0,
    discountPercentage: 0,
    discountTagActive: false,
    offerTag: "",
    category: "Kurti",
    description: "An everyday luxury piece engineered with architectural drape, technical movement, and heavyweight brushed texture.",
    detailTitle: "Designed for frictionless movement.",
    details: "A carefully engineered product focused on movement, architectural drape and daily tactile quality.",
    detailsImage: "",
    stock: 100,
    weight: "480 GSM HEAVYWEIGHT FRENCH TERRY",
    blend: "100% PURE MULBERRY SILK",
    cut: "OVERSIZED DROP-SHOULDER ARCHETYPE",
    accentBadge: "ATELIER DROP",
    isFeatured: false,
    colors: ["#1b1b1b", "#7a726c", "#969992"],
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/drapza/products/product_1.png"],
    colorImages: [] as Array<{ color: string; images: string[] }>,
    specifications: "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
    specificationsImage: "",
    shippingTerms: "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
    shippingTermsImage: "",
    showSpecifications: true,
    showShippingTerms: true,
    showParallelForms: true,
    showReviews: true,
    allowAddToCart: true,
    inStock: true,
  };

  const [productForm, setProductForm] = useState(defaultProductTemplate);
  const [activeColorMedia, setActiveColorMedia] = useState<string>("");

  const [newProductModal, setNewProductModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [testEmailInput, setTestEmailInput] = useState("drapza.cloth@gmail.com");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);

  // Lock background body scroll when any modal/popup is open
  useLockBodyScroll(Boolean(productModalOpen || couponModalOpen || selectedOrder || selectedVisitor || userConfirmModal.isOpen));

  // Hero Section CMS State
  const [heroConfig, setHeroConfig] = useState({
    ribbonCategory: "DRAPZA ATELIER 2026",
    ribbonSubtext: "HEAVYWEIGHT TECHNICAL STREETWEAR • EDITION 01",
    ribbonTag: "[ WORLDWIDE AIRWAY DISPATCH ]",
    headlineLine1: "SILHOUETTES FOR",
    headlineLine2: "THE NEXT ERA",
    leftBadgeTag: "ARCHIVE 001",
    leftBadgeTitle: "480 GSM Heavyweight French Terry",
    leftBadgeDesc: "Custom engineered architectural drape.",
    rightBadgeTag: "LIVE INVENTORY",
    rightBadgeTitle: "Instant Express Dispatch",
    rightBadgeDesc: "VIP tracking with live waypoint sync.",
    modelImage: "/images/drapza/home/hero.png",
    modelAlt: "Drapza model wearing luxury tactical modular overshirt and sunglasses",
    modelScale: 125,
    modelOffsetY: 0,
    modelOffsetX: 0,
    modelMaxHeight: 75,
    modelOpacity: 100,
    modelShadow: true,
    modelParallax: true,
    telemetryTag1: "VOID INDEX • 01",
    telemetryTag2: "MODEL V.26",
    telemetryTag3: "LIMITED CAPSULE",
    ctaButtonText: "SCROLL",
    coordinates: "28.6139° N, 77.2090° E",
  });
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isResettingHero, setIsResettingHero] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [heroSaveStatus, setHeroSaveStatus] = useState<string | null>(null);

  // Peel Reveal Section CMS State
  const [peelRevealConfig, setPeelRevealConfig] = useState({
    isEnabled: true,
    signalType: "Signal type: Neutral",
    moduleId: "Module ID: Nrmlss_001",
    status: "Status: Detached",
    splitWordLeft: "Signal",
    splitWordRight: "Motion",
    headline: "The uniform holds no allegiance",
    modelImage: "/peel-reveal/peel-reveal-img.jpg",
    maskImage: "/peel-reveal/peel-reveal-img-mask.png",
    maskLayersCount: 6,
    backgroundColor: "",
    textColor: "",
    splitDistancePercent: 55,
  });
  const [isSavingPeelReveal, setIsSavingPeelReveal] = useState(false);
  const [isResettingPeelReveal, setIsResettingPeelReveal] = useState(false);
  const [isUploadingPeelImage, setIsUploadingPeelImage] = useState(false);
  const [peelRevealSaveStatus, setPeelRevealSaveStatus] = useState<string | null>(null);
  const [peelRevealSimProgress, setPeelRevealSimProgress] = useState(0.65);
  const [isSimulatingScroll, setIsSimulatingScroll] = useState(false);
  const [peelRevealControlTab, setPeelRevealControlTab] = useState<"telemetry" | "headline" | "mask" | "presets">("telemetry");
  const peelSimIntervalRef = useRef<any>(null);

  // Lookbook / Campaign Silhouettes CMS State
  const [lookbookConfig, setLookbookConfig] = useState({
    sectionTag: "[ ARCHIVAL LOOKBOOK • SS26 ]",
    headingLine1: "CAMPAIGN",
    headingLine2: "SILHOUETTES.",
    subtext: "Custom engineered architectural drape and technical silhouettes.",
    isEnabled: true,
    items: [
      {
        id: "01",
        title: "KANJIVARAM SILK SAREE",
        subtitle: "SILHOUETTE 01 • SAREE",
        image: "/images/drapza/products/product_18.png",
        tag: "CAMPAIGN LOOK #1",
        fabric: "100% Pure Mulberry Silk with Gold Zari",
        slug: "kanjivaram-pure-silk-saree",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
      {
        id: "02",
        title: "ANARKALI EMBROIDERED KURTI",
        subtitle: "SILHOUETTE 02 • KURTI",
        image: "/images/drapza/products/product_1.png",
        tag: "CAMPAIGN LOOK #2",
        fabric: "Pure Modal Silk with Potli Buttons",
        slug: "anarkali-embroidered-kurti",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
      {
        id: "03",
        title: "HIGH-WAIST RELAXED JEANS",
        subtitle: "SILHOUETTE 03 • JEANS",
        image: "/images/drapza/products/product_11.png",
        tag: "CAMPAIGN LOOK #3",
        fabric: "13.5 oz Organic Cotton Washed Denim",
        slug: "high-waist-relaxed-jeans",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
      {
        id: "04",
        title: "FLARED CHANDERI PALAZZO",
        subtitle: "SILHOUETTE 04 • PALAZZO/BOTTOM",
        image: "/images/drapza/products/product_4.png",
        tag: "CAMPAIGN LOOK #4",
        fabric: "Chanderi Silk-Cotton Blend",
        slug: "flared-pleated-palazzo",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
      {
        id: "05",
        title: "ORGANZA EMBROIDERED DUPATTA",
        subtitle: "SILHOUETTE 05 • DUPATTA",
        image: "/images/drapza/products/product_21.png",
        tag: "CAMPAIGN LOOK #5",
        fabric: "Sheer Organza with Resham Gota Lace",
        slug: "organza-embroidered-dupatta",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
      {
        id: "06",
        title: "FESTIVE SHARARA / LEHENGA SET",
        subtitle: "SILHOUETTE 06 • SHARARA/LEHENGA",
        image: "/images/drapza/products/product_6.png",
        tag: "CAMPAIGN LOOK #6",
        fabric: "Layered Georgette with Mirror-Work Embellishment",
        slug: "layered-georgette-sharara-lehenga",
        edition: "EDITION 01 / 2026",
        statusTag: "IN ARCHIVE",
        isActive: true,
      },
    ],
  });
  const [isSavingLookbook, setIsSavingLookbook] = useState(false);
  const [isResettingLookbook, setIsResettingLookbook] = useState(false);
  const [isUploadingLookbookImage, setIsUploadingLookbookImage] = useState<number | null>(null);
  const [lookbookSaveStatus, setLookbookSaveStatus] = useState<string | null>(null);
  const [selectedLookbookCardIdx, setSelectedLookbookCardIdx] = useState<number>(0);
  const [lookbookPreviewIdx, setLookbookPreviewIdx] = useState<number>(0);

  // Philosophy / Statement Section CMS State
  const [statementConfig, setStatementConfig] = useState({
    tag: "PHILOSOPHY • ZERO FRICTION",
    subtitle: "Clothing reduced to pure signal",
    statement: "OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT.",
    footerTag: "/ Core State /",
    badgeEdition: "[ EDITION 2026 ]",
    badgeCenter: "DRAPZA ATELIER CORE",
    badgeTerritories: "[ ALL TERRITORIES ]",
    symbolType: "drapza_symbol",
    customSymbolImage: "",
    showFloatingSymbol: true,
    showIcon: true,
    iconScale: 100,
    isEnabled: true,
  });
  const [isSavingStatement, setIsSavingStatement] = useState(false);
  const [isResettingStatement, setIsResettingStatement] = useState(false);
  const [isUploadingStatementSymbol, setIsUploadingStatementSymbol] = useState(false);
  const [statementSaveStatus, setStatementSaveStatus] = useState<string | null>(null);

  // Marquee Banner & Hero Card CMS State
  const [marqueeConfig, setMarqueeConfig] = useState({
    isEnabled: true,
    marqueeHeader1: "Transmission lost in neutral space",
    marqueeHeader2: "Synthetic forms archive the signal",
    tag: "[ Frame Shift ]",
    headline: "Modular silence across systems",
    cardImage: "/marquee-banner/marquee_banner_01.png",
    cardImageAlt: "Marquee banner",
    cardImageOffsetY: -120,
    cardImageOffsetX: 0,
    cardImageScale: 100,
    brandLogoText: "DRAPZA",
    animationSpeed: 20,
    animationDirection: "normal" as "normal" | "reverse",
    backgroundColor: "#edf1e8",
    cardBackgroundColor: "#0f0f0f",
    textColor: "#c4c8bf",
  });
  const [marqueeAnimPlaying, setMarqueeAnimPlaying] = useState<boolean>(true);
  const [marqueeControlTab, setMarqueeControlTab] = useState<"typography" | "card" | "model" | "presets">("typography");
  const [marqueeMotionMode, setMarqueeMotionMode] = useState<"scroll" | "continuous">("scroll");
  const [marqueeScrollProgress, setMarqueeScrollProgress] = useState<number>(0.5);
  const [marqueeTriggerKey, setMarqueeTriggerKey] = useState<number>(0);
  const [isSavingMarquee, setIsSavingMarquee] = useState(false);
  const [isResettingMarquee, setIsResettingMarquee] = useState(false);
  const [isUploadingMarqueeImage, setIsUploadingMarqueeImage] = useState(false);
  const [marqueeSaveStatus, setMarqueeSaveStatus] = useState<string | null>(null);

  // Bundle Stacker / Modular Outfit CMS State
  const [bundleConfig, setBundleConfig] = useState({
    sectionTag: "[ BUNDLE STACKER ]",
    headingLine1: "BUILD YOUR",
    headingLine2: "MODULAR OUTFIT.",
    discountPercent: 15,
    discountBadgeText: "BUNDLE DISPATCH (15% OFF)",
    ctaButtonText: "ADD BUNDLE",
    isEnabled: true,
    items: [
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
    ],
  });
  const [isSavingBundle, setIsSavingBundle] = useState(false);
  const [isResettingBundle, setIsResettingBundle] = useState(false);
  const [isUploadingBundleImage, setIsUploadingBundleImage] = useState<number | null>(null);
  const [bundleSaveStatus, setBundleSaveStatus] = useState<string | null>(null);
  const [selectedBundleLayerIdx, setSelectedBundleLayerIdx] = useState<number>(0);

  // Editorial Text Block / Brand Narrative CMS State
  const [textBlockConfig, setTextBlockConfig] = useState({
    headlineLine1: "DESIGNED ABSENCE,",
    headlineLine2: "ENGINEERED SILENCE.",
    paragraph1:
      "Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.",
    paragraph2:
      "No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who frame.",
    symbolType: "drapza_symbol",
    customSymbolImage: "",
    showSymbol: true,
    isEnabled: true,
    backgroundColor: "#0a0a0a",
    textColor: "#ffffff",
  });
  const [isSavingTextBlock, setIsSavingTextBlock] = useState(false);
  const [isResettingTextBlock, setIsResettingTextBlock] = useState(false);
  const [isUploadingTextBlockSymbol, setIsUploadingTextBlockSymbol] = useState(false);
  const [textBlockSaveStatus, setTextBlockSaveStatus] = useState<string | null>(null);

  // Flash Sale Countdown CMS State
  const [countdownConfig, setCountdownConfig] = useState({
    badgeText: "SUMMER PREMIUM SALE",
    headlineLine1: "Flat 40% Off +",
    headlineLine2: "Free Shipping",
    seasonTag: "AUTUMN SEASON",
    modelImage: "/images/drapza/products/product_1.png",
    imageFit: "contain",
    socialHandle: "FOLLOW US: @DRAPZACLOTH",
    brandTag: "DRAPZA LUXURY",
    description:
      "Get additional discount benefits by stacking multiple luxury custom fits. Perfect opportunity to replenish your boutique wardrobe with trending 2026 drapza designs.",
    circularBadgeText: "FIND YOUR COLOR • FIND YOUR COLOR • ",
    ctaText: "EXPLORE SALE ITEMS",
    ctaLink: "#products",
    discountPercent: 40,
    targetEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isEnabled: true,
  });
  const [isSavingCountdown, setIsSavingCountdown] = useState(false);
  const [isResettingCountdown, setIsResettingCountdown] = useState(false);
  const [isUploadingCountdownImage, setIsUploadingCountdownImage] = useState(false);
  const [countdownSaveStatus, setCountdownSaveStatus] = useState<string | null>(null);

  // Silhouettes Parallax Sim State
  const [ctaSimProgress, setCtaSimProgress] = useState(0.5);
  const [isCtaSimLooping, setIsCtaSimLooping] = useState(false);
  const ctaFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCtaSlot, setPendingCtaSlot] = useState<"left" | "center" | "right">("center");

  // Transmit Signal / Contact Form CMS State
  const [contactConfig, setContactConfig] = useState<ContactConfigData>(DEFAULT_CONTACT_CONFIG);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isResettingContact, setIsResettingContact] = useState(false);
  const [uploadingContactImage, setUploadingContactImage] = useState(false);
  const [contactSaveStatus, setContactSaveStatus] = useState<string | null>(null);
  const [contactSimProgress, setContactSimProgress] = useState(0.5);
  const [isContactSimLooping, setIsContactSimLooping] = useState(false);
  const contactFileInputRef = useRef<HTMLInputElement>(null);

  // Silhouettes / Field Test Tri-Card CMS State
  const [ctaConfig, setCtaConfig] = useState({
    headingLine1: "A FIELD TEST",
    headingLine2: "IN",
    headingLine3: "SILHOUETTES",
    editorialText: "Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion.",
    leftImage: "/images/drapza/cta/cta_img_01.jpg",
    leftImageAlt: "Drapza oversized overshirt from the back",
    centerImage: "/images/drapza/cta/cta_img_02.jpg",
    centerImageAlt: "Two Drapza models in neutral field-test silhouettes",
    rightImage: "/images/drapza/cta/cta_img_03.jpg",
    rightImageAlt: "Drapza modular garment detail",
    ctaText: "Explore Products",
    ctaLink: "#products",
    isEnabled: true,
  });
  const [isSavingCta, setIsSavingCta] = useState(false);
  const [isResettingCta, setIsResettingCta] = useState(false);
  const [uploadingCtaSlot, setUploadingCtaSlot] = useState<"left" | "center" | "right" | null>(null);
  const [ctaSaveStatus, setCtaSaveStatus] = useState<string | null>(null);

  // Material Tactile Science / GSM Loupe CMS State
  const [fabricGsmConfig, setFabricGsmConfig] = useState<FabricGsmConfigData>(DEFAULT_FABRIC_GSM_CONFIG);

  // Runway Reels Shoppable Video CMS State
  const [runwayReelsConfig, setRunwayReelsConfig] = useState<RunwayReelsConfigData>(DEFAULT_RUNWAY_REELS_CONFIG);

  // Genesis Architecture Page CMS State
  const [genesisConfig, setGenesisConfig] = useState<GenesisConfigData>(DEFAULT_GENESIS_CONFIG);

  // WhatsApp Floating Button CMS State
  const [whatsAppButtonConfig, setWhatsAppButtonConfig] = useState<WhatsAppButtonConfigData>(DEFAULT_WHATSAPP_CONFIG);

  // Auth & Login/Register Portal CMS State
  const [authPortalConfig, setAuthPortalConfig] = useState<AuthPortalConfigData>(DEFAULT_AUTH_PORTAL_CONFIG);

  // Silhouettes parallax simulation loop
  useEffect(() => {
    if (!isCtaSimLooping) return;
    let forward = true;
    const interval = setInterval(() => {
      setCtaSimProgress((prev) => {
        if (prev >= 1) forward = false;
        if (prev <= 0) forward = true;
        return forward ? Math.min(1, prev + 0.02) : Math.max(0, prev - 0.02);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isCtaSimLooping]);

  // Transmit Signal contact parallax simulation loop
  useEffect(() => {
    if (!isContactSimLooping) return;
    let forward = true;
    const interval = setInterval(() => {
      setContactSimProgress((prev) => {
        if (prev >= 1) forward = false;
        if (prev <= 0) forward = true;
        return forward ? Math.min(1, prev + 0.02) : Math.max(0, prev - 0.02);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isContactSimLooping]);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "₹1,290",
    numericPrice: 1290,
    category: "Outerwear Unit",
    description: "Architectural silhouette engineered with high-density textile structure.",
    stock: 50,
    weight: "480 GSM HEAVYWEIGHT FRENCH TERRY",
    blend: "100% COMBED ORGANIC COTTON",
    cut: "OVERSIZED DROP-SHOULDER ARCHETYPE",
    colors: "#1b1b1b, #353d36",
    sizes: "S, M, L, XL",
    images: "/images/drapza/products/product_1.png",
  });

  // Fetch all initial data
  const fetchData = async () => {
    // Secondary clearance verification: ensure caller has active admin credentials
    try {
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.startsWith("192.168.") ||
          window.location.hostname === "" ||
          new URLSearchParams(window.location.search).get("demo") === "true");

      if (!isLocal) {
        const userProfile = await userApi.getProfile();
        const isAdmin =
          userProfile?.success &&
          userProfile?.user &&
          (userProfile.user.role === "admin" ||
            userProfile.user.email?.toLowerCase() === "drapza.cloth@gmail.com");

        if (!isAdmin) {
          router.replace("/");
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
            window.location.replace("/");
          }
          return;
        }
      }
    } catch (e) {
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.startsWith("192.168.") ||
          window.location.hostname === "" ||
          new URLSearchParams(window.location.search).get("demo") === "true");

      if (!isLocal) {
        router.replace("/");
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
          window.location.replace("/");
        }
        return;
      }
    }

    setRefreshing(true);
    try {
      const [statsRes, ordersRes, productsRes, usersRes, heroRes, statementRes, marqueeRes, countdownRes, bundleRes, textBlockRes, peelRes, lookbookRes, telemetryRes, couponsRes, ctaRes, filterRes, gstRes, paymentRes, footerRes, siteRes, bogoRes, testimonialsRes, fabricGsmRes, runwayReelsRes, authPortalRes, genesisRes, whatsAppRes, touchpointRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getAllOrders({ limit: 100 }),
        productApi.getAll({ limit: 100, includeOutOfStock: true }),
        adminApi.getAllUsers(),
        heroApi.getHeroConfig(),
        statementApi.getStatementConfig(),
        marqueeApi.getMarqueeConfig(),
        countdownApi.getCountdownConfig(),
        bundleApi.getBundleConfig(),
        textBlockApi.getTextBlockConfig(),
        peelRevealApi.getPeelRevealConfig(),
        lookbookApi.getLookbookConfig(),
        telemetryApi.getAllLocations(),
        couponApi.getAll(),
        ctaApi.getCtaConfig(),
        filterConfigApi.getFilterConfig(),
        gstConfigApi.getGstConfig(),
        paymentConfigApi.getPaymentConfig(),
        footerConfigApi.getFooterConfig(),
        siteConfigApi.getSiteConfig(),
        bogoConfigApi.getBogoConfig(),
        testimonialsConfigApi.getTestimonialsConfig(),
        fabricGsmApi.getConfig(),
        runwayReelsApi.getConfig(),
        authPortalApi.getConfig(),
        genesisApi.getConfig(),
        whatsAppApi.getConfig(),
        touchpointConfigApi.getTouchpointConfig(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.stats);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.success) {
        setOrders(ordersRes.value.orders || []);
      }
      if (productsRes.status === "fulfilled" && productsRes.value?.success) {
        setProducts(productsRes.value.products || []);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.success) {
        setUsers(usersRes.value.users || []);
      }
      if (couponsRes.status === "fulfilled" && couponsRes.value?.success) {
        setCoupons(couponsRes.value.data || []);
      }
      if (heroRes.status === "fulfilled" && heroRes.value?.success && heroRes.value.data) {
        setHeroConfig((prev) => ({ ...prev, ...heroRes.value.data }));
      }
      if (statementRes.status === "fulfilled" && statementRes.value?.success && statementRes.value.data) {
        setStatementConfig((prev) => ({ ...prev, ...statementRes.value.data }));
      }
      if (marqueeRes.status === "fulfilled" && marqueeRes.value?.success && marqueeRes.value.data) {
        setMarqueeConfig((prev) => ({ ...prev, ...marqueeRes.value.data }));
      }
      if (countdownRes.status === "fulfilled" && countdownRes.value?.success && countdownRes.value.data) {
        const cData = countdownRes.value.data;
        const formattedDate = cData.targetEndDate
          ? new Date(cData.targetEndDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16);
        setCountdownConfig((prev) => ({
          ...prev,
          ...cData,
          targetEndDate: formattedDate,
        }));
      }
      if (ctaRes.status === "fulfilled" && ctaRes.value?.success && ctaRes.value.data) {
        setCtaConfig((prev) => ({ ...prev, ...ctaRes.value.data }));
      }
      if (bundleRes.status === "fulfilled" && bundleRes.value?.success && bundleRes.value.data) {
        setBundleConfig((prev) => ({
          ...prev,
          ...bundleRes.value.data,
          items: bundleRes.value.data.items && bundleRes.value.data.items.length > 0
            ? bundleRes.value.data.items
            : prev.items,
        }));
      }
      if (textBlockRes.status === "fulfilled" && textBlockRes.value?.success && textBlockRes.value.data) {
        setTextBlockConfig((prev) => ({ ...prev, ...textBlockRes.value.data }));
      }
      if (peelRes.status === "fulfilled" && peelRes.value?.success && peelRes.value.data) {
        setPeelRevealConfig((prev) => ({ ...prev, ...peelRes.value.data }));
      }
      if (lookbookRes.status === "fulfilled" && lookbookRes.value?.success && lookbookRes.value.data) {
        setLookbookConfig((prev) => ({
          ...prev,
          ...lookbookRes.value.data,
          items: lookbookRes.value.data.items && lookbookRes.value.data.items.length > 0
            ? lookbookRes.value.data.items
            : prev.items,
        }));
      }
      if (telemetryRes.status === "fulfilled" && telemetryRes.value?.success) {
        setVisitorLocations(telemetryRes.value.locations || []);
        if (telemetryRes.value.stats) {
          setVisitorStats(telemetryRes.value.stats);
        }
      }
      if (filterRes.status === "fulfilled" && filterRes.value?.success && filterRes.value.data) {
        setFilterConfig(filterRes.value.data);
        try {
          localStorage.setItem("drapza_wardrobe_filter_options", JSON.stringify(filterRes.value.data));
        } catch (e) { }
      }
      if (gstRes.status === "fulfilled" && gstRes.value?.success && gstRes.value.data) {
        setGstConfig(gstRes.value.data);
        try {
          localStorage.setItem("drapza_gst_config", JSON.stringify(gstRes.value.data));
        } catch (e) { }
      }
      if (paymentRes.status === "fulfilled" && paymentRes.value?.success && paymentRes.value.data) {
        setPaymentConfig(paymentRes.value.data);
        try {
          localStorage.setItem("drapza_payment_config", JSON.stringify(paymentRes.value.data));
        } catch (e) { }
      }
      if (footerRes.status === "fulfilled" && footerRes.value?.success && footerRes.value.data) {
        setFooterConfig(footerRes.value.data);
      }
      if (siteRes.status === "fulfilled" && siteRes.value?.success && siteRes.value.data) {
        setSiteConfig(siteRes.value.data);
        try {
          localStorage.setItem("drapza_site_identity_config", JSON.stringify(siteRes.value.data));
        } catch (e) { }
      }
      if (bogoRes.status === "fulfilled" && bogoRes.value?.success && bogoRes.value.data) {
        setBogoConfig(bogoRes.value.data);
      }
      if (testimonialsRes.status === "fulfilled" && testimonialsRes.value?.success && testimonialsRes.value.data) {
        setTestimonialsConfig(testimonialsRes.value.data);
      }
      if (fabricGsmRes.status === "fulfilled" && fabricGsmRes.value?.success && fabricGsmRes.value.data) {
        setFabricGsmConfig(fabricGsmRes.value.data);
      }
      if (runwayReelsRes.status === "fulfilled" && runwayReelsRes.value?.success && runwayReelsRes.value.data) {
        setRunwayReelsConfig(runwayReelsRes.value.data);
      }
      if (authPortalRes.status === "fulfilled" && authPortalRes.value?.success && authPortalRes.value.data) {
        setAuthPortalConfig(authPortalRes.value.data);
      }
      if (genesisRes.status === "fulfilled" && genesisRes.value) {
        const val: any = genesisRes.value;
        const gData = val.data || val;
        if (gData && gData.hero) {
          setGenesisConfig(gData as GenesisConfigData);
        }
      }
      if (whatsAppRes.status === "fulfilled" && whatsAppRes.value) {
        const val: any = whatsAppRes.value;
        const waData = val.data || val;
        if (waData && typeof waData.isEnabled !== "undefined") {
          setWhatsAppButtonConfig(waData as WhatsAppButtonConfigData);
        }
      }
    } catch (err) {
      console.error("[ADMIN DATA FETCH ERROR]:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("drapza_wardrobe_filter_options");
      if (cached) {
        setFilterConfig(JSON.parse(cached));
      }
      const cachedGst = localStorage.getItem("drapza_gst_config");
      if (cachedGst) {
        setGstConfig(JSON.parse(cachedGst));
      }
      const cachedPayment = localStorage.getItem("drapza_payment_config");
      if (cachedPayment) {
        setPaymentConfig(JSON.parse(cachedPayment));
      }
      const cachedBogo = localStorage.getItem("drapza_bogo_config");
      if (cachedBogo) {
        setBogoConfig(JSON.parse(cachedBogo));
      }
    } catch (e) { }
    fetchData();
  }, []);

  // Refresh GSAP ScrollTrigger whenever Marquee Banner tab is opened
  useEffect(() => {
    if (activeTab === "marquee") {
      const timer = setTimeout(() => {
        try {
          import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
            ScrollTrigger.refresh();
          });
        } catch (_) { }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Update order status handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= PRODUCT & GARMENT ARCHIVE CMS HANDLERS =================
  const handleOpenCreateProductModal = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      slug: "",
      price: "₹1,440",
      numericPrice: 1440,
      discountPrice: 720,
      discountPercentage: 50,
      discountTagActive: false,
      offerTag: "50% OFF",
      category: "Kurti",
      description: "An everyday luxury piece engineered with architectural drape, technical movement, and heavyweight brushed texture.",
      detailTitle: "Designed for frictionless movement.",
      details: "A carefully engineered product focused on movement, architectural drape and daily tactile quality.",
      detailsImage: "",
      stock: 100,
      weight: "480 GSM HEAVYWEIGHT FRENCH TERRY",
      blend: "100% PURE MULBERRY SILK",
      cut: "OVERSIZED DROP-SHOULDER ARCHETYPE",
      accentBadge: "ATELIER DROP",
      isFeatured: false,
      colors: ["#1b1b1b", "#7a726c", "#969992"],
      sizes: ["S", "M", "L", "XL"],
      images: ["/images/drapza/products/product_1.png"],
      colorImages: [],
      specifications: "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
      specificationsImage: "",
      shippingTerms: "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
      shippingTermsImage: "",
      showSpecifications: true,
      showShippingTerms: true,
      showParallelForms: true,
      showReviews: true,
      allowAddToCart: true,
      inStock: true,
    });
    setActiveColorMedia("#1b1b1b");
    setProductModalTab("general");
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProductModal = (prod: any) => {
    setEditingProductId(prod._id || prod.id);
    const discPct = Number(prod.discountPercentage) || 0;
    const isTagActive = prod.discountTagActive !== false && (Boolean(prod.discountTagActive) || discPct > 0);
    setProductForm({
      name: prod.name || "",
      slug: prod.slug || "",
      price: prod.price || `₹${prod.numericPrice || 990}`,
      numericPrice: Number(prod.numericPrice) || 990,
      discountPrice: Number(prod.discountPrice) || (discPct > 0 ? Math.round((Number(prod.numericPrice) || 990) * (1 - discPct / 100)) : 0),
      discountPercentage: discPct,
      discountTagActive: isTagActive,
      offerTag: prod.offerTag || (discPct > 0 ? `${discPct}% OFF` : ""),
      category: prod.category || "Outerwear Unit",
      description: prod.description || "",
      detailTitle: prod.detailTitle || "Designed for frictionless movement.",
      details: prod.details || "A carefully engineered product focused on movement, architectural drape and daily tactile quality.",
      detailsImage: prod.detailsImage || "",
      stock: Number(prod.stock) || 100,
      weight: prod.weight || "480 GSM HEAVYWEIGHT FRENCH TERRY",
      blend: prod.blend || "100% COMBED ORGANIC COTTON",
      cut: prod.cut || "OVERSIZED DROP-SHOULDER ARCHETYPE",
      accentBadge: prod.accentBadge || "AUTHENTICATED ARCHIVE",
      isFeatured: prod.isFeatured || false,
      colors: Array.isArray(prod.colors) && prod.colors.length > 0 ? prod.colors : ["#1b1b1b"],
      sizes: Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ["S", "M", "L", "XL"],
      images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : ["/images/drapza/products/product_1.png"],
      colorImages: Array.isArray(prod.colorImages) ? prod.colorImages : [],
      specifications: prod.specifications ?? "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
      specificationsImage: prod.specificationsImage || "",
      shippingTerms: prod.shippingTerms ?? "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
      shippingTermsImage: prod.shippingTermsImage || "",
      showSpecifications: prod.showSpecifications !== false,
      showShippingTerms: prod.showShippingTerms !== false,
      showParallelForms: prod.showParallelForms !== false,
      showReviews: prod.showReviews !== false,
      allowAddToCart: prod.allowAddToCart !== false,
      inStock: prod.inStock !== false,
    });
    setActiveColorMedia((Array.isArray(prod.colors) && prod.colors[0]) || "#1b1b1b");
    setProductModalTab("general");
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleDuplicateProduct = (prod: any) => {
    setEditingProductId(null);
    const discPct = Number(prod.discountPercentage) || 0;
    setProductForm({
      name: `${prod.name || "GARMENT"} (CLONE)`,
      slug: `${prod.slug || "garment"}-clone-${Date.now().toString().slice(-4)}`,
      price: prod.price || `₹${prod.numericPrice || 990}`,
      numericPrice: Number(prod.numericPrice) || 990,
      discountPrice: Number(prod.discountPrice) || (discPct > 0 ? Math.round((Number(prod.numericPrice) || 990) * (1 - discPct / 100)) : 0),
      discountPercentage: discPct,
      discountTagActive: prod.discountTagActive ?? false,
      offerTag: prod.offerTag || (discPct > 0 ? `${discPct}% OFF` : ""),
      category: prod.category || "Outerwear Unit",
      description: prod.description || "",
      detailTitle: prod.detailTitle || "Designed for frictionless movement.",
      details: prod.details || "A carefully engineered product focused on movement, architectural drape and daily tactile quality.",
      detailsImage: prod.detailsImage || "",
      stock: Number(prod.stock) || 100,
      weight: prod.weight || "480 GSM HEAVYWEIGHT FRENCH TERRY",
      blend: prod.blend || "100% COMBED ORGANIC COTTON",
      cut: prod.cut || "OVERSIZED DROP-SHOULDER ARCHETYPE",
      accentBadge: "NEW DROP",
      isFeatured: false,
      colors: Array.isArray(prod.colors) && prod.colors.length > 0 ? prod.colors : ["#1b1b1b"],
      sizes: Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ["S", "M", "L", "XL"],
      images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : ["/images/drapza/products/product_1.png"],
      colorImages: Array.isArray(prod.colorImages) ? prod.colorImages : [],
      specifications: prod.specifications ?? "Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.",
      specificationsImage: prod.specificationsImage || "",
      shippingTerms: prod.shippingTerms ?? "All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.\n\nWe accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.",
      shippingTermsImage: prod.shippingTermsImage || "",
      showSpecifications: prod.showSpecifications !== false,
      showShippingTerms: prod.showShippingTerms !== false,
      showParallelForms: prod.showParallelForms !== false,
      showReviews: prod.showReviews !== false,
      allowAddToCart: prod.allowAddToCart !== false,
      inStock: prod.inStock !== false,
    });
    setActiveColorMedia((Array.isArray(prod.colors) && prod.colors[0]) || "#1b1b1b");
    setProductModalTab("general");
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleQuickToggleDiscountTag = async (prod: any) => {
    const nextVal = !prod.discountTagActive;
    const defaultPercent = Number(prod.discountPercentage) > 0 ? Number(prod.discountPercentage) : 50;
    const tagText = prod.offerTag || `${defaultPercent}% OFF`;
    const baseNumPrice = Number(prod.numericPrice) || 990;
    const discPrice = Math.round(baseNumPrice * (1 - defaultPercent / 100));

    // Optimistic local update
    setProducts((prev) =>
      prev.map((p) =>
        p._id === prod._id
          ? {
            ...p,
            discountTagActive: nextVal,
            discountPercentage: defaultPercent,
            discountPrice: discPrice,
            offerTag: tagText,
          }
          : p
      )
    );

    try {
      const res = await adminApi.updateProduct(prod._id, {
        discountTagActive: nextVal,
        discountPercentage: defaultPercent,
        discountPrice: discPrice,
        offerTag: tagText,
      });
      if (res && res.success) {
        setProductSaveStatus(
          nextVal
            ? `✓ Discount offer tag [${tagText}] ENABLED on storefront for "${prod.name}"`
            : `✓ Discount offer tag DISABLED for "${prod.name}"`
        );
        setTimeout(() => setProductSaveStatus(null), 3500);
      }
    } catch (err: any) {
      setProductSaveStatus(`⚠️ Failed to toggle discount tag: ${err.message}`);
      setTimeout(() => setProductSaveStatus(null), 3500);
    }
  };

  const handleApplyBulkDiscount = async (action: "apply" | "remove" | "toggle_active") => {
    setIsApplyingBulkDiscount(true);
    setProductSaveStatus(null);
    try {
      const pct = Math.max(0, Math.min(99, Number(bulkDiscountPercent) || 0));
      const payload = {
        discountPercentage: pct,
        discountTagActive: bulkDiscountTagActive,
        offerTag: bulkOfferTag.trim() || `${pct}% OFF`,
        targetScope: bulkTargetScope,
        targetCategory: bulkTargetCategory,
        action,
      };

      const res = await adminApi.applyBulkDiscount(payload);
      if (res && res.success) {
        // Optimistically update products in memory
        setProducts((prev) =>
          prev.map((p) => {
            const matchesCategory =
              bulkTargetScope !== "category" ||
              bulkTargetCategory === "ALL" ||
              p.category === bulkTargetCategory;
            const matchesStock = bulkTargetScope !== "in_stock" || Number(p.stock) > 0;
            if (!matchesCategory || !matchesStock) return p;

            if (action === "remove") {
              return {
                ...p,
                discountPercentage: 0,
                discountPrice: 0,
                discountTagActive: false,
                offerTag: "",
              };
            }

            if (action === "toggle_active") {
              return {
                ...p,
                discountTagActive: bulkDiscountTagActive,
              };
            }

            // Standard apply
            const basePrice = Number(p.numericPrice) || 990;
            const discPrice = Math.round(basePrice * (1 - pct / 100));
            return {
              ...p,
              discountPercentage: pct,
              discountPrice: discPrice,
              discountTagActive: bulkDiscountTagActive,
              offerTag: payload.offerTag,
            };
          })
        );

        setProductSaveStatus(`✓ ${res.message || "Bulk discount applied successfully."}`);
        setTimeout(() => setProductSaveStatus(null), 5000);
      } else {
        setProductSaveStatus(`⚠️ ${res?.message || "Failed to execute bulk discount operation."}`);
        setTimeout(() => setProductSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setProductSaveStatus(`⚠️ Failed: ${err.message || "Network error"}`);
      setTimeout(() => setProductSaveStatus(null), 5000);
    } finally {
      setIsApplyingBulkDiscount(false);
    }
  };

  const handleSaveProduct = async (formDataParam?: any) => {
    const formToUse = formDataParam || productForm;
    setProductFormError(null);

    const validation = adminProductSchema.safeParse({
      name: (formToUse.name || "").trim(),
      numericPrice: Number(formToUse.numericPrice),
      discountPrice: Number(formToUse.discountPrice) || 0,
      discountPercentage: Number(formToUse.discountPercentage) || 0,
      category: (formToUse.category || "").trim(),
      description: (formToUse.description || "").trim(),
      stock: Number(formToUse.stock) || 0,
    });

    if (!validation.success) {
      setProductFormError(getZodErrorMessage(validation.error));
      return;
    }

    const cleanName = (formToUse.name || "").trim();
    const numPrice = Number(formToUse.numericPrice);
    const cleanSlug =
      (formToUse.slug || "").trim() ||
      cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const parsedDiscountPercent = Number(formToUse.discountPercentage) || 0;
    const parsedDiscountPrice = Number(formToUse.discountPrice) || (parsedDiscountPercent > 0 ? Math.round(numPrice * (1 - parsedDiscountPercent / 100)) : 0);

    const rawImages = formToUse.images && formToUse.images.length > 0 ? formToUse.images : ["/images/drapza/products/product_1.png"];
    const sanitizedImages = normalizeImageUrls(rawImages);

    const payload = {
      ...formToUse,
      name: cleanName,
      slug: cleanSlug,
      price: formToUse.price || `₹${numPrice.toLocaleString("en-IN")}`,
      numericPrice: numPrice,
      discountPrice: parsedDiscountPrice,
      discountPercentage: parsedDiscountPercent,
      discountTagActive: Boolean(formToUse.discountTagActive),
      offerTag: formToUse.offerTag || (parsedDiscountPercent > 0 ? `${parsedDiscountPercent}% OFF` : ""),
      stock: Number(formToUse.stock) || 100,
      images: sanitizedImages,
      detailsImage: normalizeImageUrl(formToUse.detailsImage || ""),
      specificationsImage: formToUse.specificationsImage ? normalizeImageUrl(formToUse.specificationsImage) : "",
      shippingTermsImage: formToUse.shippingTermsImage ? normalizeImageUrl(formToUse.shippingTermsImage) : "",
      colors: formToUse.colors && formToUse.colors.length > 0 ? formToUse.colors : ["#1b1b1b"],
      colorImages: Array.isArray(formToUse.colorImages) ? formToUse.colorImages : [],
      sizes: formToUse.sizes && formToUse.sizes.length > 0 ? formToUse.sizes : ["S", "M", "L", "XL"],
    };

    setIsSavingProduct(true);
    try {
      if (editingProductId) {
        const res = await adminApi.updateProduct(editingProductId, payload);
        if (res && res.success) {
          setProductSaveStatus(`✓ Garment specification "${cleanName}" updated and synchronized live!`);
          setProducts((prev) =>
            prev.map((p) => (p._id === editingProductId ? { ...p, ...payload, ...(res.product || {}) } : p))
          );
          setProductModalOpen(false);
          setTimeout(() => setProductSaveStatus(null), 5000);
        } else {
          setProductFormError(res?.message || "Failed to update garment specification.");
        }
      } else {
        const res = await adminApi.createProduct(payload);
        if (res && res.success) {
          setProductSaveStatus(`✓ New garment "${cleanName}" successfully registered in catalog!`);
          if (res.product) {
            setProducts((prev) => [res.product, ...prev]);
          } else {
            fetchData();
          }
          setProductModalOpen(false);
          setTimeout(() => setProductSaveStatus(null), 5000);
        } else {
          setProductFormError(res?.message || "Failed to register new garment.");
        }
      }
    } catch (err: any) {
      setProductFormError(`Network error: ${err.message}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to permanently retire garment "${name || id}" from the atelier catalog?`)) return;
    setIsDeletingProductId(id);
    try {
      const res = await adminApi.deleteProduct(id);
      if (res && res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setProductSaveStatus(`✓ Garment "${name || id}" removed from active catalog.`);
        setTimeout(() => setProductSaveStatus(null), 4000);
      } else {
        alert(res?.message || "Failed to delete garment.");
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeletingProductId(null);
    }
  };

  const handleSeedDefaultProducts = async () => {
    if (!window.confirm("Seed all 16 predefined Drapza luxury archive garments into the database?")) return;
    setIsSeedingProducts(true);
    setProductSaveStatus("Seeding atelier catalog garments...");
    try {
      const res = await adminApi.seedProducts(true);
      if (res && res.success) {
        setProductSaveStatus("✓ All 16 Luxury Archive Garments seeded and synchronized live!");
        await fetchData();
        setTimeout(() => setProductSaveStatus(null), 5000);
      } else {
        setProductSaveStatus(`✕ ${res?.message || "Seeding failed"}`);
      }
    } catch (err: any) {
      setProductSaveStatus(`✕ Error: ${err.message}`);
    } finally {
      setIsSeedingProducts(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    const clampedStock = Math.max(0, Math.floor(newStock));
    // 1. Instant optimistic update in local products state
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, stock: clampedStock } : p))
    );
    setStockInputValues((prev) => ({ ...prev, [productId]: String(clampedStock) }));
    setUpdatingStockIds((prev) => ({ ...prev, [productId]: true }));

    try {
      const res = await adminApi.updateStock(productId, clampedStock);
      if (res && res.success) {
        setProductSaveStatus(`✓ Inventory level updated: ${clampedStock} units recorded.`);
        setTimeout(() => setProductSaveStatus(null), 3500);
      } else {
        setProductSaveStatus(`⚠️ ${res?.message || "Failed to update stock."}`);
        setTimeout(() => setProductSaveStatus(null), 3500);
      }
    } catch (err: any) {
      setProductSaveStatus(`⚠️ ${err.message || "Failed to update stock level."}`);
      setTimeout(() => setProductSaveStatus(null), 3500);
    } finally {
      setUpdatingStockIds((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleToggleStorefrontHideOutOfStock = async () => {
    const nextVal = !(filterConfig?.hideOutOfStockOnStorefront ?? false);
    setFilterConfig((prev) => ({ ...prev, hideOutOfStockOnStorefront: nextVal }));
    try {
      const res = await filterConfigApi.updateFilterConfig({ hideOutOfStockOnStorefront: nextVal });
      if (res && res.success) {
        setProductSaveStatus(
          nextVal
            ? "✓ Out-of-stock garments are now HIDDEN from public customer storefront (/wardrobe)."
            : "✓ Out-of-stock garments are now VISIBLE on storefront with OUT OF STOCK badge."
        );
        setTimeout(() => setProductSaveStatus(null), 4000);
      }
    } catch (err: any) {
      setProductSaveStatus(`⚠️ Failed to update storefront visibility: ${err.message}`);
      setTimeout(() => setProductSaveStatus(null), 3500);
    }
  };

  // ── IMAGE CROPPING & UPLOAD HANDLERS ────────────────────────────────────
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCropperImageSrc(base64);
      setCropperInitialBgRemoval(false);
      setCropperTitle("CROP, SCALE & REMOVE BACKGROUND");
      setCropperTarget({ type: "product_add", rawBase64: base64 });
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReplaceProductImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCropperImageSrc(base64);
      setCropperInitialBgRemoval(false);
      setCropperTitle(`CROP & FIT PHOTO (SLOT #${index + 1})`);
      setCropperTarget({ type: "product_replace", index, rawBase64: base64 });
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDetailsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCropperImageSrc(base64);
      setCropperInitialBgRemoval(false);
      setCropperTitle("CROP STORY & ARCHITECTURAL FOCUS PHOTO");
      setCropperTarget({ type: "product_details", rawBase64: base64 });
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOpenCropperForExisting = (imageSrc: string, index?: number, isDetails?: boolean, initialBgRemoval: boolean = false) => {
    setCropperImageSrc(imageSrc);
    setCropperInitialBgRemoval(initialBgRemoval);
    if (isDetails) {
      setCropperTitle(initialBgRemoval ? "REMOVE BACKGROUND & FIT STORY PHOTO" : "RE-CROP & FIT STORY PHOTO");
      setCropperTarget({ type: "product_details", rawBase64: imageSrc });
    } else if (typeof index === "number") {
      setCropperTitle(initialBgRemoval ? `REMOVE BACKGROUND (SLOT #${index + 1})` : `RE-CROP & FIT PHOTO (SLOT #${index + 1})`);
      setCropperTarget({ type: "product_replace", index, rawBase64: imageSrc });
    }
    setCropperModalOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    if (!cropperTarget) return;

    if (cropperTarget.type === "product_add") {
      setIsUploadingProductImage(true);
      try {
        const res = await heroApi.uploadHeroImage(croppedDataUrl);
        if (res && res.success && res.url) {
          setProductForm((prev) => ({
            ...prev,
            images: [res.url, ...prev.images.filter((img) => img !== res.url)],
          }));
        } else {
          alert(res?.message || "Upload failed");
        }
      } catch (err: any) {
        alert(`Upload error: ${err.message}`);
      } finally {
        setIsUploadingProductImage(false);
      }
    } else if (cropperTarget.type === "product_replace" && typeof cropperTarget.index === "number") {
      const idx = cropperTarget.index;
      setIsUploadingProductImage(true);
      try {
        const res = await heroApi.uploadHeroImage(croppedDataUrl);
        if (res && res.success && res.url) {
          setProductForm((prev) => {
            const next = [...prev.images];
            next[idx] = res.url;
            return { ...prev, images: next };
          });
        } else {
          alert(res?.message || "Upload failed");
        }
      } catch (err: any) {
        alert(`Upload error: ${err.message}`);
      } finally {
        setIsUploadingProductImage(false);
      }
    } else if (cropperTarget.type === "product_details") {
      setIsUploadingDetailsImage(true);
      try {
        const res = await heroApi.uploadHeroImage(croppedDataUrl);
        if (res && res.success && res.url) {
          setProductForm((prev) => ({
            ...prev,
            detailsImage: res.url,
          }));
        } else {
          alert(res?.message || "Story image upload failed");
        }
      } catch (err: any) {
        alert(`Upload error: ${err.message}`);
      } finally {
        setIsUploadingDetailsImage(false);
      }
    }
  };

  const handleSkipCrop = async () => {
    if (!cropperTarget?.rawBase64) return;
    await handleCropComplete(cropperTarget.rawBase64);
  };

  const handleSetCoverImage = (index: number) => {
    setProductForm((prev) => {
      if (index === 0 || !prev.images[index]) return prev;
      const target = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: [target, ...rest],
      };
    });
  };

  // ================= COUPON CMS HANDLERS =================
  const handleOpenCreateCouponModal = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountAmount: 20,
      minOrderValue: 0,
      maxDiscountAmount: "",
      usageLimit: "",
      perUserLimit: 1,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      isActive: true,
      applicableCategories: "",
    });
    setCouponFormError(null);
    setCouponFieldErrors({});
    setCouponModalOpen(true);
  };

  const handleOpenEditCouponModal = (coupon: any) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountAmount: coupon.discountAmount || 20,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscountAmount: coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined ? String(coupon.maxDiscountAmount) : "",
      usageLimit: coupon.usageLimit !== null && coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit || 1,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : "",
      isActive: coupon.isActive !== false,
      applicableCategories: Array.isArray(coupon.applicableCategories) ? coupon.applicableCategories.join(", ") : "",
    });
    setCouponFormError(null);
    setCouponFieldErrors({});
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormError(null);
    setCouponFieldErrors({});

    const cleanCode = couponForm.code.trim().toUpperCase();
    const numDiscount = Number(couponForm.discountAmount);

    const validation = adminCouponSchema.safeParse({
      code: cleanCode,
      description: couponForm.description?.trim() || "",
      discountType: couponForm.discountType,
      discountAmount: numDiscount,
      minOrderValue: Number(couponForm.minOrderValue) || 0,
      maxDiscountAmount: couponForm.maxDiscountAmount !== "" && couponForm.maxDiscountAmount != null ? Number(couponForm.maxDiscountAmount) : null,
      usageLimit: couponForm.usageLimit !== "" && couponForm.usageLimit != null ? Number(couponForm.usageLimit) : null,
      perUserLimit: Number(couponForm.perUserLimit) || 1,
      startDate: couponForm.startDate || undefined,
      expiryDate: couponForm.expiryDate || null,
      isActive: couponForm.isActive,
    });

    if (!validation.success) {
      setCouponFormError(getZodErrorMessage(validation.error));
      setCouponFieldErrors(getZodFieldErrors(validation.error));
      return;
    }
    setCouponFieldErrors({});

    setIsSavingCoupon(true);
    try {
      const payload: any = {
        code: cleanCode,
        description: couponForm.description.trim(),
        discountType: couponForm.discountType,
        discountAmount: numDiscount,
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        maxDiscountAmount: couponForm.maxDiscountAmount !== "" ? Number(couponForm.maxDiscountAmount) : null,
        usageLimit: couponForm.usageLimit !== "" ? Number(couponForm.usageLimit) : null,
        perUserLimit: Number(couponForm.perUserLimit) || 1,
        startDate: couponForm.startDate ? new Date(couponForm.startDate).toISOString() : new Date().toISOString(),
        expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate).toISOString() : null,
        isActive: couponForm.isActive,
        applicableCategories: couponForm.applicableCategories
          ? couponForm.applicableCategories.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      let res: any;
      if (editingCouponId) {
        res = await couponApi.update(editingCouponId, payload);
      } else {
        res = await couponApi.create(payload);
      }

      if (res && res.success) {
        setCouponSaveStatus(`✓ Coupon '${cleanCode}' successfully saved and active!`);
        setTimeout(() => setCouponSaveStatus(null), 5000);
        setCouponModalOpen(false);
        // Refresh coupons
        const refreshed = await couponApi.getAll();
        if (refreshed.success && refreshed.data) {
          setCoupons(refreshed.data);
        }
      } else {
        setCouponFormError(res?.message || "Failed to save coupon.");
      }
    } catch (err: any) {
      setCouponFormError(err.message || "An unexpected error occurred while saving coupon.");
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleToggleCouponStatus = async (id: string) => {
    setIsTogglingCouponId(id);
    try {
      const res = await couponApi.toggleStatus(id);
      if (res.success && res.data) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isActive: res.data.isActive } : c))
        );
      }
    } catch (err) {
      console.error("[TOGGLE COUPON ERROR]:", err);
    } finally {
      setIsTogglingCouponId(null);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon '${code}'? Customers will no longer be able to redeem this promo code.`)) return;
    setIsDeletingCouponId(id);
    try {
      const res = await couponApi.delete(id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        setCouponSaveStatus(`✓ Coupon '${code}' deleted from vault.`);
        setTimeout(() => setCouponSaveStatus(null), 4000);
      }
    } catch (err) {
      console.error("[DELETE COUPON ERROR]:", err);
    } finally {
      setIsDeletingCouponId(null);
    }
  };

  const handleSeedDefaultCoupons = async (force: boolean = false) => {
    setIsSeedingCoupons(true);
    try {
      const res = await couponApi.seedCoupons(force);
      if (res.success && res.data) {
        setCoupons(res.data);
        setCouponSaveStatus("✓ Default curated voucher codes seeded successfully!");
        setTimeout(() => setCouponSaveStatus(null), 4000);
      }
    } catch (err) {
      console.error("[SEED COUPONS ERROR]:", err);
    } finally {
      setIsSeedingCoupons(false);
    }
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);
  };

  const handleGenerateRandomCode = (prefix: string = "DRAPZA") => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const year = "26";
    const generated = `${prefix}${randomSuffix}`;
    setCouponForm((prev) => ({ ...prev, code: generated }));
  };



  // Send Test Mail handler
  const handleSendTestMail = async () => {
    setIsSendingTestMail(true);
    setEmailStatus(null);
    try {
      const res = await userApi.testSmtp(testEmailInput);
      if (res.success) {
        setEmailStatus(`✓ Success: ${res.message}`);
      } else {
        setEmailStatus(`✕ Failed: ${res.message || "Could not dispatch"}`);
      }
    } catch (err: any) {
      setEmailStatus(`✕ Error: ${err.message}`);
    } finally {
      setIsSendingTestMail(false);
    }
  };

  // Hero Section CMS Actions
  const handleSaveHeroConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingHero(true);
    setHeroSaveStatus(null);
    try {
      const res = await heroApi.updateHeroConfig(heroConfig);
      if (res && res.success) {
        const updated = res.data || heroConfig;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("drapza_hero_config", JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("drapza_hero_config_updated", { detail: updated }));
            if ("BroadcastChannel" in window) {
              const channel = new BroadcastChannel("drapza_hero_channel");
              channel.postMessage({ type: "HERO_CONFIG_UPDATED", payload: updated });
              channel.close();
            }
          } catch (_) { }
        }
        setHeroSaveStatus("✓ Hero changes published and synchronized with Live Homepage!");
        setTimeout(() => setHeroSaveStatus(null), 5000);
      } else {
        setHeroSaveStatus(`✕ ${res?.message || "Failed to publish hero configuration"}`);
      }
    } catch (err: any) {
      setHeroSaveStatus(`✕ Network error saving hero configuration: ${err.message}`);
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleResetHeroConfig = async () => {
    if (!window.confirm("Are you sure you want to reset all Hero Section copy, headlines & visuals back to default factory settings?")) return;
    setIsResettingHero(true);
    setHeroSaveStatus(null);
    try {
      const res = await heroApi.resetHeroConfig();
      if (res && res.success && res.data) {
        setHeroConfig(res.data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("drapza_hero_config", JSON.stringify(res.data));
            window.dispatchEvent(new CustomEvent("drapza_hero_config_updated", { detail: res.data }));
            if ("BroadcastChannel" in window) {
              const channel = new BroadcastChannel("drapza_hero_channel");
              channel.postMessage({ type: "HERO_CONFIG_UPDATED", payload: res.data });
              channel.close();
            }
          } catch (_) { }
        }
        setHeroSaveStatus("✓ Hero section reset to default factory parameters.");
        setTimeout(() => setHeroSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setHeroSaveStatus(`✕ Failed to reset hero configuration: ${err.message}`);
    } finally {
      setIsResettingHero(false);
    }
  };

  const handleHeroImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHeroImage(true);
    setHeroSaveStatus("Uploading image to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await heroApi.uploadHeroImage(base64);
        if (res && res.success && res.url) {
          setHeroConfig((prev) => ({ ...prev, modelImage: res.url }));
          setHeroSaveStatus("✓ Image uploaded to Cloudinary successfully! Click 'Publish' to sync live.");
          setTimeout(() => setHeroSaveStatus(null), 6000);
        } else {
          setHeroSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingHeroImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setHeroSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingHeroImage(false);
    }
  };

  // Philosophy / Statement Section CMS Actions
  const handleSaveStatementConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingStatement(true);
    setStatementSaveStatus(null);
    try {
      const res = await statementApi.updateStatementConfig(statementConfig);
      if (res && res.success) {
        try {
          localStorage.setItem("drapza_statement_config", JSON.stringify(statementConfig));
          window.dispatchEvent(new CustomEvent("drapza_statement_config_updated", { detail: statementConfig }));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const ch = new BroadcastChannel("drapza_hero_channel");
            ch.postMessage({ type: "STATEMENT_CONFIG_UPDATED", payload: statementConfig });
            ch.close();
          }
        } catch (_) { }
        setStatementSaveStatus("✓ Philosophy Manifesto statement published and synchronized live!");
        setTimeout(() => setStatementSaveStatus(null), 5000);
      } else {
        setStatementSaveStatus(`✕ ${res?.message || "Failed to publish Statement configuration"}`);
      }
    } catch (err: any) {
      setStatementSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingStatement(false);
    }
  };

  const handleResetStatementConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Philosophy Manifesto statement and badges back to factory defaults?")) return;
    setIsResettingStatement(true);
    setStatementSaveStatus(null);
    try {
      const res = await statementApi.resetStatementConfig();
      if (res && res.success && res.data) {
        setStatementConfig(res.data);
        try {
          localStorage.setItem("drapza_statement_config", JSON.stringify(res.data));
          window.dispatchEvent(new CustomEvent("drapza_statement_config_updated", { detail: res.data }));
        } catch (_) { }
        setStatementSaveStatus("✓ Philosophy statement reset to factory default parameters.");
        setTimeout(() => setStatementSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setStatementSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingStatement(false);
    }
  };

  const handleStatementSymbolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStatementSymbol(true);
    setStatementSaveStatus("Uploading custom emblem image to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await statementApi.uploadStatementSymbol(base64);
        if (res && res.success && res.url) {
          setStatementConfig((prev) => ({
            ...prev,
            customSymbolImage: res.url,
            symbolType: "custom_image",
          }));
          setStatementSaveStatus("✓ Custom emblem uploaded to Cloudinary! Click 'Publish' to sync live.");
          setTimeout(() => setStatementSaveStatus(null), 6000);
        } else {
          setStatementSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingStatementSymbol(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStatementSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingStatementSymbol(false);
    }
  };

  // Marquee Banner & Hero Card CMS Actions
  const handleSaveMarqueeConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingMarquee(true);
    setMarqueeSaveStatus(null);
    try {
      const res = await marqueeApi.updateMarqueeConfig(marqueeConfig);
      if (res && res.success) {
        try {
          localStorage.setItem("drapza_marquee_config", JSON.stringify(marqueeConfig));
          window.dispatchEvent(new CustomEvent("drapza_marquee_config_updated", { detail: marqueeConfig }));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const ch = new BroadcastChannel("drapza_hero_channel");
            ch.postMessage({ type: "MARQUEE_CONFIG_UPDATED", payload: marqueeConfig });
            ch.close();
          }
        } catch (_) { }
        setMarqueeSaveStatus("✓ Marquee Banner & Hero Card configuration published and synchronized live!");
        setTimeout(() => setMarqueeSaveStatus(null), 5000);
      } else {
        setMarqueeSaveStatus(`✕ ${res?.message || "Failed to publish Marquee configuration"}`);
      }
    } catch (err: any) {
      setMarqueeSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingMarquee(false);
    }
  };

  const handleResetMarqueeConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Marquee Banner and Card parameters back to factory defaults?")) return;
    setIsResettingMarquee(true);
    setMarqueeSaveStatus(null);
    try {
      const res = await marqueeApi.resetMarqueeConfig();
      if (res && res.success && res.data) {
        setMarqueeConfig(res.data);
        try {
          localStorage.setItem("drapza_marquee_config", JSON.stringify(res.data));
          window.dispatchEvent(new CustomEvent("drapza_marquee_config_updated", { detail: res.data }));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const ch = new BroadcastChannel("drapza_hero_channel");
            ch.postMessage({ type: "MARQUEE_CONFIG_UPDATED", payload: res.data });
            ch.close();
          }
        } catch (_) { }
        setMarqueeSaveStatus("✓ Marquee Banner configuration reset to factory default parameters.");
        setTimeout(() => setMarqueeSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setMarqueeSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingMarquee(false);
    }
  };

  const handleMarqueeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMarqueeImage(true);
    setMarqueeSaveStatus("Uploading marquee model photo to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await marqueeApi.uploadMarqueeImage(base64);
        if (res && res.success && res.url) {
          setMarqueeConfig((prev) => ({
            ...prev,
            cardImage: res.url,
          }));
          setMarqueeSaveStatus("✓ Model photo uploaded to Cloudinary! Click 'Publish' to sync live.");
          setTimeout(() => setMarqueeSaveStatus(null), 6000);
        } else {
          setMarqueeSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingMarqueeImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMarqueeSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingMarqueeImage(false);
    }
  };

  // Peel Reveal & Motion Mask CMS Actions
  const handleSavePeelRevealConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPeelReveal(true);
    setPeelRevealSaveStatus(null);
    try {
      const res = await peelRevealApi.updatePeelRevealConfig(peelRevealConfig);
      if (res && res.success) {
        try {
          localStorage.setItem("drapza_peel_reveal_config", JSON.stringify(peelRevealConfig));
          window.dispatchEvent(new CustomEvent("drapza_peel_reveal_config_updated", { detail: peelRevealConfig }));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const ch = new BroadcastChannel("drapza_hero_channel");
            ch.postMessage({ type: "PEEL_REVEAL_CONFIG_UPDATED", payload: peelRevealConfig });
            ch.close();
          }
        } catch (_) { }
        setPeelRevealSaveStatus("✓ Peel Reveal configuration published and synchronized live!");
        setTimeout(() => setPeelRevealSaveStatus(null), 5000);
      } else {
        setPeelRevealSaveStatus(`✕ ${res?.message || "Failed to publish Peel Reveal configuration"}`);
      }
    } catch (err: any) {
      setPeelRevealSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingPeelReveal(false);
    }
  };

  const handleResetPeelRevealConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Peel Reveal section parameters back to factory defaults?")) return;
    setIsResettingPeelReveal(true);
    setPeelRevealSaveStatus(null);
    try {
      const res = await peelRevealApi.resetPeelRevealConfig();
      if (res && res.success && res.data) {
        setPeelRevealConfig(res.data);
        try {
          localStorage.setItem("drapza_peel_reveal_config", JSON.stringify(res.data));
          window.dispatchEvent(new CustomEvent("drapza_peel_reveal_config_updated", { detail: res.data }));
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const ch = new BroadcastChannel("drapza_hero_channel");
            ch.postMessage({ type: "PEEL_REVEAL_CONFIG_UPDATED", payload: res.data });
            ch.close();
          }
        } catch (_) { }
        setPeelRevealSaveStatus("✓ Peel Reveal configuration reset to factory default parameters.");
        setTimeout(() => setPeelRevealSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setPeelRevealSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingPeelReveal(false);
    }
  };

  const handlePeelImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPeelImage(true);
    setPeelRevealSaveStatus("Uploading Peel Reveal model image to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await peelRevealApi.uploadPeelRevealImage(base64);
        if (res && res.success && res.url) {
          setPeelRevealConfig((prev) => ({
            ...prev,
            modelImage: res.url,
          }));
          setPeelRevealSaveStatus("✓ Model image uploaded to Cloudinary CDN! Click 'Publish' to sync live.");
          setTimeout(() => setPeelRevealSaveStatus(null), 6000);
        } else {
          setPeelRevealSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingPeelImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPeelRevealSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingPeelImage(false);
    }
  };

  const handleToggleSimulationLoop = () => {
    if (isSimulatingScroll) {
      setIsSimulatingScroll(false);
      if (peelSimIntervalRef.current) clearInterval(peelSimIntervalRef.current);
    } else {
      setIsSimulatingScroll(true);
      let p = peelRevealSimProgress;
      let forward = p < 1;
      peelSimIntervalRef.current = setInterval(() => {
        if (forward) {
          p += 0.015;
          if (p >= 1) {
            p = 1;
            forward = false;
          }
        } else {
          p -= 0.015;
          if (p <= 0) {
            p = 0;
            forward = true;
          }
        }
        setPeelRevealSimProgress(parseFloat(p.toFixed(3)));
      }, 35);
    }
  };

  // Flash Sale Countdown Timer CMS Actions
  const handleSaveCountdownConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingCountdown(true);
    setCountdownSaveStatus(null);
    try {
      const res = await countdownApi.updateCountdownConfig(countdownConfig);
      if (res && res.success) {
        setCountdownSaveStatus("✓ Flash Sale countdown timer & vault drop published live!");
        setTimeout(() => setCountdownSaveStatus(null), 5000);
      } else {
        setCountdownSaveStatus(`✕ ${res?.message || "Failed to publish Countdown configuration"}`);
      }
    } catch (err: any) {
      setCountdownSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingCountdown(false);
    }
  };

  const handleResetCountdownConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Flash Sale countdown timer and drop parameters back to factory defaults?")) return;
    setIsResettingCountdown(true);
    setCountdownSaveStatus(null);
    try {
      const res = await countdownApi.resetCountdownConfig();
      if (res && res.success && res.data) {
        const cData = res.data;
        const formattedDate = cData.targetEndDate
          ? new Date(cData.targetEndDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16);
        setCountdownConfig({
          ...cData,
          targetEndDate: formattedDate,
        });
        setCountdownSaveStatus("✓ Flash Sale timer reset to factory default parameters.");
        setTimeout(() => setCountdownSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setCountdownSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingCountdown(false);
    }
  };

  const handleSetQuickDuration = (hours: number) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    setCountdownConfig((prev) => ({
      ...prev,
      targetEndDate: target.toISOString().slice(0, 16),
    }));
    setCountdownSaveStatus(`✓ Countdown target extended by +${hours >= 24 ? hours / 24 + " Days" : hours + " Hours"}! Click 'Publish' to sync.`);
    setTimeout(() => setCountdownSaveStatus(null), 4000);
  };

  const handleCountdownImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCountdownImage(true);
    setCountdownSaveStatus("Uploading banner model photo to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await countdownApi.uploadCountdownImage(base64);
        if (res && res.success && res.url) {
          setCountdownConfig((prev) => ({ ...prev, modelImage: res.url }));
          setCountdownSaveStatus("✓ Model photo uploaded to Cloudinary CDN!");
          setTimeout(() => setCountdownSaveStatus(null), 4000);
        } else {
          setCountdownSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingCountdownImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setCountdownSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingCountdownImage(false);
    }
  };

  // Field Test in Silhouettes Tri-Card CMS Actions
  const handleSaveCtaConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingCta(true);
    setCtaSaveStatus(null);
    try {
      const res = await ctaApi.updateCtaConfig(ctaConfig);
      if (res && res.success) {
        setCtaSaveStatus("✓ Field Test Silhouettes section published and synchronized live!");
        setTimeout(() => setCtaSaveStatus(null), 5000);
      } else {
        setCtaSaveStatus(`✕ ${res?.message || "Failed to publish Silhouettes configuration"}`);
      }
    } catch (err: any) {
      setCtaSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingCta(false);
    }
  };

  const handleResetCtaConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Field Test in Silhouettes section back to factory defaults?")) return;
    setIsResettingCta(true);
    setCtaSaveStatus(null);
    try {
      const res = await ctaApi.resetCtaConfig();
      if (res && res.success && res.data) {
        setCtaConfig({ ...res.data });
        setCtaSaveStatus("✓ Silhouettes section reset to factory default parameters.");
        setTimeout(() => setCtaSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setCtaSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingCta(false);
    }
  };

  const handleCtaImageUpload = async (slot: "left" | "center" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCtaSlot(slot);
    setCtaSaveStatus(`Uploading ${slot} silhouette photo to Cloudinary CDN...`);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await ctaApi.uploadCtaImage(base64);
        if (res && res.success && res.url) {
          const fieldKey = slot === "left" ? "leftImage" : slot === "center" ? "centerImage" : "rightImage";
          setCtaConfig((prev) => ({ ...prev, [fieldKey]: res.url }));
          setCtaSaveStatus(`✓ ${slot.toUpperCase()} silhouette photo uploaded to Cloudinary CDN!`);
          setTimeout(() => setCtaSaveStatus(null), 4000);
        } else {
          setCtaSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setUploadingCtaSlot(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setCtaSaveStatus(`✕ Upload error: ${err.message}`);
      setUploadingCtaSlot(null);
    }
  };

  // Transmit Signal / Contact Form CMS Actions
  const handleSaveContactConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingContact(true);
    setContactSaveStatus(null);
    try {
      const res = await contactConfigApi.updateContactConfig(contactConfig);
      if (res && res.success) {
        setContactSaveStatus("✓ Transmit Signal & Contact section published and synchronized live!");
        setTimeout(() => setContactSaveStatus(null), 5000);
      } else {
        setContactSaveStatus(`✕ ${res?.message || "Failed to publish contact form configuration"}`);
      }
    } catch (err: any) {
      setContactSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleResetContactConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Transmit Signal section back to factory defaults?")) return;
    setIsResettingContact(true);
    setContactSaveStatus(null);
    try {
      const res = await contactConfigApi.resetContactConfig();
      if (res && res.success && res.data) {
        setContactConfig({ ...res.data });
        setContactSaveStatus("✓ Transmit Signal section reset to factory default parameters.");
        setTimeout(() => setContactSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setContactSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingContact(false);
    }
  };

  const handleContactImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContactImage(true);
    setContactSaveStatus("Uploading models photoshoot to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await contactConfigApi.uploadContactImage(base64);
        if (res && res.success && res.url) {
          setContactConfig((prev) => ({ ...prev, modelImage: res.url }));
          setContactSaveStatus("✓ Models photo uploaded to Cloudinary CDN!");
          setTimeout(() => setContactSaveStatus(null), 4000);
        } else {
          setContactSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setUploadingContactImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setContactSaveStatus(`✕ Upload error: ${err.message}`);
      setUploadingContactImage(false);
    }
  };

  // Bundle Stacker / Modular Outfit CMS Actions
  const handleSaveBundleConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBundle(true);
    setBundleSaveStatus(null);
    try {
      const res = await bundleApi.updateBundleConfig(bundleConfig);
      if (res && res.success) {
        setBundleSaveStatus("✓ Modular Outfit Bundle published and synchronized live!");
        setTimeout(() => setBundleSaveStatus(null), 5000);
      } else {
        setBundleSaveStatus(`✕ ${res?.message || "Failed to publish Bundle configuration"}`);
      }
    } catch (err: any) {
      setBundleSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingBundle(false);
    }
  };

  const handleResetBundleConfig = async () => {
    if (!window.confirm("Are you sure you want to reset all Modular Outfit Layers and Bundle settings back to factory defaults?")) return;
    setIsResettingBundle(true);
    setBundleSaveStatus(null);
    try {
      const res = await bundleApi.resetBundleConfig();
      if (res && res.success && res.data) {
        setBundleConfig(res.data);
        setBundleSaveStatus("✓ Bundle stacker reset to factory default parameters.");
        setTimeout(() => setBundleSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setBundleSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingBundle(false);
    }
  };

  const handleBundleImageUpload = async (layerIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBundleImage(layerIdx);
    setBundleSaveStatus(`Uploading Layer #${layerIdx + 1} garment image to Cloudinary CDN...`);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await bundleApi.uploadBundleImage(base64);
        if (res && res.success && res.url) {
          setBundleConfig((prev) => {
            const newItems = [...prev.items];
            newItems[layerIdx] = { ...newItems[layerIdx], image: res.url };
            return { ...prev, items: newItems };
          });
          setBundleSaveStatus(`✓ Layer #${layerIdx + 1} image uploaded to Cloudinary! Click 'Publish' to sync live.`);
          setTimeout(() => setBundleSaveStatus(null), 6000);
        } else {
          setBundleSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingBundleImage(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setBundleSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingBundleImage(null);
    }
  };

  const handleAddBundleLayer = () => {
    const nextNum = bundleConfig.items.length + 1;
    const newLayer = {
      id: `layer_${Date.now()}`,
      name: "NEW MODULAR PIECE ARCHETYPE",
      price: 990,
      formattedPrice: "₹990",
      image: "/images/drapza/products/product_1.png",
      layerNumber: `LAYER 0${nextNum}`,
      layerType: "ACCESSORY / LAYER",
      subtitle: "CUSTOM ARCHITECTURAL ACCENT",
      tags: ["CUSTOM LAYER", "TAILORED", "MODULAR"],
      slug: "new-modular-piece",
    };
    setBundleConfig((prev) => ({
      ...prev,
      items: [...prev.items, newLayer],
    }));
    setSelectedBundleLayerIdx(bundleConfig.items.length);
  };

  const handleDeleteBundleLayer = (idx: number) => {
    if (bundleConfig.items.length <= 1) {
      alert("At least one layer is required for the bundle.");
      return;
    }
    if (!window.confirm(`Delete Layer #${idx + 1} (${bundleConfig.items[idx]?.name})?`)) return;
    setBundleConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    if (selectedBundleLayerIdx >= idx && selectedBundleLayerIdx > 0) {
      setSelectedBundleLayerIdx((prev) => prev - 1);
    }
  };

  const handleMoveBundleLayer = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= bundleConfig.items.length) return;
    setBundleConfig((prev) => {
      const items = [...prev.items];
      const temp = items[idx];
      items[idx] = items[targetIdx];
      items[targetIdx] = temp;
      return { ...prev, items };
    });
    setSelectedBundleLayerIdx(targetIdx);
  };

  const handleAutoFillBundleFromProduct = (layerIdx: number, productId: string) => {
    const p = products.find((prod) => prod._id === productId);
    if (!p) return;
    setBundleConfig((prev) => {
      const newItems = [...prev.items];
      const categoryUpper = (p.category || "GARMENT").toUpperCase();
      const numPrice = Number(p.numericPrice || String(p.price ?? "").replace(/[^0-9]/g, "") || 0);
      newItems[layerIdx] = {
        ...newItems[layerIdx],
        name: p.name.toUpperCase(),
        price: numPrice,
        formattedPrice: `₹${numPrice.toLocaleString("en-IN")}`,
        image: p.images?.[0] || newItems[layerIdx].image,
        layerType: categoryUpper,
        subtitle: `${categoryUpper} • ARCHETYPE`,
        slug: p.slug || p._id,
        tags: [p.category?.toUpperCase() || "PREMIUM", "100% ORGANIC", "ARCHITECTURAL"],
      };
      return { ...prev, items: newItems };
    });
  };

  const handleApplyPresetBundle = (preset: { name: string; items: any[] }) => {
    setBundleConfig((prev) => ({
      ...prev,
      items: preset.items,
    }));
    setSelectedBundleLayerIdx(0);
    setBundleSaveStatus(`✓ Preset bundle "${preset.name}" loaded! Click 'Publish' to save.`);
    setTimeout(() => setBundleSaveStatus(null), 5000);
  };

  // Editorial Text Block / Brand Narrative CMS Actions
  const handleSaveTextBlockConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingTextBlock(true);
    setTextBlockSaveStatus(null);
    try {
      const res = await textBlockApi.updateTextBlockConfig(textBlockConfig);
      if (res && res.success) {
        setTextBlockSaveStatus("✓ Editorial narrative statement published and synchronized live!");
        setTimeout(() => setTextBlockSaveStatus(null), 5000);
      } else {
        setTextBlockSaveStatus(`✕ ${res?.message || "Failed to publish Text Block configuration"}`);
      }
    } catch (err: any) {
      setTextBlockSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingTextBlock(false);
    }
  };

  const handleResetTextBlockConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the Editorial narrative headlines and paragraphs back to factory defaults?")) return;
    setIsResettingTextBlock(true);
    setTextBlockSaveStatus(null);
    try {
      const res = await textBlockApi.resetTextBlockConfig();
      if (res && res.success && res.data) {
        setTextBlockConfig(res.data);
        setTextBlockSaveStatus("✓ Editorial text block reset to factory default parameters.");
        setTimeout(() => setTextBlockSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setTextBlockSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingTextBlock(false);
    }
  };

  const handleTextBlockSymbolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTextBlockSymbol(true);
    setTextBlockSaveStatus("Uploading custom emblem symbol to Cloudinary CDN...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await textBlockApi.uploadTextBlockSymbol(base64);
        if (res && res.success && res.url) {
          setTextBlockConfig((prev) => ({
            ...prev,
            customSymbolImage: res.url,
            symbolType: "custom_image",
          }));
          setTextBlockSaveStatus("✓ Custom emblem uploaded to Cloudinary! Click 'Publish' to sync live.");
          setTimeout(() => setTextBlockSaveStatus(null), 6000);
        } else {
          setTextBlockSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingTextBlockSymbol(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setTextBlockSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingTextBlockSymbol(false);
    }
  };

  // Lookbook / Campaign Silhouettes CMS Actions
  const handleSaveLookbookConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLookbook(true);
    setLookbookSaveStatus(null);
    try {
      const res = await lookbookApi.updateLookbookConfig(lookbookConfig);
      if (res && res.success) {
        setLookbookSaveStatus("✓ Lookbook & Campaign Silhouettes published and synchronized live!");
        setTimeout(() => setLookbookSaveStatus(null), 5000);
      } else {
        setLookbookSaveStatus(`✕ ${res?.message || "Failed to publish Lookbook configuration"}`);
      }
    } catch (err: any) {
      setLookbookSaveStatus(`✕ Network error: ${err.message}`);
    } finally {
      setIsSavingLookbook(false);
    }
  };

  const handleResetLookbookConfig = async () => {
    if (!window.confirm("Are you sure you want to reset all Campaign Silhouettes and Lookbook cards back to factory defaults?")) return;
    setIsResettingLookbook(true);
    setLookbookSaveStatus(null);
    try {
      const res = await lookbookApi.resetLookbookConfig();
      if (res && res.success && res.data) {
        setLookbookConfig(res.data);
        setLookbookSaveStatus("✓ Lookbook section reset to default parameters.");
        setTimeout(() => setLookbookSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setLookbookSaveStatus(`✕ Failed to reset: ${err.message}`);
    } finally {
      setIsResettingLookbook(false);
    }
  };

  const handleLookbookCardImageUpload = async (cardIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLookbookImage(cardIdx);
    setLookbookSaveStatus(`Uploading Silhouette #${cardIdx + 1} image to Cloudinary CDN...`);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await lookbookApi.uploadLookbookImage(base64);
        if (res && res.success && res.url) {
          setLookbookConfig((prev) => {
            const newItems = [...prev.items];
            newItems[cardIdx] = { ...newItems[cardIdx], image: res.url };
            return { ...prev, items: newItems };
          });
          setLookbookSaveStatus(`✓ Silhouette #${cardIdx + 1} image uploaded to Cloudinary! Click 'Publish' to sync live.`);
          setTimeout(() => setLookbookSaveStatus(null), 6000);
        } else {
          setLookbookSaveStatus(`✕ Cloudinary upload failed: ${res?.message || "Unknown error"}`);
        }
        setIsUploadingLookbookImage(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setLookbookSaveStatus(`✕ Upload error: ${err.message}`);
      setIsUploadingLookbookImage(null);
    }
  };

  const handleAddLookbookCard = () => {
    const nextNum = lookbookConfig.items.length + 1;
    const idStr = String(nextNum).padStart(2, "0");
    const newCard = {
      id: idStr,
      title: `NEW SILHOUETTE ARCHETYPE ${idStr}`,
      subtitle: `SILHOUETTE ${idStr} • EDITORIAL`,
      image: "/images/drapza/products/product_1.png",
      tag: `CAMPAIGN LOOK #${nextNum}`,
      fabric: "High-density tailored structural textile",
      slug: "new-garment-silhouette",
      edition: "EDITION 01 / 2026",
      statusTag: "IN ARCHIVE",
      isActive: true,
    };
    setLookbookConfig((prev) => ({
      ...prev,
      items: [...prev.items, newCard],
    }));
    setSelectedLookbookCardIdx(lookbookConfig.items.length);
  };

  const handleDeleteLookbookCard = (idx: number) => {
    if (lookbookConfig.items.length <= 1) {
      alert("At least one silhouette card is required.");
      return;
    }
    if (!window.confirm(`Delete Lookbook Card #${idx + 1} (${lookbookConfig.items[idx]?.title || "Untitled"})?`)) return;
    setLookbookConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    if (selectedLookbookCardIdx >= idx && selectedLookbookCardIdx > 0) {
      setSelectedLookbookCardIdx((prev) => prev - 1);
    }
  };

  const handleMoveLookbookCard = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lookbookConfig.items.length) return;
    setLookbookConfig((prev) => {
      const items = [...prev.items];
      const temp = items[idx];
      items[idx] = items[targetIdx];
      items[targetIdx] = temp;
      return { ...prev, items };
    });
    setSelectedLookbookCardIdx(targetIdx);
  };

  const handleAutoFillFromProduct = (cardIdx: number, productId: string) => {
    const p = products.find((prod) => prod._id === productId);
    if (!p) return;
    setLookbookConfig((prev) => {
      const newItems = [...prev.items];
      const categoryUpper = (p.category || "GARMENT").toUpperCase();
      const lookNum = cardIdx + 1;
      newItems[cardIdx] = {
        ...newItems[cardIdx],
        title: p.name.toUpperCase(),
        subtitle: `SILHOUETTE 0${lookNum} • ${categoryUpper}`,
        image: p.images?.[0] || newItems[cardIdx].image,
        fabric: p.fabric || p.weight || p.blend || "100% High-Density Architectural Textile",
        slug: p.slug || p._id,
        tag: `CAMPAIGN LOOK #${lookNum}`,
      };
      return { ...prev, items: newItems };
    });
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === "ALL" || o.orderStatus === orderStatusFilter;
    const matchesPayment =
      orderPaymentFilter === "ALL"
        ? true
        : orderPaymentFilter === "SPLIT"
          ? (Number(o.giftCardDiscount || 0) > 0 || Number(o.walletDiscount || 0) > 0) && Number(o.totalPrice || 0) > 0
          : orderPaymentFilter === "GIFT_CARD"
            ? o.paymentMethod === "GIFT_CARD" || Number(o.giftCardDiscount || 0) > 0
            : orderPaymentFilter === "WALLET"
              ? o.paymentMethod === "WALLET" || Number(o.walletDiscount || 0) > 0
              : orderPaymentFilter === "ONLINE"
                ? o.paymentMethod === "ONLINE" || o.paymentMethod === "RAZORPAY"
                : o.paymentMethod === orderPaymentFilter;
    const matchesSearch =
      !orderSearch ||
      o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.trackingNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.giftCardCode?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.cashfreeOrderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.phone?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  // User Management Handlers
  const handleToggleBlockUser = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const res = await adminApi.toggleBlockUser(userId);
      if (res.success) {
        setUserActionStatus(`✓ ${res.message}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u))
        );
        setTimeout(() => setUserActionStatus(null), 4000);
      } else {
        setUserActionStatus(`✕ ${res.message || "Failed to toggle block status"}`);
      }
    } catch (err: any) {
      setUserActionStatus(`✕ Error: ${err.message}`);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleToggleDisableUser = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const res = await adminApi.toggleDisableUser(userId);
      if (res.success) {
        setUserActionStatus(`✓ ${res.message}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isDisabled: !u.isDisabled } : u))
        );
        setTimeout(() => setUserActionStatus(null), 4000);
      } else {
        setUserActionStatus(`✕ ${res.message || "Failed to toggle active status"}`);
      }
    } catch (err: any) {
      setUserActionStatus(`✕ Error: ${err.message}`);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleToggleVerifyUser = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const res = await adminApi.toggleVerifyUser(userId);
      if (res.success) {
        setUserActionStatus(`✓ ${res.message}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isVerified: !u.isVerified } : u))
        );
        setTimeout(() => setUserActionStatus(null), 4000);
      } else {
        setUserActionStatus(`✕ ${res.message || "Failed to toggle verify status"}`);
      }
    } catch (err: any) {
      setUserActionStatus(`✕ Error: ${err.message}`);
    } finally {
      setProcessingUserId(null);
    }
  };

  // Open Custom Modal Triggers (Replaces browser window.confirm)
  const openTerminateModal = (user: any) => {
    audioSystem.playClick(600, 0.04);
    setUserConfirmModal({
      isOpen: true,
      type: "terminate",
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      currentRole: user.role,
    });
  };

  const openRoleModal = (user: any, targetRole?: "user" | "admin") => {
    audioSystem.playClick(600, 0.04);
    const nextRole = targetRole || (user.role === "admin" ? "user" : "admin");
    setUserConfirmModal({
      isOpen: true,
      type: "role",
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      currentRole: user.role,
      targetRole: nextRole,
    });
  };

  const openDeleteModal = (user: any) => {
    audioSystem.playClick(600, 0.04);
    setUserConfirmModal({
      isOpen: true,
      type: "delete",
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      currentRole: user.role,
    });
  };

  // Keyboard accessibility for User Confirmation Modal (Escape to cancel)
  useEffect(() => {
    if (!userConfirmModal.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        audioSystem.playClick(350, 0.05);
        setUserConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userConfirmModal.isOpen]);

  // Execution from Modal
  const handleExecuteUserConfirmModal = async () => {
    const { type, userId, userName, currentRole, targetRole } = userConfirmModal;
    if (!userId) return;

    setProcessingUserId(userId);
    setUserConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (type === "terminate") {
      try {
        const res = await adminApi.terminateSession(userId);
        if (res.success) {
          setUserActionStatus(`✓ Active session for "${userName}" terminated across all devices.`);
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId
                ? {
                  ...u,
                  tokenVersion: (u.tokenVersion || 0) + 1,
                  lastSessionTerminatedAt: new Date().toISOString(),
                }
                : u
            )
          );
          setTimeout(() => setUserActionStatus(null), 5000);
        } else {
          setUserActionStatus(`✕ ${res.message || "Failed to terminate session"}`);
        }
      } catch (err: any) {
        setUserActionStatus(`✕ Error: ${err.message}`);
      } finally {
        setProcessingUserId(null);
      }
    } else if (type === "role") {
      const newRole = targetRole || (currentRole === "admin" ? "user" : "admin");
      try {
        const res = await adminApi.updateUserRole(userId, newRole);
        if (res.success) {
          setUserActionStatus(
            `✓ Role for "${userName}" updated to ${newRole.toUpperCase()}. Active session refreshed.`
          );
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId
                ? {
                  ...u,
                  role: newRole,
                  tokenVersion: (u.tokenVersion || 0) + 1,
                  lastSessionTerminatedAt: new Date().toISOString(),
                }
                : u
            )
          );
          setTimeout(() => setUserActionStatus(null), 5000);
        } else {
          setUserActionStatus(`✕ ${res.message || "Failed to update user role"}`);
        }
      } catch (err: any) {
        setUserActionStatus(`✕ Error: ${err.message}`);
      } finally {
        setProcessingUserId(null);
      }
    } else if (type === "delete") {
      try {
        const res = await adminApi.deleteUser(userId);
        if (res && res.success) {
          setUserActionStatus(
            `✓ ${res.message || `User "${userName}" permanently purged from database.`}`
          );
          setUsers((prev) => prev.filter((u) => u._id !== userId));
          setStats((prev: any) =>
            prev ? { ...prev, totalUsers: Math.max(0, (prev.totalUsers || 1) - 1) } : prev
          );
          setTimeout(() => setUserActionStatus(null), 4000);
        } else {
          setUserActionStatus(`✕ ${res?.message || "Failed to delete user"}`);
        }
      } catch (err: any) {
        setUserActionStatus(`✕ Error: ${err.message}`);
      } finally {
        setProcessingUserId(null);
      }
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.toLowerCase().includes(userSearch.toLowerCase());

    const matchesStatus =
      userStatusFilter === "ALL" ||
      (userStatusFilter === "ADMIN" && u.role === "admin") ||
      (userStatusFilter === "USER" && u.role !== "admin") ||
      (userStatusFilter === "BLOCKED" && u.isBlocked) ||
      (userStatusFilter === "UNBLOCKED" && !u.isBlocked) ||
      (userStatusFilter === "DISABLED" && u.isDisabled) ||
      (userStatusFilter === "ACTIVE" && !u.isDisabled && !u.isBlocked) ||
      (userStatusFilter === "VERIFIED" && u.isVerified) ||
      (userStatusFilter === "UNVERIFIED" && !u.isVerified);

    return matchesSearch && matchesStatus;
  });

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Live Visitor Radar Polling & Telemetry Handlers
  const [isLiveRadarActive, setIsLiveRadarActive] = useState(false);

  const fetchVisitorTelemetry = async (playAudio = false) => {
    try {
      const res = await telemetryApi.getAllLocations();
      if (res?.success) {
        setVisitorLocations(res.locations || []);
        if (res.stats) {
          setVisitorStats(res.stats);
        }
        if (playAudio) {
          audioSystem.playClick(850);
        }
      }
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    }
  };

  useEffect(() => {
    if (!isLiveRadarActive || activeTab !== "radar") return;
    const interval = setInterval(() => {
      fetchVisitorTelemetry(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [isLiveRadarActive, activeTab]);

  const handleCopyIp = (ip: string) => {
    if (!ip) return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    audioSystem.playClick(900, 0.04);
    setTimeout(() => setCopiedIp(null), 2500);
  };

  // Clear visitor telemetry
  const handleClearVisitorTelemetry = async () => {
    if (!window.confirm("Are you sure you want to purge all visitor telemetry logs?")) return;
    setIsClearingTelemetry(true);
    try {
      const res = await telemetryApi.clearLocations();
      if (res.success) {
        setVisitorLocations([]);
        setVisitorStats({ total: 0, guests: 0, registered: 0, gpsVerified: 0 });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsClearingTelemetry(false);
    }
  };

  // Filtered Visitor Locations
  const filteredVisitorLocations = visitorLocations.filter((v) => {
    const q = visitorSearch.toLowerCase();
    const matchesSearch =
      !visitorSearch ||
      v.ip?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.state?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.userName?.toLowerCase().includes(q) ||
      v.userEmail?.toLowerCase().includes(q) ||
      v.postalCode?.toLowerCase().includes(q);

    const matchesFilter =
      visitorFilter === "ALL" ||
      (visitorFilter === "GUEST" && v.userType === "guest") ||
      (visitorFilter === "REGISTERED" && v.userType === "registered") ||
      (visitorFilter === "GPS" && v.precisionType === "GPS_HIGH_ACCURACY") ||
      (visitorFilter === "IP" && v.precisionType !== "GPS_HIGH_ACCURACY");

    return matchesSearch && matchesFilter;
  });

  // Filtered Coupons
  const filteredCoupons = coupons.filter((c) => {
    const q = couponSearch.toLowerCase();
    const matchesSearch =
      !couponSearch ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);

    const matchesFilter =
      couponFilter === "ALL" ||
      (couponFilter === "ACTIVE" && c.isActive) ||
      (couponFilter === "INACTIVE" && !c.isActive) ||
      (couponFilter === "PERCENTAGE" && c.discountType === "percentage") ||
      (couponFilter === "FIXED" && (c.discountType === "fixed" || c.discountType === "flat"));

    return matchesSearch && matchesFilter;
  });

  interface NavItemDef {
    id: string;
    label: string;
    subtitle: string;
    icon: any;
    badge: any;
    isLive?: boolean;
  }

  interface NavCategoryDef {
    id: string;
    label: string;
    items: NavItemDef[];
  }

  // Collapsible category state in admin sidebar
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Atelier Command Palette modal state (Ctrl + K / Cmd + K)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const navCategories: NavCategoryDef[] = [
    {
      id: "analytics",
      label: "ANALYTICS & RADAR",
      items: [
        { id: "overview", label: "OVERVIEW", subtitle: "Core Telemetry & Sales", icon: LayoutDashboard, badge: null },
        { id: "reports", label: "SALES & AUDIT REPORTS", subtitle: "Sells, Returns, Cancellations & PDF/Excel", icon: TrendingUp, badge: "POWER", isLive: true },
        { id: "radar", label: "VISITOR RADAR", subtitle: "Live IP & GPS Tracking", icon: Navigation, badge: visitorLocations.length, isLive: true },
        { id: "search-radar", label: "SEARCH DEMAND RADAR", subtitle: "Keywords & Zero-Result Telemetry", icon: Radar, badge: "DEMAND", isLive: true },
        { id: "abandoned-bags", label: "ABANDONED BAGS RADAR", subtitle: "Drop-offs & Recovery Offers", icon: ShoppingBag, badge: "AI" },
      ],
    },
    {
      id: "commerce",
      label: "STORE OPERATIONS",
      items: [
        { id: "orders", label: "ORDER VAULT", subtitle: "Fulfillment & Dispatch", icon: ShoppingBag, badge: orders.length },
        { id: "appointments", label: "CUSTOM SIZE FITTINGS", subtitle: "Bespoke Size & Tailor Consultations", icon: Scissors, badge: "BESPOKE", isLive: true },
        { id: "returns-vault", label: "RETURNS & EXCHANGES", subtitle: "Reverse Logistics & Refunds", icon: RotateCcw, badge: "NEW" },
        { id: "products", label: "GARMENTS CATALOG", subtitle: "Inventory Management", icon: Package, badge: products.length },
        { id: "shipping-rules", label: "SHIPPING & COD CMS", subtitle: "Thresholds, Courier & Pincodes", icon: Truck, badge: "ACTIVE" },
        { id: "support-tickets", label: "CONCIERGE & SUPPORT", subtitle: "Client Tickets & Inquiries", icon: LifeBuoy, badge: "LIVE", isLive: true },
        { id: "filters", label: "WARDROBE FILTERS", subtitle: "Categories, Sizes & Options CMS", icon: Sliders, badge: `${filterConfig.categories.length + filterConfig.sizes.length + filterConfig.colors.length + filterConfig.fabrics.length + filterConfig.occasions.length + filterConfig.availability.length}` },
        { id: "reviews", label: "REVIEWS & RATINGS", subtitle: "Client Feedback & Moderation", icon: Star, badge: "NEW" },
      ],
    },
    {
      id: "storefront",
      label: "STOREFRONT CMS",
      items: [
        { id: "hero", label: "HERO SECTION CMS", subtitle: "1:1 Visual Canvas Editor", icon: Compass, badge: null },
        { id: "genesis", label: "GENESIS PAGE CMS", subtitle: "Spotlight Matrix, Hero & Manifestos", icon: Sparkles, badge: "PAGE", isLive: true },
        { id: "testimonials-cms", label: "TESTIMONIALS CMS", subtitle: "Editorial Quotes, Diana Tigelle & Stories", icon: MessageSquareQuote, badge: "PAGE", isLive: true },
        { id: "touchpoint-cms", label: "TOUCHPOINT CMS", subtitle: "Outbound Protocols, Comms & Callout Grid", icon: PhoneCall, badge: "PAGE", isLive: true },
        { id: "whatsapp-widget", label: "WHATSAPP BUTTON CMS", subtitle: "Floating Message Us & Concierge", icon: MessageCircle, badge: whatsAppButtonConfig.isEnabled ? "LIVE" : "OFF", isLive: whatsAppButtonConfig.isEnabled },
        { id: "cta", label: "SILHOUETTES CMS", subtitle: "Field Test Tri-Card", icon: Eye, badge: ctaConfig.isEnabled ? "LIVE" : null, isLive: ctaConfig.isEnabled },
        { id: "statement", label: "PHILOSOPHY CMS", subtitle: "Brand Manifesto & Quote", icon: Quote, badge: null },
        { id: "marquee", label: "MARQUEE BANNER CMS", subtitle: "Kinetic Ticker & Hero Card", icon: Radio, badge: marqueeConfig.isEnabled !== false ? "1:1 LIVE" : "OFF", isLive: marqueeConfig.isEnabled !== false },
        { id: "textblock", label: "NARRATIVE CMS", subtitle: "Editorial & Typography", icon: FileText, badge: null },
        { id: "peel-reveal", label: "PEEL REVEAL CMS", subtitle: "Motion Mask & Split Telemetry", icon: Layers, badge: peelRevealConfig.isEnabled !== false ? "1:1 LIVE" : "OFF", isLive: peelRevealConfig.isEnabled !== false },
        { id: "footer", label: "FOOTER & SOCIALS CMS", subtitle: "Social Links, Menu Overlay, Hotline & Dispatch", icon: Compass, badge: footerConfig.isEnabled ? "LIVE" : "OFF", isLive: footerConfig.isEnabled },
      ],
    },
    {
      id: "marketing",
      label: "GROWTH & PROMO",
      items: [
        { id: "membership", label: "MEMBERSHIP & VIP CLUB", subtitle: "Plans, In-Store QR & Special Member Pricing", icon: Award, badge: "VIP", isLive: true },
        { id: "bogo-cms", label: "BOGO & BUNDLE TIERS CMS", subtitle: "Buy 1 Get 2/3 Free Engine", icon: Layers, badge: bogoConfig.isEnabled ? `${bogoConfig.tiers.filter((t) => t.isActive).length} TIERS` : "OFF", isLive: bogoConfig.isEnabled },
        { id: "newsletter-crm", label: "VIP NEWSLETTER CRM", subtitle: "Subscribers, CSV & Broadcasts", icon: Mail, badge: "PRO" },
        { id: "coupons", label: "PROMO & COUPONS", subtitle: "Discounts & Vouchers CMS", icon: Tag, badge: coupons.length },

        { id: "shop-the-look", label: "SHOP THE LOOK / UGC", subtitle: "Shoppable Instagram Feed", icon: Camera, badge: "NEW" },
      ],
    },
    {
      id: "system",
      label: "GOVERNANCE & SYSTEM",
      items: [
        { id: "payments", label: "PAYMENT AUTH CMS", subtitle: "Gateway & COD Controls", icon: CreditCard, badge: [paymentConfig.razorpay.isEnabled && "CARD", paymentConfig.cod.isEnabled && "COD"].filter(Boolean).length },
        { id: "gst", label: "INVOICE & GST CMS", subtitle: "GST %, GSTIN & Tax Settings", icon: FileText, badge: gstConfig.isEnabled ? `${gstConfig.gstPercentage}%` : "OFF" },
        { id: "users", label: "CLIENTELE & ACCESS", subtitle: "User Governance & Security", icon: Users, badge: users.length },
        { id: "security-logs", label: "SECURITY & AUDIT LOGS", subtitle: "IPs, Route Hits, Sessions & Threats", icon: ShieldAlert, badge: "LIVE", isLive: true },
        { id: "diagnostics", label: "MAIL & ENGINE", subtitle: "Failover Dispatch Engine", icon: Mail, badge: null },
      ],
    },
    {
      id: "seo-geo-toolkit",
      label: "SEO & GEO TOOLKIT",
      items: [
        { id: "seo-geo", label: "SEO & GEO TOOLKIT", subtitle: "Audits, GEO, Sitemaps & Schema", icon: Globe, badge: "AI READY", isLive: true },
      ],
    },
  ];

  const navItems = navCategories.flatMap((cat) => cat.items);

  const areAllCollapsed = navCategories.every((cat) => collapsedCategories[cat.id]);

  const toggleAllCategories = () => {
    if (areAllCollapsed) {
      setCollapsedCategories({});
    } else {
      const allCollapsed: Record<string, boolean> = {};
      navCategories.forEach((cat) => {
        allCollapsed[cat.id] = true;
      });
      setCollapsedCategories(allCollapsed);
    }
  };

  const handleScrollPage = (direction: "up" | "down" | "top" | "bottom" = "down") => {
    performPageScroll(direction);
  };

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Smoothly glide back to the top of dashboard workspace whenever activeTab changes
    if (typeof window !== "undefined") {
      const lenis = (window as any).lenis || (window as any).__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { immediate: false, duration: 0.65, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setTimeout(() => {
        if ((window as any).ScrollTrigger) {
          (window as any).ScrollTrigger.refresh();
        }
      }, 60);
    }
  }, [activeTab]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-[#edf1e8] text-[#0f0f0f] font-sans selection:bg-[#0f0f0f] selection:text-[#edf1e8] pt-24 sm:pt-28 pb-20 px-3 sm:px-6 lg:px-8">
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* Mobile Drawer Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          />
        )}

        {/* ================= LEFT SIDEBAR (STICKY ON DESKTOP / DRAWER ON MOBILE) ================= */}
        <aside
          aria-label="Admin Navigation Sidebar"
          data-lenis-prevent="true"
          className={`
            fixed inset-y-0 left-0 z-50 w-[300px] sm:w-80 max-w-[88vw] h-full bg-white border-r border-neutral-200 p-4 sm:p-5 shadow-2xl transition-[width,padding,transform,opacity] duration-300 ease-in-out flex flex-col justify-between overflow-hidden
            lg:relative lg:inset-auto lg:z-20 lg:shrink-0 lg:sticky lg:top-24 lg:border lg:rounded-none lg:translate-x-0 lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)] lg:shadow-sm
            ${sidebarMode === "hidden"
              ? "lg:hidden"
              : sidebarMode === "compact"
                ? "lg:w-[84px] lg:p-3"
                : "lg:w-72 xl:w-80 lg:p-5"
            }
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* ================= DESKTOP COMPACT RAIL (VISIBLE ONLY ON LG WHEN sidebarMode === "compact") ================= */}
          {sidebarMode === "compact" && (
            <div className="hidden lg:flex flex-col h-full min-h-0 justify-between items-center w-full">
              {/* Compact Header: Drapza Icon & Expand Button */}
              <div className="flex flex-col items-center gap-2 pb-3 border-b border-neutral-200 w-full shrink-0">
                <div className="w-8 h-8 rounded-none bg-black text-white flex items-center justify-center font-bold font-mono text-xs shadow-md">
                  D
                </div>
                <button
                  type="button"
                  onClick={() => handleSetSidebarMode("full")}
                  className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-all cursor-pointer"
                  title="Expand to Full Sidebar (300px)"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Icon Nav Items */}
              <nav aria-label="Admin Compact Navigation Rail" data-lenis-prevent="true" className="flex-1 min-h-0 w-full space-y-1.5 overflow-y-auto custom-scrollbar overscroll-contain py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative group flex justify-center">
                      <button
                        type="button"
                        data-ai-id={`sidebar.${item.id}`}
                        data-ai-label={item.label}
                        data-ai-action="navigate"
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-11 h-11 rounded-none flex items-center justify-center transition-all cursor-pointer ${active
                          ? "bg-black text-white font-bold shadow-md scale-105"
                          : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                          }`}
                        aria-label={item.label}
                      >
                        <Icon className="w-4 h-4" />
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-none bg-red-500 animate-pulse" />
                        )}
                      </button>

                      {/* Hover Floating Tooltip */}
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black text-white font-mono text-[10.5px] font-semibold rounded-none shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity uppercase tracking-wider flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="px-1.5 py-0.5 bg-white/20 rounded-none text-[9px]">{item.badge}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* Compact Footer Icons - Always Pinned at Bottom */}
              <div className="pt-3 border-t border-neutral-200 w-full flex flex-col items-center gap-2 shrink-0 mt-auto">
                {/* Sync Vault */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={fetchData}
                    disabled={refreshing}
                    className="w-10 h-10 rounded-none bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 hover:text-black transition-all cursor-pointer"
                    aria-label="Sync Vault"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-black" : ""}`} />
                  </button>
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black text-white font-mono text-[10.5px] font-semibold rounded-none shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity uppercase tracking-wider">
                    Sync Vault
                  </div>
                </div>

                {/* Store */}
                <div className="relative group">
                  <Link
                    href="/"
                    target="_blank"
                    className="w-10 h-10 rounded-none bg-black hover:bg-neutral-800 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                    aria-label="Visit Storefront"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black text-white font-mono text-[10.5px] font-semibold rounded-none shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity uppercase tracking-wider">
                    Store
                  </div>
                </div>

                {/* Logout */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await userApi.logout();
                      } catch (e) { }
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.removeItem("drapza_user");
                          window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
                        } catch (e) { }
                      }
                      router.push("/login");
                    }}
                    className="w-10 h-10 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black transition-all cursor-pointer"
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black text-white font-mono text-[10.5px] font-semibold rounded-none shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity uppercase tracking-wider">
                    Logout
                  </div>
                </div>

                {/* Hide Sidebar */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSetSidebarMode("hidden")}
                    className="w-10 h-10 rounded-none bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black transition-all cursor-pointer"
                    aria-label="Hide Sidebar"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black text-white font-mono text-[10.5px] font-semibold rounded-none shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-opacity uppercase tracking-wider">
                    Hide Sidebar
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= FULL SIDEBAR VIEW (VISIBLE ON MOBILE OR ON LG WHEN sidebarMode !== "compact") ================= */}
          <div className={`${sidebarMode === "compact" ? "lg:hidden" : ""} flex flex-col h-full min-h-0 w-full justify-between`}>
            {/* Brand & System Status */}
            <div className="space-y-3 pb-3 border-b border-neutral-200 shrink-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                      ATELIER V1.0.4
                    </span>
                  </div>
                  <h1 className="text-lg font-bold font-mono tracking-tight text-black uppercase">
                    DRAPZA CONTROL
                  </h1>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Admin Command Suite & Telemetry
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Desktop Collapse Button */}
                  <button
                    type="button"
                    onClick={() => handleSetSidebarMode("compact")}
                    className="hidden lg:flex p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-all cursor-pointer"
                    title="Collapse to Mini Rail"
                    aria-label="Collapse to Mini Rail"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>

                  {/* Close Button on Mobile Drawer */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-all cursor-pointer"
                    title="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Category Collapsible Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-neutral-600">
                  {navCategories.length} MODULE GROUPS
                </span>
                <button
                  type="button"
                  onClick={toggleAllCategories}
                  className="font-mono text-[9px] uppercase font-bold tracking-wider text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-none transition-colors cursor-pointer"
                >
                  {areAllCollapsed ? "EXPAND ALL" : "COLLAPSE ALL"}
                </button>
              </div>
            </div>

            {/* Navigation Items List Grouped by Category */}
            <nav aria-label="Admin Control Modules" data-lenis-prevent="true" className="flex-1 min-h-0 space-y-3 font-mono py-3 pr-1.5 overflow-y-auto custom-scrollbar overscroll-contain">
              {navCategories.map((cat) => {
                const isCollapsed = Boolean(collapsedCategories[cat.id]);
                const hasActiveChild = cat.items.some((item) => item.id === activeTab);

                return (
                  <div key={cat.id} className="space-y-1">
                    {/* Category Header with Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-none text-neutral-700 hover:text-black hover:bg-neutral-100 transition-all cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-none transition-colors ${hasActiveChild ? "bg-black" : "bg-neutral-300 group-hover:bg-neutral-500"
                            }`}
                        />
                        <span
                          className={`text-[10px] uppercase font-bold tracking-widest truncate ${hasActiveChild ? "text-black font-extrabold" : "text-neutral-700 group-hover:text-black"
                            }`}
                        >
                          {cat.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200">
                          {cat.items.length}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-500 group-hover:text-black ${isCollapsed ? "-rotate-90" : "rotate-0"
                            }`}
                        />
                      </div>
                    </button>

                    {/* Collapsible Items Container */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isCollapsed ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100"
                        }`}
                    >
                      <div className="overflow-hidden space-y-1 pl-1 py-1">
                        {cat.items.map((item) => {
                          const Icon = item.icon;
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              data-ai-id={`sidebar.${item.id}`}
                              data-ai-label={item.label}
                              data-ai-action="navigate"
                              data-ai-category={cat.id}
                              onClick={() => {
                                setActiveTab(item.id as any);
                                setSidebarOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-none transition-all cursor-pointer flex items-center justify-between group border-l-2 ${active
                                ? "bg-black text-white font-bold shadow-sm border-white scale-[1.01]"
                                : "bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-100 border-transparent hover:border-neutral-400"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-white" : "text-neutral-500 group-hover:text-black"
                                    }`}
                                />
                                <div className="truncate">
                                  <div className="text-xs tracking-wider uppercase leading-tight">{item.label}</div>
                                  <div
                                    className={`text-[9.5px] truncate leading-tight ${active ? "text-neutral-300 font-normal" : "text-neutral-600 font-medium"
                                      }`}
                                  >
                                    {item.subtitle}
                                  </div>
                                </div>
                              </div>

                              {item.badge !== null && item.badge !== undefined && (
                                <span
                                  className={`px-2 py-0.5 rounded-none text-[9px] font-bold shrink-0 ml-2 ${active
                                    ? "bg-white text-black font-bold"
                                    : item.isLive
                                      ? "bg-black text-white font-bold animate-pulse"
                                      : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                                    }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Quick System Action Footer - Always Pinned at Bottom */}
            <div className="pt-3 border-t border-neutral-200 space-y-2.5 font-mono shrink-0 mt-auto bg-white">
              {/* User Governance Status Badge */}
              <div className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 text-[10px] font-mono flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-bold text-black uppercase truncate">ATELIER OPERATOR</span>
                </div>
                <span className="text-[9px] text-neutral-500 font-bold shrink-0">SUPERADMIN</span>
              </div>

              <button
                onClick={fetchData}
                disabled={refreshing}
                className="w-full py-2 px-3 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-black" : "text-neutral-500"}`}
                />
                <span>{refreshing ? "SYNCING..." : "SYNC VAULT"}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <span>STORE</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>

                <button
                  onClick={async () => {
                    try {
                      await userApi.logout();
                    } catch (e) { }
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.removeItem("drapza_user");
                        window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
                      } catch (e) { }
                    }
                    router.push("/login");
                  }}
                  className="py-2 px-3 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-black font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <LogOut className="w-3 h-3" />
                  <span>LOGOUT</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN CONTENT AREA ================= */}
        <section aria-label="Admin Control Center" className="flex-1 min-w-0 w-full space-y-6">

          {/* ================= REDESIGNED ATELIER EXECUTIVE TOPBAR ================= */}
          <header className="bg-white border border-neutral-200 rounded-none px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            {/* Left: Mobile Trigger + Desktop Mode Switcher + Breadcrumb Trail */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Mobile Hamburger Drawer Trigger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-none bg-neutral-100 hover:bg-neutral-200 text-black transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">MENU</span>
              </button>

              {/* Desktop Sidebar Layout Adjuster */}
              <div className="hidden lg:flex items-center gap-1 bg-neutral-100 p-1 rounded-none border border-neutral-200 text-[10px] font-mono">
                <span className="text-neutral-500 font-bold px-1.5 uppercase flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-neutral-600" />
                  RAIL:
                </span>
                <button
                  type="button"
                  onClick={() => handleSetSidebarMode("full")}
                  className={`px-2 py-0.5 rounded-none font-bold transition-all cursor-pointer ${sidebarMode === "full"
                      ? "bg-black text-white shadow-xs"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                    }`}
                  title="Expand to Full Sidebar (300px)"
                >
                  FULL
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSidebarMode("compact")}
                  className={`px-2 py-0.5 rounded-none font-bold transition-all cursor-pointer ${sidebarMode === "compact"
                      ? "bg-black text-white shadow-xs"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                    }`}
                  title="Compact Icon-Only Rail (84px)"
                >
                  MINI
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSidebarMode("hidden")}
                  className={`px-2 py-0.5 rounded-none font-bold transition-all cursor-pointer ${sidebarMode === "hidden"
                      ? "bg-black text-white shadow-xs"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                    }`}
                  title="Hide Sidebar (Press Ctrl+B to restore)"
                >
                  HIDE
                </button>
              </div>

              {/* Breadcrumbs & Active Title */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono uppercase tracking-widest text-neutral-500">
                  <span className="font-bold text-black">ATELIER</span>
                  <span>/</span>
                  <span className="truncate">
                    {navCategories.find((c) => c.items.some((i) => i.id === activeTab))?.label || "OPERATIONS"}
                  </span>
                  <span>/</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black font-mono text-black uppercase tracking-wider truncate flex items-center gap-2">
                  <span>{navItems.find((t) => t.id === activeTab)?.label || "CONTROL CENTER"}</span>
                  {navItems.find((t) => t.id === activeTab)?.badge !== null && (
                    <span className="px-1.5 py-0.2 rounded-none bg-black text-white text-[9px] font-mono font-bold tracking-tight">
                      {navItems.find((t) => t.id === activeTab)?.badge}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Center: Command Palette Trigger Button (Ctrl + K) */}
            <div className="flex-1 max-w-md mx-auto w-full md:w-auto">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 text-neutral-600 hover:text-black font-mono text-xs transition-all cursor-pointer group shadow-2xs"
                title="Search any of the 33 admin modules, orders, garments or execute actions (Ctrl+K)"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black transition-colors shrink-0" />
                  <span className="truncate text-[11px] font-medium tracking-wide">
                    Search 33 modules, telemetry, orders...
                  </span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-neutral-300 font-mono text-[9.5px] font-bold text-neutral-700 shadow-2xs shrink-0">
                  <span>⌘K</span>
                </kbd>
              </button>
            </div>

            {/* Right: Telemetry & Actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 font-mono text-xs shrink-0">
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
                <span className="font-bold">SYSTEM ACTIVE</span>
              </span>

              <Link
                href="/"
                target="_blank"
                className="px-3 py-1.5 rounded-none bg-white hover:bg-neutral-100 border border-neutral-300 text-black font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Open customer-facing storefront in new tab"
              >
                <span>STORE</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-600" />
              </Link>

              <button
                type="button"
                onClick={fetchData}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Sync database vault"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin text-white" : ""}`} />
                <span className="hidden sm:inline">{refreshing ? "SYNCING..." : "SYNC"}</span>
              </button>
            </div>
          </header>

          {/* Responsive Mobile Category Filter Chips */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            <button
              type="button"
              onClick={() => setMobileCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer ${mobileCategoryFilter === "ALL"
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:text-black"
                }`}
            >
              ALL ({navItems.length})
            </button>
            {navCategories.map((cat) => {
              const isActiveCat = mobileCategoryFilter === cat.id;
              const hasActiveChild = cat.items.some((item) => item.id === activeTab);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMobileCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${isActiveCat
                    ? "bg-black text-white"
                    : hasActiveChild
                      ? "bg-neutral-200 text-black border border-neutral-300"
                      : "bg-neutral-100 text-neutral-600 hover:text-black"
                    }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[8.5px] opacity-75">({cat.items.length})</span>
                </button>
              );
            })}
          </div>

          {/* Fast Mobile Swipeable Tab Bar filtered by selected category */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(mobileCategoryFilter === "ALL"
              ? navItems
              : navCategories.find((c) => c.id === mobileCategoryFilter)?.items || navItems
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-3 py-2 rounded-none text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${active
                    ? "bg-black text-white font-bold shadow-md"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:text-black"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-none font-bold ${active ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW TELEMETRY */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    padding: "1.35rem 1.25rem",
                  }}
                  className="space-y-2 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-neutral-500">
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--base-500, #7d807a)",
                      }}
                    >
                      TOTAL REVENUE
                    </span>
                    <span className="font-mono text-base font-bold text-neutral-900 leading-none select-none" aria-hidden="true">₹</span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  >
                    ₹{(stats?.totalRevenue || orders.reduce((acc: number, o: any) => acc + (Number(o.total || o.totalPrice || 0)), 0) || 0).toLocaleString("en-IN")}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.68rem",
                      color: "var(--base-400, #969992)",
                    }}
                  >
                    Across verified boutique acquisitions
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    padding: "1.35rem 1.25rem",
                  }}
                  className="space-y-2 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-neutral-500">
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--base-500, #7d807a)",
                      }}
                    >
                      TOTAL ORDERS
                    </span>
                    <ShoppingBag className="w-4 h-4 text-black" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  >
                    {stats?.totalOrders || orders.length}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.7rem",
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-black font-bold">● {stats?.statusCounts?.delivered || orders.filter((o: any) => String(o.status || o.orderStatus).toUpperCase() === "DELIVERED").length} Delivered</span>
                    <span className="text-neutral-500">● {stats?.statusCounts?.placed || orders.filter((o: any) => String(o.status || o.orderStatus).toUpperCase() !== "DELIVERED" && String(o.status || o.orderStatus).toUpperCase() !== "CANCELLED").length} Active</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    padding: "1.35rem 1.25rem",
                  }}
                  className="space-y-2 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-neutral-500">
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--base-500, #7d807a)",
                      }}
                    >
                      ACTIVE GARMENTS
                    </span>
                    <Package className="w-4 h-4 text-black" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  >
                    {stats?.totalProducts || products.length}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.68rem",
                      color: "var(--base-400, #969992)",
                    }}
                  >
                    Catalog silhouettes in circulation
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    padding: "1.35rem 1.25rem",
                  }}
                  className="space-y-2 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-neutral-500">
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--base-500, #7d807a)",
                      }}
                    >
                      AUTHENTICATED CLIENTS
                    </span>
                    <Users className="w-4 h-4 text-black" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--base-700, #0f0f0f)",
                    }}
                  >
                    {stats?.totalUsers || users.length}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.68rem",
                      color: "var(--base-400, #969992)",
                    }}
                  >
                    Registered wardrobe identities
                  </p>
                </div>
              </div>

              {/* Quick Actions & Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left 2 Cols: Recent Order Feed */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--base-200, #d7dbd2)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    padding: "1.5rem",
                  }}
                  className="lg:col-span-2 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <h5
                      style={{
                        fontFamily: "var(--font-koulen), sans-serif",
                        fontSize: "1.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--base-700, #0f0f0f)",
                        margin: 0,
                      }}
                    >
                      RECENT ATELIER DISPATCH QUEUE
                    </h5>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                      className="text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>VIEW ALL ({orders.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {(orders.slice(0, 6) || []).map((order) => {
                      const displayId = order.orderNumber || order.orderId || (order._id ? `DPZ-${order._id.slice(-6).toUpperCase()}` : "DPZ-ORDER");
                      const displayStatus = String(order.orderStatus || order.status || "CONFIRMED").toUpperCase();
                      const clientName = order.shippingAddress?.fullName || (order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : null) || "Client";
                      const clientCity = order.shippingAddress?.city || order.address?.city || "India";
                      const displayPrice = order.totalPrice || order.total || 0;
                      const displayDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent";

                      return (
                        <div
                          key={order._id || order.orderId}
                          onClick={() => setSelectedOrder(order)}
                          className="py-3.5 flex items-center justify-between hover:bg-[#edf1e8]/50 px-3 -mx-3 rounded-[8px] transition-colors cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  fontFamily: "var(--font-dm-mono), monospace",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  color: "var(--base-700, #0f0f0f)",
                                }}
                              >
                                {displayId}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-dm-mono), monospace",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.04em",
                                  borderRadius: "4px",
                                }}
                                className={`px-2 py-0.5 uppercase ${displayStatus === "DELIVERED"
                                    ? "bg-black text-white"
                                    : displayStatus === "SHIPPED" || displayStatus === "DISPATCHED"
                                      ? "bg-neutral-800 text-white"
                                      : "bg-neutral-100 text-neutral-700 border border-neutral-300"
                                  }`}
                              >
                                {displayStatus}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 font-sans">
                              {clientName} • {clientCity}
                            </p>
                          </div>

                          <div className="text-right">
                            <div
                              style={{
                                fontFamily: "var(--font-dm-mono), monospace",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "var(--base-700, #0f0f0f)",
                              }}
                            >
                              ₹{Number(displayPrice).toLocaleString("en-IN")}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-dm-mono), monospace",
                                fontSize: "0.68rem",
                                color: "var(--base-400, #969992)",
                              }}
                            >
                              {displayDate}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {orders.length === 0 && (
                      <div
                        style={{ fontFamily: "var(--font-dm-mono), monospace" }}
                        className="py-12 text-center text-xs text-neutral-500"
                      >
                        No customer orders recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Quick Management & Low Stock */}
                <div className="space-y-6">
                  {/* Fast Action Box */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--base-200, #d7dbd2)",
                      borderRadius: "12px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      padding: "1.5rem",
                    }}
                    className="space-y-4"
                  >
                    <h5
                      style={{
                        fontFamily: "var(--font-koulen), sans-serif",
                        fontSize: "1.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--base-700, #0f0f0f)",
                        margin: 0,
                      }}
                    >
                      QUICK ACTIONS
                    </h5>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("marquee")}
                        style={{
                          borderRadius: "8px",
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                        className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-black text-white flex items-center justify-between transition-all cursor-pointer shadow-sm group border border-neutral-700 hover:border-emerald-500"
                        title="Direct 1:1 Live Visual Editor for Marquee Banner"
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span>MARQUEE BANNER STUDIO</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 tracking-wider">1:1 LIVE CANVAS →</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("coupons")}
                        style={{
                          borderRadius: "8px",
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                        className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Tag className="w-4 h-4" />
                        <span>PROMO & COUPONS CMS</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCreateProductModal}
                        style={{
                          borderRadius: "8px",
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                        className="w-full py-2.5 px-4 bg-[#edf1e8] hover:bg-[#e2e7dc] text-neutral-800 border border-neutral-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ADD NEW GARMENT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("diagnostics")}
                        style={{
                          borderRadius: "8px",
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                        className="w-full py-2.5 px-4 bg-[#edf1e8] hover:bg-[#e2e7dc] text-neutral-800 border border-neutral-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>DISPATCH TEST EMAIL</span>
                      </button>
                    </div>
                  </div>

                  {/* System Status Pill */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--base-200, #d7dbd2)",
                      borderRadius: "12px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      padding: "1.5rem",
                      fontFamily: "var(--font-dm-mono), monospace",
                    }}
                    className="space-y-3 text-xs"
                  >
                    <h5
                      style={{
                        fontFamily: "var(--font-koulen), sans-serif",
                        fontSize: "1.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--base-700, #0f0f0f)",
                        margin: 0,
                      }}
                    >
                      SYSTEM ENGINES
                    </h5>
                    <div className="space-y-2 text-neutral-600">
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span>MongoDB Database</span>
                        <span className="text-black font-bold">ONLINE ✓</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                        <span>Order Processing Engine</span>
                        <span className="text-black font-bold">ACTIVE ({orders.length} orders) ✓</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Razorpay / COD Gateway</span>
                        <span className="text-black font-bold">ONLINE ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: VISITOR RADAR • GUEST & USER LIVE TELEMETRY */}
          {activeTab === "radar" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Controls Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-none bg-white border border-neutral-200 shadow-sm">
                <div>
                  <h3 className="text-base font-bold font-mono uppercase text-black tracking-wider flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-black animate-pulse" />
                    <span>VISITOR RADAR & IP GEOLOCATION (GUEST + REGISTERED)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-1">
                    Real-time intelligence feed capturing all anonymous guest visitors, registered client accounts, hardware GPS fixes (100% precision), and IP telemetry.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      audioSystem.playClick(isLiveRadarActive ? 400 : 700);
                      setIsLiveRadarActive((prev) => !prev);
                    }}
                    className={`px-3.5 py-2 rounded-none border text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${isLiveRadarActive
                        ? "bg-black text-white border-black font-bold shadow-xs"
                        : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-800"
                      }`}
                    title={isLiveRadarActive ? "Auto-refreshing live telemetry every 10s" : "Click to enable live 10s auto-pulse"}
                  >
                    <span
                      className={`w-2 h-2 rounded-none ${isLiveRadarActive ? "bg-emerald-400 animate-pulse" : "bg-neutral-400"
                        }`}
                    />
                    <span>{isLiveRadarActive ? "LIVE PULSE ON" : "LIVE PULSE OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchVisitorTelemetry(true)}
                    disabled={refreshing}
                    className="px-3.5 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs text-neutral-800 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Fetch latest radar telemetry now"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-black" : ""}`} />
                    <span>SYNC RADAR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearVisitorTelemetry}
                    disabled={isClearingTelemetry}
                    className="px-3.5 py-2 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs text-neutral-700 hover:text-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>PURGE LOGS</span>
                  </button>
                </div>
              </div>

              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                    <span>TOTAL VISITS LOGGED</span>
                    <Globe className="w-4 h-4 text-black" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-black">
                    {visitorStats.total || visitorLocations.length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600">Live audience stream</div>
                </div>

                <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                    <span>GUEST VISITORS</span>
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-black">
                    {visitorStats.guests || visitorLocations.filter((v) => v.userType === "guest").length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600">Anonymous & prospective clients</div>
                </div>

                <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                    <span>REGISTERED CLIENTS</span>
                    <Users className="w-4 h-4 text-black" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-black">
                    {visitorStats.registered || visitorLocations.filter((v) => v.userType === "registered").length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600">Logged-in atelier members</div>
                </div>

                <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                    <span>100% GPS HARDWARE FIX</span>
                    <ShieldCheck className="w-4 h-4 text-black" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-black">
                    {visitorStats.gpsVerified || visitorLocations.filter((v) => v.precisionType === "GPS_HIGH_ACCURACY").length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600">Satellite verified ±5m precision</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value)}
                    placeholder="Search by IP address, City, State, Country, User Name, PIN code..."
                    className="w-full bg-white border border-neutral-200 rounded-none pl-10 pr-4 py-2.5 text-xs font-mono text-black placeholder-neutral-500 focus:outline-none focus:border-black transition-all shadow-sm"
                  />
                </div>

                <select
                  value={visitorFilter}
                  onChange={(e) => setVisitorFilter(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-neutral-200 text-neutral-800 text-xs font-mono rounded-none px-4 py-2.5 focus:outline-none focus:border-black cursor-pointer shadow-sm"
                >
                  <option value="ALL">ALL VISITORS ({visitorLocations.length})</option>
                  <option value="GUEST">GUESTS ONLY ({visitorLocations.filter((v) => v.userType === "guest").length})</option>
                  <option value="REGISTERED">REGISTERED ONLY ({visitorLocations.filter((v) => v.userType === "registered").length})</option>
                  <option value="GPS">100% GPS VERIFIED ({visitorLocations.filter((v) => v.precisionType === "GPS_HIGH_ACCURACY").length})</option>
                  <option value="IP">IP APPROXIMATE ({visitorLocations.filter((v) => v.precisionType !== "GPS_HIGH_ACCURACY").length})</option>
                </select>
              </div>

              {/* Radar Table */}
              <div className="rounded-none border border-neutral-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono" style={{ minWidth: "1240px" }}>
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Visitor Type</th>
                        <th className="py-3.5 px-4">Identity / Name</th>
                        <th className="py-3.5 px-4">Public IP (Click to Inspect)</th>
                        <th className="py-3.5 px-4">Resolved Location</th>
                        <th className="py-3.5 px-4 text-center">Precision Type</th>
                        <th className="py-3.5 px-4">GPS Coordinates</th>
                        <th className="py-3.5 px-4">Device & OS</th>
                        <th className="py-3.5 px-4 text-right">Detected Time</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredVisitorLocations.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-neutral-600 font-mono text-xs">
                            No visitor telemetry records matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredVisitorLocations.map((loc, idx) => {
                          const isGps = loc.precisionType === "GPS_HIGH_ACCURACY";
                          const isGuest = loc.userType === "guest";
                          const isMobile = loc.deviceType === "Mobile" || loc.deviceType === "Tablet";

                          return (
                            <tr key={loc._id || idx} className="hover:bg-neutral-50 transition-colors">
                              {/* Visitor Type Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 ${isGuest
                                    ? "bg-neutral-100 border-neutral-200 text-neutral-700"
                                    : "bg-black text-white border-black font-bold"
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-none ${isGuest ? "bg-neutral-400" : "bg-white"
                                      }`}
                                  />
                                  <span>{isGuest ? "GUEST" : "CLIENT"}</span>
                                </span>
                              </td>

                              {/* Identity / Name */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-black">
                                  {loc.userName || (isGuest ? "Guest Visitor" : "Member")}
                                </div>
                                {loc.userEmail && (
                                  <div className="text-[10px] text-neutral-500">{loc.userEmail}</div>
                                )}
                              </td>

                              {/* Public IP (Click to open full dossier) */}
                              <td className="py-3.5 px-4 font-bold">
                                <button
                                  type="button"
                                  onClick={() => setSelectedVisitor(loc)}
                                  className="bg-neutral-50 hover:bg-black text-black hover:text-white px-2.5 py-1.5 rounded-none border border-neutral-200 hover:border-black text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 group shadow-sm"
                                  title="Click to view full dossier, GPS map & device intelligence"
                                >
                                  <span className="text-black group-hover:text-white transition-colors">{loc.ip}</span>
                                  <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
                                </button>
                              </td>

                              {/* Location */}
                              <td className="py-3.5 px-4 text-neutral-700">
                                <div className="font-bold text-black">
                                  {loc.city}, {loc.state}
                                </div>
                                <div className="text-[10px] text-neutral-500">
                                  {loc.country} {loc.postalCode ? `• PIN: ${loc.postalCode}` : ""}
                                </div>
                              </td>

                              {/* Precision Badge */}
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${isGps
                                    ? "bg-black text-white font-bold border-black"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-600"
                                    }`}
                                >
                                  {isGps ? (
                                    <>
                                      <ShieldCheck className="w-3 h-3 text-white" />
                                      <span>100% GPS (±{loc.accuracy}m)</span>
                                    </>
                                  ) : (
                                    <span>IP LOCATION</span>
                                  )}
                                </span>
                              </td>

                              {/* Exact GPS Pin Link */}
                              <td className="py-3.5 px-4">
                                <a
                                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-black font-bold hover:underline"
                                  title="Open in Google Maps"
                                >
                                  <span>
                                    {Number(loc.latitude).toFixed(4)}°, {Number(loc.longitude).toFixed(4)}°
                                  </span>
                                  <ExternalLink className="w-3 h-3 shrink-0 text-neutral-400" />
                                </a>
                              </td>

                              {/* Device & OS */}
                              <td className="py-3.5 px-4 text-neutral-700">
                                <div className="flex items-center gap-1.5">
                                  {isMobile ? (
                                    <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                                  ) : (
                                    <Laptop className="w-3.5 h-3.5 text-neutral-500" />
                                  )}
                                  <span>{loc.deviceType || "Desktop"}</span>
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  {loc.browser || "Browser"} • {loc.os || "OS"}
                                </div>
                              </td>

                              {/* Detected Time */}
                              <td className="py-3.5 px-4 text-right text-neutral-600">
                                <div>
                                  {new Date(loc.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  {new Date(loc.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </div>
                              </td>

                              {/* Quick Action Button */}
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedVisitor(loc)}
                                  className="px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 text-[10px] font-bold font-mono transition-all cursor-pointer border border-neutral-200 shadow-sm"
                                >
                                  DOSSIER ➔
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROMO CODE & COUPON VOUCHER CMS STUDIO */}
          {/* ========================================================================= */}
          {activeTab === "coupons" && (() => {
            const activeCount = coupons.filter((c) => c.isActive).length;
            const totalRedemptions = coupons.reduce((acc, c) => acc + (Number(c.usedCount) || 0), 0);
            const percentageCount = coupons.filter((c) => c.discountType === "percentage").length;
            const fixedCount = coupons.filter((c) => c.discountType === "fixed" || c.discountType === "flat").length;

            return (
              <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
                {/* 1. TOP HEADER & STATUS BAR */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                        ATELIER PRIVILEGE & VOUCHER STUDIO
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-black" />
                      <span>COUPON & PROMO CODE CMS</span>
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Create, edit, toggle, and curate promotional percentage vouchers, flat discounts, minimum cart barriers, and drop redemption limits.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => handleSeedDefaultCoupons(true)}
                      disabled={isSeedingCoupons}
                      className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      title="Seed default Drapza curated vouchers (DRAPZA40, FIRST10, FLAT500, etc.)"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSeedingCoupons ? "animate-spin text-black" : ""}`} />
                      <span>{isSeedingCoupons ? "SEEDING..." : "RESET DEFAULTS"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCreateCouponModal}
                      className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>NEW VOUCHER CODE</span>
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {couponSaveStatus && (
                  <div
                    className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${couponSaveStatus.startsWith("✓")
                      ? "bg-black text-white font-bold border-black"
                      : "bg-neutral-100 border-neutral-300 text-black"
                      }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>{couponSaveStatus}</span>
                  </div>
                )}

                {/* 2. REAL-TIME VOUCHER TELEMETRY TILES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Coupons</div>
                    <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{coupons.length}</div>
                    <div className="text-[10px] text-neutral-400">Archived & Live Vouchers</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-700 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-none bg-black animate-ping" />
                      <span>Active Redeemable</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{activeCount}</div>
                    <div className="text-[10px] text-neutral-400">Live for checkout usage</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Times Redeemed</div>
                    <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{totalRedemptions}</div>
                    <div className="text-[10px] text-neutral-400">Total client redemptions</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Discount Types</div>
                    <div className="text-base sm:text-lg font-bold text-black flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-none bg-black text-white font-bold text-xs">{percentageCount} %</span>
                      <span className="px-2 py-0.5 rounded-none bg-neutral-100 border border-neutral-200 text-neutral-800 font-bold text-xs">{fixedCount} FLAT</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Percentage vs Flat split</div>
                  </div>
                </div>

                {/* 3. 1-CLICK CURATED CAMPAIGN PRESET GENERATORS */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <span>1-CLICK QUICK VOUCHER PRESETS</span>
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400">[ RAPID CAMPAIGN TEMPLATES ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Summer Flash 40% Off",
                        code: "DRAPZA40",
                        desc: "Summer Vault Flash Sale - Flat 40% Off",
                        type: "percentage" as const,
                        amount: 40,
                        min: 1499,
                        max: 2500,
                        limit: 500,
                      },
                      {
                        name: "First Order 10% Welcome",
                        code: "FIRST10",
                        desc: "Welcome Privilege - 10% Off First Order",
                        type: "percentage" as const,
                        amount: 10,
                        min: 999,
                        max: 1000,
                        limit: "",
                      },
                      {
                        name: "Tier Flat ₹500 Off",
                        code: "FLAT500",
                        desc: "Tier Discount - Flat ₹500 Off Above ₹2,999",
                        type: "fixed" as const,
                        amount: 500,
                        min: 2999,
                        max: 500,
                        limit: 200,
                      },
                      {
                        name: "VIP Archive 25% Off",
                        code: "VIPATELIER",
                        desc: "High Tier Member Exclusive - 25% Off VIP Collection",
                        type: "percentage" as const,
                        amount: 25,
                        min: 2499,
                        max: 3000,
                        limit: 100,
                      },
                      {
                        name: "Instant Drop Credit ₹200",
                        code: "DROPCREDIT",
                        desc: "Instant Drop Credit - ₹200 Off Any Capsule Fit",
                        type: "fixed" as const,
                        amount: 200,
                        min: 799,
                        max: 200,
                        limit: 1000,
                      },
                      {
                        name: "Midnight Flash 50% Off",
                        code: "MIDNIGHT50",
                        desc: "Midnight Vault Secret Clearance - 50% Off",
                        type: "percentage" as const,
                        amount: 50,
                        min: 3499,
                        max: 5000,
                        limit: 50,
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setEditingCouponId(null);
                          setCouponForm({
                            code: preset.code,
                            description: preset.desc,
                            discountType: preset.type,
                            discountAmount: preset.amount,
                            minOrderValue: preset.min,
                            maxDiscountAmount: preset.max ? String(preset.max) : "",
                            usageLimit: preset.limit ? String(preset.limit) : "",
                            perUserLimit: 1,
                            startDate: new Date().toISOString().slice(0, 10),
                            expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                            isActive: true,
                            applicableCategories: "",
                          });
                          setCouponFormError(null);
                          setCouponModalOpen(true);
                        }}
                        className="p-3.5 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-black text-left transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-black uppercase font-mono truncate">
                            {preset.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-none bg-black text-white font-mono text-[10px] font-bold">
                            {preset.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1 line-clamp-1">
                          {preset.type === "percentage" ? `${preset.amount}% OFF` : `₹${preset.amount} FLAT`} // Min Order ₹{preset.min}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. 1:1 INTERACTIVE LUXURY PHYSICAL TICKET VOUCHER PREVIEW */}
                <div className="p-6 rounded-none bg-neutral-900 border border-neutral-800 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-white animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        1:1 LIVE LUXURY ATELIER VOUCHER CARD PREVIEW
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">[ LIVE FRONTEND CLIENT PERSPECTIVE ]</span>
                  </div>

                  {/* Voucher Ticket UI */}
                  {(() => {
                    const activeVoucher = previewCoupon || coupons[0] || {
                      code: "DRAPZA40",
                      description: "Summer Vault Flash Sale - Flat 40% Off",
                      discountType: "percentage",
                      discountAmount: 40,
                      minOrderValue: 1499,
                      maxDiscountAmount: 2500,
                    };
                    const isPerc = activeVoucher.discountType === "percentage";

                    return (
                      <div className="rounded-none overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/15 bg-black relative select-none max-w-4xl mx-auto">
                        {/* Left Half: Black Noir Ticket with Holographic Text */}
                        <div className="md:w-[60%] p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-[#111215] via-[#09090b] to-black relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                          {/* Top Tag & Season */}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-none border border-white/30 bg-black/60 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">
                              DRAPZA ATELIER PRIVILEGE
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                              [ EDITION 2026 ]
                            </span>
                          </div>

                          {/* Center Discount Value */}
                          <div className="my-6 space-y-1">
                            <div className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight leading-none uppercase">
                              {isPerc ? `${activeVoucher.discountAmount}% OFF` : `₹${activeVoucher.discountAmount} FLAT`}
                            </div>
                            <p className="text-xs text-neutral-300 font-mono tracking-wide pt-1">
                              {activeVoucher.description || "Exclusive promotional privilege for verified garments."}
                            </p>
                          </div>

                          {/* Bottom Rules & Min Cart */}
                          <div className="flex items-center gap-3 pt-2 border-t border-white/10 font-mono text-[10px] text-neutral-400 flex-wrap">
                            <span>MIN ORDER: <strong className="text-white">₹{activeVoucher.minOrderValue || 0}</strong></span>
                            {activeVoucher.maxDiscountAmount && (
                              <span>• MAX DISCOUNT: <strong className="text-white">₹{activeVoucher.maxDiscountAmount}</strong></span>
                            )}
                            <span>• APPLIES TO ALL GARMENTS</span>
                          </div>
                        </div>

                        {/* Right Half: Pure White Scalloped Ticket Stub */}
                        <div className="md:w-[40%] bg-white text-black p-6 sm:p-8 flex flex-col justify-between items-center text-center relative">
                          {/* Continuous Ticket Notch Decoration */}
                          <div className="w-full flex items-center justify-between border-b border-black/10 pb-3">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                              PROMO VOUCHER
                            </span>
                            <span className="w-2 h-2 rounded-none bg-black" />
                          </div>

                          {/* Middle Code Box with 1-Click Copy */}
                          <div className="my-auto py-3 space-y-2 w-full">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                              ENTER KEY AT CHECKOUT:
                            </div>
                            <div className="p-3 bg-neutral-100 rounded-none border-2 border-dashed border-black/30 flex items-center justify-between gap-2 shadow-inner">
                              <span className="font-mono text-base font-black tracking-widest text-black">
                                {activeVoucher.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCouponCode(activeVoucher.code)}
                                className="px-2.5 py-1 rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                              >
                                {copiedCouponCode === activeVoucher.code ? (
                                  <>
                                    <Check className="w-3 h-3 text-white" />
                                    <span>COPIED</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>COPY</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Barcode Graphic */}
                          <div className="w-full pt-3 border-t border-black/10 space-y-1">
                            <div className="h-6 flex items-center justify-center gap-0.5 opacity-80">
                              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3].map((w, bi) => (
                                <div key={bi} className="bg-black h-full" style={{ width: `${w * 1.5}px` }} />
                              ))}
                            </div>
                            <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-neutral-400 block">
                              AUTHENTIC DRAPZA KEY
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 5. SEARCH & FILTER TOOLBAR */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between font-mono text-xs">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                    <input
                      type="text"
                      data-ai-id="coupons.search"
                      data-ai-action="search"
                      data-ai-label="Search Vouchers & Coupons"
                      placeholder="Search voucher code or description..."
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-none pl-10 pr-4 py-2.5 text-xs font-mono text-black placeholder-neutral-400 focus:outline-none focus:border-black shadow-sm"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                    {[
                      { id: "ALL", label: `ALL (${coupons.length})` },
                      { id: "ACTIVE", label: `ACTIVE (${activeCount})` },
                      { id: "INACTIVE", label: `DISABLED (${coupons.length - activeCount})` },
                      { id: "PERCENTAGE", label: "% PERCENT" },
                      { id: "FIXED", label: "₹ FLAT" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        data-ai-id={`coupons.filter.${f.id}`}
                        data-ai-action="filter"
                        data-ai-label={`Filter Coupons by ${f.id}`}
                        onClick={() => setCouponFilter(f.id)}
                        className={`px-3 py-2 rounded-none transition-all cursor-pointer font-bold ${couponFilter === f.id
                          ? "bg-black text-white shadow-sm"
                          : "bg-white text-neutral-600 border border-neutral-200 hover:text-black"
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. VOUCHERS GRID / CARDS */}
                {filteredCoupons.length === 0 ? (
                  <div className="p-12 text-center rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                    <Ticket className="w-12 h-12 text-neutral-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-black font-mono uppercase">No Voucher Codes Found</h4>
                      <p className="text-xs text-neutral-500 font-mono">
                        {couponSearch ? `No coupons matching '${couponSearch}'.` : "No voucher codes currently configured in the archive."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSeedDefaultCoupons(true)}
                        className="px-4 py-2 bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 rounded-none font-mono text-xs uppercase cursor-pointer"
                      >
                        Seed Defaults
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCreateCouponModal}
                        className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-none font-mono text-xs font-bold uppercase cursor-pointer shadow-sm"
                      >
                        Create Voucher
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-mono">
                    {filteredCoupons.map((c) => {
                      const isPerc = c.discountType === "percentage";
                      const isExp = c.expiryDate && new Date(c.expiryDate) < new Date();

                      return (
                        <div
                          key={c._id}
                          onClick={() => setPreviewCoupon(c)}
                          className={`p-5 rounded-none bg-white border transition-all flex flex-col justify-between space-y-4 hover:border-black cursor-pointer shadow-sm ${c.isActive ? "border-neutral-200" : "border-neutral-300 opacity-75"
                            }`}
                        >
                          {/* Card Header: Code + 1-Click Copy + Active Badge */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-none bg-black text-white font-bold text-sm tracking-wider">
                                  {c.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCouponCode(c.code);
                                  }}
                                  className="p-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-600 transition-all cursor-pointer"
                                  title="Copy Code"
                                >
                                  {copiedCouponCode === c.code ? (
                                    <Check className="w-3.5 h-3.5 text-black" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* Toggle Active Status Switch Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCouponStatus(c._id);
                                }}
                                disabled={isTogglingCouponId === c._id}
                                className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer border ${c.isActive
                                  ? "bg-black text-white font-bold border-black"
                                  : "bg-neutral-100 border-neutral-300 text-neutral-600"
                                  }`}
                              >
                                {isTogglingCouponId === c._id ? "..." : c.isActive ? "ACTIVE" : "DISABLED"}
                              </button>
                            </div>

                            {/* Discount Value Badge & Title */}
                            <div>
                              <div className="text-xl font-bold text-black tracking-tight flex items-center gap-2">
                                <span>
                                  {isPerc ? `${c.discountAmount}% OFF` : `₹${c.discountAmount} FLAT`}
                                </span>
                                {c.maxDiscountAmount && isPerc && (
                                  <span className="text-[11px] font-normal text-neutral-500">
                                    (Cap: ₹{c.maxDiscountAmount})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                {c.description || "Universal promo code privilege for Drapza Atelier clientele."}
                              </p>
                            </div>

                            {/* Specifications / Constraints Table */}
                            <div className="text-[11px] space-y-1 bg-neutral-50 p-3 rounded-none border border-neutral-200">
                              <div className="flex justify-between text-neutral-600">
                                <span>Min Cart Requirement:</span>
                                <span className="text-black font-bold">
                                  {c.minOrderValue > 0 ? `₹${c.minOrderValue}` : "No Minimum"}
                                </span>
                              </div>

                              <div className="flex justify-between text-neutral-600">
                                <span>Usage Redemptions:</span>
                                <span className="text-black font-bold">
                                  {c.usedCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : "Used (Unlimited)"}
                                </span>
                              </div>

                              <div className="flex justify-between text-neutral-600">
                                <span>Expiration Status:</span>
                                <span className={isExp ? "text-neutral-400 font-bold" : "text-neutral-800 font-medium"}>
                                  {c.expiryDate
                                    ? new Date(c.expiryDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                    : "Evergreen (No Expiry)"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Card Actions: Preview, Edit, Delete */}
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditCouponModal(c);
                              }}
                              className="px-3 py-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>EDIT</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCoupon(c._id, c.code);
                              }}
                              disabled={isDeletingCouponId === c._id}
                              className="p-2 rounded-none text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: ORDERS COMMAND CENTER */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Search & Status + Payment Filter Bar */}
              <div className="space-y-3 bg-white p-4 rounded-none border border-neutral-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                    <input
                      type="text"
                      data-ai-id="orders.search"
                      data-ai-action="search"
                      data-ai-label="Search Orders"
                      placeholder="Search Order ID, Client, Track No..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none pl-10 pr-4 py-2 text-xs font-mono text-black placeholder-neutral-400 focus:outline-none focus:border-black shadow-inner"
                    />
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold shrink-0 mr-1">STATUS:</span>
                    {["ALL", "placed", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((st) => (
                      <button
                        key={st}
                        data-ai-id={`orders.filter.${st}`}
                        data-ai-action="filter"
                        data-ai-label={`Filter Orders by ${st}`}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${orderStatusFilter === st
                          ? "bg-black text-white font-bold shadow-sm"
                          : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
                          }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-neutral-100 pt-3 scrollbar-none">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold shrink-0 mr-1">PAYMENT CHANNEL:</span>
                  {[
                    { id: "ALL", label: "ALL CHANNELS" },


                    { id: "SPLIT", label: "SPLIT PAYMENT" },
                    { id: "CASHFREE", label: "CASHFREE" },
                    { id: "ONLINE", label: "RAZORPAY" },
                    { id: "COD", label: "COD" },
                    { id: "UPI_DIRECT", label: "DIRECT UPI" },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setOrderPaymentFilter(pm.id)}
                      className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer shrink-0 border ${orderPaymentFilter === pm.id
                        ? "bg-black text-white border-black font-bold shadow-sm"
                        : "bg-neutral-50 text-neutral-600 hover:text-black border-neutral-200"
                        }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-none border border-neutral-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px] text-left text-xs font-mono">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Order Ref</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Garments</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Payment Breakdown</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-black">{order.orderNumber}</div>
                            <div className="text-[10px] text-neutral-400">{order.trackingNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-black font-medium">{order.shippingAddress?.fullName}</div>
                            <div className="text-[10px] text-neutral-400">{order.shippingAddress?.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-neutral-700">
                              {order.orderItems?.length} item(s)
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                              {order.orderItems?.map((i: any) => i.name).join(", ")}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-black">
                            ₹{(order.totalPrice || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {order.paymentMethod === "GIFT_CARD" || (Number(order.giftCardDiscount) > 0 && Number(order.totalPrice) === 0) ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-black text-white border border-neutral-800">
                                    GIFT CARD (100%)
                                  </span>
                                ) : order.paymentMethod === "WALLET" || (Number(order.walletDiscount) > 0 && Number(order.totalPrice) === 0) ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-900 text-white border border-neutral-700">
                                    WALLET (100%)
                                  </span>
                                ) : (Number(order.giftCardDiscount) > 0 || Number(order.walletDiscount) > 0) && Number(order.totalPrice) > 0 ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-900 text-white border border-neutral-700">
                                    SPLIT: {order.paymentMethod}
                                  </span>
                                ) : order.paymentMethod === "CASHFREE" ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-100 text-neutral-900 border border-neutral-300">
                                    CASHFREE
                                  </span>
                                ) : order.paymentMethod === "RAZORPAY" || order.paymentMethod === "ONLINE" ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-100 text-neutral-900 border border-neutral-300">
                                    RAZORPAY
                                  </span>
                                ) : order.paymentMethod === "UPI_DIRECT" ? (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-100 text-neutral-900 border border-neutral-300">
                                    DIRECT UPI
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                                    COD
                                  </span>
                                )}

                                <span
                                  className={`px-1.5 py-0.5 rounded-none text-[9px] font-bold uppercase ${order.paymentStatus === "completed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : order.paymentStatus === "failed"
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                    }`}
                                >
                                  {order.paymentStatus === "completed" ? "✓ PAID" : order.paymentStatus.toUpperCase()}
                                </span>
                              </div>

                              <div className="text-[10px] text-neutral-500 font-sans space-y-0.5">
                                {Number(order.giftCardDiscount) > 0 && (
                                  <div className="flex items-center gap-1 text-neutral-800 font-mono">
                                    <span className="bg-neutral-100 px-1 rounded-none border border-neutral-200">
                                      {order.giftCardCode || "GC"}
                                    </span>
                                    <span>-₹{order.giftCardDiscount.toLocaleString("en-IN")}</span>
                                  </div>
                                )}
                                {Number(order.giftCardBonusDiscount) > 0 && (
                                  <div className="text-emerald-700 font-mono font-medium">
                                    Bonus Perk: -₹{order.giftCardBonusDiscount.toLocaleString("en-IN")}
                                  </div>
                                )}
                                {Number(order.walletDiscount) > 0 && (
                                  <div className="text-neutral-800 font-mono">
                                    Wallet: -₹{order.walletDiscount.toLocaleString("en-IN")}
                                  </div>
                                )}
                                {order.cashfreeOrderId && (
                                  <div className="text-[9px] font-mono text-neutral-400 truncate max-w-[150px]" title={order.cashfreeOrderId}>
                                    CF: {order.cashfreeOrderId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                              className="bg-neutral-50 border border-neutral-200 text-black text-[11px] rounded-none px-2 py-1 focus:outline-none cursor-pointer"
                            >
                              {["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                                <option key={s} value={s}>
                                  {s.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-2.5 py-1 bg-neutral-100 hover:bg-black text-black hover:text-white rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer border border-neutral-200"
                              >
                                INSPECT
                              </button>
                              <button
                                onClick={async () => {
                                  const ordId = order._id || order.orderNumber;
                                  try {
                                    setDownloadingInvoiceOrderId(ordId);
                                    await downloadOrderInvoice(order, gstConfig);
                                  } catch (e) {
                                    console.error("Admin invoice download failed:", e);
                                  } finally {
                                    setDownloadingInvoiceOrderId(null);
                                  }
                                }}
                                disabled={downloadingInvoiceOrderId === (order._id || order.orderNumber)}
                                className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-60"
                                title="Direct Download Full Invoice PDF"
                              >
                                <FileText className={`w-3 h-3 ${downloadingInvoiceOrderId === (order._id || order.orderNumber) ? "animate-bounce" : ""}`} />
                                <span>{downloadingInvoiceOrderId === (order._id || order.orderNumber) ? "DOWNLOADING..." : "INVOICE"}</span>
                              </button>
                              <button
                                onClick={() => setSelectedThermalOrder(order)}
                                className="px-2.5 py-1 bg-neutral-900 text-white hover:bg-neutral-800 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                title="Print 4x6 Thermal Shipping Label & Picklist"
                              >
                                <Printer className="w-3 h-3" />
                                <span>THERMAL AWB</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono">
                            No orders matched your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GARMENT ARCHIVES & PRODUCT CUSTOMIZER STUDIO */}
          {activeTab === "products" && (() => {
            const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
            const inStockCount = products.filter((p) => (Number(p.stock) || 0) > 0).length;
            const outOfStockCount = products.filter((p) => (Number(p.stock) || 0) <= 0).length;
            const lowStockCount = products.filter((p) => {
              const s = Number(p.stock) || 0;
              return s > 0 && s < 15;
            }).length;
            const totalCatalogValuation = products.reduce((acc, p) => {
              const price = Number(p.numericPrice || String(p.price ?? "").replace(/[^0-9]/g, "") || 0);
              const stk = Number(p.stock) || 0;
              return acc + price * stk;
            }, 0);

            const filteredByCat = products.filter((p) => {
              const matchesCat =
                productCategoryFilter === "ALL" ||
                (p.category && p.category.toLowerCase().includes(productCategoryFilter.toLowerCase()));
              const matchesSearch =
                !productSearch ||
                p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.blend?.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.cut?.toLowerCase().includes(productSearch.toLowerCase());

              const stk = Number(p.stock) || 0;
              let matchesStock = true;
              if (productStockFilter === "IN_STOCK") {
                matchesStock = stk > 0;
              } else if (productStockFilter === "OUT_OF_STOCK") {
                matchesStock = stk <= 0;
              } else if (productStockFilter === "LOW_STOCK") {
                matchesStock = stk > 0 && stk < 15;
              }

              return matchesCat && matchesSearch && matchesStock;
            });

            const isStorefrontHidingOos = filterConfig?.hideOutOfStockOnStorefront ?? false;
            const bulkMatchingProducts = products.filter((p) => {
              const matchesCategory =
                bulkTargetScope !== "category" ||
                bulkTargetCategory === "ALL" ||
                p.category === bulkTargetCategory;
              const matchesStock = bulkTargetScope !== "in_stock" || Number(p.stock) > 0;
              return matchesCategory && matchesStock;
            });
            const activeDiscountedCount = products.filter(
              (p) => Boolean(p.discountTagActive) && (Number(p.discountPercentage) > 0 || Number(p.discountPrice) > 0)
            ).length;

            return (
              <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto font-mono">
                {/* 1. TOP HEADER & STUDIO ACTIONS */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                        ATELIER INVENTORY & SPECIFICATION GOVERNANCE
                      </span>
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-black flex items-center gap-2">
                      <Package className="w-5 h-5 text-black" />
                      <span>GARMENT ARCHIVES & STOCK MANAGEMENT</span>
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Manage real-time stock levels, quick restock, mark out-of-stock, and configure public customer storefront visibility.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => setBulkDiscountOpen((prev) => !prev)}
                      className={`px-4 py-2.5 rounded-none font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2 border ${bulkDiscountOpen
                        ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-500"
                        }`}
                      title="Apply store-wide discount (10%, 20%, 50%, etc.) to all garments in 1 click"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>{bulkDiscountOpen ? "CLOSE BULK DISCOUNT" : "⚡ BULK STORE DISCOUNT"}</span>
                      {activeDiscountedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-none bg-white text-red-600 text-[10px] font-black">
                          {activeDiscountedCount} ON
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSeedDefaultProducts}
                      disabled={isSeedingProducts}
                      className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      title="Seed all 16 predefined Drapza catalog pieces into database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSeedingProducts ? "animate-spin text-black" : ""}`} />
                      <span>{isSeedingProducts ? "SEEDING..." : "RE-SEED 16 ARCHIVES"}</span>
                    </button>

                    <button
                      type="button"
                      data-ai-id="products.bulk-import"
                      data-ai-label="Bulk Excel / CSV Import"
                      data-ai-action="open"
                      onClick={() => setBulkProductModalOpen(true)}
                      className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-900 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                      title="Import from Excel / CSV or download catalog spreadsheet"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-700" />
                      <span>BULK EXCEL / CSV</span>
                    </button>

                    <button
                      type="button"
                      data-ai-id="products.create"
                      data-ai-label="Register New Garment"
                      data-ai-action="open"
                      onClick={handleOpenCreateProductModal}
                      className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>REGISTER NEW GARMENT</span>
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {productSaveStatus && (
                  <div
                    className={`p-4 rounded-none text-xs font-bold flex items-center gap-2 border animate-fadeIn ${productSaveStatus.startsWith("✓")
                      ? "bg-black text-white border-black font-bold"
                      : "bg-neutral-100 border-neutral-300 text-black"
                      }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>{productSaveStatus}</span>
                  </div>
                )}

                {/* 2. REAL-TIME CATALOG TELEMETRY TILES */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Garments</div>
                    <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{products.length}</div>
                    <div className="text-[10px] text-neutral-600">Active catalog archetypes</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Stock Units</div>
                    <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{totalStockUnits}</div>
                    <div className="text-[10px] text-neutral-600">Vault physical inventory</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">In Stock Available</div>
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">{inStockCount}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">Ready for dispatch</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Out of Stock</div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-600 tracking-tight flex items-center gap-1.5">
                      <span>{outOfStockCount}</span>
                      {outOfStockCount > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-red-100 text-red-700 font-bold uppercase">
                          OOS
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-600">0 units inventory</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-red-200 bg-red-50/20 shadow-sm space-y-1">
                    <div className="text-[10px] text-red-600 uppercase tracking-wider font-bold">Discount Tags</div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-700 tracking-tight flex items-center gap-1.5">
                      <span>{activeDiscountedCount}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-red-600 text-white font-bold uppercase">
                        {Math.round((activeDiscountedCount / (products.length || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-600">Active promo tags</div>
                  </div>

                  <div className="p-4 rounded-none bg-white border border-neutral-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Inventory Valuation</div>
                    <div className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                      ₹{totalCatalogValuation.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-neutral-600">Gross archive value</div>
                  </div>
                </div>

                {/* STORE-WIDE BULK DISCOUNT & PROMOTIONS CONSOLE */}
                {bulkDiscountOpen && (
                  <div className="p-5 sm:p-6 rounded-none bg-neutral-900 text-white border-2 border-red-600 shadow-xl space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-red-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                              Store-Wide Bulk Discount & Promo Controller
                            </h3>
                            <span className="px-2 py-0.5 rounded-none bg-red-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                              1-CLICK SYNC
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400">
                            Apply or remove discount offers across all products or specific categories at once.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="font-mono-technical text-xs text-neutral-400">
                          Target Scope: <strong className="text-white">{bulkMatchingProducts.length}</strong> of {products.length} Garments
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Preset Buttons & Percentage input (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <label className="block text-[11px] font-mono-technical uppercase tracking-wider text-neutral-300 font-bold mb-2">
                            1. Select Quick Preset Discount Percentage:
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {[10, 15, 20, 30, 40, 50, 70].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setBulkDiscountPercent(pct);
                                  setBulkOfferTag(`${pct}% OFF`);
                                }}
                                className={`py-2 px-1 text-center font-mono-technical text-xs font-bold rounded-none border transition-all cursor-pointer ${bulkDiscountPercent === pct
                                  ? "bg-red-600 text-white border-red-600 shadow-md scale-105"
                                  : "bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-500"
                                  }`}
                              >
                                {pct}% OFF
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono-technical uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                              Custom Discount (%):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={bulkDiscountPercent}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                                  setBulkDiscountPercent(val);
                                  setBulkOfferTag(val > 0 ? `${val}% OFF` : "");
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-none px-3 py-2 text-sm font-mono-technical focus:outline-none focus:border-red-500 font-bold"
                              />
                              <span className="absolute right-3 top-2 text-xs font-mono-technical text-neutral-400 font-bold">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono-technical uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                              Storefront Offer Tag Text:
                            </label>
                            <input
                              type="text"
                              value={bulkOfferTag}
                              onChange={(e) => setBulkOfferTag(e.target.value)}
                              placeholder="e.g. 50% OFF, FLASH SALE"
                              className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-none px-3 py-2 text-sm font-mono-technical focus:outline-none focus:border-red-500 font-bold"
                            />
                          </div>
                        </div>

                        {/* Target Scope Radios */}
                        <div>
                          <label className="block text-[11px] font-mono-technical uppercase tracking-wider text-neutral-300 font-bold mb-2">
                            2. Target Scope:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setBulkTargetScope("all");
                                setBulkTargetCategory("ALL");
                              }}
                              className={`p-2.5 rounded-none border text-left font-mono-technical transition-all cursor-pointer ${bulkTargetScope === "all"
                                ? "bg-white text-black border-white font-bold shadow-sm"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                                }`}
                            >
                              <div className="font-bold">🌍 ALL PRODUCTS</div>
                              <div className="text-[10px] opacity-75">Entire store ({products.length})</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBulkTargetScope("in_stock");
                                setBulkTargetCategory("ALL");
                              }}
                              className={`p-2.5 rounded-none border text-left font-mono-technical transition-all cursor-pointer ${bulkTargetScope === "in_stock"
                                ? "bg-white text-black border-white font-bold shadow-sm"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                                }`}
                            >
                              <div className="font-bold">📦 IN STOCK ONLY</div>
                              <div className="text-[10px] opacity-75">Available inventory ({inStockCount})</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBulkTargetScope("category")}
                              className={`p-2.5 rounded-none border text-left font-mono-technical transition-all cursor-pointer ${bulkTargetScope === "category"
                                ? "bg-white text-black border-white font-bold shadow-sm"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                                }`}
                            >
                              <div className="font-bold">🏷️ BY CATEGORY</div>
                              <div className="text-[10px] opacity-75">Target specific collection</div>
                            </button>
                          </div>

                          {bulkTargetScope === "category" && (
                            <div className="mt-2.5">
                              <select
                                value={bulkTargetCategory}
                                onChange={(e) => setBulkTargetCategory(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-none px-3 py-2 text-xs font-mono-technical focus:outline-none focus:border-red-500"
                              >
                                <option value="ALL">ALL CATEGORIES</option>
                                {(filterConfig?.categories && filterConfig.categories.length > 0
                                  ? filterConfig.categories
                                  : [
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
                                  ]
                                ).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Live Impact Calculator & Actions (5 cols) */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-none bg-neutral-950 border border-neutral-800 space-y-4">
                        <div className="space-y-3">
                          <div className="text-xs font-mono-technical text-neutral-400 uppercase font-bold border-b border-neutral-800 pb-2 flex items-center justify-between">
                            <span>CALCULATION PREVIEW</span>
                            <span className="text-red-400">{bulkDiscountPercent}% DISCOUNT</span>
                          </div>

                          <div className="space-y-2 text-xs font-mono-technical">
                            <div className="flex justify-between text-neutral-400">
                              <span>Target Items:</span>
                              <span className="text-white font-bold">{bulkMatchingProducts.length} Garments</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Sample Base Price:</span>
                              <span className="text-white line-through font-bold">₹1,440</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Sample Discounted Price:</span>
                              <span className="text-emerald-400 font-bold">
                                ₹{Math.round(1440 * (1 - bulkDiscountPercent / 100)).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Customer Savings:</span>
                              <span className="text-red-400 font-bold">
                                Save ₹{(1440 - Math.round(1440 * (1 - bulkDiscountPercent / 100))).toLocaleString("en-IN")} ({bulkDiscountPercent}%)
                              </span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Storefront Tag:</span>
                              <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px]">
                                {bulkOfferTag || `${bulkDiscountPercent}% OFF`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Execute Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-neutral-800">
                          <button
                            type="button"
                            disabled={isApplyingBulkDiscount || bulkDiscountPercent <= 0 || bulkMatchingProducts.length === 0}
                            onClick={() => handleApplyBulkDiscount("apply")}
                            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono-technical text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                          >
                            {isApplyingBulkDiscount ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>APPLYING TO {bulkMatchingProducts.length} PRODUCTS...</span>
                              </>
                            ) : (
                              <>
                                <Percent className="w-4 h-4" />
                                <span>APPLY {bulkDiscountPercent}% DISCOUNT TO ALL ({bulkMatchingProducts.length})</span>
                              </>
                            )}
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isApplyingBulkDiscount}
                              onClick={() => handleApplyBulkDiscount("remove")}
                              className="py-2 px-2 bg-neutral-800 hover:bg-red-950/40 hover:text-red-300 hover:border-red-700 border border-neutral-700 text-neutral-300 font-mono-technical text-[10.5px] uppercase transition-all cursor-pointer text-center"
                              title="Remove all discounts and reset original prices"
                            >
                              🔴 REMOVE ALL DISCOUNTS
                            </button>

                            <button
                              type="button"
                              disabled={isApplyingBulkDiscount}
                              onClick={() => {
                                const nextState = !bulkDiscountTagActive;
                                setBulkDiscountTagActive(nextState);
                                handleApplyBulkDiscount("toggle_active");
                              }}
                              className="py-2 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-mono-technical text-[10.5px] uppercase transition-all cursor-pointer text-center"
                              title="Toggle discount tags without changing prices"
                            >
                              👁️ {bulkDiscountTagActive ? "HIDE ALL TAGS" : "SHOW ALL TAGS"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. STOREFRONT OUT-OF-STOCK VISIBILITY MASTER SWITCH */}
                <div className="p-5 rounded-none bg-neutral-950 text-white border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-none flex items-center justify-center shrink-0 ${isStorefrontHidingOos
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                      {isStorefrontHidingOos ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                          Customer Storefront Out-of-Stock Visibility
                        </h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-widest ${isStorefrontHidingOos
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                          : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                          }`}>
                          {isStorefrontHidingOos ? "ACTIVE: OUT OF STOCK HIDDEN" : "ACTIVE: ALL GARMENTS VISIBLE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300">
                        {isStorefrontHidingOos
                          ? "Garments with 0 stock are automatically concealed from public browsing on /wardrobe and search."
                          : "All garments remain visible to customers on /wardrobe with an OUT OF STOCK badge on exhausted items."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleStorefrontHideOutOfStock}
                    className={`px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 flex items-center gap-2.5 shadow-sm hover:scale-105 active:scale-95 ${isStorefrontHidingOos
                      ? "bg-amber-400 hover:bg-amber-300 text-black font-bold"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700"
                      }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-none ${isStorefrontHidingOos ? "bg-black" : "bg-emerald-400 animate-pulse"}`} />
                    <span>
                      {isStorefrontHidingOos
                        ? "OUT-OF-STOCK HIDDEN (CLICK TO SHOW)"
                        : "CLICK TO HIDE OUT-OF-STOCK"}
                    </span>
                  </button>
                </div>

                {/* 4. SEARCH, STOCK FILTER & CATEGORY FILTER TOOLBAR */}
                <div className="p-5 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4 text-xs">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
                      <input
                        type="text"
                        data-ai-id="products.search"
                        data-ai-action="search"
                        data-ai-label="Search Garments Catalog"
                        placeholder="Search garment name, blend, cut, category..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-black placeholder-neutral-500 focus:outline-none focus:border-black shadow-xs"
                      />
                    </div>

                    {/* Stock Status Filter Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mr-1 hidden sm:inline">
                        STOCK:
                      </span>
                      {[
                        { id: "ALL", label: `ALL (${products.length})` },
                        { id: "IN_STOCK", label: `IN STOCK (${inStockCount})` },
                        { id: "LOW_STOCK", label: `LOW STOCK <15 (${lowStockCount})` },
                        { id: "OUT_OF_STOCK", label: `OUT OF STOCK (${outOfStockCount})` },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          data-ai-id={`products.filter.stock.${st.id}`}
                          data-ai-action="filter"
                          data-ai-label={`Filter Stock by ${st.id}`}
                          onClick={() => setProductStockFilter(st.id as any)}
                          className={`px-3 py-2 rounded-none transition-all cursor-pointer font-bold ${productStockFilter === st.id
                            ? "bg-black text-white shadow-sm"
                            : "bg-neutral-100 text-neutral-700 hover:text-black hover:bg-neutral-200"
                            }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mr-1">
                      CATEGORY:
                    </span>
                    {(filterConfig?.categories && filterConfig.categories.length > 0
                      ? [
                        { id: "ALL", label: "ALL CATEGORIES" },
                        ...filterConfig.categories.map((c) => ({ id: c, label: c.toUpperCase() })),
                      ]
                      : [
                        { id: "ALL", label: "ALL CATEGORIES" },
                        { id: "Kurti", label: "KURTI" },
                        { id: "Saree", label: "SAREE" },
                        { id: "Jeans", label: "JEANS" },
                        { id: "Palazzo/Bottom", label: "PALAZZO/BOTTOM" },
                        { id: "Leggings", label: "LEGGINGS" },
                        { id: "Tops", label: "TOPS" },
                        { id: "Dupatta", label: "DUPATTA" },
                        { id: "Co-ord Set", label: "CO-ORD SET" },
                        { id: "Panties", label: "PANTIES" },
                        { id: "Bra", label: "BRA" },
                        { id: "Sharara/Lehenga", label: "SHARARA/LEHENGA" },
                      ]
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setProductCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-none transition-all cursor-pointer text-[11px] font-bold ${productCategoryFilter === cat.id
                          ? "bg-black text-white shadow-xs"
                          : "bg-white text-neutral-600 border border-neutral-200 hover:text-black hover:border-neutral-400"
                          }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. PRODUCT CARDS GRID */}
                {filteredByCat.length === 0 ? (
                  <div className="p-12 text-center rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                    <Package className="w-12 h-12 text-neutral-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-black uppercase">No Garment Archetypes Found</h4>
                      <p className="text-xs text-neutral-500">
                        {productSearch || productStockFilter !== "ALL" || productCategoryFilter !== "ALL"
                          ? `No garments matching the selected filter criteria.`
                          : "No garments found in database. Click below to seed default luxury catalog."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearch("");
                          setProductCategoryFilter("ALL");
                          setProductStockFilter("ALL");
                        }}
                        className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-none text-xs font-bold uppercase cursor-pointer border border-neutral-300"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredByCat.map((product) => {
                      const displayPrice = product.price || `₹${(Number(product.numericPrice) || 990).toLocaleString("en-IN")}`;
                      const currentStock = Number(product.stock) || 0;
                      const isLowStock = currentStock > 0 && currentStock < 15;
                      const isOutOfStock = currentStock <= 0;
                      const isUpdating = updatingStockIds[product._id] ?? false;

                      return (
                        <div
                          key={product._id}
                          className={`p-5 rounded-none bg-white border transition-all shadow-sm group flex flex-col justify-between space-y-4 ${isOutOfStock
                            ? "border-red-200 hover:border-red-400 bg-red-50/10"
                            : isLowStock
                              ? "border-amber-200 hover:border-amber-400"
                              : "border-neutral-200 hover:border-black"
                            }`}
                        >
                          <div className="space-y-3">
                            {/* Garment Image Frame */}
                            <div className="relative w-full h-56 bg-neutral-50 rounded-none overflow-hidden flex items-center justify-center border border-neutral-200 p-2">
                              <img
                                src={product.images?.[0] || "/images/drapza/products/product_1.png"}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                onError={handleImageFallbackError}
                                className={`object-contain max-h-full max-w-full transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "grayscale opacity-75" : ""
                                  }`}
                              />

                              {/* Category Badge */}
                              <span className="absolute top-2 left-2 px-2.5 py-1 bg-black/80 text-white backdrop-blur-md rounded-none text-[9px] font-bold uppercase tracking-wider z-20">
                                {product.category || "GARMENT"}
                              </span>

                              {/* Discount Offer Tag Badge on Card Image */}
                              {Boolean(product.discountTagActive) && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white font-black rounded-none text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm z-20 animate-pulse">
                                  {product.offerTag || (product.discountPercentage ? `${product.discountPercentage}% OFF` : "OFFER ACTIVE")}
                                </span>
                              )}

                              {/* Accent or Featured Badge */}
                              {product.isFeatured && !product.discountTagActive && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-400 text-black font-bold rounded-none text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm z-20">
                                  ★ FEATURED
                                </span>
                              )}

                              {/* OUT OF STOCK Image Banner Overlay */}
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10 p-4 text-center">
                                  <span className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-none shadow-md">
                                    OUT OF STOCK
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStock(product._id, 50)}
                                    className="px-3 py-1 bg-white hover:bg-neutral-100 text-black text-[10px] font-bold uppercase rounded-none tracking-wider cursor-pointer shadow-sm transition-all hover:scale-105"
                                  >
                                    RESTOCK (+50)
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Title & Price Header */}
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-black text-sm uppercase truncate">
                                    {product.name}
                                  </h4>
                                </div>
                                <div className="shrink-0 text-right">
                                  {Boolean(product.discountTagActive) && (Number(product.discountPercentage) > 0 || Number(product.discountPrice) > 0) ? (
                                    <>
                                      <span className="text-black font-bold text-sm block">
                                        ₹{(Number(product.discountPrice) > 0 ? Number(product.discountPrice) : Math.round((Number(product.numericPrice) || 990) * (1 - (Number(product.discountPercentage) || 0) / 100))).toLocaleString("en-IN")}
                                      </span>
                                      <span className="text-[10px] text-neutral-400 line-through block">
                                        {displayPrice}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-black font-bold text-sm">
                                      {displayPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500 line-clamp-2 mt-1 font-body">
                                {product.description || "Architectural garment crafted for daily elegance."}
                              </p>
                            </div>

                            {/* Offer & Discount Tag Fast Control Strip */}
                            <div className="p-2.5 rounded-none bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-none shrink-0 ${product.discountTagActive ? "bg-red-600 animate-pulse" : "bg-neutral-300"}`} />
                                <span className="text-[10px] font-bold uppercase truncate text-neutral-700">
                                  {product.discountTagActive
                                    ? `TAG: ${product.offerTag || `${product.discountPercentage || 50}% OFF`} (ON)`
                                    : "OFFER TAG: OFF"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickToggleDiscountTag(product)}
                                className={`px-2.5 py-1 rounded-none text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${product.discountTagActive
                                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                                  : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100 hover:border-black"
                                  }`}
                                title={product.discountTagActive ? "Click to turn offer tag OFF" : "Click to turn offer tag ON"}
                              >
                                {product.discountTagActive ? "TURN OFF" : "TURN ON"}
                              </button>
                            </div>

                            {/* Specifications */}
                            <div className="text-[11px] space-y-1.5 bg-neutral-50 p-3 rounded-none border border-neutral-200">
                              <div className="flex justify-between text-neutral-600">
                                <span>Fabric & Weight:</span>
                                <span className="text-black font-bold truncate max-w-[170px]">
                                  {product.blend || product.weight || "480 GSM French Terry"}
                                </span>
                              </div>

                              <div className="flex justify-between text-neutral-600 items-center">
                                <span>Palette & Sizes:</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center -space-x-1">
                                    {(product.colors || ["#1b1b1b"]).slice(0, 3).map((clr: string, cIdx: number) => (
                                      <span
                                        key={cIdx}
                                        className="w-3 h-3 rounded-none border border-white shadow-xs"
                                        style={{ backgroundColor: clr }}
                                        title={clr}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-black font-medium">
                                    {(product.sizes || ["S", "M", "L", "XL"]).join(", ")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* INTERACTIVE STOCK MANAGEMENT CONSOLE */}
                            <div className="p-3 rounded-none bg-neutral-100/70 border border-neutral-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                                  INVENTORY STOCK
                                </span>
                                {isOutOfStock ? (
                                  <span className="px-2 py-0.5 rounded-none bg-red-100 border border-red-300 text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-none bg-red-600 animate-pulse" />
                                    OUT OF STOCK (0)
                                  </span>
                                ) : isLowStock ? (
                                  <span className="px-2 py-0.5 rounded-none bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-none bg-amber-600" />
                                    LOW STOCK ({currentStock})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-none bg-emerald-600" />
                                    IN STOCK ({currentStock})
                                  </span>
                                )}
                              </div>

                              {/* Stepper + Direct Input + Quick Restock Actions */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border border-neutral-300 rounded-none overflow-hidden bg-white shadow-xs">
                                  <button
                                    type="button"
                                    disabled={isUpdating || currentStock <= 0}
                                    onClick={() => handleUpdateStock(product._id, Math.max(0, currentStock - 1))}
                                    className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-black font-bold disabled:opacity-30 cursor-pointer transition-colors text-base"
                                    title="Decrease stock by 1"
                                  >
                                    -
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      stockInputValues[product._id] !== undefined
                                        ? stockInputValues[product._id]
                                        : currentStock
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setStockInputValues((prev) => ({ ...prev, [product._id]: val }));
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (!isNaN(val) && val >= 0 && val !== currentStock) {
                                        handleUpdateStock(product._id, val);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                                        if (!isNaN(val) && val >= 0 && val !== currentStock) {
                                          handleUpdateStock(product._id, val);
                                        }
                                      }
                                    }}
                                    className="w-14 h-8 text-center text-xs font-bold text-black bg-white focus:outline-none focus:bg-neutral-50"
                                  />

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStock(product._id, currentStock + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-black font-bold disabled:opacity-30 cursor-pointer transition-colors text-base"
                                    title="Increase stock by 1"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Fast Restock / Mark OOS Buttons */}
                                <div className="flex items-center gap-1.5 flex-1">
                                  {currentStock > 0 ? (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateStock(product._id, 0)}
                                      className="flex-1 py-1.5 px-2 rounded-none bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                                      title="Mark Out of Stock (0 units)"
                                    >
                                      MARK OOS (0)
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateStock(product._id, 50)}
                                      className="flex-1 py-1.5 px-2 rounded-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                                      title="Restock with 50 units"
                                    >
                                      RESTOCK (50)
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStock(product._id, currentStock + 20)}
                                    className="py-1.5 px-2 rounded-none bg-white hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    title="Add +20 units"
                                  >
                                    +20
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Action Strip */}
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProductModal(product)}
                                className="px-3.5 py-1.5 rounded-none bg-black hover:bg-neutral-800 text-white font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>EDIT SPEC</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateProduct(product)}
                                className="p-1.5 rounded-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                                title="Duplicate / Clone Garment"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/wardrobe/${product.slug || product._id}`}
                                target="_blank"
                                className="px-2.5 py-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white text-neutral-700 text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                              >
                                <span>VIEW LIVE</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product._id, product.name)}
                                disabled={isDeletingProductId === product._id}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors cursor-pointer"
                                title="Retire Garment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: WARDROBE FILTERS CMS */}
          {activeTab === "filters" && (
            <div className="space-y-6 animate-fadeIn">
              <WardrobeFiltersAdminTab
                filterConfig={filterConfig}
                setFilterConfig={setFilterConfig}
              />
            </div>
          )}

          {/* TAB: INVOICE & GST CMS */}
          {activeTab === "gst" && (
            <div className="space-y-6 animate-fadeIn">
              <InvoiceGstAdminTab
                gstConfig={gstConfig}
                setGstConfig={setGstConfig}
              />
            </div>
          )}

          {/* TAB: PAYMENT AUTHENTICATION & GATEWAYS CMS */}
          {activeTab === "payments" && (
            <div className="space-y-6 animate-fadeIn">
              <PaymentConfigAdminTab
                config={paymentConfig}
                setConfig={setPaymentConfig}
              />
            </div>
          )}

          {/* TAB: SHIPPING, COD & PINCODE LOGISTICS CMS */}
          {activeTab === "shipping-rules" && (
            <div className="space-y-6 animate-fadeIn">
              <ShippingConfigAdminTab />
            </div>
          )}

          {/* TAB: FOOTER ARCHITECTURE CMS */}
          {/* TAB: FOOTER ARCHITECTURE CMS */}
          {activeTab === "footer" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto font-mono text-xs">
              {/* 1:1 LIVE STOREFRONT FOOTER CANVAS */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                      1:1 LIVE STOREFRONT FOOTER CANVAS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">[ REAL-TIME SYNC & INLINE EDITABLE ]</span>
                </div>

                <div className="w-full bg-[#f4f4f0] rounded-none overflow-hidden border border-neutral-300">
                  <Footer
                    config={footerConfig}
                    isEditable={true}
                    onUpdate={(patch: any) => setFooterConfig((prev: any) => ({ ...prev, ...patch }))}
                  />
                </div>
              </div>

              {/* GRANULAR COLUMN, LINK & DISPATCH CONTROLLER */}
              <FooterAdminTab
                config={footerConfig}
                setConfig={setFooterConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: BOGO & BUNDLE TIERS CMS */}
          {activeTab === "membership" && (
            <div className="space-y-6 animate-fadeIn">
              <MembershipAdminTab />
            </div>
          )}

          {activeTab === "bogo-cms" && (
            <div className="space-y-6 animate-fadeIn">
              <BogoAdminTab
                config={bogoConfig}
                setConfig={setBogoConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: MATERIAL TACTILE SCIENCE & GSM LOUPE CMS */}
          {activeTab === "fabric-gsm" && (
            <div className="space-y-6 animate-fadeIn">
              <FabricGsmAdminTab
                config={fabricGsmConfig}
                setConfig={setFabricGsmConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: CAMPAIGN SILHOUETTES & LOOKBOOK CMS */}
          {activeTab === "lookbook" && (
            <div className="space-y-6 animate-fadeIn">
              <LookbookAdminTab
                initialConfig={lookbookConfig}
                products={products}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: TESTIMONIALS & BOUTIQUE STORIES PAGE CMS */}
          {/* TAB: TOUCHPOINT / CONTACT PAGE CMS */}
          {activeTab === "touchpoint-cms" && (
            <div className="space-y-6 animate-fadeIn">
              <TouchpointAdminTab
                config={touchpointConfig}
                setConfig={setTouchpointConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {activeTab === "testimonials-cms" && (
            <div className="space-y-6 animate-fadeIn">
              <TestimonialsAdminTab
                config={testimonialsConfig}
                setConfig={setTestimonialsConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: GENESIS ARCHITECTURE PAGE CMS */}
          {activeTab === "genesis" && (
            <div className="space-y-6 animate-fadeIn">
              <GenesisAdminTab
                initialConfig={genesisConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: WHATSAPP FLOATING BUTTON CMS */}
          {activeTab === "whatsapp-widget" && (
            <div className="space-y-6 animate-fadeIn">
              <WhatsAppAdminTab
                initialConfig={whatsAppButtonConfig}
                onSaveSuccess={fetchData}
              />
            </div>
          )}

          {/* TAB: CLIENT SUPPORT & INQUIRIES CONCIERGE */}
          {activeTab === "support-tickets" && (
            <div className="space-y-6 animate-fadeIn">
              <SupportAdminTab />
            </div>
          )}

          {/* TAB: VIP NEWSLETTER SUBSCRIBERS CRM & BROADCASTS */}
          {activeTab === "newsletter-crm" && (
            <div className="space-y-6 animate-fadeIn">
              <NewsletterAdminTab />
            </div>
          )}

          {/* TAB: RETURNS, EXCHANGES & REFUND VAULT */}
          {activeTab === "returns-vault" && (
            <div className="space-y-6 animate-fadeIn">
              <ReturnsAdminTab />
            </div>
          )}

          {/* TAB: CUSTOM SIZE & FITTING APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div className="space-y-6 animate-fadeIn">
              <AppointmentsAdminTab />
            </div>
          )}

          {/* TAB: ABANDONED BAG & CART RECOVERY RADAR */}
          {activeTab === "abandoned-bags" && (
            <div className="space-y-6 animate-fadeIn">
              <AbandonedCartAdminTab />
            </div>
          )}

          {/* TAB: CUSTOMER REVIEWS & RATINGS MODERATION */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fadeIn">
              <ReviewsAdminTab />
            </div>
          )}

          {/* TAB: SALES, RETURNS, CANCELLATIONS & AUDIT REPORTS ENGINE */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-fadeIn">
              <ReportsAnalyticsAdminTab />
            </div>
          )}

          {/* TAB: SECURITY & AUDIT LOGS COMMAND CENTER */}
          {activeTab === "security-logs" && (
            <div className="space-y-6 animate-fadeIn">
              <SecurityAuditAdminTab />
            </div>
          )}

          {/* TAB: SEARCH DEMAND & ZERO-RESULT RADAR */}
          {activeTab === "search-radar" && (
            <div className="space-y-6 animate-fadeIn">
              <SearchRadarAdminTab
                onQuickAddProduct={(name) => {
                  handleOpenCreateProductModal();
                  setProductForm((prev: any) => ({ ...prev, name }));
                  setActiveTab("products");
                }}
              />
            </div>
          )}

          {/* TAB: STORE CREDIT WALLET & GIFT CARDS */}
          {false && (
            <div className="space-y-6 animate-fadeIn">
              <WalletAdminTab />
            </div>
          )}

          {/* TAB: SHOP THE LOOK & INSTAGRAM UGC FEED CMS */}
          {activeTab === "shop-the-look" && (
            <div className="space-y-6 animate-fadeIn">
              <ShopTheLookAdminTab />
            </div>
          )}

          {/* TAB 4: CLIENTELE DIRECTORY & ACCOUNT GOVERNANCE */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Controls Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-none bg-white border border-neutral-200 shadow-sm">
                <div>
                  <h3 className="text-base font-bold font-mono uppercase text-black tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-black" />
                    <span>CLIENTELE VAULT & ACCOUNT GOVERNANCE</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-1">
                    Manage access privileges, block/unblock security restrictions, verify accounts, and purge profiles.
                  </p>
                </div>

                {/* Status metrics */}
                <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                  <span className="px-3 py-1 rounded-none bg-neutral-100 border border-neutral-200 text-neutral-800">
                    Total: <strong className="text-black">{users.length}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-none bg-black text-white font-bold">
                    Verified: <strong>{users.filter((u) => u.isVerified).length}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-none bg-neutral-100 border border-neutral-200 text-neutral-800">
                    Blocked: <strong>{users.filter((u) => u.isBlocked).length}</strong>
                  </span>
                </div>
              </div>

              {/* Notification Status Banner */}
              {userActionStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs border flex items-center justify-between shadow-sm ${userActionStatus.startsWith("✓")
                    ? "bg-black text-white font-bold border-black"
                    : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <span>{userActionStatus}</span>
                  <button onClick={() => setUserActionStatus(null)} className="text-neutral-500 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    data-ai-id="users.search"
                    data-ai-action="search"
                    data-ai-label="Search Clients & Access"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search clients by name, email archive, or contact phone..."
                    className="w-full bg-white border border-neutral-200 rounded-none pl-10 pr-4 py-2.5 text-xs font-mono text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-all shadow-sm"
                  />
                </div>

                <select
                  data-ai-id="users.filter.status"
                  data-ai-action="filter"
                  data-ai-label="Filter Clients by Status"
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-neutral-200 text-neutral-800 text-xs font-mono rounded-none px-4 py-2.5 focus:outline-none focus:border-black cursor-pointer shadow-sm"
                >
                  <option value="ALL">ALL CLIENTS ({users.length})</option>
                  <option value="ADMIN">ADMINS ONLY ({users.filter((u) => u.role === "admin").length})</option>
                  <option value="USER">CLIENTS ONLY ({users.filter((u) => u.role !== "admin").length})</option>
                  <option value="ACTIVE">ACTIVE ONLY ({users.filter((u) => !u.isBlocked && !u.isDisabled).length})</option>
                  <option value="BLOCKED">BLOCKED ({users.filter((u) => u.isBlocked).length})</option>
                  <option value="DISABLED">DEACTIVATED ({users.filter((u) => u.isDisabled).length})</option>
                  <option value="VERIFIED">VERIFIED ({users.filter((u) => u.isVerified).length})</option>
                  <option value="UNVERIFIED">UNVERIFIED ({users.filter((u) => !u.isVerified).length})</option>
                </select>
              </div>

              {/* Clients Table */}
              <div className="rounded-none border border-neutral-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px] text-left text-xs font-mono">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 whitespace-nowrap">Client Identity</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Email Archive</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">Verification</th>
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">Access State</th>
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">Security Status</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Joined Date</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap" style={{ width: "490px", minWidth: "490px" }}>Governance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-neutral-400 font-mono text-xs">
                            No clientele records match the search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isProcessing = processingUserId === u._id;
                          return (
                            <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                              {/* Name & Phone */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-bold text-black flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-none bg-neutral-100 flex items-center justify-center text-[10px] uppercase font-bold text-black border border-neutral-200">
                                    {u.name?.charAt(0) || "U"}
                                  </span>
                                  <div>
                                    <div>{u.name}</div>
                                    {u.phone && <div className="text-[10px] text-neutral-500">{u.phone}</div>}
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="py-3.5 px-4 whitespace-nowrap text-neutral-700">{u.email}</td>

                              {/* Role (Interactive Switcher) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="relative inline-flex items-center">
                                  <select
                                    value={u.role}
                                    disabled={isProcessing}
                                    onChange={(e) =>
                                      openRoleModal(
                                        u,
                                        e.target.value as "user" | "admin"
                                      )
                                    }
                                    className={`pl-2.5 pr-6 py-1 rounded-none text-[10px] uppercase font-bold tracking-wider cursor-pointer border transition-all appearance-none focus:outline-none disabled:opacity-50 ${u.role === "admin"
                                      ? "bg-black text-white border-black font-bold shadow-sm"
                                      : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:border-black"
                                      }`}
                                    title="Click to Switch Role (Promote to Admin / Demote to User)"
                                  >
                                    <option value="user">USER</option>
                                    <option value="admin">ADMIN</option>
                                  </select>
                                  <ChevronDown
                                    className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${u.role === "admin" ? "text-white" : "text-neutral-500"
                                      }`}
                                  />
                                </div>
                              </td>

                              {/* Verification Status */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerifyUser(u._id)}
                                  disabled={isProcessing}
                                  className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 mx-auto ${u.isVerified
                                    ? "bg-black text-white font-bold border-black"
                                    : "bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200"
                                    }`}
                                  title="Click to Toggle Verification"
                                >
                                  {u.isVerified ? (
                                    <>
                                      <UserCheck className="w-3 h-3 text-white" />
                                      <span>VERIFIED</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3 h-3 text-neutral-400" />
                                      <span>UNVERIFIED</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Access State (Active / Disabled) */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDisableUser(u._id)}
                                  disabled={isProcessing || u.role === "admin"}
                                  className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer border mx-auto ${u.isDisabled
                                    ? "bg-neutral-100 border-neutral-300 text-neutral-600"
                                    : "bg-black text-white font-bold border-black"
                                    } disabled:opacity-50`}
                                  title="Click to Toggle Active / Deactivated State"
                                >
                                  {u.isDisabled ? "DISABLED" : "ACTIVE"}
                                </button>
                              </td>

                              {/* Security Status (Blocked / Normal) */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBlockUser(u._id)}
                                  disabled={isProcessing || u.role === "admin"}
                                  className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 mx-auto ${u.isBlocked
                                    ? "bg-black text-white border-black font-bold animate-pulse"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-black"
                                    } disabled:opacity-50`}
                                  title="Click to Toggle Block / Unblock"
                                >
                                  {u.isBlocked ? (
                                    <>
                                      <Ban className="w-3 h-3 text-white" />
                                      <span>BLOCKED</span>
                                    </>
                                  ) : (
                                    <span>NORMAL</span>
                                  )}
                                </button>
                              </td>

                              {/* Date */}
                              <td className="py-3.5 px-4 whitespace-nowrap text-neutral-500">
                                {new Date(u.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>

                              {/* Governance Actions (Block/Unblock, Disable, Verify, Delete) */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap" style={{ width: "490px", minWidth: "490px" }}>
                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: "6px", flexWrap: "nowrap", width: "100%", minWidth: "480px" }}>
                                  {/* Block / Unblock button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlockUser(u._id)}
                                    disabled={isProcessing || u.role === "admin"}
                                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer border disabled:opacity-30 ${u.isBlocked
                                      ? "bg-black text-white border-black hover:bg-neutral-800"
                                      : "bg-neutral-100 text-black border-neutral-200 hover:bg-black hover:text-white"
                                      }`}
                                  >
                                    {u.isBlocked ? "UNBLOCK" : "BLOCK"}
                                  </button>

                                  {/* Disable / Enable button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDisableUser(u._id)}
                                    disabled={isProcessing || u.role === "admin"}
                                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer border disabled:opacity-30 ${u.isDisabled
                                      ? "bg-black text-white border-black font-bold"
                                      : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:text-black"
                                      }`}
                                  >
                                    {u.isDisabled ? "ENABLE" : "DISABLE"}
                                  </button>

                                  {/* Verify / Unverify button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVerifyUser(u._id)}
                                    disabled={isProcessing}
                                    className="px-2 py-1 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-[10px] font-mono whitespace-nowrap shrink-0 text-neutral-700 hover:text-black transition-all cursor-pointer"
                                    title="Toggle Verification"
                                  >
                                    {u.isVerified ? "UNVERIFY" : "VERIFY"}
                                  </button>

                                  {/* Role Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={() => openRoleModal(u)}
                                    disabled={isProcessing}
                                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer border flex items-center gap-1 ${u.role === "admin"
                                      ? "bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-black hover:text-white"
                                      : "bg-black text-white border-black hover:bg-neutral-800"
                                      }`}
                                    title={u.role === "admin" ? "Demote to Client User" : "Promote to System Administrator"}
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>{u.role === "admin" ? "DEMOTE" : "MAKE ADMIN"}</span>
                                  </button>

                                  {/* Terminate Session Button */}
                                  <button
                                    type="button"
                                    onClick={() => openTerminateModal(u)}
                                    disabled={isProcessing || u.role === "admin"}
                                    className="px-2.5 py-1 rounded-none bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200 text-[10px] font-bold font-mono whitespace-nowrap shrink-0 text-neutral-800 transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1"
                                    title="Force Terminate User Session (Force Logout across devices)"
                                  >
                                    <LogOut className="w-3 h-3 text-neutral-600 hover:text-white" />
                                    <span>TERMINATE</span>
                                  </button>

                                  {/* Delete User button */}
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(u)}
                                    disabled={isProcessing || u.role === "admin"}
                                    className="p-1.5 rounded-none bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200 text-neutral-600 whitespace-nowrap shrink-0 transition-all cursor-pointer disabled:opacity-30"
                                    title={u.role === "admin" ? "Administrative accounts cannot be deleted" : "Delete User Permanently"}
                                  >
                                    {isProcessing ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MAIL & SYSTEM DIAGNOSTICS */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold font-mono text-black uppercase tracking-wider">
                    FAILOVER MAIL ENGINE DIAGNOSTICS
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-1">
                    Test the 3-Tier Multi-Provider dispatch strategy (Nodemailer ➔ Brevo ➔ Resend).
                  </p>
                </div>

                <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <span className="text-neutral-700">Tier 1: Nodemailer SMTP (Gmail)</span>
                    <span className="text-black font-bold">READY (SSL/TLS)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <span className="text-neutral-700">Tier 2: Brevo API (Sendinblue)</span>
                    <span className="text-black font-bold">CONFIGURED ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700">Tier 3: Resend API</span>
                    <span className="text-black font-bold">CONFIGURED ✓</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-mono text-neutral-600">Recipient Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailInput}
                      onChange={(e) => setTestEmailInput(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-none px-4 py-2.5 text-xs font-mono text-black focus:outline-none focus:border-black shadow-sm"
                      placeholder="Enter email to receive test message..."
                    />
                    <button
                      onClick={handleSendTestMail}
                      disabled={isSendingTestMail}
                      className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold rounded-none flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isSendingTestMail ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>DISPATCH</span>
                    </button>
                  </div>

                  {emailStatus && (
                    <div
                      className={`p-3 rounded-none font-mono text-xs ${emailStatus.startsWith("✓")
                        ? "bg-black text-white font-bold border border-black"
                        : "bg-neutral-100 border border-neutral-300 text-black"
                        }`}
                    >
                      {emailStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE VISITOR GEOLOCATION & IP TELEMETRY */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold font-mono text-black uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-black" />
                      <span>LIVE VISITOR GEOLOCATION & IP TELEMETRY</span>
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                      Real-time 100% accurate client GPS coordinates, IP address, and regional dispatch resolution.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-none bg-neutral-100 text-black font-bold font-mono text-xs border border-neutral-200">
                    Logged Visitors: <strong className="text-black">{visitorLocations.length}</strong>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-none border border-neutral-200">
                  <table className="w-full min-w-[1250px] text-left text-xs font-mono">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3.5">Visitor IP</th>
                        <th className="py-3 px-3.5">Resolved Region</th>
                        <th className="py-3 px-3.5">Exact GPS Coordinates</th>
                        <th className="py-3 px-3.5 text-center">Accuracy</th>
                        <th className="py-3 px-3.5 text-right">Detected At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {visitorLocations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-neutral-400 font-mono text-xs">
                            No visitor geolocation records received yet.
                          </td>
                        </tr>
                      ) : (
                        visitorLocations.slice(0, 30).map((loc, idx) => (
                          <tr key={loc._id || idx} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-3 px-3.5 text-black font-bold">{loc.ip}</td>
                            <td className="py-3 px-3.5 text-neutral-700">
                              <div>{loc.city}, {loc.state}</div>
                              {loc.postalCode && <div className="text-[10px] text-neutral-400">PIN: {loc.postalCode}</div>}
                            </td>
                            <td className="py-3 px-3.5 text-black font-bold">
                              {Number(loc.latitude).toFixed(4)}° N, {Number(loc.longitude).toFixed(4)}° E
                            </td>
                            <td className="py-3 px-3.5 text-center text-neutral-500">
                              ±{loc.accuracy}m
                            </td>
                            <td className="py-3 px-3.5 text-right text-neutral-400">
                              {new Date(loc.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HERO SECTION • CMS */}
          {/* TAB: HERO SECTION • 1:1 LIVE CANVAS CMS */}
          {activeTab === "hero" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Sticky Action HUD */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-none bg-white border border-neutral-200 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
                    <span className="w-2.5 h-2.5 rounded-none bg-black animate-pulse" />
                    <span className="text-black font-bold tracking-wider">1:1 LIVE HOMEPAGE HERO CANVAS</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-black tracking-wider">
                    HERO VISUAL COMMAND
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Direct live on-canvas controller: click any text on the hero below to edit directly, or upload new model images.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetHeroConfig}
                    disabled={isResettingHero}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResettingHero ? "animate-spin text-black" : ""}`} />
                    <span>RESET DEFAULTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveHeroConfig}
                    disabled={isSavingHero}
                    className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingHero ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>PUBLISH LIVE HERO</span>
                  </button>
                </div>
              </div>

              {/* Notification Status Banner */}
              {heroSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs border flex items-center justify-between shadow-sm ${heroSaveStatus.startsWith("✓")
                    ? "bg-black text-white font-bold border-black"
                    : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <span>{heroSaveStatus}</span>
                  <button onClick={() => setHeroSaveStatus(null)} className="text-neutral-500 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ========================================================================= */}
              {/* EXACT 1:1 HOMEPAGE HERO SECTION LIVE CANVAS & CONTROLLER */}
              {/* ========================================================================= */}
              <div className="relative w-full rounded-none overflow-hidden border-2 border-neutral-300 shadow-xl bg-[#edf1e8] text-black h-[85vh] min-h-[620px] flex flex-col justify-between select-none">

                {/* Top Banner Quick Controller Bar */}
                <div className="relative z-40 bg-black text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider shrink-0 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      1:1 HERO COMPONENT & DIRECT LIVE CONTROLS
                    </span>
                    <span className="hidden xl:inline-block text-neutral-400 text-[10px]">
                      [ Click any text directly to edit ]
                    </span>
                  </div>

                  {/* Quick Canvas Controls Right on the Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scale Nudge */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded gap-1 text-[10px]">
                      <span className="text-neutral-400">Scale:</span>
                      <button
                        type="button"
                        onClick={() => setHeroConfig(prev => ({ ...prev, modelScale: Math.max(50, (prev.modelScale || 100) - 5) }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Decrease Scale"
                      >
                        -
                      </button>
                      <span className="w-9 text-center font-bold text-emerald-400">{heroConfig.modelScale || 100}%</span>
                      <button
                        type="button"
                        onClick={() => setHeroConfig(prev => ({ ...prev, modelScale: Math.min(180, (prev.modelScale || 100) + 5) }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Increase Scale"
                      >
                        +
                      </button>
                    </div>

                    {/* Y Offset Nudge */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded gap-1 text-[10px]">
                      <span className="text-neutral-400">Pos Y:</span>
                      <button
                        type="button"
                        onClick={() => setHeroConfig(prev => ({ ...prev, modelOffsetY: (prev.modelOffsetY || 0) - 10 }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Move Model Up"
                      >
                        ↑
                      </button>
                      <span className="w-10 text-center font-bold text-emerald-400">{heroConfig.modelOffsetY || 0}px</span>
                      <button
                        type="button"
                        onClick={() => setHeroConfig(prev => ({ ...prev, modelOffsetY: (prev.modelOffsetY || 0) + 10 }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Move Model Down"
                      >
                        ↓
                      </button>
                    </div>

                    {/* Shadow Toggle */}
                    <button
                      type="button"
                      onClick={() => setHeroConfig(prev => ({ ...prev, modelShadow: !prev.modelShadow }))}
                      className={`px-2 py-1 border text-[10px] uppercase rounded transition-all cursor-pointer ${heroConfig.modelShadow
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white"
                        }`}
                    >
                      Shadow: {heroConfig.modelShadow ? "ON" : "OFF"}
                    </button>

                    {/* Quick Image Upload Trigger */}
                    <label className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-[10px] uppercase rounded cursor-pointer flex items-center gap-1 transition-all">
                      {isUploadingHeroImage ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" />
                      ) : (
                        <Upload className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{isUploadingHeroImage ? "Uploading..." : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroImageFileUpload}
                        disabled={isUploadingHeroImage}
                      />
                    </label>

                    {/* Quick Save Live Hero Button */}
                    <button
                      type="button"
                      onClick={handleSaveHeroConfig}
                      disabled={isSavingHero}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] uppercase tracking-widest rounded flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all ml-1"
                      title="Save and publish live to storefront"
                    >
                      {isSavingHero ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>SAVE LIVE</span>
                    </button>
                  </div>
                </div>

                {/* 1:1 Shared Modular Hero Component in Live Editable Mode */}
                <Hero
                  config={heroConfig}
                  isEditable={true}
                  onUpdate={(patch: any) => setHeroConfig((prev) => ({ ...prev, ...patch }))}
                  className="hero-admin-preview flex-1"
                  animateOnScroll={false}
                />
              </div>

              {/* ========================================================================= */}
              {/* HERO VISUAL STUDIO CONTROLLER: STRUCTURED EDITING DOCKS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. MAIN COPY & HEADLINE DOCK (6 COLS) */}
                <div className="lg:col-span-6 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>HERO HEADLINE & COPY CONTROLLER</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">[ KOULEN FONT ]</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#aaa] mb-1 font-bold">1. Headline Line 1 (Upper):</label>
                      <input
                        type="text"
                        value={heroConfig.headlineLine1}
                        onChange={(e) => setHeroConfig({ ...heroConfig, headlineLine1: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-display text-xl uppercase tracking-tight"
                        placeholder="SILHOUETTES FOR"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1 font-bold">2. Headline Line 2 (Lower):</label>
                      <input
                        type="text"
                        value={heroConfig.headlineLine2}
                        onChange={(e) => setHeroConfig({ ...heroConfig, headlineLine2: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-display text-xl uppercase tracking-tight"
                        placeholder="THE NEXT ERA"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222] space-y-3">
                    <span className="text-neutral-400 font-bold block text-[11px] uppercase tracking-wider">Footer Telemetry & Scroll CTA:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#888] mb-1 text-[10px]">Left Tag 1:</label>
                        <input
                          type="text"
                          value={heroConfig.telemetryTag1}
                          onChange={(e) => setHeroConfig({ ...heroConfig, telemetryTag1: e.target.value })}
                          className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2 text-white focus:outline-none focus:border-white text-xs"
                          placeholder="Void Index"
                        />
                      </div>
                      <div>
                        <label className="block text-[#888] mb-1 text-[10px]">Right Tag 2:</label>
                        <input
                          type="text"
                          value={heroConfig.telemetryTag2}
                          onChange={(e) => setHeroConfig({ ...heroConfig, telemetryTag2: e.target.value })}
                          className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2 text-white focus:outline-none focus:border-white text-xs"
                          placeholder="Model v.23"
                        />
                      </div>
                      <div>
                        <label className="block text-[#888] mb-1 text-[10px]">Center Scroll Text:</label>
                        <input
                          type="text"
                          value={heroConfig.ctaButtonText}
                          onChange={(e) => setHeroConfig({ ...heroConfig, ctaButtonText: e.target.value })}
                          className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2 text-white focus:outline-none focus:border-white text-xs"
                          placeholder="SCROLL"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MODEL ASSET & GEOMETRY TUNING DOCK (6 COLS) */}
                <div className="lg:col-span-6 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>MODEL ASSET & GEOMETRY CONTROLLER</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">[ REAL-TIME TRANSFORM ]</span>
                  </div>

                  {/* Upload & Image URL */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-white font-bold">Model Photo Asset:</span>
                      <label className="px-3.5 py-1.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2">
                        {isUploadingHeroImage ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        <span>{isUploadingHeroImage ? "UPLOADING..." : "UPLOAD NEW PHOTO"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageFileUpload}
                          disabled={isUploadingHeroImage}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={heroConfig.modelImage}
                      onChange={(e) => setHeroConfig({ ...heroConfig, modelImage: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white text-xs focus:outline-none focus:border-white"
                      placeholder="/home/hero.png"
                    />
                  </div>

                  {/* Sliders Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#222]">
                    <div>
                      <div className="flex justify-between text-[#888] mb-1 text-[10px]">
                        <span>Model Scale:</span>
                        <span className="text-white font-bold">{heroConfig.modelScale ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="5"
                        value={heroConfig.modelScale ?? 100}
                        onChange={(e) => setHeroConfig({ ...heroConfig, modelScale: Number(e.target.value) })}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[#888] mb-1 text-[10px]">
                        <span>Vertical Offset Y:</span>
                        <span className="text-white font-bold">{heroConfig.modelOffsetY ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="2"
                        value={heroConfig.modelOffsetY ?? 0}
                        onChange={(e) => setHeroConfig({ ...heroConfig, modelOffsetY: Number(e.target.value) })}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[#888] mb-1 text-[10px]">
                        <span>Horizontal Offset X:</span>
                        <span className="text-white font-bold">{heroConfig.modelOffsetX ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="2"
                        value={heroConfig.modelOffsetX ?? 0}
                        onChange={(e) => setHeroConfig({ ...heroConfig, modelOffsetX: Number(e.target.value) })}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[#888] mb-1 text-[10px]">
                        <span>Model Opacity:</span>
                        <span className="text-white font-bold">{heroConfig.modelOpacity ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={heroConfig.modelOpacity ?? 100}
                        onChange={(e) => setHeroConfig({ ...heroConfig, modelOpacity: Number(e.target.value) })}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroConfig.modelShadow !== false}
                        onChange={(e) => setHeroConfig({ ...heroConfig, modelShadow: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-white cursor-pointer"
                      />
                      <span className="text-white font-medium text-xs">Cinematic Drop Shadow</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setHeroConfig({ ...heroConfig, modelScale: 100, modelOffsetX: 0, modelOffsetY: 0, modelOpacity: 100, modelShadow: false })}
                      className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Reset Geometry
                    </button>
                  </div>
                </div>

              </div>

              {/* 3. PRESET MODELS & EDITORIAL PRESETS */}
              <div className="p-5 rounded-none bg-[#121316] border border-[#26272c] space-y-3 font-mono text-xs">
                <span className="text-white font-bold block text-[11px] uppercase tracking-wider">Quick Preset Models:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Original Noir Sunglasses Model (/home/hero.png)", url: "/home/hero.png" },
                    { label: "Peel Reveal Model Cutout", url: "/peel-reveal/peel-reveal-cutout.png" },
                    { label: "Lookbook Garment 01", url: "/products/product_1.png" },
                    { label: "Lookbook Garment 02", url: "/products/product_2.png" },
                    { label: "Lookbook Garment 03", url: "/products/product_3.png" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setHeroConfig({ ...heroConfig, modelImage: preset.url })}
                      className={`px-3 py-1.5 rounded-none border text-[11px] font-mono transition-all cursor-pointer ${heroConfig.modelImage === preset.url
                        ? "bg-white text-black border-white font-bold shadow-lg"
                        : "bg-[#18191c] text-[#aaa] border-[#333] hover:text-white hover:border-[#555]"
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-none bg-[#121316] border border-[#26272c] shadow-xl">
                <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>All changes made on the canvas above are published live instantly to the homepage.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetHeroConfig}
                    disabled={isResettingHero}
                    className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveHeroConfig}
                    disabled={isSavingHero}
                    className="px-8 py-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingHero ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH LIVE HERO</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PHILOSOPHY & BRAND STATEMENT MANIFESTO CMS */}
          {/* ========================================================================= */}
          {activeTab === "statement" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                      BRAND PHILOSOPHY & MANIFESTO STUDIO
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-white flex items-center gap-2">
                    <Quote className="w-5 h-5 text-white" />
                    <span>PHILOSOPHY MANIFESTO CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Live editor for the brand philosophy section: section badge, giant bold manifesto statement, floating geometric symbol, and edition telemetry.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetStatementConfig}
                    disabled={isResettingStatement}
                    className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResettingStatement ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveStatementConfig}
                    disabled={isSavingStatement}
                    className="px-6 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingStatement ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH PHILOSOPHY</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {statementSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${statementSaveStatus.startsWith("✓")
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/60 border-red-500/50 text-red-300"
                    }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{statementSaveStatus}</span>
                </div>
              )}

              {/* 2. 1:1 LIVE STOREFRONT ABOUT / PHILOSOPHY CANVAS & DIRECT CONTROLLER */}
              <div className="relative w-full rounded-none overflow-hidden border-2 border-neutral-800 shadow-2xl bg-[#0f0f0f] text-white flex flex-col justify-between select-none">

                {/* Top Banner Quick Controller Bar */}
                <div className="relative z-40 bg-black text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider shrink-0 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      1:1 STOREFRONT PHILOSOPHY LIVE CANVAS
                    </span>
                    <span className="hidden xl:inline-block text-neutral-400 text-[10px]">
                      [ Click any text directly on canvas to edit ]
                    </span>
                  </div>

                  {/* Quick Canvas Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Emblem Scale Nudge */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded gap-1 text-[10px]">
                      <span className="text-neutral-400">Emblem:</span>
                      <button
                        type="button"
                        onClick={() => setStatementConfig(prev => ({ ...prev, iconScale: Math.max(40, (prev.iconScale || 100) - 5) }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Decrease Emblem Size"
                      >
                        -
                      </button>
                      <span className="w-9 text-center font-bold text-emerald-400">{statementConfig.iconScale || 100}%</span>
                      <button
                        type="button"
                        onClick={() => setStatementConfig(prev => ({ ...prev, iconScale: Math.min(160, (prev.iconScale || 100) + 5) }))}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Increase Emblem Size"
                      >
                        +
                      </button>
                    </div>

                    {/* Emblem Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => setStatementConfig(prev => ({ ...prev, showIcon: prev.showIcon === false ? true : false, showFloatingSymbol: prev.showFloatingSymbol === false ? true : false }))}
                      className={`px-2 py-1 border text-[10px] uppercase rounded transition-all cursor-pointer ${statementConfig.showIcon !== false
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white"
                        }`}
                    >
                      Emblem: {statementConfig.showIcon !== false ? "ON" : "OFF"}
                    </button>

                    {/* Quick Symbol Upload Trigger */}
                    <label className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-[10px] uppercase rounded cursor-pointer flex items-center gap-1 transition-all">
                      {isUploadingStatementSymbol ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" />
                      ) : (
                        <Upload className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{isUploadingStatementSymbol ? "Uploading..." : "Upload Emblem"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleStatementSymbolUpload}
                        disabled={isUploadingStatementSymbol}
                      />
                    </label>

                    {/* Quick Save Live Button */}
                    <button
                      type="button"
                      onClick={handleSaveStatementConfig}
                      disabled={isSavingStatement}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] uppercase tracking-widest rounded flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all ml-1"
                      title="Save and publish live to storefront"
                    >
                      {isSavingStatement ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>SAVE LIVE</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* EXACT STOREFRONT ABOUT COMPONENT CODE COPIED DIRECTLY FROM HOMEPAGE */}
                {/* ========================================================================= */}
                {/* 1:1 Shared Modular AboutSection Component in Live Visual Editable Mode */}
                <AboutSection
                  config={statementConfig}
                  isEditable={true}
                  onUpdate={(patch: any) => setStatementConfig((prev) => ({ ...prev, ...patch }))}
                  className="about-admin-preview select-text"
                />

              </div>

              {/* 3. MANIFESTO COPY & TAG EDITOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Main Copy Studio */}
                <div className="lg:col-span-7 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Quote className="w-4 h-4 text-emerald-400" />
                      <span>MANIFESTO COPY & PILL BADGE</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-400">Section Status:</span>
                      <input
                        type="checkbox"
                        checked={statementConfig.isEnabled !== false}
                        onChange={(e) => setStatementConfig({ ...statementConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-emerald-500 cursor-pointer"
                      />
                      <span className={statementConfig.isEnabled !== false ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {statementConfig.isEnabled !== false ? "LIVE" : "HIDDEN"}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#aaa] mb-1.5 font-bold">1. Section Subtitle (Above Headline):</label>
                    <input
                      type="text"
                      value={statementConfig.subtitle}
                      onChange={(e) => setStatementConfig({ ...statementConfig, subtitle: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-mono uppercase tracking-widest text-xs"
                      placeholder="Clothing reduced to pure signal"
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] mb-1.5 font-bold">2. Main Philosophy Manifesto Statement (Giant Headline):</label>
                    <textarea
                      rows={4}
                      value={statementConfig.statement}
                      onChange={(e) => setStatementConfig({ ...statementConfig, statement: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3.5 text-white focus:outline-none focus:border-white font-display uppercase tracking-wide text-base leading-relaxed"
                      placeholder="OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT."
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Rendered in Koulen all-caps high-impact typography on the homepage.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#aaa] mb-1.5 font-bold">3. Section Footer Tag (Below Emblem):</label>
                    <input
                      type="text"
                      value={statementConfig.footerTag}
                      onChange={(e) => setStatementConfig({ ...statementConfig, footerTag: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-mono uppercase tracking-widest text-xs"
                      placeholder="/ Core State /"
                    />
                  </div>

                  {/* Curated Presets */}
                  <div>
                    <label className="block text-[#aaa] mb-2 font-bold">3. Curated Manifesto Presets:</label>
                    <div className="space-y-2">
                      {[
                        {
                          name: "Zero Friction (Default)",
                          tag: "PHILOSOPHY • ZERO FRICTION",
                          text: "OUR COLLECTIONS ARE BUILT FOR THE FRICTIONLESS, THE FAST, AND THE QUIETLY DEFIANT.",
                        },
                        {
                          name: "Avant-Garde Architectural Archive",
                          tag: "MANIFESTO • ARCHITECTURAL DRAPE",
                          text: "ENGINEERED IN PURITY. CRAFTED FOR THE AVANT-GARDE ARCHIVE OF THE NEW ERA.",
                        },
                        {
                          name: "High-Density Technical Streetwear",
                          tag: "SPECIFICATION • NOIR DISPATCH",
                          text: "HEAVYWEIGHT STRUCTURES BORN FROM ZERO COMPROMISE AND TECHNICAL TEXTILE MASTERY.",
                        },
                        {
                          name: "Heritage & Modern Rebellion",
                          tag: "CULTURE • UNCOMPROMISING DRAPE",
                          text: "TIMELESS FABRICATIONS RE-ENGINEERED WITH UNAPOLOGETIC URBAN SILHOUETTES.",
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setStatementConfig({
                              ...statementConfig,
                              tag: preset.tag,
                              statement: preset.text,
                            });
                          }}
                          className="w-full text-left p-3 rounded-none bg-[#17181d] hover:bg-[#1e1f25] border border-[#2b2c32] hover:border-white/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {preset.name}
                            </span>
                            <span className="text-[9px] text-neutral-500 uppercase">{preset.tag}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1 font-display uppercase tracking-wide truncate">
                            "{preset.text}"
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Emblem & Metadata Settings */}
                <div className="lg:col-span-5 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>EMBLEM & FOOTER METADATA</span>
                    </h3>
                  </div>

                  {/* Floating Symbol Toggle */}
                  <div className="p-3.5 rounded-none bg-[#18191d] border border-[#28292f] space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-white font-bold text-xs">Show Floating Emblem:</span>
                      <input
                        type="checkbox"
                        checked={statementConfig.showFloatingSymbol !== false}
                        onChange={(e) => setStatementConfig({ ...statementConfig, showFloatingSymbol: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    {/* Emblem Scale Slider */}
                    <div className="pt-2 border-t border-[#222]">
                      <div className="flex items-center justify-between text-[#aaa] mb-1">
                        <span className="font-bold">Emblem Scale / Size:</span>
                        <span className="text-emerald-400 font-bold">{statementConfig.iconScale || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="160"
                        step="5"
                        value={statementConfig.iconScale || 100}
                        onChange={(e) => setStatementConfig({ ...statementConfig, iconScale: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {statementConfig.showFloatingSymbol !== false && (
                      <div className="space-y-3 pt-2 border-t border-[#222]">
                        <label className="block text-[#aaa]">Emblem Visual Source:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setStatementConfig({ ...statementConfig, symbolType: "drapza_symbol" })}
                            className={`p-2.5 rounded-none border text-center font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${statementConfig.symbolType !== "custom_image"
                              ? "bg-white text-black border-white shadow-md"
                              : "bg-[#1f2026] text-neutral-400 border-[#2f3036] hover:text-white"
                              }`}
                          >
                            Drapza Core SVG
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatementConfig({ ...statementConfig, symbolType: "custom_image" })}
                            className={`p-2.5 rounded-none border text-center font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${statementConfig.symbolType === "custom_image"
                              ? "bg-white text-black border-white shadow-md"
                              : "bg-[#1f2026] text-neutral-400 border-[#2f3036] hover:text-white"
                              }`}
                          >
                            Custom Logo Cutout
                          </button>
                        </div>

                        {statementConfig.symbolType === "custom_image" && (
                          <div className="space-y-2 pt-2">
                            <label className="block text-[#aaa] text-[11px]">Upload Custom Emblem PNG to CDN:</label>
                            <label className="w-full py-2 px-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2">
                              {isUploadingStatementSymbol ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              )}
                              <span>{isUploadingStatementSymbol ? "UPLOADING TO CDN..." : "CHOOSE EMBLEM PNG"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleStatementSymbolUpload}
                                disabled={isUploadingStatementSymbol}
                                className="hidden"
                              />
                            </label>

                            <input
                              type="text"
                              value={statementConfig.customSymbolImage}
                              onChange={(e) => setStatementConfig({ ...statementConfig, customSymbolImage: e.target.value })}
                              placeholder="https://res.cloudinary.com/.../emblem.png"
                              className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2 text-white focus:outline-none focus:border-white text-[11px]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Metadata Badges */}
                  <div className="space-y-3">
                    <span className="text-white font-bold block">Footer Metadata Telemetry:</span>
                    <div>
                      <label className="block text-[#aaa] mb-1">Left Badge Tag:</label>
                      <input
                        type="text"
                        value={statementConfig.badgeEdition}
                        onChange={(e) => setStatementConfig({ ...statementConfig, badgeEdition: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase"
                        placeholder="[ EDITION 2026 ]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1">Center Brand Identifier:</label>
                      <input
                        type="text"
                        value={statementConfig.badgeCenter}
                        onChange={(e) => setStatementConfig({ ...statementConfig, badgeCenter: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase font-bold"
                        placeholder="DRAPZA ATELIER CORE"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1">Right Territories Tag:</label>
                      <input
                        type="text"
                        value={statementConfig.badgeTerritories}
                        onChange={(e) => setStatementConfig({ ...statementConfig, badgeTerritories: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase"
                        placeholder="[ ALL TERRITORIES ]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. PUBLISH ACTION BAR AT BOTTOM */}
              <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                  <span>Changes made here will instantly update the Philosophy & Manifesto section on the homepage.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetStatementConfig}
                    disabled={isResettingStatement}
                    className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveStatementConfig}
                    disabled={isSavingStatement}
                    className="px-8 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingStatement ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH LIVE PHILOSOPHY</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MARQUEE BANNER & HERO CARD CMS (1:1 LIVE CANVAS & CONTROLLER) */}
          {/* ========================================================================= */}
          {activeTab === "marquee" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                      KINETIC MARQUEE & CENTER CARD STUDIO
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                    <Radio className="w-5 h-5 text-black" />
                    <span>MARQUEE BANNER CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Live 1:1 visual canvas editor: click any text on the card or background tickers to edit directly, or adjust model positioning and sizing.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetMarqueeConfig}
                    disabled={isResettingMarquee}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResettingMarquee ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveMarqueeConfig}
                    disabled={isSavingMarquee}
                    className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingMarquee ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH MARQUEE</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {marqueeSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${marqueeSaveStatus.startsWith("✓")
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <Radio className="w-4 h-4 shrink-0" />
                  <span>{marqueeSaveStatus}</span>
                </div>
              )}

              {/* 2. 1:1 LIVE STOREFRONT MARQUEE CANVAS & CINEMA CONTROLLER HUD */}
              <div className="relative w-full rounded-none overflow-hidden border-2 border-neutral-300 shadow-2xl bg-[#edf1e8] text-black flex flex-col justify-between select-none">

                {/* Cinema HUD Controller Bar */}
                <div className="relative z-40 bg-black text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider shrink-0 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className={`w-2.5 h-2.5 rounded-full ${marqueeMotionMode === "scroll" ? "bg-cyan-400 animate-pulse" : marqueeAnimPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                      <span>1:1 MARQUEE STOREFRONT ENGINE</span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold ${marqueeMotionMode === "scroll" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : marqueeAnimPlaying ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                        {marqueeMotionMode === "scroll" ? "SCROLL-TRIGGERED (SCRUB ON SCROLL)" : marqueeAnimPlaying ? "CONTINUOUS AUTO-TICKER" : "FROZEN"}
                      </span>
                    </span>
                    <span className="hidden xl:inline-block text-neutral-400 text-[10px]">
                      [ Click any text on canvas to live-edit ]
                    </span>
                  </div>

                  {/* Quick Canvas Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Motion Mode Switcher: Scroll-Triggered vs Continuous Loop */}
                    <button
                      type="button"
                      onClick={() => setMarqueeMotionMode((prev) => (prev === "scroll" ? "continuous" : "scroll"))}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${marqueeMotionMode === "scroll"
                          ? "bg-cyan-950 border-cyan-600 text-cyan-300 hover:bg-cyan-900"
                          : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white"
                        }`}
                      title="Toggle between Scroll-Triggered scrub and continuous auto-loop"
                    >
                      <span>{marqueeMotionMode === "scroll" ? "📜 SCROLL-TRIGGERED" : "▶ AUTO-TICKER"}</span>
                    </button>

                    {/* Scroll Scrub Simulator & Replay (Active in Scroll Mode) */}
                    {marqueeMotionMode === "scroll" && (
                      <div className="flex items-center bg-neutral-900 border border-cyan-800/80 px-2 py-1 rounded gap-1.5 text-[10px]">
                        <span className="text-cyan-300 font-bold hidden sm:inline">Scrub:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={marqueeScrollProgress}
                          onChange={(e) => setMarqueeScrollProgress(parseFloat(e.target.value))}
                          className="w-16 sm:w-24 accent-cyan-400 cursor-pointer h-1"
                          title="Interactive Scroll Trigger Simulation (0% to 100%)"
                        />
                        <span className="w-8 text-center font-bold text-cyan-400">{Math.round(marqueeScrollProgress * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setMarqueeTriggerKey((k) => k + 1)}
                          className="px-1.5 py-0.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 rounded text-[9px] font-bold cursor-pointer transition-all ml-1"
                          title="Replay text entrance trigger (headline, tag, brand logo reveal)"
                        >
                          ⚡ REPLAY
                        </button>
                      </div>
                    )}

                    {/* Continuous Auto-Ticker Play/Pause & Speed (Active in Continuous Mode) */}
                    {marqueeMotionMode === "continuous" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setMarqueeAnimPlaying(!marqueeAnimPlaying)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${marqueeAnimPlaying
                              ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                              : "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400"
                            }`}
                          title={marqueeAnimPlaying ? "Pause Kinetic Marquee Ticker" : "Resume Kinetic Marquee Ticker"}
                        >
                          {marqueeAnimPlaying ? (
                            <>
                              <Pause className="w-3 h-3 text-amber-400" />
                              <span>PAUSE</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-black text-black" />
                              <span>RESUME</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-[10px]">
                          <span className="text-neutral-400 mr-1.5 hidden sm:inline">Speed:</span>
                          {[
                            { label: "SLOW", speed: 35 },
                            { label: "NORMAL", speed: 20 },
                            { label: "FAST", speed: 12 },
                            { label: "TURBO", speed: 6 },
                          ].map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, animationSpeed: s.speed }))}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${(marqueeConfig.animationSpeed || 20) === s.speed
                                  ? "bg-white text-black"
                                  : "text-neutral-400 hover:text-white"
                                }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Direction Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setMarqueeConfig((prev) => ({
                          ...prev,
                          animationDirection: prev.animationDirection === "reverse" ? "normal" : "reverse",
                        }))
                      }
                      className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-[10px] rounded flex items-center gap-1 cursor-pointer transition-all"
                      title="Toggle Ticker Scroll Direction"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">
                        {marqueeConfig.animationDirection === "reverse" ? "REVERSE" : "NORMAL"}
                      </span>
                    </button>

                    {/* Model Scale Nudge */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded gap-1 text-[10px]">
                      <span className="text-neutral-400 hidden sm:inline">Scale:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMarqueeConfig((prev) => ({
                            ...prev,
                            cardImageScale: Math.max(50, (prev.cardImageScale || 100) - 5),
                          }))
                        }
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Decrease Model Size"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-emerald-400">
                        {marqueeConfig.cardImageScale || 100}%
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMarqueeConfig((prev) => ({
                            ...prev,
                            cardImageScale: Math.min(160, (prev.cardImageScale || 100) + 5),
                          }))
                        }
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Increase Model Size"
                      >
                        +
                      </button>
                    </div>

                    {/* Model Pos Y Nudge */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded gap-1 text-[10px]">
                      <span className="text-neutral-400 hidden sm:inline">Y:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMarqueeConfig((prev) => ({
                            ...prev,
                            cardImageOffsetY: (prev.cardImageOffsetY || -120) - 10,
                          }))
                        }
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Move Model Down"
                      >
                        ↓
                      </button>
                      <span className="w-10 text-center font-bold text-emerald-400">
                        {marqueeConfig.cardImageOffsetY || -120}px
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMarqueeConfig((prev) => ({
                            ...prev,
                            cardImageOffsetY: (prev.cardImageOffsetY || -120) + 10,
                          }))
                        }
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer font-bold"
                        title="Move Model Up"
                      >
                        ↑
                      </button>
                    </div>

                    {/* Quick Image Upload Trigger */}
                    <label className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-[10px] uppercase rounded cursor-pointer flex items-center gap-1 transition-all">
                      {isUploadingMarqueeImage ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" />
                      ) : (
                        <Upload className="w-3 h-3 text-neutral-400" />
                      )}
                      <span className="hidden md:inline">
                        {isUploadingMarqueeImage ? "Uploading..." : "Upload Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMarqueeImageUpload}
                        disabled={isUploadingMarqueeImage}
                      />
                    </label>

                    {/* Quick Save Live Button */}
                    <button
                      type="button"
                      onClick={handleSaveMarqueeConfig}
                      disabled={isSavingMarquee}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] uppercase tracking-widest rounded flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all ml-1"
                      title="Save and publish live to storefront"
                    >
                      {isSavingMarquee ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>SAVE LIVE</span>
                    </button>
                  </div>
                </div>

                {/* 1:1 Shared MarqueeBanner Component with Live Kinetic Keyframe or ScrollTrigger Animation */}
                <div className="relative w-full overflow-hidden">
                  <MarqueeBanner
                    config={marqueeConfig}
                    isEditable={true}
                    onUpdate={(patch: any) => setMarqueeConfig((prev: any) => ({ ...prev, ...patch }))}
                    onImageUpload={handleMarqueeImageUpload}
                    className="marquee-banner-admin-preview select-text"
                    animateOnScroll={marqueeMotionMode === "scroll"}
                    motionMode={marqueeMotionMode}
                    scrollProgress={marqueeScrollProgress}
                    onScrollProgressChange={(r: number) => setMarqueeScrollProgress(parseFloat(r.toFixed(2)))}
                    triggerKey={marqueeTriggerKey}
                    animationPlaying={marqueeAnimPlaying}
                    animationSpeed={marqueeConfig.animationSpeed || 20}
                    animationDirection={marqueeConfig.animationDirection || "normal"}
                  />
                  {/* Floating Depth Architecture Indicator */}
                  <div className="absolute bottom-2.5 left-3 z-30 bg-black/80 backdrop-blur-md text-neutral-200 px-3 py-1 text-[9px] font-mono tracking-widest uppercase border border-neutral-700 flex items-center gap-2 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>3-LAYER DEPTH ARCHITECTURE: [1. BG TICKERS] → [2. CUTOUT MODEL] → [3. BRAND LOGO] • {marqueeMotionMode === "scroll" ? "SCROLL-TRIGGERED SCRUB" : "CONTINUOUS KINETIC"}</span>
                  </div>
                </div>

              </div>

              {/* 3. STUDIO CONTROL CONSOLE WITH ORGANIZED TABS */}
              <div className="space-y-4">
                {/* Control Tabs Navigation */}
                <div className="bg-white border border-neutral-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm font-mono text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { id: "typography", label: "1. TYPOGRAPHY & TICKER MOTION", icon: Edit3 },
                      { id: "card", label: "2. CENTER CARD & PALETTE", icon: Palette },
                      { id: "model", label: "3. MODEL 3D PLACEMENT & CDN", icon: Camera },
                      { id: "presets", label: "4. EDITORIAL PRESETS & ACTIONS", icon: Sliders },
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      const isActive = marqueeControlTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMarqueeControlTab(tab.id as any)}
                          className={`px-3 py-2 flex items-center gap-2 font-bold tracking-wider uppercase transition-all cursor-pointer ${isActive
                              ? "bg-black text-white shadow-sm"
                              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-black"
                            }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-500">Storefront Section:</span>
                      <input
                        type="checkbox"
                        checked={marqueeConfig.isEnabled !== false}
                        onChange={(e) => setMarqueeConfig({ ...marqueeConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-black cursor-pointer"
                      />
                      <span className={marqueeConfig.isEnabled !== false ? "text-emerald-600 font-bold" : "text-neutral-400 font-bold"}>
                        {marqueeConfig.isEnabled !== false ? "ENABLED" : "MUTED"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* TAB 1: TYPOGRAPHY & TICKER MOTION */}
                {marqueeControlTab === "typography" && (
                  <div className="p-6 bg-white border border-neutral-200 space-y-6 font-mono text-xs shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        <span>KINETIC TICKERS & HEADLINE CONFIGURATION</span>
                      </h3>
                      <span className="text-neutral-500 text-[10px]">Scroll-Triggered Scrub & Continuous Engine</span>
                    </div>

                    {/* Motion Architecture & Scroll-Trigger Selector */}
                    <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-black uppercase tracking-wider flex items-center gap-1.5 text-xs">
                          <span>MOTION TRIGGER ARCHITECTURE</span>
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Current Mode: <strong className="text-black uppercase">{marqueeMotionMode === "scroll" ? "Scroll-Triggered Scrub" : "Continuous Auto-Ticker"}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setMarqueeMotionMode("scroll")}
                          className={`p-3 border text-left cursor-pointer transition-all ${marqueeMotionMode === "scroll"
                              ? "border-black bg-white shadow-xs"
                              : "border-neutral-200 bg-neutral-100/60 hover:bg-neutral-100 text-neutral-600"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-black">📜 SCROLL-TRIGGERED (SCRUB ON SCROLL)</span>
                            {marqueeMotionMode === "scroll" && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                            Text scrubs dynamically as you scroll the page (Top moves left, Bottom moves right). Center headline, tag & brand logo trigger entrance animations on scroll.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMarqueeMotionMode("continuous")}
                          className={`p-3 border text-left cursor-pointer transition-all ${marqueeMotionMode === "continuous"
                              ? "border-black bg-white shadow-xs"
                              : "border-neutral-200 bg-neutral-100/60 hover:bg-neutral-100 text-neutral-600"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-black">▶ CONTINUOUS AUTO-TICKER (KINETIC LOOP)</span>
                            {marqueeMotionMode === "continuous" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                            Tickers continuously loop at the configured speed (Turbo to Slow) without waiting for scroll.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Top Marquee */}
                      <div className="space-y-2">
                        <label className="block text-neutral-700 font-bold">1. Background Top Marquee Ticker (Moves Left):</label>
                        <input
                          type="text"
                          value={marqueeConfig.marqueeHeader1}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, marqueeHeader1: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none"
                          placeholder="Transmission lost in neutral space"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-neutral-400 mr-1">Quick:</span>
                          {[
                            "TRANSMISSION LOST IN NEUTRAL SPACE",
                            "NEURAL RUNWAY TRANSMISSION // SYSTEM ZERO",
                            "SHIBUYA UNDERGROUND MONOCHROME SIGNAL",
                            "UNBLEACHED ORGANIC FIBERS // 480 GSM",
                          ].map((phrase) => (
                            <button
                              key={phrase}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, marqueeHeader1: phrase }))}
                              className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[9px] border border-neutral-200 cursor-pointer"
                            >
                              {phrase.slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Marquee */}
                      <div className="space-y-2">
                        <label className="block text-neutral-700 font-bold">2. Background Bottom Marquee Ticker (Moves Right):</label>
                        <input
                          type="text"
                          value={marqueeConfig.marqueeHeader2}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, marqueeHeader2: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none"
                          placeholder="Synthetic forms archive the signal"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-neutral-400 mr-1">Quick:</span>
                          {[
                            "SYNTHETIC FORMS ARCHIVE THE SIGNAL",
                            "QUANTUM ARCHIVE MATRIX // ACTIVE DISPATCH",
                            "SYNTHETIC DRAPING // ATELIER BATCH",
                            "TACTILE TEXTURE // STRUCTURE OVER NOISE",
                          ].map((phrase) => (
                            <button
                              key={phrase}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, marqueeHeader2: phrase }))}
                              className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[9px] border border-neutral-200 cursor-pointer"
                            >
                              {phrase.slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Kinetic Animation Velocity & Direction Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-200">
                      {/* Speed Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-neutral-700 font-bold">Kinetic Cycle Speed:</label>
                          <span className="font-bold text-black">{marqueeConfig.animationSpeed || 20}s (Full Cycle)</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={marqueeConfig.animationSpeed || 20}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, animationSpeed: Number(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                          <span>5s (Turbo)</span>
                          <span>20s (Default)</span>
                          <span>50s (Slow)</span>
                        </div>
                      </div>

                      {/* Direction Flow */}
                      <div>
                        <label className="block text-neutral-700 mb-1.5 font-bold">Ticker Flow Direction:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMarqueeConfig((prev) => ({ ...prev, animationDirection: "normal" }))}
                            className={`p-2 border text-center font-bold text-xs cursor-pointer transition-all ${(marqueeConfig.animationDirection || "normal") === "normal"
                                ? "border-black bg-black text-white"
                                : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                              }`}
                          >
                            ⇄ COUNTER-FLOW
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarqueeConfig((prev) => ({ ...prev, animationDirection: "reverse" }))}
                            className={`p-2 border text-center font-bold text-xs cursor-pointer transition-all ${marqueeConfig.animationDirection === "reverse"
                                ? "border-black bg-black text-white"
                                : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                              }`}
                          >
                            ⇆ REVERSE-FLOW
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Normal: Top banner flows left, Bottom banner flows right.</p>
                      </div>

                      {/* Ticker Text Color Presets */}
                      <div>
                        <label className="block text-neutral-700 mb-1.5 font-bold">Ticker Typography Hue:</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { label: "Concrete", color: "#c4c8bf" },
                            { label: "Slate", color: "#9ca3af" },
                            { label: "Noir", color: "#111111" },
                            { label: "Neon Lime", color: "#84cc16" },
                            { label: "Crimson", color: "#ef4444" },
                          ].map((hue) => (
                            <button
                              key={hue.color}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, textColor: hue.color }))}
                              className={`px-2.5 py-1 text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${(marqueeConfig.textColor || "#c4c8bf") === hue.color
                                  ? "border-black bg-neutral-100 font-bold"
                                  : "border-neutral-200 bg-white hover:border-neutral-400"
                                }`}
                            >
                              <span className="w-3 h-3 rounded-none border border-neutral-400" style={{ backgroundColor: hue.color }} />
                              <span>{hue.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CENTER CARD & PALETTE */}
                {marqueeControlTab === "card" && (
                  <div className="p-6 bg-white border border-neutral-200 space-y-6 font-mono text-xs shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <span>CENTER CARD COPY, LOGO & COLOR PALETTES</span>
                      </h3>
                      <span className="text-neutral-500 text-[10px]">Brutalist Atelier visual hierarchy</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-neutral-700 mb-1.5 font-bold">1. Center Card Top Tag:</label>
                        <input
                          type="text"
                          value={marqueeConfig.tag}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, tag: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none"
                          placeholder="[ Frame Shift ]"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1.5 font-bold">2. Center Card Brand Logo:</label>
                        <input
                          type="text"
                          value={marqueeConfig.brandLogoText}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, brandLogoText: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none"
                          placeholder="DRAPZA"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Renders in foreground layer directly above model jacket.</p>
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1.5 font-bold">3. Giant Card Headline:</label>
                        <input
                          type="text"
                          value={marqueeConfig.headline}
                          onChange={(e) => setMarqueeConfig({ ...marqueeConfig, headline: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none uppercase"
                          placeholder="Modular silence across systems"
                        />
                      </div>
                    </div>

                    {/* Background Palette Customizer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
                      <div>
                        <label className="block text-neutral-700 mb-2 font-bold">Card Background Color:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Noir Onyx", color: "#0f0f0f" },
                            { label: "Dark Slate", color: "#1e222a" },
                            { label: "Deep Concrete", color: "#26292b" },
                            { label: "Chalk Off-White", color: "#f5f5f1" },
                          ].map((theme) => (
                            <button
                              key={theme.color}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, cardBackgroundColor: theme.color }))}
                              className={`p-2.5 border text-left flex items-center gap-2 cursor-pointer transition-all ${(marqueeConfig.cardBackgroundColor || "#0f0f0f") === theme.color
                                  ? "border-black bg-neutral-100 font-bold"
                                  : "border-neutral-200 bg-white hover:border-neutral-400"
                                }`}
                            >
                              <span className="w-4 h-4 rounded-none border border-neutral-400 shrink-0" style={{ backgroundColor: theme.color }} />
                              <span className="text-[11px]">{theme.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-2 font-bold">Outer Section Canvas Background:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Soft Atelier (#edf1e8)", color: "#edf1e8" },
                            { label: "Pure White (#ffffff)", color: "#ffffff" },
                            { label: "Stealth Black (#0a0a0a)", color: "#0a0a0a" },
                            { label: "Desert Sand (#e9e4d9)", color: "#e9e4d9" },
                          ].map((theme) => (
                            <button
                              key={theme.color}
                              type="button"
                              onClick={() => setMarqueeConfig((prev) => ({ ...prev, backgroundColor: theme.color }))}
                              className={`p-2.5 border text-left flex items-center gap-2 cursor-pointer transition-all ${(marqueeConfig.backgroundColor || "#edf1e8") === theme.color
                                  ? "border-black bg-neutral-100 font-bold"
                                  : "border-neutral-200 bg-white hover:border-neutral-400"
                                }`}
                            >
                              <span className="w-4 h-4 rounded-none border border-neutral-400 shrink-0" style={{ backgroundColor: theme.color }} />
                              <span className="text-[11px]">{theme.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MODEL 3D PLACEMENT & CDN */}
                {marqueeControlTab === "model" && (
                  <div className="p-6 bg-white border border-neutral-200 space-y-6 font-mono text-xs shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        <span>MODEL CUTOUT ASSET & 3D SPATIAL CALIBRATION</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setMarqueeConfig((prev) => ({
                            ...prev,
                            cardImageScale: 100,
                            cardImageOffsetY: -120,
                            cardImageOffsetX: 0,
                          }))
                        }
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-[10px] font-bold cursor-pointer"
                      >
                        Reset Spatial Alignment (100% / -120px / 0px)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Asset Source & Cloudinary */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-neutral-700 mb-1.5 font-bold">Model Image Asset URL:</label>
                          <input
                            type="text"
                            value={marqueeConfig.cardImage}
                            onChange={(e) => setMarqueeConfig({ ...marqueeConfig, cardImage: e.target.value })}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-black font-mono text-xs focus:border-black focus:outline-none"
                            placeholder="/marquee-banner/marquee_banner_01.png"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-700 mb-1.5 font-bold">Direct Upload to Cloudinary CDN:</label>
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-3.5 border-2 border-dashed border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100 transition-all cursor-pointer text-center">
                            {isUploadingMarqueeImage ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-neutral-600" />
                            ) : (
                              <Upload className="w-4 h-4 text-neutral-600" />
                            )}
                            <span className="font-bold text-neutral-700">
                              {isUploadingMarqueeImage ? "UPLOADING TO CDN..." : "CHOOSE CUTOUT IMAGE FILE"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleMarqueeImageUpload}
                              disabled={isUploadingMarqueeImage}
                            />
                          </label>
                        </div>

                        {/* Preset Cutout Assets */}
                        <div>
                          <label className="block text-neutral-700 mb-1.5 font-bold">Quick Select Curated Silhouette Assets:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Original Model Cutout", path: "/marquee-banner/marquee_banner_01.png" },
                              { label: "Oversized Streetwear", path: "/images/drapza/marquee-banner/man_cutout.png" },
                              { label: "Peel Reveal Cutout", path: "/images/drapza/peel-reveal/peel-reveal-cutout.png" },
                              { label: "Hero Silhouette", path: "/images/drapza/home/hero.png" },
                            ].map((asset) => (
                              <button
                                key={asset.path}
                                type="button"
                                onClick={() => setMarqueeConfig((prev) => ({ ...prev, cardImage: asset.path }))}
                                className={`p-2 border text-left flex items-center gap-2 cursor-pointer transition-all ${marqueeConfig.cardImage === asset.path
                                    ? "border-black bg-neutral-100 font-bold shadow-xs"
                                    : "border-neutral-200 hover:border-neutral-400 bg-white"
                                  }`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${marqueeConfig.cardImage === asset.path ? "bg-emerald-500" : "bg-neutral-300"}`} />
                                <span className="text-[10px] truncate">{asset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3D Sliders */}
                      <div className="space-y-5 bg-neutral-50 p-4 border border-neutral-200">
                        <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-neutral-200 pb-2">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>3D SPATIAL POSITIONING & SCALING</span>
                        </h4>

                        {/* Model Scale Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-neutral-700 font-bold">Model Scale Factor:</label>
                            <span className="text-black font-bold bg-white px-2 py-0.5 border border-neutral-300">{marqueeConfig.cardImageScale || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="160"
                            step="1"
                            value={marqueeConfig.cardImageScale || 100}
                            onChange={(e) => setMarqueeConfig({ ...marqueeConfig, cardImageScale: Number(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>50% (Compact)</span>
                            <span>100% (Default)</span>
                            <span>160% (Hero)</span>
                          </div>
                        </div>

                        {/* Vertical Offset Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-neutral-700 font-bold">Vertical Bottom Offset (Y):</label>
                            <span className="text-black font-bold bg-white px-2 py-0.5 border border-neutral-300">{marqueeConfig.cardImageOffsetY || -120}px</span>
                          </div>
                          <input
                            type="range"
                            min="-250"
                            max="50"
                            step="5"
                            value={marqueeConfig.cardImageOffsetY || -120}
                            onChange={(e) => setMarqueeConfig({ ...marqueeConfig, cardImageOffsetY: Number(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>-250px (Down)</span>
                            <span>-120px (Default)</span>
                            <span>+50px (Up)</span>
                          </div>
                        </div>

                        {/* Horizontal Offset Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-neutral-700 font-bold">Horizontal Centering Offset (X):</label>
                            <span className="text-black font-bold bg-white px-2 py-0.5 border border-neutral-300">{marqueeConfig.cardImageOffsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="5"
                            value={marqueeConfig.cardImageOffsetX || 0}
                            onChange={(e) => setMarqueeConfig({ ...marqueeConfig, cardImageOffsetX: Number(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                            <span>-100px (Left)</span>
                            <span>0px (Centered)</span>
                            <span>+100px (Right)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: EDITORIAL PRESETS & ACTIONS */}
                {marqueeControlTab === "presets" && (
                  <div className="p-6 bg-white border border-neutral-200 space-y-6 font-mono text-xs shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <span>1-CLICK EDITORIAL AESTHETIC CONFIGURATIONS</span>
                      </h3>
                      <span className="text-neutral-500 text-[10px]">Instant typography + motion + spatial calibration</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: "DEFAULT ATELIER",
                          description: "Classic Drapza muted architectural silhouette with 20s counter-flow ticker.",
                          data: {
                            marqueeHeader1: "Transmission lost in neutral space",
                            marqueeHeader2: "Synthetic forms archive the signal",
                            tag: "[ Frame Shift ]",
                            headline: "Modular silence across systems",
                            brandLogoText: "DRAPZA",
                            cardImage: "/marquee-banner/marquee_banner_01.png",
                            cardImageScale: 100,
                            cardImageOffsetY: -120,
                            cardImageOffsetX: 0,
                            animationSpeed: 20,
                            animationDirection: "normal",
                            cardBackgroundColor: "#0f0f0f",
                            backgroundColor: "#edf1e8",
                            textColor: "#c4c8bf",
                          },
                        },
                        {
                          title: "CYBER MONOLITH",
                          description: "High-speed 12s cyber dispatch with bold uppercase neon-tinted tickers.",
                          data: {
                            marqueeHeader1: "NEURAL RUNWAY TRANSMISSION // SYSTEM ZERO",
                            marqueeHeader2: "QUANTUM ARCHIVE MATRIX // ACTIVE DISPATCH",
                            tag: "[ CYBER SHIFT ]",
                            headline: "ENGINEERED OBSCURITY // ARCHIVE 01",
                            brandLogoText: "DRAPZA LABS",
                            cardImage: "/marquee-banner/marquee_banner_01.png",
                            cardImageScale: 108,
                            cardImageOffsetY: -110,
                            cardImageOffsetX: 0,
                            animationSpeed: 12,
                            animationDirection: "normal",
                            cardBackgroundColor: "#0b0e14",
                            backgroundColor: "#edf1e8",
                            textColor: "#84cc16",
                          },
                        },
                        {
                          title: "TOKYO UNDERGROUND",
                          description: "Raw Shibuya streetwear aesthetic with oversized model framing and 16s velocity.",
                          data: {
                            marqueeHeader1: "SHIBUYA UNDERGROUND MONOCHROME SIGNAL",
                            marqueeHeader2: "SYNTHETIC DRAPING // ATELIER BATCH",
                            tag: "[ SS26 DROP ]",
                            headline: "RAW SILHOUETTES ACROSS METROPOLIS",
                            brandLogoText: "DRAPZA TOKYO",
                            cardImage: "/images/drapza/marquee-banner/man_cutout.png",
                            cardImageScale: 112,
                            cardImageOffsetY: -130,
                            cardImageOffsetX: 0,
                            animationSpeed: 16,
                            animationDirection: "reverse",
                            cardBackgroundColor: "#16181d",
                            backgroundColor: "#edf1e8",
                            textColor: "#c4c8bf",
                          },
                        },
                        {
                          title: "HEAVYWEIGHT 480 GSM",
                          description: "Tactile heritage 25s slow ticker celebrating unbleached dense organic cotton.",
                          data: {
                            marqueeHeader1: "UNBLEACHED ORGANIC FIBERS // 480 GSM HEAVYWEIGHT",
                            marqueeHeader2: "TACTILE TEXTURE // STRUCTURE OVER NOISE",
                            tag: "[ HERITAGE 480 GSM ]",
                            headline: "SUBSTANCE OVER SPECTACLE",
                            brandLogoText: "DRAPZA",
                            cardImage: "/marquee-banner/marquee_banner_01.png",
                            cardImageScale: 96,
                            cardImageOffsetY: -120,
                            cardImageOffsetX: 0,
                            animationSpeed: 25,
                            animationDirection: "normal",
                            cardBackgroundColor: "#1a1a1a",
                            backgroundColor: "#edf1e8",
                            textColor: "#c4c8bf",
                          },
                        },
                        {
                          title: "MINIMALIST INVERTED",
                          description: "Relaxed 30s slow movement with chalk tones and understated modern luxury.",
                          data: {
                            marqueeHeader1: "SILENCE SPEAKS LOUDER THAN FREQUENCY",
                            marqueeHeader2: "REDUCTION AS THE ULTIMATE FORM OF DESIGN",
                            tag: "[ ZERO POINT ]",
                            headline: "PURE FORM ARCHITECTURE",
                            brandLogoText: "DRAPZA ATELIER",
                            cardImage: "/images/drapza/peel-reveal/peel-reveal-cutout.png",
                            cardImageScale: 104,
                            cardImageOffsetY: -115,
                            cardImageOffsetX: 0,
                            animationSpeed: 30,
                            animationDirection: "normal",
                            cardBackgroundColor: "#121212",
                            backgroundColor: "#f5f5f1",
                            textColor: "#9ca3af",
                          },
                        },
                        {
                          title: "TACTICAL STEALTH",
                          description: "Turbo 8s inverted reverse-flow ticker with pitch-black brutalist architecture.",
                          data: {
                            marqueeHeader1: "TACTICAL ATELIER SPECIFICATION // LOW-OBSERVABLE PROFILE",
                            marqueeHeader2: "COORDINATES REDACTED // FORWARD DEPLOYED DISPATCH",
                            tag: "[ RECON UNIT ]",
                            headline: "VELOCITY THROUGH PRECISION",
                            brandLogoText: "DRAPZA SPEC",
                            cardImage: "/images/drapza/home/hero.png",
                            cardImageScale: 110,
                            cardImageOffsetY: -125,
                            cardImageOffsetX: 0,
                            animationSpeed: 8,
                            animationDirection: "reverse",
                            cardBackgroundColor: "#0a0a0a",
                            backgroundColor: "#080808",
                            textColor: "#ef4444",
                          },
                        },
                      ].map((preset) => (
                        <div
                          key={preset.title}
                          className="p-4 border border-neutral-200 bg-neutral-50 flex flex-col justify-between space-y-3 hover:border-black transition-all"
                        >
                          <div>
                            <span className="font-bold text-black text-xs block">{preset.title}</span>
                            <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">{preset.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMarqueeConfig((prev: any) => ({ ...prev, ...preset.data }));
                              setMarqueeSaveStatus(`✓ Preset "${preset.title}" applied! Click 'Publish' to sync live.`);
                              setTimeout(() => setMarqueeSaveStatus(null), 4000);
                            }}
                            className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all"
                          >
                            LOAD PRESET
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Global Actions Bar */}
                    <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleResetMarqueeConfig}
                          disabled={isResettingMarquee}
                          className="px-4 py-2.5 border border-neutral-300 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                        >
                          {isResettingMarquee ? "RESETTING..." : "RESET TO FACTORY DEFAULTS"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveMarqueeConfig}
                        disabled={isSavingMarquee}
                        className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSavingMarquee ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                        <span>PUBLISH LIVE TO STOREFRONT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: FLASH PROMOTION & SALE COUNTDOWN CMS STUDIO */}
          {/* ========================================================================= */}
          {activeTab === "countdown" && (() => {
            const targetTime = countdownConfig.targetEndDate ? new Date(countdownConfig.targetEndDate).getTime() : Date.now() + 86400000;
            const diff = Math.max(0, targetTime - Date.now());
            const dDays = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0");
            const dHours = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0");
            const dMins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
            const dSecs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");

            return (
              <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
                {/* 1. TOP HEADER & STATUS BAR */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                        FLASH PROMOTION & DROP TIMERS
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                      <Timer className="w-5 h-5 text-black" />
                      <span>FLASH PROMOTION CMS STUDIO</span>
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Configure live ticking drop countdowns, promotional flash coupon codes, stock scarcity progress meters, and expiration timestamps.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetCountdownConfig}
                      disabled={isResettingCountdown}
                      className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isResettingCountdown ? "Resetting..." : "Reset Defaults"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCountdownConfig}
                      disabled={isSavingCountdown}
                      className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingCountdown ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>SAVE & PUBLISH FLASH PROMO</span>
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {countdownSaveStatus && (
                  <div
                    className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${countdownSaveStatus.startsWith("✓")
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 border-neutral-300 text-black"
                      }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>{countdownSaveStatus}</span>
                  </div>
                )}

                {/* 2. 1-CLICK CURATED FLASH SALE PRESETS */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <span>1-CLICK PROMOTIONAL FLASH SALE PRESETS</span>
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-500">[ INSTANT CAMPAIGN PRESETS ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Summer Premium Sale 40% (Screenshot Default)",
                        badge: "SUMMER PREMIUM SALE",
                        h1: "Flat 40% Off +",
                        h2: "Free Shipping",
                        season: "AUTUMN SEASON",
                        handle: "FOLLOW US: @DRAPZACLOTH",
                        brand: "DRAPZA LUXURY",
                        desc: "Get additional discount benefits by stacking multiple luxury custom fits. Perfect opportunity to replenish your boutique wardrobe with trending 2026 drapza designs.",
                        circle: "FIND YOUR COLOR • FIND YOUR COLOR • ",
                        cta: "EXPLORE SALE ITEMS",
                        img: "/images/drapza/products/product_1.png",
                        hours: 72,
                      },
                      {
                        name: "Royal Festive Silk Couture 35%",
                        badge: "FESTIVE COUTURE DROP",
                        h1: "Flat 35% Off +",
                        h2: "Express Delivery",
                        season: "FESTIVE ATELIER",
                        handle: "FOLLOW US: @DRAPZACLOTH",
                        brand: "ROYAL SILK VAULT",
                        desc: "Pure Kanjivaram zari weaves and organza handcrafted dupattas at exclusive drop privileges.",
                        circle: "ROYAL SILK • FESTIVE WEAVES • ",
                        cta: "SHOP FESTIVE ARCHIVE",
                        img: "/images/drapza/products/product_18.png",
                        hours: 48,
                      },
                      {
                        name: "Midnight Archive Clearance 50%",
                        badge: "SECRET VAULT CLEARANCE",
                        h1: "Flat 50% Off +",
                        h2: "Complimentary Gift",
                        season: "LIMITED RUN 2026",
                        handle: "FOLLOW US: @DRAPZACLOTH",
                        brand: "UNCOMPROMISED ARCHIVE",
                        desc: "Exclusive tier access to archived silhouettes and limited runs before full seasonal discontinuation.",
                        circle: "VAULT ACCESS • LIMITED RUN • ",
                        cta: "CLAIM 50% OFF FIT",
                        img: "/images/drapza/products/product_12.png",
                        hours: 24,
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const target = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
                          setCountdownConfig({
                            ...countdownConfig,
                            badgeText: preset.badge,
                            headlineLine1: preset.h1,
                            headlineLine2: preset.h2,
                            seasonTag: preset.season,
                            socialHandle: preset.handle,
                            brandTag: preset.brand,
                            description: preset.desc,
                            circularBadgeText: preset.circle,
                            ctaText: preset.cta,
                            modelImage: preset.img,
                            targetEndDate: target.toISOString().slice(0, 16),
                          });
                          setCountdownSaveStatus(`✓ Preset "${preset.name}" applied! Click 'Publish' to sync.`);
                          setTimeout(() => setCountdownSaveStatus(null), 4000);
                        }}
                        className="p-3.5 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-black text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-black uppercase font-mono truncate">
                            {preset.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-serif mt-1 line-clamp-1">
                          {preset.h1} {preset.h2} // {preset.hours}h duration
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 1:1 LIVE INTERACTIVE VISUAL PREVIEW (EXACT SCREENSHOT REPLICA) */}
                <div className="p-6 rounded-none bg-neutral-50 border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                        1:1 LIVE FRONTEND TICKET VOUCHER PREVIEW
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">[ REAL-TIME TICKER & DESIGN ]</span>
                  </div>

                  {/* Simulated Exact Screenshot Ticket Voucher Banner - Monochrome B&W Edition */}
                  <div className="rounded-none overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-neutral-200 bg-black relative select-none">

                    {/* Left Half: Monochrome Photo + Serif Typography */}
                    <div className="relative lg:w-[58%] min-h-[380px] sm:min-h-[440px] flex flex-col justify-between p-6 sm:p-8 overflow-hidden bg-black">
                      <div className="absolute inset-0 w-full h-full flex items-center justify-end md:justify-center overflow-hidden bg-black">
                        <img
                          src={normalizeImageUrl(countdownConfig.modelImage || "/images/drapza/products/product_1.png")}
                          alt="Sale Banner"
                          onError={handleImageFallbackError}
                          className={`w-full h-full filter contrast-[1.08] brightness-[0.95] ${countdownConfig.imageFit === "cover"
                            ? "object-cover object-center"
                            : countdownConfig.imageFit === "top"
                              ? "object-cover object-top"
                              : "object-contain object-right md:object-center"
                            }`}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Rotating Circular Text Badge */}
                      <div className="relative z-10 flex items-start justify-end">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                          <svg
                            className="w-full h-full animate-spin text-white opacity-90"
                            style={{ animationDuration: "14s" }}
                            viewBox="0 0 100 100"
                          >
                            <path
                              id="circlePathAdmin"
                              d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                              fill="none"
                            />
                            <text className="text-[9.5px] font-mono tracking-[0.22em] uppercase fill-white font-semibold">
                              <textPath href="#circlePathAdmin" startOffset="0%">
                                {countdownConfig.circularBadgeText || "FIND YOUR FIT • MONOCHROME DROP • "}
                              </textPath>
                            </text>
                          </svg>
                          <div className="absolute w-1.5 h-1.5 rounded-none bg-white" />
                        </div>
                      </div>

                      {/* Bottom Typography */}
                      <div className="relative z-10 space-y-2.5 pt-8">
                        <div>
                          <span className="px-3.5 py-1 rounded-none border border-white/40 bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold tracking-[0.2em] text-white uppercase">
                            {countdownConfig.badgeText || "SUMMER PREMIUM SALE"}
                          </span>
                        </div>

                        <h3 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[0.92] text-white uppercase tracking-tight">
                          <span className="block">{countdownConfig.headlineLine1 || "Flat 40% Off +"}</span>
                          <span className="block text-neutral-200">{countdownConfig.headlineLine2 || "Free Shipping"}</span>
                        </h3>

                        <div className="pt-0.5">
                          <span className="font-mono-technical text-xs uppercase tracking-[0.3em] text-neutral-300 font-bold">
                            {countdownConfig.seasonTag || "AUTUMN SEASON • MONOCHROME"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Half: Pure White Noir Ticket Card */}
                    <div className="lg:w-[42%] bg-white text-black p-6 sm:p-8 flex flex-col justify-between items-center text-center relative">
                      {/* CONTINUOUS SCALLOPED WAVY TICKET EDGE */}
                      <svg
                        className="hidden lg:block absolute top-0 bottom-0 -left-[14px] w-[14px] h-full pointer-events-none z-20"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <pattern id="scallop-edge-admin-pattern" width="14" height="24" patternUnits="userSpaceOnUse">
                            <path
                              d="M 14,0 C 4,0 0,5 0,12 C 0,19 4,24 14,24 Z"
                              fill="#ffffff"
                            />
                          </pattern>
                        </defs>
                        <rect x="0" y="0" width="14" height="100%" fill="url(#scallop-edge-admin-pattern)" />
                      </svg>

                      {/* Top Handle */}
                      <span className="font-mono-technical text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-bold block">
                        {countdownConfig.socialHandle || "FOLLOW US: @DRAPZACLOTH"}
                      </span>

                      {/* Center Brand & Text */}
                      <div className="my-auto py-4 space-y-4 max-w-sm mx-auto">
                        <div className="flex items-center justify-center gap-2 w-full">
                          <div className="h-[1px] flex-1 bg-black/20" />
                          <div className="px-3 py-1 rounded-none border border-black/30 bg-neutral-100 text-[11px] font-display tracking-[0.18em] text-black font-bold flex items-center gap-1 uppercase shadow-sm">
                            <Compass className="w-2.5 h-2.5 text-black" />
                            <span>{countdownConfig.brandTag || "DRAPZA ATELIER NOIR"}</span>
                            <Compass className="w-2.5 h-2.5 text-black" />
                          </div>
                          <div className="h-[1px] flex-1 bg-black/20" />
                        </div>

                        <p className="text-xs text-neutral-700 leading-relaxed font-body font-medium">
                          {countdownConfig.description}
                        </p>

                        <div className="pt-1">
                          <div className="rounded-none bg-black text-white px-6 py-2.5 font-mono-technical text-xs font-bold uppercase tracking-wider shadow-lg inline-flex items-center gap-1.5">
                            <span>{countdownConfig.ctaText || "EXPLORE SALE ITEMS"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Offer Expiration Tiles */}
                      <div className="w-full pt-3 border-t border-black/10">
                        <span className="text-[9px] font-mono-technical uppercase tracking-[0.25em] text-neutral-600 font-bold block mb-2">
                          OFFER ENDS SOON
                        </span>

                        <div className="flex items-center justify-center gap-2">
                          {[
                            { label: "DAYS", value: dDays },
                            { label: "HRS", value: dHours },
                            { label: "MINS", value: dMins },
                            { label: "SECS", value: dSecs },
                          ].map((t, ti) => (
                            <div key={ti} className="flex items-center gap-1.5">
                              <div className="flex flex-col items-center">
                                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-none bg-black text-white flex items-center justify-center shadow-md border border-black">
                                  <span className="font-display text-base sm:text-lg font-bold">
                                    {t.value}
                                  </span>
                                </div>
                                <span className="font-mono-technical text-[8px] uppercase tracking-wider text-black font-bold mt-1">
                                  {t.label}
                                </span>
                              </div>
                              {ti < 3 && <span className="text-xs font-bold text-black/50 -mt-4 font-mono-technical">:</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. COUNTDOWN TARGET & DURATION STUDIO */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <Clock className="w-4 h-4 text-black" />
                      <span>TIMER DURATION & EXPIRATION TARGET</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-500">Section Status:</span>
                      <input
                        type="checkbox"
                        checked={countdownConfig.isEnabled !== false}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-black cursor-pointer"
                      />
                      <span className={countdownConfig.isEnabled !== false ? "text-black font-bold" : "text-neutral-400"}>
                        {countdownConfig.isEnabled !== false ? "LIVE ON HOMEPAGE ✓" : "HIDDEN (DISABLED)"}
                      </span>
                    </label>
                  </div>

                  {/* Quick Extenders */}
                  <div>
                    <label className="block text-neutral-700 mb-2 font-bold">1. Quick Duration Presets (Set countdown from right now):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: "+12 Hours", hours: 12 },
                        { label: "+24 Hours (1 Day)", hours: 24 },
                        { label: "+48 Hours (2 Days)", hours: 48 },
                        { label: "+3 Days (72h)", hours: 72 },
                        { label: "+7 Days (1 Week)", hours: 168 },
                      ].map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() => handleSetQuickDuration(btn.hours)}
                          className="p-2.5 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-black text-neutral-800 font-mono text-[11px] uppercase transition-all cursor-pointer font-bold shadow-sm"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">2. Exact Target Expiration Date & Time:</label>
                    <input
                      type="datetime-local"
                      value={countdownConfig.targetEndDate}
                      onChange={(e) => setCountdownConfig({ ...countdownConfig, targetEndDate: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black font-mono text-xs shadow-sm"
                    />
                  </div>
                </div>

                {/* 5. PROMOTIONAL COPY & IMAGE STUDIO */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  {/* Left Column: Left Photo & Headings */}
                  <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <Compass className="w-4 h-4 text-black" />
                        <span>LEFT MODEL PHOTO & HEADLINES</span>
                      </h3>
                    </div>

                    {/* Model Image Upload */}
                    <div className="space-y-2">
                      <label className="block text-neutral-700 font-bold">Model Background Image:</label>
                      <label className="w-full py-2.5 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                        {isUploadingCountdownImage ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[3]" />
                        )}
                        <span>{isUploadingCountdownImage ? "UPLOADING TO CDN..." : "UPLOAD PHOTO TO CLOUDINARY"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCountdownImageUpload}
                          disabled={isUploadingCountdownImage}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        value={countdownConfig.modelImage}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, modelImage: e.target.value })}
                        placeholder="https://res.cloudinary.com/.../model.png"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2 text-black focus:outline-none focus:border-black text-[11px] shadow-sm"
                      />

                      {/* Image Fit Options */}
                      <div className="pt-1">
                        <label className="block text-neutral-700 text-[11px] font-bold mb-1.5">Image Framing / Fit Mode:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "contain", label: "Full Uncropped (Fit)", desc: "Shows entire image" },
                            { id: "cover", label: "Cover (Center Fill)", desc: "Fills whole card" },
                            { id: "top", label: "Top (Head & Face)", desc: "Focuses on top" },
                          ].map((fitOpt) => (
                            <button
                              key={fitOpt.id}
                              type="button"
                              onClick={() => setCountdownConfig({ ...countdownConfig, imageFit: fitOpt.id })}
                              className={`p-2 rounded-none border text-center font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${(countdownConfig.imageFit || "contain") === fitOpt.id
                                ? "bg-black text-white border-black shadow-sm font-bold"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:text-black hover:bg-neutral-100"
                                }`}
                            >
                              <div>{fitOpt.label}</div>
                              <div className="text-[8px] opacity-70 font-normal">{fitOpt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Pill Badge Text:</label>
                      <input
                        type="text"
                        value={countdownConfig.badgeText}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, badgeText: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase shadow-sm"
                        placeholder="SUMMER PREMIUM SALE"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Headline Line 1:</label>
                        <input
                          type="text"
                          value={countdownConfig.headlineLine1}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, headlineLine1: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black font-serif shadow-sm"
                          placeholder="Flat 40% Off +"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Headline Line 2:</label>
                        <input
                          type="text"
                          value={countdownConfig.headlineLine2}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, headlineLine2: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black font-serif italic shadow-sm"
                          placeholder="Free Shipping"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Season Sub-Tag:</label>
                        <input
                          type="text"
                          value={countdownConfig.seasonTag}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, seasonTag: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase shadow-sm"
                          placeholder="AUTUMN SEASON"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Rotating Circle Text:</label>
                        <input
                          type="text"
                          value={countdownConfig.circularBadgeText}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, circularBadgeText: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black shadow-sm"
                          placeholder="FIND YOUR COLOR • FIND YOUR COLOR • "
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Right Ticket Copy & CTAs */}
                  <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                        <Compass className="w-4 h-4 text-black" />
                        <span>RIGHT TICKET COPY & CTA</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Social Handle Header:</label>
                        <input
                          type="text"
                          value={countdownConfig.socialHandle}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, socialHandle: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase shadow-sm"
                          placeholder="FOLLOW US: @DRAPZACLOTH"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Center Brand Tag:</label>
                        <input
                          type="text"
                          value={countdownConfig.brandTag}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, brandTag: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                          placeholder="DRAPZA LUXURY"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Narrative Description:</label>
                      <textarea
                        rows={4}
                        value={countdownConfig.description}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, description: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black font-body text-xs leading-relaxed shadow-sm"
                        placeholder="Get additional discount benefits by stacking multiple luxury custom fits..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">CTA Button Text:</label>
                        <input
                          type="text"
                          value={countdownConfig.ctaText}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, ctaText: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                          placeholder="EXPLORE SALE ITEMS"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">CTA Button Link:</label>
                        <input
                          type="text"
                          value={countdownConfig.ctaLink}
                          onChange={(e) => setCountdownConfig({ ...countdownConfig, ctaLink: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black shadow-sm"
                          placeholder="#products"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. PUBLISH ACTION BAR AT BOTTOM */}
                <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span>Countdown and promotional flash vault changes will sync live to the homepage instantly.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetCountdownConfig}
                      disabled={isResettingCountdown}
                      className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reset Defaults
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCountdownConfig}
                      disabled={isSavingCountdown}
                      className="px-8 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingCountdown ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>PUBLISH FLASH PROMO</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB: SILHOUETTES & FIELD TEST TRI-CARD CMS STUDIO */}
          {/* ========================================================================= */}
          {activeTab === "cta" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto font-mono text-xs">
              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                      HOMEPAGE SILHOUETTES • TRI-CARD FIELD TEST
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                    <Eye className="w-5 h-5 text-black" />
                    <span>SILHOUETTES & FIELD TEST CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans">
                    Direct live controller: configure the tri-card layered composition, editorial manifesto copy, headline typography, and Cloudinary photoshoot images.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetCtaConfig}
                    disabled={isResettingCta}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResettingCta ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCtaConfig}
                    disabled={isSavingCta}
                    className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingCta ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH SILHOUETTES</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {ctaSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${ctaSaveStatus.startsWith("✓")
                    ? "bg-black text-white border-black"
                    : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{ctaSaveStatus}</span>
                </div>
              )}

              {/* 2. 1-CLICK CURATED PRESETS */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                    <Compass className="w-4 h-4 text-black" />
                    <span>1-CLICK SILHOUETTES PRESETS</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">[ INSTANT STYLING PRESETS ]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Field Test in Silhouettes (Default Noir)",
                      h1: "A FIELD TEST",
                      h2: "IN",
                      h3: "SILHOUETTES",
                      editorial: "Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion.",
                      left: "/images/drapza/cta/cta_img_01.jpg",
                      center: "/images/drapza/cta/cta_img_02.jpg",
                      right: "/images/drapza/cta/cta_img_03.jpg",
                      ctaText: "Explore Products",
                      ctaLink: "#products",
                    },
                    {
                      name: "Architectural Heavyweight Uniform (Autumn Drop)",
                      h1: "ARCHITECTURAL",
                      h2: "HEAVYWEIGHT",
                      h3: "UNIFORM",
                      editorial: "High-density\nFrench Terry\nstructures\nengineered for\nlasting drape\nand presence.",
                      left: "/images/drapza/products/product_3.png",
                      center: "/images/drapza/products/product_1.png",
                      right: "/images/drapza/products/product_2.png",
                      ctaText: "Shop Autumn Fits",
                      ctaLink: "#products",
                    },
                    {
                      name: "Zero Friction Tactical Geometry (Shadow Vault)",
                      h1: "ZERO FRICTION",
                      h2: "TACTICAL",
                      h3: "GEOMETRY",
                      editorial: "Modular cut,\ndetached in\npresence.\nA uniform\nfor moving\nthrough static.",
                      left: "/images/drapza/products/product_12.png",
                      center: "/images/drapza/products/product_18.png",
                      right: "/images/drapza/products/product_19.png",
                      ctaText: "View Vault Run",
                      ctaLink: "#products",
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCtaConfig({
                          ...ctaConfig,
                          headingLine1: preset.h1,
                          headingLine2: preset.h2,
                          headingLine3: preset.h3,
                          editorialText: preset.editorial,
                          leftImage: preset.left,
                          centerImage: preset.center,
                          rightImage: preset.right,
                          ctaText: preset.ctaText,
                          ctaLink: preset.ctaLink,
                        });
                        setCtaSaveStatus(`✓ Preset "${preset.name}" applied! Click 'Publish' to sync.`);
                        setTimeout(() => setCtaSaveStatus(null), 4000);
                      }}
                      className="p-3.5 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-black text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black uppercase font-mono truncate">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-sans mt-1 line-clamp-1">
                        {preset.h1} {preset.h2} {preset.h3}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 1:1 LIVE FRONTEND PREVIEW */}
              <div className="p-6 rounded-none bg-neutral-50 border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                      1:1 LIVE FRONTEND SILHOUETTES CANVAS PREVIEW
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">[ REAL-TIME PARALLAX REPLICA ]</span>
                </div>

                {/* 1:1 Shared Modular CtaSection Component in Live Visual Editable Mode */}
                {/* Hidden File Input for Direct 1-Click Card Photo Upload */}
                <input
                  ref={ctaFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCtaImageUpload(pendingCtaSlot, e)}
                />

                {/* Parallax & Visual Motion Cinema HUD */}
                <div className="p-4 rounded-none bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCtaSimLooping(!isCtaSimLooping)}
                      className={`px-3 py-1.5 rounded-none font-mono text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${isCtaSimLooping
                          ? "bg-emerald-500 text-black hover:bg-emerald-400"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                        }`}
                    >
                      <span>{isCtaSimLooping ? "PAUSE PARALLAX LOOP" : "PLAY MOTION LOOP"}</span>
                    </button>
                    <span className="text-[10px] font-mono text-neutral-400">
                      SCRUB ELEVATION DYNAMICS:
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <span className="text-[10px] font-mono text-neutral-500">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={ctaSimProgress}
                      onChange={(e) => {
                        setIsCtaSimLooping(false);
                        setCtaSimProgress(parseFloat(e.target.value));
                      }}
                      className="w-full accent-white h-1.5 bg-neutral-800 rounded-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-white font-bold w-12 text-right">
                      {Math.round(ctaSimProgress * 100)}%
                    </span>
                  </div>
                </div>

                {/* 1:1 Shared Modular CtaSection Component in Live Visual Editable Mode */}
                <CtaSection
                  config={ctaConfig}
                  isEditable={true}
                  onUpdate={(patch: any) => setCtaConfig((prev: any) => ({ ...prev, ...patch }))}
                  onImageUpload={(slot: "left" | "center" | "right") => {
                    setPendingCtaSlot(slot);
                    ctaFileInputRef.current?.click();
                  }}
                  adminProgress={ctaSimProgress}
                  className="cta-admin-preview w-full"
                />
              </div>

              {/* 4. HEADLINE & EDITORIAL MANIFESTO FORM */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Heading Lines & Status */}
                <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-black" />
                      <span>HEADING TYPOGRAPHY & VISIBILITY</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-500">Section Status:</span>
                      <input
                        type="checkbox"
                        checked={ctaConfig.isEnabled !== false}
                        onChange={(e) => setCtaConfig({ ...ctaConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-black cursor-pointer"
                      />
                      <span className={ctaConfig.isEnabled !== false ? "text-black font-bold" : "text-neutral-400"}>
                        {ctaConfig.isEnabled !== false ? "LIVE ON HOMEPAGE ✓" : "HIDDEN (DISABLED)"}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">Headline Line 1 (Large Top):</label>
                    <input
                      type="text"
                      value={ctaConfig.headingLine1}
                      onChange={(e) => setCtaConfig({ ...ctaConfig, headingLine1: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                      placeholder="A FIELD TEST"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Headline Line 2 (Middle):</label>
                      <input
                        type="text"
                        value={ctaConfig.headingLine2}
                        onChange={(e) => setCtaConfig({ ...ctaConfig, headingLine2: e.target.value.toUpperCase() })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                        placeholder="IN"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Headline Line 3 (Bottom):</label>
                      <input
                        type="text"
                        value={ctaConfig.headingLine3}
                        onChange={(e) => setCtaConfig({ ...ctaConfig, headingLine3: e.target.value.toUpperCase() })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                        placeholder="SILHOUETTES"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">CTA Button Text:</label>
                      <input
                        type="text"
                        value={ctaConfig.ctaText}
                        onChange={(e) => setCtaConfig({ ...ctaConfig, ctaText: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold shadow-sm"
                        placeholder="Explore Products"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">CTA Button Target Link:</label>
                      <input
                        type="text"
                        value={ctaConfig.ctaLink}
                        onChange={(e) => setCtaConfig({ ...ctaConfig, ctaLink: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none focus:border-black shadow-sm"
                        placeholder="#products"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Editorial Manifesto Copy */}
                <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-black" />
                      <span>EDITORIAL MANIFESTO NARRATIVE</span>
                    </h3>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">
                      Editorial Note (Positioned at Bottom-Left):
                    </label>
                    <p className="text-[10px] text-neutral-500 mb-2 font-sans">
                      Use separate lines for rhythmic editorial typography.
                    </p>
                    <textarea
                      rows={6}
                      value={ctaConfig.editorialText}
                      onChange={(e) => setCtaConfig({ ...ctaConfig, editorialText: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-black focus:outline-none focus:border-black font-sans text-xs leading-relaxed shadow-sm"
                      placeholder={"Built to exist\noutside\ncontext, these\nforms\nprioritize neutrality,\nand\ndistortion."}
                    />
                  </div>
                </div>
              </div>

              {/* 5. TRI-CARD PHOTOSHOOT IMAGE UPLOADERS */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                    <Package className="w-4 h-4 text-black" />
                    <span>TRI-CARD PHOTOSHOOT ASSETS (CLOUDINARY CDN)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">[ 3 INDEPENDENT CARD SLOTS ]</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Slot 1: Left Card */}
                  <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase font-mono">1. LEFT CARD PHOTO</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-mono">Small Card</span>
                    </div>

                    <div className="w-full h-44 rounded-none overflow-hidden bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                      <img
                        src={ctaConfig.leftImage || "/images/drapza/cta/cta_img_01.jpg"}
                        alt="Left Card Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <label className="w-full py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                      {uploadingCtaSlot === "left" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                      <span>{uploadingCtaSlot === "left" ? "UPLOADING..." : "UPLOAD PHOTO"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCtaImageUpload("left", e)}
                        disabled={uploadingCtaSlot !== null}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={ctaConfig.leftImage}
                      onChange={(e) => setCtaConfig({ ...ctaConfig, leftImage: e.target.value })}
                      placeholder="Image URL or Cloudinary Link"
                      className="w-full bg-white border border-neutral-200 rounded-none p-2 text-black focus:outline-none focus:border-black text-[10px] shadow-sm font-mono"
                    />
                  </div>

                  {/* Slot 2: Center Hero Card */}
                  <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase font-mono">2. CENTER HERO PHOTO</span>
                      <span className="text-[9px] text-black font-bold uppercase font-mono">Main Large Card</span>
                    </div>

                    <div className="w-full h-44 rounded-none overflow-hidden bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                      <img
                        src={ctaConfig.centerImage || "/images/drapza/cta/cta_img_02.jpg"}
                        alt="Center Card Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <label className="w-full py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                      {uploadingCtaSlot === "center" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                      <span>{uploadingCtaSlot === "center" ? "UPLOADING..." : "UPLOAD PHOTO"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCtaImageUpload("center", e)}
                        disabled={uploadingCtaSlot !== null}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={ctaConfig.centerImage}
                      onChange={(e) => setCtaConfig({ ...ctaConfig, centerImage: e.target.value })}
                      placeholder="Image URL or Cloudinary Link"
                      className="w-full bg-white border border-neutral-200 rounded-none p-2 text-black focus:outline-none focus:border-black text-[10px] shadow-sm font-mono"
                    />
                  </div>

                  {/* Slot 3: Right Card */}
                  <div className="p-4 rounded-none bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase font-mono">3. RIGHT CARD PHOTO</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-mono">Small Card</span>
                    </div>

                    <div className="w-full h-44 rounded-none overflow-hidden bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                      <img
                        src={ctaConfig.rightImage || "/images/drapza/cta/cta_img_03.jpg"}
                        alt="Right Card Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <label className="w-full py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                      {uploadingCtaSlot === "right" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                      <span>{uploadingCtaSlot === "right" ? "UPLOADING..." : "UPLOAD PHOTO"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCtaImageUpload("right", e)}
                        disabled={uploadingCtaSlot !== null}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={ctaConfig.rightImage}
                      onChange={(e) => setCtaConfig({ ...ctaConfig, rightImage: e.target.value })}
                      placeholder="Image URL or Cloudinary Link"
                      className="w-full bg-white border border-neutral-200 rounded-none p-2 text-black focus:outline-none focus:border-black text-[10px] shadow-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 6. PUBLISH ACTION BAR AT BOTTOM */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
                  <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                  <span>Silhouettes Field Test changes will sync live to the homepage instantly.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetCtaConfig}
                    disabled={isResettingCta}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCtaConfig}
                    disabled={isSavingCta}
                    className="px-8 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingCta ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>PUBLISH LIVE SILHOUETTES</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TRANSMIT SIGNAL & CONTACT CMS STUDIO (1:1 LIVE PARALLAX CANVAS) */}
          {/* ========================================================================= */}
          {activeTab === "contact-form" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto font-mono text-xs">
              {/* Hidden File Input for Single-Click Photo Replacement */}
              <input
                ref={contactFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleContactImageUpload}
              />

              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                      HOMEPAGE TRANSMIT SIGNAL • DISPATCH PROTOCOL
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                    <Radio className="w-5 h-5 text-black" />
                    <span>TRANSMIT SIGNAL & CONTACT CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans">
                    Direct live controller: configure the watermark parallax typography, editorial headline, disclaimer, model photoshoot, and signal dispatch settings.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetContactConfig}
                    disabled={isResettingContact}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-black font-mono text-xs font-bold transition-colors"
                  >
                    {isResettingContact ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveContactConfig}
                    disabled={isSavingContact}
                    className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSavingContact ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH SIGNAL</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {contactSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${contactSaveStatus.includes("✓")
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{contactSaveStatus}</span>
                </div>
              )}

              {/* 2. 1-CLICK CURATED SIGNAL PRESETS */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                    <Compass className="w-4 h-4 text-black" />
                    <span>1-CLICK TRANSMIT SIGNAL PRESETS</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">[ INSTANT STYLING PRESETS ]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Signal Noir Protocol (Default Studio)",
                      watermark: "DRAPZA",
                      headline: "TRANSMIT\nUPDATES, NOT\nNOISÉ.",
                      subtitle: "You'll only hear from us when something built is worth showing.",
                      placeholder: "ENTER SIGNAL ADDRESS",
                      buttonText: "SUBMIT SIGNAL",
                      disclaimer: "No marketing cycles. Just rare, coded dispatches.",
                      modelImage: "/images/drapza/contact/contact_models.jpg",
                    },
                    {
                      name: "System 021 Deployment (Technical)",
                      watermark: "SYSTEM 021",
                      headline: "SYSTEM 021\nDEPLOYMENT\nFEED.",
                      subtitle: "Direct link to technical garments, archival releases, and bespoke fittings.",
                      placeholder: "CLIENT@TERMINAL.NET",
                      buttonText: "ESTABLISH LINK",
                      disclaimer: "Encrypted telemetry only. Strictly zero advertising algorithms.",
                      modelImage: "/images/drapza/cta/cta_img_02.jpg",
                    },
                    {
                      name: "Architectural Silhouette (Minimal)",
                      watermark: "DRAPZA",
                      headline: "ARCHITECTURAL\nSILHOUETTES\nDISPATCH.",
                      subtitle: "Quietly issued updates on textile innovations and capsule releases.",
                      placeholder: "YOUR EMAIL ADDRESS",
                      buttonText: "DISPATCH",
                      disclaimer: "Rare dispatches reserved for verified wardrobe patrons.",
                      modelImage: "/images/drapza/cta/cta_img_01.jpg",
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setContactConfig({
                          ...contactConfig,
                          watermarkText: preset.watermark,
                          headline: preset.headline,
                          subtitle: preset.subtitle,
                          inputPlaceholder: preset.placeholder,
                          buttonText: preset.buttonText,
                          disclaimer: preset.disclaimer,
                          modelImage: preset.modelImage,
                        });
                        setContactSaveStatus(`✓ Preset "${preset.name}" applied! Click 'Publish' to sync.`);
                        setTimeout(() => setContactSaveStatus(null), 4000);
                      }}
                      className="p-3.5 rounded-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-black text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black uppercase font-mono truncate">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-sans mt-1 line-clamp-1">
                        {preset.headline.replace(/\n/g, " ")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 1:1 LIVE FRONTEND PREVIEW & PARALLAX CINEMA HUD */}
              <div className="p-6 rounded-none bg-neutral-50 border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                      1:1 LIVE FRONTEND TRANSMIT SIGNAL CANVAS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">[ REAL-TIME PARALLAX REPLICA ]</span>
                </div>

                {/* Parallax & Motion Simulation HUD */}
                <div className="p-4 rounded-none bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsContactSimLooping(!isContactSimLooping)}
                      className={`px-3 py-1.5 rounded-none font-mono text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${isContactSimLooping
                          ? "bg-emerald-500 text-black hover:bg-emerald-400"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                        }`}
                    >
                      <span>{isContactSimLooping ? "PAUSE PARALLAX LOOP" : "PLAY MOTION LOOP"}</span>
                    </button>
                    <span className="text-[10px] font-mono text-neutral-400">
                      WATERMARK PARALLAX SCRUB:
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <span className="text-[10px] font-mono text-neutral-500">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={contactSimProgress}
                      onChange={(e) => {
                        setIsContactSimLooping(false)
                        setContactSimProgress(parseFloat(e.target.value));
                      }}
                      className="w-full accent-white h-1.5 bg-neutral-800 rounded-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-white font-bold w-12 text-right">
                      {Math.round(contactSimProgress * 100)}%
                    </span>
                  </div>
                </div>

                {/* 1:1 Shared Modular ContactForm Component in Live Visual Editable Mode */}
                <div className="w-full bg-[#E5E5DE] rounded-none overflow-hidden border border-neutral-300">
                  <ContactForm
                    config={contactConfig}
                    isEditable={true}
                    onUpdate={(patch: any) => setContactConfig((prev: any) => ({ ...prev, ...patch }))}
                    onImageUpload={() => contactFileInputRef.current?.click()}
                    adminProgress={contactSimProgress}
                    className="w-full"
                  />
                </div>
              </div>

              {/* 4. GRANULAR FORM CONTROLS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Typography & Status */}
                <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-black" />
                      <span>HEADLINE TYPOGRAPHY & STATUS</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-500">Status:</span>
                      <input
                        type="checkbox"
                        checked={contactConfig.isEnabled !== false}
                        onChange={(e) => setContactConfig({ ...contactConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-black cursor-pointer"
                      />
                      <span className={contactConfig.isEnabled !== false ? "text-black font-bold" : "text-neutral-400"}>
                        {contactConfig.isEnabled !== false ? "LIVE ✓" : "HIDDEN"}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">
                      Watermark Background Text (Parallax Layer):
                    </label>
                    <input
                      type="text"
                      value={contactConfig.watermarkText || "DRAPZA"}
                      onChange={(e) => setContactConfig({ ...contactConfig, watermarkText: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                      placeholder="DRAPZA"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">
                      Main Editorial Headline (Use separate lines):
                    </label>
                    <textarea
                      rows={3}
                      value={contactConfig.headline}
                      onChange={(e) => setContactConfig({ ...contactConfig, headline: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                      placeholder="TRANSMIT\nUPDATES, NOT\nNOISÉ."
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">
                      Subtitle Narrative:
                    </label>
                    <textarea
                      rows={2}
                      value={contactConfig.subtitle}
                      onChange={(e) => setContactConfig({ ...contactConfig, subtitle: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                      placeholder="You'll only hear from us when something built is worth showing."
                    />
                  </div>
                </div>

                {/* Column 2: Input Placeholder, Disclaimer & Photoshoot */}
                <div className="lg:col-span-6 p-6 rounded-none bg-white border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-black" />
                      <span>INPUT FIELD & PHOTOSHOOT ASSET</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Input Placeholder:</label>
                      <input
                        type="text"
                        value={contactConfig.inputPlaceholder}
                        onChange={(e) => setContactConfig({ ...contactConfig, inputPlaceholder: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                        placeholder="ENTER SIGNAL ADDRESS"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Submit Button Text:</label>
                      <input
                        type="text"
                        value={contactConfig.buttonText}
                        onChange={(e) => setContactConfig({ ...contactConfig, buttonText: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                        placeholder="SUBMIT SIGNAL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-bold">Disclaimer Notice:</label>
                    <input
                      type="text"
                      value={contactConfig.disclaimer}
                      onChange={(e) => setContactConfig({ ...contactConfig, disclaimer: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-2.5 text-black focus:outline-none"
                      placeholder="No marketing cycles. Just rare, coded dispatches."
                    />
                  </div>

                  {/* Photoshoot Banner Uploader */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase font-mono">MODELS PHOTOSHOOT ASSET</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-mono">Cloudinary CDN</span>
                    </div>

                    <div className="w-full h-32 rounded-none overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img
                        src={contactConfig.modelImage || "/images/drapza/contact/contact_models.jpg"}
                        alt="Models Photoshoot Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="flex gap-2">
                      <label className="py-2 px-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                        {uploadingContactImage ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingContactImage ? "UPLOADING..." : "UPLOAD PHOTO"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleContactImageUpload}
                          disabled={uploadingContactImage}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        value={contactConfig.modelImage || ""}
                        onChange={(e) => setContactConfig({ ...contactConfig, modelImage: e.target.value })}
                        placeholder="Image URL or Cloudinary CDN link"
                        className="flex-1 bg-white border border-neutral-200 rounded-none p-2 text-black focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PUBLISH ACTION BAR AT BOTTOM */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
                  <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                  <span>Transmit Signal changes will sync live to the homepage instantly.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetContactConfig}
                    disabled={isResettingContact}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-black font-mono text-xs font-bold transition-colors"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveContactConfig}
                    disabled={isSavingContact}
                    className="px-8 py-3 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSavingContact ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>PUBLISH LIVE SIGNAL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BUNDLE STACKER / MODULAR OUTFIT CMS STUDIO */}
          {/* ========================================================================= */}
          {activeTab === "bundle" && (() => {
            const activeLayer = bundleConfig.items[selectedBundleLayerIdx] || bundleConfig.items[0];
            const rawTotal = bundleConfig.items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
            const discountMultiplier = (100 - (bundleConfig.discountPercent || 15)) / 100;
            const discountTotal = Math.round(rawTotal * discountMultiplier);

            return (
              <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
                {/* 1. TOP HEADER & STATUS BAR */}
                <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                        MODULAR OUTFIT STACKER & BUNDLE STUDIO
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-white" />
                      <span>BUNDLE STACKER CMS</span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Create, curate, and configure modular 3-piece bundle combinations, bundle discount algorithms, layer archetypes, and live pricing.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetBundleConfig}
                      disabled={isResettingBundle}
                      className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isResettingBundle ? "Resetting..." : "Reset Defaults"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveBundleConfig}
                      disabled={isSavingBundle}
                      className="px-6 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingBundle ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>SAVE & PUBLISH BUNDLE</span>
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {bundleSaveStatus && (
                  <div
                    className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${bundleSaveStatus.startsWith("✓")
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                      : "bg-red-950/60 border-red-500/50 text-red-300"
                      }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>{bundleSaveStatus}</span>
                  </div>
                )}

                {/* 2. 1-CLICK CURATED BUNDLE PRESETS (RECIPES) */}
                <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>1-CLICK BUNDLE RECIPES / OUTFIT PRESETS</span>
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400">[ INSTANT STACK GENERATOR ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        name: "Festive Silk Trio (Default)",
                        desc: "Anarkali Kurti + Organza Dupatta + Chanderi Palazzo",
                        items: [
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
                        ],
                      },
                      {
                        name: "Urban Denim Fusion Stack",
                        desc: "Draped Georgette Top + Organza Dupatta + Relaxed Jeans",
                        items: [
                          {
                            id: "t2",
                            name: "DRAPED GEORGETTE ASYMMETRIC TOP",
                            price: 790,
                            formattedPrice: "₹790",
                            image: "/images/drapza/products/product_12.png",
                            layerNumber: "LAYER 01",
                            layerType: "PRIMARY TOP",
                            subtitle: "CONTEMPORARY BLOUSE",
                            tags: ["BREATHABLE", "DRAPED", "MODULAR"],
                            slug: "draped-georgette-top",
                          },
                          {
                            id: "o1",
                            name: "ORGANZA HAND-EMBROIDERED DUPATTA",
                            price: 750,
                            formattedPrice: "₹750",
                            image: "/images/drapza/products/product_21.png",
                            layerNumber: "LAYER 02",
                            layerType: "DUPATTA DRAPE",
                            subtitle: "SCALLOPED BORDERS",
                            tags: ["HANDCRAFTED", "AIRY ORGANZA", "2.5M LENGTH"],
                            slug: "organza-embroidered-dupatta",
                          },
                          {
                            id: "b2",
                            name: "HIGH-WAIST RELAXED DENIM JEANS",
                            price: 1290,
                            formattedPrice: "₹1,290",
                            image: "/images/drapza/products/product_4.png",
                            layerNumber: "LAYER 03",
                            layerType: "BOTTOM WEAR",
                            subtitle: "STRAIGHT LEG FIT",
                            tags: ["100% COTTON", "5 POCKETS", "HIGH RISE"],
                            slug: "high-waist-relaxed-jeans",
                          },
                        ],
                      },
                      {
                        name: "Royal Heritage Capsule",
                        desc: "Kanjivaram Pure Silk + Festive Sharara Layer + Organza",
                        items: [
                          {
                            id: "t3",
                            name: "KANJIVARAM SILK EMBROIDERED KURTI",
                            price: 1890,
                            formattedPrice: "₹1,890",
                            image: "/images/drapza/products/product_18.png",
                            layerNumber: "LAYER 01",
                            layerType: "PRIMARY TOP",
                            subtitle: "GOLD ZARI WEAVE",
                            tags: ["MULBERRY SILK", "ROYAL GOLD", "HEAVY DRAPE"],
                            slug: "kanjivaram-silk-kurti",
                          },
                          {
                            id: "o3",
                            name: "RESHEM WORK FESTIVE DUPATTA",
                            price: 990,
                            formattedPrice: "₹990",
                            image: "/images/drapza/products/product_11.png",
                            layerNumber: "LAYER 02",
                            layerType: "DUPATTA DRAPE",
                            subtitle: "FESTIVE ACCENT",
                            tags: ["GOTA PATTI", "SHEER SILK", "FESTIVE"],
                            slug: "reshem-festive-dupatta",
                          },
                          {
                            id: "b3",
                            name: "LAYERED GEORGETTE FESTIVE SHARARA",
                            price: 1590,
                            formattedPrice: "₹1,590",
                            image: "/images/drapza/products/product_6.png",
                            layerNumber: "LAYER 03",
                            layerType: "BOTTOM WEAR",
                            subtitle: "TIERED FLARE LEHENGA",
                            tags: ["MIRROR WORK", "MAXI FLARE", "FESTIVE"],
                            slug: "layered-georgette-sharara",
                          },
                        ],
                      },
                      {
                        name: "Minimalist Noir Capsule",
                        desc: "Contemporary Top + Pleated Palazzo + Sheer Wrap",
                        items: [
                          {
                            id: "t4",
                            name: "TEXTURED MODAL SILK TOP",
                            price: 890,
                            formattedPrice: "₹890",
                            image: "/images/drapza/products/product_2.png",
                            layerNumber: "LAYER 01",
                            layerType: "PRIMARY TOP",
                            subtitle: "TAILORED CUT",
                            tags: ["MODAL SILK", "MINIMALIST", "NOIR"],
                            slug: "modal-silk-top",
                          },
                          {
                            id: "o4",
                            name: "MONOCHROME CONTEMPORARY OVERLAYER",
                            price: 690,
                            formattedPrice: "₹690",
                            image: "/images/drapza/products/product_11.png",
                            layerNumber: "LAYER 02",
                            layerType: "ACCENT DRAPE",
                            subtitle: "GEOMETRIC BORDER",
                            tags: ["FEATHERWEIGHT", "CLEAN DRAPE", "VERSATILE"],
                            slug: "monochrome-overlayer",
                          },
                          {
                            id: "b4",
                            name: "ARCHITECTURAL CHANDERI PALAZZO",
                            price: 990,
                            formattedPrice: "₹990",
                            image: "/images/drapza/products/product_4.png",
                            layerNumber: "LAYER 03",
                            layerType: "BOTTOM WEAR",
                            subtitle: "FLOWING SILHOUETTE",
                            tags: ["CHANDERI", "HIGH-WAIST", "WIDE LEG"],
                            slug: "chanderi-palazzo",
                          },
                        ],
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPresetBundle(preset)}
                        className="p-3.5 rounded-none bg-[#17181d] hover:bg-[#1f2027] border border-[#2c2d34] hover:border-white/40 text-left transition-all cursor-pointer group"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase font-mono">
                          {preset.name}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 leading-relaxed">
                          {preset.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 1:1 LIVE INTERACTIVE VISUAL PREVIEW STUDIO */}
                <div className="p-6 rounded-none bg-[#0c0d10] border border-[#22242a] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1f2026] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        1:1 LIVE VISUAL PREVIEW & BUNDLE PRICING STUDIO
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">[ LIVE FRONTEND SIMULATION ]</span>
                  </div>

                  {/* Simulated Homepage Outfit Builder Section (Light Luxury Aesthetic) */}
                  <div className="bg-white text-black p-6 sm:p-8 rounded-none border border-neutral-300 overflow-hidden shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div>
                        <span className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-500 flex items-center gap-2 mb-2 font-semibold">
                          <Layers className="h-3.5 w-3.5 text-black" />
                          {bundleConfig.sectionTag || "[ BUNDLE STACKER ]"}
                        </span>
                        <h3 className="font-display text-2xl sm:text-4xl uppercase leading-[0.88] tracking-tight font-normal text-black">
                          {bundleConfig.headingLine1 || "BUILD YOUR"}{" "}
                          <span className="font-bold">{bundleConfig.headingLine2 || "MODULAR OUTFIT."}</span>
                        </h3>
                      </div>

                      {/* Top Right Price Badge in Preview */}
                      <div className="bg-[#f5f5f5] p-4 rounded-none border border-black/10 flex items-center gap-5 shadow-sm">
                        <div>
                          <span className="font-mono-technical text-[9px] uppercase tracking-widest text-neutral-500 block font-semibold">
                            {bundleConfig.discountBadgeText || `BUNDLE DISPATCH (${bundleConfig.discountPercent || 15}% OFF)`}
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="font-display text-2xl font-bold text-black">
                              ₹{discountTotal}
                            </span>
                            <span className="font-mono-technical text-xs text-neutral-400 line-through font-medium">
                              ₹{rawTotal}
                            </span>
                          </div>
                        </div>

                        <div className="py-2 px-4 rounded-none bg-black text-white font-mono-technical text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-md">
                          <ShoppingBag className="h-3 w-3" />
                          <span>{bundleConfig.ctaButtonText || "ADD BUNDLE"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Layer Cards in Preview - Exact 1:1 UI Copy of Frontend OutfitBuilderSection */}
                    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(bundleConfig.items.length, 3)} gap-5 lg:gap-6 items-stretch`}>
                      {bundleConfig.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => setSelectedBundleLayerIdx(idx)}
                          className={`group flex flex-col justify-between rounded-none bg-[#f5f5f5] p-3.5 sm:p-4 shadow-sm border transition-all cursor-pointer relative ${selectedBundleLayerIdx === idx
                            ? "border-black ring-2 ring-black shadow-2xl scale-[1.015]"
                            : "border-black/10 hover:border-black/30"
                            }`}
                        >
                          {/* Active Editing Marker Badge */}
                          {selectedBundleLayerIdx === idx && (
                            <div className="absolute -top-3 left-6 z-20 px-2.5 py-0.5 rounded-none bg-black text-white font-mono text-[9px] font-bold uppercase tracking-widest shadow-md">
                              EDITING LAYER
                            </div>
                          )}

                          {/* Upper Image Frame with Technical Dot Grid & Layer Matrix */}
                          <div className="relative h-[280px] sm:h-[320px] w-full overflow-hidden rounded-none bg-neutral-100 flex flex-col justify-between p-4 shadow-inner border border-black/5">
                            {/* Subtle Geometric Background Halo */}
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                              <div className="h-44 w-44 rounded-none bg-white/70 blur-xl" />
                            </div>

                            {/* Subtle Technical Dot Grid Decor */}
                            <div className="pointer-events-none absolute right-3 top-1/3 opacity-15 grid grid-cols-4 gap-1">
                              {Array.from({ length: 16 }).map((_, i) => (
                                <span key={i} className="h-1 w-1 rounded-none bg-black" />
                              ))}
                            </div>

                            {/* Top Row: Layer Label & Matrix Icon */}
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-none bg-black" />
                                <span className="font-mono-technical text-[10px] font-medium uppercase tracking-[0.2em] text-black">
                                  {item.layerNumber || `LAYER 0${idx + 1}`}
                                </span>
                              </div>

                              <div className="h-5 w-5 rounded-none bg-black/5 flex items-center justify-center backdrop-blur-sm">
                                <LayoutGrid className="h-2.5 w-2.5 text-neutral-500" />
                              </div>
                            </div>

                            {/* Main Garment Cutout Image */}
                            <div className="relative z-10 flex-1 flex items-center justify-center my-1 overflow-hidden">
                              <img
                                src={item.image || "/images/drapza/products/product_1.png"}
                                alt={item.name}
                                className="h-full w-full max-h-[220px] object-contain object-center filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          </div>

                          {/* Bottom Details Section */}
                          <div className="px-2 pt-3.5 pb-1">
                            {/* Layer Pill Badge & Plus Button */}
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center rounded-none bg-neutral-200 px-2.5 py-0.5 font-mono-technical text-[9.5px] font-medium uppercase tracking-wider text-black">
                                {item.layerType || `LAYER 0${idx + 1}`}
                              </span>

                              <div className="h-6 w-6 rounded-none bg-black/5 flex items-center justify-center text-black">
                                <Plus className="h-3 w-3" />
                              </div>
                            </div>

                            {/* Product Title & Subtitle */}
                            <div className="mt-2.5">
                              <h4 className="font-mono-technical text-xs sm:text-sm font-semibold uppercase tracking-wider text-black truncate">
                                {item.name || "UNTITLED PIECE"}
                              </h4>
                              <p className="font-mono-technical text-[9px] uppercase tracking-wider text-neutral-500 font-normal mt-0.5 truncate">
                                {item.subtitle || "ARCHITECTURAL ARCHETYPE"}
                              </p>
                            </div>

                            {/* Bottom Row: Tags & Price Pill */}
                            <div className="mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t border-black/5">
                              <div className="flex items-center gap-1 flex-wrap">
                                {(item.tags && item.tags.length > 0 ? item.tags : ["PREMIUM"]).slice(0, 2).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="inline-flex items-center gap-0.5 text-neutral-600 font-mono-technical text-[8px] font-medium uppercase tracking-wider bg-black/5 px-1.5 py-0.5 rounded-none"
                                  >
                                    <Compass className="h-2 w-2 opacity-60" />
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <span className="bg-black text-white px-2.5 py-1 rounded-none font-mono-technical text-xs font-semibold shadow-sm shrink-0">
                                {item.formattedPrice || `₹${item.price}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. SECTION SETTINGS & DISCOUNT ALGORITHM */}
                <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>SECTION SETTINGS & DISCOUNT ALGORITHM</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-400">Section Status:</span>
                      <input
                        type="checkbox"
                        checked={bundleConfig.isEnabled !== false}
                        onChange={(e) => setBundleConfig({ ...bundleConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-emerald-500 cursor-pointer"
                      />
                      <span className={bundleConfig.isEnabled !== false ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {bundleConfig.isEnabled !== false ? "LIVE ON HOMEPAGE" : "HIDDEN"}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                    <div>
                      <label className="block text-[#aaa] mb-1">Section Tag</label>
                      <input
                        type="text"
                        value={bundleConfig.sectionTag}
                        onChange={(e) => setBundleConfig({ ...bundleConfig, sectionTag: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white font-mono"
                        placeholder="[ BUNDLE STACKER ]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1">Headline Line 1</label>
                      <input
                        type="text"
                        value={bundleConfig.headingLine1}
                        onChange={(e) => setBundleConfig({ ...bundleConfig, headingLine1: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white font-display uppercase text-sm"
                        placeholder="BUILD YOUR"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1">Headline Line 2</label>
                      <input
                        type="text"
                        value={bundleConfig.headingLine2}
                        onChange={(e) => setBundleConfig({ ...bundleConfig, headingLine2: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white font-display uppercase text-sm font-bold"
                        placeholder="MODULAR OUTFIT."
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1">
                        Bundle Discount: <strong className="text-emerald-400">{bundleConfig.discountPercent || 15}% OFF</strong>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={bundleConfig.discountPercent || 15}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBundleConfig({
                              ...bundleConfig,
                              discountPercent: val,
                              discountBadgeText: `BUNDLE DISPATCH (${val}% OFF)`,
                            });
                          }}
                          className="flex-1 accent-emerald-500 cursor-pointer"
                        />
                        <span className="font-bold text-white w-10 text-right">{bundleConfig.discountPercent || 15}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. MODULAR LAYERS MANAGER STUDIO */}
                <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
                    <div>
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-white" />
                        <span>MODULAR LAYERS STUDIO ({bundleConfig.items.length} PIECES)</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Customize each garment piece in the outfit stack, auto-fill from store inventory, or adjust prices and tags.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBundleLayer}
                      className="px-4 py-2 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>ADD OUTFIT LAYER</span>
                    </button>
                  </div>

                  {/* Layer Selector Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {bundleConfig.items.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setSelectedBundleLayerIdx(idx)}
                        className={`px-3.5 py-2.5 rounded-none border text-left shrink-0 transition-all font-mono cursor-pointer flex items-center gap-2.5 ${selectedBundleLayerIdx === idx
                          ? "bg-white text-black border-white font-bold shadow-lg"
                          : "bg-[#18191d] text-neutral-400 border-[#2b2c32] hover:text-white hover:border-[#444]"
                          }`}
                      >
                        <div className="w-7 h-7 rounded-none bg-black/40 overflow-hidden shrink-0 border border-white/10">
                          <img
                            src={item.image || "/images/drapza/products/product_1.png"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] tracking-wider uppercase leading-none">
                            {item.layerNumber || `LAYER 0${idx + 1}`}
                          </div>
                          <div className={`text-[9px] truncate max-w-[120px] ${selectedBundleLayerIdx === idx ? "text-neutral-700 font-medium" : "text-neutral-500"}`}>
                            {item.name || "Untitled Garment"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE LAYER EDITOR PANEL */}
                  {activeLayer && (
                    <div className="p-6 rounded-none bg-[#0e0f12] border border-[#22242b] space-y-6">
                      {/* Header row with catalog auto-fill */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c1d22] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-none bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold">
                            EDITING {activeLayer.layerNumber || `LAYER 0${selectedBundleLayerIdx + 1}`}
                          </span>
                          <span className="font-mono text-xs text-neutral-400 truncate max-w-[280px]">
                            {activeLayer.name}
                          </span>
                        </div>

                        {/* AUTO-FILL FROM PRODUCT INVENTORY */}
                        <div className="flex items-center gap-2 bg-[#17181d] p-2 rounded-none border border-[#282930]">
                          <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-mono text-neutral-300 shrink-0">Auto-fill from Catalog:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAutoFillBundleFromProduct(selectedBundleLayerIdx, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            defaultValue=""
                            className="bg-[#0f1013] border border-[#333] rounded-none px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-white cursor-pointer max-w-[220px]"
                          >
                            <option value="" disabled>
                              Select catalog product...
                            </option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} (₹{p.numericPrice || p.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Fields & Visuals Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Image Preview & Upload */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-none bg-[#141519] border border-[#22242a]">
                          <div className="w-full h-52 rounded-none bg-neutral-100 flex items-center justify-center overflow-hidden p-3 relative border border-neutral-300">
                            <img
                              src={activeLayer.image || "/images/drapza/products/product_1.png"}
                              alt={activeLayer.name}
                              className="h-full w-full object-contain filter drop-shadow-md"
                            />
                            {isUploadingBundleImage === selectedBundleLayerIdx && (
                              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white font-mono text-xs">
                                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                                <span>Uploading to CDN...</span>
                              </div>
                            )}
                          </div>

                          <div className="w-full mt-3">
                            <label className="w-full py-2.5 px-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2">
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>UPLOAD TO CLOUDINARY</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBundleImageUpload(selectedBundleLayerIdx, e)}
                                disabled={isUploadingBundleImage !== null}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Editable Form Fields */}
                        <div className="md:col-span-8 space-y-4 font-mono text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[#aaa] mb-1">Layer Label</label>
                              <input
                                type="text"
                                value={activeLayer.layerNumber || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], layerNumber: val };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="LAYER 01"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[#aaa] mb-1">Layer Category Badge</label>
                              <input
                                type="text"
                                value={activeLayer.layerType || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], layerType: val };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="PRIMARY TOP"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase"
                              />
                            </div>

                            <div>
                              <label className="block text-[#aaa] mb-1">Individual Price (INR)</label>
                              <input
                                type="number"
                                value={activeLayer.price || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = {
                                      ...items[selectedBundleLayerIdx],
                                      price: val,
                                      formattedPrice: `₹${val.toLocaleString("en-IN")}`,
                                    };
                                    return { ...prev, items };
                                  });
                                }}
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[#aaa] mb-1">Garment Archetype Name</label>
                              <input
                                type="text"
                                value={activeLayer.name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], name: val };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="ANARKALI SILK EMBROIDERED KURTI"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[#aaa] mb-1">Subtitle / Specification</label>
                              <input
                                type="text"
                                value={activeLayer.subtitle || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], subtitle: val };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="AUTHENTICATED SILK KURTI"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[#aaa] mb-1">Feature Micro-Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={(activeLayer.tags || []).join(", ")}
                                onChange={(e) => {
                                  const tagsArr = e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], tags: tagsArr };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="PURE SILK, ZARI WORK, FLARED"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white uppercase"
                              />
                            </div>

                            <div>
                              <label className="block text-[#aaa] mb-1">Direct Image URL</label>
                              <input
                                type="text"
                                value={activeLayer.image || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBundleConfig((prev) => {
                                    const items = [...prev.items];
                                    items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], image: val };
                                    return { ...prev, items };
                                  });
                                }}
                                placeholder="/images/drapza/products/product_1.png"
                                className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2.5 text-white focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>

                          {/* Quick Product Image Presets */}
                          <div>
                            <label className="block text-[#aaa] mb-1">Quick Visual Preset:</label>
                            <div className="flex flex-wrap gap-1.5">
                              {[1, 2, 4, 6, 11, 12, 14, 18, 21].map((num) => {
                                const pUrl = `/images/drapza/products/product_${num}.png`;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => {
                                      setBundleConfig((prev) => {
                                        const items = [...prev.items];
                                        items[selectedBundleLayerIdx] = { ...items[selectedBundleLayerIdx], image: pUrl };
                                        return { ...prev, items };
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-none border text-[10px] font-mono transition-all cursor-pointer ${activeLayer.image === pUrl
                                      ? "bg-white text-black border-white font-bold"
                                      : "bg-[#18191d] text-neutral-400 border-[#2f3036] hover:text-white"
                                      }`}
                                  >
                                    Product {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#1c1d22] pt-4">
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Layer Price: <strong className="text-white">₹{activeLayer.price}</strong> (After Bundle {bundleConfig.discountPercent}% OFF: <strong className="text-emerald-400">₹{Math.round((Number(activeLayer.price) || 0) * discountMultiplier)}</strong>)
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleMoveBundleLayer(selectedBundleLayerIdx, "up")}
                            disabled={selectedBundleLayerIdx === 0}
                            className="px-3 py-1.5 rounded-none bg-[#1c1d22] hover:bg-[#282a32] border border-[#333] text-neutral-300 hover:text-white font-mono text-xs transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Move Left</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveBundleLayer(selectedBundleLayerIdx, "down")}
                            disabled={selectedBundleLayerIdx === bundleConfig.items.length - 1}
                            className="px-3 py-1.5 rounded-none bg-[#1c1d22] hover:bg-[#282a32] border border-[#333] text-neutral-300 hover:text-white font-mono text-xs transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1"
                          >
                            <span>Move Right</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const clone = { ...activeLayer, id: `layer_${Date.now()}`, layerNumber: `LAYER 0${bundleConfig.items.length + 1}` };
                              setBundleConfig((prev) => ({ ...prev, items: [...prev.items, clone] }));
                              setSelectedBundleLayerIdx(bundleConfig.items.length);
                            }}
                            className="px-3 py-1.5 rounded-none bg-[#1c1d22] hover:bg-[#282a32] border border-[#333] text-neutral-300 hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBundleLayer(selectedBundleLayerIdx)}
                            disabled={bundleConfig.items.length <= 1}
                            className="px-3 py-1.5 rounded-none bg-red-950/40 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white font-mono text-xs transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Layer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. PUBLISH ACTION BAR AT BOTTOM */}
                <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                    <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                    <span>All changes made here will sync live to the Modular Outfit Stacker section immediately.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetBundleConfig}
                      disabled={isResettingBundle}
                      className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reset Defaults
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveBundleConfig}
                      disabled={isSavingBundle}
                      className="px-8 py-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingBundle ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>SAVE & PUBLISH LIVE BUNDLE</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB: EDITORIAL TEXT BLOCK / BRAND NARRATIVE CMS STUDIO */}
          {/* ========================================================================= */}
          {activeTab === "textblock" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                      BRAND NARRATIVE & EDITORIAL MANIFESTO
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-white" />
                    <span>NARRATIVE & EDITORIAL CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Live editor for the editorial brand statement: giant dual-line headline, dual-column editorial philosophy copy, and floating brand emblem.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetTextBlockConfig}
                    disabled={isResettingTextBlock}
                    className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResettingTextBlock ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTextBlockConfig}
                    disabled={isSavingTextBlock}
                    className="px-6 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingTextBlock ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH NARRATIVE</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {textBlockSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${textBlockSaveStatus.startsWith("✓")
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/60 border-red-500/50 text-red-300"
                    }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{textBlockSaveStatus}</span>
                </div>
              )}

              {/* 2. 1-CLICK CURATED EDITORIAL PRESETS */}
              <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>CURATED EDITORIAL PRESETS</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">[ 1-CLICK MANIFESTO GENERATOR ]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      name: "Designed Absence (Default)",
                      h1: "DESIGNED ABSENCE,",
                      h2: "ENGINEERED SILENCE.",
                      p1: "Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.",
                      p2: "No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who frame.",
                    },
                    {
                      name: "Form Over Spectacle",
                      h1: "FORM OVER SPECTACLE,",
                      h2: "INTENT OVER NOISE.",
                      p1: "Forged in architectural restraint. Every garment is an exploration of high-density textile geometry and anatomical precision. Built to outlast seasonal transience.",
                      p2: "A uniform of uncompromising presence. Minimalist cuts paired with industrial resilience. Crafted for the quietly defiant vanguard of the modern era.",
                    },
                    {
                      name: "Monochrome Archive",
                      h1: "MONOCHROME DISPATCH,",
                      h2: "UNCOMPROMISED ARCHIVE.",
                      p1: "Eliminating the superfluous to elevate pure silhouette. High-density weaves meet ergonomic draping to create tactile statements in obsidian and slate.",
                      p2: "Timeless streetwear engineered as protective armor against the noise of fast fashion. Built on permanence, intention, and silent authority.",
                    },
                    {
                      name: "Heritage & Silent Revolution",
                      h1: "HERITAGE WEAVES,",
                      h2: "SILENT REVOLUTION.",
                      p1: "Centuries of Indian artisanal textile mastery re-imagined through avant-garde modular construction. Pure silks and chanderi draped with brutalist strength.",
                      p2: "Not costume. Not nostalgia. An uncompromising contemporary archive where traditional zari and organza become modern tactical expressions.",
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTextBlockConfig({
                          ...textBlockConfig,
                          headlineLine1: preset.h1,
                          headlineLine2: preset.h2,
                          paragraph1: preset.p1,
                          paragraph2: preset.p2,
                        });
                      }}
                      className="p-3.5 rounded-none bg-[#17181d] hover:bg-[#1f2027] border border-[#2c2d34] hover:border-white/40 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase font-mono">
                        {preset.name}
                      </div>
                      <p className="text-[10px] text-neutral-400 font-display uppercase tracking-wide mt-1 line-clamp-1">
                        {preset.h1} {preset.h2}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 1:1 LIVE INTERACTIVE VISUAL PREVIEW */}
              <div className="p-6 rounded-none bg-[#0c0d10] border border-[#22242a] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1f2026] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      1:1 LIVE FRONTEND VISUAL PREVIEW
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">[ LIVE CANVASSING ]</span>
                </div>

                {/* 1:1 Shared Modular TextBlock Component in Live Visual Editable Mode */}
                <TextBlock
                  config={textBlockConfig}
                  isEditable={true}
                  onUpdate={(patch: any) => setTextBlockConfig((prev: any) => ({ ...prev, ...patch }))}
                  className="textblock-admin-preview w-full"
                />
              </div>

              {/* 4. HEADLINE & EDITORIAL COPY STUDIO */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                {/* Left Column: Headlines & Paragraphs */}
                <div className="lg:col-span-7 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>HEADLINES & EDITORIAL COLUMNS</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <span className="text-neutral-400">Section Status:</span>
                      <input
                        type="checkbox"
                        checked={textBlockConfig.isEnabled !== false}
                        onChange={(e) => setTextBlockConfig({ ...textBlockConfig, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-emerald-500 cursor-pointer"
                      />
                      <span className={textBlockConfig.isEnabled !== false ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {textBlockConfig.isEnabled !== false ? "LIVE" : "HIDDEN"}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#aaa] mb-1 font-bold">1. Headline Line 1:</label>
                      <input
                        type="text"
                        value={textBlockConfig.headlineLine1}
                        onChange={(e) => setTextBlockConfig({ ...textBlockConfig, headlineLine1: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-display uppercase text-sm tracking-wide"
                        placeholder="DESIGNED ABSENCE,"
                      />
                    </div>

                    <div>
                      <label className="block text-[#aaa] mb-1 font-bold">2. Headline Line 2:</label>
                      <input
                        type="text"
                        value={textBlockConfig.headlineLine2}
                        onChange={(e) => setTextBlockConfig({ ...textBlockConfig, headlineLine2: e.target.value })}
                        className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-display uppercase text-sm tracking-wide font-bold"
                        placeholder="ENGINEERED SILENCE."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#aaa] mb-1 font-bold">3. Editorial Column 1 (Middle-Right Paragraph):</label>
                    <textarea
                      rows={4}
                      value={textBlockConfig.paragraph1}
                      onChange={(e) => setTextBlockConfig({ ...textBlockConfig, paragraph1: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-body text-xs leading-relaxed"
                      placeholder="Designed for quiet tension. Built on structure, not spectacle..."
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] mb-1 font-bold">4. Editorial Column 2 (Far-Right Paragraph):</label>
                    <textarea
                      rows={4}
                      value={textBlockConfig.paragraph2}
                      onChange={(e) => setTextBlockConfig({ ...textBlockConfig, paragraph2: e.target.value })}
                      className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-3 text-white focus:outline-none focus:border-white font-body text-xs leading-relaxed"
                      placeholder="No ornament. No history. Just form engineered to remain..."
                    />
                  </div>
                </div>

                {/* Right Column: Emblem Symbol & Visual Styling */}
                <div className="lg:col-span-5 p-6 rounded-none bg-[#121316] border border-[#26272c] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>EMBLEM & COLOR PALETTE</span>
                    </h3>
                  </div>

                  {/* Symbol Toggle & Selection */}
                  <div className="p-3.5 rounded-none bg-[#18191d] border border-[#28292f] space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-white font-bold text-xs">Show Bottom-Left Symbol:</span>
                      <input
                        type="checkbox"
                        checked={textBlockConfig.showSymbol !== false}
                        onChange={(e) => setTextBlockConfig({ ...textBlockConfig, showSymbol: e.target.checked })}
                        className="w-4 h-4 rounded-none accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    {textBlockConfig.showSymbol !== false && (
                      <div className="space-y-3 pt-2 border-t border-[#222]">
                        <label className="block text-[#aaa]">Symbol Source:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTextBlockConfig({ ...textBlockConfig, symbolType: "drapza_symbol" })}
                            className={`p-2.5 rounded-none border text-center font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${textBlockConfig.symbolType !== "custom_image"
                              ? "bg-white text-black border-white shadow-md"
                              : "bg-[#1f2026] text-neutral-400 border-[#2f3036] hover:text-white"
                              }`}
                          >
                            Drapza Core Symbol
                          </button>
                          <button
                            type="button"
                            onClick={() => setTextBlockConfig({ ...textBlockConfig, symbolType: "custom_image" })}
                            className={`p-2.5 rounded-none border text-center font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${textBlockConfig.symbolType === "custom_image"
                              ? "bg-white text-black border-white shadow-md"
                              : "bg-[#1f2026] text-neutral-400 border-[#2f3036] hover:text-white"
                              }`}
                          >
                            Custom Logo Cutout
                          </button>
                        </div>

                        {textBlockConfig.symbolType === "custom_image" && (
                          <div className="space-y-2 pt-2">
                            <label className="block text-[#aaa] text-[11px]">Upload Custom Emblem to CDN:</label>
                            <label className="w-full py-2 px-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2">
                              {isUploadingTextBlockSymbol ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              )}
                              <span>{isUploadingTextBlockSymbol ? "UPLOADING TO CDN..." : "CHOOSE EMBLEM PNG"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleTextBlockSymbolUpload}
                                disabled={isUploadingTextBlockSymbol}
                                className="hidden"
                              />
                            </label>

                            <input
                              type="text"
                              value={textBlockConfig.customSymbolImage}
                              onChange={(e) => setTextBlockConfig({ ...textBlockConfig, customSymbolImage: e.target.value })}
                              placeholder="https://res.cloudinary.com/.../emblem.png"
                              className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-2 text-white focus:outline-none focus:border-white text-[11px]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section Background & Text Color */}
                  <div className="space-y-3">
                    <span className="text-white font-bold block">Palette Controls:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#aaa] mb-1">Background Hex:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textBlockConfig.backgroundColor || "#0a0a0a"}
                            onChange={(e) => setTextBlockConfig({ ...textBlockConfig, backgroundColor: e.target.value })}
                            className="w-8 h-8 rounded-none border border-[#444] bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={textBlockConfig.backgroundColor || "#0a0a0a"}
                            onChange={(e) => setTextBlockConfig({ ...textBlockConfig, backgroundColor: e.target.value })}
                            className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-1.5 text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#aaa] mb-1">Headline Text Hex:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textBlockConfig.textColor || "#ffffff"}
                            onChange={(e) => setTextBlockConfig({ ...textBlockConfig, textColor: e.target.value })}
                            className="w-8 h-8 rounded-none border border-[#444] bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={textBlockConfig.textColor || "#ffffff"}
                            onChange={(e) => setTextBlockConfig({ ...textBlockConfig, textColor: e.target.value })}
                            className="w-full bg-[#1c1d22] border border-[#333] rounded-none p-1.5 text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PUBLISH ACTION BAR AT BOTTOM */}
              <div className="p-6 rounded-none bg-[#121316] border border-[#26272c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                  <span>Changes made here will instantly update the Editorial Brand Narrative section on the homepage.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetTextBlockConfig}
                    disabled={isResettingTextBlock}
                    className="px-4 py-2.5 rounded-none border border-[#333] hover:border-[#666] bg-[#1a1b20] hover:bg-[#22242c] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTextBlockConfig}
                    disabled={isSavingTextBlock}
                    className="px-8 py-3 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingTextBlock ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH LIVE NARRATIVE</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PEEL REVEAL & MOTION MASK CMS (1:1 LIVE STOREFRONT CANVAS & HUD) */}
          {/* ========================================================================= */}
          {activeTab === "peel-reveal" && (
            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
              {/* 1. TOP HEADER & STATUS BAR */}
              <div className="p-6 rounded-none bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                      1:1 STOREFRONT MOTION MASK STUDIO
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-black flex items-center gap-2">
                    <Layers className="w-5 h-5 text-black" />
                    <span>PEEL REVEAL CMS</span>
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Live 1:1 visual canvas editor: click any text on the model card, telemetry tags, or split words to edit directly, or scrub the motion mask reveal slider.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetPeelRevealConfig}
                    disabled={isResettingPeelReveal}
                    className="px-4 py-2.5 rounded-none border border-neutral-200 hover:border-black bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPeelReveal ? "Resetting..." : "Reset Defaults"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePeelRevealConfig}
                    disabled={isSavingPeelReveal}
                    className="px-6 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPeelReveal ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>SAVE & PUBLISH PEEL REVEAL</span>
                  </button>
                </div>
              </div>

              {/* Save Feedback Banner */}
              {peelRevealSaveStatus && (
                <div
                  className={`p-4 rounded-none font-mono text-xs font-bold flex items-center gap-2 border animate-fadeIn ${peelRevealSaveStatus.startsWith("✓")
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 border-neutral-300 text-black"
                    }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{peelRevealSaveStatus}</span>
                </div>
              )}

              {/* 2. 1:1 LIVE STOREFRONT CANVAS & CINEMA CONTROLLER HUD */}
              <div className="relative w-full rounded-none overflow-hidden border-2 border-neutral-300 shadow-2xl bg-[#edf1e8] text-black flex flex-col justify-between select-none">

                {/* Cinema HUD Controller Bar */}
                <div className="relative z-40 bg-black text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider shrink-0 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className={`w-2.5 h-2.5 rounded-full ${isSimulatingScroll ? "bg-emerald-400 animate-pulse" : "bg-cyan-400 animate-pulse"}`} />
                      <span>1:1 MOTION MASK REVEAL ENGINE</span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold ${isSimulatingScroll ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-cyan-950 text-cyan-300 border border-cyan-800"}`}>
                        {isSimulatingScroll ? "LOOP RUNNING" : `SCRUB: ${Math.round(peelRevealSimProgress * 100)}%`}
                      </span>
                    </span>
                    <span className="hidden xl:inline-block text-neutral-400 text-[10px]">
                      [ Click any text on canvas to live-edit ]
                    </span>
                  </div>

                  {/* Quick Canvas Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Play / Stop Animation Loop */}
                    <button
                      type="button"
                      onClick={handleToggleSimulationLoop}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${isSimulatingScroll
                          ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400"
                          : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white"
                        }`}
                      title={isSimulatingScroll ? "Pause Animation Loop" : "Play Continuous Reveal Loop"}
                    >
                      {isSimulatingScroll ? (
                        <>
                          <Pause className="w-3 h-3 fill-black text-black" />
                          <span>PAUSE LOOP</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-cyan-400" />
                          <span>PLAY LOOP</span>
                        </>
                      )}
                    </button>

                    {/* Interactive Scrub Simulator Slider */}
                    <div className="flex items-center bg-neutral-900 border border-cyan-800/80 px-2 py-1 rounded gap-1.5 text-[10px]">
                      <span className="text-cyan-300 font-bold hidden sm:inline">Scrub:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={peelRevealSimProgress}
                        onChange={(e) => {
                          if (isSimulatingScroll) {
                            setIsSimulatingScroll(false);
                            if (peelSimIntervalRef.current) clearInterval(peelSimIntervalRef.current);
                          }
                          setPeelRevealSimProgress(parseFloat(e.target.value));
                        }}
                        className="w-16 sm:w-24 accent-cyan-400 cursor-pointer h-1"
                        title="Interactive Scroll Trigger Simulation (0% to 100%)"
                      />
                      <span className="w-8 text-center font-bold text-cyan-400">{Math.round(peelRevealSimProgress * 100)}%</span>
                    </div>

                    {/* Phase Jump Shortcuts */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 p-0.5 rounded text-[10px]">
                      {[
                        { label: "0% INTRO", val: 0 },
                        { label: "35% SPLIT", val: 0.35 },
                        { label: "65% REVEAL", val: 0.65 },
                        { label: "85% ECHO", val: 0.85 },
                        { label: "100% FULL", val: 1 },
                      ].map((phase) => (
                        <button
                          key={phase.label}
                          type="button"
                          onClick={() => {
                            if (isSimulatingScroll) {
                              setIsSimulatingScroll(false);
                              if (peelSimIntervalRef.current) clearInterval(peelSimIntervalRef.current);
                            }
                            setPeelRevealSimProgress(phase.val);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${Math.abs(peelRevealSimProgress - phase.val) < 0.05
                              ? "bg-white text-black shadow-sm"
                              : "text-neutral-400 hover:text-white"
                            }`}
                        >
                          {phase.label}
                        </button>
                      ))}
                    </div>

                    {/* Model Photo Upload Trigger */}
                    <label className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-[10px] rounded flex items-center gap-1.5 cursor-pointer transition-all">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">REPLACE PHOTO</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePeelImageFileUpload}
                        disabled={isUploadingPeelImage}
                        className="hidden"
                      />
                    </label>

                    {/* Quick Save Live Button */}
                    <button
                      type="button"
                      onClick={handleSavePeelRevealConfig}
                      disabled={isSavingPeelReveal}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] uppercase tracking-widest rounded flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all ml-1"
                      title="Save and publish live to storefront"
                    >
                      {isSavingPeelReveal ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>SAVE LIVE</span>
                    </button>
                  </div>
                </div>

                {/* 1:1 Shared PeelReveal Component with Live Scrubber Animation */}
                <div className="relative w-full overflow-hidden border-b border-neutral-200" style={{ height: "500px" }}>
                  <PeelReveal
                    config={peelRevealConfig}
                    isEditable={true}
                    onUpdate={(patch) => setPeelRevealConfig((prev) => ({ ...prev, ...patch }))}
                    onImageUpload={handlePeelImageFileUpload}
                    adminProgress={peelRevealSimProgress}
                    className="peel-reveal-admin-preview select-text"
                    style={{ height: "500px", minHeight: "500px" }}
                  />

                  {/* Floating Depth Architecture Indicator */}
                  <div className="absolute bottom-2.5 left-3 z-30 bg-black/85 backdrop-blur-md text-neutral-200 px-3 py-1 text-[9px] font-mono tracking-widest uppercase border border-neutral-700 flex items-center gap-2 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>
                      MASK ECHO ARCHITECTURE: [1. BASE MODEL] → [2. {peelRevealConfig.maskLayersCount || 6}x REPEATING MASKS] → [3. SEQUENTIAL HEADLINE] → [4. SPLIT WORDS] • SCRUB: {Math.round(peelRevealSimProgress * 100)}%
                    </span>
                  </div>
                </div>

              </div>

              {/* 3. STUDIO CONTROL CONSOLE WITH 4 ORGANIZED TABS */}
              <div className="space-y-4">
                {/* Control Tabs Navigation */}
                <div className="bg-white border border-neutral-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm font-mono text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { id: "telemetry", label: "1. TELEMETRY & SPLIT WORDS", icon: SlidersHorizontal },
                      { id: "headline", label: "2. HEADLINE & SEQUENTIAL REVEAL", icon: Edit3 },
                      { id: "mask", label: "3. MODEL IMAGE & MASK ECHO", icon: Camera },
                      { id: "presets", label: "4. EDITORIAL PRESETS & ACTIONS", icon: Sliders },
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      const isActive = peelRevealControlTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPeelRevealControlTab(tab.id as any)}
                          className={`px-3 py-2 flex items-center gap-2 font-bold tracking-wider uppercase transition-all cursor-pointer ${isActive
                              ? "bg-black text-white shadow-sm"
                              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-black"
                            }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Master Section Toggle */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Section Status:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peelRevealConfig.isEnabled !== false}
                        onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, isEnabled: e.target.checked })}
                        className="accent-black cursor-pointer"
                      />
                      <span className={peelRevealConfig.isEnabled !== false ? "text-emerald-600 font-bold" : "text-neutral-400 font-bold"}>
                        {peelRevealConfig.isEnabled !== false ? "ENABLED" : "MUTED"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* TAB 1: TELEMETRY & SPLIT WORDS */}
                {peelRevealControlTab === "telemetry" && (
                  <div className="p-6 bg-white border border-neutral-200 shadow-sm space-y-6 font-mono text-xs animate-fadeIn">
                    <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-black flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-black" />
                          <span>TECHNICAL TELEMETRY & SPLIT WORDS PARAMETERS</span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Configure the header telemetry tags, status indicator, and the words that split horizontally across the viewport.
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400">[ LIVE SYNC ]</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Signal Type Tag (Top-Left):</label>
                        <input
                          type="text"
                          value={peelRevealConfig.signalType}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, signalType: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black uppercase font-mono shadow-sm"
                          placeholder="Signal type: Neutral"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Module ID Tag (Top-Right):</label>
                        <input
                          type="text"
                          value={peelRevealConfig.moduleId}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, moduleId: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black uppercase font-mono shadow-sm"
                          placeholder="Module ID: Nrmlss_001"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Status Tag (Bottom-Left):</label>
                        <input
                          type="text"
                          value={peelRevealConfig.status}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, status: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black uppercase font-mono shadow-sm"
                          placeholder="Status: Detached"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Left Split Word (Moves Left on Scroll):</label>
                        <input
                          type="text"
                          value={peelRevealConfig.splitWordLeft}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, splitWordLeft: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold text-base shadow-sm"
                          placeholder="Signal"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-700 mb-1 font-bold">Right Split Word (Moves Right on Scroll):</label>
                        <input
                          type="text"
                          value={peelRevealConfig.splitWordRight}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, splitWordRight: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black uppercase font-bold text-base shadow-sm"
                          placeholder="Motion"
                        />
                      </div>
                    </div>

                    {/* Split Distance Slider */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-neutral-700 font-bold">Horizontal Split Travel Distance:</label>
                        <span className="font-bold text-black bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                          {peelRevealConfig.splitDistancePercent || 55}% of Viewport Width
                        </span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="80"
                        step="1"
                        value={peelRevealConfig.splitDistancePercent || 55}
                        onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, splitDistancePercent: Number(e.target.value) })}
                        className="w-full accent-black cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                        <span>Compact (30vw)</span>
                        <span>Standard Atelier (55vw)</span>
                        <span>Full Outward Dispersal (80vw)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: HEADLINE & SEQUENTIAL REVEAL */}
                {peelRevealControlTab === "headline" && (
                  <div className="p-6 bg-white border border-neutral-200 shadow-sm space-y-6 font-mono text-xs animate-fadeIn">
                    <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-black flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-black" />
                          <span>EDITORIAL HEADLINE & WORD-BY-WORD REVEAL</span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          The giant headline sits behind the cutout model inside the expanding mask card, fading in sequentially between 60% and 90% scroll scrub.
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400">[ GSAP SEQUENTIAL OPACITY ]</span>
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1 font-bold">Headline Copy:</label>
                      <input
                        type="text"
                        value={peelRevealConfig.headline}
                        onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, headline: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 p-3 text-black focus:outline-none focus:border-black font-serif text-lg font-bold shadow-sm"
                        placeholder="The uniform holds no allegiance"
                      />
                    </div>

                    {/* Word-by-Word Live Opacity Monitor */}
                    <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                        <span>Live Word-by-Word Reveal Status at {Math.round(peelRevealSimProgress * 100)}% Scrub:</span>
                        <span className="text-black">
                          {peelRevealSimProgress < 0.6 ? "HIDDEN (Scrub < 60%)" : peelRevealSimProgress > 0.9 ? "FULLY VISIBLE (Scrub > 90%)" : "SEQUENCING IN"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(peelRevealConfig.headline || "The uniform holds no allegiance")
                          .split(" ")
                          .filter(Boolean)
                          .map((w, idx, arr) => {
                            const r = peelRevealSimProgress;
                            const total = arr.length;
                            const factor = (r - 0.6) / 0.3;
                            const start = idx / total;
                            const end = (idx + 1) / total;
                            let op = 0;
                            if (r >= 0.9) op = 1;
                            else if (r >= 0.6) {
                              if (factor >= end) op = 1;
                              else if (factor >= start) op = (factor - start) / (end - start);
                            }
                            return (
                              <div
                                key={idx}
                                className="px-3 py-1.5 border border-neutral-300 bg-white flex items-center gap-2 shadow-sm"
                              >
                                <span className="font-bold text-black">{w}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${op >= 0.9
                                      ? "bg-emerald-100 text-emerald-800"
                                      : op > 0.1
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-neutral-200 text-neutral-600"
                                    }`}
                                >
                                  {Math.round(op * 100)}%
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Text Color Presets */}
                    <div>
                      <label className="block text-neutral-700 mb-1.5 font-bold">Headline & Telemetry Text Palette:</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Default Monochrome", color: "" },
                          { label: "Slate Black (#0f0f0f)", color: "#0f0f0f" },
                          { label: "Dark Chrome (#1f2937)", color: "#1f2937" },
                          { label: "Tactical Red (#ef4444)", color: "#ef4444" },
                          { label: "Neon Signal (#84cc16)", color: "#84cc16" },
                        ].map((hue) => (
                          <button
                            key={hue.label}
                            type="button"
                            onClick={() => setPeelRevealConfig({ ...peelRevealConfig, textColor: hue.color })}
                            className={`px-3 py-1.5 rounded-none border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-2 ${(peelRevealConfig.textColor || "") === hue.color
                                ? "bg-black text-white border-black font-bold shadow-sm"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:text-black hover:bg-neutral-100"
                              }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-neutral-300"
                              style={{ backgroundColor: hue.color || "#0f0f0f" }}
                            />
                            <span>{hue.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MODEL IMAGE & MASK ECHO */}
                {peelRevealControlTab === "mask" && (
                  <div className="p-6 bg-white border border-neutral-200 shadow-sm space-y-6 font-mono text-xs animate-fadeIn">
                    <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-black flex items-center gap-2">
                          <Camera className="w-4 h-4 text-black" />
                          <span>MODEL IMAGE & REPEATING MASK LAYERS</span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Manage the cutout model photo, Cloudinary CDN asset upload, repeating mask layer count (1–8 layers), and background tone.
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400">[ CLOUDINARY CDN ]</span>
                    </div>

                    {/* Model Image Upload */}
                    <div className="space-y-3">
                      <label className="block text-neutral-700 font-bold">1. Upload Model Photo to Cloudinary CDN:</label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <label className="px-5 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2">
                          {isUploadingPeelImage ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                          <span>{isUploadingPeelImage ? "UPLOADING TO CDN..." : "UPLOAD PHOTO TO CLOUDINARY"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePeelImageFileUpload}
                            disabled={isUploadingPeelImage}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={peelRevealConfig.modelImage}
                          onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, modelImage: e.target.value })}
                          className="flex-1 bg-neutral-50 border border-neutral-200 p-2.5 text-black focus:outline-none focus:border-black font-mono text-xs shadow-sm"
                          placeholder="/peel-reveal/peel-reveal-img.jpg"
                        />
                      </div>
                    </div>

                    {/* Built-in Model Assets */}
                    <div className="space-y-2">
                      <label className="block text-neutral-700 font-bold">2. Quick Preset Model Choices:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Original Sunglasses Model", path: "/peel-reveal/peel-reveal-img.jpg" },
                          { label: "Hero Technical Overshirt", path: "/home/hero.png" },
                          { label: "Marquee Silhouette Cutout", path: "/marquee-banner/marquee_banner_01.png" },
                        ].map((asset) => (
                          <button
                            key={asset.path}
                            type="button"
                            onClick={() => setPeelRevealConfig({ ...peelRevealConfig, modelImage: asset.path })}
                            className={`p-3 rounded-none border text-left flex items-center justify-between transition-all cursor-pointer ${peelRevealConfig.modelImage === asset.path
                                ? "bg-black text-white border-black font-bold shadow-sm"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:text-black hover:bg-neutral-100"
                              }`}
                          >
                            <span>{asset.label}</span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${peelRevealConfig.modelImage === asset.path ? "bg-emerald-400" : "bg-neutral-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mask Layer Count */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-neutral-700 font-bold">3. Repeating Mask Echo Layers Count:</label>
                        <span className="font-bold text-black bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                          {peelRevealConfig.maskLayersCount || 6} Echo Layers
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={peelRevealConfig.maskLayersCount || 6}
                        onChange={(e) => setPeelRevealConfig({ ...peelRevealConfig, maskLayersCount: Number(e.target.value) })}
                        className="w-full accent-black cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                        <span>Minimal (1–2 layers)</span>
                        <span>Standard Drapza (6 layers)</span>
                        <span>Max Echo Depth (8 layers)</span>
                      </div>
                    </div>

                    {/* Background Palette */}
                    <div className="pt-2">
                      <label className="block text-neutral-700 mb-1.5 font-bold">4. Section Background Palette:</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Default Atelier (#edf1e8)", color: "#edf1e8" },
                          { label: "Bone White (#f5f5f1)", color: "#f5f5f1" },
                          { label: "Pure Minimal (#ffffff)", color: "#ffffff" },
                          { label: "Pitch Noir (#0a0a0a)", color: "#0a0a0a" },
                          { label: "Charcoal Matrix (#16181d)", color: "#16181d" },
                        ].map((theme) => (
                          <button
                            key={theme.label}
                            type="button"
                            onClick={() => setPeelRevealConfig({ ...peelRevealConfig, backgroundColor: theme.color })}
                            className={`px-3 py-1.5 rounded-none border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-2 ${(peelRevealConfig.backgroundColor || "#edf1e8") === theme.color
                                ? "bg-black text-white border-black font-bold shadow-sm"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:text-black hover:bg-neutral-100"
                              }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-neutral-300"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span>{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: 1-CLICK AESTHETIC PRESETS & GLOBAL ACTIONS */}
                {peelRevealControlTab === "presets" && (
                  <div className="p-6 bg-white border border-neutral-200 shadow-sm space-y-6 font-mono text-xs animate-fadeIn">
                    <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-black flex items-center gap-2">
                          <span>1-CLICK CURATED AESTHETIC PRESETS</span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Instantly transform typography, mask repetitions, split distances, and color palette with complete atelier presets.
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400">[ 4 CURATED STYLES ]</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          title: "DEFAULT ATELIER",
                          description: "Classic Drapza architectural silhouette, neutral off-white canvas, 6 echoing masks, 55% split.",
                          data: {
                            signalType: "Signal type: Neutral",
                            moduleId: "Module ID: Nrmlss_001",
                            status: "Status: Detached",
                            splitWordLeft: "Signal",
                            splitWordRight: "Motion",
                            headline: "The uniform holds no allegiance",
                            modelImage: "/peel-reveal/peel-reveal-img.jpg",
                            maskImage: "/peel-reveal/peel-reveal-img-mask.png",
                            maskLayersCount: 6,
                            backgroundColor: "#edf1e8",
                            textColor: "",
                            splitDistancePercent: 55,
                          },
                        },
                        {
                          title: "CYBER DISPATCH",
                          description: "Tactical quantum telemetry with bold cyber typography and 7 echoing mask layers.",
                          data: {
                            signalType: "SIGNAL TYPE: QUANTUM_01",
                            moduleId: "MODULE ID: CYBR_880",
                            status: "STATUS: ARMED",
                            splitWordLeft: "SYNAPSE",
                            splitWordRight: "VECTOR",
                            headline: "ARCHIVAL RUNWAY ACROSS SYSTEM NULL",
                            modelImage: "/peel-reveal/peel-reveal-img.jpg",
                            maskImage: "/peel-reveal/peel-reveal-img-mask.png",
                            maskLayersCount: 7,
                            backgroundColor: "#edf1e8",
                            textColor: "#0f0f0f",
                            splitDistancePercent: 60,
                          },
                        },
                        {
                          title: "SHIBUYA MONOCHROME",
                          description: "Raw Japanese streetwear aesthetic with uppercase monochrome tags and wide 65% split.",
                          data: {
                            signalType: "ATELIER SIGNAL // TOKYO",
                            moduleId: "BATCH: SHIBUYA_SS26",
                            status: "DISPATCH: READY",
                            splitWordLeft: "ATELIER",
                            splitWordRight: "SILENCE",
                            headline: "RAW UNIFORM HOLDS ZERO NOISE",
                            modelImage: "/peel-reveal/peel-reveal-img.jpg",
                            maskImage: "/peel-reveal/peel-reveal-img-mask.png",
                            maskLayersCount: 6,
                            backgroundColor: "#f5f5f1",
                            textColor: "#0f0f0f",
                            splitDistancePercent: 65,
                          },
                        },
                        {
                          title: "HERITAGE 480 GSM",
                          description: "Heavyweight French Terry presentation with muted palette and 5 subtle mask layers.",
                          data: {
                            signalType: "FABRIC: 480 GSM FRENCH TERRY",
                            moduleId: "ARCHIVE SPEC: 001",
                            status: "STATUS: CURATED",
                            splitWordLeft: "HEAVY",
                            splitWordRight: "STRUCTURE",
                            headline: "ENGINEERED DRAPE FOR MOVEMENT",
                            modelImage: "/peel-reveal/peel-reveal-img.jpg",
                            maskImage: "/peel-reveal/peel-reveal-img-mask.png",
                            maskLayersCount: 5,
                            backgroundColor: "#edf1e8",
                            textColor: "#1f2937",
                            splitDistancePercent: 50,
                          },
                        },
                      ].map((preset) => (
                        <div
                          key={preset.title}
                          className="p-4 border border-neutral-200 bg-neutral-50 flex flex-col justify-between space-y-3 hover:border-black transition-all"
                        >
                          <div>
                            <span className="font-bold text-black text-xs block">{preset.title}</span>
                            <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">{preset.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPeelRevealConfig((prev: any) => ({ ...prev, ...preset.data }));
                              setPeelRevealSaveStatus(`✓ Preset "${preset.title}" applied! Click 'Publish' to sync live.`);
                              setTimeout(() => setPeelRevealSaveStatus(null), 4000);
                            }}
                            className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all"
                          >
                            APPLY PRESET
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={handleResetPeelRevealConfig}
                        disabled={isResettingPeelReveal}
                        className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all"
                      >
                        {isResettingPeelReveal ? "RESETTING..." : "RESTORE FACTORY DEFAULTS"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSavePeelRevealConfig}
                        disabled={isSavingPeelReveal}
                        className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSavingPeelReveal ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                        <span>PUBLISH LIVE TO STOREFRONT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: SEO & GEO TOOLKIT */}
          {activeTab === "seo-geo" && <SeoGeoAdminTab />}

        </section>
      </div>

      {/* Global Modals */}
      <ProductCustomizerModal
        isOpen={productModalOpen}
        editingProductId={editingProductId}
        initialData={productForm as any}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        isSaving={isSavingProduct}
        errorMessage={productFormError}
      />

      <BulkProductModal
        isOpen={bulkProductModalOpen}
        onClose={() => setBulkProductModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Coupon Creation / Edit Modal with Zod Validation */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="bg-white text-black border border-neutral-300 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-black" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                    {editingCouponId ? "EDIT ATELIER VOUCHER" : "GENERATE NEW PROMO VOUCHER"}
                  </h3>
                </div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  [ LUXURY PRIVILEGE RULES ENGINE ]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {couponFormError && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-xs flex items-center gap-2 font-bold px-5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{couponFormError}</span>
              </div>
            )}

            {/* Modal Body Form */}
            <form
              onSubmit={handleSaveCoupon}
              noValidate
              className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {/* Row 1: Code & Discount Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Voucher Key Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => {
                      setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() });
                      if (couponFieldErrors.code) {
                        setCouponFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.code;
                          return n;
                        });
                      }
                    }}
                    placeholder="e.g. DRAPZA40"
                    className={`w-full bg-neutral-50 border p-2.5 uppercase font-bold text-black focus:outline-none focus:border-black ${couponFieldErrors.code ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                      }`}
                  />
                  {couponFieldErrors.code && (
                    <p className="text-[10px] text-red-600 mt-1">{couponFieldErrors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Discount Strategy <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full bg-neutral-50 border border-neutral-300 p-2.5 font-bold text-black focus:outline-none focus:border-black"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Currency Off (₹)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Discount Amount & Min Order Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    {couponForm.discountType === "percentage" ? "Percentage Deduction (%)" : "Flat Amount Off (₹)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={couponForm.discountType === "percentage" ? "90" : "50000"}
                    value={couponForm.discountAmount}
                    onChange={(e) => {
                      setCouponForm({ ...couponForm, discountAmount: Number(e.target.value) });
                      if (couponFieldErrors.discountAmount) {
                        setCouponFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.discountAmount;
                          return n;
                        });
                      }
                    }}
                    placeholder="e.g. 25"
                    className={`w-full bg-neutral-50 border p-2.5 font-bold text-black focus:outline-none focus:border-black ${couponFieldErrors.discountAmount ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                      }`}
                  />
                  {couponFieldErrors.discountAmount && (
                    <p className="text-[10px] text-red-600 mt-1">{couponFieldErrors.discountAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Minimum Cart Requirement (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.minOrderValue}
                    onChange={(e) => {
                      setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) });
                      if (couponFieldErrors.minOrderValue) {
                        setCouponFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.minOrderValue;
                          return n;
                        });
                      }
                    }}
                    placeholder="e.g. 1999"
                    className={`w-full bg-neutral-50 border p-2.5 font-bold text-black focus:outline-none focus:border-black ${couponFieldErrors.minOrderValue ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                      }`}
                  />
                  {couponFieldErrors.minOrderValue && (
                    <p className="text-[10px] text-red-600 mt-1">{couponFieldErrors.minOrderValue}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Max Cap & Per User Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Max Discount Cap (₹) [Optional]
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.maxDiscountAmount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })
                    }
                    placeholder="e.g. 2500"
                    className="w-full bg-neutral-50 border border-neutral-300 p-2.5 font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Per Client Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.perUserLimit}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, perUserLimit: Number(e.target.value) || 1 })
                    }
                    className="w-full bg-neutral-50 border border-neutral-300 p-2.5 font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Row 4: Expiration Date */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  Expiration Date [Leave blank for evergreen]
                </label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => {
                    setCouponForm({ ...couponForm, expiryDate: e.target.value });
                    if (couponFieldErrors.expiryDate) {
                      setCouponFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.expiryDate;
                        return n;
                      });
                    }
                  }}
                  className={`w-full bg-neutral-50 border p-2.5 font-bold text-black focus:outline-none focus:border-black ${couponFieldErrors.expiryDate ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                    }`}
                />
                {couponFieldErrors.expiryDate && (
                  <p className="text-[10px] text-red-600 mt-1">{couponFieldErrors.expiryDate}</p>
                )}
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-600 mb-1">
                  Client-Facing Voucher Note
                </label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => {
                    setCouponForm({ ...couponForm, description: e.target.value });
                    if (couponFieldErrors.description) {
                      setCouponFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.description;
                        return n;
                      });
                    }
                  }}
                  placeholder="e.g. VIP Access: 40% OFF all seasonal outerwear"
                  className={`w-full bg-neutral-50 border p-2.5 font-medium text-black focus:outline-none focus:border-black ${couponFieldErrors.description ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                    }`}
                />
                {couponFieldErrors.description && (
                  <p className="text-[10px] text-red-600 mt-1">{couponFieldErrors.description}</p>
                )}
              </div>

              {/* Row 6: Active Status */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active-toggle"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <label
                  htmlFor="coupon-active-toggle"
                  className="text-xs font-bold text-black uppercase cursor-pointer"
                >
                  Voucher is Active & Redeemable at Checkout
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 uppercase font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCoupon}
                  className="px-6 py-2 bg-black text-white hover:bg-neutral-800 uppercase font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  {isSavingCoupon ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCouponId ? "Save Changes" : "Create Voucher"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedThermalOrder && (
        <ThermalShippingLabelModal
          isOpen={!!selectedThermalOrder}
          onClose={() => setSelectedThermalOrder(null)}
          order={selectedThermalOrder}
        />
      )}

      {/* Centralized Atelier Luxury Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        variant={confirmDialog.variant}
        title={confirmDialog.title}
        subtitle={confirmDialog.subtitle}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        promptPlaceholder={confirmDialog.promptPlaceholder}
        initialPromptValue={confirmDialog.initialPromptValue}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* User Governance & Confirmation Modal (Delete / Terminate / Role) */}
      {userConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
          {/* Dimmed Blurred Backdrop */}
          <div
            onClick={() => {
              audioSystem.playClick(350, 0.05);
              setUserConfirmModal((prev) => ({ ...prev, isOpen: false }));
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Luxury Atelier Modal Card */}
          <div className="relative w-full max-w-md bg-[#121316] border border-[#26272e] rounded-none p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 transform transition-all duration-300 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#24252d]">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-none border ${userConfirmModal.type === "delete"
                    ? "bg-red-950/40 border-red-800/60 text-red-500"
                    : userConfirmModal.type === "terminate"
                      ? "bg-amber-950/40 border-amber-800/60 text-amber-400"
                      : "bg-neutral-800 border-neutral-700 text-white"
                    }`}
                >
                  {userConfirmModal.type === "delete" ? (
                    <Trash2 className="w-5 h-5" />
                  ) : userConfirmModal.type === "terminate" ? (
                    <LogOut className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-mono text-[10px] text-neutral-400 tracking-widest uppercase block mb-0.5">
                    {userConfirmModal.type === "delete"
                      ? "[ PURGE PROTOCOL ]"
                      : userConfirmModal.type === "terminate"
                        ? "[ SESSION REVOCATION ]"
                        : "[ ACCESS CONTROL ]"}
                  </span>
                  <h3 className="font-mono text-base sm:text-lg uppercase tracking-tight text-white font-bold">
                    {userConfirmModal.type === "delete"
                      ? "PURGE CLIENT PROFILE"
                      : userConfirmModal.type === "terminate"
                        ? "TERMINATE SESSION"
                        : "UPDATE CLIENT ROLE"}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(350, 0.05);
                  setUserConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="text-neutral-400 hover:text-white p-1.5 rounded-none hover:bg-[#1c1d24] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Client Profile Card */}
            <div className="p-3 bg-[#18191f] border border-[#26272e] rounded-none space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                TARGET CLIENT
              </div>
              <div className="font-mono text-sm font-bold text-white">
                {userConfirmModal.userName || "Unnamed User"}
              </div>
              {userConfirmModal.userEmail && (
                <div className="font-mono text-xs text-neutral-400">
                  {userConfirmModal.userEmail}
                </div>
              )}
              {userConfirmModal.currentRole && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">CURRENT ROLE:</span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 ${userConfirmModal.currentRole === "admin"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-neutral-800 text-neutral-300"
                      }`}
                  >
                    {userConfirmModal.currentRole}
                  </span>
                </div>
              )}
            </div>

            {/* Explanatory Warning Message */}
            <p className="font-mono text-xs text-neutral-300 leading-relaxed">
              {userConfirmModal.type === "delete"
                ? "Are you sure you want to permanently purge this client profile from the database? This action cannot be undone."
                : userConfirmModal.type === "terminate"
                  ? "This will invalidate all active authorization tokens for this client, forcing an instant logout across all connected devices."
                  : `Are you sure you want to change this client's role to ${(userConfirmModal.targetRole || "user").toUpperCase()}?`}
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#24252d]">
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(400, 0.04);
                  setUserConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2.5 rounded-none bg-[#1c1d24] hover:bg-[#252731] border border-[#2b2c36] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={() => {
                  audioSystem.playSuccess();
                  handleExecuteUserConfirmModal();
                }}
                className={`px-6 py-2.5 rounded-none font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${userConfirmModal.type === "delete"
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40"
                  : userConfirmModal.type === "terminate"
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-white hover:bg-neutral-200 text-black shadow-white/10"
                  }`}
              >
                {userConfirmModal.type === "delete" ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>EXPUNGE CLIENT</span>
                  </>
                ) : userConfirmModal.type === "terminate" ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>TERMINATE SESSION</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>APPLY ROLE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISITOR RADAR DOSSIER & SATELLITE INTELLIGENCE MODAL */}
      {/* ========================================================================= */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
          {/* Dimmed Blurred Backdrop */}
          <div
            onClick={() => {
              audioSystem.playClick(350, 0.05);
              setSelectedVisitor(null);
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Luxury Atelier Modal Card */}
          <div className="relative w-full max-w-2xl bg-[#121316] border border-[#26272e] rounded-none p-6 sm:p-7 shadow-2xl shadow-black/90 space-y-5 transform transition-all duration-300 animate-scaleUp max-h-[92vh] overflow-y-auto font-mono text-neutral-300">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#24252d]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-none bg-black border border-[#333540] text-white">
                  <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-neutral-400 tracking-widest uppercase block mb-0.5">
                    [ LIVE SATELLITE TELEMETRY DOSSIER ]
                  </span>
                  <h3 className="font-mono text-base sm:text-lg uppercase tracking-tight text-white font-bold">
                    VISITOR INTELLIGENCE PROFILE
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(350, 0.05);
                  setSelectedVisitor(null);
                }}
                className="text-neutral-400 hover:text-white p-1.5 rounded-none hover:bg-[#1c1d24] transition-colors cursor-pointer"
                title="Close Dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identity Strip */}
            <div className="p-4 bg-[#18191f] border border-[#26272e] rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${selectedVisitor.userType === "guest"
                        ? "bg-neutral-800 border-neutral-700 text-neutral-300"
                        : "bg-white text-black border-white"
                      }`}
                  >
                    {selectedVisitor.userType === "guest" ? "ANONYMOUS GUEST" : "REGISTERED CLIENT"}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {selectedVisitor.userName || (selectedVisitor.userType === "guest" ? "Guest Visitor" : "Member")}
                  </span>
                </div>
                {selectedVisitor.userEmail && (
                  <div className="text-xs text-neutral-400">
                    {selectedVisitor.userEmail}
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">LOGGED AT</div>
                <div className="text-xs text-neutral-300">
                  {new Date(selectedVisitor.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  })}
                </div>
              </div>
            </div>

            {/* 4 Detail Panels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Panel 1: IP & Network Signature */}
              <div className="p-4 bg-[#15161c] border border-[#23242c] rounded-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-neutral-400" />
                    <span>NETWORK & IP TELEMETRY</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyIp(selectedVisitor.ip)}
                    className="px-2 py-0.5 rounded-none bg-[#202129] hover:bg-black text-[10px] text-neutral-300 hover:text-white border border-[#2e303b] transition-all cursor-pointer flex items-center gap-1"
                  >
                    {copiedIp === selectedVisitor.ip ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY IP</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white tracking-wider">
                    {selectedVisitor.ip || "Unknown IP"}
                  </div>
                  <div className="text-[10px] text-neutral-500 break-all">
                    Session: {selectedVisitor.sessionId || "Direct Client Connection"}
                  </div>
                </div>
              </div>

              {/* Panel 2: Geolocation & Address */}
              <div className="p-4 bg-[#15161c] border border-[#23242c] rounded-none space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>GEOLOCATION & POSTAL FIX</span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    {selectedVisitor.city || "Unknown City"}, {selectedVisitor.state || "State"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {selectedVisitor.country || "India"} {selectedVisitor.postalCode ? `• PIN ${selectedVisitor.postalCode}` : ""}
                  </div>
                  {selectedVisitor.formattedAddress && (
                    <div className="text-[10px] text-neutral-500 leading-relaxed line-clamp-2" title={selectedVisitor.formattedAddress}>
                      {selectedVisitor.formattedAddress}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel 3: Satellite GPS Fix */}
              <div className="p-4 bg-[#15161c] border border-[#23242c] rounded-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-neutral-400" />
                    <span>SATELLITE GPS FIX</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border ${selectedVisitor.precisionType === "GPS_HIGH_ACCURACY"
                        ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}
                  >
                    {selectedVisitor.precisionType === "GPS_HIGH_ACCURACY" ? "100% GPS VERIFIED" : "IP ESTIMATE"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-white">
                    {Number(selectedVisitor.latitude).toFixed(6)}°, {Number(selectedVisitor.longitude).toFixed(6)}°
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Confidence radius: ±{selectedVisitor.accuracy || 15} meters
                  </div>
                </div>
              </div>

              {/* Panel 4: Hardware & Browser Signature */}
              <div className="p-4 bg-[#15161c] border border-[#23242c] rounded-none space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                  {selectedVisitor.deviceType?.toLowerCase().includes("mobile") ? (
                    <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>CLIENT ENVIRONMENT</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    {selectedVisitor.deviceType || "Desktop Device"}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Browser: {selectedVisitor.browser || "Standard Webkit"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    OS: {selectedVisitor.os || "Unknown OS"}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#24252d] flex-wrap">
              <a
                href={`https://www.google.com/maps?q=${selectedVisitor.latitude},${selectedVisitor.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-none bg-[#1c1d24] hover:bg-[#252731] border border-[#2b2c36] text-white font-mono text-xs uppercase tracking-wider font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>OPEN SATELLITE MAP</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedVisitor, null, 2));
                    setCopiedIp("JSON");
                    audioSystem.playClick(900);
                    setTimeout(() => setCopiedIp(null), 2500);
                  }}
                  className="px-4 py-2.5 rounded-none bg-[#1c1d24] hover:bg-[#252731] border border-[#2b2c36] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedIp === "JSON" ? "COPIED JSON" : "EXPORT JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick(350, 0.05);
                    setSelectedVisitor(null);
                  }}
                  className="px-5 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navCategories={navCategories}
        onSyncVault={fetchData}
        isSyncing={refreshing}
        orderCount={orders.length}
        productCount={products.length}
      />

      {/* Floating Smooth Scroll HUD Pill */}
      <AdminScrollHud onScrollPage={handleScrollPage} />
    </div>
  );
}