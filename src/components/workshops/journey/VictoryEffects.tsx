import React from 'react';

// Extracted from original HTML prototype — EXACT copy of reference

export function getCelebrateProps() {
  const P: any[] = [];
  const H = 214; // horizon line, px from top
  
  P.push({
    key: 'horizon',
    style: {
      position: 'absolute', left: '5%', right: '5%', top: `${H}px`, height: '2px',
      background: 'linear-gradient(90deg,transparent,rgba(255,210,63,.4),rgba(69,214,255,.32),transparent)'
    }
  });

  P.push({
    key: 'palm',
    style: {
      position: 'absolute', left: '9%', top: `${H - 96}px`, width: '48px', height: '96px',
      background: '#2f8551', clipPath: 'polygon(46% 100%,54% 100%,52% 34%,84% 10%,54% 26%,66% 0,50% 22%,34% 0,48% 26%,18% 8%,50% 34%)',
      opacity: 0.3
    }
  });
  P.push({
    key: 'fern',
    style: {
      position: 'absolute', left: '20%', top: `${H - 40}px`, width: '54px', height: '40px',
      background: '#2f8551', borderRadius: '0 70% 0 70%', opacity: 0.22
    }
  });
  P.push({
    key: 'srv1',
    style: {
      position: 'absolute', left: '44%', top: `${H - 70}px`, width: '22px', height: '70px',
      background: 'linear-gradient(180deg,#7a8296,#3a4358)', opacity: 0.26
    }
  });
  P.push({
    key: 'srv2',
    style: {
      position: 'absolute', left: '52%', top: `${H - 94}px`, width: '16px', height: '94px',
      background: 'linear-gradient(180deg,#7a8296,#3a4358)', opacity: 0.26
    }
  });
  P.push({
    key: 'gantry',
    style: {
      position: 'absolute', right: '16%', top: `${H - 104}px`, width: '10px', height: '104px',
      background: 'repeating-linear-gradient(0deg,#b0563e,#b0563e 9px,transparent 9px,transparent 15px)', opacity: 0.3
    }
  });
  P.push({
    key: 'rocket',
    style: {
      position: 'absolute', right: '11%', top: `${H - 86}px`, width: '22px', height: '86px',
      background: 'linear-gradient(180deg,#f2e6cf,#c98a52)', borderRadius: '50% 50% 5px 5px/40% 40% 5px 5px', opacity: 0.32
    }
  });

  const stars = [[14, 40], [27, 24], [41, 52], [58, 28], [71, 58], [83, 36], [90, 64], [34, 72], [64, 78], [20, 86], [48, 18]];
  stars.forEach((p, i) => P.push({
    key: `str${i}`,
    style: {
      position: 'absolute', left: `${p[0]}%`, top: `${p[1]}px`, width: '3px', height: '3px',
      borderRadius: '50%', background: '#fff2c8', boxShadow: '0 0 6px #ffe9a0',
      animation: `twinkle ${2 + (i % 4) * 0.6}s ease-in-out ${(i % 5) * 0.4}s infinite`
    }
  }));

  const cols = ['#7bf0b4', '#9fd0e0', '#ffd66a', '#ff9a6a', '#ff8ad8'];
  for (let i = 0; i < 14; i++) {
    const c = cols[i % cols.length];
    const sz = (i % 3) + 3;
    P.push({
      key: `pt${i}`,
      style: {
        position: 'absolute', left: `${6 + i * 6.4}%`, top: `${148 + ((i * 53) % 78)}px`,
        width: `${sz}px`, height: `${sz}px`, borderRadius: '50%',
        background: `radial-gradient(circle,${c},transparent 70%)`, boxShadow: `0 0 ${sz * 2}px ${c}`,
        animation: `rise ${3.4 + (i % 4) * 0.6}s ease-in-out ${(i * 0.3).toFixed(1)}s infinite`
      }
    });
  }
  return P;
}

