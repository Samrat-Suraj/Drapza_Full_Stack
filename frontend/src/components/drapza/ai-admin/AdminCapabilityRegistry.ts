/**
 * Admin Capability Registry
 * Dynamically defines every feature, route, capability, control, filter, and backend mapping
 * across the entire Drapza Admin Panel.
 */

export type AdminCapability =
  | "navigate"
  | "search"
  | "filter"
  | "sort"
  | "select"
  | "open"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "bulk_update"
  | "publish"
  | "unpublish"
  | "export"
  | "import"
  | "analyze"
  | "compare"
  | "generate"
  | "trigger"
  | "undo"
  | "reset"
  | "refresh"
  | "setting";

export interface AdminControlDef {
  type: "button" | "filter" | "search" | "form" | "modal" | "table" | "setting";
  id: string;
  name: string;
  actionIntent?: string;
  options?: string[];
  description?: string;
}

export interface AdminFeatureModule {
  id: string;
  name: string;
  route: string;
  category: "Analytics & Radar" | "Store Operations" | "Storefront CMS" | "Growth & Promo" | "Governance & System";
  description: string;
  keywords: string[];
  capabilities: AdminCapability[];
  controls: AdminControlDef[];
  permissions: string[];
  backendApis: string[];
  subPages?: { id: string; name: string; route: string }[];
}

export class AdminCapabilityRegistry {
  private static instance: AdminCapabilityRegistry;
  private registry: Map<string, AdminFeatureModule> = new Map();

  private constructor() {
    this.initDefaultModules();
  }

  public static getInstance(): AdminCapabilityRegistry {
    if (!AdminCapabilityRegistry.instance) {
      AdminCapabilityRegistry.instance = new AdminCapabilityRegistry();
    }
    return AdminCapabilityRegistry.instance;
  }

