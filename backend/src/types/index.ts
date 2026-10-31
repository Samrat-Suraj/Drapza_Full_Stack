import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'member' | 'admin';
  tier: string;
  memberSince: number;
  phone?: string;
  balance?: number;
  gender?: string;
  dob?: string;
  isVerified: boolean;
  isBlocked?: boolean;
  isDisabled?: boolean;
  tokenVersion?: number;
  lastSessionTerminatedAt?: Date;
  otp?: string | null;
  otpExpires?: Date | null;
  googleId?: string;
  avatar?: string | any;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  numericPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  discountTagActive?: boolean;
  offerTag?: string;
  color: string;
  colors?: string[];
  colorImages?: Array<{ color: string; images: string[] }>;
  category?: string;
  tag: string;
  sizes: string[];
  description: string;
  detailTitle?: string;
  details?: string;
  detailsImage?: string;
  image_url: string;
  images: string[];
  weight?: string;
  blend?: string;
  cut?: string;
  accentBadge?: string;
  isFeatured?: boolean;
  isSpotlight?: boolean;
  inStock: boolean;
  stock?: number;
  local_index?: number;
  specifications?: string;
  specificationsImage?: string;
  shippingTerms?: string;
  shippingTermsImage?: string;
  showSpecifications?: boolean;
  showShippingTerms?: boolean;
  showParallelForms?: boolean;
  showReviews?: boolean;
  allowAddToCart?: boolean;
  badge?: string;
  stockCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product?: Types.ObjectId;
  name: string;
  price: number;
  originalPrice?: number;
  bogoTier?: any;
  bundleTag?: string;
  quantity: number;
  selectedSize?: string;
  color?: string;
  image?: string;
}

export interface IOrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface IOrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressId?: Types.ObjectId | string;
  addressType?: string;
  houseFlat?: string;
  streetArea?: string;
  landmark?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderId: string;
  user?: Types.ObjectId;
  customer: IOrderCustomer;
  address: IOrderAddress;
  items: IOrderItem[];
  total: number;
  tax?: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'TAILORING' | 'QUALITY_CHECK' | 'DISPATCHED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string;
  codFee?: number;
  paymentDetails?: Record<string, any>;
  trackingRef: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId | null;
  fullName?: string;
  firstName: string;
  lastName: string;
  phone: string;
  houseFlat?: string;
  streetArea?: string;
  landmark?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: 'Home' | 'Office' | 'Work' | 'Other' | string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface IAppointmentMeasurements {
  heightCm?: number;
  weightKg?: number;
  chestInches?: number;
  waistInches?: number;
  hipsInches?: number;
  shoulderInches?: number;
  inseamInches?: number;
  fitPreference?: 'bespoke' | 'boxy' | 'oversized' | 'tapered' | 'fitted' | 'tailored' | 'relaxed' | string;
  customNotes?: string;
}

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  appointmentId: string;
  user?: Types.ObjectId | null;
  fullName: string;
  email: string;
  phone: string;
  appointmentType: 'atelier_visit' | 'home_fitting' | 'virtual_consultation';
  preferredDate: string;
  preferredTimeSlot: string;
  city?: string;
  address?: string;
  pincode?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number | string;
  measurements: IAppointmentMeasurements;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  assignedFitter?: string;
  adminNotes?: string;
  virtualMeetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnItem {
  product?: Types.ObjectId | string;
  name: string;
  size: string;
  color?: string;
  qty: number;
  price: number;
  reason: string;
  condition?: string;
}

export interface IReturnPickupAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface IReturnAuditLog {
  status: string;
  note?: string;
  updatedBy?: string;
  timestamp: Date;
}

export interface IReturn extends Document {
  _id: Types.ObjectId;
  returnId: string;
  orderId?: Types.ObjectId | string;
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  requestType: 'return' | 'exchange';
  exchangeSize?: string;
  items: IReturnItem[];
  pickupAddress: IReturnPickupAddress;
  status: 'pending_review' | 'approved' | 'pickup_scheduled' | 'received' | 'refunded' | 'rejected';
  refundAmount: number;
  refundMode?: string;
  adminNotes?: string;
  rejectionReason?: string;
  courierAwb?: string;
  courierPartner?: string;
  timeline: IReturnAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  cartItemId: string;
  product?: Types.ObjectId | string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  selectedSize?: string;
  color?: string;
  image?: string;
  quantity: number;
  bogoTier?: any;
  garmentSizes?: string[];
  addedAt?: Date;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId | null;
  guestId?: string | null;
  items: ICartItem[];
  totalCount: number;
  subtotal: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface ISharedBagItem {
  productId?: Types.ObjectId | string;
  cartItemId?: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  selectedSize: string;
  color: string;
  image: string;
  quantity: number;
  bogoTier?: any;
}

export interface ISharedBag extends Document {
  _id: Types.ObjectId;
  shareId: string;
  user?: Types.ObjectId | null;
  sharerName: string;
  items: ISharedBagItem[];
  totalAmount: number;
  totalCount: number;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}



