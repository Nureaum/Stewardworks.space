'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PATHWAYS as INITIAL_PATHWAYS } from '@/data/workforce-content';
import { fetchWorkforceCounts, fetchPublishedEntries, fetchWorkforceStructure, updateWorkforceMeta, upsertWorkforceEntry, deleteWorkforceEntry, uploadImage, fetchWorkforceJobs, upsertWorkforceJob, deleteWorkforceJob, fetchPendingSuggestions, approveSuggestion, dismissSuggestion, updateSuggestion, fetchAllPublishedSources, fetchExternalBoards, upsertExternalBoard, deleteExternalBoard, updateWorkforceEntryOrder } from './actions';
import { SortableList } from '@/components/admin/SortableList';
import { GripVertical } from 'lucide-react';
import QuizzesEditor from './components/QuizzesEditor';
import FinaleEditor from './components/FinaleEditor';
import './admin-arcade.css';
type Tab = 'overview' | 'published' | 'quizzes' | 'finale' | 'board' | 'external' | 'suggestions' | 'sources';

export default function WorkforcePathwaysAdminPage() {
  const rteRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [creatorCount, setCreatorCount] = useState(0);
  const [enviroCount, setEnviroCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [externalBoardsCount, setExternalBoardsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [stopCounts, setStopCounts] = useState<Record<string, number>>({});

  const [pwTab, setPwTab] = useState('creator');
  const [stopTab, setStopTab] = useState('terrain');
  const [publishedEntries, setPublishedEntries] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [externalBoards, setExternalBoards] = useState<any[]>([]);
  const [pathways, setPathways] = useState<any[]>(INITIAL_PATHWAYS);
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [srcFilter, setSrcFilter] = useState('all');

  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string, title: string, kind?: string, error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWorkforceStructure().then(({ pathways: dbPw, stops: dbStops }) => {
      const merged = INITIAL_PATHWAYS.map(p => {
         const dbp = dbPw.find(x => x.id === p.id);
         return {
           ...p,
           intro: dbp ? dbp.intro : p.intro,
           stops: p.stops.map(s => {
             const dbs = dbStops.find((x: any) => x.slug === s.id && x.pathway_id === p.id);
             return {
               ...s,
               blurb: dbs ? dbs.blurb : s.blurb
             }
           })
         };
      });
      setPathways(merged);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'published') {
      fetchPublishedEntries(pwTab, stopTab).then(data => setPublishedEntries(data));
    } else if (activeTab === 'board') {
      fetchWorkforceJobs().then(data => setJobs(data));
    } else if (activeTab === 'external') {
      fetchExternalBoards().then(data => setExternalBoards(data));
    } else if (activeTab === 'suggestions') {
      fetchPendingSuggestions().then(data => setPendingSuggestions(data));
    } else if (activeTab === 'sources') {
      fetchAllPublishedSources().then(data => setSources(data));
    }
  }, [activeTab, pwTab, stopTab]);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const data = await fetchWorkforceCounts();
        setCreatorCount(data.creatorCount);
        setEnviroCount(data.enviroCount);
        setJobsCount(data.jobsCount);
        setExternalBoardsCount(data.externalBoardsCount);
        setPendingCount(data.pendingCount);
        setSourcesCount(data.sourcesCount);
        setQuizzesCount(data.quizzesCount);
        setStopCounts(data.stopCounts);
      } catch (err) {
        console.error("Failed to fetch workforce data:", err);
      }
    }
    
    fetchCounts();
  }, []);

  const totalPublished = creatorCount + enviroCount;

  const navItems = [
    { id: 'overview', label: 'Overview', mark: '◉' },
    { id: 'published', label: 'Published', mark: '▤', badge: totalPublished, badgeMuted: true },
    { id: 'quizzes', label: 'Node quizzes', mark: '◆', badge: quizzesCount, badgeMuted: true },
    { id: 'finale', label: 'Node 7 finale', mark: '♛' },
    { id: 'board', label: 'Quest board', mark: '⚑', badge: jobsCount, badgeMuted: true },
    { id: 'external', label: 'External boards', mark: '◇', badge: externalBoardsCount, badgeMuted: true },
    { id: 'suggestions', label: 'Suggestions', mark: '✎', badge: pendingCount, badgeMuted: pendingCount === 0 },
    { id: 'sources', label: 'Sources feed', mark: '↗', badge: sourcesCount, badgeMuted: true },
  ];

  const creatorStops = pathways.find(p => p.id === 'creator')?.stops || [];
  const enviroStops = pathways.find(p => p.id === 'enviro')?.stops || [];

  return (
    <>
      
      <div className="arcade-container absolute inset-0 flex flex-col overflow-hidden">
        
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,.09) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply' }}></div>
        
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 16px', background: '#10285e', borderBottom: '4px solid #1c1526' }}>
          <span style={{ width: '20px', height: '20px', background: '#ffdd2e', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', flex: '0 0 auto' }}></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '2px 2px 0 rgba(255,0,77,.4)' }}>STEWARD CONSOLE</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#8f88ad', letterSpacing: '.5px', marginTop: '6px' }}>WORKFORCE DEVELOPMENT · LIBRARY SHELF: INDUSTRY AND WORKFORCE DEVELOPMENT</div>
          </div>
          <div style={{ flex: 1 }}></div>
          <Link href="/hub/workforce-pathways" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: '#45d4ff', color: '#10285e', textDecoration: 'none', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.5px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}>◀ Atlas</Link>
        </header>

        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
          
          <aside className="awf-scroll" style={{ flex: '0 0 252px', background: '#1b1730', borderRight: '4px solid #1c1526', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#6f6a88', letterSpacing: '.5px', padding: '0 4px 8px' }}>◆ CONSOLE</div>
            
            {/* Overview - standalone on top */}
            {navItems.filter(n => n.id === 'overview').map((n) => {
              const isActive = activeTab === n.id;
              return (
                <button 
                  key={n.id} 
                  type="button" 
                  onClick={() => setActiveTab(n.id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px',
                    background: isActive ? '#ffdd2e' : '#163a82', 
                    border: '3px solid #1c1526', 
                    borderRadius: '7px', cursor: 'pointer',
                    boxShadow: isActive ? 'none' : '3px 3px 0 rgba(18,12,26,.4)',
                    transform: isActive ? 'translate(3px, 3px)' : 'none'
                  }}
                >
                  <span style={{ width: '26px', height: '26px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: '#10285e', color: isActive ? '#ffdd2e' : '#8f88ad', border: '2px solid #1c1526' }}>
                    {n.mark}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: 1.5, color: isActive ? '#10285e' : 'var(--paper)' }}>
                    {n.label}
                  </span>
                  {n.badge !== undefined && (
                     <span style={{ 
                       flex: '0 0 auto', minWidth: '22px', textAlign: 'center', padding: '4px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
                       background: n.badgeMuted ? '#10285e' : '#ff2e8f', 
                       color: n.badgeMuted ? (isActive ? '#ffdd2e' : '#8f88ad') : '#fff'
                     }}>
                       {n.badge}
                     </span>
                  )}
                </button>
              );
            })}

            {/* Journey section */}
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#6f6a88', letterSpacing: '.5px', padding: '12px 4px 4px', borderTop: '2px solid #2a2440', marginTop: '6px' }}>▸ JOURNEY</div>
            {navItems.filter(n => ['published', 'quizzes', 'finale'].includes(n.id)).map((n) => {
              const isActive = activeTab === n.id;
              return (
                <button 
                  key={n.id} 
                  type="button" 
                  onClick={() => setActiveTab(n.id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px',
                    background: isActive ? '#ffdd2e' : '#163a82', 
                    border: '3px solid #1c1526', 
                    borderRadius: '7px', cursor: 'pointer',
                    boxShadow: isActive ? 'none' : '3px 3px 0 rgba(18,12,26,.4)',
                    transform: isActive ? 'translate(3px, 3px)' : 'none'
                  }}
                >
                  <span style={{ width: '26px', height: '26px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: '#10285e', color: isActive ? '#ffdd2e' : '#8f88ad', border: '2px solid #1c1526' }}>
                    {n.mark}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: 1.5, color: isActive ? '#10285e' : 'var(--paper)' }}>
                    {n.label}
                  </span>
                  {n.badge !== undefined && (
                     <span style={{ 
                       flex: '0 0 auto', minWidth: '22px', textAlign: 'center', padding: '4px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
                       background: n.badgeMuted ? '#10285e' : '#ff2e8f', 
                       color: n.badgeMuted ? (isActive ? '#ffdd2e' : '#8f88ad') : '#fff'
                     }}>
                       {n.badge}
                     </span>
                  )}
                </button>
              );
            })}

            {/* Job Board section */}
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#6f6a88', letterSpacing: '.5px', padding: '12px 4px 4px', borderTop: '2px solid #2a2440', marginTop: '6px' }}>▸ JOB BOARD</div>
            {navItems.filter(n => ['board', 'external'].includes(n.id)).map((n) => {
              const isActive = activeTab === n.id;
              return (
                <button 
                  key={n.id} 
                  type="button" 
                  onClick={() => setActiveTab(n.id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px',
                    background: isActive ? '#ffdd2e' : '#163a82', 
                    border: '3px solid #1c1526', 
                    borderRadius: '7px', cursor: 'pointer',
                    boxShadow: isActive ? 'none' : '3px 3px 0 rgba(18,12,26,.4)',
                    transform: isActive ? 'translate(3px, 3px)' : 'none'
                  }}
                >
                  <span style={{ width: '26px', height: '26px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: '#10285e', color: isActive ? '#ffdd2e' : '#8f88ad', border: '2px solid #1c1526' }}>
                    {n.mark}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: 1.5, color: isActive ? '#10285e' : 'var(--paper)' }}>
                    {n.label}
                  </span>
                  {n.badge !== undefined && (
                     <span style={{ 
                       flex: '0 0 auto', minWidth: '22px', textAlign: 'center', padding: '4px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
                       background: n.badgeMuted ? '#10285e' : '#ff2e8f', 
                       color: n.badgeMuted ? (isActive ? '#ffdd2e' : '#8f88ad') : '#fff'
                     }}>
                       {n.badge}
                     </span>
                  )}
                </button>
              );
            })}

            {/* Sources section */}
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#6f6a88', letterSpacing: '.5px', padding: '12px 4px 4px', borderTop: '2px solid #2a2440', marginTop: '6px' }}>▸ SOURCES</div>
            {navItems.filter(n => ['suggestions', 'sources'].includes(n.id)).map((n) => {
              const isActive = activeTab === n.id;
              return (
                <button 
                  key={n.id} 
                  type="button" 
                  onClick={() => setActiveTab(n.id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px',
                    background: isActive ? '#ffdd2e' : '#163a82', 
                    border: '3px solid #1c1526', 
                    borderRadius: '7px', cursor: 'pointer',
                    boxShadow: isActive ? 'none' : '3px 3px 0 rgba(18,12,26,.4)',
                    transform: isActive ? 'translate(3px, 3px)' : 'none'
                  }}
                >
                  <span style={{ width: '26px', height: '26px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: '#10285e', color: isActive ? '#ffdd2e' : '#8f88ad', border: '2px solid #1c1526' }}>
                    {n.mark}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: 1.5, color: isActive ? '#10285e' : 'var(--paper)' }}>
                    {n.label}
                  </span>
                  {n.badge !== undefined && (
                     <span style={{ 
                       flex: '0 0 auto', minWidth: '22px', textAlign: 'center', padding: '4px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
                       background: n.badgeMuted ? '#10285e' : '#ff2e8f', 
                       color: n.badgeMuted ? (isActive ? '#ffdd2e' : '#8f88ad') : '#fff'
                     }}>
                       {n.badge}
                     </span>
                  )}
                </button>
              );
            })}
            
            <div style={{ flex: 1 }}></div>

            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '7px', background: 'transparent', border: '3px solid transparent', borderRadius: '7px', cursor: 'pointer', textDecoration: 'none' }}>
              <span style={{ width: '26px', height: '26px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: '#45d4ff', color: '#10285e', border: '2px solid #1c1526' }}>
                ◀
              </span>
              <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: 1.5, color: 'var(--paper)' }}>
                Back to Admin
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#1d4490', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', marginTop: '20px' }}>
              <span style={{ width: '28px', height: '28px', background: '#ffdd2e', color: '#10285e', border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flex: '0 0 auto' }}>▤</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#8f88ad', letterSpacing: '.4px' }}>AUTO-SYNCED</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--paper)', marginTop: '6px' }}>{totalPublished} LIVE</div>
              </div>
            </div>
          </aside>

          <main className="awf-scroll" style={{ flex: 1, minWidth: 0, padding: '26px 30px 80px', overflowY: 'auto' }}>
            
            {activeTab === 'overview' && (
              <div style={{ maxWidth: '1120px' }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>OVERVIEW</div>
                <p style={{ margin: '14px 0 22px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '760px' }}>
                  Everything catalogued for the Workforce Development atlas. Every record also shelves in the Steward Library under <span style={{ color: '#ffdd2e' }}>Industry and Workforce Development</span> with its trail tag.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '18px' }}>
                  <button type="button" onClick={() => { setPwTab('creator'); setStopTab(pathways.find(p => p.id === 'creator')?.stops[0]?.id || ''); setActiveTab('published'); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'block', background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', background: '#ff6a2e', borderBottom: '4px solid #1c1526' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#10285e' }}>Content Creator</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#10285e', opacity: .72 }}>*Content Creator</span>
                    </div>
                    <div style={{ padding: '16px 16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '28px', color: 'var(--paper)' }}>{creatorCount}</span>
                        <span style={{ fontSize: '18px', color: 'var(--muted)', paddingBottom: '5px' }}>records live</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                        {creatorStops.map((s, i) => (
                           <button
                             key={i}
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setPwTab('creator'); setStopTab(s.id); setActiveTab('published'); }}
                             style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '5px 8px', background: '#2656a4', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', border: '2px solid #1c1526', transition: 'background .15s' }}
                             onMouseEnter={e => (e.currentTarget.style.background = '#ff6a2e', e.currentTarget.style.color = '#10285e')}
                             onMouseLeave={e => (e.currentTarget.style.background = '#2656a4', e.currentTarget.style.color = 'var(--muted)')}
                           >{s.name} {stopCounts[`creator:${s.id}`] || 0}</button>
                        ))}
                      </div>
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ff6a2e', letterSpacing: '.5px', marginTop: '14px' }}>PUBLISHED RESOURCES ▸</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => { setPwTab('enviro'); setStopTab(pathways.find(p => p.id === 'enviro')?.stops[0]?.id || ''); setActiveTab('published'); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'block', background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', background: '#12f0c0', borderBottom: '4px solid #1c1526' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#10285e' }}>Environmental Careers</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#10285e', opacity: .72 }}>*Environmental Career</span>
                    </div>
                    <div style={{ padding: '16px 16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '28px', color: 'var(--paper)' }}>{enviroCount}</span>
                        <span style={{ fontSize: '18px', color: 'var(--muted)', paddingBottom: '5px' }}>records live</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                        {enviroStops.map((s, i) => (
                           <button
                             key={i}
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setPwTab('enviro'); setStopTab(s.id); setActiveTab('published'); }}
                             style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '5px 8px', background: '#2656a4', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', border: '2px solid #1c1526', transition: 'background .15s' }}
                             onMouseEnter={e => (e.currentTarget.style.background = '#12f0c0', e.currentTarget.style.color = '#10285e')}
                             onMouseLeave={e => (e.currentTarget.style.background = '#2656a4', e.currentTarget.style.color = 'var(--muted)')}
                           >{s.name} {stopCounts[`enviro:${s.id}`] || 0}</button>
                        ))}
                      </div>
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#12f0c0', letterSpacing: '.5px', marginTop: '14px' }}>PUBLISHED RESOURCES ▸</div>
                    </div>
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)', letterSpacing: '.4px', lineHeight: 1.7 }}>TOTAL PUBLISHED</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: 'var(--paper)', marginTop: '12px' }}>{totalPublished}</div>
                  </div>
                  <button type="button" onClick={() => setActiveTab('suggestions')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', background: '#163a82', border: '4px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)', letterSpacing: '.4px', lineHeight: 1.7 }}>AWAITING REVIEW</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#ff6a2e' }}>{pendingCount}</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ff6a2e' }}>REVIEW ▸</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => setActiveTab('board')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', background: '#163a82', border: '4px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)', letterSpacing: '.4px', lineHeight: 1.7 }}>JOB POSTINGS</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#ffdd2e' }}>{jobsCount}</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ffdd2e' }}>BOARD ▸</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => setActiveTab('sources')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', background: '#163a82', border: '4px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)', letterSpacing: '.4px', lineHeight: 1.7 }}>LIBRARY SOURCES</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '20px', color: '#45d4ff' }}>{sourcesCount}</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#45d4ff' }}>FEED ▸</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'published' && (() => {
              const activePw = pathways.find(p => p.id === pwTab) || pathways[0];
              const activeStop = activePw.stops.find((s: any) => s.id === stopTab) || activePw.stops[0];
              
              const PW_ACCENT: Record<string, string> = { creator: "#ff6a2e", enviro: "#14f0c8" };
              const STOP_COLOR: Record<string, string> = { terrain: "#ff2e8f", portfolio: "#ff6a2e", story: "#ffdd2e", tools: "#12f0c0", hiring: "#45d4ff", mesa: "#d24dff" };
              const getPwColor = (id: string) => PW_ACCENT[id] || "#ff6a2e";
              const getStopColor = (id: string) => STOP_COLOR[id] || "#ffdd2e";

              return (
                <div style={{ maxWidth: '1120px' }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>PUBLISHED RESOURCES</div>
                  <p style={{ margin: '14px 0 18px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '760px' }}>
                    Edit or retire any field note. Changes publish straight to the atlas and the Library shelf.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', marginBottom: '16px', background: '#163a82', border: '4px solid #1c1526', boxShadow: '4px 4px 0 rgba(18,12,26,.42)', borderRadius: '9px' }}>
                    <span style={{ flex: '0 0 auto', width: '30px', height: '30px', background: '#45d4ff', color: '#10285e', border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>◈</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#45d4ff', letterSpacing: '.4px' }}>MISSION BRIEFING · {activePw.name.toUpperCase()}</span>
                        <button type="button" onClick={() => setEditingItem({ kind: 'meta', type: 'pathway', id: activePw.id, label: 'MISSION BRIEFING', hint: 'Explain what this pathway covers overall', data: { metaText: activePw.intro } })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '6px 10px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>✎ Edit</button>
                      </div>
                      <p style={{ margin: '9px 0 0', fontSize: '17px', lineHeight: 1.4, color: 'var(--paper)' }}>{activePw.intro}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {pathways.map(p => {
                      const isActive = pwTab === p.id;
                      const pwCount = p.id === 'creator' ? creatorCount : (p.id === 'enviro' ? enviroCount : 0);
                      return (
                        <button key={p.id} type="button" onClick={() => { setPwTab(p.id); setStopTab(p.stops[0].id); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', background: isActive ? getPwColor(p.id) : '#163a82', color: isActive ? '#10285e' : '#8f88ad' }}>
                          <span style={{ fontSize: '13px' }}>{p.mark}</span>
                          {p.name}
                          <span style={{ minWidth: '20px', textAlign: 'center', padding: '3px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', background: isActive ? '#10285e' : '#2656a4', color: isActive ? '#f2f6ff' : '#9fc0ee' }}>
                            {pwCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                    {activePw.stops.map(s => {
                      const isActive = stopTab === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => setStopTab(s.id)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', background: isActive ? getStopColor(s.id) : '#163a82', color: isActive ? '#10285e' : '#8f88ad' }}>
                          {s.name}
                          <span style={{ minWidth: '20px', textAlign: 'center', padding: '3px 6px', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', background: isActive ? '#10285e' : '#2656a4', color: isActive ? '#f2f6ff' : '#9fc0ee' }}>
                            {stopCounts[pwTab+':'+s.id] || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: getStopColor(activeStop.id), border: '4px solid #1c1526', borderBottom: 0, borderRadius: '9px 9px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                      <span style={{ width: '32px', height: '32px', background: '#10285e', color: getStopColor(activeStop.id), border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flex: '0 0 auto' }}>{activeStop.mark}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#10285e', lineHeight: 1.4 }}>{activeStop.name.toUpperCase()}</div>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#10285e', opacity: .75, marginTop: '6px' }}>{activePw.name.toUpperCase()} · {stopCounts[`${pwTab}:${activeStop.id}`] || 0} PUBLISHED</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditingItem({ kind: 'entry', pathwayId: activePw.id, stopId: activeStop.id, data: {} })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 12px', background: '#10285e', color: getStopColor(activeStop.id), fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.5px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.3)', borderRadius: '7px', flex: '0 0 auto' }}>＋ Add</button>
                  </div>

                  <div style={{ background: '#163a82', border: '4px solid #1c1526', borderTop: 0, borderRadius: '0 0 9px 9px', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', padding: '12px 16px', background: '#1d4490', borderBottom: '3px solid #10285e' }}>
                      <div>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '8px' }}>NODE INTRO · {activeStop.name.toUpperCase()}</div>
                        <p style={{ margin: 0, fontSize: '17px', lineHeight: 1.4, color: 'var(--paper)', maxWidth: '640px' }}>
                          {activeStop.blurb}
                        </p>
                      </div>
                      <button type="button" onClick={() => setEditingItem({ kind: 'meta', type: 'stop', id: activeStop.id, pwId: activePw.id, label: 'NODE INTRO', hint: 'Explain what this waypoint covers', data: { metaText: activeStop.blurb } })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', flex: '0 0 auto', padding: '6px 10px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>✎ Edit</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 92px 118px 150px', gap: '14px', alignItems: 'center', padding: '11px 18px', background: '#10285e', borderBottom: '3px solid #1c1526' }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: 'var(--muted)', paddingLeft: '20px' }}>#</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: 'var(--muted)' }}>RESOURCE</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: 'var(--muted)' }}>CALL NO.</span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: 'var(--muted)' }}>TYPE</span>
                      <span></span>
                    </div>

                    {publishedEntries.length > 0 && (
                      <SortableList
                        items={publishedEntries}
                        onChange={async (newOrder) => {
                          // Update local state optimistically
                          const newCatalog = [...publishedEntries];
                          const reorderedCatalog = newOrder.map((no, idx) => {
                            const found = newCatalog.find(c => c.id === no.id);
                            return found ? { ...found, sort_order: idx } : no;
                          }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                          setPublishedEntries(reorderedCatalog);
                          
                          // Call backend
                          const updates = newOrder.map((item, index) => ({ id: item.id, sort_order: index }));
                          await updateWorkforceEntryOrder(updates);
                        }}
                        renderItem={(r, isDragging) => {
                          const idx = publishedEntries.findIndex(c => c.id === r.id);
                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 92px 118px 150px', gap: '14px', alignItems: 'center', padding: '13px 18px', borderBottom: '3px solid #10285e', background: isDragging ? '#1b1730' : 'transparent', opacity: isDragging ? 0.9 : 1, boxShadow: isDragging ? '0 12px 24px -12px rgba(0,0,0,0.5)' : 'none', cursor: 'grab' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#45d4ff' }}>
                                <GripVertical size={14} style={{ opacity: 0.4 }} />
                                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px' }}>{String(idx + 1).padStart(2, '0')}</span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '19px', lineHeight: 1.25, color: 'var(--paper)' }}>{r.title}</div>
                                <div style={{ fontSize: '15px', lineHeight: 1.3, color: 'var(--muted)', marginTop: '3px' }}>{r.subtitle || r.media_fallback}</div>
                              </div>
                              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ffdd2e' }}>{r.call_no || '—'}</span>
                              <span style={{ justifySelf: 'start', padding: '4px 8px', background: '#2656a4', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--muted)' }}>{r.type || 'Field Note'}</span>
                              <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingItem({ kind: 'entry', pathwayId: activePw.id, stopId: activeStop.id, data: { ...r, photos: r.images || r.photos || [] } })} onPointerDown={(e) => e.stopPropagation()} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>Edit</button>
                                <button type="button" onClick={() => setDeletingItem({ id: r.id, title: r.title })} onPointerDown={(e) => e.stopPropagation()} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: '#ff6b6b', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>Retire</button>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}
                    
                    {publishedEntries.length === 0 && (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '17px' }}>
                        No resources published here yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'board' && (
              <div style={{ maxWidth: '1120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>QUEST BOARD</div>
                    <p style={{ margin: '14px 0 0', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '760px' }}>
                      Staff-curated postings shown beneath each trail's atlas. Keep it short and fresh - the outside boards handle volume.
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditingItem({ kind: 'job', data: {} })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 16px', background: '#ffdd2e', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', letterSpacing: '.4px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}>＋ ADD POSTING</button>
                </div>

                <div style={{ background: '#163a82', border: '4px solid #1c1526', borderRadius: '9px', overflow: 'hidden', marginTop: '24px' }}>
                  {jobs.map((j, i) => {
                    const isEnviro = j.pathway_id === 'enviro';
                    const color = isEnviro ? '#14f0c8' : '#ff6a2e';
                    const timeAgo = (date: string) => {
                      const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24));
                      if (days === 0) return 'Today';
                      if (days === 1) return '1 day ago';
                      if (days < 7) return `${days} days ago`;
                      const weeks = Math.floor(days / 7);
                      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                    };
                    return (
                      <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: i === jobs.length - 1 ? 'none' : '3px solid #10285e' }}>
                        <span style={{ width: '12px', height: '12px', flex: '0 0 auto', background: color, border: '2px solid #1c1526' }}></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '19px', color: 'var(--paper)', fontWeight: 500 }}>{j.title}</span>
                            <span style={{ padding: '3px 6px', background: '#2656a4', color: 'var(--paper)', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '6px' }}>{j.job_type}</span>
                            <span style={{ padding: '3px 6px', background: color, color: '#10285e', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', textTransform: 'uppercase' }}>{j.pathway_id}</span>
                          </div>
                          <div style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '8px' }}>
                            {j.organization} · {j.location} · {timeAgo(j.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto' }}>
                          <button type="button" onClick={() => setEditingItem({ kind: 'job', data: j })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>EDIT</button>
                          <button type="button" onClick={() => setDeletingItem({ id: j.id, title: j.title, kind: 'job' })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: '#ff6b6b', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>REMOVE</button>
                        </div>
                      </div>
                    );
                  })}
                  {jobs.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '17px' }}>
                      No jobs on the quest board.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'external' && (
              <div style={{ maxWidth: '1120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>EXTERNAL BOARDS</div>
                    <p style={{ margin: '14px 0 0', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '760px' }}>
                      The big regional & national boards the stewards keep an eye on. Shown under the BOARDS filter.
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditingItem({ kind: 'external_board', data: {} })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 16px', background: '#ffdd2e', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', letterSpacing: '.4px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}>＋ ADD BOARD</button>
                </div>

                <div style={{ background: '#163a82', border: '4px solid #1c1526', borderRadius: '9px', overflow: 'hidden', marginTop: '24px' }}>
                  {externalBoards.map((b, i) => {
                    const isEnviro = b.pathway_id === 'enviro';
                    const color = isEnviro ? '#14f0c8' : '#ff6a2e';
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: i === externalBoards.length - 1 ? 'none' : '3px solid #10285e' }}>
                        <span style={{ width: '36px', height: '36px', background: '#45d4ff', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#10285e', flex: '0 0 auto' }}>↗</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: 'var(--paper)', lineHeight: 1.5 }}>{b.label}</span>
                            <span style={{ padding: '3px 6px', background: color, color: '#10285e', border: '2px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', textTransform: 'uppercase' }}>{b.pathway_id}</span>
                          </div>
                          <div style={{ fontSize: '17px', color: 'var(--muted)', marginTop: '8px' }}>
                            {b.description} · <a href={b.url} target="_blank" rel="noopener" style={{ color: '#45d4ff' }}>{b.url}</a>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto' }}>
                          <button type="button" onClick={() => setEditingItem({ kind: 'external_board', data: b })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>EDIT</button>
                          <button type="button" onClick={() => setDeletingItem({ id: b.id, title: b.label, kind: 'external_board' })} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '7px 10px', background: '#2656a4', color: '#ff6b6b', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>REMOVE</button>
                        </div>
                      </div>
                    );
                  })}
                  {externalBoards.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '17px' }}>
                      No external boards added yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div style={{ maxWidth: '1120px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>REVIEW QUEUE</div>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#ff6a2e' }}>{pendingCount} AWAITING</span>
                </div>
                <p style={{ margin: '14px 0 20px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '760px' }}>
                  Explorer-submitted resources. Approve to catalogue in the atlas and the Steward Library under <span style={{ color: '#ffdd2e' }}>Industry and Workforce Development</span> - with the trail tag attached - or dismiss.
                </p>

                {pendingSuggestions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {pendingSuggestions.map((s, i) => {
                      const isCreator = s.pathway_id === 'creator';
                      const pwName = isCreator ? 'Content Creator' : 'Enviro Careers';
                      const stopName = (pathways.find(p => p.id === s.pathway_id)?.stops || []).find((st: any) => st.id === s.stop_id)?.name || s.stop_id;
                      const color = isCreator ? '#ff6a2e' : '#14f0c8';
                      const mark = isCreator ? '@' : '▲';
                      const url = s.sources && s.sources.length > 0 ? s.sources[0][1] : '';

                      return (
                        <div key={s.id} style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: color, color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', textTransform: 'uppercase', border: '2px solid #1c1526' }}>
                                <span style={{ fontSize: '11px' }}>{mark}</span>{pwName}
                              </span>
                              <span style={{ padding: '5px 9px', background: '#2656a4', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', border: '2px solid #1c1526' }}>
                                {stopName} · {s.type}
                              </span>
                            </div>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)' }}>FROM {s.subtitle || 'anonymous'}</span>
                          </div>
                          
                          <div style={{ fontSize: '22px', lineHeight: 1.2, color: 'var(--paper)' }}>{s.title}</div>
                          <div style={{ margin: '8px 0 13px', fontSize: '17px', lineHeight: 1.45, color: '#c7bfe0' }} dangerouslySetInnerHTML={{ __html: s.body_html || s.subtitle || 'No note provided.' }} />
                          
                          <a href={url} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', maxWidth: '100%', padding: '8px 12px', background: '#10285e', color: '#45d4ff', textDecoration: 'none', fontSize: '16px', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ↗ {url}
                          </a>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: '3px dashed #4a4468' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#1d4490', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', letterSpacing: '.3px', border: '2px solid #1c1526' }}>
                              + Industry & Workforce Dev.
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'transparent', color: color, fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', letterSpacing: '.3px', border: '2px solid ' + color }}>
                              *{pwName}
                            </span>
                            
                            <div style={{ flex: 1 }}></div>
                            
                            <button 
                              type="button" 
                              onClick={() => setEditingItem({ kind: 'suggestion', data: s })}
                              style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: '#ffdd2e', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}
                            >
                              EDIT
                            </button>
                            <button 
                              type="button" 
                              onClick={async () => {
                                await approveSuggestion(s.id);
                                fetchPendingSuggestions().then(data => setPendingSuggestions(data));
                                fetchWorkforceCounts().then(data => setPendingCount(data.pendingCount));
                              }} 
                              style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: '#12f0c0', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}
                            >
                              ✓ APPROVE
                            </button>
                            <button 
                              type="button" 
                              onClick={async () => {
                                await dismissSuggestion(s.id);
                                fetchPendingSuggestions().then(data => setPendingSuggestions(data));
                                fetchWorkforceCounts().then(data => setPendingCount(data.pendingCount));
                              }} 
                              style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: '#2656a4', color: '#ff6b6b', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', letterSpacing: '.4px', textTransform: 'uppercase', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px' }}
                            >
                              DISMISS
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '54px 20px', background: '#163a82', border: '4px dashed #4a4468', borderRadius: '9px' }}>
                    <div style={{ width: '50px', height: '50px', margin: '0 auto 14px', background: '#12f0c0', color: '#10285e', border: '4px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '18px' }}>✓</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', color: 'var(--paper)' }}>QUEUE CLEAR</div>
                    <div style={{ fontSize: '17px', color: 'var(--muted)', marginTop: '10px' }}>Every suggestion reviewed. New ones from the atlas land here.</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <QuizzesEditor pathways={pathways} />
            )}

            {activeTab === 'finale' && (
              <FinaleEditor pathways={pathways} />
            )}

            {activeTab === 'sources' && (
              <div style={{ maxWidth: '1120px' }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--paper)', letterSpacing: '1px', textShadow: '3px 3px 0 rgba(255,0,77,.4)' }}>SOURCES ↘ LIBRARY</div>
                <p style={{ margin: '14px 0 18px', fontSize: '19px', lineHeight: 1.4, color: 'var(--muted)', maxWidth: '780px' }}>
                  Every approved source, catalogued under <span style={{ color: '#ffdd2e' }}>Industry and Workforce Development</span> with its trail tag. Newest first.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <button onClick={() => setSrcFilter('all')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: srcFilter === 'all' ? '#ffdd2e' : 'transparent', color: srcFilter === 'all' ? '#10285e' : '#6f6a88', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: srcFilter === 'all' ? '3px 3px 0 rgba(18,12,26,.4)' : 'none', borderRadius: '7px' }}>
                    <span style={{ fontSize: '13px' }}>=</span> ALL
                  </button>
                  <button onClick={() => setSrcFilter('creator')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: srcFilter === 'creator' ? '#ff6a2e' : 'transparent', color: srcFilter === 'creator' ? '#10285e' : '#6f6a88', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: srcFilter === 'creator' ? '3px 3px 0 rgba(18,12,26,.4)' : 'none', borderRadius: '7px' }}>
                    <span style={{ fontSize: '13px' }}>@</span> CREATOR
                  </button>
                  <button onClick={() => setSrcFilter('enviro')} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '9px 13px', background: srcFilter === 'enviro' ? '#14f0c8' : 'transparent', color: srcFilter === 'enviro' ? '#10285e' : '#6f6a88', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: srcFilter === 'enviro' ? '3px 3px 0 rgba(18,12,26,.4)' : 'none', borderRadius: '7px' }}>
                    <span style={{ fontSize: '13px' }}>*</span> ENVIRO
                  </button>
                </div>

                <div style={{ background: '#163a82', border: '4px solid #1c1526', boxShadow: '5px 5px 0 rgba(18,12,26,.42)', borderRadius: '9px', overflow: 'hidden' }}>
                  {sources.filter(s => srcFilter === 'all' || (s.topic && s.topic.slug === srcFilter)).map((s, i) => {
                    const isCreator = s.topic && s.topic.slug === 'creator';
                    const isEnviro = s.topic && s.topic.slug === 'enviro';
                    const pwName = isCreator ? 'Content Creator' : (isEnviro ? 'Environmental Career' : 'Library Resource');
                    const color = isCreator ? '#ff6a2e' : (isEnviro ? '#14f0c8' : '#ffdd2e');
                    const url = s.media && s.media.length > 0 ? s.media[0].url : (s.external_url || '');
                    
                    // Simple "time ago" calculation for mock display
                    const dateObj = new Date(s.created_at || Date.now());
                    const diffDays = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
                    let dateStr = 'Just now';
                    if (diffDays > 0) dateStr = diffDays + ' days ago';
                    
                    return (
                      <a key={s.id} href="/hub/library?category=f4fc9a34-ce7f-4e1c-a360-f28d8a55becc" target="_blank" rel="noopener" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '14px', alignItems: 'center', padding: '14px 18px', borderBottom: '3px solid #10285e', textDecoration: 'none', color: 'var(--paper)' }}>
                        <span style={{ width: '16px', height: '16px', flex: '0 0 auto', background: color, border: '3px solid #1c1526' }}></span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '19px', lineHeight: 1.2, color: 'var(--paper)' }}>{s.title}</span>
                            {i === 0 && <span style={{ padding: '3px 7px', background: '#12f0c0', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', border: '2px solid #1c1526' }}>NEW</span>}
                          </div>
                          <div style={{ fontSize: '15px', lineHeight: 1.3, color: 'var(--muted)', marginTop: '4px' }}>
                            {s.body || 'No description'} · <span style={{ color: '#45d4ff' }}>{url}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <span style={{ padding: '3px 7px', background: '#1d4490', color: 'var(--muted)', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', border: '2px solid #1c1526' }}>
                              + Industry & Workforce Dev.
                            </span>
                            <span style={{ padding: '3px 7px', fontFamily: "'Press Start 2P', monospace", fontSize: '6px', border: '2px solid #1c1526', background: color, color: '#10285e' }}>
                              *{pwName}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flex: '0 0 auto', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--muted)' }}>
                          {dateStr}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}


          </main>
        </div>
      </div>

      {editingItem && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(10,8,20,.72)' }} onClick={() => setEditingItem(null)}></div>
          <div className="awf-scroll" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 75, width: 'min(720px,94vw)', maxHeight: '90vh', overflow: 'auto', background: '#163a82', border: '5px solid #1c1526', boxShadow: '0 0 0 3px #3a3357,12px 12px 0 rgba(0,0,0,.45)', animation: 'awf-pop .18s steps(3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', background: editingItem.kind === 'meta' ? '#ff6a2e' : (editingItem.kind === 'job' && !editingItem.data?.id ? '#ffdd2e' : '#14f0c8'), borderBottom: '4px solid #1c1526' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#10285e' }}>
                {editingItem.label || (
                  editingItem.kind === 'entry' 
                    ? (editingItem.data?.id ? 'EDIT RESOURCE' : 'ADD RESOURCE') 
                    : (editingItem.kind === 'job' && !editingItem.data?.id ? 'ADD POSTING' : 
                       (editingItem.kind === 'external_board' && !editingItem.data?.id ? 'ADD BOARD' : 
                       (editingItem.kind === 'suggestion' ? 'EDIT SUGGESTION' : 'EDIT')))
                )}
              </div>
              <button type="button" onClick={() => setEditingItem(null)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '30px', height: '30px', background: '#10285e', color: editingItem.kind === 'meta' ? '#ff6a2e' : (editingItem.kind === 'job' && !editingItem.data?.id ? '#ffdd2e' : '#14f0c8'), border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>✕</button>
            </div>
            <div style={{ padding: '20px 18px' }}>
              
              {editingItem.kind === 'meta' && (
                <div>
                  <label style={{ display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '10px' }}>{editingItem.label}</label>
                  <textarea 
                    value={editingItem.data.metaText || ''} 
                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, metaText: e.target.value } })}
                    placeholder="Write the copy shown in the atlas…" 
                    rows={6} 
                    style={{ width: '100%', padding: '12px 13px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '19px', lineHeight: 1.45, outline: 'none', resize: 'vertical' }}
                  ></textarea>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6.5px', color: '#6f6a88', letterSpacing: '.3px', marginTop: '8px', lineHeight: 1.7 }}>{editingItem.hint}</div>
                </div>
              )}

              {editingItem.kind === 'entry' && (() => {
                const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '10px' };
                const labelStyleFlat = { ...labelStyle, marginBottom: 0 };
                const inputStyle = { width: '100%', padding: '13px 14px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '21px', outline: 'none' };
                const smallInputStyle = { ...inputStyle, padding: '9px 11px', fontSize: '19px' };
                const addBtnStyle = { all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', padding: '6px 10px', background: '#10285e', color: '#14f0c8', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px dashed #45d4ff' } as any;
                const delBtnStyle = { all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#1c1526', color: '#ff6a2e', fontFamily: "'Press Start 2P', monospace", fontSize: '8px' } as any;
                
                const ed = editingItem.data;
                const setEd = (newData: any) => setEditingItem({ ...editingItem, data: newData });

                return (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>Title</label>
                      <input value={ed.title || ''} onChange={e => setEd({ ...ed, title: e.target.value })} placeholder="Resource title" style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>Subtitle</label>
                      <input value={ed.subtitle || ''} onChange={e => setEd({ ...ed, subtitle: e.target.value })} placeholder="A short descriptive line" style={inputStyle}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={labelStyle}>Call no.</label>
                        <input value={ed.call_no || ''} onChange={e => setEd({ ...ed, call_no: e.target.value })} placeholder="e.g. 331.7" style={inputStyle}/>
                      </div>
                      <div>
                        <label style={labelStyle}>Type</label>
                        <input value={ed.type || ''} onChange={e => setEd({ ...ed, type: e.target.value })} placeholder="e.g. Field Note" style={inputStyle}/>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px', padding: '13px', background: '#10285e', border: '3px solid #1c1526', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '11px' }}>
                        <label style={labelStyleFlat}>Photo</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', display: 'inline-flex', padding: '6px 10px', background: '#45d4ff', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', letterSpacing: '.4px', textTransform: 'uppercase', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>
                            ⬆ Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              onChange={async (e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  const existing = ed.photos || [];
                                  let newPhotos = [...existing];
                                  for (let fi = 0; fi < e.target.files.length; fi++) {
                                    const f = e.target.files[fi];
                                    const formData = new FormData();
                                    formData.append('file', f);
                                    const res = await uploadImage(formData);
                                    if (res.url) {
                                      const cleanCaption = f.name.replace(/^\d+-/, '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 40);
                                      // Fill an empty slot if one exists, otherwise add new
                                      const emptyIdx = newPhotos.findIndex((p: any) => !p.url);
                                      if (emptyIdx >= 0) {
                                        newPhotos[emptyIdx] = { url: res.url, caption: cleanCaption };
                                      } else {
                                        newPhotos = [...newPhotos, { url: res.url, caption: cleanCaption }];
                                      }
                                    }
                                  }
                                  setEd({ ...ed, photos: newPhotos });
                                }
                              }} 
                              style={{ display: 'none' }}
                            />
                          </label>
                          <button type="button" onClick={() => {
                            const existing = ed.photos || [];
                            setEd({ ...ed, photos: [...existing, { url: '', caption: '' }] });
                          }} style={addBtnStyle}>＋ URL</button>
                        </div>
                      </div>
                      
                      {(!ed.photos || ed.photos.length === 0) && (
                        <div style={{ padding: '15px', textAlign: 'center', border: '3px dashed #4a4468', fontSize: '16px', color: '#8f88ad', lineHeight: 1.45, marginBottom: '13px' }}>No photo yet. Upload one or paste a URL.</div>
                      )}

                      {ed.photos && ed.photos.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '13px' }}>
                          {ed.photos.map((p: any, i: number) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '76px 1fr auto', gap: '10px', alignItems: 'center', background: '#163a82', border: '3px solid #1c1526', padding: '8px' }}>
                              <div style={{ width: '76px', height: '58px', border: '2px solid #1c1526', overflow: 'hidden', background: 'repeating-linear-gradient(45deg,#163a82 0 8px,#2656a4 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p.url ? (
                                  <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                ) : (
                                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#6f6a88' }}>NO IMG</span>
                                )}
                              </div>
                              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                {p.url && p.url.startsWith('/uploads/') ? (
                                  <div style={{ ...smallInputStyle, background: '#0d1e4a', color: '#45d4ff', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>✓ Uploaded</span>
                                  </div>
                                ) : (
                                  <input value={p.url || ''} onChange={e => { const newPhotos = [...ed.photos]; newPhotos[i].url = e.target.value; setEd({ ...ed, photos: newPhotos }); }} placeholder="Image URL or uploaded photo" style={smallInputStyle}/>
                                )}
                                <input value={p.caption || ''} onChange={e => { const newPhotos = [...ed.photos]; newPhotos[i].caption = e.target.value; setEd({ ...ed, photos: newPhotos }); }} placeholder="Caption (optional)" style={smallInputStyle}/>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <button type="button" onClick={() => { const newPhotos = ed.photos.filter((_:any, idx:number) => idx !== i); setEd({ ...ed, photos: newPhotos }); }} style={delBtnStyle}>✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <label style={{ ...labelStyle, marginTop: 0 }}>Caption fallback</label>
                      <input value={ed.media_fallback || ''} onChange={e => setEd({ ...ed, media_fallback: e.target.value })} placeholder="Text shown only when there are no photos" style={inputStyle}/>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Body</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('B clicked'); try { document.execCommand('bold'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>B</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('I clicked'); try { document.execCommand('italic'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)', fontStyle: 'italic' }}>I</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('U clicked'); try { document.execCommand('underline'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)', textDecoration: 'underline' }}>U</button>
                        <span style={{ width: '2px', background: '#1c1526', margin: '0 2px' }}></span>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('H clicked'); try { document.execCommand('formatBlock', false, 'H3'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>H</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('P clicked'); try { document.execCommand('formatBlock', false, 'P'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>¶</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('UL clicked'); try { document.execCommand('insertUnorderedList'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>•</button>
                        <span style={{ width: '2px', background: '#1c1526', margin: '0 2px' }}></span>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('Link clicked'); const url = prompt('Enter link URL:'); if (url) { try { document.execCommand('createLink', false, url); } catch(e){} if (rteRef.current) rteRef.current.focus(); } }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>🔗</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { console.log('Clear clicked'); try { document.execCommand('removeFormat'); } catch(e){} if (rteRef.current) rteRef.current.focus(); }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '28px', height: '28px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1c1526', boxShadow: '2px 2px 0 rgba(18,12,26,.4)' }}>⌫</button>
                      </div>
                      <div 
                        ref={rteRef}
                        className="awf-rte"
                        contentEditable 
                        suppressContentEditableWarning={true}
                        onBlur={e => setEd({ ...ed, body_html: e.currentTarget.innerHTML })}
                        dangerouslySetInnerHTML={{ __html: ed.body_html || '' }}
                        style={{ ...inputStyle, minHeight: '180px', lineHeight: 1.4, overflowY: 'auto' }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px', padding: '13px', background: '#10285e', border: '3px solid #1c1526', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
                        <label style={labelStyleFlat}>Fast facts</label>
                        <button type="button" onClick={() => setEd({ ...ed, facts: [...(ed.facts || []), ['', '']] })} style={addBtnStyle}>＋ Fact</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(ed.facts || []).map((f: any, i: number) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '8px', alignItems: 'center' }}>
                            <input value={f[0] || ''} onChange={e => { const newFacts = [...ed.facts]; newFacts[i][0] = e.target.value; setEd({ ...ed, facts: newFacts }); }} placeholder="Label" style={smallInputStyle}/>
                            <input value={f[1] || ''} onChange={e => { const newFacts = [...ed.facts]; newFacts[i][1] = e.target.value; setEd({ ...ed, facts: newFacts }); }} placeholder="Value" style={smallInputStyle}/>
                            <button type="button" onClick={() => { const newFacts = ed.facts.filter((_:any, idx:number) => idx !== i); setEd({ ...ed, facts: newFacts }); }} style={delBtnStyle}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '13px', background: '#10285e', border: '3px solid #1c1526', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
                        <label style={labelStyleFlat}>Links & sources</label>
                        <button type="button" onClick={() => setEd({ ...ed, sources: [...(ed.sources || []), ['', '']] })} style={addBtnStyle}>＋ Link</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(ed.sources || []).map((s: any, i: number) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                            <input value={s[0] || ''} onChange={e => { const newSrcs = [...ed.sources]; newSrcs[i][0] = e.target.value; setEd({ ...ed, sources: newSrcs }); }} placeholder="Link label" style={smallInputStyle}/>
                            <input value={s[1] || ''} onChange={e => { const newSrcs = [...ed.sources]; newSrcs[i][1] = e.target.value; setEd({ ...ed, sources: newSrcs }); }} placeholder="https://…" style={smallInputStyle}/>
                            <button type="button" onClick={() => { const newSrcs = ed.sources.filter((_:any, idx:number) => idx !== i); setEd({ ...ed, sources: newSrcs }); }} style={delBtnStyle}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {editingItem.kind === 'job' && (() => {
                const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '10px' };
                const inputStyle = { width: '100%', padding: '12px 13px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '19px', outline: 'none' };
                const ed = editingItem.data;
                const setEd = (newData: any) => setEditingItem({ ...editingItem, data: newData });
                
                return (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>JOB TITLE</label>
                      <input value={ed.title || ''} onChange={e => setEd({ ...ed, title: e.target.value })} placeholder="e.g. Scientific Aid" style={inputStyle}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={labelStyle}>ORGANIZATION</label>
                        <input value={ed.organization || ''} onChange={e => setEd({ ...ed, organization: e.target.value })} placeholder="Employer" style={inputStyle}/>
                      </div>
                      <div>
                        <label style={labelStyle}>LOCATION</label>
                        <input value={ed.location || ''} onChange={e => setEd({ ...ed, location: e.target.value })} placeholder="e.g. El Centro" style={inputStyle}/>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={labelStyle}>TRAIL</label>
                        <select value={ed.pathway_id || 'enviro'} onChange={e => setEd({ ...ed, pathway_id: e.target.value })} style={{ ...inputStyle, appearance: 'none', paddingRight: '30px' }}>
                          <option value="enviro">Environmental Careers</option>
                          <option value="creator">Content Creator</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>KIND</label>
                        <select value={ed.job_type || 'Full-time'} onChange={e => setEd({ ...ed, job_type: e.target.value })} style={{ ...inputStyle, appearance: 'none', paddingRight: '30px' }}>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Seasonal">Seasonal</option>
                          <option value="Apprenticeship">Apprenticeship</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>LINK (URL)</label>
                      <input value={ed.apply_url || ''} onChange={e => setEd({ ...ed, apply_url: e.target.value })} placeholder="https://..." style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>ONE-LINE NOTE</label>
                      <input value={ed.note || ''} onChange={e => setEd({ ...ed, note: e.target.value })} placeholder="Why it's worth a look" style={inputStyle}/>
                    </div>
                  </div>
                );
              })()}
              {editingItem.kind === 'external_board' && (() => {
                const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '10px' };
                const inputStyle = { width: '100%', padding: '12px 13px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '19px', outline: 'none' };
                const ed = editingItem.data;
                const setEd = (newData: any) => setEditingItem({ ...editingItem, data: newData });
                
                return (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>BOARD LABEL</label>
                      <input value={ed.label || ''} onChange={e => setEd({ ...ed, label: e.target.value })} placeholder="e.g. AJCC Imperial" style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>LINK (URL)</label>
                      <input value={ed.url || ''} onChange={e => setEd({ ...ed, url: e.target.value })} placeholder="https://..." style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>DESCRIPTION</label>
                      <input value={ed.description || ''} onChange={e => setEd({ ...ed, description: e.target.value })} placeholder="Local workforce center postings" style={inputStyle}/>
                    </div>
                  </div>
                );
              })()}
              {editingItem.kind === 'suggestion' && (() => {
                const labelStyle = { display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '.4px', marginBottom: '10px' };
                const inputStyle = { width: '100%', padding: '12px 13px', background: '#10285e', color: '#f2f6ff', border: '3px solid #1c1526', fontFamily: "'VT323', monospace", fontSize: '19px', outline: 'none' };
                const ed = editingItem.data;
                const setEd = (newData: any) => setEditingItem({ ...editingItem, data: newData });
                
                return (
                  <div>
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>TRAIL</label>
                        <select value={ed.pathway_id || 'creator'} onChange={e => setEd({ ...ed, pathway_id: e.target.value })} style={inputStyle}>
                          <option value="creator">Content Creator</option>
                          <option value="enviro">Environmental</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>NODE</label>
                        <select value={ed.stop_id || 'terrain'} onChange={e => setEd({ ...ed, stop_id: e.target.value })} style={inputStyle}>
                          <option value="terrain">Know the Terrain</option>
                          <option value="portfolio">Portfolio Strategy</option>
                          <option value="story">Story & Resume</option>
                          <option value="tools">Tools & AI Kit</option>
                          <option value="hiring">Who's Hiring</option>
                          <option value="mesa">MESA Basecamp</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>TYPE</label>
                        <select value={ed.type || 'Article'} onChange={e => setEd({ ...ed, type: e.target.value })} style={inputStyle}>
                          <option>Article</option>
                          <option>Tool</option>
                          <option>Program</option>
                          <option>Course</option>
                          <option>Job posting</option>
                          <option>Video</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>TITLE</label>
                      <input value={ed.title || ''} onChange={e => setEd({ ...ed, title: e.target.value })} style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>LINK (URL)</label>
                      <input value={ed.sources?.[0]?.[1] || ''} onChange={e => {
                        const newSources = ed.sources ? [...ed.sources] : [['Link', '']];
                        newSources[0] = [newSources[0]?.[0] || 'Link', e.target.value];
                        setEd({ ...ed, sources: newSources });
                      }} style={inputStyle}/>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={labelStyle}>CONTRIBUTOR</label>
                      <input value={ed.subtitle || ''} onChange={e => setEd({ ...ed, subtitle: e.target.value })} style={inputStyle}/>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                {editingItem.error && <span style={{ color: '#ff6b6b', fontFamily: "'VT323', monospace", fontSize: '15px' }}>{editingItem.error}</span>}
                <button type="button" disabled={isSaving} onClick={() => setEditingItem(null)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 15px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', opacity: isSaving ? 0.5 : 1 }}>Cancel</button>
                <button type="button" disabled={isSaving} onClick={async () => {
                  if (editingItem.kind === 'meta') {
                    setIsSaving(true);
                    try {
                      await updateWorkforceMeta(editingItem.pathwayId || editingItem.type === 'pathway' ? 'pathway' : 'stop', editingItem.id, editingItem.data.metaText || editingItem.data);
                      
                      // Update local state
                      setPathways(prev => prev.map(p => {
                        if (p.id === (editingItem.pathwayId || editingItem.pwId || editingItem.id)) {
                          if (editingItem.type === 'stop') {
                            return { ...p, stops: p.stops.map(s => s.id === editingItem.id ? { ...s, blurb: editingItem.data.metaText || editingItem.data } : s) };
                          }
                          return { ...p, intro: editingItem.data.metaText || editingItem.data };
                        }
                        return p;
                      }));
                      setEditingItem(null);
                    } catch (err: any) {
                      console.error("Save meta error:", err);
                      setEditingItem({ ...editingItem, error: err.message || String(err) });
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (editingItem.kind === 'entry') {
                    setIsSaving(true);
                    try {
                      const payload = {
                        ...editingItem.data,
                        title: editingItem.data.title || '',
                        subtitle: editingItem.data.subtitle || '',
                        call_no: editingItem.data.call_no || '',
                        type: editingItem.data.type || '',
                        media_fallback: editingItem.data.media_fallback || '',
                        body_html: document.querySelector('[contenteditable]')?.innerHTML || editingItem.data.body_html || '',
                        pathway_id: editingItem.pathwayId,
                        stop_id: editingItem.stopId,
                        images: editingItem.data.photos || []
                      };
                      
                      const savedEntry = await upsertWorkforceEntry(payload);
                      
                      if (editingItem.data.id) {
                        setPublishedEntries(prev => prev.map(e => e.id === savedEntry.id ? savedEntry : e));
                      } else {
                        setPublishedEntries(prev => [...prev, savedEntry]);
                      }
                      
                      setEditingItem(null);
                    } catch (err: any) {
                      console.error("Save entry error:", err);
                      setEditingItem({ ...editingItem, error: err.message || String(err) });
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (editingItem.kind === 'job') {
                    setIsSaving(true);
                    try {
                      const payload = {
                        ...editingItem.data,
                        pathway_id: editingItem.data.pathway_id || 'enviro',
                        title: editingItem.data.title || '',
                        organization: editingItem.data.organization || '',
                        location: editingItem.data.location || '',
                        job_type: editingItem.data.job_type || 'Full-time',
                        apply_url: editingItem.data.apply_url || '',
                        note: editingItem.data.note || ''
                      };
                      const savedJob = await upsertWorkforceJob(payload);
                      if (editingItem.data.id) {
                        setJobs(prev => prev.map(j => j.id === savedJob.id ? savedJob : j));
                      } else {
                        setJobs(prev => [savedJob, ...prev]);
                      }
                      setEditingItem(null);
                    } catch (err: any) {
                      console.error("Save job error:", err);
                      setEditingItem({ ...editingItem, error: err.message || String(err) });
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (editingItem.kind === 'external_board') {
                    setIsSaving(true);
                    try {
                      const payload = {
                        ...editingItem.data,
                        pathway_id: 'all',
                        label: editingItem.data.label || '',
                        url: editingItem.data.url || '',
                        description: editingItem.data.description || ''
                      };
                      const savedBoard = await upsertExternalBoard(payload);
                      if (editingItem.data.id) {
                        setExternalBoards(prev => prev.map(b => b.id === savedBoard.id ? savedBoard : b));
                      } else {
                        setExternalBoards(prev => [...prev, savedBoard]);
                      }
                      setEditingItem(null);
                    } catch (err: any) {
                      console.error("Save external board error:", err);
                      setEditingItem({ ...editingItem, error: err.message || String(err) });
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (editingItem.kind === 'suggestion') {
                    setIsSaving(true);
                    try {
                      const payload = {
                        title: editingItem.data.title || '',
                        pathway_id: editingItem.data.pathway_id || 'creator',
                        stop_id: editingItem.data.stop_id || 'terrain',
                        type: editingItem.data.type || 'Article',
                        subtitle: editingItem.data.subtitle || 'anonymous',
                        sources: editingItem.data.sources || []
                      };
                      await updateSuggestion(editingItem.data.id, payload);
                      // Refresh pending suggestions
                      const data = await fetchPendingSuggestions();
                      setPendingSuggestions(data);
                      setEditingItem(null);
                    } catch (err: any) {
                      console.error("Save suggestion error:", err);
                      setEditingItem({ ...editingItem, error: err.message || String(err) });
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 16px', background: editingItem.kind === 'meta' ? '#ff6a2e' : (editingItem.kind === 'job' ? '#ffdd2e' : '#14f0c8'), color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', opacity: isSaving ? 0.5 : 1 }}>{isSaving ? 'Saving...' : 'Save ▸ Publish'}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {deletingItem && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,28,72,.85)', backdropFilter: 'blur(4px)', zIndex: 100 }}></div>
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: '#163a82', border: '5px solid #1c1526', boxShadow: '12px 12px 0 rgba(18,12,26,.5)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: '#ff6b6b', lineHeight: 1.5, marginBottom: '20px' }}>
                RETIRE ENTRY?
              </div>
              <p style={{ fontSize: '18px', lineHeight: 1.4, color: 'var(--paper)', margin: '0 0 24px' }}>
                Are you sure you want to retire <strong style={{ color: '#ffdd2e' }}>"{deletingItem.title}"</strong>? This will permanently remove it from the database.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                {(deletingItem as any).error && <span style={{ color: '#ff6b6b', fontFamily: "'VT323', monospace", fontSize: '15px' }}>{(deletingItem as any).error}</span>}
                <button type="button" disabled={isDeleting} onClick={() => setDeletingItem(null)} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 15px', background: '#2656a4', color: 'var(--paper)', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', opacity: isDeleting ? 0.5 : 1 }}>Cancel</button>
                <button type="button" disabled={isDeleting} onClick={async () => {
                  setIsDeleting(true);
                  try {
                    if ((deletingItem as any).kind === 'job') {
                      await deleteWorkforceJob(deletingItem.id);
                      setJobs(prev => prev.filter(j => j.id !== deletingItem.id));
                    } else if ((deletingItem as any).kind === 'external_board') {
                      await deleteExternalBoard(deletingItem.id);
                      setExternalBoards(prev => prev.filter(b => b.id !== deletingItem.id));
                    } else {
                      await deleteWorkforceEntry(deletingItem.id);
                      setPublishedEntries(prev => prev.filter(entry => entry.id !== deletingItem.id));
                    }
                    setDeletingItem(null);
                  } catch (err: any) {
                    console.error('Failed to delete entry', err);
                    setDeletingItem({ ...deletingItem, error: err.message || String(err) });
                  } finally {
                    setIsDeleting(false);
                  }
                }} style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '11px 16px', background: '#ff6b6b', color: '#10285e', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', border: '3px solid #1c1526', boxShadow: '3px 3px 0 rgba(18,12,26,.4)', borderRadius: '7px', opacity: isDeleting ? 0.5 : 1 }}>{isDeleting ? 'Retiring...' : 'Yes, Retire'}</button>
              </div>
            </div>
          </div>
        </>

      )}

    </>
  );
}
