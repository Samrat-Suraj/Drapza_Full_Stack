'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnitPage } from '../../views/UnitPage';
import { ProductDetailSkeleton } from '../../components/drapza/ProductDetailSkeleton';

function UnitPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams?.get('product') || 'unit-01';
  return <UnitPage slug={slug} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <UnitPageContent />
    </Suspense>
  );
}
