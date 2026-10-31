import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    numericPrice: {
      type: Number,
      default: function(this: any) { return this.price; }
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountTagActive: {
      type: Boolean,
      default: false,
    },
    offerTag: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'Black',
    },
    colors: {
      type: [String],
      default: ['#1b1b1b'],
    },
    colorImages: {
      type: [{ color: String, images: [String] }],
      default: [],
    },
    category: {
      type: String,
      default: 'Kurti',
    },
    tag: {
      type: String,
      default: 'Deform',
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL'],
    },
    description: {
      type: String,
      default: '',
    },
    detailTitle: {
      type: String,
      default: 'Tactile Architecture',
    },
    details: {
      type: String,
      default: '',
    },
    detailsImage: {
      type: String,
      default: '',
    },
    image_url: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    weight: {
      type: String,
      default: '380 GSM',
    },
    blend: {
      type: String,
      default: '100% Organic Combed Cotton',
    },
    cut: {
      type: String,
      default: 'Architectural Boxy / Drop Shoulder',
    },
    accentBadge: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isSpotlight: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 25,
    },
    local_index: {
      type: Number,
      default: 1,
    },
    specifications: {
      type: String,
      default: 'Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.',
    },
    specificationsImage: {
      type: String,
      default: '',
    },
    shippingTerms: {
      type: String,
      default: 'All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days.',
    },
    shippingTermsImage: {
      type: String,
      default: '',
    },
    showSpecifications: {
      type: Boolean,
      default: true,
    },
    showShippingTerms: {
      type: Boolean,
      default: true,
    },
    showParallelForms: {
      type: Boolean,
      default: true,
    },
    showReviews: {
      type: Boolean,
      default: true,
    },
    allowAddToCart: {
      type: Boolean,
      default: true,
    },
    badge: {
      type: String,
      default: 'Best Seller',
    },
    stockCount: {
      type: Number,
      default: 25,
    },
  },
  { timestamps: true, strict: false }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
