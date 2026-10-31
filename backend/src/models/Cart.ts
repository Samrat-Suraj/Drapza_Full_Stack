import mongoose, { Schema } from 'mongoose';
import { ICart } from '../types';

const cartItemSchema = new Schema(
  {
    cartItemId: {
      type: String,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    slug: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    bogoTier: {
      type: Schema.Types.Mixed,
      default: null,
    },
    garmentSizes: {
      type: [String],
      default: [],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },
    guestId: {
      type: String,
      sparse: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate totalCount and subtotal
cartSchema.pre('save', function (next) {
  if (this.items && Array.isArray(this.items)) {
    this.totalCount = this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    this.subtotal = this.items.reduce(
      (sum, item) => sum + (parseFloat(String(item.price)) || 0) * (item.quantity || 1),
      0
    );
  } else {
    this.totalCount = 0;
    this.subtotal = 0;
  }
  next();
});

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
