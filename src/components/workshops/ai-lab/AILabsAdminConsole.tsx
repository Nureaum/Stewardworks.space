'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getPrinciples,
  createPrinciple,
  updatePrinciple,
  deletePrinciple,
  getPlatforms,
  createPlatform,
  deletePlatform,
  getApprovalsQueue,
  reviewApprovalItem
} from '@/app/actions/workshops/admin';
import {
  getShowcaseItems,
  addShowcaseItem,
  deleteShowcaseItem
} from '@/app/actions/workshops/showcase';
import {
  approveShowcaseEngagement,
  removeShowcaseEngagement
} from '@/app/actions/workshops/engagement';

interface AILabsAdminConsoleProps {
  cohortId?: string;
}

type AdminView = 'overview' | 'principles' | 'platforms' | 'approvals';

interface Principle {
  id: string;
  name: string;
  description?: string | null;
  example?: string | null;
}

interface Platform {
  id: string;
  name: string;
  url: string;
  is_default: boolean;
}

interface ApprovalItem {
  id: string;
  kind: 'generation' | 'bookmark' | 'prompt' | 'note' | 'deliverable';
  title: string;
  url?: string;
  source?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  content?: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function AILabsAdminConsole({ cohortId }: AILabsAdminConsoleProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [loading, setLoading] = useState(true);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  
  const [principlesData, setPrinciplesData] = useState<Principle[]>([]);
  const [platformsData, setPlatformsData] = useState<Platform[]>([]);
  const [approvalsData, setApprovalsData] = useState<ApprovalItem[]>([]);
  const [showcaseData, setShowcaseData] = useState<any[]>([]);

  const [expandedPrinciple, setExpandedPrinciple] = useState<string | null>(null);
  
  const [newPrincipleName, setNewPrincipleName] = useState('');
  const [newPrincipleDesc, setNewPrincipleDesc] = useState('');
  const [newPrincipleExample, setNewPrincipleExample] = useState('');
  
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');

  const [approvalFilter, setApprovalFilter] = useState<'all' | 'deliverables' | 'bookmarks' | 'prompts'>('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'pending' | 'history'>('pending');
  const [approvalView, setApprovalView] = useState<'log' | 'steward'>('log');
  const [expandedStewards, setExpandedStewards] = useState<Record<string, boolean>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const toggleSteward = (id: string) => {
    setExpandedStewards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (cohortId) {
      loadData(approvalStatusFilter);
    }
  }, [cohortId, approvalStatusFilter]);

  async function loadData(statusFilter: 'pending' | 'history' = 'pending') {
    setLoading(true);
    try {
      const [principles, platforms, approvals, showcase] = await Promise.all([
        getPrinciples(cohortId!).catch(e => { console.error(e); return []; }),
        getPlatforms(cohortId!).catch(e => { console.error(e); return []; }),
        getApprovalsQueue(cohortId!, 'all', statusFilter).catch(e => { console.error(e); return []; }),
        getShowcaseItems(cohortId!).catch(e => { console.error(e); return []; })
      ]);

      setPrinciplesData(principles || []);
      setPlatformsData(platforms || []);
      setApprovalsData(approvals || []);
      setShowcaseData(showcase || []);
      setNeedsReviewCount(approvals?.length || 0);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8b9d93', fontSize: 14 }}>
        Loading teacher console...
      </div>
    );
  }

  const navButtonStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    background: isActive ? 'rgba(116,185,152,.08)' : 'transparent',
    border: `2px solid ${isActive ? '#74b998' : '#2f3d36'}`,
    borderRadius: 7,
    padding: '11px 13px',
    cursor: 'pointer',
    fontSize: 14,
    color: isActive ? '#74b998' : '#8b9d93',
    boxShadow: isActive ? '0 0 12px rgba(116,185,152,.15)' : 'none',
  });

  const handleAddPrinciple = async () => {
    if (!newPrincipleName) {
      toast.error('Please enter a principle name', { position: 'bottom-center' });
      return;
    }
    
    try {
      await createPrinciple(cohortId!, {
        name: newPrincipleName,
        description: newPrincipleDesc || undefined,
        example: newPrincipleExample || undefined
      });
      
      setNewPrincipleName('');
      setNewPrincipleDesc('');
      setNewPrincipleExample('');
      
      await loadData();
      toast.success('Principle added successfully', { position: 'bottom-center' });
    } catch (error) {
      console.error('Error adding principle:', error);
      toast.error('Failed to add principle', { position: 'bottom-center' });
    }
  };

  const handleUpdatePrinciple = async (id: string, field: 'name' | 'description' | 'example', value: string) => {
    try {
      await updatePrinciple(id, { [field]: value });
      setPrinciplesData(principlesData.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ));
    } catch (error) {
      console.error('Error updating principle:', error);
      toast.error('Failed to update principle', { position: 'bottom-center' });
    }
  };

  const handleRemovePrinciple = async (id: string) => {
    if (!confirm('Remove this principle?')) return;
    
    try {
      await deletePrinciple(id);
      setPrinciplesData(principlesData.filter(p => p.id !== id));
      setExpandedPrinciple(null);
      toast.success('Principle removed', { position: 'bottom-center' });
    } catch (error) {
      console.error('Error removing principle:', error);
      toast.error('Failed to remove principle', { position: 'bottom-center' });
    }
  };

  const handleAddPlatform = async () => {
    if (!newPlatformName || !newPlatformUrl) {
      toast.error('Please enter both platform name and URL', { position: 'bottom-center' });
      return;
    }
    
    let url = newPlatformUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      await createPlatform(cohortId!, {
        name: newPlatformName,
        url
      });
      
      setNewPlatformName('');
      setNewPlatformUrl('');
      
      await loadData();
      toast.success('Platform added successfully', { position: 'bottom-center' });
    } catch (error) {
      console.error('Error adding platform:', error);
      toast.error('Failed to add platform', { position: 'bottom-center' });
    }
  };

  const handleRemovePlatform = async (id: string) => {
    const platform = platformsData.find(p => p.id === id);
    if (platform?.is_default) {
      toast.error('Cannot remove the default platform (Eden.art)', { position: 'bottom-center' });
      return;
    }
    
    if (platformsData.length <= 1) {
      toast.error('Keep at least one platform embedded', { position: 'bottom-center' });
      return;
    }
    
    try {
      await deletePlatform(id);
      setPlatformsData(platformsData.filter(p => p.id !== id));
      toast.success('Platform removed', { position: 'bottom-center' });
    } catch (error) {
      console.error('Error removing platform:', error);
      toast.error('Failed to remove platform', { position: 'bottom-center' });
    }
  };

  const handleApprove = async (id: string, kind: string) => {
    try {
      await reviewApprovalItem(id, kind, 'approve', reviewNotes[id]);
      setReviewNotes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadData(approvalStatusFilter);
      toast.success('Item approved', { position: 'bottom-center' });
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve', { position: 'bottom-center' });
    }
  };

  const handleReject = async (itemId: string, kind: string) => {
    try {
      await reviewApprovalItem(itemId, kind as any, 'reject', reviewNotes[itemId]);
      setReviewNotes(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      await loadData(approvalStatusFilter);
      toast.success('Item returned to student', { position: 'bottom-center' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject item', { position: 'bottom-center' });
    }
  };

  const handleAddToShowcase = async (item: ApprovalItem) => {
    try {
      if (item.kind === 'generation') {
        // For pending items, approve them first before adding to showcase
        if (item.status === 'pending') {
          await reviewApprovalItem(item.id, item.kind, 'approve', reviewNotes[item.id]);
        }
        // Then set showcaseVisible to true
        await approveShowcaseEngagement(item.id);
        await loadData(approvalStatusFilter);
        toast.success('Added to showcase', { position: 'bottom-center' });
        return;
      }
      
      await addShowcaseItem(cohortId!, {
        title: item.title,
        author: item.profile.full_name || item.profile.email,
        type: item.kind as any,
        url: item.url || ''
      });
      const updated = await getShowcaseItems(cohortId!);
      setShowcaseData(updated || []);
      toast.success('Added to showcase', { position: 'bottom-center' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add to showcase', { position: 'bottom-center' });
    }
  };

  const handleRemoveFromShowcase = async (item: ApprovalItem) => {
    try {
      if (item.kind === 'generation') {
        await removeShowcaseEngagement(item.id);
        await loadData(approvalStatusFilter);
        toast.success('Removed from showcase', { position: 'bottom-center' });
        return;
      }
      
      const sItem = showcaseData.find(s => s.url === item.url);
      if (!sItem) return;
      await deleteShowcaseItem(sItem.id);
      const updated = await getShowcaseItems(cohortId!);
      setShowcaseData(updated || []);
      toast.success('Removed from showcase', { position: 'bottom-center' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove from showcase', { position: 'bottom-center' });
    }
  };

  const isInShowcase = (item: ApprovalItem) => {
    if (item.kind === 'generation') {
      try {
        const data = JSON.parse(item.content || '{}');
        // Only consider it "in showcase" if showcaseVisible is true AND status is approved
        return data.showcaseVisible === true && item.status === 'approved';
      } catch (e) {
        return false;
      }
    }
    return item.url ? showcaseData.some(s => s.url === item.url) : false;
  };

  const renderApprovalItem = (item: ApprovalItem) => {
    const rawText = item.content || '';
    
    // Parse JSON content to check for showcaseRequested field
    let isShowcaseRequested = false;
    let principleName = '';
    
    if (item.kind === 'generation') {
      try {
        const data = JSON.parse(rawText);
        isShowcaseRequested = data.showcaseRequested === true;
      } catch (e) {
        // Fallback to text marker for legacy data
        isShowcaseRequested = rawText.includes('[SHOWCASE_REQUESTED]');
      }
    } else {
      // For non-generation items, check for text marker
      isShowcaseRequested = rawText.includes('[SHOWCASE_REQUESTED]');
    }
    
    let cleanText = rawText.replace('[SHOWCASE_REQUESTED]', '').trim();
    const principleMatch = cleanText.match(/Selected Principle ID:\s*([a-zA-Z0-9-]+)/);
    if (principleMatch) {
      const pId = principleMatch[1];
      const found = principlesData?.find(p => p.id === pId);
      principleName = found ? found.name : `Principle ${pId.slice(0, 4)}`;
    }

    const kindLabel = item.kind === 'generation' || item.kind === 'deliverable' ? (item.kind === 'generation' ? 'MEDIA' : 'DELIVERABLE') : item.kind === 'bookmark' ? 'BOOKMARK' : 'PROMPT';
    const authorName = item.profile.full_name || item.profile.email;
    const sourceLabel = item.kind === 'generation' ? 'EDEN' : 'OTHER';

    return (
      <div
        key={item.id}
        style={{
          border: '1px solid #2f3d36',
          borderRadius: 6,
          background: '#0e1512',
          padding: '12px 14px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          
          {/* Left Side */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span
              className="font-pixel"
              style={{
                fontSize: 8,
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid #77b78d',
                color: '#77b78d',
                letterSpacing: 1
              }}
            >
              {kindLabel}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 16, color: '#dbe4de', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.title || 'Untitled'}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: 4, width: 20, height: 20, textDecoration: 'none' }}>
                    <span style={{ color: '#4dffa0', fontSize: 12 }}>↗</span>
                  </a>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#8b9d93' }}>
                {authorName}
                {principleName && <> · <span style={{ color: '#74b998' }}>◈ {principleName}</span></>}
                {' · '}{sourceLabel}
              </div>
            </div>
          </div>

          {/* Right Side Badges */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {isShowcaseRequested && item.status === 'pending' && (
              <span className="font-pixel" style={{ fontSize: 7, padding: '5px 10px', borderRadius: 20, background: '#ff5fd2', color: '#101613', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10 }}>↺</span> WANTS SHOWCASE
              </span>
            )}
            {isInShowcase(item) && item.status === 'approved' && (
              <span className="font-pixel" style={{ fontSize: 7, padding: '5px 10px', borderRadius: 20, background: '#ff5fd2', color: '#101613', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10 }}>★</span> IN SHOWCASE
              </span>
            )}
            <span
              className="font-pixel"
              style={{
                fontSize: 7,
                padding: '5px 10px',
                borderRadius: 20,
                border: `1px solid ${item.status === 'approved' ? '#74b998' : item.status === 'rejected' ? '#ff5f5f' : '#c9a55b'}`,
                color: item.status === 'approved' ? '#74b998' : item.status === 'rejected' ? '#ff5f5f' : '#c9a55b',
                letterSpacing: 1
              }}
            >
              {item.status === 'approved' ? (item.kind === 'generation' ? 'ACCEPTED' : 'APPROVED') : item.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content/URL Display */}
        {item.url && (
          <div style={{ 
            marginTop: 12,
            padding: '12px',
            background: 'rgba(0,0,0,.2)',
            borderRadius: 6,
            border: '1px solid #2f3d36'
          }}>
            {(item.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || item.url.includes('/public/content-uploads/') || item.url.includes('/storage/v1/object/public/')) ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'block', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                >
                  <img 
                    src={item.url} 
                    alt="Submission" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 240, 
                      borderRadius: 6, 
                      objectFit: 'contain', 
                      border: '1px solid #2f3d36', 
                      background: 'rgba(0,0,0,.3)' 
                    }} 
                  />
                  <div 
                    className="font-pixel" 
                    style={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      background: 'rgba(0,0,0,.7)', 
                      color: '#4dffa0', 
                      border: '1px solid #4dffa0', 
                      padding: '4px 6px', 
                      borderRadius: 4, 
                      fontSize: 8, 
                      letterSpacing: 1 
                    }}
                  >
                    ↗ OPEN
                  </div>
                </a>
              </div>
            ) : (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  color: '#4dffa0', 
                  textDecoration: 'underline',
                  fontSize: 14,
                  wordBreak: 'break-all',
                  lineHeight: 1.4
                }}
              >
                {item.url} ↗
              </a>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        {item.status === 'pending' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 14 }}>
            <button
              onClick={() => handleApprove(item.id, item.kind)}
              className="font-pixel"
              style={{
                fontSize: 7,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                background: '#74b998',
                color: '#101613',
                letterSpacing: 1
              }}
            >
              ✓ {item.kind === 'deliverable' ? 'APPROVE' : item.kind === 'generation' ? 'ACCEPT' : 'APPROVE'}
            </button>
            
            {isShowcaseRequested && !isInShowcase(item) && (
              <button
                onClick={() => handleAddToShowcase(item)}
                className="font-pixel"
                style={{
                  fontSize: 7,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: '#ff5fd2',
                  color: '#101613',
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: 10 }}>★</span> ADD TO SHOWCASE
              </button>
            )}

            <button
              onClick={() => handleReject(item.id, item.kind)}
              className="font-pixel"
              style={{
                fontSize: 7,
                padding: '8px 12px',
                border: '1px solid #c9a55b',
                borderRadius: 5,
                cursor: 'pointer',
                background: 'transparent',
                color: '#c9a55b',
                letterSpacing: 1
              }}
            >
              ✕ RETURN
            </button>

            <input 
              type="text" 
              placeholder="Add a note for the student..." 
              value={reviewNotes[item.id] || ''}
              onChange={(e) => setReviewNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
              style={{ 
                flex: 1, 
                minWidth: 200, 
                background: 'transparent', 
                border: '1px solid #2f3d36', 
                borderRadius: 5, 
                padding: '6px 12px', 
                color: '#dbe4de', 
                fontSize: 13, 
                fontFamily: 'inherit',
                outline: 'none'
              }} 
            />
          </div>
        )}

        {item.status === 'approved' && (item.kind === 'generation' || item.kind === 'deliverable') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 14 }}>
            {isInShowcase(item) ? (
              <button
                onClick={() => handleRemoveFromShowcase(item)}
                className="font-pixel"
                style={{ fontSize: 7, padding: '7px 11px', border: '1px solid #c9a55b', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: '#c9a55b' }}
              >
                ✕ PULL FROM SHOWCASE
              </button>
            ) : (
              <button
                onClick={() => handleAddToShowcase(item)}
                className="font-pixel"
                style={{ fontSize: 7, padding: '7px 11px', border: '1px solid #c9a55b', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: '#c9a55b' }}
              >
                ✓ ADD TO SHOWCASE
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: 1160,
      margin: '0 auto',
      '--ng': '#74b998',
      '--pk': '#ff5fd2',
      '--sy': '#c9a55b',
      '--cy': '#84a9c4',
      '--tx': '#dbe4de',
      '--mu': '#8b9d93',
      '--ln': '#2f3d36',
      '--pn': '#151d19',
      '--bg': '#0e1512',
    } as any}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between', border: '2px solid #2f3d36', borderRadius: 10, padding: '15px 17px', background: '#131a17', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <button
            onClick={() => router.push('/hub/pilot-workshops')}
            style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: '#74b998', textDecoration: 'none', background: 'transparent', border: '2px solid #2f3d36', borderRadius: 7, padding: '7px 13px', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            ◄ BACK TO WORKSHOP
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="font-pixel" style={{ fontSize: 'clamp(10px,1.8vw,13px)', color: '#dbe4de' }}>⚙ TEACHER CONSOLE</div>
            <div style={{ fontSize: 16, color: '#8b9d93', marginTop: 8 }}>Review queue · principles · approvals</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <div className="font-pixel" style={{ fontSize: 14, color: '#c9a55b' }}>{needsReviewCount}</div>
          <div style={{ fontSize: 13, color: '#8b9d93', marginTop: 5 }}>PENDING</div>
        </div>
      </div>

      {/* Tabbed Console Layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        
        {/* Left Sidebar Nav */}
        <aside style={{ flex: '0 0 200px', width: 200, minWidth: 200, border: '2px solid #28432f', borderRadius: 11, background: 'rgba(0,0,0,.22)', padding: 12 }}>
          <div className="font-pixel" style={{ fontSize: 8, color: '#77b78d', letterSpacing: 1, margin: '4px 4px 12px' }}>◆ CONSOLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setActiveView('overview')} style={navButtonStyle(activeView === 'overview')}>
              <span>● REVIEW QUEUE</span>
              {activeView === 'overview' && <span className="font-pixel" style={{ fontSize: 9, background: 'rgba(201,165,91,.15)', color: '#c9a55b', padding: '3px 7px', borderRadius: 12 }}>{needsReviewCount}</span>}
            </button>
            <button onClick={() => setActiveView('principles')} style={navButtonStyle(activeView === 'principles')}>
              <span>◉ PRINCIPLES</span>
            </button>
            {/* Platforms tab hidden until workshop_platforms table is created in database */}
            {/* <button onClick={() => setActiveView('platforms')} style={navButtonStyle(activeView === 'platforms')}>
              <span>❖ PLATFORMS</span>
            </button> */}
            <button onClick={() => setActiveView('approvals')} style={navButtonStyle(activeView === 'approvals')}>
              <span>✓ APPROVALS</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* REVIEW QUEUE (Overview) */}
          {activeView === 'overview' && (
            <>
              <div style={{ border: '2px solid #2f3d36', borderRadius: 11, background: '#131a17', padding: '16px 17px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="font-pixel" style={{ fontSize: 9, color: '#dbe4de', letterSpacing: 1 }}>◆ REVIEW QUEUE</div>
                  <div style={{ fontSize: 15, color: '#8b9d93' }}><span style={{ color: '#c9a55b' }}>{needsReviewCount}</span> items awaiting you</div>
                </div>
                <div style={{ fontSize: 15, color: '#8b9d93', lineHeight: 1.45, marginBottom: 15, maxWidth: 660 }}>
                  A calm read on what students have submitted. Nothing earns progress until you approve it here. Tap a tile to open the full approvals queue, pre-filtered.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 11 }}>
                  {[
                    { label: 'Deliverables', count: approvalsData.filter(a => a.kind === 'generation').length, color: '#ff5fd2', filter: 'deliverables' },
                    { label: 'Bookmarks', count: approvalsData.filter(a => a.kind === 'bookmark').length, color: '#84a9c4', filter: 'bookmarks' },
                    { label: 'Notes', count: approvalsData.filter(a => a.kind === 'note').length, color: '#c9a55b', filter: 'all' },
                    { label: 'Prompts', count: approvalsData.filter(a => a.kind === 'prompt').length, color: '#74b998', filter: 'prompts' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setApprovalFilter(item.filter as any); setActiveView('approvals'); }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 7,
                        border: `2px solid #2f3d36`,
                        borderRadius: 8,
                        background: 'rgba(0,0,0,.3)',
                        padding: '13px 15px',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                      }}
                    >
                      <span className="font-pixel" style={{ fontSize: 18, color: item.color }}>{item.count}</span>
                      <span style={{ fontSize: 15, color: '#c6d3cb', lineHeight: 1.3 }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ border: '2px solid #2f3d36', borderRadius: 11, background: '#131a17', padding: '16px 17px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginBottom: 13 }}>
                  <div className="font-pixel" style={{ fontSize: 8, color: '#8b9d93', letterSpacing: 1 }}>◇ NEEDS ATTENTION</div>
                  <button
                    onClick={() => setActiveView('approvals')}
                    style={{ fontFamily: "'VT323'", fontSize: 15, letterSpacing: '.5px', color: '#74b998', background: 'transparent', border: '2px solid #2f3d36', borderRadius: 6, padding: '5px 13px', cursor: 'pointer' }}
                  >
                    OPEN APPROVALS ▸
                  </button>
                </div>
                {approvalsData.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {approvalsData.slice(0, 5).map((a) => (
                      <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9, border: '2px solid #2f3d36', borderLeft: '4px solid #3a4d43', borderRadius: 8, background: '#101712', padding: '10px 12px' }}>
                        <span
                          className="font-pixel"
                          style={{
                            fontSize: 7,
                            padding: '5px 8px',
                            borderRadius: 5,
                            background: a.kind === 'generation' ? 'rgba(201,139,173,.15)' : a.kind === 'bookmark' ? 'rgba(132,169,196,.15)' : 'rgba(201,165,91,.15)',
                            color: a.kind === 'generation' ? '#ff5fd2' : a.kind === 'bookmark' ? '#84a9c4' : '#c9a55b',
                            border: `1px solid ${a.kind === 'generation' ? '#ff5fd2' : a.kind === 'bookmark' ? '#84a9c4' : '#c9a55b'}`
                          }}
                        >
                          {a.kind === 'generation' ? 'DELIVERABLE' : a.kind === 'bookmark' ? 'BOOKMARK' : a.kind === 'prompt' ? 'PROMPT' : 'NOTE'}
                        </span>
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <div style={{ fontSize: 16, color: '#dbe4de', lineHeight: 1.25 }}>{a.title || 'Untitled'}</div>
                          <div style={{ fontSize: 13, color: '#8b9d93', marginTop: 2 }}>{a.profile.full_name || a.profile.email} · {new Date(a.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className="font-pixel" style={{ fontSize: 7, padding: '5px 8px', borderRadius: 5, background: 'rgba(201,165,91,.15)', color: '#c9a55b' }}>PENDING</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #2f3d36', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: '#8b9d93' }}>
                    All caught up — nothing pending.
                  </div>
                )}
              </div>
            </>
          )}

          {/* PRINCIPLES */}
          {activeView === 'principles' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', margin: '0 2px 10px' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#77b78d', letterSpacing: 1 }}>◆ STEWARD PRINCIPLE LIBRARY</div>
                <div style={{ fontSize: 13, color: '#77b78d' }}>{principlesData.length} available · shared by the workshop map &amp; the lab tracker</div>
              </div>
              <div style={{ border: '2px solid #28432f', borderRadius: 9, background: '#14211b', padding: '14px 15px' }}>
                <div style={{ fontSize: 14, color: '#77b78d', lineHeight: 1.4, marginBottom: 12, maxWidth: 720 }}>
                  Each principle carries a <span style={{ color: '#d6ffe0' }}>description</span> and an <span style={{ color: '#d6ffe0' }}>example</span> — the same text the lab mascot reads out as tips. Click a row to expand and edit.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {principlesData.map((principle) => (
                    <div
                      key={principle.id}
                      style={{
                        border: `2px solid ${expandedPrinciple === principle.id ? '#ff5fd2' : '#28432f'}`,
                        borderRadius: 8,
                        background: expandedPrinciple === principle.id ? 'rgba(255,95,210,.05)' : 'rgba(0,0,0,.25)',
                      }}
                    >
                      <button
                        onClick={() => setExpandedPrinciple(expandedPrinciple === principle.id ? null : principle.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11,
                          background: 'transparent',
                          border: 'none',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          textAlign: 'left' as const,
                        }}
                      >
                        <span className="font-pixel" style={{ fontSize: 9, color: '#ff5fd2', flex: 'none' }}>◈</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 17, color: '#d6ffe0', lineHeight: 1.25 }}>{principle.name}</span>
                        <span className="font-pixel" style={{ fontSize: 10, color: expandedPrinciple === principle.id ? '#ff5fd2' : '#77b78d', transform: expandedPrinciple === principle.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▸</span>
                      </button>
                      {expandedPrinciple === principle.id && (
                        <div style={{ padding: '2px 13px 14px', display: 'flex', flexDirection: 'column', gap: 11, borderTop: '1px dashed #28432f' }}>
                          <div>
                            <div className="font-pixel" style={{ fontSize: 6, color: '#77b78d', margin: '11px 0 6px' }}>NAME</div>
                            <input
                              type="text"
                              value={principle.name}
                              onChange={(e) => handleUpdatePrinciple(principle.id, 'name', e.target.value)}
                              style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 16, padding: '9px 11px' }}
                            />
                          </div>
                          <div>
                            <div className="font-pixel" style={{ fontSize: 6, color: '#45d6ff', marginBottom: 6 }}>DESCRIPTION</div>
                            <textarea
                              value={principle.description || ''}
                              onChange={(e) => handleUpdatePrinciple(principle.id, 'description', e.target.value)}
                              rows={2}
                              placeholder="What this principle means, in a sentence or two…"
                              style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 15, padding: '9px 11px', lineHeight: 1.4, resize: 'vertical' as const }}
                            />
                          </div>
                          <div>
                            <div className="font-pixel" style={{ fontSize: 6, color: '#ffd23f', marginBottom: 6 }}>EXAMPLE</div>
                            <textarea
                              value={principle.example || ''}
                              onChange={(e) => handleUpdatePrinciple(principle.id, 'example', e.target.value)}
                              rows={2}
                              placeholder="A concrete example of it in practice…"
                              style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 15, padding: '9px 11px', lineHeight: 1.4, resize: 'vertical' as const }}
                            />
                          </div>
                          <button
                            onClick={() => handleRemovePrinciple(principle.id)}
                            className="font-pixel"
                            style={{ alignSelf: 'flex-start', fontSize: 7, color: '#e06a5a', background: 'none', border: '2px solid #7a3a34', borderRadius: 5, padding: '8px 11px', cursor: 'pointer' }}
                          >
                            ✕ REMOVE PRINCIPLE
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #28432f', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: '#4dffa0' }}>＋ ADD A NEW PRINCIPLE</div>
                  <input
                    type="text"
                    value={newPrincipleName}
                    onChange={(e) => setNewPrincipleName(e.target.value)}
                    placeholder="Principle name…"
                    style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 16, padding: '10px 11px' }}
                  />
                  <input
                    type="text"
                    value={newPrincipleDesc}
                    onChange={(e) => setNewPrincipleDesc(e.target.value)}
                    placeholder="Short description…"
                    style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 15, padding: '9px 11px' }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newPrincipleExample}
                      onChange={(e) => setNewPrincipleExample(e.target.value)}
                      placeholder="Example in practice…"
                      style={{ flex: 1, minWidth: 200, background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 15, padding: '9px 11px' }}
                    />
                    <button
                      onClick={handleAddPrinciple}
                      className="font-pixel"
                      style={{ fontSize: 8, color: '#0e1512', background: '#4dffa0', border: 'none', borderRadius: 5, padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ＋ ADD
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PLATFORMS */}
          {activeView === 'platforms' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', margin: '0 2px 10px' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#77b78d', letterSpacing: 1 }}>◱ EMBEDDED PLATFORMS</div>
                <div style={{ fontSize: 13, color: '#77b78d' }}>Students switch between these in the Lab sandbox</div>
              </div>
              <div style={{ border: '2px solid #28432f', borderRadius: 9, background: '#14211b', padding: '14px 15px' }}>
                <div style={{ fontSize: 14, color: '#77b78d', lineHeight: 1.4, marginBottom: 12, maxWidth: 720 }}>
                  Eden.art ships as the default sandbox. Add any other AI tool with an embeddable URL — Figma, Google AI Studio, Claude, etc. — and it appears as an extra tab students can click to switch the live sandbox. Remove one to pull it from the Lab.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {platformsData.map((platform) => (
                    <div
                      key={platform.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        border: '2px solid #28432f',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,.22)',
                        padding: '11px 13px',
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5fd2', flex: 'none' }}></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, color: '#d6ffe0', lineHeight: 1.25 }}>{platform.name}</div>
                        <div style={{ fontSize: 13, color: '#77b78d', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {new URL(platform.url).hostname}
                        </div>
                      </div>
                      {!platform.is_default && (
                        <button
                          onClick={() => handleRemovePlatform(platform.id)}
                          className="font-pixel"
                          style={{ flex: 'none', fontSize: 7, color: '#e06a5a', background: 'none', border: '2px solid #7a3a34', borderRadius: 5, padding: '8px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          ✕ REMOVE
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #28432f', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: '#4dffa0' }}>＋ ADD A PLATFORM</div>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Platform name — e.g. Google AI Studio…"
                    style={{ width: '100%', background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 16, padding: '10px 11px' }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newPlatformUrl}
                      onChange={(e) => setNewPlatformUrl(e.target.value)}
                      placeholder="Embed URL — e.g. https://aistudio.google.com/"
                      style={{ flex: 1, minWidth: 220, background: '#08120d', border: '2px solid #28432f', borderRadius: 5, color: '#d6ffe0', fontSize: 15, padding: '9px 11px' }}
                    />
                    <button
                      onClick={handleAddPlatform}
                      className="font-pixel"
                      style={{ fontSize: 8, color: '#0e1512', background: '#4dffa0', border: 'none', borderRadius: 5, padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ＋ ADD
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: '#77b78d', lineHeight: 1.4 }}>
                    Note: some sites block embedding in an iframe (e.g. via X-Frame-Options) — if a tab shows blank, students can still use the ↗ open-in-new-tab link.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* APPROVALS */}
          {activeView === 'approvals' && (
            <div style={{ border: '2px solid #2f3d36', borderRadius: 11, background: '#131a17', padding: '16px 17px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-pixel" style={{ fontSize: 9, color: '#dbe4de', letterSpacing: 1 }}>✓ APPROVALS</div>
                  <div style={{ fontSize: 15, color: '#8b9d93', marginTop: 8, maxWidth: 540, lineHeight: 1.45 }}>
                    One queue over every submission — deliverables, media &amp; engagement. Read it as a <span style={{ color: '#dbe4de' }}>log</span> or by <span style={{ color: '#dbe4de' }}>steward</span>. Showcase requests ride along on each media item.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 3, border: '2px solid #2f3d36', borderRadius: 9, padding: 3, background: '#0f1512', flex: 'none' }}>
                    <button
                      onClick={() => setApprovalStatusFilter('pending')}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        padding: '8px 11px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: approvalStatusFilter === 'pending' ? 'rgba(255,255,255,.1)' : 'transparent',
                        color: approvalStatusFilter === 'pending' ? '#fff' : '#8b9d93',
                      }}
                    >
                      PENDING
                    </button>
                    <button
                      onClick={() => setApprovalStatusFilter('history')}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        padding: '8px 11px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: approvalStatusFilter === 'history' ? 'rgba(255,255,255,.1)' : 'transparent',
                        color: approvalStatusFilter === 'history' ? '#fff' : '#8b9d93',
                      }}
                    >
                      HISTORY
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 3, border: '2px solid #2f3d36', borderRadius: 9, padding: 3, background: '#0f1512', flex: 'none' }}>
                  <button
                    onClick={() => setApprovalView('log')}
                    className="font-pixel"
                    style={{
                      fontSize: 8,
                      padding: '8px 11px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: approvalView === 'log' ? '#2f3d36' : 'transparent',
                      color: approvalView === 'log' ? '#74b998' : '#8b9d93'
                    }}
                  >
                    ▤ LOG
                  </button>
                  <button
                    onClick={() => setApprovalView('steward')}
                    className="font-pixel"
                    style={{
                      fontSize: 8,
                      padding: '8px 11px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: approvalView === 'steward' ? '#2f3d36' : 'transparent',
                      color: approvalView === 'steward' ? '#74b998' : '#8b9d93'
                    }}
                  >
                    ◱ BY STEWARD
                  </button>
                </div>
              </div>
            </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', borderTop: '1px dashed #2f3d36', borderBottom: '1px dashed #2f3d36', padding: '12px 0' }}>
                {[
                  { value: 'all', label: 'All Items' },
                  { value: 'deliverables', label: 'Deliverables' },
                  { value: 'bookmarks', label: 'Bookmarks' },
                  { value: 'prompts', label: 'Prompts' }
                ].map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setApprovalFilter(chip.value as any)}
                    className="font-pixel"
                    style={{
                      fontSize: 7,
                      padding: '7px 10px',
                      border: `2px solid ${approvalFilter === chip.value ? '#74b998' : '#2f3d36'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: approvalFilter === chip.value ? 'rgba(116,185,152,.1)' : 'transparent',
                      color: approvalFilter === chip.value ? '#74b998' : '#8b9d93'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* LOG VIEW */}
              {approvalView === 'log' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(() => {
                    const filtered = approvalsData.filter(a => {
                      if (approvalFilter === 'all') return true;
                      if (approvalFilter === 'deliverables') return a.kind === 'generation' || a.kind === 'deliverable';
                      if (approvalFilter === 'bookmarks') return a.kind === 'bookmark';
                      if (approvalFilter === 'prompts') return a.kind === 'prompt';
                      return true;
                    });
                    
                    if (filtered.length === 0) {
                      return (
                        <div style={{ border: '2px dashed #2f3d36', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: '#8b9d93' }}>
                          {loading ? 'Loading approvals...' : 'Nothing matches this filter.'}
                        </div>
                      );
                    }

                    return filtered.map((item) => renderApprovalItem(item));
                  })()}
                </div>
              )}

              {/* BY STEWARD VIEW */}
              {approvalView === 'steward' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    const filtered = approvalsData.filter(a => {
                      if (approvalFilter === 'all') return true;
                      if (approvalFilter === 'deliverables') return a.kind === 'generation';
                      if (approvalFilter === 'bookmarks') return a.kind === 'bookmark';
                      if (approvalFilter === 'prompts') return a.kind === 'prompt';
                      return true;
                    });
                    
                    if (filtered.length === 0) {
                      return (
                        <div style={{ border: '2px dashed #2f3d36', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: '#8b9d93' }}>
                          {loading ? 'Loading approvals...' : 'Nothing matches this filter.'}
                        </div>
                      );
                    }

                    // Group by profile ID
                    const grouped: Record<string, ApprovalItem[]> = {};
                    filtered.forEach(a => {
                      if (!grouped[a.profile.id]) grouped[a.profile.id] = [];
                      grouped[a.profile.id].push(a);
                    });

                    return Object.entries(grouped).map(([profileId, items]) => {
                      const profile = items[0].profile;
                      const initials = (profile.full_name || profile.email).substring(0, 2).toUpperCase();
                      const isExpanded = !!expandedStewards[profileId];

                      return (
                        <div key={profileId} style={{ border: `2px solid ${isExpanded ? '#c9a55b' : '#2f3d36'}`, borderRadius: 10, background: '#131a17', overflow: 'hidden' }}>
                          <button
                            onClick={() => toggleSteward(profileId)}
                            style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, background: isExpanded ? 'rgba(201,165,91,.08)' : 'rgba(0,0,0,.25)', border: 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <span className="font-pixel" style={{ fontSize: 10, color: '#101613', background: '#dbe4de', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                              {initials}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 18, color: '#dbe4de', lineHeight: 1.2 }}>{profile.full_name || profile.email}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                <span className="font-pixel" style={{ fontSize: 7, padding: '4px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: '#8b9d93' }}>{items.length} TOTAL</span>
                              </div>
                            </div>
                            <span className="font-pixel" style={{ fontSize: 8, padding: '5px 8px', borderRadius: 12, background: approvalStatusFilter === 'pending' ? '#c9a55b' : '#74b998', color: '#101613' }}>
                              {items.length} {approvalStatusFilter === 'pending' ? 'PENDING' : 'REVIEWED'}
                            </span>
                            <span className="font-pixel" style={{ fontSize: 10, color: isExpanded ? '#c9a55b' : '#8b9d93', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                              ▸
                            </span>
                          </button>
                          {isExpanded && (
                            <div style={{ padding: '2px 12px 13px', display: 'flex', flexDirection: 'column', gap: 9, borderTop: '1px dashed #2f3d36' }}>
                              {items.map((item) => renderApprovalItem(item))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
