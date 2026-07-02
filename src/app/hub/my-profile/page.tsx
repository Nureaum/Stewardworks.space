import ClientProfile from './ClientProfile';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function MyProfilePage() {
  const { userId } = await auth();
  let initialProfile = null;

  if (userId) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
      
    if (data) {
      initialProfile = data;
    }
  }

  return <ClientProfile initialProfile={initialProfile} />;
}
