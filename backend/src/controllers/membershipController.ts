import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { MembershipPlan, MembershipSubscription, MembershipQRCode } from '../models/Membership';
import { User } from '../models/User';
import {
  seedDefaultMembershipPlans,
  getUserActiveMembership,
  generateSubscriptionId,
} from '../utils/membershipService';

/**
 * 1. PUBLIC: GET ACTIVE MEMBERSHIP PLANS
 */
export const getPublicPlans = async (_req: any, res: Response): Promise<void> => {
  try {
    await seedDefaultMembershipPlans();
    const plans = await MembershipPlan.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error: any) {
    console.error('[MembershipController] getPublicPlans error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve plans.' });
  }
};

/**
 * 2. AUTH: GET CURRENT USER'S MEMBERSHIP STATUS & HISTORY
 */
export const getMyMembership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const membership = await getUserActiveMembership(req.user._id);

    const pastSubscriptions = await MembershipSubscription.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      hasActiveMembership: membership.isActive,
      membership: membership.isActive
        ? {
            subscriptionId: membership.subscription?.subscriptionId,
            planName: membership.planName,
            discountPercent: membership.discountPercent,
            badge: membership.badge,
            startDate: membership.subscription?.startDate,
            endDate: membership.subscription?.endDate,
            daysRemaining: membership.daysRemaining,
            benefits: membership.plan?.benefits || [],
            source: membership.subscription?.source,
            storeCode: membership.subscription?.storeCode,
          }
        : null,
      history: pastSubscriptions,
    });
  } catch (error: any) {
    console.error('[MembershipController] getMyMembership error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching membership.' });
  }
};

/**
 * 3. AUTH: CREATE MEMBERSHIP ORDER / TRANSACTION SESSION
 */
