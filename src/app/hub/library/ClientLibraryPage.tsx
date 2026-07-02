'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function ClientLibraryPage({ initialResources }: { initialResources: any[] }) {
  const [view, setView] = useState<'shelf'|'catalog'>('shelf');
  const [cat, setCat] = useState<string | null>(null);
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resources, setResources] = useState<any[]>(initialResources);

  // Map real categories
  const { cats, res } = useMemo(() => {
    const uniqueCats = new Map();
    const mappedRes = resources.map((r, i) => {
      const catId = r.category?.id || 'uncategorized';
      if (!uniqueCats.has(catId)) {
        const catName = r.category?.label || 'Uncategorized';
        const colorIdx = uniqueCats.size % PALETTE.length;
        uniqueCats.set(catId, {
          id: catId,
          name: catName,
          spineLabel: catName,
          code: (300 + uniqueCats.size * 10).toString() + '.0',
          color: PALETTE[colorIdx],
          blurb: r.category?.description || `Resources related to ${catName}.`
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
        raw: r
      };
    });
    
    const catsArr = Array.from(uniqueCats.values());
    return { cats: catsArr, res: mappedRes };
  }, [resources]);

  const cm: Record<string, any> = {}; 
  cats.forEach(c => cm[c.id] = c);

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
      onOpen: () => setDetail(r),
      onClose: () => setDetail(null),
      stop: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); }
    };
  };

  const counts: Record<string, number> = {}; 
  res.forEach(r => counts[r.cat] = (counts[r.cat] || 0) + 1);
  
  const books = cats.map((c, i) => {
    const list = res.filter(r => r.cat === c.id);
    const seen: string[] = []; 
    list.forEach(r => { const col = (TYPE_MAP[r.type] || {}).color; if (col && !seen.includes(col)) seen.push(col); });
    return {
      ...c,
      count: counts[c.id] || 0,
      dotColors: seen.slice(0, 6),
      h: 254 + ((i * 37) % 46),
      w: 82 + ((i * 53) % 24),
      headerBg: `linear-gradient(135deg, ${c.color}, ${darken(c.color, 0.42)})`,
      onOpen: () => { setCat(c.id); setType('all'); setQ(''); setDetail(null); },
      onAdd: () => {
        setDetail(null);
        setForm({ mode: 'add', data: { title: '', url: '', cat: c.id, type: 'article', note: '' } });
      }
    };
  });
  const shelfRows = chunk(books, 6);

  const isSearching = q.trim() !== '';
  const currentCat = cat ? books.find(b => b.id === cat) : null;
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
      setForm(null);
    } catch (err) {
      toast.error('Error submitting suggestion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sl-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sl-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
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

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the stacks…" className="sl-placeholder" style={{ width: '230px', maxWidth: '42vw', padding: '9px 14px', border: '1.5px solid rgba(33,40,46,.2)', borderRadius: '999px', background: '#fff', fontFamily: '"Exo", sans-serif', fontSize: '13px', color: '#21282E', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '3px', background: 'rgba(33,40,46,.07)', padding: '3px', borderRadius: '9px' }}>
            <button onClick={() => setView('shelf')} style={{ padding: '7px 15px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '#fff' : 'transparent', color: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: showShelf || showCategory || (view === 'shelf' && !isSearching) ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Shelf</button>
            <button onClick={() => setView('catalog')} style={{ padding: '7px 15px', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '6px', background: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '#fff' : 'transparent', color: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '#21282E' : 'rgba(33,40,46,.5)', boxShadow: showCatalog || (view === 'catalog' && !isSearching && !currentCat) ? '0 1px 2px rgba(0,0,0,.14)' : 'none' }}>Catalog</button>
          </div>

          <button onClick={() => setForm({ mode: 'add', data: { title: '', url: '', cat: currentCat ? currentCat.id : (cats[0] && cats[0].id), type: 'article', note: '' } })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E5534', color: '#FEFAE0', border: 'none', padding: '9px 16px', borderRadius: '8px', fontFamily: '"Exo", sans-serif', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer', boxShadow: '0 3px 0 #1d3a23' }}>+ Suggest Resource</button>
        </div>

        {/* ======================= HOME: SHELF ======================= */}
        {showShelf && (
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1120px', margin: '0 auto', padding: '38px 26px 0', animation: 'sl-fade 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.4em', textTransform: 'uppercase', color: '#A27532', fontWeight: 700 }}>A Reading Room of Resources</div>
              <h1 style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-.02em', margin: '10px 0 8px' }}>Pull a book from the shelf</h1>
              <p style={{ maxWidth: '620px', margin: '0 auto', fontSize: '16px', lineHeight: 1.6, color: 'rgba(33,40,46,.65)' }}>Every shelf is a topic, every spine a category from the curriculum. Choose one to browse its links — filter by type, or use Librarian Mode to add your own.</p>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.45)', marginTop: '14px', letterSpacing: '.05em' }}>{cats.length} shelves · {res.length} resources catalogued</div>
            </div>

            {/* bookcase */}
            <div style={{ background: 'linear-gradient(180deg,#5b3f29,#4a3220)', border: '7px solid #3e2a1a', borderRadius: '12px', padding: '26px 30px 20px', boxShadow: 'inset 0 3px 14px rgba(0,0,0,.45),0 30px 50px -22px rgba(0,0,0,.55)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '7px', border: '1px solid rgba(255,255,255,.06)', borderRadius: '6px', pointerEvents: 'none' }}></div>
              {shelfRows.map((row, ridx) => (
                <div key={row.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '11px', minHeight: '300px', padding: '0 6px' }}>
                    {row.books.map((b: any) => (
                      <button key={b.id} onClick={b.onOpen} title={b.name} className="group hover:-translate-y-4 hover:rotate-[-0.6deg]" style={{ background: b.color, width: b.w + 'px', height: b.h + 'px', border: 'none', borderRadius: '3px 3px 1px 1px', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0 11px', boxShadow: 'inset 7px 0 11px -6px rgba(255,255,255,.3),inset -10px 0 13px -6px rgba(0,0,0,.45),0 14px 20px -10px rgba(0,0,0,.6)', transition: 'transform .22s ease,box-shadow .22s ease' }}>
                        <div style={{ width: '74%', height: '2px', background: 'rgba(244,234,208,.55)', marginTop: '2px' }}></div>
                        <div style={{ background: 'rgba(250,243,220,.92)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '8.5px', fontWeight: 700, letterSpacing: '.04em', padding: '2px 4px', borderRadius: '2px', marginTop: '6px' }}>{b.code}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
                          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#f4ead0', fontWeight: 800, fontSize: '13px', letterSpacing: '.04em', textAlign: 'center', textShadow: '0 1px 1px rgba(0,0,0,.35)', whiteSpace: 'nowrap' }}>{b.spineLabel}</span>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(250,243,220,.92)', color: '#3a2a14', fontFamily: '"Courier New", monospace', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.count}</div>
                        <div style={{ width: '74%', height: '2px', background: 'rgba(244,234,208,.55)', marginBottom: '2px' }}></div>
                      </button>
                    ))}
                  </div>
                  <div style={{ height: '17px', background: 'linear-gradient(180deg,#7a5230,#5a3c24)', borderRadius: '2px', boxShadow: '0 5px 9px rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.18)' }}></div>
                </div>
              ))}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '13px' }}>
                {currentResources.map(r => (
                  <div key={r.id} onClick={r.onOpen} className="hover:-translate-y-[3px] hover:shadow-[0_12px_20px_-10px_rgba(0,0,0,0.25)]" style={{ position: 'relative', background: '#fff', border: '1px solid rgba(33,40,46,.12)', borderLeft: `5px solid ${r.typeColor}`, borderRadius: '9px', padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,.05)', transition: 'transform .16s ease,box-shadow .16s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: r.typeColor, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '9.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.typeCode}</span>
                      <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: r.typeColor, fontWeight: 700 }}>{r.typeLabel}</span>
                      <span style={{ flex: 1 }}></span>
                      <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: 'rgba(33,40,46,.4)' }}>{r.source}</span>
                    </div>
                    <div style={{ fontSize: '15.5px', fontWeight: 700, lineHeight: 1.28, letterSpacing: '-.01em' }}>{r.title}</div>
                    <div style={{ fontSize: '12.5px', lineHeight: 1.45, color: 'rgba(33,40,46,.6)' }}>{r.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(33,40,46,.5)' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>This shelf is empty</div>
                <div style={{ fontSize: '14px' }}>Nothing here yet — try another type filter{showCategory ? ', or switch on Librarian Mode to add one.' : '.'}</div>
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
                </div>
                <h2 style={{ fontSize: '25px', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-.01em', margin: '0 0 12px', maxWidth: '88%' }}>{decoratedDetail.title}</h2>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.6)', marginBottom: '14px' }}>Shelf — {decoratedDetail.catName}</div>
                <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: 'rgba(33,40,46,.82)', margin: '0 0 14px' }}>{decoratedDetail.note}</p>
                <div style={{ fontFamily: '"Courier New", monospace', fontSize: '12px', color: 'rgba(33,40,46,.55)', borderTop: '1px solid rgba(33,40,46,.15)', paddingTop: '12px' }}>Source — {decoratedDetail.source || 'Local'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '16px 26px 22px' }}>
                <Link href={`/hub/library/${decoratedDetail.rawId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2E5534', color: '#FEFAE0', textDecoration: 'none', padding: '12px 20px', borderRadius: '7px', fontWeight: 800, fontSize: '14px', boxShadow: '0 3px 0 #1d3a23' }}>Open Resource ↗</Link>
                <button onClick={decoratedDetail.onClose} style={{ background: 'none', border: '1.5px solid rgba(33,40,46,.25)', color: '#21282E', padding: '11px 18px', borderRadius: '7px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo", sans-serif' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= FORM MODAL ======================= */}
        {form && (
          <div onClick={() => setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 200, animation: 'sl-pop 0.25s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,94vw)', maxHeight: '92vh', overflow: 'auto', background: '#FBF3DC', border: '1px solid rgba(33,40,46,.22)', borderRadius: '7px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)' }}>
              <div style={{ background: '#21282E', color: '#FBF3DC', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.16em' }}>
                <span>{form.mode === 'add' ? 'New Acquisition' : form.mode === 'edit' ? 'Edit Record' : 'New Shelf'}</span>
                <span style={{ opacity: .7 }}>Steward Library</span>
              </div>
              <div style={{ padding: '22px 26px 8px' }}>

                {form.mode !== 'shelf' && (
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
                        <div style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(33,40,46,.6)', fontWeight: 700, marginBottom: '6px' }}>Shelf</div>
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
                  {isSubmitting ? 'Sending...' : 'Suggest to Librarians'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
