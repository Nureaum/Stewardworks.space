import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('clerk_user_id', userId).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { fileName, bucketName = 'content-uploads' } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 })
    }

    const fileExt = fileName.split('.').pop() || ''
    const generatedName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `editor_media/${generatedName}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to create signed URL' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      token: data.token,
      filePath,
      publicUrl
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
