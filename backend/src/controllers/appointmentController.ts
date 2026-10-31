import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { AuthRequest } from '../types';
import { sendCircularEmail } from '../utils/mailer';

// Helper to generate a memorable bespoke appointment reference
const generateAppointmentId = (): string => {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRP-APT-${stamp}-${rand}`;
};

/**
 * @desc Book a new Atelier/Fitting Appointment
 * @route POST /api/appointments
 * @access Public (Optional Auth)
 */
export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phone,
      appointmentType,
      preferredDate,
      preferredTimeSlot,
      city,
      address,
      pincode,
      productId,
      productName,
      productImage,
      productPrice,
      measurements,
    } = req.body;

    if (!fullName || !email || !phone || !preferredDate || !preferredTimeSlot) {
      res.status(400).json({
        success: false,
        message: 'Please provide full name, email, phone, date, and preferred time slot.',
      });
      return;
    }

    const appointmentId = generateAppointmentId();

    const newAppointment = new Appointment({
      appointmentId,
      user: req.user?._id || null,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      appointmentType: appointmentType || 'atelier_visit',
      preferredDate,
      preferredTimeSlot,
      city: city ? String(city).trim() : '',
      address: address ? String(address).trim() : '',
      pincode: pincode ? String(pincode).trim() : '',
      productId: productId ? String(productId) : '',
      productName: productName ? String(productName) : 'Bespoke Silhouette Consultation',
      productImage: productImage ? String(productImage) : '',
      productPrice: productPrice ?? '',
      measurements: measurements || {},
      status: 'pending',
    });

    const savedAppointment = await newAppointment.save();

    // Send confirmation email asynchronously
    const appointmentTypeLabel =
      appointmentType === 'home_fitting'
        ? 'Home Concierge Fitting'
        : appointmentType === 'virtual_consultation'
        ? 'Virtual Master Tailor Consultation'
        : 'Private Flagship Atelier Visit';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E6E1; border-radius: 16px; background-color: #FAF9F5; color: #111816;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E2E6E1;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.1em; color: #082D20; margin: 0;">DRAPZA ATELIER</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #717D77; margin-top: 4px;">Haute Couture & Bespoke Tailoring</p>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="font-size: 18px; color: #082D20; margin-bottom: 8px;">Appointment Request Confirmed</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #4A5550;">
            Dear ${fullName}, thank you for choosing DRAPZA. Your bespoke fitting appointment request has been registered under reference <strong>${appointmentId}</strong>.
          </p>
          <div style="background-color: #FFFFFF; border: 1px solid #DCE3DB; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Experience:</strong> ${appointmentTypeLabel}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Date:</strong> ${preferredDate}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Time Slot:</strong> ${preferredTimeSlot}</p>
            ${city ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ${city}${pincode ? ` (${pincode})` : ''}</p>` : ''}
          </div>
          <p style="font-size: 12px; color: #717D77; line-height: 1.5;">
            Our Master Tailor concierge will contact you via phone (${phone}) to confirm final details and preparations.
          </p>
        </div>
      </div>
    `;

    sendCircularEmail({
      to: email,
      subject: `Your DRAPZA Bespoke Appointment: ${appointmentId}`,
      html: emailHtml,
      name: fullName,
    }).catch((err) => {
      console.warn('[APPOINTMENT EMAIL NOTICE]: Could not send notification email:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Bespoke appointment scheduled successfully.',
      appointment: savedAppointment,
    });
  } catch (error: any) {
    console.error('[BOOK APPOINTMENT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment. Please check your connection.',
    });
  }
};

/**
 * @desc Get customer's appointments
 * @route GET /api/appointments/my
 * @access Public (with email) / Authenticated
 */
export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emailQuery = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const userId = req.user?._id;

    const filter: Record<string, any> = {};

    if (userId && emailQuery) {
      filter.$or = [{ user: userId }, { email: emailQuery }];
    } else if (userId) {
      filter.user = userId;
    } else if (emailQuery) {
      filter.email = emailQuery;
    } else {
      res.status(200).json({
        success: true,
        count: 0,
        appointments: [],
      });
      return;
    }

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error: any) {
    console.error('[GET MY APPOINTMENTS ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.',
    });
  }
};

/**
 * @desc Get all appointments with filtering, pagination, and status breakdown
 * @route GET /api/appointments
 * @access Admin
 */
export const getAllAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || '50'), 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (type && type !== 'ALL') {
      filter.appointmentType = type;
    }

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { appointmentId: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { productName: searchRegex },
      ];
    }

    const [appointments, total, allStatusCounts] = await Promise.all([
      Appointment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Appointment.countDocuments(filter),
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {
      total: 0,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    allStatusCounts.forEach((item: { _id: string; count: number }) => {
      if (item._id && Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
        (statusCounts as any)[item._id] = item.count;
      }
      statusCounts.total += item.count;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page,
      totalPages,
      statusCounts,
      appointments,
    });
  } catch (error: any) {
    console.error('[GET ALL APPOINTMENTS ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment list.',
    });
  }
};

/**
 * @desc Update appointment status, fitter, directives, or schedule
 * @route PATCH /api/appointments/:id
 * @access Admin
 */
export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const {
      fullName,
      email,
      phone,
      appointmentType,
      city,
      address,
      pincode,
      productName,
      status,
      assignedFitter,
      adminNotes,
      virtualMeetingLink,
      preferredDate,
      preferredTimeSlot,
      measurements,
    } = req.body;

    // Find by either MongoDB _id or custom appointmentId
    const appointment = await Appointment.findOne({
      $or: isObjectId ? [{ _id: id }, { appointmentId: id }] : [{ appointmentId: id }],
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
      return;
    }

    if (fullName !== undefined) appointment.fullName = String(fullName).trim();
    if (email !== undefined) appointment.email = String(email).trim().toLowerCase();
    if (phone !== undefined) appointment.phone = String(phone).trim();
    if (appointmentType !== undefined) appointment.appointmentType = appointmentType;
    if (city !== undefined) appointment.city = String(city).trim();
    if (address !== undefined) appointment.address = String(address).trim();
    if (pincode !== undefined) appointment.pincode = String(pincode).trim();
    if (productName !== undefined) appointment.productName = String(productName).trim();
    if (status !== undefined) appointment.status = status;
    if (assignedFitter !== undefined) appointment.assignedFitter = assignedFitter;
    if (adminNotes !== undefined) appointment.adminNotes = adminNotes;
    if (virtualMeetingLink !== undefined) appointment.virtualMeetingLink = virtualMeetingLink;
    if (preferredDate !== undefined) appointment.preferredDate = preferredDate;
    if (preferredTimeSlot !== undefined) appointment.preferredTimeSlot = preferredTimeSlot;
    if (measurements !== undefined) {
      appointment.measurements = {
        ...appointment.measurements,
        ...measurements,
      };
    }

    const updated = await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      appointment: updated,
    });
  } catch (error: any) {
    console.error('[UPDATE APPOINTMENT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update appointment.',
    });
  }
};

/**
 * @desc Send appointment reminder or status email to client
 * @route POST /api/appointments/:id/notify
 * @access Admin
 */
export const sendAppointmentNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const appointment = await Appointment.findOne({
      $or: isObjectId ? [{ _id: id }, { appointmentId: id }] : [{ appointmentId: id }],
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    const modeLabel =
      appointment.appointmentType === 'home_fitting'
        ? 'Home Concierge Tailor Fitting'
        : appointment.appointmentType === 'virtual_consultation'
        ? 'Virtual Master Pattern Consultation'
        : 'Private Flagship Atelier Visit';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E6E1; border-radius: 16px; background-color: #FAF9F5; color: #111816;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E2E6E1;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.1em; color: #082D20; margin: 0;">DRAPZA ATELIER</h1>
          <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #717D77; margin-top: 4px;">Concierge Consultation Directive</p>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="font-size: 18px; color: #082D20; margin-bottom: 8px;">Appointment Status: ${appointment.status.toUpperCase()}</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #4A5550;">
            Dear ${appointment.fullName}, your bespoke appointment <strong>${appointment.appointmentId}</strong> status is now <strong>${appointment.status.toUpperCase()}</strong>.
          </p>
          <div style="background-color: #FFFFFF; border: 1px solid #DCE3DB; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Experience:</strong> ${modeLabel}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Date:</strong> ${appointment.preferredDate}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Time Slot:</strong> ${appointment.preferredTimeSlot}</p>
            ${appointment.assignedFitter ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Specialist:</strong> ${appointment.assignedFitter}</p>` : ''}
            ${appointment.virtualMeetingLink ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Virtual Meeting Link:</strong> <a href="${appointment.virtualMeetingLink}" target="_blank" style="color: #082D20; font-weight: bold;">${appointment.virtualMeetingLink}</a></p>` : ''}
            ${appointment.adminNotes ? `<p style="margin: 6px 0 0 0; font-size: 12.5px; color: #4A5550; font-style: italic;"><strong>Concierge Notes:</strong> "${appointment.adminNotes}"</p>` : ''}
          </div>
        </div>
      </div>
    `;

    await sendCircularEmail({
      to: appointment.email,
      subject: `[Update] DRAPZA Bespoke Appointment: ${appointment.appointmentId} (${appointment.status.toUpperCase()})`,
      html: emailHtml,
      name: appointment.fullName,
    });

    res.status(200).json({
      success: true,
      message: `Notification email dispatched to ${appointment.email}.`,
    });
  } catch (error: any) {
    console.error('[NOTIFY APPOINTMENT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch notification email.',
    });
  }
};

