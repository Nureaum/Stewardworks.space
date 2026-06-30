'use client'

import { useEffect, useState } from 'react'
import { useAdminLoading } from '@/context/AdminLoadingContext'

export default function LibraryCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [newLabel, setNewLabel] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = () => {
    setIsLoading(true)
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, slug: newSlug }),
      })
      if (!res.ok) throw new Error('Failed to create')
      setNewLabel('')
      setNewSlug('')
      fetchCategories()
    } catch (err) {
      console.error(err)
      alert('Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate slug from label
  const handleLabelChange = (val: string) => {
    setNewLabel(val)
    setNewSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
        <p className="text-gray-600">Create and manage categories for Library Resources.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h2>
        <form onSubmit={handleCreate} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steward-green"
              placeholder="e.g. Workshop Materials"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steward-green"
              placeholder="e.g. workshop-materials"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newLabel || !newSlug}
            className="px-4 py-2 bg-steward-green text-white rounded-md hover:bg-steward-green/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No categories found.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.is_archived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {cat.is_archived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
