/**
 * Canonical Language Engine — Multilingual Input to Canonical English Operating Layer
 * 
 * Pipeline:
 * User Multilingual Input (Hindi, Hinglish, Bengali, Tamil, Telugu, Spanish, French, etc.)
 *   → Language Detection
 *   → Lexicon & Slang Normalization
 *   → Canonical English Intent & Semantic Extraction
 *   → English Search Query Generation (for database & API calls)
 *   → Structured Canonical Command Object
 *   → Response Formatter in User's Natural Language
 */

export type SupportedLanguage =
  | "english"
  | "hinglish"
  | "hindi"
  | "bengali"
  | "marathi"
  | "tamil"
  | "telugu"
  | "gujarati"
  | "punjabi"
  | "urdu"
  | "spanish"
  | "french"
  | "arabic";

export interface CanonicalCommandObject {
  originalInput: string;
  detectedLanguage: SupportedLanguage;
  canonicalEnglish: string;
  intent: string;
  module: string;
  entityType?: "product" | "order" | "customer" | "coupon" | "setting" | "report" | "general";
  searchQuery?: string;
  target?: "CURRENT_SELECTED" | "ALL" | "LAST_SEARCH_RESULT" | "SPECIFIC_ID" | string;
  operation?: {
    type: "set" | "increase" | "decrease" | "increase_percentage" | "decrease_percentage" | "toggle" | "action";
    value?: number;
    unit?: "currency" | "percent" | "units";
  };
  entities: Record<string, any>;
  requiresConfirmation: boolean;
  confidence: number;
}

export class CanonicalLanguageEngine {
  private static instance: CanonicalLanguageEngine;

  private colorMap: Record<string, string> = {
    // Hindi / Hinglish / Urdu
    "kaala": "black", "kaali": "black", "kaale": "black", "kala": "black", "kali": "black", "kale": "black", "syah": "black",
    "laal": "red", "lal": "red", "surkh": "red",
    "neela": "blue", "neeli": "blue", "neele": "blue", "nila": "blue",
    "safed": "white", "chitta": "white", "chitti": "white",
    "peela": "yellow", "peeli": "yellow", "pila": "yellow", "zard": "yellow",
    "hara": "green", "hari": "green", "hare": "green", "sabz": "green",
    "gulabi": "pink",
    "baingani": "purple", "jamuni": "purple",
    "narangi": "orange", "kesari": "orange",
    "bhura": "brown", "bhuri": "brown", "badami": "brown",
    // Bengali
    "kalo": "black", "shada": "white", "neel": "blue", "holud": "yellow", "sobuj": "green", "golapi": "pink",
    // Tamil
    "karuppu": "black", "vellai": "white", "sigappu": "red", "neelam": "blue", "manjal": "yellow", "pachai": "green",
    // Telugu
    "nallani": "black", "thellani": "white", "erupu": "red", "pasupu": "yellow", "aakupachha": "green",
    // Gujarati / Marathi
    "pandhra": "white", "leelo": "green", "hirva": "green", "pivla": "yellow",
    // Spanish
    "negro": "black", "negra": "black", "rojo": "red", "roja": "red", "azul": "blue", "blanco": "white", "blanca": "white", "verde": "green", "amarillo": "yellow", "rosa": "pink",
    // French
    "noir": "black", "noire": "black", "rouge": "red", "bleu": "blue", "bleue": "blue", "blanc": "white", "blanche": "white", "vert": "green", "verte": "green", "jaune": "yellow", "rose": "pink",
    // Script versions
    "काला": "black", "काली": "black", "काले": "black", "लाल": "red", "नीला": "blue", "नीली": "blue", "सफेद": "white", "पीला": "yellow", "पीली": "yellow", "हरा": "green", "हरी": "green", "गुलाबी": "pink",
    "কালো": "black", "সাদা": "white", "লাল": "red", "নীল": "blue", "হলুদ": "yellow", "সবুজ": "green",
    "கருப்பு": "black", "சிவப்பு": "red", "வெள்ளை": "white", "நீலம்": "blue", "மஞ்சள்": "yellow",
    "నలుపు": "black", "ఎరుపు": "red", "తెలుపు": "white",
    "કાળો": "black", "લાલ": "red", "સફેદ": "white",
    "ਕਾਲਾ": "black", "ਲਾਲ": "red", "ਚਿੱਟਾ": "white",
    "سیاہ": "black", "سرخ": "red", "سفید": "white", "نیلا": "blue",
    "أسود": "black", "أحمر": "red", "أبيض": "white", "أزرق": "blue", "أخضر": "green", "أصفر": "yellow",
  };

