'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ContentCreatorEditor from '@/components/admin/ContentCreatorEditor';
import { useAdminLoading } from '@/context/AdminLoadingContext';

export default function NewStorytellingAdminPage() {
  const router = useRouter();
  const { setIsLoading } = useAdminLoading();

  const handleSubmit = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save content');
      }

      router.push('/admin/workforce-pathways/storytelling');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to save content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/workforce-pathways/storytelling');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA] font-exo -mx-8 -my-8 md:m-0">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/workforce-pathways/storytelling" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Content Creator Skills</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Create a new content creator skills article
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <ContentCreatorEditor
            initialData={null}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
