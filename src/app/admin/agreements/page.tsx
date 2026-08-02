'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Agreement = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

// Simple Rich Text Editor
function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && value !== undefined && !isInitialized.current) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  const emit = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    emit();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 flex-wrap">
        <button onClick={() => exec('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold" title="Bold">B</button>
        <button onClick={() => exec('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700 italic" title="Italic">I</button>
        <button onClick={() => exec('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700 underline" title="Underline">U</button>
        <div className="w-px h-6 bg-gray-300 my-auto mx-1" />
        <button onClick={() => exec('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="Bullet List">• List</button>
        <button onClick={() => exec('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="Number List">1. List</button>
        <div className="w-px h-6 bg-gray-300 my-auto mx-1" />
        <button onClick={() => exec('formatBlock', 'H3')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm" title="Heading 3">H3</button>
        <button onClick={() => exec('formatBlock', 'P')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-medium text-sm" title="Paragraph">P</button>
        <button onClick={() => {
          const url = prompt('Enter URL:');
          if (url) exec('createLink', url);
        }} className="p-2 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="Link">Link</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emit}
        onBlur={emit}
        className="p-6 min-h-[400px] outline-none prose max-w-none font-exo text-sm"
        style={{
          // Basic inline styles to mimic prose
          lineHeight: 1.6,
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable] h3 { font-size: 1.125rem; font-weight: bold; color: #417C98; margin-bottom: 0.75rem; margin-top: 1.5rem; }
        [contenteditable] p { margin-bottom: 0.75rem; }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        [contenteditable] strong { font-weight: bold; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] a { color: #417C98; text-decoration: underline; }
      `}} />
    </div>
  );
}

export default function AdminAgreementsPage() {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAgreements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/agreements');
      const data = await res.json();
      if (data.agreements && data.agreements.length > 0) {
        // Just take the first one (Terms of Participation)
        const target = data.agreements[0];
        setAgreement(target);
        setEditedContent(target.content);
      }
    } catch (err) {
      toast.error('Failed to load agreement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleSave = async () => {
    if (!agreement) return;
    setIsSaving(true);
    const savingToast = toast.loading('Saving agreement...');
    try {
      const res = await fetch(`/api/admin/agreements/${agreement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent })
      });
      if (!res.ok) throw new Error('Failed to save');
      
      toast.success('Agreement updated successfully!', { id: savingToast });
      fetchAgreements(); // Refresh to update timestamps etc
    } catch (err: any) {
      toast.error(err.message || 'Error saving', { id: savingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 font-exo flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-steward-blue mb-4" />
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading Agreement...</p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="p-8 max-w-5xl mx-auto font-exo">
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">No agreement found in database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-exo">
      <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-3xl font-black text-steward-dark uppercase tracking-widest text-[#417C98]">
              {agreement.title}
            </h1>
            <p className="text-xs text-gray-400 mt-2">Manage terms and conditions content</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-gray-400 font-mono uppercase">Last updated</p>
             <p className="text-xs font-bold text-gray-600">{new Date(agreement.updated_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-6">
          <Editor value={editedContent} onChange={setEditedContent} />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#417C98] hover:bg-[#2d5a6e] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[13px] transition-all shadow-[0_8px_20px_-6px_rgba(65,124,152,0.5)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
