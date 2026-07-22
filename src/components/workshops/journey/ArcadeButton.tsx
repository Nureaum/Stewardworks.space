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
    fontSize: 11,
    lineHeight: '1.6',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '5px',
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
