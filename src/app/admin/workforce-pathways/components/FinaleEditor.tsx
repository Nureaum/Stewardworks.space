import React, { useState, useEffect } from 'react';
import { PATHWAYS as INITIAL_PATHWAYS, SUMMITS, QUIZZES } from '@/data/workforce-content';
import { fetchAllSummits, saveSummit } from '../actions';
import toast from 'react-hot-toast';

export default function FinaleEditor({ pathways }: { pathways: any[] }) {
  const [dbSummits, setDbSummits] = useState<any[]>([]);
  const [pwTab, setPwTab] = useState('creator');

  const [title, setTitle] = useState('');
  const [klass, setKlass] = useState('');
  const [intro, setIntro] = useState('');
  const [closer, setCloser] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllSummits().then(data => setDbSummits(data));
  }, []);

  useEffect(() => {
    const dbS = dbSummits.find(s => s.pathway_id === pwTab);
    
    setTitle(dbS ? dbS.title : '');
    setKlass(dbS ? dbS.klass : '');
    setIntro(dbS ? dbS.intro : '');
    setCloser(dbS ? dbS.closer : '');
  }, [pwTab, dbSummits]);

  const pwTabs = [
    { id: 'creator', label: 'Content Creator', mark: '@', style: getPwTabStyle(pwTab === 'creator', '#ff6a2e'), countStyle: getCountStyle('#ff6a2e') },
    { id: 'enviro', label: 'Environmental Careers', mark: '▲', style: getPwTabStyle(pwTab === 'enviro', '#14f0c8'), countStyle: getCountStyle('#14f0c8') }
  ];

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

  const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#8f88ad', letterSpacing: '.4px', marginBottom: '11px' };
  const inputStyle = { width: '100%', padding: '13px 14px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontSize: '20px', outline: 'none' };
  const textareaStyle = { width: '100%', padding: '13px 14px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '20px', lineHeight: 1.45, outline: 'none', resize: 'vertical' as any, marginBottom: '16px' };

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveSummit({
        pathway_id: pwTab,
        title,
        klass,
        intro,
        closer
      });
      const data = await fetchAllSummits();
      setDbSummits(data);
      toast.success('Finale saved!');
    } catch (err: any) {
      toast.error('Failed to save finale: ' + err.message);
    }
    setIsSaving(false);
  }

  return (
    <div style={{ maxWidth: '1120px' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>NODE 7 — FINALE</div>
      <p style={{ margin: '14px 0 18px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '800px' }}>
        The celebratory end-of-trail experience. Each student generates a unique Career Pathway Card based on the picks they made along the trail. Edit the framing copy per trail - the per-node result labels come from <span style={{ color: '#45d4ff' }}>Node Quizzes</span>. Edits publish live.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {pwTabs.map(t => (
          <button key={t.id} onClick={() => setPwTab(t.id)} style={t.style}>
            <span style={{ fontSize: '13px' }}>{t.mark}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: pwTab === 'creator' ? '#ff6a2e' : '#14f0c8', borderBottom: '4px solid #1c1526' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#10285e' }}>♛ {pwTab === 'creator' ? 'CONTENT CREATOR' : 'ENVIRONMENTAL'} — PATHWAY CARD</span>
          <button onClick={() => {
            setTitle('');
            setKlass('');
            setIntro('');
            setCloser('');
          }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '8px 11px', background: '#10285e', color: pwTab === 'creator' ? '#ff6a2e' : '#14f0c8', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.3)', borderRadius: '6px', flex: '0 0 auto' }}>
            ↺ Reset default
          </button>
        </div>
        
        <div style={{ padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <div><label style={labelStyle}>Card title</label><input className="awf" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CONTENT CREATOR — PATHWAY CARD" style={inputStyle} /></div>
            <div><label style={labelStyle}>Class / hero title</label><input className="awf" value={klass} onChange={e => setKlass(e.target.value)} placeholder="e.g. THE STORYTELLER" style={inputStyle} /></div>
          </div>
          
          <label style={labelStyle}>Intro line</label>
          <textarea className="awf" value={intro} onChange={e => setIntro(e.target.value)} placeholder="Shown at the top of the Summit screen" rows={2} style={textareaStyle}></textarea>
          
          <label style={labelStyle}>Closing line</label>
          <textarea className="awf" value={closer} onChange={e => setCloser(e.target.value)} placeholder="The call-to-action printed on the card footer" rows={2} style={textareaStyle}></textarea>
          
          <div style={{ marginTop: '24px', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
            <label style={{ ...labelStyle, marginBottom: '16px' }}>CARD SHOWS THESE PICKS (labels from Node Quizzes)</label>
            <div style={{ background: '#10285e', border: '3px solid #1c1526', borderRadius: '4px', overflow: 'hidden' }}>
              {(() => {
                const currentPw = pathways.find(p => p.id === pwTab);
                if (!currentPw || !currentPw.stops) return null;
                
                return currentPw.stops.map((s: any, i: number) => {
                  const qData = (QUIZZES as any)[pwTab]?.[s.id] || {};
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < currentPw.stops.length - 1 ? '2px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '24px', height: '24px', background: pwTab === 'creator' ? '#ffdd2e' : '#14f0c8', color: '#10285e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '2px solid #1c1526' }}>
                          {pwTab === 'creator' ? '✶' : '▲'}
                        </div>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#f2f6ff' }}>
                          {qData.result || 'Result Label'}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#8f88ad' }}>
                        {s.name}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button onClick={handleSave} disabled={isSaving} style={{ all: 'unset', cursor: isSaving ? 'not-allowed' : 'pointer', boxSizing: 'border-box', padding: '12px 24px', background: '#12f0c0', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}>
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
