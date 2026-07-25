'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PixelSprite, buildIconUri } from '@/components/workshops/journey'
import { DEFAULT_CHARACTER } from './character-data'
import { PATHWAYS, QUIZZES } from '@/data/workforce-content'
import { fetchUserPicks } from '@/app/admin/workforce-pathways/actions'
import { uploadCreationImage } from '@/app/actions/workshops/engagement'
import DeliverableMediaPreview, { isImageUrl } from '@/components/workshops/DeliverableMediaPreview'
import type {
  WorkshopCharacter,
  DayWithSections,
  WorkshopProgress,
  WorkshopProgressPrinciple,
  WorkshopEngagement,
} from '@/types/workshops'

/* ── Props ── */
interface PortfolioProps {
  character: WorkshopCharacter
  days: DayWithSections[]
  progressRows: WorkshopProgress[]
  bankedPrinciples: WorkshopProgressPrinciple[]
  engagements: WorkshopEngagement[]
  submissions?: any[]
  onAddEngagement: (kind: string, title: string, source: string, url?: string) => void
  onRemoveEngagement: (id: string) => void
  onUpdateEngagement?: (id: string, updates: { title?: string, content?: string, url?: string }) => void
  // Certificate data
  cohortId: string
  cohortName: string
  userId?: string
}

/* ── Helpers ── */
const ENGPCT: Record<string, number> = { bookmark: 1, note: 1, generation: 2, prompt: 3 }

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  not_submitted: { label: 'NOT SUBMITTED', color: '#a493c9' },
  submitted:     { label: 'PENDING REVIEW', color: '#ffd23f' },
  approved:      { label: 'APPROVED · +25%', color: '#74f0a0' },
  rejected:      { label: 'NEEDS REVISION', color: '#ff8a4a' },
}

const SHELF_COLS: { kind: string; icon: string; label: string; color: string }[] = [
  { kind: 'bookmark', icon: '☆', label: 'BOOKMARKS', color: 'var(--s,#45d6ff)' },
  { kind: 'note',     icon: '✎', label: 'NOTES',     color: 'var(--gold,#ffd23f)' },
  { kind: 'prompt',   icon: '⌘', label: 'SAVED PROMPTS', color: 'var(--p,#ff5fd2)' },
]

const ASSET_GRADIENTS: Record<string, string> = {
  generation: 'linear-gradient(135deg,#45d6ff 0%,#74f0a0 100%)',
  default:    'linear-gradient(135deg,#b06bff 0%,#ff5fd2 100%)',
}

