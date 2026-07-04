"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAdminEnvironmentalData, deleteCatalogEntry, approveSuggestion, dismissSuggestion, updateCatalogEntry, insertCatalogEntry } from '@/actions/environmental';
import toast from 'react-hot-toast';

const THEMES = [
  { id: 'bioregion', mark: '❋', short: 'Bioregion', topic: 'Imperial County Bioregion', shelf: 'Ocotillo Field', color: '#417C98' },
  { id: 'indigenous', mark: '◒', short: 'Indigenous', topic: 'Indigenous People', shelf: 'Quechan Rattle', color: '#2E5534' },
  { id: 'history', mark: '▤', short: 'History', topic: 'Imperial County History', shelf: 'Water Rights Ledger', color: '#A27532' },
  { id: 'wider', mark: '⇄', short: 'Wider World', topic: 'The Wider World', shelf: 'Train & Container', color: '#B15A3A' }
];
const TYPES = ['Field Note', 'Field Guide', 'Report', 'Overview', 'History', 'Oral History', 'Map', 'Article', 'Dataset'];

export default function EnvironmentalAdminPage() {
  const [section, setSection] = useState('overview');
  const [activeTheme, setActiveTheme] = useState('bioregion');
  const [srcFilter, setSrcFilter] = useState('all');

  const [catalog, setCatalog] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getAdminEnvironmentalData();
    setCatalog(data.catalog);
    setSuggestions(data.suggestions);
    setSources(data.sources);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPublished = catalog.filter(c => !c.slug?.startsWith('draft___')).length;
  const pendingCount = suggestions.length;
  const sourcesCount = sources.length;

  const THEME = (id: string) => THEMES.find(t => t.id === id) || THEMES[0];

  const goTheme = (id: string) => {
    setSection('published');
    setActiveTheme(id);
  };

  const openEdit = (item: any) => {
    setEditMode('published');
    setEdit({
      id: item.id,
      theme: item.theme_id,
      t: item.title,
      s: item.subtitle || '',
      call: item.call_no || '',
      type: item.type || 'Field Note',
      media: item.media_caption || '',
      gallery_ids: item.gallery_ids || [],
      body: (item.body_text || []).join('\n\n'),
      facts: item.facts || [],
      sources: item.sources || []
    });
  };

  const openSugEdit = (item: any) => {
    setEditMode('suggestion');
    setEdit({
      id: item.id,
      theme: item.theme_id,
      title: item.title,
      what: item.description,
      url: item.url
    });
  };

  const openAdd = (theme: string) => {
    setEditMode('published');
    setEdit({
      id: null,
      theme,
      t: '',
      s: '',
      call: '',
      type: 'Field Note',
      media: '',
      gallery_ids: [],
      body: '',
      facts: [],
      sources: []
    });
  };

  const handleToggleDraft = async (id: string, slug: string) => {
    setUpdatingId(id);
    const isDraft = slug?.startsWith('draft___');
    const newSlug = isDraft ? slug.replace('draft___', '') : `draft___${slug}`;
    const res = await updateCatalogEntry(id, { slug: newSlug });
    if (res.success) {
      toast.success(isDraft ? 'Resource published' : 'Resource moved to draft');
      await fetchData(true);
    } else {
      toast.error('Failed to update status');
    }
    setUpdatingId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    setUpdatingId(id);
    const { success } = await deleteCatalogEntry(id);
    if (!success) toast.error('Failed to delete');
    else { toast.success('Resource deleted'); await fetchData(true); }
    setUpdatingId(null);
  };

  const handleApprove = async (sug: any) => {
    setApprovingId(sug.id);
    const { success, error } = await approveSuggestion(sug);
    if (!success) {
      toast.error(error || 'Failed to approve');
      setApprovingId(null);
      return;
    }
    
    // Optimistic update
    setSuggestions(prev => prev.filter(s => s.id !== sug.id));
    setSources(prev => [{
      id: 'temp-' + Date.now(),
      theme_id: sug.theme_id,
      label: sug.title,
      url: sug.url,
      item_description: sug.description,
      isNew: true
    }, ...prev]);

    toast.success('Approved and added to sources');
    setApprovingId(null);
    fetchData(true);
  };

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    const { success } = await dismissSuggestion(id);
    if (!success) {
      toast.error('Failed to dismiss');
      setDismissingId(null);
    } else { 
      toast.success('Suggestion dismissed'); 
      setSuggestions(prev => prev.filter(s => s.id !== id));
      setDismissingId(null);
      fetchData(true); 
    }
  };

  const addFact = () => setEdit({...edit, facts: [...(edit.facts || []), {k: '', v: ''}]});
  const removeFact = (i: number) => setEdit({...edit, facts: edit.facts.filter((_: any, idx: number) => idx !== i)});
  const updateFact = (i: number, field: 'k'|'v', val: string) => {
    const newFacts = [...edit.facts];
    newFacts[i][field] = val;
    setEdit({...edit, facts: newFacts});
  };

  const addSource = () => setEdit({...edit, sources: [...(edit.sources || []), {label: '', url: ''}]});
  const removeSource = (i: number) => setEdit({...edit, sources: edit.sources.filter((_: any, idx: number) => idx !== i)});
  const updateSource = (i: number, field: 'label'|'url', val: string) => {
    const newSources = [...edit.sources];
    newSources[i][field] = val;
    setEdit({...edit, sources: newSources});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setEdit({
        ...edit,
        gallery_ids: [...(edit.gallery_ids || []), data.publicUrl]
      });
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setEdit({
      ...edit,
      gallery_ids: edit.gallery_ids.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (editMode === 'published') {
      let success = false;
      if (edit.id) {
        const res = await updateCatalogEntry(edit.id, {
          title: edit.t,
          subtitle: edit.s,
          call_no: edit.call,
          type: edit.type,
          media_caption: edit.media,
          gallery_ids: edit.gallery_ids,
          body_text: edit.body.split('\n\n').filter(Boolean),
          facts: edit.facts,
          sources: edit.sources
        });
        success = res.success;
      } else {
        const res = await insertCatalogEntry({
          theme_id: edit.theme,
          title: edit.t,
          subtitle: edit.s,
          type: edit.type,
          call_no: edit.call,
          media_caption: edit.media,
          gallery_ids: edit.gallery_ids,
          body_text: edit.body.split('\n\n').filter(Boolean),
          facts: edit.facts,
          sources: edit.sources,
          slug: edit.t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        });
        success = res.success;
      }
      
      if (!success) toast.error('Failed to save');
      else { toast.success('Note saved'); setEdit(null); setEditMode(null); fetchData(); }
    } else {
      toast.success('Edits saved to suggestion. Please approve to publish.');
      setEdit(null);
      setEditMode(null);
    }
    setIsSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#FBF7E6] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#2E5534] border-t-transparent rounded-full"></div></div>;

  const m = THEME(activeTheme);
  const activeCatalog = catalog.filter(c => c.theme_id === activeTheme);
  const editHeadColor = editMode === 'suggestion' ? THEME(edit.theme || 'bioregion').color : m.color;

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7E6', fontFamily: "'Exo', sans-serif", color: '#21282E' }}>
      
      <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', height: '74px', padding: '0 26px', background: '#fff', borderBottom: '1px solid #e9e6dd', boxShadow: '0 1px 0 rgba(0,0,0,.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <a href="/hub" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#3C2A18', color: '#f3e2b6', borderRadius: '11px', textDecoration: 'none', font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.13em', textTransform: 'uppercase' }}>‹ Return to Hub</a>
          <div style={{ width: '1px', height: '28px', background: '#e9e6dd' }}></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <h1 style={{ margin: 0, font: "900 19px/1 'Exo', sans-serif", letterSpacing: '-.02em', textTransform: 'uppercase', color: '#21282E' }}>Environmental Literacy</h1>
              <span style={{ padding: '4px 9px', borderRadius: '999px', background: '#eef2ea', color: '#2E5534', font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase' }}>Librarian Console</span>
            </div>
            <p style={{ margin: '4px 0 0', font: "700 9.5px/1 'Courier New',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6d70' }}>Steward Library · catalogues the field desk</p>
          </div>
        </div>
        <a href="/hub/environmental-literacy" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 15px', background: '#fff', border: '1px solid #e9e6dd', borderRadius: '11px', color: '#21282E', textDecoration: 'none', font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase' }}>Return to Field Desk ◱</a>
      </header>

      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 74px)' }}>
        <aside style={{ flex: '0 0 246px', background: '#fff', borderRight: '1px solid #e9e6dd', padding: '22px 16px 24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.18em', textTransform: 'uppercase', color: '#6b6d70', padding: '0 10px 12px' }}>Console</div>
          
          {[
            { key: 'overview', label: 'Overview', mark: '◉' },
            { key: 'published', label: 'Published resources', mark: '▤', badge: totalPublished },
            { key: 'suggestions', label: 'Suggestions', mark: '✎', badge: pendingCount, alert: true },
            { key: 'sources', label: 'Sources feed', mark: '↗', badge: sourcesCount }
          ].map(n => {
            const on = section === n.key;
            return (
              <button key={n.key} type="button" onClick={() => setSection(n.key)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', width: '100%', padding: '11px 10px', borderRadius: '12px', background: on ? '#21282E' : 'transparent', color: on ? '#fff' : '#21282E' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '8px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: on ? 'rgba(255,255,255,.16)' : '#f7f5ef', color: on ? '#fff' : '#6b6d70' }}>{n.mark}</span>
                <span style={{ flex: 1, textAlign: 'left', font: "800 12.5px/1 'Exo', sans-serif" }}>{n.label}</span>
                {n.badge != null && (
                  <span style={{ minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "800 10px/1 'Exo', sans-serif", background: (n.alert && n.badge > 0) ? '#B15A3A' : (on ? 'rgba(255,255,255,.18)' : '#f7f5ef'), color: (n.alert && n.badge > 0) ? '#fff' : (on ? '#fff' : '#6b6d70') }}>{n.badge}</span>
                )}
              </button>
            )
          })}
          
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '13px', borderRadius: '14px', background: 'linear-gradient(180deg,#f6e6b6,#eccf89)', border: '1px solid #cdaa5f' }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#3C2A18', color: '#E7C77E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flex: '0 0 auto' }}>▤</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 8px/1.2 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a5e28' }}>Auto-synced</div>
              <div style={{ font: "800 11px/1.2 'Exo', sans-serif", color: '#3C2A18', marginTop: '2px' }}>{totalPublished} records live</div>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: '30px 34px 80px', maxWidth: '1060px', overflowY: 'auto' }}>
          
          {section === 'overview' && (
            <div>
              <h2 style={{ margin: 0, font: "900 24px/1 'Exo', sans-serif", letterSpacing: '-.01em', color: '#21282E' }}>Overview</h2>
              <p style={{ margin: '8px 0 24px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Everything catalogued for the Environmental Literacy field desk, at a glance.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
                {THEMES.map(t => {
                  const count = catalog.filter(c => c.theme_id === t.id).length;
                  return (
                    <button key={t.id} type="button" onClick={() => goTheme(t.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'block', borderRadius: '18px', padding: '18px 18px 16px', background: t.color, boxShadow: `0 12px 28px -18px ${t.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', background: 'rgba(255,255,255,.2)', color: '#fff' }}>{t.mark}</span>
                        <span style={{ font: "700 8px/1.2 'Courier New',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', opacity: .82 }}>{t.shelf}</span>
                      </div>
                      <div style={{ font: "900 34px/1 'Exo', sans-serif", color: '#fff', marginTop: '16px' }}>{count}</div>
                      <div style={{ font: "800 12.5px/1.2 'Exo', sans-serif", color: '#fff', marginTop: '4px' }}>{t.short}</div>
                      <div style={{ font: "700 8.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', opacity: .78, marginTop: '6px' }}>Published resources ›</div>
                    </button>
                  )
                })}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #e9e6dd', borderRadius: '16px', padding: '18px 20px' }}>
                  <div style={{ font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6b6d70' }}>Total published</div>
                  <div style={{ font: "900 30px/1 'Exo', sans-serif", marginTop: '9px', color: '#21282E' }}>{totalPublished}</div>
                </div>
                <button type="button" onClick={() => setSection('suggestions')} style={{ textAlign: 'left', cursor: 'pointer', background: '#fff', border: '1px solid #e9e6dd', borderRadius: '16px', padding: '18px 20px' }}>
                  <div style={{ font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6b6d70' }}>Awaiting review</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '9px' }}><span style={{ font: "900 30px/1 'Exo', sans-serif", color: '#B15A3A' }}>{pendingCount}</span><span style={{ font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#B15A3A' }}>Review ›</span></div>
                </button>
                <button type="button" onClick={() => setSection('sources')} style={{ textAlign: 'left', cursor: 'pointer', background: '#fff', border: '1px solid #e9e6dd', borderRadius: '16px', padding: '18px 20px' }}>
                  <div style={{ font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6b6d70' }}>Catalogued sources</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '9px' }}><span style={{ font: "900 30px/1 'Exo', sans-serif", color: '#417C98' }}>{sourcesCount}</span><span style={{ font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#417C98' }}>Feed ›</span></div>
                </button>
              </div>
            </div>
          )}

          {section === 'published' && (
            <div>
              <h2 style={{ margin: 0, font: "900 24px/1 'Exo', sans-serif", letterSpacing: '-.01em', color: '#21282E' }}>Catalog resources</h2>
              <p style={{ margin: '8px 0 20px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Edit, draft, publish or permanently delete any field note.</p>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {THEMES.map(t => {
                  const on = t.id === activeTheme;
                  const count = catalog.filter(c => c.theme_id === t.id).length;
                  return (
                    <button key={t.id} type="button" onClick={() => setActiveTheme(t.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '11px', font: "800 12px/1 'Exo', sans-serif", background: on ? t.color : '#fff', color: on ? '#fff' : '#21282E', border: on ? 'none' : '1px solid #e9e6dd' }}>
                      <span style={{ fontSize: '13px' }}>{t.mark}</span>{t.short}
                      <span style={{ marginLeft: '2px', minWidth: '19px', height: '19px', padding: '0 5px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: "800 9.5px/1 'Exo', sans-serif", background: on ? 'rgba(255,255,255,.22)' : '#f7f5ef', color: on ? '#fff' : '#6b6d70' }}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '15px 18px', borderRadius: '15px 15px 0 0', background: `linear-gradient(120deg,${m.color},${m.color}d0)`, color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{m.mark}</span>
                  <div>
                    <div style={{ font: "800 14px/1.1 'Exo', sans-serif" }}>{m.topic}</div>
                    <div style={{ font: "700 8.5px/1 'Courier New',monospace", letterSpacing: '.12em', textTransform: 'uppercase', opacity: .82, marginTop: '3px' }}>{m.shelf} · {activeCatalog.length} published</div>
                  </div>
                </div>
                <button type="button" onClick={() => openAdd(activeTheme)} style={{ cursor: 'pointer', padding: '9px 14px', borderRadius: '10px', border: 0, background: 'rgba(255,255,255,.94)', color: m.color, font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>+ Add resource</button>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e9e6dd', borderTop: 0, borderRadius: '0 0 15px 15px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 92px 116px 200px', gap: '14px', alignItems: 'center', padding: '11px 18px', background: '#f7f5ef', borderBottom: '1px solid #e9e6dd' }}>
                  <span style={{ font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b6d70' }}>#</span>
                  <span style={{ font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b6d70' }}>Resource</span>
                  <span style={{ font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b6d70' }}>Call no.</span>
                  <span style={{ font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b6d70' }}>Type</span>
                  <span></span>
                </div>
                {activeCatalog.map((r, i) => {
                  const isUpdating = updatingId === r.id;
                  return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 92px 116px 200px', gap: '14px', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e9e6dd', background: isUpdating ? 'repeating-linear-gradient(45deg, #f7f5ef, #f7f5ef 10px, #fff 10px, #fff 20px)' : 'transparent', pointerEvents: isUpdating ? 'none' : 'auto', opacity: isUpdating ? 0.7 : 1 }}>
                    <span style={{ font: "700 12px/1 'Courier New',monospace", color: m.color }}>{String(i+1).padStart(2,'0')}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ font: "800 14px/1.2 'Exo', sans-serif", color: '#21282E' }}>{r.title}</div>
                        {r.slug?.startsWith('draft___') && <span style={{ padding: '3px 6px', borderRadius: '4px', background: '#e9e6dd', color: '#6b6d70', font: "800 8px/1 'Exo', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>DRAFT</span>}
                      </div>
                      <div style={{ font: "500 12px/1.3 'Exo', sans-serif", color: '#6b6d70', marginTop: '2px' }}>{r.subtitle}</div>
                    </div>
                    <span style={{ font: "700 12px/1 'Courier New',monospace", color: '#A27532' }}>{r.call_no || ''}</span>
                    <span style={{ justifySelf: 'start', padding: '5px 10px', borderRadius: '999px', background: '#f7f5ef', border: '1px solid #e9e6dd', font: "700 9.5px/1 'Exo', sans-serif", letterSpacing: '.04em', color: '#6b6d70' }}>{r.type || 'Field Note'}</span>
                    <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => openEdit(r)} style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '9px', border: '1px solid #e9e6dd', background: '#fff', color: '#21282E', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>Edit</button>
                      <button type="button" onClick={() => handleToggleDraft(r.id, r.slug)} style={{ cursor: isUpdating ? 'wait' : 'pointer', padding: '8px 11px', borderRadius: '9px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {isUpdating ? '...' : (r.slug?.startsWith('draft___') ? 'Publish' : 'Unpublish')}
                      </button>
                      <button type="button" onClick={() => handleDelete(r.id)} style={{ cursor: isUpdating ? 'wait' : 'pointer', padding: '8px 11px', borderRadius: '9px', border: 'none', background: '#b4675b', color: '#fff', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {isUpdating ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {section === 'suggestions' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <h2 style={{ margin: 0, font: "900 24px/1 'Exo', sans-serif", letterSpacing: '-.01em', color: '#21282E' }}>Suggestions review queue</h2>
                <span style={{ font: "800 11px/1 'Exo', sans-serif", letterSpacing: '.06em', color: '#B15A3A' }}>{pendingCount} awaiting</span>
              </div>
              <p style={{ margin: '8px 0 22px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Reader-submitted sources. Edit for accuracy, then approve to catalogue the link in the Library — or dismiss it.</p>
              
              {pendingCount > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {suggestions.map(s => {
                    const tm = THEME(s.theme_id);
                    return (
                      <div key={s.id} style={{ background: '#fff', border: '1px solid #e9e6dd', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 8px 24px -18px rgba(33,40,46,.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '11px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase', background: tm.color+'18', color: tm.color }}><span style={{ fontSize: '12px' }}>{tm.mark}</span>{tm.short}</span>
                          <span style={{ font: "700 9px/1 'Courier New',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b6d70' }}>from {s.submitter_name || 'anonymous'}</span>
                        </div>
                        <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '18px', lineHeight: 1.15, color: '#21282E' }}>{s.title}</div>
                        <p style={{ margin: '7px 0 13px', font: "500 13.5px/1.55 'Exo', sans-serif", color: '#3a342a' }}>{s.description}</p>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', maxWidth: '100%', padding: '9px 13px', borderRadius: '10px', background: '#FEFAE0', border: '1px solid #e9e6dd', textDecoration: 'none', color: '#417C98', font: "600 12px/1 'Exo', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↗ {s.url}</a>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '15px', borderTop: '1px solid #e9e6dd' }}>
                          <button type="button" onClick={() => handleApprove(s)} disabled={approvingId === s.id} style={{ cursor: approvingId === s.id ? 'wait' : 'pointer', padding: '10px 16px', borderRadius: '10px', border: 0, background: '#2E5534', color: '#fff', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', boxShadow: '0 7px 16px -8px rgba(46,85,52,.7)', opacity: approvingId === s.id ? 0.6 : 1 }}>
                            {approvingId === s.id ? 'Approving...' : '✓ Approve & catalogue'}
                          </button>
                          <button type="button" onClick={() => openSugEdit(s)} style={{ cursor: 'pointer', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e9e6dd', background: '#fff', color: '#21282E', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>Edit</button>
                          <div style={{ flex: 1 }}></div>
                          <button type="button" onClick={() => handleDismiss(s.id)} disabled={dismissingId === s.id} style={{ cursor: dismissingId === s.id ? 'wait' : 'pointer', padding: '10px 15px', borderRadius: '10px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', opacity: dismissingId === s.id ? 0.6 : 1 }}>
                            {dismissingId === s.id ? 'Dismissing...' : 'Dismiss'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px dashed #e9e6dd', borderRadius: '16px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#eef2ea', color: '#2E5534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 14px' }}>✓</div>
                  <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '18px', color: '#21282E' }}>Queue clear</div>
                  <div style={{ font: "600 12.5px/1.5 'Exo', sans-serif", color: '#6b6d70', marginTop: '6px' }}>Every suggestion has been reviewed.</div>
                </div>
              )}
            </div>
          )}

          {section === 'sources' && (
            <div>
              <h2 style={{ margin: 0, font: "900 24px/1 'Exo', sans-serif", letterSpacing: '-.01em', color: '#21282E' }}>Sources feed → Steward Library</h2>
              <p style={{ margin: '8px 0 20px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Every approved source link, catalogued and searchable in the Library. Newest first.</p>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {[{ id: 'all', label: 'All themes', mark: '≡' }, ...THEMES].map(t => {
                  const on = srcFilter === t.id;
                  const count = t.id === 'all' ? sourcesCount : sources.filter(s => s.theme_id === t.id).length;
                  return (
                    <button key={t.id} type="button" onClick={() => setSrcFilter(t.id)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '11px', font: "800 12px/1 'Exo', sans-serif", background: on ? (t as any).color || '#6b6d70' : '#fff', color: on ? '#fff' : '#21282E', border: on ? 'none' : '1px solid #e9e6dd' }}>
                      <span style={{ fontSize: '13px' }}>{t.mark}</span>{(t as any).label || (t as any).short}
                      <span style={{ marginLeft: '2px', minWidth: '19px', height: '19px', padding: '0 5px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: "800 9.5px/1 'Exo', sans-serif", background: on ? 'rgba(255,255,255,.22)' : '#f7f5ef', color: on ? '#fff' : '#6b6d70' }}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e9e6dd', borderRadius: '16px', overflow: 'hidden' }}>
                {sources.filter(s => srcFilter === 'all' || s.theme_id === srcFilter).map(s => {
                  const tm = THEME(s.theme_id);
                  return (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '14px', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #e9e6dd', textDecoration: 'none', color: '#21282E' }}>
                      <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: tm.color }}></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <span style={{ font: "700 14px/1.2 'Exo', sans-serif", color: '#21282E' }}>{s.label}</span>
                        </div>
                        <div style={{ font: "600 11.5px/1.3 'Exo', sans-serif", color: '#6b6d70', marginTop: '3px' }}>{s.item_description || 'Catalogued source'} · <span style={{ color: '#417C98' }}>{s.url}</span></div>
                      </div>
                      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                        <div style={{ font: "800 8.5px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b6d70' }}>{tm.short}</div>
                        <div style={{ font: "700 10px/1 'Courier New',monospace", color: '#6b6d70', opacity: .75, marginTop: '5px' }}>{new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                    </a>
                  )
                })}
                {sources.filter(s => srcFilter === 'all' || s.theme_id === srcFilter).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '52px 20px', color: '#6b6d70' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: '#f7f5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 12px' }}>↗</div>
                    <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '16px', color: '#21282E' }}>No sources under this theme yet</div>
                    <div style={{ font: "600 12px/1.5 'Exo', sans-serif", color: '#6b6d70', marginTop: '5px' }}>Approve a suggestion for it, or pick another theme above.</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {editMode && edit && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(30,22,10,.45)', backdropFilter: 'blur(3px)' }} onClick={() => setEditMode(null)}></div>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 55, width: 'min(540px,94vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: '18px', boxShadow: '0 40px 90px -30px rgba(30,22,10,.6)', border: '1px solid #e9e6dd' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 20px', background: `linear-gradient(120deg,${editHeadColor},${editHeadColor}d0)`, color: '#fff' }}>
              <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: '17px' }}>{editMode === 'suggestion' ? 'Edit suggestion' : (edit.id ? 'Edit resource' : 'Add resource')}</div>
              <button type="button" onClick={() => setEditMode(null)} style={{ cursor: 'pointer', width: '30px', height: '30px', borderRadius: '9px', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: '15px' }}>✕</button>
            </div>
            
            <div style={{ padding: '22px' }}>
              {editMode === 'published' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Title</label>
                    <input value={edit.t} onChange={e => setEdit({...edit, t: e.target.value})} placeholder="Resource title" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Subtitle</label>
                    <input value={edit.s} onChange={e => setEdit({...edit, s: e.target.value})} placeholder="A short descriptive line" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Call no.</label>
                      <input value={edit.call} onChange={e => setEdit({...edit, call: e.target.value})} placeholder="553.493" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Type</label>
                      <select value={edit.type} onChange={e => setEdit({...edit, type: e.target.value})} style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }}>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: '#e9e6dd', margin: '22px 0 20px' }}></div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Field notes — the written text</label>
                    <textarea value={edit.body} onChange={e => setEdit({...edit, body: e.target.value})} placeholder="Write the field notes here. Separate paragraphs with a blank line." style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0, minHeight: '150px', resize: 'vertical' }}></textarea>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Image / media caption</label>
                    <input value={edit.media} onChange={e => setEdit({...edit, media: e.target.value})} placeholder="e.g. Aerial photograph of the shoreline" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Main photo</label>
                    {edit.gallery_ids && edit.gallery_ids.length > 0 ? (
                      <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e9e6dd' }}>
                        <img src={edit.gallery_ids[0]} alt="Main photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "800 12px/1 'Exo', sans-serif", color: '#2E5534' }}>Uploading...</div>}
                        <button type="button" onClick={() => removeImage(0)} title="Remove photo" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'pointer', width: '26px', height: '26px', borderRadius: '999px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "700 14px/1 'Exo'", display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>×</button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '14px', background: '#f7f5ef', border: '2px dashed #e9e6dd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6d70', font: "600 13px/1 'Exo', sans-serif" }}>
                        {isUploading ? 'Uploading...' : 'Drop the main field-note photo here or click to browse'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: isUploading ? 'wait' : 'pointer' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E' }}>Additional photos</label>
                    <label style={{ cursor: isUploading ? 'wait' : 'pointer', padding: '6px 11px', borderRadius: '9px', border: '1px solid #e9e6dd', background: isUploading ? '#f7f5ef' : '#fff', color: '#2E5534', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase', opacity: isUploading ? 0.6 : 1 }}>
                      {isUploading ? 'Uploading...' : '+ Add photo'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: 'none' }} />
                    </label>
                  </div>
                  
                  {edit.gallery_ids && edit.gallery_ids.length > 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                      {edit.gallery_ids.slice(1).map((url: string, index: number) => (
                        <div key={index} style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '11px', overflow: 'hidden', border: '1px solid #e9e6dd' }}>
                          <img src={url} alt={`Additional photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeImage(index + 1)} title="Remove photo" style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer', width: '22px', height: '22px', borderRadius: '999px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "700 13px/1 'Exo'", display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E' }}>Field facts</label>
                    <button type="button" onClick={addFact} style={{ cursor: 'pointer', padding: '6px 11px', borderRadius: '9px', border: '1px solid #e9e6dd', background: '#fff', color: '#2E5534', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>+ Add fact</button>
                  </div>
                  {edit.facts?.map((f: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input value={f.k} onChange={e => updateFact(i, 'k', e.target.value)} placeholder="Label" style={{ width: '140px', padding: '9px 11px', border: '1px solid #e9e6dd', borderRadius: '9px', background: '#fff', font: "700 11.5px/1 'Courier New',monospace", color: '#21282E', outline: 0 }} />
                      <input value={f.v} onChange={e => updateFact(i, 'v', e.target.value)} placeholder="Value" style={{ flex: 1, padding: '9px 11px', border: '1px solid #e9e6dd', borderRadius: '9px', background: '#fff', font: "600 13px/1 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                      <button type="button" onClick={() => removeFact(i)} style={{ cursor: 'pointer', width: '32px', height: '36px', borderRadius: '9px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "700 16px/1 'Exo', sans-serif" }}>×</button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px', marginTop: '20px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E' }}>Sources</label>
                    <button type="button" onClick={addSource} style={{ cursor: 'pointer', padding: '6px 11px', borderRadius: '9px', border: '1px solid #e9e6dd', background: '#fff', color: '#2E5534', font: "800 9px/1 'Exo', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase' }}>+ Add source</button>
                  </div>
                  {edit.sources?.map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input value={s.label} onChange={e => updateSource(i, 'label', e.target.value)} placeholder="Source name" style={{ width: '180px', padding: '9px 11px', border: '1px solid #e9e6dd', borderRadius: '9px', background: '#fff', font: "600 13px/1 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                      <input value={s.url} onChange={e => updateSource(i, 'url', e.target.value)} placeholder="https://" style={{ flex: 1, padding: '9px 11px', border: '1px solid #e9e6dd', borderRadius: '9px', background: '#fff', font: "600 13px/1 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                      <button type="button" onClick={() => removeSource(i)} style={{ cursor: 'pointer', width: '32px', height: '36px', borderRadius: '9px', border: '1px solid #eadfd7', background: '#fff', color: '#b4675b', font: "700 16px/1 'Exo', sans-serif" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              
              {editMode === 'suggestion' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Theme</label>
                    <select value={edit.theme} onChange={e => setEdit({...edit, theme: e.target.value})} style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }}>
                      {THEMES.map(t => <option key={t.id} value={t.id}>{t.topic}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Title</label>
                    <input value={edit.title} onChange={e => setEdit({...edit, title: e.target.value})} placeholder="Resource title" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Why it matters</label>
                    <textarea value={edit.what} onChange={e => setEdit({...edit, what: e.target.value})} placeholder="A sentence or two" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0, minHeight: '82px', resize: 'vertical' }}></textarea>
                  </div>
                  <div>
                    <label style={{ display: 'block', font: "800 9.5px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#21282E', marginBottom: '8px' }}>Link</label>
                    <input value={edit.url} onChange={e => setEdit({...edit, url: e.target.value})} placeholder="https://…" style={{ width: '100%', padding: '11px 13px', border: '1px solid #e9e6dd', borderRadius: '11px', background: '#f7f5ef', font: "600 14px/1.3 'Exo', sans-serif", color: '#21282E', outline: 0 }} />
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditMode(null)} disabled={isSaving} style={{ cursor: isSaving ? 'not-allowed' : 'pointer', padding: '12px 17px', borderRadius: '11px', border: '1px solid #e9e6dd', background: '#fff', color: '#6b6d70', font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', opacity: isSaving ? 0.5 : 1 }}>Cancel</button>
                <button type="button" onClick={handleSave} disabled={isSaving} style={{ cursor: isSaving ? 'wait' : 'pointer', padding: '12px 20px', borderRadius: '11px', border: 0, background: '#2E5534', color: '#fff', font: "800 10px/1 'Exo', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', boxShadow: isSaving ? 'none' : '0 8px 18px -8px rgba(46,85,52,.7)', opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(33,40,46,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 10px', font: "900 20px/1 'Exo', sans-serif", color: '#21282E' }}>Permanently Delete?</h3>
            <p style={{ margin: '0 0 24px', font: "500 14px/1.5 'Exo', sans-serif", color: '#6b6d70' }}>Are you sure you want to permanently delete this resource? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setDeleteConfirmId(null)} style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e9e6dd', background: '#fff', color: '#6b6d70', font: "800 11px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={{ cursor: 'pointer', padding: '12px 18px', borderRadius: '10px', border: 'none', background: '#b4675b', color: '#fff', font: "800 11px/1 'Exo', sans-serif", letterSpacing: '.1em', textTransform: 'uppercase' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
