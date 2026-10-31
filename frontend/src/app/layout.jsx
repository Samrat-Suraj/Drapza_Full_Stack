import { Koulen, Host_Grotesk, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const koulen = Koulen({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-koulen',
  display: 'swap',
});

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://drapza.com'),
  title: {
    default: 'DRAPZA — Modular Outerwear & Architectural Streetwear',
    template: '%s • DRAPZA Atelier',
  },
  description:
    'DRAPZA — modular outerwear engineered for extreme urban climates. Heavyweight French Terry, sculptural drape, and limited bespoke capsules.',
  keywords: ['luxury streetwear', 'modular outerwear', 'architectural drape', 'drapza', 'techwear', 'fashion atelier'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://drapza.com',
    siteName: 'DRAPZA',
    title: 'DRAPZA — Modular Outerwear & Architectural Streetwear',
    description: 'Modular luxury outerwear engineered for extreme urban climates.',
    images: [
      {
        url: '/images/drapza/home/hero.png',
        width: 1200,
        height: 630,
        alt: 'DRAPZA Atelier Luxury Modular Streetwear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRAPZA — Modular Luxury Streetwear',
    description: 'Modular outerwear engineered for the urban climate.',
    images: ['/images/drapza/home/hero.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DRAPZA',
    url: 'https://drapza.com',
    logo: 'https://drapza.com/images/drapza/home/hero.png',
    description: 'Modular luxury outerwear engineered for extreme urban climates.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8888333038',
      contactType: 'customer service',
    },
  };

  return (
    <html lang="en" className={`${koulen.variable} ${hostGrotesk.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=Koulen&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .preloader-wrapper {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                height: 100svh !important;
                z-index: 100000 !important;
                overflow: hidden !important;
              }
              .preloader-progress {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: #afb3ab !important;
                z-index: 1 !important;
              }
              .site-viewport-container {
                width: 100%;
              }
              body:has([data-admin-root]) .preloader-wrapper {
                display: none !important;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Suppress third-party browser extension runtime errors (e.g. Urban VPN chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/... reading 'M_ID')
                  // BEFORE Next.js dev client or React error overlay attaches its listeners!
                  if (typeof window !== 'undefined') {
                    var isExtError = function(msg, url, err) {
                      var strMsg = String(msg || '');
                      var strUrl = String(url || '');
                      var strStack = (err && err.stack) ? String(err.stack) : '';
                      return (
                        strUrl.indexOf('chrome-extension://') !== -1 ||
                        strUrl.indexOf('moz-extension://') !== -1 ||
                        strStack.indexOf('chrome-extension://') !== -1 ||
                        strStack.indexOf('moz-extension://') !== -1 ||
                        strMsg.indexOf('M_ID') !== -1 ||
                        strStack.indexOf('M_ID') !== -1 ||
                        strUrl.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1 ||
                        strStack.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1 ||
                        strMsg.indexOf('Cannot read properties of undefined') !== -1 && (strStack.indexOf('chrome-extension://') !== -1 || strUrl.indexOf('chrome-extension://') !== -1)
                      );
                    };

                    window.addEventListener('error', function(event) {
                      if (isExtError(event.message, event.filename, event.error)) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        return true;
                      }
                    }, true);

                    window.addEventListener('unhandledrejection', function(event) {
                      var reason = event.reason;
                      var strReason = (reason && reason.stack) ? String(reason.stack) : String(reason && reason.message ? reason.message : reason || '');
                      if (
                        strReason.indexOf('chrome-extension://') !== -1 ||
                        strReason.indexOf('moz-extension://') !== -1 ||
                        strReason.indexOf('M_ID') !== -1 ||
                        strReason.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1
                      ) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                      }
                    }, true);

                    var _origOnError;
                    try {
                      Object.defineProperty(window, 'onerror', {
                        configurable: true,
                        enumerable: true,
                        get: function() { return _origOnError; },
                        set: function(fn) {
                          _origOnError = function(msg, url, line, col, err) {
                            if (isExtError(msg, url, err)) {
                              return true;
                            }
                            if (typeof fn === 'function') {
                              return fn.apply(this, arguments);
                            }
                          };
                        }
                      });
                    } catch(e) {}
                  }

                  if (typeof Node !== 'undefined' && Node.prototype) {
                    var originalRemoveChild = Node.prototype.removeChild;
                    Node.prototype.removeChild = function(child) {
                      try {
                        if (child && child.parentNode && child.parentNode !== this) {
                          return child.parentNode.removeChild(child);
                        }
                        return originalRemoveChild.call(this, child);
                      } catch (e) {
                        return child;
                      }
                    };

                    var originalInsertBefore = Node.prototype.insertBefore;
                    Node.prototype.insertBefore = function(newNode, referenceNode) {
                      try {
                        if (referenceNode && referenceNode.parentNode && referenceNode.parentNode !== this) {
                          return referenceNode.parentNode.insertBefore(newNode, referenceNode);
                        }
                        return originalInsertBefore.call(this, newNode, referenceNode);
                      } catch (e) {
                        return newNode;
                      }
                    };
                  }

                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (name === 'bis_skin_checked' || name === 'bis_register' || (typeof name === 'string' && name.indexOf('__processed_') === 0)) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };
                  if (typeof MutationObserver !== 'undefined') {
                    new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && (m.attributeName === 'bis_skin_checked' || m.attributeName === 'bis_register' || (m.attributeName && m.attributeName.indexOf('__processed_') === 0))) {
                          m.target.removeAttribute(m.attributeName);
                        }
                      }
                    }).observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked', 'bis_register']
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="koulen_28999a45-module__2Ll8qa__variable host_grotesk_77591207-module__wBerHq__variable dm_mono_4d7aaead-module__WtXi1a__variable antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
