import { Request, Response } from 'express';
import { Return } from '../models/Return';
import { Order } from '../models/Order';
import { AuthRequest } from '../types';
import { sendCircularEmail } from '../utils/mailer';

// Generate unified return reference ID matching order tracking reference
const generateReturnId = (orderRef?: string, type: 'return' | 'exchange' = 'return'): string => {
  if (orderRef) {
    return String(orderRef).trim().toUpperCase();
  }
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `DPZ-${rand}`;
};

/**
 * @desc Check whether an order reference is eligible for return or exchange
 * @route GET /api/returns/validate-eligibility/:ref
 */
export const validateOrderEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRef = String(req.params.ref || '').trim().toUpperCase();
    if (!rawRef) {
      res.status(400).json({ success: false, message: 'Order reference is required.' });
      return;
    }

    const order = await Order.findOne({
      $or: [
        { orderId: rawRef },
        { trackingRef: rawRef },
        ...(rawRef.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: rawRef }] : []),
      ],
    }).lean();

    if (!order) {
      res.status(404).json({
        success: false,
        message: `Order #${rawRef} was not found in atelier records.`,
      });
      return;
    }

    const st = String(order.status || '').toUpperCase();
    const isCancelled = st === 'CANCELLED';
    const isDelivered = st === 'DELIVERED';
    const isInTransit = ['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(st);
    const isAtelier = ['PENDING', 'CONFIRMED', 'PROCESSING', 'TAILORING', 'QUALITY_CHECK'].includes(st);

    // Cancel eligibility: only during atelier pre-dispatch
    const isCancelEligible = isAtelier && !isCancelled;

    // Return & Exchange eligibility: only delivered within 14 days
    const deliveryDate = (order as any).updatedAt || (order as any).createdAt;
    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24));
    const isWithin14Days = daysSinceDelivery <= 14;

    const existingActiveReturn = await Return.findOne({
      orderRef: order.orderId,
      status: { $in: ['pending_review', 'approved', 'pickup_scheduled', 'received'] },
    }).lean();

    let returnEligible = false;
    let reasonMessage = '';

    if (isCancelled) {
      returnEligible = false;
      reasonMessage = 'Order has been cancelled and cannot be returned or exchanged.';
    } else if (existingActiveReturn) {
      returnEligible = false;
      reasonMessage = `An active ${existingActiveReturn.requestType} dossier (${existingActiveReturn.returnId}) is already in review.`;
    } else if (isAtelier) {
      returnEligible = false;
      reasonMessage = `Order is currently in the atelier phase (${st}). You may cancel and re-order before dispatch, or request return/exchange once delivered.`;
    } else if (isInTransit) {
      returnEligible = false;
      reasonMessage = 'Consignment is in transit with courier. Return/Exchange protocol unlocks upon doorstep delivery.';
    } else if (isDelivered) {
      if (isWithin14Days) {
        returnEligible = true;
        reasonMessage = `Eligible for complimentary exchange or return (${14 - daysSinceDelivery} days remaining).`;
      } else {
        returnEligible = false;
        reasonMessage = 'The 14-day policy window for return/exchange has expired.';
      }
    } else {
      returnEligible = false;
      reasonMessage = `Order status (${st}) is not eligible for return or exchange.`;
    }

    res.status(200).json({
      success: true,
      orderId: order.orderId,
      status: st,
      isCancelEligible,
      returnEligible,
      daysSinceDelivery,
      daysRemaining: Math.max(0, 14 - daysSinceDelivery),
      existingReturn: existingActiveReturn ? existingActiveReturn.returnId : null,
      message: reasonMessage,
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

/**
 * @desc Get Return & Exchange requests with filters and stats
 * @route GET /api/returns
 * @access Admin / Private
 */
export const getReturnRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, search, page = '1', limit = '100' } = req.query;

    const query: Record<string, any> = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (type && type !== 'ALL') {
      query.requestType = type;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      query.$or = [
        { returnId: { $regex: term, $options: 'i' } },
        { orderRef: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { customerEmail: { $regex: term, $options: 'i' } },
        { customerPhone: { $regex: term, $options: 'i' } },
        { courierAwb: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      Return.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Return.countDocuments(query),
    ]);

    // Aggregate stats across all return requests
    const allRequests = await Return.find({}, 'status refundAmount requestType').lean();

    const stats = {
      total: allRequests.length,
      pending_review: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      pickup_scheduled: { count: 0, totalAmount: 0 },
      received: { count: 0, totalAmount: 0 },
      refunded: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
    };

    allRequests.forEach((r) => {
      const amt = Number(r.refundAmount) || 0;
      const st = r.status as keyof typeof stats;
      if (st && st !== 'total' && stats[st]) {
        stats[st].count += 1;
        stats[st].totalAmount += amt;
      }
    });

    const responsePayload = {
      success: true,
      data: {
        requests,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
        stats,
      },
      requests,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      stats,
    };

    res.status(200).json(responsePayload);
  } catch (err: any) {
    console.error('[GET RETURNS ERROR]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch returns' });
  }
};

