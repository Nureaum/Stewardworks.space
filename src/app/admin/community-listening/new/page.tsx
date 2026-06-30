'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentItemEditor from '@/components/admin/ContentItemEditor'
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
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/community-listening" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">New Session</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Create a new Community Listening Session</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <ContentItemEditor 
            contentType="community_session"
            topics={[]}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/community-listening')}
          />
        </div>
      </main>
    </div>
  )
}