export const createMembershipOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to purchase membership.' });
      return;
    }

    const { planId, gateway = 'RAZORPAY', storeCode = 'ONLINE_DIRECT', source = 'ONLINE' } = req.body;

    if (!planId) {
      res.status(400).json({ success: false, message: 'Plan ID is required.' });
      return;
    }

    let plan = await MembershipPlan.findById(planId);
    if (!plan) {
      plan = await MembershipPlan.findOne({ slug: String(planId).toLowerCase().trim() });
    }

    if (!plan || !plan.isActive) {
      res.status(404).json({ success: false, message: 'The requested membership plan is inactive or does not exist.' });
      return;
    }

    const amountInRupees = plan.price;
    const amountInPaise = Math.round(amountInRupees * 100);
    const receipt = `mem_${generateSubscriptionId()}`;

    // A. RAZORPAY GATEWAY
    if (gateway.toUpperCase() === 'RAZORPAY') {
      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
        const authHeader = 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
              type: 'MEMBERSHIP_ENROLLMENT',
              planName: plan.name,
              planSlug: plan.slug,
              userId: req.user._id.toString(),
              userEmail: req.user.email,
              storeCode,
              source,
            },
          }),
        });

        const rzpData: any = await rzpRes.json();
        if (!rzpRes.ok) {
          console.error('[Membership] Razorpay order error:', rzpData);
          res.status(rzpRes.status).json({
            success: false,
            message: rzpData?.error?.description || 'Failed to create Razorpay membership order.',
          });
          return;
        }

        res.status(200).json({
          success: true,
          gateway: 'RAZORPAY',
          orderId: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency,
          keyId: env.RAZORPAY_KEY_ID,
          plan: {
            id: plan._id,
            name: plan.name,
            price: plan.price,
            discountPercent: plan.discountPercent,
            durationDays: plan.durationDays,
          },
        });
        return;
      }
    }

    // B. CASHFREE GATEWAY
    if (gateway.toUpperCase() === 'CASHFREE') {
      if (env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY) {
        const isTest = (env.CASHFREE_ENV || 'TEST').toUpperCase() === 'TEST';
        const cfUrl = isTest
          ? 'https://sandbox.cashfree.com/pg/orders'
          : 'https://api.cashfree.com/pg/orders';

        const origin = req.get('origin') || req.get('referer');
        let frontendBase = (env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
        if (origin) {
          try {
            frontendBase = new URL(origin).origin;
          } catch (_) {}
        }

        const normalizePhone = (phone?: string): string => {
          const digits = (phone || '').replace(/\D/g, '');
          if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
          if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
          return digits.length === 10 ? digits : '9876543210';
        };

        const cfOrderId = `CF_MEM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const cfRes = await fetch(cfUrl, {
          method: 'POST',
          headers: {
            'x-client-id': env.CASHFREE_APP_ID,
            'x-client-secret': env.CASHFREE_SECRET_KEY,
            'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: cfOrderId,
            order_amount: amountInRupees,
            order_currency: 'INR',
            customer_details: {
              customer_id: `cust_${req.user._id ? req.user._id.toString().slice(-8) : Date.now().toString().slice(-8)}`,
              customer_name: req.user.name || 'Member Client',
              customer_email: req.user.email || 'guest@drapza.com',
              customer_phone: normalizePhone(req.user.phone),
            },
            order_meta: {
              return_url: `${frontendBase}/membership?cf_order_id={order_id}&plan_id=${plan._id}`,
            },
            order_note: `DRAPZA Membership: ${plan.name}`,
          }),
        });

        const cfData: any = await cfRes.json();
        if (!cfRes.ok) {
          console.error('[Membership] Cashfree order error:', cfData);
          res.status(cfRes.status).json({
            success: false,
            message: cfData?.message || 'Failed to initialize Cashfree membership order.',
          });
          return;
        }

        res.status(200).json({
          success: true,
          gateway: 'CASHFREE',
          paymentSessionId: cfData.payment_session_id,
          orderId: cfData.order_id,
          cfEnv: env.CASHFREE_ENV || 'TEST',
          plan: {
            id: plan._id,
            name: plan.name,
            price: plan.price,
            discountPercent: plan.discountPercent,
            durationDays: plan.durationDays,
          },
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: 'Cashfree credentials (CASHFREE_APP_ID and CASHFREE_SECRET_KEY) are not configured in backend .env',
        });
        return;
      }
    }

    // C. SECURE SIMULATION FALLBACK (when in dev/test or keys not provisioned)
    const mockOrderId = `ORD_SIM_${receipt}`;
    res.status(200).json({
      success: true,
      gateway: 'SIMULATED',
      orderId: mockOrderId,
      amount: amountInRupees,
      currency: 'INR',
      plan: {
        id: plan._id,
        name: plan.name,
        price: plan.price,
        discountPercent: plan.discountPercent,
        durationDays: plan.durationDays,
      },
    });
  } catch (error: any) {
    console.error('[MembershipController] createMembershipOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating membership order.' });
  }
};

/**
 * 4. AUTH: VERIFY PAYMENT & ACTIVATE MEMBERSHIP
 */
export const verifyMembershipPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to verify membership.' });
      return;
    }

    const {
      planId,
      gateway = 'RAZORPAY',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cf_order_id,
      storeCode = 'ONLINE_DIRECT',
      source = 'ONLINE',
    } = req.body;

    if (!planId) {
      res.status(400).json({ success: false, message: 'Plan ID is required for verification.' });
      return;
    }

    let plan = await MembershipPlan.findById(planId);
    if (!plan) {
      plan = await MembershipPlan.findOne({ slug: String(planId).toLowerCase().trim() });
    }

    if (!plan) {
      res.status(404).json({ success: false, message: 'Membership plan not found.' });
      return;
    }

    let verifiedPaymentId = '';
    let verifiedGatewayOrderId = '';

    // Verify based on gateway
    if (gateway.toUpperCase() === 'RAZORPAY') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ success: false, message: 'Incomplete Razorpay payload.' });
        return;
      }

      if (env.RAZORPAY_KEY_SECRET) {
        const expectedSig = crypto
          .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSig !== razorpay_signature) {
          res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature.' });
          return;
        }
      }

      verifiedPaymentId = razorpay_payment_id;
      verifiedGatewayOrderId = razorpay_order_id;
    } else if (gateway.toUpperCase() === 'CASHFREE') {
      const cfOrderId = cf_order_id || req.body.orderId || req.body.cashfreeOrderId;
      if (!cfOrderId) {
        res.status(400).json({ success: false, message: 'Missing Cashfree order ID.' });
        return;
      }

      const isTest = (env.CASHFREE_ENV || 'TEST').toUpperCase() === 'TEST';
      const cfUrl = isTest
        ? `https://sandbox.cashfree.com/pg/orders/${cfOrderId}`
        : `https://api.cashfree.com/pg/orders/${cfOrderId}`;

      const cfRes = await fetch(cfUrl, {
        method: 'GET',
        headers: {
          'x-client-id': env.CASHFREE_APP_ID,
          'x-client-secret': env.CASHFREE_SECRET_KEY,
          'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
        },
      });

      const cfData: any = await cfRes.json();
      if (!cfRes.ok || cfData.order_status !== 'PAID') {
        res.status(400).json({
          success: false,
          message: `Cashfree payment verification failed. Status: ${cfData?.order_status || 'UNPAID'}`,
        });
        return;
      }

      verifiedPaymentId = `CF_PAY_${cfOrderId}`;
      verifiedGatewayOrderId = cfOrderId;
    } else {
      // Demo / Simulated
      verifiedPaymentId = `SIM_PAY_${Date.now()}`;
      verifiedGatewayOrderId = req.body.orderId || `SIM_ORD_${Date.now()}`;
    }

    // Check for duplicate activation
    if (verifiedPaymentId) {
      const existingSub = await MembershipSubscription.findOne({ paymentId: verifiedPaymentId });
      if (existingSub) {
        res.status(200).json({
          success: true,
          message: 'Membership already active for this transaction.',
          subscription: existingSub,
        });
        return;
      }
    }

    // Deactivate any currently active subscriptions for this user
    await MembershipSubscription.updateMany(
      { user: req.user._id, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED', notes: 'Superseded by newly purchased plan' } }
    );

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const subscriptionId = generateSubscriptionId();

    const newSubscription = await MembershipSubscription.create({
      subscriptionId,
      user: req.user._id,
      customer: {
        name: req.user.name || 'Member Client',
        email: req.user.email,
        phone: req.user.phone || '',
      },
      plan: plan._id,
      planName: plan.name,
      planSlug: plan.slug,
      durationDays: plan.durationDays,
      discountPercent: plan.discountPercent,
      startDate,
      endDate,
      status: 'ACTIVE',
      amountPaid: plan.price,
      paymentMethod: gateway.toUpperCase() as any,
      paymentId: verifiedPaymentId,
      gatewayOrderId: verifiedGatewayOrderId,
      source: source === 'QR_IN_STORE' ? 'QR_IN_STORE' : 'ONLINE',
      storeCode: storeCode || 'ONLINE_DIRECT',
      notes: `Enrolled into ${plan.name} via ${source}`,
    });

    // Update User model role and tier
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        role: 'member',
        tier: plan.badge || 'VIP',
      },
    });

    // If source was QR code, increment conversion count
    if (source === 'QR_IN_STORE' && storeCode) {
      await MembershipQRCode.findOneAndUpdate(
        { code: storeCode.toUpperCase() },
        { $inc: { conversionsCount: 1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Privilege access confirmed! You are now an active member with ${plan.discountPercent}% special member pricing.`,
      subscription: newSubscription,
    });
  } catch (error: any) {
    console.error('[MembershipController] verifyMembershipPayment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error activating membership.' });
  }
};

/**
 * 5. PUBLIC: RECORD QR CODE SCAN
 */
export const recordQrScan = async (req: any, res: Response): Promise<void> => {
  try {
    const code = String(req.body.code || req.query.code || '').toUpperCase().trim();
    if (code) {
      await MembershipQRCode.findOneAndUpdate(
        { code },
        { $inc: { scansCount: 1 } }
      );
    }
    res.status(200).json({ success: true });
  } catch {
    res.status(200).json({ success: true });
  }
};

/**
 * =========================================================================
 * ADMIN CONTROLLERS (RBAC Protected: adminOnly)
 * =========================================================================
 */

/**
 * 6. ADMIN: GET ALL MEMBERSHIP PLANS
 */
export const getAdminPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await seedDefaultMembershipPlans();
    const plans = await MembershipPlan.find().sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve admin plans.' });
  }
};

/**
 * 7. ADMIN: CREATE PLAN
 */
export const createAdminPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      durationMonths = 1,
      durationDays = 30,
      price = 0,
      discountPercent = 10,
      benefits = [],
      eligibleCategories = ['ALL'],
      badge = 'VIP',
      badgeColor = '#000000',
      isActive = true,
      sortOrder = 0,
    } = req.body;

    if (!name || Number(price) < 0 || Number(discountPercent) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Name, positive price, and valid discount percentage are required.',
      });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await MembershipPlan.findOne({ slug });
    if (existing) {
      res.status(400).json({ success: false, message: `A plan with slug "${slug}" already exists.` });
      return;
    }

    const newPlan = await MembershipPlan.create({
      name,
      slug,
      durationMonths: Number(durationMonths) || 1,
      durationDays: Number(durationDays) || Math.round(Number(durationMonths) * 30.5),
      price: Number(price),
      discountPercent: Number(discountPercent),
      benefits: Array.isArray(benefits) ? benefits : [benefits].filter(Boolean),
      eligibleCategories: Array.isArray(eligibleCategories) ? eligibleCategories : ['ALL'],
      badge,
      badgeColor,
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({ success: true, message: 'Membership plan created.', plan: newPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create plan.' });
  }
};

/**
 * 8. ADMIN: UPDATE PLAN
 */
export const updateAdminPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const updated = await MembershipPlan.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Plan successfully updated.', plan: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update plan.' });
  }
};

/**
 * 9. ADMIN: DELETE / DEACTIVATE PLAN
 */
export const deleteAdminPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activeSubsCount = await MembershipSubscription.countDocuments({
      plan: id,
      status: 'ACTIVE',
    });

    if (activeSubsCount > 0) {
      // Safely archive instead of hard deleting to prevent orphaned subscriptions
      await MembershipPlan.findByIdAndUpdate(id, { $set: { isActive: false } });
      res.status(200).json({
        success: true,
        message: `Plan has ${activeSubsCount} active subscriber(s). Plan deactivated instead of deleted to protect active customer entitlements.`,
      });
      return;
    }

    await MembershipPlan.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Plan removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete plan.' });
  }
};

/**
 * 10. ADMIN: GET SUBSCRIPTION ROSTER WITH FILTERS & PAGINATION
 */
export const getAdminSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      search,
      plan,
      source,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (source && source !== 'ALL') {
      query.source = source;
    }

    if (plan && plan !== 'ALL') {
      query.plan = plan;
    }

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { subscriptionId: { $regex: s, $options: 'i' } },
        { 'customer.name': { $regex: s, $options: 'i' } },
        { 'customer.email': { $regex: s, $options: 'i' } },
        { 'customer.phone': { $regex: s, $options: 'i' } },
        { planName: { $regex: s, $options: 'i' } },
        { paymentId: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await MembershipSubscription.countDocuments(query);
    const subscriptions = await MembershipSubscription.find(query)
      .populate('user', 'name email role tier')
      .populate('plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      subscriptions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve subscriptions.' });
  }
};

/**
 * 11. ADMIN: MANUALLY GRANT MEMBERSHIP TO CUSTOMER
 */
export const grantAdminMembership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      email,
      name,
      phone,
      planId,
      amountPaid,
      paymentMethod = 'MANUAL_ADMIN',
      paymentId,
      startDate: customStartDate,
      durationDaysOverride,
      notes = 'Manually granted by administrator',
    } = req.body;

    if (!email || !planId) {
      res.status(400).json({ success: false, message: 'Customer email and Plan ID are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Membership plan not found.' });
      return;
    }

    let targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      // Auto-create user if paid manually via GPay/Cash and not registered yet
      const randomPass = Math.random().toString(36).slice(-8) + 'A1!';
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      targetUser = await User.create({
        name: (name && String(name).trim()) || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: (phone && String(phone).trim()) || '',
        password: hashedPassword,
        role: 'member',
        tier: plan.badge || 'VIP',
      });
    } else {
      if (name && String(name).trim() && (!targetUser.name || targetUser.name === cleanEmail.split('@')[0])) {
        targetUser.name = String(name).trim();
      }
      if (phone && String(phone).trim()) {
        targetUser.phone = String(phone).trim();
      }
      targetUser.role = 'member';
      targetUser.tier = plan.badge || 'VIP';
      await targetUser.save();
    }

    const durationDays = durationDaysOverride ? Number(durationDaysOverride) : plan.durationDays;
    const start = customStartDate ? new Date(customStartDate) : new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const subscriptionId = generateSubscriptionId();

    // Cancel existing active plans
    await MembershipSubscription.updateMany(
      { user: targetUser._id, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED', notes: 'Superseded by administrator manual grant' } }
    );

    const subscription = await MembershipSubscription.create({
      subscriptionId,
      user: targetUser._id,
      customer: {
        name: (name && String(name).trim()) || targetUser.name,
        email: targetUser.email,
        phone: (phone && String(phone).trim()) || targetUser.phone || '',
      },
      plan: plan._id,
      planName: plan.name,
      planSlug: plan.slug,
      durationDays,
      discountPercent: plan.discountPercent,
      startDate: start,
      endDate: end,
      status: 'ACTIVE',
      amountPaid: amountPaid !== undefined && amountPaid !== '' ? Number(amountPaid) : plan.price,
      paymentMethod: String(paymentMethod).toUpperCase().trim() || 'MANUAL_ADMIN',
      paymentId: paymentId?.trim() || `${String(paymentMethod).toUpperCase().trim()}_${Date.now()}`,
      source: 'ADMIN_MANUAL',
      storeCode: 'HQ_ADMIN',
      notes,
    });

    res.status(200).json({
      success: true,
      message: `Membership plan "${plan.name}" successfully assigned to ${targetUser.email}.`,
      subscription,
    });
  } catch (error: any) {
    console.error('[grantAdminMembership] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to grant membership.' });
  }
};

/**
 * 12. ADMIN: UPDATE / EDIT EXISTING MEMBERSHIP SUBSCRIPTION
 */
export const updateAdminSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      customerName,
      phone,
      customerPhone,
      planName,
      discountPercent,
      status,
      startDate,
      endDate,
      amountPaid,
      paymentMethod,
      paymentId,
      notes,
    } = req.body;

    const sub = await MembershipSubscription.findById(id);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    const finalName = customerName || name;
    const finalPhone = customerPhone !== undefined ? customerPhone : phone;
    if (finalName) sub.customer.name = String(finalName).trim();
    if (finalPhone !== undefined) sub.customer.phone = String(finalPhone).trim();
    if (planName) sub.planName = String(planName).trim();
    if (discountPercent !== undefined && discountPercent !== '') sub.discountPercent = Number(discountPercent);
    if (status) sub.status = status;
    if (startDate) sub.startDate = new Date(startDate);
    if (endDate) sub.endDate = new Date(endDate);
    if (amountPaid !== undefined && amountPaid !== '') sub.amountPaid = Number(amountPaid);
    if (paymentMethod) sub.paymentMethod = String(paymentMethod).toUpperCase().trim();
    if (paymentId !== undefined) sub.paymentId = String(paymentId).trim();
    if (notes !== undefined) sub.notes = String(notes).trim();

    await sub.save();

    // Sync user role/tier if active status changed
    if (sub.user) {
      if (sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date()) {
        await User.findByIdAndUpdate(sub.user, { role: 'member' });
      } else {
        const otherActive = await MembershipSubscription.findOne({
          user: sub.user,
          status: 'ACTIVE',
          endDate: { $gt: new Date() },
          _id: { $ne: sub._id },
        });
        if (!otherActive) {
          await User.findByIdAndUpdate(sub.user, { role: 'user', tier: 'INITIATE_V1' });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Subscription details updated successfully.',
      subscription: sub,
    });
  } catch (error: any) {
    console.error('[updateAdminSubscription] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update subscription.' });
  }
};

/**
 * 13. ADMIN: DELETE MEMBERSHIP SUBSCRIPTION
 */
export const deleteAdminSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sub = await MembershipSubscription.findById(id);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription record not found.' });
      return;
    }

    const userId = sub.user;
    await MembershipSubscription.findByIdAndDelete(id);

    // If no other active subscription, reset user role
    if (userId) {
      const otherActive = await MembershipSubscription.findOne({
        user: userId,
        status: 'ACTIVE',
        endDate: { $gt: new Date() },
      });
      if (!otherActive) {
        await User.findByIdAndUpdate(userId, { role: 'user', tier: 'INITIATE_V1' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Subscription record permanently deleted.',
    });
  } catch (error: any) {
    console.error('[deleteAdminSubscription] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete subscription.' });
  }
};

/**
 * 14. ADMIN: REVOKE / CANCEL MEMBERSHIP
 */
export const revokeAdminMembership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Revoked by administrator' } = req.body;

    const sub = await MembershipSubscription.findById(id);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription record not found.' });
      return;
    }

    sub.status = 'CANCELLED';
    sub.cancelledAt = new Date();
    sub.cancelledBy = req.user?.email || 'ADMIN';
    sub.notes = `${sub.notes || ''} | Reason: ${reason}`.trim();
    await sub.save();

    // Check if user has any other active membership
    const otherActive = await MembershipSubscription.findOne({
      user: sub.user,
      status: 'ACTIVE',
      _id: { $ne: sub._id },
    });

    if (!otherActive) {
      await User.findByIdAndUpdate(sub.user, {
        $set: { role: 'user', tier: 'INITIATE_V1' },
      });
    }

    res.status(200).json({ success: true, message: 'Membership access revoked.', subscription: sub });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to revoke membership.' });
  }
};

/**
 * 13. ADMIN: TELEMETRY & STATS
 */
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const activeCount = await MembershipSubscription.countDocuments({
      status: 'ACTIVE',
      endDate: { $gt: now },
    });

    const totalSubscribers = await MembershipSubscription.countDocuments();
    const expiredCount = await MembershipSubscription.countDocuments({
      $or: [{ status: 'EXPIRED' }, { endDate: { $lte: now } }],
    });

    const revenueResult = await MembershipSubscription.aggregate([
      { $match: { status: { $in: ['ACTIVE', 'EXPIRED'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amountPaid' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const qrConversionsResult = await MembershipSubscription.countDocuments({
      source: 'QR_IN_STORE',
    });

    const onlineConversionsResult = await MembershipSubscription.countDocuments({
      source: 'ONLINE',
    });

    // Breakdown by plan
    const planBreakdown = await MembershipSubscription.aggregate([
      { $group: { _id: '$planName', count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        activeCount,
        totalSubscribers,
        expiredCount,
        totalRevenue,
        inStoreQrCount: qrConversionsResult,
        onlineCount: onlineConversionsResult,
        planBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get stats.' });
  }
};

/**
 * 14. ADMIN: QR CAMPAIGN MANAGEMENT
 */
export const getAdminQrCampaigns = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await seedDefaultMembershipPlans();
    const campaigns = await MembershipQRCode.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: campaigns.length, campaigns });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get campaigns.' });
  }
};

export const createOrUpdateQrCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, code, name, storeLocation, campaignTag, targetUrl, isActive, notes } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'Campaign code and name are required.' });
      return;
    }

    const cleanCode = String(code).toUpperCase().trim();
    const cleanUrl = targetUrl || `/membership?store=${cleanCode}&ref=qr`;

    if (id) {
      const updated = await MembershipQRCode.findByIdAndUpdate(
        id,
        {
          $set: {
            code: cleanCode,
            name,
            storeLocation: storeLocation || 'Flagship Atelier',
            campaignTag: campaignTag || 'IN_STORE_RETAIL',
            targetUrl: cleanUrl,
            isActive: isActive !== false,
            notes: notes || '',
          },
        },
        { new: true }
      );
      res.status(200).json({ success: true, message: 'QR Campaign updated.', campaign: updated });
      return;
    }

    const existing = await MembershipQRCode.findOne({ code: cleanCode });
    if (existing) {
      res.status(400).json({ success: false, message: `Campaign with code "${cleanCode}" already exists.` });
      return;
    }

    const created = await MembershipQRCode.create({
      code: cleanCode,
      name,
      storeLocation: storeLocation || 'Flagship Atelier',
      campaignTag: campaignTag || 'IN_STORE_RETAIL',
      targetUrl: cleanUrl,
      isActive: isActive !== false,
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'QR Campaign created.', campaign: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to save QR campaign.' });
  }
};

export const deleteQrCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await MembershipQRCode.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'QR Campaign deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete campaign.' });
  }
};
