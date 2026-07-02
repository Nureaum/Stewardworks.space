'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, BookOpen, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, Filter, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

export default function LibraryAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [processing, setProcessing] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null })
  
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [suggestionModalState, setSuggestionModalState] = useState<{isOpen: boolean, data: any | null}>({ isOpen: false, data: null })

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
        if (data.userRole) setUserRole(data.userRole)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }

  const fetchSuggestions = () => {
    fetch('/api/admin/library/suggestions')
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.suggestions || [])
        setPendingCount((data.suggestions || []).length)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchItems()
    fetchSuggestions()
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

  const handleSuggestionAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/library/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error(`Failed to ${status} suggestion`)
      toast.success(`Suggestion ${status}`)
      setSuggestions(s => s.filter(x => x.id !== id))
      setPendingCount(p => p - 1)
      if (suggestionModalState.data?.id === id) {
        setSuggestionModalState({ isOpen: false, data: null })
      }
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
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-[22px]">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Library Resources</h1>
          <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">Manage articles, PDFs, and links · Steward Library</p>
        </div>
        <div className="flex gap-[10px]">
          <button 
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="bg-transparent text-[#241c12] border border-[#785a32]/20 px-[18px] py-[11px] rounded-full font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-[8px] hover:bg-[#fbf5e6] hover:border-[#785a32]/30 transition-all"
          >
            Review Suggestions
            {pendingCount > 0 && (
              <span className="w-[20px] h-[20px] rounded-full bg-[#c8963e] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {pendingCount}
              </span>
            )}
          </button>
          <Link 
            href="/admin/library/new" 
            onClick={() => setIsLoading(true)}
            className="bg-[#1a150d] text-[#efd9a8] px-6 py-[11px] rounded-full font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
          >
            + Add Resource
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mb-[24px]">
        <div className="bg-gradient-to-br from-[#f2c14e] to-[#e3a92f] rounded-[18px] p-[22px_24px] shadow-[0_10px_24px_rgba(226,169,47,0.25)] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-[#3c280a]">
            <BookOpen size={80} />
          </div>
          <div className="relative z-10">
            <div className="font-mono text-[11px] tracking-[0.16em] text-[#3c280a]/70">TOTAL RESOURCES</div>
            <div className="text-[44px] font-[800] text-[#3a2708] mt-[6px] leading-none">{totalItems}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#2f5a37] to-[#244a2c] rounded-[18px] p-[22px_24px] shadow-[0_10px_24px_rgba(36,74,44,0.25)] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-white">
            <CheckCircle size={80} />
          </div>
          <div className="relative z-10">
            <div className="font-mono text-[11px] tracking-[0.16em] text-[#e6f5e6]/75">PUBLISHED</div>
            <div className="text-[44px] font-[800] text-white mt-[6px] leading-none">{totalPublished}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#cf9a3d] to-[#b3812c] rounded-[18px] p-[22px_24px] shadow-[0_10px_24px_rgba(179,129,44,0.25)] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-[#3c280a]">
            <Clock size={80} />
          </div>
          <div className="relative z-10">
            <div className="font-mono text-[11px] tracking-[0.16em] text-[#3c280a]/72">DRAFTS</div>
            <div className="text-[44px] font-[800] text-[#3a2708] mt-[6px] leading-none">{totalDrafts}</div>
          </div>
        </div>
      </div>

      {showSuggestions ? (
        <div className="bg-white rounded-[22px] p-[26px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 mb-[24px] animate-[ac-fade_0.3s_ease]">
          <div className="flex items-center justify-between mb-[6px]">
            <div className="font-[800] text-[17px] text-[#241c12]">Community Suggestions</div>
            <button onClick={() => setShowSuggestions(false)} className="text-[12px] font-bold text-[#8a7c66] hover:text-[#241c12] transition-colors border border-transparent hover:border-[#785a32]/20 px-3 py-1.5 rounded-lg flex items-center gap-1">← Back to catalog</button>
          </div>
          <div className="text-[13.5px] text-[#8a7c66] mb-[20px]">A librarian reviews every suggestion. Approve to add it to the shelf for everyone.</div>
          <div className="flex flex-col gap-[14px]">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-[#8a7c66] font-mono text-[11px] uppercase tracking-[0.16em]">No pending suggestions</div>
            ) : (
              suggestions.map((s) => (
                <div key={s.id} className="flex gap-[16px] items-center p-[18px] rounded-[16px] bg-[#fdf8ea] border border-[#785a32]/10">
                  <div className="w-[42px] h-[42px] shrink-0 rounded-[11px] bg-[#2f5a37]/10 flex items-center justify-center text-[18px]">📚</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-[700] text-[15px] text-[#241c12] truncate">{s.title}</div>
                    <div className="text-[12.5px] text-[#8a7c66] mt-[2px] truncate">{s.note || 'No note provided'}</div>
                    <div className="font-mono text-[10.5px] text-[#a89a82] mt-[6px] tracking-[0.05em]">{s.category || 'Uncategorized'} · {s.resource_type || 'Link'} · by {s.submitted_by_name || 'Anonymous'}</div>
                  </div>
                  <div className="flex gap-[8px]">
                    <button onClick={() => setSuggestionModalState({ isOpen: true, data: s })} className="px-4 py-2 rounded-full border border-[#785a32]/20 text-[#241c12] font-black text-[11px] uppercase tracking-[0.12em] hover:bg-white transition-colors flex items-center gap-2">
                      <Eye size={14} /> Details
                    </button>
                    <button onClick={() => handleSuggestionAction(s.id, 'approved')} disabled={processing === s.id} className="px-5 py-2.5 rounded-full bg-[#2f5a37] text-white font-black text-[11px] uppercase tracking-[0.12em] hover:bg-[#244a2c] transition-colors shadow-[0_4px_12px_rgba(47,90,55,0.25)] disabled:opacity-50">
                      Approve
                    </button>
                    <button onClick={() => handleSuggestionAction(s.id, 'rejected')} disabled={processing === s.id} className="px-5 py-2.5 rounded-full border border-red-200 text-red-500 font-black text-[11px] uppercase tracking-[0.12em] hover:bg-red-50 transition-colors disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="animate-[ac-fade_0.3s_ease]">
          <div className="flex flex-col sm:flex-row gap-[10px] items-stretch mb-[22px]">
            <div className="flex flex-1 items-center gap-[10px] bg-white border border-[#785a32]/16 rounded-full px-[22px] py-[12px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] w-full">
              <Search size={17} className="text-[#a89a82] shrink-0" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 border-none bg-transparent text-[14.5px] text-[#241c12] focus:outline-none placeholder:text-[#a89a82]"
              />
            </div>
            
            <div className="flex items-center bg-white border border-[#785a32]/16 rounded-full px-[22px] py-[12px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] relative w-full sm:w-auto">
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



      <div className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#785a32]/10">
            <thead className="bg-[#fbf5e6] border-b border-[#785a32]/10">
              <tr>
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Resource / Category</th>
                {userRole === 'super_admin' && (
                  <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Posted By</th>
                )}
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Status</th>
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Added On</th>
                <th className="px-[28px] py-[18px] text-right text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#785a32]/5 bg-white">
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={userRole === 'super_admin' ? 5 : 4} className="px-[28px] py-[40px] text-center">
                  <div className="w-16 h-16 bg-[#fbf5e6] rounded-[22px] flex items-center justify-center mx-auto mb-4 text-[#a89a82]">
                    <Search size={24} />
                  </div>
                  <p className="text-[11px] font-mono text-[#8a7c66] uppercase tracking-[0.16em]">No matching resources found.</p>
                  <p className="text-[13px] text-[#8a7c66] mt-2">Try adjusting your filters or search query.</p>
                </td></tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fbf5e6]/30 transition-colors group">
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-[700] text-[#241c12] tracking-tight">{item.title || 'Untitled'}</span>
                        {item.category?.label && (
                          <span className="text-[12.5px] text-[#8a7c66] mt-1">
                            {item.category.label}
                          </span>
                        )}
                      </div>
                    </td>
                    {userRole === 'super_admin' && (
                      <td className="px-[28px] py-[18px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-[700] text-[#2f5a37]">{item.author?.full_name || 'Unknown Admin'}</span>
                          <span className="text-[11px] text-[#8a7c66] mt-0.5">{item.author?.email}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(item)}
                          disabled={processing === item.id}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
                            item.status === 'published' ? 'bg-[#2f5a37]' : 'bg-[#e0d6c8]'
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
                          item.status === 'published' ? 'text-[#2f5a37]' : 'text-[#a89a82]'
                        }`}>
                          {processing === item.id ? 'Saving...' : item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-[28px] py-[18px] whitespace-nowrap text-[12.5px] text-[#8a7c66]">
                      {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-[28px] py-[18px] whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/library/${item.id}`} 
                          onClick={() => setIsLoading(true)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-[#785a32]/10 rounded-full text-[10px] font-mono text-[#a89a82] uppercase tracking-[0.12em] hover:bg-[#fbf5e6] hover:text-[#7a5a1e] hover:border-[#efd9a8] transition-all"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          disabled={processing === item.id}
                          className="inline-flex items-center justify-center p-2 bg-transparent border border-[#785a32]/10 rounded-full text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50"
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
          <div className="bg-[#fbf5e6] border-t border-[#785a32]/10 px-[28px] py-[18px] flex items-center justify-between">
            <p className="text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">
              Showing <span className="text-[#7a5a1e]">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-[#7a5a1e]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="text-[#7a5a1e]">{filteredItems.length}</span> results
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[#785a32]/10 rounded-[8px] text-[#a89a82] hover:text-[#7a5a1e] hover:bg-white hover:border-[#efd9a8] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-mono text-[#a89a82] px-2 tracking-[0.16em]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-[#785a32]/10 rounded-[8px] text-[#a89a82] hover:text-[#7a5a1e] hover:bg-white hover:border-[#efd9a8] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        {totalPages <= 1 && filteredItems.length > 0 && (
          <div className="bg-[#fbf5e6] border-t border-[#785a32]/10 px-[28px] py-[18px] flex items-center justify-between">
            <p className="text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">
              Showing {filteredItems.length} result{filteredItems.length !== 1 && 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  )}

      {suggestionModalState.isOpen && suggestionModalState.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241c12]/40 backdrop-blur-sm animate-[ac-fade_0.2s_ease]">
          <div className="bg-white w-full max-w-lg rounded-[22px] shadow-[0_24px_48px_rgba(36,28,18,0.2)] overflow-hidden flex flex-col">
            <div className="px-[26px] py-[20px] border-b border-[#785a32]/10 flex items-center justify-between">
              <h2 className="text-[18px] font-[800] text-[#241c12]">Suggestion Details</h2>
              <button onClick={() => setSuggestionModalState({ isOpen: false, data: null })} className="p-2 -mr-2 text-[#a89a82] hover:text-[#241c12] hover:bg-[#fbf5e6] rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-[26px] flex flex-col gap-[16px]">
              <div>
                <div className="text-[11px] font-mono tracking-[0.1em] text-[#a89a82] uppercase mb-1">Title</div>
                <div className="text-[16px] font-[700] text-[#241c12]">{suggestionModalState.data.title}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono tracking-[0.1em] text-[#a89a82] uppercase mb-1">URL</div>
                <a href={suggestionModalState.data.url} target="_blank" rel="noopener noreferrer" className="text-[#c9a44e] hover:text-[#a5843a] text-[14px] font-[600] break-all">{suggestionModalState.data.url}</a>
              </div>
              <div className="bg-[#fdf8ea] p-4 rounded-xl border border-[#785a32]/10">
                <div className="text-[11px] font-mono tracking-[0.1em] text-[#8a7c66] uppercase mb-1">Submitter Note</div>
                <div className="text-[14px] text-[#241c12] leading-relaxed">{suggestionModalState.data.note || 'No note provided.'}</div>
              </div>
              <div className="flex gap-6 mt-2">
                <div>
                  <div className="text-[11px] font-mono tracking-[0.1em] text-[#a89a82] uppercase mb-1">Category</div>
                  <div className="text-[13px] font-[600] text-[#241c12]">{suggestionModalState.data.category || 'Uncategorized'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono tracking-[0.1em] text-[#a89a82] uppercase mb-1">Type</div>
                  <div className="text-[13px] font-[600] text-[#241c12]">{suggestionModalState.data.resource_type || 'Link'}</div>
                </div>
              </div>
              <div className="pt-4 border-t border-[#785a32]/10 flex gap-[8px] justify-end mt-2">
                <button onClick={() => setSuggestionModalState({ isOpen: false, data: null })} className="px-5 py-2.5 rounded-[12px] border border-[#785a32]/20 text-[#241c12] font-black text-[12px] uppercase tracking-[0.12em] hover:bg-[#fbf5e6] transition-colors">
                  Close
                </button>
                <button onClick={() => handleSuggestionAction(suggestionModalState.data.id, 'approved')} disabled={processing === suggestionModalState.data.id} className="px-5 py-2.5 rounded-[12px] bg-[#2f5a37] text-white font-black text-[12px] uppercase tracking-[0.12em] hover:bg-[#244a2c] transition-colors shadow-[0_4px_12px_rgba(47,90,55,0.25)] disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => handleSuggestionAction(suggestionModalState.data.id, 'rejected')} disabled={processing === suggestionModalState.data.id} className="px-5 py-2.5 rounded-[12px] border border-red-200 text-red-500 font-black text-[12px] uppercase tracking-[0.12em] hover:bg-red-50 transition-colors disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={handleDelete}
      />
    </div>
  )
}
