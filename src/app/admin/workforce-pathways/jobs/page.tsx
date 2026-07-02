'use client'; // Force rebuild

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminLoading } from '@/context/AdminLoadingContext';

export default function JobProfilesAdminPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const { setIsLoading } = useAdminLoading();
  const [userRole, setUserRole] = useState<string | null>(null);
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
        if (data.userRole) setUserRole(data.userRole);
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
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">Job Profiles</h1>
          <p className="mt-[8px] mb-0 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">MANAGE THE CAREER ROADMAPS AVAILABLE IN WORKFORCE PATHWAYS</p>
        </div>
        <Link 
          href="/admin/workforce-pathways/jobs/new"
          className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
        >
          + Create Profile
        </Link>
      </div>

      <div className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#785a32]/10">
            <thead className="bg-[#fbf5e6] border-b border-[#785a32]/10">
              <tr>
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Job Title</th>
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Company</th>
                {userRole === 'super_admin' && (
                  <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Posted By</th>
                )}
                <th className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Status</th>
                <th className="px-[28px] py-[18px] text-right text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#785a32]/5 bg-white">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'super_admin' ? 5 : 4} className="px-[28px] py-[40px] text-center text-[#a89a82] font-mono text-[11px] tracking-[0.16em] uppercase">
                    No job profiles found. Create one to get started!
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#fbf5e6]/30 transition-colors group">
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <div className="text-[15px] font-[700] text-[#241c12] tracking-tight">{job.job_title}</div>
                    </td>
                    <td className="px-[28px] py-[18px] whitespace-nowrap text-sm text-[#8a7c66]">
                      {job.company_name || 'N/A'}
                    </td>
                    {userRole === 'super_admin' && (
                      <td className="px-[28px] py-[18px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-[700] text-[#2f5a37]">{job.author?.full_name || 'Unknown Admin'}</span>
                          <span className="text-[11px] text-[#8a7c66] mt-0.5">{job.author?.email}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-[28px] py-[18px] whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        job.status === 'published' 
                          ? 'bg-[#2f5a37]/10 text-[#2f5a37]' 
                          : 'bg-[#e0d6c8] text-[#8a7c66]'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-[28px] py-[18px] whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/workforce-pathways/jobs/${job.id}`} 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-[#785a32]/10 rounded-[8px] text-[10px] font-mono text-[#a89a82] uppercase tracking-[0.12em] hover:bg-[#fbf5e6] hover:text-[#7a5a1e] hover:border-[#efd9a8] transition-all"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="inline-flex items-center justify-center p-2 bg-transparent border border-[#785a32]/10 rounded-[8px] text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50"
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
    </div>
  );
}
