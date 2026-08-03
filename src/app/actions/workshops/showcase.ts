'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Gets all showcase items for a cohort
 */
export async function getShowcaseItems(cohortId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('workshop_showcase')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Get showcase items error:', error)
    return []
  }
  
  // Backfill content_item_id if the column doesn't exist or is null
  if (data && data.length > 0) {
    const missingIds = data.filter((d: any) => !d.content_item_id).map((d: any) => d.title)
    if (missingIds.length > 0) {
      const { data: libraryItems } = await supabase
        .from('content_items')
        .select('id, title, created_at')
        .in('title', missingIds)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        
      if (libraryItems && libraryItems.length > 0) {
        data.forEach((d: any) => {
          if (!d.content_item_id) {
            const match = libraryItems.find((l: any) => l.title === d.title)
            if (match) {
              d.content_item_id = match.id
            }
          }
        })
      }
    }
  }
  
  return data || []
}

/**
 * Gets approved deliverables that requested showcase for a given cohort
 */
export async function getStudentShowcaseDeliverables(cohortId: string) {
  const supabase = createServerSupabaseClient()
  
  // 1. Fetch approved progress rows for the cohort
  const { data: progressRows, error: progressError } = await supabase
    .from('workshop_progress')
    .select(`
      id,
      workshop_day_id,
      profile_id,
      deliverable_status,
      workshop_days!inner(cohort_id, title),
      profiles!workshop_progress_profile_id_fkey(full_name, email)
    `)
    .eq('workshop_days.cohort_id', cohortId)
    .eq('deliverable_status', 'approved')
    
  if (progressError || !progressRows || progressRows.length === 0) {
    if (progressError) console.error('Get showcase deliverables error:', progressError)
    return []
  }

  // 2. Fetch the corresponding submissions
  const { data: submissions, error: subError } = await supabase
    .from('workshop_deliverable_submissions')
    .select('*')
    .in('workshop_day_id', progressRows.map(p => p.workshop_day_id))
    .in('profile_id', progressRows.map(p => p.profile_id))
    .order('submitted_at', { ascending: false })

  if (subError) {
    console.error('Get showcase submissions error:', subError)
    return []
  }

  // 3. Match and filter for SHOWCASE_REQUESTED
  const latestSubmissions = (submissions || []).reduce((acc, sub) => {
    const key = `${sub.workshop_day_id}|${sub.profile_id}`
    if (!acc[key]) {
      acc[key] = sub
    }
    return acc
  }, {} as Record<string, any>)

  const showcaseItems = progressRows.map((progress: any) => {
    const key = `${progress.workshop_day_id}|${progress.profile_id}`
    const sub = latestSubmissions[key]
    
    // Only include if they requested showcase
    if (!sub || !sub.submission_text || !sub.submission_text.includes('[SHOWCASE_REQUESTED]')) {
      return null
    }

    // Format like a showcase generation so the UI handles it easily
    return {
      id: progress.id,
      kind: 'generation',
      title: progress.workshop_days?.title || 'Deliverable Submission',
      content: JSON.stringify({
        showcaseVisible: true,
        type: 'deliverable'
      }),
      url: sub.external_video_url || sub.file_storage_path || '',
      status: 'approved',
      profiles: progress.profiles,
      created_at: sub.submitted_at
    }
  }).filter(Boolean)

  return showcaseItems
}

/**
 * Adds a new showcase contribution (admin or student)
 * Also creates a library resource entry under "How to Use AI" category
 */
