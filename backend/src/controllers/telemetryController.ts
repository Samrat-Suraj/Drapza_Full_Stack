import { Request, Response } from 'express';
import { SearchTelemetry } from '../models/SearchTelemetry';
import { VisitorLocation } from '../models/VisitorLocation';

// 1. Log a search query
export const logSearchQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, resultsCount = 0, category = 'General', source = 'web_search' } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ success: false, message: 'Valid search query is required.' });
      return;
    }

    const cleanQuery = query.trim().slice(0, 120);
    const normalized = cleanQuery.toLowerCase();
    const count = Math.max(0, parseInt(String(resultsCount), 10) || 0);

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    await SearchTelemetry.create({
      query: cleanQuery,
      normalizedQuery: normalized,
      resultsCount: count,
      category: String(category || 'General').trim().slice(0, 50),
      source: String(source || 'web_search').trim().slice(0, 50),
      ip: typeof ip === 'string' ? ip.split(',')[0].trim() : '',
    });

    res.status(201).json({ success: true, message: 'Telemetry logged.' });
  } catch (error: any) {
    console.error('[TELEMETRY] Log Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
};

// 2. Get Search Radar Analytics
export const getSearchAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalSearches = await SearchTelemetry.countDocuments();

    if (totalSearches === 0) {
      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalSearches: 0,
            zeroResultsCount: 0,
            zeroResultRate: '0.0%',
          },
          topQueries: [],
          zeroResultQueries: [],
          recentLogs: [],
        },
      });
      return;
    }

    const zeroResultsCount = await SearchTelemetry.countDocuments({ resultsCount: 0 });
    const zeroResultRate = `${((zeroResultsCount / (totalSearches || 1)) * 100).toFixed(1)}%`;

    // Top Queries Aggregation
    const topQueriesAgg = await SearchTelemetry.aggregate([
      {
        $group: {
          _id: '$normalizedQuery',
          originalQuery: { $first: '$query' },
          count: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' },
          lastSearched: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          query: '$originalQuery',
          count: 1,
          avgResults: { $round: ['$avgResults', 0] },
          lastSearched: 1,
        },
      },
    ]);

    // Zero-Result Unmet Demand Aggregation
    const zeroResultQueriesAgg = await SearchTelemetry.aggregate([
      { $match: { resultsCount: 0 } },
      {
        $group: {
          _id: '$normalizedQuery',
          originalQuery: { $first: '$query' },
          count: { $sum: 1 },
          lastSearched: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          query: '$originalQuery',
          count: 1,
          lastSearched: 1,
        },
      },
    ]);

    // Recent Live Feed (last 15)
    const recentLogs = await SearchTelemetry.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .select('query resultsCount category createdAt source')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSearches,
          zeroResultsCount,
          zeroResultRate,
        },
        topQueries: topQueriesAgg,
        zeroResultQueries: zeroResultQueriesAgg,
        recentLogs,
      },
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Get Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
};

// 3. Seed Realistic Sample Telemetry Data
export const seedSampleTelemetry = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sampleQueries = [
      // Queries with results
      { q: 'oversized acid wash tee', count: 18, res: 4, cat: 'Tops' },
      { q: 'tactical cargo pants', count: 14, res: 6, cat: 'Bottoms' },
      { q: 'deconstructed kimono jacket', count: 11, res: 2, cat: 'Outerwear' },
      { q: 'black sheerform mesh shirt', count: 9, res: 3, cat: 'Tops' },
      { q: 'wide leg denim palazzo', count: 8, res: 5, cat: 'Bottoms' },
      { q: 'heavyweight drop shoulder hoodie', count: 15, res: 4, cat: 'Outerwear' },
      { q: 'anarkali kurti', count: 12, res: 8, cat: 'Kurti' },
      { q: 'banarasi silk saree', count: 10, res: 5, cat: 'Saree' },
      { q: 'minimalist linen co-ord', count: 7, res: 3, cat: 'Co-ord Set' },

      // Unmet demand (zero results)
      { q: 'waterproof cyberpunk trench', count: 22, res: 0, cat: 'Outerwear' },
      { q: 'reflective parachute jumpsuit', count: 16, res: 0, cat: 'Jumpsuits' },
      { q: 'leather modular chest harness', count: 13, res: 0, cat: 'Accessories' },
      { q: 'metallic chrome bomber jacket', count: 11, res: 0, cat: 'Outerwear' },
      { q: 'high-collar storm parka', count: 9, res: 0, cat: 'Outerwear' },
      { q: 'gothic velvet corset blazer', count: 7, res: 0, cat: 'Tops' },
      { q: 'cargo utility kilt', count: 5, res: 0, cat: 'Bottoms' },
    ];

    const records: any[] = [];
    const now = Date.now();

    for (const item of sampleQueries) {
      for (let i = 0; i < item.count; i++) {
        // Distribute timestamps over past 14 days
        const offsetMs = Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000);
        records.push({
          query: item.q,
          normalizedQuery: item.q.toLowerCase(),
          resultsCount: item.res,
          category: item.cat,
          source: 'shopper_search',
          createdAt: new Date(now - offsetMs),
          updatedAt: new Date(now - offsetMs),
        });
      }
    }

    await SearchTelemetry.insertMany(records);

    res.status(200).json({
      success: true,
      message: `Seeded ${records.length} search events across ${sampleQueries.length} query clusters.`,
      count: records.length,
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Seed Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Seed failed' });
  }
};

