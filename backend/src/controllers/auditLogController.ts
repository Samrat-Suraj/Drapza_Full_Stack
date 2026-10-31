import { Request, Response } from 'express';
import { AuditSession, BannedIp } from '../models/AuditLog';

// Helper to seed initial realistic security audit logs if table is empty
async function ensureSampleSessionsExist() {
  const count = await AuditSession.countDocuments();
  if (count > 0) return;

  const now = Date.now();
  await AuditSession.insertMany([
    {
      sessionId: 'SES-NOIR-94A18',
      userName: 'Marcus Vance',
      userEmail: 'marcus@drapza.com',
      userRole: 'admin',
      ip: '103.21.244.18',
      city: 'Berlin',
      region: 'Berlin',
      country: 'Germany',
      device: 'Desktop',
      browser: 'Chrome 128',
      os: 'macOS 15',
      loginAt: new Date(now - 14 * 60000),
      lastActiveAt: new Date(now - 2 * 60000),
      durationSeconds: 720,
      isOnline: true,
      status: 'ACTIVE',
      riskLevel: 'SAFE',
      riskScore: 5,
      routeHitsCount: 42,
      threatFlags: [],
      routeHits: [
        { path: '/api/admin/dashboard', method: 'GET', statusCode: 200, latencyMs: 24, timestamp: new Date(now - 120000) },
        { path: '/api/products', method: 'GET', statusCode: 200, latencyMs: 38, timestamp: new Date(now - 90000) },
        { path: '/api/orders', method: 'GET', statusCode: 200, latencyMs: 45, timestamp: new Date(now - 45000) },
      ],
    },
    {
      sessionId: 'SES-CRIT-0081B',
      userName: 'Anonymous Intruder',
      userEmail: '',
      userRole: 'guest',
      ip: '194.26.29.112',
      city: 'Kyiv',
      region: 'Kyiv',
      country: 'Ukraine',
      device: 'Desktop',
      browser: 'Python-Requests / Automated Bot',
      os: 'Linux x86_64',
      loginAt: new Date(now - 45 * 60000),
      lastActiveAt: new Date(now - 8 * 60000),
      durationSeconds: 2200,
      isOnline: false,
      status: 'TERMINATED_ADMIN',
      riskLevel: 'CRITICAL',
      riskScore: 92,
      routeHitsCount: 184,
      threatFlags: [
        { type: 'SQL_INJECTION_PATTERN', reason: 'Attempted union select injection on /api/product/search', path: '/api/product?search=\' OR 1=1--', detectedAt: new Date(now - 8 * 60000) },
        { type: 'RAPID_REQUEST_BURST', reason: 'High frequency automated scanning > 60 req/min', path: '/api/user/login', detectedAt: new Date(now - 12 * 60000) },
      ],
      routeHits: [
        { path: '/api/user/login', method: 'POST', statusCode: 401, latencyMs: 12, timestamp: new Date(now - 12 * 60000), threatDetected: true },
        { path: '/api/product?search=\' OR 1=1--', method: 'GET', statusCode: 400, latencyMs: 8, timestamp: new Date(now - 8 * 60000), threatDetected: true },
      ],
    },
    {
      sessionId: 'SES-HIGH-337F1',
      userName: 'Unverified Visitor',
      userEmail: 'dev.test99@proton.me',
      userRole: 'client',
      ip: '185.220.101.4',
      city: 'Amsterdam',
      region: 'North Holland',
      country: 'Netherlands',
      device: 'Desktop',
      browser: 'Tor Browser / Firefox',
      os: 'Windows 11',
      loginAt: new Date(now - 22 * 60000),
      lastActiveAt: new Date(now - 3 * 60000),
      durationSeconds: 1140,
      isOnline: true,
      status: 'ACTIVE',
      riskLevel: 'HIGH',
      riskScore: 74,
      routeHitsCount: 38,
      threatFlags: [
        { type: 'KNOWN_TOR_EXIT_NODE', reason: 'Session originated from anonymous exit relay', ip: '185.220.101.4', detectedAt: new Date(now - 22 * 60000) },
      ],
      routeHits: [
        { path: '/api/wardrobe', method: 'GET', statusCode: 200, latencyMs: 65, timestamp: new Date(now - 180000) },
        { path: '/api/checkout/cart', method: 'POST', statusCode: 200, latencyMs: 40, timestamp: new Date(now - 120000) },
      ],
    },
    {
      sessionId: 'SES-LIVE-4109C',
      userName: 'Elena Rostova',
      userEmail: 'elena@drapza.com',
      userRole: 'member',
      ip: '157.34.120.45',
      city: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      device: 'Mobile',
      browser: 'Mobile Safari 18',
      os: 'iOS 18',
      loginAt: new Date(now - 6 * 60000),
      lastActiveAt: new Date(now - 10000),
      durationSeconds: 360,
      isOnline: true,
      status: 'ACTIVE',
      riskLevel: 'SAFE',
      riskScore: 0,
      routeHitsCount: 16,
      threatFlags: [],
      routeHits: [
        { path: '/api/product/series-04-heavy-bomber', method: 'GET', statusCode: 200, latencyMs: 18, timestamp: new Date(now - 30000) },
        { path: '/api/cart', method: 'GET', statusCode: 200, latencyMs: 12, timestamp: new Date(now - 10000) },
      ],
    },
  ]);

  const banCount = await BannedIp.countDocuments();
  if (banCount === 0) {
    await BannedIp.insertMany([
      {
        ip: '194.26.29.112',
        reason: 'Automated vulnerability scanner exploit probe',
        threatType: 'SQL_INJECTION_PATTERN',
        bannedBy: 'Master Security Radar',
        bannedAt: new Date(now - 30 * 60000),
      },
      {
        ip: '45.148.10.88',
        reason: 'Brute force credential stuffing attack',
        threatType: 'AUTH_BRUTE_FORCE',
        bannedBy: 'System Defense Guard',
        bannedAt: new Date(now - 2 * 3600000),
      },
    ]);
  }
}

