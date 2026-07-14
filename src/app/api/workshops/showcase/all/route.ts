import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

/**
 * GET /api/workshops/showcase/all
 * Fetches ONLY admin-added contributor showcase items (NOT student submissions)
 * Filters out any items created by students or marked as student work
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch showcase items, but exclude student-created items
    // We filter by checking if the author field contains "Student" or if the theme is "Student Work"
    const { data: allItems, error } = await supabase
      .from('workshop_showcase')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch contributor showcase items error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch showcase items', details: error.message },
        { status: 500 }
      );
    }
    
    // Filter out student submissions
    // Keep only items where author is NOT "Student" and blurb doesn't contain "Student"
    const contributorItems = (allItems || []).filter((item: any) => {
      const author = item.author?.toLowerCase() || '';
      const blurb = item.blurb?.toLowerCase() || '';
      const theme = item.theme?.toLowerCase() || '';
      const meta = item.meta?.toLowerCase() || '';
      
      // Exclude if it's marked as student work
      const isStudentWork = 
        author === 'student' ||
        blurb.includes('student') ||
        theme.includes('student') ||
        meta.includes('student') ||
        blurb.includes('submitted via');
      
      return !isStudentWork;
    });
    
    console.log(`[Showcase API] Total items in DB: ${allItems?.length || 0}, Contributor items (filtered): ${contributorItems.length}`);
    
    return NextResponse.json({ items: contributorItems });
  } catch (err) {
    console.error('Unexpected error fetching showcase items:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
