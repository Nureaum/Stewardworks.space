import React from 'react';
import Link from 'next/link';
import { ChevronLeft, PenTool, Clock, Calendar } from 'lucide-react';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Ensure data is fresh

export default async function StorytellingArticlePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  // Fetch Storytelling Article
  const { data: article } = await supabase
    .from('content_items')
    .select('*, author:profiles!updated_by(first_name, last_name)')
    .eq('id', params.id)
    .single();

  if (!article || article.status !== 'published') {
    notFound();
  }

  const authorName = article.author 
    ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim()
    : 'Steward Team';

  let parsedSections: any = null;
  try {
    parsedSections = JSON.parse(article.body || '{}');
  } catch (e) {
    // Fallback to legacy HTML
  }

  const isJSON = parsedSections && typeof parsedSections === 'object';
  
  const sections = isJSON ? [
    { id: 'storytelling', title: 'Storytelling', content: parsedSections.storytelling },
    { id: 'monetization', title: 'Monetization Methods', content: parsedSections.monetization },
    { id: 'becoming', title: 'Becoming a Content Creator', content: parsedSections.becoming },
    { id: 'opportunities', title: 'Job Opportunities', content: parsedSections.opportunities }
  ] : [];

  return (
    <div className="min-h-screen bg-steward-offwhite font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="w-full mx-auto px-4 md:px-8 relative z-10 max-w-5xl">
          <Link href="/hub/workforce-pathways/storytelling" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Guides
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-steward-orange/20 rounded-2xl flex items-center justify-center text-steward-orange">
                  <PenTool size={24} />
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/60">
                  <span className="flex items-center gap-1"><Clock size={14} /> By {authorName}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                {article.title || 'Content Creator Skills'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-8 py-12 relative z-20">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-md border border-steward-dark/5">
          {isJSON ? (
            <div className="space-y-12">
              {sections.filter(s => s.content).map(section => (
                <div key={section.id} className="bg-steward-cream/10 rounded-3xl p-8 border border-steward-dark/5">
                  <h3 className="text-2xl font-black text-steward-orange uppercase tracking-tight mb-8 pb-4 border-b border-steward-dark/10">
                    {section.title}
                  </h3>
                  <div className="prose prose-lg max-w-none text-steward-dark/80 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-steward-blue">
                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                  </div>
                </div>
              ))}
              {sections.every(s => !s.content) && (
                <div className="text-steward-dark/50 text-center py-20 font-medium text-lg">
                  This guide is currently empty. Check back later!
                </div>
              )}
            </div>
          ) : (
            // Legacy rendering
            <div className="prose prose-lg max-w-none text-steward-dark/80 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-steward-blue">
              <div dangerouslySetInnerHTML={{ __html: article.body || '' }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
