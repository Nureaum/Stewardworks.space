'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerForCohort } from '@/app/actions/workshops/participants'

interface Cohort {
  id: string
  name: string
  status: string
  start_date: string | null
  description: string | null
}

interface Registration {
  id: string
  cohort_id: string
  status: string
}

interface CohortSelectorProps {
  cohorts: Cohort[]
  registrations: Registration[]
}

export default function CohortSelector({ cohorts, registrations }: CohortSelectorProps) {
  const router = useRouter()
  const [loadingCohortId, setLoadingCohortId] = useState<string | null>(null)
  
  // Filter open cohorts only
  const openCohorts = cohorts.filter(c => c.status === 'open')

  const handleCohortClick = async (e: React.MouseEvent, cohortId: string, isRegistered: boolean) => {
    e.preventDefault()
    if (loadingCohortId) return
    
    setLoadingCohortId(cohortId)
    
    if (isRegistered) {
      router.push(`/hub/pilot-workshops/${cohortId}/journey`)
    } else {
      try {
        await registerForCohort(cohortId)
        router.push(`/hub/pilot-workshops/${cohortId}/journey`)
      } catch (err) {
        console.error('Registration failed:', err)
        alert('Failed to join cohort. Please try again later.')
        setLoadingCohortId(null)
      }
    }
  }

  const parseDescription = (htmlStr: string | null) => {
    if (!htmlStr) return { text: '', thumb: null }
    const thumbMatch = htmlStr.match(/data-thumbnail="([^"]+)"/)
    const thumb = thumbMatch ? thumbMatch[1] : null
    const text = htmlStr.replace(/<[^>]+>/g, '').trim()
    return { text, thumb }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      background: '#06040c',
      color: '#efe6ff',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: 1200, width: '100%' }}>
        <div style={{ marginBottom: 40, textAlign: 'left' }}>
          <Link href="/hub" className="font-pixel" style={{
            fontSize: 9,
            color: '#a493c9',
            textDecoration: 'none',
            borderBottom: '1px solid #3d2668',
            paddingBottom: 2
          }}>
            ◄ BACK TO HUB
          </Link>
        </div>
        <h1 className="font-pixel" style={{ fontSize: 24, color: '#c9a85f', marginBottom: 12, textAlign: 'center' }}>
          WORKSHOP COHORTS
        </h1>
        <p style={{ textAlign: 'center', color: '#a493c9', marginBottom: 40, fontSize: 16 }}>
          Select a cohort to continue your journey or join a new open workshop.
        </p>

        {openCohorts.length > 0 ? (
          <div style={{ marginBottom: 40 }}>
            <h2 className="font-pixel" style={{ fontSize: 14, color: '#45d6ff', marginBottom: 16 }}>OPEN COHORTS</h2>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 24, 
              overflowX: 'auto', 
              paddingBottom: 24,
              scrollbarWidth: 'thin',
              scrollbarColor: '#45d6ff #1a0f2e'
            }}>
              {openCohorts.map(cohort => {
                const isLoading = loadingCohortId === cohort.id
                const isRegistered = registrations.some(r => r.cohort_id === cohort.id && r.status === 'registered')
                const { text: descText, thumb } = parseDescription(cohort.description)
                return (
                  <Link
                    key={cohort.id}
                    href={`/hub/pilot-workshops/${cohort.id}/journey`}
                    onClick={(e) => handleCohortClick(e, cohort.id, isRegistered)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: 'min(calc(100vw - 40px), 380px)',
                      flexShrink: 0,
                      background: isLoading ? '#1a0f2e' : 'linear-gradient(to right, #110a20, #180e2a)',
                      border: '2px solid #3d2668',
                      borderRadius: 16,
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      cursor: isLoading ? 'wait' : 'pointer',
                      textAlign: 'left',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.borderColor = '#45d6ff'
                        e.currentTarget.style.boxShadow = '0 12px 48px rgba(69,214,255,0.15)'
                        e.currentTarget.style.transform = 'translateY(-4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.borderColor = '#3d2668'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'
                        e.currentTarget.style.transform = 'none'
                      }
                    }}
                  >
                    {thumb ? (
                      <div style={{
                        width: '100%',
                        height: 200,
                        backgroundImage: `url(${thumb})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderBottom: '2px solid #3d2668',
                      }} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: 200,
                        background: 'linear-gradient(135deg, rgba(61,38,104,0.4) 0%, rgba(36,21,66,0.4) 100%)',
                        borderBottom: '2px solid #3d2668',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(61,38,104,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="font-pixel" style={{ color: '#45d6ff', fontSize: 16 }}>✦</span>
                        </div>
                      </div>
                    )}
                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, color: '#efe6ff', letterSpacing: '-0.02em' }}>{cohort.name}</h3>
                          <div className="font-pixel" style={{ fontSize: 10, color: '#a493c9' }}>
                            STARTS: {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                          </div>
                        </div>
                        <span className="font-pixel" style={{
                          fontSize: 9,
                          padding: '6px 12px',
                          background: 'rgba(116,240,160,0.1)',
                          color: '#74f0a0',
                          borderRadius: 6,
                          border: '1px solid rgba(116,240,160,0.3)'
                        }}>
                          {cohort.status.toUpperCase()}
                        </span>
                      </div>
                      {descText && (
                        <div style={{ margin: 0, color: '#a493c9', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                          {descText}
                        </div>
                      )}
                      <div className="font-pixel mt-auto pt-6" style={{ fontSize: 11, color: isLoading ? '#6f5e8f' : '#45d6ff', letterSpacing: '1px' }}>
                        {isLoading ? 'LOADING...' : (isRegistered ? 'ENTER JOURNEY ➔' : 'JOIN COHORT ➔')}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, border: '2px dashed #3d2668', borderRadius: 12, background: 'rgba(36,21,66,0.3)' }}>
            <div className="font-pixel" style={{ fontSize: 12, color: '#a493c9', marginBottom: 8 }}>NO COHORTS AVAILABLE</div>
            <p style={{ color: '#6f5e8f', fontSize: 14 }}>There are currently no active workshop cohorts to join.</p>
          </div>
        )}

      </div>
    </div>
  )
}