  private apparelMap: Record<string, string> = {
    // Sarees
    "saree": "saree", "sari": "saree", "saari": "saree", "sarees": "sarees", "banarasi": "banarasi saree", "kanchipuram": "silk saree",
    "साड़ी": "saree", "साड़ियां": "sarees", "शাড়ি": "saree", "புடவை": "saree", "சேலை": "saree", "చీర": "saree", "સાડી": "saree",
    // T-shirts / Tops
    "tshirt": "t-shirt", "t-shirt": "t-shirt", "tee": "t-shirt", "tees": "t-shirts", "polo": "t-shirt", "टीशर्ट": "t-shirt", "शर्ट": "shirt", "shirt": "shirt",
    // Ethnic / Kurtis
    "kurti": "kurti", "kurtis": "kurtis", "kurta": "kurta", "kurtas": "kurtas", "anarkali": "anarkali", "कुर्ता": "kurta", "कुर्ती": "kurti", "কুর্তি": "kurti",
    // Hoodies / Winterwear
    "hoodie": "hoodie", "hoodies": "hoodies", "sweatshirt": "hoodie", "sweatshirts": "hoodies", "हुडी": "hoodie",
    // Dresses / Gowns
    "dress": "dress", "dresses": "dresses", "gown": "gown", "frock": "dress", "पोশাক": "dress", "गाउन": "gown",
    // Jackets / Outerwear
    "jacket": "jacket", "jackets": "jackets", "coat": "jacket", "blazer": "jacket", "जैकेट": "jacket", "कोट": "jacket",
    // Bottoms / Pants
    "trouser": "trouser", "trousers": "trousers", "pant": "trouser", "pants": "trousers", "jeans": "jeans", "denim": "jeans",
    // Ethnic sets / Combos
    "lehenga": "lehenga", "choli": "lehenga", "dupatta": "dupatta", "sherwani": "sherwani", "coord": "co-ord set", "set": "co-ord set",
    // Generic
    "garment": "garment", "garments": "garments", "kapda": "garment", "kapde": "garments", "maal": "garments", "कपड़े": "garments", "कपड़ा": "garment", "चीजें": "garments",
    "prendas": "garments", "ropa": "garments", "vêtements": "garments", "ملابس": "garments",
  };

  private numberWordMap: Record<string, number> = {
    "ek": 1, "do": 2, "teen": 3, "char": 4, "chaar": 4, "paanch": 5, "panch": 5,
    "che": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10, "dus": 10,
    "gyarah": 11, "barah": 12, "terah": 13, "chaudah": 14, "pandrah": 15, "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19,
    "bees": 20, "pachees": 25, "tees": 30, "paintees": 35, "chalis": 40, "pentalis": 45, "pachas": 50,
    "saath": 60, "sattar": 70, "assi": 80, "nabbe": 90, "sau": 100, "hazaar": 1000,
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "पंद्रह": 15, "बीस": 20, "पचीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50, "सौ": 100, "हज़ार": 1000,
    "uno": 1, "dos": 2, "tres": 3, "diez": 10, "quince": 15, "veinte": 20, "cincuenta": 50, "cien": 100,
    "un": 1, "deux": 2, "trois": 3, "dix": 10, "quinze": 15, "vingt": 20, "cinquante": 50, "cent": 100,
  };

