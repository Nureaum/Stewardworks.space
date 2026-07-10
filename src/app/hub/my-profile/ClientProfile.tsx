'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Check, ChevronDown, Camera, Loader2, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { fetchUserBookmarks } from '@/app/actions/bookmarks';
import { fetchAllWorkforceEntries } from '@/app/admin/workforce-pathways/actions';
import { PATHWAYS } from '@/data/workforce-content';

export default function ClientProfile({ initialProfile }: { initialProfile: any }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);

  // Bookmarks State
  const [bookmarkedResources, setBookmarkedResources] = useState<any[]>([]);
  const [bookmarkedWorkforce, setBookmarkedWorkforce] = useState<any[]>([]);
  const [isFetchingResources, setIsFetchingResources] = useState(false);

  // Inline Edit State
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState<'dream_job' | 'learning_style' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempMultiValue, setTempMultiValue] = useState<string[]>([]);
  const [otherValue, setOtherValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'dream_job' | 'learning_style' | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!(e.target as Element).closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const learningStyleOptions = [
    "Hands-on / learning by doing",
    "Visual (videos, images, diagrams)",
    "Reading and writing",
    "Group learning / discussion",
    "Self-paced / independent",
    "Other (please describe)"
  ];

  const dreamJobOptions = [
    "Environmental educator",
    "Media creator / storyteller",
    "Conservation or restoration worker",
    "Agriculture or water systems worker",
    "Environmental technician",
    "Community organizer",
    "Not sure yet",
    "Other (please describe)"
  ];

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    setIsFetchingResources(true);
    try {
      const libBookmarks = await fetchUserBookmarks('library');
      const wfBookmarks = await fetchUserBookmarks('workforce');
      
      const libIds = libBookmarks.map((b: any) => b.item_id);
      const wfIds = wfBookmarks.map((b: any) => b.item_id);
      
      // Load Library resources
      if (libIds.length === 0) {
        setBookmarkedResources([]);
      } else {
        const res = await fetch('/api/public/library-resources');
        const data = await res.json();
        if (data.resources) {
          const matched = data.resources.filter((r: any) => libIds.includes(r.id));
          setBookmarkedResources(matched);
        }
      }

      // Load Workforce resources
      if (wfIds.length === 0) {
        setBookmarkedWorkforce([]);
      } else {
        const allWf = await fetchAllWorkforceEntries();
        
        // Vault uses synthetic IDs, so we must reconstruct the possible items
        const allRecs: any[] = [];
        PATHWAYS.forEach(p => {
          (p.stops || []).forEach(sp => {
            const spEntries = allWf.filter((e: any) => e.pathway_id === p.id && e.stop_id === sp.slug);
            spEntries.forEach((e: any) => {
              (e.sources || []).forEach((x: any, i: number) => {
                const recId = e.id + "_" + i;
                allRecs.push({ id: recId, title: x[0], url: x[1], source: e.title });
              });
            });
            (sp.entries || []).forEach((e: any) => {
              (e.src || []).forEach((x: any, i: number) => {
                const recId = "cat_" + e.id + "_" + i;
                allRecs.push({ id: recId, title: x[0], url: x[1], source: e.t || "" });
              });
            });
          });
        });

        const matchedWf = allRecs.filter(r => wfIds.includes(r.id));
        setBookmarkedWorkforce(matchedWf);
      }
      
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsFetchingResources(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
      loadBookmarks();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user, loadProfile, loadBookmarks]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.publicUrl) setProfile((prev: any) => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (field: 'dream_job' | 'learning_style', currentValue: any) => {
    setEditingField(field);
    if (field === 'learning_style') {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      setTempMultiValue(currentArray);
      const hasCustom = currentArray.some((v: string) => !learningStyleOptions.includes(v));
      setOtherValue(hasCustom ? currentArray.find((v: string) => !learningStyleOptions.includes(v)) || '' : '');
    } else {
      let val = currentValue || '';
      if (val && !dreamJobOptions.includes(val)) {
        setTempValue("Other (please describe)");
        setOtherValue(val);
      } else {
        setTempValue(val);
        setOtherValue('');
      }
    }
  };

  const handleSaveField = async () => {
    if (!editingField) return;
    setIsSaving(true);
    let updateValue: any;
    if (editingField === 'learning_style') {
      if (tempMultiValue.includes("Other (please describe)") && otherValue) {
        updateValue = tempMultiValue.filter(v => v !== "Other (please describe)").concat([otherValue]);
      } else {
        updateValue = tempMultiValue;
      }
    } else {
      updateValue = tempValue === "Other (please describe)" ? otherValue : tempValue;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: updateValue }),
      });
      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, [editingField!]: updateValue }));
        setEditingField(null);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMultiSelectToggle = (option: string) => {
    if (tempMultiValue.includes(option)) setTempMultiValue(tempMultiValue.filter(v => v !== option));
    else setTempMultiValue([...tempMultiValue, option]);
  };

  const handleCustomSelect = async (val: string, field: 'dream_job' | 'learning_style') => {
    setOpenDropdown(null);
    if (val === "Other (please describe)") {
      setEditingField(field);
      setTempValue(val);
      const currentVal = field === 'learning_style' ? (profile?.learning_style?.[0] || '') : (profile?.dream_job || '');
      const options = field === 'learning_style' ? learningStyleOptions : dreamJobOptions;
      setOtherValue(options.includes(currentVal) ? '' : currentVal);
      return;
    }
    setIsSaving(true);
    const updateValue = field === 'learning_style' ? (val ? [val] : []) : val;
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updateValue }),
      });
      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, [field]: updateValue }));
        setEditingField(null);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentLearningStyles = Array.isArray(profile?.learning_style) ? profile.learning_style : [];
  const displayLearningStyle = currentLearningStyles.length > 0 
    ? currentLearningStyles.map((style: string) => learningStyleOptions.includes(style) ? style : `Other: ${style}`).join(', ')
    : 'Add learning style';

  const currentDreamJob = profile?.dream_job || "";
  const isDreamJobCustom = currentDreamJob && !dreamJobOptions.includes(currentDreamJob);
  const displayDreamJob = isDreamJobCustom ? `Other: ${currentDreamJob}` : (currentDreamJob || 'Add dream role');

  if (loading && !profile) return null;

  const domain = (u: string) => {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)', fontFamily: '"Exo", sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 26px 66px' }}>
        <button onClick={() => router.push('/hub')} style={{ background: '#21282E', border: 'none', borderRadius: '10px', padding: '9px 15px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', color: '#FEFAE0', marginBottom: '22px' }}>← Back to hub</button>

        {/* HEADER */}
        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', background: 'linear-gradient(135deg,#2c3742,#3f5460)', boxShadow: '0 18px 40px rgba(0,0,0,.22)', color: '#FEFAE0', marginBottom: '22px' }}>
          <div style={{ height: '78px', background: 'linear-gradient(120deg,#DB9B2F,#A27532 55%,#417C98)', opacity: .92 }}></div>
          <div style={{ padding: '0 30px 26px' }}>
            <div style={{ display: 'flex', gap: '22px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              <div style={{ position: 'relative', width: '112px', height: '112px', flex: 'none', borderRadius: '50%', boxShadow: '0 0 0 5px #2c3742, 0 10px 22px rgba(0,0,0,.35)', overflow: 'hidden', background: '#3f5460', marginTop: '-46px' }}>
                {isUploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <Loader2 size={32} className="animate-spin text-white" />
                  </div>
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'rgba(255,255,255,.05)' }}>
                    <div style={{ width: '32px', height: '24px', border: '2px solid rgba(255,255,255,.3)', borderRadius: '4px', position: 'relative', marginBottom: '4px' }}>
                      <div style={{ position: 'absolute', top: '4px', left: '4px', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,.3)' }}></div>
                      <div style={{ position: 'absolute', bottom: 0, left: '2px', right: '2px', height: '10px', borderTop: '2px solid rgba(255,255,255,.3)', transform: 'skewY(-15deg)', transformOrigin: 'bottom left' }}></div>
                    </div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.06em', color: 'rgba(255,255,255,.6)' }}>Add photo</div>
                  </div>
                )}
                <label style={{ position: 'absolute', inset: 0, cursor: 'pointer', opacity: 0 }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>

              <div style={{ flex: 1, minWidth: '220px', paddingBottom: '4px', marginTop: '16px' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1 }}>{profile?.full_name || user?.fullName || 'Steward Candidate'}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '9px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.04em', background: 'rgba(254,250,224,.14)', border: '1px solid rgba(254,250,224,.25)', padding: '5px 12px', borderRadius: '20px' }}>
                    🌱 {displayLearningStyle}
                  </span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.04em', background: 'rgba(254,250,224,.14)', border: '1px solid rgba(254,250,224,.25)', padding: '5px 12px', borderRadius: '20px' }}>
                    🎯 Dream role: {displayDreamJob}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', paddingBottom: '6px' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>CHIA PROGRESS</div>
                <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1 }}>25%</div>
              </div>
            </div>
                 {/* Onboarding Answers / Editing */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(206px,1fr))', gap: '11px', marginTop: '22px' }}>
              
              {/* Dummy Card 1 */}
              <div style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)', marginBottom: '5px' }}>WHY I'M HERE</div>
                <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>To turn my love of the Salton Sea into a career.</div>
              </div>

              {/* Learning Style Card */}
              <div style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>LEARNING STYLE</span>
                  {editingField !== 'learning_style' && (
                    <button onClick={() => startEditing('learning_style', profile?.learning_style)} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                {editingField === 'learning_style' ? (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', color: '#21282E' }}>
                    {learningStyleOptions.map(opt => {
                      const isSelected = tempMultiValue.includes(opt);
                      const isOther = opt === "Other (please describe)";
                      return (
                        <div key={opt} style={{ marginBottom: '6px' }}>
                          <button onClick={() => handleMultiSelectToggle(opt)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: isSelected ? 'rgba(65,124,152,.1)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Exo", sans-serif', fontSize: '13px', fontWeight: isSelected ? 700 : 400, color: '#21282E' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: isSelected ? '1.5px solid #417C98' : '1.5px solid #ccc', background: isSelected ? '#417C98' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <Check size={10} color="#fff" />}
                            </div>
                            {opt}
                          </button>
                          {isOther && isSelected && (
                            <input value={otherValue} onChange={e => setOtherValue(e.target.value)} placeholder="Please describe..." style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={handleSaveField} disabled={isSaving} style={{ flex: 1, background: '#417C98', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingField(null)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>{displayLearningStyle}</div>
                )}
              </div>

              {/* Dream Job Card */}
              <div className="custom-dropdown-container" style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>DREAM ROLE</span>
                  {editingField !== 'dream_job' && (
                    <button onClick={() => setOpenDropdown(openDropdown === 'dream_job' ? null : 'dream_job')} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                {editingField === 'dream_job' ? (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', color: '#21282E' }}>
                     <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Other (please describe)</div>
                     <input value={otherValue} onChange={e => setOtherValue(e.target.value)} autoFocus style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', marginBottom: '8px' }} />
                     <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveField} disabled={isSaving || !otherValue} style={{ flex: 1, background: '#417C98', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingField(null)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>{displayDreamJob}</div>
                )}
                {openDropdown === 'dream_job' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,.3)', marginTop: '4px', overflow: 'hidden', border: '1px solid #ccc' }}>
                    {dreamJobOptions.map(opt => (
                      <div key={opt} onClick={() => handleCustomSelect(opt, 'dream_job')} style={{ padding: '10px 14px', fontSize: '13px', color: '#21282E', borderBottom: '1px solid #eee', cursor: 'pointer' }} className="hover:bg-gray-100 font-medium">
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dummy Card 2 */}
              <div style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)', marginBottom: '5px' }}>COMMUNITY I SERVE</div>
                <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>North Shore & the Coachella Valley.</div>
              </div>

            </div>
          </div>
        </div>

        {/* ENGAGEMENT COUNTER */}
        <div style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.12)', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 12px 26px rgba(0,0,0,.08)', marginBottom: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.18em', color: '#8a5a2e' }}>REWARDS FEEDING YOUR CHIA</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#356074' }}>10% <span style={{ fontSize: '12px', fontWeight: 400, color: '#8a6a4a' }}>/ 25% cap</span></span>
          </div>
          <div style={{ height: '12px', background: 'rgba(33,40,46,.08)', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg,#417C98,#65a6c4)' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#356074' }}></span><span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Note created</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x1</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+1%</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#417C98' }}></span><span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Prompt saved</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x2</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+6%</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#A27532' }}></span><span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Bookmark saved</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x{bookmarkedResources.length}</span><span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{(bookmarkedResources.length * 1)}%</span></div>
          </div>
        </div>

        {/* BOOKMARKS */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>BOOKMARKS</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{bookmarkedResources.length}</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>saved from across the hub</span>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your shelf...</div>
        ) : bookmarkedResources.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            No bookmarks yet. Save resources from the <Link href="/hub/library" style={{ color: '#417C98', textDecoration: 'underline' }}>Library</Link>!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px', marginBottom: '30px' }}>
            {bookmarkedResources.map(b => (
              <div key={b.id} onClick={() => window.open(`/hub/library/${b.id}`, '_blank')} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#417C98', color: '#fff', padding: '3px 8px', borderRadius: '20px', marginBottom: '10px' }}>BOOKMARK</span>
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#7a5a3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.external_url || b.url)}</span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#417C98' }}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WORKFORCE PATHWAYS BOOKMARKS */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>WORKFORCE PATHWAYS</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{bookmarkedWorkforce.length}</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>saved from the vault</span>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your vault...</div>
        ) : bookmarkedWorkforce.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            No workforce entries saved yet. Visit <Link href="/hub/workforce-pathways" style={{ color: '#417C98', textDecoration: 'underline' }}>Workforce Pathways</Link>!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px', marginBottom: '30px' }}>
            {bookmarkedWorkforce.map(b => (
              <div key={b.id} onClick={() => window.open(`/hub/workforce-pathways`, '_blank')} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#2E5534', color: '#fff', padding: '3px 8px', borderRadius: '20px', marginBottom: '10px' }}>VAULT</span>
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#7a5a3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.url)} {b.source ? `- ${b.source}` : ''}</span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#2E5534' }}>View →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GENERATIONS */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>GENERATIONS</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>0</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>created in the AI Lab</span>
        </div>
        <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
          Coming soon
        </div>

        {/* NOTES & SAVED PROMPTS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>NOTES & SAVED PROMPTS</span>
            <span style={{ fontSize: '12px', color: '#8a6a4a' }}>from workshops & the AI Lab</span>
          </div>
          <button style={{ background: '#3f5460', color: '#FEFAE0', border: 'none', borderRadius: '9px', padding: '9px 16px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px' }}>+ New note</button>
        </div>
        <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px' }}>
          Coming soon
        </div>

      </div>
    </div>
  );
}
