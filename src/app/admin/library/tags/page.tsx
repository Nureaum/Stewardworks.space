'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { Tag, Plus, Loader2, Search, X, Edit, Trash2, Check, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

function ReferenceTagCard({ tag, onUpdate, onDeleteClick }: { tag: any, onUpdate: (id: string, updates: any) => Promise<void>, onDeleteClick: (tag: any) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(tag.label)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    if (!editLabel.trim()) return;
    setIsSaving(true)
    await onUpdate(tag.id, { label: editLabel })
    setIsSaving(false)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-[#fbf5e6] border border-[#c9a44e] rounded-[18px] overflow-hidden shadow-sm">
        <div className="p-4 flex flex-col gap-3">
          <input 
            value={editLabel} 
            onChange={e => setEditLabel(e.target.value.toUpperCase())} 
            className="w-full bg-white border border-[#785a32]/20 rounded-lg px-3 py-2 text-[14px] font-[700] text-[#241c12] outline-none focus:border-[#785a32]" 
            placeholder="TAG NAME"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#a89a82] hover:bg-black/5 rounded-md transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#2f5a37] text-white hover:bg-[#1a3a1e] rounded-md transition-colors flex items-center gap-1">
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white border border-[#785a32]/10 rounded-[18px] overflow-hidden shadow-[0_6px_20px_rgba(120,90,50,0.08)] hover:shadow-[0_10px_28px_rgba(120,90,50,0.13)] transition-all transform hover:-translate-y-1">
      <div className="p-5 flex items-center gap-4">
        <div className="w-[40px] h-[40px] rounded-full bg-[#fbf5e6] border border-[#c9a44e]/30 flex items-center justify-center shrink-0">
          <Tag size={18} className="text-[#c9a44e]" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <div className="font-[800] text-[16px] text-[#241c12] leading-tight">{tag.label}</div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button onClick={() => setIsEditing(true)} className="p-2 text-[#a89a82] hover:text-[#785a32] hover:bg-[#fbf5e6] rounded-md transition-colors" title="Edit Tag">
            <Edit size={16} />
          </button>
          <button onClick={() => onDeleteClick(tag)} className="p-2 text-[#a89a82] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Tag">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LibraryTagsPage() {
  const [tags, setTags] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [newLabel, setNewLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  const fetchTags = () => {
    setIsLoading(true)
    fetch('/api/admin/reference-tags')
      .then(res => res.json())
      .then(data => {
        setTags(data.tags || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/reference-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }
      
      toast.success(`Tag "${newLabel}" added!`)
      setNewLabel('')
      fetchTags()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to create tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/reference-tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Tag updated!')
      fetchTags()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update tag')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reference-tags/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete')
      }
      toast.success('Tag deleted!')
      setDeleteTarget(null)
      fetchTags()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete tag')
    }
  }

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags
    const q = searchQuery.toLowerCase()
    return tags.filter(t => t.label.toLowerCase().includes(q))
  }, [tags, searchQuery])

  return (
    <div className="min-h-screen bg-[#fbf5e6] p-6 lg:p-12 font-['Exo',sans-serif]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-[#a89a82] mb-4">
            <Link 
              href="/admin/library" 
              onClick={() => setIsLoading(true)}
              className="flex items-center gap-1 hover:text-[#785a32] transition-colors text-[11px] font-black uppercase tracking-widest"
            >
              <ChevronLeft size={14} /> Back to Library
            </Link>
          </div>
          <h1 className="text-4xl lg:text-5xl font-[900] text-[#241c12] tracking-tight mb-3 flex items-center gap-4">
            Manage Reference Tags
          </h1>
          <p className="text-[14px] text-[#785a32] max-w-2xl font-medium tracking-wide">
            Add, edit, or remove the master list of Reference Tags used to filter resources in the Steward Library.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] p-2 border border-[#785a32]/10 shadow-[0_4px_20px_rgba(120,90,50,0.05)] flex items-center">
              <div className="pl-4 pr-2 text-[#a89a82]">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search tags..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-[15px] font-[600] text-[#241c12] placeholder-[#a89a82]/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-3 text-[#a89a82] hover:text-[#241c12]">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredTags.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-[#785a32]/20 rounded-[24px]">
                  <Tag size={32} className="mx-auto text-[#a89a82] mb-3 opacity-50" />
                  <div className="text-[#a89a82] font-bold">No tags found</div>
                </div>
              ) : (
                filteredTags.map(tag => (
                  <ReferenceTagCard
                    key={tag.id}
                    tag={tag}
                    onUpdate={handleUpdate}
                    onDeleteClick={setDeleteTarget}
                  />
                ))
              )}
            </div>
          </div>

          <div className="relative">
            <div className="sticky top-6 bg-white border border-[#785a32]/10 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(120,90,50,0.08)]">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#785a32]/10">
                <div className="w-[42px] h-[42px] bg-[#fbf5e6] rounded-xl flex items-center justify-center border border-[#785a32]/20 text-[#785a32]">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-[900] text-[#241c12] leading-tight">Add New Tag</h2>
                  <div className="text-[12px] text-[#a89a82] font-medium mt-0.5">Create a new filtering option</div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-[#a89a82] uppercase tracking-widest mb-2 px-1">Tag Name</label>
                  <input 
                    type="text" 
                    value={newLabel} 
                    onChange={e => setNewLabel(e.target.value.toUpperCase())} 
                    className="w-full bg-[#fbf5e6] border border-[#785a32]/20 rounded-xl px-4 py-3 text-[14px] font-[700] text-[#241c12] outline-none focus:border-[#785a32] focus:bg-white transition-all" 
                    placeholder="e.g. WATER"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newLabel.trim()}
                  className="w-full py-4 bg-[#2f5a37] text-white rounded-xl font-black uppercase tracking-[0.15em] text-[12px] hover:bg-[#1a3a1e] transition-colors shadow-[0_4px_12px_rgba(47,90,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Tag
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-[48px] h-[48px] bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5 border border-red-100">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-[900] text-[#241c12] mb-2">Delete Reference Tag?</h3>
            <p className="text-[14px] text-[#785a32] mb-8 leading-relaxed">
              Are you sure you want to delete the tag <strong>"{deleteTarget.label}"</strong>? Any resources currently using this tag will simply lose the tag, but the resources themselves will not be deleted.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-[#785a32] bg-[#fbf5e6] hover:bg-[#efe8d9] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
