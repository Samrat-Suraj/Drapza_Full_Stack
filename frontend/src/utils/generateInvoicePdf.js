import { downloadOrderInvoice } from '../lib/invoiceDownload';

/**
 * Generates and downloads the official DRAPZA Tax Invoice & Consignment PDF
 * matching the exact dynamic layout, section order, branding, and GST parameters
 * configured in the Admin Invoice & GST CMS.
 *
 * @param {Object} order - Full order object with customer, items, and address info.
 * @param {Object} [customGstConfig] - Optional override GST/layout config.
 */
export const generateInvoicePdf = async (order, customGstConfig) => {
  if (!order) return;

  try {
    await downloadOrderInvoice(order, customGstConfig);
  } catch (error) {
    console.error('Official Drapza invoice generation error:', error);
    if (typeof window !== 'undefined') {
      alert('Unable to generate invoice PDF at this moment. Please try again.');
    }
  }
};
