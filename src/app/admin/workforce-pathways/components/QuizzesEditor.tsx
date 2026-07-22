import React, { useState, useEffect } from 'react';
import { PATHWAYS as INITIAL_PATHWAYS, QUIZZES } from '@/data/workforce-content';
import { fetchAllQuizzes, saveQuiz } from '../actions';
import toast from 'react-hot-toast';

export default function QuizzesEditor({ pathways }: { pathways: any[] }) {
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [pwTab, setPwTab] = useState('creator');
  const [stopTab, setStopTab] = useState('terrain');

  const [promptVal, setPromptVal] = useState('');
  const [pickVal, setPickVal] = useState('');
  const [resultVal, setResultVal] = useState('');
  const [allowCustom, setAllowCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [optional, setOptional] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllQuizzes().then(data => setDbQuizzes(data));
  }, []);

  useEffect(() => {
    const dbQ = dbQuizzes.find(q => q.pathway_id === pwTab && q.stop_id === stopTab);
    const staticQ = (QUIZZES as any)[pwTab]?.[stopTab] || {};
    const meta = dbQ?.options?.find((o: any) => o.id === '__meta__') || {};
    const cleanDbOptions = dbQ?.options?.filter((o: any) => o.id !== '__meta__');
    
    setPromptVal(dbQ ? (dbQ.prompt || '') : (staticQ.prompt || ''));
    setPickVal(dbQ ? (dbQ.pick || meta.pick || '') : (staticQ.pick || ''));
    setResultVal(dbQ ? (dbQ.result || meta.result || '') : (staticQ.result || ''));
    setAllowCustom(dbQ ? !!dbQ.allow_custom : !!staticQ.allowCustom);
    setCustomLabel(dbQ ? (dbQ.custom_label || meta.custom_label || '') : (staticQ.customLabel || ''));
    setOptional(dbQ ? !!dbQ.optional : !!staticQ.optional);
    setOptions(dbQ && cleanDbOptions ? cleanDbOptions : (staticQ.options || []));
  }, [pwTab, stopTab, dbQuizzes]);

  const pwTabs = [
    { id: 'creator', label: 'Content Creator', mark: '@', style: getPwTabStyle(pwTab === 'creator', '#ff6a2e'), countStyle: getCountStyle('#ff6a2e') },
    { id: 'enviro', label: 'Environmental Careers', mark: '▲', style: getPwTabStyle(pwTab === 'enviro', '#14f0c8'), countStyle: getCountStyle('#14f0c8') }
  ];

  const pwActive = pathways.find(p => p.id === pwTab);
  const stops = pwActive ? pwActive.stops : [];
  const stopActive = stops.find((s: any) => s.id === stopTab);

  function getPwTabStyle(active: boolean, color: string) {
    return {
      all: 'unset' as any, cursor: 'pointer', boxSizing: 'border-box' as any, padding: '9px 13px',
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      fontFamily: "'Press Start 2P', monospace", fontSize: '8px',
      background: active ? '#163a82' : 'transparent',
      color: active ? 'var(--paper)' : '#6f6a88',
      border: `3px solid ${active ? '#1c1526' : 'transparent'}`,
      borderBottom: `4px solid ${active ? color : 'transparent'}`,
      boxShadow: active ? 'none' : 'none',
      borderRadius: '9px 9px 0 0'
    };
  }

  function getCountStyle(color: string) {
    return {
      padding: '4px 6px', background: color, color: '#10285e', fontSize: '6.5px', border: '2px solid #1c1526', marginLeft: '6px'
    };
  }

  const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#8f88ad', letterSpacing: '.4px', marginBottom: '11px' };
  const inputStyle = { width: '100%', padding: '11px 12px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontSize: '18px', outline: 'none' };
  const smallInputStyle = { width: '100%', padding: '9px 11px', background: '#163a82', color: '#f2f6ff', border: '2px solid #1c1526', fontSize: '16px', outline: 'none' };

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await saveQuiz({
        pathway_id: pwTab,
        stop_id: stopTab,
        prompt: promptVal,
        pick: pickVal,
        result: resultVal,
        allow_custom: allowCustom,
        custom_label: customLabel,
        optional,
        options
      });
      if (res && res.error) throw res.error;
      const data = await fetchAllQuizzes();
      setDbQuizzes(data);
      toast.success('Quiz saved!');
    } catch (err: any) {
      toast.error('Failed to save quiz: ' + err.message);
    }
    setIsSaving(false);
  }

  return (
    <div style={{ maxWidth: '1120px' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>NODE QUIZZES</div>
      <p style={{ margin: '14px 0 18px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '800px' }}>
        One question per waypoint. A student picks one option (or writes their own); every pick aggregates into <span style={{ color: '#ffdd2e' }}>Node 7 — the Summit</span> as their Career Pathway Card. Edits publish live.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {pwTabs.map(t => (
          <button key={t.id} onClick={() => setPwTab(t.id)} style={t.style}>
            <span style={{ fontSize: '13px' }}>{t.mark}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px', display: 'flex', gap: '16px', overflowX: 'auto', marginBottom: '18px' }}>
        {stops.map((s: any) => {
          const isActive = stopTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStopTab(s.id)}
              style={{
                all: 'unset', cursor: 'pointer', boxSizing: 'border-box', flex: '0 0 auto', padding: '10px 14px',
                background: isActive ? '#ffdd2e' : '#2656a4', color: isActive ? '#10285e' : 'var(--muted)',
                fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', border: '3px solid #1c1526',
                boxShadow: isActive ? '3px 3px 0 rgba(18,12,26,.4)' : 'none', borderRadius: '7px'
              }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <div style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: pwTab === 'creator' ? '#ff6a2e' : '#14f0c8', borderBottom: '4px solid #1c1526' }}>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#10285e', lineHeight: 1.4 }}>{stopActive?.name}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#10285e', opacity: .75, marginTop: '6px' }}>MISSION PICK</div>
          </div>
          <button onClick={() => {
            const staticQ = (QUIZZES as any)[pwTab]?.[stopTab] || {};
            setPromptVal(staticQ.prompt || '');
            setPickVal(staticQ.pick || '');
            setResultVal(staticQ.result || '');
            setAllowCustom(!!staticQ.allowCustom);
            setCustomLabel(staticQ.customLabel || '');
            setOptional(!!staticQ.optional);
            setOptions(staticQ.options || []);
          }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '8px 11px', background: '#10285e', color: pwTab === 'creator' ? '#ff6a2e' : '#14f0c8', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.3)', borderRadius: '6px', flex: '0 0 auto' }}>
            ↺ Reset default
          </button>
        </div>
        
        <div style={{ padding: '18px' }}>
          <label style={labelStyle}>Question prompt</label>
          <input className="awf" value={promptVal} onChange={e => setPromptVal(e.target.value)} placeholder="What do you want to ask at this node?" style={{ ...inputStyle, marginBottom: '15px' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <div><label style={labelStyle}>Pick label</label><input className="awf" value={pickVal} onChange={e => setPickVal(e.target.value)} placeholder="e.g. Pick a job profile" style={inputStyle} /></div>
            <div><label style={labelStyle}>Card label (result)</label><input className="awf" value={resultVal} onChange={e => setResultVal(e.target.value)} placeholder="e.g. Job profile" style={inputStyle} /></div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button onClick={() => setOptional(!optional)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '8px 12px', background: optional ? '#10285e' : '#2656a4', color: optional ? '#14f0c8' : '#8f88ad', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', border: '3px solid #1c1526', boxShadow: optional ? '2px 2px 0 rgba(18,12,26,.3)' : 'inset 2px 2px 0 rgba(18,12,26,.3)', borderRadius: '6px' }}>
              {optional ? 'OPTIONAL ✓' : 'REQUIRED'}
            </button>
            <button onClick={() => setAllowCustom(!allowCustom)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '8px 12px', background: allowCustom ? '#10285e' : '#2656a4', color: allowCustom ? '#14f0c8' : '#8f88ad', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', border: '3px solid #1c1526', boxShadow: allowCustom ? '2px 2px 0 rgba(18,12,26,.3)' : 'inset 2px 2px 0 rgba(18,12,26,.3)', borderRadius: '6px' }}>
              {allowCustom ? 'CUSTOM SLOT ✓' : 'NO CUSTOM SLOT'}
            </button>
          </div>

          {allowCustom && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Custom-slot placeholder</label>
              <input className="awf" value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Hint shown in the 'write your own' box" style={inputStyle} />
            </div>
          )}

          <div style={{ padding: '13px', background: '#10285e', border: '3px solid #1c1526', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
              <label style={labelStyle}>Options</label>
              <button onClick={() => setOptions([...options, { id: 'o' + Date.now(), label: 'New Option', sub: '' }])} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '6px 10px', background: '#2656a4', color: '#ffdd2e', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', border: '2px solid #1c1526', borderRadius: '5px' }}>
                + Option
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {options.map((o, i) => (
                <div key={o.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', alignItems: 'center' }}>
                  <input className="awf" value={o.label} onChange={e => { const no = [...options]; no[i].label = e.target.value; setOptions(no); }} placeholder="Option label" style={smallInputStyle} />
                  <input className="awf" value={o.sub} onChange={e => { const no = [...options]; no[i].sub = e.target.value; setOptions(no); }} placeholder="Sub-line (optional)" style={smallInputStyle} />
                  <button onClick={() => { if (i===0) return; const no=[...options]; const t=no[i-1]; no[i-1]=no[i]; no[i]=t; setOptions(no); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px', background: '#163a82', border: '2px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                  <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px', background: '#2656a4', color: '#ff6b6b', border: '2px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button onClick={handleSave} disabled={isSaving} style={{ all: 'unset', cursor: isSaving ? 'not-allowed' : 'pointer', boxSizing: 'border-box', padding: '12px 24px', background: '#12f0c0', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}>
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
