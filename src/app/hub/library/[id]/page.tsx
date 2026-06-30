'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Tag, Calendar, FileText, Download, Eye, Image as ImageIcon, Video, Music } from 'lucide-react';
import Link from 'next/link';

export default function LibraryResourceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'gallery' | 'videos' | 'pdfs' | 'audio'>('summary');

  useEffect(() => {
    fetch(`/api/public/library-resources/${params.id}?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setResource(data.resource);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-exo">
        <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-8 font-exo text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="text-gray-400" size={32} />
        </div>
        <h1 className="text-3xl font-black text-steward-dark uppercase tracking-tighter mb-4">Resource Not Found</h1>
        <p className="text-steward-dark/60 mb-8 max-w-md">The library resource you are looking for does not exist or has been removed.</p>
        <Link 
          href="/hub/library"
          className="bg-steward-dark text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all text-xs"
        >
          Return to Library
        </Link>
      </div>
    );
  }

  const images = resource.media?.filter((m: any) => m.media_type === 'image') || [];
  const videos = resource.media?.filter((m: any) => m.media_type === 'video_link') || [];
  const pdfs = resource.media?.filter((m: any) => m.media_type === 'pdf') || [];
  const audios = resource.media?.filter((m: any) => m.media_type === 'external_link') || [];
  
  const headerBgUrl = resource.thumbnail_url || (images.length > 0 ? images[0].url : null);
  
  let formattedDate = 'Date TBD';
  try {
    formattedDate = new Date(resource.published_at || resource.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    // fallback
  }

  const tabs = [
    { id: 'summary' as const, label: 'Summary', icon: BookOpen },
    { id: 'gallery' as const, label: 'Photos', icon: ImageIcon, count: images.length },
    { id: 'videos' as const, label: 'Videos', icon: Video, count: videos.length },
    { id: 'pdfs' as const, label: 'PDFs', icon: FileText, count: pdfs.length },
    { id: 'audio' as const, label: 'Audio', icon: Music, count: audios.length },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-exo pb-24">
      {/* Header */}
      <header className="relative w-full bg-steward-dark overflow-hidden pt-12 pb-16">
        {headerBgUrl ? (
          <>
            <img src={headerBgUrl} alt={resource.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-steward-dark via-steward-dark/50 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        )}
        
        <div className="w-full mx-auto px-8 md:px-16 relative z-10">
          <Link href="/hub/library" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-12">
            <ChevronLeft size={16} /> Back to Library
          </Link>
          
          <div className="w-full">
            <div className="flex items-center gap-4 mb-6">
              {resource.category && (
                <span className="bg-steward-gold text-steward-dark px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                  <Tag size={12} /> {resource.category.label}
                </span>
              )}
              <span className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                <Calendar size={14} /> {formattedDate}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-8">
              {resource.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="w-full mx-auto px-8 md:px-16 max-w-5xl -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-steward-dark/5 p-2 flex gap-1.5 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasContent = tab.id === 'summary' || (tab.count !== undefined && tab.count > 0);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-steward-dark text-white shadow-md'
                    : hasContent
                      ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      : 'bg-gray-50 text-gray-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-steward-dark/10 text-steward-dark'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full mx-auto px-8 md:px-16 py-12 relative z-20 space-y-12 max-w-5xl">
        
        {/* Summary Tab */}
        {activeTab === 'summary' && resource.body && (
          <article className="w-full bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-steward-dark/5">
            <div 
              className="
                prose md:prose-lg max-w-none text-steward-dark/80 
                prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight 
                prose-a:text-steward-blue prose-a:font-bold hover:prose-a:text-steward-green 
                
                [&_img]:rounded-3xl [&_img]:shadow-md [&_img]:mx-auto [&_img]:max-w-3xl [&_img]:w-full
                [&_video]:rounded-3xl [&_video]:shadow-md [&_video]:mx-auto [&_video]:max-w-3xl [&_video]:w-full
                [&_iframe]:rounded-3xl [&_iframe]:shadow-md [&_iframe]:mx-auto [&_iframe]:max-w-3xl [&_iframe]:w-full
                [&_figure]:mx-auto [&_figure]:max-w-3xl [&_figure]:w-full
                [&_figure_img]:w-full [&_figure_img]:m-0
              "
              dangerouslySetInnerHTML={{ __html: resource.body }}
            />
          </article>
        )}

        {activeTab === 'summary' && !resource.body && (
          <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={40} />
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No summary content yet</p>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((media: any, idx: number) => (
                  <div key={media.id || idx} className="rounded-[2rem] overflow-hidden border border-steward-dark/5 shadow-sm bg-steward-cream/20 group">
                    <img 
                      src={media.url} 
                      alt={media.label || 'Resource Photo'} 
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {media.label && (
                      <div className="px-5 py-3 bg-white">
                        <p className="text-xs font-bold text-steward-dark/60 truncate">{media.label}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
                <ImageIcon className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No photos available</p>
              </div>
            )}
          </>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((media: any, idx: number) => (
                  <div key={media.id || idx} className="rounded-[2rem] overflow-hidden border border-steward-dark/5 shadow-sm bg-black">
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full aspect-video object-cover"
                    />
                    {media.label && (
                      <div className="px-5 py-3 bg-white">
                        <p className="text-xs font-bold text-steward-dark/60 truncate">{media.label}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
                <Video className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No videos available</p>
              </div>
            )}
          </>
        )}

        {/* PDFs Tab */}
        {activeTab === 'pdfs' && (
          <>
            {pdfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdfs.map((file: any, idx: number) => (
                  <div key={file.id || idx} className="flex flex-col bg-white rounded-2xl p-6 border border-steward-dark/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-steward-dark text-sm truncate">{file.label || `Document ${idx + 1}`}</p>
                        <p className="text-[10px] text-steward-dark/50 font-black uppercase tracking-widest mt-1">PDF Document</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-steward-dark text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
                        <Eye size={14} /> Preview
                      </a>
                      <a href={file.url} download target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-steward-blue text-white hover:bg-blue-700 text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No documents available</p>
              </div>
            )}
          </>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <>
            {audios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {audios.map((audio: any, idx: number) => (
                  <div key={audio.id || idx} className="flex flex-col bg-white rounded-2xl p-6 border border-steward-dark/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
                        <Music size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-steward-dark text-sm truncate">{audio.label || `Audio ${idx + 1}`}</p>
                        <p className="text-[10px] text-steward-dark/50 font-black uppercase tracking-widest mt-1">Audio Link</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <a href={audio.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 text-white hover:bg-purple-600 text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
                        <Music size={14} /> Listen Now
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
                <Music className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No audio available</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
