'use client'

import { CohortCardProps } from '@/types/workshops'
import { Calendar, Users, Clock, GraduationCap } from 'lucide-react'
import RegistrationButton from './RegistrationButton'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CohortCard({ cohort, onRegister, hasCompletedOnboarding }: CohortCardProps) {
  const router = useRouter()
  const startDate = new Date(cohort.start_date)
  const now = new Date()
  const hasStarted = startDate <= now

  // Calculate capacity remaining
  const capacityRemaining = cohort.capacity 
    ? Math.max(0, cohort.capacity - cohort.registered_count)
    : null

  // Determine registration status message
  let statusMessage = ''
  let statusColor = 'text-gray-600'

  if (cohort.user_registration) {
    if (cohort.user_registration.status === 'registered') {
      statusMessage = "You're registered"
      statusColor = 'text-green-600'
    } else if (cohort.user_registration.status === 'waitlisted') {
      statusMessage = 'Waitlisted'
      statusColor = 'text-yellow-600'
    }
  } else if (cohort.registration_opens_at) {
    const opensAt = new Date(cohort.registration_opens_at)
    if (now < opensAt) {
      statusMessage = `Registration opens ${opensAt.toLocaleDateString()}`
      statusColor = 'text-gray-500'
    }
  }

  if (cohort.registration_closes_at) {
    const closesAt = new Date(cohort.registration_closes_at)
    if (now > closesAt && !cohort.user_registration) {
      statusMessage = 'Registration closed'
      statusColor = 'text-gray-500'
    }
  }

  let thumbnailUrl = ''
  let cleanDescription = cohort.description || ''
  if (cohort.description) {
    const match = cohort.description.match(/<div data-thumbnail="(.*?)" style="display:none;"><\/div>/)
    if (match) {
      thumbnailUrl = match[1]
      cleanDescription = cohort.description.replace(match[0], '').trim()
    }
  }

  return (
    <div className="group flex flex-col bg-white rounded-3xl border border-steward-dark/5 shadow-md hover:shadow-xl transition-all overflow-hidden relative">
      {hasCompletedOnboarding === false ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            const returnUrl = encodeURIComponent('/hub/pilot-workshops');
            router.push(`/onboarding/language?returnUrl=${returnUrl}`);
          }}
          className="absolute inset-0 z-10 w-full cursor-pointer text-left focus:outline-none"
          aria-label={`Complete onboarding to view ${cohort.name}`}
        />
      ) : (
        <Link href={`/hub/pilot-workshops/${cohort.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${cohort.name}`} />
      )}
      
      
      {/* Image Block (matches Env Literacy) */}
      <div className="w-full aspect-[4/3] relative bg-steward-blue/10 overflow-hidden flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={cohort.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <GraduationCap className="w-24 h-24 text-steward-blue/20 group-hover:scale-110 transition-transform duration-500" />
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-steward-blue text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
            WORKSHOP
          </span>
        </div>
        {statusMessage && (
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
              statusColor === 'text-green-600' ? 'bg-steward-green text-white' :
              statusColor === 'text-yellow-600' ? 'bg-yellow-400 text-steward-dark' :
              'bg-gray-100 text-gray-700'
            }`}>
              {statusMessage}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-black text-steward-dark uppercase tracking-tight leading-tight mb-3 group-hover:text-steward-blue transition-colors line-clamp-2">
          {cohort.name}
        </h3>

      {cleanDescription && (
        <div 
          className="text-gray-500 font-medium text-sm mb-8 line-clamp-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: cleanDescription }}
        />
      )}

      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
          <span className="text-sm font-bold text-gray-700">
            Starts {startDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {cohort.capacity && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Users className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm font-bold text-gray-700">
              {cohort.registered_count} / {cohort.capacity} Registered
              {cohort.waitlisted_count && cohort.waitlisted_count > 0 && (
                <span className="text-yellow-600 ml-1 italic">
                  ({cohort.waitlisted_count} waitlisted)
                </span>
              )}
            </span>
          </div>
        )}

        {!hasStarted && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Clock className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm font-bold text-gray-700">
              {Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} Days until start
            </span>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 relative z-20">
        <RegistrationButton
          cohortId={cohort.id}
          cohortStatus={cohort.status}
          registrationOpensAt={cohort.registration_opens_at}
          registrationClosesAt={cohort.registration_closes_at}
          capacity={cohort.capacity}
          registeredCount={cohort.registered_count}
          userRegistration={cohort.user_registration}
          hasCompletedOnboarding={hasCompletedOnboarding}
          onRegister={onRegister || (async () => {
            throw new Error('Registration handler not provided')
          })}
        />
      </div>
      </div>
    </div>
  )
}
