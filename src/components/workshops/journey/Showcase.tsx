'use client'

import React, { useState, useMemo, useEffect } from 'react'
import type { WorkshopShowcase, WorkshopEngagement } from '@/types/workshops'
import { getAllGenerations } from '@/app/actions/workshops/engagement'
import { getStudentShowcaseDeliverables } from '@/app/actions/workshops/showcase'

/* ── local item shape ── */
interface ShowcaseItem {
  id: string
  type: 'video' | 'article' | 'audio' | 'aigen'
  title: string
  author: string
  meta: string
  paid: boolean
  blurb: string
  theme: string
  thumb: string
  url?: string
}

/* ── type→color mapping ── */
const TYPE_COLOR: Record<string, string> = {
  video: '#45d6ff',
  article: '#ffd23f',
  audio: '#ff5fd2',
  aigen: '#74f0a0',
}

const TYPE_LABEL: Record<string, string> = {
  video: '▶ VIDEO',
  article: '✎ ARTICLE',
  audio: '♫ AUDIO',
  aigen: '✦ AI GEN',
}

/* ── filter tabs ── */
interface FilterTab {
  key: string
  label: string
  typeFilter: string | null
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'ALL', typeFilter: null },
  { key: 'video', label: 'VIDEO LESSONS', typeFilter: 'video' },
  { key: 'article', label: 'ARTICLES', typeFilter: 'article' },
  { key: 'audio', label: 'AUDIO GUIDES', typeFilter: 'audio' },
  { key: 'aigen', label: 'AI GENERATIONS', typeFilter: 'aigen' },
]

/* ── props ── */
interface ShowcaseProps {
  showcaseItems?: WorkshopShowcase[]
  engagements?: WorkshopEngagement[]
  onBookmark?: (key: string, title: string, source: string, url?: string) => void
  cohortId?: string
  onlyStudents?: boolean
  onlyContributors?: boolean
}

/* ═══════════════════════════════════════════════════════════════
   Showcase Component
   ═══════════════════════════════════════════════════════════════ */
