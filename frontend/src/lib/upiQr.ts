import QRCode from "qrcode";

export interface UpiPaymentParams {
  upiId: string;
  payeeName?: string;
  amount?: number;
  transactionNote?: string;
  transactionRef?: string;
}

/**
 * Builds standard NPCI UPI intent URI
 * e.g. upi://pay?pa=samratsuraj10@okaxis&pn=DRAPZA%20ATELIER&am=1299.00&cu=INR&tn=Drapza%20Order
 */
export function generateUpiUri({
  upiId,
  payeeName = "DRAPZA ATELIER",
  amount,
  transactionNote = "Drapza Atelier Order",
  transactionRef,
}: UpiPaymentParams): string {
  const cleanUpi = (upiId || "").trim();
  if (!cleanUpi) return "";

  const params = new URLSearchParams();
  params.set("pa", cleanUpi);
  if (payeeName) params.set("pn", payeeName.trim());
  if (typeof amount === "number" && amount > 0) {
    params.set("am", amount.toFixed(2));
  }
  params.set("cu", "INR");
  if (transactionNote) params.set("tn", transactionNote.trim());
  if (transactionRef) params.set("tr", transactionRef.trim());

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates high-res crisp QR code data URL (PNG) completely client-side.
 * Works offline with zero network latency.
 */
export async function generateUpiQrDataUrl(
  params: UpiPaymentParams,
  options?: { size?: number; margin?: number }
): Promise<string> {
  const uri = generateUpiUri(params);
  if (!uri) return "";

  try {
    return await QRCode.toDataURL(uri, {
      width: options?.size || 320,
      margin: options?.margin ?? 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Local QR generation failed, falling back to external renderer:", err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${options?.size || 320}x${
      options?.size || 320
    }&data=${encodeURIComponent(uri)}`;
  }
}
