import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { answers } = body; // Array of { question_id, answer_text, answer_array }
    const supabase = createServerSupabaseClient();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Insert answers
    const answersToInsert = answers.map((a: any) => ({
      clerk_user_id: userId,
      question_id: a.question_id,
      answer_text: a.answer_text || null,
      answer_array: a.answer_array || null,
    }));

    const { error: insertError } = await supabase
      .from('onboarding_answers')
      .upsert(answersToInsert, { onConflict: 'clerk_user_id,question_id' });

    if (insertError) {
      console.error('Failed to insert answers:', insertError);
      throw insertError;
    }

    // Update profile onboarding_completed status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('clerk_user_id', userId);

    if (profileError) {
      console.error('Failed to update profile onboarding status:', profileError);
      throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save onboarding answers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
