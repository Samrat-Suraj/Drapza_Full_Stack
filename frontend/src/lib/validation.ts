import { z } from "zod";

// ==========================================
// 1. AUTHENTICATION & IDENTITY SCHEMAS
// ==========================================

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(100, "Password must not exceed 100 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z).")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z).")
  .regex(/[0-9]/, "Password must contain at least one number (0-9).")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g. !@#$%^&*).");

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full Name must be at least 2 characters.")
      .max(60, "Full Name must not exceed 60 characters."),
    email: z
      .string()
      .email("Please provide a valid email format (e.g. client@drapza.com)."),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Please acknowledge the Drapza Manifesto & Sizing Policy.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password verification keys do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address."),
  password: z
    .string()
    .min(1, "Access Password Key is required."),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(4, "Please enter at least 4 digits.")
    .max(8, "Security key must not exceed 8 digits.")
    .regex(/^\d+$/, "Security key must contain numbers only."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address to receive reset instructions."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current security password is required."),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation password do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

// ==========================================
// 2. CONCIERGE & SUPPORT FORM SCHEMAS
// ==========================================

export const contactConciergeSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .email("Valid email address required for response."),
  orderRef: z.string().optional(),
  topic: z.string().optional(),
  message: z
    .string()
    .min(5, "Inquiry message must contain at least 5 characters."),
});

// ==========================================
// 3. ADMIN PRODUCT REGISTRATION SCHEMA
// ==========================================

export const newProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Garment piece name is required.")
    .max(120, "Garment piece name cannot exceed 120 characters."),
  price: z.string().default("₹1,290"),
  numericPrice: z
    .number()
    .min(1, "Price must be greater than zero."),
  discountPrice: z.number().min(0).optional().default(0),
  discountPercentage: z.number().min(0).max(100).optional().default(0),
  discountTagActive: z.boolean().optional().default(false),
  offerTag: z.string().optional().default(""),
  category: z
    .string()
    .trim()
    .min(1, "Category is required."),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters.")
    .optional()
    .or(z.literal("")),
  stock: z
    .number()
    .min(0, "Stock cannot be negative.")
    .default(100),
  weight: z.string().default("480 GSM HEAVYWEIGHT FRENCH TERRY"),
  blend: z.string().default("100% COMBED ORGANIC COTTON"),
  cut: z.string().default("OVERSIZED DROP-SHOULDER ARCHETYPE"),
  colors: z.array(z.string()).min(1, "At least one color code required.").optional().or(z.string()),
  sizes: z.array(z.string()).min(1, "At least one size required.").optional().or(z.string()),
  images: z.array(z.string()).min(1, "At least one image required.").optional().or(z.string()),
});

export const adminProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Garment name must be at least 2 characters.")
    .max(120, "Garment name cannot exceed 120 characters."),
  numericPrice: z
    .number()
    .min(1, "Price must be greater than ₹0."),
  discountPrice: z.number().min(0).optional().default(0),
  discountPercentage: z.number().min(0).max(100).optional().default(0),
  category: z
    .string()
    .trim()
    .min(1, "Please select a garment category."),
  description: z
    .string()
    .trim()
    .min(5, "Product description must be at least 5 characters.")
    .optional()
    .or(z.literal("")),
  stock: z
    .number()
    .min(0, "Stock inventory cannot be negative.")
    .default(100),
});

export const adminCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters.")
    .max(30, "Coupon code cannot exceed 30 characters.")
    .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain letters, numbers, hyphens, and underscores."),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  discountType: z.enum(["percentage", "fixed"], {
    message: "Discount type must be percentage or fixed.",
  }),
  discountAmount: z
    .number()
    .min(1, "Discount amount must be greater than 0."),
  minOrderValue: z.number().min(0, "Minimum order requirement cannot be negative.").default(0),
  maxDiscountAmount: z.number().min(0).nullable().optional(),
  usageLimit: z.number().min(1).nullable().optional(),
  perUserLimit: z.number().min(1, "Per user limit must be at least 1.").default(1),
  startDate: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.discountType === "percentage" && data.discountAmount > 90) {
      return false;
    }
    return true;
  },
  {
    message: "Percentage discount cannot exceed 90%.",
    path: ["discountAmount"],
  }
);

// ==========================================
// 4. ORDER TRACKING & NEWSLETTER SCHEMAS
// ==========================================

