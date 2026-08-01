
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { getAnnouncements, getUnreadAnnouncements, getSystemBulletins, markAnnouncementAsRead, markAllAnnouncementsAsRead } from '@/app/actions/bulletins';
import { getShowcaseItems } from '@/app/actions/workshops/showcase';
import { fetchUserPicks, getArcadeAvatar, fetchAllQuizzes } from '@/app/admin/workforce-pathways/actions';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import { PATHWAYS, QUIZZES } from '@/data/workforce-content';
import PixelHero from '@/app/hub/workforce-pathways/components/PixelHero';
import type { CohortProgress } from '@/app/api/workshops/progress/route';
import CohortSwitcher from '@/components/hub/CohortSwitcher';
import PathwayCardDownload from '@/components/shared/PathwayCardDownload';

interface CozyHubRoomProps {
  isAdmin?: boolean;
  isGuest?: boolean;
  avatarUrl?: string | null;
  onLogout?: () => void;
  initialChiaProgress?: number;
  // Multi-cohort support props - integrated with CohortSwitcher
  cohortProgress?: CohortProgress[];
  globalEngagement?: number;
  selectedCohortId?: string;
  onCohortChange?: (cohortId: string) => void;
  onScreenChange?: (screen: string) => void;
}

export default function CozyHubRoom({ 
  isAdmin = true, 
  isGuest = false, 
  avatarUrl, 
  onLogout, 
  initialChiaProgress = 0,
  // Multi-cohort props - used by CohortSwitcher integration
  cohortProgress,
  globalEngagement,
  selectedCohortId,
  onCohortChange,
  onScreenChange
}: CozyHubRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Auto-open progress screen if URL has ?screen=progress
  useEffect(() => {
    const screenParam = searchParams.get('screen');
    if (screenParam === 'progress') {
      setScreen('progress');
    }
  }, [searchParams]);

  // Prefetch common navigation routes so transitions are near-instant
  useEffect(() => {
    router.prefetch('/hub/pilot-workshops');
    router.prefetch('/hub/ai-lab');
    router.prefetch('/hub/workforce-pathways');
    router.prefetch('/hub/library');
    router.prefetch('/hub/environmental-literacy');
  }, [router]);
  
  const [screen, setScreen] = useState<'hub' | 'monitor' | 'meditation' | 'progress' | 'bridge' | 'loggedout' | 'navigating' | 'announcements' | 'showcase'>('hub');
  const [hovered, setHovered] = useState<string | null>(null);
  const [announcementsSidebarOpen, setAnnouncementsSidebarOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'announcements' | 'submissions'>('announcements');
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<any>(null);

  // Notify parent of screen changes
  useEffect(() => {
    if (onScreenChange) {
      onScreenChange(screen);
    }
  }, [screen, onScreenChange]);

  // Bulletins & Announcements Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [bulletinText, setBulletinText] = useState('');
  const [hasUnreadBulletin, setHasUnreadBulletin] = useState(false);
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [bulletinUpdatedAt, setBulletinUpdatedAt] = useState<string | null>(null);
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  // Bookmarks & Engagements Data
  const [bookmarksAndEngagements, setBookmarksAndEngagements] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  // Certificate state
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [certPreviewHtml, setCertPreviewHtml] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // PDF Document Toggle state (Document ID | null)
  const [activePdfToggle, setActivePdfToggle] = useState<number | null>(null);
  const [programDocuments, setProgramDocuments] = useState<any[]>([]);
  
  // Workforce Pathway state
  const [workforcePicks, setWorkforcePicks] = useState<any[]>([]);
  const [loadingWorkforcePicks, setLoadingWorkforcePicks] = useState(false);
  const [expandedPathwayCard, setExpandedPathwayCard] = useState<string | null>(null);
  const [arcadeAvatar, setArcadeAvatar] = useState<any>(null);
  
  // Showcase Data for guests
  const [showcaseItems, setShowcaseItems] = useState<any[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  
  // Onboarding completion status for AI Labs / Pilot Works access
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  
  // State from DCLogic
  const [progress, setProgress] = useState(initialChiaProgress);
  const [isProgressTransitioning, setIsProgressTransitioning] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'dusk' | 'night'>('day');
  const [exitStyle, setExitStyle] = useState('neon');

  const [scale, setScale] = useState(1);
  const [bridgeId, setBridgeId] = useState<string | null>(null);
  
  const [medTotal, setMedTotal] = useState(300);
  const [medLeft, setMedLeft] = useState(300);
  const [medRunning, setMedRunning] = useState(false);
  const [medTheme, setMedTheme] = useState(0);
  const [medTone, setMedTone] = useState(false);
  const [activeToneId, setActiveToneId] = useState<string | null>(null);
  const [wellnessResources, setWellnessResources] = useState<{slot_key:string;label:string;title:string;description:string}[]>([]);
  const [wellnessTones, setWellnessTones] = useState<{id:string;name:string;frequency:number;wave_type:string;gain:number;audio_url?:string}[]>([]);
  const [customMedTime, setCustomMedTime] = useState('');
  const [customMedLoading, setCustomMedLoading] = useState(false);
  
  const [lampIndex, setLampIndex] = useState(0);

  const _timer = useRef<NodeJS.Timeout | null>(null);
  const _stopToneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (_stopToneRef.current) {
        _stopToneRef.current();
      }
    };
  }, []);

  // Fetch wellness resources + tones when meditation screen opens
  useEffect(() => {
    if (screen === 'meditation') {
      fetch('/api/public/wellness', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (data.resources) setWellnessResources(data.resources);
          if (data.tones) setWellnessTones(data.tones);
        })
        .catch(() => {});
    }
  }, [screen]);

  useEffect(() => {
    // Always use initialChiaProgress from the API (supports multi-cohort switching)
    // This value comes from the Progress API's totalProgress calculation
    // Validates: Requirements 4.3 - Update Chia Guardian when cohort selection changes
    setIsProgressTransitioning(true);
    const timer = setTimeout(() => {
      setProgress(initialChiaProgress);
      setIsProgressTransitioning(false);
    }, 300);
    try { const t = localStorage.getItem('sw_timeofday') as 'day'|'dusk'|'night'; if (t) setTimeOfDay(t); } catch (e) {}
    try { const ex = localStorage.getItem('sw_exit'); if (ex) setExitStyle(ex); } catch (e) {}
    
    const handleResize = () => { const s = Math.min(window.innerWidth / 1300, window.innerHeight / 700); setScale(s); };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const lampTimer = setInterval(() => {
      setLampIndex(st => st + 1);
    }, 300000);

    // Fetch announcements & bulletin
    async function loadData() {
      try {
        const anns = await getAnnouncements();
        setAnnouncements(anns);
        
        const unread = await getUnreadAnnouncements();
        setUnreadIds(unread.map(u => u.id));

        // Fetch personal notifications (approvals, helpdesk, etc.)
        try {
          const notifications = await getUnreadNotifications();
          setPersonalNotifications(notifications);
        } catch (err) {
          console.error("Failed to load personal notifications", err);
        }

        // Fetch Program Documents
        try {
          const docsRes = await fetch('/api/program-documents?t=' + Date.now(), { cache: 'no-store' });
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            setProgramDocuments(docsData.documents || []);
          }
        } catch (err) {
          console.error("Failed to load program documents", err);
        }

        const sys = await getSystemBulletins();
        if (sys && sys.project_bulletin_text) {
          setBulletinText(sys.project_bulletin_text);
          if (sys.updated_at) {
            setBulletinUpdatedAt(sys.updated_at);
            const lastRead = localStorage.getItem('sw_bulletin_read_at');
            if (!lastRead || lastRead !== sys.updated_at) {
              setHasUnreadBulletin(true);
            }
          }
        }
        
        // Check onboarding completion status
        try {
          const profileRes = await fetch('/api/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            // Check if onboarding_completed flag is set, OR if they have community_status (legacy check)
            const completed = profileData.profile?.onboarding_completed === true || 
                             !!profileData.profile?.community_status;
            setOnboardingCompleted(completed);
          }
        } catch (err) {
          console.error("Failed to check onboarding status", err);
          setOnboardingCompleted(false);
        }
        
        // Load bookmarks and engagements
        setLoadingBookmarks(true);
        try {
          const response = await fetch('/api/workshops/progress');
          if (response.ok) {
            const data = await response.json();
            // Multi-cohort API returns engagements in globalEngagement.items
            const engagements = data.globalEngagement?.items || [];
            
            // Get approved bookmarks, notes, prompts, and generations
            const items = engagements
              .filter((e: any) => e.status === 'approved')
              .map((e: any) => ({
                id: e.id,
                kind: e.kind,
                title: e.title,
                source: e.source === 'library' ? 'Steward Library' : 
                        e.source === 'workforce' ? 'Workforce Development' : 
                        e.source === 'ai-lab' ? 'AI Lab' : 
                        e.source === 'manual' ? 'Pilot Workshops' : 
                        e.source || 'Hub',
                url: e.url,
                created_at: e.created_at,
                review_note: e.review_note || null
              }))
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 8); // Show max 8 items
            
            setBookmarksAndEngagements(items);
          }
        } catch (err) {
          console.error("Failed to load bookmarks and engagements", err);
        } finally {
          setLoadingBookmarks(false);
        }
        
        // Load showcase items for guest users
        if (isGuest) {
          setShowcaseLoading(true);
          try {
            // Fetch all showcase items from all cohorts (public showcase for guests)
            // We'll fetch from the pilot workshops cohort
            const response = await fetch('/api/workshops/showcase/all');
            if (response.ok) {
              const data = await response.json();
              setShowcaseItems(data.items || []);
            } else {
              console.error("Failed to fetch showcase items:", response.statusText);
            }
          } catch (err) {
            console.error("Failed to load showcase items", err);
          } finally {
            setShowcaseLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load hub data", err);
      }
    }
    loadData();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(lampTimer);
    };
  }, [initialChiaProgress]);

  // Load workforce pathway picks and arcade avatar when progress screen opens
  useEffect(() => {
    if (screen === 'progress' && workforcePicks.length === 0 && user?.id) {
      setLoadingWorkforcePicks(true);
      fetchUserPicks(user.id).then((picks) => {
        setWorkforcePicks(picks || []);
      }).catch((err) => {
        console.error('Failed to load workforce picks:', err);
      }).finally(() => {
        setLoadingWorkforcePicks(false);
      });
      fetchAllQuizzes().then((quizzes) => {
        setDbQuizzes(quizzes || []);
      }).catch((err) => {
        console.error('Failed to load quizzes:', err);
      });
      // Also fetch arcade avatar for pathway card display
      if (!arcadeAvatar) {
        getArcadeAvatar(user.id).then((data) => {
          if (data) {
            setArcadeAvatar({
              form: data.form || 'enby',
              skin: data.skin || '#e8b07a',
              outfit: data.outfit || '#ff2e8f',
              hairStyle: data.hair_style || 'auto',
              hairColor: data.hair_color || '#3a2a1a',
              hatColor: data.hat_color || '#10285e',
              hatType: data.hat_type || 'cap',
              gear: data.gear || 'creator'
            });
          }
        }).catch((err) => {
          console.error('Failed to load arcade avatar:', err);
        });
      }
    }
  }, [screen, user?.id]);

  const persist = (k: string, v: string) => { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  // Progress is now read-only from workshop data, so we don't allow manual changes
  // const setProg = (v: number) => { v = Math.max(0, Math.min(100, Math.round(v))); setProgress(v); persist('sw_progress', String(v)); }
  // const incProg = () => setProg(progress + 5);
  // const decProg = () => setProg(progress - 5);
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
    // Check if AI Labs or Pilot Works requires onboarding
    const requiresOnboarding = id === 'pilot' || id === 'ailab';
    if (requiresOnboarding && onboardingCompleted === false) {
      // Redirect to onboarding with return URL
      const route = bridges[id]?.route;
      setScreen('navigating');
      router.push(`/hub/onboarding?returnUrl=${encodeURIComponent(route || '/hub')}`);
      return;
    }
    
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
  const pauseMed = () => { 
    if (_timer.current) clearInterval(_timer.current); 
    setMedRunning(false); 
    setMedTone(false);
    if (_stopToneRef.current) {
      _stopToneRef.current();
    }
  }
  const medReset = () => { pauseMed(); setMedLeft(medTotal); }
  
  const med1 = () => setMed(60);
  const med5 = () => setMed(300);
  const med10 = () => setMed(600);
  const handleCustomMed = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMedTime);
    if (!isNaN(mins) && mins > 0 && !customMedLoading) {
      setCustomMedLoading(true);
      // Apply the new timer value
      setMed(mins * 60);
      // Keep loading until React flushes the display update (two animation frames)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCustomMedLoading(false);
          setCustomMedTime('');
        });
      });
    }
  };
  const medToggle = toggleMed;
  const medTheme0 = () => setMedTheme(0);
  const medTheme1 = () => setMedTheme(1);
  const medTheme2 = () => setMedTheme(2);
  const medTheme3 = () => setMedTheme(3);
  const playTone = (tone: {id:string;frequency:number;wave_type:string;gain:number;audio_url?:string}) => {
    // If clicking the same active tone, stop it
    if (activeToneId === tone.id && medTone) {
      if (_stopToneRef.current) _stopToneRef.current();
      setMedTone(false);
      setActiveToneId(null);
      return;
    }
    // Stop any existing tone first
    if (_stopToneRef.current) _stopToneRef.current();
    
    try {
      // If tone has an audio file, play that instead of synthesizing
      if (tone.audio_url) {
        const audio = new Audio(tone.audio_url);
        audio.loop = true;
        audio.volume = tone.gain;
        audio.play();
        
        _stopToneRef.current = () => {
          audio.pause();
          audio.currentTime = 0;
          _stopToneRef.current = null;
        };
        
        setMedTone(true);
        setActiveToneId(tone.id);
        return;
      }

      // Synthesized tone fallback
      // @ts-ignore
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tone.wave_type as OscillatorType; o.frequency.value = tone.frequency; g.gain.value = 0; o.connect(g); g.connect(ctx.destination); o.start();
      g.gain.linearRampToValueAtTime(tone.gain, ctx.currentTime + 1.5);
      
      _stopToneRef.current = () => {
        try {
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
          setTimeout(() => { o.stop(); ctx.close(); }, 500);
        } catch (e) {}
        _stopToneRef.current = null;
      };
      
      setMedTone(true);
      setActiveToneId(tone.id);
    } catch (e) {
      console.error("Audio API not supported or error", e);
    }
  };
  // Fallback for when no tones loaded from DB
  const medToneToggle = () => {
    if (medTone) {
      if (_stopToneRef.current) _stopToneRef.current();
      setMedTone(false);
      setActiveToneId(null);
      return;
    }
    playTone({ id: '_fallback', frequency: 174, wave_type: 'sine', gain: 0.05 });
  };

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
    { id: 'showcase', label: 'Contributor Showcase', kind: 'showcase' },
    { id: 'logout', label: 'Log Out', kind: 'logout' },
    { id: 'admin', label: 'Admin Console', kind: 'bridge' },
  ];
  
  const o: any = {
    progress: { show: hovered === 'progress', enter: () => setHovered('progress'), click: () => open({ kind: 'progress' }) },
    admin: { show: hovered === 'admin', enter: () => setHovered('admin'), click: () => { setScreen('navigating'); router.push('/admin'); } },
    logout: { show: hovered === 'logout', enter: () => setHovered('logout'), click: () => open({ id: 'logout' }) },
    showcase: { show: hovered === 'showcase', enter: () => setHovered('showcase'), click: () => setScreen('showcase') },
    phone: { show: hovered === 'phone', enter: () => setHovered('phone'), click: async () => {
      setAnnouncementsSidebarOpen(true);
      setNotifTab('announcements');
      
      // Mark bulletin as read after a brief delay so user sees the "UPDATED" badge
      if (bulletinUpdatedAt && hasUnreadBulletin) {
        setTimeout(() => {
          localStorage.setItem('sw_bulletin_read_at', bulletinUpdatedAt!);
          setHasUnreadBulletin(false);
        }, 2000);
      }
    } }
  };
  defs.forEach(d => { o[d.id] = o[d.id] || { enter: () => setHovered(d.id), click: () => open(d), show: hovered === d.id }; });
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
    progress: { title: 'Trek Progress', route: '', blurb: 'Click to open your progress tracking panel and visualize your journey through the StewardWorks program.' },
    admin: { title: 'Admin Console', route: '/admin', blurb: 'The ADMIN KEY on the wall. Opens the backend admin interface to manage users, content, and system settings.' },
    logout: { title: 'Log Out', route: '/login', blurb: 'The EXIT sign on the wall. Signs you out of StewardWorks and returns you to the login screen.' },
    phone: { title: 'Announcements', route: '', blurb: 'The WALL PHONE. Check messages from your StewardWorks admins.' },
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
  const isNavigating = screen === 'navigating';
  const isShowcase = screen === 'showcase';
  const isNeon = exitStyle === 'neon';
  const isWood = exitStyle === 'wood';

  const notificationCount = unreadIds.length + personalNotifications.filter((n: any) => !n.is_read).length + (hasUnreadBulletin ? 1 : 0);
  const phoneRinging = notificationCount > 0;
  const showPhone = !isAdmin;
  const isLogout = bridgeId === 'logout';
  const isLink = bridgeId !== 'logout';

  const bridgeTitle = bridge.title;
  const bridgeRoute = bridge.route;
  const bridgeBlurb = bridge.blurb;
  const medDisplay = fmt(medLeft);
  const medPlayLabel = medRunning ? 'Pause' : 'Begin';
  const medToneLabel = medTone ? '♪ Tone on' : '♪ Tone off';
  const hasDbTones = wellnessTones.length > 0;

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
      <style>{`.sw-hover-1:hover { transform:translateY(-6px) scale(1.02);filter:drop-shadow(0 14px 22px rgba(219,155,47,.55)); !important; }\n.sw-hover-2:hover { transform:translateY(-5px) scale(1.012);filter:drop-shadow(0 16px 26px rgba(65,124,152,.55));z-index:30; !important; }\n.sw-hover-3:hover { transform:rotate(6deg) scale(1.08);filter:drop-shadow(0 8px 12px rgba(162,117,50,.7)); !important; }\n.sw-hover-4:hover { transform:translateY(-5px) scale(1.03);filter:drop-shadow(0 14px 22px rgba(219,80,60,.5)); !important; }\n.sw-hover-5:hover { transform:translateY(-7px) scale(1.03);filter:drop-shadow(0 12px 18px rgba(255,190,120,.7)); !important; }\n.sw-hover-6:hover { transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(80,170,190,.6)); !important; }\n.sw-hover-7:hover { transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(107,142,35,.6)); !important; }\n.sw-hover-8:hover { transform:translateY(-5px) scale(1.015);filter:drop-shadow(0 16px 22px rgba(65,124,152,.5)); !important; }\n.sw-hover-9:hover { transform:translateY(-7px) scale(1.04);filter:drop-shadow(0 12px 18px rgba(219,155,47,.6)); !important; }\n.sw-hover-10:hover { transform:translateY(-7px) scale(1.03);filter:drop-shadow(0 12px 18px rgba(162,117,50,.6)); !important; }\n.sw-hover-11:hover { background:rgba(253,221,154,.3); !important; }\n.sw-hover-12:hover { background:rgba(253,221,154,.3); !important; }\n.sw-hover-13:hover { background:rgba(253,221,154,.3); !important; }\n.sw-hover-14:hover { background:rgba(33,40,46,.06); !important; }\n.sw-hover-15:hover { transform:translateY(-10px); !important; }\n.sw-hover-16:hover { transform:translateY(-10px); !important; }\n.sw-hover-17:hover { transform:translateY(-10px); !important; }\n.sw-hover-18:hover { background:rgba(255,255,255,.2); !important; }\n@keyframes sw-ring { 0%, 100% { transform: rotate(0); } 20%, 60% { transform: rotate(10deg); } 40%, 80% { transform: rotate(-10deg); } }`}</style>
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
    <div style={{"position":"absolute","left":"62px","top":"54px","width":"280px","height":"352px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-1" onMouseEnter={o.profile.enter} onMouseLeave={leave} onClick={o.profile.click}>
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
    <div style={{"position":"absolute","left":"404px","top":"20px","width":"486px","height":"266px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-2" onMouseEnter={o.env.enter} onMouseLeave={leave} onClick={o.env.click}>
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
      <div style={{"position":"absolute","left":"1109px","top":"208px","width":"46px","height":"104px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease","transformOrigin":"top center"}} className="sw-hover-3" onMouseEnter={o.admin.enter} onMouseLeave={leave} onClick={o.admin.click}>
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
    <div style={{"position":"absolute","left":"1004px","top":"46px","width":"256px","height":"150px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-4" onMouseEnter={o.logout.enter} onMouseLeave={leave} onClick={o.logout.click}>
      { o.logout.show && (
<><div style={{"position":"absolute","left":"50%","top":"-6px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Log Out<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div></>
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
      { !isNeon && ( isWood ? (
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,#87593c,#583621)","borderRadius":"8px","boxShadow":"0 16px 30px rgba(0,0,0,.4)","display":"flex","alignItems":"center","justifyContent":"center","border":"2px solid #362012"}}>
          <div style={{"fontFamily":"sans-serif","fontWeight":"900","fontSize":"44px","letterSpacing":".12em","color":"#2a180d","textShadow":"0 2px 2px rgba(255,255,255,.15), inset 0 -2px 2px rgba(0,0,0,.3)"}}>EXIT</div>
        </div>
      ) : (
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(180deg,#e5e1da,#cfcac2)","borderRadius":"6px","boxShadow":"inset 0 0 0 1px #fff,0 12px 24px rgba(0,0,0,.3),0 0 60px rgba(219,80,60,.12)","display":"flex","alignItems":"center","justifyContent":"center"}}>
          <div style={{"position":"absolute","top":"-18px","left":"30px","width":"6px","height":"18px","background":"linear-gradient(90deg,#9a9a9a,#7a7a7a)"}}></div>
          <div style={{"position":"absolute","top":"-18px","right":"30px","width":"6px","height":"18px","background":"linear-gradient(90deg,#9a9a9a,#7a7a7a)"}}></div>
          <div style={{"position":"absolute","top":"-26px","left":"20px","width":"26px","height":"8px","background":"linear-gradient(180deg,#c0c0c0,#808080)","borderRadius":"3px"}}></div>
          <div style={{"position":"absolute","top":"-26px","right":"20px","width":"26px","height":"8px","background":"linear-gradient(180deg,#c0c0c0,#808080)","borderRadius":"3px"}}></div>
          <div style={{"position":"absolute","inset":"6px","background":"linear-gradient(180deg,#241c18,#16100d)","borderRadius":"3px","boxShadow":"inset 0 4px 10px rgba(0,0,0,.6)","display":"flex","alignItems":"center","justifyContent":"center","overflow":"hidden"}}>
            <div style={{"fontFamily":"sans-serif","fontWeight":"800","fontSize":"56px","letterSpacing":".08em","color":"#ff3a20","textShadow":"0 0 12px rgba(255,58,32,.7),0 0 24px rgba(255,58,32,.4)","position":"relative","zIndex":"2"}}>EXIT</div>
            <div style={{"position":"absolute","inset":"0","background":"linear-gradient(180deg,rgba(255,255,255,.08),transparent 40%)","zIndex":"3","pointerEvents":"none"}}></div>
          </div>
        </div>
      ))}
    </div>

    {/* WALL PHONE (Announcements — student view only; hangs in the same wall spot as the admin key) */}
    { showPhone && (
    <div style={{"position":"absolute","left":"1086px","top":"198px","width":"92px","height":"162px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-7" onMouseEnter={o.phone.enter} onMouseLeave={leave} onClick={o.phone.click}>
      { o.phone.show && (
      <div style={{"position":"absolute","left":"50%","top":"-10px","transform":"translate(-50%,-100%)","background":"#21282E","color":"#FEFAE0","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".05em","padding":"6px 12px","borderRadius":"8px","whiteSpace":"nowrap","boxShadow":"0 8px 18px rgba(0,0,0,.35)","zIndex":"40","pointerEvents":"none","animation":"sw-label .18s ease"}}>Announcements<span style={{"position":"absolute","left":"50%","bottom":"-5px","transform":"translateX(-50%) rotate(45deg)","width":"10px","height":"10px","background":"#21282E"}}></span></div>
      )}
      {/* ringing halo */}
      { phoneRinging && (
      <div style={{"position":"absolute","left":"50%","top":"52%","transform":"translate(-50%,-50%)","width":"128px","height":"128px","borderRadius":"50%","background":"radial-gradient(circle,rgba(242,193,78,.5),transparent 66%)","animation":"sw-lamppulse 1.5s ease-in-out infinite","pointerEvents":"none","zIndex":"-1"}}></div>
      )}
      {/* shaking phone body */}
      <div style={{"position":"absolute","inset":"0","transformOrigin":"50% 14%","animation": phoneRinging ? "sw-ring 1.4s ease-in-out infinite" : "none"}}>
        {/* dial body */}
        <div style={{"position":"absolute","left":"28px","top":"32px","width":"60px","height":"104px","borderRadius":"16px 16px 14px 14px","background":"linear-gradient(160deg,#d9a44a,#a97a2c)","boxShadow":"inset 0 3px 7px rgba(255,235,190,.5),inset 0 -6px 12px rgba(120,80,20,.4),0 10px 20px rgba(0,0,0,.3)"}}></div>
        {/* cradle hooks */}
        <div style={{"position":"absolute","left":"26px","top":"46px","width":"10px","height":"7px","borderRadius":"0 4px 4px 0","background":"linear-gradient(180deg,#8a6224,#5f4318)","zIndex":"2"}}></div>
        <div style={{"position":"absolute","left":"26px","top":"112px","width":"10px","height":"7px","borderRadius":"0 4px 4px 0","background":"linear-gradient(180deg,#8a6224,#5f4318)","zIndex":"2"}}></div>
        {/* sleek rotary dial */}
        <svg width="40" height="40" viewBox="0 0 40 40" style={{"position":"absolute","left":"38px","top":"56px","zIndex":"2","filter":"drop-shadow(0 2px 3px rgba(0,0,0,.3))"}}>
          <circle cx="20" cy="20" r="19" fill="#c69433"></circle>
          <circle cx="20" cy="20" r="19" fill="none" stroke="rgba(255,238,196,.6)" strokeWidth="1.1"></circle>
          <circle cx="20" cy="20" r="6.5" fill="#8f6e26"></circle>
          <g fill="#3a2c1c">
            <circle cx="20" cy="7" r="1.9"></circle>
            <circle cx="27.6" cy="9.5" r="1.9"></circle>
            <circle cx="32.4" cy="16" r="1.9"></circle>
            <circle cx="32.4" cy="24" r="1.9"></circle>
            <circle cx="27.6" cy="30.5" r="1.9"></circle>
            <circle cx="20" cy="33" r="1.9"></circle>
            <circle cx="12.4" cy="30.5" r="1.9"></circle>
            <circle cx="7.6" cy="24" r="1.9"></circle>
            <circle cx="7.6" cy="16" r="1.9"></circle>
            <circle cx="12.4" cy="9.5" r="1.9"></circle>
          </g>
          <rect x="31" y="22.5" width="6" height="4" rx="2" fill="#5f4318"></rect>
        </svg>
        {/* coiled cord */}
        <div style={{"position":"absolute","left":"20px","top":"123px","width":"26px","height":"12px","zIndex":"2","background":"repeating-linear-gradient(90deg,#6a4d2b 0 3px,rgba(0,0,0,0) 3px 6.5px)","borderRadius":"8px","transform":"rotate(-6deg)","opacity":".9"}}></div>
        {/* handset */}
        <div style={{"position":"absolute","left":"3px","top":"26px","width":"26px","height":"108px","zIndex":"3","transform":"rotate(-2deg)"}}>
          <div style={{"position":"absolute","left":"50%","top":"15px","bottom":"15px","transform":"translateX(-50%)","width":"11px","borderRadius":"7px","background":"linear-gradient(90deg,#b08a58,#6a4d2b)","boxShadow":"2px 0 4px rgba(0,0,0,.3),inset 1px 0 1px rgba(255,225,175,.35)"}}></div>
          <div style={{"position":"absolute","left":"50%","top":"0","transform":"translateX(-50%)","width":"25px","height":"27px","borderRadius":"13px","background":"linear-gradient(150deg,#b98f5a,#7a5a34)","boxShadow":"0 3px 5px rgba(0,0,0,.3),inset 0 2px 3px rgba(255,232,188,.42)"}}><div style={{"position":"absolute","left":"50%","top":"50%","transform":"translate(-50%,-50%)","width":"12px","height":"12px","borderRadius":"50%","background":"radial-gradient(circle,#3a2c1c 1px,transparent 1.6px)","backgroundSize":"3.6px 3.6px","opacity":".7"}}></div></div>
          <div style={{"position":"absolute","left":"50%","bottom":"0","transform":"translateX(-50%)","width":"25px","height":"27px","borderRadius":"13px","background":"linear-gradient(150deg,#b98f5a,#7a5a34)","boxShadow":"0 3px 5px rgba(0,0,0,.3),inset 0 2px 3px rgba(255,232,188,.42)"}}><div style={{"position":"absolute","left":"50%","top":"50%","transform":"translate(-50%,-50%)","width":"12px","height":"12px","borderRadius":"50%","background":"radial-gradient(circle,#3a2c1c 1px,transparent 1.6px)","backgroundSize":"3.6px 3.6px","opacity":".7"}}></div></div>
        </div>
      </div>
      {/* unread badge */}
      { notificationCount > 0 && (
      <div style={{"position":"absolute","right":"6px","top":"8px","minWidth":"22px","height":"22px","padding":"0 6px","borderRadius":"12px","background":"#c0492f","color":"#fff","fontFamily":"'DM Mono',monospace","fontSize":"12px","fontWeight":"500","display":"flex","alignItems":"center","justifyContent":"center","boxShadow":"0 3px 8px rgba(0,0,0,.4)","zIndex":"5"}}>{notificationCount}</div>
      )}
    </div>
    )}

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
    <div style={{"position":"absolute","left":"64px","bottom":"126px","width":"172px","height":"212px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease","pointerEvents":"auto"}} className="sw-hover-5" onMouseEnter={o.helpdesk.enter} onMouseLeave={leave} onClick={o.helpdesk.click}>
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
    <div style={{"position":"absolute","left":"228px","bottom":"162px","width":"138px","height":"172px","zIndex":"6","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-6" onMouseEnter={o.wellness.enter} onMouseLeave={leave} onClick={o.wellness.click}>
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
    <div style={{"position":"absolute","left":"392px","bottom":"128px","width":"108px","height":"226px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-7" onMouseEnter={o.progress.enter} onMouseLeave={leave} onClick={o.progress.click}>
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
      {/*  chia sprouts (hair) grow with progress — uses same buildChia logic  */}
      {(() => {
        const p = Math.max(0, Math.min(100, progress));
        const s = 0.9; // scale for desk (smaller)
        const g = 0.4 + 0.6 * (p / 100);
        const leafPhase = Math.max(0, (p - 25) / 75);
        const budPhase = Math.max(0, Math.min(1, (p - 50) / 25));
        const bloomPhase = Math.max(0, Math.min(1, (p - 75) / 25));
        const stemW = Math.max(2.2, 3.1 * s);
        const gap = (3 + leafPhase * 3 + bloomPhase * 2.5) * s;
        const defs = [
          { base: 42, rot: -18, lit: '#9bc04a', dark: '#5f7d1f', bloomAt: 92, flower: ['#ffc0dd', '#ef77aa'] },
          { base: 60, rot: -8, lit: '#a6cb55', dark: '#6B8E23', bloomAt: 82, flower: ['#ffd98f', '#efa63a'] },
          { base: 78, rot: 0, lit: '#b4d65f', dark: '#74992a', center: true, bloomAt: 75, flower: ['#ffb3d2', '#ef5f9c'] },
          { base: 58, rot: 8, lit: '#a6cb55', dark: '#6B8E23', bloomAt: 82, flower: ['#d3b3ff', '#9b6fe0'] },
          { base: 40, rot: 18, lit: '#9bc04a', dark: '#5f7d1f', bloomAt: 92, flower: ['#ffcaa0', '#ef8f5a'] },
        ];
        return (
          <div style={{"position":"absolute","left":"50%","bottom":"168px","transform":"translateX(-50%)","display":"flex","alignItems":"flex-end","justifyContent":"center","gap": gap + 'px',"transition":"gap .5s ease","overflow":"visible","pointerEvents":"none"}}>
            {defs.map((d, i) => {
              const stemH = Math.max(6, d.base * g * s);
              const sb = Math.max(0, Math.min(1, (p - d.bloomAt) / (100 - d.bloomAt)));
              const hasFlower = p >= d.bloomAt;
              const hasBud = !hasFlower && p >= 50;
              const fl = (9 + 15 * Math.max(0.14, sb)) * s;
              return (
                <div key={i} style={{
                  "position": "relative",
                  "width": stemW + 'px',
                  "height": stemH + 'px',
                  "borderRadius": stemW + 'px',
                  "background": `linear-gradient(180deg,${d.lit},${d.dark})`,
                  "transform": `rotate(${d.rot}deg)`,
                  "transformOrigin": "bottom center",
                  "transition": "height .5s ease",
                }}>
                  {/* Leaves */}
                  {p >= 25 && (() => {
                    const out = d.center ? 1 : (i < 2 ? -1 : 1);
                    const lsize = (5 + leafPhase * 8) * s * (d.center ? 0.82 : 1);
                    let n = 1;
                    if (p >= 42) n = 2;
                    if (p >= 62 && !d.center) n = 3;
                    const leaves = [];
                    for (let k = 0; k < n; k++) {
                      const side = (k % 2 === 0) ? out : -out;
                      const leafSize = lsize * (1 - k * 0.13);
                      const top = stemH * (0.26 + k * 0.17);
                      leaves.push(
                        <div key={'lf' + k} style={{
                          "position": "absolute",
                          "top": top + 'px',
                          ...(side < 0 ? {"right": "50%"} : {"left": "50%"}),
                          "width": leafSize + 'px',
                          "height": (leafSize * 0.58) + 'px',
                          "background": `linear-gradient(${side < 0 ? 130 : 230}deg,${d.lit},${d.dark})`,
                          "borderRadius": side < 0 ? '92% 8% 58% 42%' : '8% 92% 42% 58%',
                          "transform": `rotate(${side < 0 ? 36 : -36}deg)`,
                          "transformOrigin": side < 0 ? 'right bottom' : 'left bottom',
                          "boxShadow": 'inset 0 0 3px rgba(255,255,255,.3)',
                        }} />
                      );
                    }
                    return leaves;
                  })()}
                  {/* Flower */}
                  {hasFlower && (
                    <div style={{
                      "position": "absolute", "left": "50%",
                      "top": (-fl * 0.72) + 'px',
                      "width": fl + 'px', "height": fl + 'px',
                      "transform": "translateX(-50%)",
                    }}>
                      <div style={{"position":"absolute","left":"50%","top":"50%","width":(fl*(1.8+bloomPhase*0.9))+'px',"height":(fl*(1.8+bloomPhase*0.9))+'px',"borderRadius":"50%","background":`radial-gradient(circle,rgba(255,200,120,${0.4+bloomPhase*0.35}),rgba(255,170,90,0) 66%)`,"transform":"translate(-50%,-50%)","pointerEvents":"none"}} />
                      {[0,51,102,153,204,255,306].map(a => (
                        <div key={a} style={{"position":"absolute","left":"50%","top":"50%","width":(fl*0.5)+'px',"height":(fl*0.32)+'px',"borderRadius":"50%","background":`linear-gradient(180deg,${d.flower[0]},${d.flower[1]})`,"transform":`translate(-50%,-50%) rotate(${a}deg) translateY(-${fl*0.3}px)`,"boxShadow":`0 0 ${4+bloomPhase*5}px rgba(255,150,190,${0.4+bloomPhase*0.4})`}} />
                      ))}
                      <div style={{"position":"absolute","left":"50%","top":"50%","width":(fl*0.42)+'px',"height":(fl*0.42)+'px',"transform":"translate(-50%,-50%)","borderRadius":"50%","background":"radial-gradient(circle at 40% 35%,#ffe98a,#f0a733)","boxShadow":`0 0 ${6+bloomPhase*6}px rgba(255,214,96,${0.7+bloomPhase*0.3})`}} />
                    </div>
                  )}
                  {/* Bud */}
                  {hasBud && (
                    <div style={{"position":"absolute","left":"50%","top":(-((4+budPhase*5)*s)*0.6)+'px',"width":((4+budPhase*5)*s)+'px',"height":((4+budPhase*5)*s*1.3)+'px',"transform":"translateX(-50%)","borderRadius":"50% 50% 35% 35%","background": d.center ? 'linear-gradient(180deg,#f3b8cf,#c98caa)' : 'linear-gradient(180deg,#c3d86a,#8faa3a)'}} />
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>

    {/*  MONITOR (Workshops · AI Lab · Workforce)  */}
    <div style={{"position":"absolute","left":"524px","bottom":"140px","width":"330px","height":"248px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease", "pointerEvents":"auto"}} className="sw-hover-8" onMouseEnter={o.monitor.enter} onMouseLeave={leave} onClick={o.monitor.click}>
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
    <div style={{"position":"absolute","left":"874px","bottom":"126px","width":"152px","height":"168px","zIndex":"7","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-9" onMouseEnter={o.community.enter} onMouseLeave={leave} onClick={o.community.click}>
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
    <div style={{"position":"absolute","left":"1046px","bottom":"130px","width":"204px","height":"206px","zIndex":"9","cursor":"pointer","transition":"transform .28s ease,filter .28s ease"}} className="sw-hover-10" onMouseEnter={o.library.enter} onMouseLeave={leave} onClick={o.library.click}>
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
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} className="sw-hover-11" onClick={setDay}>☀</button>
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} className="sw-hover-12" onClick={setDusk}>◑</button>
    <button style={{"width":"32px","height":"32px","background":"rgba(253,221,154,.12)","color":"#FEFAE0","border":"1px solid rgba(253,221,154,.25)","borderRadius":"8px","fontFamily":"'DM Mono',monospace","fontSize":"15px","cursor":"pointer","transition":"background .2s"}} className="sw-hover-13" onClick={setNight}>☾</button>
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
      <button style={{"background":"none","border":"1px solid rgba(33,40,46,.2)","borderRadius":"8px","padding":"6px 13px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".08em","color":"#21282E","opacity":".75"}} className="sw-hover-14" onClick={goHub}>✕ Close screen</button>
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
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} className="sw-hover-15" onClick={openPilot}>
          <div style={{"width":"128px","height":"128px","borderRadius":"30px","background":"linear-gradient(160deg,#c89248,#8c6125)","boxShadow":"0 18px 32px rgba(0,0,0,.4),inset 0 4px 0 rgba(255,255,255,.32)","display":"flex","alignItems":"center","justifyContent":"center","position":"relative"}}>
            <div style={{"width":"46px","height":"8px","background":"#3a2a16","borderRadius":"3px","transform":"rotate(-42deg)","position":"absolute"}}></div>
            <div style={{"width":"8px","height":"30px","background":"#f3e6cf","borderRadius":"3px","transform":"rotate(-42deg)","position":"absolute","top":"30px","left":"42px"}}></div>
          </div>
          <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"14px","color":"#fff","letterSpacing":".05em","textAlign":"center","textShadow":"0 1px 3px rgba(0,0,0,.45)"}}>Pilot Workshops</span>
        </button>
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} className="sw-hover-16" onClick={openAi}>
          <div style={{"width":"128px","height":"128px","borderRadius":"30px","background":"linear-gradient(160deg,#4f93ad,#356074)","boxShadow":"0 18px 32px rgba(0,0,0,.4),inset 0 4px 0 rgba(255,255,255,.32)","display":"flex","alignItems":"center","justifyContent":"center"}}>
            <div style={{"width":"30px","height":"54px","border":"5px solid #eaf6fb","borderRadius":"0 0 16px 16px","borderTop":"none","position":"relative","background":"linear-gradient(180deg,transparent 42%,#9be0a8 42%)"}}><div style={{"position":"absolute","top":"-9px","left":"50%","width":"18px","height":"5px","background":"#eaf6fb","transform":"translateX(-50%)","borderRadius":"2px"}}></div></div>
          </div>
          <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"14px","color":"#fff","letterSpacing":".05em","textAlign":"center","textShadow":"0 1px 3px rgba(0,0,0,.45)"}}>AI Lab</span>
        </button>
        <button style={{"background":"none","border":"none","cursor":"pointer","display":"flex","flexDirection":"column","alignItems":"center","gap":"16px","width":"200px","transition":"transform .2s"}} className="sw-hover-17" onClick={openWf}>
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
      <button style={{"background":"rgba(255,255,255,.1)","border":"1px solid rgba(255,255,255,.25)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".06em","color":"#FEFAE0"}} className="sw-hover-18" onClick={goHub}>← Back to desk</button>
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
    <div style={{"display":"flex","gap":"10px","marginBottom":"14px","flexWrap":"wrap","justifyContent":"center"}}>
      <style>{`
        .sw-med-input::placeholder { color: rgba(255,255,255,0.6); }
        .sw-med-input::-webkit-outer-spin-button,
        .sw-med-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .sw-med-input[type=number] { -moz-appearance: textfield; }
        .sw-med-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12) !important; }
        @keyframes sw-med-spin { to { transform: rotate(360deg); } }
      `}</style>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med1}>1 min</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med5}>5 min</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"9px","padding":"8px 16px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={med10}>10 min</button>
      <form onSubmit={handleCustomMed} style={{"display":"flex","alignItems":"center","background": customMedLoading ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.16)","border": customMedLoading ? "1px solid rgba(255,255,255,.7)" : "1px solid rgba(255,255,255,.4)","borderRadius":"9px","backdropFilter":"blur(6px)","overflow":"hidden","transition":"background .2s, border .2s"}}>
        <input 
          className="sw-med-input"
          type="number" 
          value={customMedTime} 
          onChange={(e) => setCustomMedTime(e.target.value)} 
          placeholder="min" 
          disabled={customMedLoading}
          style={{"background":"transparent","border":"none","padding":"8px 12px","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#fff","width":"72px","outline":"none","textAlign":"center","opacity": customMedLoading ? 0.5 : 1}}
          min="1"
        />
        <div style={{"width":"1px","height":"20px","background":"rgba(255,255,255,.3)"}}></div>
        <button
          type="submit"
          className="sw-med-btn"
          disabled={customMedLoading || !customMedTime}
          style={{
            background: customMedLoading ? "rgba(255,255,255,.15)" : "transparent",
            border: "none",
            padding: "8px 14px",
            cursor: customMedLoading ? "wait" : "pointer",
            fontFamily: "'DM Mono',monospace",
            fontSize: "12px",
            color: "#fff",
            fontWeight: "600",
            transition: "background .2s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: !customMedTime && !customMedLoading ? 0.5 : 1,
          }}
        >
          {customMedLoading ? (
            <>
              <span style={{
                display: "inline-block",
                width: "11px",
                height: "11px",
                border: "2px solid rgba(255,255,255,.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "sw-med-spin .65s linear infinite",
                flexShrink: 0,
              }} />
              Setting
            </>
          ) : "Set"}
        </button>
      </form>
    </div>
    {/*  play controls  */}
    <div style={{"display":"flex","gap":"12px","alignItems":"center","marginBottom":"22px"}}>
      <button style={{"background":"#FEFAE0","border":"none","borderRadius":"11px","padding":"13px 34px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontWeight":"500","fontSize":"14px","letterSpacing":".08em","color":"#21282E","boxShadow":"0 8px 18px rgba(0,0,0,.25)"}} onClick={medToggle}>{medPlayLabel}</button>
      <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"11px","padding":"13px 18px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={medReset}>Reset</button>
      {!hasDbTones && (
        <button style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.4)","borderRadius":"11px","padding":"13px 18px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px","color":"#fff","backdropFilter":"blur(6px)"}} onClick={medToneToggle}>{medToneLabel}</button>
      )}
    </div>

    {/* Dynamic tone selector — shown when DB tones are loaded */}
    {hasDbTones && (
    <div style={{"display":"flex","gap":"8px","alignItems":"center","marginBottom":"22px","flexWrap":"wrap","justifyContent":"center"}}>
      <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".2em","color":"#fff","opacity":".7"}}>TONES</span>
      {wellnessTones.map(tone => (
        <button key={tone.id} onClick={() => playTone(tone)} style={{"background": activeToneId === tone.id && medTone ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.14)","border": activeToneId === tone.id && medTone ? "1.5px solid rgba(255,255,255,.8)" : "1px solid rgba(255,255,255,.3)","borderRadius":"10px","padding":"8px 14px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","color":"#fff","backdropFilter":"blur(6px)","transition":"all .2s ease","boxShadow": activeToneId === tone.id && medTone ? "0 0 12px rgba(255,255,255,.2)" : "none"}}>
          {activeToneId === tone.id && medTone ? '♪ ' : ''}{tone.name}
        </button>
      ))}
      {medTone && (
        <button onClick={() => { if (_stopToneRef.current) _stopToneRef.current(); setMedTone(false); setActiveToneId(null); }} style={{"background":"rgba(255,80,80,.25)","border":"1px solid rgba(255,100,100,.5)","borderRadius":"10px","padding":"8px 12px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","color":"#fff","backdropFilter":"blur(6px)"}}>Stop</button>
      )}
    </div>
    )}

    {/*  ambient theme swatches  */}
    <div style={{"display":"flex","gap":"12px","alignItems":"center","marginBottom":"24px"}}>
      <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".2em","color":"#fff","opacity":".7"}}>AMBIENT</span>
      <button title="Desert Dawn" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#F7CDA6,#DB9B2F)"}} onClick={medTheme0}></button>
      <button title="Salton Dusk" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#E7A07E,#5A4A6A)"}} onClick={medTheme1}></button>
      <button title="Sage Calm" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#9DB39A,#2D4B3E)"}} onClick={medTheme2}></button>
      <button title="Night Field" style={{"width":"30px","height":"30px","borderRadius":"50%","border":"2px solid rgba(255,255,255,.7)","cursor":"pointer","background":"linear-gradient(140deg,#4A5A6E,#21282E)"}} onClick={medTheme3}></button>
    </div>

    {/*  resources — dynamic from DB  */}
    <div style={{"display":"flex","gap":"12px","flexWrap":"wrap","justifyContent":"center","maxWidth":"680px"}}>
      {wellnessResources.map(r => (
        <div key={r.slot_key} style={{"background":"rgba(255,255,255,.16)","border":"1px solid rgba(255,255,255,.35)","borderRadius":"12px","padding":"12px 16px","backdropFilter":"blur(6px)","color":"#fff","width":"200px"}}>
          <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","opacity":".7","marginBottom":"4px"}}>{r.label}</div>
          <div style={{"fontSize":"14px","fontWeight":"600"}}>{r.title}</div>
          <div style={{"fontSize":"12px","opacity":".85","lineHeight":"1.4"}}>{r.description}</div>
        </div>
      ))}
    </div>
  </div>
  </>
)}

  {/*  =================== PROGRESS & GENERATIONS ===================  */}
  { isProgress && (
<>
  <div data-screen-label="Progress & Milestones" style={{"position":"fixed","inset":"0","zIndex":"100","overflowY":"auto","background":"linear-gradient(180deg,#f6ddc4,#e8c2a0)","animation":"sw-fade .3s ease","fontFamily":"'Exo',sans-serif"}}>
    <div style={{"maxWidth":"920px","margin":"0 auto","padding":"30px 26px 60px"}}>
      <button style={{"background":"#21282E","border":"none","borderRadius":"10px","padding":"9px 15px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".06em","color":"#FEFAE0","marginBottom":"24px"}} onClick={goHub}>← Back to desk</button>

      <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"12px","letterSpacing":".3em","color":"#8a5a2e"}}>PROGRESS &amp; MILESTONES</div>
      <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"12px","marginBottom":"6px"}}>
        <h1 style={{"margin":"4px 0 0","fontSize":"34px","fontWeight":"700","color":"#3a2412"}}>Grow your chia.</h1>
        {/* Cohort Switcher */}
        {cohortProgress && cohortProgress.length > 1 && selectedCohortId && onCohortChange && (
          <CohortSwitcher
            cohorts={cohortProgress}
            selectedId={selectedCohortId}
            onSelect={onCohortChange}
            globalEngagement={globalEngagement}
          />
        )}
      </div>
      <p style={{"margin":"0 0 24px","fontSize":"14px","lineHeight":"1.6","color":"#6b4a2a","maxWidth":"620px"}}>Your chia grows two ways: an admin approves each of your three portfolio deliverables (25% each), and you earn small rewards for using the hub (capped at 25%). Students can't grow it directly — progress is earned.</p>

      {/*  progress meter + chia  */}
      <div style={{"display":"flex","gap":"24px","flexWrap":"wrap","alignItems":"stretch","marginBottom":"30px","opacity": isProgressTransitioning ? "0.5" : "1","transition":"opacity 0.3s ease"}}>
        <div style={{"flex":"1","minWidth":"280px","background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.12)","borderRadius":"16px","padding":"22px","boxShadow":"0 12px 26px rgba(0,0,0,.08)"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"baseline","marginBottom":"14px"}}>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".18em","color":"#8a5a2e"}}>OVERALL PROGRESS</span>
            <span style={{"fontSize":"32px","fontWeight":"700","color":"#3a2412"}}>{isGuest ? `${globalEngagement || 0}%` : progressPct}</span>
          </div>
          <div style={{"height":"18px","background":"rgba(33,40,46,.08)","borderRadius":"10px","overflow":"hidden","marginBottom":"18px"}}>
            <div style={isGuest ? { width: `${globalEngagement || 0}%`, height: '100%', background: 'linear-gradient(90deg, #417C98, #5aA0C0)', borderRadius: '10px', transition: 'width 0.6s ease' } : progressBarStyle}></div>
          </div>
          {/* Deliverables + Engagement breakdown */}
          <div style={{"display":"flex","gap":"10px","marginBottom":"12px"}}>
            {!isGuest && (
            <div style={{"flex":"1","background":"rgba(46,85,52,.1)","borderRadius":"11px","padding":"12px 14px"}}>
              <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".12em","color":"#2E5534"}}>DELIVERABLES</div>
              <div style={{"fontSize":"22px","fontWeight":"700","color":"#2E5534","marginTop":"3px"}}>{Math.min(progress - (globalEngagement || 0), 75)}% <span style={{"fontSize":"12px","fontWeight":"400","color":"#6b8a6f"}}>/ 75%</span></div>
            </div>
            )}
            <div style={{"flex":"1","background":"rgba(65,124,152,.1)","borderRadius":"11px","padding":"12px 14px"}}>
              <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".12em","color":"#356074"}}>ENGAGEMENT</div>
              <div style={{"fontSize":"22px","fontWeight":"700","color":"#356074","marginTop":"3px"}}>{globalEngagement || 0}% <span style={{"fontSize":"12px","fontWeight":"400","color":"#6a8a9a"}}>/ 25%</span></div>
            </div>
          </div>
          <div style={{"fontSize":"12px","color":"#7a5a3a","lineHeight":"1.5"}}>
            This meter is shared with the chia statue on your desk — its sprouts grow taller as your total climbs.
          </div>
        </div>
        {/*  golden chia statue visual  */}
        <div style={{"width":"200px","background":"#FEFAE0","border":"1.5px solid rgba(33,40,46,.12)","borderRadius":"16px","padding":"18px","boxShadow":"0 12px 26px rgba(0,0,0,.08)","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"flex-end"}}>
          <div style={{"position":"relative","width":"150px","height":"250px"}}>
            {/* Shadow */}
            <div style={{"position":"absolute","left":"50%","bottom":"0","transform":"translateX(-50%)","width":"120px","height":"16px","background":"radial-gradient(ellipse,rgba(0,0,0,.22),transparent 70%)","filter":"blur(3px)"}}></div>
            {/* Plinth base */}
            <div style={{"position":"absolute","left":"50%","bottom":"6px","transform":"translateX(-50%)","width":"104px","height":"22px","background":"linear-gradient(180deg,#4a3f33,#33291f)","borderRadius":"4px","boxShadow":"0 8px 13px rgba(0,0,0,.28),inset 0 3px 0 rgba(255,230,190,.18)"}}></div>
            {/* Plinth upper */}
            <div style={{"position":"absolute","left":"50%","bottom":"26px","transform":"translateX(-50%)","width":"82px","height":"20px","background":"linear-gradient(180deg,#5a4a3a,#3f3326)","borderRadius":"3px","boxShadow":"inset 0 2px 0 rgba(255,230,190,.22)"}}></div>
            {/* Award nameplate */}
            <div style={{"position":"absolute","left":"50%","bottom":"31px","transform":"translateX(-50%)","width":"56px","height":"11px","background":"linear-gradient(180deg,#ecce7c,#bd9637)","borderRadius":"2px","boxShadow":"0 1px 2px rgba(0,0,0,.3)"}}></div>
            {/* Shoulders / bust */}
            <div style={{"position":"absolute","left":"50%","bottom":"44px","transform":"translateX(-50%)","width":"104px","height":"70px","background":"linear-gradient(160deg,#d8b969,#9c7a2c)","borderRadius":"44px 44px 10px 10px","clipPath":"polygon(33% 0,67% 0,100% 100%,0 100%)","boxShadow":"inset -7px -5px 13px rgba(86,62,18,.5),inset 6px 5px 9px rgba(255,242,205,.28)"}}></div>
            {/* Neck */}
            <div style={{"position":"absolute","left":"50%","bottom":"96px","transform":"translateX(-50%)","width":"26px","height":"28px","background":"linear-gradient(180deg,#c9a24b,#9c7a2c)","boxShadow":"inset -3px 0 5px rgba(86,62,18,.4)"}}></div>
            {/* Head */}
            <div style={{"position":"absolute","left":"50%","bottom":"116px","transform":"translateX(-50%)","width":"56px","height":"66px","borderRadius":"48% 48% 44% 44%","background":"linear-gradient(160deg,#dcc079,#a8842f)","boxShadow":"inset -5px -6px 13px rgba(86,62,18,.5),inset 5px 5px 9px rgba(255,242,205,.4)"}}>
              {/* Nose */}
              <div style={{"position":"absolute","left":"50%","top":"29px","width":"5px","height":"14px","transform":"translateX(-50%)","background":"linear-gradient(180deg,#bb9540,#8f6e26)","borderRadius":"3px"}}></div>
              {/* Eyes */}
              <div style={{"position":"absolute","left":"13px","top":"27px","width":"8px","height":"4px","borderRadius":"50%","background":"rgba(86,62,18,.45)"}}></div>
              <div style={{"position":"absolute","right":"13px","top":"27px","width":"8px","height":"4px","borderRadius":"50%","background":"rgba(86,62,18,.45)"}}></div>
            </div>
            {/* Chia sprouts with leaves and flowers (matches reference buildChia logic) */}
            {(() => {
              const p = Math.max(0, Math.min(100, progress));
              const s = 1.1; // scale factor for big display
              const g = 0.4 + 0.6 * (p / 100);
              const leafPhase = Math.max(0, (p - 25) / 75);
              const budPhase = Math.max(0, Math.min(1, (p - 50) / 25));
              const bloomPhase = Math.max(0, Math.min(1, (p - 75) / 25));
              const stemW = Math.max(2.2, 3.1 * s);
              const gap = (3 + leafPhase * 3 + bloomPhase * 2.5) * s;
              const defs = [
                { base: 42, rot: -18, lit: '#9bc04a', dark: '#5f7d1f', bloomAt: 92, flower: ['#ffc0dd', '#ef77aa'] },
                { base: 60, rot: -8, lit: '#a6cb55', dark: '#6B8E23', bloomAt: 82, flower: ['#ffd98f', '#efa63a'] },
                { base: 78, rot: 0, lit: '#b4d65f', dark: '#74992a', center: true, bloomAt: 75, flower: ['#ffb3d2', '#ef5f9c'] },
                { base: 58, rot: 8, lit: '#a6cb55', dark: '#6B8E23', bloomAt: 82, flower: ['#d3b3ff', '#9b6fe0'] },
                { base: 40, rot: 18, lit: '#9bc04a', dark: '#5f7d1f', bloomAt: 92, flower: ['#ffcaa0', '#ef8f5a'] },
              ];

              return (
                <div style={{"position":"absolute","left":"50%","bottom":"176px","transform":"translateX(-50%)","display":"flex","alignItems":"flex-end","justifyContent":"center","gap": gap + 'px',"transition":"gap .5s ease","overflow":"visible","pointerEvents":"none"}}>
                  {defs.map((d, i) => {
                    const stemH = Math.max(6, d.base * g * s);
                    const sb = Math.max(0, Math.min(1, (p - d.bloomAt) / (100 - d.bloomAt)));
                    const hasFlower = p >= d.bloomAt;
                    const hasBud = !hasFlower && p >= 50;
                    const fl = (9 + 15 * Math.max(0.14, sb)) * s;

                    return (
                      <div key={i} style={{
                        "position": "relative",
                        "width": stemW + 'px',
                        "height": stemH + 'px',
                        "borderRadius": stemW + 'px',
                        "background": `linear-gradient(180deg,${d.lit},${d.dark})`,
                        "transform": `rotate(${d.rot}deg)`,
                        "transformOrigin": "bottom center",
                        "transition": "height .5s ease",
                      }}>
                        {/* Leaves */}
                        {p >= 25 && (() => {
                          const out = d.center ? 1 : (i < 2 ? -1 : 1);
                          const lsize = (5 + leafPhase * 8) * s * (d.center ? 0.82 : 1);
                          let n = 1;
                          if (p >= 42) n = 2;
                          if (p >= 62 && !d.center) n = 3;
                          const leaves = [];
                          for (let k = 0; k < n; k++) {
                            const side = (k % 2 === 0) ? out : -out;
                            const leafSize = lsize * (1 - k * 0.13);
                            const top = stemH * (0.26 + k * 0.17);
                            leaves.push(
                              <div key={'lf' + k} style={{
                                "position": "absolute",
                                "top": top + 'px',
                                ...(side < 0 ? {"right": "50%"} : {"left": "50%"}),
                                "width": leafSize + 'px',
                                "height": (leafSize * 0.58) + 'px',
                                "background": `linear-gradient(${side < 0 ? 130 : 230}deg,${d.lit},${d.dark})`,
                                "borderRadius": side < 0 ? '92% 8% 58% 42%' : '8% 92% 42% 58%',
                                "transform": `rotate(${side < 0 ? 36 : -36}deg)`,
                                "transformOrigin": side < 0 ? 'right bottom' : 'left bottom',
                                "boxShadow": 'inset 0 0 3px rgba(255,255,255,.3)',
                              }} />
                            );
                          }
                          return leaves;
                        })()}
                        {/* Flower */}
                        {hasFlower && (
                          <div style={{
                            "position": "absolute",
                            "left": "50%",
                            "top": (-fl * 0.72) + 'px',
                            "width": fl + 'px',
                            "height": fl + 'px',
                            "transform": "translateX(-50%)",
                          }}>
                            {/* Glow */}
                            <div style={{
                              "position": "absolute", "left": "50%", "top": "50%",
                              "width": (fl * (1.8 + bloomPhase * 0.9)) + 'px',
                              "height": (fl * (1.8 + bloomPhase * 0.9)) + 'px',
                              "borderRadius": "50%",
                              "background": `radial-gradient(circle,rgba(255,200,120,${0.4 + bloomPhase * 0.35}),rgba(255,170,90,0) 66%)`,
                              "transform": "translate(-50%,-50%)",
                              "pointerEvents": "none",
                            }} />
                            {/* Petals */}
                            {[0, 51, 102, 153, 204, 255, 306].map(a => (
                              <div key={a} style={{
                                "position": "absolute", "left": "50%", "top": "50%",
                                "width": (fl * 0.5) + 'px',
                                "height": (fl * 0.32) + 'px',
                                "borderRadius": "50%",
                                "background": `linear-gradient(180deg,${d.flower[0]},${d.flower[1]})`,
                                "transform": `translate(-50%,-50%) rotate(${a}deg) translateY(-${fl * 0.3}px)`,
                                "boxShadow": `0 0 ${4 + bloomPhase * 5}px rgba(255,150,190,${0.4 + bloomPhase * 0.4})`,
                              }} />
                            ))}
                            {/* Core */}
                            <div style={{
                              "position": "absolute", "left": "50%", "top": "50%",
                              "width": (fl * 0.42) + 'px',
                              "height": (fl * 0.42) + 'px',
                              "transform": "translate(-50%,-50%)",
                              "borderRadius": "50%",
                              "background": "radial-gradient(circle at 40% 35%,#ffe98a,#f0a733)",
                              "boxShadow": `0 0 ${6 + bloomPhase * 6}px rgba(255,214,96,${0.7 + bloomPhase * 0.3})`,
                            }} />
                          </div>
                        )}
                        {/* Bud (pre-flower stage) */}
                        {hasBud && (
                          <div style={{
                            "position": "absolute",
                            "left": "50%",
                            "top": (-((4 + budPhase * 5) * s) * 0.6) + 'px',
                            "width": ((4 + budPhase * 5) * s) + 'px',
                            "height": ((4 + budPhase * 5) * s * 1.3) + 'px',
                            "transform": "translateX(-50%)",
                            "borderRadius": "50% 50% 35% 35%",
                            "background": d.center ? 'linear-gradient(180deg,#f3b8cf,#c98caa)' : 'linear-gradient(180deg,#c3d86a,#8faa3a)',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STEWARDWORKS DOCUMENTS SECTION               */}
      {/* ============================================ */}
      {!isGuest && programDocuments.length > 0 && (
        <div style={{ marginBottom: '30px', marginTop: '10px' }}>
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>STEWARDWORKS DOCUMENTS</span>
          </div>

          {/* Toggle Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'center' }}>
            {programDocuments.map((doc, idx) => {
              const isActive = activePdfToggle === doc.id;
              // Alternate colors between brown and green theme
              const isEven = idx % 2 === 0;
              const borderColor = isActive 
                ? (isEven ? '#8a5a2e' : '#2E5534')
                : (isEven ? 'rgba(138,90,46,.3)' : 'rgba(46,85,52,.3)');
              const bgColor = isActive
                ? (isEven ? 'rgba(138,90,46,.12)' : 'rgba(46,85,52,.12)')
                : (isEven ? 'rgba(254,250,224,0.6)' : 'rgba(234,242,235,0.6)');
              const textColor = isActive
                ? (isEven ? '#5a3a1a' : '#1a3a1e')
                : (isEven ? '#7a5a3a' : '#3a5a4a');
              const icon = isEven ? '📄' : '📜';

              return (
                <button
                  key={doc.id}
                  onClick={() => setActivePdfToggle(isActive ? null : doc.id)}
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '11px',
                    letterSpacing: '.08em',
                    fontWeight: 700,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: `1.5px solid ${borderColor}`,
                    background: bgColor,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  {icon} {doc.label}
                  <span style={{ fontSize: '9px', opacity: 0.7 }}>{isActive ? '▲' : '▼'}</span>
                </button>
              );
            })}
          </div>

          {/* PDF Viewer Panel */}
          {activePdfToggle !== null && (() => {
            const activeDoc = programDocuments.find(d => d.id === activePdfToggle);
            if (!activeDoc) return null;
            
            const idx = programDocuments.findIndex(d => d.id === activePdfToggle);
            const isEven = idx % 2 === 0;
            const pdfSrc = activeDoc.pdf_url;
            const pdfName = `${activeDoc.label.replace(/\s+/g, '-')}.pdf`;
            const accentColor = isEven ? '#8a5a2e' : '#2E5534';
            const bgColor = isEven ? 'rgba(138,90,46,.06)' : 'rgba(46,85,52,.06)';
            const borderColor = isEven ? 'rgba(138,90,46,.2)' : 'rgba(46,85,52,.2)';

            return (
              <div style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: '14px',
                overflow: 'hidden',
                animation: 'fadeIn .2s ease',
              }}>
                {/* Header bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${borderColor}`,
                  flexWrap: 'wrap',
                  gap: '10px',
                }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.12em', color: accentColor, fontWeight: 700 }}>
                    {activeDoc.label}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={pdfSrc}
                      download={pdfName}
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: accentColor,
                        color: '#fff',
                        borderRadius: '8px',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '11px',
                        letterSpacing: '.06em',
                        fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      ⬇ Download / Print
                    </a>
                    <a
                      href={pdfSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 14px',
                        background: 'transparent',
                        color: accentColor,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: '8px',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ↗ Open
                    </a>
                  </div>
                </div>
                {/* iframe PDF preview */}
                <iframe
                  src={`${pdfSrc}#toolbar=0`}
                  title={activeDoc.label}
                  style={{
                    width: '100%',
                    height: '520px',
                    border: 'none',
                    display: 'block',
                    background: '#fff',
                  }}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* CERTIFICATE SECTION - based on selected cohort only (hidden for guests) */}
      {!isGuest && cohortProgress && cohortProgress.length > 0 && selectedCohortId && (() => {
        const selectedCohort = cohortProgress.find(c => c.cohortId === selectedCohortId);
        if (!selectedCohort) return null;
        const isCertEligible = selectedCohort.deliverables.percentage >= 75;

        return (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#2E5534' }}>CERTIFICATE</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#4a8a5a' }}>
                Deliverables: {selectedCohort.deliverables.percentage}% / 75%
              </span>
            </div>

            {isCertEligible ? (
              <div style={{ padding: '24px', background: 'linear-gradient(135deg,rgba(46,85,52,.08),rgba(116,240,160,.06))', border: '2px solid rgba(46,85,52,.2)', borderRadius: '16px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#2E5534,#4a8a5a)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📜</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2E5534', fontSize: '17px' }}>Congratulations!</div>
                    <div style={{ fontSize: '13px', color: '#4a6a4a' }}>
                      You've completed {selectedCohort.cohortName} and earned your certificate.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      if (isGeneratingPreview || isDownloadingPDF) return;
                      setIsGeneratingPreview(true);
                      try {
                        const playerName = user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'Steward');
                        const cohortName = selectedCohort.cohortName || 'workshop';
                        let certSettings = { certOrg: 'StewardWorks', certFacilitator: 'Marisol Vega', certFacTitle: 'Program Director', certSponsor: 'Dr. Jane Smith', certSponsorOrg: 'SDSU Research Foundation', certMessage: '' };
                        try { const certRes = await fetch(`/api/workshops/${selectedCohortId}/certificate-settings`); if (certRes.ok) { const settings = await certRes.json(); certSettings = { ...certSettings, ...settings }; } } catch (e) {}
                        let charKey = 'quest', charAccent = '#ffd23f', charGear = 'none', charOutfit = 'plain', characterSpriteUri = '';
                        try { const charRes = await fetch(`/api/workshops/${selectedCohortId}/character`); if (charRes.ok) { const charData = await charRes.json(); if (charData.character_key) charKey = charData.character_key; if (charData.accent_color) charAccent = charData.accent_color; if (charData.gear) charGear = charData.gear; if (charData.outfit) charOutfit = charData.outfit; } } catch (e) {}
                        try { const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite'); characterSpriteUri = buildSpriteUri(charKey, charAccent, { gear: charGear, outfit: charOutfit }); } catch (e) {}
                        const { buildClientCertHTML } = await import('@/components/workshops/journey/VictoryScreen');
                        // Fetch user's actual submission titles
                        let deliverables = [{ title: 'DAY 1 DELIVERABLE', url: '' }, { title: 'DAY 2 DELIVERABLE', url: '' }, { title: 'DAY 3 DELIVERABLE', url: '' }];
                        try { const subRes = await fetch(`/api/workshops/${selectedCohortId}/submissions`); if (subRes.ok) { const subData = await subRes.json(); if (subData.submissions && subData.submissions.length > 0) { deliverables = subData.submissions.slice(0, 3).map((s: any, idx: number) => ({ title: (s.title || s.day_title || `DAY ${idx + 1} DELIVERABLE`).toUpperCase(), url: '' })); } } } catch (e) {}
                        const html = buildClientCertHTML({ playerName, characterKey: charKey, certOrg: certSettings.certOrg, certFacilitator: certSettings.certFacilitator, certFacTitle: certSettings.certFacTitle, certSponsor: certSettings.certSponsor, certSponsorOrg: certSettings.certSponsorOrg, certMessage: certSettings.certMessage, cohortName, deliverables, characterSpriteUri });
                        setCertPreviewHtml(html);
                        setShowCertPreview(true);
                      } catch (err) {
                        console.error('Preview error:', err);
                      } finally {
                        setIsGeneratingPreview(false);
                      }
                    }}
                    disabled={isGeneratingPreview || isDownloadingPDF}
                    style={{ background: 'transparent', color: '#2E5534', border: '2px solid #2E5534', borderRadius: '10px', padding: '11px 20px', cursor: isGeneratingPreview || isDownloadingPDF ? 'wait' : 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', fontWeight: 700, opacity: (isGeneratingPreview || isDownloadingPDF) ? 0.6 : 1 }}
                  >
                    {isGeneratingPreview ? '⏳ PREPARING...' : '◆ PREVIEW CERTIFICATE'}
                  </button>
                  <button
                    onClick={async () => {
                      if (isDownloadingPDF) return;
                      setIsDownloadingPDF(true);
                      try {
                        const playerName = user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'Steward');
                        const cohortName = selectedCohort.cohortName || 'workshop';
                        
                        // Fetch certificate settings for this cohort
                        let certSettings = {
                          certOrg: 'StewardWorks',
                          certFacilitator: 'Marisol Vega',
                          certFacTitle: 'Program Director',
                          certSponsor: 'Dr. Jane Smith',
                          certSponsorOrg: 'SDSU Research Foundation',
                          certMessage: ''
                        };
                        try {
                          const certRes = await fetch(`/api/workshops/${selectedCohortId}/certificate-settings`);
                          if (certRes.ok) {
                            const settings = await certRes.json();
                            certSettings = {
                              certOrg: settings.certOrg || certSettings.certOrg,
                              certFacilitator: settings.certFacilitator || certSettings.certFacilitator,
                              certFacTitle: settings.certFacTitle || certSettings.certFacTitle,
                              certSponsor: settings.certSponsor || certSettings.certSponsor,
                              certSponsorOrg: settings.certSponsorOrg || certSettings.certSponsorOrg,
                              certMessage: settings.certMessage || ''
                            };
                          }
                        } catch (e) { /* use defaults */ }

                        // Generate pixel avatar sprite URI
                        let characterSpriteUri = '';
                        let charKey = 'quest';
                        let charAccent = '#ffd23f';
                        let charGear = 'none';
                        let charOutfit = 'plain';
                        try {
                          const charRes = await fetch(`/api/workshops/${selectedCohortId}/character`);
                          if (charRes.ok) {
                            const charData = await charRes.json();
                            if (charData.character_key) charKey = charData.character_key;
                            if (charData.accent_color) charAccent = charData.accent_color;
                            if (charData.gear) charGear = charData.gear;
                            if (charData.outfit) charOutfit = charData.outfit;
                          }
                        } catch (e) { /* use defaults */ }
                        try {
                          const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite');
                          characterSpriteUri = buildSpriteUri(charKey, charAccent, { gear: charGear, outfit: charOutfit });
                        } catch (e) { /* skip sprite if unavailable */ }

                        // Client-side PDF generation (same as VictoryScreen)
                        const [html2canvasModule, jsPDFModule] = await Promise.all([
                          import('html2canvas'),
                          import('jspdf')
                        ]);
                        const html2canvas = html2canvasModule.default;
                        const { jsPDF } = jsPDFModule;
                        const { buildClientCertHTML } = await import('@/components/workshops/journey/VictoryScreen');

                        const container = document.createElement('div');
                        container.style.position = 'fixed';
                        container.style.left = '-9999px';
                        container.style.top = '0';
                        container.style.width = '794px';
                        container.style.zIndex = '-1';
                        container.innerHTML = buildClientCertHTML({
                          playerName,
                          characterKey: charKey || 'quest',
                          certOrg: certSettings.certOrg,
                          certFacilitator: certSettings.certFacilitator,
                          certFacTitle: certSettings.certFacTitle,
                          certSponsor: certSettings.certSponsor,
                          certSponsorOrg: certSettings.certSponsorOrg,
                          certMessage: certSettings.certMessage,
                          deliverables: await (async () => {
                            // Fetch user's actual submission titles for this cohort
                            try {
                              const subRes = await fetch(`/api/workshops/${selectedCohortId}/submissions`);
                              if (subRes.ok) {
                                const subData = await subRes.json();
                                if (subData.submissions && subData.submissions.length > 0) {
                                  return subData.submissions.slice(0, 3).map((s: any, idx: number) => ({
                                    title: (s.title || s.day_title || `DAY ${idx + 1} DELIVERABLE`).toUpperCase(),
                                    url: ''
                                  }));
                                }
                              }
                            } catch (e) { /* fall through to defaults */ }
                            return [
                              { title: 'DAY 1 DELIVERABLE', url: '' },
                              { title: 'DAY 2 DELIVERABLE', url: '' },
                              { title: 'DAY 3 DELIVERABLE', url: '' }
                            ];
                          })(),
                          characterSpriteUri
                        });
                        document.body.appendChild(container);

                        await document.fonts.ready;
                        const images = container.querySelectorAll('img');
                        await Promise.all(Array.from(images).map(img => 
                          new Promise<void>((resolve) => {
                            if (img.complete) { resolve(); return; }
                            img.onload = () => resolve();
                            img.onerror = () => resolve();
                          })
                        ));
                        await new Promise(resolve => setTimeout(resolve, 300));

                        const contentHeight = container.scrollHeight || container.offsetHeight || 1123;
                        const canvas = await html2canvas(container, {
                          scale: 2,
                          useCORS: true,
                          backgroundColor: '#f7f1e0',
                          width: 794,
                          height: contentHeight,
                        });
                        document.body.removeChild(container);

                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                        const pageWidth = 210;
                        const pageHeight = 297;
                        const imgAspect = canvas.width / canvas.height;
                        let imgW = pageWidth;
                        let imgH = pageWidth / imgAspect;
                        if (imgH > pageHeight) { imgH = pageHeight; imgW = pageHeight * imgAspect; }
                        const xOffset = (pageWidth - imgW) / 2;
                        pdf.addImage(imgData, 'PNG', xOffset, 0, imgW, imgH);
                        pdf.save(`certificate-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
                      } catch (err) {
                        console.error('Certificate download error:', err);
                        alert('Failed to download certificate. Check browser console for details.');
                      } finally {
                        setIsDownloadingPDF(false);
                      }
                    }}
                    disabled={isDownloadingPDF}
                    style={{ background: '#FEFAE0', color: '#2E5534', border: '2px solid #2E5534', borderRadius: '10px', padding: '11px 20px', cursor: isDownloadingPDF ? 'wait' : 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', fontWeight: 700, opacity: isDownloadingPDF ? 0.6 : 1 }}
                  >
                    {isDownloadingPDF ? '⏳ DOWNLOADING...' : '⛊ DOWNLOAD CERTIFICATE'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#7a5a3a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontWeight: 600, color: '#3a2412', marginBottom: '8px' }}>Certificate Locked</div>
                <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                  Complete all 3 deliverables (75%) in Pilot Workshops to unlock your certificate.
                  <br />
                  <span style={{ fontSize: '11px', color: '#9a7a5a', fontStyle: 'italic' }}>
                    (Engagement activities don't affect certificate eligibility)
                  </span>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#7a5a3a' }}>
                    <span style={{ fontWeight: 600 }}>{selectedCohort.cohortName}:</span>
                    <div style={{ width: '100px', height: '8px', background: 'rgba(0,0,0,.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(selectedCohort.deliverables.percentage / 75) * 100}%`, height: '100%', background: '#c9a24a', borderRadius: '4px' }} />
                    </div>
                    <span>{selectedCohort.deliverables.percentage}% / 75%</span>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* WORKFORCE PATHWAY PROGRESS */}
      {(() => {
        const getAnswerLabel = (pick: any, pathwayId: string, stopId: string) => {
          if (pick.custom_answer) return pick.custom_answer;
          if (pick.option_id) {
            const quizData = (QUIZZES as any)[pathwayId]?.[stopId];
            if (quizData?.options) {
              const option = quizData.options.find((o: any) => o.id === pick.option_id);
              return option?.label || pick.option_id;
            }
          }
          return 'No answer';
        };

        const STEP_COLORS = ['#ff2e8f', '#ff6a2e', '#ffdd2e', '#12f0c0', '#45d4ff', '#d24dff'];

        return (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '30px' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#6B4A2A' }}>WORKFORCE PATHWAYS</span>
              <span style={{ fontSize: '12px', color: '#8a6a4a' }}>Your journey progress</span>
            </div>

            {loadingWorkforcePicks ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your pathway progress...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
                {PATHWAYS.map((pathway: any) => {
                  const pathwayPicks = workforcePicks.filter((p: any) => p.pathway_id === pathway.id);
                  const totalStops = pathway.stops?.length || 6;
                  const completedStops = pathwayPicks.length;
                  const isComplete = completedStops >= 5;
                  const pathwayColor = pathway.id === 'creator' ? '#ff6a2e' : '#43e97b';
                  const isExpanded = expandedPathwayCard === pathway.id;
                  const pwAccent = pathway.id === 'creator' ? '#ff7e40' : '#43e97b';
                  const klassName = pathway.id === 'creator' ? 'THE STORYTELLER' : 'THE STEWARD';

                  const charIsHuman = arcadeAvatar && (arcadeAvatar.form === 'fem' || arcadeAvatar.form === 'masc' || arcadeAvatar.form === 'enby');
                  const charSummary = arcadeAvatar
                    ? (charIsHuman
                      ? `${(arcadeAvatar.form || '').toUpperCase()} · ${(arcadeAvatar.hatType || '').toUpperCase()} · ${(arcadeAvatar.gear || '').toUpperCase()}`
                      : `${(arcadeAvatar.form || '').toUpperCase()} · NO HAT · ${(arcadeAvatar.gear || '').toUpperCase()}`)
                    : 'ENBY · CAP · CREATOR';

                  return (
                    <div key={pathway.id} style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.12)', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                      {/* Pathway header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ width: '10px', height: '40px', borderRadius: '5px', background: pathwayColor }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.14em', color: pathwayColor, fontWeight: 700 }}>{pathway.name.toUpperCase()}</div>
                          <div style={{ fontSize: '13px', color: '#7a5a3a', marginTop: '2px' }}>
                            {isComplete ? 'Run complete — pathway card earned!' : `${completedStops} of ${totalStops} stops completed`}
                          </div>
                        </div>
                        {isComplete && (
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: pathwayColor, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>✓ COMPLETE</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(completedStops / totalStops) * 100}%`, height: '100%', background: pathwayColor, borderRadius: '4px', transition: 'width .3s ease' }} />
                        </div>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#6B4A2A', fontWeight: 700 }}>{completedStops}/{totalStops}</span>
                      </div>

                      {/* Action buttons */}
                      {!isComplete ? (
                        <button onClick={() => router.push('/hub/workforce-pathways')} style={{ background: pathwayColor, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.06em', fontWeight: 700 }}>
                          CONTINUE →
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button onClick={() => setExpandedPathwayCard(isExpanded ? null : pathway.id)} style={{ background: '#21282E', color: '#FDDD9A', border: 'none', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.06em', fontWeight: 700, transition: 'all .2s ease' }}>
                            {isExpanded ? '✕ HIDE CARD' : '🎮 VIEW PATHWAY CARD'}
                          </button>
                          {isExpanded && (
                            <PathwayCardDownload
                              cardElementId={`pathway-card-${pathway.id}`}
                              fileName={`${pathway.id}-pathway-card`}
                              accentColor={pathwayColor}
                              size="sm"
                              fontFamily="'DM Mono', monospace"
                            />
                          )}
                        </div>
                      )}

                      {/* Arcade-style Pathway Card (shown on button click when complete) */}
                      {isComplete && isExpanded && (
                        <div id={`pathway-card-${pathway.id}`} className="run-card" style={{ position: 'relative', marginTop: '18px', maxWidth: '770px', background: '#f2f6ff', border: '5px solid #1c1526', boxShadow: '8px 8px 0 rgba(18,12,26,.42)', borderRadius: '12px', overflow: 'hidden' }}>
                          {/* RUN COMPLETE stamp */}
                          <div style={{ position: 'absolute', top: '78px', right: '16px', zIndex: 3, padding: '8px 13px', background: '#ff2e8f', color: '#fff', border: '4px solid #1c1526', fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '11px', letterSpacing: '.5px', transform: 'rotate(-14deg)', boxShadow: '3px 3px 0 rgba(18,12,26,.4)' }}>RUN COMPLETE</div>

                          {/* Card Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '15px 18px', background: pwAccent, borderBottom: '5px solid #1c1526' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '15px', color: '#10285e', textShadow: '2px 2px 0 rgba(255,255,255,.35)', lineHeight: 1.4 }}>{klassName}</div>
                              <div style={{ fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '7px', color: '#10285e', opacity: .72, marginTop: '8px', lineHeight: 1.6 }}>{pathway.name.toUpperCase()} · PATHWAY CARD</div>
                            </div>
                            <span style={{ width: '46px', height: '46px', flex: '0 0 auto', background: '#10285e', color: pwAccent, border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '15px' }}>{completedStops}</span>
                          </div>

                          {/* Card Body - Avatar + Picks Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '196px minmax(0,1fr)', gap: '16px', padding: '20px 18px' }}>
                            {/* Left: Avatar */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '14px 10px 12px', background: 'linear-gradient(#163a90,#2a55a8)', border: '4px solid #1c1526', boxShadow: 'inset 0 0 0 3px #3a68b8' }}>
                              <div style={{ flex: 1 }} />
                              <div style={{ animation: 'sw-float 2s ease-in-out infinite' }}>
                                <PixelHero
                                  form={arcadeAvatar?.form || 'enby'}
                                  skin={arcadeAvatar?.skin || '#e8b07a'}
                                  outfit={arcadeAvatar?.outfit || '#ff2e8f'}
                                  hairStyle={arcadeAvatar?.hairStyle || 'auto'}
                                  hairColor={arcadeAvatar?.hairColor || '#3a2a1a'}
                                  hatColor={arcadeAvatar?.hatColor || '#10285e'}
                                  hatType={arcadeAvatar?.hatType || 'cap'}
                                  gear={arcadeAvatar?.gear || 'creator'}
                                  style={{ width: '150px', height: '196px', display: 'block' }}
                                />
                              </div>
                              <div style={{ width: '140px', height: '10px', marginTop: '4px', background: 'repeating-linear-gradient(90deg,#c98a3e 0 8px,#a86f2c 8px 16px)', border: '3px solid #1c1526' }} />
                              <div style={{ marginTop: '12px', fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '7px', color: '#a9c8ff', textAlign: 'center', lineHeight: 1.9 }}>{charSummary}</div>
                            </div>

                            {/* Right: Answer rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                              {pathway.stops.map((stop: any, idx: number) => {
                                const pick = pathwayPicks.find((p: any) => p.stop_id === stop.id);
                                const answerLabel = pick ? getAnswerLabel(pick, pathway.id, stop.id) : '—';
                                const dotColor = STEP_COLORS[idx % STEP_COLORS.length];
                                
                                const qData = (QUIZZES as any)[pathway.id]?.[stop.id] || {};
                                const dbQ = dbQuizzes.find(q => q.pathway_id === pathway.id && q.stop_id === stop.id);
                                const meta = dbQ?.options?.find((o: any) => o.id === '__meta__') || {};
                                const resultLabel = (dbQ && (dbQ.result || meta.result)) ? (dbQ.result || meta.result) : (qData.result || stop.name);

                                return (
                                  <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 11px', background: '#fff', border: '3px solid #1c1526', borderRadius: '7px' }}>
                                    <span style={{ width: '22px', height: '22px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dotColor, color: '#1c1526', border: '2px solid #1c1526', borderRadius: '4px', fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '8px', fontWeight: 700 }}>{pick ? '✦' : '·'}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ display: 'block', fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '7px', color: '#5566a0', letterSpacing: '.4px', lineHeight: 1.5 }}>{resultLabel}</span>
                                      <span style={{ display: 'block', fontFamily: "'VT323', 'DM Mono', monospace", fontSize: '20px', lineHeight: 1.2, color: '#10285e', marginTop: '2px' }}>{answerLabel}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div style={{ padding: '15px 18px', background: '#10285e', borderTop: '5px solid #1c1526' }}>
                            <div style={{ fontSize: '14px', lineHeight: 1.45, color: '#f2f6ff' }}>Bring this card to AJCC El Centro or your MESA advisor. Ship your first portfolio piece this week.</div>
                            <div style={{ fontFamily: "'Press Start 2P', 'DM Mono', monospace", fontSize: '6.5px', color: '#8f88ad', letterSpacing: '.4px', marginTop: '11px', lineHeight: 1.7 }}>STEWARD OS · WORKFORCE DEVELOPMENT · {pathway.name.toUpperCase()} TRAIL</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Keyframe for avatar float animation and print styles */}
            <style>{`
              @keyframes sw-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
              @media print {
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
            `}</style>
          </>
        );
      })()}

    </div>
  </div>
  </>
)}

  {/* =================== ANNOUNCEMENTS SIDEBAR (Right Panel) =================== */}
  { announcementsSidebarOpen && (
  <>
    {/* Backdrop overlay */}
    <div style={{"position":"fixed","inset":"0","zIndex":"200","background":"rgba(0,0,0,.4)","animation":"sw-fade .2s ease"}} onClick={() => setAnnouncementsSidebarOpen(false)}></div>
    {/* Sidebar panel */}
    <div data-screen-label="Announcements Sidebar" style={{"position":"fixed","top":"0","right":"0","bottom":"0","width":"min(420px, 90vw)","zIndex":"201","display":"flex","flexDirection":"column","background":"#FEFAE0","boxShadow":"-8px 0 40px rgba(0,0,0,.2)","animation":"sw-slide-left .28s ease","fontFamily":"'Exo',sans-serif","overflow":"hidden"}}>
      {/* Header */}
      <div style={{"padding":"20px 22px 16px","borderBottom":"1.5px solid rgba(33,40,46,.1)","display":"flex","alignItems":"center","justifyContent":"space-between","background":"#21282E"}}>
        <div>
          <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".2em","color":"#FDDD9A","marginBottom":"4px"}}>📞 NOTIFICATIONS</div>
          <div style={{"fontSize":"18px","fontWeight":"700","color":"#FEFAE0"}}>Announcements</div>
        </div>
        <button onClick={() => setAnnouncementsSidebarOpen(false)} style={{"background":"rgba(254,250,224,.12)","border":"1px solid rgba(254,250,224,.2)","borderRadius":"10px","width":"36px","height":"36px","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","color":"#FEFAE0","fontSize":"18px","transition":"background .2s"}}>✕</button>
      </div>
      
      {/* Scrollable content */}
      <div style={{"flex":"1","overflow":"auto","padding":"18px 20px 30px"}}>
        {/* Pinned Bulletin - ALWAYS at top */}
        { bulletinText && (
        <div style={{"background": hasUnreadBulletin ? "linear-gradient(135deg, #2E5534, #21282E)" : "#21282E","color":"#FEFAE0","borderRadius":"14px","padding":"16px 18px","marginBottom":"18px","boxShadow": hasUnreadBulletin ? "0 8px 24px rgba(46,85,52,.3)" : "0 8px 20px rgba(0,0,0,.15)","border": hasUnreadBulletin ? "1.5px solid rgba(46,85,52,.4)" : "none","transition":"all .3s ease"}}>
          <div style={{"display":"flex","alignItems":"center","gap":"8px","fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".16em","color":"#FDDD9A","marginBottom":"6px"}}>
            📌 PINNED BULLETIN
            {hasUnreadBulletin && <span style={{"background":"rgba(46,85,52,.8)","color":"#FEFAE0","padding":"2px 8px","borderRadius":"6px","fontSize":"9px","letterSpacing":".1em","marginLeft":"8px"}}>UPDATED</span>}
          </div>
          <div style={{"fontSize":"13.5px","lineHeight":"1.5","whiteSpace":"pre-wrap"}}>{bulletinText}</div>
        </div>
        )}

        {/* Tab buttons: Announcements | Submissions */}
        <div style={{"display":"flex","gap":"8px","marginBottom":"16px"}}>
          <button onClick={() => setNotifTab('announcements')} style={{"flex":"1","padding":"10px 12px","borderRadius":"10px","border": notifTab === 'announcements' ? "2px solid #A27532" : "1.5px solid rgba(33,40,46,.12)","background": notifTab === 'announcements' ? "rgba(162,117,50,.08)" : "rgba(33,40,46,.02)","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".1em","fontWeight":"700","color": notifTab === 'announcements' ? "#A27532" : "#8a6a4a","transition":"all .2s","display":"flex","alignItems":"center","justifyContent":"center","gap":"6px"}}>
            📣 ANNOUNCEMENTS
            {unreadIds.length > 0 && <span style={{"minWidth":"18px","height":"18px","borderRadius":"999px","background":"#A27532","color":"#fff","fontSize":"10px","fontWeight":"700","display":"flex","alignItems":"center","justifyContent":"center","padding":"0 5px"}}>{unreadIds.length}</span>}
          </button>
          <button onClick={() => setNotifTab('submissions')} style={{"flex":"1","padding":"10px 12px","borderRadius":"10px","border": notifTab === 'submissions' ? "2px solid #2E5534" : "1.5px solid rgba(33,40,46,.12)","background": notifTab === 'submissions' ? "rgba(46,85,52,.06)" : "rgba(33,40,46,.02)","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"11px","letterSpacing":".1em","fontWeight":"700","color": notifTab === 'submissions' ? "#2E5534" : "#8a6a4a","transition":"all .2s","display":"flex","alignItems":"center","justifyContent":"center","gap":"6px"}}>
            ✓ SUBMISSIONS
            {personalNotifications.filter((n: any) => !n.is_read).length > 0 && <span style={{"minWidth":"18px","height":"18px","borderRadius":"999px","background":"#2E5534","color":"#fff","fontSize":"10px","fontWeight":"700","display":"flex","alignItems":"center","justifyContent":"center","padding":"0 5px"}}>{personalNotifications.filter((n: any) => !n.is_read).length}</span>}
          </button>
        </div>

        {/* ─── ANNOUNCEMENTS TAB ─── */}
        { notifTab === 'announcements' && (
        <>
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
          <div>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","color":"#8a5a2e"}}>ANNOUNCEMENTS</span>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","color":"#8a5a2e","marginLeft":"8px"}}>{announcements.length} TOTAL</span>
          </div>
          {unreadIds.length > 0 && (
            <button
              onClick={async () => {
                setUnreadIds([]);
                await markAllAnnouncementsAsRead();
              }}
              style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","color":"#A27532","background":"rgba(162,117,50,.1)","border":"1px solid rgba(162,117,50,.25)","borderRadius":"6px","padding":"4px 10px","cursor":"pointer","transition":"background .2s"}}
            >
              mark all as read
            </button>
          )}
        </div>
        
        { announcements.length === 0 && (
          <div style={{"textAlign":"center","padding":"40px 20px","color":"#a07a4a","fontSize":"14px"}}>
            <div style={{"fontSize":"32px","marginBottom":"12px"}}>📭</div>
            No announcements yet.
          </div>
        )}
        
        <div style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
          { announcements.map((a: any, i: number) => {
            const isUnread = unreadIds.includes(a.id);
            // Strip HTML for preview text
            const plainText = a.body?.replace(/<[^>]*>/g, '') || '';
            const preview = plainText.length > 80 ? plainText.slice(0, 80) + '…' : plainText;
            const hasMedia = /<img\s/i.test(a.body || '');
            
            return (
            <div key={a.id || i} 
              onClick={async () => {
                setExpandedAnnouncement(a);
                if (isUnread) {
                  setUnreadIds(prev => prev.filter(id => id !== a.id));
                  await markAnnouncementAsRead(a.id);
                }
              }}
              style={{"display":"flex","gap":"12px","background": isUnread ? "rgba(219,155,47,.08)" : "rgba(33,40,46,.03)","border": isUnread ? "1.5px solid rgba(219,155,47,.25)" : "1.5px solid rgba(33,40,46,.06)","borderRadius":"12px","padding":"14px 16px","cursor":"pointer","transition":"background .2s"}}>
              <div style={{"width":"36px","height":"36px","flex":"none","borderRadius":"10px","background": isUnread ? "rgba(219,155,47,.2)" : "rgba(219,155,47,.1)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"16px"}}>{isUnread ? '🔔' : '📣'}</div>
              <div style={{"flex":"1","minWidth":"0"}}>
                <div style={{"display":"flex","justifyContent":"space-between","gap":"8px","alignItems":"baseline"}}>
                  <div style={{"fontWeight": isUnread ? "800" : "600","fontSize":"14px","color":"#3a2412"}}>{a.title}</div>
                  <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","color":"#a07a4a","whiteSpace":"nowrap"}}>{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{"fontSize":"12.5px","color":"#6b4a2a","marginTop":"4px","lineHeight":"1.4","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}}>{preview}</div>
                {hasMedia && <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","color":"#a07a4a","marginTop":"4px"}}>📷 contains image · tap to view</div>}
                {isUnread && <div style={{"display":"inline-block","marginTop":"6px","fontFamily":"'DM Mono',monospace","fontSize":"9px","background":"rgba(219,155,47,.15)","color":"#8a5a2e","padding":"2px 8px","borderRadius":"8px","letterSpacing":".05em"}}>NEW</div>}
              </div>
            </div>
            );
          })}
        </div>
        </>
        )}

        {/* ─── SUBMISSIONS TAB ─── */}
        { notifTab === 'submissions' && (
        <>
        <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
          <div>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","letterSpacing":".18em","color":"#2E5534"}}>DELIVERABLES & ENGAGEMENT</span>
            <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","color":"#2E5534","marginLeft":"8px"}}>{personalNotifications.length} TOTAL</span>
          </div>
          {personalNotifications.filter((n: any) => !n.is_read).length > 0 && (
            <button
              onClick={async () => {
                setPersonalNotifications(prev => prev.map(n => ({...n, is_read: true})));
                await markAllNotificationsAsRead();
              }}
              style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","color":"#2E5534","background":"rgba(46,85,52,.1)","border":"1px solid rgba(46,85,52,.2)","borderRadius":"6px","padding":"4px 10px","cursor":"pointer","transition":"background .2s"}}
            >
              mark all as read
            </button>
          )}
        </div>
        
        { personalNotifications.length === 0 && (
          <div style={{"textAlign":"center","padding":"40px 20px","color":"#4a6a4a","fontSize":"14px"}}>
            <div style={{"fontSize":"32px","marginBottom":"12px"}}>📭</div>
            No submission updates yet. When your deliverables or engagements are reviewed, they&apos;ll appear here.
          </div>
        )}

        <div style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
          { personalNotifications.map((n: any) => (
            <div key={n.id} style={{"display":"flex","gap":"12px","background": !n.is_read ? "rgba(46,85,52,.06)" : "rgba(33,40,46,.02)","border": !n.is_read ? "1.5px solid rgba(46,85,52,.15)" : "1.5px solid rgba(33,40,46,.08)","borderRadius":"12px","padding":"13px 15px","cursor":"pointer","transition":"background .2s","overflow":"hidden"}} onClick={async () => {
              // Mark as read when clicking the notification
              if (!n.is_read) {
                setPersonalNotifications(prev => prev.map(p => p.id === n.id ? {...p, is_read: true} : p));
                await markNotificationAsRead(n.id);
              }
              // Navigate based on notification type:
              // Engagement approvals → profile page
              // Deliverable approvals → chia progress screen
              if (n.title?.toLowerCase().includes('engagement')) {
                setAnnouncementsSidebarOpen(false);
                setScreen('navigating');
                router.push('/hub/my-profile');
              } else if (n.title?.toLowerCase().includes('deliverable') || n.type === 'approval' || n.link === '/hub?screen=progress') {
                setAnnouncementsSidebarOpen(false);
                setScreen('progress');
              } else if (n.link) {
                setAnnouncementsSidebarOpen(false);
                router.push(n.link);
              }
            }}>
              <div style={{"width":"34px","height":"34px","flex":"none","borderRadius":"10px","background": !n.is_read ? "rgba(46,85,52,.12)" : "rgba(33,40,46,.06)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"15px"}}>{n.title?.includes('approved') ? '✅' : n.title?.includes('revision') ? '❌' : '🔔'}</div>
              <div style={{"flex":"1","minWidth":"0","overflow":"hidden"}}>
                <div style={{"fontWeight":"700","fontSize":"13px","color": !n.is_read ? "#2E5534" : "#3a2412","marginBottom":"3px"}}>{n.title}</div>
                <div style={{"fontSize":"12.5px","color": !n.is_read ? "#4a6a4a" : "#555","lineHeight":"1.4","wordBreak":"break-word","overflowWrap":"break-word"}}>{n.message}</div>
                <div style={{"display":"flex","alignItems":"center","gap":"8px","marginTop":"6px","flexWrap":"wrap"}}>
                  <span style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","color":"#8a9a8a"}}>{new Date(n.created_at).toLocaleDateString()}</span>
                  {!n.is_read && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await markNotificationAsRead(n.id);
                        setPersonalNotifications(prev => prev.map(p => p.id === n.id ? {...p, is_read: true} : p));
                      }}
                      style={{"fontFamily":"'DM Mono',monospace","fontSize":"9px","color":"#2E5534","background":"rgba(46,85,52,.1)","border":"1px solid rgba(46,85,52,.2)","borderRadius":"6px","padding":"2px 8px","cursor":"pointer","transition":"background .2s"}}
                    >
                      mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  </>
  )}

  {/* =================== ANNOUNCEMENT EXPANDED POPUP =================== */}
  { expandedAnnouncement && (
  <>
    <div style={{"position":"fixed","inset":"0","zIndex":"300","background":"rgba(0,0,0,.6)","animation":"sw-fadein .2s ease"}} onClick={() => setExpandedAnnouncement(null)}></div>
    <div style={{"position":"fixed","top":"50%","left":"50%","transform":"translate(-50%,-50%)","zIndex":"301","width":"min(520px, 92vw)","maxHeight":"80vh","display":"flex","flexDirection":"column","background":"#FEFAE0","borderRadius":"18px","boxShadow":"0 20px 60px rgba(0,0,0,.3)","animation":"sw-popup .25s cubic-bezier(0.34, 1.56, 0.64, 1)","fontFamily":"'Exo',sans-serif","overflow":"hidden"}} onClick={e => e.stopPropagation()}>
      {/* Popup header */}
      <div style={{"padding":"18px 22px 14px","borderBottom":"1.5px solid rgba(33,40,46,.08)","display":"flex","alignItems":"center","justifyContent":"space-between"}}>
        <div>
          <div style={{"fontWeight":"700","fontSize":"17px","color":"#3a2412"}}>{expandedAnnouncement.title}</div>
          <div style={{"fontFamily":"'DM Mono',monospace","fontSize":"10px","color":"#a07a4a","marginTop":"4px"}}>{new Date(expandedAnnouncement.created_at).toLocaleDateString()}</div>
        </div>
        <button onClick={() => setExpandedAnnouncement(null)} style={{"background":"rgba(33,40,46,.06)","border":"1px solid rgba(33,40,46,.1)","borderRadius":"10px","width":"34px","height":"34px","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","color":"#3a2412","fontSize":"16px"}}>✕</button>
      </div>
      {/* Popup body - scrollable */}
      <div style={{"flex":"1","overflow":"auto","padding":"20px 22px 28px"}}>
        <div className="announcement-body" style={{"fontSize":"15px","color":"#3a2412","lineHeight":"1.6"}} dangerouslySetInnerHTML={{ __html: expandedAnnouncement.body }}></div>
      </div>
    </div>
  </>
  )}

  {/*  =================== BRIDGE / LINK SCREEN ===================  */}
  { isBridge && (
  <div data-screen-label="Bridge Screen" style={{"position":"fixed","inset":"0","zIndex":"100","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center","background":"radial-gradient(circle at 50% 36%, #e7c6aa 0%, #c49c7a 60%, #9a6d4b 100%)","animation":"sw-fade .3s ease","fontFamily":"'Exo',sans-serif"}}>
    <div style={{"background":"#FEFAE0","border":"1px solid rgba(33,40,46,.15)","borderRadius":"22px","padding":"38px","maxWidth":"500px","width":"90%","boxShadow":"0 22px 50px rgba(0,0,0,.18)","textAlign":"center"}}>
      <h2 style={{"fontSize":"30px","fontWeight":"700","color":"#3a2412","margin":"0 0 8px"}}>{bridgeTitle}</h2>
      <div style={{"display":"inline-block","fontFamily":"'DM Mono',monospace","fontSize":"12px","background":"#21282E","color":"#FDDD9A","padding":"6px 14px","borderRadius":"20px","marginBottom":"18px"}}>{bridgeRoute}</div>
      <p style={{"fontSize":"14px","lineHeight":"1.6","color":"#5a4226","margin":"0 0 26px"}}>{bridgeBlurb}</p>
      <div style={{"display":"flex","gap":"10px"}}>
        <button style={{"flex":"1","background":"rgba(33,40,46,.08)","color":"#3a2412","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={bridgeBack}>← Back</button>
        { isLogout && (
          <button style={{"flex":"1","background":"#c0492f","color":"#fff","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={confirmLogout}>Confirm log out</button>
        )}
        { isLink && (
<button style={{"flex":"1","background":"#2E5534","color":"#FEFAE0","border":"none","borderRadius":"11px","padding":"13px 0","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"13px"}} onClick={() => router.push(bridgeRoute)}>Open page →</button>
)}
      </div>
      <div style={{"fontSize":"11px","color":"#9a7a4a","marginTop":"14px","fontFamily":"'DM Mono',monospace"}}>Prototype · links to the route above in the live app</div>
    </div>
  </div>
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

  {/*  =================== CONTRIBUTOR SHOWCASE (Guest Users Only) ===================  */}
  { isShowcase && (
  <div data-screen-label="Contributor Showcase" style={{"position":"fixed","inset":"0","zIndex":"100","display":"flex","flexDirection":"column","background":"linear-gradient(180deg,#241542,#1a0f30)","animation":"sw-fade .3s ease","fontFamily":"'Exo',sans-serif","overflow":"auto"}}>
    <div style={{"maxWidth":"1100px","margin":"0 auto","width":"100%","padding":"34px 26px 60px"}}>
      <button style={{"background":"rgba(253,221,154,.14)","border":"1px solid rgba(253,221,154,.2)","borderRadius":"10px","padding":"9px 15px","cursor":"pointer","fontFamily":"'DM Mono',monospace","fontSize":"12px","color":"#FEFAE0","marginBottom":"22px"}} onClick={goHub}>← Back to Hub</button>
      
      {/* ═══ Header Banner ═══ */}
      <div style={{
        border: '2px solid var(--gold,#ffd23f)',
        borderRadius: 12,
        padding: 'clamp(14px,2.2vw,22px)',
        background: 'linear-gradient(180deg,rgba(255,210,63,.07),rgba(255,210,63,.02))',
        boxShadow: '0 0 24px rgba(255,210,63,.08)',
        marginBottom: '24px'
      }}>
        <h2 className="font-pixel" style={{
          fontSize: 'clamp(12px,1.8vw,18px)',
          color: 'var(--gold,#ffd23f)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          ★ CONTRIBUTORS SHOWCASE LIBRARY
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--mu,#a493c9)',
          margin: '8px 0 0',
          lineHeight: 1.55,
        }}>
          Curated lessons, articles, audio guides, and AI-generated packs from community
          contributors, partner educators, and the StewardWorks AI Lab. Bookmark items to your desk
          for quick reference during workshops.
        </p>
      </div>

      {/* ═══ Filter Tabs ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '24px' }}>
        {[
          { key: 'all', label: 'ALL', type: null },
          { key: 'video', label: 'VIDEO LESSONS', type: 'video' },
          { key: 'article', label: 'ARTICLES', type: 'article' },
          { key: 'audio', label: 'AUDIO GUIDES', type: 'audio' },
          { key: 'aigen', label: 'AI GENERATIONS', type: 'aigen' },
        ].map(tab => {
          const count = tab.type ? showcaseItems.filter((i: any) => i.type === tab.type).length : showcaseItems.length;
          return (
            <button
              key={tab.key}
              className="font-pixel"
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                padding: '9px 14px',
                borderRadius: 6,
                border: `2px solid var(--s,#45d6ff)`,
                background: 'var(--s,#45d6ff)',
                color: '#12081e',
                cursor: 'pointer',
                transition: 'all .15s',
                letterSpacing: '.5px',
              }}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      
      {showcaseLoading ? (
        <div style={{"textAlign":"center","padding":"60px 20px","color":"#a493c9"}}>
          <div style={{"width":"40px","height":"40px","margin":"0 auto 16px","borderRadius":"50%","border":"3px solid rgba(253,221,154,.2)","borderTopColor":"#FDDD9A","animation":"sw-spin 1s linear infinite"}}></div>
          <div className="font-pixel" style={{"fontSize":"14px","letterSpacing":".1em"}}>LOADING SHOWCASE...</div>
        </div>
      ) : showcaseItems.length === 0 ? (
        <div style={{"textAlign":"center","padding":"60px 20px","border":"2px dashed rgba(164,147,201,.3)","borderRadius":"16px","marginTop":"40px"}}>
          <div className="font-pixel" style={{"fontSize":"16px","color":"#ff5fd2","marginBottom":"12px"}}>NO ITEMS AVAILABLE</div>
          <p style={{"fontSize":"14px","color":"#a493c9","margin":"0","lineHeight":"1.6"}}>
            The showcase library is currently empty.<br />
            Check back later for new contributions from the community.
          </p>
        </div>
      ) : (
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fill,minmax(240px,1fr))","gap":"14px"}}>
          {showcaseItems.map((item: any) => {
            const typeColors: Record<string, string> = {
              video: '#45d6ff',
              article: '#ffd23f',
              audio: '#ff5fd2',
              aigen: '#74f0a0',
            };
            const typeLabels: Record<string, string> = {
              video: '▶ VIDEO',
              article: '✎ ARTICLE',
              audio: '♫ AUDIO',
              aigen: '✦ AI GEN',
            };
            const clr = typeColors[item.type] || '#45d6ff';
            const label = typeLabels[item.type] || 'CONTENT';
            
            return (
              <div key={item.id} style={{
                border: "2px solid var(--ln,#3d2668)",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--pn,#241542)",
                display: "flex",
                flexDirection: "column",
                transition: "transform .2s ease, box-shadow .2s ease",
              }}>
                {/* thumbnail */}
                <div style={{
                  height: "140px",
                  background: `linear-gradient(135deg,${clr}22,${clr}08)`,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ fontSize: "42px", opacity: .18, color: clr }}>
                    {item.type === 'video' ? '▶' : item.type === 'audio' ? '♫' : item.type === 'aigen' ? '✦' : '✎'}
                  </span>
                  <span className="font-pixel" style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    fontSize: "7px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: clr,
                    color: "#12081e",
                    letterSpacing: ".5px"
                  }}>
                    {label}
                  </span>
                  {item.is_paid && (
                    <span className="font-pixel" style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      fontSize: "7px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: "rgba(255,210,63,.18)",
                      color: "var(--gold,#ffd23f)",
                      border: "1px solid rgba(255,210,63,.3)"
                    }}>
                      ★ PREMIUM
                    </span>
                  )}
                </div>
                
                {/* content */}
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", flex: "1" }}>
                  <h3 className="font-pixel" style={{
                    fontSize: "11px",
                    color: "#fff",
                    margin: "0",
                    lineHeight: "1.6"
                  }}>
                    {item.title}
                  </h3>
                  
                  <span style={{ fontSize: "13px", color: "var(--mu,#a493c9)" }}>
                    {item.author} {item.meta ? `· ${item.meta}` : ''}
                  </span>
                  
                  {item.theme && (
                    <span style={{ fontSize: "11px", color: "var(--s,#45d6ff)" }}>
                      ◈ Literacy · {item.theme}
                    </span>
                  )}
                  
                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
                    <button
                      onClick={() => item.url && window.open(item.url, '_blank')}
                      className="font-pixel"
                      style={{
                        flex: 1,
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: "var(--s,#45d6ff)",
                        color: "#12081e",
                        cursor: "pointer",
                        transition: "all .15s",
                        letterSpacing: ".5px"
                      }}
                    >
                      OPEN SAMPLE ▸
                    </button>
                    <button
                      className="font-pixel"
                      style={{
                        fontSize: "14px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "2px solid var(--s,#45d6ff)",
                        background: "transparent",
                        color: "var(--s,#45d6ff)",
                        cursor: "pointer",
                        transition: "all .15s"
                      }}
                    >
                      ★
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
  )}

  {showCertPreview && (
    <div 
      onClick={() => setShowCertPreview(false)} 
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,4,16,.92)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,3vw,40px)', overflow: 'auto' }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: 760, maxHeight: '94vh', overflow: 'auto', background: '#f7f1e0', border: '3px solid #b58a2e', borderRadius: 5, boxShadow: '0 0 0 9px #f8f0da, 0 0 0 11px #c9a24a, 0 30px 70px rgba(0,0,0,.6)', position: 'relative', color: '#3a2c14', fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <button 
          onClick={() => setShowCertPreview(false)} 
          title="Close certificate" 
          className="font-pixel"
          style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3 }}
        >
          ✕
        </button>
        <div dangerouslySetInnerHTML={{ __html: certPreviewHtml }} />
      </div>
    </div>
  )}

</div>

    </div>
  );
}
