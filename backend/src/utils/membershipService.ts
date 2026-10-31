import { MembershipPlan, MembershipSubscription, MembershipQRCode, IMembershipSubscription, IMembershipPlan } from '../models/Membership';
import { User } from '../models/User';
import { Types } from 'mongoose';

export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    name: '6 Months',
    slug: '6-months',
    durationMonths: 6,
    durationDays: 180,
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    badge: 'SILVER',
    badgeColor: '#4A4A4A',
    benefits: [
      'Special member pricing',
      'Exclusive offers',
      'Priority support',
    ],
    eligibleCategories: ['ALL'],
    isActive: true,
    sortOrder: 1,
  },
  {
    name: '1 Year',
    slug: '1-year',
    durationMonths: 12,
    durationDays: 365,
    price: 1699,
    originalPrice: 2499,
    discountPercent: 32,
    badge: 'GOLD',
    badgeColor: '#B8860B',
    benefits: [
      'Special member pricing',
      'Exclusive offers',
      'Priority support',
    ],
    eligibleCategories: ['ALL'],
    isActive: true,
    sortOrder: 2,
  },
  {
    name: '5 Years',
    slug: '5-years',
    durationMonths: 60,
    durationDays: 1825,
    price: 6999,
    originalPrice: 11999,
    discountPercent: 42,
    badge: 'PLATINUM',
    badgeColor: '#000000',
    benefits: [
      'Special member pricing',
      'Exclusive offers',
      'Priority support',
    ],
    eligibleCategories: ['ALL'],
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * Ensures default membership plans and default in-store QR code campaign exist in database
 */
export async function seedDefaultMembershipPlans(): Promise<void> {
  try {
    for (const plan of DEFAULT_MEMBERSHIP_PLANS) {
      await MembershipPlan.findOneAndUpdate(
        { slug: plan.slug },
        {
          $set: {
            name: plan.name,
            durationMonths: plan.durationMonths,
            durationDays: plan.durationDays,
            price: plan.price,
            originalPrice: plan.originalPrice,
            discountPercent: plan.discountPercent,
            badge: plan.badge,
            badgeColor: plan.badgeColor,
            benefits: plan.benefits,
            eligibleCategories: plan.eligibleCategories,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log('[MembershipService] Synced default membership plans.');

    const qrCount = await MembershipQRCode.countDocuments();
    if (qrCount === 0) {
      await MembershipQRCode.create({
        code: 'FLAGSHIP-MAIN',
        name: 'DRAPZA Flagship Atelier - Concierge Desk',
        storeLocation: 'Flagship Showroom',
        campaignTag: 'IN_STORE_MEMBERSHIP',
        targetUrl: '/membership?store=FLAGSHIP-MAIN&ref=qr',
        scansCount: 0,
        conversionsCount: 0,
        isActive: true,
        notes: 'Official in-store QR placard at the primary retail lounge counter.',
      });
      console.log('[MembershipService] Seeded default in-store QR campaign.');
    }
  } catch (err) {
    console.error('[MembershipService] seedDefaultMembershipPlans error:', err);
  }
}

/**
 * Returns active membership for a given user, auto-expiring expired subscriptions.
 */
export async function getUserActiveMembership(
  userId: string | Types.ObjectId | undefined
): Promise<{
  isActive: boolean;
  subscription?: IMembershipSubscription;
  plan?: IMembershipPlan;
  discountPercent: number;
  planName?: string;
  badge?: string;
  daysRemaining?: number;
}> {
  if (!userId) {
    return { isActive: false, discountPercent: 0 };
  }

  try {
    const subscription = await MembershipSubscription.findOne({
      user: userId,
      status: 'ACTIVE',
    }).populate('plan');

    if (!subscription) {
      return { isActive: false, discountPercent: 0 };
    }

    const now = new Date();
    if (new Date(subscription.endDate) <= now) {
      // Auto-expire
      subscription.status = 'EXPIRED';
      await subscription.save();
      return { isActive: false, discountPercent: 0 };
    }

    const plan = subscription.plan as any as IMembershipPlan;
    const discountPercent = subscription.discountPercent || (plan ? plan.discountPercent : 0);
    const msLeft = new Date(subscription.endDate).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    return {
      isActive: true,
      subscription,
      plan,
      discountPercent,
      planName: subscription.planName,
      badge: plan?.badge || 'VIP',
      daysRemaining,
    };
  } catch (err) {
    console.error('[MembershipService] getUserActiveMembership error:', err);
    return { isActive: false, discountPercent: 0 };
  }
}

/**
 * Checks if a product is eligible for membership discount and computes the member price.
 */
export function calculateMemberProductPricing(
  product: any,
  activeMembership: {
    isActive: boolean;
    discountPercent: number;
    planName?: string;
    badge?: string;
  }
): {
  isMember: boolean;
  memberDiscountPercent: number;
  memberPrice: number;
  savings: number;
  isEligible: boolean;
} {
  const basePrice =
    typeof product.numericPrice === 'number' && product.numericPrice > 0
      ? product.numericPrice
      : typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price || 0).replace(/[^\d.]/g, '')) || 0;

  // If product already has a promotional discountPrice
  let sellingPrice = basePrice;
  const promoPrice = typeof product.discountPrice === 'number' ? product.discountPrice : 0;
  if (promoPrice > 0 && promoPrice < basePrice) {
    sellingPrice = promoPrice;
  }

  if (!activeMembership || !activeMembership.isActive || activeMembership.discountPercent <= 0) {
    return {
      isMember: false,
      memberDiscountPercent: 0,
      memberPrice: sellingPrice,
      savings: 0,
      isEligible: false,
    };
  }

  // Calculate member price based on base price or current selling price
  // Member discount applies to base price (or selling price if lower)
  const discountRate = activeMembership.discountPercent / 100;
  const rawDiscounted = Math.round(basePrice * (1 - discountRate));
  const memberPrice = Math.min(sellingPrice, rawDiscounted);
  const savings = Math.max(0, sellingPrice - memberPrice);

  return {
    isMember: true,
    memberDiscountPercent: activeMembership.discountPercent,
    memberPrice,
    savings,
    isEligible: true,
  };
}

/**
 * Generate a unique subscription reference
 */
export function generateSubscriptionId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `DPZ-MEM-${rand}`;
}