export const trackOrderInputSchema = z.object({
  trackingRef: z
    .string()
    .min(3, "Please enter a valid Order ID or Tracking Reference."),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email signal (e.g. client@domain.com)."),
});

export const sizeFinderSchema = z.object({
  heightCm: z.number().min(140, "Minimum height is 140cm.").max(230, "Maximum height is 230cm."),
  fitType: z.enum(["boxy", "tapered", "oversized"]),
});

export const reviewSubmissionSchema = z.object({
  userName: z.string().trim().min(1, "Please enter your name."),
  userEmail: z.string().trim().email("Please provide a valid email address."),
  title: z.string().trim().min(2, "Please provide a headline for your review."),
  comment: z.string().trim().min(10, "Please write at least 10 characters describing the garment."),
  rating: z.number().min(1, "Please select a star rating.").max(5),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name must not exceed 50 characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(50, "Last name must not exceed 50 characters."),
  name: z
    .string()
    .min(2, "Full Name must be at least 2 characters.")
    .max(60, "Full Name must not exceed 60 characters.")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Please enter a valid 10-digit phone number.",
    }),
  gender: z
    .string()
    .min(1, "Please select your gender.")
    .refine((val) => ["male", "female", "other"].includes(val.toLowerCase()), {
      message: "Please select a valid gender option.",
    }),
  dob: z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .refine((val) => {
      if (!val || val === "DD / MM / YYYY") return false;
      const clean = val.replace(/\s+/g, "");
      const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        const d = parseInt(dmy[1], 10);
        const m = parseInt(dmy[2], 10);
        const y = parseInt(dmy[3], 10);
        const currentYear = new Date().getFullYear();
        return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= currentYear;
      }
      const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (ymd) {
        const y = parseInt(ymd[1], 10);
        const m = parseInt(ymd[2], 10);
        const d = parseInt(ymd[3], 10);
        const currentYear = new Date().getFullYear();
        return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= currentYear;
      }
      return false;
    }, {
      message: "Please enter a valid date of birth (e.g. 14 / 08 / 1998).",
    }),
});

export const profileAddressSchema = z.object({
  fullName: z.string().min(2, "Full Name is required for delivery."),
  phone: z.string().min(10, "10-digit phone number is required."),
  street: z.string().min(5, "Complete street address is required."),
  city: z.string().min(2, "City name is required."),
  state: z.string().min(2, "State name is required."),
  postalCode: z.string().min(6, "Valid 6-digit postal PIN code is required."),
  landmark: z.string().optional(),
  country: z.string().default("India"),
});

export const redeemGiftCardSchema = z.object({
  code: z
    .string()
    .min(3, "Gift card code must contain at least 3 characters.")
    .max(50, "Gift card code must not exceed 50 characters."),
});

export const appointmentBookingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full Name must be at least 2 characters.")
    .max(60, "Full Name must not exceed 60 characters."),
  email: z
    .string()
    .email("Please enter a valid email address for confirmation."),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{8,18}$/, "Please enter a valid phone number (10 digits)."),
  appointmentType: z.enum(["atelier_visit", "home_fitting", "virtual_consultation"]),
  preferredDate: z.string().min(1, "Please select an appointment date."),
  preferredTimeSlot: z.string().min(1, "Please select an appointment time slot."),
  city: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  chestInches: z.number().min(20).max(70).optional(),
  waistInches: z.number().min(20).max(70).optional(),
  hipsInches: z.number().min(20).max(70).optional(),
  shoulderInches: z.number().min(10).max(40).optional(),
  inseamInches: z.number().min(15).max(50).optional(),
  fitPreference: z.enum(["boxy", "tapered", "oversized", "bespoke"]).optional(),
  customNotes: z.string().max(1000).optional(),
});

// Helper function to extract friendly error message
export const getZodErrorMessage = (error: any): string => {
  if (!error) return "Invalid input.";
  const issues = error.issues || error.errors || [];
  return issues[0]?.message || "Input validation failed.";
};

// Helper function to extract field-by-field error map
export const getZodFieldErrors = (error: any): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!error) return result;
  const issues = error.issues || error.errors || [];
  issues.forEach((issue: any) => {
    const key = issue.path && issue.path.length > 0 ? String(issue.path[0]) : "general";
    if (!result[key]) {
      result[key] = issue.message;
    }
  });
  return result;
};

// ==========================================
// 5. SHIPPING & ADDRESS SCHEMAS
// ==========================================

