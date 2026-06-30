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
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Library Resource</h1>
        <p className="text-gray-600">Add a new article or resource to the Steward Library.</p>
      </div>

      <ContentItemEditor 
        contentType="library_resource"
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/library')}
      />
    </div>
  )
}
