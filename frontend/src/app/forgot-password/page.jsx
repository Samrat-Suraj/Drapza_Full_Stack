'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginPage } from '../../views/LoginPage';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  return <LoginPage initialMode={step === 'otp' ? 'forgot-otp' : 'forgot'} />;
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="drapza-screen" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

