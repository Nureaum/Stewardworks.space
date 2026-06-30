'use client'; // Force rebuild

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminLoading } from '@/context/AdminLoadingContext';

export default function JobProfilesAdminPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const { setIsLoading } = useAdminLoading();
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setIsLoading(true);
    fetch('/api/admin/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data.items || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job profile?')) return;
    
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchJobs();
      } else {
        alert('Failed to delete job profile');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F8F9FA] font-exo -mx-8 -my-8 md:m-0">
      <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/admin/workforce-pathways" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-steward-dark transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Job Profiles</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Manage the career roadmaps available in Workforce Pathways
            </p>
          </div>
        </div>
        
        <Link 
          href="/admin/workforce-pathways/jobs/new"
          className="flex items-center gap-2 bg-steward-dark text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors"
        >
          <Plus size={16} /> Create Profile
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="bg-white rounded-[2rem] shadow-sm border border-steward-dark/5 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-black text-steward-dark uppercase tracking-widest">Job Title</th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-steward-dark uppercase tracking-widest">Company</th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-steward-dark uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-right text-[11px] font-black text-steward-dark uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-steward-dark/50 font-bold">
                  No job profiles found. Create one to get started!
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-steward-dark">{job.job_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-steward-dark/70">
                    {job.company_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      job.status === 'published' 
                        ? 'bg-steward-green/20 text-steward-green' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-4">
                      <Link 
                        href={`/admin/workforce-pathways/jobs/${job.id}`} 
                        className="text-steward-blue hover:text-blue-800 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(job.id)}
                        className="text-red-500 hover:text-red-700"
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
  </div>
  );
}
