'use client'

import React from 'react'

interface ArcadeButtonProps {
  active?: boolean
  color?: string  // CSS color for active state
  onClick?: () => void
  children: React.ReactNode
  className?: string
  title?: string
  style?: React.CSSProperties
}

export default function ArcadeButton({
  active = false,
  color = 'var(--p, #ff5fd2)',
  onClick,
  children,
  className = '',
  title,
  style,
}: ArcadeButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 'clamp(7px, 1.2vw, 9px)',
    lineHeight: '1.6',
    cursor: 'pointer',
    padding: '9px 12px',
    borderRadius: '4px',
    border: `2px solid ${color}`,
    background: active ? color : 'transparent',
    color: active ? '#12081e' : '#efe6ff',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s ease',
    boxShadow: active ? `0 0 14px ${color}` : 'none',
    ...style,
  }

  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={baseStyle}
    >
      {children}
    </button>
  )
}
