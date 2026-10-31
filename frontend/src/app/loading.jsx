'use client';

import React from 'react';
import { Skeleton } from '../components/drapza/skeletons/Skeleton';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page..."
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--base-100, #edf1e8)',
        color: 'var(--base-700, #0f0f0f)',
        padding: '7.5rem 1.5rem 5rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Skeleton width={220} height={36} />
          <Skeleton width={320} height={14} subtle />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <Skeleton height={280} style={{ borderRadius: '12px', backgroundColor: 'var(--base-200, #d7dbd2)' }} />
          <Skeleton height={280} style={{ borderRadius: '12px', backgroundColor: 'var(--base-200, #d7dbd2)' }} />
          <Skeleton height={280} style={{ borderRadius: '12px', backgroundColor: 'var(--base-200, #d7dbd2)' }} />
        </div>
      </div>
    </div>
  );
}
