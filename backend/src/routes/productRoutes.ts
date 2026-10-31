import { Router } from 'express';
import {
  getProducts,
  getProductByIdOrSlug,
  updateProduct,
  createProduct,
  deleteProduct,
  updateProductStock,
  applyBulkDiscount,
  validateProductsStock,
  visualSearchProducts,
} from '../controllers/productController';
import { protect, optionalProtect, adminOnly } from '../middleware/auth';
import cloudinary from '../config/cloudinary';

const router = Router();

// Public Product Catalog Discovery & Stock Validation (with optional member context)
router.get('/', optionalProtect, getProducts);
router.post('/visual-search', optionalProtect, visualSearchProducts);
router.post('/validate-stock', validateProductsStock);
router.get('/:identifier', optionalProtect, getProductByIdOrSlug);

// Admin-Only Product Management
router.post('/upload-image', protect, adminOnly, async (req, res) => {
  try {
    const { image, folder = 'drapza_products' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data or URL is required.' });
    }
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'auto',
    });
    return res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully to Cloudinary.',
      url: uploadRes.secure_url,
      public_id: uploadRes.public_id,
    });
  } catch (error: any) {
    console.error('Product Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to upload product image to Cloudinary.',
    });
  }
});

router.post('/bulk-discount', protect, adminOnly, applyBulkDiscount);
router.post('/', protect, adminOnly, createProduct);
router.patch('/:identifier/stock', protect, adminOnly, updateProductStock);
router.put('/:identifier', protect, adminOnly, updateProduct);
router.delete('/:identifier', protect, adminOnly, deleteProduct);

export default router;