// 1. Overview Telemetry
export const getSecurityOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureSampleSessionsExist();

    const totalSessions = await AuditSession.countDocuments();
    const activeOnlineCount = await AuditSession.countDocuments({ isOnline: true });
    const criticalThreatCount = await AuditSession.countDocuments({ riskLevel: 'CRITICAL' });
    const highThreatCount = await AuditSession.countDocuments({ riskLevel: 'HIGH' });
    const bannedIpCount = await BannedIp.countDocuments();

    // Sum all threats
    const sessionsWithThreats = await AuditSession.find({ 'threatFlags.0': { $exists: true } }).lean();
    let totalThreatsFlagged = 0;
    sessionsWithThreats.forEach((s) => {
      totalThreatsFlagged += s.threatFlags?.length || 0;
    });

    // Recent threats list
    const recentThreatSessions = await AuditSession.find({ riskLevel: { $in: ['CRITICAL', 'HIGH', 'MEDIUM'] } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const recentThreats = recentThreatSessions.map((s) => ({
      sessionId: s.sessionId,
      userEmail: s.userEmail || 'Anonymous Guest',
      ip: s.ip,
      riskLevel: s.riskLevel,
      threatFlags: s.threatFlags || [],
      lastActiveAt: s.lastActiveAt ? new Date(s.lastActiveAt).toISOString() : new Date().toISOString(),
      device: s.device,
      browser: s.browser,
    }));

    res.status(200).json({
      success: true,
      metrics: {
        activeOnlineCount,
        totalSessions,
        criticalThreatCount,
        highThreatCount,
        totalThreatsFlagged,
        bannedIpCount,
      },
      recentThreats,
    });
  } catch (error: any) {
    console.error('[SECURITY AUDIT] Overview Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch security overview.' });
  }
};

// 2. Filtered Sessions
export const getAuditSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureSampleSessionsExist();

    const { search, riskLevel, status, page = 1, limit = 15 } = req.query;
    const filter: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { sessionId: { $regex: q, $options: 'i' } },
        { ip: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
      ];
    }

    if (riskLevel && riskLevel !== 'ALL') {
      filter.riskLevel = riskLevel;
    }

    if (status && status !== 'ALL') {
      if (status === 'ONLINE' || status === 'ACTIVE') {
        filter.isOnline = true;
      } else {
        filter.status = status;
      }
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      AuditSession.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      AuditSession.countDocuments(filter),
    ]);

    const formattedSessions = sessions.map((s) => ({
      ...s,
      loginAt: s.loginAt ? new Date(s.loginAt).toISOString() : new Date().toISOString(),
      lastActiveAt: s.lastActiveAt ? new Date(s.lastActiveAt).toISOString() : new Date().toISOString(),
      logoutAt: s.logoutAt ? new Date(s.logoutAt).toISOString() : undefined,
    }));

    res.status(200).json({
      success: true,
      sessions: formattedSessions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    console.error('[SECURITY AUDIT] Sessions Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to query audit sessions.' });
  }
};

