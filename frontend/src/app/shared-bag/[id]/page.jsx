'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SharedBagView } from '../../../views/SharedBagView';

export default function SharedBagPage({ params }) {
  const routeParams = useParams();
  const shareId = routeParams?.id || params?.id;

  return <SharedBagView shareId={shareId} />;
}
