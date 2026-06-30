'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
}

export default function AdminCohortTable({ cohorts }: AdminCohortTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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
        return 'bg-blue-100 text-blue-700'
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cohorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredCohorts.length} of {cohorts.length} cohorts
      </div>

      {/* Cohorts Table */}
      {filteredCohorts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Cohorts Found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Get started by creating your first cohort'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/admin/pilot-workshops/create"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Cohort
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cohort Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCohorts.map((cohort) => (
                  <tr key={cohort.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cohort.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(cohort.start_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(cohort.status)}`}>
                        {cohort.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.capacity ?? 'Unlimited'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Users className="w-4 h-4 text-gray-400" />
                        {cohort.registered_count}
                        {cohort.waitlisted_count > 0 && (
                          <span className="text-yellow-600">
                            (+{cohort.waitlisted_count} waitlisted)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cohort.creator?.full_name || cohort.creator?.first_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cohort.updater?.full_name || cohort.updater?.first_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/pilot-workshops/${cohort.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit Cohort"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/pilot-workshops/${cohort.id}/registrations`}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="View Registrations"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/pilot-workshops/${cohort.id}/reviews`}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                          title="Review Deliverables"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
