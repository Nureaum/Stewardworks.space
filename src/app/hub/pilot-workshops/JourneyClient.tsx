'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MonitorFrame,
  JourneyHeader,
  RetroToast,
  CharacterSelect,
  PixelSprite,
  TreasureMap,
  Portfolio,
  Showcase,
  AdminConsole,
  JourneyScene,
  JourneyDayList,
  VictoryScreen,
} from '@/components/workshops/journey'
import type {
  WorkshopCharacter,
  WorkshopDay,
  WorkshopProgress,
  WorkshopPrinciple,
  WorkshopProgressPrinciple,
  WorkshopEngagement,
  WorkshopShowcase,
  DayWithSections,
} from '@/types/workshops'
import { addEngagement, removeEngagement, updateEngagement } from '@/app/actions/workshops/engagement'

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
  allBankedPrinciples?: WorkshopProgressPrinciple[]  // submitted+approved for pending detection
  initialEngagements: WorkshopEngagement[]
  submissions?: any[]
  showcaseItems: WorkshopShowcase[]
  isAdmin: boolean
  profileId: string
  initialTab?: JourneyTab
  initialRole?: Role
  initialSection?: string
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
  initialTab = 'journey',
  initialRole = 'student',
  initialSection,
}: JourneyClientProps) {
  const [tab, setTab] = useState<JourneyTab>(initialTab)
  const [screen, setScreen] = useState<JourneyScreen>(initialCharacter ? 'map' : 'select')
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const [character, setCharacter] = useState(initialCharacter)
  const [activeDay, setActiveDay] = useState<number>(1)
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [engagements, setEngagements] = useState<WorkshopEngagement[]>(initialEngagements)
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [defaultTopicId, setDefaultTopicId] = useState<string | null>(null)
  const [bankedPrinciples, setBankedPrinciples] = useState(initialBankedPrinciples)

  // Hydrate visited state from localStorage and merge with database progress
  React.useEffect(() => {
    // Handle deep linking from URL
    let hasDeepLink = false
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const dayParam = searchParams.get('day')
      const topicParam = searchParams.get('topic')
      if (dayParam) {
        setScreen('day')
        setActiveDay(parseInt(dayParam, 10))
        if (topicParam) {
          setDefaultTopicId(topicParam)
        }
        hasDeepLink = true
      }
    }

    // Build initial visited state from localStorage
    let localVisited: Record<string, boolean> = {}
    try {
      const raw = localStorage.getItem('stewardworks.journey')
      if (raw) {
        const j = JSON.parse(raw)
        if (j.visited) localVisited = j.visited
        if (!hasDeepLink) {
          if (j.screen && initialCharacter) setScreen(j.screen)
          if (j.activeDay) setActiveDay(j.activeDay)
        }
      }
    } catch(e) {
      console.error('Error loading from localStorage:', e)
    }

    // Now merge with database progress: if any day has submitted/approved deliverables,
    // mark ALL entries in that day as visited (since they must have been explored)
    const visitedFromDb: Record<string, boolean> = {}
    
    progressRows.forEach(progress => {
      // Find which day this progress belongs to
      const dayObj = days.find(d => d.id === progress.workshop_day_id)
      if (!dayObj) return

      // If deliverable was submitted or approved, user must have gone through the content
      if (progress.deliverable_status === 'submitted' || 
          progress.deliverable_status === 'approved') {
        // Mark all entries in this day as visited
        dayObj.sections?.forEach(section => {
          section.entries?.forEach(entry => {
            const entryKey = `${dayObj.day_number}-${entry.id}`
            visitedFromDb[entryKey] = true
          })
        })
      }
    })

    // Merge: start with database-derived visited, then overlay localStorage
    // (localStorage may have additional visits not yet submitted as deliverables)
    setVisited({ ...visitedFromDb, ...localVisited })
  }, [initialCharacter, progressRows, days])

  // Persist state
  React.useEffect(() => {
    try {
      localStorage.setItem('stewardworks.journey', JSON.stringify({ visited, screen, activeDay }))
    } catch(e) {}
  }, [visited, screen, activeDay])

  // Compute days complete (submitted or approved deliverables) - used for unlocking map nodes
  const daysComplete = progressRows.filter(
    p => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved'
  ).length

  // Compute approved days (only approved deliverables) - used for Chia Guardian growth
  const approvedDaysCount = progressRows.filter(
    p => p.deliverable_status === 'approved'
  ).length

  // Auto-show victory screen ONE TIME when 75% (3 approved) is first reached
  React.useEffect(() => {
    if (approvedDaysCount >= 3 && character) {
      const key = `stewardworks.victory.seen.${cohortId}`
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1')
          setVictoryVisible(true)
        }
      } catch (e) {}
    }
  }, [approvedDaysCount, character, cohortId])

  const activeDayObj = days.find(d => d.day_number === activeDay)

  const showToast = useCallback((msg: string) => setToast(msg), [])
  const clearToast = useCallback(() => setToast(null), [])

  // Engagement handlers
  const handleAddEngagement = useCallback(async (kind: string, title: string, source: string, url?: string) => {
    try {
      const item = await addEngagement(cohortId, kind, title, source, url)
      setEngagements(prev => [item, ...prev])
      showToast(`☆ ${kind === 'bookmark' ? 'Bookmarked' : kind === 'note' ? 'Note saved' : kind === 'prompt' ? 'Prompt saved' : 'Asset saved'} · pending admin approval`)
    } catch (e) {
      showToast('Failed to save — try again')
    }
  }, [cohortId, showToast])

  const handleRemoveEngagement = useCallback(async (id: string) => {
    try {
      await removeEngagement(id)
      setEngagements(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      showToast('Failed to remove — try again')
    }
  }, [showToast])

  const handleUpdateEngagement = useCallback(async (id: string, updates: { title?: string, content?: string, url?: string }) => {
    console.log('[JourneyClient (root)] handleUpdateEngagement CALLED')
    console.log('[JourneyClient (root)] id:', id)
    console.log('[JourneyClient (root)] updates:', updates)
    
    try {
      console.log('[JourneyClient (root)] Calling updateEngagement action...')
      const updated = await updateEngagement(id, updates)
      console.log('[JourneyClient (root)] updateEngagement returned:', updated)
      
      console.log('[JourneyClient (root)] Updating local state...')
      setEngagements(prev => {
        const newState = prev.map(e => (e.id === id ? updated : e))
        console.log('[JourneyClient (root)] New engagements state:', newState)
        return newState
      })
      
      console.log('[JourneyClient (root)] Showing success toast')
      showToast('Item updated successfully')
    } catch (e: any) {
      console.error('[JourneyClient (root)] Error updating item:', e)
      console.error('[JourneyClient (root)] Error message:', e.message)
      console.error('[JourneyClient (root)] Error stack:', e.stack)
      showToast('Error updating item')
      throw e
    }
  }, [showToast])

  const submittingRef = React.useRef<Set<string>>(new Set());

  const handleBookmark = useCallback(async (key: string, title: string, source: string, url?: string) => {
    // Use the unique key (day.id-entry.id) as the identifier to prevent duplicates across days
    if (submittingRef.current.has(key)) return;
    
    // Check for existing bookmark using the URL which contains the unique topic ID
    // This fixes the bug where lessons with the same title across different days
    // would all appear bookmarked when only one was actually bookmarked
    const existingBookmark = url 
      ? engagements.find(e => e.kind === 'bookmark' && e.url === url && e.status !== 'rejected')
      : engagements.find(e => e.kind === 'bookmark' && e.title === title && e.status !== 'rejected')
    
    if (existingBookmark) {
      if (existingBookmark.status === 'pending') {
        showToast('Already bookmarked! Pending admin approval.')
      } else if (existingBookmark.status === 'approved') {
        showToast('Already bookmarked and approved!')
      } else {
        showToast('Already bookmarked!')
      }
      return
    }
    
    submittingRef.current.add(key);
    try {
      await handleAddEngagement('bookmark', title, source, url)
    } finally {
      submittingRef.current.delete(key);
    }
  }, [engagements, showToast, handleAddEngagement])

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
      {/* ── Game Monitor ────────────────────────────── */}
      <MonitorFrame
        header={
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
          {/* Left: back + branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <a
              href="/hub"
              title="Return to hub"
              className="font-pixel"
              style={{
                fontSize: 10,
                color: '#6f5e8f',
                textDecoration: 'none',
                border: '2px solid #cbb98f',
                borderRadius: 6,
                padding: '8px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              ◄ RETURN TO HUB
            </a>
            <div
              className="font-pixel"
              style={{
                fontSize: 11,
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

          {/* Right: Student/Admin toggle + traffic lights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
            {isAdmin && (
              <div style={{ display: 'flex', border: '2px solid #cbb98f', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setRole('student')}
                  className="font-exo font-bold"
                  style={{
                    fontSize: 14,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    border: 'none',
                    background: role === 'student' ? '#3a2c5e' : 'transparent',
                    color: role === 'student' ? '#ffd23f' : '#8a7a5c',
                    letterSpacing: 1,
                  }}
                >
                  ▶ STUDENT
                </button>
                <button
                  onClick={() => setRole('admin')}
                  className="font-exo font-bold"
                  style={{
                    fontSize: 14,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    border: 'none',
                    background: role === 'admin' ? '#3a2c5e' : 'transparent',
                    color: role === 'admin' ? '#ffd23f' : '#8a7a5c',
                    letterSpacing: 1,
                  }}
                >
                  ◇ ADMIN
                </button>
              </div>
            )}
            {/* macOS-style traffic lights */}
            <div style={{ display: 'flex', gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e06a5a', display: 'block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b84a', display: 'block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5fbf7a', display: 'block' }} />
            </div>
          </div>
          </div>
        }
      >
        {/* Student header nav */}
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
              setTab('journey')
              setScreen(character ? 'map' : 'select')
            }}
            cohortId={cohortId}
          />
        )}

        {/* ── Main content area ──────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* JOURNEY tab */}
          {role === 'student' && tab === 'journey' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                padding: 40,
              }}
            >
              {victoryVisible && character ? (
                <VictoryScreen
                  character={character}
                  daysComplete={approvedDaysCount}
                  principlesCount={bankedPrinciples.length}
                  bankedPrinciples={bankedPrinciples}
                  days={days}
                  progressRows={progressRows}
                  cohortId={cohortId}
                  submissions={submissions}
                  engagementPct={Math.min(
                    engagements.filter(e => e.status === 'approved').reduce((acc, e) => {
                      if (e.kind === 'bookmark' || e.kind === 'note') return acc + 1;
                      if (e.kind === 'generation') return acc + 2;
                      if (e.kind === 'prompt') return acc + 3;
                      return acc;
                    }, 0),
                    25
                  )}
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
                  daysComplete={daysComplete}
                  principlesCount={bankedPrinciples.length}
                  onComplete={(newChar) => {
                    setCharacter(newChar)
                    setScreen('map')
                  }}
                />
              ) : screen === 'scene' ? (
                <JourneyScene
                  character={character!}
                  day={activeDayObj!}
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
                  onDeliverableSubmitted={(msg, shouldOpenVictory) => {
                    showToast(msg)
                    router.refresh()
                    if (shouldOpenVictory) {
                      // Automatically open victory screen when all 3 days are complete
                      setTimeout(() => setVictoryVisible(true), 800)
                    }
                  }}
                  onOpenList={() => setScreen('day')}
                />
              ) : screen === 'day' ? (
                <JourneyDayList
                  character={character!}
                  day={activeDayObj!}
                  onBack={() => setScreen('map')}
                  onSceneView={() => setScreen('scene')}
                  progressRows={progressRows}
                  cohortId={cohortId}
                  onBookmark={handleBookmark}
                  bookmarkedUrls={engagements.filter(e => e.kind === 'bookmark' && e.status !== 'rejected').map(e => e.url || '')}
                  defaultTopicId={defaultTopicId}
                    days={days}
                    activeDay={activeDay}
                    daysComplete={daysComplete}
                    onChangeDay={(dayNum) => setActiveDay(dayNum)}
                    principles={principles}
                    bankedPrincipleIds={bankedPrinciples.map(p => p.principle_id)}
                    bankedPrinciples={bankedPrinciples}
                    allBankedPrinciples={allBankedPrinciples}
                    submissions={submissions}
                    onDeliverableSubmitted={(msg, shouldOpenVictory) => {
                      showToast(msg)
                      router.refresh()
                      if (shouldOpenVictory) {
                        setTimeout(() => setVictoryVisible(true), 800)
                      }
                    }}
                />
              ) : (
                <TreasureMap
                  character={character!}
                  days={days}
                  daysComplete={daysComplete}
                  approvedDays={approvedDaysCount}
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
                    setActiveDay(dayNum)
                    setScreen('scene')
                  }}
                  onOpenPortfolio={() => setTab('portfolio')}
                />
              )}
            </div>
          )}

          {/* PORTFOLIO tab */}
          {role === 'student' && tab === 'portfolio' && character && (
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
              cohortId={cohortId}
              cohortName={cohortName}
              userId={profileId}
            />
          )}

          {/* SHOWCASE tab */}
          {role === 'student' && tab === 'showcase' && (
            <div style={{ padding: 'clamp(20px, 3vw, 40px) clamp(24px, 3.5vw, 50px)' }}>
              <Showcase
                showcaseItems={showcaseItems}
                engagements={engagements}
                cohortId={cohortId}
                onBookmark={handleBookmark}
                onlyContributors={true}
              />
            </div>
          )}

          {/* STUDENT SHOWCASE tab */}
          {role === 'student' && tab === 'studentshowcase' && (
            <div style={{ padding: 'clamp(20px, 3vw, 40px) clamp(24px, 3.5vw, 50px)' }}>
              <Showcase
                showcaseItems={showcaseItems}
                engagements={engagements}
                cohortId={cohortId}
                onBookmark={handleBookmark}
                onlyStudents={true}
              />
            </div>
          )}

          {/* ADMIN console */}
          {role === 'admin' && (
            <AdminConsole
              cohortId={cohortId}
              cohortName={cohortName}
              cohort={cohort}
              days={days}
              principles={principles}
              cameFromAdminPanel={initialRole === 'admin'}
              initialSection={initialSection}
              onReturnToGame={() => setRole('student')}
              onPrincipleBanked={(principle) => {
                setBankedPrinciples(prev => [...prev, principle])
              }}
            />
          )}

        </div>
      </MonitorFrame>

      {/* In-game toast */}
      <RetroToast message={toast} onClose={clearToast} />

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: '#a09070',
          letterSpacing: 1,
          textAlign: 'center',
        }}
      >
        STEWARDWORKS.SPACE · PILOT WORKSHOPS · THE STEWARD&apos;S JOURNEY
      </div>
    </div>
  )
}

