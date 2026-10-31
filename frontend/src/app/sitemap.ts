import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://drapza.com';
  const backendBase =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_API_URL
      : null);

  if (backendBase) {
    try {
      const fullUrl = `${backendBase.replace(/\/$/, '')}${backendBase.endsWith('/api') ? '' : '/api'}/seo/sitemap`;
      const res = await fetch(fullUrl, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
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
    } catch (err) {
      console.warn('[SITEMAP] Failed to fetch live sitemap from API, using static fallback:', err);
    }
  }

  // Fallback static routes
  const staticRoutes = [
    { url: `${defaultBaseUrl}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${defaultBaseUrl}/wardrobe`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${defaultBaseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${defaultBaseUrl}/touchpoint`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${defaultBaseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
  ];

  return staticRoutes;
}
