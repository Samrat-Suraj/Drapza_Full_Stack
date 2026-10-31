import mongoose, { Schema } from 'mongoose';
import { IAppointment } from '../types';

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    appointmentType: {
      type: String,
      enum: ['atelier_visit', 'home_fitting', 'virtual_consultation'],
      default: 'atelier_visit',
      index: true,
    },
    preferredDate: {
      type: String,
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    productId: {
      type: String,
      default: '',
    },
    productName: {
      type: String,
      default: '',
    },
    productImage: {
      type: String,
      default: '',
    },
    productPrice: {
      type: Schema.Types.Mixed,
      default: '',
    },
    measurements: {
      heightCm: { type: Number },
      weightKg: { type: Number },
      chestInches: { type: Number },
      waistInches: { type: Number },
      hipsInches: { type: Number },
      shoulderInches: { type: Number },
      inseamInches: { type: Number },
      fitPreference: {
        type: String,
        default: 'bespoke',
      },
      customNotes: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    assignedFitter: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    virtualMeetingLink: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ email: 1, createdAt: -1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
