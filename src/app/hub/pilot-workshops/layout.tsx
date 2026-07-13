import React from 'react'
import './retro-theme.css'

export default function PilotWorkshopsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="retro-journey font-retro" style={{ minHeight: '100vh', background: '#e7c9a4' }}>
      {/* Google Fonts for retro pixel-art UI */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  )
}
