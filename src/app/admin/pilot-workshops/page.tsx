import { getCohorts } from '@/app/actions/workshops/cohorts'
import AdminCohortTable from '@/components/workshops/admin/AdminCohortTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import MonitorFrame from '@/components/workshops/journey/MonitorFrame'

export const metadata = {
  title: 'Cohort Management - Admin',
  description: 'Manage workshop cohorts, registrations, and deliverable reviews',
}

export default async function AdminCohortManagementPage() {
  try {
    const { userId } = await auth()
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('clerk_user_id', userId).single()
    const userRole = profile?.role

    const cohorts = await getCohorts()

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
          fontFamily: "'Inter', sans-serif"
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
                  href="/admin"
                  title="Back to admin"
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
            <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
              
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
                      ⚙ COHORT MANAGEMENT
                    </div>
                    <div style={{ fontSize: 14, color: '#9990ab', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                      Manage workshop cohorts, registrations, and deliverable reviews
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/admin/pilot-workshops/create"
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
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    CREATE COHORT
                  </Link>
                </div>
              </div>

              {/* Client-side interactive table */}
              <AdminCohortTable cohorts={cohorts} userRole={userRole} />
              
            </div>
          </div>
        </MonitorFrame>
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cohorts'
    
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06040c',
        color: '#efe6ff',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ border: '2px dashed #ff4545', background: 'rgba(255,69,69,0.1)', padding: 40, borderRadius: 12, textAlign: 'center' }}>
          <h2 className="font-pixel" style={{ fontSize: 16, color: '#ff4545', marginBottom: 16 }}>ACCESS DENIED</h2>
          <p style={{ color: '#ff8888', marginBottom: 24 }}>{message}</p>
          <Link
            href="/admin"
            className="font-pixel"
            style={{ fontSize: 10, color: '#a493c9', textDecoration: 'none' }}
          >
            ◄ BACK TO ADMIN DASHBOARD
          </Link>
        </div>
      </div>
    )
  }
}
