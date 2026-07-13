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
  cohortId
}: JourneyDayListProps) {
  // Get all entries flat
  const allEntries = day.sections?.flatMap(s => s.entries?.map(e => ({
    ...e,
    sectionTitle: s.title,
    sectionKey: s.section_key,
    hour: s.title
  }))) || []

  const [activeEntry, setActiveEntry] = useState<any>(allEntries[0] || null)

  const accent = character?.accent_color || '#45d6ff'
  const dayIconUri = buildIconUri(MAP_ICONS.tent, accent) // Simplified icon

  return (
    <div style={{ padding: 'clamp(14px,3vw,30px) clamp(12px,3vw,26px)' }}>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={onBack} className="font-pixel" style={{ fontSize: 13, color: 'var(--s,#45d6ff)', background: 'none', border: '2px solid var(--ln,#3d2668)', borderRadius: 6, padding: '12px 18px', cursor: 'pointer', flex: 'none', transition: 'all 0.2s' }}>
          ◂ MAP
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={onSceneView} className="font-pixel" style={{ fontSize: 13, color: 'var(--p,#ff5fd2)', background: 'rgba(255,95,210,.08)', border: '2px solid var(--p,#ff5fd2)', borderRadius: 6, padding: '12px 18px', cursor: 'pointer', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 12px rgba(255,95,210,.18)', transition: 'all 0.2s' }}>
            ▶ GAME VIEW
          </button>
        </div>
      </div>

      {/* ── Two-column Master/Detail ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 'min(70vh, 600px)', border: '3px solid var(--ln,#3d2668)', borderRadius: 14, overflow: 'hidden', background: '#181024' }}>
        
        {/* Left: Master List */}
        <div style={{ flex: '1 1 280px', minWidth: 240, maxWidth: 360, borderRight: '2px solid var(--ln,#3d2668)', background: 'rgba(0,0,0,.16)' }}>
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
            <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', marginBottom: 14, paddingLeft: 4 }}>SESSIONS & STOPS</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {day.sections?.map(sec => (
                <div key={sec.id}>
                  <div className="font-pixel" style={{ fontSize: 7, color: secColor(sec.section_key), marginBottom: 10, paddingLeft: 4 }}>{sec.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sec.entries?.map((it, idx) => {
                      const isActive = activeEntry?.id === it.id
                      const tCol = secColor(sec.section_key)
                      return (
                        <div key={it.id} style={{ display: 'flex', gap: 4 }}>
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
                              <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {it.subtitle || it.entry_type}
                              </div>
                            </div>
                            <div className="font-pixel" style={{ fontSize: 8, color: isActive ? tCol : 'var(--ln,#3d2668)', flex: 'none' }}>›</div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right: Detail View (ArtifactReader inline) */}
        <div style={{ flex: '2 1 400px', background: 'linear-gradient(180deg, rgba(0,0,0,.08), transparent)' }}>
          {activeEntry ? (
            <ArtifactReader
              entry={activeEntry}
              dayId={day.id}
              dayNumber={day.day_number}
              scene={{ label: `ACT ${day.day_number}` }}
              accent={accent}
              cohortId={cohortId}
              progressRows={progressRows}
              inline={true}
            />
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--mu,#a493c9)', fontSize: 15 }}>
              Select a session on the left to read it here.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
