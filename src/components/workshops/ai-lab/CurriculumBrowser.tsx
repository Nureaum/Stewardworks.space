'use client';

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function CurriculumBrowser({ 
  day, 
  activeEntry, 
  onSelectEntry, 
  onSetDay,
  curriculumData,
  daysComplete = 0,
  onToggleVisibility,
  onBookmark,
  bookmarkedTitles = []
}: { 
  day: number;
  activeEntry: string | null;
  onSelectEntry: (id: string | null) => void;
  onSetDay: (d: number) => void;
  curriculumData: Record<number, any>;
  daysComplete?: number;
  onToggleVisibility?: () => void;
  onBookmark?: (title: string) => Promise<{ success: boolean; alreadyExists?: boolean }>;
  bookmarkedTitles?: string[];
}) {
  const [pendingBookmarks, setPendingBookmarks] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const currentDayData = curriculumData[day] || { title: 'NO DATA', blurb: 'No data available for this day.', sessions: [] };

  // Combine server bookmarks with pending local ones
  const bookmarkedEntries = new Set([...Array.from(bookmarkedTitles), ...Array.from(pendingBookmarks)]);

  const handleBookmark = async (entryTitle: string) => {
    // Prevent double-clicks
    if (isSubmitting === entryTitle) {
      return;
    }
    
    // If already bookmarked (from server), show message that it's pending approval
    if (bookmarkedTitles.includes(entryTitle)) {
      toast.success(`"${entryTitle}" is already bookmarked and pending admin approval`, { 
        position: 'bottom-center',
        id: `bookmark-exists-${entryTitle}` // Prevent duplicate toasts
      });
      return;
    }
    
    // If pending local bookmark, ignore
    if (pendingBookmarks.has(entryTitle)) {
      return;
    }

    // If we have a callback, use it to submit to server
    if (onBookmark) {
      setIsSubmitting(entryTitle);
      setPendingBookmarks(prev => new Set(prev).add(entryTitle));
      
      try {
        const result = await onBookmark(entryTitle);
        if (result.success) {
          toast.success(`Bookmarked "${entryTitle}" - Sent to admin for approval`, { 
            position: 'bottom-center',
            id: `bookmark-success-${entryTitle}`
          });
        } else if (result.alreadyExists) {
          toast.success(`"${entryTitle}" is already bookmarked`, { 
            position: 'bottom-center',
            id: `bookmark-exists-${entryTitle}`
          });
        } else {
          setPendingBookmarks(prev => {
            const newSet = new Set(prev);
            newSet.delete(entryTitle);
            return newSet;
          });
          toast.error(`Failed to bookmark "${entryTitle}"`, { 
            position: 'bottom-center',
            id: `bookmark-error-${entryTitle}`
          });
        }
      } catch (error) {
        setPendingBookmarks(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryTitle);
          return newSet;
        });
        toast.error(`Failed to bookmark "${entryTitle}"`, { 
          position: 'bottom-center',
          id: `bookmark-error-${entryTitle}`
        });
      } finally {
        setIsSubmitting(null);
      }
    } else {
      // Fallback to local-only bookmarking
      setPendingBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.add(entryTitle);
        return newSet;
      });
      toast.success(`Bookmarked "${entryTitle}" - Access it later from My Portfolio`, { 
        position: 'bottom-center',
        id: `bookmark-local-${entryTitle}`
      });
    }
  };

  let selectedEntryData = null;
  let selectedSessionHour = '';
  let selectedSessionColor = '#4dffa0';
  
  if (activeEntry) {
    currentDayData.sessions.forEach(sec => {
      const match = sec.entries.find(e => e.title === activeEntry);
      if (match) {
        selectedEntryData = match;
        selectedSessionHour = sec.hour;
        selectedSessionColor = sec.color;
      }
    });
  }

  return (
    <div style={{ border: '2px solid #28432f', borderRadius: 10, background: '#14211b', overflow: 'hidden', flex: '1 1 330px', minWidth: 290, display: 'flex', flexDirection: 'column', maxHeight: 'clamp(560px,74vh,820px)' }}>
      {/* Header bar / tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e1512', borderBottom: '2px solid #28432f' }}>
        <div className="font-pixel" style={{ fontSize: 8, color: '#4dffa0', letterSpacing: 1 }}>◱ CURRICULUM BROWSER</div>
        <button 
          onClick={onToggleVisibility}
          title="Hide the browser to expand the Eden bench"
          className="font-pixel"
          style={{ fontSize: 9, color: '#77b78d', background: 'rgba(0,0,0,.3)', border: '2px solid #28432f', borderRadius: 5, padding: '8px 9px', cursor: 'pointer', flex: 'none' }}
        >
          ◧
        </button>
      </div>

      <div style={{ padding: '14px 14px 0', borderBottom: '2px solid #28432f' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[1, 2, 3].map((d) => {
            const isLocked = d > daysComplete + 1;
            return (
              <button
                key={d}
                onClick={() => {
                  if (isLocked) {
                    toast.error(`🔒 Locked - finish Day 0${d - 1} first`, { position: 'bottom-center' });
                    return;
                  }
                  onSelectEntry(null);
                  onSetDay(d);
                }}
                className="font-pixel"
                style={{
                  flex: 1, padding: '10px 6px', fontSize: 8, borderRadius: 6, whiteSpace: 'nowrap',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.4 : 1,
                  background: d === day ? '#ff5fd2' : 'transparent',
                  color: d === day ? '#0e1512' : '#77b78d',
                  border: `2px solid ${d === day ? '#ff5fd2' : '#28432f'}`,
                  boxShadow: d === day ? '0 0 12px #ff5fd2' : 'none'
                }}
              >
                {isLocked ? '🔒 ' : ''}DAY 0{d}
              </button>
            );
          })}
        </div>
      </div>
      
      {!activeEntry || !selectedEntryData ? (
        <div style={{ flex: 1, padding: '14px 14px 16px', overflowY: 'auto' }}>
          <div className="font-pixel" style={{ fontSize: 10, color: '#ffd23f', lineHeight: 1.5, margin: '2px 2px 7px' }}>DAY 0{day} · {currentDayData.title}</div>
          <div style={{ fontSize: 16, color: '#77b78d', lineHeight: 1.35, marginBottom: 15, fontFamily: "'VT323', monospace" }}>{currentDayData.blurb}</div>
          
          {currentDayData.sessions.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <div className="font-pixel" style={{ fontSize: 8, color: '#0e1512', background: sec.color, padding: '6px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>
                {sec.hour} · {sec.title} · {sec.dur}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sec.entries.map((en, eIdx) => (
                  <div key={eIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={() => onSelectEntry(en.title)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,.2)', border: '1px solid #28432f', borderRadius: 8, padding: 12, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span className="font-pixel" style={{ fontSize: 8, color: '#0e1512', background: sec.color, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{eIdx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.15, fontFamily: "'VT323', monospace" }}>{en.title}</div>
                        <div className="font-pixel" style={{ fontSize: 7, color: '#77b78d', marginTop: 5, lineHeight: 1.5 }}>{en.sub}</div>
                      </div>
                      <span className="font-pixel" style={{ fontSize: 10, color: '#4dffa0' }}>›</span>
                    </button>
                    <button 
                      onClick={() => handleBookmark(en.title)}
                      disabled={isSubmitting === en.title}
                      title={bookmarkedEntries.has(en.title) ? 'Already bookmarked' : 'Bookmark this session'}
                      style={{ 
                        flex: 'none', 
                        background: bookmarkedEntries.has(en.title) ? '#45d6ff' : 'transparent', 
                        border: '1px solid #28432f', 
                        borderRadius: 6, 
                        padding: '10px 12px', 
                        cursor: isSubmitting === en.title ? 'wait' : 'pointer', 
                        color: bookmarkedEntries.has(en.title) ? '#0e1512' : '#45d6ff', 
                        fontSize: 16,
                        transition: 'all 0.15s',
                        opacity: isSubmitting === en.title ? 0.6 : 1
                      }}
                    >
                      {isSubmitting === en.title ? '⏳' : bookmarkedEntries.has(en.title) ? '★' : '☆'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, padding: '13px 14px 18px', overflowY: 'auto' }}>
          <button onClick={() => onSelectEntry(null)} className="font-pixel" style={{ fontSize: 8, color: '#4dffa0', background: 'transparent', border: '2px solid #28432f', borderRadius: 5, padding: '8px 10px', cursor: 'pointer', marginBottom: 13 }}>‹ ALL SESSIONS</button>
          
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: '#77b78d', letterSpacing: 1, lineHeight: 1.6, marginBottom: 11 }}>
            DAY 0{day} · {selectedSessionHour}
          </div>
          
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: '#0e1512', background: selectedSessionColor, borderRadius: 3, padding: '4px 6px', display: 'inline-block' }}>{selectedSessionHour}</div>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 13, color: '#d6ffe0', lineHeight: 1.5, margin: '13px 0 15px' }}>{selectedEntryData.title}</div>
          
          {selectedEntryData.type === 'text' && (
            <div style={{ fontSize: 18, color: '#d6ffe0', lineHeight: 1.5, fontFamily: "'VT323', monospace" }}>{selectedEntryData.body}</div>
          )}
          
          {selectedEntryData.type === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 15, color: '#77b78d', marginBottom: 13, fontFamily: "'VT323', monospace" }}>{selectedEntryData.sub}</div>
              {selectedEntryData.items.map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', border: '1px solid #28432f', borderRadius: 8, padding: 12, background: 'rgba(0,0,0,.2)' }}>
                  <span style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: '#45d6ff', marginTop: 3, flex: 'none' }}>◈</span>
                  <span style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.35, fontFamily: "'VT323', monospace" }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {selectedEntryData.type === 'dual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, color: '#77b78d', marginBottom: 14, fontFamily: "'VT323', monospace" }}>{selectedEntryData.sub}</div>
              <div style={{ border: '2px solid #45d6ff', borderRadius: 6, padding: 14, background: 'rgba(69,214,255,.06)' }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: '#0e1512', background: '#45d6ff', padding: '4px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 11 }}>MODERN · NEWS</div>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: '#45d6ff', lineHeight: 1.5, marginBottom: 10 }}>{selectedEntryData.modernTitle}</div>
                <div style={{ fontSize: 16, color: '#d6ffe0', lineHeight: 1.45, fontFamily: "'VT323', monospace" }}>{selectedEntryData.modernBody}</div>
              </div>
              <div style={{ border: '2px solid #ffd23f', borderRadius: 6, padding: 14, background: 'rgba(255,210,63,.06)' }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: '#0e1512', background: '#ffd23f', padding: '4px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 11 }}>ANCIENT · INDIGENOUS</div>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: '#ffd23f', lineHeight: 1.5, marginBottom: 10 }}>{selectedEntryData.ancientTitle}</div>
                <div style={{ fontSize: 16, color: '#d6ffe0', lineHeight: 1.45, fontFamily: "'VT323', monospace" }}>{selectedEntryData.ancientBody}</div>
              </div>
            </div>
          )}
          
          {selectedEntryData.type === 'deliverable' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ border: '1px solid #28432f', borderRadius: 8, padding: 14 }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#ff5fd2', marginBottom: 10 }}>◈ PRINCIPLE APPLIED</div>
                <p style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.4, fontFamily: "'VT323', monospace", margin: 0 }}>{selectedEntryData.applied}</p>
              </div>
              <div style={{ border: '1px solid #28432f', borderRadius: 8, padding: 14 }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#45d6ff', marginBottom: 10 }}>□ LAB PROCESS</div>
                <p style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.4, fontFamily: "'VT323', monospace", margin: 0 }}>{selectedEntryData.lab}</p>
              </div>
              <div style={{ border: '1px solid #28432f', borderRadius: 8, padding: 14 }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#4dffa0', marginBottom: 10 }}>▚ DELIVERABLE GOAL</div>
                <p style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.4, fontFamily: "'VT323', monospace", margin: 0 }}>{selectedEntryData.goal}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
