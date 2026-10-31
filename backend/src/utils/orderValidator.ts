import { Product } from '../models/Product';
import { Coupon } from '../models/PromoModels';
import { SiteConfig } from '../models/Config';
import { Address } from '../models/Address';
import { IUser } from '../types';
import { getUserActiveMembership } from './membershipService';

export interface ValidatedOrderItem {
  productId: any;
  name: string;
  price: number;
  originalPrice: number;
  memberPrice?: number;
  memberDiscountApplied?: boolean;
  bogoTier?: string | null;
  bundleTag?: string;
  quantity: number;
  selectedSize: string;
  color: string;
  image: string;
}

export const parseNumericPrice = (val: any): number => {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.max(0, val) : 0;
  }
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export interface OrderValidationResult {
  verifiedItems: ValidatedOrderItem[];
  serverSubtotal: number;
  verifiedDiscount: number;
  verifiedMemberDiscount: number;
  memberPlanName?: string;
  isMemberOrder: boolean;
  verifiedShippingFee: number;
  verifiedCodFee: number;
  verifiedTax: number;
  finalTotal: number;
  cleanPhone: string;
  cleanPincode: string;
  verifiedAddressId: any;
  verifiedAddressType: string;
}

export const normalizeIndianPhone = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

export const validateAndCalculateOrder = async (
  user: IUser | undefined,
  body: any,
  isCod: boolean = false
): Promise<{ error?: string; statusCode?: number; result?: OrderValidationResult }> => {
  if (!user) {
    return { error: 'Authentication required to place an order.', statusCode: 401 };
  }

  const { customer, address, items, addressId: bodyAddressId, couponCode, deliveryOption } = body;

  if (!customer || !address || !Array.isArray(items) || items.length === 0) {
    return { error: 'Incomplete order payload. Customer, address, and items are required.', statusCode: 400 };
  }

  // 1. Phone number validation
  const cleanPhone = normalizeIndianPhone(customer.phone);
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { error: 'Please provide a valid 10-digit Indian phone number.', statusCode: 400 };
  }

  // 2. PIN code validation
  const cleanPincode = (address.pincode || '').trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
    return { error: 'Please provide a valid 6-digit Indian PIN code.', statusCode: 400 };
  }

  // 3. Address resolution
  const targetAddressId = bodyAddressId || address.addressId;
  let verifiedAddressId: any = null;
  let verifiedAddressType = address.addressType || 'Home';

  if (targetAddressId && user._id) {
    const verified = await Address.findOne({ _id: targetAddressId, user: user._id });
    if (verified) {
      verifiedAddressId = verified._id;
      verifiedAddressType = verified.addressType || verifiedAddressType;
    }
  }

  // 4. Fetch dynamic store configurations
  const shippingConfigDoc = await SiteConfig.findOne({ key: 'shipping-config' });
  const shippingConfig = shippingConfigDoc?.data || {};

  const gstConfigDoc = await SiteConfig.findOne({ key: 'gst-config' });
  const gstConfig = gstConfigDoc?.data || {};

  // 5. COD specific checks
  let verifiedCodFee = 0;
  if (isCod) {
    const codEnabled = shippingConfig.codEnabled !== false;
    if (!codEnabled) {
      return { error: 'Cash on Delivery is currently disabled by the store.', statusCode: 400 };
    }

    const blockedPins: string[] = Array.isArray(shippingConfig.blockedPincodes) ? shippingConfig.blockedPincodes : [];
    if (cleanPincode && blockedPins.includes(cleanPincode)) {
      return {
        error: `Cash on Delivery is unavailable for PIN code ${cleanPincode}. Please choose online payment.`,
        statusCode: 400,
      };
    }

    verifiedCodFee = shippingConfig.codHandlingFee !== undefined ? Number(shippingConfig.codHandlingFee) : 0;
  }

  // 6. Check active customer membership
  const activeMembership = await getUserActiveMembership(user?._id);
  let totalMemberSavings = 0;

  // 7. Validate items against database products & calculate serverSubtotal
  const verifiedItems: ValidatedOrderItem[] = [];
  let serverSubtotal = 0;

  for (const item of items) {
    const queryId = item.productId || item._id || item.id;
    let product = null;

    if (queryId && String(queryId).match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(queryId);
    }
    if (!product && item.slug) {
      product = await Product.findOne({ slug: String(item.slug).toLowerCase().trim() });
    }
    if (!product && item.name) {
      product = await Product.findOne({ name: String(item.name).trim() });
    }

    if (!product) {
      return {
        error: `Product "${item.name || queryId}" was not found in the atelier catalog.`,
        statusCode: 400,
      };
    }

    const availableStock = product.stock !== undefined ? Math.max(0, product.stock) : (product.inStock ? 999 : 0);

    if (product.inStock === false || availableStock <= 0) {
      return {
        error: `"${product.name}" is currently out of stock.`,
        statusCode: 400,
      };
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

    if (qty > availableStock) {
      return {
        error: availableStock > 0
          ? `Only ${availableStock} piece${availableStock === 1 ? '' : 's'} available for "${product.name}". You requested ${qty}.`
          : `"${product.name}" is currently out of stock.`,
        statusCode: 400,
      };
    }

    const numericBasePrice = parseNumericPrice(product.numericPrice) || parseNumericPrice(product.price) || parseNumericPrice(item.price);
    const numericDiscountPrice = parseNumericPrice(product.discountPrice);
    const discountPercent = parseNumericPrice(product.discountPercentage);

    let trustedUnitPrice = numericBasePrice;
    let trustedOriginalPrice = numericBasePrice;

    if (numericDiscountPrice > 0 && numericDiscountPrice < numericBasePrice) {
      trustedUnitPrice = numericDiscountPrice;
      trustedOriginalPrice = numericBasePrice;
    } else if (discountPercent > 0) {
      trustedUnitPrice = Math.round(numericBasePrice * (1 - discountPercent / 100));
      trustedOriginalPrice = numericBasePrice;
    } else {
      trustedUnitPrice = numericBasePrice;
      trustedOriginalPrice = numericBasePrice;
    }

    const clientOrig = parseNumericPrice(item.originalPrice);
    if (clientOrig > trustedOriginalPrice) {
      trustedOriginalPrice = clientOrig;
    }

    if (isNaN(trustedUnitPrice) || trustedUnitPrice < 0) {
      trustedUnitPrice = 0;
    }
    if (isNaN(trustedOriginalPrice) || trustedOriginalPrice < 0) {
      trustedOriginalPrice = trustedUnitPrice;
    }

    let memberDiscountApplied = false;
    let memberPrice = trustedUnitPrice;

    if (activeMembership.isActive && activeMembership.discountPercent > 0) {
      const planCategories = activeMembership.plan?.eligibleCategories || ['ALL'];
      const isEligibleCategory =
        planCategories.length === 0 ||
        planCategories.includes('ALL') ||
        (product.category && planCategories.some((c: string) => c.toLowerCase() === product.category?.toLowerCase()));

      if (isEligibleCategory) {
        const memberRate = activeMembership.discountPercent / 100;
        const computedMemberPrice = Math.round(numericBasePrice * (1 - memberRate));
        if (computedMemberPrice < trustedUnitPrice) {
          totalMemberSavings += (trustedUnitPrice - computedMemberPrice) * qty;
          memberPrice = computedMemberPrice;
          trustedUnitPrice = computedMemberPrice;
          memberDiscountApplied = true;
        }
      }
    }

    serverSubtotal += trustedUnitPrice * qty;

    const safeUnitPrice = Number.isFinite(trustedUnitPrice) && trustedUnitPrice >= 0 ? trustedUnitPrice : 0;
    const rawSafeOrig = Number.isFinite(trustedOriginalPrice) && trustedOriginalPrice >= safeUnitPrice
      ? trustedOriginalPrice
      : safeUnitPrice;
    const safeOrigPrice = Number.isFinite(rawSafeOrig) && rawSafeOrig >= 0 ? rawSafeOrig : safeUnitPrice;

    verifiedItems.push({
      productId: product._id,
      product: product._id,
      name: product.name,
      price: safeUnitPrice,
      originalPrice: safeOrigPrice,
      memberPrice: Number.isFinite(memberPrice) && memberPrice >= 0 ? memberPrice : safeUnitPrice,
      memberDiscountApplied,
      bogoTier: item.bogoTier || null,
      bundleTag: item.bundleTag || '',
      quantity: qty,
      selectedSize: item.selectedSize || 'M',
      color: item.color || product.color || 'Default',
      image: item.image || product.image_url || '',
    } as any);
  }

  if (isCod) {
    const maxCodValue = Number(shippingConfig.codMaxOrderValue) || 0;
    if (maxCodValue > 0 && serverSubtotal > maxCodValue) {
      return {
        error: `Cash on Delivery is only available for orders up to ₹${maxCodValue}.`,
        statusCode: 400,
      };
    }
  }

  // 7. Validate coupon from Coupon model
  let verifiedDiscount = 0;
  const cleanCouponCode = (couponCode || body.paymentDetails?.couponCode || '').trim().toUpperCase();

  if (cleanCouponCode) {
    const coupon = await Coupon.findOne({ code: cleanCouponCode, isActive: true });
    if (coupon) {
      const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
      const meetsMinOrder = serverSubtotal >= (coupon.minOrderValue || 0);

      if (isNotExpired && meetsMinOrder) {
        if (coupon.discountType === 'percentage') {
          verifiedDiscount = (serverSubtotal * coupon.discountAmount) / 100;
          if (coupon.maxDiscountAmount && verifiedDiscount > coupon.maxDiscountAmount) {
            verifiedDiscount = coupon.maxDiscountAmount;
          }
        } else {
          verifiedDiscount = Math.min(coupon.discountAmount, serverSubtotal);
        }
        verifiedDiscount = Math.round(verifiedDiscount * 100) / 100;
      }
    }
  }

  // 8. Shipping Fee calculation
  let verifiedShippingFee = 0;
  const freeThreshold = Number(shippingConfig.freeShippingThreshold) || 1999;
  const expressFee = shippingConfig.expressShippingFee !== undefined ? Number(shippingConfig.expressShippingFee) : 99;
  const standardFee = shippingConfig.standardShippingFee !== undefined ? Number(shippingConfig.standardShippingFee) : 50;

  const isComplimentarySelected =
    deliveryOption?.id === 'COMPLIMENTARY' ||
    deliveryOption === 'COMPLIMENTARY' ||
    deliveryOption?.type === 'free';

  if (isCod) {
    // COD is never eligible for complimentary free shipping
    verifiedShippingFee = expressFee;
  } else {
    if (activeMembership.isActive || serverSubtotal >= freeThreshold || isComplimentarySelected) {
      verifiedShippingFee = 0;
    } else {
      verifiedShippingFee = deliveryOption?.type === 'express' ? expressFee : standardFee;
    }
  }

  // 9. GST / Tax calculation
  let verifiedTax = 0;
  if (gstConfig.isEnabled && gstConfig.taxCalculation === 'exclusive') {
    const rate = Number(gstConfig.defaultGstRate) || 12;
    const taxableBase = Math.max(0, serverSubtotal - verifiedDiscount);
    verifiedTax = Math.round(((taxableBase * rate) / 100) * 100) / 100;
  }

  // 10. Final Total
  const finalTotal = Math.round(
    Math.max(0, serverSubtotal - verifiedDiscount + verifiedShippingFee + verifiedCodFee + verifiedTax) * 100
  ) / 100;

  return {
    result: {
      verifiedItems,
      serverSubtotal,
      verifiedDiscount,
      verifiedMemberDiscount: totalMemberSavings,
      memberPlanName: activeMembership.planName,
      isMemberOrder: activeMembership.isActive,
      verifiedShippingFee,
      verifiedCodFee,
      verifiedTax,
      finalTotal,
      cleanPhone,
      cleanPincode,
      verifiedAddressId,
      verifiedAddressType,
    },
  };
};

