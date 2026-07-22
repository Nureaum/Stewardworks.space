import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user's workshop character for this cohort
    const { data: character } = await supabase
      .from('workshop_characters')
      .select('character_key, accent_color, gear, outfit, player_name')
      .eq('cohort_id', params.cohortId)
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!character) {
      return NextResponse.json({ character_key: 'quest', accent_color: '#ffd23f', gear: 'none', outfit: 'plain' });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json({ character_key: 'quest', accent_color: '#ffd23f', gear: 'none', outfit: 'plain' });
  }
}
