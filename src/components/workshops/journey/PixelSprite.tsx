'use client'

import React, { useMemo, forwardRef } from 'react'
import {
  type SpriteRect,
  darken,
  CHARACTERS,
  HAIR,
  FACIAL,
  OUTFIT,
  HEADGEAR,
  GEAR,
  HAIRHEX,
} from './character-data'

interface PixelSpriteProps {
  /** Character key e.g. 'nayeli' */
  characterKey: string
  /** Accent/aura hex color */
  accent: string
  /** Override options (people only unless gear) */
  opts?: {
    tint?: string
    hairColor?: string
    hair?: string
    facial?: string
    outfit?: string
    headgear?: string
    gear?: string
  }
  /** Display size in px */
  size?: number
  className?: string
  style?: React.CSSProperties
}

/** Convert rect arrays to an SVG data URI */
function rectsToSvg(
  rects: SpriteRect[],
  accent: string,
  gridSize: number,
  skin?: string,
  hair?: string
): string {
  const accD = darken(accent, 0.32)
  const skinD = skin ? darken(skin, 0.26) : accent
  const hairD = hair ? darken(hair, 0.36) : '#160f22'

  const body = rects
    .map((r) => {
      let c = r[4]
      if (c === 'A') c = accent
      else if (c === 'AD') c = accD
      else if (c === 'SK') c = skin || accent
      else if (c === 'SD') c = skinD
      else if (c === 'HR') c = hair || '#241812'
      else if (c === 'HD') c = hairD
      return `<rect x='${r[0]}' y='${r[1]}' width='${r[2]}' height='${r[3]}' fill='${c}'/>`
    })
    .join('')

  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}' viewBox='0 0 ${gridSize} ${gridSize}' shape-rendering='crispEdges'><rect width='${gridSize}' height='${gridSize}' fill='transparent'/>${body}</svg>`
    )
  )
}

/** Build the full sprite URI for a character with customization options */
export function buildSpriteUri(
  characterKey: string,
  accent: string,
  opts?: PixelSpriteProps['opts']
): string {
  const sp = CHARACTERS[characterKey]
  if (!sp) return ''

  const people = sp.people
  const skin =
    people && opts?.tint && opts.tint !== 'default'
      ? opts.tint
      : sp.skinDefault || '#e8b088'
  const sigHair = HAIRHEX[characterKey] || '#241812'
  const hairCol =
    opts?.hairColor && opts.hairColor !== 'default' ? opts.hairColor : sigHair

  let rects = sp.rects.slice()

  if (people) {
          if (sp.faceFx?.length) rects = rects.concat(sp.faceFx)
      const hr = HAIR[opts?.hair || 'signature']
    if (hr?.length) rects = rects.concat(hr)
    const fh = FACIAL[opts?.facial || 'none']
    if (fh?.length) rects = rects.concat(fh)
    const of_ = OUTFIT[opts?.outfit || 'plain']
    if (of_?.length) rects = rects.concat(of_)
    const hg = HEADGEAR[opts?.headgear || 'bare']
    if (hg?.length) rects = rects.concat(hg)
  }

  const gr = GEAR[opts?.gear || 'none']
  if (gr?.length) rects = rects.concat(gr)

  return rectsToSvg(rects, accent, 32, skin, hairCol)
}

/** Render a pixel sprite as an <img> — supports ref forwarding for imperative positioning */
const PixelSprite = forwardRef<HTMLImageElement, PixelSpriteProps>(function PixelSprite(
  { characterKey, accent, opts, size = 50, className, style },
  ref
) {
  const uri = useMemo(
    () => buildSpriteUri(characterKey, accent, opts),
    [characterKey, accent, opts]
  )

  if (!uri) return null

  return (
    <img
      ref={ref}
      src={uri}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  )
})

export default PixelSprite

/** Build a 16×16 icon data URI from raw rects */
export function buildIconUri(rects: SpriteRect[], accent: string): string {
  return rectsToSvg(rects, accent, 16)
}

