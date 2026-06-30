import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Map, PenTool, ArrowRight, Briefcase } from 'lucide-react';

export default function WorkforcePathwaysPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <Link href="/hub" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <Map size={48} className="text-steward-gold mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Workforce Pathways</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Career maps for environmental professions. Discover the skills and connections needed to secure high-quality jobs in the growing green economy.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARD 1: Storytelling */}
          <Link href="/hub/workforce-pathways/storytelling" className="group bg-white p-10 rounded-[2rem] shadow-sm border border-steward-dark/5 flex flex-col items-start hover:shadow-2xl transition-all hover:-translate-y-2">
            <div className="bg-steward-orange/10 p-5 rounded-2xl text-steward-orange mb-8 group-hover:scale-110 transition-transform">
              <PenTool size={40} />
            </div>
            <h2 className="text-3xl font-black text-steward-dark uppercase tracking-tighter mb-4 group-hover:text-steward-orange transition-colors">
              Content Creator Skills
            </h2>
            <p className="text-steward-dark/60 mb-10 flex-1 text-lg leading-relaxed font-medium">
              Learn how to tell your story, monetize your content, and turn your environmental passion into a successful creator career.
            </p>
            <div className="inline-flex items-center gap-3 text-steward-dark font-black uppercase tracking-widest text-sm group-hover:text-steward-orange transition-colors">
              Read the Guide <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

          {/* CARD 2: Job Profiles */}
          <Link href="/hub/workforce-pathways/jobs" className="group bg-white p-10 rounded-[2rem] shadow-sm border border-steward-dark/5 flex flex-col items-start hover:shadow-2xl transition-all hover:-translate-y-2">
            <div className="bg-steward-blue/10 p-5 rounded-2xl text-steward-blue mb-8 group-hover:scale-110 transition-transform">
              <Briefcase size={40} />
            </div>
            <h2 className="text-3xl font-black text-steward-dark uppercase tracking-tighter mb-4 group-hover:text-steward-blue transition-colors">
              Environmental Job Profiles
            </h2>
            <p className="text-steward-dark/60 mb-10 flex-1 text-lg leading-relaxed font-medium">
              Explore interactive career roadmaps, discover green economy job opportunities, and see step-by-step paths to getting hired.
            </p>
            <div className="inline-flex items-center gap-3 text-steward-dark font-black uppercase tracking-widest text-sm group-hover:text-steward-blue transition-colors">
              Explore Profiles <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}