  private moduleKeywordMap: Record<string, string> = {
    // 01 Overview
    "overview": "overview", "analytics": "overview", "dashboard": "overview", "sales": "overview", "kamai": "overview", "revenue": "overview",
    "बिक्री": "overview", "कमाई": "overview", "ventas": "overview", "ingresos": "overview", "analítica": "overview",
    // 02 Reports
    "report": "reports", "reports": "reports", "audit": "reports", "excel": "reports", "pdf report": "reports", "रिपोर्ट": "reports", "informes": "reports", "rapports": "reports",
    // 03 Visitor Radar
    "radar": "radar", "traffic": "radar", "visitor": "radar", "visitors": "radar", "live ip": "radar", "gps tracking": "radar", "रडार": "radar", "विजिटर": "radar",
    // 04 Search Radar
    "search radar": "search-radar", "search demand": "search-radar", "zero result": "search-radar", "सर्च रडार": "search-radar",
    // 05 Abandoned Bags
    "abandoned": "abandoned-bags", "cart drop": "abandoned-bags", "adhure cart": "abandoned-bags", "carritos": "abandoned-bags",
    // 06 Orders
    "order": "orders", "orders": "orders", "pedido": "orders", "pedidos": "orders", "commande": "orders", "commandes": "orders",
    "ऑर्डर": "orders", "आर्डर": "orders", "অর্ডার": "orders", "ஆர்டர்கள்": "orders", "ఆర్డర్లు": "orders", "طلبات": "orders",
    // 07 Appointments
    "appointment": "appointments", "appointments": "appointments", "fitting": "appointments", "tailor": "appointments", "darji": "appointments", "अपॉइंटमेंट": "appointments",
    // 08 Returns Vault
    "return": "returns-vault", "returns": "returns-vault", "exchange": "returns-vault", "wapsi": "returns-vault", "वापसी": "returns-vault", "devoluciones": "returns-vault", "retours": "returns-vault",
    // 09 Products
    "product": "products", "products": "products", "garment": "products", "garments": "products", "catalog": "products", "inventory": "products",
    "कपड़े": "products", "कपड़ा": "products", "माल": "products", "productos": "products", "prendas": "products", "produits": "products",
    // 10 Shipping Rules
    "shipping": "shipping-rules", "courier": "shipping-rules", "delivery": "shipping-rules", "pincode": "shipping-rules", "शिपिंग": "shipping-rules", "envios": "shipping-rules", "livraison": "shipping-rules",
    // 11 Support Tickets
    "support": "support-tickets", "ticket": "support-tickets", "tickets": "support-tickets", "complaint": "support-tickets", "शिकायत": "support-tickets", "soporte": "support-tickets",
    // 12 Wardrobe Filters
    "filter": "filters", "filters": "filters", "wardrobe": "filters", "फ़िल्टर": "filters", "filtros": "filters",
    // 13 Reviews
    "review": "reviews", "reviews": "reviews", "rating": "reviews", "feedback": "reviews", "समीक्षा": "reviews", "reseñas": "reviews",
    // 14 Site Identity / SEO & Logo Studio
    "seo": "site-identity", "meta": "site-identity", "favicon": "site-identity", "site identity": "site-identity",
    "logo": "site-identity", "brand logo": "site-identity", "website logo": "site-identity", "emblem": "site-identity", "लोगो": "site-identity", "ब्रांड लोगो": "site-identity",
    // 15 Hero CMS
    "hero": "hero", "hero banner": "hero", "हीरो": "hero",
    // 16 Silhouettes CTA
    "cta": "cta", "silhouettes": "cta", "tri card": "cta",
    // 17 Statement / Manifesto
    "manifesto": "statement", "philosophy": "statement", "brand quote": "statement",
    // 18 Bundle Stacker
    "bundle": "bundle", "combo": "bundle", "stacker": "bundle", "बंडल": "bundle",
    // 19 Narrative / Textblock
    "narrative": "textblock", "editorial": "textblock", "typography": "textblock",
    // 20 Peel Reveal
    "peel": "peel-reveal", "reveal": "peel-reveal", "motion cutout": "peel-reveal",
    // 21 Lookbook
    "lookbook": "lookbook", "campaign": "lookbook", "fashion drop": "lookbook",
    // 22 Footer CMS
    "footer": "footer", "hotline": "footer", "legal": "footer", "फुटर": "footer",
    // 23 BOGO CMS
    "bogo": "bogo-cms", "buy 1 get": "bogo-cms", "tier engine": "bogo-cms", "बोगो": "bogo-cms",
    // 24 Newsletter CRM
    "newsletter": "newsletter-crm", "subscriber": "newsletter-crm", "subscribers": "newsletter-crm", "न्यूज़लेटर": "newsletter-crm",
    // 25 Countdown Studio
    "countdown": "countdown", "flash sale": "countdown", "timer": "countdown", "सेल": "countdown",
    // 26 Coupons Vault
    "coupon": "coupons", "coupons": "coupons", "voucher": "coupons", "vouchers": "coupons", "कूपन": "coupons", "cupon": "coupons", "cupones": "coupons",
    // 27 Vault Cards / Wallet
    "wallet": "vault-cards", "gift card": "vault-cards", "store credit": "vault-cards", "वॉलेट": "vault-cards",
    // 28 Shop The Look / UGC
    "shop the look": "shop-the-look", "ugc": "shop-the-look", "instagram": "shop-the-look",
    // 29 Payments
    "payment": "payments", "payments": "payments", "razorpay": "payments", "upi": "payments", "cod": "payments", "पेमेंट": "payments", "pagos": "payments",
    // 30 GST Compliance
    "gst": "gst", "gstin": "gst", "tax": "gst", "टैक्स": "gst", "impuestos": "gst",
    // 31 Users
    "user": "users", "users": "users", "customer": "users", "customers": "users", "clientele": "users", "ग्राहक": "users", "clientes": "users",
    // 32 Security Logs
    "security": "security-logs", "audit log": "security-logs", "threat": "security-logs", "सुरक्षा": "security-logs",
    // 33 Diagnostics
    "diagnostics": "diagnostics", "diagnostic": "diagnostics", "mail engine": "diagnostics", "smtp": "diagnostics", "डायग्नोस्टिक्स": "diagnostics",
  };

