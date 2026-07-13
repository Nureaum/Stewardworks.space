'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PixelSprite from './PixelSprite'
import ArcadeButton from './ArcadeButton'
import { saveCharacter } from '@/app/actions/workshops/characters'
import {
  CHARACTER_ORDER,
  CHARACTERS,
  ACCENTS,
  TINTS,
  HEADGEAR_META,
  GEAR_META,
  OUTFIT_META,
  HAIR_META,
  HAIRCOLS,
  FACIAL_META,
  COMPANION_META,
  SIGFEATURE,
  DEFAULT_CHARACTER,
} from './character-data'
import type { WorkshopCharacter } from '@/types/workshops'

interface CharacterSelectProps {
  cohortId: string
  existingCharacter: WorkshopCharacter | null
  onComplete: (character: WorkshopCharacter) => void
  daysComplete: number
  principlesCount: number
}

export default function CharacterSelect({
  cohortId,
  existingCharacter,
  onComplete,
  daysComplete,
  principlesCount,
}: CharacterSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ── State ──
  const [selectMin, setSelectMin] = useState(false)
  const [charKey, setCharKey] = useState(existingCharacter?.character_key || DEFAULT_CHARACTER.character_key)
  const [playerName, setPlayerName] = useState(existingCharacter?.player_name || DEFAULT_CHARACTER.player_name)
  const [accent, setAccent] = useState(existingCharacter?.accent_color || DEFAULT_CHARACTER.accent_color)
  const [tint, setTint] = useState(existingCharacter?.tint || DEFAULT_CHARACTER.tint)
  const [headgear, setHeadgear] = useState(existingCharacter?.headgear || DEFAULT_CHARACTER.headgear)
  const [loadout, setLoadout] = useState(existingCharacter?.loadout || DEFAULT_CHARACTER.loadout)
  const [outfit, setOutfit] = useState(existingCharacter?.outfit || DEFAULT_CHARACTER.outfit)
  const [hair, setHair] = useState(existingCharacter?.hair || DEFAULT_CHARACTER.hair)
  const [hairColor, setHairColor] = useState(existingCharacter?.hair_color || DEFAULT_CHARACTER.hair_color)
  const [facial, setFacial] = useState(existingCharacter?.facial || DEFAULT_CHARACTER.facial)
  const [companion, setCompanion] = useState(existingCharacter?.companion || DEFAULT_CHARACTER.companion)

  const activeChar = CHARACTERS[charKey]
  const isHuman = activeChar?.people
  const hasChar = !!existingCharacter

  // Handle character switch
  const handlePickChar = (k: string) => {
    setCharKey(k)
    const newChar = CHARACTERS[k]
    if (newChar) {
      if (playerName === activeChar?.name || !playerName) {
        setPlayerName(newChar.name)
      }
      if (!newChar.people) {
        // Reset human-only options
        setTint('default')
        setHeadgear('bare')
        setOutfit('plain')
        setHair('signature')
        setHairColor('default')
        setFacial('none')
        setCompanion('none')
      } else {
        // Set some smart defaults if switching back to human
        if (companion === 'none' && k === 'nayeli') setCompanion('roadrunner')
      }
    }
  }

  // Handle save
  const handleBegin = () => {
    setError(null)
    startTransition(async () => {
      const res = await saveCharacter({
        cohort_id: cohortId,
        character_key: charKey,
        player_name: playerName.trim() || activeChar.name,
        accent_color: accent,
        tint,
        headgear,
        loadout,
        outfit,
        hair,
        hair_color: hairColor,
        facial,
        companion,
      })

      if (res.success && res.data) {
        onComplete(res.data)
      } else {
        setError(res.error || 'Failed to save character')
      }
    })
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(14px, 3vw, 30px) clamp(14px, 3vw, 26px)' }}>
      
      {/* (1) Minimizable Header */}
      <div
        style={{
          border: '2px solid var(--ln, #3d2668)',
          borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(255,210,63,.07), rgba(0,0,0,.15))',
          marginBottom: 18,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px' }}>
          <div style={{ minWidth: 0 }}>
            <div
              className="font-pixel"
              style={{ fontSize: 8, color: 'var(--s, #45d6ff)', letterSpacing: 2, marginBottom: 9 }}
            >
              ▚ PILOT WORKSHOPS · INSERT COIN ▚
            </div>
            <div
              className="font-pixel"
              style={{
                fontSize: 'clamp(13px, 3vw, 22px)',
                color: 'var(--gold, #ffd23f)',
                textShadow: '0 0 16px rgba(255,210,63,.45), 3px 3px 0 rgba(0,0,0,.4)',
                lineHeight: 1.4,
              }}
            >
              CHOOSE&nbsp;YOUR&nbsp;STEWARD
            </div>
          </div>
          <button
            onClick={() => setSelectMin(!selectMin)}
            title="Show / hide intro"
            className="font-pixel"
            style={{
              fontSize: 8,
              color: 'var(--mu, #a493c9)',
              background: 'rgba(0,0,0,.3)',
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 5,
              padding: '9px 11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 'none',
            }}
          >
            {selectMin ? 'SHOW INFO' : 'HIDE'}
          </button>
        </div>
        {!selectMin && (
          <div style={{ padding: '0 16px 15px', fontSize: 18, color: 'var(--tx, #efe6ff)', lineHeight: 1.45, maxWidth: 720 }}>
            Pick a traveler, then make them yours — set a signal aura, headgear, field kit and skin tone.
            Complete each day's deliverable to advance the map and collect Steward Principles.
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #ff6b6b', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* (2) Live Preview + Customization */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch' }}>
        
        {/* Left: Preview Panel */}
        <div
          style={{
            flex: '1 1 280px',
            minWidth: 250,
            maxWidth: 360,
            border: '2px solid var(--s, #45d6ff)',
            borderRadius: 10,
            background: 'linear-gradient(180deg, rgba(69,214,255,.07), rgba(0,0,0,.28))',
            padding: 15,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="font-pixel" style={{ fontSize: 8, color: 'var(--s, #45d6ff)', letterSpacing: 1, marginBottom: 12 }}>
            ▱ LIVE PREVIEW
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 8,
              background: 'radial-gradient(circle at 50% 42%, rgba(0,0,0,.1), transparent 68%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -48%)',
                width: 170,
                height: 170,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}, transparent 60%)`,
                opacity: 0.4,
                filter: 'blur(7px)',
                pointerEvents: 'none',
              }}
            />
            
            <PixelSprite
              characterKey={charKey}
              accent={accent}
              opts={{ tint, hairColor, hair, facial, outfit, headgear, gear: loadout }}
              size={150}
              className="retro-floaty"
              style={{
                position: 'relative',
                zIndex: 1,
                filter: `drop-shadow(0 6px 0 rgba(0,0,0,.4)) drop-shadow(0 0 16px ${accent})`,
              }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: 13 }}>
            <div className="font-pixel" style={{ fontSize: 12, color: 'var(--gold, #ffd23f)' }}>
              {playerName || activeChar?.name}
            </div>
            <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginTop: 6, lineHeight: 1.35 }}>
              {activeChar?.kind}
              <br />
              <span style={{ color: 'var(--ok, #74f0a0)' }}>
                ❒ {GEAR_META.find(g => g[0] === loadout)?.[1] || 'TRAVEL LIGHT'}
              </span>
            </div>
            {SIGFEATURE[charKey] && (
              <div style={{ fontSize: 14, color: 'var(--s, #45d6ff)', marginTop: 5 }}>
                ✧ {SIGFEATURE[charKey]}
              </div>
            )}
          </div>
        </div>

        {/* Right: Customization */}
        <div style={{ flex: '2 1 420px', minWidth: 290, display: 'flex', flexDirection: 'column', gap: 15 }}>
          
          {/* Character Grid */}
          <div>
            <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold, #ffd23f)', letterSpacing: 1, marginBottom: 11 }}>
              ✦ PICK A STEWARD · 12 TRAVELERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(94px, 1fr))', gap: 9 }}>
              {CHARACTER_ORDER.map((k) => {
                const char = CHARACTERS[k]
                const isSel = charKey === k
                return (
                  <button
                    key={k}
                    onClick={() => handlePickChar(k)}
                    style={{
                      position: 'relative',
                      background: isSel ? 'var(--pn, #241542)' : 'rgba(0,0,0,.3)',
                      border: `2px solid ${isSel ? 'var(--gold, #ffd23f)' : 'var(--ln, #3d2668)'}`,
                      borderRadius: 8,
                      padding: '8px 4px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSel ? '0 0 16px rgba(255,210,63,.2)' : 'none',
                    }}
                  >
                    {isSel && (
                      <div
                        className="font-pixel"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 6,
                          fontSize: 7,
                          color: 'var(--bg, #12081e)',
                          background: 'var(--gold, #ffd23f)',
                          borderRadius: 3,
                          padding: '3px 4px',
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <PixelSprite
                        characterKey={k}
                        accent={isSel ? accent : '#6f5e8f'}
                        size={50}
                        style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' }}
                      />
                    </div>
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--tx, #efe6ff)', marginTop: 7 }}>
                      {char.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginTop: 2, lineHeight: 1.1 }}>
                      {char.kind}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <div className="font-pixel" style={{ fontSize: 8, color: 'var(--mu, #a493c9)', marginBottom: 9 }}>
              TRAVELER NAME
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter a name…"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,.35)',
                border: '2px solid var(--ln, #3d2668)',
                borderRadius: 4,
                color: 'var(--tx, #efe6ff)',
                fontSize: 20,
                padding: '9px 12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(188px, 1fr))', gap: 11 }}>
            
            {/* Signal Aura */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--p, #ff5fd2)', marginBottom: 4 }}>◈ SIGNAL AURA</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>Tints outfit & trail glow</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.color)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: a.color,
                      border: `2px solid ${accent === a.color ? '#fff' : 'transparent'}`,
                      boxShadow: accent === a.color ? `0 0 12px ${a.color}` : 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Field Tint (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold, #ffd23f)', marginBottom: 4 }}>◐ FIELD TINT</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Skin tone' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Default tint button */}
                <button
                  onClick={() => setTint('default')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: activeChar?.skinDefault || '#555',
                    border: `2px solid ${tint === 'default' ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
                {TINTS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTint(t)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: t,
                      border: `2px solid ${tint === t ? '#fff' : 'transparent'}`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Headgear (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--s, #45d6ff)', marginBottom: 4 }}>▲ HEADGEAR</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Hats & visors' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HEADGEAR_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={headgear === k} onClick={() => setHeadgear(k)} color="var(--s, #45d6ff)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

            {/* Loadout (All) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--ok, #74f0a0)', marginBottom: 4 }}>❒ FIELD KIT · LOADOUT</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>Determines your path</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GEAR_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={loadout === k} onClick={() => setLoadout(k)} color="var(--ok, #74f0a0)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

            {/* Outfit (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold, #ffd23f)', marginBottom: 4 }}>✚ OUTFIT</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Outerwear' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {OUTFIT_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={outfit === k} onClick={() => setOutfit(k)} color="var(--gold, #ffd23f)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

            {/* Hair Style (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--p, #ff5fd2)', marginBottom: 4 }}>✦ HAIR STYLE</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Cut & shape' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HAIR_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={hair === k} onClick={() => setHair(k)} color="var(--p, #ff5fd2)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

            {/* Hair Color (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--p, #ff5fd2)', marginBottom: 4 }}>✿ HAIR COLOR</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Dye & shade' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setHairColor('default')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #333 0%, #111 100%)', // Visual indicator for default
                    border: `2px solid ${hairColor === 'default' ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  *
                </button>
                {HAIRCOLS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHairColor(c)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: c,
                      border: `2px solid ${hairColor === c ? '#fff' : 'transparent'}`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Facial Hair (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold, #ffd23f)', marginBottom: 4 }}>⌇ FACIAL HAIR</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Beards & staches' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FACIAL_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={facial === k} onClick={() => setFacial(k)} color="var(--gold, #ffd23f)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

            {/* Companion (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 8, background: 'rgba(0,0,0,.2)', padding: '12px 13px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 8, color: 'var(--ok, #74f0a0)', marginBottom: 4 }}>❀ COMPANION</div>
              <div style={{ fontSize: 13, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>{isHuman ? 'Desert friend' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COMPANION_META.map(([k, label]) => (
                  <ArcadeButton key={k} active={companion === k} onClick={() => setCompanion(k)} color="var(--ok, #74f0a0)" style={{ fontSize: 7, padding: '6px 8px' }}>
                    {label}
                  </ArcadeButton>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* (3) Swapping Note */}
      {hasChar && (
        <div style={{ marginTop: 20, border: '2px solid var(--s, #45d6ff)', borderRadius: 6, padding: '12px 15px', background: 'rgba(69,214,255,.06)', fontSize: 16, color: 'var(--tx, #efe6ff)', textAlign: 'center' }}>
          Swapping stewards keeps your journey — <span style={{ color: 'var(--gold, #ffd23f)' }}>{daysComplete}/3 days & {principlesCount} principles are safe.</span>
        </div>
      )}

      {/* (4) Begin / Return Button */}
      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <button
          onClick={handleBegin}
          disabled={isPending}
          className="font-pixel"
          style={{
            fontSize: 13,
            color: 'var(--bg, #12081e)',
            background: 'var(--gold, #ffd23f)',
            border: 'none',
            borderRadius: 6,
            padding: '16px 34px',
            cursor: isPending ? 'wait' : 'pointer',
            boxShadow: '0 5px 0 #b8912a, 0 0 26px rgba(255,210,63,.5)',
            letterSpacing: 1,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'SAVING...' : (hasChar ? 'CONFIRM CHANGES ▸' : 'BEGIN JOURNEY ▸')}
        </button>
      </div>

    </div>
  )
}
