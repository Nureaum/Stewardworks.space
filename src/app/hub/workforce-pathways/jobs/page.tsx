import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Briefcase, Map } from 'lucide-react';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import JobProfileCard from '@/components/JobProfileCard';

export const revalidate = 0;

export default async function JobsPage() {
  const supabase = createServerSupabaseClient();

  // Fetch Job Profiles with steps
  const { data: jobProfiles } = await supabase
    .from('job_profiles')
    .select(`
      *,
      job_profile_steps (*)
    `)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  return (
    <div className="min-h-screen bg-steward-offwhite font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="w-full mx-auto px-4 md:px-8 relative z-10">
          <Link href="/hub/workforce-pathways" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Pathways
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <Briefcase size={48} className="text-steward-blue mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Environmental Job Profiles</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Explore interactive career roadmaps, discover green economy job opportunities, and see step-by-step paths to getting hired.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-8 md:px-16 py-12 relative z-20">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-md border border-steward-dark/5 space-y-6">
          {jobProfiles && jobProfiles.length > 0 ? (
            jobProfiles.map((profile: any) => (
              <JobProfileCard key={profile.id} profile={profile} />
            ))
          ) : (
            <div className="bg-steward-offwhite/50 h-full min-h-[350px] flex flex-col items-center justify-center rounded-3xl border border-steward-dark/5 text-center p-8">
              <Map className="text-steward-dark/10 mb-6" size={64} />
              <h2 className="text-2xl font-black uppercase tracking-tight text-steward-dark mb-2">No Profiles Yet</h2>
              <p className="text-steward-dark/60 font-medium text-lg max-w-sm">There are no active environmental job profiles available at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
