import { Response } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthRequest } from '../types';

// Helper to extract identifier (user._id or guestId)
const getCartQuery = (req: AuthRequest, bodyGuestId?: string): { query: any; isUser: boolean } => {
  if (req.user && req.user._id) {
    return { query: { user: req.user._id }, isUser: true };
  }
  const guestId =
    bodyGuestId ||
    (req.headers['x-guest-id'] as string) ||
    (req.query.guestId as string) ||
    '';
  if (guestId) {
    return { query: { guestId }, isUser: false };
  }
  return { query: null, isUser: false };
};

// Normalize cart item input to guarantee valid fields
const normalizeCartItem = (raw: any): any => {
  const name = String(raw.name || 'Atelier Garment').trim();
  const selectedSize = String(raw.selectedSize || raw.size || raw.sizes?.[0] || 'M').trim();
  const tierId = raw.bogoTier?.id || 'standard';
  const cartItemId =
    raw.cartItemId ||
    raw.id ||
    `${name}__${tierId}__${selectedSize}`;

  return {
    cartItemId,
    product: raw.product || raw._id || null,
    slug: raw.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name,
    price: Math.max(0, parseFloat(raw.price) || 0),
    originalPrice: Math.max(0, parseFloat(raw.originalPrice) || parseFloat(raw.price) || 0),
    selectedSize,
    color: raw.color || 'Black',
    image: raw.image || raw.image_url || '/products/product_1.png',
    quantity: Math.max(1, parseInt(raw.quantity, 10) || 1),
    bogoTier: raw.bogoTier || null,
    garmentSizes: Array.isArray(raw.garmentSizes) ? raw.garmentSizes : [],
    addedAt: raw.addedAt ? new Date(raw.addedAt) : new Date(),
  };
};

/**
 * GET /api/cart
 * Retrieve current user or guest cart from MongoDB
 */
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = getCartQuery(req);
    if (!query) {
      res.status(200).json({
        success: true,
        cart: { items: [], totalCount: 0, subtotal: 0 },
      });
      return;
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      res.status(200).json({
        success: true,
        cart: { items: [], totalCount: 0, subtotal: 0 },
      });
      return;
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error: any) {
    console.error('[CART] getCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error loading cart.' });
  }
};

/**
 * POST /api/cart
 * Save or completely sync cart items to MongoDB
 */
export const syncCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items = [], guestId } = req.body;
    const { query, isUser } = getCartQuery(req, guestId);

    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Cannot sync cart without user authentication or guestId.',
      });
      return;
    }

    const normalizedItems = Array.isArray(items) ? items.map(normalizeCartItem) : [];

    let cart = await Cart.findOne(query);
    if (!cart) {
      cart = new Cart({
        ...(isUser ? { user: req.user!._id } : { guestId: query.guestId }),
        items: normalizedItems,
      });
    } else {
      cart.items = normalizedItems;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart saved to database successfully.',
      cart,
    });
  } catch (error: any) {
    console.error('[CART] syncCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error syncing cart.' });
  }
};

/**
 * POST /api/cart/add
 * Add single product item to DB cart
 */
export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item, guestId } = req.body;
    if (!item) {
      res.status(400).json({ success: false, message: 'Item payload required.' });
      return;
    }

    const { query, isUser } = getCartQuery(req, guestId);
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'User authentication or guestId required to add to bag in DB.',
      });
      return;
    }

    const normalized = normalizeCartItem(item);

    // Stock validation
    if (normalized.product) {
      const dbProduct = await Product.findById(normalized.product);
      if (dbProduct) {
        const availableStock = typeof dbProduct.stock === 'number' ? Math.max(0, dbProduct.stock) : (dbProduct.inStock ? 999 : 0);
        if (dbProduct.inStock === false || availableStock <= 0) {
          res.status(400).json({
            success: false,
            isOutOfStock: true,
            message: `"${dbProduct.name}" is currently out of stock.`,
          });
          return;
        }

        let currentQtyInCart = 0;
        const existingCartCheck = await Cart.findOne(query);
        if (existingCartCheck) {
          const existing = existingCartCheck.items.find(
            (i) => i.cartItemId === normalized.cartItemId || (i.name === normalized.name && i.selectedSize === normalized.selectedSize)
          );
          if (existing) currentQtyInCart = existing.quantity || 0;
        }

        if (currentQtyInCart + normalized.quantity > availableStock) {
          res.status(400).json({
            success: false,
            isInsufficientStock: true,
            availableStock,
            message: `Only ${availableStock} item(s) available for "${dbProduct.name}".`,
          });
          return;
        }
      }
    }

    let cart = await Cart.findOne(query);
    if (!cart) {
      cart = new Cart({
        ...(isUser ? { user: req.user!._id } : { guestId: query.guestId }),
        items: [normalized],
      });
    } else {
      const existingIndex = cart.items.findIndex(
        (i) => i.cartItemId === normalized.cartItemId || (i.name === normalized.name && i.selectedSize === normalized.selectedSize)
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = (cart.items[existingIndex].quantity || 1) + (normalized.quantity || 1);
      } else {
        cart.items.push(normalized);
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product added to bag in database.',
      cart,
    });
  } catch (error: any) {
    console.error('[CART] addToCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error adding to cart.' });
  }
};

