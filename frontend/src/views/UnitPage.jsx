'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextMotion } from '../components/TextMotion';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { useCart } from '../context/CartContext';
import productsData from '../data/products.json';
import { useGetProductByIdOrSlugQuery, useGetProductsQuery } from '../redux/api/productApi';
import { ProductCard } from '../components/drapza/ProductCard';
import { ProductDetailSkeleton } from '../components/drapza/ProductDetailSkeleton';
import { ProductReviewsSection } from '../components/drapza/ProductReviewsSection';
import { BogoTierSelector } from '../components/drapza/BogoTierSelector';
import { bogoConfigApi, DEFAULT_BOGO_CONFIG } from '../lib/api';

import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { audioSystem } from '../components/drapza/AudioSystem';
import { normalizeImageUrl, handleImageFallbackError } from '../lib/imageUtils';

gsap.registerPlugin(ScrollTrigger);

const colorsMap = {
  Black: '#121212',
  Stone: '#a49e91',
  Ice: '#bfc4cb',
  Grey: '#686868',
  White: '#ffffff'
};

const getShotUrl = (num) => `/product/product_shot_0${num}.jpg`;
const getMinimapUrl = (num) => `/product/product_minimap_0${num}.jpg`;

export const UnitPage = ({ slug, navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const { addToCart } = useCart();
  const heroRef = useRef(null);
  const activeMinimapRef = useRef(0);

  // Extract slug from prop, URL pathname, or search params safely
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathSlug = currentPath.startsWith('/wardrobe/')
    ? currentPath.replace('/wardrobe/', '').replace(/\/$/, '')
    : null;
  const querySlug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('product') : null;
  let targetSlug = slug || pathSlug || querySlug;
  if (!targetSlug || targetSlug === 'unit') {
    targetSlug = 'unit-01';
  }

  // RTK Query live product hooks
  const { data: apiProductData, isLoading: isProductLoading } = useGetProductByIdOrSlugQuery(targetSlug);
  const { data: allProductsData } = useGetProductsQuery();
  const mongoProducts = allProductsData?.products || [];

  // Live studio preview override state (updates instantly as admin types or toggles)
  const [liveOverride, setLiveOverride] = useState(null);

  useEffect(() => {
    const handleLiveStudioMessage = (event) => {
      if (event.data?.type === 'DRAPZA_STUDIO_LIVE_UPDATE' && event.data?.product) {
        setLiveOverride(event.data.product);
      }
    };

    // Check localStorage cache on mount
    try {
      const cached =
        localStorage.getItem('drapza_live_preview_' + targetSlug) ||
        localStorage.getItem('drapza_live_preview_active');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!parsed.slug || parsed.slug === targetSlug || targetSlug === 'unit-01') {
          setLiveOverride(parsed);
        }
      }
    } catch (e) { }

    const handleStorageUpdate = (e) => {
      if (
        (e.key === 'drapza_live_preview_' + targetSlug || e.key === 'drapza_live_preview_active') &&
        e.newValue
      ) {
        try {
          setLiveOverride(JSON.parse(e.newValue));
        } catch (err) { }
      }
    };

    window.addEventListener('message', handleLiveStudioMessage);
    window.addEventListener('storage', handleStorageUpdate);

    // Notify parent studio window that UnitPage preview is ready to receive live data
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'DRAPZA_UNIT_PAGE_READY', slug: targetSlug }, '*');
      }
    } catch (e) { }

    return () => {
      window.removeEventListener('message', handleLiveStudioMessage);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [targetSlug]);

  // Find product from apiProductData or mongoProducts or fallback productsData
  const baseProduct = useMemo(() => {
    if (apiProductData?.product) return apiProductData.product;
    if (mongoProducts.length > 0) {
      const match = mongoProducts.find(
        (p) =>
          p.slug === targetSlug ||
          p._id === targetSlug ||
          (p.name && p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === targetSlug)
      );
      if (match) return match;
    }
    const localMatch = productsData.find(
      (p) =>
        p.slug === targetSlug ||
        p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === targetSlug
    );
    if (localMatch) return localMatch;
    if (isProductLoading && !liveOverride) return null;
    return mongoProducts[0] || productsData[0];
  }, [apiProductData, mongoProducts, targetSlug, isProductLoading, liveOverride]);

  // Merge live studio edits over base product in real time
  const product = liveOverride ? { ...baseProduct, ...liveOverride } : baseProduct;

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [selectedBogoTier, setSelectedBogoTier] = useState(null);
  const [bogoConfig, setBogoConfig] = useState(DEFAULT_BOGO_CONFIG);
  const [garmentSizes, setGarmentSizes] = useState([]);

  // Load and sync live BOGO CMS configuration
  useEffect(() => {
    let isMounted = true;
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('drapza_bogo_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.isEnabled === 'boolean') {
            if (isMounted) setBogoConfig(parsed);
          }
        }
      }
    } catch (e) { }

    bogoConfigApi
      .getBogoConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setBogoConfig(res.data);
          if (!res.data.isEnabled) {
            setSelectedBogoTier(null);
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('drapza_bogo_config', JSON.stringify(res.data));
          }
        }
      })
      .catch(() => { });

    const handleStorageChange = (e) => {
      if (e.key === 'drapza_bogo_config' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && typeof updated.isEnabled === 'boolean') {
            setBogoConfig(updated);
            if (!updated.isEnabled) {
              setSelectedBogoTier(null);
            }
          }
        } catch (err) { }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize garment sizes for each piece in multi-piece bundle
  useEffect(() => {
    if (selectedBogoTier && selectedBogoTier.totalQty > 1) {
      setGarmentSizes(Array(selectedBogoTier.totalQty).fill(selectedSize || 'M'));
    } else {
      setGarmentSizes([]);
    }
  }, [selectedBogoTier, selectedSize]);

  const handleUpdateGarmentSize = (index, size) => {
    setGarmentSizes((prev) => {
      const next = [...prev];
      next[index] = size;
      return next;
    });
  };

  // Keep selectedSize valid if admin adds or removes form sizes
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0 && !product.sizes.includes(selectedSize)) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product?.sizes]);

  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const hasPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      setIsPreview(isIframe || hasPreview);
    }
  }, []);

  // Wishlist state and handlers
  const [isSaved, setIsSaved] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  const checkIsSaved = useCallback((prod) => {
    if (!prod || typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('drapza_wishlist');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const prodId = String(prod._id || prod.id || '');
          const prodSlug = String(prod.slug || (prod.name ? prod.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : ''));
          const prodName = String(prod.name || '').trim().toLowerCase();
          return list.some((it) => {
            const itId = String(it._id || it.id || '');
            const itSlug = String(it.slug || '');
            const itName = String(it.name || '').trim().toLowerCase();
            return (prodId && itId === prodId) || (prodSlug && itSlug === prodSlug) || (prodName && itName === prodName);
          });
        }
      }
    } catch (_) {}
    return false;
  }, []);

  useEffect(() => {
    if (product) {
      setIsSaved(checkIsSaved(product));
    }
  }, [product, checkIsSaved]);

  useEffect(() => {
    const handleWishlistSync = () => {
      if (product) {
        setIsSaved(checkIsSaved(product));
      }
    };
    window.addEventListener('storage', handleWishlistSync);
    window.addEventListener('drapza:wishlist_updated', handleWishlistSync);
    return () => {
      window.removeEventListener('storage', handleWishlistSync);
      window.removeEventListener('drapza:wishlist_updated', handleWishlistSync);
    };
  }, [product, checkIsSaved]);

  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => {
        setSaveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  const handleToggleSaveItem = () => {
    if (!product) return;
    try {
      const slugVal = product.slug || (product.name ? product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'item');
      const prodId = String(product._id || product.id || slugVal);
      const prodName = String(product.name || '').trim();
      const imgUrl = (product.images && product.images[0]) || product.image_url || product.image || '/products/product_1.png';
      const rawPrice = product.price || 1200;
      const numericPrice = typeof product.numericPrice === 'number'
        ? product.numericPrice
        : (parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 1200);

      // Read current drapza_wishlist
      let currentWishlist = [];
      const savedRaw = localStorage.getItem('drapza_wishlist');
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed)) currentWishlist = parsed;
        } catch (_) {}
      }

      // Read current drapza_atelier_wishlist_v1
      let currentAtelier = [];
      const savedAtelierRaw = localStorage.getItem('drapza_atelier_wishlist_v1');
      if (savedAtelierRaw) {
        try {
          const parsed = JSON.parse(savedAtelierRaw);
          if (Array.isArray(parsed)) currentAtelier = parsed;
        } catch (_) {}
      }

      const matchIndex = currentWishlist.findIndex((it) => {
        const itId = String(it._id || it.id || '');
        const itSlug = String(it.slug || '');
        const itName = String(it.name || '').trim().toLowerCase();
        return (prodId && itId === prodId) || (slugVal && itSlug === slugVal) || (prodName && itName === prodName.toLowerCase());
      });

      if (matchIndex >= 0) {
        // Already saved -> Remove from wishlist
        const updatedWishlist = currentWishlist.filter((_, idx) => idx !== matchIndex);
        localStorage.setItem('drapza_wishlist', JSON.stringify(updatedWishlist));

        const updatedAtelier = currentAtelier.filter((it) => {
          const itId = String(it.id || '');
          const itSlug = String(it.slug || '');
          const itName = String(it.name || '').trim().toLowerCase();
          return itId !== prodId && itSlug !== slugVal && itName !== prodName.toLowerCase();
        });
        localStorage.setItem('drapza_atelier_wishlist_v1', JSON.stringify(updatedAtelier));

        setIsSaved(false);
        try { audioSystem.playClick(600); } catch (_) {}

        setSaveToast({
          title: 'Removed from Wishlist',
          description: `${product.name} removed from your saved collection`,
          action: null
        });

        window.dispatchEvent(new CustomEvent('drapza:wishlist_updated', { detail: { action: 'removed', product } }));
      } else {
        // Not saved -> Add to wishlist
        const newWishlistItem = {
          _id: prodId,
          id: prodId,
          name: product.name,
          slug: slugVal,
          price: rawPrice,
          numericPrice: numericPrice,
          color: product.color || 'Black',
          tag: product.tag || 'Deform',
          sizes: product.sizes || ['S', 'M', 'L', 'XL'],
          image_url: imgUrl,
          image: imgUrl,
          images: product.images || [imgUrl],
          category: product.category || 'Apparel',
          discountPrice: product.discountPrice,
          discountPercentage: product.discountPercentage,
          discountTagActive: product.discountTagActive,
          offerTag: product.offerTag,
          inStock: product.inStock !== false,
          savedAt: new Date().toISOString()
        };

        const updatedWishlist = [newWishlistItem, ...currentWishlist];
        localStorage.setItem('drapza_wishlist', JSON.stringify(updatedWishlist));

        const newAtelierItem = {
          id: prodId,
          slug: slugVal,
          name: product.name,
          price: typeof rawPrice === 'string' && rawPrice.startsWith('₹') ? rawPrice : `₹${numericPrice.toLocaleString('en-IN')}`,
          numericPrice: numericPrice,
          image: imgUrl,
          category: product.category || 'Apparel',
        };
        const updatedAtelier = [newAtelierItem, ...currentAtelier.filter((it) => String(it.id) !== prodId)];
        localStorage.setItem('drapza_atelier_wishlist_v1', JSON.stringify(updatedAtelier));

        setIsSaved(true);
        try { audioSystem.playClick(950); } catch (_) {}

        setSaveToast({
          title: 'Saved to Wishlist',
          description: `${product.name} added to your saved garments`,
          action: {
            label: 'VIEW WISHLIST',
            onClick: () => router.push('/profile?tab=wishlist')
          }
        });

        window.dispatchEvent(new CustomEvent('drapza:wishlist_updated', { detail: { action: 'added', product: newWishlistItem } }));
      }
    } catch (e) {
      console.error('Error toggling wishlist item:', e);
    }
  };

  // Snapshots & Minimaps arrays: if product has custom uploaded image(s), use them
  const snapshots = useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product?.image) {
      return [
        product.image,
        getShotUrl(2),
        getShotUrl(3),
        getShotUrl(4),
        getShotUrl(5)
      ];
    }
    return Array.from({ length: 5 }, (_, i) => getShotUrl(i + 1));
  }, [product?.image, product?.images]);

  const minimaps = useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product?.image) {
      return [
        product.image,
        getMinimapUrl(2),
        getMinimapUrl(3),
        getMinimapUrl(4),
        getMinimapUrl(5)
      ];
    }
    return Array.from({ length: 5 }, (_, i) => getMinimapUrl(i + 1));
  }, [product?.image, product?.images]);

  // Mobile Snapshot Gallery State & Swipe Navigation
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const isSwipingRef = useRef(false);

  const wasSwipeRef = useRef(false);

  useEffect(() => {
    setActiveSnapshotIndex(0);
    activeMinimapRef.current = 0;
  }, [targetSlug, product?._id]);

  const goToSnapshot = (index) => {
    const total = snapshots.length;
    if (total === 0) return;
    const nextIdx = Math.max(0, Math.min(total - 1, index));
    const currentIdx = activeMinimapRef.current !== undefined ? activeMinimapRef.current : activeSnapshotIndex;
    if (nextIdx === currentIdx && activeSnapshotIndex === nextIdx) return;
    setActiveSnapshotIndex(nextIdx);

    const hero = heroRef.current;
    if (hero) {
      const snapshotEls = hero.querySelectorAll('.product-snapshot');
      const minimapEls = hero.querySelectorAll('.product-snapshot-minimap-img');

      gsap.killTweensOf(snapshotEls);
      gsap.killTweensOf(minimapEls);

      const duration = 0.55;
      const ease = 'power2.out';

      for (let i = 0; i <= nextIdx; i++) {
        gsap.to(snapshotEls[i], {
          y: '0%',
          scale: i === nextIdx ? 1 : 1.5,
          transformOrigin: 'center top',
          duration,
          ease,
          overwrite: 'auto',
        });
      }
      for (let i = nextIdx + 1; i < total; i++) {
        gsap.to(snapshotEls[i], {
          y: '100%',
          scale: 1,
          transformOrigin: 'center top',
          duration,
          ease,
          overwrite: 'auto',
        });
      }
      minimapEls.forEach((el, mIdx) => {
        gsap.to(el, {
          scale: mIdx === nextIdx ? 1.25 : 1,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
      activeMinimapRef.current = nextIdx;
    }

    // On desktop, synchronize ScrollTrigger position when thumbnail is clicked
    if (typeof window !== 'undefined' && window.innerWidth >= 1025) {
      const hero = heroRef.current;
      const st = ScrollTrigger.getAll().find((s) => s.trigger === hero);
      if (st) {
        const totalSteps = total - 1;
        const targetProgress = totalSteps > 0 ? nextIdx / totalSteps : 0;
        const targetScroll = st.start + targetProgress * (st.end - st.start);
        if (window.lenis) {
          window.lenis.scrollTo(targetScroll, { duration: 0.8 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  };

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = true;
    wasSwipeRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isSwipingRef.current || !e.touches || e.touches.length === 0) return;
    const moveX = e.touches[0].clientX - (touchStartXRef.current || 0);
    const moveY = e.touches[0].clientY - (touchStartYRef.current || 0);
    if (Math.abs(moveX) > 10 || Math.abs(moveY) > 10) {
      wasSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - (touchStartXRef.current || 0);
    const deltaY = endY - (touchStartYRef.current || 0);

    const currentIndex = activeMinimapRef.current !== undefined ? activeMinimapRef.current : activeSnapshotIndex;

    // Only switch if horizontal swipe exceeds 35px and dominates vertical movement
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe left -> next image
        if (currentIndex < snapshots.length - 1) {
          goToSnapshot(currentIndex + 1);
        }
      } else {
        // Swipe right -> prev image
        if (currentIndex > 0) {
          goToSnapshot(currentIndex - 1);
        }
      }
    }
  };

  // Fullscreen Image Lightbox Modal State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const lightboxDialogRef = useRef(null);

  const openLightbox = (index) => {
    if (wasSwipeRef.current) {
      wasSwipeRef.current = false;
      return;
    }
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  useEffect(() => {
    const dialog = lightboxDialogRef.current;
    if (!dialog) return;

    if (activeLightboxIndex !== null) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [activeLightboxIndex]);

  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev + 1) % snapshots.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, snapshots.length]);

  // GSAP MatchMedia: Desktop Pinned 5-Stage Scrub vs Mobile Swipe Gallery
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      }
      if (window.ScrollTrigger) {
        window.ScrollTrigger.update();
      }
    }

    const hero = heroRef.current;
    if (!hero) return;

    const snapshotEls = hero.querySelectorAll('.product-snapshot');
    const minimapEls = hero.querySelectorAll('.product-snapshot-minimap-img');
    const total = snapshotEls.length;

    if (!total) return;

    // Initial state: first slide visible at y:0, others at y:100%
    gsap.set(snapshotEls[0], { y: '0%', scale: 1, transformOrigin: 'center top' });
    if (minimapEls[0]) gsap.set(minimapEls[0], { scale: 1.25 });

    for (let i = 1; i < total; i++) {
      gsap.set(snapshotEls[i], { y: '100%', scale: 1, transformOrigin: 'center top' });
      if (minimapEls[i]) gsap.set(minimapEls[i], { scale: 1 });
    }

    const mm = gsap.matchMedia();

    // DESKTOP: (min-width: 1025px) -> Pre-compiled GSAP Timeline Scrub (Zero Jitter)
    mm.add('(min-width: 1025px)', () => {
      if (total <= 1) return;

      const scrubTl = gsap.timeline({ paused: true });

      for (let s = 1; s < total; s++) {
        const slideTime = (s - 1);
        scrubTl
          .to(snapshotEls[s], {
            y: '0%',
            ease: 'none',
            duration: 1,
            immediateRender: false,
          }, slideTime)
          .to(snapshotEls[s - 1], {
            scale: 1.5,
            transformOrigin: 'center top',
            ease: 'none',
            duration: 1,
            immediateRender: false,
          }, slideTime);
      }

      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: () => `+=${Math.max(window.innerHeight, hero.offsetHeight) * Math.max(0, total - 1)}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        animation: scrubTl,
        onUpdate: (self) => {
          const progress = self.progress;
          const currentStep = Math.min(
            total - 1,
            Math.floor(progress * (total - 1) + 0.49)
          );

          if (currentStep !== activeMinimapRef.current) {
            minimapEls.forEach((el, idx) => {
              if (idx === currentStep) {
                gsap.to(el, { scale: 1.25, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
              } else if (idx < currentStep) {
                gsap.to(el, { scale: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
              } else {
                gsap.to(el, { scale: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
              }
            });

            activeMinimapRef.current = currentStep;
            setActiveSnapshotIndex(currentStep);
          }
        },
      });
    });

    // MOBILE / TABLET: (max-width: 1024px) -> Clean swipe/tap mode, ZERO Pinning, ZERO ghost scroll
    mm.add('(max-width: 1024px)', () => {
      gsap.set(snapshotEls[0], { y: '0%', scale: 1 });
      for (let i = 1; i < total; i++) {
        gsap.set(snapshotEls[i], { y: '100%', scale: 1 });
      }
      minimapEls.forEach((el, idx) => {
        gsap.set(el, { scale: idx === 0 ? 1.25 : 1 });
      });
    });

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && hero) {
      resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(hero);
    }

    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    const refreshTimer1 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const refreshTimer2 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(refreshTimer1);
      clearTimeout(refreshTimer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      mm.revert();
    };
  }, [targetSlug, snapshots.length, product?._id, Boolean(product), isProductLoading]);

  const chromaColor =
    product?.colorHex ||
    (product?.color ? colorsMap[product.color] : null) ||
    (Array.isArray(product?.colors) && product.colors[0]) ||
    product?.color ||
    '#686868';

  // Base raw MRP
  const baseMRP =
    Number(product?.numericPrice) ||
    (typeof product?.price === 'number'
      ? product.price
      : parseFloat(String(product?.price || 0).replace(/[^0-9.]/g, '')) || 0);

  // Discount calculation
  const isDiscountActive = Boolean(product?.discountTagActive);
  const discPercent = Number(product?.discountPercentage) || 0;
  const discPrice = Number(product?.discountPrice) || 0;
  let effectiveUnitPrice = baseMRP;
  let hasItemDiscount = false;

  if (isDiscountActive && (discPercent > 0 || discPrice > 0 || product?.offerTag)) {
    if (discPrice > 0 && discPrice < baseMRP) {
      effectiveUnitPrice = discPrice;
      hasItemDiscount = true;
    } else if (discPercent > 0) {
      effectiveUnitPrice = Math.round(baseMRP * (1 - discPercent / 100));
      hasItemDiscount = true;
    }
  }

  const unitPrice = effectiveUnitPrice;

  const isBogoActive = Boolean(
    bogoConfig?.isEnabled &&
    product?.allowBogo !== false &&
    product?.disableBogo !== true
  );

  const isBundle = Boolean(
    isBogoActive &&
    selectedBogoTier &&
    selectedBogoTier.totalQty > 1
  );

  const bundlePaidPrice = isBundle ? unitPrice * (selectedBogoTier.buyQty || 1) : unitPrice;
  const bundleRawTotal = isBundle ? unitPrice * selectedBogoTier.totalQty : baseMRP;
  const bundleSavings = isBundle ? (bundleRawTotal - bundlePaidPrice) : 0;

  const handleAddToCartWithBogo = () => {
    addToCart({
      ...product,
      price: isBundle ? bundlePaidPrice : unitPrice,
      numericPrice: isBundle ? bundlePaidPrice : unitPrice,
      originalPrice: isBundle ? bundleRawTotal : baseMRP,
      discountTagActive: isDiscountActive,
      discountPercentage: isDiscountActive ? discPercent : 0,
      offerTag: isDiscountActive ? (product?.offerTag || `${discPercent}% OFF`) : '',
      bogoTier: isBundle ? selectedBogoTier : null,
      bundleTag: isBundle ? `${selectedBogoTier.name} • ${selectedBogoTier.totalQty} PIECES PACK` : null,
      bundleUnits: isBundle ? (selectedBogoTier?.totalQty || 1) : 1,
      bundleFreeUnits: isBundle ? (selectedBogoTier?.getQty || 0) : 0,
      garmentSizes: isBundle && garmentSizes.length > 0 ? garmentSizes : [selectedSize || 'M'],
      selectedSize: selectedSize || 'M',
      size: selectedSize || 'M',
      image_url: (product.images && product.images[0]) || product.image_url || product.image,
    }, selectedSize || 'M');
  };

  // Dynamic related products prioritizing live MongoDB catalogue
  const getRelatedProducts = (currentProd) => {
    const pool = mongoProducts.length > 0 ? mongoProducts : productsData;
    const currentName = currentProd?.name;
    const currentSlug = (
      currentProd?.slug ||
      currentProd?.name?.toLowerCase().replace(/\s+/g, '-') ||
      ''
    ).replace(/[^a-z0-9-]/g, '');

    const filtered = pool.filter((p) => {
      const pSlug = (p.slug || p.name?.toLowerCase().replace(/\s+/g, '-') || '').replace(/[^a-z0-9-]/g, '');
      const isOos = p.inStock === false || (typeof p.stock === 'number' && p.stock <= 0);
      return p.name !== currentName && pSlug !== currentSlug && !isOos;
    });

    return filtered.slice(0, 4).map((p, i) => ({
      ...p,
      price: p.numericPrice || p.price || 1200,
      image_url: (p.images && p.images[0]) || p.image_url || p.image || `/products/product_${i + 1}.png`,
      slug: p.slug || (p.name ? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : `product-${i + 1}`)
    }));
  };

  const related = getRelatedProducts(product);

  if (!product) {
    return <ProductDetailSkeleton />;
  }

  return (
    <div className={`page ${isPreview ? 'preview-mode' : ''}`} style={isPreview ? { paddingTop: '0.5rem' } : undefined}>
      {/* Top Breadcrumb */}
      {!isPreview && (
        <div className="pd-breadcrumb">
          <a
            href="/wardrobe"
            onClick={(e) => {
              e.preventDefault();
              navigate('/wardrobe');
            }}
          >
            ← Wardrobe
          </a>
          <span>/</span>
          <span>{product.name}</span>
        </div>
      )}

      {/* Product Hero Section with Pinned ScrollTrigger */}
      <section
        className="product-hero"
        ref={heroRef}
        style={{
          '--snapshot-count': snapshots.length,
          minHeight: '100svh',
          height: 'auto',
        }}
      >
        <div
          className="product-hero-col product-snapshots"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {snapshots.map((shot, idx) => {
            const isActive = idx === activeSnapshotIndex;
            return (
              <div
                className={`product-snapshot ${isActive ? 'active-slide' : ''}`}
                key={idx}
                data-slide-index={idx}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '100%',
                  transformOrigin: 'center top',
                  cursor: 'zoom-in',
                  zIndex: idx + 1,
                }}
                onClick={() => openLightbox(idx)}
                title="Click to view full image"
              >
                <img
                  src={shot}
                  alt={`${product.name} view ${idx + 1}`}
                  onLoad={() => {
                    if (typeof window !== 'undefined' && window.ScrollTrigger) {
                      window.ScrollTrigger.refresh();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                    cursor: 'zoom-in',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = getShotUrl(idx + 1);
                  }}
                />
              </div>
            );
          })}

          {/* Minimap thumbnails */}
          <div className="product-snapshot-minimap">
            {minimaps.map((mapImg, idx) => (
              <div
                key={idx}
                className={`product-snapshot-minimap-img ${idx === activeSnapshotIndex ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSnapshot(idx);
                }}
              >
                <img
                  src={mapImg}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = getMinimapUrl(idx + 1);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Meta Column */}
        <div className="product-hero-col product-meta" style={{ minHeight: '100svh', height: 'auto' }}>
          <div
            className="product-meta-container"
            style={{
              minHeight: '100svh',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingBottom: '4.5rem',
            }}
          >
            {/* 1. PRODUCT NAME & PRICE */}
            <div className="product-meta-header">
              <h3>{product.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h3>₹{bundlePaidPrice.toLocaleString('en-IN')}</h3>
                {isBundle && bundleSavings > 0 ? (
                  <span style={{ fontSize: '0.95rem', textDecoration: 'line-through', opacity: 0.45 }}>
                    ₹{bundleRawTotal.toLocaleString('en-IN')}
                  </span>
                ) : hasItemDiscount ? (
                  <span style={{ fontSize: '0.95rem', textDecoration: 'line-through', opacity: 0.45 }}>
                    ₹{baseMRP.toLocaleString('en-IN')}
                  </span>
                ) : null}
                {hasItemDiscount && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      padding: '4px 10px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    {product?.offerTag || `${discPercent}% OFF`}
                  </span>
                )}
              </div>
            </div>
            <div className="product-meta-header-divider"></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
              <p
                className="pd-tag"
                style={{
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '28px',
                  padding: '0 0.75rem',
                  boxSizing: 'border-box',
                  lineHeight: 1,
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {product.categories?.name || product.category || product.tag || 'Functionary'}
              </p>
              <a
                href="#product-reviews-section"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('product-reviews-section');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                style={{
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '28px',
                  padding: '0 0.75rem',
                  boxSizing: 'border-box',
                  lineHeight: 1,
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--base-500)',
                  background: 'var(--base-200)',
                  borderRadius: '999px',
                  border: '1px solid var(--base-300)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>CRITIQUES & REVIEWS</span>
              </a>
            </div>

            {/* 2. COLOR (CHROMA) */}
            <div className="product-color-container">
              <p className="md">Chroma</p>
              <div className="product-colors">
                <div className="product-color" title={product.color}>
                  <span style={{ backgroundColor: chromaColor }}></span>
                </div>
                <p className="md" style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                  {product.color}
                </p>
              </div>
            </div>

            {/* 3. SIZE (FORM SIZE) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="product-sizes-container">
                <p className="md">Form Size</p>
                <div className="product-sizes">
                  {product.sizes.map((size) => (
                    <p
                      key={size}
                      className={`md pd-size ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      [ {size} ]
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DESCRIPTION */}
            {(product.description || baseProduct?.description) && (
              <p className="bodyCopy pd-description">
                {product.description || baseProduct?.description}
              </p>
            )}

            {/* BOGO & BUNDLE TIERS CMS WIDGET */}
            {isBogoActive && (
              <BogoTierSelector
                product={{
                  name: product.name,
                  price: unitPrice,
                  numericPrice: unitPrice,
                  sizes: product.sizes,
                }}
                selectedTier={selectedBogoTier}
                onSelectTier={setSelectedBogoTier}
                garmentSizes={garmentSizes}
                onChangeGarmentSize={handleUpdateGarmentSize}
              />
            )}

            {/* Action Buttons */}
            <div className="product-meta-buttons" style={{ marginTop: 'auto', marginBottom: '2.5rem' }}>
              {product.allowAddToCart !== false && product.inStock !== false ? (
                <button
                  className="primary"
                  onClick={handleAddToCartWithBogo}
                >
                  Add To Bag{isBundle ? ` (${selectedBogoTier.totalQty} Pack)` : (selectedSize && selectedSize.length <= 4 ? ` — ${selectedSize}` : '')}
                </button>
              ) : (
                <button
                  className="secondary"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  {product.inStock === false ? 'Out of Stock' : 'Archived Form'}
                </button>
              )}
              <button
                className={`secondary ${isSaved ? 'is-saved' : ''}`}
                onClick={handleToggleSaveItem}
                style={isSaved ? {
                  backgroundColor: '#121212',
                  color: '#ffffff',
                  borderColor: '#121212',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                } : {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart
                  style={{
                    width: '15px',
                    height: '15px',
                    fill: isSaved ? '#ff3b30' : 'none',
                    stroke: isSaved ? '#ff3b30' : 'currentColor',
                    transition: 'all 0.2s ease',
                  }}
                />
                <span>{isSaved ? 'SAVED ✓' : 'SAVE ITEM'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      {product.showSpecifications !== false && (
        <section
          className="product-details specifications"
          style={{ position: 'relative', zIndex: 2, borderTop: '1px solid var(--base-200)' }}
        >
          <div className="product-col product-col-copy">
            <div className="product-col-copy-wrapper">
              <TextMotion type="slide">
                <h4>Specifications</h4>
              </TextMotion>
              <TextMotion type="slide" delay={0.2}>
                <p className="bodyCopy lg">
                  {product.specifications ||
                    product.description ||
                    'Crafted from a midweight brushed cotton blend, this piece offers a soft yet structured feel with a natural drape. Designed for all-season versatility, it balances comfort with clean utility details throughout the silhouette.'}
                </p>
              </TextMotion>
            </div>
          </div>
          <div className="product-col product-col-img">
            <img
              src={normalizeImageUrl(product.specificationsImage) || snapshots[2]}
              alt={`${product.name} Specifications`}
              referrerPolicy="no-referrer"
              onError={handleImageFallbackError}
            />
          </div>
        </section>
      )}

      {/* Shipping Details Section */}
      {product.showShippingTerms !== false && (
        <section className="product-details shipping-details">
          <div className="product-col product-col-img">
            <img
              src={normalizeImageUrl(product.shippingTermsImage) || snapshots[3]}
              alt={`${product.name} Shipping Details`}
              referrerPolicy="no-referrer"
              onError={handleImageFallbackError}
            />
          </div>
          <div className="product-col product-col-copy">
            <div
              className="product-col-copy-wrapper"
              style={{
                justifyContent: 'center',
              }}
            >
              <TextMotion type="slide">
                <h4 style={{ marginBottom: '1.25rem' }}>Shipping Terms</h4>
              </TextMotion>
              <TextMotion type="slide" delay={0.2}>
                <div>
                  {product.shippingTerms ? (
                    product.shippingTerms.split(/\n\s*\n/).map((para, pIdx) => (
                      <p key={pIdx} className="bodyCopy lg" style={pIdx > 0 ? { marginTop: '1.5rem' } : undefined}>
                        {para.trim()}
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="bodyCopy lg">
                        All orders are processed within 5 business days and shipped via tracked courier service. Estimated delivery times vary by region, but most domestic shipments arrive within 7 business days. You’ll receive a tracking link once your order is dispatched.
                      </p>
                      <p className="bodyCopy lg" style={{ marginTop: '1.5rem' }}>
                        We accept returns on unworn items within 14 days of delivery. To initiate a return, please contact our support team with your order number. Refunds are issued to the original payment method once the item is received and inspected.
                      </p>
                    </>
                  )}
                </div>
              </TextMotion>
            </div>
          </div>
        </section>
      )}

      {/* Verified Client Critiques & Product Reviews Section */}
      {product.showReviews !== false && (
        <ProductReviewsSection
          productId={product._id || product.id || targetSlug}
          productName={product.name}
          productImage={snapshots[0] || product.image_url}
          productSlug={targetSlug}
        />
      )}

      {/* Related Products / Parallel Forms Section */}
      {product.showParallelForms !== false && related.length > 0 && (
        <section className="related-products">
          <div className="container">
            <div className="related-products-header">
              <TextMotion type="slide">
                <h3>Parallel Forms</h3>
              </TextMotion>
            </div>
            <div className="related-products-container">
              <div className="container">
                {related.map((prod, idx) => {
                  const slug =
                    prod.slug ||
                    prod.name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                  const imgUrl = (prod.images && prod.images[0]) || prod.image_url || prod.image || `/products/product_${prod.local_index || idx + 1}.png`;
                  const price = prod.price || prod.numericPrice || 1200;

                  return (
                    <ProductCard
                      key={prod._id || prod.name || idx}
                      id={prod._id || prod.id}
                      name={prod.name}
                      price={price}
                      imageUrl={imgUrl}
                      slug={slug}
                      className="h-full"
                      product={prod}
                      discountTagActive={prod.discountTagActive}
                      discountPercentage={prod.discountPercentage}
                      discountPrice={prod.discountPrice}
                      offerTag={prod.offerTag}
                      originalPrice={prod.numericPrice || prod.price}
                      onNavigate={(path) => {
                        navigate(path);
                        window.scrollTo(0, 0);
                      }}
                      onAddToCart={(cartPayload) =>
                        addToCart(
                          cartPayload || {
                            ...prod,
                            price,
                            image_url: imgUrl,
                            slug,
                          }
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Contact Form & Footer (Hidden in live preview / iframe studio mode) */}
      {!isPreview && <ContactForm />}
      {!isPreview && <Footer navigate={navigate} />}

      {/* Fullscreen Image Lightbox Modal */}
      <dialog
        ref={lightboxDialogRef}
        className="product-lightbox-dialog"
        closedby="any"
        aria-label="Product Image Fullscreen Lightbox"
        onClick={(e) => {
          if (e.target === lightboxDialogRef.current) {
            closeLightbox();
          }
        }}
        onCancel={(e) => {
          e.preventDefault();
          closeLightbox();
        }}
      >
        {activeLightboxIndex !== null && (
          <div className="lightbox-content">
            {/* Top Bar with Counter and Close Button */}
            <div className="lightbox-top-bar">
              <span className="lightbox-counter">
                {String(activeLightboxIndex + 1).padStart(2, '0')} / {String(snapshots.length).padStart(2, '0')} • {product.name}
              </span>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={closeLightbox}
                aria-label="Close fullscreen view"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Main Full Image View with Prev/Next Navigation */}
            <div className="lightbox-image-wrap">
              {snapshots.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLightboxIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} strokeWidth={2} />
                </button>
              )}

              <img
                key={activeLightboxIndex}
                src={snapshots[activeLightboxIndex]}
                alt={`${product.name} view ${activeLightboxIndex + 1}`}
                className="lightbox-full-img"
                onError={(e) => {
                  e.currentTarget.src = getShotUrl(activeLightboxIndex + 1);
                }}
              />

              {snapshots.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLightboxIndex((prev) => (prev + 1) % snapshots.length);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={22} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Bottom Minimap Thumbnails Strip */}
            {snapshots.length > 1 && (
              <div className="lightbox-thumbs-container">
                <div className="lightbox-thumbs-strip">
                  {snapshots.map((thumb, tIdx) => {
                    const isActive = tIdx === activeLightboxIndex;
                    return (
                      <button
                        key={tIdx}
                        type="button"
                        className={`lightbox-thumb-item ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLightboxIndex(tIdx);
                        }}
                        aria-label={`View image ${tIdx + 1}`}
                      >
                        <img
                          src={thumb}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = getMinimapUrl(tIdx + 1);
                          }}
                        />
                        <span className="lightbox-thumb-badge">
                          {String(tIdx + 1).padStart(2, '0')}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="lightbox-thumbs-caption">
                  FRAME {String(activeLightboxIndex + 1).padStart(2, '0')} OF {String(snapshots.length).padStart(2, '0')} • ATELIER SILHOUETTE
                </div>
              </div>
            )}
          </div>
        )}
      </dialog>

      {/* Wishlist Floating Toast Feedback */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1.5rem',
            zIndex: 9999,
            backgroundColor: '#121212',
            color: '#ffffff',
            padding: '0.75rem 1.1rem',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.78rem',
            maxWidth: 'calc(100vw - 3rem)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}
          >
            <Heart
              style={{
                width: '14px',
                height: '14px',
                fill: isSaved ? '#ff3b30' : 'none',
                stroke: isSaved ? '#ff3b30' : '#888',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
              {saveToast.title}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#a0a0a0',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {saveToast.description}
            </div>
          </div>
          {saveToast.action && (
            <button
              onClick={() => {
                saveToast.action.onClick();
                setSaveToast(null);
              }}
              style={{
                marginLeft: '0.25rem',
                padding: '0.35rem 0.65rem',
                backgroundColor: '#ffffff',
                color: '#121212',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                border: 'none',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {saveToast.action.label}
            </button>
          )}
          <button
            onClick={() => setSaveToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            aria-label="Close notification"
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UnitPage;


