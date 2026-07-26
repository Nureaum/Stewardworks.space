import ClientLibraryPage from './ClientLibraryPage';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LibraryPage() {
  const supabase = createServerSupabaseClient();
  
  let isAdmin = false;
  const { userId } = await auth();
  
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();
    if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
      isAdmin = true;
    }
  }

  const { data: categories } = await supabase
    .from('content_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: resources } = await supabase
    .from('content_items')
    .select(`
      *,
      category:content_categories(id, label, slug),
      topic:env_literacy_topics(id, label, slug),
      media:content_media(*)
    `)
    .eq('content_type', 'library_resource')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <ClientLibraryPage initialResources={resources || []} initialCategories={categories || []} isAdmin={isAdmin} />;
}
