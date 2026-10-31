import { CartItem } from "@/components/drapza/CartDrawer";

/**
 * Encodes an array of cart items into a compact, URL-safe base64 string
 */
export function encodeBagToUrl(items: CartItem[]): string {
  try {
    const compact = items.map((i) => ({
      id: i.id,
      n: i.name,
      p: i.price,
      s: i.size,
      c: i.color,
      img: i.image,
      q: i.quantity,
    }));
    const jsonStr = JSON.stringify(compact);
    if (typeof window !== "undefined") {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    }
    return Buffer.from(jsonStr).toString("base64url");
  } catch (err) {
    console.error("[BAG_SHARE] Failed to encode bag to URL", err);
    return "";
  }
}

/**
 * Decodes a URL-safe base64 string into CartItem[]
 */
export function decodeBagFromUrl(encoded: string): CartItem[] | null {
  try {
    let jsonStr = "";
    if (typeof window !== "undefined") {
      jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    } else {
      jsonStr = Buffer.from(encoded, "base64url").toString("utf-8");
    }
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item: any) => ({
      id: String(item.id || item.i || "01"),
      name: String(item.n || item.name || "Atelier Garment"),
      price: Number(item.p || item.price) || 990,
      size: String(item.s || item.size || "M"),
      color: String(item.c || item.color || "MONOCHROME"),
      image: String(item.img || item.image || "/images/drapza/products/product_1.png"),
      quantity: Math.max(1, Number(item.q || item.quantity) || 1),
    }));
  } catch (err) {
    console.warn("[BAG_SHARE] Invalid or corrupted bag string", err);
    return null;
  }
}

