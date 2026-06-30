import React from 'react';
import Link from 'next/link';
import { ChevronLeft, PenTool } from 'lucide-react';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const revalidate = 0; // Ensure data is fresh

export default async function StorytellingPage() {
  const supabase = createServerSupabaseClient();

  // Fetch Storytelling Article
  const { data: articles } = await supabase
    .from('content_items')
    .select('*')
    .eq('content_type', 'pathways_article')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);
    
  const article = articles?.[0] || null;

  return (
    <div className="min-h-screen bg-steward-offwhite font-exo pb-20">
      {/* Header */}
      <header className="bg-steward-dark text-white pt-12 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="w-full mx-auto px-4 md:px-8 relative z-10">
          <Link href="/hub/workforce-pathways" className="inline-flex items-center gap-2 text-steward-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Pathways
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
            <div>
              <PenTool size={48} className="text-steward-orange mb-6 drop-shadow-md" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Content Creator Skills</h1>
              <p className="text-white/60 font-bold uppercase tracking-widest mt-2 max-w-xl text-sm leading-relaxed">
                Learn how to tell your story, monetize your content, and turn your environmental passion into a successful creator career.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-8 md:px-16 py-12 relative z-20">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-md border border-steward-dark/5">
          {article ? (
            (() => {
              let parsedSections: any = null;
              try {
                parsedSections = JSON.parse(article.body || '{}');
              } catch (e) {
                // Fallback to legacy HTML
              }

              if (parsedSections && typeof parsedSections === 'object') {
                const sections = [
                  { id: 'storytelling', title: 'Storytelling', content: parsedSections.storytelling },
                  { id: 'monetization', title: 'Monetization Methods', content: parsedSections.monetization },
                  { id: 'becoming', title: 'Becoming a Content Creator', content: parsedSections.becoming },
                  { id: 'opportunities', title: 'Job Opportunities', content: parsedSections.opportunities }
                ];
                return (
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
                );
              }

              // Legacy rendering
              return (
                <div className="prose prose-lg max-w-none text-steward-dark/80 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-steward-blue">
                  <div dangerouslySetInnerHTML={{ __html: article.body || '' }} />
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center text-steward-dark/50">
              <PenTool size={48} className="text-steward-dark/10 mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Coming Soon</h2>
              <p className="font-medium">Check back soon for content creator and storytelling resources.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
