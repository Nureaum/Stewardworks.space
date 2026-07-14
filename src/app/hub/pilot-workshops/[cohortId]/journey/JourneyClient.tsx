'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MonitorFrame,
  JourneyHeader,
  RetroToast,
  CharacterSelect,
  TreasureMap,
  JourneyScene,
  Portfolio,
  Showcase,
  VictoryScreen,
} from '@/components/workshops/journey'
import { addEngagement, removeEngagement, updateEngagement } from '@/app/actions/workshops/engagement'
import AdminConsole from '@/components/workshops/journey/AdminConsole'
import type {
  WorkshopCharacter,
  WorkshopDay,
  DayWithSections,
  WorkshopProgress,
  WorkshopPrinciple,
  WorkshopProgressPrinciple,
  WorkshopShowcase,
  WorkshopEngagement,
} from '@/types/workshops'

type JourneyTab = 'journey' | 'portfolio' | 'showcase'
type JourneyScreen = 'select' | 'map' | 'scene'
type Role = 'student' | 'admin'

interface JourneyClientProps {
  cohortId: string
  cohortName: string
  cohort: any
  character: WorkshopCharacter | null
  days: DayWithSections[]
  progressRows: WorkshopProgress[]
  principles: WorkshopPrinciple[]
  bankedPrinciples: WorkshopProgressPrinciple[]
  initialEngagements: WorkshopEngagement[]
  submissions?: any[]
  showcaseItems: WorkshopShowcase[]
  isAdmin: boolean
  profileId: string
  initialTab?: JourneyTab
  initialRole?: Role
}

