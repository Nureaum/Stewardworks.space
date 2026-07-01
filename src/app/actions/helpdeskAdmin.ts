'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

async function ensureAdmin() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    throw new Error('Unauthorized: Admins only')
  }
  
  return profile
}

export async function createCategory(name: string, description: string) {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('helpdesk_categories')
    .insert({ name, description })
    
  if (error) throw error
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('helpdesk_categories')
    .update({ is_active: isActive })
    .eq('id', id)
    
  if (error) throw error
}

export async function createTag(name: string) {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('helpdesk_tags')
    .insert({ name: name.toLowerCase().replace(/\s+/g, '-') })
    
  if (error) throw error
}

export async function toggleTagStatus(id: string, isActive: boolean) {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('helpdesk_tags')
    .update({ is_active: isActive })
    .eq('id', id)
    
  if (error) throw error
}

export async function getAllCategories() {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('helpdesk_categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getAllTags() {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('helpdesk_tags')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function hardDeleteQuestion(id: string) {
  await ensureAdmin()
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('helpdesk_questions')
    .delete()
    .eq('id', id)
    
  if (error) throw error
}

export async function answerQuestion(questionId: string, content: string, isFaq: boolean = false) {
  const profile = await ensureAdmin()
  const supabase = createServerSupabaseClient()
  
  // Get question details to notify the author
  const { data: question, error: qError } = await supabase
    .from('helpdesk_questions')
    .select('author_id, title')
    .eq('id', questionId)
    .single()
    
  if (qError) throw qError

  const { data: existingAnswer } = await supabase
    .from('helpdesk_answers')
    .select('id, author_id')
    .eq('question_id', questionId)
    .maybeSingle()

  if (existingAnswer) {
    if (existingAnswer.author_id !== profile.id && profile.role !== 'super_admin') {
      throw new Error('Unauthorized to edit this answer')
    }
    const { error: updateAnswerError } = await supabase
      .from('helpdesk_answers')
      .update({
        content,
        is_promoted_to_faq: isFaq
      })
      .eq('question_id', questionId)
      
    if (updateAnswerError) throw updateAnswerError
  } else {
    // Insert the answer
    const { error: answerError } = await supabase
      .from('helpdesk_answers')
      .insert({
        question_id: questionId,
        author_id: profile.id,
        content,
        is_promoted_to_faq: isFaq
      })
      
    if (answerError) throw answerError

    // Update question status to answered
    const { error: updateError } = await supabase
      .from('helpdesk_questions')
      .update({ status: 'answered', updated_at: new Date().toISOString() })
      .eq('id', questionId)

    if (updateError) throw updateError

    // Create notification for the user
    const { error: notifError } = await supabase
      .from('helpdesk_notifications')
      .insert({
        user_id: question.author_id,
        title: 'Your question was answered!',
        message: `An admin has responded to your question: "${question.title}"`,
        link: `/hub/helpdesk/${questionId}`
      })

    if (notifError) throw notifError
  }
}
