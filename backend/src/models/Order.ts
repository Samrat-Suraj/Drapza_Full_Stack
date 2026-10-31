import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, default: '' },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        productId: { type: Schema.Types.Mixed, default: null },
        name: { type: String, required: true },
        price: {
          type: Number,
          required: true,
          default: 0,
          set: (v: any) => {
            if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0;
            if (!v) return 0;
            const parsed = parseFloat(String(v).replace(/[^\d.]/g, ''));
            return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
          },
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
        bogoTier: { type: Schema.Types.Mixed, default: null },
        bundleTag: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        selectedSize: { type: String, default: 'M' },
        color: { type: String, default: '' },
        image: { type: String, default: '' },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'TAILORING',
        'QUALITY_CHECK',
        'DISPATCHED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
        'REFUNDED',
      ],
      default: 'CONFIRMED',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      default: 'COD',
    },
    codFee: {
      type: Number,
      default: 0,
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
    trackingRef: {
      type: String,
      required: true,
      unique: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SYSTEM', ''],
      default: '',
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
