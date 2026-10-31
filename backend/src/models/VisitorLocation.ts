import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorLocation extends Document {
  ip: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
  precisionType: 'GPS_HIGH_ACCURACY' | 'IP_APPROXIMATE';
  sessionId?: string;
  userType: 'guest' | 'registered';
  userName?: string;
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitorLocationSchema = new Schema<IVisitorLocation>(
  {
    ip: {
      type: String,
      required: true,
      default: '127.0.0.1',
    },
    latitude: {
      type: Number,
      required: true,
      default: 28.6139,
    },
    longitude: {
      type: Number,
      required: true,
      default: 77.2090,
    },
    accuracy: {
      type: Number,
      default: 15,
    },
    city: {
      type: String,
      default: 'New Delhi',
    },
    state: {
      type: String,
      default: 'Delhi',
    },
    postalCode: {
      type: String,
      default: '110001',
    },
    country: {
      type: String,
      default: 'India',
    },
    formattedAddress: {
      type: String,
      default: '',
    },
    precisionType: {
      type: String,
      enum: ['GPS_HIGH_ACCURACY', 'IP_APPROXIMATE'],
      default: 'IP_APPROXIMATE',
    },
    sessionId: {
      type: String,
      default: '',
    },
    userType: {
      type: String,
      enum: ['guest', 'registered'],
      default: 'guest',
    },
    userName: {
      type: String,
      default: 'Anonymous Guest',
    },
    userEmail: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const VisitorLocation =
  (mongoose.models.VisitorLocation as mongoose.Model<IVisitorLocation>) ||
  mongoose.model<IVisitorLocation>('VisitorLocation', visitorLocationSchema);
