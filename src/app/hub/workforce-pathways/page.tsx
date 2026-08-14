
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ModernTheme from './components/ModernTheme';
import ArcadeTheme from './components/ArcadeTheme';
import { useUser } from '@clerk/nextjs';
import { PATHWAYS as INITIAL_PATHWAYS } from '@/data/workforce-content';
import { fetchWorkforceInitialData, fetchWorkforceCounts, fetchPublishedEntries, fetchWorkforceStructure, fetchWorkforceJobs, fetchExternalBoards, submitSuggestion, submitJobSuggestion, getArcadeAvatar, saveArcadeAvatar, fetchAllWorkforceEntries, fetchAllQuizzes, fetchAllSummits, fetchUserPicks, saveUserPick } from '@/app/admin/workforce-pathways/actions';
import { toggleBookmark as toggleDbBookmark, fetchUserBookmarks } from '@/app/actions/bookmarks';
import { QUIZZES, SUMMITS } from '@/data/workforce-content';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function WorkforcePathwaysContent() {
  const searchParams = useSearchParams();
  const nodeParam = searchParams.get('node');
  const jobsParam = searchParams.get('jobs');
  const pathParam = searchParams.get('path');

  const { user, isLoaded } = useUser();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!isLoaded || !user) return;
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            setIsAdminUser(true);
          }
          if (profile?.id) {
            setProfileId(profile.id);
          }
        }
      } catch (e) {}
    }
    checkRole();
  }, [isLoaded, user]);

  const [role, setRole] = useState('explorer');
  const [introExpanded, setIntroExpanded] = useState(true);
  const [pathway, setPathway] = useState<string | null>(null);
  const [stopId, setStopId] = useState<string | null>(null);
  const [entryIdx, setEntryIdx] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sgDone, setSgDone] = useState(false);
  const [claimedRuns, setClaimedRuns] = useState<Record<string, boolean>>({});

  const [initialScreen, setInitialScreen] = useState<'main' | 'quests' | 'library'>('main');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('awf_claimed_runs');
      if (saved) setClaimedRuns(JSON.parse(saved));
    } catch(e) {}
    
    // Deep linking for bookmarks via useSearchParams (done declaratively instead)
  }, []);

  useEffect(() => {
    if (nodeParam) {
      setRole('steward');
      setLibNode(nodeParam);
      setInitialScreen('library');
    }
    if (jobsParam === 'true') {
      setInitialScreen('quests');
      setRole('steward');
    }
  }, [nodeParam, jobsParam]);

  useEffect(() => {
    if (pathParam) {
      setPathway(pathParam);
    }
  }, [pathParam]);

  const claimRun = (pwId: string) => {
    const next = { ...claimedRuns, [pwId]: true };
    setClaimedRuns(next);
    localStorage.setItem('awf_claimed_runs', JSON.stringify(next));
  };
  
  const resetRun = (pwId: string) => {
    // Optionally delete picks from DB here, but for now just unclaim
    const next = { ...claimedRuns };
    delete next[pwId];
    setClaimedRuns(next);
    localStorage.setItem('awf_claimed_runs', JSON.stringify(next));
  };
  const [catalog, setCatalog] = useState<any[]>(INITIAL_PATHWAYS);
  const [publishedEntries, setPublishedEntries] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [externalBoards, setExternalBoards] = useState<any[]>([]);
  const [counts, setCounts] = useState({ noteCount: 0, waypointCount: 0, jobsCount: 0, stopCounts: {} as Record<string, number> });
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [libFilter, setLibFilter] = useState('all');
  const [libNode, setLibNode] = useState('all');
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [jobBookmarks, setJobBookmarks] = useState<Record<string, boolean>>({});
  const [boardBookmarks, setBoardBookmarks] = useState<Record<string, boolean>>({});
  const [fieldNoteBookmarks, setFieldNoteBookmarks] = useState<Record<string, boolean>>({});
  const [isSubmittingJobBookmark, setIsSubmittingJobBookmark] = useState<string | null>(null);
  const [isSubmittingBookmark, setIsSubmittingBookmark] = useState<string | null>(null);
  const [isSubmittingBoardBookmark, setIsSubmittingBoardBookmark] = useState<string | null>(null);
  const [isSubmittingFieldNoteBookmark, setIsSubmittingFieldNoteBookmark] = useState<string | null>(null);
  const [initialAvatar, setInitialAvatar] = useState<any>(null);

  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [dbSummits, setDbSummits] = useState<any[]>([]);
  const [dbUserPicks, setDbUserPicks] = useState<any[]>([]);
  const [pickCustoms, setPickCustoms] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Fetch avatar, bookmarks, and picks in parallel
      Promise.all([
        getArcadeAvatar(user.id),
        fetchUserBookmarks('workforce'),
        fetchUserPicks(user.id)
      ]).then(([avatarData, bmData, picksData]) => {
        if (avatarData) {
          setInitialAvatar({
            form: avatarData.form,
            skin: avatarData.skin,
            outfit: avatarData.outfit,
            hairStyle: avatarData.hair_style,
            hairColor: avatarData.hair_color,
            hatType: avatarData.hat_type,
            hatColor: avatarData.hat_color,
            gear: avatarData.gear
          });
        }
        const bm: Record<string, boolean> = {};
        const jbm: Record<string, boolean> = {};
        const bbm: Record<string, boolean> = {};
        const fbm: Record<string, boolean> = {};
        bmData.forEach((b: any) => {
          if (b.item_id) {
            // Separate job bookmarks from resource bookmarks by title prefix
            if (b.title && b.title.startsWith('Job:')) {
              jbm[b.item_id] = true;
            } else if (b.title && b.title.startsWith('Board:')) {
              bbm[b.item_id] = true;
            } else if (b.title && b.title.startsWith('Workforce Session:')) {
              fbm[b.item_id] = true;
            } else {
              bm[b.item_id] = true;
            }
          }
        });
        setBookmarks(bm);
        setJobBookmarks(jbm);
        setBoardBookmarks(bbm);
        setFieldNoteBookmarks(fbm);
        setDbUserPicks(picksData || []);
        setDataLoaded(true);
      });
    } else if (isLoaded) {
      setDataLoaded(true);
    }
  }, [user?.id, isLoaded]);
  const onSaveAvatar = async (avatarData: any) => {
    if (user?.id) {
      await saveArcadeAvatar(user.id, avatarData);
    }
  };
  // Suggestion state
  const [sgTitle, setSgTitle] = useState('');
  const [sgUrl, setSgUrl] = useState('');
  const [sgPathway, setSgPathway] = useState('creator');
  const [sgType, setSgType] = useState('Article');
  const [sgStop, setSgStop] = useState('terrain');
  const [sgNote, setSgNote] = useState('');
  const [sgContributor, setSgContributor] = useState('anonymous');

  const pwIsCreator = pathway === 'creator';
  const pwIsEnviro = pathway === 'enviro';
  
  // Stubs for missing handlers
  const onSgTitle = (e: any) => setSgTitle(e.target.value);
  const onSgUrl = (e: any) => setSgUrl(e.target.value);
  const onSgPathway = (e: any) => setSgPathway(e.target.value);
  const onSgType = (e: any) => setSgType(e.target.value);
  const onSgStop = (e: any) => setSgStop(e.target.value);
  const onSgNote = (e: any) => setSgNote(e.target.value);
  const onSgContributor = (e: any) => setSgContributor(e.target.value);
  const popShelf = 'Industry & Work';
  useEffect(() => {
    fetchWorkforceInitialData().then((data) => {
      const { structure, counts: resCounts, jobs: resJobs, boards, entries, quizzes, summits } = data;
      
      const newCatalog = INITIAL_PATHWAYS.map(p => {
        const dbP = structure.pathways.find((x: any) => x.id === p.id);
        return {
           ...p,
           intro: dbP ? dbP.intro : p.intro,
           stops: p.stops.map(s => {
              const dbS = structure.stops.find((x: any) => x.id === s.id);
              return {
                 ...s,
                 blurb: dbS ? dbS.blurb : s.blurb,
              }
           })
        };
      });
      setCatalog(newCatalog);
      
      setCounts({
          noteCount: resCounts.creatorCount + resCounts.enviroCount,
          waypointCount: INITIAL_PATHWAYS[0].stops.length + INITIAL_PATHWAYS[1].stops.length,
          jobsCount: resCounts.jobsCount,
          stopCounts: resCounts.stopCounts
      });
      
      setJobs(resJobs || []);
      setExternalBoards(boards || []);
      setAllEntries(entries || []);
      setDbQuizzes(quizzes || []);
      setDbSummits(summits || []);
    });
  }, []);

  useEffect(() => {
    if (pathway && stopId) {
      fetchPublishedEntries(pathway, stopId).then(entries => {
        setPublishedEntries(entries || []);
      });
    }
  }, [pathway, stopId]);

  // Derived state & helpers
  const pw = catalog.find(p => p.id === pathway) || null;
  const otherPw = pw ? catalog.find(p => p.id !== pw.id) : null;
  const popStop = pw && stopId ? pw.stops.find(sp => sp.id === stopId) : null;
  const _popEntry = publishedEntries[Math.min(entryIdx, Math.max(0, publishedEntries.length - 1))] || null;
  const popEntry = _popEntry ? {
    ..._popEntry,
    isBookmarked: !!fieldNoteBookmarks[`/hub/workforce-pathways?entry=${_popEntry.id}`],
    onToggleBookmark: () => toggleFieldNoteBookmark(_popEntry)
  } : null;

  const countNotes = (p: any) => {
     if (!p) return 0;
     let sum = 0;
     p.stops.forEach((s: any) => {
         sum += counts.stopCounts[s.id] || 0;
     });
     return sum;
  };

  const isSteward = role === 'steward';
  const isExplorer = role === 'explorer';
  const waypointCount = counts.waypointCount;
  const noteCount = counts.noteCount;
  const jobCount = counts.jobsCount;
  const introToggleLabel = introExpanded ? "Hide intro ˄" : "Show intro ˅";
  
  const showTrailhead = !pathway;
  const entryIsCrossroads = false;
  const entryIsMaps = true;
  const showPathway = !!pw;
  
  const pwColor = pw ? pw.color : "#6B4A2A";
  const pwMark = pw ? pw.mark : "";
  const pwName = pw ? pw.name : "";
  const pwShelf = pw ? pw.shelf : "";
  const pwIntro = pw ? pw.intro : "";
  const pwTag = pw ? pw.tag : "";
  const otherPwName = otherPw ? otherPw.name : "";
  const pwJobs = jobs.filter(j => j.pathway_id === pathway);
  const pwJobCount = pwJobs.length;
  const showJobs = true;

  const [jobFilter, setJobFilter] = useState('CREATOR');
  const [theme, setTheme] = useState<'modern' | 'arcade'>('arcade');

  const filteredJobs = jobFilter === 'ALL' ? jobs : jobs.filter(j => 
    (jobFilter === 'CREATOR' && j.pathway_id === 'creator') ||
    (jobFilter === 'ENVIRO' && j.pathway_id === 'enviro')
  );

  const jobRows = filteredJobs.map(j => {
    const timeAgo = (date: string) => {
      const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return '1 day ago';
      if (days < 7) return `${days} days ago`;
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    };
    const isCreatorJob = j.pathway_id === 'creator';
    const url = j.apply_url;
    const isBookmarked = !!jobBookmarks[url];
    const isSubmitting = isSubmittingJobBookmark === url;
    return {
      title: j.title,
      kind: j.job_type,
      org: j.organization,
      place: j.location,
      url: url,
      posted: timeAgo(j.created_at),
      note: j.description || "",
      tagLabel: isCreatorJob ? "CREATOR" : "ENVIRO",
      tagColor: isCreatorJob ? "#ff6a2e" : "#45d4ff",
      isBookmarked,
      isSubmitting,
      bmIcon: isSubmitting ? '⏳' : (isBookmarked ? '★' : '☆'),
      onToggleBookmark: () => toggleJobBookmark({ title: j.title, org: j.organization, url: url })
    };
  });

  const getChipStyle = (isActive: boolean) => ({
    all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "6px 12px",
    background: isActive ? "#ffdd2e" : "#2656a4",
    color: isActive ? "#10285e" : "var(--paper)",
    fontFamily: "'Press Start 2P',monospace", fontSize: "7px", letterSpacing: ".4px",
    border: "2px solid #1c1526", borderRadius: "5px", boxShadow: isActive ? "2px 2px 0 rgba(18,12,26,.4)" : "none"
  });

  const jobFilterChips = [
    { label: "CREATOR", n: jobs.filter(j => j.pathway_id === 'creator').length, style: getChipStyle(jobFilter === 'CREATOR'), onPick: () => setJobFilter('CREATOR') },
    { label: "ENVIRO", n: jobs.filter(j => j.pathway_id === 'enviro').length, style: getChipStyle(jobFilter === 'ENVIRO'), onPick: () => setJobFilter('ENVIRO') },
    { label: "ALL", n: jobs.length, style: getChipStyle(jobFilter === 'ALL'), onPick: () => setJobFilter('ALL') },
    { label: "BOARDS", n: externalBoards.length, style: getChipStyle(jobFilter === 'BOARDS'), onPick: () => setJobFilter('BOARDS') }
  ];

  const activePathwayId = pathway === 'creator' ? 'creator' : 'enviro';
  const boardRows = externalBoards.map((b: any) => ({
    label: b.label, url: b.url, desc: b.description,
    isBookmarked: !!boardBookmarks[b.url],
    isSubmitting: isSubmittingBoardBookmark === b.url,
    bmIcon: isSubmittingBoardBookmark === b.url ? '⏳' : (boardBookmarks[b.url] ? '★' : '☆'),
    onToggleBookmark: () => toggleBoardBookmark({ label: b.label, url: b.url })
  }));
  const boardChips = externalBoards.map(b => ({
    label: b.label,
    url: b.url,
    desc: b.description,
    isBookmarked: !!boardBookmarks[b.url],
    isSubmitting: isSubmittingBoardBookmark === b.url,
    bmIcon: isSubmittingBoardBookmark === b.url ? '⏳' : (boardBookmarks[b.url] ? '★' : '☆'),
    onToggleBookmark: () => toggleBoardBookmark({ label: b.label, url: b.url })
  }));
  const footTag = pw ? pw.tag : "*Content Creator Resource · *Environmental Career Resource";
  
  const atlasIsTrail = true;
  const atlasIsBasecamp = false;
  
  // Data for iterators
  const creator = catalog.find(p => p.id === "creator");
  const enviro = catalog.find(p => p.id === "enviro");
  const creatorTipMeta = (creator ? countNotes(creator) : 0) + " field notes · WALK THIS TRAIL ›";
  const enviroTipMeta = (enviro ? countNotes(enviro) : 0) + " field notes · WALK THIS TRAIL ›";

  const mapCards = [creator, enviro].filter(Boolean).map(p => ({
      onPick: () => setPathway(p.id),
      color: p.color, mark: p.mark, name: p.name, shelf: p.shelf, tagline: p.tagline,
      meta: p.stops.length + " waypoints · " + countNotes(p) + " field notes",
      id: p.id,
      waypoints: p.stops.length,
      notes: countNotes(p)
  }));

  const posMap = { terrain: [10, 16], portfolio: [42, 36], story: [21, 74], tools: [62, 70], hiring: [85, 20], mesa: [81, 84] };
  const atlasNodes = pw ? pw.stops.map(sp => {
      const pos = posMap[sp.id as keyof typeof posMap] || [50, 50];
      const big = sp.id === "portfolio";
      return {
        onOpen: () => { setStopId(sp.id); setEntryIdx(0); },
        posStyle: { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, position: 'absolute', left: pos[0] + '%', top: pos[1] + '%', transform: 'translate(-50%,-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '170px' },
        discSize: big ? "72px" : "56px",
        markSize: big ? "30px" : "22px",
        color: sp.color, mark: sp.mark, name: sp.name, mesa: !!sp.mesa,
        blurb: sp.blurb,
        meta: (counts.stopCounts[sp.id] || 0) + " field notes" + (big ? " · the through-line" : "")
      };
  }) : [];

  const sx = (v: number) => +(v * 1.9).toFixed(2);
  const edgeDefs = [
      ["terrain","portfolio",1],["portfolio","story",1],["portfolio","tools",1],
      ["portfolio","hiring",1],["portfolio","mesa",1],
      ["story","tools",0],["tools","hiring",0],["mesa","tools",0],["terrain","mesa",0]
  ];
  const atlasEdges = pw ? edgeDefs.filter(d => posMap[d[0] as keyof typeof posMap] && posMap[d[1] as keyof typeof posMap]).map(d => {
      const a = posMap[d[0] as keyof typeof posMap], b = posMap[d[1] as keyof typeof posMap], primary = d[2] === 1;
      return {
        x1: sx(a[0]), y1: a[1], x2: sx(b[0]), y2: b[1],
        stroke: primary ? pw.color : "#8f6c3f",
        width: primary ? "0.8" : "0.5",
        opacity: primary ? ".55" : ".3",
        dash: primary ? "0" : "1.6 1.8"
      };
  }) : [];

  const popupOpen = !!popStop;
  let popColor = popStop ? popStop.color : "#6B4A2A";
  
  // In Arcade Theme, node colors follow a specific progression step array
  const STEP = ["#ff2e8f", "#ff6a2e", "#ffdd2e", "#12f0c0", "#45d4ff", "#d24dff", "#e05cf0"];
  if (theme === 'arcade' && pw && popStop) {
    const stepIndex = pw.stops.findIndex((s: any) => s.id === stopId);
    if (stepIndex >= 0 && STEP[stepIndex]) {
      popColor = STEP[stepIndex];
    }
  }

  const popMark = popStop ? popStop.mark : "";
  const popStopName = popStop ? popStop.name : "";
  const popBlurb = popStop ? popStop.blurb : "";
  const popEntryCount = publishedEntries.length;
  const popEntryList = publishedEntries.map((e, i) => {
    const isBookmarked = !!fieldNoteBookmarks[`/hub/workforce-pathways?entry=${e.id}`];
    return {
      id: e.id,
      t: e.title, s: e.subtitle, num: (i + 1 < 10 ? "0" : "") + (i + 1),
      isBookmarked,
      onToggleBookmark: () => toggleFieldNoteBookmark(e),
      onPick: () => setEntryIdx(i),
      style: { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, display: 'block', width: '100%', padding: '12px 14px', borderRadius: '11px', border: '1.5px solid ' + (i === entryIdx ? popColor : 'rgba(60,42,24,.16)'), background: i === entryIdx ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.45)', boxShadow: i === entryIdx ? '0 6px 16px -10px rgba(36,31,23,.5)' : 'none' }
    };
  });

  const popCall = popEntry ? popEntry.call_no : "";
  const popType = popEntry ? popEntry.type : "";
  const popSub = popEntry ? popEntry.subtitle : "";
  const popTitle = popEntry ? popEntry.title : "";
  const popMedia = popEntry ? popEntry.media_fallback : "";
  const popImages = popEntry ? (popEntry.images || popEntry.photos || []) : [];
  const popParas = popEntry ? [{ text: popEntry.body_html }] : []; // Just dump body_html, we can use dangerouslySetInnerHTML later
  const popFacts = popEntry ? (popEntry.facts || []).map(x => ({ k: x[0], v: x[1] })) : [];
  const popSrcs = popEntry ? (popEntry.sources || []).map(x => ({ label: x[0], url: x[1] })) : [];

  const sgNotDone = !sgDone;
  const canSubmit = sgTitle.trim() && sgUrl.trim();
  const sgSubmitStyle = { all: 'unset' as any, cursor: canSubmit ? 'pointer' : 'not-allowed', boxSizing: 'border-box' as any, padding: '12px 20px', borderRadius: '10px', font: "800 13px/1 'Exo'", color: '#fff', background: canSubmit ? '#2E5534' : '#9aa596', boxShadow: canSubmit ? '0 8px 18px -8px rgba(46,85,52,.7)' : 'none' };

  const onRoleExplorer = () => setRole('explorer');
  const onRoleSteward = () => setRole('steward');
  const onToggleIntro = () => setIntroExpanded(!introExpanded);
  const onOpenSuggest = () => { setSuggestOpen(true); setSgDone(false); };
  const onCloseSuggest = () => { setSuggestOpen(false); setSgTitle(''); setSgUrl(''); setSgNote(''); setSgContributor('anonymous'); setSgSubmitting(false); };
  const [sgSubmitting, setSgSubmitting] = useState(false);
  const onSubmitSuggest = async () => { 
    if (canSubmit && !sgSubmitting) {
      setSgSubmitting(true);
      try {
        await submitSuggestion({
          title: sgTitle,
          url: sgUrl,
          pathway_id: sgPathway,
          stop_id: sgStop,
          type: sgType,
          note: sgNote,
          contributor: sgContributor,
          submitter_profile_id: profileId || undefined
        });
        setSgDone(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSgSubmitting(false);
      }
    } 
  };
  const onPickCreator = () => setPathway('creator');
  const onPickEnviro = () => setPathway('enviro');
  const onBackTrailhead = () => { setPathway(null); setStopId(null); };
  const onSwitchPathway = () => { if (otherPw) setPathway(otherPw.id); setStopId(null); };
  const onClosePopup = () => setStopId(null);
  const stop = (ev: any) => ev.stopPropagation();
  
  const roleExplorerStyle = { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, padding: '7px 13px', borderRadius: '8px', font: "700 9.5px/1 'Courier New', monospace", letterSpacing: '.14em', textTransform: 'uppercase', background: isExplorer ? '#3C2A18' : 'transparent', color: isExplorer ? '#F7EAC4' : '#6b6153', boxShadow: isExplorer ? '0 3px 8px -3px rgba(60,42,24,.6)' : 'none' };
  const roleStewardStyle = { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, padding: '7px 13px', borderRadius: '8px', font: "700 9.5px/1 'Courier New', monospace", letterSpacing: '.14em', textTransform: 'uppercase', background: isSteward ? '#3C2A18' : 'transparent', color: isSteward ? '#F7EAC4' : '#6b6153', boxShadow: isSteward ? '0 3px 8px -3px rgba(60,42,24,.6)' : 'none' };

  
  const pwAccent = pwIsCreator ? '#ff7e40' : (pwIsEnviro ? '#43e97b' : '#ffdd2e');
  
  // ---- RESOURCE VAULT EXTRACTION LOGIC ----
  const domainOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return (u || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]; } };
  
  const toggleBookmark = async (rec: any) => {
    const url = rec.url;
    if (isSubmittingBookmark === url) return;
    setIsSubmittingBookmark(url);
    
    const isBookmarked = !!bookmarks[url];
    
    // Optimistic update - use URL as key
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });

    try {
      await toggleDbBookmark(
        url,  // Use URL as itemId since that's what's stored in database
        'workforce', 
        rec.label || rec.title || `Workforce Resource`,
        url,
        rec.nodeId
      );
      
      // Refetch bookmarks to sync state with database (only resource bookmarks, not jobs)
      const bmData = await fetchUserBookmarks('workforce');
      const bm: Record<string, boolean> = {};
      bmData.forEach((b: any) => {
        if (b.item_id && !(b.title && b.title.startsWith('Job:'))) {
          bm[b.item_id] = true;
        }
      });
      setBookmarks(bm);
      
      // Show success message
      if (!isBookmarked) {
        toast.success('Bookmark request submitted! Awaiting admin approval.');
      } else {
        toast.success('Bookmark removed.');
      }
    } catch (err) {
      toast.error('Failed to save bookmark.');
      // Revert if failed
      setBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[url] = true;
        else delete next[url];
        return next;
      });
    } finally {
      setIsSubmittingBookmark(null);
    }
  };

  const toggleJobBookmark = async (job: any) => {
    const url = job.url;
    if (!url) return;
    
    // Prevent double-click
    if (isSubmittingJobBookmark === url) return;
    setIsSubmittingJobBookmark(url);
    
    const isBookmarked = !!jobBookmarks[url];
    
    // Optimistic update
    setJobBookmarks(prev => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });

    try {
      await toggleDbBookmark(
        url,
        'workforce',
        `Job: ${job.title} at ${job.org}`,
        url
      );
      
      // Refetch to sync - only get job bookmarks (title starts with "Job:")
      const bmData = await fetchUserBookmarks('workforce');
      const jbm: Record<string, boolean> = {};
      bmData.forEach((b: any) => {
        if (b.item_id && b.title && b.title.startsWith('Job:')) {
          jbm[b.item_id] = true;
        }
      });
      setJobBookmarks(jbm);
      
      if (!isBookmarked) {
        toast.success('Job bookmark submitted! Awaiting admin approval.', { id: `job-bm-${url}`, position: 'bottom-center' });
      } else {
        toast.success('Job bookmark removed.', { id: `job-bm-${url}`, position: 'bottom-center' });
      }
    } catch (err) {
      toast.error('Failed to save job bookmark.', { id: `job-bm-error-${url}`, position: 'bottom-center' });
      // Revert
      setJobBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[url] = true;
        else delete next[url];
        return next;
      });
    } finally {
      setIsSubmittingJobBookmark(null);
    }
  };

  const toggleBoardBookmark = async (board: any) => {
    const url = board.url;
    if (!url) return;
    
    if (isSubmittingBoardBookmark === url) return;
    setIsSubmittingBoardBookmark(url);
    
    const isBookmarked = !!boardBookmarks[url];
    
    // Optimistic update
    setBoardBookmarks(prev => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });

    try {
      await toggleDbBookmark(
        url,
        'workforce',
        `Board: ${board.label}`,
        url
      );
      
      // Refetch to sync - only get board bookmarks (title starts with "Board:")
      const bmData = await fetchUserBookmarks('workforce');
      const bbm: Record<string, boolean> = {};
      bmData.forEach((b: any) => {
        if (b.item_id && b.title && b.title.startsWith('Board:')) {
          bbm[b.item_id] = true;
        }
      });
      setBoardBookmarks(bbm);
      
      if (!isBookmarked) {
        toast.success('Board bookmark submitted! Awaiting admin approval.', { id: `board-bm-${url}`, position: 'bottom-center' });
      } else {
        toast.success('Board bookmark removed.', { id: `board-bm-${url}`, position: 'bottom-center' });
      }
    } catch (err) {
      toast.error('Failed to save board bookmark.', { id: `board-bm-error-${url}`, position: 'bottom-center' });
      // Revert
      setBoardBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[url] = true;
        else delete next[url];
        return next;
      });
    } finally {
      setIsSubmittingBoardBookmark(null);
    }
  };

  const toggleFieldNoteBookmark = async (entry: any) => {
    const url = `/hub/workforce-pathways?entry=${entry.id}`;
    
    if (isSubmittingFieldNoteBookmark === url) return;
    setIsSubmittingFieldNoteBookmark(url);
    
    const isBookmarked = !!fieldNoteBookmarks[url];
    
    // Optimistic update
    setFieldNoteBookmarks(prev => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });

    try {
      await toggleDbBookmark(
        url,
        'workforce',
        `Workforce Session: ${entry.title}`,
        url
      );
      
      // Refetch to sync
      const bmData = await fetchUserBookmarks('workforce');
      const fbm: Record<string, boolean> = {};
      bmData.forEach((b: any) => {
        if (b.item_id && b.title && b.title.startsWith('Workforce Session:')) {
          fbm[b.item_id] = true;
        }
      });
      setFieldNoteBookmarks(fbm);
      
      if (!isBookmarked) {
        toast.success('Session bookmarked!', { id: `session-bm-${url}`, position: 'bottom-center' });
      } else {
        toast.success('Session bookmark removed.', { id: `session-bm-${url}`, position: 'bottom-center' });
      }
    } catch (err) {
      toast.error('Failed to save session bookmark.', { id: `session-bm-error-${url}`, position: 'bottom-center' });
      // Revert
      setFieldNoteBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[url] = true;
        else delete next[url];
        return next;
      });
    } finally {
      setIsSubmittingFieldNoteBookmark(null);
    }
  };

  const bmBtnStyle = (on: boolean, isSubmitting: boolean = false) => ({
    all: 'unset', cursor: isSubmitting ? 'wait' : 'pointer', boxSizing: 'border-box', flex: '0 0 auto', width: '34px', height: '34px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '3px solid #1c1526',
    boxShadow: isSubmitting ? 'none' : '2px 2px 0 rgba(18,12,26,.4)', borderRadius: '7px',
    background: on ? '#ffdd2e' : '#1d4490', color: on ? '#10285e' : '#8f88ad',
    opacity: isSubmitting ? 0.7 : 1, transform: isSubmitting ? 'translate(2px, 2px)' : 'none', transition: 'all 0.15s ease'
  } as React.CSSProperties);

  const rowStyleFor = (accent: string) => ({
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 13px', background: '#10285e',
    border: '3px solid #1c1526', borderLeft: '6px solid ' + accent, boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '8px'
  } as React.CSSProperties);

  const libGroups = catalog.filter(p => libFilter === "all" || p.id === libFilter).map(p => {
    const pAccent = p.id === 'creator' ? '#ff6a2e' : '#43e97b';
    const stops = p.stops.map((sp: any) => {
      const spEntries = allEntries.filter(e => e.pathway_id === p.id && e.stop_id === (sp.slug || sp.id) && (e.status === 'published' || !e.status));
      const links: any[] = [];
      spEntries.forEach(e => {
        (e.sources || []).forEach((x: any, i: number) => {
          const recId = e.id + "_" + i;
          const url = x[1];
          const isSaved = !!bookmarks[url];
          const isSubmitting = isSubmittingBookmark === url;
          const rec = {
            id: "db_" + e.id,
            label: x[0], url: url, domain: domainOf(url),
            about: e.subtitle || "", source: e.title, type: e.type || "Resource",
            pathway: p.id, stopName: sp.name, accent: pAccent,
            nodeId: sp.slug || sp.id,
            saved: isSaved, bmIcon: isSaved ? "★" : "☆", bmStyle: bmBtnStyle(isSaved, isSubmitting), rowStyle: rowStyleFor(pAccent), trail: p.id === 'creator' ? 'CREATOR' : 'ENVIRO'
          };
          links.push({ ...rec, onToggle: () => toggleBookmark(rec) });
        });
      });
      return {
        id: sp.id || sp.slug, name: sp.name, n: links.length, links, accent: pAccent,
        headStyle: { display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 12px', padding: '8px 11px', background: '#0f2a60', borderLeft: '5px solid ' + pAccent, borderRadius: '5px' } as React.CSSProperties,
        dotStyle: { flex: '0 0 auto', width: '12px', height: '12px', background: pAccent, border: '2px solid #1c1526' } as React.CSSProperties
      };
    }).filter((st: any) => st.n > 0 && (libNode === "all" || st.id === libNode));
    return { name: p.name, accent: pAccent, count: stops.reduce((a: number, st: any) => a + st.n, 0), stops };
  }).filter((g: any) => g.stops.length > 0);

  const libTotal = catalog.reduce((a, p) => a + p.stops.reduce((b: number, sp: any) => {
    const spEntries = allEntries.filter(e => e.pathway_id === p.id && e.stop_id === (sp.slug || sp.id) && (e.status === 'published' || !e.status));
    const dbCount = spEntries.reduce((c: number, e: any) => c + (e.sources || []).length, 0);
    return b + dbCount;
  }, 0), 0);

  const qchip = (active: boolean) => (theme === 'arcade' ? {
    all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', padding: '9px 12px', fontFamily: "'Press Start 2P',monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', background: active ? '#ffdd2e' : '#163a82', color: active ? '#10285e' : '#8f88ad'
  } : (active ? {all:'unset',cursor:'pointer',background:'#ffdd2e',color:'#10285e',font:"800 11px/1 'Exo'",padding:'4px 10px',borderRadius:'12px',textTransform:'uppercase',letterSpacing:'.5px'} : {all:'unset',cursor:'pointer',background:'rgba(255,255,255,.1)',color:'#a9c8ff',font:"800 11px/1 'Exo'",padding:'4px 10px',borderRadius:'12px',textTransform:'uppercase',letterSpacing:'.5px'}));

  const libFilterChips = [{ k: "all", label: "All Trails" }, { k: "creator", label: "Creator" }, { k: "enviro", label: "Enviro" }].map(c => ({ label: c.label, onPick: () => setLibFilter(c.k), style: qchip(libFilter === c.k) as any }));
  
  const NODE_ORDER = ["terrain", "portfolio", "story", "tools", "hiring", "mesa"];
  const NODE_NAMES = { terrain: "Know the Terrain", portfolio: "Portfolio Strategy", story: "Story & Resume", tools: "Tools & AI Kit", hiring: "Who's Hiring", mesa: "MESA Basecamp" };
  const libNodeChips = [{ k: "all", label: "ALL NODES" }].concat(NODE_ORDER.map(id => ({ k: id, label: NODE_NAMES[id as keyof typeof NODE_NAMES] }))).map(c => ({ label: c.label, onPick: () => setLibNode(c.k), style: qchip(libNode === c.k) as any }));

  // My Shelf
  const shelfItems: any[] = [];
  catalog.forEach(p => {
    const pAccent = p.id === 'creator' ? '#ff6a2e' : '#43e97b';
    p.stops.forEach((sp: any) => {
      const spEntries = allEntries.filter(e => e.pathway_id === p.id && e.stop_id === (sp.slug || sp.id) && (e.status === 'published' || !e.status));
      spEntries.forEach(e => {
        (e.sources || []).forEach((x: any, i: number) => {
          const recId = e.id + "_" + i;
          const url = x[1];
          if (bookmarks[url]) {  // Check by URL, not recId
            const isSubmitting = isSubmittingBookmark === url;
            const rec = {
              id: recId,
              label: x[0], url: url, domain: domainOf(url),
              about: e.subtitle || "", source: e.title, type: e.type || "Resource",
              pathway: p.id, stopName: sp.name, accent: pAccent,
              saved: true, bmIcon: "★", bmStyle: bmBtnStyle(true, isSubmitting), rowStyle: rowStyleFor(pAccent), trail: p.id === 'creator' ? 'CREATOR' : 'ENVIRO'
            };
            shelfItems.push({ ...rec, onToggle: () => toggleBookmark(rec) });
          }
        });
      });
    });
  });
  // Add bookmarked jobs to shelf
  jobs.forEach(j => {
    const url = j.apply_url;
    if (jobBookmarks[url]) {
      const isCreatorJob = j.pathway_id === 'creator';
      const jobAccent = isCreatorJob ? '#ff6a2e' : '#43e97b';
      const isSubmitting = isSubmittingJobBookmark === url;
      const rec = {
        id: 'job_' + j.id,
        label: `${j.title} — ${j.organization}`, url: url, domain: domainOf(url),
        about: j.location || "", source: "Quest Board", type: j.job_type || "Job",
        pathway: j.pathway_id, stopName: "Jobs", accent: jobAccent,
        saved: true, bmIcon: "★", bmStyle: bmBtnStyle(true, isSubmitting), rowStyle: rowStyleFor(jobAccent), trail: isCreatorJob ? 'CREATOR' : 'ENVIRO'
      };
      shelfItems.push({ ...rec, onToggle: () => toggleJobBookmark({ title: j.title, org: j.organization, url: url }) });
    }
  });
  // Add bookmarked external boards to shelf
  externalBoards.forEach((b: any) => {
    const url = b.url;
    if (boardBookmarks[url]) {
      const isSubmitting = isSubmittingBoardBookmark === url;
      const rec = {
        id: 'board_' + (b.id || url),
        label: b.label, url: url, domain: domainOf(url),
        about: b.description || "", source: "External Boards", type: "Board",
        pathway: 'enviro', stopName: "Boards", accent: '#45d4ff',
        saved: true, bmIcon: "★", bmStyle: bmBtnStyle(true, isSubmitting), rowStyle: rowStyleFor('#45d4ff'), trail: 'ENVIRO'
      };
      shelfItems.push({ ...rec, onToggle: () => toggleBoardBookmark({ label: b.label, url: url }) });
    }
  });
  const shelfCount = shelfItems.length;

  // Compute Quiz Props
  const dbQuizData = dbQuizzes.find(q => q.pathway_id === pathway && q.stop_id === stopId);
  const quizMeta = dbQuizData?.options?.find((o: any) => o.id === '__meta__') || {};
  
  const popHasQuiz = pathway && stopId ? true : false;
  const quizPrompt = dbQuizData ? dbQuizData.prompt : '';
  const quizPickLabel = (dbQuizData && (dbQuizData.pick || quizMeta.pick)) ? (dbQuizData.pick || quizMeta.pick) : '⚡ YOUR MISSION PICK'; 
  const rawQuizOptions = dbQuizData && dbQuizData.options ? dbQuizData.options.filter((o: any) => o.id !== '__meta__') : [];
  const quizAllowCustom = dbQuizData ? dbQuizData.allow_custom : false;
  const quizCustomLabel = (dbQuizData && (dbQuizData.custom_label || quizMeta.custom_label)) ? (dbQuizData.custom_label || quizMeta.custom_label) : '…or write your own';

  const pickKey = `${pathway}.${stopId}`;
  const existingPick = dbUserPicks.find(p => p.pathway_id === pathway && p.stop_id === stopId);
  const quizAnswered = !!existingPick;
  const quizUnanswered = !quizAnswered;
  const quizCustom = pickCustoms[pickKey] !== undefined ? pickCustoms[pickKey] : (existingPick?.custom_answer || '');
  
  const handleSavePick = async (optId: string, customText: string) => {
    if (!user) { alert('Please log in to save your picks!'); return; }
    // Optimistic update
    const newPick = { user_id: user.id, pathway_id: pathway, stop_id: stopId, option_id: optId, custom_answer: customText };
    setDbUserPicks(prev => {
      const idx = prev.findIndex(p => p.pathway_id === pathway && p.stop_id === stopId);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = newPick; return copy; }
      return [...prev, newPick];
    });
    await saveUserPick(newPick);
  };

  const onQuizCustom = (e: any) => {
    setPickCustoms({ ...pickCustoms, [pickKey]: e.target.value });
    if (existingPick?.option_id) {
      // If there was a standard option selected, clear it immediately
      handleSavePick('', e.target.value);
    }
  };
  
  const onQuizCustomBlur = (e: any) => {
    if (e.target.value.trim().length > 0 || existingPick) {
      handleSavePick('', e.target.value);
    }
  };

  const onQuizClear = async () => {
    if (!user) return;
    setPickCustoms({ ...pickCustoms, [pickKey]: '' });
    await saveUserPick({ user_id: user.id, pathway_id: pathway, stop_id: stopId, option_id: '', custom_answer: '' });
    // Remove from local state to reflect clear
    setDbUserPicks(prev => prev.filter(p => !(p.pathway_id === pathway && p.stop_id === stopId)));
  };

  const quizOptions = rawQuizOptions.map((o: any) => {
    const isPicked = existingPick?.option_id === o.id;
    return {
      ...o,
      hasSub: !!o.sub,
      tick: isPicked ? '✓' : '',
      style: { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, display: 'flex', alignItems: 'center', gap: '11px', width: '100%', padding: '11px 13px', border: `3px solid ${isPicked ? popColor : '#1c1526'}`, boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', background: isPicked ? '#10285e' : '#163a82' },
      dotStyle: { flex: '0 0 auto', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', border: '3px solid #1c1526', background: isPicked ? popColor : '#0f2a60', color: '#10285e' },
      onPick: () => { setPickCustoms({ ...pickCustoms, [pickKey]: '' }); handleSavePick(o.id, ''); }
    };
  });

  const customActive = existingPick && !existingPick.option_id && existingPick.custom_answer?.trim();
  const quizCustomStyle = { width: '100%', padding: '11px 12px', background: '#10285e', color: '#f2f6ff', border: `3px solid ${customActive ? popColor : '#1c1526'}`, fontSize: '18px', outline: 'none' };
  const quizStatusLabel = quizAnswered ? "✓ PICKED" : "CHOOSE ONE";
  const quizStatusStyle = { flex: '0 0 auto', padding: '5px 9px', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', border: '2px solid #1c1526', background: quizAnswered ? '#10285e' : 'rgba(16,40,94,.35)', color: '#10285e' };
  const quizClearStyle = { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, padding: '9px 12px', background: '#2656a4', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase' as any, border: '2px solid #1c1526' };
  const quizSummitBtnLabel = "GO TO SUMMIT (NODE 7)";
  const quizSummitBtnStyle = { all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, padding: '9px 12px', background: '#12f0c0', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase' as any, border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.3)' };
  
  // NOTE: This assumes ArcadeTheme logic uses a prop-based onQuizToSummit or similar. We will just pass it down.
  const onQuizToSummit = () => {
    // Actually we need to figure out what setArcadeScreen is, but it's local to ArcadeTheme.
    // Instead, ArcadeTheme handles summit navigation. We just pass down the handler if needed.
  };

  // Node 7 State
  const dbSummitData = dbSummits.find(s => s.pathway_id === pathway);
  const summitTitle = dbSummitData ? dbSummitData.title : 'PATHWAY CARD';
  const summitKlass = dbSummitData ? dbSummitData.klass : '';
  const summitIntro = dbSummitData ? dbSummitData.intro : '';
  const summitCloser = dbSummitData ? dbSummitData.closer : '';

  const currentPathwayStops = pw?.stops || [];
  const summitChecklist = currentPathwayStops.map((s, i) => {
    const pk = dbUserPicks.find(p => p.pathway_id === pathway && p.stop_id === s.id);
    const qData = (QUIZZES as any)[pathway || '']?.[s.id] || {};
    const dbQ = dbQuizzes.find(q => q.pathway_id === pathway && q.stop_id === s.id);
    const meta = dbQ?.options?.find((o: any) => o.id === '__meta__') || {};
    const resultLabel = (dbQ && (dbQ.result || meta.result)) ? (dbQ.result || meta.result) : (qData.result || s.name);
    
    let answerText = "";
    if (pk?.option_id) {
      const opts = dbQ?.options?.length ? dbQ.options : (qData.options || []);
      const pickedOpt = opts.find((o: any) => o.id === pk.option_id);
      if (pickedOpt) answerText = pickedOpt.label;
    } else if (pk?.custom_answer && pk.custom_answer.trim() !== '') {
      answerText = pk.custom_answer;
    }
    
    const hasValue = !!answerText;
    const optional = dbQ ? !!dbQ.optional : !!qData.optional;
    const color = (theme === 'arcade' && STEP[i]) ? STEP[i] : (s.color || "#6b4a2a");
    
    return {
      name: s.name, 
      result: resultLabel,
      value: hasValue ? answerText : (optional ? "Optional — not set" : "Not chosen yet"),
      mark: s.mark || '◆', 
      done: hasValue, 
      optional: optional,
      valStyle: { display: "block", fontSize: "20px", lineHeight: "1.2", marginTop: "4px", color: hasValue ? "#f2f6ff" : "#7e88b0" },
      dotStyle: { flex: "0 0 auto", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "15px", border: "3px solid #1c1526", background: hasValue ? color : "#1d4490", color: "#10285e" },
      statusStyle: { flex: "0 0 auto", padding: "6px 9px", fontFamily: "'Press Start 2P',monospace", fontSize: "7px", border: "2px solid #1c1526", background: hasValue ? "#12f0c0" : "#2656a4", color: hasValue ? "#10285e" : "#9fc0ee" },
      statusLabel: hasValue ? "✓ SET" : (optional ? "OPTIONAL" : "TODO"),
      onJump: () => { setStopId(s.id); },
      rowStyle: { all: "unset", cursor: "pointer", boxSizing: "border-box", display: "flex", alignItems: "center", gap: "13px", width: "100%", padding: "12px 15px", background: "#163a82", border: "3px solid #1c1526", borderLeft: "6px solid " + color, boxShadow: "3px 3px 0 rgba(18,12,26,.4)", borderRadius: "8px" }
    };
  });
  
  const reqStops = summitChecklist.filter(s => !s.optional);
  const ansReqCount = reqStops.filter(s => s.done).length;
  const runComplete = reqStops.length > 0 && ansReqCount === reqStops.length;
  
  const runClaimed = !!pathway && !!claimedRuns[pathway];
  const summitLocked = !runComplete;
  const summitClaimable = runComplete && !runClaimed;
  const summitDone = runClaimed;
  
  const remainingNames = reqStops.filter(s => !s.done).map(s => s.name);
  const remainingCount = remainingNames.length;
  const remainingText = remainingNames.join(" · ");
  
  const onClaim = () => { if (pathway) claimRun(pathway); };
  const onPrintCard = () => { window.print(); };
  const onResetRun = () => { if (pathway) resetRun(pathway); };
  const cardStatRows = currentPathwayStops.map((s, i) => {
    const qData = (QUIZZES as any)[pathway || '']?.[s.id] || {};
    const pk = dbUserPicks.find(p => p.pathway_id === pathway && p.stop_id === s.id);
    const dbQ = dbQuizzes.find(q => q.pathway_id === pathway && q.stop_id === s.id);
    const meta = dbQ?.options?.find((o: any) => o.id === '__meta__') || {};
    const resultLabel = (dbQ && (dbQ.result || meta.result)) ? (dbQ.result || meta.result) : (qData.result || s.name);
    
    let answerText = "";
    if (pk?.option_id) {
      const opts = dbQ?.options?.length ? dbQ.options : (qData.options || []);
      const pickedOpt = opts.find((o: any) => o.id === pk.option_id);
      if (pickedOpt) answerText = pickedOpt.label;
    } else if (pk?.custom_answer && pk.custom_answer.trim() !== '') {
      answerText = pk.custom_answer;
    }
    
    const hasValue = !!answerText;
    const color = (theme === 'arcade' && STEP[i]) ? STEP[i] : (s.color || "#6b4a2a");
    
    return {
      mark: s.mark || '◆',
      result: resultLabel,
      value: hasValue ? answerText : "—",
      hasValue: hasValue,
      dotStyle: { flex: "0 0 auto", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Press Start 2P',monospace", fontSize: "13px", border: "3px solid #1c1526", background: color, color: "#10285e" },
      valStyle: { fontFamily: "'VT323',monospace", fontSize: "23px", lineHeight: "1.1", color: hasValue ? "#10285e" : "#8f88ad" }
    };
  });

  const onQuizCustomPick = () => handleSavePick('custom', quizCustom);

  const onSubmitJobSuggestion = async (data: { title: string; apply_url: string; contributor_name: string; pathway_id: string; job_type: string; organization?: string; location?: string; note?: string; }) => {
    return submitJobSuggestion({ ...data, submitter_profile_id: profileId || undefined });
  };

  const allProps = { pathway, onBackTrailhead, pwColor, pwMark, pwName, pwShelf, showJobs, pwJobCount, onSwitchPathway, otherPwName, pwIntro, atlasIsTrail, pwIsCreator, pwIsEnviro, atlasEdges, atlasNodes, atlasIsBasecamp, jobRows, externalBoards, boardChips, jobFilterChips, jobFilter, popupOpen, popColor, popMark, popShelf, popStopName, onClosePopup, popBlurb, popEntryCount, popEntryList, popCall, popType, popSub, popTitle, popMedia, popImages, popParas, popFacts, popSrcs, pwTag, suggestOpen, onOpenSuggest, onCloseSuggest, sgDone, sgNotDone, sgTitle, onSgTitle, sgUrl, onSgUrl, sgPathway, onSgPathway, sgStop, onSgStop, sgNote, onSgNote, sgContributor, onSgContributor, canSubmit, sgSubmitStyle, onSubmitSuggest, sgSubmitting, isSteward, isExplorer, onRoleExplorer, onRoleSteward, onToggleIntro, introToggleLabel, introExpanded, waypointCount, noteCount, jobCount, showTrailhead, entryIsCrossroads, entryIsMaps, showPathway, creatorTipMeta, enviroTipMeta, mapCards, onPickCreator, onPickEnviro, stop, roleExplorerStyle, roleStewardStyle, isAdminUser, profileId, theme, setTheme, footTag, popEntry, initialAvatar, onSaveAvatar, pw, pwAccent, libGroups, libTotal, libFilterChips, libNodeChips, shelfItems, shelfCount, popHasQuiz, quizPrompt, quizPickLabel, quizOptions, quizAllowCustom, quizCustomLabel, quizCustom, onQuizCustom, onQuizCustomBlur, quizCustomStyle, quizAnswered, quizUnanswered, quizStatusLabel, quizStatusStyle, onQuizClear, quizClearStyle, onQuizToSummit, quizSummitBtnLabel, quizSummitBtnStyle, summitTitle, summitKlass, summitIntro, summitCloser, summitChecklist, runComplete, runClaimed, summitLocked, summitClaimable, summitDone, remainingCount, remainingText, onClaim, onPrintCard, onResetRun, cardStatRows, onQuizCustomPick, onSubmitJobSuggestion, stopCounts: counts.stopCounts };

  if (!isLoaded || !dataLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", color: '#ffdd2e', animation: 'ar-bob 1s infinite steps(2)' }}>LOADING...</div>
      </div>
    );
  }

  if (theme === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A1F2C 0%, #0D1117 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        padding: '40px 20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'fadeInDown 0.6s ease-out' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px', background: 'linear-gradient(90deg, #fff, #9aa5b1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Select Interface Theme</h1>
          <p style={{ fontSize: '18px', color: '#8b949e', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            Choose how you'd like to experience the Workforce Development pathways. You can switch themes at any time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Modern Theme Card */}
          <button 
            onClick={() => setTheme('modern')}
            style={{
              all: 'unset', cursor: 'pointer', width: '420px', background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxSizing: 'border-box', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(-12px)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '100%', height: '240px', borderRadius: '16px', 
              backgroundImage: 'url("/modren.png")', backgroundSize: 'cover', backgroundPosition: 'top center', 
              marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}></div>
            <h2 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '12px', color: '#f0f6fc' }}>Modern UI</h2>
            <p style={{ color: '#8b949e', textAlign: 'center', fontSize: '15px', lineHeight: 1.6, padding: '0 10px' }}>A clean, professional interface with smooth transitions, interactive topography, and comprehensive map views.</p>
          </button>

          {/* Arcade Theme Card */}
          <button 
            onClick={() => setTheme('arcade')}
            style={{
              all: 'unset', cursor: 'pointer', width: '420px', background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxSizing: 'border-box', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(-12px)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '100%', height: '240px', borderRadius: '16px', 
              backgroundImage: 'url("/arcade.png")', backgroundSize: 'cover', backgroundPosition: 'top center', 
              marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}></div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', fontFamily: "'Press Start 2P', monospace", color: '#43e97b', letterSpacing: '1px', marginTop: '6px' }}>Arcade Mode</h2>
            <p style={{ color: '#8b949e', textAlign: 'center', fontSize: '15px', lineHeight: 1.6, padding: '0 10px' }}>A fun, retro 8-bit aesthetic inspired by classic RPG games. Perfect for a gamified exploration experience.</p>
          </button>
        </div>

        <Link href="/hub" style={{ marginTop: '60px', color: '#8b949e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', transition: 'color 0.2s', padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Desktop
        </Link>
      </div>
    );
  }

  return theme === 'arcade' ? <ArcadeTheme {...allProps} initialScreen={initialScreen} /> : <ModernTheme {...allProps} initialScreen={initialScreen} />;
}

export default function WorkforcePathwaysPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", color: '#ffdd2e', animation: 'ar-bob 1s infinite steps(2)' }}>LOADING...</div>
      </div>
    }>
      <WorkforcePathwaysContent />
    </Suspense>
  );
}