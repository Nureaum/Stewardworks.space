'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SessionEditor from '@/components/admin/SessionEditor'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useAdminLoading } from '@/context/AdminLoadingContext'

export default function NewCommunitySessionPage() {
  const router = useRouter()
  const { setIsLoading } = useAdminLoading()

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to create')
    }

    router.push('/admin/community-listening')
  }

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px] mb-[22px] flex-wrap">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Community Sessions</h1>
          <p className="mt-[8px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">LISTENING SESSIONS · PHOTOS, VIDEOS, PDFS, AUDIO</p>
        </div>
        <Link 
          href="/admin/community-listening/new" 
          onClick={() => setIsLoading(true)}
          className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
        >
          + New Session
        </Link>
      </div>

      <SessionEditor 
        isEditing={false}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/community-listening')}
      />
    </div>
  )
}