export async function addShowcaseItem(cohortId: string, data: {
  title: string
  author?: string
  type: string
  url?: string
  blurb?: string
  meta?: string
  theme?: string
  is_paid?: boolean
  project_type?: string | null
}) {
  console.log('=== START addShowcaseItem ===')
  console.log('Input data:', { cohortId, ...data })
  
  const { userId } = await auth()
  if (!userId) {
    console.error('No userId from auth')
    throw new Error('Authentication required')
  }
  console.log('Authenticated userId:', userId)
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) {
    console.error('Profile not found for userId:', userId)
    throw new Error('Profile not found')
  }
  console.log('Profile found:', profile.id)
  
  // 1. Create the showcase item
  console.log('Step 1: Creating showcase item...')
  const { data: item, error } = await supabase
    .from('workshop_showcase')
    .insert({
      cohort_id: cohortId,
      title: data.title,
      author: data.author || '',
      type: data.type,
      url: data.url || '',
      blurb: data.blurb || '',
      meta: data.meta || '',
      theme: data.theme || '',
      is_paid: data.is_paid || false,
      created_by: profile.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Add showcase item error:', error)
    throw new Error(`Failed to add showcase item: ${error.message}`)
  }
  console.log('Showcase item created successfully:', item.id)
  
  // 2. Get or create "How to Use AI" category
  console.log('Step 2: Getting or creating "How to Use AI" category...')
  let categoryId = null
  
  // Try to find the category by label first (most reliable)
  const { data: categoryByLabel, error: labelError } = await supabase
    .from('content_categories')
    .select('id, label, slug')
    .ilike('label', 'How to Use AI')
    .limit(1)
    .maybeSingle()
  
  if (labelError) {
    console.error('Category query by label error:', labelError)
  }
  
  if (categoryByLabel) {
    categoryId = categoryByLabel.id
    console.log('✅ Found existing category by label:', categoryId, categoryByLabel.label)
  } else {
    // Try by slug as fallback
    const { data: categoryBySlug, error: slugError } = await supabase
      .from('content_categories')
      .select('id, label, slug')
      .eq('slug', 'how-to-use-ai')
      .limit(1)
      .maybeSingle()
    
    if (slugError) {
      console.error('Category query by slug error:', slugError)
    }
    
    if (categoryBySlug) {
      categoryId = categoryBySlug.id
      console.log('✅ Found existing category by slug:', categoryId, categoryBySlug.label)
    } else {
      console.log('⚠️ Category not found, creating new "How to Use AI" category...')
      // Create the category if it doesn't exist
      const { data: newCategory, error: createCatError } = await supabase
        .from('content_categories')
        .insert({
          label: 'How to Use AI',
          slug: 'how-to-use-ai',
          icon: '◈'
        })
        .select('id')
        .single()
      
      if (createCatError) {
        console.error('❌ Failed to create category:', createCatError)
      } else if (newCategory) {
        categoryId = newCategory.id
        console.log('✅ Category created successfully:', categoryId)
      }
    }
  }
  
  if (!categoryId) {
    console.error('❌ CRITICAL: Could not get or create category ID!')
  } else {
    console.log('✅ Using category ID:', categoryId)
  }
  
  // 3. Map showcase type to library resource type
  const resourceTypeMap: Record<string, string> = {
    'video': 'video',
    'article': 'article',
    'audio': 'article',
    'aigen': 'other'
  }
  
  const mappedType = resourceTypeMap[data.type] || 'video'
  console.log('Step 3: Mapped type:', data.type, '->', mappedType)
  
  // 4. Create the library resource (only if we have a category)
  if (categoryId) {
    console.log('Step 4: Creating library resource...')
    const libraryPayload: any = {
      content_type: 'library_resource',
      title: data.title,
      body: data.blurb || '',
      resource_type: mappedType,
      category_id: categoryId,
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: profile.id,
      updated_by: profile.id,
      source_tag: 'contributor',
    }
    
    // Add external_url if the column exists (some schemas may not have it)
    if (data.url) {
      libraryPayload.external_url = data.url
    }
    
    console.log('📦 Library payload:', JSON.stringify(libraryPayload, null, 2))
    
    let libraryResource: any = null
    let libraryError: any = null
    
    // Try insert with external_url first
    const result1 = await supabase
      .from('content_items')
      .insert(libraryPayload)
      .select()
      .single()
    
    if (result1.error) {
      // If it fails (possibly due to external_url column not existing), try without it
      console.log('First insert attempt failed, trying without external_url...')
      delete libraryPayload.external_url
      const result2 = await supabase
        .from('content_items')
        .insert(libraryPayload)
        .select()
        .single()
      libraryResource = result2.data
      libraryError = result2.error
    } else {
      libraryResource = result1.data
      libraryError = result1.error
    }
    
    if (libraryError) {
      console.error('❌ Add library resource FAILED!')
      console.error('Error code:', libraryError.code)
      console.error('Error message:', libraryError.message)
      console.error('Error details:', libraryError.details)
      console.error('Error hint:', libraryError.hint)
      // Don't throw - showcase item was already created successfully
    } else {
      console.log('✅ Library resource created successfully!')
      console.log('Library resource ID:', libraryResource.id)
      
      // Try to link the showcase item to the library resource (column may not exist yet)
      try {
        await supabase
          .from('workshop_showcase')
          .update({ content_item_id: libraryResource.id })
          .eq('id', item.id)
      } catch (linkErr) {
        console.log('Note: content_item_id column may not exist on workshop_showcase yet')
      }
      
      // Create media entry for the URL if provided
      if (data.url) {
        console.log('Step 4b: Creating media entry for URL...')
        // Detect appropriate media type from URL
        const urlLower = data.url.toLowerCase()
        let mediaType = 'external_link'
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$|\/)/i.test(urlLower) || urlLower.includes('placehold') || urlLower.includes('/uploads/')) {
          mediaType = 'image'
        } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('vimeo.com') || /\.(mp4|webm|mov)/i.test(urlLower)) {
          mediaType = 'video_link'
        } else if (/\.(mp3|wav|ogg|m4a|flac|aac)/i.test(urlLower) || urlLower.includes('soundcloud.com')) {
          mediaType = 'audio_link'
        }
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('content_media')
          .insert({
            content_item_id: libraryResource.id,
            media_type: mediaType,
            url: data.url,
            label: data.title,
            sort_order: 0
          })
          .select()
        
        if (mediaError) {
          console.error('❌ Failed to create media entry:', mediaError)
        } else {
          console.log('✅ Media entry created successfully:', mediaData)
        }
      }
    }
  } else {
    console.error('⚠️ Skipping library resource creation - no valid category ID')
  }
  
  console.log('Step 5: Revalidating paths...')
  revalidatePath('/hub/pilot-workshops')
  revalidatePath('/hub/library')
  
  console.log('=== END addShowcaseItem ===')
  return item
}

