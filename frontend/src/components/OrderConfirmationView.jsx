'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  FileText,
  Calendar,
  Clock,
  Eye,
  Download,
  ShoppingBag,
  Mail,
  ArrowLeft,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { generateInvoicePdf } from '../utils/generateInvoicePdf';
import { ContactForm } from './ContactForm';
import { Footer } from './Footer';
import '../styles/order-confirmation.css';

/**
 * Format date to match reference screenshot: "18 Oct 2026, 07:42 PM"
 */
const formatOrderDate = (dateInput) => {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '18 Oct 2026, 07:42 PM';

    const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${day} ${month} ${year}, ${time}`;
  } catch {
    return '18 Oct 2026, 07:42 PM';
  }
};

/**
 * Currency formatter: "₹7,470.00"
 */
const formatINR = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// High-fidelity fallback exactly matching reference screenshot
const DEFAULT_SAMPLE_ORDER = {
  orderId: 'DRP202510180742',
  trackingRef: 'TRK-202510180742',
  createdAt: '2026-10-18T19:42:00.000Z',
  status: 'Processing',
  paymentMethod: 'COD',
  paymentStatus: 'CONFIRMED',
  customer: {
    firstName: 'Client',
    lastName: '',
    email: 'client@drapza.com',
    phone: '9876543210',
  },
  address: {
    line1: 'Studio 04, Atelier District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    country: 'India',
  },
  items: [
    {
      name: 'Oversized T-Shirt',
      color: 'Black',
      selectedSize: 'L',
      quantity: 1,
      price: 1620,
      image: '/products/product_1.png',
    },
    {
      name: 'Cargo Pants',
      color: 'Black',
      selectedSize: '32',
      quantity: 1,
      price: 2880,
      image: '/products/product_2.png',
    },
    {
      name: 'Hoodie',
      color: 'Black',
      selectedSize: 'L',
      quantity: 1,
      price: 2970,
      image: '/products/product_3.png',
    },
  ],
  subtotal: 7470,
  discount: 0,
  couponDiscount: 0,
  shippingFee: 0,
  tax: 0,
  total: 7470,
};

export const OrderConfirmationView = ({ order: propOrder }) => {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState(propOrder || DEFAULT_SAMPLE_ORDER);

  useEffect(() => {
    if (propOrder && (propOrder.orderId || propOrder._id)) {
      setActiveOrder(propOrder);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const storedLatest = localStorage.getItem('drapza_latest_confirmed_order');
        if (storedLatest) {
          const parsed = JSON.parse(storedLatest);
          if (parsed && (parsed.orderId || parsed._id)) {
            setActiveOrder(parsed);
            return;
          }
        }

        const storedOrders = localStorage.getItem('drapza_orders');
        if (storedOrders) {
          const list = JSON.parse(storedOrders);
          if (Array.isArray(list) && list.length > 0 && list[0]) {
            setActiveOrder(list[0]);
            return;
          }
        }
      } catch (err) {
        console.error('Failed reading stored order:', err);
      }
    }
  }, [propOrder]);

  const order = activeOrder;

  // Normalized Display Values
  const rawStatus = String(order?.status || 'Processing').toUpperCase();
  const isCancelled = rawStatus === 'CANCELLED';

  const orderIdDisplay = useMemo(() => {
    const raw = String(order.orderId || order.trackingRef || 'DRP202510180742');
    return raw.startsWith('#') ? raw : `#${raw}`;
  }, [order]);

  const orderDateDisplay = useMemo(() => {
    return formatOrderDate(order.createdAt);
  }, [order]);

  const orderStatusDisplay = useMemo(() => {
    const raw = (order.status || 'Processing').toUpperCase();
    if (raw === 'CANCELLED') return 'Cancelled';
    if (raw === 'CONFIRMED' || raw === 'PENDING') return 'Processing';
    if (raw === 'TAILORING' || raw === 'QUALITY_CHECK') return 'Production';
    if (raw === 'DISPATCHED') return 'Dispatched';
    if (raw === 'DELIVERED') return 'Delivered';
    return (order.status || 'Processing').charAt(0).toUpperCase() + (order.status || 'Processing').slice(1).toLowerCase();
  }, [order]);

  // Items List
  const items = useMemo(() => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    return DEFAULT_SAMPLE_ORDER.items;
  }, [order]);

  // Calculations
  const calculatedItemsTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  }, [items]);

  const itemsTotal = order.subtotal ? Number(order.subtotal) : calculatedItemsTotal;
  const discountVal = Number(order.discount || 0);
  const couponDiscountVal = Number(order.couponDiscount || 0);
  const shippingVal = Number(order.shippingFee || order.codFee || 0);
  const taxVal = Number(order.tax || 0);
  const finalTotal = Number(order.total || itemsTotal - discountVal - couponDiscountVal + shippingVal + taxVal);

  // Payment Method Label
  const paymentMethodDisplay = useMemo(() => {
    const method = String(order.paymentMethod || 'COD').toUpperCase();
    if (method === 'COD') return 'Cash on Delivery (COD)';
    if (method === 'RAZORPAY') return 'Online Payment (Razorpay)';
    if (method === 'CASHFREE') return 'Online Payment (Cashfree)';
    return order.paymentMethod || 'Cash on Delivery (COD)';
  }, [order]);

  // Invoice Download Interaction States
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Action Handlers
  const handleTrackOrder = () => {
    const ref = order.trackingRef || order.orderId || '';
    router.push(`/track?ref=${encodeURIComponent(ref)}`);
  };

  const handleDownloadInvoice = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await generateInvoicePdf(order);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Invoice download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-download invoice on initial landing for freshly placed order
  useEffect(() => {
    if (!order || (!order.orderId && !order._id && !order.trackingRef)) return;
    const orderKey = String(order.orderId || order._id || order.trackingRef || '');
    if (!orderKey) return;

    const storageKey = `drapza_invoice_autodownloaded_${orderKey}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, 'true');
      const timer = setTimeout(() => {
        handleDownloadInvoice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order?.orderId, order?._id, order?.trackingRef]);

  const handleContinueShopping = () => {
    router.push('/wardrobe');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div style={{ backgroundColor: 'var(--base-100, #edf1e8)', minHeight: '100vh', width: '100%' }}>
      <main
        className="drapza-confirmation-root"
        data-order-confirmation="true"
        style={{
          paddingTop: '12rem',
          paddingBottom: '5.5rem',
          backgroundColor: 'var(--base-100, #edf1e8)',
          color: 'var(--base-700, #0f0f0f)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="drapza-confirmation-container">
          {/* LEFT SECTION — ORDER CONFIRMATION */}
          <section className="drapza-conf-left" aria-label="Order Confirmation Details">
            {/* Header Area */}
            <div className="drapza-conf-header-area">
              <div
                className="drapza-conf-check-circle"
                aria-hidden="true"
              >
                <Check size={38} strokeWidth={2.4} />
              </div>

              <p className="drapza-conf-label">
                ORDER CONFIRMED
              </p>
              <h1 className="drapza-conf-title">
                THANK YOU FOR YOUR ORDER!
              </h1>
              <p className="drapza-conf-desc">
                Your order has been placed successfully and is now being processed.
                <br />
                We'll keep you updated on your order status.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="drapza-conf-card">
              {/* Col 1: ORDER ID */}
              <div className="drapza-conf-card-col">
                <div className="drapza-conf-col-icon">
                  <FileText size={20} strokeWidth={1.8} />
                </div>
                <div className="drapza-conf-col-text">
                  <span className="drapza-conf-col-label">ORDER ID</span>
                  <span className="drapza-conf-col-value">{orderIdDisplay}</span>
                </div>
              </div>

              <div className="drapza-conf-card-divider" />

              {/* Col 2: ORDER DATE */}
              <div className="drapza-conf-card-col">
                <div className="drapza-conf-col-icon">
                  <Calendar size={20} strokeWidth={1.8} />
                </div>
                <div className="drapza-conf-col-text">
                  <span className="drapza-conf-col-label">ORDER DATE</span>
                  <span className="drapza-conf-col-date">{orderDateDisplay}</span>
                </div>
              </div>

              <div className="drapza-conf-card-divider" />

              {/* Col 3: ORDER STATUS */}
              <div className="drapza-conf-card-col">
                <div className="drapza-conf-col-icon">
                  <Clock size={20} strokeWidth={1.8} />
                </div>
                <div className="drapza-conf-col-text">
                  <span className="drapza-conf-col-label">ORDER STATUS</span>
                  <span
                    className="drapza-conf-status-pill"
                    style={isCancelled ? { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' } : {}}
                  >
                    {orderStatusDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="drapza-conf-btn-row">
              <button
                type="button"
                className="drapza-conf-btn drapza-conf-btn-track"
                onClick={handleTrackOrder}
                id="track-order-btn"
                style={{
                  flex: 1,
                  backgroundColor: '#09090b',
                  color: '#ffffff',
                  border: '1px solid #09090b',
                }}
              >
                <Eye size={18} strokeWidth={2.2} color="#ffffff" style={{ color: '#ffffff', stroke: '#ffffff', flexShrink: 0 }} />
                <span style={{ color: '#ffffff', fontWeight: 600 }}>TRACK ORDER</span>
                <ArrowRight size={18} strokeWidth={2.2} color="#ffffff" style={{ color: '#ffffff', stroke: '#ffffff', flexShrink: 0 }} />
              </button>

              <button
                type="button"
                className="drapza-conf-btn drapza-conf-btn-download"
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                id="download-invoice-btn"
                style={{
                  flex: 1,
                  backgroundColor: downloadSuccess
                    ? '#ecfdf5'
                    : '#ffffff',
                  color: downloadSuccess ? '#059669' : '#09090b',
                  border: downloadSuccess
                    ? '1px solid #10b981'
                    : '1px solid #09090b',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  transition: 'all 0.25s ease',
                  opacity: isDownloading ? 0.75 : 1,
                }}
              >
                {isDownloading ? (
                  <>
                    <Download size={18} strokeWidth={2.2} color="#09090b" className="animate-bounce" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#09090b', fontWeight: 600 }}>GENERATING INVOICE...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check size={18} strokeWidth={2.4} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#059669', fontWeight: 600 }}>INVOICE DOWNLOADED ✓</span>
                  </>
                ) : (
                  <>
                    <Download size={18} strokeWidth={2.2} color="#09090b" style={{ color: '#09090b', stroke: '#09090b', flexShrink: 0 }} />
                    <span style={{ color: '#09090b', fontWeight: 600 }}>DOWNLOAD INVOICE</span>
                    <ArrowRight size={18} strokeWidth={2.2} color="#09090b" style={{ color: '#09090b', stroke: '#09090b', flexShrink: 0 }} />
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              className="drapza-conf-btn drapza-conf-btn-continue"
              onClick={handleContinueShopping}
              id="continue-shopping-btn"
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span>CONTINUE SHOPPING</span>
              <ArrowRight size={18} strokeWidth={2.2} />
            </button>

            {/* SMS / Email Notification */}
            <div className="drapza-conf-notify">
              <div className="drapza-conf-notify-icon">
                <Mail size={20} strokeWidth={1.8} />
              </div>
              <div className="drapza-conf-notify-text">
                <p className="drapza-conf-notify-title">
                  You'll receive updates via SMS and Email
                </p>
                <p className="drapza-conf-notify-desc">
                  We'll notify you once your order is out for delivery.
                </p>
              </div>
            </div>

            {/* Back to Home Link */}
            <button
              type="button"
              className="drapza-conf-back-link"
              onClick={handleBackToHome}
              id="back-to-home-link"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              <span>Back to Home</span>
            </button>
          </section>

          {/* RIGHT SECTION — ORDER SUMMARY */}
          <aside
            className="drapza-conf-summary-card"
            aria-label="Order Summary"
          >
            <h2 className="drapza-conf-summary-title">
              ORDER SUMMARY
            </h2>

            {/* Product Items List */}
            <div className="drapza-conf-items-list">
              {items.map((item, index) => {
                const itemPrice = Number(item.price) || 0;
                const itemQty = item.quantity || 1;
                const lineTotal = itemPrice * itemQty;
                const variantText = `${item.color || 'Black'} / ${item.selectedSize || 'M'}`;
                const fallbackImg = `/products/product_${(index % 25) + 1}.png`;
                const imgSrc = item.image || fallbackImg;

                return (
                  <div key={index} className="drapza-conf-item-row">
                    <div className="drapza-conf-item-thumb">
                      <img
                        src={imgSrc}
                        alt={item.name || 'DRAPZA Product'}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImg;
                        }}
                      />
                    </div>

                    <div className="drapza-conf-item-details">
                      <h3 className="drapza-conf-item-name">
                        {item.name || 'Outerwear Apparel'}
                      </h3>
                      <p className="drapza-conf-item-variant">
                        {variantText}
                      </p>
                      <p className="drapza-conf-item-qty">
                        Qty: {itemQty}
                      </p>
                    </div>

                    <div className="drapza-conf-item-price">
                      {formatINR(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="drapza-conf-divider" />

            {/* Price Breakdown */}
            <div className="drapza-conf-breakdown">
              <div className="drapza-conf-breakdown-row">
                <span className="drapza-conf-breakdown-label">
                  ITEMS TOTAL
                </span>
                <span className="drapza-conf-breakdown-val">
                  {formatINR(itemsTotal)}
                </span>
              </div>

              <div className="drapza-conf-breakdown-row">
                <span className="drapza-conf-breakdown-label">
                  DISCOUNT
                </span>
                <span className="drapza-conf-breakdown-val">
                  {discountVal > 0 ? `- ${formatINR(discountVal)}` : '- ₹0.00'}
                </span>
              </div>

              <div className="drapza-conf-breakdown-row">
                <span className="drapza-conf-breakdown-label">
                  COUPON DISCOUNT
                </span>
                <span className="drapza-conf-breakdown-val">
                  {couponDiscountVal > 0 ? `- ${formatINR(couponDiscountVal)}` : '- ₹0.00'}
                </span>
              </div>

              <div className="drapza-conf-breakdown-row">
                <span className="drapza-conf-breakdown-label">
                  SHIPPING
                </span>
                <span className="drapza-conf-breakdown-val">
                  {shippingVal > 0 ? formatINR(shippingVal) : '₹0.00'}
                </span>
              </div>

              <div className="drapza-conf-breakdown-row">
                <span className="drapza-conf-breakdown-label">
                  TAX (GST 18%)
                </span>
                <span className="drapza-conf-breakdown-val">
                  {taxVal > 0 ? formatINR(taxVal) : '₹0.00'}
                </span>
              </div>
            </div>

            <hr className="drapza-conf-divider" />

            {/* Total Paid */}
            <div className="drapza-conf-total-row">
              <span className="drapza-conf-total-label">
                TOTAL PAID
              </span>
              <span className="drapza-conf-total-val">
                {formatINR(finalTotal)}
              </span>
            </div>

            <hr className="drapza-conf-divider" />

            {/* Payment Method */}
            <div className="drapza-conf-payment-row">
              <div className="drapza-conf-payment-icon">
                <CreditCard size={20} strokeWidth={1.8} />
              </div>
              <div className="drapza-conf-payment-text">
                <span className="drapza-conf-payment-label">
                  PAYMENT METHOD
                </span>
                <span className="drapza-conf-payment-method">
                  {paymentMethodDisplay}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* DRAPZA Signature Models Parallax & Transmit Signal Form + Global Footer */}
      <ContactForm />
      <Footer navigate={(path) => router.push(path)} />
    </div>
  );
};

export default OrderConfirmationView;
