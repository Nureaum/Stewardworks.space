'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAdminLoading } from '@/context/AdminLoadingContext'
import { BookMarked, Plus, Loader2, Search, X, Edit, Trash2, Check, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const BOOK_COLORS = [
  '#2C3E50','#356066','#B07A2B','#7A2E2E','#2D4B3E',
  '#B5552F','#3D6E86','#6E7E33','#3A3F45','#4F6B2A','#C8643F','#9A6B2E',
]

// Extract color from slug if it exists (format: slug--c-HEX)
function extractColorFromSlug(slug: string, fallbackColor: string) {
  const match = slug.match(/--c-([a-fA-F0-9]{6})$/);
  if (match) {
    return { cleanSlug: slug.replace(/--c-[a-fA-F0-9]{6}$/, ''), color: `#${match[1]}` };
  }
  return { cleanSlug: slug, color: fallbackColor };
}

function CategoryCard({ cat, colorIndex, onUpdate, onDeleteClick }: { cat: any, colorIndex: number, onUpdate: (id: string, updates: any) => Promise<void>, onDeleteClick: (cat: any) => void }) {
  const defaultColor = BOOK_COLORS[colorIndex % BOOK_COLORS.length]
  const { cleanSlug, color } = extractColorFromSlug(cat.slug, defaultColor)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(cat.label)
  const [editSlug, setEditSlug] = useState(cleanSlug)
  const [editColor, setEditColor] = useState(color)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    if (!editLabel.trim() || !editSlug.trim()) return;
    setIsSaving(true)
    const finalSlug = `${editSlug}--c-${editColor.replace('#', '')}`
    await onUpdate(cat.id, { label: editLabel, slug: finalSlug })
    setIsSaving(false)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-[#fbf5e6] border border-[#c9a44e] rounded-[18px] overflow-hidden shadow-sm">
        <div className="h-[7px] w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
        <div className="p-4 flex flex-col gap-3">
          <input 
            value={editLabel} 
            onChange={e => setEditLabel(e.target.value)} 
            className="w-full bg-white border border-[#785a32]/20 rounded-lg px-3 py-2 text-[14px] font-[700] text-[#241c12] outline-none focus:border-[#785a32]" 
            placeholder="Book Name"
          />
          <input 
            value={editSlug} 
            onChange={e => setEditSlug(e.target.value)} 
            className="w-full bg-white border border-[#785a32]/20 rounded-lg px-3 py-2 text-[12px] font-mono text-[#a89a82] outline-none focus:border-[#785a32]" 
            placeholder="url-slug"
          />
          <div className="flex flex-wrap gap-1.5 mt-1 px-1">
            {BOOK_COLORS.map(col => {
              const isSelected = col === editColor;
              const ring = isSelected ? `0 0 0 2px #fbf5e6, 0 0 0 4px ${col}` : '0 1px 2px rgba(0,0,0,0.2)';
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setEditColor(col)}
                  style={{ background: col, boxShadow: ring }}
                  className="w-[18px] h-[18px] rounded-full border-none cursor-pointer transition-shadow"
                />
              );
            })}
          </div>
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
    <div className="bg-white border border-[#785a32]/10 rounded-[18px] overflow-hidden shadow-[0_6px_20px_rgba(120,90,50,0.08)] hover:shadow-[0_10px_28px_rgba(120,90,50,0.13)] transition-all transform hover:-translate-y-1 group relative">
      <div className="h-[7px] w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
      <div className="p-5 flex items-start gap-4">
        <div 
          className="w-[14px] h-[54px] rounded-[3px] shrink-0 mt-0.5 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.25)] relative overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
        >
          {/* Spine detailing */}
          <div className="absolute top-2 w-full h-[1px] bg-white/20"></div>
          <div className="absolute top-[10px] w-full h-[1px] bg-black/20"></div>
          <div className="absolute bottom-2 w-full h-[1px] bg-white/20"></div>
          <div className="absolute bottom-[10px] w-full h-[1px] bg-black/20"></div>
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <div className="font-[800] text-[16px] text-[#241c12] leading-tight mb-1">{cat.label}</div>
          <div className="font-mono text-[11px] text-[#a89a82] tracking-[0.06em] bg-[#fbf5e6] px-2 py-1 rounded-md inline-block">/{cleanSlug}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-3 mt-1">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.is_archived ? 'bg-red-100 text-red-800' : 'bg-[#e6f5e6] text-[#2f5a37]'}`}>
            {cat.is_archived ? 'Archived' : 'Active'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-[#a89a82] hover:text-[#785a32] hover:bg-[#fbf5e6] rounded-md transition-colors" title="Edit Book">
              <Edit size={15} />
            </button>
            <button onClick={() => onDeleteClick(cat)} className="p-1.5 text-[#a89a82] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Book">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LibraryCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const { setIsLoading } = useAdminLoading()
  const [newLabel, setNewLabel] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [selectedColor, setSelectedColor] = useState(BOOK_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

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
    
    // Embed the selected color into the slug so we don't need a DB migration
    const finalSlug = `${newSlug}--c-${selectedColor.replace('#', '')}`

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, slug: finalSlug }),
      })
      if (!res.ok) throw new Error('Failed to create')
      
      toast.success(`Book "${newLabel}" added!`)
      setNewLabel('')
      setNewSlug('')
      setSelectedColor(BOOK_COLORS[0])
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error('Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Book updated!')
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update book')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete')
      }
      toast.success('Book deleted!')
      setDeleteTarget(null)
      fetchCategories()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete book')
    }
  }

  const handleLabelChange = (val: string) => {
    setNewLabel(val)
    setNewSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-[24px]">
        <div>
          <Link href="/admin/library" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#a89a82] hover:text-[#241c12] transition-colors mb-3">
            <ChevronLeft size={14} /> Back to Library
          </Link>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Manage Books</h1>
          <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">
            Create and manage Books (Categories) for the library shelf
          </p>
        </div>
        <div className="flex gap-[10px]">
          <Link 
            href="/admin/library/new" 
            onClick={() => setIsLoading(true)}
            className="bg-[#1a150d] text-[#efd9a8] px-6 py-[11px] rounded-full font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
          >
            + Add Resource
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 overflow-hidden sticky top-6">
            <div className="px-[26px] py-[20px] border-b border-[#785a32]/10 bg-[#fbf5e6] flex items-center gap-3">
              <div className="w-[32px] h-[32px] rounded-[8px] bg-[#c9a44e]/20 flex items-center justify-center text-[#7a5a1e]">
                <BookMarked size={16} />
              </div>
              <div>
                <h2 className="text-[16px] font-[800] text-[#241c12]">Add New Book</h2>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-[26px] flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.12em] mb-2">
                  Book Name (Label) *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  required
                  className="w-full border border-[#785a32]/20 rounded-[12px] px-4 py-3 text-[14px] font-[600] text-[#241c12] bg-[#fdf8f0] focus:outline-none focus:ring-2 focus:ring-[#c9a44e]/40 placeholder:text-[#b0a090] placeholder:font-normal"
                  placeholder="e.g. AI Wellness"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.12em] mb-2">
                  URL Slug *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89a82] text-[13px] select-none">/</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    className="w-full border border-[#785a32]/20 rounded-[12px] pl-7 pr-4 py-3 text-[13px] text-[#241c12] bg-[#fdf8f0] focus:outline-none focus:ring-2 focus:ring-[#c9a44e]/40 placeholder:text-[#b0a090]"
                    placeholder="ai-wellness"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.12em] mb-2">
                  Book Color Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {BOOK_COLORS.map(col => {
                    const isSelected = col === selectedColor;
                    const ring = isSelected ? `0 0 0 3px #fbf5e6, 0 0 0 5px ${col}` : '0 1px 2px rgba(0,0,0,0.2)';
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        style={{ background: col, boxShadow: ring }}
                        className="w-[28px] h-[28px] rounded-full border-none cursor-pointer transition-shadow"
                      />
                    );
                  })}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !newLabel || !newSlug}
                className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#1a150d] text-[#efd9a8] rounded-full font-black uppercase tracking-[0.12em] text-[12px] hover:bg-black transition-colors disabled:opacity-50 shadow-[0_4px_12px_rgba(36,28,18,0.2)]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {isSubmitting ? 'Adding...' : 'Add Book'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Cards Grid */}
        <div className="lg:col-span-2">
          {/* Search bar */}
          <div className="flex items-center gap-[10px] bg-white border border-[#785a32]/16 rounded-[16px] px-[22px] py-[14px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] mb-[24px]">
            <Search size={18} className="text-[#a89a82] shrink-0" />
            <input
              type="text"
              placeholder="Search books by label or slug..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 border-none bg-transparent text-[15px] text-[#241c12] focus:outline-none placeholder:text-[#a89a82]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#a89a82] hover:text-[#241c12]"><X size={16}/></button>
            )}
          </div>

          {/* Cards */}
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-[22px] border border-[#785a32]/10 p-[40px] text-center shadow-[0_14px_34px_rgba(120,90,50,0.1)]">
              <div className="w-16 h-16 bg-[#fbf5e6] rounded-[22px] flex items-center justify-center mx-auto mb-4 text-[#a89a82]">
                <BookMarked size={28} />
              </div>
              <p className="text-[12px] font-mono text-[#8a7c66] uppercase tracking-[0.16em] mb-2">
                {searchQuery ? 'No books found' : 'No books on the shelf yet'}
              </p>
              <p className="text-[14px] text-[#8a7c66]">
                {searchQuery ? 'Try a different search term.' : 'Use the form to create your first book.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {filteredCategories.map((cat, i) => (
                <CategoryCard key={cat.id} cat={cat} colorIndex={i} onUpdate={handleUpdate} onDeleteClick={setDeleteTarget} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Delete Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(33,40,46,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 10px', font: "900 20px/1 'Exo', sans-serif", color: '#21282E' }}>Delete Book?</h3>
            <p style={{ margin: '0 0 24px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Are you sure you want to delete "{deleteTarget.label}"? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e9e6dd', background: '#fff', color: '#6b6d70', font: "800 11px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>Cancel</button>
              <button type="button" onClick={() => handleDelete(deleteTarget.id)} style={{ cursor: 'pointer', padding: '12px 18px', borderRadius: '10px', border: 'none', background: '#b4675b', color: '#fff', font: "800 11px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
