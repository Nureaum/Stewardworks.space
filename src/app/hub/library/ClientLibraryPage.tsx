'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { toggleBookmark as toggleDbBookmark, fetchUserBookmarks } from '@/app/actions/bookmarks';

const TYPES = [
  { id: 'video',   label: 'Video',      code: 'VI', color: '#7A2E2E' },
  { id: 'article', label: 'Article',    code: 'AR', color: '#417C98' },
  { id: 'pdf',     label: 'PDF',        code: 'PD', color: '#B5552F' },
  { id: 'tool',    label: 'Tool',       code: 'TO', color: '#2D4B3E' },
  { id: 'study',   label: 'Study',      code: 'ST', color: '#2C3E50' },
  { id: 'social',  label: 'Social',     code: 'SO', color: '#A27532' },
  { id: 'slides',  label: 'Slides',     code: 'SL', color: '#DB9B2F' },
  { id: 'meme',    label: 'Image/Meme', code: 'IM', color: '#C8643F' },
  { id: 'other',   label: 'Resource',   code: 'RE', color: '#888' }
];
const PALETTE = ['#2C3E50','#356066','#B07A2B','#7A2E2E','#2D4B3E','#B5552F','#3D6E86','#6E7E33','#3A3F45','#4F6B2A','#C8643F','#9A6B2E'];

const TYPE_MAP: Record<string, any> = {};
TYPES.forEach(t => TYPE_MAP[t.id] = t);

function darken(hex: string, amt: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * (1 - amt)); g = Math.round(g * (1 - amt)); b = Math.round(b * (1 - amt));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function domain(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function chunk<T>(a: T[], n: number) {
  const out = []; 
  for (let i = 0; i < a.length; i += n) out.push({ id: 'row' + i, books: a.slice(i, i + n) }); 
  return out;
}

function getBaseType(resource: any) {
  if (resource.resource_type) return resource.resource_type;
  
  const media = resource.media || [];
  if (media.some((m: any) => m.media_type === 'pdf')) return 'pdf';
  if (media.some((m: any) => m.media_type === 'video_link' || m.media_type === 'video')) return 'video';
  if (media.some((m: any) => m.media_type === 'image')) return 'meme'; 
  
  if (resource.external_url) {
    if (resource.external_url.includes('youtube.com') || resource.external_url.includes('vimeo.com')) return 'video';
    if (resource.external_url.includes('.pdf')) return 'pdf';
    if (resource.external_url.includes('twitter.com') || resource.external_url.includes('x.com') || resource.external_url.includes('instagram.com')) return 'social';
  }
  
  return 'article';
}

function stripHtml(html: string) {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]+>/g, '');
}

