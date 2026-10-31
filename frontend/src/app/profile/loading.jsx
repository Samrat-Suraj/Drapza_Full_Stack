'use client';

import React from 'react';
import { ProfileSkeleton } from '../../components/drapza/skeletons/ProfileSkeleton';

export default function ProfileLoading() {
  return (
    <div
      className="min-h-screen bg-[#edf1e8] text-[#0f0f0f] px-4 sm:px-6 py-28 max-w-7xl mx-auto"
      role="status"
      aria-busy="true"
      aria-label="Loading profile..."
    >
      <ProfileSkeleton />
    </div>
  );
}
