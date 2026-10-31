import { Response } from 'express';
import { Address } from '../models/Address';
import { User } from '../models/User';
import { AuthRequest } from '../types';

// Helper to validate 10-digit Indian mobile number
const isValidIndianMobile = (phone: string): boolean => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  const normalized =
    digitsOnly.length === 12 && digitsOnly.startsWith('91')
      ? digitsOnly.slice(2)
      : digitsOnly.length === 11 && digitsOnly.startsWith('0')
      ? digitsOnly.slice(1)
      : digitsOnly;
  return /^[6-9]\d{9}$/.test(normalized);
};

// Helper to normalize phone to 10 digits
const normalizePhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return digitsOnly.slice(2);
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return digitsOnly.slice(1);
  return digitsOnly;
};

// Helper to validate 6-digit Indian PIN code
const isValidIndianPincode = (pincode: string): boolean => {
  if (!pincode) return false;
  const clean = pincode.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
};

export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let userId = req.user ? req.user._id : null;
    const phone = req.query.phone as string;
    const email = (req.query.email as string || '').trim().toLowerCase();

    if (!userId && email) {
      const userByEmail = await User.findOne({ email });
      if (userByEmail) {
        userId = userByEmail._id;
      }
    }

    if (!userId && phone) {
      const userByPhone = await User.findOne({ phone: normalizePhone(phone) });
      if (userByPhone) {
        userId = userByPhone._id;
      }
    }

    if (userId) {
      const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
      if (addresses.length > 0) {
        res.status(200).json({ success: true, count: addresses.length, addresses });
        return;
      }
    }

    // Guest lookup: if phone is provided in query, find by phone
    if (phone) {
      const normalized = normalizePhone(phone);
      const addresses = await Address.find({ phone: normalized }).sort({ isDefault: -1, createdAt: -1 });
      res.status(200).json({ success: true, count: addresses.length, addresses });
      return;
    }

    // Unauthenticated guest with no saved address lookup
    res.status(200).json({ success: true, count: 0, addresses: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      firstName,
      lastName,
      phone,
      houseFlat,
      streetArea,
      landmark,
      address,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    const resolvedName = (fullName || `${firstName || ''} ${lastName || ''}`).trim();
    if (!resolvedName) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ success: false, message: 'Mobile number is required.' });
      return;
    }

    if (!isValidIndianMobile(phone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210).',
      });
      return;
    }

    const resolvedHouseFlat = (houseFlat || '').trim();
    const resolvedStreetArea = (streetArea || '').trim();
    const resolvedAddress = (
      address ||
      `${resolvedHouseFlat ? resolvedHouseFlat + ', ' : ''}${resolvedStreetArea}${landmark ? ', Near ' + landmark.trim() : ''}`
    ).trim();

    if (!resolvedAddress) {
      res.status(400).json({ success: false, message: 'Street address / house details are required.' });
      return;
    }

    if (!city || !city.trim()) {
      res.status(400).json({ success: false, message: 'City is required.' });
      return;
    }

    if (!state || !state.trim()) {
      res.status(400).json({ success: false, message: 'State is required.' });
      return;
    }

    if (!pincode || !pincode.trim()) {
      res.status(400).json({ success: false, message: 'PIN code is required.' });
      return;
    }

    if (!isValidIndianPincode(pincode)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code (e.g. 400001).',
      });
      return;
    }

    const nameParts = resolvedName.split(' ');
    const fName = firstName || nameParts[0] || 'Client';
    const lName = lastName || nameParts.slice(1).join(' ') || '';

    const rawType = (addressType || 'Home').trim();
    const normalizedType =
      rawType.toLowerCase() === 'office' || rawType.toLowerCase() === 'work'
        ? 'Office'
        : rawType.toLowerCase() === 'other'
        ? 'Other'
        : 'Home';

    let userId = req.user ? req.user._id : null;
    const bodyEmail = (req.body.email || '').trim().toLowerCase();
    if (!userId && bodyEmail) {
      const userByEmail = await User.findOne({ email: bodyEmail });
      if (userByEmail) {
        userId = userByEmail._id;
      }
    }
    if (!userId && phone) {
      const userByPhone = await User.findOne({ phone: normalizePhone(phone) });
      if (userByPhone) {
        userId = userByPhone._id;
      }
    }

    if (isDefault) {
      if (userId) {
        await Address.updateMany({ user: userId }, { isDefault: false });
      } else {
        await Address.updateMany({ phone: normalizePhone(phone) }, { isDefault: false });
      }
    }

    const totalCount = userId
      ? await Address.countDocuments({ user: userId })
      : await Address.countDocuments({ phone: normalizePhone(phone) });
    const markAsDefault = isDefault || totalCount === 0;

    const newAddress = await Address.create({
      user: userId,
      fullName: resolvedName,
      firstName: fName.trim(),
      lastName: lName.trim(),
      phone: normalizePhone(phone),
      houseFlat: resolvedHouseFlat,
      streetArea: resolvedStreetArea,
      landmark: (landmark || '').trim(),
      address: resolvedAddress,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country || 'India',
      addressType: normalizedType,
      isDefault: markAsDefault,
    });

    console.log(`[AddressController] Address directly saved to backend MongoDB: ${newAddress._id} for ${resolvedName}`);

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      address: newAddress,
    });
  } catch (error: any) {
    console.error('[AddressController] Error creating address:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const addressDoc = await Address.findById(id);

    if (!addressDoc) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    if (req.user && !addressDoc.user) {
      addressDoc.user = req.user._id;
    }

    const {
      fullName,
      firstName,
      lastName,
      phone,
      houseFlat,
      streetArea,
      landmark,
      address,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    if (phone && !isValidIndianMobile(phone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.',
      });
      return;
    }

    if (pincode && !isValidIndianPincode(pincode)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code.',
      });
      return;
    }

    if (isDefault) {
      if (req.user) {
        await Address.updateMany({ user: req.user._id }, { isDefault: false });
      }
      await Address.updateMany({ phone: addressDoc.phone }, { isDefault: false });
      addressDoc.isDefault = true;
    }

    const resolvedName = fullName || (firstName ? `${firstName} ${lastName || ''}`.trim() : addressDoc.fullName);
    if (resolvedName) {
      addressDoc.fullName = resolvedName;
      const parts = resolvedName.split(' ');
      addressDoc.firstName = parts[0] || 'Client';
      addressDoc.lastName = parts.slice(1).join(' ') || '';
    }

    if (phone) addressDoc.phone = normalizePhone(phone);
    if (houseFlat !== undefined) addressDoc.houseFlat = houseFlat.trim();
    if (streetArea !== undefined) addressDoc.streetArea = streetArea.trim();
    if (landmark !== undefined) addressDoc.landmark = landmark.trim();

    if (address !== undefined && address.trim()) {
      addressDoc.address = address.trim();
    } else if (houseFlat !== undefined || streetArea !== undefined || landmark !== undefined) {
      const hf = houseFlat !== undefined ? houseFlat.trim() : (addressDoc.houseFlat || '');
      const sa = streetArea !== undefined ? streetArea.trim() : (addressDoc.streetArea || addressDoc.address || '');
      const lm = landmark !== undefined ? landmark.trim() : (addressDoc.landmark || '');
      const constructed = `${hf ? hf + ', ' : ''}${sa}${lm ? ', Near ' + lm : ''}`.trim();
      if (constructed) {
        addressDoc.address = constructed;
      }
    }

    if (city) addressDoc.city = city.trim();
    if (state) addressDoc.state = state.trim();
    if (pincode) addressDoc.pincode = pincode.trim();
    if (country) addressDoc.country = country.trim();

    if (addressType) {
      const rawType = addressType.trim().toLowerCase();
      addressDoc.addressType =
        rawType === 'office' || rawType === 'work' ? 'Office' : rawType === 'other' ? 'Other' : 'Home';
    }

    await addressDoc.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address: addressDoc,
    });
  } catch (error: any) {
    console.error('[AddressController] Error updating address:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const address = await Address.findById(id);

    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    await Address.findByIdAndDelete(id);

    if (address.isDefault) {
      const filter = address.user ? { user: address.user } : { phone: address.phone };
      const remainingAddress = await Address.findOne(filter).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.status(200).json({ success: true, message: 'Address removed successfully.' });
  } catch (error: any) {
    console.error('[AddressController] Error deleting address:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const target = await Address.findById(id);
    if (!target) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    if (req.user) {
      if (req.user.role === 'admin') {
        if (target.user) {
          await Address.updateMany({ user: target.user }, { isDefault: false });
        } else {
          await Address.updateMany({ phone: target.phone }, { isDefault: false });
        }
      } else {
        await Address.updateMany({ user: req.user._id }, { isDefault: false });
        await Address.updateMany({ phone: target.phone }, { isDefault: false });
      }
    } else {
      await Address.updateMany({ phone: target.phone }, { isDefault: false });
    }
    target.isDefault = true;
    await target.save();

    res.status(200).json({ success: true, message: 'Default address set.', address: target });
  } catch (error: any) {
    console.error('[AddressController] Error setting default address:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};
