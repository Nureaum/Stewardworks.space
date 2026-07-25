'use client';

import React, { useState } from 'react';
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
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [curriculumVisible, setCurriculumVisible] = useState(true);
  const [sandboxVisible, setSandboxVisible] = useState(true);

  // Temporary mock data for UI buildout
  const profilePct = 40;
  const chiaStage = 2;

  const handleSaveCreation = async (data: { platform: string; url: string; showcase: boolean }) => {
    if (!cohortId) {
      toast.error('Error: Cohort ID is missing.', { position: 'bottom-center' });
      return;
    }
    
    try {
      // Save as an engagement so it shows up in the Admin approvals queue
      const contentData = JSON.stringify({
        showcaseRequested: data.showcase,
        showcaseVisible: false,
      });
      await addEngagement(cohortId, 'generation', `Creation from ${data.platform}`, data.platform, data.url, contentData);
      
      toast.success(`Creation saved successfully!`, { position: 'bottom-center' });
    } catch (err) {
      console.error('Error saving creation:', err);
      toast.error('Failed to save creation.', { position: 'bottom-center' });
    }
  };

  return (
    <div className="min-h-screen ai-lab-page" style={{ background: '#b7ab8c', fontFamily: "'VT323', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(8px,2.5vw,34px)', color: '#d6ffe0', '--bg':'#0e1512','--pn':'#14211b','--ln':'#28432f','--ng':'#4dffa0','--sy':'#ffd23f','--tx':'#d6ffe0','--mu':'#77b78d','--pk':'#ff5fd2','--cy':'#45d6ff' } as React.CSSProperties}>
      <style>{`
        .ai-lab-page .font-pixel { font-size: 10px !important; }
        .ai-lab-page input, .ai-lab-page textarea, .ai-lab-page select { font-size: 18px !important; padding: 12px 14px !important; }
        .ai-lab-page input::placeholder, .ai-lab-page textarea::placeholder { font-size: 16px !important; }
        .ai-lab-page [data-day-tile] .font-pixel { font-size: 9px !important; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 1240, border: '12px solid #d8ccb0', background: '#efe7d6', borderRadius: 20, padding: 10, boxShadow: '0 24px 60px rgba(40,50,30,.35),inset 0 2px 0 rgba(255,255,255,.6),inset 0 -3px 0 rgba(0,0,0,.12)' }}>
        
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
              <button
                onClick={() => {/* already on student view */}}
                className="font-pixel"
                style={{ fontSize: 10, padding: '8px 11px', border: 'none', cursor: 'pointer', background: '#173026', color: '#4dffa0' }}
              >
                ▸ STUDENT
              </button>
              <button
                onClick={() => {
                  if (cohortId) {
                    router.push(`/hub/pilot-workshops/${cohortId}/journey?mode=admin`);
                  } else {
                    router.push('/hub/pilot-workshops');
                  }
                }}
                className="font-pixel"
                style={{ fontSize: 10, padding: '8px 11px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#8a9a7f' }}
              >
                ⚙ ADMIN
              </button>
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
        <div style={{ position: 'relative', background: 'var(--bg,#0e1512)', borderRadius: 10, overflow: 'hidden', minHeight: 'clamp(560px,80vh,960px)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.5),inset 0 0 90px rgba(0,0,0,.6)' }}>
          {/* Scanlines layer */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, background: 'repeating-linear-gradient(0deg,rgba(0,0,0,.15) 0px,rgba(0,0,0,.15) 1px,transparent 2px,transparent 3px)', mixBlendMode: 'multiply' }}></div>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 41, background: 'radial-gradient(120% 100% at 50% 45%,transparent 55%,rgba(0,0,0,.5) 100%)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 5, padding: 'clamp(12px,2.4vw,22px)' }}>
            <div style={{ maxWidth: 1160, margin: '0 auto' }}>

            {/* student sub-nav */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <button 
                    onClick={() => router.push(cohortId ? `/hub/pilot-workshops/${cohortId}/journey` : '/hub/pilot-workshops')}
                    className="font-pixel"
                    style={{ fontSize: 10, color: '#4dffa0', textDecoration: 'none', background: 'rgba(77,255,160,.08)', border: '2px solid #4dffa0', borderRadius: 7, padding: '11px 13px', whiteSpace: 'nowrap', boxShadow: '0 0 12px rgba(77,255,160,.15)', cursor: 'pointer' }}
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
                            if (cohortId) {
                              router.push(`/hub/pilot-workshops/${cohortId}/journey?tab=portfolio`);
                            } else {
                              router.push('/hub/pilot-workshops');
                            }
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
                    <LabHeader day={day} profilePct={profilePct} chiaStage={chiaStage} userCharacter={userCharacter} daysComplete={daysComplete} bankedPrinciplesCount={bankedPrinciples.length} totalPrinciples={principles.length} />
                    
                    {/* Session control bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <button 
                        onClick={() => setCurriculumVisible(!curriculumVisible)}
                        title="Show or hide the curriculum browser"
                        className="font-pixel"
                        style={{ fontSize: 11, color: '#4dffa0', background: 'rgba(77,255,160,.08)', border: '2px solid #4dffa0', borderRadius: 6, padding: '11px 13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(77,255,160,.18)' }}
                      >
                        {curriculumVisible ? '◧ HIDE CURRICULUM' : '◱ SHOW CURRICULUM'}
                      </button>
                      <div className="font-pixel" style={{ fontSize: 11, color: '#ffd23f', lineHeight: 1.5, minWidth: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {initialCurriculum[day]?.title || `DAY 0${day}`}
                      </div>
                      <button 
                        onClick={() => setSandboxVisible(!sandboxVisible)}
                        title="Show or hide the generation sandbox"
                        className="font-pixel"
                        style={{ fontSize: 11, color: '#ff5fd2', background: 'rgba(255,95,210,.08)', border: '2px solid #ff5fd2', borderRadius: 6, padding: '11px 13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(255,95,210,.18)' }}
                      >
                        {sandboxVisible ? '◧ HIDE SANDBOX' : '◱ SHOW SANDBOX'}
                      </button>
                    </div>

                    {/* SPLIT : curriculum (collapsible) + Eden sandbox */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-start' }}>
                      {curriculumVisible && (
                        <CurriculumBrowser 
                          day={day} 
                          activeEntry={activeEntry} 
                          onSelectEntry={setActiveEntry} 
                          onSetDay={(d: number) => { setDay(d); setActiveEntry(null); }}
                          curriculumData={initialCurriculum}
                          daysComplete={daysComplete}
                          onToggleVisibility={() => setCurriculumVisible(false)}
                          bookmarkedKeys={initialEngagements.filter(e => e.kind === 'bookmark').map(e => e.content || '')}
                          onBookmark={async (key: string, title: string) => {
                            if (!cohortId) {
                              return { success: false };
                            }
                            // Check if already bookmarked using the unique key stored in content
                            const existing = initialEngagements.find(e => e.kind === 'bookmark' && e.content === key);
                            if (existing) {
                              return { success: false, alreadyExists: true };
                            }
                            try {
                              // Store the unique key in the content field to identify this specific entry
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
                        <GenerationSandbox edenEmbedUrl={edenEmbedUrl} platforms={platforms} />
                      )}
                    </div>

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
                        // dashboard items have day_number at the top level (not nested under .day)
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
                      // Check if already bookmarked
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
                  />
                )}
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


