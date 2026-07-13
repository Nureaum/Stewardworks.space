'use client'

import React from 'react'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  gradient?: string
  glowColor?: string
  height?: number
}

export default function ProgressBar({
  value,
  gradient = 'linear-gradient(90deg, var(--p, #ff5fd2), var(--gold, #ffd23f))',
  glowColor = 'var(--p, #ff5fd2)',
  height = 16,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      style={{
        height,
        background: 'rgba(0,0,0,.4)',
        border: '2px solid var(--ln, #3d2668)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clamped}%`,
          background: gradient,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 12px ${glowColor}`,
        }}
      />
    </div>
  )
}
