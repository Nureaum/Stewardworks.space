'use client'

import { useRouter } from 'next/navigation'
import CohortForm from './CohortForm'
import { CohortFormProps } from '@/types/workshops'

interface CohortFormWrapperProps extends Omit<CohortFormProps, 'onCancel'> {
  cancelPath: string
}

/**
 * Client-side wrapper for CohortForm that handles navigation
 * This allows the server component to specify a cancel path without using redirect()
 */
export default function CohortFormWrapper({
  cancelPath,
  ...formProps
}: CohortFormWrapperProps) {
  const router = useRouter()

  const handleCancel = () => {
    router.push(cancelPath)
  }

  return <CohortForm {...formProps} onCancel={handleCancel} />
}
