'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { cartApi } from '@/lib/api';

export const CartContext = createContext(null);

// Persistent guest identification for anonymous carts
const getOrCreateGuestId = () => {
  if (typeof window === 'undefined') return '';
  try {
    let guestId = localStorage.getItem('drapza_guest_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('drapza_guest_id', guestId);
    }
    return guestId;
  } catch {
    return `guest_${Date.now()}`;
  }
};

/**
 * Calculates effective discounted selling price and original MRP.
 * Ensures that if discount is enabled from admin (discountTagActive, discountPercentage, offerTag),
 * the discounted selling price is stored and displayed in the bag.
 */
export const resolveProductPricing = (product) => {
  if (!product) return { price: 0, numericPrice: 0, originalPrice: 0, hasDiscount: false };

  // 1. Determine base MRP price
  let basePrice = Number(product.originalPrice) || Number(product.numericPrice) || 0;
  if (!basePrice) {
    const raw = String(product.price || 0).replace(/[^\d.]/g, '');
    basePrice = parseFloat(raw) || 0;
  }

  // 2. Check admin discount configuration
  const isTagActive = Boolean(product.discountTagActive);
  const discPercent = Number(product.discountPercentage) || 0;
  const discPrice = Number(product.discountPrice) || 0;

  let finalPrice = basePrice;
  let hasDiscount = false;

  if (product.isMember && typeof product.memberPrice === "number" && product.memberPrice > 0 && product.memberPrice < basePrice) {
    finalPrice = product.memberPrice;
    hasDiscount = true;
  } else if (isTagActive && (discPercent > 0 || discPrice > 0 || product.offerTag)) {
    if (discPrice > 0 && discPrice < basePrice) {
      finalPrice = discPrice;
      hasDiscount = true;
    } else if (discPercent > 0) {
      finalPrice = Math.round(basePrice * (1 - discPercent / 100));
      hasDiscount = true;
    }
  } else {
    // If product was passed with an already discounted price
    const passedPrice = parseFloat(String(product.price).replace(/[^\d.]/g, ''));
    if (!isNaN(passedPrice) && passedPrice > 0 && passedPrice < basePrice) {
      finalPrice = passedPrice;
      hasDiscount = true;
    } else if (!isNaN(passedPrice) && passedPrice > 0) {
      finalPrice = passedPrice;
    }
  }

  return {
    price: finalPrice,
    numericPrice: finalPrice,
    originalPrice: hasDiscount ? basePrice : (product.originalPrice ? parseFloat(String(product.originalPrice).replace(/[^\d.]/g, '')) || finalPrice : finalPrice),
    hasDiscount,
    discountTagActive: isTagActive,
    discountPercentage: discPercent,
    offerTag: product.offerTag || (discPercent > 0 ? `${discPercent}% OFF` : ''),
  };
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const guestIdRef = useRef('');
  const syncTimeoutRef = useRef(null);

  // Initialize guest ID and local cache immediately
  useEffect(() => {
    guestIdRef.current = getOrCreateGuestId();
    try {
      const saved = localStorage.getItem('drapza_cart') || localStorage.getItem('digifox_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item) => {
            const pricing = resolveProductPricing(item);
            return {
              ...item,
              price: pricing.price,
              numericPrice: pricing.numericPrice,
              originalPrice: pricing.originalPrice,
              hasDiscount: pricing.hasDiscount,
              offerTag: pricing.offerTag || item.offerTag,
            };
          });
          setCartItems(sanitized);
        }
      }
    } catch (e) {
      console.warn('[CART] Failed to parse local cart cache', e);
    }
    setIsLoaded(true);
  }, []);

  // Fetch / Sync cart from MongoDB backend
  const fetchCartFromDb = useCallback(async () => {
    const guestId = guestIdRef.current || getOrCreateGuestId();
    setIsSyncing(true);
    try {
      const res = await cartApi.getCart(guestId);
      if (res && res.success && res.cart) {
        const dbItems = Array.isArray(res.cart.items) ? res.cart.items : [];
        if (dbItems.length > 0) {
          // Normalize items from DB format
          const formatted = dbItems.map((item) => {
            const pricing = resolveProductPricing(item);
            return {
              ...item,
              id: item.cartItemId || item.id,
              cartItemId: item.cartItemId || item.id,
              size: item.selectedSize || item.size || 'M',
              image: item.image || item.image_url || '/products/product_1.png',
              price: pricing.price,
              numericPrice: pricing.numericPrice,
              originalPrice: pricing.originalPrice,
              hasDiscount: pricing.hasDiscount,
              offerTag: pricing.offerTag || item.offerTag,
            };
          });
          setCartItems(formatted);
          try {
            localStorage.setItem('drapza_cart', JSON.stringify(formatted));
          } catch { }
        } else {
          // If DB cart is empty but local storage has items, sync local to DB
          const savedLocal = localStorage.getItem('drapza_cart');
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await cartApi.syncCart(parsed, guestId);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[CART] Could not fetch cart from MongoDB server:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load from DB on mount
  useEffect(() => {
    if (isLoaded) {
      fetchCartFromDb();
    }
  }, [isLoaded, fetchCartFromDb]);

  // Persist to localStorage whenever cartItems changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('drapza_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, isLoaded]);

  // Debounced database sync to MongoDB
  const debouncedSyncToDb = useCallback((items) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const guestId = guestIdRef.current || getOrCreateGuestId();
        await cartApi.syncCart(items, guestId);
      } catch (err) {
        console.warn('[CART] Background DB sync failed:', err);
      }
    }, 400);
  }, []);

  // Compute unique key for each item
  const getCartItemId = (product, selectedSize) => {
    if (product.cartItemId) return product.cartItemId;
    if (product.id && product.size) return `${product.name}__${product.id}__${product.size}`;
    const tierId = product.bogoTier?.id || 'standard';
    const sizeString = Array.isArray(product.garmentSizes) && product.garmentSizes.length > 0
      ? product.garmentSizes.join('-')
      : (selectedSize || product.selectedSize || product.size || 'M');
    return `${product.name}__${tierId}__${sizeString}`;
  };

  // Add product to bag
  const addToCart = (product, selectedSize = null) => {
    if (!product) return;
    const isOutOfStock =
      product.inStock === false ||
      (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0);
    if (isOutOfStock) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('drapza_toast_notification', {
            detail: { title: 'OUT OF STOCK', description: `"${product.name || 'Item'}" is currently out of stock.`, type: 'error' },
          })
        );
      }
      return;
    }

    const availableStock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 999;
    const sizeVal = selectedSize || product.selectedSize || product.size || product.sizes?.[0] || 'M';
    const itemId = getCartItemId(product, sizeVal);
    const imageVal = product.image || product.image_url || '/products/product_1.png';
    const qtyToAdd = Math.max(1, Number(product.quantityToAdd || product.quantity) || 1);
    const pricing = resolveProductPricing(product);

    let updatedCart = [];

    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.cartItemId === itemId ||
          (item.name === product.name &&
            (item.bogoTier?.id || 'standard') === (product.bogoTier?.id || 'standard') &&
            (!sizeVal || (item.selectedSize || item.size) === sizeVal))
      );

      if (existing) {
        if ((existing.quantity || 1) + qtyToAdd > availableStock) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('drapza_toast_notification', {
                detail: { title: 'STOCK LIMIT', description: `Only ${availableStock} piece(s) available.`, type: 'warning' },
              })
            );
          }
          return prev;
        }
        updatedCart = prev.map((item) =>
          item === existing
            ? {
                ...item,
                quantity: (item.quantity || 1) + qtyToAdd,
                price: pricing.price,
                numericPrice: pricing.numericPrice,
                originalPrice: pricing.originalPrice,
                hasDiscount: pricing.hasDiscount,
                offerTag: pricing.offerTag || item.offerTag,
              }
            : item
        );
      } else {
        const newItem = {
          ...product,
          id: itemId,
          cartItemId: itemId,
          quantity: qtyToAdd,
          size: sizeVal,
          selectedSize: sizeVal,
          color: product.color || 'Black',
          image: imageVal,
          price: pricing.price,
          numericPrice: pricing.numericPrice,
          originalPrice: pricing.originalPrice,
          hasDiscount: pricing.hasDiscount,
          discountTagActive: pricing.discountTagActive,
          discountPercentage: pricing.discountPercentage,
          offerTag: pricing.offerTag,
        };
        updatedCart = [...prev, newItem];
      }

      // Synchronize in database (MongoDB)
      debouncedSyncToDb(updatedCart);
      return updatedCart;
    });

    setIsCartOpen(true);
  };

  // Add multiple items to bag simultaneously (preserves existing items and increments quantities)
  const addMultipleToCart = (itemsList) => {
    if (!Array.isArray(itemsList) || itemsList.length === 0) return;

    let updatedCart = [];

    setCartItems((prev) => {
      const current = [...prev];

      itemsList.forEach((product) => {
        const sizeVal = product.selectedSize || product.size || product.sizes?.[0] || 'M';
        const itemId = getCartItemId(product, sizeVal);
        const imageVal = product.image || product.image_url || '/products/product_1.png';
        const qtyToAdd = Math.max(1, Number(product.quantity) || 1);
        const pricing = resolveProductPricing(product);

        const existingIdx = current.findIndex(
          (item) =>
            item.cartItemId === itemId ||
            (item.name === product.name &&
              (item.bogoTier?.id || 'standard') === (product.bogoTier?.id || 'standard') &&
              (!sizeVal || (item.selectedSize || item.size) === sizeVal))
        );

        if (existingIdx > -1) {
          current[existingIdx] = {
            ...current[existingIdx],
            quantity: (current[existingIdx].quantity || 1) + qtyToAdd,
            price: pricing.price,
            numericPrice: pricing.numericPrice,
            originalPrice: pricing.originalPrice,
            hasDiscount: pricing.hasDiscount,
            offerTag: pricing.offerTag || current[existingIdx].offerTag,
          };
        } else {
          current.push({
            ...product,
            id: itemId,
            cartItemId: itemId,
            quantity: qtyToAdd,
            size: sizeVal,
            selectedSize: sizeVal,
            color: product.color || 'Black',
            image: imageVal,
            price: pricing.price,
            numericPrice: pricing.numericPrice,
            originalPrice: pricing.originalPrice,
            hasDiscount: pricing.hasDiscount,
            discountTagActive: pricing.discountTagActive,
            discountPercentage: pricing.discountPercentage,
            offerTag: pricing.offerTag,
          });
        }
      });

      updatedCart = current;
      debouncedSyncToDb(updatedCart);
      return updatedCart;
    });

    setIsCartOpen(true);
  };


  // Remove product from bag
  const removeFromCart = (identifier, size = null) => {
    let updatedCart = [];
    setCartItems((prev) => {
      updatedCart = prev.filter((item) => {
        if (size && (item.selectedSize === size || item.size === size)) {
          return item.id !== identifier && item.cartItemId !== identifier && item.name !== identifier;
        }
        return item.cartItemId !== identifier && item.id !== identifier && item.name !== identifier;
      });

      // Synchronize in database
      const guestId = guestIdRef.current || getOrCreateGuestId();
      cartApi.removeFromCart(identifier, guestId).catch(() => {
        debouncedSyncToDb(updatedCart);
      });

      return updatedCart;
    });
  };

  // Update quantity (+1 or -1 or explicit)
  const updateQuantity = (identifier, sizeOrDelta, maybeDelta) => {
    let delta = 1;
    let targetSize = null;

    if (typeof sizeOrDelta === 'number') {
      delta = sizeOrDelta;
    } else if (typeof maybeDelta === 'number') {
      targetSize = sizeOrDelta;
      delta = maybeDelta;
    }

    let updatedCart = [];
    setCartItems((prev) => {
      updatedCart = prev
        .map((item) => {
          const matchIdentifier =
            item.cartItemId === identifier || item.id === identifier || item.name === identifier;
          const matchSize = targetSize ? item.selectedSize === targetSize || item.size === targetSize : true;

          if (matchIdentifier && matchSize) {
            const newQty = (item.quantity || 1) + delta;
            if (delta > 0 && typeof item.stock === 'number' && newQty > item.stock) {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('drapza_toast_notification', {
                    detail: { title: 'STOCK LIMIT', description: `Only ${item.stock} item(s) available in inventory.`, type: 'warning' },
                  })
                );
              }
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);

      debouncedSyncToDb(updatedCart);
      return updatedCart;
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('drapza_cart');
    } catch { }
    const guestId = guestIdRef.current || getOrCreateGuestId();
    cartApi.clearCart(guestId).catch((e) => console.warn('[CART] Clear cart DB error:', e));
  };

  // Merge guest cart on login
  const mergeOnLogin = useCallback(async () => {
    try {
      const guestId = guestIdRef.current || getOrCreateGuestId();
      const currentItems = cartItems.length > 0
        ? cartItems
        : JSON.parse(localStorage.getItem('drapza_cart') || '[]');

      const res = await cartApi.mergeCart(currentItems, guestId);
      if (res && res.success && res.cart) {
        const mergedItems = Array.isArray(res.cart.items) ? res.cart.items : [];
        const formatted = mergedItems.map((item) => ({
          ...item,
          id: item.cartItemId || item.id,
          size: item.selectedSize || item.size || 'M',
          image: item.image || item.image_url || '/products/product_1.png',
        }));
        setCartItems(formatted);
        localStorage.setItem('drapza_cart', JSON.stringify(formatted));
      }
    } catch (e) {
      console.warn('[CART] Merge on login error:', e);
    }
  }, [cartItems]);

  // Listen to login event or storage change to merge cart
  useEffect(() => {
    const handleLoginEvent = () => {
      mergeOnLogin();
    };

    window.addEventListener('drapza_login_success', handleLoginEvent);
    return () => {
      window.removeEventListener('drapza_login_success', handleLoginEvent);
    };
  }, [mergeOnLogin]);

  const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => {
      const p = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
      return acc + p * (item.quantity || 1);
    },
    0
  );
  const savingsTotal = cartItems.reduce((acc, item) => {
    const current = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
    const orig = parseFloat(String(item.originalPrice).replace(/[^\d.]/g, '')) || current;
    const qty = item.quantity || 1;
    return acc + Math.max(0, orig - current) * qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        items: cartItems,
        isLoaded,
        isSyncing,
        isCartOpen,
        cartOpen: isCartOpen,
        setIsCartOpen,
        setCartOpen: setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
        addToCart,
        addMultipleToCart,
        removeFromCart,
        removeItem: removeFromCart,
        updateQuantity,
        clearCart,
        syncWithDb: fetchCartFromDb,
        totalCount,
        itemCount: totalCount,
        subtotal,
        savingsTotal,
        // Fallbacks for optional collab bag methods
        pendingInviteCode: null,
        setPendingInviteCode: () => { },
        incomingHostName: '',
        joinSharedBag: async () => { },
        sharedBag: null,
        startSharedBag: async () => { },
        updateLinkSettings: async () => { },
        updateMemberPermission: async () => { },
        removeMember: async () => { },
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
