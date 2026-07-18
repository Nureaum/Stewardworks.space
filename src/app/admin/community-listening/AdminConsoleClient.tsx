'use client';

import React, { useState, useEffect } from 'react';
import { saveSessionAction, deleteSessionAction, updateSubmissionAction } from './actions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminConsoleClient({ sessions, submissions = [], areas = [] }: { sessions: any[], submissions?: any[], areas?: any[] }) {
  const router = useRouter();
  const [adminTab, setAdminTab] = useState<'sessions' | 'inbox'>('sessions');
  const [editDraft, setEditDraft] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [subs, setSubs] = useState(submissions);

  useEffect(() => {
    setSubs(submissions);
  }, [submissions]);

  const editSession = (s: any) => {
    setEditDraft({
      ...s,
      orientation: s.orientation || { overall: '', supportive: 0, systems: 0, sovereignty: 0, note: '' },
      themes: s.themes || [],
      quotes: s.quotes || [],
      suggestions: s.suggestions || [],
      photos: s.photos || [],
      cover_path: s.cover_path || ''
    });
  };

  const startNew = () => {
    editSession({
      location: '', venue: '', session_date: '', participants: 0, facilitators: '', population: '',
      tagline: '', narrative: '', accent: '#c98a3d'
    });
  };

  const cancelEdit = () => setEditDraft(null);
  
  const saveSession = async () => {
    if (!editDraft) return;
    setIsSaving(true);
    try {
      await saveSessionAction(editDraft);
      toast.success('Session saved successfully!');
      setEditDraft(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save session: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSessionAction(id);
      } catch (err) {
        console.error(err);
        alert('Failed to delete.');
      }
    }
  };

  const handleUpdateSub = async (id: string, updates: any) => {
    setSubs(subs.map((s: any) => s.id === id ? { ...s, ...updates } : s));
    try {
      await updateSubmissionAction(id, updates);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const newSubCount = subs.filter((s: any) => s.status === 'new').length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        callback(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div data-screen-label="admin" style={{ minHeight: '100vh', padding: '34px 24px 110px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.2em', color: '#a07b4d', textTransform: 'uppercase' }}>Admin console</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#4a3728', letterSpacing: '-.01em' }}>Community Listening</div>
          </div>
          <div onClick={() => router.push('/hub/community-listening')} style={{ cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#a07b4d', border: '1px solid #d9c3a0', padding: '8px 13px', borderRadius: 9 }}>&larr; Back to public gallery</div>
        </div>

        {/* tabs */}
        <div style={{ display: 'inline-flex', gap: 4, background: '#f2e4cb', padding: 5, borderRadius: 12, margin: '20px 0 24px' }}>
          <div onClick={() => { setAdminTab('sessions'); setEditDraft(null); }} style={{ cursor: 'pointer', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, background: adminTab === 'sessions' ? '#4a3728' : 'transparent', color: adminTab === 'sessions' ? '#fbf5ea' : '#8a6f4d' }}>Sessions</div>
          <div onClick={() => setAdminTab('inbox')} style={{ cursor: 'pointer', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: adminTab === 'inbox' ? '#4a3728' : 'transparent', color: adminTab === 'inbox' ? '#fbf5ea' : '#8a6f4d' }}>Suggestion inbox <span style={{ background: '#d97a97', color: '#fff', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)' }}>{newSubCount}</span></div>
        </div>

        {/* ===== SESSIONS TAB ===== */}
        {adminTab === 'sessions' && (
          <div>
            {!editDraft ? (
              <div>
                <div onClick={startNew} style={{ cursor: 'pointer', display: 'inline-block', background: '#c98a3d', color: '#fff', padding: '11px 20px', borderRadius: 11, fontWeight: 600, fontSize: 14, marginBottom: 18, boxShadow: '0 6px 16px rgba(201,138,61,.3)' }}>+ New listening session</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sessions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fbf5ea', borderRadius: 14, padding: '18px 20px', boxShadow: '0 8px 18px rgba(60,40,20,.1)' }}>
                      <span style={{ width: 12, height: 44, borderRadius: 6, background: s.accent || '#c98a3d', flexShrink: 0 }}></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#4a3728' }}>{s.location}</div>
                        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#8a6f4d', marginTop: 2 }}>
                          {s.session_date ? new Date(s.session_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} · {s.venue || 'No venue'} · {s.participants || 0} people · {s.population || 'No population'}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#a07b4d', textAlign: 'right', marginRight: 6 }}>
                        {(s.themes || []).length} themes<br/>{s.quote_count || 0} quotes · {s.suggestion_count || 0} suggestions
                      </div>
                      <div onClick={() => editSession(s)} style={{ cursor: 'pointer', background: '#4a3728', color: '#fbf5ea', padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600 }}>Edit</div>
                      <div onClick={() => handleDelete(s.id)} style={{ cursor: 'pointer', border: '1px solid #e0b6b6', color: '#c05a5a', padding: '9px 13px', borderRadius: 9, fontSize: 13, fontWeight: 600 }}>Delete</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fbf5ea', borderRadius: 18, padding: '28px 30px', boxShadow: '0 14px 34px rgba(60,40,20,.14)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4a3728' }}>Edit session</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div onClick={cancelEdit} style={{ cursor: 'pointer', border: '1px solid #d9c3a0', color: '#6b573f', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600 }}>Cancel</div>
                    <div onClick={saveSession} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer', background: '#3f9e8f', color: '#fff', padding: '9px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, boxShadow: '0 6px 14px rgba(63,158,143,.3)' }}>{isSaving ? 'Saving...' : 'Save session'}</div>
                  </div>
                </div>

                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Location name</label><input value={editDraft.location || ''} onChange={(e) => setEditDraft({...editDraft, location: e.target.value})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Venue</label><input value={editDraft.venue || ''} onChange={(e) => setEditDraft({...editDraft, venue: e.target.value})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Date</label><input value={editDraft.session_date || ''} onChange={(e) => setEditDraft({...editDraft, session_date: e.target.value})} placeholder="2026-03-07" style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}># Participants</label><input value={editDraft.participants || 0} onChange={(e) => setEditDraft({...editDraft, participants: Number(e.target.value)})} type="number" style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Facilitators</label><input value={editDraft.facilitators || ''} onChange={(e) => setEditDraft({...editDraft, facilitators: e.target.value})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Population descriptor</label><input value={editDraft.population || ''} onChange={(e) => setEditDraft({...editDraft, population: e.target.value})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                </div>

                <div style={{ marginTop: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Tagline</label><input value={editDraft.tagline || ''} onChange={(e) => setEditDraft({...editDraft, tagline: e.target.value})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>

                <div style={{ marginTop: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Frame accent color</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {['#c98a3d', '#3f9e8f', '#6f97b0', '#5aa06a', '#d97a97', '#9a86c4', '#b06a4a'].map((c, i) => (
                      <div key={i} onClick={() => setEditDraft({...editDraft, accent: c})} style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', background: c, border: editDraft.accent === c ? '3px solid #4a3728' : '3px solid transparent' }}></div>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 12 }}>Photos</div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Front-facing frame photo</label>
                  <p style={{ fontSize: 12, color: '#8a6f4d', margin: '4px 0 10px' }}>Displayed inside the ornate frame on the listening wall.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', width: 150, height: 120, flex: 'none', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2d2b4', background: 'repeating-linear-gradient(45deg,#eaddc4,#eaddc4 12px,#e0d0b2 12px,#e0d0b2 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.12em', color: '#9a7f57', textTransform: 'uppercase' }}>no photo</span>
                      {editDraft.cover_path && editDraft.cover_path !== 'mock-path' && <img src={editDraft.cover_path} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 10 }} alt="" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ cursor: 'pointer', background: '#3f9e8f', color: '#fff', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>Upload photo<input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, base64 => setEditDraft({...editDraft, cover_path: base64}))} style={{ display: 'none' }} /></label>
                      {editDraft.cover_path && <div onClick={() => setEditDraft({...editDraft, cover_path: ''})} style={{ cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#c05a5a' }}>Remove photo</div>}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Editorial / panel photos</label>
                    <p style={{ fontSize: 12, color: '#8a6f4d', margin: '4px 0 12px' }}>Appear in the session dashboard's "From the room" gallery.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(editDraft.photos || []).map((p: any, i: number) => {
                        return (
                        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f4e8d3', borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ position: 'relative', width: 130, height: 100, flex: 'none', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2d2b4', background: 'repeating-linear-gradient(45deg,#eaddc4,#eaddc4 12px,#e0d0b2 12px,#e0d0b2 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.12em', color: '#9a7f57', textTransform: 'uppercase' }}>photo</span>
                            {p.storage_path && p.storage_path !== 'mock-path' && <img src={p.storage_path} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 10 }} alt="" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <input value={p.caption || p.cap || ''} onChange={(e) => { const newPhotos = [...editDraft.photos]; newPhotos[i].caption = e.target.value; setEditDraft({...editDraft, photos: newPhotos}); }} placeholder="Caption" style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 9, padding: '9px 11px', fontSize: 13.5, color: '#4a3728', background: '#fffdf8' }} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 9, alignItems: 'center' }}>
                              <label style={{ cursor: 'pointer', background: '#e9d9bd', color: '#6b573f', padding: '8px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 600 }}>Upload<input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, base64 => { const newPhotos = [...editDraft.photos]; newPhotos[i].storage_path = base64; setEditDraft({...editDraft, photos: newPhotos}); })} style={{ display: 'none' }} /></label>
                              <div onClick={() => { const newPhotos = editDraft.photos.filter((_: any, idx: number) => idx !== i); setEditDraft({...editDraft, photos: newPhotos}); }} style={{ cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0b6b6', color: '#c05a5a', borderRadius: 9, fontWeight: 700 }}>×</div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                    <div onClick={() => setEditDraft({...editDraft, photos: [...(editDraft.photos || []), { storage_path: '', caption: '' }]})} style={{ cursor: 'pointer', marginTop: 10, fontSize: 13, fontWeight: 600, color: '#c98a3d' }}>+ Add photo</div>
                  </div>
                </div>

                {/* Narrative */}
                <div style={{ marginTop: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Narrative</label><textarea value={editDraft.narrative || ''} onChange={(e) => setEditDraft({...editDraft, narrative: e.target.value})} style={{ width: '100%', minHeight: 110, marginTop: 5, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font-newsreader)', fontSize: 15, lineHeight: 1.55, color: '#4a3728', background: '#fffdf8' }}></textarea></div>

                {/* Orientation */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 12 }}>Orientation toward AI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Overall orientation</label><input value={editDraft.orientation.overall || ''} onChange={(e) => setEditDraft({...editDraft, orientation: {...editDraft.orientation, overall: e.target.value}})} style={{ width: '100%', marginTop: 5, border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} /></div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Sees AI as supportive — {editDraft.orientation.supportive || 0}%</label>
                      <input type="range" min="0" max="100" value={editDraft.orientation.supportive || 0} onChange={(e) => setEditDraft({...editDraft, orientation: {...editDraft.orientation, supportive: Number(e.target.value)}})} style={{ width: '100%', marginTop: 10, accentColor: '#c98a3d' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Community / systems thinking — {editDraft.orientation.systems || 0}%</label>
                      <input type="range" min="0" max="100" value={editDraft.orientation.systems || 0} onChange={(e) => setEditDraft({...editDraft, orientation: {...editDraft.orientation, systems: Number(e.target.value)}})} style={{ width: '100%', marginTop: 6, accentColor: '#c98a3d' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Readiness for local control — {editDraft.orientation.sovereignty || 0}%</label>
                      <input type="range" min="0" max="100" value={editDraft.orientation.sovereignty || 0} onChange={(e) => setEditDraft({...editDraft, orientation: {...editDraft.orientation, sovereignty: Number(e.target.value)}})} style={{ width: '100%', marginTop: 6, accentColor: '#c98a3d' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f' }}>Facilitator note</label><textarea value={editDraft.orientation.note || ''} onChange={(e) => setEditDraft({...editDraft, orientation: {...editDraft.orientation, note: e.target.value}})} style={{ width: '100%', minHeight: 64, marginTop: 5, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }}></textarea></div>
                </div>

                {/* Themes */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 12 }}>Top themes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(editDraft.themes || []).map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input value={typeof t === 'string' ? t : (t.val || '')} onChange={(e) => { const newThemes = [...editDraft.themes]; newThemes[i] = e.target.value; setEditDraft({...editDraft, themes: newThemes}); }} style={{ flex: 1, border: '1px solid #e2d2b4', borderRadius: 9, padding: '9px 12px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} />
                        <div onClick={() => { const newThemes = editDraft.themes.filter((_: any, idx: number) => idx !== i); setEditDraft({...editDraft, themes: newThemes}); }} style={{ cursor: 'pointer', width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0b6b6', color: '#c05a5a', borderRadius: 9, fontWeight: 700 }}>×</div>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setEditDraft({...editDraft, themes: [...(editDraft.themes || []), '']})} style={{ cursor: 'pointer', marginTop: 10, fontSize: 13, fontWeight: 600, color: '#c98a3d' }}>+ Add theme</div>
                </div>

                {/* Quotes */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 12 }}>Direct quotes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(editDraft.quotes || []).map((q: any, i: number) => (
                      <div key={i} style={{ background: '#f4e8d3', borderRadius: 12, padding: '14px 16px' }}>
                        <textarea value={q.quote || q.text || ''} onChange={(e) => { const newQuotes = [...editDraft.quotes]; newQuotes[i].quote = e.target.value; setEditDraft({...editDraft, quotes: newQuotes}); }} placeholder="Quote text" style={{ width: '100%', minHeight: 56, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 9, padding: '9px 11px', fontFamily: 'var(--font-newsreader)', fontSize: 14.5, color: '#4a3728', background: '#fffdf8' }}></textarea>
                        <div style={{ display: 'flex', gap: 8, marginTop: 9, alignItems: 'center' }}>
                          <input value={q.profile || ''} onChange={(e) => { const newQuotes = [...editDraft.quotes]; newQuotes[i].profile = e.target.value; setEditDraft({...editDraft, quotes: newQuotes}); }} placeholder="Profile (e.g. Woman, early 30s)" style={{ flex: 1, border: '1px solid #e2d2b4', borderRadius: 9, padding: '8px 11px', fontSize: 13, color: '#4a3728', background: '#fffdf8' }} />
                          {q.audio_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ background: '#3f9e8f', color: '#fff', padding: '8px 13px', borderRadius: 9, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Audio attached</div>
                              <div onClick={() => { const newQuotes = [...editDraft.quotes]; newQuotes[i].audio_url = null; newQuotes[i].has_audio = false; setEditDraft({...editDraft, quotes: newQuotes}); }} style={{ cursor: 'pointer', background: '#e0b6b6', color: '#c05a5a', padding: '8px 10px', borderRadius: 9, fontSize: 11, fontWeight: 700 }} title="Remove audio">×</div>
                            </div>
                          ) : (
                            <label style={{ cursor: 'pointer', background: '#e2d2b4', color: '#6b573f', padding: '8px 13px', borderRadius: 9, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>🎙 Upload audio</span>
                              <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData });
                                  const data = await res.json();
                                  if (data.publicUrl) {
                                    const newQuotes = [...editDraft.quotes];
                                    newQuotes[i].audio_url = data.publicUrl;
                                    newQuotes[i].has_audio = true;
                                    setEditDraft({...editDraft, quotes: newQuotes});
                                    toast.success('Audio uploaded');
                                  } else {
                                    toast.error(data.error || 'Upload failed');
                                  }
                                } catch (err) {
                                  toast.error('Audio upload failed');
                                }
                                e.target.value = '';
                              }} />
                            </label>
                          )}
                          <div onClick={() => { const newQuotes = editDraft.quotes.filter((_: any, idx: number) => idx !== i); setEditDraft({...editDraft, quotes: newQuotes}); }} style={{ cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0b6b6', color: '#c05a5a', borderRadius: 9, fontWeight: 700 }}>×</div>
                        </div>
                        {q.audio_url && (
                          <audio controls src={q.audio_url} style={{ width: '100%', marginTop: 10, height: 36, borderRadius: 8 }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setEditDraft({...editDraft, quotes: [...(editDraft.quotes || []), { quote: '', profile: '', has_audio: false, audio_url: null }]})} style={{ cursor: 'pointer', marginTop: 10, fontSize: 13, fontWeight: 600, color: '#c98a3d' }}>+ Add quote</div>
                </div>

                {/* Suggestions / Integrations */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, letterSpacing: '.14em', color: '#a07b4d', textTransform: 'uppercase', marginBottom: 4 }}>Suggestions → integration (You Said → We Did)</div>
                  <p style={{ fontSize: 12.5, color: '#8a6f4d', margin: '0 0 12px' }}>Tag each suggestion with the project area it shaped, and describe exactly what you built.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(editDraft.suggestions || []).map((s: any, i: number) => (
                      <div key={i} style={{ background: '#f4e8d3', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: '#8a6f4d' }}>They said...</label>
                            <textarea value={s.quote || ''} onChange={(e) => { const newSuggs = [...editDraft.suggestions]; newSuggs[i].quote = e.target.value; setEditDraft({...editDraft, suggestions: newSuggs}); }} placeholder="Participant quote or suggestion" style={{ width: '100%', minHeight: 46, marginTop: 4, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 9, padding: '8px 10px', fontSize: 13.5, color: '#4a3728', background: '#fffdf8' }}></textarea>
                            <input value={s.voice || ''} onChange={(e) => { const newSuggs = [...editDraft.suggestions]; newSuggs[i].voice = e.target.value; setEditDraft({...editDraft, suggestions: newSuggs}); }} placeholder="Profile / Voice" style={{ width: '100%', marginTop: 6, border: '1px solid #e2d2b4', borderRadius: 9, padding: '8px 10px', fontSize: 13, color: '#4a3728', background: '#fffdf8' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: '#8a6f4d' }}>We did...</label>
                            <textarea value={s.integration_note || s.note || ''} onChange={(e) => { const newSuggs = [...editDraft.suggestions]; newSuggs[i].integration_note = e.target.value; setEditDraft({...editDraft, suggestions: newSuggs}); }} placeholder="How this was integrated into the project" style={{ width: '100%', minHeight: 46, marginTop: 4, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 9, padding: '8px 10px', fontSize: 13.5, color: '#4a3728', background: '#fffdf8' }}></textarea>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                              {areas.map(a => {
                                const isSelected = (s.project_area_id || s.area_id) === a.id;
                                return (
                                  <div key={a.id} onClick={() => { const newSuggs = [...editDraft.suggestions]; newSuggs[i].project_area_id = isSelected ? null : a.id; setEditDraft({...editDraft, suggestions: newSuggs}); }} style={{ cursor: 'pointer', background: isSelected ? a.color : '#fffdf8', color: isSelected ? '#fff' : '#6b573f', border: isSelected ? `1px solid ${a.color}` : '1px solid #d9c3a0', padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>{a.name}</div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <div onClick={() => { const newSuggs = editDraft.suggestions.filter((_: any, idx: number) => idx !== i); setEditDraft({...editDraft, suggestions: newSuggs}); }} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#c05a5a' }}>Remove suggestion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setEditDraft({...editDraft, suggestions: [...(editDraft.suggestions || []), { quote: '', voice: '', integration_note: '', project_area_id: null }]})} style={{ cursor: 'pointer', marginTop: 12, fontSize: 13, fontWeight: 600, color: '#c98a3d' }}>+ Add suggestion tracing</div>
                </div>

                {/* Barriers */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed #d9c3a0' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b573f', display: 'block', marginBottom: 8 }}>Barriers (comma separated)</label>
                  <input 
                    value={(editDraft.barriers || []).join(', ')} 
                    onChange={(e) => setEditDraft({...editDraft, barriers: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)})} 
                    placeholder="Internet / technology access, Community trust..." 
                    style={{ width: '100%', border: '1px solid #e2d2b4', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#4a3728', background: '#fffdf8' }} 
                  />
                </div>

              </div>
            )}
          </div>
        )}

        {/* ===== INBOX TAB ===== */}
        {adminTab === 'inbox' && (
          <div>
            <p style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontSize: 16, color: '#8a6f4d', margin: '0 0 20px' }}>Public reflections from Continue the Listening. Set a status, tag the project area, and write what you integrated — anything marked <strong style={{ color: '#3f9e8f' }}>Integrated</strong> appears on the public You Said → We Did board.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subs.map((x: any, i: number) => (
                <div key={x.id} style={{ background: '#fbf5ea', borderRadius: 16, padding: '22px 24px', boxShadow: '0 8px 20px rgba(60,40,20,.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#8a6f4d' }}>{x.name || 'Anonymous'} · {x.age_range || 'Unknown age'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#a07b4d' }}>{new Date(x.created_at).toLocaleDateString()}</span>
                      <span style={{ background: x.status === 'new' ? '#d97a97' : x.status === 'integrated' ? '#5aa06a' : '#d9c3a0', color: x.status === 'new' || x.status === 'integrated' ? '#fff' : '#6b573f', padding: '3px 11px', borderRadius: 14, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>{x.status || 'New'}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'var(--font-newsreader)', fontSize: 17, lineHeight: 1.55, color: '#4a3728', margin: '12px 0 0' }}>“{x.reflection}”</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {x.consider && <span style={{ background: '#f4e8d3', color: '#6b573f', padding: '5px 11px', borderRadius: 8, fontSize: 12 }}>Consider: {x.consider}</span>}
                    {x.value && <span style={{ background: '#f4e8d3', color: '#6b573f', padding: '5px 11px', borderRadius: 8, fontSize: 12 }}>Values: {x.value}</span>}
                    {x.topic_tags && x.topic_tags.length > 0 && (
                      <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#a07b4d', alignSelf: 'center' }}>
                        {x.topic_tags.join('  ·  ')}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed #d9c3a0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6b573f', marginBottom: 7 }}>Status</div>
                      <div style={{ display: 'inline-flex', gap: 3, background: '#f2e4cb', padding: 4, borderRadius: 9 }}>
                        <div onClick={() => handleUpdateSub(x.id, { status: 'new' })} style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: x.status === 'new' ? '#fff' : 'transparent', color: x.status === 'new' ? '#4a3728' : '#8a6f4d' }}>New</div>
                        <div onClick={() => handleUpdateSub(x.id, { status: 'reviewed' })} style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: x.status === 'reviewed' ? '#fff' : 'transparent', color: x.status === 'reviewed' ? '#4a3728' : '#8a6f4d' }}>Reviewed</div>
                        <div onClick={() => handleUpdateSub(x.id, { status: 'integrated' })} style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: x.status === 'integrated' ? '#fff' : 'transparent', color: x.status === 'integrated' ? '#4a3728' : '#8a6f4d' }}>Integrated</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6b573f', marginBottom: 7 }}>Integrated into project area</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {areas.map((a: any) => {
                          const isSelected = x.area_id === a.id;
                          return (
                            <div key={a.id} onClick={() => handleUpdateSub(x.id, { area_id: isSelected ? null : a.id })} style={{ cursor: 'pointer', background: isSelected ? a.color : 'transparent', color: isSelected ? '#fff' : '#6b573f', border: isSelected ? `1px solid ${a.color}` : '1px solid #d9c3a0', padding: '5px 11px', borderRadius: 16, fontSize: 11.5, fontWeight: 500 }}>
                              {a.name}
                            </div>
                          );
                        })}
                      </div>
                      <textarea
                        defaultValue={x.integration_note || ''}
                        onBlur={(e) => handleUpdateSub(x.id, { integration_note: e.target.value })}
                        placeholder="What we built / traced this to (shows publicly when Integrated)"
                        style={{ width: '100%', minHeight: 56, marginTop: 10, resize: 'vertical', border: '1px solid #e2d2b4', borderRadius: 9, padding: '9px 11px', fontSize: 13.5, color: '#4a3728', background: '#fffdf8' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
