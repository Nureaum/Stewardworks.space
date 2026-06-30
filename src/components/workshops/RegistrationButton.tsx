'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RegistrationButtonProps } from '@/types/workshops'
import { Loader2, Check, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function RegistrationButton({
  cohortId,
  cohortStatus,
  registrationOpensAt,
  registrationClosesAt,
  capacity,
  registeredCount,
  userRegistration,
  onRegister,
}: RegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Determine button state
  const now = new Date()
  
  // User already registered
  if (userRegistration) {
    if (userRegistration.status === 'registered') {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium"
        >
          <Check className="w-4 h-4" />
          You're Registered
        </button>
      )
    }
    
    if (userRegistration.status === 'waitlisted') {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg font-medium"
        >
          <Clock className="w-4 h-4" />
          Waitlisted
        </button>
      )
    }
  }

  // Check if registration is open
  let canRegister = cohortStatus === 'open'
  let disabledMessage = ''

  if (registrationOpensAt) {
    const opensAt = new Date(registrationOpensAt)
    if (now < opensAt) {
      canRegister = false
      disabledMessage = `Registration opens on ${opensAt.toLocaleDateString()}`
    }
  }

  if (registrationClosesAt) {
    const closesAt = new Date(registrationClosesAt)
    if (now > closesAt) {
      canRegister = false
      disabledMessage = 'Registration closed'
    }
  }

  if (cohortStatus !== 'open') {
    canRegister = false
    disabledMessage = 'Registration not available'
  }

  // Check if at capacity (will be waitlisted)
  const isAtCapacity = capacity && registeredCount >= capacity
  const buttonText = isAtCapacity ? 'Join Waitlist' : 'Register'

  const handleClick = async () => {
    setIsLoading(true)
    
    try {
      const result = await onRegister(cohortId)
      
      // Redirect to the dashboard with query parameters indicating registration success
      router.push(`/hub/pilot-workshops/${cohortId}?registered=true&status=${result.status}`)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast.error(`Registration Failed\n${message}`)
      setIsLoading(false)
    }
  }

  if (!canRegister) {
    return (
      <button
        disabled
        className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg font-medium cursor-not-allowed"
      >
        {disabledMessage || 'Registration Unavailable'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isAtCapacity
          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Registering...
        </>
      ) : (
        buttonText
      )}
    </button>
  )
}
