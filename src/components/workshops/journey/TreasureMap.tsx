'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { PixelSprite, buildIconUri } from '@/components/workshops/journey'
import { MAP_ICONS, DEFAULT_CHARACTER, type SpriteRect } from './character-data'
import type { WorkshopCharacter, WorkshopDay, WorkshopProgressPrinciple, WorkshopPrinciple } from '@/types/workshops'

interface TreasureMapProps {
  character: WorkshopCharacter
  days: WorkshopDay[]
  daysComplete: number
  approvedDays?: number
  engagementPct?: number
  principlesCount: number
  bankedPrinciples: WorkshopProgressPrinciple[]
  principles: WorkshopPrinciple[]
  onChangeChar: () => void
  onOpenWin: () => void
  onOpenDay: (dayNum: number) => void
  onOpenPortfolio: () => void
}

const NODES = [
  { id: 'start', left: 6, top: 63, pct: 0 },
  { id: 'day1', left: 23, top: 30, pct: 0.28 },
  { id: 'day2', left: 50, top: 58, pct: 0.53 },
  { id: 'day3', left: 76, top: 28, pct: 0.82 },
  { id: 'goal', left: 92, top: 53, pct: 1 },
]

// ── Chia Guardian sprite ──
function chiaStageFor(pct: number): number {
  if (pct >= 100) return 5;
  if (pct >= 75) return 4;
  if (pct >= 50) return 3;
  if (pct >= 25) return 2;
  if (pct > 0) return 1;
  return 0;
}

function chiaRects(stage: number): SpriteRect[] {
  const gL = '#daba4e', gM = '#c19a33', gD = '#9c7a28'
  const eye = '#3a2c14', bD = '#1c150f', bM = '#33281b'
  const gr = '#5fa83c', gr2 = '#8fd85f'
  const fp = '#ff5fd2', fy = '#ffd23f', fv = '#b06bff'

  // Base pot + face
  const r: SpriteRect[] = [
    [2, 18, 12, 2, bD], [3, 18, 10, 1, bM],
    [6, 11, 4, 1, gL], [5, 12, 6, 1, gM], [5, 13, 6, 1, gM],
    [4, 14, 8, 1, gM], [4, 15, 8, 1, gD], [3, 16, 10, 1, gM], [3, 17, 10, 1, gD],
    [5, 16, 6, 1, gL],
    [7, 10, 2, 1, gM],
    [6, 5, 4, 1, gL], [5, 6, 6, 1, gL], [5, 7, 6, 1, gM], [5, 8, 6, 1, gM], [6, 9, 4, 1, gD],
    [6, 7, 1, 1, eye], [9, 7, 1, 1, eye],
  ]

  // Growth stages
  const defs: Record<number, SpriteRect[]> = {
    1: [[6, 3, 1, 2, gr], [8, 3, 1, 2, gr], [7, 2, 1, 3, gr], [7, 2, 1, 1, gr2]],
    2: [[5, 2, 1, 3, gr], [7, 1, 1, 4, gr], [9, 2, 1, 3, gr], [8, 2, 1, 3, gr], [7, 1, 1, 1, gr2], [5, 2, 1, 1, gr2], [9, 2, 1, 1, gr2]],
    3: [[5, 1, 1, 4, gr], [6, 2, 1, 3, gr], [7, 0, 1, 5, gr], [8, 1, 1, 4, gr], [9, 2, 1, 3, gr], [10, 3, 1, 2, gr], [7, 0, 1, 1, gr2], [5, 1, 1, 1, gr2], [9, 2, 1, 1, gr2]],
    4: [[4, 3, 1, 2, gr], [5, 1, 1, 4, gr], [6, 0, 1, 5, gr], [7, 0, 1, 5, gr], [8, 1, 1, 4, gr], [9, 0, 1, 5, gr], [10, 2, 1, 3, gr], [6, 0, 1, 1, gr2], [9, 0, 1, 1, gr2], [7, 0, 1, 1, gr2]],
  }

  const S: SpriteRect[] = []
  if (stage >= 1 && stage < 5) {
    const d = defs[stage]
    if (d) d.forEach(x => S.push(x))
  }
  if (stage >= 5) {
    const leaves: SpriteRect[] = [[5, 2, 1, 3, gr], [6, 1, 1, 3, gr], [9, 1, 1, 3, gr], [10, 2, 1, 3, gr], [7, 2, 1, 2, gr], [8, 2, 1, 2, gr]]
    const flowers: SpriteRect[] = [[4, 0, 2, 2, fp], [7, 0, 2, 2, fy], [10, 0, 2, 2, fv]]
    leaves.forEach(x => S.push(x))
    flowers.forEach(x => S.push(x))
  }

  return r.concat(S)
}

