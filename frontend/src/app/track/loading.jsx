'use client';

import React from 'react';
import { TrackOrderSkeleton } from '../../components/drapza/skeletons/TrackOrderSkeleton';
import { Skeleton } from '../../components/drapza/skeletons/Skeleton';

export default function TrackLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading order tracking..."
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--base-100, #edf1e8)',
        color: 'var(--base-700, #0f0f0f)',
        padding: '7.5rem 1.5rem 6rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
        {/* Header matching TrackPage.jsx */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Skeleton
            height={46}
            style={{ width: '340px', maxWidth: '80%', margin: '0 auto 0.5rem' }}
          />
          <Skeleton
            height={14}
            subtle
            style={{ width: '480px', maxWidth: '90%', margin: '0 auto' }}
          />

          {/* Search Form Input Bar matching TrackPage.jsx */}
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              maxWidth: '560px',
              margin: '2rem auto 0',
              alignItems: 'center',
            }}
          >
            <Skeleton
              height={52}
              style={{ flex: 1, borderRadius: '999px', backgroundColor: '#ffffff' }}
            />
            <Skeleton
              variant="button"
              height={52}
              contrast
              style={{ width: '130px', borderRadius: '999px' }}
            />
          </div>
        </div>

        {/* Tracking Card Skeleton */}
        <TrackOrderSkeleton />
      </div>
    </div>
  );
}
