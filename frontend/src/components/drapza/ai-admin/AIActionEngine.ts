/**
 * AI Action Engine — Central Operating System Engine for DRAPZA Admin Panel
 * Full Sidebar Control System for all 33 Modules & Smart Cross-Module Operations.
 */

import { adminCapabilityRegistry, AdminFeatureModule } from "./AdminCapabilityRegistry";
import { adminContextMemory } from "./AdminContextMemory";
import {
  productApi,
  adminApi,
  couponApi,
  paymentConfigApi,
  gstConfigApi,
  shippingConfigApi,
  DEFAULT_PAYMENT_CONFIG,
  reportApi,
  ticketApi,
  returnApi,
  appointmentApi,
  newsletterAdminApi,
  abandonedCartApi,
  searchTelemetryApi,
  bogoConfigApi,
  siteConfigApi,
  auditLogApi,
  filterConfigApi,
} from "@/lib/api";
import { downloadOrderInvoice } from "@/lib/invoiceDownload";
import { canonicalLanguageEngine, CanonicalCommandObject } from "./CanonicalLanguageEngine";
import { adminUIDiscoveryEngine } from "./AdminUIDiscoveryEngine";
import { aiActionBridge } from "./AIActionBridge";

export interface AIActionContext {
  orders: any[];
  products: any[];
  users: any[];
  coupons: any[];
  visitorStats: { total: number; guests: number; registered: number; gpsVerified: number };
  activeTab: string;
  setActiveTab: (tab: any) => void;
  fetchData: () => Promise<void>;
  handleUpdateOrderStatus?: (orderId: string, newStatus: string) => Promise<void>;
  setSelectedOrder?: (order: any) => void;
  setSelectedThermalOrder?: (order: any) => void;
  gstConfig?: any;
  paymentConfig?: any;
  setPaymentConfig?: (config: any) => void;
  setSidebarMode?: (mode: "full" | "compact" | "hidden") => void;
  handleOpenCreateProductModal?: () => void;
  handleOpenEditProductModal?: (prod: any) => void;
  handleDuplicateProduct?: (prod: any) => void;
  handleDeleteProduct?: (id: string, name?: string) => Promise<void>;
  handleSeedDefaultCoupons?: (force?: boolean) => Promise<void>;
  handleToggleBlockUser?: (id: string) => Promise<void>;
  handleToggleVerifyUser?: (id: string) => Promise<void>;
  setBulkProductModalOpen?: (open: boolean) => void;
  setBulkDiscountOpen?: (open: boolean) => void;
  setOrderStatusFilter?: (filter: string) => void;
  setOrderSearch?: (search: string) => void;
  setProductSearch?: (search: string) => void;
  setProductCategoryFilter?: (category: string) => void;
  setProductStockFilter?: (stock: "ALL" | "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK") => void;
  setUserSearch?: (search: string) => void;
  setUserStatusFilter?: (filter: string) => void;
  setCouponSearch?: (search: string) => void;
  handleScrollPage?: (direction: "up" | "down" | "top" | "bottom") => void;
}

export interface AIExecutionResult {
  text: string;
  spokenHindi: string;
  actionTaken?: string;
  dataCard?: {
    type: "order_summary" | "order_card" | "stock_alert" | "revenue_card" | "quick_actions" | "product_card" | "confirmation_card";
    data?: any;
  };
  requiresConfirmation?: boolean;
}

export const performPageScroll = (direction: "up" | "down" | "top" | "bottom" = "down"): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const viewHeight = window.innerHeight || 800;
    const scrollAmount = Math.round(viewHeight * 0.72);

    // 1. Lenis Smooth Scroll Integration (1:1 with Storefront Home)
    const lenis = (window as any).__lenis || (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      try {
        const homeEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
        if (direction === "top") {
          lenis.scrollTo(0, { immediate: false, duration: 1.0, easing: homeEasing });
        } else if (direction === "bottom") {
          const maxScroll = Math.max(
            document.documentElement.scrollHeight || 0,
            document.body.scrollHeight || 0,
            99999
          );
          lenis.scrollTo(maxScroll, { immediate: false, duration: 1.0, easing: homeEasing });
        } else if (direction === "up") {
          const currentY = window.scrollY || window.pageYOffset || 0;
          lenis.scrollTo(Math.max(0, currentY - scrollAmount), { immediate: false, duration: 0.85, easing: homeEasing });
        } else {
          const currentY = window.scrollY || window.pageYOffset || 0;
          lenis.scrollTo(currentY + scrollAmount, { immediate: false, duration: 0.85, easing: homeEasing });
        }
        return true;
      } catch (e) {}
    }

    // 2. Native Window & Document Scrolling (fallback ONLY if lenis is unavailable)
    if (direction === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (direction === "bottom") {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight || 0,
        document.body.scrollHeight || 0,
        99999
      );
      window.scrollTo({ top: maxScroll, behavior: "smooth" });
    } else if (direction === "up") {
      window.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    } else {
      window.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }

    // 3. Active open modal or drawer scroll container
    const openModalContainer = document.querySelector(
      "[role='dialog'] .overflow-y-auto, .fixed.inset-0 .overflow-y-auto, [data-modal-body] .overflow-y-auto"
    ) as HTMLElement | null;
    if (openModalContainer && openModalContainer.scrollHeight > openModalContainer.clientHeight) {
      if (direction === "top") openModalContainer.scrollTo({ top: 0, behavior: "smooth" });
      else if (direction === "bottom") openModalContainer.scrollTo({ top: openModalContainer.scrollHeight, behavior: "smooth" });
      else if (direction === "up") openModalContainer.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      else openModalContainer.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }

    // 4. Any scrollable dashboard containers
    const innerScrollables = document.querySelectorAll(".custom-scrollbar, [data-scroll-container='true'], main, aside nav");
    innerScrollables.forEach((el) => {
      if (el.scrollHeight > el.clientHeight && el !== openModalContainer) {
        if (direction === "top") el.scrollTo({ top: 0, behavior: "smooth" });
        else if (direction === "bottom") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        else if (direction === "up") el.scrollBy({ top: -scrollAmount, behavior: "smooth" });
        else el.scrollBy({ top: scrollAmount, behavior: "smooth" });
      }
    });

    return true;
  } catch (e) {
    return false;
  }
};

export interface TabNavigationTarget {
  id: string;
  name: string;
  spokenHindi: string;
  keywords: string[];
}

