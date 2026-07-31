'use client'

import React, { useState, useRef } from 'react'
import type { WorkshopDayEntry, SceneConfig, WorkshopPrinciple, WorkshopProgress, WorkshopDeliverableSubmission } from '@/types/workshops'
import { submitDeliverable } from '@/app/actions/workshops/participants'
import { getEntryMedia } from '@/app/actions/workshops/entry-media'
import { uploadCreationImage } from '@/app/actions/workshops/engagement'
import { getShowcaseItems } from '@/app/actions/workshops/showcase'
import DeliverableMediaPreview, { isImageUrl } from '@/components/workshops/DeliverableMediaPreview'

interface ArtifactReaderProps {
  entry: WorkshopDayEntry & { sectionTitle: string; sectionKey: string; hour: string }
  dayId?: string
  dayNumber: number
  scene: any
  accent: string
  cohortId?: string
  principles?: WorkshopPrinciple[]
  bankedPrincipleIds?: string[]
  allBankedPrinciples?: { progress_id: string; principle_id: string }[]  // full objects for pending detection
  currentDayPrincipleId?: string | null  // principle used for THIS day's submission
  progressRows?: WorkshopProgress[]
  submissions?: WorkshopDeliverableSubmission[]
  onDeliverableSubmitted?: (msg: string, shouldOpenVictory?: boolean) => void
  onClose?: () => void
  inline?: boolean
  userRole?: string
  onBookmark?: (key: string, title: string, source: string, url?: string) => void
  isBookmarked?: boolean
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

export default function ArtifactReader({ entry, dayId, dayNumber, scene, accent, cohortId, principles = [], bankedPrincipleIds = [], allBankedPrinciples = [], currentDayPrincipleId: propCurrentDayPrincipleId, progressRows = [], submissions = [], onDeliverableSubmitted, onClose, inline, userRole = 'participant', onBookmark, isBookmarked = false }: ArtifactReaderProps) {
  const readerAccent = secColor(entry.sectionKey)
  const iconSrc = relicUri(entry.entry_type, accent)
  const actLabel = scene?.label || `ACT ${dayNumber}`

  const isText = entry.entry_type === 'text' || entry.entry_type === 'custom' as any
  const isList = entry.entry_type === 'list'
  const isDual = entry.entry_type === 'dual'
  const isFeatured = entry.entry_type === 'featured'
  const isDeliverable = entry.entry_type === 'deliverable'

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>('')
  const [showcaseRequested, setShowcaseRequested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [showFeaturedPopup, setShowFeaturedPopup] = useState(false)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  // Track banked principles locally so the list updates immediately after submission
  const [localBankedPrincipleIds, setLocalBankedPrincipleIds] = useState<string[]>(bankedPrincipleIds)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep in sync when parent refreshes props
  React.useEffect(() => {
    setLocalBankedPrincipleIds(bankedPrincipleIds)
  }, [bankedPrincipleIds.join(',')])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, GIF, etc.)')
      return
    }
    setFileToUpload(file)
    setUrl(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  React.useEffect(() => {
    setIsLoadingMedia(true)
    getEntryMedia(entry.id)
      .then(setMedia)
      .finally(() => setIsLoadingMedia(false))
  }, [entry.id])

  const [featuredItem, setFeaturedItem] = useState<any>(null)

  React.useEffect(() => {
    if (isFeatured && entry.contrib_id && cohortId) {
      getShowcaseItems(cohortId)
        .then(items => {
          const item = items.find((i: any) => i.id === entry.contrib_id)
          if (item) setFeaturedItem(item)
        })
        .catch(console.error)
    }
  }, [isFeatured, entry.contrib_id, cohortId])

  const dayProgress = progressRows.find(p => p.workshop_day_id === dayId)
  const isSubmitted = dayProgress?.deliverable_status === 'submitted' || dayProgress?.deliverable_status === 'approved'
  const isRejected = dayProgress?.deliverable_status === 'rejected'

  // Track the current day's principle locally so it updates immediately on submit
  const [localCurrentDayPrincipleId, setLocalCurrentDayPrincipleId] = useState<string | null>(propCurrentDayPrincipleId || null)

  React.useEffect(() => {
    if (propCurrentDayPrincipleId !== undefined) {
      setLocalCurrentDayPrincipleId(propCurrentDayPrincipleId)
    }
  }, [propCurrentDayPrincipleId])

  // Principles used by OTHER days — only APPROVED submissions fully lock a principle.
  const otherDaysBankedIds = localBankedPrincipleIds.filter(id => id !== localCurrentDayPrincipleId)

  // Principles that are PENDING (submitted but not yet approved) on OTHER days.
  // Derived from other days' progress rows with status 'submitted', matched via allBankedPrinciples.
  const pendingOtherDayPrincipleIds = progressRows
    .filter(p => p.workshop_day_id !== dayId && p.deliverable_status === 'submitted')
    .map(p => allBankedPrinciples.find(bp => bp.progress_id === p.id)?.principle_id)
    .filter(Boolean) as string[]

  const handleSubmit = async () => {
    if ((!url.trim() && !fileToUpload) || !dayId || isSubmitting) return
    if (!title.trim()) {
      alert('Please enter a title for your deliverable')
      return
    }
    // Allow submission without principle if no available principles remain
    const availableCount = principles.filter(p => !otherDaysBankedIds.includes(p.id) && !pendingOtherDayPrincipleIds.includes(p.id)).length
    if (availableCount > 0 && !selectedPrinciple) {
      alert('Please select a principle for your deliverable')
      return
    }

    setIsSubmitting(true)
    try {
      // Handle file upload if present
      let finalUrl = url.trim()
      if (fileToUpload) {
        const formData = new FormData()
        formData.append('file', fileToUpload)
        finalUrl = await uploadCreationImage(formData)
      }
      
      const result = await submitDeliverable(dayId, { 
        title: title.trim(),
        description: description.trim() || undefined,
        external_video_url: finalUrl, 
        principle_id: selectedPrinciple || undefined,
        showcase_requested: showcaseRequested
      })
      
      // Some server actions return { success: false, message: '...' } on failure instead of throwing
      if (result && 'success' in result && result.success === false) {
        alert(result.message || 'Failed to submit deliverable')
        setIsSubmitting(false)
        return
      }
      
      // Check if this submission completes all 3 days
      // Count how many days are already complete (submitted or approved)
      const currentlyComplete = progressRows.filter(
        p => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved'
      ).length
      
      // After this submission, we'll have one more complete
      const willBeComplete = currentlyComplete + 1
      const shouldOpenVictory = false // Victory only shows after admin approves all 3
      
      // Immediately update local banked principles so subsequent day forms exclude this principle
      if (selectedPrinciple) {
        setLocalBankedPrincipleIds(prev => {
          const filtered = prev.filter(id => id !== localCurrentDayPrincipleId) // remove old day principle
          return [...filtered, selectedPrinciple] // add new one
        })
        setLocalCurrentDayPrincipleId(selectedPrinciple)
      }

      if (onDeliverableSubmitted) {
        const message = shouldOpenVictory 
          ? '★ Final deliverable banked — quest complete!' 
          : 'Deliverable submitted successfully! Pending admin approval.'
        onDeliverableSubmitted(message, shouldOpenVictory)
      }
      setIsSubmitting(false)
      setIsEditMode(false)
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
        {/* Bookmark button — shown in both modal and inline modes when onBookmark is provided */}
        {onBookmark && (
          <button
            onClick={() => onBookmark(
              `${dayId}-${entry.id}`,
              entry.title,
              `${actLabel}: ${entry.sectionTitle}`,
              cohortId ? `/hub/pilot-workshops/${cohortId}/journey?day=${dayNumber}&topic=${entry.id}` : undefined
            )}
            title={isBookmarked ? 'Already bookmarked' : 'Bookmark this lesson'}
            className="font-pixel"
            style={{
              fontSize: 16,
              color: isBookmarked ? 'var(--gold,#ffd23f)' : 'var(--mu,#a493c9)',
              background: isBookmarked ? 'rgba(255,210,63,.15)' : 'transparent',
              border: isBookmarked ? '1px solid var(--gold,#ffd23f)' : '1px solid var(--ln,#3d2668)',
              borderRadius: 6,
              padding: '6px 10px',
              cursor: 'pointer',
              flex: 'none',
              transition: 'all 0.2s',
              boxShadow: isBookmarked ? '0 0 8px rgba(255,210,63,.3)' : 'none',
            }}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        )}
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
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: inline ? 'column' : 'row', flexWrap: inline ? 'nowrap' : 'wrap', alignItems: 'stretch' }}>
          {/* MAIN TEXT COLUMN */}
          <div style={{ flex: inline ? 'none' : '3 1 430px', minWidth: inline ? 'auto' : 280, maxWidth: '100%', padding: 'clamp(18px,2.6vw,30px)', overflow: 'hidden' }}>
            {/* Subtitle */}
            {entry.subtitle && (
              <div style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 20, lineHeight: 1.4 }}>
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
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: entry.modern_body || '' }} />
                </div>
                <div style={{ border: '2px solid var(--gold,#ffd23f)', borderRadius: 6, padding: 15, background: 'rgba(255,210,63,.06)' }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'var(--bg,#12081e)', background: 'var(--gold,#ffd23f)', padding: '4px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
                    ANCIENT · INDIGENOUS
                  </div>
                  <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', lineHeight: 1.5, marginBottom: 10 }}>
                    {entry.ancient_title}
                  </div>
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: entry.ancient_body || '' }} />
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
                  <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.45, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: entry.note }} />
                )}
                {featuredItem ? (
                  <div style={{ border: '2px solid var(--ok,#74f0a0)', borderRadius: 8, padding: 16, background: 'rgba(116,240,160,.05)' }}>
                    <div className="font-pixel" style={{ fontSize: 14, color: 'var(--tx,#efe6ff)', lineHeight: 1.5, marginBottom: 6 }}>
                      {featuredItem.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginBottom: 12 }}>
                      by {featuredItem.author} · {featuredItem.meta}
                    </div>
                    {featuredItem.blurb && (
                      <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', marginBottom: 18, lineHeight: 1.45 }}>
                        {featuredItem.blurb}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setShowFeaturedPopup(true)}
                        className="font-pixel" 
                        style={{
                          fontSize: 11, 
                          color: 'var(--bg,#12081e)',
                          background: 'var(--ok,#74f0a0)', 
                          border: 'none',
                          borderRadius: 4, 
                          padding: '10px 15px', 
                          cursor: 'pointer',
                          boxShadow: '0 3px 0 #4da06a',
                        }}
                      >
                        ▸ OPEN SAMPLE
                      </button>
                      
                      {featuredItem.content_item_id && (
                        <a
                          href={`/hub/library/${featuredItem.content_item_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-pixel"
                          style={{
                            fontSize: 11,
                            color: '#FEFAE0',
                            background: '#2E5534',
                            border: 'none',
                            borderRadius: 4,
                            padding: '10px 15px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            boxShadow: '0 3px 0 #1d3a23',
                          }}
                        >
                          ▸ OPEN IN LIBRARY
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '2px solid var(--ok,#74f0a0)', borderRadius: 8, padding: 16, background: 'rgba(116,240,160,.05)' }}>
                    <div className="font-pixel" style={{ fontSize: 11, color: 'var(--tx,#efe6ff)', lineHeight: 1.5, marginBottom: 7 }}>
                      Featured Contributor
                    </div>
                    <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 9 }}>
                      {entry.contrib_id ? 'Loading piece...' : 'No piece selected yet.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Deliverable type (hidden for guests) ── */}
            {isDeliverable && userRole !== 'guest' && (
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

                {/* Submission console - shows different views based on submission status */}
                {(() => {
                  // Find the latest submission for this day
                  const daySubmission = submissions.find(s => s.workshop_day_id === dayId)
                  const submittedUrl = daySubmission?.external_video_url || daySubmission?.submission_text || ''
                  const cleanSubmittedUrl = submittedUrl.replace('[SHOWCASE_REQUESTED]', '').replace(/Selected Principle ID:.*$/, '').trim()
                  
                  // Get the principle that was banked with this submission (use local state for freshness)
                  const submittedPrincipleId = localCurrentDayPrincipleId
                  const submittedPrinciple = submittedPrincipleId ? principles.find(p => p.id === submittedPrincipleId) : null
                  
                  if (isRejected && !isEditMode) {
                    // Show the rejected/returned view — needs resubmission
                    return (
                      <div style={{ border: '2px solid var(--er,#ff5f5f)', borderRadius: 6, padding: 16, background: 'rgba(255,95,95,.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span className="font-pixel" style={{ fontSize: 11, color: 'var(--er,#ff5f5f)' }}>✕ RETURNED — NEEDS RESUBMISSION</span>
                        </div>

                        {/* Show teacher's return note */}
                        {dayProgress?.review_note && (
                          <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 6, background: 'rgba(255,95,95,.12)', borderLeft: '4px solid var(--er,#ff5f5f)' }}>
                            <div className="font-pixel" style={{ fontSize: 9, color: 'var(--er,#ff5f5f)', marginBottom: 6 }}>
                              ▤ TEACHER FEEDBACK:
                            </div>
                            <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>
                              {dayProgress.review_note}
                            </div>
                          </div>
                        )}

                        {/* Show what was originally submitted */}
                        {daySubmission?.title && (
                          <div className="font-pixel" style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>
                            {daySubmission.title}
                          </div>
                        )}
                        {daySubmission?.description && (
                          <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 8, lineHeight: 1.4 }}>
                            {daySubmission.description}
                          </div>
                        )}
                        {cleanSubmittedUrl && (
                          <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 10, wordBreak: 'break-all' }}>
                            <DeliverableMediaPreview
                              url={cleanSubmittedUrl}
                              variant="thumbnail"
                              theme="dark"
                              showPreviewButton={true}
                              maxThumbnailSize={36}
                            />
                          </div>
                        )}

                        {/* Resubmit button — pre-fills the form with old data */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                          <button
                            onClick={() => {
                              setIsEditMode(true)
                              setTitle(daySubmission?.title || '')
                              setDescription(daySubmission?.description || '')
                              setUrl(cleanSubmittedUrl)
                              setSelectedPrinciple('')  // principle was freed on rejection, pick fresh
                            }}
                            className="font-pixel"
                            style={{ fontSize: 9, color: '#ff5f5f', background: 'none', border: '2px solid #ff5f5f', borderRadius: 4, padding: '9px 14px', cursor: 'pointer' }}
                          >
                            ↺ RESUBMIT DELIVERABLE
                          </button>
                          {onClose && (
                            <button onClick={onClose} className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', background: 'none', border: '2px solid var(--gold,#ffd23f)', borderRadius: 4, padding: '9px 12px', cursor: 'pointer' }}>
                              ◂ BACK
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  }

                  if (isSubmitted && !isEditMode) {
                    // Show the completed/banked view
                    const statusColor = dayProgress?.deliverable_status === 'approved' ? 'var(--ok,#74f0a0)' : 'var(--gold,#ffd23f)'
                    const statusLabel = dayProgress?.deliverable_status === 'approved' ? '✓ DELIVERABLE APPROVED' : '◷ PENDING TEACHER APPROVAL'
                    const borderColor = dayProgress?.deliverable_status === 'approved' ? 'var(--ok,#74f0a0)' : 'var(--gold,#ffd23f)'
                    
                    return (
                      <div style={{ border: `2px solid ${borderColor}`, borderRadius: 6, padding: 16, background: dayProgress?.deliverable_status === 'approved' ? 'rgba(116,240,160,.06)' : 'rgba(255,210,63,.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span className="font-pixel" style={{ fontSize: 11, color: statusColor }}>{statusLabel}</span>
                          {dayProgress?.deliverable_status === 'approved' && (
                            <span style={{ fontSize: 14, color: 'var(--mu,#a493c9)' }}>Synced to Steward Library</span>
                          )}
                        </div>
                        
                        {/* Show submitted title */}
                        {daySubmission?.title && (
                          <div className="font-pixel" style={{ fontSize: 12, color: 'var(--tx,#efe6ff)', marginBottom: 8 }}>
                            {daySubmission.title}
                          </div>
                        )}
                        
                        {/* Show submitted description */}
                        {daySubmission?.description && (
                          <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 10, lineHeight: 1.4 }}>
                            {daySubmission.description}
                          </div>
                        )}
                        
                        {/* Show submitted URL/content */}
                        {cleanSubmittedUrl && (
                          <div style={{ fontSize: 16, color: 'var(--tx,#efe6ff)', marginBottom: 10, wordBreak: 'break-all' }}>
                            <DeliverableMediaPreview
                              url={cleanSubmittedUrl}
                              variant="thumbnail"
                              theme="dark"
                              showPreviewButton={true}
                              maxThumbnailSize={48}
                            />
                          </div>
                        )}
                        
                        {/* Show banked principle */}
                        {submittedPrinciple && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
                            <span style={{ 
                              fontSize: 14, 
                              color: dayProgress?.deliverable_status === 'approved' ? 'var(--ok,#74f0a0)' : '#ffa032',
                              border: `1px solid ${dayProgress?.deliverable_status === 'approved' ? 'var(--ok,#74f0a0)' : '#ffa032'}`, 
                              borderRadius: 20, 
                              padding: '2px 10px' 
                            }}>
                              ◈ {submittedPrinciple.name} {dayProgress?.deliverable_status !== 'approved' && <span style={{fontSize: 9, marginLeft: 4}}>⏳PENDING</span>}
                            </span>
                          </div>
                        )}
                        
                        {/* Review Note Display */}
                        {dayProgress?.review_note && (
                          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 6, background: 'rgba(255,210,63,.12)', borderLeft: '4px solid var(--gold,#ffd23f)' }}>
                            <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', marginBottom: 6 }}>
                              ▤ TEACHER NOTE:
                            </div>
                            <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>
                              {dayProgress.review_note}
                            </div>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                          {/* Edit/Resubmit button - always show so students can update anytime */}
                          <button 
                            onClick={() => {
                              setIsEditMode(true)
                              setTitle(daySubmission?.title || '')
                              setDescription(daySubmission?.description || '')
                              setUrl(cleanSubmittedUrl)
                              // Pre-fill the previously selected principle
                              setSelectedPrinciple(submittedPrincipleId || '')
                            }}
                            className="font-pixel" 
                            style={{ fontSize: 9, color: 'var(--p,#ff5fd2)', background: 'none', border: '2px solid var(--p,#ff5fd2)', borderRadius: 4, padding: '9px 12px', cursor: 'pointer' }}
                          >
                            ✎ EDIT & RESUBMIT
                          </button>
                          {cohortId && (
                            <a href={`/hub/pilot-workshops/${cohortId}?tab=portfolio`} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: 'var(--s,#45d6ff)', textDecoration: 'none', border: '2px solid var(--s,#45d6ff)', borderRadius: 4, padding: '9px 12px' }}>
                              VIEW IN PORTFOLIO ↗
                            </a>
                          )}
                          {onClose && (
                            <button onClick={onClose} className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', background: 'none', border: '2px solid var(--gold,#ffd23f)', borderRadius: 4, padding: '9px 12px', cursor: 'pointer' }}>
                              ◂ BACK
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  // Show the submission form (not yet submitted or in edit mode)
                  return (
                    <div style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 6, padding: 15, background: 'rgba(0,0,0,.22)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                        <div className="font-pixel" style={{ fontSize: 11, color: 'var(--tx,#efe6ff)' }}>
                          {isEditMode ? '✎ EDIT SUBMISSION' : '▚ SUBMISSION CONSOLE'}
                        </div>
                        {isEditMode && (
                          <button 
                            onClick={() => {
                              setIsEditMode(false)
                              setTitle('')
                              setDescription('')
                              setUrl('')
                              setFileToUpload(null)
                            }}
                            className="font-pixel"
                            style={{ fontSize: 12, color: 'var(--mu,#a493c9)', background: 'none', border: '1px solid var(--ln,#3d2668)', borderRadius: 4, padding: '8px 12px', cursor: 'pointer' }}
                          >
                            CANCEL
                          </button>
                        )}
                      </div>
                      
                      {/* Title Input */}
                      <label className="font-pixel" style={{ fontSize: 11, color: 'var(--ok,#74f0a0)', display: 'block', marginBottom: 7 }}>
                        1 · TITLE YOUR DELIVERABLE
                      </label>
                      <input
                        type="text"
                        placeholder="Enter a title for your deliverable..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(0,0,0,.4)',
                          border: '2px solid var(--ln,#3d2668)',
                          borderRadius: 4, color: 'var(--tx,#efe6ff)',
                          fontSize: 18, padding: '12px 14px', marginBottom: 12,
                        }}
                      />
                      
                      {/* Description Input */}
                      <label className="font-pixel" style={{ fontSize: 11, color: 'var(--s,#45d6ff)', display: 'block', marginBottom: 7 }}>
                        2 · DESCRIPTION (OPTIONAL)
                      </label>
                      <textarea
                        placeholder="Describe your deliverable, what you created, and what principle it applies..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(0,0,0,.4)',
                          border: '2px solid var(--ln,#3d2668)',
                          borderRadius: 4, color: 'var(--tx,#efe6ff)',
                          fontSize: 18, padding: '12px 14px', marginBottom: 12,
                          resize: 'vertical',
                        }}
                      />
                      
                      {/* URL/Upload Input */}
                      <label className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', display: 'block', marginBottom: 10, lineHeight: 1.5 }}>
                        3 · {entry.submit_label || 'YOUR DELIVERABLE LINK OR FILE'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, marginBottom: 12, width: '100%', alignItems: 'center' }}>
                        {url.startsWith('blob:') || url.includes('supabase.co/storage') ? (
                          <div style={{
                            minWidth: 0,
                            overflow: 'hidden',
                            background: 'rgba(0,0,0,.4)',
                            border: '2px solid var(--ln,#3d2668)',
                            borderRadius: 4,
                            padding: 6,
                            display: 'grid',
                            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                            alignItems: 'center',
                            gap: 12
                          }}>
                            <img 
                              src={url} 
                              alt="Upload preview" 
                              style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--mu,#a493c9)' }} 
                            />
                            <div style={{ minWidth: 0, color: 'var(--tx,#efe6ff)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fileToUpload?.name || decodeURIComponent(url.split('/').pop()?.split('?')[0] || '') || 'Uploaded Image'}
                            </div>
                            <button
                              onClick={() => { setUrl(''); setFileToUpload(null); }}
                              style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', padding: 4 }}
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <input
                            type="url"
                            placeholder="https://…"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isSubmitting}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'rgba(0,0,0,.4)',
                              border: '2px solid var(--ln,#3d2668)',
                              borderRadius: 4, color: 'var(--tx,#efe6ff)',
                              fontSize: 18, padding: '12px 14px',
                            }}
                          />
                        )}
                        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSubmitting}
                          className="font-pixel" 
                          style={{
                            fontSize: 8,
                            background: 'transparent',
                            border: '2px solid var(--s,#45d6ff)',
                            color: 'var(--s,#45d6ff)',
                            borderRadius: 4,
                            padding: '0 14px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            height: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ↑ UPLOAD
                        </button>
                      </div>
                      
                      <div className="font-pixel" style={{ fontSize: 11, color: 'var(--p,#ff5fd2)', marginBottom: 12, lineHeight: 1.5 }}>
                        4 · Assign <span style={{ color: 'var(--gold,#ffd23f)' }}>a fresh Steward Principle</span>
                        <span style={{ color: 'var(--mu,#a493c9)', marginLeft: 6 }}>(each principle can only be used once)</span>:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                        {principles.map(p => {
                          const isUsedOtherDay = otherDaysBankedIds.includes(p.id)
                          const isPendingOtherDay = !isUsedOtherDay && pendingOtherDayPrincipleIds.includes(p.id)
                          const isCurrentDayPrinciple = p.id === localCurrentDayPrincipleId
                          const isSelected = selectedPrinciple === p.id
                          const isBlocked = isUsedOtherDay || isPendingOtherDay
                          return (
                            <div
                              key={p.id}
                              onClick={() => !isBlocked && setSelectedPrinciple(p.id)}
                              className="font-pixel"
                              title={
                                isUsedOtherDay ? 'Already used in another day' :
                                isPendingOtherDay ? 'Pending approval on another day — select a different principle' :
                                ''
                              }
                              style={{
                                fontSize: 9,
                                padding: '6px 10px',
                                borderRadius: 4,
                                cursor: isBlocked ? 'not-allowed' : 'pointer',
                                background: isSelected ? 'var(--gold,#ffd23f)' : isUsedOtherDay ? 'rgba(0,0,0,.15)' : isPendingOtherDay ? 'rgba(255,160,50,.08)' : 'rgba(0,0,0,.3)',
                                color: isSelected ? '#000' : isUsedOtherDay ? 'var(--ln,#3d2668)' : isPendingOtherDay ? '#ffa032' : 'var(--mu,#a493c9)',
                                border: `1px solid ${isSelected ? 'var(--gold,#ffd23f)' : isUsedOtherDay ? 'var(--ln,#3d2668)' : isPendingOtherDay ? '#ffa032' : 'var(--ln,#3d2668)'}`,
                                opacity: isUsedOtherDay ? 0.4 : isPendingOtherDay ? 0.7 : 1,
                                textDecoration: isUsedOtherDay ? 'line-through' : 'none',
                                position: 'relative',
                              }}
                            >
                              {p.name.toUpperCase()}
                              {isPendingOtherDay && (
                                <span style={{ marginLeft: 5, fontSize: 7, color: '#ffa032' }}>⏳PENDING</span>
                              )}
                            </div>
                          )
                        })}
                        {principles.filter(p => !otherDaysBankedIds.includes(p.id) && !pendingOtherDayPrincipleIds.includes(p.id)).length === 0 && (
                          <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', fontStyle: 'italic' }}>
                            No fresh principles left!
                          </span>
                        )}
                      </div>
                      
                      {/* Showcase Request Checkbox */}
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
                      
                      {(() => {
                        const availableCount = principles.filter(p => !otherDaysBankedIds.includes(p.id) && !pendingOtherDayPrincipleIds.includes(p.id)).length
                        const hasContent = (url.trim() || fileToUpload) && title.trim()
                        const canSubmit = hasContent && (availableCount === 0 || selectedPrinciple)
                        const isDisabled = isSubmitting || !canSubmit
                        
                        return (
                          <button 
                            onClick={handleSubmit}
                            disabled={isDisabled}
                            className="font-pixel" 
                            style={{
                              fontSize: 11, color: 'var(--bg,#12081e)',
                              background: 'var(--gold,#ffd23f)',
                              border: 'none', borderRadius: 5,
                              padding: '12px 20px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                              boxShadow: '0 3px 0 #b8912a',
                              opacity: isDisabled ? 0.5 : 1,
                            }}
                          >
                            {isSubmitting ? 'SUBMITTING...' : '⬢ SUBMIT DELIVERABLE'}
                          </button>
                        )
                      })()}
                    </div>
                  )
                })()}

                {/* Applied + Lab descriptions */}
                {entry.applied && (
                  <div style={{ marginTop: 16, fontSize: 16, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', display: 'block', marginBottom: 6 }}>APPLIED FOCUS</span>
                    <div dangerouslySetInnerHTML={{ __html: entry.applied }} />
                  </div>
                )}
                {entry.lab && (
                  <div style={{ marginTop: 12, fontSize: 16, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                    <span className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', display: 'block', marginBottom: 6 }}>LAB</span>
                    <div dangerouslySetInnerHTML={{ __html: entry.lab }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── MEDIA RAIL (right column in modal, below content when inline) ── */}
          <div style={{
            flex: inline ? 'none' : '2 1 300px', 
            minWidth: 0,
            maxWidth: '100%',
            borderLeft: inline ? 'none' : '2px solid var(--ln,#3d2668)',
            borderTop: inline ? '2px solid var(--ln,#3d2668)' : 'none',
            background: 'rgba(0,0,0,.18)',
            padding: 'clamp(16px,2vw,24px)',
            overflow: 'hidden',
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
                  <div key={m.id} style={{ border: '1px solid var(--ln,#3d2668)', borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,.2)', minWidth: 0 }}>
                    <div style={{ padding: '4px 8px', background: 'var(--pn,#241542)', borderBottom: '1px solid var(--ln,#3d2668)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                      <span className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)' }}>{m.kind.toUpperCase()}</span>
                      {(m.label || m.file_name || m.kind === 'link') && (
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--tx,#efe6ff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.label || m.file_name || (m.kind === 'link' ? m.url : '')}
                        </span>
                      )}
                    </div>
                    {m.kind === 'photo' && m.url && (
                      <div 
                        style={{ position: 'relative', cursor: 'zoom-in', width: '100%' }}
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(m.url) }}
                      >
                        <img src={m.url} alt="" style={{ width: '100%', maxWidth: '100%', display: 'block' }} />
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
                    {m.kind === 'video' && m.url && <video src={m.url} controls style={{ width: '100%', maxWidth: '100%', display: 'block' }} />}
                    {m.kind === 'audio' && m.url && <audio src={m.url} controls style={{ width: '100%', padding: '8px 0' }} />}
                    {m.kind === 'link' && m.url && (() => {
                      // Use the shared isImageUrl helper for better detection
                      const isImage = isImageUrl(m.url);
                      // Check if it's a YouTube link
                      const ytMatch = m.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
                      // Check if it's a Vimeo link
                      const vimeoMatch = m.url.match(/vimeo\.com\/(\d+)/);
                      // Check if it's a direct video file
                      const isDirectVideo = /\.(mp4|webm|mov|avi)(\?|#|$)/i.test(m.url);
                      // Check if it's a direct audio file
                      const isDirectAudio = /\.(mp3|wav|ogg|aac|flac)(\?|#|$)/i.test(m.url);
                      
                      if (isImage) {
                        return (
                          <div 
                            style={{ position: 'relative', cursor: 'zoom-in', width: '100%' }}
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(m.url) }}
                          >
                            <img src={m.url} alt={m.label || ''} style={{ width: '100%', maxWidth: '100%', display: 'block' }} />
                            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 6, display: 'flex' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx,#efe6ff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                              </svg>
                            </div>
                          </div>
                        );
                      } else if (ytMatch) {
                        return (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                            <iframe 
                              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={m.label || 'Video'}
                            />
                          </div>
                        );
                      } else if (vimeoMatch) {
                        return (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                            <iframe 
                              src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              title={m.label || 'Video'}
                            />
                          </div>
                        );
                      } else if (isDirectVideo) {
                        return (
                          <video src={m.url} controls preload="metadata" style={{ width: '100%', maxWidth: '100%', display: 'block' }} />
                        );
                      } else if (isDirectAudio) {
                        return (
                          <audio src={m.url} controls style={{ width: '100%', padding: '8px 0' }} />
                        );
                      } else {
                        return (
                          <div style={{ padding: 10, wordBreak: 'break-all', fontSize: 13, color: 'var(--s,#45d6ff)' }}>
                            <a href={m.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{m.label || m.url}</a>
                          </div>
                        );
                      }
                    })()}
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
      <button
        onClick={(e) => { e.stopPropagation(); setZoomedImage(null) }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.4)',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          zIndex: 10,
        }}
      >
        ✕
      </button>
      <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
    </div>
  )

  const featuredPopup = showFeaturedPopup && (
    <div
      onClick={(e) => { e.stopPropagation(); setShowFeaturedPopup(false) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(8,4,16,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px,3vw,40px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="retro-winpop"
        style={{
          maxWidth: 560,
          width: '100%',
          border: '3px solid var(--ok,#74f0a0)',
          borderRadius: 14,
          background: 'var(--pn,#241542)',
          padding: '22px 26px',
          boxShadow: '0 0 40px rgba(0,0,0,.6)',
        }}
      >
        <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ok,#74f0a0)', letterSpacing: 1, marginBottom: 12 }}>
          ◈ FEATURED CONTRIBUTOR
        </div>
        <div className="font-pixel" style={{ fontSize: 'clamp(13px,2.2vw,16px)', color: 'var(--tx,#efe6ff)', marginBottom: featuredItem ? 6 : 16, lineHeight: 1.5 }}>
          {featuredItem ? featuredItem.title : entry.title}
        </div>
        {featuredItem && (
          <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 16 }}>
            by {featuredItem.author} · {featuredItem.meta}
          </div>
        )}
        <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.55, marginBottom: 20 }}>
          {featuredItem?.blurb ? featuredItem.blurb : (
            entry.note ? <div dangerouslySetInnerHTML={{ __html: entry.note }} /> : 'This is a hand-picked piece from a paid community contributor — explore an approach outside the main curriculum track.'
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(featuredItem?.url || entry.external_video_url) && (
            <a
              href={featuredItem?.url || entry.external_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel"
              style={{
                fontSize: 10,
                color: 'var(--bg,#12081e)',
                background: 'var(--ok,#74f0a0)',
                border: 'none',
                borderRadius: 6,
                padding: '12px 18px',
                textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 4px 0 #4da06a',
              }}
            >
              ▸ OPEN MEDIA
            </a>
          )}
          {featuredItem?.content_item_id && (
            <a
              href={`/hub/library/${featuredItem.content_item_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel"
              style={{
                fontSize: 10,
                color: '#FEFAE0',
                background: '#2E5534',
                border: 'none',
                borderRadius: 6,
                padding: '12px 18px',
                textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 4px 0 #1d3a23',
              }}
            >
              ▸ OPEN IN LIBRARY
            </a>
          )}
          <button
            onClick={() => setShowFeaturedPopup(false)}
            className="font-pixel"
            style={{
              fontSize: 10,
              color: 'var(--tx,#efe6ff)',
              background: 'rgba(0,0,0,.4)',
              border: '2px solid var(--ln,#3d2668)',
              borderRadius: 6,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            ◂ CLOSE
          </button>
        </div>
      </div>
    </div>
  )

  if (inline) {
    return (
      <>
        {innerContent}
        {zoomModal}
        {featuredPopup}
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
      {featuredPopup}
    </div>
  )
}
