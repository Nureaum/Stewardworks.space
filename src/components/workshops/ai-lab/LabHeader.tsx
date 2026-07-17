'use client';

import React, { useState } from 'react';
import PixelSprite from '../journey/PixelSprite';
import { GEAR_META, CHARACTERS } from '../journey/character-data';

const PRINCIPLE_TIPS = [
  "Active Production over Passive Consumption: Make with AI - don't just consume it. You are the author; the model is the tool.",
  "Community over Corporation: Build skills that serve people, not platforms. Your work should help your neighbors, not just your resume.",
  "Context over Content: No output is useful without the story of why it matters. Explain the prompt, the problem, and the person it serves.",
  "Iteration over Perfection: First draft is for figuring out what you mean. Second draft is for saying it clearly. Third draft is for the world.",
  "Reciprocity over Extraction: If AI learned from human culture, your work should give back to human culture. Make things that teach, heal, or connect.",
  "Consent over Convenience: Just because you can scrape, generate, or remix doesn't mean you should. Ask first. Credit always.",
];

export default function LabHeader({ day, profilePct, chiaStage, userCharacter }: { day: number, profilePct: number, chiaStage: number, userCharacter?: any }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [tipKey, setTipKey] = useState(0);
  
  const handleMascotClick = () => {
    setTipIndex((prev) => (prev + 1) % PRINCIPLE_TIPS.length);
    setTipKey((prev) => prev + 1);
  };

  const chiaStageNames = ['Bare bust', 'Sprouting', 'Filling in', 'Leafy crown', 'Lush mane', 'Full bloom ❀'];
  const playerName = userCharacter?.player_name || (userCharacter?.character_key ? CHARACTERS[userCharacter.character_key]?.name : 'NAYELI');
  const playerGear = userCharacter?.loadout ? (GEAR_META.find(g => g[0] === userCharacter.loadout)?.[1] || 'TRAVEL LIGHT') : 'CAMERA RIG';
  
  return (
    <div style={{ position: 'relative', border: '2px solid #28432f', borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(180deg,#0a1a13,#0d1512)', height: 'clamp(230px, 28vh, 260px)', marginBottom: 14 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,rgba(77,255,160,.06) 0 1px,transparent 1px 42px),repeating-linear-gradient(0deg,rgba(77,255,160,.045) 0 1px,transparent 1px 42px)' }}></div>
      
      {/* Player info - top left */}
      <div style={{ position: 'absolute', top: 13, left: 15, zIndex: 3, maxWidth: '40%' }}>
        <div className="font-pixel" style={{ fontSize: 10, color: '#ffd23f', textShadow: '0 0 8px rgba(255,210,63,.4)', lineHeight: 1.5 }}>⚙ GENERATION LAB · LV.{day}</div>
        <div style={{ fontSize: 17, color: '#d6ffe0', marginTop: 8, fontFamily: "'VT323', monospace", textTransform: 'uppercase' }}>{playerName}</div>
        <div style={{ fontSize: 14, color: '#4dffa0', marginTop: 1, fontFamily: "'VT323', monospace", textTransform: 'uppercase' }}>❒ {playerGear}</div>
        <div style={{ fontSize: 13, color: '#77b78d', marginTop: 4, fontFamily: "'VT323', monospace" }}>3/3 banked · 6 principles</div>
      </div>

      {/* Interactive mascot - center */}
      <div style={{ position: 'absolute', left: '50%', bottom: 34, transform: 'translateX(-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: 'min(75%,480px)' }}>
        <div 
          key={tipKey}
          style={{ 
            position: 'relative', 
            background: '#0c1a13', 
            border: '2px solid #4dffa0', 
            borderRadius: 9, 
            padding: '9px 12px', 
            boxShadow: '0 0 16px rgba(77,255,160,.25)',
            animation: 'popin 0.25s ease'
          }}
        >
          <div style={{ fontSize: 15, color: '#d6ffe0', lineHeight: 1.35, textAlign: 'center', fontFamily: "'VT323', monospace" }}>
            {PRINCIPLE_TIPS[tipIndex]}
          </div>
          <div style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '8px solid #4dffa0' }}></div>
        </div>
        
        <button 
          onClick={handleMascotClick}
          title="Tap your steward for a new tip" 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 5,
          }}
        >
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bob 1.5s ease-in-out infinite'
          }}>
            <PixelSprite
                characterKey={userCharacter?.character_key || 'nayeli'}
                accent={userCharacter?.accent_color || '#4dffa0'}
                opts={{
                  tint: userCharacter?.tint,
                  hairColor: userCharacter?.hair_color,
                  hair: userCharacter?.hair,
                  facial: userCharacter?.facial,
                  outfit: userCharacter?.outfit || 'vest',
                  headgear: userCharacter?.headgear,
                  gear: userCharacter?.loadout || 'camera'
                }}
              size={76}
              style={{
                filter: 'drop-shadow(0 0 11px #4dffa0) drop-shadow(0 4px 2px rgba(0,0,0,.55))'
              }}
            />
          </div>
          <span className="font-pixel" style={{ 
            fontSize: 6, 
            color: '#4dffa0', 
            letterSpacing: 1,
            animation: 'blink 2.4s steps(1) infinite'
          }}>
            ▸ TAP FOR A TIP
          </span>
        </button>
      </div>

      {/* Right monitors with animations */}
      <div style={{ position: 'absolute', right: 16, bottom: 36, zIndex: 2, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ width: 30, height: 78, background: '#0f1a15', border: '2px solid #28432f', borderRadius: 3, padding: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ height: 4, background: '#4dffa0', animation: 'blink 1.2s steps(1) infinite' }}></span>
          <span style={{ height: 4, background: '#ffd23f', animation: 'blink 0.9s steps(1) infinite 0.3s' }}></span>
          <span style={{ height: 4, background: '#4dffa0', animation: 'blink 1.5s steps(1) infinite 0.6s' }}></span>
          <span style={{ height: 4, background: '#45d6ff', animation: 'blink 1.1s steps(1) infinite 0.15s' }}></span>
          <span style={{ height: 4, background: '#4dffa0', animation: 'blink 1.3s steps(1) infinite 0.45s' }}></span>
        </div>
        <div style={{ width: 60, height: 50, background: '#08120d', border: '2px solid #28432f', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 6, right: 6, top: 9, height: 4, background: '#4dffa0', opacity: 0.5 }}></div>
          <div style={{ position: 'absolute', left: 6, width: 24, top: 18, height: 4, background: '#ffd23f', opacity: 0.55 }}></div>
          <div style={{ position: 'absolute', left: 6, width: 32, top: 27, height: 4, background: '#4dffa0', opacity: 0.35 }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(77,255,160,.5)', animation: 'scanmove 2.2s linear infinite' }}></div>
        </div>
      </div>

      {/* Ground elements */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 26, height: 8, background: 'linear-gradient(180deg,#2b4a3c,#16261f)', zIndex: 1 }}></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: '#0a120e', borderTop: '2px solid #28432f', zIndex: 1 }}></div>

      <style jsx>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        @keyframes scanmove {
          0% { top: -8px; }
          100% { top: 54px; }
        }
        @keyframes popin {
          0% { transform: translateY(6px) scale(0.94); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}





