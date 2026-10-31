import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SiteConfig } from '../models/Config';
import { SearchTelemetry } from '../models/SearchTelemetry';
import { getUserActiveMembership, calculateMemberProductPricing } from '../utils/membershipService';
import fs from 'fs';
import path from 'path';

// Load default initial catalog from products.json if DB is empty
const loadInitialProducts = () => {
  try {
    const productsPath = path.resolve(__dirname, '../../../frontend/src/data/products.json');
    if (fs.existsSync(productsPath)) {
      const data = fs.readFileSync(productsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err: any) {
    console.warn('Could not load frontend products.json:', err.message);
  }
  return [];
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag, color, search, includeOutOfStock, hideOutOfStock } = req.query;

    let count = await Product.countDocuments();
    if (count === 0) {
      const defaultProducts = loadInitialProducts();
      if (defaultProducts.length > 0) {
        const toInsert = defaultProducts.map((p: any, idx: number) => ({
          name: p.name,
          slug: p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          price: parseFloat(p.price) || 1200,
          color: p.color || 'Black',
          tag: p.tag || 'Deform',
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          description: p.description || '',
          image_url: `/products/product_${idx + 1}.png`,
          images: [`/product/product_shot_01.jpg`, `/product/product_shot_02.jpg`],
          inStock: true,
          local_index: idx + 1,
        }));
        await Product.insertMany(toInsert);
        console.log(`Seeded ${toInsert.length} products to database.`);
      }
    }

    const query: any = {};
    if (tag && tag !== 'All') {
      query.tag = { $regex: new RegExp(`^${tag}$`, 'i') };
    }
    if (color) {
      query.color = { $regex: new RegExp(`^${color}$`, 'i') };
    }
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tag: { $regex: String(search), $options: 'i' } },
      ];
    }

    // Out-of-Stock Storefront Suppression:
    // If enabled in filter-config (or requested via hideOutOfStock), exclude out-of-stock items for public storefront
    const isExplicitAdmin = (req as any).user?.role === 'admin' || includeOutOfStock === 'true' || req.query.admin === 'true';
    if (!isExplicitAdmin) {
      const configDoc = await SiteConfig.findOne({ key: 'filter-config' });
      const shouldHideOos = hideOutOfStock === 'true' || configDoc?.data?.hideOutOfStockOnStorefront === true;
      if (shouldHideOos) {
        query.inStock = { $ne: false };
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { stock: { $exists: false } },
              { stock: null },
              { stock: { $gt: 0 } },
            ],
          },
        ];
      }
    }

    const products = await Product.find(query).sort({ local_index: 1, createdAt: -1 });

    const activeMembership = await getUserActiveMembership((req as any).user?._id);
    const enrichedProducts = products.map((prod) => {
      const pObj = prod.toObject();
      const pricing = calculateMemberProductPricing(pObj, activeMembership);
      return {
        ...pObj,
        isMember: pricing.isMember,
        memberPrice: pricing.memberPrice,
        memberDiscountPercent: pricing.memberDiscountPercent,
        memberSavings: pricing.savings,
        memberPricePreview: Math.round(Number(pObj.numericPrice || pObj.price || 1200) * 0.85),
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      isMemberUser: activeMembership.isActive,
      memberPlan: activeMembership.planName,
      products: enrichedProducts,
    });
  } catch (error: any) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const getProductByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier || '');

    let product = await Product.findOne({
      $or: [
        { slug: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });

    if (!product && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      // Fallback: check default list if not in db yet
      const defaultProducts = loadInitialProducts();
      const matched = defaultProducts.find(
        (p: any) =>
          p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === identifier.toLowerCase() ||
          p.name.toLowerCase() === identifier.toLowerCase()
      );
      if (matched) {
        const activeMembership = await getUserActiveMembership((req as any).user?._id);
        const pricing = calculateMemberProductPricing(matched, activeMembership);
        res.status(200).json({
          success: true,
          product: {
            ...matched,
            slug: matched.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            isMember: pricing.isMember,
            memberPrice: pricing.memberPrice,
            memberDiscountPercent: pricing.memberDiscountPercent,
            memberSavings: pricing.savings,
            memberPricePreview: Math.round(Number(matched.price || 1200) * 0.85),
          },
          isMemberUser: activeMembership.isActive,
          memberPlan: activeMembership.planName,
        });
        return;
      }
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const activeMembership = await getUserActiveMembership((req as any).user?._id);
    const pObj = typeof (product as any).toObject === 'function' ? (product as any).toObject() : product;
    const pricing = calculateMemberProductPricing(pObj, activeMembership);

    res.status(200).json({
      success: true,
      product: {
        ...pObj,
        isMember: pricing.isMember,
        memberPrice: pricing.memberPrice,
        memberDiscountPercent: pricing.memberDiscountPercent,
        memberSavings: pricing.savings,
        memberPricePreview: Math.round(Number(pObj.numericPrice || pObj.price || 1200) * 0.85),
      },
      isMemberUser: activeMembership.isActive,
      memberPlan: activeMembership.planName,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier || '');
    let product = await Product.findOne({
      $or: [
        { slug: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });

    if (!product && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    }

    const numericPrice = parseFloat(req.body.numericPrice ?? req.body.price) || 0;

    if (!product) {
      product = new Product({
        slug: identifier.toLowerCase(),
        name: req.body.name || identifier,
        price: numericPrice || 1400,
        numericPrice: numericPrice || 1400,
        ...req.body,
      });
    } else {
      if (req.body.price !== undefined || req.body.numericPrice !== undefined) {
        req.body.price = numericPrice || product.price;
        req.body.numericPrice = numericPrice || product.price;
      }
      Object.assign(product, req.body);
    }

    await product.save();
    res.status(200).json({ success: true, message: 'Garment specification updated successfully.', product });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier || '');
    const stock = Number(req.body.stock) || 0;

    let product = await Product.findOne({
      $or: [
        { slug: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });

    if (!product && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Garment not found.' });
      return;
    }

    product.stock = stock;
    product.stockCount = stock;
    product.inStock = stock > 0;
    await product.save();

    res.status(200).json({ success: true, message: 'Stock level updated live.', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const applyBulkDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { discountPercentage, discountTagActive, offerTag, targetScope = 'all', targetCategory, action = 'apply' } = req.body;

    const filter: any = {};
    if (targetScope === 'category' && targetCategory) {
      filter.category = { $regex: new RegExp(`^${targetCategory}$`, 'i') };
    } else if (targetScope === 'in_stock') {
      filter.inStock = true;
    }

    if (action === 'remove') {
      const result = await Product.updateMany(filter, {
        $set: {
          discountTagActive: false,
          discountPercentage: 0,
          discountPrice: 0,
          offerTag: '',
        },
      });
      res.status(200).json({
        success: true,
        message: `Removed discount tags from ${result.modifiedCount} garments.`,
        modifiedCount: result.modifiedCount,
      });
      return;
    }

    if (action === 'toggle_active') {
      const result = await Product.updateMany(filter, {
        $set: {
          discountTagActive: Boolean(discountTagActive),
        },
      });
      res.status(200).json({
        success: true,
        message: `Updated discount tag active state to ${discountTagActive} across ${result.modifiedCount} garments.`,
        modifiedCount: result.modifiedCount,
        discountTagActive,
      });
      return;
    }

    const discPct = Number(discountPercentage) || 0;
    const tagActive = discountTagActive !== undefined ? Boolean(discountTagActive) : true;
    const resolvedOfferTag = offerTag || (discPct > 0 ? `${discPct}% OFF` : '');

    const products = await Product.find(filter);
    let modified = 0;

    for (const prod of products) {
      const basePrice = prod.numericPrice || prod.price || 0;
      const discountPrice = discPct > 0 ? Math.round(basePrice * (1 - discPct / 100)) : basePrice;

      prod.discountPercentage = discPct;
      prod.discountPrice = discountPrice;
      prod.discountTagActive = tagActive;
      prod.offerTag = resolvedOfferTag;
      await prod.save();
      modified++;
    }

    res.status(200).json({
      success: true,
      message: `Bulk discount of ${discPct}% applied to ${modified} garments live.`,
      modifiedCount: modified,
      discountPercentage: discPct,
      offerTag: resolvedOfferTag,
      discountTagActive: tagActive,
    });
  } catch (error: any) {
    console.error('applyBulkDiscount error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ success: false, message: 'Name and price are required.' });
      return;
    }
    const cleanName = String(name).trim();
    const slug = (req.body.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).toLowerCase();
    const numericPrice = parseFloat(req.body.numericPrice ?? price) || 0;
    const product = new Product({
      ...req.body,
      name: cleanName,
      slug,
      price: numericPrice,
      numericPrice,
      discountPrice: Number(req.body.discountPrice) || 0,
      discountPercentage: Number(req.body.discountPercentage) || 0,
      discountTagActive: Boolean(req.body.discountTagActive),
      offerTag: req.body.offerTag || '',
    });
    await product.save();
    res.status(201).json({ success: true, message: 'Garment registered successfully.', product });
  } catch (error: any) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.identifier || '');
    let product = await Product.findOneAndDelete({
      $or: [
        { slug: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });
    if (!product && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndDelete(identifier);
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const validateProductsStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      res.status(200).json({ success: true, isValid: true, items: [] });
      return;
    }

    const validationResults: Array<{
      productId?: string;
      name: string;
      availableStock: number;
      requestedQuantity: number;
      inStock: boolean;
      hasSufficientStock: boolean;
      message?: string;
    }> = [];

    let overallValid = true;

    for (const item of items) {
      const queryId = item.productId || item._id || item.id;
      let product = null;

      if (queryId && String(queryId).match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(queryId);
      }
      if (!product && item.slug) {
        product = await Product.findOne({ slug: String(item.slug).toLowerCase().trim() });
      }
      if (!product && item.name) {
        product = await Product.findOne({ name: String(item.name).trim() });
      }

      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (!product) {
        overallValid = false;
        const msg = `Product "${item.name || queryId}" was not found in catalog.`;
        validationResults.push({
          productId: queryId,
          name: item.name || 'Unknown item',
          availableStock: 0,
          requestedQuantity: requestedQty,
          inStock: false,
          hasSufficientStock: false,
          isValid: false,
          error: msg,
          message: msg,
        } as any);
        continue;
      }

      const availableStock = product.stock !== undefined ? Math.max(0, product.stock) : (product.inStock ? 99 : 0);
      const isItemInStock = product.inStock !== false && availableStock > 0;
      const hasSufficient = isItemInStock && availableStock >= requestedQty;

      if (!hasSufficient) {
        overallValid = false;
      }

      let message: string | undefined;
      if (!isItemInStock) {
        message = `"${product.name}" is currently out of stock.`;
      } else if (!hasSufficient) {
        message = `Only ${availableStock} piece${availableStock === 1 ? '' : 's'} available for "${product.name}". You requested ${requestedQty}.`;
      }

      validationResults.push({
        productId: product._id.toString(),
        name: product.name,
        availableStock,
        requestedQuantity: requestedQty,
        inStock: isItemInStock,
        hasSufficientStock: hasSufficient,
        isValid: hasSufficient,
        error: message,
        message,
      } as any);
    }

    res.status(200).json({
      success: true,
      isValid: overallValid,
      allInStock: overallValid,
      validationResults,
      message: overallValid
        ? 'All items have verified inventory availability.'
        : 'Some garments in your bag are out of stock or exceed inventory reserves.',
      items: validationResults,
    });
  } catch (error: any) {
    console.error('validateProductsStock error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const visualSearchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, color, colorName, fabric, query } = req.body;

    const conditions: any[] = [];

    if (category && category !== 'ALL') {
      conditions.push({
        $or: [
          { category: { $regex: new RegExp(category, 'i') } },
          { name: { $regex: new RegExp(category, 'i') } },
        ],
      });
    }

    if (color || colorName) {
      const searchCol = colorName || color;
      conditions.push({
        $or: [
          { color: { $regex: new RegExp(searchCol, 'i') } },
          { colors: { $elemMatch: { $regex: new RegExp(searchCol, 'i') } } },
          { name: { $regex: new RegExp(searchCol, 'i') } },
        ],
      });
    }

    if (fabric) {
      conditions.push({
        $or: [
          { blend: { $regex: new RegExp(fabric, 'i') } },
          { description: { $regex: new RegExp(fabric, 'i') } },
          { accentBadge: { $regex: new RegExp(fabric, 'i') } },
        ],
      });
    }

    if (query) {
      conditions.push({
        $or: [
          { name: { $regex: new RegExp(query, 'i') } },
          { description: { $regex: new RegExp(query, 'i') } },
          { tag: { $regex: new RegExp(query, 'i') } },
        ],
      });
    }

    const filter: any = {};
    if (conditions.length > 0) {
      filter.$or = conditions;
    }

    // Exclude out-of-stock items if requested by filter config
    const configDoc = await SiteConfig.findOne({ key: 'filter-config' });
    if (configDoc?.data?.hideOutOfStockOnStorefront === true) {
      filter.inStock = { $ne: false };
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { stock: { $exists: false } },
            { stock: null },
            { stock: { $gt: 0 } },
          ],
        },
      ];
    }

    let products = await Product.find(filter).limit(20);

    // If specific search returns 0, fallback to general available catalog items
    if (products.length === 0) {
      products = await Product.find({ inStock: { $ne: false } }).limit(12);
    }

    // Enrich with membership pricing
    const activeMembership = await getUserActiveMembership((req as any).user?._id);
    const enriched = products.map((prod) => {
      const pObj = prod.toObject();
      const pricing = calculateMemberProductPricing(pObj, activeMembership);
      return {
        ...pObj,
        isMember: pricing.isMember,
        memberPrice: pricing.memberPrice,
        memberDiscountPercent: pricing.memberDiscountPercent,
        memberSavings: pricing.savings,
        memberPricePreview: Math.round(Number(pObj.numericPrice || pObj.price || 1200) * 0.85),
      };
    });

    // Asynchronously log to search telemetry for admin radar
    const logLabel = `[VISUAL] ${category || 'Atelier'} ${colorName || color || ''}`.trim();
    try {
      await SearchTelemetry.create({
        query: logLabel,
        normalizedQuery: logLabel.toLowerCase(),
        resultsCount: enriched.length,
        category: category || 'Visual Search',
        source: 'visual_search',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      count: enriched.length,
      products: enriched,
    });
  } catch (error: any) {
    console.error('visualSearchProducts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};



