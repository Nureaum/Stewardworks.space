'use client'

import React from 'react'

interface MonitorFrameProps {
  children: React.ReactNode
  header?: React.ReactNode
  showScanlines?: boolean
  className?: string
}

/**
 * Wraps the game content in a retro CRT monitor bezel.
 * The tan/cream outer frame with the dark screen inside.
 */
export default function MonitorFrame({ children, header, showScanlines = true, className }: MonitorFrameProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: 1220,
        border: '12px solid #d8ccb0',
        background: '#efe7d6',
        borderRadius: 20,
        padding: 10,
        boxShadow:
          '0 24px 60px rgba(60,30,10,.35), inset 0 2px 0 rgba(255,255,255,.6), inset 0 -3px 0 rgba(0,0,0,.12)',
      }}
    >
      {header}
      {/* Screen */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg, #12081e)',
          borderRadius: 10,
          overflow: 'hidden',
          minHeight: 'clamp(560px, 80vh, 940px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            'inset 0 0 0 2px rgba(0,0,0,.5), inset 0 0 80px rgba(0,0,0,.55)',
        }}
      >
        {/* CRT effects */}
        {showScanlines && (
          <>
            <div className="retro-scanlines" />
            <div className="retro-vignette" />
          </>
        )}
        {children}
      </div>
    </div>
  )
}
