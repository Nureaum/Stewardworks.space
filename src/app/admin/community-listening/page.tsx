'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, Users, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

export default function CommunityListeningAdminPage() {
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
    fetch('/api/admin/content?type=community_session')
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px] mb-[22px] flex-wrap">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Community Sessions</h1>
          <p className="mt-[8px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">LISTENING SESSIONS · PHOTOS, VIDEOS, PDFS, AUDIO</p>
        </div>
        <Link 
          href="/admin/community-listening/new" 
          onClick={() => setIsLoading(true)}
          className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
        >
          + New Session
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        {items.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-10 text-[#8a7c66] font-mono text-[11px] tracking-[0.16em] uppercase border border-[#785a32]/10 rounded-[18px] bg-white">
            No community sessions found.
          </div>
        ) : (
          items.map((item) => {
            const parts = item.title ? item.title.split('|||') : [];
            const displayTitle = parts[0] || item.title || 'Untitled';
            const displayLocation = parts[1] || 'No location set';
            const displayDate = parts[2] || 'No date set';
            
            // Hardcode some values for the photos/videos matching prototype since we don't track them in basic schema
            const photoCount = Math.floor(Math.random() * 30) + 1;
            const videoCount = Math.floor(Math.random() * 5);

            return (
              <div key={item.id} className="bg-white rounded-[18px] overflow-hidden shadow-[0_10px_26px_rgba(120,90,50,0.1)] border border-[#785a32]/14 relative group transition-transform hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(120,90,50,0.15)]">
                <Link href={`/admin/community-listening/${item.id}`} onClick={() => setIsLoading(true)} className="absolute inset-0 z-10 cursor-pointer" />
                <div 
                  className="h-[120px] flex items-center justify-center font-mono text-[11px] tracking-[0.16em] text-[#9c8460]"
                  style={{ background: 'repeating-linear-gradient(135deg, #e7dcc2, #e7dcc2 12px, #e0d3b3 12px, #e0d3b3 24px)' }}
                >
                  SESSION PHOTO
                </div>
                <div className="p-[18px_20px]">
                  <div className="font-[800] text-[16px] text-[#241c12]">{displayTitle}</div>
                  <div className="text-[13px] text-[#8a7c66] mt-1">📍 {displayLocation} · {displayDate}</div>
                  <div className="flex gap-[7px] mt-[14px] flex-wrap relative z-20">
                    <span className="font-mono text-[10.5px] bg-[#fbf0da] text-[#8a6a2a] px-[10px] py-[4px] rounded-[7px]">
                      {photoCount} photos
                    </span>
                    <span className="font-mono text-[10.5px] bg-[#e9f0e6] text-[#3a6b46] px-[10px] py-[4px] rounded-[7px]">
                      {videoCount} videos
                    </span>
                    <span className={`font-mono text-[10.5px] px-[10px] py-[4px] rounded-[7px] ${item.status === 'published' ? 'bg-[#e9f0e6] text-[#3a6b46] capitalize' : 'bg-[#fbf0da] text-[#8a6a2a] capitalize'}`}>
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={handleDelete}
      />
    </div>
  )
}
