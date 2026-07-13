'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { WorkshopCharacter, DayWithSections, WorkshopDayEntry, SceneConfig, WorkshopPrinciple, WorkshopProgress } from '@/types/workshops'
import { PixelSprite, buildIconUri } from '@/components/workshops/journey'
import { DEFAULT_CHARACTER } from './character-data'
import ArtifactReader from './ArtifactReader'

interface JourneySceneProps {
  character: WorkshopCharacter
  day: DayWithSections
  visited: Record<string, boolean>
  setVisited: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onBack: () => void
  cohortId: string
  principles: WorkshopPrinciple[]
  bankedPrincipleIds: string[]
  progressRows: WorkshopProgress[]
  onDeliverableSubmitted: (msg: string) => void
  onOpenList: () => void
}

/* ── Artifact pedestal SVG builder (matches HTML prototype exactly) ── */
function artifactKind(t: string) {
  return { text: 'scroll', custom: 'scroll', list: 'tablet', dual: 'book', featured: 'orb', deliverable: 'chest' }[t] || 'scroll'
}

function artifactUri(type: string, scene: SceneConfig, accent: string, visited: boolean): string {
  const kind = artifactKind(type)
  const p0 = (scene as any).pedestal?.[0] || '#8a6a44'
  const p1 = (scene as any).pedestal?.[1] || '#6a4a2c'
  const gl = visited ? (scene.glow || '#ffd23f') : accent

  let relic = ''
  if (kind === 'scroll') relic = `<rect x='24' y='14' width='24' height='30' rx='2' fill='#f2e6cf'/><rect x='24' y='14' width='24' height='4' fill='#d8c49a'/><rect x='24' y='40' width='24' height='4' fill='#d8c49a'/><rect x='29' y='22' width='14' height='2' fill='${gl}'/><rect x='29' y='27' width='14' height='2' fill='#9a8a6a'/><rect x='29' y='32' width='10' height='2' fill='#9a8a6a'/>`
  else if (kind === 'tablet') relic = `<rect x='22' y='12' width='28' height='32' rx='3' fill='#3a3352'/><rect x='22' y='12' width='28' height='32' rx='3' fill='none' stroke='${gl}' stroke-width='2'/><rect x='27' y='19' width='18' height='2' fill='${gl}'/><rect x='27' y='24' width='18' height='2' fill='#8a7fb0'/><rect x='27' y='29' width='18' height='2' fill='#8a7fb0'/><rect x='27' y='34' width='11' height='2' fill='#8a7fb0'/>`
  else if (kind === 'book') relic = `<rect x='20' y='16' width='16' height='26' fill='#45d6ff'/><rect x='36' y='16' width='16' height='26' fill='#ffd23f'/><rect x='34' y='14' width='4' height='30' fill='#f2e6cf'/><rect x='24' y='22' width='9' height='2' fill='#0c0718' opacity='.4'/><rect x='40' y='22' width='9' height='2' fill='#0c0718' opacity='.4'/>`
  else if (kind === 'orb') relic = `<circle cx='36' cy='28' r='15' fill='${gl}' opacity='.28'/><circle cx='36' cy='28' r='11' fill='${gl}'/><path d='M32 22 L32 34 L44 28 Z' fill='#0c0718'/>`
  else relic = `<rect x='20' y='24' width='32' height='20' rx='2' fill='#8a5a34'/><rect x='20' y='20' width='32' height='9' rx='3' fill='#a06e40'/><rect x='20' y='31' width='32' height='3' fill='${gl}'/><rect x='33' y='30' width='6' height='6' fill='${gl}'/><rect x='20' y='24' width='32' height='20' rx='2' fill='none' stroke='#5a3a1c' stroke-width='2'/>`

  const glowRing = visited ? '' : `<ellipse cx='36' cy='30' rx='26' ry='26' fill='${gl}' opacity='0.12'/>`
  const check = visited ? `<circle cx='52' cy='14' r='9' fill='${scene.glow || '#ffd23f'}'/><path d='M48 14 L51 17 L57 10' stroke='#0c0718' stroke-width='2.5' fill='none'/>` : ''

  // Pedestal
  const pedestal = `<rect x='18' y='60' width='36' height='8' fill='${p1}'/><rect x='14' y='68' width='44' height='9' fill='${p0}'/><rect x='10' y='77' width='52' height='11' fill='${p1}'/><rect x='10' y='77' width='52' height='3' fill='${p0}'/>`

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='96' viewBox='0 0 72 96' shape-rendering='crispEdges'>${glowRing}${relic}${pedestal}${check}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/* ── Scene backdrop builder (matches HTML prototype) ── */
function sceneBackdrop(sc: any, n: number, ww: number) {
  const far: any[] = []
  const mid: any[] = []
  const props: any[] = []

  // Celestial disc (sun/moon)
  far.push({
    key: 'sun',
    style: {
      position: 'absolute' as const, left: '12%', top: n === 2 ? '16%' : '12%',
      width: 110, height: 110, borderRadius: '50%',
      background: `radial-gradient(circle, ${sc.glow}ee, ${sc.accent}66 60%, transparent)`,
      boxShadow: `0 0 80px ${sc.accent}55`,
    },
  })

  if (n === 1) {
    // Day 1: Sanctuary — desert dunes + palm trees + spring + fire
    ;[0.06, 0.34, 0.62, 0.9].forEach((f, i) =>
      far.push({ key: `d${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 620, height: 150 + (i % 2) * 60, background: sc.far, borderRadius: '50% 50% 0 0/100% 100% 0 0', opacity: 0.55 } })
    )
    ;[0.2, 0.5, 0.78].forEach((f, i) =>
      mid.push({ key: `m${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 80, height: 220, background: sc.mid, clipPath: 'polygon(46% 100%,54% 100%,52% 30%,70% 20%,52% 24%,50% 0,48% 24%,30% 20%,48% 30%)' } })
    )
    props.push({ key: 'spring', style: { position: 'absolute' as const, left: 260, bottom: 70, width: 150, height: 34, borderRadius: '50%', background: `radial-gradient(ellipse, ${sc.accent}cc, #2f9fb0 70%)`, boxShadow: `0 0 24px ${sc.accent}66` } })
    props.push({ key: 'fire', style: { position: 'absolute' as const, left: 1180, bottom: 78, width: 26, height: 40, background: 'radial-gradient(circle at 50% 80%, #ffd23f, #ff6a3a 70%, transparent)', borderRadius: '50% 50% 50% 50%/70% 70% 40% 40%', filter: 'blur(1px)', animation: 'floaty 1.2s ease-in-out infinite' } })
  } else if (n === 2) {
    // Day 2: Thirsty Machine — buildings + cooling towers + pipe
    ;[0.05, 0.28, 0.5, 0.74, 0.94].forEach((f, i) =>
      far.push({ key: `b${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 160 + (i % 3) * 70, height: 200 + (i % 2) * 120, background: sc.far, opacity: 0.5, boxShadow: `inset 0 0 0 2px ${sc.mid}` } })
    )
    ;[0.36, 0.66].forEach((f, i) =>
      mid.push({ key: `t${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 120, height: 260, background: sc.mid, clipPath: 'polygon(20% 100%,80% 100%,66% 40%,74% 0,26% 0,34% 40%)', opacity: 0.9 } })
    )
    props.push({ key: 'server', style: { position: 'absolute' as const, left: 1000, bottom: 70, width: 120, height: 150, background: `linear-gradient(180deg, #3a4358, #2a3040)`, border: `2px solid ${sc.accent}`, boxShadow: `0 0 26px ${sc.accent}44` } })
    props.push({ key: 'pipe', style: { position: 'absolute' as const, left: 0, bottom: 56, width: ww, height: 10, background: 'repeating-linear-gradient(90deg, #7a7258, #7a7258 40px, #5a5440 40px, #5a5440 46px)', opacity: 0.8 } })
  } else {
    // Day 3: Launchpad — mesas + gantry + tents + rocket
    ;[0.08, 0.5, 0.88].forEach((f, i) =>
      far.push({ key: `mesa${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 420, height: 180 + (i % 2) * 70, background: sc.far, borderRadius: '12px 12px 0 0', opacity: 0.5 } })
    )
    mid.push({ key: 'gantry', style: { position: 'absolute' as const, left: 0.72 * ww, bottom: 0, width: 50, height: 320, background: `repeating-linear-gradient(0deg, ${sc.mid}, ${sc.mid} 16px, transparent 16px, transparent 26px)` } })
    ;[0.24, 0.44].forEach((f, i) =>
      mid.push({ key: `tent${i}`, style: { position: 'absolute' as const, left: f * ww, bottom: 0, width: 150, height: 110, background: sc.mid, clipPath: 'polygon(50% 0,100% 100%,0 100%)', opacity: 0.85 } })
    )
    props.push({ key: 'rig', style: { position: 'absolute' as const, left: 980, bottom: 70, width: 92, height: 110, background: `linear-gradient(180deg, #4a2c3a, #2a1826)`, border: `2px solid ${sc.accent}`, boxShadow: `0 0 24px ${sc.accent}55` } })
    props.push({ key: 'rocket', style: { position: 'absolute' as const, left: 0.72 * ww + 2, bottom: 70, width: 44, height: 170, background: 'linear-gradient(180deg, #f2e6cf, #c9a85f)', borderRadius: '50% 50% 8px 8px/40% 40% 8px 8px', boxShadow: `0 0 22px ${sc.glow}66` } })
  }
  return { far, mid, props }
}

/* ── Section accent color ── */
function secColor(a: string) {
  return { p: 'var(--p,#ff5fd2)', s: 'var(--s,#45d6ff)', gold: 'var(--gold,#ffd23f)', ok: 'var(--ok,#74f0a0)' }[a] || 'var(--s,#45d6ff)'
}
const SEC_COL_MAP: Record<string, string> = { A: 'p', B: 's', C: 'gold' }

/* ── Constants ── */
const ARTIFACT_X_START = 560
const ARTIFACT_SPACING = 500

function artifactX(i: number) { return ARTIFACT_X_START + i * ARTIFACT_SPACING }

export default function JourneyScene({ character, day, visited, setVisited, onBack, cohortId, principles, bankedPrincipleIds, progressRows, onDeliverableSubmitted, onOpenList }: JourneySceneProps) {
  const sc: any = day.scene_config || { sky: ['#f6c98a', '#e88a86', '#7a5a9e'], far: '#8a5a86', mid: '#a86a52', ground: '#caa06a', groundEdge: '#9a7442', accent: '#ff9a5a', glow: '#ffd23f', pedestal: ['#8a6a44', '#6a4a2c'], label: 'ACT I · THE SANCTUARY' }
  const accent = character?.accent_color || DEFAULT_CHARACTER.accent_color
  const charKey = character?.character_key || DEFAULT_CHARACTER.character_key

  // Collect all entries flat, preserving section info
  const entries = useMemo(() => {
    const out: (WorkshopDayEntry & { sectionTitle: string; sectionKey: string; hour: string })[] = []
    ;(day.sections || []).forEach(s => {
      ;(s.entries || []).forEach(e => {
        out.push({ ...e, sectionTitle: s.title, sectionKey: s.section_key, hour: s.hour || '' })
      })
    })
    return out
  }, [day])

  const worldWidth = entries.length > 0 ? artifactX(entries.length - 1) + 640 : 1000

  // State
  const [introOpen, setIntroOpen] = useState(() => {
    // If they already have a saved position, they've been here, so don't force the intro open again
    return !sessionStorage.getItem(`scene_px_${day.day_number}`)
  })
  const [nearIdx, setNearIdx] = useState(-1)
  const [activeEntry, setActiveEntry] = useState<(typeof entries)[0] | null>(null)

  // Refs for imperative scene loop
  const vpRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const farRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLImageElement>(null)
  const pxRef = useRef(
    typeof sessionStorage !== 'undefined'
      ? Number(sessionStorage.getItem(`scene_px_${day.day_number}`)) || 300
      : 300
  )
  const targetRef = useRef<number | null>(null)
  const faceRef = useRef(1)
  const keysRef = useRef<Record<string, boolean>>({})
  const rafRef = useRef(0)
  const t0Ref = useRef(performance.now())
  const sceneOnRef = useRef(false)
  const nearIdxRef = useRef(-1)
  const activeEntryRef = useRef(activeEntry)
  activeEntryRef.current = activeEntry

  // Build player sprite URI
  const playerUri = useMemo(() => buildIconUri([], accent), [accent]) // placeholder, using PixelSprite below

  // Open artifact
  const openArtifact = useCallback((entry: (typeof entries)[0]) => {
    const vk = `${day.day_number}-${entry.id}`
    setVisited(prev => ({ ...prev, [vk]: true }))
    setActiveEntry(entry)
  }, [day.day_number])

  const closeReader = useCallback(() => setActiveEntry(null), [])

  const handleBack = useCallback(() => {
    sessionStorage.setItem(`scene_px_${day.day_number}`, String(pxRef.current))
    onBack()
  }, [day.day_number, onBack])

  // Store callbacks in refs so the effect loop never restarts mid-walk
  const openArtifactRef = useRef(openArtifact)
  openArtifactRef.current = openArtifact
  const closeReaderRef = useRef(closeReader)
  closeReaderRef.current = closeReader
  const onBackRef = useRef(handleBack)
  onBackRef.current = handleBack
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  // ── Scene engine (imperative animation loop, matching HTML prototype) ──
  useEffect(() => {
    if (introOpen) return

    sceneOnRef.current = true
    pxRef.current = pxRef.current || 300
    faceRef.current = 1
    t0Ref.current = performance.now()

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
        keysRef.current[k] = true
        targetRef.current = null
      }
      if (k === 'e' || k === 'enter' || k === ' ') {
        if (!activeEntryRef.current && nearIdxRef.current >= 0) {
          const a = entriesRef.current[nearIdxRef.current]
          if (a) { e.preventDefault(); openArtifactRef.current(a) }
        }
      }
      if (k === 'escape') {
        if (activeEntryRef.current) closeReaderRef.current()
        else onBackRef.current()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k in keysRef.current) keysRef.current[k] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const loop = () => {
      if (!sceneOnRef.current) return
      const now = performance.now()
      let dt = (now - t0Ref.current) / 16.67
      t0Ref.current = now
      if (dt > 3) dt = 3

      const paused = !!activeEntryRef.current
      const ww = worldWidth
      const vp = vpRef.current
      const vpW = vp ? vp.clientWidth : 900

      // Movement
      let dir = 0
      if (!paused) {
        if (keysRef.current['arrowleft'] || keysRef.current['a']) dir -= 1
        if (keysRef.current['arrowright'] || keysRef.current['d']) dir += 1
      }
      if (dir !== 0) {
        pxRef.current += dir * 4.6 * dt
        faceRef.current = dir > 0 ? 1 : -1
        targetRef.current = null
      } else if (targetRef.current != null && !paused) {
        const d = targetRef.current - pxRef.current
        if (Math.abs(d) > 4) {
          pxRef.current += Math.sign(d) * Math.min(Math.abs(d), 4.6 * dt)
          faceRef.current = d > 0 ? 1 : -1
        } else {
          targetRef.current = null
        }
      }
      pxRef.current = Math.max(60, Math.min(ww - 60, pxRef.current))

      const moving = dir !== 0 || targetRef.current != null

      // Camera
      let camX = pxRef.current - vpW / 2
      camX = Math.max(0, Math.min(ww - vpW, camX))

      // Apply transforms
      if (worldRef.current) worldRef.current.style.transform = `translateX(${-camX}px)`
      if (midRef.current) midRef.current.style.transform = `translateX(${-camX * 0.55}px)`
      if (farRef.current) farRef.current.style.transform = `translateX(${-camX * 0.25}px)`

      // Player bob
      const bob = moving ? Math.sin(now / 90) * 3 : Math.sin(now / 500) * 1.5
      if (playerRef.current) {
        playerRef.current.style.left = `${pxRef.current}px`
        playerRef.current.style.transform = `translate(-50%, ${bob}px) scaleX(${faceRef.current})`
      }

      // Nearest artifact
      let near = -1, best = 150
      const arts = entriesRef.current
      arts.forEach((_a, i) => {
        const d = Math.abs(artifactX(i) - pxRef.current)
        if (d < best) { best = d; near = i }
      })
      if (near !== nearIdxRef.current) {
        nearIdxRef.current = near
        setNearIdx(near)
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      sceneOnRef.current = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introOpen, worldWidth])

  // Click ground to walk
  const onSceneClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const vp = vpRef.current
    if (!vp) return
    const r = vp.getBoundingClientRect()
    const ww = worldWidth
    const vpW = vp.clientWidth
    let camX = pxRef.current - vpW / 2
    camX = Math.max(0, Math.min(ww - vpW, camX))
    const x = (e.clientX - r.left) + camX
    targetRef.current = Math.max(60, Math.min(ww - 60, x))
  }, [worldWidth])

  // Backdrop
  const bd = useMemo(() => sceneBackdrop(sc, day.day_number, worldWidth), [sc, day.day_number, worldWidth])

  // Scene nodes
  const nearArt = nearIdx >= 0 ? entries[nearIdx] : null
  const visitedCount = Object.values(visited).filter(Boolean).length

  return (
    <div style={{ padding: 'clamp(10px,2vw,18px) clamp(8px,2vw,18px)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={handleBack} className="font-pixel" style={{ fontSize: 13, color: 'var(--s,#45d6ff)', background: 'none', border: '2px solid var(--s,#45d6ff)', borderRadius: 6, padding: '12px 18px', cursor: 'pointer', flex: 'none', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(69,214,255,.2)' }}>
          ◂ MAP
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)' }}>{sc.label || `ACT ${day.day_number}`}</div>
          <div className="font-pixel" style={{ fontSize: 'clamp(12px,1.8vw,15px)', color: 'var(--tx,#efe6ff)', marginTop: 5, lineHeight: 1.4 }}>{day.title}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', flex: 'none' }}>◈ {visitedCount} / {entries.length} explored</div>
        <button onClick={() => setIntroOpen(true)} className="font-pixel" style={{ fontSize: 13, color: 'var(--gold,#ffd23f)', background: 'none', border: '2px solid var(--gold,#ffd23f)', borderRadius: 6, padding: '12px 18px', cursor: 'pointer', flex: 'none', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(255,210,63,.2)' }}>
          ✦ INTRO
        </button>
        <button onClick={onOpenList} className="font-pixel" style={{ fontSize: 13, color: 'var(--p,#ff5fd2)', background: 'rgba(255,95,210,.08)', border: '2px solid var(--p,#ff5fd2)', borderRadius: 6, padding: '12px 18px', cursor: 'pointer', flex: 'none', transition: 'all 0.2s', boxShadow: '0 0 12px rgba(255,95,210,.18)' }}>
          ☰ LIST VIEW
        </button>
      </div>

      {/* ── Scene Viewport ── */}
      <div
        ref={vpRef}
        onClick={onSceneClick}
        style={{
          position: 'relative', width: '100%',
          height: 'min(64vh, 560px)', minHeight: 380,
          border: '3px solid var(--ln,#3d2668)', borderRadius: 14,
          overflow: 'hidden', cursor: 'pointer', userSelect: 'none',
          background: '#12081e',
        }}
      >
        {/* Sky gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${sc.sky?.[0] || '#f6c98a'}, ${sc.sky?.[1] || '#e88a86'} 52%, ${sc.sky?.[2] || '#7a5a9e'})`,
        }} />

        {/* Far parallax layer */}
        <div ref={farRef} style={{ position: 'absolute', left: 0, top: 0, bottom: 92, width: worldWidth, willChange: 'transform', zIndex: 1 }}>
          {bd.far.map(f => <div key={f.key} style={f.style} />)}
        </div>

        {/* Mid parallax layer */}
        <div ref={midRef} style={{ position: 'absolute', left: 0, top: 0, bottom: 80, width: worldWidth, willChange: 'transform', zIndex: 2 }}>
          {bd.mid.map(m => <div key={m.key} style={m.style} />)}
        </div>

        {/* Ground */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 92,
          background: sc.ground || '#caa06a',
          borderTop: `6px solid ${sc.groundEdge || '#9a7442'}`,
          boxShadow: 'inset 0 8px 20px rgba(0,0,0,.25)',
          zIndex: 3,
        }} />

        {/* World layer (artifacts + player + props) */}
        <div ref={worldRef} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: worldWidth, willChange: 'transform', zIndex: 4 }}>
          {/* Scene props */}
          {bd.props.map(p => <div key={p.key} style={p.style} />)}

          {/* Artifact pedestals */}
          {entries.map((entry, i) => {
            const vis = !!visited[`${day.day_number}-${entry.id}`]
            const near = nearIdx === i
            const col = secColor(SEC_COL_MAP[entry.sectionKey] || 's')
            const uri = artifactUri(entry.entry_type, sc, accent, vis)

            return (
              <div
                key={entry.id}
                onClick={() => openArtifact(entry)}
                style={{
                  position: 'absolute',
                  left: artifactX(i),
                  bottom: 92,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  zIndex: near ? 7 : 5,
                  filter: near ? `drop-shadow(0 0 14px ${sc.glow || '#ffd23f'})` : 'none',
                  transition: 'filter .2s',
                }}
              >
                {/* Unvisited exclamation mark */}
                {!vis && !near && (
                  <div className="font-pixel" style={{ fontSize: 12, color: sc.glow || '#ffd23f', animation: 'floaty 1s ease-in-out infinite' }}>!</div>
                )}
                <img
                  src={uri}
                  alt=""
                  style={{
                    width: 72, height: 96,
                    imageRendering: 'pixelated' as any,
                    animation: near ? 'floaty 1.4s ease-in-out infinite' : 'none',
                    filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.4))',
                  }}
                />
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 7,
                    color: '#12081e',
                    background: vis ? (sc.glow || '#ffd23f') : col,
                    padding: '5px 8px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    boxShadow: '0 2px 0 rgba(0,0,0,.3)',
                  }}
                >
                  {entry.title}
                </div>
              </div>
            )
          })}

          {/* Player avatar */}
          <PixelSprite
            ref={playerRef}
            characterKey={charKey}
            accent={accent}
            opts={{
              tint: character?.tint,
              hairColor: character?.hair_color,
              hair: character?.hair,
              facial: character?.facial,
              outfit: character?.outfit,
              headgear: character?.headgear,
              gear: character?.loadout,
            }}
            size={96}
            style={{
              position: 'absolute',
              bottom: 92,
              left: 300,
              width: 96, height: 96,
              imageRendering: 'pixelated' as any,
              zIndex: 6,
              willChange: 'transform,left',
              filter: `drop-shadow(0 6px 0 rgba(0,0,0,.4)) drop-shadow(0 0 12px ${accent})`,
            }}
          />
        </div>

        {/* Proximity prompt bar */}
        {nearArt && !activeEntry && (
          <div
            className="font-pixel"
            style={{
              position: 'absolute', left: '50%', bottom: 18,
              transform: 'translateX(-50%)', zIndex: 9,
              fontSize: 9, color: 'var(--bg,#12081e)',
              background: 'var(--gold,#ffd23f)',
              padding: '9px 14px', borderRadius: 20,
              boxShadow: '0 0 18px rgba(255,210,63,.5)',
              animation: 'floaty 1.4s ease-in-out infinite',
              whiteSpace: 'nowrap', maxWidth: '92%',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            ▸ Press E / tap · open &ldquo;{nearArt.title}&rdquo;
          </div>
        )}

        {/* Controls HUD */}
        <div
          className="font-pixel"
          style={{
            position: 'absolute', right: 12, top: 12, zIndex: 9,
            fontSize: 7, color: 'var(--tx,#efe6ff)',
            background: 'rgba(10,5,20,.55)',
            border: '1px solid var(--ln,#3d2668)',
            borderRadius: 6, padding: '7px 10px',
            lineHeight: 1.7, pointerEvents: 'none',
          }}
        >
          ◂ ▸ / A D · walk<br />
          click ground · move<br />
          E · open artifact
        </div>

        {/* ── Intro overlay ── */}
        {introOpen && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 12,
            background: 'rgba(10,5,20,.74)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div
              className="retro-winpop"
              style={{
                maxWidth: 560,
                border: '2px solid var(--gold,#ffd23f)',
                borderRadius: 14,
                background: 'var(--pn,#241542)',
                padding: '22px 24px',
                boxShadow: '0 0 40px rgba(0,0,0,.6)',
              }}
            >
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', letterSpacing: 1 }}>
                {sc.label || `ACT ${day.day_number}`}
              </div>
              <div className="font-pixel" style={{ fontSize: 'clamp(12px,2.4vw,17px)', color: 'var(--tx,#efe6ff)', margin: '12px 0 14px', lineHeight: 1.5 }}>
                {day.title}
              </div>
              <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.55, marginBottom: 20 }}>
                {day.intro}
              </div>
              <button
                onClick={() => setIntroOpen(false)}
                className="font-pixel"
                style={{
                  fontSize: 10, color: 'var(--bg,#12081e)',
                  background: 'var(--gold,#ffd23f)',
                  border: 'none', borderRadius: 6,
                  padding: '12px 18px', cursor: 'pointer',
                  boxShadow: '0 4px 0 #b8912a',
                }}
              >
                ▸ ENTER THE SCENE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Description below viewport */}
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--mu,#a493c9)', marginTop: 10 }}>
        Walk up to each artifact and open it to read the session — one main column of text with matching visuals alongside. Every session your instructor adds appears here as a new artifact.
      </div>

      {/* ── Artifact Reader modal ── */}
      {activeEntry && (
        <ArtifactReader
          entry={activeEntry}
          dayId={day.id}
          dayNumber={day.day_number}
          scene={sc}
          accent={accent}
          onClose={closeReader}
          cohortId={cohortId}
          principles={principles}
          bankedPrincipleIds={bankedPrincipleIds}
          progressRows={progressRows}
          onDeliverableSubmitted={onDeliverableSubmitted}
        />
      )}
    </div>
  )
}
