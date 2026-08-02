import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { content } = body;
    
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('agreements')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;
    
    // Revalidate the agreements page and API to clear cache
    revalidatePath('/agreements');
    revalidatePath('/api/agreements');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
