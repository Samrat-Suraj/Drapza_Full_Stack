import mongoose, { Schema, Document } from 'mongoose';

export interface ISeoSettings extends Document {
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string[];
  canonicalBaseUrl: string;
  ogImage: string;
  twitterHandle: string;
  twitterCardType: string;
  verification: {
    google?: string;
    bing?: string;
    yandex?: string;
    pinterest?: string;
  };
  robotsDirectives: {
    index: boolean;
    follow: boolean;
    noarchive: boolean;
    nosnippet: boolean;
    maxImagePreview: string;
  };
  aiCrawlerRules: {
    allowGptBot: boolean;
    allowClaudeBot: boolean;
    allowPerplexityBot: boolean;
    allowGoogleExtended: boolean;
    allowCcBot: boolean;
  };
  customRobotsTxt?: string;
  updatedAt: Date;
}

const seoSettingsSchema = new Schema<ISeoSettings>(
  {
    siteName: { type: String, default: 'Drapza' },
    titleTemplate: { type: String, default: '%s • DRAPZA Atelier Luxury Modular Streetwear' },
    defaultDescription: {
      type: String,
      default:
        'DRAPZA — Modular outerwear engineered for the urban climate. Architectural silhouettes, 480 GSM French Terry, and limited bespoke capsules.',
    },
    defaultKeywords: {
      type: [String],
      default: ['luxury streetwear', 'modular outerwear', 'architectural drape', 'drapza', 'techwear', 'fashion atelier'],
    },
    canonicalBaseUrl: { type: String, default: 'https://drapza.com' },
    ogImage: { type: String, default: '/images/drapza/home/hero.png' },
    twitterHandle: { type: String, default: '@drapza' },
    twitterCardType: { type: String, default: 'summary_large_image' },
    verification: {
      google: { type: String, default: '' },
      bing: { type: String, default: '' },
      yandex: { type: String, default: '' },
      pinterest: { type: String, default: '' },
    },
    robotsDirectives: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
      noarchive: { type: Boolean, default: false },
      nosnippet: { type: Boolean, default: false },
      maxImagePreview: { type: String, default: 'large' },
    },
    aiCrawlerRules: {
      allowGptBot: { type: Boolean, default: true },
      allowClaudeBot: { type: Boolean, default: true },
      allowPerplexityBot: { type: Boolean, default: true },
      allowGoogleExtended: { type: Boolean, default: true },
      allowCcBot: { type: Boolean, default: false },
    },
    customRobotsTxt: { type: String, default: '' },
  },
  { timestamps: true }
);

export interface ISeoPageOverride extends Document {
  path: string;
  pageType: 'home' | 'product' | 'collection' | 'lookbook' | 'page' | 'article';
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  customJsonLd?: string;
  focusKeywords?: string[];
  notes?: string;
  updatedAt: Date;
}

const seoPageOverrideSchema = new Schema<ISeoPageOverride>(
  {
    path: { type: String, required: true, unique: true, trim: true },
    pageType: {
      type: String,
      enum: ['home', 'product', 'collection', 'lookbook', 'page', 'article'],
      default: 'page',
    },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    robots: { type: String, default: 'index, follow' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    customJsonLd: { type: String, default: '' },
    focusKeywords: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export interface ISeoRedirect extends Document {
  source: string;
  destination: string;
  permanent: boolean;
  isActive: boolean;
  hits: number;
  lastHitAt?: Date;
  updatedAt: Date;
}

const seoRedirectSchema = new Schema<ISeoRedirect>(
  {
    source: { type: String, required: true, unique: true, trim: true },
    destination: { type: String, required: true, trim: true },
    permanent: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    hits: { type: Number, default: 0 },
    lastHitAt: { type: Date },
  },
  { timestamps: true }
);

export interface ISeoAuditReport extends Document {
  url: string;
  auditType: 'seo' | 'geo' | 'technical';
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issuesCount: {
    critical: number;
    warning: number;
    info: number;
    passed: number;
  };
  metrics: Record<string, any>;
  issues: Array<{
    id: string;
    category: string;
    severity: 'critical' | 'warning' | 'info' | 'pass';
    title: string;
    description: string;
    recommendation: string;
    fixSnippet?: string;
  }>;
  createdAt: Date;
}

const seoAuditReportSchema = new Schema<ISeoAuditReport>(
  {
    url: { type: String, required: true },
    auditType: { type: String, enum: ['seo', 'geo', 'technical'], default: 'seo' },
    score: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, enum: ['A+', 'A', 'B', 'C', 'D', 'F'], default: 'B' },
    issuesCount: {
      critical: { type: Number, default: 0 },
      warning: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
    },
    metrics: { type: Schema.Types.Mixed, default: {} },
    issues: [
      {
        id: { type: String },
        category: { type: String },
        severity: { type: String, enum: ['critical', 'warning', 'info', 'pass'] },
        title: { type: String },
        description: { type: String },
        recommendation: { type: String },
        fixSnippet: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const SeoSettings = mongoose.model<ISeoSettings>('SeoSettings', seoSettingsSchema);
export const SeoPageOverride = mongoose.model<ISeoPageOverride>('SeoPageOverride', seoPageOverrideSchema);
export const SeoRedirect = mongoose.model<ISeoRedirect>('SeoRedirect', seoRedirectSchema);
export const SeoAuditReport = mongoose.model<ISeoAuditReport>('SeoAuditReport', seoAuditReportSchema);
