'use client'

import React, { useState, useMemo } from 'react'
import { PixelSprite, buildIconUri } from '@/components/workshops/journey'
import { DEFAULT_CHARACTER } from './character-data'
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
}: PortfolioProps) {
  /* ── Local input state ── */
  const [bookmarkInput, setBookmarkInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [promptInput, setPromptInput] = useState('')

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ title: '', content: '', url: '' })
  const [assetInput, setAssetInput] = useState('')
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

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
    if (!st || !st.value.trim()) return
    onAddEngagement(kind, st.value.trim(), 'manual')
    st.set('')
  }

  function handleAddAsset() {
    if (!assetInput.trim()) return
    onAddEngagement('generation', assetInput.trim(), 'link', assetInput.trim())
    setAssetInput('')
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
            style={{ fontSize: 8, color: 'var(--ok,#74f0a0)', letterSpacing: 1, marginBottom: 4 }}
          >
            ❀ MY CHIA GUARDIAN
          </div>
          <div
            className="font-pixel"
            style={{ fontSize: 'clamp(14px,2vw,20px)', color: '#fff', marginBottom: 6 }}
          >
            {chiaPct}% GROWN
          </div>
          <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
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
            <div style={{ fontSize: 13, color: '#74f0a0' }}>
              <span style={{ marginRight: 6 }}>■</span>
              Deliverables {delivPct}% / 75%
            </div>
            <div style={{ fontSize: 13, color: '#45d6ff' }}>
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
          style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 14 }}
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
                  style={{ fontSize: 9, color: 'var(--gold,#ffd23f)' }}
                >
                  DAY 0{dayNum}
                </div>
                <div style={{ fontSize: 13, color: '#fff', textAlign: 'center' }}>
                  {day?.title || `Day ${dayNum}`}
                </div>
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 8,
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
                  <div className="font-pixel" style={{ fontSize: 6, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                    ✦ DELIVERABLE LINK
                  </div>
                  {(() => {
                    const submission = submissions.find((s: any) => s.workshop_day_id === day.id);
                    const rawLink = submission?.submission_text || submission?.file_storage_path || submission?.external_video_url || '';
                    const linkHref = rawLink ? (/^https?:/i.test(rawLink) ? rawLink : 'https://' + rawLink) : '#';
                    
                    if (rawLink) {
                      return (
                        <a href={linkHref} target="_blank" rel="noreferrer" title="Open deliverable" style={{ display: 'block', fontSize: 13, color: 'var(--s,#45d6ff)', textDecoration: 'none', wordBreak: 'break-all', lineHeight: 1.3 }}>
                          ⤢ {rawLink}
                        </a>
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
                    <div className="font-pixel" style={{ fontSize: 6, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                      ✦ INSTRUCTOR NOTE
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordWrap: 'break-word' }}>
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
            style={{ fontSize: 11, color: 'var(--ok,#74f0a0)' }}
          >
            ✦ MY ENGAGEMENT
          </div>
          <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>
            {approvedCount} approved · {pendingCount} pending · {engPct}%/25%
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginTop: 6 }}>
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
                  <span className="font-pixel" style={{ fontSize: 10, color: col.color, flex: 'none' }}>{col.icon}</span>
                  <div className="font-pixel" style={{ flex: 1, minWidth: 0, fontSize: 8, color: col.color, letterSpacing: 0.5 }}>
                    {col.label}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>
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
                      fontSize: 15,
                      padding: '9px 10px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleAddShelf(col.kind)}
                    title={`Add to ${col.label.toLowerCase()}`}
                    className="font-pixel"
                    style={{
                      fontSize: 11,
                      color: '#12081e',
                      background: col.color,
                      border: 'none',
                      borderRadius: 5,
                      padding: '0 13px',
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
                    <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', textAlign: 'center', padding: '9px 0' }}>
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
                              fontSize: 15,
                              color: 'var(--tx,#efe6ff)',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginTop: 2 }}>
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
                              fontSize: 7,
                              cursor: 'pointer',
                              lineHeight: 1,
                              padding: '4px 6px',
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
                          <div className="font-pixel" style={{ fontSize: 7, color: 'var(--gold,#ffd23f)', letterSpacing: 0.5, marginBottom: 5 }}>
                            ADMIN NOTE
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
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
            style={{ fontSize: 10, color: 'var(--ok,#74f0a0)', marginBottom: 6 }}
          >
            ◉ SAVED ASSETS
          </div>
          <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
            Paste a link to an AI-generated image, audio clip, or video to save it here.
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
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
            <button
              onClick={handleAddAsset}
              className="font-pixel"
              style={{
                background: 'var(--ok,#74f0a0)',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                color: '#12081e',
                fontSize: 9,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ＋ SAVE
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
                  {/* Colored thumbnail */}
                  <div style={{ height: 70, background: grad }} />
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
          <div style={{ background: '#12081e', border: '2px solid var(--s,#45d6ff)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="font-pixel" style={{ fontSize: 10, color: 'var(--s,#45d6ff)' }}>
                VIEW {viewingItem.kind.toUpperCase()}
              </div>
              <button onClick={() => setViewingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            
            <div style={{ fontSize: 18, color: 'var(--tx,#efe6ff)', marginBottom: 12, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{viewingItem.title}</div>
            
            {/* Status */}
            <div style={{ fontSize: 14, color: viewingItem.status === 'approved' ? 'var(--ok,#74f0a0)' : 'var(--gold,#ffd23f)', marginBottom: 16 }}>
              {viewingItem.status === 'approved' ? '✓ Approved · counts toward your Chia' : viewingItem.status === 'pending' ? '◔ Pending instructor approval' : viewingItem.status}
            </div>

            {/* Review Note */}
            {viewingItem.review_note && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 6, background: 'rgba(255,210,63,.12)', borderLeft: '4px solid var(--gold,#ffd23f)' }}>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', marginBottom: 6 }}>
                  ▤ TEACHER NOTE:
                </div>
                <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>
                  {viewingItem.review_note}
                </div>
              </div>
            )}
            
            {/* For generation/assets: show preview if URL is an image */}
            {viewingItem.kind === 'generation' && viewingItem.url && (
              <div style={{ marginBottom: 16 }}>
                {viewingItem.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img 
                    src={viewingItem.url} 
                    alt={viewingItem.title} 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: 200, 
                      objectFit: 'cover', 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10 
                    }} 
                  />
                ) : (
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
                    <span className="font-pixel" style={{ fontSize: 10, color: '#12081e' }}>
                      {viewingItem.url.match(/\.(mp4|webm|mov)$/i) ? 'VIDEO' : viewingItem.url.match(/\.(mp3|wav|ogg)$/i) ? 'AUDIO' : 'ASSET'}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>
                  ◉ {viewingItem.url.match(/\.(mp4|webm|mov)$/i) ? 'VIDEO' : viewingItem.url.match(/\.(mp3|wav|ogg)$/i) ? 'AUDIO' : 'IMAGE'} asset · generated in your workshop tools
                </div>
              </div>
            )}
            
            {/* For notes and prompts: show content */}
            {viewingItem.content && viewingItem.content !== viewingItem.title && viewingItem.kind !== 'generation' && (
              <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>{viewingItem.content}</div>
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
                  gap: 10, 
                  textDecoration: 'none', 
                  border: '2px solid var(--s,#45d6ff)', 
                  borderRadius: 8, 
                  padding: '12px 14px', 
                  background: 'rgba(255,255,255,0.03)',
                  marginTop: 16
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', wordBreak: 'break-all', overflowWrap: 'break-word', lineHeight: 1.3 }}>
                    {viewingItem.url || viewingItem.title}
                  </div>
                </div>
                <span className="font-pixel" style={{ fontSize: 8, color: '#12081e', background: 'var(--s,#45d6ff)', borderRadius: 5, padding: '8px 10px', flexShrink: 0 }}>
                  OPEN ↗
                </span>
              </a>
            )}
            
            <div style={{ marginTop: 24, fontSize: 11, color: 'var(--mu,#a493c9)' }}>
              Source: {viewingItem.source || 'My Shelf'} · Status: {viewingItem.status}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingId(null)}>
          <div style={{ background: '#12081e', border: '2px solid var(--gold,#ffd23f)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold,#ffd23f)' }}>
                EDIT {editingItem.kind.toUpperCase()}
              </div>
              <button type="button" onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            
            <label style={{ display: 'block', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>Title / Link</div>
              <input 
                value={editDraft.title}
                onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && editingItem.kind === 'bookmark') handleSaveEdit(e as any) }}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '10px 12px', borderRadius: 6, fontSize: 14 }}
              />
            </label>

            {editingItem.kind !== 'bookmark' && (
              <label style={{ display: 'block', marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>Notes / Content</div>
                <textarea 
                  value={editDraft.content}
                  onChange={e => setEditDraft(prev => ({ ...prev, content: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '10px 12px', borderRadius: 6, fontSize: 14, minHeight: 120, resize: 'vertical' }}
                />
              </label>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
              <button 
                type="button" 
                onClick={() => {
                  console.log('[Portfolio Modal] CANCEL button clicked')
                  setEditingId(null)
                }} 
                style={{ background: 'transparent', border: '1px solid var(--mu,#a493c9)', color: 'var(--mu,#a493c9)', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }} 
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
                style={{ background: 'var(--gold,#ffd23f)', border: 'none', color: '#12081e', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }} 
                className="font-pixel"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
