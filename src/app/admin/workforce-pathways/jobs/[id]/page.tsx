'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function JobProfileEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [salaryOverride, setSalaryOverride] = useState('');
  const [applicationTips, setApplicationTips] = useState('');
  const [status, setStatus] = useState('draft');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [steps, setSteps] = useState<{ id: string; description: string }[]>([]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/jobs/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.item) {
            const job = data.item;
            setTitle(job.job_title || '');
            setCompanyName(job.company_name || '');
            setCompanyUrl(job.company_url || '');
            setSalaryMin(job.salary_min?.toString() || '');
            setSalaryMax(job.salary_max?.toString() || '');
            setSalaryOverride(job.salary_display_override || '');
            setApplicationTips(job.application_tips || '');
            setStatus(job.status || 'draft');
            setSortOrder(job.sort_order || 0);
            
            // Sort steps
            const sorted = (job.job_profile_steps || []).sort((a: any, b: any) => a.step_number - b.step_number);
            setSteps(sorted.map((s: any) => ({ id: Math.random().toString(), description: s.description })));
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load job profile');
          setLoading(false);
        });
    }
  }, [isNew, params.id]);

  const addStep = () => {
    setSteps([...steps, { id: Math.random().toString(), description: '' }]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index].description = val;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      job_title: title,
      company_name: companyName || null,
      company_url: companyUrl || null,
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      salary_display_override: salaryOverride || null,
      application_tips: applicationTips || null,
      status,
      sort_order: sortOrder,
      steps: steps.filter(s => s.description.trim() !== '')
    };

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/admin/jobs' : `/api/admin/jobs/${params.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.push('/admin/workforce-pathways/jobs');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-[ac-fade_0.3s_ease] w-full p-[34px_44px]">
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

      <div className="w-full relative z-10 bg-white rounded-[22px] p-[30px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 max-w-[960px]">
        <div className="flex items-center gap-[12px] mb-[22px]">
          <Link 
            href="/admin/workforce-pathways/jobs"
            className="w-[36px] h-[36px] rounded-[10px] border border-[#785a32]/20 bg-[#fbf5e6] flex items-center justify-center text-[#5c4f3c] hover:bg-[#f2ead2] transition-colors"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="font-[800] text-[18px] text-[#241c12] leading-none">
              {isNew ? 'Create Job Profile' : 'Edit Job Profile'}
            </div>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#a89a82] mt-[4px] uppercase leading-none">
              {isNew ? 'CREATE A NEW JOB PROFILE' : 'EDIT THIS JOB PROFILE'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[22px]">
          {error && (
            <div className="bg-red-50 text-red-600 p-[18px] rounded-[14px] text-[13px] font-[700] border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px]">
            <div className="col-span-2">
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Company Name (Optional)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Company URL (Optional)</label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Min Salary (Numbers only)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Max Salary (Numbers only)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[6px]">Salary Display Override (Optional)</label>
              <input
                type="text"
                value={salaryOverride}
                onChange={(e) => setSalaryOverride(e.target.value)}
                placeholder='e.g. "$20/hr" or "Varies by experience"'
                className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14.5px] text-[#241c12]"
              />
              <p className="text-[12px] text-[#a89a82] mt-[6px] leading-[1.45]">If filled, this overrides the min/max numbers on the display.</p>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[8px]">Status</label>
            <div className="flex bg-[#fdfaf0] p-[4px] rounded-[12px] w-fit border border-[#785a32]/10 gap-[4px]">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`px-[18px] py-[9px] rounded-[9px] text-[11px] font-[800] uppercase tracking-[0.1em] transition-all ${
                  status === 'draft' ? 'bg-white text-[#241c12] shadow-[0_2px_8px_rgba(120,90,50,0.1)] border border-[#785a32]/10' : 'text-[#a89a82] hover:text-[#5c4f3c] border border-transparent'
                }`}
              >
                Draft (Hidden)
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`px-[18px] py-[9px] rounded-[9px] text-[11px] font-[800] uppercase tracking-[0.1em] transition-all ${
                  status === 'published' ? 'bg-[#2f5a37] text-white shadow-[0_4px_12px_rgba(47,90,55,0.2)] border border-[#2f5a37]' : 'text-[#a89a82] hover:text-[#5c4f3c] border border-transparent'
                }`}
              >
                Published (Public)
              </button>
            </div>
          </div>

          <div className="pt-[22px] border-t border-[#785a32]/10">
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[14px]">Pathway Steps</label>
            <div className="space-y-[12px] mb-[14px]">
              {steps.map((step, index) => (
                <div key={step.id} className="flex gap-[12px] items-start">
                  <div className="bg-[#eaf1ec] text-[#2f5a37] w-[42px] h-[42px] rounded-[11px] flex items-center justify-center font-[700] text-[15px] shrink-0 border border-[#2f5a37]/10">
                    {index + 1}
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Description for step ${index + 1}...`}
                    className="flex-1 px-[15px] py-[11px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:border-[#785a32]/40 focus:ring-1 focus:ring-[#785a32]/40 transition-all text-[14px] text-[#241c12] resize-none min-h-[42px]"
                    rows={1}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="w-[42px] h-[42px] flex items-center justify-center bg-red-50 text-red-400 rounded-[11px] hover:bg-red-100 transition-colors shrink-0 border border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-[8px] px-[16px] py-[9px] bg-[#fbf5e6] text-[#7a5a1e] hover:bg-[#f2ead2] rounded-[10px] border border-[#785a32]/10 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
            >
              <Plus size={14} /> Add Step
            </button>
          </div>

          <div className="pt-[22px] border-t border-[#785a32]/10">
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-[10px]">Application Tips (Optional)</label>
            <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] overflow-hidden focus-within:border-[#785a32]/40 focus-within:ring-1 focus-within:ring-[#785a32]/40 transition-all">
              <RichTextEditor content={applicationTips} onChange={setApplicationTips} />
            </div>
          </div>

          <div className="flex justify-end gap-[12px] pt-[30px] border-t border-[#785a32]/10 mt-[12px]">
            <Link
              href="/admin/workforce-pathways/jobs"
              className="px-[20px] py-[11px] text-[11px] font-[800] uppercase tracking-[0.12em] text-[#5c4f3c] bg-[#fbf5e6] border border-[#785a32]/10 rounded-[12px] hover:bg-[#f2ead2] transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-[20px] py-[11px] text-[11px] font-[800] uppercase tracking-[0.12em] text-[#efd9a8] bg-[#241c12] rounded-[12px] hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Job Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