  private initDefaultModules() {
    const modules: AdminFeatureModule[] = [
      {
        id: "overview",
        name: "Dashboard Overview",
        route: "/admin?tab=overview",
        category: "Analytics & Radar",
        description: "Store telemetry, live sales snapshot, performance metrics, and inventory overview.",
        keywords: ["overview", "dashboard", "main", "home", "analytics", "stats", "telemetry", "kamai", "hisab"],
        capabilities: ["navigate", "read", "analyze", "compare", "refresh"],
        controls: [
          { type: "button", id: "refresh_stats", name: "Refresh Telemetry", actionIntent: "REFRESH" },
          { type: "table", id: "quick_stats", name: "Telemetry Summary" },
        ],
        permissions: ["admin.read"],
        backendApis: ["/order/admin/stats", "/telemetry"],
      },
      {
        id: "reports",
        name: "Sales & Audit Reports",
        route: "/admin?tab=reports",
        category: "Analytics & Radar",
        description: "Sales, revenue breakdown, tax reports, returns hisab, Excel/PDF exports.",
        keywords: ["reports", "report", "sales report", "audit", "revenue", "excel export", "pdf report", "biki", "sales"],
        capabilities: ["navigate", "read", "analyze", "filter", "export", "compare"],
        controls: [
          { type: "filter", id: "date_range", name: "Date Range Filter", options: ["today", "7_days", "30_days", "all"] },
          { type: "button", id: "export_report_pdf", name: "Export Report PDF", actionIntent: "EXPORT" },
          { type: "button", id: "export_report_csv", name: "Export Report Excel", actionIntent: "EXPORT" },
        ],
        permissions: ["admin.read", "admin.export"],
        backendApis: ["/report", "/order/admin/all"],
      },
      {
        id: "radar",
        name: "Visitor GPS Radar",
        route: "/admin?tab=radar",
        category: "Analytics & Radar",
        description: "Live IP and GPS visitor tracking, geography map, and traffic telemetry.",
        keywords: ["radar", "visitor radar", "gps", "live visitors", "tracking", "traffic", "visitor"],
        capabilities: ["navigate", "read", "search", "filter", "reset"],
        controls: [
          { type: "search", id: "visitor_search", name: "Search Visitors by IP/City" },
          { type: "filter", id: "visitor_filter", name: "Visitor Precision", options: ["ALL", "GPS", "IP", "REGISTERED", "GUEST"] },
          { type: "button", id: "clear_telemetry", name: "Purge Stale Telemetry", actionIntent: "RESET" },
        ],
        permissions: ["admin.read"],
        backendApis: ["/visitor-location", "/telemetry"],
      },
      {
        id: "search-radar",
        name: "Search Demand Radar",
        route: "/admin?tab=search-radar",
        category: "Analytics & Radar",
        description: "User search queries, popular demand keywords, and zero-result search telemetry.",
        keywords: ["search radar", "demand radar", "keywords", "zero result", "search telemetry"],
        capabilities: ["navigate", "read", "analyze", "filter"],
        controls: [
          { type: "table", id: "search_keywords_table", name: "Top Search Keywords" },
        ],
        permissions: ["admin.read"],
        backendApis: ["/search-telemetry"],
      },
      {
        id: "abandoned-bags",
        name: "Abandoned Bags Radar",
        route: "/admin?tab=abandoned-bags",
        category: "Analytics & Radar",
        description: "Shopping cart drop-offs, recovery triggers, and abandoned checkout offers.",
        keywords: ["abandoned", "abandoned bags", "drop offs", "cart drop", "recovery", "chhoote bag"],
        capabilities: ["navigate", "read", "filter", "trigger"],
        controls: [
          { type: "table", id: "abandoned_carts_table", name: "Abandoned Carts" },
          { type: "button", id: "send_recovery_nudge", name: "Trigger Recovery Nudge", actionIntent: "TRIGGER" },
        ],
        permissions: ["admin.read", "admin.write"],
        backendApis: ["/abandoned-cart"],
      },
      {
        id: "orders",
        name: "Order Vault",
        route: "/admin?tab=orders",
        category: "Store Operations",
        description: "Full order lifecycle: fulfillment, confirmation, dispatch, delivery, thermal labels, and tax invoices.",
        keywords: ["orders", "order", "fulfillment", "order vault", "dispatch", "thermal label", "invoice", "bill", "delivery"],
        capabilities: ["navigate", "search", "filter", "sort", "select", "open", "update", "export"],
        controls: [
          { type: "search", id: "order_search", name: "Search Order Number or Customer" },
          { type: "filter", id: "status_filter", name: "Order Status", options: ["ALL", "placed", "confirmed", "shipped", "delivered", "cancelled"] },
          { type: "filter", id: "payment_filter", name: "Payment Method", options: ["ALL", "PAID", "COD", "UPI"] },
          { type: "button", id: "confirm_order", name: "Confirm Order", actionIntent: "UPDATE" },
          { type: "button", id: "ship_order", name: "Dispatch & Ship", actionIntent: "UPDATE" },
          { type: "button", id: "deliver_order", name: "Mark Delivered", actionIntent: "UPDATE" },
          { type: "button", id: "cancel_order", name: "Cancel Order", actionIntent: "UPDATE" },
          { type: "button", id: "download_invoice", name: "Download GST Invoice PDF", actionIntent: "EXPORT" },
          { type: "button", id: "print_thermal_label", name: "Print 4x6 Thermal Label", actionIntent: "OPEN" },
          { type: "button", id: "bulk_invoice_download", name: "Bulk Invoices Export", actionIntent: "EXPORT" },
        ],
        permissions: ["admin.orders.read", "admin.orders.write"],
        backendApis: ["/order/admin/all", "/order/:id/status", "/order/admin/stats"],
      },
      {
        id: "products",
        name: "Garments Catalog & Inventory",
        route: "/admin?tab=products",
        category: "Store Operations",
        description: "Product management, pricing, stock levels, variants, categories, bulk discounts, and catalog export.",
        keywords: ["products", "product", "garments", "catalog", "inventory", "stock", "kapde", "price", "discount"],
        capabilities: ["navigate", "search", "filter", "sort", "select", "open", "create", "update", "delete", "bulk_update", "export", "import"],
        controls: [
          { type: "search", id: "product_search", name: "Search Product Title / SKU" },
          { type: "filter", id: "category_filter", name: "Garment Category" },
          { type: "filter", id: "stock_filter", name: "Stock Availability", options: ["ALL", "IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"] },
          { type: "button", id: "create_product", name: "Add New Garment", actionIntent: "CREATE" },
          { type: "button", id: "edit_product", name: "Edit Garment", actionIntent: "OPEN" },
          { type: "button", id: "delete_product", name: "Delete Garment", actionIntent: "DELETE" },
          { type: "button", id: "duplicate_product", name: "Duplicate Garment", actionIntent: "CREATE" },
          { type: "button", id: "bulk_discount_studio", name: "Store-Wide Bulk Discount", actionIntent: "BULK_UPDATE" },
          { type: "button", id: "bulk_product_upload", name: "Bulk CSV Catalog Upload", actionIntent: "IMPORT" },
          { type: "button", id: "export_products_csv", name: "Export Catalog CSV", actionIntent: "EXPORT" },
        ],
        permissions: ["admin.products.read", "admin.products.write"],
        backendApis: ["/product", "/product/:id", "/product/:id/stock", "/product/bulk-discount", "/product/export-csv"],
      },
      {
        id: "appointments",
        name: "Custom Size Fittings & Bespoke Appointments",
        route: "/admin?tab=appointments",
        category: "Store Operations",
        description: "Tailor consultations, custom measurements, and bespoke fittings scheduling.",
        keywords: ["appointments", "fitting", "custom size", "tailor", "bespoke", "darji", "naap"],
        capabilities: ["navigate", "read", "search", "filter", "update"],
        controls: [
          { type: "table", id: "appointments_table", name: "Bespoke Consultations" },
        ],
        permissions: ["admin.read", "admin.write"],
        backendApis: ["/appointment"],
      },
      {
        id: "returns-vault",
        name: "Returns & Exchanges Vault",
        route: "/admin?tab=returns-vault",
        category: "Store Operations",
        description: "Reverse logistics, return requests, replacement approvals, and refund coordination.",
        keywords: ["returns", "exchanges", "reverse logistics", "refunds", "wapsi", "badlao"],
        capabilities: ["navigate", "read", "search", "filter", "update"],
        controls: [
          { type: "table", id: "returns_table", name: "Return Requests" },
        ],
        permissions: ["admin.orders.write"],
        backendApis: ["/return-request"],
      },
      {
        id: "shipping-rules",
        name: "Shipping & COD Rules CMS",
        route: "/admin?tab=shipping-rules",
        category: "Store Operations",
        description: "Free shipping thresholds, courier partners, COD availability rules, and pincode checks.",
        keywords: ["shipping rules", "shipping", "courier", "pincodes", "cod rules", "delivery charge", "dak"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [
          { type: "form", id: "shipping_rules_form", name: "Threshold & Courier Configuration" },
        ],
        permissions: ["admin.settings.write"],
        backendApis: ["/shipping-config"],
      },
      {
        id: "support-tickets",
        name: "Concierge & Support Tickets",
        route: "/admin?tab=support-tickets",
        category: "Store Operations",
        description: "Client service tickets, issue resolutions, and customer communications.",
        keywords: ["support", "tickets", "concierge", "inquiries", "customer care", "madad", "help"],
        capabilities: ["navigate", "read", "search", "update"],
        controls: [
          { type: "table", id: "support_tickets_table", name: "Support Inquiries" },
        ],
        permissions: ["admin.support.write"],
        backendApis: ["/ticket"],
      },
      {
        id: "filters",
        name: "Wardrobe Dynamic Filters CMS",
        route: "/admin?tab=filters",
        category: "Store Operations",
        description: "Dynamic wardrobe taxonomy: Categories, Sizes, Colors, Fabrics, Occasions, and Availability tags.",
        keywords: ["filters", "filter", "categories", "sizes", "colors", "fabrics", "occasions"],
        capabilities: ["navigate", "read", "create", "update", "delete"],
        controls: [
          { type: "form", id: "filter_cms_form", name: "Filter Categories & Tags" },
        ],
        permissions: ["admin.settings.write"],
        backendApis: ["/filter-config"],
      },
      {
        id: "reviews",
        name: "Reviews & Client Feedback",
        route: "/admin?tab=reviews",
        category: "Store Operations",
        description: "Client reviews, star ratings moderation, verified buyer verification, and testimonials.",
        keywords: ["reviews", "review", "ratings", "feedback", "tareef", "stars"],
        capabilities: ["navigate", "read", "filter", "update", "delete"],
        controls: [
          { type: "table", id: "reviews_table", name: "Reviews Moderation Table" },
        ],
        permissions: ["admin.reviews.write"],
        backendApis: ["/review"],
      },
      {
        id: "coupons",
        name: "Discounts & Promo Coupons Vault",
        route: "/admin?tab=coupons",
        category: "Growth & Promo",
        description: "Discount vouchers, percentage/flat discounts, expiry limits, usage caps, and promo seeding.",
        keywords: ["coupons", "coupon", "discount code", "promo", "voucher", "loot", "chhoot"],
        capabilities: ["navigate", "search", "filter", "create", "update", "delete", "trigger"],
        controls: [
          { type: "search", id: "coupon_search", name: "Search Voucher Code" },
          { type: "filter", id: "coupon_filter", name: "Coupon Status", options: ["ALL", "ACTIVE", "INACTIVE", "PERCENTAGE", "FIXED"] },
          { type: "button", id: "create_coupon", name: "Create New Voucher", actionIntent: "CREATE" },
          { type: "button", id: "seed_default_coupons", name: "Seed Default Coupons", actionIntent: "TRIGGER" },
        ],
        permissions: ["admin.coupons.write"],
        backendApis: ["/coupon", "/coupon/:id", "/coupon/:id/toggle", "/coupon/seed"],
      },
      {
        id: "bogo-cms",
        name: "BOGO & Bundle Tiers Engine",
        route: "/admin?tab=bogo-cms",
        category: "Growth & Promo",
        description: "Buy 1 Get 1 / Buy X Get Y promotion rules, threshold discounts, and free item tiers.",
        keywords: ["bogo", "buy 1 get", "bogo cms", "tiers", "free garment", "bundle offer"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [
          { type: "form", id: "bogo_config_form", name: "BOGO Tier Studio" },
        ],
        permissions: ["admin.settings.write"],
        backendApis: ["/bogo-config"],
      },
      {
        id: "newsletter-crm",
        name: "VIP Newsletter CRM",
        route: "/admin?tab=newsletter-crm",
        category: "Growth & Promo",
        description: "Email subscriber list, CSV export, campaign broadcasts, and engagement stats.",
        keywords: ["newsletter", "crm", "subscribers", "vip list", "broadcast", "email marketing"],
        capabilities: ["navigate", "read", "export", "trigger"],
        controls: [
          { type: "table", id: "subscribers_table", name: "Subscribers List" },
          { type: "button", id: "export_subscribers_csv", name: "Export CSV", actionIntent: "EXPORT" },
        ],
        permissions: ["admin.marketing.write"],
        backendApis: ["/newsletter"],
      },
      {
        id: "countdown",
        name: "Flash Promotion & Countdown Studio",
        route: "/admin?tab=countdown",
        category: "Growth & Promo",
        description: "Flash sales ticker, countdown studio, urgent drops, and limited-time offer banners.",
        keywords: ["countdown", "flash sale", "timer", "live drop", "sale timer", "dhamaka"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [
          { type: "form", id: "countdown_form", name: "Countdown Timer Studio" },
        ],
        permissions: ["admin.settings.write"],
        backendApis: ["/countdown-config"],
      },
      {
        id: "vault-cards",
        name: "Wallet & Store Credit CMS",
        route: "/admin?tab=vault-cards",
        category: "Growth & Promo",
        description: "User wallet balances, store credit, loyalty reward tiers, and gift vouchers.",
        keywords: ["wallet", "gift card", "vault cards", "store credit", "loyalty tiers"],
        capabilities: ["navigate", "read", "search", "update"],
        controls: [
          { type: "table", id: "wallet_transactions_table", name: "Wallets & Credits" },
        ],
        permissions: ["admin.write"],
        backendApis: ["/wallet"],
      },
      {
        id: "shop-the-look",
        name: "Shop the Look / Instagram UGC Feed",
        route: "/admin?tab=shop-the-look",
        category: "Growth & Promo",
        description: "Shoppable editorial gallery, Instagram user-generated content, and tagged garments.",
        keywords: ["shop the look", "ugc", "instagram feed", "shoppable", "social commerce"],
        capabilities: ["navigate", "read", "create", "update", "delete"],
        controls: [
          { type: "form", id: "ugc_form", name: "Shoppable Lookbook Studio" },
        ],
        permissions: ["admin.settings.write"],
        backendApis: ["/shop-the-look"],
      },
      {
        id: "hero",
        name: "Hero Section 1:1 Canvas CMS",
        route: "/admin?tab=hero",
        category: "Storefront CMS",
        description: "Storefront primary banner, 1:1 visual canvas typography, and hero call-to-actions.",
        keywords: ["hero", "hero section", "banner", "main banner", "hero editor", "canvas"],
        capabilities: ["navigate", "read", "update", "reset"],
        controls: [{ type: "form", id: "hero_form", name: "Hero Canvas Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/hero-config"],
      },
      {
        id: "cta",
        name: "Silhouettes Tri-Card CMS",
        route: "/admin?tab=cta",
        category: "Storefront CMS",
        description: "Field test tri-card silhouettes showcase on homepage.",
        keywords: ["cta", "silhouettes", "tri card", "field test", "cta section"],
        capabilities: ["navigate", "read", "update", "reset"],
        controls: [{ type: "form", id: "cta_form", name: "Tri-Card Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/cta-config"],
      },
      {
        id: "statement",
        name: "Philosophy & Manifesto CMS",
        route: "/admin?tab=statement",
        category: "Storefront CMS",
        description: "Brand narrative, quote manifesto, and signature statement.",
        keywords: ["statement", "philosophy", "manifesto", "brand quote", "story"],
        capabilities: ["navigate", "read", "update", "reset"],
        controls: [{ type: "form", id: "statement_form", name: "Manifesto Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/statement-config"],
      },
      {
        id: "bundle",
        name: "Bundle Stacker & Modular Outfit CMS",
        route: "/admin?tab=bundle",
        category: "Storefront CMS",
        description: "Modular outfit stacker, curated garment combinations, and bundle discounts.",
        keywords: ["bundle", "bundle stacker", "modular outfit", "combo", "sets"],
        capabilities: ["navigate", "read", "create", "update", "delete"],
        controls: [{ type: "form", id: "bundle_form", name: "Bundle Stacker Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/bundle-config"],
      },
      {
        id: "textblock",
        name: "Brand Narrative & Typography CMS",
        route: "/admin?tab=textblock",
        category: "Storefront CMS",
        description: "Editorial narrative and typography design elements.",
        keywords: ["textblock", "narrative", "editorial", "typography"],
        capabilities: ["navigate", "read", "update", "reset"],
        controls: [{ type: "form", id: "textblock_form", name: "Typography Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/textblock-config"],
      },
      {
        id: "peel-reveal",
        name: "Peel Reveal Motion Cutout CMS",
        route: "/admin?tab=peel-reveal",
        category: "Storefront CMS",
        description: "Motion cutouts, interactive scroll peel reveal animation canvas.",
        keywords: ["peel reveal", "peel", "motion cutout", "animation"],
        capabilities: ["navigate", "read", "update", "reset"],
        controls: [{ type: "form", id: "peel_form", name: "Peel Canvas Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/peel-reveal-config"],
      },
      {
        id: "lookbook",
        name: "Campaign Lookbook Silhouettes CMS",
        route: "/admin?tab=lookbook",
        category: "Storefront CMS",
        description: "Fashion drop lookbook, seasonal editorial carousel cards.",
        keywords: ["lookbook", "campaign", "fashion shoot", "editorial drop"],
        capabilities: ["navigate", "read", "create", "update", "delete"],
        controls: [{ type: "form", id: "lookbook_form", name: "Lookbook Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/lookbook-config"],
      },
      {
        id: "footer",
        name: "Footer & Legal Hotline CMS",
        route: "/admin?tab=footer",
        category: "Storefront CMS",
        description: "Footer links, support hotline, copyright info, and dispatch notice.",
        keywords: ["footer", "hotline", "links", "copyright", "legal"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [{ type: "form", id: "footer_form", name: "Footer Editor" }],
        permissions: ["admin.settings.write"],
        backendApis: ["/footer-config"],
      },
      {
        id: "payments",
        name: "Payment Auth & Gateway CMS",
        route: "/admin?tab=payments",
        category: "Governance & System",
        description: "Razorpay keys, direct UPI QR code toggle, COD settings, and payment limits.",
        keywords: ["payments", "payment", "razorpay", "upi", "gateway", "cod", "paisa settings"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [
          { type: "form", id: "payment_form", name: "Payment Gateway Configuration" },
          { type: "setting", id: "toggle_cod", name: "Toggle Cash on Delivery", actionIntent: "UPDATE" },
          { type: "setting", id: "toggle_upi", name: "Toggle UPI Gateway", actionIntent: "UPDATE" },
          { type: "setting", id: "toggle_razorpay", name: "Toggle Razorpay Cards", actionIntent: "UPDATE" },
        ],
        permissions: ["admin.finance.write"],
        backendApis: ["/payment-config"],
      },
      {
        id: "gst",
        name: "Invoice & GST Compliance CMS",
        route: "/admin?tab=gst",
        category: "Governance & System",
        description: "GSTIN registration number, tax slabs, HSN codes, and official invoice layout.",
        keywords: ["gst", "invoice settings", "tax", "gstin", "hsn", "tax slab", "invoicing"],
        capabilities: ["navigate", "read", "update", "setting"],
        controls: [
          { type: "form", id: "gst_form", name: "GST Compliance Configuration" },
          { type: "setting", id: "toggle_gst", name: "Enable/Disable Tax Compliance", actionIntent: "UPDATE" },
        ],
        permissions: ["admin.finance.write"],
        backendApis: ["/gst-config"],
      },
      {
        id: "users",
        name: "Clientele & Access Governance",
        route: "/admin?tab=users",
        category: "Governance & System",
        description: "User directory, VIP clients, admin role elevation, account verification, and block/unblock controls.",
        keywords: ["users", "user", "clientele", "customers", "accounts", "admin roles", "block", "verify", "grahak"],
        capabilities: ["navigate", "search", "filter", "read", "update", "delete"],
        controls: [
          { type: "search", id: "user_search", name: "Search Client Name, Email, Phone" },
          { type: "filter", id: "user_filter", name: "User Status", options: ["ALL", "VERIFIED", "UNVERIFIED", "ADMIN", "BLOCKED", "DISABLED"] },
          { type: "button", id: "toggle_block_user", name: "Block / Unblock Client", actionIntent: "UPDATE" },
          { type: "button", id: "toggle_verify_user", name: "Verify Client", actionIntent: "UPDATE" },
          { type: "button", id: "update_user_role", name: "Change Role (Admin / User)", actionIntent: "UPDATE" },
          { type: "button", id: "delete_user", name: "Delete User", actionIntent: "DELETE" },
        ],
        permissions: ["admin.users.write"],
        backendApis: ["/user/all", "/user/admin/toggle-block/:id", "/user/admin/toggle-verify/:id", "/user/admin/update-role/:id"],
      },
      {
        id: "security-logs",
        name: "Security & Audit Telemetry Logs",
        route: "/admin?tab=security-logs",
        category: "Governance & System",
        description: "Real-time security logs, suspicious IP route requests, admin session audits, and threats.",
        keywords: ["security", "security logs", "threats", "route hits", "ip logs", "audit log"],
        capabilities: ["navigate", "read", "search", "filter"],
        controls: [
          { type: "table", id: "audit_logs_table", name: "Security Audit Telemetry" },
        ],
        permissions: ["admin.security.read"],
        backendApis: ["/audit-log"],
      },
      {
        id: "diagnostics",
        name: "Mail Engine & Failover Diagnostics",
        route: "/admin?tab=diagnostics",
        category: "Governance & System",
        description: "SMTP mail server test, failover dispatch engine, and email delivery health.",
        keywords: ["diagnostics", "mail engine", "smtp test", "failover", "system check", "email test"],
        capabilities: ["navigate", "read", "trigger"],
        controls: [
          { type: "form", id: "diagnostics_form", name: "SMTP Diagnostics" },
          { type: "button", id: "send_test_email", name: "Send Test Email", actionIntent: "TRIGGER" },
        ],
        permissions: ["admin.system.write"],
        backendApis: ["/diagnostics"],
      },
    ];

    modules.forEach((mod) => this.registry.set(mod.id, mod));
  }

  public getAllModules(): AdminFeatureModule[] {
    return Array.from(this.registry.values());
  }

  public getModule(id: string): AdminFeatureModule | undefined {
    return this.registry.get(id);
  }

  public registerModule(moduleDef: AdminFeatureModule): void {
    this.registry.set(moduleDef.id, moduleDef);
  }

  /**
   * Discovers matching module given natural language query.
   */
  public findModuleByQuery(query: string): AdminFeatureModule | null {
    const q = query.toLowerCase().trim();
    const modules = this.getAllModules();

    // Check high priority keywords first
    for (const mod of modules) {
      for (const kw of mod.keywords) {
        if (q.includes(kw)) {
          return mod;
        }
      }
    }

    // Name or category match
    for (const mod of modules) {
      if (q.includes(mod.name.toLowerCase())) {
        return mod;
      }
    }

    return null;
  }
}

export const adminCapabilityRegistry = AdminCapabilityRegistry.getInstance();
