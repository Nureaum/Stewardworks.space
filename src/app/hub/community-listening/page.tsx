'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Calendar, Search, ChevronLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function CommunityListeningPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/public/community-sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      return session.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [sessions, searchQuery]);

  const stripHtmlAndTruncate = (html: string, length: number) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getThumbnail = (session: any) => {
    if (session.thumbnail_url) return session.thumbnail_url;
    const firstImage = session.media?.find((m: any) => m.media_type === 'image');
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
              <Users size={48} className="text-steward-gold mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Community Listening</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Explore recordings, photos, and insights from our community engagements. We value every voice in shaping the future of Stewardworks.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-20">
        
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-6 py-6 border-b border-steward-dark/10 mb-8">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steward-dark/40" size={16} />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-steward-dark/10 rounded-full text-sm font-bold text-steward-dark placeholder:text-steward-dark/40 focus:outline-none focus:ring-2 focus:ring-steward-gold/50 focus:border-steward-gold transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map(session => {
            const thumb = getThumbnail(session);
            
            const parts = session.title ? session.title.split('|||') : [];
            const displayTitle = parts[0] || session.title || 'Untitled Session';
            const displayLocation = parts[1] || 'Location TBD';
            const displayDateStr = parts[2] || new Date(session.published_at || session.created_at).toISOString();
            
            let formattedDate = 'Date TBD';
            try {
              formattedDate = new Date(displayDateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
              });
            } catch (e) {
              // fallback
            }

            return (
              <Link key={session.id} href={`/hub/community-listening/${session.id}`} className="group flex flex-col bg-white rounded-3xl border border-steward-dark/5 shadow-md hover:shadow-xl transition-all overflow-hidden">
                <div className="w-full aspect-[4/3] relative bg-steward-cream/20 overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-steward-blue/10">
                      <Users size={48} className="text-steward-blue/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-steward-gold text-steward-dark px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                      <MapPin size={10} /> {displayLocation}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight leading-tight mb-3 group-hover:text-steward-blue transition-colors line-clamp-2">
                    {displayTitle}
                  </h3>
                  <p className="text-sm text-steward-dark/60 font-medium line-clamp-3 mb-6 flex-1">
                    {stripHtmlAndTruncate(session.body, 120)}
                  </p>
                  
                  <div className="flex items-center justify-end pt-4 border-t border-steward-dark/5 mt-auto">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-steward-dark/40 uppercase tracking-widest">
                      <Calendar size={12} />
                      {formattedDate}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-steward-dark/5 shadow-md mt-8">
            <div className="w-16 h-16 bg-steward-offwhite rounded-2xl flex items-center justify-center mx-auto mb-4 border border-steward-gold/20">
              <Search className="text-steward-gold" size={24} />
            </div>
            <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight">No Sessions Found</h3>
            <p className="text-sm text-steward-dark/60 font-bold mt-2">Try adjusting your search query.</p>
          </div>
        )}

      </main>
    </div>
  );
}
