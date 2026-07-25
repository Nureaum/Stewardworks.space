import React from "react";
import PixelHero from "./PixelHero";



export default function ArcadeTheme(props: any) {
const { pathway, onBackTrailhead, pwColor, pwMark, pwName, pwShelf, showJobs, pwJobCount, onSwitchPathway, otherPwName, pwIntro, atlasIsTrail, pwIsCreator, pwIsEnviro, atlasEdges, atlasNodes, atlasIsBasecamp, jobRows, boardChips, jobFilterChips, jobFilter, popupOpen, popColor: propsPopColor, popMark, popShelf, popStopName, onClosePopup, popBlurb, popEntryCount, popEntryList, popCall, popType, popSub, popTitle, popMedia, popImages, popParas, popFacts, popSrcs, pwTag, suggestOpen, onOpenSuggest, onCloseSuggest, sgDone, sgNotDone, sgTitle, onSgTitle, sgUrl, onSgUrl, sgPathway, onSgPathway, sgType, onSgType, sgStop, onSgStop, sgNote, onSgNote, canSubmit, sgSubmitStyle, onSubmitSuggest, sgSubmitting, isSteward, isExplorer, onRoleExplorer, onRoleSteward, onToggleIntro, introToggleLabel, introExpanded, waypointCount, noteCount, jobCount, showTrailhead, entryIsCrossroads, entryIsMaps, showPathway, creatorTipMeta, enviroTipMeta, mapCards, onPickCreator, onPickEnviro, stop, roleExplorerStyle, roleStewardStyle, pwCards, showOverview, navItems, theme, setTheme, footTag, popEntry, initialAvatar, onSaveAvatar, pw, pwAccent, isAdminUser, stopCounts } = props;

  
      const showShell = false;
  const showScan = true;
  const frameStyle = showShell
    ? { position: "relative" as any, zIndex: 1, width: "min(1300px,100%)", background: "linear-gradient(158deg,#f4ecda,#e7d9bc)", borderRadius: "26px", padding: "14px 14px 16px", boxShadow: "0 30px 70px -24px rgba(70,48,14,.55),inset 0 0 0 1px rgba(255,255,255,.55),inset 0 0 0 2px rgba(150,120,70,.22)" }
    : { position: "relative" as any, zIndex: 1, width: "min(1240px,100%)" };
  const [arcadeScreen, setArcadeScreen] = React.useState<'main' | 'quests' | 'library' | 'shelf' | 'summit'>(props.initialScreen || 'main');
  
  React.useEffect(() => {
    if (props.initialScreen) {
      setArcadeScreen(props.initialScreen);
    }
  }, [props.initialScreen]);

  const [mapMode, setMapMode] = React.useState<'map' | 'list'>('map');

  const showMapToggle = showPathway && arcadeScreen === 'main';
  const onMapMode = () => setMapMode('map');
  const onListMode = () => setMapMode('list');
  const mapModeStyle = {all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "7px 9px", background: mapMode === 'map' ? "#ffdd2e" : "transparent", color: mapMode === 'map' ? "#1c1526" : "var(--muted)", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", borderRight: "2px solid #1c1526"} as any;
  const listModeStyle = {all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "7px 9px", background: mapMode === 'list' ? "#ffdd2e" : "transparent", color: mapMode === 'list' ? "#1c1526" : "var(--muted)", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase"} as any;

  const onOpenLibrary = () => setArcadeScreen('library');
  const onOpenShelf = () => setArcadeScreen('shelf');
  const onBackLibrary = () => setArcadeScreen('main');
  const onBackShelf = () => setArcadeScreen('main');
  const showShelf = arcadeScreen === 'shelf';
  const shelfCount = props.shelfCount || 0;
  const totalPublished = props.libTotal || 0;
  // Map real app props to Arcade prototype variables
  const showIntro = false; // We can skip the retro intro animation for now
  const showSelect = showTrailhead && arcadeScreen === 'main';
  const showMap = showPathway && arcadeScreen === 'main';
  const showList = mapMode === 'list';
  const showQuests = arcadeScreen === 'quests';
  const showQuestBtn = showJobs;
  const onOpenQuests = () => setArcadeScreen('quests');
  const onBackMap = () => setArcadeScreen('main');
  const onBackSelect = () => setArcadeScreen('main');
  const mapIsMap = mapMode === 'map';
  const mapIsList = mapMode === 'list';
  const boardRows = boardChips || [];
  const libFilterChips = props.libFilterChips || [];
  const libTotal = props.libTotal || 0;
  const libNodeChips = props.libNodeChips || [];
  const libGroups = props.libGroups || [];
  const libBoards = props.libBoards || [];
  const shelfSub = props.shelfItems ? `Bookmarked jobs & workforce development resources` : "0 items shelved";
  const shelfEmpty = props.shelfItems ? props.shelfItems.length === 0 : true;
  const shelfHasCards = props.shelfHasCards || false;
  const shelfCards = props.shelfCards || [];
  const shelfHas = props.shelfItems && props.shelfItems.length > 0;
  const shelfItems = props.shelfItems || [];
  const showSummit = arcadeScreen === 'summit';
  const summitReqs = props.summitReqs || [];
  const showJobList = jobFilter !== 'BOARDS';
  const showBoardList = jobFilter === 'BOARDS';
  const boardList: any[] = [];
  // Extract Quiz props from parent
  const { popHasQuiz, quizPrompt, quizPickLabel, quizOptions, quizAllowCustom, quizCustomLabel, quizCustom, onQuizCustom, onQuizCustomBlur, quizCustomStyle, quizAnswered, quizUnanswered, quizStatusLabel, quizStatusStyle, quizHint, onQuizClear, quizClearStyle, quizSummitBtnLabel, quizSummitBtnStyle, onQuizPick, onQuizCustomPick, runClaimed, summitLocked, summitClaimable, summitDone, remainingCount, remainingText, onClaim, onPrintCard, onResetRun, summitTitle, summitKlass, summitIntro, summitCloser, summitChecklist, runComplete, cardStatRows } = props;

  const showLibrary = arcadeScreen === 'library';
  const showSummitTile = !!summitChecklist && summitChecklist.length > 0;
  
  // Celebration stubs
  const celebrating = false;
  const confettiEl = <></>;
  const onDismissCeleb = () => {};
  
  const completedStops = summitChecklist ? summitChecklist.filter((s: any) => s.done).length : 0;
  const totalStops = summitChecklist ? summitChecklist.length : 5;
  const summitProgLabel = `${completedStops} / ${totalStops}`;
  const summitProgColor = runComplete ? "#10285e" : "rgba(16, 40, 94, 0.65)";
  const summitBadgeMark = runComplete ? "★" : "🔒";

  const summitTileStyle: any = {
    all: "unset", cursor: runComplete ? "pointer" : "default", boxSizing: "border-box",
    position: "absolute", left: "50%", top: "15%", transform: "translate(-50%, -50%)", zIndex: 5,
    display: "flex", flexDirection: "column", alignItems: "center", width: "160px"
  };
  const summitBadgeStyle: any = {
    position: "relative", zIndex: 2, width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center",
    background: runComplete ? "#ffdd2e" : "#5a5578", color: "#1c1526",
    border: "4px solid #1c1526", boxShadow: runComplete ? "4px 4px 0 rgba(18,12,26,.42), 0 0 16px rgba(255, 221, 46, 0.8)" : "4px 4px 0 rgba(18,12,26,.42)", borderRadius: "8px",
    fontFamily: "'Press Start 2P',monospace", fontSize: "16px"
  };
  const summitLabelStyle: any = {
    display: "block", marginTop: "10px", padding: "6px 9px", background: "#ffdd2e",
    border: "3px solid #1c1526", borderRadius: "5px", boxShadow: "3px 3px 0 rgba(18,12,26,.4)",
    textAlign: "center" as any
  };
  const summitListStyle: any = {
    all: "unset", cursor: runComplete ? "pointer" : "default", boxSizing: "border-box", padding: "12px", background: runComplete ? "#ffdd2e" : "#163a82",
    display: "flex", alignItems: "center", gap: "14px", border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px"
  };
  const summitListTile: any = {
    flex: "0 0 auto", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: runComplete ? "#ffdd2e" : "#5a5578",
    color: "#1c1526", border: "3px solid #1c1526", borderRadius: "6px", fontFamily: "'Press Start 2P',monospace", fontSize: "14px"
  };
  const summitListSub = runComplete ? "Ready for Finale" : "Visit all stops to unlock";
  

  const onOpenSummit = () => {
    setArcadeScreen('summit');
  };
  
  const onQuizToSummit = () => {
    onClosePopup();
    setArcadeScreen('summit');
  };

    const selectCards = (mapCards || []).map((p: any) => ({
    ...p,
    klass: p.id === 'creator' ? 'THE STORYTELLER' : 'THE STEWARD',
    accent: p.id === 'creator' ? '#ff7e40' : '#43e97b'
  }));

  // --- OVERWORLD NODES + DOTTED PATH ---
  const [charStop, setCharStop] = React.useState('terrain');

  React.useEffect(() => {
    if (stop?.id) {
      setCharStop(stop.id);
    }
  }, [stop?.id]);

  const order = ["terrain", "portfolio", "story", "tools", "hiring", "mesa"];
  const posMap: Record<string, number[]> = { terrain: [9, 72], portfolio: [27, 40], story: [44, 74], tools: [60, 34], hiring: [77, 70], mesa: [92, 30] };
  const orderedStops = pw ? order.map(id => pw.stops.find((s: any) => s.id === id)).filter(Boolean) : [];
  
  const toVb = (p: number[]) => [p[0] * 2.56, p[1] * 1.44];
  const dots: any[] = [];
  for (let i = 0; i < orderedStops.length - 1; i++) {
    const a = toVb(posMap[orderedStops[i].id]), b = toVb(posMap[orderedStops[i + 1].id]);
    const steps = 9;
    for (let k = 1; k < steps; k++) {
      dots.push({ x: +(a[0] + (b[0] - a[0]) * k / steps - 1.7).toFixed(1), y: +(a[1] + (b[1] - a[1]) * k / steps - 1.7).toFixed(1) });
    }
  }

  const STEP = ["#ff2e8f", "#ff6a2e", "#ffdd2e", "#12f0c0", "#45d4ff", "#d24dff", "#e05cf0"];
  let popColor = propsPopColor;
  if (orderedStops && popStopName) {
    const stepIndex = orderedStops.findIndex((s: any) => s.name === popStopName);
    if (stepIndex >= 0 && STEP[stepIndex]) popColor = STEP[stepIndex];
  }

  const STEP_TXT = ["#1c1526", "#1c1526", "#1c1526", "#1c1526", "#1c1526", "#1c1526", "#1c1526"];
  const currentStopId = charStop || (orderedStops[0] ? orderedStops[0].id : "terrain");

  const mapNodes = orderedStops.map((sp: any, i: number) => {
    const pos = posMap[sp.id] || [50, 50];
    const big = sp.id === "portfolio";
    const sz = big ? 56 : 46;
    const here = sp.id === currentStopId;
    return {
      onOpen: () => {
        // Trigger the parent's popups by simulating a click on the map node
        // In the original, the parent page.tsx passed `atlasNodes` which had `onOpen`.
        // We can just find the matching atlasNode and call its onOpen!
        const match = atlasNodes?.find((an: any) => an.name === sp.name);
        if (match && match.onOpen) match.onOpen();
      },
      onEnter: () => setCharStop(sp.id),
      isHere: here,
      posStyle: {all: "unset", cursor: "pointer", boxSizing: "border-box", position: "absolute", left: pos[0] + "%", top: pos[1] + "%", transform: "translate(-50%,-50%)", zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", width: "140px"} as any,
      tileStyle: {position: "relative", zIndex: 2, width: sz + "px", height: sz + "px", display: "flex", alignItems: "center", justifyContent: "center", background: STEP[i], color: STEP_TXT[i], border: "4px solid #1c1526", boxShadow: `4px 4px 0 rgba(18,12,26,.42), 0 0 16px ${STEP[i]}cc`, borderRadius: "8px", fontFamily: "'Press Start 2P',monospace", fontSize: big ? "20px" : "16px"} as any,
      ringStyle: {position: "absolute", left: "50%", top: "50%", width: sz + "px", height: sz + "px", border: "3px solid " + STEP[i], animation: "ar-pulse 1.1s steps(4) infinite"} as any,
      step: i + 1, name: sp.name, notes: (stopCounts && stopCounts[sp.id]) || 0,
      labelStyle: {marginTop: "8px", padding: "5px 7px", background: "#f2f6ff", color: "#10285e", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", lineHeight: 1.5, textAlign: "center", maxWidth: "138px", outline: here ? "3px solid #ffdd2e" : "none", outlineOffset: here ? "2px" : "0"} as any
    };
  });

  const cpos = posMap[currentStopId] || [9, 72];
  const charPosStyle = {position: "absolute", left: cpos[0] + "%", top: cpos[1] + "%", transform: "translate(-50%,-96%)", zIndex: 6, pointerEvents: "none", transition: "left .5s steps(6), top .5s steps(6)"} as any;

  const listRows = orderedStops.map((sp: any, i: number) => {
    return {
      onOpen: () => {
        const match = atlasNodes?.find((an: any) => an.name === sp.name);
        if (match && match.onOpen) match.onOpen();
      },
      onEnter: () => setCharStop(sp.id),
      rowStyle: {all: "unset", cursor: "pointer", boxSizing: "border-box", display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#163a82", border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "10px", textDecoration: "none"} as any,
      tileStyle: {flex: "0 0 auto", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: STEP[i], color: STEP_TXT[i], border: "3px solid #1c1526", borderRadius: "6px", fontFamily: "'Press Start 2P',monospace", fontSize: "14px", boxShadow: "2px 2px 0 rgba(18,12,26,.3)"} as any,
      step: i + 1, name: sp.name, blurb: sp.blurb, notes: (stopCounts && stopCounts[sp.id]) || 0
    };
  });

  // --- STUBS FOR ARCADE PROTOTYPE FEATURES ---

  const [customizeOpen, setCustomizeOpen] = React.useState(false);
  const [charForm, setCharForm] = React.useState(initialAvatar?.form || 'enby');
  const [charSkin, setCharSkin] = React.useState(initialAvatar?.skin || '#e8b07a');
  const [charOutfit, setCharOutfit] = React.useState(initialAvatar?.outfit || '#ff2e8f');
  const [charHairStyle, setCharHairStyle] = React.useState(initialAvatar?.hairStyle || 'auto');
  const [charHairColor, setCharHairColor] = React.useState(initialAvatar?.hairColor || '#3a2a1a');
  const [charHatColor, setCharHatColor] = React.useState(initialAvatar?.hatColor || '#10285e');
  const [charHatType, setCharHatType] = React.useState(initialAvatar?.hatType || 'cap');
  const [charStageGear, setCharStageGear] = React.useState(initialAvatar?.gear || 'creator');

  React.useEffect(() => {
    if (initialAvatar) {
      setCharForm(initialAvatar.form || 'enby');
      setCharSkin(initialAvatar.skin || '#e8b07a');
      setCharOutfit(initialAvatar.outfit || '#ff2e8f');
      setCharHairStyle(initialAvatar.hairStyle || 'auto');
      setCharHairColor(initialAvatar.hairColor || '#3a2a1a');
      setCharHatColor(initialAvatar.hatColor || '#10285e');
      setCharHatType(initialAvatar.hatType || 'cap');
      setCharStageGear(initialAvatar.gear || 'creator');
    }
  }, [initialAvatar]);

  const onToggleCust = () => setCustomizeOpen(!customizeOpen);
  const onDoneCust = () => {
    setCustomizeOpen(false);
    if (onSaveAvatar) {
      onSaveAvatar({
        form: charForm,
        skin: charSkin,
        outfit: charOutfit,
        hairStyle: charHairStyle,
        hairColor: charHairColor,
        hatType: charHatType,
        hatColor: charHatColor,
        gear: charStageGear
      });
    }
  };

  const charIsHuman = charForm === 'fem' || charForm === 'masc' || charForm === 'enby';
  const custMin = !customizeOpen;
  const custMax = customizeOpen;
  
  const charSummary = charIsHuman 
    ? `${charForm.toUpperCase()} · ${charHatType.toUpperCase()} · ${charStageGear.toUpperCase()}`
    : `${charForm.toUpperCase()} · NO HAT · ${charStageGear.toUpperCase()}`;

  const btnStyle = (active: boolean) => ({
    all: "unset" as any, cursor: "pointer", boxSizing: "border-box" as any, 
    padding: "6px 9px", background: active ? "#ffdd2e" : "#163a82", 
    color: active ? "#1c1526" : "var(--paper)", fontFamily: "'Press Start 2P',monospace", 
    fontSize: "7px", letterSpacing: ".4px", border: "3px solid #1c1526", borderRadius: "5px"
  });

  const swatchStyle = (color: string, active: boolean) => ({
    all: "unset" as any, cursor: "pointer", boxSizing: "border-box" as any, 
    width: "24px", height: "24px", background: color, border: active ? "3px solid #ffdd2e" : "3px solid #1c1526", 
    boxShadow: active ? "0 0 0 2px #1c1526" : "none", borderRadius: "4px"
  });

  const bodyBtns = [
    { label: 'Fem', onPick: () => setCharForm('fem'), style: btnStyle(charForm === 'fem') },
    { label: 'Masc', onPick: () => setCharForm('masc'), style: btnStyle(charForm === 'masc') },
    { label: 'Enby', onPick: () => setCharForm('enby'), style: btnStyle(charForm === 'enby') }
  ];
  const creatureBtns = [
    { label: 'Tortoise', onPick: () => setCharForm('tortoise'), style: btnStyle(charForm === 'tortoise') },
    { label: 'Roadrunner', onPick: () => setCharForm('roadrunner'), style: btnStyle(charForm === 'roadrunner') },
    { label: 'Jackrabbit', onPick: () => setCharForm('jackrabbit'), style: btnStyle(charForm === 'jackrabbit') }
  ];
  const skinSwatches = ['#ffdfb3','#e6b981','#b88a44','#5c4326'].map(c => ({
    onPick: () => setCharSkin(c), style: swatchStyle(c, charSkin === c)
  }));
  const outfitSwatches = ['#ff4d7d','#45d4ff','#43e97b','#ffdd2e','#a761ff','#ff7e40'].map(c => ({
    onPick: () => setCharOutfit(c), style: swatchStyle(c, charOutfit === c)
  }));
  const hairStyleBtns = [
    { label: 'AUTO', onPick: () => setCharHairStyle('auto'), style: btnStyle(charHairStyle === 'auto') },
    { label: 'BALD', onPick: () => setCharHairStyle('bald'), style: btnStyle(charHairStyle === 'bald') },
    { label: 'BUZZ', onPick: () => setCharHairStyle('buzz'), style: btnStyle(charHairStyle === 'buzz') },
    { label: 'SHORT', onPick: () => setCharHairStyle('short'), style: btnStyle(charHairStyle === 'short') },
    { label: 'SWOOP', onPick: () => setCharHairStyle('swoop'), style: btnStyle(charHairStyle === 'swoop') },
    { label: 'LONG', onPick: () => setCharHairStyle('long'), style: btnStyle(charHairStyle === 'long') },
    { label: 'PONY', onPick: () => setCharHairStyle('pony'), style: btnStyle(charHairStyle === 'pony') },
    { label: 'BUN', onPick: () => setCharHairStyle('bun'), style: btnStyle(charHairStyle === 'bun') },
    { label: 'AFRO', onPick: () => setCharHairStyle('afro'), style: btnStyle(charHairStyle === 'afro') },
    { label: 'MOHAWK', onPick: () => setCharHairStyle('mohawk'), style: btnStyle(charHairStyle === 'mohawk') }
  ];
  const hairColorSwatches = ['#4a3b2c','#1c1526','#6b4a2a','#c98a3e','#ff4d7d','#45d4ff'].map(c => ({
    onPick: () => setCharHairColor(c), style: swatchStyle(c, charHairColor === c)
  }));
  const hatTypeBtns = [
    { label: 'BARE', onPick: () => setCharHatType('none'), style: btnStyle(charHatType === 'none') },
    { label: 'CAP', onPick: () => setCharHatType('cap'), style: btnStyle(charHatType === 'cap') },
    { label: 'BAND', onPick: () => setCharHatType('visor'), style: btnStyle(charHatType === 'visor') },
    { label: 'HAT', onPick: () => setCharHatType('bucket'), style: btnStyle(charHatType === 'bucket') }
  ];
  const hatColorSwatches = ['#10285e','#ff7e40','#5c2b3e','#1d4490','#ffffff'].map(c => ({
    onPick: () => setCharHatColor(c), style: swatchStyle(c, charHatColor === c)
  }));
  const gearBtns = [
    { label: 'BARE', onPick: () => setCharStageGear('none'), style: btnStyle(charStageGear === 'none') },
    { label: 'CAMERA', onPick: () => setCharStageGear('creator'), style: btnStyle(charStageGear === 'creator') },
    { label: 'FIELD KIT', onPick: () => setCharStageGear('enviro'), style: btnStyle(charStageGear === 'enviro') }
  ];
  
  const hatLabel = 'HEADGEAR';
  const skinLabel = 'SKIN';

  const custToggleLabel = 'Minimize';
  const enviroTabStyle = {};






return (<>



<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
<style dangerouslySetInnerHTML={{__html: `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#0a1c48}
  input,textarea,select,button{fontFamily:inherit}
  .arc::placeholder{color:#6f6a88}
  @keyframes ar-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @keyframes ar-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
  @keyframes ar-pop{0%{transform:translate(-50%,-50%) scale(.92);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
  @keyframes ar-pulse{0%{transform:translate(-50%,-50%) scale(1);opacity:.85}100%{transform:translate(-50%,-50%) scale(1.7);opacity:0}}
  @keyframes ar-conf{0%{transform:translateY(-12vh) rotate(0)}100%{transform:translateY(112vh) rotate(720deg)}}
  @keyframes ar-burst{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(1);opacity:0}}
  @keyframes ar-stamp{0%{transform:rotate(-14deg) scale(2.4);opacity:0}60%{transform:rotate(-14deg) scale(.9);opacity:1}100%{transform:rotate(-14deg) scale(1);opacity:1}}
  @keyframes ar-shine{0%,100%{opacity:.35}50%{opacity:1}}
  @media print{
    @page { margin: 10mm; }
    html, body {
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body * { 
      visibility: hidden !important; 
      animation: none !important;
      transition: none !important;
    }
    .run-card, .run-card * { 
      visibility: visible !important; 
    }
    .run-card {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      box-shadow: none !important;
      transform: none !important;
    }
    .run-card .no-print { display: none !important; }
  }
  .arc-scroll::-webkit-scrollbar{width:14px;height:14px}
  .arc-scroll::-webkit-scrollbar-thumb{background:#4a4468;border:3px solid #1b1730}
  .arc-scroll::-webkit-scrollbar-track{background:#1b1730}
  .arc-hud{scrollbar-width:thin;scrollbar-color:#4a4468 #10285e}
  .arc-hud::-webkit-scrollbar{height:7px}
  .arc-hud::-webkit-scrollbar-thumb{background:#4a4468;border-radius:4px}
  .arc-hud::-webkit-scrollbar-track{background:#10285e}
  .ar-rte a{color:#45d4ff}
  .ar-rte ul,.ar-rte ol{margin:12px 0;padding-left:24px}
  .ar-rte li{margin:5px 0}
  .ar-rte p{margin:14px 0 0}
  .ar-rte p:first-child{margin-top:0}
  .ar-rte h3{fontFamily:'Press Start 2P',monospace;fontSize:12px;margin:18px 0 8px;color:#ffdd2e;line-height:1.55}
  .ar-rte strong,.ar-rte b{color:#fff}
  .ar-rte em,.ar-rte i{color:#ffe6b0}
`}} />


<div style={{"--ink": "#10285e", "--paper": "#f2f6ff", "--panel": "#1d4490", "--panel2": "#2656a4", "--muted": "#9fc0ee", position: "relative", minHeight: "100vh", background: "radial-gradient(140% 120% at 50% 116%,#ffe08a 0%,#ff7ab0 14%,#ff5c9e 26%,#a94db0 44%,#3f6ae0 68%,#1a3f96 100%)", display: "flex", justifyContent: "center", padding: "clamp(14px,3vw,42px)", fontFamily: "'VT323',monospace"} as any}>
  {showShell && (<>
  <div style={{position: "fixed", inset: "0", zIndex: "0", background: "radial-gradient(130% 92% at 32% -8%,#f5e8ca 0%,#e2caa0 94%)"}}></div>
  </>)}
  <div style={frameStyle}>
    {showShell && (<>
    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "5px 12px 15px"}}>
      <span style={{fontFamily: "'VT323',monospace", fontSize: "21px", letterSpacing: "3px", color: "#5b4a2e"}}>STEWARD OS · WORKFORCE DEVELOPMENT</span>
      <div style={{display: "flex", gap: "9px", flex: "0 0 auto"}}>
        <span style={{width: "13px", height: "13px", borderRadius: "50%", background: "#e0574e", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)"}}></span>
        <span style={{width: "13px", height: "13px", borderRadius: "50%", background: "#e2a63c", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)"}}></span>
        <span style={{width: "13px", height: "13px", borderRadius: "50%", background: "#5bb257", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)"}}></span>
      </div>
    </div>
    </>)}
    <div style={{position: "relative", width: "100%", background: "#211b30", border: "5px solid #1c1526", borderRadius: "12px", boxShadow: "0 0 0 3px #3a3357,0 24px 60px -20px rgba(0,0,0,.5)", overflow: "hidden"}}>

    {showScan && (<>
    <div style={{position: "absolute", inset: "0", pointerEvents: "none", zIndex: "30", background: "repeating-linear-gradient(to bottom,rgba(0,0,0,.07) 0 1px,transparent 1px 3px)", mixBlendMode: "multiply"}}></div>
    <div style={{position: "absolute", inset: "0", pointerEvents: "none", zIndex: "30", boxShadow: "inset 0 0 120px 10px rgba(0,0,0,.28)"}}></div>
    </>)}

    {/* HUD */}
    <div className="arc-hud" style={{position: "sticky", top: "0", zIndex: "40", display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap", overflowX: "auto", padding: "11px 14px", background: "#10285e", borderBottom: "4px solid #1c1526"}}>
      <a href="/hub" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: "#2656a4", color: "var(--paper)", textDecoration: "none", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>⌂ Hub</a>
      <div style={{display: "flex", alignItems: "center", gap: "8px", flex: "0 0 auto"}}>
        <span style={{width: "18px", height: "18px", background: "#ffdd2e", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "6px", flex: "0 0 auto"}}></span>
        <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--paper)", letterSpacing: ".5px", textShadow: "0 0 9px rgba(255,138,61,.75),2px 2px 0 rgba(255,77,125,.45)", lineHeight: "1.5", whiteSpace: "nowrap"}}>WORKFORCE ADVENTURE</span>
      </div>
      <div style={{flex: "1 1 0", minWidth: "6px"}}></div>

      {isAdminUser && (<>
      <div role="group" aria-label="Player view" style={{flex: "0 0 auto", display: "inline-flex", gap: "0", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>
        <button onClick={onRoleExplorer} style={roleExplorerStyle}>Explorer</button>
        <button onClick={onRoleSteward} style={roleStewardStyle}>Admin</button>
      </div>
      </>)}
      {showMapToggle && (<>
      <div role="group" aria-label="Map view" style={{flex: "0 0 auto", display: "inline-flex", gap: "0", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>
        <button onClick={onMapMode} style={mapModeStyle}>Map</button>
        <button onClick={onListMode} style={listModeStyle}>List</button>
      </div>
      </>)}
      {isExplorer && (<>
      <button onClick={onOpenLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: "#d24dff", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>≡ Vault</button>
      <button onClick={onOpenShelf} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>★ My Jobs Shelf · {shelfCount}</button>
      <button onClick={onOpenSuggest} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: "#ff6a2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>＋ Suggest</button>
      </>)}
      {isSteward && (<>
      <a href="/admin/workforce-pathways" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: "#45d4ff", color: "#10285e", textDecoration: "none", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>Console ▶</a>
      </>)}
    </div>

    {/* ============ SELECT + CUSTOMIZE ============ */}
    {showSelect && (<>
    <div data-screen-label="Arcade — customize and select path" style={{padding: "22px 20px 30px"}}>

      {/* customize scene */}
      <div style={{maxWidth: "min(1160px,100%)", margin: "0 auto", border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", overflow: "hidden"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "11px 16px", background: "#45d4ff", borderBottom: "4px solid #1c1526"}}>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "#10285e", letterSpacing: ".5px"}}>CUSTOMIZE YOUR EXPLORER</span>
          <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
            <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".7"}}>STEP 1 / 2</span>
            <button onClick={onToggleCust} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "7px 9px", background: "#10285e", color: "#45d4ff", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px", borderRadius: "5px"}}>{custToggleLabel}</button>
          </div>
        </div>

        {custMin && (<>
        <div style={{display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px"}}>
                    <div style={{flex: "0 0 auto", padding: "6px 9px", background: "linear-gradient(#163a90,#2a55a8)", border: "3px solid #1c1526", boxShadow: "inset 0 0 0 2px #3a68b8"}}>
            <PixelHero form={charForm} skin={charSkin} outfit={charOutfit} hairStyle={charHairStyle} hairColor={charHairColor} hatColor={charHatColor} hatType={charHatType} gear={charStageGear} style={{width: "32px", height: "42px", display: "block"}} />
          </div>
          <div style={{flex: "1", minWidth: "0"}}>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "var(--paper)"}}>EXPLORER READY</div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", marginTop: "9px", lineHeight: "1.7"}}>{charSummary}</div>
          </div>
          <button onClick={onToggleCust} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>✎ Edit look</button>
        </div>
        </>)}

        {custMax && (<>
        <div style={{display: "grid", gridTemplateColumns: "262px 1fr", gap: "16px", padding: "18px", alignItems: "stretch"}}>
          {/* stage */}
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "16px 12px 10px", background: "linear-gradient(#163a90,#2a55a8)", border: "4px solid #1c1526", boxShadow: "inset 0 0 0 3px #3a68b8", minHeight: "340px"}}>
            <div style={{flex: "1"}}></div>
            <div style={{animation: "ar-bob 1s steps(2) infinite"}}><PixelHero form={charForm} skin={charSkin} outfit={charOutfit} hairStyle={charHairStyle} hairColor={charHairColor} hatColor={charHatColor} hatType={charHatType} gear={charStageGear} style={{width: "150px", height: "196px", display: "block"}} /></div>
            <div style={{width: "170px", height: "12px", marginTop: "2px", background: "repeating-linear-gradient(90deg,#c98a3e 0 8px,#a86f2c 8px 16px)", border: "3px solid #1c1526"}}></div>
            <div style={{marginTop: "14px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#a9c8ff", letterSpacing: ".4px", textAlign: "center", lineHeight: "1.9"}}>{charSummary}</div>
          </div>
          {/* controls grid */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "14px", alignContent: "start"}}>
            <div style={{gridColumn: "1 / -1", background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>BODY</div>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "11px"}}>
                {bodyBtns.map((b: any, i: number) => (<React.Fragment key={i}><button onClick={b.onPick} style={b.style}>{b.label}</button></React.Fragment>))}
              </div>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#6f6a88", letterSpacing: ".5px", marginBottom: "8px"}}>…OR ROLL A CRITTER COMPANION</div>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                {creatureBtns.map((b: any, i: number) => (<React.Fragment key={i}><button onClick={b.onPick} style={b.style}>{b.label}</button></React.Fragment>))}
              </div>
            </div>
            {charIsHuman && (<>
            <div style={{background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>{skinLabel}</div>
              <div style={{display: "flex", gap: "9px", flexWrap: "wrap"}}>
                {skinSwatches.map((s: any, i: number) => (<React.Fragment key={i}><button onClick={s.onPick} style={s.style}></button></React.Fragment>))}
              </div>
            </div>
            </>)}
            <div style={{background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>OUTFIT</div>
              <div style={{display: "flex", gap: "9px", flexWrap: "wrap"}}>
                {outfitSwatches.map((s: any, i: number) => (<React.Fragment key={i}><button onClick={s.onPick} style={s.style}></button></React.Fragment>))}
              </div>
            </div>
            {charIsHuman && (<>
            <div style={{background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>HAIR</div>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                {hairStyleBtns.map((h: any, i: number) => (<React.Fragment key={i}><button onClick={h.onPick} style={h.style}>{h.label}</button></React.Fragment>))}
              </div>
              <div style={{display: "flex", gap: "9px", flexWrap: "wrap"}}>
                {hairColorSwatches.map((s: any, i: number) => (<React.Fragment key={i}><button onClick={s.onPick} style={s.style}></button></React.Fragment>))}
              </div>
            </div>
            </>)}
            {charIsHuman && (<>
            <div style={{background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>{hatLabel}</div>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                {hatTypeBtns.map((h: any, i: number) => (<React.Fragment key={i}><button onClick={h.onPick} style={h.style}>{h.label}</button></React.Fragment>))}
              </div>
              <div style={{display: "flex", gap: "9px", flexWrap: "wrap"}}>
                {hatColorSwatches.map((s: any, i: number) => (<React.Fragment key={i}><button onClick={s.onPick} style={s.style}></button></React.Fragment>))}
              </div>
            </div>
            </>)}
            <div style={{gridColumn: "1 / -1", background: "#1d4490", border: "3px solid #1c1526", borderRadius: "7px", padding: "12px 13px"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "9px"}}>GEAR</div>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                {gearBtns.map((g: any, i: number) => (<React.Fragment key={i}><button onClick={g.onPick} style={g.style}>{g.label}</button></React.Fragment>))}
              </div>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#6f6a88", letterSpacing: ".5px", marginTop: "8px"}}>CAMERA RIG = CREATOR · FIELD KIT = ENVIRO · WORKS ON CRITTERS TOO</div>
            </div>
          </div>
        </div>
        <div style={{padding: "0 18px 18px"}}>
          <button onClick={onDoneCust} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", display: "block", width: "100%", textAlign: "center", padding: "12px", background: "#12f0c0", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>✓ Looks good — minimize &amp; pick a path ▼</button>
        </div>
        </>)}
      </div>

      {/* select path */}
      <div style={{textAlign: "center", margin: "30px 0 6px"}}>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "16px", color: "var(--paper)", letterSpacing: "1px", textShadow: "3px 3px 0 rgba(255,0,77,.4)"}}>SELECT YOUR PATH</div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "#ffdd2e", letterSpacing: "1px", marginTop: "12px", animation: "ar-blink 1.1s steps(1) infinite"}}>▶ PRESS TO CHOOSE A PATH ◀</div>
      </div>
      <div style={{display: "flex", gap: "22px", flexWrap: "wrap", justifyContent: "center", marginTop: "18px"}}>
        {selectCards.map((c: any, i: number) => (<React.Fragment key={i}>
          <div onClick={c.onPick} style={{cursor: "pointer", width: "360px", maxWidth: "92vw", background: "#163a82", border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px"}} style-hover="transform:translateY(-5px)">
            <div style={{padding: "9px 12px", background: c.accent, borderBottom: "4px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "#10285e"}}>{c.klass}</span>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".65"}}>PATH</span>
            </div>
            <div style={{display: "flex", gap: "14px", padding: "16px", alignItems: "center"}}>
                            <div style={{flex: "0 0 auto", padding: "8px 10px", background: "#123068", border: "3px solid #1c1526", boxShadow: "inset 0 0 0 2px #3a68b8"}}>
                <PixelHero form={charForm} skin={charSkin} outfit={charOutfit} hairStyle={charHairStyle} hairColor={charHairColor} hatColor={charHatColor} hatType={charHatType} gear={c.id} style={{width: "64px", height: "84px", display: "block"}} />
              </div>
              <div style={{flex: "1", minWidth: "0"}}>
                <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "var(--paper)", lineHeight: "1.5", whiteSpace: "nowrap"}}>{c.name}</div>
                <div style={{fontSize: "18px", lineHeight: "1.15", color: "var(--muted)", marginTop: "8px"}}>{c.tagline}</div>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 14px", borderTop: "3px dashed #4a4468"}}>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", lineHeight: "1.6"}}>{c.waypoints} STOPS · {c.notes} NOTES</span>
              <button onClick={c.onPick} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: c.accent, color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>▶ START</button>
            </div>
          </div>
        </React.Fragment>))}
      </div>
    </div>
    <div style={{padding: "12px 16px", background: "#10285e", borderTop: "4px solid #1c1526", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#5a5578", letterSpacing: ".5px", textAlign: "center"}}>◇ STEWARD LIBRARY · INDUSTRY AND WORKFORCE DEVELOPMENT · INSERT COIN ◇</div>
    </>)}

    {/* ============ MAP ============ */}
    {showMap && (<>
    <div data-screen-label="Arcade — overworld map" style={{padding: "16px 18px 26px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px"}}>
        <button onClick={onBackTrailhead} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>◀ Change path</button>
        <div role="group" aria-label="Choose trail" style={{display: "inline-flex", gap: "0", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px", overflow: "hidden"}}>
          <button onClick={onPickCreator} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: pwIsCreator ? "#ff7e40" : "#163a82", color: pwIsCreator ? "#1c1526" : "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", borderRight: "3px solid #1c1526"}}>◍ Content Creator</button>
          <button onClick={onPickEnviro} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: pwIsEnviro ? "#43e97b" : "#163a82", color: pwIsEnviro ? "#1c1526" : "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase"}}>❋ Environmental Career</button>
        </div>
        <div style={{flex: "1"}}></div>
        {showQuestBtn && (<>
        <button onClick={onOpenQuests} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>⚑ Quest board · {pwJobCount}</button>
        </>)}
      </div>

      {/* mission briefing */}
      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#123068", marginBottom: "18px"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: pwAccent, borderBottom: "4px solid #1c1526"}}>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "#10285e"}}>◈ MISSION BRIEFING</span>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".7"}}>{pwShelf}</span>
        </div>
        <p style={{margin: "0", padding: "14px 16px", fontSize: "19px", lineHeight: "1.35", color: "var(--paper)"}}>{pwIntro}</p>
      </div>

      {mapIsMap && (<>
      <div style={{position: "relative", width: "100%", aspectRatio: "16/9", minHeight: "400px", border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", overflow: "hidden"}}>
        <svg viewBox="0 0 256 144" preserveAspectRatio="none" style={{position: "absolute", inset: "0", width: "100%", height: "100%", zIndex: "0", imageRendering: "pixelated", shapeRendering: "crispEdges"}}>
          <defs>
            <pattern id="ar-dither" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#ffab5c"></rect>
              <rect x="0" y="0" width="1" height="1" fill="#e88a4a"></rect>
              <rect x="2" y="2" width="1" height="1" fill="#e88a4a"></rect>
            </pattern>
          </defs>
          <rect width="256" height="144" fill="url(#ar-dither)"></rect>
          {/* bright dawn sky: electric blue with sunrise glow */}
          <rect x="0" y="0" width="256" height="72" fill="#3f8ce8"></rect>
          <rect x="0" y="0" width="256" height="20" fill="#2f6ce0"></rect>
          <rect x="0" y="20" width="256" height="14" fill="#3f96ea"></rect>
          <rect x="0" y="34" width="256" height="10" fill="#6bc4ee"></rect>
          <rect x="0" y="44" width="256" height="8" fill="#ff6ea0"></rect>
          <rect x="0" y="52" width="256" height="8" fill="#ff845c"></rect>
          <rect x="0" y="60" width="256" height="7" fill="#ffb84d"></rect>
          <rect x="0" y="67" width="256" height="5" fill="#ffe08a"></rect>
          {/* rising sun with neon glow */}
          <rect x="146" y="48" width="54" height="8" fill="#ff7a6a" opacity="0.5"></rect>
          <rect x="154" y="44" width="38" height="24" fill="#fff0a0"></rect>
          <rect x="158" y="40" width="30" height="4" fill="#fff0a0"></rect>
          <rect x="150" y="46" width="4" height="18" fill="#ffd66a"></rect>
          <rect x="192" y="46" width="4" height="18" fill="#ffd66a"></rect>
          <rect x="160" y="46" width="26" height="18" fill="#ffffff"></rect>
          {/* neon-underlit clouds */}
          <rect x="52" y="24" width="30" height="3" fill="#ff5c9e"></rect><rect x="58" y="21" width="16" height="3" fill="#ff8ab8"></rect>
          <rect x="120" y="16" width="26" height="3" fill="#bfeaff"></rect>
          <rect x="206" y="28" width="28" height="3" fill="#ff5c9e"></rect><rect x="214" y="25" width="14" height="3" fill="#ff8ab8"></rect>
          {/* far range: San Jacinto (left) */}
          <rect x="0" y="54" width="42" height="18" fill="#3452a0"></rect>
          <rect x="10" y="47" width="20" height="9" fill="#3452a0"></rect>
          <rect x="15" y="42" width="10" height="6" fill="#3452a0"></rect>
          <rect x="15" y="42" width="10" height="3" fill="#f4f8ff"></rect><rect x="13" y="45" width="6" height="2" fill="#f4f8ff"></rect>
          <rect x="36" y="58" width="42" height="14" fill="#3f5cae"></rect>
          <rect x="50" y="52" width="16" height="8" fill="#3f5cae"></rect>
          <rect x="50" y="52" width="16" height="3" fill="#dcecff"></rect>
          {/* far range: Chocolate Mtns (right, behind MESA) */}
          <rect x="150" y="60" width="66" height="12" fill="#4a5aa0"></rect>
          <rect x="196" y="52" width="34" height="12" fill="#4a5aa0"></rect>
          <rect x="212" y="44" width="18" height="10" fill="#5566ac"></rect>
          <rect x="222" y="38" width="14" height="8" fill="#5566ac"></rect>
          <rect x="222" y="38" width="14" height="3" fill="#f4f8ff"></rect><rect x="220" y="41" width="6" height="2" fill="#f4f8ff"></rect>
          <rect x="230" y="46" width="26" height="26" fill="#3a4c96"></rect>
          <rect x="240" y="42" width="16" height="6" fill="#4a5aa0"></rect>
          {/* horizon */}
          <rect x="0" y="70" width="256" height="2" fill="#caa05a"></rect>
          {/* Salton Sea + salt shore (bottom-left) */}
          <rect x="0" y="114" width="88" height="4" fill="#e7ded0"></rect>
          <rect x="0" y="118" width="88" height="26" fill="#2f7ae0"></rect>
          <rect x="0" y="118" width="88" height="3" fill="#4f9ae8"></rect>
          <rect x="0" y="121" width="88" height="1" fill="#7ac0f0"></rect>
          <rect x="10" y="127" width="12" height="2" fill="#bfe6ff"></rect><rect x="30" y="134" width="16" height="2" fill="#bfe6ff"></rect><rect x="54" y="124" width="12" height="2" fill="#bfe6ff"></rect><rect x="38" y="139" width="20" height="2" fill="#bfe6ff"></rect>
          {/* geothermal / lithium plant on the shore */}
          <rect x="66" y="106" width="16" height="10" fill="#5a5e70"></rect>
          <rect x="66" y="106" width="16" height="2" fill="#7a7e90"></rect>
          <rect x="69" y="99" width="4" height="7" fill="#6a6e80"></rect>
          <rect x="75" y="101" width="3" height="5" fill="#6a6e80"></rect>
          <rect x="68" y="93" width="6" height="6" fill="#eef3f7" opacity="0.85"></rect>
          <rect x="70" y="88" width="6" height="5" fill="#eef3f7" opacity="0.6"></rect>
          {/* Imperial Sand Dunes (center) */}
          <rect x="90" y="120" width="64" height="24" fill="#ffce7c"></rect>
          <rect x="90" y="120" width="64" height="4" fill="#ffe4ae"></rect>
          <rect x="104" y="116" width="30" height="5" fill="#ffce7c"></rect>
          <rect x="104" y="116" width="30" height="3" fill="#ffe4ae"></rect>
          <rect x="118" y="128" width="30" height="2" fill="#f0b060"></rect>
          {/* farmland rows (bottom-right) */}
          <rect x="158" y="122" width="98" height="22" fill="#2fb078"></rect>
          <rect x="158" y="122" width="98" height="3" fill="#45c890"></rect>
          <rect x="158" y="128" width="98" height="1" fill="#1f8a60"></rect><rect x="158" y="134" width="98" height="1" fill="#1f8a60"></rect><rect x="158" y="140" width="98" height="1" fill="#1f8a60"></rect>
          <rect x="176" y="122" width="1" height="22" fill="#1f8a60"></rect><rect x="198" y="122" width="1" height="22" fill="#1f8a60"></rect><rect x="220" y="122" width="1" height="22" fill="#1f8a60"></rect><rect x="242" y="122" width="1" height="22" fill="#1f8a60"></rect>
          {/* date palms by the fields */}
          <g><rect x="150" y="104" width="2" height="16" fill="#6a4a2a"></rect><rect x="144" y="103" width="7" height="2" fill="#2f9e4a"></rect><rect x="151" y="103" width="7" height="2" fill="#2f9e4a"></rect><rect x="146" y="100" width="4" height="3" fill="#2f9e4a"></rect><rect x="152" y="100" width="4" height="3" fill="#2f9e4a"></rect></g>
          <g><rect x="162" y="108" width="2" height="12" fill="#6a4a2a"></rect><rect x="157" y="107" width="6" height="2" fill="#2f9e4a"></rect><rect x="163" y="107" width="6" height="2" fill="#2f9e4a"></rect><rect x="159" y="104" width="3" height="3" fill="#2f9e4a"></rect><rect x="163" y="104" width="3" height="3" fill="#2f9e4a"></rect></g>
          {/* saguaro cacti */}
          <g><rect x="40" y="86" width="4" height="16" fill="#2f9e4a"></rect><rect x="42" y="86" width="2" height="16" fill="#238a3c"></rect><rect x="36" y="92" width="4" height="3" fill="#2f9e4a"></rect><rect x="36" y="89" width="3" height="6" fill="#2f9e4a"></rect><rect x="44" y="94" width="4" height="3" fill="#2f9e4a"></rect><rect x="45" y="90" width="3" height="7" fill="#2f9e4a"></rect></g>
          <g><rect x="132" y="88" width="4" height="14" fill="#2f9e4a"></rect><rect x="134" y="88" width="2" height="14" fill="#238a3c"></rect><rect x="128" y="93" width="4" height="3" fill="#2f9e4a"></rect><rect x="128" y="90" width="3" height="6" fill="#2f9e4a"></rect></g>
          {/* ocotillo (red-tipped stalks) */}
          <g><rect x="98" y="88" width="1" height="14" fill="#6f7f3f"></rect><rect x="100" y="86" width="1" height="16" fill="#6f7f3f"></rect><rect x="102" y="88" width="1" height="14" fill="#6f7f3f"></rect><rect x="98" y="88" width="1" height="1" fill="#ff4d4d"></rect><rect x="100" y="86" width="1" height="1" fill="#ff4d4d"></rect><rect x="102" y="88" width="1" height="1" fill="#ff4d4d"></rect></g>
          <g><rect x="206" y="86" width="1" height="14" fill="#6f7f3f"></rect><rect x="208" y="84" width="1" height="16" fill="#6f7f3f"></rect><rect x="210" y="86" width="1" height="14" fill="#6f7f3f"></rect><rect x="206" y="86" width="1" height="1" fill="#ff4d4d"></rect><rect x="208" y="84" width="1" height="1" fill="#ff4d4d"></rect><rect x="210" y="86" width="1" height="1" fill="#ff4d4d"></rect></g>
          {/* creosote bushes */}
          <rect x="58" y="128" width="6" height="4" fill="#4f6f28"></rect><rect x="60" y="126" width="3" height="3" fill="#5c7f30"></rect>
          <rect x="146" y="96" width="6" height="3" fill="#4f6f28"></rect>
        </svg>

        <svg viewBox="0 0 256 144" preserveAspectRatio="none" style={{position: "absolute", inset: "0", width: "100%", height: "100%", zIndex: "1", imageRendering: "pixelated", shapeRendering: "crispEdges"}}>
          {dots.map((d: any, i: number) => (<React.Fragment key={i}>
            <rect x={d.x} y={d.y} width="3.4" height="3.4" fill="#fff1c2" stroke="#10285e" strokeWidth="0.9"></rect>
          </React.Fragment>))}
        </svg>

        {mapNodes.map((n: any, i: number) => (<React.Fragment key={i}>
          <button onClick={n.onOpen} onMouseEnter={n.onEnter} onFocus={n.onEnter} style={n.posStyle} style-hover="z-index:7">
            <span style={{position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
              {n.isHere && (<>
                <span style={n.ringStyle}></span>
              </>)}
              <span style={n.tileStyle}>{n.step}</span>
            </span>
            <span style={n.labelStyle}>{n.name}</span>
          </button>
        </React.Fragment>))}

        {showSummitTile && (<>
        <button onClick={onOpenSummit} style={summitTileStyle}>
          <span style={summitBadgeStyle}>{summitBadgeMark}</span>
          <span style={summitLabelStyle}>
            <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#10285e", lineHeight: "1.5"}}>NODE 7 · SUMMIT</span>
            <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: summitProgColor, marginTop: "5px"}}>{summitProgLabel}</span>
          </span>
        </button>
        </>)}

        <div style={charPosStyle}>
          <div style={{animation: "ar-bob 1s steps(2) infinite"}}><PixelHero form={charForm} skin={charSkin} outfit={charOutfit} hairStyle={charHairStyle} hairColor={charHairColor} hatColor={charHatColor} hatType={charHatType} gear={charStageGear} style={{width: "32px", height: "42px", display: "block"}} /></div>
        </div>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "12px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", letterSpacing: ".5px"}}>
        <span>YOUR HERO WALKS TO WHATEVER STOP YOU HOVER OR OPEN</span>
        <span style={{color: "#ffdd2e"}}>▶ CLICK A TILE TO READ ITS FIELD NOTES</span>
      </div>
      </>)}

      {mapIsList && (<>
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        {listRows.map((r: any, i: number) => (<React.Fragment key={i}>
          <button onClick={r.onOpen} onMouseEnter={r.onEnter} onFocus={r.onEnter} style={r.rowStyle}>
            <span style={r.tileStyle}>{r.step}</span>
            <span style={{flex: "1", minWidth: "0", textAlign: "left"}}>
              <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "var(--paper)", lineHeight: "1.4"}}>{r.name}</span>
              <span style={{display: "block", fontSize: "17px", lineHeight: "1.2", color: "var(--muted)", marginTop: "5px"}}>{r.blurb}</span>
            </span>
            <span style={{flex: "0 0 auto", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)"}}>{r.notes} ▸</span>
          </button>
        </React.Fragment>))}
        {showSummitTile && (<>
        <button onClick={onOpenSummit} style={summitListStyle}>
          <span style={summitListTile}>7</span>
          <span style={{flex: "1", minWidth: "0", textAlign: "left"}}>
            <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "#10285e", lineHeight: "1.4"}}>NODE 7 · THE SUMMIT</span>
            <span style={{display: "block", fontSize: "17px", lineHeight: "1.2", color: "#10285e", opacity: ".82", marginTop: "5px"}}>{summitListSub}</span>
          </span>
          <span style={{flex: "0 0 auto", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#10285e"}}>{summitProgLabel} ▸</span>
        </button>
        </>)}
      </div>
      </>)}
    </div>
    </>)}

    {/* ============ QUEST BOARD ============ */}
    {showQuests && (<>
    <div data-screen-label="Arcade — quest board" style={{padding: "16px 18px 30px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px"}}>
        <button onClick={onBackMap} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>◀ Back to map</button>
        <div style={{flex: "1"}}></div>

      </div>
      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82"}}>
        <div style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: "#10285e", borderBottom: "4px solid #1c1526"}}>
          <span style={{width: "34px", height: "34px", background: "#ffdd2e", border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#10285e", flex: "0 0 auto"}}>⚑</span>
          <div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "14px", color: "var(--paper)", textShadow: "2px 2px 0 rgba(255,0,77,.4)"}}>QUEST BOARD</div>
            <div style={{fontSize: "17px", color: "var(--muted)", marginTop: "4px"}}>Steward-curated bounties across the basin</div>
          </div>
        </div>
        <div style={{display: "flex", gap: "10px", flexWrap: "wrap", padding: "14px 18px", background: "var(--panel2)", borderBottom: "4px solid #1c1526"}}>
          {jobFilterChips.map((c: any, i: number) => (<React.Fragment key={i}>
            <button onClick={c.onPick} style={c.style}>{c.label} · {c.n}</button>
          </React.Fragment>))}
        </div>
        {showJobList && (<>
        {jobRows.map((j: any, i: number) => (<React.Fragment key={i}>
          <div style={{display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "14px", alignItems: "center", padding: "15px 18px", borderBottom: "3px solid #10285e", background: "#163a82"}}>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); j.onToggleBookmark && j.onToggleBookmark(); }}
              style={{
                all: "unset", cursor: j.isSubmitting ? "wait" : "pointer", boxSizing: "border-box",
                width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                background: j.isBookmarked ? "#ffdd2e" : "#2656a4", color: j.isBookmarked ? "#10285e" : "#8f88ad",
                fontSize: "18px", border: "3px solid #1c1526", boxShadow: "2px 2px 0 rgba(18,12,26,.4)", borderRadius: "7px",
                flex: "0 0 auto"
              } as any}
              title={j.isBookmarked ? "Remove bookmark" : "Bookmark this job"}
            >
              {j.bmIcon}
            </button>
            <a href={j.url} target="_blank" rel="noopener" style={{minWidth: "0", textDecoration: "none"}}>
              <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap"}}>
                <span style={{fontFamily: "'VT323',monospace", fontSize: "23px", color: "var(--paper)", lineHeight: "1.15", letterSpacing: ".3px"}}>{j.title}</span>
                <span style={{padding: "3px 7px", background: j.tagColor, color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "6px", border: "2px solid #1c1526"}}>{j.tagLabel}</span>
                <span style={{padding: "3px 7px", background: "var(--panel2)", color: "var(--muted)", fontFamily: "'Press Start 2P',monospace", fontSize: "6px", border: "2px solid #1c1526"}}>{j.kind}</span>
              </div>
              <div style={{fontSize: "17px", lineHeight: "1.3", color: "var(--muted)", marginTop: "7px"}}>{j.org} · {j.place} — {j.note}</div>
            </a>
            <a href={j.url} target="_blank" rel="noopener" style={{textAlign: "right", flex: "0 0 auto", textDecoration: "none"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#45d4ff"}}>APPLY ↗</div>
              <div style={{fontSize: "15px", color: "var(--muted)", marginTop: "6px"}}>{j.posted}</div>
            </a>
          </div>
        </React.Fragment>))}
        <div style={{padding: "13px 18px", background: "#10285e", fontSize: "16px", color: "var(--muted)", lineHeight: "1.4"}}>Looking wider? Switch to the <span style={{color: "#ffdd2e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px"}}>◇ BOARDS</span> filter above for the big regional &amp; national job boards.</div>
        </>)}

        {showBoardList && (<>
        <div style={{padding: "14px 18px 8px", background: "#10285e"}}>
          <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#ffdd2e", letterSpacing: ".5px", lineHeight: "1.6"}}>◇ EXTERNAL QUEST BOARDS</div>
          <div style={{fontSize: "17px", color: "var(--muted)", marginTop: "7px", lineHeight: "1.35"}}>The big regional &amp; national boards the stewards keep an eye on. Save a search on each and check weekly — government postings close fast.</div>
        </div>
        {boardRows.map((b: any, i: number) => (<React.Fragment key={i}>
          <div style={{display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "14px", alignItems: "center", padding: "15px 18px", borderBottom: "3px solid #10285e", background: "#163a82"}}>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); b.onToggleBookmark && b.onToggleBookmark(); }}
              style={{
                all: "unset", cursor: b.isSubmitting ? "wait" : "pointer", boxSizing: "border-box",
                width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                background: b.isBookmarked ? "#ffdd2e" : "#2656a4", color: b.isBookmarked ? "#10285e" : "#8f88ad",
                fontSize: "18px", border: "3px solid #1c1526", boxShadow: "2px 2px 0 rgba(18,12,26,.4)", borderRadius: "7px",
                flex: "0 0 auto"
              } as any}
              title={b.isBookmarked ? "Remove bookmark" : "Bookmark this board"}
            >
              {b.bmIcon}
            </button>
            <a href={b.url} target="_blank" rel="noopener" style={{minWidth: "0", textDecoration: "none"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "var(--paper)", lineHeight: "1.5"}}>{b.label}</div>
              <div style={{fontSize: "17px", lineHeight: "1.3", color: "var(--muted)", marginTop: "6px"}}>{b.desc}</div>
            </a>
            <a href={b.url} target="_blank" rel="noopener" style={{textAlign: "right", flex: "0 0 auto", textDecoration: "none"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#45d4ff"}}>OPEN ↗</div>
            </a>
          </div>
        </React.Fragment>))}
        </>)}
      </div>
    </div>
    </>)}

    {/* ============ RESOURCE VAULT ============ */}
    {showLibrary && (<>
    <div data-screen-label="Arcade — resource vault" style={{padding: "16px 18px 30px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px"}}>
        <button onClick={onBackLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>◀ Back</button>
        <div style={{flex: "1"}}></div>
        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
          <button style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "#ff6a2e", color: "#1c1526", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>QUEST BOARD</button>
        </div>
      </div>

      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", marginBottom: "18px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: "#10285e", borderBottom: "4px solid #1c1526"}}>
          <span style={{width: "34px", height: "34px", background: "#d24dff", border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#10285e", flex: "0 0 auto"}}>≡</span>
          <div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "14px", color: "var(--paper)", textShadow: "2px 2px 0 rgba(255,0,77,.4)"}}>RESOURCE VAULT</div>
            <div style={{fontSize: "17px", color: "var(--muted)", marginTop: "5px"}}>Every catalogued link by category — {libTotal} shelved in the Steward Library under Industry and Workforce Development</div>
          </div>
        </div>
      </div>

      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", marginBottom: "20px", padding: "16px 18px"}}>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "var(--paper)", marginBottom: "16px", textShadow: "1px 1px 0 rgba(0,0,0,.5)"}}>FILTER VAULT</div>
        
        <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px"}}>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", letterSpacing: ".4px", marginRight: "4px", width: "80px"}}>TRAIL</span>
          {libFilterChips.map((c: any, i: number) => (<React.Fragment key={i}><button onClick={c.onPick} style={c.style}>{c.label}</button></React.Fragment>))}
        </div>

        <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap"}}>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", letterSpacing: ".4px", marginRight: "4px", width: "80px"}}>NODE</span>
          {libNodeChips.map((c: any, i: number) => (<React.Fragment key={i}><button onClick={c.onPick} style={c.style}>{c.label}</button></React.Fragment>))}
        </div>
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
        {libGroups.map((g: any, i: number) => (<React.Fragment key={i}>
          <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", overflow: "hidden"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: g.accent, borderBottom: "4px solid #1c1526"}}>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "#10285e"}}>{g.name}</span>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".7"}}>{g.count} LINKS</span>
            </div>
            <div style={{padding: "14px 16px 16px"}}>
              {g.stops.map((s: any, i: number) => (<React.Fragment key={i}>
                <div style={{marginBottom: "20px"}}>
                  <div style={s.headStyle}>
                    <span style={s.dotStyle}></span>
                    <span style={{flex: "1", minWidth: "0", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "var(--paper)", letterSpacing: ".4px", lineHeight: "1.5"}}>{s.name}</span>
                    <span style={{flex: "0 0 auto", whiteSpace: "nowrap", fontFamily: "'VT323',monospace", fontSize: "17px", color: "#a9c8ff"}}>{s.n} links</span>
                  </div>
                  <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                    {s.links.map((l: any, i: number) => (<React.Fragment key={i}>
                      <div style={l.rowStyle}>
                        <button onClick={l.onToggle} title="Bookmark to My Jobs Shelf" style={l.bmStyle}>{l.bmIcon}</button>
                        <a href={l.url} target="_blank" rel="noopener" style={{flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px", textDecoration: "none"}}>
                          <span style={{fontFamily: "'VT323',monospace", fontSize: "23px", lineHeight: "1.1", color: "var(--paper)"}}>{l.label}</span>
                          <span style={{fontSize: "16px", lineHeight: "1.3", color: "#b7d2f5"}}>{l.about}</span>
                        </a>
                        <span style={{flex: "0 0 auto", minWidth: "0", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "15px", color: "#45d4ff"}}>↗ {l.domain}</span>
                        <span style={{flex: "0 0 auto", padding: "3px 6px", background: "#1d4490", color: "var(--muted)", fontFamily: "'Press Start 2P',monospace", fontSize: "6px", border: "2px solid #1c1526"}}>{l.type}</span>
                      </div>
                    </React.Fragment>))}
                  </div>
                </div>
              </React.Fragment>))}
            </div>
          </div>
        </React.Fragment>))}

        <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", overflow: "hidden"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#45d4ff", borderBottom: "4px solid #1c1526"}}>
            <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "#10285e"}}>EXTERNAL JOB BOARDS</span>
            <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".7"}}>SAVE A SEARCH</span>
          </div>
          <div style={{padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: "8px"}}>
            {libBoards.map((b: any, i: number) => (<React.Fragment key={i}>
              <a href={b.url} target="_blank" rel="noopener" title={b.desc} style={{display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 12px", background: "#10285e", color: "var(--paper)", textDecoration: "none", fontSize: "16px", border: "2px solid #1c1526", boxShadow: "2px 2px 0 rgba(18,12,26,.4)", borderRadius: "5px"}}>↗ {b.label}</a>
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
        <button onClick={onBackShelf} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>◀ Back</button>
        <div style={{flex: "1"}}></div>
        <button onClick={onOpenLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "#d24dff", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>≡ Browse vault</button>
      </div>

      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#163a82", marginBottom: "18px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: "#10285e", borderBottom: "4px solid #1c1526"}}>
          <span style={{width: "34px", height: "34px", background: "#ffdd2e", border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#10285e", flex: "0 0 auto"}}>★</span>
          <div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "14px", color: "var(--paper)", textShadow: "2px 2px 0 rgba(255,0,77,.4)"}}>My Jobs Shelf</div>
            <div style={{fontSize: "17px", color: "var(--muted)", marginTop: "5px"}}>{shelfSub}</div>
          </div>
        </div>
      </div>

      {shelfHasCards && (<>
      <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "12px"}}>♛ MY PATHWAY CARDS</div>
      <div style={{display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px"}}>
        {shelfCards.map((c: any, i: number) => (<React.Fragment key={i}>
          <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "10px", background: "#f2f6ff", overflow: "hidden"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "12px 15px", background: c.accent, borderBottom: "4px solid #1c1526"}}>
              <div style={{minWidth: "0"}}>
                <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "12px", color: "#10285e", textShadow: "2px 2px 0 rgba(255,255,255,.35)", lineHeight: "1.4"}}>{c.klass}</div>
                <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "6.5px", color: "#10285e", opacity: ".72", marginTop: "7px", lineHeight: "1.6"}}>{c.title}</div>
              </div>
              <span style={{flex: "0 0 auto", padding: "6px 9px", background: "#10285e", color: "#ffdd2e", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", border: "3px solid #1c1526", whiteSpace: "nowrap"}}>♛ NODE 7</span>
            </div>
            <div style={{padding: "14px 15px", display: "flex", flexDirection: "column", gap: "10px"}}>
              {c.rows.map((r: any, i: number) => (<React.Fragment key={i}>
                <div style={{display: "flex", alignItems: "center", gap: "11px"}}>
                  <span style={r.dotStyle}>{r.mark}</span>
                  <span style={{flex: "0 0 130px", fontFamily: "'Press Start 2P',monospace", fontSize: "6.5px", color: "#7e2553", letterSpacing: ".3px", lineHeight: "1.6"}}>{r.result}</span>
                  <span style={r.valStyle}>{r.value}</span>
                </div>
              </React.Fragment>))}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", background: "#10285e", borderTop: "4px solid #1c1526"}}>
              <button onClick={c.onView} style={c.viewStyle}>View at Node 7 ▸</button>
              <span style={{flex: "1"}}></span>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "6.5px", color: "#8f88ad", letterSpacing: ".4px"}}>{c.name} TRAIL</span>
            </div>
          </div>
        </React.Fragment>))}
      </div>
      </>)}

      {shelfEmpty && (<>
      <div style={{border: "4px dashed #4a4468", borderRadius: "9px", background: "#163a82", padding: "40px 24px", textAlign: "center"}}>
        <div style={{fontSize: "40px", lineHeight: "1"}}>☆</div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "10px", color: "var(--paper)", marginTop: "14px", lineHeight: "1.6"}}>NOTHING SHELVED YET</div>
        <p style={{margin: "12px auto 0", maxWidth: "400px", fontSize: "18px", lineHeight: "1.4", color: "var(--muted)"}}>Open the Vault and tap the <span style={{color: "#ffdd2e"}}>★</span> on any link to save it here for later.</p>
        <button onClick={onOpenLibrary} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: "18px", padding: "11px 16px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>≡ Open the Vault</button>
      </div>
      </>)}

      {shelfHasCards && (<>
      {shelfHas && (<>
      <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "12px"}}>★ SAVED LINKS</div>
      </>)}
      </>)}

      {shelfHas && (<>
      <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
        {shelfItems.map((l: any, i: number) => (<React.Fragment key={i}>
          <div style={l.rowStyle}>
            <button onClick={l.onToggle} title="Remove from My Jobs Shelf" style={l.bmStyle}>{l.bmIcon}</button>
            <a href={l.url} target="_blank" rel="noopener" style={{flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px", textDecoration: "none"}}>
              <span style={{fontFamily: "'VT323',monospace", fontSize: "23px", lineHeight: "1.1", color: "var(--paper)"}}>{l.label}</span>
              <span style={{fontSize: "16px", lineHeight: "1.3", color: "#b7d2f5"}}>{l.about}</span>
            </a>
            <span style={{flex: "0 0 auto", fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "var(--muted)", whiteSpace: "nowrap"}}>{l.trail}</span>
            <span style={{flex: "0 0 auto", minWidth: "0", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "15px", color: "#45d4ff"}}>↗ {l.domain}</span>
            <span style={{flex: "0 0 auto", padding: "3px 6px", background: "#1d4490", color: "var(--muted)", fontFamily: "'Press Start 2P',monospace", fontSize: "6px", border: "2px solid #1c1526"}}>{l.type}</span>
          </div>
        </React.Fragment>))}
      </div>
      </>)}
    </div>
    </>)}

    {/* ============ NODE 7 · SUMMIT ============ */}
    {showSummit && (<>
    <div data-screen-label="Arcade — Node 7 summit" style={{padding: "16px 18px 36px"}}>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px"}}>
        <button onClick={onBackMap} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "9px 12px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>◀ Back to map</button>
        <div style={{flex: "1"}}></div>
        <span style={{padding: "8px 12px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "8px", letterSpacing: ".4px", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>{summitProgLabel}</span>
      </div>

      <div style={{border: "4px solid #1c1526", boxShadow: "5px 5px 0 rgba(18,12,26,.42)", borderRadius: "9px", background: "#123068", marginBottom: "20px"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "12px 16px", background: "#ffdd2e", borderBottom: "4px solid #1c1526"}}>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "12px", color: "#10285e", textShadow: "2px 2px 0 rgba(255,255,255,.3)"}}>♛ NODE 7 · THE SUMMIT</span>
          <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".72"}}>{pwName}</span>
        </div>
        <p style={{margin: "0", padding: "14px 16px", fontSize: "19px", lineHeight: "1.4", color: "var(--paper)"}}>{summitIntro}</p>
      </div>

      <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: ".5px", marginBottom: "12px"}}>◆ YOUR PICKS — TAP TO CHANGE ANY</div>
      <div style={{display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px"}}>
        {summitChecklist.map((c: any, i: number) => (<React.Fragment key={i}>
          <button onClick={c.onJump} style={c.rowStyle}>
            <span style={c.dotStyle}>{c.mark}</span>
            <span style={{flex: "1", minWidth: "0", textAlign: "left"}}>
              <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", letterSpacing: ".4px"}}>{c.result}</span>
              <span style={c.valStyle}>{c.value}</span>
            </span>
            <span style={c.statusStyle}>{c.statusLabel}</span>
          </button>
        </React.Fragment>))}
      </div>

      {summitLocked && (<>
      <div style={{border: "4px dashed #4a4468", borderRadius: "9px", background: "#163a82", padding: "32px 24px", textAlign: "center"}}>
        <div style={{fontSize: "38px", lineHeight: "1"}}>🔒</div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "11px", color: "var(--paper)", marginTop: "14px", lineHeight: "1.6"}}>{remainingCount} MORE PICK(S) TO UNLOCK</div>
        <p style={{margin: "12px auto 0", maxWidth: "480px", fontSize: "18px", lineHeight: "1.45", color: "var(--muted)"}}>Lock in a pick at each node — tap a node above or walk the map. Still need: <span style={{color: "#ffdd2e"}}>{remainingText}</span></p>
      </div>
      </>)}

      {runComplete && (<>
      <div>
        <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px"}}>
          {summitClaimable && (<>
          <button onClick={onClaim} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "13px 18px", background: pwAccent, color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "11px", letterSpacing: ".5px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "4px 4px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>⚑ Claim your pathway card</button>
          <span style={{fontSize: "17px", lineHeight: "1.3", color: "var(--muted)"}}>All picks in — confirm to beat the game.</span>
          </>)}
          {summitDone && (<>
          <button onClick={onPrintCard} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "12px 15px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>🖨 Save / Print card</button>
          <button onClick={onResetRun} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "12px 15px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", letterSpacing: ".4px", textTransform: "uppercase", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>↺ New run</button>
          </>)}
        </div>

        <div className="run-card" style={{position: "relative", maxWidth: "770px", margin: "0 auto", background: "#f2f6ff", border: "5px solid #1c1526", boxShadow: "8px 8px 0 rgba(18,12,26,.42)", borderRadius: "12px", overflow: "hidden"}}>
          {summitDone && (<>
          <div style={{position: "absolute", top: "78px", right: "16px", zIndex: "3", padding: "8px 13px", background: "#ff2e8f", color: "#fff", border: "4px solid #1c1526", fontFamily: "'Press Start 2P',monospace", fontSize: "11px", letterSpacing: ".5px", transform: "rotate(-14deg)", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", animation: "ar-stamp .55s steps(4)"}}>RUN COMPLETE</div>
          </>)}
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "15px 18px", background: pwAccent, borderBottom: "5px solid #1c1526"}}>
            <div style={{minWidth: "0"}}>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "15px", color: "#10285e", textShadow: "2px 2px 0 rgba(255,255,255,.35)", lineHeight: "1.4"}}>{summitKlass}</div>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".72", marginTop: "8px", lineHeight: "1.6"}}>{summitTitle}</div>
            </div>
            <span style={{width: "46px", height: "46px", flex: "0 0 auto", background: "#10285e", color: pwAccent, border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "15px"}}>7</span>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "196px minmax(0,1fr)", gap: "16px", padding: "20px 18px"}}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "14px 10px 12px", background: "linear-gradient(#163a90,#2a55a8)", border: "4px solid #1c1526", boxShadow: "inset 0 0 0 3px #3a68b8"}}>
              <div style={{flex: "1"}}></div>
              <div style={{animation: "ar-bob 1s steps(2) infinite"}}>
                <PixelHero form={charForm} skin={charSkin} outfit={charOutfit} hairStyle={charHairStyle} hairColor={charHairColor} hatColor={charHatColor} hatType={charHatType} gear={charStageGear} style={{width: "150px", height: "196px", display: "block"}} />
              </div>
              <div style={{width: "140px", height: "10px", marginTop: "4px", background: "repeating-linear-gradient(90deg,#c98a3e 0 8px,#a86f2c 8px 16px)", border: "3px solid #1c1526"}}></div>
              <div style={{marginTop: "12px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#a9c8ff", textAlign: "center", lineHeight: "1.9"}}>{charSummary}</div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "10px", minWidth: "0"}}>
              {cardStatRows.map((r: any, i: number) => (<React.Fragment key={i}>
                <div style={{display: "flex", alignItems: "center", gap: "11px", padding: "9px 11px", background: "#fff", border: "3px solid #1c1526", borderRadius: "7px"}}>
                  <span style={r.dotStyle}>{r.mark}</span>
                  <span style={{flex: "1", minWidth: "0"}}>
                    <span style={{display: "block", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#5566a0", letterSpacing: ".4px", lineHeight: "1.5"}}>{r.result}</span>
                    <span style={r.valStyle}>{r.value}</span>
                  </span>
                </div>
              </React.Fragment>))}
            </div>
          </div>
          <div style={{padding: "15px 18px", background: "#10285e", borderTop: "5px solid #1c1526"}}>
            <div style={{fontSize: "18px", lineHeight: "1.45", color: "#f2f6ff"}}>{summitCloser}</div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "6.5px", color: "#8f88ad", letterSpacing: ".4px", marginTop: "11px", lineHeight: "1.7"}}>STEWARD OS · WORKFORCE DEVELOPMENT · {pwName} TRAIL</div>
          </div>
        </div>
      </div>
      </>)}
    </div>
    </>)}

  </div>
  </div>

  {/* ============ READER DIALOG ============ */}
  {popupOpen && (<>
    <div style={{position: "fixed", inset: "0", zIndex: "70", background: "rgba(10,8,20,.72)"}} onClick={onClosePopup}></div>
    <div data-screen-label="Arcade — field notes dialog" style={{position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: "75", width: "min(1020px,95vw)", height: "min(720px,92vh)", background: "#123068", border: "5px solid #1c1526", borderRadius: "12px", boxShadow: "0 0 0 3px #3a3357,10px 10px 0 rgba(0,0,0,.35)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "ar-pop .18s steps(3)"}} onClick={stop}>
      {showScan && (<>
      <div style={{position: "absolute", inset: "0", pointerEvents: "none", zIndex: "60", background: "repeating-linear-gradient(to bottom,rgba(0,0,0,.07) 0 1px,transparent 1px 3px)", mixBlendMode: "multiply"}}></div>
      <div style={{position: "absolute", inset: "0", pointerEvents: "none", zIndex: "60", boxShadow: "inset 0 0 90px 6px rgba(0,0,0,.28)"}}></div>
      </>)}
      <div style={{flex: "0 0 auto", display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", background: popColor, borderBottom: "4px solid #1c1526"}}>
        {(() => {
          const stepIndex = orderedStops.findIndex((s: any) => s.name === popStopName);
          const computedStep = stepIndex >= 0 ? stepIndex + 1 : "?";
          return <span style={{width: "34px", height: "34px", background: "#10285e", color: popColor, border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "13px", flex: "0 0 auto"}}>{computedStep}</span>;
        })()}
        <div style={{flex: "1", minWidth: "0"}}>
          <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "12px", color: "#10285e", lineHeight: "1.4"}}>{popStopName}</div>
        </div>
        <button onClick={onClosePopup} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", width: "32px", height: "32px", background: "#10285e", color: popColor, border: "3px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "11px", flex: "0 0 auto"}}>✕</button>
      </div>
      <div style={{flex: "1", minHeight: "0", display: "flex"}}>
        <div className="arc-scroll" style={{flex: "0 0 300px", minWidth: "0", overflowY: "auto", padding: "16px 14px", background: "#0f2a60", borderRight: "4px solid #1c1526"}}>
          <p style={{margin: "0 0 14px", fontSize: "18px", lineHeight: "1.35", color: "#e6f0ff"}}>{popBlurb}</p>
          <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: popColor, letterSpacing: ".5px", marginBottom: "11px"}}>FIELD NOTES · {popEntryCount}</div>
          <div style={{display: "flex", flexDirection: "column", gap: "9px"}}>
            {popEntryList.map((e: any, i: number) => {
              const isActive = e.t === popTitle;
              const bStyle = {
                all: "unset", cursor: "pointer", boxSizing: "border-box", display: "block", width: "100%", padding: "11px 12px", fontSize: "18px", lineHeight: 1.2, border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px",
                background: isActive ? popColor : "#f2f6ff",
                color: "#10285e"
              } as any;
              return (<React.Fragment key={i}>
                <button onClick={e.onPick} style={bStyle}><span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", marginRight: "8px"}}>{e.num}</span>{e.t}</button>
              </React.Fragment>);
            })}
          </div>
        </div>
        <div className="arc-scroll" style={{flex: "1", minWidth: "0", overflowY: "auto", padding: "22px 26px 34px"}}>
          <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: popColor, letterSpacing: ".5px"}}>{popType}</div>
          <div style={{display: "inline-block", marginTop: "10px", padding: "5px 10px", background: "#0f2a60", border: "3px solid #1c1526", fontSize: "17px", color: "#a9c8ff"}}>{popSub}</div>
          <h2 style={{fontFamily: "'Press Start 2P',monospace", fontSize: "19px", lineHeight: "1.5", color: "var(--paper)", margin: "14px 0 0", textShadow: "2px 2px 0 rgba(0,0,0,.5)"}}>{popTitle}</h2>
          {popImages && popImages.length > 0 && (<>
          <div style={{margin: "18px 0 4px", display: "flex", flexDirection: "column", gap: "10px"}}>
            {popImages.map((img: any, idx: number) => (
              <img key={idx} src={typeof img === 'string' ? img : (img?.url || '')} alt={typeof img === 'string' ? '' : (img?.caption || '')} style={{width: "100%", height: "auto", borderRadius: "8px", border: "4px solid #1c1526"}} />
            ))}
          </div>
          </>)}
          {(!popImages || popImages.length === 0) && (<>
          <div style={{margin: "18px 0 4px", height: "170px", border: "4px solid #1c1526", background: "repeating-linear-gradient(45deg,#0f2a60 0 12px,#1b3f88 12px 24px)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{padding: "6px 12px", background: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#a9c8ff", letterSpacing: ".5px", textAlign: "center", maxWidth: "80%"}}>{popMedia || 'NO SIGNAL'}</span>
          </div>
          </>)}
          {popParas && popParas.length > 0 && (<>
          {popParas.map((p: any, i: number) => (<React.Fragment key={i}>
            <p style={{margin: "14px 0 0", fontSize: "20px", lineHeight: "1.4", color: "var(--paper)"}} dangerouslySetInnerHTML={{ __html: p.text || p }} />
          </React.Fragment>))}
          </>)}
          <div style={{marginTop: "20px", border: "3px solid #1c1526", background: "#0f2a60"}}>
            {popFacts.map((f: any, i: number) => (<React.Fragment key={i}>
              <div style={{display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", padding: "9px 14px", borderBottom: "2px solid #10285e"}}>
                <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#a9c8ff", letterSpacing: ".3px", lineHeight: "1.7"}}>{f.k}</span>
                <span style={{fontSize: "18px", color: "var(--paper)", lineHeight: "1.3"}}>{f.v}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={{marginTop: "16px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#a9c8ff", letterSpacing: ".5px"}}>SOURCES ↗</div>
          <div style={{display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px"}}>
            {popSrcs.map((s: any, i: number) => (<React.Fragment key={i}>
              <a href={s.url} target="_blank" rel="noopener" style={{display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 11px", background: "#10285e", color: "#45d4ff", textDecoration: "none", fontSize: "16px", border: "2px solid #1c1526", boxShadow: "2px 2px 0 rgba(18,12,26,.4)", borderRadius: "5px"}}>↗ {s.label}</a>
            </React.Fragment>))}
          </div>

          {popHasQuiz && (<>
          <div style={{marginTop: "24px", border: "4px solid #1c1526", boxShadow: "4px 4px 0 rgba(18,12,26,.42)", borderRadius: "8px", overflow: "hidden"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "11px 14px", background: popColor}}>
              <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "9px", color: "#10285e", letterSpacing: ".3px"}}>⚡ YOUR MISSION PICK</span>
              <span style={quizStatusStyle}>{quizStatusLabel}</span>
            </div>
            <div style={{padding: "15px 16px", background: "#0f2a60"}}>
              <div style={{fontSize: "22px", lineHeight: "1.3", color: "var(--paper)", marginBottom: "5px"}}>{quizPrompt}</div>
              <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: popColor, letterSpacing: ".4px", marginBottom: "13px"}}>{quizPickLabel}</div>
              <div style={{display: "flex", flexDirection: "column", gap: "9px"}}>
                {quizOptions.map((o: any, i: number) => (<React.Fragment key={i}>
                  <button onClick={o.onPick} style={o.style}>
                    <span style={o.dotStyle}>{o.tick}</span>
                    <span style={{flex: "1", minWidth: "0"}}>
                      <span style={{display: "block", fontFamily: "'VT323',monospace", fontSize: "22px", lineHeight: "1.15", color: "var(--paper)"}}>{o.label}</span>
                      {o.hasSub && (<><span style={{display: "block", fontSize: "16px", lineHeight: "1.25", color: "var(--muted)", marginTop: "2px"}}>{o.sub}</span></>)}
                    </span>
                  </button>
                </React.Fragment>))}
              </div>
              {quizAllowCustom && (<>
              <div style={{marginTop: "13px"}}>
                <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "var(--muted)", letterSpacing: ".4px", marginBottom: "8px"}}>✍ OR WRITE YOUR OWN</div>
                <input className="arc" value={quizCustom} onInput={onQuizCustom} onBlur={onQuizCustomBlur} placeholder={quizCustomLabel} style={quizCustomStyle}/>
              </div>
              </>)}
              <div style={{display: "flex", alignItems: "center", gap: "11px", flexWrap: "wrap", marginTop: "15px", paddingTop: "14px", borderTop: "3px dashed #2656a4"}}>
                {quizAnswered && (<>
                <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "#12f0c0", letterSpacing: ".4px"}}>✓ SAVED TO YOUR RUN</span>
                <button onClick={onQuizClear} style={quizClearStyle}>Clear</button>
                <div style={{flex: "1"}}></div>
                <button onClick={onQuizToSummit} style={quizSummitBtnStyle}>{quizSummitBtnLabel}</button>
                </>)}
                {quizUnanswered && (<>
                <span style={{fontSize: "16px", lineHeight: "1.3", color: "var(--muted)"}}>{quizHint}</span>
                </>)}
              </div>
            </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  </>)}

  {/* ============ SUGGEST ============ */}
  {suggestOpen && (<>
    <div style={{position: "fixed", inset: "0", zIndex: "80", background: "rgba(10,8,20,.72)"}} onClick={onCloseSuggest}></div>
    <div data-screen-label="Arcade — suggest modal" className="arc-scroll" style={{position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: "85", width: "min(520px,94vw)", maxHeight: "92vh", overflowY: "auto", background: "#163a82", border: "5px solid #1c1526", boxShadow: "12px 12px 0 rgba(0,0,0,.5)", animation: "ar-pop .18s steps(3)"}} onClick={stop}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#ff6a2e", borderBottom: "4px solid #1c1526"}}>
        <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "11px", color: "#10285e"}}>SUGGEST A RESOURCE</span>
        <span style={{fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#10285e", opacity: ".7"}}>LIBRARY</span>
      </div>
      {sgNotDone && (<>
      <div style={{padding: "18px"}}>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", marginBottom: "8px"}}>TITLE</div>
        <input className="arc" value={sgTitle} onInput={onSgTitle} placeholder="Free drone mapping course" style={{width: "100%", padding: "12px", background: "#10285e", color: "var(--paper)", border: "3px solid #1c1526", fontSize: "18px", outline: "none"}}/>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", margin: "14px 0 8px"}}>LINK</div>
        <input className="arc" value={sgUrl} onInput={onSgUrl} placeholder="https://…" style={{width: "100%", padding: "12px", background: "#10285e", color: "var(--paper)", border: "3px solid #1c1526", fontSize: "18px", outline: "none"}}/>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px"}}>
          <div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", marginBottom: "8px"}}>TRAIL</div>
            <select value={sgPathway} onChange={onSgPathway} style={{width: "100%", padding: "11px", background: "#10285e", color: "var(--paper)", border: "3px solid #1c1526", fontSize: "16px"}}>
              <option value="creator">Content Creator</option><option value="enviro">Environmental</option>
            </select>
          </div>
          <div>
            <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", marginBottom: "8px"}}>TYPE</div>
            <select value={sgType} onChange={onSgType} style={{width: "100%", padding: "11px", background: "#10285e", color: "var(--paper)", border: "3px solid #1c1526", fontSize: "16px"}}>
              <option>Article</option><option>Tool</option><option>Program</option><option>Course</option><option>Job posting</option><option>Video</option>
            </select>
          </div>
        </div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "8px", color: "var(--muted)", margin: "14px 0 8px"}}>NOTE</div>
        <textarea className="arc" value={sgNote} onInput={onSgNote} placeholder="What is this and why does it matter?" rows={3} style={{width: "100%", padding: "12px", background: "#10285e", color: "var(--paper)", border: "3px solid #1c1526", fontSize: "18px", outline: "none", resize: "vertical"}} ></textarea>
        <div style={{display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px"}}>
          <button onClick={onCloseSuggest} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "12px 16px", background: "var(--panel)", color: "var(--paper)", fontFamily: "'Press Start 2P',monospace", fontSize: "9px", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>CANCEL</button>
          <button onClick={onSubmitSuggest} style={sgSubmitStyle}>SUBMIT</button>
        </div>
      </div>
      </>)}
      {sgDone && (<>
      <div style={{padding: "40px 26px", textAlign: "center"}}>
        <div style={{width: "52px", height: "52px", margin: "0 auto 14px", background: "#12f0c0", color: "#10285e", border: "4px solid #1c1526", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "18px"}}>✓</div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "12px", color: "var(--paper)"}}>QUEST LOGGED!</div>
        <p style={{margin: "12px auto 0", maxWidth: "320px", fontSize: "18px", lineHeight: "1.35", color: "var(--muted)"}}>A steward reviews every suggestion. If approved it's catalogued in the Steward Library under Industry and Workforce Development, tagged for your trail.</p>
        <button onClick={onCloseSuggest} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: "18px", padding: "12px 20px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "10px", border: "3px solid #1c1526", boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "7px"}}>DONE</button>
      </div>
      </>)}
    </div>
  </>)}

  {/* ============ CELEBRATION ============ */}
  {celebrating && (<>
    <div onClick={onDismissCeleb} style={{position: "fixed", inset: "0", zIndex: "95", background: "rgba(10,8,20,.62)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
      {confettiEl}
      <div style={{position: "relative", zIndex: "2", textAlign: "center", padding: "24px"}}>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "34px", color: "#ffdd2e", letterSpacing: "1px", textShadow: "4px 4px 0 #ff2e8f,0 0 24px rgba(255,221,46,.6)", animation: "ar-stamp .55s steps(4)"}}>★ RUN COMPLETE ★</div>
        <div style={{fontFamily: "'Press Start 2P',monospace", fontSize: "12px", color: "#12f0c0", marginTop: "20px", lineHeight: "1.7", animation: "ar-shine 1s steps(2) infinite"}}>YOU BUILT YOUR WORKFORCE PATHWAY!</div>
        <button onClick={onDismissCeleb} style={{all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: "26px", padding: "13px 22px", background: "#ffdd2e", color: "#10285e", fontFamily: "'Press Start 2P',monospace", fontSize: "11px", letterSpacing: ".5px", border: "3px solid #1c1526", boxShadow: "4px 4px 0 rgba(18,12,26,.5)", borderRadius: "7px"}}>SEE MY CARD ▸</button>
      </div>
    </div>
  </>)}
</div>



</>);
}