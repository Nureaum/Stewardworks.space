'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { addEngagement } from '@/app/actions/workshops/engagement';
import { addShowcaseItem } from '@/app/actions/workshops/showcase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import LabHeader from './LabHeader';
import CurriculumBrowser from './CurriculumBrowser';
import GenerationSandbox from './GenerationSandbox';
import SubmissionTracker from './SubmissionTracker';
import SaveCreationPanel from './SaveCreationPanel';
import Showcase from '../journey/Showcase';
import ArtifactReader from '../journey/ArtifactReader';
import AILabPortfolioTabs from './AILabPortfolioTabs';
import { WorkshopDayEntry, WorkshopDay } from '@/types/workshops';

export default function AILabClient({
  initialRole = 'student',
  edenEmbedUrl = 'https://app.eden.art/',
  initialCurriculum,
  daysComplete = 0,
  approvedDays = 0,
  cohortId,
  days = [],
  principles = [],
  userRole = 'participant',
  showcaseItems = [],
  initialEngagements = [],
  userCharacter = null,
  dashboard = [],
  submissions = [],
  bankedPrinciples = [],
  platforms = [],
}: {
  initialRole?: 'student' | 'admin';
  edenEmbedUrl?: string;
  initialCurriculum: Record<number, any>;
  daysComplete?: number;
  approvedDays?: number;
  cohortId?: string;
  days?: WorkshopDay[];
  principles?: any[];
  userRole?: string;
  showcaseItems?: any[];
  initialEngagements?: any[];
  userCharacter?: any;
  dashboard?: any[];
  submissions?: any[];
  bankedPrinciples?: any[];
  platforms?: { id: string; name: string; url: string; is_default: boolean }[];
}) {
  const router = useRouter();
  const [studentView, setStudentView] = useState<'lab' | 'portfolio' | 'showcase'>('lab');
  const [day, setDay] = useState(1);
  const [activeEntry, setActiveEntry] = useState<any | null>(null);
  const [curriculumVisible, setCurriculumVisible] = useState(true);
  const [sandboxVisible, setSandboxVisible] = useState(true);

  // View mode: 'popup' = existing modal, 'side' = inline in left column
  const [entryViewMode, setEntryViewMode] = useState<'popup' | 'side'>('popup');

  // Draggable divider state: percentage for left column width (min 25, max 80)
  const [splitPct, setSplitPct] = useState(50);
  const isDragging = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const profilePct = 40;
  const chiaStage = 2;

  // Drag handlers for the resizable divider
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const handleSaveCreation = async (data: { platform: string; url: string; showcase: boolean; previewImageUrl?: string }) => {
    if (!cohortId) {
      toast.error('Error: Cohort ID is missing.', { position: 'bottom-center' });
      return;
    }
    try {
      const contentData = JSON.stringify({
        showcaseRequested: data.showcase,
        showcaseVisible: false,
        ...(data.previewImageUrl ? { previewImageUrl: data.previewImageUrl } : {}),
      });
      await addEngagement(cohortId, 'generation', `Creation from ${data.platform}`, data.platform, data.url, contentData);
      toast.success(`Creation saved successfully!`, { position: 'bottom-center' });
    } catch (err) {
      console.error('Error saving creation:', err);
      toast.error('Failed to save creation.', { position: 'bottom-center' });
    }
  };

  // Inline ArtifactReader props (same as popup version)
  const artifactReaderProps = activeEntry ? {
    key: `lab-side-${day}-${activeEntry.id}`,
    entry: activeEntry,
    dayId: days.find(d => d.day_number === day)?.id || '',
    dayNumber: day,
    scene: { label: `ACT ${day}` },
    accent: '#4dffa0',
    onClose: () => setActiveEntry(null),
    cohortId: cohortId || '',
    showcaseItems,
    progressRows: dashboard?.filter((d: any) => d.progress).map((d: any) => ({ ...d.progress, workshop_day_id: d.day_id || d.id })) || [],
    principles,
    bankedPrincipleIds: bankedPrinciples.map((bp: any) => bp.principle_id),
    currentDayPrincipleId: null as null,
    submissions,
    allBankedPrinciples: bankedPrinciples,
    onDeliverableSubmitted: () => {},
    userRole,
    onBookmark: async (key: string, title: string, source: string, url?: string) => {
      if (!cohortId) return;
      try {
        await addEngagement(cohortId, 'bookmark', title, source, url || '', key);
        toast.success(`Bookmarked "${title}"`, { position: 'bottom-center' });
      } catch (err) {
        toast.error(`Failed to bookmark "${title}"`, { position: 'bottom-center' });
      }
    },
    isBookmarked: initialEngagements.some(e => e.kind === 'bookmark' && e.content === `${days.find(d => d.day_number === day)?.id}-${activeEntry?.id}`),
    inline: true,
    viewMode: entryViewMode,
    onToggleViewMode: setEntryViewMode,
  } : null;

  return (
    <div
      className="min-h-screen ai-lab-page"
      style={{
        background: '#b7ab8c',
        fontFamily: "'VT323', monospace",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Wider padding so more of the screen is used
        padding: 'clamp(4px, 1.5vw, 20px)',
        color: '#d6ffe0',
        '--bg': '#0e1512', '--pn': '#14211b', '--ln': '#28432f',
        '--ng': '#4dffa0', '--sy': '#ffd23f', '--tx': '#d6ffe0',
        '--mu': '#77b78d', '--pk': '#ff5fd2', '--cy': '#45d6ff'
      } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .ai-lab-page .font-pixel { font-size: 10px !important; }
        .ai-lab-page input, .ai-lab-page textarea, .ai-lab-page select { font-size: 18px !important; padding: 12px 14px !important; }
        .ai-lab-page input::placeholder, .ai-lab-page textarea::placeholder { font-size: 16px !important; }
        .ai-lab-page [data-day-tile] .font-pixel { font-size: 9px !important; }
        .lab-divider { width: 14px; cursor: col-resize; background: var(--ln,#28432f); flex: none; border-radius: 4px; transition: all 0.2s; position: relative; box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); z-index: 10; margin: 0 4px; }
        .lab-divider:hover, .lab-divider:active { background: #4dffa0; box-shadow: 0 0 12px rgba(77,255,160,.4); width: 16px; margin: 0 3px; }
        .lab-divider::after { content: '\u25C2 \u22EE \u25B8'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: rgba(255,255,255,0.6); font-size: 10px; font-family: monospace; pointer-events: none; letter-spacing: -1px; transition: color 0.2s; }
        .lab-divider:hover::after, .lab-divider:active::after { color: #08120d; }
        .lab-inline-reader { height: 100%; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--ln,#28432f) transparent; }
        .lab-inline-reader::-webkit-scrollbar { width: 4px; }
        .lab-inline-reader::-webkit-scrollbar-track { background: transparent; }
        .lab-inline-reader::-webkit-scrollbar-thumb { background: var(--ln,#28432f); border-radius: 2px; }
      ` }} />

      {/* Wider monitor frame — using maxWidth 100% to fill screen */}
      <div style={{
        width: '100%',
        maxWidth: '100%',
        border: '14px solid #d8ccb0',
        background: '#efe7d6',
        borderRadius: 20,
        padding: '8px 10px',
        boxShadow: '0 24px 60px rgba(40,50,30,.35),inset 0 2px 0 rgba(255,255,255,.6),inset 0 -3px 0 rgba(0,0,0,.12)'
      }}>

        {/* OS Title Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '5px 10px 9px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <button
              onClick={() => router.push('/hub')}
              className="font-pixel"
              style={{ fontSize: 10, color: '#6f7e5e', textDecoration: 'none', border: '2px solid #b9ac86', borderRadius: 5, padding: '6px 8px', whiteSpace: 'nowrap', background: 'transparent', cursor: 'pointer' }}
            >
              ◄ HUB
            </button>
            <div className="font-pixel" style={{ fontSize: 11, letterSpacing: 1, color: '#7a805c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>STEWARD OS · AI LABS WORKBENCH</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
            {(userRole === 'admin' || userRole === 'super_admin') && (
              <div style={{ display: 'flex', border: '2px solid #b9ac86', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => {}} className="font-pixel" style={{ fontSize: 10, padding: '8px 11px', border: 'none', cursor: 'pointer', background: '#173026', color: '#4dffa0' }}>▸ STUDENT</button>
                <button
                  onClick={() => { if (cohortId) router.push(`/hub/pilot-workshops/${cohortId}/journey?mode=admin`); else router.push('/hub/pilot-workshops'); }}
                  className="font-pixel"
                  style={{ fontSize: 10, padding: '8px 11px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#8a9a7f' }}
                >⚙ ADMIN</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e06a5a' }}></span>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b84a' }}></span>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5fbf7a' }}></span>
            </div>
          </div>
        </div>

        {/* SCREEN */}
        <div style={{ position: 'relative', background: 'var(--bg,#0e1512)', borderRadius: 10, overflow: 'hidden', minHeight: 'clamp(560px,82vh,1000px)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.5),inset 0 0 90px rgba(0,0,0,.6)' }}>
          {/* Scanlines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, background: 'repeating-linear-gradient(0deg,rgba(0,0,0,.15) 0px,rgba(0,0,0,.15) 1px,transparent 2px,transparent 3px)', mixBlendMode: 'multiply' }}></div>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 41, background: 'radial-gradient(120% 100% at 50% 45%,transparent 55%,rgba(0,0,0,.5) 100%)' }}></div>

          <div style={{ position: 'relative', zIndex: 5, padding: 'clamp(10px,1.8vw,18px)' }}>
            <div style={{ margin: '0 auto' }}>

              {/* Student sub-nav */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button
                  onClick={() => router.push(cohortId ? `/hub/pilot-workshops/${cohortId}/journey` : '/hub/pilot-workshops')}
                  className="font-pixel"
                  style={{ fontSize: 10, color: '#4dffa0', background: 'rgba(77,255,160,.08)', border: '2px solid #4dffa0', borderRadius: 7, padding: '11px 13px', whiteSpace: 'nowrap', boxShadow: '0 0 12px rgba(77,255,160,.15)', cursor: 'pointer' }}
                >
                  ◄ BACK TO WORKSHOP
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: 'lab', label: '⚙ LAB', col: '#4dffa0' },
                    { id: 'portfolio', label: '▦ MY PORTFOLIO', col: '#45d6ff' },
                    { id: 'showcase', label: '★ STUDENT SHOWCASE', col: '#ff5fd2' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'portfolio') {
                          if (cohortId) router.push(`/hub/pilot-workshops/${cohortId}/journey?tab=portfolio`);
                          else router.push('/hub/pilot-workshops');
                        } else {
                          setStudentView(tab.id as any);
                        }
                      }}
                      className="font-pixel"
                      style={{
                        fontSize: 10, cursor: 'pointer', padding: '11px 14px', borderRadius: 7,
                        border: `2px solid ${studentView === tab.id ? tab.col : '#28432f'}`,
                        background: studentView === tab.id ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.2)',
                        color: studentView === tab.id ? tab.col : '#77b78d',
                        boxShadow: studentView === tab.id ? `0 0 12px ${tab.col}` : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {studentView === 'lab' && (
                <div>
                  <LabHeader day={day} profilePct={profilePct} chiaStage={chiaStage} userCharacter={userCharacter} daysComplete={daysComplete} bankedPrinciplesCount={bankedPrinciples.length} totalPrinciples={principles.length} principles={principles} />

                  {/* Session control bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <button
                      onClick={() => setCurriculumVisible(!curriculumVisible)}
                      className="font-pixel"
                      style={{ fontSize: 11, color: '#4dffa0', background: 'rgba(77,255,160,.08)', border: '2px solid #4dffa0', borderRadius: 6, padding: '11px 13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(77,255,160,.18)' }}
                    >
                      {curriculumVisible ? '◧ HIDE CURRICULUM' : '◱ SHOW CURRICULUM'}
                    </button>

                    <div className="font-pixel" style={{ fontSize: 11, color: '#ffd23f', lineHeight: 1.5, minWidth: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      DAY 0{day} — {initialCurriculum[day]?.title?.replace(/^Day\s*\d+\s*[—\-:]\s*/i, '') || `Loading...`}
                    </div>

                    <button
                      onClick={() => setSandboxVisible(!sandboxVisible)}
                      className="font-pixel"
                      style={{ fontSize: 11, color: '#45d6ff', background: 'rgba(69,214,255,.08)', border: '2px solid #45d6ff', borderRadius: 6, padding: '11px 13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(69,214,255,.18)' }}
                    >
                      {sandboxVisible ? '◧ HIDE NOTES' : '◱ SHOW NOTES'}
                    </button>
                  </div>

                  {/* ALWAYS VISIBLE: Generation Sandbox */}
                  <div style={{ marginBottom: 15 }}>
                    <GenerationSandbox edenEmbedUrl={edenEmbedUrl} platforms={platforms} />
                  </div>

                  {/* SPLIT COLUMNS — with draggable divider when both are visible */}
                  {entryViewMode === 'side' && activeEntry && (curriculumVisible || sandboxVisible) ? (
                    // ── SIDE-BY-SIDE MODE ──
                    <div
                      ref={splitContainerRef}
                      style={{ display: 'flex', gap: 0, alignItems: 'stretch', height: 'clamp(420px,55vh,720px)' }}
                    >
                      {/* LEFT: Inline lesson reader */}
                      <div style={{ flex: `0 0 ${splitPct}%`, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,.15)', borderRadius: '8px 0 0 8px', border: '1px solid var(--ln,#28432f)' }}>

                        {/* Scrollable reader content */}
                        <div className="lab-inline-reader" style={{ flex: 1, padding: '0 0 8px 0' }}>
                          {artifactReaderProps && <ArtifactReader {...artifactReaderProps} />}
                        </div>
                      </div>

                      {/* DRAGGABLE DIVIDER */}
                      <div
                        className="lab-divider"
                        onMouseDown={onDragStart}
                        title="Drag to resize columns"
                      />

                      {/* RIGHT: Notes (portfolio tabs) */}
                      {sandboxVisible && (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRadius: '0 8px 8px 0', border: '1px solid var(--ln,#28432f)', borderLeft: 'none', overflow: 'hidden' }}>
                          <AILabPortfolioTabs cohortId={cohortId} initialEngagements={initialEngagements} />
                        </div>
                      )}
                    </div>
                  ) : (
                    // ── NORMAL MODE (popup) ──
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-start' }}>
                      {curriculumVisible && (
                        <CurriculumBrowser
                          day={day}
                          activeEntry={activeEntry}
                          onSelectEntry={(entry) => {
                            setActiveEntry(entry);
                            // Auto-switch to popup mode when clicking an entry in normal layout
                          }}
                          onSetDay={(d: number) => { setDay(d); setActiveEntry(null); }}
                          curriculumData={initialCurriculum}
                          daysComplete={daysComplete}
                          onToggleVisibility={() => setCurriculumVisible(false)}
                          bookmarkedKeys={initialEngagements.filter(e => e.kind === 'bookmark').map(e => e.content || '')}
                          onBookmark={async (key: string, title: string) => {
                            if (!cohortId) return { success: false };
                            const existing = initialEngagements.find(e => e.kind === 'bookmark' && e.content === key);
                            if (existing) return { success: false, alreadyExists: true };
                            try {
                              await addEngagement(cohortId, 'bookmark', title, 'curriculum', '', key);
                              return { success: true };
                            } catch (error) {
                              console.error('Error adding bookmark:', error);
                              return { success: false };
                            }
                          }}
                        />
                      )}
                      {sandboxVisible && (
                        <div style={{ flex: '1 1 330px', minWidth: 290, display: 'flex', flexDirection: 'column', gap: 15 }}>
                          <AILabPortfolioTabs cohortId={cohortId} initialEngagements={initialEngagements} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save a Creation Panel */}
                  <SaveCreationPanel onSave={handleSaveCreation} />

                  {/* Submission Tracker */}
                  <SubmissionTracker
                    day={day}
                    dayId={days?.find(d => d.day_number === day)?.id || initialCurriculum[day]?.id}
                    daysComplete={daysComplete}
                    approvedDays={approvedDays}
                    days={days}
                    principles={principles}
                    initialEngagements={initialEngagements}
                    currentDaySubmission={(() => {
                      const currentDay = days?.find((d: any) => d.day_number === day);
                      if (!currentDay) return null;
                      return submissions?.find((s: any) => s.workshop_day_id === currentDay.id) || null;
                    })()}
                    currentDayProgress={(() => {
                      const currentDayDash = dashboard?.find((d: any) => d.day_number === day);
                      return currentDayDash?.progress || null;
                    })()}
                    bankedPrincipleIds={bankedPrinciples.map((bp: any) => bp.principle_id)}
                    allBankedPrinciples={bankedPrinciples}
                    progressRows={dashboard?.filter((d: any) => d.progress).map((d: any) => ({ ...d.progress, workshop_day_id: d.day_id || d.id })) || []}
                    onChangeDay={(d) => { setDay(d); setActiveEntry(null); }}
                    userRole={userRole}
                  />
                </div>
              )}

              {studentView === 'showcase' && (
                <Showcase
                  cohortId={cohortId || ''}
                  showcaseItems={showcaseItems}
                  engagements={initialEngagements}
                  onlyStudents={true}
                  onBookmark={async (key: string, title: string, source: string, url?: string) => {
                    if (!cohortId) {
                      toast.error('Error: Cohort ID is missing.', { position: 'bottom-center', id: `bookmark-error-${key}` });
                      return;
                    }
                    const existing = initialEngagements.find(e => e.kind === 'bookmark' && e.title === title);
                    if (existing) {
                      toast.success(`"${title}" is already bookmarked and pending admin approval`, { position: 'bottom-center', id: `bookmark-exists-${key}` });
                      return;
                    }
                    try {
                      await addEngagement(cohortId, 'bookmark', title, source, url || '', `Bookmarked from Student Showcase`);
                      toast.success(`Bookmarked "${title}" - Sent to admin for approval`, { position: 'bottom-center', id: `bookmark-success-${key}` });
                    } catch (error) {
                      console.error('Error adding bookmark:', error);
                      toast.error(`Failed to bookmark "${title}"`, { position: 'bottom-center', id: `bookmark-error-${key}` });
                    }
                  }}
                  isAdmin={userRole === 'admin' || userRole === 'super_admin'}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Popup Artifact Reader modal (only in popup mode) ── */}
      {activeEntry && entryViewMode === 'popup' && (
        <ArtifactReader
          key={`lab-popup-${day}-${activeEntry.id}`}
          entry={activeEntry}
          dayId={days.find(d => d.day_number === day)?.id || ''}
          dayNumber={day}
          scene={{ label: `ACT ${day}` }}
          accent="#4dffa0"
          onClose={() => setActiveEntry(null)}
          cohortId={cohortId || ''}
          showcaseItems={showcaseItems}
          progressRows={dashboard?.filter((d: any) => d.progress).map((d: any) => ({ ...d.progress, workshop_day_id: d.day_id || d.id })) || []}
          principles={principles}
          bankedPrincipleIds={bankedPrinciples.map((bp: any) => bp.principle_id)}
          currentDayPrincipleId={null}
          submissions={submissions}
          allBankedPrinciples={bankedPrinciples}
          onDeliverableSubmitted={() => {}}
          userRole={userRole}
          onBookmark={async (key: string, title: string, source: string, url?: string) => {
            if (!cohortId) return;
            try {
              await addEngagement(cohortId, 'bookmark', title, source, url || '', key);
              toast.success(`Bookmarked "${title}"`, { position: 'bottom-center' });
            } catch (err) {
              toast.error(`Failed to bookmark "${title}"`, { position: 'bottom-center' });
            }
          }}
          isBookmarked={initialEngagements.some(e => e.kind === 'bookmark' && e.content === `${days.find(d => d.day_number === day)?.id}-${activeEntry.id}`)}
          viewMode={entryViewMode}
          onToggleViewMode={setEntryViewMode}
        />
      )}
    </div>
  );
}
