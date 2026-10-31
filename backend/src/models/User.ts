import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [4, 'Password must be at least 4 characters'],
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: Schema.Types.Mixed,
      default: '',
    },
    provider: {
      type: String,
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'member', 'admin'],
      default: 'member',
    },
    tier: {
      type: String,
      default: 'INITIATE_V1',
    },
    memberSince: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    phone: {
      type: String,
      default: '',
    },
    balance: {
      type: Number,
      default: 38.0,
    },
    gender: {
      type: String,
      default: 'male',
    },
    dob: {
      type: String,
      default: '14 / 08 / 1998',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastSessionTerminatedAt: {
      type: Date,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
