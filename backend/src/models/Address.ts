import mongoose, { Schema } from 'mongoose';
import { IAddress } from '../types';

const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    houseFlat: {
      type: String,
      default: '',
      trim: true,
    },
    streetArea: {
      type: String,
      default: '',
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
    },
    addressType: {
      type: String,
      enum: ['Home', 'Office', 'Work', 'Other', 'HOME', 'OFFICE', 'WORK', 'OTHER'],
      default: 'Home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>('Address', addressSchema);