export default function ClientLibraryPage({ initialResources, isAdmin = false }: { initialResources: any[], isAdmin?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<'shelf'|'catalog'>('shelf');
  const [cat, setCat] = useState<string | null>(null);
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resources, setResources] = useState<any[]>(initialResources);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);
  const [listMode, setListMode] = useState<'cards' | 'book'>('cards');
  const [bookSpread, setBookSpread] = useState(0);
  const [flipNext, setFlipNext] = useState(false);
  const [flipPrev, setFlipPrev] = useState(false);

  // Check for category parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get('category');
    if (categorySlug && categorySlug === 'how-to-use-ai') {
      // We'll set the category after categories are loaded
      // This will be handled in the next useEffect
    }
  }, []);

  useEffect(() => {
    fetchUserBookmarks('library').then(data => {
      const bm: Record<string, boolean> = {};
      data.forEach((b: any) => {
        const itemId = b.item_id || '';
        // Handle all URL formats: /hub/library/{uuid}, just uuid, or external URL
        if (itemId.startsWith('/hub/library/')) {
          bm[itemId.replace('/hub/library/', '')] = true;
        } else {
          bm[itemId] = true;
        }
      });
      // Also match by resource external_url for legacy bookmarks
      if (resources.length > 0) {
        data.forEach((b: any) => {
          const match = resources.find(r => r.external_url === b.item_id || r.id === b.item_id);
          if (match) bm[match.id] = true;
        });
      }
      setBookmarks(bm);
    });
  }, [resources]);

  const toggleBookmark = async (id: string, e?: React.MouseEvent, resource?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const isBookmarked = !!bookmarks[id];
    
    // Optimistic update
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });

    try {
      // Find the resource to get title and URL
      const res = resources.find(r => r.id === id);
      await toggleDbBookmark(
        id, 
        'library', 
        res?.title || `Resource ${id}`,
        `/hub/library/${id}`
      );
      
      // Show success message
      if (!isBookmarked) {
        toast.success('Bookmark request submitted! Awaiting admin approval.');
      } else {
        toast.success('Bookmark removed.');
      }
    } catch (err) {
      // Revert if failed
      toast.error('Failed to save bookmark.');
      setBookmarks(prev => {
        const next = { ...prev };
        if (isBookmarked) next[id] = true;
        else delete next[id];
        return next;
      });
    }
  };
  
  // Interactive state variables
  const [admin, setAdmin] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [hovKnob, setHovKnob] = useState(false);
  const [hovOco, setHovOco] = useState(false);
  const [hovRattle, setHovRattle] = useState(false);
  const [hovAlmanac, setHovAlmanac] = useState(false);
  const [hovGlobe, setHovGlobe] = useState(false);

  // Suggestions state for librarian console
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionProcessing, setSuggestionProcessing] = useState<string | null>(null);
  const [suggestionDetail, setSuggestionDetail] = useState<any>(null);

  // Fetch suggestions when console opens
  useEffect(() => {
    if (consoleOpen && isAdmin) {
      fetch('/api/admin/library/suggestions')
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.suggestions || []);
        })
        .catch(console.error);
    }
  }, [consoleOpen, isAdmin]);

  const handleSuggestionAction = async (id: string, status: 'approved' | 'rejected') => {
    setSuggestionProcessing(id);
    try {
      const res = await fetch(`/api/admin/library/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`Failed to ${status} suggestion`);
      toast.success(`Suggestion ${status}!`);
      setSuggestions(s => s.filter(x => x.id !== id));
      if (suggestionDetail?.id === id) {
        setSuggestionDetail(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSuggestionProcessing(null);
    }
  };

  // Hardcode the prototype categories to guarantee exact color, code, and spine mapping
  const PROTOTYPE_CATS = [
    { name: 'AI Policy/Manifestos',       spineLabel: 'AI Policy',            code: '320.6', color: '#2C3E50', blurb: 'Government frameworks and industry manifestos shaping the Intelligence Age.' },
    { name: 'Data Centers',               spineLabel: 'Data Centers',         code: '621.3', color: '#356066', blurb: "AI's physical footprint — water, power, and the local fights over both." },
    { name: 'AI Industry & Work',         spineLabel: 'Industry & Work',      code: '331.0', color: '#B07A2B', blurb: 'How AI is reshaping jobs, careers, and regional economies.' },
    { name: 'AI Opinions & News',         spineLabel: 'Opinions & News',      code: '070.4', color: '#7A2E2E', blurb: 'Headlines and commentary on where AI is heading.' },
    { name: 'AI Research',                spineLabel: 'AI Research',          code: '001.4', color: '#2D4B3E', blurb: "Peer-reviewed studies and papers on AI's effects." },
    { name: 'Teaching AI',                spineLabel: 'Teaching AI',          code: '371.3', color: '#B5552F', blurb: 'Frameworks, decks, and tools for teaching with AI.' },
    { name: 'How to Use AI',              spineLabel: 'How to Use AI',        code: '005.1', color: '#3D6E86', blurb: 'Practical guides for getting real work done with AI.' },
    { name: 'AI Wellness',                spineLabel: 'AI Wellness',          code: '158.1', color: '#6E7E33', blurb: 'Attention, meaning, and healthy habits in the AI age.' },
    { name: 'Sovereign & Local AI',       spineLabel: 'Sovereign AI',         code: '005.8', color: '#3A3F45', blurb: 'Private, local, and self-hosted AI you can own.' },
    { name: 'AI and Nature',              spineLabel: 'AI & Nature',          code: '577.0', color: '#4F6B2A', blurb: 'AI, the environment, and the bioregion we live in.' },
    { name: 'AI Memes',                   spineLabel: 'AI Memes',             code: '741.5', color: '#C8643F', blurb: "The internet's running commentary on AI." },
    { name: 'Ethical AI Stewardship',     spineLabel: 'Ethical Steward',      code: '241.0', color: '#9A6B2E', blurb: 'Faith, dignity, and stewardship as the ground for technology.' },
    { name: 'Imperial County Bioregion',  spineLabel: 'County Bioregion',    code: 'EL.1', color: '#5A7D2E', blurb: 'The ocotillo, the desert, and the living things of the Imperial Valley bioregion.', section: 'Environmental Literacy' },
    { name: 'Indigenous People of Imperial County', spineLabel: 'Indigenous People',  code: 'EL.2', color: '#8A4B2B', blurb: 'The Quechan and the peoples of the lower Colorado River — land, language, and stewardship.', section: 'Environmental Literacy' },
    { name: 'Imperial County History',    spineLabel: 'County History',   code: 'EL.3', color: '#6E5A2E', blurb: 'How water, farming, and the Salton Sea shaped the valley we know today.', section: 'Environmental Literacy' },
    { name: 'Imperial County & the Wider World', spineLabel: 'Wider World',      code: 'EL.4', color: '#2E6066', blurb: 'Placing our bioregion inside global currents of climate, trade, and change.', section: 'Environmental Literacy' }
  ];

  // Map real categories
  const { cats, res } = useMemo(() => {
    const uniqueCats = new Map();
    const mappedRes = resources.map((r, i) => {
      const catId = r.category?.id || 'uncategorized';
      if (!uniqueCats.has(catId)) {
        const catName = r.category?.label || 'Uncategorized';
        const proto = PROTOTYPE_CATS.find(p => p.name === catName);
        const colorIdx = uniqueCats.size % PALETTE.length;
        
        uniqueCats.set(catId, {
          id: catId,
          name: catName,
          spineLabel: proto ? proto.spineLabel : catName,
          code: proto ? proto.code : (300 + uniqueCats.size * 10).toString() + '.0',
          color: proto ? proto.color : PALETTE[colorIdx],
          blurb: proto ? proto.blurb : (r.category?.description || `Resources related to ${catName}.`),
          section: proto ? (proto as any).section : undefined
        });
      }
      
      const resType = getBaseType(r);
      const url = r.external_url || (r.media?.[0]?.url) || '';
      
      return {
        id: r.id,
        rawId: r.id,
        title: r.title,
        url: url,
        cat: catId,
        type: resType,
        note: stripHtml(r.body),
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        peerReviewed: r.peer_reviewed || false,
        sourceTag: r.source_tag || null,
        raw: r
      };
    });
    
    // Ensure the 4 special Environmental Literacy categories always exist, even if empty
    const elCats = ['Imperial County Bioregion', 'Indigenous People of Imperial County', 'Imperial County History', 'Imperial County & the Wider World'];
    elCats.forEach((name, idx) => {
      let found = false;
      for (const [k, v] of Array.from(uniqueCats.entries())) {
        if (v.name === name) { found = true; break; }
      }
      if (!found) {
        const proto = PROTOTYPE_CATS.find(p => p.name === name);
        if (proto) {
          const fakeId = 'el-special-' + idx;
          uniqueCats.set(fakeId, {
            id: fakeId,
            name: name,
            spineLabel: proto.spineLabel,
            code: proto.code,
            color: proto.color,
            blurb: proto.blurb,
            section: (proto as any).section
          });
        }
      }
    });

    const catsArr = Array.from(uniqueCats.values());
    catsArr.sort((a, b) => {
      const idxA = PROTOTYPE_CATS.findIndex(p => p.name === a.name);
      const idxB = PROTOTYPE_CATS.findIndex(p => p.name === b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return { cats: catsArr, res: mappedRes };
  }, [resources]);

  const cm: Record<string, any> = {}; 
  cats.forEach(c => cm[c.id] = c);

  // Auto-select "How to Use AI" category if URL parameter is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get('category');
    if (categorySlug === 'how-to-use-ai' && cats.length > 0 && !cat) {
      const howToUseAICat = cats.find(c => c.name === 'How to Use AI');
      if (howToUseAICat) {
        setCat(howToUseAICat.id);
        // Clean up URL
        window.history.replaceState({}, '', '/hub/library');
      }
    }
  }, [cats, cat]);

  const openSpecialCat = (name: string) => {
    const c = cats.find(x => x.name === name);
    if (c) {
      setCat(c.id);
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    } else {
      toast.error('Category not found in this environment');
    }
  };

  const decorate = (r: any) => {
    const t = TYPE_MAP[r.type] || TYPE_MAP['other'];
    const c = cm[r.cat] || {};
    return {
      ...r,
      typeLabel: t.label || r.type, 
      typeColor: t.color || '#888', 
      typeCode: t.code || '?',
      source: domain(r.url), 
      catName: c.name || 'Unknown Shelf', 
      code: c.code || '',
      bookmarked: !!bookmarks[r.id],
      notBookmarked: !bookmarks[r.id],
      onBookmark: (e: any) => toggleBookmark(r.id, e),
      onOpen: () => setDetail(r),
      onClose: () => setDetail(null),
      stop: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); }
    };
  };

  const counts: Record<string, number> = {}; 
  res.forEach(r => counts[r.cat] = (counts[r.cat] || 0) + 1);
  
  const H = [314, 268, 298, 248, 326, 278, 308, 256, 290, 272, 320, 262];
  const W = [90, 80, 98, 84, 76, 94, 86, 100, 82, 92, 78, 96];

  const allBooks = cats.map((c, i) => {
    const list = res.filter(r => r.cat === c.id);
    const seen: string[] = []; 
    list.forEach(r => { const col = (TYPE_MAP[r.type] || {}).color; if (col && !seen.includes(col)) seen.push(col); });
    
    const sl = c.spineLabel || c.name || '';
    const spineFont = sl.length > 16 ? 11 : (sl.length > 13 ? 12 : 13);
    
    return {
      ...c,
      count: counts[c.id] || 0,
      dotColors: seen.slice(0, 6),
      h: H[i % H.length],
      w: W[i % W.length],
      headerBg: `linear-gradient(135deg, ${c.color}, ${darken(c.color, 0.42)})`,
      styleA: (i % 4) === 0,
      styleB: (i % 4) === 1,
      styleC: (i % 4) === 2,
      styleD: (i % 4) === 3,
      bandColor: darken(c.color, 0.2),
      labelBg: darken(c.color, 0.3),
      spineFont: spineFont,
      onOpen: () => { setCat(c.id); setType('all'); setQ(''); setDetail(null); setListMode('cards'); setBookSpread(0); },
      onAdd: () => {
        setDetail(null);
        setForm({ mode: 'add', data: { title: '', url: '', cat: c.id, type: 'article', note: '' } });
      }
    };
  });
  
  const books = allBooks.filter(c => !c.section);
  const shelfRows = chunk(books, 6);

  const isSearching = q.trim() !== '';
  const currentCat = cat ? allBooks.find(b => b.id === cat) : null;
  const showCategory = !isSearching && !!currentCat;
  const showSearch = isSearching;
  const showShelf = !isSearching && !currentCat && view === 'shelf';
  const showCatalog = !isSearching && !currentCat && view === 'catalog';
  const showList = showCategory || showSearch;

  let currentResources: any[] = [];
  if (showCategory) {
    currentResources = res.filter(r => r.cat === cat && (type === 'all' || r.type === type)).map(r => decorate(r));
  } else if (showSearch) {
    const ql = q.trim().toLowerCase();
    currentResources = res.filter(r => ((r.title + ' ' + (r.note || '') + ' ' + ((cm[r.cat] || {}).name || '') + ' ' + ((TYPE_MAP[r.type] || {}).label || '')).toLowerCase().includes(ql))).map(r => decorate(r));
  }

  let typeChips: any[] = [];
  if (showCategory) {
    const all = res.filter(r => r.cat === cat);
    const tc: Record<string, number> = {}; 
    all.forEach(r => tc[r.type] = (tc[r.type] || 0) + 1);
    typeChips.push({ id: 'all', label: 'All', count: all.length, color: '#21282E', active: type === 'all', inactive: type !== 'all', onClick: () => setType('all') });
    TYPES.forEach(t => { 
      if (tc[t.id]) typeChips.push({ id: t.id, label: t.label, count: tc[t.id], color: t.color, active: type === t.id, inactive: type !== t.id, onClick: () => setType(t.id) }); 
    });
  }

  let decoratedDetail = null;
  if (detail) decoratedDetail = decorate(detail);

  const setF = (field: string, val: any) => {
    setForm((s: any) => ({ ...s, data: { ...s.data, [field]: val } }));
  };

  const saveForm = async () => {
    if (!form || form.mode === 'shelf') return;
    setIsSubmitting(true);
    try {
      if (form.mode === 'add-direct') {
        // Admin direct add — save directly to library
        const res = await fetch('/api/public/library-resources/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.data.title,
            url: form.data.url,
            category: cats.find((c: any) => c.id === form.data.cat)?.name || 'Uncategorized',
            resource_type: form.data.type,
            note: form.data.note,
            peerReviewed: form.data.peerReviewed || false,
            sourceTag: form.data.sourceTag || null,
            directAdd: true
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save');
        }
        toast.success('Resource added to the library!');
        setForm(null);
        // Refresh the page to show the new resource
        router.refresh();
        return;
      } else {
        // Regular suggestion
        const res = await fetch('/api/public/library-resources/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.data.title,
            url: form.data.url,
            category: cats.find((c: any) => c.id === form.data.cat)?.name || 'Uncategorized',
            resource_type: form.data.type,
            note: form.data.note
          })
        });
        if (!res.ok) throw new Error('Failed to submit');
        toast.success('Suggestion sent to the librarians!');
      }
      setForm(null);
    } catch (err) {
      toast.error('Error submitting resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sl-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sl-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes pageflip-next { from { transform: rotateY(0deg); } to { transform: rotateY(-168deg); } }
        @keyframes pageflip-prev { from { transform: rotateY(0deg); } to { transform: rotateY(168deg); } }
        @keyframes sl-glow { 0%,100% { box-shadow: 0 0 0 3px #3e2a1a, 0 0 10px 2px rgba(231,205,134,.55), 0 2px 4px rgba(0,0,0,.5); } 50% { box-shadow: 0 0 0 3px #3e2a1a, 0 0 20px 6px rgba(231,205,134,.9), 0 2px 4px rgba(0,0,0,.5); } }
        .sl-placeholder::placeholder { color: rgba(33,40,46,.4); }
      `}} />
      <div style={{ minHeight: '100vh', backgroundColor: '#FEFAE0', backgroundImage: 'radial-gradient(rgba(45,75,62,.06) 1px, transparent 1px)', backgroundSize: '22px 22px', fontFamily: '"Exo", sans-serif', color: '#21282E', position: 'relative', overflowX: 'hidden', paddingBottom: '80px' }}>
        
        {/* soft reading-room glow */}
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '520px', background: 'radial-gradient(ellipse at center, rgba(255,215,0,.16), rgba(255,215,0,0) 68%)', pointerEvents: 'none', zIndex: 0 }}></div>

        {/* TOP BAR */}
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '18px 26px', borderBottom: '1px solid rgba(33,40,46,.08)', background: 'rgba(254,250,224,.82)', backdropFilter: 'blur(6px)' }}>
          <Link href="/hub" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none', color: '#21282E', opacity: .55, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>← Back to Hub</Link>
          <div onClick={() => { setCat(null); setQ(''); setType('all'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '34px', height: '42px', background: 'linear-gradient(135deg,#A27532,#7c531f)', borderRadius: '3px 5px 5px 3px', boxShadow: 'inset -4px 0 6px -2px rgba(0,0,0,.4),inset 3px 0 4px -2px rgba(255,255,255,.3)', position: 'relative', borderLeft: '4px solid #5e3d16' }}></div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-.01em' }}>Steward Library</div>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '.36em', textTransform: 'uppercase', color: 'rgba(33,40,46,.5)', marginTop: '3px' }}>The Stacks · Est. 2026</div>
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <button 
            onClick={() => {
              setIsNavigatingToProfile(true);
              router.push('/hub/my-profile');
            }}
            disabled={isNavigatingToProfile}
            title="Your bookmarks & reading on Steward Works" 
            style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '7px', 
              background: isNavigatingToProfile ? 'rgba(255,255,255,0.5)' : '#fff', 
              color: '#21282E', 
              border: '1.5px solid rgba(33,40,46,.18)', 
              padding: '8px 13px', 
              borderRadius: '8px', 
              fontFamily: '"Exo", sans-serif', 
              fontWeight: 800, 
              fontSize: '12px', 
              textTransform: 'uppercase', 
              letterSpacing: '.06em', 
              cursor: isNavigatingToProfile ? 'wait' : 'pointer', 
              textDecoration: 'none',
              opacity: isNavigatingToProfile ? 0.7 : 1
            }}
          >
            {isNavigatingToProfile ? (
              <>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  border: '2px solid rgba(33,40,46,.2)', 
                  borderTopColor: '#21282E', 
                  borderRadius: '50%', 
                  animation: 'spin 0.6s linear infinite' 
                }} />
                Loading...
              </>
            ) : (
              <>
                ★ My Shelf
                {Object.keys(bookmarks).length > 0 && (
                  <span style={{ minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', background: '#A27532', color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Object.keys(bookmarks).length}</span>
                )}
              </>
            )}
          </button>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the stacks…" className="sl-placeholder" style={{ width: '230px', maxWidth: '42vw', padding: '9px 14px', border: '1.5px solid rgba(33,40,46,.2)', borderRadius: '999px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '13px', color: '#21282E', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '3px', background: 'rgba(33,40,46,.07)', padding: '3px', borderRadius: '9px' }}>
            <button onClick={() => { setView('shelf'); setCat(null); setQ(''); }} style={{ padding: '7px 15px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '#fff' : 'transparent', color: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Bookcase</button>
            <button onClick={() => { setView('catalog'); setCat(null); setQ(''); }} style={{ padding: '7px 15px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '#fff' : 'transparent', color: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Catalog</button>
          </div>

          <button onClick={() => setForm({ mode: 'add', data: { title: '', url: '', cat: currentCat ? currentCat.id : (cats[0] && cats[0].id), type: 'article', note: '' } })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E5534', color: '#FEFAE0', border: 'none', padding: '9px 16px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer', boxShadow: '0 3px 0 #1d3a23' }}>+ Suggest Resource</button>
          
          {isAdmin && (
            <Link href="/admin/library" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#21282E', color: '#FEFAE0', border: 'none', padding: '9px 16px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 3px 0 #111' }}>
              ⚙ Admin Console
            </Link>
          )}
        </div>

        {/* ======================= HOME: SHELF ======================= */}
        {showShelf && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1120px', margin: '0 auto', padding: '38px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.4em', textTransform: 'uppercase', color: '#A27532', fontWeight: 700 }}>A Reading Room of Resources</div>
              <h1 style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-.02em', margin: '10px 0 8px' }}>Pull a book from the shelf</h1>
              <p style={{ maxWidth: '620px', margin: '0 auto', fontSize: '16px', lineHeight: 1.6, color: 'rgba(33,40,46,.65)' }}>Every shelf is a topic, every spine a category from the curriculum. Choose one to browse its links — filter by type{isAdmin ? ', or use Librarian Mode to add your own' : ''}.</p>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.45)', marginTop: '14px', letterSpacing: '.05em' }}>{cats.length} shelves · {res.length} resources catalogued</div>
            </div>

            {/* bookcase */}
            <div style={{ position: 'relative', maxWidth: '1040px', margin: '0 auto' }}>

              {/* crown: carved pediment + finial */}
              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2, marginBottom: '-1px' }}>
                <div style={{ position: 'relative', width: '250px', height: '58px' }}>
                  <div style={{ position: 'absolute', left: 0, bottom: 0, width: 0, height: 0, borderLeft: '125px solid transparent', borderRight: '125px solid transparent', borderBottom: '52px solid #3e2a1a' }}></div>
                  <div style={{ position: 'absolute', left: '9px', bottom: 0, width: 0, height: 0, borderLeft: '116px solid transparent', borderRight: '116px solid transparent', borderBottom: '44px solid #5b3f29' }}></div>
                  <div 
                    onClick={isAdmin ? () => setAdmin(!admin) : undefined} 
                    onMouseEnter={isAdmin ? () => setHovKnob(true) : undefined} 
                    onMouseLeave={isAdmin ? () => setHovKnob(false) : undefined} 
                    title={isAdmin ? "Librarian access — click to unlock" : undefined} 
                    style={{ position: 'absolute', left: '50%', bottom: '5px', transform: 'translateX(-50%)', width: '30px', height: '30px', cursor: isAdmin ? 'pointer' : 'default', zIndex: 4, pointerEvents: isAdmin ? 'auto' : 'none' }}
                  >
                    {admin ? (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#fbe6b0,#e7cd86 60%,#b8932f)', animation: 'sl-glow 2.2s ease-in-out infinite' }}>
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(90deg)', width: '4px', height: '13px', background: '#3a2a14', borderRadius: '2px', transition: 'transform .4s ease' }}></div>
                        <div style={{ position: 'absolute', left: '50%', top: '8px', transform: 'translateX(-50%)', width: '7px', height: '7px', background: '#3a2a14', borderRadius: '50%' }}></div>
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 65%,#9c7a33)', boxShadow: '0 0 0 3px #3e2a1a,0 2px 4px rgba(0,0,0,.5)' }}>
                        <div style={{ position: 'absolute', left: '50%', top: '8px', transform: 'translateX(-50%)', width: '7px', height: '7px', background: '#3a2a14', borderRadius: '50%' }}></div>
                        <div style={{ position: 'absolute', left: '50%', top: '13px', transform: 'translateX(-50%)', width: '4px', height: '9px', background: '#3a2a14', borderRadius: '2px' }}></div>
                      </div>
                    )}
                    {isAdmin && hovKnob && (
                      <div style={{ position: 'absolute', top: '34px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, whiteSpace: 'nowrap', background: 'linear-gradient(180deg,#2E5534,#1d3a23)', color: '#f4ead0', border: '1px solid rgba(231,205,134,.5)', borderRadius: '4px', padding: '4px 9px', fontFamily: '"Courier New", monospace', fontSize: '8.5px', letterSpacing: '.08em', textTransform: 'uppercase', boxShadow: '0 6px 14px rgba(0,0,0,.5)', animation: 'sl-pop .18s ease' }}>{admin ? 'Lock Console' : 'Unlock Admin'}</div>
                    )}
                  </div>
                </div>

                {/* LIBRARIAN KEY-FOBS */}
                {admin && (
                  <>
                    <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-236px)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 6 }}>
                      <div style={{ width: '2px', height: '12px', background: 'linear-gradient(#e7cd86,#8a6a2c)' }}></div>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #3a2a14', background: 'transparent', marginBottom: '-6px', zIndex: 2 }}></div>
                      <button onClick={() => setConsoleOpen(true)} title="Open the librarian console" className="hover:-translate-y-[1px] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,.55),0_8px_15px_rgba(0,0,0,.4)]" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 13px 8px', background: 'linear-gradient(180deg,#f0dca0,#c9a44e 55%,#9c7a33)', border: '2px solid #3e2a1a', borderRadius: '8px', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.55),0 5px 11px rgba(0,0,0,.34)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}>
                        ⚙ Console
                      </button>
                    </div>
                    <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(150px)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 6 }}>
                      <div style={{ width: '2px', height: '12px', background: 'linear-gradient(#e7cd86,#8a6a2c)' }}></div>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #3a2a14', background: 'transparent', marginBottom: '-6px', zIndex: 2 }}></div>
                      <button onClick={() => setForm({ mode: 'add-direct', data: { title: '', url: '', cat: cats[0]?.id || '', type: 'article', note: '', peerReviewed: false, sourceTag: '' } })} title="Shelve a new resource" className="hover:-translate-y-[1px] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,.28),0_8px_15px_rgba(0,0,0,.4)]" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px 8px', background: 'linear-gradient(180deg,#3a6b40,#2E5534 58%,#20431f)', border: '2px solid #3e2a1a', borderRadius: '8px', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.28),0 5px 11px rgba(0,0,0,.34)', color: '#f4ead0', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}>
                        ✚ Add Resource
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* cornice with dentils */}
              <div style={{ height: '24px', background: 'linear-gradient(180deg,#6a4a2e,#4a3220)', border: '4px solid #3e2a1a', borderBottom: 'none', borderRadius: '12px 12px 2px 2px', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.16)', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '3px', height: '6px', background: 'repeating-linear-gradient(90deg,rgba(231,205,134,.55) 0,rgba(231,205,134,.55) 6px,transparent 6px,transparent 13px)' }}></div>
              </div>

              {/* body: side cabinets + central stack */}
              <div style={{ display: 'flex', background: 'linear-gradient(180deg,#5b3f29,#4a3220)', borderLeft: '8px solid #3e2a1a', borderRight: '8px solid #3e2a1a', boxShadow: 'inset 0 4px 16px rgba(0,0,0,.5),0 30px 50px -22px rgba(0,0,0,.55)', position: 'relative' }}>

                {/* LEFT cabinet */}
                <div style={{ width: '140px', flexShrink: 0, borderRight: '6px solid #3e2a1a', display: 'flex' }}>
                  <div style={{ width: '15px', background: 'repeating-linear-gradient(90deg,#241509 0,#4a3220 3px,#7a5230 5px,#4a3220 7px,#241509 9px)', boxShadow: 'inset 0 0 8px rgba(0,0,0,.5)' }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* niche: ocotillo */}
                    <div onClick={() => openSpecialCat('Imperial County Bioregion')} onMouseEnter={() => setHovOco(true)} onMouseLeave={() => setHovOco(false)} style={{ flex: 1, borderBottom: '6px solid #3e2a1a', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '16px', minHeight: '170px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: '12px', left: '11px', right: '11px', bottom: '11px', borderRadius: '54px 54px 5px 5px', background: 'linear-gradient(180deg,#33210f,#1d1106)', boxShadow: 'inset 0 10px 20px rgba(0,0,0,.6)', border: '1px solid rgba(231,205,134,.12)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-56%)', zIndex: 0, fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: '92px', lineHeight: 1, color: 'rgba(231,205,134,.10)', textShadow: '0 2px 0 rgba(0,0,0,.5),0 -1px 0 rgba(255,255,255,.05)', pointerEvents: 'none' }}>3</div>
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '120px', height: '126px' }}>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '70px', background: 'linear-gradient(180deg,#9a8347,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-24deg)' }}><div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '7px', height: '11px', background: 'linear-gradient(180deg,#d8402c,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '98px', background: 'linear-gradient(180deg,#9a8347,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-15deg)' }}><div style={{ position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', width: '9px', height: '14px', background: 'linear-gradient(180deg,#e0452f,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '80px', background: 'linear-gradient(180deg,#9a8347,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-7deg)' }}><div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '12px', background: 'linear-gradient(180deg,#d8402c,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '5px', height: '126px', background: 'linear-gradient(180deg,#a38a4b,#6a6d3c 40%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-2deg)' }}><div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '16px', background: 'linear-gradient(180deg,#e0452f,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '5px', height: '104px', background: 'linear-gradient(180deg,#a38a4b,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(5deg)' }}><div style={{ position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', width: '9px', height: '14px', background: 'linear-gradient(180deg,#e0452f,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '5px', height: '118px', background: 'linear-gradient(180deg,#a38a4b,#6a6d3c 40%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(12deg)' }}><div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '16px', background: 'linear-gradient(180deg,#e0452f,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '84px', background: 'linear-gradient(180deg,#9a8347,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(21deg)' }}><div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '12px', background: 'linear-gradient(180deg,#d8402c,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '64px', background: 'linear-gradient(180deg,#9a8347,#6a6d3c 38%,#4a512a)', borderRadius: '3px', borderLeft: '1.5px dotted rgba(126,162,72,.95)', borderRight: '1.5px dotted rgba(126,162,72,.95)', transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(31deg)' }}><div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '7px', height: '11px', background: 'linear-gradient(180deg,#d8402c,#9a2418)', borderRadius: '60% 60% 40% 40%', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}></div></div>
                        </div>
                        <div style={{ position: 'relative', width: '54px', height: '20px', marginTop: '-2px' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', background: 'linear-gradient(180deg,#caa36a,#9c7038)', borderRadius: '50%/80% 80% 40% 40%', boxShadow: 'inset 2px 2px 4px rgba(255,255,255,.2),inset -3px -2px 5px rgba(0,0,0,.25)' }}></div>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', boxShadow: '0 -1px 0 rgba(255,255,255,.12)' }}></div>
                      <div style={{ position: 'absolute', bottom: '14px', zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '7.5px', fontWeight: 700, letterSpacing: '.08em', color: '#3a2a14', background: 'linear-gradient(180deg,#e3c878,#c39f4a)', padding: '2px 6px', borderRadius: '1px', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}>OCOTILLO</div>
                      {hovOco && (
                        <div style={{ position: 'absolute', top: '14px', left: '11px', right: '11px', zIndex: 3, background: 'linear-gradient(180deg,#2E5534,#1d3a23)', color: '#f4ead0', border: '1px solid rgba(231,205,134,.5)', borderRadius: '4px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.5)', animation: 'sl-pop .18s ease' }}>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '7px', letterSpacing: '.2em', color: '#e7cd86', textTransform: 'uppercase' }}>Theme</div>
                          <div style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.18, marginTop: '2px' }}>Imperial County Bioregion</div>
                        </div>
                      )}
                    </div>
                    {/* niche: quechan gourd rattle */}
                    <div onClick={() => openSpecialCat('Indigenous People of Imperial County')} onMouseEnter={() => setHovRattle(true)} onMouseLeave={() => setHovRattle(false)} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '16px', minHeight: '170px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: '12px', left: '11px', right: '11px', bottom: '11px', borderRadius: '54px 54px 5px 5px', background: 'linear-gradient(180deg,#33210f,#1d1106)', boxShadow: 'inset 0 10px 20px rgba(0,0,0,.6)', border: '1px solid rgba(231,205,134,.12)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-56%)', zIndex: 0, fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: '92px', lineHeight: 1, color: 'rgba(231,205,134,.10)', textShadow: '0 2px 0 rgba(0,0,0,.5),0 -1px 0 rgba(255,255,255,.05)', pointerEvents: 'none' }}>3</div>
                      <div style={{ position: 'relative', zIndex: 1, width: '72px', height: '118px', transform: 'rotate(-9deg)' }}>
                        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '11px', height: '60px', background: 'linear-gradient(90deg,#5c3a1e,#9c6736 42%,#5c3a1e)', borderRadius: '4px', boxShadow: 'inset -2px 0 3px rgba(0,0,0,.35)' }}></div>
                        <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '17px', height: '9px', background: 'linear-gradient(180deg,#b5874a,#8a5e30)', borderRadius: '3px' }}></div>
                        <div style={{ position: 'absolute', bottom: '52px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '12px', background: 'repeating-linear-gradient(180deg,#7a2e2e 0,#7a2e2e 2px,#d9b25a 2px,#d9b25a 4px)', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,.35)' }}></div>
                        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '64px', height: '66px', background: 'radial-gradient(ellipse at 35% 28%,#f0d98a 0,#e6c578 24%,#c69a48 62%,#9c7330)', borderRadius: '50% 50% 46% 46%/56% 56% 44% 44%', boxShadow: 'inset -8px -6px 13px rgba(0,0,0,.3),inset 6px 4px 9px rgba(255,255,255,.28)' }}></div>
                        <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', width: '58px', borderTop: '2px dashed rgba(122,46,46,.65)' }}></div>
                        <div style={{ position: 'absolute', top: '14px', left: '24px', width: '6px', height: '6px', borderRadius: '50%', background: '#7a2e2e' }}></div>
                        <div style={{ position: 'absolute', top: '14px', right: '24px', width: '6px', height: '6px', borderRadius: '50%', background: '#7a2e2e' }}></div>
                        <div style={{ position: 'absolute', top: '36px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '7px', height: '7px', background: '#2d4b3e' }}></div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', boxShadow: '0 -1px 0 rgba(255,255,255,.12)' }}></div>
                      <div style={{ position: 'absolute', bottom: '14px', zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '7.5px', fontWeight: 700, letterSpacing: '.08em', color: '#3a2a14', background: 'linear-gradient(180deg,#e3c878,#c39f4a)', padding: '2px 6px', borderRadius: '1px', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}>QUECHAN RATTLE</div>
                      {hovRattle && (
                        <div style={{ position: 'absolute', top: '14px', left: '11px', right: '11px', zIndex: 3, background: 'linear-gradient(180deg,#2E5534,#1d3a23)', color: '#f4ead0', border: '1px solid rgba(231,205,134,.5)', borderRadius: '4px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.5)', animation: 'sl-pop .18s ease' }}>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '7px', letterSpacing: '.2em', color: '#e7cd86', textTransform: 'uppercase' }}>Theme</div>
                          <div style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.18, marginTop: '2px' }}>Indigenous People of Imperial County</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CENTER stack */}
                <div style={{ flex: 1, padding: '20px 16px 14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '5px', border: '1px solid rgba(231,205,134,.13)', borderRadius: '4px', pointerEvents: 'none' }}></div>
                  {shelfRows.map((row, ridx) => (
                    <div key={row.id} style={{ marginBottom: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', minHeight: '300px', padding: '0 2px' }}>
                        {row.books.map((b: any) => (
                          <button key={b.id} onClick={b.onOpen} title={b.name} className="group hover:-translate-y-4 hover:rotate-[-0.6deg]" style={{ background: `linear-gradient(100deg,rgba(255,255,255,.13),rgba(0,0,0,.05) 32%,rgba(0,0,0,.24)), ${b.color}`, width: b.w + 'px', height: b.h + 'px', border: 'none', borderRadius: '2px 4px 2px 1px', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: 'inset 7px 0 11px -6px rgba(255,255,255,.32),inset -11px 0 14px -6px rgba(0,0,0,.5),0 14px 20px -10px rgba(0,0,0,.6)', transition: 'transform .22s ease,box-shadow .22s ease' }}>

                            {/* STYLE A — raised ribbed bands */}
                            {b.styleA && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 46px' }}>
                                <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, height: '7px', background: 'linear-gradient(180deg,rgba(255,255,255,.26),rgba(0,0,0,.36))', boxShadow: '0 2px 0 rgba(0,0,0,.3)' }}></div>
                                <div style={{ position: 'absolute', top: '51px', left: 0, right: 0, height: '7px', background: 'linear-gradient(180deg,rgba(255,255,255,.26),rgba(0,0,0,.36))', boxShadow: '0 2px 0 rgba(0,0,0,.3)' }}></div>
                                <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, height: '7px', background: 'linear-gradient(180deg,rgba(255,255,255,.26),rgba(0,0,0,.36))', boxShadow: '0 2px 0 rgba(0,0,0,.3)' }}></div>
                                <div style={{ position: 'absolute', bottom: '51px', left: 0, right: 0, height: '7px', background: 'linear-gradient(180deg,rgba(255,255,255,.26),rgba(0,0,0,.36))', boxShadow: '0 2px 0 rgba(0,0,0,.3)' }}></div>
                                <div style={{ zIndex: 2, marginTop: '2px', background: b.labelBg, border: '1px solid rgba(231,205,134,.6)', color: '#ecd592', fontFamily: '"Courier New", monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '.05em', padding: '2px 5px', borderRadius: '1px' }}>{b.code}</div>
                                <div style={{ zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
                                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f6edd4', fontWeight: 800, fontSize: b.spineFont + 'px', letterSpacing: '.04em', textAlign: 'center', textShadow: '0 1px 1px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>{b.spineLabel}</span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '13px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: '24px', height: '24px', borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.45),inset 0 1px 1px rgba(255,255,255,.5)' }}>{b.count}</div>
                              </div>
                            )}

                            {/* STYLE B — gilt cartouche */}
                            {b.styleB && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 46px' }}>
                                <div style={{ zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '8px', color: 'rgba(231,205,134,.78)', letterSpacing: '.08em' }}>{b.code}</div>
                                <div style={{ zIndex: 2, flex: 1, margin: '8px 7px', alignSelf: 'stretch', border: '2px solid #c9a44e', borderRadius: '7px', background: 'linear-gradient(180deg,rgba(231,205,134,.17),rgba(0,0,0,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 3px rgba(231,205,134,.16)', position: 'relative' }}>
                                  <div style={{ position: 'absolute', top: '5px', left: '50%', width: '7px', height: '7px', background: '#e7cd86', transform: 'translateX(-50%) rotate(45deg)' }}></div>
                                  <div style={{ position: 'absolute', bottom: '5px', left: '50%', width: '7px', height: '7px', background: '#e7cd86', transform: 'translateX(-50%) rotate(45deg)' }}></div>
                                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f6edd4', fontWeight: 800, fontSize: b.spineFont + 'px', letterSpacing: '.03em', textAlign: 'center', textShadow: '0 1px 1px rgba(0,0,0,.5)', whiteSpace: 'nowrap', padding: '14px 0' }}>{b.spineLabel}</span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '13px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: '24px', height: '24px', borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.45),inset 0 1px 1px rgba(255,255,255,.5)' }}>{b.count}</div>
                              </div>
                            )}

                            {/* STYLE C — clean minimal */}
                            {b.styleC && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '17px 0 46px' }}>
                                <div style={{ position: 'absolute', top: '33px', left: '13px', right: '13px', height: '1.5px', background: 'rgba(231,205,134,.62)' }}></div>
                                <div style={{ position: 'absolute', bottom: '33px', left: '13px', right: '13px', height: '1.5px', background: 'rgba(231,205,134,.62)' }}></div>
                                <div style={{ zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '8px', color: 'rgba(231,205,134,.72)', letterSpacing: '.12em' }}>{b.code}</div>
                                <div style={{ zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
                                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f6edd4', fontWeight: 700, fontSize: b.spineFont + 'px', letterSpacing: '.07em', textAlign: 'center', textShadow: '0 1px 1px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>{b.spineLabel}</span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '13px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: '24px', height: '24px', borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.45),inset 0 1px 1px rgba(255,255,255,.5)' }}>{b.count}</div>
                              </div>
                            )}

                            {/* STYLE D — two-tone label block */}
                            {b.styleD && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '0 0 46px' }}>
                                <div style={{ width: '100%', background: b.bandColor, borderBottom: '2px solid #c9a44e', padding: '9px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.32)' }}>
                                  <div style={{ fontFamily: '"Courier New", monospace', fontSize: '8px', color: '#e7cd86', letterSpacing: '.06em' }}>{b.code}</div>
                                </div>
                                <div style={{ zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f6edd4', fontWeight: 800, fontSize: b.spineFont + 'px', letterSpacing: '.04em', textAlign: 'center', textShadow: '0 1px 1px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>{b.spineLabel}</span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '13px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: '24px', height: '24px', borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.45),inset 0 1px 1px rgba(255,255,255,.5)' }}>{b.count}</div>
                              </div>
                            )}

                          </button>
                        ))}
                      </div>
                      <div style={{ height: '17px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', borderRadius: '2px', boxShadow: '0 5px 9px rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.18)' }}></div>
                    </div>
                  ))}
                </div>

                {/* RIGHT cabinet */}
                <div style={{ width: '140px', flexShrink: 0, borderLeft: '6px solid #3e2a1a', display: 'flex', flexDirection: 'row-reverse' }}>
                  <div style={{ width: '15px', background: 'repeating-linear-gradient(90deg,#241509 0,#4a3220 3px,#7a5230 5px,#4a3220 7px,#241509 9px)', boxShadow: 'inset 0 0 8px rgba(0,0,0,.5)' }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* niche: stacked almanacs */}
                    <div onClick={() => openSpecialCat('Imperial County History')} onMouseEnter={() => setHovAlmanac(true)} onMouseLeave={() => setHovAlmanac(false)} style={{ flex: 1, borderBottom: '6px solid #3e2a1a', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '16px', minHeight: '170px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: '12px', left: '11px', right: '11px', bottom: '11px', borderRadius: '54px 54px 5px 5px', background: 'linear-gradient(180deg,#33210f,#1d1106)', boxShadow: 'inset 0 10px 20px rgba(0,0,0,.6)', border: '1px solid rgba(231,205,134,.12)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-56%)', zIndex: 0, fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: '92px', lineHeight: 1, color: 'rgba(231,205,134,.10)', textShadow: '0 2px 0 rgba(0,0,0,.5),0 -1px 0 rgba(255,255,255,.05)', pointerEvents: 'none' }}>3</div>
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '74px', height: '17px', background: 'linear-gradient(90deg,#6a2828,#7a2e2e 60%,#5a2020)', borderRadius: '2px', boxShadow: '0 2px 3px rgba(0,0,0,.4)', position: 'relative', transform: 'rotate(-1.5deg)' }}><div style={{ position: 'absolute', top: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', bottom: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', top: '1px', bottom: '1px', right: '1px', width: '9px', background: 'linear-gradient(90deg,#c9bfa0,#f3ead0)', borderRadius: '0 2px 2px 0' }}></div></div>
                        <div style={{ width: '90px', height: '18px', marginTop: '-1px', background: 'linear-gradient(90deg,#23344a,#2c3e50 60%,#1c2c3e)', borderRadius: '2px', boxShadow: '0 2px 3px rgba(0,0,0,.4)', position: 'relative', transform: 'rotate(.8deg)' }}><div style={{ position: 'absolute', top: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', bottom: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', top: '1px', bottom: '1px', right: '1px', width: '9px', background: 'linear-gradient(90deg,#c9bfa0,#f3ead0)', borderRadius: '0 2px 2px 0' }}></div></div>
                        <div style={{ width: '80px', height: '17px', marginTop: '-1px', background: 'linear-gradient(90deg,#9c6a24,#b07a2b 60%,#8a5e22)', borderRadius: '2px', boxShadow: '0 2px 3px rgba(0,0,0,.4)', position: 'relative', transform: 'rotate(-.6deg)' }}><div style={{ position: 'absolute', top: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', bottom: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', top: '1px', bottom: '1px', right: '1px', width: '9px', background: 'linear-gradient(90deg,#c9bfa0,#f3ead0)', borderRadius: '0 2px 2px 0' }}></div></div>
                        <div style={{ width: '96px', height: '19px', marginTop: '-1px', background: 'linear-gradient(90deg,#24432e,#2d4b3e 60%,#1c3328)', borderRadius: '2px', boxShadow: '0 3px 4px rgba(0,0,0,.45)', position: 'relative', transform: 'rotate(1deg)' }}><div style={{ position: 'absolute', top: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', bottom: '4px', left: '5px', right: '14px', height: '1px', background: 'rgba(231,205,134,.6)' }}></div><div style={{ position: 'absolute', top: '1px', bottom: '1px', right: '1px', width: '10px', background: 'linear-gradient(90deg,#c9bfa0,#f3ead0)', borderRadius: '0 2px 2px 0' }}></div></div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', boxShadow: '0 -1px 0 rgba(255,255,255,.12)' }}></div>
                      <div style={{ position: 'absolute', bottom: '14px', zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '7.5px', fontWeight: 700, letterSpacing: '.08em', color: '#3a2a14', background: 'linear-gradient(180deg,#e3c878,#c39f4a)', padding: '2px 6px', borderRadius: '1px', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}>OLD ALMANACS</div>
                      {hovAlmanac && (
                        <div style={{ position: 'absolute', top: '14px', left: '11px', right: '11px', zIndex: 3, background: 'linear-gradient(180deg,#2E5534,#1d3a23)', color: '#f4ead0', border: '1px solid rgba(231,205,134,.5)', borderRadius: '4px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.5)', animation: 'sl-pop .18s ease' }}>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '7px', letterSpacing: '.2em', color: '#e7cd86', textTransform: 'uppercase' }}>Theme</div>
                          <div style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.18, marginTop: '2px' }}>Imperial County History</div>
                        </div>
                      )}
                    </div>
                    {/* niche: celestial globe */}
                    <div onClick={() => openSpecialCat('Imperial County & the Wider World')} onMouseEnter={() => setHovGlobe(true)} onMouseLeave={() => setHovGlobe(false)} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '16px', minHeight: '170px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: '12px', left: '11px', right: '11px', bottom: '11px', borderRadius: '54px 54px 5px 5px', background: 'linear-gradient(180deg,#33210f,#1d1106)', boxShadow: 'inset 0 10px 20px rgba(0,0,0,.6)', border: '1px solid rgba(231,205,134,.12)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-56%)', zIndex: 0, fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: '92px', lineHeight: 1, color: 'rgba(231,205,134,.10)', textShadow: '0 2px 0 rgba(0,0,0,.5),0 -1px 0 rgba(255,255,255,.05)', pointerEvents: 'none' }}>3</div>
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%,#f3e2ad,#c9a44e 58%,#956f2c)', boxShadow: 'inset -7px -7px 13px rgba(0,0,0,.34),0 3px 5px rgba(0,0,0,.4)' }}></div>
                          <div style={{ position: 'absolute', top: '50%', left: '-3px', right: '-3px', height: '3px', background: '#8a6a2c', transform: 'translateY(-50%)' }}></div>
                          <div style={{ position: 'absolute', inset: '-5px', borderRadius: '50%', border: '3px solid #b8923f', borderTopColor: '#e7d29a', borderBottomColor: '#7c5e26', transform: 'rotate(20deg)' }}></div>
                        </div>
                        <div style={{ width: '14px', height: '16px', background: 'linear-gradient(90deg,#8a6a2c,#e7d29a,#8a6a2c)', marginTop: '1px' }}></div>
                        <div style={{ width: '40px', height: '8px', borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 30%,#e7d29a,#b8923f)', boxShadow: '0 2px 3px rgba(0,0,0,.4)' }}></div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', boxShadow: '0 -1px 0 rgba(255,255,255,.12)' }}></div>
                      <div style={{ position: 'absolute', bottom: '14px', zIndex: 2, fontFamily: '"Courier New", monospace', fontSize: '7.5px', fontWeight: 700, letterSpacing: '.08em', color: '#3a2a14', background: 'linear-gradient(180deg,#e3c878,#c39f4a)', padding: '2px 6px', borderRadius: '1px', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}>CELESTIAL GLOBE</div>
                      {hovGlobe && (
                        <div style={{ position: 'absolute', top: '14px', left: '11px', right: '11px', zIndex: 3, background: 'linear-gradient(180deg,#2E5534,#1d3a23)', color: '#f4ead0', border: '1px solid rgba(231,205,134,.5)', borderRadius: '4px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.5)', animation: 'sl-pop .18s ease' }}>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '7px', letterSpacing: '.2em', color: '#e7cd86', textTransform: 'uppercase' }}>Theme</div>
                          <div style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.18, marginTop: '2px' }}>Imperial County &amp; the Wider World</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* base with dentils */}
              <div style={{ height: '26px', background: 'linear-gradient(180deg,#4a3220,#34230f)', border: '4px solid #3e2a1a', borderTop: 'none', borderRadius: '2px 2px 12px 12px', boxShadow: '0 16px 24px -12px rgba(0,0,0,.55)', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: '20px', right: '20px', top: '3px', height: '6px', background: 'repeating-linear-gradient(90deg,rgba(231,205,134,.5) 0,rgba(231,205,134,.5) 6px,transparent 6px,transparent 13px)' }}></div>
              </div>
              {/* bracket feet */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px', marginTop: '-2px' }}>
                <div style={{ width: '46px', height: '16px', background: 'linear-gradient(180deg,#4a3220,#2e1d10)', borderRadius: '0 0 8px 8px', boxShadow: '0 6px 8px -3px rgba(0,0,0,.5)' }}></div>
                <div style={{ width: '46px', height: '16px', background: 'linear-gradient(180deg,#4a3220,#2e1d10)', borderRadius: '0 0 8px 8px', boxShadow: '0 6px 8px -3px rgba(0,0,0,.5)' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= HOME: CATALOG ======================= */}
        {showCatalog && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1120px', margin: '0 auto', padding: '34px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
              <div>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.4em', textTransform: 'uppercase', color: '#A27532', fontWeight: 700 }}>Card Catalog</div>
                <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-.02em', margin: '8px 0 0' }}>Browse every shelf</h1>
              </div>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.45)' }}>{cats.length} shelves · {res.length} resources</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(258px,1fr))', gap: '16px' }}>
              {books.map(b => (
                <button key={b.id} onClick={b.onOpen} className="hover:-translate-y-1 hover:shadow-[0_12px_22px_-10px_rgba(0,0,0,0.28)]" style={{ textAlign: 'left', background: '#fff', border: '1px solid rgba(33,40,46,.1)', borderLeft: `7px solid ${b.color}`, borderRadius: '10px', padding: '18px 18px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 6px rgba(0,0,0,.05)', transition: 'transform .18s ease,box-shadow .18s ease', minHeight: '158px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(33,40,46,.45)', letterSpacing: '.04em' }}>{b.code}</span>
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, color: b.color, background: 'rgba(33,40,46,.05)', padding: '2px 8px', borderRadius: '999px' }}>{b.count} items</span>
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-.01em', color: '#21282E' }}>{b.name}</div>
                  <div style={{ fontSize: '13px', lineHeight: 1.45, color: 'rgba(33,40,46,.6)', flex: 1 }}>{b.blurb}</div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {b.dotColors.map((dc: string, didx: number) => (
                      <span key={didx} style={{ width: '9px', height: '9px', borderRadius: '50%', background: dc }}></span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================= CATEGORY BANNER ======================= */}
        {showCategory && currentCat && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '26px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            <button onClick={() => setCat(null)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(33,40,46,.6)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '16px', padding: 0 }}>← Back to the shelves</button>
            <div style={{ background: currentCat.headerBg, borderRadius: '14px', padding: '28px 30px', color: '#f4ead0', position: 'relative', overflow: 'hidden', boxShadow: '0 18px 34px -16px rgba(0,0,0,.5)' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '14px', background: 'rgba(0,0,0,.22)' }}></div>
              <div style={{ position: 'absolute', right: '34px', top: '-6px', width: '22px', height: '64px', background: '#DB9B2F', boxShadow: '0 4px 6px rgba(0,0,0,.3)' }}></div>
              <div style={{ position: 'absolute', right: '34px', top: '58px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid #DB9B2F' }}></div>
              <div style={{ paddingLeft: '14px', position: 'relative' }}>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', letterSpacing: '.18em', opacity: .8 }}>{currentCat.code} · {currentResources.length} RESOURCES</div>
                <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-.02em', margin: '8px 0 8px', maxWidth: '80%' }}>{currentCat.name}</h1>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.55, maxWidth: '560px', opacity: .92 }}>{currentCat.blurb}</p>
              </div>
            </div>

            {/* Workforce Vault link - only show for AI Industry & Work category */}
            {currentCat.name === 'AI Industry & Work' && (
              <div style={{ 
                marginTop: '18px', 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #1a3a5c 0%, #0f2744 100%)', 
                borderRadius: '12px', 
                border: '2px solid #2a5a8c',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    background: 'linear-gradient(135deg, #ffdd2e, #f0c000)', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                  }}>🔐</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '-.01em' }}>Workforce Resource Vault</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '2px' }}>Career resources for Creator & Environmental trails</div>
                  </div>
                </div>
                <Link 
                  href="/hub/workforce-pathways?node=all" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '11px 20px', 
                    background: 'linear-gradient(180deg, #ffdd2e, #e8c800)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#1a3a5c', 
                    fontFamily: '"Exo", sans-serif', 
                    fontWeight: 800, 
                    fontSize: '13px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '.04em', 
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(255,221,46,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:scale-105"
                >
                  Explore Vault
                  <span>→</span>
                </Link>
              </div>
            )}

            {/* type filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '22px 0 4px', alignItems: 'center' }}>
              {typeChips.map(t => (
                <button key={t.id} onClick={t.onClick} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
                  {t.active ? (
                    <span style={{ display: 'inline-block', padding: '7px 13px', borderRadius: '999px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, border: `1.5px solid ${t.color}`, background: t.color, color: '#fff' }}>{t.label} · {t.count}</span>
                  ) : (
                    <span style={{ display: 'inline-block', padding: '7px 13px', borderRadius: '999px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, border: '1.5px solid rgba(33,40,46,.2)', background: 'transparent', color: 'rgba(33,40,46,.62)' }}>{t.label} · {t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================= SEARCH HEADER ======================= */}
        {showSearch && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '28px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            <button onClick={() => setQ('')} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(33,40,46,.6)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '14px', padding: 0 }}>← Clear search</button>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.01em', margin: '0 0 4px' }}>Searching the stacks</h1>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: '13px', color: 'rgba(33,40,46,.55)' }}>“{q}” — {currentResources.length} results</div>
          </div>
        )}

        {/* ======================= RESOURCE LIST ======================= */}
        {showList && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '18px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            {currentResources.length > 0 ? (
              <>
                {/* Cards / Open Book Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(33,40,46,.5)', marginRight: 'auto' }}>{currentResources.length} resources</span>
                  <div style={{ display: 'flex', gap: '3px', background: 'rgba(33,40,46,.07)', padding: '3px', borderRadius: '9px' }}>
                    <button onClick={() => { setListMode('cards'); setBookSpread(0); }} style={{ padding: '7px 14px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: listMode === 'cards' ? '#fff' : 'transparent', color: listMode === 'cards' ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: listMode === 'cards' ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Cards</button>
                    <button onClick={() => { setListMode('book'); setBookSpread(0); }} style={{ padding: '7px 14px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: listMode === 'book' ? '#fff' : 'transparent', color: listMode === 'book' ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: listMode === 'book' ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Open Book</button>
                  </div>
                </div>

                {/* CARDS MODE */}
                {listMode === 'cards' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '13px' }}>
                    {currentResources.map(r => (
                      <div key={r.id} onClick={r.onOpen} className="hover:-translate-y-[3px] hover:shadow-[0_12px_20px_-10px_rgba(0,0,0,0.25)]" style={{ position: 'relative', background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderLeft: `5px solid ${r.typeColor}`, borderRadius: '9px', padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,.05)', transition: 'transform .16s ease,box-shadow .16s ease', overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: r.typeColor, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '9.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.typeCode}</span>
                          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: r.typeColor, fontWeight: 700, flexShrink: 0 }}>{r.typeLabel}</span>
                          {r.peerReviewed && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(180deg,#e7cd86,#c9a44e)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 7px', borderRadius: '3px', flexShrink: 0 }}>✓ Peer-Reviewed</span>
                          )}
                          {r.sourceTag && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: r.sourceTag === 'contributor' ? '#2E5534' : r.sourceTag === 'student' ? '#3da87a' : r.sourceTag === 'vault' ? '#7653b8' : r.sourceTag === 'partner' ? '#c06e30' : '#4088b8', color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 5px', borderRadius: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}>★ {r.sourceTag}</span>
                          )}
                          <span style={{ flex: 1 }}></span>
                          {r.bookmarked ? (
                            <button onClick={r.onBookmark} title="Remove bookmark" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1, color: '#C9A44E', flexShrink: 0 }}>★</button>
                          ) : (
                            <button onClick={r.onBookmark} title="Bookmark to My Shelf" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1, color: 'rgba(33,40,46,.3)', flexShrink: 0 }}>☆</button>
                          )}
                          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: 'rgba(33,40,46,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px', flexShrink: 1 }}>{r.source}</span>
                        </div>
                        <div style={{ fontSize: '15.5px', fontWeight: 700, lineHeight: 1.28, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.title}</div>
                        <div style={{ fontSize: '12.5px', lineHeight: 1.45, color: 'rgba(33,40,46,.6)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.note}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* OPEN BOOK MODE */}
                {listMode === 'book' && (() => {
                  // Build pages: title page on left, then resources one per page, then end page
                  const pages: Array<{ type: 'title' | 'resource' | 'end' | 'blank', data?: any }> = [];
                  pages.push({ type: 'title' });
                  currentResources.forEach(r => pages.push({ type: 'resource', data: r }));
                  pages.push({ type: 'end' });
                  // Ensure even number of pages for spreads
                  if (pages.length % 2 !== 0) pages.push({ type: 'blank' });

                  const totalSpreads = Math.ceil(pages.length / 2);
                  const leftIdx = bookSpread * 2;
                  const rightIdx = leftIdx + 1;
                  const leftPage = pages[leftIdx] || { type: 'blank' };
                  const rightPage = pages[rightIdx] || { type: 'blank' };

                  const canPrev = bookSpread > 0;
                  const canNext = bookSpread < totalSpreads - 1;

                  const goNext = () => {
                    if (!canNext || flipNext || flipPrev) return;
                    setFlipNext(true);
                    setTimeout(() => { setBookSpread(s => s + 1); setFlipNext(false); }, 480);
                  };
                  const goPrev = () => {
                    if (!canPrev || flipPrev || flipNext) return;
                    setFlipPrev(true);
                    setTimeout(() => { setBookSpread(s => s - 1); setFlipPrev(false); }, 480);
                  };

                  const renderPage = (page: typeof leftPage) => {
                    if (page.type === 'title' && currentCat) {
                      return (
                        <div style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '14px' }}>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.3em', color: '#A27532', fontWeight: 700 }}>{currentCat.code}</div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: currentCat.color, boxShadow: '0 3px 8px rgba(0,0,0,.25)' }}></div>
                          <h2 style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1.15, margin: 0, maxWidth: '300px' }}>{currentCat.name}</h2>
                          <div style={{ width: '64px', height: '2px', background: '#c9a44e' }}></div>
                          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(33,40,46,.7)', maxWidth: '330px', margin: 0 }}>{currentCat.blurb}</p>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(33,40,46,.5)', letterSpacing: '.05em' }}>{currentResources.length} resources within · turn the page ›</div>
                        </div>
                      );
                    }
                    if (page.type === 'resource') {
                      const r = page.data;
                      return (
                        <div onClick={r.onOpen} style={{ cursor: 'pointer', minHeight: '380px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '5px', background: r.typeColor, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.typeCode}</span>
                            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: r.typeColor, fontWeight: 700 }}>{r.typeLabel}</span>
                            {r.peerReviewed && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(180deg,#e7cd86,#c9a44e)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 7px', borderRadius: '3px' }}>✓ Peer-Reviewed</span>
                            )}
                            {r.sourceTag && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: r.sourceTag === 'contributor' ? '#2E5534' : r.sourceTag === 'student' ? '#3da87a' : r.sourceTag === 'vault' ? '#7653b8' : r.sourceTag === 'partner' ? '#c06e30' : '#4088b8', color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>★ {r.sourceTag}</span>
                            )}
                            <span style={{ flex: 1 }}></span>
                            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: 'rgba(33,40,46,.4)' }}>{r.source}</span>
                            {r.bookmarked ? (
                              <button onClick={r.onBookmark} title="Remove bookmark" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1, color: '#C9A44E' }}>★</button>
                            ) : (
                              <button onClick={r.onBookmark} title="Bookmark to My Shelf" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1, color: 'rgba(33,40,46,.3)' }}>☆</button>
                            )}
                          </div>
                          <h3 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.26, letterSpacing: '-.01em', margin: 0 }}>{r.title}</h3>
                          <p style={{ fontSize: '14.5px', lineHeight: 1.62, color: 'rgba(33,40,46,.72)', margin: 0, flex: 1 }}>{r.note}</p>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(33,40,46,.5)', borderTop: '1px solid rgba(33,40,46,.16)', paddingTop: '11px' }}>Acquired {r.date}</div>
                          <div style={{ color: '#2E5534', fontWeight: 800, fontSize: '13px' }}>Open record →</div>
                        </div>
                      );
                    }
                    if (page.type === 'end') {
                      return (
                        <div style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px', color: 'rgba(33,40,46,.55)' }}>
                          <div style={{ width: '9px', height: '9px', background: '#c9a44e', transform: 'rotate(45deg)' }}></div>
                          <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', letterSpacing: '.22em' }}>END OF VOLUME</div>
                          <div style={{ fontSize: '13px' }}>{currentResources.length} resources catalogued in this book</div>
                        </div>
                      );
                    }
                    return <div style={{ minHeight: '380px' }}></div>;
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '4px 0 12px' }}>
                      <div style={{ position: 'relative', width: 'min(900px, 98%)' }}>
                        {/* Book binding/cover */}
                        <div style={{ background: 'linear-gradient(180deg,#5b3f29,#42301d)', borderRadius: '12px', padding: '15px', boxShadow: '0 30px 50px -22px rgba(0,0,0,.55)', border: '1px solid #2e1d10', position: 'relative' }}>
                          {/* Gold inset border */}
                          <div style={{ position: 'absolute', inset: '9px', border: '1.5px solid rgba(231,205,134,.32)', borderRadius: '8px', pointerEvents: 'none', zIndex: 6 }}></div>
                          {/* Book pages container */}
                          <div style={{ position: 'relative', display: 'flex', background: '#f4ead0', borderRadius: '3px', minHeight: '440px', boxShadow: 'inset 0 0 44px rgba(120,90,40,.2)', perspective: '2000px' }}>
                            {/* Center spine shadow */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '48px', background: 'linear-gradient(90deg,rgba(0,0,0,0),rgba(80,55,20,.26) 44%,rgba(80,55,20,.34) 50%,rgba(80,55,20,.26) 56%,rgba(0,0,0,0))', zIndex: 3, pointerEvents: 'none' }}></div>

                            {/* Left page */}
                            <div style={{ flex: 1, padding: '30px 36px', position: 'relative', zIndex: 1, backgroundImage: 'repeating-linear-gradient(transparent,transparent 33px,rgba(65,124,152,.07) 34px)' }}>
                              {renderPage(leftPage)}
                            </div>

                            {/* Right page */}
                            <div style={{ flex: 1, padding: '30px 36px', position: 'relative', zIndex: 1, backgroundImage: 'repeating-linear-gradient(transparent,transparent 33px,rgba(65,124,152,.07) 34px)' }}>
                              {renderPage(rightPage)}
                            </div>

                            {/* Page flip animations */}
                            {flipNext && (
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0, zIndex: 4, background: 'linear-gradient(90deg,#efe4c8,#f7eed6)', transformOrigin: 'left center', boxShadow: '-10px 0 22px rgba(0,0,0,.22)', animation: 'pageflip-next .52s ease-in forwards' }}></div>
                            )}
                            {flipPrev && (
                              <div style={{ position: 'absolute', top: 0, bottom: 0, right: '50%', left: 0, zIndex: 4, background: 'linear-gradient(270deg,#efe4c8,#f7eed6)', transformOrigin: 'right center', boxShadow: '10px 0 22px rgba(0,0,0,.22)', animation: 'pageflip-prev .52s ease-in forwards' }}></div>
                            )}
                          </div>
                        </div>

                        {/* Navigation buttons */}
                        {canPrev && (
                          <button onClick={goPrev} title="Previous page" style={{ position: 'absolute', left: '-21px', top: '50%', transform: 'translateY(-50%)', zIndex: 8, width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #4a3220', cursor: 'pointer', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontSize: '22px', fontWeight: 800, lineHeight: 1, boxShadow: '0 5px 12px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                        )}
                        {canNext && (
                          <button onClick={goNext} title="Next page" style={{ position: 'absolute', right: '-21px', top: '50%', transform: 'translateY(-50%)', zIndex: 8, width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #4a3220', cursor: 'pointer', background: 'radial-gradient(circle at 34% 30%,#f0dca0,#c9a44e 70%,#a07e36)', color: '#3a2a14', fontSize: '22px', fontWeight: 800, lineHeight: 1, boxShadow: '0 5px 12px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                        )}
                      </div>
                      {/* Spread label */}
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.12em', color: 'rgba(33,40,46,.55)', background: 'rgba(33,40,46,.06)', padding: '6px 16px', borderRadius: '999px' }}>
                        {bookSpread === 0 ? 'Title page' : `Pages ${bookSpread * 2 - 1}–${Math.min(bookSpread * 2, currentResources.length)}`} of {currentResources.length}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(33,40,46,.5)' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>This shelf is empty</div>
                <div style={{ fontSize: '14px' }}>Nothing here yet — try another type filter{showCategory && isAdmin ? ', or switch on Librarian Mode to add one.' : '.'}</div>
              </div>
            )}
          </div>
        )}

        {/* ======================= DETAIL MODAL ======================= */}
        {decoratedDetail && (
          <div onClick={decoratedDetail.onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 200, animation: 'sl-pop 0.25s ease' }}>
            <div onClick={decoratedDetail.stop} style={{ width: 'min(520px,94vw)', maxHeight: '90vh', overflow: 'auto', background: '#FBF3DC', border: '1px solid rgba(33,40,46,.22)', borderRadius: '7px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)', position: 'relative' }}>
              <div style={{ background: '#21282E', color: '#FBF3DC', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.16em' }}>
                <span>Steward Library · Card Catalog</span>
                <span style={{ opacity: .7 }}>{decoratedDetail.code}</span>
              </div>
              <div style={{ padding: '24px 26px 22px', position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent,transparent 33px,rgba(65,124,152,.13) 34px)' }}>
                <div style={{ position: 'absolute', top: '18px', right: '20px', border: '2px solid #9A3B2E', color: '#9A3B2E', fontFamily: '"Courier New", monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '4px 8px', transform: 'rotate(7deg)', opacity: .82, lineHeight: 1.2, textAlign: 'center' }}>Acquired<br/>{decoratedDetail.date}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '5px', background: decoratedDetail.typeColor, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{decoratedDetail.typeCode}</span>
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: decoratedDetail.typeColor, fontWeight: 700 }}>{decoratedDetail.typeLabel}</span>
                  {decoratedDetail.peerReviewed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(180deg,#e7cd86,#c9a44e)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,.15)' }}>✓ Peer-Reviewed</span>
                  )}
                  {decoratedDetail.sourceTag && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: decoratedDetail.sourceTag === 'contributor' ? 'linear-gradient(180deg,#5b8dd9,#3a6bc5)' : decoratedDetail.sourceTag === 'student' ? 'linear-gradient(180deg,#6bc5a0,#3da87a)' : decoratedDetail.sourceTag === 'vault' ? 'linear-gradient(180deg,#9b7fd4,#7653b8)' : decoratedDetail.sourceTag === 'partner' ? 'linear-gradient(180deg,#e09050,#c06e30)' : 'linear-gradient(180deg,#6ba8d4,#4088b8)', color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,.15)' }}>{decoratedDetail.sourceTag === 'contributor' ? '★' : decoratedDetail.sourceTag === 'student' ? '✎' : decoratedDetail.sourceTag === 'vault' ? '◆' : decoratedDetail.sourceTag === 'partner' ? '⚙' : '⚡'} {decoratedDetail.sourceTag}</span>
                  )}
                </div>
                <h2 style={{ fontSize: '25px', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-.01em', margin: '0 0 12px', maxWidth: '88%' }}>{decoratedDetail.title}</h2>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.6)', marginBottom: '14px' }}>Shelf — {decoratedDetail.catName}</div>
                <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: 'rgba(33,40,46,.82)', margin: '0 0 14px' }}>{decoratedDetail.note}</p>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.55)', borderTop: '1px solid rgba(33,40,46,.15)', paddingTop: '12px' }}>Source — {decoratedDetail.source || 'Local'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '16px 26px 22px' }}>
                <Link href={`/hub/library/${decoratedDetail.rawId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2E5534', color: '#FEFAE0', textDecoration: 'none', padding: '12px 20px', borderRadius: '7px', fontWeight: 800, fontSize: '14px', boxShadow: '0 3px 0 #1d3a23' }}>Open Resource ↗</Link>
                {decoratedDetail.bookmarked ? (
                  <button onClick={decoratedDetail.onBookmark} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(180deg,#e3c878,#c39f4a)', color: '#3a2a14', border: 'none', padding: '12px 18px', borderRadius: '7px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.5)' }}>★ Bookmarked</button>
                ) : (
                  <button onClick={decoratedDetail.onBookmark} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'none', border: '1.5px solid rgba(162,117,50,.55)', color: '#A27532', padding: '11px 17px', borderRadius: '7px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif' }}>☆ Bookmark</button>
                )}
                <button onClick={decoratedDetail.onClose} style={{ background: 'none', border: '1.5px solid rgba(33,40,46,.25)', color: '#21282E', padding: '11px 18px', borderRadius: '7px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= FORM MODAL ======================= */}
        {form && (
          <div onClick={() => setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 215, animation: 'sl-pop 0.25s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,94vw)', maxHeight: '92vh', overflow: 'auto', background: '#FBF3DC', border: '1px solid rgba(33,40,46,.22)', borderRadius: '7px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)' }}>
              <div style={{ background: '#21282E', color: '#FBF3DC', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.16em' }}>
                <span>{form.mode === 'add-direct' ? 'New Acquisition' : form.mode === 'add' ? 'Suggest a Resource' : form.mode === 'edit' ? 'Edit Record' : 'New Shelf'}</span>
                <span style={{ opacity: .7 }}>Steward Library</span>
              </div>
              <div style={{ padding: '22px 26px 8px' }}>

                {(form.mode !== 'shelf') && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Title</div>
                      <input value={form.data.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. The data center boom in the desert" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', color: '#21282E', outline: 'none' }} className="sl-placeholder" />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Link (URL)</div>
                      <input value={form.data.url} onChange={(e) => setF('url', e.target.value)} placeholder="https://…" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#21282E', outline: 'none' }} className="sl-placeholder" />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '170px' }}>
                        <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Book</div>
                        <select value={form.data.cat} onChange={(e) => setF('cat', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', color: '#21282E', outline: 'none' }}>
                          {cats.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Type</div>
                        <select value={form.data.type} onChange={(e) => setF('type', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', color: '#21282E', outline: 'none' }}>
                          {TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Note <span style={{ opacity: .55, textTransform: 'none' }}>(one line for students)</span></div>
                      <textarea value={form.data.note} onChange={(e) => setF('note', e.target.value)} rows={3} placeholder="What is this and why does it matter?" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', color: '#21282E', outline: 'none', resize: 'vertical' }} className="sl-placeholder"></textarea>
                    </div>
                    {/* Peer-reviewed checkbox — only for admin direct add */}
                    {form.mode === 'add-direct' && (
                      <div style={{ marginTop: '14px', marginBottom: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', cursor: 'pointer', background: 'rgba(46,85,52,.06)', border: '1.5px solid rgba(46,85,52,.28)', borderRadius: '8px', padding: '12px 14px' }}>
                          <input type="checkbox" checked={form.data.peerReviewed || false} onChange={(e) => setF('peerReviewed', e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '1px', accentColor: '#2E5534', cursor: 'pointer', flexShrink: 0 }} />
                          <span>
                            <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#21282E' }}>Peer-reviewed study</span>
                            <span style={{ display: 'block', fontSize: '12px', lineHeight: 1.4, color: 'rgba(33,40,46,.62)', marginTop: '2px' }}>Tick if this link is — or references — a peer-reviewed study. It earns a gilt seal in the AI Research book and across the catalog.</span>
                          </span>
                        </label>
                      </div>
                    )}
                    {/* Source tag — only for admin direct add */}
                    {form.mode === 'add-direct' && (
                      <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                        <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Source Tag</div>
                        <select value={form.data.sourceTag || ''} onChange={(e) => setF('sourceTag', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', fontWeight: 700, color: '#21282E', outline: 'none', cursor: 'pointer' }}>
                          <option value="">None (standard resource)</option>
                          <option value="contributor">★ Contributor</option>
                          <option value="student">✎ Student</option>
                          <option value="vault">◆ Vault</option>
                          <option value="partner">⚙ Partner</option>
                          <option value="ai-generated">⚡ AI Generated</option>
                        </select>
                      </div>
                    )}
                    {/* Info blurb for suggestions */}
                    {form.mode === 'add' && (
                      <div style={{ marginTop: '14px', marginBottom: '6px', background: 'rgba(65,124,152,.08)', border: '1.5px solid rgba(65,124,152,.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px', lineHeight: 1.5, color: 'rgba(33,40,46,.72)' }}>
                        <strong style={{ color: '#21282E' }}>A librarian reviews every suggestion.</strong> Once approved, it joins the shelf for everyone — no edit or delete access needed on your end.
                      </div>
                    )}
                  </>
                )}

                {form.mode === 'shelf' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Shelf name</div>
                      <input value={form.data.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. AI & Local Governance" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(33,40,46,.25)', borderRadius: '6px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '14px', color: '#21282E', outline: 'none' }} className="sl-placeholder" />
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '9px' }}>Spine colour</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
                        {PALETTE.map(col => {
                          const ring = col === form.data.color ? `0 0 0 3px #FBF3DC, 0 0 0 5px ${col}` : '0 1px 2px rgba(0,0,0,.2)';
                          return (
                            <button key={col} onClick={() => setF('color', col)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: col, border: 'none', cursor: 'pointer', boxShadow: ring }}></button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '14px 26px 22px' }}>
                <button onClick={() => setForm(null)} style={{ background: 'none', border: '1.5px solid rgba(33,40,46,.25)', color: '#21282E', padding: '11px 18px', borderRadius: '7px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif' }}>Cancel</button>
                <button onClick={saveForm} disabled={isSubmitting || !form.data.title || !form.data.url} style={{ background: '#2E5534', color: '#FEFAE0', border: 'none', padding: '11px 22px', borderRadius: '7px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif', boxShadow: '0 3px 0 #1d3a23', opacity: (isSubmitting || !form.data.title || !form.data.url) ? 0.45 : 1 }}>
                  {isSubmitting ? 'Saving...' : form.mode === 'add-direct' ? 'Save to Library' : 'Suggest to Librarians'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= LIBRARIAN CONSOLE MODAL ======================= */}
        {consoleOpen && (
          <div onClick={() => { setConsoleOpen(false); setShowSuggestions(false); setSuggestionDetail(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.62)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 206, animation: 'sl-pop 0.25s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(660px,95vw)', maxHeight: '90vh', overflow: 'auto', background: '#FBF3DC', border: '1px solid rgba(33,40,46,.22)', borderRadius: '11px', boxShadow: '0 30px 70px -20px rgba(0,0,0,.65)' }}>
              {/* Header */}
              <div style={{ position: 'sticky', top: 0, background: '#21282E', color: '#FBF3DC', padding: '15px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, borderRadius: '11px 11px 0 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.16em' }}>Librarian Console</span>
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '.05em', color: 'rgba(231,205,134,.85)', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5fae6b', boxShadow: '0 0 6px #5fae6b' }}></span>Signed in as Librarian · session linked</span>
                </div>
                <button onClick={() => { setConsoleOpen(false); setShowSuggestions(false); setSuggestionDetail(null); }} style={{ background: 'none', border: 'none', color: '#FBF3DC', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '30px', fontWeight: 700, color: '#2E5534', lineHeight: 1 }}>{cats.length}</div>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.5)', marginTop: '5px' }}>Thematic Books</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '30px', fontWeight: 700, color: '#417C98', lineHeight: 1 }}>{res.length}</div>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.5)', marginTop: '5px' }}>Resources</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '30px', fontWeight: 700, color: '#A27532', lineHeight: 1 }}>{suggestions.length}</div>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.5)', marginTop: '5px' }}>Pending Review</div>
                  </div>
                </div>

                {/* Curation actions */}
                <div>
                  <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(33,40,46,.5)', fontWeight: 700, marginBottom: '10px' }}>Curation</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button onClick={() => setShowSuggestions(!showSuggestions)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: showSuggestions ? '#7c531f' : '#A27532', color: '#FEFAE0', border: 'none', padding: '11px 18px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: showSuggestions ? '0 1px 0 #5a3a15' : '0 3px 0 #7c531f' }}>
                      {showSuggestions ? '← Back' : 'Review Suggestions'}
                      {suggestions.length > 0 && !showSuggestions && (
                        <span style={{ minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '999px', background: '#fff', color: '#A27532', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{suggestions.length}</span>
                      )}
                    </button>
                    <button onClick={() => { setConsoleOpen(false); setForm({ mode: 'add-direct', data: { title: '', url: '', cat: cats[0]?.id || '', type: 'article', note: '', peerReviewed: false, sourceTag: '' } }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E5534', color: '#FEFAE0', border: 'none', padding: '11px 18px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 3px 0 #1d3a23' }}>+ Add Resource</button>
                    <button onClick={() => { setConsoleOpen(false); setForm({ mode: 'shelf', data: { name: '', color: PALETTE[0] } }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#2E5534', border: '1.5px solid rgba(46,85,52,.45)', padding: '11px 18px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>+ Add Book</button>
                  </div>
                </div>

                {/* Suggestions Review Section */}
                {showSuggestions ? (
                  <div style={{ background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderRadius: '11px', padding: '18px 20px', animation: 'sl-fade 0.25s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontFamily: '"Exo", sans-serif', fontSize: '15px', fontWeight: 800, color: '#21282E' }}>Community Suggestions</div>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'rgba(33,40,46,.55)', marginBottom: '16px' }}>A librarian reviews every suggestion. Approve to add it to the shelf for everyone.</div>
                    
                    {suggestions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 20px', color: 'rgba(33,40,46,.45)' }}>
                        <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em' }}>No pending suggestions</div>
                        <div style={{ fontSize: '12px', marginTop: '6px', fontStyle: 'italic' }}>Community submissions will appear here for your review.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {suggestions.map((s) => (
                          <div key={s.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: '#fdf8ea', border: '1px solid rgba(162,117,50,.15)' }}>
                            <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '9px', background: 'rgba(46,85,52,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: '"Exo", sans-serif', fontSize: '14px', fontWeight: 700, color: '#21282E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                              <div style={{ fontSize: '11.5px', color: 'rgba(33,40,46,.55)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.note || 'No note provided'}</div>
                              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: 'rgba(33,40,46,.4)', marginTop: '5px', letterSpacing: '.04em' }}>{s.category || 'Uncategorized'} · {s.resource_type || 'Link'} · by {s.submitted_by_name || 'Anonymous'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button onClick={() => setSuggestionDetail(s)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(33,40,46,.15)', background: '#fff', color: '#21282E', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                ◎ Details
                              </button>
                              <button onClick={() => handleSuggestionAction(s.id, 'approved')} disabled={suggestionProcessing === s.id} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#2E5534', color: '#FEFAE0', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: suggestionProcessing === s.id ? 'wait' : 'pointer', opacity: suggestionProcessing === s.id ? 0.6 : 1, boxShadow: '0 2px 0 #1d3a23' }}>
                                Approve
                              </button>
                              <button onClick={() => handleSuggestionAction(s.id, 'rejected')} disabled={suggestionProcessing === s.id} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(220,80,80,.3)', background: '#fff', color: '#c04040', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: suggestionProcessing === s.id ? 'wait' : 'pointer', opacity: suggestionProcessing === s.id ? 0.6 : 1 }}>
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Show hint when suggestions not expanded */}
                    <div style={{ fontSize: '12px', color: 'rgba(33,40,46,.5)', marginTop: '-10px', fontStyle: 'italic' }}>
                      {suggestions.length === 0 
                        ? 'No suggestions waiting — community submissions appear here for approval.'
                        : `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} waiting for review.`
                      }
                    </div>

                {/* Backend bridge */}
                <div style={{ background: 'linear-gradient(135deg,#21282E,#2c3742)', borderRadius: '11px', padding: '20px 22px', color: '#FBF3DC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(231,205,134,.16)', border: '1px solid rgba(231,205,134,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>⛬</div>
                    <div style={{ fontFamily: '"Exo", sans-serif', fontSize: '15px', fontWeight: 800 }}>Back-End Admin Console</div>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'rgba(251,243,220,.78)', margin: '0 0 16px' }}>Your librarian role is linked to the Steward admin console. Open the full back-end to manage user accounts & roles, view the audit log of every approval and edit, and configure the curriculum sections — including the four Environmental Literacy themes.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <Link href="/admin/library" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#E7CD86', color: '#21282E', border: 'none', padding: '11px 20px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 3px 0 #b89c52', textDecoration: 'none' }}>Open Admin Console ↗</Link>
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(231,205,134,.7)', letterSpacing: '.04em' }}>/admin/library</span>
                  </div>
                </div>

                {/* Reader profile bridge */}
                <div style={{ background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderRadius: '11px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(162,117,50,.14)', border: '1px solid rgba(162,117,50,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#A27532' }}>★</div>
                    <div style={{ fontFamily: '"Exo", sans-serif', fontSize: '15px', fontWeight: 800 }}>Reader Profile & Bookmarks</div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                    <div><span style={{ fontFamily: '"Courier New", monospace', fontSize: '24px', fontWeight: 700, color: '#A27532' }}>{Object.keys(bookmarks).length}</span> <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(33,40,46,.5)', textTransform: 'uppercase', letterSpacing: '.08em' }}>bookmarked</span></div>
                    <div><span style={{ fontFamily: '"Courier New", monospace', fontSize: '24px', fontWeight: 700, color: '#2E5534' }}>0</span> <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(33,40,46,.5)', textTransform: 'uppercase', letterSpacing: '.08em' }}>read</span></div>
                  </div>
                  <p style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'rgba(33,40,46,.62)', margin: '0 0 14px' }}>Bookmarks and reading history sync to each member's profile on Steward Works, where they keep their personal collection.</p>
                  <button onClick={() => { setConsoleOpen(false); router.push('/hub/my-profile'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2E5534', color: '#FEFAE0', border: 'none', padding: '10px 18px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 3px 0 #1d3a23' }}>Open My Profile ↗</button>
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= SUGGESTION DETAIL MODAL ======================= */}
        {suggestionDetail && (
          <div onClick={() => setSuggestionDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 210, animation: 'sl-pop 0.2s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(480px,95vw)', maxHeight: '85vh', overflow: 'auto', background: '#fff', border: '1px solid rgba(33,40,46,.15)', borderRadius: '14px', boxShadow: '0 24px 48px rgba(0,0,0,.25)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(33,40,46,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: '"Exo", sans-serif', fontSize: '16px', fontWeight: 800, color: '#21282E' }}>Suggestion Details</div>
                <button onClick={() => setSuggestionDetail(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'rgba(33,40,46,.4)', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.45)', marginBottom: '4px' }}>Title</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#21282E' }}>{suggestionDetail.title}</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.45)', marginBottom: '4px' }}>URL</div>
                  <a href={suggestionDetail.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#A27532', fontWeight: 600, wordBreak: 'break-all' }}>{suggestionDetail.url}</a>
                </div>
                <div style={{ background: '#fdf8ea', padding: '14px', borderRadius: '9px', border: '1px solid rgba(162,117,50,.12)' }}>
                  <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.5)', marginBottom: '4px' }}>Submitter Note</div>
                  <div style={{ fontSize: '13px', color: '#21282E', lineHeight: 1.5 }}>{suggestionDetail.note || 'No note provided.'}</div>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.45)', marginBottom: '4px' }}>Category</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#21282E' }}>{suggestionDetail.category || 'Uncategorized'}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.45)', marginBottom: '4px' }}>Type</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#21282E' }}>{suggestionDetail.resource_type || 'Link'}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(33,40,46,.1)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setSuggestionDetail(null)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(33,40,46,.15)', background: '#fff', color: '#21282E', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer' }}>Close</button>
                <button onClick={() => handleSuggestionAction(suggestionDetail.id, 'approved')} disabled={suggestionProcessing === suggestionDetail.id} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#2E5534', color: '#FEFAE0', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: suggestionProcessing === suggestionDetail.id ? 'wait' : 'pointer', opacity: suggestionProcessing === suggestionDetail.id ? 0.6 : 1, boxShadow: '0 3px 0 #1d3a23' }}>Approve</button>
                <button onClick={() => handleSuggestionAction(suggestionDetail.id, 'rejected')} disabled={suggestionProcessing === suggestionDetail.id} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(220,80,80,.3)', background: '#fff', color: '#c04040', fontFamily: '"Exo", sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.06em', cursor: suggestionProcessing === suggestionDetail.id ? 'wait' : 'pointer', opacity: suggestionProcessing === suggestionDetail.id ? 0.6 : 1 }}>Reject</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
