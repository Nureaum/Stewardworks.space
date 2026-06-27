'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Hammer } from 'lucide-react';

export default function PilotWorkshopsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-steward-offwhite p-8 font-exo">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors mb-12"
      >
        <ArrowLeft size={20} />
        <span className="font-bold uppercase tracking-widest text-sm">Back to Hub</span>
      </button>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="bg-[#FFD700] w-24 h-24 rounded-2xl flex items-center justify-center text-steward-dark shadow-xl mx-auto mb-6">
          <Hammer size={48} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-steward-dark uppercase tracking-tighter">Pilot Workshops</h1>
        <p className="text-xl text-steward-dark/60 leading-relaxed max-w-2xl mx-auto">
          Interactive sessions focused on practical skills. Join our upcoming workshops to learn about AI, media, and environmental careers through direct application.
        </p>

        <div className="mt-12 bg-white p-12 rounded-3xl shadow-sm border border-steward-dark/5">
          <h2 className="text-2xl font-black text-steward-dark mb-6">Upcoming Schedule</h2>
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/hub/pilot-workshops/intro-ai-content')}
              className="w-full flex justify-between items-center p-4 border-b border-steward-dark/5 hover:bg-gray-50 transition-colors rounded-lg text-left"
            >
              <div>
                <p className="font-black text-steward-dark">Intro to AI Content</p>
                <p className="text-sm text-steward-dark/40 uppercase font-bold">March 2026</p>
              </div>
              <span className="px-4 py-1 bg-steward-green/10 text-steward-green rounded-full text-xs font-black uppercase">Open</span>
            </button>
            <button 
              onClick={() => router.push('/hub/pilot-workshops/bilingual-media')}
              className="w-full flex justify-between items-center p-4 border-b border-steward-dark/5 hover:bg-gray-50 transition-colors rounded-lg text-left"
            >
              <div>
                <p className="font-black text-steward-dark">Bilingual Media Storytelling</p>
                <p className="text-sm text-steward-dark/40 uppercase font-bold">April 2026</p>
              </div>
              <span className="px-4 py-1 bg-steward-dark/5 text-steward-dark/30 rounded-full text-xs font-black uppercase">Waitlist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
