'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Share2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePageTransition } from './PageTransition';
import { ShareMyBagModal } from './drapza/ShareMyBagModal';
import products from '../data/products.json';
import { whatsAppApi, DEFAULT_WHATSAPP_CONFIG, productsApi } from '../lib/api';

export const CartSidebar = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));

  const [isAuth, setIsAuth] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [stockError, setStockError] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [waConfig, setWaConfig] = useState(DEFAULT_WHATSAPP_CONFIG);

  useEffect(() => {
    let isMounted = true;
    whatsAppApi
      .getConfig()
      .then((res) => {
        if (isMounted && res) {
          const data = res.data || res;
          if (data && typeof data.isEnabled !== 'undefined') {
            setWaConfig(data);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);
  const {
    cartItems,
    isCartOpen,
    openCart,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalCount,
    subtotal,
    savingsTotal,
  } = useCart();

  useEffect(() => {
    setIsCheckingOut(false);
  }, [pathname, isCartOpen]);

  useEffect(() => {
    if (isCartOpen && router?.prefetch) {
      try {
        router.prefetch('/checkout');
      } catch (e) { }
    }
  }, [isCartOpen, router]);

  useEffect(() => {
    const p = window.location.pathname;
    if (p === '/login' || p === '/join' || p === '/signup') {
      setIsAuth(true);
    }
  }, []);

  // Scroll lock when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Close when clicking outside sidebar on the unblurred page
  useEffect(() => {
    if (!isCartOpen) return;
    const handlePointerDown = (e) => {
      if (
        !e.target.closest('.cart-sidebar') &&
        !e.target.closest('.cart-button')
      ) {
        closeCart();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCartOpen, closeCart]);

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    setStockError('');

    // Real-time stock validation check
    try {
      const stockCheckItems = cartItems.map((i) => ({
        productId: i.product || i._id || (i.id && i.id.length === 24 ? i.id : undefined),
        name: i.name,
        slug: i.slug,
        quantity: i.quantity || 1,
      }));
      const stockRes = await productsApi.validateStock(stockCheckItems);
      if (stockRes && stockRes.success && !stockRes.isValid) {
        const outOfStockItem = stockRes.items?.find((item) => !item.isValid);
        setStockError(outOfStockItem?.error || 'Some items in your bag are out of stock.');
        setIsCheckingOut(false);
        return;
      }
    } catch (stockErr) {
      console.warn('Real-time stock validation error:', stockErr);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('drapza_token') : null;
    const targetPath = token ? '/checkout' : '/login?redirect=/checkout';

    if (router?.prefetch) {
      try {
        router.prefetch(targetPath);
      } catch (e) { }
    }

    // Let button loading complete on screen so user gets immediate visual confirmation
    await new Promise((resolve) => setTimeout(resolve, 650));

    // ONLY AFTER button loading completes, close cart and trigger page switch transition
    closeCart();
    if (navigate) {
      navigate(targetPath);
    } else {
      window.location.href = targetPath;
    }
  };

  const toggleCart = () => {
    if (isCartOpen) closeCart();
    else openCart();
  };

  if (isAuth || pathname?.startsWith('/admin')) return null;

  return (
    <>
      <div className="shopping-cart-container">
        {/* Unified Floating Actions Dock: WhatsApp & Bag perfectly aligned */}
        <div
          className="floating-actions-dock"
          style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: waConfig.position === 'bottom-left' ? 'auto' : '1.75rem',
            left: waConfig.position === 'bottom-left' ? '1.75rem' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: waConfig.position === 'bottom-left' ? 'flex-start' : 'flex-end',
            gap: '0.65rem',
            zIndex: 51,
            pointerEvents: 'none',
          }}
        >
          {/* Floating WhatsApp Message Us button (Desktop only, mobile has it in bottom nav) */}
          {waConfig.isEnabled !== false && (
            <a
              className="whatsapp-button !hidden md:!flex"
              href={`https://wa.me/${(waConfig.phoneNumber || '918888333038').replace(/[^0-9]/g, '')}${
                waConfig.prefilledMessage ? `?text=${encodeURIComponent(waConfig.prefilledMessage)}` : ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={waConfig.tooltip || 'Chat on WhatsApp'}
              style={{
                position: 'relative',
                bottom: 'auto',
                right: 'auto',
                left: 'auto',
                top: 'auto',
                margin: 0,
                pointerEvents: 'all',
                ...(waConfig.backgroundColor ? { backgroundColor: waConfig.backgroundColor } : {}),
                ...(waConfig.textColor ? { color: waConfig.textColor } : {}),
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
                style={{ color: waConfig.textColor || '#ffffff' }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
              </svg>
              <span>{waConfig.buttonText || 'MESSAGE US'}</span>
            </a>
          )}

          {/* Floating Bag button (Hidden on mobile as MobileBottomNav handles Bag) */}
          <button
            className="cart-button !hidden md:!flex"
            onClick={toggleCart}
            aria-label="Toggle Bag"
            style={{
              position: 'relative',
              bottom: 'auto',
              right: 'auto',
              left: 'auto',
              top: 'auto',
              margin: 0,
              pointerEvents: 'all',
            }}
          >
            <span className="cart-icon">BAG</span>
            {totalCount > 0 && <span className="cart-count">{totalCount}</span>}
          </button>
        </div>

        {/* Cart Sidebar Drawer */}
        <div
          className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}
          onWheel={(e) => {
            const itemsEl = e.currentTarget.querySelector('.cart-items');
            if (itemsEl) {
              const { scrollTop, scrollHeight, clientHeight } = itemsEl;
              if (
                (scrollTop === 0 && e.deltaY < 0) ||
                (scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0)
              ) {
                e.stopPropagation();
              }
            }
          }}
        >
          <div className="cart-sidebar-content">
            <div className="cart-header">
              <h2>Bag</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    className="cart-share-btn"
                    onClick={() => setIsShareModalOpen(true)}
                    title="Share My Bag"
                    aria-label="Share My Bag"
                  >
                    <Share2 size={12} strokeWidth={2.2} />
                    <span>Share</span>
                  </button>
                )}
                <button className="cart-close" onClick={closeCart}>
                  Close
                </button>
              </div>
            </div>

            <div
              className="cart-items"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <p>Your bag is empty</p>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const pIndex = products.findIndex((p) => p.name === item.name) + 1;
                  const imgSrc = item.image_url || item.image || `/products/product_${pIndex > 0 ? pIndex : 1}.png`;
                  const qty = Number(item.quantity) || 1;
                  const itemPrice = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
                  const origPrice = parseFloat(String(item.originalPrice).replace(/[^\d.]/g, '')) || itemPrice;
                  const hasSavings = origPrice > itemPrice;
                  const itemKey = item.cartItemId || `${item.name}-${item.bogoTier?.id || 'std'}-${idx}`;

                  return (
                    <div
                      className="cart-item"
                      key={itemKey}
                      style={{
                        display: 'flex',
                        gap: '14px',
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        alignItems: 'stretch',
                      }}
                    >
                      {/* Garment Image Thumbnail */}
                      <div
                        className="cart-item-image"
                        style={{
                          width: '92px',
                          minHeight: '124px',
                          alignSelf: 'stretch',
                          backgroundColor: 'var(--base-200, #d7dbd2)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>

                      {/* Garment Details Column */}
                      <div
                        className="cart-item-details"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div>
                          {/* Name & Discount Badge Header */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <p
                              className="cart-item-name"
                              style={{
                                margin: 0,
                                color: 'var(--base-100, #ffffff)',
                                fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                fontSize: '0.84rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                lineHeight: 1.35,
                                flex: 1,
                              }}
                            >
                              {item.name}
                            </p>

                            {/* Promotional Offer Badge */}
                            {item.offerTag && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                  fontWeight: 800,
                                  letterSpacing: '0.08em',
                                  padding: '4px 8px',
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  textTransform: 'uppercase',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  lineHeight: 1.1,
                                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                }}
                              >
                                {item.offerTag}
                              </span>
                            )}
                          </div>

                          {/* Sizes & BOGO Bundle Info */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginTop: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#a1a1aa',
                                fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                              }}
                            >
                              {item.garmentSizes && item.garmentSizes.length > 0
                                ? `Sizes: ${item.garmentSizes.join(', ')}`
                                : `Size: ${item.selectedSize || 'M'}`}
                            </span>

                            {item.bundleTag && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: "var(--font-dm-mono), monospace",
                                  fontWeight: 700,
                                  letterSpacing: '0.06em',
                                  padding: '1px 6px',
                                  backgroundColor: '#ffffff',
                                  color: '#000000',
                                  textTransform: 'uppercase',
                                  borderRadius: '2px',
                                }}
                              >
                                {item.bogoTier?.name || item.bundleTag}
                              </span>
                            )}
                          </div>

                          {/* Pricing and Savings */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '8px',
                              marginTop: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                letterSpacing: '0.02em',
                              }}
                            >
                              ₹{(itemPrice * qty).toLocaleString('en-IN')}
                            </span>

                            {hasSavings && (
                              <span
                                style={{
                                  fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                  fontSize: '0.8rem',
                                  color: '#71717a',
                                  textDecoration: 'line-through',
                                  fontWeight: 500,
                                }}
                              >
                                ₹{(origPrice * qty).toLocaleString('en-IN')}
                              </span>
                            )}

                            {hasSavings && (
                              <span
                                style={{
                                  fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                  fontSize: '10px',
                                  color: '#4ade80',
                                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                  border: '1px solid rgba(74, 222, 128, 0.22)',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  fontWeight: 600,
                                  letterSpacing: '0.03em',
                                  lineHeight: 1.3,
                                }}
                              >
                                Save ₹{((origPrice - itemPrice) * qty).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper & Remove Action */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '4px',
                              padding: '1px',
                              height: '22px',
                            }}
                            role="group"
                            aria-label="Item quantity controls"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (qty > 1) {
                                  updateQuantity(
                                    item.cartItemId || item.id || item.name,
                                    item.selectedSize || item.size,
                                    -1
                                  );
                                } else {
                                  removeFromCart(
                                    item.cartItemId || item.id || item.name,
                                    item.selectedSize || item.size
                                  );
                                }
                              }}
                              aria-label="Decrease quantity"
                              title={qty > 1 ? 'Decrease quantity' : 'Remove item'}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <Minus size={9} strokeWidth={2.2} />
                            </button>

                            <span
                              style={{
                                minWidth: '20px',
                                textAlign: 'center',
                                fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                color: '#ffffff',
                                userSelect: 'none',
                                lineHeight: 1,
                              }}
                            >
                              {qty}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                updateQuantity(
                                  item.cartItemId || item.id || item.name,
                                  item.selectedSize || item.size,
                                  1
                                );
                              }}
                              aria-label="Increase quantity"
                              title="Increase quantity"
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <Plus size={9} strokeWidth={2.2} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.cartItemId || item.id || item.name,
                                item.selectedSize || item.size
                              )
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#71717a',
                              fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-row">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {stockError && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {stockError}
                  </div>
                )}
                <button
                  className="cart-checkout"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartItems.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                    opacity: isCheckingOut ? 0.8 : 1,
                  }}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    'Checkout'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Share My Bag Modal outside pointer-events:none container */}
      <ShareMyBagModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        items={cartItems}
      />
    </>
  );
};
