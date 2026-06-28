'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function PreHome() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { isLoaded, userId } = useAuth();
  const isAuthenticated = isLoaded && !!userId;

  const handleEnterSite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (isAuthenticated) {
      router.push('/hub');
    } else {
      router.push('/login');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* 1. Logo Section (Center Left) */}
        <div className="md:col-span-5 flex justify-center md:justify-start">
          <Link href="/hub" className="group">
            <div className="relative w-72 h-72 md:w-96 md:h-96 transition-transform duration-700 group-hover:scale-[1.02]">
              <Image 
                src="/logo 1.jpg" 
                alt="StewardWorks Logo" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain' }}
                priority
                className="drop-shadow-2xl"
              />
              {/* Subtle borderless URL label */}
              <div className="absolute -bottom-8 left-0 text-[10px] font-lofi tracking-[0.5em] uppercase opacity-30 group-hover:opacity-60 transition-opacity whitespace-nowrap">
                stewardworks.space
              </div>
            </div>
          </Link>
        </div>

        {/* Text Section (Center Right) */}
        <div className="md:col-span-7 flex flex-col space-y-8 text-steward-green">
          {/* 2. Mission Phrase (Numen Aquae) - Top Right */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-exo font-black uppercase tracking-tighter leading-none animate-in fade-in slide-in-from-right-10 duration-1000">
              {t('mission.phrase')}
            </h1>
            <div className="h-[2px] w-24 bg-steward-orange" />
          </div>

          {/* 3. Mission Statement - Center Right below phrase */}
          <div className="max-w-xl animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            <p className="text-xl md:text-2xl font-exo leading-relaxed tracking-tight font-bold opacity-90">
              {t('mission.body')}
            </p>
          </div>

          {/* Credits and horizontal line removed per user request */}
        </div>
      </div>

      {/* 6. Buttons (Center Bottom) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col md:flex-row gap-4 lg:gap-6 items-center w-full px-4 md:px-0 md:w-auto">
        <Link href="/info" className="w-full md:w-auto">
          <button className="w-full md:w-auto group relative overflow-hidden px-6 lg:px-8 py-4 text-base lg:text-lg font-bold tracking-[0.1em] transition-all duration-300 border-2 border-steward-gold text-steward-gold hover:bg-steward-gold hover:text-steward-offwhite bg-transparent rounded-full whitespace-nowrap">
            <span className="relative z-10">{t('learn.more')}</span>
          </button>
        </Link>
        <button 
          onClick={handleEnterSite}
          disabled={isLoading || !isLoaded}
          className="w-full md:w-auto group relative overflow-hidden px-8 lg:px-12 py-4 text-base lg:text-lg font-bold tracking-[0.1em] transition-all duration-300 bg-steward-green text-steward-offwhite hover:bg-steward-orange rounded-full shadow-lg disabled:opacity-70 flex items-center justify-center whitespace-nowrap"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                LOADING...
              </>
            ) : (
              isAuthenticated ? 'DASHBOARD' : t('enter.site')
            )}
          </span>
        </button>
        <Link href="/onboarding/bulletin" className="w-full md:w-auto">
          <button className="w-full md:w-auto group relative overflow-hidden px-6 lg:px-8 py-4 text-sm lg:text-base font-bold tracking-[0.1em] transition-all duration-300 border border-steward-dark/30 text-steward-dark hover:bg-steward-dark hover:text-steward-offwhite bg-white/50 rounded-full whitespace-nowrap">
            <span className="relative z-10">Project Bulletin</span>
          </button>
        </Link>
      </div>

      {/* Post-modern background accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] text-[12vw] font-black opacity-[0.03] select-none uppercase tracking-tighter">
          Steward
        </div>
        <div className="absolute bottom-[20%] left-[2%] text-[8vw] font-black opacity-[0.02] select-none uppercase tracking-tighter -rotate-90">
          Resilience
        </div>
      </div>
    </main>
  );
}
