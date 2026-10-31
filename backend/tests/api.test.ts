import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB } from '../src/config/db';

beforeAll(async () => {
  await connectDB();
}, 20000);

afterAll(async () => {
  await mongoose.connection.close();
});


describe('DRAPZA Backend API Test Suite', () => {
  describe('GET /api/health (System Health Telemetry)', () => {
    it('should return 200 OK with ONLINE status and service signature', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ONLINE');
      expect(res.body).toHaveProperty('service');
      expect(res.body.service).toContain('DRAPZA Atelier API Engine');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('CORS and Security Headers Audit', () => {
    it('should allow frontend origin http://localhost:3000 with credentials', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should respond to preflight OPTIONS requests for API endpoints', async () => {
      const res = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('GET /api/products & /api/product (Catalog Engine)', () => {
    it('should respond with a valid product catalog or empty collection structure', async () => {
      const res = await request(app).get('/api/products');
      expect([200, 304]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('success');
        expect(Array.isArray(res.body.products || res.body.data || res.body)).toBe(true);
      }
    });

    it('should handle /api/product alias identically', async () => {
      const res = await request(app).get('/api/product');
      expect([200, 304]).toContain(res.status);
    });
  });

  describe('POST /api/user/login (Auth Security Protocol)', () => {
    it('should reject login requests with missing credentials with 400 or 401', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({});

      expect([400, 401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid password attempts with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'invalid.user@drapza.com',
          password: 'IncorrectPassword123!',
        });

      expect([400, 401, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Order & Tracking Endpoints', () => {
    it('should return 404 or proper error for non-existent order tracking ID', async () => {
      const res = await request(app).get('/api/order/track/DPZ-NONEXISTENT-999');
      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('404 Route Fallback Protocol', () => {
    it('should return JSON 404 for unmapped API endpoints', async () => {
      const res = await request(app).get('/api/unmapped-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Resource endpoint not found.',
      });
    });
  });

  describe('Security & Role-Based Access Control (RBAC) Audit', () => {
    it('should reject unauthenticated order creation with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/order/create').send({
        items: [{ name: 'Test Jacket', quantity: 1 }],
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated COD order with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/payment/cod').send({
        items: [{ name: 'Test Shell', quantity: 1 }],
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated access to admin orders with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/order/admin/all');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated access to user governance (/api/user/all) with 401', async () => {
      const res = await request(app).get('/api/user/all');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated access to admin sales reports with 401', async () => {
      const res = await request(app).get('/api/reports/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated product creation with 401', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Hacked Product',
        price: 1,
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Inventory & Stock Validation Protocol', () => {
    it('should respond 200 with isValid: true for empty items list', async () => {
      const res = await request(app)
        .post('/api/products/validate-stock')
        .send({ items: [] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isValid).toBe(true);
      expect(res.body.items).toEqual([]);
    });

    it('should detect non-existent product as out-of-stock / invalid', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/products/validate-stock')
        .send({
          items: [{ productId: fakeId, name: 'Ghost Item', quantity: 2 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isValid).toBe(false);
      expect(res.body.items[0].isValid).toBe(false);
      expect(res.body.items[0].inStock).toBe(false);
    });
  });

  describe('Price Normalization Protocol (NaN Protection)', () => {
    it('should correctly parse currency formatted price strings like "₹1,250" to numbers without NaN', () => {
      const { parseNumericPrice } = require('../src/utils/orderValidator');
      expect(parseNumericPrice('₹1,250')).toBe(1250);
      expect(parseNumericPrice('₹50,880.00')).toBe(50880);
      expect(parseNumericPrice(null)).toBe(0);
      expect(parseNumericPrice(undefined)).toBe(0);
      expect(parseNumericPrice(NaN)).toBe(0);
    });
  });

  describe('DRAPZA Privilege Membership System', () => {
    it('GET /api/membership/plans should return active membership plans with prices and discount percentages', async () => {
      const res = await request(app).get('/api/membership/plans');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.plans)).toBe(true);
      expect(res.body.plans.length).toBeGreaterThanOrEqual(3);

      const planSlugs = res.body.plans.map((p: any) => p.slug);
      expect(planSlugs).toContain('6-months');
      expect(planSlugs).toContain('1-year');
      expect(planSlugs).toContain('5-years');

      const oneYearPlan = res.body.plans.find((p: any) => p.slug === '1-year');
      expect(oneYearPlan.price).toBeGreaterThan(0);
      expect(oneYearPlan.discountPercent).toBeGreaterThan(0);
    });

    it('GET /api/membership/my-membership should require authentication with 401', async () => {
      const res = await request(app).get('/api/membership/my-membership');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/membership/create-order should require authentication with 401', async () => {
      const res = await request(app)
        .post('/api/membership/create-order')
        .send({ planId: '1-year' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/membership/admin/plans should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/membership/admin/plans');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should correctly calculate member special pricing given an active membership', () => {
      const { calculateMemberProductPricing } = require('../src/utils/membershipService');
      const testProduct = {
        name: 'Deform Trenchcoat',
        price: 2000,
        numericPrice: 2000,
        discountPrice: 0,
      };

      const activeMember = {
        isActive: true,
        discountPercent: 15,
        planName: '1 Year Membership',
      };

      const pricing = calculateMemberProductPricing(testProduct, activeMember);
      expect(pricing.isMember).toBe(true);
      expect(pricing.memberDiscountPercent).toBe(15);
      expect(pricing.memberPrice).toBe(1700); // 2000 - 15% (300) = 1700
      expect(pricing.savings).toBe(300);

      const nonMemberPricing = calculateMemberProductPricing(testProduct, { isActive: false, discountPercent: 0 });
      expect(nonMemberPricing.isMember).toBe(false);
      expect(nonMemberPricing.memberPrice).toBe(2000);
      expect(nonMemberPricing.savings).toBe(0);
    });
  });
});
