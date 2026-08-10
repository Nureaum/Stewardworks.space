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
  bookmarkedKeys = []
}: { 
  day: number;
  activeEntry: string | null;
  onSelectEntry: (id: string | null) => void;
  onSetDay: (d: number) => void;
  curriculumData: Record<number, any>;
  daysComplete?: number;
  onToggleVisibility?: () => void;
  onBookmark?: (key: string, title: string) => Promise<{ success: boolean; alreadyExists?: boolean }>;
  bookmarkedKeys?: string[];
}) {
  const [pendingBookmarks, setPendingBookmarks] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const currentDayData = curriculumData[day] || { title: 'NO DATA', blurb: 'No data available for this day.', sessions: [] };

  // Combine server bookmarks with pending local ones
  const bookmarkedEntries = new Set([...Array.from(bookmarkedKeys), ...Array.from(pendingBookmarks)]);

  // Generate a unique key for each entry based on day + session + entry index
  const getEntryKey = (sessionIdx: number, entryIdx: number) => `day${day}-sec${sessionIdx}-entry${entryIdx}`;

  const handleBookmark = async (entryKey: string, entryTitle: string) => {
    // Prevent double-clicks
    if (isSubmitting === entryKey) {
      return;
    }
    
    // If already bookmarked (from server), show message that it's pending approval
    if (bookmarkedKeys.includes(entryKey)) {
      toast.success(`"${entryTitle}" is already bookmarked and pending admin approval`, { 
        position: 'bottom-center',
        id: `bookmark-exists-${entryKey}` // Prevent duplicate toasts
      });
      return;
    }
    
    // If pending local bookmark, ignore
    if (pendingBookmarks.has(entryKey)) {
      return;
    }

    // If we have a callback, use it to submit to server
    if (onBookmark) {
      setIsSubmitting(entryKey);
      setPendingBookmarks(prev => new Set(prev).add(entryKey));
      
      try {
        const result = await onBookmark(entryKey, entryTitle);
        if (result.success) {
          toast.success(`Bookmarked "${entryTitle}" - Sent to admin for approval`, { 
            position: 'bottom-center',
            id: `bookmark-success-${entryKey}`
          });
        } else if (result.alreadyExists) {
          toast.success(`"${entryTitle}" is already bookmarked`, { 
            position: 'bottom-center',
            id: `bookmark-exists-${entryKey}`
          });
        } else {
          setPendingBookmarks(prev => {
            const newSet = new Set(prev);
            newSet.delete(entryKey);
            return newSet;
          });
          toast.error(`Failed to bookmark "${entryTitle}"`, { 
            position: 'bottom-center',
            id: `bookmark-error-${entryKey}`
          });
        }
      } catch (error) {
        setPendingBookmarks(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryKey);
          return newSet;
        });
        toast.error(`Failed to bookmark "${entryTitle}"`, { 
          position: 'bottom-center',
          id: `bookmark-error-${entryKey}`
        });
      } finally {
        setIsSubmitting(null);
      }
    } else {
      // Fallback to local-only bookmarking
      setPendingBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.add(entryKey);
        return newSet;
      });
      toast.success(`Bookmarked "${entryTitle}" - Access it later from My Portfolio`, { 
        position: 'bottom-center',
        id: `bookmark-local-${entryKey}`
      });
    }
  };

  let selectedSessionHour = '';
  let selectedSessionColor = '#4dffa0';

  return (
    <div style={{ border: '2px solid #28432f', borderRadius: 10, background: '#14211b', overflow: 'hidden', flex: '1 1 330px', minWidth: 290, display: 'flex', flexDirection: 'column', maxHeight: 'clamp(560px,74vh,820px)' }}>
      {/* Header bar / tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e1512', borderBottom: '2px solid #28432f' }}>
        <div className="font-pixel" style={{ fontSize: 10, color: '#4dffa0', letterSpacing: 1 }}>◱ CURRICULUM BROWSER</div>
        <button 
          onClick={onToggleVisibility}
          title="Hide the browser to expand the Eden bench"
          className="font-pixel"
          style={{ fontSize: 11, color: '#77b78d', background: 'rgba(0,0,0,.3)', border: '2px solid #28432f', borderRadius: 5, padding: '8px 9px', cursor: 'pointer', flex: 'none' }}
        >
          ◧
        </button>
      </div>

      <div style={{ padding: '14px 14px 0', borderBottom: '2px solid #28432f' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[1, 2, 3].map((d) => {
            const isLocked = false;
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
                  flex: 1, padding: '10px 6px', fontSize: 10, borderRadius: 6, whiteSpace: 'nowrap',
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
      
      <div style={{ flex: 1, padding: '14px 14px 16px', overflowY: 'auto' }}>
        <div className="font-pixel" style={{ fontSize: 12, color: '#ffd23f', lineHeight: 1.5, margin: '2px 2px 7px' }}>DAY 0{day} · {currentDayData.title?.replace(/^Day\s*\d+\s*[—\-:]\s*/i, '')}</div>
        <div style={{ fontSize: 18, color: '#77b78d', lineHeight: 1.35, marginBottom: 15, fontFamily: "'VT323', monospace" }}>{currentDayData.blurb}</div>
        
        {currentDayData.sessions.map((sec: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <div className="font-pixel" style={{ fontSize: 10, color: '#0e1512', background: sec.color, padding: '6px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>
              {sec.hour} · {sec.title} · {sec.dur}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sec.entries.map((en: any, eIdx: number) => {
                const entryKey = getEntryKey(idx, eIdx);
                const isBookmarked = bookmarkedEntries.has(entryKey);
                return (
                <div key={eIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    onClick={() => onSelectEntry({ ...en, sectionTitle: sec.title, sectionKey: sec.id, hour: sec.hour })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,.2)', border: '1px solid #28432f', borderRadius: 8, padding: 12, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span className="font-pixel" style={{ fontSize: 10, color: '#0e1512', background: sec.color, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{eIdx + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-pixel" style={{ fontSize: 9, color: '#d6ffe0', lineHeight: 1.35, letterSpacing: 0.5 }}>{en.title}</div>
                      <div style={{ fontSize: 17, color: '#77b78d', marginTop: 5, lineHeight: 1.5, fontFamily: "'VT323', monospace" }}>{en.sub || en.subtitle || en.entry_type}</div>
                    </div>
                    <span className="font-pixel" style={{ fontSize: 12, color: '#4dffa0' }}>›</span>
                  </button>
                  <button 
                    onClick={() => handleBookmark(entryKey, en.title)}
                    disabled={isSubmitting === entryKey}
                    title={isBookmarked ? 'Already bookmarked' : 'Bookmark this session'}
                    style={{ 
                      flex: 'none', 
                      background: isBookmarked ? '#45d6ff' : 'transparent', 
                      border: '1px solid #28432f', 
                      borderRadius: 6, 
                      padding: '10px 12px', 
                      cursor: isSubmitting === entryKey ? 'wait' : 'pointer', 
                      color: isBookmarked ? '#0e1512' : '#45d6ff', 
                      fontSize: 16,
                      transition: 'all 0.15s',
                      opacity: isSubmitting === entryKey ? 0.6 : 1
                    }}
                  >
                    {isSubmitting === entryKey ? '⏳' : isBookmarked ? '★' : '☆'}
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
