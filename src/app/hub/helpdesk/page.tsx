import { getQuestions, getCategories, getTags, getFaqs } from '@/app/actions/helpdeskActions'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import HelpdeskUI from './HelpdeskUI'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Help Desk'
}

export default async function HelpdeskPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string }
}) {
  const [questions, categories, tags, faqs] = await Promise.all([
    getQuestions(searchParams.category, searchParams.tag),
    getCategories(),
    getTags(),
    getFaqs()
  ])

  const { userId } = await auth()
  let profileId = null
  let isAdmin = false
  if (userId) {
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('id, role').eq('clerk_user_id', userId).single()
    if (profile) {
      profileId = profile.id
      isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
    }
  }

  const myQuestions = questions.filter(q => q.author?.id === profileId)

  return (
    <HelpdeskUI 
      categories={categories} 
      tags={tags} 
      faqs={faqs} 
      myQuestions={myQuestions} 
      isAdmin={isAdmin}
    />
  )
}
