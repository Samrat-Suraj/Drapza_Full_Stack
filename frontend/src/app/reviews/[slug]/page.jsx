'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ReviewsPage } from '../../../views/ReviewsPage';

export default function ProductReviewsRoute() {
  const params = useParams();
  const slug = params?.slug ? String(params.slug) : undefined;

  return <ReviewsPage initialProductSlug={slug} />;
}
