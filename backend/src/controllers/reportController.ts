import { Request, Response } from 'express';
import { Order } from '../models/Order';

interface DateRange {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  label: string;
  id: string;
  daySpan: number;
}

const resolveTimeframe = (timeframe: string = 'this_month', customStart?: string, customEnd?: string): DateRange => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);
  let id = timeframe;
  let label = 'Current Month';

  switch (timeframe) {
    case 'today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Today';
      break;
    }
    case 'yesterday': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      label = 'Yesterday';
      break;
    }
    case 'week': {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 Days';
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'This Month';
      break;
    }
    case 'last_month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Last Month';
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      label = 'This Year';
      break;
    }
    case '3_years': {
      startDate = new Date(now.getFullYear() - 3, 0, 1, 0, 0, 0, 0);
      label = 'Last 3 Years';
      break;
    }
    case 'all_time': {
      startDate = new Date('2020-01-01T00:00:00.000Z');
      label = 'All Time';
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        startDate = new Date(`${customStart}T00:00:00.000Z`);
        endDate = new Date(`${customEnd}T23:59:59.999Z`);
        label = `Custom (${customStart} to ${customEnd})`;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        label = 'Custom Range';
      }
      break;
    }
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'This Month';
      break;
    }
  }

  const daySpan = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const prevDuration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - prevDuration);

  return {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    label,
    id,
    daySpan,
  };
};

const normalizeOrder = (raw: any) => {
  const orderId = raw.orderNumber || raw.orderId || `DPZ-${String(raw._id).slice(-6).toUpperCase()}`;
  const trackingRef = raw.trackingNumber || raw.trackingRef || `TRK-${orderId}`;
  const createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();

  // Customer Name & Contact
  let customerName = raw.customerName || '';
  let customerEmail = raw.customerEmail || '';
  let customerPhone = raw.customerPhone || '';
  if (raw.customer) {
    customerName = customerName || `${raw.customer.firstName || ''} ${raw.customer.lastName || ''}`.trim() || 'Client';
    customerEmail = customerEmail || raw.customer.email || '';
    customerPhone = customerPhone || raw.customer.phone || '';
  }
  if (!customerName && raw.shippingAddress?.fullName) {
    customerName = raw.shippingAddress.fullName;
  }
  if (!customerPhone && raw.shippingAddress?.phone) {
    customerPhone = raw.shippingAddress.phone;
  }
  customerName = customerName.trim() || 'Atelier Client';

  // Shipping Address
  const city = raw.shippingAddress?.city || raw.address?.city || 'Mumbai';
  const state = raw.shippingAddress?.state || raw.address?.state || 'Maharashtra';

  // Items
  const items = raw.orderItems || raw.items || [];
  let itemsCount = 0;
  let itemsSum = 0;
  items.forEach((it: any) => {
    const q = Number(it.quantity) || 1;
    const p = Number(it.price) || 0;
    itemsCount += q;
    itemsSum += p * q;
  });

  const totalPrice = Number(raw.totalPrice || raw.total || itemsSum || 0);
  const taxPrice = Number(raw.taxPrice || Math.round(totalPrice * 0.05));
  const shippingPrice = Number(raw.shippingPrice || 0);
  const itemsPrice = Number(raw.itemsPrice || (totalPrice - taxPrice - shippingPrice));

  const paymentMethod = String(raw.paymentMethod || 'COD').toUpperCase();
  const rawPayStatus = String(raw.paymentStatus || 'pending').toLowerCase();
  const rawOrderStatus = String(raw.orderStatus || raw.status || 'placed').toLowerCase();

  return {
    id: String(raw._id),
    _id: String(raw._id),
    orderNumber: orderId,
    trackingNumber: trackingRef,
    trackingRef,
    date: createdAt.toISOString(),
    createdAt: createdAt.toISOString(),
    createdDate: createdAt,
    customerName,
    customerEmail,
    customerPhone,
    city,
    state,
    paymentMethod,
    paymentStatus: rawPayStatus,
    orderStatus: rawOrderStatus,
    items,
    itemsCount: Math.max(1, itemsCount),
    itemsPrice: Math.max(0, itemsPrice),
    taxPrice: Math.max(0, taxPrice),
    shippingPrice: Math.max(0, shippingPrice),
    totalPrice: Math.max(0, totalPrice),
    deliveredAt: rawOrderStatus === 'delivered' ? raw.updatedAt || createdAt.toISOString() : undefined,
  };
};

