import {
  strongPasswordSchema,
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  contactConciergeSchema,
  adminProductSchema,
  adminCouponSchema,
  trackOrderInputSchema,
  newsletterSchema,
  shippingAddressModalSchema,
  checkoutShippingDetailsSchema,
  couponCodeInputSchema,
  loginCredentialsSchema,
  registerCredentialsSchema,
  resetPasswordCredentialsSchema,
  orderCancellationSchema,
  customerReturnSchema,
  pincodeSchema,
  getZodErrorMessage,
  getZodFieldErrors,
} from '../lib/validation';

describe('DRAPZA Frontend Zod Validation Suite', () => {
  // 1. Password & Auth Schemas
  describe('strongPasswordSchema', () => {
    it('should validate robust passwords meeting all criteria', () => {
      const result = strongPasswordSchema.safeParse('AtelierDrapza2026!');
      expect(result.success).toBe(true);
    });

    it('should reject short passwords under 8 characters', () => {
      const result = strongPasswordSchema.safeParse('Abc1!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getZodErrorMessage(result.error)).toContain('at least 8 characters');
      }
    });

    it('should reject passwords lacking uppercase letters', () => {
      const result = strongPasswordSchema.safeParse('drapzapassword123!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords lacking digits', () => {
      const result = strongPasswordSchema.safeParse('DrapzaPassword!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords lacking special characters', () => {
      const result = strongPasswordSchema.safeParse('DrapzaPassword123');
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should accept valid registration payloads', () => {
      const validData = {
        name: 'Siddharth Rao',
        email: 'siddharth@drapza.com',
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
        agreeTerms: true,
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when confirmPassword does not match', () => {
      const mismatchData = {
        name: 'Siddharth Rao',
        email: 'siddharth@drapza.com',
        password: 'Password@2026',
        confirmPassword: 'DifferentPassword@2026',
        agreeTerms: true,
      };
      const result = signupSchema.safeParse(mismatchData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = getZodFieldErrors(result.error);
        expect(errors.confirmPassword).toContain('verification keys do not match');
      }
    });

    it('should reject when terms are not acknowledged', () => {
      const unagreedData = {
        name: 'Siddharth Rao',
        email: 'siddharth@drapza.com',
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
        agreeTerms: false,
      };
      const result = signupSchema.safeParse(unagreedData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema & loginCredentialsSchema', () => {
    it('should accept valid credentials format', () => {
      const valid = { email: 'client@drapza.com', password: 'SecretKey123!' };
      expect(loginSchema.safeParse(valid).success).toBe(true);
      expect(loginCredentialsSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject malformed email formats', () => {
      const invalid = { email: 'not-an-email', password: 'SecretKey123!' };
      const res = loginSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it('should reject empty passwords', () => {
      const invalid = { email: 'client@drapza.com', password: '' };
      const res = loginSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  // 2. Track Order Schema
  describe('trackOrderInputSchema', () => {
    it('should accept valid tracking reference IDs', () => {
      expect(trackOrderInputSchema.safeParse({ trackingRef: 'DPZ-90214-X' }).success).toBe(true);
      expect(trackOrderInputSchema.safeParse({ trackingRef: '659fa123bc89a' }).success).toBe(true);
    });

    it('should reject tracking references shorter than 3 characters', () => {
      const result = trackOrderInputSchema.safeParse({ trackingRef: '12' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getZodErrorMessage(result.error)).toContain('valid Order ID');
      }
    });

    it('should reject empty tracking references', () => {
      expect(trackOrderInputSchema.safeParse({ trackingRef: '' }).success).toBe(false);
    });
  });

  // 3. Checkout & Shipping Details
  describe('checkoutShippingDetailsSchema', () => {
    it('should validate and normalize valid Indian shipping details', () => {
      const validCheckout = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@domain.in',
        phone: '+91 98765 43210',
        address: '42 Crescent Avenue, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      };
      const result = checkoutShippingDetailsSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe('9876543210');
      }
    });

    it('should reject invalid PIN codes (not 6 digits)', () => {
      const invalidPin = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@domain.in',
        phone: '9876543210',
        address: '42 Crescent Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '01234', // invalid
      };
      const result = checkoutShippingDetailsSchema.safeParse(invalidPin);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = getZodFieldErrors(result.error);
        expect(errors.pincode).toContain('6-digit Indian PIN code');
      }
    });

    it('should reject invalid Indian phone numbers', () => {
      const invalidPhone = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@domain.in',
        phone: '1234567890', // starts with 1
        address: '42 Crescent Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      };
      const result = checkoutShippingDetailsSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
    });
  });

  // 4. Coupon Code Schema
  describe('couponCodeInputSchema & adminCouponSchema', () => {
    it('should accept valid alphanumeric coupon codes', () => {
      expect(couponCodeInputSchema.safeParse({ code: 'DRAPZA20' }).success).toBe(true);
      expect(couponCodeInputSchema.safeParse({ code: 'SUMMER_SALE' }).success).toBe(true);
    });

    it('should reject invalid symbols in coupons', () => {
      expect(couponCodeInputSchema.safeParse({ code: 'DRAPZA@SALE!' }).success).toBe(false);
    });

    it('should reject discount percentage over 90%', () => {
      const excessiveCoupon = {
        code: 'MAXDISCOUNT',
        discountType: 'percentage' as const,
        discountAmount: 95,
        minOrderValue: 500,
        perUserLimit: 1,
        isActive: true,
      };
      const result = adminCouponSchema.safeParse(excessiveCoupon);
      expect(result.success).toBe(false);
    });
  });

  // 5. Concierge & Customer Returns
  describe('contactConciergeSchema & newsletterSchema', () => {
    it('should accept valid contact inquiries', () => {
      const valid = {
        name: 'Kabir Singhania',
        email: 'kabir@singhania.co',
        message: 'Inquiring regarding bespoke seasonal drop sizing.',
      };
      expect(contactConciergeSchema.safeParse(valid).success).toBe(true);
    });

    it('should accept valid newsletter signal subscriptions', () => {
      expect(newsletterSchema.safeParse({ email: 'client@atelier.io' }).success).toBe(true);
      expect(newsletterSchema.safeParse({ email: 'invalid-email' }).success).toBe(false);
    });
  });

  describe('customerReturnSchema & orderCancellationSchema', () => {
    it('should validate legitimate customer return requests', () => {
      const validReturn = {
        orderRef: 'DPZ-10024-X',
        fullName: 'Devansh Roy',
        email: 'devansh@domain.com',
        phone: '9820098200',
        street: 'Building 4, Palm Grove',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        requestType: 'exchange' as const,
      };
      expect(customerReturnSchema.safeParse(validReturn).success).toBe(true);
    });

    it('should reject empty cancellation reason', () => {
      expect(orderCancellationSchema.safeParse({ reason: 'No' }).success).toBe(false);
      expect(orderCancellationSchema.safeParse({ reason: 'Ordered incorrect sizing' }).success).toBe(true);
    });
  });

  describe('resetPasswordCredentialsSchema (Forgot Password OTP Enter)', () => {
    it('should accept valid 6-digit OTP and matching new passwords', () => {
      const valid = {
        otp: '123456',
        password: 'newSecurePassword123',
        confirmPassword: 'newSecurePassword123',
      };
      const res = resetPasswordCredentialsSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('should reject OTP with length other than 6 digits', () => {
      const invalidOtp = {
        otp: '12345',
        password: 'newSecurePassword123',
        confirmPassword: 'newSecurePassword123',
      };
      const res = resetPasswordCredentialsSchema.safeParse(invalidOtp);
      expect(res.success).toBe(false);
    });

    it('should reject mismatched new password and confirmation', () => {
      const mismatch = {
        otp: '123456',
        password: 'password123',
        confirmPassword: 'differentPassword456',
      };
      const res = resetPasswordCredentialsSchema.safeParse(mismatch);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(getZodErrorMessage(res.error)).toContain('New passwords do not match');
      }
    });
  });
});
