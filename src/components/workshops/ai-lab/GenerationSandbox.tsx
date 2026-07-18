'use client';

import React, { useState } from 'react';

interface Platform {
  id: string;
  name: string;
  url: string;
  is_default: boolean;
}

export default function GenerationSandbox({ edenEmbedUrl, platforms = [] }: { edenEmbedUrl: string; platforms?: Platform[] }) {
  // Build the list of platforms to show as tabs
  // Always include Eden.art as the default, plus any additional platforms from the database
  const allPlatforms: Platform[] = platforms.length > 0
    ? platforms
    : [{ id: 'eden-default', name: 'Eden.art', url: edenEmbedUrl, is_default: true }];

  const [activePlatformId, setActivePlatformId] = useState(allPlatforms[0]?.id || 'eden-default');
  const activePlatform = allPlatforms.find(p => p.id === activePlatformId) || allPlatforms[0];

  return (
    <div style={{ border: '2px solid #28432f', borderRadius: 10, background: '#14211b', overflow: 'hidden', flex: '1.45 1 440px', minWidth: 320, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '13px 15px', borderBottom: '2px solid #28432f', background: 'linear-gradient(180deg,rgba(255,95,210,.08),transparent)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div className="font-pixel" style={{ fontSize: 8, color: '#ff5fd2', letterSpacing: 1 }}>⚡ GENERATION SANDBOX · {activePlatform.name.toUpperCase()} LAUNCHPAD</div>
          <a 
            href={activePlatform.url} 
            target="_blank" 
            rel="noreferrer" 
            className="font-pixel" 
            style={{ 
              fontSize: 8, 
              color: '#4dffa0', 
              textDecoration: 'none', 
              border: '2px solid #4dffa0', 
              borderRadius: 5, 
              padding: '8px 10px',
              whiteSpace: 'nowrap',
              flex: 'none'
            }}
          >
            OPEN {activePlatform.name.toUpperCase()} ↗
          </a>
        </div>

        {/* Platform Tabs */}
        {allPlatforms.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {allPlatforms.map((platform) => {
              const isActive = platform.id === activePlatformId;
              // Color coding: default (eden) = pink, others cycle through cyan, yellow, green
              const colors = ['#ff5fd2', '#45d6ff', '#ffd23f', '#4dffa0', '#c98bad', '#84a9c4'];
              const idx = allPlatforms.indexOf(platform);
              const borderColor = isActive ? colors[idx % colors.length] : '#28432f';
              const textColor = isActive ? colors[idx % colors.length] : '#77b78d';

              return (
                <button
                  key={platform.id}
                  onClick={() => setActivePlatformId(platform.id)}
                  className="font-pixel"
                  style={{
                    fontSize: 8,
                    padding: '8px 12px',
                    border: `2px solid ${borderColor}`,
                    borderRadius: 6,
                    background: isActive ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.3)',
                    color: textColor,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? `0 0 10px ${borderColor}40` : 'none',
                  }}
                >
                  {platform.name.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ 
          flex: 1, 
          minHeight: 'clamp(380px,54vh,600px)', 
          background: 'radial-gradient(120% 90% at 50% 0%,rgba(255,95,210,.09),transparent 60%),#08120d', 
          border: '2px solid #28432f', 
          borderRadius: 6, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center', 
          gap: 18, 
          padding: '30px 26px' 
        }}>
          <div style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 0 12px rgba(255,95,210,.5))' }}>↗</div>
          <div className="font-pixel" style={{ fontSize: 12, color: '#d6ffe0', lineHeight: 1.7, maxWidth: 340 }}>GENERATE ON {activePlatform.name.toUpperCase()}</div>
          <div style={{ fontSize: 15, color: '#77b78d', lineHeight: 1.5, maxWidth: 420 }}>
            {activePlatform.name.toUpperCase()} runs in its own tab so sign-in works and you get the full toolset. Open it, make something, then bring your result back here.
          </div>
          <a 
            href={activePlatform.url} 
            target="_blank" 
            rel="noreferrer" 
            className="font-pixel" 
            style={{ 
              fontSize: 11, 
              color: '#0e1512', 
              background: '#4dffa0', 
              textDecoration: 'none', 
              borderRadius: 6, 
              padding: '16px 22px', 
              boxShadow: '0 0 20px rgba(77,255,160,.35)', 
              whiteSpace: 'nowrap' 
            }}
          >
            OPEN {activePlatform.name.toUpperCase()} ↗
          </a>

          {/* 3-step process */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4, maxWidth: 460 }}>
            <div style={{ flex: '1', minWidth: 120, border: '1px solid #28432f', borderRadius: 8, background: 'rgba(0,0,0,.25)', padding: '11px 12px' }}>
              <div className="font-pixel" style={{ fontSize: 7, color: '#45d6ff', marginBottom: 7 }}>1 · OPEN</div>
              <div style={{ fontSize: 13, color: '#d6ffe0', lineHeight: 1.4 }}>Launch {activePlatform.name} &amp; sign in</div>
            </div>
            <div style={{ flex: '1', minWidth: 120, border: '1px solid #28432f', borderRadius: 8, background: 'rgba(0,0,0,.25)', padding: '11px 12px' }}>
              <div className="font-pixel" style={{ fontSize: 7, color: '#ffd23f', marginBottom: 7 }}>2 · CREATE</div>
              <div style={{ fontSize: 13, color: '#d6ffe0', lineHeight: 1.4 }}>Generate, then copy its share link</div>
            </div>
            <div style={{ flex: '1', minWidth: 120, border: '1px solid #4dffa0', borderRadius: 8, background: 'rgba(77,255,160,.06)', padding: '11px 12px' }}>
              <div className="font-pixel" style={{ fontSize: 7, color: '#4dffa0', marginBottom: 7 }}>3 · SAVE</div>
              <div style={{ fontSize: 13, color: '#d6ffe0', lineHeight: 1.4 }}>Paste it in Save a Creation below</div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ fontSize: 14, color: '#77b78d', lineHeight: 1.35 }}>
          ⚡ Bring work back: paste your creation's link in the <span style={{ color: '#4dffa0' }}>Save a Creation</span> panel below — that's what feeds your portfolio and the showcase.
        </div>
      </div>
    </div>
  );
}
