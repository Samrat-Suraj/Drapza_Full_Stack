import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketReply {
  reply: string;
  sender: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  name: string;
  email: string;
  orderRef?: string;
  topic: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'normal' | 'urgent';
  adminReplies: ITicketReply[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketReplySchema = new Schema<ITicketReply>(
  {
    reply: { type: String, required: true },
    sender: { type: String, default: 'Atelier Concierge' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    orderRef: {
      type: String,
      trim: true,
      default: '',
    },
    topic: {
      type: String,
      required: true,
      default: 'General Inquiry',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    adminReplies: [ticketReplySchema],
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
