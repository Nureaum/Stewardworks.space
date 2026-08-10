'use client';

import React, { useState } from 'react';
import { addEngagement, removeEngagement, updateEngagement } from '@/app/actions/workshops/engagement';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface AILabPortfolioTabsProps {
  cohortId?: string;
  initialEngagements: any[];
}

export default function AILabPortfolioTabs({ cohortId, initialEngagements }: AILabPortfolioTabsProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'prompts' | 'mini'>('bookmarks');
  const [engagements, setEngagements] = useState(initialEngagements);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter engagements by kind
  const bookmarks = engagements.filter(e => e.kind === 'bookmark');
  const notes = engagements.filter(e => e.kind === 'note');
  const prompts = engagements.filter(e => e.kind === 'prompt');
  const minis = engagements.filter(e => e.kind === 'mini_deliverable');

  const openEditor = (kind: 'bookmark' | 'note' | 'prompt' | 'mini_deliverable', item?: any) => {
    setIsEditing(true);
    setEditingId(item ? item.id : null);
    setEditTitle(item ? item.title : '');
    setEditContent(item ? parseNoteContent(item.content).html || parseNoteContent(item.content).text || item.content : '');
    setEditUrl(item ? item.url : '');
    
    // Set appropriate tab if opening new
    if (!item) {
      if (kind === 'bookmark') setActiveTab('bookmarks');
      if (kind === 'note') setActiveTab('notes');
      if (kind === 'prompt') setActiveTab('prompts');
      if (kind === 'mini_deliverable') setActiveTab('mini');
    }
  };

  const closeEditor = () => {
    setIsEditing(false);
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditUrl('');
  };

  const parseNoteContent = (contentStr: string) => {
    if (!contentStr) return { html: '', text: '' };
    try {
      const parsed = JSON.parse(contentStr);
      if (parsed.version === 2) return parsed;
      return { html: '', text: contentStr };
    } catch {
      return { html: '', text: contentStr };
    }
  };

  const handleSave = async () => {
    if (!cohortId) {
      toast.error('Cohort ID missing');
      return;
    }
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const kindMap = {
        bookmarks: 'bookmark',
        notes: 'note',
        prompts: 'prompt',
        mini: 'mini_deliverable'
      };
      const kind = kindMap[activeTab];
      
      const plainText = editContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const contentPayload = JSON.stringify({
        version: 2,
        html: editContent,
        text: plainText,
        images: [],
        subType: kind
      });

      if (editingId) {
        // Update
        await updateEngagement(editingId, { title: editTitle, url: editUrl, content: contentPayload });
        setEngagements(engagements.map(e => e.id === editingId ? { ...e, title: editTitle, url: editUrl, content: contentPayload } : e));
        toast.success('Updated successfully');
      } else {
        // Create
        const newItem = await addEngagement(cohortId, kind, editTitle, `workshop:${cohortId}`, editUrl, contentPayload);
        setEngagements([newItem, ...engagements]);
        toast.success('Added successfully');
      }
      closeEditor();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await removeEngagement(id);
      setEngagements(engagements.filter(e => e.id !== id));
      toast.success('Deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const tabs = [
    { id: 'bookmarks', label: 'BOOKMARKS', count: bookmarks.length, color: '#45d6ff', icon: '★' },
    { id: 'notes', label: 'NOTES', count: notes.length, color: '#ffd23f', icon: '✎' },
    { id: 'prompts', label: 'PROMPTS', count: prompts.length, color: '#ff5fd2', icon: '⌘' },
    { id: 'mini', label: 'MINI DELIVERABLES', count: minis.length, color: '#4dffa0', icon: '🏆' },
  ];

  const activeColor = tabs.find(t => t.id === activeTab)?.color || '#fff';
  
  const getActiveData = () => {
    if (activeTab === 'bookmarks') return bookmarks;
    if (activeTab === 'notes') return notes;
    if (activeTab === 'prompts') return prompts;
    if (activeTab === 'mini') return minis;
    return [];
  };

  return (
    <div style={{ 
      marginTop: 14, 
      border: `2px solid var(--ln,#28432f)`, 
      borderRadius: 10, 
      background: '#08120d', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--ln,#28432f)', background: 'rgba(0,0,0,.3)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); closeEditor(); }}
            className="font-pixel"
            style={{
              flex: 1,
              padding: '14px 10px',
              background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
              color: activeTab === tab.id ? tab.color : 'var(--mu,#77b78d)',
              cursor: 'pointer',
              fontSize: 9,
              letterSpacing: 1,
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <div>{tab.icon} {tab.label}</div>
            <div style={{ fontSize: 13, color: activeTab === tab.id ? '#fff' : 'var(--mu,#77b78d)', fontFamily: "'VT323', monospace", background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{tab.count}</div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: 18, minHeight: 300 }}>
        {isEditing ? (
          <div style={{ background: '#14211b', border: `2px solid ${activeColor}`, borderRadius: 8, padding: 20 }}>
            <div className="font-pixel" style={{ fontSize: 10, color: activeColor, marginBottom: 16 }}>
              {editingId ? 'EDIT' : 'NEW'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={{ background: '#08120d', border: '1px solid var(--ln,#28432f)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontSize: 16, fontFamily: "'VT323', monospace" }}
              />
              {activeTab === 'bookmarks' && (
                <input
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  placeholder="URL (optional)"
                  style={{ background: '#08120d', border: '1px solid var(--ln,#28432f)', borderRadius: 4, padding: '10px 12px', color: '#fff', fontSize: 16, fontFamily: "'VT323', monospace" }}
                />
              )}
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                theme="ailab"
              />
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button 
                onClick={closeEditor}
                className="font-pixel"
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--mu,#77b78d)', color: 'var(--mu,#77b78d)', borderRadius: 4, cursor: 'pointer', fontSize: 9 }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="font-pixel"
                style={{ padding: '10px 16px', background: activeColor, border: 'none', color: '#0e1512', borderRadius: 4, cursor: 'pointer', fontSize: 9 }}
              >
                {isSubmitting ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="font-pixel" style={{ fontSize: 10, color: activeColor, letterSpacing: 1 }}>
                {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
              </div>
              <button
                onClick={() => openEditor(activeTab === 'mini' ? 'mini_deliverable' : activeTab.slice(0, -1) as any)}
                className="font-pixel"
                style={{ background: `${activeColor}22`, color: activeColor, border: `1px solid ${activeColor}`, borderRadius: 4, padding: '8px 12px', cursor: 'pointer', fontSize: 8 }}
              >
                + ADD NEW
              </button>
            </div>

            {getActiveData().length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', border: '2px dashed var(--ln,#28432f)', borderRadius: 8, color: 'var(--mu,#77b78d)', fontSize: 15, fontFamily: "'VT323', monospace" }}>
                No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getActiveData().map(item => {
                  const parsed = parseNoteContent(item.content);
                  return (
                    <div key={item.id} style={{ background: '#14211b', border: `1px solid var(--ln,#28432f)`, borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 16, color: '#d6ffe0', fontFamily: "'VT323', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          {item.status === 'pending' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#ffd23f22', color: '#ffd23f', borderRadius: 4 }}>PENDING</span>}
                          {item.status === 'approved' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#4dffa022', color: '#4dffa0', borderRadius: 4 }}>✓ APPROVED</span>}
                          {item.status === 'rejected' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#ff5fd222', color: '#ff5fd2', borderRadius: 4 }}>✕ REJECTED</span>}
                        </div>
                        {(parsed.text || parsed.html || (typeof item.content === 'string' && item.content && !item.content.startsWith('{'))) && (
                          <div style={{ fontSize: 13, color: 'var(--mu,#77b78d)', fontFamily: "'VT323', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {parsed.text || parsed.html || item.content}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: activeColor, textDecoration: 'none', fontFamily: "'DM Mono', monospace", background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, border: `1px solid ${activeColor}44` }}>
                            🔗 LINK
                          </a>
                        )}
                        <button onClick={() => openEditor(item.kind, item)} style={{ background: 'none', border: 'none', color: activeColor, cursor: 'pointer', fontSize: 14, opacity: 0.7 }} title="Edit">✎</button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ff5fd2', cursor: 'pointer', fontSize: 16, opacity: 0.7 }} title="Delete">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
