'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
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
    <div className="p-8 max-w-4xl mx-auto font-exo">
      <Link 
        href="/admin/workforce-pathways/jobs"
        className="inline-flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors mb-8 font-bold uppercase tracking-widest text-xs"
      >
        <ArrowLeft size={16} /> Back to Job Profiles
      </Link>

      <h1 className="text-3xl font-black text-steward-dark uppercase tracking-tight mb-8">
        {isNew ? 'Create Job Profile' : 'Edit Job Profile'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 lg:p-12 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Company Name (Optional)</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Company URL (Optional)</label>
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Min Salary (Numbers only)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Max Salary (Numbers only)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Salary Display Override (Optional)</label>
            <input
              type="text"
              value={salaryOverride}
              onChange={(e) => setSalaryOverride(e.target.value)}
              placeholder='e.g. "$20/hr" or "Varies by experience"'
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark"
            />
            <p className="text-xs text-gray-400 mt-1">If filled, this overrides the min/max numbers on the display.</p>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-3">Status</label>
          <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit border border-gray-200/60">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                status === 'draft' ? 'bg-white text-steward-dark shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600 border border-transparent'
              }`}
            >
              Draft (Hidden)
            </button>
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                status === 'published' ? 'bg-steward-green text-white shadow-sm border border-steward-green/20' : 'text-gray-400 hover:text-gray-600 border border-transparent'
              }`}
            >
              Published (Public)
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-4">Pathway Steps</label>
          <div className="space-y-3 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-2 items-start">
                <div className="bg-steward-blue text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0">
                  {index + 1}
                </div>
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`Description for step ${index + 1}...`}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark transition-all font-bold text-steward-dark resize-none h-10 min-h-[2.5rem]"
                  rows={1}
                />
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-2 text-steward-blue hover:text-blue-800 font-bold uppercase tracking-widest text-[10px]"
          >
            <Plus size={16} /> Add Step
          </button>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">Application Tips (Optional)</label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
            <RichTextEditor content={applicationTips} onChange={setApplicationTips} />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 mt-12">
          <Link
            href="/admin/workforce-pathways/jobs"
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-dark rounded-xl hover:bg-black transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : <><Save size={16} /> Save Job Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
}
