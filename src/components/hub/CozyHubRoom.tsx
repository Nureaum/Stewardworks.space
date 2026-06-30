
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
  
  const [screen, setScreen] = useState<'hub' | 'monitor' | 'meditation' | 'progress' | 'bridge' | 'loggedout'>('hub');
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
    setScreen('bridge');
    setBridgeId(d.id);
  }
  
  const goHub = () => { pauseMed(); setScreen('hub'); setBridgeId(null); setHovered(null); }
  const openBridge = (id: string) => { setScreen('bridge'); setBridgeId(id); setHovered(null); }
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
  const curtainBaseL = `linear-gradient(90deg,${c2} 0%,${c1} 26%,${c0} 52%,${c1} 76%,${c2} 100%)`;
  const curtainBaseR = `linear-gradient(270deg,${c2} 0%,${c1} 26%,${c0} 52%,${c1} 76%,${c2} 100%)`;

  const lampTones = [
    { light: '#fff4e2', mid: '#ffe2bd', glow: '255,210,140' },
    { light: '#ffeef4', mid: '#ffd2e6', glow: '255,176,206' },
    { light: '#f4eeff', mid: '#ddccff', glow: '196,166,255' },
    { light: '#e9fbf2', mid: '#c8f0db', glow: '150,222,184' },
    { light: '#eaf4ff', mid: '#cfe4ff', glow: '156,198,255' },
    { light: '#fff0ea', mid: '#ffd8c6', glow: '255,184,150' },
  ];
  const lt = lampTones[lampIndex % lampTones.length];

  const outerStyle = { position: 'fixed' as const, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `linear-gradient(180deg, ${w[0]} 0%, ${w[0]} 46%, #6a3a22 70%, #532b18 100%)` };
  const stageStyle = { position: 'relative' as const, width: '1300px', height: '700px', flex: 'none', transformOrigin: 'center center', boxShadow: '0 40px 120px rgba(0,0,0,.5)', overflow: 'hidden', transform: `scale(${scale})` };
  const wallStyle = { position: 'absolute' as const, inset: 0, zIndex: 0, background: `linear-gradient(180deg, ${w[0]} 0%, ${w[1]} 100%)` };
  const tint = { position: 'absolute' as const, inset: 0, zIndex: 1, pointerEvents: 'none' as const, transition: 'background .9s ease', background: (tintMap[timeOfDay] || tintMap.day).background };
  
  const envPhotoStyle = { position: 'absolute' as const, inset: 0, backgroundImage: `url('${({ day: '/assets/sea-day.jpg', dusk: '/assets/sea-sunset.jpg', night: '/assets/sea-night-pink2.jpg' })[timeOfDay] || '/assets/sea-day.jpg'}')`, backgroundSize: 'cover', backgroundPosition: ({ day: 'center 27%', dusk: 'center', night: 'center' })[timeOfDay] || 'center', transition: 'opacity .6s ease' };
  
  const curtainLeftStyle = { position: 'absolute' as const, left: '16px', top: '13px', bottom: '13px', width: '74px', backgroundImage: curtainTex + ',' + curtainBaseL, borderRadius: '3px 10px 10px 3px', clipPath: 'polygon(0 0,100% 0,100% 43%,62% 50%,100% 57%,100% 100%,0 100%)', boxShadow: 'inset -11px 0 22px rgba(80,56,128,.4),0 4px 9px rgba(60,42,100,.3)', pointerEvents: 'none' as const, zIndex: 2, opacity: 0.82 };
  const curtainRightStyle = { position: 'absolute' as const, right: '16px', top: '13px', bottom: '13px', width: '74px', backgroundImage: curtainTex + ',' + curtainBaseR, borderRadius: '10px 3px 3px 10px', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,0 57%,38% 50%,0 43%)', boxShadow: 'inset 11px 0 22px rgba(80,56,128,.4),0 4px 9px rgba(60,42,100,.3)', pointerEvents: 'none' as const, zIndex: 2, opacity: 0.82 };
  
  const lampOrbStyle = { position: 'absolute' as const, left: '50%', top: '64px', width: '66px', height: '66px', transform: 'translateX(-50%)', borderRadius: '50%', background: `radial-gradient(circle at 42% 38%, #fffdf4, ${lt.light} 50%, ${lt.mid} 100%)`, boxShadow: `0 0 26px 8px rgba(${lt.glow},.85),0 0 60px 18px rgba(${lt.glow},.5)`, transition: 'background 1.6s ease, box-shadow 1.6s ease', animation: 'sw-lamppulse 5s ease-in-out infinite' };
  const lampGlowStyle = { position: 'absolute' as const, left: '60px', bottom: '70px', width: '420px', height: '360px', zIndex: 6, pointerEvents: 'none' as const, background: `radial-gradient(circle at 40% 50%, rgba(${lt.glow},.5), rgba(${lt.glow},0) 65%)`, transition: 'opacity .9s ease, background 1.6s ease', animation: 'sw-lamppulse 5s ease-in-out infinite', opacity: lampGlow };
  
  const chiaStyle = { position: 'absolute' as const, left: '50%', bottom: '168px', width: '56px', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', transition: 'height .5s ease', overflow: 'visible', height: chia + 'px' };
  const chiaBigStyle = { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', transition: 'height .5s ease', marginBottom: '6px', height: chiaBig + 'px' };
  const progressPct = progress + '%';
  const progressBarStyle = { height: '100%', background: 'linear-gradient(90deg,#6B8E23,#A27532)', borderRadius: '10px', transition: 'width .5s ease', width: progress + '%' };
  
  const medBgStyle = { position: 'fixed' as const, inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', transition: 'background .8s ease', animation: 'sw-fade .3s ease', background: mt.bg };
  const medRingStyle = { position: 'absolute' as const, width: '240px', height: '240px', borderRadius: '50%', background: `radial-gradient(circle, ${mt.ring}, rgba(255,255,255,.05))`, animation: 'sw-breathe 9s ease-in-out infinite' };
  const medHeadStyle = { textAlign: 'center' as const, marginBottom: '8px', color: mt.text };
  const medTimerStyle = { position: 'relative' as const, textAlign: 'center' as const, color: mt.text };
  
  const isHub = screen === 'hub';
  const isMonitor = screen === 'monitor';
  const isMeditation = screen === 'meditation';
  const isProgress = screen === 'progress';
  const isBridge = screen === 'bridge';
  const isLoggedOut = screen === 'loggedout';
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
      <div style={outerStyle}>

  {/*  =================== HUB STAGE ===================  */}
  <div data-screen-label="Cozy Hub" style={stageStyle}>

    {/*  WALL  */}
    <div style={wallStyle}></div>
    <div style={{"position":"absolute","inset":"0","zIndex":"0","background":"radial-gradient(120% 80% at 50% 18%, rgba(255,240,220,.35), transparent 60%), radial-gradient(140% 90% at 50% 110%, rgba(80,40,20,.28), transparent 55%)"}}></div>
    {/*  time-of-day tint  */}
    <div style={tint}></div>

    {/*  ============ WALL OBJECTS ============  */}

    {/*  PROFILE PORTRAIT (My Profile)  */}
    <div style={{"position":"absolute","left":"62px","top":"54px","width":"280px","height":"352px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-6px) scale(1.02);filter:drop-shadow(0 14px 22px rgba(219,155,47,.55));" onMouseEnter={o.profile.enter} onMouseLeave={leave} onClick={o.profile.click}>
      { o.profile.show && (
<><div style={{"position":"absolute","left":"50%","top":"-12px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>My Profile<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      <div style={{"position":"absolute","inset":"0","background":"linear-gradient(150deg,#5a3a24,#3d2817)","borderRadius":"5px","boxShadow":"0 16px 30px rgba(0,0,0,.32)","padding":"16px"}}>
        <div style={{"position":"absolute","inset":"9px","border":"2px solid rgba(0,0,0,.25)","borderRadius":"3px"}}></div>
        <div style={{"position":"relative","width":"100%","height":"100%","background":"linear-gradient(165deg,#c4b2d8,#9180ac)","borderRadius":"2px","overflow":"hidden"}}>
          {/* illustrated portrait (default; dev swaps in the user's uploaded photo) */}
          { avatarUrl ? (
            <img src={avatarUrl} alt="My Profile" style={{"width":"100%", "height":"100%", "objectFit":"cover", "display":"block", "borderRadius": "4px"}} />
          ) : (
          <div style={{"position":"absolute","left":"50%","bottom":"0","width":"230px","height":"282px","transform":"translateX(-50%)"}}>
            <div style={{"position":"absolute","left":"50%","bottom":"118px","width":"160px","height":"158px","transform":"translateX(-50%)","borderRadius":"50% 50% 46% 46%","background":"#2b2330","boxShadow":"inset -8px -10px 18px rgba(0,0,0,.25)"}}></div>
            <div style={{"position":"absolute","left":"50%","bottom":"0","width":"210px","height":"120px","transform":"translateX(-50%)","borderRadius":"78px 78px 0 0","overflow":"hidden","display":"flex","boxShadow":"inset 0 5px 12px rgba(0,0,0,.14)"}}>
              <div style={{"flex":"1","background":"linear-gradient(160deg,#46b3a2,#2f8d7e)"}}></div>
              <div style={{"flex":"1","background":"linear-gradient(160deg,#cf6bb0,#a84d8e)"}}></div>
            </div>
            <div style={{"position":"absolute","left":"50%","bottom":"74px","width":"30px","height":"34px","transform":"translateX(-50%) rotate(45deg)","background":"linear-gradient(135deg,#3f9d8e 50%,#bd5fa0 50%)"}}></div>
            <div style={{"position":"absolute","left":"46px","bottom":"34px","width":"38px","height":"13px","background":"rgba(255,255,255,.85)","borderRadius":"2px"}}></div>
            <div style={{"position":"absolute","left":"50%","bottom":"104px","width":"44px","height":"34px","transform":"translateX(-50%)","background":"#9c6b46","borderRadius":"0 0 14px 14px"}}></div>
            <div style={{"position":"absolute","left":"50%","bottom":"118px","width":"104px","height":"120px","transform":"translateX(-50%)","background":"linear-gradient(160deg,#bb8359,#9c6b46)","borderRadius":"50px 50px 46px 46px","boxShadow":"inset -6px -8px 14px rgba(0,0,0,.16)"}}>
              <div style={{"position":"absolute","top":"46px","left":"26px","width":"10px","height":"11px","borderRadius":"50%","background":"#33241a"}}></div>
              <div style={{"position":"absolute","top":"46px","right":"26px","width":"10px","height":"11px","borderRadius":"50%","background":"#33241a"}}></div>
              <div style={{"position":"absolute","top":"39px","left":"18px","width":"18px","height":"5px","borderRadius":"3px","background":"rgba(51,36,26,.5)"}}></div>
              <div style={{"position":"absolute","top":"39px","right":"18px","width":"18px","height":"5px","borderRadius":"3px","background":"rgba(51,36,26,.5)"}}></div>
              <div style={{"position":"absolute","top":"66px","left":"50%","width":"16px","height":"8px","transform":"translateX(-50%)","background":"rgba(190,90,90,.4)","borderRadius":"0 0 10px 10px"}}></div>
              <div style={{"position":"absolute","top":"70px","left":"50%","width":"30px","height":"15px","transform":"translateX(-50%)","borderBottom":"3px solid #7a4730","borderRadius":"0 0 18px 18px"}}></div>
            </div>
            <div style={{"position":"absolute","left":"40px","bottom":"120px","width":"15px","height":"15px","borderRadius":"50%","border":"3px solid #e0b34a"}}></div>
            <div style={{"position":"absolute","right":"40px","bottom":"120px","width":"15px","height":"15px","borderRadius":"50%","border":"3px solid #e0b34a"}}></div>
          </div>
          )}
        </div>
      </div>
    </div>

    {/*  WINDOW → SEA PHOTO (Environmental Literacy)  */}
    <div style={{"position":"absolute","left":"404px","top":"20px","width":"486px","height":"266px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-5px) scale(1.012);filter:drop-shadow(0 16px 26px rgba(65,124,152,.55));z-index:30;" onMouseEnter={o.env.enter} onMouseLeave={leave} onClick={o.env.click}>
      { o.env.show && (
<><div style={{"position":"absolute","left":"50%","top":"26px","transform":"translateX(-50%)","background":"rgba(33,40,46,.94)","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","border":"1px solid rgba(254,250,224,.45)","boxShadow":"0 4px 14px rgba(0,0,0,.55)","zIndex":"50","pointerEvents":"none","animation":"sw-fadein .15s ease"}}>Environmental Literacy</div></>
)}
      {/*  outer wood frame  */}
      <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,#efe4cd,#d2bf9a)","borderRadius":"8px","boxShadow":"0 18px 34px rgba(0,0,0,.3),inset 0 0 0 1px rgba(120,90,50,.25)","padding":"16px"}}>
        {/*  glass / sea photo (synced to time-of-day toggle)  */}
        <div style={{"position":"relative","width":"100%","height":"100%","borderRadius":"4px","overflow":"hidden","boxShadow":"inset 0 0 0 3px rgba(120,90,50,.4)","background":"linear-gradient(180deg,#f6b56a,#5e93a0)"}}>
          <div style={envPhotoStyle}></div>
          <div style={{"position":"absolute","top":"-10%","left":"-10%","width":"55%","height":"130%","background":"linear-gradient(120deg,rgba(255,255,255,.16),transparent 62%)","transform":"rotate(8deg)","pointerEvents":"none"}}></div>
        </div>
        {/*  pulled-back curtains (full opaque fabric, tied to the sides)  */}
        <div style={curtainLeftStyle}></div>
        <div style={{"position":"absolute","left":"14px","top":"46%","width":"74px","height":"13px","background":"linear-gradient(180deg,#ecc163,#9a772f)","borderRadius":"7px","boxShadow":"0 3px 6px rgba(90,55,26,.4),inset 0 1px 0 rgba(255,255,255,.45)","pointerEvents":"none","zIndex":"3"}}></div>
        <div style={curtainRightStyle}></div>
        <div style={{"position":"absolute","right":"14px","top":"46%","width":"74px","height":"13px","background":"linear-gradient(180deg,#ecc163,#9a772f)","borderRadius":"7px","boxShadow":"0 3px 6px rgba(90,55,26,.4),inset 0 1px 0 rgba(255,255,255,.45)","pointerEvents":"none","zIndex":"3"}}></div>
      </div>
      {/*  robust windowsill  */}
      <div style={{"position":"absolute","left":"-18px","right":"-18px","bottom":"-15px","height":"17px","background":"linear-gradient(180deg,#efdfbe,#d6c193)","borderRadius":"4px 4px 3px 3px","boxShadow":"0 10px 16px rgba(0,0,0,.24)"}}></div>
      <div style={{"position":"absolute","left":"-9px","right":"-9px","bottom":"-23px","height":"9px","background":"linear-gradient(180deg,#cbb287,#a98f63)","borderRadius":"0 0 4px 4px","boxShadow":"0 6px 10px rgba(0,0,0,.2)"}}></div>
      {/*  sill corbels  */}
      <div style={{"position":"absolute","left":"18px","bottom":"-31px","width":"15px","height":"12px","background":"linear-gradient(180deg,#b89a6a,#937a50)","borderRadius":"0 0 3px 3px"}}></div>
      <div style={{"position":"absolute","right":"18px","bottom":"-31px","width":"15px","height":"12px","background":"linear-gradient(180deg,#b89a6a,#937a50)","borderRadius":"0 0 3px 3px"}}></div>
      {/*  potted flower on sill  */}
      <div style={{"position":"absolute","right":"4px","bottom":"1px","width":"52px","height":"36px","background":"linear-gradient(180deg,#c67a48,#9c5630)","borderRadius":"5px 5px 12px 12px","zIndex":"2","boxShadow":"inset 0 4px 0 rgba(255,255,255,.16),0 4px 7px rgba(0,0,0,.22)"}}></div>
      <div style={{"position":"absolute","right":"4px","bottom":"35px","width":"52px","height":"9px","background":"linear-gradient(180deg,#dd8e56,#b56c40)","borderRadius":"4px","zIndex":"2"}}></div>
      {/*  stem  */}
      <div style={{"position":"absolute","right":"27px","bottom":"42px","width":"4px","height":"46px","background":"linear-gradient(180deg,#6f9e2e,#4f7d1f)","borderRadius":"3px","zIndex":"2","transformOrigin":"bottom","animation":"sw-sway 6s ease-in-out infinite"}}></div>
      {/*  leaves  */}
      <div style={{"position":"absolute","right":"10px","bottom":"50px","width":"21px","height":"13px","borderRadius":"0 70% 0 70%","background":"linear-gradient(160deg,#6f9e2e,#4f7d1f)","transform":"rotate(-22deg)","zIndex":"2","transformOrigin":"bottom right","animation":"sw-sway 7s ease-in-out infinite"}}></div>
      <div style={{"position":"absolute","right":"33px","bottom":"54px","width":"21px","height":"13px","borderRadius":"70% 0 70% 0","background":"linear-gradient(160deg,#7caa34,#5f8d2a)","transform":"rotate(22deg)","zIndex":"2","transformOrigin":"bottom left","animation":"sw-sway 6.5s ease-in-out infinite"}}></div>
      {/*  flower bloom  */}
      <div style={{"position":"absolute","right":"11px","bottom":"74px","width":"42px","height":"42px","zIndex":"3","transformOrigin":"bottom center","animation":"sw-sway 5.5s ease-in-out infinite"}}>
        <div style={{"position":"absolute","left":"23px","top":"12px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#f6a8c2,#df6f9a)"}}></div>
        <div style={{"position":"absolute","left":"15px","top":"1px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#f6a8c2,#df6f9a)"}}></div>
        <div style={{"position":"absolute","left":"3px","top":"1px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#f29bba,#d8628f)"}}></div>
        <div style={{"position":"absolute","left":"0","top":"12px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#f29bba,#d8628f)"}}></div>
        <div style={{"position":"absolute","left":"7px","top":"22px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#ee93b3,#d35c8a)"}}></div>
        <div style={{"position":"absolute","left":"19px","top":"22px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 40% 38%,#ee93b3,#d35c8a)"}}></div>
        <div style={{"position":"absolute","left":"12px","top":"12px","width":"19px","height":"19px","borderRadius":"50%","background":"radial-gradient(circle at 42% 40%,#ffe79c,#f0b53e)","boxShadow":"inset 0 0 0 2px rgba(180,120,30,.25)"}}></div>
      </div>
    </div>

    {/*  ADMIN KEY (only for admins)  */}
    { isAdmin && (
<>
      <div style={{"position":"absolute","left":"1109px","top":"208px","width":"46px","height":"104px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease","transformOrigin":"top center"}} style-hover="transform:rotate(6deg) scale(1.08);filter:drop-shadow(0 8px 12px rgba(162,117,50,.7));" onMouseEnter={o.admin.enter} onMouseLeave={leave} onClick={o.admin.click}>
        { o.admin.show && (
<><div style={{"position":"absolute","left":"50%","top":"-8px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".05em","padding":"5px 10px","borderRadius":"7px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Admin Console<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"9px","height":"9px","background":"#21282E"}}></span></div></>
)}
        <div style={{"position":"absolute","left":"50%","top":"0","width":"6px","height":"6px","borderRadius":"50%","background":"#3a2a18","transform":"translateX(-50%)"}}></div>
        <div style={{"position":"absolute","left":"50%","top":"3px","width":"2px","height":"30px","background":"#9a8056","transform":"translateX(-50%)"}}></div>
        <div style={{"position":"absolute","left":"50%","top":"30px","transform":"translateX(-50%)"}}>
          <div style={{"width":"22px","height":"22px","borderRadius":"50%","border":"5px solid #b8923f","background":"transparent"}}></div>
          <div style={{"width":"5px","height":"34px","background":"#b8923f","margin":"0 auto"}}></div>
          <div style={{"width":"14px","height":"5px","background":"#b8923f","marginLeft":"8px","marginTop":"-12px"}}></div>
          <div style={{"width":"10px","height":"5px","background":"#b8923f","marginLeft":"8px","marginTop":"4px"}}></div>
        </div>
      </div>
    </>
)}

    {/*  EXIT SIGN (Log Out)  */}
    <div style={{"position":"absolute","left":"1004px","top":"46px","width":"256px","height":"150px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-5px) scale(1.03);filter:drop-shadow(0 14px 22px rgba(219,80,60,.5));" onMouseEnter={o.logout.enter} onMouseLeave={leave} onClick={o.logout.click}>
      { o.logout.show && (
<><div style={{"position":"absolute","left":"50%","top":"-12px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Log Out<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}

      {/*  NEON version — frameless tubing mounted on the wall  */}
      { isNeon && (
<>
        {/*  small backing plate sized to the sign  */}
        <div style={{"position":"absolute","left":"50%","top":"50%","transform":"translate(-50%,-50%)","width":"236px","height":"118px","borderRadius":"16px","background":"linear-gradient(160deg,rgba(120,92,72,.30),rgba(96,72,56,.34))","boxShadow":"0 6px 14px rgba(0,0,0,.14),inset 0 0 0 1px rgba(255,210,150,.12)"}}></div>
        <div style={{"position":"absolute","left":"50%","top":"50%","transform":"translate(-50%,-50%)","textAlign":"center","animation":"sw-neon 4s linear infinite"}}>
          <div style={{"fontFamily":"'DM Mono',monospace","fontWeight":"500","fontSize":"44px","letterSpacing":".05em","color":"#fff5cf","textShadow":"0 0 6px #ffd24a,0 0 16px #ff9a3a,0 0 30px #ff6a2a","lineHeight":".9"}}>EXIT</div>
          <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"19px","letterSpacing":".04em","color":"#b6edff","textShadow":"0 0 6px #5fd0ff,0 0 15px #2a9fe0","marginTop":"8px"}}>STEWARD.WORKS</div>
        </div>
        {/*  mounting screws on plate corners  */}
        <div style={{"position":"absolute","left":"50%","top":"50%","width":"236px","height":"118px","transform":"translate(-50%,-50%)","pointerEvents":"none"}}>
          <div style={{"position":"absolute","left":"8px","top":"8px","width":"6px","height":"6px","borderRadius":"50%","background":"radial-gradient(circle at 35% 35%,#cfd3da,#7d8595)"}}></div>
          <div style={{"position":"absolute","right":"8px","top":"8px","width":"6px","height":"6px","borderRadius":"50%","background":"radial-gradient(circle at 35% 35%,#cfd3da,#7d8595)"}}></div>
          <div style={{"position":"absolute","left":"8px","bottom":"8px","width":"6px","height":"6px","borderRadius":"50%","background":"radial-gradient(circle at 35% 35%,#cfd3da,#7d8595)"}}></div>
          <div style={{"position":"absolute","right":"8px","bottom":"8px","width":"6px","height":"6px","borderRadius":"50%","background":"radial-gradient(circle at 35% 35%,#cfd3da,#7d8595)"}}></div>
        </div>
      </>
)}
    </div>

    {/*  ============ DESK ============  */}
    <div style={{"position":"absolute","left":"0","right":"0","top":"512px","height":"188px","zIndex":"5","background":"linear-gradient(180deg,#a8663f 0%,#8c4f30 24%,#7c4327 100%)","boxShadow":"inset 0 16px 28px rgba(0,0,0,.2)"}}>
      <div style={{"position":"absolute","top":"0","left":"0","right":"0","height":"120px","background":"linear-gradient(180deg,rgba(255,222,180,.28),transparent)"}}></div>
      <div style={{"position":"absolute","inset":"0","opacity":".1","backgroundImage":"repeating-linear-gradient(90deg,transparent 0 40px,rgba(0,0,0,.55) 41px 42px)"}}></div>
      {/*  front face  */}
      <div style={{"position":"absolute","left":"0","right":"0","top":"88px","bottom":"0","background":"linear-gradient(180deg,#713d23,#582d18)","borderTop":"5px solid #46220f"}}>
        <div style={{"position":"absolute","left":"46px","top":"24px","width":"300px","height":"96px","background":"linear-gradient(180deg,#7a4327,#5a2e18)","borderRadius":"7px","boxShadow":"inset 0 3px 8px rgba(0,0,0,.4),inset 0 -2px 0 rgba(255,200,150,.12)"}}></div>
        <div style={{"position":"absolute","left":"166px","top":"62px","width":"64px","height":"11px","background":"#cdb083","borderRadius":"6px","boxShadow":"0 2px 4px rgba(0,0,0,.4)"}}></div>
        <div style={{"position":"absolute","right":"46px","top":"24px","width":"300px","height":"96px","background":"linear-gradient(180deg,#7a4327,#5a2e18)","borderRadius":"7px","boxShadow":"inset 0 3px 8px rgba(0,0,0,.4),inset 0 -2px 0 rgba(255,200,150,.12)"}}></div>
        <div style={{"position":"absolute","right":"166px","top":"62px","width":"64px","height":"11px","background":"#cdb083","borderRadius":"6px","boxShadow":"0 2px 4px rgba(0,0,0,.4)"}}></div>
        <div style={{"position":"absolute","left":"50%","top":"18px","width":"240px","height":"120px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#5e3119,#48250f)","borderRadius":"8px 8px 0 0","boxShadow":"inset 0 4px 10px rgba(0,0,0,.45)"}}></div>
      </div>
    </div>

    {/*  ambient lamp glow  */}
    <div style={lampGlowStyle}></div>

    {/*  ============ DESK OBJECTS ============  */}

    {/*  LAMP (Help Desk) — iridescent dome  */}
    <div style={{"position":"absolute","left":"64px","bottom":"126px","width":"172px","height":"212px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-7px) scale(1.03);filter:drop-shadow(0 12px 18px rgba(255,190,120,.7));" onMouseEnter={o.helpdesk.enter} onMouseLeave={leave} onClick={o.helpdesk.click}>
      { o.helpdesk.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Help Desk<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      {/*  glass dome  */}
      <div style={{"position":"absolute","left":"50%","bottom":"2px","width":"152px","height":"20px","transform":"translateX(-50%)","background":"radial-gradient(ellipse,rgba(0,0,0,.34),transparent 70%)","filter":"blur(3px)","zIndex":"-1","pointerEvents":"none"}}></div>
      <div style={{"position":"absolute","left":"50%","top":"6px","width":"128px","height":"150px","transform":"translateX(-50%)","borderRadius":"64px 64px 30px 30px / 80px 80px 26px 26px","background":"linear-gradient(165deg, rgba(247,205,224,.62), rgba(214,168,200,.5) 45%, rgba(160,200,210,.4))","boxShadow":"inset 0 12px 30px rgba(255,255,255,.55),inset 0 -10px 24px rgba(120,90,140,.35),0 8px 20px rgba(0,0,0,.18)","overflow":"hidden"}}>
        <div style={{"position":"absolute","left":"18px","top":"14px","width":"30px","height":"90px","borderRadius":"50%","background":"linear-gradient(180deg,rgba(255,255,255,.6),transparent)","filter":"blur(2px)"}}></div>
      </div>
      {/*  inner glowing orb  */}
      <div style={lampOrbStyle}></div>
      {/*  chrome base  */}
      <div style={{"position":"absolute","left":"50%","bottom":"8px","width":"120px","height":"30px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#e7e9ee,#aab0bd 55%,#7d8595)","boxShadow":"0 8px 14px rgba(0,0,0,.3),inset 0 2px 3px rgba(255,255,255,.8)"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"22px","width":"120px","height":"16px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#cdd2dc,#9aa1ae)"}}></div>
    </div>

    {/*  ZEN WATER FOUNTAIN (Wellness & Meditation)  */}
    <div style={{"position":"absolute","left":"228px","bottom":"162px","width":"138px","height":"172px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(80,170,190,.6));" onMouseEnter={o.wellness.enter} onMouseLeave={leave} onClick={o.wellness.click}>
      { o.wellness.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Wellness &amp; Meditation<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      {/*  ground shadow  */}
      <div style={{"position":"absolute","left":"50%","bottom":"2px","width":"118px","height":"18px","transform":"translateX(-50%)","background":"radial-gradient(ellipse,rgba(0,0,0,.32),transparent 70%)","filter":"blur(3px)","zIndex":"-1","pointerEvents":"none"}}></div>
      {/*  basin bowl  */}
      <div style={{"position":"absolute","left":"50%","bottom":"6px","width":"116px","height":"50px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#3f7488,#2c5566)","boxShadow":"0 10px 16px rgba(0,0,0,.3),inset 0 -4px 8px rgba(0,0,0,.25)","clipPath":"polygon(7% 0,93% 0,83% 100%,17% 100%)","zIndex":"1"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"46px","width":"122px","height":"22px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#4f8a9e,#356074)","boxShadow":"inset 0 2px 0 rgba(255,255,255,.22)","zIndex":"2"}}></div>
      {/*  greenery sprigs at back rim  */}
      <div style={{"position":"absolute","left":"14px","bottom":"50px","zIndex":"2","animation":"sw-sway 6s ease-in-out infinite","transformOrigin":"bottom center"}}>
        <div style={{"width":"19px","height":"19px","borderRadius":"60% 0 60% 60%","background":"#6B8E23","transform":"rotate(18deg)"}}></div>
        <div style={{"width":"15px","height":"15px","borderRadius":"0 60% 60% 60%","background":"#7c9e2e","transform":"rotate(-26deg)","marginTop":"-9px","marginLeft":"9px"}}></div>
      </div>
      <div style={{"position":"absolute","right":"14px","bottom":"50px","zIndex":"2","animation":"sw-sway 7.5s ease-in-out infinite","transformOrigin":"bottom center"}}>
        <div style={{"width":"17px","height":"17px","borderRadius":"0 60% 60% 60%","background":"#5f7d1f","transform":"rotate(-16deg)"}}></div>
        <div style={{"width":"14px","height":"14px","borderRadius":"60% 0 60% 60%","background":"#8bb03e","transform":"rotate(22deg)","marginTop":"-8px","marginRight":"7px"}}></div>
      </div>
      {/*  water surface  */}
      <div style={{"position":"absolute","left":"50%","bottom":"50px","width":"102px","height":"13px","transform":"translateX(-50%)","borderRadius":"50%","background":"radial-gradient(ellipse,#c4e9f1,#7fc0d2 72%)","boxShadow":"inset 0 2px 4px rgba(255,255,255,.5)","overflow":"hidden","zIndex":"3"}}>
        <div style={{"position":"absolute","inset":"0","background":"repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 2px, transparent 2px 9px)","animation":"sw-shimmer 6s ease-in-out infinite alternate"}}></div>
      </div>
      {/*  stacked river stones  */}
      <div style={{"position":"absolute","left":"50%","bottom":"55px","width":"58px","height":"19px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#b3b9bf,#7c828a)","boxShadow":"0 4px 7px rgba(0,0,0,.28),inset 0 2px 2px rgba(255,255,255,.4)","zIndex":"4"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"68px","width":"44px","height":"16px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#c0c6cc,#868c94)","boxShadow":"0 4px 6px rgba(0,0,0,.26),inset 0 2px 2px rgba(255,255,255,.45)","zIndex":"4"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"80px","width":"30px","height":"13px","transform":"translateX(-50%)","borderRadius":"50%","background":"linear-gradient(180deg,#cad0d6,#929aa2)","boxShadow":"0 3px 5px rgba(0,0,0,.24),inset 0 2px 2px rgba(255,255,255,.5)","zIndex":"4"}}></div>
      {/*  cascading water sheet  */}
      <div style={{"position":"absolute","left":"50%","bottom":"56px","width":"24px","height":"34px","transform":"translateX(-50%)","borderRadius":"8px","background":"linear-gradient(180deg,rgba(210,240,248,.12),rgba(165,218,234,.5))","boxShadow":"0 0 6px rgba(180,225,240,.4)","overflow":"hidden","zIndex":"5"}}>
        <div style={{"position":"absolute","left":"-4px","right":"-4px","top":"-9px","bottom":"-9px","background":"repeating-linear-gradient(180deg, rgba(255,255,255,.38) 0 2px, transparent 2px 9px)","animation":"sw-flow .8s linear infinite"}}></div>
      </div>
      {/*  spout bubble at top  */}
      <div style={{"position":"absolute","left":"50%","bottom":"89px","width":"16px","height":"8px","transform":"translateX(-50%)","borderRadius":"50%","background":"radial-gradient(ellipse,#eafaff,#c4e9f1)","boxShadow":"0 0 8px rgba(190,235,245,.7)","zIndex":"6","animation":"sw-lamppulse 4s ease-in-out infinite"}}></div>
    </div>

    {/*  STATUE + CHIA (Progress & Generations)  */}
    <div style={{"position":"absolute","left":"392px","bottom":"128px","width":"108px","height":"226px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(107,142,35,.6));" onMouseEnter={o.progress.enter} onMouseLeave={leave} onClick={o.progress.click}>
      { o.progress.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Progress &amp; Generations<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      {/*  chia sprouts (grow with progress)  */}
      <div style={{"position":"absolute","left":"50%","bottom":"2px","width":"90px","height":"16px","transform":"translateX(-50%)","background":"radial-gradient(ellipse,rgba(0,0,0,.34),transparent 70%)","filter":"blur(3px)","zIndex":"-1","pointerEvents":"none"}}></div>
      {/*  plinth base  */}
      <div style={{"position":"absolute","left":"50%","bottom":"6px","width":"84px","height":"20px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#4a3f33,#33291f)","borderRadius":"4px","boxShadow":"0 9px 14px rgba(0,0,0,.34),inset 0 3px 0 rgba(255,230,190,.18)"}}></div>
      {/*  plinth upper  */}
      <div style={{"position":"absolute","left":"50%","bottom":"24px","width":"68px","height":"22px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#5a4a3a,#3f3326)","borderRadius":"3px","boxShadow":"inset 0 2px 0 rgba(255,230,190,.22)"}}></div>
      {/*  award nameplate  */}
      <div style={{"position":"absolute","left":"50%","bottom":"30px","width":"48px","height":"10px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#ecce7c,#bd9637)","borderRadius":"2px","boxShadow":"0 1px 2px rgba(0,0,0,.3)"}}></div>
      {/*  shoulders / bust  */}
      <div style={{"position":"absolute","left":"50%","bottom":"44px","width":"86px","height":"74px","transform":"translateX(-50%)","background":"linear-gradient(160deg,#d8b969,#9c7a2c)","borderRadius":"42px 42px 10px 10px","clipPath":"polygon(33% 0,67% 0,100% 100%,0 100%)","boxShadow":"inset -7px -5px 13px rgba(86,62,18,.5),inset 6px 5px 9px rgba(255,242,205,.28)"}}></div>
      {/*  drape neckline  */}
      <div style={{"position":"absolute","left":"50%","bottom":"64px","width":"50px","height":"34px","transform":"translateX(-50%)","borderRadius":"50%","borderTop":"2px solid rgba(86,62,18,.4)"}}></div>
      {/*  neck  */}
      <div style={{"position":"absolute","left":"50%","bottom":"100px","width":"24px","height":"30px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#c9a24b,#9c7a2c)","boxShadow":"inset -3px 0 5px rgba(86,62,18,.4)"}}></div>
      {/*  head  */}
      <div style={{"position":"absolute","left":"50%","bottom":"122px","width":"50px","height":"60px","transform":"translateX(-50%)","borderRadius":"48% 48% 44% 44%","background":"linear-gradient(160deg,#dcc079,#a8842f)","boxShadow":"inset -5px -6px 13px rgba(86,62,18,.5),inset 5px 5px 9px rgba(255,242,205,.4)"}}>
        <div style={{"position":"absolute","left":"50%","top":"26px","width":"5px","height":"13px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#bb9540,#8f6e26)","borderRadius":"3px"}}></div>
        <div style={{"position":"absolute","left":"11px","top":"24px","width":"7px","height":"4px","borderRadius":"50%","background":"rgba(86,62,18,.45)"}}></div>
        <div style={{"position":"absolute","right":"11px","top":"24px","width":"7px","height":"4px","borderRadius":"50%","background":"rgba(86,62,18,.45)"}}></div>
      </div>
      {/*  chia sprouts (hair) grow with progress  */}
      <div style={chiaStyle}>
        <div style={{"width":"4px","height":"60%","background":"linear-gradient(180deg,#9bc04a,#5f7d1f)","borderRadius":"3px","transform":"rotate(-16deg)","transformOrigin":"bottom"}}></div>
        <div style={{"width":"4px","height":"84%","background":"linear-gradient(180deg,#a6cb55,#6B8E23)","borderRadius":"3px","transform":"rotate(-7deg)","transformOrigin":"bottom"}}></div>
        <div style={{"width":"4px","height":"100%","background":"linear-gradient(180deg,#b4d65f,#74992a)","borderRadius":"3px","transformOrigin":"bottom"}}></div>
        <div style={{"width":"4px","height":"86%","background":"linear-gradient(180deg,#a6cb55,#6B8E23)","borderRadius":"3px","transform":"rotate(7deg)","transformOrigin":"bottom"}}></div>
        <div style={{"width":"4px","height":"62%","background":"linear-gradient(180deg,#9bc04a,#5f7d1f)","borderRadius":"3px","transform":"rotate(16deg)","transformOrigin":"bottom"}}></div>
      </div>
    </div>

    {/*  MONITOR (Workshops · AI Lab · Workforce)  */}
    <div style={{"position":"absolute","left":"524px","bottom":"140px","width":"330px","height":"248px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-5px) scale(1.015);filter:drop-shadow(0 16px 22px rgba(65,124,152,.5));" onMouseEnter={o.monitor.enter} onMouseLeave={leave} onClick={o.monitor.click}>
      { o.monitor.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Workshops · AI Lab · Workforce<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      {/*  stand  */}
      <div style={{"position":"absolute","left":"50%","bottom":"-4px","width":"160px","height":"22px","transform":"translateX(-50%)","background":"radial-gradient(ellipse,rgba(0,0,0,.34),transparent 70%)","filter":"blur(4px)","zIndex":"-1","pointerEvents":"none"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"0","width":"120px","height":"18px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#dfe2e8,#aab0bd)","borderRadius":"6px","boxShadow":"0 8px 12px rgba(0,0,0,.28)"}}></div>
      <div style={{"position":"absolute","left":"50%","bottom":"14px","width":"34px","height":"46px","transform":"translateX(-50%)","background":"linear-gradient(90deg,#c9ccd4,#eef0f3,#c9ccd4)"}}></div>
      {/*  body  */}
      <div style={{"position":"absolute","left":"0","top":"0","right":"0","bottom":"52px","background":"linear-gradient(165deg,#f4f1ea,#dcd8cf)","borderRadius":"18px","boxShadow":"0 14px 26px rgba(0,0,0,.3),inset 0 2px 0 rgba(255,255,255,.7)","padding":"14px"}}>
        {/*  screen  */}
        <div style={{"position":"relative","width":"100%","height":"100%","borderRadius":"8px","overflow":"hidden","background":"linear-gradient(160deg,#2b3a44,#3c5360 60%,#46606e)","boxShadow":"inset 0 0 0 3px rgba(0,0,0,.25)"}}>
          {/*  wallpaper  */}
          <div style={{"position":"absolute","inset":"0","background":"linear-gradient(180deg,#e88c52 0%,#d9a35e 42%,#5e93a0 62%,#3a5560 100%)","opacity":".92"}}></div>
          {/*  centered StewardWorks logo  */}
          <div style={{"position":"absolute","left":"0","right":"0","top":"47%","transform":"translateY(-50%)","display":"flex","justifyContent":"center"}}>
            <div style={{"width":"82px","height":"82px","borderRadius":"18px","background":"rgba(255,255,255,.94)","boxShadow":"0 8px 20px rgba(0,0,0,.3)","padding":"6px","display":"flex","alignItems":"center","justifyContent":"center"}}>
              <img src="/assets/sw-logo.png" alt="StewardWorks AI Labs" style={{"width":"100%","height":"100%","objectFit":"contain","display":"block"}} />
            </div>
          </div>
          {/*  topbar  */}
          <div style={{"position":"absolute","top":"0","left":"0","right":"0","height":"22px","background":"rgba(255,255,255,.78)","display":"flex","alignItems":"center","justifyContent":"space-between","padding":"0 9px"}}>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"8px","letterSpacing":".18em","color":"#21282E","opacity":".7"}}>STEWARD OS</span>
            <span style={{"display":"flex","gap":"3px"}}><i style={{"width":"7px","height":"7px","borderRadius":"50%","background":"#e07a6a","display":"block"}}></i><i style={{"width":"7px","height":"7px","borderRadius":"50%","background":"#e6c25a","display":"block"}}></i><i style={{"width":"7px","height":"7px","borderRadius":"50%","background":"#7fb06a","display":"block"}}></i></span>
          </div>
          {/*  bottom label  */}
          <div style={{"position":"absolute","left":"0","right":"0","bottom":"13px","textAlign":"center"}}>
            <div style={{"fontFamily":"'DM Mono',monospace","fontWeight":"400","fontSize":"11px","color":"#fff","letterSpacing":".08em","textShadow":"0 1px 4px rgba(0,0,0,.5)"}}>Stewardworks AI Labs</div>
            <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","letterSpacing":".18em","color":"rgba(255,255,255,.85)","marginTop":"3px","textShadow":"0 1px 3px rgba(0,0,0,.4)"}}>CLICK TO ENTER</div>
          </div>
          {/*  glare  */}
          <div style={{"position":"absolute","top":"-10%","left":"-20%","width":"60%","height":"140%","background":"linear-gradient(120deg,rgba(255,255,255,.22),transparent 60%)","transform":"rotate(8deg)","pointerEvents":"none"}}></div>
        </div>
      </div>
    </div>

    {/*  KEYBOARD (decor, in front of monitor)  */}
    <div style={{"position":"absolute","left":"524px","bottom":"112px","width":"330px","zIndex":"8","pointerEvents":"none","display":"flex","justifyContent":"center"}}>
      <div style={{"width":"228px","height":"58px","borderRadius":"9px","background":"linear-gradient(180deg,#eceef2,#c7ccd5)","boxShadow":"0 12px 18px rgba(0,0,0,.32),inset 0 2px 0 rgba(255,255,255,.85)","transform":"perspective(360px) rotateX(40deg)","transformOrigin":"bottom","padding":"8px 10px"}}>
        <div style={{"width":"100%","height":"34px","borderRadius":"4px","backgroundColor":"#f4f6f9","backgroundImage":"repeating-linear-gradient(90deg, rgba(120,120,140,.32) 0 1.5px, transparent 1.5px 17px), repeating-linear-gradient(0deg, rgba(120,120,140,.32) 0 1.5px, transparent 1.5px 11px)","boxShadow":"inset 0 0 0 1px rgba(0,0,0,.06)"}}></div>
        <div style={{"width":"46%","height":"7px","margin":"5px auto 0","borderRadius":"3px","background":"#e2e6ec","boxShadow":"inset 0 0 0 1px rgba(0,0,0,.05)"}}></div>
      </div>
    </div>

    {/*  GROUP PHOTO FRAME (Community Listening)  */}
    <div style={{"position":"absolute","left":"874px","bottom":"126px","width":"152px","height":"168px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(219,155,47,.6));" onMouseEnter={o.community.enter} onMouseLeave={leave} onClick={o.community.click}>
      { o.community.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Community Listening<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      <div style={{"position":"absolute","inset":"0","transform":"rotate(6deg) scale(0.82)","transformOrigin":"bottom center"}}>
      <div style={{"position":"absolute","left":"0","right":"0","top":"0","height":"140px","background":"linear-gradient(150deg,#caa45a,#9c7636)","borderRadius":"64px 64px 7px 7px","boxShadow":"0 12px 20px rgba(0,0,0,.3)","padding":"11px"}}>
        <div style={{"position":"relative","width":"100%","height":"100%","background":"linear-gradient(180deg,#f4b06a 0%,#efce8e 34%,#8fb6b0 52%,#5e93a0 100%)","borderRadius":"57px 57px 3px 3px","overflow":"hidden","boxShadow":"inset 0 0 0 2px rgba(0,0,0,.18)"}}>
          {/*  Salton Sea backdrop (no sun)  */}
          <div style={{"position":"absolute","left":"0","right":"0","top":"34%","height":"20px","background":"linear-gradient(180deg,#b87b54,#8a5638)","clipPath":"polygon(0 100%,14% 46%,30% 80%,46% 34%,62% 72%,78% 40%,92% 74%,100% 52%,100% 100%)","opacity":".85"}}></div>
          <div style={{"position":"absolute","left":"0","right":"0","top":"50%","bottom":"0","background":"repeating-linear-gradient(180deg, rgba(255,255,255,.16) 0 2px, transparent 2px 10px)","opacity":".55"}}></div>
          {/*  back row  */}
          <div style={{"position":"absolute","left":"8px","bottom":"0","width":"38px","height":"56px"}}><div style={{"position":"absolute","left":"50%","bottom":"0","width":"38px","height":"36px","transform":"translateX(-50%)","borderRadius":"19px 19px 0 0","background":"#c79f3e"}}></div><div style={{"position":"absolute","left":"50%","bottom":"26px","width":"24px","height":"26px","transform":"translateX(-50%)","borderRadius":"50%","background":"#b88a64"}}></div><div style={{"position":"absolute","left":"50%","bottom":"42px","width":"28px","height":"15px","transform":"translateX(-50%)","borderRadius":"14px 14px 0 0","background":"#3a2c20"}}></div></div>
          <div style={{"position":"absolute","right":"8px","bottom":"0","width":"38px","height":"56px"}}><div style={{"position":"absolute","left":"50%","bottom":"0","width":"38px","height":"36px","transform":"translateX(-50%)","borderRadius":"19px 19px 0 0","background":"#3f8e7e"}}></div><div style={{"position":"absolute","left":"50%","bottom":"26px","width":"24px","height":"26px","transform":"translateX(-50%)","borderRadius":"50%","background":"#9c6b48"}}></div><div style={{"position":"absolute","left":"50%","bottom":"42px","width":"28px","height":"14px","transform":"translateX(-50%)","borderRadius":"14px 14px 0 0","background":"#241c16"}}></div></div>
          {/*  front row (taller, overlapping)  */}
          <div style={{"position":"absolute","left":"24px","bottom":"0","width":"44px","height":"70px"}}><div style={{"position":"absolute","left":"50%","bottom":"0","width":"44px","height":"46px","transform":"translateX(-50%)","borderRadius":"22px 22px 0 0","background":"#bd5f4a"}}></div><div style={{"position":"absolute","left":"50%","bottom":"34px","width":"28px","height":"30px","transform":"translateX(-50%)","borderRadius":"50%","background":"#c08a5c"}}></div><div style={{"position":"absolute","left":"50%","bottom":"52px","width":"32px","height":"18px","transform":"translateX(-50%)","borderRadius":"16px 16px 0 0","background":"#2b2018"}}></div></div>
          <div style={{"position":"absolute","right":"22px","bottom":"0","width":"44px","height":"70px"}}><div style={{"position":"absolute","left":"50%","bottom":"0","width":"44px","height":"46px","transform":"translateX(-50%)","borderRadius":"22px 22px 0 0","background":"#4f7aa6"}}></div><div style={{"position":"absolute","left":"50%","bottom":"34px","width":"28px","height":"30px","transform":"translateX(-50%)","borderRadius":"50%","background":"#8a5e3e"}}></div><div style={{"position":"absolute","left":"50%","bottom":"52px","width":"32px","height":"17px","transform":"translateX(-50%)","borderRadius":"16px 16px 0 0","background":"#1e1812"}}></div></div>
        </div>
      </div>
      </div>
    </div>

    {/*  BOOKS (Steward Library)  */}
    <div style={{"position":"absolute","left":"1046px","bottom":"130px","width":"204px","height":"206px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} style-hover="transform:translateY(-7px) scale(1.03);filter:drop-shadow(0 12px 18px rgba(162,117,50,.6));" onMouseEnter={o.library.enter} onMouseLeave={leave} onClick={o.library.click}>
      { o.library.show && (
<><div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Steward Library<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
)}
      <div style={{"position":"absolute","left":"50%","bottom":"-4px","width":"188px","height":"20px","transform":"translateX(-50%)","background":"radial-gradient(ellipse,rgba(0,0,0,.32),transparent 70%)","filter":"blur(4px)","zIndex":"-1","pointerEvents":"none"}}></div>
      <div style={{"position":"absolute","left":"0","right":"0","bottom":"0","height":"100%","display":"flex","alignItems":"flex-end","justifyContent":"center","gap":"5px"}}>
        {/*  bookend  */}
        <div style={{"width":"8px","height":"120px","background":"linear-gradient(90deg,#9a7b3a,#c2a052)","borderRadius":"3px 3px 0 0"}}></div>
        <div style={{"width":"30px","height":"178px","background":"linear-gradient(90deg,#2D4B3E,#3c6452)","borderRadius":"3px 3px 0 0","boxShadow":"inset 2px 0 0 rgba(255,255,255,.1)","position":"relative"}}><div style={{"position":"absolute","left":"5px","right":"5px","top":"22px","height":"2px","background":"rgba(253,221,154,.55)"}}></div><div style={{"position":"absolute","left":"5px","right":"5px","top":"30px","height":"2px","background":"rgba(253,221,154,.4)"}}></div></div>
        <div style={{"width":"26px","height":"160px","background":"linear-gradient(90deg,#A27532,#c79545)","borderRadius":"3px 3px 0 0","position":"relative"}}><div style={{"position":"absolute","left":"5px","right":"5px","top":"24px","height":"2px","background":"rgba(33,40,46,.3)"}}></div></div>
        <div style={{"width":"34px","height":"188px","background":"linear-gradient(90deg,#417C98,#5a97b3)","borderRadius":"3px 3px 0 0","position":"relative","transform":"rotate(-2deg)","transformOrigin":"bottom"}}><div style={{"position":"absolute","left":"6px","right":"6px","top":"30px","height":"14px","border":"1.5px solid rgba(255,255,255,.35)","borderRadius":"3px"}}></div></div>
        <div style={{"width":"24px","height":"150px","background":"linear-gradient(90deg,#DB9B2F,#eab44f)","borderRadius":"3px 3px 0 0"}}></div>
        <div style={{"width":"30px","height":"170px","background":"linear-gradient(90deg,#a8472f,#c75d40)","borderRadius":"3px 3px 0 0","position":"relative"}}><div style={{"position":"absolute","left":"5px","right":"5px","top":"26px","height":"2px","background":"rgba(253,221,154,.5)"}}></div><div style={{"position":"absolute","left":"5px","right":"5px","top":"34px","height":"2px","background":"rgba(253,221,154,.4)"}}></div></div>
        {/*  bookend  */}
        <div style={{"width":"8px","height":"120px","background":"linear-gradient(90deg,#c2a052,#9a7b3a)","borderRadius":"3px 3px 0 0"}}></div>
      </div>
    </div>

  </div>

  {/*  =================== PROTOTYPE CONTROL PANEL ===================  */}
  { isHub && (
<>
  <div style={{"position":"fixed","left":"18px","bottom":"18px","zIndex":"90","display":"flex","gap":"5px","alignItems":"center","background":"rgba(33,40,46,.6)","backdropFilter":"blur(8px)","border":"1px solid rgba(253,221,154,.18)","borderRadius":"11px","padding":"5px","boxShadow":"0 8px 20px rgba(0,0,0,.3)"}}>
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} style-hover="background:rgba(253,221,154,.3);" onClick={setDay}>☀</button>
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} style-hover="background:rgba(253,221,154,.3);" onClick={setDusk}>◑</button>
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} style-hover="background:rgba(253,221,154,.3);" onClick={setNight}>☾</button>
  </div>
  <div style={{"position":"fixed","right":"16px","bottom":"14px","zIndex":"90","fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".04em","color":"rgba(255,255,255,.55)","textShadow":"0 1px 2px rgba(0,0,0,.4)","pointerEvents":"none"}}>Copyright Stewardworks.Space 2026 by Nureaum</div>
  </>
)}

  {/*  =================== MONITOR SUB-HUB ===================  */}
  { isMonitor && (
<>
  <div data-screen-label="Monitor Sub-Hub" style={{"position":"fixed","inset":"0","zIndex":"100","display":"flex","flexDirection":"column","background":"#10161b","animation":"sw-fade .25s ease","fontFamily":"'Exo',sans-serif"}}>
    {/*  OS top bar  */}
    <div style={{"height":"46px","background":"rgba(255,255,255,.92)","display":"flex","alignItems":"center","justifyContent":"space-between","padding":"0 22px","boxShadow":"0 1px 0 rgba(0,0,0,.08)","flex":"none"}}>
      <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
        <span style={{"display":"flex","gap":"6px"}}><i style={{"width":"11px","height":"11px","borderRadius":"50%","background":"#e07a6a","display":"block"}}></i><i style={{"width":"11px","height":"11px","borderRadius":"50%","background":"#e6c25a","display":"block"}}></i><i style={{"width":"11px","height":"11px","borderRadius":"50%","background":"#7fb06a","display":"block"}}></i></span>
        <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".22em","color":"#21282E","opacity":".65"}}>STEWARD OS · WORKSHOPS</span>
      </div>
      <button style={{"background":"none","border":"1px solid rgba(33,40,46,.2)","borderRadius":"8px","padding":"6px 13px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".08em","color":"#21282E","opacity":".75"}} style-hover="background:rgba(33,40,46,.06);" onClick={goHub}>✕ Close screen</button>
    </div>
    {/*  desktop  */}
    <div style={{"flex":"1","position":"relative","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","background":"#13202a","overflow":"hidden"}}>
      {/*  Salton Sea aerial map wallpaper (semi-opaque)  */}
      <img src="/assets/salton-map.jpg" alt="Salton Sea aerial" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","opacity":".4"}} />
      <div style={{"position":"absolute","inset":"0","background":"linear-gradient(180deg,rgba(19,32,42,.45),rgba(19,32,42,.72))","pointerEvents":"none"}}></div>
      <div style={{"textAlign":"center","color":"#fff","marginBottom":"46px","position":"relative","zIndex":"2"}}>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"13px","letterSpacing":".34em","opacity":".85"}}>DESKTOP</div>
        <div style={{"fontSize":"40px","fontWeight":"700","textShadow":"0 2px 8px rgba(0,0,0,.3)","marginTop":"4px"}}>Choose a Program</div>
      </div>
      <div style={{"display":"flex","justifyContent":"center","gap":"64px","flexWrap":"wrap","position":"relative","zIndex":"2"}}>
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} style-hover="transform:translateY(-10px);" onClick={openPilot}>
          <div style={{"width":"128px","height":"128px","borderRadius":"30px","background":"linear-gradient(160deg,#c89248,#8c6125)","boxShadow":"0 18px 32px rgba(0,0,0,.4),inset 0 4px 0 rgba(255,255,255,.32)","display":"flex","alignItems":"center","justifyContent":"center","position":"relative"}}>
            <div style={{"width":"46px","height":"8px","background":"#3a2a16","borderRadius":"3px","transform":"rotate(-42deg)","position":"absolute"}}></div>
            <div style={{"width":"8px","height":"30px","background":"#f3e6cf","borderRadius":"3px","transform":"rotate(-42deg)","position":"absolute","top":"30px","left":"42px"}}></div>
          </div>
          <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"14px","color":"#fff","letterSpacing":".05em","textAlign":"center","textShadow":"0 1px 3px rgba(0,0,0,.45)"}}>Pilot Workshops</span>
        </button>
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} style-hover="transform:translateY(-10px);" onClick={openAi}>
          <div style={{"width":"128px","height":"128px","borderRadius":"30px","background":"linear-gradient(160deg,#4f93ad,#356074)","boxShadow":"0 18px 32px rgba(0,0,0,.4),inset 0 4px 0 rgba(255,255,255,.32)","display":"flex","alignItems":"center","justifyContent":"center"}}>
            <div style={{"width":"30px","height":"54px","border":"5px solid #eaf6fb","borderRadius":"0 0 16px 16px","borderTop":"none","position":"relative","background":"linear-gradient(180deg,transparent 42%,#9be0a8 42%)"}}><div style={{"position":"absolute","top":"-9px","left":"50%","width":"18px","height":"5px","background":"#eaf6fb","transform":"translateX(-50%)","borderRadius":"2px"}}></div></div>
          </div>
          <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"14px","color":"#fff","letterSpacing":".05em","textAlign":"center","textShadow":"0 1px 3px rgba(0,0,0,.45)"}}>AI Lab</span>
        </button>
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} style-hover="transform:translateY(-10px);" onClick={openWf}>
          <div style={{"width":"128px","height":"128px","borderRadius":"30px","background":"linear-gradient(160deg,#41855a,#285537)","boxShadow":"0 18px 32px rgba(0,0,0,.4),inset 0 4px 0 rgba(255,255,255,.32)","display":"flex","alignItems":"center","justifyContent":"center"}}>
            <div style={{"width":"54px","height":"42px","position":"relative"}}>
              <div style={{"position":"absolute","inset":"0","border":"4px solid #eaf6e8","borderRadius":"5px"}}></div>
              <div style={{"position":"absolute","left":"18px","top":"-2px","bottom":"-2px","width":"3px","background":"#eaf6e8"}}></div>
              <div style={{"position":"absolute","right":"14px","top":"-2px","bottom":"-2px","width":"3px","background":"#eaf6e8"}}></div>
              <div style={{"position":"absolute","left":"8px","top":"24px","width":"7px","height":"7px","borderRadius":"50%","background":"#ffd24a"}}></div>
            </div>
          </div>
          <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"14px","color":"#fff","letterSpacing":".05em","textAlign":"center","textShadow":"0 1px 3px rgba(0,0,0,.45)"}}>Workforce Development</span>
        </button>
      </div>
      <div style={{"position":"relative","zIndex":"2","marginTop":"44px","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".2em","color":"rgba(255,255,255,.78)"}}>CLICK AN APP TO OPEN</div>
    </div>
    {/*  taskbar  */}
    <div style={{"height":"56px","background":"rgba(16,22,27,.92)","display":"flex","alignItems":"center","justifyContent":"space-between","padding":"0 22px","flex":"none"}}>
      <div style={{"display":"flex","alignItems":"center","gap":"14px"}}>
        <div style={{"width":"30px","height":"30px","borderRadius":"8px","background":"rgba(255,255,255,.95)","boxShadow":"0 3px 8px rgba(0,0,0,.4)","display":"flex","alignItems":"center","justifyContent":"center","padding":"3px"}}><img src="/assets/sw-logo.png" alt="StewardWorks" style={{"width":"100%","height":"100%","objectFit":"contain","display":"block"}} /></div>
        <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".22em","color":"rgba(255,255,255,.5)"}}>STEWARDSHIP ACTIVE</span>
      </div>
      <button style={{"background":"rgba(255,255,255,.1)","border":"1px solid rgba(255,255,255,.25)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".06em","color":"#FEFAE0"}} style-hover="background:rgba(255,255,255,.2);" onClick={goHub}>← Back to desk</button>
    </div>
  </div>
  </>
)}

  {/*  =================== MEDITATION SPACE ===================  */}
  { isMeditation && (
<>
  <div data-screen-label="Meditation Space" style={medBgStyle}>
    <button style={{"position":"absolute","top":"24px","left":"24px","background":"rgba(255,255,255,.18)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"10px","padding":"9px 15px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".06em","color":"#fff","backdropFilter":"blur(6px)"}} onClick={goHub}>← Back to desk</button>

    <div style={medHeadStyle}>
      <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".34em","opacity":".7"}}>WELLNESS · MEDITATION</div>
      <div style={{"fontSize":"26px","fontWeight":"600","letterSpacing":".02em"}}>Take a breath</div>
    </div>

    {/*  breathing circle + timer  */}
    <div style={{"position":"relative","width":"280px","height":"280px","display":"flex","alignItems":"center","justifyContent":"center","margin":"14px 0 26px"}}>
      <div style={{"position":"absolute","width":"240px","height":"240px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.35)"}}></div>
      <div style={medRingStyle}></div>
      <div style={medTimerStyle}>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"54px","fontWeight":"500","letterSpacing":".04em"}}>{medDisplay}</div>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".3em","opacity":".7"}}>BREATHE IN · OUT</div>
      </div>
    </div>

    {/*  presets  */}
    <div style={{"display":"flex","gap":"10px","marginBottom":"14px"}}>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med1}>1 min</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med5}>5 min</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med10}>10 min</button>
    </div>
    {/*  play controls  */}
    <div style={{"display":"flex","gap":"12px","alignItems":"center","marginBottom":"22px"}}>
      <button style={{"background":"#FEFAE0","border":"none","borderRadius":"11px","padding":"13px 34px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontWeight":"500","fontSize":"14px","letterSpacing":".08em","color":"#21282E","boxShadow":"0 8px 18px rgba(0,0,0,.25)"}} onClick={medToggle}>{medPlayLabel}</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"11px","padding":"13px 18px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={medReset}>Reset</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"11px","padding":"13px 18px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={medToneToggle}>{medToneLabel}</button>
    </div>

    {/*  ambient theme swatches  */}
    <div style={{"display":"flex","gap":"12px","alignItems":"center","marginBottom":"24px"}}>
      <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".2em","color":"#fff","opacity":".7"}}>AMBIENT</span>
      <button title="Desert Dawn" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#F7CDA6,#DB9B2F)"}} onClick={medTheme0}></button>
      <button title="Salton Dusk" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#E7A07E,#5A4A6A)"}} onClick={medTheme1}></button>
      <button title="Sage Calm" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#9DB39A,#2D4B3E)"}} onClick={medTheme2}></button>
      <button title="Night Field" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#4A5A6E,#21282E)"}} onClick={medTheme3}></button>
    </div>

    {/*  resources  */}
    <div style={{"display":"flex","gap":"12px","flexWrap":"wrap","justifyContent":"center","maxWidth":"680px"}}>
      <div style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.35)","borderRadius":"12px","padding":"12px 16px","backdropFilter":"blur(6px)","color":"#fff","width":"200px"}}>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","opacity":".7","marginBottom":"4px"}}>GROUNDING</div>
        <div style={{"fontSize":"14px","fontWeight":"600"}}>4-7-8 Breathing</div>
        <div style={{"fontSize":"12px","opacity":".85","lineHeight":"1.4"}}>Inhale 4 · hold 7 · exhale 8.</div>
      </div>
      <div style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.35)","borderRadius":"12px","padding":"12px 16px","backdropFilter":"blur(6px)","color":"#fff","width":"200px"}}>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","opacity":".7","marginBottom":"4px"}}>SUPPORT</div>
        <div style={{"fontSize":"14px","fontWeight":"600"}}>988 Lifeline</div>
        <div style={{"fontSize":"12px","opacity":".85","lineHeight":"1.4"}}>Call or text 988 anytime, free &amp; confidential.</div>
      </div>
      <div style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.35)","borderRadius":"12px","padding":"12px 16px","backdropFilter":"blur(6px)","color":"#fff","width":"200px"}}>
        <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","opacity":".7","marginBottom":"4px"}}>TEXT</div>
        <div style={{"fontSize":"14px","fontWeight":"600"}}>Crisis Text Line</div>
        <div style={{"fontSize":"12px","opacity":".85","lineHeight":"1.4"}}>Text HOME to 741741.</div>
      </div>
    </div>
  </div>
  </>
)}

  {/*  =================== PROGRESS & GENERATIONS ===================  */}
  { isProgress && (
<>
  <div data-screen-label="Progress & Generations" style={{"position":"fixed","inset":"0","zIndex":"100","overflowY":"auto","background":"linear-gradient(180deg,#f6ddc4,#e8c2a0)","animation":"sw-fade .3s ease","fontFamily":"'Exo',sans-serif"}}>
    <div style={{"maxWidth":"920px","margin":"0 auto","padding":"30px 26px 60px"}}>
      <button style={{"background":"#21282E","border":"none","borderRadius":"10px","padding":"9px 15px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".06em","color":"#FEFAE0","marginBottom":"24px"}} onClick={goHub}>← Back to desk</button>

      <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".3em","color":"#8a5a2e"}}>PROGRESS &amp; GENERATIONS</div>
      <h1 style={{"margin":"4px 0 24px","fontSize":"34px","fontWeight":"700","color":"#3a2412"}}>Your chia is growing.</h1>

      {/*  progress meter + chia  */}
      <div style={{"display":"flex","gap":"24px","flexWrap":"wrap","alignItems":"stretch","marginBottom":"30px"}}>
        <div style={{"flex":"1","minWidth":"280px","background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.12)","borderRadius":"16px","padding":"22px","boxShadow":"0 12px 26px rgba(0,0,0,.08)"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"baseline","marginBottom":"14px"}}>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".18em","color":"#8a5a2e"}}>OVERALL PROGRESS</span>
            <span style={{"fontSize":"32px","fontWeight":"700","color":"#3a2412"}}>{progressPct}</span>
          </div>
          <div style={{"height":"18px","background":"rgba(33,40,46,.08)","borderRadius":"10px","overflow":"hidden","marginBottom":"18px"}}>
            <div style={progressBarStyle}></div>
          </div>
          <div style={{"display":"flex","gap":"10px"}}>
            <button style={{"flex":"1","background":"#2E5534","color":"#FEFAE0","border":"none","borderRadius":"9px","padding":"11px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={incProg}>+ Grow (+5%)</button>
            <button style={{"flex":"1","background":"rgba(33,40,46,.08)","color":"#3a2412","border":"none","borderRadius":"9px","padding":"11px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={decProg}>− Reset (−5%)</button>
          </div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","marginTop":"12px","lineHeight":"1.5"}}>Progress is shared with the chia statue on your desk — its sprouts grow taller as you complete milestones.</div>
        </div>
        {/*  mirrored chia visual  */}
        <div style={{"width":"200px","background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.12)","borderRadius":"16px","padding":"18px","boxShadow":"0 12px 26px rgba(0,0,0,.08)","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"flex-end"}}>
          <div style={chiaBigStyle}>
            <div style={{"width":"6px","height":"60%","background":"linear-gradient(180deg,#9bc04a,#5f7d1f)","borderRadius":"4px","transform":"rotate(-14deg)","transformOrigin":"bottom"}}></div>
            <div style={{"width":"6px","height":"88%","background":"linear-gradient(180deg,#a6cb55,#6B8E23)","borderRadius":"4px","transform":"rotate(-5deg)","transformOrigin":"bottom"}}></div>
            <div style={{"width":"6px","height":"100%","background":"linear-gradient(180deg,#b4d65f,#74992a)","borderRadius":"4px"}}></div>
            <div style={{"width":"6px","height":"84%","background":"linear-gradient(180deg,#a6cb55,#6B8E23)","borderRadius":"4px","transform":"rotate(7deg)","transformOrigin":"bottom"}}></div>
            <div style={{"width":"6px","height":"62%","background":"linear-gradient(180deg,#9bc04a,#5f7d1f)","borderRadius":"4px","transform":"rotate(15deg)","transformOrigin":"bottom"}}></div>
          </div>
          <div style={{"width":"64px","height":"60px","borderRadius":"50% 50% 46% 46%","background":"linear-gradient(160deg,#c3b4d4,#9384ad)"}}></div>
          <div style={{"width":"80px","height":"18px","borderRadius":"5px","background":"linear-gradient(180deg,#3f7488,#2c5566)","marginTop":"-2px"}}></div>
        </div>
      </div>

      {/*  saved / generated  */}
      <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".2em","color":"#8a5a2e","marginBottom":"12px"}}>SAVED &amp; GENERATED — your library of bookmarks and creations</div>
      <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fill,minmax(200px,1fr))","gap":"14px"}}>
        <div style={{"background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.1)","borderRadius":"13px","padding":"16px","boxShadow":"0 8px 18px rgba(0,0,0,.06)"}}>
          <span style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"9px","letterSpacing":".14em","background":"#417C98","color":"#fff","padding":"3px 8px","borderRadius":"20px","marginBottom":"10px"}}>BOOKMARK</span>
          <div style={{"fontWeight":"700","color":"#3a2412","fontSize":"15px","lineHeight":"1.3"}}>Salton Sea Restoration Guide</div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","marginTop":"5px"}}>Saved from Steward Library</div>
        </div>
        <div style={{"background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.1)","borderRadius":"13px","padding":"16px","boxShadow":"0 8px 18px rgba(0,0,0,.06)"}}>
          <span style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"9px","letterSpacing":".14em","background":"#2E5534","color":"#fff","padding":"3px 8px","borderRadius":"20px","marginBottom":"10px"}}>GENERATION</span>
          <div style={{"fontWeight":"700","color":"#3a2412","fontSize":"15px","lineHeight":"1.3"}}>My Eco-Career Roadmap</div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","marginTop":"5px"}}>Created in AI Lab</div>
        </div>
        <div style={{"background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.1)","borderRadius":"13px","padding":"16px","boxShadow":"0 8px 18px rgba(0,0,0,.06)"}}>
          <span style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"9px","letterSpacing":".14em","background":"#A27532","color":"#fff","padding":"3px 8px","borderRadius":"20px","marginBottom":"10px"}}>NOTE</span>
          <div style={{"fontWeight":"700","color":"#3a2412","fontSize":"15px","lineHeight":"1.3"}}>Workshop reflections</div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","marginTop":"5px"}}>Pilot Workshops · bilingual media</div>
        </div>
        <div style={{"background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.1)","borderRadius":"13px","padding":"16px","boxShadow":"0 8px 18px rgba(0,0,0,.06)"}}>
          <span style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"9px","letterSpacing":".14em","background":"#417C98","color":"#fff","padding":"3px 8px","borderRadius":"20px","marginBottom":"10px"}}>BOOKMARK</span>
          <div style={{"fontWeight":"700","color":"#3a2412","fontSize":"15px","lineHeight":"1.3"}}>Imperial County Green Jobs</div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","marginTop":"5px"}}>Saved from Workforce Development</div>
        </div>
      </div>
    </div>
  </div>
  </>
)}

  {/*  =================== BRIDGE / LINK SCREEN ===================  */}
  { isBridge && (
<>
  <div data-screen-label="Link Bridge" style={{"position":"fixed","inset":"0","zIndex":"100","display":"flex","alignItems":"center","justifyContent":"center","background":"rgba(20,12,8,.7)","backdropFilter":"blur(5px)","animation":"sw-fade .25s ease","fontFamily":"'Exo',sans-serif"}}>
    <div style={{"width":"min(460px,92vw)","background":"linear-gradient(170deg,#FEFAE0,#f3e7c8)","borderRadius":"20px","boxShadow":"0 30px 70px rgba(0,0,0,.5)","padding":"34px 30px 28px","textAlign":"center","border":"1px solid rgba(162,117,50,.3)"}}>
      <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".26em","color":"#8a5a2e","marginBottom":"6px"}}>YOU'RE ENTERING</div>
      <h2 style={{"margin":"0 0 14px","fontSize":"28px","fontWeight":"700","color":"#3a2412"}}>{bridgeTitle}</h2>
      <div style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"12px","background":"#21282E","color":"#FDDD9A","padding":"6px 14px","borderRadius":"20px","marginBottom":"18px"}}>{bridgeRoute}</div>
      <p style={{"fontSize":"14px","lineHeight":"1.6","color":"#5a4226","margin":"0 0 26px"}}>{bridgeBlurb}</p>
      <div style={{"display":"flex","gap":"10px"}}>
        <button style={{"flex":"1","background":"rgba(33,40,46,.08)","color":"#3a2412","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={bridgeBack}>← Back</button>
        { isLogout && (
<><button style={{"flex":"1","background":"#c0492f","color":"#fff","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={confirmLogout}>Confirm log out</button></>
)}
        { isLink && (
<><button style={{"flex":"1","background":"#2E5534","color":"#FEFAE0","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={() => router.push(bridgeRoute)}>Open page →</button></>
)}
      </div>
      <div style={{"fontSize":"11px","color":"#9a7a4a","marginTop":"14px","fontFamily":"'DM Mono',monospace"}}>Prototype · links to the route above in the live app</div>
    </div>
  </div>
  </>
)}

  {/*  =================== LOGGED OUT ===================  */}
  { isLoggedOut && (
<>
  <div data-screen-label="Signed Out" style={{"position":"fixed","inset":"0","zIndex":"110","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","background":"radial-gradient(circle at 50% 36%, #2a3744 0%, #1a232c 60%, #11171c 100%)","animation":"sw-fade .3s ease","fontFamily":"'Exo',sans-serif","color":"#FEFAE0","textAlign":"center"}}>
    <div style={{"width":"64px","height":"64px","borderRadius":"16px","background":"linear-gradient(160deg,#DB9B2F,#A27532)","boxShadow":"0 10px 24px rgba(0,0,0,.45)","marginBottom":"24px"}}></div>
    <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".32em","color":"#9fe6ff","textShadow":"0 0 10px rgba(90,200,255,.5)"}}>STEWARD.WORKS</div>
    <h1 style={{"margin":"10px 0 8px","fontSize":"34px","fontWeight":"700"}}>You're signed out</h1>
    <p style={{"margin":"0 0 28px","fontSize":"15px","color":"rgba(254,250,224,.7)","maxWidth":"380px","lineHeight":"1.6"}}>In the live app this clears your session and returns you to the login screen (<span style={{"fontFamily":"'DM Mono',monospace","color":"#FDDD9A"}}>/login</span>).</p>
    <button style={{"background":"#FEFAE0","color":"#21282E","border":"none","borderRadius":"12px","padding":"14px 30px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontWeight":"500","fontSize":"14px","letterSpacing":".06em","boxShadow":"0 8px 20px rgba(0,0,0,.35)"}} onClick={goHub}>Log back in →</button>
  </div>
  </>
)}

</div>

    </div>
  );
}
