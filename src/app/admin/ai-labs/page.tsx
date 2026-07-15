import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const metadata = {
  title: 'AI Labs Admin - Workbench',
}

export const dynamic = 'force-dynamic'

export default async function AdminAILabsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/admin')
  }

  // Redirect to the hub AI lab page - the admin/student toggle is handled in AILabClient
  redirect('/hub/ai-lab')
}

