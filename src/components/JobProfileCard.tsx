'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Briefcase, DollarSign, Building2, HelpCircle, Map } from 'lucide-react';

export interface JobProfileStep {
  id: string;
  step_number: number;
  description: string;
}

export interface JobProfile {
  id: string;
  job_title: string;
  company_name: string | null;
  company_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_display_override: string | null;
  application_tips: string | null;
  job_profile_steps: JobProfileStep[];
}

export default function JobProfileCard({ profile }: { profile: JobProfile }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatSalary = (min: number | null, max: number | null, override: string | null) => {
    if (override) return override;
    if (min !== null && max !== null) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min !== null) return `Starts at $${min.toLocaleString()}`;
    if (max !== null) return `Up to $${max.toLocaleString()}`;
    return 'Salary not specified';
  };

  const sortedSteps = [...(profile.job_profile_steps || [])].sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-steward-dark/5 hover:border-steward-dark/10 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight flex items-center gap-2">
            <Briefcase className="text-steward-orange" size={18} />
            {profile.job_title}
          </h3>
          {profile.company_name && (
            <div className="flex items-center gap-2 mt-1.5 text-steward-dark/60 font-bold text-sm">
              <Building2 size={14} />
              {profile.company_url ? (
                <a href={profile.company_url} target="_blank" rel="noopener noreferrer" className="hover:text-steward-blue transition-colors flex items-center gap-1">
                  {profile.company_name} <ExternalLink size={10} />
                </a>
              ) : (
                <span>{profile.company_name}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-steward-green font-bold bg-steward-green/10 w-fit px-2.5 py-0.5 rounded-full text-xs">
            <DollarSign size={14} />
            {formatSalary(profile.salary_min, profile.salary_max, profile.salary_display_override)}
          </div>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1.5 bg-steward-offwhite hover:bg-steward-cream text-steward-dark px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors w-full md:w-auto"
        >
          {isExpanded ? 'Hide Details' : 'View Pathway'}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-steward-dark/5 space-y-6">
          <div>
            <h4 className="text-sm font-black text-steward-dark uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Map className="text-steward-blue" size={16} />
              Pathway Steps
            </h4>
            <div className="space-y-3">
              {sortedSteps.length > 0 ? (
                sortedSteps.map((step) => (
                  <div key={step.id} className="flex gap-3 items-start bg-steward-offwhite/50 p-3 rounded-lg border border-steward-dark/5">
                    <div className="bg-steward-blue text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                      {step.step_number}
                    </div>
                    <p className="text-steward-dark/80 text-sm pt-0.5">{step.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-steward-dark/50 italic text-sm">No steps defined yet.</p>
              )}
            </div>
          </div>

          {profile.application_tips && (
            <div>
              <h4 className="text-sm font-black text-steward-dark uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <HelpCircle className="text-steward-gold" size={16} />
                Application Tips
              </h4>
              <div 
                className="prose prose-sm max-w-none text-steward-dark/80 bg-steward-offwhite p-4 rounded-lg border border-steward-gold/20"
                dangerouslySetInnerHTML={{ __html: profile.application_tips }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
