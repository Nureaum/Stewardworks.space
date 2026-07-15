'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Check, ChevronDown, Camera, Loader2, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { fetchUserBookmarks } from '@/app/actions/bookmarks';
import { fetchAllWorkforceEntries, fetchUserPicks } from '@/app/admin/workforce-pathways/actions';
import { PATHWAYS, QUIZZES } from '@/data/workforce-content';
import { addEngagement } from '@/app/actions/workshops/engagement';
import RetroToast from '@/components/workshops/journey/RetroToast';

// Status pill mapping for deliverables (same as Portfolio)
const STATUS_PILL: Record<string, { label: string; color: string }> = {
  not_submitted: { label: 'NOT SUBMITTED', color: '#a493c9' },
  submitted:     { label: 'PENDING REVIEW', color: '#ffd23f' },
  approved:      { label: 'APPROVED · +25%', color: '#74f0a0' },
  rejected:      { label: 'NEEDS REVISION', color: '#ff8a4a' },
};

export default function ClientProfile({ 
  initialProfile, 
  chiaProgress = 0, 
  engagementProgress = 0,
  workshopDays = [],
  progressRows = [],
  submissions = [],
  activeCohortId: initialCohortId = null
}: { 
  initialProfile: any; 
  chiaProgress?: number; 
  engagementProgress?: number;
  workshopDays?: any[];
  progressRows?: any[];
  submissions?: any[];
  activeCohortId?: string | null;
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);

  // Bookmarks State
  const [bookmarkedResources, setBookmarkedResources] = useState<any[]>([]);
  const [bookmarkedWorkforce, setBookmarkedWorkforce] = useState<any[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<any[]>([]);
  const [bookmarkedEnvironmental, setBookmarkedEnvironmental] = useState<any[]>([]);
  const [isFetchingResources, setIsFetchingResources] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  // Engagement counts
  const [engagementCounts, setEngagementCounts] = useState({ bookmarks: 0, notes: 0, prompts: 0, generations: 0 });
  
  // Generations State
  const [generations, setGenerations] = useState<any[]>([]);
  
  // Notes & Prompts State
  const [notes, setNotes] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [activeCohortId, setActiveCohortId] = useState<string | null>(initialCohortId);
  const [toast, setToast] = useState<string | null>(null);

  // Inline Edit State
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState<'dream_job' | 'learning_style' | 'full_name' | 'why_here' | 'community_serve' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempMultiValue, setTempMultiValue] = useState<string[]>([]);
  const [otherValue, setOtherValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'dream_job' | 'learning_style' | null>(null);

  // Workforce Pathway Picks State
  const [workforcePicks, setWorkforcePicks] = useState<any[]>([]);
  const [loadingWorkforcePicks, setLoadingWorkforcePicks] = useState(false);
  
  // Certificate State - based on chia progress (100% = eligible)
  // Use local state to allow client-side refresh (same API as Hub page uses)
  const [actualChiaProgress, setActualChiaProgress] = useState(chiaProgress);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [workshopCharacter, setWorkshopCharacter] = useState<any>(null);
  const [certSettings, setCertSettings] = useState({
    certOrg: 'StewardWorks',
    certFacilitator: 'Marisol Vega',
    certFacTitle: 'Program Director',
    certSponsor: 'Dr. Jane Smith',
    certSponsorOrg: 'SDSU Research Foundation',
    certMessage: ''
  });
  
  // Certificate eligibility is based on 100% chia progress
  const certificateEligible = actualChiaProgress >= 100;

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
      
      // Also fetch engagement counts and generation engagements
      try {
        const progressRes = await fetch('/api/workshops/progress');
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          console.log('[ClientProfile] Raw API response:', progressData);
          const engagements = progressData.engagements || [];
          console.log('[ClientProfile] Engagements array:', engagements);
          
          // Get cohort ID from first engagement or fetch active cohort
          if (engagements.length > 0 && engagements[0].cohort_id) {
            setActiveCohortId(engagements[0].cohort_id);
          }
          
          // Count approved engagements by kind
          const approved = engagements.filter((e: any) => e.status === 'approved');
          const counts = {
            bookmarks: approved.filter((e: any) => e.kind === 'bookmark').length,
            notes: approved.filter((e: any) => e.kind === 'note').length,
            prompts: approved.filter((e: any) => e.kind === 'prompt').length,
            generations: approved.filter((e: any) => e.kind === 'generation').length
          };
          setEngagementCounts(counts);
          
          // Filter and set generation engagements
          const generationEngagements = engagements
            .filter((e: any) => e.kind === 'generation')
            .map((e: any) => {
              console.log('[ClientProfile] Generation engagement raw data:', {
                id: e.id,
                title: e.title,
                status: e.status,
                all_fields: e
              });
              return {
                id: e.id,
                title: e.title,
                url: e.url,
                source: e.source || 'AI Lab',
                status: e.status || 'pending',
                reviewNote: e.review_note || null,
                created_at: e.created_at
              };
            });
          console.log('[ClientProfile] Mapped generation engagements:', generationEngagements);
          setGenerations(generationEngagements);
          
          // Filter and set notes
          const noteEngagements = engagements
            .filter((e: any) => e.kind === 'note')
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              content: e.content || e.title,
              source: e.source || 'Workshops',
              status: e.status || 'pending',
              reviewNote: e.review_note || null,
              created_at: e.created_at
            }));
          setNotes(noteEngagements);
          
          // Filter and set prompts
          const promptEngagements = engagements
            .filter((e: any) => e.kind === 'prompt')
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              content: e.content || e.title,
              source: e.source || 'AI Lab',
              status: e.status || 'pending',
              reviewNote: e.review_note || null,
              created_at: e.created_at
            }));
          setPrompts(promptEngagements);
          
          // Calculate chia progress EXACTLY as Hub page does
          const approvedDeliverables = (progressData.progressRows || []).filter(
            (p: any) => p.deliverable_status === 'approved'
          ).length;
          
          const delivPct = Math.min(approvedDeliverables * 25, 75);
          
          // Engagement calculation - EXACT same values as Portfolio/Hub
          const ENGPCT: Record<string, number> = {
            bookmark: 1,
            note: 1,
            generation: 2,
            prompt: 3,
          };
          
          const engPct = Math.min(
            (engagements || [])
              .filter((e: any) => e.status === 'approved')
              .reduce((a: number, e: any) => a + (ENGPCT[e.kind] || 0), 0),
            25,
          );
          
          const totalProgress = Math.min(delivPct + engPct, 100);
          setActualChiaProgress(totalProgress);
          
          console.log('[ClientProfile] Chia progress calculated:', {
            approvedDeliverables,
            delivPct,
            engPct,
            totalProgress
          });
        }
      } catch (err) {
        console.error('Failed to load engagement counts:', err);
      }
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
      const envBookmarks = await fetchUserBookmarks('environmental');
      
      // Load Library resources
      if (libBookmarks.length === 0) {
        setBookmarkedResources([]);
      } else {
        const libIds = libBookmarks.map((b: any) => b.item_id);
        const res = await fetch('/api/public/library-resources');
        const data = await res.json();
        if (data.resources) {
          const matched = data.resources.filter((r: any) => libIds.includes(r.id));
          // Attach status and review_note from bookmark engagement records
          const withStatus = matched.map((r: any) => {
            const bookmark = libBookmarks.find((b: any) => b.item_id === r.id);
            return {
              ...r,
              bookmarkStatus: bookmark?.status || 'approved', // Default to approved for old bookmarks
              reviewNote: bookmark?.review_note || null
            };
          });
          setBookmarkedResources(withStatus);
        }
      }

      // Load Workforce resources - now using engagement system
      // Separate job bookmarks from other workforce bookmarks
      if (wfBookmarks.length === 0) {
        setBookmarkedWorkforce([]);
        setBookmarkedJobs([]);
      } else {
        // Workforce bookmarks are now stored as engagements, so we can get them directly
        const workforceItems: any[] = [];
        const jobItems: any[] = [];
        
        wfBookmarks.forEach((b: any) => {
          // Check if this is a job bookmark (title starts with "Job:")
          const isJob = b.title?.startsWith('Job:');
          
          const item = {
            id: b.id || b.item_id,
            title: b.title || 'Workforce Resource',
            url: b.item_id,
            source: isJob ? 'Quest Board' : 'Workforce Pathways',
            bookmarkStatus: b.status || 'approved',
            reviewNote: b.review_note || null,
            isJob
          };
          
          if (isJob) {
            jobItems.push(item);
          } else {
            workforceItems.push(item);
          }
        });
        
        setBookmarkedWorkforce(workforceItems);
        setBookmarkedJobs(jobItems);
      }
      
      // Load Environmental bookmarks
      if (envBookmarks.length === 0) {
        setBookmarkedEnvironmental([]);
      } else {
        const envItems = envBookmarks.map((b: any) => ({
          id: b.id || b.item_id,
          title: b.title?.replace(/^Field Note:\s*/, '') || 'Field Note',
          url: b.item_id,
          source: 'Environmental Literacy',
          bookmarkStatus: b.status || 'approved',
          reviewNote: b.review_note || null
        }));
        setBookmarkedEnvironmental(envItems);
      }
      
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsFetchingResources(false);
    }
  }, []);

  // Load workforce pathway picks
  const loadWorkforcePicks = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingWorkforcePicks(true);
    try {
      const picks = await fetchUserPicks(user.id);
      setWorkforcePicks(picks || []);
    } catch (error) {
      console.error('Failed to load workforce picks:', error);
    } finally {
      setLoadingWorkforcePicks(false);
    }
  }, [user?.id]);

  // Load workshop character and certificate settings (eligibility is based on actualChiaProgress state)
  const loadWorkshopData = useCallback(async () => {
    if (!activeCohortId) return;
    
    try {
      // Fetch workshop progress data to get character info
      const progressRes = await fetch('/api/workshops/progress');
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const character = progressData.character || null;
        setWorkshopCharacter(character);
        
        // Fetch certificate settings if eligible (100% chia progress)
        if (actualChiaProgress >= 100) {
          try {
            const certResponse = await fetch(`/api/workshops/${activeCohortId}/certificate-settings`);
            if (certResponse.ok) {
              const settings = await certResponse.json();
              setCertSettings({
                certOrg: settings.certOrg || 'StewardWorks',
                certFacilitator: settings.certFacilitator || 'Marisol Vega',
                certFacTitle: settings.certFacTitle || 'Program Director',
                certSponsor: settings.certSponsor || 'Dr. Jane Smith',
                certSponsorOrg: settings.certSponsorOrg || 'SDSU Research Foundation',
                certMessage: settings.certMessage || ''
              });
            }
          } catch (e) {
            console.error('Failed to fetch certificate settings:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workshop data:', error);
    }
  }, [activeCohortId, actualChiaProgress]);

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
      loadBookmarks();
      loadWorkforcePicks();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user, loadProfile, loadBookmarks, loadWorkforcePicks]);

  // Load workshop data when cohort ID is available
  useEffect(() => {
    if (activeCohortId) {
      loadWorkshopData();
    }
  }, [activeCohortId, loadWorkshopData]);

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

  const startEditing = (field: 'dream_job' | 'learning_style' | 'full_name' | 'why_here' | 'community_serve', currentValue: any) => {
    setEditingField(field);
    if (field === 'learning_style') {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      setTempMultiValue(currentArray);
      const hasCustom = currentArray.some((v: string) => !learningStyleOptions.includes(v));
      setOtherValue(hasCustom ? currentArray.find((v: string) => !learningStyleOptions.includes(v)) || '' : '');
    } else {
      let val = currentValue || '';
      if (field === 'dream_job') {
        if (val && !dreamJobOptions.includes(val)) {
          setTempValue("Other (please describe)");
          setOtherValue(val);
        } else {
          setTempValue(val);
          setOtherValue('');
        }
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
      } else {
        const errorData = await res.json();
        setToast(`✗ Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setToast('✗ Network error while saving');
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
      } else {
        const errorData = await res.json();
        setToast(`✗ Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setToast('✗ Network error while saving');
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

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      setToast('⚠ Please enter both title and content');
      return;
    }
    
    if (!activeCohortId) {
      setToast('⚠ Unable to save note. Please refresh the page');
      return;
    }
    
    setIsSaving(true);
    try {
      await addEngagement(activeCohortId, 'note', noteTitle.trim(), 'Profile', '', noteContent.trim());
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setIsAddingNote(false);
      
      // Reload profile to get updated notes
      await loadProfile();
      
      setToast('📝 Note saved · pending admin approval');
    } catch (error: any) {
      console.error('Failed to add note:', error);
      setToast('✗ Failed to save note. Please try again');
    } finally {
      setIsSaving(false);
    }
  };

  // Certificate download handler - based on chia progress (100% = eligible)
  const handleDownloadCertificate = async () => {
    if (!certificateEligible || !profile) return;
    
    setIsDownloadingPDF(true);
    try {
      const playerName = profile.full_name || user?.fullName || 'Steward';
      const characterKey = workshopCharacter?.character_key || 'steward';
      const accent = workshopCharacter?.accent_color || '#ffd23f';
      
      // Build character sprite URI if we have a character
      let characterSpriteUri = '';
      if (workshopCharacter) {
        try {
          const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite');
          characterSpriteUri = buildSpriteUri(
            characterKey,
            accent,
            {
              gear: workshopCharacter.gear || 'none',
              outfit: workshopCharacter.outfit || 'plain'
            }
          );
        } catch (e) {
          console.error('Failed to build sprite URI:', e);
        }
      }

      // Call the certificate PDF API
      const response = await fetch('/api/certificate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          characterKey,
          certOrg: certSettings.certOrg,
          certFacilitator: certSettings.certFacilitator,
          certFacTitle: certSettings.certFacTitle,
          certSponsor: certSettings.certSponsor,
          certSponsorOrg: certSettings.certSponsorOrg,
          certMessage: certSettings.certMessage,
          deliverables: [
            { title: 'DAY 1 DELIVERABLE', url: '' },
            { title: 'DAY 2 DELIVERABLE', url: '' },
            { title: 'DAY 3 DELIVERABLE', url: '' }
          ],
          characterSpriteUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast('📜 Certificate downloaded!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setToast('✗ Failed to download certificate. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Helper to get user's answer label for a pick
  const getAnswerLabel = (pick: any, pathwayId: string, stopId: string) => {
    if (pick.custom_answer) return pick.custom_answer;
    if (pick.option_id) {
      const quizData = (QUIZZES as any)[pathwayId]?.[stopId];
      if (quizData?.options) {
        const option = quizData.options.find((o: any) => o.id === pick.option_id);
        return option?.label || pick.option_id;
      }
    }
    return 'No answer';
  };

  if (loading && !profile) return null;

  const domain = (u: string) => {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#efe4d2,#e0cdb4)', fontFamily: '"Exo", sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 26px 66px' }}>
        <button onClick={() => router.push('/hub')} style={{ background: '#21282E', border: 'none', borderRadius: '10px', padding: '9px 15px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', color: '#FEFAE0', marginBottom: '22px' }}>← Back to hub</button>

        {/* HEADER */}
        <div style={{ position: 'relative', borderRadius: '24px', background: 'linear-gradient(135deg,#2c3742,#3f5460)', boxShadow: '0 18px 40px rgba(0,0,0,.22)', color: '#FEFAE0', marginBottom: '22px' }}>
          <div style={{ height: '78px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', background: 'linear-gradient(120deg,#DB9B2F,#A27532 55%,#417C98)', opacity: .92 }}></div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingField === 'full_name' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input value={tempValue} onChange={(e) => setTempValue(e.target.value)} autoFocus style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1, background: 'transparent', border: '1px solid rgba(254,250,224,.3)', color: '#FEFAE0', borderRadius: '4px', padding: '0 8px', width: '100%', maxWidth: '300px' }} />
                      <button onClick={handleSaveField} disabled={isSaving} style={{ background: '#417C98', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? '...' : 'Save'}</button>
                      <button onClick={() => setEditingField(null)} style={{ background: 'transparent', border: 'none', color: '#FEFAE0', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1 }}>{profile?.full_name || user?.fullName || 'Steward Candidate'}</div>
                      <button onClick={() => startEditing('full_name', profile?.full_name || user?.fullName)} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.6)', cursor: 'pointer', padding: 0 }}><span style={{ fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>Edit</span></button>
                    </>
                  )}
                </div>
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
                <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1 }}>{actualChiaProgress}%</div>
              </div>
            </div>
                 {/* Onboarding Answers / Editing */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(206px,1fr))', gap: '11px', marginTop: '22px' }}>
              
              {/* Why I'm Here Card */}
              <div style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>WHY I'M HERE</span>
                  {editingField !== 'why_here' && (
                    <button onClick={() => startEditing('why_here', profile?.why_here)} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                {editingField === 'why_here' ? (
                  <div style={{ background: '#3f5460', borderRadius: '8px', padding: '10px', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.16)' }}>
                    <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} autoFocus style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(254,250,224,.2)', color: '#FEFAE0', borderRadius: '4px', fontSize: '12px', marginBottom: '8px', minHeight: '60px', fontFamily: 'inherit' }} placeholder="Why are you here?" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveField} disabled={isSaving} style={{ flex: 1, background: '#FEFAE0', color: '#2c3742', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingField(null)} style={{ background: 'transparent', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.3)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0', opacity: profile?.why_here ? 1 : 0.6 }}>
                    {profile?.why_here || 'Add why you are here...'}
                  </div>
                )}
              </div>

              {/* Learning Style Card */}
              <div className="custom-dropdown-container" style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>LEARNING STYLE</span>
                  {openDropdown !== 'learning_style' && (
                    <button onClick={() => {
                      startEditing('learning_style', profile?.learning_style);
                      setOpenDropdown('learning_style');
                    }} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                
                <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>{displayLearningStyle}</div>

                {openDropdown === 'learning_style' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#3f5460', borderRadius: '8px', padding: '10px', color: '#FEFAE0', boxShadow: '0 10px 25px rgba(0,0,0,.3)', marginTop: '4px', border: '1px solid rgba(254,250,224,.16)' }}>
                    {learningStyleOptions.map(opt => {
                      const isSelected = tempMultiValue.includes(opt);
                      const isOther = opt === "Other (please describe)";
                      return (
                        <div key={opt} style={{ marginBottom: '6px' }}>
                          <button onClick={() => handleMultiSelectToggle(opt)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: isSelected ? 'rgba(254,250,224,.1)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Exo", sans-serif', fontSize: '13px', fontWeight: isSelected ? 700 : 400, color: '#FEFAE0' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: isSelected ? '1.5px solid #FEFAE0' : '1.5px solid rgba(254,250,224,.5)', background: isSelected ? '#FEFAE0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <Check size={10} color="#3f5460" />}
                            </div>
                            {opt}
                          </button>
                          {isOther && isSelected && (
                            <input value={otherValue} onChange={e => setOtherValue(e.target.value)} placeholder="Please describe..." style={{ width: '100%', padding: '6px 8px', marginTop: '4px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(254,250,224,.2)', borderRadius: '4px', fontSize: '12px', color: '#FEFAE0' }} />
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={async () => {
                        await handleSaveField();
                        setOpenDropdown(null);
                      }} disabled={isSaving} style={{ flex: 1, background: '#FEFAE0', color: '#2c3742', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => {
                        setEditingField(null);
                        setOpenDropdown(null);
                      }} style={{ background: 'transparent', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.3)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
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
                  <div style={{ background: '#3f5460', borderRadius: '8px', padding: '10px', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.16)' }}>
                     <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Other (please describe)</div>
                     <input value={otherValue} onChange={e => setOtherValue(e.target.value)} autoFocus style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(254,250,224,.2)', borderRadius: '4px', fontSize: '12px', marginBottom: '8px', color: '#FEFAE0' }} />
                     <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveField} disabled={isSaving || !otherValue} style={{ flex: 1, background: '#FEFAE0', color: '#2c3742', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingField(null)} style={{ background: 'transparent', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.3)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>{displayDreamJob}</div>
                )}
                {openDropdown === 'dream_job' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#3f5460', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,.3)', marginTop: '4px', overflow: 'hidden', border: '1px solid rgba(254,250,224,.16)' }}>
                    {dreamJobOptions.map(opt => (
                      <div key={opt} onClick={() => handleCustomSelect(opt, 'dream_job')} style={{ padding: '10px 14px', fontSize: '13px', color: '#FEFAE0', borderBottom: '1px solid rgba(254,250,224,.1)', cursor: 'pointer' }} className="hover:bg-white/10 font-medium">
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Community I Serve Card */}
              <div style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>COMMUNITY I SERVE</span>
                  {editingField !== 'community_serve' && (
                    <button onClick={() => startEditing('community_serve', profile?.community_serve)} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                {editingField === 'community_serve' ? (
                  <div style={{ background: '#3f5460', borderRadius: '8px', padding: '10px', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.16)' }}>
                    <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} autoFocus style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(254,250,224,.2)', color: '#FEFAE0', borderRadius: '4px', fontSize: '12px', marginBottom: '8px', minHeight: '60px', fontFamily: 'inherit' }} placeholder="What community do you serve?" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveField} disabled={isSaving} style={{ flex: 1, background: '#FEFAE0', color: '#2c3742', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingField(null)} style={{ background: 'transparent', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.3)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0', opacity: profile?.community_serve ? 1 : 0.6 }}>
                    {profile?.community_serve || 'Add the community you serve...'}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* MY DELIVERABLES (from Pilot Workshops) */}
        {workshopDays.length > 0 && (
          <div style={{ background: '#FEFAE0', border: '2px solid #DB9B2F', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 12px 26px rgba(0,0,0,.08)', marginBottom: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.18em', color: '#8a5a2e' }}>⛃ MY DELIVERABLES</span>
              <span style={{ fontSize: '13px', color: '#7a5a3a' }}>
                {progressRows.filter((p: any) => p.deliverable_status === 'approved').length}/3 approved · {Math.min(progressRows.filter((p: any) => p.deliverable_status === 'approved').length * 25, 75)}%/75%
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {[1, 2, 3].map(dayNum => {
                const day = workshopDays.find((d: any) => d.day_number === dayNum);
                const progress = day ? progressRows.find((p: any) => p.workshop_day_id === day.id) : null;
                const status = progress?.deliverable_status || 'not_submitted';
                const pill = STATUS_PILL[status] || STATUS_PILL.not_submitted;
                const submission = day ? submissions.find((s: any) => s.workshop_day_id === day.id) : null;
                const rawLink = submission?.submission_text || submission?.file_storage_path || submission?.external_video_url || '';
                const linkHref = rawLink ? (/^https?:/i.test(rawLink) ? rawLink : 'https://' + rawLink) : '';

                return (
                  <div
                    key={dayNum}
                    style={{
                      border: '2px solid rgba(33,40,46,.12)',
                      borderRadius: '14px',
                      padding: '16px',
                      background: status === 'approved' ? 'rgba(46,85,52,.04)' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Day Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.1em', color: '#DB9B2F', fontWeight: 700 }}>
                        DAY 0{dayNum}
                      </span>
                      <span
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '8px',
                          letterSpacing: '.06em',
                          color: pill.color,
                          background: `${pill.color}18`,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pill.label}
                      </span>
                    </div>

                    {/* Day Title */}
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#3a2412', lineHeight: 1.3 }}>
                      {day?.deliverable_title || day?.title || `Day ${dayNum} Deliverable`}
                    </div>

                    {/* Deliverable Link */}
                    <div style={{ borderTop: '1px dashed rgba(33,40,46,.12)', paddingTop: '10px', marginTop: 'auto' }}>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '8px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '6px' }}>
                        ✦ DELIVERABLE LINK
                      </div>
                      {linkHref ? (
                        <a
                          href={linkHref}
                          target="_blank"
                          rel="noreferrer"
                          title="Open deliverable"
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#417C98',
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                            lineHeight: 1.3,
                          }}
                        >
                          ⤢ {rawLink}
                        </a>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#a8a090', opacity: 0.8 }}>
                          — no link submitted yet —
                        </div>
                      )}
                    </div>

                    {/* Instructor Note (if any) */}
                    {progress?.review_note && (
                      <div style={{ borderTop: '1px dashed rgba(33,40,46,.12)', paddingTop: '10px' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '8px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '6px' }}>
                          ✦ INSTRUCTOR NOTE
                        </div>
                        <div style={{ fontSize: '12px', color: '#5a4a3a', lineHeight: 1.4, wordWrap: 'break-word' }}>
                          {progress.review_note}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ENGAGEMENT COUNTER */}
        <div style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.12)', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 12px 26px rgba(0,0,0,.08)', marginBottom: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.18em', color: '#8a5a2e' }}>REWARDS FEEDING YOUR CHIA</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#356074' }}>{engagementProgress}% <span style={{ fontSize: '12px', fontWeight: 400, color: '#8a6a4a' }}>/ 25% cap</span></span>
          </div>
          <div style={{ height: '12px', background: 'rgba(33,40,46,.08)', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ width: `${Math.min((engagementProgress / 25) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#417C98,#65a6c4)' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
            {engagementCounts.bookmarks > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#417C98' }}></span>
                <span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Bookmark saved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x{engagementCounts.bookmarks}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.bookmarks * 1}%</span>
              </div>
            )}
            {engagementCounts.notes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#A27532' }}></span>
                <span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Note created</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x{engagementCounts.notes}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.notes * 1}%</span>
              </div>
            )}
            {engagementCounts.prompts > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#DB9B2F' }}></span>
                <span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Prompt saved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x{engagementCounts.prompts}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.prompts * 3}%</span>
              </div>
            )}
            {engagementCounts.generations > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#2E5534' }}></span>
                <span style={{ flex: 1, fontSize: '13px', color: '#3a2412' }}>Generation created</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a' }}>x{engagementCounts.generations}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.generations * 2}%</span>
              </div>
            )}
            {engagementCounts.bookmarks === 0 && engagementCounts.notes === 0 && engagementCounts.prompts === 0 && engagementCounts.generations === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#8a6a4a', fontSize: '13px' }}>
                No approved engagements yet. Submit work in the Portfolio to earn rewards!
              </div>
            )}
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
              <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#417C98', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>BOOKMARK</span>
                  {b.bookmarkStatus === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {b.bookmarkStatus === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {b.bookmarkStatus === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, cursor: 'pointer' }} onClick={() => window.open(`/hub/library/${b.id}`, '_blank')}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#7a5a3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.external_url || b.url)}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {b.reviewNote && (
                      <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#A27532' : '#FDF3E0', border: '1.5px solid #A27532', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#A27532', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                        {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                      </button>
                    )}
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#417C98', cursor: 'pointer' }} onClick={() => window.open(`/hub/library/${b.id}`, '_blank')}>Open →</span>
                  </div>
                </div>
                {expandedNoteId === b.id && b.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(162,117,50,.08)', border: '1px solid rgba(162,117,50,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{b.reviewNote}</div>
                  </div>
                )}
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
              <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#2E5534', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>VAULT</span>
                  {b.bookmarkStatus === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {b.bookmarkStatus === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {b.bookmarkStatus === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, cursor: 'pointer' }} onClick={() => window.open(`/hub/workforce-pathways`, '_blank')}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#7a5a3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{domain(b.url)} {b.source ? `- ${b.source}` : ''}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {b.reviewNote && (
                      <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#2E5534' : '#F0F8F4', border: '1.5px solid #2E5534', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#2E5534', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                        {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                      </button>
                    )}
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#2E5534', cursor: 'pointer' }} onClick={() => window.open(`/hub/workforce-pathways`, '_blank')}>View →</span>
                  </div>
                </div>
                {expandedNoteId === b.id && b.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(162,117,50,.08)', border: '1px solid rgba(162,117,50,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{b.reviewNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* JOBS QUEST */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>JOBS QUEST</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{bookmarkedJobs.length}</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>saved from the quest board</span>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your job quests...</div>
        ) : bookmarkedJobs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            No job quests saved yet. Visit <Link href="/hub/workforce-pathways" style={{ color: '#417C98', textDecoration: 'underline' }}>Workforce Pathways</Link> and bookmark jobs from the Quest Board!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px', marginBottom: '30px' }}>
            {bookmarkedJobs.map(b => (
              <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff6a2e', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>JOB</span>
                  {b.bookmarkStatus === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {b.bookmarkStatus === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {b.bookmarkStatus === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3 }}>{b.title.replace(/^Job:\s*/, '')}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#7a5a3a' }}>{b.source}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {b.reviewNote && (
                      <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#ff6a2e' : '#FFF0E6', border: '1.5px solid #ff6a2e', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#ff6a2e', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                        {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                      </button>
                    )}
                    {b.url && (
                      <a href={b.url} target="_blank" rel="noopener" style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#ff6a2e', textDecoration: 'none' }}>Apply →</a>
                    )}
                  </div>
                </div>
                {expandedNoteId === b.id && b.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,106,46,.08)', border: '1px solid rgba(255,106,46,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{b.reviewNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ENVIRONMENTAL LITERACY */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#417C98' }}>FIELD NOTES</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#6a9ab5' }}>{bookmarkedEnvironmental.length}</span>
          <span style={{ fontSize: '12px', color: '#5a8a9a' }}>saved from Environmental Literacy</span>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#5a8a9a' }}>Loading your field notes...</div>
        ) : bookmarkedEnvironmental.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#5a8a9a', background: '#E8F4F8', border: '1.5px dashed rgba(65,124,152,.2)', borderRadius: '13px', marginBottom: '30px' }}>
            No field notes saved yet. Explore the <Link href="/hub/environmental-literacy" style={{ color: '#417C98', textDecoration: 'underline' }}>Environmental Literacy</Link> field desk and bookmark field notes!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px', marginBottom: '30px' }}>
            {bookmarkedEnvironmental.map(b => (
              <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#E8F4F8', border: '1.5px solid rgba(65,124,152,.15)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#417C98', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>FIELD NOTE</span>
                  {b.bookmarkStatus === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {b.bookmarkStatus === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {b.bookmarkStatus === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#2a4a5a', fontSize: '15px', lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#5a8a9a' }}>{b.source}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {b.reviewNote && (
                      <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === b.id ? null : b.id); }} style={{ background: expandedNoteId === b.id ? '#417C98' : '#d0e8f0', border: '1.5px solid #417C98', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === b.id ? '#fff' : '#417C98', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                        {expandedNoteId === b.id ? '✕ NOTE' : '📝 NOTE'}
                      </button>
                    )}
                    <Link href="/hub/environmental-literacy" style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#417C98', textDecoration: 'none' }}>Open →</Link>
                  </div>
                </div>
                {expandedNoteId === b.id && b.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(65,124,152,.08)', border: '1px solid rgba(65,124,152,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#417C98', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#2a4a5a' }}>{b.reviewNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* GENERATIONS */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>GENERATIONS</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{generations.length}</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>created in the AI Lab</span>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your creations...</div>
        ) : generations.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            No generations yet. Create AI art in the <Link href="/hub/ai-lab" style={{ color: '#417C98', textDecoration: 'underline' }}>AI Lab</Link>!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px', marginBottom: '30px' }}>
            {generations.map(g => {
              // Check if URL is an image based on extension or try to detect
              const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i;
              const isImageUrl = g.url && imageExtensions.test(g.url);
              
              // Derive type tag from URL
              const typeTag = g.url?.match(/\.(mp4|webm|mov)/i)
                ? 'VIDEO'
                : g.url?.match(/\.(mp3|wav|ogg)/i)
                  ? 'AUDIO'
                  : isImageUrl ? 'IMAGE' : 'LINK';
              
              return (
                <div key={g.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '0', boxShadow: '0 8px 18px rgba(0,0,0,.06)', overflow: 'hidden' }}>
                  {/* Image Preview - Full width at top */}
                  {isImageUrl && g.url && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(69,214,255,.08),rgba(116,240,160,.08))', position: 'relative' }}>
                      <img 
                        src={g.url} 
                        alt={g.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                        onClick={() => window.open(g.url, '_blank')}
                        onError={(e) => { 
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7a5a3a;font-size:32px;">🖼️</div>';
                          }
                        }} 
                      />
                    </div>
                  )}
                  
                  {/* Content Padding */}
                  <div style={{ padding: '15px 16px' }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: 'linear-gradient(135deg,#45d6ff,#74f0a0)', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>GENERATION</span>
                      {g.status === 'pending' && (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                      )}
                      {g.status === 'approved' && (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                      )}
                      {g.status === 'rejected' && (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '7px' }}>{g.title}</div>
                    
                    {/* Type & Source */}
                    <div style={{ fontSize: '11px', color: '#7a5a3a', marginBottom: '10px' }}>
                      {typeTag === 'IMAGE' && '🖼️ IMAGE'}
                      {typeTag === 'VIDEO' && '🎥 VIDEO'}
                      {typeTag === 'AUDIO' && '🎵 AUDIO'}
                      {typeTag === 'LINK' && '🔗 LINK'}
                      {' · '}{g.source}
                    </div>
                    
                    {/* Link Display - if not an image, show the link */}
                    {!isImageUrl && g.url && (
                      <div style={{ padding: '10px', background: 'rgba(69,214,255,.06)', border: '1px solid rgba(69,214,255,.15)', borderRadius: '6px', marginBottom: '10px' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#417C98', marginBottom: '4px' }}>SUBMITTED LINK</div>
                        <a 
                          href={g.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '12px', color: '#45d6ff', wordBreak: 'break-all', lineHeight: 1.4, textDecoration: 'none' }}
                          className="hover:underline"
                        >
                          {g.url}
                        </a>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {g.reviewNote && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === g.id ? null : g.id); }} 
                          style={{ 
                            background: expandedNoteId === g.id ? '#45d6ff' : '#E8F8FF', 
                            border: '1.5px solid #45d6ff', 
                            fontFamily: '"DM Mono", monospace', 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: expandedNoteId === g.id ? '#fff' : '#45d6ff', 
                            cursor: 'pointer', 
                            padding: '5px 10px', 
                            borderRadius: '6px', 
                            letterSpacing: '.06em' 
                          }}
                        >
                          {expandedNoteId === g.id ? '✕ NOTE' : '📝 NOTE'}
                        </button>
                      )}
                      {g.url && (
                        <span 
                          style={{ 
                            fontFamily: '"DM Mono", monospace', 
                            fontSize: '11px', 
                            color: '#45d6ff', 
                            cursor: 'pointer', 
                            marginLeft: g.reviewNote ? '0' : 'auto' 
                          }} 
                          onClick={() => window.open(g.url, '_blank')}
                        >
                          Open →
                        </span>
                      )}
                    </div>
                    
                    {/* Admin Note Expanded */}
                    {expandedNoteId === g.id && g.reviewNote && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(69,214,255,.08)', border: '1px solid rgba(69,214,255,.2)', borderRadius: '8px' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#417C98', marginBottom: '5px' }}>ADMIN NOTE</div>
                        <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{g.reviewNote}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NOTES & SAVED PROMPTS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>NOTES & SAVED PROMPTS</span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{notes.length + prompts.length}</span>
            <span style={{ fontSize: '12px', color: '#8a6a4a' }}>from workshops & the AI Lab</span>
          </div>
          <button onClick={() => setIsAddingNote(true)} style={{ background: '#3f5460', color: '#FEFAE0', border: 'none', borderRadius: '9px', padding: '9px 16px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px' }}>+ New note</button>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading...</div>
        ) : (notes.length === 0 && prompts.length === 0) ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px' }}>
            No notes or prompts yet. Add them from the <Link href="/hub/pilot-workshops" style={{ color: '#417C98', textDecoration: 'underline' }}>Workshops</Link> or <Link href="/hub/ai-lab" style={{ color: '#417C98', textDecoration: 'underline' }}>AI Lab</Link>!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
            {/* Notes */}
            {notes.map(n => (
              <div key={n.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#A27532', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>NOTE</span>
                  {n.status === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {n.status === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {n.status === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '8px' }}>{n.title}</div>
                
                <div style={{ fontSize: '13px', color: '#5a4a3a', lineHeight: 1.5, marginBottom: '10px', maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.content}
                </div>
                
                <div style={{ fontSize: '11px', color: '#7a5a3a', marginBottom: '10px' }}>
                  📝 {n.source}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  {n.reviewNote && (
                    <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === n.id ? null : n.id); }} style={{ background: expandedNoteId === n.id ? '#A27532' : '#FDF3E0', border: '1.5px solid #A27532', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === n.id ? '#fff' : '#A27532', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                      {expandedNoteId === n.id ? '✕ NOTE' : '📝 NOTE'}
                    </button>
                  )}
                </div>
                
                {expandedNoteId === n.id && n.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(162,117,50,.08)', border: '1px solid rgba(162,117,50,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{n.reviewNote}</div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Prompts */}
            {prompts.map(p => (
              <div key={p.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#DB9B2F', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>PROMPT</span>
                  {p.status === 'pending' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                  )}
                  {p.status === 'approved' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                  )}
                  {p.status === 'rejected' && (
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                  )}
                </div>
                
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '8px' }}>{p.title}</div>
                
                <div style={{ fontSize: '13px', color: '#5a4a3a', lineHeight: 1.5, marginBottom: '10px', maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.content}
                </div>
                
                <div style={{ fontSize: '11px', color: '#7a5a3a', marginBottom: '10px' }}>
                  ⌘ {p.source}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  {p.reviewNote && (
                    <button onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === p.id ? null : p.id); }} style={{ background: expandedNoteId === p.id ? '#DB9B2F' : '#FFF8E8', border: '1.5px solid #DB9B2F', fontFamily: '"DM Mono", monospace', fontSize: '10px', fontWeight: 700, color: expandedNoteId === p.id ? '#fff' : '#DB9B2F', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.06em' }}>
                      {expandedNoteId === p.id ? '✕ NOTE' : '📝 NOTE'}
                    </button>
                  )}
                </div>
                
                {expandedNoteId === p.id && p.reviewNote && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(219,155,47,.08)', border: '1px solid rgba(219,155,47,.2)', borderRadius: '8px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#8a6a2e', marginBottom: '5px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#3a2412' }}>{p.reviewNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WORKFORCE PATHWAY ANSWERS */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '30px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#6B4A2A' }}>YOUR PATHWAY ANSWERS</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#a8845a' }}>{workforcePicks.length}</span>
          <span style={{ fontSize: '12px', color: '#8a6a4a' }}>from Workforce Pathways</span>
        </div>
        
        {loadingWorkforcePicks ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your pathway answers...</div>
        ) : workforcePicks.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            No pathway answers yet. Complete your journey in <Link href="/hub/workforce-pathways" style={{ color: '#6B4A2A', textDecoration: 'underline' }}>Workforce Pathways</Link>!
          </div>
        ) : (
          <div style={{ marginBottom: '30px' }}>
            {PATHWAYS.map((pathway: any) => {
              const pathwayPicks = workforcePicks.filter((p: any) => p.pathway_id === pathway.id);
              if (pathwayPicks.length === 0) return null;
              
              const pathwayColor = pathway.id === 'creator' ? '#ff6a2e' : '#43e97b';
              
              return (
                <div key={pathway.id} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 14px', background: pathway.id === 'creator' ? 'rgba(255,106,46,.08)' : 'rgba(67,233,123,.08)', borderLeft: `4px solid ${pathwayColor}`, borderRadius: '0 8px 8px 0' }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.14em', color: pathwayColor, fontWeight: 700 }}>{pathway.name.toUpperCase()}</span>
                    <span style={{ fontSize: '12px', color: '#7a5a3a' }}>· {pathwayPicks.length} answers</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
                    {pathway.stops.map((stop: any) => {
                      const pick = pathwayPicks.find((p: any) => p.stop_id === stop.id);
                      if (!pick) return null;
                      
                      const quizData = (QUIZZES as any)[pathway.id]?.[stop.id];
                      const answerLabel = getAnswerLabel(pick, pathway.id, stop.id);
                      
                      return (
                        <div key={stop.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: pathwayColor, color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>{stop.name.toUpperCase()}</span>
                            {stop.optional && (
                              <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '8px', letterSpacing: '.1em', background: 'rgba(0,0,0,.1)', color: '#7a5a3a', padding: '2px 6px', borderRadius: '10px' }}>OPTIONAL</span>
                            )}
                          </div>
                          
                          <div style={{ fontSize: '12px', color: '#7a5a3a', marginBottom: '8px', lineHeight: 1.4 }}>
                            {quizData?.prompt || 'Your answer'}
                          </div>
                          
                          <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, padding: '10px 12px', background: 'rgba(107,74,42,.06)', borderRadius: '8px', border: '1px solid rgba(107,74,42,.1)' }}>
                            {answerLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CERTIFICATE SECTION */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#2E5534' }}>CERTIFICATE</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#4a8a5a' }}>{actualChiaProgress}% complete</span>
        </div>
        
        {certificateEligible ? (
          <div style={{ padding: '24px', background: 'linear-gradient(135deg,rgba(46,85,52,.08),rgba(116,240,160,.06))', border: '2px solid rgba(46,85,52,.2)', borderRadius: '16px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#2E5534,#4a8a5a)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📜</div>
              <div>
                <div style={{ fontWeight: 700, color: '#2E5534', fontSize: '17px' }}>Congratulations!</div>
                <div style={{ fontSize: '13px', color: '#4a6a4a' }}>You've reached 100% and earned your certificate.</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCertPreview(true)}
                style={{ background: '#FEFAE0', color: '#2E5534', border: '2px solid #2E5534', borderRadius: '10px', padding: '11px 20px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', fontWeight: 700 }}
              >
                ◆ PREVIEW CERTIFICATE
              </button>
              <button
                onClick={handleDownloadCertificate}
                disabled={isDownloadingPDF}
                style={{ background: isDownloadingPDF ? '#9aa596' : '#2E5534', color: '#FEFAE0', border: 'none', borderRadius: '10px', padding: '11px 20px', cursor: isDownloadingPDF ? 'not-allowed' : 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px', letterSpacing: '.06em', fontWeight: 700, boxShadow: isDownloadingPDF ? 'none' : '0 8px 18px -8px rgba(46,85,52,.7)' }}
              >
                {isDownloadingPDF ? '⏳ GENERATING...' : '⛊ DOWNLOAD CERTIFICATE'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#7a5a3a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px', marginBottom: '30px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontWeight: 600, color: '#3a2412', marginBottom: '8px' }}>Certificate Locked</div>
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
              Reach 100% chia progress in <Link href="/hub/pilot-workshops" style={{ color: '#6B4A2A', textDecoration: 'underline' }}>Pilot Workshops</Link> to unlock your certificate.
              <br />
              <span style={{ fontSize: '12px', color: '#9a7a5a' }}>Current progress: {actualChiaProgress}%</span>
            </div>
          </div>
        )}

      </div>
      
      {/* Certificate Preview Modal */}
      {showCertPreview && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} 
          onClick={() => setShowCertPreview(false)}
        >
          <div style={{ position: 'relative', background: 'linear-gradient(160deg,#fdf8eb,#f7eed8)', borderRadius: '8px', maxWidth: '800px', width: '100%', padding: '40px', boxShadow: '0 30px 80px rgba(0,0,0,.4)', border: '3px solid #c9a24a' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowCertPreview(false)} 
              title="Close certificate" 
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3, fontFamily: '"DM Mono", monospace' }}
            >
              ✕ CLOSE
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>Pilot Workshops · The Steward's Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, color: '#3a2412', margin: '12px 0 6px', fontFamily: '"Exo", sans-serif' }}>
                {profile?.full_name || user?.fullName || 'Steward'}
              </div>
              <div style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: '#5a4626', marginTop: 18, lineHeight: 1.6, maxWidth: 500, margin: '18px auto 0' }}>
                {certSettings.certMessage || 'has successfully completed the Pilot Workshops program, demonstrating commitment to digital stewardship and creative storytelling.'}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center', marginTop: 40 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#8a6a2a', marginBottom: 4 }}>{certSettings.certFacilitator}</div>
                  <div style={{ fontSize: 11, color: '#b89050', fontFamily: '"DM Mono", monospace' }}>{certSettings.certFacTitle}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#8a6a2a', marginBottom: 4 }}>{certSettings.certSponsor}</div>
                  <div style={{ fontSize: 11, color: '#b89050', fontFamily: '"DM Mono", monospace' }}>{certSettings.certSponsorOrg}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', maxWidth: 580, margin: '26px auto 0', fontSize: 11, color: '#8a6a2a', letterSpacing: 1, fontFamily: '"DM Mono", monospace' }}>
                <div>ISSUED {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                <div>CERTIFICATE NO. SW-PW-{Date.now().toString().slice(-4)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Note Modal */}
      {isAddingNote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAddingNote(false)}>
          <div style={{ background: '#FEFAE0', borderRadius: '16px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '2px solid rgba(33,40,46,.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', letterSpacing: '.1em', color: '#3a2412', margin: 0 }}>ADD NEW NOTE</h2>
                <button onClick={() => setIsAddingNote(false)} style={{ background: 'none', border: 'none', color: '#7a5a3a', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </div>
              <p style={{ fontSize: '13px', color: '#7a5a3a', marginTop: '8px', marginBottom: 0 }}>Your note will be submitted for admin approval before appearing in your profile.</p>
            </div>
            
            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '8px' }}>NOTE TITLE *</label>
                <input 
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter a title for your note..."
                  style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '2px solid rgba(33,40,46,.15)', borderRadius: '8px', fontSize: '15px', color: '#3a2412', outline: 'none' }}
                  autoFocus
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '8px' }}>NOTE CONTENT *</label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note, reflection, or observation..."
                  style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '2px solid rgba(33,40,46,.15)', borderRadius: '8px', fontSize: '14px', color: '#3a2412', outline: 'none', minHeight: '120px', fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setIsAddingNote(false)} 
                  style={{ background: 'transparent', border: '2px solid rgba(33,40,46,.2)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#7a5a3a', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddNote}
                  disabled={isSaving || !noteTitle.trim() || !noteContent.trim()}
                  style={{ background: isSaving || !noteTitle.trim() || !noteContent.trim() ? '#ccb89a' : '#3f5460', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, color: '#FEFAE0', cursor: isSaving || !noteTitle.trim() || !noteContent.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <RetroToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
