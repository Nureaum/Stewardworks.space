'use client';

import React from 'react';

export default function GenerationSandbox({ edenEmbedUrl }: { edenEmbedUrl: string }) {
  return (
    <div style={{ border: '2px solid #28432f', borderRadius: 10, background: '#14211b', overflow: 'hidden', flex: '1.45 1 440px', minWidth: 320, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0e1512', borderBottom: '2px solid #28432f' }}>
        <div className="font-pixel" style={{ fontSize: 8, color: '#ff5fd2', letterSpacing: 1 }}>⚡ GENERATION SANDBOX · EDEN.ART LIVE</div>
        <a href={edenEmbedUrl} target="_blank" rel="noreferrer" className="font-pixel" style={{ fontSize: 7, color: '#4dffa0', textDecoration: 'none', border: '1px solid #4dffa0', borderRadius: 4, padding: '7px 10px' }}>OPEN EDEN.ART ↗</a>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
        <iframe src={edenEmbedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#000' }} title="AI Generation Sandbox" />
      </div>
    </div>
  );
}
