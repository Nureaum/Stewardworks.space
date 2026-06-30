'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, BookOpen, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

export default function LibraryAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [processing, setProcessing] = useState<string | null>(null)
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchItems = () => {
    setIsLoading(true)
    fetch('/api/admin/content?type=library_resource')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const confirmDelete = (id: string) => {
    setDeleteModalState({ isOpen: true, id })
  }

  const handleDelete = async () => {
    const id = deleteModalState.id
    if (!id) return
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Deleted successfully')
      setItems(items.filter(item => item.id !== id))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(null)
      setDeleteModalState({ isOpen: false, id: null })
    }
  }

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    setProcessing(item.id)
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Marked as ${newStatus}`)
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [items, searchQuery, statusFilter])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalItems = items.length
  const totalPublished = items.filter(i => i.status === 'published').length
  const totalDrafts = items.filter(i => i.status === 'draft').length

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-steward-offwhite">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div>
          <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Library Resources</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage articles, PDFs, and links</p>
        </div>
        <Link 
          href="/admin/library/new" 
          onClick={() => setIsLoading(true)}
          className="bg-steward-dark text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          + Add Resource
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          
          {/* Dashboard Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FFD700] rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow text-steward-dark">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <BookOpen size={80} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest text-steward-dark/70">Total Resources</p>
                <h2 className="text-3xl font-black mt-1">{totalItems}</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-steward-dark/10 flex items-center justify-center relative z-10">
                <BookOpen size={18} />
              </div>
            </div>

            <div className="bg-steward-green rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow text-white">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle size={80} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-black text-white/80 uppercase tracking-widest">Published</p>
                <h2 className="text-3xl font-black mt-1">{totalPublished}</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative z-10">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="bg-steward-orange rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow text-white">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock size={80} />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-black text-white/80 uppercase tracking-widest">Drafts</p>
                <h2 className="text-3xl font-black mt-1">{totalDrafts}</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative z-10">
                <Clock size={18} />
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-steward-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-steward-blue/20 focus:border-steward-blue transition-all shadow-sm"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-steward-dark focus:outline-none focus:ring-2 focus:ring-steward-blue/20 focus:border-steward-blue transition-all shadow-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Resource / Category</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Added On</th>
                    <th className="px-8 py-5 text-right text-[11px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginatedItems.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-400" size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching resources found.</p>
                      <p className="text-xs text-gray-400 mt-2">Try adjusting your filters or search query.</p>
                    </td></tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[15px] font-black text-steward-dark tracking-tight">{item.title || 'Untitled'}</span>
                            <span className="text-[11px] font-bold text-gray-400 mt-1">{item.category?.label || 'Uncategorized'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleStatus(item)}
                              disabled={processing === item.id}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                item.status === 'published' ? 'bg-steward-green' : 'bg-gray-200'
                              } ${processing === item.id ? 'opacity-50 cursor-wait' : ''}`}
                              title="Toggle status"
                            >
                              <span 
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                  item.status === 'published' ? 'translate-x-6' : 'translate-x-1'
                                }`} 
                              />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'published' ? 'text-steward-green' : 'text-gray-400'
                            }`}>
                              {processing === item.id ? 'Saving...' : item.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-gray-500">
                          {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link 
                              href={`/admin/library/${item.id}`} 
                              onClick={() => setIsLoading(true)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-steward-dark uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                              <Pencil size={14} /> Edit
                            </Link>
                            <button
                              onClick={() => confirmDelete(item.id)}
                              disabled={processing === item.id}
                              className="inline-flex items-center justify-center p-2 bg-white border border-gray-100 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all disabled:opacity-50"
                              title="Delete Resource"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Pagination Footer */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Showing <span className="text-steward-dark">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-steward-dark">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="text-steward-dark">{filteredItems.length}</span> results
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-steward-dark hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[11px] font-black text-steward-dark px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-steward-dark hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            {totalPages <= 1 && filteredItems.length > 0 && (
              <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {filteredItems.length} result{filteredItems.length !== 1 && 's'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={handleDelete}
      />
    </div>
  )
}