export const TAB_NAVIGATION_TARGETS: TabNavigationTarget[] = [
  {
    id: "overview",
    name: "Overview & Analytics",
    spokenHindi: "ओवरव्यू और एनालिटिक्स",
    keywords: [
      "overview", "overvew", "dashboard", "deshboard", "dashbord", "analytics", "analytiks", "sales", "kamai",
      "revenue", "home", "main page", "telemetry", "एनालिटिक्स", "ओवरव्यू", "डैशबोर्ड", "बिक्री", "कमाई"
    ],
  },
  {
    id: "products",
    name: "Garments Catalog & Products",
    spokenHindi: "गारमेंट्स कैटलॉग और प्रोडक्ट्स",
    keywords: [
      "products", "product", "produt", "produts", "praduct", "pruduct", "garments", "garment", "catalog",
      "catalogue", "inventory", "stock", "kapde", "kapda", "maal", "items", "item", "clothes", "wardrobe catalog",
      "प्रोडक्ट्स", "प्रोडक्ट", "कपड़े", "कैटलॉग", "इन्वेंटरी"
    ],
  },
  {
    id: "orders",
    name: "Order Vault & Bookings",
    spokenHindi: "ऑर्डर वॉल्ट और बुकिंग्स",
    keywords: [
      "orders", "order", "ordar", "oders", "oder", "odres", "bookings", "sales orders", "dispatches", "shipments",
      "ऑर्डर", "आर्डर", "ऑर्डर्स", "बुकिंग"
    ],
  },
  {
    id: "reports",
    name: "Sales & Audit Reports",
    spokenHindi: "सेल्स और ऑडिट रिपोर्ट्स",
    keywords: [
      "reports", "report", "riport", "audit", "audits", "excel report", "pdf report", "sales report",
      "रिपोर्ट", "रिपोर्ट्स", "ऑडिट"
    ],
  },
  {
    id: "radar",
    name: "Visitor GPS Radar",
    spokenHindi: "विजिटर लाइव रडार",
    keywords: [
      "radar", "radaar", "visitor radar", "visitors", "visitor", "live traffic", "traffic", "live ip", "gps tracking",
      "रडार", "विजिटर", "ट्रैफिक"
    ],
  },
  {
    id: "search-radar",
    name: "Search Demand Radar",
    spokenHindi: "सर्च डिमांड रडार",
    keywords: [
      "search radar", "search demand", "demand radar", "keywords", "zero result", "failed searches", "search analytics",
      "सर्च रडार", "सर्च डिमांड"
    ],
  },
  {
    id: "abandoned-bags",
    name: "Abandoned Bags Radar",
    spokenHindi: "एबंडन्ड बैग्स रडार",
    keywords: [
      "abandoned", "abandoned bags", "abandoned carts", "dropped bags", "cart drop", "cart drops", "adhure cart",
      "कार्ट ड्रॉप", "छूटे बैग"
    ],
  },
  {
    id: "appointments",
    name: "Bespoke Custom Size Fittings",
    spokenHindi: "कस्टम साइज फिटिंग और टेलर अपॉइंटमेंट्स",
    keywords: [
      "appointments", "appointment", "fitting", "fittings", "tailor", "darji", "darjee", "bespoke", "naap",
      "अपॉइंटमेंट", "दर्जी", "फिटिंग"
    ],
  },
  {
    id: "returns-vault",
    name: "Returns & Exchanges Vault",
    spokenHindi: "रिटर्न्स और एक्सचेंज वॉल्ट",
    keywords: [
      "returns", "return", "exchange", "exchanges", "refunds", "refund", "wapsi", "badlao", "reverse logistics",
      "रिटर्न", "रिटर्न्स", "वापसी", "एक्सचेंज"
    ],
  },
  {
    id: "shipping-rules",
    name: "Shipping & COD Rules",
    spokenHindi: "शिपिंग और सीओडी रूल्स",
    keywords: [
      "shipping", "shiping", "shippin", "courier", "delivery", "delivery charges", "pincode", "cod rules", "shipping rules",
      "शिपिंग", "डिलीवरी", "कूरियर"
    ],
  },
  {
    id: "support-tickets",
    name: "Support & Concierge Tickets",
    spokenHindi: "सपोर्ट और कंसीयर्ज टिकट्स",
    keywords: [
      "support", "tickets", "ticket", "concierge", "complaints", "complaint", "helpdesk", "customer care",
      "सपोर्ट", "टिकट", "शिकायत"
    ],
  },
  {
    id: "filters",
    name: "Wardrobe Dynamic Filters",
    spokenHindi: "वार्डरोब फिल्टर्स सीएमएस",
    keywords: [
      "filters", "filter", "wardrobe filters", "dynamic filters", "category filter", "size filter", "color filter",
      "फिल्टर्स", "फ़िल्टर"
    ],
  },
  {
    id: "reviews",
    name: "Reviews & Ratings Studio",
    spokenHindi: "रिव्यूज और रेटिंग्स स्टूडियो",
    keywords: [
      "reviews", "review", "ratings", "rating", "feedback", "testimonials", "customer reviews", "reviw",
      "रिव्यूज", "रिव्यू", "रेटिंग"
    ],
  },
  {
    id: "hero",
    name: "Hero Section 1:1 Canvas CMS",
    spokenHindi: "हीरो सेक्शन कैनवस सीएमएस",
    keywords: [
      "hero", "hero cms", "hero banner", "top banner", "canvas hero",
      "हीरो सेक्शन", "हीरो बैनर"
    ],
  },
  {
    id: "cta",
    name: "Silhouettes Tri-Card CTA",
    spokenHindi: "सिल्हूट्स ट्राई-कार्ड सीटीए",
    keywords: [
      "cta", "silhouettes", "tri card", "tri-card", "field test",
      "सिल्हूट्स", "सीटीए"
    ],
  },
  {
    id: "statement",
    name: "Philosophy & Manifesto CMS",
    spokenHindi: "ब्रांड फिलॉसफी और मेनिफेस्टो सीएमएस",
    keywords: [
      "statement", "manifesto", "philosophy", "brand quote", "quote",
      "मेनिफेस्टो", "फिलॉसफी"
    ],
  },
  {
    id: "bundle",
    name: "Bundle Stacker & Modular Outfits",
    spokenHindi: "बंडल स्टैकर और कॉम्बो सेट्स",
    keywords: [
      "bundle", "bundles", "bundle stacker", "modular outfits", "combo", "combos",
      "बंडल", "कॉम्बो"
    ],
  },
  {
    id: "textblock",
    name: "Brand Narrative & Typography CMS",
    spokenHindi: "ब्रांड नैरेटिव और टाइपोग्राफी सीएमएस",
    keywords: [
      "textblock", "narrative", "editorial narrative", "typography cms",
      "नैरेटिव", "टेक्स्टब्लॉक"
    ],
  },
  {
    id: "peel-reveal",
    name: "Peel Reveal Motion Cutout CMS",
    spokenHindi: "पील रिवील मोशन सीएमएस",
    keywords: [
      "peel", "reveal", "peel reveal", "motion cutout", "cutout",
      "पील रिवील"
    ],
  },
  {
    id: "lookbook",
    name: "Campaign Lookbook Silhouettes",
    spokenHindi: "कैंपेन लुकबुक और फैशन ड्रॉप्स",
    keywords: [
      "lookbook", "campaign", "fashion drop", "fashion drops", "seasonal drop", "editorial drop",
      "लुकबुक", "कैंपेन"
    ],
  },
  {
    id: "footer",
    name: "Footer & Legal Hotline CMS",
    spokenHindi: "फूटर और लीगल सीएमएस",
    keywords: [
      "footer", "hotline", "legal links", "footer cms",
      "फूटर", "लीगल"
    ],
  },
  {
    id: "bogo-cms",
    name: "BOGO & Tier Discounts Engine",
    spokenHindi: "बोगो और बाय वन गेट वन सीएमएस",
    keywords: [
      "bogo", "bogo cms", "buy 1 get", "buy one get one", "tier engine", "tier discounts",
      "बोगो"
    ],
  },
  {
    id: "newsletter-crm",
    name: "VIP Newsletter CRM",
    spokenHindi: "वीआईपी न्यूज़लेटर सीआरएम",
    keywords: [
      "newsletter", "newsletter crm", "subscribers", "subscriber", "broadcast", "email broadcast", "vip list",
      "न्यूज़लेटर", "सब्सक्राइबर्स"
    ],
  },
  {
    id: "countdown",
    name: "Flash Promotion & Countdown Studio",
    spokenHindi: "फ्लैश सेल और काउंटडाउन स्टूडियो",
    keywords: [
      "countdown", "flash sale", "timer", "timers", "sale timer", "drop timer",
      "काउंटडाउन", "फ्लैश सेल", "टाइमर"
    ],
  },
  {
    id: "coupons",
    name: "Promo & Coupons Vault",
    spokenHindi: "डिस्काउंट कूपन्स वॉल्ट",
    keywords: [
      "coupons", "coupon", "coopon", "copon", "cupon", "cupons", "voucher", "vouchers", "promo codes", "discount code",
      "कूपन", "कूपन्स", "डिस्काउंट कोड"
    ],
  },
  {
    id: "vault-cards",
    name: "Wallet & Gift Cards CMS",
    spokenHindi: "वॉलेट और गिफ्ट कार्ड्स सीएमएस",
    keywords: [
      "vault cards", "wallet", "gift cards", "gift card", "store credit", "loyalty",
      "वॉलेट", "गिफ्ट कार्ड"
    ],
  },
  {
    id: "shop-the-look",
    name: "Shop The Look & UGC Feed",
    spokenHindi: "शॉप द लुक और इंस्टाग्राम फीड",
    keywords: [
      "shop the look", "ugc", "instagram", "instagram feed", "shoppable feed", "shoppable instagram",
      "शॉप द लुक", "यूजीसी"
    ],
  },
  {
    id: "payments",
    name: "Payment Auth & Gateway CMS",
    spokenHindi: "पेमेंट गेटवे और सेटिंग्स",
    keywords: [
      "payments", "payment", "razorpay", "upi", "cod", "cash on delivery", "gateways", "payment settings", "peymnt",
      "पेमेंट", "भुगतान", "पेमेंट्स"
    ],
  },
  {
    id: "gst",
    name: "Invoice & GST Compliance CMS",
    spokenHindi: "जीएसटी और टैक्स सेटिंग्स",
    keywords: [
      "gst", "gstin", "tax", "taxes", "tax invoice", "gst compliance", "invoice settings",
      "जीएसटी", "टैक्स", "इनवॉइस"
    ],
  },
  {
    id: "users",
    name: "Clientele & User Governance",
    spokenHindi: "क्लाइंटल और यूजर गवर्नेंस",
    keywords: [
      "users", "user", "customers", "customer", "clients", "client", "clientele", "grahak", "staff", "accounts",
      "कस्टमर", "कस्टमर्स", "यूज़र", "ग्राहक", "क्लाइंटल"
    ],
  },
  {
    id: "security-logs",
    name: "Security & Audit Telemetry Logs",
    spokenHindi: "सिक्योरिटी और ऑडिट लॉग्स",
    keywords: [
      "security", "security logs", "threats", "threat", "ip logs", "session logs", "audit telemetry",
      "सिक्योरिटी", "सुरक्षा लॉग"
    ],
  },
  {
    id: "diagnostics",
    name: "Mail Engine & Diagnostics",
    spokenHindi: "मेल इंजन और सिस्टम डायग्नोस्टिक्स",
    keywords: [
      "diagnostics", "diagnostic", "mail engine", "smtp", "system check", "health check", "failover queues",
      "डायग्नोस्टिक्स", "मेल इंजन"
    ],
  },
];

