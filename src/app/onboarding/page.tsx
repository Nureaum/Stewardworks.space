'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function OnboardingRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get returnUrl if provided, otherwise default to hub
    const returnUrl = searchParams.get('returnUrl') || '/hub';
    // Redirect to the hub onboarding page with the return URL
    router.replace(`/hub/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [router, searchParams]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16
    }}>
      <Loader2 size={48} className="animate-spin" style={{ color: '#417C98' }} />
      <p style={{ fontFamily: '"DM Mono", monospace', color: '#5a4a3a', fontSize: 14 }}>
        Redirecting to onboarding...
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#417C98' }} />
      </div>
    }>
      <OnboardingRedirectContent />
    </Suspense>
  );
}
