import React from 'react';
import Link from 'next/link';
import { ChevronLeft, PenTool, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { format } from 'date-fns';

export const revalidate = 0; // Ensure data is fresh

export default async function StorytellingPage() {
  const supabase = createServerSupabaseClient();

  // Fetch Storytelling Articles
  const { data: articles } = await supabase
    .from('content_items')
    .select('*, author:profiles!updated_by(first_name, last_name)')
    .eq('content_type', 'pathways_article')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

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

      <main className="w-full max-w-7xl mx-auto px-8 md:px-16 py-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles && articles.length > 0 ? (
            articles.map(article => {
              const authorName = article.author 
                ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim()
                : 'Steward Team';
                
              return (
                <Link 
                  key={article.id} 
                  href={`/hub/workforce-pathways/storytelling/${article.id}`}
                  className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-steward-dark/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 bg-steward-orange/10 rounded-2xl flex items-center justify-center mb-6 text-steward-orange group-hover:scale-110 transition-transform">
                      <BookOpen size={24} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-steward-dark mb-3 line-clamp-2">
                      {article.title || 'Content Creator Skills Guide'}
                    </h2>
                    <p className="text-steward-dark/60 text-sm font-medium mb-6">
                      Explore detailed modules on storytelling, monetization, job opportunities, and how to become a successful content creator.
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-steward-dark text-white flex items-center justify-center text-xs font-bold">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-steward-dark">{authorName}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} />
                          {format(new Date(article.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-steward-dark group-hover:bg-steward-orange group-hover:text-white transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-[2rem] p-8 md:p-12 shadow-md border border-steward-dark/5 flex flex-col items-center justify-center py-32 text-center text-steward-dark/50">
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
