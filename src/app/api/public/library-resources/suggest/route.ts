export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  try {
    const body = await request.json()
    const { title, url, category, resource_type, note } = body
    
    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('community_suggestions')
      .insert({
        title,
        url,
        category,
        resource_type,
        note,
        status: 'pending',
        submitted_by_name: 'Anonymous Library User'
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
