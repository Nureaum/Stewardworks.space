'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map, PenTool, ArrowRight, Briefcase, Loader2 } from 'lucide-react';

export default function WorkforcePathwaysAdminPage() {
  const router = useRouter();

  const handleNavigateStorytelling = () => {
    router.push('/admin/workforce-pathways/storytelling');
  };

  const handleNavigateJobs = () => {
    router.push('/admin/workforce-pathways/jobs');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-exo">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-steward-dark uppercase tracking-tight flex items-center gap-3">
          <Map className="text-steward-orange" size={32} />
          Workforce Pathways
        </h1>
        <p className="text-steward-dark/60 mt-2">Manage the career roadmaps and the storytelling article.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Storytelling Article Management */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-steward-dark/5 flex flex-col items-start hover:shadow-md transition-shadow">
          <div className="bg-steward-orange/20 p-4 rounded-xl text-steward-orange mb-6">
            <PenTool size={32} />
          </div>
          <h2 className="text-xl font-black text-steward-dark uppercase tracking-wide mb-2">
            Content Creator Skills
          </h2>
          <p className="text-steward-dark/60 mb-8 flex-1">
            Add info about storytelling, monetization methods, becoming a content creator, and job opportunities.
          </p>
          <button 
            onClick={handleNavigateStorytelling}
            className="inline-flex items-center gap-2 bg-steward-dark text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors"
          >
            Manage Article <ArrowRight size={16} />
          </button>
        </div>

        {/* Job Profiles Management */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-steward-dark/5 flex flex-col items-start hover:shadow-md transition-shadow">
          <div className="bg-steward-blue/20 p-4 rounded-xl text-steward-blue mb-6">
            <Briefcase size={32} />
          </div>
          <h2 className="text-xl font-black text-steward-dark uppercase tracking-wide mb-2">
            Environmental Job Profiles
          </h2>
          <p className="text-steward-dark/60 mb-8 flex-1">
            Add information about types of jobs available, salary, relevant companies, and step-by-step career pathways.
          </p>
          <button 
            onClick={handleNavigateJobs}
            className="inline-flex items-center gap-2 bg-steward-dark text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors"
          >
            Manage Profiles <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