/**
 * Updates an existing showcase item
 */
export async function updateShowcaseItem(itemId: string, data: {
  title?: string
  author?: string
  type?: string
  url?: string
  blurb?: string
  meta?: string
  theme?: string
  is_paid?: boolean
  project_type?: string | null
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { data: item, error } = await supabase
    .from('workshop_showcase')
    .update(data)
    .eq('id', itemId)
    .select()
    .single()
  
  if (error) {
    console.error('Update showcase item error:', error)
    throw new Error(`Failed to update showcase item: ${error.message}`)
  }
  
  revalidatePath('/hub/pilot-workshops')
  return item
}

/**
 * Deletes a showcase item
 */
export async function deleteShowcaseItem(itemId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('workshop_showcase')
    .delete()
    .eq('id', itemId)
  
  if (error) {
    console.error('Delete showcase item error:', error)
    throw new Error(`Failed to delete showcase item: ${error.message}`)
  }
  
  revalidatePath('/hub/pilot-workshops')
  return true
}

/**
 * Seeds default showcase items for a cohort (admin only)
 */
export async function seedShowcaseItems(cohortId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  
  const SEED_DATA = [
    { type: 'video', title: 'Prompting in Two Tongues', author: 'Rosa Delgado', meta: '8:24 · Video Lesson', is_paid: true, blurb: 'A bilingual walk-through of prompt design that honors code-switching — building AI queries that respect both English and Spanish without flattening either language.', theme: 'Bilingual AI' },
    { type: 'audio', title: 'Calexico Sound Map', author: 'DJ Frontera', meta: '12:01 · Audio Guide', is_paid: true, blurb: 'A field recording collage layered with narration — mapping the sonic identity of the border from train horns to cumbia bass to the hum of the new data center cooling towers.', theme: 'Soundscapes' },
    { type: 'article', title: 'Water Ledger: Tracking the Colorado', author: 'Río Lab Collective', meta: 'Article · 2,400 words', is_paid: false, blurb: 'An open-source data story tracking how each drop of the Colorado River is allocated between agriculture, cities, lithium extraction, and the data centers that now compete for the same aquifer.', theme: 'Data Journalism' },
    { type: 'aigen', title: 'Desert Solarpunk Zine', author: 'AI Lab Community', meta: 'AI Generation Pack', is_paid: false, blurb: 'A collaboratively prompted zine imagining Imperial County in 2040 — solar canals, community mesh networks, bilingual digital murals, and a Salton Sea that came back to life.', theme: 'Speculative Design' },
    { type: 'video', title: 'Résumé Rebuild Live', author: 'Coach V', meta: '22:15 · Video Lesson', is_paid: true, blurb: `A screen-share workshop where a real participant's résumé is rebuilt on-camera using AI assistance — showing how to keep authentic voice while meeting ATS keyword filters.`, theme: 'Career Tools' },
    { type: 'article', title: 'The Gig Glossary', author: 'Steward Research', meta: 'Article · 1,800 words', is_paid: false, blurb: 'A plain-language glossary of gig-economy terms — from 1099 classification to platform fees — written for first-generation freelancers navigating the new labor landscape.', theme: 'Workforce Literacy' },
    { type: 'audio', title: 'Midnight Mic: Student Oral Histories', author: 'SDSU Imperial Valley', meta: '18:32 · Audio Series', is_paid: true, blurb: 'Three students tell the story of their families crossing, staying, and building — recorded in a late-night open-mic format that blends interview and spoken word.', theme: 'Oral History' },
    { type: 'aigen', title: 'Prompt Library: Environmental Justice', author: 'AI Lab Community', meta: 'Prompt Collection', is_paid: false, blurb: 'Thirty curated prompts designed to generate environmental justice content — covering air quality reports, water-rights maps, community action plans, and multilingual outreach materials.', theme: 'Prompt Engineering' },
    { type: 'video', title: 'Portfolio Launch Day', author: 'StewardWorks', meta: '14:40 · Video Lesson', is_paid: true, blurb: 'End-to-end walkthrough of shipping a vibe-coded portfolio — from choosing a static-site generator to wiring a custom domain and embedding AI-generated assets as proof of work.', theme: 'Portfolio' },
  ]

  const itemsToInsert = SEED_DATA.map(item => ({
    ...item,
    cohort_id: cohortId,
    url: '',
    created_by: profile.id,
  }))

  const { data, error } = await supabase
    .from('workshop_showcase')
    .insert(itemsToInsert)
    .select()

  if (error) {
    console.error('Seed showcase items error:', error)
    throw new Error(`Failed to seed showcase items: ${error.message}`)
  }

  revalidatePath('/hub/pilot-workshops')
  return data
}