/**
 * @desc Delete appointment
 * @route DELETE /api/appointments/:id
 * @access Admin
 */
export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const deleted = await Appointment.findOneAndDelete({
      $or: isObjectId ? [{ _id: id }, { appointmentId: id }] : [{ appointmentId: id }],
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found or already removed.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Appointment removed successfully.',
    });
  } catch (error: any) {
    console.error('[DELETE APPOINTMENT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment.',
    });
  }
};

/**
 * @desc Export appointments to CSV
 * @route GET /api/appointments/export-csv
 * @access Admin
 */
export const exportAppointmentsCsv = async (_req: Request, res: Response): Promise<void> => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    const headers = [
      'Appointment ID',
      'Status',
      'Client Name',
      'Email',
      'Phone',
      'Type',
      'Date',
      'Time Slot',
      'City',
      'Address',
      'Pincode',
      'Product',
      'Assigned Fitter',
      'Created At',
    ];

    const rows = appointments.map((a) => [
      `"${a.appointmentId}"`,
      `"${a.status}"`,
      `"${(a.fullName || '').replace(/"/g, '""')}"`,
      `"${(a.email || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${a.appointmentType}"`,
      `"${a.preferredDate}"`,
      `"${a.preferredTimeSlot}"`,
      `"${(a.city || '').replace(/"/g, '""')}"`,
      `"${(a.address || '').replace(/"/g, '""')}"`,
      `"${(a.pincode || '').replace(/"/g, '""')}"`,
      `"${(a.productName || '').replace(/"/g, '""')}"`,
      `"${(a.assignedFitter || '').replace(/"/g, '""')}"`,
      `"${new Date(a.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="drapza-appointments-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('[EXPORT CSV ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export appointments CSV.',
    });
  }
};