// 1. Get Analytics Report Data
export const getAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      timeframe = 'this_month',
      startDate: qStart,
      endDate: qEnd,
      status: qStatus,
      paymentMethod: qPayment,
    } = req.query as Record<string, string>;

    const range = resolveTimeframe(timeframe, qStart, qEnd);

    // Fetch all orders
    const allOrdersRaw = await Order.find().lean();
    const allNormalized = allOrdersRaw.map(normalizeOrder);

    // If "this_month" yielded 0 orders because records are from previous months, check if all_time has orders
    let inRangeOrders = allNormalized.filter(
      (o) => o.createdDate >= range.startDate && o.createdDate <= range.endDate
    );

    // If default "this_month" or "today" has 0 orders, but there are orders in the DB, fallback to including all orders so admin doesn't see blank dashboard
    let effectiveRange = range;
    if (inRangeOrders.length === 0 && allNormalized.length > 0 && timeframe === 'this_month') {
      // Find oldest and newest order date
      const sortedDates = allNormalized.map((o) => o.createdDate.getTime()).sort((a, b) => a - b);
      effectiveRange = {
        ...range,
        startDate: new Date(sortedDates[0] - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        label: 'All Active Records (Auto-Expanded)',
        daySpan: Math.max(1, Math.round((Date.now() - sortedDates[0]) / (1000 * 60 * 60 * 24))),
      };
      inRangeOrders = allNormalized.filter(
        (o) => o.createdDate >= effectiveRange.startDate && o.createdDate <= effectiveRange.endDate
      );
    }

    // Previous period orders for Delta calculation
    const prevOrders = allNormalized.filter(
      (o) => o.createdDate >= effectiveRange.prevStartDate && o.createdDate <= effectiveRange.prevEndDate
    );
    const prevGrossSales = prevOrders
      .filter((o) => o.orderStatus !== 'cancelled' && o.paymentStatus !== 'failed')
      .reduce((s, o) => s + o.totalPrice, 0);

    // Calculate Financial Summary
    let grossSales = 0;
    let completedOrders = 0;
    let unitsSold = 0;
    let returnAmount = 0;
    let returnCount = 0;
    let cancellationAmount = 0;
    let cancellationCount = 0;
    let failedAmount = 0;
    let failedCount = 0;
    let deliveredSales = 0;
    let totalItemsPrice = 0;
    let totalTaxCollected = 0;
    let totalShippingCollected = 0;

    inRangeOrders.forEach((o) => {
      totalItemsPrice += o.itemsPrice;
      totalTaxCollected += o.taxPrice;
      totalShippingCollected += o.shippingPrice;

      const isCancelled = o.orderStatus === 'cancelled';
      const isReturned = o.orderStatus === 'returned' || o.orderStatus === 'refunded';
      const isFailed = o.paymentStatus === 'failed';

      if (isCancelled) {
        cancellationCount += 1;
        cancellationAmount += o.totalPrice;
      } else if (isReturned) {
        returnCount += 1;
        returnAmount += o.totalPrice;
      }

      if (isFailed) {
        failedCount += 1;
        failedAmount += o.totalPrice;
      }

      if (!isCancelled && !isFailed) {
        grossSales += o.totalPrice;
        completedOrders += 1;
        unitsSold += o.itemsCount;
      }

      if (o.orderStatus === 'delivered') {
        deliveredSales += o.totalPrice;
      }
    });

    const netRevenue = Math.max(0, grossSales - returnAmount);
    const aov = completedOrders > 0 ? Math.round(grossSales / completedOrders) : 0;
    const totalOrdersCount = inRangeOrders.length;
    const returnRate = totalOrdersCount > 0 ? Number(((returnCount / totalOrdersCount) * 100).toFixed(1)) : 0;
    const cancellationRate = totalOrdersCount > 0 ? Number(((cancellationCount / totalOrdersCount) * 100).toFixed(1)) : 0;
    const failureRate = totalOrdersCount > 0 ? Number(((failedCount / totalOrdersCount) * 100).toFixed(1)) : 0;

    const salesDelta =
      prevGrossSales > 0
        ? Number((((grossSales - prevGrossSales) / prevGrossSales) * 100).toFixed(1))
        : grossSales > 0
        ? 100
        : 0;

    // Payment Methods Breakdown
    const pmMap: Record<string, { count: number; total: number }> = {
      CASHFREE: { count: 0, total: 0 },
      RAZORPAY: { count: 0, total: 0 },
      UPI_DIRECT: { count: 0, total: 0 },
      COD: { count: 0, total: 0 },
    };

    inRangeOrders.forEach((o) => {
      let pm = o.paymentMethod.toUpperCase();
      if (!pmMap[pm]) {
        if (pm.includes('UPI')) pm = 'UPI_DIRECT';
        else if (pm.includes('RAZOR')) pm = 'RAZORPAY';
        else if (pm.includes('CASHFREE')) pm = 'CASHFREE';
        else pm = 'COD';
      }
      pmMap[pm].count += 1;
      pmMap[pm].total += o.totalPrice;
    });

    const totalPmAmount = Math.max(1, Object.values(pmMap).reduce((s, v) => s + v.total, 0));
    const paymentMethodsBreakdown = Object.entries(pmMap).map(([method, val]) => ({
      method,
      ordersCount: val.count,
      totalAmount: val.total,
      percentageShare: Number(((val.total / totalPmAmount) * 100).toFixed(1)),
    }));

    // Status Funnel Breakdown
    const statusMap: Record<string, { count: number; total: number }> = {
      placed: { count: 0, total: 0 },
      confirmed: { count: 0, total: 0 },
      processing: { count: 0, total: 0 },
      shipped: { count: 0, total: 0 },
      delivered: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
      returned: { count: 0, total: 0 },
      failed: { count: 0, total: 0 },
    };

    inRangeOrders.forEach((o) => {
      const st = o.orderStatus.toLowerCase();
      if (statusMap[st]) {
        statusMap[st].count += 1;
        statusMap[st].total += o.totalPrice;
      } else if (st === 'refunded') {
        statusMap.returned.count += 1;
        statusMap.returned.total += o.totalPrice;
      } else {
        statusMap.placed.count += 1;
        statusMap.placed.total += o.totalPrice;
      }
      if (o.paymentStatus === 'failed') {
        statusMap.failed.count += 1;
        statusMap.failed.total += o.totalPrice;
      }
    });

    const statusBreakdown = Object.entries(statusMap).map(([status, val]) => ({
      status,
      count: val.count,
      totalAmount: val.total,
    }));

    // Top Products Ranking
    const productRankMap: Record<
      string,
      { id: string; name: string; image: string; unitsSold: number; orderCount: number; revenue: number }
    > = {};

    inRangeOrders.forEach((o) => {
      if (o.orderStatus === 'cancelled' || o.paymentStatus === 'failed') return;
      const seenProdInOrder = new Set<string>();

      o.items.forEach((it: any) => {
        const prodName = it.name || 'Garment Silhouette';
        const prodId = String(it.product || it._id || prodName);
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;

        if (!productRankMap[prodName]) {
          productRankMap[prodName] = {
            id: prodId,
            name: prodName,
            image: it.image || '/images/drapza/products/product_1.png',
            unitsSold: 0,
            orderCount: 0,
            revenue: 0,
          };
        }

        productRankMap[prodName].unitsSold += qty;
        productRankMap[prodName].revenue += price * qty;
        if (!seenProdInOrder.has(prodName)) {
          productRankMap[prodName].orderCount += 1;
          seenProdInOrder.add(prodName);
        }
      });
    });

    const topProducts = Object.values(productRankMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Timeline Series Chronological Bucketing
    const isMultiMonth = effectiveRange.daySpan > 35;
    const timelineMap: Record<
      string,
      { date: string; label: string; sales: number; ordersCount: number; returnsCount: number; cancellationsCount: number }
    > = {};

    inRangeOrders.forEach((o) => {
      const d = o.createdDate;
      const key = isMultiMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const label = isMultiMonth
        ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      if (!timelineMap[key]) {
        timelineMap[key] = {
          date: key,
          label,
          sales: 0,
          ordersCount: 0,
          returnsCount: 0,
          cancellationsCount: 0,
        };
      }

      timelineMap[key].ordersCount += 1;
      if (o.orderStatus === 'cancelled') {
        timelineMap[key].cancellationsCount += 1;
      } else if (o.orderStatus === 'returned' || o.orderStatus === 'refunded') {
        timelineMap[key].returnsCount += 1;
      } else if (o.paymentStatus !== 'failed') {
        timelineMap[key].sales += o.totalPrice;
      }
    });

    const timelineSeries = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Filter Ledger if status or payment filter specified
    let filteredOrders = inRangeOrders;
    if (qStatus && qStatus !== 'ALL') {
      const qs = qStatus.toLowerCase();
      filteredOrders = filteredOrders.filter((o) => {
        if (qs === 'failed') return o.paymentStatus === 'failed';
        if (qs === 'returned') return o.orderStatus === 'returned' || o.orderStatus === 'refunded';
        return o.orderStatus.toLowerCase() === qs;
      });
    }
    if (qPayment && qPayment !== 'ALL') {
      filteredOrders = filteredOrders.filter((o) => o.paymentMethod.toUpperCase() === qPayment.toUpperCase());
    }

    res.status(200).json({
      success: true,
      timeframe: {
        id: effectiveRange.id,
        label: effectiveRange.label,
        startDate: effectiveRange.startDate.toISOString(),
        endDate: effectiveRange.endDate.toISOString(),
        daySpan: effectiveRange.daySpan,
      },
      summary: {
        grossSales,
        completedOrders,
        unitsSold,
        returnAmount,
        returnCount,
        returnRate,
        cancellationAmount,
        cancellationCount,
        cancellationRate,
        failedAmount,
        failedCount,
        failureRate,
        netRevenue,
        deliveredSales,
        aov,
        totalOrders: totalOrdersCount,
        totalItemsPrice,
        totalTaxCollected,
        totalShippingCollected,
        deltas: {
          salesDelta,
        },
      },
      paymentMethodsBreakdown,
      statusBreakdown,
      topProducts,
      timelineSeries,
      ordersLedger: filteredOrders.map(({ createdDate, items, ...rest }) => rest),
    });
  } catch (error: any) {
    console.error('[REPORT] Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Report generation error' });
  }
};

