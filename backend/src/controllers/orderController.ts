import { Response } from 'express';
import { Order } from '../models/Order';
import { Return } from '../models/Return';
import { Address } from '../models/Address';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { validateAndCalculateOrder, decrementProductStocks, restoreProductStocks } from '../utils/orderValidator';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to place an order.' });
      return;
    }

    const isCod = (req.body.paymentMethod || 'COD').toUpperCase() === 'COD';
    const validation = await validateAndCalculateOrder(req.user, req.body, isCod);

    if (validation.error || !validation.result) {
      res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.error || 'Order validation failed.',
      });
      return;
    }

    const {
      verifiedItems,
      serverSubtotal,
      verifiedDiscount,
      verifiedShippingFee,
      verifiedCodFee,
      verifiedTax,
      finalTotal,
      cleanPhone,
      cleanPincode,
      verifiedAddressId,
      verifiedAddressType,
    } = validation.result;

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `DPZ-${randomSuffix}`;
    const trackingRef = orderId;

    const { customer, address, paymentMethod, deliveryOption } = req.body;

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
        subtotal: serverSubtotal,
      },
      status: 'CONFIRMED',
      paymentStatus: isCod ? 'PENDING' : 'PAID',
      paymentMethod: paymentMethod || 'COD',
      trackingRef,
    });

    // Safely update product stock levels atomically
    const stockResult = await decrementProductStocks(verifiedItems);
    if (!stockResult.success) {
      // Delete the unreserved draft order
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
      message: 'Order created successfully.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized.' });
      return;
    }

    const rawOrders = await Order.find({
      $or: [
        { user: req.user._id },
        { 'customer.email': req.user.email.toLowerCase() },
      ],
    }).sort({ createdAt: -1 }).lean();

    // Attach active return / exchange request to each order so Profile shows the unified return tracking ID
    const orderRefs = rawOrders.map((o) => o.orderId);
    const returns = await Return.find({ orderRef: { $in: orderRefs } }).lean();
    const returnMap = new Map();
    returns.forEach((r) => returnMap.set(r.orderRef, r));

    const orders = rawOrders.map((o: any) => ({
      ...o,
      trackingRef: o.orderId, // Guaranteed unified tracking ID
      returnRequest: returnMap.get(o.orderId) || null,
    }));

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    let order = await Order.findOne({ orderId: id });
    if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Customer can only inspect their own orders; Admin can inspect any order
    if (req.user && req.user.role !== 'admin') {
      const isOwner =
        (order.user && order.user.toString() === req.user._id.toString()) ||
        (order.customer?.email && order.customer.email.toLowerCase() === req.user.email.toLowerCase());

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You may only inspect orders belonging to your account.',
        });
        return;
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const trackOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trackingRef = String(req.params.trackingRef || '');
    const cleanRef = trackingRef.trim().toUpperCase();
    // Normalize by stripping any EXC-, RET-, or TRK- prefix to match the underlying order
    const normalizedRef = cleanRef.replace(/^(EXC-|RET-|TRK-)/, '');

    const order = await Order.findOne({
      $or: [
        { trackingRef: cleanRef },
        { trackingRef: normalizedRef },
        { orderId: cleanRef },
        { orderId: normalizedRef },
        { orderId: `DPZ-${cleanRef}` },
        { orderId: `DPZ-${normalizedRef}` },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: `No active consignment found for identifier: ${trackingRef}`,
      });
      return;
    }

    // Ensure unified tracking ID
    (order as any).trackingRef = order.orderId;

    // Attach active return or exchange dossier if one exists for this order
    const returnRequest = await Return.findOne({
      $or: [
        { orderRef: order.orderId },
        { returnId: cleanRef },
        { returnId: normalizedRef },
        { returnId: order.orderId },
      ],
    }).lean();

    if (order.status === 'CANCELLED') {
      const checkpoints = [
        { title: 'Order Registered', desc: 'Consignment entered in atelier ledger', done: true },
        {
          title: 'Order Cancelled',
          desc: (order as any).cancellationReason
            ? `Consignment revoked: ${(order as any).cancellationReason}`
            : 'Consignment revoked by client prior to dispatch',
          done: true,
          active: true,
        },
      ];

      res.status(200).json({
        success: true,
        order,
        checkpoints,
        returnRequest: returnRequest || null,
      });
      return;
    }

    const statusMap: Record<string, number> = {
      PENDING: 1,
      CONFIRMED: 2,
      TAILORING: 3,
      QUALITY_CHECK: 3,
      DISPATCHED: 4,
      OUT_FOR_DELIVERY: 5,
      DELIVERED: 5,
    };
    const currentStep = statusMap[order.status] || 2;

    const checkpoints = [
      { title: 'Order Confirmed', desc: 'Atelier registered and material assigned', done: currentStep >= 1 },
      { title: 'Tailoring & Construction', desc: 'Modular seam sealing & craftsmanship', done: currentStep >= 2 },
      { title: 'Quality Control Inspection', desc: 'Passed waterproof & stress standards', done: currentStep >= 3 },
      { title: 'Dispatched to Air Freight', desc: 'Handed to premium courier dispatch', done: currentStep >= 4 },
      { title: 'Out for Final Delivery', desc: 'Arriving at destination address', done: currentStep >= 5 },
    ];

    res.status(200).json({
      success: true,
      order,
      checkpoints,
      returnRequest: returnRequest || null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [orders, totalProducts, totalUsers] = await Promise.all([
      Order.find().lean(),
      Product.countDocuments(),
      User.countDocuments(),
    ]);

    const totalOrders = orders.length;
    let totalRevenue = 0;
    const statusCounts = {
      placed: 0,
      delivered: 0,
      dispatched: 0,
      cancelled: 0,
    };

    orders.forEach((o: any) => {
      const orderTotal = Number(o.total || o.totalPrice || 0);
      const st = String(o.status || o.orderStatus || '').toUpperCase();

      if (st !== 'CANCELLED') {
        totalRevenue += orderTotal;
      }

      if (st === 'DELIVERED') {
        statusCounts.delivered += 1;
      } else if (st === 'CANCELLED') {
        statusCounts.cancelled += 1;
      } else if (st === 'DISPATCHED' || st === 'OUT_FOR_DELIVERY') {
        statusCounts.dispatched += 1;
      } else {
        statusCounts.placed += 1;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
        statusCounts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getAllOrdersAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rawOrders = await Order.find().sort({ createdAt: -1 }).limit(limit).lean();

    const orders = rawOrders.map((o: any) => ({
      ...o,
      orderNumber: o.orderNumber || o.orderId,
      trackingNumber: o.orderId,
      trackingRef: o.orderId,
      orderStatus: o.orderStatus || o.status,
      totalPrice: o.totalPrice || o.total,
      shippingAddress: o.shippingAddress || {
        fullName: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : 'Client',
        phone: o.customer?.phone || '',
        email: o.customer?.email || '',
        city: o.address?.city || '',
        state: o.address?.state || '',
        pincode: o.address?.pincode || '',
        addressLine1: o.address?.line1 || '',
        addressLine2: o.address?.line2 || '',
      },
    }));

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateOrderStatusAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { orderStatus, status } = req.body;
    const targetStatus = String(orderStatus || status || '').toUpperCase();

    let order = await Order.findOne({ orderId: id });
    if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    order.status = targetStatus as any;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '').trim();
    const { reason, email, phone } = req.body || {};

    let order = await Order.findOne({
      $or: [
        { orderId: id },
        { orderId: `DPZ-${id}` },
        { trackingRef: id },
      ],
    });

    if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      res.status(404).json({ success: false, message: `Order #${id} not found.` });
      return;
    }

    // Authorization verification
    if (req.user) {
      const isOwner =
        (order.user && order.user.toString() === req.user._id.toString()) ||
        order.customer.email.toLowerCase() === req.user.email.toLowerCase();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'You are not authorized to cancel this order.' });
        return;
      }
    } else {
      // Guest verification: check email or phone if provided
      const guestEmail = (email || '').trim().toLowerCase();
      const guestPhone = (phone || '').replace(/\D/g, '');
      const orderPhone = (order.customer?.phone || '').replace(/\D/g, '');

      if (guestEmail && guestEmail !== order.customer.email.toLowerCase()) {
        res.status(403).json({ success: false, message: 'The provided email does not match the order record.' });
        return;
      }
      if (guestPhone && orderPhone && !orderPhone.endsWith(guestPhone) && !guestPhone.endsWith(orderPhone)) {
        res.status(403).json({ success: false, message: 'The provided phone number does not match the order record.' });
        return;
      }
    }

    // State validation
    const currentStatus = String(order.status || '').toUpperCase();
    if (currentStatus === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'This order has already been cancelled.' });
      return;
    }

    const nonCancellable = ['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED'];
    if (nonCancellable.includes(currentStatus)) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${currentStatus.toLowerCase().replace(/_/g, ' ')}. Please initiate a return or exchange after delivery.`,
      });
      return;
    }

    // Cancel order
    order.status = 'CANCELLED';
    (order as any).cancellationReason = (reason || 'Revocation requested by customer').trim();
    (order as any).cancelledAt = new Date();
    (order as any).cancelledBy = req.user && req.user.role === 'admin' ? 'ADMIN' : 'CUSTOMER';

    // Refund tracking note if prepaid
    if (order.paymentStatus === 'PAID') {
      const existingDetails = order.paymentDetails || {};
      order.paymentDetails = {
        ...existingDetails,
        refundStatus: 'ESCROW_REFUND_INITIATED',
        refundAmount: order.total,
        refundInitiatedAt: new Date().toISOString(),
        refundMethod: order.paymentMethod,
        refundNote: '100% Escrow refund credited to original payment source (2-4 business days).',
      };
      order.markModified('paymentDetails');
    }

    await order.save();

    // Restore reserved inventory stock back into catalog
    await restoreProductStocks(order.items);

    res.status(200).json({
      success: true,
      message: `Order #${order.orderId} has been successfully cancelled.`,
      order,
    });
  } catch (error: any) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};
