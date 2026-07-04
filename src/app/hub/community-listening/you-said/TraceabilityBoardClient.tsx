'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TraceabilityBoardClient({ integrations, areaStats, sessionCount, participantTotal }: any) {
  const router = useRouter();
  const integrationCount = integrations.length;
  const areaCount = areaStats.length;

  // Group integrations by area
  const byArea: Record<string, any> = {};
  integrations.forEach((it: any) => {
    const areaName = it.project_areas?.name || 'Uncategorized';
    if (!byArea[areaName]) {
      byArea[areaName] = {
        area: areaName,
        color: it.project_areas?.color || '#8a7a5c',
        items: []
      };
    }
    byArea[areaName].items.push({
      kind: it.source_type === 'session' ? 'Session Note' : 'Public Submission',
      source: it.source_type === 'session' ? (it.listening_sessions?.location || 'Unknown Session') : 'Web Form',
      quote: it.quote,
      who: it.voice || 'Community Member',
      integration: it.integration_note,
      areaColor: it.project_areas?.color || '#8a7a5c'
    });
  });

  const groupedAreas = Object.values(byArea);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 110 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 24px', borderBottom: '1px solid rgba(122,90,52,.15)', boxShadow: '0 4px 20px rgba(90,58,34,.05)' }}>
        <Link href="/hub/community-listening" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a86c28', fontWeight: 600 }}>&larr; Listening Wall</Link>
      </div>

      <div style={{ padding: '44px 24px 0', maxWidth: 1000, margin: '0 auto', animation: 'fadeUp .4s ease both' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.22em', color: '#a07b4d', textTransform: 'uppercase' }}>Traceability board</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: '#4a3728', marginTop: 6, letterSpacing: '-.02em' }}>You Said &rarr; We Did</div>
          <p style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 18, color: '#8a6f4d', maxWidth: 600, margin: '10px auto 0' }}>Every idea we heard, traced to exactly where it shaped the project. Integrity is call and response.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', margin: '28px 0 34px' }}>
          <div style={{ background: '#fbf5ea', borderRadius: 14, padding: '16px 26px', textAlign: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#c98a3d' }}>{integrationCount}</div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', color: '#8a6f4d', textTransform: 'uppercase' }}>Ideas integrated</div>
          </div>
          <div style={{ background: '#fbf5ea', borderRadius: 14, padding: '16px 26px', textAlign: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#3f9e8f' }}>{areaCount}</div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', color: '#8a6f4d', textTransform: 'uppercase' }}>Project areas shaped</div>
          </div>
          <div style={{ background: '#fbf5ea', borderRadius: 14, padding: '16px 26px', textAlign: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#6f97b0' }}>{sessionCount}</div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', color: '#8a6f4d', textTransform: 'uppercase' }}>Listening sessions</div>
          </div>
          <div style={{ background: '#fbf5ea', borderRadius: 14, padding: '16px 26px', textAlign: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#d97a97' }}>{participantTotal}</div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', color: '#8a6f4d', textTransform: 'uppercase' }}>Voices heard</div>
          </div>
        </div>

        {groupedAreas.map((grp: any, i: number) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: grp.color }}></span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#4a3728' }}>{grp.area}</span>
              <span style={{ flex: 1, height: 1, background: '#e3d3b6' }}></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grp.items.map((it: any, j: number) => (
                <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1.1fr', background: '#fbf5ea', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
                  <div style={{ padding: '18px 22px', borderLeft: `5px solid ${it.areaColor}` }}>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.12em', color: '#a07b4d', textTransform: 'uppercase' }}>{it.kind} &middot; {it.source}</div>
                    <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 16.5, lineHeight: 1.5, color: '#4a3728', margin: '8px 0 0' }}>&ldquo;{it.quote}&rdquo;</p>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#8a6f4d', marginTop: 8 }}>&mdash; {it.who}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4e8d3', color: it.areaColor, fontSize: 22, fontWeight: 700 }}>&rarr;</div>
                  <div style={{ padding: '18px 22px', background: '#f4e8d3' }}>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.12em', color: '#a07b4d', textTransform: 'uppercase' }}>We built</div>
                    <p style={{ fontSize: 15, lineHeight: 1.55, color: '#4a3728', margin: '8px 0 0' }}>{it.integration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <div onClick={() => router.push('/hub/community-listening/submit')} style={{ display: 'inline-block', cursor: 'pointer', background: '#c98a3d', color: '#fff', padding: '14px 26px', borderRadius: 12, fontWeight: 600, fontSize: 14.5, boxShadow: '0 8px 20px rgba(201,138,61,.3)' }} className="hover:brightness-110">Add your own thought &rarr;</div>
        </div>
      </div>
    </div>
  );
}
