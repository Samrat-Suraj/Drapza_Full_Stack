'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyTrackOrderQuery } from '../redux/api/orderApi';
import { Footer } from '../components/Footer';
import { CustomerReturnModal } from '../components/drapza/CustomerReturnModal';
import { CancelOrderModal } from '../components/drapza/CancelOrderModal';
import { TrackOrderSkeleton } from '../components/drapza/skeletons';
import { trackOrderInputSchema, getZodErrorMessage } from '../lib/validation';
import { Ban, RotateCcw } from 'lucide-react';
import '../styles/track.css';

export const TrackPage = () => {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState('');
  const [trackError, setTrackError] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [triggerTrack, { data: orderResult, isLoading, isError, error }] = useLazyTrackOrderQuery();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('orderId');
        if (ref) {
          const clean = ref.trim().toUpperCase();
          const validation = trackOrderInputSchema.safeParse({ trackingRef: clean });
          if (validation.success) {
            setTrackingInput(clean);
            triggerTrack(clean);
          }
        }
      } catch (e) {
        console.error('Error parsing track query params:', e);
      }
    }
  }, [triggerTrack]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    setTrackError('');
    const clean = trackingInput.trim().toUpperCase();
    const validation = trackOrderInputSchema.safeParse({ trackingRef: clean });
    if (!validation.success) {
      setTrackError(getZodErrorMessage(validation.error));
      return;
    }
    triggerTrack(clean);
  };

  const defaultCheckpoints = [
    { title: 'Order Confirmed', desc: 'Atelier registered and material assigned', done: true },
    { title: 'Tailoring & Construction', desc: 'Modular seam sealing & craftsmanship', done: true },
    { title: 'Quality Control Inspection', desc: 'Passed waterproof & stress standards', done: true },
    { title: 'Dispatched to Air Freight', desc: 'Handed to premium courier dispatch', done: false },
    { title: 'Out for Final Delivery', desc: 'Arriving at destination address', done: false },
  ];

  const activeCheckpoints = orderResult?.checkpoints || defaultCheckpoints;

  const rawStatus = String(orderResult?.order?.status || '').toUpperCase();
  const isCancelled = rawStatus === 'CANCELLED';
  const isDelivered = rawStatus === 'DELIVERED';
  const isInTransit = ['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(rawStatus);
  const isAtelier = ['PENDING', 'CONFIRMED', 'PROCESSING', 'TAILORING', 'QUALITY_CHECK'].includes(rawStatus);

  // 1. Cancel is allowed ONLY pre-dispatch (Atelier stage)
  const isCancellable = Boolean(orderResult?.order && isAtelier && !isCancelled);

  // 2. Return/Exchange is allowed ONLY post-delivery within 14 days
  const deliveryDate = new Date(orderResult?.order?.updatedAt || orderResult?.order?.createdAt || Date.now());
  const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
  const isReturnEligible = Boolean(orderResult?.order && isDelivered && daysSinceDelivery <= 14);
  const isReturnExpired = Boolean(orderResult?.order && isDelivered && daysSinceDelivery > 14);
  const returnDaysRemaining = Math.max(0, 14 - daysSinceDelivery);

  return (
    <div className="track-page">
      {/* Top Header */}
      <header className="track-top-bar">
        <button
          onClick={() => router.push('/')}
          className="track-return-btn"
          aria-label="Return to store"
        >
          <span>←</span>
          <span>RETURN TO STORE</span>
        </button>
        <span className="track-telemetry-badge">
          LOGISTICS TELEMETRY // LIVE
        </span>
      </header>

      <div className="track-container">
        {/* Title */}
        <div className="track-hero">
          <span className="track-hero-tag">
            ATELIER TRACKING SYSTEM
          </span>
          <h1 className="track-hero-title">
            TRACK YOUR SHIPMENT
          </h1>
          <p className="track-hero-desc">
            Enter your order reference code or tracking number (e.g. DPZ-88210) to trace dispatch status in real time.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleTrackSubmit}
          noValidate
          className="track-search-form"
        >
          <div className="track-search-row">
            <div className="track-search-input-wrap">
              <input
                type="text"
                placeholder="e.g. DPZ-774921 or Tracking No."
                value={trackingInput}
                onChange={(e) => {
                  setTrackingInput(e.target.value);
                  if (trackError) setTrackError('');
                }}
                className={`track-search-input ${trackError ? 'error' : ''}`}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="track-search-submit"
            >
              {isLoading ? 'Tracing...' : 'Track →'}
            </button>
          </div>
          {trackError && (
            <p className="track-search-error">
              {trackError}
            </p>
          )}
        </form>

        {/* Live / Simulated Tracking Timeline */}
        {isLoading ? (
          <TrackOrderSkeleton />
        ) : (
          <div className="track-card">
            <div className="track-card-header">
              <div>
                <p className="track-ref-label">
                  REFERENCE
                </p>
                <h3 className="track-ref-value">
                  {trackingInput ? trackingInput.toUpperCase() : 'DEMO DPZ-90214-X'}
                </h3>
              </div>
              <div>
                <p className="track-status-label">
                  CURRENT STATUS
                </p>
                <span className={`track-status-pill ${isCancelled ? 'cancelled' : ''}`}>
                  {isCancelled ? 'CANCELLED • REVOKED' : (orderResult?.order?.status ? `${orderResult.order.status} • AIRWAYS` : 'IN TRANSIT • AIRWAYS')}
                </span>
              </div>
            </div>

            {/* Cancellation Notice Banner */}
            {isCancelled && (
              <div className="track-cancel-banner">
                <Ban style={{ width: '18px', height: '18px', color: '#b91c1c', flexShrink: 0 }} />
                <div>
                  <strong>CONSIGNMENT REVOKED:</strong> {orderResult?.order?.cancellationReason || 'Fabric allocation released back into atelier archive.'}
                </div>
              </div>
            )}

            {/* Timeline Checkpoints */}
            <div className="track-timeline">
              {(() => {
                const activeIndex = orderResult
                  ? activeCheckpoints.findIndex((s) => !s.done)
                  : 3;

                return activeCheckpoints.map((step, idx) => {
                  const isLast = idx === activeCheckpoints.length - 1;
                  const isDone = orderResult ? step.done : idx < 3;
                  const isActive = !isDone && (orderResult ? idx === activeIndex : idx === 3);
                  const isPending = !isDone && !isActive;

                  return (
                    <div key={idx} className="track-step">
                      <div className="track-step-marker-col">
                        <div
                          className={`track-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}
                        >
                          {isDone ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isActive ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0f0f0f">
                              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                          ) : (
                            <span className="track-step-num">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`track-step-line ${isDone && (orderResult ? activeCheckpoints[idx + 1]?.done : idx < 2) ? 'done' : ''}`}
                          />
                        )}
                      </div>
                      <div className="track-step-content">
                        <h4 className={`track-step-title ${isPending ? 'pending' : ''}`}>
                          {step.title}
                        </h4>
                        <p className={`track-step-desc ${isPending ? 'pending' : ''}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Active Reverse Logistics Tracking Card (Uses Same Order Tracking ID) */}
        {orderResult?.returnRequest && (
          <div className="track-action-box reverse">
            <div className="track-action-box-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e9d5ff', paddingBottom: '1.15rem', marginBottom: '1.25rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce', flexShrink: 0 }}>
                  <RotateCcw style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono)', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                    ATELIER REVERSE CONCIERGE &bull; ACTIVE PROTOCOL
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#581c87', fontFamily: 'var(--font-dm-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {orderResult.returnRequest.requestType === 'exchange' ? 'SIZE EXCHANGE' : 'RETURN & REFUND'} &bull; #{orderResult.order?.orderId}
                  </h4>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', backgroundColor: '#7e22ce', color: '#ffffff', padding: '0.35rem 0.95rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {orderResult.returnRequest.status.replace('_', ' ')}
                </span>
                {orderResult.returnRequest.courierAwb && (
                  <div style={{ fontSize: '0.74rem', color: '#6b21a8', marginTop: '0.4rem', fontFamily: 'var(--font-dm-mono)' }}>
                    Reverse AWB: <strong>{orderResult.returnRequest.courierAwb}</strong> ({orderResult.returnRequest.courierPartner || 'Delhivery'})
                  </div>
                )}
              </div>
            </div>

            <div className="track-reverse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', width: '100%' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#7e22ce', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>UNIFIED TRACKING ID</span>
                <div style={{ fontWeight: 800, color: '#3b0764', fontFamily: 'var(--font-dm-mono)', fontSize: '1rem', marginTop: '0.2rem' }}>{orderResult.order?.orderId}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#7e22ce', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>REVERSE PROTOCOL</span>
                <div style={{ fontWeight: 700, color: '#3b0764', textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  {orderResult.returnRequest.requestType} {orderResult.returnRequest.exchangeSize ? `(Target Size: ${orderResult.returnRequest.exchangeSize})` : ''}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#7e22ce', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>ESCROW REFUND / VALUE</span>
                <div style={{ fontWeight: 800, color: '#3b0764', fontFamily: 'var(--font-dm-mono)', fontSize: '1rem', marginTop: '0.2rem' }}>₹{(orderResult.returnRequest.refundAmount || orderResult.order?.total || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Shipment Concierge Box (if order is cancellable) */}
        {isCancellable && (
          <div className="track-action-box cancel">
            <div className="track-action-content">
              <div className="track-action-icon-wrap" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                <Ban style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f0f0f', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono)' }}>
                  Need to Cancel Before Courier Dispatch?
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#71717a' }}>
                  This consignment is currently in atelier fabrication. 100% escrow refund &amp; zero penalty cancellation available.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="track-action-btn track-action-btn-cancel"
            >
              <Ban style={{ width: '13px', height: '13px' }} />
              <span>Cancel Order</span>
            </button>
          </div>
        )}

        {/* State A: Delivered & Return/Exchange Window Active */}
        {isReturnEligible && (
          <div className="track-action-box return">
            <div className="track-action-content">
              <div className="track-action-icon-wrap" style={{ backgroundColor: 'rgba(15, 15, 15, 0.06)', color: '#0f0f0f' }}>
                <RotateCcw style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 500, color: '#0f0f0f', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                    Need a Size Exchange or Return?
                  </h4>
                  <span style={{ fontSize: '0.65rem', fontWeight: 500, fontFamily: 'var(--font-dm-mono), monospace', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {returnDaysRemaining} DAYS REMAINING
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#71717a' }}>
                  14-day door-to-door complimentary exchanges &amp; escrow refund protocol active for this delivered piece.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReturnModalOpen(true)}
              className="track-action-btn track-action-btn-return"
            >
              <span>Request Return / Exchange</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* State B: In Transit with Courier */}
        {isInTransit && (
          <div className="track-action-box transit">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f0f0f', flexShrink: 0 }} />
              <div>
                <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono)', color: '#0f0f0f' }}>
                  CONSIGNMENT EN ROUTE WITH COURIER
                </h5>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#555852' }}>
                  Handed to 3PL logistics. Doorstep Return &amp; Size Exchange protocol activates upon successful doorstep delivery.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#7d807a', textTransform: 'uppercase' }}>
              REVERSE PROTOCOL PENDING DELIVERY
            </span>
          </div>
        )}

        {/* State C: Delivered but > 14 Days (Expired) */}
        {isReturnExpired && (
          <div className="track-action-box expired">
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#7d807a', fontFamily: 'var(--font-dm-mono)' }}>
              THE 14-DAY POLICY WINDOW FOR DOORSTEP RETURN &amp; EXCHANGE HAS CONCLUDED FOR THIS DELIVERED PIECE.
            </p>
            <a
              href="https://wa.me/918888333038?text=Hello%20DRAPZA,%20inquiring%20about%20my%20delivered%20order"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f0f0f', textDecoration: 'underline', fontFamily: 'var(--font-dm-mono)' }}
            >
              Contact Concierge Desk
            </a>
          </div>
        )}
      </div>

      <Footer style={{ marginTop: 0 }} />

      {/* Customer Return & Exchange Modal */}
      <CustomerReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        order={orderResult?.order}
      />

      {/* Customer Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          if (trackingInput.trim()) {
            triggerTrack(trackingInput.trim().toUpperCase());
          }
        }}
        order={orderResult?.order}
      />
    </div>
  );
};

export default TrackPage;
