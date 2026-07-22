import React, { Fragment } from "react";

export default function ModernTheme(props: any) {
  const { 
    pathway, onBackTrailhead, pwColor, pwMark, pwName, pwShelf, showJobs, pwJobCount, 
    onSwitchPathway, otherPwName, pwIntro, atlasIsTrail, pwIsCreator, pwIsEnviro, 
    atlasEdges, atlasNodes, atlasIsBasecamp, jobRows, boardChips, popupOpen, popColor, 
    popMark, popShelf, popStopName, onClosePopup, popBlurb, popEntryCount, popEntryList, 
    popCall, popType, popSub, popTitle, popMedia, popImages, popParas, popFacts, popSrcs, 
    pwTag, suggestOpen, onOpenSuggest, onCloseSuggest, sgDone, sgNotDone, sgTitle, 
    onSgTitle, sgUrl, onSgUrl, sgPathway, onSgPathway, sgType, onSgType, sgStop, onSgStop, 
    sgNote, onSgNote, canSubmit, sgSubmitStyle, onSubmitSuggest, sgSubmitting, isSteward, 
    isExplorer, onRoleExplorer, onRoleSteward, onToggleIntro, introToggleLabel, 
    introExpanded, waypointCount, noteCount, jobCount, showTrailhead, entryIsCrossroads, 
    entryIsMaps, showPathway, creatorTipMeta, enviroTipMeta, mapCards, onPickCreator, 
    onPickEnviro, stop, roleExplorerStyle, roleStewardStyle, showShell, showScan, 
    showMapToggle, onMapMode, listModeStyle, onListMode, mapModeStyle, 
    shelfCount, totalPublished, pwCards, showOverview, navItems, isAdminUser, 
    theme, setTheme, footTag, popEntry, popHasQuiz, quizPrompt, quizPickLabel, quizOptions, 
    quizAllowCustom, quizCustomLabel, quizCustom, onQuizCustom, onQuizCustomBlur, 
    quizCustomStyle, quizAnswered, quizUnanswered, quizStatusLabel, quizStatusStyle, 
    quizHint, onQuizClear, quizClearStyle, quizSummitBtnLabel, quizSummitBtnStyle, 
    onQuizPick, onQuizCustomPick, runClaimed, summitLocked, summitClaimable, summitDone, 
    remainingCount, remainingText, onClaim, onPrintCard, onResetRun, summitTitle, 
    summitKlass, summitIntro, summitCloser, summitChecklist, runComplete, cardStatRows,
    libFilterChips = [], libTotal = 0, libNodeChips = [], libGroups = [], libBoards = [],
    shelfItems = []
  } = props;

  const [modernScreen, setModernScreen] = React.useState(props.initialScreen || 'main');
  
  React.useEffect(() => {
    if (props.initialScreen) {
      setModernScreen(props.initialScreen);
    }
  }, [props.initialScreen]);

  const onOpenLibrary = () => setModernScreen('library');
  const onOpenShelf = () => setModernScreen('shelf');
  const onBackLibrary = () => setModernScreen('main');
  const onBackShelf = () => setModernScreen('main');
  const showLibrary = modernScreen === 'library';
  const showShelf = modernScreen === 'shelf';

  const shelfSub = shelfItems ? `${shelfItems.length} resources saved for later` : "0 items shelved";
  const shelfEmpty = shelfItems ? shelfItems.length === 0 : true;
  const shelfHasCards = (props as any).shelfHasCards || false;
  const shelfCards = (props as any).shelfCards || [];
  const shelfHas = shelfItems && shelfItems.length > 0;

  // Derived Summit states for Modern UI
  const completedStops = summitChecklist ? summitChecklist.filter((s: any) => s.done).length : 0;
  const totalStops = summitChecklist ? summitChecklist.length : 5;
  const summitProgLabel = `${completedStops} / ${totalStops}`;
  const showSummitTile = !!summitChecklist && summitChecklist.length > 0;
  
  const [showSummit, setShowSummit] = React.useState(false);
  
  function onOpenSummit() {
    setShowSummit(true);
  }
  
  function onCloseSummit() {
    setShowSummit(false);
  }
  
  function onQuizToSummit() {
    onClosePopup();
    setShowSummit(true);
  }

  const cssString = `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  input,textarea,select,button{font-family:inherit}
  .wf::placeholder{color:#a9a49a}
  @keyframes wf-fadein{from{opacity:0}to{opacity:1}}
  @keyframes wf-pagein{from{opacity:0;transform:translate(-50%,10px) scale(.985)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
  @keyframes wf-glint{0%,100%{opacity:.25}50%{opacity:.9}}
  @keyframes wf-sway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}
  @keyframes wf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes wf-flag{0%,100%{transform:rotate(-2.4deg)}50%{transform:rotate(2.8deg)}}
  @keyframes wf-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-5px)}}
  .wf-scroll::-webkit-scrollbar{width:10px}
  .wf-scroll::-webkit-scrollbar-thumb{background:#c9b184;border-radius:8px;border:3px solid transparent;background-clip:content-box}
  .wf-scroll::-webkit-scrollbar-track{background:transparent}
  .wf-hit{cursor:pointer;transition:transform .34s cubic-bezier(.34,1.35,.5,1)}
  .wf-hit:hover{transform:translateY(-10px)}
  .wf-hit .wf-tip{opacity:0;transition:opacity .2s ease;pointer-events:none}
  .wf-hit:hover .wf-tip{opacity:1}
  .wf-hit .wf-ring{opacity:0;transition:opacity .2s ease}
  .wf-hit:hover .wf-ring{opacity:.9}
  .wf-sway{transform-box:fill-box;transform-origin:bottom center;animation:wf-sway 6s ease-in-out infinite}
  .wf-bob{transform-box:fill-box;transform-origin:center bottom;animation:wf-bob 4.8s ease-in-out infinite}
  .wf-flagg{transform-box:fill-box;transform-origin:left center;animation:wf-flag 4.6s ease-in-out infinite}
  .wf-node{cursor:pointer;transition:transform .3s cubic-bezier(.34,1.35,.5,1)}
  .wf-node:hover{transform:translate(-50%,-50%) translateY(-8px) !important}
  .wf-node .wf-open{opacity:0;transition:opacity .2s ease}
  .wf-node:hover .wf-open{opacity:1}
  .wf-card{cursor:pointer;transition:transform .3s cubic-bezier(.34,1.35,.5,1)}
  .wf-card:hover{transform:translateY(-6px)}
  .wf-card .wf-open{opacity:0;transition:opacity .2s ease}
  .wf-card:hover .wf-open{opacity:1}
  .wf-rte-content p { margin: 16px 0 0; font: 500 15px/1.65 'Exo', sans-serif; color: var(--ink); }
  .wf-rte-content a { color: var(--blue); text-decoration: underline; }
  .wf-rte-content ul, .wf-rte-content ol { margin: 12px 0 0; padding-left: 22px; font: 500 15px/1.65 'Exo', sans-serif; color: var(--ink); }
  .wf-rte-content li { margin: 6px 0; }
  .wf-rte-content h3 { font: 700 12.5px/1.4 'Courier New', monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--gold); margin: 24px 0 8px; }
  `;

  return (
    <div style={{display: "contents"}}>
      <style dangerouslySetInnerHTML={{ __html: cssString }} />
      

<div suppressHydrationWarning={true} data-screen-label="Workforce Development — Pathways Atlas" style={{ "--ink":"#241f17", "--ink2":"#6b6153", "--parch":"#FBF2D2", "--parch2":"#F3E6BE", "--cream":"#FEFAE0", "--wood":"#6B4A2A", "--wood-d":"#3C2A18", "--brass":"#A27532", "--foil":"#E7C77E", "--blue":"#417C98", "--green":"#2E5534", "--gold":"#A27532", "--terra":"#B15A3A", minHeight:"100vh", background:"radial-gradient(120% 90% at 50% -10%,#FCF5DC 0%,#FBF2D2 46%,#F3E6BE 100%)", fontFamily:"'Exo',sans-serif", color:"var(--ink)", overflowX:"hidden", display:"flex", flexDirection:"column" } as any}>

    <div style={{position:"sticky",top:0,zIndex:40,display:"flex",alignItems:"center",gap:"16px",padding:"11px 26px",background:"rgba(251,242,210,.88)",backdropFilter:"blur(8px)",borderBottom:"1px solid rgba(60,42,24,.14)"}}>
      <a href="/hub" style={{flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:"8px",color:"var(--brass)",textDecoration:"none",font:"700 11px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase"}}>‹ Back to Hub</a>
      <div style={{flex:1,minWidth:0,textAlign:"center",lineHeight:1.25}}>
        <div style={{font:"700 11px/1 'Courier New',monospace",letterSpacing:".22em",textTransform:"uppercase",color:"var(--wood-d)"}}>Workforce Development</div>
        <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".28em",textTransform:"uppercase",color:"var(--ink2)",marginTop:"3px",opacity:0.8}}>Pathways Atlas · Est. 2026</div>
      </div>
      <div role="group" aria-label="Theme" style={{flex:"0 0 auto",display:"inline-flex",alignItems:"center",background:"rgba(60,42,24,.07)",border:"1px solid rgba(60,42,24,.16)",borderRadius:"11px",padding:"3px",gap:"2px"}}>
        <span style={{padding:"0 8px 0 4px",font:"700 8px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",opacity:0.7}}>Theme</span>
        <button onClick={() => setTheme('modern')} style={{...roleExplorerStyle, background: theme === 'modern' ? '#3C2A18' : 'transparent', color: theme === 'modern' ? '#F7EAC4' : '#6b6153'}}>Modern</button>
        <button onClick={() => setTheme('arcade')} style={{...roleExplorerStyle, background: theme === 'arcade' ? '#3C2A18' : 'transparent', color: theme === 'arcade' ? '#F7EAC4' : '#6b6153'}}>Arcade</button>
      </div>
      {isAdminUser && (
        <>
          <div role="group" aria-label="View as" style={{flex:"0 0 auto",display:"inline-flex",alignItems:"center",background:"rgba(60,42,24,.07)",border:"1px solid rgba(60,42,24,.16)",borderRadius:"11px",padding:"3px",gap:"2px"}}>
            <span style={{padding:"0 8px 0 4px",font:"700 8px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",opacity:0.7}}>View</span>
            <button onClick={onRoleExplorer} style={roleExplorerStyle}>Explorer</button>
            <button onClick={onRoleSteward} style={roleStewardStyle}>Steward</button>
          </div>
          {isSteward && (
            <a href="/admin/workforce-pathways" style={{flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 14px",background:"var(--wood-d)",color:"#f3e2b6",textDecoration:"none",borderRadius:"10px",font:"700 10px/1 'Courier New',monospace",letterSpacing:".13em",textTransform:"uppercase"}}>✦ Open steward console ›</a>
          )}
        </>
      )}
      {isExplorer && (
<>
      <button onClick={onOpenLibrary} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 14px",background:"var(--blue)",color:"#fff",borderRadius:"10px",font:"700 10px/1 'Courier New',monospace",letterSpacing:".13em",textTransform:"uppercase"}}>✦ Vault</button>
      <button onClick={onOpenShelf} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 14px",background:"var(--wood-d)",color:"#f3e2b6",borderRadius:"10px",font:"700 10px/1 'Courier New',monospace",letterSpacing:".13em",textTransform:"uppercase"}}>★ My Shelf — {shelfCount}</button>
      <button onClick={onOpenSuggest} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,flex:"0 0 auto",display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 14px",background:"var(--brass)",color:"#fff",borderRadius:"10px",font:"700 10px/1 'Courier New',monospace",letterSpacing:".13em",textTransform:"uppercase"}}>＋ Suggest a resource</button>
</>
)}
  </div>

  <div style={{position:"relative",width:"100%",maxWidth:"1100px",margin:"0 auto",padding:"20px 26px 2px"}}>
    {introExpanded && (
<>
    <div style={{textAlign:"center"}}>
      <div style={{font:"700 11px/1 'Courier New',monospace",letterSpacing:".3em",textTransform:"uppercase",color:"var(--brass)"}}>Imperial County · AI Skills &amp; Regional Careers</div>
      <h1 style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"clamp(28px,3.6vw,44px)",lineHeight:1,letterSpacing:"-.015em",color:"var(--ink)",margin:"10px 0 0"}}>Workforce&nbsp;Development</h1>
      <p style={{maxWidth:"700px",margin:"12px auto 0",fontSize:"15px",lineHeight:1.6,color:"var(--ink2)"}}>Two trails leave this trailhead — the <strong style={{color:"var(--terra)"}}>Content&nbsp;Creator</strong> trail and the <strong style={{color:"var(--green)"}}>Environmental&nbsp;Careers</strong> trail. They cross more than once: the strategy on both is the same — <strong style={{color:"var(--gold)"}}>build a portfolio</strong>, an asset you own and steer. Waypoints hold career profiles, tools, local employers, and supports for <strong style={{color:"var(--blue)"}}>IVC&nbsp;MESA</strong> students.</p>
      <p style={{maxWidth:"560px",margin:"10px auto 0",font:"600 12.5px/1.55 'Exo',sans-serif",color:"var(--ink)",opacity:0.85}}>Pick a trail below — then choose your path and enjoy the journey.</p>
    </div>
    </>
)}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:"12px",marginTop:"14px"}}>
      <div style={{font:"700 10.5px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",color:"var(--ink2)",opacity:0.82}}>2 trails · {waypointCount} waypoints · {noteCount} field notes · {jobCount} postings</div>
      <button onClick={onToggleIntro} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"999px",border:"1px solid rgba(60,42,24,.2)",background:"rgba(255,255,255,.55)",font:"700 9px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--wood-d)"}}>{introToggleLabel}</button>
    </div>
  </div>

  {showTrailhead && (
<>
  <div data-screen-label="Trailhead — choose a pathway">

    {entryIsCrossroads && (
<>
    <div style={{width:"100%",margin:"14px 0 0",padding:"0 0 10px"}}>
      <div style={{position:"relative",width:"100%",overflow:"hidden"}}>
        <svg viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid meet" style={{display:"block",width:"100%",height:"auto"}}>
          <defs>
            <linearGradient id="wfSky" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#584A6B"/><stop offset=".22" stopColor="#8A5E68"/><stop offset=".42" stopColor="#D19A6A"/><stop offset=".58" stopColor="#EAD8AE"/><stop offset=".78" stopColor="#C8D5DC"/><stop offset="1" stopColor="#AEC6DA"/>
            </linearGradient>
            <radialGradient id="wfSun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF7DC"/><stop offset="40%" stopColor="#FBE6A9" stopOpacity=".9"/><stop offset="100%" stopColor="#FBE6A9" stopOpacity="0"/></radialGradient>
            <linearGradient id="wfSandL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B98B5E"/><stop offset=".5" stopColor="#D2AC74"/><stop offset="1" stopColor="#E4C994"/></linearGradient>
            <linearGradient id="wfMtnL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6E5A75"/><stop offset="1" stopColor="#54455C"/></linearGradient>
            <linearGradient id="wfMtnR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9A7358"/><stop offset="1" stopColor="#7C5942"/></linearGradient>
            <g id="wfOco">
              <g fill="none" stroke="#5f7d3a" strokeWidth="4" strokeLinecap="round">
                <path d="M0 0 C -4 -34 -20 -60 -30 -96"/><path d="M0 0 C -1 -36 -4 -72 -6 -108"/><path d="M0 0 C 1 -36 4 -72 6 -108"/><path d="M0 0 C 4 -34 20 -60 30 -96"/>
              </g>
              <g fill="#D8402E"><ellipse cx="-30" cy="-99" rx="3.4" ry="7"/><ellipse cx="-6" cy="-111" rx="3.4" ry="7"/><ellipse cx="6" cy="-111" rx="3.4" ry="7"/><ellipse cx="30" cy="-99" rx="3.4" ry="7"/></g>
            </g>
          </defs>

          <rect x="0" y="0" width="1600" height="470" fill="url(#wfSky)"/>
          <circle cx="1210" cy="140" r="130" fill="url(#wfSun)"/>
          <circle cx="1210" cy="140" r="26" fill="#FFF7DC" opacity=".92"/>
          <path d="M340 96 A 34 34 0 1 0 372 148 A 27 27 0 0 1 340 96 Z" fill="#F2E7C8" opacity=".85"/>
          <g fill="#F2E7C8"><circle cx="180" cy="72" r="2.4" style={{animation:"wf-glint 4s ease-in-out infinite"}}/><circle cx="252" cy="150" r="2" style={{animation:"wf-glint 5.4s ease-in-out infinite 1s"}}/><circle cx="120" cy="180" r="1.8" style={{animation:"wf-glint 6s ease-in-out infinite 2s"}}/><circle cx="430" cy="70" r="1.8" style={{animation:"wf-glint 5s ease-in-out infinite .6s"}}/></g>
          <g fill="none" stroke="#3c3a44" strokeWidth="2.4" strokeLinecap="round" opacity=".45" style={{transformOrigin:"center",animation:"wf-drift 12s ease-in-out infinite"}}>
            <path d="M1050 190 q9 -8 18 0 q9 -8 18 0"/><path d="M1112 168 q7 -6 14 0 q7 -6 14 0"/>
          </g>

          <path d="M0 470 L0 240 L90 290 L150 210 L230 300 L300 250 L380 340 L470 400 L540 470 Z" fill="url(#wfMtnL)"/>
          <path d="M1600 470 L1600 260 Q1500 216 1420 256 Q1330 218 1240 262 Q1160 238 1100 290 L1050 470 Z" fill="url(#wfMtnR)"/>

          <rect x="0" y="452" width="1600" height="188" fill="url(#wfSandL)"/>
          <path d="M0 452 Q400 440 800 452 Q1200 464 1600 448 L1600 470 Q1200 482 800 470 Q400 460 0 472 Z" fill="#F0E6CC" opacity=".4"/>

          {/* braided trails: they leave the trailhead, CROSS, and arrive at each camp */}
          <path d="M800 590 C 720 540 900 500 660 470 C 520 452 430 480 320 500" fill="none" stroke="#8f6c3f" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 16" opacity=".75"/>
          <path d="M800 590 C 880 540 700 498 940 468 C 1090 450 1180 484 1290 505" fill="none" stroke="#8f6c3f" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 16" opacity=".75"/>
          <path d="M660 470 C 760 452 850 452 940 468" fill="none" stroke="#8f6c3f" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 14" opacity=".45"/>

          {/* trailhead signpost */}
          <g transform="translate(800 596)">
            <ellipse cx="0" cy="6" rx="86" ry="12" fill="#B08A55" opacity=".5"/>
            <rect x="-5" y="-128" width="10" height="132" rx="3" fill="#6B4A2A"/>
            <g transform="translate(0 -112)"><path d="M-96 -14 L64 -14 L84 0 L64 14 L-96 14 Z" fill="#8A6238"/><text x="-12" y="5" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="14" fontWeight="700" letterSpacing="2" fill="#F7EAC4">FIELD STUDIO</text></g>
            <g transform="translate(0 -74)"><path d="M96 -14 L-64 -14 L-84 0 L-64 14 L96 14 Z" fill="#8A6238"/><text x="12" y="5" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="14" fontWeight="700" letterSpacing="2" fill="#F7EAC4">FIELD STATION</text></g>
            <g transform="translate(0 -38)"><rect x="-78" y="-13" width="156" height="26" rx="4" fill="#3C2A18"/><text x="0" y="5" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#E7C77E">MANY WALK BOTH</text></g>
          </g>

          {/* HIT: Content Creator camp (dusk side) */}
          <g className="wf-hit" onClick={onPickCreator}>
            <rect x="60" y="330" width="560" height="290" fill="transparent"/>
            <rect className="wf-ring" x="80" y="356" width="520" height="240" rx="18" fill="none" stroke="#B15A3A" strokeWidth="3" strokeDasharray="9 8"/>
            {/* signal tower on the ridge */}
            <g transform="translate(150 430)">
              <path d="M-22 0 L0 -110 L22 0 Z" fill="none" stroke="#5a4636" strokeWidth="4"/>
              <path d="M-15 -32 L15 -32 M-9 -66 L9 -66" stroke="#5a4636" strokeWidth="3"/>
              <circle cx="0" cy="-116" r="5" fill="#E86A4E" style={{animation:"wf-glint 2.2s ease-in-out infinite"}}/>
              <path d="M-16 -128 A 22 22 0 0 1 16 -128" fill="none" stroke="#E86A4E" strokeWidth="2.4" opacity=".6" style={{animation:"wf-glint 2.2s ease-in-out infinite .3s"}}/>
            </g>
            {/* open-air studio: folding table, laptop, camera on tripod, work light */}
            <g className="wf-bob" transform="translate(380 560)">
              <ellipse cx="0" cy="10" rx="150" ry="16" fill="#A57E4C" opacity=".45"/>
              <rect x="-92" y="-52" width="150" height="10" rx="3" fill="#7C5A32"/>
              <path d="M-84 -42 L-96 8 M-80 -42 L-60 8 M46 -42 L58 8 M42 -42 L22 8" stroke="#5a4636" strokeWidth="5" strokeLinecap="round"/>
              <g transform="translate(-38 -52)">
                <rect x="-30" y="-36" width="60" height="38" rx="4" fill="#3A3440"/>
                <rect x="-25" y="-31" width="50" height="28" rx="2" fill="#F7E6B8"/>
                <rect x="-25" y="-31" width="50" height="28" rx="2" fill="#E8A25E" opacity=".55" style={{animation:"wf-glint 5s ease-in-out infinite"}}/>
                <rect x="-34" y="0" width="68" height="5" rx="2.5" fill="#57505E"/>
              </g>
              <g transform="translate(26 -56)"><rect x="-4" y="-10" width="26" height="16" rx="3" fill="#4A4450"/><circle cx="28" cy="-2" r="7" fill="#2B2732"/><circle cx="28" cy="-2" r="3.4" fill="#8FB0BD"/><rect x="4" y="-16" width="10" height="6" rx="2" fill="#4A4450"/></g>
              <g transform="translate(112 0)">
                <path d="M0 0 L-14 -66 M0 0 L14 -66 M0 -8 L0 -66" stroke="#5a4636" strokeWidth="4" strokeLinecap="round"/>
                <g transform="translate(0 -78)"><rect x="-16" y="-11" width="32" height="22" rx="4" fill="#3A3440"/><circle cx="0" cy="0" r="7" fill="#2B2732"/><circle cx="0" cy="0" r="3.6" fill="#8FB0BD"/><circle cx="10" cy="-5" r="2" fill="#E86A4E" style={{animation:"wf-glint 1.8s ease-in-out infinite"}}/></g>
              </g>
              <g transform="translate(-128 -6)">
                <path d="M0 6 L0 -84" stroke="#5a4636" strokeWidth="4" strokeLinecap="round"/>
                <path d="M0 -84 Q-16 -92 -12 -104" fill="none" stroke="#5a4636" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="-14" cy="-110" r="9" fill="#F7E6B8"/><circle cx="-14" cy="-110" r="14" fill="#F7E6B8" opacity=".35" style={{animation:"wf-glint 4s ease-in-out infinite"}}/>
              </g>
            </g>
            <g className="wf-tip" transform="translate(340 340)">
              <rect x="-150" y="-56" width="300" height="56" rx="11" fill="#241f17" opacity=".95"/>
              <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
              <text x="0" y="-33" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="17" fontWeight="700" fill="#fff">Content Creator</text>
              <text x="0" y="-13" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">{creatorTipMeta}</text>
            </g>
          </g>

          {/* HIT: Environmental Careers camp (day side) */}
          <g className="wf-hit" onClick={onPickEnviro}>
            <rect x="990" y="330" width="560" height="290" fill="transparent"/>
            <rect className="wf-ring" x="1010" y="356" width="520" height="240" rx="18" fill="none" stroke="#2E5534" strokeWidth="3" strokeDasharray="9 8"/>
            <g transform="translate(1120 574)"><use href="#wfOco" className="wf-sway"/></g>
            <g transform="translate(1478 566) scale(.8)"><use href="#wfOco" className="wf-sway"/></g>
            {/* monitoring station: mast, solar panel, instrument box, flag */}
            <g className="wf-bob" transform="translate(1300 566)">
              <ellipse cx="0" cy="10" rx="140" ry="15" fill="#A57E4C" opacity=".45"/>
              <rect x="-3" y="-150" width="6" height="154" rx="3" fill="#6B4A2A"/>
              <g className="wf-flagg" transform="translate(3 -144)"><path d="M0 0 L54 6 L0 16 Z" fill="#417C98"/></g>
              <g transform="translate(0 -96)"><rect x="-26" y="-16" width="52" height="32" rx="5" fill="#EBDCB4" stroke="#B89A5E" strokeWidth="2"/><circle cx="-10" cy="0" r="5" fill="#417C98"/><rect x="2" y="-6" width="16" height="12" rx="2" fill="#8FB0BD"/></g>
              <g transform="translate(-58 -44)"><rect x="-26" y="-18" width="52" height="34" rx="4" transform="rotate(-18)" fill="#3A4A5A"/><g transform="rotate(-18)" stroke="#8FB0BD" strokeWidth="1.6" opacity=".8"><path d="M-26 -6 L26 -6"/><path d="M-26 6 L26 6"/><path d="M-9 -18 L-9 16"/><path d="M9 -18 L9 16"/></g><path d="M0 14 L0 34" stroke="#5a4636" strokeWidth="4"/></g>
              <g transform="translate(56 -34)"><rect x="-20" y="-22" width="40" height="44" rx="5" fill="#D8C69C" stroke="#B89A5E" strokeWidth="2"/><rect x="-12" y="-14" width="24" height="8" rx="2" fill="#A27532" opacity=".6"/><rect x="-12" y="0" width="24" height="8" rx="2" fill="#A27532" opacity=".4"/></g>
            </g>
            {/* pelican-ish shorebird */}
            <g className="wf-bob" transform="translate(1058 560)">
              <line x1="-3" y1="0" x2="-3" y2="-16" stroke="#D89A3E" strokeWidth="3"/>
              <line x1="4" y1="0" x2="4" y2="-16" stroke="#D89A3E" strokeWidth="3"/>
              <ellipse cx="0" cy="-28" rx="17" ry="11" fill="#F4EEDE"/>
              <circle cx="16" cy="-46" r="6" fill="#F4EEDE"/><circle cx="18.4" cy="-47" r="1.4" fill="#241a12"/>
              <path d="M21 -46 L40 -41 L21 -40 Z" fill="#E7B85E"/>
            </g>
            <g className="wf-tip" transform="translate(1270 340)">
              <rect x="-160" y="-56" width="320" height="56" rx="11" fill="#241f17" opacity=".95"/>
              <path d="M-9 0 L9 0 L0 12 Z" fill="#241f17" opacity=".95"/>
              <text x="0" y="-33" textAnchor="middle" fontFamily="'Baloo 2',cursive" fontSize="17" fontWeight="700" fill="#fff">Environmental Careers</text>
              <text x="0" y="-13" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="10" letterSpacing="1" fill="#E7C77E">{enviroTipMeta}</text>
            </g>
          </g>
        </svg>
      </div>
      <div style={{textAlign:"center",padding:"6px 20px 22px",font:"700 10.5px/1 'Courier New',monospace",letterSpacing:".22em",textTransform:"uppercase",color:"var(--ink2)",opacity:0.75}}>Click a camp to walk its trail — the skills travel between them</div>
    </div>
    </>
)}

    {entryIsMaps && (
<>
    <div style={{maxWidth:"1060px",margin:"22px auto 0",padding:"0 26px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"22px"}}>
        {mapCards.map((m, i) => (
<React.Fragment key={i}>
          <button type="button" onClick={m.onPick} className="wf-card" style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,position:"relative",display:"block",padding:"26px 26px 22px",background:"linear-gradient(160deg,#FDF6DC,#F3E6BE)",border:"2px solid rgba(60,42,24,.25)",borderRadius:"18px",boxShadow:"0 16px 40px -24px rgba(60,42,24,.55)"}}>
            <div style={{position:"absolute",inset:"10px",border:"1px dashed rgba(60,42,24,.3)",borderRadius:"12px",pointerEvents:"none"}}></div>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{width:"44px",height:"44px",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",background:m.color,color:"#fff"}}>{m.mark}</span>
              <div>
                <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"22px",lineHeight:1,color:"var(--ink)"}}>{m.name}</div>
                <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",color:"var(--ink2)",marginTop:"5px"}}>{m.shelf} expedition map</div>
              </div>
            </div>
            <svg viewBox="0 0 380 110" style={{display:"block",width:"100%",height:"auto",margin:"14px 0 6px"}}>
              <path d="M20 88 C 90 60 70 30 160 44 C 250 58 240 88 300 70 C 330 60 350 40 362 24" fill="none" stroke="#8f6c3f" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 12" opacity=".8"/>
              <g fill={m.color}><circle cx="20" cy="88" r="7"/><circle cx="160" cy="44" r="7"/><circle cx="300" cy="70" r="7"/><circle cx="362" cy="24" r="9"/></g>
              <g fill="none" stroke={m.color} strokeWidth="2" opacity=".45"><circle cx="20" cy="88" r="12"/><circle cx="362" cy="24" r="14"/></g>
            </svg>
            <p style={{margin:"6px 0 0",font:"500 13px/1.55 'Exo'",color:"var(--ink2)"}}>{m.tagline}</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"14px"}}>
              <span style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)"}}>{m.meta}</span>
              <span className="wf-open" style={{font:"800 10px/1 'Exo'",letterSpacing:".12em",textTransform:"uppercase",color:m.color}}>Unfold ›</span>
            </div>
          </button>
        </React.Fragment>
))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"14px",margin:"18px 0 6px"}}>
        <div style={{flex:1,height:"1px",background:"rgba(60,42,24,.2)"}}></div>
        <div style={{font:"700 10px/1.5 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink2)",textAlign:"center"}}>The trails cross — many stewards walk both</div>
        <div style={{flex:1,height:"1px",background:"rgba(60,42,24,.2)"}}></div>
      </div>
    </div>
    </>
)}
  </div>
  </>
)}

  {showPathway && (
<>
  <div data-screen-label="Pathway atlas" style={{maxWidth:"1160px",width:"100%",margin:"6px auto 0",padding:"0 26px 30px"}}>

    <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",margin:"8px 0 16px"}}>
      <button onClick={onBackTrailhead} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,display:"inline-flex",alignItems:"center",gap:"7px",padding:"9px 14px",borderRadius:"10px",border:"1px solid rgba(60,42,24,.22)",background:"rgba(255,255,255,.6)",font:"700 9.5px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--wood-d)"}}>‹ Trailhead</button>
      <div style={{display:"inline-flex",alignItems:"center",gap:"10px",padding:"9px 16px",borderRadius:"12px",background:pwColor,color:"#fff"}}>
        <span style={{fontSize:"16px"}}>{pwMark}</span>
        <span style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"16px",lineHeight:1}}>{pwName}</span>
        <span style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",opacity:0.85}}>{pwShelf}</span>
      </div>
      <div style={{flex:1}}></div>
      {showJobs && (
<>
      <a href="#wf-jobs" style={{display:"inline-flex",alignItems:"center",gap:"7px",padding:"9px 15px",borderRadius:"10px",background:"var(--wood-d)",color:"#F7EAC4",textDecoration:"none",font:"800 9.5px/1 'Courier New',monospace",letterSpacing:".12em",textTransform:"uppercase"}}>⚑ Job board · {pwJobCount}</a>
      </>
)}
      <button onClick={onSwitchPathway} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,display:"inline-flex",alignItems:"center",gap:"8px",padding:"9px 16px",borderRadius:"10px",background:pwColor,color:"#fff",font:"800 9.5px/1 'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase",boxShadow:"0 8px 18px -10px rgba(36,31,23,.55)"}}>⇄ Switch to the {otherPwName} trail ›</button>
    </div>

    <p style={{maxWidth:"760px",margin:"0 0 18px",font:"500 14px/1.6 'Exo'",color:"var(--ink2)"}}>{pwIntro}</p>

    {atlasIsTrail && (
<>
    <div style={{position:"relative",width:"100%",background:"linear-gradient(160deg,#FDF6DC,#F1E3B8)",border:"2px solid rgba(60,42,24,.22)",borderRadius:"20px",boxShadow:"0 22px 50px -30px rgba(60,42,24,.5)",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:"12px",border:"1px dashed rgba(60,42,24,.25)",borderRadius:"14px",pointerEvents:"none",zIndex:2}}></div>
      <div style={{position:"relative",width:"100%",aspectRatio:1.9,minHeight:"470px"}}>
        <svg viewBox="0 0 190 100" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:0}}>
          <g fill="none" stroke="#C9B184" strokeWidth=".35" opacity=".45">
            <path d="M0 84 q40 -10 80 0 t100 -2"/>
            <path d="M0 92 q50 -8 95 2 t95 -4"/>
            <path d="M10 12 q30 -6 60 2"/>
          </g>
          {pwIsCreator && (
<>
          <g fill="none" stroke="#B15A3A" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" opacity=".17">
            <g transform="translate(96 9)"><rect x="-6" y="-3.5" width="12" height="8" rx="1.4"/><path d="M-3 -3.5 l1.5 -2 h3 l1.5 2"/><circle cx="0" cy="1" r="2.4"/></g>
            <g transform="translate(14 52)"><path d="M0 -6 l3 9 l-3 2 l-3 -2 z"/><path d="M0 5 v2.5"/></g>
            <g transform="translate(150 46)"><rect x="-7" y="-3" width="14" height="7" rx="3.5"/><path d="M-4 .5 h3 M-2.5 -1 v3"/><circle cx="3" cy="-.5" r=".8"/><circle cx="4.5" cy="1.2" r=".8"/></g>
            <g transform="translate(58 92)"><path d="M-5 4 v-4 M-1.5 4 v-7 M2 4 v-10 M5.5 4 v-6"/><path d="M-6.5 4 h13.5"/></g>
            <g transform="translate(172 62)"><rect x="-5" y="-6" width="10" height="12" rx="1"/><path d="M-5 -3 h10 M-5 3 h10"/></g>
            <g transform="translate(30 88)"><circle cx="0" cy="2.5" r="1.4"/><path d="M-3 -.5 a4 4 0 0 1 6 0 M-5 -3 a7 7 0 0 1 10 0"/></g>
          </g>
          </>
)}
          {pwIsEnviro && (
<>
          <g fill="none" stroke="#2E5534" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" opacity=".17">
            <g transform="translate(96 9)"><path d="M-7 0 q3.5 -4 7 0 q3.5 -4 7 0"/></g>
            <g transform="translate(14 52)"><path d="M0 -6 q4 5 4 8 a4 4 0 0 1 -8 0 q0 -3 4 -8 z"/></g>
            <g transform="translate(150 46)"><path d="M-5 5 q0 -10 10 -10 q0 10 -10 10 z"/><path d="M-3 3 l6 -6"/></g>
            <g transform="translate(58 92)"><rect x="-6" y="-4" width="12" height="8" rx=".5"/><path d="M-2 -4 v8 M2 -4 v8 M-6 0 h12"/></g>
            <g transform="translate(172 62)"><path d="M-6 5 l4 -9 l3 5 l2 -3 l3 7 z"/></g>
            <g transform="translate(30 88)"><path d="M-6 0 q2 -3 4 0 t4 0 t4 0"/></g>
          </g>
          </>
)}
          <g transform="translate(178 88)" opacity=".55">
            <circle r="5" fill="none" stroke="#8f6c3f" strokeWidth=".4"/>
            <path d="M0 -4.4 L1 0 L0 4.4 L-1 0 Z" fill="#B15A3A"/>
            <text y="-6" textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="2.6" fontWeight="700" fill="#8f6c3f">N</text>
          </g>
        </svg>
        <svg viewBox="0 0 190 100" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:1}}>
          {atlasEdges.map((e, i) => (
<React.Fragment key={i}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.stroke} strokeWidth={e.width} strokeLinecap="round" strokeDasharray={e.dash} opacity={e.opacity}/>
          </React.Fragment>
))}
        </svg>
        
        {showSummitTile && (
          <button type="button" onClick={onOpenSummit} className="wf-card" style={{all: "unset" as any, cursor: runComplete ? "pointer" : "default", boxSizing: "border-box" as any, position: "absolute", left: "50%", top: "15%", transform: "translate(-50%, -50%)", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center"}}>
            <span style={{width:"44px",height:"44px",borderRadius:"50%",background: runComplete ? "var(--gold)" : "var(--ink2)",boxShadow:"0 8px 16px -8px rgba(36,31,23,.6), inset 0 0 0 2px rgba(255,255,255,.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",color:"#fff"}}>
              {runComplete ? "★" : "🔒"}
            </span>
            <span style={{marginTop: "9px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "7px 11px 8px", borderRadius: "11px", background: "rgba(254,250,224,.94)", border: "1px solid rgba(60,42,24,.14)", boxShadow: "0 8px 20px -14px rgba(36,31,23,.6)"}}>
              <span style={{fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "15px", lineHeight: 1.05, color: "var(--ink)", textAlign: "center"}}>SUMMIT</span>
              <span style={{font: "700 8px/1 'Courier New',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink2)", textAlign: "center"}}>{summitProgLabel}</span>
            </span>
          </button>
        )}

        <div style={{position:"absolute",left:"50%",top:"6%",transform:"translateX(-50%)",zIndex:4,font:"700 9.5px/1 'Courier New',monospace",letterSpacing:".22em",textTransform:"uppercase",color:"var(--wood-d)",opacity:0.9,background:"rgba(254,250,224,.92)",border:"1px solid rgba(60,42,24,.16)",padding:"6px 14px",borderRadius:"999px",whiteSpace:"nowrap",boxShadow:"0 6px 16px -12px rgba(36,31,23,.6)"}}>Choose your path · enjoy the journey</div>
        {atlasNodes.map((n, i) => (
<React.Fragment key={i}>
          <button type="button" onClick={n.onOpen} className="wf-node" style={n.posStyle}>
            <span style={{position:"relative",width:n.discSize,height:n.discSize,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:n.markSize,background:n.color,color:"#fff",boxShadow:"0 10px 24px -10px rgba(36,31,23,.55)",border:"3px solid rgba(255,255,255,.85)"}}>{n.mark}</span>
            <span style={{marginTop:"9px",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"7px 11px 8px",borderRadius:"11px",background:"rgba(254,250,224,.94)",border:"1px solid rgba(60,42,24,.14)",boxShadow:"0 8px 20px -14px rgba(36,31,23,.6)"}}>
              <span style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"15px",lineHeight:1.05,color:"var(--ink)",textAlign:"center"}}>{n.name}</span>
              <span style={{font:"700 8px/1 'Courier New',monospace",letterSpacing:".12em",textTransform:"uppercase",color:"var(--ink2)",textAlign:"center"}}>{n.meta}</span>
              <span className="wf-open" style={{font:"800 8.5px/1 'Exo'",letterSpacing:".12em",textTransform:"uppercase",color:n.color}}>Open ›</span>
            </span>
          </button>
        </React.Fragment>
))}
      </div>
    </div>
    </>
)}

    {atlasIsBasecamp && (
<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
      <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:"16px",padding:"20px 24px",borderRadius:"18px",background:pwColor,color:"#fff",boxShadow:"0 18px 40px -24px rgba(36,31,23,.6)"}}>
        <span style={{width:"52px",height:"52px",borderRadius:"14px",background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flex:"0 0 auto"}}>⌂</span>
        <div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"20px",lineHeight:1.1}}>Basecamp — {pwName}</div>
          <div style={{font:"600 12.5px/1.5 'Exo'",opacity:0.9,marginTop:"5px",maxWidth:"720px"}}>Six waypoints — choose your path, enjoy the journey. Each holds field notes, links, and tools curated by the stewards of this page.</div>
        </div>
      </div>
      {atlasNodes.map((n, i) => (
<React.Fragment key={i}>
        <button type="button" onClick={n.onOpen} className="wf-card" style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,position:"relative",display:"flex",flexDirection:"column",gap:"9px",padding:"18px 18px 16px",background:"#fff",border:"1px solid rgba(60,42,24,.16)",borderRadius:"16px",boxShadow:"0 12px 30px -22px rgba(36,31,23,.55)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{width:"40px",height:"40px",borderRadius:"11px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",background:n.color,color:"#fff"}}>{n.mark}</span>
          </div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"17px",lineHeight:1.1,color:"var(--ink)"}}>{n.name}</div>
          <div style={{font:"500 12px/1.5 'Exo'",color:"var(--ink2)"}}>{n.blurb}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"2px"}}>
            <span style={{font:"700 8.5px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)"}}>{n.meta}</span>
            <span className="wf-open" style={{font:"800 9px/1 'Exo'",letterSpacing:".12em",textTransform:"uppercase",color:n.color}}>Open ›</span>
          </div>
        </button>
      </React.Fragment>
))}
    </div>
    </>
)}

    {showJobs && (
<>
    <div id="wf-jobs" data-screen-label="Field job board" style={{scrollMarginTop:"70px",marginTop:"26px",background:"#fff",border:"1px solid rgba(60,42,24,.16)",borderRadius:"18px",overflow:"hidden",boxShadow:"0 16px 40px -30px rgba(36,31,23,.55)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",padding:"16px 22px",background:"var(--wood-d)",color:"#F7EAC4"}}>
        <div style={{display:"flex",alignItems:"center",gap:"11px"}}>
          <span style={{width:"34px",height:"34px",borderRadius:"9px",background:"rgba(247,234,196,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px"}}>⚑</span>
          <div>
            <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"16px",lineHeight:1.1}}>Field Job Board</div>
            <div style={{font:"700 8.5px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",opacity:0.8,marginTop:"3px"}}>Steward-curated · {pwName} trail</div>
          </div>
        </div>
        <span style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--foil)"}}>{pwJobCount} postings</span>
      </div>
      {jobRows.map((j: any, i: number) => (
<React.Fragment key={i}>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:"14px",alignItems:"center",padding:"14px 22px",borderBottom:"1px solid rgba(60,42,24,.1)"}}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); j.onToggleBookmark && j.onToggleBookmark(); }}
            style={{
              all:"unset" as any, cursor: j.isSubmitting ? "wait" : "pointer", boxSizing:"border-box" as any,
              width:"32px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center",
              background: j.isBookmarked ? "var(--gold)" : "var(--parch)", 
              color: j.isBookmarked ? "#fff" : "var(--ink2)",
              fontSize:"16px", border:"1px solid rgba(60,42,24,.2)", borderRadius:"8px",
              flex:"0 0 auto", transition:"all .2s ease"
            }}
            title={j.isBookmarked ? "Remove bookmark" : "Bookmark this job"}
          >
            {j.bmIcon}
          </button>
          <a href={j.url} target="_blank" rel="noopener" style={{minWidth:0,textDecoration:"none",color:"var(--ink)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"9px",flexWrap:"wrap"}}>
              <span style={{font:"800 14px/1.2 'Exo'",color:"var(--ink)"}}>{j.title}</span>
              <span style={{padding:"4px 9px",borderRadius:"999px",background:"var(--parch)",border:"1px solid rgba(60,42,24,.14)",font:"700 8.5px/1 'Exo'",letterSpacing:".06em",textTransform:"uppercase",color:"var(--wood-d)"}}>{j.kind}</span>
            </div>
            <div style={{font:"600 12px/1.4 'Exo'",color:"var(--ink2)",marginTop:"3px"}}>{j.org} · {j.place}</div>
          </a>
          <a href={j.url} target="_blank" rel="noopener" style={{textAlign:"right",textDecoration:"none"}}>
            <div style={{font:"800 10px/1 'Exo'",letterSpacing:".1em",textTransform:"uppercase",color:"var(--blue)"}}>Apply ↗</div>
            <div style={{font:"700 9px/1 'Courier New',monospace",color:"var(--ink2)",opacity:0.7,marginTop:"5px"}}>{j.posted}</div>
          </a>
        </div>
      </React.Fragment>
))}
      <div style={{padding:"14px 22px 18px",background:"var(--cream)"}}>
        <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",color:"var(--ink2)",marginBottom:"10px"}}>More boards worth a saved search</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
          {boardChips.map((b: any, i: number) => (
<React.Fragment key={i}>
            <a href={b.url} target="_blank" rel="noopener" title={b.desc} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"8px 12px",borderRadius:"999px",background:"#fff",border:"1px solid rgba(60,42,24,.18)",textDecoration:"none",color:"var(--wood-d)",font:"700 10.5px/1 'Exo'"}}>↗ {b.label}</a>
          </React.Fragment>
))}
        </div>
      </div>
    </div>
    </>
)}
  </div>
  </>
)}

  <div style={{flex:1}}></div>
  <div style={{textAlign:"center",padding:"14px",font:"700 9px/1 'Courier New',monospace",letterSpacing:".2em",textTransform:"uppercase",color:"var(--ink2)",opacity:0.6}}>Resources here also shelve in the Steward Library · Industry &amp; Work · {footTag}</div>

  {popupOpen && (
<>
    <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(36,31,23,.5)",backdropFilter:"blur(3px)",animation:"wf-fadein .2s ease"}} onClick={onClosePopup}></div>
    <div data-screen-label="Waypoint reader popup" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:65,width:"min(1060px,95vw)",height:"min(760px,92vh)",background:"var(--parch)",borderRadius:"16px",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 50px 110px -35px rgba(30,22,10,.75)",animation:"wf-pagein .3s cubic-bezier(.22,1,.36,1)"}} onClick={stop}>
      <div style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:"13px",padding:"15px 20px",background:popColor,color:"#fff"}}>
        <span style={{width:"38px",height:"38px",borderRadius:"10px",background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flex:"0 0 auto"}}>{popMark}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{font:"700 8.5px/1 'Courier New',monospace",letterSpacing:".2em",textTransform:"uppercase",opacity:0.85}}>{popShelf} · {pwName}</div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"20px",lineHeight:1.15,marginTop:"2px"}}>{popStopName}</div>
        </div>
        <button onClick={onClosePopup} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,width:"34px",height:"34px",borderRadius:"10px",background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:"#fff",flex:"0 0 auto"}}>✕</button>
      </div>
      <div style={{flex:1,minHeight:0,display:"flex"}}>
        <div className="wf-scroll" style={{flex:"0 0 320px",minWidth:0,overflowY:"auto",padding:"20px 18px 26px",borderRight:"1px solid rgba(60,42,24,.18)"}}>
          <p style={{margin:"0 0 16px",font:"500 13.5px/1.6 'Exo'",color:"var(--ink)"}}>{popBlurb}</p>
          <div style={{font:"700 9.5px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",color:"var(--gold)",marginBottom:"10px"}}>Field notes · {popEntryCount} notes</div>
          <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
            {popEntryList.map((e, i) => (
<React.Fragment key={i}>
              <button type="button" onClick={e.onPick} style={e.style}>
                <span style={{display:"flex",alignItems:"baseline",gap:"8px"}}><span style={{font:"700 11px/1 'Courier New',monospace",color:"var(--gold)"}}>{e.num}</span><span style={{flex:1,fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"14.5px",lineHeight:1.2,color:"var(--ink)"}}>{e.t}</span><span style={{color:"var(--ink2)"}}>›</span></span>
                <span style={{display:"block",marginTop:"5px",paddingLeft:"22px",font:"700 9px/1.4 'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase",color:"var(--ink2)"}}>{e.s}</span>
              </button>
            </React.Fragment>
))}
          </div>
        </div>
        <div className="wf-scroll" style={{flex:1,minWidth:0,overflowY:"auto",padding:"26px 32px 40px"}}>
          <div style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".2em",textTransform:"uppercase",color:"var(--gold)"}}>{popShelf} · {popCall} · {popType}</div>
          <div style={{display:"inline-block",marginTop:"12px",padding:"6px 12px",borderRadius:"8px",background:"rgba(65,124,152,.12)",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--blue)"}}>{popSub}</div>
          <h2 style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"34px",lineHeight:1.05,color:"var(--ink)",margin:"10px 0 0"}}>{popTitle}</h2>
          {popImages && popImages.length > 0 ? (
            <div style={{margin:"18px 0 4px", display:"flex", flexDirection:"column", gap:"12px"}}>
              {popImages.map((img: any, idx: number) => (
                <div key={idx} style={{borderRadius:"12px",border:"1px solid rgba(60,42,24,.2)",overflow:"hidden",background:"#241f17"}}>
                  <img src={typeof img === 'string' ? img : (img?.url || '')} alt={typeof img === 'string' ? '' : (img?.caption || '')} style={{width:"100%",height:"auto",maxHeight:"300px",objectFit:"cover",display:"block"}} />
                  {typeof img !== 'string' && img?.caption && (
                    <div style={{padding:"8px 12px",fontSize:"12px",color:"var(--ink2)",background:"rgba(251,242,210,.5)"}}>{img.caption}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{margin:"18px 0 4px",height:"210px",borderRadius:"12px",border:"1px solid rgba(60,42,24,.2)",background:"repeating-linear-gradient(45deg,#EBDCB4 0 26px,#E2D0A2 26px 52px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{padding:"7px 14px",borderRadius:"7px",background:"rgba(251,242,210,.85)",font:"700 10px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)"}}>{popMedia}</span>
            </div>
          )}
          <div 
            className="wf-rte-content" 
            dangerouslySetInnerHTML={{ __html: popEntry?.body_html || '' }} 
          />
          <div style={{marginTop:"20px",border:"1px solid rgba(60,42,24,.18)",borderRadius:"12px",overflow:"hidden"}}>
            {popFacts.map((f, i) => (
<React.Fragment key={i}>
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:"12px",padding:"10px 16px",borderBottom:"1px solid rgba(60,42,24,.1)",background:"rgba(255,255,255,.4)"}}>
                <span style={{font:"700 10px/1.5 'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase",color:"var(--ink2)"}}>{f.k}</span>
                <span style={{font:"700 13px/1.4 'Exo'",color:"var(--ink)"}}>{f.v}</span>
              </div>
            </React.Fragment>
))}
          </div>
          <div style={{marginTop:"18px",font:"700 9.5px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",color:"var(--ink2)"}}>Sources &amp; links</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"10px"}}>
            {popSrcs.map((s, i) => (
<React.Fragment key={i}>
              <a href={s.url} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:"7px",padding:"9px 13px",borderRadius:"10px",background:"rgba(255,255,255,.65)",border:"1px solid rgba(60,42,24,.18)",textDecoration:"none",color:"var(--blue)",font:"600 12px/1 'Exo'"}}>↗ {s.label}</a>
            </React.Fragment>
))}
          </div>
          <div style={{marginTop:"22px",padding:"12px 16px",borderRadius:"10px",background:"rgba(162,117,50,.1)",border:"1px dashed rgba(162,117,50,.4)",font:"600 11px/1.5 'Exo'",color:"var(--ink2)"}}>Shelved in the <strong style={{color:"var(--gold)"}}>Steward Library → Industry &amp; Work</strong> tagged <strong style={{color:popColor}}>{pwTag}</strong></div>
          
          {popHasQuiz && (
            <div style={{marginTop:"28px",padding:"20px",borderRadius:"16px",background:"#fff",border:"2px solid rgba(60,42,24,.12)",boxShadow:"0 12px 24px -12px rgba(60,42,24,.2)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                <span style={{font:"700 10.5px/1 'Courier New',monospace",letterSpacing:".2em",textTransform:"uppercase",color:"var(--ink)"}}>✦ YOUR MISSION PICK</span>
                <span style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase",color:"var(--gold)",background:"var(--parch)",padding:"4px 8px",borderRadius:"6px",border:"1px solid rgba(60,42,24,.1)"}}>{quizStatusLabel}</span>
              </div>
              <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"20px",lineHeight:1.3,color:"var(--ink)",marginBottom:"8px"}}>{quizPrompt}</div>
              <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",marginBottom:"16px"}}>{quizPickLabel}</div>
              
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {quizOptions.map((o: any, i: number) => (
                  <button key={i} onClick={o.onPick} style={{all: "unset" as any, cursor: "pointer", boxSizing: "border-box" as any, display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px",borderRadius:"12px",background: o.tick === "✓" ? "rgba(65,124,152,.08)" : "rgba(251,242,210,.4)",border: o.tick === "✓" ? "2px solid var(--blue)" : "1px solid rgba(60,42,24,.15)",transition:"transform .2s"}}>
                    <span style={{width:"24px",height:"24px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border: o.tick === "✓" ? "2px solid var(--blue)" : "2px solid rgba(60,42,24,.2)",color: o.tick === "✓" ? "var(--blue)" : "transparent",fontSize:"14px",fontWeight:700}}>{o.tick === "✓" ? "✓" : ""}</span>
                    <div style={{flex:1}}>
                      <span style={{display:"block",fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"18px",lineHeight:1.1,color:"var(--ink)"}}>{o.label}</span>
                      {o.hasSub && <span style={{display:"block",font:"500 13px/1.4 'Exo'",color:"var(--ink2)",marginTop:"3px"}}>{o.sub}</span>}
                    </div>
                  </button>
                ))}
              </div>

              {quizAllowCustom && (
                <div style={{marginTop:"16px"}}>
                  <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",marginBottom:"8px"}}>OR WRITE YOUR OWN</div>
                  <input className="wf" value={quizCustom} onInput={onQuizCustom} onBlur={onQuizCustomBlur} placeholder={quizCustomLabel} style={{width:"100%",boxSizing:"border-box",padding:"14px 18px",borderRadius:"12px",border:"1px solid rgba(60,42,24,.2)",background:"#fcfcfc",font:"500 15px/1.4 'Exo'",color:"var(--ink)",outline:"none"}}/>
                </div>
              )}

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginTop:"20px",paddingTop:"18px",borderTop:"1px dashed rgba(60,42,24,.2)"}}>
                {quizAnswered && (
                  <>
                    <span style={{font:"700 10.5px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--green)"}}>✓ SAVED TO RUN</span>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <button onClick={onQuizClear} style={{all: "unset" as any, cursor: "pointer", boxSizing: "border-box" as any, font:"700 11px/1 'Exo'",textDecoration:"underline",color:"var(--ink2)"}}>Clear</button>
                      <button onClick={onQuizToSummit} style={{all: "unset" as any, cursor: "pointer", boxSizing: "border-box" as any, padding:"8px 16px",borderRadius:"8px",background:"var(--wood-d)",color:"#fff",font:"700 10px/1 'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase"}}>{quizSummitBtnLabel}</button>
                    </div>
                  </>
                )}
                {quizUnanswered && (
                  <span style={{font:"500 14px/1.4 'Exo'",color:"var(--ink2)",fontStyle:"italic"}}>{quizHint}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
)}

  {suggestOpen && (
<>
    <div style={{position:"fixed",inset:0,zIndex:70,background:"rgba(36,31,23,.5)",backdropFilter:"blur(3px)",animation:"wf-fadein .2s ease"}} onClick={onCloseSuggest}></div>
    <div data-screen-label="Suggest a resource modal" className="wf-scroll" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:75,width:"min(540px,94vw)",maxHeight:"92vh",overflowY:"auto",background:"var(--cream)",borderRadius:"14px",boxShadow:"0 40px 90px -30px rgba(30,22,10,.7)",animation:"wf-pagein .28s cubic-bezier(.22,1,.36,1)"}} onClick={stop}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",background:"#241f17",color:"#fff"}}>
        <span style={{font:"700 12px/1 'Courier New',monospace",letterSpacing:".2em",textTransform:"uppercase"}}>Suggest a resource</span>
        <span style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".18em",textTransform:"uppercase",opacity:0.7}}>Steward Library</span>
      </div>
      {sgNotDone && (
<>
      <div style={{padding:"22px 24px 24px"}}>
        <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",marginBottom:"8px"}}>Title</label>
        <input className="wf" value={sgTitle} onInput={onSgTitle} placeholder="e.g. Free drone mapping course" style={{width:"100%",padding:"13px 15px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 14px/1.3 'Exo'",color:"var(--ink)",outline:"none"}}/>
        <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",margin:"16px 0 8px"}}>Link (URL)</label>
        <input className="wf" value={sgUrl} onInput={onSgUrl} placeholder="https://…" style={{width:"100%",padding:"13px 15px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 14px/1.3 'Courier New',monospace",color:"var(--ink)",outline:"none"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginTop:"16px"}}>
          <div>
            <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",marginBottom:"8px"}}>Trail tag</label>
            <select value={sgPathway} onChange={onSgPathway} style={{width:"100%",padding:"12px 12px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 13.5px/1.3 'Exo'",color:"var(--ink)"}}>
              <option value="creator">*Content Creator Resource</option>
              <option value="enviro">*Environmental Career Resource</option>
            </select>
          </div>
          <div>
            <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",marginBottom:"8px"}}>Type</label>
            <select value={sgType} onChange={onSgType} style={{width:"100%",padding:"12px 12px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 13.5px/1.3 'Exo'",color:"var(--ink)"}}>
              <option>Article</option><option>Tool</option><option>Program</option><option>Course</option><option>Job posting</option><option>Video</option>
            </select>
          </div>
        </div>
        <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",margin:"16px 0 8px"}}>Waypoint</label>
        <select value={sgStop} onChange={onSgStop} style={{width:"100%",padding:"12px 12px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 13.5px/1.3 'Exo'",color:"var(--ink)"}}>
          <option value="terrain">Know the Terrain</option><option value="portfolio">The Portfolio Strategy</option><option value="story">Story &amp; Resume</option><option value="tools">Tools &amp; AI Kit</option><option value="hiring">Who's Hiring</option><option value="mesa">MESA Basecamp</option>
        </select>
        <label style={{display:"block",font:"700 10px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",color:"var(--ink)",margin:"16px 0 8px"}}>Note <span style={{opacity:0.6,letterSpacing:".08em"}}>(one line for explorers)</span></label>
        <textarea className="wf" value={sgNote} onInput={onSgNote} placeholder="What is this and why does it matter?" rows={3} style={{width:"100%",padding:"13px 15px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"500 14px/1.5 'Exo'",color:"var(--ink)",outline:"none",resize:"vertical"}}></textarea>
        <div style={{marginTop:"16px",padding:"13px 16px",borderRadius:"10px",background:"rgba(46,85,52,.08)",border:"1px solid rgba(46,85,52,.2)",font:"500 12.5px/1.55 'Exo'",color:"var(--ink)"}}><strong>A steward reviews every suggestion.</strong> Once approved it joins this atlas <em>and</em> the Steward Library under Industry &amp; Work, carrying its trail tag.</div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"18px"}}>
          <button onClick={onCloseSuggest} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,padding:"12px 18px",borderRadius:"10px",border:"1.5px solid rgba(60,42,24,.25)",background:"#fff",font:"800 13px/1 'Exo'",color:"var(--ink)"}}>Cancel</button>
          <button onClick={onSubmitSuggest} style={sgSubmitStyle}>Submit Suggestion</button>
        </div>
      </div>
      </>
)}
      {sgDone && (
<>
      <div style={{padding:"44px 30px 40px",textAlign:"center"}}>
        <div style={{width:"54px",height:"54px",borderRadius:"16px",background:"rgba(46,85,52,.12)",color:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",margin:"0 auto 16px"}}>✓</div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"20px",color:"var(--ink)"}}>Logged at the trailhead</div>
        <p style={{margin:"8px auto 0",maxWidth:"340px",font:"500 13px/1.6 'Exo'",color:"var(--ink2)"}}>Your suggestion is in the stewards' review queue. If approved, it appears on this trail and on the Library shelf.</p>
        <button onClick={onCloseSuggest} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,marginTop:"20px",padding:"12px 22px",borderRadius:"10px",background:"var(--wood-d)",color:"#f3e2b6",font:"800 12px/1 'Exo'",letterSpacing:".08em",textTransform:"uppercase"}}>Done</button>
      </div>
      </>
)}
    </div>
  </>
)}

  {showSummit && (
    <div data-screen-label="Modern - summit checklist screen" className="wf-scroll" style={{position:"fixed",inset:0,zIndex:90,background:"var(--cream)",overflowY:"auto",animation:"wf-fadein .3s ease"}}>
      
      <div style={{position:"sticky",top:0,zIndex:40,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 30px",background:"rgba(254,250,224,.9)",backdropFilter:"blur(8px)",borderBottom:"1px solid rgba(60,42,24,.1)"}}>
        <button onClick={onCloseSummit} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,display:"flex",alignItems:"center",gap:"8px",color:"var(--wood-d)",font:"800 12px/1 'Exo'",letterSpacing:".05em",textTransform:"uppercase"}}>‹ Back to Map</button>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"20px",lineHeight:1.1,color:"var(--ink)"}}>The Summit</div>
            <div style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",marginTop:"2px"}}>{summitTitle}</div>
          </div>
          <span style={{width:"40px",height:"40px",borderRadius:"12px",background:"var(--wood-d)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",boxShadow:"0 6px 12px -6px rgba(60,42,24,.5)"}}>★</span>
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"40px 30px 100px"}}>
        
        <div style={{display:"flex",gap:"40px",alignItems:"flex-start",flexWrap:"wrap"}}>
          
          <div style={{flex:"1 1 500px",minWidth:0}}>
            {runComplete ? (
              <div style={{marginBottom:"32px"}}>
                <h1 style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"42px",lineHeight:1.1,color:"var(--ink)",margin:"0 0 12px"}}>You made it!</h1>
                <p style={{font:"500 16px/1.6 'Exo'",color:"var(--ink2)",margin:0,maxWidth:"500px"}}>You have completed the {summitTitle} trail and secured your certificate. Your journey has just begun.</p>
              </div>
            ) : (
              <div style={{marginBottom:"32px"}}>
                <h1 style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:"36px",lineHeight:1.1,color:"var(--ink)",margin:"0 0 12px"}}>{summitTitle} Checklist</h1>
                <p style={{font:"500 16px/1.6 'Exo'",color:"var(--ink2)",margin:0,maxWidth:"500px"}}>{summitIntro}</p>
              </div>
            )}

            <div style={{background:"#fff",border:"2px solid rgba(60,42,24,.1)",borderRadius:"20px",overflow:"hidden",boxShadow:"0 16px 32px -16px rgba(60,42,24,.12)",marginBottom:"32px"}}>
              {summitChecklist?.map((s: any, i: number) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"18px",padding:"20px 24px",borderBottom: i < summitChecklist.length - 1 ? "1px solid rgba(60,42,24,.1)" : "none",background: s.done ? "rgba(251,242,210,.35)" : "#fff",transition:"background .2s"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border: s.done ? "2px solid var(--gold)" : "2px solid rgba(60,42,24,.2)",background: s.done ? "var(--gold)" : "transparent",color:"#fff",fontSize:"16px",transition:"all .2s"}}>
                    {s.done ? "✓" : ""}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"20px",lineHeight:1.1,color:"var(--ink)"}}>{s.name}</div>
                    <div style={{font:"700 10px/1 'Courier New',monospace",letterSpacing:".12em",textTransform:"uppercase",color: s.done ? "var(--gold)" : "var(--ink2)",marginTop:"4px"}}>{s.done ? "Completed" : "Pending"}</div>
                  </div>
                </div>
              ))}
            </div>

            {!runComplete ? (
              <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
                <button 
                  disabled={!summitClaimable} 
                  onClick={onClaim} 
                  style={{all:"unset" as any,boxSizing:"border-box" as any,padding:"16px 32px",borderRadius:"14px",background: summitClaimable ? "var(--gold)" : "rgba(60,42,24,.1)",color: summitClaimable ? "#fff" : "rgba(60,42,24,.4)",font:"800 15px/1 'Exo'",letterSpacing:".05em",textTransform:"uppercase",cursor: summitClaimable ? "pointer" : "not-allowed",boxShadow: summitClaimable ? "0 12px 24px -12px rgba(162,117,50,.7)" : "none",transition:"all .2s"}}
                >
                  Claim Certificate
                </button>
                <div style={{font:"700 13px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)"}}>
                  {remainingCount > 0 ? `${remainingText}` : "Ready to Claim!"}
                </div>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
                <button onClick={onPrintCard} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,padding:"16px 32px",borderRadius:"14px",background:"var(--wood-d)",color:"#fff",font:"800 14px/1 'Exo'",letterSpacing:".05em",textTransform:"uppercase",boxShadow:"0 12px 24px -12px rgba(60,42,24,.7)"}}>Print Certificate</button>
                <button onClick={onResetRun} style={{all:"unset" as any,cursor:"pointer",boxSizing:"border-box" as any,padding:"16px 32px",borderRadius:"14px",border:"2px solid rgba(60,42,24,.2)",background:"transparent",color:"var(--ink)",font:"800 14px/1 'Exo'",letterSpacing:".05em",textTransform:"uppercase"}}>Reset Progress</button>
              </div>
            )}
          </div>

          <div style={{flex:"0 0 380px",width:"100%"}}>
            <div style={{background:"var(--parch)",borderRadius:"24px",border:"1px solid rgba(60,42,24,.15)",boxShadow:"0 24px 48px -24px rgba(36,31,23,.4)",overflow:"hidden"}}>
              <div style={{padding:"24px 28px",background:"var(--wood-d)",color:"#fff"}}>
                <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"24px",lineHeight:1.1,marginBottom:"6px"}}>Pathway Record</div>
                <div style={{font:"700 10.5px/1 'Courier New',monospace",letterSpacing:".16em",textTransform:"uppercase",opacity:0.8}}>{summitTitle}</div>
              </div>
              
              <div style={{padding:"24px 28px 32px",display:"flex",flexDirection:"column",gap:"16px"}}>
                <div style={{font:"600 14px/1.5 'Exo'",color:"var(--ink)",marginBottom:"4px"}}>{runComplete ? "Here is a record of your journey along the pathway." : "Complete the remaining stops to claim your certificate."}</div>
                
                {cardStatRows?.map((r: any, i: number) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px",background:"#fff",border:"1px solid rgba(60,42,24,.12)",borderRadius:"16px",boxShadow:"0 6px 16px -12px rgba(36,31,23,.2)"}}>
                    <span style={{width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(65,124,152,.1)",color:"var(--blue)",fontSize:"14px",fontWeight:700}}>
                      {r.mark}
                    </span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{font:"700 9px/1 'Courier New',monospace",letterSpacing:".14em",textTransform:"uppercase",color:"var(--ink2)",marginBottom:"4px"}}>{r.result}</div>
                      <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:700,fontSize:"18px",lineHeight:1.1,color:"var(--ink)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{padding:"20px 28px",background:"rgba(60,42,24,.05)",borderTop:"1px solid rgba(60,42,24,.08)",font:"500 12px/1.5 'Exo'",color:"var(--ink2)",textAlign:"center"}}>
                {summitCloser || "STEWARD OS · WORKFORCE DEVELOPMENT"}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )}
  
<div style={{display: (showLibrary || showShelf) ? "block" : "none", position: "fixed", inset: 0, zIndex: 1000, background: "var(--cream)", overflowY: "auto", animation: "wf-fadein .3s ease"}}>

  {/* ============ RESOURCE VAULT ============ */}
    {showLibrary && (<>
    <div data-screen-label="Arcade — resource vault" style={{padding: "16px 18px 30px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px"}}>
        <button onClick={onBackLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--wood-d)", color: "#fff", fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "1px solid rgba(60,42,24,.15)", borderRadius: "10px"}}>◀ Back</button>
        <div style={{flex: "1"}}></div>
        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
          {libFilterChips.map((c: any, i: number) => (<React.Fragment key={i}><button onClick={c.onPick} style={c.style}>{c.label}</button></React.Fragment>))}
        </div>
      </div>

      <div style={{border: "1px solid rgba(60,42,24,.15)", boxShadow: "0 12px 30px -10px rgba(36,31,23,.15)", borderRadius: "16px", background: "#fff", marginBottom: "18px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: "var(--ink)", borderBottom: "1px solid rgba(60,42,24,.15)"}}>
          <span style={{width: "34px", height: "34px", background: "var(--blue)", border: "3px solid rgba(60,42,24,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--ink)", flex: "0 0 auto"}}>≡</span>
          <div>
            <div style={{fontFamily: "'Courier New',monospace", fontSize: "14px", color: "#fff", letterSpacing: ".1em"}}>RESOURCE VAULT</div>
            <div style={{fontSize: "17px", color: "var(--ink2)", marginTop: "5px"}}>Every catalogued link by category — {libTotal} shelved in the Steward Library under Industry and Workforce Development</div>
          </div>
        </div>
      </div>

      <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px"}}>
        <span style={{fontFamily: "'Courier New',monospace", fontSize: "7px", color: "var(--ink2)", letterSpacing: ".4px", marginRight: "4px"}}>FILTER NODE</span>
        {libNodeChips.map((c: any, i: number) => (<React.Fragment key={i}><button onClick={c.onPick} style={c.style}>{c.label}</button></React.Fragment>))}
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
        {libGroups.map((g: any, i: number) => (<React.Fragment key={i}>
          <div style={{border: "1px solid rgba(60,42,24,.15)", boxShadow: "0 12px 30px -10px rgba(36,31,23,.15)", borderRadius: "16px", background: "#fff", overflow: "hidden"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: g.accent, borderBottom: "1px solid rgba(60,42,24,.15)"}}>
              <span style={{fontFamily: "'Courier New',monospace", fontSize: "10px", color: "var(--ink)"}}>{g.name}</span>
              <span style={{fontFamily: "'Courier New',monospace", fontSize: "7px", color: "var(--ink)", opacity: ".7"}}>{g.count} LINKS</span>
            </div>
            <div style={{padding: "14px 16px 16px"}}>
              {g.stops.map((s: any, i: number) => (<React.Fragment key={i}>
                <div style={{marginBottom: "20px"}}>
                  <div style={s.headStyle}>
                    <span style={s.dotStyle}></span>
                    <span style={{flex: "1", minWidth: "0", fontFamily: "'Courier New',monospace", fontSize: "9px", color: "#fff", letterSpacing: ".4px", lineHeight: "1.5"}}>{s.name}</span>
                    <span style={{flex: "0 0 auto", whiteSpace: "nowrap", fontFamily: "'Baloo 2',cursive", fontSize: "17px", color: "#a9c8ff"}}>{s.n} links</span>
                  </div>
                  <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                    {s.links.map((l: any, i: number) => (<React.Fragment key={i}>
                      <div style={{...l.rowStyle, background: "#fff", border: "1px solid rgba(60,42,24,.15)", borderLeft: `6px solid ${l.accent || 'var(--blue)'}`, boxShadow: "0 6px 16px -12px rgba(36,31,23,.2)", borderRadius: "12px", color: "var(--ink)"}}>
                        <button onClick={l.onToggle} title="Bookmark to My Shelf" style={{...l.bmStyle, background: l.saved ? "var(--brass)" : "#fff", color: l.saved ? "#fff" : "var(--ink)", border: "1px solid rgba(60,42,24,.2)", borderRadius: "6px"}}>{l.bmIcon}</button>
                        <a href={l.url} target="_blank" rel="noopener" style={{flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px", textDecoration: "none"}}>
                          <span style={{fontFamily: "'Baloo 2',cursive", fontSize: "23px", lineHeight: "1.1", color: "var(--ink)"}}>{l.label}</span>
                          <span style={{fontSize: "16px", lineHeight: "1.3", color: "#b7d2f5"}}>{l.about}</span>
                        </a>
                        <span style={{flex: "0 0 auto", minWidth: "0", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "15px", color: "#45d4ff"}}>↗ {l.domain}</span>
                        <span style={{flex: "0 0 auto", padding: "3px 6px", background: "#1d4490", color: "var(--ink2)", fontFamily: "'Courier New',monospace", fontSize: "6px", border: "2px solid rgba(60,42,24,.2)"}}>{l.type}</span>
                      </div>
                    </React.Fragment>))}
                  </div>
                </div>
              </React.Fragment>))}
            </div>
          </div>
        </React.Fragment>))}

        <div style={{border: "1px solid rgba(60,42,24,.15)", boxShadow: "0 12px 30px -10px rgba(36,31,23,.15)", borderRadius: "16px", background: "#fff", overflow: "hidden"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#45d4ff", borderBottom: "1px solid rgba(60,42,24,.15)"}}>
            <span style={{fontFamily: "'Courier New',monospace", fontSize: "10px", color: "var(--ink)"}}>EXTERNAL JOB BOARDS</span>
            <span style={{fontFamily: "'Courier New',monospace", fontSize: "7px", color: "var(--ink)", opacity: ".7"}}>SAVE A SEARCH</span>
          </div>
          <div style={{padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: "8px"}}>
            {libBoards.map((b: any, i: number) => (<React.Fragment key={i}>
              <a href={b.url} target="_blank" rel="noopener" title={b.desc} style={{display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 12px", background: "var(--ink)", color: "#fff", textDecoration: "none", fontSize: "16px", border: "2px solid rgba(60,42,24,.2)", boxShadow: "2px 2px 0 rgba(18,12,26,.4)", borderRadius: "5px"}}>↗ {b.label}</a>
            </React.Fragment>))}
          </div>
        </div>
      </div>
    </div>
    </>)}

    {/* ============ MY SHELF ============ */}
    {showShelf && (<>
    <div data-screen-label="Arcade — my shelf" style={{padding: "16px 18px 30px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px"}}>
        <button onClick={onBackShelf} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--wood-d)", color: "#fff", fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "1px solid rgba(60,42,24,.15)", borderRadius: "10px"}}>◀ Back</button>
        <div style={{flex: "1"}}></div>
        <button onClick={onOpenLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--blue)", color: "var(--ink)", fontFamily: "'Courier New',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "1px solid rgba(60,42,24,.15)", borderRadius: "10px"}}>≡ Browse vault</button>
      </div>

      <div style={{border: "1px solid rgba(60,42,24,.15)", boxShadow: "0 12px 30px -10px rgba(36,31,23,.15)", borderRadius: "16px", background: "#fff", marginBottom: "18px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: "var(--ink)", borderBottom: "1px solid rgba(60,42,24,.15)"}}>
          <span style={{width: "34px", height: "34px", background: "var(--brass)", border: "3px solid rgba(60,42,24,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--ink)", flex: "0 0 auto"}}>★</span>
          <div>
            <div style={{fontFamily: "'Courier New',monospace", fontSize: "14px", color: "#fff", letterSpacing: ".1em"}}>MY SHELF</div>
            <div style={{fontSize: "17px", color: "var(--ink2)", marginTop: "5px"}}>{shelfSub}</div>
          </div>
        </div>
      </div>

      {shelfHasCards && (<>
      <div style={{fontFamily: "'Courier New',monospace", fontSize: "9px", color: "var(--ink2)", letterSpacing: ".5px", marginBottom: "12px"}}>♛ MY PATHWAY CARDS</div>
      <div style={{display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px"}}>
        {shelfCards.map((c: any, i: number) => (<React.Fragment key={i}>
          <div style={{border: "4px solid rgba(60,42,24,.2)", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "10px", background: "#fff", overflow: "hidden"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "12px 15px", background: c.accent, borderBottom: "1px solid rgba(60,42,24,.15)"}}>
              <div style={{minWidth: "0"}}>
                <div style={{fontFamily: "'Courier New',monospace", fontSize: "12px", color: "var(--ink)", textShadow: "2px 2px 0 rgba(255,255,255,.35)", lineHeight: "1.4"}}>{c.klass}</div>
                <div style={{fontFamily: "'Courier New',monospace", fontSize: "6.5px", color: "var(--ink)", opacity: ".72", marginTop: "7px", lineHeight: "1.6"}}>{c.title}</div>
              </div>
              <span style={{flex: "0 0 auto", padding: "6px 9px", background: "var(--ink)", color: "var(--brass)", fontFamily: "'Courier New',monospace", fontSize: "7px", border: "3px solid rgba(60,42,24,.2)", whiteSpace: "nowrap"}}>♛ NODE 7</span>
            </div>
            <div style={{padding: "14px 15px", display: "flex", flexDirection: "column", gap: "10px"}}>
              {c.rows.map((r: any, i: number) => (<React.Fragment key={i}>
                <div style={{display: "flex", alignItems: "center", gap: "11px"}}>
                  <span style={r.dotStyle}>{r.mark}</span>
                  <span style={{flex: "0 0 130px", fontFamily: "'Courier New',monospace", fontSize: "6.5px", color: "#7e2553", letterSpacing: ".3px", lineHeight: "1.6"}}>{r.result}</span>
                  <span style={r.valStyle}>{r.value}</span>
                </div>
              </React.Fragment>))}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", background: "var(--ink)", borderTop: "4px solid rgba(60,42,24,.2)"}}>
              <button onClick={c.onView} style={c.viewStyle}>View at Node 7 ▸</button>
              <span style={{flex: "1"}}></span>
              <span style={{fontFamily: "'Courier New',monospace", fontSize: "6.5px", color: "#8f88ad", letterSpacing: ".4px"}}>{c.name} TRAIL</span>
            </div>
          </div>
        </React.Fragment>))}
      </div>
      </>)}

      {shelfEmpty && (<>
      <div style={{border: "2px dashed rgba(60,42,24,.3)", borderRadius: "16px", background: "#fff", padding: "40px 24px", textAlign: "center"}}>
        <div style={{fontSize: "40px", lineHeight: "1"}}>☆</div>
        <div style={{fontFamily: "'Courier New',monospace", fontSize: "10px", color: "var(--ink)", marginTop: "14px", lineHeight: "1.6", letterSpacing: ".1em"}}>NOTHING SHELVED YET</div>
        <p style={{margin: "12px auto 0", maxWidth: "400px", fontSize: "18px", lineHeight: "1.4", color: "var(--ink2)"}}>Open the Vault and tap the <span style={{color: "var(--brass)"}}>★</span> on any link to save it here for later.</p>
        <button onClick={onOpenLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: "18px", padding: "11px 16px", background: "var(--brass)", color: "#fff", fontFamily: "'Courier New',monospace", fontSize: "9px", border: "1px solid rgba(60,42,24,.15)", borderRadius: "10px"}}>≡ Open the Vault</button>
      </div>
      </>)}

      {shelfHasCards && (<>
      {shelfHas && (<>
      <div style={{fontFamily: "'Courier New',monospace", fontSize: "9px", color: "var(--ink2)", letterSpacing: ".5px", marginBottom: "12px"}}>★ SAVED LINKS</div>
      </>)}
      </>)}

      {shelfHas && (<>
      <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
        {shelfItems.map((l: any, i: number) => (<React.Fragment key={i}>
          <div style={{...l.rowStyle, background: "#fff", border: "1px solid rgba(60,42,24,.15)", borderLeft: `6px solid ${l.accent || 'var(--blue)'}`, boxShadow: "0 6px 16px -12px rgba(36,31,23,.2)", borderRadius: "12px", color: "var(--ink)"}}>
            <button onClick={l.onToggle} title="Remove from My Shelf" style={{...l.bmStyle, background: l.saved ? "var(--brass)" : "#fff", color: l.saved ? "#fff" : "var(--ink)", border: "1px solid rgba(60,42,24,.2)", borderRadius: "6px"}}>{l.bmIcon}</button>
            <a href={l.url} target="_blank" rel="noopener" style={{flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px", textDecoration: "none"}}>
              <span style={{fontFamily: "'Baloo 2',cursive", fontSize: "23px", lineHeight: "1.1", color: "var(--ink)"}}>{l.label}</span>
              <span style={{fontSize: "16px", lineHeight: "1.3", color: "#b7d2f5"}}>{l.about}</span>
            </a>
            <span style={{flex: "0 0 auto", fontFamily: "'Courier New',monospace", fontSize: "6px", color: "var(--ink2)", whiteSpace: "nowrap"}}>{l.trail}</span>
            <span style={{flex: "0 0 auto", minWidth: "0", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "15px", color: "#45d4ff"}}>↗ {l.domain}</span>
            <span style={{flex: "0 0 auto", padding: "3px 6px", background: "#1d4490", color: "var(--ink2)", fontFamily: "'Courier New',monospace", fontSize: "6px", border: "2px solid rgba(60,42,24,.2)"}}>{l.type}</span>
          </div>
        </React.Fragment>))}
      </div>
      </>)}
    </div>
    </>)}

    
</div>

</div>
</div>
);
}