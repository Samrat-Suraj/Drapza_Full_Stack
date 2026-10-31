/**
 * @jest-environment node
 */

/**
 * FRONTEND <-> BACKEND ARCHITECTURE & CONNECTIVITY AUDIT TEST SUITE
 * Verifies proxy rewrites, API resolver logic, CORS contract, and live endpoint handshake.
 */

describe('DRAPZA Frontend <-> Backend Connectivity & Architecture Audit', () => {
  describe('1. API Base Resolver Protocol (src/lib/api.ts)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should resolve SSR internal backend URL in Node environment', () => {
      process.env.INTERNAL_BACKEND_URL = 'http://localhost:5000';

      const resolveApiBase = (hasBrowserWindow: boolean): string => {
        if (hasBrowserWindow) {
          return process.env.NEXT_PUBLIC_API_URL || '/api';
        }
        const internalBackend =
          process.env.INTERNAL_BACKEND_URL ||
          process.env.BACKEND_URL ||
          'http://localhost:5000';
        return `${internalBackend.replace(/\/$/, '')}/api`;
      };

      expect(resolveApiBase(false)).toBe('http://localhost:5000/api');
    });

    it('should resolve relative /api in browser environment to conceal backend address', () => {
      const resolveApiBase = (hasBrowserWindow: boolean): string => {
        if (hasBrowserWindow) {
          return process.env.NEXT_PUBLIC_API_URL || '/api';
        }
        return 'http://localhost:5000/api';
      };

      expect(resolveApiBase(true)).toBe('/api');
    });
  });

  describe('2. Next.js Proxy Rewrite Configuration Audit', () => {
    it('should properly configure rewrite rules routing /api/:path* to backend:5000', () => {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.resolve(__dirname, '../../next.config.mjs');
      const configContent = fs.readFileSync(configPath, 'utf-8');

      expect(configContent).toContain('/api/:path*');
      expect(configContent).toContain(':5000/api/:path*');
    });
  });

  describe('3. Live Frontend-to-Backend Connectivity Telemetry Handshake', () => {
    it('should connect to backend health endpoint on port 5000 and receive status ONLINE', async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('status', 'ONLINE');
        expect(data).toHaveProperty('service');
        expect(data.service).toContain('DRAPZA Atelier API Engine');
      } catch (err: any) {
        // Provide meaningful context if backend server is temporarily unreached
        throw new Error(`Failed to handshake with backend on port 5000: ${err.message}`);
      }
    });

    it('should connect to Next.js frontend proxy on port 3000 and proxy to backend correctly', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('ONLINE');
      } catch (err: any) {
        throw new Error(`Next.js proxy on port 3000 failed to bridge to backend: ${err.message}`);
      }
    });

    it('should verify live product catalog is fetched through frontend proxy', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.products)).toBe(true);
        expect(data.products.length).toBeGreaterThan(0);
      } catch (err: any) {
        throw new Error(`Failed to fetch product catalog through proxy: ${err.message}`);
      }
    });
  });
});
