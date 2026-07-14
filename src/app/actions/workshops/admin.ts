'use server'

import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// CURRICULUM MANAGEMENT
// ============================================================

export async function getAdminCurriculum(cohortId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Fetch days with sections and entries
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
          contrib_id
        )
      )
    `)
    .eq('cohort_id', cohortId)
    .order('day_number', { ascending: true })

  if (error) {
    console.error('Error fetching curriculum:', error)
    throw new Error('Failed to load curriculum')
  }

  return daysData
}

export async function updateWorkshopDay(dayId: string, data: { title?: string; blurb?: string; intro?: string }) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_days')
    .update({
      ...data,
      updated_by: profile.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', dayId)

  if (error) {
    console.error('Error updating workshop day:', error)
    throw new Error('Failed to update workshop day')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function createSection(workshopDayId: string, data: {
  section_key: string;
  hour?: string;
  title: string;
  duration?: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Get the current max sort_order
  const { data: existingSections } = await supabase
    .from('workshop_day_sections')
    .select('sort_order')
    .eq('workshop_day_id', workshopDayId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = (existingSections?.[0]?.sort_order || 0) + 1

  const { data: newSection, error } = await supabase
    .from('workshop_day_sections')
    .insert({
      workshop_day_id: workshopDayId,
      section_key: data.section_key,
      hour: data.hour,
      title: data.title,
      duration: data.duration,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating section:', error)
    throw new Error('Failed to create section')
  }

  revalidatePath('/hub/ai-lab')
  return newSection
}

export async function updateSection(sectionId: string, data: {
  hour?: string;
  title?: string;
  duration?: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_day_sections')
    .update(data)
    .eq('id', sectionId)

  if (error) {
    console.error('Error updating section:', error)
    throw new Error('Failed to update section')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function deleteSection(sectionId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_day_sections')
    .delete()
    .eq('id', sectionId)

  if (error) {
    console.error('Error deleting section:', error)
    throw new Error('Failed to delete section')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function createEntry(sectionId: string, data: {
  entry_type: 'text' | 'list' | 'dual' | 'featured' | 'deliverable';
  title?: string;
  subtitle?: string;
  body?: string;
  items?: string[];
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Get the current max sort_order
  const { data: existingEntries } = await supabase
    .from('workshop_day_entries')
    .select('sort_order')
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = (existingEntries?.[0]?.sort_order || 0) + 1

  const { data: newEntry, error } = await supabase
    .from('workshop_day_entries')
    .insert({
      section_id: sectionId,
      entry_type: data.entry_type,
      title: data.title || 'New Entry',
      subtitle: data.subtitle,
      body: data.body,
      items: data.items || [],
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating entry:', error)
    throw new Error('Failed to create entry')
  }

  revalidatePath('/hub/ai-lab')
  return newEntry
}

export async function updateEntry(entryId: string, data: any) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_day_entries')
    .update(data)
    .eq('id', entryId)

  if (error) {
    console.error('Error updating entry:', error)
    throw new Error('Failed to update entry')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function deleteEntry(entryId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_day_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    console.error('Error deleting entry:', error)
    throw new Error('Failed to delete entry')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

// ============================================================
// PRINCIPLES MANAGEMENT
// ============================================================

export async function getPrinciples(cohortId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('workshop_principles')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching principles:', error)
    throw new Error('Failed to load principles')
  }

  return data
}

export async function createPrinciple(cohortId: string, data: {
  name: string;
  description?: string;
  example?: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Get the current max sort_order
  const { data: existingPrinciples } = await supabase
    .from('workshop_principles')
    .select('sort_order')
    .eq('cohort_id', cohortId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = (existingPrinciples?.[0]?.sort_order || 0) + 1

  const { data: newPrinciple, error } = await supabase
    .from('workshop_principles')
    .insert({
      cohort_id: cohortId,
      name: data.name,
      description: data.description,
      example: data.example,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating principle:', error)
    throw new Error('Failed to create principle')
  }

  revalidatePath('/hub/ai-lab')
  return newPrinciple
}

export async function updatePrinciple(principleId: string, data: {
  name?: string;
  description?: string;
  example?: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_principles')
    .update(data)
    .eq('id', principleId)

  if (error) {
    console.error('Error updating principle:', error)
    throw new Error('Failed to update principle')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function deletePrinciple(principleId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_principles')
    .delete()
    .eq('id', principleId)

  if (error) {
    console.error('Error deleting principle:', error)
    throw new Error('Failed to delete principle')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

// ============================================================
// CONTRIBUTORS (SHOWCASE ITEMS)
// ============================================================

export async function getContributors(cohortId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('workshop_showcase')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contributors:', error)
    throw new Error('Failed to load contributors')
  }

  return data
}

export async function createContributor(cohortId: string, data: {
  title: string;
  author?: string;
  type: 'video' | 'article' | 'audio' | 'aigen';
  url?: string;
  blurb?: string;
  meta?: string;
  theme?: string;
  is_paid?: boolean;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { data: newContributor, error } = await supabase
    .from('workshop_showcase')
    .insert({
      cohort_id: cohortId,
      title: data.title,
      author: data.author,
      type: data.type,
      url: data.url,
      blurb: data.blurb,
      meta: data.meta,
      theme: data.theme,
      is_paid: data.is_paid || false,
      created_by: profile.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating contributor:', error)
    throw new Error('Failed to create contributor')
  }

  revalidatePath('/hub/ai-lab')
  return newContributor
}

export async function updateContributor(contributorId: string, data: any) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_showcase')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', contributorId)

  if (error) {
    console.error('Error updating contributor:', error)
    throw new Error('Failed to update contributor')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function deleteContributor(contributorId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_showcase')
    .delete()
    .eq('id', contributorId)

  if (error) {
    console.error('Error deleting contributor:', error)
    throw new Error('Failed to delete contributor')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

// ============================================================
// APPROVALS QUEUE
// ============================================================

export async function getApprovalsQueue(cohortId: string, filter?: 'all' | 'deliverables' | 'showcase' | 'bookmarks', statusFilter: 'pending' | 'history' = 'pending') {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  let items: any[] = [];

  // 1. Fetch Engagements
  const kindMap: Record<string, string> = {
    'showcase': 'prompt',
    'bookmarks': 'bookmark'
  }
  
    if (!filter || filter === 'all' || filter === 'showcase' || filter === 'bookmarks') {
      let query = supabase
        .from('workshop_engagement')
        .select(`
          id, kind, title, url, source, created_at, status, content,
          profile:profiles!workshop_engagement_profile_id_fkey ( id, full_name, email )
        `)
        .eq('cohort_id', cohortId)

    if (statusFilter === 'history') {
      query = query.in('status', ['approved', 'rejected'])
    } else {
      query = query.eq('status', 'pending')
    }

    if (filter && filter !== 'all') {
      query = query.eq('kind', kindMap[filter])
    }

    const { data: engagements, error: engError } = await query
    if (engError) console.error('Error fetching engagements:', engError)
    
    if (engagements) {
      items = [...items, ...engagements]
    }
  }

  // 2. Fetch Deliverables
  if (!filter || filter === 'all' || filter === 'deliverables') {
    let progQuery = supabase
      .from('workshop_progress')
      .select(`
        id,
        workshop_day_id,
        profile_id,
        deliverable_status,
        deliverable_submitted_at,
        workshop_days!inner(cohort_id, title),
        profile:profiles!workshop_progress_profile_id_fkey ( id, full_name, email )
      `)
      .eq('workshop_days.cohort_id', cohortId)
      
    if (statusFilter === 'history') {
      progQuery = progQuery.in('deliverable_status', ['approved', 'rejected'])
    } else {
      progQuery = progQuery.eq('deliverable_status', 'submitted') // 'submitted' is pending
    }
    
    const { data: progress, error: progError } = await progQuery
    if (progError) console.error('Error fetching deliverables:', progError)
    
    if (progress && progress.length > 0) {
      const { data: submissions } = await supabase
        .from('workshop_deliverable_submissions')
        .select('*')
        .in('workshop_day_id', progress.map((p: any) => p.workshop_day_id))
        .in('profile_id', progress.map((p: any) => p.profile_id))

      const mappedProgress = progress.map((p: any) => {
        const sub = submissions?.find((s: any) => s.workshop_day_id === p.workshop_day_id && s.profile_id === p.profile_id)
        return {
          id: p.id,
          kind: 'deliverable',
          title: p.workshop_days.title || 'Pilot Deliverable',
          url: sub?.external_video_url || sub?.file_storage_path || null,
          content: sub?.submission_text || null,
          source: 'Pilot Workshops',
          created_at: p.deliverable_submitted_at || new Date().toISOString(),
          status: p.deliverable_status === 'submitted' ? 'pending' : p.deliverable_status,
          profile: p.profile
        }
      })
      items = [...items, ...mappedProgress]
    }
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return items
}

export async function reviewApprovalItem(id: string, kind: string, action: 'approve' | 'reject', note?: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')

  const supabase = createServerSupabaseClient()

  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  if (kind === 'deliverable') {
    const status = action === 'approve' ? 'approved' : 'rejected'
    const { error } = await supabase
      .from('workshop_progress')
      .update({
        deliverable_status: status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null
      })
      .eq('id', id)
      
    if (error) throw new Error(`Failed to ${action} deliverable: ${error.message}`)
  } else {
    const status = action === 'approve' ? 'approved' : 'rejected'
    const { error } = await supabase
      .from('workshop_engagement')
      .update({
        status: status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null
      })
      .eq('id', id)
      
    if (error) throw new Error(`Failed to ${action} engagement: ${error.message}`)
  }

  revalidatePath('/hub/ai-lab')
  revalidatePath('/admin/pilot-workshops')
  return { success: true }
}


// ============================================================
// PLATFORMS MANAGEMENT
// ============================================================

export async function getPlatforms(cohortId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('workshop_platforms')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching platforms:', error)
    // Return empty array if table doesn't exist yet
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return []
    }
    throw new Error('Failed to load platforms')
  }

  return data
}

export async function createPlatform(cohortId: string, data: {
  name: string;
  url: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Get the current max sort_order
  const { data: existingPlatforms } = await supabase
    .from('workshop_platforms')
    .select('sort_order')
    .eq('cohort_id', cohortId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = (existingPlatforms?.[0]?.sort_order || 0) + 1

  const { data: newPlatform, error } = await supabase
    .from('workshop_platforms')
    .insert({
      cohort_id: cohortId,
      name: data.name,
      url: data.url,
      is_default: false,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating platform:', error)
    throw new Error('Failed to create platform')
  }

  revalidatePath('/hub/ai-lab')
  return newPlatform
}

export async function updatePlatform(platformId: string, data: {
  name?: string;
  url?: string;
}) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  const { error } = await supabase
    .from('workshop_platforms')
    .update(data)
    .eq('id', platformId)

  if (error) {
    console.error('Error updating platform:', error)
    throw new Error('Failed to update platform')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}

export async function deletePlatform(platformId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required')
  }

  // Check if this is the default platform
  const { data: platform } = await supabase
    .from('workshop_platforms')
    .select('is_default')
    .eq('id', platformId)
    .single()

  if (platform?.is_default) {
    throw new Error('Cannot delete the default platform')
  }

  const { error } = await supabase
    .from('workshop_platforms')
    .delete()
    .eq('id', platformId)

  if (error) {
    console.error('Error deleting platform:', error)
    throw new Error('Failed to delete platform')
  }

  revalidatePath('/hub/ai-lab')
  return { success: true }
}
