'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import { useGetProductsQuery } from '../redux/api/productApi';
import productsData from '../data/products.json';
import { audioSystem } from '../components/drapza/AudioSystem';
import {
  X,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Eye,
  Heart,
  Ruler,
  Palette,
  Tag,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Box,
} from 'lucide-react';

export const LookbookPage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const { addToCart, setIsCartOpen } = useCart() || {};
  const { data: apiData } = useGetProductsQuery();

  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const onProductClickRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('FREE SIZE (5.5M + 0.8M)');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [viewMode, setViewMode] = useState('stream'); // 'stream' (3D Orb) | 'matrix' (2D Grid)
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [clickOrigin, setClickOrigin] = useState({ x: '50vw', y: '50vh' });
  const [isClosing, setIsClosing] = useState(false);

  const sourceProducts = useMemo(() => {
    const raw = apiData?.products && apiData.products.length > 0 ? apiData.products : productsData;
    const available = raw.filter(
      (prod) => prod.inStock !== false && (typeof prod.stock !== 'number' || prod.stock > 0)
    );
    return available.length > 0 ? available : raw;
  }, [apiData]);

  // Construct 20 campaign silhouettes with rich product details
  const campaignItems = useMemo(() => {
    return Array.from({ length: 20 }, (_, idx) => {
      const imgIdx = idx + 1;
      const baseProduct = sourceProducts[idx % sourceProducts.length] || productsData[idx % productsData.length] || {};
      const fallbackPrice = 1450 + (idx % 6) * 180;
      const priceVal = baseProduct.price ? String(baseProduct.price) : String(fallbackPrice);
      const originalPriceVal = baseProduct.originalPrice
        ? String(baseProduct.originalPrice)
        : String(Math.round(Number(priceVal) * 1.25));

      const defaultGallery = [
        imgIdx === 17 ? '/product/product_shot_01.jpg' : `/lookbook/orb_img_${imgIdx}.jpg`,
        '/product/product_shot_04.jpg',
        '/product/product_shot_03.jpg',
        '/product/product_shot_05.jpg',
      ];

      // Exact reference model configuration for Silhouette 17 (Matching Target Screenshot 2)
      if (imgIdx === 17) {
        return {
          id: 'lookbook-item-17',
          slug: 'banarasi-katan-silk-saree',
          name: 'BANARASI KATAN SILK SAREE',
          price: '2170',
          originalPrice: '2713',
          color: 'BLACK',
          tag: 'DEFORM',
          fit: 'MODULAR BOXY',
          description:
            'Opulent Banarasi Katan Silk Saree woven with antique gold kadwa zari work across the body and a heavy brocade heritage pallu, select size.',
          sizes: ['FREE SIZE (5.5M + 0.8M)', 'S (CHEST 38")', 'M (CHEST 40")', 'L (CHEST 42")', 'XL (CHEST 44")'],
          image: '/product/product_shot_01.jpg',
          gallery: [
            '/product/product_shot_01.jpg',
            '/product/product_shot_04.jpg',
            '/product/product_shot_03.jpg',
            '/product/product_shot_05.jpg',
          ],
          lookbookIndex: 17,
        };
      }

      return {
        ...baseProduct,
        id: baseProduct._id || baseProduct.id || `lookbook-item-${imgIdx}`,
        slug: baseProduct.slug || baseProduct.name?.toLowerCase().replace(/\s+/g, '-') || `unit-${imgIdx}`,
        name: (baseProduct.name || `LOOKBOOK SILHOUETTE 0${imgIdx}`).toUpperCase(),
        price: priceVal,
        originalPrice: originalPriceVal,
        color: (baseProduct.color || ['BLACK', 'RAW STONE', 'NEUTRAL GREY', 'ARCTIC ICE', 'BONE WHITE'][idx % 5]).toUpperCase(),
        tag: (baseProduct.tag || ['DEFORM', 'SHEERFORM', 'FUNCTIONARY', 'ARCHIVAL'][idx % 4]).toUpperCase(),
        fit: 'MODULAR BOXY',
        description:
          baseProduct.description ||
          'Opulent Banarasi Katan Silk Saree woven with antique gold kadwa zari work across the body and a heavy brocade heritage pallu, select size.',
        sizes:
          Array.isArray(baseProduct.sizes) && baseProduct.sizes.length > 0
            ? baseProduct.sizes
            : ['FREE SIZE (5.5M + 0.8M)', 'S (CHEST 38")', 'M (CHEST 40")', 'L (CHEST 42")', 'XL (CHEST 44")'],
        image: `/lookbook/orb_img_${imgIdx}.jpg`,
        gallery: defaultGallery,
        lookbookIndex: imgIdx,
      };
    });
  }, [sourceProducts]);

  // Handle product selection (MacBook Open App zoom from origin)
  const handleSelectProduct = (product, origin) => {
    try {
      if (audioSystem && typeof audioSystem.playClick === 'function') {
        audioSystem.playClick(950, 0.03);
      }
    } catch (e) {}

    if (origin && typeof origin.x === 'number' && typeof origin.y === 'number') {
      setClickOrigin({ x: `${origin.x}px`, y: `${origin.y}px` });
    } else {
      setClickOrigin({ x: '50vw', y: '50vh' });
    }
    setIsClosing(false);
    setSelectedProduct(product);
    setActiveImageIndex(0);
    const initialSize = Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes[0]
      : 'FREE SIZE (5.5M + 0.8M)';
    setSelectedSize(initialSize);
    setQuantity(1);
    setIsAdded(false);
    setIsSizeDropdownOpen(false);
    setIsCouponOpen(false);
    setCouponInput('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Graceful MacBook App Close dismissal
  const handleCloseModal = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setIsClosing(false);
    }, 280);
  };

  useEffect(() => {
    onProductClickRef.current = handleSelectProduct;
  }, [campaignItems]);

  // Disable controls when modal is open
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !selectedProduct && viewMode === 'stream';
    }
  }, [selectedProduct, viewMode]);

  // Close modal on Escape with MacBook dismiss animation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && selectedProduct && !isClosing) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProduct, isClosing]);

  // Three.js Interactive 3D Sphere Orb
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let isMounted = true;
    let animId = null;

    // Scene setup
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    group.position.y = -0.3;
    scene.add(group);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 1.2;
    controls.minDistance = 6;
    controls.maxDistance = 10;
    controls.enableZoom = true;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Rounded corner alpha mask texture
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 256;
    maskCanvas.height = 256;
    const ctx = maskCanvas.getContext('2d');
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(maskCanvas.width - r, 0);
    ctx.quadraticCurveTo(maskCanvas.width, 0, maskCanvas.width, r);
    ctx.lineTo(maskCanvas.width, maskCanvas.height - r);
    ctx.quadraticCurveTo(maskCanvas.width, maskCanvas.height, maskCanvas.width - r, maskCanvas.height);
    ctx.lineTo(r, maskCanvas.height);
    ctx.quadraticCurveTo(0, maskCanvas.height, 0, maskCanvas.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();

    const alphaMap = new THREE.CanvasTexture(maskCanvas);
    const textureLoader = new THREE.TextureLoader();

    const items = [];
    const totalItems = 60;
    const sphereRadius = 5;
    const baseW = 1.0;
    const baseH = 0.6;

    const createMesh = (theta, phi, index) => {
      const imgIdx = (index % 20) + 1;
      const associatedProduct = campaignItems[(imgIdx - 1) % campaignItems.length] || {
        name: `Lookbook Silhouette 0${imgIdx}`,
        price: '1620',
        image: `/lookbook/orb_img_${imgIdx}.jpg`,
        sizes: ['S', 'M', 'L', 'XL'],
      };

      textureLoader.load(
        `/lookbook/orb_img_${imgIdx}.jpg`,
        (texture) => {
          if (!isMounted) return;
          const aspect = texture.image.width / texture.image.height;
          let w = baseW;
          let h = baseH;
          if (aspect > 1) {
            h = w / aspect;
          } else {
            w = h * aspect;
          }

          const geometry = new THREE.PlaneGeometry(w, h);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            alphaMap: alphaMap,
            depthWrite: true,
            depthTest: true,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = sphereRadius * Math.cos(phi) * Math.sin(theta);
          mesh.position.y = sphereRadius * Math.sin(phi) * Math.sin(theta);
          mesh.position.z = sphereRadius * Math.cos(theta);
          mesh.lookAt(0, 0, 0);
          mesh.rotateY(Math.PI);

          // Attach product metadata for raycaster click handling
          mesh.userData = { product: associatedProduct, index };

          group.add(mesh);
          items.push({ mesh, geometry, material, texture });
        }
      );
    };

    for (let i = 0; i < totalItems; i++) {
      const theta = Math.acos(-1 + (2 * i) / totalItems);
      const phi = Math.sqrt(totalItems * Math.PI) * theta;
      createMesh(theta, phi, i);
    }

    // Raycaster for clicking product cards in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    const onPointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = performance.now();
    };

    const onPointerUp = (e) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - pointerDownTime;

      // Click threshold: moved less than 8px and released within 400ms (not a drag orbit)
      if (dist < 8 && dt < 400) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const meshes = items.map((it) => it.mesh);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.product && onProductClickRef.current) {
            onProductClickRef.current(hit.userData.product, { x: e.clientX, y: e.clientY });
          }
        }
      }
    };

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = items.map((it) => it.mesh);
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const animate = () => {
      if (!isMounted) return;
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.001; // gentle continuous ambient drift
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!isMounted) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
      }
      items.forEach(({ mesh, geometry, material, texture }) => {
        mesh.parent && mesh.parent.remove(mesh);
        geometry.dispose();
        material.dispose();
        texture.dispose();
      });
      alphaMap.dispose();
      controls.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [campaignItems]);

  // Handle Add To Bag
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const basePrice = Number(selectedProduct.price || 2170);
    const discountMultiplier = appliedCoupon ? appliedCoupon.discountPercent / 100 : 0;
    const unitDiscount = Math.round(basePrice * discountMultiplier);
    const finalPrice = basePrice - unitDiscount;

    const productToAdd = {
      ...selectedProduct,
      price: String(finalPrice),
      numericPrice: finalPrice,
      quantityToAdd: quantity,
      selectedSize,
    };
    if (addToCart) {
      addToCart(productToAdd, selectedSize);
    }
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      if (setIsCartOpen) {
        setIsCartOpen(true);
      }
    }, 500);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'DRAPZA10' || code === 'WELCOME' || code === 'DISCOUNT10') {
      setAppliedCoupon({ code, discountPercent: 10 });
    } else if (code === 'ATELIER15' || code === 'SPECIAL15') {
      setAppliedCoupon({ code, discountPercent: 15 });
    } else if (code === 'DRAPZA20') {
      setAppliedCoupon({ code, discountPercent: 20 });
    } else {
      setCouponError('Invalid coupon code. Try DRAPZA10');
    }
  };

  const displayGallery = useMemo(() => {
    if (!selectedProduct) return [];
    if (Array.isArray(selectedProduct.gallery) && selectedProduct.gallery.length >= 4) {
      return selectedProduct.gallery;
    }
    return [
      selectedProduct.image || '/product/product_shot_01.jpg',
      '/product/product_shot_04.jpg',
      '/product/product_shot_03.jpg',
      '/product/product_shot_05.jpg',
    ];
  }, [selectedProduct]);

  const availableSizes = selectedProduct?.sizes && selectedProduct.sizes.length > 0
    ? selectedProduct.sizes
    : ['FREE SIZE (5.5M + 0.8M)', 'S (CHEST 38")', 'M (CHEST 40")', 'L (CHEST 42")', 'XL (CHEST 44")'];

  const basePrice = Number(selectedProduct?.price || 2170);
  const discountMultiplier = appliedCoupon ? appliedCoupon.discountPercent / 100 : 0;
  const unitDiscount = Math.round(basePrice * discountMultiplier);
  const currentPrice = basePrice - unitDiscount;

  return (
    <div className="page" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <section className="lookbook" style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* 3D Sphere Orb Canvas */}
        <div
          ref={mountRef}
          className="orb"
          style={{
            width: '100%',
            height: '100%',
            opacity: viewMode === 'stream' ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
            pointerEvents: viewMode === 'stream' ? 'auto' : 'none',
          }}
        />

        {/* 2D Archival Matrix Grid Mode */}
        {viewMode === 'matrix' && (
          <div
            className="absolute inset-0 z-10 overflow-y-auto px-4 md:px-12 pt-24 pb-28 backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(12, 14, 12, 0.92)' }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10">
                <div>
                  <p className="text-[11px] font-mono tracking-[0.2em] text-neutral-400 uppercase mb-1">
                    [ ARCHIVAL MATRIX • 20 SILHOUETTES ]
                  </p>
                  <h2
                    className="text-3xl md:text-5xl font-koulen tracking-tight text-white uppercase"
                    style={{ fontFamily: "var(--font-koulen), 'Koulen', sans-serif" }}
                  >
                    CAMPAIGN CATALOGUE
                  </h2>
                </div>
                <p className="text-xs font-mono text-neutral-400 mt-2 md:mt-0">
                  CLICK ANY SILHOUETTE TO VIEW DETAILS & ADD TO BAG
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {campaignItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSelectProduct(item, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                      });
                    }}
                    className="group relative cursor-pointer bg-[#141614] rounded-xl overflow-hidden border border-white/10 hover:border-white/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-neutral-900">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 text-[9px] font-mono px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white/90 uppercase tracking-wider border border-white/10">
                        № {idx + 1}
                      </span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-mono font-medium flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Eye className="w-3.5 h-3.5" /> INSPECT
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#111311]">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1 truncate">
                        {item.tag} // {item.color}
                      </p>
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-neutral-200">
                        {item.name}
                      </h3>
                      <p className="text-xs font-mono text-neutral-300 font-semibold mt-1">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section Footer: Toggles between 3D Orb and 2D Matrix */}
        <div className="section-footer" style={{ zIndex: 25 }}>
          <p
            onClick={() => setViewMode('stream')}
            style={{
              cursor: 'pointer',
              opacity: viewMode === 'stream' ? 1 : 0.45,
              fontWeight: viewMode === 'stream' ? '600' : 'normal',
              textDecoration: viewMode === 'stream' ? 'underline' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            [ Look Stream ]
          </p>
          <p
            onClick={() => setViewMode('matrix')}
            style={{
              cursor: 'pointer',
              opacity: viewMode === 'matrix' ? 1 : 0.45,
              fontWeight: viewMode === 'matrix' ? '600' : 'normal',
              textDecoration: viewMode === 'matrix' ? 'underline' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            [ View Matrix ]
          </p>
        </div>
      </section>

      {/* Product Details & Add to Bag Popup Modal (MacBook App Open Style) */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className={`lookbook-quickview-backdrop ${isClosing ? 'is-closing' : ''}`}
          style={{
            '--origin-x': clickOrigin.x,
            '--origin-y': clickOrigin.y,
          }}
          onClick={handleCloseModal}
        >
          <div
            className={`lookbook-quickview-card ${isClosing ? 'is-closing' : ''}`}
            style={{
              '--origin-x': clickOrigin.x,
              '--origin-y': clickOrigin.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS Window Top Titlebar Header with Traffic Lights */}
            <div className="lq-mac-titlebar">
              <div className="lq-mac-traffic-lights">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="lq-mac-dot lq-mac-dot-close"
                  aria-label="Close Window"
                  title="Close (Esc)"
                >
                  <span className="lq-mac-dot-icon">✕</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="lq-mac-dot lq-mac-dot-minimize"
                  aria-label="Minimize Window"
                  title="Minimize"
                >
                  <span className="lq-mac-dot-icon">–</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    navigate(selectedProduct.slug ? `/product/${selectedProduct.slug}` : '/wardrobe');
                  }}
                  className="lq-mac-dot lq-mac-dot-zoom"
                  aria-label="Expand Product"
                  title="Inspect Full Specifications"
                >
                  <span className="lq-mac-dot-icon">⤢</span>
                </button>
              </div>

              <div className="lq-mac-title">
                <span className="lq-mac-app-icon">⌘</span>
                <span className="lq-mac-title-text">{selectedProduct.name}</span>
                <span className="lq-mac-version-pill">
                  SILHOUETTE № {selectedProduct.lookbookIndex || 17}
                </span>
              </div>

              <div className="lq-mac-actions">
                <span className="lq-mac-esc-badge">ESC</span>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="lq-mac-close-btn"
                  aria-label="Close modal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="lq-modal-body">
              {/* Left Column: Vertical Thumbnails Strip + Main Image Preview */}
              <div className="lq-preview-wrap">
              {/* 4 Vertical Thumbnails Strip */}
              <div className="lq-thumbs-col">
                {displayGallery.slice(0, 4).map((imgSrc, idx) => {
                  const isSelected = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`lq-thumb-btn ${isSelected ? 'is-active' : ''}`}
                    >
                      <img
                        src={imgSrc}
                        alt={`Thumbnail ${idx + 1}`}
                      />
                    </button>
                  );
                })}

                {/* Down Arrow Button */}
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % Math.min(4, displayGallery.length))}
                  className="lq-thumb-arrow-btn"
                  aria-label="Next thumbnail"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Main Image Container */}
              <div className="lq-main-img-wrap">
                <img
                  key={activeImageIndex}
                  src={displayGallery[activeImageIndex] || selectedProduct.image}
                  alt={selectedProduct.name}
                />

                {/* Top-Left Pill Badge: DEFORM */}
                <div className="lq-badge-brand">
                  {selectedProduct.tag || 'DEFORM'}
                </div>

                {/* Top-Right Heart Wishlist Button */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted((prev) => !prev)}
                  className="lq-wishlist-btn"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>

                {/* Bottom-Right Pill Badge: STILHOUETTE № 17 */}
                <div className="lq-badge-silhouette">
                  STILHOUETTE № {selectedProduct.lookbookIndex || 17}
                </div>
              </div>
            </div>

            {/* Right Column: Product Info & Interactive Controls */}
            <div className="lq-info-col">
              <div>
                {/* NEW ARRIVAL Badge */}
                <div className="lq-badge-new">
                  NEW ARRIVAL
                </div>

                {/* Product Title */}
                <h2 className="lq-product-title" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800 }}>
                  {selectedProduct.name}
                </h2>

                {/* Price & Stock Row */}
                <div className="lq-price-stock-row">
                  <span className="lq-current-price">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="lq-original-price">
                      ₹{Number(selectedProduct.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="lq-stock-badge">
                    <span className="lq-stock-dot" /> IN STOCK
                  </span>
                </div>

                {/* 3 Attributes Row: COLOR, TAG, FIT */}
                <div className="lq-specs-strip">
                  <div className="lq-spec-item">
                    <Palette className="lq-spec-icon" />
                    <span className="lq-spec-label">COLOR:</span>
                    <span className="lq-spec-value">{selectedProduct.color || 'BLACK'}</span>
                  </div>
                  <div className="lq-spec-item">
                    <Tag className="lq-spec-icon" />
                    <span className="lq-spec-label">TAG:</span>
                    <span className="lq-spec-value">{selectedProduct.tag || 'DEFORM'}</span>
                  </div>
                  <div className="lq-spec-item">
                    <LayoutGrid className="lq-spec-icon" />
                    <span className="lq-spec-label">FIT:</span>
                    <span className="lq-spec-value">{selectedProduct.fit || 'MODULAR BOXY'}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="lq-description">
                  {selectedProduct.description}
                </p>

                {/* Size Selector */}
                <div className="relative mb-3">
                  <div className="lq-size-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                    <span className="lq-size-title" style={{ color: '#ffffff', display: 'inline-block', lineHeight: 1.2 }}>SELECT SIZE</span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="lq-size-guide-btn"
                      style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Ruler className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                      <span style={{ color: '#9ca3af', lineHeight: 1.2 }}>SIZE GUIDE</span>
                      <ChevronRight className="w-3 h-3" style={{ color: '#9ca3af' }} />
                    </button>
                  </div>

                  <div className="lq-size-dropdown-box" style={{ width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                      className="lq-size-select-btn"
                      style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '12px' }}>{selectedSize}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#9ca3af' }} />
                    </button>

                    {isSizeDropdownOpen && (
                      <div className="lq-size-dropdown-menu">
                        {availableSizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setSelectedSize(sz);
                              setIsSizeDropdownOpen(false);
                            }}
                            className={`lq-size-menu-item ${selectedSize === sz ? 'is-selected' : ''}`}
                          >
                            <span style={{ color: selectedSize === sz ? '#ffffff' : '#d1d5db', fontWeight: selectedSize === sz ? 800 : 500 }}>{sz}</span>
                            {selectedSize === sz && <Check className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Row */}
                <div className="lq-qty-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 14px 0' }}>
                  <span className="lq-qty-label" style={{ color: '#ffffff' }}>
                    QUANTITY
                  </span>
                  <div className="lq-qty-pill">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="lq-qty-btn"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                    </button>
                    <span className="lq-qty-val" style={{ color: '#ffffff', fontWeight: 700 }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="lq-qty-btn"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                {/* Full-width White Pill Button: ADD TO BAG */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  className="lq-btn-add"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" style={{ color: '#000000' }} />
                      <span style={{ color: '#000000', fontWeight: 800 }}>ADDED TO BAG</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" style={{ color: '#000000' }} />
                      <span style={{ color: '#000000', fontWeight: 800 }}>ADD TO BAG • ₹{(currentPrice * quantity).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>

                {/* Full-width Dark Pill Button: APPLY COUPON CODE */}
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(!isCouponOpen)}
                  className="lq-btn-coupon"
                  style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div className="lq-coupon-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag className="lq-coupon-icon" style={{ color: '#9ca3af' }} />
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>{appliedCoupon ? `COUPON: ${appliedCoupon.code} (${appliedCoupon.discountPercent}% OFF)` : 'APPLY COUPON CODE'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCouponOpen ? 'rotate-180' : ''}`} style={{ color: '#9ca3af' }} />
                </button>

                {/* Collapsible Coupon Input Drawer (Luxury Pill Design) */}
                {isCouponOpen && (
                  <div style={{ marginBottom: '8px' }}>
                    <div className="lq-coupon-drawer" style={{ display: 'flex', alignItems: 'center', background: '#121518', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '9999px', padding: '4px 6px 4px 16px', height: '42px', gap: '8px', boxSizing: 'border-box' }}>
                      <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b949e' }} />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE (E.G. DRAPZA10)"
                        className="lq-coupon-input"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="lq-coupon-apply-btn"
                        style={{ height: '32px', padding: '0 16px', borderRadius: '9999px', background: '#ffffff', color: '#000000', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <span style={{ color: '#000000', fontWeight: 800 }}>APPLY</span>
                      </button>
                    </div>
                    {couponError && (
                      <p className="lq-coupon-feedback is-error" style={{ color: '#f87171', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', margin: '4px 0 4px 14px' }}>
                        ✕ {couponError}
                      </p>
                    )}
                    {appliedCoupon && (
                      <div className="lq-coupon-feedback is-success" style={{ color: '#34d399', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', margin: '4px 0 4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>✓ {appliedCoupon.discountPercent}% OFF APPLIED (-₹{(Math.round(Number(selectedProduct.price) * (appliedCoupon.discountPercent / 100)) * quantity).toLocaleString('en-IN')})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponInput('');
                          }}
                          style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '0 6px' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Centered Link: INSPECT FULL UNIT SPECIFICATIONS */}
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    navigate(selectedProduct.slug ? `/product/${selectedProduct.slug}` : '/wardrobe');
                  }}
                  className="lq-link-specs"
                  style={{ color: '#9ca3af', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 0', marginTop: '2px' }}
                >
                  <Box className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                  <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '11px' }}>INSPECT FULL UNIT SPECIFICATIONS</span>
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                </button>
              </div>
            </div>
            {/* Closes lq-modal-body */}
            </div>
          </div>
        </div>
      )}

      {/* Sizing Specifications Modal Guide */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-[#0f1214] border border-white/20 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">SIZE SPECIFICATIONS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-neutral-400 font-bold mb-1.5 uppercase">FREE SIZE (SAREE / DRAPE)</h4>
                <div className="bg-black/50 p-3 rounded-lg border border-white/10 space-y-1">
                  <p className="flex justify-between"><span>Saree Length:</span><strong className="text-white">5.5 Meters</strong></p>
                  <p className="flex justify-between"><span>Blouse Piece:</span><strong className="text-white">0.8 Meters</strong></p>
                  <p className="flex justify-between"><span>Width:</span><strong className="text-white">44 Inches</strong></p>
                </div>
              </div>

              <div>
                <h4 className="text-neutral-400 font-bold mb-1.5 uppercase">APPAREL FIT MATRIX (INCHES)</h4>
                <div className="bg-black/50 p-3 rounded-lg border border-white/10 space-y-1">
                  <p className="flex justify-between"><span>S (Small):</span><strong className="text-white">Chest 38&quot; | Length 28&quot;</strong></p>
                  <p className="flex justify-between"><span>M (Medium):</span><strong className="text-white">Chest 40&quot; | Length 29&quot;</strong></p>
                  <p className="flex justify-between"><span>L (Large):</span><strong className="text-white">Chest 42&quot; | Length 30&quot;</strong></p>
                  <p className="flex justify-between"><span>XL (Extra Large):</span><strong className="text-white">Chest 44&quot; | Length 31&quot;</strong></p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LookbookPage;
