'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Question = {
  id: string;
  title_en: string;
  title_es: string;
  type: 'text' | 'single' | 'multiple';
  is_required: boolean;
  section: string;
  options_en: string[];
  options_es: string[];
  sort_order: number;
};

export default function OnboardingQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Question>>({
    title_en: '',
    title_es: '',
    type: 'single',
    is_required: true,
    section: 'identity',
    options_en: [],
    options_es: []
  });

  const sections = ['identity', 'age', 'tech', 'context', 'additional'];
  const types = ['text', 'single', 'multiple'];

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/admin/onboarding-questions');
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async () => {
    if (!formData.title_en || !formData.title_es) {
      toast.error('Both English and Spanish titles are required');
      return;
    }

    const isNew = isEditing === 'new';
    const url = isNew ? '/api/admin/onboarding-questions' : `/api/admin/onboarding-questions/${isEditing}`;
    const method = isNew ? 'POST' : 'PUT';

    // Clean up empty options before saving
    const cleaned_en = (formData.options_en || []).filter(o => o.trim() !== '');
    const cleaned_es = (formData.options_es || []).filter(o => o.trim() !== '');

    const savingToast = toast.loading('Saving question...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          options_en: cleaned_en,
          options_es: cleaned_es
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      toast.success('Question saved!', { id: savingToast });
      setIsEditing(null);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message, { id: savingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const deletingToast = toast.loading('Deleting...');
    try {
      const res = await fetch(`/api/admin/onboarding-questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Question deleted', { id: deletingToast });
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message, { id: deletingToast });
    }
  };

  const startEdit = (q?: Question) => {
    if (q) {
      setIsEditing(q.id);
      setFormData(q);
    } else {
      setIsEditing('new');
      setFormData({
        title_en: '', title_es: '', type: 'single', is_required: true, section: 'identity', options_en: [''], options_es: ['']
      });
    }
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options_en: [...(prev.options_en || []), ''],
      options_es: [...(prev.options_es || []), '']
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => {
      const newEn = [...(prev.options_en || [])];
      const newEs = [...(prev.options_es || [])];
      newEn.splice(index, 1);
      newEs.splice(index, 1);
      return { ...prev, options_en: newEn, options_es: newEs };
    });
  };

  const handleOptionChange = (lang: 'en' | 'es', index: number, value: string) => {
    setFormData(prev => {
      const arr = [...(prev[`options_${lang}`] || [])];
      arr[index] = value;
      return { ...prev, [`options_${lang}`]: arr };
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 font-exo">
        <h1 className="text-3xl font-black text-steward-dark uppercase tracking-widest mb-2">Onboarding Questions</h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-8">Loading...</p>
      </div>
    );
  }

  // Ensure options arrays match in length for the UI editor
  const maxOptionsLength = Math.max((formData.options_en || []).length, (formData.options_es || []).length, (formData.type === 'single' || formData.type === 'multiple' ? 1 : 0));

  return (
    <div className="p-8 max-w-5xl mx-auto font-exo">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-steward-dark uppercase tracking-widest">Onboarding Questions</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">Manage dynamic questions for Hub access</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => startEdit()}
            className="flex items-center gap-2 bg-[#DB9B2F] hover:bg-[#c88d2a] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg"
          >
            <Plus size={18} /> Add Question
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-steward-dark uppercase tracking-widest flex items-center gap-3">
              {isEditing === 'new' ? <span className="text-[#DB9B2F]"><Plus size={24} /></span> : <span className="text-[#417C98]"><Pencil size={20} /></span>}
              {isEditing === 'new' ? 'New Question' : 'Edit Question'}
            </h2>
            <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-gray-600 font-bold uppercase text-xs tracking-widest px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-[11px] font-black text-steward-dark uppercase tracking-[0.15em] mb-3">Title (English) *</label>
              <input type="text" value={formData.title_en || ''} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-[#DB9B2F] focus:ring-1 focus:ring-[#DB9B2F]/20 transition-all" placeholder="e.g. What is your dream job?" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-steward-dark uppercase tracking-[0.15em] mb-3">Title (Spanish) *</label>
              <input type="text" value={formData.title_es || ''} onChange={e => setFormData({...formData, title_es: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-[#DB9B2F] focus:ring-1 focus:ring-[#DB9B2F]/20 transition-all" placeholder="ej. ¿Cuál es tu trabajo ideal?" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-[11px] font-black text-steward-dark uppercase tracking-[0.15em] mb-3">Question Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-[#DB9B2F] appearance-none cursor-pointer">
                {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-steward-dark uppercase tracking-[0.15em] mb-3">Section</label>
              <select value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-[#DB9B2F] appearance-none cursor-pointer">
                {sections.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-center pt-6">
              <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${formData.is_required ? 'bg-[#417C98] border-[#417C98]' : 'bg-white border-2 border-gray-200'}`}>
                  {formData.is_required && <Check size={14} color="white" strokeWidth={3} />}
                </div>
                <input type="checkbox" checked={formData.is_required} onChange={e => setFormData({...formData, is_required: e.target.checked})} className="hidden" />
                <span className="text-xs font-black text-steward-dark uppercase tracking-[0.1em]">Required Question</span>
              </label>
            </div>
          </div>

          {(formData.type === 'single' || formData.type === 'multiple') && (
            <div className="mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <label className="block text-[11px] font-black text-steward-dark uppercase tracking-[0.15em]">Answer Options</label>
                <button onClick={handleAddOption} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#417C98] hover:text-[#2d5a6e] transition-colors">
                  <Plus size={14} /> Add Option
                </button>
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: maxOptionsLength }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <input 
                      type="text" 
                      value={formData.options_en?.[i] || ''} 
                      onChange={e => handleOptionChange('en', i, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DB9B2F] shadow-sm transition-all"
                      placeholder="English option..."
                    />
                    <input 
                      type="text" 
                      value={formData.options_es?.[i] || ''} 
                      onChange={e => handleOptionChange('es', i, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DB9B2F] shadow-sm transition-all"
                      placeholder="Spanish option..."
                    />
                    <button onClick={() => handleRemoveOption(i)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button onClick={handleSave} className="flex items-center gap-2 bg-[#417C98] hover:bg-[#2d5a6e] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[13px] transition-all shadow-[0_8px_20px_-6px_rgba(65,124,152,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(65,124,152,0.6)] hover:-translate-y-0.5">
              <Check size={18} /> Save Question
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all hover:border-[#e2b54a]/30">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-sm font-black text-[#9c8d76] border border-gray-100 group-hover:bg-[#fbf0da] group-hover:text-[#c8963e] group-hover:border-[#c8963e]/20 transition-colors">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-steward-dark text-[15px] mb-2">{q.title_en}</h3>
                <div className="flex gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-blue-50/50 text-[#417C98] rounded-md border border-blue-100/50">{q.type}</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-amber-50/50 text-[#DB9B2F] rounded-md border border-amber-100/50">{q.section}</span>
                  {q.is_required && <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-red-50/50 text-red-500 rounded-md border border-red-100/50">Required</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(q)} className="p-3 text-gray-400 hover:text-[#417C98] hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100">
                <Pencil size={18} />
              </button>
              <button onClick={() => handleDelete(q.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && !isEditing && (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No questions found</p>
            <p className="text-gray-400 font-mono text-xs mt-2">Click "Add Question" to create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
