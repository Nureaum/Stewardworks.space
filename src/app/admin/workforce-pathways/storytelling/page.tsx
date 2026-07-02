'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, PenTool, ArrowLeft, Plus, Search, Filter, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLoading } from '@/context/AdminLoadingContext';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

export default function StorytellingAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const { setIsLoading } = useAdminLoading();
  const [processing, setProcessing] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchItems = () => {
    setIsLoading(true);
    fetch('/api/admin/content?type=pathways_article')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        if (data.userRole) setUserRole(data.userRole);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const confirmDelete = (id: string) => {
    setDeleteModalState({ isOpen: true, id });
  };

  const handleDelete = async () => {
    const id = deleteModalState.id;
    if (!id) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted successfully');
      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
      setDeleteModalState({ isOpen: false, id: null });
    }
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    setProcessing(item.id);
    
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      toast.success(`Marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [totalPages, currentPage]);

  const totalPublished = items.filter(i => i.status === 'published').length;
  const totalDrafts = items.filter(i => i.status === 'draft').length;

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
      <div className="mb-[16px]">
        <Link 
          href="/admin/workforce-pathways" 
          className="inline-flex items-center gap-[6px] px-[12px] py-[7px] rounded-[10px] bg-[#785a32]/5 hover:bg-[#785a32]/10 text-[#5c4f3c] text-[12px] font-[700] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Workforce Pathways
        </Link>
      </div>
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

      <div className="flex flex-col sm:flex-row gap-[10px] items-stretch mb-[22px]">
        <div className="flex flex-1 items-center gap-[10px] bg-white border border-[#785a32]/16 rounded-[14px] px-[18px] py-[11px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] w-full">
          <Search size={17} className="text-[#a89a82] shrink-0" />
          <input 
            type="text" 
            placeholder="Search articles..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 border-none bg-transparent text-[14.5px] text-[#241c12] focus:outline-none placeholder:text-[#a89a82]"
          />
        </div>
        
        <div className="flex items-center bg-white border border-[#785a32]/16 rounded-[14px] px-[18px] py-[11px] shadow-[0_4px_12px_rgba(120,90,50,0.07)] relative w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-auto appearance-none bg-transparent border-none text-[14.5px] text-[#241c12] focus:outline-none cursor-pointer pr-[24px]"
          >
            <option value="All">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <div className="absolute right-[18px] top-1/2 -translate-y-1/2 pointer-events-none text-[#a89a82]">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#785a32]/10">
            <thead className="bg-[#fbf5e6] border-b border-[#785a32]/10">
              <tr>
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Article Title</th>
                {userRole === 'super_admin' && (
                  <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Posted By</th>
                )}
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Status</th>
                <th className="px-[28px] py-[18px] text-right text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#785a32]/5 bg-white">
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={userRole === 'super_admin' ? 4 : 3} className="px-[28px] py-[40px] text-center">
                  <div className="w-16 h-16 bg-[#fbf5e6] rounded-[22px] flex items-center justify-center mx-auto mb-4 text-[#a89a82]">
                    <Search size={24} />
                  </div>
                  <p className="text-[11px] font-mono text-[#8a7c66] uppercase tracking-[0.16em]">No matching articles found.</p>
                </td></tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fbf5e6]/30 transition-colors group">
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <span className="text-[15px] font-[700] text-[#241c12] tracking-tight">{item.title || 'Untitled'}</span>
                    </td>
                    {userRole === 'super_admin' && (
                      <td className="px-[28px] py-[18px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-[700] text-[#2f5a37]">{item.author?.full_name || 'Unknown Admin'}</span>
                          <span className="text-[11px] text-[#8a7c66] mt-0.5">{item.author?.email}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(item)}
                          disabled={processing === item.id}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
                            item.status === 'published' ? 'bg-[#2f5a37]' : 'bg-[#e0d6c8]'
                          } ${processing === item.id ? 'opacity-50 cursor-wait' : ''}`}
                          title="Toggle status"
                        >
                          <span 
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              item.status === 'published' ? 'translate-x-6' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          item.status === 'published' ? 'text-[#2f5a37]' : 'text-[#a89a82]'
                        }`}>
                          {processing === item.id ? 'Saving...' : item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-[28px] py-[18px] whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/workforce-pathways/storytelling/${item.id}`} 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-[#785a32]/10 rounded-[8px] text-[10px] font-mono text-[#a89a82] uppercase tracking-[0.12em] hover:bg-[#fbf5e6] hover:text-[#7a5a1e] hover:border-[#efd9a8] transition-all"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          disabled={processing === item.id}
                          className="inline-flex items-center justify-center p-2 bg-transparent border border-[#785a32]/10 rounded-[8px] text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50"
                          title="Delete Article"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
