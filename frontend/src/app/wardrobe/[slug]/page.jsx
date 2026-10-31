'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { UnitPage } from '../../../views/UnitPage';

export default function Page() {
  const params = useParams();
  const slug = params?.slug ? String(params.slug) : 'unit-01';

  return <UnitPage slug={slug} />;
}

