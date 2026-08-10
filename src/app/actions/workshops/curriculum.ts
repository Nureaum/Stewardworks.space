'use server'

import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function getAILabCurriculum(cohortId?: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  let targetCohortId = cohortId

  if (!targetCohortId) {
    // If no cohort is specified, find the most recently created cohort
    const { data: latestCohort } = await supabase
      .from('cohorts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestCohort) {
      return null // No cohorts available
    }
    
    targetCohortId = latestCohort.id
  }

  // Fetch the nested curriculum data
  const { data: daysData, error } = await supabase
    .from('workshop_days')
    .select(`
      id,
      day_number,
      title,
      blurb,
      intro,
      sections:workshop_day_sections (
        id,
        section_key,
        hour,
        title,
        duration,
        sort_order,
        entries:workshop_day_entries (
          id,
          entry_type,
          title,
          subtitle,
          body,
          items,
          modern_title,
          modern_body,
          ancient_title,
          ancient_body,
          framework,
          note,
          goal,
          applied,
          lab,
          submit_label,
          sort_order,
          media:workshop_entry_media (
            id,
            kind,
            label,
            url,
            sort_order
          )
        )
      )
    `)
    .eq('cohort_id', targetCohortId)
    .order('day_number', { ascending: true })

  if (error) {
    console.error('Error fetching curriculum:', error)
    throw new Error('Failed to load curriculum')
  }

  // Transform the raw database output into the shape expected by the UI
  const curriculum: Record<number, any> = {}

  daysData.forEach(day => {
    // Sort sections by sort_order
    const sortedSections = [...(day.sections || [])].sort((a, b) => a.sort_order - b.sort_order)
    
    const formattedSessions = sortedSections.map(sec => {
      // Sort entries by sort_order
      const sortedEntries = [...(sec.entries || [])].sort((a, b) => a.sort_order - b.sort_order)
      
      const formattedEntries = sortedEntries.map(en => ({
        ...en,
        type: en.entry_type,
        sub: en.subtitle,
        modernTitle: en.modern_title,
        modernBody: en.modern_body,
        ancientTitle: en.ancient_title,
        ancientBody: en.ancient_body,
        submitLabel: en.submit_label,
        media: ((en as any).media || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((m: any) => ({
          ...m
        }))
      }))

      return {
        id: sec.section_key,
        hour: sec.hour,
        title: sec.title,
        dur: sec.duration,
        // Assign colors based on the section key like the hardcoded data
        color: sec.section_key === 'A' ? '#ff5fd2' : sec.section_key === 'B' ? '#45d6ff' : '#ffd23f',
        entries: formattedEntries
      }
    })

    curriculum[day.day_number] = {
      id: day.id,
      title: day.title,
      blurb: day.blurb,
      intro: day.intro,
      sessions: formattedSessions
    }
  })

  return curriculum
}
