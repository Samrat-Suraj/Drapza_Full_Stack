/**
 * Utility for normalizing image URLs, including converting Google Drive share links
 * to high-speed direct Google CDN image links with reliable fallback.
 */

export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // Pattern 2: id=FILE_ID or ?id=FILE_ID or &id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  // Pattern 3: googleusercontent.com/d/FILE_ID
  const matchLh3 = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchLh3 && matchLh3[1]) {
    return matchLh3[1];
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(url);
}

/**
 * Extracts raw target image URL from Google Images search result link or redirect URL
 * e.g., https://www.google.com/imgres?imgurl=https%3A%2F%2Fexample.com%2Fphoto.jpg&imgrefurl=...
 * or https://www.google.com/url?sa=i&url=https%3A%2F%2F...
 */
export function extractGoogleImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: Google Images Search Result (contains imgurl=)
  if (/google\.[a-z.]+\/(imgres|search)/i.test(trimmed) || trimmed.includes("imgurl=")) {
    try {
      const parsed = new URL(trimmed);
      const imgurl = parsed.searchParams.get("imgurl");
      if (imgurl) {
        return decodeURIComponent(imgurl);
      }
    } catch {
      const match = trimmed.match(/[?&]imgurl=([^&]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  // Pattern 2: Google Redirect link (/url?url=... or /url?q=...)
  if (/google\.[a-z.]+\/url/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const targetUrl = parsed.searchParams.get("url") || parsed.searchParams.get("q") || parsed.searchParams.get("imgurl");
      if (targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))) {
        return decodeURIComponent(targetUrl);
      }
    } catch {
      const match = trimmed.match(/[?&](?:url|q|imgurl)=([^&]+)/i);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
          return decoded;
        }
      }
    }
  }

  return null;
}

export function isGoogleImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    isGoogleDriveUrl(url) ||
    /google\.[a-z.]+\/(imgres|url|search)/i.test(url) ||
    /gstatic\.com|googleusercontent\.com/i.test(url) ||
    url.includes("imgurl=")
  );
}

export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  // Rewrite legacy digifox image asset paths to drapza
  if (trimmed.includes("/digifox/")) {
    trimmed = trimmed.replace(/\/digifox\//g, "/drapza/");
  }

  // 1. Extract real image from Google Image Search result link (imgres / google.com/url)
  const extractedGoogleImage = extractGoogleImageUrl(trimmed);
  if (extractedGoogleImage) {
    trimmed = extractedGoogleImage;
  }

  // 2. Extract high-speed direct CDN URL from Google Drive share link
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      // High-resolution direct Google CDN endpoint (renders reliably without redirect/cookie blocks)
      return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
    }
  }

  // 3. Optimize Google UserContent / Photos images to high-resolution (w1600)
  if (/googleusercontent\.com\/[a-zA-Z0-9_\-\/]+/i.test(trimmed) && trimmed.includes("=")) {
    trimmed = trimmed.replace(/=([swh]\d+(-[a-z0-9]+)*|\w+)$/i, "=w1600");
  }

  return trimmed;
}

export function normalizeImageUrls(urls: string[] | string): string[] {
  if (!urls) return [];
  const list = Array.isArray(urls) ? urls : [urls];
  return list.map((u) => normalizeImageUrl(u)).filter(Boolean);
}

/**
 * Universal error handler for <img> tags that automatically falls back
 * to the server-side image proxy if direct CDN delivery is blocked by browser policies.
 */
export function handleImageFallbackError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  const currentSrc = target.src || "";

  // Handle legacy digifox path rewrite first
  if (currentSrc.includes("/digifox/")) {
    target.src = currentSrc.replace(/\/digifox\//g, "/drapza/");
    return;
  }

  const fileId = extractGoogleDriveFileId(currentSrc);

  // Avoid infinite loops
  if (target.dataset.triedProxy === "true") {
    target.src = "/images/drapza/products/product_1.png";
    return;
  }

  if (fileId) {
    target.dataset.triedProxy = "true";
    target.src = `/api/proxy-image?id=${fileId}`;
    return;
  }

  if (currentSrc.startsWith("http")) {
    target.dataset.triedProxy = "true";
    target.src = `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
    return;
  }

  target.src = "/images/drapza/products/product_1.png";
}