function chiaUri(stage: number): string {
  const rects = chiaRects(stage)
  const body = rects
    .map(a => `<rect x='${a[0]}' y='${a[1]}' width='${a[2]}' height='${a[3]}' fill='${a[4]}'/>`)
    .join('')
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'>${body}</svg>`
    )
  )
}

// ── Stage label ──
function chiaStageLabel(stage: number): string {
  return ['Bare bud', 'Sprouting', 'Filling in', 'Leafy crown', 'Lush mane', 'Full bloom 🌸'][stage] || 'Bare bud'
}

export default function TreasureMap({
  character,
  days,
  daysComplete,
  approvedDays = 0,
  engagementPct = 0,
  principlesCount,
  bankedPrinciples = [],
  principles = [],
  onChangeChar,
  onOpenWin,
  onOpenDay,
  onOpenPortfolio,
}: TreasureMapProps) {
  const [mounted, setMounted] = useState(false)
  const [mapTarget, setMapTarget] = useState<number | null>(null)

  // Clear map target if daysComplete changes (e.g. coming back after a win)
  useEffect(() => { setMapTarget(null) }, [daysComplete])
  useEffect(() => { setMounted(true) }, [])

  const clampedDays = Math.max(0, Math.min(3, daysComplete))
  const allDone = (approvedDays || 0) >= 3
  const targetNode = NODES[mapTarget ?? (allDone ? 4 : clampedDays + 1)]
  const trailPct = mounted ? targetNode.pct : 0

  const accent = character?.accent_color || DEFAULT_CHARACTER.accent_color
  const name = character?.player_name || DEFAULT_CHARACTER.player_name
  const charKey = character?.character_key || DEFAULT_CHARACTER.character_key

  // Chia uses approvedDays (up to 75%) and engagementPct (up to 25%)
  const clampedApproved = Math.min(Math.max(approvedDays || 0, 0), 3)
  const chiaDelivPct = Math.round((clampedApproved / 3) * 75)
  const chiaEngPct = Math.min(Math.max(engagementPct || 0, 0), 25)
  const chiaPct = chiaDelivPct + chiaEngPct
  const stage = chiaStageFor(chiaPct)
  const chiaSvg = useMemo(() => chiaUri(stage), [stage])
  const stageLabel = chiaStageLabel(stage)

  // Map icons
  const startIcon = useMemo(() => buildIconUri(MAP_ICONS.start, accent), [accent])
  const goalIcon = useMemo(() => buildIconUri(MAP_ICONS.goal, accent), [accent])
  const tentIcon = useMemo(() => buildIconUri(MAP_ICONS.tent, accent), [accent])
  const mountIcon = useMemo(() => buildIconUri(MAP_ICONS.mount, accent), [accent])
  const rocketIcon = useMemo(() => buildIconUri(MAP_ICONS.rocket, accent), [accent])
  const dayIcons = [tentIcon, mountIcon, rocketIcon]

  return (
    <div style={{ padding: 'clamp(14px,3vw,30px) clamp(12px,3vw,26px)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div className="font-pixel" style={{ fontSize: 'clamp(11px,2vw,15px)', color: 'var(--tx, #efe6ff)', letterSpacing: 1 }}>
          ◆ THE 3-DAY TREASURE MAP ◆
        </div>
        <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu, #a493c9)', marginTop: 8 }}>
          {allDone ? 'All deliverables banked – the portfolio treasure is yours! 📦' : `Embarking on Day ${clampedDays + 1}`}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <button
            onClick={onChangeChar}
            className="font-pixel"
            style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', lineHeight: '1.6', color: 'var(--s, #45d6ff)', background: 'none', border: '2px solid var(--s, #45d6ff)', borderRadius: 4, padding: '9px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ⇆ CHANGE CHARACTER
          </button>
          {allDone && (
            <button
              onClick={onOpenWin}
              className="font-pixel"
              style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', lineHeight: '1.6', color: 'var(--bg, #12081e)', background: 'var(--gold, #ffd23f)', border: 'none', borderRadius: 4, padding: '9px 12px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(255,210,63,.4)' }}
            >
              ⛃ OPEN VICTORY SCREEN
            </button>
          )}
        </div>
      </div>

      {/* ── The Map ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 1000, margin: '12px auto 0', aspectRatio: '1000/390', minHeight: 300 }}>
        {/* Twinkles */}
        <div className="retro-twinkle" style={{ position: 'absolute', left: '12%', top: '12%', width: 4, height: 4, background: 'var(--s, #45d6ff)' }} />
        <div className="retro-twinkle" style={{ position: 'absolute', left: '40%', top: '8%', width: 3, height: 3, background: '#fff', animationDuration: '3.1s' }} />
        <div className="retro-twinkle" style={{ position: 'absolute', left: '63%', top: '14%', width: 4, height: 4, background: 'var(--p, #ff5fd2)', animationDuration: '2.7s' }} />
        <div className="retro-twinkle" style={{ position: 'absolute', left: '86%', top: '9%', width: 3, height: 3, background: 'var(--gold, #ffd23f)', animationDuration: '3.6s' }} />
        <div className="retro-twinkle" style={{ position: 'absolute', left: '30%', top: '78%', width: 3, height: 3, background: '#fff', animationDuration: '2.2s' }} />

        {/* SVG dotted path */}
        <svg viewBox="0 0 1000 390" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path
            d="M60 245 C 130 160,190 128,235 120 C 335 108,435 305,500 228 C 590 122,690 82,760 108 C 840 132,890 178,920 205"
            fill="none"
            stroke="var(--ln, #3d2668)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="2 16"
          />
          <path
            d="M60 245 C 130 160,190 128,235 120 C 335 108,435 305,500 228 C 590 122,690 82,760 108 C 840 132,890 178,920 205"
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength="1"
            style={{
              strokeDasharray: `${trailPct} 1`,
              filter: `drop-shadow(0 0 6px ${accent})`,
              transition: 'stroke-dasharray 0.8s ease-out',
            }}
          />
        </svg>

        {/* START node */}
        <div style={{ position: 'absolute', left: '6%', top: '63%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <img src={startIcon} alt="Start" width={40} height={40} style={{ imageRendering: 'pixelated' }} />
          <div className="font-pixel" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', color: 'var(--mu, #a493c9)', marginTop: 2 }}>START</div>
        </div>

        {/* CHIA guardian on the map */}
        <div style={{ position: 'absolute', left: '10%', top: '24%', transform: 'translate(-50%, -100%)', textAlign: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <img src={chiaSvg} alt="Chia" width={46} height={57} style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' }} />
          <div className="font-pixel" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', color: 'var(--ok, #74f0a0)', marginTop: 2 }}>CHIA {chiaPct}%</div>
        </div>

        {/* DAY nodes — rounded squares matching HTML prototype */}
        {days.map((day, i) => {
          const isDone = i < clampedDays
          const isCurrent = i === clampedDays && !allDone
          const isLocked = i > clampedDays
          const nodePos = NODES[i + 1]
          const ring = isDone ? 'var(--ok, #74f0a0)' : isCurrent ? 'var(--p, #ff5fd2)' : 'var(--mu, #a493c9)'

          return (
            <div
              key={day.id}
              style={{
                position: 'absolute',
                left: `${nodePos.left}%`,
                top: `${nodePos.top}%`,
                transform: 'translate(-50%, -50%)',
                opacity: isLocked ? 0.5 : 1,
                zIndex: 4,
              }}
            >
              <button
                onClick={() => {
                  if (isLocked) {
                    // could show toast
                  } else {
                    setMapTarget(i + 1)
                    setTimeout(() => onOpenDay(day.day_number), 520)
                  }
                }}
                style={{
                  position: 'relative',
                  width: 'clamp(64px, 10vw, 90px)',
                  height: 'clamp(64px, 10vw, 90px)',
                  borderRadius: 12,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  border: `3px solid ${ring}`,
                  background: 'radial-gradient(circle, rgba(40,20,70,.95), rgba(18,8,30,.95))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? '0 0 22px var(--p, #ff5fd2)' : isDone ? '0 0 16px var(--ok, #74f0a0)' : 'none',
                  animation: isCurrent ? 'nodepulse 1.6s ease-in-out infinite' : 'none',
                  padding: 0,
                  margin: '0 auto',
                }}
              >
                <img src={dayIcons[i]} alt={`Day ${day.day_number}`} width={42} height={42} style={{ imageRendering: 'pixelated' }} />
                {isDone && (
                  <div className="font-pixel" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--ok, #74f0a0)', color: 'var(--bg, #12081e)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg, #12081e)' }}>
                    ✓
                  </div>
                )}
                {isLocked && (
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--mu, #a493c9)', color: 'var(--bg, #12081e)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg, #12081e)' }}>
                    🔒
                  </div>
                )}
              </button>
              <div style={{ textAlign: 'center', marginTop: 8, whiteSpace: 'nowrap' }}>
                <div className="font-pixel" style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: 'var(--gold, #ffd23f)' }}>DAY {day.day_number < 10 ? `0${day.day_number}` : day.day_number}</div>
                <div style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', color: 'var(--tx, #efe6ff)', maxWidth: 200, whiteSpace: 'normal', lineHeight: 1.25, marginTop: 5, fontWeight: 600 }}>{day.title}</div>
              </div>
            </div>
          )
        })}

        {/* GOAL / PORTFOLIO */}
        <button
          onClick={() => {
            setMapTarget(4)
            setTimeout(onOpenPortfolio, 520)
          }}
          style={{
            position: 'absolute',
            left: '92%',
            top: '53%',
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={goalIcon}
            alt="Portfolio"
            width={52}
            height={52}
            style={{
              imageRendering: 'pixelated',
              filter: allDone ? 'drop-shadow(0 0 14px var(--gold, #ffd23f))' : 'grayscale(.4) opacity(.75)',
              animation: allDone ? 'floaty 2.4s ease-in-out infinite' : 'none',
            }}
          />
          <div className="font-pixel" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', color: 'var(--gold, #ffd23f)', marginTop: 3 }}>PORTFOLIO</div>
        </button>

        {/* Floating player sprite */}
        <div
          style={{
            position: 'absolute',
            left: `${targetNode.left}%`,
            top: `${targetNode.top}%`,
            transform: 'translate(-50%, -104%)',
            transition: 'left 0.5s cubic-bezier(0.5, 0.05, 0.4, 1), top 0.5s cubic-bezier(0.5, 0.05, 0.4, 1)',
            zIndex: 9,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <PixelSprite
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
            size={54}
            className="retro-floaty"
            style={{
              filter: `drop-shadow(0 0 8px ${accent}) drop-shadow(0 4px 2px rgba(0,0,0,.5))`,
            }}
          />
          <span
            className="font-pixel"
            style={{
              fontSize: 6,
              color: accent,
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0,0,0,.6)',
            }}
          >
            ▾ {name}
          </span>
        </div>
      </div>

      {/* ── Dashboard panels ── */}
      <div style={{ maxWidth: 1000, margin: '14px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>

        {/* Chia Guardian */}
        <div style={{ border: '2px solid var(--ok, #74f0a0)', borderRadius: 6, padding: '14px 16px', background: 'var(--pn, #241542)', display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 0 18px rgba(116,240,160,.1)' }}>
          <img src={chiaSvg} alt="Chia" width={64} height={80} style={{ imageRendering: 'pixelated', flex: 'none', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-pixel" style={{ fontSize: 10, color: 'var(--ok, #74f0a0)', marginBottom: 9, lineHeight: 1.5 }}>
              ❀ CHIA GUARDIAN · {chiaPct}%
            </div>
            <div style={{ height: 16, background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln, #3d2668)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${chiaDelivPct}%`, height: '100%', background: 'var(--gold, #ffd23f)', transition: 'width 0.5s' }} />
              <div style={{ width: `${chiaEngPct}%`, height: '100%', background: 'var(--ok, #74f0a0)', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 18, color: 'var(--tx, #efe6ff)', marginTop: 8 }}>{stageLabel}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 15 }}>
              <span style={{ color: 'var(--gold, #ffd23f)' }}>■ Deliverables {chiaDelivPct}%</span>
              <span style={{ color: 'var(--ok, #74f0a0)' }}>■ Engagement {chiaEngPct}%</span>
            </div>
          </div>
        </div>

        {/* Journey Progress */}
        <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 6, padding: '14px 16px', background: 'var(--pn, #241542)' }}>
          <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>JOURNEY PROGRESS</div>
          <div style={{ height: 16, background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln, #3d2668)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(clampedDays / 3) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--p, #ff5fd2), var(--gold, #ffd23f))', transition: 'width 0.8s ease-out' }} />
          </div>
          <div style={{ fontSize: 18, color: 'var(--tx, #efe6ff)', marginTop: 8 }}>
            {clampedDays} of 3 deliverables banked · {principlesCount} Steward Principles collected
          </div>
        </div>

        {/* Principles Banked */}
        <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 6, padding: '14px 16px', background: 'var(--pn, #241542)' }}>
          <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>PRINCIPLES BANKED</div>
          {bankedPrinciples.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {bankedPrinciples.map((bp) => {
                const principle = principles.find(p => p.id === bp.principle_id);
                return (
                  <span key={bp.id} style={{ fontSize: 16, color: 'var(--ok, #74f0a0)', border: '1px solid var(--ok, #74f0a0)', borderRadius: 20, padding: '4px 12px' }}>
                    ◈ {principle ? principle.name : bp.principle_id}
                  </span>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: 18, color: 'var(--mu, #a493c9)' }}>
              None yet — each day&apos;s submission banks a fresh, unrepeatable principle.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
