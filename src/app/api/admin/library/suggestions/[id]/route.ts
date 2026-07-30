export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status, title, url, note, category, resource_type } = body

  if (status && !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateData: any = { updated_at: new Date().toISOString() }
  if (status) updateData.status = status
  if (title !== undefined) updateData.title = title
  if (url !== undefined) updateData.url = url
  if (note !== undefined) updateData.note = note
  if (category !== undefined) updateData.category = category
  if (resource_type !== undefined) updateData.resource_type = resource_type

  const { data, error } = await supabase
    .from('community_suggestions')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'approved' && data) {
    let category_id = null
    if (data.category && data.category !== 'Uncategorized') {
      const { data: catData } = await supabase.from('content_categories').select('id').ilike('label', data.category).single()
      if (catData) category_id = catData.id
    }

    const { data: newItem, error: insertError } = await supabase.from('content_items').insert({
      title: data.title,
      body: data.note || '',
      category_id,
      resource_type: data.resource_type || 'article',
      content_type: 'library_resource',
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: profile.id,
      updated_by: profile.id
    }).select().single()

    if (!insertError && newItem && data.url) {
      await supabase.from('content_media').insert({
        content_item_id: newItem.id,
        media_type: 'link',
        url: data.url,
        sort_order: 0,
        title: 'Resource Link'
      })
      
      // Update engagement if it exists
      if (data.submitter_engagement_id) {
        const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', data.submitter_engagement_id).single();
        if (engData?.profile_id) {
          await supabase.from('helpdesk_notifications').insert({
            user_id: engData.profile_id,
            title: 'Suggestion Approved',
            message: `Your suggestion "${data.title}" has been approved and added!`,
            is_read: false
          });
        }

        await supabase.from('workshop_engagement').update({ 
          status: 'approved',
          content: JSON.stringify({
            suggestion_id: data.id,
            category: data.category,
            resource_type: data.resource_type,
            library_item_id: newItem.id
          })
        }).eq('id', data.submitter_engagement_id).eq('kind', 'lib_suggestion');
      }

      // Revalidate the public library page so it updates instantly
      revalidatePath('/hub/library')
      revalidatePath('/admin/library')
    }
  } else if (status === 'rejected' && data && data.submitter_engagement_id) {
    const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', data.submitter_engagement_id).single();
    if (engData?.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: engData.profile_id,
        title: 'Suggestion Reviewed',
        message: `Your suggestion was reviewed but not added at this time.`,
        is_read: false
      });
    }

    await supabase.from('workshop_engagement').update({ 
      status: 'rejected'
    }).eq('id', data.submitter_engagement_id).eq('kind', 'lib_suggestion');
  }

  return NextResponse.json({ suggestion: data })
}
