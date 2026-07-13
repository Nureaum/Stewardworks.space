import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { createCohort } from '@/app/actions/workshops/cohorts'
import CohortFormWrapper from '@/components/workshops/admin/CohortFormWrapper'
import { CreateCohortParams } from '@/types/workshops'
import Link from 'next/link'
import MonitorFrame from '@/components/workshops/journey/MonitorFrame'

export default async function CreateCohortPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/hub/pilot-workshops')
  }

  async function handleCreateCohort(data: CreateCohortParams) {
    'use server'
    const cohort = await createCohort(data)
    redirect(`/hub/pilot-workshops/${cohort.id}/journey?mode=admin`)
  }

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
              <Link
                href="/admin/pilot-workshops"
                title="Back to cohorts"
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
                ◂ ADMIN HUB
              </Link>
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

            {/* Right: traffic lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
              <div style={{ display: 'flex', gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e06a5a', display: 'block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b84a', display: 'block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5fbf7a', display: 'block' }} />
              </div>
            </div>
          </div>
        }
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(14px,2.5vw,26px) clamp(12px,3vw,24px)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
            
            {/* Inner Console Header */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              justifyContent: 'space-between',
              border: '2px solid #3a3352',
              borderRadius: 12,
              padding: '15px 19px',
              background: '#201a30',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <svg width="26" height="26" viewBox="0 0 16 16" style={{ flex: 'none', imageRendering: 'pixelated' as any }}>
                  <rect x="7" y="1" width="2" height="14" fill="#c98bad" />
                  <rect x="1" y="7" width="14" height="2" fill="#8aa6c4" />
                  <rect x="6" y="6" width="4" height="4" fill="#c9a85f" />
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div className="font-pixel" style={{ fontSize: 'clamp(10px,1.8vw,13px)', color: '#e4e0ee' }}>
                    ⚙ CREATE COHORT
                  </div>
                  <div style={{ fontSize: 14, color: '#9990ab', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                    Initialize a new workshop cohort and define its parameters
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/admin/pilot-workshops"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    cursor: 'pointer',
                    padding: '11px 14px',
                    borderRadius: 6,
                    border: '2px solid #45d6ff',
                    background: 'transparent',
                    color: '#45d6ff',
                    whiteSpace: 'nowrap',
                    flex: 'none',
                    boxShadow: '0 0 12px rgba(69,214,255,.25)',
                    textDecoration: 'none'
                  }}
                >
                  ◂ RETURN
                </Link>
              </div>
            </div>

            <CohortFormWrapper
              onSubmit={handleCreateCohort}
              cancelPath="/admin/pilot-workshops"
            />
            
          </div>
        </div>
      </MonitorFrame>
    </div>
  )
}
