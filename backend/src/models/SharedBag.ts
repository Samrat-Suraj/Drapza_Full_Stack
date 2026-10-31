import mongoose, { Schema } from 'mongoose';
import { ISharedBag } from '../types';

const sharedBagItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    cartItemId: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Schema.Types.Mixed,
      default: 0,
      set: (v: any) => {
        if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0;
        if (!v) return 0;
        const parsed = parseFloat(String(v).replace(/[^\d.]/g, ''));
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      },
    },
    selectedSize: {
      type: String,
      default: 'M',
    },
    color: {
      type: String,
      default: 'Black',
    },
    image: {
      type: String,
      default: '/products/product_1.png',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    bogoTier: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const sharedBagSchema = new Schema<ISharedBag>(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sharerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [sharedBagItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'Shared bag must contain at least one item.'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCount: {
      type: Number,
      required: true,
      min: 1,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true }
);

export const SharedBag = mongoose.model<ISharedBag>('SharedBag', sharedBagSchema);
