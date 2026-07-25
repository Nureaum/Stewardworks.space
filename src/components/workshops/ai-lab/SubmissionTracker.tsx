'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { uploadCreationImage } from '@/app/actions/workshops/engagement';
import { submitDeliverable } from '@/app/actions/workshops/participants';
import DeliverableMediaPreview from '@/components/workshops/DeliverableMediaPreview';

function chiaRects(stage: number) {
  const gL='#d9b34d',gM='#c19a33',gD='#9c7a28',eye='#3a2c14',bD='#1c150f',bM='#33281b',gr='#5fa83c',gr2='#8fd85f',fp='#ff5fd2',fy='#ffd23f',fv='#b06bff';
  const r=[
    [2,18,12,2,bD],[3,18,10,1,bM],
    [6,11,4,1,gL],[5,12,6,1,gM],[5,13,6,1,gM],[4,14,8,1,gM],[4,15,8,1,gD],[3,16,10,1,gM],[3,17,10,1,gD],
    [5,16,6,1,gL],
    [7,10,2,1,gM],
    [6,5,4,1,gL],[5,6,6,1,gL],[5,7,6,1,gM],[5,8,6,1,gM],[6,9,4,1,gD],
    [6,7,1,1,eye],[9,7,1,1,eye]
  ] as any[];
  const S: any[]=[];
  const defs: Record<number, any[]>={
    1:[[6,3,1,2,gr],[8,3,1,2,gr],[7,2,1,3,gr],[7,2,1,1,gr2]],
    2:[[5,2,1,3,gr],[7,1,1,4,gr],[9,2,1,3,gr],[8,2,1,3,gr],[7,1,1,1,gr2],[5,2,1,1,gr2],[9,2,1,1,gr2]],
    3:[[5,1,1,4,gr],[6,2,1,3,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,2,1,3,gr],[10,3,1,2,gr],[7,0,1,1,gr2],[5,1,1,1,gr2],[9,2,1,1,gr2]],
    4:[[4,3,1,2,gr],[5,1,1,4,gr],[6,0,1,5,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,0,1,5,gr],[10,2,1,3,gr],[6,0,1,1,gr2],[9,0,1,1,gr2],[7,0,1,1,gr2]]
  };
  if(stage>=1&&stage<5)(defs[stage]||[]).forEach(x=>S.push(x));
  if(stage>=5){
    [[5,2,1,3,gr],[6,1,1,3,gr],[9,1,1,3,gr],[10,2,1,3,gr],[7,2,1,2,gr],[8,2,1,2,gr]].forEach(x=>S.push(x));
    [[4,0,2,2,fp],[7,0,2,2,fy],[10,0,2,2,fv]].forEach(x=>S.push(x));
  }
  return r.concat(S);
}

function buildChiaUri(stage: number, accent: string = '#4dffa0') {
  const rects = chiaRects(stage);
  const body = rects.map(a => `<rect x='${a[0]}' y='${a[1]}' width='${a[2]}' height='${a[3]}' fill='${a[4]==='A'?accent:a[4]}'/>`).join('');
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'>${body}</svg>`);
}

interface DaySubmission {
  id?: string;
  title?: string | null;
  description?: string | null;
  submission_text?: string | null;
  external_video_url?: string | null;
  file_storage_path?: string | null;
}

interface DayProgress {
  deliverable_status?: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  review_note?: string | null;
}

