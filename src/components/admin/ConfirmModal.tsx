import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steward-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6 sm:p-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-steward-dark mb-2 tracking-tight">{title}</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-5 py-2.5 text-sm font-black text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-widest"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
