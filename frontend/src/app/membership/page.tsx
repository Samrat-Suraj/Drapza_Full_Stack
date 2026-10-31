'use client';

import React, { Suspense } from 'react';
import { MembershipPage } from '../../views/MembershipPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ecefe6] flex items-center justify-center font-mono text-xs text-neutral-500 uppercase tracking-widest">
          INITIALIZING ATELIER PRIVILEGE CLUB...
        </div>
      }
    >
      <MembershipPage />
    </Suspense>
  );
}

