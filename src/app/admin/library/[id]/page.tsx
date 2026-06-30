'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentItemEditor from '@/components/admin/ContentItemEditor'
import { useAdminLoading } from '@/context/AdminLoadingContext'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditLibraryResourcePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [initialData, setInitialData] = useState<any>(null)
  const [categories, setCategories] = useState([])
  const { setIsLoading } = useAdminLoading()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    
    // Fetch categories and the specific content item
    Promise.all([
      fetch('/api/admin/categories').then(res => res.json()),
      fetch('/api/admin/content?type=library_resource').then(res => res.json())
    ])
      .then(([categoriesData, contentData]) => {
        setCategories(categoriesData.categories || [])
        
        const item = (contentData.items || []).find((i: any) => i.id === params.id)
        if (item) {
          setInitialData(item)
        }
        setIsLoading(false)
        setHasLoaded(true)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
        setHasLoaded(true)
      })
  }, [params.id, setIsLoading])

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

    router.push('/admin/library')
  }

  if (!hasLoaded) return null;
  if (!initialData) return <div className="p-12 text-center text-red-500 font-bold uppercase tracking-widest">Resource not found.</div>

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/library" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Library Resource</h1>
          <p className="text-gray-600">Update details for this Steward Library resource.</p>
        </div>
      </div>

      <ContentItemEditor 
        initialData={initialData}
        contentType="library_resource"
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/library')}
      />
    </div>
  )
}
