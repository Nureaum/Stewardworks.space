'use client';

import React from 'react';
import CharacterParade from '@/app/components/auth/CharacterParade';

interface AuthCardProps {
  children: React.ReactNode;
  showAvatar?: boolean;
}

export default function AuthCard({ children, showAvatar = true }: AuthCardProps) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-stretch w-full max-w-[820px] mx-2 sm:mx-0">
      {/* Avatar - mobile: show above card (smaller) */}
      {showAvatar && (
        <div className="md:hidden mb-[-8px] z-30">
          <CharacterParade size={64} />
        </div>
      )}
      {/* Form card - left side (50%) */}
      <div
        className="w-full md:w-1/2 p-5 md:p-6"
        style={{
          background: '#0C1636',
          border: '3px solid #060B1E',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.5), 0 0 0 6px rgba(11,19,48,0.4)',
          borderRadius: showAvatar ? '2px 0 0 2px' : '2px',
        }}
      >
        {children}
      </div>
      {/* Character Parade - right side (50%) */}
      {showAvatar && (
        <div
          className="hidden md:flex md:w-1/2 items-center justify-center px-6 py-8"
          style={{
            background: '#0C1636',
            border: '3px solid #060B1E',
            borderLeft: 'none',
            boxShadow: '6px 6px 0 rgba(0,0,0,0.5)',
            borderRadius: '0 2px 2px 0',
          }}
        >
          <CharacterParade size={220} />
        </div>
      )}
    </div>
  );
}
