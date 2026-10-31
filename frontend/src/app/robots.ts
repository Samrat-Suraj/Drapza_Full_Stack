import { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
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
      const fullUrl = `${backendBase.replace(/\/$/, '')}${backendBase.endsWith('/api') ? '' : '/api'}/seo/settings`;
      const res = await fetch(fullUrl, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.settings) {
          const s = data.settings;
          const baseUrl = s.canonicalBaseUrl || defaultBaseUrl;

          const rules: MetadataRoute.Robots['rules'] = [
            {
              userAgent: '*',
              allow: s.robotsDirectives?.index ? '/' : undefined,
              disallow: s.robotsDirectives?.index ? ['/admin', '/checkout', '/api/', '/profile', '/order-confirm'] : ['/'],
            },
            {
              userAgent: 'GPTBot',
              allow: s.aiCrawlerRules?.allowGptBot ? '/' : undefined,
              disallow: s.aiCrawlerRules?.allowGptBot ? undefined : ['/'],
            },
            {
              userAgent: 'ClaudeBot',
              allow: s.aiCrawlerRules?.allowClaudeBot ? '/' : undefined,
              disallow: s.aiCrawlerRules?.allowClaudeBot ? undefined : ['/'],
            },
            {
              userAgent: 'PerplexityBot',
              allow: s.aiCrawlerRules?.allowPerplexityBot ? '/' : undefined,
              disallow: s.aiCrawlerRules?.allowPerplexityBot ? undefined : ['/'],
            },
            {
              userAgent: 'Google-Extended',
              allow: s.aiCrawlerRules?.allowGoogleExtended ? '/' : undefined,
              disallow: s.aiCrawlerRules?.allowGoogleExtended ? undefined : ['/'],
            },
          ];

          return {
            rules,
            sitemap: `${baseUrl}/sitemap.xml`,
            host: baseUrl,
          };
        }
      }
    } catch {
      // Fallback to standard robots policy
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/checkout', '/api/', '/profile', '/order-confirm'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    sitemap: `${defaultBaseUrl}/sitemap.xml`,
    host: defaultBaseUrl,
  };
}
