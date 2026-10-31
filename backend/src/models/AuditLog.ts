import mongoose, { Schema, Document } from 'mongoose';

export interface IRouteHit {
  path: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: Date;
  threatDetected?: boolean;
}

export interface IThreatFlag {
  type: string;
  reason: string;
  path?: string;
  ip?: string;
  detectedAt: Date;
}

export interface IAuditSession extends Document {
  sessionId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  userAgent?: string;
  device: string;
  browser: string;
  os: string;
  loginAt: Date;
  lastActiveAt: Date;
  logoutAt?: Date;
  durationSeconds: number;
  isOnline: boolean;
  status: 'ACTIVE' | 'TERMINATED_USER' | 'TERMINATED_ADMIN' | 'EXPIRED';
  riskLevel: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  threatFlags: IThreatFlag[];
  routeHitsCount: number;
  routeHits: IRouteHit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBannedIp extends Document {
  ip: string;
  reason: string;
  threatType: string;
  bannedBy: string;
  bannedAt: Date;
}

const routeHitSchema = new Schema<IRouteHit>(
  {
    path: { type: String, required: true },
    method: { type: String, required: true, default: 'GET' },
    statusCode: { type: Number, required: true, default: 200 },
    latencyMs: { type: Number, default: 45 },
    timestamp: { type: Date, default: Date.now },
    threatDetected: { type: Boolean, default: false },
  },
  { _id: false }
);

const threatFlagSchema = new Schema<IThreatFlag>(
  {
    type: { type: String, required: true },
    reason: { type: String, required: true },
    path: { type: String, default: '' },
    ip: { type: String, default: '' },
    detectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auditSessionSchema = new Schema<IAuditSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: 'Guest Client' },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: 'client' },
    ip: { type: String, required: true },
    city: { type: String, default: 'New Delhi' },
    region: { type: String, default: 'Delhi' },
    country: { type: String, default: 'India' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Chrome' },
    os: { type: String, default: 'Windows' },
    loginAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    logoutAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 120 },
    isOnline: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'TERMINATED_USER', 'TERMINATED_ADMIN', 'EXPIRED'],
      default: 'ACTIVE',
    },
    riskLevel: {
      type: String,
      enum: ['SAFE', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'SAFE',
    },
    riskScore: { type: Number, default: 0 },
    threatFlags: [threatFlagSchema],
    routeHitsCount: { type: Number, default: 0 },
    routeHits: [routeHitSchema],
  },
  { timestamps: true }
);

const bannedIpSchema = new Schema<IBannedIp>(
  {
    ip: { type: String, required: true, unique: true },
    reason: { type: String, default: 'Suspicious payload patterns detected' },
    threatType: { type: String, default: 'RATE_LIMIT_EXCEEDED' },
    bannedBy: { type: String, default: 'System Security Engine' },
    bannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AuditSession =
  (mongoose.models.AuditSession as mongoose.Model<IAuditSession>) ||
  mongoose.model<IAuditSession>('AuditSession', auditSessionSchema);
export const BannedIp =
  (mongoose.models.BannedIp as mongoose.Model<IBannedIp>) ||
  mongoose.model<IBannedIp>('BannedIp', bannedIpSchema);