export default function JourneyClient({
  cohortId,
  cohortName,
  cohort,
  character: initialCharacter,
  days,
  progressRows,
  principles,
  bankedPrinciples,
  initialEngagements,
  submissions = [],
  showcaseItems,
  isAdmin,
  profileId,
  initialTab = 'journey',
  initialRole = 'student',
}: JourneyClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<JourneyTab>(initialTab)
  const [screen, setScreen] = useState<JourneyScreen>(initialCharacter ? 'map' : 'select')
  const [role, setRole] = useState<Role>(initialRole)
  const [character, setCharacter] = useState(initialCharacter)
  const [toast, setToast] = useState<string | null>(null)
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [victoryVisible, setVictoryVisible] = useState(false)

  const [engagements, setEngagements] = useState<WorkshopEngagement[]>(initialEngagements)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null)

  // Compute days complete
  const daysComplete = progressRows.filter(
    (p) => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved'
  ).length

  // Handlers
  const handleAddEngagement = async (kind: string, title: string, source: string, url?: string) => {
    try {
      const res = await addEngagement(cohortId, kind, title, source, url)
      setEngagements(prev => [res, ...prev])
      setToast('Added to Portfolio')
    } catch (e: any) {
      setToast('Error adding item')
    }
  }

  const handleRemoveEngagement = async (id: string) => {
    try {
      await removeEngagement(id)
      setEngagements(prev => prev.filter(e => e.id !== id))
    } catch (e: any) {
      setToast('Error removing item')
    }
  }

  const handleUpdateEngagement = async (id: string, updates: { title?: string, content?: string, url?: string }) => {
    console.log('[JourneyClient] handleUpdateEngagement CALLED')
    console.log('[JourneyClient] id:', id)
    console.log('[JourneyClient] updates:', updates)
    
    try {
      console.log('[JourneyClient] Calling updateEngagement action...')
      const updated = await updateEngagement(id, updates)
      console.log('[JourneyClient] updateEngagement returned:', updated)
      
      console.log('[JourneyClient] Updating local state...')
      setEngagements(prev => {
        const newState = prev.map(e => (e.id === id ? updated : e))
        console.log('[JourneyClient] New engagements state:', newState)
        return newState
      })
      
      console.log('[JourneyClient] Showing success toast')
      setToast('Item updated successfully')
    } catch (e: any) {
      console.error('[JourneyClient] Error updating item:', e)
      console.error('[JourneyClient] Error message:', e.message)
      console.error('[JourneyClient] Error stack:', e.stack)
      setToast('Error updating item')
      throw e
    }
  }

  const showToast = useCallback((msg: string) => setToast(msg), [])
  const clearToast = useCallback(() => setToast(null), [])

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(180deg, #f6dcbb 0%, #e3c194 70%, #d3ab7e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(8px, 2.5vw, 34px)',
      }}
    >
      {/* Title bar above the monitor */}
      <div
        style={{
          width: '100%',
          maxWidth: 1220,
          marginBottom: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '5px 10px 9px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <a
              href={`/hub/pilot-workshops/${cohortId}`}
              title="Back to cohort"
              className="font-pixel"
              style={{
                fontSize: 8,
                color: '#6f5e8f',
                textDecoration: 'none',
                border: '2px solid #cbb98f',
                borderRadius: 5,
                padding: '6px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              ◄ COHORT
            </a>
            <div
              className="font-pixel"
              style={{
                fontSize: 9,
                letterSpacing: 1,
                color: '#8a7a5c',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              STEWARD OS · PILOT WORKSHOPS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
            {/* Student / Admin toggle */}
            {isAdmin && (
              <div style={{ display: 'flex', border: '2px solid #cbb98f', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => setRole('student')}
                  className="font-pixel"
                  style={{
                    fontSize: 8,
                    padding: '7px 10px',
                    cursor: 'pointer',
                    border: 'none',
                    background: role === 'student' ? '#cbb98f' : 'transparent',
                    color: role === 'student' ? '#3a2e1a' : '#8a7a5c',
                  }}
                >
                  ▸ STUDENT
                </button>
                <button
                  onClick={() => setRole('admin')}
                  className="font-pixel"
                  style={{
                    fontSize: 8,
                    padding: '7px 10px',
                    cursor: 'pointer',
                    border: 'none',
                    background: role === 'admin' ? '#cbb98f' : 'transparent',
                    color: role === 'admin' ? '#3a2e1a' : '#8a7a5c',
                  }}
                >
                  ⚙ ADMIN
                </button>
              </div>
            )}
            {/* Traffic light dots */}
            <div style={{ display: 'flex', gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e06a5a' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b84a' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5fbf7a' }} />
            </div>
          </div>
        </div>
      </div>

      <MonitorFrame>
        {/* Student header */}
        {role === 'student' && (
          <JourneyHeader
            activeTab={tab}
            onTabChange={setTab}
            character={character}
            daysComplete={daysComplete}
            principlesCount={bankedPrinciples.length}
            onChangeChar={() => setScreen('select')}
            onReset={() => showToast('Reset not yet implemented')}
            onHub={() => {
              router.push(`/hub/pilot-workshops/${cohortId}`)
            }}
            cohortId={cohortId}
          />
        )}

        {/* Main content area */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5 }}>
          {role === 'student' && tab === 'journey' && (
            <>
              {victoryVisible && character ? (
                <VictoryScreen
                  character={character}
                  daysComplete={daysComplete}
                  principlesCount={bankedPrinciples.length}
                  bankedPrinciples={bankedPrinciples}
                  days={days}
                  progressRows={progressRows}
                  cohortId={cohortId}
                  onBack={() => setVictoryVisible(false)}
                  onViewPortfolio={() => {
                    setVictoryVisible(false)
                    setTab('portfolio')
                  }}
                />
              ) : screen === 'select' ? (
                <CharacterSelect
                  cohortId={cohortId}
                  existingCharacter={character}
                  onComplete={(char) => {
                    setCharacter(char)
                    setScreen('map')
                  }}
                  daysComplete={daysComplete}
                  principlesCount={bankedPrinciples.length}
                />
              ) : screen === 'map' && character ? (
                <TreasureMap
                  days={days}
                  character={character}
                  daysComplete={daysComplete}
                  approvedDays={progressRows.filter(p => p.deliverable_status === 'approved').length}
                  engagementPct={Math.min(
                    engagements.filter(e => e.status === 'approved').reduce((acc, e) => {
                      if (e.kind === 'bookmark' || e.kind === 'note') return acc + 1;
                      if (e.kind === 'generation') return acc + 2;
                      if (e.kind === 'prompt') return acc + 3;
                      return acc;
                    }, 0),
                    25
                  )}
                  principlesCount={bankedPrinciples.length}
                  bankedPrinciples={bankedPrinciples}
                  principles={principles}
                  onChangeChar={() => setScreen('select')}
                  onOpenWin={() => setVictoryVisible(true)}
                  onOpenDay={(dayNum) => {
                    const idx = dayNum - 1
                    if (idx >= 0 && idx < days.length) {
                      setActiveDayIndex(idx)
                      setScreen('scene')
                    }
                  }}
                  onOpenPortfolio={() => setTab('portfolio')}
                />
              ) : screen === 'scene' && character && activeDayIndex !== null ? (
                <JourneyScene
                  character={character}
                  day={days[activeDayIndex]}
                  visited={visited}
                  setVisited={setVisited}
                  onBack={() => setScreen('map')}
                  cohortId={cohortId}
                  principles={principles}
                  bankedPrincipleIds={bankedPrinciples.map(p => p.principle_id)}
                  progressRows={progressRows}
                  onDeliverableSubmitted={(msg) => setToast(msg)}
                  onOpenList={() => setToast('Day list not yet implemented')}
                />
              ) : null}
            </>
          )}

          {role === 'student' && tab === 'portfolio' && character && (
            <div style={{ padding: '0 0 40px' }}>
              <Portfolio
                character={character}
                days={days}
                progressRows={progressRows}
                bankedPrinciples={bankedPrinciples}
                engagements={engagements}
                submissions={submissions}
                onAddEngagement={handleAddEngagement}
                onRemoveEngagement={handleRemoveEngagement}
                onUpdateEngagement={handleUpdateEngagement}
              />
            </div>
          )}

          {role === 'student' && tab === 'showcase' && (
            <div style={{ padding: 'clamp(20px, 3vw, 40px) clamp(24px, 3.5vw, 50px)' }}>
              <Showcase
                showcaseItems={showcaseItems}
                engagements={engagements}
                onBookmark={(key, title, source) => handleAddEngagement(key, title, source)}
              />
            </div>
          )}

          {role === 'admin' && (
            <AdminConsole
              cohortId={cohortId}
              cohortName={cohortName}
              cohort={cohort}
              days={days}
              principles={principles}
              onReturnToGame={() => setRole('student')}
            />
          )}
        </div>
      </MonitorFrame>

      {/* Toast */}
      <RetroToast message={toast} onClose={clearToast} />
    </div>
  )
}
