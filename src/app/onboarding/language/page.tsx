'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, Suspense } from 'react';

function LanguageOnboardingContent() {
  const { setLanguage, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('returnUrl');
    setReturnUrl(url);
  }, [searchParams]);

  const handleLanguageSelect = (lang: 'en' | 'es') => {
    setLanguage(lang);
    const url = returnUrl ? `/onboarding/questions?returnUrl=${returnUrl}` : '/onboarding/questions';
    router.push(url);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-transparent relative z-10">
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center space-y-16 md:space-y-0 relative">
        
        {/* English Section (Left) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-exo font-black text-steward-green tracking-tight leading-none">
              {t('welcome.en')}
            </h1>
            <p className="text-sm md:text-base font-exo font-medium text-steward-gold opacity-70 lowercase">
              {t('onboard.en')}
            </p>
          </div>
          <button 
            onClick={() => handleLanguageSelect('en')}
            className="w-48 py-3 bg-steward-blue hover:bg-steward-orange text-white font-bold rounded-lg shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {t('onboard.button.en')}
          </button>
        </div>

        {/* Vertical Divider Section (Center) */}
        <div className="hidden md:flex h-80 items-center px-12">
          <div className="w-[1px] h-full bg-steward-gold/20" />
        </div>
        <div className="md:hidden w-full px-12 opacity-20">
          <div className="h-[1px] w-full bg-steward-gold" />
        </div>

        {/* Spanish Section (Right) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-right-10 duration-1000">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-exo font-black text-steward-green tracking-tight leading-none">
              {t('welcome.es')}
            </h1>
            <p className="text-sm md:text-base font-exo font-medium text-steward-gold opacity-70">
              {t('onboard.es')}
            </p>
          </div>
          <button 
            onClick={() => handleLanguageSelect('es')}
            className="w-48 py-3 bg-steward-blue hover:bg-steward-orange text-white font-bold rounded-lg shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {t('onboard.button.es')}
          </button>
        </div>

        {/* Subtle Background Typography */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-[15vw] font-exo font-black opacity-[0.02] select-none uppercase tracking-tighter whitespace-nowrap pointer-events-none text-steward-green">
          Select Language
        </div>
      </div>
    </main>
  );
}


export default function LanguageOnboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-steward-dark font-bold">Loading...</div>
      </div>
    }>
      <LanguageOnboardingContent />
    </Suspense>
  );
}
