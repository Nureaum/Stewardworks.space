'use client';

/**
 * FantasyBackground - Full pixel art village scene background
 * Adapted from clude.jsx design - includes stars, moon, mountains,
 * castle silhouette, tree line, ground plane, and cottage village.
 */

const PixelHouse = ({ lit = false, roof = "#8B4A2B", wall = "#C98A3E", size = 40 }: {
  lit?: boolean; roof?: string; wall?: string; size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    <rect x="2" y="3" width="12" height="2" fill={roof} />
    <rect x="3" y="1" width="10" height="2" fill={roof} />
    <rect x="5" y="0" width="6" height="1" fill={roof} />
    <rect x="3" y="5" width="10" height="9" fill={wall} />
    <rect x="3" y="5" width="10" height="1" fill="#7A5230" opacity={0.4} />
    <rect x="7" y="10" width="2" height="4" fill="#4A2F1C" />
    <rect x="4" y="7" width="2" height="2" fill={lit ? "#F0C64C" : "#2B3A55"} />
    <rect x="10" y="7" width="2" height="2" fill={lit ? "#F0C64C" : "#2B3A55"} />
  </svg>
);

const CottageBig = ({ lit = true, roof = "#7A3D22", wall = "#B87A3E", trim = "#5C3018", awning = false, w = 96, h = 92 }: {
  lit?: boolean; roof?: string; wall?: string; trim?: string; awning?: boolean; w?: number; h?: number;
}) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 24 22"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    <rect x="17" y="1" width="2" height="4" fill={trim} />
    <rect x="16.5" y="0.5" width="3" height="1" fill="#3E2410" />
    <polygon points="1,8 12,1 23,8" fill={roof} />
    <rect x="0.5" y="7.5" width="23" height="1.5" fill={trim} />
    <rect x="2" y="9" width="20" height="12" fill={wall} />
    <rect x="2" y="9" width="20" height="1" fill="#00000022" />
    <rect x="2" y="9" width="1" height="12" fill={trim} />
    <rect x="21" y="9" width="1" height="12" fill={trim} />
    <rect x="4.5" y="11.5" width="4" height="4" fill={trim} />
    <rect x="5" y="12" width="3" height="3" fill={lit ? "#F0C64C" : "#22304E"} />
    <rect x="15.5" y="11.5" width="4" height="4" fill={trim} />
    <rect x="16" y="12" width="3" height="3" fill={lit ? "#F0C64C" : "#22304E"} />
    <rect x="10.5" y="15" width="3" height="6" fill={trim} />
    {awning && (
      <>
        <rect x="9" y="14.5" width="6" height="1" fill="#5C1F1F" />
        <rect x="8.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="9.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
        <rect x="10.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="11.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
        <rect x="12.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="13.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
      </>
    )}
  </svg>
);

const CastleSilhouette = ({ w = 260, h = 150 }: { w?: number; h?: number }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 130 75"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    <g fill="#1B2C52">
      <rect x="8" y="30" width="10" height="45" />
      <polygon points="6,30 13,16 20,30" />
      <rect x="30" y="18" width="22" height="57" />
      <rect x="34" y="8" width="14" height="12" />
      <polygon points="32,8 41,-4 50,8" />
      <rect x="40" y="-9" width="1.5" height="6" />
      <rect x="18" y="42" width="12" height="33" />
      <rect x="52" y="42" width="16" height="33" />
      <rect x="68" y="26" width="9" height="49" />
      <polygon points="66,26 72.5,12 79,26" />
      <rect x="80" y="35" width="8" height="40" />
      <polygon points="78,35 84,23 90,35" />
      <rect x="95" y="40" width="7" height="35" />
      <polygon points="93,40 98.5,29 104,40" />
    </g>
    <g fill="#F0C64C" opacity={0.85}>
      <rect x="38" y="30" width="2" height="3" />
      <rect x="44" y="30" width="2" height="3" />
      <rect x="12" y="48" width="2" height="3" />
      <rect x="72" y="42" width="2" height="3" />
    </g>
  </svg>
);

const PixelPine = ({ w = 30, h = 46, shade = "#2E4A2E" }: { w?: number; h?: number; shade?: string }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 12 18"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    <rect x="5" y="15" width="2" height="3" fill="#4A3018" />
    <polygon points="6,0 11,7 1,7" fill={shade} />
    <polygon points="6,4 12,12 0,12" fill={shade} />
    <polygon points="6,9 12,17 0,17" fill={shade} />
  </svg>
);

