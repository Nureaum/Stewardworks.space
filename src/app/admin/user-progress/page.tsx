import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const metadata = {
  title: 'User Progress - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminUserProgressPage() {
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

  // Find the latest active cohort and redirect to its journey admin with progress section
  const { data: latestCohort } = await supabase
    .from('cohorts')
    .select('id')
    .in('status', ['open', 'completed'])
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (latestCohort) {
    redirect(`/hub/pilot-workshops/${latestCohort.id}/journey?mode=admin&section=progress`)
  } else {
    redirect('/hub/pilot-workshops')
  }
}
