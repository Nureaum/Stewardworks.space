import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic';

/**
 * GET /api/user-suggestions
 * Returns all resource suggestions submitted by the current user (env and workforce),
 * enriched with their engagement status if available.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = createServerSupabaseClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ suggestions: [] })
    }

    // Fetch both env_suggestion, wf_suggestion and lib_suggestion engagements directly from workshop_engagement
    const { data: engagements, error: engError } = await supabase
      .from('workshop_engagement')
      .select('id, title, url, source, status, content, kind, created_at')
      .eq('profile_id', profile.id)
      .in('kind', ['env_suggestion', 'wf_suggestion', 'lib_suggestion', 'job_quest_suggestion'])
      .order('created_at', { ascending: false })

    if (engError) {
      console.error('[env-suggestions API] Error fetching engagements:', engError)
      // Fall through — return empty
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = (engagements || []).map((e: any) => {
      let parsedContent: any = {}
      try {
        parsedContent = JSON.parse(e.content || '{}')
      } catch {}

      return {
        id: e.id,
        title: e.title,
        url: e.url || '',
        source: e.source || (e.kind === 'wf_suggestion' ? 'Workforce Pathways' : 'Environmental Literacy'),
        status: e.status || 'pending',
        kind: (e.kind === 'wf_suggestion' && parsedContent.type === 'job_quest') ? 'job_quest_suggestion' : e.kind,
        theme_id: parsedContent.theme_id || 'bioregion',
        library_item_id: parsedContent.library_item_id || null,
        created_at: e.created_at,
      }
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[env-suggestions API] Error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
