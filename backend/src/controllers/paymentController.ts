import { Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { Order } from '../models/Order';
import { Address } from '../models/Address';
import { SiteConfig } from '../models/Config';
import { AuthRequest } from '../types';
import { validateAndCalculateOrder, decrementProductStocks } from '../utils/orderValidator';

// Helper: Normalize 10-digit Indian mobile
const normalizePhone = (phone: string): string => {
  const digitsOnly = (phone || '').replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return digitsOnly.slice(2);
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return digitsOnly.slice(1);
  return digitsOnly;
};

// Helper: Generate Unique Order ID & Tracking Ref (Unified)
const generateOrderIds = () => {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const id = `DPZ-${randomSuffix}`;
  return {
    orderId: id,
    trackingRef: id,
  };
};

/**
 * 1. CASH ON DELIVERY (COD) ORDER
 */
export const createCodOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to place an order.' });
      return;
    }

    const validation = await validateAndCalculateOrder(req.user, req.body, true);

    if (validation.error || !validation.result) {
      res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.error || 'COD Order validation failed.',
      });
      return;
    }

    const {
      verifiedItems,
      serverSubtotal,
      verifiedDiscount,
      verifiedMemberDiscount,
      memberPlanName,
      isMemberOrder,
      verifiedShippingFee,
      verifiedCodFee,
      verifiedTax,
      finalTotal,
      cleanPhone,
      cleanPincode,
      verifiedAddressId,
      verifiedAddressType,
    } = validation.result;

    const { customer, address, deliveryOption } = req.body;
    const { orderId, trackingRef } = generateOrderIds();

    const newOrder = await Order.create({
      orderId,
      user: req.user._id,
      customer: {
        firstName: customer.firstName || req.user.name?.split(' ')[0] || 'Client',
        lastName: customer.lastName || req.user.name?.split(' ').slice(1).join(' ') || '',
        email: req.user.email,
        phone: cleanPhone,
      },
      address: {
        line1: address.line1 || address.address || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        pincode: cleanPincode,
        country: address.country || 'India',
        addressId: verifiedAddressId,
        addressType: verifiedAddressType,
      },
      items: verifiedItems,
      total: finalTotal,
      tax: verifiedTax,
      codFee: verifiedCodFee,
      paymentDetails: {
        deliveryOption: deliveryOption || null,
        shippingFee: verifiedShippingFee,
        couponCode: (req.body.couponCode || '').toUpperCase().trim(),
        couponDiscount: verifiedDiscount,
        discountAmount: verifiedDiscount,
        memberDiscount: verifiedMemberDiscount || 0,
        memberPlanName: memberPlanName || '',
        isMemberOrder: Boolean(isMemberOrder),
        subtotal: serverSubtotal,
      },
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      paymentMethod: 'COD',
      trackingRef,
    });

    // Safely update inventory stock levels atomically
    const stockResult = await decrementProductStocks(verifiedItems);
    if (!stockResult.success) {
      await Order.findByIdAndDelete(newOrder._id);
      res.status(400).json({
        success: false,
        isOutOfStock: true,
        message: `Reservation failed: "${stockResult.failedItem}" was just claimed by another customer and is now out of stock.`,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'COD Order placed successfully.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('[PaymentController] COD order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating COD order.' });
  }
};

/**
 * 2. RAZORPAY — CREATE ORDER
 */
export const createRazorpayOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to initiate payment.' });
      return;
    }

    let calculatedAmount = parseFloat(req.body.amount) || 0;

    // If full cart order payload is provided, calculate trusted server total
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      const validation = await validateAndCalculateOrder(req.user, req.body, false);
      if (validation.result) {
        calculatedAmount = validation.result.finalTotal;
      }
    }

    if (!calculatedAmount || isNaN(calculatedAmount) || calculatedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
      return;
    }

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      res.status(500).json({ success: false, message: 'Razorpay credentials not configured on server.' });
      return;
    }

    const amountInPaise = Math.round(calculatedAmount * 100);
    const orderReceipt = req.body.receipt || `rcpt_${Math.floor(100000 + Math.random() * 900000)}`;

    const authHeader = 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderReceipt,
        notes: {
          platform: 'DRAPZA Luxury Outerwear',
          userId: req.user._id.toString(),
          userEmail: req.user.email,
        },
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('[PaymentController] Razorpay order creation failed:', data);
      res.status(response.status).json({
        success: false,
        message: data?.error?.description || 'Failed to initialize Razorpay transaction.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: env.RAZORPAY_KEY_ID, // Only public key is shared
    });
  } catch (error: any) {
    console.error('[PaymentController] createRazorpayOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error initializing Razorpay.' });
  }
};

