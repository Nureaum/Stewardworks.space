import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-exo flex flex-col">
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden h-[300px]">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="flex items-center justify-center w-full h-full relative z-10">
           <Loader2 className="animate-spin text-steward-gold" size={48} />
        </div>
      </header>
      <main className="w-full mx-auto px-8 md:px-16 py-12 relative z-20 flex-1 flex items-center justify-center">
        <div className="bg-white rounded-[2rem] w-full max-w-4xl p-12 shadow-md border border-steward-dark/5 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-steward-dark/20 mb-4" size={48} />
          <p className="text-steward-dark/40 font-bold uppercase tracking-widest text-sm">Loading article...</p>
        </div>
      </main>
    </div>
  );
}