const SIGFEATURE: Record<string, string> = {
  nayeli: "SONGKEEPER'S ECHO — a bilingual voice aura that carries two tongues at once",
  mateo: "TINKER'S KIT — assembles scrap logic into makeshift solutions",
  sam: "ARCHITECT'S SCAN — visualizes structural blueprints of underlying systems",
  quest: "WAYFINDER'S COMPASS — pings the nearest authentic learning signal",
  roadrunner: "DESERT DASH — leaves a trail of rapid-fire micro-insights",
  coyote: "TRICKSTER'S NOSE — sniffs out hidden assumptions and flips them",
  tortoise: "ANCIENT SHELL — deploys a slow, heavy dome of deep reflection",
  jackrabbit: "JACKRABBIT LEAP — bounces over rigid curriculum boundaries",
  quail: "COVEY CALL — summons a chaotic but protective flock of ideas",
  chuckwalla: "SUN BASKER — absorbs ambient critique and radiates warmth",
  kitfox: "NIGHT VISION — sees connections in the dark spaces between disciplines",
  bighorn: "SURE-FOOTED CLIMB — scales towering walls of institutional jargon",
};

export function getWinSkill(id: string) {
  const text = SIGFEATURE[id] || 'Steward — walks the honest path ahead';
  const parts = text.split(' — ');
  const title = (parts[0] || 'STEWARD').toUpperCase();
  const desc = parts[1] || '';

  const P = 'var(--p,#ff5fd2)', S = 'var(--s,#45d6ff)', OK = 'var(--ok,#74f0a0)', G = 'var(--gold,#ffd23f)';

  const ring = (color: string, size: number, top: number, dur: number, delay: number) => ({
    style: {
      position: 'absolute', left: '50%', top: top + 'px', width: size + 'px', height: size + 'px',
      marginLeft: (-size / 2) + 'px', marginTop: (-size / 2) + 'px', border: '3px solid ' + color,
      borderRadius: '50%', opacity: 0, animation: 'skRing ' + dur + 's ease-out ' + delay + 's infinite',
      boxShadow: '0 0 12px ' + color
    } as any
  });
  const glyph = (ch: string, color: string, left: number, dur: number, delay: number, size?: number) => ({
    ch, style: {
      position: 'absolute', left: left + '%', bottom: '46px', fontFamily: "'VT323',monospace",
      fontSize: (size || 26) + 'px', color, textShadow: '0 0 8px ' + color, opacity: 0,
      animation: 'skNote ' + dur + 's ease-in ' + delay + 's infinite'
    } as any
  });
  const spark = (color: string, left: number, top: number, delay: number) => ({
    style: {
      position: 'absolute', left: left + '%', top: top + 'px', width: '6px', height: '6px',
      background: color, borderRadius: '50%', boxShadow: '0 0 10px ' + color, opacity: 0,
      animation: 'skSpark ' + (1.2 + delay * 0.2) + 's ease-in-out ' + delay + 's infinite'
    } as any
  });
  const streak = (color: string, top: number, delay: number) => ({
    style: {
      position: 'absolute', left: '54%', top: top + 'px', width: '44px', height: '4px',
      borderRadius: '3px', background: 'linear-gradient(90deg,transparent,' + color + ')', opacity: 0,
      animation: 'skStreak 0.9s linear ' + delay + 's infinite'
    } as any
  });
  const orbit = (ch: string, color: string, rad: number, dur: number, delay: number, size: number, dir: number) => ({
    ch, style: {
      position: 'absolute', left: '50%', top: '92px', marginLeft: (-(size || 20) / 2) + 'px', marginTop: (-(size || 20) / 2) + 'px',
      fontFamily: "'VT323',monospace", fontSize: (size || 20) + 'px', color, textShadow: '0 0 8px ' + color,
      '--orb': rad + 'px', animation: 'skOrbit' + (dir < 0 ? 'R' : '') + ' ' + dur + 's linear ' + delay + 's infinite'
    } as any
  });
  const pop = (ch: string, color: string, left: number, dur: number, delay: number, size?: number) => ({
    ch, style: {
      position: 'absolute', left: left + '%', bottom: '56px', fontFamily: "'VT323',monospace",
      fontSize: (size || 24) + 'px', color, textShadow: '0 0 8px ' + color, opacity: 0,
      animation: 'skPop ' + dur + 's ease-in-out ' + delay + 's infinite'
    } as any
  });
  const beam = (color: string, left: number, top: number, hgt: number, dur: number, delay: number) => ({
    style: {
      position: 'absolute', left: left + '%', top: top + 'px', width: '7px', height: (hgt || 64) + 'px',
      marginLeft: '-3px', borderRadius: '4px', background: 'linear-gradient(180deg,transparent,' + color + ' 45%,transparent)',
      boxShadow: '0 0 14px ' + color, transformOrigin: 'center', opacity: 0,
      animation: 'skBeam ' + (dur || 1.6) + 's ease-in-out ' + delay + 's infinite'
    } as any
  });
  const rain = (color: string, left: number, top: number, dur: number, delay: number, sz?: number) => ({
    style: {
      position: 'absolute', left: left + '%', top: top + 'px', width: (sz || 4) + 'px', height: (sz || 4) + 'px',
      borderRadius: '50%', background: color, boxShadow: '0 0 8px ' + color, opacity: 0,
      animation: 'skRain ' + dur + 's linear ' + delay + 's infinite'
    } as any
  });
  const zig = (color: string, top: number, dur: number, delay: number) => ({
    style: {
      position: 'absolute', left: '20%', top: top + 'px', width: '40px', height: '4px',
      borderRadius: '3px', background: 'linear-gradient(90deg,transparent,' + color + ')',
      boxShadow: '0 0 10px ' + color, opacity: 0, animation: 'skZig ' + dur + 's ease-in-out ' + delay + 's infinite'
    } as any
  });

  let fx: any[] = [], glyphs: any[] = [], tone = S, motion = 'floaty 2.4s ease-in-out infinite';

  switch (id) {
    case 'nayeli':
      tone = P;
      fx = [ring(P, 62, 96, 2.4, 0), beam(P, 50, 54, 72, 1.8, 0.4)];
      glyphs = [glyph('\u266A', P, 34, 2.4, 0, 30), glyph('\u266B', S, 58, 2.6, 0.9, 24), glyph('\u2669', P, 48, 2.2, 1.6, 22), orbit('\u266C', S, 52, 5, 0, 22, 1)];
      break;
    case 'mateo':
      tone = G;
      motion = 'skWobble 1.1s ease-in-out infinite';
      fx = [spark(G, 30, 42, 0), spark(G, 66, 56, 0.5), spark('#fff', 48, 32, 1), spark(G, 58, 74, 0.8), zig(G, 60, 1.6, 0.2)];
      glyphs = [pop('\u2726', G, 40, 2, 0.2, 24), pop('\u2727', G, 60, 2, 1, 20), pop('\u2726', S, 50, 2, 1.6, 18)];
      break;
    case 'sam':
      tone = S;
      fx = [beam(S, 50, 50, 80, 1.6, 0), spark(S, 38, 60, 0.2), spark(OK, 62, 54, 0.8)];
      glyphs = [orbit('\u25C8', S, 50, 6, 0, 22, 1), orbit('\u25C7', OK, 32, 4.5, 0.3, 18, -1), pop('\u25AE', S, 50, 2, 1.2, 16)];
      break;
    case 'quest':
      tone = P;
      fx = [{ style: { position: 'absolute', left: '50%', top: '86px', width: '120px', height: '120px', marginLeft: '-60px', marginTop: '-60px', border: '3px dashed ' + P, borderRadius: '50%', opacity: 0.75, animation: 'skSpin 6s linear infinite', boxShadow: '0 0 16px ' + P } as any }, beam(P, 50, 54, 60, 2, 0.5)];
      glyphs = [orbit('\u2318', S, 54, 7, 0, 22, 1), orbit('\u25C8', P, 34, 5, 0.4, 18, -1), pop('\u2726', G, 50, 2, 1.4, 16)];
      break;
    case 'roadrunner':
      tone = OK;
      motion = 'skDash 0.8s ease-in-out infinite';
      fx = [streak(OK, 70, 0), streak(OK, 88, 0.2), streak('#fff', 106, 0.4), streak(OK, 124, 0.15), rain(OK, 30, 92, 0.9, 0, 3), rain(OK, 40, 112, 1.1, 0.3, 3)];
      glyphs = [pop('\u00BB', OK, 40, 1.2, 0, 22), pop('\u00BB', OK, 52, 1.2, 0.4, 18)];
      break;
    case 'coyote':
      tone = OK;
      motion = 'skWobble 1.4s ease-in-out infinite';
      glyphs = [pop('?', G, 66, 2, 0.2, 26), orbit('\u223F', OK, 40, 5, 0, 22, -1), pop('\u223F', OK, 54, 2.4, 1, 20)];
      fx = [spark(OK, 64, 54, 0.3), zig(OK, 64, 1.6, 0.4)];
      break;
    case 'tortoise':
      tone = G;
      motion = 'floaty 4s ease-in-out infinite';
      fx = [ring(G, 90, 96, 3.6, 0), beam(G, 50, 58, 50, 3, 0.6)];
      glyphs = [orbit('\u25C8', G, 44, 9, 0, 20, 1), pop('\u25B2', G, 50, 3.2, 1, 16)];
      break;
    case 'jackrabbit':
      tone = S;
      motion = 'skLeap 1.5s ease-in-out infinite';
      fx = [streak(S, 150, 0.1), streak(S, 150, 0.7), spark(S, 42, 150, 0.2), spark(S, 60, 150, 0.9)];
      glyphs = [pop('!', S, 58, 1.6, 0.2, 26), pop('\u2727', S, 66, 1.8, 0.9, 18)];
      break;
    case 'quail':
      tone = P;
      fx = [rain(P, 34, 80, 1.2, 0, 4), rain(S, 46, 78, 1.3, 0.3, 4), rain(G, 58, 80, 1.1, 0.6, 4), rain(P, 68, 82, 1.4, 0.9, 4), spark(P, 50, 60, 0.2)];
      glyphs = [pop('\u2022', P, 40, 1.8, 0.2, 26), pop('\u2022', S, 60, 1.8, 0.8, 22)];
      break;
    case 'chuckwalla':
      tone = G;
      fx = [{ style: { position: 'absolute', left: '50%', top: '80px', width: '160px', height: '160px', marginLeft: '-80px', marginTop: '-80px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,210,63,.28),transparent 62%)', animation: 'skShimmer 2.2s ease-in-out infinite' } as any }, spark(G, 30, 46, 0), spark('#ff8a4a', 68, 60, 0.6), spark(G, 54, 32, 1.1), beam(G, 50, 50, 60, 2, 0.4)];
      glyphs = [glyph('\u2726', G, 46, 2.4, 0.4, 22), glyph('\u2727', '#ff8a4a', 58, 2.6, 1.2, 18)];
      break;
    case 'kitfox':
      tone = S;
      fx = [{ style: { position: 'absolute', inset: '0', borderRadius: '12px', background: 'radial-gradient(circle at 50% 62%,transparent 28%,rgba(6,4,16,.62))', animation: 'skShimmer 3s ease-in-out infinite' } as any }, spark(S, 42, 66, 0), spark(S, 58, 66, 0.4), spark('#fff', 50, 42, 1)];
      glyphs = [orbit('\u2726', S, 46, 6, 0, 18, 1), glyph('\u2727', S, 60, 2.4, 0.7, 20)];
      break;
    case 'bighorn':
      tone = G;
      motion = 'skClimb 1.8s ease-in-out infinite';
      glyphs = [pop('\u25B2', G, 48, 1.8, 0, 22), pop('\u25B2', G, 56, 1.8, 0.6, 18), pop('\u25B2', G, 64, 1.8, 1.1, 14)];
      fx = [spark(G, 40, 62, 0.3), spark(G, 60, 50, 0.9), beam(G, 50, 56, 54, 2, 0.5)];
      break;
    default:
      fx = [ring(S, 72, 96, 2, 0)];
  }

  const heroStyle = { imageRendering: 'pixelated', display: 'block', filter: 'drop-shadow(0 0 14px ' + tone + ')', animation: motion } as any;

  return { title, desc, tone, fx, glyphs, heroStyle };
}

