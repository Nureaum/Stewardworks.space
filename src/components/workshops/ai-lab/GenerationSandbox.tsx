'use client';

import React, { useState } from 'react';

interface Platform {
  id: string;
  name: string;
  url: string;
  is_default: boolean;
}

export default function GenerationSandbox({ edenEmbedUrl, platforms = [] }: { edenEmbedUrl: string; platforms?: Platform[] }) {
  // Build the list of platforms
  // Always include Eden.art as the default, plus any additional platforms from the database
  const allPlatforms: Platform[] = platforms.length > 0
    ? platforms
    : [{ id: 'eden-default', name: 'Eden.art', url: edenEmbedUrl, is_default: true }];

  return (
    <div style={{ border: '2px solid #28432f', borderRadius: 10, background: '#14211b', overflow: 'hidden', minWidth: 320, height: 'fit-content' }}>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="font-pixel" style={{ fontSize: 10, color: '#ff5fd2', letterSpacing: 1 }}>⚡ GENERATION SANDBOX</div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {allPlatforms.map((platform, idx) => {
            // Cycle through vibrant colors for the buttons
            const colors = ['#ff5fd2', '#45d6ff', '#ffd23f', '#4dffa0', '#c98bad', '#84a9c4'];
            const btnColor = colors[idx % colors.length];
            return (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noreferrer"
                className="font-pixel"
                style={{
                  fontSize: 10,
                  color: '#0e1512',
                  background: btnColor,
                  textDecoration: 'none',
                  borderRadius: 6,
                  padding: '12px 16px',
                  boxShadow: `0 0 15px ${btnColor}40`,
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}
              >
                OPEN {platform.name.toUpperCase()} ↗
              </a>
            );
          })}
        </div>

        {/* Bottom note */}
        <div style={{ fontSize: 14, color: '#77b78d', lineHeight: 1.4, marginTop: 4 }}>
          ⚡ Bring work back: paste your creation's link in the <span style={{ color: '#4dffa0' }}>Save a Creation</span> panel below — that's what feeds your portfolio and the showcase.
        </div>
      </div>
    </div>
  );
}
