'use client'

import { useRouter } from 'next/navigation'
import WorkshopDayForm from './WorkshopDayForm'
import { WorkshopDayFormProps } from '@/types/workshops'

interface WorkshopDayFormWrapperProps extends Omit<WorkshopDayFormProps, 'onCancel'> {
  cancelPath: string
}

/**
 * Client-side wrapper for WorkshopDayForm that handles navigation
 * This allows the server component to specify a cancel path without using redirect()
 */
export default function WorkshopDayFormWrapper({
  cancelPath,
  ...formProps
}: WorkshopDayFormWrapperProps) {
  const router = useRouter()

  const handleCancel = () => {
    router.push(cancelPath)
  }

  return <WorkshopDayForm {...formProps} onCancel={handleCancel} />
}
