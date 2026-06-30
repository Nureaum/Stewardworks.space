'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import { deleteAILab } from '@/app/actions/ai-labs'
import { ConfirmModal } from './ConfirmModal'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface AILabActionsProps {
  labId: string
}

export function AILabActions({ labId }: AILabActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteAILab(labId)
      toast.success('AI Lab deleted successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete AI Lab')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/ai-labs/${labId}/edit`}
        className="p-2 text-gray-400 hover:text-steward-gold transition-colors rounded-lg hover:bg-steward-gold/10"
        title="Edit AI Lab"
      >
        <Edit2 size={18} />
      </Link>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        disabled={isDeleting}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
        title="Delete AI Lab"
      >
        <Trash2 size={18} />
      </button>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete AI Lab"
        message="Are you sure you want to delete this AI Lab? This action cannot be undone."
      />
    </div>
  )
}
