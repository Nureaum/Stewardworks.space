'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function InfoPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-steward-offwhite text-steward-dark font-exo p-8 md:p-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link href="/" className="inline-flex items-center text-steward-gold hover:text-steward-orange transition-colors">
          <span className="mr-2">←</span> Back to Home
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-steward-green">
            About StewardWorks
          </h1>
          <div className="h-1 w-24 bg-steward-orange" />
        </div>

        <div className="prose prose-xl text-steward-dark opacity-90 leading-relaxed whitespace-pre-line">
          {t('mission.body.long')}
        </div>

        <div className="pt-12 border-t border-steward-gold/20 flex flex-col space-y-8">
          <p className="text-sm font-lofi uppercase tracking-widest text-steward-gold">
            {t('credits')}
          </p>
          <div className="relative w-full h-16 md:h-24 grayscale opacity-80">
            <Image 
              src="/partner_logo_strip_current.jpg" 
              alt="Partner Logos" 
              fill
              style={{ objectFit: 'contain', objectPosition: 'left' }}
            />
          </div>
        </div>

        <div className="flex justify-center pt-12">
          <Link href="/login">
            <button className="px-12 py-4 bg-steward-green text-steward-offwhite font-bold rounded-full hover:bg-steward-orange transition-all shadow-lg text-xl">
              {t('enter.site')}
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
