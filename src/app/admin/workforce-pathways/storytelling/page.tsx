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
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA] font-exo -mx-8 -my-8 md:m-0">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/workforce-pathways" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Content Creator Skills</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Manage the content creator skills articles
            </p>
          </div>
        </div>
        <Link 
          href="/admin/workforce-pathways/storytelling/new"
          className="flex items-center gap-2 bg-steward-dark text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-sm hover:shadow"
        >
          <Plus size={16} /> New Article
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">

          <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-steward-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-steward-blue/20 focus:border-steward-blue transition-all shadow-sm"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-steward-dark focus:outline-none focus:ring-2 focus:ring-steward-blue/20 focus:border-steward-blue transition-all shadow-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-steward-dark/5 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Article Title</th>
                  {userRole === 'super_admin' && (
                    <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Posted By</th>
                  )}
                  <th className="px-8 py-5 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-right text-[11px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="text-gray-400" size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching articles found.</p>
                  </td></tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-black text-steward-dark tracking-tight">{item.title || 'Untitled'}</div>
                      </td>
                      {userRole === 'super_admin' && (
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-steward-blue">{item.author?.full_name || 'Unknown Admin'}</span>
                            <span className="text-[11px] text-gray-500 mt-0.5">{item.author?.email}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleStatus(item)}
                            disabled={processing === item.id}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
                              item.status === 'published' ? 'bg-steward-green' : 'bg-gray-200'
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
                            item.status === 'published' ? 'text-steward-green' : 'text-gray-400'
                          }`}>
                            {processing === item.id ? 'Saving...' : item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/admin/workforce-pathways/storytelling/${item.id}`} 
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-steward-dark uppercase tracking-widest hover:bg-gray-50 transition-all"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                          <button 
                            onClick={() => confirmDelete(item.id)}
                            className="inline-flex items-center justify-center p-2 bg-white border border-gray-100 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all disabled:opacity-50"
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
      </main>

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
