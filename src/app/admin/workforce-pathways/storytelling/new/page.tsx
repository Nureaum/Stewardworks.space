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
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px] mb-[22px] flex-wrap">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Content Creator Skills</h1>
          <p className="mt-[8px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">MANAGE THE CONTENT CREATOR SKILLS ARTICLES</p>
        </div>
        <Link 
          href="/admin/workforce-pathways/storytelling/new" 
          className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
        >
          + New Article
        </Link>
      </div>

      <div className="w-full relative z-10 bg-white rounded-[22px] p-[30px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 max-w-[960px]">
        <div className="flex items-center gap-[12px] mb-[22px]">
          <button 
            onClick={handleCancel}
            className="w-[36px] h-[36px] rounded-[10px] border border-[#785a32]/20 bg-[#fbf5e6] flex items-center justify-center text-[#5c4f3c] hover:bg-[#f2ead2] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="font-[800] text-[18px] text-[#241c12] leading-none">New Article</div>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#a89a82] mt-[4px] uppercase leading-none">
              CREATE A NEW CONTENT CREATOR SKILLS ARTICLE
            </div>
          </div>
        </div>
        <ContentCreatorEditor
          initialData={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