  private constructor() {}

  public static getInstance(): CanonicalLanguageEngine {
    if (!CanonicalLanguageEngine.instance) {
      CanonicalLanguageEngine.instance = new CanonicalLanguageEngine();
    }
    return CanonicalLanguageEngine.instance;
  }

  /**
   * Automatically detects language of user voice or text input
   */
  public detectLanguage(input: string): SupportedLanguage {
    const text = input.trim();

    // Script checks
    if (/[\u0900-\u097F]/.test(text)) {
      // Devanagari script: Hindi or Marathi
      if (text.includes("आहे") || text.includes("दाखवा") || text.includes("करा") || text.includes("कमी")) {
        return "marathi";
      }
      return "hindi";
    }
    if (/[\u0980-\u09FF]/.test(text)) return "bengali";
    if (/[\u0B80-\u0BFF]/.test(text)) return "tamil";
    if (/[\u0C00-\u0C7F]/.test(text)) return "telugu";
    if (/[\u0A80-\u0AFF]/.test(text)) return "gujarati";
    if (/[\u0A00-\u0A7F]/.test(text)) return "punjabi";
    if (/[\u0600-\u06FF]/.test(text)) return "arabic";

    const lower = text.toLowerCase();

    // Spanish keywords
    if (
      /\b(por favor|muestra|mostrar|precio|pedidos|productos|descuento|reducir|eliminar|abrir|cupon|quien|donde)\b/i.test(lower)
    ) {
      return "spanish";
    }

    // French keywords
    if (
      /\b(s'il vous plaît|montre|montrez|prix|commandes|produits|rabais|réduire|supprimer|ouvrir|bonjour)\b/i.test(lower)
    ) {
      return "french";
    }

    // Bengali Romanized
    if (
      /\b(amar|amake|dekhao|gulo|koto|koren|apnar|taka)\b/i.test(lower)
    ) {
      return "bengali";
    }

    // Hinglish keywords
    if (
      /\b(bhai|kholo|dikhao|dikha|kar|kardo|karo|aaj|kitne|kitna|wala|wali|wale|isko|iska|iski|hatao|banao|pehle|last|bik|paisa|rate|saman|chhoot|kam)\b/i.test(lower)
    ) {
      return "hinglish";
    }

    // Default Latin fallback
    return "english";
  }


  /**
   * Normalizes multilingual entities (colors, apparel, commerce terms) into canonical English terms.
   */
  public extractCanonicalEntities(text: string): {
    color?: string;
    category?: string;
    searchTerms: string[];
    numericValue?: number;
    isPercentage?: boolean;
    isRelativeDecrease?: boolean;
    isRelativeIncrease?: boolean;
  } {
    const lower = text.toLowerCase();
    const words = lower.split(/[\s,._\-?!=+]+/);

    let foundColor: string | undefined;
    let foundCategory: string | undefined;
    const searchTerms: string[] = [];

    // Check color mappings
    for (const word of words) {
      if (this.colorMap[word]) {
        foundColor = this.colorMap[word];
        break;
      }
    }

    // Check apparel mappings
    for (const word of words) {
      if (this.apparelMap[word]) {
        foundCategory = this.apparelMap[word];
        break;
      }
    }

    if (foundColor) searchTerms.push(foundColor);
    if (foundCategory) searchTerms.push(foundCategory);

    // Number extraction
    const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
    let numericValue = numMatch ? parseFloat(numMatch[1]) : undefined;
    if (numericValue === undefined) {
      for (const word of words) {
        if (this.numberWordMap[word] !== undefined) {
          numericValue = this.numberWordMap[word];
          break;
        }
      }
    }

    // Percentage extraction
    const isPercentage = lower.includes("%") || lower.includes("percent") || lower.includes("pratishat") || lower.includes("percentage") || lower.includes("shatakar");

    // Operations: Relative decrease vs absolute set
    const isRelativeDecrease =
      lower.includes("kam") ||
      lower.includes("ghata") ||
      lower.includes("reduce") ||
      lower.includes("decrease") ||
      lower.includes("off") ||
      lower.includes("discount") ||
      lower.includes("कम") ||
      lower.includes("कमी") ||
      lower.includes("குறை") ||
      lower.includes("reducir") ||
      lower.includes("réduire");

    const isRelativeIncrease =
      lower.includes("badha") ||
      lower.includes("increase") ||
      lower.includes("add") ||
      lower.includes("बढ़ा") ||
      lower.includes("கூட்டு");

    return {
      color: foundColor,
      category: foundCategory,
      searchTerms,
      numericValue,
      isPercentage,
      isRelativeDecrease,
      isRelativeIncrease,
    };
  }

  /**
   * Translates multilingual user query into Canonical English Intent & Command Object.
   */
  public normalizeToCanonicalEnglish(rawInput: string, currentContext: { activeTab: string; currentProduct?: any; currentOrder?: any }): CanonicalCommandObject {
    const detectedLanguage = this.detectLanguage(rawInput);
    const lower = rawInput.toLowerCase().trim();
    const entities = this.extractCanonicalEntities(rawInput);

    let canonicalEnglish = "";
    let intent = "GENERAL_QUERY";
    let module = "overview";
    let target = "CURRENT_SELECTED";
    let searchQuery: string | undefined;
    let requiresConfirmation = false;
    let operation: CanonicalCommandObject["operation"] = undefined;

    // Build English search query for the website/backend
    if (entities.searchTerms.length > 0) {
      searchQuery = entities.searchTerms.join(" ");
    }

    // =========================================================================
    // PRICE MUTATION INTENTS
    // e.g. "bhai black saree ka price 10 percent kam kar"
    // e.g. "इस साड़ी का रेट 500 कम कर"
    // e.g. "reduce price by 10%"
    // =========================================================================
    const isPriceQuery =
      lower.includes("price") ||
      lower.includes("rate") ||
      lower.includes("daam") ||
      lower.includes("keemat") ||
      lower.includes("kimat") ||
      lower.includes("कीमत") ||
      lower.includes("रेट") ||
      lower.includes("दाम") ||
      lower.includes("दर") ||
      lower.includes("விலை") ||
      lower.includes("precio") ||
      lower.includes("prix");

    if (isPriceQuery && entities.numericValue !== undefined) {
      intent = "UPDATE_PRODUCT_PRICE";
      module = "products";

      if (entities.isPercentage && entities.isRelativeDecrease) {
        canonicalEnglish = `Decrease the price of ${searchQuery || "the selected garment"} by ${entities.numericValue} percent.`;
        operation = { type: "decrease_percentage", value: entities.numericValue, unit: "percent" };
      } else if (entities.isRelativeDecrease) {
        canonicalEnglish = `Decrease the price of ${searchQuery || "the selected garment"} by ${entities.numericValue} INR.`;
        operation = { type: "decrease", value: entities.numericValue, unit: "currency" };
      } else if (entities.isRelativeIncrease) {
        canonicalEnglish = `Increase the price of ${searchQuery || "the selected garment"} by ${entities.numericValue} INR.`;
        operation = { type: "increase", value: entities.numericValue, unit: "currency" };
      } else {
        canonicalEnglish = `Set the price of ${searchQuery || "the selected garment"} to ${entities.numericValue} INR.`;
        operation = { type: "set", value: entities.numericValue, unit: "currency" };
      }

      return {
        originalInput: rawInput,
        detectedLanguage,
        canonicalEnglish,
        intent,
        module,
        entityType: "product",
        searchQuery: searchQuery || (currentContext.currentProduct ? currentContext.currentProduct.name : undefined),
        target: searchQuery ? "SEARCH_MATCH" : "CURRENT_SELECTED",
        operation,
        entities: { ...entities },
        requiresConfirmation: false,
        confidence: 0.95,
      };
    }

    // =========================================================================
    // STOCK MUTATION INTENTS
    // e.g. "stock 30 kar do"
    // e.g. "इस प्रोडक्ट का स्टॉक 50 करो"
    // =========================================================================
    const isStockQuery =
      lower.includes("stock") ||
      lower.includes("inventory") ||
      lower.includes("स्टॉक") ||
      lower.includes("इन्वेंटरी") ||
      lower.includes("கையிருப்பு");

    if (isStockQuery && entities.numericValue !== undefined) {
      intent = "UPDATE_PRODUCT_STOCK";
      module = "products";
      if (entities.isRelativeDecrease) {
        canonicalEnglish = `Decrease the stock of ${searchQuery || "the selected garment"} by ${entities.numericValue} units.`;
        operation = { type: "decrease", value: entities.numericValue, unit: "units" };
      } else if (entities.isRelativeIncrease) {
        canonicalEnglish = `Increase the stock of ${searchQuery || "the selected garment"} by ${entities.numericValue} units.`;
        operation = { type: "increase", value: entities.numericValue, unit: "units" };
      } else {
        canonicalEnglish = `Set the stock of ${searchQuery || "the selected garment"} to ${entities.numericValue} units.`;
        operation = { type: "set", value: entities.numericValue, unit: "units" };
      }

      return {
        originalInput: rawInput,
        detectedLanguage,
        canonicalEnglish,
        intent,
        module,
        entityType: "product",
        searchQuery: searchQuery || (currentContext.currentProduct ? currentContext.currentProduct.name : undefined),
        target: searchQuery ? "SEARCH_MATCH" : "CURRENT_SELECTED",
        operation,
        entities: { ...entities },
        requiresConfirmation: false,
        confidence: 0.95,
      };
    }

    // =========================================================================
    // PRODUCT SEARCH / DISPLAY
    // e.g. "लाल साड़ी दिखाओ" -> "Show red sarees"
    // e.g. "amar black saree gulo dekhao" -> "Show black sarees"
    // =========================================================================
    const isShowOrSearch =
      lower.includes("dikhao") ||
      lower.includes("dikha") ||
      lower.includes("dekhao") ||
      lower.includes("kholo") ||
      lower.includes("show") ||
      lower.includes("find") ||
      lower.includes("search") ||
      lower.includes("दिखाओ") ||
      lower.includes("खोलो") ||
      lower.includes("காட்டு") ||
      lower.includes("muestra") ||
      lower.includes("montre");

    if (isShowOrSearch && (entities.color || entities.category)) {
      intent = "SEARCH_PRODUCTS";
      module = "products";
      canonicalEnglish = `Search and display ${searchQuery || "products"} in Garments Catalog.`;

      return {
        originalInput: rawInput,
        detectedLanguage,
        canonicalEnglish,
        intent,
        module,
        entityType: "product",
        searchQuery,
        target: "SEARCH_RESULTS",
        entities: { ...entities },
        requiresConfirmation: false,
        confidence: 0.98,
      };
    }

    // =========================================================================
    // ORDER INTENTS (CONFIRM, SHIP, CANCEL, INVOICE)
    // e.g. "iss order ko confirm karo"
    // e.g. "इस आर्डर को शिप करो"
    // e.g. "process invoice"
    // =========================================================================
    const isOrderMention =
      lower.includes("order") ||
      lower.includes("orders") ||
      lower.includes("ऑर्डर") ||
      lower.includes("आर्डर") ||
      lower.includes("pedido") ||
      lower.includes("commande") ||
      lower.includes("dispatch");

    if (isOrderMention) {
      module = "orders";
      if (lower.includes("confirm") || lower.includes("कन्फर्म") || lower.includes("svikar")) {
        intent = "CONFIRM_ORDER";
        canonicalEnglish = "Confirm the specified order.";
      } else if (lower.includes("ship") || lower.includes("dispatch") || lower.includes("रवाना")) {
        intent = "SHIP_ORDER";
        canonicalEnglish = "Mark the order as shipped.";
      } else if (lower.includes("deliver") || lower.includes("डिलीवर")) {
        intent = "DELIVER_ORDER";
        canonicalEnglish = "Mark the order as delivered.";
      } else if (lower.includes("cancel") || lower.includes("radd") || lower.includes("रद्द")) {
        intent = "CANCEL_ORDER";
        canonicalEnglish = "Cancel the specified order.";
        requiresConfirmation = true;
      } else if (lower.includes("invoice") || lower.includes("bill") || lower.includes("बिल") || lower.includes("इनवॉइस")) {
        intent = "DOWNLOAD_INVOICE";
        canonicalEnglish = "Download GST tax invoice PDF for the order.";
      } else if (lower.includes("thermal") || lower.includes("label")) {
        intent = "PRINT_THERMAL_LABEL";
        canonicalEnglish = "Open 4x6 thermal shipping label print dialog.";
      } else {
        intent = "NAVIGATE_MODULE";
        canonicalEnglish = "Open Order Vault module.";
      }

      return {
        originalInput: rawInput,
        detectedLanguage,
        canonicalEnglish,
        intent,
        module,
        entityType: "order",
        target: currentContext.currentOrder ? "CURRENT_SELECTED" : "ALL",
        entities: { ...entities },
        requiresConfirmation,
        confidence: 0.92,
      };
    }

    // =========================================================================
    // SCROLL INTENTS
    // e.g. "page scroll kro", "page scroll karo", "scroll down", "niche scroll karo",
    //      "scroll up", "upar scroll karo", "top pe jao", "bottom pe jao", "niche jao", "upar jao"
    // =========================================================================
    const isScrollMention =
      lower.includes("scroll") ||
      lower.includes("scrol") ||
      lower.includes("स्क्रोल") ||
      lower.includes("स्क्रॉल") ||
      lower.includes("niche jao") ||
      lower.includes("neeche jao") ||
      lower.includes("upar jao") ||
      lower.includes("niche karo") ||
      lower.includes("neeche karo") ||
      lower.includes("upar karo") ||
      ((lower.includes("page") || lower.includes("screen") || lower.includes("पेज")) &&
        (lower.includes("niche") || lower.includes("neeche") || lower.includes("upar") || lower.includes("down") || lower.includes("up") || lower.includes("top") || lower.includes("bottom") || lower.includes("नीचे") || lower.includes("ऊपर")));

    if (isScrollMention) {
      let direction = "down";
      if (lower.includes("top") || lower.includes("ekdam upar") || lower.includes("shuru") || lower.includes("start") || lower.includes("ऊपर का भाग")) {
        direction = "top";
      } else if (lower.includes("bottom") || lower.includes("ekdam niche") || lower.includes("ekdam neeche") || lower.includes("aakhri") || lower.includes("end") || lower.includes("नीचे का भाग")) {
        direction = "bottom";
      } else if (lower.includes("up") || lower.includes("upar") || lower.includes("ऊपर")) {
        direction = "up";
      }

      return {
        originalInput: rawInput,
        detectedLanguage,
        canonicalEnglish: `Scroll page ${direction}.`,
        intent: "SCROLL_PAGE",
        module: currentContext.activeTab || "overview",
        entityType: "general",
        target: direction,
        entities: { ...entities },
        requiresConfirmation: false,
        confidence: 0.99,
      };
    }

    // =========================================================================
    // MODULE NAVIGATION ACROSS ALL 33 MODULES VIA MULTILINGUAL DICTIONARY
    // =========================================================================
    for (const [kw, modId] of Object.entries(this.moduleKeywordMap)) {
      if (lower.includes(kw)) {
        canonicalEnglish = `Open ${modId.toUpperCase()} module and display requested controls.`;
        intent = "NAVIGATE_MODULE";
        module = modId;
        return {
          originalInput: rawInput,
          detectedLanguage,
          canonicalEnglish,
          intent,
          module,
          searchQuery,
          entities: { ...entities },
          requiresConfirmation: false,
          confidence: 0.94,
        };
      }
    }

    // Default dynamic intent
    canonicalEnglish = `Execute administrator instruction: ${rawInput}`;
    intent = "DYNAMIC_COMMAND";
    module = currentContext.activeTab || "overview";

    return {
      originalInput: rawInput,
      detectedLanguage,
      canonicalEnglish,
      intent,
      module,
      searchQuery,
      entities: { ...entities },
      requiresConfirmation,
      confidence: 0.85,
    };
  }

  /**
   * Responds to the user in their own detected language and style.
   */
  public formatMultilingualResponse(
    lang: SupportedLanguage,
    englishMessage: string,
    spokenHindiDefault: string
  ): { text: string; spokenHindi: string } {
    switch (lang) {
      case "english":
        return {
          text: englishMessage,
          spokenHindi: englishMessage,
        };

      case "hindi":
        return {
          text: spokenHindiDefault,
          spokenHindi: spokenHindiDefault,
        };

      case "bengali":
        return {
          text: `কাজটি হয়ে গেছে (Done): ${englishMessage}`,
          spokenHindi: spokenHindiDefault,
        };

      case "tamil":
        return {
          text: `முடிந்தது (Done): ${englishMessage}`,
          spokenHindi: spokenHindiDefault,
        };

      case "telugu":
        return {
          text: `పూర్తయింది (Done): ${englishMessage}`,
          spokenHindi: spokenHindiDefault,
        };

      case "marathi":
        return {
          text: `झाले सर (Done): ${spokenHindiDefault}`,
          spokenHindi: spokenHindiDefault,
        };

      case "gujarati":
        return {
          text: `થઈ ગયું સર (Done): ${englishMessage}`,
          spokenHindi: spokenHindiDefault,
        };

      case "punjabi":
        return {
          text: `ਹੋ ਗਿਆ ਜੀ (Done): ${englishMessage}`,
          spokenHindi: spokenHindiDefault,
        };

      case "urdu":
        return {
          text: `جی سر، مکمل ہو گیا: ${spokenHindiDefault}`,
          spokenHindi: spokenHindiDefault,
        };

      case "spanish":
        return {
          text: `Listo: ${englishMessage}`,
          spokenHindi: englishMessage,
        };

      case "french":
        return {
          text: `Terminé: ${englishMessage}`,
          spokenHindi: englishMessage,
        };

      case "arabic":
        return {
          text: `تم بنجاح (Done): ${englishMessage}`,
          spokenHindi: englishMessage,
        };

      case "hinglish":
      default:
        return {
          text: englishMessage,
          spokenHindi: spokenHindiDefault,
        };
    }
  }
}

export const canonicalLanguageEngine = CanonicalLanguageEngine.getInstance();
