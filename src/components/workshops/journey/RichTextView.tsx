'use client'

import React from 'react'

interface RichTextViewProps {
  html: string
  style?: React.CSSProperties
  className?: string
}

/**
 * Renders sanitized HTML content from the rich text editor.
 * Uses dangerouslySetInnerHTML — content is admin-authored via TipTap.
 */
export default function RichTextView({ html, style, className }: RichTextViewProps) {
  if (!html) return null

  return (
    <div
      className={className}
      style={{
        fontSize: '18px',
        color: 'var(--tx, #efe6ff)',
        lineHeight: 1.5,
        fontFamily: "'VT323', monospace",
        ...style,
        // Prose styles for nested HTML
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
