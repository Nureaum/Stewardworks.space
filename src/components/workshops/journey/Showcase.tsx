'use client'

import React, { useState, useMemo } from 'react'
import type { WorkshopShowcase, WorkshopEngagement } from '@/types/workshops'

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
  showcaseItems: WorkshopShowcase[]
  engagements: WorkshopEngagement[]
  onBookmark: (key: string, title: string, source: string, url?: string) => void
}

/* ═══════════════════════════════════════════════════════════════
   Showcase Component
   ═══════════════════════════════════════════════════════════════ */
export default function Showcase({ showcaseItems, engagements, onBookmark }: ShowcaseProps) {
  const [filter, setFilter] = useState<string>('all')
  const [preview, setPreview] = useState<string | null>(null)

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
                fontSize: 9,
                padding: '7px 14px',
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
            onBookmark={() => onBookmark('contrib-' + item.id, item.title, 'Showcase · ' + item.theme, item.url || undefined)}
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

      {/* ═══ Preview Modal ═══ */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          bookmarked={isBookmarked(previewItem)}
          onClose={() => setPreview(null)}
          onBookmark={() => onBookmark('contrib-' + previewItem.id, previewItem.title, 'Showcase · ' + previewItem.theme, previewItem.url || undefined)}
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
            <button
              onClick={() => {
                if (item.url) {
                  let finalUrl = item.url
                  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                    finalUrl = 'https://' + finalUrl
                  }
                  window.open(finalUrl, '_blank')
                } else {
                  alert('No external link provided for this item.')
                }
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
              ▶ OPEN FULL IN LIBRARY ↗
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
