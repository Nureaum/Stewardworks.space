export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  try {
    const body = await request.json()
    const { title, url, category, resource_type, note, directAdd, peerReviewed, sourceTag, submitter_name } = body

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 })
    }

    // Check if this is a direct add from an admin
    if (directAdd) {
      // Verify the user is an admin using Clerk
      const { userId } = await auth()
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('clerk_user_id', userId)
        .single()

      if (profileError || !profile) {
        console.error('Profile lookup error:', profileError)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      // Get the category ID
      let categoryId = null
      if (category) {
        const { data: existingCat } = await supabase
          .from('content_categories')
          .select('id')
          .eq('label', category)
          .single()

        if (existingCat) {
          categoryId = existingCat.id
        }
      }

      // Direct add to content_items table as published library resource
      const insertPayload: any = {
        title,
        body: note || '',
        content_type: 'library_resource',
        resource_type: resource_type || 'article',
        status: 'published',
        published_at: new Date().toISOString(),
        created_by: profile.id,
        updated_by: profile.id,
        peer_reviewed: peerReviewed || false,
        source_tag: sourceTag || null
      }
      
      // Only add category_id if we found one
      if (categoryId) {
        insertPayload.category_id = categoryId
      }

      const { data: insertedItem, error: insertError } = await supabase
        .from('content_items')
        .insert(insertPayload)
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      // Add the URL as a media item (external link)
      if (url && insertedItem?.id) {
        const { error: mediaError } = await supabase
          .from('content_media')
          .insert({
            content_item_id: insertedItem.id,
            media_type: 'external_link',
            url: url,
            label: title,
            sort_order: 0
          })

        if (mediaError) {
          console.error('Media insert error:', mediaError)
          // Don't throw - the main item was created successfully
        }
      }

      // Revalidate the library page to show the new resource
      revalidatePath('/hub/library', 'layout')

      return NextResponse.json({ success: true, directAdd: true })
    }

    // Regular suggestion flow for non-admins
    // Get current user info if available
    let finalSubmitterName = submitter_name || 'Anonymous Library User'
    const { userId } = await auth()
    
    let profileId = null;

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('clerk_user_id', userId)
        .single()
      
      if (profile) {
        profileId = profile.id;
        if (!submitter_name && profile.full_name) {
          finalSubmitterName = profile.full_name
        }
      }
    }

    // Insert the suggestion first
    const { data: insertedSug, error } = await supabase
      .from('community_suggestions')
      .insert({
        title,
        url,
        category,
        resource_type,
        note,
        status: 'pending',
        submitted_by_name: finalSubmitterName
      })
      .select()
      .single()

    if (error) {
      console.error('Suggestion insert error:', error)
      throw error
    }

    // If user is logged in, create the pending engagement and link it
    if (profileId && insertedSug) {
      // Find the user's most recent cohort
      const { data: anyReg } = await supabase
        .from('workshop_registrations')
        .select('cohort_id')
        .eq('profile_id', profileId)
        .eq('status', 'registered')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let cohortId = anyReg?.cohort_id;
      if (!cohortId) {
        const { data: anyCohort } = await supabase
          .from('cohorts')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        cohortId = anyCohort?.id;
      }

      if (cohortId) {
        const { data: engRecord, error: engError } = await supabase
          .from('workshop_engagement')
          .insert({
            cohort_id: cohortId,
            profile_id: profileId,
            kind: 'lib_suggestion',
            title: title,
            source: 'Steward Library',
            url: url || '',
            content: JSON.stringify({
              suggestion_id: insertedSug.id,
              category: category,
              resource_type: resource_type,
              note: note
            }),
            status: 'pending',
          })
          .select()
          .single();

        if (engRecord && !engError) {
          // Link back to community_suggestions
          await supabase
            .from('community_suggestions')
            .update({ submitter_engagement_id: engRecord.id })
            .eq('id', insertedSug.id);
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