// 2. Export Filtered Orders to Excel CSV
export const exportExcelReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      timeframe = 'this_month',
      startDate: qStart,
      endDate: qEnd,
      status: qStatus,
      paymentMethod: qPayment,
      search: qSearch,
    } = req.query as Record<string, string>;

    const range = resolveTimeframe(timeframe, qStart, qEnd);
    const allOrdersRaw = await Order.find().lean();
    const allNormalized = allOrdersRaw.map(normalizeOrder);

    let inRangeOrders = allNormalized.filter(
      (o) => o.createdDate >= range.startDate && o.createdDate <= range.endDate
    );

    // Fallback if this_month is empty
    if (inRangeOrders.length === 0 && allNormalized.length > 0 && timeframe === 'this_month') {
      inRangeOrders = allNormalized;
    }

    // Filter by status
    if (qStatus && qStatus !== 'ALL') {
      const qs = qStatus.toLowerCase();
      inRangeOrders = inRangeOrders.filter((o) => {
        if (qs === 'failed') return o.paymentStatus === 'failed';
        if (qs === 'returned') return o.orderStatus === 'returned' || o.orderStatus === 'refunded';
        return o.orderStatus.toLowerCase() === qs;
      });
    }

    // Filter by payment method
    if (qPayment && qPayment !== 'ALL') {
      inRangeOrders = inRangeOrders.filter((o) => o.paymentMethod.toUpperCase() === qPayment.toUpperCase());
    }

    // Filter by text search
    if (qSearch && qSearch.trim()) {
      const q = qSearch.trim().toLowerCase();
      inRangeOrders = inRangeOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q)
      );
    }

    // Build CSV
    const headers = [
      'ORDER_ID',
      'TRACKING_REF',
      'CREATED_DATE',
      'CUSTOMER_NAME',
      'CUSTOMER_EMAIL',
      'CUSTOMER_PHONE',
      'DESTINATION_CITY',
      'DESTINATION_STATE',
      'PAYMENT_GATEWAY',
      'PAYMENT_STATUS',
      'ORDER_STATUS',
      'GARMENT_UNITS',
      'ITEMS_SUBTOTAL_INR',
      'TAX_GST_INR',
      'SHIPPING_FEE_INR',
      'TOTAL_AMOUNT_INR',
    ];

    const rows = inRangeOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.trackingNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerEmail.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.city.replace(/"/g, '""')}"`,
      `"${o.state.replace(/"/g, '""')}"`,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus.toUpperCase()}"`,
      `"${o.orderStatus.toUpperCase()}"`,
      o.itemsCount,
      o.itemsPrice,
      o.taxPrice,
      o.shippingPrice,
      o.totalPrice,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const statusTag = qStatus && qStatus !== 'ALL' ? `_${qStatus.toUpperCase()}` : '';
    const fileName = `DRAPZA_FINANCIAL_REPORT${statusTag}_${timeframe.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('[REPORT] Export Excel Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Export error' });
  }
};

