// Secure API Endpoint Resolver:
// In the browser, always use relative same-origin "/api" endpoint so that backend host, port, and IP are completely hidden from DevTools.
// During Server-Side Rendering (SSR) on Node.js, reach the backend directly using private INTERNAL_BACKEND_URL.
const getApiBase = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "/api";
  }
  const internalBackend =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:5000";
  return `${internalBackend.replace(/\/$/, "")}/api`;
};

const API_BASE = getApiBase();

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// Universal Request Helper with Credentials & Error Handling
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // If body is not FormData, attach application/json Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach Bearer token from client session if available
  if (typeof window !== "undefined" && !headers["Authorization"]) {
    try {
      const savedToken = localStorage.getItem("drapza_token");
      if (savedToken) {
        headers["Authorization"] = `Bearer ${savedToken}`;
      }
    } catch {}
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Sends and receives httpOnly cookies
    });

    let data: any;
    const contentType = (res.headers && typeof res.headers.get === "function") ? (res.headers.get("content-type") || "") : "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: res.ok,
          message: text || `HTTP ${res.status}: ${res.statusText}`,
          statusCode: res.status,
        };
      }
    }

    if (res.status === 401 && (data?.sessionTerminated || data?.message?.includes("terminated"))) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("drapza_session_terminated", { detail: data }));
      }
    }

    return data;
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[DRAPZA API ERROR] ${options.method || "GET"} ${endpoint}:`, error);
    }
    return {
      success: false,
      message: error.message || "Failed to communicate with Drapza Atelier servers.",
    };
  }
}

// User / Authentication Services
export const userApi = {
  register: (userData: { name: string; email: string; password: string }) =>
    apiRequest("/user/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiRequest("/user/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  verifyOtp: (payload: { email: string; otp: string }) =>
    apiRequest("/user/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resendOtp: (payload: { email: string }) =>
    apiRequest("/user/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  googleAuth: (payload: { idToken?: string; credential?: string; accessToken?: string }) =>
    apiRequest("/user/google", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiRequest("/user/logout", {
      method: "POST",
    }),

  getProfile: () => apiRequest("/user/profile"),

  updateProfile: (
    profileData: FormData | { name?: string; phone?: string; savedAddress?: any }
  ) =>
    apiRequest("/user/profile", {
      method: "PUT",
      body: profileData instanceof FormData ? profileData : JSON.stringify(profileData),
    }),

  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    apiRequest("/user/change-password", {
      method: "PUT",
      body: JSON.stringify(passwords),
    }),

  forgotPassword: (email: string) =>
    apiRequest("/user/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest(`/user/reset-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    }),

  contact: (contactData: {
    name: string;
    email: string;
    orderRef?: string;
    topic?: string;
    message: string;
  }) =>
    apiRequest("/user/contact", {
      method: "POST",
      body: JSON.stringify(contactData),
    }),

  testSmtp: (email?: string) =>
    apiRequest("/user/test-smtp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// Product Catalog Services
export const productApi = {
  getAll: (params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    inStockOnly?: boolean;
    hideOutOfStock?: boolean;
    includeOutOfStock?: boolean;
    stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.minPrice) query.append("minPrice", String(params.minPrice));
    if (params?.maxPrice) query.append("maxPrice", String(params.maxPrice));
    if (params?.sort) query.append("sort", params.sort);
    if (params?.inStockOnly) query.append("inStockOnly", "true");
    if (params?.hideOutOfStock) query.append("hideOutOfStock", "true");
    if (params?.includeOutOfStock) query.append("includeOutOfStock", "true");
    if (params?.stockStatus) query.append("stockStatus", params.stockStatus);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString();
    return apiRequest(`/product${queryString ? `?${queryString}` : ""}`);
  },

  visualSearch: (payload: {
    category?: string;
    color?: string;
    colorName?: string;
    fabric?: string;
    query?: string;
    dominantColors?: string[];
  }) =>
    apiRequest<{ success: boolean; count: number; products: any[] }>("/product/visual-search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getByIdOrSlug: (idOrSlug: string) => apiRequest(`/product/${idOrSlug}`),

  validateStock: (items: Array<{ productId?: string; name?: string; slug?: string; quantity: number }>) =>
    apiRequest<{
      success: boolean;
      isValid: boolean;
      items: Array<{
        productId?: string;
        name: string;
        requestedQuantity: number;
        availableStock: number;
        inStock: boolean;
        isValid: boolean;
        error?: string;
      }>;
      message?: string;
    }>('/products/validate-stock', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  updateStock: (id: string, stock: number) =>
    apiRequest<{ success: boolean; message: string; product?: any }>(`/product/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }),

  seed: (force: boolean = false) =>
    apiRequest(`/product/seed${force ? "?force=true" : ""}`, { method: "POST" }),

  getExportCsvUrl: () => `${API_BASE}/product/export-csv`,
  getCsvTemplateUrl: () => `${API_BASE}/product/csv-template`,
  bulkImport: (products: any[]) =>
    apiRequest<{
      success: boolean;
      message: string;
      insertedCount?: number;
      errorsCount?: number;
      errors?: any[];
    }>("/product/bulk-import", {
      method: "POST",
      body: JSON.stringify({ products }),
    }),
  applyBulkDiscount: (data: {
    discountPercentage?: number;
    discountTagActive?: boolean;
    offerTag?: string;
    targetScope?: "all" | "category" | "in_stock";
    targetCategory?: string;
    action?: "apply" | "remove" | "toggle_active";
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      modifiedCount?: number;
      discountPercentage?: number;
      offerTag?: string;
      discountTagActive?: boolean;
    }>("/product/bulk-discount", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadImage: (base64Image: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      url: string;
      publicId?: string;
    }>("/product/upload-image", {
      method: "POST",
      body: JSON.stringify({ image: base64Image, folder: "drapza_products" }),
    }),
  uploadGoogleDriveImage: (base64Image: string, fileName?: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      url: string;
      fileId?: string;
      webViewLink?: string;
    }>("/product/upload-google-drive", {
      method: "POST",
      body: JSON.stringify({ image: base64Image, fileName }),
    }),
};

export const productsApi = productApi;

// Cart / Shopping Bag Persistence Services (MongoDB)
export const cartApi = {
  getCart: (guestId?: string) =>
    apiRequest(`/cart${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`, {
      headers: guestId ? { "x-guest-id": guestId } : {},
    }),

  syncCart: (items: any[], guestId?: string) =>
    apiRequest("/cart", {
      method: "POST",
      headers: guestId ? { "x-guest-id": guestId } : {},
      body: JSON.stringify({ items, guestId }),
    }),

  addToCart: (item: any, guestId?: string) =>
    apiRequest("/cart/add", {
      method: "POST",
      headers: guestId ? { "x-guest-id": guestId } : {},
      body: JSON.stringify({ item, guestId }),
    }),

  updateQuantity: (payloadOrId: any, maybeQty?: number) => {
    let body: any = {};
    let guestId: string | undefined;

    if (typeof payloadOrId === "object" && payloadOrId !== null) {
      body = payloadOrId;
      guestId = payloadOrId.guestId;
    } else {
      body = { cartItemId: payloadOrId, quantity: maybeQty };
    }

    return apiRequest("/cart/quantity", {
      method: "PATCH",
      headers: guestId ? { "x-guest-id": guestId } : {},
      body: JSON.stringify(body),
    });
  },

  removeFromCart: (cartItemId: string, guestId?: string) =>
    apiRequest(`/cart/item/${encodeURIComponent(cartItemId)}${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`, {
      method: "DELETE",
      headers: guestId ? { "x-guest-id": guestId } : {},
    }),

  removeItem: (itemId: string, guestId?: string) =>
    apiRequest(`/cart/remove/${encodeURIComponent(itemId)}${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`, {
      method: "DELETE",
      headers: guestId ? { "x-guest-id": guestId } : {},
    }),

  clearCart: (guestId?: string) =>
    apiRequest(`/cart${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`, {
      method: "DELETE",
      headers: guestId ? { "x-guest-id": guestId } : {},
    }),

  mergeCart: (items: any[], guestId?: string) =>
    apiRequest("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ items, guestId }),
    }),
};

// Shared Bag Services
export const sharedBagApi = {
  createSharedBag: (payload: { items: any[]; sharerName?: string }) =>
    apiRequest<{
      success: boolean;
      message: string;
      shareId: string;
      shareUrl: string;
      sharerName: string;
      totalCount: number;
      totalAmount: number;
      expiresAt: string;
    }>("/shared-bag", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getSharedBag: (shareId: string) =>
    apiRequest<{
      success: boolean;
      sharedBag?: {
        shareId: string;
        sharerName: string;
        items: Array<{
          cartItemId?: string;
          productId?: string;
          name: string;
          slug?: string;
          price: number;
          originalPrice?: number;
          selectedSize: string;
          color: string;
          image: string;
          quantity: number;
          bogoTier?: any;
          isAvailable: boolean;
          currentStock: number;
        }>;
        totalAmount: number;
        totalCount: number;
        createdAt: string;
        expiresAt: string;
      };
      message?: string;
    }>(`/shared-bag/${encodeURIComponent(shareId)}`),
};

// Wishlist Services
export const wishlistApi = {
  getWishlist: () => apiRequest("/wishlist"),

  addToWishlist: (productId: string) =>
    apiRequest("/wishlist/add", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  toggleWishlist: (productId: string) =>
    apiRequest("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  removeFromWishlist: (productId: string) =>
    apiRequest(`/wishlist/remove/${productId}`, {
      method: "DELETE",
    }),
};

// Address Services
export const addressApi = {
  getAddresses: () => apiRequest("/address"),

  addAddress: (addressData: any) =>
    apiRequest("/address", {
      method: "POST",
      body: JSON.stringify(addressData),
    }),

  updateAddress: (id: string, addressData: any) =>
    apiRequest(`/address/${id}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    }),

  deleteAddress: (id: string) =>
    apiRequest(`/address/${id}`, {
      method: "DELETE",
    }),

  setDefault: (id: string) =>
    apiRequest(`/address/${id}/default`, {
      method: "PUT",
    }),
};

// Order Services
export const orderApi = {
  createOrder: (orderData: any) =>
    apiRequest("/order/create", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  verifyPayment: (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId?: string;
  }) =>
    apiRequest("/order/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  verifyCashfreePayment: (paymentData: {
    orderId?: string;
    cashfreeOrderId?: string;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      order?: any;
      orderStatus?: string;
    }>("/order/verify-cashfree-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  getMyOrders: () => apiRequest("/order/my-orders"),

  getSingleOrder: (id: string) => apiRequest(`/order/${id}`),

  trackOrder: (trackingRef: string) => apiRequest(`/order/track/${trackingRef}`),

  cancelOrder: (
    id: string,
    payload?: { reason?: string; email?: string; phone?: string }
  ) =>
    apiRequest<{
      success: boolean;
      message: string;
      order?: any;
    }>(`/order/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
};

// Admin Command Center Services
export const adminApi = {
  getStats: () => apiRequest("/order/admin/stats"),

  getAllOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString();
    return apiRequest(`/order/admin/all${qs ? `?${qs}` : ""}`);
  },

  updateOrderStatus: (orderId: string, orderStatus: string) =>
    apiRequest(`/order/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ orderStatus }),
    }),

  getAllUsers: () => apiRequest("/user/all"),

  toggleBlockUser: (id: string) =>
    apiRequest(`/user/admin/toggle-block/${id}`, { method: "POST" }),

  toggleDisableUser: (id: string) =>
    apiRequest(`/user/admin/toggle-disable/${id}`, { method: "POST" }),

  toggleVerifyUser: (id: string) =>
    apiRequest(`/user/admin/toggle-verify/${id}`, { method: "POST" }),

  terminateSession: (id: string) =>
    apiRequest<{ success: boolean; message: string; user?: any }>(`/user/admin/terminate-session/${id}`, { method: "POST" }),

  updateUserRole: (id: string, role: "user" | "admin") =>
    apiRequest<{ success: boolean; message: string; user?: any }>(`/user/admin/update-role/${id}`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    apiRequest(`/user/admin/delete/${id}`, { method: "DELETE" }),

  createProduct: (productData: any) =>
    apiRequest("/product", {
      method: "POST",
      body: productData instanceof FormData ? productData : JSON.stringify(productData),
    }),

  updateProduct: (id: string, productData: any) =>
    apiRequest(`/product/${id}`, {
      method: "PUT",
      body: productData instanceof FormData ? productData : JSON.stringify(productData),
    }),

  updateStock: (id: string, stock: number) =>
    apiRequest<{ success: boolean; message: string; product?: any }>(`/product/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }),

  deleteProduct: (id: string) =>
    apiRequest(`/product/${id}`, {
      method: "DELETE",
    }),

  applyBulkDiscount: (data: {
    discountPercentage?: number;
    discountTagActive?: boolean;
    offerTag?: string;
    targetScope?: "all" | "category" | "in_stock";
    targetCategory?: string;
    action?: "apply" | "remove" | "toggle_active";
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      modifiedCount?: number;
      discountPercentage?: number;
      offerTag?: string;
      discountTagActive?: boolean;
    }>("/product/bulk-discount", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  seedProducts: (force: boolean = false) =>
    apiRequest(`/product/seed${force ? "?force=true" : ""}`, {
      method: "POST",
    }),
};

// Newsletter / Dispatch Services
export const newsletterApi = {
  subscribe: (email: string, source: string = "footer_dispatch") =>
    apiRequest("/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email, source }),
    }),

  getSubscribers: () => apiRequest("/newsletter/subscribers"),
};

// Hero Section CMS API Services
export const heroApi = {
  getHeroConfig: () => apiRequest("/hero-config"),
  updateHeroConfig: (data: any) =>
    apiRequest("/hero-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadHeroImage: (base64Image: string) =>
    apiRequest("/hero-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetHeroConfig: () =>
    apiRequest("/hero-config/reset", {
      method: "POST",
    }),
};

// Peel Reveal Interactive Showcase CMS API Services
export const peelRevealApi = {
  getPeelRevealConfig: () => apiRequest("/peel-reveal-config"),
  updatePeelRevealConfig: (data: any) =>
    apiRequest("/peel-reveal-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadPeelRevealImage: (base64Image: string) =>
    apiRequest("/peel-reveal-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetPeelRevealConfig: () =>
    apiRequest("/peel-reveal-config/reset", {
      method: "POST",
    }),
};

export interface ContactConfigData {
  isEnabled: boolean;
  watermarkText: string;
  headline: string;
  subtitle: string;
  inputPlaceholder: string;
  buttonText: string;
  disclaimer: string;
  modelImage: string;
  updatedAt?: string;
}

export const DEFAULT_CONTACT_CONFIG: ContactConfigData = {
  isEnabled: true,
  watermarkText: "DRAPZA",
  headline: "TRANSMIT\nUPDATES, NOT\nNOISÉ.",
  subtitle: "You'll only hear from us when something built is worth showing.",
  inputPlaceholder: "ENTER SIGNAL ADDRESS",
  buttonText: "SUBMIT SIGNAL",
  disclaimer: "No marketing cycles. Just rare, coded dispatches.",
  modelImage: "/images/drapza/contact/contact_models.jpg",
};

// Contact Form / Transmit Signal Newsletter CMS API Services
export const contactConfigApi = {
  getContactConfig: () => apiRequest("/contact-config"),
  updateContactConfig: (data: any) =>
    apiRequest("/contact-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadContactImage: (base64Image: string) =>
    apiRequest("/contact-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetContactConfig: () =>
    apiRequest("/contact-config/reset", {
      method: "POST",
    }),
};

// Lookbook / Campaign Silhouettes CMS API Services
export const lookbookApi = {
  getLookbookConfig: () => apiRequest("/lookbook-config"),
  updateLookbookConfig: (data: any) =>
    apiRequest("/lookbook-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadLookbookImage: (base64Image: string) =>
    apiRequest("/lookbook-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetLookbookConfig: () =>
    apiRequest("/lookbook-config/reset", {
      method: "POST",
    }),
};

// Philosophy / Brand Statement Section CMS API Services
export const statementApi = {
  getStatementConfig: () => apiRequest("/statement-config"),
  updateStatementConfig: (data: any) =>
    apiRequest("/statement-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadStatementSymbol: (base64Image: string) =>
    apiRequest("/statement-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetStatementConfig: () =>
    apiRequest("/statement-config/reset", {
      method: "POST",
    }),
};

// Marquee Banner & Hero Card CMS API Services
export const marqueeApi = {
  getMarqueeConfig: () => apiRequest("/marquee-config"),
  updateMarqueeConfig: (data: any) =>
    apiRequest("/marquee-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadMarqueeImage: (base64Image: string) =>
    apiRequest("/marquee-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetMarqueeConfig: () =>
    apiRequest("/marquee-config/reset", {
      method: "POST",
    }),
};

// Bundle Stacker / Modular Outfit Builder CMS API Services
export const bundleApi = {
  getBundleConfig: () => apiRequest("/bundle-config"),
  updateBundleConfig: (data: any) =>
    apiRequest("/bundle-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadBundleImage: (base64Image: string) =>
    apiRequest("/bundle-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetBundleConfig: () =>
    apiRequest("/bundle-config/reset", {
      method: "POST",
    }),
};

// Editorial Text Block & Narrative Section CMS API Services
export const textBlockApi = {
  getTextBlockConfig: () => apiRequest("/textblock-config"),
  updateTextBlockConfig: (data: any) =>
    apiRequest("/textblock-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadTextBlockSymbol: (base64Image: string) =>
    apiRequest("/textblock-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetTextBlockConfig: () =>
    apiRequest("/textblock-config/reset", {
      method: "POST",
    }),
};

// Flash Sale Countdown Timer & Drop Banner CMS API Services
export const countdownApi = {
  getCountdownConfig: () => apiRequest("/countdown-config"),
  updateCountdownConfig: (data: any) =>
    apiRequest("/countdown-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadCountdownImage: (base64Image: string) =>
    apiRequest("/countdown-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetCountdownConfig: () =>
    apiRequest("/countdown-config/reset", {
      method: "POST",
    }),
};

// Visitor Location & IP Telemetry API
export const telemetryApi = {
  recordLocation: (locationData: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
    clientIp?: string;
    precisionType?: "GPS_HIGH_ACCURACY" | "IP_APPROXIMATE";
    sessionId?: string;
    userType?: "guest" | "registered";
    userName?: string;
    userEmail?: string;
  }) =>
    apiRequest("/telemetry/location", {
      method: "POST",
      body: JSON.stringify(locationData),
    }),

  getAllLocations: () => apiRequest("/telemetry/location/all"),
  clearLocations: () =>
    apiRequest("/telemetry/location/clear", {
      method: "DELETE",
    }),
};

// Coupon & Voucher CMS API Services
export const couponApi = {
  getAll: () => apiRequest("/coupon"),

  create: (couponData: {
    code: string;
    description?: string;
    discountType: "percentage" | "fixed";
    discountAmount: number;
    minOrderValue?: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number;
    startDate?: string;
    expiryDate?: string | null;
    isActive?: boolean;
    applicableCategories?: string[];
  }) =>
    apiRequest("/coupon", {
      method: "POST",
      body: JSON.stringify(couponData),
    }),

  update: (
    id: string,
    couponData: Partial<{
      code: string;
      description: string;
      discountType: "percentage" | "fixed";
      discountAmount: number;
      minOrderValue: number;
      maxDiscountAmount: number | null;
      usageLimit: number | null;
      perUserLimit: number;
      startDate: string;
      expiryDate: string | null;
      isActive: boolean;
      applicableCategories: string[];
    }>
  ) =>
    apiRequest(`/coupon/${id}`, {
      method: "PUT",
      body: JSON.stringify(couponData),
    }),

  delete: (id: string) =>
    apiRequest(`/coupon/${id}`, {
      method: "DELETE",
    }),

  toggleStatus: (id: string) =>
    apiRequest(`/coupon/${id}/toggle`, {
      method: "PATCH",
    }),

  seedCoupons: (force: boolean = false) =>
    apiRequest(`/coupon/seed${force ? "?force=true" : ""}`, {
      method: "POST",
    }),

  validateCoupon: (code: string, cartTotal: number) =>
    apiRequest("/coupon/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    }),
};

// Field Test in Silhouettes Tri-Card Section CMS API Services
export const ctaApi = {
  getCtaConfig: () => apiRequest("/cta-config"),
  updateCtaConfig: (data: any) =>
    apiRequest("/cta-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadCtaImage: (base64Image: string) =>
    apiRequest("/cta-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetCtaConfig: () =>
    apiRequest("/cta-config/reset", {
      method: "POST",
    }),
};

// Dynamic Wardrobe Filter Options CMS API Services
export interface ColorOptionData {
  label: string;
  hex: string;
}

export interface FilterConfigData {
  categories: string[];
  sizes: string[];
  colors: ColorOptionData[];
  fabrics: string[];
  occasions: string[];
  availability: string[];
  hideOutOfStockOnStorefront?: boolean;
}

export const filterConfigApi = {
  getFilterConfig: () => apiRequest<FilterConfigData>("/filter-config"),
  updateFilterConfig: (data: Partial<FilterConfigData>) =>
    apiRequest<FilterConfigData>("/filter-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetFilterConfig: () =>
    apiRequest<FilterConfigData>("/filter-config/reset", {
      method: "POST",
    }),
};

// Dynamic Invoice & GST Configuration API Services
export type InvoiceSectionId =
  | "header"
  | "recipients"
  | "logistics"
  | "comments"
  | "items"
  | "totals"
  | "remittance"
  | "footer";

export interface GstConfigData {
  isEnabled: boolean;
  gstPercentage: number;
  gstNumber: string;
  showGstNumber: boolean;
  legalBusinessName: string;
  panNumber?: string;
  hsnCode?: string;
  calculationMode: "exclusive" | "inclusive";
  stateCode?: string;

  // Layout & Section Ordering Controls
  sectionOrder?: string[];
  hiddenSections?: string[];

  // Customizable Company & Header Metadata
  companyTagline?: string;
  companyAddressLine1?: string;
  companyAddressLine2?: string;
  companyPhone?: string;
  companyEmail?: string;
  invoiceTitle?: string;

  // Logistics Bar Defaults
  defaultSalesperson?: string;
  defaultShippedVia?: string;
  defaultFobPoint?: string;
  defaultTerms?: string;

  // Notes & Remittance
  commentsText?: string;
  remittanceNotice?: string;
  signoffText?: string;
  signoffSubtext?: string;
}

export const DEFAULT_INVOICE_SECTIONS: { id: InvoiceSectionId; label: string; desc: string }[] = [
  { id: "header", label: "HEADER & WORDMARK", desc: "Company name, address, GSTIN, invoice # and date" },
  { id: "recipients", label: "RECIPIENTS (BILL TO / SHIP TO)", desc: "Dual client billing & delivery destination blocks" },
  { id: "logistics", label: "LOGISTICS METADATA BAR", desc: "Salesperson, P.O. number, and terms" },
  { id: "comments", label: "COMMENTS & INSTRUCTIONS", desc: "Special packaging, care advice, and dispatch remarks" },
  { id: "items", label: "ITEMIZED GARMENT MANIFEST", desc: "Table of ordered pieces, sizes, quantities, and prices" },
  { id: "totals", label: "FINANCIAL TOTALS & TAX", desc: "Subtotal, discount, GST/tax, shipping, and total due" },
  { id: "remittance", label: "REMITTANCE & PAYMENT POLICY", desc: "Payment settlement status, legal terms, and support info" },
  { id: "footer", label: "BOTTOM SIGNOFF & SEAL", desc: "Thank you message and official authentication footer" },
];

export const DEFAULT_GST_CONFIG: GstConfigData = {
  isEnabled: true,
  gstPercentage: 18,
  gstNumber: "09AAACD1234F1Z5",
  showGstNumber: true,
  legalBusinessName: "DRAPZA ATELIER NOIR PVT LTD",
  panNumber: "AAACD1234F",
  hsnCode: "6204",
  calculationMode: "exclusive",
  stateCode: "09 - Uttar Pradesh",

  // Layout Sequence
  sectionOrder: [
    "header",
    "recipients",
    "logistics",
    "comments",
    "items",
    "totals",
    "remittance",
    "footer",
  ],
  hiddenSections: [],

  // Default Texts
  companyTagline: "Bespoke Modular Silhouettes & Haute Couture",
  companyAddressLine1: "Cyber Hub Node A-12, Sector 62",
  companyAddressLine2: "Noida, Uttar Pradesh 201309, India",
  companyPhone: "+91 9794603102",
  companyEmail: "drapza.cloth@gmail.com",
  invoiceTitle: "INVOICE",

  defaultSalesperson: "Drapza Concierge",
  defaultShippedVia: "Blue Dart Air",
  defaultFobPoint: "Vault Hub",
  defaultTerms: "Prepaid / Settled",

  commentsText:
    "Authentic Drapza Atelier Noir production. High-altitude climate-controlled shipment with anti-static packaging.",

  remittanceNotice:
    "Make all remittances payable to registered company. Payment status: PAID IN FULL via Encrypted UPI Checkout (Instant). Questions concerning this invoice? Contact Concierge Desk.",

  signoffText: "Thank you for your business!",
  signoffSubtext:
    "DRAPZA ATELIER NOIR • OFFICIAL ELECTRONIC INVOICE • AUTHENTICATED DISPATCH",
};

export const gstConfigApi = {
  getGstConfig: () => apiRequest<GstConfigData>("/gst-config"),
  updateGstConfig: (data: Partial<GstConfigData>) =>
    apiRequest<GstConfigData>("/gst-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetGstConfig: () =>
    apiRequest<GstConfigData>("/gst-config/reset", {
      method: "POST",
    }),
};

// ── PRODUCT REVIEWS API ─────────────────────────────────────────────────────
export interface ReviewData {
  _id: string;
  productId: string | { _id: string; name: string; images?: string[]; price?: string; slug?: string };
  userId?: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  fit?: "runs_small" | "true_to_size" | "runs_large";
  qualityRating?: number;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  photos: string[];
  status: "approved" | "pending" | "rejected";
  verifiedSize?: string;
  verifiedColor?: string;
  isFeatured?: boolean;
  atelierResponse?: string;
  atelierRespondedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  recommendationPercentage: number;
  starDistribution: Record<number, number>;
  fitDistribution: {
    runs_small: number;
    true_to_size: number;
    runs_large: number;
  };
}

export interface CreateReviewPayload {
  productId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  fit?: "runs_small" | "true_to_size" | "runs_large";
  qualityRating?: number;
  photos?: string[];
  verifiedSize?: string;
  verifiedColor?: string;
  isVerifiedPurchase?: boolean;
}

export const reviewApi = {
  getAll: (params?: {
    productId?: string;
    page?: number;
    limit?: number;
    sort?: string;
    rating?: number;
    verifiedOnly?: boolean;
    withPhotos?: boolean;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.productId && params.productId !== "ALL" && params.productId !== "all") {
      q.set("productId", params.productId);
    }
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.sort) q.set("sort", params.sort);
    if (params?.rating) q.set("rating", String(params.rating));
    if (params?.verifiedOnly) q.set("verifiedOnly", "true");
    if (params?.withPhotos) q.set("withPhotos", "true");
    if (params?.search) q.set("search", params.search);
    return apiRequest<{
      success: boolean;
      reviews: ReviewData[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/reviews?${q.toString()}`);
  },

  getByProduct: (
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      rating?: number;
      verifiedOnly?: boolean;
      withPhotos?: boolean;
      search?: string;
    }
  ) => {
    const q = new URLSearchParams();
    if (productId && productId !== "ALL" && productId !== "all") {
      q.set("productId", productId);
    }
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.sort) q.set("sort", params.sort);
    if (params?.rating) q.set("rating", String(params.rating));
    if (params?.verifiedOnly) q.set("verifiedOnly", "true");
    if (params?.withPhotos) q.set("withPhotos", "true");
    if (params?.search) q.set("search", params.search);
    return apiRequest<{
      success: boolean;
      reviews: ReviewData[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/reviews?${q.toString()}`);
  },

  getStats: (productId?: string) => {
    const q = productId && productId !== "ALL" && productId !== "all" ? `?productId=${encodeURIComponent(productId)}` : "";
    return apiRequest<{ success: boolean; stats: ReviewStats }>(`/reviews/stats${q}`);
  },

  checkEligibility: (productId: string, slug?: string, email?: string) => {
    const q = new URLSearchParams();
    if (productId) q.set("productId", productId);
    if (slug) q.set("slug", slug);
    if (email) q.set("email", email);
    return apiRequest<{
      success: boolean;
      eligible: boolean;
      reason?: "not_logged_in" | "not_purchased" | "already_reviewed";
      message?: string;
      orderNumber?: string;
      orderDate?: string;
      purchasedSize?: string;
      purchasedColor?: string;
      userName?: string;
      userEmail?: string;
    }>(`/reviews/check-eligibility?${q.toString()}`);
  },

  create: (data: CreateReviewPayload) =>
    apiRequest<{ success: boolean; message: string; review: ReviewData }>(
      "/reviews",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  voteHelpful: (reviewId: string) =>
    apiRequest<{ success: boolean; helpfulVotes: number }>(
      `/reviews/${reviewId}/helpful`,
      {
        method: "POST",
      }
    ),

  adminGetAll: (params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    isFeatured?: boolean;
    productId?: string;
    rating?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.isFeatured !== undefined) q.set("isFeatured", String(params.isFeatured));
    if (params?.productId) q.set("productId", params.productId);
    if (params?.rating) q.set("rating", String(params.rating));
    return apiRequest<{
      success: boolean;
      reviews: ReviewData[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/reviews/admin/all?${q.toString()}`);
  },

  adminCreate: (data: Partial<ReviewData> & {
    productId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
  }) =>
    apiRequest<{ success: boolean; message: string; review: ReviewData }>(
      "/reviews/admin/create",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  adminUpdate: (reviewId: string, data: Partial<ReviewData>) =>
    apiRequest<{ success: boolean; message: string; review: ReviewData }>(
      `/reviews/admin/${reviewId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    ),

  adminBulkAction: (
    action: "approved" | "pending" | "rejected" | "delete" | "feature" | "unfeature",
    reviewIds: string[]
  ) =>
    apiRequest<{ success: boolean; message: string }>(
      "/reviews/admin/bulk",
      {
        method: "POST",
        body: JSON.stringify({ action, reviewIds }),
      }
    ),

  adminUpdateStatus: (
    reviewId: string,
    status: "approved" | "pending" | "rejected"
  ) =>
    apiRequest<{ success: boolean; message: string; review: ReviewData }>(
      `/reviews/admin/${reviewId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    ),

  adminDelete: (reviewId: string) =>
    apiRequest<{ success: boolean; message: string }>(
      `/reviews/admin/${reviewId}`,
      {
        method: "DELETE",
      }
    ),
};

// Payment Authentication & Gateway Configuration Types & API
export interface PaymentConfigData {
  _id?: string;
  cashfree: {
    isEnabled: boolean;
    title: string;
    subtitle: string;
    badgeText: string;
    showBadge: boolean;
  };
  razorpay: {
    isEnabled: boolean;
    title: string;
    subtitle: string;
    badgeText: string;
    showBadge: boolean;
  };
  directUpi: {
    isEnabled: boolean;
    title: string;
    subtitle: string;
    upiId: string;
    payeeName: string;
    qrCodeImageUrl?: string;
    instructions: string;
  };
  cod: {
    isEnabled: boolean;
    title: string;
    subtitle: string;
    extraFee: number;
    minOrderAmount: number;
    maxOrderAmount: number;
    note: string;
  };
  defaultMethod: "CASHFREE" | "RAZORPAY" | "UPI_DIRECT" | "COD";
  announcementNotice: string;
  showNotice: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfigData = {
  cashfree: {
    isEnabled: true,
    title: "CASHFREE SECURE CHECKOUT (UPI, CARDS, NETBANKING)",
    subtitle: "INSTANT ZERO-FEE CHECKOUT VIA CASHFREE PAYMENTS ENGINE",
    badgeText: "RECOMMENDED",
    showBadge: true,
  },
  razorpay: {
    isEnabled: true,
    title: "ONLINE GATEWAY (CARDS, UPI, NETBANKING)",
    subtitle: "ZERO CONVENIENCE FEE. INSTANT DISPATCH QUEUE VALIDATION.",
    badgeText: "RAZORPAY",
    showBadge: true,
  },
  directUpi: {
    isEnabled: false,
    title: "DIRECT UPI SCAN & PAY",
    subtitle: "GPAY, PHONEPE, PAYTM, BHIM INSTANT TRANSFER",
    upiId: "samratsuraj10@okaxis",
    payeeName: "DRAPZA ATELIER",
    qrCodeImageUrl: "",
    instructions: "Order will be automatically tagged upon receipt.",
  },
  cod: {
    isEnabled: true,
    title: "CASH ON DELIVERY (COD)",
    subtitle: "PAY IN CASH UPON DOORSTEP GARMENT INSPECTION",
    extraFee: 0,
    minOrderAmount: 0,
    maxOrderAmount: 50000,
    note: "Cash on delivery available across all serviceable pin codes in India.",
  },
  defaultMethod: "CASHFREE",
  announcementNotice: "Complimentary express insured dispatch available on all prepaid orders.",
  showNotice: false,
};

export const paymentConfigApi = {
  getPaymentConfig: () => apiRequest<PaymentConfigData>("/payment-config"),
  updatePaymentConfig: (data: Partial<PaymentConfigData>) =>
    apiRequest<PaymentConfigData>("/payment-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadQrImage: (base64Image: string) =>
    apiRequest<{ success: boolean; message: string; url: string }>("/payment-config/upload-qr", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetPaymentConfig: () =>
    apiRequest<PaymentConfigData>("/payment-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// SHIPPING & COD LOGISTICS CMS API
// ==========================================
export interface ShippingConfigData {
  _id?: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  vipShippingFee?: number;
  codEnabled: boolean;
  codHandlingFee: number;
  codMaxOrderValue: number;
  blockedPincodes: string[];
  updatedAt?: string;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfigData = {
  freeShippingThreshold: 1999,
  standardShippingFee: 150,
  expressShippingFee: 99,
  vipShippingFee: 350,
  codEnabled: true,
  codHandlingFee: 0,
  codMaxOrderValue: 0,
  blockedPincodes: [],
};

export const shippingConfigApi = {
  getConfig: () =>
    apiRequest<{ success: boolean; config: ShippingConfigData }>("/shipping-config"),
  updateConfig: (data: Partial<ShippingConfigData>) =>
    apiRequest<{ success: boolean; message: string; config: ShippingConfigData }>("/shipping-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  checkPincode: (pincode: string) =>
    apiRequest<{
      success: boolean;
      serviceable: boolean;
      codAvailable: boolean;
      freeShippingThreshold?: number;
      standardShippingFee?: number;
      message: string;
    }>("/shipping-config/check-pincode", {
      method: "POST",
      body: JSON.stringify({ pincode }),
    }),
};

// ==========================================
// FOOTER CMS API & CONFIGURATION
// ==========================================

export interface FooterLinkItem {
  label: string;
  href: string;
  isBespoke?: boolean;
}

export interface FooterConfigData {
  isEnabled: boolean;

  // Storefront specific fields + backwards compat
  rootTitle?: string;
  rootLinks?: FooterLinkItem[];
  connectTitle?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  openLineTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  studioLabel?: string;

  // Hero Parallax Header
  showHeroBanner?: boolean;
  heroBannerText?: string;
  heroBannerImage?: string;
  heroBgColor?: string;
  heroTextColor?: string;

  // Newsletter / VIP Dispatch Card
  showNewsletterCard?: boolean;
  newsletterTag?: string;
  newsletterHeadingLine1?: string;
  newsletterHeadingLine2?: string;
  newsletterHeadingLine3?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  newsletterBottomText?: string;
  newsletterBgColor?: string;

  // Navigation Columns
  col1Title: string;
  col1Links: FooterLinkItem[];

  col2Title: string;
  col2Links: FooterLinkItem[];

  col3Title: string;
  phone: string;
  whatsapp?: string;
  whatsappMessage?: string;
  addressText?: string;
  showTermsLink?: boolean;
  termsLinkText?: string;
  termsLinkHref?: string;

  // Brand & Legal Bottom Bar
  brandLogoText: string;
  copyrightText: string;
  showAdminLink?: boolean;
  adminLinkText?: string;
  adminLinkHref?: string;

  updatedAt?: string;
  createdAt?: string;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfigData = {
  isEnabled: true,
  rootTitle: "Root",
  rootLinks: [
    { label: "Drapza Home", href: "/" },
    { label: "Shop All Products", href: "/wardrobe" },
    { label: "Custom Size Fittings", href: "#custom-size-fittings", isBespoke: true },
    { label: "About Drapza", href: "/genesis" },
    { label: "Contact Us", href: "/touchpoint" },
    { label: "Product Reviews", href: "/reviews" },
    { label: "Product Page", href: "/unit" },
  ],
  connectTitle: "Connect Feed",
  facebookUrl: "https://www.facebook.com/",
  instagramUrl: "https://www.instagram.com/",
  youtubeUrl: "https://www.youtube.com/",
  col2Links: [
    { label: "Facebook", href: "https://www.facebook.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
  ],
  openLineTitle: "Open Line",
  phone: "+91 8888333038",
  whatsapp: "+91 8888333038",
  whatsappMessage: "Hello Drapza Atelier",
  addressLine1: "Unit 07, Sector N",
  addressLine2: "Layer 2, South Terminal",
  addressLine3: "System 021, Earth",
  addressText: "Unit 07, Sector N\nLayer 2, South Terminal\nSystem 021, Earth",
  brandLogoText: "DRAPZA",
  copyrightText: "©2025 All modules reserved.",
  studioLabel: "Drapza Studio",

  showHeroBanner: true,
  heroBannerText: "DRAPZA",
  heroBannerImage: "/images/drapza/contact-form/contact-parallax.png",
  heroBgColor: "#f4f4f4",
  heroTextColor: "#000000",

  showNewsletterCard: true,
  newsletterTag: "[ DISPATCH SIGNAL ]",
  newsletterHeadingLine1: "TRANSMIT",
  newsletterHeadingLine2: "UPDATES, NOT",
  newsletterHeadingLine3: "NOISE.",
  newsletterDescription: "You'll only hear from us when something built is worth showing.",
  newsletterPlaceholder: "ENTER SIGNAL ADDRESS",
  newsletterButtonText: "READY TO TRANSMIT",
  newsletterBottomText: "NO MARKETING CYCLES. JUST RARE, CODED DISPATCHES.",
  newsletterBgColor: "#0b0b0b",

  col1Title: "Root",
  col1Links: [
    { label: "Drapza Home", href: "/" },
    { label: "Shop All Products", href: "/wardrobe" },
    { label: "Custom Size Fittings", href: "#custom-size-fittings", isBespoke: true },
    { label: "About Drapza", href: "/genesis" },
    { label: "Contact Us", href: "/touchpoint" },
    { label: "Product Reviews", href: "/reviews" },
    { label: "Product Page", href: "/unit" },
  ],

  col2Title: "Connect Feed",

  col3Title: "Open Line",
  showTermsLink: true,
  termsLinkText: "TERMS & CONDITIONS",
  termsLinkHref: "/terms",

  showAdminLink: true,
  adminLinkText: "[ ATELIER ADMIN CONTROL ]",
  adminLinkHref: "/admin",
};

export type FooterApiResponse = FooterConfigData & {
  success: boolean;
  message?: string;
  data?: FooterConfigData;
};

export const footerConfigApi = {
  getFooterConfig: () => apiRequest<FooterApiResponse>("/footer-config"),
  updateFooterConfig: (data: Partial<FooterConfigData>) =>
    apiRequest<FooterApiResponse>("/footer-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadFooterImage: (base64Image: string) =>
    apiRequest<{ success: boolean; message?: string; url: string; publicId: string }>("/footer-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetFooterConfig: () =>
    apiRequest<FooterApiResponse>("/footer-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// SITE IDENTITY, BROWSER TAB & SEO CMS API
// ==========================================

export interface SiteConfigData {
  siteTitle: string;
  siteDescription: string;
  faviconUrl: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoType?: "image" | "hybrid" | "text";
  logoText?: string;
  logoTagline?: string;
  logoWidth?: number;
  logoScale?: number;
  logoMobileScale?: number;
  logoAlignment?: "left" | "center" | "right";
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoGap?: number;
  logoLayout?: "horizontal" | "vertical";
  logoBorderRadius?: number;
  logoOpacity?: number;
  logoShadow?: "none" | "subtle" | "medium" | "strong" | "glow";
  logoAutoInvertDark?: boolean;
  logoWordmarkSize?: number;
  logoLetterSpacing?: number;
  logoFontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  logoShowTagline?: boolean;
  brandName: string;
  inactiveTabTitle: string;
  enableInactiveTabNotice: boolean;
  keywords: string;
  ogImageUrl: string;
  announcementEnabled?: boolean;
  announcementMessages?: string[];
  announcementIntervalSeconds?: number;
  announcementLinkUrl?: string;
  giftCardRedemptionDiscountEnabled?: boolean;
  giftCardRedemptionDiscountType?: "percentage" | "fixed";
  giftCardRedemptionDiscountValue?: number;
  giftCardRedemptionMinOrderAmount?: number;
  giftCardRedemptionMaxDiscount?: number;
  giftCardRedemptionPromoLabel?: string;
  giftCardRedemptionDescription?: string;
  updatedAt?: string;
  createdAt?: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfigData = {
  siteTitle: "Drapza — Silhouettes for the Next Era",
  siteDescription:
    "Clothing reduced to pure signal. Drapza builds modular, neutral garments for the frictionless, the fast, and the quietly defiant.",
  faviconUrl: "/images/drapza/logo.jpg",
  logoUrl: "",
  logoDarkUrl: "",
  logoType: "hybrid",
  logoText: "DRAPZA",
  logoTagline: "WEAR YOUR STORY",
  logoWidth: 34,
  logoScale: 100,
  logoMobileScale: 100,
  logoAlignment: "left",
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoGap: 10,
  logoLayout: "horizontal",
  logoBorderRadius: 0,
  logoOpacity: 1,
  logoShadow: "subtle",
  logoAutoInvertDark: false,
  logoWordmarkSize: 24,
  logoLetterSpacing: 0.14,
  logoFontWeight: "bold",
  logoShowTagline: false,
  brandName: "DRAPZA",
  inactiveTabTitle: "DRAPZA • — WAITING IN VAULT",
  enableInactiveTabNotice: false,
  keywords: "luxury streetwear, modular fashion, high-density drape, bespoke tailoring, drapza atelier",
  ogImageUrl: "/images/drapza/logo.jpg",
  announcementEnabled: true,
  announcementMessages: [
    "BATCH #04 DISPATCH LIVE — LIMITED QUANTITIES AVAILABLE",
    "WORLDWIDE EXPRESS SHIPPING ACTIVE FOR ALL MODULES",
    "ARCHIVAL NEUTRAL OVERSHIRTS RESTOCKED IN SECTOR N",
    "SYSTEM 021 READY FOR FRICTIONLESS TRANSMISSION",
  ],
  announcementIntervalSeconds: 4,
  announcementLinkUrl: "/wardrobe",
  giftCardRedemptionDiscountEnabled: true,
  giftCardRedemptionDiscountType: "percentage",
  giftCardRedemptionDiscountValue: 10,
  giftCardRedemptionMinOrderAmount: 0,
  giftCardRedemptionMaxDiscount: 1000,
  giftCardRedemptionPromoLabel: "SPECIAL GIFT CARD BONUS PERK",
  giftCardRedemptionDescription: "Get an extra 10% instant discount when paying with a Drapza Gift Card!",
};

export const siteConfigApi = {
  getSiteConfig: () => apiRequest<SiteConfigData>("/site-config"),
  updateSiteConfig: (data: Partial<SiteConfigData>) =>
    apiRequest<SiteConfigData>("/site-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadAsset: (base64Image: string, folder: string = "drapza_brand") =>
    apiRequest<{ url: string; publicId: string }>("/site-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image, folder }),
    }),
  resetSiteConfig: () =>
    apiRequest<SiteConfigData>("/site-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// SECURITY & AUDIT LOGS TELEMETRY API
// ==========================================

export interface RouteHitItem {
  path: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  threatDetected?: boolean;
}

export interface ThreatFlagItem {
  type: string;
  reason: string;
  path?: string;
  ip?: string;
  detectedAt: string;
}

export interface AuditSessionItem {
  _id?: string;
  sessionId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  userAgent?: string;
  device: string;
  browser: string;
  os: string;
  loginAt: string;
  lastActiveAt: string;
  logoutAt?: string;
  durationSeconds: number;
  isOnline?: boolean;
  status: "ACTIVE" | "TERMINATED_USER" | "TERMINATED_ADMIN" | "EXPIRED";
  riskLevel: "SAFE" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  threatFlags: ThreatFlagItem[];
  routeHitsCount: number;
  routeHits?: RouteHitItem[];
}

export interface BannedIpItem {
  _id: string;
  ip: string;
  reason: string;
  threatType: string;
  bannedBy: string;
  bannedAt: string;
}

export interface SecurityOverviewData {
  metrics: {
    activeOnlineCount: number;
    totalSessions: number;
    criticalThreatCount: number;
    highThreatCount: number;
    totalThreatsFlagged: number;
    bannedIpCount: number;
  };
  recentThreats: Array<{
    sessionId: string;
    userEmail?: string;
    ip: string;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
    threatFlags: ThreatFlagItem[];
    lastActiveAt: string;
    device: string;
    browser: string;
  }>;
}

export const auditLogApi = {
  getOverview: () => apiRequest<SecurityOverviewData>("/audit-log/overview"),

  getSessions: (params: {
    search?: string;
    riskLevel?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append("search", params.search);
    if (params.riskLevel && params.riskLevel !== "ALL") searchParams.append("riskLevel", params.riskLevel);
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", String(params.page));
    if (params.limit) searchParams.append("limit", String(params.limit));

    const qs = searchParams.toString();
    return apiRequest<{
      sessions: AuditSessionItem[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/audit-log/sessions${qs ? `?${qs}` : ""}`);
  },

  getSessionDetail: (sessionId: string) =>
    apiRequest<{ session: AuditSessionItem }>(`/audit-log/sessions/${encodeURIComponent(sessionId)}`),

  terminateSession: (sessionId: string) =>
    apiRequest<{ session: AuditSessionItem }>(`/audit-log/sessions/${encodeURIComponent(sessionId)}/terminate`, {
      method: "POST",
    }),

  banIp: (payload: { ip: string; reason?: string; threatType?: string }) =>
    apiRequest<BannedIpItem>("/audit-log/blacklist", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  unbanIp: (ip: string) =>
    apiRequest("/audit-log/blacklist", {
      method: "DELETE",
      body: JSON.stringify({ ip }),
    }),

  getBlacklist: () =>
    apiRequest<{ blacklistedIps: BannedIpItem[] }>("/audit-log/blacklist"),

  getExportUrl: (format: "csv" | "json" = "csv") =>
    `${API_BASE}/audit-log/export?format=${format}`,
};

// ==========================================
// 16. SALES, RETURNS & AUDIT REPORTS API
// ==========================================

export interface ReportSummaryMetrics {
  grossSales: number;
  totalOrders: number;
  completedOrders: number;
  deliveredSales: number;
  unitsSold: number;
  aov: number;
  returnCount: number;
  returnAmount: number;
  returnRate: number;
  cancellationCount: number;
  cancellationAmount: number;
  cancellationRate: number;
  failedCount: number;
  failedAmount: number;
  failureRate: number;
  netRevenue: number;
  totalItemsPrice: number;
  totalTaxCollected: number;
  totalShippingCollected: number;
  deltas: {
    salesDelta: number;
    ordersDelta: number;
    returnsDelta: number;
    cancellationsDelta: number;
  };
}

export interface PaymentMethodBreakdownItem {
  method: string;
  ordersCount: number;
  totalAmount: number;
  percentageShare: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface TopProductReportItem {
  id: string;
  name: string;
  image: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
}

export interface TimelineReportItem {
  date: string;
  label: string;
  sales: number;
  ordersCount: number;
  returnsCount: number;
  cancellationsCount: number;
  failedCount: number;
}

export interface OrderLedgerItem {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  state: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemsCount: number;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  deliveredAt?: string;
}

export interface AnalyticsReportData {
  timeframe: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    daySpan: number;
  };
  summary: ReportSummaryMetrics;
  paymentMethodsBreakdown: PaymentMethodBreakdownItem[];
  statusBreakdown: StatusBreakdownItem[];
  topProducts: TopProductReportItem[];
  timelineSeries: TimelineReportItem[];
  ordersLedger: OrderLedgerItem[];
}

export const reportApi = {
  getAnalytics: (
    params: {
      timeframe?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      paymentMethod?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    if (params.timeframe) searchParams.append("timeframe", params.timeframe);
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.paymentMethod && params.paymentMethod !== "ALL")
      searchParams.append("paymentMethod", params.paymentMethod);

    const qs = searchParams.toString();
    return apiRequest<AnalyticsReportData>(`/reports/analytics${qs ? `?${qs}` : ""}`);
  },

  getExportExcelUrl: (
    params: {
      timeframe?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      paymentMethod?: string;
      search?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    if (params.timeframe) searchParams.append("timeframe", params.timeframe);
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.paymentMethod && params.paymentMethod !== "ALL")
      searchParams.append("paymentMethod", params.paymentMethod);
    if (params.search) searchParams.append("search", params.search);
    const qs = searchParams.toString();
    return `${API_BASE}/reports/export-excel${qs ? `?${qs}` : ""}`;
  },

  seedDemoOrders: () =>
    apiRequest<{ success: boolean; message: string; count: number }>("/reports/seed-orders", {
      method: "POST",
    }),
};

// ==========================================
// Support Tickets API
// ==========================================
export interface TicketItem {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  orderRef?: string;
  topic: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "normal" | "urgent";
  adminReplies: Array<{ reply: string; sender: string; createdAt: string }>;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const ticketApi = {
  getTickets: (params: { status?: string; priority?: string; search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.priority && params.priority !== "ALL") searchParams.append("priority", params.priority);
    if (params.search) searchParams.append("search", params.search);
    if (params.page) searchParams.append("page", String(params.page));
    if (params.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    return apiRequest<{
      tickets: TicketItem[];
      pagination: { total: number; page: number; pages: number; limit: number };
      stats: { total: number; open: number; in_progress: number; resolved: number; closed: number };
    }>(`/tickets${qs ? `?${qs}` : ""}`);
  },

  updateTicket: (id: string, update: { status?: string; priority?: string }) =>
    apiRequest(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }),

  replyToTicket: (id: string, data: { message: string; sender?: string; markResolved?: boolean }) =>
    apiRequest(`/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteTicket: (id: string) =>
    apiRequest(`/tickets/${id}`, {
      method: "DELETE",
    }),

  getExportCsvUrl: (status?: string) => {
    const qs = status && status !== "ALL" ? `?status=${status}` : "";
    return `${API_BASE}/tickets/export-csv${qs}`;
  },
};

// ==========================================
// Newsletter CRM API
// ==========================================
export interface NewsletterSubscriber {
  _id: string;
  email: string;
  source: string;
  status: "active" | "unsubscribed";
  subscribedAt: string;
}

export const newsletterAdminApi = {
  getSubscribers: (params: { status?: string; search?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.search) searchParams.append("search", params.search);
    const qs = searchParams.toString();
    return apiRequest<{
      count: number;
      subscribers: NewsletterSubscriber[];
    }>(`/newsletter/subscribers${qs ? `?${qs}` : ""}`);
  },

  deleteSubscriber: (id: string) =>
    apiRequest(`/newsletter/subscribers/${id}`, {
      method: "DELETE",
    }),

  toggleStatus: (id: string) =>
    apiRequest(`/newsletter/subscribers/${id}/toggle`, {
      method: "PATCH",
    }),

  sendBroadcast: (data: { subject: string; title: string; message: string; ctaText?: string; ctaUrl?: string }) =>
    apiRequest(`/newsletter/broadcast`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getExportCsvUrl: () => `${API_BASE}/newsletter/export-csv`,
};

// ==========================================
// Return & Exchange Requests API
// ==========================================
export interface ReturnRequestItem {
  _id: string;
  returnId: string;
  orderId?: string;
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  requestType: "return" | "exchange";
  exchangeSize?: string;
  items: Array<{
    name: string;
    size: string;
    color?: string;
    qty: number;
    price: number;
    reason: string;
    condition?: string;
  }>;
  pickupAddress: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  status: "pending_review" | "approved" | "pickup_scheduled" | "received" | "refunded" | "rejected";
  refundAmount: number;
  refundMode?: string;
  adminNotes?: string;
  rejectionReason?: string;
  courierAwb?: string;
  courierPartner?: string;
  timeline?: Array<{
    status: string;
    note?: string;
    updatedBy?: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const returnApi = {
  getReturnRequests: (params: { status?: string; type?: string; search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "ALL") searchParams.append("status", params.status);
    if (params.type && params.type !== "ALL") searchParams.append("type", params.type);
    if (params.search) searchParams.append("search", params.search);
    if (params.page) searchParams.append("page", String(params.page));
    if (params.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    return apiRequest<{
      requests: ReturnRequestItem[];
      pagination: { total: number; page: number; pages: number; limit: number };
      stats: {
        total: number;
        pending_review: { count: number; totalAmount: number };
        approved: { count: number; totalAmount: number };
        pickup_scheduled: { count: number; totalAmount: number };
        received: { count: number; totalAmount: number };
        refunded: { count: number; totalAmount: number };
        rejected: { count: number; totalAmount: number };
      };
    }>(`/returns${qs ? `?${qs}` : ""}`);
  },

  createReturnRequest: (payload: {
    orderRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    requestType?: "return" | "exchange";
    exchangeSize?: string;
    refundAmount?: number;
    pickupAddress?: { street?: string; city?: string; state?: string; pincode?: string };
    items?: Array<{ name: string; size: string; color?: string; qty: number; price: number; reason: string; condition?: string }>;
    adminNotes?: string;
  }) =>
    apiRequest<{ success: boolean; request: ReturnRequestItem }>(`/returns`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  validateEligibility: (ref: string) =>
    apiRequest<{
      success: boolean;
      orderId: string;
      status: string;
      isCancelEligible: boolean;
      returnEligible: boolean;
      daysSinceDelivery: number;
      daysRemaining: number;
      existingReturn: string | null;
      message: string;
      order: any;
    }>(`/returns/validate-eligibility/${encodeURIComponent(ref)}`),

  updateReturnStatus: (id: string, update: {
    status?: string;
    adminNotes?: string;
    rejectionReason?: string;
    courierAwb?: string;
    courierPartner?: string;
    refundAmount?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    exchangeSize?: string;
    requestType?: "return" | "exchange";
    pickupAddress?: { street?: string; city?: string; state?: string; pincode?: string };
    items?: Array<any>;
  }) =>
    apiRequest<{ success: boolean; request: ReturnRequestItem }>(`/returns/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }),

  sendReturnNotification: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/returns/${id}/notify`, {
      method: "POST",
    }),

  deleteReturnRequest: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/returns/${id}`, {
      method: "DELETE",
    }),

  getExportCsvUrl: (status?: string, type?: string) => {
    const searchParams = new URLSearchParams();
    if (status && status !== "ALL") searchParams.append("status", status);
    if (type && type !== "ALL") searchParams.append("type", type);
    const qs = searchParams.toString();
    return `${API_BASE}/returns/export-csv${qs ? `?${qs}` : ""}`;
  },
};

// ==========================================
// Abandoned Cart Analytics API
// ==========================================
export interface AbandonedCartData {
  summary: {
    totalAbandonedCarts: number;
    totalLostGmv: number;
    totalAbandonedItems: number;
    recoveryPotential: number;
  };
  carts: Array<{
    cartId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    itemCount: number;
    totalAmount: number;
    items: Array<{
      productId: string;
      title: string;
      image: string;
      price: number;
      quantity: number;
      size: string;
      color?: string;
    }>;
    lastActiveAt: string;
  }>;
}

export const abandonedCartApi = {
  getAbandonedCarts: () => apiRequest<AbandonedCartData>("/reports/abandoned-carts"),
};

// ==========================================
// Wallet & Gift Cards API
// ==========================================
export interface WalletProfileData {
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: "bronze" | "silver" | "obsidian";
  transactions: Array<{
    type: "credit" | "debit";
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}

export interface GiftCardTransactionItem {
  type: "PURCHASE" | "REDEMPTION" | "EXPIRY" | "ADMIN_ADJUSTMENT";
  amount: number;
  remainingBalance: number;
  orderId?: string;
  orderNumber?: string;
  description?: string;
  date: string;
}

export interface GiftCardItem {
  _id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  status: "Active" | "Partially Used" | "Used" | "Expired" | "Cancelled";
  theme?: string;
  isActive: boolean;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  assignedToEmail?: string;
  message?: string;
  deliveryOption?: "now" | "scheduled";
  scheduledDeliveryDate?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  expiryDate: string;
  transactions?: GiftCardTransactionItem[];
  redeemedBy?: { name?: string; email?: string };
  redeemedAt?: string;
  createdAt: string;
}

export const walletApi = {
  getProfile: () => apiRequest<WalletProfileData>("/wallet/profile"),

  redeemGiftCard: (code: string) =>
    apiRequest<{ success: boolean; message: string; walletBalance?: number }>("/wallet/redeem-giftcard", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  purchaseGiftCard: (data: {
    amount: number;
    recipientEmail: string;
    recipientName?: string;
    senderName?: string;
    message?: string;
    autoCreditSelf?: boolean;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      giftCard?: {
        code: string;
        amount: number;
        expiryDate: string;
        recipientEmail?: string;
        recipientName?: string;
        senderName?: string;
      };
      walletBalance?: number;
    }>("/wallet/purchase-giftcard", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createCashfreeOrder: (data: {
    amount: number;
    recipientEmail: string;
    recipientName?: string;
    senderName?: string;
    senderEmail?: string;
    customerPhone?: string;
    message?: string;
    theme?: string;
    deliveryOption?: "now" | "scheduled";
    scheduledDeliveryDate?: string | null;
    autoCreditSelf?: boolean;
    returnUrl?: string;
  }) =>
    apiRequest<{
      success: boolean;
      message?: string;
      orderId?: string;
      paymentSessionId?: string;
      cfOrderId?: string;
      amount?: number;
      mode?: "sandbox" | "production";
    }>("/wallet/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyCashfreeOrder: (data: { orderId: string }) =>
    apiRequest<{
      success: boolean;
      verified?: boolean;
      message?: string;
      couponCode?: string;
      amount?: number;
      recipientEmail?: string;
      recipientName?: string;
      senderName?: string;
      theme?: string;
      deliveryOption?: "now" | "scheduled";
      scheduledDeliveryDate?: string;
      expiryDate?: string;
      isAutoCredited?: boolean;
    }>("/wallet/cashfree/verify-order", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyGiftCardBalance: (code: string) =>
    apiRequest<{
      success: boolean;
      valid: boolean;
      code?: string;
      initialBalance?: number;
      currentBalance?: number;
      status?: "Active" | "Partially Used" | "Used" | "Expired" | "Cancelled";
      theme?: string;
      senderName?: string;
      recipientName?: string;
      expiryDate?: string;
      redemptionPerk?: {
        enabled: boolean;
        discountType: "percentage" | "fixed";
        discountValue: number;
        minOrderAmount: number;
        maxDiscount: number;
        promoLabel: string;
        description: string;
      };
      message?: string;
    }>("/wallet/gift-cards/verify-balance", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  adminAdjust: (data: { userId?: string; userEmail?: string; type: "credit" | "debit"; amount: number; reason?: string }) =>
    apiRequest("/wallet/admin/adjust-balance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  adminCreateGiftCard: (data: {
    amount: number;
    customCode?: string;
    recipientName?: string;
    recipientEmail?: string;
    senderName?: string;
    theme?: string;
    notes?: string;
    validityDays?: number;
    sendEmailToRecipient?: boolean;
  }) =>
    apiRequest("/wallet/admin/gift-cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  adminGetGiftCards: (params: { search?: string; status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    const qs = searchParams.toString();
    return apiRequest<{
      success: boolean;
      count: number;
      metrics?: {
        totalSales: number;
        totalRedeemed: number;
        outstandingLiabilities: number;
        totalCount: number;
      };
      totalActiveLiability?: number;
      giftCards: any[];
    }>(`/wallet/admin/gift-cards${qs ? `?${qs}` : ""}`);
  },

  adminCancelGiftCard: (id: string, reason?: string) =>
    apiRequest(`/wallet/admin/gift-cards/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  adminExtendGiftCardExpiry: (id: string, additionalDays: number = 365, newExpiryDate?: string) =>
    apiRequest(`/wallet/admin/gift-cards/${id}/extend-expiry`, {
      method: "POST",
      body: JSON.stringify({ additionalDays, newExpiryDate }),
    }),
};

// ==========================================
// Search Telemetry & Demand Radar API
// ==========================================
export interface SearchAnalyticsData {
  summary: {
    totalSearches: number;
    zeroResultsCount: number;
    zeroResultRate: string;
  };
  topQueries: Array<{
    query: string;
    count: number;
    avgResults: number;
    lastSearched: string;
  }>;
  zeroResultQueries: Array<{
    query: string;
    count: number;
    lastSearched: string;
  }>;
  recentLogs?: Array<{
    _id: string;
    query: string;
    resultsCount: number;
    category?: string;
    source?: string;
    createdAt: string;
  }>;
}

export const searchTelemetryApi = {
  logQuery: (query: string, resultsCount: number = 0, category?: string) =>
    apiRequest("/telemetry/search-log", {
      method: "POST",
      body: JSON.stringify({ query, resultsCount, category }),
    }),

  getAnalytics: () => apiRequest<SearchAnalyticsData>("/telemetry/search-analytics"),

  seedSample: () =>
    apiRequest<{ success: boolean; message: string; count: number }>("/telemetry/seed-sample", {
      method: "POST",
    }),

  clearLogs: (zeroOnly: boolean = false) =>
    apiRequest<{ success: boolean; message: string }>(
      `/telemetry/search-logs${zeroOnly ? "?zeroOnly=true" : ""}`,
      {
        method: "DELETE",
      }
    ),

  getExportCsvUrl: () => `${API_BASE}/telemetry/export-radar-csv`,
};

// ==========================================
// Shoppable Instagram UGC Feed API
// ==========================================
export interface ShopTheLookPost {
  _id: string;
  imageUrl: string;
  caption: string;
  instagramHandle: string;
  likesCount: number;
  taggedProducts: Array<{
    product: {
      _id: string;
      name: string;
      price: string;
      numericPrice: number;
      images: string[];
      slug: string;
      stock?: number;
      category?: string;
    };
    positionX: number;
    positionY: number;
  }>;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export const shopTheLookApi = {
  getPosts: () => apiRequest<{ count: number; posts: ShopTheLookPost[] }>("/shop-the-look"),

  adminGetAll: () => apiRequest<{ count: number; posts: ShopTheLookPost[] }>("/shop-the-look/admin/all"),

  createPost: (data: Partial<ShopTheLookPost>) =>
    apiRequest("/shop-the-look", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    apiRequest(`/shop-the-look/${id}`, {
      method: "DELETE",
    }),
};

// ==========================================
// Terms & Conditions CMS API
// ==========================================
export interface TermsSectionData {
  id: string;
  sectionNumber: string;
  title: string;
  subtitle?: string;
  content: string[];
  bulletPoints?: string[];
  highlightBox?: string;
}

export interface TermsConfigData {
  isEnabled: boolean;
  pageTitle: string;
  pageSubtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  versionTag: string;
  heroSummary: string;
  sections: TermsSectionData[];
  supportDeskText: string;
  supportEmail: string;
  supportPhone: string;
  governingLaw: string;
}

export const DEFAULT_TERMS_CONFIG: TermsConfigData = {
  isEnabled: true,
  pageTitle: "TERMS & CONDITIONS",
  pageSubtitle: "ATELIER PROTOCOL & COMMERCIAL GOVERNANCE",
  effectiveDate: "March 01, 2026",
  lastUpdated: "September 20, 2026",
  versionTag: "ATELIER PROTOCOL V2.6",
  heroSummary:
    "Welcome to Drapza. By accessing, browsing, or executing transactions across our atelier platform, you acknowledge and agree to comply with our commercial terms, textile specifications, and transactional protocols outlined herein.",
  sections: [
    {
      id: "sec-1",
      sectionNumber: "01",
      title: "ACCEPTANCE OF TERMS & ATELIER PROTOCOL",
      subtitle: "Binding legal agreement between the client and Drapza Atelier",
      content: [
        "These Terms and Conditions govern your access to and utilization of the Drapza platform (drapza.com, mobile interfaces, and associated services). By purchasing any garment archetype or engaging with our digital suite, you signify your irrevocable acceptance of these provisions.",
        "Drapza reserves the prerogative to modify, revise, or update these terms at our unilateral discretion. Continued engagement following any published revisions constitutes direct legal acceptance of the renewed protocol.",
      ],
      bulletPoints: [
        "Clients must be of legal age (18+) or access the platform under parental/guardian supervision.",
        "Commercial bots, automated scraping, or unauthorized telemetry manipulation is strictly prohibited.",
        "Transactions executed under your registered authentication are your sole legal responsibility.",
      ],
      highlightBox:
        "All interactions with the Drapza digital interface are tracked via authenticated telemetry to protect intellectual property and transaction integrity.",
    },
    {
      id: "sec-2",
      sectionNumber: "02",
      title: "PRODUCT ARCHITECTURES, TEXTILE ACCURACY & PRICING",
      subtitle: "Color rendition, artisanal variations, and pricing structures",
      content: [
        "Every Drapza silhouette is engineered with precision textiles (e.g. pure silk, organza, combed french terry, chanderi, and jacquard weaves). Because of the tactile nature of high-grade artisanal fabrics and screen display calibrations, slight optical color and drape variations may occur.",
        "All prices listed on the platform are in Indian Rupees (INR) and inclusive of applicable Goods and Services Tax (GST) unless explicitly noted during checkout. We reserve the right to correct typographical pricing discrepancies prior to fulfillment.",
      ],
      bulletPoints: [
        "Catalog weights (e.g., 480 GSM) and weave densities represent atelier target standards.",
        "Promotional coupon codes and flash discounts are subject to specific validity and quota rules.",
        "Prices are subject to revision without prior notice prior to order confirmation.",
      ],
    },
    {
      id: "sec-3",
      sectionNumber: "03",
      title: "ORDERS, PAYMENTS & SECURE AUTHENTICATION",
      subtitle: "Transaction fulfillment, gateway tokens, and Cash on Delivery protocol",
      content: [
        "Placing an order constitutes an offer to purchase the selected garment archetype. Orders are finalized upon receipt of successful payment authorization or COD verification.",
        "We support trusted encrypted payment gateways including UPI, Debit/Credit Cards, Net Banking, and Verified Cash on Delivery (where eligible). Drapza does not retain raw credit card credentials.",
      ],
      bulletPoints: [
        "Orders flagged by fraud detection algorithms may undergo secondary phone/OTP verification.",
        "Cash on Delivery orders are subject to regional PIN code accessibility and verification thresholds.",
        "Tax invoices compliant with GST regulations are issued electronically upon dispatch.",
      ],
      highlightBox:
        "Payment gateways utilize 256-bit bank-grade SSL encryption. Invoices contain authorized GSTIN telemetry.",
    },
    {
      id: "sec-4",
      sectionNumber: "04",
      title: "PACKAGING, SHIPPING & DISPATCH TELEMETRY",
      subtitle: "Transit timelines, tamper-proof packaging, and delivery tracking",
      content: [
        "Drapza dispatches all authenticated garments in tamper-evident atelier packaging accompanied by thermal shipping telemetry and consignment manifests.",
        "Standard domestic delivery timelines range between 3 to 7 business days depending on delivery logistics and destination pin codes. Express dispatch options are provided when active.",
      ],
      bulletPoints: [
        "Real-time live consignment tracking is available via our /track portal using Order ID or Phone Number.",
        "If packaging appears tampered with or damaged upon arrival, clients should reject delivery and notify support immediately.",
        "Drapza is not liable for transit delays caused by force majeure, weather anomalies, or statutory courier disruptions.",
      ],
    },
    {
      id: "sec-5",
      sectionNumber: "05",
      title: "EXCHANGES, RETURNS & REFUND PROTOCOL",
      subtitle: "Conditions for returns, size swaps, and reverse logistics",
      content: [
        "We maintain a structured return and exchange policy for unworn, unwashed garments bearing original tags and security ribbons within the defined return window (typically 7 calendar days from confirmed delivery).",
        "Upon receipt and physical inspection of returned items at our fulfillment hub, refunds or store credits are initiated to the original payment channel within 5–7 business days.",
      ],
      bulletPoints: [
        "Intimate garments (e.g., innerwear/panties/bras) and custom bespoke alterations are non-returnable due to hygiene and customization policies.",
        "Items damaged by client mishandling, fragrance application, or missing atelier tags will be ineligible for refund.",
        "Reverse logistics pickup is scheduled according to courier coverage in your area.",
      ],
    },
    {
      id: "sec-6",
      sectionNumber: "06",
      title: "INTELLECTUAL PROPERTY & TRADEMARKS",
      subtitle: "Atelier designs, typography, brand imagery, and legal ownership",
      content: [
        "All visual assets, garment patterns, photography, codebases, typography, logos, trademarks, and editorial narratives displayed on the platform are the exclusive intellectual property of Drapza Atelier.",
        "No reproduction, commercial redistribution, reverse engineering, or mirroring of any content is permitted without express written authorization.",
      ],
      bulletPoints: [
        "Drapza trademark and symbol cannot be used in association with third-party unauthorized merchandise.",
        "Violations will be subject to civil and criminal legal action under applicable intellectual property laws.",
      ],
    },
    {
      id: "sec-7",
      sectionNumber: "07",
      title: "CLIENT CONDUCT, ACCOUNTS & DATA SECURITY",
      subtitle: "Account integrity, authenticated session tokens, and privacy protections",
      content: [
        "Clients are responsible for maintaining the confidentiality of their account credentials, OTP codes, and login sessions. Any suspicious activity should be reported immediately.",
        "Personal information, delivery coordinates, and transaction logs are processed in compliance with our strict Data Privacy Architecture and will not be sold to third-party marketing brokers.",
      ],
      bulletPoints: [
        "Accounts engaging in abusive return patterns or fraudulent chargebacks may be permanently terminated.",
        "We utilize encrypted session cookies and device telemetry to safeguard account security.",
      ],
    },
    {
      id: "sec-8",
      sectionNumber: "08",
      title: "LIMITATION OF LIABILITY & INDEMNIFICATION",
      subtitle: "Legal boundaries of atelier liability and warranty provisions",
      content: [
        "To the fullest extent permitted by applicable law, Drapza shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of your utilization of our products or digital platform.",
        "In all cases, Drapza's aggregate liability shall not exceed the actual monetary amount paid by the client for the specific garment order in dispute.",
      ],
    },
    {
      id: "sec-9",
      sectionNumber: "09",
      title: "GOVERNING LAW & JURISDICTION",
      subtitle: "Legal jurisdiction and dispute resolution mechanisms",
      content: [
        "These Terms and Conditions and any contractual disputes arising from transactions on this platform shall be governed by and construed in accordance with the substantive laws of the Republic of India.",
        "Any legal proceedings or arbitration arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in India.",
      ],
    },
    {
      id: "sec-10",
      sectionNumber: "10",
      title: "DIRECT ATELIER CONCIERGE & LEGAL DISPATCH",
      subtitle: "Official channels for legal inquiries, notices, and support escalations",
      content: [
        "For legal inquiries, terms clarifications, or transaction disputes, clients can reach our dedicated Atelier Concierge Desk through our official communication channels.",
      ],
      bulletPoints: [
        "Support & Legal Desk Email: support@drapza.com",
        "Direct Hotline & WhatsApp: +91 8888333038",
        "Online Support Concierge: /support",
      ],
      highlightBox:
        "Official legal notices must be served in writing to our registered corporate communication desk.",
    },
  ],
  supportDeskText: "Need legal clarification or custom trade consultation? Connect with our desk.",
  supportEmail: "support@drapza.com",
  supportPhone: "+91 8888333038",
  governingLaw: "Republic of India • Exclusive Court Jurisdiction Applicable",
};

export const termsConfigApi = {
  getTermsConfig: () => apiRequest<TermsConfigData>("/terms-config"),

  updateTermsConfig: (data: Partial<TermsConfigData>) =>
    apiRequest<TermsConfigData>("/terms-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  resetTermsConfig: () =>
    apiRequest<TermsConfigData>("/terms-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// BOGO / Tiered Bundle Deals API
// ==========================================
export interface BogoTierData {
  id: string;
  name: string;
  tag: string;
  buyQty: number;
  getQty: number; // free items
  totalQty: number;
  discountPercentage: number;
  badgeText?: string;
  popular?: boolean;
  isActive: boolean;
}

export interface BogoConfigData {
  isEnabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  bannerNotice: string;
  allowColorMix: boolean;
  allowSizeMix: boolean;
  tiers: BogoTierData[];
}

export const DEFAULT_BOGO_CONFIG: BogoConfigData = {
  isEnabled: false,
  sectionTitle: "SPECIAL BUNDLE DEALS • BUY & GET FREE",
  sectionSubtitle: "Select a package to unlock complimentary garments & maximum savings",
  bannerNotice: "SPECIAL ATELIER OFFER: Buy 1 piece and unlock up to 3 complimentary garments!",
  allowColorMix: true,
  allowSizeMix: true,
  tiers: [
    {
      id: "bogo-single",
      name: "1 PIECE (STANDARD)",
      tag: "1 ITEM",
      buyQty: 1,
      getQty: 0,
      totalQty: 1,
      discountPercentage: 0,
      badgeText: "STANDARD",
      popular: false,
      isActive: true,
    },
    {
      id: "bogo-1-1",
      name: "BUY 1 GET 1 FREE",
      tag: "2 PIECES PACK",
      buyQty: 1,
      getQty: 1,
      totalQty: 2,
      discountPercentage: 50,
      badgeText: "SAVE 50%",
      popular: false,
      isActive: true,
    },
    {
      id: "bogo-1-2",
      name: "BUY 1 GET 2 FREE",
      tag: "3 PIECES PACK",
      buyQty: 1,
      getQty: 2,
      totalQty: 3,
      discountPercentage: 66,
      badgeText: "MOST POPULAR",
      popular: true,
      isActive: true,
    },
    {
      id: "bogo-1-3",
      name: "BUY 1 GET 3 FREE",
      tag: "4 PIECES PACK",
      buyQty: 1,
      getQty: 3,
      totalQty: 4,
      discountPercentage: 75,
      badgeText: "BEST VALUE",
      popular: false,
      isActive: true,
    },
  ],
};

export const bogoConfigApi = {
  getBogoConfig: () => apiRequest<BogoConfigData>("/bogo-config"),

  updateBogoConfig: (data: Partial<BogoConfigData>) =>
    apiRequest<BogoConfigData>("/bogo-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  resetBogoConfig: () =>
    apiRequest<BogoConfigData>("/bogo-config/reset", {
      method: "POST",
    }),
};






export interface FrameShiftConfigData {
  signalType?: string;
  moduleId?: string;
  status?: string;
  headline?: string;
  brandText?: string;
  badgeText?: string;
  pulseDot?: boolean;
  marqueeTrack1?: string;
  marqueeTrack2?: string;
  modelImage?: string;
  modelAlt?: string;
  modelScale?: number;
  modelOffsetY?: number;
  modelOffsetX?: number;
  sectionBgColor?: string;
  cardBgColor?: string;
  cardTextColor?: string;
  marqueeTextColor?: string;
  marqueeOpacity?: number;
  animationStyle?: "scroll_parallax" | "infinite_marquee" | "float_pulse" | "cinematic_zoom";
  enable3dTilt?: boolean;
  tiltIntensity?: number;
  marqueeSpeed?: number;
  cardShadow?: "dramatic" | "soft" | "glow" | "none";
  isEnabled?: boolean;
}

export const defaultFrameShiftData: FrameShiftConfigData = {
  signalType: "SIGNAL TYPE: NEUTRAL",
  moduleId: "MODULE ID: NRMLSS_001",
  status: "STATUS: DETACHED",
  headline: "DESIGNED ABSENCE,\nENGINEERED SILENCE.",
  brandText: "DRAPZA",
  badgeText: "[ FRAME SHIFT ]",
  pulseDot: true,
  marqueeTrack1: "DESIGNED ABSENCE, ENGINEERED SILENCE",
  marqueeTrack2: "SYNTHETIC FORMS ARCHIVE THE SIGNAL",
  modelImage: "/images/drapza/marquee-banner/marquee_banner_01.png",
  modelAlt: "Drapza model wearing a neutral technical overshirt",
  modelScale: 100,
  modelOffsetY: 0,
  modelOffsetX: 0,
  sectionBgColor: "#fafafa",
  cardBgColor: "#0a0a0a",
  cardTextColor: "#ffffff",
  marqueeTextColor: "#525252",
  marqueeOpacity: 0.7,
  animationStyle: "scroll_parallax",
  enable3dTilt: true,
  tiltIntensity: 16,
  marqueeSpeed: 550,
  cardShadow: "dramatic",
  isEnabled: true,
};

export const frameShiftApi = {
  getFrameShiftConfig: () => apiRequest<FrameShiftConfigData>("/frame-shift-config"),
  updateFrameShiftConfig: (data: Partial<FrameShiftConfigData>) =>
    apiRequest<FrameShiftConfigData>("/frame-shift-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetFrameShiftConfig: () =>
    apiRequest<FrameShiftConfigData>("/frame-shift-config/reset", {
      method: "POST",
    }),
  uploadFrameShiftImage: (base64Image: string) =>
    apiRequest<{ url: string }>("/frame-shift-config/upload-image", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
};

// ==========================================
// 26. BESPOKE CUSTOM SIZE APPOINTMENT API
// ==========================================

export interface AppointmentMeasurements {
  heightCm?: number;
  weightKg?: number;
  chestInches?: number;
  waistInches?: number;
  hipsInches?: number;
  shoulderInches?: number;
  inseamInches?: number;
  fitPreference?: "boxy" | "tapered" | "oversized" | "bespoke";
  customNotes?: string;
}

export interface AppointmentItem {
  _id: string;
  appointmentId: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  appointmentType: "atelier_visit" | "home_fitting" | "virtual_consultation";
  preferredDate: string;
  preferredTimeSlot: string;
  city?: string;
  address?: string;
  pincode?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number | string;
  measurements: AppointmentMeasurements;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  assignedFitter?: string;
  adminNotes?: string;
  virtualMeetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentBookingPayload {
  fullName: string;
  email: string;
  phone: string;
  appointmentType: "atelier_visit" | "home_fitting" | "virtual_consultation";
  preferredDate: string;
  preferredTimeSlot: string;
  city?: string;
  address?: string;
  pincode?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number | string;
  measurements?: AppointmentMeasurements;
}

export interface AppointmentListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  statusCounts: {
    total: number;
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  appointments: AppointmentItem[];
}

export const appointmentApi = {
  bookAppointment: (payload: AppointmentBookingPayload) =>
    apiRequest<{ appointment: AppointmentItem }>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyAppointments: (email?: string) => {
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    return apiRequest<{ appointments: AppointmentItem[]; count: number }>(`/appointments/my${qs}`);
  },

  getAllAppointments: (params?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.type && params.type !== "ALL") query.append("type", params.type);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    return apiRequest<AppointmentListResponse>(`/appointments${qs ? `?${qs}` : ""}`);
  },

  updateAppointmentStatus: (
    id: string,
    payload: {
      status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
      assignedFitter?: string;
      adminNotes?: string;
      virtualMeetingLink?: string;
      preferredDate?: string;
      preferredTimeSlot?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      city?: string;
      address?: string;
      pincode?: string;
      appointmentType?: "atelier_visit" | "home_fitting" | "virtual_consultation";
      measurements?: Partial<AppointmentMeasurements>;
    }
  ) =>
    apiRequest<{ appointment: AppointmentItem }>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  sendNotification: (id: string) =>
    apiRequest<{ message: string }>(`/appointments/${id}/notify`, {
      method: "POST",
    }),

  deleteAppointment: (id: string) =>
    apiRequest<{ message: string }>(`/appointments/${id}`, {
      method: "DELETE",
    }),

  getExportUrl: () => `${API_BASE}/appointments/export-csv`,
};

// ─── Testimonials / Boutique Stories CMS ───
export interface TestimonialStoryItem {
  id: string | number;
  name: string;
  role: string;
  city: string;
  rating: number;
  quote: string;
  avatar?: string;
  badge?: string;
  isActive?: boolean;
}

export interface TestimonialsConfigData {
  heading: string;
  subtext: string;
  badgeText: string;
  isEnabled: boolean;
  autoplay: boolean;
  autoplayInterval: number;
  items: TestimonialStoryItem[];
}

export const DEFAULT_TESTIMONIALS_CONFIG: TestimonialsConfigData = {
  heading: "BOUTIQUE STORIES",
  subtext: "Verified client reviews and architectural tailoring feedback",
  badgeText: "[ VERIFIED ATELIER CLIENTS ]",
  isEnabled: true,
  autoplay: true,
  autoplayInterval: 6000,
  items: [
    {
      id: "diana-tigelle",
      name: "Diana Tigelle",
      role: "Editorial Director & Atelier Patron",
      city: "Milan / New York",
      rating: 5,
      avatar: "/testimonials/diana-tigelle.png",
      quote:
        "Neither man nor woman is perfect or complete without the other. Thus, no marriage or family, no ward or stake is likely to reach its full potential until husbands and wives, mothers and fathers, men and women work together in unity of purpose, respecting and relying upon each other’s strengths.",
      badge: "Order #DPZ-8910",
      isActive: true,
    },
    {
      id: "marcus-vance",
      name: "Marcus Vance",
      role: "Creative Director, NeoTokyo Dept.",
      city: "Berlin / Tokyo",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      quote:
        "The architectural drape of the Series-04 technical shell is peerless. Waterproof taped seams withstand torrential storms while maintaining a sculpted runway silhouette. Drapza sets the definitive standard for modular luxury.",
      badge: "0.003mm Seam Precision",
      isActive: true,
    },
    {
      id: "elena-rostova",
      name: "Elena Rostova",
      role: "Senior Apparel Buyer, VANGUARD",
      city: "Stockholm",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
      quote:
        "Drapza represents the frontier of modular luxury. Our boutique sold out our initial delivery within 48 hours. The tactile weight of the fabric and precision of the hardware exceed mainline Parisian benchmarks.",
      badge: "100% Client Retention",
      isActive: true,
    },
    {
      id: "kaelen-thorne",
      name: "Kaelen Thorne",
      role: "Urban Expeditionist & Collector",
      city: "Vancouver",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      quote:
        "Tested the modular utility pockets through sub-zero alpine conditions and downtown transit. Ergonomics, fabric resilience, and silhouette balance are superior to anything currently existing in modern techwear.",
      badge: "Tested at -18°C",
      isActive: true,
    },
  ],
};

export const testimonialsConfigApi = {
  getTestimonialsConfig: () => apiRequest<TestimonialsConfigData>("/testimonials-config"),
  updateTestimonialsConfig: (data: Partial<TestimonialsConfigData>) =>
    apiRequest<TestimonialsConfigData>("/testimonials-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetTestimonialsConfig: () =>
    apiRequest<TestimonialsConfigData>("/testimonials-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// Touchpoint & Concierge CMS API
// ==========================================
export interface TouchpointConfigData {
  isEnabled: boolean;
  heroHeading: string;
  heroImage: string;
  commsLabel: string;
  commsEmail: string;
  dispatchLabel: string;
  dispatchEmail: string;
  phoneLabel: string;
  phoneNumber: string;
  calloutDescription: string;
  calloutHeading: string;
  calloutImage: string;
}

export const DEFAULT_TOUCHPOINT_CONFIG: TouchpointConfigData = {
  isEnabled: true,
  heroHeading: 'Outbound access is limited, proceed with intent.',
  heroImage: '/contact/hero.png',
  commsLabel: 'External Comms Protocol',
  commsEmail: 'echo@drapza.com',
  dispatchLabel: 'Dispatch Inquiry System',
  dispatchEmail: 'dispatch@drapza.com',
  phoneLabel: 'Direct Phone Line',
  phoneNumber: '+91 8888333038',
  calloutDescription: "Get early signals, private releases, and occasional noise worth hearing. You'll know when it matters.",
  calloutHeading: 'Connect to the silent grid',
  calloutImage: '/contact/contact-callout.jpg',
};

export const touchpointConfigApi = {
  getTouchpointConfig: () => apiRequest<TouchpointConfigData>("/touchpoint-config"),
  updateTouchpointConfig: (data: Partial<TouchpointConfigData>) =>
    apiRequest<TouchpointConfigData>("/touchpoint-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadTouchpointImage: (image: string) =>
    apiRequest<{ success: boolean; url: string }>("/touchpoint-config/upload", {
      method: "POST",
      body: JSON.stringify({ image }),
    }),
  resetTouchpointConfig: () =>
    apiRequest<TouchpointConfigData>("/touchpoint-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// Material Tactile Science / GSM Loupe CMS API
// ==========================================
export interface GsmTierData {
  gsm: number;
  label: string;
  category: string;
  thickness: string;
  rigidityScore: string;
  zeroClingIndex: string;
  zeroClingSub: string;
  drapeFallAngle: number;
  description: string;
  image: string;
  threadCount: string;
  isActive?: boolean;
}

export interface FabricGsmConfigData {
  isEnabled?: boolean;
  sectionTag?: string;
  headline?: string;
  subtext?: string;
  defaultGsm?: number;
  tiers?: GsmTierData[];
}

export const DEFAULT_FABRIC_GSM_CONFIG: FabricGsmConfigData = {
  isEnabled: true,
  sectionTag: "MATERIAL TACTILE SCIENCE",
  headline: "480 GSM ARCHITECTURAL DRAPE",
  subtext:
    "We reject fragile fast-fashion fabrics. Compare our 480 GSM double-weave density against commercial standards and inspect thread-level lockstitch alignment.",
  defaultGsm: 480,
  tiers: [
    {
      gsm: 180,
      label: "180 GSM • COMMERCIAL STANDARD",
      category: "Mass Market Fast Fashion",
      thickness: "0.42 MM",
      rigidityScore: "32 / 100",
      zeroClingIndex: "POOR ZERO-CLING",
      zeroClingSub: "Prone to static body cling",
      drapeFallAngle: 68,
      description:
        "Standard thin jersey. Prone to wrinkling, structural collapse, and transparent sheen under studio lighting.",
      image:
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
      threadCount: "180 THREADS / SQ INCH",
      isActive: true,
    },
    {
      gsm: 280,
      label: "280 GSM • PREMIUM STREETWEAR",
      category: "Mid-Tier Luxury Cotton",
      thickness: "0.72 MM",
      rigidityScore: "64 / 100",
      zeroClingIndex: "MODERATE RETENTION",
      zeroClingSub: "Standard structured drape",
      drapeFallAngle: 45,
      description:
        "Acceptable heavyweight cotton. Retains casual structure but degrades in boxy shoulder crispness after initial washes.",
      image:
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1200&auto=format&fit=crop&q=80",
      threadCount: "260 THREADS / SQ INCH",
      isActive: true,
    },
    {
      gsm: 480,
      label: "480 GSM • DRAPZA ATELIER STANDARD",
      category: "Bespoke Architectural Double-Weave",
      thickness: "1.28 MM",
      rigidityScore: "96 / 100",
      zeroClingIndex: "MAXIMUM ZERO-CLING",
      zeroClingSub: "Monolithic body separation",
      drapeFallAngle: 22,
      description:
        "Our signature heavyweight French Terry and Modal Silk weave. Delivers sculpted monolithic presence, zero body cling, and lifetime silhouette memory.",
      image:
        "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200&auto=format&fit=crop&q=80",
      threadCount: "340 THREADS / SQ INCH",
      isActive: true,
    },
  ],
};

export const fabricGsmApi = {
  getConfig: () => apiRequest<FabricGsmConfigData>("/fabric-gsm-config"),
  updateConfig: (data: Partial<FabricGsmConfigData>) =>
    apiRequest<FabricGsmConfigData>("/fabric-gsm-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetConfig: () =>
    apiRequest<FabricGsmConfigData>("/fabric-gsm-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// RUNWAY REELS (SHOPPABLE VIDEO) CMS API
// ==========================================
export interface RunwayHotspotProductData {
  id: number;
  name: string;
  price: number;
  priceFormatted: string;
  category: string;
  image: string;
  hotspotTop: number;
  hotspotLeft: number;
}

export interface RunwayLookData {
  id: string;
  title: string;
  season: string;
  posterImage: string;
  videoUrl?: string;
  modelDetails: string;
  description?: string;
  products: RunwayHotspotProductData[];
}

export interface RunwayReelsConfigData {
  isEnabled?: boolean;
  sectionTag?: string;
  headline?: string;
  subtext?: string;
  autoplay?: boolean;
  looks?: RunwayLookData[];
}

export const DEFAULT_RUNWAY_REELS_CONFIG: RunwayReelsConfigData = {
  isEnabled: true,
  sectionTag: "SHOPPABLE RUNWAY IN MOTION",
  headline: "ATELIER RUNWAY REELS",
  subtext:
    "Observe architectural fabric motion and silhouettes live. Tap garment hotspots directly to inspect tailoring details and add directly to bag.",
  autoplay: true,
  looks: [
    {
      id: "runway-look-1",
      title: "NOCTURNE OVERSIZED TRENCH",
      season: "AUTUMN / WINTER 2026",
      posterImage:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
      videoUrl: "",
      modelDetails: "ATELIER RUNWAY • 186 CM • WEARING SIZE L",
      description:
        "Tailored for zero restriction and high structural integrity. Engineered with double-needle flatlock seams and heavyweight cotton-modal silk blend.",
      products: [
        {
          id: 1,
          name: "ANARKALI FLUID TRENCH",
          price: 1440,
          priceFormatted: "₹1,440",
          category: "Outerwear",
          image: "/images/drapza/products/product_1.png",
          hotspotTop: 42,
          hotspotLeft: 48,
        },
      ],
    },
    {
      id: "runway-look-2",
      title: "MONOCHROME BRUTALIST SILHOUETTE",
      season: "COUTURE EDITION 004",
      posterImage:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80",
      videoUrl: "",
      modelDetails: "ATELIER RUNWAY • 182 CM • WEARING SIZE M",
      description:
        "Geometric cut lines with stark contrast panelling. Sculpted proportions designed for monumental presence.",
      products: [
        {
          id: 2,
          name: "LUCKNOWI GEOMETRIC TUNIC",
          price: 1650,
          priceFormatted: "₹1,650",
          category: "Atelier Tops",
          image: "/images/drapza/products/product_6.png",
          hotspotTop: 36,
          hotspotLeft: 52,
        },
      ],
    },
    {
      id: "runway-look-3",
      title: "HEAVYWEIGHT 480 GSM DRAPE",
      season: "ARCHITECTURAL CAPSULE",
      posterImage:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
      videoUrl: "",
      modelDetails: "PARIS SHOWROOM • 188 CM • WEARING SIZE XL",
      description:
        "Heavyweight structural draping engineered with 480 GSM double-knit weave. Zero cling with architectural contouring.",
      products: [
        {
          id: 3,
          name: "ANGRAKHA HEAVYWEIGHT FIT",
          price: 1890,
          priceFormatted: "₹1,890",
          category: "Bespoke Outerwear",
          image: "/images/drapza/products/product_11.png",
          hotspotTop: 48,
          hotspotLeft: 50,
        },
      ],
    },
    {
      id: "runway-look-4",
      title: "SCULPTURAL BESPOKE KIMONO",
      season: "LIMITED ATELIER VAULT",
      posterImage:
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80",
      videoUrl: "",
      modelDetails: "MILAN ARCHIVE • 184 CM • WEARING SIZE L",
      description:
        "Minimalist cross-cultural draping with reinforced drop shoulders and monolithic hem geometry.",
      products: [
        {
          id: 4,
          name: "A-LINE MINIMALIST BLEND",
          price: 1250,
          priceFormatted: "₹1,250",
          category: "Atelier Essentials",
          image: "/images/drapza/products/product_18.png",
          hotspotTop: 50,
          hotspotLeft: 46,
        },
      ],
    },
  ],
};

export const runwayReelsApi = {
  getConfig: () => apiRequest<RunwayReelsConfigData>("/runway-reels-config"),
  updateConfig: (data: Partial<RunwayReelsConfigData>) =>
    apiRequest<RunwayReelsConfigData>("/runway-reels-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetConfig: () =>
    apiRequest<RunwayReelsConfigData>("/runway-reels-config/reset", {
      method: "POST",
    }),
};

// ==========================================
// VAULT DROPS (SCARCITY ARCHIVE) CMS API
// ==========================================
export interface VipRequestData {
  contact: string;
  passcode: string;
  createdAt: string;
}

export interface VaultGarmentData {
  title: string;
  badge: string;
  serialPrefix: string;
  price: number;
  priceFormatted: string;
  image: string;
  features: string[];
  buttonText: string;
}

export interface VaultCountdownData {
  heading: string;
  targetEndDate: string;
  timerHours: number;
  timerMinutes: number;
  timerSeconds: number;
}

export interface VaultVipProtocolData {
  badge: string;
  title: string;
  subtext: string;
  inputPlaceholder: string;
  buttonText: string;
}

export interface VaultDropsConfigData {
  isEnabled?: boolean;
  sectionTag?: string;
  headline?: string;
  subtext?: string;
  batchNumber?: string;
  totalUnits?: number;
  allocatedUnits?: number;
  garment?: VaultGarmentData;
  countdown?: VaultCountdownData;
  vipProtocol?: VaultVipProtocolData;
  vipRequests?: VipRequestData[];
}

export const DEFAULT_VAULT_DROPS_CONFIG: VaultDropsConfigData = {
  isEnabled: true,
  sectionTag: "THE VAULT • STRICT MONOCHROME ARCHIVE",
  headline: "LIMITED BATCH 004 DROP",
  subtext:
    "Strictly 50 individually serialized garments crafted per drop. Once allocated, patterns are permanently retired into the Drapza archive vault.",
  batchNumber: "BATCH 004",
  totalUnits: 50,
  allocatedUnits: 19,
  garment: {
    title: "ARCHITECTURAL KIMONO TRENCH",
    badge: "EXCLUSIVE BATCH DROP",
    serialPrefix: "SERIAL NO. #884-",
    price: 4850,
    priceFormatted: "₹4,850 • 480 GSM",
    image: "/images/drapza/products/product_1.png",
    features: [
      "Heavyweight Double-Weave French Terry",
      "Hand-Waxed Structured Sleeve Cuffs",
      "Laser-Engraved Metal Serial Plate",
      "Lifetime Complimentary Alteration Warranty",
    ],
    buttonText: "RESERVE NEXT ALLOCATION",
  },
  countdown: {
    heading: "GLOBAL PUBLIC ALLOCATION CLOSES IN:",
    targetEndDate: new Date(Date.now() + 14 * 3600000 + 38 * 60000).toISOString(),
    timerHours: 14,
    timerMinutes: 38,
    timerSeconds: 42,
  },
  vipProtocol: {
    badge: "VIP EARLY ACCESS PROTOCOL",
    title: "REQUEST BATCH 005 VAULT PASSCODE",
    subtext:
      "Receive a priority cryptographic key for future confidential 480 GSM drops 2 hours ahead of public release.",
    inputPlaceholder: "ENTER EMAIL OR WHATSAPP NUMBER",
    buttonText: "GENERATE PRIVATE VAULT KEY",
  },
  vipRequests: [],
};

export const vaultDropsApi = {
  getConfig: () => apiRequest<VaultDropsConfigData>("/vault-drops-config"),
  updateConfig: (data: Partial<VaultDropsConfigData>) =>
    apiRequest<VaultDropsConfigData>("/vault-drops-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetConfig: () =>
    apiRequest<VaultDropsConfigData>("/vault-drops-config/reset", {
      method: "POST",
    }),
  requestVipPasscode: (contact: string) =>
    apiRequest<{ passcode: string; message: string }>("/vault-drops-config/vip-request", {
      method: "POST",
      body: JSON.stringify({ contact }),
    }),
};

// ==========================================
// AUTH PORTAL (LOGIN / REGISTER CMS)
// ==========================================

export interface FabricSwatchData {
  id: string;
  name: string;
  weight: string;
  blend: string;
  cut: string;
  colorHex: string;
  tagBg?: string;
  tagText?: string;
  accentBadge: string;
  image: string;
}

export interface AuthPortalConfigData {
  isEnabled?: boolean;
  atelierTag?: string;
  atelierBadgeText?: string;
  atelierLotNumber?: string;
  atelierSeasonText?: string;
  stitchSpecText?: string;
  memberProtocolBadge?: string;

  hangtagEnabled?: boolean;
  hangtagTitle?: string;
  hangtagBrand?: string;
  hangtagSubtext?: string;
  hangtagFabric?: string;
  hangtagLot?: string;
  hangtagGsm?: string;
  hangtagCare?: string;

  loginTitle?: string;
  loginSubtitle?: string;
  loginFormHeading?: string;
  loginTabLabel?: string;
  loginButtonText?: string;
  loginSuccessHeading?: string;
  loginSuccessSubtext?: string;

  registerTitle?: string;
  registerSubtitle?: string;
  registerFormHeading?: string;
  registerTabLabel?: string;
  registerButtonText?: string;
  registerSuccessHeading?: string;
  registerSuccessSubtext?: string;

  enableGoogleLogin?: boolean;
  googleButtonText?: string;
  enableSoundEffects?: boolean;
  enable3dParallax?: boolean;
  enableTilt3D?: boolean;
  enableRememberMe?: boolean;
  rememberMeText?: string;
  termsText?: string;
  termsLinkUrl?: string;

  memberPerksEnabled?: boolean;
  memberPerksText?: string;
  memberPerksBadge?: string;

  cardStyle?: "zero-radius" | "subtle-rounded" | "curved";
  backgroundPatternEnabled?: boolean;
  rulerMeasurementText?: string;

  fabricSwatches?: FabricSwatchData[];
}

export const DEFAULT_AUTH_PORTAL_CONFIG: AuthPortalConfigData = {
  isEnabled: true,
  atelierTag: "DRAPZA ATELIER • FW26",
  atelierBadgeText: "DRAPZA ATELIER • FW26",
  atelierLotNumber: "LOT #042",
  atelierSeasonText: "ATELIER ACTIVE",
  stitchSpecText: "STITCH SPEC: 12 SPI HEAVY SEAM",
  memberProtocolBadge: "MEMBER PROTOCOL",

  hangtagEnabled: true,
  hangtagTitle: "DRAPZA",
  hangtagBrand: "DRAPZA",
  hangtagSubtext: "100% HEAVYWEIGHT COTTON",
  hangtagFabric: "100% HEAVYWEIGHT COTTON",
  hangtagLot: "LOT #042",
  hangtagGsm: "480 GSM",
  hangtagCare: "WASH 30°C",

  loginTitle: "WARDROBE ACCESS",
  loginSubtitle: "Sign in to access your curated fits, order tracking, and bespoke tailoring specs.",
  loginFormHeading: "WARDROBE SIGN IN",
  loginTabLabel: "[01] Sign In",
  loginButtonText: "ENTER WARDROBE VAULT",
  loginSuccessHeading: "WARDROBE VAULT UNLOCKED",
  loginSuccessSubtext: "Loading custom garment catalog...",

  registerTitle: "JOIN THE COLLECTIVE",
  registerSubtitle: "Create an identity to unlock member-only 500-piece numbered garment drops.",
  registerFormHeading: "REGISTER",
  registerTabLabel: "[02] Register",
  registerButtonText: "REGISTER",
  registerSuccessHeading: "ACCOUNT REGISTERED",
  registerSuccessSubtext: "Loading custom garment catalog...",

  enableGoogleLogin: true,
  googleButtonText: "Continue with Google",
  enableSoundEffects: true,
  enable3dParallax: true,
  enableTilt3D: true,
  enableRememberMe: true,
  rememberMeText: "REMEMBER HARDWARE / ATELIER SESSION",
  termsText: "I agree to the Drapza Atelier Manifesto, Fit Vault Terms & Privacy Policy.",
  termsLinkUrl: "/terms",

  memberPerksEnabled: true,
  memberPerksText: "MEMBER PRIVILEGE: BESPOKE SIZING & EARLY LIMITED DROPS",
  memberPerksBadge: "[ATELIER VIP]",

  cardStyle: "zero-radius",
  backgroundPatternEnabled: true,
  rulerMeasurementText: "[00CM] | [25CM • CHEST] | [50CM • SEAM] | [75CM • HEM] | [100CM]",

  fabricSwatches: [
    {
      id: "charcoal",
      name: "RAW CHARCOAL",
      weight: "480 GSM HEAVYWEIGHT FRENCH TERRY",
      blend: "100% COMBED ORGANIC COTTON",
      cut: "OVERSIZED DROP-SHOULDER ARCHETYPE",
      colorHex: "#1b1b1b",
      tagBg: "bg-[#181818]",
      tagText: "text-[#f0f0f0]",
      accentBadge: "ENZYME STONEWASH",
      image: "/images/drapza/products/product_1.png",
    },
    {
      id: "sage",
      name: "VINTAGE SAGE",
      weight: "420 GSM DOUBLE-KNIT INTERLOCK",
      blend: "85% COTTON / 15% RAW HEMP",
      cut: "BOXY RELAXED SILHOUETTE",
      colorHex: "#353d36",
      tagBg: "bg-[#29302a]",
      tagText: "text-[#dce2db]",
      accentBadge: "GARMENT DYED",
      image: "/images/drapza/products/product_18.png",
    },
    {
      id: "ecru",
      name: "NATURAL ECRU",
      weight: "450 GSM LOOPBACK FLEECE",
      blend: "100% UNBLEACHED COMBED COTTON",
      cut: "STRUCTURED DRAPE SILHOUETTE",
      colorHex: "#3d3934",
      tagBg: "bg-[#2b2723]",
      tagText: "text-[#ede5dc]",
      accentBadge: "ZERO PIGMENT DYE",
      image: "/images/drapza/products/product_11.png",
    },
  ],
};

export const authPortalApi = {
  getConfig: () => apiRequest<AuthPortalConfigData>("/auth-portal-config"),
  updateConfig: (data: Partial<AuthPortalConfigData>) =>
    apiRequest<AuthPortalConfigData>("/auth-portal-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetConfig: () =>
    apiRequest<AuthPortalConfigData>("/auth-portal-config/reset", {
      method: "POST",
    }),
};

// ── SEO & GEO TOOLKIT APIS ────────────────────────────────────────────────────
export interface SeoSettingsData {
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string[];
  canonicalBaseUrl: string;
  ogImage: string;
  twitterHandle: string;
  twitterCardType: string;
  verification: {
    google?: string;
    bing?: string;
    yandex?: string;
    pinterest?: string;
  };
  robotsDirectives: {
    index: boolean;
    follow: boolean;
    noarchive: boolean;
    nosnippet: boolean;
    maxImagePreview: string;
  };
  aiCrawlerRules: {
    allowGptBot: boolean;
    allowClaudeBot: boolean;
    allowPerplexityBot: boolean;
    allowGoogleExtended: boolean;
    allowCcBot: boolean;
  };
  customRobotsTxt?: string;
}

export interface SeoPageOverrideData {
  _id?: string;
  path: string;
  pageType: 'home' | 'product' | 'collection' | 'lookbook' | 'page' | 'article';
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  customJsonLd?: string;
  focusKeywords?: string[];
  notes?: string;
  updatedAt?: string;
}

export interface SeoRedirectData {
  _id?: string;
  source: string;
  destination: string;
  permanent: boolean;
  isActive: boolean;
  hits?: number;
}

export interface SeoAuditReportData {
  _id?: string;
  url: string;
  auditType: 'seo' | 'geo' | 'technical';
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issuesCount: {
    critical: number;
    warning: number;
    info: number;
    passed: number;
  };
  metrics: Record<string, any>;
  issues: Array<{
    id: string;
    category: string;
    severity: 'critical' | 'warning' | 'info' | 'pass';
    title: string;
    description: string;
    recommendation: string;
    fixSnippet?: string;
  }>;
  createdAt?: string;
}

export interface SiteCrawlSummary {
  totalUrls: number;
  averageScore: number;
  siteGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalCritical: number;
  totalWarning: number;
  totalPassed: number;
}

export interface CrawledPageData {
  path: string;
  pageType: string;
  productName?: string;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  title?: string;
  description?: string;
  issuesCount: {
    critical: number;
    warning: number;
    passed: number;
  };
  issues?: any[];
  beforeScore?: number;
  afterScore?: number;
  issuesFixed?: number;
}

export const seoApi = {
  getSettings: () => apiRequest<{ success: boolean; settings: SeoSettingsData }>("/seo/settings"),
  updateSettings: (data: Partial<SeoSettingsData>) =>
    apiRequest<{ success: boolean; message: string; settings: SeoSettingsData }>("/seo/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getPages: () => apiRequest<{ success: boolean; pages: SeoPageOverrideData[] }>("/seo/pages"),
  upsertPage: (data: Partial<SeoPageOverrideData>) =>
    apiRequest<{ success: boolean; message: string; override: SeoPageOverrideData }>("/seo/pages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deletePage: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/seo/pages/${id}`, {
      method: "DELETE",
    }),
  getRedirects: () => apiRequest<{ success: boolean; redirects: SeoRedirectData[] }>("/seo/redirects"),
  createRedirect: (data: { source: string; destination: string; permanent?: boolean }) =>
    apiRequest<{ success: boolean; message: string; redirect: SeoRedirectData }>("/seo/redirects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteRedirect: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/seo/redirects/${id}`, {
      method: "DELETE",
    }),
  toggleRedirect: (id: string) =>
    apiRequest<{ success: boolean; message: string; redirect: SeoRedirectData }>(`/seo/redirects/${id}/toggle`, {
      method: "PATCH",
    }),
  getSitemap: () =>
    apiRequest<{ success: boolean; count: number; urls: Array<{ url: string; priority: number; changefreq: string; lastmod: string }> }>("/seo/sitemap"),
  getRobots: () => apiRequest<{ success: boolean; isCustom: boolean; content: string }>("/seo/robots"),
  runAudit: (url: string, targetKeyword?: string) =>
    apiRequest<{ success: boolean; report: SeoAuditReportData }>("/seo/audit", {
      method: "POST",
      body: JSON.stringify({ url, targetKeyword }),
    }),
  autoFix: (url: string) =>
    apiRequest<{ success: boolean; message: string; score: number; grade: string; report: SeoAuditReportData; override: SeoPageOverrideData }>("/seo/auto-fix", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  autoFixAll: () =>
    apiRequest<{ success: boolean; count: number; message: string }>("/seo/auto-fix-all", {
      method: "POST",
    }),
  crawlSiteAudit: () =>
    apiRequest<{
      success: boolean;
      summary: SiteCrawlSummary;
      report: SeoAuditReportData;
      pages: CrawledPageData[];
    }>("/seo/crawl-audit", { method: "POST" }),
  crawlAndFixSite: () =>
    apiRequest<{
      success: boolean;
      count: number;
      beforeAverageScore: number;
      afterAverageScore: number;
      message: string;
      report: SeoAuditReportData;
      pages: CrawledPageData[];
    }>("/seo/crawl-and-fix", { method: "POST" }),
  runGeoAudit: (url: string, topicEntity?: string) =>
    apiRequest<{ success: boolean; report: SeoAuditReportData }>("/seo/geo-audit", {
      method: "POST",
      body: JSON.stringify({ url, topicEntity }),
    }),
  generateCopy: (payload: { contentType: string; topic: string; keywords?: string[]; tone?: string }) =>
    apiRequest<{ success: boolean; topic: string; contentType: string; generated: any; message: string }>("/seo/copywrite", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getReports: (limit?: number, type?: string) =>
    apiRequest<{ success: boolean; count: number; reports: SeoAuditReportData[] }>(
      `/seo/reports?limit=${limit || 30}${type ? `&type=${type}` : ""}`
    ),
  deleteReport: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/seo/reports/${id}`, {
      method: "DELETE",
    }),
};

// =========================================================================
// GENESIS ARCHITECTURE PAGE CMS API & TYPES
// =========================================================================
export interface GenesisConfigData {
  isEnabled: boolean;
  pageTitle: string;
  pageDescription: string;
  
  hero: {
    image: string;
    headline: string;
    copyBlock1: string[];
    copyBlock2: string[];
    metaLines: string[];
    systemCode: string;
  };

  about: {
    logoFill: string;
    paragraph1: string;
    paragraph2: string;
  };

  spotlightMatrix: {
    col1: string[];
    col2: string[];
    col3: string[];
    col4: string[];
    col5: string[];
  };

  textBlock: {
    heading: string;
    logoFill: string;
    paragraph1: string;
    paragraph2: string;
  };

  settings: {
    showContactForm: boolean;
    showFooter: boolean;
    showSpotlightZoom: boolean;
  };
}

export const DEFAULT_GENESIS_CONFIG: GenesisConfigData = {
  isEnabled: true,
  pageTitle: "GENESIS • The Origin Architecture — Drapza Atelier",
  pageDescription: "The design philosophy, signal over surplus, and genesis behind what you wear.",
  
  hero: {
    image: "/genesis/hero.jpg",
    headline: "The Genesis behind what you wear",
    copyBlock1: [
      "Signal over surplus,",
      "Fragments of identity,",
      "Minimal by necessity."
    ],
    copyBlock2: [
      "We design future forms,",
      "Built for the now."
    ],
    metaLines: [
      "We create frameworks,",
      "For the unnamed future,",
      "A study in silhouette."
    ],
    systemCode: "[ SYS/DRAPZA/0001 ]"
  },

  about: {
    logoFill: "#0f0f0f",
    paragraph1: "Drapza is built on the belief that clothing should operate like a system. Every piece is engineered with intention, shaped by visual logic and designed for a new kind of uniform. We define motion, structure in silence, presence without noise.",
    paragraph2: "Our aesthetic roots lie in the future, not the past. We create garments that behave like interfaces: minimal, intelligent, quietly expressive. Function and form are synchronized, tailored for those who move through digital and physical layers with equal precision. Drapza is not fashion. It is a transmission."
  },

  spotlightMatrix: {
    col1: [
      "/spotlight/spotlight_img_03.jpg",
      "/spotlight/spotlight_img_06.jpg",
      "/spotlight/spotlight_img_09.jpg"
    ],
    col2: [
      "/spotlight/spotlight_img_01.jpg",
      "/spotlight/spotlight_img_04.jpg",
      "/spotlight/spotlight_img_07.jpg"
    ],
    col3: [
      "/spotlight/spotlight_img_02.jpg",
      "/spotlight/spotlight_img_05.jpg",
      "/spotlight/spotlight_img_08.jpg"
    ],
    col4: [
      "/spotlight/spotlight_img_03.jpg",
      "/spotlight/spotlight_img_06.jpg",
      "/spotlight/spotlight_img_09.jpg"
    ],
    col5: [
      "/spotlight/spotlight_img_01.jpg",
      "/spotlight/spotlight_img_04.jpg",
      "/spotlight/spotlight_img_07.jpg"
    ]
  },

  textBlock: {
    heading: "Designed absence, engineered silence.",
    logoFill: "#edf1e8",
    paragraph1: "Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.",
    paragraph2: "No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who exit the frame."
  },

  settings: {
    showContactForm: true,
    showFooter: true,
    showSpotlightZoom: true
  }
};

export type GenesisApiResponse = GenesisConfigData & {
  success: boolean;
  message?: string;
  data?: GenesisConfigData;
};

export const genesisApi = {
  getConfig: () => apiRequest<GenesisApiResponse>("/genesis-config"),
  updateConfig: (data: Partial<GenesisConfigData>) =>
    apiRequest<GenesisApiResponse>("/genesis-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadImage: (base64Image: string) =>
    apiRequest<{ success: boolean; url: string; message?: string }>("/genesis-config/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    }),
  resetConfig: () =>
    apiRequest<GenesisApiResponse>("/genesis-config/reset", {
      method: "POST",
    }),
};

// =========================================================================
// WHATSAPP FLOATING BUTTON CMS API & TYPES
// =========================================================================
export interface WhatsAppButtonConfigData {
  isEnabled: boolean;
  phoneNumber: string;
  buttonText: string;
  prefilledMessage: string;
  backgroundColor: string;
  textColor: string;
  hoverBackgroundColor: string;
  position: "bottom-right" | "bottom-left";
  bottomOffset: string;
  sideOffset: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  tooltip: string;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppButtonConfigData = {
  isEnabled: true,
  phoneNumber: "918888333038",
  buttonText: "MESSAGE US",
  prefilledMessage: "Hello Drapza Atelier Support, I would like to inquire about...",
  backgroundColor: "#25d366",
  textColor: "#ffffff",
  hoverBackgroundColor: "#1ebe5d",
  position: "bottom-right",
  bottomOffset: "6.25rem",
  sideOffset: "2rem",
  showOnMobile: true,
  showOnDesktop: true,
  tooltip: "Chat with Drapza Atelier Support on WhatsApp",
};

export type WhatsAppApiResponse = WhatsAppButtonConfigData & {
  success: boolean;
  message?: string;
  data?: WhatsAppButtonConfigData;
};

export const whatsAppApi = {
  getConfig: () => apiRequest<WhatsAppApiResponse>("/whatsapp-config"),
  updateConfig: (data: Partial<WhatsAppButtonConfigData>) =>
    apiRequest<WhatsAppApiResponse>("/whatsapp-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetConfig: () =>
    apiRequest<WhatsAppApiResponse>("/whatsapp-config/reset", {
      method: "POST",
    }),
};

export interface MembershipPlanData {
  _id: string;
  name: string;
  slug: string;
  durationMonths: number;
  durationDays: number;
  price: number;
  discountPercent: number;
  benefits: string[];
  eligibleCategories: string[];
  badge: string;
  badgeColor?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UserMembershipData {
  subscriptionId: string;
  planName: string;
  discountPercent: number;
  badge: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  benefits: string[];
  source?: string;
  storeCode?: string;
}

export interface QrCampaignData {
  _id: string;
  code: string;
  name: string;
  storeLocation: string;
  campaignTag: string;
  targetUrl: string;
  scansCount: number;
  conversionsCount: number;
  isActive: boolean;
  notes?: string;
}

export const membershipApi = {
  getPlans: () =>
    apiRequest<{ success: boolean; count: number; plans: MembershipPlanData[] }>("/membership/plans"),
  getMyMembership: () =>
    apiRequest<{
      success: boolean;
      hasActiveMembership: boolean;
      membership: UserMembershipData | null;
      history: any[];
    }>("/membership/my-membership"),
  createOrder: (payload: { planId: string; gateway?: string; storeCode?: string; source?: string }) =>
    apiRequest<{
      success: boolean;
      gateway: string;
      orderId?: string;
      paymentSessionId?: string;
      amount: number;
      currency: string;
      keyId?: string;
      cfEnv?: string;
      plan: any;
    }>("/membership/create-order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyPayment: (payload: any) =>
    apiRequest<{
      success: boolean;
      message: string;
      subscription: any;
    }>("/membership/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recordQrScan: (code: string) =>
    apiRequest<{ success: boolean }>("/membership/record-qr-scan", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  // Admin Methods
  getAdminPlans: () =>
    apiRequest<{ success: boolean; count: number; plans: MembershipPlanData[] }>("/membership/admin/plans"),
  createAdminPlan: (data: Partial<MembershipPlanData>) =>
    apiRequest<{ success: boolean; message: string; plan: MembershipPlanData }>("/membership/admin/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAdminPlan: (id: string, data: Partial<MembershipPlanData>) =>
    apiRequest<{ success: boolean; message: string; plan: MembershipPlanData }>(`/membership/admin/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAdminPlan: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/membership/admin/plans/${id}`, {
      method: "DELETE",
    }),
  getAdminSubscriptions: (params?: Record<string, any>) => {
    const q = new URLSearchParams(params || {}).toString();
    return apiRequest<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      subscriptions: any[];
    }>(`/membership/admin/subscriptions${q ? `?${q}` : ""}`);
  },
  grantAdminMembership: (payload: {
    email: string;
    name?: string;
    phone?: string;
    planId: string;
    amountPaid?: number;
    paymentMethod?: string;
    paymentId?: string;
    startDate?: string;
    durationDaysOverride?: number;
    notes?: string;
  }) =>
    apiRequest<{ success: boolean; message: string; subscription: any }>("/membership/admin/grant", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAdminSubscription: (id: string, payload: Record<string, any>) =>
    apiRequest<{ success: boolean; message: string; subscription: any }>(`/membership/admin/subscriptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAdminSubscription: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/membership/admin/subscriptions/${id}`, {
      method: "DELETE",
    }),
  revokeAdminMembership: (id: string, reason?: string) =>
    apiRequest<{ success: boolean; message: string }>(`/membership/admin/revoke/${id}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getAdminStats: () =>
    apiRequest<{
      success: boolean;
      stats: {
        activeCount: number;
        totalSubscribers: number;
        expiredCount: number;
        totalRevenue: number;
        inStoreQrCount: number;
        onlineCount: number;
        planBreakdown: any[];
      };
    }>("/membership/admin/stats"),
  getAdminQrCampaigns: () =>
    apiRequest<{ success: boolean; count: number; campaigns: QrCampaignData[] }>("/membership/admin/qr-campaigns"),
  createOrUpdateQrCampaign: (data: Partial<QrCampaignData>) =>
    apiRequest<{ success: boolean; message: string; campaign: QrCampaignData }>("/membership/admin/qr-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteQrCampaign: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/membership/admin/qr-campaigns/${id}`, {
      method: "DELETE",
    }),
};



