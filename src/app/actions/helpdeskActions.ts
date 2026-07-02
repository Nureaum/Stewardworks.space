'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { HelpdeskQuestion, HelpdeskCategory, HelpdeskTag } from '@/types/helpdesk'
import { revalidatePath } from 'next/cache'

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

export async function getCategories(): Promise<HelpdeskCategory[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('helpdesk_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data as HelpdeskCategory[]
}

export async function getTags(): Promise<HelpdeskTag[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('helpdesk_tags')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data as HelpdeskTag[]
}

export async function getFaqs() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('helpdesk_answers')
    .select(`
      id,
      content,
      created_at,
      is_promoted_to_faq,
      question:helpdesk_questions (
        id,
        title,
        description,
        view_count,
        status,
        created_at,
        category:category_id (name)
      ),
      author:author_id (
        id,
        full_name,
        role
      )
    `)
    .eq('is_promoted_to_faq', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getQuestions(categoryId?: string, tagId?: string): Promise<HelpdeskQuestion[]> {
  const supabase = createServerSupabaseClient()
  
  let query = supabase
    .from('helpdesk_questions')
    .select(`
      *,
      category:category_id(*),
      author:author_id(id, full_name, email, role),
      tags:helpdesk_question_tags(helpdesk_tags(*)),
      answers:helpdesk_answers(author:author_id(full_name, email))
    `)
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  
  if (error) throw error

  // Filter by tag if provided (since it's a join, we filter in memory or via a different query, 
  // but for simplicity in memory if data isn't huge, or we can use Supabase nested filtering)
  let results = (data as any[]) || []

  if (tagId) {
    results = results.filter(q => (q.tags || []).some((t: any) => t.helpdesk_tags.id === tagId))
  }

  return results.map(q => ({
    ...q,
    tags: (q.tags || []).map((t: any) => t.helpdesk_tags)
  })) as HelpdeskQuestion[]
}

export async function getQuestionById(id: string): Promise<HelpdeskQuestion> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('helpdesk_questions')
    .select(`
      *,
      category:category_id(*),
      author:author_id(id, full_name, email, role),
      tags:helpdesk_question_tags(helpdesk_tags(*))
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null as any
    console.error("Supabase error in getQuestionById:", error)
    throw new Error(error.message)
  }
  
  const question = data as any
  return {
    ...question,
    tags: question.tags ? question.tags.map((t: any) => t.helpdesk_tags) : []
  } as HelpdeskQuestion
}

export async function createQuestion(formData: FormData) {
  const profile = await getProfileId()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const tagIds = formData.getAll('tags') as string[] // array of tag IDs
  
  if (!title || !description || !category_id) {
    throw new Error('Missing required fields')
  }

  const supabase = createServerSupabaseClient()

  // 1. Create Question
  const { data: question, error } = await supabase
    .from('helpdesk_questions')
    .insert({
      title,
      description,
      category_id,
      author_id: profile.id,
      status: 'open'
    })
    .select()
    .single()

  if (error) throw error

  // 2. Add Tags
  if (tagIds.length > 0) {
    const questionTags = tagIds.map(tag_id => ({
      question_id: question.id,
      tag_id
    }))
    const { error: tagError } = await supabase
      .from('helpdesk_question_tags')
      .insert(questionTags)
    
    if (tagError) {
      console.error('Failed to add tags', tagError)
    }
  }

  revalidatePath('/hub/helpdesk', 'layout')
  revalidatePath('/admin/helpdesk', 'layout')
  return question.id
}

export async function deleteQuestion(id: string) {
  const profile = await getProfileId()
  const supabase = createServerSupabaseClient()
  
  const { data: question } = await supabase.from('helpdesk_questions').select('author_id, status').eq('id', id).single()
  
  if (!question) throw new Error('Question not found')
  
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    if (question.author_id !== profile.id) throw new Error('Unauthorized')
    if (question.status !== 'open') throw new Error('Cannot delete answered questions')
  }

  const { error } = await supabase.from('helpdesk_questions').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/hub/helpdesk', 'layout')
  revalidatePath('/admin/helpdesk', 'layout')
}

export async function incrementViewCount(id: string) {
  const supabase = createServerSupabaseClient()
  
  // Since we are using RPC usually for increment, we can just do a select/update or better RPC
  const { data } = await supabase.from('helpdesk_questions').select('view_count').eq('id', id).single()
  if (data) {
    await supabase.from('helpdesk_questions').update({ view_count: data.view_count + 1 }).eq('id', id)
  }
}
