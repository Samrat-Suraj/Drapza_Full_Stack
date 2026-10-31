import { MetadataRoute } from 'next';
import productsData from '@/data/products.json';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://drapza.com';
  const backendBase = process.env.INTERNAL_BACKEND_URL || process.env.BACKEND_URL;

  // Only attempt live fetch if an absolute, non-localhost remote URL is provided
  const isRemoteBackend =
    typeof backendBase === 'string' &&
    (backendBase.startsWith('https://') || backendBase.startsWith('http://')) &&
    !backendBase.includes('localhost') &&
    !backendBase.includes('127.0.0.1');

  if (isRemoteBackend) {
    try {
      const fullUrl = `${backendBase.replace(/\/$/, '')}${backendBase.endsWith('/api') ? '' : '/api'}/seo/sitemap`;
      const res = await fetch(fullUrl, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.urls) && data.urls.length > 0) {
          return data.urls.map((item: any) => ({
            url: item.url,
            lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
            changeFrequency: (item.changefreq as any) || 'weekly',
            priority: typeof item.priority === 'number' ? item.priority : 0.7,
          }));
        }
      }
    } catch {
      // Fallback to static routes
    }
  }

  // Instant static sitemap generation (Zero network latency, no build timeouts)
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${defaultBaseUrl}`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${defaultBaseUrl}/wardrobe`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${defaultBaseUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${defaultBaseUrl}/genesis`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${defaultBaseUrl}/membership`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${defaultBaseUrl}/reviews`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${defaultBaseUrl}/stories`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${defaultBaseUrl}/testimonials`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${defaultBaseUrl}/touchpoint`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${defaultBaseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Append product dynamic routes if available in local data
  try {
    const products = Array.isArray(productsData)
      ? productsData
      : (productsData as any)?.products || [];
    for (const p of products) {
      if (p.slug || p._id || p.id) {
        const slug = p.slug || p._id || p.id;
        staticRoutes.push({
          url: `${defaultBaseUrl}/wardrobe/${slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {}

  return staticRoutes;
}
