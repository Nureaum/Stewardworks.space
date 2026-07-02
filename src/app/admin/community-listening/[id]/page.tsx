'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SessionEditor from '@/components/admin/SessionEditor'
import { useAdminLoading } from '@/context/AdminLoadingContext'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditCommunitySessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [initialData, setInitialData] = useState<any>(null)
  const { setIsLoading } = useAdminLoading()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(contentData => {
        const item = (contentData.items || []).find((i: any) => i.id === params.id)
        if (item) {
          setInitialData(item)
        }
        setIsLoading(false)
        setHasLoaded(true)
      })
      .catch(() => {
        setIsLoading(false)
        setHasLoaded(true)
      })
  }, [params.id])

  // Update existing content
  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/admin/content/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to update')
    }

    router.push('/admin/community-listening')
  }

  if (!hasLoaded) return null;
  if (!initialData) return <div className="p-12 text-center text-red-500 font-bold uppercase tracking-widest">Item not found.</div>

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
        initialData={initialData}
        isEditing={true}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/community-listening')}
      />
    </div>
  )
}
