'use client';

export interface EnvironmentalSceneProps {
  onOpenWider: () => void;
  onOpenBio: () => void;
  onOpenHist: () => void;
  onOpenIndig: () => void;
  onSea: () => void;
  onSantaRosa: () => void;
  onChocolate: () => void;
  onSun: () => void;
  showTradeRoute?: boolean;
  showTrainSmoke?: boolean;
}

export function EnvironmentalScene({
  onOpenWider,
  onOpenBio,
  onOpenHist,
  onOpenIndig,
  onSea,
  onSantaRosa,
  onChocolate,
  onSun,
  showTradeRoute = true,
  showTrainSmoke = true
}: EnvironmentalSceneProps) {
  return (
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="elSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#AEC6DA"/><stop offset="52%" stopColor="#D6C6A8"/><stop offset="82%" stopColor="#EAD8AE"/><stop offset="100%" stopColor="#EFDDB2"/></linearGradient>
          <radialGradient id="elSun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF7DC"/><stop offset="38%" stopColor="#FBE6A9" stopOpacity=".92"/><stop offset="100%" stopColor="#FBE6A9" stopOpacity="0"/></radialGradient>
          <linearGradient id="elSanta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8E8093"/><stop offset="100%" stopColor="#6E5F6E"/></linearGradient>
          <linearGradient id="elSantaN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C6B6E"/><stop offset="100%" stopColor="#5E4C4E"/></linearGradient>
          <linearGradient id="elChoc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9A7358"/><stop offset="100%" stopColor="#7C5942"/></linearGradient>
          <linearGradient id="elFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D8C69C"/><stop offset="100%" stopColor="#C9B183"/></linearGradient>
          <linearGradient id="elSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BCD2CC"/><stop offset="50%" stopColor="#A2BEBE"/><stop offset="100%" stopColor="#8FB0AF"/></linearGradient>
          <linearGradient id="elSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E4C994"/><stop offset="100%" stopColor="#D0AB72"/></linearGradient>
          <linearGradient id="elRiver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9CBBB8"/><stop offset="100%" stopColor="#8AAFAE"/></linearGradient>
          <linearGradient id="elLedger" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6EBCB"/><stop offset="100%" stopColor="#E7D3A6"/></linearGradient>
          <linearGradient id="elCont" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C46A3F"/><stop offset="100%" stopColor="#A2502E"/></linearGradient>
          <linearGradient id="elEngine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B6157"/><stop offset="100%" stopColor="#294740"/></linearGradient>
          <radialGradient id="elGourd" cx="38%" cy="34%" r="70%"><stop offset="0" stopColor="#E9C57E"/><stop offset="100%" stopColor="#B8863F"/></radialGradient>
          <radialGradient id="elOlla" cx="38%" cy="32%" r="72%"><stop offset="0" stopColor="#CC7A4E"/><stop offset="100%" stopColor="#98492E"/></radialGradient>
          <linearGradient id="elFadeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#fff"/><stop offset="1" stopColor="#fff"/></linearGradient>
          <mask id="elRailMask"><rect x="0" y="360" width="1600" height="72" fill="url(#elFadeGrad)"/></mask>

          <g id="oco">
            <g fill="none" stroke="#5f7d3a" strokeWidth="5" strokeLinecap="round">
              <path d="M0 0 C -6 -46 -30 -86 -44 -142"/><path d="M0 0 C -4 -48 -14 -96 -22 -150"/><path d="M0 0 C -2 -52 -6 -104 -8 -158"/><path d="M0 0 C 0 -54 0 -108 0 -162"/><path d="M0 0 C 2 -52 6 -104 8 -158"/><path d="M0 0 C 4 -48 14 -96 22 -150"/><path d="M0 0 C 6 -46 30 -86 44 -142"/>
            </g>
            <g fill="none" stroke="#89a656" strokeWidth="5.6" strokeLinecap="round" strokeDasharray="0.5 6.5" opacity=".95">
              <path d="M0 0 C -6 -46 -30 -86 -44 -142"/><path d="M0 0 C -4 -48 -14 -96 -22 -150"/><path d="M0 0 C -2 -52 -6 -104 -8 -158"/><path d="M0 0 C 0 -54 0 -108 0 -162"/><path d="M0 0 C 2 -52 6 -104 8 -158"/><path d="M0 0 C 4 -48 14 -96 22 -150"/><path d="M0 0 C 6 -46 30 -86 44 -142"/>
            </g>
            <g fill="#7fae4d"><ellipse cx="-32" cy="-96" rx="4.6" ry="8" transform="rotate(-38 -32 -96)"/><ellipse cx="-17" cy="-108" rx="4.4" ry="7.6" transform="rotate(-20 -17 -108)"/><ellipse cx="-6" cy="-118" rx="4.2" ry="7.4"/><ellipse cx="0" cy="-92" rx="4.4" ry="7.6"/><ellipse cx="6" cy="-118" rx="4.2" ry="7.4"/><ellipse cx="17" cy="-108" rx="4.4" ry="7.6" transform="rotate(20 17 -108)"/><ellipse cx="32" cy="-96" rx="4.6" ry="8" transform="rotate(38 32 -96)"/><ellipse cx="-24" cy="-62" rx="4.4" ry="7.4" transform="rotate(-46 -24 -62)"/><ellipse cx="24" cy="-62" rx="4.4" ry="7.4" transform="rotate(46 24 -62)"/></g>
            <g fill="#D8402E"><ellipse cx="-44" cy="-146" rx="4.2" ry="9"/><ellipse cx="-22" cy="-154" rx="4.2" ry="9"/><ellipse cx="-8" cy="-162" rx="4.2" ry="9"/><ellipse cx="0" cy="-166" rx="4.2" ry="9"/><ellipse cx="8" cy="-162" rx="4.2" ry="9"/><ellipse cx="22" cy="-154" rx="4.2" ry="9"/><ellipse cx="44" cy="-146" rx="4.2" ry="9"/></g>
          </g>

          <g id="house"><rect x="0" y="0" width="52" height="34" fill="#DCC59B"/><path d="M-5 1 L26 -18 L57 1 Z" fill="#9A6B45"/><rect x="9" y="13" width="13" height="21" fill="#7C5A32"/><rect x="31" y="11" width="13" height="12" fill="#8FB0BD"/></g>

          <g id="palo">
            <path d="M0 0 C -2 -30 -8 -46 -20 -62 M0 0 C 2 -30 6 -48 16 -64 M0 0 C 0 -34 0 -52 2 -70" fill="none" stroke="#8AA24E" strokeWidth="7" strokeLinecap="round"/>
            <path d="M-20 -62 C -30 -70 -34 -80 -30 -92 M16 -64 C 26 -72 30 -82 24 -96 M2 -70 C 2 -82 -2 -92 -6 -102" fill="none" stroke="#8AA24E" strokeWidth="4.5" strokeLinecap="round"/>
            <ellipse cx="-16" cy="-84" rx="26" ry="20" fill="#A6C06A" opacity=".85"/>
            <ellipse cx="14" cy="-88" rx="24" ry="19" fill="#9CB863" opacity=".85"/>
            <ellipse cx="-2" cy="-102" rx="22" ry="17" fill="#AEC873" opacity=".8"/>
            <g fill="#F2D23E"><circle cx="-24" cy="-80" r="2.4"/><circle cx="-10" cy="-92" r="2.4"/><circle cx="6" cy="-84" r="2.4"/><circle cx="18" cy="-94" r="2.4"/><circle cx="-2" cy="-106" r="2.4"/></g>
          </g>

          <g id="britt">
            <ellipse cx="0" cy="0" rx="28" ry="14" fill="#8FA06C"/>
            <ellipse cx="-8" cy="-4" rx="18" ry="11" fill="#9DAE78"/>
            <ellipse cx="10" cy="-3" rx="16" ry="10" fill="#9DAE78"/>
            <g stroke="#9DAE78" strokeWidth="2"><path d="M-14 -6 V-22"/><path d="M2 -8 V-28"/><path d="M16 -6 V-20"/></g>
            <g fill="#F2C637"><circle cx="-14" cy="-24" r="4"/><circle cx="2" cy="-30" r="4.5"/><circle cx="16" cy="-22" r="4"/></g>
            <g fill="#C98A2A"><circle cx="-14" cy="-24" r="1.6"/><circle cx="2" cy="-30" r="1.8"/><circle cx="16" cy="-22" r="1.6"/></g>
          </g>

          <g id="coyote">
            {/* bushy low tail with a dark tip */}
            <path d="M50 -44 C 66 -46 77 -36 78 -22 C 79 -12 74 -2 66 4 C 60 8 55 6 57 0 C 64 -6 66 -16 60 -26 C 55 -34 50 -38 46 -40 Z" fill="#8a6c47"/>
            <path d="M64 3 C 73 -3 78 -13 78 -22 C 75 -13 69 -5 60 1 C 58 5 61 6 64 3 Z" fill="#2a2018" opacity=".8"/>
            {/* far pair of legs, set behind & darker */}
            <path d="M53 -30 C 55 -22 54 -15 51 -10 C 49 -6 48 -2 48 0 L53 0 C 54 -3 55 -6 55 -10 C 57 -16 58 -23 57 -30 Z" fill="#6f5a44"/>
            <path d="M-2 -32 C -3 -22 -3 -12 -3 -4 C -3 -1 -2 0 0 0 L4 0 C 5 -2 5 -4 4.5 -6 C 4 -15 3.5 -24 3 -32 Z" fill="#6f5a44"/>
            {/* body + neck as one continuous mass (full, seamless connection to the head) */}
            <path d="M52 -44 C 44 -52 22 -53 2 -51 C -14 -49 -28 -56 -41 -64 C -40 -54 -38 -46 -34 -40 C -28 -33 -16 -30 -5 -29 C 8 -26 26 -26 40 -28 C 49 -29 55 -34 52 -44 Z" fill="#AE8C60"/>
            {/* darker grizzled saddle along the back */}
            <path d="M50 -45 C 42 -51 22 -52 4 -50 C -6 -49 -14 -51 -22 -55 C -16 -49 -4 -46 10 -45 C 26 -44 40 -43 50 -45 Z" fill="#7E6A50"/>
            {/* pale throat blaze & belly */}
            <path d="M-6 -29 C -16 -31 -26 -35 -33 -41 C -29 -33 -19 -30 -9 -29 C -3 -28 1 -29 4 -30 C 0 -31 -3 -31 -6 -29 Z" fill="#E0D0B0" opacity=".9"/>
            <path d="M0 -27 C 12 -24 26 -24 38 -26 C 30 -21 12 -21 1 -24 C -2 -25 -3 -26 0 -27 Z" fill="#E0D0B0" opacity=".85"/>
            {/* near hind leg (haunch → bent hock → paw) */}
            <path d="M47 -30 C 49 -23 48 -17 45 -12 C 43 -8 41 -4 41 0 L46 0 C 47 -3 48 -6 48 -10 C 50 -17 51 -24 50 -30 Z" fill="#B0885A"/>
            <path d="M44 -12 C 43 -8 41 -4 41 0 L46 0 C 47 -3 48 -6 48 -10 C 46 -11 45 -11 44 -12 Z" fill="#9E7448"/>
            {/* near front leg (slender, small forward paw) */}
            <path d="M-11 -32 C -12 -22 -12 -12 -12 -4 C -12 -1 -11 0 -9 0 L-5 0 C -4 -2 -4 -4 -4.5 -6 C -5 -15 -5.5 -24 -6 -32 Z" fill="#B0885A"/>
            <path d="M-11 -14 C -11 -9 -12 -5 -12 -4 C -12 -1 -11 0 -9 0 L-5 0 C -4 -2 -4 -4 -4.5 -6 C -7 -9 -9 -12 -11 -14 Z" fill="#9E7448"/>
            {/* head (overlaps the neck top so the join is seamless) */}
            <path d="M-26 -50 C -32 -60 -31 -70 -42 -73 C -51 -75 -56 -67 -55 -59 C -54 -53 -49 -50 -42 -49 C -35 -48 -30 -48 -26 -50 Z" fill="#AE8C60"/>
            {/* muzzle: tawny top, pale underside */}
            <path d="M-52 -58 C -60 -58 -67 -55 -69 -52 C -70 -49 -64 -47 -58 -48 C -53 -49 -51 -52 -51 -55 Z" fill="#9E7448"/>
            <path d="M-58 -48 C -64 -47 -70 -49 -69 -52 C -66 -51 -60 -50 -55 -50 C -53 -50 -53 -49 -58 -48 Z" fill="#E0D0B0" opacity=".7"/>
            <path d="M-30 -50 C -36 -49 -44 -50 -50 -53 C -46 -50 -40 -49 -34 -49 C -31 -49 -30 -49 -30 -50 Z" fill="#E0D0B0" opacity=".55"/>
            {/* large erect ears, bases overlapping the skull */}
            <path d="M-46 -68 C -51 -78 -49 -85 -43 -84 C -39 -83 -38 -76 -39 -68 C -42 -66 -44 -66 -46 -68 Z" fill="#9E7448"/>
            <path d="M-45 -69 C -47 -77 -45 -81 -43 -81 C -42 -78 -42 -73 -42 -69 C -43 -68 -44 -68 -45 -69 Z" fill="#E0D0B0" opacity=".7"/>
            <path d="M-38 -68 C -40 -79 -35 -84 -31 -82 C -28 -80 -29 -73 -32 -67 C -34 -66 -36 -66 -38 -68 Z" fill="#AE8C60"/>
            <path d="M-36 -69 C -37 -77 -34 -80 -32 -79 C -31 -76 -32 -72 -33 -68 C -34 -68 -35 -68 -36 -69 Z" fill="#E0D0B0" opacity=".7"/>
            {/* nose & eye */}
            <circle cx="-68" cy="-52" r="2.2" fill="#2a2018"/>
            <circle cx="-45" cy="-60" r="1.9" fill="#2a2018"/>
            <circle cx="-45.6" cy="-60.6" r=".6" fill="#e8ddc4"/>
            {/* grizzled fur flecks for a varied coat */}
            <g stroke="#6f5a44" strokeWidth="1" strokeLinecap="round" opacity=".45"><path d="M8 -49 l3 5"/><path d="M20 -49 l3 5"/><path d="M32 -47 l3 5"/><path d="M-2 -46 l3 5"/><path d="M44 -44 l2 5"/></g>
            <g stroke="#cbb489" strokeWidth="1" strokeLinecap="round" opacity=".5"><path d="M14 -45 l2 5"/><path d="M26 -44 l2 5"/><path d="M2 -42 l2 5"/><path d="M38 -40 l2 5"/></g>
          </g>

          <g id="fp"><ellipse cx="0" cy="0" rx="4.6" ry="7.4"/><ellipse cx="0.5" cy="-10" rx="2.3" ry="3"/></g>

          <g id="cont">
            <rect x="0" y="46" width="74" height="9" rx="2" fill="#33323a"/>
            <rect x="2" y="0" width="70" height="46" rx="3" fill="url(#elCont)"/>
            <g stroke="#8f3f24" strokeWidth="2" opacity=".55"><path d="M12 4 V44"/><path d="M22 4 V44"/><path d="M32 4 V44"/><path d="M42 4 V44"/><path d="M52 4 V44"/><path d="M62 4 V44"/></g>
            <rect x="2" y="0" width="70" height="6" fill="#D98A5E" opacity=".7"/>
            <circle cx="16" cy="58" r="8" fill="#2b2b30"/><circle cx="16" cy="58" r="3" fill="#5a5a63"/>
            <circle cx="58" cy="58" r="8" fill="#2b2b30"/><circle cx="58" cy="58" r="3" fill="#5a5a63"/>
          </g>

          <g id="loco">
            <rect x="0" y="46" width="84" height="9" rx="2" fill="#33323a"/>
            <rect x="0" y="4" width="26" height="50" rx="4" fill="url(#elEngine)"/>
            <rect x="0" y="4" width="26" height="6" fill="#E7C77E" opacity=".8"/>
            <rect x="5" y="12" width="15" height="16" rx="2" fill="#BCD4DD"/>
            <rect x="26" y="18" width="56" height="36" rx="4" fill="url(#elEngine)"/>
            <rect x="26" y="26" width="56" height="6" fill="#E7C77E" opacity=".8"/>
            <rect x="66" y="4" width="10" height="14" rx="2" fill="#2b2b30"/>
            <circle cx="78" cy="40" r="6" fill="#F7EAC4"/><circle cx="78" cy="40" r="3" fill="#fff"/>
            <circle cx="16" cy="58" r="9" fill="#2b2b30"/><circle cx="16" cy="58" r="4" fill="#5a5a63"/>
            <circle cx="44" cy="58" r="9" fill="#2b2b30"/><circle cx="44" cy="58" r="4" fill="#5a5a63"/>
            <circle cx="70" cy="58" r="9" fill="#2b2b30"/><circle cx="70" cy="58" r="4" fill="#5a5a63"/>
          </g>

          <g id="chuck">
            <path d="M-18 -5 Q-46 -2 -60 6 Q-46 10 -18 5 Z" fill="#5b4f40"/>
            <path d="M8 6 l-10 13 l4 3 l10 -10 Z" fill="#4a4034"/>
            <path d="M-12 6 l-11 12 l4 3 l11 -9 Z" fill="#4a4034"/>
            <ellipse cx="0" cy="0" rx="26" ry="10.5" fill="#6e5f49"/>
            <path d="M10 5 l-8 13 l4 3 l9 -10 Z" fill="#5b4f40"/>
            <path d="M-10 5 l-9 12 l4 3 l9 -9 Z" fill="#5b4f40"/>
            <ellipse cx="-4" cy="-3" rx="20" ry="7" fill="#7d6d52" opacity=".8"/>
            <ellipse cx="26" cy="-1" rx="9.5" ry="7" fill="#6e5f49"/>
            <path d="M30 3 q4 1 6 1" stroke="#3a3228" strokeWidth="1.2" fill="none"/>
            <circle cx="30" cy="-3" r="1.6" fill="#211a12"/>
            <g fill="#8a7a5e" opacity=".55"><ellipse cx="-8" cy="-2" rx="4" ry="2.6"/><ellipse cx="4" cy="0" rx="4" ry="2.6"/><ellipse cx="-2" cy="3" rx="3" ry="2"/><ellipse cx="14" cy="-1" rx="3.2" ry="2.2"/></g>
          </g>

          <g id="pelican">
            <line x1="-4" y1="0" x2="-4" y2="-20" stroke="#D89A3E" strokeWidth="3.4"/>
            <line x1="5" y1="0" x2="5" y2="-20" stroke="#D89A3E" strokeWidth="3.4"/>
            <path d="M-16 -30 Q-30 -24 -34 -14 L-14 -24 Z" fill="#E7DCC4"/>
            <ellipse cx="0" cy="-34" rx="22" ry="15" fill="#F4EEDE"/>
            <path d="M-8 -38 Q6 -44 18 -38" stroke="#D8CFB8" strokeWidth="2" fill="none"/>
            <path d="M14 -42 Q24 -58 20 -70 Q18 -80 26 -80 Q33 -76 30 -62 Q28 -50 24 -42 Z" fill="#F4EEDE"/>
            <circle cx="26" cy="-78" r="7.5" fill="#F4EEDE"/>
            <circle cx="29" cy="-79" r="1.7" fill="#241a12"/>
            <path d="M32 -78 L56 -71 L56 -64 L32 -71 Z" fill="#E7B85E"/>
            <path d="M32 -71 Q44 -64 56 -64 L32 -67 Z" fill="#D89A3E"/>
          </g>
          <g id="shbird">
            <line x1="-1" y1="0" x2="-1" y2="-5" stroke="#6b5a3f" strokeWidth="1.1"/>
            <line x1="2.4" y1="0" x2="2.4" y2="-5" stroke="#6b5a3f" strokeWidth="1.1"/>
            <ellipse cx="0" cy="-9" rx="6.4" ry="4" fill="#D8C6A6"/>
            <ellipse cx="-4" cy="-9" rx="3.4" ry="3" fill="#B7A57F"/>
            <circle cx="5" cy="-12.5" r="2.7" fill="#EDE3CB"/>
            <path d="M7 -12.5 l5.5 1 l-5.5 1 Z" fill="#8a6c47"/>
            <circle cx="6" cy="-13.2" r=".7" fill="#2a2018"/>
          </g>
        </defs>

        {/* SKY + SUN (high, above the ranges) */}
        <rect x="0" y="0" width="1600" height="472" fill="url(#elSky)"/>
        <circle cx="800" cy="150" r="152" fill="url(#elSun)"/>
        <circle cx="800" cy="150" r="30" fill="#FFF7DC" opacity=".9"/>

        {/* MOUNTAIN RANGES (behind the far shore) */}
        <path d="M0 404 L0 150 L70 190 L120 118 L188 202 L246 150 L306 232 L368 180 L436 268 L506 322 L566 404 Z" fill="url(#elSanta)"/>
        <path d="M0 404 L0 236 L74 256 L142 214 L212 274 L286 242 L346 302 L424 282 L494 332 L548 404 Z" fill="url(#elSantaN)" opacity=".96"/>
        <path d="M120 118 L188 202 L150 200 Z M246 150 L306 232 L262 226 Z" fill="#EBDBD6" opacity=".26"/>
        <path d="M1600 404 L1600 250 Q1522 208 1452 244 Q1382 200 1300 246 Q1228 214 1150 256 Q1092 236 1050 276 L1016 404 Z" fill="url(#elChoc)"/>
        <path d="M1600 404 L1600 300 Q1520 278 1454 300 Q1386 278 1312 306 Q1246 288 1188 312 L1150 404 Z" fill="#6E4E3A" opacity=".8"/>

        {/* BIRDS drifting over the ranges */}
        <g fill="none" stroke="#3c3a44" strokeWidth="2.6" strokeLinecap="round" opacity=".5" style={{ transformOrigin: "center", animation: "el-birds 12s ease-in-out infinite" }}>
          <path d="M360 176 q10 -9 20 0 q10 -9 20 0"/><path d="M430 156 q8 -7 16 0 q8 -7 16 0"/><path d="M494 184 q7 -6 14 0 q7 -6 14 0"/>
        </g>

        {/* FAR SHORE — a thin sliver on the left (the sea reaches further north here), broadening to the right where the rail line runs */}
        <path d="M0 404 L0 397 Q380 394 760 384 Q1050 374 1300 356 Q1450 348 1600 352 L1600 404 Z" fill="url(#elFar)"/>
        <path d="M0 397 Q380 394 760 384 Q1050 374 1300 356 Q1450 348 1600 352" fill="none" stroke="#E7D6B0" strokeWidth="3" opacity=".5"/>

        {/* two colonia cottages tucked in beside the line */}
        <use href="#house" transform="translate(1116 354) scale(.32)"/>
        <use href="#house" transform="translate(1166 360) scale(.28)"/>

        {/* RAIL LINE — runs alongside the far shore and fades into the horizon to the left */}
        <g mask="url(#elRailMask)">
          <path d="M300 403 L1600 390 L1600 384 L300 397 Z" fill="#c9b184" opacity=".4"/>
          <g stroke="#5b4a2c" strokeWidth="2.6" opacity=".5">
            <path d="M360 399 v11"/><path d="M420 398 v11"/><path d="M480 398 v11"/><path d="M540 397 v11"/><path d="M600 397 v11"/><path d="M660 396 v11"/><path d="M720 396 v11"/><path d="M780 395 v11"/><path d="M840 395 v11"/><path d="M900 394 v11"/><path d="M960 394 v11"/><path d="M1020 393 v11"/><path d="M1080 392 v11"/><path d="M1140 392 v11"/><path d="M1200 391 v11"/><path d="M1260 391 v11"/><path d="M1320 390 v11"/><path d="M1380 390 v11"/><path d="M1440 389 v11"/><path d="M1500 388 v11"/><path d="M1560 388 v11"/></g>
          <path d="M300 400 L1600 388" fill="none" stroke="#4a3a22" strokeWidth="2.4" opacity=".85"/>
          <path d="M300 406 L1600 394" fill="none" stroke="#4a3a22" strokeWidth="2.4" opacity=".85"/>
        </g>

        {/* ============ HIT: THE WIDER WORLD — freight train on the far shore ============ */}
        <g className="el-hit" onClick={onOpenWider}>
          <rect x="1034" y="324" width="566" height="96" fill="transparent"/>
          <rect className="el-ring" x="1036" y="320" width="486" height="82" rx="12" fill="none" stroke="#E7C77E" strokeWidth="2.4" strokeDasharray="8 7"/>
          <g className="el-bob">
            <use href="#cont" transform="translate(1046 330)"/>
            <use href="#cont" transform="translate(1125 330)"/>
            <use href="#cont" transform="translate(1204 330)"/>
            <use href="#cont" transform="translate(1283 330)"/>
            <use href="#cont" transform="translate(1362 330)"/>
            <text x="1241" y="351" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9" fontWeight="700" letterSpacing="2" fill="#F4E4B8" opacity=".92">STWD</text>
            <text x="1241" y="363" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9" fontWeight="700" letterSpacing="2" fill="#F4E4B8" opacity=".92">4026</text>
            <use href="#loco" transform="translate(1441 330)"/>
            {showTrainSmoke && <g><ellipse cx="1509" cy="322" rx="12" ry="7" fill="#fff" opacity=".5" style={{ transformOrigin: "center", animation: "el-rise 4.2s ease-out infinite" }}/><ellipse cx="1515" cy="315" rx="9" ry="6" fill="#fff" opacity=".38" style={{ transformOrigin: "center", animation: "el-rise 4.2s ease-out infinite 1.6s" }}/></g>}
          </g>
          <g className="el-tip" transform="translate(1300 302)">
            <rect x="-118" y="-52" width="236" height="52" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-30" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">The Wider World</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">6 field notes · OPEN ›</text>
          </g>
        </g>

        {/* SEA */}
        <rect x="0" y="400" width="1600" height="72" fill="url(#elSea)"/>
        <rect x="0" y="400" width="1600" height="4" fill="#DFECE6" opacity=".7"/>
        <ellipse cx="820" cy="418" rx="520" ry="12" fill="#EAF1EA" opacity=".45"/>
        <g opacity=".7"><path d="M420 442 h320" stroke="#EAF2ED" strokeWidth="3" strokeLinecap="round" style={{ animation: "el-glint 5s ease-in-out infinite" }}/><path d="M520 456 h220" stroke="#EAF2ED" strokeWidth="2" strokeLinecap="round" opacity=".7" style={{ animation: "el-glint 6.5s ease-in-out infinite" }}/><path d="M300 460 h180" stroke="#EAF2ED" strokeWidth="2" strokeLinecap="round" opacity=".6" style={{ animation: "el-glint 7.6s ease-in-out infinite 1s" }}/></g>
        <g style={{ transformOrigin: "center", animation: "el-rise 6s ease-out infinite" }}><ellipse cx="260" cy="452" rx="15" ry="7" fill="#fff" opacity=".45"/></g>
        <g style={{ transformOrigin: "center", animation: "el-rise 6s ease-out infinite 2.4s" }}><ellipse cx="310" cy="456" rx="12" ry="6" fill="#fff" opacity=".4"/></g>

        {/* NEAR SHORE (foreground land) */}
        <path d="M0 468 Q400 452 800 464 Q1200 476 1600 458 L1600 900 L0 900 Z" fill="url(#elSand)"/>
        <path d="M0 468 Q400 452 800 464 Q1200 476 1600 458 L1600 486 Q1200 502 800 488 Q400 476 0 492 Z" fill="#F0E6CC" opacity=".55"/>

        {/* ANCIENT TRADE ROUTE — static backdrop, behind everything: left edge → through the bioregion → up to the river's bank */}
        {showTradeRoute && <g>
          <path d="M-30 780 C 260 812 560 852 820 840 C 1030 830 1200 740 1320 650" fill="none" stroke="#C6A66E" strokeWidth="22" strokeLinecap="round" opacity=".24"/>
          <g fill="#8f6c3f" opacity=".55">
            <use href="#fp" transform="translate(-31 787) rotate(96)"/>
            <use href="#fp" transform="translate(146 793) rotate(96)"/>
            <use href="#fp" transform="translate(319 825) rotate(96)"/>
            <use href="#fp" transform="translate(493 826) rotate(94)"/>
            <use href="#fp" transform="translate(660 849) rotate(91)"/>
            <use href="#fp" transform="translate(820 833) rotate(84)"/>
            <use href="#fp" transform="translate(942 832) rotate(79)"/>
            <use href="#fp" transform="translate(1050 788) rotate(71)"/>
            <use href="#fp" transform="translate(1156 759) rotate(64)"/>
            <use href="#fp" transform="translate(1238 697) rotate(58)"/>
            <use href="#fp" transform="translate(1324 656) rotate(53)"/>
          </g>
        </g>}

        {/* AGRICULTURAL FIELDS — irrigated rows on the river's right bank, a shore strip between them and the water, continuing to the screen's right edge */}
        <g>
          <path d="M1470 476 L1600 470 L1600 762 C 1560 762 1528 748 1512 716 C 1494 676 1486 574 1470 476 Z" fill="#7C934E"/>
          <path d="M1470 476 L1600 470 L1600 762 C 1560 762 1528 748 1512 716 C 1494 676 1486 574 1470 476 Z" fill="#8AA657" opacity=".5"/>
          <path d="M1470 476 L1600 470 L1600 762 C 1560 762 1528 748 1512 716 C 1494 676 1486 574 1470 476 Z" fill="none" stroke="#6a8842" strokeWidth="2" opacity=".4"/>
          <g stroke="#5f7d3a" strokeWidth="2" opacity=".5">
            <path d="M1474 512 L1600 512"/><path d="M1480 548 L1600 548"/><path d="M1486 586 L1600 586"/><path d="M1494 624 L1600 624"/><path d="M1500 662 L1600 662"/><path d="M1510 700 L1600 700"/>
          </g>
          <g fill="#9DBE63" opacity=".8">
            <circle cx="1520" cy="496" r="3"/><circle cx="1556" cy="494" r="3"/><circle cx="1588" cy="492" r="3"/>
            <circle cx="1522" cy="530" r="3.2"/><circle cx="1558" cy="528" r="3.2"/><circle cx="1590" cy="526" r="3.2"/>
            <circle cx="1528" cy="566" r="3.4"/><circle cx="1564" cy="564" r="3.4"/><circle cx="1594" cy="562" r="3.4"/>
            <circle cx="1536" cy="604" r="3.6"/><circle cx="1572" cy="602" r="3.6"/>
            <circle cx="1546" cy="642" r="3.8"/><circle cx="1580" cy="640" r="3.8"/>
            <circle cx="1558" cy="680" r="4"/><circle cx="1588" cy="678" r="4"/>
          </g>
        </g>

        {/* RIVER — a slim channel from the bottom-right corner curving all the way up to the sea; fields sit on its right bank */}
        <path d="M1338 456 C 1372 560 1360 650 1398 742 C 1430 820 1470 864 1508 900 L1600 900 C 1580 860 1524 800 1500 730 C 1470 648 1452 556 1416 456 Z" fill="url(#elRiver)"/>
        <path d="M1338 456 C 1372 560 1360 650 1398 742 C 1430 820 1470 864 1508 900" fill="none" stroke="#7FA3A2" strokeWidth="2" opacity=".5"/>
        <path d="M1600 900 C 1580 860 1524 800 1500 730 C 1470 648 1452 556 1416 456" fill="none" stroke="#7FA3A2" strokeWidth="2" opacity=".4"/>
        <g fill="none" stroke="#DFEDE9" strokeLinecap="round" strokeWidth="2.6">
          {/* squiggly current flowing up toward the sea, held on the channel centerline so it never touches the banks */}
          <path d="M1542 890 Q1544 870 1515 850 Q1485 830 1488 810 Q1492 790 1465 770 Q1441 750 1449 730 Q1460 710 1440 690 Q1420 670 1432 650 Q1442 630 1420 610 Q1398 590 1408 570 Q1419 550 1398 530 Q1378 510 1390 490 Q1399 475 1377 460" strokeDasharray="11 22" opacity=".46" style={{ animation: "el-flow 3.6s linear infinite" }}/>
          <path d="M1560 900 Q1548 878 1522 858 Q1500 838 1500 816 Q1500 796 1476 776 Q1454 756 1456 734 Q1458 712 1436 692 Q1416 672 1428 652 Q1440 632 1418 612 Q1400 592 1410 570 Q1420 548 1400 528 Q1382 508 1392 486 Q1400 470 1380 458" strokeDasharray="8 24" strokeWidth="2" opacity=".34" style={{ animation: "el-flow 4.6s linear infinite .5s" }}/>
        </g>

        {/* ============ HIT: BIOREGION — desert plants & wildlife (middle third) ============ */}
        <g className="el-hit" onClick={onOpenBio}>
          <rect x="536" y="470" width="528" height="332" fill="transparent"/>
          <rect className="el-ring" x="552" y="496" width="496" height="292" rx="20" fill="none" stroke="#417C98" strokeWidth="3" strokeDasharray="9 8"/>
          <ellipse cx="800" cy="756" rx="256" ry="30" fill="#C6A468" opacity=".38"/>
          <g transform="translate(892 730) scale(1.02)"><use href="#palo" className="el-sway"/></g>
          <g transform="translate(626 668) scale(.82)"><use href="#oco" className="el-sway2"/></g>
          <g transform="translate(772 622) scale(-.76 .76)"><use href="#oco" className="el-sway"/></g>
          <g transform="translate(980 678) scale(.84)"><use href="#oco" className="el-sway2"/></g>
          <g transform="translate(600 768) scale(1.05)"><use href="#britt" className="el-sway2"/></g>
          <g transform="translate(1006 770) scale(1.12)"><use href="#britt" className="el-sway"/></g>
          <g transform="translate(686 792) scale(1.5)"><use href="#coyote" className="el-bob"/></g>
          <g transform="translate(748 642) scale(.98)"><use href="#chuck" className="el-sway2"/></g>
          <g transform="translate(560 512) scale(.9)"><use href="#pelican" className="el-bob"/></g>
          <g className="el-bob"><use href="#shbird" transform="translate(1032 508)"/><use href="#shbird" transform="translate(1054 516) scale(.9)"/><use href="#shbird" transform="translate(1076 506) scale(1.05)"/><use href="#shbird" transform="translate(1070 522) scale(.85)"/><use href="#shbird" transform="translate(1048 524) scale(.95)"/></g>
          <g className="el-tip" transform="translate(800 476)">
            <rect x="-116" y="-52" width="232" height="52" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-30" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">Bioregion</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">8 field notes · OPEN ›</text>
          </g>
        </g>

        {/* ============ HIT: COUNTY HISTORY — City Hall on the river bank & the Sea-Level flagpole (right third) ============ */}
        <g className="el-hit" onClick={onOpenHist}>
          <rect x="1060" y="470" width="540" height="400" fill="transparent"/>
          <rect className="el-ring" x="1076" y="498" width="508" height="360" rx="18" fill="none" stroke="#A27532" strokeWidth="3" strokeDasharray="9 8"/>

          {/* CITY HALL on the left bank of the river, upstream from the flagpole */}
          <g transform="translate(1216 720) scale(.9)">
            <ellipse cx="86" cy="150" rx="104" ry="15" fill="#B89464" opacity=".4"/>
            <rect x="2" y="132" width="168" height="12" fill="#C9B487"/>
            <rect x="14" y="122" width="144" height="12" fill="#D8C69C"/>
            <rect x="30" y="48" width="112" height="76" fill="#EBDCB4"/>
            <rect x="76" y="86" width="20" height="38" rx="2" fill="#7C5A32"/>
            <g fill="#8FB0BD"><rect x="40" y="60" width="16" height="22" rx="2"/><rect x="116" y="60" width="16" height="22" rx="2"/></g>
            <rect x="24" y="60" width="124" height="10" fill="#F3E8C8"/>
            <g fill="#F6EED6"><rect x="28" y="70" width="8" height="54"/><rect x="52" y="70" width="8" height="54"/><rect x="112" y="70" width="8" height="54"/><rect x="136" y="70" width="8" height="54"/></g>
            <path d="M18 60 L86 26 L154 60 Z" fill="#B15A3A"/>
            <path d="M30 56 L86 32 L142 56 Z" fill="#EBDCB4" opacity=".35"/>
            <rect x="72" y="4" width="28" height="24" fill="#E4D3A6"/>
            <circle cx="86" cy="16" r="7" fill="#F6EED6" stroke="#B89A5E" strokeWidth="1.5"/>
            <path d="M68 4 L86 -14 L104 4 Z" fill="#8A4A30"/>
            <line x1="86" y1="-14" x2="86" y2="-26" stroke="#6b4a2a" strokeWidth="2"/>
            <path d="M86 -26 L100 -22 L86 -18 Z" fill="#B15A3A"/>
            <g className="el-tip">
              <rect x="0" y="150" width="172" height="30" rx="6" fill="#3C2A18" stroke="#A27532" strokeWidth="2"/>
              <text x="86" y="164" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" fontWeight="700" letterSpacing=".5" fill="#F0DCA8">WESTMORLAND</text>
              <text x="86" y="175" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="7.5" letterSpacing="1.5" fill="#C9A867">CITY HALL</text>
            </g>
          </g>

          {/* SEA-LEVEL flagpole monument, moved right and up closer to the shore */}
          <g transform="translate(1176 694)">
            <ellipse cx="0" cy="2" rx="30" ry="8" fill="#B89464" opacity=".5"/>
            <rect x="-3" y="-186" width="6" height="188" rx="2" fill="#8a7654"/>
            <rect x="-3" y="-186" width="2.4" height="188" fill="#a9946e"/>
            <circle cx="0" cy="-186" r="4" fill="#A27532"/>
            <g className="el-flag">
              <path d="M0 -184 L62 -176 Q52 -168 62 -160 L0 -158 Z" fill="#417C98"/>
              <path d="M0 -184 L62 -176 Q52 -168 62 -160 L0 -158 Z" fill="#fff" opacity=".08"/>
            </g>
            <g className="el-tip">
              <rect x="-72" y="-8" width="144" height="34" rx="6" fill="#FBF2D2" stroke="#B89A5E" strokeWidth="2"/>
              <text x="0" y="6" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10.5" fontWeight="700" letterSpacing=".5" fill="#6b4a2a">Sea Level Flagpole</text>
              <text x="0" y="19" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="7.5" letterSpacing=".5" fill="#9c7a3a">ELEV. 0 FT · HIST. SITE</text>
            </g>
          </g>

          <g className="el-tip" transform="translate(1300 476)">
            <rect x="-116" y="-52" width="232" height="52" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-30" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">County History</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">7 field notes · OPEN ›</text>
          </g>
        </g>

        {/* ============ HIT: INDIGENOUS PEOPLES — Quechan rattle, olla & the Obsidian Buttes (left third) ============ */}
        <g className="el-hit" onClick={onOpenIndig}>
          <rect x="36" y="470" width="484" height="360" fill="transparent"/>
          <rect className="el-ring" x="52" y="496" width="432" height="318" rx="18" fill="none" stroke="#2E5534" strokeWidth="3" strokeDasharray="9 8"/>

          {/* RED ISLAND LAVA DOME VOLCANO (part of Salton Buttes) — larger dark volcanic domes on the ancient lakeshore */}
          <ellipse cx="262" cy="640" rx="252" ry="32" fill="#5b4a38" opacity=".26"/>
          <path d="M74 634 Q150 496 246 510 Q326 522 344 634 Z" fill="#3b3a44"/>
          <path d="M74 634 Q150 496 246 510 Q276 514 292 544 Q198 532 122 634 Z" fill="#4c4b58" opacity=".8"/>
          <path d="M150 646 Q234 482 356 500 Q466 518 486 646 Z" fill="#2f2e39"/>
          <path d="M150 646 Q234 482 356 500 Q392 506 412 540 Q300 520 206 646 Z" fill="#454452" opacity=".85"/>
          <g fill="#9695a8" opacity=".42"><path d="M330 544 l14 30 l-20 6 Z"/><path d="M250 574 l9 18 l-13 5 Z"/><path d="M378 558 l8 17 l-12 5 Z"/></g>
          {/* small obsidian shards at the foot */}
          <g fill="#26252e"><path d="M118 638 l10 -22 l7 22 Z"/><path d="M150 642 l6 -14 l6 14 Z"/><path d="M422 640 l8 -18 l7 18 Z"/><path d="M454 642 l6 -13 l6 13 Z"/><path d="M300 648 l7 -15 l6 15 Z"/></g>
          <g fill="#4a4956" opacity=".7"><path d="M133 638 l4 -12 l1 12 Z"/><path d="M429 640 l4 -12 l1 12 Z"/></g>
          <g className="el-tip" transform="translate(300 575)">
            <rect x="-85" y="-14" width="170" height="32" rx="6" fill="#FBF2D2" stroke="#B89A5E" strokeWidth="2"/>
            <text x="0" y="1" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" fontWeight="700" letterSpacing=".5" fill="#6b4a2a">RED ISLAND LAVA DOME</text>
            <text x="0" y="12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="7.5" letterSpacing="1.5" fill="#9c7a3a">VOLCANO · SALTON BUTTES</text>
          </g>

          {/* woven trade mat */}
          <ellipse cx="248" cy="760" rx="150" ry="26" fill="#B98B4E"/>
          <ellipse cx="248" cy="756" rx="150" ry="23" fill="#C79A5B"/>
          <g stroke="#9C6E38" strokeWidth="1.4" opacity=".5"><path d="M248 734 L248 780"/><path d="M118 756 L378 756"/><path d="M148 738 L348 776"/><path d="M148 776 L348 738"/></g>

          {/* olla vase */}
          <g transform="translate(190 664) scale(.98)">
            <ellipse cx="0" cy="118" rx="58" ry="14" fill="#3C2A18" opacity=".2"/>
            <path d="M-58 66 A58 58 0 1 1 58 66 Q40 118 0 120 Q-40 118 -58 66 Z" fill="url(#elOlla)"/>
            <path d="M-58 62 A58 58 0 0 1 58 62" fill="#fff" opacity=".12"/>
            <path d="M-24 14 L-20 -2 L20 -2 L24 14 Z" fill="#B0562F"/><rect x="-22" y="-8" width="44" height="8" rx="3" fill="#98492E"/>
            <g stroke="#3C2A18" strokeWidth="3" fill="none" opacity=".85"><path d="M-46 44 L-30 32 L-14 44 L2 32 L18 44 L34 32 L48 44"/></g>
            <g fill="#F1E4C2" opacity=".8"><circle cx="-28" cy="72" r="3"/><circle cx="0" cy="80" r="3"/><circle cx="28" cy="72" r="3"/></g>
          </g>

          {/* Quechan gourd rattle */}
          <g transform="translate(350 656) rotate(16) scale(.98)">
            <g className="el-rattle">
              <rect x="-6" y="6" width="13" height="86" rx="6" fill="#7C5A32"/>
              <g stroke="#5f4526" strokeWidth="2"><path d="M-6 30 h13"/><path d="M-6 46 h13"/></g>
              <circle cx="0" cy="-16" r="32" fill="url(#elGourd)"/>
              <path d="M-32 -16 A32 32 0 0 1 32 -16" fill="#fff" opacity=".14"/>
              <g fill="#7d4a24"><circle cx="-11" cy="-25" r="2.8"/><circle cx="2" cy="-30" r="2.8"/><circle cx="13" cy="-20" r="2.8"/><circle cx="-3" cy="-11" r="2.8"/><circle cx="10" cy="-5" r="2.8"/><circle cx="-14" cy="-8" r="2.8"/></g>
            </g>
          </g>

          <g className="el-tip" transform="translate(258 480)">
            <rect x="-128" y="-52" width="256" height="52" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-30" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">Indigenous Peoples</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">6 field notes · OPEN ›</text>
          </g>
        </g>
        {/* ============ HIT (bioregion sub): THE SALTON SEA — the open water ============ */}
        <g className="el-hit2" onClick={onSea}>
          <rect x="20" y="402" width="990" height="64" fill="transparent"/>
          <rect className="el-ring" x="60" y="406" width="900" height="56" rx="16" fill="none" stroke="#417C98" strokeWidth="2.4" strokeDasharray="9 8"/>
          <g className="el-tip" transform="translate(430 404)">
            <rect x="-104" y="-50" width="208" height="50" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-29" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">The Salton Sea</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" letterSpacing="1" fill="#8FBECE">BIOREGION · OPEN ›</text>
          </g>
        </g>

        {/* ============ HIT (bioregion sub): SANTA ROSA ESCARPMENT — the NW ranges ============ */}
        <g className="el-hit2" onClick={onSantaRosa}>
          <rect x="10" y="120" width="552" height="252" fill="transparent"/>
          <rect className="el-ring" x="24" y="150" width="520" height="212" rx="18" fill="none" stroke="#417C98" strokeWidth="2.4" strokeDasharray="9 8"/>
          <g className="el-tip" transform="translate(250 152)">
            <rect x="-128" y="-50" width="256" height="50" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-29" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="15" fontWeight="700" fill="#fff">San Jacinto Mountain Range</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" letterSpacing="1" fill="#8FBECE">BIOREGION · GEOLOGY ›</text>
          </g>
        </g>

        {/* ============ HIT (bioregion sub): CHOCOLATE MOUNTAINS — the eastern ranges (above the train) ============ */}
        <g className="el-hit2" onClick={onChocolate}>
          <rect x="1040" y="206" width="560" height="116" fill="transparent"/>
          <rect className="el-ring" x="1052" y="214" width="536" height="100" rx="14" fill="none" stroke="#417C98" strokeWidth="2.4" strokeDasharray="9 8"/>
          <g className="el-tip" transform="translate(1320 214)">
            <rect x="-122" y="-50" width="244" height="50" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="-29" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="15" fontWeight="700" fill="#fff">Chocolate Mountains</text>
            <text x="0" y="-12" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" letterSpacing="1" fill="#8FBECE">BIOREGION · GEOLOGY ›</text>
          </g>
        </g>

        {/* ============ HIT (bioregion sub): SUN & CLIMATE — the desert sun ============ */}
        <g className="el-hit2" onClick={onSun}>
          <circle cx="800" cy="150" r="128" fill="transparent"/>
          <circle className="el-ring" cx="800" cy="150" r="118" fill="none" stroke="#417C98" strokeWidth="2.4" strokeDasharray="9 8"/>
          <g className="el-tip" transform="translate(800 292)">
            <rect x="-98" y="-6" width="196" height="50" rx="11" fill="#241f17" opacity=".95"/>
            <path d="M-9 0 L9 0 L0 -12 Z" fill="#241f17" opacity=".95"/>
            <text x="0" y="17" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="16" fontWeight="700" fill="#fff">Sun &amp; Climate</text>
            <text x="0" y="34" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="9.5" letterSpacing="1" fill="#8FBECE">BIOREGION · OPEN ›</text>
          </g>
        </g>
      </svg>
  );
}