/**
 * @desc Get single return dossier
 * @route GET /api/returns/:id
 */
export const getReturnById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '');
    const reqDoc = await Return.findOne({
      $or: [{ _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null }, { returnId: rawId }],
    });

    if (!reqDoc) {
      res.status(404).json({ success: false, message: 'Return dossier not found.' });
      return;
    }

    res.status(200).json({ success: true, request: reqDoc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Create a new Return or Exchange request (Customer or Admin Manual Intake)
 * @route POST /api/returns
 */
export const createReturnRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      orderRef,
      customerName,
      customerEmail,
      customerPhone,
      requestType = 'return',
      exchangeSize,
      items = [],
      pickupAddress,
      refundAmount,
      adminNotes,
    } = req.body;

    if (!orderRef || !customerName || !customerEmail) {
      res.status(400).json({
        success: false,
        message: 'Order reference, customer name, and email are mandatory.',
      });
      return;
    }

    // Validate order status and return eligibility if matching order exists
    const cleanRef = String(orderRef).trim().toUpperCase();
    const existingOrder = await Order.findOne({
      $or: [
        { orderId: cleanRef },
        { trackingRef: cleanRef },
        ...(orderId && String(orderId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : []),
      ],
    });

    if (existingOrder) {
      const st = String(existingOrder.status || '').toUpperCase();

      // Rule 1: CANCELLED order cannot be returned or exchanged
      if (st === 'CANCELLED') {
        res.status(400).json({
          success: false,
          message: 'Cannot initiate return or exchange for an order that has been cancelled.',
        });
        return;
      }

      // Rule 2: Pre-dispatch (atelier) or In-transit orders cannot be returned yet
      if (st !== 'DELIVERED') {
        if (['PENDING', 'CONFIRMED', 'PROCESSING', 'TAILORING', 'QUALITY_CHECK'].includes(st)) {
          res.status(400).json({
            success: false,
            message: `This order is currently in the atelier (${st}) and has not been delivered. You can cancel this order before dispatch, or request return/exchange after delivery.`,
          });
          return;
        }
        if (['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(st)) {
          res.status(400).json({
            success: false,
            message: 'Consignment is in transit with courier. Return/Exchange protocol unlocks once doorstep delivery is completed.',
          });
          return;
        }
      }

      // Rule 3: 14-day policy window from delivery
      const deliveryDate = (existingOrder as any).updatedAt || (existingOrder as any).createdAt;
      const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceDelivery > 14) {
        res.status(400).json({
          success: false,
          message: 'The 14-day return and exchange policy window for this delivered order has expired.',
        });
        return;
      }

      // Rule 4: Active return duplicate prevention
      const existingActiveReturn = await Return.findOne({
        orderRef: existingOrder.orderId,
        status: { $in: ['pending_review', 'approved', 'pickup_scheduled', 'received'] },
      });
      if (existingActiveReturn) {
        res.status(400).json({
          success: false,
          message: `An active ${existingActiveReturn.requestType} dossier (${existingActiveReturn.returnId}) is already in progress for Order #${existingOrder.orderId}.`,
        });
        return;
      }
    }

    const calculatedRefund =
      typeof refundAmount === 'number'
        ? refundAmount
        : items.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

    // Unify tracking ID: returnId matches the Order ID
    let returnId = cleanRef;
    const existingSameId = await Return.findOne({ returnId });
    if (existingSameId) {
      const prefix = requestType === 'exchange' ? 'EXC' : 'RET';
      returnId = `${prefix}-${cleanRef}`;
    }

    const newReturn = new Return({
      returnId,
      orderId: orderId || null,
      orderRef: cleanRef,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      requestType: requestType === 'exchange' ? 'exchange' : 'return',
      exchangeSize: exchangeSize ? String(exchangeSize).trim() : '',
      items: items.length > 0 ? items : [
        {
          name: 'Atelier Garment Item',
          size: 'M',
          qty: 1,
          price: calculatedRefund,
          reason: 'Size exchange / return request',
          condition: 'Original packaging with tags',
        },
      ],
      pickupAddress: pickupAddress || {},
      status: 'pending_review',
      refundAmount: calculatedRefund,
      adminNotes: adminNotes ? String(adminNotes).trim() : '',
      timeline: [
        {
          status: 'pending_review',
          note: `Reverse ${requestType.toUpperCase()} request initialized for Order #${orderRef}.`,
          updatedBy: req.user?.name || 'Customer / Desk 07 Intake',
          timestamp: new Date(),
        },
      ],
    });

    const saved = await newReturn.save();

    // Dispatch confirmation email
    sendCircularEmail({
      to: saved.customerEmail,
      subject: `DRAPZA Atelier // Reverse Protocol Registered: ${saved.returnId}`,
      html: `
        <div style="background-color: #0d0d0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
          <div style="max-width: 540px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 32px 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="letter-spacing: 0.2em; font-size: 20px; color: #ffffff; margin: 0;">DRAPZA</h2>
              <span style="font-size: 11px; letter-spacing: 0.15em; color: #a1a1aa; text-transform: uppercase;">DESK 07 // REVERSE LOGISTICS</span>
            </div>
            <p style="font-size: 14px; color: #d4d4d8; margin-bottom: 16px;">Dear ${saved.customerName},</p>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">
              Your <strong>${saved.requestType.toUpperCase()}</strong> request for Order <strong>#${saved.orderRef}</strong> has been safely registered in our Reverse Logistics Vault. Our atelier quality curators will review your request within 24 hours.
            </p>
            <div style="background: #27272a; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">DOSSIER REFERENCE</div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em;">${saved.returnId}</div>
              <div style="margin-top: 12px; font-size: 13px; color: #d4d4d8;">
                Type: <strong style="color: #ffffff; text-transform: uppercase;">${saved.requestType}</strong> ${saved.exchangeSize ? `(Target Size: ${saved.exchangeSize})` : ''}<br/>
                Estimated Refund/Value: <strong style="color: #a3e5ba;">₹${saved.refundAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
              Ensure garments are unwashed with authentic security tags attached. A 3PL courier will be scheduled upon approval.
            </p>
          </div>
        </div>
      `,
      name: saved.customerName,
    }).catch((err) => console.warn('[MAIL ERROR]:', err));

    res.status(201).json({ success: true, request: saved });
  } catch (err: any) {
    console.error('[CREATE RETURN ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Update return status, reverse courier AWB, QA inspection notes
 * @route PATCH /api/returns/:id/status
 * @route PUT /api/returns/:id
 */
export const updateReturnStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '');
    const {
      status,
      adminNotes,
      rejectionReason,
      courierAwb,
      courierPartner,
      refundAmount,
      customerName,
      customerEmail,
      customerPhone,
      exchangeSize,
      pickupAddress,
      items,
    } = req.body;

    const returnDoc = await Return.findOne({
      $or: [{ _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null }, { returnId: rawId }],
    });

    if (!returnDoc) {
      res.status(404).json({ success: false, message: 'Return request record not found.' });
      return;
    }

    const previousStatus = returnDoc.status;

    if (status && status !== returnDoc.status) {
      returnDoc.status = status;
      returnDoc.timeline.push({
        status,
        note: adminNotes || `Status updated from ${previousStatus} to ${status}`,
        updatedBy: req.user?.name || 'Atelier Master Admin',
        timestamp: new Date(),
      });
    }

    if (adminNotes !== undefined) returnDoc.adminNotes = adminNotes;
    if (rejectionReason !== undefined) returnDoc.rejectionReason = rejectionReason;
    if (courierAwb !== undefined) returnDoc.courierAwb = courierAwb.trim();
    if (courierPartner !== undefined) returnDoc.courierPartner = courierPartner.trim();
    if (refundAmount !== undefined && !isNaN(Number(refundAmount))) {
      returnDoc.refundAmount = Number(refundAmount);
    }
    if (customerName) returnDoc.customerName = String(customerName).trim();
    if (customerEmail) returnDoc.customerEmail = String(customerEmail).trim().toLowerCase();
    if (customerPhone !== undefined) returnDoc.customerPhone = String(customerPhone).trim();
    if (exchangeSize !== undefined) returnDoc.exchangeSize = String(exchangeSize).trim();
    if (pickupAddress && typeof pickupAddress === 'object') {
      returnDoc.pickupAddress = {
        street: pickupAddress.street ?? returnDoc.pickupAddress?.street,
        city: pickupAddress.city ?? returnDoc.pickupAddress?.city,
        state: pickupAddress.state ?? returnDoc.pickupAddress?.state,
        pincode: pickupAddress.pincode ?? returnDoc.pickupAddress?.pincode,
      };
    }
    if (Array.isArray(items) && items.length > 0) {
      returnDoc.items = items;
    }

    const updated = await returnDoc.save();

    // If status changed or AWB added, notify customer via circular mail
    if (status && status !== previousStatus) {
      let subject = `DRAPZA Reverse Logistics Update: ${updated.returnId}`;
      let statusHeadline = `STATUS: ${status.toUpperCase().replace('_', ' ')}`;
      let statusExplanation = '';

      if (status === 'approved') {
        subject = `Approved: Return Request ${updated.returnId} // DRAPZA`;
        statusHeadline = 'RETURN / EXCHANGE APPROVED';
        statusExplanation = 'Your request has passed preliminary verification. Reverse doorstep courier pickup is currently being scheduled with our 3PL partner.';
      } else if (status === 'pickup_scheduled') {
        subject = `Pickup Scheduled: AWB ${updated.courierAwb || 'PENDING'} // DRAPZA`;
        statusHeadline = 'DOORSTEP PICKUP SCHEDULED';
        statusExplanation = `Our courier will collect the package from your address. Reverse AWB Tracking: ${updated.courierAwb || 'Assigned shortly'}. Please ensure tags and packaging are intact.`;
      } else if (status === 'received') {
        subject = `Garment Received at Atelier: ${updated.returnId} // DRAPZA`;
        statusHeadline = 'GARMENT RECEIVED AT ATELIER';
        statusExplanation = 'Your package has arrived at the DRAPZA atelier. Our master tailors and QA team are conducting quality and authenticity verification.';
      } else if (status === 'refunded') {
        subject = `Settlement Complete: ₹${updated.refundAmount.toLocaleString('en-IN')} // DRAPZA`;
        statusHeadline = updated.requestType === 'exchange' ? 'EXCHANGE DISPATCHED' : 'REFUND COMPLETED';
        statusExplanation = updated.requestType === 'exchange'
          ? `Your replacement sizing (${updated.exchangeSize || 'Requested size'}) has been verified and expedited for priority delivery.`
          : `A refund of ₹${updated.refundAmount.toLocaleString('en-IN')} has been credited back to your original payment source or store balance.`;
      } else if (status === 'rejected') {
        subject = `Notice Regarding Return Request: ${updated.returnId} // DRAPZA`;
        statusHeadline = 'RETURN REQUEST DECLINED';
        statusExplanation = `Reason: ${updated.rejectionReason || adminNotes || 'Items did not meet reverse return policy standards (missing tags, worn condition, or outside policy window).'}`;
      }

      sendCircularEmail({
        to: updated.customerEmail,
        subject,
        html: `
          <div style="background-color: #0d0d0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
            <div style="max-width: 540px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 32px 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
                <h2 style="letter-spacing: 0.2em; font-size: 20px; color: #ffffff; margin: 0;">DRAPZA</h2>
                <span style="font-size: 11px; letter-spacing: 0.15em; color: #a1a1aa; text-transform: uppercase;">DESK 07 // REVERSE VAULT</span>
              </div>
              <p style="font-size: 14px; color: #d4d4d8; margin-bottom: 8px;">Dear ${updated.customerName},</p>
              <div style="background: #27272a; border-left: 4px solid #a3e5ba; border-radius: 4px; padding: 14px 18px; margin: 20px 0;">
                <div style="font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em;">REVERSE LOGISTICS UPDATE</div>
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 4px;">${statusHeadline}</div>
              </div>
              <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin-bottom: 20px;">
                ${statusExplanation}
              </p>
              ${
                updated.courierAwb
                  ? `
                <div style="background: #09090b; border: 1px solid #27272a; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
                  <span style="font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; display: block;">COURIER PARTNER &amp; REVERSE AWB</span>
                  <span style="font-size: 14px; font-family: monospace; color: #ffffff; font-weight: 700;">${updated.courierPartner || 'Delhivery'}: ${updated.courierAwb}</span>
                </div>
              `
                  : ''
              }
              <div style="font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px;">
                Reference: <strong>${updated.returnId}</strong> &bull; Order Ref: <strong>#${updated.orderRef}</strong>
              </div>
            </div>
          </div>
        `,
        name: updated.customerName,
      }).catch((err) => console.warn('[STATUS NOTIFY MAIL ERROR]:', err));
    }

    res.status(200).json({ success: true, request: updated, data: updated });
  } catch (err: any) {
    console.error('[UPDATE RETURN ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Trigger on-demand email dispatch to customer
 * @route POST /api/returns/:id/notify
 */
export const sendReturnNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '');
    const returnDoc = await Return.findOne({
      $or: [{ _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null }, { returnId: rawId }],
    });

    if (!returnDoc) {
      res.status(404).json({ success: false, message: 'Return record not found.' });
      return;
    }

    const result = await sendCircularEmail({
      to: returnDoc.customerEmail,
      subject: `Status Update // Return & Exchange Dossier ${returnDoc.returnId}`,
      html: `
        <div style="background-color: #0d0d0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 32px 24px;">
            <h2 style="letter-spacing: 0.2em; font-size: 20px; color: #ffffff; margin-bottom: 8px;">DRAPZA</h2>
            <p style="color: #a1a1aa; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px;">ATELIER REVERSE CONCIERGE DIRECTIVE</p>
            <p style="color: #d4d4d8; font-size: 14px; margin-bottom: 12px;">Hello ${returnDoc.customerName},</p>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
              Current Status of your request for Order #${returnDoc.orderRef}: <strong style="color: #ffffff; text-transform: uppercase;">${returnDoc.status.replace('_', ' ')}</strong>.
            </p>
            ${
              returnDoc.courierAwb
                ? `<div style="background: #27272a; padding: 12px; font-family: monospace; font-size: 13px; color: #a3e5ba; margin-bottom: 16px; border-radius: 4px;">REVERSE AWB: ${returnDoc.courierAwb}</div>`
                : ''
            }
            ${
              returnDoc.adminNotes
                ? `<div style="font-size: 13px; color: #d4d4d8; background: #09090b; padding: 12px; border-left: 3px solid #71717a; margin-bottom: 16px;"><em>"${returnDoc.adminNotes}"</em></div>`
                : ''
            }
            <p style="color: #71717a; font-size: 11px;">If you have any questions, reply directly to this concierge notice or contact support.</p>
          </div>
        </div>
      `,
      name: returnDoc.customerName,
    });

    if (result.success) {
      res.status(200).json({ success: true, message: `Notification dispatched to ${returnDoc.customerEmail}` });
    } else {
      res.status(500).json({ success: false, message: 'All circular email delivery providers failed.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Export Returns & Exchanges to 3PL CSV
 * @route GET /api/returns/export-csv
 */
export const exportReturnsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const query: Record<string, any> = {};

    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.requestType = type;

    const requests = await Return.find(query).sort({ createdAt: -1 }).lean();

    const csvHeaders = [
      'Return ID',
      'Order Ref',
      'Type',
      'Exchange Size',
      'Client Name',
      'Client Email',
      'Client Phone',
      'Pickup Street',
      'City',
      'State',
      'Pincode',
      'Items Qty',
      'Refund Amount',
      'Status',
      'Courier Partner',
      'Courier AWB',
      'Created At',
    ].join(',');

    const csvRows = requests.map((r) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        escape(r.returnId),
        escape(r.orderRef),
        escape(r.requestType),
        escape(r.exchangeSize || ''),
        escape(r.customerName),
        escape(r.customerEmail),
        escape(r.customerPhone || ''),
        escape(r.pickupAddress?.street || ''),
        escape(r.pickupAddress?.city || ''),
        escape(r.pickupAddress?.state || ''),
        escape(r.pickupAddress?.pincode || ''),
        escape(r.items?.length || 0),
        escape(r.refundAmount || 0),
        escape(r.status),
        escape(r.courierPartner || 'Delhivery'),
        escape(r.courierAwb || ''),
        escape(new Date(r.createdAt).toISOString()),
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DRAPZA_RETURNS_3PL_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('[EXPORT CSV ERROR]:', err);
    res.status(500).json({ success: false, message: 'Failed to generate 3PL CSV export' });
  }
};

/**
 * @desc Delete return request record
 * @route DELETE /api/returns/:id
 */
export const deleteReturnRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '');
    const deleted = await Return.findOneAndDelete({
      $or: [{ _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null }, { returnId: rawId }],
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Record not found.' });
      return;
    }

    res.status(200).json({ success: true, message: `Return dossier ${deleted.returnId} deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
