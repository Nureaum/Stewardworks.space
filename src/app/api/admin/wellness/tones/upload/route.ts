export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
  'audio/x-m4a',
  'audio/mp4',
]

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate audio type — accept by type or by extension fallback
    const isAudioType = file.type.startsWith('audio/') || ALLOWED_AUDIO_TYPES.includes(file.type)
    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
    const isAudioExt = ['mp3', 'wav', 'ogg', 'webm', 'aac', 'flac', 'm4a', 'mp4'].includes(ext)

    if (!isAudioType && !isAudioExt) {
      return NextResponse.json({ error: 'File must be an audio file (mp3, wav, ogg, etc.)' }, { status: 400 })
    }

    // Determine content-type — some browsers send 'application/octet-stream' for audio
    const contentType = file.type.startsWith('audio/') ? file.type : `audio/${ext === 'mp3' ? 'mpeg' : ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `tone-${Date.now()}.${ext}`
    const storagePath = `wellness_tones/${filename}`

    // Upload to Supabase Storage (works in serverless / Vercel — no local filesystem needed)
    const { error: uploadError } = await supabase.storage
      .from('content-uploads')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Storage upload failed' }, { status: 500 })
    }

    // Get the permanent public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-uploads')
      .getPublicUrl(storagePath)

    // Return `url` key so existing frontend code (uploadData.url) works without changes
    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Tone upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}

