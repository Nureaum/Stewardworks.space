'use client'

import React from 'react'

interface RetroPanelProps {
  borderColor?: string
  glowColor?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function RetroPanel({
  borderColor = 'var(--ln, #3d2668)',
  glowColor,
  children,
  className = '',
  style,
}: RetroPanelProps) {
  return (
    <div
      className={className}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        padding: '14px 16px',
        background: 'var(--pn, #241542)',
        boxShadow: glowColor ? `0 0 18px ${glowColor}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
