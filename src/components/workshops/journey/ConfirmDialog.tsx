'use client'

import React, { useState } from 'react'

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (e) {
      console.error('Confirm action failed:', e)
      setIsDeleting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.75)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={isDeleting ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#201a30',
          border: '3px solid var(--gold,#ffd23f)',
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 0 30px rgba(255,210,63,.3)',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        <div
          className="font-pixel"
          style={{
            fontSize: 10,
            color: 'var(--gold,#ffd23f)',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {isDeleting ? '⏳ DELETING...' : '⚠ CONFIRM ACTION'}
        </div>
        
        <div
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: 20,
            color: 'var(--tx,#efe6ff)',
            marginBottom: 28,
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          {isDeleting ? 'Please wait while deleting...' : message}
        </div>

        {isDeleting ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 28,
              height: 28,
              border: '3px solid rgba(255,210,63,.2)',
              borderTopColor: 'var(--gold,#ffd23f)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onCancel}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '12px 24px',
                border: '2px solid var(--mu,#9990ab)',
                borderRadius: 8,
                background: 'rgba(153,144,171,.15)',
                color: 'var(--mu,#9990ab)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(153,144,171,.3)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(153,144,171,.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              CANCEL
            </button>

            <button
              onClick={handleConfirm}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '12px 24px',
                border: '2px solid #ff4545',
                borderRadius: 8,
                background: 'rgba(255,69,69,.2)',
                color: '#ff6b6b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,69,69,.35)'
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255,69,69,.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,69,69,.2)'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              DELETE
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
