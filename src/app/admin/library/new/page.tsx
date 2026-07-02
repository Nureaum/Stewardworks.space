'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentItemEditor from '@/components/admin/ContentItemEditor'

export default function NewLibraryResourcePage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || [])
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

    router.push('/admin/library')
  }

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-[22px]">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Add Resource</h1>
          <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">Catalog a new item in Steward Library</p>
        </div>
      </div>

      <div className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 p-[26px]">
        <ContentItemEditor 
          contentType="library_resource"
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/library')}
        />
      </div>
    </div>
  )
}