export function buildCastFx(id: string, n: number) {
  if (!n) return null;
  const P = 'var(--p,#ff5fd2)', S = 'var(--s,#45d6ff)', OK = 'var(--ok,#74f0a0)', G = 'var(--gold,#ffd23f)', W = '#ffffff';
  const B: any = { position: 'absolute', pointerEvents: 'none' };
  const cx = '50%', cy = '96px', TAU = Math.PI * 2;

  const flash = (c: string, sz: number, dur?: number) => (
    <div key="fl" style={{ ...B, left: cx, top: cy, width: sz + 'px', height: sz + 'px', marginLeft: (-sz / 2) + 'px', marginTop: (-sz / 2) + 'px', borderRadius: '50%', background: 'radial-gradient(circle,' + c + ',transparent 62%)', animation: 'skFlash ' + (dur || 0.7) + 's ease-out both' }} />
  );
  const ring = (k: string, c: string, dur: number, delay: number) => (
    <div key={k} style={{ ...B, left: cx, top: cy, width: '54px', height: '54px', marginLeft: '-27px', marginTop: '-27px', border: '3px solid ' + c, borderRadius: '50%', boxShadow: '0 0 18px ' + c, animation: 'cShieldD ' + dur + 's ease-out ' + delay + 's both' }} />
  );
  const scatter = (k: string, ang: number, c: string, ch: string | null, dist: number, sz: number, dur: number, delay?: number) => {
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    const st: any = { ...B, left: cx, top: cy, marginLeft: (-sz / 2) + 'px', marginTop: (-sz / 2) + 'px', '--dx': dx.toFixed(0) + 'px', '--dy': dy.toFixed(0) + 'px', animation: 'cScatter ' + dur + 's ease-out ' + (delay || 0) + 's both' };
    if (ch != null) {
      st.fontFamily = "'VT323',monospace"; st.fontSize = sz + 'px'; st.lineHeight = '1'; st.color = c; st.textShadow = '0 0 8px ' + c;
      return <div key={k} style={st}>{ch}</div>;
    }
    st.width = sz + 'px'; st.height = sz + 'px'; st.background = c; st.borderRadius = '50%'; st.boxShadow = '0 0 8px ' + c;
    return <div key={k} style={st} />;
  };
  const rise = (k: string, ch: string, c: string, left: number, sz: number, dur: number, delay?: number) => (
    <div key={k} style={{ ...B, left: left + '%', top: '132px', fontFamily: "'VT323',monospace", fontSize: sz + 'px', lineHeight: '1', color: c, textShadow: '0 0 8px ' + c, animation: 'cRise ' + dur + 's ease-out ' + (delay || 0) + 's both' }}>{ch}</div>
  );
  const beamX = (k: string, c: string, top: number, dur: number, delay?: number) => (
    <div key={k} style={{ ...B, left: '0', top: top + 'px', width: '82px', height: '5px', borderRadius: '3px', background: 'linear-gradient(90deg,transparent,' + c + ')', boxShadow: '0 0 14px ' + c, animation: 'cSweepX ' + dur + 's linear ' + (delay || 0) + 's both' }} />
  );
  const ray = (k: string, ang: number, c: string, dur: number, delay?: number) => (
    <div key={k} style={{ ...B, left: cx, top: cy, width: '6px', height: '70px', marginLeft: '-3px', marginTop: '-35px', transformOrigin: 'center center', '--ang': ang + 'deg', borderRadius: '3px', background: 'linear-gradient(180deg,' + c + ',transparent)', boxShadow: '0 0 10px ' + c, animation: 'cRay ' + dur + 's ease-out ' + (delay || 0) + 's both' } as any} />
  );

  const N: any[] = [];
  switch (id) {
    case 'nayeli':
      N.push(flash(P, 150, 0.6)); [0, 0.12, 0.24, 0.36].forEach((d, i) => N.push(ring('rg' + i, P, 1.1, d)));
      ['\u266A', '\u266B', '\u266C', '\u2669', '\u266A', '\u266B'].forEach((c, i) => N.push(rise('nt' + i, c, i % 2 ? S : P, 24 + i * 9, 26 + (i % 3) * 6, 1.1, i * 0.09)));
      break;
    case 'mateo':
      N.push(flash(G, 130, 0.5)); for (let i = 0; i < 16; i++) N.push(scatter('mt' + i, (i / 16) * TAU, i % 3 ? G : W, ['\u2726', '\u2727', '\u2699', '+'][i % 4], 70 + (i % 3) * 18, 16 + (i % 3) * 6, 0.9, (i % 4) * 0.04));
      break;
    case 'sam':
      N.push(<div key="scan" style={{ ...B, left: '8%', top: '0', width: '84%', height: '4px', background: 'linear-gradient(90deg,transparent,' + S + ',transparent)', boxShadow: '0 0 12px ' + S, animation: 'cSweepY 1s linear both' }} />);
      for (let i = 0; i < 10; i++) N.push(rise('px' + i, '\u25AA', i % 2 ? S : OK, 14 + i * 8, 18, 1, i * 0.06));
      break;
    case 'roadrunner':
      [62, 80, 98, 116, 132].forEach((t, i) => N.push(beamX('rr' + i, i % 2 ? OK : W, t, 0.7, i * 0.06)));
      ['\u00BB', '\u00BB', '\u00BB'].forEach((c, i) => N.push(rise('rd' + i, c, OK, 30 + i * 10, 26, 0.8, i * 0.08)));
      break;
    case 'coyote':
      N.push(flash(OK, 110, 0.5)); ['?', '?', '\u223F', '\u223F', '?'].forEach((c, i) => N.push(rise('cy' + i, c, i % 2 ? G : OK, 32 + i * 9, 26, 1, i * 0.1)));
      for (let i = 0; i < 8; i++) N.push(scatter('cs' + i, (i / 8) * TAU, OK, null, 64, 7, 0.9, i * 0.03));
      break;
    case 'tortoise':
      N.push(flash(G, 120, 0.9)); [0, 0.25, 0.5].forEach((d, i) => N.push(ring('to' + i, G, 1.8, d)));
      break;
    case 'jackrabbit':
      for (let i = 0; i < 7; i++) N.push(<div key={'jr' + i} style={{ ...B, left: '44%', top: '150px', width: '11px', height: '11px', borderRadius: '50%', background: S, boxShadow: '0 0 10px ' + S, animation: 'cArcL 1s ease-out ' + (i * 0.06) + 's both' }} />);
      N.push(rise('jx', '!', S, 58, 30, 0.9, 0.1));
      break;
    case 'quail':
      N.push(flash(P, 110, 0.5));
      { const cols = [P, S, OK, G];
        for (let i = 0; i < 15; i++) N.push(scatter('ql' + i, (i / 15) * TAU, cols[i % 4], '\u2022', 60 + (i % 4) * 16, 18 + (i % 3) * 6, 0.95, (i % 5) * 0.03)); }
      break;
    case 'chuckwalla':
      N.push(flash(G, 150, 0.6)); for (let i = 0; i < 14; i++) N.push(ray('cw' + i, (i / 14) * 360, i % 2 ? G : '#ff8a4a', 1, (i % 3) * 0.03));
      break;
    case 'quest':
      N.push(<div key="ret" style={{ ...B, left: cx, top: cy, width: '120px', height: '120px', marginLeft: '-60px', marginTop: '-60px', border: '3px dashed ' + P, borderRadius: '50%', boxShadow: '0 0 16px ' + P, animation: 'cSpinFade 1.1s ease-out both' }} />);
      N.push(<div key="ret2" style={{ ...B, left: cx, top: cy, width: '60px', height: '60px', marginLeft: '-30px', marginTop: '-30px', border: '2px solid ' + S, borderRadius: '50%', animation: 'cSpinFade 1.1s ease-out 0.1s both' }} />);
      for (let i = 0; i < 6; i++) N.push(scatter('qp' + i, (i / 6) * TAU, G, '\u2726', 72, 16, 0.9, i * 0.05));
      break;
    case 'kitfox':
      N.push(<div key="vig" style={{ ...B, inset: '0', borderRadius: '12px', animation: 'cVig 1.2s ease-in-out both' }} />);
      N.push(beamX('kf1', S, 80, 1.1, 0)); N.push(beamX('kf2', S, 114, 1.1, 0.15));
      ['\u2727', '\u2726', '\u2727'].forEach((c, i) => N.push(rise('kx' + i, c, S, 40 + i * 12, 22, 1, 0.2 + i * 0.08)));
      break;
    case 'bighorn':
      ['\u25B2', '\u25B2', '\u25B2', '\u25B2'].forEach((c, i) => N.push(rise('bh' + i, c, G, 42 + i * 4, 26 - i * 3, 1, i * 0.12)));
      N.push(flash(G, 120, 0.8)); [0, 0.3].forEach((d, i) => N.push(ring('bg' + i, G, 1.2, d)));
      break;
    default:
      N.push(flash(S, 140, 0.6)); [0, 0.12, 0.24].forEach((d, i) => N.push(ring('df' + i, S, 1, d)));
  }

  return (
    <div key={'cast' + n} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
      {N}
    </div>
  );
}
