import { Request, Response } from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { SiteConfig } from '../models/Config';
import { Ticket } from '../models/Ticket';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { env } from '../config/env';

// Email Transporter helper
const getTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT) || 465,
    secure: Boolean(env.SMTP_SECURE) || Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

// ─────────────────────────────────────────────────────────────
// 1. SHIPPING & COD CMS
// ─────────────────────────────────────────────────────────────

const DEFAULT_SHIPPING_CONFIG = {
  freeShippingThreshold: 1999,
  standardShippingFee: 150,
  expressShippingFee: 99,
  vipShippingFee: 350,
  codEnabled: true,
  codHandlingFee: 0,
  codMaxOrderValue: 0,
  blockedPincodes: [],
};

export const getShippingConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const configDoc = await SiteConfig.findOne({ key: 'shipping-config' });
    const config = configDoc?.data ? { ...DEFAULT_SHIPPING_CONFIG, ...configDoc.data } : DEFAULT_SHIPPING_CONFIG;
    res.status(200).json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateShippingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const existing = await SiteConfig.findOne({ key: 'shipping-config' });
    const merged = { ...DEFAULT_SHIPPING_CONFIG, ...(existing?.data || {}), ...incomingData };
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'shipping-config' },
      { key: 'shipping-config', data: merged },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: 'Shipping & COD configuration updated.', config: updated.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkPincode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pincode } = req.body;
    if (!pincode || String(pincode).trim().length !== 6) {
      res.status(400).json({
        success: false,
        serviceable: false,
        codAvailable: false,
        message: 'Please provide a valid 6-digit Indian PIN code.',
      });
      return;
    }

    const configDoc = await SiteConfig.findOne({ key: 'shipping-config' });
    const config = configDoc?.data ? { ...DEFAULT_SHIPPING_CONFIG, ...configDoc.data } : DEFAULT_SHIPPING_CONFIG;
    const cleanPin = String(pincode).trim();

    const isBlocked = (config.blockedPincodes || []).includes(cleanPin);
    if (isBlocked) {
      res.status(200).json({
        success: true,
        serviceable: false,
        codAvailable: false,
        freeShippingThreshold: config.freeShippingThreshold,
        standardShippingFee: config.standardShippingFee,
        message: 'Delivery is temporarily suspended for this PIN code due to regional logistics restrictions.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      serviceable: true,
      codAvailable: Boolean(config.codEnabled),
      freeShippingThreshold: config.freeShippingThreshold,
      standardShippingFee: config.standardShippingFee,
      message: 'PIN code verified. Express and Standard logistics dispatch available.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. WARDROBE FILTERS CMS
// ─────────────────────────────────────────────────────────────

const DEFAULT_FILTER_CONFIG = {
  categories: ['Kurti', 'Saree', 'Jeans', 'Palazzo/Bottom', 'Leggings', 'Tops', 'Dupatta', 'Co-ord Set', 'Sharara/Lehenga'],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'],
  colors: [
    { label: 'Crimson Red', hex: '#dc2626' },
    { label: 'Emerald Green', hex: '#059669' },
    { label: 'Midnight Blue', hex: '#1e3a8a' },
    { label: 'Sand Beige', hex: '#d6c7b2' },
    { label: 'Champagne Gold', hex: '#eab308' },
    { label: 'Obsidian Slate', hex: '#1e293b' },
    { label: 'Onyx Black', hex: '#000000' },
  ],
  fabrics: ['Modal Silk', 'Pure Chanderi', 'Georgette', 'Mulmul Cotton', 'French Terry', 'Raw Denim', 'Organza'],
  occasions: ['Runway & Gala', 'Casual Atelier', 'Festive Celebration', 'Summer Resort', 'Evening Noir'],
  availability: ['Ready to Ship in 24H', 'Pre-Order Only', 'Vault Exclusive', 'Made to Order'],
  hideOutOfStockOnStorefront: false,
};

export const getFilterConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const configDoc = await SiteConfig.findOne({ key: 'filter-config' });
    const data = configDoc?.data ? { ...DEFAULT_FILTER_CONFIG, ...configDoc.data } : DEFAULT_FILTER_CONFIG;
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFilterConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const existing = await SiteConfig.findOne({ key: 'filter-config' });
    const merged = { ...DEFAULT_FILTER_CONFIG, ...(existing?.data || {}), ...incomingData };
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'filter-config' },
      { key: 'filter-config', data: merged },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: 'Wardrobe filters updated.', data: updated.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetFilterConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'filter-config' },
      { key: 'filter-config', data: DEFAULT_FILTER_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Wardrobe filters reset to defaults.', data: updated.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. CONCIERGE & SUPPORT TICKETS
// ─────────────────────────────────────────────────────────────

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') query.status = status;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (search) {
      query.$or = [
        { ticketId: { $regex: String(search), $options: 'i' } },
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { orderRef: { $regex: String(search), $options: 'i' } },
        { topic: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total, allTickets] = await Promise.all([
      Ticket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Ticket.countDocuments(query),
      Ticket.find({}, 'status'),
    ]);

    const stats = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === 'open').length,
      in_progress: allTickets.filter((t) => t.status === 'in_progress').length,
      resolved: allTickets.filter((t) => t.status === 'resolved').length,
      closed: allTickets.filter((t) => t.status === 'closed').length,
    };

    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, orderRef, topic, message, priority = 'normal' } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Name, email and message are required.' });
      return;
    }

    const ticketId = `TIC-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket = await Ticket.create({
      ticketId,
      name,
      email: email.toLowerCase(),
      orderRef,
      topic: topic || 'General Inquiry',
      message,
      priority,
      status: 'open',
    });

    res.status(201).json({ success: true, message: 'Support ticket submitted.', ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }
    res.status(200).json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyToTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sender = 'Atelier Concierge', markResolved = true } = req.body;
    if (!message) {
      res.status(400).json({ success: false, message: 'Reply message is required.' });
      return;
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    ticket.adminReplies.push({ reply: message, sender, createdAt: new Date() });
    if (markResolved) {
      ticket.status = 'resolved';
      ticket.resolvedAt = new Date();
    } else {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    // Optionally send email response to client
    if (ticket.email) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
          to: ticket.email,
          subject: `DRAPZA Atelier — Update on Ticket #${ticket.ticketId}`,
          html: `<div style="background:#0b0b0b;padding:32px;font-family:monospace;color:#fff;max-width:540px;margin:0 auto;">
            <h2 style="letter-spacing:0.12em;">DRAPZA ATELIER CONCIERGE</h2>
            <p>Hello ${ticket.name},</p>
            <p>Our concierge desk has provided a response regarding ticket <strong>#${ticket.ticketId}</strong> (${ticket.topic}):</p>
            <div style="background:#171717;border-left:3px solid #fff;padding:16px;margin:16px 0;color:#e5e5e5;font-size:13px;line-height:1.6;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#888;font-size:11px;">Status: ${ticket.status.toUpperCase()}</p>
          </div>`,
        });
      } catch (mailErr) {
        // Mail sending is non-blocking
      }
    }

    res.status(200).json({ success: true, message: 'Reply dispatched.', ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Ticket deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportTicketsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status && status !== 'ALL') query.status = status;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    const csv = [
      'Ticket ID,Name,Email,Order Ref,Topic,Status,Priority,Created At',
      ...tickets.map(
        (t) =>
          `"${t.ticketId}","${t.name}","${t.email}","${t.orderRef || ''}","${t.topic}","${t.status}","${t.priority}","${t.createdAt.toISOString()}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=drapza_support_tickets.csv');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. CLIENT REVIEWS & PRODUCT RATINGS
// ─────────────────────────────────────────────────────────────

// Helper to resolve product ID whether provided as Mongo ObjectId, slug, or name
const resolveProductId = async (idOrSlug: string): Promise<mongoose.Types.ObjectId | null> => {
  if (!idOrSlug || idOrSlug === 'ALL' || idOrSlug === 'all') return null;
  const trimmed = String(idOrSlug).trim();
  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
    return new mongoose.Types.ObjectId(trimmed);
  }
  const cleanSlug = trimmed.toLowerCase();
  const prod = await Product.findOne({
    $or: [
      { slug: cleanSlug },
      { slug: cleanSlug.replace(/\s+/g, '-') },
      { name: new RegExp(`^${trimmed}$`, 'i') },
    ],
  });
  return prod ? (prod._id as mongoose.Types.ObjectId) : null;
};

export const getReviewsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, page = 1, limit = 20, sort = 'newest', rating, verifiedOnly, withPhotos, search } = req.query;
    const query: any = { status: 'approved' };

    if (productId && productId !== 'ALL' && productId !== 'all') {
      const resolvedId = await resolveProductId(String(productId));
      if (resolvedId) {
        query.productId = resolvedId;
      } else {
        // Requested specific slug/id that doesn't exist
        res.status(200).json({
          success: true,
          reviews: [],
          pagination: { total: 0, page: Number(page) || 1, limit: Number(limit) || 20, pages: 1 },
        });
        return;
      }
    }

    if (rating && rating !== 'ALL') query.rating = Number(rating);
    if (verifiedOnly === 'true') query.isVerifiedPurchase = true;
    if (withPhotos === 'true') query.photos = { $exists: true, $not: { $size: 0 } };
    if (search) {
      const searchRegex = { $regex: String(search), $options: 'i' };
      query.$or = [{ userName: searchRegex }, { title: searchRegex }, { comment: searchRegex }];
    }

    const sortOptions: any = {};
    if (sort === 'highest') sortOptions.rating = -1;
    else if (sort === 'lowest') sortOptions.rating = 1;
    else if (sort === 'helpful') sortOptions.helpfulVotes = -1;
    else sortOptions.createdAt = -1;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query).populate('productId', 'name images price slug numericPrice category').sort(sortOptions).skip(skip).limit(limitNum),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    const query: any = { status: 'approved' };
    if (productId && productId !== 'ALL' && productId !== 'all') {
      const resolvedId = await resolveProductId(String(productId));
      if (resolvedId) {
        query.productId = resolvedId;
      } else {
        res.status(200).json({
          success: true,
          stats: {
            totalReviews: 0,
            averageRating: 5.0,
            recommendationPercentage: 100,
            starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            fitDistribution: { runs_small: 0, true_to_size: 0, runs_large: 0 },
          },
        });
        return;
      }
    }

    const reviews = await Review.find(query);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)) : 5.0;

    const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const fitDistribution = { runs_small: 0, true_to_size: 0, runs_large: 0 };

    reviews.forEach((r) => {
      if (starDistribution[r.rating] !== undefined) starDistribution[r.rating]++;
      if (r.fit && fitDistribution[r.fit] !== undefined) fitDistribution[r.fit]++;
    });

    const recommendationPercentage = totalReviews > 0 ? Math.round((reviews.filter((r) => r.rating >= 4).length / totalReviews) * 100) : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalReviews,
        averageRating,
        recommendationPercentage,
        starDistribution,
        fitDistribution,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkReviewEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, slug, email } = req.query;
    const prodTarget = String(productId || slug || '');
    if (!prodTarget) {
      res.status(200).json({ success: true, eligible: false, message: 'Product ID or slug required.' });
      return;
    }

    const resolvedId = await resolveProductId(prodTarget);

    if (email && resolvedId) {
      const existing = await Review.findOne({ productId: resolvedId, userEmail: String(email).toLowerCase() });
      if (existing) {
        res.status(200).json({ success: true, eligible: false, reason: 'already_reviewed', message: 'You have already submitted a review for this silhouette.' });
        return;
      }
    }

    res.status(200).json({
      success: true,
      eligible: true,
      userName: 'Client Patron',
      userEmail: String(email || ''),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, userName, userEmail, rating, title, comment, fit, qualityRating, photos, verifiedSize, verifiedColor } = req.body;

    const cleanComment = String(comment || '').trim();
    if (!cleanComment) {
      res.status(400).json({ success: false, message: 'Review comment is required.' });
      return;
    }

    const finalRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const finalUserName = (userName && String(userName).trim()) || 'Verified Patron';
    const finalUserEmail = (userEmail && String(userEmail).trim().toLowerCase()) || 'client@atelier.drapza.com';
    const finalTitle = (title && String(title).trim()) || (cleanComment.slice(0, 48) + (cleanComment.length > 48 ? '...' : ''));

    let targetProductId = await resolveProductId(String(productId || ''));
    if (!targetProductId) {
      const fallbackProd = await Product.findOne();
      if (fallbackProd) {
        targetProductId = fallbackProd._id as mongoose.Types.ObjectId;
      } else {
        const placeholderProd = await Product.create({
          name: 'Atelier Signature Collection',
          slug: 'atelier-signature',
          price: 2499,
          description: 'Timeless luxury silhouette from DRAPZA atelier.',
          category: 'Wardrobe',
          stock: 100,
          images: ['/reviews/kurti_green.jpg'],
        });
        targetProductId = placeholderProd._id as mongoose.Types.ObjectId;
      }
    }

    const review = await Review.create({
      productId: targetProductId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      rating: finalRating,
      title: finalTitle,
      comment: cleanComment,
      fit: fit || 'true_to_size',
      qualityRating: Number(qualityRating) || finalRating,
      photos: Array.isArray(photos) ? photos : [],
      verifiedSize: verifiedSize || 'M',
      verifiedColor: verifiedColor || 'Atelier Natural',
      status: 'approved',
      isVerifiedPurchase: true,
    });

    res.status(201).json({ success: true, message: 'Review published successfully.', review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const voteHelpfulReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulVotes: 1 } }, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.status(200).json({ success: true, helpfulVotes: review.helpfulVotes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminGetAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 50, search, isFeatured, productId, rating } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (productId && productId !== 'ALL') {
      const resolved = await resolveProductId(String(productId));
      if (resolved) {
        query.productId = resolved;
      } else if (mongoose.Types.ObjectId.isValid(String(productId))) {
        query.productId = new mongoose.Types.ObjectId(String(productId));
      }
    }
    if (rating && rating !== 'ALL') query.rating = Number(rating);
    if (search) {
      query.$or = [
        { userName: { $regex: String(search), $options: 'i' } },
        { userEmail: { $regex: String(search), $options: 'i' } },
        { title: { $regex: String(search), $options: 'i' } },
        { comment: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('productId', 'name images price slug')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.comment) {
      res.status(400).json({ success: false, message: 'Review comment is required.' });
      return;
    }

    let targetProductId = await resolveProductId(String(data.productId || ''));
    if (!targetProductId) {
      const fallback = await Product.findOne();
      if (fallback) {
        targetProductId = fallback._id as mongoose.Types.ObjectId;
      }
    }

    const review = await Review.create({
      ...data,
      productId: targetProductId,
      userName: data.userName || 'Verified Patron',
      title: data.title || (String(data.comment).slice(0, 48) + '...'),
      userEmail: data.userEmail ? data.userEmail.toLowerCase() : 'client@atelier.drapza.com',
      rating: Number(data.rating) || 5,
      status: data.status || 'approved',
      isVerifiedPurchase: data.isVerifiedPurchase !== false,
    });

    res.status(201).json({ success: true, message: 'Review successfully created.', review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Review updated.', review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['approved', 'pending', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status.' });
      return;
    }
    const review = await Review.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.status(200).json({ success: true, message: `Review status updated to ${status}.`, review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminBulkReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, reviewIds } = req.body;
    if (!action || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      res.status(400).json({ success: false, message: 'Action and review IDs required.' });
      return;
    }

    if (action === 'delete') {
      await Review.deleteMany({ _id: { $in: reviewIds } });
      res.status(200).json({ success: true, message: `${reviewIds.length} reviews deleted.` });
      return;
    }

    const update: any = {};
    if (action === 'approved' || action === 'pending' || action === 'rejected') {
      update.status = action;
    } else if (action === 'feature') {
      update.isFeatured = true;
    } else if (action === 'unfeature') {
      update.isFeatured = false;
    }

    await Review.updateMany({ _id: { $in: reviewIds } }, { $set: update });
    res.status(200).json({ success: true, message: `Bulk action '${action}' applied to ${reviewIds.length} reviews.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminReplyReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reply } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { atelierResponse: reply, atelierRespondedAt: new Date() },
      { new: true }
    );
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Atelier reply recorded.', review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminPinReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }
    review.isPinned = !review.isPinned;
    await review.save();
    res.status(200).json({ success: true, message: review.isPinned ? 'Review pinned to top.' : 'Review unpinned.', review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Review removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
