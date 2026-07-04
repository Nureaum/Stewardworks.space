'use client';
import React, { useState } from 'react';

interface OrnateFrameProps {
  title?: string;
  date?: string;
  sub?: string;
  caption?: string;
  plate?: string;
  accent?: string;
  aspect?: string;
  shape?: 'rect' | 'arched' | 'round';
  variant?: 'gold' | 'walnut' | 'oak' | 'crimson' | 'ebony';
  top?: 'crest' | 'keystone' | 'none';
  corners?: 'rosette' | 'studs' | 'brackets' | 'none';
  tilt?: number;
  empty?: boolean;
  frameGradient?: string;
  tipAlign?: 'left' | 'center' | 'right';
  photo?: string;
  onClick?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  style?: React.CSSProperties;
}

export default function OrnateFrame(props: OrnateFrameProps) {
  const [hover, setHover] = useState(false);

  const {
    title = '',
    date = '',
    sub = '',
    caption = 'photo',
    accent = '#c98a3d',
    aspect = '4/5',
    shape = 'rect',
    variant = 'gold',
    tilt = 0,
    empty = false,
    tipAlign = 'center',
    plate: customPlate,
  } = props;

  const radiusByShape = {
    rect: { r: '12px 12px 9px 9px', inner: '4px', mat: '3px', photo: '2px' },
    arched: { r: '46% 46% 10px 10px / 30% 30% 10px 10px', inner: '44% 44% 5px 5px / 28% 28% 5px 5px', mat: '42% 42% 3px 3px / 26% 26% 3px 3px', photo: '40% 40% 2px 2px / 24% 24% 2px 2px' },
    round: { r: '50%', inner: '50%', mat: '50%', photo: '50%' },
  };
  const R = radiusByShape[shape];

  const lift = hover ? -11 : 0;
  const sc = hover ? 1.025 : 1;
  const transform = `rotate(${tilt}deg) translateY(${lift}px) scale(${sc})`;
  const filter = hover ? 'drop-shadow(0 22px 26px rgba(40,26,12,.42))' : 'none';

  const gilt = {
    rosette: 'radial-gradient(circle at 5px 5px,#f8e6ac,#a8802f 72%)',
    crest: 'linear-gradient(135deg,#f4dc92,#a8802f)',
    crest2: 'linear-gradient(180deg,#f4dc92,#b0862f)',
    nail: 'radial-gradient(circle at 3px 3px,#caa25c,#5f4118)',
    plate: 'linear-gradient(180deg,#e9cd7c,#a8802f)',
    plateText: '#3a2a10',
  };
  const brass = {
    rosette: 'radial-gradient(circle at 5px 5px,#e2c584,#7d5f28 72%)',
    crest: 'linear-gradient(135deg,#e2c584,#7d5f28)',
    crest2: 'linear-gradient(180deg,#e2c584,#846327)',
    nail: 'radial-gradient(circle at 3px 3px,#c2a45f,#463116)',
    plate: 'linear-gradient(180deg,#d9bd78,#7d5f28)',
    plateText: '#2e2110',
  };
  const VARIANTS = {
    gold: { body: 'linear-gradient(135deg,#efd085 0%,#c99a3f 22%,#8a6624 48%,#e0be6a 74%,#a8802f 100%)', bead: 'linear-gradient(135deg,#7a5a24,#c9a24a 48%,#8a6624)', ...gilt },
    walnut: { body: 'linear-gradient(135deg,#7a4f2c 0%,#553218 40%,#875732 68%,#3d2611 100%)', bead: 'linear-gradient(135deg,#5a4326,#a9884a 48%,#5e4526)', ...brass },
    oak: { body: 'linear-gradient(135deg,#c99f61 0%,#a5763c 42%,#d8b06a 72%,#8c6230 100%)', bead: 'linear-gradient(135deg,#7a5a2e,#b89457 48%,#7a5a2e)', ...brass },
    crimson: { body: 'linear-gradient(135deg,#9a352e 0%,#611a16 42%,#ad4038 72%,#4c1411 100%)', bead: 'linear-gradient(135deg,#6a4a1e,#c9a24a 48%,#6a4a1e)', ...gilt },
    ebony: { body: 'linear-gradient(135deg,#3c372f 0%,#1c1a16 45%,#443d34 75%,#141210 100%)', bead: 'linear-gradient(135deg,#6a5220,#c9a24a 48%,#6a5220)', ...gilt },
  };
  const V = VARIANTS[variant];

  const handleEnter = () => { setHover(true); props.onHoverEnter?.(); };
  const handleLeave = () => { setHover(false); props.onHoverLeave?.(); };

  const tipLeft = tipAlign === 'left' ? '0' : (tipAlign === 'right' ? 'auto' : '50%');
  const tipTransform = (tipAlign === 'left' || tipAlign === 'right') ? 'none' : 'translateX(-50%)';
  const tipOpacity = hover && (title || sub) ? 1 : 0;
  
  const plateText = customPlate || (title + (date ? ' · ' + date : ''));
  const tipTitle = (title || '—').toUpperCase() + (date ? ' · ' + date.toUpperCase() : '');

  return (
    <div 
      onClick={props.onClick} 
      onMouseEnter={handleEnter} 
      onMouseLeave={handleLeave} 
      style={{
        ...props.style,
        position: 'absolute',
        width: props.style?.width || '100%',
        cursor: props.onClick ? 'pointer' : 'default', 
        opacity: empty ? 0.82 : 1, 
        transform, 
        filter, 
        transition: 'transform .32s cubic-bezier(.2,.75,.3,1), filter .32s ease, opacity .3s ease'
      }}
    >
      {/* top crest / cartouche */}
      {(props.top === 'crest' || !props.top) && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 9, height: 9, background: V.crest, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,.4)', marginBottom: -3, borderRadius: 1 }} />
          <div style={{ width: 34, height: 15, background: V.crest2, borderRadius: '52% 52% 6px 6px / 92% 92% 6px 6px', boxShadow: '0 2px 4px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,248,214,.55), inset 0 0 0 1px rgba(120,80,30,.4)' }} />
        </div>
      )}

      {/* keystone block */}
      {props.top === 'keystone' && (
        <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 30, height: 20, zIndex: 5, pointerEvents: 'none', background: V.crest, clipPath: 'polygon(22% 0,78% 0,100% 100%,0 100%)', boxShadow: '0 2px 4px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,248,214,.6)' }} />
      )}

      {/* ornate frame body */}
      <div style={{ position: 'relative', zIndex: 1, padding: 14, borderRadius: R.r, background: props.frameGradient || V.body, boxShadow: '0 16px 30px rgba(40,26,12,.42), inset 0 0 0 1.5px rgba(255,248,216,.55), inset 0 0 0 5px rgba(120,80,30,.4), inset 0 0 18px rgba(60,38,16,.55)' }}>
        
        {/* corner rosettes */}
        {(props.corners === 'rosette' || !props.corners) && (
          <>
            <div style={{ position: 'absolute', top: -6, left: -6, width: 18, height: 18, borderRadius: '50%', background: V.rosette, boxShadow: '0 2px 3px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(110,74,26,.55)', zIndex: 4 }} />
            <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: V.rosette, boxShadow: '0 2px 3px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(110,74,26,.55)', zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: -6, left: -6, width: 18, height: 18, borderRadius: '50%', background: V.rosette, boxShadow: '0 2px 3px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(110,74,26,.55)', zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: V.rosette, boxShadow: '0 2px 3px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(110,74,26,.55)', zIndex: 4 }} />
          </>
        )}

        {/* corner studs (small diamonds) */}
        {props.corners === 'studs' && (
          <>
            <div style={{ position: 'absolute', top: 2, left: 2, width: 9, height: 9, transform: 'rotate(45deg)', background: V.crest, boxShadow: '0 1px 2px rgba(0,0,0,.4)', zIndex: 4 }} />
            <div style={{ position: 'absolute', top: 2, right: 2, width: 9, height: 9, transform: 'rotate(45deg)', background: V.crest, boxShadow: '0 1px 2px rgba(0,0,0,.4)', zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: 2, left: 2, width: 9, height: 9, transform: 'rotate(45deg)', background: V.crest, boxShadow: '0 1px 2px rgba(0,0,0,.4)', zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 9, height: 9, transform: 'rotate(45deg)', background: V.crest, boxShadow: '0 1px 2px rgba(0,0,0,.4)', zIndex: 4 }} />
          </>
        )}

        {/* corner brackets (L pieces) */}
        {props.corners === 'brackets' && (
          <>
            <div style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderTop: '2.5px solid', borderLeft: '2.5px solid', borderImage: `${V.crest} 1`, zIndex: 4 }} />
            <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderTop: '2.5px solid', borderRight: '2.5px solid', borderImage: `${V.crest} 1`, zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderBottom: '2.5px solid', borderLeft: '2.5px solid', borderImage: `${V.crest} 1`, zIndex: 4 }} />
            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderBottom: '2.5px solid', borderRight: '2.5px solid', borderImage: `${V.crest} 1`, zIndex: 4 }} />
          </>
        )}

        {/* inner bead + mat */}
        <div style={{ padding: 5, borderRadius: R.inner, background: V.bead, boxShadow: 'inset 0 0 0 1px rgba(255,244,206,.5)' }}>
          <div style={{ background: '#f6efdf', padding: 9, borderRadius: R.mat, boxShadow: 'inset 0 0 9px rgba(90,58,34,.2)' }}>
            
            {!empty ? (
              <div style={{ position: 'relative', aspectRatio: aspect, borderRadius: R.photo, boxShadow: `inset 0 0 0 2px ${accent}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg,#e7d3b0,#e7d3b0 11px,#dcc59c 11px,#dcc59c 22px)' }}>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.13em', color: '#9a7f57', textTransform: 'uppercase' }}>{caption}</span>
                {props.photo && <img src={props.photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt={caption} />}
              </div>
            ) : (
              <div style={{ aspectRatio: aspect, borderRadius: R.photo, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#efe4cf', boxShadow: 'inset 0 0 0 2px rgba(154,127,87,.4)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px dashed #b39a6d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a88f62', fontSize: 17, fontWeight: 300, lineHeight: 1 }}>+</div>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8, letterSpacing: '.15em', color: '#a88f62', textTransform: 'uppercase' }}>Reserved</span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* nameplate */}
      <div style={{ position: 'absolute', bottom: -13, left: '50%', transform: 'translateX(-50%)', background: V.plate, padding: '3px 12px', borderRadius: 2, boxShadow: '0 3px 6px rgba(0,0,0,.34)', whiteSpace: 'nowrap', border: '1px solid rgba(90,58,20,.45)', zIndex: 6 }}>
        <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8.5, letterSpacing: '.1em', color: V.plateText, textTransform: 'uppercase', fontWeight: 700 }}>{plateText}</span>
      </div>

      {/* tooltip BELOW frame (avoids header) */}
      <div style={{ position: 'absolute', top: 'calc(100% + 16px)', left: tipLeft, transform: tipTransform, background: '#3a2a1e', color: '#f7efe0', padding: '8px 13px', borderRadius: 9, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, lineHeight: 1.6, textAlign: 'center', whiteSpace: 'nowrap', opacity: tipOpacity, transition: 'opacity .2s ease', pointerEvents: 'none', boxShadow: '0 10px 20px rgba(0,0,0,.32)', zIndex: 20 }}>
        {tipTitle}<br/><span style={{ color: '#e6c78f' }}>{sub}</span>
      </div>

    </div>
  );
}
