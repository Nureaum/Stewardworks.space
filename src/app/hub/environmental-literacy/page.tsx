'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getEnvironmentalCatalog, submitSuggestion } from '@/actions/environmental';
import { EnvironmentalScene } from '@/components/environmental-literacy/EnvironmentalScene';
import { toggleBookmark as toggleDbBookmark, fetchUserBookmarks } from '@/app/actions/bookmarks';
import toast from 'react-hot-toast';

const THEMES = [
  { id:'bioregion', mark:'❋', shelf:'Ocotillo Field', topic:'Imperial County Bioregion', color:'#417C98', intro:'A below-sea-level rift basin ringed by mountains — holding an accidental inland sea, the busiest bird stop on the Pacific Flyway, and a superheated aquifer now called "white gold."' },
  { id:'indigenous', mark:'◒', shelf:'Quechan Rattle', topic:'Indigenous People of Imperial County', color:'#2E5534', intro:'The basin has been home for millennia to Cahuilla, Quechan, Kumeyaay, and Cocopah peoples — whose calendars, songs, and cosmologies are tuned to a lake that comes and goes.' },
  { id:'history', mark:'▤', shelf:'Water Rights Ledger', topic:'Imperial County History', color:'#A27532', intro:'A century of engineering rewrote the desert — an accidental sea, a canal-fed empire of farms, contested water, and nine fragile colonias strung along the shore.' },
  { id:'wider', mark:'⇄', shelf:'Train & Container', topic:'Imperial County & the Wider World', color:'#B15A3A', intro:'A poor desert county feeds the nation’s winter table, powers its grid, and sits thirty miles from an international border on the most fought-over river in America.' }
];

export default function EnvironmentalLiteracyPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [catId, setCatId] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sShowErr, setSShowErr] = useState(false);
  const [sTheme, setSTheme] = useState('bioregion');
  const [sTitle, setSTitle] = useState('');
  const [sWhat, setSWhat] = useState('');
  const [sUrl, setSUrl] = useState('');
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [introExpanded, setIntroExpanded] = useState(true);
  const [isLibrarian, setIsLibrarian] = useState(false);

  // Bookmark state
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [isSubmittingBookmark, setIsSubmittingBookmark] = useState<string | null>(null);

  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded || !user) return;
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.role === 'admin' || data.profile?.role === 'super_admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    }
    checkAdminRole();
  }, [isLoaded, user]);

  useEffect(() => {
    async function fetchData() {
      const data = await getEnvironmentalCatalog();
      
      const entries = data || [];
      const groupedCatalog = THEMES.map(theme => {
        return {
          ...theme,
          entries: entries
            .filter(e => e.theme_id === theme.id)
            .map(e => ({
              id: e.slug,
              t: e.title,
              s: e.subtitle,
              call: e.call_no,
              type: e.type,
              media: e.media_caption,
              gallery_ids: e.gallery_ids || [],
              b: e.body_text || [],
              f: e.facts || [],
              src: e.sources || []
            }))
        };
      });
      setCatalog(groupedCatalog);
      setLoading(false);
      
      // Handle deep linking from profile bookmarks
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const entryParam = searchParams.get('entry');
        if (entryParam) {
          for (const cat of groupedCatalog) {
            if (cat.entries.find((e: any) => e.id === entryParam)) {
              setOpen(true);
              setCatId(cat.id);
              setEntryId(entryParam);
              break;
            }
          }
        }
      }
    }
    fetchData();
  }, []);

  // Fetch user bookmarks
  useEffect(() => {
    if (user?.id) {
      fetchUserBookmarks('environmental').then((bmData) => {
        const bm: Record<string, boolean> = {};
        bmData.forEach((b: any) => {
          if (b.item_id) {
            bm[b.item_id] = true;
          }
        });
        setBookmarks(bm);
      });
    }
  }, [user?.id]);

  // Toggle bookmark for field note
  const toggleFieldNoteBookmark = async (entry: any, themeName: string) => {
    // Use URL as key (matches what's stored in database via fetchUserBookmarks)
    const bookmarkUrl = `environmental-literacy/${entry.id}`;
    if (!bookmarkUrl) return;
    
    // Prevent double-click
    if (isSubmittingBookmark === bookmarkUrl) return;
    setIsSubmittingBookmark(bookmarkUrl);
    
    const isBookmarked = !!bookmarks[bookmarkUrl];
    
    // Optimistic update
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[bookmarkUrl]) delete next[bookmarkUrl];
      else next[bookmarkUrl] = true;
      return next;
    });

    try {
      await toggleDbBookmark(
        bookmarkUrl,
        'environmental',
        `Field Note: ${entry.t} (${themeName})`,
        bookmarkUrl
      );
      
      // Refetch to sync
      const bmData = await fetchUserBookmarks('environmental');
      const bm: Record<string, boolean> = {};
      bmData.forEach((b: any) => {
        if (b.item_id) bm[b.item_id] = true;
      });
      setBookmarks(bm);
      
      if (!isBookmarked) {
        toast.success('Bookmark submitted! Awaiting admin approval.', { id: `env-bm-${bookmarkUrl}`, position: 'bottom-center' });
      } else {
        toast.success('Bookmark removed.', { id: `env-bm-${bookmarkUrl}`, position: 'bottom-center' });
      }
    } catch (err) {
      toast.error('Failed to save bookmark.', { id: `env-bm-error-${bookmarkUrl}`, position: 'bottom-center' });
      // Revert
      setBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[bookmarkUrl] = true;
        else delete next[bookmarkUrl];
        return next;
      });
    } finally {
      setIsSubmittingBookmark(null);
    }
  };

  const activeCat = catalog.find(c => c.id === catId);
  const activeEntries = activeCat?.entries || [];
  const activeEntry = activeEntries.find((e: any) => e.id === entryId);

  const handleOpenCategory = (id: string, defaultEntryId?: string) => {
    setOpen(true);
    setCatId(id);
    const cat = catalog.find(c => c.id === id);
    if (defaultEntryId) {
      setEntryId(defaultEntryId);
    } else if (cat && cat.entries.length > 0) {
      setEntryId(cat.entries[0].id);
    } else {
      setEntryId(null);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setEntryId(null);
  };

  const validUrl = (u: string) => {
    try { new URL(u); return true; } catch { return false; }
  };

  const submitSuggest = async () => {
    const t = sTitle.trim();
    const w = sWhat.trim();
    const u = sUrl.trim();

    if (!t || !w || !validUrl(u)) {
      setSShowErr(true);
      return;
    }

    setIsSubmitting(true);
    setSShowErr(false);

    const { success, error } = await submitSuggestion({ theme_id: sTheme, title: t, description: w, url: u, submitter_name: sName });

    setIsSubmitting(false);

    if (!success) {
      toast.error('Failed to submit suggestion');
      console.error(error);
      return;
    }

    setSTitle('');
    setSWhat('');
    setSUrl('');
    setSTheme('bioregion');
    setSShowErr(false);

    setSent(true);
  };

  // Styles
  const containerStyle = {
    position: 'fixed' as 'fixed', top: '3vh', bottom: '3vh', left: '50%', transform: 'translateX(-50%)',
    zIndex: 55, width: 'min(1140px, 94vw)',
    display: 'flex', flexDirection: 'column' as 'column',
    background: 'var(--cream, #FBF8F1)', borderRadius: '18px', overflow: 'hidden',
    boxShadow: '0 40px 90px -30px rgba(30,22,10,.7)',
    border: '1px solid rgba(60,42,24,.3)',
    animation: 'el-pagein .34s cubic-bezier(.22,1,.36,1)'
  };
  const headerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    padding: '16px 20px', background: activeCat ? activeCat.color : '#417C98'
  };
  const bodyWrapStyle = { display: 'flex', flex: 1, minHeight: 0 };
  const contentsColStyle = {
    width: '320px', flex: '0 0 auto', padding: '24px', background: 'rgba(235, 227, 210, 0.5)',
    borderRight: '1px solid rgba(60,42,24,.12)', overflowY: 'auto' as 'auto'
  };
  const detailColStyle = { flex: 1, minWidth: 0, overflowY: 'auto' as 'auto', background: '#FBF8F1' };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(120% 90% at 50% -10%, #FCF5DC 0%, #FBF2D2 46%, #F3E6BE 100%)', fontFamily: "'Exo', sans-serif", color: '#241f17', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: '16px', padding: '11px 26px', background: 'rgba(251,242,210,.88)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(60,42,24,.14)' }}>
        <a href="/hub" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#A27532', textDecoration: 'none', font: "700 11px/1 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase' }}>‹ Back to Hub</a>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.25 }}>
          <div style={{ font: "700 11px/1 'Courier New',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#3C2A18' }}>Environmental Literacy</div>
          <div style={{ font: "700 9px/1 'Courier New',monospace", letterSpacing: '.28em', textTransform: 'uppercase', color: '#6b6153', marginTop: '3px', opacity: .8 }}>Field Desk · Est. 2026</div>
        </div>
        {isAdmin && (
          <div role="group" aria-label="View as" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', background: 'rgba(60,42,24,.07)', border: '1px solid rgba(60,42,24,.16)', borderRadius: '11px', padding: '3px', gap: '2px' }}>
            <span style={{ padding: '0 8px 0 4px', font: "700 8px/1 'Courier New',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6b6153', opacity: .7 }}>View</span>
            <button onClick={() => setIsLibrarian(false)} style={{ all: 'unset', cursor: 'pointer', padding: '5px 12px', borderRadius: '8px', font: "800 9.5px/1 'Exo',sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', background: !isLibrarian ? '#fff' : 'transparent', color: !isLibrarian ? '#3C2A18' : '#8A6238', boxShadow: !isLibrarian ? '0 2px 6px rgba(60,42,24,.1)' : 'none' }}>Reader</button>
            <button onClick={() => setIsLibrarian(true)} style={{ all: 'unset', cursor: 'pointer', padding: '5px 12px', borderRadius: '8px', font: "800 9.5px/1 'Exo',sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', background: isLibrarian ? '#3C2A18' : 'transparent', color: isLibrarian ? '#fff' : '#8A6238', boxShadow: isLibrarian ? '0 2px 6px rgba(60,42,24,.1)' : 'none' }}>Librarian</button>
          </div>
        )}
        {isLibrarian && isAdmin ? (
          <a href="/admin/environmental" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: '#3C2A18', color: '#f3e2b6', textDecoration: 'none', borderRadius: '10px', font: "700 10px/1 'Courier New',monospace", letterSpacing: '.13em', textTransform: 'uppercase' }}>✦ Open admin console ›</a>
        ) : (
          <button onClick={() => { setSuggestOpen(true); setSent(false); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: '#A27532', color: '#fff', borderRadius: '10px', font: "700 10px/1 'Courier New',monospace", letterSpacing: '.13em', textTransform: 'uppercase' }}>＋ Suggest a resource</button>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '20px 26px 2px' }}>
        {introExpanded && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: "700 11px/1 'Courier New',monospace", letterSpacing: '.3em', textTransform: 'uppercase', color: '#A27532' }}>Imperial County · The Salton Sea Bioregion</div>
            <h1 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 'clamp(28px,3.6vw,44px)', lineHeight: 1, letterSpacing: '-.015em', color: '#241f17', margin: '10px 0 0' }}>Environmental Literacy</h1>
            <p style={{ maxWidth: '680px', margin: '12px auto 0', fontSize: '15px', lineHeight: 1.6, color: '#6b6153' }}>The desert here is catalogued as four field stations — the <strong style={{ color: '#417C98' }}>Bioregion</strong> (its land, water, wildlife &amp; climate), its <strong style={{ color: '#2E5534' }}>Indigenous Peoples</strong>, the <strong style={{ color: '#A27532' }}>County History</strong>, and its reach into the <strong style={{ color: '#B15A3A' }}>Wider World</strong>. Within the Bioregion you can also open the Salton Sea itself, the mountain ranges that wall the basin, and the desert sun.</p>
            <p style={{ maxWidth: '560px', margin: '10px auto 0', font: "600 12.5px/1.55 'Exo',sans-serif", color: '#241f17', opacity: .85 }}>Click any feature in the scene to read its field notes — and get to know the ground you're standing on.</p>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
          <div style={{ font: "700 10.5px/1 'Courier New',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: '#6b6153', opacity: .82 }}>{catalog.length} field stations · {catalog.reduce((acc, c) => acc + c.entries.length, 0)} field notes catalogued</div>
          <button onClick={() => setIntroExpanded(!introExpanded)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(60,42,24,.2)', background: 'rgba(255,255,255,.55)', font: "700 9px/1 'Courier New',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#3C2A18' }}>{introExpanded ? 'HIDE INTRO ▴' : 'SHOW INTRO ▾'}</button>
        </div>
      </div>

      <div style={{ width: '100%', margin: '14px 0 0', padding: '0 0 24px' }}>
        <EnvironmentalScene 
          onOpenWider={() => handleOpenCategory('wider')}
          onOpenBio={() => handleOpenCategory('bioregion')}
          onOpenHist={() => handleOpenCategory('history')}
          onOpenIndig={() => handleOpenCategory('indigenous')}
          onSea={() => handleOpenCategory('bioregion', 'sea')}
          onSantaRosa={() => handleOpenCategory('bioregion', 'geology')}
          onChocolate={() => handleOpenCategory('bioregion', 'geology')}
          onSun={() => handleOpenCategory('bioregion', 'climate')}
        />
      </div>

      {open && activeCat && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(30,22,10,.5)', backdropFilter: 'blur(3px)', animation: 'el-fadein .25s ease' }} onClick={closeDialog}></div>
          <div style={containerStyle} onClick={e => e.stopPropagation()}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' }}>{activeCat.mark}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "700 9.5px/1.2 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)' }}>{activeCat.shelf}</div>
                  <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCat.topic}</div>
                </div>
              </div>
              <button onClick={closeDialog} style={{ all: 'unset', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: '17px' }}>✕</button>
            </div>

            <div style={bodyWrapStyle}>
              <div className="el-scroll" style={contentsColStyle}>
                <p style={{ margin: '0 0 20px', fontSize: '15px', lineHeight: 1.6, color: '#6e5f49' }}>{activeCat.intro}</p>
                <div style={{ font: "700 10px/1 'Courier New',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#A27532', marginBottom: '12px' }}>Field notes · {activeEntries.length}</div>
                
                {activeEntries.map((e: any, i: number) => {
                  const bookmarkUrl = `environmental-literacy/${e.id}`;
                  const isBookmarked = !!bookmarks[bookmarkUrl];
                  const isSubmitting = isSubmittingBookmark === bookmarkUrl;
                  
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '0 -14px 4px' }}>
                      <button onClick={() => setEntryId(e.id)} style={{ all: 'unset', flex: 1, display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: '12px', cursor: 'pointer', boxSizing: 'border-box', background: entryId === e.id ? '#fff' : 'transparent', boxShadow: entryId === e.id ? '0 6px 16px rgba(60,42,24,.08)' : 'none', border: entryId === e.id ? `1px solid ${activeCat.color}` : '1px solid transparent' }}>
                        <span style={{ font: "700 12px/1 'Courier New',monospace", color: '#A27532', flex: '0 0 auto', marginTop: '2px' }}>0{i + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '15px', lineHeight: 1.15, color: '#3C2A18' }}>{e.t}</span>
                          <span style={{ display: 'block', font: "700 9.5px/1.3 'Courier New',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e5f49', marginTop: '3px' }}>{e.s}</span>
                        </span>
                        <span style={{ color: '#A27532', flex: '0 0 auto', fontSize: '15px', marginTop: '2px' }}>›</span>
                      </button>
                      {user && (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); toggleFieldNoteBookmark(e, activeCat.topic); }}
                          disabled={isSubmitting}
                          title={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
                          style={{
                            all: 'unset',
                            cursor: isSubmitting ? 'wait' : 'pointer',
                            boxSizing: 'border-box',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            borderRadius: '8px',
                            background: isBookmarked ? '#A27532' : 'rgba(162,117,50,.1)',
                            color: isBookmarked ? '#fff' : '#A27532',
                            border: `1px solid ${isBookmarked ? '#A27532' : 'rgba(162,117,50,.3)'}`,
                            marginTop: '10px',
                            transition: 'all 0.2s ease',
                            opacity: isSubmitting ? 0.6 : 1
                          }}
                        >
                          {isSubmitting ? '⏳' : (isBookmarked ? '★' : '☆')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="el-scroll" style={detailColStyle}>
                {activeEntry ? (
                  <div style={{ padding: '26px 28px 40px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: "700 10px/1.4 'Courier New',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#A27532' }}>{`${activeCat.shelf} · ${activeEntry.call_no || ''} · ${activeEntry.type || ''}`.toUpperCase()}</div>
                        <div style={{ marginTop: '12px' }}><span style={{ display: 'inline-block', font: "700 9px/1 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: activeCat.color, background: `${activeCat.color}22`, padding: '5px 10px', borderRadius: '999px' }}>{activeEntry.s}</span></div>
                      </div>
                      {user && (() => {
                        const bookmarkUrl = `environmental-literacy/${activeEntry.id}`;
                        const isBookmarked = !!bookmarks[bookmarkUrl];
                        const isSubmitting = isSubmittingBookmark === bookmarkUrl;
                        return (
                          <button
                            onClick={() => toggleFieldNoteBookmark(activeEntry, activeCat.topic)}
                            disabled={isSubmitting}
                            title={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
                            style={{
                              all: 'unset',
                              cursor: isSubmitting ? 'wait' : 'pointer',
                              boxSizing: 'border-box',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: isBookmarked ? '#A27532' : 'rgba(162,117,50,.08)',
                              color: isBookmarked ? '#fff' : '#A27532',
                              border: `1px solid ${isBookmarked ? '#A27532' : 'rgba(162,117,50,.25)'}`,
                              font: "700 10px/1 'Courier New',monospace",
                              letterSpacing: '.1em',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s ease',
                              opacity: isSubmitting ? 0.6 : 1
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>{isSubmitting ? '⏳' : (isBookmarked ? '★' : '☆')}</span>
                            {isBookmarked ? 'Saved' : 'Save'}
                          </button>
                        );
                      })()}
                    </div>
                    <h2 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 'clamp(24px,3vw,32px)', lineHeight: 1.05, color: '#3C2A18', margin: '10px 0 0' }}>{activeEntry.t}</h2>

                    {activeEntry.gallery_ids && activeEntry.gallery_ids.length > 0 ? (
                      <div style={{ margin: '20px 0 22px', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/8', border: '1px solid rgba(60,42,24,.18)', position: 'relative' }}>
                        <img src={activeEntry.gallery_ids[0]} alt={activeEntry.media || activeEntry.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {activeEntry.media && (
                          <div style={{ position: 'absolute', bottom: '12px', left: '12px', font: "700 10px/1 'Courier New',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#9c8555', background: 'rgba(251,242,210,.9)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{activeEntry.media}</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ margin: '20px 0 22px', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/8', background: 'repeating-linear-gradient(45deg,#efe1bd,#efe1bd 11px,#e7d6ac 11px,#e7d6ac 22px)', border: '1px solid rgba(60,42,24,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ font: "700 10px/1 'Courier New',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#9c8555', background: 'rgba(251,242,210,.85)', padding: '6px 12px', borderRadius: '6px' }}>{activeEntry.media || 'No media'}</span>
                      </div>
                    )}

                    {activeEntry.b.map((p: string, i: number) => (
                      <p key={i} style={{ margin: '0 0 15px', fontSize: '15.5px', lineHeight: 1.68, color: '#3a342a' }}>{p}</p>
                    ))}

                    {activeEntry.gallery_ids && activeEntry.gallery_ids.length > 1 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '24px', marginBottom: '10px' }}>
                        {activeEntry.gallery_ids.slice(1).map((url: string, i: number) => (
                          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', border: '1px solid rgba(60,42,24,.14)' }}>
                            <img src={url} alt={`Additional photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {activeEntry.f.length > 0 && (
                      <div style={{ marginTop: '24px', borderRadius: '14px', background: '#F5EDD6', border: '1px solid rgba(60,42,24,.16)', padding: '6px 18px 8px' }}>
                        <div style={{ font: "700 10px/1 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#A27532', padding: '12px 0 4px' }}>Field facts</div>
                        {activeEntry.f.map((f: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '9px 0', borderTop: '1px solid rgba(60,42,24,.1)' }}>
                            <span style={{ font: "700 11px/1.4 'Courier New',monospace", letterSpacing: '.05em', textTransform: 'uppercase', color: '#6e5f49' }}>{f.k || f[0]}</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#3C2A18', textAlign: 'right' }}>{f.v || f[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeEntry.src?.length > 0 && (
                      <div style={{ marginTop: '22px' }}>
                        <div style={{ font: "700 10px/1 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#A27532', marginBottom: '10px' }}>Original sources</div>
                        {activeEntry.src.map((s: any, i: number) => (
                          <a key={i} href={s.url || s[1]} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 15px', marginBottom: '8px', borderRadius: '11px', background: '#FBF8F1', border: '1px solid rgba(60,42,24,.16)', textDecoration: 'none', color: '#3C2A18' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{s.label || s[0]}</span>
                            <span style={{ font: "700 10px/1 'Courier New',monospace", color: '#417C98', flex: '0 0 auto' }}>View ↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: '100%', minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px', color: '#6e5f49' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#F5EDD6', border: '1px solid rgba(60,42,24,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>☞</div>
                    <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '19px', color: '#3C2A18' }}>Open a field note</div>
                    <div style={{ font: "700 10px/1.5 'Courier New',monospace", letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '8px', maxWidth: '240px' }}>Choose an entry from the index on the left to read it here.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {suggestOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(30,22,10,.5)', backdropFilter: 'blur(3px)', animation: 'el-fadein .25s ease' }} onClick={() => setSuggestOpen(false)}></div>
          <div className="el-scroll" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 65, width: 'min(560px,94vw)', maxHeight: '92vh', overflow: 'auto', background: '#F5EDD6', borderRadius: '18px', boxShadow: '0 40px 90px -30px rgba(30,22,10,.7)', border: '1px solid rgba(60,42,24,.3)', animation: 'el-modalin .34s cubic-bezier(.22,1,.36,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '15px 20px', background: 'linear-gradient(120deg,#A27532,#8a5f28)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', color: '#fff' }}>＋</div>
                <div>
                  <div style={{ font: "700 9.5px/1.2 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.82)' }}>Steward Library · Public</div>
                  <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '18px', color: '#fff' }}>Suggest a resource</div>
                </div>
              </div>
              <button onClick={() => setSuggestOpen(false)} style={{ all: 'unset', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: '16px' }}>✕</button>
            </div>

            {!sent ? (
              <div style={{ padding: '22px 22px 24px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '13.5px', lineHeight: 1.55, color: '#6e5f49' }}>Spotted a study, map, article, or local record we should hold? Tell us where it belongs and a librarian will review it for the field desk. Fields marked <span style={{ color: '#B15A3A', fontWeight: 700 }}>*</span> are required.</p>

                {sShowErr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px', padding: '11px 13px', borderRadius: '11px', background: '#f7e4dc', border: '1px solid #e0b7a6', color: '#8f3f24', font: "700 11px/1.4 'Exo',sans-serif" }}>⚠ Please fill in the required fields before sending.</div>
                )}

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', font: "700 10.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#A27532', marginBottom: '8px' }}>Which part of the desert? <span style={{ color: '#B15A3A' }}>*</span></label>
                  <select value={sTheme} onChange={e => setSTheme(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(60,42,24,.2)', background: '#FBF8F1', color: '#3C2A18', fontSize: '15px', fontWeight: 600, outline: 'none' }}>
                    {THEMES.map(t => <option key={t.id} value={t.id}>{t.topic}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', font: "700 10.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#A27532', marginBottom: '8px' }}>Title of the resource <span style={{ color: '#B15A3A' }}>*</span></label>
                  <input value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="e.g. 2024 Salton Sea playa dust study" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(60,42,24,.2)', background: '#FBF8F1', color: '#3C2A18', fontSize: '15px', fontWeight: 600, outline: 'none' }}/>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', font: "700 10.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#A27532', marginBottom: '8px' }}>Why does it matter? <span style={{ color: '#B15A3A' }}>*</span></label>
                  <textarea value={sWhat} onChange={e => setSWhat(e.target.value)} placeholder="A sentence or two on what it adds to the field notes." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(60,42,24,.2)', background: '#FBF8F1', color: '#3C2A18', fontSize: '15px', outline: 'none', height: '80px', resize: 'vertical' }}></textarea>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', font: "700 10.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#A27532', marginBottom: '8px' }}>Link to the source <span style={{ color: '#B15A3A' }}>*</span></label>
                  <input value={sUrl} onChange={e => setSUrl(e.target.value)} placeholder="https://…" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(60,42,24,.2)', background: '#FBF8F1', color: '#3C2A18', fontSize: '15px', outline: 'none' }}/>
                </div>



                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                  <button onClick={() => setSuggestOpen(false)} disabled={isSubmitting} style={{ background: 'transparent', border: 'none', padding: '12px 16px', color: '#6e5f49', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>Cancel</button>
                  <button onClick={submitSuggest} disabled={isSubmitting} style={{ background: '#3C2A18', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: "'Baloo 2',cursive", fontSize: '16px', opacity: isSubmitting ? 0.7 : 1 }}>{isSubmitting ? 'Sending...' : 'Send to librarian'}</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '42px 30px', textAlign: 'center' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '15px', background: '#e6efe0', color: '#2E5534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '27px', margin: '0 auto 16px' }}>✓</div>
                <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: '23px', color: '#3C2A18' }}>Thank you</div>
                <p style={{ maxWidth: '346px', margin: '10px auto 0', fontSize: '14px', lineHeight: 1.55, color: '#6e5f49' }}>Your suggestion is in the librarian's review queue. If it's a fit, the source link will be catalogued in the Steward Library and appear here in the scene.</p>
                <button onClick={() => setSuggestOpen(false)} style={{ background: '#3C2A18', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Baloo 2',cursive", fontSize: '16px', marginTop: '22px' }}>Done</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
