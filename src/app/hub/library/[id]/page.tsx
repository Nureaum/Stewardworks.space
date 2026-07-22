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
    console.log('[Library Detail] Fetching resource:', params.id);
    fetch(`/api/public/library-resources/${params.id}?t=${Date.now()}`)
      .then(res => {
        console.log('[Library Detail] API response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[Library Detail] API response data:', data);
        setResource(data.resource);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Library Detail] Fetch error:', err);
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

  // Debug: Log all media to see what's being fetched
  console.log('[Library Detail] All media:', resource.media);
  
  // Debug: Log each media item's type
  resource.media?.forEach((m: any, idx: number) => {
    console.log(`[Library Detail] Media ${idx}: type="${m.media_type}" url="${m.url}"`);
  });
  
  // Helper function to detect if URL is actually an image
  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url || '');
  const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/i.test(url || '');
  
  const images = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    // Check if it's marked as image OR if it's marked as video but URL is actually an image
    return type === 'image' || type === 'image_link' || type === 'image_url' || 
           (type === 'video_link' && isImageUrl(m.url));
  }) || [];
  
  const videos = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    // Only include if marked as video AND URL is actually a video (exclude misclassified images)
    return (type === 'video_link' || type === 'video' || type === 'video_url') && 
           !isImageUrl(m.url);
  }) || [];
  const pdfs = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return type === 'pdf';
  }) || [];
  const audios = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return type === 'external_link' || type === 'audio' || type === 'audio_link' || type === 'audio_url';
  }) || [];
  const links = resource.media?.filter((m: any) => m.media_type === 'link') || [];
  
  // Debug: Log filtered results
  console.log('[Library Detail] Filtered images:', images);
  console.log('[Library Detail] Filtered videos:', videos);
  console.log('[Library Detail] Filtered audios:', audios);
  
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
        {activeTab === 'summary' && (
          <>
            {resource.body && (
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

            {!resource.body && links.length === 0 && (
              <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-steward-dark/5 text-center">
                <BookOpen className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No summary content yet</p>
              </div>
            )}

            {/* External Links Section */}
            {links.length > 0 && (
              <div className="w-full bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-steward-dark/5">
                <h2 className="text-xl md:text-2xl font-black text-steward-dark uppercase tracking-tight mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-steward-blue/10 flex items-center justify-center">
                    <ChevronLeft className="rotate-180 text-steward-blue" size={20} />
                  </div>
                  External Resources
                </h2>
                <div className="space-y-4">
                  {links.map((link: any, idx: number) => (
                    <a
                      key={link.id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 bg-gradient-to-r from-steward-blue/5 to-transparent hover:from-steward-blue/10 border border-steward-blue/20 rounded-2xl transition-all group"
                    >
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-steward-blue flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        {link.media_type === 'video_link' ? (
                          <Video size={20} />
                        ) : (
                          <ChevronLeft className="rotate-180" size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-steward-dark text-base mb-1 group-hover:text-steward-blue transition-colors">
                          {link.label || 'View Resource'}
                        </p>
                        <p className="text-xs text-steward-dark/50 font-mono truncate">
                          {link.url}
                        </p>
                      </div>
                      <ChevronLeft className="rotate-180 text-steward-blue shrink-0 group-hover:translate-x-1 transition-transform" size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
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
                      onError={(e) => {
                        console.error('[Gallery] Failed to load image:', media.url);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full aspect-[4/3] flex flex-col items-center justify-center bg-gray-100 text-gray-400';
                          fallback.innerHTML = `<svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Image unavailable</p>`;
                          parent.insertBefore(fallback, e.currentTarget);
                        }
                      }}
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
                  <VideoCard key={media.id || idx} media={media} />
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
              <div className="grid grid-cols-1 gap-6">
                {audios.map((audio: any, idx: number) => {
                  const isDirectAudio = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(audio.url || '');
                  return (
                    <div key={audio.id || idx} className="flex flex-col bg-white rounded-2xl p-6 border border-steward-dark/5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
                          <Music size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-steward-dark text-sm truncate">{audio.label || `Audio ${idx + 1}`}</p>
                          <p className="text-[10px] text-steward-dark/50 font-black uppercase tracking-widest mt-1">Audio {isDirectAudio ? 'File' : 'Link'}</p>
                        </div>
                      </div>
                      {isDirectAudio ? (
                        <audio src={audio.url} controls className="w-full rounded-xl" />
                      ) : (
                        <div className="pt-4 border-t border-gray-100">
                          <a href={audio.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 text-white hover:bg-purple-600 text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
                            <Music size={14} /> Listen Now
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
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

/* ── VideoCard: handles YouTube, Vimeo, direct video files, and fallback links ── */
function VideoCard({ media }: { media: any }) {
  const [videoError, setVideoError] = useState(false);
  
  const url = media.url || '';
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');
  const isDirectVideo = /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/i.test(url);

  const getYouTubeId = (u: string) => {
    if (u.includes('youtu.be/')) return u.split('youtu.be/')[1]?.split('?')[0];
    if (u.includes('youtube.com')) return new URLSearchParams(u.split('?')[1] || '').get('v');
    return null;
  };

  return (
    <div className="rounded-[2rem] overflow-hidden border border-steward-dark/5 shadow-sm bg-black">
      {isYouTube ? (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(url)}`}
            className="w-full h-full border-none"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : isVimeo ? (
        <div className="aspect-video">
          <iframe
            src={`https://player.vimeo.com/video/${url.split('/').pop()}`}
            className="w-full h-full border-none"
            allowFullScreen
          />
        </div>
      ) : isDirectVideo && !videoError ? (
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full aspect-video object-cover"
          onError={() => setVideoError(true)}
        />
      ) : url ? (
        // Fallback: show as a clickable link with a video icon
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-colors"
        >
          <Video className="text-white/60" size={40} />
          <span className="text-white/80 text-sm font-bold px-6 text-center">Click to open video</span>
          <span className="text-white/40 text-xs font-mono truncate max-w-[80%]">{url}</span>
        </a>
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
          <Video className="text-gray-600" size={40} />
        </div>
      )}
      {media.label && (
        <div className="px-5 py-3 bg-white">
          <p className="text-xs font-bold text-steward-dark/60 truncate">{media.label}</p>
        </div>
      )}
    </div>
  );
}
