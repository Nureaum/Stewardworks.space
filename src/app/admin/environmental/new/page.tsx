'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentItemEditor from '@/components/admin/ContentItemEditor'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewEnvLiteracyBlockPage() {
  const router = useRouter()
  const [topics, setTopics] = useState([])

  useEffect(() => {
    fetch('/api/admin/topics')
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics || [])
      })
  }, [])

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to save')
    }

    router.push('/admin/environmental')
  }

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px] mb-[22px] flex-wrap">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Environmental Literacy</h1>
          <p className="mt-[8px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">MANAGE INTERACTIVE TOPICS AND CONTENT BLOCKS</p>
        </div>
        <Link 
          href="/admin/environmental/new" 
          className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
        >
          + Create Content Block
        </Link>
      </div>

      <div className="w-full relative z-10">
        <ContentItemEditor 
          contentType="env_literacy_block"
          topics={topics}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/environmental')}
        />
      </div>
    </div>
  )
}