const PixelMushroom = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    <rect x="4" y="7" width="4" height="4" fill="#F0E0C0" />
    <rect x="2" y="4" width="8" height="3" fill="#C9432E" />
    <rect x="3" y="3" width="6" height="1" fill="#C9432E" />
    <rect x="3" y="5" width="2" height="1" fill="#F0E0C0" />
    <rect x="7" y="4" width="2" height="1" fill="#F0E0C0" />
  </svg>
);

const PixelLantern = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 12"
    shapeRendering="crispEdges"
    style={{
      imageRendering: "pixelated",
      display: "block",
      filter: "drop-shadow(0 0 4px #F0C64Caa)",
    }}
    aria-hidden="true"
  >
    <rect x="3" y="0" width="2" height="2" fill="#5A4A2E" />
    <rect x="1" y="2" width="6" height="6" fill="#F0C64C" />
    <rect x="1" y="2" width="6" height="1" fill="#5A4A2E" />
    <rect x="1" y="7" width="6" height="1" fill="#5A4A2E" />
    <rect x="3" y="8" width="2" height="3" fill="#5A4A2E" />
  </svg>
);

export default function FantasyBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: 'linear-gradient(180deg, #0B1330 0%, #16305A 28%, #2E6C97 55%, #5FA3C9 75%, #7FC4E8 100%)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .lantern-flicker { animation: flicker 2.4s ease-in-out infinite; }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .star { animation: twinkle 3s ease-in-out infinite; }
      `}</style>

      {/* Stars */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            position: 'absolute',
            top: `${(i * 37) % 32}%`,
            left: `${(i * 53) % 100}%`,
            width: 2,
            height: 2,
            background: '#FDF6E3',
            animationDelay: `${(i % 5) * 0.4}s`,
          }}
        />
      ))}

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          right: '10%',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#F0E4C0',
          boxShadow: '0 0 24px rgba(240,228,192,0.35)',
        }}
      />

      {/* Distant mountain ridge */}
      <div style={{ position: 'absolute', bottom: 210, left: 0, right: 0, height: 130, opacity: 0.55 }}>
        <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="0,100 0,55 60,10 130,60 190,20 260,65 330,15 400,50 400,100" fill="#0F1D3F" />
        </svg>
      </div>

      {/* Castle silhouette */}
      <div style={{ position: 'absolute', bottom: 190, left: '50%', transform: 'translateX(-10%)', opacity: 0.9 }}>
        <CastleSilhouette w={230} h={135} />
      </div>

      {/* Rolling hill band */}
      <div style={{ position: 'absolute', bottom: 150, left: 0, right: 0, height: 110 }}>
        <svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,90 L0,50 Q100,15 200,35 T400,20 L400,90 Z" fill="#17325A" />
        </svg>
      </div>

      {/* Tree line */}
      <div style={{ position: 'absolute', bottom: 148, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 2%', overflow: 'hidden' }}>
        {[...Array(14)].map((_, i) => (
          <PixelPine key={i} w={16 + (i % 3) * 6} h={26 + (i % 3) * 8} shade={i % 2 === 0 ? "#1F3A2C" : "#274630"} />
        ))}
      </div>

      {/* Ground plane */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 158, background: 'linear-gradient(180deg, #C98A3E 0%, #A9702F 55%, #8C5C28 100%)' }} />

      {/* Foreground cottage row */}
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 3%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <CottageBig lit awning w={104} h={100} roof="#7A3D22" wall="#B87A3E" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <div className="lantern-flicker">
              <PixelLantern size={20} />
            </div>
            <PixelMushroom size={16} />
          </div>
          <CottageBig w={78} h={78} roof="#5C3018" wall="#8B5A2E" />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <CottageBig lit w={70} h={70} roof="#6B3A22" wall="#A9702F" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <div className="lantern-flicker" style={{ animationDelay: '1s' }}>
              <PixelLantern size={20} />
            </div>
            <PixelMushroom size={14} />
          </div>
          <CottageBig lit awning w={104} h={102} roof="#7A3D22" wall="#C98A3E" />
        </div>
      </div>

      {/* Vignette overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, rgba(11,19,48,0.15) 0%, rgba(11,19,48,0.55) 70%, rgba(11,19,48,0.75) 100%)', pointerEvents: 'none' }} />
    </div>
  );
}
