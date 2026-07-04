'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import OrnateFrame from './components/OrnateFrame';
import { useRouter } from 'next/navigation';

export default function ListeningWallClient({ sessions, isAdmin }: { sessions: any[], isAdmin?: boolean }) {
  const router = useRouter();
  const [introOpen, setIntroOpen] = useState(true);
  const [hoverFrame, setHoverFrame] = useState<number | null>(null);
  const [hoverCork, setHoverCork] = useState(false);
  const [hoverContinue, setHoverContinue] = useState(false);

  const participantTotal = sessions.reduce((sum, s) => sum + (s.participants || 0), 0);
  const sessionCount = sessions.length;

  const GRID_SLOTS = [
    { style: { position: 'absolute' as const, top: '6%', left: '2.5%', width: 'min(23%,26vh)' }, shape: 'arched' as const, aspect: '5/4', variant: 'walnut' as const, top: 'keystone' as const, corners: 'none' as const },
    { style: { position: 'absolute' as const, top: '6%', left: '26.5%', width: 'min(24%,28vh)' }, shape: 'rect' as const, aspect: '4/3', variant: 'crimson' as const, top: 'none' as const, corners: 'studs' as const },
    { style: { position: 'absolute' as const, top: '6%', left: '51%', width: 'min(25%,30vh)' }, shape: 'rect' as const, aspect: '16/10', variant: 'ebony' as const, top: 'crest' as const, corners: 'none' as const },
    { style: { position: 'absolute' as const, bottom: 110, left: '2.5%', width: 'min(23%,26vh)' }, shape: 'rect' as const, aspect: '4/3', variant: 'oak' as const, top: 'none' as const, corners: 'rosette' as const },
    { style: { position: 'absolute' as const, bottom: 110, left: '26.5%', width: 'min(24%,28vh)' }, shape: 'arched' as const, aspect: '5/4', variant: 'gold' as const, top: 'crest' as const, corners: 'none' as const },
    { style: { position: 'absolute' as const, bottom: 110, left: '51%', width: 'min(25%,30vh)' }, shape: 'rect' as const, aspect: '16/10', variant: 'walnut' as const, top: 'none' as const, corners: 'brackets' as const },
  ];

  const wallFrames = GRID_SLOTS.map((slot, i) => {
    const s = sessions[i];
    const zIndex = hoverFrame === i ? 40 : 6;
    
    if (s) {
      const people = Number(s.participants) || 0;
      return {
        ...slot,
        style: { ...slot.style, zIndex },
        title: s.location,
        date: s.session_date ? new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        caption: 'group photo',
        accent: s.accent || '#c98a3d',
        photo: s.cover_path || '',
        sub: (s.population ? s.population + ' · ' : '') + people + (people === 1 ? ' person' : ' people'),
        plate: s.location,
        tipAlign: (i % 3 === 0 ? 'left' as const : 'center' as const),
        empty: false,
        onClick: () => router.push(`/hub/community-listening/${s.slug || s.id}`),
        onHoverEnter: () => setHoverFrame(i),
        onHoverLeave: () => setHoverFrame(prev => prev === i ? null : prev),
      };
    }

    const n = String(i + 1).padStart(2, '0');
    return {
      ...slot,
      style: { ...slot.style, zIndex },
      title: '', date: '', caption: '', accent: '#a07b4d', sub: '',
      plate: 'Session ' + n, tipAlign: (i % 3 === 0 ? 'left' as const : 'center' as const), empty: true,
      onHoverEnter: () => setHoverFrame(i),
      onHoverLeave: () => setHoverFrame(prev => prev === i ? null : prev),
    };
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f6d9b2', backgroundImage: 'linear-gradient(178deg,#f6d9b2 0%,#f2cb9c 48%,#eec091 100%)', color: '#4a3728' }}>
      
      {/* TOP BAR */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '15px 34px', borderBottom: '1px solid rgba(122,90,52,.24)', position: 'relative', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Link href="/hub" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a86c28', fontWeight: 600 }}>&larr; Back to Hub</Link>
          <div style={{ width: 1, height: 34, background: 'rgba(122,90,52,.22)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: 7, background: 'linear-gradient(150deg,#c99a3f,#8a5a24)', boxShadow: 'inset 0 0 0 2px rgba(255,244,214,.32), 0 3px 7px rgba(60,40,20,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 14, height: 18, background: '#f7efe0', borderRadius: 1 }}></div></div>
            <div>
              <div style={{ fontFamily: 'var(--font-baloo)', fontWeight: 800, fontSize: 20, lineHeight: 1, color: '#4a3728' }}>Community Listening</div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: '#a07b4d', marginTop: 3 }}>Feedback Sessions</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/hub/community-listening/you-said" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, border: '1.5px solid #a86c28', color: '#8a5a24', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, transition: 'background .2s ease' }} className="hover:bg-[#a86c2817]">&#9733; You Said &rarr; We Did</Link>
          <Link href="/hub/community-listening/submit" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: 'linear-gradient(180deg,#a86c28,#8a5423)', color: '#f7efe0', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, boxShadow: '0 5px 14px rgba(120,74,30,.34)', transition: 'filter .2s ease' }} className="hover:brightness-110">+ Share your thoughts</Link>
        </div>
      </div>

      {/* INTRO */}
      <div style={{ flex: 'none', position: 'relative', zIndex: 20 }}>
        {introOpen ? (
          <div style={{ textAlign: 'center', padding: '18px 24px 12px', position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#b1852f', fontWeight: 600 }}>Imperial County &middot; Colonias &middot; The Salton Sea Bioregion</div>
            <div style={{ fontFamily: 'var(--font-baloo)', fontWeight: 800, fontSize: 40, lineHeight: 1.02, color: '#3a2a1e', marginTop: 5 }}>The Listening Wall</div>
            <p style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 15.5, lineHeight: 1.5, color: '#6b573f', maxWidth: 660, margin: '10px auto 0', textWrap: 'pretty' }}>A wall of the communities we sat with. Step up to a frame to hear what a session said &mdash; or leave your own reflection at the recorder in the corner.</p>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a07b4d', marginTop: 11 }}>{sessionCount} Sessions &middot; {participantTotal} Voices Gathered</div>
            <div onClick={() => setIntroOpen(false)} title="Minimize" style={{ position: 'absolute', top: 12, right: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 20, border: '1px solid rgba(122,90,52,.3)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a07b4d', background: 'rgba(255,247,231,.6)' }} className="hover:bg-[rgba(255,247,231,.95)]">Minimize &#9650;</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '10px 24px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-baloo)', fontWeight: 800, fontSize: 19, color: '#3a2a1e' }}>The Listening Wall</span>
            <span style={{ width: 1, height: 18, background: 'rgba(122,90,52,.28)' }}></span>
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a07b4d' }}>{sessionCount} Sessions &middot; {participantTotal} Voices Gathered</span>
            <div onClick={() => setIntroOpen(true)} title="Expand" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(122,90,52,.3)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a07b4d', background: 'rgba(255,247,231,.6)' }} className="hover:bg-[rgba(255,247,231,.95)]">Expand &#9660;</div>
          </div>
        )}
      </div>

      {/* WALL ROOM */}
      <div style={{ position: 'relative', flex: 1, minHeight: 470, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* wallpaper */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#e7d5b2', backgroundImage: 'radial-gradient(circle at 14px 14px, rgba(150,108,58,.09) 2px, transparent 3px), radial-gradient(circle at 42px 42px, rgba(150,108,58,.07) 2px, transparent 3px), linear-gradient(90deg, rgba(120,84,44,.035) 1px, transparent 1px)', backgroundSize: '56px 56px, 56px 56px, 28px 28px', boxShadow: 'inset 0 44px 90px rgba(120,84,44,.16), inset 0 -18px 60px rgba(120,84,44,.12)' }}></div>
          
          {/* baseboard + floor */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, height: 9, background: 'linear-gradient(180deg,#8a5f34,#6b4526)', boxShadow: '0 3px 8px rgba(40,26,12,.28)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: 'repeating-linear-gradient(90deg,#bd8d55 0 46px,#b3844c 46px 49px), linear-gradient(180deg,#c1955f,#a97a45)', zIndex: 1 }}></div>

          {/* SALON WALL — data-driven from sessions */}
          {wallFrames.map((f, i) => (
            <OrnateFrame key={i} {...f} />
          ))}

          {/* corkboard: you said we did */}
          <div onClick={() => router.push('/hub/community-listening/you-said')} onMouseEnter={() => setHoverCork(true)} onMouseLeave={() => setHoverCork(false)} style={{ position: 'absolute', right: '3%', top: '4.5%', width: '23%', cursor: 'pointer', zIndex: 5, transition: 'transform .28s ease, filter .28s ease', transform: hoverCork ? 'translateY(-6px)' : 'none', filter: hoverCork ? 'drop-shadow(0 20px 24px rgba(40,26,12,.36))' : 'none' }}>
            <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 13, height: 13, borderRadius: '50%', background: 'radial-gradient(circle at 4px 4px,#ff9686,#c0392b)', boxShadow: '0 3px 5px rgba(0,0,0,.4)', zIndex: 3 }}></div>
            <div style={{ backgroundColor: '#c8a066', backgroundImage: 'radial-gradient(circle at 5px 5px, rgba(120,80,40,.2) 1px, transparent 2px)', backgroundSize: '11px 11px', border: '9px solid #6b4526', borderRadius: 5, padding: '18px 15px 26px', position: 'relative', boxShadow: '0 14px 26px rgba(40,26,12,.34), inset 0 0 26px rgba(90,58,34,.36)' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.14em', color: '#4a3728', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: 13 }}>You Said &rarr; We Did</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {/* Simulated sticky notes */}
                <div style={{ width: '43%', height: 54, background: '#f0dd7e', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(-4deg)', padding: '9px 8px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#c0392b', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '88%', background: 'rgba(90,70,20,.4)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '70%', background: 'rgba(90,70,20,.32)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '80%', background: 'rgba(90,70,20,.32)', borderRadius: 2 }}></div>
                </div>
                <div style={{ width: '43%', height: 54, background: '#f0a9bf', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(3deg)', padding: '9px 8px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#2f6f8f', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '82%', background: 'rgba(90,40,55,.38)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '64%', background: 'rgba(90,40,55,.3)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '76%', background: 'rgba(90,40,55,.3)', borderRadius: 2 }}></div>
                </div>
                <div style={{ width: '43%', height: 50, background: '#9cc9dc', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(2deg)', padding: '9px 8px', position: 'relative', marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#c0392b', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '86%', background: 'rgba(30,60,80,.38)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '68%', background: 'rgba(30,60,80,.3)', borderRadius: 2 }}></div>
                </div>
                <div style={{ width: '43%', height: 50, background: '#a9d29a', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(-3deg)', padding: '9px 8px', position: 'relative', marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#7a5a24', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '84%', background: 'rgba(40,70,30,.38)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '72%', background: 'rgba(40,70,30,.3)', borderRadius: 2 }}></div>
                </div>
                <div style={{ width: '43%', height: 54, background: '#f0c99a', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(2.5deg)', padding: '9px 8px', position: 'relative', marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#2f6f8f', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '86%', background: 'rgba(90,60,20,.38)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '66%', background: 'rgba(90,60,20,.3)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '78%', background: 'rgba(90,60,20,.3)', borderRadius: 2 }}></div>
                </div>
                <div style={{ width: '43%', height: 50, background: '#cbb8e0', borderRadius: 1, boxShadow: '0 4px 8px rgba(0,0,0,.22)', transform: 'rotate(-2.5deg)', padding: '9px 8px', position: 'relative', marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: '#c0392b', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }}></div>
                  <div style={{ height: 2, width: '82%', background: 'rgba(60,40,80,.38)', borderRadius: 2, marginBottom: 6 }}></div>
                  <div style={{ height: 2, width: '70%', background: 'rgba(60,40,80,.3)', borderRadius: 2 }}></div>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 9, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 11.5, color: '#4a3728' }}>See how we answered</div>
            </div>
            <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translate(-50%,100%)', background: '#3a2a1e', color: '#f7efe0', padding: '7px 12px', borderRadius: 9, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, whiteSpace: 'nowrap', opacity: hoverCork ? 1 : 0, transition: 'opacity .2s ease', pointerEvents: 'none', boxShadow: '0 10px 20px rgba(0,0,0,.3)', zIndex: 14 }}>SEE HOW WE ANSWERED &rarr;</div>
          </div>

          {/* dresser with recorder + plant */}
          <div style={{ position: 'absolute', right: '1%', bottom: 10, width: '25%', zIndex: 7 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 7% 0 5%', marginBottom: -3 }}>
              
              {/* potted plant */}
              <div style={{ width: 80, position: 'relative' }}>
                <div style={{ position: 'relative', height: 64, marginBottom: -3 }}>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 16, height: 60, marginLeft: -8, background: 'linear-gradient(180deg,#6ea24f,#48763a)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 14, height: 52, marginLeft: -7, background: 'linear-gradient(180deg,#7cae57,#548440)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(-30deg)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 14, height: 52, marginLeft: -7, background: 'linear-gradient(180deg,#7cae57,#548440)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(30deg)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 13, height: 44, marginLeft: -6.5, background: 'linear-gradient(180deg,#86bb63,#5e8f45)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(-52deg)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 13, height: 44, marginLeft: -6.5, background: 'linear-gradient(180deg,#86bb63,#5e8f45)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(52deg)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 11, height: 34, marginLeft: -5.5, background: 'linear-gradient(180deg,#95c76f,#6b9a4e)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(-72deg)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 11, height: 34, marginLeft: -5.5, background: 'linear-gradient(180deg,#95c76f,#6b9a4e)', borderRadius: '50% 50% 45% 45%', transformOrigin: 'bottom center', transform: 'rotate(72deg)' }}></div>
                </div>
                <div style={{ width: 52, height: 38, margin: '0 auto', background: 'linear-gradient(180deg,#c86a3a,#9c4a24)', boxShadow: 'inset 0 3px 4px rgba(255,220,170,.3), inset 0 -4px 6px rgba(0,0,0,.28), 0 6px 10px rgba(0,0,0,.28)', clipPath: 'polygon(6% 0,94% 0,84% 100%,16% 100%)', borderRadius: '0 0 5px 5px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: '-3%', width: '106%', height: 8, background: 'linear-gradient(180deg,#d67a48,#a85228)', borderRadius: 3, boxShadow: '0 2px 3px rgba(0,0,0,.2)' }}></div>
                </div>
              </div>

              {/* audio recorder */}
              <div onClick={() => router.push('/hub/community-listening/submit')} onMouseEnter={() => setHoverContinue(true)} onMouseLeave={() => setHoverContinue(false)} style={{ width: 48, cursor: 'pointer', position: 'relative', transition: 'transform .25s ease, filter .25s ease', zIndex: 9, transform: hoverContinue ? 'translateY(-7px)' : 'none', filter: hoverContinue ? 'drop-shadow(0 12px 15px rgba(40,26,12,.42))' : 'none' }}>
                <div style={{ background: 'linear-gradient(160deg,#3d434a,#22262b)', borderRadius: '8px 8px 6px 6px', padding: '6px 5px 8px', boxShadow: '0 8px 14px rgba(0,0,0,.4), inset 0 1px 2px rgba(255,255,255,.13)', border: '1px solid #14161a' }}>
                  <div style={{ width: 22, height: 14, margin: '0 auto 5px', borderRadius: '6px 6px 3px 3px', background: 'radial-gradient(circle at 3px 3px,#5c636b 1px,transparent 1.5px) 0 0/5px 5px, linear-gradient(180deg,#4a4f56,#2a2d32)', boxShadow: 'inset 0 0 0 1px #1a1c20' }}></div>
                  <div style={{ height: 15, borderRadius: 2, background: 'linear-gradient(180deg,#96d9c9,#5aa596)', boxShadow: 'inset 0 0 3px rgba(0,0,0,.45)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d33b28', boxShadow: '0 0 4px rgba(211,59,40,.95)' }}></span>
                    <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 7, letterSpacing: '.13em', color: '#173029', fontWeight: 700 }}>REC</span>
                  </div>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', margin: '0 auto', background: 'radial-gradient(circle at 3px 3px,#ff9686,#d33b28)', boxShadow: '0 0 7px rgba(211,59,40,.75)' }}></div>
                </div>
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translate(-50%,-100%)', background: '#b06a4a', color: '#f7efe0', padding: '7px 11px', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, whiteSpace: 'nowrap', opacity: hoverContinue ? 1 : 0, transition: 'opacity .2s ease', pointerEvents: 'none', boxShadow: '0 8px 16px rgba(0,0,0,.32)', zIndex: 16 }}>SHARE YOUR THOUGHTS &rarr;</div>
              </div>

              {/* glowing color-shifting lamp */}
              <div style={{ width: 56, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 8 }}>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 66, height: 70, borderRadius: '50%', filter: 'blur(8px)', pointerEvents: 'none', animation: 'lampHalo 15s linear infinite', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 6, height: 9, borderRadius: '50% 50% 40% 40%', background: 'linear-gradient(180deg,#e4cf96,#a8802f)', zIndex: 3, boxShadow: '0 1px 2px rgba(0,0,0,.35)' }}></div>
                <div style={{ position: 'relative', zIndex: 2, width: 52, height: 34, borderRadius: '26px 26px 8px 8px', animation: 'lampGlow 15s linear infinite' }}></div>
                <div style={{ width: 30, height: 4, borderRadius: 3, background: 'linear-gradient(180deg,#dcbb79,#9a763a)', zIndex: 2, boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div>
                <div style={{ width: 5, height: 26, background: 'linear-gradient(90deg,#7a5a2e,#c8a25c 45%,#7a5a2e)', borderRadius: 2, zIndex: 1 }}></div>
                <div style={{ width: 34, height: 11, borderRadius: '50%', background: 'linear-gradient(180deg,#caa869,#8a6636)', boxShadow: '0 5px 8px rgba(0,0,0,.3), inset 0 1px 2px rgba(255,235,190,.4)', zIndex: 1 }}></div>
              </div>
            </div>

            {/* dresser body */}
            <div style={{ position: 'relative', background: 'repeating-linear-gradient(90deg, rgba(30,16,6,.08) 0 3px, transparent 3px 9px), linear-gradient(180deg,#8a5a30,#6b4322)', borderRadius: '7px 7px 4px 4px', padding: 10, boxShadow: '0 20px 32px rgba(40,26,12,.42), inset 0 2px 3px rgba(255,220,170,.22)' }}>
              <div style={{ height: 11, background: 'linear-gradient(180deg,#9c6738,#7a4f2a)', borderRadius: '5px 5px 2px 2px', margin: '-10px -10px 9px', boxShadow: '0 3px 5px rgba(0,0,0,.26)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 32, background: 'linear-gradient(180deg,#754a28,#5c391d)', borderRadius: 4, boxShadow: 'inset 0 1px 2px rgba(255,220,170,.22), inset 0 -3px 5px rgba(0,0,0,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 26, height: 8, borderRadius: 5, background: 'linear-gradient(180deg,#e4c574,#a8802f)', boxShadow: '0 2px 3px rgba(0,0,0,.34)' }}></div></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, height: 32, background: 'linear-gradient(180deg,#754a28,#5c391d)', borderRadius: 4, boxShadow: 'inset 0 1px 2px rgba(255,220,170,.22), inset 0 -3px 5px rgba(0,0,0,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 9, height: 9, borderRadius: '50%', background: 'linear-gradient(180deg,#e4c574,#a8802f)', boxShadow: '0 2px 3px rgba(0,0,0,.34)' }}></div></div>
                  <div style={{ flex: 1, height: 32, background: 'linear-gradient(180deg,#754a28,#5c391d)', borderRadius: 4, boxShadow: 'inset 0 1px 2px rgba(255,220,170,.22), inset 0 -3px 5px rgba(0,0,0,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 9, height: 9, borderRadius: '50%', background: 'linear-gradient(180deg,#e4c574,#a8802f)', boxShadow: '0 2px 3px rgba(0,0,0,.34)' }}></div></div>
                </div>
                <div style={{ height: 32, background: 'linear-gradient(180deg,#754a28,#5c391d)', borderRadius: 4, boxShadow: 'inset 0 1px 2px rgba(255,220,170,.22), inset 0 -3px 5px rgba(0,0,0,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 26, height: 8, borderRadius: 5, background: 'linear-gradient(180deg,#e4c574,#a8802f)', boxShadow: '0 2px 3px rgba(0,0,0,.34)' }}></div></div>
              </div>
              <div style={{ position: 'absolute', bottom: -9, left: '9%', width: 16, height: 11, background: '#4a3018', borderRadius: '0 0 4px 4px', boxShadow: '0 4px 6px rgba(0,0,0,.3)' }}></div>
              <div style={{ position: 'absolute', bottom: -9, right: '9%', width: 16, height: 11, background: '#4a3018', borderRadius: '0 0 4px 4px', boxShadow: '0 4px 6px rgba(0,0,0,.3)' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ================= BOTTOM BAR ================= */}
      {isAdmin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px', background: 'linear-gradient(180deg,rgba(74,55,40,0) 0%, rgba(74,55,40,.06) 100%)', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', gap: 0, background: '#3a2a1e', padding: 5, borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,.22)', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.14em', color: '#b89a72', padding: '0 10px 0 6px' }}>PREVIEW AS</span>
              <div style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'default', background: '#e0b357', color: '#3a2a1e' }}>Public</div>
              <div onClick={() => router.push('/admin/community-listening')} style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#e6d3b3' }}>Admin</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
