'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { HelpdeskAnswer } from '@/types/helpdesk'

async function getProfileId() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  return profile
}

export async function getAnswersForQuestion(questionId: string): Promise<HelpdeskAnswer[]> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('helpdesk_answers')
    .select(`
      *,
      author:author_id(id, full_name, email, role)
    `)
    .eq('question_id', questionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as HelpdeskAnswer[]
}

export async function createAnswer(questionId: string, content: string) {
  const profile = await getProfileId()
  
  // Only admins/staff can answer, based on rules
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    throw new Error('Only staff can answer questions')
  }

  const supabase = createServerSupabaseClient()

  // Verify question exists and isn't closed
  const { data: question } = await supabase
    .from('helpdesk_questions')
    .select('author_id, status, title')
    .eq('id', questionId)
    .single()
    
  if (!question) throw new Error('Question not found')
  
  // 1. Create Answer (will fail if one already exists due to UNIQUE constraint on question_id)
  const { data: answer, error } = await supabase
    .from('helpdesk_answers')
    .insert({
      question_id: questionId,
      author_id: profile.id,
      content
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('This question already has an answer')
    }
    throw error
  }

  // 2. Update Question Status to answered
  await supabase
    .from('helpdesk_questions')
    .update({ status: 'answered' })
    .eq('id', questionId)

  // 3. Create Notification for the student
  await supabase
    .from('helpdesk_notifications')
    .insert({
      user_id: question.author_id,
      title: 'Question Answered',
      message: `Your question "${question.title}" has received an answer from staff.`,
      link: `/hub/helpdesk/${questionId}`
    })

  return answer
}

export async function deleteAnswer(id: string) {
  const profile = await getProfileId()
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    throw new Error('Unauthorized')
  }

  const supabase = createServerSupabaseClient()
  
  // get the question_id first to potentially reset question status
  const { data: answer } = await supabase.from('helpdesk_answers').select('question_id').eq('id', id).single()
  if (!answer) return

  const { error } = await supabase.from('helpdesk_answers').delete().eq('id', id)
  if (error) throw error

  // Revert question status back to open if the only answer was deleted
  await supabase
    .from('helpdesk_questions')
    .update({ status: 'open' })
    .eq('id', answer.question_id)
}
