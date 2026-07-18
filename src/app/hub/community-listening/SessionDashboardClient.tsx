'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SessionDashboardClient({ session, quotes, photos, integrations }: any) {
  const router = useRouter();
  const [layout, setLayout] = useState<'editorial' | 'panels'>('editorial');

  if (!session) {
    return <div className="p-8 text-center text-red-800">Session not found.</div>;
  }

  const dateStr = session.session_date ? new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const recordLabel = session.recorded ? 'Recording Audio' : 'No Audio';
  
  const orientation = session.orientation || { overall: 'Neutral', note: '', supportive: 0, systems: 0, sovereignty: 0 };
  
  // Create gauges dynamically from the DB orientation data instead of hardcoding
  const gauges = [
    { label: 'Sees AI as supportive', val: orientation.supportive || 0, color: session.accent || '#3f9e8f' },
    { label: 'Community / systems thinking', val: orientation.systems || 0, color: '#c98a3d' },
    { label: 'Readiness for local control', val: orientation.sovereignty || 0, color: '#d97a97' },
  ];

  const themes = session.themes || [];
  const barriers = session.barriers || [];

  return (
    <div style={{ backgroundColor: '#fdfbfa', minHeight: '100vh', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Top Bar for Session */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '12px 24px', backgroundColor: '#fdfbfa', borderBottom: '1px solid #efe4cf', boxShadow: '0 4px 20px rgba(90,58,34,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Link href="/hub/community-listening" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a86c28', fontWeight: 600 }}>&larr; Listening Wall</Link>
          <div style={{ width: 1, height: 26, background: 'rgba(122,90,52,.22)' }}></div>
          <div style={{ fontFamily: 'var(--font-baloo)', fontWeight: 800, fontSize: 18, color: '#4a3728' }}>{session.location}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Layout Toggle */}
          <div style={{ display: 'flex', background: '#f2e4cb', borderRadius: 12, padding: 3 }}>
            <div onClick={() => setLayout('editorial')} style={{ padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 600, color: layout === 'editorial' ? '#4a3728' : '#a07b4d', background: layout === 'editorial' ? '#fff' : 'transparent', boxShadow: layout === 'editorial' ? '0 2px 4px rgba(0,0,0,.08)' : 'none' }}>EDITORIAL</div>
            <div onClick={() => setLayout('panels')} style={{ padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', fontWeight: 600, color: layout === 'panels' ? '#4a3728' : '#a07b4d', background: layout === 'panels' ? '#fff' : 'transparent', boxShadow: layout === 'panels' ? '0 2px 4px rgba(0,0,0,.08)' : 'none' }}>PANELS</div>
          </div>
          <div style={{ width: 1, height: 26, background: 'rgba(122,90,52,.22)' }}></div>
          <Link href="/hub/community-listening/submit" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, background: '#c98a3d', color: '#fff', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, boxShadow: '0 4px 10px rgba(201,138,61,.3)' }} className="hover:brightness-110">+ Share</Link>
        </div>
      </div>

      <div data-screen-label="session" style={{ paddingBottom: 96 }}>
        
        {layout === 'editorial' ? (
          <div style={{ animation: 'fadeUp .4s ease both' }}>
            {/* hero */}
            <div style={{ position: 'relative', background: session.accent || '#c98a3d', color: '#fff', padding: '44px 8% 32px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(255,255,255,.16),rgba(0,0,0,.14))', pointerEvents: 'none' }}></div>
              <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', opacity: .85 }}>Community Listening Session</div>
                <div style={{ fontSize: 48, fontWeight: 700, marginTop: 6, letterSpacing: '-.02em' }}>{session.location}</div>
                <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 21, marginTop: 4, opacity: .95 }}>{session.tagline}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11.5 }}>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 20 }}>{dateStr}</span>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 20 }}>{session.venue}</span>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 20 }}>{session.participants} participants</span>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 20 }}>{recordLabel}</span>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '6px 12px', borderRadius: 20 }}>Facilitators &mdash; {session.facilitators}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, opacity: .9 }}>Population &mdash; {session.population}</div>
              </div>
            </div>

            <div style={{ maxWidth: 1080, margin: '-20px auto 0', padding: '0 24px' }}>
              {/* narrative + sentiment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>
                <div style={{ background: '#fbf5ea', borderRadius: 16, padding: '28px 30px', boxShadow: '0 14px 34px rgba(60,40,20,.14)' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d' }}>The narrative</div>
                  <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 18.5, lineHeight: 1.62, color: '#4a3728', margin: '12px 0 0', textWrap: 'pretty' }}>{session.narrative}</p>
                </div>
                <div style={{ background: '#fbf5ea', borderRadius: 16, padding: '24px 26px', boxShadow: '0 14px 34px rgba(60,40,20,.14)' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d' }}>How the group oriented toward AI</div>
                  {gauges.map((g: any, i: number) => (
                    <div key={i} style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#5c4632', marginBottom: 6 }}><span>{g.label}</span><span>{g.val}%</span></div>
                      <div style={{ height: 9, background: '#ecdfc9', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${g.val}%`, background: g.color, borderRadius: 6 }}></div></div>
                    </div>
                  ))}
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #ecdfc9' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#8a6f4d' }}>Overall orientation</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: session.accent || '#c98a3d', marginTop: 2 }}>{orientation.overall}</div>
                    <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 14, lineHeight: 1.5, color: '#6b573f', margin: '8px 0 0' }}>{orientation.note}</p>
                  </div>
                </div>
              </div>

              {/* themes */}
              <div style={{ marginTop: 26 }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d', marginBottom: 12 }}>Main sentiments &mdash; top themes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {themes.map((t: string, i: number) => (
                    <div key={i} style={{ background: '#fbf5ea', border: '1px solid #ecdfc9', borderLeft: `4px solid ${session.accent || '#c98a3d'}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#4a3728', maxWidth: 420 }}>{t}</div>
                  ))}
                </div>
              </div>

              {/* quotes */}
              <div style={{ marginTop: 30 }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d', marginBottom: 14 }}>In their words</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  {quotes.map((q: any, i: number) => (
                    <div key={i} style={{ background: '#fbf5ea', borderRadius: 16, padding: '24px 26px', boxShadow: '0 10px 26px rgba(60,40,20,.12)', position: 'relative' }}>
                      <div style={{ fontFamily: 'var(--font-newsreader)', fontSize: 32, color: session.accent || '#c98a3d', lineHeight: 0, height: 16 }}>&ldquo;</div>
                      <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 18, lineHeight: 1.55, color: '#4a3728', margin: '6px 0 0', textWrap: 'pretty' }}>{q.quote}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#8a6f4d' }}>&mdash; {q.profile}</div>
                        {q.has_audio && !q.audio_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: session.accent || '#c98a3d', color: '#fff', padding: '5px 12px', borderRadius: 20, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.05em' }}>&#9654; AUDIO CLIP</div>
                        )}
                      </div>
                      {q.audio_url && (
                        <audio controls src={q.audio_url} style={{ width: '100%', marginTop: 14, height: 36, borderRadius: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* you said we did */}
              {integrations.length > 0 && (
                <div style={{ marginTop: 34, background: '#4a3728', borderRadius: 20, padding: '30px 32px' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#e0b357' }}>You said &rarr; We did</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fbf5ea', marginTop: 4 }}>What we built because of this session</div>
                  <p style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 15, color: '#c9b191', margin: '6px 0 22px' }}>Each suggestion traced to exactly where it shaped the project.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {integrations.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1.1fr', gap: 0, alignItems: 'stretch', background: '#5c4632', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px' }}>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.14em', color: '#c9b191', textTransform: 'uppercase' }}>They said</div>
                          <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 16, lineHeight: 1.5, color: '#fbf5ea', margin: '6px 0 0' }}>&ldquo;{s.quote}&rdquo;</p>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#a58e6f', marginTop: 8 }}>&mdash; {s.voice || 'Participant'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0b357', fontSize: 22 }}>&rarr;</div>
                        <div style={{ padding: '18px 20px', background: '#fbf5ea' }}>
                          <div style={{ display: 'inline-block', background: s.project_areas?.color || '#8a7a5c', color: '#fff', padding: '4px 11px', borderRadius: 20, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.04em', fontWeight: 600 }}>{s.project_areas?.name}</div>
                          <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#4a3728', margin: '10px 0 0' }}>{s.integration_note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* photos + barriers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, marginTop: 26 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d', marginBottom: 12 }}>From the room</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {photos.map((p: any, i: number) => {
                      const isValidImage = p.storage_path && (p.storage_path.startsWith('data:') || p.storage_path.startsWith('http') || p.storage_path.startsWith('/'));
                      return (
                      <div key={i} style={{ flex: 1, minWidth: 190 }}>
                        <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: 'repeating-linear-gradient(45deg,#eaddc4,#eaddc4 12px,#e0d0b2 12px,#e0d0b2 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
                          {isValidImage ? (
                            <img src={p.storage_path} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="Session" />
                          ) : (
                            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.12em', color: '#9a7f57', textTransform: 'uppercase' }}>photo slot</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#8a6f4d', marginTop: 8, fontFamily: 'var(--font-newsreader)', fontStyle: 'italic' }}>{p.caption}</div>
                      </div>
                    )})}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d', marginBottom: 12 }}>Barriers most mentioned</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {barriers.map((b: string, i: number) => (
                      <span key={i} style={{ background: '#f2e4cb', color: '#6b573f', padding: '8px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 500 }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0', animation: 'fadeUp .4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, borderBottom: `3px solid ${session.accent || '#c98a3d'}`, paddingBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#a07b4d' }}>Session dashboard</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#4a3728', letterSpacing: '-.02em', lineHeight: 1.05 }}>{session.location}</div>
                <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 17, color: '#8a6f4d' }}>{session.tagline}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#5c4632' }}>
                <span style={{ background: '#fbf5ea', border: '1px solid #e3d3b6', padding: '6px 11px', borderRadius: 8 }}>{dateStr}</span>
                <span style={{ background: '#fbf5ea', border: '1px solid #e3d3b6', padding: '6px 11px', borderRadius: 8 }}>{session.participants} people</span>
                <span style={{ background: '#fbf5ea', border: '1px solid #e3d3b6', padding: '6px 11px', borderRadius: 8 }}>{session.population}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginTop: 18 }}>
              {/* gauges */}
              <div style={{ gridColumn: 'span 4', background: '#fbf5ea', borderRadius: 14, padding: '20px 22px', boxShadow: '0 10px 24px rgba(60,40,20,.1)' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>Orientation toward AI</div>
                {gauges.map((g: any, i: number) => (
                  <div key={i} style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#5c4632', marginBottom: 5 }}><span>{g.label}</span><span>{g.val}%</span></div>
                    <div style={{ height: 8, background: '#ecdfc9', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${g.val}%`, background: g.color }}></div></div>
                  </div>
                ))}
                <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: session.accent || '#c98a3d' }}>{orientation.overall}</div>
              </div>
              {/* themes */}
              <div style={{ gridColumn: 'span 8', background: '#fbf5ea', borderRadius: 14, padding: '20px 22px', boxShadow: '0 10px 24px rgba(60,40,20,.1)' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>Top themes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {themes.map((t: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: session.accent || '#c98a3d', flexShrink: 0, transform: 'translateY(-2px)' }}></span><span style={{ fontSize: 14.5, color: '#4a3728' }}>{t}</span></div>
                  ))}
                </div>
              </div>
              {/* narrative */}
              <div style={{ gridColumn: 'span 7', background: '#fbf5ea', borderRadius: 14, padding: '22px 24px', boxShadow: '0 10px 24px rgba(60,40,20,.1)' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>Narrative</div>
                <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 16, lineHeight: 1.6, color: '#4a3728', margin: '10px 0 0' }}>{session.narrative}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
                  {barriers.map((b: string, i: number) => (
                    <span key={i} style={{ background: '#f2e4cb', color: '#6b573f', padding: '5px 11px', borderRadius: 16, fontSize: 11.5 }}>{b}</span>
                  ))}
                </div>
              </div>
              {/* quotes */}
              <div style={{ gridColumn: 'span 5', background: '#fbf5ea', borderRadius: 14, padding: '22px 24px', boxShadow: '0 10px 24px rgba(60,40,20,.1)', maxHeight: 420, overflowY: 'auto' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>In their words</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                  {quotes.map((q: any, i: number) => (
                    <div key={i} style={{ borderLeft: `3px solid ${session.accent || '#c98a3d'}`, paddingLeft: 14 }}>
                      <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 15, lineHeight: 1.5, color: '#4a3728', margin: 0 }}>&ldquo;{q.quote}&rdquo;</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}><span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#8a6f4d' }}>&mdash; {q.profile}</span>{q.has_audio && !q.audio_url && <span style={{ background: session.accent || '#c98a3d', color: '#fff', padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9 }}>&#9654; AUDIO</span>}</div>
                      {q.audio_url && (
                        <audio controls src={q.audio_url} style={{ width: '100%', marginTop: 8, height: 32, borderRadius: 6 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* photos */}
              <div style={{ gridColumn: 'span 12', background: '#fbf5ea', borderRadius: 14, padding: '20px 22px', boxShadow: '0 10px 24px rgba(60,40,20,.1)' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>From the room</div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                  {photos.map((p: any, i: number) => (
                    <div key={i} style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: 'repeating-linear-gradient(45deg,#eaddc4,#eaddc4 12px,#e0d0b2 12px,#e0d0b2 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
                        {p.storage_path ? (
                          <img src={p.storage_path} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="Session" />
                        ) : (
                          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.12em', color: '#9a7f57', textTransform: 'uppercase' }}>photo slot</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#8a6f4d', marginTop: 8, fontFamily: 'var(--font-newsreader)', fontStyle: 'italic' }}>{p.caption}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* you said we did */}
              {integrations.length > 0 && (
                <div style={{ gridColumn: 'span 12', background: '#4a3728', borderRadius: 16, padding: '24px 26px' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e0b357' }}>You said &rarr; We did</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fbf5ea', margin: '3px 0 16px' }}>Suggestions traced to where they shaped the project</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {integrations.map((s: any, i: number) => (
                      <div key={i} style={{ background: '#5c4632', borderRadius: 12, padding: '16px 18px' }}>
                        <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 15, lineHeight: 1.45, color: '#fbf5ea', margin: 0 }}>&ldquo;{s.quote}&rdquo;</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}><span style={{ color: '#e0b357' }}>&rarr;</span><span style={{ display: 'inline-block', background: s.project_areas?.color || '#8a7a5c', color: '#fff', padding: '3px 10px', borderRadius: 16, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, fontWeight: 600 }}>{s.project_areas?.name}</span></div>
                        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: '#d9c6a8', margin: 0 }}>{s.integration_note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
