import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Public endpoint — anyone on the Chia page can fetch active documents
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('program_documents')
      .select('id, label, pdf_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ documents: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
