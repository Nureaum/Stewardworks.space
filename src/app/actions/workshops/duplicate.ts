'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateCohortParams } from '@/types/workshops'

// ─────────────────────────────────────────────────────────────────────────────
// Auth helper – shared by both exported functions
// ─────────────────────────────────────────────────────────────────────────────
async function getAdminProfile() {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')

  const supabase = createServerSupabaseClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !profile) throw new Error('Profile not found')
  if (!['admin', 'super_admin'].includes(profile.role))
    throw new Error('Admin access required')

  return { supabase, profile }
}

// ─────────────────────────────────────────────────────────────────────────────
// duplicateCohort
// Clones all curriculum content (principles, days, sections, entries, media)
// from an existing cohort into a brand-new cohort.
// Student data (registrations, progress, characters, engagements) is NOT copied.
// ─────────────────────────────────────────────────────────────────────────────
export async function duplicateCohort(
  sourceCohortId: string,
  newCohortData: CreateCohortParams
) {
  const { supabase, profile } = await getAdminProfile()

  // 1. Validate source cohort exists
  const { data: sourceCohort, error: sourceError } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', sourceCohortId)
    .single()

  if (sourceError || !sourceCohort)
    throw new Error('Source cohort not found')

  // 2. Create the new cohort — always starts as draft
  const { data: newCohort, error: cohortError } = await supabase
    .from('cohorts')
    .insert({
      name: newCohortData.name,
      description: newCohortData.description ?? null,
      start_date: newCohortData.start_date,
      registration_opens_at: newCohortData.registration_opens_at ?? null,
      registration_closes_at: newCohortData.registration_closes_at ?? null,
      capacity: newCohortData.capacity ?? null,
      status: 'draft',
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single()

  if (cohortError || !newCohort)
    throw new Error(`Failed to create new cohort: ${cohortError?.message}`)

  const newCohortId = newCohort.id

  try {
    // 3. Duplicate principles
    const { data: sourcePrinciples } = await supabase
      .from('workshop_principles')
      .select('*')
      .eq('cohort_id', sourceCohortId)
      .order('sort_order')

    if (sourcePrinciples && sourcePrinciples.length > 0) {
      const principleRows = sourcePrinciples.map((p: any) => ({
        cohort_id: newCohortId,
        name: p.name,
        description: p.description ?? null,
        example: p.example ?? null,
        sort_order: p.sort_order,
      }))
      const { error: prError } = await supabase
        .from('workshop_principles')
        .insert(principleRows)
      if (prError)
        throw new Error(`Failed to copy principles: ${prError.message}`)
    }

    // 4. Fetch source days (with sections → entries → entry media)
    const { data: sourceDays } = await supabase
      .from('workshop_days')
      .select(`
        *,
        sections:workshop_day_sections (
          *,
          entries:workshop_day_entries (
            *,
            entry_media:workshop_entry_media (*)
          )
        ),
        day_media:workshop_day_media (*)
      `)
      .eq('cohort_id', sourceCohortId)
      .order('day_number')

    if (sourceDays && sourceDays.length > 0) {
      for (const sourceDay of sourceDays) {
        // 4a. Insert new day
        const { data: newDay, error: dayError } = await supabase
          .from('workshop_days')
          .insert({
            cohort_id: newCohortId,
            day_number: sourceDay.day_number,
            title: sourceDay.title,
            content_body: sourceDay.content_body ?? null,
            deliverable_instructions: sourceDay.deliverable_instructions ?? null,
            deliverable_type: sourceDay.deliverable_type ?? 'pending_confirmation',
            requires_admin_approval: sourceDay.requires_admin_approval ?? false,
            intro: sourceDay.intro ?? null,
            blurb: sourceDay.blurb ?? null,
            scene_config: sourceDay.scene_config ?? null,
            created_by: profile.id,
            updated_by: profile.id,
          })
          .select()
          .single()

        if (dayError || !newDay)
          throw new Error(`Failed to copy Day ${sourceDay.day_number}: ${dayError?.message}`)

        // 4b. Copy workshop_day_media (PDF/video/links attached to the day)
        const dayMediaRows = (sourceDay.day_media || []).map((m: any) => ({
          workshop_day_id: newDay.id,
          media_type: m.media_type,
          url: m.url,
          storage_path: m.storage_path ?? null,
          label: m.label ?? null,
          sort_order: m.sort_order,
        }))
        if (dayMediaRows.length > 0) {
          const { error: dmError } = await supabase
            .from('workshop_day_media')
            .insert(dayMediaRows)
          if (dmError)
            throw new Error(`Failed to copy media for Day ${sourceDay.day_number}: ${dmError.message}`)
        }

        // 4c. Copy sections
        const sortedSections = [...(sourceDay.sections || [])].sort(
          (a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
        )

        for (const sourceSection of sortedSections) {
          const { data: newSection, error: secError } = await supabase
            .from('workshop_day_sections')
            .insert({
              workshop_day_id: newDay.id,
              section_key: sourceSection.section_key,
              hour: sourceSection.hour ?? null,
              title: sourceSection.title,
              duration: sourceSection.duration ?? null,
              sort_order: sourceSection.sort_order,
            })
            .select()
            .single()

          if (secError || !newSection)
            throw new Error(`Failed to copy section "${sourceSection.title}": ${secError?.message}`)

          // 4d. Copy entries
          const sortedEntries = [...(sourceSection.entries || [])].sort(
            (a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
          )

          for (const sourceEntry of sortedEntries) {
            const { data: newEntry, error: entryError } = await supabase
              .from('workshop_day_entries')
              .insert({
                section_id: newSection.id,
                entry_type: sourceEntry.entry_type,
                title: sourceEntry.title,
                subtitle: sourceEntry.subtitle ?? null,
                body: sourceEntry.body ?? null,
                items: sourceEntry.items ?? [],
                modern_title: sourceEntry.modern_title ?? null,
                modern_body: sourceEntry.modern_body ?? null,
                ancient_title: sourceEntry.ancient_title ?? null,
                ancient_body: sourceEntry.ancient_body ?? null,
                framework: sourceEntry.framework ?? null,
                contrib_id: sourceEntry.contrib_id ?? null,
                note: sourceEntry.note ?? null,
                goal: sourceEntry.goal ?? null,
                applied: sourceEntry.applied ?? null,
                lab: sourceEntry.lab ?? null,
                submit_label: sourceEntry.submit_label ?? null,
                sort_order: sourceEntry.sort_order,
              })
              .select()
              .single()

            if (entryError || !newEntry)
              throw new Error(`Failed to copy entry "${sourceEntry.title}": ${entryError?.message}`)

            // 4e. Copy entry media (images/video/links per entry)
            const entryMediaRows = (sourceEntry.entry_media || []).map((em: any) => ({
              entry_id: newEntry.id,
              kind: em.kind,
              label: em.label ?? null,
              url: em.url ?? null,
              file_name: em.file_name ?? null,
              storage_path: em.storage_path ?? null,
              sort_order: em.sort_order,
            }))
            if (entryMediaRows.length > 0) {
              const { error: emError } = await supabase
                .from('workshop_entry_media')
                .insert(entryMediaRows)
              if (emError)
                throw new Error(`Failed to copy media for entry "${sourceEntry.title}": ${emError.message}`)
            }
          }
        }
      }
    }
  } catch (err) {
    // If anything fails mid-way, clean up the partially-created cohort
    // so the admin doesn't end up with a broken draft
    await supabase.from('cohorts').delete().eq('id', newCohortId)
    throw err
  }

  revalidatePath('/hub/pilot-workshops')
  revalidatePath('/admin/pilot-workshops')

  return newCohort
}

// ─────────────────────────────────────────────────────────────────────────────
// duplicateDay
// Clones one specific day (sections → entries → media) from any cohort
// and appends it to the target cohort as the next day number.
// ─────────────────────────────────────────────────────────────────────────────
export async function duplicateDay(
  sourceDayId: string,
  targetCohortId: string,
  targetDayNumber?: number
) {
  const { supabase, profile } = await getAdminProfile()

  // 1. Fetch source day with all nested content
  const { data: sourceDay, error: sourceDayError } = await supabase
    .from('workshop_days')
    .select(`
      *,
      sections:workshop_day_sections (
        *,
        entries:workshop_day_entries (
          *,
          entry_media:workshop_entry_media (*)
        )
      ),
      day_media:workshop_day_media (*)
    `)
    .eq('id', sourceDayId)
    .single()

  if (sourceDayError || !sourceDay)
    throw new Error('Source day not found')

  // 2. Smart slot check — allow import into empty existing days.
  //    The DB enforces day_number IN (1, 2, 3) via a check constraint.
  //    Admin can pick the target slot via targetDayNumber; defaults to source's day_number.
  const dayNum = targetDayNumber ?? sourceDay.day_number
  let newDay: any

  const { data: existingDay } = await supabase
    .from('workshop_days')
    .select('id')
    .eq('cohort_id', targetCohortId)
    .eq('day_number', dayNum)
    .maybeSingle()

  if (existingDay) {
    // Check if the existing day has any sections (i.e. has real content)
    const { count: sectionCount } = await supabase
      .from('workshop_day_sections')
      .select('*', { count: 'exact', head: true })
      .eq('workshop_day_id', existingDay.id)

    if ((sectionCount ?? 0) > 0) {
      throw new Error(
        `Day ${dayNum} already has content in this cohort. ` +
        `Please select a day whose slot is empty.`
      )
    }

    // Day exists but is empty — update it with the source content
    const { data: updatedDay, error: updateError } = await supabase
      .from('workshop_days')
      .update({
        title: sourceDay.title,
        content_body: sourceDay.content_body ?? null,
        deliverable_instructions: sourceDay.deliverable_instructions ?? null,
        deliverable_type: sourceDay.deliverable_type ?? 'pending_confirmation',
        requires_admin_approval: sourceDay.requires_admin_approval ?? false,
        intro: sourceDay.intro ?? null,
        blurb: sourceDay.blurb ?? null,
        scene_config: sourceDay.scene_config ?? null,
        updated_by: profile.id,
      })
      .eq('id', existingDay.id)
      .select()
      .single()

    if (updateError || !updatedDay)
      throw new Error(`Failed to update empty day: ${updateError?.message}`)

    newDay = updatedDay
  } else {
    // Slot is completely free — insert a new day
    const { data: insertedDay, error: dayError } = await supabase
      .from('workshop_days')
      .insert({
        cohort_id: targetCohortId,
        day_number: dayNum,
        title: sourceDay.title,
        content_body: sourceDay.content_body ?? null,
        deliverable_instructions: sourceDay.deliverable_instructions ?? null,
        deliverable_type: sourceDay.deliverable_type ?? 'pending_confirmation',
        requires_admin_approval: sourceDay.requires_admin_approval ?? false,
        intro: sourceDay.intro ?? null,
        blurb: sourceDay.blurb ?? null,
        scene_config: sourceDay.scene_config ?? null,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select()
      .single()

    if (dayError || !insertedDay)
      throw new Error(`Failed to create imported day: ${dayError?.message}`)

    newDay = insertedDay
  }

  // 4. Copy workshop_day_media
  const dayMediaRows = (sourceDay.day_media || []).map((m: any) => ({
    workshop_day_id: newDay.id,
    media_type: m.media_type,
    url: m.url,
    storage_path: m.storage_path ?? null,
    label: m.label ?? null,
    sort_order: m.sort_order,
  }))
  if (dayMediaRows.length > 0) {
    await supabase.from('workshop_day_media').insert(dayMediaRows)
  }

  // 5. Copy sections → entries → entry media
  const sortedSections = [...(sourceDay.sections || [])].sort(
    (a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
  )

  const newSectionsWithEntries: any[] = []

  for (const sourceSection of sortedSections) {
    const { data: newSection, error: secError } = await supabase
      .from('workshop_day_sections')
      .insert({
        workshop_day_id: newDay.id,
        section_key: sourceSection.section_key,
        hour: sourceSection.hour ?? null,
        title: sourceSection.title,
        duration: sourceSection.duration ?? null,
        sort_order: sourceSection.sort_order,
      })
      .select()
      .single()

    if (secError || !newSection)
      throw new Error(`Failed to copy section: ${secError?.message}`)

    const newEntriesForSection: any[] = []
    const sortedEntries = [...(sourceSection.entries || [])].sort(
      (a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
    )

    for (const sourceEntry of sortedEntries) {
      const { data: newEntry, error: entryError } = await supabase
        .from('workshop_day_entries')
        .insert({
          section_id: newSection.id,
          entry_type: sourceEntry.entry_type,
          title: sourceEntry.title,
          subtitle: sourceEntry.subtitle ?? null,
          body: sourceEntry.body ?? null,
          items: sourceEntry.items ?? [],
          modern_title: sourceEntry.modern_title ?? null,
          modern_body: sourceEntry.modern_body ?? null,
          ancient_title: sourceEntry.ancient_title ?? null,
          ancient_body: sourceEntry.ancient_body ?? null,
          framework: sourceEntry.framework ?? null,
          contrib_id: sourceEntry.contrib_id ?? null,
          note: sourceEntry.note ?? null,
          goal: sourceEntry.goal ?? null,
          applied: sourceEntry.applied ?? null,
          lab: sourceEntry.lab ?? null,
          submit_label: sourceEntry.submit_label ?? null,
          sort_order: sourceEntry.sort_order,
        })
        .select()
        .single()

      if (entryError || !newEntry)
        throw new Error(`Failed to copy entry: ${entryError?.message}`)

      const entryMediaRows = (sourceEntry.entry_media || []).map((em: any) => ({
        entry_id: newEntry.id,
        kind: em.kind,
        label: em.label ?? null,
        url: em.url ?? null,
        file_name: em.file_name ?? null,
        storage_path: em.storage_path ?? null,
        sort_order: em.sort_order,
      }))
      if (entryMediaRows.length > 0) {
        await supabase.from('workshop_entry_media').insert(entryMediaRows)
      }

      newEntriesForSection.push({ ...newEntry, entry_media: entryMediaRows })
    }

    newSectionsWithEntries.push({ ...newSection, entries: newEntriesForSection })
  }

  revalidatePath(`/hub/pilot-workshops/${targetCohortId}/journey`)
  revalidatePath('/admin/pilot-workshops')

  // Return the full new day object so AdminConsole can optimistically add it
  return {
    ...newDay,
    sections: newSectionsWithEntries,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getCohortsForDuplicate
// Lightweight read — returns all cohorts for the duplicate/import dropdowns.
// ─────────────────────────────────────────────────────────────────────────────
export async function getCohortsForDuplicate() {
  const { supabase } = await getAdminProfile()

  const { data, error } = await supabase
    .from('cohorts')
    .select('id, name, status, start_date')
    .order('start_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch cohorts: ${error.message}`)
  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// getDaysForCohort
// Returns days (id, day_number, title) for a given cohort — used by the
// Import Day modal so admin can pick which day to import.
// ─────────────────────────────────────────────────────────────────────────────
export async function getDaysForCohort(cohortId: string) {
  const { supabase } = await getAdminProfile()

  const { data, error } = await supabase
    .from('workshop_days')
    .select('id, day_number, title')
    .eq('cohort_id', cohortId)
    .order('day_number')

  if (error) throw new Error(`Failed to fetch days: ${error.message}`)
  return data ?? []
}
