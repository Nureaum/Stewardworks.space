import { createServerSupabaseClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Calendar } from 'lucide-react'
import { notFound } from 'next/navigation'

export const revalidate = 0 // always fetch fresh

export default async function EnvironmentalLiteracyArticlePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  
  const { data: block } = await supabase
    .from('content_items')
    .select(`
      *,
      topic:env_literacy_topics(label),
      author:profiles!content_items_created_by_fkey(first_name, last_name, avatar_url)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!block || block.status !== 'published') {
    notFound()
  }

  const authorName = block.author ? `${block.author.first_name} ${block.author.last_name}` : 'Admin'
  const authorAvatar = block.author?.avatar_url || '/img/default-avatar.png'
  const dateStr = new Date(block.published_at || block.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-exo">
      {/* Header */}
      <header className="relative w-full bg-steward-dark overflow-hidden pt-12 pb-16">
        {block.thumbnail_url ? (
          <>
            <img src={block.thumbnail_url} alt={block.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-steward-dark via-steward-dark/50 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        )}
        
        <div className="w-full mx-auto px-8 md:px-16 relative z-10">
          <Link href="/hub/environmental-literacy" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-12">
            <ChevronLeft size={16} /> Back to Articles
          </Link>
          
          <div className="w-full">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-steward-green text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {block.topic?.label || 'General'}
              </span>
              <span className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                <Calendar size={14} /> {dateStr}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-2">
              {block.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full mx-auto px-8 md:px-16 py-16 relative z-20">
        <article className="w-full">
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
            dangerouslySetInnerHTML={{ __html: block.body }}
          />
        </article>
      </main>
    </div>
  )
}
