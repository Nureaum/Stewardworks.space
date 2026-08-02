import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('onboarding_questions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ questions: data });
  } catch (error: any) {
    console.error('Failed to fetch onboarding questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const supabase = createServerSupabaseClient();

    // Get max sort_order
    const { data: maxData } = await supabase
      .from('onboarding_questions')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextSortOrder = (maxData?.[0]?.sort_order || 0) + 1;

    const newQuestion = {
      title_en: body.title_en,
      title_es: body.title_es,
      type: body.type,
      is_required: body.is_required,
      section: body.section,
      options_en: body.options_en || [],
      options_es: body.options_es || [],
      sort_order: nextSortOrder,
    };

    const { data, error } = await supabase
      .from('onboarding_questions')
      .insert(newQuestion)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question: data });
  } catch (error: any) {
    console.error('Failed to create onboarding question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
