'use client'

import { useState, useEffect } from 'react'
import { User, Calendar, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Registrant {
  id: string
  cohort_id: string
  profile_id: string
  registered_at: string
  status: 'registered' | 'waitlisted' | 'cancelled'
  participant_name: string
  participant_email: string
}

interface RegistrantListProps {
  cohortId: string
  capacity?: number | null
}

export default function RegistrantList({ cohortId, capacity }: RegistrantListProps) {
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [filteredRegistrants, setFilteredRegistrants] = useState<Registrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'waitlisted' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registrant | null>(null)

  // Load registrations
  useEffect(() => {
    loadRegistrations()
  }, [cohortId])

  // Apply filters
  useEffect(() => {
    let filtered = registrants

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.participant_name.toLowerCase().includes(query) ||
        r.participant_email.toLowerCase().includes(query)
      )
    }

    setFilteredRegistrants(filtered)
  }, [registrants, statusFilter, searchQuery])

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Import the server action dynamically to avoid build issues
      const { getRegistrations } = await import('@/app/actions/workshops/admin-reviews')
      const data = await getRegistrations(cohortId)
      
      setRegistrants(data)
    } catch (err: any) {
      console.error('Failed to load registrations:', err)
      setError(err.message || 'Failed to load registrations')
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (registration: Registrant) => {
    setSelectedRegistration(registration)
    setShowConfirmModal(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedRegistration) return

    try {
      setUpdatingStatus(selectedRegistration.id)
      
      // Import the server action dynamically
      const { updateRegistrationStatus } = await import('@/app/actions/workshops/admin-reviews')
      
      await updateRegistrationStatus({
        registrationId: selectedRegistration.id,
        newStatus: 'registered'
      })

      toast.success('Successfully moved to registered status')
      
      // Reload registrations
      await loadRegistrations()
      
      setShowConfirmModal(false)
      setSelectedRegistration(null)
    } catch (err: any) {
      console.error('Failed to update registration status:', err)
      toast.error(err.message || 'Failed to update registration status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Registered</span>
          </div>
        )
      case 'waitlisted':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Waitlisted</span>
          </div>
        )
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
          </div>
        )
      default:
        return null
    }
  }

  const registeredCount = registrants.filter(r => r.status === 'registered').length
  const waitlistedCount = registrants.filter(r => r.status === 'waitlisted').length

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-steward-dark mb-2">Error Loading Registrations</h3>
          <p className="text-gray-600 font-medium mb-4">{error}</p>
          <button
            onClick={loadRegistrations}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-steward-dark">Registrations</h2>
              <p className="text-sm text-gray-600 font-medium mt-1">
                Manage participants for this cohort
              </p>
            </div>
            
            {/* Capacity Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black text-steward-dark">
                  {registeredCount}
                  {capacity && <span className="text-gray-400"> / {capacity}</span>}
                </div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Registered
                </div>
              </div>
              {waitlistedCount > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-black text-yellow-600">{waitlistedCount}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Waitlisted
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-green focus:bg-white transition-all font-medium text-steward-dark"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-green focus:bg-white transition-all font-bold text-sm text-steward-dark uppercase tracking-wider cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="registered">Registered</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrants Table */}
        {filteredRegistrants.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {searchQuery || statusFilter !== 'all' 
                ? 'No registrations match your filters' 
                : 'No registrations yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 lg:-mx-8">
            <div className="inline-block min-w-full align-middle px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Participant
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegistrants.map((registrant) => (
                    <tr key={registrant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-steward-green rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-steward-dark">
                            {registrant.participant_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 font-medium">
                          {registrant.participant_email}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-medium">{formatDate(registrant.registered_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(registrant.status)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {registrant.status === 'waitlisted' && (
                          <button
                            onClick={() => handleStatusChange(registrant)}
                            disabled={updatingStatus === registrant.id}
                            className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingStatus === registrant.id ? 'Processing...' : 'Move to Registered'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Count */}
        {filteredRegistrants.length > 0 && (
          <div className="text-sm text-gray-500 font-medium text-center pt-4 border-t border-gray-100">
            Showing {filteredRegistrants.length} of {registrants.length} registration{registrants.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-steward-dark">
                Confirm Status Change
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700 font-medium">
                Are you sure you want to move <span className="font-black">{selectedRegistration.participant_name}</span> from waitlist to registered status?
              </p>
              {capacity && registeredCount >= capacity && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Note: This cohort is at capacity ({registeredCount}/{capacity}). Proceeding will exceed the capacity limit.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 font-medium">
                If the cohort has already started, Day 1 will be unlocked for this participant.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedRegistration(null)
                }}
                disabled={updatingStatus !== null}
                className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingStatus !== null}
                className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {updatingStatus ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
