'use client';

import { Suspense } from 'react';
import { ProfilePage } from '../../views/ProfilePage';
import { ProfileSkeleton } from '../../components/drapza/skeletons';

export default function Page() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
