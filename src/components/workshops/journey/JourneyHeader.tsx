'use client'

import React from 'react'
import ArcadeButton from './ArcadeButton'
import PixelSprite from './PixelSprite'
import type { WorkshopCharacter } from '@/types/workshops'

type JourneyTab = 'journey' | 'portfolio' | 'showcase' | 'studentshowcase'

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
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(16,8,26,.98), rgba(16,8,26,.82))',
        borderBottom: '2px solid var(--ln, #3d2668)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Top Row: Hub + Title + Profile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px clamp(12px, 2.5vw, 22px)',
          gap: 12,
        }}
      >
        {/* Left: Hub button */}
        <button
          onClick={onHub}
          className="font-pixel"
          title="Return to the workshop hub"
          style={{
            fontSize: 11,
            lineHeight: '1.6',
            color: 'var(--s, #45d6ff)',
            background: 'transparent',
            border: '2px solid var(--s, #45d6ff)',
            borderRadius: 5,
            padding: '8px 14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 10px rgba(69,214,255,.2)',
            flex: 'none',
          }}
        >
          ◄ HUB
        </button>

        {/* Center: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', justifyContent: 'flex-start' }}>
          {/* Pixel cross logo */}
          <svg width="32" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
            <rect x="7" y="1" width="2" height="14" fill="var(--p, #ff5fd2)" />
            <rect x="1" y="7" width="14" height="2" fill="var(--s, #45d6ff)" />
            <rect x="6" y="6" width="4" height="4" fill="var(--gold, #ffd23f)" />
          </svg>

          <div style={{ minWidth: 0 }}>
            <div
              className="font-pixel"
              style={{
                fontSize: 'clamp(11px, 1.8vw, 14px)',
                color: 'var(--gold, #ffd23f)',
                textShadow: '0 0 12px rgba(255,210,63,.5)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              THE STEWARD&apos;S JOURNEY
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--mu, #a493c9)',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: 2,
              }}
            >
              Pilot Workshops · 3-Day Intensive
            </div>
          </div>
        </div>

        {/* Right: Player profile */}
        {character && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '2px solid var(--ln, #3d2668)',
              borderRadius: 8,
              padding: '6px 12px 6px 8px',
              background: 'rgba(255,255,255,.03)',
              flex: 'none',
            }}
          >
            {/* Character sprite */}
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
              size={38}
              style={{ flex: 'none', filter: `drop-shadow(0 0 6px ${character.accent_color || 'var(--p)'})` }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div className="font-pixel" style={{ fontSize: 10, color: 'var(--tx, #efe6ff)' }}>
                {character.player_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gold, #ffd23f)', marginTop: 2 }}>
                ◈ {daysComplete}/3 days · {principlesCount} principles
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
              <button
                onClick={onChangeChar}
                title="Change character (keeps progress)"
                className="font-pixel"
                style={{
                  fontSize: 10,
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
                  fontSize: 9,
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
        )}
      </div>

      {/* Bottom Row: Navigation tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(12px, 2.5vw, 22px) 10px',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: AI Lab */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <a
            href={`/hub/ai-lab${cohortId ? '?cohortId=' + cohortId : ''}`}
            className="font-pixel"
            style={{
              fontSize: 11,
              lineHeight: '1.6',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 5,
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

        {/* Center: Journey, My Portfolio */}
        <div style={{ flex: 2, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <ArcadeButton
            active={activeTab === 'journey'}
            color="var(--p, #ff5fd2)"
            onClick={() => onTabChange('journey')}
          >
            ◆ JOURNEY
          </ArcadeButton>
          <ArcadeButton
            active={activeTab === 'portfolio'}
            color="var(--ok, #74f0a0)"
            onClick={() => character ? onTabChange('portfolio') : undefined}
            style={!character ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            ❀ MY PORTFOLIO
          </ArcadeButton>
        </div>

        {/* Right: Contributor Showcase, Student Showcase */}
        <div style={{ flex: 1, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ArcadeButton
            active={activeTab === 'showcase'}
            color="var(--gold, #ffd23f)"
            onClick={() => onTabChange('showcase')}
          >
            ★ CONTRIBUTOR SHOWCASE
          </ArcadeButton>
          <ArcadeButton
            active={activeTab === 'studentshowcase'}
            color="#ff5fd2"
            onClick={() => onTabChange('studentshowcase')}
          >
            ✧ STUDENT SHOWCASE
          </ArcadeButton>
        </div>
      </div>
    </div>
  )
}
