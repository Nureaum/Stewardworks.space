import React from 'react';
import './community.css';

export default function CommunityListeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="community-layout community-scroll font-theme-wrapper">
      {children}
    </div>
  );
}
