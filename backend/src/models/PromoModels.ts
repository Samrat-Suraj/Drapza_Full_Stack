import mongoose, { Schema, Document } from 'mongoose';

// Gift Card Model
export interface IGiftCard extends Document {
  code: string;
  initialBalance: number;
  currentBalance: number;
  status: 'Active' | 'Partially Used' | 'Used' | 'Expired' | 'Cancelled';
  theme?: string;
  isActive: boolean;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  assignedToEmail?: string;
  message?: string;
  deliveryOption?: 'now' | 'scheduled';
  scheduledDeliveryDate?: Date;
  isDelivered?: boolean;
  deliveredAt?: Date;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  expiryDate: Date;
  transactions: Array<{
    type: 'PURCHASE' | 'REDEMPTION' | 'EXPIRY' | 'ADMIN_ADJUSTMENT';
    amount: number;
    remainingBalance: number;
    orderId?: string;
    orderNumber?: string;
    description?: string;
    date: Date;
  }>;
  redeemedByEmail?: string;
  redeemedAt?: Date;
}

const giftCardSchema = new Schema<IGiftCard>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialBalance: { type: Number, required: true, min: 1 },
    currentBalance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Partially Used', 'Used', 'Expired', 'Cancelled'],
      default: 'Active',
    },
    theme: { type: String, default: 'midnight' },
    isActive: { type: Boolean, default: true },
    senderName: String,
    senderEmail: String,
    recipientName: String,
    recipientEmail: String,
    assignedToEmail: String,
    message: String,
    deliveryOption: { type: String, enum: ['now', 'scheduled'], default: 'now' },
    scheduledDeliveryDate: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    notes: String,
    cancelReason: String,
    cancelledAt: Date,
    expiryDate: { type: Date, required: true },
    transactions: [
      {
        type: { type: String, enum: ['PURCHASE', 'REDEMPTION', 'EXPIRY', 'ADMIN_ADJUSTMENT'], required: true },
        amount: { type: Number, required: true },
        remainingBalance: { type: Number, required: true },
        orderId: String,
        orderNumber: String,
        description: String,
        date: { type: Date, default: Date.now },
      },
    ],
    redeemedByEmail: String,
    redeemedAt: Date,
  },
  { timestamps: true }
);

export const GiftCard = mongoose.model<IGiftCard>('GiftCard', giftCardSchema);

// Coupon Model
export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  minOrderValue: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit: number;
  usageCount: number;
  startDate?: Date;
  expiryDate?: Date | null;
  isActive: boolean;
  applicableCategories: string[];
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: 1 },
    usageCount: { type: Number, default: 0 },
    startDate: Date,
    expiryDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: String }],
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

// Shop The Look / UGC Post Model
export interface IShopTheLookPost extends Document {
  imageUrl: string;
  caption: string;
  instagramHandle: string;
  likesCount: number;
  taggedProducts: Array<{
    product: mongoose.Types.ObjectId;
    positionX: number;
    positionY: number;
  }>;
  isActive: boolean;
  order: number;
}

const shopTheLookSchema = new Schema<IShopTheLookPost>(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    instagramHandle: { type: String, default: '@drapza' },
    likesCount: { type: Number, default: 0 },
    taggedProducts: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        positionX: { type: Number, default: 50 },
        positionY: { type: Number, default: 50 },
      },
    ],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ShopTheLookPost = mongoose.model<IShopTheLookPost>('ShopTheLookPost', shopTheLookSchema);