export default function Showcase({ showcaseItems = [], engagements = [], onBookmark, cohortId, onlyStudents = false, onlyContributors = false }: ShowcaseProps) {
  const [viewModeState, setViewModeState] = useState<'contributors' | 'students'>('contributors')
  const activeViewMode = onlyStudents ? 'students' : onlyContributors ? 'contributors' : viewModeState
  const [filter, setFilter] = useState<string>('all')
  const [preview, setPreview] = useState<string | null>(null)
  const [studentDetail, setStudentDetail] = useState<any | null>(null)
  
  // Student showcase data
  const [studentItems, setStudentItems] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  useEffect(() => {
    if (activeViewMode === 'students' && cohortId && studentItems.length === 0) {
      setStudentsLoading(true)
      
      Promise.all([
        getAllGenerations(cohortId),
        getStudentShowcaseDeliverables(cohortId)
      ]).then(([engs, delivs]) => {
        const approvedEngs = engs.filter((e: any) => {
          try {
            const data = JSON.parse(e.content || '{}');
            return data.showcaseVisible === true;
          } catch(err) {
            return false;
          }
        });
        
        // delivs already pre-filtered for showcase and structured like engagements
        setStudentItems([...approvedEngs, ...delivs]);
        setStudentsLoading(false);
      }).catch(err => {
        console.error(err);
        setStudentsLoading(false);
      });
    }
  }, [activeViewMode, cohortId, studentItems.length])

  const allItems = useMemo<ShowcaseItem[]>(() => {
    const dbItems: ShowcaseItem[] = showcaseItems.map(s => ({
      id: s.id,
      type: s.type as any,
      title: s.title,
      author: s.author || 'Anonymous',
      meta: s.meta || (s.is_paid ? 'Paid content' : 'Free content'),
      paid: s.is_paid,
      blurb: s.blurb || '',
      theme: s.theme || 'Community',
      thumb: '',
      url: s.url
    }))
    return dbItems
  }, [showcaseItems])

  /* derived */
  const filtered = useMemo(() => {
    const tab = FILTER_TABS.find(t => t.key === filter)
    if (!tab || !tab.typeFilter) return allItems
    return allItems.filter(c => c.type === tab.typeFilter)
  }, [filter, allItems])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: allItems.length }
    allItems.forEach(c => { m[c.type] = (m[c.type] || 0) + 1 })
    return m
  }, [allItems])

  const isBookmarked = (item: ShowcaseItem) =>
    engagements.some(e => e.kind === 'bookmark' && e.title === item.title && e.status !== 'rejected')

  const previewItem = useMemo(() =>
    preview ? allItems.find(c => c.id === preview) ?? null : null
  , [preview, allItems])

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* Master Toggle */}
      {!onlyStudents && !onlyContributors && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <button
            onClick={() => setViewModeState('contributors')}
            className="font-pixel"
            style={{
              padding: '10px 16px', fontSize: 16, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${activeViewMode === 'contributors' ? 'var(--gold,#ffd23f)' : 'var(--ln,#3d2668)'}`,
              background: activeViewMode === 'contributors' ? 'rgba(255,210,63,.1)' : 'transparent',
              color: activeViewMode === 'contributors' ? 'var(--gold,#ffd23f)' : 'var(--mu,#a493c9)'
            }}
          >
            CONTRIBUTORS
          </button>
          <button
            onClick={() => setViewModeState('students')}
            className="font-pixel"
            style={{
              padding: '10px 16px', fontSize: 16, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${activeViewMode === 'students' ? '#ff5fd2' : 'var(--ln,#3d2668)'}`,
              background: activeViewMode === 'students' ? 'rgba(255,95,210,.1)' : 'transparent',
              color: activeViewMode === 'students' ? '#ff5fd2' : 'var(--mu,#a493c9)'
            }}
          >
            STUDENTS
          </button>
        </div>
      )}

      {activeViewMode === 'contributors' && !onlyStudents && (
        <>
          {/* ═══ Header Banner ═══ */}
          <div style={{
        border: '2px solid var(--gold,#ffd23f)',
        borderRadius: 12,
        padding: 'clamp(14px,2.2vw,22px)',
        background: 'linear-gradient(180deg,rgba(255,210,63,.07),rgba(255,210,63,.02))',
        boxShadow: '0 0 24px rgba(255,210,63,.08)',
      }}>
        <h2 className="font-pixel" style={{
          fontSize: 'clamp(12px,1.8vw,18px)',
          color: 'var(--gold,#ffd23f)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          ★ FRIENDS &amp; CONTRIBUTORS SHOWCASE LIBRARY
        </h2>
        <p style={{
          fontSize: 15,
          color: 'var(--mu,#a493c9)',
          margin: '8px 0 0',
          lineHeight: 1.55,
        }}>
          Curated lessons, articles, audio guides, and AI-generated packs from community
          contributors, partner educators, and the StewardWorks AI Lab.
          Bookmark items to your desk for quick reference during workshops.
        </p>
      </div>

      {/* ═══ Filter Tabs ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '18px 0' }}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab.key
          const count = tab.typeFilter ? (counts[tab.typeFilter] || 0) : counts.all
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="font-pixel"
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                padding: '11px 18px',
                borderRadius: 6,
                border: `2px solid var(--s,#45d6ff)`,
                background: active ? 'var(--s,#45d6ff)' : 'transparent',
                color: active ? '#12081e' : 'var(--s,#45d6ff)',
                cursor: 'pointer',
                transition: 'all .15s',
                letterSpacing: '.5px',
              }}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ═══ Card Grid ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
        gap: 14,
      }}>
        {filtered.map(item => (
          <ContributionCard
            key={item.id}
            item={item}
            bookmarked={isBookmarked(item)}
            onOpen={() => setPreview(item.id)}
            onBookmark={() => onBookmark && onBookmark('contrib-' + item.id, item.title, 'Showcase · ' + item.theme, item.url || undefined)}
          />
        ))}

        {/* ═══ Become a Contributor CTA ═══ */}
        <div style={{
          border: '2px dashed var(--p,#ff5fd2)',
          borderRadius: 8,
          background: 'rgba(255,95,210,.05)',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 22,
          gap: 10,
        }}>
          <span className="font-pixel" style={{
            fontSize: 11,
            color: 'var(--p,#ff5fd2)',
            lineHeight: 1.6,
          }}>
            ✎ BECOME A CONTRIBUTOR
          </span>
          <p style={{
            fontSize: 14,
            color: 'var(--mu,#a493c9)',
            margin: 0,
            lineHeight: 1.55,
          }}>
            Share your lessons, audio guides, articles, or AI-generated content
            with the community. All submissions are reviewed by the StewardWorks team.
          </p>
        </div>
      </div>
      </>
      )}

      {activeViewMode === 'students' && !onlyContributors && (
        <>
          {/* ═══ Header Banner ═══ */}
          <div style={{
            border: '2px solid #ff5fd2',
            borderRadius: 12,
            padding: 'clamp(14px,2.2vw,22px)',
            background: 'linear-gradient(180deg,rgba(255,95,210,.07),rgba(255,95,210,.02))',
            boxShadow: '0 0 24px rgba(255,95,210,.08)',
          }}>
            <h2 className="font-pixel" style={{
              fontSize: 'clamp(12px,1.8vw,18px)',
              color: '#ff5fd2',
              margin: 0,
              lineHeight: 1.5,
            }}>
              ★ STUDENT SHOWCASE LIBRARY
            </h2>
            <p style={{
              fontSize: 15,
              color: 'var(--mu,#a493c9)',
              margin: '8px 0 0',
              lineHeight: 1.55,
            }}>
              Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.
            </p>
          </div>

          {studentsLoading ? (
            <div className="p-8 text-center font-pixel" style={{ color: '#ff5fd2', marginTop: 40 }}>LOADING SHOWCASE...</div>
          ) : studentItems.length === 0 ? (
            <div className="p-12 text-center font-pixel" style={{ color: '#ff5fd2', border: '2px dashed rgba(255,95,210,0.3)', borderRadius: 12, marginTop: 20 }}>
              The Student Showcase is currently empty.<br /><br />
              <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)' }}>Generations will appear here when approved by the instructor.</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
              gap: 13,
              marginTop: 18
            }}>
              {studentItems.map(item => {
                const isItemBookmarked = engagements.some(e => e.kind === 'bookmark' && e.title === item.title && e.status !== 'rejected');
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setStudentDetail(item)}
                    style={{ 
                      border: '2px solid var(--ln,#28432f)', 
                      borderRadius: 9, 
                      overflow: 'hidden', 
                      background: 'var(--pn,#14211b)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <div 
                      style={{ 
                        height: 120, 
                        background: 'linear-gradient(135deg, rgba(255,95,210,0.2), rgba(255,95,210,0.05))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {item.url && (item.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || item.url.includes('/storage/v1/object/public/')) ? (
                        <img 
                          src={item.url} 
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: 40, opacity: 0.2, color: '#ff5fd2' }}>✦</span>
                      )}
                    </div>
                    <div style={{ padding: '11px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {/* Left: content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span className="font-pixel" style={{ 
                            fontSize: 7, 
                            padding: '3px 7px', 
                            borderRadius: 4, 
                            background: '#ff5fd2', 
                            color: '#0e1512',
                            letterSpacing: '.5px'
                          }}>
                            {item.kind === 'generation' ? '✦ AI GEN' : '◎ MEDIA'}
                          </span>
                          <span className="font-pixel" style={{ 
                            fontSize: 7, 
                            padding: '3px 7px', 
                            borderRadius: 4, 
                            background: 'rgba(77,255,160,.15)', 
                            color: '#4dffa0',
                            border: '1px solid rgba(77,255,160,.3)'
                          }}>
                            {item.source || 'EDEN'}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: 16, color: 'var(--tx,#d6ffe0)', lineHeight: 1.2, marginBottom: 5 }}>
                          {item.title}
                        </div>
                        
                        <div style={{ fontSize: 13, color: 'var(--mu,#77b78d)', marginTop: 5 }}>
                          by {item.profiles?.full_name || 'Student'}
                        </div>
                      </div>

                      {/* Right: bookmark star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBookmark) {
                            onBookmark('student-' + item.id, item.title, item.source || 'Student Showcase', item.url || undefined);
                          }
                        }}
                        title={isItemBookmarked ? 'Already bookmarked' : 'Bookmark this creation'}
                        style={{
                          flex: 'none',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: `2px solid ${isItemBookmarked ? '#ffd23f' : 'var(--ln,#28432f)'}`,
                          background: isItemBookmarked ? 'rgba(255,210,63,.2)' : 'transparent',
                          color: isItemBookmarked ? '#ffd23f' : 'var(--mu,#77b78d)',
                          cursor: 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          boxShadow: isItemBookmarked ? '0 0 8px rgba(255,210,63,.3)' : 'none',
                          marginTop: 2,
                        }}
                      >
                        {isItemBookmarked ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Student Detail Popup */}
          {studentDetail && (
            <div 
              onClick={() => setStudentDetail(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 60,
                background: 'rgba(6,12,9,.82)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}
            >
              <div 
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: 440,
                  width: '100%',
                  border: '2px solid #ff5fd2',
                  borderRadius: 12,
                  background: 'var(--pn,#14211b)',
                  boxShadow: '0 24px 60px rgba(0,0,0,.6), 0 0 30px rgba(255,95,210,.25)',
                  animation: 'popin .22s ease',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '16px 18px' }}>
                  {/* Header with tags and close button */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 13 }}>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      <span className="font-pixel" style={{ 
                        fontSize: 7, 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        background: '#ff5fd2', 
                        color: '#0e1512'
                      }}>
                        {studentDetail.kind === 'generation' ? '✦ AI GEN' : '◎ MEDIA'}
                      </span>
                      <span className="font-pixel" style={{ 
                        fontSize: 7, 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        background: 'rgba(77,255,160,.15)', 
                        color: '#4dffa0',
                        border: '1px solid rgba(77,255,160,.3)'
                      }}>
                        {studentDetail.source || 'EDEN'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setStudentDetail(null)}
                      title="Close"
                      style={{
                        width: 28,
                        height: 28,
                        flex: 'none',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,.3)',
                        color: 'var(--mu,#77b78d)',
                        fontSize: 16,
                        cursor: 'pointer',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div style={{
                    height: 180,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(255,95,210,0.2), rgba(255,95,210,0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--ln,#28432f)'
                  }}>
                    {studentDetail.url && (studentDetail.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || studentDetail.url.includes('/storage/v1/object/public/')) ? (
                      <img 
                        src={studentDetail.url} 
                        alt={studentDetail.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 60, opacity: 0.2, color: '#ff5fd2' }}>✦</span>
                    )}
                  </div>

                  {/* Title and author */}
                  <div className="font-pixel" style={{ 
                    fontSize: 12, 
                    color: 'var(--tx,#d6ffe0)', 
                    lineHeight: 1.5, 
                    margin: '15px 0 7px' 
                  }}>
                    {studentDetail.title}
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--mu,#77b78d)' }}>
                    by {studentDetail.profiles?.full_name || 'Student'}
                  </div>

                  {/* In Showcase badge */}
                  <div style={{ marginTop: 9 }}>
                    <span className="font-pixel" style={{ fontSize: 7, color: '#ff5fd2' }}>
                      ★ IN STUDENT SHOWCASE
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 17 }}>
                    {studentDetail.url && (
                      <a 
                        href={studentDetail.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-pixel"
                        style={{
                          fontSize: 8,
                          color: 'var(--bg,#0e1512)',
                          background: 'var(--ng,#4dffa0)',
                          textDecoration: 'none',
                          borderRadius: 5,
                          padding: '11px 14px'
                        }}
                      >
                        ↗ VISIT CREATION
                      </a>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBookmark) {
                          onBookmark('student-' + studentDetail.id, studentDetail.title, studentDetail.source || 'Student Showcase', studentDetail.url || undefined);
                        }
                        setStudentDetail(null);
                      }}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '#0e1512' : '#45d6ff',
                        background: engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '#45d6ff' : 'transparent',
                        border: '2px solid #45d6ff',
                        borderRadius: 5,
                        padding: '11px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      {engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '★ BOOKMARKED' : '☆ BOOKMARK'}
                    </button>
                    <button 
                      onClick={() => setStudentDetail(null)}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: 'var(--mu,#77b78d)',
                        background: 'none',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 5,
                        padding: '11px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ Preview Modal ═══ */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          bookmarked={isBookmarked(previewItem)}
          onClose={() => setPreview(null)}
          onBookmark={() => onBookmark && onBookmark('contrib-' + previewItem.id, previewItem.title, 'Showcase · ' + previewItem.theme, previewItem.url || undefined)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ContributionCard
   ═══════════════════════════════════════════════════════════════ */
function ContributionCard({ item, bookmarked, onOpen, onBookmark }: {
  item: ShowcaseItem
  bookmarked: boolean
  onOpen: () => void
  onBookmark: () => void
}) {
  const clr = TYPE_COLOR[item.type] || '#45d6ff'

  return (
    <div style={{
      border: '2px solid var(--ln,#3d2668)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--pn,#241542)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* thumbnail area */}
      <div style={{
        height: 132,
        background: `linear-gradient(135deg,${clr}22,${clr}08)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* type icon placeholder */}
        <span style={{ fontSize: 38, opacity: .18, color: clr }}>
          {item.type === 'video' ? '▶' : item.type === 'audio' ? '♫' : item.type === 'aigen' ? '✦' : '✎'}
        </span>

        {/* type badge */}
        <span className="font-pixel" style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 7,
          padding: '3px 7px',
          borderRadius: 4,
          background: clr,
          color: '#12081e',
          letterSpacing: '.5px',
        }}>
          {TYPE_LABEL[item.type]}
        </span>

        {/* paid badge */}
        {item.paid && (
          <span className="font-pixel" style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 7,
            padding: '3px 7px',
            borderRadius: 4,
            background: 'rgba(255,210,63,.18)',
            color: 'var(--gold,#ffd23f)',
            border: '1px solid rgba(255,210,63,.3)',
          }}>
            ★ PREMIUM
          </span>
        )}
      </div>

      {/* content area */}
      <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 className="font-pixel" style={{
          fontSize: 10,
          color: '#fff',
          margin: 0,
          lineHeight: 1.6,
        }}>
          {item.title}
        </h3>

        <span style={{ fontSize: 15, color: 'var(--mu,#a493c9)' }}>
          {item.author} · {item.meta}
        </span>

        <p style={{
          fontSize: 15,
          color: '#fff',
          margin: 0,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.blurb}
        </p>

        <span style={{ fontSize: 12, color: 'var(--s,#45d6ff)', marginTop: 2 }}>
          ◈ Library · {item.theme}
        </span>

        {/* button row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button
            onClick={onOpen}
            className="font-pixel"
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: 'bold',
              padding: '7px 10px',
              borderRadius: 5,
              border: 'none',
              background: 'var(--s,#45d6ff)',
              color: '#12081e',
              cursor: 'pointer',
              letterSpacing: '.5px',
            }}
          >
            OPEN SAMPLE ▸
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onBookmark() }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 5,
              border: '2px solid var(--s,#45d6ff)',
              background: bookmarked ? 'var(--s,#45d6ff)' : 'transparent',
              color: bookmarked ? '#12081e' : 'var(--s,#45d6ff)',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PreviewModal
   ═══════════════════════════════════════════════════════════════ */
function PreviewModal({ item, bookmarked, onClose, onBookmark }: {
  item: ShowcaseItem
  bookmarked: boolean
  onClose: () => void
  onBookmark: () => void
}) {
  const clr = TYPE_COLOR[item.type] || '#45d6ff'

  /* deterministic "random" heights for waveform bars */
  const waveHeights = useMemo(() =>
    Array.from({ length: 34 }, (_, i) => {
      const seed = ((i + 1) * 2654435761) >>> 0
      return 8 + (seed % 34)
    })
  , [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(6,3,14,.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '88vh',
          overflowY: 'auto',
          border: '2px solid var(--ln,#3d2668)',
          borderRadius: 12,
          background: 'var(--pn,#241542)',
          position: 'relative',
        }}
      >
        {/* header image */}
        <div style={{
          height: 150,
          background: `linear-gradient(135deg,${clr}33,${clr}0a)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 52, opacity: .14, color: clr }}>
            {item.type === 'video' ? '▶' : item.type === 'audio' ? '♫' : item.type === 'aigen' ? '✦' : '✎'}
          </span>

          {/* type badge */}
          <span className="font-pixel" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontSize: 7,
            padding: '3px 8px',
            borderRadius: 4,
            background: clr,
            color: '#12081e',
          }}>
            {TYPE_LABEL[item.type]}
          </span>

          {/* close btn */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: 6,
              border: '2px solid var(--ln,#3d2668)',
              background: 'var(--pn,#241542)',
              color: 'var(--tx,#efe6ff)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* content */}
        <div style={{ padding: '18px 22px 22px' }}>
          {/* theme tag */}
          <span style={{ fontSize: 12, color: 'var(--s,#45d6ff)' }}>
            ◈ Library · {item.theme}
          </span>

          <h2 className="font-pixel" style={{
            fontSize: 13,
            color: '#fff',
            margin: '10px 0 4px',
            lineHeight: 1.6,
          }}>
            {item.title}
          </h2>

          <p style={{
            fontSize: 15,
            color: 'var(--mu,#a493c9)',
            margin: '0 0 16px',
          }}>
            {item.author} · {item.meta}
          </p>

          {/* ── type-specific preview ── */}
          {item.type === 'video' && <VideoPreview clr={clr} />}
          {item.type === 'audio' && <AudioPreview clr={clr} waveHeights={waveHeights} />}

          {/* blurb */}
          <p style={{
            fontSize: 16,
            color: '#fff',
            lineHeight: 1.6,
            margin: '16px 0 20px',
          }}>
            {item.blurb}
          </p>

          {/* action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pixel"
                style={{
                  fontSize: 9,
                  padding: '10px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--s,#45d6ff)',
                  color: '#12081e',
                  cursor: 'pointer',
                  letterSpacing: '.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ↗ VIEW CREATION
              </a>
            )}
            <button
              onClick={() => {
                // Navigate to library with "How to Use AI" category pre-selected
                window.location.href = '/hub/library?category=how-to-use-ai'
              }}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '10px 18px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--gold,#ffd23f)',
                color: '#12081e',
                cursor: 'pointer',
                letterSpacing: '.5px',
              }}
            >
              ▶ OPEN IN LIBRARY ↗
            </button>

            <button
              onClick={onBookmark}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '10px 18px',
                borderRadius: 6,
                border: '2px solid var(--s,#45d6ff)',
                background: bookmarked ? 'var(--s,#45d6ff)' : 'transparent',
                color: bookmarked ? '#12081e' : 'var(--s,#45d6ff)',
                cursor: 'pointer',
                letterSpacing: '.5px',
              }}
            >
              {bookmarked ? '★ BOOKMARKED' : '＋ BOOKMARK TO MY DESK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Video fake player ── */
function VideoPreview({ clr }: { clr: string }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      background: `linear-gradient(135deg,${clr}18,${clr}06)`,
      height: 180,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${clr}33`,
      marginBottom: 4,
    }}>
      {/* play triangle */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '22px solid #fff',
        borderTop: '14px solid transparent',
        borderBottom: '14px solid transparent',
        opacity: .7,
      }} />
      {/* SAMPLE CLIP label */}
      <span className="font-pixel" style={{
        position: 'absolute',
        bottom: 10,
        left: 12,
        fontSize: 7,
        color: clr,
        opacity: .8,
        letterSpacing: '.5px',
      }}>
        SAMPLE CLIP
      </span>
    </div>
  )
}

/* ── Audio waveform ── */
function AudioPreview({ clr, waveHeights }: { clr: string; waveHeights: number[] }) {
  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${clr}33`,
      background: `linear-gradient(135deg,${clr}12,${clr}04)`,
      padding: '16px 14px',
      marginBottom: 4,
    }}>
      {/* waveform bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 44,
        marginBottom: 10,
      }}>
        {waveHeights.map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: h,
            borderRadius: 2,
            background: clr,
            opacity: .55,
          }} />
        ))}
      </div>

      {/* play button + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${clr}`,
          background: 'transparent',
          color: clr,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
        }}>
          ▶
        </button>
        <div style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '35%',
            height: '100%',
            borderRadius: 2,
            background: clr,
          }} />
        </div>
        <span className="font-pixel" style={{ fontSize: 7, color: clr, opacity: .7 }}>
          0:00
        </span>
      </div>
    </div>
  )
}

/* ── AI-gen grid ── */
function AiGenPreview({ clr }: { clr: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 6,
      marginBottom: 4,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          aspectRatio: '1',
          borderRadius: 6,
          background: `linear-gradient(${135 + i * 30}deg,${clr}22,${clr}08)`,
          border: `1px solid ${clr}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18, opacity: .15, color: clr }}>✦</span>
        </div>
      ))}
    </div>
  )
}
