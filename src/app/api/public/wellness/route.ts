export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const [resourcesRes, tonesRes] = await Promise.all([
      supabase
        .from('wellness_resources')
        .select('slot_key, label, title, description, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('wellness_tones')
        .select('id, name, frequency, wave_type, gain, audio_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

    return NextResponse.json({
      resources: resourcesRes.data || [],
      tones: tonesRes.data || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching wellness data:', error)
    return NextResponse.json(
      { resources: [], tones: [] },
      { status: 500 }
    )
  }
}
