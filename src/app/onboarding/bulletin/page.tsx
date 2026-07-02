'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { getSystemBulletins } from '@/app/actions/bulletins';
import { ArrowDown, Pin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BulletinPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [bulletin, setBulletin] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const sys = await getSystemBulletins();
        setBulletin(sys);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);


  return (
    <main className="min-h-screen bg-[#D2B48C] relative font-exo overflow-x-hidden">
      {/* Corkboard Background Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none z-0"
        style={{ 
          backgroundImage: 'url("/bulletin-3.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-20 max-w-[1400px] mx-auto px-4 pt-32 pb-32">
        {/* Page Header */}
        <div className="text-center mb-20 space-y-6">
          <h1 className="text-5xl md:text-8xl font-black text-steward-dark uppercase tracking-tighter drop-shadow-2xl inline-block relative">
            {t('bulletin.title')}
            <div className="absolute -top-6 -right-6 animate-bounce">
              <Pin className="text-red-600 rotate-45" size={48} fill="currentColor" />
            </div>
          </h1>
          
          <div className="flex flex-col items-center pt-4">
            <div className="bg-steward-dark text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-xs font-black uppercase tracking-[0.2em]">{t('bulletin.scroll')}</span>
              <ArrowDown size={16} />
            </div>
          </div>
        </div>

        {/* Dynamic Onboarding Bulletin (from Admin) */}
        {bulletin && (bulletin.onboarding_headline || bulletin.onboarding_body || bulletin.onboarding_image_url) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="relative group mb-12">
              <div className="absolute -inset-2 bg-white/5 blur-xl rounded-3xl transition-all group-hover:bg-white/10" />
              <div className="relative bg-white shadow-[5px_5px_0px_rgba(0,0,0,0.05),10px_10px_20px_rgba(0,0,0,0.1)] p-8 md:p-12 border-t-[30px] border-steward-gold/5 transform transition-transform group-hover:rotate-0 rotate-[-0.5deg]">
                <div className="absolute top-6 left-6">
                  <div className="w-5 h-5 bg-red-600 rounded-full shadow-md border-b-4 border-red-800" />
                </div>
                <div className="absolute top-6 right-6">
                  <div className="w-5 h-5 bg-red-600 rounded-full shadow-md border-b-4 border-red-800" />
                </div>

                <div className="flex flex-col gap-8">
                  {/* Image at the top */}
                  {bulletin.onboarding_image_url && (
                    <div className="w-full h-[240px] bg-steward-offwhite border-2 border-steward-gold/20 rounded-2xl overflow-hidden relative shadow-inner">
                      <img src={bulletin.onboarding_image_url} alt="Featured" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {bulletin.onboarding_headline && (
                      <h2 className="text-3xl font-black text-steward-dark leading-tight uppercase tracking-tight">
                        {bulletin.onboarding_headline}
                      </h2>
                    )}
                    {bulletin.onboarding_body && (
                      <p className="text-base text-steward-dark/80 font-medium whitespace-pre-wrap leading-relaxed">
                        {bulletin.onboarding_body}
                      </p>
                    )}
                    {bulletin.onboarding_cta_url && bulletin.onboarding_cta_label && (
                      <div className="pt-4 flex justify-end">
                        <a 
                          href={bulletin.onboarding_cta_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-steward-green text-white font-black px-6 py-3 rounded-xl shadow-[0_6px_0_rgba(25,70,35,1)] hover:shadow-[0_4px_0_rgba(25,70,35,1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all uppercase tracking-widest text-xs"
                        >
                          {bulletin.onboarding_cta_label}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Bottom Back Button */}
        <div className="mt-20 flex justify-center pb-20">
          <button 
            onClick={() => router.back()} 
            className="bg-steward-dark text-white px-12 py-4 rounded-full font-bold hover:bg-steward-green transition-all shadow-xl hover:scale-105 active:scale-95 uppercase tracking-widest text-sm flex items-center gap-3"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
