'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, BookOpen, Calendar, FileText, Download, Eye, Image as ImageIcon, Video, Music, ExternalLink, Tag, Globe, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

/* ── Collapsible Media Section ── */
function MediaSection({ 
  title, 
  icon: Icon, 
  count, 
  color, 
  children,
  defaultOpen = false 
}: { 
  title: string; 
  icon: any; 
  count: number; 
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasContent = count > 0;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${hasContent ? 'bg-white shadow-sm border border-[#21282E]/5' : 'bg-[#21282E]/[0.02] border border-dashed border-[#21282E]/10'}`}>
      <button
        onClick={() => hasContent && setOpen(!open)}
        disabled={!hasContent}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all ${
          hasContent ? 'hover:bg-[#FEFAE0]/60 cursor-pointer' : 'cursor-not-allowed'
        }`}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
          style={{ 
            backgroundColor: hasContent ? color + '14' : '#f3f3f3',
            transform: open ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Icon size={18} style={{ color: hasContent ? color : '#bbb' }} />
        </div>
        <div className="flex-1">
          <span className={`font-black text-sm uppercase tracking-wide ${hasContent ? 'text-[#21282E]' : 'text-[#21282E]/30'}`}>
            {title}
          </span>
          {!hasContent && (
            <span className="block text-[10px] text-[#21282E]/25 mt-0.5" style={{ fontFamily: '"Courier New", monospace' }}>
              No content available
            </span>
          )}
        </div>
        {hasContent && (
          <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: color + '12', color }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
        {hasContent && (
          <ChevronDown 
            size={18} 
            className={`text-[#21282E]/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} 
          />
        )}
      </button>
      {open && hasContent && (
        <div className="px-5 pb-5 pt-1 animate-[slideDown_0.25s_ease]">
          <div className="border-t border-[#21282E]/5 pt-5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── VideoCard ── */
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
    <div className="rounded-xl overflow-hidden shadow-md bg-black group">
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
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#21282E] to-[#0f1215] hover:from-[#2a3038] hover:to-[#181d22] transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <Video className="text-white/70" size={24} />
          </div>
          <span className="text-white/80 text-sm font-bold">Open Video</span>
          <span className="text-white/30 text-[10px] font-mono truncate max-w-[70%]">{url}</span>
        </a>
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-[#21282E]">
          <Video className="text-white/20" size={32} />
        </div>
      )}
      {media.label && (
        <div className="px-4 py-3 bg-[#21282E]">
          <p className="text-xs font-bold text-white/70 truncate">{media.label}</p>
        </div>
      )}
    </div>
  );
}

export default function LibraryResourceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/library-resources/${params.id}?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
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
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center font-exo">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#A27532] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#A27532]/60">Loading resource…</span>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex flex-col items-center justify-center p-8 font-exo text-center">
        <div className="w-24 h-24 bg-[#f5edd4] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <BookOpen className="text-[#A27532]" size={36} />
        </div>
        <h1 className="text-3xl font-black text-[#21282E] uppercase tracking-tighter mb-4">Resource Not Found</h1>
        <p className="text-[#21282E]/50 mb-8 max-w-md text-sm">The library resource you&apos;re looking for doesn&apos;t exist or has been removed from the stacks.</p>
        <Link 
          href="/hub/library"
          className="bg-[#21282E] text-[#FEFAE0] px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-black hover:scale-105 transition-all text-xs"
        >
          Return to Library
        </Link>
      </div>
    );
  }

  // Parse media
  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url || '');
  
  const images = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return type === 'image' || type === 'image_link' || type === 'image_url' || 
           (type === 'video_link' && isImageUrl(m.url));
  }) || [];
  
  const videos = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return (type === 'video_link' || type === 'video' || type === 'video_url') && 
           !isImageUrl(m.url);
  }) || [];

  const pdfs = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return type === 'pdf';
  }) || [];

  const audios = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    const url = (m.url || '').toLowerCase();
    const isAudioFile = /\.(mp3|wav|ogg|m4a|flac|aac|wma)(\?|#|$)/i.test(url);
    return type === 'audio' || type === 'audio_link' || type === 'audio_url' || isAudioFile;
  }) || [];

  const links = resource.media?.filter((m: any) => {
    const type = m.media_type?.toLowerCase() || '';
    return type === 'link' || type === 'external_link';
  }) || [];

  let formattedDate = 'Date TBD';
  try {
    formattedDate = new Date(resource.published_at || resource.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {}

  const shortDate = (() => {
    try {
      const d = new Date(resource.published_at || resource.created_at);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    } catch { return 'N/A'; }
  })();

  const categoryCode = resource.category?.code || '000.0';
  const heroImage = images.length > 0 ? images[0].url : null;
  const sourceHostname = (() => {
    try { return new URL(resource.external_url).hostname.replace(/^www\./, ''); } catch { return ''; }
  })();

  return (
    <div className="min-h-screen bg-[#FEFAE0] font-exo" style={{ backgroundImage: 'radial-gradient(rgba(45,75,62,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 2000px; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stampIn { from { opacity: 0; transform: rotate(-8deg) scale(0.7); } to { opacity: 1; transform: rotate(-3deg) scale(1); } }
      `}} />

      {/* ═══════ HERO HEADER ═══════ */}
      <header className="relative w-full overflow-hidden">
        {/* Dark wood-grain style header */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1f14] via-[#3d2b1a] to-[#1a1209]"></div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,.1) 2px, rgba(255,255,255,.1) 3px)', backgroundSize: '5px 5px' }}></div>
        
        {/* Gold trim top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c4a55a] to-transparent"></div>
        
        {/* Warm overhead glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255,200,50,.08), transparent 70%)' }}></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-6 pb-12">
          {/* Navigation */}
          <div className="flex items-center gap-6 mb-10">
            <Link 
              href="/hub/library" 
              className="inline-flex items-center gap-2 text-[#c4a55a]/70 text-[11px] font-bold uppercase tracking-[.15em] hover:text-[#c4a55a] transition-colors no-underline group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Go to Library
            </Link>
            
            {resource.category && (
              <Link 
                href={`/hub/library?category=${resource.category.slug || resource.category.id || ''}`}
                className="inline-flex items-center gap-2 text-[#c4a55a]/70 text-[11px] font-bold uppercase tracking-[.15em] hover:text-[#c4a55a] transition-colors no-underline group"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Go to {resource.category.label}
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left: Text content */}
            <div className="flex-1 min-w-0" style={{ animation: 'fadeUp 0.5s ease' }}>
              {/* Dewey code badge */}
              <div className="flex items-center gap-3 mb-5">
                <span className="px-3 py-1.5 rounded-lg bg-[#c4a55a]/15 text-[#c4a55a] text-[11px] font-black tracking-widest" style={{ fontFamily: '"Courier New", monospace' }}>
                  {categoryCode}
                </span>
                {resource.resource_type && (
                  <span className="px-3 py-1.5 rounded-lg bg-[#7A2E2E] text-white text-[10px] font-black uppercase tracking-wider">
                    {resource.resource_type}
                  </span>
                )}
                {resource.source_tag === 'contributor' && (
                  <span className="px-3 py-1.5 rounded-lg bg-[#2E5534] text-white text-[10px] font-black uppercase tracking-wider">
                    ★ Contributor
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
                {resource.title}
              </h1>

              {/* Meta row */}
              <div className="flex items-center gap-4 flex-wrap">
                {resource.category && (
                  <span className="flex items-center gap-2 text-white/50 text-xs font-bold">
                    <Tag size={12} className="text-[#c4a55a]" />
                    {resource.category.label}
                  </span>
                )}
                <span className="flex items-center gap-2 text-white/40 text-xs">
                  <Calendar size={12} />
                  {formattedDate}
                </span>
                {sourceHostname && (
                  <span className="flex items-center gap-2 text-white/40 text-xs">
                    <Globe size={12} />
                    {sourceHostname}
                  </span>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Gold decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#c4a55a] to-transparent"></div>
          <div className="h-1 bg-gradient-to-b from-[#c4a55a]/10 to-transparent"></div>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-8" style={{ animation: 'fadeUp 0.5s ease 0.3s both' }}>
        
        {/* ─── Source Link Card ─── */}
        {resource.external_url && (
          <a 
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-[#21282E]/5 hover:shadow-md hover:border-[#417C98]/30 transition-all group no-underline"
          >
            <div className="w-12 h-12 rounded-xl bg-[#417C98]/10 flex items-center justify-center shrink-0 group-hover:bg-[#417C98]/20 transition-colors">
              <Globe size={20} className="text-[#417C98]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[#21282E] group-hover:text-[#417C98] transition-colors">
                Visit Original Source
              </p>
              <p className="text-[11px] text-[#21282E]/40 truncate mt-0.5" style={{ fontFamily: '"Courier New", monospace' }}>
                {resource.external_url}
              </p>
            </div>
            <ArrowUpRight size={18} className="text-[#21282E]/30 group-hover:text-[#417C98] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </a>
        )}

        {/* ─── Summary / Body ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#21282E]/5 overflow-hidden">
          <div className="px-6 md:px-8 py-4 border-b border-[#21282E]/5 bg-[#FEFAE0]/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#A27532]/10 flex items-center justify-center">
                <BookOpen size={14} className="text-[#A27532]" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[#21282E]/60">Summary</h2>
            </div>
          </div>
          <div className="px-6 md:px-8 py-6">
            {resource.body ? (
              <div 
                className="
                  prose prose-sm md:prose-base max-w-none text-[#21282E]/80 leading-relaxed
                  prose-headings:font-black prose-headings:text-[#21282E] prose-headings:tracking-tight
                  prose-a:text-[#417C98] prose-a:font-bold hover:prose-a:text-[#2E5534]
                  prose-strong:text-[#21282E]
                  [&_img]:rounded-xl [&_img]:shadow-md [&_img]:max-w-full
                  [&_video]:rounded-xl [&_video]:shadow-md [&_video]:max-w-full
                  [&_iframe]:rounded-xl [&_iframe]:shadow-md [&_iframe]:max-w-full [&_iframe]:aspect-video [&_iframe]:w-full
                "
                dangerouslySetInnerHTML={{ __html: resource.body }}
              />
            ) : (
              <div className="text-center py-8">
                <BookOpen className="mx-auto text-[#21282E]/15 mb-3" size={32} />
                <p className="text-sm text-[#21282E]/35 italic">No summary available for this resource.</p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Media Collection ─── */}
        <section>
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-[#c4a55a]/40 to-transparent"></div>
            <span className="text-[10px] font-black uppercase tracking-[.3em] text-[#A27532]/60" style={{ fontFamily: '"Courier New", monospace' }}>
              Media Collection
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#c4a55a]/40 to-transparent"></div>
          </div>

          <div className="space-y-3">
            {/* Photos */}
            <MediaSection title="Photos" icon={ImageIcon} count={images.length} color="#C8643F" defaultOpen={images.length > 0 && videos.length === 0}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((media: any, idx: number) => (
                  <div key={media.id || idx} className="rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer hover:shadow-md transition-shadow">
                    <img 
                      src={media.url} 
                      alt={media.label || 'Resource Photo'} 
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    {media.label && (
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-bold text-[#21282E]/50 truncate">{media.label}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </MediaSection>

            {/* Videos */}
            <MediaSection title="Videos" icon={Video} count={videos.length} color="#7A2E2E" defaultOpen={videos.length > 0}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((media: any, idx: number) => (
                  <VideoCard key={media.id || idx} media={media} />
                ))}
              </div>
            </MediaSection>

            {/* PDFs */}
            <MediaSection title="Documents" icon={FileText} count={pdfs.length} color="#B5552F">
              <div className="space-y-3">
                {pdfs.map((file: any, idx: number) => (
                  <div key={file.id || idx} className="flex items-center gap-4 p-4 bg-[#FEFAE0]/60 rounded-xl border border-[#21282E]/5">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#21282E] text-sm truncate">{file.label || `Document ${idx + 1}`}</p>
                      <p className="text-[10px] text-[#21282E]/35 font-bold uppercase tracking-wider mt-0.5" style={{ fontFamily: '"Courier New", monospace' }}>PDF</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-[#21282E] text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors no-underline shadow-sm border border-[#21282E]/5">
                        <Eye size={12} /> View
                      </a>
                      <a href={file.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2E5534] text-white hover:bg-[#1d3a23] text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors no-underline shadow-sm">
                        <Download size={12} /> Save
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </MediaSection>

            {/* Audio */}
            <MediaSection title="Audio" icon={Music} count={audios.length} color="#6E7E33">
              <div className="space-y-3">
                {audios.map((audio: any, idx: number) => {
                  const isDirectAudio = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(audio.url || '');
                  return (
                    <div key={audio.id || idx} className="flex flex-col gap-3 p-4 bg-[#FEFAE0]/60 rounded-xl border border-[#21282E]/5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center text-[#6E7E33] shadow-sm">
                          <Music size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#21282E] text-sm truncate">{audio.label || `Audio ${idx + 1}`}</p>
                          <p className="text-[10px] text-[#21282E]/35 font-bold uppercase tracking-wider mt-0.5" style={{ fontFamily: '"Courier New", monospace' }}>
                            {isDirectAudio ? 'Audio File' : 'Audio Link'}
                          </p>
                        </div>
                      </div>
                      {isDirectAudio ? (
                        <audio src={audio.url} controls className="w-full rounded-lg" />
                      ) : (
                        <a href={audio.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 bg-[#6E7E33] text-white hover:bg-[#5a6a2a] text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors no-underline shadow-sm">
                          <Music size={14} /> Listen Now
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </MediaSection>

            {/* External Links */}
            {links.length > 0 && (
              <MediaSection title="External Links" icon={ExternalLink} count={links.length} color="#417C98">
                <div className="space-y-2">
                  {links.map((link: any, idx: number) => (
                    <a
                      key={link.id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-[#FEFAE0]/60 hover:bg-[#FEFAE0] border border-[#21282E]/5 rounded-xl transition-all group no-underline"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#417C98]/10 flex items-center justify-center text-[#417C98] group-hover:scale-110 transition-transform">
                        <ExternalLink size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#21282E] text-sm group-hover:text-[#417C98] transition-colors">
                          {link.label || 'View Resource'}
                        </p>
                        <p className="text-[10px] text-[#21282E]/35 truncate mt-0.5" style={{ fontFamily: '"Courier New", monospace' }}>
                          {link.url}
                        </p>
                      </div>
                      <ArrowUpRight size={14} className="text-[#21282E]/20 group-hover:text-[#417C98] transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </MediaSection>
            )}
          </div>
        </section>

        {/* ─── Footer: Back to library ─── */}
        <div className="pt-6 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-[#21282E]/5"></div>
            <div className="h-px flex-1 bg-[#21282E]/5"></div>
          </div>
          <div className="text-center">
            <Link 
              href="/hub/library"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#21282E] text-[#FEFAE0] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black hover:shadow-xl hover:scale-[1.02] transition-all no-underline"
            >
              <ChevronLeft size={14} />
              Return to the Stacks
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
