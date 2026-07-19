'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PixelSprite from '@/components/workshops/journey/PixelSprite';
import { CHARACTER_ORDER, CHARACTERS, ACCENTS } from '@/components/workshops/journey/character-data';

const INTERVAL = 3000; // 3 seconds per character
const TRANSITION_MS = 600;

export default function CharacterParade({ size = 220 }: { size?: number }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const advance = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setDisplayIndex((prev) => (prev + 1) % CHARACTER_ORDER.length);
      setIsTransitioning(false);
    }, TRANSITION_MS / 2);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  const charKey = CHARACTER_ORDER[displayIndex];
  const charDef = CHARACTERS[charKey];
  const accent = ACCENTS[displayIndex % ACCENTS.length].color;

  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none w-full h-full relative">
      {/* Heading */}
      <div className="text-center z-10">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
          ✦ Pick a Steward ✦
        </p>
        <p className="text-sm font-black text-white/70 uppercase tracking-wider mt-1">
          12 Travelers
        </p>
      </div>

      {/* Glowing animated backdrop */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size + 60, height: size + 60 }}
      >
        {/* Outer pulsing ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${accent}15 0%, transparent 60%)`,
            border: `2px solid ${accent}25`,
            filter: 'blur(1px)',
          }}
        />
        {/* Middle glow orb */}
        <div
          className="absolute rounded-full transition-all duration-700"
          style={{
            inset: 16,
            background: `radial-gradient(circle, ${accent}35 0%, ${accent}10 40%, transparent 70%)`,
            filter: 'blur(12px)',
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}
        />
        {/* Inner bright core */}
        <div
          className="absolute rounded-full transition-all duration-500"
          style={{
            inset: 40,
            background: `radial-gradient(circle, ${accent}50 0%, transparent 70%)`,
            filter: 'blur(6px)',
          }}
        />
        {/* Floating particles effect via box-shadows */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            boxShadow: `
              ${accent}40 0px -30px 20px -20px,
              ${accent}30 25px -15px 15px -15px,
              ${accent}30 -25px -15px 15px -15px,
              ${accent}20 35px 10px 10px -10px,
              ${accent}20 -35px 10px 10px -10px
            `,
            animation: 'floatParticles 3s ease-in-out infinite',
          }}
        />

        {/* Character sprite */}
        <div
          className="relative z-10 transition-all duration-300 ease-out"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? 'translateY(20px) scale(0.7)'
              : 'translateY(0) scale(1)',
            filter: isTransitioning ? 'blur(4px)' : 'none',
          }}
        >
          <PixelSprite
            characterKey={charKey}
            accent={accent}
            size={size}
          />
        </div>
      </div>

      {/* Character name & kind */}
      <div
        className="text-center transition-all duration-300 z-10"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        <p
          className="text-base font-black uppercase tracking-[0.25em]"
          style={{ color: accent, textShadow: `0 0 20px ${accent}60` }}
        >
          {charDef?.name}
        </p>
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mt-0.5">
          {charDef?.kind}
        </p>
      </div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes glowPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes floatParticles {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-4px) rotate(1deg); }
          66% { transform: translateY(2px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