export const shippingAddressModalSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .transform((val) => {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
      return digits;
    })
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit Indian mobile number.",
    }),
  addressType: z
    .enum(["Home", "Office", "Work", "Other", "home", "office", "work", "other"])
    .default("Home"),
  houseFlat: z.string().trim().optional().default(""),
  streetArea: z
    .string()
    .trim()
    .min(3, "Street / Area is required."),
  landmark: z.string().trim().optional(),
  city: z
    .string()
    .trim()
    .min(2, "City name is required."),
  state: z
    .string()
    .trim()
    .min(2, "State name is required."),
  pincode: z
    .string()
    .trim()
    .refine((val) => /^[1-9][0-9]{5}$/.test(val), {
      message: "Please enter a valid 6-digit Indian PIN code.",
    }),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutShippingDetailsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Please provide a valid email address."),
  phone: z
    .string()
    .trim()
    .transform((val) => {
      const digits = val.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
      return digits;
    })
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit Indian phone number.",
    }),
  address: z
    .string()
    .trim()
    .min(5, "Complete street address is required for delivery."),
  city: z
    .string()
    .trim()
    .min(2, "City is required."),
  pincode: z
    .string()
    .trim()
    .refine((val) => /^[1-9][0-9]{5}$/.test(val), {
      message: "Please enter a valid 6-digit Indian PIN code.",
    }),
  state: z
    .string()
    .trim()
    .min(2, "State is required."),
});

// ==========================================
// 6. ORDER SUMMARY COUPON CODE SCHEMA
// ==========================================

export const couponCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Please enter a valid coupon code (min 2 characters).")
    .max(30, "Coupon code cannot exceed 30 characters.")
    .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain letters, numbers, and hyphens."),
});

// ==========================================
// 7. LIGHTWEIGHT AUTH SCHEMAS (LoginPage)
// ==========================================

export const loginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required."),
});

export const registerCredentialsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter your name (at least 2 characters)."),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(4, "Please enter at least 4 digits.")
    .max(8, "Security key must not exceed 8 digits.")
    .regex(/^\d+$/, "Security key must contain numbers only."),
});

export const resetPasswordCredentialsSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .min(6, "Please enter the complete 6-digit verification code.")
      .max(6, "Verification code must be exactly 6 digits.")
      .regex(/^\d+$/, "Verification code must contain digits only."),
    password: z
      .string()
      .min(6, "New password must be at least 6 characters."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

// ==========================================
// 8. CUSTOMER SERVICE, RETURNS & UTILITY SCHEMAS
// ==========================================

export const orderCancellationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Please select or provide a cancellation reason."),
  customNotes: z.string().trim().max(500).optional(),
  email: z.string().trim().email("Valid email required.").optional().or(z.literal("")),
});

export const customerReturnSchema = z.object({
  orderRef: z
    .string()
    .trim()
    .min(3, "Order reference number is required."),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid 10-digit phone number."),
  street: z
    .string()
    .trim()
    .min(3, "Pickup street address is required."),
  city: z
    .string()
    .trim()
    .min(2, "City is required."),
  state: z
    .string()
    .trim()
    .min(2, "State is required."),
  pincode: z
    .string()
    .trim()
    .refine((val) => /^[1-9][0-9]{5}$/.test(val), {
      message: "Please enter a valid 6-digit PIN code.",
    }),
  requestType: z.enum(["return", "exchange"]),
});

export const pincodeSchema = z.object({
  pincode: z
    .string()
    .trim()
    .refine((val) => /^[1-9][0-9]{5}$/.test(val), {
      message: "Enter a valid 6-digit Indian PIN code.",
    }),
});

export const purchaseGiftCardSchema = z.object({
  amount: z
    .number()
    .min(100, "Gift card amount must be at least ₹100.")
    .max(50000, "Gift card amount cannot exceed ₹50,000."),
  recipientEmail: z
    .string()
    .trim()
    .email("Please provide a valid recipient email address."),
  customerPhone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length >= 10, {
      message: "Please enter a valid 10-digit phone number.",
    }),
  senderName: z.string().trim().optional(),
  senderEmail: z.string().trim().email("Please provide a valid sender email.").optional().or(z.literal("")),
  deliveryOption: z.enum(["now", "scheduled"]).default("now"),
  scheduledDate: z.string().optional(),
  message: z.string().trim().max(500).optional(),
});

