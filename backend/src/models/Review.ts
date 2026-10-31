import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  fit?: 'runs_small' | 'true_to_size' | 'runs_large';
  qualityRating?: number;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  photos: string[];
  status: 'approved' | 'pending' | 'rejected';
  verifiedSize?: string;
  verifiedColor?: string;
  isFeatured: boolean;
  isPinned?: boolean;
  atelierResponse?: string;
  atelierRespondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
    },
    fit: {
      type: String,
      enum: ['runs_small', 'true_to_size', 'runs_large'],
      default: 'true_to_size',
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true,
    },
    verifiedSize: {
      type: String,
      default: '',
    },
    verifiedColor: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    atelierResponse: {
      type: String,
      default: '',
    },
    atelierRespondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
