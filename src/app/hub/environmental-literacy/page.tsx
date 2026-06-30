'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, Calendar, ChevronRight, User, Palmtree } from 'lucide-react'

export default function EnvironmentalLiteracyPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/environmental')
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics || [])
        setBlocks(data.blocks || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const filteredBlocks = useMemo(() => {
    let result = blocks.filter(block => {
      const matchesTopic = activeTopicId ? block.topic_id === activeTopicId : true
      const matchesSearch = block.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTopic && matchesSearch
    })

    result.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime()
      const dateB = new Date(b.published_at || b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [blocks, activeTopicId, searchQuery, sortOrder])

  const stripHtmlAndTruncate = (html: string, length: number) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const text = tmp.textContent || tmp.innerText || ''
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-exo">
        <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-steward-offwhite font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <Link href="/hub" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <Palmtree size={48} className="text-steward-gold mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Environmental Literacy</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Explore expert-written articles, research, and region insights to help you understand our community's ecosystem.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-20">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-steward-dark/10 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTopicId(null)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTopicId === null
                  ? 'bg-steward-green text-white shadow-md border border-steward-green'
                  : 'bg-white text-steward-dark/60 border border-steward-dark/10 hover:border-steward-gold hover:text-steward-gold'
              }`}
            >
              All Topics
            </button>
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => setActiveTopicId(topic.id)}
                className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTopicId === topic.id
                    ? 'bg-steward-green text-white shadow-md border border-steward-green'
                    : 'bg-white text-steward-dark/60 border border-steward-dark/10 hover:border-steward-gold hover:text-steward-gold'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steward-dark/40" size={16} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-steward-dark/10 rounded-full text-sm font-bold text-steward-dark placeholder:text-steward-dark/40 focus:outline-none focus:ring-2 focus:ring-steward-gold/50 focus:border-steward-gold transition-all shadow-sm"
              />
            </div>
            
            <div className="relative w-full sm:w-48">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="appearance-none w-full px-4 py-3 bg-white border border-steward-dark/10 rounded-full text-sm font-bold text-steward-dark/70 focus:outline-none focus:ring-2 focus:ring-steward-gold/50 focus:border-steward-gold transition-all shadow-sm cursor-pointer"
              >
                <option value="newest">Recent / Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-steward-dark/40">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlocks.map(block => (
            <Link key={block.id} href={`/hub/environmental-literacy/${block.id}`} className="group flex flex-col bg-white rounded-3xl border border-steward-dark/5 shadow-md hover:shadow-xl transition-all overflow-hidden">
              <div className="w-full aspect-[4/3] relative bg-steward-cream/20 overflow-hidden">
                {block.thumbnail_url ? (
                  <img src={block.thumbnail_url} alt={block.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-steward-blue/10">
                    <img src="/img/icon-panda.png" alt="Placeholder" className="w-16 h-16 opacity-30 grayscale mix-blend-multiply" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-steward-blue text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {block.topic?.label || 'General'}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight leading-tight mb-3 group-hover:text-steward-blue transition-colors line-clamp-2">
                  {block.title}
                </h3>
                <p className="text-sm text-steward-dark/60 font-medium line-clamp-3 mb-6 flex-1">
                  {stripHtmlAndTruncate(block.body, 120)}
                </p>
                
                <div className="flex items-center justify-end pt-4 border-t border-steward-dark/5 mt-auto">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-steward-dark/40 uppercase tracking-widest">
                    <Calendar size={12} />
                    {new Date(block.published_at || block.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-steward-dark/5 shadow-md mt-8">
            <div className="w-16 h-16 bg-steward-offwhite rounded-2xl flex items-center justify-center mx-auto mb-4 border border-steward-gold/20">
              <Search className="text-steward-gold" size={24} />
            </div>
            <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight">No Articles Found</h3>
            <p className="text-sm text-steward-dark/60 font-bold mt-2">Try adjusting your search or selected topic.</p>
          </div>
        )}

      </main>
    </div>
  )
}
