import mongoose, { Schema } from 'mongoose';
import { IReturn } from '../types';

const returnItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.Mixed,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      default: 'M',
    },
    color: {
      type: String,
      default: '',
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    reason: {
      type: String,
      default: 'Size or fit preference',
    },
    condition: {
      type: String,
      default: 'Tags intact / Unworn',
    },
  },
  { _id: false }
);

const pickupAddressSchema = new Schema(
  {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const auditLogSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: String, default: 'Atelier Admin' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const returnSchema = new Schema<IReturn>(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.Mixed,
      default: null,
    },
    orderRef: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    requestType: {
      type: String,
      enum: ['return', 'exchange'],
      default: 'return',
      index: true,
    },
    exchangeSize: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [returnItemSchema],
      default: [],
    },
    pickupAddress: {
      type: pickupAddressSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'pickup_scheduled', 'received', 'refunded', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundMode: {
      type: String,
      default: 'original_source',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    courierAwb: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    courierPartner: {
      type: String,
      default: 'Delhivery Reverse Logistics',
      trim: true,
    },
    timeline: {
      type: [auditLogSchema],
      default: () => [
        {
          status: 'pending_review',
          note: 'Return dossier registered in Approval Vault',
          updatedBy: 'System / Customer',
          timestamp: new Date(),
        },
      ],
    },
  },
  { timestamps: true }
);

export const Return = mongoose.model<IReturn>('Return', returnSchema);
