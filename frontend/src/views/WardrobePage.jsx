'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X, ArrowUpDown, Check, RotateCcw, Camera } from 'lucide-react';
import { usePageTransition } from '../components/PageTransition';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { useCart } from '../context/CartContext';
import productsData from '../data/products.json';
import { useGetProductsQuery } from '../redux/api/productApi';
import {
  WardrobeFilterSidebar,
  DEFAULT_FILTER_VALUES,
} from '../components/drapza/WardrobeFilterSidebar';
import { Reveal } from '../components/drapza/Reveal';
import { searchTelemetryApi, filterConfigApi } from '../lib/api';
import { ProductGridSkeleton, ImageWithSkeleton } from '../components/drapza/skeletons';
import { ProductCard } from '../components/drapza/ProductCard';

const CATEGORIES = [
  'All',
  'Kurti',
  'Saree',
  'Jeans',
  'Palazzo/Bottom',
  'Leggings',
  'Tops',
  'Dupatta',
  'Co-ord Set',
  'Panties',
  'Bra',
  'Sharara/Lehenga'
];

export const WardrobePage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));

  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedColor, setSelectedColor] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Advanced Sidebar Filters State
  const [filters, setFilters] = useState(DEFAULT_FILTER_VALUES);

  // Dynamic Wardrobe Filter Config from Admin CMS (initialized to null to match server SSR)
  const [filterConfig, setFilterConfig] = useState(null);

  useEffect(() => {
    // Read cached admin filter options post-hydration to avoid SSR mismatch
    try {
      const cached = localStorage.getItem('drapza_wardrobe_filter_options');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setFilterConfig(parsed);
        }
      }
    } catch (e) {}

    let isMounted = true;
    filterConfigApi
      .getFilterConfig()
      .then((res) => {
        if (isMounted && res?.success && res?.data) {
          setFilterConfig(res.data);
          try {
            localStorage.setItem('drapza_wardrobe_filter_options', JSON.stringify(res.data));
          } catch (e) {}
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const dynamicCategories = useMemo(() => {
    if (filterConfig?.categories && Array.isArray(filterConfig.categories) && filterConfig.categories.length > 0) {
      return ['All', ...filterConfig.categories];
    }
    return CATEGORIES;
  }, [filterConfig]);

  // Sync category from URL parameter on load/change
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        if (catParam) {
          const pLow = catParam.trim().toLowerCase();
          const found = dynamicCategories.find((c) => {
            const cLow = c.toLowerCase();
            return (
              cLow === pLow ||
              (cLow.includes('sharara') && (pLow.includes('shar') || pLow.includes('leh') || pLow.includes('len')))
            );
          });
          if (found) {
            setSelectedCategory(found);
            setFilters((prev) => ({
              ...prev,
              categories: [found],
            }));
          }
        }
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [dynamicCategories]);

  // Update URL search param
  const updateUrlCategory = (category) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (!category || category === 'All') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', category);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Top pill bar selection handler
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFilters((prev) => ({
      ...prev,
      categories: category === 'All' ? [] : [category],
    }));
    updateUrlCategory(category);
  };

  // Sidebar filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (newFilters.categories.length === 1) {
      setSelectedCategory(newFilters.categories[0]);
      updateUrlCategory(newFilters.categories[0]);
    } else if (newFilters.categories.length === 0) {
      setSelectedCategory('All');
      updateUrlCategory('All');
    } else {
      setSelectedCategory('All');
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters(DEFAULT_FILTER_VALUES);
    setSelectedCategory('All');
    setSelectedTag('All');
    setSelectedColor(null);
    setSearch('');
    updateUrlCategory('All');
  };

  // RTK Query live products
  const { data: apiData, isLoading: isProductsLoading } = useGetProductsQuery();

  const tags = ['All', 'Sheerform', 'Functionary', 'Deform'];
  const colors = [
    { name: 'Black', class: 'black' },
    { name: 'Stone', class: 'stone' },
    { name: 'Ice', class: 'ice' },
    { name: 'Grey', class: 'grey' },
    { name: 'White', class: 'white' }
  ];

  const sourceProducts = apiData?.products && apiData.products.length > 0 ? apiData.products : productsData;

  const filteredProducts = useMemo(() => {
    let list = sourceProducts
      .map((prod, idx) => ({
        ...prod,
        local_index: prod.local_index || idx + 1,
        slug: prod.slug || prod.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        image_url: (prod.images && prod.images[0]) || prod.image_url || prod.image || `/products/product_${(prod.local_index || idx + 1)}.png`,
        price: prod.numericPrice || prod.price || 1200,
        category: prod.category || 'Kurti',
        numericPrice: Number(prod.numericPrice) || Number(prod.price) || 1200,
        ratings: prod.ratings || prod.rating || 4.7,
      }))
      .filter((prod) => {
        // 0. Admin Out of Stock storefront suppression
        if (
          filterConfig?.hideOutOfStockOnStorefront &&
          (prod.inStock === false || (typeof prod.stock === 'number' && prod.stock <= 0))
        ) {
          return false;
        }

        // 1. Search Query
        const matchSearch =
          !search.trim() ||
          prod.name.toLowerCase().includes(search.toLowerCase()) ||
          (prod.description && prod.description.toLowerCase().includes(search.toLowerCase())) ||
          (prod.tag && prod.tag.toLowerCase().includes(search.toLowerCase())) ||
          (prod.category && prod.category.toLowerCase().includes(search.toLowerCase()));

        if (!matchSearch) return false;

        // 2. Category Filter (Sidebar multi-select OR top pill bar)
        if (filters.categories && filters.categories.length > 0) {
          const inCategories = filters.categories.some(
            (c) => c.toLowerCase() === (prod.category || '').toLowerCase()
          );
          if (!inCategories) return false;
        } else if (selectedCategory && selectedCategory !== 'All') {
          if ((prod.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }

        // 3. Sizes Filter
        if (filters.sizes && filters.sizes.length > 0) {
          const hasSize = filters.sizes.some((s) => prod.sizes && prod.sizes.includes(s));
          if (!hasSize) return false;
        }

        // 4. Color Filter
        if (filters.colors && filters.colors.length > 0) {
          const matchCol = filters.colors.some((col) => {
            if (!prod.color) return false;
            const pCol = prod.color.toLowerCase();
            const cCol = col.toLowerCase();
            if (pCol === cCol || pCol.includes(cCol) || cCol.includes(pCol)) return true;
            if (filterConfig?.colors) {
              const matchedOption = filterConfig.colors.find(
                (co) => co.name?.toLowerCase() === cCol || co.hex?.toLowerCase() === cCol
              );
              if (matchedOption) {
                return (
                  pCol === matchedOption.name?.toLowerCase() ||
                  pCol === matchedOption.hex?.toLowerCase()
                );
              }
            }
            return false;
          });
          if (!matchCol) return false;
        } else if (selectedColor) {
          if (!prod.color || prod.color.toLowerCase() !== selectedColor.toLowerCase()) return false;
        }

        // 5. Fabric Filter
        if (filters.fabrics && filters.fabrics.length > 0) {
          const matchFabric = filters.fabrics.some(
            (f) =>
              (prod.fabric && prod.fabric.toLowerCase().includes(f.toLowerCase())) ||
              (prod.description && prod.description.toLowerCase().includes(f.toLowerCase()))
          );
          if (!matchFabric) return false;
        }

        // 6. Occasion Filter
        if (filters.occasions && filters.occasions.length > 0) {
          const matchOccasion = filters.occasions.some(
            (occ) =>
              (prod.occasion && prod.occasion.toLowerCase().includes(occ.toLowerCase())) ||
              (prod.description && prod.description.toLowerCase().includes(occ.toLowerCase())) ||
              (prod.tag && prod.tag.toLowerCase().includes(occ.toLowerCase()))
          );
          if (!matchOccasion) return false;
        }

        // 7. Availability Filter
        if (filters.availability && filters.availability.length > 0) {
          if (filters.availability.includes('In Stock') && prod.inStock === false) return false;
        }

        // 8. Rating Filter
        if (filters.rating !== null && prod.ratings < filters.rating) {
          return false;
        }

        // 9. Price Range Filter
        const pVal = prod.numericPrice;
        if (filters.priceRange === 'under-1000' && pVal >= 1000) return false;
        if (filters.priceRange === '1000-2000' && (pVal < 1000 || pVal > 2000)) return false;
        if (filters.priceRange === '2000-3000' && (pVal < 2000 || pVal > 3000)) return false;
        if (filters.priceRange === 'above-3000' && pVal <= 3000) return false;
        if (filters.priceRange === 'custom') {
          if (filters.customMinPrice != null && pVal < filters.customMinPrice) return false;
          if (filters.customMaxPrice != null && pVal > filters.customMaxPrice) return false;
        }

        // 10. Tag Filter
        if (selectedTag !== 'All' && (!prod.tag || prod.tag.toLowerCase() !== selectedTag.toLowerCase())) {
          return false;
        }

        return true;
      });

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.numericPrice - b.numericPrice);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.numericPrice - a.numericPrice);
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [sourceProducts, search, filters, selectedCategory, selectedTag, selectedColor, sortBy, filterConfig]);

  // Active filters count for mobile indicator & badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.sizes && filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.colors && filters.colors.length > 0) count += filters.colors.length;
    if (filters.fabrics && filters.fabrics.length > 0) count += filters.fabrics.length;
    if (filters.occasions && filters.occasions.length > 0) count += filters.occasions.length;
    if (filters.availability && filters.availability.length > 0) count += filters.availability.length;
    if (filters.rating !== null) count += 1;
    if (filters.priceRange && filters.priceRange !== 'all') count += 1;
    if (selectedTag && selectedTag !== 'All') count += 1;
    if (selectedColor) count += 1;
    return count;
  }, [filters, selectedTag, selectedColor]);

  // Log searches on Wardrobe page to Telemetry & Unmet Demand Radar
  useEffect(() => {
    if (!search || !search.trim()) return;
    const timer = setTimeout(() => {
      searchTelemetryApi.logQuery(
        search.trim(),
        filteredProducts.length,
        selectedCategory !== 'All' ? selectedCategory : 'Wardrobe'
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [search, filteredProducts.length, selectedCategory]);

  return (
    <div className="page" style={{ backgroundColor: '#edf1e8', minHeight: '100vh' }}>
      <section className="products-header">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-koulen, sans-serif)', letterSpacing: '0.04em' }}>
            Wardrobe Circulation
          </h1>

          <div className="wardrobe-search-wrap">
            <input
              className="wardrobe-search"
              type="text"
              placeholder="Search products by title, fabric, tag…"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingRight: search ? '4.8rem' : '3.6rem',
              }}
            />
            {search && (
              <button
                type="button"
                className="wardrobe-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{ right: '2.5rem' }}
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="wardrobe-search-visual-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('drapza:open-visual-search', { detail: { tab: 'upload' } })
                  );
                }
              }}
              aria-label="Search with AI Visual Lens"
              title="Search clothing by photo (AI Visual Lens)"
              style={{
                position: 'absolute',
                top: '50%',
                right: '0.55rem',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 15, 15, 0.08)',
                border: '1px solid rgba(15, 15, 15, 0.12)',
                borderRadius: '6px',
                padding: '0.28rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                color: 'var(--base-700, #0f0f0f)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.08em',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0f0f0f';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 15, 15, 0.08)';
                e.currentTarget.style.color = 'var(--base-700, #0f0f0f)';
              }}
            >
              <Camera size={13} />
              <span className="hidden sm:inline">LENS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Wardrobe Body with Integrated Sidebar */}
      <section className="product-list-wrapper" style={{ width: '100%', padding: '1rem 0 6.5rem' }}>
        <div
          className="container wardrobe-layout-container"
          style={{
            display: 'flex',
            gap: '2.5rem',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 1.5rem',
          }}
        >
          {/* Desktop Left Sidebar Filter with Reveal Animation */}
          <div
            data-lenis-prevent="true"
            className="wardrobe-sidebar-desktop custom-scrollbar"
            style={{
              width: '300px',
              flexShrink: 0,
              position: 'sticky',
              top: '6.75rem',
              zIndex: 20,
            }}
          >
            <Reveal variant="up" delay={80}>
              <WardrobeFilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onClearAll={handleClearAll}
                totalMatches={filteredProducts.length}
                dynamicOptions={filterConfig || undefined}
              />
            </Reveal>
          </div>

          {/* Right Main Catalog Content */}
          <div className="wardrobe-main-content" style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* Control Bar: Items Count + Active Filters + Mobile Filter Button + Sort */}
            <Reveal variant="fade" delay={120}>
              <div
                className="wardrobe-toolbar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '0.85rem 1.35rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--base-200, #d7dbd2)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-mono), monospace',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--base-500, #7d807a)',
                    }}
                  >
                    CIRCUITING <strong style={{ color: 'var(--base-700, #0f0f0f)' }}>{filteredProducts.length}</strong> PIECES
                  </span>

                  {/* Mobile Filter Toggle Button */}
                  <button
                    type="button"
                    className="wardrobe-mobile-filter-trigger"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    style={{
                      display: 'none',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: 'var(--base-700, #0f0f0f)',
                      color: 'var(--base-100, #edf1e8)',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-dm-mono), monospace',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    <SlidersHorizontal size={14} />
                    FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </button>
                </div>

                {/* Sorting and Clear Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--base-500, #7d807a)',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--base-700, #0f0f0f)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--base-500, #7d807a)';
                      }}
                    >
                      <RotateCcw size={12} />
                      RESET ({activeFilterCount})
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <label
                      htmlFor="wardrobe-sort-select"
                      style={{
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--base-500, #7d807a)',
                        fontWeight: 700,
                      }}
                    >
                      SORT:
                    </label>
                    <select
                      id="wardrobe-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        backgroundColor: 'var(--base-100, #edf1e8)',
                        border: '1px solid var(--base-200, #d7dbd2)',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--base-700, #0f0f0f)',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Active Filters Pill Bar */}
            {activeFilterCount > 0 && (
              <Reveal variant="fade" delay={50}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.25rem',
                  }}
                >
                  {filters.categories.map((c) => (
                    <span
                      key={c}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: '#0f0f0f',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {c}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          handleFilterChange({
                            ...filters,
                            categories: filters.categories.filter((x) => x !== c),
                          })
                        }
                      />
                    </span>
                  ))}

                  {filters.sizes.map((s) => (
                    <span
                      key={s}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(15,15,15,0.15)',
                        color: '#0f0f0f',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Size: {s}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          handleFilterChange({
                            ...filters,
                            sizes: filters.sizes.filter((x) => x !== s),
                          })
                        }
                      />
                    </span>
                  ))}

                  {filters.colors.map((col) => (
                    <span
                      key={col}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(15,15,15,0.15)',
                        color: '#0f0f0f',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Color: {col}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          handleFilterChange({
                            ...filters,
                            colors: filters.colors.filter((x) => x !== col),
                          })
                        }
                      />
                    </span>
                  ))}

                  {filters.priceRange !== 'all' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(15,15,15,0.15)',
                        color: '#0f0f0f',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Price: {filters.priceRange}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          handleFilterChange({
                            ...filters,
                            priceRange: 'all',
                            customMinPrice: null,
                            customMaxPrice: null,
                          })
                        }
                      />
                    </span>
                  )}
                </div>
              </Reveal>
            )}

            {/* Product Cards Grid - Original DRAPZA Design System Structure */}
            <div
              className="wardrobe-product-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '2rem',
                width: '100%',
                alignItems: 'stretch',
              }}
            >
              {isProductsLoading && !apiData ? (
                <div style={{ gridColumn: '1 / -1', width: '100%' }}>
                  <ProductGridSkeleton
                    count={8}
                    gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  />
                </div>
              ) : (
                filteredProducts.map((prod, idx) => (
                  <Reveal
                    key={prod.slug || prod.name}
                    variant="up"
                    className="h-full flex flex-col min-w-0 w-full"
                    delay={Math.min((idx % 6) * 50, 250)}
                  >
                    <ProductCard
                      id={prod._id || prod.id}
                      name={prod.name}
                      price={prod.price}
                      imageUrl={prod.image_url}
                      slug={prod.slug}
                      className="h-full"
                      product={prod}
                      discountTagActive={prod.discountTagActive}
                      discountPercentage={prod.discountPercentage}
                      discountPrice={prod.discountPrice}
                      offerTag={prod.offerTag}
                      originalPrice={prod.numericPrice || prod.price}
                      onNavigate={(path) => navigate(path)}
                      onAddToCart={(payload) => addToCart(payload || prod)}
                    />
                  </Reveal>
                ))
              )}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div
                className="wardrobe-empty"
                style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(15,15,15,0.08)',
                  borderRadius: '4px',
                  marginTop: '1rem',
                }}
              >
                <h5
                  style={{
                    fontFamily: 'var(--font-koulen), sans-serif',
                    fontSize: '1.45rem',
                    letterSpacing: '0.04em',
                    color: 'var(--base-700, #0f0f0f)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  NO PIECES MATCHING ACTIVE SIGNAL
                </h5>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-mono), monospace',
                    color: 'var(--base-500, #7d807a)',
                    fontSize: '0.75rem',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Try clearing some filters or searching for alternative specifications.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    padding: '0.65rem 1.4rem',
                    backgroundColor: 'var(--base-700, #0f0f0f)',
                    color: 'var(--base-100, #edf1e8)',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Slide-in Drawer */}
        {isMobileDrawerOpen && (
          <div
            className="wardrobe-mobile-drawer-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'flex-start',
            }}
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <div
              data-lenis-prevent="true"
              className="wardrobe-mobile-drawer-content custom-scrollbar"
              style={{
                width: '85vw',
                maxWidth: '340px',
                height: '100%',
                backgroundColor: '#ffffff',
                overflowY: 'auto',
                boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <WardrobeFilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onClearAll={handleClearAll}
                onCloseMobile={() => setIsMobileDrawerOpen(false)}
                isMobileDrawer={true}
                totalMatches={filteredProducts.length}
                dynamicOptions={filterConfig || undefined}
              />
            </div>
          </div>
        )}
      </section>

      {/* Responsive Styles for Wardrobe Layout */}
      <style jsx>{`
        @media (max-width: 960px) {
          .wardrobe-sidebar-desktop {
            display: none !important;
          }
          .wardrobe-mobile-filter-trigger {
            display: inline-flex !important;
          }
          .wardrobe-layout-container {
            flex-direction: column !important;
            padding: 0 1rem !important;
          }
        }
      `}</style>

      <ContactForm />
      <Footer navigate={navigate} />
    </div>
  );
};

export default WardrobePage;
