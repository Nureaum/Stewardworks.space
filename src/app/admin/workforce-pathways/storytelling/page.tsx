'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, PenTool } from 'lucide-react';
import Link from 'next/link';
import ContentCreatorEditor from '@/components/admin/ContentCreatorEditor';
import { useAdminLoading } from '@/context/AdminLoadingContext';

export default function StorytellingAdminPage() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const { setIsLoading } = useAdminLoading();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Fetch the existing storytelling article, if any
    fetch('/api/admin/content?type=pathways_article')
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          setInitialData(data.items[0]);
        }
        setIsLoading(false);
        setHasLoaded(true);
      })
      .catch(err => {
        console.error('Error fetching article:', err);
        setIsLoading(false);
        setHasLoaded(true);
      });
  }, []);

  const handleSubmit = async (payload: any) => {
    // If we have an existing ID, we do a PUT. Otherwise, POST.
    const method = initialData?.id ? 'PUT' : 'POST';
    const body = { ...payload };
    
    if (initialData?.id) {
      body.id = initialData.id;
    }

    const url = initialData?.id ? `/api/admin/content/${initialData.id}` : '/api/admin/content';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save content');
    }

    // Redirect back to workforce pathways admin dashboard
    router.push('/admin/workforce-pathways');
    router.refresh();
  };

  const handleCancel = () => {
    router.push('/admin/workforce-pathways');
  };

  if (!hasLoaded) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA] font-exo -mx-8 -my-8 md:m-0">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/workforce-pathways" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Content Creator Skills</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {initialData ? 'Edit the content creator skills' : 'Create the content creator skills'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <ContentCreatorEditor
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