/**
 * 3. RAZORPAY — VERIFY PAYMENT & CONFIRM ORDER
 */
export const verifyRazorpayPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to confirm payment.' });
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderDetails) {
      res.status(400).json({ success: false, message: 'Incomplete Razorpay verification payload.' });
      return;
    }

    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid transaction signature.',
      });
      return;
    }

    // Prevent duplicate orders
    const existingOrder = await Order.findOne({
      'paymentDetails.razorpayPaymentId': razorpay_payment_id,
    });

    if (existingOrder) {
      res.status(200).json({
        success: true,
        message: 'Order already verified.',
        order: existingOrder,
      });
      return;
    }

    // Validate prices, stock, coupon, tax against database
    const validation = await validateAndCalculateOrder(req.user, orderDetails, false);
    if (validation.error || !validation.result) {
      res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.error || 'Payment verification order data validation failed.',
      });
      return;
    }

    const {
      verifiedItems,
      serverSubtotal,
      verifiedDiscount,
      verifiedMemberDiscount,
      memberPlanName,
      isMemberOrder,
      verifiedShippingFee,
      verifiedTax,
      finalTotal,
      cleanPhone,
      cleanPincode,
      verifiedAddressId,
      verifiedAddressType,
    } = validation.result;

    const { customer, address } = orderDetails;
    const { orderId, trackingRef } = generateOrderIds();

    const confirmedOrder = await Order.create({
      orderId,
      user: req.user._id,
      customer: {
        firstName: customer?.firstName || req.user.name?.split(' ')[0] || 'Client',
        lastName: customer?.lastName || req.user.name?.split(' ').slice(1).join(' ') || '',
        email: req.user.email,
        phone: cleanPhone,
      },
      address: {
        line1: address?.line1 || address?.address || '',
        line2: address?.line2 || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: cleanPincode,
        country: address?.country || 'India',
        addressId: verifiedAddressId,
        addressType: verifiedAddressType,
      },
      items: verifiedItems,
      total: finalTotal,
      tax: verifiedTax,
      codFee: 0,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      paymentDetails: {
        gateway: 'RAZORPAY',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        couponCode: (orderDetails.couponCode || '').toUpperCase().trim(),
        couponDiscount: verifiedDiscount,
        discountAmount: verifiedDiscount,
        memberDiscount: verifiedMemberDiscount || 0,
        memberPlanName: memberPlanName || '',
        isMemberOrder: Boolean(isMemberOrder),
        subtotal: serverSubtotal,
        shippingFee: verifiedShippingFee,
        verifiedAt: new Date().toISOString(),
      },
      trackingRef,
    });

    // Safely update product stock levels atomically
    const stockResult = await decrementProductStocks(verifiedItems);
    if (!stockResult.success) {
      await Order.findByIdAndDelete(confirmedOrder._id);
      res.status(400).json({
        success: false,
        isOutOfStock: true,
        message: `Reservation failed: "${stockResult.failedItem}" was just claimed by another customer and is now out of stock.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order: confirmedOrder,
    });
  } catch (error: any) {
    console.error('[PaymentController] verifyRazorpayPayment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error verifying Razorpay payment.' });
  }
};

/**
 * 4. CASHFREE — CREATE ORDER
 */
export const createCashfreeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to initiate payment.' });
      return;
    }

    let calculatedAmount = parseFloat(req.body.amount) || 0;

    // If full cart order payload is provided, calculate trusted server total
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      const validation = await validateAndCalculateOrder(req.user, req.body, false);
      if (validation.result) {
        calculatedAmount = validation.result.finalTotal;
      }
    }

    if (!calculatedAmount || isNaN(calculatedAmount) || calculatedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid amount is required.' });
      return;
    }

    if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
      res.status(500).json({ success: false, message: 'Cashfree credentials not configured on server.' });
      return;
    }

    const isTest = (env.CASHFREE_ENV || 'TEST').toUpperCase() === 'TEST';
    const baseUrl = isTest
      ? 'https://sandbox.cashfree.com/pg/orders'
      : 'https://api.cashfree.com/pg/orders';

    const cleanPhone = normalizePhone(req.body.customer?.phone || req.user.phone || '9999999999');
    const orderId = `CF_${Math.floor(100000 + Math.random() * 900000)}_${Date.now().toString().slice(-4)}`;
    const customerId = `cust_${cleanPhone}_${Date.now().toString().slice(-4)}`;

    const frontendBase = (env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

    const payload = {
      order_id: orderId,
      order_amount: Math.round(calculatedAmount * 100) / 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: (req.user.name || `${req.body.customer?.firstName || 'Client'} ${req.body.customer?.lastName || ''}`).trim(),
        customer_email: req.user.email,
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: `${frontendBase}/checkout/payment?cf_order_id={order_id}`,
      },
      order_note: 'DRAPZA Atelier Purchase',
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-client-id': env.CASHFREE_APP_ID,
        'x-client-secret': env.CASHFREE_SECRET_KEY,
        'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('[PaymentController] Cashfree order creation failed:', data);
      res.status(response.status).json({
        success: false,
        message: data?.message || 'Failed to initialize Cashfree transaction.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
      cfEnv: env.CASHFREE_ENV || 'TEST',
    });
  } catch (error: any) {
    console.error('[PaymentController] createCashfreeOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error initializing Cashfree.' });
  }
};

/**
 * 5. CASHFREE — VERIFY PAYMENT & CONFIRM ORDER
 */
export const verifyCashfreePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to confirm payment.' });
      return;
    }

    const { cf_order_id, orderDetails } = req.body;

    if (!cf_order_id || !orderDetails) {
      res.status(400).json({ success: false, message: 'Incomplete Cashfree verification payload.' });
      return;
    }

    // Prevent duplicate orders
    const existingOrder = await Order.findOne({
      'paymentDetails.cashfreeOrderId': cf_order_id,
    });

    if (existingOrder) {
      res.status(200).json({
        success: true,
        message: 'Order already verified.',
        order: existingOrder,
      });
      return;
    }

    const isTest = (env.CASHFREE_ENV || 'TEST').toUpperCase() === 'TEST';
    const baseUrl = isTest
      ? `https://sandbox.cashfree.com/pg/orders/${cf_order_id}`
      : `https://api.cashfree.com/pg/orders/${cf_order_id}`;

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'x-client-id': env.CASHFREE_APP_ID,
        'x-client-secret': env.CASHFREE_SECRET_KEY,
        'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
      },
    });

    const data: any = await response.json();

    if (!response.ok || data.order_status !== 'PAID') {
      res.status(400).json({
        success: false,
        message: `Cashfree payment not completed. Status: ${data.order_status || 'UNKNOWN'}`,
      });
      return;
    }

    // Validate prices, stock, coupon, tax against database
    const validation = await validateAndCalculateOrder(req.user, orderDetails, false);
    if (validation.error || !validation.result) {
      res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.error || 'Payment verification order data validation failed.',
      });
      return;
    }

    const {
      verifiedItems,
      serverSubtotal,
      verifiedDiscount,
      verifiedMemberDiscount,
      memberPlanName,
      isMemberOrder,
      verifiedShippingFee,
      verifiedTax,
      finalTotal,
      cleanPhone,
      cleanPincode,
      verifiedAddressId,
      verifiedAddressType,
    } = validation.result;

    const { customer, address } = orderDetails;
    const { orderId, trackingRef } = generateOrderIds();

    const confirmedOrder = await Order.create({
      orderId,
      user: req.user._id,
      customer: {
        firstName: customer?.firstName || req.user.name?.split(' ')[0] || 'Client',
        lastName: customer?.lastName || req.user.name?.split(' ').slice(1).join(' ') || '',
        email: req.user.email,
        phone: cleanPhone,
      },
      address: {
        line1: address?.line1 || address?.address || '',
        line2: address?.line2 || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: cleanPincode,
        country: address?.country || 'India',
        addressId: verifiedAddressId,
        addressType: verifiedAddressType,
      },
      items: verifiedItems,
      total: finalTotal,
      tax: verifiedTax,
      codFee: 0,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CASHFREE',
      paymentDetails: {
        gateway: 'CASHFREE',
        cashfreeOrderId: cf_order_id,
        cashfreeOrderStatus: data.order_status,
        couponCode: (orderDetails.couponCode || '').toUpperCase().trim(),
        couponDiscount: verifiedDiscount,
        discountAmount: verifiedDiscount,
        memberDiscount: verifiedMemberDiscount || 0,
        memberPlanName: memberPlanName || '',
        isMemberOrder: Boolean(isMemberOrder),
        subtotal: serverSubtotal,
        shippingFee: verifiedShippingFee,
        verifiedAt: new Date().toISOString(),
      },
      trackingRef,
    });

    // Safely update product stock levels atomically
    const stockResult = await decrementProductStocks(verifiedItems);
    if (!stockResult.success) {
      await Order.findByIdAndDelete(confirmedOrder._id);
      res.status(400).json({
        success: false,
        isOutOfStock: true,
        message: `Reservation failed: "${stockResult.failedItem}" was just claimed by another customer and is now out of stock.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cashfree payment verified and order placed.',
      order: confirmedOrder,
    });
  } catch (error: any) {
    console.error('[PaymentController] verifyCashfreePayment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error verifying Cashfree payment.' });
  }
};
