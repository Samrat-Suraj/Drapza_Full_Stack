import mongoose, { Schema, Document } from 'mongoose';

export interface IConfigDoc extends Document {
  key: string;
  data: any;
}

const configSchema = new Schema<IConfigDoc>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export const SiteConfig = mongoose.model<IConfigDoc>('SiteConfig', configSchema);
