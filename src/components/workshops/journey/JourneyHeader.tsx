'use client'

import React from 'react'
import ArcadeButton from './ArcadeButton'
import PixelSprite from './PixelSprite'
import type { WorkshopCharacter } from '@/types/workshops'

type JourneyTab = 'journey' | 'portfolio' | 'showcase'

interface JourneyHeaderProps {
  activeTab: JourneyTab
  onTabChange: (tab: JourneyTab) => void
  character: WorkshopCharacter | null
  daysComplete: number
  principlesCount: number
  onChangeChar: () => void
  onReset: () => void
  onHub: () => void
  cohortId: string
}

export default function JourneyHeader({
  activeTab,
  onTabChange,
  character,
  daysComplete,
  principlesCount,
  onChangeChar,
  onReset,
  onHub,
  cohortId,
}: JourneyHeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
        padding: '11px clamp(12px, 2vw, 20px)',
        background: 'linear-gradient(180deg, rgba(16,8,26,.98), rgba(16,8,26,.82))',
        borderBottom: '2px solid var(--ln, #3d2668)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Left: Hub + Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '0 1 auto' }}>
        <ArcadeButton
          color="var(--s, #45d6ff)"
          onClick={onHub}
          title="Return to the workshop hub"
          style={{
            padding: '9px 11px',
            borderRadius: 6,
            boxShadow: '0 0 10px rgba(69,214,255,.2)',
          }}
        >
          ⌂ HUB
        </ArcadeButton>

        {/* Pixel cross logo */}
        <svg width="30" height="30" viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
          <rect x="7" y="1" width="2" height="14" fill="var(--p, #ff5fd2)" />
          <rect x="1" y="7" width="14" height="2" fill="var(--s, #45d6ff)" />
          <rect x="6" y="6" width="4" height="4" fill="var(--gold, #ffd23f)" />
        </svg>

        <div style={{ minWidth: 0 }}>
          <div
            className="font-pixel"
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              color: 'var(--gold, #ffd23f)',
              textShadow: '0 0 10px rgba(255,210,63,.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            THE STEWARD&apos;S JOURNEY
          </div>
          <div
            style={{
              fontSize: 15,
              color: 'var(--mu, #a493c9)',
              letterSpacing: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Pilot Workshops · 3-Day Intensive
          </div>
        </div>
      </div>

      {/* Center: Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 1 auto', justifyContent: 'center', minWidth: 0 }}>
        <ArcadeButton
          active={activeTab === 'journey'}
          color="var(--p, #ff5fd2)"
          onClick={() => onTabChange('journey')}
        >
          ◆ JOURNEY
        </ArcadeButton>
        {character && (
          <ArcadeButton
            active={activeTab === 'portfolio'}
            color="var(--ok, #74f0a0)"
            onClick={() => onTabChange('portfolio')}
          >
            ❀ MY PORTFOLIO
          </ArcadeButton>
        )}
        <ArcadeButton
          active={activeTab === 'showcase'}
          color="var(--gold, #ffd23f)"
          onClick={() => onTabChange('showcase')}
        >
          ★ SHOWCASE
        </ArcadeButton>
        <a
          href={`/hub/ai-lab${cohortId ? '?cohortId=' + cohortId : ''}`}
          className="font-pixel"
          style={{
            fontSize: '8px',
            cursor: 'pointer',
            padding: '9px 10px',
            borderRadius: 4,
            border: '2px solid var(--ok, #74f0a0)',
            background: 'transparent',
            color: 'var(--ok, #74f0a0)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 12px rgba(116,240,160,.18)',
          }}
        >
          ⚡ AI LAB
        </a>
      </div>

      {/* Right: Player profile */}
      {character && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'nowrap', justifyContent: 'flex-end', flex: '0 1 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 6,
              padding: '5px 8px 5px 6px',
              background: 'rgba(255,255,255,.03)',
            }}
          >
            {/* Character sprite from PixelSprite */}
            <PixelSprite
              characterKey={character.character_key}
              accent={character.accent_color || 'var(--p)'}
              opts={{
                tint: character.tint,
                hairColor: character.hair_color,
                hair: character.hair,
                facial: character.facial,
                outfit: character.outfit,
                headgear: character.headgear,
                gear: character.loadout,
              }}
              size={34}
              style={{ flex: 'none', filter: `drop-shadow(0 0 5px ${character.accent_color || 'var(--p)'})` }}
            />
            <div style={{ lineHeight: 1.05 }}>
              <div className="font-pixel" style={{ fontSize: 9, color: 'var(--tx, #efe6ff)' }}>
                {character.player_name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gold, #ffd23f)' }}>
                ◈ {daysComplete}/3 days · {principlesCount} principles
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                onClick={onChangeChar}
                title="Change character (keeps progress)"
                className="font-pixel"
                style={{
                  fontSize: 9,
                  color: 'var(--s, #45d6ff)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ⇆
              </button>
              <button
                onClick={onReset}
                title="Reset journey"
                className="font-pixel"
                style={{
                  fontSize: 8,
                  color: 'var(--mu, #a493c9)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ⟲
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
