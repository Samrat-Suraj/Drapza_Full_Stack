import { Request, Response } from 'express';
import crypto from 'crypto';
import { SharedBag } from '../models/SharedBag';
import { Product } from '../models/Product';
import { AuthRequest } from '../types';

/**
 * POST /api/shared-bag
 * Generate a unique shareable bag link
 */
export const createSharedBag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items = [], sharerName: bodyName } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Your shopping bag is empty. Please add items before sharing.',
      });
      return;
    }

    // Determine Sharer Name:
    // Case A: User is logged in -> use verified name from database record
    // Case B: User is not logged in -> validate submitted name from guest prompt
    let finalSharerName = '';
    let userId = null;

    if (req.user && req.user._id) {
      finalSharerName = String(req.user.name || '').trim();
      userId = req.user._id;
    } else {
      finalSharerName = String(bodyName || '').trim();
      if (!finalSharerName || finalSharerName.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Please enter a valid name (at least 2 characters) to share your bag.',
        });
        return;
      }
      if (finalSharerName.length > 50) {
        finalSharerName = finalSharerName.slice(0, 50);
      }
    }

    // Sanitize & validate each item with catalog integrity
    const validatedItems: any[] = [];
    let calculatedTotal = 0;
    let calculatedCount = 0;

    for (const raw of items) {
      const name = String(raw.name || '').trim();
      if (!name) continue;

      const qty = Math.max(1, parseInt(raw.quantity, 10) || 1);
      const selectedSize = String(raw.selectedSize || raw.size || 'M').trim();
      const color = String(raw.color || 'Black').trim();

      // Look up current product in DB to ensure verified product data
      const dbProduct = await Product.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${name}$`, 'i') } },
          ...(raw.slug ? [{ slug: raw.slug }] : []),
          ...(raw.productId && String(raw.productId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: raw.productId }] : []),
        ],
      }).select('_id name price slug images image_url inStock');

      let price = parseFloat(raw.price) || 0;
      let originalPrice = parseFloat(raw.originalPrice) || price;
      let image = raw.image || raw.image_url || '/products/product_1.png';
      let slug = raw.slug || '';

      if (dbProduct) {
        // Use trusted DB price if available
        price = dbProduct.price || price;
        slug = dbProduct.slug || slug;
        if (dbProduct.image_url) image = dbProduct.image_url;
        else if (dbProduct.images && dbProduct.images.length > 0) image = dbProduct.images[0];
      }

      calculatedTotal += price * qty;
      calculatedCount += qty;

      validatedItems.push({
        productId: dbProduct ? dbProduct._id : (raw.productId || null),
        cartItemId: raw.cartItemId || raw.id || `${name}__${selectedSize}`,
        name: dbProduct?.name || name,
        slug,
        price,
        originalPrice,
        selectedSize,
        color,
        image,
        quantity: qty,
        bogoTier: raw.bogoTier || null,
      });
    }

    if (validatedItems.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid products found in bag to share.',
      });
      return;
    }

    // Generate unique, unpredictable shareId (e.g. sb_a8b9c0d1e2f3)
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const shareId = `sb_${randomSuffix}`;

    const sharedBag = new SharedBag({
      shareId,
      user: userId,
      sharerName: finalSharerName,
      items: validatedItems,
      totalAmount: calculatedTotal,
      totalCount: calculatedCount,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await sharedBag.save();

    res.status(201).json({
      success: true,
      message: 'Shared bag created successfully.',
      shareId,
      shareUrl: `/shared-bag/${shareId}`,
      sharerName: finalSharerName,
      totalCount: calculatedCount,
      totalAmount: calculatedTotal,
      expiresAt: sharedBag.expiresAt,
    });
  } catch (error: any) {
    console.error('[SHARED_BAG] createSharedBag error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shared bag link.',
    });
  }
};

/**
 * GET /api/shared-bag/:shareId
 * Retrieve a shared bag by its unique share ID
 */
export const getSharedBagByShareId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    if (!shareId || typeof shareId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invalid share identifier provided.',
      });
      return;
    }

    const sharedBag = await SharedBag.findOne({ shareId: shareId.trim() }).lean();

    if (!sharedBag) {
      res.status(404).json({
        success: false,
        message: 'This shared bag was not found or the link has expired.',
      });
      return;
    }

    // Check expiration
    if (sharedBag.expiresAt && new Date(sharedBag.expiresAt).getTime() < Date.now()) {
      res.status(410).json({
        success: false,
        message: 'This shared bag link has expired.',
      });
      return;
    }

    // Verify current inventory/availability of each product in the shared bag
    const enrichedItems = await Promise.all(
      sharedBag.items.map(async (item: any) => {
        let isAvailable = true;
        let currentStock = 99;

        if (item.productId) {
          const product = await Product.findById(item.productId).select('inStock stockCount price');
          if (product) {
            isAvailable = product.inStock !== false && (product.stockCount ?? 1) > 0;
            currentStock = product.stockCount ?? 99;
          }
        }

        return {
          cartItemId: item.cartItemId,
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          originalPrice: item.originalPrice,
          selectedSize: item.selectedSize,
          color: item.color,
          image: item.image,
          quantity: item.quantity,
          bogoTier: item.bogoTier,
          isAvailable,
          currentStock,
        };
      })
    );

    res.status(200).json({
      success: true,
      sharedBag: {
        shareId: sharedBag.shareId,
        sharerName: sharedBag.sharerName,
        items: enrichedItems,
        totalAmount: sharedBag.totalAmount,
        totalCount: sharedBag.totalCount,
        createdAt: sharedBag.createdAt,
        expiresAt: sharedBag.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('[SHARED_BAG] getSharedBagByShareId error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve shared bag.',
    });
  }
};
