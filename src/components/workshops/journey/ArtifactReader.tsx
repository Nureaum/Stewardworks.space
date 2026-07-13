'use client'

import React, { useState } from 'react'
import type { WorkshopDayEntry, SceneConfig, WorkshopPrinciple, WorkshopProgress } from '@/types/workshops'
import { submitDeliverable } from '@/app/actions/workshops/participants'
import { getEntryMedia } from '@/app/actions/workshops/entry-media'

interface ArtifactReaderProps {
  entry: WorkshopDayEntry & { sectionTitle: string; sectionKey: string; hour: string }
  dayId?: string
  dayNumber: number
  scene: any
  accent: string
  cohortId?: string
  principles?: WorkshopPrinciple[]
  bankedPrincipleIds?: string[]
  progressRows?: WorkshopProgress[]
  onDeliverableSubmitted?: (msg: string) => void
  onClose?: () => void
  inline?: boolean
}

/* Section accent color */
function secColor(a: string) {
  return { A: 'var(--p,#ff5fd2)', B: 'var(--s,#45d6ff)', C: 'var(--gold,#ffd23f)' }[a] || 'var(--s,#45d6ff)'
}

/* Relic icon for header */
function artifactKind(t: string) {
  return { text: 'scroll', custom: 'scroll', list: 'tablet', dual: 'book', featured: 'orb', deliverable: 'chest' }[t] || 'scroll'
}

function relicUri(type: string, accent: string): string {
  const kind = artifactKind(type)
  let relic = ''
  if (kind === 'scroll') relic = `<rect x='24' y='14' width='24' height='30' rx='2' fill='#f2e6cf'/><rect x='24' y='14' width='24' height='4' fill='#d8c49a'/><rect x='24' y='40' width='24' height='4' fill='#d8c49a'/><rect x='29' y='22' width='14' height='2' fill='${accent}'/><rect x='29' y='27' width='14' height='2' fill='#9a8a6a'/><rect x='29' y='32' width='10' height='2' fill='#9a8a6a'/>`
  else if (kind === 'tablet') relic = `<rect x='22' y='12' width='28' height='32' rx='3' fill='#3a3352'/><rect x='22' y='12' width='28' height='32' rx='3' fill='none' stroke='${accent}' stroke-width='2'/><rect x='27' y='19' width='18' height='2' fill='${accent}'/><rect x='27' y='24' width='18' height='2' fill='#8a7fb0'/><rect x='27' y='29' width='18' height='2' fill='#8a7fb0'/>`
  else if (kind === 'book') relic = `<rect x='20' y='16' width='16' height='26' fill='#45d6ff'/><rect x='36' y='16' width='16' height='26' fill='#ffd23f'/><rect x='34' y='14' width='4' height='30' fill='#f2e6cf'/>`
  else if (kind === 'orb') relic = `<circle cx='36' cy='28' r='15' fill='${accent}' opacity='.28'/><circle cx='36' cy='28' r='11' fill='${accent}'/><path d='M32 22 L32 34 L44 28 Z' fill='#0c0718'/>`
  else relic = `<rect x='20' y='24' width='32' height='20' rx='2' fill='#8a5a34'/><rect x='20' y='20' width='32' height='9' rx='3' fill='#a06e40'/><rect x='20' y='31' width='32' height='3' fill='${accent}'/><rect x='33' y='30' width='6' height='6' fill='${accent}'/>`

  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='72' height='60' viewBox='0 0 72 60' shape-rendering='crispEdges'>${relic}</svg>`)}`
}

