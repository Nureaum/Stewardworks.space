'use client'

import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CohortOption {
  id: string
  name: string
  start_date: string
  registration_status: string
}

interface CohortSelectorProps {
  cohorts: CohortOption[]
  currentCohortId: string
}

export default function CohortSelector({ cohorts, currentCohortId }: CohortSelectorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentCohort = cohorts.find(c => c.id === currentCohortId)

  if (cohorts.length <= 1) {
    // Don't show selector if user is only registered for one cohort
    return null
  }

  const handleSelectCohort = (cohortId: string) => {
    setIsOpen(false)
    router.push(`/hub/pilot-workshops/${cohortId}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="text-sm font-medium text-gray-700">
          {currentCohort?.name || 'Select Cohort'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Registered Cohorts
              </p>
              {cohorts.map(cohort => {
                const isActive = cohort.id === currentCohortId
                const startDate = new Date(cohort.start_date)
                
                return (
                  <button
                    key={cohort.id}
                    onClick={() => handleSelectCohort(cohort.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-900' 
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="font-medium text-sm">{cohort.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Starts {startDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
