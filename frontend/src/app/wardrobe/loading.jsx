'use client';

import React from 'react';
import { ProductGridSkeleton } from '../../components/drapza/skeletons/ProductGridSkeleton';
import { Skeleton } from '../../components/drapza/skeletons/Skeleton';

export default function WardrobeLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading wardrobe collection..."
      style={{
        backgroundColor: 'var(--base-100, #edf1e8)',
        minHeight: '100vh',
        color: 'var(--base-700, #0f0f0f)',
        paddingTop: '6rem',
      }}
    >
      {/* 1. Top Search & Filter Bar matching WardrobePage.jsx */}
      <section
        style={{
          width: '100%',
          padding: '1.5rem 1.5rem 0.5rem',
          maxWidth: '1440px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {/* Search Input Skeleton */}
          <div style={{ maxWidth: '640px', width: '100%' }}>
            <Skeleton
              height={48}
              style={{
                width: '100%',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0,0,0,0.06)',
              }}
            />
          </div>

          {/* Category Pill Bar Skeletons */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'hidden', paddingBottom: '0.5rem' }}>
            {['All', 'Kurti', 'Saree', 'Jeans', 'Tops', 'Co-ord Set'].map((cat, i) => (
              <Skeleton
                key={cat}
                width={i === 0 ? 56 : 74}
                height={32}
                subtle={i !== 0}
                style={{ borderRadius: '9999px' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Main Wardrobe Body with Desktop Sidebar + Catalog Grid */}
      <section style={{ width: '100%', padding: '1rem 0 6.5rem' }}>
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
            boxSizing: 'border-box',
          }}
        >
          {/* Desktop Left Sidebar Filter Skeleton matching WardrobeFilterSidebar */}
          <div
            className="wardrobe-sidebar-desktop"
            style={{
              width: '300px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              border: '1px solid var(--base-200, #d7dbd2)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Filter Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={90} height={18} />
              <Skeleton width={50} height={14} subtle />
            </div>

            {/* Filter Group: Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Skeleton width={80} height={14} subtle />
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Skeleton width={16} height={16} subtle style={{ borderRadius: '4px' }} />
                  <Skeleton width={90 + (n * 15)} height={14} subtle />
                </div>
              ))}
            </div>

            {/* Filter Group: Sizes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Skeleton width={60} height={14} subtle />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                  <Skeleton key={s} width={40} height={32} subtle style={{ borderRadius: '4px' }} />
                ))}
              </div>
            </div>

            {/* Filter Group: Price Range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Skeleton width={70} height={14} subtle />
              <Skeleton width="100%" height={24} subtle />
            </div>
          </div>

          {/* Right Main Catalog Content */}
          <div className="wardrobe-main-content" style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* Toolbar: Count + Sort */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--base-200, #d7dbd2)',
              }}
            >
              <Skeleton width={120} height={16} subtle />
              <Skeleton width={140} height={32} subtle style={{ borderRadius: '8px' }} />
            </div>

            {/* Product Cards Grid */}
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      </section>
    </div>
  );
}
