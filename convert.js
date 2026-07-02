const fs = require('fs');

const html = fs.readFileSync('Stewardworks CozyHub UI (New)/StewardWorks Cozy Hub.dc.html', 'utf8');
const startIdx = html.indexOf('<div style="{{ outerStyle }}">');
const endIdx = html.indexOf('</x-dc>');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find boundaries');
  process.exit(1);
}

let template = html.substring(startIdx, endIdx);

// 1. Convert style="{{ var }}" to style={var}
template = template.replace(/style="\{\{ (.*?) \}\}"/g, 'style={$1}');

// 2. Convert raw style="..." to style={{...}}
template = template.replace(/style="([^"]*)"/g, (match, css) => {
  if (css.includes('{{')) return match; // skip mixed bindings if any
  const parts = css.split(';').filter(p => p.trim() !== '');
  const obj = {};
  for (const p of parts) {
    const splitIdx = p.indexOf(':');
    if (splitIdx === -1) continue;
    const k = p.substring(0, splitIdx).trim();
    let v = p.substring(splitIdx + 1).trim();
    const camelK = k.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    obj[camelK] = v;
  }
  return 'style={' + JSON.stringify(obj) + '}';
});

// 2.5 Convert style-hover="..." to CSS classes
let hoverStyles = [];
let hoverCounter = 0;
template = template.replace(/style-hover="([^"]*)"/g, (match, css) => {
  hoverCounter++;
  const className = `sw-hover-${hoverCounter}`;
  hoverStyles.push(`.${className}:hover { ${css} !important; }`);
  return `className="${className}"`;
});

// 3. Convert sc-if
template = template.replace(/<sc-if value="\{\{ (.*?) \}\}"[^>]*>/g, '{ $1 && (\n<>');
template = template.replace(/<\/sc-if>/g, '</>\n)}');

// 4. Convert event handlers="{{ func }}" to handler={func}
template = template.replace(/on(Click|MouseEnter|MouseLeave)="\{\{ (.*?) \}\}"/g, 'on$1={$2}');

