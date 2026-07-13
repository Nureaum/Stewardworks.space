'use client'

import React, { useEffect, useState } from 'react'

interface RetroToastProps {
  message: string | null
  duration?: number
  onClose: () => void
}

export default function RetroToast({ message, duration = 3000, onClose }: RetroToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px',
        color: '#12081e',
        background: 'var(--gold, #ffd23f)',
        padding: '12px 20px',
        borderRadius: '20px',
        boxShadow: '0 0 18px rgba(255,210,63,.5)',
        whiteSpace: 'nowrap',
        maxWidth: '92%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        animation: visible ? 'retro-toastin .3s ease both' : undefined,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}
