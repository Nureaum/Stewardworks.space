import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const supabase = createServerSupabaseClient();

    const updateData = {
      title_en: body.title_en,
      title_es: body.title_es,
      type: body.type,
      is_required: body.is_required,
      section: body.section,
      options_en: body.options_en || [],
      options_es: body.options_es || [],
      sort_order: body.sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('onboarding_questions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question: data });
  } catch (error: any) {
    console.error('Failed to update onboarding question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('onboarding_questions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete onboarding question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
