'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  MonitorFrame,
  JourneyHeader,
  RetroToast,
  CharacterSelect,
  TreasureMap,
  JourneyScene,
  JourneyDayList,
  Portfolio,
  Showcase,
  VictoryScreen,
} from '@/components/workshops/journey'
import { DEFAULT_CHARACTER } from '@/components/workshops/journey/character-data'
import { addEngagement, removeEngagement, updateEngagement } from '@/app/actions/workshops/engagement'
import { calculateGlobalEngagement } from '@/lib/progress/calculateGlobalEngagement'
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

type JourneyTab = 'journey' | 'portfolio' | 'showcase' | 'studentshowcase'
type JourneyScreen = 'select' | 'map' | 'scene' | 'day'
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
  allBankedPrinciples?: WorkshopProgressPrinciple[]  // includes submitted+approved for pending detection
  initialEngagements: WorkshopEngagement[]
  submissions?: any[]
  showcaseItems: WorkshopShowcase[]
  isAdmin: boolean
  profileId: string
  userRole?: string
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
  bankedPrinciples: initialBankedPrinciples,
  allBankedPrinciples = [],
  initialEngagements,
  submissions = [],
  showcaseItems,
  isAdmin,
  profileId,
  userRole = 'participant',
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
  const [itemToDelete, setItemToDelete] = useState<{ id: string, title: string, percentage: number } | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null)
  const [bankedPrinciples, setBankedPrinciples] = useState(initialBankedPrinciples)

  // Active day number (1-based) for JourneyDayList navigation
  const [activeDayNum, setActiveDayNum] = useState<number>(1)

  // Compute days complete (only approved deliverables count for victory/chia)
  const daysComplete = progressRows.filter(
    (p) => p.deliverable_status === 'approved'
  ).length

  // Days submitted or approved (for unlocking map nodes)
  const daysSubmitted = progressRows.filter(
    (p) => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved'
  ).length

  // Auto-show victory screen ONE TIME when 75% (3 approved) is first reached
  // Guests cannot complete deliverables so they never see victory
  React.useEffect(() => {
    if (userRole === 'guest') return;
    if (daysComplete >= 3 && character) {
      const key = `stewardworks.victory.seen.${cohortId}`
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1')
          setVictoryVisible(true)
        }
      } catch (e) {}
    }
  }, [daysComplete, character, cohortId])

  // Handlers
  const handleAddEngagement = async (kind: string, title: string, source: string, url?: string, content?: string) => {
    console.log('[DEBUG] handleAddEngagement called:', { kind, title, source, url, content, cohortId });
    try {
      const res = await addEngagement(cohortId, kind, title, source, url, content)
      console.log('[DEBUG] addEngagement response:', res);
      setEngagements(prev => [res, ...prev])
      setToast('Added to Portfolio')
    } catch (e: any) {
      console.error('[DEBUG] addEngagement ERROR:', e);
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

  // Bookmark handler with duplicate detection (same as root JourneyClient)
  const submittingRef = useRef<Set<string>>(new Set())

  const handleBookmark = useCallback(async (key: string, title: string, source: string, url?: string) => {
    if (submittingRef.current.has(key)) return

    const existingBookmark = url
      ? engagements.find(e => e.kind === 'bookmark' && e.url === url && e.status !== 'rejected')
      : engagements.find(e => e.kind === 'bookmark' && e.title === title && e.status !== 'rejected')

    if (existingBookmark) {
      const percentage = existingBookmark.status === 'approved' ? 1 : 0;
      setItemToDelete({ id: existingBookmark.id, title: existingBookmark.title, percentage });
      return
    }

    submittingRef.current.add(key)
    try {
      const res = await addEngagement(cohortId, 'bookmark', title, source, url)
      setEngagements(prev => [res, ...prev])
      setToast('☆ Bookmarked · pending admin approval')
    } catch (e) {
      setToast('Error adding bookmark')
    } finally {
      submittingRef.current.delete(key)
    }
  }, [engagements, cohortId])

  const executeDeleteEngagement = async () => {
    if (!itemToDelete) return
    setIsDeletingItem(true)
    try {
      await handleRemoveEngagement(itemToDelete.id)
      setToast('Bookmark removed')
    } catch (e) {
      setToast('Error removing bookmark')
    } finally {
      setIsDeletingItem(false)
      setItemToDelete(null)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Responsive styles for mobile/tablet - Journey Page */
        @media (max-width: 768px) {
          .journey-wrapper {
            padding: 8px !important;
          }
          
          .journey-monitor-frame {
            transform-origin: center center;
          }
          
          .journey-header-wrap {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding: 8px 12px !important;
          }
          
          .journey-header-back {
            font-size: 7px !important;
            padding: 5px 7px !important;
          }
          
          .journey-header-title {
            font-size: 8px !important;
          }
          
          .journey-header-controls {
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 8px !important;
          }
          
          .journey-role-toggle button {
            font-size: 7px !important;
            padding: 6px 8px !important;
          }
          
          .journey-traffic-lights {
            gap: 5px !important;
          }
          
          .journey-traffic-lights span {
            width: 9px !important;
            height: 9px !important;
          }
        }
        
        @media (max-width: 640px) {
          .journey-wrapper {
            padding: 6px !important;
          }
          
          .journey-header-back {
            font-size: 6px !important;
            padding: 4px 6px !important;
          }
          
          .journey-header-title {
            font-size: 7px !important;
          }
          
          .journey-role-toggle button {
            font-size: 6px !important;
            padding: 5px 7px !important;
          }
          
          .journey-traffic-lights span {
            width: 8px !important;
            height: 8px !important;
          }
        }
      `}} />
    <div
      className="font-retro journey-wrapper"
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
      <MonitorFrame
        className="journey-monitor-frame"
        header={
          <div
            style={{
              width: '100%',
              maxWidth: 1220,
              marginBottom: 0,
            }}
          >
            <div
              className="journey-header-wrap"
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
                  className="font-pixel journey-header-back"
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
                  className="font-pixel journey-header-title"
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

              <div className="journey-header-controls" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
                {/* Student / Admin toggle */}
                {isAdmin && (
                  <div className="journey-role-toggle" style={{ display: 'flex', border: '2px solid #cbb98f', borderRadius: 6, overflow: 'hidden' }}>
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
                <div className="journey-traffic-lights" style={{ display: 'flex', gap: 7 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e06a5a' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b84a' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5fbf7a' }} />
                </div>
              </div>
            </div>
          </div>
        }
      >
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
              {victoryVisible && character && userRole !== 'guest' ? (
                <VictoryScreen
                  character={character}
                  daysComplete={daysComplete}
                  principlesCount={bankedPrinciples.length}
                  principles={principles}
                  bankedPrinciples={bankedPrinciples}
                  days={days}
                  progressRows={progressRows}
                  cohortId={cohortId}
                  submissions={submissions}
                  engagementPct={calculateGlobalEngagement(engagements)}
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
                  daysComplete={daysSubmitted}
                  approvedDays={daysComplete}
                  engagementPct={calculateGlobalEngagement(engagements)}
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
                  userRole={userRole}
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
                  bankedPrinciples={bankedPrinciples}
                  allBankedPrinciples={allBankedPrinciples}
                  progressRows={progressRows}
                  submissions={submissions}
                  onDeliverableSubmitted={(msg) => {
                    setToast(msg)
                    router.refresh()
                  }}
                  onOpenList={() => {
                    if (activeDayIndex !== null) setActiveDayNum(days[activeDayIndex].day_number)
                    setScreen('day')
                  }}
                  onBookmark={handleBookmark}
                  bookmarkedUrls={engagements.filter(e => e.kind === 'bookmark' && e.status !== 'rejected').map(e => e.url || '')}
                  userRole={userRole}
                />
              ) : screen === 'day' && character && activeDayIndex !== null ? (
                <JourneyDayList
                  character={character}
                  day={days.find(d => d.day_number === activeDayNum) || days[activeDayIndex]}
                  onBack={() => setScreen('map')}
                  onSceneView={() => setScreen('scene')}
                  progressRows={progressRows}
                  cohortId={cohortId}
                  onBookmark={handleBookmark}
                  bookmarkedUrls={engagements.filter(e => e.kind === 'bookmark' && e.status !== 'rejected').map(e => e.url || '')}
                  days={days}
                  activeDay={activeDayNum}
                  daysComplete={daysComplete}
                  onChangeDay={(dayNum) => {
                    const idx = days.findIndex(d => d.day_number === dayNum)
                    if (idx >= 0) setActiveDayIndex(idx)
                    setActiveDayNum(dayNum)
                  }}
                  principles={principles}
                  bankedPrincipleIds={bankedPrinciples.map(p => p.principle_id)}
                  bankedPrinciples={bankedPrinciples}
                  allBankedPrinciples={allBankedPrinciples}
                  submissions={submissions}
                  onDeliverableSubmitted={(msg) => {
                    setToast(msg)
                    router.refresh()
                  }}
                  userRole={userRole}
                />
              ) : null}
            </>
          )}

          {role === 'student' && tab === 'portfolio' && (
            <div style={{ padding: '0 0 40px' }}>
              <Portfolio
                character={character || DEFAULT_CHARACTER as any}
                days={days}
                progressRows={progressRows}
                bankedPrinciples={bankedPrinciples}
                engagements={engagements}
                submissions={submissions}
                onAddEngagement={handleAddEngagement}
                onRemoveEngagement={handleRemoveEngagement}
                onUpdateEngagement={handleUpdateEngagement}
                cohortId={cohortId}
                cohortName={cohortName}
                userId={profileId}
                userRole={userRole}
              />
            </div>
          )}

          {role === 'student' && tab === 'showcase' && (
            <div style={{ padding: 'clamp(20px, 3vw, 40px) clamp(24px, 3.5vw, 50px)' }}>
              <Showcase
                showcaseItems={showcaseItems}
                engagements={engagements}
                cohortId={cohortId}
                onBookmark={(key, title, source, url) => {
                  console.log('[DEBUG JourneyClient] onBookmark received:', { key, title, source, url });
                  handleAddEngagement('bookmark', title, source, url);
                }}
                onlyContributors={true}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {role === 'student' && tab === 'studentshowcase' && (
            <div style={{ padding: 'clamp(20px, 3vw, 40px) clamp(24px, 3.5vw, 50px)' }}>
              <Showcase
                showcaseItems={showcaseItems}
                engagements={engagements}
                cohortId={cohortId}
                onBookmark={(key, title, source, url) => {
                  console.log('[DEBUG JourneyClient] onBookmark received:', { key, title, source, url });
                  handleAddEngagement('bookmark', title, source, url);
                }}
                onlyStudents={true}
                isAdmin={isAdmin}
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
              onPrincipleBanked={(principle) => {
                setBankedPrinciples(prev => [...prev, principle])
              }}
            />
          )}
        </div>
      </MonitorFrame>

      {/* Toast */}
      <RetroToast message={toast} onClose={clearToast} />
    </div>
    </>
  )
}
