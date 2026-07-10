import React from 'react';

export default function PixelHero({ form, skin: propSkin, outfit: propOutfit, hairStyle, hairColor, hatColor, hatType, gear, walk, style }: any) {
  const isHuman = form === 'fem' || form === 'masc' || form === 'enby';
  const isMasc = form === 'masc';
  const isFem = form === 'fem';
  const isEnby = form === 'enby';
  const isCritter = form === 'fox' || form === 'bear' || form === 'bird' || form === 'jackrabbit' || form === 'roadrunner' || form === 'tortoise';
  
  const isFox = form === 'fox';
  const isBear = form === 'bear';
  const isBird = form === 'bird';
  
  const isJackrabbit = form === 'jackrabbit' || form === 'fox';
  const isRoadrunner = form === 'roadrunner' || form === 'bird';
  const isTortoise = form === 'tortoise' || form === 'bear';

  let actualHairStyle = hairStyle || 'auto';
  if (actualHairStyle === 'auto') {
    if (form === 'fem') actualHairStyle = 'long';
    else if (form === 'enby') actualHairStyle = 'swoop';
    else actualHairStyle = 'short';
  }

  const hairLong = actualHairStyle === 'long';
  const hairPony = actualHairStyle === 'pony' || actualHairStyle === 'ponytail';
  const hairBun = actualHairStyle === 'bun';
  const hairBuzz = actualHairStyle === 'buzz';
  const hairShort = actualHairStyle === 'short';
  const hairSwoop = actualHairStyle === 'swoop';
  const hairAfro = actualHairStyle === 'afro';
  const hairMohawk = actualHairStyle === 'mohawk';
  const hairBald = actualHairStyle === 'bald';

  const hatCap = hatType === 'cap';
  const hatVisor = hatType === 'visor' || hatType === 'band';
  const hatBeanie = hatType === 'beanie';
  const hatBucket = hatType === 'bucket' || hatType === 'hat';
  const hatRanger = hatType === 'ranger';
  const hatNone = hatType === 'none';
  
  const hatIsCap = hatCap;
  const hatIsBand = hatVisor;
  const hatIsHat = hatBucket || hatBeanie || hatRanger;

  const hasGear = gear && gear !== 'none';
  const gearIsCreator = gear === 'creator';
  const gearIsEnviro = gear === 'enviro';
  const notWalk = !walk;

  // Shading function from original component
  const shade = (hex: string, f: number) => {
    try {
      let c = String(hex).replace('#','');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const r = Math.max(0, Math.min(255, Math.round(parseInt(c.slice(0,2),16) * f)));
      const g = Math.max(0, Math.min(255, Math.round(parseInt(c.slice(2,4),16) * f)));
      const b = Math.max(0, Math.min(255, Math.round(parseInt(c.slice(4,6),16) * f)));
      return "#" + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    } catch (e) { return hex; }
  };

  const skin = propSkin || '#e8b07a';
  const skinHi = shade(skin, 1.13);
  const skinSh = shade(skin, 0.78);

  const outfit = propOutfit || '#ff2e8f';
  const outfitHi = shade(outfit, 1.17);
  const outfitSh = shade(outfit, 0.72);

  const hair = hairColor || '#3a2a1a';
  const hairHi = shade(hair, 1.45);
  const hairSh = shade(hair, 0.6);

  const hat = hatColor || '#10285e';
  const hatHi = shade(hat, 1.2);
  const hatSh = shade(hat, 0.7);
  const hatColorHi = hatHi;
  const hatColorSh = hatSh;
  const OL = '#1c1526';
  const eyeW = '#ffffff';
  const pants = '#10285e';
  const pantsSh = '#00000033';
  const boot = '#1c1526';
  const bootHi = '#ffffff33';

  const auraId = 'aura-' + Math.random().toString(36).substring(7);
  const auraFill = `url(#${auraId})`;

  return (
    <svg viewBox="0 0 24 32" style={{width:"100%", height:"100%", imageRendering:"pixelated" as any, display:"block", overflow:"visible", shapeRendering:"crispEdges" as any, ...style}}>
  <defs>
    <radialGradient id={auraId } cx="50%" cy="42%" r="55%">
      <stop offset="0%" stopColor={outfit } stopOpacity="0.58"></stop>
      <stop offset="45%" stopColor={outfit } stopOpacity="0.32"></stop>
      <stop offset="75%" stopColor={outfit } stopOpacity="0.11"></stop>
      <stop offset="100%" stopColor={outfit } stopOpacity="0"></stop>
    </radialGradient>
  </defs>
  <ellipse cx="12" cy="13" rx="19" ry="22" fill={auraFill }></ellipse>
  <ellipse cx="12" cy="30.6" rx="7" ry="1.5" fill="rgba(16,14,26,.34)"></ellipse>

  {/* ================= HUMAN ================= */}
  {isHuman  && (<>
    {/* long hair behind (frames head, falls past shoulders) */}
    {hairLong  && (<>
      <rect x="5" y="5" width="2" height="16" fill={hair }></rect>
      <rect x="17" y="5" width="2" height="16" fill={hair }></rect>
      <rect x="5" y="5" width="1" height="16" fill={hairHi }></rect>
      <rect x="18" y="5" width="1" height="16" fill={hairSh }></rect>
      <rect x="5" y="20" width="2" height="1" fill={hairSh }></rect>
      <rect x="17" y="20" width="2" height="1" fill={hairSh }></rect>
    </>)}
    {/* ponytail hanging behind */}
    {hairPony  && (<>
      <rect x="17" y="4" width="2" height="12" fill={hair }></rect>
      <rect x="17" y="4" width="1" height="12" fill={hairHi }></rect>
      <rect x="18" y="6" width="1" height="10" fill={hairSh }></rect>
      <rect x="17" y="15" width="2" height="1" fill={hairSh }></rect>
    </>)}

    {/* neck (behind head, shows as 2px) */}
    <rect x="10" y="10" width="4" height="4" fill={skin }></rect>
    <rect x="10" y="10" width="1" height="4" fill={skinSh }></rect>
    <rect x="13" y="10" width="1" height="4" fill={skinSh }></rect>

    {/* head: rounded outline, tapered chin */}
    <rect x="9" y="2" width="6" height="1" fill={OL }></rect>
    <rect x="8" y="3" width="1" height="1" fill={OL }></rect>
    <rect x="15" y="3" width="1" height="1" fill={OL }></rect>
    <rect x="7" y="4" width="1" height="6" fill={OL }></rect>
    <rect x="16" y="4" width="1" height="6" fill={OL }></rect>
    <rect x="8" y="10" width="1" height="1" fill={OL }></rect>
    <rect x="15" y="10" width="1" height="1" fill={OL }></rect>
    <rect x="8" y="11" width="2" height="1" fill={OL }></rect>
    <rect x="14" y="11" width="2" height="1" fill={OL }></rect>
    <rect x="9" y="3" width="6" height="1" fill={skin }></rect>
    <rect x="8" y="4" width="8" height="6" fill={skin }></rect>
    <rect x="9" y="10" width="6" height="1" fill={skin }></rect>
    <rect x="10" y="11" width="4" height="1" fill={skin }></rect>
    <rect x="9" y="4" width="6" height="1" fill={skinHi }></rect>
    <rect x="14" y="5" width="1" height="5" fill={skinSh }></rect>
    <rect x="9" y="10" width="1" height="1" fill={skinSh }></rect>
    <rect x="14" y="10" width="1" height="1" fill={skinSh }></rect>
    {/* ears */}
    <rect x="7" y="6" width="1" height="2" fill={skin }></rect>
    <rect x="16" y="6" width="1" height="2" fill={skinSh }></rect>
    {/* brows */}
    <rect x="9" y="5" width="2" height="1" fill={hair }></rect>
    <rect x="13" y="5" width="2" height="1" fill={hair }></rect>
    {/* eyes */}
    <rect x="9" y="6" width="2" height="2" fill={eyeW }></rect>
    <rect x="13" y="6" width="2" height="2" fill={eyeW }></rect>
    <rect x="9" y="6" width="1" height="2" fill={OL }></rect>
    <rect x="14" y="6" width="1" height="2" fill={OL }></rect>
    {/* nose + small mouth (kept high, off the jaw) */}
    <rect x="11" y="8" width="1" height="1" fill={skinSh }></rect>
    <rect x="10" y="9" width="3" height="1" fill="#7a4034"></rect>

    {/* hair top (per style) */}
    {hairBuzz  && (<>
      <rect x="9" y="1" width="6" height="1" fill={hair }></rect>
      <rect x="8" y="2" width="8" height="1" fill={hair }></rect>
      <rect x="7" y="3" width="1" height="1" fill={hairSh }></rect>
      <rect x="16" y="3" width="1" height="1" fill={hairSh }></rect>
      <rect x="9" y="1" width="4" height="1" fill={hairHi }></rect>
    </>)}
    {hairShort  && (<>
      <rect x="8" y="1" width="8" height="2" fill={hair }></rect>
      <rect x="7" y="3" width="1" height="3" fill={hair }></rect>
      <rect x="16" y="3" width="1" height="3" fill={hair }></rect>
      <rect x="9" y="1" width="6" height="1" fill={hairHi }></rect>
    </>)}
    {hairSwoop  && (<>
      <rect x="8" y="1" width="8" height="2" fill={hair }></rect>
      <rect x="7" y="3" width="1" height="3" fill={hair }></rect>
      <rect x="16" y="3" width="1" height="2" fill={hair }></rect>
      <rect x="9" y="3" width="5" height="1" fill={hair }></rect>
      <rect x="8" y="1" width="6" height="1" fill={hairHi }></rect>
    </>)}
    {hairLong  && (<>
      <rect x="8" y="1" width="8" height="2" fill={hair }></rect>
      <rect x="7" y="3" width="2" height="3" fill={hair }></rect>
      <rect x="15" y="3" width="2" height="3" fill={hair }></rect>
      <rect x="9" y="1" width="6" height="1" fill={hairHi }></rect>
      <rect x="11" y="2" width="2" height="1" fill={skin }></rect>
    </>)}
    {hairPony  && (<>
      <rect x="8" y="1" width="8" height="2" fill={hair }></rect>
      <rect x="7" y="3" width="1" height="3" fill={hair }></rect>
      <rect x="16" y="3" width="1" height="2" fill={hair }></rect>
      <rect x="9" y="1" width="6" height="1" fill={hairHi }></rect>
    </>)}
    {hairBun  && (<>
      <rect x="10" y="0" width="4" height="2" fill={hair }></rect>
      <rect x="11" y="0" width="2" height="1" fill={hairHi }></rect>
      <rect x="8" y="2" width="8" height="1" fill={hair }></rect>
      <rect x="7" y="3" width="1" height="3" fill={hair }></rect>
      <rect x="16" y="3" width="1" height="3" fill={hair }></rect>
    </>)}
    {hairAfro  && (<>
      <rect x="8" y="0" width="8" height="1" fill={hair }></rect>
      <rect x="6" y="1" width="12" height="2" fill={hair }></rect>
      <rect x="6" y="3" width="2" height="3" fill={hair }></rect>
      <rect x="16" y="3" width="2" height="3" fill={hair }></rect>
      <rect x="7" y="0" width="6" height="1" fill={hairHi }></rect>
      <rect x="6" y="1" width="2" height="1" fill={hairHi }></rect>
    </>)}
    {hairMohawk  && (<>
      <rect x="10" y="0" width="3" height="5" fill={hair }></rect>
      <rect x="10" y="0" width="1" height="5" fill={hairHi }></rect>
      <rect x="12" y="1" width="1" height="4" fill={hairSh }></rect>
      <rect x="8" y="3" width="2" height="1" fill={skinSh }></rect>
      <rect x="14" y="3" width="1" height="1" fill={skinSh }></rect>
    </>)}

    {/* torso (per form): sloped shoulders tapering to a waist */}
    {isMasc  && (<>
      <rect x="7" y="14" width="10" height="1" fill={OL }></rect>
      <rect x="5" y="15" width="14" height="2" fill={OL }></rect>
      <rect x="6" y="17" width="12" height="1" fill={OL }></rect>
      <rect x="7" y="18" width="10" height="2" fill={OL }></rect>
      <rect x="8" y="14" width="8" height="1" fill={outfit }></rect>
      <rect x="6" y="15" width="12" height="2" fill={outfit }></rect>
      <rect x="7" y="17" width="10" height="1" fill={outfit }></rect>
      <rect x="8" y="18" width="8" height="2" fill={outfit }></rect>
      <rect x="8" y="14" width="7" height="1" fill={outfitHi }></rect>
      <rect x="6" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="17" y="15" width="1" height="2" fill={outfitSh }></rect>
      <rect x="11" y="15" width="1" height="5" fill={outfitSh }></rect>
    </>)}
    {isFem  && (<>
      <rect x="7" y="14" width="8" height="1" fill={OL }></rect>
      <rect x="6" y="15" width="10" height="2" fill={OL }></rect>
      <rect x="7" y="17" width="8" height="3" fill={OL }></rect>
      <rect x="8" y="14" width="6" height="1" fill={outfit }></rect>
      <rect x="7" y="15" width="8" height="2" fill={outfit }></rect>
      <rect x="8" y="17" width="6" height="3" fill={outfit }></rect>
      <rect x="8" y="14" width="6" height="1" fill={outfitHi }></rect>
      <rect x="7" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="14" y="15" width="1" height="2" fill={outfitSh }></rect>
      <rect x="13" y="17" width="1" height="3" fill={outfitSh }></rect>
    </>)}
    {isEnby  && (<>
      <rect x="7" y="14" width="10" height="1" fill={OL }></rect>
      <rect x="6" y="15" width="12" height="2" fill={OL }></rect>
      <rect x="7" y="17" width="10" height="3" fill={OL }></rect>
      <rect x="8" y="14" width="8" height="1" fill={outfit }></rect>
      <rect x="7" y="15" width="10" height="2" fill={outfit }></rect>
      <rect x="8" y="17" width="8" height="3" fill={outfit }></rect>
      <rect x="10" y="14" width="3" height="5" fill="#e6e9f2"></rect>
      <rect x="10" y="14" width="1" height="5" fill={outfitHi }></rect>
      <rect x="12" y="14" width="1" height="5" fill={outfitSh }></rect>
      <rect x="8" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="15" y="15" width="1" height="2" fill={outfitSh }></rect>
    </>)}

    {/* belt (masc/enby; fem skirt covers) */}
    <rect x="7" y="20" width="10" height="1" fill="#241a12"></rect>
    <rect x="11" y="20" width="2" height="1" fill="#ffdd2e"></rect>

    {/* legs (narrowed stance) */}
    {notWalk  && (<>
      <rect x="8" y="21" width="3" height="7" fill={pants }></rect>
      <rect x="13" y="21" width="3" height="7" fill={pants }></rect>
      <rect x="8" y="21" width="1" height="7" fill={OL }></rect>
      <rect x="13" y="21" width="1" height="7" fill={OL }></rect>
      <rect x="10" y="21" width="1" height="7" fill={pantsSh }></rect>
      <rect x="15" y="21" width="1" height="7" fill={pantsSh }></rect>
      <rect x="7" y="28" width="5" height="3" fill={boot }></rect>
      <rect x="12" y="28" width="5" height="3" fill={boot }></rect>
      <rect x="7" y="28" width="5" height="1" fill={bootHi }></rect>
      <rect x="12" y="28" width="5" height="1" fill={bootHi }></rect>
    </>)}
    {walk  && (<>
      <g style={{ animation: "ph-stepA .5s steps(2) infinite" }}>
        <rect x="8" y="21" width="3" height="7" fill={pants }></rect>
        <rect x="8" y="21" width="1" height="7" fill={OL }></rect>
        <rect x="10" y="21" width="1" height="7" fill={pantsSh }></rect>
        <rect x="7" y="28" width="5" height="3" fill={boot }></rect>
        <rect x="7" y="28" width="5" height="1" fill={bootHi }></rect>
      </g>
      <g style={{ animation: "ph-stepB .5s steps(2) infinite" }}>
        <rect x="13" y="21" width="3" height="7" fill={pants }></rect>
        <rect x="13" y="21" width="1" height="7" fill={OL }></rect>
        <rect x="15" y="21" width="1" height="7" fill={pantsSh }></rect>
        <rect x="12" y="28" width="5" height="3" fill={boot }></rect>
        <rect x="12" y="28" width="5" height="1" fill={bootHi }></rect>
      </g>
    </>)}

    {/* fem skirt: A-line flare over hips */}
    {isFem  && (<>
      <rect x="7" y="19" width="10" height="1" fill={OL }></rect>
      <rect x="6" y="20" width="12" height="1" fill={OL }></rect>
      <rect x="5" y="21" width="14" height="1" fill={OL }></rect>
      <rect x="8" y="19" width="8" height="1" fill={outfit }></rect>
      <rect x="7" y="20" width="10" height="1" fill={outfit }></rect>
      <rect x="6" y="21" width="12" height="2" fill={outfit }></rect>
      <rect x="6" y="20" width="1" height="3" fill={outfitHi }></rect>
      <rect x="17" y="20" width="1" height="3" fill={outfitSh }></rect>
      <rect x="6" y="22" width="12" height="1" fill={outfitSh }></rect>
    </>)}

    {/* arms / hands hanging at sides (per form) */}
    {isMasc  && (<>
      <rect x="4" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="18" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="4" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="18" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="4" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="19" y="15" width="1" height="2" fill={outfitSh }></rect>
      <rect x="4" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="18" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="4" y="17" width="1" height="2" fill={skinHi }></rect>
      <rect x="19" y="17" width="1" height="2" fill={skinSh }></rect>
    </>)}
    {isEnby  && (<>
      <rect x="5" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="17" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="5" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="17" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="5" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="18" y="15" width="1" height="2" fill={outfitSh }></rect>
      <rect x="5" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="17" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="5" y="17" width="1" height="2" fill={skinHi }></rect>
      <rect x="18" y="17" width="1" height="2" fill={skinSh }></rect>
    </>)}
    {isFem  && (<>
      <rect x="5" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="16" y="15" width="2" height="4" fill={OL }></rect>
      <rect x="5" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="16" y="15" width="2" height="2" fill={outfit }></rect>
      <rect x="5" y="15" width="1" height="2" fill={outfitHi }></rect>
      <rect x="17" y="15" width="1" height="2" fill={outfitSh }></rect>
      <rect x="5" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="16" y="17" width="2" height="2" fill={skin }></rect>
      <rect x="5" y="17" width="1" height="2" fill={skinHi }></rect>
      <rect x="17" y="17" width="1" height="2" fill={skinSh }></rect>
    </>)}

    {/* gear */}
    {gearIsCreator  && (<>
      <rect x="8" y="14" width="2" height="1" fill="#241a12"></rect>
      <rect x="10" y="15" width="2" height="1" fill="#241a12"></rect>
      <rect x="12" y="16" width="2" height="1" fill="#241a12"></rect>
      <rect x="13" y="15" width="6" height="4" fill="#12183a"></rect>
      <rect x="13" y="15" width="6" height="1" fill="#2a3566"></rect>
      <rect x="14" y="14" width="2" height="1" fill="#ffdd2e"></rect>
      <rect x="18" y="16" width="2" height="2" fill="#45d4ff"></rect>
      <rect x="19" y="16" width="1" height="1" fill="#bfeeff"></rect>
    </>)}
    {gearIsEnviro  && (<>
      <rect x="8" y="14" width="2" height="1" fill="#5a3f1e"></rect>
      <rect x="10" y="15" width="2" height="1" fill="#5a3f1e"></rect>
      <rect x="12" y="16" width="2" height="1" fill="#5a3f1e"></rect>
      <rect x="14" y="16" width="6" height="5" fill="#7a5a2e"></rect>
      <rect x="14" y="16" width="6" height="1" fill="#9a7444"></rect>
      <rect x="14" y="18" width="6" height="1" fill="#5a3f1e"></rect>
      <rect x="16" y="18" width="2" height="1" fill="#ffdd2e"></rect>
    </>)}

    {/* hats (over hair) */}
    {hatIsCap  && (<>
      <rect x="7" y="1" width="10" height="3" fill={hatColor }></rect>
      <rect x="8" y="0" width="8" height="1" fill={hatColorHi }></rect>
      <rect x="16" y="3" width="5" height="1" fill={hatColor }></rect>
      <rect x="16" y="4" width="5" height="1" fill={hatColorSh }></rect>
      <rect x="7" y="3" width="10" height="1" fill={hatColorSh }></rect>
    </>)}
    {hatIsBand  && (<>
      <rect x="7" y="4" width="10" height="1" fill={hatColor }></rect>
      <rect x="7" y="3" width="10" height="1" fill={hatColorHi }></rect>
      <rect x="6" y="4" width="1" height="3" fill={hatColor }></rect>
      <rect x="5" y="6" width="2" height="1" fill={hatColorSh }></rect>
    </>)}
    {hatIsHat  && (<>
      <rect x="4" y="3" width="16" height="1" fill={hatColor }></rect>
      <rect x="4" y="4" width="16" height="1" fill={hatColorSh }></rect>
      <rect x="7" y="0" width="10" height="3" fill={hatColor }></rect>
      <rect x="7" y="2" width="10" height="1" fill={hatColorSh }></rect>
      <rect x="8" y="0" width="8" height="1" fill={hatColorHi }></rect>
    </>)}
  </>)}

  {/* ================= TORTOISE ================= */}
  {isTortoise  && (<>
    {notWalk  && (<>
      <rect x="5" y="24" width="4" height="5" fill="#a07a44"></rect>
      <rect x="14" y="24" width="4" height="5" fill="#a07a44"></rect>
      <rect x="5" y="24" width="1" height="5" fill="#7f5e30"></rect>
      <rect x="14" y="24" width="1" height="5" fill="#7f5e30"></rect>
    </>)}
    {walk  && (<>
      <g style={{ animation: "ph-stepA .5s steps(2) infinite" }}><rect x="5" y="24" width="4" height="5" fill="#a07a44"></rect></g>
      <g style={{ animation: "ph-stepB .5s steps(2) infinite" }}><rect x="14" y="24" width="4" height="5" fill="#a07a44"></rect></g>
    </>)}
    <rect x="16" y="16" width="7" height="6" fill={OL }></rect>
    <rect x="17" y="16" width="6" height="5" fill="#c19a58"></rect>
    <rect x="17" y="16" width="6" height="1" fill="#d4ae6a"></rect>
    <rect x="21" y="18" width="1" height="2" fill={OL }></rect>
    <rect x="22" y="18" width="1" height="1" fill="#eef1f8"></rect>
    <rect x="15" y="19" width="3" height="2" fill={outfit }></rect>
    <rect x="3" y="11" width="16" height="14" fill={OL }></rect>
    <rect x="4" y="12" width="14" height="12" fill="#5f7f34"></rect>
    <rect x="5" y="11" width="12" height="1" fill="#6f8f3e"></rect>
    <rect x="6" y="10" width="10" height="1" fill="#7ba043"></rect>
    <rect x="4" y="12" width="14" height="1" fill="#8fb04a"></rect>
    <rect x="8" y="13" width="6" height="1" fill="#3f5722"></rect>
    <rect x="7" y="14" width="1" height="6" fill="#3f5722"></rect>
    <rect x="14" y="14" width="1" height="6" fill="#3f5722"></rect>
    <rect x="4" y="18" width="14" height="1" fill="#3f5722"></rect>
    <rect x="9" y="15" width="4" height="3" fill="#4f6f28"></rect>
    <rect x="9" y="15" width="4" height="1" fill="#6f8f3e"></rect>
    <rect x="5" y="20" width="12" height="1" fill="#3f5722"></rect>
    <rect x="4" y="23" width="14" height="2" fill="#c9a25a"></rect>
    <rect x="4" y="23" width="14" height="1" fill="#dab56e"></rect>
    {gearIsCreator  && (<>
      <rect x="18" y="12" width="5" height="3" fill="#12183a"></rect>
      <rect x="22" y="13" width="1" height="1" fill="#45d4ff"></rect>
      <rect x="19" y="11" width="2" height="1" fill="#ffdd2e"></rect>
    </>)}
    {gearIsEnviro  && (<>
      <rect x="9" y="6" width="1" height="5" fill="#8a6a3a"></rect>
      <rect x="10" y="6" width="4" height="3" fill={outfit }></rect>
      <rect x="10" y="6" width="4" height="1" fill="#ffffff" opacity="0.4"></rect>
    </>)}
  </>)}

  {/* ================= ROADRUNNER ================= */}
  {isRoadrunner  && (<>
    {notWalk  && (<>
      <rect x="9" y="21" width="2" height="6" fill="#d98a2a"></rect>
      <rect x="13" y="21" width="2" height="6" fill="#d98a2a"></rect>
      <rect x="8" y="27" width="4" height="1" fill="#c07a1e"></rect>
      <rect x="13" y="27" width="4" height="1" fill="#c07a1e"></rect>
    </>)}
    {walk  && (<>
      <g style={{ animation: "ph-stepA .5s steps(2) infinite" }}><rect x="9" y="21" width="2" height="6" fill="#d98a2a"></rect><rect x="8" y="27" width="4" height="1" fill="#c07a1e"></rect></g>
      <g style={{ animation: "ph-stepB .5s steps(2) infinite" }}><rect x="13" y="21" width="2" height="6" fill="#d98a2a"></rect><rect x="13" y="27" width="4" height="1" fill="#c07a1e"></rect></g>
    </>)}
    <rect x="14" y="12" width="8" height="2" fill="#4a3f2a"></rect>
    <rect x="19" y="8" width="3" height="5" fill="#4a3f2a"></rect>
    <rect x="19" y="8" width="1" height="5" fill="#6a5a3e"></rect>
    <rect x="6" y="11" width="9" height="11" fill={OL }></rect>
    <rect x="7" y="11" width="7" height="10" fill="#6a5a3e"></rect>
    <rect x="8" y="14" width="4" height="6" fill="#d8cdb0"></rect>
    <rect x="7" y="11" width="7" height="1" fill="#7f6d4a"></rect>
    <rect x="7" y="12" width="7" height="1" fill={outfit }></rect>
    <rect x="3" y="4" width="7" height="8" fill={OL }></rect>
    <rect x="4" y="5" width="5" height="7" fill="#6a5a3e"></rect>
    <rect x="4" y="5" width="5" height="1" fill="#7f6d4a"></rect>
    <rect x="3" y="2" width="2" height="3" fill="#2a2018"></rect>
    <rect x="5" y="1" width="2" height="3" fill="#2a2018"></rect>
    <rect x="4" y="7" width="3" height="1" fill="#d94f4f"></rect>
    <rect x="5" y="6" width="1" height="1" fill="#eef1f8"></rect>
    <rect x="6" y="6" width="1" height="1" fill={OL }></rect>
    <rect x="0" y="7" width="4" height="1" fill="#d98a2a"></rect>
    <rect x="1" y="8" width="3" height="1" fill="#b86a16"></rect>
    {gearIsCreator  && (<>
      <rect x="8" y="15" width="4" height="3" fill="#12183a"></rect>
      <rect x="11" y="16" width="1" height="1" fill="#45d4ff"></rect>
      <rect x="8" y="14" width="4" height="1" fill="#ffdd2e"></rect>
    </>)}
    {gearIsEnviro  && (<>
      <rect x="13" y="15" width="3" height="4" fill="#7a5a2e"></rect>
      <rect x="13" y="15" width="3" height="1" fill="#9a7444"></rect>
      <rect x="14" y="17" width="1" height="1" fill="#ffdd2e"></rect>
    </>)}
  </>)}

  {/* ================= JACKRABBIT ================= */}
  {isJackrabbit  && (<>
    {notWalk  && (<>
      <rect x="6" y="22" width="5" height="4" fill="#a8906f"></rect>
      <rect x="5" y="25" width="7" height="2" fill="#a8906f"></rect>
      <rect x="13" y="20" width="3" height="6" fill="#a8906f"></rect>
    </>)}
    {walk  && (<>
      <g style={{ animation: "ph-stepA .5s steps(2) infinite" }}><rect x="6" y="22" width="5" height="4" fill="#a8906f"></rect><rect x="5" y="25" width="7" height="2" fill="#a8906f"></rect></g>
      <g style={{ animation: "ph-stepB .5s steps(2) infinite" }}><rect x="13" y="20" width="3" height="6" fill="#a8906f"></rect></g>
    </>)}
    <rect x="7" y="0" width="3" height="9" fill="#b8a488"></rect>
    <rect x="12" y="0" width="3" height="9" fill="#b8a488"></rect>
    <rect x="8" y="1" width="1" height="6" fill="#e0a0a0"></rect>
    <rect x="13" y="1" width="1" height="6" fill="#e0a0a0"></rect>
    <rect x="7" y="0" width="3" height="1" fill="#cbb89a"></rect>
    <rect x="12" y="0" width="3" height="1" fill="#cbb89a"></rect>
    <rect x="6" y="8" width="10" height="7" fill={OL }></rect>
    <rect x="7" y="8" width="8" height="6" fill="#b8a488"></rect>
    <rect x="7" y="8" width="8" height="1" fill="#cbb89a"></rect>
    <rect x="8" y="12" width="4" height="3" fill="#efe6d4"></rect>
    <rect x="11" y="10" width="2" height="2" fill={OL }></rect>
    <rect x="12" y="10" width="1" height="1" fill="#eef1f8"></rect>
    <rect x="14" y="12" width="1" height="1" fill="#e08a8a"></rect>
    <rect x="5" y="13" width="10" height="9" fill={OL }></rect>
    <rect x="6" y="13" width="8" height="8" fill="#b8a488"></rect>
    <rect x="8" y="16" width="4" height="5" fill="#efe6d4"></rect>
    <rect x="6" y="13" width="8" height="1" fill="#cbb89a"></rect>
    <rect x="6" y="14" width="8" height="1" fill={outfit }></rect>
    <rect x="12" y="17" width="2" height="4" fill="#a8906f"></rect>
    <rect x="4" y="15" width="2" height="2" fill="#efe6d4"></rect>
    {gearIsCreator  && (<>
      <rect x="10" y="16" width="4" height="3" fill="#12183a"></rect>
      <rect x="13" y="17" width="1" height="1" fill="#45d4ff"></rect>
      <rect x="10" y="15" width="4" height="1" fill="#ffdd2e"></rect>
    </>)}
    {gearIsEnviro  && (<>
      <rect x="4" y="16" width="3" height="4" fill="#7a5a2e"></rect>
      <rect x="4" y="16" width="3" height="1" fill="#9a7444"></rect>
      <rect x="5" y="18" width="1" height="1" fill="#ffdd2e"></rect>
    </>)}
  </>)}
</svg>
  );
}
