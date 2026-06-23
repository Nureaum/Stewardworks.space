'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowDown, Pin, Info, HelpCircle, Calendar, Users, Cpu, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BulletinPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const sections = [
    {
      id: 'fyi',
      title: t('bulletin.fyi.title'),
      icon: <Info className="text-steward-blue" />,
      items: [
        { title: t('bulletin.listening.title'), content: 'Information about Community Listening Sessions will be posted here. We want to hear your voice regarding environmental literacy and AI.' },
        { title: t('bulletin.dates.title'), content: 'Stay tuned for upcoming dates for community meetings and project milestones.' },
        { title: t('bulletin.workshops.title'), content: 'Sign up for our upcoming workshops on AI media creation and environmental stewardship.' },
      ]
    },
    {
      id: 'faq',
      title: t('bulletin.faq.title'),
      icon: <HelpCircle className="text-steward-orange" />,
      items: [
        { title: t('bulletin.datacenters.title'), content: 'Understand the impact and role of data centers in our environmental ecosystem.' },
        { title: t('bulletin.ai.title'), content: 'What is AI and how can it be used for environmental advocacy and career building?' },
        { title: t('bulletin.background.title'), content: 'Learn about the origins of StewardWorks and our mission in Imperial County.' },
      ]
    }
  ];

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

        {/* Bulletin Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="relative group">
              {/* Paper Background Style */}
              <div className="absolute -inset-2 bg-white/5 blur-xl rounded-3xl transition-all group-hover:bg-white/10" />
              
              <div className="relative bg-white shadow-[5px_5px_0px_rgba(0,0,0,0.05),10px_10px_20px_rgba(0,0,0,0.1)] p-8 md:p-16 min-h-[700px] border-t-[30px] border-steward-gold/5 transform transition-transform group-hover:rotate-0 odd:rotate-[-0.5deg] even:rotate-[0.5deg]">
                {/* Pins */}
                <div className="absolute top-6 left-6">
                  <div className="w-5 h-5 bg-red-600 rounded-full shadow-md border-b-4 border-red-800" />
                </div>
                <div className="absolute top-6 right-6">
                  <div className="w-5 h-5 bg-red-600 rounded-full shadow-md border-b-4 border-red-800" />
                </div>

                <div className="space-y-12">
                  <div className="flex items-center gap-6 border-b-2 border-steward-gold/10 pb-8">
                    <div className="p-3 bg-steward-offwhite rounded-2xl shadow-inner">
                    {section.icon}
                    </div>
                    <h2 className="text-4xl font-black text-steward-green uppercase tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-10">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="space-y-4 relative pl-8">
                        <div className="absolute left-0 top-2 w-3 h-3 bg-steward-orange rounded-full shadow-sm" />
                        <h3 className="text-2xl font-black text-steward-dark leading-tight uppercase tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-steward-dark/80 text-lg leading-relaxed font-medium">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Aesthetic Lined Paper Look (from Image 3) */}
                  <div className="pt-8 opacity-20 pointer-events-none select-none">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-[1px] bg-steward-blue w-full my-4" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