// 5. Convert class= to className=
template = template.replace(/ class="/g, ' className="');

// 6. Convert self-closing tags like img and input
template = template.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');

// 7. Convert text bindings {{ var }} to {var}
template = template.replace(/\{\{ (.*?) \}\}/g, '{$1}');

// 7.5. Fix image paths to be absolute (leading slash)
template = template.replace(/src="assets\//g, 'src="/assets/');

// 8. Convert HTML comments to JSX comments
template = template.replace(/<!--(.*?)-->/gs, '{/* $1 */}');
template = template.replace(/showAdmin/g, 'isAdmin');
// 9. Fix some attribute casing (like tabindex)
// React uses tabIndex, etc. but let's hope there's not many.

// We need to inject this into CozyHubRoom.tsx.
const componentHeader = `
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CozyHubRoomProps {
  isAdmin?: boolean;
  avatarUrl?: string | null;
  onLogout?: () => void;
}

export default function CozyHubRoom({ isAdmin = true, avatarUrl, onLogout }: CozyHubRoomProps) {
  const router = useRouter();
  
  const [screen, setScreen] = useState<'hub' | 'monitor' | 'meditation' | 'progress' | 'bridge' | 'loggedout' | 'navigating'>('hub');
  const [hovered, setHovered] = useState<string | null>(null);
  
  // State from DCLogic
  const [progress, setProgress] = useState(35);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'dusk' | 'night'>('day');
  const [exitStyle, setExitStyle] = useState('neon');

  const [scale, setScale] = useState(1);
  const [bridgeId, setBridgeId] = useState<string | null>(null);
  
  const [medTotal, setMedTotal] = useState(300);
  const [medLeft, setMedLeft] = useState(300);
  const [medRunning, setMedRunning] = useState(false);
  const [medTheme, setMedTheme] = useState(0);
  const [medTone, setMedTone] = useState(false);
  
  const [lampIndex, setLampIndex] = useState(0);

  const _timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try { const p = localStorage.getItem('sw_progress'); if (p !== null && !isNaN(parseInt(p))) setProgress(Math.max(0, Math.min(100, parseInt(p)))); } catch (e) {}
    try { const t = localStorage.getItem('sw_timeofday') as 'day'|'dusk'|'night'; if (t) setTimeOfDay(t); } catch (e) {}
    try { const ex = localStorage.getItem('sw_exit'); if (ex) setExitStyle(ex); } catch (e) {}
    
    const handleResize = () => { const s = Math.min(window.innerWidth / 1300, window.innerHeight / 700); setScale(s); };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const lampTimer = setInterval(() => {
      setLampIndex(st => st + 1);
    }, 300000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(lampTimer);
    };
  }, []);

  const persist = (k: string, v: string) => { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  const setProg = (v: number) => { v = Math.max(0, Math.min(100, Math.round(v))); setProgress(v); persist('sw_progress', String(v)); }
  const incProg = () => setProg(progress + 5);
  const decProg = () => setProg(progress - 5);
  const setTime = (t: 'day'|'dusk'|'night') => { setTimeOfDay(t); persist('sw_timeofday', t); }
  const setExit = (x: string) => { setExitStyle(x); persist('sw_exit', x); }

  const setDay = () => setTime('day');
  const setDusk = () => setTime('dusk');
  const setNight = () => setTime('night');
  const setNeon = () => setExit('neon');
  const setWood = () => setExit('wood');

  const open = (d: any) => {
    if (d.kind === 'monitor') return setScreen('monitor');
    if (d.kind === 'meditation') return setScreen('meditation');
    if (d.kind === 'progress') return setScreen('progress');
    if (d.id === 'logout') {
      if (typeof onLogout === 'function') onLogout();
      else { setScreen('loggedout'); setBridgeId(null); setHovered(null); }
      return;
    }
    const route = bridges[d.id]?.route;
    if (route) {
      setScreen('navigating');
      router.push(route);
    } else {
      setScreen('bridge');
      setBridgeId(d.id);
    }
  }
  
  const goHub = () => { pauseMed(); setScreen('hub'); setBridgeId(null); setHovered(null); }
  const openBridge = (id: string) => { 
    const route = bridges[id]?.route;
    if (route) {
      setScreen('navigating');
      router.push(route);
    } else {
      setScreen('bridge'); setBridgeId(id); setHovered(null); 
    }
  }
  const openPilot = () => openBridge('pilot');
  const openAi = () => openBridge('ailab');
  const openWf = () => openBridge('workforce');

  const fmt = (sec: number) => { const m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  const setMed = (total: number) => { pauseMed(); setMedTotal(total); setMedLeft(total); }
  const toggleMed = () => { if (medRunning) pauseMed(); else startMed(); }
  const startMed = () => {
    if (medLeft <= 0) setMedLeft(medTotal);
    setMedRunning(true);
    if (_timer.current) clearInterval(_timer.current);
    _timer.current = setInterval(() => {
      setMedLeft(left => {
        const next = left - 1;
        if (next <= 0) { if (_timer.current) clearInterval(_timer.current); setMedRunning(false); return 0; }
        return next;
      });
    }, 1000);
  }
  const pauseMed = () => { if (_timer.current) clearInterval(_timer.current); setMedRunning(false); }
  const medReset = () => { pauseMed(); setMedLeft(medTotal); }
  
  const med1 = () => setMed(60);
  const med5 = () => setMed(300);
  const med10 = () => setMed(600);
  const medToggle = toggleMed;
  const medTheme0 = () => setMedTheme(0);
  const medTheme1 = () => setMedTheme(1);
  const medTheme2 = () => setMedTheme(2);
  const medTheme3 = () => setMedTheme(3);
  const medToneToggle = () => setMedTone(!medTone); // simplified audio

  const s = { timeOfDay, progress, exitStyle, screen, bridgeId, medRunning, medTone, lampIndex, medLeft, medTheme };

  const defs = [
    { id: 'profile', label: 'My Profile', kind: 'bridge' },
    { id: 'library', label: 'Steward Library', kind: 'bridge' },
    { id: 'env', label: 'Environmental Literacy', kind: 'bridge' },
    { id: 'monitor', label: 'Workshops · AI Lab · Workforce', kind: 'monitor' },
    { id: 'community', label: 'Community Listening', kind: 'bridge' },
    { id: 'wellness', label: 'Wellness & Meditation', kind: 'meditation' },
    { id: 'progress', label: 'Progress & Generations', kind: 'progress' },
    { id: 'helpdesk', label: 'Help Desk', kind: 'bridge' },
    { id: 'logout', label: 'Log Out', kind: 'logout' },
    { id: 'admin', label: 'Admin Console', kind: 'bridge' },
  ];
  
  const o: any = {};
  defs.forEach(d => { o[d.id] = { enter: () => setHovered(d.id), click: () => open(d), show: hovered === d.id }; });
  const leave = () => setHovered(null);

  const walls = { day: ['#F8CDA6', '#EFAE84'], dusk: ['#E7A07E', '#B97C68'], night: ['#5E5070', '#3C3450'] };
  const w = walls[timeOfDay] || walls.day;
  const tintMap = {
    day: { background: 'transparent' },
    dusk: { background: 'linear-gradient(180deg, rgba(120,60,90,.12), rgba(60,40,80,.22))' },
    night: { background: 'linear-gradient(180deg, rgba(20,20,60,.42), rgba(10,10,40,.56))' },
  };
  const lampGlow = timeOfDay === 'night' ? 0.95 : timeOfDay === 'dusk' ? 0.6 : 0.32;

  const chia = 10 + (progress / 100) * 70;
  const chiaBig = 24 + (progress / 100) * 96;

  const bridges: Record<string, any> = {
    profile: { title: 'My Profile', route: '/hub/my-profile', blurb: 'Your portrait on the wall. Opens your profile — onboarding photo, learner type, dream job, and saved settings.' },
    library: { title: 'Steward Library', route: '/hub/library', blurb: 'The shelf of books. Opens the Resource Hub — curated readings, guides, and lessons.' },
    env: { title: 'Environmental Literacy', route: '/hub/environmental-literacy', blurb: 'The window to the Salton Sea. Opens environmental literacy modules and local ecology.' },
    community: { title: 'Community Listening', route: '/hub/community-listening', blurb: 'The framed group photo on the desk. Opens community listening sessions and event sign-ups.' },
    helpdesk: { title: 'Help Desk', route: '/hub/helpdesk', blurb: 'The lamp that lights the desk. Opens help, FAQs, and the support bulletin.' },
    admin: { title: 'Admin Console', route: '/admin', blurb: 'A quiet key on the wall, visible only to admins. Opens user management and settings.' },
    logout: { title: 'Log Out', route: '/login', blurb: 'The EXIT sign on the wall. Signs you out of StewardWorks and returns you to the login screen.' },
    pilot: { title: 'Pilot Workshops', route: '/hub/pilot-workshops', blurb: 'Hands-on workshop modules — bilingual media and intro to AI content.' },
    ailab: { title: 'AI Lab', route: '/hub/ai-lab', blurb: 'Experiment with AI tools for content creation and learning.' },
    workforce: { title: 'Workforce Development', route: '/hub/workforce-pathways', blurb: 'Your career roadmap and pathways into environmental work.' },
  };
  const bridge = bridges[bridgeId || 'profile'] || bridges.profile;
  const subIds = ['pilot', 'ailab', 'workforce'];

  const medThemes = [
    { name: 'Desert Dawn', bg: 'radial-gradient(circle at 50% 42%, #F7CDA6 0%, #DB9B2F 55%, #A27532 100%)', ring: 'rgba(255,250,224,.5)', text: '#3A2A12' },
    { name: 'Salton Dusk', bg: 'radial-gradient(circle at 50% 42%, #E7A07E 0%, #B97C68 45%, #5A4A6A 100%)', ring: 'rgba(255,255,255,.4)', text: '#FBEAD8' },
    { name: 'Sage Calm', bg: 'radial-gradient(circle at 50% 45%, #9DB39A 0%, #4D6B57 55%, #2D4B3E 100%)', ring: 'rgba(255,255,255,.35)', text: '#EAF0E6' },
    { name: 'Night Field', bg: 'radial-gradient(circle at 50% 40%, #4A5A6E 0%, #2A3340 55%, #21282E 100%)', ring: 'rgba(253,221,154,.3)', text: '#E6ECF2' },
  ];
  const mt = medThemes[medTheme] || medThemes[0];

  const cc = ['#e0d4f2', '#c3b0e4', '#9f86cf'];
  const c0 = cc[0], c1 = cc[1], c2 = cc[2];
  const curtainTex = 'repeating-linear-gradient(90deg,rgba(70,48,110,.28) 0 4px,rgba(70,48,110,.10) 8px,rgba(238,228,252,.26) 12px,rgba(70,48,110,.12) 16px,rgba(70,48,110,.28) 20px)';
  const curtainBaseL = \`linear-gradient(90deg,\${c2} 0%,\${c1} 26%,\${c0} 52%,\${c1} 76%,\${c2} 100%)\`;
  const curtainBaseR = \`linear-gradient(270deg,\${c2} 0%,\${c1} 26%,\${c0} 52%,\${c1} 76%,\${c2} 100%)\`;

  const lampTones = [
    { light: '#fff4e2', mid: '#ffe2bd', glow: '255,210,140' },
    { light: '#ffeef4', mid: '#ffd2e6', glow: '255,176,206' },
    { light: '#f4eeff', mid: '#ddccff', glow: '196,166,255' },
    { light: '#e9fbf2', mid: '#c8f0db', glow: '150,222,184' },
    { light: '#eaf4ff', mid: '#cfe4ff', glow: '156,198,255' },
    { light: '#fff0ea', mid: '#ffd8c6', glow: '255,184,150' },
  ];
  const lt = lampTones[lampIndex % lampTones.length];

  const outerStyle = { position: 'fixed' as const, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: \`linear-gradient(180deg, \${w[0]} 0%, \${w[0]} 46%, #6a3a22 70%, #532b18 100%)\` };
  const stageStyle = { position: 'relative' as const, width: '1300px', height: '700px', flex: 'none', transformOrigin: 'center center', boxShadow: '0 40px 120px rgba(0,0,0,.5)', overflow: 'hidden', transform: \`scale(\${scale})\` };
  const wallStyle = { position: 'absolute' as const, inset: 0, zIndex: 0, background: \`linear-gradient(180deg, \${w[0]} 0%, \${w[1]} 100%)\` };
  const tint = { position: 'absolute' as const, inset: 0, zIndex: 1, pointerEvents: 'none' as const, transition: 'background .9s ease', background: (tintMap[timeOfDay] || tintMap.day).background };
  
  const envPhotoStyle = { position: 'absolute' as const, inset: 0, backgroundImage: \`url('\${({ day: '/assets/sea-day.jpg', dusk: '/assets/sea-sunset.jpg', night: '/assets/sea-night-pink2.jpg' })[timeOfDay] || '/assets/sea-day.jpg'}')\`, backgroundSize: 'cover', backgroundPosition: ({ day: 'center 27%', dusk: 'center', night: 'center' })[timeOfDay] || 'center', transition: 'opacity .6s ease' };
  
  const curtainLeftStyle = { position: 'absolute' as const, left: '16px', top: '13px', bottom: '13px', width: '74px', backgroundImage: curtainTex + ',' + curtainBaseL, borderRadius: '3px 10px 10px 3px', clipPath: 'polygon(0 0,100% 0,100% 43%,62% 50%,100% 57%,100% 100%,0 100%)', boxShadow: 'inset -11px 0 22px rgba(80,56,128,.4),0 4px 9px rgba(60,42,100,.3)', pointerEvents: 'none' as const, zIndex: 2, opacity: 0.82 };
  const curtainRightStyle = { position: 'absolute' as const, right: '16px', top: '13px', bottom: '13px', width: '74px', backgroundImage: curtainTex + ',' + curtainBaseR, borderRadius: '10px 3px 3px 10px', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,0 57%,38% 50%,0 43%)', boxShadow: 'inset 11px 0 22px rgba(80,56,128,.4),0 4px 9px rgba(60,42,100,.3)', pointerEvents: 'none' as const, zIndex: 2, opacity: 0.82 };
  
  const lampOrbStyle = { position: 'absolute' as const, left: '50%', top: '64px', width: '66px', height: '66px', transform: 'translateX(-50%)', borderRadius: '50%', background: \`radial-gradient(circle at 42% 38%, #fffdf4, \${lt.light} 50%, \${lt.mid} 100%)\`, boxShadow: \`0 0 26px 8px rgba(\${lt.glow},.85),0 0 60px 18px rgba(\${lt.glow},.5)\`, transition: 'background 1.6s ease, box-shadow 1.6s ease', animation: 'sw-lamppulse 5s ease-in-out infinite' };
  const lampGlowStyle = { position: 'absolute' as const, left: '60px', bottom: '70px', width: '420px', height: '360px', zIndex: 6, pointerEvents: 'none' as const, background: \`radial-gradient(circle at 40% 50%, rgba(\${lt.glow},.5), rgba(\${lt.glow},0) 65%)\`, transition: 'opacity .9s ease, background 1.6s ease', animation: 'sw-lamppulse 5s ease-in-out infinite', opacity: lampGlow };
  
  const chiaStyle = { position: 'absolute' as const, left: '50%', bottom: '168px', width: '56px', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', transition: 'height .5s ease', overflow: 'visible', height: chia + 'px' };
  const chiaBigStyle = { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', transition: 'height .5s ease', marginBottom: '6px', height: chiaBig + 'px' };
  const progressPct = progress + '%';
  const progressBarStyle = { height: '100%', background: 'linear-gradient(90deg,#6B8E23,#A27532)', borderRadius: '10px', transition: 'width .5s ease', width: progress + '%' };
  
  const medBgStyle = { position: 'fixed' as const, inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', transition: 'background .8s ease', animation: 'sw-fade .3s ease', background: mt.bg };
  const medRingStyle = { position: 'absolute' as const, width: '240px', height: '240px', borderRadius: '50%', background: \`radial-gradient(circle, \${mt.ring}, rgba(255,255,255,.05))\`, animation: 'sw-breathe 9s ease-in-out infinite' };
  const medHeadStyle = { textAlign: 'center' as const, marginBottom: '8px', color: mt.text };
  const medTimerStyle = { position: 'relative' as const, textAlign: 'center' as const, color: mt.text };
  
  const isHub = screen === 'hub';
  const isMonitor = screen === 'monitor';
  const isMeditation = screen === 'meditation';
  const isProgress = screen === 'progress';
  const isBridge = screen === 'bridge';
  const isLoggedOut = screen === 'loggedout';
  const isNavigating = screen === 'navigating';
  const isNeon = exitStyle === 'neon';
  const isWood = exitStyle === 'wood';
  const isLogout = bridgeId === 'logout';
  const isLink = bridgeId !== 'logout';

  const bridgeTitle = bridge.title;
  const bridgeRoute = bridge.route;
  const bridgeBlurb = bridge.blurb;
  const medDisplay = fmt(medLeft);
  const medPlayLabel = medRunning ? 'Pause' : 'Begin';
  const medToneLabel = medTone ? '♪ Tone on' : '♪ Tone off';

  const bridgeBack = () => { if (bridgeId && subIds.includes(bridgeId)) { setScreen('monitor'); setBridgeId(null); } else goHub(); };
  const confirmLogout = () => { if (onLogout) onLogout(); else { setScreen('loggedout'); setBridgeId(null); setHovered(null); } };

  return (
    <div className="cozy-hub-wrapper" style={{width: '100%', height: '100%'}}>
      {/* Admin Toggle (Prototype UI) */}
      {isHub && isAdmin && (
        <div style={{position:'fixed', bottom: 16, left: 16, zIndex: 9999, display: 'flex', gap: 8, background: 'rgba(33,40,46,.6)', padding: 8, borderRadius: 12, backdropFilter: 'blur(10px)', border: '1px solid rgba(253,221,154,.2)'}}>
          <button style={{width: 32, height: 32, background: 'rgba(253,221,154,.1)', color: '#FEFAE0', borderRadius: 8}} onClick={() => setTimeOfDay('day')}>☀</button>
          <button style={{width: 32, height: 32, background: 'rgba(253,221,154,.1)', color: '#FEFAE0', borderRadius: 8}} onClick={() => setTimeOfDay('dusk')}>◑</button>
          <button style={{width: 32, height: 32, background: 'rgba(253,221,154,.1)', color: '#FEFAE0', borderRadius: 8}} onClick={() => setTimeOfDay('night')}>☾</button>
        </div>
      )}
      {isNavigating && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,20,15,0.85)', backdropFilter: 'blur(8px)', animation: 'sw-fadein 0.3s ease' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(253,221,154,0.2)', borderTopColor: '#FDDD9A', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ marginTop: 24, color: '#FEFAE0', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', fontSize: 14 }}>ENTERING...</div>
          <style>{'@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'}</style>
        </div>
      )}
      {__STYLE_BLOCK__}
      {__TEMPLATE__}
    </div>
  );
}
`;

template = template.replace(
  "{/*  illustrated portrait (default; dev swaps in the user's uploaded photo)  */}",
  `{/* illustrated portrait (default; dev swaps in the user's uploaded photo) */}
          { avatarUrl ? (
            <img src={avatarUrl} alt="My Profile" style={{"width":"100%", "height":"100%", "objectFit":"cover", "display":"block", "borderRadius": "4px"}} />
          ) : (`
);

template = template.replace(
  /<div style=\{\{"position":"absolute","right":"40px","bottom":"120px","width":"15px","height":"15px","borderRadius":"50%","border":"3px solid #e0b34a"\}\}><\/div>\s*<\/div>/s,
  `$&
          )}`
);


// One final regex to replace the token and handle the actual injection
const finalCode = componentHeader
  .replace('{__STYLE_BLOCK__}', hoverStyles.length > 0 ? `<style>{\`${hoverStyles.join('\\n')}\`}</style>` : '')
  .replace('{__TEMPLATE__}', template);

fs.writeFileSync('src/components/hub/CozyHubRoom.tsx', finalCode);
console.log('Conversion successful!');

