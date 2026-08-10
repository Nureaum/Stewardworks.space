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
  const [viewingId, setViewingId] = useState<string | null>(null);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkNoteId, setBookmarkNoteId] = useState<string | null>(null);
  const [bookmarkNoteText, setBookmarkNoteText] = useState('');

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

  const viewingItem = engagements.find(e => e.id === viewingId);

  // Helper to determine if an item is a read-only application resource
  const isAppResource = (source: string | null | undefined) => {
    if (!source) return false;
    const s = source.toLowerCase();
    return ['curriculum', 'library', 'workforce', 'environmental', 'student showcase', 'quest board'].includes(s) 
      || s.includes('steward library') 
      || s.startsWith('day ') 
      || s.includes('instructional') 
      || s.includes('session');
  };

  // Helper to extract user note from bookmark content
  const getBookmarkNote = (content: string | null | undefined): string => {
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      return parsed.userNote || '';
    } catch {
      return '';
    }
  };

  // Helper to build updated content with user note
  const buildBookmarkContent = (existingContent: string | null | undefined, note: string): string => {
    if (!existingContent) return JSON.stringify({ userNote: note });
    try {
      const parsed = JSON.parse(existingContent);
      return JSON.stringify({ ...parsed, userNote: note });
    } catch {
      return JSON.stringify({ entryKey: existingContent, userNote: note });
    }
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
      <div style={{ padding: 18, maxHeight: 420, overflowY: 'auto' }}>
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
                    <div key={item.id} style={{ background: '#14211b', border: `1px solid var(--ln,#28432f)`, borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                          <div style={{ fontSize: 16, color: '#d6ffe0', fontFamily: "'VT323', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{item.title}</div>
                          {item.status === 'pending' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#ffd23f22', color: '#ffd23f', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>PENDING</span>}
                          {item.status === 'approved' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#4dffa022', color: '#4dffa0', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>✓ APPROVED</span>}
                          {item.status === 'rejected' && <span className="font-pixel" style={{ fontSize: 6, padding: '2px 5px', background: '#ff5fd222', color: '#ff5fd2', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>✕ REJECTED</span>}
                        </div>
                        {!isAppResource(item.source) && (parsed.text || parsed.html || (typeof item.content === 'string' && item.content && !item.content.startsWith('{'))) && (
                          <div style={{ fontSize: 13, color: 'var(--mu,#77b78d)', fontFamily: "'VT323', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {parsed.text || parsed.html || item.content}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: activeColor, textDecoration: 'none', fontFamily: "'DM Mono', monospace", background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: 4, border: `1px solid ${activeColor}44`, whiteSpace: 'nowrap' }}>
                            🔗 LINK
                          </a>
                        )}
                        <button onClick={() => setViewingId(item.id)} style={{ background: 'none', border: 'none', color: activeColor, cursor: 'pointer', fontSize: 16, opacity: 0.7, padding: '2px 4px' }} title="Expand">⤢</button>
                        {activeTab === 'bookmarks' && (
                          <button
                            onClick={() => { setBookmarkNoteId(bookmarkNoteId === item.id ? null : item.id); setBookmarkNoteText(getBookmarkNote(item.content)); }}
                            style={{ background: 'none', border: 'none', color: getBookmarkNote(item.content) ? activeColor : 'var(--mu,#77b78d)', cursor: 'pointer', fontSize: 14, opacity: getBookmarkNote(item.content) ? 1 : 0.7, padding: '2px 4px' }}
                            title={getBookmarkNote(item.content) ? 'Edit note' : 'Add note'}
                          >📝</button>
                        )}
                        {!isAppResource(item.source) && (
                          <button onClick={() => openEditor(item.kind, item)} style={{ background: 'none', border: 'none', color: activeColor, cursor: 'pointer', fontSize: 13, opacity: 0.7, padding: '2px 4px' }} title="Edit">✎</button>
                        )}
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ff5fd2', cursor: 'pointer', fontSize: 14, opacity: 0.7, padding: '2px 4px' }} title="Delete">×</button>
                      </div>
                      {/* User bookmark note - edit mode */}
                      {bookmarkNoteId === item.id && activeTab === 'bookmarks' && (
                        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--ln,#28432f)', background: 'rgba(69,214,255,.05)', marginTop: 6 }}>
                          <div className="font-pixel" style={{ fontSize: 7, color: activeColor, letterSpacing: 0.5, marginBottom: 5 }}>MY NOTE</div>
                          <textarea
                            value={bookmarkNoteText}
                            onChange={(e) => setBookmarkNoteText(e.target.value)}
                            placeholder="Add a personal note..."
                            rows={2}
                            style={{ width: '100%', background: 'rgba(0,0,0,.3)', border: '1px solid var(--ln,#28432f)', borderRadius: 4, padding: '6px 8px', color: '#d6ffe0', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: "'VT323', monospace" }}
                          />
                          <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => setBookmarkNoteId(null)} className="font-pixel" style={{ fontSize: 6, padding: '3px 8px', background: 'transparent', border: '1px solid var(--ln,#28432f)', color: 'var(--mu,#77b78d)', borderRadius: 3, cursor: 'pointer' }}>CANCEL</button>
                            <button
                              onClick={async () => {
                                try {
                                  const newContent = buildBookmarkContent(item.content, bookmarkNoteText);
                                  await updateEngagement(item.id, { content: newContent });
                                  setEngagements(engagements.map(e => e.id === item.id ? { ...e, content: newContent } : e));
                                  setBookmarkNoteId(null);
                                  toast.success('Note saved');
                                } catch { toast.error('Failed to save note'); }
                              }}
                              className="font-pixel"
                              style={{ fontSize: 6, padding: '3px 8px', background: activeColor, border: 'none', color: '#08120d', borderRadius: 3, cursor: 'pointer' }}
                            >SAVE NOTE</button>
                          </div>
                        </div>
                      )}
                      {/* User bookmark note - display */}
                      {bookmarkNoteId !== item.id && activeTab === 'bookmarks' && getBookmarkNote(item.content) && (
                        <div style={{ padding: '5px 10px', borderTop: '1px solid var(--ln,#28432f)', background: 'rgba(69,214,255,.04)' }}>
                          <div style={{ fontSize: 13, color: 'var(--mu,#77b78d)', lineHeight: 1.4, fontStyle: 'italic', fontFamily: "'VT323', monospace" }}>
                            📝 {getBookmarkNote(item.content)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Viewing Modal */}
      {viewingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingId(null)}>
          <div style={{ background: '#08120d', border: `2px solid ${activeColor}`, borderRadius: 12, padding: 28, width: '90%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 14, color: activeColor }}>
                VIEW {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </div>
              <button onClick={() => setViewingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#77b78d)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            
            <div style={{ fontSize: 22, color: '#d6ffe0', marginBottom: 14, wordBreak: 'break-word', overflowWrap: 'break-word', fontFamily: "'VT323', monospace" }}>{viewingItem.title}</div>
            
            <div style={{ fontSize: 15, color: viewingItem.status === 'approved' ? '#4dffa0' : '#ffd23f', marginBottom: 18, fontFamily: "'VT323', monospace" }}>
              {viewingItem.status === 'approved' ? '✓ APPROVED' : viewingItem.status === 'pending' ? '◔ PENDING' : viewingItem.status.toUpperCase()}
            </div>

            {viewingItem.url && (
              <a 
                href={viewingItem.url} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  textDecoration: 'none', 
                  border: `2px solid ${activeColor}`, 
                  borderRadius: 8, 
                  padding: '14px 16px', 
                  background: 'rgba(0,0,0,0.3)',
                  marginBottom: 18
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: '#d6ffe0', wordBreak: 'break-all', overflowWrap: 'break-word', lineHeight: 1.4, fontFamily: "'VT323', monospace" }}>
                    {viewingItem.url}
                  </div>
                </div>
                <span className="font-pixel" style={{ fontSize: 12, color: '#08120d', background: activeColor, borderRadius: 4, padding: '8px 12px', flexShrink: 0 }}>
                  OPEN ↗
                </span>
              </a>
            )}

            {(() => {
              const parsedContent = parseNoteContent(viewingItem.content);
              if (parsedContent.version === 2) {
                return (
                  <div 
                    style={{ fontSize: 16, color: 'var(--mu,#77b78d)', marginBottom: 18, lineHeight: 1.5, fontFamily: "'VT323', monospace" }} 
                    dangerouslySetInnerHTML={{ __html: parsedContent.html }}
                  />
                );
              } else {
                return (
                  <div style={{ fontSize: 16, color: 'var(--mu,#77b78d)', marginBottom: 18, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: "'VT323', monospace" }}>
                    {parsedContent.text || viewingItem.content}
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
