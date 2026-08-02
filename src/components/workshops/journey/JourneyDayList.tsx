'use client'

import React, { useState } from 'react'
import type { WorkshopCharacter, DayWithSections, WorkshopProgress } from '@/types/workshops'
import ArtifactReader from './ArtifactReader'
import { buildIconUri } from './PixelSprite'
import { MAP_ICONS } from './character-data'

interface JourneyDayListProps {
  character: WorkshopCharacter
  day: DayWithSections
  onBack: () => void
  onSceneView: () => void
  progressRows: WorkshopProgress[]
  cohortId: string
  onBookmark?: (key: string, title: string, source: string, url?: string) => void
  bookmarkedUrls?: string[]
  defaultTopicId?: string | null
  days?: DayWithSections[]
  activeDay?: number
  daysComplete?: number
  onChangeDay?: (dayNum: number) => void
  principles?: any[]
  bankedPrincipleIds?: string[]
  bankedPrinciples?: any[]        // approved-only, full objects { progress_id, principle_id }
  allBankedPrinciples?: any[]     // submitted+approved, for pending detection in the picker
  submissions?: any[]
  onDeliverableSubmitted?: (msg: string, shouldOpenVictory?: boolean) => void
  userRole?: string
}

function secColor(a: string) {
  return { A: 'var(--p,#ff5fd2)', B: 'var(--s,#45d6ff)', C: 'var(--gold,#ffd23f)' }[a] || 'var(--s,#45d6ff)'
}

