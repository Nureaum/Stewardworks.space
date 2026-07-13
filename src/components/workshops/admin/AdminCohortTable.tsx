'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Search, 
  Edit, 
  CheckCircle2,
  Filter,
  Plus,
  Calendar
} from 'lucide-react'
import type { Cohort } from '@/types/workshops'

interface CohortWithCounts extends Cohort {
  registered_count: number
  waitlisted_count: number
  creator?: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
  }
  updater?: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
  }
}

type StatusFilter = 'all' | 'draft' | 'open' | 'closed' | 'completed'

interface AdminCohortTableProps {
  cohorts: CohortWithCounts[]
  userRole?: string | null
}

export default function AdminCohortTable({ cohorts, userRole }: AdminCohortTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredCohorts = useMemo(() => {
    let filtered = cohorts

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cohort => cohort.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cohort => 
        cohort.name.toLowerCase().includes(query) ||
        cohort.description?.toLowerCase().includes(query) ||
        cohort.creator?.full_name?.toLowerCase().includes(query) ||
        cohort.updater?.full_name?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [cohorts, searchQuery, statusFilter])

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'open':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-steward-blue/20 text-steward-blue'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* Filters */}
      <div style={{
        background: 'rgba(36,21,66,0.5)',
        border: '2px solid #3d2668',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
      }}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#a493c9' }} />
            <input
              type="text"
              placeholder="Search cohorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                background: '#1a0f2e',
                border: '1px solid #3d2668',
                borderRadius: 8,
                color: '#efe6ff',
                fontFamily: "'Inter', sans-serif"
              }}
              className="focus:outline-none focus:border-[#c9a85f]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: '#a493c9' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: '10px 16px',
                background: '#1a0f2e',
                border: '1px solid #3d2668',
                borderRadius: 8,
                color: '#efe6ff',
                fontFamily: "'Inter', sans-serif"
              }}
              className="focus:outline-none focus:border-[#c9a85f]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 font-pixel" style={{ fontSize: 10, color: '#a493c9' }}>
        SHOWING {filteredCohorts.length} OF {cohorts.length} COHORTS
      </div>

      {/* Cohorts Table */}
      {filteredCohorts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, border: '2px dashed #3d2668', borderRadius: 12, background: 'rgba(36,21,66,0.3)' }}>
          <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#3d2668' }} />
          <h3 className="font-pixel" style={{ fontSize: 14, color: '#c9a85f', marginBottom: 8 }}>
            NO COHORTS FOUND
          </h3>
          <p style={{ color: '#6f5e8f', fontSize: 14, marginBottom: 20 }}>
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Get started by creating your first cohort'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/admin/pilot-workshops/create"
              className="font-pixel inline-flex items-center gap-2"
              style={{
                background: '#45d6ff',
                color: '#06040c',
                padding: '10px 16px',
                borderRadius: 6,
                fontSize: 10,
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              <Plus className="w-4 h-4" />
              CREATE COHORT
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCohorts.map((cohort) => {
            // Helper to parse description HTML injected by rich text editors
            const descHtml = cohort.description || '';
            const thumbMatch = descHtml.match(/data-thumbnail="([^"]+)"/);
            const thumb = thumbMatch ? thumbMatch[1] : null;
            const descText = descHtml.replace(/<[^>]+>/g, '').trim() || 'No description provided for this cohort.';

            return (
            <div
              key={cohort.id}
              onClick={() => {
                setLoadingId(cohort.id)
                router.push(`/hub/pilot-workshops/${cohort.id}/journey?mode=admin`)
              }}
              className="flex flex-col p-6 rounded-2xl transition-all"
              style={{
                background: '#241542',
                border: '2px solid #3d2668',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                cursor: loadingId === cohort.id ? 'wait' : 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#c9a85f'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3d2668'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {/* Thumbnail at top */}
              {thumb ? (
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundImage: `url(${thumb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 8,
                  marginBottom: 16,
                  border: '1px solid rgba(61,38,104,0.5)',
                }} />
              ) : (
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, rgba(61,38,104,0.4) 0%, rgba(36,21,66,0.4) 100%)',
                  borderRadius: 8,
                  marginBottom: 16,
                  border: '1px solid rgba(61,38,104,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(61,38,104,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-pixel" style={{ color: '#c9a85f', fontSize: 12 }}>✦</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#efe6ff', margin: '0 0 4px 0' }}>
                    {cohort.name}
                  </h3>
                  <div className="font-pixel" style={{ fontSize: 9, color: '#a493c9' }}>
                    STARTS: {formatDate(cohort.start_date)}
                  </div>
                </div>
                <span className="font-pixel" style={{
                  fontSize: 8,
                  padding: '4px 8px',
                  background: cohort.status === 'open' ? 'rgba(116,240,160,0.2)' : 'rgba(164,147,201,0.2)',
                  color: cohort.status === 'open' ? '#74f0a0' : (cohort.status === 'completed' ? '#45d6ff' : '#a493c9'),
                  borderRadius: 4,
                  border: `1px solid ${cohort.status === 'open' ? '#74f0a0' : (cohort.status === 'completed' ? '#45d6ff' : '#3d2668')}`
                }}>
                  {cohort.status.toUpperCase()}
                </span>
              </div>

              <div className="mb-6 pt-4" style={{ borderTop: '1px solid #3d2668', flex: 1 }}>
                <p style={{ fontSize: 13, color: '#a493c9', lineHeight: 1.5, margin: 0 }}>
                  {descText}
                </p>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between gap-2" style={{ borderTop: '1px solid #3d2668' }}>
                <div className="flex gap-2">
                  <Link
                    href={`/hub/pilot-workshops/${cohort.id}/journey`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl transition-colors"
                    style={{ color: '#a493c9', background: '#1a0f2e' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a85f'; e.currentTarget.style.background = '#241542' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#a493c9'; e.currentTarget.style.background = '#1a0f2e' }}
                    title="Student Journey View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </Link>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLoadingId(cohort.id)
                    router.push(`/hub/pilot-workshops/${cohort.id}/journey?mode=admin`)
                  }}
                  disabled={loadingId === cohort.id}
                  className="font-pixel px-4 py-2 rounded-xl transition-colors"
                  style={{
                    fontSize: 9,
                    color: '#c9a85f',
                    background: 'transparent',
                    border: '1px solid #c9a85f',
                    cursor: loadingId === cohort.id ? 'wait' : 'pointer',
                    opacity: loadingId === cohort.id ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { if (loadingId !== cohort.id) e.currentTarget.style.background = 'rgba(201,168,95,0.1)' }}
                  onMouseLeave={(e) => { if (loadingId !== cohort.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {loadingId === cohort.id ? 'LOADING...' : 'EDIT'}
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </>
  )
}
