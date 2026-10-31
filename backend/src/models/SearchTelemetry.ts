import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISearchTelemetry extends Document {
  _id: Types.ObjectId;
  query: string;
  normalizedQuery: string;
  resultsCount: number;
  category?: string;
  source?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const searchTelemetrySchema = new Schema<ISearchTelemetry>(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedQuery: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    source: {
      type: String,
      default: 'web_search',
    },
    ip: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast group by and trend analysis
searchTelemetrySchema.index({ normalizedQuery: 1, createdAt: -1 });
searchTelemetrySchema.index({ resultsCount: 1, createdAt: -1 });

export const SearchTelemetry = mongoose.model<ISearchTelemetry>(
  'SearchTelemetry',
  searchTelemetrySchema
);
