'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, Music, FileText, Loader2, Volume2, VolumeX, Pencil, X, Check } from 'lucide-react';

interface WellnessResource {
  id?: string;
  slot_key: string;
  label: string;
  title: string;
  description: string;
  sort_order: number;
}

interface WellnessTone {
  id: string;
  name: string;
  frequency: number;
  wave_type: string;
  gain: number;
  audio_url?: string;
  is_active: boolean;
  sort_order: number;
}

const WAVE_TYPES = ['sine', 'triangle', 'square', 'sawtooth'];

export default function WellnessAdminPage() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [tones, setTones] = useState<WellnessTone[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingResources, setSavingResources] = useState(false);
  const [savingTone, setSavingTone] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New tone form
  const [showAddTone, setShowAddTone] = useState(false);
  const [newTone, setNewTone] = useState({ name: '', frequency: '174', wave_type: 'sine', gain: '0.05' });
  const [newToneFile, setNewToneFile] = useState<File | null>(null);
  const [newToneMode, setNewToneMode] = useState<'synthesized' | 'audio'>('audio');

  // Editing tone
  const [editingToneId, setEditingToneId] = useState<string | null>(null);
  const [editTone, setEditTone] = useState({ name: '', frequency: '', wave_type: '', gain: '' });
  const [editToneFile, setEditToneFile] = useState<File | null>(null);

  // Audio preview
  const [previewToneId, setPreviewToneId] = useState<string | null>(null);
  const [previewStop, setPreviewStop] = useState<(() => void) | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/wellness');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setResources(data.resources || []);
      setTones(data.tones || []);
    } catch (err) {
      showMessage('error', 'Failed to load wellness data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Resource card editing ──
  const updateResource = (idx: number, field: keyof WellnessResource, value: string) => {
    setResources(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const saveResources = async () => {
    setSavingResources(true);
    try {
      const res = await fetch('/api/admin/wellness', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      showMessage('success', 'Resource cards saved! Changes will appear on the wellness page.');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to save resources');
    } finally {
      setSavingResources(false);
    }
  };

  // ── Tone CRUD ──
  const addTone = async () => {
    if (!newTone.name.trim()) return;
    if (newToneMode === 'synthesized' && !newTone.frequency) return;
    if (newToneMode === 'audio' && !newToneFile) return;
    setSavingTone('new');
    try {
      let audio_url = '';
      if (newToneMode === 'audio' && newToneFile) {
        const formData = new FormData();
        formData.append('file', newToneFile);
        const uploadRes = await fetch('/api/admin/wellness/tones/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        audio_url = uploadData.url;
      }
      const res = await fetch('/api/admin/wellness/tones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTone.name,
          frequency: Number(newTone.frequency) || 174,
          wave_type: newTone.wave_type || 'sine',
          gain: Number(newTone.gain) || 0.05,
          audio_url: audio_url || null,
          sort_order: tones.length,
        }),
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      setTones(prev => [...prev, data.tone]);
      setNewTone({ name: '', frequency: '174', wave_type: 'sine', gain: '0.05' });
      setNewToneFile(null);
      setShowAddTone(false);
      showMessage('success', 'Tone added!');
    } catch (err) {
      showMessage('error', 'Failed to add tone');
    } finally {
      setSavingTone(null);
    }
  };

  const startEdit = (tone: WellnessTone) => {
    setEditingToneId(tone.id);
    setEditTone({
      name: tone.name,
      frequency: String(tone.frequency),
      wave_type: tone.wave_type,
      gain: String(tone.gain),
    });
  };

  const saveEdit = async () => {
    if (!editingToneId) return;
    setSavingTone(editingToneId);
    try {
      const res = await fetch('/api/admin/wellness/tones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingToneId,
          name: editTone.name,
          frequency: Number(editTone.frequency),
          wave_type: editTone.wave_type,
          gain: Number(editTone.gain),
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setTones(prev => prev.map(t => t.id === editingToneId ? data.tone : t));
      setEditingToneId(null);
      showMessage('success', 'Tone updated!');
    } catch (err) {
      showMessage('error', 'Failed to update tone');
    } finally {
      setSavingTone(null);
    }
  };

  const deleteTone = async (id: string) => {
    if (!confirm('Delete this tone?')) return;
    setSavingTone(id);
    try {
      const res = await fetch(`/api/admin/wellness/tones?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setTones(prev => prev.filter(t => t.id !== id));
      showMessage('success', 'Tone deleted');
    } catch (err) {
      showMessage('error', 'Failed to delete tone');
    } finally {
      setSavingTone(null);
    }
  };

  const toggleActive = async (tone: WellnessTone) => {
    setSavingTone(tone.id);
    try {
      const res = await fetch('/api/admin/wellness/tones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tone.id, is_active: !tone.is_active }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      setTones(prev => prev.map(t => t.id === tone.id ? data.tone : t));
    } catch (err) {
      showMessage('error', 'Failed to toggle tone');
    } finally {
      setSavingTone(null);
    }
  };

  // ── Audio preview ──
  const previewTone = (tone: WellnessTone) => {
    // Stop any existing preview
    if (previewStop) { previewStop(); setPreviewStop(null); }

    if (previewToneId === tone.id) {
      setPreviewToneId(null);
      return;
    }

    try {
      // If tone has audio_url, preview with Audio element
      if (tone.audio_url) {
        const audio = new Audio(tone.audio_url);
        audio.volume = tone.gain;
        audio.play();
        
        const stop = () => { audio.pause(); audio.currentTime = 0; };
        setPreviewToneId(tone.id);
        setPreviewStop(() => stop);
        setTimeout(() => { stop(); setPreviewToneId(null); setPreviewStop(null); }, 5000);
        return;
      }

      // Synthesized tone preview
      // @ts-ignore
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.wave_type as OscillatorType;
      osc.frequency.value = tone.frequency;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.linearRampToValueAtTime(tone.gain, ctx.currentTime + 0.5);

      const stop = () => {
        try {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
          setTimeout(() => { osc.stop(); ctx.close(); }, 400);
        } catch {}
      };

      setPreviewToneId(tone.id);
      setPreviewStop(() => stop);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        stop();
        setPreviewToneId(null);
        setPreviewStop(null);
      }, 5000);
    } catch (e) {
      showMessage('error', 'Audio not supported');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-[#e2b54a]" size={36} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.28em] text-[#b89a5a] mb-1">ADMIN</p>
        <h1 className="text-[28px] font-[800] text-[#2a1f14] tracking-tight">Wellness & Meditation</h1>
        <p className="text-[14px] text-[#8a7a5a] mt-1">Manage the meditation page resource cards and ambient tones.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-bold shadow-lg border transition-all animate-in slide-in-from-top-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* ═══════════ SECTION 1: RESOURCE CARDS ═══════════ */}
      <div className="bg-white rounded-2xl border border-[#e8dcc4] shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e2b54a]/10 flex items-center justify-center">
              <FileText size={18} className="text-[#c8963e]" />
            </div>
            <div>
              <h2 className="text-[17px] font-[700] text-[#2a1f14]">Resource Cards</h2>
              <p className="text-[12px] text-[#9a8a6a]">The 3 info boxes at the bottom of the meditation page</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newKey = `card_${Date.now()}`;
                setResources(prev => [...prev, { slot_key: newKey, label: 'NEW', title: 'New Card', description: 'Edit this description.', sort_order: prev.length }]);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2a1f14] text-[#FEFAE0] font-bold text-[13px] tracking-wide shadow-md hover:bg-[#1a1209] transition-colors"
            >
              <Plus size={16} />
              Add Card
            </button>
            <button
              onClick={saveResources}
              disabled={savingResources}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-white font-bold text-[13px] tracking-wide shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingResources ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Cards
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {resources.map((r, idx) => (
            <div key={r.slot_key} className="bg-[#FBF4E1] rounded-xl border border-[#e8dcc4]/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#b89a5a] uppercase">
                  Slot: {r.slot_key}
                </div>
                <button
                  type="button"
                  onClick={() => setResources(prev => prev.filter((_, i) => i !== idx))}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Remove card"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Label</label>
                  <input
                    type="text"
                    value={r.label}
                    onChange={e => updateResource(idx, 'label', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40 focus:border-[#e2b54a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Title</label>
                  <input
                    type="text"
                    value={r.title}
                    onChange={e => updateResource(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40 focus:border-[#e2b54a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Description</label>
                  <input
                    type="text"
                    value={r.description}
                    onChange={e => updateResource(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40 focus:border-[#e2b54a]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ SECTION 2: TONE MANAGER ═══════════ */}
      <div className="bg-white rounded-2xl border border-[#e8dcc4] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e2b54a]/10 flex items-center justify-center">
              <Music size={18} className="text-[#c8963e]" />
            </div>
            <div>
              <h2 className="text-[17px] font-[700] text-[#2a1f14]">Ambient Tones</h2>
              <p className="text-[12px] text-[#9a8a6a]">Add, edit, or remove tones available on the meditation page</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddTone(!showAddTone)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2a1f14] text-[#FEFAE0] font-bold text-[13px] tracking-wide shadow-md hover:bg-[#1a1209] transition-colors"
          >
            <Plus size={16} />
            Add Tone
          </button>
        </div>

        {/* Add tone form */}
        {showAddTone && (
          <div className="bg-[#FBF4E1] rounded-xl border border-[#e8dcc4]/60 p-5 mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#b89a5a] mb-3">NEW TONE</div>
            
            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNewToneMode('audio')}
                className={`px-4 py-2 rounded-lg text-[12px] font-bold border transition-colors ${newToneMode === 'audio' ? 'bg-[#2a1f14] text-[#FEFAE0] border-[#2a1f14]' : 'bg-white text-[#6a5a3a] border-[#d8c8a4] hover:bg-[#f5edd5]'}`}
              >
                🎵 Upload Audio File
              </button>
              <button
                onClick={() => setNewToneMode('synthesized')}
                className={`px-4 py-2 rounded-lg text-[12px] font-bold border transition-colors ${newToneMode === 'synthesized' ? 'bg-[#2a1f14] text-[#FEFAE0] border-[#2a1f14]' : 'bg-white text-[#6a5a3a] border-[#d8c8a4] hover:bg-[#f5edd5]'}`}
              >
                〰️ Synthesized Wave
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Name</label>
                <input
                  type="text"
                  value={newTone.name}
                  onChange={e => setNewTone(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ocean Waves"
                  className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                />
              </div>
              
              {newToneMode === 'audio' ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Audio File (MP3, WAV, OGG)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={e => setNewToneFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#d8c8a4] bg-white text-[13px] text-[#2a1f14] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#e2b54a]/20 file:text-[#8a6a2a] hover:file:bg-[#e2b54a]/30"
                  />
                  {newToneFile && <div className="text-[11px] text-[#6a5a3a] mt-1">Selected: {newToneFile.name}</div>}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Frequency (Hz)</label>
                    <input
                      type="number"
                      value={newTone.frequency}
                      onChange={e => setNewTone(p => ({ ...p, frequency: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                    />
                  </div>
                </>
              )}
            </div>

            {newToneMode === 'synthesized' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Wave Type</label>
                  <select
                    value={newTone.wave_type}
                    onChange={e => setNewTone(p => ({ ...p, wave_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                  >
                    {WAVE_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6a5a3a] uppercase tracking-wide mb-1">Gain (0–1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newTone.gain}
                    onChange={e => setNewTone(p => ({ ...p, gain: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#d8c8a4] bg-white text-[14px] text-[#2a1f14] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={addTone}
                disabled={savingTone === 'new'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-white font-bold text-[12px] shadow hover:opacity-90 disabled:opacity-50"
              >
                {savingTone === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
              <button
                onClick={() => { setShowAddTone(false); setNewToneFile(null); }}
                className="px-4 py-2 rounded-lg border border-[#d8c8a4] text-[#8a7a5a] font-bold text-[12px] hover:bg-[#f5edd5]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tone list */}
        {tones.length === 0 ? (
          <div className="text-center py-10 text-[#9a8a6a] text-[14px]">
            No tones yet. Click "Add Tone" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {tones.map(tone => (
              <div
                key={tone.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  tone.is_active
                    ? 'bg-[#FBF4E1] border-[#e8dcc4]/60'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                {/* Preview button */}
                <button
                  onClick={() => previewTone(tone)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    previewToneId === tone.id
                      ? 'bg-[#e2b54a] text-white'
                      : 'bg-[#e2b54a]/10 text-[#c8963e] hover:bg-[#e2b54a]/20'
                  }`}
                  title={previewToneId === tone.id ? 'Stop preview' : 'Preview tone'}
                >
                  {previewToneId === tone.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {editingToneId === tone.id ? (
                  /* Editing mode */
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={editTone.name}
                      onChange={e => setEditTone(p => ({ ...p, name: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-[#d8c8a4] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                    />
                    <input
                      type="number"
                      value={editTone.frequency}
                      onChange={e => setEditTone(p => ({ ...p, frequency: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-[#d8c8a4] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                    />
                    <select
                      value={editTone.wave_type}
                      onChange={e => setEditTone(p => ({ ...p, wave_type: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-[#d8c8a4] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                    >
                      {WAVE_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={editTone.gain}
                      onChange={e => setEditTone(p => ({ ...p, gain: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-[#d8c8a4] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e2b54a]/40"
                    />
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-[13px]">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-[#b89a5a] block">NAME</span>
                      <span className="font-semibold text-[#2a1f14]">{tone.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-[#b89a5a] block">TYPE</span>
                      <span className="text-[#4a3a2a]">{tone.audio_url ? '🎵 Audio File' : `〰️ ${tone.wave_type} ${tone.frequency}Hz`}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-[#b89a5a] block">{tone.audio_url ? 'FILE' : 'GAIN'}</span>
                      <span className="text-[#4a3a2a] truncate block max-w-[140px]">{tone.audio_url ? tone.audio_url.split('/').pop() : tone.gain}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-[#b89a5a] block">VOLUME</span>
                      <span className="text-[#4a3a2a]">{tone.gain}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {editingToneId === tone.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={savingTone === tone.id}
                        className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                        title="Save"
                      >
                        {savingTone === tone.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={() => setEditingToneId(null)}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(tone)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                          tone.is_active
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {tone.is_active ? 'Active' : 'Off'}
                      </button>
                      <button
                        onClick={() => startEdit(tone)}
                        className="w-8 h-8 rounded-lg bg-[#e2b54a]/10 text-[#c8963e] flex items-center justify-center hover:bg-[#e2b54a]/20 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTone(tone.id)}
                        disabled={savingTone === tone.id}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
