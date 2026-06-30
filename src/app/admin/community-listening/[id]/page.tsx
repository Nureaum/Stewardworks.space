'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentItemEditor from '@/components/admin/ContentItemEditor'
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
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/community-listening" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Edit Session</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Update this Community Listening Session</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <ContentItemEditor 
            initialData={initialData}
            contentType="community_session"
            topics={[]} // We don't use topics for community sessions
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/community-listening')}
          />
        </div>
      </main>
    </div>
  )
}