// 3. Single Session Detail
export const getAuditSessionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const session = await AuditSession.findOne({
      $or: [{ sessionId: id }, ...(isMongoId ? [{ _id: id }] : [])],
    }).lean();

    if (!session) {
      res.status(404).json({ success: false, message: 'Audit session record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      session: {
        ...session,
        loginAt: session.loginAt ? new Date(session.loginAt).toISOString() : new Date().toISOString(),
        lastActiveAt: session.lastActiveAt ? new Date(session.lastActiveAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch session detail.' });
  }
};

// 4. Force Terminate Session
export const terminateAuditSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const session = await AuditSession.findOne({
      $or: [{ sessionId: id }, ...(isMongoId ? [{ _id: id }] : [])],
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found.' });
      return;
    }

    session.status = 'TERMINATED_ADMIN';
    session.isOnline = false;
    session.logoutAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: `Session ${session.sessionId} terminated by security administrator.`,
      session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to terminate session.' });
  }
};

// 5. Blacklist / Banned IPs
export const getBlacklistedIps = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureSampleSessionsExist();
    const blacklistedIps = await BannedIp.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      blacklistedIps,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve blacklist.' });
  }
};

export const banIp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip, reason = 'Administrative ban', threatType = 'MANUAL_RESTRICTION' } = req.body;
    if (!ip) {
      res.status(400).json({ success: false, message: 'IP address is required.' });
      return;
    }

    const cleanIp = String(ip).trim();
    const record = await BannedIp.findOneAndUpdate(
      { ip: cleanIp },
      {
        ip: cleanIp,
        reason,
        threatType,
        bannedBy: 'Atelier Security Administrator',
        bannedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also terminate any active session from this IP
    await AuditSession.updateMany(
      { ip: cleanIp, isOnline: true },
      { isOnline: false, status: 'TERMINATED_ADMIN', logoutAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `IP ${cleanIp} added to security firewall blacklist.`,
      ...record.toObject(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to ban IP.' });
  }
};

export const unbanIp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip } = req.body;
    if (!ip) {
      res.status(400).json({ success: false, message: 'IP address is required to remove from blacklist.' });
      return;
    }

    await BannedIp.findOneAndDelete({ ip: String(ip).trim() });
    res.status(200).json({
      success: true,
      message: `IP ${ip} removed from blacklist.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to unban IP.' });
  }
};

// 6. Export CSV
export const exportAuditCsv = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await AuditSession.find().sort({ createdAt: -1 }).limit(500).lean();

    const header = [
      'SESSION_ID',
      'USER_IDENTITY',
      'EMAIL',
      'IP_ADDRESS',
      'GEO_LOCATION',
      'DEVICE',
      'BROWSER',
      'STATUS',
      'ONLINE_STATE',
      'RISK_LEVEL',
      'RISK_SCORE',
      'ROUTE_HITS_COUNT',
      'DETECTED_THREATS_COUNT',
      'LOGIN_TIMESTAMP',
    ];

    const rows = sessions.map((s) => [
      `"${s.sessionId}"`,
      `"${(s.userName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(s.userEmail || '').replace(/"/g, '""')}"`,
      `"${s.ip}"`,
      `"${s.city || ''}, ${s.country || ''}"`,
      `"${s.device}"`,
      `"${s.browser}"`,
      `"${s.status}"`,
      s.isOnline ? '"ONLINE"' : '"OFFLINE"',
      `"${s.riskLevel}"`,
      s.riskScore,
      s.routeHitsCount || 0,
      s.threatFlags?.length || 0,
      `"${s.loginAt ? new Date(s.loginAt).toISOString() : ''}"`,
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const fileName = `DRAPZA_SECURITY_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to export audit CSV.' });
  }
};