/**
 * PATCH /api/cart/quantity
 * Update quantity of item in DB cart
 */
export const updateQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cartItemId, delta, quantity, guestId } = req.body;
    const { query } = getCartQuery(req, guestId);

    if (!query || !cartItemId) {
      res.status(400).json({ success: false, message: 'cartItemId and user/guestId required.' });
      return;
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found.' });
      return;
    }

    const item = cart.items.find((i) => i.cartItemId === cartItemId || i.name === cartItemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found in cart.' });
      return;
    }

    let targetQuantity = item.quantity;
    if (quantity !== undefined) {
      targetQuantity = Math.max(0, parseInt(quantity, 10));
    } else if (delta !== undefined) {
      targetQuantity = (item.quantity || 1) + parseInt(delta, 10);
    }

    if (targetQuantity > (item.quantity || 0) && item.product) {
      const dbProduct = await Product.findById(item.product);
      if (dbProduct) {
        const availableStock = typeof dbProduct.stock === 'number' ? Math.max(0, dbProduct.stock) : (dbProduct.inStock ? 999 : 0);
        if (dbProduct.inStock === false || availableStock <= 0) {
          res.status(400).json({
            success: false,
            isOutOfStock: true,
            message: `"${dbProduct.name}" is out of stock.`,
          });
          return;
        }
        if (targetQuantity > availableStock) {
          res.status(400).json({
            success: false,
            isInsufficientStock: true,
            availableStock,
            message: `Only ${availableStock} item(s) available for "${dbProduct.name}".`,
          });
          return;
        }
      }
    }

    item.quantity = targetQuantity;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter((i) => i.cartItemId !== cartItemId && i.name !== cartItemId);
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart quantity updated in database.',
      cart,
    });
  } catch (error: any) {
    console.error('[CART] updateQuantity error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating quantity.' });
  }
};

/**
 * DELETE /api/cart/item/:cartItemId
 * Remove item from DB cart
 */
export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cartItemId } = req.params;
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string) || req.body?.guestId;
    const { query } = getCartQuery(req, guestId);

    if (!query || !cartItemId) {
      res.status(400).json({ success: false, message: 'cartItemId and user/guestId required.' });
      return;
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      res.status(200).json({ success: true, cart: { items: [], totalCount: 0, subtotal: 0 } });
      return;
    }

    cart.items = cart.items.filter((i) => i.cartItemId !== cartItemId && i.name !== cartItemId);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from bag in database.',
      cart,
    });
  } catch (error: any) {
    console.error('[CART] removeFromCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error removing item.' });
  }
};

/**
 * DELETE /api/cart
 * Clear all items from DB cart
 */
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string) || req.body?.guestId;
    const { query } = getCartQuery(req, guestId);

    if (!query) {
      res.status(200).json({ success: true, message: 'Cart already empty.' });
      return;
    }

    const cart = await Cart.findOne(query);
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Bag cleared in database.',
      cart: cart || { items: [], totalCount: 0, subtotal: 0 },
    });
  } catch (error: any) {
    console.error('[CART] clearCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error clearing cart.' });
  }
};

/**
 * POST /api/cart/merge
 * When a guest logs in, merge their local/guest items with the authenticated user's DB cart
 */
export const mergeCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, message: 'User must be authenticated to merge cart.' });
      return;
    }

    const { guestId, items = [] } = req.body;
    let userCart = await Cart.findOne({ user: req.user._id });

    if (!userCart) {
      userCart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    // Combine incoming guest items into userCart
    const incomingItems = Array.isArray(items) ? items.map(normalizeCartItem) : [];

    // Also look for guest cart document if guestId was provided
    if (guestId) {
      const guestCartDoc = await Cart.findOne({ guestId });
      if (guestCartDoc && guestCartDoc.items?.length > 0) {
        guestCartDoc.items.forEach((gItem) => {
          if (!incomingItems.some((i) => i.cartItemId === gItem.cartItemId)) {
            incomingItems.push(gItem);
          }
        });
        // Remove guest cart document to avoid duplicates
        await Cart.deleteOne({ guestId });
      }
    }

    // Merge incoming into user cart items
    incomingItems.forEach((incoming) => {
      const existingIndex = userCart!.items.findIndex(
        (i) => i.cartItemId === incoming.cartItemId || (i.name === incoming.name && i.selectedSize === incoming.selectedSize)
      );
      if (existingIndex > -1) {
        userCart!.items[existingIndex].quantity =
          (userCart!.items[existingIndex].quantity || 1) + (incoming.quantity || 1);
      } else {
        userCart!.items.push(incoming);
      }
    });

    await userCart.save();

    res.status(200).json({
      success: true,
      message: 'Guest bag merged with account bag in database.',
      cart: userCart,
    });
  } catch (error: any) {
    console.error('[CART] mergeCart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error merging cart.' });
  }
};