export default function SubmissionTracker({ 
  day, 
  dayId, 
  daysComplete = 0, 
  days = [], 
  principles = [], 
  approvedDays = 0, 
  initialEngagements = [],
  currentDaySubmission,
  currentDayProgress,
  bankedPrincipleIds = [],
  allBankedPrinciples = [],
  progressRows = [],
  onChangeDay,
  userRole = 'participant'
}: { 
  day: number, 
  dayId?: string, 
  daysComplete?: number, 
  days?: any[], 
  principles?: any[], 
  approvedDays?: number, 
  initialEngagements?: any[],
  currentDaySubmission?: DaySubmission | null,
  currentDayProgress?: DayProgress | null,
  bankedPrincipleIds?: string[],
  allBankedPrinciples?: { progress_id: string; principle_id: string }[],
  progressRows?: any[],
  onChangeDay?: (day: number) => void,
  userRole?: string
}) {

  const [minimized, setMinimized] = useState(false);
  const [selectedPrinciple, setSelectedPrinciple] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localSubmission, setLocalSubmission] = useState<DaySubmission | null>(currentDaySubmission || null);
  const [localProgress, setLocalProgress] = useState<DayProgress | null>(currentDayProgress || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  // Track banked principles locally so UI updates immediately after submission
  const [localBankedPrincipleIds, setLocalBankedPrincipleIds] = useState<string[]>(bankedPrincipleIds);

  // Check if already submitted
  const isAlreadySubmitted = localProgress?.deliverable_status === 'submitted' || localProgress?.deliverable_status === 'approved';
  const isApproved = localProgress?.deliverable_status === 'approved';

  // Sync props to local state when they change
  useEffect(() => {
    setLocalSubmission(currentDaySubmission || null);
    setLocalProgress(currentDayProgress || null);
    setLocalBankedPrincipleIds(bankedPrincipleIds);
    setIsEditMode(false);
    setSubmissionTitle('');
    setSubmissionDescription('');
    setSubmissionUrl('');
    setFileToUpload(null);
    setSelectedPrinciple('');
  }, [day, currentDaySubmission, currentDayProgress]);

  // Keep banked IDs in sync when props refresh (e.g. after router.refresh)
  useEffect(() => {
    setLocalBankedPrincipleIds(bankedPrincipleIds);
  }, [bankedPrincipleIds.join(',')]);

  // Get the submitted URL from local submission
  const getSubmittedUrl = () => {
    if (!localSubmission) return '';
    return localSubmission.external_video_url || localSubmission.submission_text || '';
  };

  // Guests cannot submit deliverables - hide this entire component
  if (userRole === 'guest') return null;

  if (!days || days.length === 0) {
    return (
      <div style={{ marginTop: 14, border: '2px solid var(--ln,#3a3352)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '24px 16px', textAlign: 'center' }}>
        <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu,#a493c9)', lineHeight: 1.4 }}>
          NO DELIVERABLES ASSIGNED
          <br /><br />
          <span style={{ fontSize: 8 }}>The instructor has not added any workshop days yet.</span>
        </div>
      </div>
    );
  }

  const mappedPrinciples = principles && principles.length > 0 
    ? principles
    : [
        { id: 'p1', name: 'Active Production over Passive Consumption' },
        { id: 'p2', name: 'Bilingual Grounding' },
        { id: 'p3', name: 'Reclaiming Intention' },
        { id: 'p4', name: 'Friction is a Sanctuary' },
        { id: 'p5', name: 'Material Footprints' },
        { id: 'p6', name: 'Valuing Process over Output' },
        { id: 'p7', name: 'Honoring Land Caretakers' },
        { id: 'p8', name: 'Sovereign Compute Architecture' },
        { id: 'p9', name: 'Making Gaps Visible' },
      ];

  // Find the principle used specifically for THIS day's submission
  // by matching this day's progress row to the allBankedPrinciples entries
  const currentDayPrincipleId = (() => {
    if (!isAlreadySubmitted || !dayId) return null;
    // Find progress row for this day
    const dayProgressRow = progressRows.find((p: any) => p.workshop_day_id === dayId);
    if (!dayProgressRow) return null;
    // Find the principle linked to this day's progress
    const bp = allBankedPrinciples.find(b => b.progress_id === dayProgressRow.id);
    return bp?.principle_id || null;
  })();

  const currentPrinciple = currentDayPrincipleId ? mappedPrinciples.find((p: any) => (p.id || p) === currentDayPrincipleId) : null;
  const currentPrincipleName = currentPrinciple ? (currentPrinciple.name || currentPrinciple.title || currentPrinciple) : null;

  // IDs from APPROVED progress on OTHER days — these get struck-through
  const approvedOtherDayProgressIds = progressRows
    .filter((p: any) => p.workshop_day_id !== dayId && p.deliverable_status === 'approved')
    .map((p: any) => p.id);
  const otherDaysBankedIds = allBankedPrinciples
    .filter(bp => approvedOtherDayProgressIds.includes(bp.progress_id))
    .map(bp => bp.principle_id)
    .filter(id => id !== currentDayPrincipleId);

  // Principles that are PENDING (submitted but not yet approved) on OTHER days — orange, blocked
  const pendingOtherDayPrincipleIds = progressRows
    .filter((p: any) => p.workshop_day_id !== dayId && p.deliverable_status === 'submitted')
    .map((p: any) => allBankedPrinciples.find(bp => bp.progress_id === p.id)?.principle_id)
    .filter((id): id is string => !!id && id !== currentDayPrincipleId && !otherDaysBankedIds.includes(id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, etc.)', { position: 'bottom-center' });
      return;
    }

    setFileToUpload(file);
    setSubmissionUrl(URL.createObjectURL(file));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditClick = () => {
    // Pre-fill form with existing submission data
    if (localSubmission) {
      setSubmissionTitle(localSubmission.title || '');
      setSubmissionDescription(localSubmission.description || '');
      setSubmissionUrl(getSubmittedUrl());
      // Pre-fill the previously selected principle so user can re-select or change it
      setSelectedPrinciple(currentDayPrincipleId || '');
    }
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSubmissionTitle('');
    setSubmissionDescription('');
    setSubmissionUrl('');
    setFileToUpload(null);
    setSelectedPrinciple('');
  };

  // Helper to check if URL is an image
  const isImageUrl = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowerUrl = url.toLowerCase();
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) return true;
    if (lowerUrl.includes('supabase') && lowerUrl.includes('/storage/')) return true;
    return false;
  };

  const handleSubmitDeliverable = async () => {
    // Allow submission without principle if no available (non-other-day-banked) principles remain
    const availableCount = mappedPrinciples.filter((p: any) => !otherDaysBankedIds.includes(p.id) && !pendingOtherDayPrincipleIds.includes(p.id)).length;
    if (availableCount > 0 && !selectedPrinciple) {
      toast.error('Please select a principle first.', { position: 'bottom-center' });
      return;
    }
    if (!submissionUrl && !fileToUpload) {
      toast.error('Please provide your deliverable link or upload an image.', { position: 'bottom-center' });
      return;
    }
    if (!submissionTitle.trim()) {
      toast.error('Please enter a title for your deliverable.', { position: 'bottom-center' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalUrl = submissionUrl;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        finalUrl = await uploadCreationImage(formData);
      }
      
      if (dayId) {
        console.log('[SubmissionTracker] Submitting deliverable with principle_id:', selectedPrinciple);
        const result = await submitDeliverable(dayId, {
          title: submissionTitle.trim(),
          description: submissionDescription.trim() || undefined,
          submission_text: finalUrl,
          principle_id: selectedPrinciple,
          showcase_requested: false
        });
        console.log('[SubmissionTracker] Submit result:', result);
        
        if (!result.success && result.message) {
          throw new Error(result.message);
        }
        
        // Update local state immediately to show banked state
        setLocalSubmission({
          title: submissionTitle.trim(),
          description: submissionDescription.trim() || null,
          submission_text: finalUrl,
          external_video_url: finalUrl,
        });
        setLocalProgress({
          deliverable_status: 'submitted',
          review_note: null,
        });
        // Immediately update local banked principles so next day's form excludes this principle
        if (selectedPrinciple) {
          setLocalBankedPrincipleIds(prev => {
            const filtered = prev.filter(id => id !== currentDayPrincipleId); // remove old
            return [...filtered, selectedPrinciple]; // add new
          });
        }
      }
      
      toast('▲ Deliverable banked · pending teacher approval', {
        position: 'bottom-center',
        style: {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '9px',
          color: '#12081e',
          background: '#4dffa0',
          padding: '12px 20px',
          borderRadius: '6px',
          boxShadow: '0 0 18px rgba(77,255,160,.5)',
          border: 'none',
        },
        duration: 3000
      });
      
      // Reset form and exit edit mode
      setSubmissionUrl('');
      setSubmissionTitle('');
      setSubmissionDescription('');
      setFileToUpload(null);
      setSelectedPrinciple('');
      setIsEditMode(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload image.', { position: 'bottom-center' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayTitles = days && days.length > 0 
    ? days.map((d: any) => (d.title || '').toUpperCase()) 
    : ['STORY', 'RÉSUMÉ', 'PORTFOLIO'];

  const daysToMap = days && days.length > 0 ? days : [{day_number: 1}, {day_number: 2}, {day_number: 3}];

  // Base deliverables on approvedDays
  const delivPct = Math.min(approvedDays * 25, 75);
  // Optional engagement bonus
  const engPct = Math.min(
    initialEngagements
      .filter(e => e.status === 'approved')
      .reduce((a, e) => a + 25, 0),
    25
  );
  
  const chiaPct = Math.min(delivPct + engPct, 100);

  const chiaStage = (function(pct: number) {
    if (pct >= 100) return 5;
    if (pct >= 75) return 4;
    if (pct >= 50) return 3;
    if (pct >= 25) return 2;
    if (pct > 0) return 1;
    return 0;
  })(chiaPct);
  
  const chiaStageLabel = ['Bare bud', 'Sprouting', 'Filling in', 'Leafy crown', 'Lush mane', 'Full bloom 🌸'][chiaStage] || 'Bare bud';

  return (
    <div style={{ 
      marginTop: 14, 
      border: '2px solid var(--sy,#ffd23f)', 
      borderRadius: 10, 
      background: 'linear-gradient(180deg,rgba(255,210,63,.06),var(--pn,#14211b))', 
      padding: '15px 16px' 
    }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: 10, 
        justifyContent: 'space-between', 
        marginBottom: minimized ? 0 : 16 
      }}>
        <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold,#ffd23f)', letterSpacing: 1 }}>
          ◈ DELIVERABLE TRACKER &amp; SUBMISSION CONSOLE
        </div>
        <button 
          onClick={() => setMinimized(!minimized)}
          title={minimized ? 'Expand this panel' : 'Minimize this panel'}
          className="font-pixel"
          style={{ 
            fontSize: 8, 
            color: 'var(--mu,#a493c9)', 
            background: 'transparent', 
            border: '1px solid var(--ln,#3d2668)', 
            borderRadius: 4, 
            padding: '6px 10px', 
            cursor: 'pointer', 
            flex: 'none' 
          }}
        >
          {minimized ? '▶ SHOW' : '▼ HIDE'}
        </button>
      </div>

      {!minimized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Banner: Chia Guardian */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            border: '2px solid var(--ng,#4dffa0)', 
            borderRadius: 8, 
            padding: '12px 16px',
            background: 'rgba(77,255,160,.05)'
          }}>
            <img 
              src={buildChiaUri(chiaStage)} 
              alt="Chia Guardian" 
              style={{ width: 48, height: 60, imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ng,#4dffa0)', letterSpacing: 1 }}>
                ◈ YOUR CHIA GUARDIAN · {chiaPct}% GROWN
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: 'var(--mu,#77b78d)', lineHeight: 1.2 }}>
                {chiaStageLabel} - each teacher-approved deliverable grows it +25%. Bank below; it sprouts once your instructor approves.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
            {/* Left: 3-Day Deliverable Map */}
            <div style={{ flex: '1 1 200px', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#77b78d)', marginBottom: 4 }}>
                {daysToMap.length}-DAY DELIVERABLE MAP
              </div>
              
              {daysToMap.map((dObj: any, idx: number) => {
                const d = dObj.day_number || (idx + 1);
                const isActive = d === day;
                const isBanked = d <= daysComplete;
                const isLocked = d > daysComplete + 1;
                return (
                  <div 
                    key={d} 
                    data-day-tile="true"
                    onClick={() => !isLocked && onChangeDay && onChangeDay(d)}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      border: `2px solid ${isActive ? 'var(--sy,#ffd23f)' : 'var(--ln,#28432f)'}`, 
                      borderRadius: 8, 
                      padding: '14px 14px',
                      background: isActive ? 'rgba(255,210,63,.08)' : 'rgba(0,0,0,.2)',
                      opacity: isLocked ? 0.4 : 1,
                      cursor: isLocked ? 'not-allowed' : (onChangeDay ? 'pointer' : 'default'),
                      transition: 'all 0.15s',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                      <div className="font-pixel" style={{ fontSize: 9, color: isActive ? 'var(--sy,#ffd23f)' : 'var(--tx,#d6ffe0)', lineHeight: 1.3 }}>
                        DAY 0{d}
                      </div>
                      <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: 'var(--mu,#77b78d)', lineHeight: 1.3 }}>
                        {dayTitles[idx]}
                      </div>
                    </div>
                    <div className="font-pixel" style={{ 
                      fontSize: 7, 
                      padding: '4px 8px', 
                      borderRadius: 12,
                      background: isActive ? 'var(--sy,#ffd23f)' : 'transparent',
                      color: isActive ? 'var(--bg,#0e1512)' : 'var(--tx,#d6ffe0)',
                      border: `1px solid ${isActive ? 'var(--sy,#ffd23f)' : 'var(--ln,#28432f)'}`,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}>
                      {isBanked ? '✓ BANKED' : (isActive ? 'ACTIVE' : isLocked ? '🔒 LOCKED' : 'QUEUED')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Validation & Banking */}
            <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: -4 }}>
                ◈ VALIDATE &amp; BANK DAY {day}
              </div>

              {/* Show submitted view if already submitted and not in edit mode */}
              {isAlreadySubmitted && !isEditMode ? (
                <>
                {/* Submitted View */}
                <div style={{ 
                  border: `2px solid ${isApproved ? 'var(--ng,#4dffa0)' : 'var(--sy,#ffd23f)'}`, 
                  borderRadius: 8, 
                  padding: 16, 
                  background: isApproved ? 'rgba(77,255,160,.08)' : 'rgba(255,210,63,.08)' 
                }}>
                  {/* Status Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span className="font-pixel" style={{ fontSize: 10, color: isApproved ? 'var(--ng,#4dffa0)' : 'var(--sy,#ffd23f)' }}>
                      {isApproved ? '✓ APPROVED' : '◷ PENDING APPROVAL'}
                    </span>
                    {isApproved && (
                      <span style={{ fontSize: 14, color: 'var(--mu,#77b78d)', fontFamily: "'VT323', monospace" }}>
                        Synced to Steward Library
                      </span>
                    )}
                  </div>

                  {/* Submitted Title */}
                  {localSubmission?.title && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 6 }}>TITLE</div>
                      <div style={{ fontSize: 18, color: 'var(--tx,#d6ffe0)', fontFamily: "'VT323', monospace", fontWeight: 'bold' }}>
                        {localSubmission.title}
                      </div>
                    </div>
                  )}

                  {/* Submitted Description */}
                  {localSubmission?.description && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 6 }}>DESCRIPTION</div>
                      <div style={{ fontSize: 15, color: 'var(--tx,#d6ffe0)', fontFamily: "'VT323', monospace", lineHeight: 1.4 }}>
                        {localSubmission.description}
                      </div>
                    </div>
                  )}

                  {/* Submitted URL - show thumbnail preview instead of raw link */}
                  {getSubmittedUrl() && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 6 }}>DELIVERABLE</div>
                      <DeliverableMediaPreview
                        url={getSubmittedUrl()}
                        variant="thumbnail"
                        theme="dark"
                        showPreviewButton={true}
                        maxThumbnailSize={48}
                      />
                    </div>
                  )}

                  {/* Review Note (if any) */}
                  {localProgress?.review_note && (
                    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 6, background: 'rgba(255,210,63,.12)', borderLeft: '4px solid var(--sy,#ffd23f)' }}>
                      <div className="font-pixel" style={{ fontSize: 8, color: 'var(--sy,#ffd23f)', marginBottom: 6 }}>▤ TEACHER NOTE:</div>
                      <div style={{ fontSize: 15, color: 'var(--tx,#d6ffe0)', fontFamily: "'VT323', monospace", lineHeight: 1.4 }}>
                        {localProgress.review_note}
                      </div>
                    </div>
                  )}

                  {/* Edit Button - always show so students can update anytime */}
                  <div style={{ marginTop: 16 }}>
                    <button onClick={handleEditClick} className="font-pixel"
                      style={{ fontSize: 9, color: 'var(--pk,#ff5fd2)', background: 'transparent', border: '2px solid var(--pk,#ff5fd2)', borderRadius: 6, padding: '10px 16px', cursor: 'pointer' }}>
                      ✎ EDIT & RESUBMIT
                    </button>
                  </div>
                </div>
                
                {/* Principle shown outside the card */}
                {currentPrincipleName && (
                  <div style={{ marginTop: 4 }}>
                    <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 6 }}>
                      ◈ APPLIED PRINCIPLE
                    </div>
                    <div style={{ 
                      display: 'inline-flex',
                      background: 'rgba(69,214,255,.15)',
                      border: '1px solid var(--cy,#45d6ff)',
                      borderRadius: 4,
                      padding: '6px 12px',
                      color: 'var(--cy,#45d6ff)',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                    }}>
                      {currentPrincipleName}
                    </div>
                  </div>
                )}
                </>
              ) : (
                /* Submission Form */
                <>
                  {isEditMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="font-pixel" style={{ fontSize: 9, color: 'var(--pk,#ff5fd2)' }}>✎ EDITING SUBMISSION</div>
                      <button onClick={handleCancelEdit} className="font-pixel"
                        style={{ fontSize: 8, color: 'var(--mu,#77b78d)', background: 'transparent', border: '1px solid var(--ln,#28432f)', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>
                        CANCEL
                      </button>
                    </div>
                  )}

                  {/* Title Input */}
                  <div>
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--ng,#4dffa0)', marginBottom: 8, letterSpacing: 1 }}>
                      1 · TITLE YOUR DELIVERABLE
                    </div>
                    <input
                      value={submissionTitle}
                      onChange={(e) => setSubmissionTitle(e.target.value)}
                      placeholder="Enter a title for your deliverable..."
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,.4)',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 6,
                        color: 'var(--tx,#d6ffe0)',
                        fontSize: 16,
                        padding: '10px 14px',
                        fontFamily: "'VT323', monospace",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--cy,#45d6ff)', marginBottom: 8, letterSpacing: 1 }}>
                      2 · DESCRIPTION (OPTIONAL)
                    </div>
                    <textarea
                      value={submissionDescription}
                      onChange={(e) => setSubmissionDescription(e.target.value)}
                      placeholder="Describe your deliverable, what you created, and what principle it applies..."
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,.4)',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 6,
                        color: 'var(--tx,#d6ffe0)',
                        fontSize: 15,
                        padding: '10px 14px',
                        fontFamily: "'VT323', monospace",
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* URL Input */}
                  <div>
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--sy,#ffd23f)', marginBottom: 8, letterSpacing: 1 }}>
                      3 · YOUR DELIVERABLE LINK OR FILE
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {submissionUrl.startsWith('blob:') ? (
                        <div style={{
                          flex: 1,
                          background: 'rgba(0,0,0,.4)',
                          border: '2px solid var(--ln,#28432f)',
                          borderRadius: 6,
                          padding: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <img src={submissionUrl} alt="Upload preview" 
                            style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--mu,#77b78d)' }} />
                          <div style={{ flex: 1, color: 'var(--tx,#d6ffe0)', fontSize: 15, fontFamily: "'VT323', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fileToUpload?.name || 'Uploaded Image'}
                          </div>
                          <button onClick={() => { setSubmissionUrl(''); setFileToUpload(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--mu,#77b78d)', cursor: 'pointer', padding: 4 }} title="Remove image">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <input
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="Paste your story asset link (video, audio, image, or doc)"
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,.4)',
                            border: '2px solid var(--ln,#28432f)',
                            borderRadius: 6,
                            color: 'var(--tx,#d6ffe0)',
                            fontSize: 16,
                            padding: '10px 14px',
                            fontFamily: "'VT323', monospace",
                          }}
                        />
                      )}
                      <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
                      <button onClick={() => fileInputRef.current?.click()} className="font-pixel" 
                        style={{ fontSize: 8, background: 'transparent', border: '2px solid var(--cy,#45d6ff)', color: 'var(--cy,#45d6ff)', borderRadius: 6, padding: '0 16px', cursor: 'pointer' }}>
                        ↑ UPLOAD
                      </button>
                    </div>
                  </div>

                  {/* Principle Selection */}
                  <div>
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--pk,#ff5fd2)', marginBottom: 12, letterSpacing: 1 }}>
                      4 · ASSIGN ONE STEWARD PRINCIPLE <span style={{ color: 'var(--mu,#77b78d)', fontSize: 7 }}>(each can only be used once across all days)</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {mappedPrinciples.map((p: any, i) => {
                        const principleId = p.id || p;
                        const principleName = p.name || p.title || p;
                        const isSelected = selectedPrinciple === principleId;
                        const isCurrentDay = principleId === currentDayPrincipleId;
                        const isUsedOtherDay = otherDaysBankedIds.includes(principleId);
                        const isPendingOtherDay = !isUsedOtherDay && pendingOtherDayPrincipleIds.includes(principleId);
                        const isBlocked = isUsedOtherDay || isPendingOtherDay;
                        return (
                          <button
                            key={principleId || i}
                            onClick={() => !isBlocked && setSelectedPrinciple(principleId)}
                            title={
                              isUsedOtherDay ? 'Already approved in another day' :
                              isPendingOtherDay ? 'Pending approval on another day — select a different principle' :
                              isCurrentDay ? 'Currently assigned to this day' :
                              ''
                            }
                            style={{
                              background: isSelected ? 'var(--gold,#ffd23f)' : isCurrentDay ? 'rgba(69,214,255,.15)' : isUsedOtherDay ? 'rgba(0,0,0,.15)' : isPendingOtherDay ? 'rgba(255,160,50,.08)' : 'rgba(0,0,0,.3)',
                              border: `1px solid ${isSelected ? 'var(--gold,#ffd23f)' : isCurrentDay ? 'var(--s,#45d6ff)' : isUsedOtherDay ? 'var(--ln,#3d2668)' : isPendingOtherDay ? '#ffa032' : 'var(--ln,#3d2668)'}`,
                              borderRadius: 4,
                              padding: '6px 12px',
                              color: isSelected ? '#000' : isCurrentDay ? 'var(--s,#45d6ff)' : isUsedOtherDay ? 'var(--ln,#3d2668)' : isPendingOtherDay ? '#ffa032' : 'var(--mu,#a493c9)',
                              fontFamily: "'Press Start 2P', monospace",
                              fontSize: 9,
                              cursor: isBlocked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                              opacity: isUsedOtherDay ? 0.4 : isPendingOtherDay ? 0.7 : 1,
                              textDecoration: isUsedOtherDay ? 'line-through' : 'none',
                              position: 'relative',
                            }}
                          >
                            {principleName}
                            {isPendingOtherDay && (
                              <span style={{ marginLeft: 5, fontSize: 7, color: '#ffa032' }}>⏳PENDING</span>
                            )}
                          </button>
                        )
                      })}
                      {mappedPrinciples.filter((p: any) => !otherDaysBankedIds.includes(p.id || p) && !pendingOtherDayPrincipleIds.includes(p.id || p)).length === 0 && (
                        <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#77b78d)', fontStyle: 'italic' }}>
                          No fresh principles left!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                    <button
                      onClick={handleSubmitDeliverable}
                      disabled={isSubmitting}
                      className="font-pixel"
                      style={{
                        fontSize: 9,
                        color: 'var(--bg,#0e1512)',
                        background: 'var(--sy,#ffd23f)',
                        border: '2px solid var(--sy,#ffd23f)',
                        borderRadius: 6,
                        padding: '12px 18px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? '▲ BANKING...' : '▲ BANK DELIVERABLE'}
                    </button>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: 'var(--mu,#77b78d)' }}>
                      Banking submits your deliverable link + principle to your teacher's console.
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