// 3. Seed Realistic Multi-Status Orders for Complete Analytics Testing
export const seedDemoOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const statuses = ['DELIVERED', 'DELIVERED', 'SHIPPED', 'CONFIRMED', 'CANCELLED', 'RETURNED'];
    const paymentMethods = ['RAZORPAY', 'CASHFREE', 'COD', 'UPI_DIRECT'];
    const cities = [
      { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
      { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
      { city: 'New Delhi', state: 'Delhi', pin: '110001' },
      { city: 'Pune', state: 'Maharashtra', pin: '411001' },
      { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
    ];

    const garments = [
      { name: 'TACTICAL CARGO PARACHUTE PANT', price: 2890, img: '/images/drapza/products/product_1.png' },
      { name: 'DECONSTRUCTED KIMONO JACKET', price: 4200, img: '/images/drapza/products/product_2.png' },
      { name: 'SHEERFORM OVERSIZED TEE', price: 1650, img: '/images/drapza/products/product_3.png' },
      { name: 'ANARKALI KURTI V2', price: 1850, img: '/images/drapza/products/product_4.png' },
      { name: 'KANJIVARAM SILK SAREE', price: 3450, img: '/images/drapza/products/product_5.png' },
    ];

    const names = ['Aarav Mehta', 'Ananya Sharma', 'Rohan Verma', 'Isha Singhania', 'Kabir Sen', 'Mira Rajput'];
    const now = Date.now();
    const demoOrders: any[] = [];

    for (let i = 0; i < 25; i++) {
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      const randName = names[i % names.length];
      const randCity = cities[i % cities.length];
      const randStatus = statuses[i % statuses.length];
      const randMethod = paymentMethods[i % paymentMethods.length];
      const randGarment = garments[i % garments.length];
      const qty = (i % 3) + 1;
      const total = randGarment.price * qty;
      const daysAgo = Math.floor(Math.random() * 45); // Spread over past 45 days
      const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      demoOrders.push({
        orderId: `DPZ-${randSuffix}`,
        orderNumber: `DPZ-${randSuffix}`,
        customerName: randName,
        customerEmail: `${randName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        customerPhone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        customer: {
          firstName: randName.split(' ')[0],
          lastName: randName.split(' ')[1] || '',
          email: `${randName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
        address: {
          line1: `Suite ${i + 10}, Horizon Towers`,
          city: randCity.city,
          state: randCity.state,
          pincode: randCity.pin,
          country: 'India',
        },
        shippingAddress: {
          fullName: randName,
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          street: `Suite ${i + 10}, Horizon Towers`,
          city: randCity.city,
          state: randCity.state,
          postalCode: randCity.pin,
          country: 'India',
        },
        items: [
          {
            name: randGarment.name,
            price: randGarment.price,
            quantity: qty,
            selectedSize: 'L',
            color: '#0a0a0a',
            image: randGarment.img,
          },
        ],
        orderItems: [
          {
            name: randGarment.name,
            price: randGarment.price,
            quantity: qty,
            size: 'L',
            color: '#0a0a0a',
            image: randGarment.img,
          },
        ],
        total,
        totalPrice: total,
        status: randStatus,
        orderStatus: randStatus.toLowerCase(),
        paymentStatus: randStatus === 'CANCELLED' ? 'FAILED' : randMethod === 'COD' ? 'PENDING' : 'PAID',
        paymentMethod: randMethod,
        trackingRef: `TRK-DPZ-${randSuffix}`,
        trackingNumber: `TRK-DPZ-${randSuffix}`,
        createdAt: date,
        updatedAt: date,
      });
    }

    await Order.insertMany(demoOrders);

    res.status(200).json({
      success: true,
      message: `Successfully seeded ${demoOrders.length} multi-period orders for complete analytics testing.`,
      count: demoOrders.length,
    });
  } catch (error: any) {
    console.error('[REPORT] Seed Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Seed failed' });
  }
};

export const getAbandonedCarts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mockCarts = [
      {
        cartId: 'BAG-REC-8921',
        userName: 'Aarav Mehta',
        userEmail: 'aarav.m@gmail.com',
        userPhone: '+91 98201 44521',
        itemCount: 2,
        totalAmount: 3880,
        items: [
          {
            productId: '6abf8f0d8a2b388b59afef78',
            productName: 'ANARKALI KURTI',
            image: '/images/drapza/products/product_1.png',
            price: 1440,
            qty: 1,
            size: 'M',
            color: 'Black',
          },
          {
            productId: '6abf8f0d8a2b388b59afef79',
            productName: 'OVERSIZED TEE 480 GSM',
            image: '/images/drapza/products/product_6.png',
            price: 2440,
            qty: 1,
            size: 'L',
            color: 'Obsidian',
          },
        ],
        lastActiveAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        recoveryStatus: 'pending',
      },
      {
        cartId: 'BAG-REC-7344',
        userName: 'Rhea Kapoor',
        userEmail: 'rhea.kapoor@atelier.in',
        userPhone: '+91 97112 88390',
        itemCount: 1,
        totalAmount: 1890,
        items: [
          {
            productId: '6abf8f0d8a2b388b59afef78',
            productName: 'ANARKALI KURTI',
            image: '/images/drapza/products/product_1.png',
            price: 1890,
            qty: 1,
            size: 'S',
            color: 'Sand Beige',
          },
        ],
        lastActiveAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        recoveryStatus: 'email_sent',
      },
      {
        cartId: 'BAG-REC-6109',
        userName: 'Kabir Singhania',
        userEmail: 'kabir.s@luxmail.com',
        userPhone: '+91 99881 23450',
        itemCount: 3,
        totalAmount: 6250,
        items: [
          {
            productId: '6abf8f0d8a2b388b59afef78',
            productName: 'ROYAL ANGRAKHA OVERLAP',
            image: '/images/drapza/products/product_11.png',
            price: 3250,
            qty: 1,
            size: 'XL',
            color: 'Onyx',
          },
        ],
        lastActiveAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        recoveryStatus: 'recovered',
      },
    ];

    const totalAbandonedCarts = mockCarts.length;
    const totalLostGmv = mockCarts.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalAbandonedItems = mockCarts.reduce((acc, c) => acc + c.itemCount, 0);
    const recoveryPotential = Math.round(totalLostGmv * 0.45);

    const payload = {
      summary: {
        totalAbandonedCarts,
        totalLostGmv,
        totalAbandonedItems,
        recoveryPotential,
      },
      carts: mockCarts,
    };

    res.status(200).json({
      success: true,
      data: payload,
      ...payload,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

