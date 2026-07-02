'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, Globe, FileText, Loader2, Search, Filter, BookOpen, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

export default function EnvLiteracyAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [processing, setProcessing] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchItems = () => {
    setIsLoading(true)
    fetch('/api/admin/content?type=env_literacy_block')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || [])
        if (data.userRole) setUserRole(data.userRole)
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
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.topic?.label || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Environmental Literacy</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage interactive topics and content blocks</p>
        </div>
        <Link 
          href="/admin/environmental/new" 
          className="bg-steward-dark text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          + Create Content Block
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          
          {/* Dashboard Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            <div 
              style={{ background: 'linear-gradient(150deg,#3d7a95,#2f6178)', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 10px 24px rgba(47,97,120,.25)' }}
            >
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: 'rgba(230,244,250,.8)' }}>
                TOTAL CONTENT
              </div>
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#fff', marginTop: '6px', lineHeight: 1 }}>
                {totalItems}
              </div>
            </div>

            <div 
              style={{ background: 'linear-gradient(150deg,#2f5a37,#244a2c)', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 10px 24px rgba(36,74,44,.25)' }}
            >
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: 'rgba(230,245,230,.75)' }}>
                PUBLISHED
              </div>
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#fff', marginTop: '6px', lineHeight: 1 }}>
                {totalPublished}
              </div>
            </div>

            <div 
              style={{ background: 'linear-gradient(150deg,#cf9a3d,#b3812c)', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 10px 24px rgba(179,129,44,.25)' }}
            >
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: 'rgba(60,40,10,.72)' }}>
                TOTAL DRAFTS
              </div>
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#3a2708', marginTop: '6px', lineHeight: 1 }}>
                {totalDrafts}
              </div>
            </div>
          </div>

          {/* FOUR PRIMARY THEMES */}
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', letterSpacing: '.18em', color: '#9c8d76', marginBottom: '12px' }}>
              FOUR PRIMARY THEMES
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px]">
              {/* Theme 1 */}
              <div style={{ background: 'linear-gradient(150deg,#3d7a95,#2f6178)', borderRadius: '16px', padding: '18px 18px 20px', boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>🏜️</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.25 }}>Imperial County Bioregion</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10.5px', letterSpacing: '.16em', color: 'rgba(230,244,250,.7)', marginTop: '8px' }}>
                  {items.filter(i => i.topic?.label === 'Imperial County Bioregion').length} CONTENT BLOCKS
                </div>
              </div>
              {/* Theme 2 */}
              <div style={{ background: 'linear-gradient(150deg,#8a4f26,#6d3d1c)', borderRadius: '16px', padding: '18px 18px 20px', boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>🪶</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.25 }}>Indigenous Peoples</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10.5px', letterSpacing: '.16em', color: 'rgba(250,235,220,.7)', marginTop: '8px' }}>
                  {items.filter(i => i.topic?.label === 'Indigenous Peoples').length} CONTENT BLOCKS
                </div>
              </div>
              {/* Theme 3 */}
              <div style={{ background: 'linear-gradient(150deg,#b3812c,#8a6321)', borderRadius: '16px', padding: '18px 18px 20px', boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>📜</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.25 }}>History</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10.5px', letterSpacing: '.16em', color: 'rgba(255,244,225,.75)', marginTop: '8px' }}>
                  {items.filter(i => i.topic?.label === 'History').length} CONTENT BLOCKS
                </div>
              </div>
              {/* Theme 4 */}
              <div style={{ background: 'linear-gradient(150deg,#2f5a37,#244a2c)', borderRadius: '16px', padding: '18px 18px 20px', boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>🌍</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.25 }}>The Wider World</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10.5px', letterSpacing: '.16em', color: 'rgba(230,245,230,.7)', marginTop: '8px' }}>
                  {items.filter(i => i.topic?.label === 'The Wider World').length} CONTENT BLOCKS
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-[10px] items-stretch mb-[22px]">
            <div className="flex flex-1 items-center gap-[10px] bg-white border border-[#785a32]/16 rounded-[14px] px-[18px] py-[11px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] w-full">
              <Search size={17} className="text-[#a89a82] shrink-0" />
              <input 
                type="text" 
                placeholder="Search posts..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 border-none bg-transparent text-[14.5px] text-[#241c12] focus:outline-none placeholder:text-[#a89a82]"
              />
            </div>
            
            <div className="flex items-center bg-white border border-[#785a32]/16 rounded-[14px] px-[18px] py-[11px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="flex-1 sm:w-auto appearance-none bg-transparent border-none text-[14.5px] text-[#241c12] focus:outline-none cursor-pointer pr-[24px]"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              <div className="absolute right-[18px] top-1/2 -translate-y-1/2 pointer-events-none text-[#a89a82]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead style={{ borderBottom: '2px solid rgba(120,90,50,.1)' }}>
                  <tr>
                    <th className="px-8 py-5 text-left" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76', fontWeight: 700 }}>TITLE</th>
                    <th className="px-8 py-5 text-left" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76' }}>THEME</th>
                    {userRole === 'super_admin' && (
                      <th className="px-8 py-5 text-left" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76' }}>POSTED BY</th>
                    )}
                    <th className="px-8 py-5 text-left" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76' }}>STATUS</th>
                    <th className="px-8 py-5 text-left" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76' }}>DATE</th>
                    <th className="px-8 py-5 text-right" style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#9c8d76' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginatedItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-400" size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching content found.</p>
                      <p className="text-xs text-gray-400 mt-2">Try adjusting your filters or search query.</p>
                    </td></tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-[15px] font-black text-steward-dark tracking-tight">{item.title}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700">
                            {item.topic?.label || 'No Topic'}
                          </span>
                        </td>
                        {userRole === 'super_admin' && (
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-black text-steward-blue">{item.author?.full_name || 'Unknown Admin'}</span>
                              <span className="text-[11px] text-gray-500 mt-0.5">{item.author?.email}</span>
                            </div>
                          </td>
                        )}
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
                              href={`/admin/environmental/${item.id}`} 
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-steward-dark uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                              <Pencil size={14} /> Edit
                            </Link>
                            <button
                              onClick={() => confirmDelete(item.id)}
                              disabled={processing === item.id}
                              className="inline-flex items-center justify-center p-2 bg-white border border-gray-100 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all disabled:opacity-50"
                              title="Delete Item"
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