export default function ArtifactReader({ entry, dayId, dayNumber, scene, accent, cohortId, principles = [], bankedPrincipleIds = [], progressRows = [], onDeliverableSubmitted, onClose, inline }: ArtifactReaderProps) {
  const readerAccent = secColor(entry.sectionKey)
  const iconSrc = relicUri(entry.entry_type, accent)
  const actLabel = scene?.label || `ACT ${dayNumber}`

  const isText = entry.entry_type === 'text' || entry.entry_type === 'custom' as any
  const isList = entry.entry_type === 'list'
  const isDual = entry.entry_type === 'dual'
  const isFeatured = entry.entry_type === 'featured'
  const isDeliverable = entry.entry_type === 'deliverable'

  const [url, setUrl] = useState('')
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>('')
  const [showcaseRequested, setShowcaseRequested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  React.useEffect(() => {
    setIsLoadingMedia(true)
    getEntryMedia(entry.id)
      .then(setMedia)
      .finally(() => setIsLoadingMedia(false))
  }, [entry.id])

  const dayProgress = progressRows.find(p => p.workshop_day_id === dayId)
  const isSubmitted = dayProgress?.deliverable_status === 'submitted' || dayProgress?.deliverable_status === 'approved'

  const handleSubmit = async () => {
    if (!url.trim() || !dayId || isSubmitting || isSubmitted) return
    // Allow submission without principle if no unbanked principles remain
    const unbankedCount = principles.filter(p => !bankedPrincipleIds.includes(p.id)).length
    if (unbankedCount > 0 && !selectedPrinciple) return

    setIsSubmitting(true)
    try {
      const pText = selectedPrinciple ? `Selected Principle ID: ${selectedPrinciple}` : 'No principle selected'
      const result = await submitDeliverable(dayId, { 
        external_video_url: url.trim(), 
        submission_text: pText,
        principle_id: selectedPrinciple || undefined,
        showcase_requested: showcaseRequested
      })
      
      // Some server actions return { success: false, message: '...' } on failure instead of throwing
      if (result && 'success' in result && result.success === false) {
        alert(result.message || 'Failed to submit deliverable')
        setIsSubmitting(false)
        return
      }
      
      if (onDeliverableSubmitted) {
        onDeliverableSubmitted('Deliverable submitted successfully! Pending admin approval.')
      }
      if (onClose) onClose()
    } catch (e: any) {
      alert(e?.message || 'Failed to submit deliverable')
      setIsSubmitting(false)
    }
  }

  const innerContent = (
    <div
      onClick={(e) => !inline && e.stopPropagation()}
      className={inline ? "" : "retro-winpop"}
      style={{
        width: '100%', 
        maxWidth: inline ? 'none' : 1080, 
        maxHeight: inline ? 'none' : '92vh',
        height: inline ? '100%' : 'auto',
        display: 'flex', flexDirection: 'column',
        border: inline ? 'none' : `3px solid ${readerAccent}`,
        borderRadius: inline ? 0 : 16,
        background: inline ? 'transparent' : 'var(--pn,#241542)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 12px', borderBottom: `2px solid ${inline ? 'var(--ln,#3d2668)' : readerAccent}`, background: inline ? 'transparent' : 'rgba(0,0,0,.15)', flex: 'none' }}>
        <img src={iconSrc} alt="" width="46" height="38" style={{ imageRendering: 'pixelated', flex: 'none' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-pixel" style={{ fontSize: 8, color: readerAccent, marginBottom: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {actLabel} · {entry.sectionTitle}
          </div>
          <div className="font-pixel" style={{ fontSize: 13, color: 'var(--tx,#efe6ff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.title}
          </div>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="font-pixel"
            style={{
              fontSize: 14, color: readerAccent, background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px 8px', marginLeft: 8,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* ── Content Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,30px)', background: inline ? 'transparent' : 'linear-gradient(180deg, rgba(0,0,0,.08), transparent)' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* MAIN TEXT COLUMN */}
          <div style={{ flex: '3 1 430px', minWidth: 280, padding: 'clamp(18px,2.6vw,30px)' }}>
            {/* Subtitle */}
            {entry.subtitle && (
              <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 16, lineHeight: 1.4 }}>
                {entry.subtitle}
              </div>
            )}

            {/* ── Text type ── */}
            {isText && (
              <div style={{ fontSize: 18, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                {(() => {
                  const bodyParts = (entry.body || '').split('<!--BLOCK-->')
                  const mainBody = bodyParts[0] || ''
                  const blocks = bodyParts.slice(1)
                  
                  return (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: mainBody }} />
                      {blocks.map((blk, idx) => (
                        <div key={idx} style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed var(--ln,#3d2668)' }}>
                          <div dangerouslySetInnerHTML={{ __html: blk }} />
                        </div>
                      ))}
                    </>
                  )
                })()}
              </div>
            )}

            {/* ── List type ── */}
            {isList && entry.items && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {entry.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    border: '1px solid var(--ln,#3d2668)', borderRadius: 8,
                    padding: 14, background: 'rgba(0,0,0,.2)',
                  }}>
                    <span className="font-pixel" style={{ fontSize: 10, color: readerAccent, marginTop: 3 }}>◈</span>
                    <span style={{ fontSize: 19, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Dual-story type ── */}
            {isDual && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ border: '2px solid var(--s,#45d6ff)', borderRadius: 6, padding: 15, background: 'rgba(69,214,255,.06)' }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'var(--bg,#12081e)', background: 'var(--s,#45d6ff)', padding: '4px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
                    MODERN · NEWS
                  </div>
                  <div className="font-pixel" style={{ fontSize: 11, color: 'var(--s,#45d6ff)', lineHeight: 1.5, marginBottom: 10 }}>
                    {entry.modern_title}
                  </div>
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    {entry.modern_body}
                  </div>
                </div>
                <div style={{ border: '2px solid var(--gold,#ffd23f)', borderRadius: 6, padding: 15, background: 'rgba(255,210,63,.06)' }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'var(--bg,#12081e)', background: 'var(--gold,#ffd23f)', padding: '4px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
                    ANCIENT · INDIGENOUS
                  </div>
                  <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', lineHeight: 1.5, marginBottom: 10 }}>
                    {entry.ancient_title}
                  </div>
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    {entry.ancient_body}
                  </div>
                </div>
                {entry.framework && (
                  <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', borderLeft: '3px solid var(--p,#ff5fd2)', paddingLeft: 12, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--p,#ff5fd2)' }}>FRAMEWORK:</span> {entry.framework}
                  </div>
                )}
              </div>
            )}

            {/* ── Featured contributor ── */}
            {isFeatured && (
              <div>
                {entry.note && (
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.45, marginBottom: 16 }}>
                    {entry.note}
                  </div>
                )}
                <div style={{ border: '2px solid var(--ok,#74f0a0)', borderRadius: 8, padding: 16, background: 'rgba(116,240,160,.05)' }}>
                  <div className="font-pixel" style={{ fontSize: 11, color: 'var(--tx,#efe6ff)', lineHeight: 1.5, marginBottom: 7 }}>
                    Featured Contributor
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 9 }}>
                    Paid community media
                  </div>
                  <button className="font-pixel" style={{
                    fontSize: 9, color: 'var(--bg,#12081e)',
                    background: 'var(--ok,#74f0a0)', border: 'none',
                    borderRadius: 4, padding: '9px 13px', cursor: 'pointer',
                  }}>
                    ▶ OPEN SAMPLE
                  </button>
                </div>
              </div>
            )}

            {/* ── Deliverable type ── */}
            {isDeliverable && (
              <div>
                {/* Goal */}
                {entry.goal && (
                  <div style={{ border: '2px dashed var(--gold,#ffd23f)', borderRadius: 6, padding: 15, background: 'rgba(255,210,63,.05)', marginBottom: 16 }}>
                    <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', marginBottom: 9 }}>
                      ⛃ DAY {dayNumber < 10 ? `0${dayNumber}` : dayNumber} DELIVERABLE GOAL
                    </div>
                    <div style={{ fontSize: 19, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>
                      {entry.goal}
                    </div>
                  </div>
                )}

                {/* AI Lab link */}
                <a
                  href={`/hub/ai-lab${cohortId ? '?cohortId=' + cohortId : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    textDecoration: 'none',
                    border: '2px solid var(--ok,#74f0a0)', borderRadius: 6,
                    padding: '13px 15px', background: 'rgba(116,240,160,.08)',
                    marginBottom: 16,
                  }}
                >
                  <div className="font-pixel" style={{ fontSize: 16, color: 'var(--ok,#74f0a0)', flex: 'none' }}>⚡</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.35 }}>
                    Open the AI Lab Workbench to generate your asset, then bank it below.
                  </div>
                  <div className="font-pixel" style={{ fontSize: 9, color: 'var(--bg,#12081e)', background: 'var(--ok,#74f0a0)', borderRadius: 5, padding: '10px 12px', flex: 'none' }}>
                    GO ▸
                  </div>
                </a>

                {/* Submission console */}
                <div style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 6, padding: 15, background: 'rgba(0,0,0,.22)' }}>
                  <div className="font-pixel" style={{ fontSize: 9, color: 'var(--tx,#efe6ff)', marginBottom: 13 }}>
                    ▚ SUBMISSION CONSOLE
                  </div>
                  <label style={{ fontSize: 15, color: 'var(--mu,#a493c9)', display: 'block', marginBottom: 7 }}>
                    {entry.submit_label || 'Paste your deliverable link'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://…"
                    value={isSubmitted ? 'Submitted' : url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isSubmitted || isSubmitting}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(0,0,0,.4)',
                      border: '2px solid var(--ln,#3d2668)',
                      borderRadius: 4, color: 'var(--tx,#efe6ff)',
                      fontSize: 18, padding: '10px 12px', marginBottom: 12,
                      opacity: isSubmitted ? 0.6 : 1
                    }}
                  />
                  {!isSubmitted && (
                    <>
                      <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 9 }}>
                        Assign <span style={{ color: 'var(--gold,#ffd23f)' }}>at least one fresh Steward Principle</span>:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                        {principles.filter(p => !bankedPrincipleIds.includes(p.id)).map(p => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPrinciple(p.id)}
                            className="font-pixel"
                            style={{
                              fontSize: 9,
                              padding: '6px 10px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              background: selectedPrinciple === p.id ? 'var(--gold,#ffd23f)' : 'rgba(0,0,0,.3)',
                              color: selectedPrinciple === p.id ? '#000' : 'var(--mu,#a493c9)',
                              border: `1px solid ${selectedPrinciple === p.id ? 'var(--gold,#ffd23f)' : 'var(--ln,#3d2668)'}`
                            }}
                          >
                            {p.name.toUpperCase()}
                          </div>
                        ))}
                        {principles.filter(p => !bankedPrincipleIds.includes(p.id)).length === 0 && (
                          <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', fontStyle: 'italic' }}>
                            No unbanked principles left!
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Showcase Request Checkbox */}
                  {!isSubmitted && (
                    <div 
                      onClick={() => setShowcaseRequested(!showcaseRequested)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '12px 14px', borderRadius: 8, marginTop: 12, marginBottom: 12,
                        background: showcaseRequested ? 'rgba(255,95,210,.08)' : 'rgba(0,0,0,.2)',
                        border: `2px solid ${showcaseRequested ? 'var(--pk,#ff5fd2)' : 'var(--ln,#28432f)'}`
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flex: 'none',
                        border: `2px solid ${showcaseRequested ? 'var(--pk,#ff5fd2)' : 'var(--mu,#77b78d)'}`,
                        background: showcaseRequested ? 'var(--pk,#ff5fd2)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontSize: 13, lineHeight: 1
                      }}>
                        {showcaseRequested && '✓'}
                      </div>
                      <div style={{ color: 'var(--tx,#d6ffe0)', fontSize: 15, lineHeight: 1.3 }}>
                        Submit to the curated <b>Student Showcase</b>
                      </div>
                    </div>
                  )}
                  
                  {(() => {
                    const unbankedCount = principles.filter(p => !bankedPrincipleIds.includes(p.id)).length
                    const canSubmit = url.trim() && (unbankedCount === 0 || selectedPrinciple)
                    const isDisabled = isSubmitted || isSubmitting || !canSubmit
                    
                    return (
                      <button 
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        className="font-pixel" 
                        style={{
                          fontSize: 10, color: 'var(--bg,#12081e)',
                          background: 'var(--gold,#ffd23f)',
                          border: 'none', borderRadius: 6,
                          padding: '12px 18px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 0 #b8912a',
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {isSubmitting ? 'SUBMITTING...' : isSubmitted ? (dayProgress?.deliverable_status === 'approved' ? '⬢ APPROVED' : '⬢ PENDING APPROVAL') : '⬢ SUBMIT DELIVERABLE'}
                      </button>
                    )
                  })()}
                </div>

                {/* Applied + Lab descriptions */}
                {entry.applied && (
                  <div style={{ marginTop: 16, fontSize: 16, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', display: 'block', marginBottom: 6 }}>APPLIED FOCUS</span>
                    {entry.applied}
                  </div>
                )}
                {entry.lab && (
                  <div style={{ marginTop: 12, fontSize: 16, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', display: 'block', marginBottom: 6 }}>LAB</span>
                    {entry.lab}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── MEDIA RAIL (right column) ── */}
          <div style={{
            flex: '2 1 300px', minWidth: 240,
            borderLeft: '2px solid var(--ln,#3d2668)',
            background: 'rgba(0,0,0,.18)',
            padding: 'clamp(16px,2vw,24px)',
          }}>
            <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', letterSpacing: 1, marginBottom: 14 }}>
              ◈ VISUALS &amp; MEDIA
            </div>
            
            {isLoadingMedia ? (
              <div style={{
                border: '2px dashed var(--ln,#3d2668)', borderRadius: 8,
                padding: '20px 16px', textAlign: 'center',
                fontSize: 15, color: 'var(--mu,#a493c9)',
              }}>
                Loading media...
              </div>
            ) : media.length === 0 ? (
              <div style={{
                border: '2px dashed var(--ln,#3d2668)', borderRadius: 8,
                padding: '20px 16px', textAlign: 'center',
                fontSize: 15, color: 'var(--mu,#a493c9)', lineHeight: 1.45,
              }}>
                No visuals on this session yet. Your instructor can attach photos, video, audio &amp; links in the Admin console — they&apos;ll appear here, matched to the text.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {media.map(m => (
                  <div key={m.id} style={{ border: '1px solid var(--ln,#3d2668)', borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,.2)' }}>
                    <div style={{ padding: '4px 8px', background: 'var(--pn,#241542)', borderBottom: '1px solid var(--ln,#3d2668)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)' }}>{m.kind.toUpperCase()}</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--tx,#efe6ff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.label || m.file_name || m.url}
                      </span>
                    </div>
                    {m.kind === 'photo' && m.url && (
                      <div 
                        style={{ position: 'relative', cursor: 'zoom-in', width: '100%' }}
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(m.url) }}
                      >
                        <img src={m.url} alt="" style={{ width: '100%', display: 'block' }} />
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 6, display: 'flex' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx,#efe6ff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </div>
                      </div>
                    )}
                    {m.kind === 'video' && m.url && <video src={m.url} controls style={{ width: '100%', display: 'block' }} />}
                    {m.kind === 'audio' && m.url && <audio src={m.url} controls style={{ width: '100%', padding: '8px 0' }} />}
                    {m.kind === 'link' && m.url && (
                      <div style={{ padding: 10, wordBreak: 'break-all', fontSize: 13, color: 'var(--s,#45d6ff)' }}>
                        <a href={m.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{m.url}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const zoomModal = zoomedImage && (
    <div
      onClick={(e) => { e.stopPropagation(); setZoomedImage(null) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, cursor: 'zoom-out'
      }}
    >
      <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
    </div>
  )

  if (inline) {
    return (
      <>
        {innerContent}
        {zoomModal}
      </>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(8,4,16,.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(8px,2vw,26px)',
      }}
    >
      {innerContent}
      {zoomModal}
    </div>
  )
}
