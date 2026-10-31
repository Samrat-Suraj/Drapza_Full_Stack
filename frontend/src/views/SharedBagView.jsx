'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { sharedBagApi } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/ContactForm';
import { ProductCard } from '@/components/drapza/ProductCard';

export const SharedBagView = ({ shareId }) => {
  const router = useRouter();
  const { addToCart, addMultipleToCart, openCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [sharedBag, setSharedBag] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState({});
  const [activeUsersCount, setActiveUsersCount] = useState(1);
  const [realtimeToasts, setRealtimeToasts] = useState([]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!shareId) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    sharedBagApi
      .getSharedBag(shareId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && res.sharedBag) {
          setSharedBag(res.sharedBag);
        } else {
          setErrorMsg(res?.message || 'This shared bag is invalid or has expired.');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setErrorMsg('Unable to retrieve shared bag. Please check the link.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  // Connect to Socket.IO for Real-Time Collaborative Add-to-Bag
  useEffect(() => {
    if (!shareId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:5000');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SHARED_BAG_SOCKET] Connected to real-time session:', socket.id);
      socket.emit('shared-bag:join', {
        shareId,
        userName: sharedBag?.sharerName ? `Shared Friend` : 'Shared Shopper',
      });
    });

    // Update real-time active viewers count
    socket.on('shared-bag:presence', (data) => {
      if (data && typeof data.activeCount === 'number') {
        setActiveUsersCount(data.activeCount);
      }
    });

    // Listen when another shared user adds a product to bag in real-time
    socket.on('shared-bag:item-added', (data) => {
      if (!data || !data.item) return;
      const toastId = `${Date.now()}-${Math.random()}`;
      const newToast = {
        id: toastId,
        title: 'REAL-TIME BAG SYNC',
        message: `${data.userName || 'A shared friend'} added "${data.item.name}"${data.item.selectedSize ? ` (Size: ${data.item.selectedSize})` : ''} to their bag!`,
        image: data.item.image,
      };
      setRealtimeToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      setTimeout(() => {
        setRealtimeToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    });

    // Listen when another user adds all items in real-time
    socket.on('shared-bag:all-added', (data) => {
      if (!data) return;
      const toastId = `${Date.now()}-${Math.random()}`;
      const newToast = {
        id: toastId,
        title: 'REAL-TIME BAG SYNC',
        message: `${data.userName || 'A shared friend'} just secured all ${data.itemsCount || ''} curated pieces into their bag!`,
      };
      setRealtimeToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      setTimeout(() => {
        setRealtimeToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [shareId, sharedBag?.sharerName]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (typeof window === 'undefined' || !sharedBag) return;
    const url = window.location.href;
    const count = sharedBag.totalCount || sharedBag.items?.length || 0;
    const text = encodeURIComponent(
      `Check out ${sharedBag.sharerName}'s curated Drapza Atelier Bag (${count} garments • ₹${sharedBag.totalAmount.toLocaleString('en-IN')}):\n\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Add all available items into recipient's bag (with Real-Time Socket broadcast)
  const handleAddAllToBag = async () => {
    if (!sharedBag || !sharedBag.items || isAddingAll) return;

    setIsAddingAll(true);

    const availableItems = sharedBag.items.filter(
      (item) => item.isAvailable !== false && (item.currentStock === undefined || item.currentStock > 0)
    );

    if (availableItems.length === 0) {
      alert('All items in this shared bag are currently out of stock.');
      setIsAddingAll(false);
      return;
    }

    if (addMultipleToCart) {
      addMultipleToCart(availableItems);
    } else {
      availableItems.forEach((item) => {
        addToCart(item, item.selectedSize);
      });
    }

    // Broadcast real-time event to socket room
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('shared-bag:add-all', {
        shareId,
        itemsCount: availableItems.length,
        totalAmount: sharedBag.totalAmount,
        userName: 'Shared Shopper',
      });
    }

    setAddedAllSuccess(true);
    setIsAddingAll(false);

    // Open bag drawer so recipient immediately sees the added items
    setTimeout(() => {
      if (openCart) openCart();
    }, 400);

    setTimeout(() => {
      setAddedAllSuccess(false);
    }, 4000);
  };

  // Add individual item to bag (with Real-Time Socket broadcast)
  const handleAddSingleItem = (item) => {
    if (item.isAvailable === false || item.currentStock === 0) return;

    addToCart(item, item.selectedSize);

    // Emit real-time socket event so other viewers/sharer see the live cart addition
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('shared-bag:add-item', {
        shareId,
        item: {
          name: item.name,
          price: item.price,
          selectedSize: item.selectedSize,
          quantity: item.quantity || 1,
          image: item.image,
        },
        userName: 'Shared Shopper',
      });
    }

    const key = item.cartItemId || item.name;
    setAddedItemMap((prev) => ({
      ...prev,
      [key]: true,
    }));

    setTimeout(() => {
      setAddedItemMap((prev) => ({
        ...prev,
        [key]: false,
      }));
    }, 2500);
  };

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div
        className="page"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--base-100, #edf1e8)',
          color: 'var(--base-700, #0f0f0f)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <Loader2 size={36} className="animate-spin text-neutral-800 mb-4" />
        <h2
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.82rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--base-700, #0f0f0f)',
          }}
        >
          RECOVERING ATELIER CURATION...
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.72rem',
            color: 'var(--base-400, #969992)',
            marginTop: '0.35rem',
          }}
        >
          Verifying shared inventory in database
        </p>
      </div>
    );
  }

  // ================= ERROR / NOT FOUND STATE =================
  if (errorMsg || !sharedBag) {
    return (
      <div
        className="page"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--base-100, #edf1e8)',
          color: 'var(--base-700, #0f0f0f)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: '8rem',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              backgroundColor: 'var(--base-200, #d7dbd2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <AlertCircle size={28} color="#0f0f0f" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-koulen), sans-serif',
              fontSize: '2rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--base-700, #0f0f0f)',
              margin: 0,
            }}
          >
            SHARED BAG NOT FOUND
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '0.78rem',
              color: 'var(--base-500, #7d807a)',
              marginTop: '0.75rem',
              lineHeight: 1.6,
            }}
          >
            {errorMsg || 'This curated bag link has expired after 30 days or is no longer accessible.'}
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => router.push('/wardrobe')}
              style={{
                padding: '0.85rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: 'var(--base-700, #0f0f0f)',
                color: '#ffffff',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Browse Wardrobe
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{
                padding: '0.85rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#0f0f0f',
                border: '1px solid var(--base-200, #d7dbd2)',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Return Home
            </button>
          </div>
        </div>
        <ContactForm />
        <Footer navigate={(path) => router.push(path)} />
      </div>
    );
  }

  const items = sharedBag.items || [];
  const totalCount = sharedBag.totalCount || items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const totalAmount = sharedBag.totalAmount || items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);

  return (
    <div
      className="page shared-bag-page"
      style={{
        backgroundColor: 'var(--base-100, #edf1e8)',
        minHeight: '100vh',
        color: 'var(--base-700, #0f0f0f)',
        paddingTop: '6.5rem',
        position: 'relative',
      }}
    >
      {/* Real-Time Socket.IO Floating Activity Toasts */}
      <div
        style={{
          position: 'fixed',
          top: '5.5rem',
          right: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          pointerEvents: 'none',
          maxWidth: '380px',
        }}
      >
        {realtimeToasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#0f0f0f',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              pointerEvents: 'auto',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '6px',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={14} color="#ffffff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  color: '#22c55e',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {toast.title}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  color: '#ffffff',
                  marginTop: '0.2rem',
                  lineHeight: 1.35,
                }}
              >
                {toast.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {/* Top Breadcrumb & Share Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => router.push('/wardrobe')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--base-500, #7d807a)',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Wardrobe</span>
          </button>

          {/* Action Pills in Top Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                height: '36px',
                padding: '0 0.95rem',
                borderRadius: '6px',
                backgroundColor: copied ? '#22c55e' : '#ffffff',
                border: copied ? '1px solid #22c55e' : '1px solid var(--base-200, #d7dbd2)',
                color: copied ? '#ffffff' : '#0f0f0f',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? (
                <Check size={14} color="#ffffff" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              ) : (
                <Copy size={14} color="#0f0f0f" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  color: copied ? '#ffffff' : '#0f0f0f',
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-mono), monospace',
                }}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                height: '36px',
                padding: '0 1.05rem',
                borderRadius: '6px',
                backgroundColor: '#25D366',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.28)',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#ffffff"
                  width="16"
                  height="16"
                  style={{
                    width: '16px',
                    height: '16px',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    display: 'block',
                    flexShrink: 0,
                  }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <span
                style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-mono), monospace',
                }}
              >
                Share
              </span>
            </button>
          </div>
        </div>

        {/* Hero Header & Primary Add All Action */}
        <div
          style={{
            marginTop: '0.75rem',
            marginBottom: '1.75rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--base-200, #d7dbd2)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
                marginBottom: '0.45rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--base-500, #7d807a)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                [ ATELIER PROTOCOL // SHARED CURATION ]
              </span>

              {/* Real-Time Live Presence Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--base-200, #d7dbd2)',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontWeight: 700,
                  color: '#0f0f0f',
                  letterSpacing: '0.05em',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'inline-block',
                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                  }}
                />
                <span>{activeUsersCount} ACTIVE NOW (LIVE SYNC)</span>
              </div>
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-koulen), sans-serif',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 400,
                letterSpacing: '0.04em',
                lineHeight: 1,
                color: 'var(--base-700, #0f0f0f)',
                textTransform: 'uppercase',
              }}
            >
              {sharedBag.sharerName}&apos;S SHARED BAG
            </h1>
            <p
              style={{
                margin: '0.5rem 0 0 0',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.78rem',
                color: 'var(--base-500, #7d807a)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <strong style={{ color: 'var(--base-700, #0f0f0f)' }}>{totalCount} GARMENT{totalCount !== 1 ? 'S' : ''}</strong> SELECTED • TOTAL VALUATION: <strong style={{ color: 'var(--base-700, #0f0f0f)' }}>₹{totalAmount.toLocaleString('en-IN')}</strong>
            </p>
          </div>

          {/* Primary Action Button: Add All to My Bag (Fixed High-Contrast Colors) */}
          <div>
            <button
              type="button"
              onClick={handleAddAllToBag}
              disabled={isAddingAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.85rem 1.65rem',
                backgroundColor: addedAllSuccess ? '#22c55e' : '#0f0f0f',
                color: '#ffffff',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                border: 'none',
                cursor: isAddingAll ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              {isAddingAll ? (
                <>
                  <Loader2 size={16} color="#ffffff" className="animate-spin" />
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>ADDING TO BAG...</span>
                </>
              ) : addedAllSuccess ? (
                <>
                  <Check size={16} color="#ffffff" strokeWidth={2.5} />
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>ALL ADDED TO YOUR BAG!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={16} color="#ffffff" />
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    ADD ALL TO MY BAG ({totalCount})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informational Merging Notice */}
        <div
          style={{
            marginBottom: '2rem',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#ffffff',
            border: '1px solid var(--base-200, #d7dbd2)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.75rem',
            color: 'var(--base-600, #4b5563)',
          }}
        >
          <span>
            These pieces were curated by <strong style={{ color: '#0f0f0f' }}>{sharedBag.sharerName}</strong>. Adding them merges safely with your existing bag without replacing your current selections.
          </span>
        </div>

        {/* Product Cards Grid - Clean 4-Column Responsive Grid matching Home Page and Wardrobe */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          style={{
            width: '100%',
            marginBottom: '2.5rem',
          }}
        >
          {items.map((item, idx) => {
            const isItemAvailable = item.isAvailable !== false && (item.currentStock === undefined || item.currentStock > 0);
            const itemKey = item.cartItemId || `${item.name}-${item.selectedSize}-${idx}`;
            const isSingleAdded = addedItemMap[item.cartItemId || item.name];
            const activeImage = item.image || (item.images && item.images[0]) || '/products/product_1.png';
            const price = Number(item.price) || 0;

            return (
              <div
                key={itemKey}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Variant & QTY Badges on Top Left */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    pointerEvents: 'none',
                  }}
                >
                  {item.selectedSize && (
                    <span
                      style={{
                        backgroundColor: 'var(--base-700, #0f0f0f)',
                        color: '#ffffff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      SIZE: {item.selectedSize}
                    </span>
                  )}
                  {item.quantity > 1 && (
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#0f0f0f',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      QTY: {item.quantity}
                    </span>
                  )}
                </div>

                {/* Stock Out Badge on Top Right */}
                {!isItemAvailable && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      OUT OF STOCK
                    </span>
                  </div>
                )}

                {/* Official DRAPZA Home Page ProductCard */}
                <ProductCard
                  id={item.cartItemId || item.productId}
                  name={item.name}
                  price={price}
                  imageUrl={activeImage}
                  slug={item.slug}
                  className="h-full"
                  product={item}
                  discountTagActive={item.discountTagActive}
                  discountPercentage={item.discountPercentage}
                  discountPrice={item.discountPrice}
                  offerTag={item.offerTag}
                  originalPrice={item.numericPrice || item.price}
                  onNavigate={(path) => router.push(path)}
                  onAddToCart={isItemAvailable ? () => handleAddSingleItem(item) : undefined}
                  buttonLabel={
                    isSingleAdded
                      ? 'ADDED TO BAG ✓'
                      : isItemAvailable
                        ? item.quantity > 1
                          ? `ADD ${item.quantity} TO BAG`
                          : 'ADD TO BAG'
                        : 'OUT OF STOCK'
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Callout Bar */}
        <div
          style={{
            marginTop: '3.5rem',
            padding: '2rem 2.5rem',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--base-200, #d7dbd2)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-koulen), sans-serif',
                fontSize: '1.65rem',
                letterSpacing: '0.04em',
                color: 'var(--base-700, #0f0f0f)',
                textTransform: 'uppercase',
              }}
            >
              READY TO SECURE THESE PIECES?
            </h3>
            <p
              style={{
                margin: '0.4rem 0 0 0',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.78rem',
                color: 'var(--base-500, #7d807a)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Add all {totalCount} garments to your bag and proceed directly to atelier checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddAllToBag}
            disabled={isAddingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.9rem 1.75rem',
              backgroundColor: addedAllSuccess ? '#22c55e' : '#0f0f0f',
              color: '#ffffff',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: '8px',
              border: 'none',
              cursor: isAddingAll ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            {isAddingAll ? (
              <>
                <Loader2 size={16} color="#ffffff" className="animate-spin" />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>ADDING TO BAG...</span>
              </>
            ) : addedAllSuccess ? (
              <>
                <Check size={16} color="#ffffff" strokeWidth={2.5} />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>ALL PIECES IN BAG!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} color="#ffffff" />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>
                  ADD ALL TO MY BAG ({totalCount}) &rarr;
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <ContactForm />
      <Footer navigate={(path) => router.push(path)} />
    </div>
  );
};
