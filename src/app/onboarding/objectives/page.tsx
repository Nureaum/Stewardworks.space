'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { User } from 'lucide-react';
import Image from 'next/image';

export default function LearningObjectives() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('returnUrl');
    setReturnUrl(url);
  }, [searchParams]);

  const handleEnterHub = () => {
    if (returnUrl) {
      // Redirect back to where user came from (workshop page)
      router.push(decodeURIComponent(returnUrl));
    } else {
      // Default redirect to hub
      router.push('/hub');
    }
  };

  const objectives = [
    {
      id: 1,
      title: "AI Literacy",
      date: "Spring 2026",
      outcomes: [
        "Realities of AI good and bad — and un-realities (deep fakes, scamming, malware)",
        "Data sovereignty & digital presence",
        "Understand imperial county stats, history + understanding value of self, community and county"
      ]
    },
    {
      id: 2,
      title: "Local Environment",
      date: "Summer 2026",
      outcomes: [
        "Lithium and geothermal mining",
        "Content creation dimension",
        "Environmental understanding of bioregion and watershed and indigenous"
      ]
    },
    {
      id: 3,
      title: "Job Prep",
      date: "Fall 2026",
      outcomes: [
        "Prompt engineering for tradeable industries (pick a focus)",
        "Real world application — digital media, local outreach, foundational industries",
        "Understanding; The strengths and weakness of LLMs and best use cases",
        "Digital marketing job prep",
        "CCA Careers end job industry plan"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-steward-offwhite flex flex-col relative z-10 font-exo">
      {/* Header - Matching Dark Theme with specific positions */}
      <header className="bg-steward-dark px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        {/* 3. Profile Photo Button (Top Left) */}
        <div 
          className="w-10 h-10 bg-white border-2 border-steward-blue rounded-full flex items-center justify-center text-steward-blue cursor-pointer hover:bg-steward-cream transition-colors"
          onClick={() => router.push('/onboarding/questions')}
        >
          <User size={20} />
        </div>

        {/* 2. Text (Learning Objectives, Center Top) */}
        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
          Learning Objectives
        </h1>

        {/* 1. Logo (Link to pg 5, Top Right) */}
        <div 
          className="w-10 h-10 bg-steward-blue rounded-full flex items-center justify-center font-black text-white text-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden" 
          onClick={() => router.push('/hub')}
        >
          SW
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-12 py-12 px-6 pb-32">
        
        {/* 1. Learning roadmap or three tiered pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {objectives.map((obj) => (
            <div key={obj.id} className="flex flex-col h-full group">
              {/* Top: Date of object to be completed */}
              <div className="bg-steward-dark text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-t-xl text-center">
                Target: {obj.date}
              </div>
              
              {/* Center: Objective & Pillar */}
              <div className="flex-1 bg-white border-x border-steward-gold/10 p-8 flex flex-col items-center text-center space-y-6 shadow-sm group-hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-steward-cream border-2 border-steward-blue rounded-full flex items-center justify-center text-2xl font-black text-steward-blue shadow-inner">
                  {obj.id}
                </div>
                <h3 className="text-xl font-bold text-steward-dark uppercase tracking-tight leading-tight min-h-[3rem] flex items-center">
                  {obj.title}
                </h3>
                
                <div className="w-12 h-1 bg-steward-orange rounded-full opacity-30" />
                
                {/* Bottom: Learning outcomes */}
                <div className="w-full text-left space-y-4">
                  <p className="text-[10px] font-bold text-steward-gold uppercase tracking-[0.2em] border-b border-steward-gold/10 pb-2">
                    Learning Outcomes
                  </p>
                  <ul className="space-y-3">
                    {obj.outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2 group/item">
                        <div className="w-1.5 h-1.5 rounded-full bg-steward-green mt-1.5 shrink-0 group-hover/item:scale-125 transition-transform" />
                        <span className="text-[11px] font-medium text-steward-dark/80 leading-relaxed font-exo">
                          {outcome}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Bottom Decorative Cap */}
              <div className="h-2 bg-steward-gold rounded-b-xl opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Navigation to Hub */}
        <div className="flex flex-col items-center space-y-4 pt-12">
          <button 
            onClick={handleEnterHub}
            className="w-full max-w-sm py-5 bg-steward-green hover:bg-steward-orange text-white font-black rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
          >
            {returnUrl ? 'Continue to Workshop' : 'Enter Career Hub'}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <p className="text-[10px] text-steward-gold font-bold uppercase tracking-widest">
            {returnUrl ? 'Complete your registration' : 'Begin your journey into stewardship'}
          </p>
        </div>
      </div>

      {/* Background visual accents (Post-modern subtle text) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] select-none text-steward-green">
        <div className="absolute top-[20%] left-[-5%] text-[15vw] font-black uppercase -rotate-12">
          Knowledge
        </div>
        <div className="absolute bottom-[10%] right-[-5%] text-[15vw] font-black uppercase rotate-12">
          Stewardship
        </div>
      </div>
    </main>
  );
}