export default function JourneyDayList({
  character,
  day,
  onBack,
  onSceneView,
  progressRows,
  cohortId,
  onBookmark,
  bookmarkedUrls = [],
  defaultTopicId = null,
  days = [],
  activeDay = 1,
  daysComplete = 0,
  onChangeDay,
  principles = [],
  bankedPrincipleIds = [],
  bankedPrinciples = [],
  allBankedPrinciples = [],
  submissions = [],
  onDeliverableSubmitted,
  userRole = 'participant'
}: JourneyDayListProps) {
  // Get all entries flat
  const allEntries = day.sections?.flatMap(s => s.entries?.map(e => ({
    ...e,
    sectionTitle: s.title,
    sectionKey: s.section_key,
    hour: s.title
  }))) || []

  const [activeEntry, setActiveEntry] = useState<any>(() => {
    if (defaultTopicId) {
      const match = allEntries.find(e => e.id === defaultTopicId)
      if (match) return match
    }
    return null
  })

  // When the day changes, clear the active entry if it no longer belongs to the new day
  React.useEffect(() => {
    if (activeEntry) {
      const stillExists = allEntries.some(e => e.id === activeEntry.id)
      if (!stillExists) {
        setActiveEntry(null)
      }
    }
  }, [day.id])

  const accent = character?.accent_color || '#45d6ff'
  const dayIconUri = buildIconUri(MAP_ICONS.tent, accent) // Simplified icon

  return (
    <div style={{ padding: '4px clamp(12px,3vw,26px) clamp(14px,3vw,30px)', width: '100%', boxSizing: 'border-box' }}>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <button onClick={onBack} className="font-pixel" style={{ fontSize: 11, color: 'var(--s,#45d6ff)', background: 'none', border: '2px solid var(--ln,#3d2668)', borderRadius: 5, padding: '8px 14px', cursor: 'pointer', flex: 'none', transition: 'all 0.2s' }}>
          ◂ MAP
        </button>
        <button onClick={onSceneView} className="font-pixel" style={{ fontSize: 11, color: 'var(--p,#ff5fd2)', background: 'rgba(255,95,210,.08)', border: '2px solid var(--p,#ff5fd2)', borderRadius: 5, padding: '8px 14px', cursor: 'pointer', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 12px rgba(255,95,210,.18)', transition: 'all 0.2s' }}>
          -  GAME VIEW
        </button>
        
        {/* Day Navigation */}
        {days.length > 0 && onChangeDay && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {days.map((d) => {
              const isActive = d.day_number === activeDay;
              // Guests can access all days freely (no deliverable requirement)
              const isLocked = userRole === 'guest' ? false : d.day_number > daysComplete + 1;
              return (
                <button
                  key={d.id}
                  disabled={isLocked}
                  onClick={() => onChangeDay(d.day_number)}
                  className="font-pixel"
                  style={{
                    fontSize: 11,
                    padding: '8px 14px',
                    borderRadius: 5,
                    border: isActive ? '2px solid var(--gold,#ffd23f)' : '2px solid var(--ln,#3d2668)',
                    background: isActive ? 'rgba(255,210,63,.1)' : 'transparent',
                    color: isLocked ? '#666' : isActive ? 'var(--gold,#ffd23f)' : '#efe6ff',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isLocked ? 0.5 : 1
                  }}
                >
                  DAY {d.day_number}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Single-column Master List ── */}
      <div style={{ display: 'flex', width: '100%', minHeight: 'min(70vh, 600px)', border: '3px solid var(--ln,#3d2668)', borderRadius: 14, overflow: 'hidden', background: '#181024' }}>
        
        {/* Master List (Full Width) */}
        <div style={{ flex: 1, width: '100%', background: 'rgba(0,0,0,.16)', overflow: 'auto' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(255,95,210,.14), transparent)', borderBottom: '2px solid var(--ln,#3d2668)', padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={dayIconUri} alt="" width="46" height="46" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 10px var(--p,#ff5fd2))', flex: 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', marginBottom: 6 }}>DAY 0{day.day_number}</div>
                <div className="font-pixel" style={{ fontSize: 12, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>{day.title}</div>
              </div>
            </div>
            <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 12, lineHeight: 1.35 }}>{day.intro}</div>
          </div>

          <div style={{ padding: '16px 14px 20px' }}>
            <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', marginBottom: 14, paddingLeft: 4 }}>SESSIONS</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {day.sections?.map(sec => (
                <div key={sec.id}>
                  <div className="font-pixel" style={{ fontSize: 7, color: secColor(sec.section_key), marginBottom: 10, paddingLeft: 4 }}>{sec.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sec.entries?.map((it, idx) => {
                      const isActive = activeEntry?.id === it.id
                      const tCol = secColor(sec.section_key)
                      return (
                        <div key={it.id} style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setActiveEntry({ ...it, sectionTitle: sec.title, sectionKey: sec.section_key, hour: sec.title })}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
                              background: isActive ? 'rgba(255,255,255,.07)' : 'transparent',
                              border: `1px solid ${isActive ? tCol : 'var(--ln,#3d2668)'}`,
                              borderRadius: 8, padding: '10px 12px',
                              cursor: 'pointer', textAlign: 'left',
                              boxShadow: isActive ? `0 0 12px ${tCol}33` : 'none',
                            }}
                          >
                            <div className="font-pixel" style={{ fontSize: 9, color: isActive ? tCol : 'var(--mu,#a493c9)', marginTop: 2, flex: 'none' }}>0{idx + 1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="font-pixel" style={{ fontSize: 10, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {it.title}
                              </div>
                              <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {it.subtitle || it.entry_type}
                              </div>
                            </div>
                            <div className="font-pixel" style={{ fontSize: 8, color: isActive ? tCol : 'var(--ln,#3d2668)', flex: 'none' }}>›</div>
                          </button>
                          {onBookmark && (() => {
                            // Build the unique URL for this entry and check if it's bookmarked
                            const entryUrl = `/hub/pilot-workshops/${cohortId}/journey?day=${day.day_number}&topic=${it.id}`
                            const isBookmarked = bookmarkedUrls.some(url => url.includes(`topic=${it.id}`))
                            return (
                              <button
                                onClick={() => onBookmark(`${day.id}-${it.id}`, it.title, `Day ${day.day_number}: ${sec.title}`, entryUrl)}
                                title={isBookmarked ? "Already bookmarked" : "Bookmark this lesson"}
                                className="font-pixel"
                                style={{
                                  fontSize: 12,
                                  color: isBookmarked ? 'var(--gold,#ffd23f)' : 'var(--mu,#a493c9)',
                                  background: isBookmarked ? 'rgba(255,210,63,.15)' : 'transparent',
                                  border: isBookmarked ? '1px solid var(--gold,#ffd23f)' : '1px solid var(--ln,#3d2668)',
                                  borderRadius: 6,
                                  padding: '8px 10px',
                                  cursor: 'pointer',
                                  flex: 'none',
                                  transition: 'all 0.2s',
                                  boxShadow: isBookmarked ? '0 0 8px rgba(255,210,63,.3)' : 'none',
                                }}
                              >
                                {isBookmarked ? '★' : '☆'}
                              </button>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Artifact Reader modal ── */}
      {activeEntry && (
        <ArtifactReader
          key={`${day.id}-${activeEntry.id}`}
          entry={activeEntry}
          dayId={day.id}
          dayNumber={day.day_number}
          scene={{ label: `ACT ${day.day_number}` }}
          accent={accent}
          onClose={() => setActiveEntry(null)}
          cohortId={cohortId}
          progressRows={progressRows}
          principles={principles}
          bankedPrincipleIds={bankedPrincipleIds}
          currentDayPrincipleId={(() => {
            // Find the progress row for this specific day
            const dayProgress = progressRows.find(p => p.workshop_day_id === day.id)
            if (!dayProgress) return null
            // Use allBankedPrinciples (submitted+approved) so pending submissions also show their principle
            const bankedMatch = allBankedPrinciples.find((bp: any) => bp.progress_id === dayProgress.id)
            return bankedMatch?.principle_id || null
          })()}
          submissions={submissions}
          allBankedPrinciples={allBankedPrinciples}
          onDeliverableSubmitted={onDeliverableSubmitted}
          userRole={userRole}
          onBookmark={onBookmark}
          isBookmarked={bookmarkedUrls.some(u => u.includes(`topic=${activeEntry.id}`))}
        />
      )}
    </div>
  )
}