function chiaRects(stage: number) {
  const gL='#daba4e',gM='#c19a33',gD='#9c7a28',eye='#3a2c14',bD='#1c150f',bM='#33281b',gr='#5fa83c',gr2='#8fd85f',fp='#ff5fd2',fy='#ffd23f',fv='#b06bff';
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

function buildChiaUri(stage: number, accent: string) {
  const rects = chiaRects(stage);
  const body = rects.map(a => `<rect x='${a[0]}' y='${a[1]}' width='${a[2]}' height='${a[3]}' fill='${a[4]==='A'?accent:a[4]}'/>`).join('');
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'>${body}</svg>`);
}

export default function Portfolio({
  character,
  days,
  progressRows,
  bankedPrinciples,
  engagements,
  submissions = [],
  onAddEngagement,
  onRemoveEngagement,
  onUpdateEngagement,
  cohortId,
  cohortName,
  userId,
}: PortfolioProps) {
  /* ── Clerk user for workforce picks ── */
  const { user } = useUser()
  
  /* ── Local input state ── */
  const [bookmarkInput, setBookmarkInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [promptInput, setPromptInput] = useState('')

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ title: '', content: '', url: '' })
  const [assetInput, setAssetInput] = useState('')
  const [assetFileToUpload, setAssetFileToUpload] = useState<File | null>(null)
  const [isUploadingAsset, setIsUploadingAsset] = useState(false)
  const assetFileInputRef = useRef<HTMLInputElement>(null)
  const [bookmarkFileToUpload, setBookmarkFileToUpload] = useState<File | null>(null)
  const [isUploadingBookmark, setIsUploadingBookmark] = useState(false)
  const bookmarkFileInputRef = useRef<HTMLInputElement>(null)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  // Workforce Pathway Picks State
  const [workforcePicks, setWorkforcePicks] = useState<any[]>([])
  const [loadingWorkforcePicks, setLoadingWorkforcePicks] = useState(false)

  // Certificate State
  const [showCertPreview, setShowCertPreview] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [certSettings, setCertSettings] = useState({
    certOrg: 'StewardWorks',
    certFacilitator: 'Marisol Vega',
    certFacTitle: 'Program Director',
    certSponsor: 'Dr. Jane Smith',
    certSponsorOrg: 'SDSU Research Foundation',
    certMessage: ''
  })

  // Load workforce pathway picks - uses Clerk user.id
  const loadWorkforcePicks = useCallback(async () => {
    if (!user?.id) return
    setLoadingWorkforcePicks(true)
    try {
      const picks = await fetchUserPicks(user.id)
      setWorkforcePicks(picks || [])
    } catch (error) {
      console.error('Failed to load workforce picks:', error)
    } finally {
      setLoadingWorkforcePicks(false)
    }
  }, [user?.id])

  // Load certificate settings
  const loadCertSettings = useCallback(async () => {
    if (!cohortId) return
    try {
      const response = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
      if (response.ok) {
        const settings = await response.json()
        setCertSettings({
          certOrg: settings.certOrg || 'StewardWorks',
          certFacilitator: settings.certFacilitator || 'Marisol Vega',
          certFacTitle: settings.certFacTitle || 'Program Director',
          certSponsor: settings.certSponsor || 'Dr. Jane Smith',
          certSponsorOrg: settings.certSponsorOrg || 'SDSU Research Foundation',
          certMessage: settings.certMessage || ''
        })
      }
    } catch (e) {
      console.error('Failed to fetch certificate settings:', e)
    }
  }, [cohortId])

  useEffect(() => {
    loadWorkforcePicks()
    loadCertSettings()
  }, [loadWorkforcePicks, loadCertSettings])

  // Helper to get user's answer label for a pick
  const getAnswerLabel = (pick: any, pathwayId: string, stopId: string) => {
    if (pick.custom_answer) return pick.custom_answer
    if (pick.option_id) {
      const quizData = (QUIZZES as any)[pathwayId]?.[stopId]
      if (quizData?.options) {
        const option = quizData.options.find((o: any) => o.id === pick.option_id)
        return option?.label || pick.option_id
      }
    }
    return 'No answer'
  }

  const inputState: Record<string, { value: string; set: (v: string) => void }> = {
    bookmark: { value: bookmarkInput, set: setBookmarkInput },
    note:     { value: noteInput,     set: setNoteInput },
    prompt:   { value: promptInput,   set: setPromptInput },
  }



  const viewingItem = engagements.find(e => e.id === viewingId)
  const editingItem = engagements.find(e => e.id === editingId)

  const handleStartEdit = (id: string) => {
    console.log('[Portfolio] handleStartEdit called with id:', id)
    const item = engagements.find(e => e.id === id)
    console.log('[Portfolio] Found item:', item)
    if (item) {
      const draft = { title: item.title, content: item.content || item.title, url: item.url || '' }
      console.log('[Portfolio] Setting edit draft:', draft)
      setEditDraft(draft)
      setEditingId(id)
      setViewingId(null)
    }
  }

  const handleSaveEdit = async (e?: React.FormEvent) => {
    console.log('[Portfolio] handleSaveEdit CALLED')
    console.log('[Portfolio] Event:', e)
    console.log('[Portfolio] editingId:', editingId)
    console.log('[Portfolio] editDraft:', editDraft)
    console.log('[Portfolio] onUpdateEngagement exists:', !!onUpdateEngagement)
    
    e?.preventDefault() // Prevent form submission if called from form
    
    if (!editingId) {
      console.error('[Portfolio] No editingId - aborting save')
      return
    }
    
    if (!onUpdateEngagement) {
      console.error('[Portfolio] No onUpdateEngagement handler - aborting save')
      return
    }
    
    try {
      console.log('[Portfolio] Calling onUpdateEngagement with:', {
        id: editingId,
        updates: {
          title: editDraft.title || editDraft.content.slice(0, 50),
          content: editDraft.content,
          url: editDraft.url,
        }
      })
      
      const result = await onUpdateEngagement(editingId, {
        title: editDraft.title || editDraft.content.slice(0, 50),
        content: editDraft.content,
        url: editDraft.url,
      })
      
      console.log('[Portfolio] onUpdateEngagement returned:', result)
      console.log('[Portfolio] Closing edit modal')
      setEditingId(null)
    } catch (e) {
      console.error('[Portfolio] Save edit failed:', e)
      throw e
    }
  }

  /* ── Chia growth calculations ── */
  const apprDeliv = progressRows.filter(p => p.deliverable_status === 'approved').length
  const delivPct = Math.min(apprDeliv * 25, 75)
  const engPct = Math.min(
    engagements
      .filter(e => e.status === 'approved')
      .reduce((a, e) => a + (ENGPCT[e.kind] || 0), 0),
    25,
  )
  const chiaPct = Math.min(delivPct + engPct, 100)
  const stageNum =
    chiaPct >= 100
      ? 5
      : chiaPct >= 75
        ? 4
        : chiaPct >= 50
          ? 3
          : chiaPct >= 25
            ? 2
            : chiaPct > 0
              ? 1
              : 0

  const stage = ['Bare bud', 'Sprouting', 'Filling in', 'Leafy crown', 'Lush mane', 'Full bloom 🌸'][stageNum] || 'Bare bud'

  const deskChiaUri = useMemo(() => buildChiaUri(stageNum, character.accent_color || '#ff5fd2'), [stageNum, character.accent_color])

  /* ── Engagement stats ── */
  const approvedCount = engagements.filter(e => e.status === 'approved').length
  const pendingCount = engagements.filter(e => e.status === 'pending').length

  /* ── Engagement items per kind ── */
  const engByKind = useMemo(() => {
    const map: Record<string, WorkshopEngagement[]> = { bookmark: [], note: [], prompt: [], generation: [] }
    engagements.forEach(e => {
      if (map[e.kind]) map[e.kind].push(e)
      else map[e.kind] = [e]
    })
    return map
  }, [engagements])

  /* ── Progress per day ── */
  const progressByDay = useMemo(() => {
    const map: Record<string, WorkshopProgress> = {}
    progressRows.forEach(p => { map[p.workshop_day_id] = p })
    return map
  }, [progressRows])

  /* ── Handler helpers ── */
  function handleAddShelf(kind: string) {
    const st = inputState[kind]
    if (!st || !st.value.trim() && !bookmarkFileToUpload) return
    if (kind === 'bookmark' && bookmarkFileToUpload) {
      // Handle file upload for bookmark
      setIsUploadingBookmark(true)
      const formData = new FormData()
      formData.append('file', bookmarkFileToUpload)
      uploadCreationImage(formData)
        .then((publicUrl) => {
          onAddEngagement('bookmark', bookmarkFileToUpload!.name, 'upload', publicUrl)
          setBookmarkFileToUpload(null)
          if (st) st.set('')
        })
        .catch(err => console.error('Bookmark upload failed:', err))
        .finally(() => setIsUploadingBookmark(false))
      return
    }
    if (!st || !st.value.trim()) return
    onAddEngagement(kind, st.value.trim(), 'manual')
    st.set('')
  }

  function handleBookmarkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBookmarkFileToUpload(file)
    const st = inputState['bookmark']
    if (st) st.set(file.name)
    if (bookmarkFileInputRef.current) bookmarkFileInputRef.current.value = ''
  }

  function handleAddAsset() {
    if (!assetInput.trim() && !assetFileToUpload) return
    
    if (assetFileToUpload) {
      // Handle file upload
      setIsUploadingAsset(true)
      const formData = new FormData()
      formData.append('file', assetFileToUpload)
      uploadCreationImage(formData)
        .then((publicUrl) => {
          onAddEngagement('generation', assetFileToUpload.name, 'upload', publicUrl)
          setAssetFileToUpload(null)
          setAssetInput('')
        })
        .catch((err) => {
          console.error('Failed to upload asset:', err)
        })
        .finally(() => {
          setIsUploadingAsset(false)
        })
    } else {
      onAddEngagement('generation', assetInput.trim(), 'link', assetInput.trim())
      setAssetInput('')
    }
  }

  function handleAssetFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/', 'video/', 'audio/']
    if (!validTypes.some(t => file.type.startsWith(t))) {
      alert('Please upload an image, video, or audio file.')
      return
    }
    setAssetFileToUpload(file)
    setAssetInput(URL.createObjectURL(file))
    if (assetFileInputRef.current) assetFileInputRef.current.value = ''
  }

  /* ── Status badge color helper ── */
  function statusBadgeColor(status: string): string {
    if (status === 'approved') return '#74f0a0'
    if (status === 'rejected') return '#ff8a4a'
    return '#ffd23f'
  }

  /* ===== RENDER ===== */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px,3vw,30px) clamp(12px,3vw,24px)' }}>

      {/* ── Section A: Chia Guardian Header ── */}
      <div
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          padding: 'clamp(16px,2.5vw,24px)',
          background: 'linear-gradient(180deg,rgba(116,240,160,.08),var(--pn,#241542))',
          boxShadow: '0 0 26px rgba(116,240,160,.1)',
          display: 'flex',
          gap: 'clamp(14px,2vw,24px)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Chia sprite */}
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <img 
            src={deskChiaUri} 
            alt="" 
            width={120} 
            height={150} 
            style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.4))' }} 
          />
        </div>
        {/* Right side info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            className="font-pixel"
            style={{ fontSize: 12, color: 'var(--ok,#74f0a0)', letterSpacing: 1, marginBottom: 4 }}
          >
            ❀ MY CHIA GUARDIAN
          </div>
          <div
            className="font-pixel"
            style={{ fontSize: 'clamp(20px,2.5vw,28px)', color: '#fff', marginBottom: 6 }}
          >
            {chiaPct}% GROWN
          </div>
          <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
            Stage: {stage}
          </div>

          {/* Stacked bar */}
          <div
            style={{
              height: 20,
              borderRadius: 20,
              background: '#1a0e2e',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${delivPct}%`,
                height: '100%',
                background: '#74f0a0',
                transition: 'width .4s ease',
              }}
            />
            <div
              style={{
                width: `${engPct}%`,
                height: '100%',
                background: '#45d6ff',
                transition: 'width .4s ease',
              }}
            />
          </div>

          {/* Legend */}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 18, color: '#74f0a0' }}>
              <span style={{ marginRight: 6 }}>■</span>
              Deliverables {delivPct}% / 75%
            </div>
            <div style={{ fontSize: 18, color: '#45d6ff' }}>
              <span style={{ marginRight: 6 }}>■</span>
              Engagement {engPct}% / 25%
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: My Deliverables ── */}
      <div
        style={{
          border: '2px solid var(--gold,#ffd23f)',
          borderRadius: 12,
          background: 'rgba(255,210,63,.04)',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div
          className="font-pixel"
          style={{ fontSize: 14, color: 'var(--gold,#ffd23f)', marginBottom: 14 }}
        >
          ⛃ MY DELIVERABLES
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
          }}
        >
          {[1, 2, 3].map(dayNum => {
            const day = days.find(d => d.day_number === dayNum)
            const prog = day ? progressByDay[day.id] : null
            const status = prog?.deliverable_status || 'not_submitted'
            const pill = STATUS_PILL[status] || STATUS_PILL.not_submitted

            return (
              <div
                key={dayNum}
                style={{
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 8,
                  padding: 14,
                  background: 'var(--pn,#241542)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Small Chia icon */}
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={deskChiaUri} 
                    alt="" 
                    width={40} 
                    height={50} 
                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.4))' }} 
                  />
                </div>
                <div
                  className="font-pixel"
                  style={{ fontSize: 12, color: 'var(--gold,#ffd23f)' }}
                >
                  DAY 0{dayNum}
                </div>
                <div style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>
                  {day?.title || `Day ${dayNum}`}
                </div>
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 10,
                    color: pill.color,
                    background: `${pill.color}18`,
                    padding: '4px 10px',
                    borderRadius: 20,
                    marginTop: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pill.label}
                </div>

                <div style={{ width: '100%', borderTop: '1px dashed var(--ln,#3d2668)', paddingTop: 9, marginTop: 2 }}>
                  <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                    ✦ DELIVERABLE
                  </div>
                  {(() => {
                    // Get all submissions for this day, pick the latest one with a URL
                    const allDaySubs = submissions.filter((s: any) => s.workshop_day_id === day?.id);
                    // Try to find one with a URL first
                    const subWithUrl = allDaySubs.find((s: any) => s.submission_text || s.external_video_url || s.file_storage_path);
                    const submission = subWithUrl || allDaySubs[0] || null;
                    
                    let rawLink = '';
                    if (submission) {
                      rawLink = submission.external_video_url || submission.submission_text || submission.file_storage_path || '';
                      rawLink = rawLink.replace(/^\[SHOWCASE_REQUESTED\]\s*/, '').trim();
                    }
                    
                    if (rawLink && rawLink.length > 5) {
                      return (
                        <div>
                          <DeliverableMediaPreview
                            url={rawLink}
                            variant="thumbnail"
                            theme="dark"
                            showPreviewButton={true}
                            maxThumbnailSize={40}
                          />
                          {submission?.title && submission.title !== rawLink && (
                            <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {submission.title}
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Show title or placeholder
                    if (submission?.title) {
                      return (
                        <div style={{ fontSize: 13, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {submission.title}
                        </div>
                      );
                    }
                    return (
                      <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', opacity: 0.7 }}>
                        — no link banked yet —
                      </div>
                    );
                  })()}
                </div>

                {prog?.review_note && (
                  <div style={{ width: '100%', borderTop: '1px dashed var(--ln,#3d2668)', paddingTop: 9, marginTop: 9 }}>
                    <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                      ✦ INSTRUCTOR NOTE
                    </div>
                    <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordWrap: 'break-word' }}>
                      {prog.review_note}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section C: My Engagement ── */}
      <div
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          background: 'linear-gradient(180deg,rgba(116,240,160,.05),var(--pn,#241542))',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div
            className="font-pixel"
            style={{ fontSize: 14, color: 'var(--ok,#74f0a0)' }}
          >
            ✦ MY ENGAGEMENT
          </div>
          <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
            {approvedCount} approved · {pendingCount} pending · {engPct}%/25%
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)', marginTop: 6 }}>
          Add items to grow your Chia Guardian. Bookmark +1% · Note +1% · Prompt +3% · Asset +2%
        </div>

        {/* Engagement progress bar */}
        <div
          style={{
            height: 12,
            borderRadius: 20,
            background: '#1a0e2e',
            marginTop: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min((engPct / 25) * 100, 100)}%`,
              height: '100%',
              borderRadius: 20,
              background: 'linear-gradient(90deg,var(--ok,#74f0a0),var(--s,#45d6ff))',
              transition: 'width .4s ease',
            }}
          />
        </div>

        {/* ── Section C.1: Shelf Columns ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {SHELF_COLS.map(col => {
            const items = engByKind[col.kind] || []
            const st = inputState[col.kind]
            return (
              <div
                key={col.kind}
                style={{
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderBottom: '2px solid var(--ln,#3d2668)' }}>
                  <span className="font-pixel" style={{ fontSize: 16, color: col.color, flex: 'none' }}>{col.icon}</span>
                  <div className="font-pixel" style={{ flex: 1, minWidth: 0, fontSize: 12, color: col.color, letterSpacing: 0.5 }}>
                    {col.label}
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
                    {items.length}
                  </span>
                </div>

                {/* Input row */}
                <div style={{ padding: '11px 12px', display: 'flex', gap: 7 }}>
                  <input
                    type="text"
                    value={st?.value || ''}
                    onChange={e => st?.set(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddShelf(col.kind) }}
                    placeholder={col.kind === 'bookmark' ? 'Paste a Library / Workforce / Showcase link' : col.kind === 'note' ? 'Jot a note or reflection' : 'Paste a prompt worth keeping'}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: 'rgba(0,0,0,.4)',
                      border: '2px solid var(--ln,#3d2668)',
                      borderRadius: 5,
                      color: 'var(--tx,#efe6ff)',
                      fontSize: 16,
                      padding: '11px 12px',
                      outline: 'none',
                    }}
                  />
                  {col.kind === 'bookmark' && (
                    <>
                      <input type="file" accept="image/*,video/*,audio/*" hidden ref={bookmarkFileInputRef} onChange={handleBookmarkFileChange} />
                      <button
                        onClick={() => bookmarkFileInputRef.current?.click()}
                        disabled={isUploadingBookmark}
                        title="Upload file"
                        className="font-pixel"
                        style={{
                          fontSize: 10,
                          color: 'var(--s,#45d6ff)',
                          background: 'transparent',
                          border: '2px solid var(--s,#45d6ff)',
                          borderRadius: 5,
                          padding: '0 10px',
                          cursor: isUploadingBookmark ? 'wait' : 'pointer',
                          flex: 'none',
                          opacity: isUploadingBookmark ? 0.5 : 1,
                        }}
                      >
                        ↑
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleAddShelf(col.kind)}
                    title={`Add to ${col.label.toLowerCase()}`}
                    className="font-pixel"
                    style={{
                      fontSize: 14,
                      color: '#12081e',
                      background: col.color,
                      border: 'none',
                      borderRadius: 5,
                      padding: '0 15px',
                      cursor: 'pointer',
                      flex: 'none',
                    }}
                  >
                    ＋
                  </button>
                </div>

                {/* Scrollable items list */}
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 240, overflowY: 'auto' }}>
                  {items.length === 0 && (
                    <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', textAlign: 'center', padding: '9px 0' }}>
                      No {col.label.toLowerCase()} yet
                    </div>
                  )}
                  {items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--ln,#3d2668)',
                        borderRadius: 7,
                        background: 'rgba(0,0,0,.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px' }}>
                        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                          <div
                            style={{
                              fontSize: 18,
                              color: 'var(--tx,#efe6ff)',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.title}
                          </div>
                          <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 2 }}>
                            {item.source || 'My Shelf'} · {item.status === 'approved' ? `✓ +${ENGPCT[col.kind] || 1}%` : item.status === 'rejected' ? '↩ returned' : '🕒 pending'}
                          </div>
                        </div>
                        {item.review_note && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === item.id ? null : item.id); }}
                            title={expandedNoteId === item.id ? "Hide admin note" : "Show admin note"}
                            className="font-pixel"
                            style={{
                              flex: 'none',
                              background: expandedNoteId === item.id ? 'var(--gold,#ffd23f)' : 'rgba(255,210,63,.2)',
                              border: '1px solid var(--gold,#ffd23f)',
                              color: expandedNoteId === item.id ? '#12081e' : 'var(--gold,#ffd23f)',
                              fontSize: 9,
                              cursor: 'pointer',
                              lineHeight: 1,
                              padding: '5px 8px',
                              borderRadius: 3,
                              letterSpacing: 0.5,
                            }}
                          >
                            {expandedNoteId === item.id ? '✕ NOTE' : '📝 NOTE'}
                          </button>
                        )}
                        <button
                          onClick={() => setViewingId(item.id)}
                          title="Open this item"
                          style={{
                            flex: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'var(--s,#45d6ff)',
                            fontSize: 14,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ⤢
                        </button>
                        <button
                          onClick={() => {
                            console.log('[Portfolio] Edit button clicked for item:', item.id)
                            console.log('[Portfolio] Item data:', item)
                            handleStartEdit(item.id)
                          }}
                          title="Edit"
                          style={{
                            flex: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'var(--gold,#ffd23f)',
                            fontSize: 13,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onRemoveEngagement(item.id)}
                          title="Remove"
                          style={{
                            flex: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'var(--mu,#a493c9)',
                            fontSize: 14,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {expandedNoteId === item.id && item.review_note && (
                        <div style={{ padding: '8px 9px', borderTop: '1px dashed var(--ln,#3d2668)', background: 'rgba(255,210,63,.08)' }}>
                          <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', letterSpacing: 0.5, marginBottom: 5 }}>
                            ADMIN NOTE
                          </div>
                          <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {item.review_note}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Section C.2: Saved Assets ── */}
        <div
          style={{
            border: '2px solid var(--ok,#74f0a0)',
            borderRadius: 10,
            background: 'linear-gradient(180deg,rgba(116,240,160,.07),rgba(0,0,0,.15))',
            padding: 'clamp(12px,2vw,18px)',
            marginTop: 16,
          }}
        >
          <div
            className="font-pixel"
            style={{ fontSize: 12, color: 'var(--ok,#74f0a0)', marginBottom: 6 }}
          >
            ◉ SAVED ASSETS
          </div>
          <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
            Paste a link to an AI-generated image, audio clip, or video to save it here.
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {assetInput.startsWith('blob:') ? (
              <div style={{
                flex: 1,
                background: '#1a0e2e',
                border: '1px solid var(--ln,#3d2668)',
                borderRadius: 6,
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                {assetFileToUpload?.type.startsWith('image/') ? (
                  <img 
                    src={assetInput} 
                    alt="Upload preview" 
                    style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ln,#3d2668)' }} 
                  />
                ) : assetFileToUpload?.type.startsWith('video/') ? (
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🎬</span>
                ) : (
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🎵</span>
                )}
                <div style={{ flex: 1, color: 'var(--tx,#efe6ff)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {assetFileToUpload?.name || 'Uploaded File'}
                </div>
                <button
                  onClick={() => { setAssetInput(''); setAssetFileToUpload(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', padding: 4, fontSize: 14 }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={assetInput}
                onChange={e => setAssetInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddAsset() }}
                placeholder="Paste link…"
                style={{
                  flex: 1,
                  background: '#1a0e2e',
                  border: '1px solid var(--ln,#3d2668)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--tx,#efe6ff)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            )}
            <input type="file" accept="image/*,video/*,audio/*" hidden ref={assetFileInputRef} onChange={handleAssetFileChange} />
            <button
              onClick={() => assetFileInputRef.current?.click()}
              disabled={isUploadingAsset}
              className="font-pixel"
              style={{
                background: 'transparent',
                border: '2px solid var(--s,#45d6ff)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'var(--s,#45d6ff)',
                fontSize: 11,
                cursor: isUploadingAsset ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ↑ UPLOAD
            </button>
            <button
              onClick={handleAddAsset}
              disabled={isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)}
              className="font-pixel"
              style={{
                background: 'var(--ok,#74f0a0)',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                color: '#12081e',
                fontSize: 9,
                cursor: (isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                opacity: (isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)) ? 0.5 : 1,
              }}
            >
              {isUploadingAsset ? '⏳' : '＋ SAVE'}
            </button>
          </div>

          {/* Asset cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
              gap: 11,
            }}
          >
            {(engByKind.generation || []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', padding: 12 }}>
                No saved assets yet
              </div>
            )}
            {(engByKind.generation || []).map(asset => {
              const grad = ASSET_GRADIENTS.generation
              // Derive a simple type tag from the URL or default
              const typeTag = asset.url?.match(/\.(mp4|webm|mov)/i)
                ? 'VIDEO'
                : asset.url?.match(/\.(mp3|wav|ogg)/i)
                  ? 'AUDIO'
                  : 'IMAGE'

              return (
                <div
                  key={asset.id}
                  style={{
                    border: '2px solid var(--ln,#3d2668)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'var(--pn,#241542)',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewingId(asset.id)}
                  title="Click to view asset"
                >
                  {/* Thumbnail - show media preview based on type */}
                  {asset.url && isImageUrl(asset.url) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,.3)' }}>
                      <img
                        src={asset.url}
                        alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.style.background = grad; }}
                      />
                    </div>
                  ) : asset.url && (asset.url.includes('youtube.com') || asset.url.includes('youtu.be')) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: '#000' }}>
                      <img
                        src={`https://img.youtube.com/vi/${asset.url.includes('youtu.be/') ? asset.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(asset.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
                        alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.style.background = grad; }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                    </div>
                  ) : asset.url && asset.url.match(/\.(mp3|wav|ogg|aac|flac)/i) ? (
                    <div style={{ height: 70, background: 'linear-gradient(135deg, #1a0e2e, #3d2668)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 28 }}>🎵</span>
                    </div>
                  ) : asset.url && asset.url.match(/\.(mp4|webm|mov|avi)/i) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: '#000' }}>
                      <video
                        src={asset.url}
                        preload="metadata"
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 70, background: grad }} />
                  )}
                  {/* Type tag badge */}
                  <span
                    className="font-pixel"
                    style={{
                      position: 'absolute',
                      top: 52,
                      right: 6,
                      fontSize: 7,
                      color: '#12081e',
                      background: 'var(--ok,#74f0a0)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {typeTag}
                  </span>
                  {/* Label + status badge + remove */}
                  <div style={{ padding: '8px 8px 6px' }}>
                    <div
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: 'var(--tx,#efe6ff)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {asset.title}
                    </div>
                    
                    {/* Status badge showing approval status and percentage */}
                    <div style={{ marginTop: 7 }}>
                      <span
                        className="font-pixel"
                        style={{
                          fontSize: 6,
                          color: asset.status === 'approved' ? '#12081e' : '#ffd23f',
                          background: asset.status === 'approved' ? '#74f0a0' : 'transparent',
                          border: `1px solid ${asset.status === 'approved' ? '#74f0a0' : '#ffd23f'}`,
                          borderRadius: 20,
                          padding: '3px 7px',
                        }}
                      >
                        {asset.status === 'approved' ? '+2% ✓' : 'PENDING'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveEngagement(asset.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--mu,#a493c9)',
                        fontSize: 12,
                        cursor: 'pointer',
                        padding: '2px 0',
                        marginTop: 4,
                        lineHeight: 1,
                      }}
                      aria-label="Remove asset"
                    >
                      ✕ remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Modals for Viewing and Editing */}
      {viewingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingId(null)}>
          <div style={{ background: '#12081e', border: '2px solid var(--s,#45d6ff)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--s,#45d6ff)' }}>
                VIEW {viewingItem.kind.toUpperCase()}
              </div>
              <button onClick={() => setViewingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            
            <div style={{ fontSize: 22, color: 'var(--tx,#efe6ff)', marginBottom: 14, wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 600 }}>{viewingItem.title}</div>
            
            {/* Status */}
            <div style={{ fontSize: 17, color: viewingItem.status === 'approved' ? 'var(--ok,#74f0a0)' : 'var(--gold,#ffd23f)', marginBottom: 18 }}>
              {viewingItem.status === 'approved' ? '✓ Approved · counts toward your Chia' : viewingItem.status === 'pending' ? '◔ Pending instructor approval' : viewingItem.status}
            </div>

            {/* Review Note */}
            {viewingItem.review_note && (
              <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 6, background: 'rgba(255,210,63,.12)', borderLeft: '4px solid var(--gold,#ffd23f)' }}>
                <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>
                  ▤ TEACHER NOTE:
                </div>
                <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                  {viewingItem.review_note}
                </div>
              </div>
            )}
            
            {/* For generation/assets and bookmarks: show preview if URL is media */}
            {viewingItem.url && (
              <div style={{ marginBottom: 18 }}>
                {isImageUrl(viewingItem.url) ? (
                  <img 
                    src={viewingItem.url} 
                    alt={viewingItem.title} 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      maxHeight: 300,
                      objectFit: 'contain', 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10,
                      background: 'rgba(0,0,0,.3)'
                    }} 
                  />
                ) : viewingItem.url.match(/\.(mp4|webm|mov)/i) || (viewingItem.url.includes('supabase') && viewingItem.url.match(/\.(mp4|webm|mov)/i)) ? (
                  <video 
                    src={viewingItem.url} 
                    controls 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      maxHeight: 280, 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10 
                    }} 
                  />
                ) : viewingItem.url.match(/\.(mp3|wav|ogg|aac|flac|m4a)/i) ? (
                  <audio 
                    src={viewingItem.url} 
                    controls 
                    style={{ width: '100%', marginBottom: 10 }} 
                  />
                ) : (viewingItem.url.includes('youtube.com') || viewingItem.url.includes('youtu.be')) ? (
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--ln,#3d2668)', marginBottom: 10 }}>
                    <img 
                      src={`https://img.youtube.com/vi/${viewingItem.url.includes('youtu.be/') ? viewingItem.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(viewingItem.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
                      alt="YouTube"
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 22, color: '#fff', marginLeft: 4 }}>▶</span>
                      </div>
                    </div>
                  </div>
                ) : viewingItem.kind === 'generation' ? (
                  <div style={{ 
                    width: '100%', 
                    height: 120, 
                    background: 'linear-gradient(135deg,#45d6ff 0%,#74f0a0 100%)', 
                    borderRadius: 8, 
                    border: '2px solid var(--ln,#3d2668)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="font-pixel" style={{ fontSize: 13, color: '#12081e' }}>ASSET</span>
                  </div>
                ) : null}
                {viewingItem.kind === 'generation' && (
                  <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)' }}>
                    ◉ {viewingItem.url.match(/\.(mp4|webm|mov)/i) ? 'VIDEO' : viewingItem.url.match(/\.(mp3|wav|ogg)/i) ? 'AUDIO' : 'IMAGE'} asset · generated in your workshop tools
                  </div>
                )}
              </div>
            )}
            
            {/* For notes and prompts: show content */}
            {viewingItem.content && viewingItem.content !== viewingItem.title && viewingItem.kind !== 'generation' && (
              <div style={{ fontSize: 17, color: 'var(--mu,#a493c9)', marginBottom: 18, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{viewingItem.content}</div>
            )}
            
            {/* For bookmarks or any item with URL: show clickable link */}
            {((viewingItem.kind === 'bookmark' && viewingItem.title.startsWith('http')) || viewingItem.url) && (
              <a 
                href={viewingItem.url || viewingItem.title} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  textDecoration: 'none', 
                  border: '2px solid var(--s,#45d6ff)', 
                  borderRadius: 8, 
                  padding: '14px 16px', 
                  background: 'rgba(255,255,255,0.03)',
                  marginTop: 18
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: 'var(--tx,#efe6ff)', wordBreak: 'break-all', overflowWrap: 'break-word', lineHeight: 1.4 }}>
                    {viewingItem.url || viewingItem.title}
                  </div>
                </div>
                <span className="font-pixel" style={{ fontSize: 12, color: '#12081e', background: 'var(--s,#45d6ff)', borderRadius: 5, padding: '10px 14px', flexShrink: 0 }}>
                  OPEN ↗
                </span>
              </a>
            )}
            
            <div style={{ marginTop: 26, fontSize: 15, color: 'var(--mu,#a493c9)' }}>
              Source: {viewingItem.source || 'My Shelf'} · Status: {viewingItem.status}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingId(null)}>
          <div style={{ background: '#12081e', border: '2px solid var(--gold,#ffd23f)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold,#ffd23f)' }}>
                EDIT {editingItem.kind.toUpperCase()}
              </div>
              <button type="button" onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            
            <label style={{ display: 'block', marginBottom: 18 }}>
              <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 8 }}>Title / Link</div>
              <input 
                value={editDraft.title}
                onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && editingItem.kind === 'bookmark') handleSaveEdit(e as any) }}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '12px 14px', borderRadius: 6, fontSize: 17 }}
              />
            </label>

            {editingItem.kind !== 'bookmark' && (
              <label style={{ display: 'block', marginBottom: 24 }}>
                <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 8 }}>Notes / Content</div>
                <textarea 
                  value={editDraft.content}
                  onChange={e => setEditDraft(prev => ({ ...prev, content: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '12px 14px', borderRadius: 6, fontSize: 17, minHeight: 120, resize: 'vertical' }}
                />
              </label>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 14 }}>
              <button 
                type="button" 
                onClick={() => {
                  console.log('[Portfolio Modal] CANCEL button clicked')
                  setEditingId(null)
                }} 
                style={{ background: 'transparent', border: '1px solid var(--mu,#a493c9)', color: 'var(--mu,#a493c9)', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }} 
                className="font-pixel"
              >
                CANCEL
              </button>
              <button 
                type="button" 
                onClick={(e) => {
                  console.log('[Portfolio Modal] SAVE CHANGES button clicked')
                  console.log('[Portfolio Modal] Button event:', e)
                  console.log('[Portfolio Modal] editingId at click time:', editingId)
                  console.log('[Portfolio Modal] editDraft at click time:', editDraft)
                  handleSaveEdit(e)
                }} 
                style={{ background: 'var(--gold,#ffd23f)', border: 'none', color: '#12081e', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }} 
                className="font-pixel"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section D: Your Pathway Answers ── */}
      <div
        style={{
          border: '2px solid var(--gold,#ffd23f)',
          borderRadius: 12,
          background: 'rgba(255,210,63,.04)',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)' }}>
            ⛰ YOUR PATHWAY ANSWERS
          </div>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>{workforcePicks.length}</span>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>from Workforce Pathways</span>
        </div>

        {loadingWorkforcePicks ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu,#a493c9)' }}>Loading your pathway answers...</div>
        ) : workforcePicks.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--mu,#a493c9)', background: 'rgba(0,0,0,.2)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 12 }}>
            No pathway answers yet. Complete your journey in{' '}
            <Link href="/hub/workforce-pathways" style={{ color: 'var(--s,#45d6ff)', textDecoration: 'underline' }}>Workforce Pathways</Link>!
          </div>
        ) : (
          <div>
            {PATHWAYS.map((pathway: any) => {
              const pathwayPicks = workforcePicks.filter((p: any) => p.pathway_id === pathway.id)
              if (pathwayPicks.length === 0) return null
              
              const pathwayColor = pathway.id === 'creator' ? '#ff6a2e' : '#43e97b'
              
              return (
                <div key={pathway.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', background: `${pathwayColor}15`, borderLeft: `4px solid ${pathwayColor}`, borderRadius: '0 8px 8px 0' }}>
                    <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 1, color: pathwayColor, fontWeight: 700 }}>{pathway.name.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)' }}>· {pathwayPicks.length} answers</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {pathway.stops.map((stop: any) => {
                      const pick = pathwayPicks.find((p: any) => p.stop_id === stop.id)
                      if (!pick) return null
                      
                      const quizData = (QUIZZES as any)[pathway.id]?.[stop.id]
                      const answerLabel = getAnswerLabel(pick, pathway.id, stop.id)
                      
                      return (
                        <div key={stop.id} style={{ background: 'rgba(0,0,0,.25)', border: '2px solid var(--ln,#3d2668)', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span className="font-pixel" style={{ fontSize: 10, letterSpacing: 1, background: pathwayColor, color: '#12081e', padding: '3px 8px', borderRadius: 20 }}>{stop.name.toUpperCase()}</span>
                            {stop.optional && (
                              <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 0.5, background: 'rgba(255,255,255,.1)', color: 'var(--mu,#a493c9)', padding: '2px 6px', borderRadius: 10 }}>OPTIONAL</span>
                            )}
                          </div>
                          
                          <div style={{ fontSize: 17, color: 'var(--mu,#a493c9)', marginBottom: 8, lineHeight: 1.4 }}>
                            {quizData?.prompt || 'Your answer'}
                          </div>
                          
                          <div style={{ fontWeight: 700, color: 'var(--tx,#efe6ff)', fontSize: 17, lineHeight: 1.3, padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 8, border: '1px solid var(--ln,#3d2668)' }}>
                            {answerLabel}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Section E: Certificate ── */}
      <div
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          background: 'linear-gradient(180deg,rgba(116,240,160,.08),var(--pn,#241542))',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div className="font-pixel" style={{ fontSize: 11, color: 'var(--ok,#74f0a0)' }}>
            ◈ CERTIFICATE
          </div>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>{delivPct >= 75 ? '100% complete' : `${Math.round((delivPct / 75) * 100)}% complete`}</span>
        </div>

        {/* Certificate eligibility based on deliverables only (75% = all 3 deliverables approved) */}
        {delivPct >= 75 ? (
          <div style={{ padding: 20, background: 'rgba(116,240,160,.1)', border: '2px solid var(--ok,#74f0a0)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#2E5534,#4a8a5a)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📜</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ok,#74f0a0)', fontSize: 22 }}>Congratulations!</div>
                <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
                  You&apos;ve completed all 3 deliverables in {cohortName} and earned your certificate.
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCertPreview(true)}
                className="font-pixel"
                style={{ background: 'transparent', color: 'var(--ok,#74f0a0)', border: '2px solid var(--ok,#74f0a0)', borderRadius: 8, padding: '11px 20px', cursor: 'pointer', fontSize: 10, letterSpacing: 0.5 }}
              >
                ◆ PREVIEW CERTIFICATE
              </button>
              <button
                onClick={handleDownloadCertificate}
                disabled={isDownloadingPDF}
                className="font-pixel"
                style={{ background: isDownloadingPDF ? '#4a6a5a' : 'var(--ok,#74f0a0)', color: '#12081e', border: 'none', borderRadius: 8, padding: '11px 20px', cursor: isDownloadingPDF ? 'not-allowed' : 'pointer', fontSize: 10, letterSpacing: 0.5, opacity: isDownloadingPDF ? 0.7 : 1 }}
              >
                {isDownloadingPDF ? '⏳ GENERATING...' : '⛊ DOWNLOAD CERTIFICATE'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 30, textAlign: 'center', background: 'rgba(0,0,0,.2)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 600, color: 'var(--tx,#efe6ff)', marginBottom: 8 }}>Certificate Locked</div>
            <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', lineHeight: 1.5 }}>
              Complete all 3 deliverables to unlock your certificate.
              <br />
              <span style={{ fontSize: 12, opacity: 0.8 }}>Deliverables: {delivPct}% / 75%</span>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {showCertPreview && (
        <div 
          onClick={() => setShowCertPreview(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,4,16,.92)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,3vw,40px)', overflow: 'auto' }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: 760, maxHeight: '94vh', overflow: 'auto', background: '#f7f1e0', border: '3px solid #b58a2e', borderRadius: 5, boxShadow: '0 0 0 9px #f8f0da, 0 0 0 11px #c9a24a, 0 30px 70px rgba(0,0,0,.6)', position: 'relative', color: '#3a2c14', fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <button 
              onClick={() => setShowCertPreview(false)} 
              title="Close certificate" 
              className="font-pixel"
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3 }}
            >
              ✕
            </button>
            <div style={{ padding: 'clamp(26px,4.5vw,48px) clamp(22px,4.5vw,56px)', textAlign: 'center', position: 'relative' }}>
              <div className="font-pixel" style={{ fontSize: 8, letterSpacing: 3, color: '#a07d2c' }}>✦ {certSettings.certOrg.toUpperCase()} ✦</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase' }}>Pilot Workshops · The Steward&apos;s Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                <PixelSprite characterKey={character.character_key} accent={character.accent_color || '#ffd23f'} size={48} opts={{ gear: (character as any).gear || 'none', outfit: (character as any).outfit || 'plain' }} />
                <div style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 700, color: '#1a1206', borderBottom: '2px solid #c9a24a', padding: '0 18px 6px' }}>{character.player_name || character.character_key.toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 13, color: '#8a6a2a', letterSpacing: 2, marginBottom: 22, textTransform: 'uppercase' }}>Steward · Certified Steward</div>
              
              <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto' }}>
                {certSettings.certMessage || 'has journeyed the full three-day intensive of The Steward\'s Journey, practicing Active Production over Passive Consumption and banking three original deliverables into the StewardWorks portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of 12 Steward Principles carried forward — this steward is hereby conferred the standing of Certified Steward.'}
              </div>

              {/* Deliverables of Record */}
              <div style={{ borderTop: '2px solid #dcc890', borderBottom: '2px solid #dcc890', margin: '26px auto', padding: '18px 0', maxWidth: 580, textAlign: 'left' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, textAlign: 'center', marginBottom: 15 }}>◆ DELIVERABLES OF RECORD ◆</div>
                {days.slice(0, 3).map((day, idx) => {
                  const submission = submissions.find((s: any) => s.workshop_day_id === day.id)
                  const userTitle = submission?.title || (day as any).deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`
                  return (
                    <div key={day.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                      <div className="font-pixel" style={{ flex: 'none', fontSize: 10, fontWeight: 700, color: '#8a6a2a', minWidth: 60 }}>DAY {String(idx + 1).padStart(2, '0')}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>{userTitle.toUpperCase()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Signatures Section */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 580, margin: '30px auto 0' }}>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certFacilitator}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>{certSettings.certFacTitle} · {certSettings.certOrg}</div>
                </div>
                <div style={{ flex: 'none', textAlign: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle at 38% 30%,#f6dd8c 0%,#e6bd54 46%,#c69528 78%,#9c7015 100%)', border: '3px solid #8a6a2a', boxShadow: '0 3px 10px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.4),inset 0 -6px 14px rgba(120,84,18,.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <img src="/images/cert/steward-seal.png" alt="Seal" style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.9 }} />
                  </div>
                  <div className="font-pixel" style={{ fontSize: 6, color: '#8a6a2a', marginTop: 7, letterSpacing: 2 }}>OFFICIAL SEAL</div>
                </div>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{character.player_name || character.character_key.toUpperCase()}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626' }}>THE STEWARD</div>
                </div>
              </div>

              {/* Fiscal Sponsor */}
              <div style={{ maxWidth: 300, margin: '24px auto 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certSponsor}</div>
                <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>FISCAL SPONSOR · {certSettings.certSponsorOrg}</div>
              </div>

              {/* Issue Info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', maxWidth: 580, margin: '26px auto 0', fontSize: 11, color: '#8a6a2a', letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>
                <div>ISSUED {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                <div>CERTIFICATE NO. SW-{character.character_key.toUpperCase()}-{Date.now().toString().slice(-4)}</div>
              </div>

              {/* Funding Logos */}
              <div style={{ borderTop: '1px solid rgba(138,106,42,.3)', margin: '24px auto 0', paddingTop: 20, paddingBottom: 0, maxWidth: 580, textAlign: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, marginBottom: 12 }}>WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 0 }}>
                  <img src="/images/cert/logo-ca-jobs-first.png" alt="CA Jobs First" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-sdsu-rf.png" alt="SDSU Research Foundation" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-becoming.webp" alt="The Becoming Project" style={{ height: 38, objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Certificate download handler
  async function handleDownloadCertificate() {
    if (delivPct < 75) return
    
    setIsDownloadingPDF(true)
    try {
      const playerName = user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) || character.player_name || character.character_key.toUpperCase()
      const characterKey = character.character_key
      const accent = character.accent_color || '#ffd23f'
      
      // Fetch latest certificate settings from database
      const certResponse = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
      const latestCertSettings = certResponse.ok ? await certResponse.json() : certSettings
      
      // Build character sprite URI
      let characterSpriteUri = ''
      try {
        const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite')
        characterSpriteUri = buildSpriteUri(
          characterKey,
          accent,
          {
            gear: (character as any).gear || 'none',
            outfit: (character as any).outfit || 'plain'
          }
        )
      } catch (e) {
        console.error('Failed to build sprite URI:', e)
      }

      // Build deliverables data
      const deliverables = days.slice(0, 3).map((day, idx) => {
        const submission = submissions.find((s: any) => s.workshop_day_id === day.id)
        const userTitle = submission?.title || (day as any).deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`
        return {
          title: userTitle.toUpperCase(),
          url: ''
        }
      })

      // Client-side PDF generation using html2canvas + jsPDF (same as VictoryScreen)
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])
      const html2canvas = html2canvasModule.default
      const { jsPDF } = jsPDFModule

      // Import the shared buildClientCertHTML function
      const { buildClientCertHTML } = await import('@/components/workshops/journey/VictoryScreen')

      // Create a hidden container with the certificate HTML
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'
      container.style.zIndex = '-1'
      container.innerHTML = buildClientCertHTML({
        playerName,
        characterKey,
        certOrg: latestCertSettings.certOrg || certSettings.certOrg,
        certFacilitator: latestCertSettings.certFacilitator || certSettings.certFacilitator,
        certFacTitle: latestCertSettings.certFacTitle || certSettings.certFacTitle,
        certSponsor: latestCertSettings.certSponsor || certSettings.certSponsor,
        certSponsorOrg: latestCertSettings.certSponsorOrg || certSettings.certSponsorOrg,
        certMessage: latestCertSettings.certMessage || certSettings.certMessage,
        deliverables,
        characterSpriteUri
      })
      document.body.appendChild(container)

      // Wait for fonts and images to load
      await document.fonts.ready
      const images = container.querySelectorAll('img')
      await Promise.all(Array.from(images).map(img => 
        new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      ))
      await new Promise(resolve => setTimeout(resolve, 300))

      const contentHeight = container.scrollHeight || container.offsetHeight || 1123
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f7f1e0',
        width: 794,
        height: contentHeight,
      })

      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = 210
      const pageHeight = 297
      const imgAspect = canvas.width / canvas.height
      
      let imgW = pageWidth
      let imgH = pageWidth / imgAspect
      
      if (imgH > pageHeight) {
        imgH = pageHeight
        imgW = pageHeight * imgAspect
      }
      
      const xOffset = (pageWidth - imgW) / 2
      pdf.addImage(imgData, 'PNG', xOffset, 0, imgW, imgH)
      pdf.save(`certificate-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`)

    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Failed to download certificate. Check browser console for details.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }
}