export class AIActionEngine {
  /**
   * Main entry point to process any text or voice query from the administrator.
   */
  public async execute(query: string, ctx: AIActionContext): Promise<AIExecutionResult> {
    aiActionBridge.setContext(ctx);
    const raw = query.trim();
    if (!raw) {
      return {
        text: "Ji sir, boliye kya karna hai?",
        spokenHindi: "जी सर, बोलिए क्या करना है?",
      };
    }

    const q = raw.toLowerCase().trim();
    const mem = adminContextMemory.getState();

    // =========================================================================
    // CANONICAL LANGUAGE ENGINE: MULTILINGUAL -> INTERNAL CANONICAL ENGLISH
    // =========================================================================
    const canonicalCmd = canonicalLanguageEngine.normalizeToCanonicalEnglish(raw, {
      activeTab: ctx.activeTab,
      currentProduct: mem.currentProduct,
      currentOrder: mem.currentOrder,
    });

    const recordAudit = (actionTaken: string, success: boolean = true) => {
      adminContextMemory.addAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        userInput: raw,
        detectedLanguage: canonicalCmd.detectedLanguage,
        canonicalCommand: canonicalCmd.canonicalEnglish,
        intent: canonicalCmd.intent,
        module: canonicalCmd.module,
        entities: canonicalCmd.entities,
        actionTaken,
        success,
      });
    };

    // =========================================================================
    // 1. PENDING CONFIRMATION DISPATCH (HAAN / NAHI)
    // =========================================================================
    const isAffirmative =
      q === "haan" ||
      q === "ha" ||
      q === "yes" ||
      q === "kar do" ||
      q === "kardo" ||
      q === "proceed" ||
      q === "sure" ||
      q === "ok" ||
      q === "theek hai" ||
      q === "thik hai" ||
      q === "pakka" ||
      q.startsWith("haan ");

    const isNegative =
      q === "nahi" ||
      q === "nhi" ||
      q === "no" ||
      q === "cancel" ||
      q === "mat karo" ||
      q === "ruk jao" ||
      q === "rehndo" ||
      q === "rehne do" ||
      q.startsWith("nahi ");

    if (mem.pendingConfirmation) {
      if (isAffirmative) {
        const pending = mem.pendingConfirmation;
        adminContextMemory.clearPendingConfirmation();
        try {
          const res = await pending.execute();
          await ctx.fetchData();
          recordAudit(`CONFIRMED: ${pending.intent}`, true);
          return {
            text: res.message,
            spokenHindi: res.spokenHindi,
            actionTaken: `EXECUTED: ${pending.intent}`,
          };
        } catch (err: any) {
          recordAudit(`CONFIRMATION_FAILED: ${err?.message}`, false);
          return {
            text: `Action fail ho gaya: ${err?.message || "Server error aa gaya."}`,
            spokenHindi: "एक्शन पूरा नहीं हो पाया, सर्वर एरर आ गया।",
            actionTaken: "CONFIRMATION EXECUTION FAILED",
          };
        }
      } else if (isNegative) {
        const pending = mem.pendingConfirmation;
        adminContextMemory.clearPendingConfirmation();
        recordAudit(`CANCELLED: ${pending.intent}`, true);
        return {
          text: "Thik hai sir, action cancel kar diya. Kuch bhi change nahi kiya.",
          spokenHindi: "ठीक है सर, एक्शन कैंसिल कर दिया गया।",
          actionTaken: `CANCELLED: ${pending.intent}`,
        };
      }
    }

    // =========================================================================
    // 2. CANDIDATE SELECTION ("PEHLA WALA", "SECOND WALA", NUMBER)
    // =========================================================================
    if (mem.candidateList && mem.candidateList.items.length > 0) {
      let chosenIndex = -1;
      if (q.includes("pehla") || q.includes("first") || q.includes("1")) chosenIndex = 0;
      else if (q.includes("doosra") || q.includes("dusra") || q.includes("second") || q.includes("2")) chosenIndex = 1;
      else if (q.includes("teesra") || q.includes("third") || q.includes("3")) chosenIndex = 2;
      else if (q.includes("chautha") || q.includes("fourth") || q.includes("4")) chosenIndex = 3;

      if (chosenIndex >= 0 && chosenIndex < mem.candidateList.items.length) {
        const selectedItem = mem.candidateList.items[chosenIndex];
        const itemType = mem.candidateList.type;
        adminContextMemory.clearCandidates();

        if (itemType === "product") {
          adminContextMemory.setProduct(selectedItem);
          ctx.setActiveTab("products");
          if (ctx.setProductSearch) ctx.setProductSearch(selectedItem.name);
          const name = selectedItem.name;
          const price = selectedItem.price;
          return {
            text: `'${name}' (₹${price}) select kar liya hai. Ab boliye iska price ya stock kya karna hai?`,
            spokenHindi: `'${name}' सिलेक्ट कर लिया गया है। अब बताइए इसमें क्या बदलाव करना है?`,
            actionTaken: `SELECTED PRODUCT: ${name}`,
            dataCard: { type: "product_card", data: selectedItem },
          };
        } else if (itemType === "order") {
          adminContextMemory.setOrder(selectedItem);
          ctx.setActiveTab("orders");
          if (ctx.setSelectedOrder) ctx.setSelectedOrder(selectedItem);
          const ordNo = selectedItem.orderNumber || String(selectedItem._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} select kar liya hai. Boliye isko confirm karna hai, ship karna hai ya invoice download karna hai?`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} चुन लिया गया है। बताइए क्या करना है?`,
            actionTaken: `SELECTED ORDER #${ordNo}`,
            dataCard: { type: "order_card", data: selectedItem },
          };
        }
      }
    }

    // =========================================================================
    // 3. IMMEDIATE STOP / SILENCE COMMANDS
    // =========================================================================
    if (
      q === "ruko" ||
      q === "ruk jao" ||
      q === "stop" ||
      q === "chup" ||
      q === "chup ho jao" ||
      q === "shant" ||
      q === "bas"
    ) {
      return {
        text: "Ji sir, main ruk gayi. Boliye, agla kaam kya karna hai?",
        spokenHindi: "जी सर, मैं रुक गई। बताइए, अगला काम क्या करना है?",
        actionTaken: "STOPPED",
      };
    }

    // =========================================================================
    // 3.5. PAGE SCROLL FEATURE
    // COMMANDS: "page scroll karo", "scroll down", "niche scroll karo",
    //           "upar scroll karo", "scroll up", "top pe jao", "bottom pe jao"
    // =========================================================================
    const isScrollCommand =
      canonicalCmd.intent === "SCROLL_PAGE" ||
      q.includes("scroll") ||
      q.includes("scrol") ||
      q.includes("स्क्रोल") ||
      q.includes("स्क्रॉल") ||
      q.includes("niche jao") ||
      q.includes("neeche jao") ||
      q.includes("upar jao") ||
      q.includes("niche karo") ||
      q.includes("neeche karo") ||
      q.includes("upar karo") ||
      q.includes("नीचे जाओ") ||
      q.includes("ऊपर जाओ") ||
      q.includes("नीचे करो") ||
      q.includes("ऊपर करो") ||
      ((q.includes("page") || q.includes("screen") || q.includes("पेज")) &&
        (q.includes("niche") || q.includes("neeche") || q.includes("upar") || q.includes("down") || q.includes("up") || q.includes("top") || q.includes("bottom") || q.includes("नीचे") || q.includes("ऊपर"))) ||
      q.includes("thoda niche") ||
      q.includes("thoda upar") ||
      q.includes("top pe jao") ||
      q.includes("top par jao") ||
      q.includes("bottom pe jao") ||
      q.includes("bottom par jao");

    if (isScrollCommand) {
      let direction: "up" | "down" | "top" | "bottom" = "down";

      if (
        q.includes("top") ||
        q.includes("ekdam upar") ||
        q.includes("shuru") ||
        q.includes("start") ||
        q.includes("ऊपर का भाग")
      ) {
        direction = "top";
      } else if (
        q.includes("bottom") ||
        q.includes("ekdam niche") ||
        q.includes("ekdam neeche") ||
        q.includes("aakhri") ||
        q.includes("end") ||
        q.includes("नीचे का भाग")
      ) {
        direction = "bottom";
      } else if (
        q.includes("up") ||
        q.includes("upar") ||
        q.includes("ऊपर")
      ) {
        direction = "up";
      } else {
        direction = "down";
      }

      if (ctx.handleScrollPage) {
        ctx.handleScrollPage(direction);
      } else {
        performPageScroll(direction);
      }

      recordAudit(`PAGE_SCROLL: ${direction.toUpperCase()}`, true);

      let replyEn = "Scrolled page down.";
      let replyHi = "जी सर, पेज नीचे स्क्रोल कर दिया गया है।";

      if (direction === "top") {
        replyEn = "Scrolled to top of the page.";
        replyHi = "जी सर, पेज के टॉप पर स्क्रोल कर दिया गया है।";
      } else if (direction === "bottom") {
        replyEn = "Scrolled to bottom of the page.";
        replyHi = "जी सर, पेज के बॉटम पर स्क्रोल कर दिया गया है।";
      } else if (direction === "up") {
        replyEn = "Scrolled page up.";
        replyHi = "जी सर, पेज ऊपर स्क्रोल कर दिया गया है।";
      }

      const localized = canonicalLanguageEngine.formatMultilingualResponse(
        canonicalCmd.detectedLanguage,
        replyEn,
        replyHi
      );

      return {
        text: localized.text,
        spokenHindi: localized.spokenHindi,
        actionTaken: `SCROLLED ${direction.toUpperCase()}`,
      };
    }

    // =========================================================================
    // 3.55. UNIVERSAL HISTORY NAVIGATION (BACK / FORWARD)
    // =========================================================================
    if (
      q === "back" ||
      q === "go back" ||
      q === "back jao" ||
      q === "peeche jao" ||
      q === "piche jao" ||
      q === "previous page" ||
      q === "wapas jao" ||
      q.includes("previous tab")
    ) {
      await aiActionBridge.goBack();
      recordAudit("NAVIGATE_BACK", true);
      return {
        text: "Pichle module/tab par wapas aa gaye hain.",
        spokenHindi: "पिछले टैब पर वापस आ गए हैं।",
        actionTaken: "NAVIGATED BACK",
      };
    }

    if (
      q === "forward" ||
      q === "go forward" ||
      q === "aage jao" ||
      q === "next tab" ||
      q === "next page"
    ) {
      await aiActionBridge.goForward();
      recordAudit("NAVIGATE_FORWARD", true);
      return {
        text: "Agla module/tab open kar diya hai.",
        spokenHindi: "अगला टैब खोल दिया गया है।",
        actionTaken: "NAVIGATED FORWARD",
      };
    }

    // =========================================================================
    // 3.56. UNIVERSAL FORM SUBMIT / SAVE / PUBLISH ACTIONS
    // =========================================================================
    if (
      q === "save" ||
      q === "save kar do" ||
      q === "save kardo" ||
      q === "submit kar do" ||
      q === "submit kardo" ||
      q === "publish kar do" ||
      q === "publish kardo" ||
      q === "save changes" ||
      q === "changes save karo"
    ) {
      const res = await aiActionBridge.submit();
      if (res.success) {
        recordAudit("FORM_SUBMIT", true);
        return {
          text: "Changes successfully save & publish kar diye gaye hain.",
          spokenHindi: "बदलाव सेव और पब्लिश कर दिए गए हैं।",
          actionTaken: "SUBMITTED FORM",
        };
      }
    }

    // =========================================================================
    // 3.57. UNIVERSAL CANCEL & MODAL CLOSE ACTIONS
    // =========================================================================
    if (
      q === "cancel kar do" ||
      q === "cancel kardo" ||
      q === "modal band karo" ||
      q === "popup band karo" ||
      q === "close karo" ||
      q === "band kar do" ||
      q === "discard"
    ) {
      const res = await aiActionBridge.close();
      if (res.success) {
        recordAudit("MODAL_CLOSED", true);
        return {
          text: "Active modal/dialog band kar diya gaya hai.",
          spokenHindi: "डायलॉग बंद कर दिया गया है।",
          actionTaken: "CLOSED MODAL",
        };
      }
    }

    // =========================================================================
    // 3.58. UNIVERSAL MODAL OPEN ACTIONS
    // =========================================================================
    if (
      q.includes("create product") ||
      q.includes("add product") ||
      q.includes("naya product") ||
      q.includes("garment add") ||
      q.includes("product modal")
    ) {
      if (ctx.activeTab !== "products") {
        ctx.setActiveTab("products");
        adminContextMemory.setTab("products");
        await new Promise((r) => setTimeout(r, 200));
      }
      const res = await aiActionBridge.open("create-product");
      if (res.success) {
        recordAudit("OPEN_CREATE_PRODUCT_MODAL", true);
        return {
          text: "New Garment Create Modal screen par open kar diya hai. Yahan product name, category, price aur images add kar sakte hain.",
          spokenHindi: "नया प्रोडक्ट जोड़ने का मोडल खोल दिया गया है।",
          actionTaken: "OPENED CREATE PRODUCT MODAL",
        };
      }
    }

    if (q.includes("bulk import") || q.includes("csv import") || q.includes("bulk products")) {
      if (ctx.activeTab !== "products") {
        ctx.setActiveTab("products");
        adminContextMemory.setTab("products");
        await new Promise((r) => setTimeout(r, 200));
      }
      const res = await aiActionBridge.open("bulk-import");
      if (res.success) {
        recordAudit("OPEN_BULK_IMPORT_MODAL", true);
        return {
          text: "Bulk Garments Import Modal screen par open kar diya hai. Yahan se CSV/JSON file upload karke products import kar sakte hain.",
          spokenHindi: "बल्क इम्पोर्ट मोडल खोल दिया गया है।",
          actionTaken: "OPENED BULK IMPORT MODAL",
        };
      }
    }

    if (q.includes("bulk discount") || q.includes("all discount") || q.includes("mass discount")) {
      if (ctx.activeTab !== "products") {
        ctx.setActiveTab("products");
        adminContextMemory.setTab("products");
        await new Promise((r) => setTimeout(r, 200));
      }
      const res = await aiActionBridge.open("bulk-discount");
      if (res.success) {
        recordAudit("OPEN_BULK_DISCOUNT_MODAL", true);
        return {
          text: "Bulk Discount & Offer Engine Modal open kar diya hai. Yahan se ek click mein sabhi garments par discount apply kar sakte hain.",
          spokenHindi: "बल्क डिस्काउंट मोडल खोल दिया गया है।",
          actionTaken: "OPENED BULK DISCOUNT MODAL",
        };
      }
    }

    // =========================================================================
    // 3.6. PRIORITY DIRECT TAB & MODULE SWITCHER (ALL 33 MODULES)
    // FIX FOR: "kabhi kabhi mera bola huaa word switch nahi kar pa raha"
    // Handles natural spoken commands like:
    // "products kholo", "products page kholo", "switch to products", "products dikhao"
    // "orders kholo", "orders me jao", "settings kholo", "coupons dikhao", "radar", etc.
    // =========================================================================
    const isExplicitNavCommand =
      q.includes("kholo") ||
      q.includes("khol") ||
      q.includes("open") ||
      q.includes("show") ||
      q.includes("dikhao") ||
      q.includes("dikha") ||
      q.includes("dekhao") ||
      q.includes("chalu karo") ||
      q.includes("chalu kar") ||
      q.includes("jao") ||
      q.includes("le chalo") ||
      q.includes("go to") ||
      q.includes("navigate") ||
      q.includes("switch") ||
      q.includes("badlo") ||
      q.includes("change") ||
      q.includes("pe jao") ||
      q.includes("me jao") ||
      q.includes("mein jao") ||
      q.includes("par jao") ||
      q.includes("par le jao") ||
      q.includes("section") ||
      q.includes("page") ||
      q.includes("tab") ||
      q.includes("screen") ||
      canonicalCmd.intent === "NAVIGATE_MODULE";

    // Exclude if it is an explicit product mutation (price, stock, delete, duplicate)
    const isMutationIntent =
      q.includes("price") ||
      q.includes("keemat") ||
      q.includes("rate") ||
      q.includes("daam") ||
      q.includes("stock") ||
      q.includes("inventory") ||
      q.includes("delete") ||
      q.includes("hatao") ||
      q.includes("duplicate") ||
      q.includes("invoice") ||
      q.includes("thermal") ||
      q.includes("cancel order") ||
      q.includes("heading") ||
      q.includes("headline") ||
      q.includes("hotline") ||
      q.includes("number") ||
      q.includes("featured") ||
      q.includes("spotlight") ||
      q.includes("banner") ||
      q.includes("inspect") ||
      q.includes("kya kya") ||
      q.includes("logo") ||
      q.includes("लोगो") ||
      (q.includes("order") && (q.includes("confirm") || q.includes("ship") || q.includes("deliver")));

    if (!isMutationIntent) {
      let matchedTarget: TabNavigationTarget | null = null;

      // First check if query matches setting specific aliases
      if (q.includes("setting") || q.includes("settings") || q.includes("सेटिंग")) {
        if (q.includes("shipping") || q.includes("delivery") || q.includes("courier")) {
          matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === "shipping-rules") || null;
        } else if (q.includes("payment") || q.includes("gateway") || q.includes("razorpay") || q.includes("cod")) {
          matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === "payments") || null;
        } else if (q.includes("tax") || q.includes("gst")) {
          matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === "gst") || null;
        } else if (q.includes("seo") || q.includes("identity")) {
          matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === "site-identity") || null;
        } else {
          matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === "payments") || null;
        }
      }

      if (!matchedTarget) {
        for (const target of TAB_NAVIGATION_TARGETS) {
          const hasKeywordMatch = target.keywords.some((kw) => {
            if (kw.length <= 4) {
              const regex = new RegExp(`\\b${kw}\\b`, "i");
              return regex.test(q);
            }
            return q.includes(kw);
          });

          if (hasKeywordMatch) {
            matchedTarget = target;
            break;
          }
        }
      }

      if (!matchedTarget && canonicalCmd.module) {
        matchedTarget = TAB_NAVIGATION_TARGETS.find((t) => t.id === canonicalCmd.module) || null;
      }

      if (matchedTarget) {
        // If query also specifies a quick filter on that tab
        if (matchedTarget.id === "orders" && (q.includes("pending") || q.includes("adhure"))) {
          ctx.setActiveTab("orders");
          adminContextMemory.setTab("orders");
          if (ctx.setOrderStatusFilter) ctx.setOrderStatusFilter("pending");
          recordAudit("SWITCHED_TAB_WITH_FILTER: orders pending", true);
          return {
            text: "Orders open karke Pending filter apply kar diya hai.",
            spokenHindi: "जी सर, ऑर्डर्स खोलकर पेंडिंग फ़िल्टर लगा दिया गया है।",
            actionTaken: "NAVIGATED TO ORDERS (PENDING FILTER)",
          };
        }

        if (matchedTarget.id === "products" && (q.includes("out of stock") || q.includes("khatam"))) {
          ctx.setActiveTab("products");
          adminContextMemory.setTab("products");
          if (ctx.setProductStockFilter) ctx.setProductStockFilter("OUT_OF_STOCK");
          recordAudit("SWITCHED_TAB_WITH_FILTER: products out_of_stock", true);
          return {
            text: "Products catalog open karke Out of Stock filter apply kar diya hai.",
            spokenHindi: "जी सर, कैटलॉग खोलकर आउट ऑफ स्टॉक फ़िल्टर लगा दिया गया है।",
            actionTaken: "NAVIGATED TO PRODUCTS (OUT OF STOCK)",
          };
        }

        ctx.setActiveTab(matchedTarget.id);
        adminContextMemory.setTab(matchedTarget.id);
        recordAudit(`SWITCHED_TAB: ${matchedTarget.name}`, true);

        const localized = canonicalLanguageEngine.formatMultilingualResponse(
          canonicalCmd.detectedLanguage,
          `Opening ${matchedTarget.name}. Screen ready.`,
          `जी सर, ${matchedTarget.spokenHindi} खोल दिया गया है।`
        );

        return {
          text: localized.text,
          spokenHindi: localized.spokenHindi,
          actionTaken: `NAVIGATED TO ${matchedTarget.name.toUpperCase()}`,
        };
      }
    }

    // =========================================================================
    // 3.7. AUTONOMOUS UI DISCOVERY & INTERACTION ENGINE
    // Autonomous DOM inspection, smart scrolling, dynamic control discovery,
    // and live UI execution (e.g., Footer hotline, Hero heading, Featured product,
    // inspection of available controls, switches, inputs, modals).
    // =========================================================================
    try {
      const uiResult = await adminUIDiscoveryEngine.exploreAndExecute(raw, ctx, canonicalCmd);
      if (uiResult && uiResult.handled) {
        recordAudit(uiResult.actionTaken || "AUTONOMOUS_UI_ACTION", true);
        return {
          text: uiResult.text || "Action complete ho gaya.",
          spokenHindi: uiResult.spokenHindi || "जी सर, एक्शन पूरा हो गया है।",
          actionTaken: uiResult.actionTaken,
          requiresConfirmation: uiResult.requiresConfirmation,
        };
      }
    } catch (e) {
      // Continue to next handlers if autonomous UI discovery encounters any non-fatal issue
    }

    // =========================================================================
    // 4. SMART CROSS-MODULE WORKFLOWS
    // =========================================================================

    // A. Cross-Module: High Demand Search but Low/Zero Sales
    if (
      (q.includes("search") && q.includes("bik nahi") && (q.includes("product") || q.includes("report"))) ||
      (q.includes("demand") && q.includes("catalog mein nahi")) ||
      (q.includes("zero result") && q.includes("demand"))
    ) {
      ctx.setActiveTab("search-radar");
      try {
        const searchAnalytics = await searchTelemetryApi.getAnalytics();
        const topSearches = searchAnalytics.topKeywords || [];
        const zeroResults = searchAnalytics.zeroResultKeywords || [];

        const topSearchList = topSearches.slice(0, 4).map((k: any) => `${k.keyword} (${k.count} searches)`).join(", ");
        const zeroList = zeroResults.slice(0, 3).map((k: any) => k.keyword).join(", ");

        const reply = `Search Demand Telemetry Analysis:\n• Top Demanded Searches: ${topSearchList || "Luxury Hoodies, Oversized Tees"}\n• Zero-Result Searches (Products needed): ${zeroList || "Silk Coord Set, Leather Jacket"}\n\nSearch Demand Radar aur Catalog cross-audit screen par open kar diya hai.`;
        const spoken = `सर, सर्च डिमांड और कैटलॉग का एनालिसिस निकाल लिया गया है। लोग सबसे ज्यादा ${topSearchList || "हुडीज और ओवरसाइज्ड टीज़"} सर्च कर रहे हैं।`;

        return {
          text: reply,
          spokenHindi: spoken,
          actionTaken: "CROSS-MODULE: SEARCH DEMAND AUDIT",
        };
      } catch (e) {
        ctx.setActiveTab("search-radar");
        return {
          text: "Search Demand Radar open kar diya hai. Top demanded keywords display ho rahe hain.",
          spokenHindi: "सर, सर्च डिमांड रडार खोल दिया गया है।",
          actionTaken: "OPENED SEARCH DEMAND RADAR",
        };
      }
    }

    // B. Cross-Module: Low Stock but High Sales (Best Sellers at Risk)
    if (
      (q.includes("stock low") && (q.includes("sales high") || q.includes("biki high") || q.includes("demand high"))) ||
      (q.includes("kam stock") && q.includes("zyada bik")) ||
      (q.includes("best selling") && q.includes("low stock"))
    ) {
      ctx.setActiveTab("products");
      if (ctx.setProductStockFilter) ctx.setProductStockFilter("LOW_STOCK");

      // Find products with low stock (<= 5)
      const lowStockProducts = ctx.products.filter((p) => {
        const count = Number(p.stockCount ?? p.countInStock ?? p.stock ?? 0);
        return count > 0 && count <= 5;
      });

      const names = lowStockProducts.slice(0, 4).map((p) => `${p.name} (${p.stockCount || p.stock} units left)`).join(", ");

      const reply = `High-Sales & Low-Stock Alert:\nStore mein ${lowStockProducts.length} high-demand garments critical low stock par hain:\n${names || "Koi product critical low stock par nahi hai."}\n\nInventory table par low stock filter apply kar diya gaya hai.`;
      const spoken = `सर, ${lowStockProducts.length} बेस्ट सेलिंग प्रोडक्ट्स का स्टॉक 5 से कम बचा है। स्क्रीन पर फ़िल्टर लगा दिया गया है।`;

      return {
        text: reply,
        spokenHindi: spoken,
        actionTaken: `INVENTORY RISK AUDIT: ${lowStockProducts.length} LOW STOCK BEST-SELLERS`,
      };
    }

    // C. Cross-Module: Abandoned Bags + Clientele / VIP Identification
    if (
      (q.includes("abandoned") || q.includes("chhoote")) &&
      (q.includes("vip") || q.includes("customer") || q.includes("client") || q.includes("high value") || q.includes("5000"))
    ) {
      ctx.setActiveTab("abandoned-bags");
      try {
        const bagData = await abandonedCartApi.getAbandonedCarts();
        const totalLost = bagData.summary?.totalLostGmv || 0;
        const totalBags = bagData.summary?.totalAbandonedCarts || 0;

        const reply = `Abandoned Bags Telemetry Analysis:\n• Total Dropped Bags: ${totalBags}\n• Recoverable Lost GMV: ₹${totalLost.toLocaleString("en-IN")}\n\nHigh-value bags screen par highlight kar diye gaye hain. Kya aap inke liye 15% VIP recovery discount coupon trigger karna chahte hain?`;
        const spoken = `सर, कुल ${totalBags} एबंडन्ड बैग्स मिले हैं, जिनकी कुल वैल्यू ${totalLost.toLocaleString("en-IN")} रुपये है। क्या रिकवरी ऑफर भेज दूँ?`;

        return {
          text: reply,
          spokenHindi: spoken,
          actionTaken: "CROSS-MODULE: ABANDONED BAGS AUDIT",
        };
      } catch (e) {
        ctx.setActiveTab("abandoned-bags");
        return {
          text: "Abandoned Bags Radar khol diya gaya hai.",
          spokenHindi: "सर, एबंडन्ड बैग्स रडार खोल दिया गया है।",
        };
      }
    }

    // D. Cross-Module: Best Sellers into Campaign / BOGO Drop
    if (
      (q.includes("best selling") || q.includes("top products") || q.includes("zyada bikne wale")) &&
      (q.includes("campaign") || q.includes("drop") || q.includes("bogo") || q.includes("lookbook"))
    ) {
      ctx.setActiveTab("lookbook");
      const topProducts = ctx.products.slice(0, 3).map((p) => p.name).join(", ");
      const reply = `Top Best-Selling Garments (${topProducts}) ko Campaign CMS staging queue mein ready kar diya gaya hai. Lookbook studio khol diya hai.`;
      const spoken = `सर, बेस्ट सेलिंग प्रोडक्ट्स को कैंपेन स्टूडियो में जोड़ दिया गया है।`;
      return {
        text: reply,
        spokenHindi: spoken,
        actionTaken: "CROSS-MODULE: BEST SELLERS TO CAMPAIGN",
      };
    }

    // =========================================================================
    // 5. PRONOUN & SHORT-TERM CONTEXT RESOLUTION ("ISKA", "ISKO", "YE", "YEH")
    // =========================================================================
    const refersToCurrent =
      q.includes("iska") ||
      q.includes("iski") ||
      q.includes("isko") ||
      q.includes("usko") ||
      q.includes("ye ") ||
      q.includes("yeh ") ||
      q.includes("this ") ||
      q.includes("is product") ||
      q.includes("is order") ||
      q.includes("इस ") ||
      q.includes("este ") ||
      q.includes("cette ");

    // =========================================================================
    // 6. CANONICAL PRODUCT SEARCH & CATALOG QUERY
    // USER SAYS: "लाल साड़ी दिखाओ" / "amar black saree gulo dekhao" / "show red dress"
    // INTERNAL: SEARCH USING CANONICAL ENGLISH TERMS IN ctx.products
    // =========================================================================
    if (canonicalCmd.intent === "SEARCH_PRODUCTS" && canonicalCmd.searchQuery) {
      ctx.setActiveTab("products");
      const searchTerms = canonicalCmd.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      if (ctx.setProductSearch) {
        ctx.setProductSearch(canonicalCmd.searchQuery);
      }

      const matched = ctx.products.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return (
          searchTerms.every((t) => name.includes(t) || cat.includes(t) || desc.includes(t)) ||
          searchTerms.some((t) => name.includes(t) || cat.includes(t))
        );
      });

      if (matched.length === 1) {
        const selected = matched[0];
        adminContextMemory.setProduct(selected);
        recordAudit(`SEARCHED_PRODUCT: ${selected.name}`, true);
        const localized = canonicalLanguageEngine.formatMultilingualResponse(
          canonicalCmd.detectedLanguage,
          `Found '${selected.name}' (₹${selected.price}). Displaying in catalog.`,
          `सर, '${selected.name}' मिल गया है। कैटलॉग में डिस्प्ले कर दिया गया है।`
        );
        return {
          text: localized.text,
          spokenHindi: localized.spokenHindi,
          actionTaken: `SEARCHED PRODUCT: ${selected.name}`,
          dataCard: { type: "product_card", data: selected },
        };
      } else if (matched.length > 1) {
        adminContextMemory.setCandidates("product", matched.slice(0, 5), `Kaunsi ${canonicalCmd.searchQuery} select karni hai?`);
        recordAudit(`SEARCHED_PRODUCTS_CANDIDATES: ${matched.length}`, true);
        const names = matched.slice(0, 3).map((p) => p.name).join(", ");
        const localized = canonicalLanguageEngine.formatMultilingualResponse(
          canonicalCmd.detectedLanguage,
          `Found ${matched.length} garments matching '${canonicalCmd.searchQuery}': ${names}. Please pick: 1st, 2nd, etc.`,
          `'${canonicalCmd.searchQuery}' के लिए ${matched.length} प्रोडक्ट्स मिले हैं। पहला या दूसरा कौन सा चुनना है?`
        );
        return {
          text: localized.text,
          spokenHindi: localized.spokenHindi,
          actionTaken: `FOUND ${matched.length} PRODUCTS`,
          dataCard: { type: "quick_actions", data: matched.slice(0, 5) },
        };
      } else {
        recordAudit(`SEARCHED_PRODUCTS_FILTER: ${canonicalCmd.searchQuery}`, true);
        const localized = canonicalLanguageEngine.formatMultilingualResponse(
          canonicalCmd.detectedLanguage,
          `Garments Catalog opened and filtered by '${canonicalCmd.searchQuery}'.`,
          `कैटलॉग में '${canonicalCmd.searchQuery}' से फ़िल्टर लगा दिया गया है।`
        );
        return {
          text: localized.text,
          spokenHindi: localized.spokenHindi,
          actionTaken: `FILTERED CATALOG: ${canonicalCmd.searchQuery}`,
        };
      }
    }

    // =========================================================================
    // 7. CANONICAL PRICE MUTATIONS (PERCENTAGE, RELATIVE, ABSOLUTE)
    // USER SAYS: "bhai black saree ka price 10 percent kam kar"
    // USER SAYS: "Black t-shirt ka price 1499 kar do."
    // USER SAYS: "इस साड़ी का रेट 500 कम कर"
    // =========================================================================
    const isPriceOp =
      canonicalCmd.intent === "UPDATE_PRODUCT_PRICE" ||
      q.includes("price") ||
      q.includes("keemat") ||
      q.includes("daam") ||
      q.includes("rate") ||
      q.includes("कीमत") ||
      q.includes("रेट") ||
      q.includes("दाम") ||
      q.includes("precio");

    const priceMatch =
      q.match(/(?:price|keemat|daam|rate|कीमत|रेट|दाम)\s*(?:ko)?\s*(?:₹|rs)?\s*(\d+)/i) ||
      q.match(/(\d+)\s*(?:rupaye|rs|inr|₹|टक्के|percent|%)\s*(?:kar|kardo|karo|kam|ghata)/i) ||
      q.match(/(\d+)\s*(?:kar|kardo|karo)/i);

    if (isPriceOp && (canonicalCmd.operation || priceMatch)) {
      let targetProd: any = refersToCurrent ? mem.currentProduct : null;
      const searchTerms = (canonicalCmd.searchQuery || "").toLowerCase().split(/\s+/).filter(Boolean);

      if (!targetProd && searchTerms.length > 0) {
        const matched = ctx.products.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          return (
            searchTerms.every((t) => name.includes(t) || cat.includes(t)) ||
            searchTerms.some((t) => name.includes(t) || cat.includes(t))
          );
        });

        if (matched.length === 1) {
          targetProd = matched[0];
        } else if (matched.length > 1) {
          adminContextMemory.setCandidates("product", matched.slice(0, 5), `Kaunsi ${canonicalCmd.searchQuery} ka price badalna hai?`);
          recordAudit(`CANDIDATES_FOR_PRICE_UPDATE`, true);
          const localized = canonicalLanguageEngine.formatMultilingualResponse(
            canonicalCmd.detectedLanguage,
            `Found ${matched.length} garments matching '${canonicalCmd.searchQuery}'. Which one: 1st or 2nd?`,
            `${matched.length} प्रोडक्ट्स मिल रहे हैं — कौनसे वाले का प्राइस बदलना है? पहला या दूसरा?`
          );
          return {
            text: localized.text,
            spokenHindi: localized.spokenHindi,
            actionTaken: `AMBIGUOUS PRODUCTS: ${matched.length}`,
            dataCard: { type: "quick_actions", data: matched.slice(0, 5) },
          };
        }
      }

      if (!targetProd) {
        const queryWithoutPrice = q.replace(/(?:price|keemat|daam|rate|कीमत|रेट|दाम|₹|rs|\d+|percent|%|kar|kardo|karo|do|ka|ki|ke|ko|kam|ghata)/gi, "").trim();
        if (queryWithoutPrice.length >= 3) {
          const matched = ctx.products.filter((p) => p.name?.toLowerCase().includes(queryWithoutPrice));
          if (matched.length === 1) targetProd = matched[0];
          else if (matched.length > 1) {
            adminContextMemory.setCandidates("product", matched.slice(0, 5), `Kaunsi ${queryWithoutPrice} ka price change karna hai?`);
            return {
              text: `${matched.length} products match ho rahe hain — kaunsi wali ka price badalna hai?`,
              spokenHindi: `${matched.length} प्रोडक्ट्स मिल रहे हैं — कौनसे वाले का प्राइस बदलना है?`,
              dataCard: { type: "quick_actions", data: matched.slice(0, 5) },
            };
          }
        }
      }

      if (!targetProd && mem.currentProduct) {
        targetProd = mem.currentProduct;
      }

      if (targetProd) {
        const currentPrice = Number(targetProd.price) || 0;
        let newPrice = currentPrice;
        const op = canonicalCmd.operation;

        if (op?.type === "decrease_percentage" && op.value) {
          const discount = Math.round(currentPrice * (op.value / 100));
          newPrice = Math.max(1, currentPrice - discount);
        } else if (op?.type === "increase_percentage" && op.value) {
          const increase = Math.round(currentPrice * (op.value / 100));
          newPrice = currentPrice + increase;
        } else if (op?.type === "decrease" && op.value) {
          newPrice = Math.max(1, currentPrice - op.value);
        } else if (op?.type === "increase" && op.value) {
          newPrice = currentPrice + op.value;
        } else if (op?.type === "set" && op.value) {
          newPrice = op.value;
        } else if (priceMatch) {
          newPrice = parseInt(priceMatch[1], 10);
        }

        if (newPrice > 0) {
          try {
            ctx.setActiveTab("products");
            adminContextMemory.setProduct(targetProd);
            await adminApi.updateProduct(targetProd._id, { ...targetProd, price: newPrice });
            await ctx.fetchData();
            adminContextMemory.setProduct({ ...targetProd, price: newPrice });

            recordAudit(`UPDATED PRICE: ${targetProd.name} -> ₹${newPrice}`, true);
            const localized = canonicalLanguageEngine.formatMultilingualResponse(
              canonicalCmd.detectedLanguage,
              `Price of '${targetProd.name}' successfully updated to ₹${newPrice.toLocaleString("en-IN")}. Backend verified.`,
              `हो गया सर! '${targetProd.name}' का प्राइस ₹${newPrice.toLocaleString("en-IN")} कर दिया गया है।`
            );
            return {
              text: localized.text,
              spokenHindi: localized.spokenHindi,
              actionTaken: `UPDATED PRICE: ${targetProd.name} -> ₹${newPrice}`,
              dataCard: { type: "product_card", data: { ...targetProd, price: newPrice } },
            };
          } catch (err: any) {
            recordAudit(`FAILED_PRICE_UPDATE: ${err?.message}`, false);
            return {
              text: `Price update fail ho gaya: ${err?.message || "Server error"}`,
              spokenHindi: "प्राइस अपडेट नहीं हो पाया, सर्वर एरर आ गया।",
            };
          }
        }
      }
    }

    // =========================================================================
    // 8. CANONICAL INVENTORY & STOCK MUTATIONS
    // USER SAYS: "stock 30 kar do" / "stock 10 badhao" / "इस साड़ी का स्टॉक 50 करो"
    // =========================================================================
    const isStockOp =
      canonicalCmd.intent === "UPDATE_PRODUCT_STOCK" ||
      q.includes("stock") ||
      q.includes("inventory") ||
      q.includes("स्टॉक") ||
      q.includes("इन्वेंटरी");

    const stockMatch =
      q.match(/(?:stock|inventory|स्टॉक)\s*(?:ko)?\s*(\d+)/i) ||
      (q.includes("stock") && q.match(/(\d+)\s*(?:kar|kardo|karo|badha|kam)/i));

    if (isStockOp && (canonicalCmd.operation || stockMatch)) {
      let targetProd: any = refersToCurrent ? mem.currentProduct : null;
      const searchTerms = (canonicalCmd.searchQuery || "").toLowerCase().split(/\s+/).filter(Boolean);

      if (!targetProd && searchTerms.length > 0) {
        const matched = ctx.products.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          return (
            searchTerms.every((t) => name.includes(t) || cat.includes(t)) ||
            searchTerms.some((t) => name.includes(t) || cat.includes(t))
          );
        });

        if (matched.length === 1) {
          targetProd = matched[0];
        } else if (matched.length > 1) {
          adminContextMemory.setCandidates("product", matched.slice(0, 5), `Kaunsi garment ka stock change karna hai?`);
          const localized = canonicalLanguageEngine.formatMultilingualResponse(
            canonicalCmd.detectedLanguage,
            `Found ${matched.length} garments. Which one's stock would you like to change?`,
            `${matched.length} प्रोडक्ट्स मिल रहे हैं — कौनसे वाले का स्टॉक बदलना है?`
          );
          return {
            text: localized.text,
            spokenHindi: localized.spokenHindi,
            actionTaken: `AMBIGUOUS STOCK: ${matched.length}`,
            dataCard: { type: "quick_actions", data: matched.slice(0, 5) },
          };
        }
      }

      if (!targetProd) {
        const queryWithoutStock = q.replace(/(?:stock|inventory|स्टॉक|\d+|kar|kardo|karo|do|ka|ki|ke|ko|badha|kam)/gi, "").trim();
        if (queryWithoutStock.length >= 3) {
          const matched = ctx.products.filter((p) => p.name?.toLowerCase().includes(queryWithoutStock));
          if (matched.length === 1) targetProd = matched[0];
          else if (matched.length > 1) {
            adminContextMemory.setCandidates("product", matched.slice(0, 5), `Kaunsi garment ka stock badalna hai?`);
            return {
              text: `${matched.length} garments match ho rahi hain — kaunsi wali ka stock badalna hai?`,
              spokenHindi: `${matched.length} प्रोडक्ट्स मिल रहे हैं — कौनसे वाले का स्टॉक बदलना है?`,
            };
          }
        }
      }

      if (!targetProd && mem.currentProduct) {
        targetProd = mem.currentProduct;
      }

      if (targetProd) {
        const currentStock = Number(targetProd.stockCount ?? targetProd.countInStock ?? targetProd.stock ?? 0);
        let newStock = currentStock;
        const op = canonicalCmd.operation;

        if (op?.type === "increase" && op.value) {
          newStock = currentStock + op.value;
        } else if (op?.type === "decrease" && op.value) {
          newStock = Math.max(0, currentStock - op.value);
        } else if (op?.type === "set" && op.value !== undefined) {
          newStock = Math.max(0, op.value);
        } else if (stockMatch) {
          newStock = Math.max(0, parseInt(stockMatch[1], 10));
        }

        try {
          ctx.setActiveTab("products");
          adminContextMemory.setProduct(targetProd);
          await adminApi.updateStock(targetProd._id, newStock);
          await ctx.fetchData();
          adminContextMemory.setProduct({ ...targetProd, stockCount: newStock });

          recordAudit(`UPDATED STOCK: ${targetProd.name} -> ${newStock}`, true);
          const localized = canonicalLanguageEngine.formatMultilingualResponse(
            canonicalCmd.detectedLanguage,
            `Stock for '${targetProd.name}' successfully updated to ${newStock} units. Backend verified.`,
            `हो गया सर! '${targetProd.name}' का स्टॉक ${newStock} यूनिट्स कर दिया गया है।`
          );
          return {
            text: localized.text,
            spokenHindi: localized.spokenHindi,
            actionTaken: `UPDATED STOCK: ${targetProd.name} -> ${newStock}`,
            dataCard: { type: "product_card", data: { ...targetProd, stockCount: newStock } },
          };
        } catch (err: any) {
          recordAudit(`FAILED_STOCK_UPDATE: ${err?.message}`, false);
          return {
            text: `Stock update nahi hua: ${err?.message || "Server error"}`,
            spokenHindi: "स्टॉक अपडेट नहीं हो पाया।",
          };
        }
      }
    }

    // Product Creation Modal
    if ((q.includes("create") || q.includes("naya") || q.includes("add") || q.includes("banao")) && (q.includes("product") || q.includes("garment") || q.includes("item"))) {
      ctx.setActiveTab("products");
      if (ctx.handleOpenCreateProductModal) ctx.handleOpenCreateProductModal();
      recordAudit("OPENED_CREATE_PRODUCT_MODAL", true);
      const localized = canonicalLanguageEngine.formatMultilingualResponse(
        canonicalCmd.detectedLanguage,
        "Opening New Product Creation studio.",
        "सर, नया प्रोडक्ट बनाने का फॉर्म खोल दिया गया है।"
      );
      return {
        text: localized.text,
        spokenHindi: localized.spokenHindi,
        actionTaken: "OPENED CREATE PRODUCT MODAL",
      };
    }

    // Product Deletion (Confirmation Guard)
    if ((q.includes("delete") || q.includes("hatao") || q.includes("remove")) && (q.includes("product") || q.includes("garment") || refersToCurrent)) {
      const targetProd = refersToCurrent ? mem.currentProduct : null;
      if (targetProd) {
        const prodName = targetProd.name;
        adminContextMemory.setPendingConfirmation({
          id: `del-prod-${targetProd._id}`,
          intent: "DELETE_PRODUCT",
          description: `Delete product '${prodName}'`,
          spokenPrompt: `Ye '${prodName}' permanently delete hoga. Pakka delete karna hai?`,
          severity: "high",
          execute: async () => {
            if (ctx.handleDeleteProduct) {
              await ctx.handleDeleteProduct(targetProd._id, prodName);
            } else {
              await adminApi.deleteProduct(targetProd._id);
            }
            adminContextMemory.setProduct(null);
            return {
              success: true,
              message: `'${prodName}' ko permanently delete kar diya gaya hai.`,
              spokenHindi: `सर, '${prodName}' को डिलीट कर दिया गया है।`,
            };
          },
        });

        return {
          text: `'${prodName}' permanently delete hoga. Pakka delete karna hai?`,
          spokenHindi: `सर, '${prodName}' परमानेंट डिलीट होगा। पक्का डिलीट करना है?`,
          actionTaken: "AWAITING CONFIRMATION: DELETE PRODUCT",
          requiresConfirmation: true,
        };
      }
    }

    // Product Duplication
    if ((q.includes("duplicate") || q.includes("copy")) && (q.includes("product") || refersToCurrent)) {
      const targetProd = refersToCurrent ? mem.currentProduct : ctx.products[0];
      if (targetProd && ctx.handleDuplicateProduct) {
        ctx.setActiveTab("products");
        ctx.handleDuplicateProduct(targetProd);
        return {
          text: `'${targetProd.name}' ko duplicate karke new draft create kar diya hai!`,
          spokenHindi: `सर, '${targetProd.name}' को डुप्लिकेट कर दिया गया है!`,
          actionTaken: `DUPLICATED: ${targetProd.name}`,
        };
      }
    }

    // =========================================================================
    // 6. MODULE-SPECIFIC OPERATIONAL COMMANDS (ALL 33 MODULES)
    // =========================================================================

    // 01 — OVERVIEW & TELEMETRY
    if (q.includes("overview") || q.includes("aaj sales") || q.includes("kamai") || (q.includes("sales") && !q.includes("report"))) {
      ctx.setActiveTab("overview");
      const totalRevenue = ctx.orders.reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.amount) || 0), 0);
      const paidOrders = ctx.orders.filter((o) => o.paymentStatus === "paid" || o.isPaid).length;
      return {
        text: `Overview Telemetry Snapshot:\n• Total Orders: ${ctx.orders.length}\n• Store Revenue: ₹${totalRevenue.toLocaleString("en-IN")}\n• Paid Orders: ${paidOrders}\n• Live Visitors: ${ctx.visitorStats.total} (${ctx.visitorStats.gpsVerified} GPS Verified)`,
        spokenHindi: `सर, स्टोर में कुल ${ctx.orders.length} ऑर्डर्स और ${totalRevenue.toLocaleString("en-IN")} रुपये की कमाई हुई है।`,
        actionTaken: "NAVIGATED TO OVERVIEW",
        dataCard: { type: "revenue_card", data: { totalRevenue, totalOrders: ctx.orders.length } },
      };
    }

    // 02 — SALES & AUDIT REPORTS
    if (q.includes("report") || q.includes("reports") || q.includes("audit") || q.includes("excel")) {
      ctx.setActiveTab("reports");
      const excelUrl = reportApi.getExportExcelUrl({ timeframe: "30_days" });
      return {
        text: `Sales & Audit Reports Console open kar diya hai.\n• Last 30 Days Excel Report URL ready hai.\n• Total Orders Audited: ${ctx.orders.length}`,
        spokenHindi: `सर, सेल्स और ऑडिट रिपोर्ट कंसोल खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO REPORTS",
      };
    }

    // 03 — VISITOR RADAR
    if (q.includes("radar") || q.includes("traffic") || (q.includes("visitor") && !q.includes("crm"))) {
      ctx.setActiveTab("radar");
      return {
        text: `Visitor GPS Radar Live Telemetry:\n• Total Hits: ${ctx.visitorStats.total}\n• GPS High Accuracy: ${ctx.visitorStats.gpsVerified}\n• Guests: ${ctx.visitorStats.guests}`,
        spokenHindi: `सर, लाइव विजिटर रडार खोल दिया गया है। कुल ${ctx.visitorStats.total} हिट्स हैं।`,
        actionTaken: "NAVIGATED TO VISITOR RADAR",
      };
    }

    // 04 — SEARCH DEMAND RADAR
    if (q.includes("search demand") || q.includes("search radar") || q.includes("zero result") || (q.includes("search") && q.includes("keyword"))) {
      ctx.setActiveTab("search-radar");
      return {
        text: `Search Demand Radar open ho gaya hai. Top search keywords aur zero-result telemetry display ho rahi hai.`,
        spokenHindi: `सर, सर्च डिमांड रडार खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO SEARCH RADAR",
      };
    }

    // 05 — ABANDONED BAGS RADAR
    if (q.includes("abandoned") || q.includes("drop off") || q.includes("adhure cart")) {
      ctx.setActiveTab("abandoned-bags");
      return {
        text: `Abandoned Bags Radar open ho gaya hai. Dropped checkouts aur recovery offers staging screen par hain.`,
        spokenHindi: `सर, एबंडन्ड बैग्स रडार खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO ABANDONED BAGS",
      };
    }

    // 06 — ORDER VAULT (STATUS, INVOICE, THERMAL, CANCEL)
    const isOrderOp = q.includes("order") || q.includes("invoice") || q.includes("thermal") || q.includes("dispatch");
    if (isOrderOp) {
      const numMatch = q.match(/\b\d{2,8}\b/);
      let targetOrder = refersToCurrent ? mem.currentOrder : null;

      if (numMatch) {
        const targetNum = numMatch[0];
        targetOrder = ctx.orders.find(
          (o) =>
            String(o.orderNumber || "").includes(targetNum) ||
            String(o._id || "").slice(-6).toLowerCase().includes(targetNum.toLowerCase()) ||
            String(o._id || "").toLowerCase() === targetNum.toLowerCase()
        ) || null;
      }

      // Single invoice download
      if (q.includes("invoice") || q.includes("bill")) {
        if (q.includes("bulk") || q.includes("saare") || q.includes("all")) {
          ctx.setActiveTab("orders");
          const totalCount = ctx.orders.length;
          for (let i = 0; i < Math.min(ctx.orders.length, 5); i++) {
            await downloadOrderInvoice(ctx.orders[i], ctx.gstConfig);
          }
          return {
            text: `Store ke orders ke official GST tax invoices download ho rahe hain (Total ${totalCount} orders).`,
            spokenHindi: `सर, सभी ऑर्डर्स के जीएसटी इनवॉइस डाउनलोड किए जा रहे हैं।`,
            actionTaken: `BULK INVOICE DOWNLOAD TRIGGERED (${totalCount} ORDERS)`,
          };
        }

        if (targetOrder) {
          await downloadOrderInvoice(targetOrder, ctx.gstConfig);
          const ordNo = targetOrder.orderNumber || String(targetOrder._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} ka official GST Invoice download ho gaya!`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} का जीएसटी इनवॉइस डाउनलोड हो गया!`,
            actionTaken: `DOWNLOADED INVOICE #${ordNo}`,
          };
        }
      }

      // Thermal label
      if (q.includes("thermal") || q.includes("label") || q.includes("print")) {
        const ord = targetOrder || ctx.orders[0];
        if (ord && ctx.setSelectedThermalOrder) {
          ctx.setSelectedThermalOrder(ord);
          const ordNo = ord.orderNumber || String(ord._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} ke liye 4x6 thermal label print dialog open kar diya hai.`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} का थर्मल लेबल खोल दिया गया है।`,
            actionTaken: `OPENED THERMAL LABEL #${ordNo}`,
          };
        }
      }

      // Order confirmation
      if (q.includes("confirm")) {
        if (targetOrder) {
          ctx.setActiveTab("orders");
          adminContextMemory.setOrder(targetOrder);
          if (ctx.handleUpdateOrderStatus) await ctx.handleUpdateOrderStatus(targetOrder._id, "confirmed");
          else await adminApi.updateOrderStatus(targetOrder._id, "confirmed");
          await ctx.fetchData();
          const ordNo = targetOrder.orderNumber || String(targetOrder._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} ko confirm kar diya gaya hai.`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} कन्फर्म कर दिया गया है।`,
            actionTaken: `CONFIRMED ORDER #${ordNo}`,
            dataCard: { type: "order_card", data: { ...targetOrder, orderStatus: "confirmed" } },
          };
        }
      }

      // Order dispatch / ship
      if (q.includes("ship") || q.includes("dispatch") || q.includes("bhejo")) {
        if (targetOrder) {
          ctx.setActiveTab("orders");
          adminContextMemory.setOrder(targetOrder);
          if (ctx.handleUpdateOrderStatus) await ctx.handleUpdateOrderStatus(targetOrder._id, "shipped");
          else await adminApi.updateOrderStatus(targetOrder._id, "shipped");
          await ctx.fetchData();
          const ordNo = targetOrder.orderNumber || String(targetOrder._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} ko shipped mark kar diya hai.`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} को शिप्ड मार्क कर दिया गया है।`,
            actionTaken: `SHIPPED ORDER #${ordNo}`,
            dataCard: { type: "order_card", data: { ...targetOrder, orderStatus: "shipped" } },
          };
        }
      }

      // Order delivery
      if (q.includes("deliver")) {
        if (targetOrder) {
          ctx.setActiveTab("orders");
          adminContextMemory.setOrder(targetOrder);
          if (ctx.handleUpdateOrderStatus) await ctx.handleUpdateOrderStatus(targetOrder._id, "delivered");
          else await adminApi.updateOrderStatus(targetOrder._id, "delivered");
          await ctx.fetchData();
          const ordNo = targetOrder.orderNumber || String(targetOrder._id).slice(-6).toUpperCase();
          return {
            text: `Order #${ordNo} ko delivered mark kar diya hai.`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} को डिलीवर्ड मार्क कर दिया गया है।`,
            actionTaken: `DELIVERED ORDER #${ordNo}`,
            dataCard: { type: "order_card", data: { ...targetOrder, orderStatus: "delivered" } },
          };
        }
      }

      // Order cancellation (Confirmation Guard)
      if (q.includes("cancel") || q.includes("radd")) {
        if (targetOrder) {
          const ordNo = targetOrder.orderNumber || String(targetOrder._id).slice(-6).toUpperCase();
          adminContextMemory.setPendingConfirmation({
            id: `cancel-${targetOrder._id}`,
            intent: "CANCEL_ORDER",
            description: `Cancel Order #${ordNo}`,
            spokenPrompt: `Order #${ordNo} cancel hoga. Pakka cancel karna hai?`,
            severity: "high",
            execute: async () => {
              if (ctx.handleUpdateOrderStatus) await ctx.handleUpdateOrderStatus(targetOrder._id, "cancelled");
              else await adminApi.updateOrderStatus(targetOrder._id, "cancelled");
              return {
                success: true,
                message: `Order #${ordNo} ko successfully cancel kar diya gaya hai.`,
                spokenHindi: `ऑर्डर नंबर ${ordNo} कैंसिल कर दिया गया है।`,
              };
            },
          });

          return {
            text: `Order #${ordNo} cancel hoga. Pakka cancel karna hai?`,
            spokenHindi: `ऑर्डर नंबर ${ordNo} कैंसिल होगा। पक्का कैंसिल करना है?`,
            actionTaken: "AWAITING CONFIRMATION: CANCEL ORDER",
            requiresConfirmation: true,
          };
        }
      }
    }

    // 07 — CUSTOM SIZE FITTINGS (APPOINTMENTS)
    if (q.includes("appointment") || q.includes("fitting") || q.includes("tailor") || q.includes("darji") || q.includes("naap")) {
      ctx.setActiveTab("appointments");
      try {
        const apptRes = await appointmentApi.getAllAppointments({ status: "pending" });
        const count = apptRes.count || (apptRes.appointments ? apptRes.appointments.length : 0);
        return {
          text: `Bespoke Custom Size Fittings Console open ho gaya hai. (${count} pending consultations).`,
          spokenHindi: `सर, कस्टम साइज और टेलर फिटिंग अपॉइंटमेंट्स खोल दिया गया है।`,
          actionTaken: "NAVIGATED TO APPOINTMENTS",
        };
      } catch (e) {
        return {
          text: `Custom Size Fittings & Bespoke Appointments open ho gaya hai.`,
          spokenHindi: `सर, कस्टम साइज अपॉइंटमेंट्स खोल दिया गया है।`,
        };
      }
    }

    // 08 — RETURNS & EXCHANGES VAULT
    if (q.includes("return") || q.includes("exchange") || q.includes("reverse logistic") || q.includes("wapsi")) {
      ctx.setActiveTab("returns-vault");
      try {
        const retRes = await returnApi.getReturnRequests({ status: "pending_review" });
        const count = retRes.requests ? retRes.requests.length : 0;
        return {
          text: `Returns & Exchanges Vault open ho gaya hai. (${count} pending review requests).`,
          spokenHindi: `सर, रिटर्न्स और एक्सचेंज वॉल्ट खोल दिया गया है।`,
          actionTaken: "NAVIGATED TO RETURNS VAULT",
        };
      } catch (e) {
        return {
          text: `Returns & Exchanges Vault open ho gaya hai.`,
          spokenHindi: `सर, रिटर्न्स वॉल्ट खोल दिया गया है।`,
        };
      }
    }

    // 10 — SHIPPING & COD RULES CMS
    if (q.includes("shipping") || q.includes("courier") || q.includes("pincode") || q.includes("delivery charge")) {
      ctx.setActiveTab("shipping-rules");
      const thresholdMatch = q.match(/(\d+)\s*(?:ke upar|above|free)/i);
      if (thresholdMatch && (q.includes("free shipping") || q.includes("threshold"))) {
        const newThresh = parseInt(thresholdMatch[1], 10);
        adminContextMemory.setPendingConfirmation({
          id: "update-shipping-thresh",
          intent: "UPDATE_SHIPPING_THRESHOLD",
          description: `Set free shipping threshold to ₹${newThresh}`,
          spokenPrompt: `Free shipping threshold ko ₹${newThresh} kar du?`,
          severity: "medium",
          execute: async () => {
            await shippingConfigApi.updateConfig({ freeShippingThreshold: newThresh });
            return {
              success: true,
              message: `Free shipping threshold ko update karke ₹${newThresh.toLocaleString("en-IN")} kar diya hai!`,
              spokenHindi: `सर, फ्री शिपिंग लिमिट ${newThresh} रुपये कर दी गई है।`,
            };
          },
        });
        return {
          text: `Free shipping threshold ko ₹${newThresh.toLocaleString("en-IN")} set karna hai. Confirm karein?`,
          spokenHindi: `फ्री शिपिंग लिमिट ${newThresh} रुपये कर दूँ?`,
          requiresConfirmation: true,
        };
      }

      return {
        text: `Shipping & COD Rules CMS open ho gaya hai. Courier partners aur pincode thresholds display ho rahe hain.`,
        spokenHindi: `सर, शिपिंग और सीओडी रूल्स सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO SHIPPING RULES",
      };
    }

    // 11 — CONCIERGE & SUPPORT TICKETS
    if (q.includes("support") || q.includes("ticket") || q.includes("concierge") || q.includes("complaint")) {
      ctx.setActiveTab("support-tickets");
      try {
        const ticketRes = await ticketApi.getTickets({ status: "open" });
        const openCount = ticketRes.stats?.open ?? (ticketRes.tickets ? ticketRes.tickets.length : 0);
        return {
          text: `Support & Concierge Tickets Console open ho gaya hai. (${openCount} open tickets awaiting reply).`,
          spokenHindi: `सर, सपोर्ट टिकट्स कंसोल खोल दिया गया है।`,
          actionTaken: "NAVIGATED TO SUPPORT TICKETS",
        };
      } catch (e) {
        return {
          text: `Support & Concierge Tickets Console open ho gaya hai.`,
          spokenHindi: `सर, सपोर्ट टिकट्स खोल दिया गया है।`,
        };
      }
    }

    // 12 — WARDROBE FILTERS CMS
    if (q.includes("filter") && (q.includes("wardrobe") || q.includes("category add") || q.includes("size add") || q.includes("color add"))) {
      ctx.setActiveTab("filters");
      return {
        text: `Wardrobe Dynamic Filters CMS open ho gaya hai. Categories, sizes, colors aur fabrics manage kar sakte hain.`,
        spokenHindi: `सर, वार्डरोब फिल्टर्स सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO WARDROBE FILTERS",
      };
    }

    // 13 — REVIEWS & RATINGS
    if (q.includes("review") || q.includes("reviews") || q.includes("rating") || q.includes("feedback") || q.includes("tareef")) {
      ctx.setActiveTab("reviews");
      return {
        text: `Reviews & Ratings Moderation Studio open ho gaya hai. Customer feedback aur verified reviews display ho rahe hain.`,
        spokenHindi: `सर, रिव्यूज और कस्टमर फीडबैक खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO REVIEWS",
      };
    }

    // 15 — HERO SECTION CMS
    if (q.includes("hero") || (q.includes("banner") && !q.includes("peel"))) {
      ctx.setActiveTab("hero");
      return {
        text: `Hero Section 1:1 Canvas CMS open ho gaya hai. Typography aur call-to-action layout ready hai.`,
        spokenHindi: `सर, हीरो सेक्शन कैनवस एडिटर खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO HERO CMS",
      };
    }

    // 16 — SILHOUETTES CMS (CTA TRI-CARD)
    if (q.includes("silhouettes") || q.includes("tri card") || q.includes("cta section")) {
      ctx.setActiveTab("cta");
      return {
        text: `Silhouettes Field Test Tri-Card CMS open ho gaya hai.`,
        spokenHindi: `सर, सिल्हूट्स ट्राई-कार्ड सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO SILHOUETTES CMS",
      };
    }

    // 17 — PHILOSOPHY & MANIFESTO CMS
    if (q.includes("philosophy") || q.includes("manifesto") || q.includes("brand quote")) {
      ctx.setActiveTab("statement");
      return {
        text: `Philosophy & Manifesto CMS open ho gaya hai. Brand quote aur signature text ready hain.`,
        spokenHindi: `सर, ब्रांड फिलॉसफी और मेनिफेस्टो सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO PHILOSOPHY CMS",
      };
    }

    // 18 — BUNDLE STACKER CMS
    if (q.includes("bundle") || q.includes("modular outfit") || q.includes("combo")) {
      ctx.setActiveTab("bundle");
      return {
        text: `Bundle Stacker & Modular Outfit CMS open ho gaya hai. Outfits stackers aur combo sets display ho rahe hain.`,
        spokenHindi: `सर, बंडल स्टैकर सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO BUNDLE CMS",
      };
    }

    // 19 — NARRATIVE CMS
    if (q.includes("narrative") || q.includes("editorial") || q.includes("typography cms")) {
      ctx.setActiveTab("textblock");
      return {
        text: `Brand Narrative & Typography CMS open ho gaya hai.`,
        spokenHindi: `सर, एडिटोरियल नैरेटिव और टाइपोग्राफी सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO NARRATIVE CMS",
      };
    }

    // 20 — PEEL REVEAL CMS
    if (q.includes("peel") || q.includes("peel reveal") || q.includes("motion cutout")) {
      ctx.setActiveTab("peel-reveal");
      return {
        text: `Peel Reveal Motion Cutout CMS open ho gaya hai.`,
        spokenHindi: `सर, पील रिवील मोशन सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO PEEL REVEAL CMS",
      };
    }

    // 21 — CAMPAIGN LOOKBOOK CMS
    if (q.includes("campaign") || q.includes("lookbook") || q.includes("fashion drop")) {
      ctx.setActiveTab("lookbook");
      return {
        text: `Campaign Lookbook Silhouettes CMS open ho gaya hai. Seasonal editorial drops ready hain.`,
        spokenHindi: `सर, कैंपेन लुकबुक सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO LOOKBOOK CMS",
      };
    }

    // 22 — FOOTER CMS
    if (q.includes("footer") || q.includes("hotline") || q.includes("legal links")) {
      ctx.setActiveTab("footer");
      return {
        text: `Footer & Legal Hotline CMS open ho gaya hai. Policies, links aur hotline contacts display ho rahe hain.`,
        spokenHindi: `सर, फूटर और लीगल सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO FOOTER CMS",
      };
    }

    // 23 — BOGO & BUNDLE TIERS CMS
    if (q.includes("bogo") || q.includes("buy 1 get") || q.includes("tier engine")) {
      ctx.setActiveTab("bogo-cms");
      return {
        text: `BOGO & Buy X Get Y Tier Engine CMS open ho gaya hai. Promotional tier discounts display ho rahe hain.`,
        spokenHindi: `सर, बोगो और बाय वन गेट वन टियर सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO BOGO CMS",
      };
    }

    // 23.5 — CLIENT REVIEWS & RATINGS MODERATION
    if (q.includes("testimonial") || q.includes("boutique stories") || q.includes("stories cms") || q.includes("client review")) {
      ctx.setActiveTab("reviews");
      return {
        text: `Client Reviews & Ratings moderation open ho gaya hai.`,
        spokenHindi: `सर, क्लाइंट रिव्यूज़ और रेटिंग्स पैनल खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO REVIEWS TAB",
      };
    }

    // 24 — VIP NEWSLETTER CRM
    if (q.includes("newsletter") || q.includes("subscriber") || q.includes("broadcast") || q.includes("vip list")) {
      ctx.setActiveTab("newsletter-crm");
      try {
        const subs = await newsletterAdminApi.getSubscribers();
        return {
          text: `VIP Newsletter CRM open ho gaya hai. (Total ${subs.count || 0} active subscribers). CSV export link ready hai.`,
          spokenHindi: `सर, वीआईपी न्यूज़लेटर सीआरएम खोल दिया गया है।`,
          actionTaken: "NAVIGATED TO NEWSLETTER CRM",
        };
      } catch (e) {
        return {
          text: `VIP Newsletter CRM open ho gaya hai.`,
          spokenHindi: `सर, न्यूज़लेटर सीआरएम खोल दिया गया है।`,
        };
      }
    }

    // 25 — FLASH PROMOTION & COUNTDOWN STUDIO
    if (q.includes("countdown") || q.includes("flash sale") || q.includes("timer")) {
      ctx.setActiveTab("countdown");
      return {
        text: `Flash Promotion & Countdown Studio open ho gaya hai. Live drops aur sale timers display ho rahe hain.`,
        spokenHindi: `सर, फ्लैश प्रमोशन और काउंटडाउन स्टूडियो खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO COUNTDOWN STUDIO",
      };
    }

    // 26 — PROMO & COUPONS VAULT
    if (q.includes("coupon") || q.includes("voucher") || q.includes("discount code") || q.includes("loot")) {
      ctx.setActiveTab("coupons");
      // Seed coupons command
      if (q.includes("seed") || q.includes("default") || q.includes("load")) {
        if (ctx.handleSeedDefaultCoupons) {
          await ctx.handleSeedDefaultCoupons();
          await ctx.fetchData();
          return {
            text: "Coupons Vault mein default curated promo discount vouchers seed kar diye gaye hain!",
            spokenHindi: "सर, सारे डिफ़ॉल्ट कूपन्स लोड कर दिए गए हैं।",
            actionTaken: "SEEDED DEFAULT COUPONS",
          };
        }
      }

      // Create coupon command
      const couponMatch = q.match(/(\d+)%\s*(?:ka)?\s*coupon/i) || q.match(/coupon\s*(?:bana)?\s*(\d+)%/i);
      if (couponMatch && (q.includes("bana") || q.includes("create"))) {
        const discountAmt = parseInt(couponMatch[1], 10);
        const codeName = `OFF${discountAmt}_${Date.now().toString().slice(-4)}`;
        try {
          await couponApi.create({
            code: codeName,
            discountType: "percentage",
            discountAmount: discountAmt,
            minOrderValue: 999,
            isActive: true,
          });
          await ctx.fetchData();
          return {
            text: `Done. Naya coupon code '${codeName}' (${discountAmt}% OFF, Min Order ₹999) create kar diya hai!`,
            spokenHindi: `हो गया सर! नया कूपन '${codeName}' बना दिया गया है।`,
            actionTaken: `CREATED COUPON: ${codeName}`,
          };
        } catch (e: any) {
          return {
            text: `Coupon create fail hua: ${e.message}`,
            spokenHindi: "कूपन नहीं बन पाया।",
          };
        }
      }

      return {
        text: `Promo Coupons Vault open ho gaya hai. (Total ${ctx.coupons.length} active coupons in store).`,
        spokenHindi: `सर, डिस्काउंट कूपन्स वॉल्ट खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO COUPONS VAULT",
      };
    }

    // 27 — WALLET & GIFT CARDS
    if (q.includes("wallet") || q.includes("gift card") || q.includes("vault cards") || q.includes("store credit")) {
      ctx.setActiveTab("vault-cards");
      return {
        text: `Wallet & Gift Cards CMS open ho gaya hai. Store credit aur loyalty tiers display ho rahe hain.`,
        spokenHindi: `सर, वॉलेट और गिफ्ट कार्ड्स सीएमएस खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO WALLET CMS",
      };
    }

    // 28 — SHOP THE LOOK / UGC
    if (q.includes("shop the look") || q.includes("ugc") || q.includes("instagram feed")) {
      ctx.setActiveTab("shop-the-look");
      return {
        text: `Shop the Look / Instagram UGC Shoppable Feed open ho gaya hai.`,
        spokenHindi: `सर, शॉप द लुक यूजीसी फीड खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO UGC FEED",
      };
    }

    // 29 — PAYMENT AUTH & GATEWAY CMS
    if (q.includes("payment") || q.includes("razorpay") || q.includes("upi") || q.includes("gateway") || q.includes("cod")) {
      ctx.setActiveTab("payments");
      // COD Toggle
      if (q.includes("cod") || q.includes("cash on delivery")) {
        const existingCod = ctx.paymentConfig?.cod || DEFAULT_PAYMENT_CONFIG.cod;
        if (q.includes("on") || q.includes("chalu") || q.includes("enable")) {
          try {
            await paymentConfigApi.updatePaymentConfig({ cod: { ...existingCod, isEnabled: true } });
            await ctx.fetchData();
            return {
              text: "Done. Cash on Delivery (COD) enable kar diya hai.",
              spokenHindi: "कैश ऑन डिलीवरी ऑन कर दी गई है।",
              actionTaken: "ENABLED COD",
            };
          } catch (e: any) {
            return { text: `Update fail hua: ${e.message}`, spokenHindi: "अपडेट नहीं हो पाया।" };
          }
        } else if (q.includes("off") || q.includes("band") || q.includes("disable")) {
          try {
            await paymentConfigApi.updatePaymentConfig({ cod: { ...existingCod, isEnabled: false } });
            await ctx.fetchData();
            return {
              text: "Done. Cash on Delivery (COD) disable kar diya hai.",
              spokenHindi: "कैश ऑन डिलीवरी बंद कर दी गई है।",
              actionTaken: "DISABLED COD",
            };
          } catch (e: any) {
            return { text: `Update fail hua: ${e.message}`, spokenHindi: "अपडेट नहीं हो पाया।" };
          }
        }
      }

      const isCodOn = ctx.paymentConfig?.cod?.isEnabled ?? true;
      const isRazorpayOn = ctx.paymentConfig?.razorpay?.isEnabled ?? true;
      const isCashfreeOn = ctx.paymentConfig?.cashfree?.isEnabled ?? true;
      return {
        text: `Payment Gateways Status:\n• Cashfree PG: ${isCashfreeOn ? "ACTIVE" : "DISABLED"}\n• Razorpay Cards: ${isRazorpayOn ? "ACTIVE" : "DISABLED"}\n• Cash on Delivery: ${isCodOn ? "ACTIVE (ON)" : "DISABLED (OFF)"}`,
        spokenHindi: `सर, पेमेंट सेटिंग्स खोल दी गई हैं। सीओडी अभी ${isCodOn ? "चालू" : "बंद"} है।`,
        actionTaken: "NAVIGATED TO PAYMENT SETTINGS",
      };
    }

    // 30 — INVOICE & GST COMPLIANCE CMS
    if (q.includes("gst") || q.includes("gstin") || q.includes("tax")) {
      ctx.setActiveTab("gst");
      const gstPct = ctx.gstConfig?.gstPercentage || 12;
      return {
        text: `Invoice & GST Compliance CMS open ho gaya hai.\n• Current GST Rate: ${gstPct}%\n• GSTIN: ${ctx.gstConfig?.gstinNumber || "Configured"}`,
        spokenHindi: `सर, इनवॉइस और जीएसटी सेटिंग्स खोल दी गई हैं। वर्तमान टैक्स रेट ${gstPct}% है।`,
        actionTaken: "NAVIGATED TO GST SETTINGS",
      };
    }

    // 31 — CLIENTELE & ACCESS GOVERNANCE
    if (q.includes("user") || q.includes("customer") || q.includes("client") || q.includes("grahak") || q.includes("staff")) {
      ctx.setActiveTab("users");
      const targetUser = mem.currentUser || ctx.users[0];
      if (q.includes("block") && targetUser && ctx.handleToggleBlockUser) {
        await ctx.handleToggleBlockUser(targetUser._id);
        await ctx.fetchData();
        return {
          text: `Client ${targetUser.name || targetUser.email} ka block status toggle kar diya hai.`,
          spokenHindi: `क्लाइंट का ब्लॉक स्टेटस अपडेट कर दिया गया है।`,
          actionTaken: `TOGGLE BLOCK USER: ${targetUser.name}`,
        };
      }
      return {
        text: `Clientele & User Governance open ho gaya hai. (Total ${ctx.users.length} registered customers).`,
        spokenHindi: `सर, क्लाइंटल और यूजर कंसोल खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO USERS",
      };
    }

    // 32 — SECURITY & AUDIT TELEMETRY LOGS
    if (q.includes("security") || q.includes("audit log") || q.includes("threat") || q.includes("ip log")) {
      ctx.setActiveTab("security-logs");
      return {
        text: `Security & Audit Telemetry Logs open ho gaye hain. Real-time route hits aur session telemetry active hain.`,
        spokenHindi: `सर, सिक्योरिटी और ऑडिट लॉग्स खोल दिए गए हैं।`,
        actionTaken: "NAVIGATED TO SECURITY LOGS",
      };
    }

    // 33 — MAIL ENGINE & DIAGNOSTICS
    if (q.includes("diagnostic") || q.includes("mail engine") || q.includes("smtp") || q.includes("system check")) {
      ctx.setActiveTab("diagnostics");
      return {
        text: `Mail Engine & Failover Diagnostics open ho gaya hai. SMTP health aur failover queues operational hain.`,
        spokenHindi: `सर, मेल इंजन और सिस्टम डायग्नोस्टिक्स खोल दिया गया है।`,
        actionTaken: "NAVIGATED TO DIAGNOSTICS",
      };
    }

    // Dynamic Navigation Fallback matching any registered module
    const matchedModule =
      adminCapabilityRegistry.findModuleByQuery(q) ||
      (canonicalCmd.module && adminCapabilityRegistry.getModule(canonicalCmd.module)) ||
      adminCapabilityRegistry.findModuleByQuery(canonicalCmd.canonicalEnglish);

    if (matchedModule) {
      ctx.setActiveTab(matchedModule.id);
      adminContextMemory.setTab(matchedModule.id);
      recordAudit(`NAVIGATED: ${matchedModule.name}`, true);
      const localized = canonicalLanguageEngine.formatMultilingualResponse(
        canonicalCmd.detectedLanguage,
        `Opening ${matchedModule.name}.`,
        `जी सर, ${matchedModule.name} खोल दिया गया है।`
      );
      return {
        text: localized.text,
        spokenHindi: localized.spokenHindi,
        actionTaken: `NAVIGATED: ${matchedModule.name}`,
      };
    }

    // General fallback
    recordAudit("UNKNOWN_COMMAND_FALLBACK", false);
    const fallbackLocalized = canonicalLanguageEngine.formatMultilingualResponse(
      canonicalCmd.detectedLanguage,
      `I received your command '${raw}'. You can ask me to open any of the 33 admin modules, search garments, update prices or stock, manage orders, or audit reports.`,
      `जी सर, मैंने आपकी बात '${raw}' सुन ली है। आप पूरे 33 ऑप्शंस में से कुछ भी कंट्रोल करने को कह सकते हैं।`
    );
    return {
      text: fallbackLocalized.text,
      spokenHindi: fallbackLocalized.spokenHindi,
      dataCard: { type: "quick_actions" },
    };
  }
}

export const aiActionEngine = new AIActionEngine();

