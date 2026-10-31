import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMembershipPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  durationMonths: number;
  durationDays: number;
  price: number;
  discountPercent: number;
  benefits: string[];
  eligibleCategories: string[];
  eligibleProducts: Types.ObjectId[];
  badge: string;
  badgeColor?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembershipSubscription extends Document {
  _id: Types.ObjectId;
  subscriptionId: string;
  user: Types.ObjectId;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  plan: Types.ObjectId;
  planName: string;
  planSlug: string;
  durationDays: number;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  amountPaid: number;
  paymentMethod:
    | 'RAZORPAY'
    | 'CASHFREE'
    | 'IN_STORE_CASH'
    | 'MANUAL_ADMIN'
    | 'DEMO'
    | 'GPAY'
    | 'PHONEPE'
    | 'PAYTM'
    | 'UPI'
    | 'CASH'
    | 'BANK_TRANSFER'
    | string;
  paymentId: string;
  gatewayOrderId: string;
  source: 'ONLINE' | 'QR_IN_STORE' | 'ADMIN_MANUAL';
  storeCode: string;
  notes?: string;
  cancelledAt?: Date | null;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembershipQRCode extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  storeLocation: string;
  campaignTag: string;
  targetUrl: string;
  scansCount: number;
  conversionsCount: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 1. Membership Plan Schema
const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, required: true, min: 1, max: 90 },
    benefits: { type: [String], default: [] },
    eligibleCategories: { type: [String], default: [] },
    eligibleProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    badge: { type: String, default: 'VIP' },
    badgeColor: { type: String, default: '#000000' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2. Membership Subscription Schema
const membershipSubscriptionSchema = new Schema<IMembershipSubscription>(
  {
    subscriptionId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, default: '' },
    },
    plan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    planName: { type: String, required: true },
    planSlug: { type: String, required: true },
    durationDays: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
      default: 'ACTIVE',
      index: true,
    },
    amountPaid: { type: Number, required: true },
    paymentMethod: {
      type: String,
      default: 'MANUAL_ADMIN',
    },
    paymentId: { type: String, default: '', index: true },
    gatewayOrderId: { type: String, default: '', index: true },
    source: {
      type: String,
      enum: ['ONLINE', 'QR_IN_STORE', 'ADMIN_MANUAL'],
      default: 'ONLINE',
    },
    storeCode: { type: String, default: 'FLAGSHIP_STORE' },
    notes: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// 3. QR Code Campaign Schema
const membershipQRCodeSchema = new Schema<IMembershipQRCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    storeLocation: { type: String, default: 'Flagship Atelier' },
    campaignTag: { type: String, default: 'IN_STORE_RETAIL' },
    targetUrl: { type: String, required: true },
    scansCount: { type: Number, default: 0 },
    conversionsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', membershipPlanSchema);
export const MembershipSubscription = mongoose.model<IMembershipSubscription>(
  'MembershipSubscription',
  membershipSubscriptionSchema
);
export const MembershipQRCode = mongoose.model<IMembershipQRCode>('MembershipQRCode', membershipQRCodeSchema);