// 4. Clear/Purge Telemetry
export const clearSearchTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zeroOnly } = req.query;
    if (zeroOnly === 'true') {
      const result = await SearchTelemetry.deleteMany({ resultsCount: 0 });
      res.status(200).json({
        success: true,
        message: `Purged ${result.deletedCount} zero-result search telemetry entries.`,
      });
      return;
    }

    const result = await SearchTelemetry.deleteMany({});
    res.status(200).json({
      success: true,
      message: `Purged all ${result.deletedCount} search telemetry entries.`,
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Clear Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Clear failed' });
  }
};

// 5. Export Zero-Result Demand CSV
export const exportSearchRadarCsv = async (_req: Request, res: Response): Promise<void> => {
  try {
    const zeroResultQueriesAgg = await SearchTelemetry.aggregate([
      { $match: { resultsCount: 0 } },
      {
        $group: {
          _id: '$normalizedQuery',
          originalQuery: { $first: '$query' },
          category: { $first: '$category' },
          count: { $sum: 1 },
          lastSearched: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1, lastSearched: -1 } },
    ]);

    const header = ['RANK', 'SEARCHED_QUERY', 'CATEGORY', 'FREQUENCY_HITS', 'LAST_SEARCHED_DATE', 'STATUS'];
    const rows = zeroResultQueriesAgg.map((item, idx) => [
      idx + 1,
      `"${item.originalQuery.replace(/"/g, '""')}"`,
      `"${(item.category || 'General').replace(/"/g, '""')}"`,
      item.count,
      `"${new Date(item.lastSearched).toISOString()}"`,
      '"UNMET_DEMAND_ZERO_RESULTS"',
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const fileName = `DRAPZA_SEARCH_RADAR_ZERO_RESULTS_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('[TELEMETRY] Export CSV Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Export failed' });
  }
};

// ==========================================
// VISITOR LOCATION & GPS TELEMETRY
// ==========================================

export const recordVisitorLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';

    const {
      latitude,
      longitude,
      accuracy = 10,
      city = 'New Delhi',
      state = 'Delhi',
      postalCode = '',
      country = 'India',
      formattedAddress = '',
      precisionType = 'IP_APPROXIMATE',
      sessionId = '',
      userType = 'guest',
      userName = 'Anonymous Guest',
      userEmail = '',
    } = req.body;

    const record = await VisitorLocation.create({
      ip: clientIp || req.body.clientIp || '127.0.0.1',
      latitude: Number(latitude) || 28.6139,
      longitude: Number(longitude) || 77.2090,
      accuracy: Number(accuracy) || 15,
      city: String(city || 'New Delhi').trim(),
      state: String(state || 'Delhi').trim(),
      postalCode: String(postalCode || '').trim(),
      country: String(country || 'India').trim(),
      formattedAddress: String(formattedAddress || '').trim(),
      precisionType: precisionType === 'GPS_HIGH_ACCURACY' ? 'GPS_HIGH_ACCURACY' : 'IP_APPROXIMATE',
      sessionId: String(sessionId || '').trim(),
      userType: userType === 'registered' ? 'registered' : 'guest',
      userName: String(userName || 'Anonymous Guest').trim(),
      userEmail: String(userEmail || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Visitor telemetry coordinates logged.',
      data: record,
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Record Location Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to record location.' });
  }
};

export const getAllVisitorLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    let locations = await VisitorLocation.find().sort({ createdAt: -1 }).limit(100).lean();

    // If database has 0 locations, seed 3 initial sample records so the admin table is never blank
    if (locations.length === 0) {
      await VisitorLocation.insertMany([
        {
          ip: '103.21.244.0',
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 12,
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
          formattedAddress: 'Connaught Place, New Delhi',
          precisionType: 'GPS_HIGH_ACCURACY',
          userType: 'registered',
          userName: 'Marcus Vance',
          userEmail: 'marcus@drapza.com',
        },
        {
          ip: '157.34.120.45',
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 25,
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          formattedAddress: 'Bandra West, Mumbai',
          precisionType: 'IP_APPROXIMATE',
          userType: 'guest',
          userName: 'Anonymous Guest',
        },
        {
          ip: '49.207.210.88',
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 8,
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          formattedAddress: 'Indiranagar, Bengaluru',
          precisionType: 'GPS_HIGH_ACCURACY',
          userType: 'registered',
          userName: 'Elena Rostova',
          userEmail: 'elena@drapza.com',
        },
      ]);
      locations = await VisitorLocation.find().sort({ createdAt: -1 }).limit(100).lean();
    }

    const total = locations.length;
    const guests = locations.filter((l) => l.userType === 'guest').length;
    const registered = locations.filter((l) => l.userType === 'registered').length;
    const gpsVerified = locations.filter((l) => l.precisionType === 'GPS_HIGH_ACCURACY').length;
    const ipApproximate = locations.filter((l) => l.precisionType !== 'GPS_HIGH_ACCURACY').length;

    res.status(200).json({
      success: true,
      locations,
      stats: {
        total,
        guests,
        registered,
        gpsVerified,
        ipApproximate,
      },
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Get Locations Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch visitor locations.' });
  }
};

export const clearVisitorLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    await VisitorLocation.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All visitor location telemetry logs purged.',
    });
  } catch (error: any) {
    console.error('[TELEMETRY] Clear Locations Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to clear locations.' });
  }
};