export const decrementProductStocks = async (
  items: ValidatedOrderItem[]
): Promise<{ success: boolean; failedItem?: string }> => {
  const decrementedItems: { productId: any; quantity: number }[] = [];

  for (const item of items) {
    if (item.productId) {
      try {
        // Atomic condition: only decrement if available stock >= requested quantity
        const updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity, stockCount: -item.quantity },
          },
          { new: true }
        );

        if (!updated) {
          // Concurrency race: stock was claimed by another customer
          // Rollback any items already decremented for this order transaction
          for (const dec of decrementedItems) {
            try {
              await Product.findByIdAndUpdate(dec.productId, {
                $inc: { stock: dec.quantity, stockCount: dec.quantity },
                $set: { inStock: true },
              });
            } catch (rErr) {
              console.error('Stock rollback error:', rErr);
            }
          }
          return {
            success: false,
            failedItem: item.name,
          };
        }

        // If stock drops to zero or below, update inStock to false
        if (typeof updated.stock === 'number' && updated.stock <= 0) {
          await Product.findByIdAndUpdate(item.productId, {
            $set: { inStock: false, stock: 0, stockCount: 0 },
          });
        }

        decrementedItems.push({ productId: item.productId, quantity: item.quantity });
      } catch (err) {
        console.error(`Failed to decrement stock for product ${item.productId}:`, err);
        return {
          success: false,
          failedItem: item.name,
        };
      }
    }
  }

  return { success: true };
};

export const restoreProductStocks = async (items: any[]): Promise<void> => {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    const pId = item.productId || item.product || item._id;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

    if (pId) {
      try {
        await Product.findByIdAndUpdate(pId, {
          $inc: { stock: qty, stockCount: qty },
          $set: { inStock: true },
        });
      } catch (err) {
        console.warn(`Failed restoring stock for product ${pId}:`, err);
      }
    }
  }
};

