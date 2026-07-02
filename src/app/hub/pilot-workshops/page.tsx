import { getPublicCohorts } from '@/app/actions/workshops/public'
import { registerForCohort } from '@/app/actions/workshops/participants'
import CohortCard from '@/components/workshops/CohortCard'
import { Calendar, ChevronLeft, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Pilot Workshops',
  description: 'Join our structured 3-day workshop series',
}

export default async function PilotWorkshopsPage() {
  const { userId } = await auth()
  let hasCompleted = false
  
  if (userId) {
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('community_status')
      .eq('clerk_user_id', userId)
      .single()
      
    hasCompleted = !!profile?.community_status
  }

  const cohorts = await getPublicCohorts()

  return (
    <div className="min-h-screen bg-steward-offwhite font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <Link href="/hub" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <GraduationCap size={48} className="text-steward-gold mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Pilot Workshops</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Join our structured 3-day workshop series. Progress through content at your own pace, submit deliverables, and unlock new days as you complete each stage.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-20">
        {/* Cohorts Grid */}
        {cohorts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-steward-dark/5 shadow-md mt-8">
            <div className="w-16 h-16 bg-steward-offwhite rounded-2xl flex items-center justify-center mx-auto mb-4 border border-steward-gold/20">
              <Calendar className="text-steward-gold" size={24} />
            </div>
            <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight">No Open Cohorts</h3>
            <p className="text-sm text-steward-dark/60 font-bold mt-2">
              There are no workshop cohorts currently open for registration. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cohorts.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                hasCompletedOnboarding={hasCompleted}
                onRegister={async (cohortId) => {
                  'use server'
                  return await registerForCohort(cohortId)
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
