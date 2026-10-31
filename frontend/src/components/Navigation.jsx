'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Camera } from 'lucide-react';
import gsap from 'gsap';
import { scrambleText } from '../utils/textSplitter';
import { usePageTransition } from './PageTransition';
import { useAuth } from '../context/AuthContext';
import { footerConfigApi } from '../lib/api';

const VisualSearchModal = dynamic(
  () => import('./drapza/VisualSearchModal').then((m) => m.VisualSearchModal),
  { ssr: false }
);

const DEFAULT_MENU_SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'YouTube', href: 'https://www.youtube.com/' },
];

export const Navigation = ({ currentRoute: propRoute, navigate: propNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentRoute = propRoute || pathname;
  const pageTransition = usePageTransition();
  const transitionNavigate = pageTransition?.navigate;

  // Dynamic social links controlled via Admin CMS (Footer & Navigation Architecture)
  const [menuSocials, setMenuSocials] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('drapza_footer_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.col2Links) && parsed.col2Links.length > 0) {
            return parsed.col2Links;
          }
        }
      } catch (_) {}
    }
    return DEFAULT_MENU_SOCIALS;
  });

  useEffect(() => {
    let isMounted = true;

    // Fetch live config from backend CMS
    footerConfigApi
      .getFooterConfig()
      .then((res) => {
        if (!isMounted) return;
        const configData = res?.data || res;
        if (Array.isArray(configData?.col2Links) && configData.col2Links.length > 0) {
          setMenuSocials(configData.col2Links);
          try {
            localStorage.setItem('drapza_footer_config', JSON.stringify(configData));
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Listen to real-time update events from Admin CMS saves
    const handleConfigUpdate = (e) => {
      const data = e?.detail;
      if (Array.isArray(data?.col2Links) && data.col2Links.length > 0) {
        setMenuSocials(data.col2Links);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'drapza_footer_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed?.col2Links) && parsed.col2Links.length > 0) {
            setMenuSocials(parsed.col2Links);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('drapza_footer_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('drapza_footer_config_updated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navigate = useCallback((path) => {
    if (!path) return;
    if (propNavigate) {
      propNavigate(path);
      return;
    }
    const cleanTarget = path.split('?')[0].split('#')[0];
    const cleanCurrent = (pathname || '').split('?')[0].split('#')[0];
    if (
      transitionNavigate &&
      typeof transitionNavigate === 'function' &&
      !cleanTarget.startsWith('/admin') &&
      !cleanCurrent.startsWith('/admin')
    ) {
      transitionNavigate(path);
      return;
    }
    router.push(path);
  }, [propNavigate, transitionNavigate, pathname, router]);

  const { isAuthenticated, user } = useAuth() || {};

  // Robust admin permission evaluation
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const evaluateAdmin = () => {
      try {
        let u = user;
        if (!u && typeof window !== 'undefined') {
          u = JSON.parse(localStorage.getItem('drapza_user') || 'null');
        }
        const role = (u?.role || '').toString().toLowerCase();
        const email = (u?.email || '').toString().toLowerCase();
        const isAdminFlag = Boolean(u?.isAdmin);
        const isAdm = role === 'admin' || email === 'drapza.cloth@gmail.com' || isAdminFlag;
        setIsAdminUser(isAdm);
      } catch {
        setIsAdminUser(false);
      }
    };

    evaluateAdmin();

    const onStorage = () => evaluateAdmin();
    window.addEventListener('storage', onStorage);
    window.addEventListener('drapza_login_success', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('drapza_login_success', onStorage);
    };
  }, [user]);

  const isUserAdmin = Boolean(
    isAdminUser ||
    (user && (
      (user.role || '').toString().toLowerCase() === 'admin' ||
      (user.email || '').toString().toLowerCase() === 'drapza.cloth@gmail.com' ||
      user.isAdmin === true
    ))
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [visualSearchTab, setVisualSearchTab] = useState('upload');
  const navRef = useRef(null);
  const overlayRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Listen for custom trigger event from anywhere across the storefront
  useEffect(() => {
    const handleOpenVisualSearch = (e) => {
      setVisualSearchTab(e?.detail?.tab || 'upload');
      setVisualSearchOpen(true);
    };
    window.addEventListener('drapza:open-visual-search', handleOpenVisualSearch);
    return () => window.removeEventListener('drapza:open-visual-search', handleOpenVisualSearch);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to open Visual Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        setVisualSearchTab('upload');
        setVisualSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAuthRoute = pathname === '/login' || pathname === '/join' || pathname === '/signup';

  // Auto hide/show on scroll
  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const curr = window.scrollY;
      if (curr > 60 && curr > lastScroll && !isOpen) {
        navRef.current?.classList.add('hidden');
      } else {
        navRef.current?.classList.remove('hidden');
      }
      lastScroll = curr;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  useEffect(() => {
    if (!overlayRef.current) return;
    gsap.set(overlayRef.current, { scaleY: 0, transformOrigin: 'top center' });

    const mainH4s = overlayRef.current.querySelectorAll('.menu-main-link h4');
    gsap.set(mainH4s, { y: 60, opacity: 0 });

    const subLinks = overlayRef.current.querySelectorAll('.menu-sub-links a');
    gsap.set(subLinks, { y: 40, opacity: 0 });
  }, []);

  // Force close menu immediately (no animation lock)
  const closeMenuImmediately = useCallback(() => {
    setIsOpen(false);
    setIsAnimating(false);
    hamburgerRef.current?.classList.remove('open');
    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current);
      gsap.set(overlayRef.current, { scaleY: 0, transformOrigin: 'top center' });
      const mainH4s = overlayRef.current.querySelectorAll('.menu-main-link h4');
      const subLinks = overlayRef.current.querySelectorAll('.menu-sub-links a');
      gsap.killTweensOf(mainH4s);
      gsap.killTweensOf(subLinks);
      gsap.set(mainH4s, { y: 60, opacity: 0 });
      gsap.set(subLinks, { y: 40, opacity: 0 });
    }
  }, []);

  // Guarantee that whenever route changes, the navbar menu is closed!
  useEffect(() => {
    closeMenuImmediately();
  }, [pathname, closeMenuImmediately]);

  const openMenu = () => {
    if (isOpen) return;
    setIsAnimating(true);
    setIsOpen(true);
    hamburgerRef.current?.classList.add('open');

    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap.killTweensOf(overlay);
    const mainH4s = overlay.querySelectorAll('.menu-main-link h4');
    const subLinks = overlay.querySelectorAll('.menu-sub-links a');
    gsap.killTweensOf(mainH4s);
    gsap.killTweensOf(subLinks);
    const cipherEls = overlay.querySelectorAll('.menu-items-header p, .menu-social a');

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false)
    });

    // 1. Overlay scales down
    tl.to(overlay, {
      duration: 0.5,
      scaleY: 1,
      ease: 'power4.out'
    });

    // 2. Main links slide up
    tl.to(
      mainH4s,
      {
        duration: 0.5,
        y: 0,
        opacity: 1,
        stagger: 0.06,
        ease: 'power4.out'
      },
      '-=0.35'
    );

    // 3. Subroutine links stagger in
    tl.to(
      subLinks,
      {
        duration: 0.5,
        y: 0,
        opacity: 1,
        stagger: 0.04,
        ease: 'power4.out'
      },
      '<'
    );

    // 4. Cipher scramble effect
    tl.add(() => {
      cipherEls.forEach((el, idx) => {
        setTimeout(() => {
          scrambleText(el, 0.35);
        }, idx * 40);
      });
    }, '<');
  };

  const closeMenu = (callback) => {
    setIsOpen(false);
    setIsAnimating(true);
    hamburgerRef.current?.classList.remove('open');

    const overlay = overlayRef.current;
    if (!overlay) {
      setIsAnimating(false);
      if (callback) callback();
      return;
    }

    gsap.killTweensOf(overlay);
    const mainH4s = overlay.querySelectorAll('.menu-main-link h4');
    const subLinks = overlay.querySelectorAll('.menu-sub-links a');
    gsap.killTweensOf(mainH4s);
    gsap.killTweensOf(subLinks);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        if (callback) callback();
      }
    });

    // Sub links exit down
    tl.to(subLinks, {
      duration: 0.2,
      y: 40,
      opacity: 0,
      stagger: -0.02,
      ease: 'power3.in'
    });

    // Main links exit down
    tl.to(
      mainH4s,
      {
        duration: 0.2,
        y: 60,
        opacity: 0,
        stagger: -0.02,
        ease: 'power3.in'
      },
      '<'
    );

    // Overlay collapses up
    tl.to(
      overlay,
      {
        duration: 0.3,
        scaleY: 0,
        ease: 'power3.inOut'
      },
      '-=0.08'
    );
  };

  const handleLink = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanCurrent = (currentRoute || '').split('?')[0].split('#')[0];
    const cleanPath = (path || '').split('?')[0].split('#')[0];

    const normalizeRoute = (r) => {
      if (r === '/about' || r === '/genesis') return '/about';
      if (r === '/contact' || r === '/touchpoint') return '/contact';
      if (r === '/shop' || r === '/wardrobe') return '/shop';
      if (r === '/stories' || r === '/testimonials') return '/stories';
      return r;
    };

    if (normalizeRoute(cleanPath) === normalizeRoute(cleanCurrent)) {
      closeMenu();
      return;
    }
    closeMenuImmediately();
    navigate(path);
  };

  if (isAuthRoute) return null;

  return (
    <nav className="menu !z-50" ref={navRef}>
      <div className="menu-header">
        <h4
          className="menu-logo"
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) closeMenuImmediately();
            const cleanCurrent = (currentRoute || '').split('?')[0].split('#')[0];
            if (cleanCurrent !== '/') navigate('/');
          }}
        >
          DRAPZA
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Admin Dashboard Action (Visible only if user is admin) */}
          {isUserAdmin && (
            <button
              type="button"
              className="nav-admin-btn"
              aria-label="Admin Dashboard"
              onClick={(e) => {
                e.stopPropagation();
                if (isOpen) closeMenuImmediately();
                navigate('/admin');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                padding: '0.4rem 0.5rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.14em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              title="Admin Dashboard (/admin)"
            >
              ADMIN
            </button>
          )}

          {/* AI Search Option (Hidden on mobile mode) */}
          <button
            type="button"
            className="nav-search-btn !hidden md:!flex"
            aria-label="AI Search Catalog"
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) closeMenuImmediately();
              setVisualSearchTab('text');
              setVisualSearchOpen(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              padding: '0.4rem 0.5rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.14em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            title="Search catalog with AI (Ctrl+K)"
          >
            AI SEARCH
          </button>

          {/* Shop button (Hidden on mobile mode) */}
          <button
            type="button"
            className="nav-shop-btn !hidden md:!flex"
            aria-label="Shop Catalog"
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) closeMenuImmediately();
              navigate('/shop');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              padding: '0.4rem 0.5rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.14em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            SHOP
          </button>

          {/* Membership Direct Action */}
          <button
            type="button"
            className="nav-membership-btn"
            aria-label="VIP Membership Club"
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) closeMenuImmediately();
              navigate('/membership');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              padding: '0.4rem 0.5rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.14em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            MEMBERSHIP
          </button>

          {currentRoute !== '/login' && (
            <button
              type="button"
              className="nav-member-btn !hidden md:!flex"
              aria-label="Member Identity"
              onClick={(e) => {
                e.stopPropagation();
                if (isOpen) closeMenuImmediately();
                navigate(isAuthenticated ? '/profile' : '/login');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                padding: '0.4rem 0.5rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.14em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px', minWidth: '12px', maxWidth: '12px', flexShrink: 0, color: '#ffffff' }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: '11px', height: '11px', minWidth: '11px', maxWidth: '11px', flexShrink: 0, display: 'block', color: '#ffffff', stroke: '#ffffff' }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span style={{ whiteSpace: 'nowrap', color: '#ffffff' }}>{isAuthenticated && user?.name ? user.name.trim().split(' ')[0].toUpperCase() : 'MEMBER'}</span>
            </button>
          )}

          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle menu"
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) closeMenu();
              else openMenu();
            }}
          >
            <div className="menu-hamburger-icon" ref={hamburgerRef}>
              <span className="menu-item"></span>
              <span className="menu-item"></span>
            </div>
          </button>
        </div>
      </div>

      <div
        className="menu-overlay"
        ref={overlayRef}
        style={{
          pointerEvents: isOpen ? 'all' : 'none'
        }}
      >
        <div className="menu-overlay-items">
          <div className="menu-overlay-col menu-overlay-col-sm">
            <div className="menu-items-header">
              <p>Root</p>
            </div>
            <div className="menu-main-links">
              <a
                className="menu-main-link"
                href="/"
                onClick={(e) => handleLink(e, '/')}
              >
                <h4>Drapza Home</h4>
              </a>
              <a
                className="menu-main-link"
                href="/shop"
                onClick={(e) => handleLink(e, '/shop')}
              >
                <h4>Shop All Products</h4>
              </a>
              <a
                className="menu-main-link"
                href="/membership"
                onClick={(e) => handleLink(e, '/membership')}
              >
                <h4>VIP Membership</h4>
              </a>
              <a
                className="menu-main-link"
                href="/about"
                onClick={(e) => handleLink(e, '/about')}
              >
                <h4>About Drapza</h4>
              </a>
            </div>
          </div>

          <div className="menu-overlay-col menu-overlay-col-lg">
            <div className="menu-overlay-sub-col">
              <div className="menu-items-header">
                <p>Subroutine</p>
              </div>
              <div className="menu-sub-links">
                {isUserAdmin && (
                  <a href="/admin" onClick={(e) => handleLink(e, '/admin')} style={{ color: '#ffffff', fontWeight: 700 }}>
                    Admin Dashboard
                  </a>
                )}
                <a href="/contact" onClick={(e) => handleLink(e, '/contact')}>
                  Contact Us
                </a>
                <a href="/track" onClick={(e) => handleLink(e, '/track')}>
                  Track Shipment
                </a>
                <a href="/stories" onClick={(e) => handleLink(e, '/stories')}>
                  Boutique Stories
                </a>
                <a href="/terms" onClick={(e) => handleLink(e, '/terms')}>
                  Terms & Protocol
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="menu-overlay-footer">
          {menuSocials.map((social, idx) => (
            <div className="menu-social" key={idx}>
              <a
                href={social.href || '#'}
                target={social.href && social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href && social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {social.label}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Visual AI Garment Search Modal */}
      {visualSearchOpen && (
        <VisualSearchModal
          isOpen={visualSearchOpen}
          onClose={() => setVisualSearchOpen(false)}
          initialTab={visualSearchTab}
        />
      )}
    </nav>
  );
};

export default Navigation;
