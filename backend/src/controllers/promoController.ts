import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import cloudinary from '../config/cloudinary';
import { SiteConfig } from '../models/Config';
import { Newsletter } from '../models/Newsletter';
import { GiftCard, Coupon, ShopTheLookPost } from '../models/PromoModels';
import { User } from '../models/User';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// SMTP Transporter (shared, lazy-init)
// ─────────────────────────────────────────────────────────────
const getTransporter = () =>
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const generateGiftCardCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GC-';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// ─────────────────────────────────────────────────────────────
// NEWSLETTER CRM
// ─────────────────────────────────────────────────────────────

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, source = 'footer_dispatch' } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email is required.' }); return; }

    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        res.status(200).json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
      } else {
        res.status(200).json({ success: true, message: 'You are already subscribed to our dispatch signals.' });
      }
      return;
    }

    await Newsletter.create({ email: email.toLowerCase(), source });
    res.status(201).json({ success: true, message: 'Subscribed successfully to DRAPZA dispatch signals.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Subscription error.' });
  }
};

export const getNewsletterSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};
    if (status === 'ACTIVE' || status === 'active') query.isActive = true;
    if (status === 'INACTIVE' || status === 'unsubscribed') query.isActive = false;
    if (search) query.email = { $regex: String(search), $options: 'i' };

    const subscribers = await Newsletter.find(query).sort({ createdAt: -1 });
    const formatted = subscribers.map((s: any) => ({
      _id: s._id,
      email: s.email,
      source: s.source || 'footer_dispatch',
      isActive: s.isActive,
      status: s.isActive ? 'active' : 'unsubscribed',
      subscribedAt: s.subscribedAt || s.createdAt || new Date(),
    }));
    res.status(200).json({ success: true, count: formatted.length, subscribers: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNewsletterSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Subscriber removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleNewsletterSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await Newsletter.findById(req.params.id);
    if (!sub) { res.status(404).json({ success: false, message: 'Subscriber not found.' }); return; }
    sub.isActive = !sub.isActive;
    await sub.save();
    res.status(200).json({
      success: true,
      isActive: sub.isActive,
      status: sub.isActive ? 'active' : 'unsubscribed',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendNewsletterBroadcast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, title, message, ctaText = 'EXPLORE ARCHIVE', ctaUrl = 'https://drapza.com/wardrobe' } = req.body;
    if (!subject || !message) { res.status(400).json({ success: false, message: 'Subject and message are required.' }); return; }

    const subs = await Newsletter.find({ isActive: true });
    if (subs.length === 0) { res.status(200).json({ success: true, message: 'No active subscribers to broadcast to.', sent: 0 }); return; }

    const transporter = getTransporter();
    let sent = 0;
    const errors: string[] = [];

    const html = `
      <!DOCTYPE html><html><body style="margin:0;padding:0;background:#0b0b0b;font-family:monospace;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111;border:1px solid #222;">
        <tr><td style="background:#000;padding:32px 24px;text-align:center;">
          <p style="color:#fff;font-size:24px;font-weight:700;letter-spacing:0.2em;margin:0;">DRAPZA</p>
          <p style="color:#555;font-size:10px;letter-spacing:0.15em;margin:4px 0 0;">ATELIER DISPATCH</p>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          ${title ? `<h1 style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.1em;margin:0 0 16px;">${title}</h1>` : ''}
          <p style="color:#aaa;font-size:14px;line-height:1.8;margin:0 0 24px;">${message}</p>
          <a href="${ctaUrl}" style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:12px;letter-spacing:0.12em;padding:14px 32px;text-decoration:none;">${ctaText}</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #222;text-align:center;">
          <p style="color:#444;font-size:10px;margin:0;">© 2026 DRAPZA ATELIER. ALL MODULES RESERVED.</p>
        </td></tr>
      </table></body></html>
    `;

    for (const sub of subs) {
      try {
        await transporter.sendMail({
          from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
          to: sub.email,
          subject,
          html,
        });
        sent++;
      } catch (e: any) {
        errors.push(sub.email);
      }
    }

    res.status(200).json({ success: true, message: `Broadcast sent to ${sent}/${subs.length} subscribers.`, sent, failed: errors.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportNewsletterCsv = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subs = await Newsletter.find().sort({ createdAt: -1 });
    const csv = ['Email,Source,Status,Subscribed At', ...subs.map(s => `${s.email},${s.source},${s.isActive ? 'Active' : 'Inactive'},${s.subscribedAt.toISOString()}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=drapza_newsletter_subscribers.csv');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// COUPON / PROMO CMS
// ─────────────────────────────────────────────────────────────

const DEFAULT_SEEDS = [
  { code: 'WELCOME10', description: '10% OFF on your order', discountType: 'percentage', discountAmount: 10, minOrderValue: 0, isActive: true },
  { code: 'SAVE200', description: '₹200 OFF on orders above ₹1,499', discountType: 'fixed', discountAmount: 200, minOrderValue: 1499, isActive: true },
  { code: 'DRAPZA10', description: 'Flat 10% off on all orders', discountType: 'percentage', discountAmount: 10, minOrderValue: 500, isActive: true },
  { code: 'DRAPZA20', description: 'Flat 20% off — limited vault offer', discountType: 'percentage', discountAmount: 20, minOrderValue: 1000, maxDiscountAmount: 500, isActive: true },
  { code: 'FLAT500', description: 'Flat ₹500 off on orders above ₹2000', discountType: 'fixed', discountAmount: 500, minOrderValue: 2000, isActive: true },
];

export const getAllCoupons = async (_req: Request, res: Response): Promise<void> => {
  try {
    let coupons = await Coupon.find().sort({ createdAt: -1 });
    if (!coupons || coupons.length === 0) {
      await Coupon.insertMany(DEFAULT_SEEDS);
      coupons = await Coupon.find().sort({ createdAt: -1 });
    }
    res.status(200).json({ success: true, data: coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.code || !data.discountType || data.discountAmount === undefined) {
      res.status(400).json({ success: false, message: 'code, discountType, and discountAmount are required.' });
      return;
    }
    const coupon = await Coupon.create({ ...data, code: data.code.toUpperCase().trim() });
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) { res.status(404).json({ success: false, message: 'Coupon not found.' }); return; }
    res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleCouponStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) { res.status(404).json({ success: false, message: 'Coupon not found.' }); return; }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.status(200).json({ success: true, isActive: coupon.isActive, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const cartTotal = Number(req.body.cartTotal ?? req.body.orderAmount ?? req.body.amount ?? 0);
    if (!code) { res.status(400).json({ success: false, message: 'Coupon code is required.' }); return; }

    let coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) {
      const matchSeed = DEFAULT_SEEDS.find((s) => s.code === code.toUpperCase().trim());
      if (matchSeed) {
        coupon = await Coupon.create(matchSeed).catch(() => Coupon.findOne({ code: matchSeed.code }));
      }
    }
    if (!coupon) { res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' }); return; }

    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      res.status(400).json({ success: false, message: 'This coupon has expired.' }); return;
    }
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      res.status(400).json({ success: false, message: 'This coupon is not yet active.' }); return;
    }
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      res.status(400).json({ success: false, message: `Minimum order value of ₹${coupon.minOrderValue} required.` }); return;
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= (coupon.usageLimit || 0)) {
      res.status(400).json({ success: false, message: 'Coupon usage limit reached.' }); return;
    }

    let discountAmount = coupon.discountType === 'percentage'
      ? (cartTotal * coupon.discountAmount) / 100
      : coupon.discountAmount;

    if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);

    res.status(200).json({ success: true, coupon, discountAmount: Math.round(discountAmount), finalTotal: Math.max(0, cartTotal - discountAmount) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const seedCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    const existing = await Coupon.countDocuments();
    if (existing > 0 && !force) {
      res.status(200).json({ success: true, message: `${existing} coupons already exist. Use ?force=true to re-seed.`, count: existing });
      return;
    }
    if (force) await Coupon.deleteMany({});

    const seeds = [
      { code: 'DRAPZA10', description: 'Flat 10% off on all orders', discountType: 'percentage', discountAmount: 10, minOrderValue: 500 },
      { code: 'DRAPZA20', description: 'Flat 20% off — limited vault offer', discountType: 'percentage', discountAmount: 20, minOrderValue: 1000, maxDiscountAmount: 500 },
      { code: 'FLAT500', description: 'Flat ₹500 off on orders above ₹2000', discountType: 'fixed', discountAmount: 500, minOrderValue: 2000 },
      { code: 'FIRST15', description: '15% off for first-time clients', discountType: 'percentage', discountAmount: 15, usageLimit: 200 },
      { code: 'ATELIER25', description: '25% off — Atelier Black Label access', discountType: 'percentage', discountAmount: 25, minOrderValue: 1500, maxDiscountAmount: 750 },
    ];

    const inserted = await Coupon.insertMany(seeds);
    res.status(201).json({ success: true, message: `${inserted.length} default coupons seeded.`, data: inserted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// BOGO / BUNDLE TIERS CONFIG
// ─────────────────────────────────────────────────────────────

const DEFAULT_BOGO_CONFIG = {
  isEnabled: true,
  sectionTitle: 'SPECIAL BUNDLE DEALS • BUY & GET FREE',
  sectionSubtitle: 'Select a package to unlock complimentary garments & maximum savings',
  bannerNotice: 'SPECIAL ATELIER OFFER: Buy 1 piece and unlock up to 3 complimentary garments!',
  allowColorMix: true,
  allowSizeMix: true,
  tiers: [
    { id: 'bogo-single', name: '1 PIECE (STANDARD)', tag: '1 ITEM', buyQty: 1, getQty: 0, totalQty: 1, discountPercentage: 0, badgeText: 'STANDARD', popular: false, isActive: true },
    { id: 'bogo-1-1', name: 'BUY 1 GET 1 FREE', tag: '2 PIECES PACK', buyQty: 1, getQty: 1, totalQty: 2, discountPercentage: 50, badgeText: 'SAVE 50%', popular: false, isActive: true },
    { id: 'bogo-1-2', name: 'BUY 1 GET 2 FREE', tag: '3 PIECES PACK', buyQty: 1, getQty: 2, totalQty: 3, discountPercentage: 66, badgeText: 'MOST POPULAR', popular: true, isActive: true },
    { id: 'bogo-1-3', name: 'BUY 1 GET 3 FREE', tag: '4 PIECES PACK', buyQty: 1, getQty: 3, totalQty: 4, discountPercentage: 75, badgeText: 'BEST VALUE', popular: false, isActive: true },
  ],
};

export const getBogoConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOne({ key: 'bogo-config' });
    if (config?.data) { res.status(200).json({ success: true, data: { ...DEFAULT_BOGO_CONFIG, ...config.data } }); return; }
    res.status(200).json({ success: true, data: DEFAULT_BOGO_CONFIG });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBogoConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingData = req.body || {};
    const existing = await SiteConfig.findOne({ key: 'bogo-config' });
    const mergedData = { ...DEFAULT_BOGO_CONFIG, ...(existing?.data || {}), ...incomingData };
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'bogo-config' },
      { key: 'bogo-config', data: mergedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: 'BOGO & Bundle Tiers updated.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetBogoConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'bogo-config' },
      { key: 'bogo-config', data: DEFAULT_BOGO_CONFIG },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'BOGO config reset to factory defaults.', data: config.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// WALLET & GIFT CARDS
// ─────────────────────────────────────────────────────────────

export const getWalletProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    res.status(200).json({
      success: true,
      walletBalance: user.balance || 0,
      loyaltyPoints: Math.floor((user.balance || 0) * 10),
      loyaltyTier: (user.balance || 0) >= 5000 ? 'obsidian' : (user.balance || 0) >= 1000 ? 'silver' : 'bronze',
      transactions: [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const redeemGiftCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!code) { res.status(400).json({ success: false, message: 'Gift card code is required.' }); return; }

    const card = await GiftCard.findOne({ code: code.toUpperCase(), isActive: true });
    if (!card) { res.status(404).json({ success: false, message: 'Invalid or expired gift card.' }); return; }
    if (card.status === 'Used' || card.status === 'Expired' || card.status === 'Cancelled') {
      res.status(400).json({ success: false, message: `Gift card is ${card.status.toLowerCase()}.` }); return;
    }
    if (card.expiryDate < new Date()) { res.status(400).json({ success: false, message: 'This gift card has expired.' }); return; }
    if (card.currentBalance <= 0) { res.status(400).json({ success: false, message: 'Gift card balance is zero.' }); return; }

    const creditAmount = card.currentBalance;
    card.currentBalance = 0;
    card.status = 'Used';
    card.redeemedByEmail = (req as any).user?.email;
    card.redeemedAt = new Date();
    card.transactions.push({ type: 'REDEMPTION', amount: creditAmount, remainingBalance: 0, description: 'Gift card redeemed', date: new Date() });
    await card.save();

    await User.findByIdAndUpdate(userId, { $inc: { balance: creditAmount } });

    res.status(200).json({ success: true, message: `₹${creditAmount} credited to wallet.`, walletBalance: creditAmount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyGiftCardBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) { res.status(400).json({ success: false, message: 'Code required.' }); return; }
    const card = await GiftCard.findOne({ code: code.toUpperCase() });
    if (!card) { res.status(200).json({ success: true, valid: false, message: 'Gift card not found.' }); return; }

    const siteConf = await SiteConfig.findOne({ key: 'site-config' });
    const perk = siteConf?.data?.giftCardRedemptionDiscountEnabled ? {
      enabled: true,
      discountType: siteConf.data.giftCardRedemptionDiscountType || 'percentage',
      discountValue: siteConf.data.giftCardRedemptionDiscountValue || 10,
      minOrderAmount: siteConf.data.giftCardRedemptionMinOrderAmount || 0,
      maxDiscount: siteConf.data.giftCardRedemptionMaxDiscount || 1000,
      promoLabel: siteConf.data.giftCardRedemptionPromoLabel || 'GIFT CARD BONUS PERK',
      description: siteConf.data.giftCardRedemptionDescription || 'Extra discount when paying with gift card!',
    } : { enabled: false };

    res.status(200).json({ success: true, valid: card.isActive && card.status !== 'Used' && card.status !== 'Cancelled', code: card.code, initialBalance: card.initialBalance, currentBalance: card.currentBalance, status: card.status, theme: card.theme, senderName: card.senderName, recipientName: card.recipientName, expiryDate: card.expiryDate, redemptionPerk: perk });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminAdjustWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userEmail, type, amount, reason } = req.body;
    if (!amount || !type) { res.status(400).json({ success: false, message: 'Amount and type are required.' }); return; }

    const user = userId ? await User.findById(userId) : await User.findOne({ email: userEmail });
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const delta = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
    user.balance = Math.max(0, (user.balance || 0) + delta);
    await user.save();

    res.status(200).json({ success: true, message: `Wallet ${type}ed ₹${Math.abs(amount)}.`, newBalance: user.balance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateGiftCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, customCode, recipientName, recipientEmail, senderName, theme = 'midnight', notes, validityDays = 365, sendEmailToRecipient = false } = req.body;
    if (!amount || amount < 1) { res.status(400).json({ success: false, message: 'Amount must be at least ₹1.' }); return; }

    const code = customCode ? customCode.toUpperCase().trim() : generateGiftCardCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    const card = await GiftCard.create({
      code,
      initialBalance: amount,
      currentBalance: amount,
      status: 'Active',
      theme,
      isActive: true,
      senderName,
      recipientName,
      recipientEmail,
      notes,
      expiryDate,
      transactions: [{ type: 'PURCHASE', amount, remainingBalance: amount, description: 'Admin issued gift card', date: new Date() }],
    });

    if (sendEmailToRecipient && recipientEmail) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
          to: recipientEmail,
          subject: 'DRAPZA — You have received a Gift Card!',
          html: `<div style="background:#0b0b0b;padding:32px;font-family:monospace;color:#fff;max-width:520px;margin:0 auto;">
            <h1 style="font-size:22px;letter-spacing:0.15em;">DRAPZA</h1>
            <p>You have received a ₹${amount} Gift Card${senderName ? ` from ${senderName}` : ''}!</p>
            <div style="background:#1a1a1a;padding:20px;border:1px solid #333;margin:16px 0;">
              <p style="color:#aaa;font-size:11px;margin:0 0 8px;">YOUR GIFT CARD CODE</p>
              <p style="font-size:20px;font-weight:700;letter-spacing:0.12em;color:#fff;margin:0;">${code}</p>
            </div>
            <p style="color:#888;font-size:12px;">Valid until: ${expiryDate.toDateString()}</p>
            <a href="${env.FRONTEND_URL}/wardrobe" style="display:inline-block;background:#fff;color:#000;padding:12px 24px;font-weight:700;text-decoration:none;margin-top:16px;">SHOP NOW</a>
          </div>`,
        });
      } catch (emailErr) {
        // Email failure is non-critical
      }
    }

    res.status(201).json({ success: true, message: 'Gift card created.', giftCard: card });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Gift card code already exists.' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const adminGetGiftCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (search) query.$or = [{ code: { $regex: String(search), $options: 'i' } }, { recipientEmail: { $regex: String(search), $options: 'i' } }];

    const cards = await GiftCard.find(query).sort({ createdAt: -1 });
    const totalSales = cards.reduce((s, c) => s + c.initialBalance, 0);
    const totalRedeemed = cards.filter(c => c.status === 'Used').reduce((s, c) => s + c.initialBalance, 0);
    const outstandingLiabilities = cards.filter(c => c.status === 'Active' || c.status === 'Partially Used').reduce((s, c) => s + c.currentBalance, 0);

    res.status(200).json({ success: true, count: cards.length, metrics: { totalSales, totalRedeemed, outstandingLiabilities, totalCount: cards.length }, giftCards: cards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCancelGiftCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const card = await GiftCard.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled', isActive: false, cancelReason: reason, cancelledAt: new Date() },
      { new: true }
    );
    if (!card) { res.status(404).json({ success: false, message: 'Gift card not found.' }); return; }
    res.status(200).json({ success: true, message: 'Gift card cancelled.', data: card });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminExtendGiftCardExpiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { additionalDays = 365, newExpiryDate } = req.body;
    const card = await GiftCard.findById(req.params.id);
    if (!card) { res.status(404).json({ success: false, message: 'Gift card not found.' }); return; }

    if (newExpiryDate) {
      card.expiryDate = new Date(newExpiryDate);
    } else {
      const base = card.expiryDate > new Date() ? card.expiryDate : new Date();
      base.setDate(base.getDate() + additionalDays);
      card.expiryDate = base;
    }
    if (card.status === 'Expired') card.status = 'Active';
    await card.save();

    res.status(200).json({ success: true, message: 'Gift card expiry extended.', data: card });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// SHOP THE LOOK / UGC INSTAGRAM FEED
// ─────────────────────────────────────────────────────────────

export const getShopTheLookPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await ShopTheLookPost.find({ isActive: true })
      .populate({ path: 'taggedProducts.product', select: 'name price numericPrice images slug stock category' })
      .sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminGetAllShopTheLookPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await ShopTheLookPost.find()
      .populate({ path: 'taggedProducts.product', select: 'name price numericPrice images slug stock category' })
      .sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createShopTheLookPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.imageUrl) { res.status(400).json({ success: false, message: 'imageUrl is required.' }); return; }

    // Upload image to Cloudinary if base64
    let imageUrl = data.imageUrl;
    if (data.imageUrl.startsWith('data:')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(data.imageUrl, { folder: 'drapza/shop_the_look', resource_type: 'auto' });
        imageUrl = uploadRes.secure_url;
      } catch { /* keep base64 */ }
    }

    const post = await ShopTheLookPost.create({ ...data, imageUrl });
    res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShopTheLookPost = async (req: Request, res: Response): Promise<void> => {
  try {
    await ShopTheLookPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
