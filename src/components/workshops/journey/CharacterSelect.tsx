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
  const [hair, setHair] = useState(existingCharacter?.hair || (DEFAULT_CHARACTER.character_key === 'nayeli' ? 'long' : DEFAULT_CHARACTER.hair))
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
      // Update player name if it matches the old character or is empty
      if (playerName === activeChar?.name || !playerName) {
        setPlayerName(newChar.name)
      }
      
      if (!newChar.people) {
        // Reset human-only options for non-human characters
        setTint('default')
        setHeadgear('bare')
        setOutfit('plain')
        setHair('signature')
        setHairColor('default')
        setFacial('none')
        setCompanion('none')
      } else {
        // For human characters, set appropriate defaults
        // Keep current hair style if already human, otherwise default to 'long' for Nayeli
        if (k === 'nayeli' && (!activeChar?.people || charKey !== k)) {
          setHair('long')
        } else if (!activeChar?.people) {
          // Switching from non-human to human - set default hair
          setHair('signature')
        }
        
        // Set smart companion defaults
        if (companion === 'none') {
          if (k === 'nayeli') setCompanion('roadrunner')
        }
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
    <div style={{ maxWidth: '1060px', margin: '0 auto', paddingTop: 4, paddingBottom: 'clamp(14px, 3vw, 30px)', paddingLeft: 'clamp(14px, 3vw, 26px)', paddingRight: 'clamp(14px, 3vw, 26px)' }}>
      
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
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--s, #45d6ff)', letterSpacing: 2, marginBottom: 9 }}
            >
              ▚ PILOT WORKSHOPS · INSERT COIN ▚
            </div>
            <div
              className="font-pixel"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 'clamp(13px, 3vw, 22px)',
                color: 'var(--gold, #ffd23f)',
                textShadow: '0 0 16px rgba(255,210,63,.45), 3px 3px 0 rgba(0,0,0,.4)',
                lineHeight: 1.4,
                letterSpacing: 1,
              }}
            >
              CHOOSE&nbsp;YOUR&nbsp;STEWARD
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectMin(!selectMin)}
            title="Show / hide customization options"
            className="font-pixel"
            style={{
              fontSize: 12,
              color: 'var(--mu, #a493c9)',
              background: 'rgba(0,0,0,.3)',
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 5,
              padding: '12px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 'none',
            }}
          >
            {selectMin ? '▶ SHOW OPTIONS' : '▼ HIDE CUSTOMIZATION'}
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
        
        {/* Left: Preview Panel */}
        <div
          style={{
            flex: '1 1 280px',
            minWidth: 250,
            maxWidth: 380,
            border: '3px solid var(--s, #45d6ff)',
            borderRadius: 12,
            background: 'linear-gradient(180deg, rgba(69,214,255,.12) 0%, rgba(18,8,30,.95) 100%)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 0 40px rgba(69,214,255,.08), 0 0 20px rgba(69,214,255,.15)',
          }}
        >
          <div className="font-pixel" style={{ fontSize: 10, color: 'var(--s, #45d6ff)', letterSpacing: 1, marginBottom: 14 }}>
            ▱ LIVE PREVIEW
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 10,
              background: 'linear-gradient(180deg, rgba(36,21,66,.6) 0%, rgba(18,8,30,.9) 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Aura glow effect */}
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
            
            {/* Shadow beneath character */}
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 118,
                height: 12,
                background: 'rgba(0,0,0,.45)',
                borderRadius: '50%',
                filter: 'blur(3px)',
              }}
            />
            
            {/* Character sprite */}
            <PixelSprite
              characterKey={charKey}
              accent={accent}
              opts={{ tint, hairColor, hair, facial, outfit, headgear, gear: loadout }}
              size={150}
              style={{
                position: 'relative',
                zIndex: 1,
                imageRendering: 'pixelated',
                animation: 'floaty 2.6s ease-in-out infinite',
                filter: `drop-shadow(0 6px 0 rgba(0,0,0,.4)) drop-shadow(0 0 16px ${accent})`,
              }}
            />
            
            {/* Companion (if applicable) */}
            {isHuman && companion && companion !== 'none' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 22,
                  right: 20,
                  zIndex: 2,
                  imageRendering: 'pixelated',
                  animation: 'floaty 2.1s ease-in-out 0.35s infinite',
                  filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.4))',
                }}
              >
                {/* Companion sprite would go here - you may need to add companion sprite rendering */}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold, #ffd23f)' }}>
              {playerName || activeChar?.name}
            </div>
            <div style={{ fontSize: 14, color: 'var(--mu, #a493c9)', marginTop: 8, lineHeight: 1.4 }}>
              {activeChar?.kind}
            </div>
            <div className="font-pixel" style={{ fontSize: 10, color: 'var(--ok, #74f0a0)', marginTop: 6 }}>
              ❒ {GEAR_META.find(g => g[0] === loadout)?.[1] || 'TRAVEL LIGHT'}
            </div>
            {SIGFEATURE[charKey] && (
              <>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--s, #45d6ff)', letterSpacing: 1, marginTop: 12 }}>
                  ✧ SPECIAL SKILL
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx, #efe6ff)', marginTop: 6, lineHeight: 1.4 }}>
                  {SIGFEATURE[charKey]}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Customization */}
        <div style={{ flex: '2 1 420px', minWidth: 290, display: 'flex', flexDirection: 'column', gap: 15 }}>
          
          {/* Character Grid */}
          <div>
            <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold, #ffd23f)', letterSpacing: 1, marginBottom: 14 }}>
              ✦ PICK A STEWARD · 12 TRAVELERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
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
                      padding: '12px 8px 14px',
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
                          top: 6,
                          right: 8,
                          fontSize: 8,
                          color: 'var(--bg, #12081e)',
                          background: 'var(--gold, #ffd23f)',
                          borderRadius: 3,
                          padding: '4px 5px',
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <PixelSprite
                        characterKey={k}
                        accent={isSel ? accent : '#6f5e8f'}
                        size={54}
                        style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' }}
                      />
                    </div>
                    <div className="font-pixel" style={{ fontSize: 10, color: 'var(--tx, #efe6ff)', marginTop: 8 }}>
                      {char.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mu, #a493c9)', marginTop: 3, lineHeight: 1.2 }}>
                      {char.kind}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu, #a493c9)', marginBottom: 10 }}>
              YOUR NAME (STUDENT)
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
                borderRadius: 6,
                color: 'var(--tx, #efe6ff)',
                fontSize: 18,
                padding: '12px 14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Options Grid */}
          
            {!selectMin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(188px, 1fr))', gap: 11 }}>
            
            {/* Signal Aura */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--p, #ff5fd2)', marginBottom: 6 }}>◈ SIGNAL AURA</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>Tints outfit & trail glow</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: a.color,
                      border: `3px solid ${accent === a.color ? '#fff' : 'transparent'}`,
                      boxShadow: accent === a.color ? `0 0 14px ${a.color}` : 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Field Tint (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold, #ffd23f)', marginBottom: 6 }}>◐ FIELD TINT</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Skin tone' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Default tint button */}
                <button
                  onClick={() => setTint('default')}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: activeChar?.skinDefault || '#555',
                    border: `3px solid ${tint === 'default' ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
                {TINTS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTint(t)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: t,
                      border: `3px solid ${tint === t ? '#fff' : 'transparent'}`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Headgear (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--s, #45d6ff)', marginBottom: 6 }}>▲ HEADGEAR</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Hats & visors' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HEADGEAR_META.map(([k, label]) => {
                  const isActive = headgear === k
                  return (
                    <button
                      key={k}
                      onClick={() => setHeadgear(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--s, #45d6ff)',
                        background: isActive ? 'var(--s, #45d6ff)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--s, #45d6ff)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Loadout (All) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--ok, #74f0a0)', marginBottom: 6 }}>❒ FIELD KIT · LOADOUT</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>Determines your path</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GEAR_META.map(([k, label]) => {
                  const isActive = loadout === k
                  return (
                    <button
                      key={k}
                      onClick={() => setLoadout(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--ok, #74f0a0)',
                        background: isActive ? 'var(--ok, #74f0a0)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--ok, #74f0a0)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Outfit (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold, #ffd23f)', marginBottom: 6 }}>✚ OUTFIT</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Outerwear' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {OUTFIT_META.map(([k, label]) => {
                  const isActive = outfit === k
                  return (
                    <button
                      key={k}
                      onClick={() => setOutfit(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--gold, #ffd23f)',
                        background: isActive ? 'var(--gold, #ffd23f)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--gold, #ffd23f)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hair Style (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--p, #ff5fd2)', marginBottom: 6 }}>✦ HAIR STYLE</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Cut & shape' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HAIR_META.map(([k, label]) => {
                  const isActive = hair === k
                  return (
                    <button
                      key={k}
                      onClick={() => setHair(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--p, #ff5fd2)',
                        background: isActive ? 'var(--p, #ff5fd2)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--p, #ff5fd2)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hair Color (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--p, #ff5fd2)', marginBottom: 6 }}>✿ HAIR COLOR</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Dye & shade' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setHairColor('default')}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #333 0%, #111 100%)', // Visual indicator for default
                    border: `3px solid ${hairColor === 'default' ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  *
                </button>
                {HAIRCOLS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHairColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: c,
                      border: `3px solid ${hairColor === c ? '#fff' : 'transparent'}`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Facial Hair (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold, #ffd23f)', marginBottom: 6 }}>⌇ FACIAL HAIR</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Beards & staches' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FACIAL_META.map(([k, label]) => {
                  const isActive = facial === k
                  return (
                    <button
                      key={k}
                      onClick={() => setFacial(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--gold, #ffd23f)',
                        background: isActive ? 'var(--gold, #ffd23f)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--gold, #ffd23f)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Companion (People only) */}
            <div style={{ border: '2px solid var(--ln, #3d2668)', borderRadius: 10, background: 'rgba(0,0,0,.2)', padding: '16px 18px', opacity: isHuman ? 1 : 0.4, pointerEvents: isHuman ? 'auto' : 'none' }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--ok, #74f0a0)', marginBottom: 6 }}>❀ COMPANION</div>
              <div style={{ fontSize: 15, color: 'var(--mu, #a493c9)', marginBottom: 12 }}>{isHuman ? 'Desert friend' : '(Human travelers only)'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COMPANION_META.map(([k, label]) => {
                  const isActive = companion === k
                  return (
                    <button
                      key={k}
                      onClick={() => setCompanion(k)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid var(--ok, #74f0a0)',
                        background: isActive ? 'var(--ok, #74f0a0)' : 'transparent',
                        color: isActive ? 'var(--bg, #12081e)' : 'var(--tx, #efe6ff)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 14px var(--ok, #74f0a0)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
          )}
        </div>
      </div>

      {/* (3) Swapping Note */}
      {hasChar && (
        <div style={{ marginTop: 24, border: '2px solid var(--s, #45d6ff)', borderRadius: 8, padding: '14px 18px', background: 'rgba(69,214,255,.08)', fontSize: 15, color: 'var(--tx, #efe6ff)', textAlign: 'center' }}>
          Swapping stewards keeps your journey — <span style={{ color: 'var(--gold, #ffd23f)' }}>{daysComplete}/3 days & {principlesCount} principles are safe.</span>
        </div>
      )}

      {/* (4) Begin / Return Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 26, flexWrap: 'wrap' }}>
        {hasChar && (
          <button
            onClick={() => window.history.back()}
            className="font-pixel"
            style={{
              fontSize: 11,
              color: 'var(--tx, #efe6ff)',
              background: 'transparent',
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 6,
              padding: '14px 24px',
              cursor: 'pointer',
              letterSpacing: 1,
              transition: 'all 0.15s ease',
            }}
          >
            ◄ RETURN TO MAP
          </button>
        )}
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
