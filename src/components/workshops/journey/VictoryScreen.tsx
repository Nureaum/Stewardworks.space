'use client';

import React, { useState } from 'react';
import { PixelSprite, buildIconUri } from '@/components/workshops/journey';
import type { WorkshopCharacter, WorkshopProgressPrinciple, WorkshopDay, WorkshopProgress } from '@/types/workshops';
import { MAP_ICONS } from './character-data';
import { getCelebrateProps, getWinSkill, buildCastFx } from './VictoryEffects';

interface VictoryScreenProps {
  character: WorkshopCharacter;
  daysComplete: number;
  principlesCount: number;
  bankedPrinciples: WorkshopProgressPrinciple[];
  days: WorkshopDay[];
  progressRows: WorkshopProgress[];
  cohortId: string;
  onBack: () => void;
  onViewPortfolio: () => void;
}

export default function VictoryScreen({
  character,
  daysComplete,
  principlesCount,
  bankedPrinciples,
  days,
  progressRows,
  cohortId,
  onBack,
  onViewPortfolio,
}: VictoryScreenProps) {
  const [skillCasting, setSkillCasting] = useState(false);
  const [castCount, setCastCount] = useState(0);
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
  }>>([]);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);

  const playerName = character.player_name || character.character_key.toUpperCase();
  const accent = character.accent_color || '#ffd23f';
  const ceb = getCelebrateProps();
  const skill = getWinSkill(character.character_key);
  const goalUri = buildIconUri(MAP_ICONS.goal, accent);
  
  // Read certificate settings from localStorage (set by admin)
  const [certSettings, setCertSettings] = React.useState(() => {
    try {
      const stored = localStorage.getItem('stewardworks.admin.certSettings');
      return stored ? JSON.parse(stored) : {
        certOrg: 'StewardWorks',
        certFacilitator: 'Marisol Vega',
        certFacTitle: 'Program Director',
        certSponsor: 'Dr. Jane Smith',
        certSponsorOrg: 'SDSU Research Foundation',
        certMessage: ''
      };
    } catch {
      return {
        certOrg: 'StewardWorks',
        certFacilitator: 'Marisol Vega',
        certFacTitle: 'Program Director',
        certSponsor: 'Dr. Jane Smith',
        certSponsorOrg: 'SDSU Research Foundation',
        certMessage: ''
      };
    }
  });
  
  // Generate confetti on mount
  React.useEffect(() => {
    const colors = ['#ffd23f', '#ff5fd2', '#45d6ff', '#74f0a0', '#b06bff', '#ff6b4a'];
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8
    }));
    setConfetti(pieces);
  }, []);
  
  // Chia growth calculation (100% from deliverables)
  const chiaDelivPct = Math.round((daysComplete / 3) * 100);
  const chiaEngPct = 0; // Engagement shown separately
  const chiaPct = chiaDelivPct;

  const chiaStageLabel = 
    chiaPct >= 100 ? 'Lush mane' :
    chiaPct >= 66 ? 'Leafy crown' :
    chiaPct >= 33 ? 'Sprouting' : 'Seedling';

  const handleCastSkill = () => {
    setSkillCasting(true);
    setCastCount(c => c + 1);
    setTimeout(() => setSkillCasting(false), 2000);
  };

  const handleDownloadCertificate = async () => {
    setIsDownloadingPDF(true);
    
    try {
      // Fetch latest certificate settings from database
      const certResponse = await fetch(`/api/workshops/${cohortId}/certificate-settings`);
      const latestCertSettings = certResponse.ok ? await certResponse.json() : certSettings;
      
      // Generate character sprite URI
      const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite');
      const characterSpriteUri = buildSpriteUri(
        character.character_key,
        accent,
        {
          gear: (character as any).gear || 'none',
          outfit: (character as any).outfit || 'plain'
        }
      );

      // Prepare deliverables data
      const deliverables = days.slice(0, 3).map((day, idx) => {
        const progress = progressRows.find(p => p.workshop_day_id === day.id);
        return {
          title: (day as any).deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`,
          url: (progress as any)?.deliverable_url || ''
        };
      });

      // Call the PDF generation API
      const response = await fetch('/api/certificate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerName: playerName,
          characterKey: character.character_key,
          certOrg: latestCertSettings.certOrg,
          certFacilitator: latestCertSettings.certFacilitator,
          certFacTitle: latestCertSettings.certFacTitle,
          certSponsor: latestCertSettings.certSponsor,
          certSponsorOrg: latestCertSettings.certSponsorOrg,
          certMessage: latestCertSettings.certMessage,
          deliverables: deliverables,
          characterSpriteUri: characterSpriteUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };
  
  // Generate Chia sprite using the same logic as TreasureMap
  function chiaStageFor(pct: number): number {
    if (pct >= 100) return 5
    if (pct >= 75) return 4
    if (pct >= 50) return 3
    if (pct >= 25) return 2
    if (pct > 0) return 1
    return 0
  }
  
  function chiaRects(stage: number): Array<[number, number, number, number, string]> {
    const gL = '#d9b34d', gM = '#c19a33', gD = '#9c7a28'
    const eye = '#3a2c14', bD = '#1c150f', bM = '#33281b'
    const gr = '#5fa83c', gr2 = '#8fd85f'
    const fp = '#ff5fd2', fy = '#ffd23f', fv = '#b06bff'

    // Base pot + face
    const r: Array<[number, number, number, number, string]> = [
      [2, 18, 12, 2, bD], [3, 18, 10, 1, bM],
      [6, 11, 4, 1, gL], [5, 12, 6, 1, gM], [5, 13, 6, 1, gM],
      [4, 14, 8, 1, gM], [4, 15, 8, 1, gD], [3, 16, 10, 1, gM], [3, 17, 10, 1, gD],
      [5, 16, 6, 1, gL],
      [7, 10, 2, 1, gM],
      [6, 5, 4, 1, gL], [5, 6, 6, 1, gL], [5, 7, 6, 1, gM], [5, 8, 6, 1, gM], [6, 9, 4, 1, gD],
      [6, 7, 1, 1, eye], [9, 7, 1, 1, eye],
    ]

    // Growth stages
    const defs: Record<number, Array<[number, number, number, number, string]>> = {
      1: [[6, 3, 1, 2, gr], [8, 3, 1, 2, gr], [7, 2, 1, 3, gr], [7, 2, 1, 1, gr2]],
      2: [[5, 2, 1, 3, gr], [7, 1, 1, 4, gr], [9, 2, 1, 3, gr], [8, 2, 1, 3, gr], [7, 1, 1, 1, gr2], [5, 2, 1, 1, gr2], [9, 2, 1, 1, gr2]],
      3: [[5, 1, 1, 4, gr], [6, 2, 1, 3, gr], [7, 0, 1, 5, gr], [8, 1, 1, 4, gr], [9, 2, 1, 3, gr], [10, 3, 1, 2, gr], [7, 0, 1, 1, gr2], [5, 1, 1, 1, gr2], [9, 2, 1, 1, gr2]],
      4: [[4, 3, 1, 2, gr], [5, 1, 1, 4, gr], [6, 0, 1, 5, gr], [7, 0, 1, 5, gr], [8, 1, 1, 4, gr], [9, 0, 1, 5, gr], [10, 2, 1, 3, gr], [6, 0, 1, 1, gr2], [9, 0, 1, 1, gr2], [7, 0, 1, 1, gr2]],
    }

    const S: Array<[number, number, number, number, string]> = []
    if (stage >= 1 && stage < 5) {
      const d = defs[stage]
      if (d) d.forEach(x => S.push(x))
    }
    if (stage >= 5) {
      const leaves: Array<[number, number, number, number, string]> = [[5, 2, 1, 3, gr], [6, 1, 1, 3, gr], [9, 1, 1, 3, gr], [10, 2, 1, 3, gr], [7, 2, 1, 2, gr], [8, 2, 1, 2, gr]]
      const flowers: Array<[number, number, number, number, string]> = [[4, 0, 2, 2, fp], [7, 0, 2, 2, fy], [10, 0, 2, 2, fv]]
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
        `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'><rect width='16' height='20' fill='transparent'/>${body}</svg>`
      )
    )
  }
  
  const chiaStage = chiaStageFor(chiaPct);
  const chiaSvg = chiaUri(chiaStage);

return (
    <div style={{ 
      position: 'relative', 
      maxWidth: 920, 
      margin: '0 auto', 
      padding: '40px 20px', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center'
    }}>
      {/* Background elements */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {ceb.map((p, i) => <div key={'bgp'+i} style={p.style} />)}
      </div>
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: 0, 
        height: 460, 
        zIndex: 0, 
        pointerEvents: 'none', 
        background: 'radial-gradient(120% 80% at 50% 0%, rgba(255,210,63,.16), rgba(69,214,255,.06) 46%, transparent 72%)' 
      }} />
      
      {/* Celebration props (stars, sparkles, music notes) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Star sparkles */}
        <div style={{ position: 'absolute', left: '15%', top: '20%', fontSize: 20, animation: 'sparkle 2s ease-in-out infinite' }}>✦</div>
        <div style={{ position: 'absolute', right: '20%', top: '15%', fontSize: 16, animation: 'sparkle 2.3s ease-in-out infinite', animationDelay: '0.5s' }}>✧</div>
        <div style={{ position: 'absolute', left: '80%', top: '35%', fontSize: 18, animation: 'sparkle 2.1s ease-in-out infinite', animationDelay: '1s' }}>✦</div>
        <div style={{ position: 'absolute', left: '10%', top: '50%', fontSize: 14, animation: 'sparkle 2.4s ease-in-out infinite', animationDelay: '1.5s' }}>✧</div>
        
        {/* Music notes */}
        <div style={{ position: 'absolute', left: '25%', top: '10%', fontSize: 24, color: '#ff5fd2', animation: 'floatUp 4s ease-in-out infinite', opacity: 0.7 }}>♪</div>
        <div style={{ position: 'absolute', right: '15%', top: '25%', fontSize: 20, color: '#45d6ff', animation: 'floatUp 4.5s ease-in-out infinite', animationDelay: '1s', opacity: 0.7 }}>♫</div>
        <div style={{ position: 'absolute', left: '70%', top: '40%', fontSize: 22, color: '#ffd23f', animation: 'floatUp 4.2s ease-in-out infinite', animationDelay: '2s', opacity: 0.7 }}>♪</div>
      </div>

      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: -20,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            zIndex: 0,
            pointerEvents: 'none',
            animation: `confettiFall ${piece.duration}s linear infinite`,
            animationDelay: `${piece.delay}s`,
            opacity: 0.8,
            transform: 'rotate(45deg)'
          }}
        />
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'winpop 0.5s ease both' }}>
        <div className="font-pixel" style={{ 
          fontSize: 9, 
          color: 'var(--s,#45d6ff)', 
          letterSpacing: 3, 
          marginBottom: 14 
        }}>
          ▚ PILOT WORKSHOPS · FINAL SCREEN ▚
        </div>
        
        <div className="font-pixel" style={{ 
          fontSize: 'clamp(20px,5vw,40px)', 
          color: 'var(--gold,#ffd23f)', 
          textShadow: '0 0 22px rgba(255,210,63,.5), 4px 4px 0 rgba(0,0,0,.4)', 
          lineHeight: 1.4 
        }}>
          QUEST&nbsp;COMPLETE
        </div>

        {/* Skill stage with character sprite + Chia pet */}
        <div style={{ 
          position: 'relative', 
          zIndex: 2, 
          width: 'min(440px,88%)', 
          height: 196, 
          margin: '20px auto 0',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          {/* Character sprite */}
          <div style={{ 
            position: 'absolute', 
            left: '50%', 
            bottom: 8, 
            transform: 'translateX(-50%)', 
            zIndex: 3
          }}>
            <div style={{ position: 'relative' }}>
              {/* The character image itself */}
              <PixelSprite
                characterKey={character.character_key}
                accent={accent}
                opts={{
                  gear: (character as any).gear || 'none',
                  outfit: (character as any).outfit || 'plain'
                }}
                size={108}
                style={{
                  imageRendering: 'pixelated',
                  filter: `drop-shadow(0 0 14px ${skill.tone}) drop-shadow(0 4px 2px rgba(0,0,0,.55))`,
                  animation: skillCasting ? skill.heroStyle?.animation : 'none'
                }}
              />
              {/* Treasure Box / cast fx instead of Chia Plant */}
              <img src={goalUri} alt="" width="54" height="54" style={{
                position: 'absolute', right: '5%', bottom: 6,
                imageRendering: 'pixelated', filter: 'drop-shadow(0 0 10px var(--gold,#ffd23f))',
                opacity: 0.92, zIndex: 1
              }} />
              {skillCasting && buildCastFx(character.character_key, castCount)}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginTop: 8 }}>
          <span className="font-pixel" style={{ fontSize: 7, color: 'var(--s,#45d6ff)', letterSpacing: 2 }}>
            ✧ SIGNATURE SKILL
          </span>
          <div style={{ fontSize: 24, color: skill.tone || 'var(--gold,#ffd23f)', marginTop: 8, textShadow: `0 0 12px ${skill.tone}` }}>
            {skill.title}
          </div>
          
          <div style={{ 
            fontSize: 16, 
            color: skill.tone || 'var(--mu,#a493c9)', 
            marginTop: 7, 
            maxWidth: 460, 
            marginLeft: 'auto', 
            marginRight: 'auto',
            lineHeight: 1.4 
          }}>
            {skill.desc}
          </div>
          <div style={{ fontSize: 13, color: 'var(--s,#45d6ff)', opacity: 0.75, marginTop: 9 }}>
            ↻ Replay the journey as a different steward to unlock each one.
          </div>
          
          <div style={{ position: 'relative', zIndex: 3, marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={handleCastSkill}
              className="font-pixel"
              style={{ 
                fontSize: 14, 
                color: 'var(--bg,#12081e)', 
                background: 'var(--gold,#ffd23f)', 
                border: 'none', 
                borderRadius: 6, 
                padding: '12px 18px', 
                cursor: 'pointer', 
                boxShadow: '0 3px 0 #c99020',
                animation: 'nodepulse 2.4s ease-in-out infinite'
              }}
            >
              ✧ CAST SKILL ✧
            </button>
            <div style={{ fontSize: 13, color: 'var(--gold,#ffd23f)', opacity: 0.9 }}>
              ▲ Press the <strong>✧ CAST SKILL ✧</strong> button to make Jordan Alvarez perform the move again.
            </div>
          </div>
        </div>

        <div className="font-pixel" style={{ fontSize: 12, color: 'var(--tx,#efe6ff)', marginTop: 16, lineHeight: 1.6 }}>
          {playerName} walked the full 3-day map.
        </div>
        <div style={{ 
          fontSize: 19, 
          color: 'var(--mu,#a493c9)', 
          marginTop: 12, 
          maxWidth: 560, 
          marginLeft: 'auto', 
          marginRight: 'auto', 
          lineHeight: 1.4 
        }}>
          All three deliverables are banked and the portfolio treasure is unlocked — a story, a tailored résumé, 
          and a live vibe-coded portfolio, marked as yours.
        </div>
      </div>

      {/* Portfolio panel */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        marginTop: 26, 
        border: '2px solid var(--gold,#ffd23f)', 
        borderRadius: 14, 
        background: 'linear-gradient(180deg, rgba(255,210,63,.08), rgba(36,21,66,.92))', 
        boxShadow: '0 0 30px rgba(255,210,63,.12)', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 8, 
          alignItems: 'baseline', 
          justifyContent: 'space-between', 
          padding: '15px 18px 12px', 
          borderBottom: '2px solid var(--ln,#3d2668)' 
        }}>
          <div className="font-pixel" style={{ fontSize: 'clamp(10px,1.8vw,13px)', color: 'var(--gold,#ffd23f)', letterSpacing: 1 }}>
            ❀ MY PORTFOLIO
          </div>
          <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)' }}>
            {daysComplete}/3 deliverables banked · {principlesCount} principles
          </div>
        </div>

        {/* Chia growth summary */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 16, 
          alignItems: 'center', 
          padding: '15px 18px', 
          borderBottom: '2px solid var(--ln,#3d2668)', 
          background: 'rgba(116,240,160,.05)' 
        }}>
          {/* Pixel Chia sprite */}
          <img 
            src={chiaSvg} 
            alt="Chia" 
            width={72} 
            height={90} 
            style={{ 
              imageRendering: 'pixelated', 
              flex: 'none', 
              filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.4))' 
            }} 
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ok,#74f0a0)', letterSpacing: 1, marginBottom: 8 }}>
              CHIA GUARDIAN · {chiaPct}% GROWN
            </div>
            <div style={{ height: 16, background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln,#3d2668)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ 
                float: 'left', 
                height: '100%', 
                width: `${chiaDelivPct}%`, 
                background: 'var(--gold,#ffd23f)' 
              }} />
              <div style={{ 
                float: 'left', 
                height: '100%', 
                width: `${chiaEngPct}%`, 
                background: 'var(--ok,#74f0a0)' 
              }} />
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 7, fontSize: 14 }}>
              <span style={{ color: 'var(--gold,#ffd23f)' }}>■ Deliverables {chiaDelivPct}%</span>
              <span style={{ color: 'var(--ok,#74f0a0)' }}>■ Engagement {chiaEngPct}%</span>
              <span style={{ color: 'var(--mu,#a493c9)' }}>{chiaStageLabel}</span>
            </div>
          </div>
        </div>

        {/* Day deliverables details - padding 6px 18px 12px */}
        <div style={{ padding: '6px 18px 12px' }}>
          {days.slice(0, 3).map((day, idx) => {
            const progress = progressRows.find(p => p.workshop_day_id === day.id);
            const dayTitles = ['THE SANCTUARY & THE HUMAN VOICE', 'EARTH, SMOKE & CLOUDS', 'THE ECONOMIC LAUNCHPAD'];
            const dayGoals = [
              'Tell a compelling personal or environmental story of experience or achievement using Generative AI content-creation tools.',
              'Upgrade, update, and tailor your professional resume relative to regional positions and career pathways you are actively interested in.',
              'Bring your previous two deliverables together into a simple, fully live, vibe-coded professional web portfolio.'
            ];
            
            // Get the principle for this day
            const dayPrinciple = bankedPrinciples.find(bp => {
              const progressForDay = progressRows.find(p => p.workshop_day_id === day.id);
              return progressForDay && bp.progress_id === progressForDay.id;
            });
            
            return (
              <div key={day.id} style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'flex-start',
                padding: '13px 0', 
                borderBottom: '1px dashed var(--ln,#3d2668)' 
              }}>
                {/* Day tag */}
                <div style={{ flex: 'none', width: 74 }}>
                  <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)' }}>
                    DAY {String(day.day_number).padStart(2, '0')}
                  </div>
                  <div className="font-pixel" style={{ 
                    fontSize: 6, 
                    color: 'var(--ok,#74f0a0)', 
                    marginTop: 6, 
                    letterSpacing: 0.5 
                  }}>
                    ✓ APPROVED
                  </div>
                </div>
                
                {/* Day content */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ 
                    fontSize: 17, 
                    color: 'var(--tx,#efe6ff)', 
                    lineHeight: 1.25, 
                    marginBottom: 4 
                  }}>
                    {dayTitles[idx]}
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: 'var(--mu,#a493c9)', 
                    lineHeight: 1.35, 
                    marginBottom: 7 
                  }}>
                    {dayGoals[idx]}
                  </div>
                  
                  {(progress as any)?.deliverable_url && (
                    <div style={{ 
                      fontSize: 14, 
                      color: 'var(--s,#45d6ff)', 
                      wordBreak: 'break-all', 
                      marginBottom: 7 
                    }}>
                      🔗 {(progress as any).deliverable_url}
                    </div>
                  )}
                  
                  {/* Principle tag */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {dayPrinciple && (
                      <span style={{ 
                        fontSize: 13, 
                        color: 'var(--ok,#74f0a0)', 
                        border: '1px solid var(--ok,#74f0a0)', 
                        borderRadius: 20, 
                        padding: '1px 9px' 
                      }}>
                        ◈ {dayPrinciple.principle_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Portfolio actions */}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', padding: '0 18px 16px' }}>
          <button 
            onClick={onViewPortfolio}
            className="font-pixel"
            style={{ 
              fontSize: 14, 
              color: 'var(--bg,#12081e)', 
              background: 'var(--ok,#74f0a0)', 
              border: 'none', 
              borderRadius: 6, 
              padding: '16px 24px', 
              cursor: 'pointer', 
              boxShadow: '0 4px 0 #2b9c64' 
            }}
          >
            ❀ VIEW FULL PORTFOLIO
          </button>
          <a 
            href="https://www.stewardworks.space" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-pixel"
            style={{ 
              fontSize: 14, 
              color: 'var(--s,#45d6ff)', 
              textDecoration: 'none', 
              border: '2px solid var(--s,#45d6ff)', 
              borderRadius: 6, 
              padding: '16px 24px',
              display: 'inline-block'
            }}
          >
            ◇ WORKFORCE ROADMAP ↗
          </a>
          <button 
            onClick={() => setShowCertPreview(true)}
            className="font-pixel"
            style={{ 
              fontSize: 14, 
              color: 'var(--gold,#ffd23f)', 
              background: 'transparent', 
              border: '2px solid var(--gold,#ffd23f)', 
              borderRadius: 6, 
              padding: '16px 24px', 
              cursor: 'pointer', 
              transition: 'all 0.2s'
            }}
          >
            ◆ PREVIEW CERTIFICATE
          </button>
          <button 
            onClick={handleDownloadCertificate}
            disabled={isDownloadingPDF}
            className="font-pixel"
            style={{ 
              fontSize: 14, 
              color: 'var(--bg,#12081e)', 
              background: isDownloadingPDF ? '#9c7a28' : 'var(--gold,#ffd23f)', 
              border: 'none', 
              borderRadius: 6, 
              padding: '16px 24px', 
              cursor: isDownloadingPDF ? 'wait' : 'pointer', 
              boxShadow: '0 4px 0 #c99020',
              opacity: isDownloadingPDF ? 0.7 : 1,
              transition: 'all 0.2s',
              fontWeight: 'bold'
            }}
          >
            {isDownloadingPDF ? '⏳ GENERATING...' : '⛊ DOWNLOAD CERTIFICATE'}
          </button>
        </div>
      </div>

      {/* Back button */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
        <button 
          onClick={onBack}
          className="font-pixel"
          style={{ 
            fontSize: 14, 
            color: 'var(--s,#45d6ff)', 
            background: 'none', 
            border: '2px solid var(--s,#45d6ff)', 
            borderRadius: 5, 
            padding: '16px 24px', 
            cursor: 'pointer' 
          }}
        >
          ◂ VIEW MAP
        </button>
      </div>

      {/* Certificate Preview Modal */}
      {showCertPreview && (
        <div 
          onClick={() => setShowCertPreview(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(8,4,16,.92)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,3vw,40px)', overflow: 'auto' }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: 760, maxHeight: '94vh', overflow: 'auto', background: '#f7f1e0', border: '3px solid #b58a2e', borderRadius: 5, boxShadow: '0 0 0 9px #f8f0da, 0 0 0 11px #c9a24a, 0 30px 70px rgba(0,0,0,.6)', position: 'relative', color: '#3a2c14', fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <button 
              onClick={() => setShowCertPreview(false)} 
              title="Close certificate" 
              className="font-pixel"
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3 }}
            >
              ✕
            </button>
            <div style={{ padding: 'clamp(26px,4.5vw,48px) clamp(22px,4.5vw,56px)', textAlign: 'center', position: 'relative' }}>
              <div className="font-pixel" style={{ fontSize: 8, letterSpacing: 3, color: '#a07d2c' }}>✦ {certSettings.certOrg.toUpperCase()} ✦</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase' }}>Pilot Workshops · The Steward's Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                <PixelSprite characterKey={character.character_key} accent={accent} size={48} opts={{ gear: (character as any).gear || 'none', outfit: (character as any).outfit || 'plain' }} />
                <div style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 700, color: '#1a1206', borderBottom: '2px solid #c9a24a', padding: '0 18px 6px' }}>{playerName}</div>
              </div>
              <div style={{ fontSize: 13, color: '#8a6a2a', letterSpacing: 2, marginBottom: 22, textTransform: 'uppercase' }}>Steward · Certified Steward</div>
              
              <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto' }}>
                {certSettings.certMessage || 'has journeyed the full three-day intensive of The Steward\'s Journey, practicing Active Production over Passive Consumption and banking three original deliverables into the StewardWorks portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of 12 Steward Principles carried forward — this steward is hereby conferred the standing of Certified Steward.'}
              </div>

              <div style={{ borderTop: '2px solid #dcc890', borderBottom: '2px solid #dcc890', margin: '26px auto', padding: '18px 0', maxWidth: 580, textAlign: 'left' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, textAlign: 'center', marginBottom: 15 }}>◆ DELIVERABLES OF RECORD ◆</div>
                {days.slice(0, 3).map((day, idx) => {
                  const progress = progressRows.find(p => p.workshop_day_id === day.id);
                  return (
                    <div key={day.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                      <div style={{ flex: 'none', fontWeight: 700, color: '#8a6a2a', minWidth: 52 }}>D{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>{(day as any).deliverable_title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`}</div>
                        {(progress as any)?.deliverable_url && <div style={{ fontSize: 13, color: '#6a542c', wordBreak: 'break-all', fontFamily: "'Courier New',monospace" }}>{(progress as any).deliverable_url}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 580, margin: '30px auto 0' }}>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certFacilitator}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>{certSettings.certFacTitle} · {certSettings.certOrg}</div>
                </div>
                <div style={{ flex: 'none', textAlign: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle at 38% 30%,#f6dd8c 0%,#e6bd54 46%,#c69528 78%,#9c7015 100%)', border: '3px solid #8a6a2a', boxShadow: '0 3px 10px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.4),inset 0 -6px 14px rgba(120,84,18,.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <img src="/images/cert/steward-seal.png" alt="Seal" style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.9 }} />
                  </div>
                  <div className="font-pixel" style={{ fontSize: 6, color: '#8a6a2a', marginTop: 7, letterSpacing: 2 }}>OFFICIAL SEAL</div>
                </div>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{playerName}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626' }}>THE STEWARD</div>
                </div>
              </div>

              <div style={{ maxWidth: 300, margin: '24px auto 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certSponsor}</div>
                <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>FISCAL SPONSOR · {certSettings.certSponsorOrg}</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', maxWidth: 580, margin: '26px auto 0', fontSize: 11, color: '#8a6a2a', letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>
                <div>ISSUED {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                <div>CERTIFICATE NO. SW-{character.character_key.toUpperCase()}-{Date.now().toString().slice(-4)}</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(138,106,42,.3)', margin: '24px auto 0', paddingTop: 20, paddingBottom: 0, maxWidth: 580, textAlign: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, marginBottom: 12 }}>WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 0 }}>
                  <img src="/images/cert/logo-ca-jobs-first.png" alt="CA Jobs First" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-sdsu-rf.png" alt="SDSU Research Foundation" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-becoming.webp" alt="The Becoming Project" style={{ height: 38, objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes winpop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nodepulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes skillCast {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.2); filter: brightness(1.5); }
        }
        @keyframes skillGlow {
          0% {
            transform: translateX(-50%) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(-50%) scale(2);
            opacity: 0;
          }
        }
        @keyframes chiaBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
      <style jsx global>{`
        @keyframes confetti{0%{transform:translateY(-10px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(560px) rotate(220deg);opacity:0}}
        @keyframes rise{0%{transform:translateY(0);opacity:0}16%{opacity:.9}100%{transform:translateY(-96px);opacity:0}}
        @keyframes skRing{0%{transform:scale(.2);opacity:.85}70%{opacity:.22}100%{transform:scale(2.6);opacity:0}}
        @keyframes skNote{0%{transform:translateY(0) rotate(-8deg);opacity:0}20%{opacity:1}100%{transform:translateY(-84px) rotate(14deg);opacity:0}}
        @keyframes skSpin{to{transform:rotate(360deg)}}
        @keyframes skSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
        @keyframes skShimmer{0%,100%{opacity:.18}50%{opacity:.6}}
        @keyframes skStreak{0%{opacity:0;transform:translateX(12px)}40%{opacity:.9}100%{opacity:0;transform:translateX(-36px)}}
        @keyframes skLeap{0%,100%{transform:translateY(0)}42%{transform:translateY(-42px)}58%{transform:translateY(-42px)}}
        @keyframes skDash{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}
        @keyframes skClimb{0%,100%{transform:translate(-8px,4px)}50%{transform:translate(10px,-26px)}}
        @keyframes skWobble{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
        @keyframes skOrbit{from{transform:rotate(0deg) translateX(var(--orb,48px)) rotate(0deg)}to{transform:rotate(360deg) translateX(var(--orb,48px)) rotate(-360deg)}}
        @keyframes skOrbitR{from{transform:rotate(0deg) translateX(var(--orb,48px)) rotate(0deg)}to{transform:rotate(-360deg) translateX(var(--orb,48px)) rotate(360deg)}}
        @keyframes skPop{0%{transform:translateY(6px) scale(.5);opacity:0}22%{opacity:1}52%{transform:translateY(-26px) scale(1.2);opacity:1}80%{opacity:.45}100%{transform:translateY(-42px) scale(.55);opacity:0}}
        @keyframes skBeam{0%,100%{opacity:0;transform:scaleY(.3)}45%,55%{opacity:.85;transform:scaleY(1)}}
        @keyframes skRain{0%{transform:translateY(-30px);opacity:0}20%{opacity:1}100%{transform:translateY(78px);opacity:0}}
        @keyframes skZig{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}50%{transform:translate(120px,-16px)}85%{opacity:1}100%{opacity:0;transform:translate(240px,0)}}
        @keyframes skBurst{0%{transform:scale(.3);opacity:.9}100%{transform:scale(4.2);opacity:0}}
        @keyframes skFlash{0%{opacity:.5;transform:scale(.6)}100%{opacity:0;transform:scale(1.35)}}
        @keyframes skFan{0%{transform:rotate(var(--ang)) translateY(0) scale(1);opacity:1}100%{transform:rotate(var(--ang)) translateY(-72px) scale(.3);opacity:0}}
        @keyframes cShieldD{0%{transform:scale(.2);opacity:0}28%{opacity:.9}100%{transform:scale(2.5);opacity:0}}
        @keyframes cScatter{0%{transform:translate(0,0) scale(1);opacity:1}18%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
        @keyframes cRise{0%{transform:translateY(28px) scale(.5);opacity:0}25%{opacity:1}100%{transform:translateY(-78px) scale(1.1);opacity:0}}
        @keyframes cSweepX{0%{transform:translateX(-60px);opacity:0}16%{opacity:.95}84%{opacity:.95}100%{transform:translateX(480px);opacity:0}}
        @keyframes cSweepY{0%{transform:translateY(-16px);opacity:0}16%{opacity:.95}84%{opacity:.95}100%{transform:translateY(200px);opacity:0}}
        @keyframes cVig{0%{box-shadow:inset 0 0 0 0 rgba(4,2,12,0);opacity:0}42%{opacity:1;box-shadow:inset 0 0 90px 40px rgba(4,2,12,.9)}100%{box-shadow:inset 0 0 120px 70px rgba(4,2,12,.95);opacity:0}}
        @keyframes cSpinFade{0%{transform:rotate(0) scale(.4);opacity:0}25%{opacity:1}100%{transform:rotate(320deg) scale(1.7);opacity:0}}
        @keyframes cArcL{0%{transform:translate(0,0) scale(.6);opacity:0}18%{opacity:1}50%{transform:translate(66px,-96px)}100%{transform:translate(150px,14px) scale(.4);opacity:0}}
        @keyframes cRay{0%{transform:rotate(var(--ang)) translateY(0) scaleY(.2);opacity:0}30%{opacity:1}100%{transform:rotate(var(--ang)) translateY(-46px) scaleY(1.4);opacity:0}}
        @keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>
    </div>
  );
}
