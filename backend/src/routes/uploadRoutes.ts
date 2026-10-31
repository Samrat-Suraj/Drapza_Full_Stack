import { Router, Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

const router = Router();

// Convert Google Drive sharing link to direct embed/download URL
function convertGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

/**
 * POST /api/upload
 * Body: { image: string, folder?: string }
 * image can be a base64 data URI or an image HTTP(S) URL (including Google Drive links)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    let { image, folder = 'drapza/products' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data or URL is required.' });
    }

    // If it's a Google Drive link, convert to direct URL
    if (typeof image === 'string' && image.includes('drive.google.com')) {
      image = convertGoogleDriveUrl(image);
    }

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'auto',
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary.',
      url: uploadRes.secure_url,
      public_id: uploadRes.public_id,
      format: uploadRes.format,
      width: uploadRes.width,
      height: uploadRes.height,
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to upload image to Cloudinary.',
    });
  }
});

export default router;
