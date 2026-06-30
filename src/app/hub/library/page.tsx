'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ChevronLeft, Library, Tag } from 'lucide-react';

export default function LibraryPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/public/library-resources')
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    resources.forEach(res => {
      if (res.category?.label) {
        cats.add(res.category.label);
      }
    });
    return Array.from(cats).sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || res.category?.label === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, selectedCategory]);

  const stripHtmlAndTruncate = (html: string, length: number) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getThumbnail = (resource: any) => {
    if (resource.thumbnail_url) return resource.thumbnail_url;
    const firstImage = resource.media?.find((m: any) => m.media_type === 'image');
    return firstImage ? firstImage.url : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-exo">
        <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
              <Library size={48} className="text-steward-gold mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Steward Library</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Discover a curated collection of articles, PDFs, media, and tools to support your environmental stewardship journey.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-20">
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-steward-dark/10 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${selectedCategory === 'all' ? 'bg-steward-dark text-white' : 'bg-white text-steward-dark/60 hover:bg-gray-100 border border-gray-200'}`}
            >
              All Resources
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${selectedCategory === cat ? 'bg-steward-dark text-white' : 'bg-white text-steward-dark/60 hover:bg-gray-100 border border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steward-dark/40" size={16} />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-steward-dark/10 rounded-full text-sm font-bold text-steward-dark placeholder:text-steward-dark/40 focus:outline-none focus:ring-2 focus:ring-steward-gold/50 focus:border-steward-gold transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredResources.map(resource => {
            const thumb = getThumbnail(resource);
            
            return (
              <Link key={resource.id} href={`/hub/library/${resource.id}`} className="group flex flex-col bg-white rounded-3xl border border-steward-dark/5 shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
                <div className="w-full aspect-[4/3] relative bg-steward-cream/20 overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-steward-blue/10">
                      <BookOpen size={48} className="text-steward-blue/30" />
                    </div>
                  )}
                  {resource.category?.label && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-steward-gold text-steward-dark px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <Tag size={10} /> {resource.category.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight leading-tight mb-3 group-hover:text-steward-blue transition-colors line-clamp-2">
                    {resource.title || 'Untitled Resource'}
                  </h3>
                  <p className="text-sm text-steward-dark/60 font-medium line-clamp-3 mb-6 flex-1">
                    {stripHtmlAndTruncate(resource.body, 120)}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-steward-dark/5 mt-auto">
                    <span className="text-[10px] font-bold text-steward-dark/40 uppercase tracking-widest">
                      {new Date(resource.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-black text-steward-blue uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read <ChevronLeft className="rotate-180" size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-steward-dark/5 shadow-md mt-8">
            <div className="w-16 h-16 bg-steward-offwhite rounded-2xl flex items-center justify-center mx-auto mb-4 border border-steward-gold/20">
              <BookOpen className="text-steward-gold" size={24} />
            </div>
            <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight">No Resources Found</h3>
            <p className="text-sm text-steward-dark/60 font-bold mt-2">Try adjusting your search or category filter.</p>
          </div>
        )}

      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
